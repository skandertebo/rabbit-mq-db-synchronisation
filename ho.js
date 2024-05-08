const mysql = require("mysql2");
const amqp = require("amqplib");
const constants = require("./constants");
const { getDbConnection } = require("./db");
const officeName = "ho";

function getOfficeConnectionParams() {
  return constants.hoConnectionParams;
}

const connectionParams = getOfficeConnectionParams();

let sqlConnection = mysql.createConnection(connectionParams);
const exchangeName = "office";

async function main() {
  let db = await getDbConnection(sqlConnection);
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
      console.log(err);
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
          db = await getDbConnection(sqlConnection);
          console.log("Reconnected to the database.");
        } catch (err) {}
      } else {
        console.log(err);
        channel.reject(msg, false);
      }
      return;
    }
  });
  console.log(`Connected to RabbitMQ and MySQL for ${officeName}`);
}

main();
