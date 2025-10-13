const { sql, getPool } = require("../../sql-backend/server");

// Lấy account từ database
async function getAccount() {
  const pool = await getPool();
  const result = await pool
    .request()
    .query(
      "SELECT AccountId, Username, Email, Phone, Role, State, ImageUrl FROM Account"
    );
  return result.recordset;
}

module.exports = {
  getAccount,
};
