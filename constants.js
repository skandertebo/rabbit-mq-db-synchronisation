const bo1ConnectionParams = {
  host: "localhost",
  port: 3307,
  user: "root",
  password: "root_password_bo1",
  database: "office",
};

const bo2ConnectionParams = {
  host: "localhost",
  port: 3308,
  user: "root",
  password: "root_password_bo2",
  database: "office",
};

const hoConnectionParams = {
  host: "localhost",
  port: 3309,
  user: "root",
  password: "root_password_head_office",
  database: "office",
};
const rabbitMqUrl = "amqp://localhost";

module.exports = {
  bo1ConnectionParams,
  bo2ConnectionParams,
  hoConnectionParams,
  rabbitMqUrl,
};
