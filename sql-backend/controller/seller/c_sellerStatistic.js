const statisticModel = require("../../models/seller/m_statistics");

/**
 * Lấy dữ liệu thống kê theo thời gian
 */
async function getStatistics(sellerId, options) { 
    if (isNaN(sellerId)) {
        throw new Error("Seller ID không hợp lệ.");
    }
    return await statisticModel.getSellerStatistics(sellerId, options); 
}

module.exports = {
    getStatistics
};