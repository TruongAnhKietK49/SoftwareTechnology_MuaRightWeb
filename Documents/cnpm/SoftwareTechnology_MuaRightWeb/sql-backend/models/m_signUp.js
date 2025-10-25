const { getPool, closePool } = require("../routes/config");

async function insertUser(data) {
  try {
    const { commonData, profileData } = data; // Lấy 2 object
    const pool = await getPool();

    // --- Insert Account ---
    const reqAcc = pool.request();
    const accCols = Object.keys(commonData);
    accCols.forEach((col) => reqAcc.input(col, commonData[col]));

    const accColNames = accCols.join(", ");
    const accColParams = accCols.map((c) => `@${c}`).join(", ");

    const result = await reqAcc.query(`
      INSERT INTO Account (${accColNames})
      OUTPUT INSERTED.AccountId AS AccountId, INSERTED.Role AS Role
      VALUES (${accColParams});
    `);

    const accountId = result.recordset[0].AccountId;
    const roleAccount = result.recordset[0].Role; 
    const profileTable = `${roleAccount}Profile`;
    const profileId = `${roleAccount}Id`;

    // --- Insert Profile ---
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
    await closePool();
  } catch (err) {
    console.error("❌ Lỗi khi chèn dữ liệu:", err);
  }
}

module.exports = { insertUser };
