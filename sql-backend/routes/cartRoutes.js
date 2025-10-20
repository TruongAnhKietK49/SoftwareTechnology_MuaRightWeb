const express = require("express");
const { getPool } = require("./config");

const router = express.Router();

router.get("/getAllItem", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`SELECT 
      Basket.BasketId,
      Basket.ProductId,
      Basket.Quantity,
      Product.NameProduct,
      Product.Price,
      Product.ImageUrl,
      Product.Brand
      FROM Basket JOIN Product ON Basket.ProductId = Product.ProductId
    `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error("Error fetching cart items:", err);
    res.status(500).json({ success: false, message: "Lỗi server." });
  }
});

router.put("/update/:ProductId", async (req, res) => {
  try {
    const { ProductId } = req.params;
    const {Quantity, UnitPrice} = req.body;
    const pool = await getPool();
    const result = await pool
      .request()
      .input("ProductId", ProductId)
      .input("Quantity",  Quantity)
      .input("UnitPrice", UnitPrice)
      .query(`UPDATE Basket SET Quantity = @Quantity, UnitPrice = @UnitPrice WHERE ProductId = @ProductId`);
    if (result.rowsAffected[0] > 0) {
      res.json({ success: true, message: "Cập nhật số lượng sản phẩm thành công!" });
    } else {
      res.json({ success: false, message: "Không tìm thấy sản phẩm trong giỏ hàng." });
    }
  } catch (err) {
    console.error("Error updating cart item:", err);
    res.status(500).json({ success: false, message: "Lỗi server." });
  }
});

router.delete("/remove/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const pool = await getPool();
    const result = await pool
      .request()
      .input("ProductId", productId)
      .query(`DELETE FROM Basket WHERE ProductId = @ProductId`);
    if (result.rowsAffected[0] > 0) {
      res.json({ success: true, message: "Xóa sản phẩm khỏi giỏ hàng thành công!" });
    } else {
      res.json({ success: false, message: "Không tìm thấy sản phẩm trong giỏ hàng." });
    } 
  } catch (err) {
    console.error("Error removing cart item:", err);
    res.status(500).json({ success: false, message: "Lỗi server." });
  }
});

router.delete("/clear", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`DELETE FROM Basket`);
    res.json({ success: true, message: "Đã xóa tất cả sản phẩm khỏi giỏ hàng." });
  } catch (err) {
    console.error("Error clearing cart:", err);
    res.status(500).json({ success: false, message: "Lỗi server." });
  }
});

router.post("/add", async (req, res) => {
  try {
    const { CustomerId, ProductId, Quantity, UnitPrice } = req.body;

    console.log("Dữ liệu nhận được:", req.body);

    // Kiểm tra dữ liệu đầu vào
    if (!CustomerId || !ProductId || !Quantity || !UnitPrice) {
      return res.status(400).json({
        success: false,
        message: "Thiếu dữ liệu (CustomerId, ProductId, Quantity, UnitPrice).",
      });
    }

    const pool = await getPool();
    const request = pool.request();

    // ⚙️ Gán tham số — an toàn, tránh lỗi kiểu “Incorrect syntax near 'Oct'”
    request.input("CustomerId", CustomerId);
    request.input("ProductId", ProductId);
    request.input("Quantity", Quantity);
    request.input("UnitPrice", UnitPrice);

    // 🧩 Thực thi query — không cần chèn AddedAt (SQL tự sinh)
    const result = await request.query(`
      INSERT INTO Basket (CustomerId, ProductId, Quantity, UnitPrice)
      VALUES (@CustomerId, @ProductId, @Quantity, @UnitPrice);
    `);

    if (result.rowsAffected[0] > 0) {
      res.json({
        success: true,
        message: "🛒 Thêm sản phẩm vào giỏ hàng thành công!",
      });
    } else {
      res.json({
        success: false,
        message: "Không thể thêm sản phẩm vào giỏ hàng.",
      });
    }
  } catch (err) {
    console.error("Error adding to cart:", err);
    res.status(500).json({ success: false, message: "Lỗi server." });
  }
});

module.exports = router;
