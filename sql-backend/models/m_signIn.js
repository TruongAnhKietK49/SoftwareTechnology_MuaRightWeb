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
        WHERE Email = @Email AND PasswordHash = @PasswordHash
      `);

    if (result.recordset.length > 0) {
      return result.recordset[0]; // ✅ Trả về thông tin account
    } else {
      return null;
    }
  } catch (err) {
    console.error("Lỗi khi kiểm tra đăng nhập:", err);
    throw err;
  }
}

module.exports = { checkLogin };
