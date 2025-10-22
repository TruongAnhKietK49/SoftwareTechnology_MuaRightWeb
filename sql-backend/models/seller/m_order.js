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
                O.OrderId, O.OrderDate, O.TotalAmount, O.State,
                (SELECT SUM(OI_sub.LineTotal) 
                 FROM OrderItem OI_sub 
                 WHERE OI_sub.OrderId = O.OrderId AND OI_sub.SellerId = @sellerId) AS SellerTotalAmount,
                CP.FullName AS CustomerName, A.Phone AS CustomerPhone,
                SP.FullName AS ShipperName,
                (
                    SELECT P.NameProduct, P.ImageUrl, OI_sub.Quantity, OI_sub.UnitPrice
                    FROM OrderItem OI_sub JOIN Product P ON OI_sub.ProductId = P.ProductId
                    WHERE OI_sub.OrderId = O.OrderId AND OI_sub.SellerId = @sellerId
                    FOR JSON PATH
                ) AS Items
            FROM OrderProduct O
            JOIN OrderItem OI ON O.OrderId = OI.OrderId
            JOIN CustomerProfile CP ON O.CustomerId = CP.CustomerId
            JOIN Account A ON CP.CustomerId = A.AccountId
            LEFT JOIN ShipperProfile SP ON O.ShipperId = SP.ShipperId
            WHERE OI.SellerId = @sellerId
        `;

        if (state && state.toUpperCase() !== 'ALL') {
            query += ` AND O.State = @state`;
            request.input('state', sql.NVarChar, state);
        }

        query += ` ORDER BY O.OrderDate DESC;`;

        const result = await request.query(query);
        result.recordset.forEach(order => {
            order.Items = order.Items ? JSON.parse(order.Items) : [];
        });
        return result.recordset;
    } catch (err) {
        console.error("Lỗi khi lấy danh sách đơn hàng:", err);
        throw err;
    }
}

/**
 * Lấy chi tiết đơn hàng 
 */
async function getOrderDetail(orderId, sellerId) {
    try {
        const pool = await getPool();

        // Lấy thông tin chung của Order
        const orderInfo = await pool.request()
            .input('orderId', sql.Int, orderId)
            .input('sellerId', sql.Int, sellerId)
            .query(`
                SELECT
                    O.OrderId, O.OrderDate, O.TotalAmount, O.State,
                    O.ShippingFee, O.ApprovedAt, O.ShippedAt, O.DeliveredAt,
                    O.DiscountAmt,
                    CP.FullName AS CustomerName,
                    O.ShipAddress AS CustomerAddress,
                    O.ShipPhone AS CustomerPhone,
                    (SELECT FullName FROM ShipperProfile WHERE ShipperId = O.ShipperId) AS ShipperName,
                    V.Code AS VoucherCode, V.DiscountType, V.DiscountVal
                FROM OrderProduct O
                JOIN CustomerProfile CP ON O.CustomerId = CP.CustomerId
                LEFT JOIN Voucher V ON O.VoucherId = V.VoucherId
                WHERE O.OrderId = @orderId AND EXISTS (
                    SELECT 1 FROM OrderItem OI WHERE OI.OrderId = O.OrderId AND OI.SellerId = @sellerId
                );
            `);

        if (!orderInfo.recordset || orderInfo.recordset.length === 0) return null;
        const orderHeader = orderInfo.recordset[0];

        // Lấy chi tiết OrderItem
        const orderItems = await pool.request()
            .input('orderId', sql.Int, orderId)
            .input('sellerId', sql.Int, sellerId)
            .query(`
                SELECT
                    OI.OrderItemId, OI.ProductId, OI.Quantity, OI.LineTotal, OI.UnitPrice,
                    P.NameProduct, P.ImageUrl
                FROM OrderItem OI
                JOIN Product P ON OI.ProductId = P.ProductId
                WHERE OI.OrderId = @orderId AND OI.SellerId = @sellerId;
            `);

        const subTotal = orderItems.recordset.reduce((sum, item) => sum + parseFloat(item.LineTotal), 0);

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
async function updateOrderStatus(orderId, newState) {
    try {
        const pool = await getPool();
        let query = `UPDATE OrderProduct SET State = @newState, UpdatedAt = GETUTCDATE()`;
        let whereClause = ` WHERE OrderId = @orderId`;
        
        switch (newState) {
            case 'Approved':
                query += `, ApprovedAt = GETUTCDATE()`;
                whereClause += ` AND State = 'Pending'`;
                break;
            case 'Shipped':
                query += `, ShippedAt = GETUTCDATE()`;
                whereClause += ` AND State = 'Approved'`;
                break;
            case 'Cancelled':
                whereClause += ` AND State = 'Pending'`;
                break;
            default:
                return 0;
        }
        
        const request = pool.request()
            .input('orderId', sql.Int, orderId)
            .input('newState', sql.NVarChar, newState);

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