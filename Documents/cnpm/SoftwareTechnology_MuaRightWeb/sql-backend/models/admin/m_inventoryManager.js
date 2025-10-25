const { getPool, closePool } = require("../../routes/config");

async function insertProduct(data) {
  try {
    const pool = await getPool();
    const request = pool.request();

    request.input("SellerId", data.SellerId);
    request.input("NameProduct", data.NameProduct);
    request.input("Category", data.Category);
    request.input("Quantity", data.Quantity);
    request.input("Price", data.Price);
    request.input("Description", data.Description);
    request.input("Warranty", data.Warranty);
    request.input("ImageUrl", data.ImageUrl);
    request.input("TagName", data.TagName);

    const result = await request.query(`
      INSERT INTO Product (SellerId, NameProduct, Category, Quantity, Price, Description, Warranty, ImageUrl, TagName)
      VALUES (@SellerId, @NameProduct, @Category, @Quantity, @Price, @Description, @Warranty, @ImageUrl, @TagName)
    `);
    console.log("✅ Đã thêm sản phẩm thành công!");
    return result;
  } catch (error) {
    console.error("❌ Lỗi thêm sản phẩm: ", error);
    throw error;
  } finally {
    await closePool();
  }
}

module.exports = { insertProduct };
