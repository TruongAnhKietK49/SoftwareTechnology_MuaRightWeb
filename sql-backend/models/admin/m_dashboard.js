const { getPool, closePool } = require("../../routes/config");

// Lấy dữ liệu đơn hàng
async function getOrderProduct() {
  const pool = await getPool();
  const result = await pool.request().query(`
        SELECT * FROM OrderProduct
    `);
  return result.recordset;
}

// Lấy dữ liệu doanh thu từ OrderProduct
async function getRevenue() {
  const pool = await getPool();
  const result = await pool.request().query(`
        SELECT SUM(TotalAmount) AS Revenue
        FROM OrderProduct
    `);
  return result.recordset[0].Revenue || 0; // Trả về 0 nếu chưa có đơn hàng nào
}

// Lấy dữ liệu tài khoản từ Account
async function getAccounts() {
  const pool = await getPool();
  const result = await pool.request().query(`
        SELECT * FROM Account
    `);
  return result.recordset;
}

// Lấy dữ liệu sản phẩm từ Product
async function getProducts() {
  const pool = await getPool();
  const result = await pool.request().query(`
        SELECT * FROM Product
    `);
  return result.recordset;
}

// Insert Voucher
async function insertVoucher(data) {
  const pool = await getPool();
  const req = pool.request();

  if (data.CreatedByAdmin) {
    const username = data.CreatedByAdmin;
    const result = await pool
      .request()
      .input("Username", username)
      .query("SELECT AccountId FROM Account WHERE Username = @Username");

    if (result.recordset.length > 0) {
      data.CreatedByAdmin = result.recordset[0].AccountId;
    } else {
      throw new Error(
        `Không tìm thấy tài khoản admin có Username = ${username}`
      );
    }
  }

  const reqInsert = pool.request();
  const cols = Object.keys(data);
  cols.forEach((col) => reqInsert.input(col, data[col]));

  const query = `
    INSERT INTO Voucher (${cols.join(", ")})
    VALUES (${cols.map((c) => `@${c}`).join(", ")});
  `;

  await reqInsert.query(query);
  console.log(`✔ Insert Voucher: ${data.Code}`);
}

// Lấy doanh thu biểu đồ tròn
async function getRevenuePieChart() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT 
        p.Brand,
        SUM(oi.LineTotal) AS Revenue
    FROM OrderItem oi
    JOIN Product p ON oi.ProductId = p.ProductId
    JOIN OrderProduct o ON oi.OrderId = o.OrderId
    WHERE o.State = 'Delivered'
    GROUP BY p.Brand
    ORDER BY Revenue DESC
  `);

  // ✅ Luôn trả về mảng (rỗng nếu không có)
  return result.recordset || [];
}

// =================== Thống kê người dùng đăng ký theo tháng ===================
async function getUserRegistrationByMonth() {
  const pool = await getPool();
  const result = await pool.request().query(`
        SELECT 
          MONTH(CreatedAt) AS Month,
          COUNT(*) AS TotalUsers
        FROM Account
        WHERE Role IN ('Customer', 'Seller', 'Shipper')
          AND YEAR(CreatedAt) = YEAR(SYSUTCDATETIME())
        GROUP BY MONTH(CreatedAt)
        ORDER BY MONTH(CreatedAt)
    `);
  return result.recordset || [];
}

module.exports = {
  getOrderProduct,
  getRevenue,
  getAccounts,
  getProducts,
  insertVoucher,
  getRevenuePieChart,
  getUserRegistrationByMonth,
};
