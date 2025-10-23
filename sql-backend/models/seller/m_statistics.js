const sql = require("mssql");
const { getPool } = require("../../routes/config");

function getDateRanges(period) {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999); 

    let startDate = new Date(endDate);
    startDate.setHours(0, 0, 0, 0); 

    let periodLengthDays = 30;

    switch (period) {
        case 'today':
            periodLengthDays = 1;
            break;
        case '7days':
            periodLengthDays = 7;
            startDate.setDate(startDate.getDate() - 6);
            break;
        case '3months':
            startDate.setMonth(startDate.getMonth() - 3);
            break;
        case '6months':
            startDate.setMonth(startDate.getMonth() - 6);
            break;
        case '1year':
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
        case '30days':
        default:
            periodLengthDays = 30;
            startDate.setDate(startDate.getDate() - 29);
            break;
    }

    const prevEndDate = new Date(startDate);
    prevEndDate.setDate(prevEndDate.getDate() - 1);
    prevEndDate.setHours(23, 59, 59, 999);

    const prevStartDate = new Date(prevEndDate);
    prevStartDate.setHours(0, 0, 0, 0);

    if (period === 'today' || period === '7days' || period === '30days') {
        prevStartDate.setDate(prevStartDate.getDate() - (periodLengthDays - 1));
    } else if (period === '3months') {
        prevStartDate.setMonth(prevStartDate.getMonth() - 3);
    } else if (period === '6months') {
        prevStartDate.setMonth(prevStartDate.getMonth() - 6);
    } else if (period === '1year') {
        prevStartDate.setFullYear(prevStartDate.getFullYear() - 1);
    }

    return { startDate, endDate, prevStartDate, prevEndDate };
}

function calculateTrend(current, previous) {
    if (previous === 0) {
        return current > 0 ? 100.0 : 0.0;
    }
    const trend = (((current - previous) / previous) * 100);
    return parseFloat(trend.toFixed(1));
}

