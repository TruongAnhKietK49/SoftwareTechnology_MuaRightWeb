const sql = require("mssql");
const { getPool } = require("../../routes/config");

/**
 * Lấy dữ liệu Dashboard cho Seller
 * @param {number} sellerId ID của người bán
 * @returns {Promise<object>} Dữ liệu thống kê, đơn hàng, top sản phẩm
 */
async function getSellerDashboardData(sellerId) {
    try {
        const pool = await getPool();

        // 1. Lấy Tên Seller
        const sellerInfo = await pool.request()
            .input('sellerId', sql.Int, sellerId)
            .query(`
                SELECT TOP 1 FullName
                FROM SellerProfile
                WHERE SellerId = @sellerId;
            `);
        const sellerName = sellerInfo.recordset[0] ? sellerInfo.recordset[0].FullName : 'Seller';

        // 2. Lấy Thống kê tổng quan
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const statsResult = await pool.request()
            .input('sellerId', sql.Int, sellerId)
            .input('thirtyDaysAgo', sql.DateTime2, thirtyDaysAgo)
            .query(`
                -- Doanh thu và Đơn hàng trong 30 ngày qua
                SELECT 
                    ISNULL(SUM(OI.LineTotal), 0) AS MonthRevenue,
                    COUNT(DISTINCT O.OrderId) AS MonthOrders
                FROM OrderProduct O
                JOIN OrderItem OI ON O.OrderId = OI.OrderId
                WHERE OI.SellerId = @sellerId 
                    AND O.State IN ('Confirmed', 'Shipping', 'Delivered') 
                    AND O.OrderDate >= @thirtyDaysAgo;
                
                -- Tổng sản phẩm đang bán (số lượng > 0)
                SELECT COUNT(*) AS TotalProducts
                FROM Product
                WHERE SellerId = @sellerId AND Quantity > 0;

                -- Đơn hàng chờ xử lý
                SELECT COUNT(DISTINCT O.OrderId) AS PendingOrders
                FROM OrderProduct O
                JOIN OrderItem OI ON O.OrderId = OI.OrderId
                WHERE OI.SellerId = @sellerId AND O.State = 'Pending';
            `);

        const monthlyStats = statsResult.recordsets[0][0];
        const totalProducts = statsResult.recordsets[1][0].TotalProducts;
        const pendingOrders = statsResult.recordsets[2][0].PendingOrders;

        // 3. Đơn hàng gần đây (5 đơn hàng mới nhất của Seller)
        const recentOrdersResult = await pool.request()
            .input('sellerId', sql.Int, sellerId)
            .query(`
                SELECT TOP 5 
                    O.OrderId, 
                    O.OrderDate, 
                    O.State,
                    C.FullName AS CustomerName,
                    (
                        SELECT TOP 1 P.NameProduct + ' (x' + CAST(OI.Quantity AS NVARCHAR) + ')'
                        FROM OrderItem OI
                        JOIN Product P ON OI.ProductId = P.ProductId
                        WHERE OI.OrderId = O.OrderId AND OI.SellerId = @sellerId
                    ) AS TopItem,
                    (
                        SELECT SUM(OI.Quantity) 
                        FROM OrderItem OI
                        WHERE OI.OrderId = O.OrderId AND OI.SellerId = @sellerId
                    ) AS TotalQtyForSeller,
                    -- UPDATED: Tính tổng tiền chính xác cho seller trong đơn hàng này
                    (
                        SELECT SUM(OI_sub.LineTotal)
                        FROM OrderItem OI_sub
                        WHERE OI_sub.OrderId = O.OrderId AND OI_sub.SellerId = @sellerId
                    ) AS SellerTotalAmount
                FROM OrderProduct O
                JOIN CustomerProfile C ON O.CustomerId = C.CustomerId
                -- Đảm bảo chỉ lấy những đơn hàng có sản phẩm của seller này
                WHERE EXISTS (
                    SELECT 1 FROM OrderItem OI_filter 
                    WHERE OI_filter.OrderId = O.OrderId AND OI_filter.SellerId = @sellerId
                )
                ORDER BY O.OrderDate DESC;
            `);
        
        const recentOrders = recentOrdersResult.recordset.map(order => ({
            id: 'DH' + String(order.OrderId).padStart(3, '0'),
            product: order.TopItem || 'N/A',
            customer: order.CustomerName,
            qty: order.TotalQtyForSeller,
            total: order.SellerTotalAmount, // Sử dụng tổng tiền đã được tính lại
            status: order.State.toLowerCase()
        }));

        // 4. Top 5 sản phẩm bán chạy nhất
        const topProductsResult = await pool.request()
            .input('sellerId', sql.Int, sellerId)
            .query(`
                SELECT TOP 5
                    P.NameProduct,
                    SUM(OI.Quantity) AS TotalSold
                FROM OrderItem OI
                JOIN Product P ON OI.ProductId = P.ProductId
                WHERE OI.SellerId = @sellerId
                GROUP BY P.NameProduct
                ORDER BY TotalSold DESC;
            `);
        
        const topProducts = topProductsResult.recordset.map((item, index) => ({
            name: item.NameProduct,
            sold: item.TotalSold,
            badge: index === 0 ? '🥇 Top 1' : index === 1 ? '🥈 Top 2' : index === 2 ? '🥉 Top 3' : `Top ${index + 1}`
        }));

        return {
            seller: {
                name: sellerName,
            },
            stats: {
                monthRevenue: monthlyStats.MonthRevenue,
                revenueTrend: 12.5, // Dữ liệu giả, cần logic phức tạp hơn
                monthOrders: monthlyStats.MonthOrders,
                ordersTrend: 8.2, // Dữ liệu giả
                totalProducts: totalProducts,
                newProducts: 2, // Dữ liệu giả
                pendingOrders: pendingOrders
            },
            recentOrders: recentOrders,
            topProducts: topProducts,
            notifications: [ // Dữ liệu giả
                { type: 'warning', icon: 'exclamation-circle', title: 'Đơn hàng mới', message: `Bạn có ${pendingOrders} đơn hàng mới cần xác nhận`, time: 'Vài phút trước' },
                { type: 'info', icon: 'box', title: 'Sản phẩm sắp hết hàng', message: 'Kiểm tra kho hàng của bạn ngay', time: '1 giờ trước' },
                { type: 'success', icon: 'star', title: 'Đánh giá tích cực', message: 'Sản phẩm của bạn vừa nhận đánh giá 5 sao', time: 'Hôm qua' }
            ]
        };
    } catch (err) {
        console.error("SQL error in getSellerDashboardData:", err);
        throw new Error("Lỗi khi lấy dữ liệu Seller Dashboard từ cơ sở dữ liệu.");
    }
}

