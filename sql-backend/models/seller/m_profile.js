const sql = require("mssql");
const { getPool } = require("../../routes/config");

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
                LEFT JOIN SellerProfile S ON A.AccountId = S.SellerId
                WHERE A.AccountId = @sellerId;
            `);
        
        return result.recordset[0] || null;
    } catch (err) {
        console.error("SQL Error - getSellerProfile:", err);
        throw err;
    }
}

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
                MERGE SellerProfile AS target
                USING (SELECT @sellerId AS SellerId) AS source
                ON (target.SellerId = source.SellerId)
                WHEN MATCHED THEN
                    UPDATE SET 
                        FullName = @FullName, 
                        Address = @Address, 
                        Birthday = @Birthday, 
                        Gender = @Gender, 
                        StoreName = @StoreName, 
                        StoreAddress = @StoreAddress
                WHEN NOT MATCHED THEN
                    INSERT (SellerId, FullName, Address, Birthday, Gender, StoreName, StoreAddress)
                    VALUES (@sellerId, @FullName, @Address, @Birthday, @Gender, @StoreName, @StoreAddress);
            `);

        await transaction.commit();
        return true; 
    } catch (err) {
        await transaction.rollback();
        console.error("SQL Error - updateSellerProfile:", err);
        throw err; 
    }
}

async function changeSellerPassword(sellerId, currentPassword, newPassword) {
    try {
        const pool = await getPool();
        const request = pool.request();

        const userResult = await request
            .input('sellerId', sql.Int, sellerId)
            .query('SELECT PasswordHash FROM Account WHERE AccountId = @sellerId');

        if (userResult.recordset.length === 0) {
            return { success: false, message: 'Không tìm thấy tài khoản.' };
        }

        const currentPasswordInDB = userResult.recordset[0].PasswordHash;

        if (currentPasswordInDB !== currentPassword) {
            return { success: false, message: 'Mật khẩu hiện tại không chính xác.' };
        }

        await pool.request()
            .input('sellerId', sql.Int, sellerId)
            .input('newPassword', sql.NVarChar(255), newPassword)
            .query('UPDATE Account SET PasswordHash = @newPassword WHERE AccountId = @sellerId');
        
        return { success: true, message: 'Đổi mật khẩu thành công!' };

    } catch (err) {
        console.error("SQL Error - changeSellerPassword:", err);
        throw err;
    }
}
module.exports = {
    getSellerProfile,
    updateSellerProfile,
    changeSellerPassword
};