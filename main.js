const constants = require("./constants");
const mysql = require("mysql2");
const amqp = require("amqplib");

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
}

function getOfficeConnectionParams() {
  if (process.env.OFFICE_NAME === "bo1") {
    return constants.bo1ConnectionParams;
  } else if (process.env.OFFICE_NAME === "bo2") {
    return constants.bo2ConnectionParams;
  }
  return constants.hoConnectionParams;
}

validateOfficeName();
const connectionParams = getOfficeConnectionParams();

const connection = mysql.createConnection(connectionParams);
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
    connection.connect((err) => {
      if (err) {
        reject(err);
      }
      connection.executeQuery = executeQuery;
      resolve(connection);
    });
  });
}

async function main() {
  const db = await getDbConnection();
  const connection = await amqp.connect(constants.rabbitMqUrl);
  const channel = await connection.createChannel();
  await channel.assertExchange(exchangeName, "fanout", { durable: true });
}

main();
