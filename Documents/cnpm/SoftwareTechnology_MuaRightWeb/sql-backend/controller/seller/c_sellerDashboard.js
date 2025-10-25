const dashboardModel = require("../../models/seller/m_sellerDashboard");

/**
 * Xử lý logic lấy dữ liệu dashboard và trả về kết quả
 */
async function getDashboardData(sellerId) {
    if (isNaN(sellerId)) {
        throw new Error("Seller ID không hợp lệ.");
    }
    return await dashboardModel.getSellerDashboardData(sellerId);
}

/**
 * Xử lý logic xác nhận đơn hàng
 */
async function confirmOrder(orderId) {
    if (isNaN(orderId)) {
        throw new Error("Order ID không hợp lệ.");
    }
    const success = await dashboardModel.confirmOrder(orderId);
    if (!success) {
        throw new Error(`Không tìm thấy đơn hàng #${orderId} ở trạng thái Pending, hoặc đơn hàng đã được xử lý.`);
    }
    return { success: true, message: `Đã xác nhận đơn hàng #${orderId} thành công!` };
}
/**
 * Xử lý logic lấy chi tiết đơn hàng
 */
async function getOrderDetails(orderId, sellerId) {
    if (isNaN(orderId) || orderId <= 0) {
        throw new Error("Order ID không hợp lệ.");
    }
    if (isNaN(sellerId) || sellerId <= 0) {
        throw new Error("Seller ID không hợp lệ.");
    }
    
    const orderData = await dashboardModel.getSellerOrderDetails(orderId, sellerId);
    if (!orderData) {
        throw new Error(`Không tìm thấy đơn hàng #${orderId} hoặc bạn không có quyền xem đơn hàng này.`);
    }
    return orderData;
}
module.exports = {
    getDashboardData,
    confirmOrder,
    getOrderDetails 
};