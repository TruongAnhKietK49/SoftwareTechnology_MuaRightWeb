const {getPool, closePool} = require("../config");
const express = require("express");
const router = express.Router();

const {
  getOrderProduct,
  getRevenue,
  getAccounts,
  getProducts,
  insertVoucher,
} = require("../../models/admin/m_dashboard");

router.get("/dashboard/statistics", async (req, res) => {
  try {
    const orderProduct = await getOrderProduct();
    const revenue = await getRevenue();
    const accounts = await getAccounts();
    const products = await getProducts();

    res.json({ orderProduct, revenue, accounts, products });
  } catch (err) {
    console.error("Lỗi khi lấy dữ liệu dashboard:", err);
    res.status(500).json({ error: "Lỗi server khi lấy dữ liệu dashboard" });
  }
});

// Tạo voucher
router.post("/dashboard/vouchers", async (req, res) => {
  try {
    const voucher = req.body;
    await insertVoucher(voucher);
    res.json({ message: "Voucher tạo thành cong" });
  } catch (err) {
    console.error("Lỗi khi tạo voucher:", err);
    res.status(500).json({ error: "Lỗi server khi tạo voucher" });
  }
});

// 🧮 Lấy doanh thu theo tháng (chỉ tính đơn đã giao thành công)
router.get("/dashboard/revenue", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT 
          YEAR(DeliveredAt) AS Year,
          MONTH(DeliveredAt) AS Month,
          SUM(TotalAmount) AS Revenue
      FROM OrderProduct
      WHERE State = 'Delivered'
      GROUP BY YEAR(DeliveredAt), MONTH(DeliveredAt)
      ORDER BY Year, Month
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Lỗi lấy doanh thu:", err);
    res.status(500).json({ error: "Lỗi máy chủ khi lấy dữ liệu doanh thu" });
  }
});

module.exports = router;
