const sql = require("mssql");
const { getPool } = require("../../routes/config");

/**
 * Lấy dữ liệu thống kê theo ngày/tháng cho Seller
 * @param {number} sellerId ID của người bán
 * @param {string} period '1month', '3months', '6months', '1year'
 * @returns {Promise<Array>} Danh sách dữ liệu thống kê theo ngày/tháng
 */
async function getSellerStatistics(sellerId, period) {
    try {
        const pool = await getPool();
        let endDate = new Date();
        let startDate = new Date();
        
        // Thiết lập ngày bắt đầu dựa trên period
        switch (period) {
            case '3months': startDate.setMonth(startDate.getMonth() - 3); break;
            case '6months': startDate.setMonth(startDate.getMonth() - 6); break;
            case '1year': startDate.setFullYear(startDate.getFullYear() - 1); break;
            case '1month': 
            default: startDate.setDate(startDate.getDate() - 30); break;
        }

        // Đặt giờ về 0:00:00 cho startDate
        startDate.setHours(0, 0, 0, 0);

        // Lấy dữ liệu doanh thu và số lượng đơn hàng theo ngày (chỉ tính đơn đã giao)
        const result = await pool.request()
            .input('sellerId', sql.Int, sellerId)
            .input('startDate', sql.DateTime2, startDate)
            .input('endDate', sql.DateTime2, endDate)
            .query(`
                SELECT 
                    CAST(O.DeliveredAt AS DATE) AS DateKey,
                    SUM(OI.LineTotal) AS TotalRevenue,
                    COUNT(DISTINCT O.OrderId) AS TotalOrders
                FROM OrderProduct O
                JOIN OrderItem OI ON O.OrderId = OI.OrderId
                WHERE OI.SellerId = @sellerId 
                    AND O.State = 'Delivered' 
                    AND O.DeliveredAt >= @startDate
                    AND O.DeliveredAt <= @endDate
                GROUP BY CAST(O.DeliveredAt AS DATE)
                ORDER BY DateKey;
            `);

        return result.recordset;
    } catch (err) {
        console.error("Lỗi khi lấy dữ liệu thống kê:", err);
        throw err;
    }
}

module.exports = {
    getSellerStatistics
};