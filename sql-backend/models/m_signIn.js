const sql = require("mssql");
const { getPool } = require("../routes/config");

async function checkLogin(dataUser) {
  console.log("🟢 Đang vào hàm checkLogin với:", dataUser);
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("Email", sql.NVarChar, dataUser.Email)
      .input("PasswordHash", sql.NVarChar, dataUser.PasswordHash).query(`
        SELECT * FROM Account 
        WHERE Email = @Email AND PasswordHash = @PasswordHash AND State = 'Active'
      `);

    if (result.recordset.length > 0) {
      return result.recordset[0]; 
    } else {
      return null;
    }
  } catch (err) {
    console.error("Lỗi khi kiểm tra đăng nhập:", err);
    throw err;
  }
}

async function findUserByEmail(email) {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input("Email", sql.NVarChar, email)
            .query('SELECT * FROM Account WHERE Email = @Email');
        
        return result.recordset.length > 0 ? result.recordset[0] : null;
    } catch (err) {
        console.error("Lỗi khi tìm người dùng bằng email trong model:", err);
        throw err;
    }
}

async function lockUserAccount(accountId) {
    try {
        const pool = await getPool();
        await pool.request()
            .input('AccountId', sql.Int, accountId)
            .query("UPDATE Account SET State = 'Inactive' WHERE AccountId = @AccountId");
        console.log(`🔒 Đã khóa vĩnh viễn tài khoản ID: ${accountId} trong CSDL.`);
        return true;
    } catch (err) {
        console.error("Lỗi khi khóa tài khoản trong model:", err);
        throw err;
    }
}

module.exports = { 
  checkLogin, 
  findUserByEmail,
  lockUserAccount 
};