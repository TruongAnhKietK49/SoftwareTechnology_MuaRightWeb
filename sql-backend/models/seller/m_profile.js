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
        console.error("SQL Error - getSellerProfile:", err);
        throw err;
    }
}

/**
 * Cập nhật thông tin Seller Profile và Account trong một transaction
 * @param {number} sellerId ID của người bán
 * @param {object} data Dữ liệu cập nhật
 * @returns {Promise<boolean>} Kết quả cập nhật
 */
async function updateSellerProfile(sellerId, data) {
    const { 
        FullName, Address, Birthday, Gender, 
        StoreName, StoreAddress, 
        Phone, ImageUrl 
    } = data;

    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();

        const accountRequest = new sql.Request(transaction);
        await accountRequest
            .input('sellerId', sql.Int, sellerId)
            .input('Phone', sql.NVarChar(50), Phone)
            .input('ImageUrl', sql.NVarChar(1000), ImageUrl)
            .query(`
                UPDATE Account
                SET Phone = @Phone, ImageUrl = @ImageUrl
                WHERE AccountId = @sellerId;
            `);


        const profileRequest = new sql.Request(transaction);
        await profileRequest
            .input('sellerId', sql.Int, sellerId)
            .input('FullName', sql.NVarChar(200), FullName)
            .input('Address', sql.NVarChar(500), Address)
            .input('Birthday', sql.Date, Birthday || null)
            .input('Gender', sql.NVarChar(10), Gender)
            .input('StoreName', sql.NVarChar(200), StoreName)
            .input('StoreAddress', sql.NVarChar(500), StoreAddress)
            .query(`
                UPDATE SellerProfile
                SET FullName = @FullName, Address = @Address, Birthday = @Birthday, 
                    Gender = @Gender, StoreName = @StoreName, StoreAddress = @StoreAddress
                WHERE SellerId = @sellerId;
            `);

        await transaction.commit();
        return true; 
    } catch (err) {
        await transaction.rollback();
        console.error("SQL Error - updateSellerProfile:", err);
        throw err; 
    }
}

module.exports = {
    getSellerProfile,
    updateSellerProfile
};