// user.js
const { getPool, closePool } = require("../../routes/config");

// Thêm user mới
async function insertUser(accObj, userObj) {
  const pool = await getPool();
  const req = pool.request();

  // Lấy danh sách cột và tạo parameter
  const objColumns = Object.keys(accObj);
  objColumns.forEach((col) => {
    req.input(col, accObj[col]); // không cần khai báo kiểu, mssql sẽ tự đoán
  });

  const colNames = objColumns.join(", ");
  const colParams = objColumns.map((c) => `@${c}`).join(", ");

  const result = await req.query(`
    INSERT INTO Account (${colNames})
    OUTPUT INSERTED.AccountId AS AccountId
    VALUES (${colParams});
  `);

  const accountId = result.recordset[0].AccountId;
  const req2 = pool.request();

  req2.input("CustomerId", accountId);

  const userColumns = Object.keys(userObj);
  userColumns.forEach((col) => {
    req2.input(col, userObj[col]);
  });

  const userColNames = userColumns.join(", ");
  const userColParams = userColumns.map((c) => `@${c}`).join(", ");

  const userRes = await req2.query(`
    INSERT INTO CustomerProfile (CustomerId, ${userColNames})
    VALUES (@CustomerId, ${userColParams});
  `);

  return {
    rowsAffected: result.rowsAffected[0],
    id: result.recordset[0].AccountId,
  };
}

/** Lấy tất cả user */
async function getUsers() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT a.AccountId, a.Username, a.Email, a.Phone, a.Role, 
           c.FullName, c.Address, c.Birthday, c.Gender, c.Balance
    FROM Account a
    INNER JOIN CustomerProfile c ON a.AccountId = c.CustomerId
  `);
  return result.recordset;
}

// Xóa user theo ID
async function deleteUserById(userId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .query(`DELETE FROM Account WHERE AccountId = ${userId}`);
  //console.log("Deleted user with ID:", userId);
  return { rowsAffected: result.rowsAffected[0] };
}

async function getProducts() {
  
}

//Cần export hàm để các file khác sử dụng
module.exports = { insertUser, getUsers, deleteUserById, getProducts };
