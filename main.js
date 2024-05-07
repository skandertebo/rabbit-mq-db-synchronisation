const constants = require("./constants");
const mysql = require("mysql2");
const amqp = require("amqplib");
const readline = require("readline");

function validateOfficeName() {
  if (!process.env.OFFICE_NAME) {
    console.log("OFFICE_NAME is required");
    process.exit(1);
  }
  const names = ["bo1", "bo2", "ho"];
  if (!names.includes(process.env.OFFICE_NAME)) {
    console.log("OFFICE_NAME must be one of bo1, bo2, ho");
    process.exit(1);
  }
  return process.env.OFFICE_NAME;
}

function getOfficeConnectionParams() {
  if (process.env.OFFICE_NAME === "bo1") {
    return constants.bo1ConnectionParams;
  } else if (process.env.OFFICE_NAME === "bo2") {
    return constants.bo2ConnectionParams;
  }
  return constants.hoConnectionParams;
}

const officeName = validateOfficeName();
const connectionParams = getOfficeConnectionParams();

let sqlConnection = mysql.createConnection(connectionParams);
const exchangeName = "office";

// Promisifying the connection

async function getDbConnection() {
  async function executeQuery(query) {
    const db = this;
    return new Promise((resolve, reject) => {
      db.query(query, (err, results) => {
        if (err) {
          reject(err);
        }
        resolve(results);
      });
    });
  }
  return new Promise((resolve, reject) => {
    sqlConnection.connect((err) => {
      if (err) {
        reject(err);
      }
      sqlConnection.executeQuery = executeQuery;
      resolve(sqlConnection);
    });
  });
}

async function main() {
  let db = await getDbConnection();
  const connection = await amqp.connect(constants.rabbitMqUrl);
  const channel = await connection.createChannel();
  await channel.assertExchange(exchangeName, "fanout", { durable: true });
  await channel.assertQueue(officeName, { exclusive: true });
  await channel.bindQueue(officeName, exchangeName, "");
  await channel.consume(officeName, async (msg) => {
    const message = msg.content.toString();
    try {
      const json = JSON.parse(message);
      if (json.type === "query") {
        if (!json.query) {
          throw new Error("query is required");
        }
        console.log(`Received query "${json.query}"`);
        const results = await db.executeQuery(json.query);
        console.log(`Query "${json.query}" executed`);
        console.log(results);
        channel.ack(msg);
      }
    } catch (err) {
      const disconnected = await new Promise((resolve) => {
        db.ping((err) => {
          resolve(err);
        });
      });
      if (disconnected) {
        setTimeout(() => {
          channel.reject(msg, true);
        }, 300);
        sqlConnection.destroy();
        console.log("Lost connection to the database. Reconnecting...");
        try {
          sqlConnection = mysql.createConnection(connectionParams);
          db = await getDbConnection();
          console.log("Reconnected to the database.");
        } catch (err) {}
      } else {
        channel.reject(msg, false);
      }
      return;
    }
  });
  console.log(`Connected to RabbitMQ and MySQL for ${officeName}`);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  async function promptUser() {
    rl.question("Enter a query to emit: ", async (query) => {
      const message = JSON.stringify({ type: "query", query });
      channel.publish(exchangeName, "", Buffer.from(message));
      console.log(`Message "${message}" emitted to exchange "${exchangeName}"`);
      promptUser();
    });
  }
  promptUser();
}

main();
