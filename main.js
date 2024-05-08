const constants = require("./constants");
const mysql = require("mysql2");
const amqp = require("amqplib");
const { getLatestMigrationQuery } = require("./utils");
const { getDbConnection } = require("./db");

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

async function main() {
  let db = await getDbConnection(sqlConnection);
  const connection = await amqp.connect(constants.rabbitMqUrl);
  const channel = await connection.createChannel();
  await channel.assertExchange(exchangeName, "fanout", { durable: true });
  await channel.assertQueue(officeName, { exclusive: true });
  await channel.bindQueue(officeName, exchangeName, "");

  console.log(`Connected to RabbitMQ and MySQL for ${officeName}`);

  async function publishLatestUpdates() {
    const migrationQuery = getLatestMigrationQuery();
    console.log(`Migration query: ${migrationQuery}`);
    const results = await db.executeQuery(migrationQuery);
    console.log(results);
    let query = "select * from sales";
    if (results.length > 0) {
      query =
        query +
        " where date > '" +
        results[0].date?.toISOString().replace("T", " ").replace("Z", "") +
        "'";
    }
    const res = await db.executeQuery(query);
    if (res.length === 0) {
      console.log("No new data to publish");
      db.end();
      channel.close();
      process.exit(0);
    }
    console.log(res);
    const valuesToInsert = res
      .map((row) => {
        let { id, date, region, product, qty, cost, amt, tax, total } = row;
        date = date.toISOString().replace("T", " ").replace("Z", "");
        return `(${id}, '${date}', '${region}', '${product}', ${qty}, ${cost}, ${amt}, ${tax}, ${total})`;
      })
      .join(", ");
    const insertQuery = `INSERT INTO sales (id, date, region, product, qty, cost, amt, tax, total) VALUES ${valuesToInsert};`;
    const message = JSON.stringify({ type: "query", query: insertQuery });
    console.log(`Message "${message}" emitted to exchange "${exchangeName}"`);
    channel.publish(exchangeName, "", Buffer.from(message));
    const migrationUpdateQuery =
      "INSERT INTO migrations (`date`) VALUES (NOW());";
    await db.executeQuery(migrationUpdateQuery);
    console.log("Migration updated");
    db.end();
    channel.close();
    process.exit(0);
    //channel.publish(exchangeName, "", Buffer.from(message));
    //console.log(`Message "${message}" emitted to exchange "${exchangeName}"`);
  }

  publishLatestUpdates();
}

main();
