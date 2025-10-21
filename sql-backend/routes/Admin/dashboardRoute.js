const express = require("express");
const router = express.Router();

const {
  getOrderProduct,
  getRevenue,
  getAccounts,
  getProducts,
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

module.exports = router;