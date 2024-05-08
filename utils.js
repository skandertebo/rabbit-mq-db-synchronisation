function getLatestMigrationQuery() {
  return "SELECT `date` FROM migrations ORDER BY `date` DESC LIMIT 1;";
}

module.exports = { getLatestMigrationQuery };
