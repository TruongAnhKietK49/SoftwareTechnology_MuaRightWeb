const sql = require("mssql");
const { getPool } = require("../../routes/config");

/**
 * Lấy thông tin chi tiết Seller Profile và Account
 * @param {number} sellerId ID của người bán
 * @returns {Promise<object>} Thông tin Seller
 */
async function getSellerProfile(sellerId) {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('sellerId', sql.Int, sellerId)
            .query(`
                SELECT 
                    A.Username, A.Email, A.Phone, A.ImageUrl, A.State,
                    S.FullName, S.Address, S.Birthday, S.Gender, S.StoreName, S.StoreAddress, S.Balance
                FROM Account A
                JOIN SellerProfile S ON A.AccountId = S.SellerId
                WHERE A.AccountId = @sellerId;
            `);
        
        return result.recordset[0] || null;
    } catch (err) {
        console.error("Lỗi khi lấy thông tin Seller Profile:", err);
        throw err;
    }
}

/**
 * Cập nhật thông tin Seller Profile và Account
 * @param {number} sellerId ID của người bán
 * @param {object} data Dữ liệu cập nhật
 * @returns {Promise<boolean>} Kết quả cập nhật
 */
async function updateSellerProfile(sellerId, data) {
    const { FullName, Address, Birthday, Gender, StoreName, StoreAddress, Email, Phone, ImageUrl } = data;
    try {
        const pool = await getPool();
        
        // Cập nhật Account (Email, Phone, ImageUrl)
        const updateAccount = await pool.request()
            .input('sellerId', sql.Int, sellerId)
            .input('Email', sql.NVarChar, Email)
            .input('Phone', sql.NVarChar, Phone)
            .input('ImageUrl', sql.NVarChar, ImageUrl)
            .query(`
                UPDATE Account
                SET Email = @Email, Phone = @Phone, ImageUrl = @ImageUrl
                WHERE AccountId = @sellerId;
            `);

        // Cập nhật SellerProfile (FullName, Address, StoreName, StoreAddress...)
        const updateProfile = await pool.request()
            .input('sellerId', sql.Int, sellerId)
            .input('FullName', sql.NVarChar, FullName)
            .input('Address', sql.NVarChar, Address)
            .input('Birthday', sql.Date, Birthday || null)
            .input('Gender', sql.NVarChar, Gender)
            .input('StoreName', sql.NVarChar, StoreName)
            .input('StoreAddress', sql.NVarChar, StoreAddress)
            .query(`
                UPDATE SellerProfile
                SET FullName = @FullName, Address = @Address, Birthday = @Birthday, Gender = @Gender, StoreName = @StoreName, StoreAddress = @StoreAddress
                WHERE SellerId = @sellerId;
            `);
        
        return updateAccount.rowsAffected[0] > 0 || updateProfile.rowsAffected[0] > 0;
    } catch (err) {
        console.error("Lỗi khi cập nhật Seller Profile:", err);
        throw err;
    }
}

module.exports = {
    getSellerProfile,
    updateSellerProfile
};