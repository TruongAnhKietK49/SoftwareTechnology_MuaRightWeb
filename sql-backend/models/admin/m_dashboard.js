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

module.exports = {
  getOrderProduct,
  getRevenue,
  getAccounts,
  getProducts,
};
