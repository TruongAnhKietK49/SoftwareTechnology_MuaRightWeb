const {sql, getPool} = require("../server")

async function insertUser(data) {
  try {
    const pool = await getPool();
    for (const key of Object.keys(data)) {
      for (let entry of data[key]) {
        const accObj = entry[0]; // Thông tin Account
        const profObj = entry[1]; // Thông tin Profile

        // --- Insert Account ---
        const reqAcc = pool.request();
        const accCols = Object.keys(accObj);
        accCols.forEach((col) => reqAcc.input(col, accObj[col]));

        const accColNames = accCols.join(", ");
        const accColParams = accCols.map((c) => `@${c}`).join(", ");

        const result = await reqAcc.query(`
          INSERT INTO Account (${accColNames})
          OUTPUT INSERTED.AccountId AS AccountId, INSERTED.Role AS Role
          VALUES (${accColParams});
        `);

        const accountId = result.recordset[0].AccountId;
        const roleAccount = result.recordset[0].Role; // "Customer" hoặc "Seller" hoặc "Shipper"
        const profileTable = roleAccount + "Profile"; // "CustomerProfile" hoặc "SellerProfile" hoặc "ShipperProfile"
        const profileId = roleAccount + "Id"; // "CustomerId" hoặc "SellerId" hoặc "ShipperId"

        // --- Insert Profile ---
        const reqProf = pool.request();
        reqProf.input(profileId, accountId);

        const profCols = Object.keys(profObj);
        profCols.forEach((col) => reqProf.input(col, profObj[col]));

        const profColNames = [profileId, ...profCols].join(", ");
        const profColParams = [
          `@${profileId}`,
          ...profCols.map((c) => `@${c}`),
        ].join(", ");

        await reqProf.query(`
          INSERT INTO ${profileTable} (${profColNames})
          VALUES (${profColParams});
        `);

        console.log(`✔ Insert ${roleAccount}: ${accObj.Username}`);
      }
    }
  } catch (err) {
    console.error("❌ Lỗi khi chèn dữ liệu mẫu:", err);
  }
}
module.exports = {insertUser}