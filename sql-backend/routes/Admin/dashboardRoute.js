const { getPool, closePool } = require("../config");
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

// 🕓 Lấy hoạt động gần đây
router.get("/recent-activity", async (req, res) => {
  try {
    const query = `
      SELECT TOP 5 * FROM (
    -- 🛒 Đơn hàng mới
    SELECT 
      N'Đơn hàng mới #' + CAST(OrderId AS NVARCHAR(20)) AS Title,
      'bi bi-cart-check' AS Icon,
      'primary' AS Color,
      OrderDate AS Time
    FROM OrderProduct

    UNION ALL

    -- 👤 Người dùng mới
    SELECT 
      N'Người dùng mới: ' + Username AS Title,
      'bi bi-person-plus' AS Icon,
      'success' AS Color,
      CreatedAt AS Time
    FROM Account
    WHERE CreatedAt IS NOT NULL

    UNION ALL

    -- 👜 Sản phẩm mới
    SELECT 
      N'Sản phẩm mới: ' + NameProduct AS Title,
      'bi bi-bag-check' AS Icon,
      'warning' AS Color,
      CreatedAt AS Time
    FROM Product
    WHERE CreatedAt IS NOT NULL

    UNION ALL

    -- ⭐ Đánh giá
    SELECT 
      N'Đánh giá ' + CAST(Rating AS NVARCHAR(5)) + N'⭐ cho sản phẩm ID ' + CAST(ProductId AS NVARCHAR(20)) AS Title,
      'bi bi-star' AS Icon,
      'primary' AS Color,
      CreatedAt AS Time
    FROM Review

    UNION ALL

    -- 💵 Hoàn tiền đơn hàng
    SELECT 
      N'Hoàn tiền đơn hàng #' + CAST(OrderId AS NVARCHAR(20)) AS Title,
      'bi bi-currency-dollar' AS Icon,
      'danger' AS Color,
      UpdatedAt AS Time
    FROM OrderProduct
    WHERE State = 'Cancelled' AND UpdatedAt IS NOT NULL
) AS Activities
WHERE Time IS NOT NULL
ORDER BY Time DESC;

    `;

    const pool = await getPool();
    const result = await pool.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Lỗi khi lấy hoạt động gần đây:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 📊 Lấy top sản phẩm bán chạy nhất
router.get("/top-products", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT TOP 5
          p.ProductId,
          p.NameProduct,
          p.Category,
          p.ImageUrl,
          SUM(oi.Quantity) AS TotalSold,
          SUM(oi.LineTotal) AS Revenue
      FROM OrderItem oi
      JOIN Product p ON oi.ProductId = p.ProductId
      JOIN OrderProduct op ON oi.OrderId = op.OrderId
      WHERE op.State = 'Delivered'
      GROUP BY p.ProductId, p.NameProduct, p.Category, p.ImageUrl
      ORDER BY TotalSold DESC;
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Lỗi khi lấy top sản phẩm:", err);
    res.status(500).json({ error: "Lỗi khi lấy dữ liệu sản phẩm bán chạy" });
  }
});

module.exports = router;
