// File: m_order.js 
const sql = require("mssql");

const { getPool } = require("../../routes/config");

/**
 * Lấy danh sách đơn hàng của Seller theo trạng thái
 */
async function getSellerOrders(sellerId, state) {
    try {
        const pool = await getPool();
        const request = pool.request().input('sellerId', sql.Int, sellerId);
        let query = `
            SELECT DISTINCT
                O.OrderId,
                O.OrderDate,
                O.TotalAmount,
                O.State,
                CP.FullName AS CustomerName,
                A.Phone AS CustomerPhone
            FROM OrderProduct O
            JOIN OrderItem OI ON O.OrderId = OI.OrderId
            JOIN CustomerProfile CP ON O.CustomerId = CP.CustomerId
            JOIN Account A ON CP.CustomerId = A.AccountId
            WHERE OI.SellerId = @sellerId
        `;

        if (state && state.toUpperCase() !== 'ALL') {
            query += ` AND O.State = @state`;
            request.input('state', sql.NVarChar, state);
        }

        query += ` ORDER BY O.OrderDate DESC;`;

        const result = await request.query(query);
        return result.recordset;
    } catch (err) {
        console.error("Lỗi khi lấy danh sách đơn hàng:", err);
        throw err;
    }
}

/**
 * Lấy chi tiết đơn hàng (các sản phẩm của Seller trong Order đó)
 */
async function getOrderDetail(orderId, sellerId) {
    try {
        const pool = await getPool();

        // 1. Lấy thông tin chung của Order
        const orderInfo = await pool.request()
            .input('orderId', sql.Int, orderId)
            .input('sellerId', sql.Int, sellerId)
            .query(`
                SELECT
                    O.OrderId, O.OrderDate, O.TotalAmount, O.State,
                    O.ShippingFee, O.ApprovedAt, O.ShippedAt, O.DeliveredAt,
                    O.CancelReason,
                    CP.FullName AS CustomerName,
                    CP.Address AS CustomerAddress,
                    A.Phone AS CustomerPhone,
                    (SELECT FullName FROM ShipperProfile WHERE ShipperId = O.ShipperId) AS ShipperName
                FROM OrderProduct O
                JOIN CustomerProfile CP ON O.CustomerId = CP.CustomerId
                JOIN Account A ON CP.CustomerId = A.AccountId
                WHERE O.OrderId = @orderId AND EXISTS (
                    SELECT 1 FROM OrderItem OI
                    WHERE OI.OrderId = O.OrderId AND OI.SellerId = @sellerId
                );
            `);

        if (!orderInfo.recordset || orderInfo.recordset.length === 0) {
            return null;
        }

        const orderHeader = orderInfo.recordset[0];

        // 2. Lấy chi tiết OrderItem của Seller
        const orderItems = await pool.request()
            .input('orderId', sql.Int, orderId)
            .input('sellerId', sql.Int, sellerId)
            .query(`
                SELECT
                    OI.OrderItemId, OI.ProductId, OI.Quantity, OI.LineTotal,
                    P.NameProduct, P.Price, P.ImageUrl
                FROM OrderItem OI
                JOIN Product P ON OI.ProductId = P.ProductId
                WHERE OI.OrderId = @orderId AND OI.SellerId = @sellerId;
            `);

        const subTotal = orderItems.recordset.reduce((sum, item) => sum + item.LineTotal, 0);

        return {
            ...orderHeader,
            Items: orderItems.recordset,
            SubTotalForSeller: subTotal
        };

    } catch (err) {
        console.error("Lỗi khi lấy chi tiết đơn hàng:", err);
        throw err;
    }
}

/**
 * Cập nhật trạng thái OrderProduct
 */
async function updateOrderStatus(orderId, newState, cancelReason = null) {
    try {
        const pool = await getPool();
        let query = `UPDATE OrderProduct SET State = @newState, UpdatedAt = GETDATE()`;
        let whereClause = ` WHERE OrderId = @orderId`;

        if (newState === 'Approved') {
            query += `, ApprovedAt = GETDATE()`;
            whereClause += ` AND State = 'Pending'`;
        } else if (newState === 'Shipped') {
            query += `, ShippedAt = GETDATE()`;
            whereClause += ` AND State = 'Approved'`;
        } else if (newState === 'Delivered') {
            query += `, DeliveredAt = GETDATE()`;
            whereClause += ` AND State = 'Shipped'`;
        } else if (newState === 'Cancelled') {
            query += `, CancelReason = @cancelReason`;
            whereClause += ` AND State = 'Pending'`;
        } else {
            return 0;
        }

        const request = pool.request()
            .input('orderId', sql.Int, orderId)
            .input('newState', sql.NVarChar, newState);

        if (newState === 'Cancelled') {
            request.input('cancelReason', sql.NVarChar, cancelReason || 'Seller cancelled the order');
        }

        const result = await request.query(query + whereClause);
        return result.rowsAffected[0] > 0;
    } catch (err) {
        console.error("Lỗi khi cập nhật trạng thái đơn hàng:", err);
        throw err;
    }
}

module.exports = {
    getSellerOrders,
    getOrderDetail,
    updateOrderStatus
};