const sql = require("mssql");
const { getPool } = require("../routes/config");

async function findUserByDetails(email, username, phone) {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('Email', sql.NVarChar, email)
            .input('Username', sql.NVarChar, username)
            .input('Phone', sql.NVarChar, phone)
            .query(`
                SELECT AccountId, Username, Email, Phone
                FROM Account 
                WHERE Email = @Email AND Username = @Username AND Phone = @Phone
            `);
        
        return result.recordset.length > 0 ? result.recordset[0] : null;
    } catch (err) {
        console.error("Lỗi khi tìm người dùng bằng chi tiết trong model:", err);
        throw err;
    }
}

async function updateUserPassword(accountId, newPassword) {
    try {
        const pool = await getPool();
        await pool.request()
            .input('AccountId', sql.Int, accountId)
            .input('NewPasswordHash', sql.NVarChar, newPassword)
            .query('UPDATE Account SET PasswordHash = @NewPasswordHash WHERE AccountId = @AccountId');
        return true;
    } catch (err) {
        console.error("Lỗi khi cập nhật mật khẩu trong model:", err);
        throw err;
    }
}

module.exports = {
    findUserByDetails, 
    updateUserPassword
};