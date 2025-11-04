const sql = require("mssql");
const { getPool } = require("../../routes/config");

function calculateTrend(current, previous) {
    if (previous === 0) {
        return current > 0 ? 100.0 : 0.0;
    }
    const trend = ((current - previous) / previous) * 100;
    return parseFloat(trend.toFixed(1));
}

async function getSellerDashboardData(sellerId) {
    try {
        const pool = await getPool();

        const sellerInfoResult = await pool.request()
            .input('sellerId', sql.Int, sellerId)
            .query(`SELECT TOP 1 FullName FROM SellerProfile WHERE SellerId = @sellerId;`);
        const sellerName = sellerInfoResult.recordset[0]?.FullName || 'Seller';

        const now = new Date();
        const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const startOfTwoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        const thirtyDaysAgo = new Date(new Date().setDate(now.getDate() - 30));

        const request = pool.request()
            .input('sellerId', sql.Int, sellerId)
            .input('startOfCurrentMonth', sql.DateTime2, startOfCurrentMonth)
            .input('startOfPreviousMonth', sql.DateTime2, startOfPreviousMonth)
            .input('startOfTwoMonthsAgo', sql.DateTime2, startOfTwoMonthsAgo)
            .input('thirtyDaysAgo', sql.DateTime2, thirtyDaysAgo);

        const statsResult = await request.query(`
            -- Tính doanh thu và đơn hàng tháng này và tháng trước
            SELECT 
                ISNULL(SUM(CASE WHEN O.OrderDate >= @startOfCurrentMonth THEN OI.LineTotal ELSE 0 END), 0) AS CurrentMonthRevenue,
                COUNT(DISTINCT CASE WHEN O.OrderDate >= @startOfCurrentMonth THEN O.OrderId ELSE NULL END) AS CurrentMonthOrders,
                ISNULL(SUM(CASE WHEN O.OrderDate >= @startOfPreviousMonth AND O.OrderDate < @startOfCurrentMonth THEN OI.LineTotal ELSE 0 END), 0) AS PreviousMonthRevenue,
                COUNT(DISTINCT CASE WHEN O.OrderDate >= @startOfPreviousMonth AND O.OrderDate < @startOfCurrentMonth THEN O.OrderId ELSE NULL END) AS PreviousMonthOrders
            FROM OrderProduct O 
            JOIN OrderItem OI ON O.OrderId = OI.OrderId
            WHERE OI.SellerId = @sellerId AND O.State = 'Delivered' AND O.OrderDate >= @startOfTwoMonthsAgo;

            SELECT 
                (SELECT COUNT(*) FROM Product WHERE SellerId = @sellerId AND Quantity > 0) AS TotalProducts,
                (SELECT COUNT(DISTINCT O.OrderId) FROM OrderProduct O JOIN OrderItem OI ON O.OrderId = OI.OrderId WHERE OI.SellerId = @sellerId AND O.State = 'Pending') AS PendingOrders,
                -- Sửa lỗi: Đếm sản phẩm mới dựa trên cột CreatedAt
                (SELECT COUNT(*) FROM Product WHERE SellerId = @sellerId AND CreatedAt >= @thirtyDaysAgo) AS NewProducts;
        `);

        const periodStats = statsResult.recordsets[0][0] || { CurrentMonthRevenue: 0, CurrentMonthOrders: 0, PreviousMonthRevenue: 0, PreviousMonthOrders: 0 };
        const otherStats = statsResult.recordsets[1][0] || { TotalProducts: 0, PendingOrders: 0, NewProducts: 0 };

        const revenueTrend = calculateTrend(periodStats.CurrentMonthRevenue, periodStats.PreviousMonthRevenue);
        const ordersTrend = calculateTrend(periodStats.CurrentMonthOrders, periodStats.PreviousMonthOrders);

        const recentOrdersResult = await request.query(`
            WITH OrderDetails AS (
                SELECT
                    O.OrderId, O.State, O.OrderDate, C.FullName AS CustomerName,
                    P.NameProduct, OI.Quantity, OI.LineTotal,
                    ROW_NUMBER() OVER(PARTITION BY O.OrderId ORDER BY OI.LineTotal DESC) as rn
                FROM OrderProduct O
                JOIN CustomerProfile C ON O.CustomerId = C.CustomerId
                JOIN OrderItem OI ON O.OrderId = OI.OrderId
                JOIN Product P ON OI.ProductId = P.ProductId
                WHERE OI.SellerId = @sellerId
            )
            SELECT TOP 5
                od.OrderId, od.State, od.CustomerName,
                (SELECT TOP 1 NameProduct FROM OrderDetails WHERE OrderId = od.OrderId AND rn = 1) + '...' AS TopItem,
                SUM(od.Quantity) AS TotalQtyForSeller,
                SUM(od.LineTotal) AS SellerTotalAmount
            FROM OrderDetails od
            GROUP BY od.OrderId, od.State, od.CustomerName, od.OrderDate
            ORDER BY od.OrderDate DESC;
        `);
        const recentOrders = recentOrdersResult.recordset.map(order => ({
            id: order.OrderId, displayId: 'DH' + String(order.OrderId).padStart(3, '0'), product: order.TopItem || 'N/A',
            customer: order.CustomerName, qty: order.TotalQtyForSeller, total: order.SellerTotalAmount, status: order.State.toLowerCase()
        }));

        const topProductsResult = await request.query(`
            SELECT TOP 5 P.ProductId, P.NameProduct, SUM(OI.Quantity) AS TotalSold
            FROM OrderItem OI JOIN Product P ON OI.ProductId = P.ProductId
            WHERE OI.SellerId = @sellerId
            GROUP BY P.ProductId, P.NameProduct ORDER BY TotalSold DESC;
        `);
        const topProducts = topProductsResult.recordset.map((item, index) => ({
            id: item.ProductId, name: item.NameProduct, sold: item.TotalSold,
            badge: index === 0 ? '🥇 Top 1' : index === 1 ? '🥈 Top 2' : `Top ${index + 1}`
        }));

        const notifications = [];
        if (otherStats.PendingOrders > 0) {
            notifications.push({ type: 'warning', icon: 'exclamation-circle', title: 'Đơn hàng mới', message: `Bạn có ${otherStats.PendingOrders} đơn hàng mới cần xác nhận.`, time: 'Vài phút trước', link: 'orders_page.html' });
        }
        
        return {
            seller: { name: sellerName },
            stats: {
                monthRevenue: periodStats.CurrentMonthRevenue,
                revenueTrend: revenueTrend,
                monthOrders: periodStats.CurrentMonthOrders,
                ordersTrend: ordersTrend,
                totalProducts: otherStats.TotalProducts,
                newProducts: otherStats.NewProducts,
                pendingOrders: otherStats.PendingOrders
            },
            recentOrders,
            topProducts,
            notifications: notifications.slice(0, 3)
        };
    } catch (err) {
        console.error("SQL error in getSellerDashboardData:", err);
        throw new Error("Lỗi khi lấy dữ liệu Seller Dashboard từ cơ sở dữ liệu. Vui lòng kiểm tra log server.");
    }
}

module.exports = {
    getSellerDashboardData,
};