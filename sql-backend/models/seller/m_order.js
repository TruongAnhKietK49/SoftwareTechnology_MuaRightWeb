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
            SELECT
                O.OrderId, O.OrderDate, O.TotalAmount, O.State,
                CP.FullName AS CustomerName, A.Phone AS CustomerPhone,
                SP.FullName AS ShipperName,
                SUM(OI.LineTotal) AS SellerTotalAmount, -- Tính tổng trực tiếp
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

        query += `
            GROUP BY O.OrderId, O.OrderDate, O.TotalAmount, O.State, CP.FullName, A.Phone, SP.FullName
            ORDER BY O.OrderDate DESC;
        `;

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
                    V.Code AS VoucherCode, V.DiscountType, V.DiscountVal,

                    SP.StoreName,
                    SP.StoreAddress
                FROM OrderProduct O
                JOIN CustomerProfile CP ON O.CustomerId = CP.CustomerId
                -- THÊM JOIN VÀO BẢNG SELLERPROFILE --
                JOIN SellerProfile SP ON SP.SellerId = @sellerId
                LEFT JOIN Voucher V ON O.VoucherId = V.VoucherId
                WHERE O.OrderId = @orderId AND EXISTS (
                    SELECT 1 FROM OrderItem OI WHERE OI.OrderId = O.OrderId AND OI.SellerId = @sellerId
                );
            `);

        if (!orderInfo.recordset || orderInfo.recordset.length === 0) return null;
        const orderHeader = orderInfo.recordset[0];

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

    } catch (err)
    {
        console.error("Lỗi khi lấy chi tiết đơn hàng:", err);
        throw err;
    }
}


/**
 * Cập nhật trạng thái OrderProduct
 */
async function updateOrderStatus(orderId, newState, sellerId) { 
    try {
        const pool = await getPool();
        let query = `UPDATE OrderProduct SET State = @newState, UpdatedAt = GETUTCDATE()`;

        let whereClause = `
            WHERE OrderId = @orderId 
            AND EXISTS (SELECT 1 FROM OrderItem WHERE OrderId = @orderId AND SellerId = @sellerId)
        `;
        
        switch (newState) {
            case 'Approved':
                query += `, ApprovedAt = GETUTCDATE()`;
                whereClause += ` AND State = 'Pending'`;
                break;
            case 'Shipped':
                query += `, ShippedAt = GETUTCDATE()`;
                whereClause += ` AND State = 'Approved'`;
                break;
            case 'Delivered':
                query += `, DeliveredAt = GETUTCDATE()`;
                whereClause += ` AND State = 'Shipped'`;
                break;
            case 'Cancelled':
                whereClause += ` AND State = 'Pending'`;
                break;
            default:
                return 0;
        }
        
        const request = pool.request()
            .input('orderId', sql.Int, orderId)
            .input('newState', sql.NVarChar, newState)
            .input('sellerId', sql.Int, sellerId);

        const result = await request.query(query + whereClause);
        return result.rowsAffected[0] > 0;
    } catch (err) {
        console.error("Lỗi khi cập nhật trạng thái đơn hàng:", err);
        throw err;
    }
}

async function bulkUpdateOrderStatus(orderIds, action, sellerId) {
    try {
        const pool = await getPool();
        const request = pool.request();

        const idParams = orderIds.map((id, index) => `@id${index}`).join(',');
        orderIds.forEach((id, index) => {
            request.input(`id${index}`, sql.Int, id);
        });

        let query = `UPDATE OrderProduct SET State = @action, UpdatedAt = GETUTCDATE()`;

        let whereClause = `
            WHERE OrderId IN (${idParams})
            AND EXISTS (SELECT 1 FROM OrderItem WHERE OrderId = OrderProduct.OrderId AND SellerId = @sellerId)
        `;

        switch (action) {
            case 'Approved':
                query += `, ApprovedAt = GETUTCDATE()`;
                whereClause += ` AND State = 'Pending'`; 
                break;
            case 'Cancelled':
                whereClause += ` AND State = 'Pending'`; 
                break;
            case 'Shipped':
                query += `, ShippedAt = GETUTCDATE()`;
                whereClause += ` AND State = 'Approved'`; 
                break;
            default:
                return 0; 
        }

        request.input('action', sql.NVarChar, action);
        request.input('sellerId', sql.Int, sellerId);

        const result = await request.query(query + whereClause);
        return result.rowsAffected[0];
    } catch (err) {
        console.error("Lỗi khi cập nhật trạng thái hàng loạt:", err);
        throw err;
    }
}

module.exports = {
    getSellerOrders,
    getOrderDetail,
    updateOrderStatus,
    bulkUpdateOrderStatus
};