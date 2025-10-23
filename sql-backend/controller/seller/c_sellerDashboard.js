const dashboardModel = require("../../models/seller/m_sellerDashboard");

async function getDashboardData(sellerId) {
    if (isNaN(sellerId)) {
        throw new Error("Seller ID không hợp lệ.");
    }
    return await dashboardModel.getSellerDashboardData(sellerId);
}

module.exports = {
    getDashboardData
};