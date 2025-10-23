const express = require("express");
const { getPool } = require("./config");

const router = express.Router();

router.get("/getProductList", async (req, res) => {
  try {
    const pool = await getPool();
    const request = pool.request();

    const result = await request.query(`
      SELECT * FROM Product;
    `);

    if (result) {
      res.json({
        data: result.recordset
      });
    } else {
      res.json({
        success: false,
        message: "Không thể lấy sản phẩm.",
      });
    }
  } catch (err) {
    console.error("Error adding to cart:", err);
    res.status(500).json({ success: false, message: "Lỗi server." });
  }
});

router.get("/getProductReview", async (req, res) => {
  try {
    const pool = await getPool();
    const request = pool.request();
    const result = await request.query(`
      SELECT * FROM Review;
    `);
    if (result) {
      res.json({
        data: result.recordset
      });
    }
    else {
      res.json({
        success: false,
        message: "Không thể lấy đánh giá sản phẩm.",
      });
    }
  } catch (err) {
    console.error("Error fetching product reviews:", err);
    res.status(500).json({ success: false, message: "Lỗi server." });
  }
});

module.exports = router;
