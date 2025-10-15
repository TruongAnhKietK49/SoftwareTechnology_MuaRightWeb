// File: sql-backend/models/m_shipper.js
// Xử lý truy vấn SQL Server cho các chức năng của Shipper

const { getPool, sql } = require('../server'); 

/**
 * Lấy thông tin chi tiết của Shipper dựa trên AccountId.
 * Cập nhật tên cột theo SSMS: Region (thay ActiveRegion), Balance (thay BankAccount/CompletedOrders)
 * @param {number} accountId - ID của tài khoản Shipper.
 * @returns {Promise<object>} Thông tin chi tiết Shipper.
 */
async function getShipperProfile(accountId) {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('accountId', sql.Int, accountId)
            .query(`
                SELECT 
                    A.Username,
                    P.ShipperId,
                    P.FullName,
                    A.PhoneNumber, -- Giả định Phone nằm trong bảng Account
                    A.Email,       -- Giả định Email nằm trong bảng Account
                    P.Rating,
                    -- Giả định CompletedOrders được tính hoặc là cột khác
                    -- Giả định BankAccount được thay bằng Balance (Số dư ví)
                    P.Region,         -- Khu Vực Hoạt Động (Đã sửa tên cột)
                    P.Balance,        -- Số dư/Ví tiền (Đã sửa tên cột)
                    P.Address,        -- Địa chỉ cá nhân
                    P.VehicleInfo,    -- Thông tin phương tiện
                    P.LicenseNo       -- Số bằng lái
                FROM Account AS A
                JOIN ShipperProfile AS P ON A.AccountId = P.ShipperId 
                WHERE A.AccountId = @accountId;
            `);
        
        return result.recordset[0]; 
    } catch (err) {
        throw new Error('Lỗi truy vấn hồ sơ Shipper: ' + err.message);
    }
}

/**
 * Lấy danh sách các đơn hàng mới đang chờ Shipper nhận.
 * @returns {Promise<Array<object>>} Danh sách đơn hàng mới.
 */
async function getAvailableOrders() {
    // CHÚ Ý: VẪN CẦN XÁC NHẬN CÁC CỘT TRONG BẢNG ORDERS
    try {
        const pool = await getPool();
        const result = await pool.request()
            .query(`
                SELECT 
                    Order_ID, Total_Amount, Status, Product_Name, 
                    Pickup_Address, Delivery_Address, Estimated_Distance, Customer_Note 
                FROM Orders 
                WHERE Status = 'Pending' AND Shipper_ID IS NULL;
            `);
        
        return result.recordset; 
    } catch (err) {
        throw new Error('Lỗi truy vấn đơn hàng mới: ' + err.message);
    }
}

/**
 * Lấy danh sách các đơn hàng đã được Shipper hiện tại nhận.
 * @param {number} shipperId - ID Shipper 
 * @returns {Promise<Array<object>>} Danh sách đơn hàng đã hoàn thành/hủy.
 */
async function getMyCompletedOrders(shipperId) {
    // CHÚ Ý: VẪN CẦN XÁC NHẬN CÁC CỘT TRONG BẢNG ORDERS
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('shipperId', sql.Int, shipperId)
            .query(`
                SELECT 
                    Order_ID, Delivery_Address, Total_Amount, Status
                FROM Orders
                WHERE Shipper_ID = @shipperId AND (Status = 'Delivered' OR Status = 'Cancelled');
            `);
        
        return result.recordset;
    } catch (err) {
        throw new Error('Lỗi truy vấn đơn hàng đã nhận: ' + err.message);
    }
}

/**
 * Xử lý việc Shipper nhận một đơn hàng (Cập nhật Shipper_ID và Status).
 * @param {string} orderId - ID của đơn hàng cần nhận.
 * @param {number} shipperId - ID của Shipper.
 * @returns {Promise<boolean>} Trả về true nếu cập nhật thành công.
 */
async function acceptOrder(orderId, shipperId) {
    // CHÚ Ý: VẪN CẦN XÁC NHẬN CÁC CỘT TRONG BẢNG ORDERS
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('orderId', sql.NVarChar, orderId)
            .input('shipperId', sql.Int, shipperId)
            .query(`
                UPDATE Orders
                SET 
                    Shipper_ID = @shipperId, 
                    Status = 'Accepted' 
                WHERE Order_ID = @orderId AND Status = 'Pending' AND Shipper_ID IS NULL;
            `);
        
        return result.rowsAffected[0] > 0;
    } catch (err) {
        throw new Error('Lỗi khi Shipper nhận đơn: ' + err.message);
    }
}

module.exports = {
    getShipperProfile,
    getAvailableOrders,
    getMyCompletedOrders,
    acceptOrder
};
