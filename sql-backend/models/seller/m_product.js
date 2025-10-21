const sql = require("mssql");
const { getPool } = require("../../routes/config");

/**
 * Lấy tất cả sản phẩm ĐÃ ĐƯỢC DUYỆT của một người bán
 * @param {number} sellerId
 */
async function getProductsBySeller(sellerId) {
    const pool = await getPool();
    const request = await pool.request()
        .input('sellerId', sql.Int, sellerId)
        .query(`
            SELECT 
                P.ProductId, P.SellerId, P.NameProduct, P.Category, P.Quantity, 
                P.Price, P.Description, P.Warranty, P.ImageUrl, P.TagName,
                ISNULL(AVG(CAST(R.Rating AS FLOAT)), 0) AS AverageRating,
                COUNT(R.ReviewId) AS ReviewCount
            FROM Product P
            LEFT JOIN Review R ON P.ProductId = R.ProductId
            WHERE P.SellerId = @SellerId 
            GROUP BY P.ProductId, P.SellerId, P.NameProduct, P.Category, P.Quantity, P.Price, P.Description, P.Warranty, P.ImageUrl, P.TagName
            ORDER BY P.ProductId DESC;
        `);
    return request.recordset;
}

/**
 * Thêm một sản phẩm mới trực tiếp vào bảng Product với tag chờ duyệt
 * @param {object} productData
 */
async function addProductForApproval(productData) {
    const finalTagName = [productData.TagName, '_PENDING_APPROVAL_'].filter(Boolean).join(',');
    const pool = await getPool();
    const request = await pool.request()
        .input('SellerId', sql.Int, productData.SellerId)
        .input('NameProduct', sql.NVarChar, productData.NameProduct)
        .input('Category', sql.NVarChar, productData.Category)
        .input('Quantity', sql.Int, productData.Quantity)
        .input('Price', sql.Decimal(18, 2), productData.Price)
        .input('Description', sql.NVarChar, productData.Description)
        .input('Warranty', sql.NVarChar, productData.Warranty)
        .input('ImageUrl', sql.NVarChar, productData.ImageUrl)
        .input('TagName', sql.NVarChar, finalTagName)
        .query(`
            INSERT INTO Product (SellerId, NameProduct, Category, Quantity, Price, Description, Warranty, ImageUrl, TagName)
            VALUES (@SellerId, @NameProduct, @Category, @Quantity, @Price, @Description, @Warranty, @ImageUrl, @TagName);
        `);
    return request;
}

/**
 * Cập nhật thông tin một sản phẩm đã có (đã được duyệt)
 * @param {number} productId 
 * @param {object} productData 
 */
async function updateProductById(productId, productData) {
    const { NameProduct, Category, Quantity, Price, Description, Warranty, TagName } = productData;
    const pool = await getPool();
    const cleanTagName = (TagName || '').replace(/_PENDING_APPROVAL_/g, '').trim();
    const request = await pool.request()
        .input('ProductId', sql.Int, productId)
        .input('NameProduct', sql.NVarChar, NameProduct)
        .input('Category', sql.NVarChar, Category)
        .input('Quantity', sql.Int, Quantity)
        .input('Price', sql.Decimal(18, 2), Price)
        .input('Description', sql.NVarChar, Description)
        .input('Warranty', sql.NVarChar, Warranty)
        .input('TagName', sql.NVarChar, cleanTagName) 
        .query(`
            UPDATE Product SET 
                NameProduct = @NameProduct, Category = @Category, Quantity = @Quantity, Price = @Price, 
                Description = @Description, Warranty = @Warranty, TagName = @TagName
            WHERE ProductId = @ProductId; 
        `);
    return request.rowsAffected[0] > 0;
}

/**
 * Xóa một sản phẩm và tất cả các bản ghi liên quan
 * @param {number} productId 
 */
async function deleteProductById(productId) {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        // Xóa các bản ghi phụ thuộc trước
        await new sql.Request(transaction).input('ProductId', sql.Int, productId).query('DELETE FROM Review WHERE ProductId = @ProductId;');
        await new sql.Request(transaction).input('ProductId', sql.Int, productId).query('DELETE FROM Basket WHERE ProductId = @ProductId;');
        await new sql.Request(transaction).input('ProductId', sql.Int, productId).query('DELETE FROM OrderItem WHERE ProductId = @ProductId;');
        // Cuối cùng là xóa sản phẩm
        const result = await new sql.Request(transaction).input('ProductId', sql.Int, productId).query('DELETE FROM Product WHERE ProductId = @ProductId;');
        
        await transaction.commit();
        return result.rowsAffected[0] > 0;
    } catch (err) {
        await transaction.rollback();
        console.error("Lỗi khi xóa sản phẩm (transaction rolled back):", err);
        throw err;
    }
}

module.exports = {
    getProductsBySeller,
    addProductForApproval,
    updateProductById,
    deleteProductById
};