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
      SELECT 
      r.ReviewId,
      r.ProductId,
      r.CustomerId,
      r.Rating,
      r.Comment,
      r.CreatedAt,
      c.Username AS Name
      FROM Review r LEFT JOIN Account c on r.CustomerId = c.AccountId;
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

router.post("/addReview", async (req, res) => {
  try {
    const { ProductId, CustomerId, Rating, Comment, CreatedAt } = req.body;
    const pool = await getPool();
    const result = await pool
      .request()
      .input("ProductId", ProductId)
      .input("CustomerId", CustomerId)
      .input("Rating", Rating)
      .input("Comment", Comment)
      .input("CreatedAt", CreatedAt)
      .query(`INSERT INTO Review (ProductId, CustomerId, Rating, Comment, CreatedAt) 
              VALUES (@ProductId, @CustomerId, @Rating, @Comment, @CreatedAt);`);
    res.json({ success: true, message: "Thêm đánh giá thành công!" });
  } catch (err) {
    console.error("Error adding product review:", err);
    res.status(500).json({ success: false, message: "Lỗi server." });
  } 
});

module.exports = router;
