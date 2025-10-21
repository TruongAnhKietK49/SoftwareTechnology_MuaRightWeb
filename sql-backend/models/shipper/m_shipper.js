// models/m_shipper.js

const { getPool } = require('../routes/config');
const sql = require('mssql');

// Hàm 1: Lấy tất cả thông tin Profile của Shipper
async function getShipperProfile(shipperId) {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('shipperId', sql.Int, shipperId)
            .query(`
                SELECT 
                    A.Username, A.Email, A.Phone, A.ImageUrl, A.State,
                    SP.FullName, SP.Address, SP.Birthday, SP.Gender, 
                    SP.VehicleInfo, SP.LicenseNo, SP.Region, SP.Balance
                FROM Account A
                JOIN ShipperProfile SP ON A.AccountId = SP.ShipperId
                WHERE SP.ShipperId = @shipperId;
            `);
        
        // Hàm này sẽ cần một truy vấn phức tạp hơn để tính toán:
        // Đơn hoàn thành (Delivered Count)
        const countResult = await pool.request()
            .input('shipperId', sql.Int, shipperId)
            .query(`
                SELECT COUNT(OrderId) AS DeliveredCount
                FROM OrderProduct
                WHERE ShipperId = @shipperId AND State = 'Delivered';
            `);

        if (result.recordset.length > 0) {
            // Kết hợp thông tin cơ bản và số đơn hoàn thành
            const profile = result.recordset[0];
            profile.DeliveredCount = countResult.recordset[0].DeliveredCount;
            profile.Rating = 4.9; // Giả định Rating tĩnh
            return profile;
        }
        return null;

    } catch (err) {
        console.error("Lỗi Model - getShipperProfile:", err.message);
        throw err;
    }
}

// Hàm 2: Cập nhật Profile và Account
async function updateShipperProfile(shipperId, data) {
    try {
        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // A. Cập nhật bảng ShipperProfile (FullName, Address, VehicleInfo, LicenseNo, Region, Gender, Birthday)
            const reqProf = transaction.request();
            reqProf.input('shipperId', sql.Int, shipperId);

            const updateProfQuery = `
                UPDATE ShipperProfile SET
                    FullName = @fullName,
                    Address = @address,
                    Birthday = @birthday,
                    Gender = @gender,
                    VehicleInfo = @vehicleInfo,
                    LicenseNo = @licenseNo,
                    Region = @region
                WHERE ShipperId = @shipperId;
            `;
            // Cần thêm các input cho updateProfQuery, ví dụ:
            reqProf.input('fullName', sql.NVarChar, data.fullName);
            reqProf.input('address', sql.NVarChar, data.address);
            reqProf.input('birthday', sql.Date, data.birthday);
            reqProf.input('gender', sql.NVarChar, data.gender);
            reqProf.input('vehicleInfo', sql.NVarChar, data.vehicleInfo);
            reqProf.input('licenseNo', sql.NVarChar, data.licenseNo);
            reqProf.input('region', sql.NVarChar, data.region);
            await reqProf.query(updateProfQuery);

            // B. Cập nhật bảng Account (Email, Phone, PasswordHash nếu có)
            const reqAcc = transaction.request();
            reqAcc.input('accountId', sql.Int, shipperId);
            reqAcc.input('email', sql.NVarChar, data.email);
            reqAcc.input('phone', sql.NVarChar, data.phone);
            
            let accUpdateFields = 'Email = @email, Phone = @phone';
            if (data.passwordHash) {
                reqAcc.input('passwordHash', sql.NVarChar, data.passwordHash);
                accUpdateFields += ', PasswordHash = @passwordHash';
            }
            if (data.imageUrl) {
                reqAcc.input('imageUrl', sql.NVarChar, data.imageUrl);
                accUpdateFields += ', ImageUrl = @imageUrl';
            }

            await reqAcc.query(`
                UPDATE Account SET ${accUpdateFields}
                WHERE AccountId = @accountId;
            `);

            await transaction.commit();
            return { success: true };

        } catch (err) {
            await transaction.rollback();
            console.error("Lỗi Transaction - updateShipperProfile:", err.message);
            throw err;
        }

    } catch (err) {
        console.error("Lỗi Model - updateShipperProfile:", err.message);
        throw err;
    }
}
// models/m_shipper.js

const { getPool } = require('../routes/config'); // Giả định config.js chứa hàm getPool()
const sql = require('mssql');

// Hàm Helper để lấy thông tin chi tiết sản phẩm (Join OrderItem và Product)
async function getOrderDetails(orderId) {
    const pool = await getPool();
    const details = await pool.request()
        .input('orderId', sql.Int, orderId)
        .query(`
            SELECT
                OI.Quantity,
                P.NameProduct,
                P.ImageUrl,
                SP.StoreName AS SellerStore
            FROM OrderItem OI
            JOIN Product P ON OI.ProductId = P.ProductId
            JOIN SellerProfile SP ON OI.SellerId = SP.SellerId
            WHERE OI.OrderId = @orderId;
        `);
    return details.recordset;
}


