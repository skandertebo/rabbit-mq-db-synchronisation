// Promisifying the connection

async function getDbConnection(sqlConnection) {
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

module.exports = { getDbConnection };