async function getFullSellerStatistics(sellerId, period) {
    try {
        const pool = await getPool();
        const { startDate, endDate, prevStartDate, prevEndDate } = getDateRanges(period);
        const summaryQuery = `
            SELECT
                ISNULL(SUM(OI.LineTotal), 0) AS totalRevenue,
                COUNT(DISTINCT O.OrderId) AS totalOrders,
                ISNULL(SUM(OI.Quantity), 0) AS productsSold
            FROM OrderProduct O JOIN OrderItem OI ON O.OrderId = OI.OrderId
            WHERE OI.SellerId = @sellerId AND O.State = 'Delivered' AND O.DeliveredAt BETWEEN @startDate AND @endDate;
        `;

        const newCustomersQuery = `
            WITH FirstOrder AS (
                SELECT O.CustomerId, MIN(O.DeliveredAt) as FirstDeliveredDate
                FROM OrderProduct O JOIN OrderItem OI ON O.OrderId = OI.OrderId
                WHERE OI.SellerId = @sellerId AND O.State = 'Delivered'
                GROUP BY O.CustomerId
            )
            SELECT COUNT(CustomerId) AS newCustomers FROM FirstOrder
            WHERE FirstDeliveredDate BETWEEN @startDate AND @endDate;
        `;
        
        const [
            summaryData,
            prevSummaryData,
            newCustomersData,
            prevNewCustomersData,
            dailyChartData,
            categoryData,
            topProductsData
        ] = await Promise.all([
            pool.request().input('sellerId', sql.Int, sellerId).input('startDate', sql.DateTime2, startDate).input('endDate', sql.DateTime2, endDate).query(summaryQuery),
            pool.request().input('sellerId', sql.Int, sellerId).input('startDate', sql.DateTime2, prevStartDate).input('endDate', sql.DateTime2, prevEndDate).query(summaryQuery),
            pool.request().input('sellerId', sql.Int, sellerId).input('startDate', sql.DateTime2, startDate).input('endDate', sql.DateTime2, endDate).query(newCustomersQuery),
            pool.request().input('sellerId', sql.Int, sellerId).input('startDate', sql.DateTime2, prevStartDate).input('endDate', sql.DateTime2, prevEndDate).query(newCustomersQuery),
            pool.request()
                .input('sellerId', sql.Int, sellerId).input('startDate', sql.DateTime2, startDate).input('endDate', sql.DateTime2, endDate)
                .query(`
                    SELECT CAST(O.DeliveredAt AS DATE) AS DateKey, SUM(OI.LineTotal) AS TotalRevenue, COUNT(DISTINCT O.OrderId) AS TotalOrders
                    FROM OrderProduct O JOIN OrderItem OI ON O.OrderId = OI.OrderId
                    WHERE OI.SellerId = @sellerId AND O.State = 'Delivered' AND O.DeliveredAt BETWEEN @startDate AND @endDate
                    GROUP BY CAST(O.DeliveredAt AS DATE) ORDER BY DateKey;
                `),

            pool.request()
                .input('sellerId', sql.Int, sellerId).input('startDate', sql.DateTime2, startDate).input('endDate', sql.DateTime2, endDate)
                .query(`
                    SELECT P.Category, SUM(OI.LineTotal) AS TotalRevenue
                    FROM OrderItem OI JOIN Product P ON OI.ProductId = P.ProductId JOIN OrderProduct O ON OI.OrderId = O.OrderId
                    WHERE OI.SellerId = @sellerId AND O.State = 'Delivered' AND O.DeliveredAt BETWEEN @startDate AND @endDate
                    GROUP BY P.Category;
                `),

            pool.request()
                .input('sellerId', sql.Int, sellerId).input('startDate', sql.DateTime2, startDate).input('endDate', sql.DateTime2, endDate)
                .query(`
                    SELECT TOP 10
                        P.NameProduct AS name, P.Category AS category, SUM(OI.Quantity) AS sold, SUM(OI.LineTotal) AS revenue,
                        (SELECT AVG(CAST(Rating AS FLOAT)) FROM Review R WHERE R.ProductId = P.ProductId) AS rating
                    FROM OrderItem OI JOIN Product P ON OI.ProductId = P.ProductId JOIN OrderProduct O ON OI.OrderId = O.OrderId
                    WHERE OI.SellerId = @sellerId AND O.State = 'Delivered' AND O.DeliveredAt BETWEEN @startDate AND @endDate
                    GROUP BY P.ProductId, P.NameProduct, P.Category ORDER BY sold DESC;
                `)
        ]);

        const currentSummary = summaryData.recordset[0];
        const prevSummary = prevSummaryData.recordset[0];
        const newCustomers = newCustomersData.recordset[0].newCustomers;
        const prevNewCustomers = prevNewCustomersData.recordset[0].newCustomers;
        
        const summary = {
            totalRevenue: currentSummary.totalRevenue, revenueTrend: calculateTrend(currentSummary.totalRevenue, prevSummary.totalRevenue),
            totalOrders: currentSummary.totalOrders, ordersTrend: calculateTrend(currentSummary.totalOrders, prevSummary.totalOrders),
            productsSold: currentSummary.productsSold, productsTrend: calculateTrend(currentSummary.productsSold, prevSummary.productsSold),
            newCustomers: newCustomers, customersTrend: calculateTrend(newCustomers, prevNewCustomers)
        };
        
        const revenueChart = {
            labels: dailyChartData.recordset.map(d => new Date(d.DateKey).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })),
            revenue: dailyChartData.recordset.map(d => parseFloat((d.TotalRevenue / 1000000).toFixed(2))),
            orders: dailyChartData.recordset.map(d => d.TotalOrders)
        };

        const categoryChart = {
            labels: categoryData.recordset.map(c => c.Category),
            data: categoryData.recordset.map(c => c.TotalRevenue)
        };
        
        const weeklyData = {};
        dailyChartData.recordset.forEach(day => {
            const date = new Date(day.DateKey);
            const dayOfWeek = date.getDay();
            const weekStartDate = new Date(date);
            weekStartDate.setDate(date.getDate() - dayOfWeek);
            const weekLabel = `Tuần ${weekStartDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`;

            if (!weeklyData[weekLabel]) weeklyData[weekLabel] = 0;
            weeklyData[weekLabel] += day.TotalRevenue;
        });
        const weeklyChart = {
            labels: Object.keys(weeklyData),
            data: Object.values(weeklyData).map(v => parseFloat((v / 1000000).toFixed(2)))
        };

        const topProducts = topProductsData.recordset.map((p, index) => ({
            rank: index + 1, ...p, rating: p.rating ? parseFloat(p.rating.toFixed(1)) : 0
        }));

        return { summary, revenueChart, categoryChart, weeklyChart, topProducts };
    } catch (err) {
        console.error("Lỗi khi lấy dữ liệu thống kê đầy đủ cho người bán:", err);
        throw err;
    }
}

module.exports = {
    getSellerStatistics: getFullSellerStatistics
};