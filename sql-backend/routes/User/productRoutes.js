const express = require("express");
const { getPool } = require("../config");
const sql = require("mssql");

const router = express.Router();

async function hasPurchased(productId, customerId) {
  if (!productId || !customerId) {
    return false;
  }
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input("ProductId", sql.Int, productId)
      .input("CustomerId", sql.Int, customerId)
      .query(`
        SELECT COUNT(oi.OrderItemId) AS PurchaseCount
        FROM OrderItem oi
        JOIN OrderProduct op ON oi.OrderId = op.OrderId
        WHERE oi.ProductId = @ProductId
          AND op.CustomerId = @CustomerId
          AND op.State = 'Delivered'; 
      `);
    
    return result.recordset[0].PurchaseCount > 0;

  } catch (error) {
    console.error("Lỗi khi kiểm tra lịch sử mua hàng:", error);
    return false;
  }
}

router.get("/getProductList", async (req, res) => {
  try {
    const pool = await getPool();
    const request = pool.request();

    const result = await request.query(`
      SELECT * FROM Product;
    `);

    if (result) {
      res.json({
        data: result.recordset,
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

// Lấy sản phẩm theo ID
router.get("/getProductById/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const pool = await getPool();
    const request = pool.request();
    request.input("ProductId", productId);
    const result = await request.query(`
      SELECT * FROM Product WHERE ProductId = @ProductId;
    `);
    if (result) {
      res.json({
        data: result.recordset,
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
        data: result.recordset,
      });
    } else {
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

router.get("/can-review/:productId/:customerId", async (req, res) => {
  try {
    const { productId, customerId } = req.params;
    const canReview = await hasPurchased(productId, customerId);
    res.json({ canReview });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server." });
  }
});

router.post("/addReview", async (req, res) => {
  try {
    const { ProductId, CustomerId, Rating, Comment, CreatedAt } = req.body;

    const canReview = await hasPurchased(ProductId, CustomerId);
    if (!canReview) {
      return res.status(403).json({ 
        success: false, 
        message: "Bạn cần mua sản phẩm này để có thể đánh giá." 
      });
    }

    const pool = await getPool();
    const result = await pool
      .request()
      .input("ProductId", parseInt(ProductId))
      .input("CustomerId", CustomerId)
      .input("Rating", Rating)
      .input("Comment", Comment)
      .input("CreatedAt", CreatedAt)
      .query(`INSERT INTO Review (ProductId, CustomerId, Rating, Comment, CreatedAt) 
              VALUES (@ProductId, @CustomerId, @Rating, @Comment, @CreatedAt);`);
    res.json({
      success: true,
      message: "Thêm đánh giá thành công!",
      data: result,
    });
  } catch (err) {
    console.error("Error adding product review:", err);
    res.status(500).json({ success: false, message: "Lỗi server." });
  }
});

router.get("/bestSeller", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
        SELECT TOP 10
        p.*
        From Product p JOIN Review r ON p.ProductId = r.ProductId
        ORDER BY r.Rating DESC 
      `);

    res.json(result);
  } catch (err) {
    console.error("Error: ", err);
  }
});

module.exports = router;