// -------------------------------------------------------------
// 1. LẤY DANH SÁCH ĐƠN HÀNG MỚI (Chờ Shipper chọn)
// -------------------------------------------------------------
async function getPendingOrders() {
    try {
        const pool = await getPool();
        // Lấy các đơn hàng có trạng thái 'Pending' và chưa có ShipperId
        const result = await pool.request().query(`
            SELECT 
                OP.OrderId, 
                OP.ShipAddress,
                OP.ShipPhone,
                OP.TotalAmount,
                OP.ShippingFee,
                OP.OrderDate,
                OP.State
            FROM OrderProduct OP
            WHERE OP.ShipperId IS NULL AND OP.State = 'Pending'
            ORDER BY OP.OrderDate ASC;
        `);

        // Gắn chi tiết sản phẩm vào mỗi đơn hàng
        const ordersWithDetails = await Promise.all(result.recordset.map(async (order) => {
            order.Details = await getOrderDetails(order.OrderId);
            return order;
        }));

        return ordersWithDetails;
    } catch (err) {
        console.error("Lỗi Model - getPendingOrders:", err.message);
        throw err;
    }
}


// -------------------------------------------------------------
// 2. LẤY DANH SÁCH ĐƠN HÀNG CỦA TÔI (Đang giao & Lịch sử)
// -------------------------------------------------------------
async function getMyOrders(shipperId) {
    try {
        const pool = await getPool();
        // Lấy tất cả các đơn hàng đã được gán cho Shipper này
        const result = await pool.request()
            .input('shipperId', sql.Int, shipperId)
            .query(`
                SELECT 
                    OP.OrderId, 
                    OP.ShipAddress,
                    OP.TotalAmount,
                    OP.State,
                    OP.ShippingFee
                FROM OrderProduct OP
                WHERE OP.ShipperId = @shipperId
                ORDER BY CASE 
                             WHEN OP.State = 'Approved' THEN 1  -- Đang giao lên đầu
                             ELSE 2 
                         END, OP.OrderDate DESC;
            `);
        return result.recordset;
    } catch (err) {
        console.error("Lỗi Model - getMyOrders:", err.message);
        throw err;
    }
}


// -------------------------------------------------------------
// 3. NHẬN ĐƠN HÀNG (Chọn Giao)
// -------------------------------------------------------------
async function acceptOrder(orderId, shipperId) {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('orderId', sql.Int, orderId)
            .input('shipperId', sql.Int, shipperId)
            .query(`
                UPDATE OrderProduct
                SET ShipperId = @shipperId, State = 'Approved', UpdatedAt = GETDATE()
                WHERE OrderId = @orderId AND ShipperId IS NULL AND State = 'Pending';
            `);
        
        return result.rowsAffected[0] > 0;
    } catch (err) {
        console.error("Lỗi Model - acceptOrder:", err.message);
        throw err;
    }
}


// -------------------------------------------------------------
// 4. CẬP NHẬT TRẠNG THÁI (Đã Giao / Hủy Giao)
// -------------------------------------------------------------
async function updateOrderStatus(orderId, shipperId, newState) {
    try {
        const pool = await getPool();
        let updateQuery = `
            UPDATE OrderProduct
            SET State = @newState, UpdatedAt = GETDATE()
            WHERE OrderId = @orderId AND ShipperId = @shipperId;
        `;
        
        // Nếu ĐÃ GIAO, cập nhật thời gian DeliveredAt
        if (newState === 'Delivered') {
            updateQuery = updateQuery.replace('SET State', 'SET State, DeliveredAt = GETDATE()');
        }
        
        // Nếu HỦY GIAO, xóa ShipperId để đơn hàng trở lại nhóm chờ nhận
        if (newState === 'Cancelled') {
            updateQuery = `
                UPDATE OrderProduct
                SET ShipperId = NULL, State = 'Pending', UpdatedAt = GETDATE()
                WHERE OrderId = @orderId AND ShipperId = @shipperId;
            `;
            // Lưu ý: Đơn hàng quay về trạng thái Pending và không còn ShipperId
        }

        const result = await pool.request()
            .input('orderId', sql.Int, orderId)
            .input('shipperId', sql.Int, shipperId)
            .input('newState', sql.NVarChar, newState)
            .query(updateQuery);

        return result.rowsAffected[0] > 0;
    } catch (err) {
        console.error("Lỗi Model - updateOrderStatus:", err.message);
        throw err;
    }
}


module.exports = {
    getShipperProfile,
    updateShipperProfile,
    getPendingOrders,
    getMyOrders,
    acceptOrder,
    updateOrderStatus,
    // ... các hàm khác cho Product/Order sẽ thêm sau
};