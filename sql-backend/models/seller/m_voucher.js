const sql = require("mssql");
const { getPool } = require("../../routes/config");

async function getVouchersBySeller(sellerId) {
    const pool = await getPool();
    const request = await pool.request()
        .input('sellerId', sql.Int, sellerId)
        .query(`
            SELECT VoucherId, Code, DiscountType, DiscountVal, MinOrderAmt, ValidFrom, ValidTo, IsActive 
            FROM Voucher 
            WHERE CreatedBySeller = @sellerId
            ORDER BY VoucherId DESC;
        `);
    return request.recordset;
}

async function addVoucher(data) {
    const pool = await getPool();
    const isActive = data.IsActive !== undefined ? data.IsActive : true;

    const request = await pool.request()
        .input('Code', sql.NVarChar, data.Code)
        .input('CreatedBySeller', sql.Int, data.CreatedBySeller)
        .input('DiscountType', sql.NVarChar, data.DiscountType)
        .input('DiscountVal', sql.Decimal(18, 2), data.DiscountVal)
        .input('MinOrderAmt', sql.Decimal(18, 2), data.MinOrderAmt)
        .input('ValidFrom', sql.DateTime2, data.ValidFrom)
        .input('ValidTo', sql.DateTime2, data.ValidTo)
        .input('IsActive', sql.Bit, isActive) 
        .query(`
            INSERT INTO Voucher (Code, CreatedBySeller, DiscountType, DiscountVal, MinOrderAmt, ValidFrom, ValidTo, IsActive)
            VALUES (@Code, @CreatedBySeller, @DiscountType, @DiscountVal, @MinOrderAmt, @ValidFrom, @ValidTo, @IsActive);
        `);
    return request.rowsAffected[0] > 0;
}

async function updateVoucherById(voucherId, sellerId, data) {
    const pool = await getPool();
    const request = await pool.request()
        .input('VoucherId', sql.Int, voucherId)
        .input('SellerId', sql.Int, sellerId) 
        .input('Code', sql.NVarChar, data.Code)
        .input('DiscountType', sql.NVarChar, data.DiscountType)
        .input('DiscountVal', sql.Decimal(18, 2), data.DiscountVal)
        .input('MinOrderAmt', sql.Decimal(18, 2), data.MinOrderAmt)
        .input('ValidFrom', sql.DateTime2, data.ValidFrom)
        .input('ValidTo', sql.DateTime2, data.ValidTo)
        .input('IsActive', sql.Bit, data.IsActive)
        .query(`
            UPDATE Voucher SET
                Code = @Code,
                DiscountType = @DiscountType,
                DiscountVal = @DiscountVal,
                MinOrderAmt = @MinOrderAmt,
                ValidFrom = @ValidFrom,
                ValidTo = @ValidTo,
                IsActive = @IsActive
            WHERE VoucherId = @VoucherId AND CreatedBySeller = @SellerId; -- Chỉ cho phép chủ voucher cập nhật
        `);
    return request.rowsAffected[0] > 0;
}

async function deleteVoucherById(voucherId, sellerId) {
    const pool = await getPool();
    const request = await pool.request()
        .input('VoucherId', sql.Int, voucherId)
        .input('SellerId', sql.Int, sellerId) 
        .query(`
            DELETE FROM Voucher 
            WHERE VoucherId = @VoucherId AND CreatedBySeller = @SellerId; -- Chỉ cho phép chủ voucher xóa
        `);
    return request.rowsAffected[0] > 0;
}

module.exports = {
    getVouchersBySeller,
    addVoucher,
    updateVoucherById,
    deleteVoucherById
};