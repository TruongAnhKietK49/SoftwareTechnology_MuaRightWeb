const { getPool, closePool } = require("../routes/config");
const sql = require("mssql");

async function insertUser(data) {
  const { commonData, profileData } = data; 
  const pool = await getPool();

  try {
    // Kiểm tra thông tin trùng lặp
    const checkRequest = pool.request();
    checkRequest.input("Username", sql.NVarChar, commonData.Username);
    checkRequest.input("Email", sql.NVarChar, commonData.Email);
    checkRequest.input("Phone", sql.NVarChar, commonData.Phone);

    // Kiểm tra Username
    let result = await checkRequest.query("SELECT 1 FROM Account WHERE Username = @Username");
    if (result.recordset.length > 0) {
      throw new Error("Tên đăng nhập đã tồn tại.");
    }

    // Kiểm tra Email
    result = await checkRequest.query("SELECT 1 FROM Account WHERE Email = @Email");
    if (result.recordset.length > 0) {
      throw new Error("Email đã được sử dụng.");
    }

    // Kiểm tra Phone
    result = await checkRequest.query("SELECT 1 FROM Account WHERE Phone = @Phone");
    if (result.recordset.length > 0) {
      throw new Error("Số điện thoại đã được sử dụng.");
    }


    //  Thêm tài khoản nếu không trùng
    const reqAcc = pool.request();
    const accCols = Object.keys(commonData);
    accCols.forEach((col) => reqAcc.input(col, commonData[col]));

    const accColNames = accCols.join(", ");
    const accColParams = accCols.map((c) => `@${c}`).join(", ");

    const insertResult = await reqAcc.query(`
      INSERT INTO Account (${accColNames})
      OUTPUT INSERTED.AccountId AS AccountId, INSERTED.Role AS Role
      VALUES (${accColParams});
    `);

    const accountId = insertResult.recordset[0].AccountId;
    const roleAccount = insertResult.recordset[0].Role;
    const profileTable = `${roleAccount}Profile`;
    const profileId = `${roleAccount}Id`;

    //Thêm thông tin chi tiết (Profile) 
    const reqProf = pool.request();
    reqProf.input(profileId, accountId);

    const profCols = Object.keys(profileData);
    profCols.forEach((col) => reqProf.input(col, profileData[col]));

    const profColNames = [profileId, ...profCols].join(", ");
    const profColParams = [`@${profileId}`, ...profCols.map((c) => `@${c}`)].join(", ");

    await reqProf.query(`
      INSERT INTO ${profileTable} (${profColNames})
      VALUES (${profColParams});
    `);

    console.log(`✔ Insert ${roleAccount}: ${commonData.Username}`);
  } catch (err) {
    console.error("❌ Lỗi khi chèn dữ liệu:", err.message);
    throw err; 
  } finally {
    await closePool();
  }
}

module.exports = { insertUser };