/**
 * Cập nhật trạng thái OrderProduct sang Confirmed
 * @param {number} orderId ID của đơn hàng
 * @returns {Promise<boolean>} Kết quả cập nhật
 */
async function confirmOrder(orderId) {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('orderId', sql.Int, orderId)
            .input('newState', sql.NVarChar, 'Confirmed')
            .input('approvedAt', sql.DateTime2, new Date())
            .query(`
                UPDATE OrderProduct
                SET State = @newState, ApprovedAt = @approvedAt
                WHERE OrderId = @orderId AND State = 'Pending';
            `);
        
        return result.rowsAffected[0] > 0;
    } catch (err) {
        console.error("SQL error in confirmOrder:", err);
        throw new Error("Lỗi khi xác nhận đơn hàng trong cơ sở dữ liệu.");
    }
}

/**
 * Lấy thông tin chi tiết của một đơn hàng cho một người bán cụ thể
 * @param {number} orderId ID của đơn hàng
 * @param {number} sellerId ID của người bán (để đảm bảo bảo mật)
 * @returns {Promise<object|null>} Chi tiết đơn hàng hoặc null nếu không tìm thấy
 */
async function getSellerOrderDetails(orderId, sellerId) {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('orderId', sql.Int, orderId)
            .input('sellerId', sql.Int, sellerId)
            .query(`
                -- 1. Lấy thông tin chung của đơn hàng và khách hàng
                SELECT 
                    O.OrderId,
                    O.OrderDate,
                    O.State,
                    O.ShippingAddress,
                    O.PaymentMethod,
                    C.FullName AS CustomerName,
                    C.PhoneNumber AS CustomerPhone,
                    C.Email AS CustomerEmail,
                    (SELECT SUM(LineTotal) FROM OrderItem WHERE OrderId = @orderId AND SellerId = @sellerId) AS SellerTotalAmount
                FROM OrderProduct O
                JOIN CustomerProfile C ON O.CustomerId = C.CustomerId
                WHERE O.OrderId = @orderId 
                  AND EXISTS (SELECT 1 FROM OrderItem WHERE OrderId = O.OrderId AND SellerId = @sellerId);

                -- 2. Lấy danh sách sản phẩm trong đơn hàng thuộc về người bán này
                SELECT
                    P.NameProduct,
                    P.ImageURL,
                    OI.Quantity,
                    OI.Price,
                    OI.LineTotal
                FROM OrderItem OI
                JOIN Product P ON OI.ProductId = P.ProductId
                WHERE OI.OrderId = @orderId AND OI.SellerId = @sellerId;
            `);

        if (result.recordsets[0].length === 0) {
            return null; // Không tìm thấy đơn hàng hoặc seller không sở hữu đơn hàng này
        }

        const orderDetails = result.recordsets[0][0];
        const productItems = result.recordsets[1];

        return {
            details: orderDetails,
            products: productItems
        };

    } catch (err) {
        console.error("SQL error in getSellerOrderDetails:", err);
        throw new Error("Lỗi khi lấy chi tiết đơn hàng từ cơ sở dữ liệu.");
    }
}

