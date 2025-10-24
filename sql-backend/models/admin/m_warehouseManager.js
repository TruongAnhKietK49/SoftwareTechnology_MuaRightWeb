const { getPool, closePool } = require("../../routes/config");

const getProducts = async () => {
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT * FROM Product");
    return result.recordset;
  } catch (err) {
    console.error("Lỗi khi lấy danh sách sản phẩm:", err);
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
