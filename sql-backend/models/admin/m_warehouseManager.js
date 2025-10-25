const { getPool, closePool } = require("../../routes/config");

const getProducts = async () => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT 
          p.*,
          a.Username AS SellerName,
          ISNULL(AVG(r.Rating), 0) AS AverageRating,      -- ⭐ Trung bình sao
          COUNT(r.ReviewId) AS TotalReviews               -- 🔢 Tổng số đánh giá
      FROM Product AS p
      JOIN Account AS a ON p.SellerId = a.AccountId
      LEFT JOIN Review AS r ON p.ProductId = r.ProductId
      GROUP BY 
          p.ProductId, p.SellerId, p.NameProduct, p.Category, 
          p.Quantity, p.Price, p.Description, p.Warranty, 
          p.ImageUrl, p.TagName, p.Brand, p.CreatedAt, 
          a.Username
      ORDER BY p.CreatedAt DESC
    `);
    return result.recordset;
  } catch (err) {
    console.error("❌ Lỗi khi lấy danh sách sản phẩm:", err);
    return [];
  }
};

// 🧩 Hàm xóa sản phẩm an toàn (xử lý khóa ngoại)
async function removeProduct(productId) {
  const pool = await getPool();

  await pool.request().query(`
    BEGIN TRANSACTION;

    -- 1️⃣ Xóa sản phẩm khỏi giỏ hàng
    DELETE FROM Basket WHERE ProductId = ${productId};

    -- 2️⃣ Xóa review liên quan
    DELETE FROM Review WHERE ProductId = ${productId};

    -- 3️⃣ Xóa các dòng order chứa sản phẩm này
    DELETE FROM OrderItem WHERE ProductId = ${productId};

    -- 4️⃣ Cuối cùng xóa sản phẩm
    DELETE FROM Product WHERE ProductId = ${productId};

    COMMIT TRANSACTION;
  `);
}

module.exports = { getProducts, removeProduct };