async function getSellerOrderDetails(orderId, sellerId) {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('orderId', sql.Int, orderId)
            .input('sellerId', sql.Int, sellerId)
            .query(`
                -- Query 1: Lấy thông tin chung của đơn hàng và khách hàng
                SELECT 
                    O.OrderId,
                    O.OrderDate,
                    O.State,
                    O.ShipAddress, -- CORRECTED: Dùng ShipAddress thay vì ShippingAddress
                    C.FullName AS CustomerName,
                    A.Phone AS CustomerPhone, -- CORRECTED: Lấy từ bảng Account
                    A.Email AS CustomerEmail, -- CORRECTED: Lấy từ bảng Account
                    (SELECT SUM(LineTotal) FROM OrderItem WHERE OrderId = @orderId AND SellerId = @sellerId) AS SellerTotalAmount
                FROM OrderProduct O
                JOIN CustomerProfile C ON O.CustomerId = C.CustomerId
                JOIN Account A ON C.CustomerId = A.AccountId -- ADDED JOIN: Thêm join đến bảng Account
                WHERE O.OrderId = @orderId 
                  AND EXISTS (SELECT 1 FROM OrderItem WHERE OrderId = O.OrderId AND SellerId = @sellerId);

                -- Query 2: Lấy danh sách sản phẩm trong đơn hàng thuộc về người bán này
                SELECT
                    P.NameProduct,
                    P.ImageUrl, -- CORRECTED: Dùng ImageUrl (chữ 'u' thường)
                    OI.Quantity,
                    OI.UnitPrice, -- CORRECTED: Dùng UnitPrice thay vì Price
                    OI.LineTotal
                FROM OrderItem OI
                JOIN Product P ON OI.ProductId = P.ProductId
                WHERE OI.OrderId = @orderId AND OI.SellerId = @sellerId;
            `);

        if (result.recordsets[0].length === 0) {
            return null; 
        }

        const orderDetails = result.recordsets[0][0];
        const productItems = result.recordsets[1];
        
        // Chuyển đổi tên cột để khớp với những gì frontend mong đợi
        const mappedProducts = productItems.map(p => ({
            NameProduct: p.NameProduct,
            ImageURL: p.ImageUrl, 
            Quantity: p.Quantity,
            Price: p.UnitPrice, 
            LineTotal: p.LineTotal
        }));

        orderDetails.ShippingAddress = orderDetails.ShipAddress;
        delete orderDetails.ShipAddress;


        return {
            details: orderDetails,
            products: mappedProducts
        };

    } catch (err) {
        console.error("SQL error in getSellerOrderDetails:", err);
        throw new Error("Lỗi khi lấy chi tiết đơn hàng từ cơ sở dữ liệu.");
    }
}


module.exports = {
    getSellerDashboardData,
    confirmOrder,
    getSellerOrderDetails
};