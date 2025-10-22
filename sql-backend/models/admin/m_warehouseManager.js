const {getPool, closePool} = require("../../routes/config");

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

const removeProduct = async (productId) => {
    try {
        const pool = await getPool();
        await pool.request().query(`DELETE FROM Product WHERE ProductId = ${productId}`);
    } catch (err) {
        console.error("Lỗi khi xóa sản phẩm:", err);
    }
};

module.exports = { getProducts, removeProduct };