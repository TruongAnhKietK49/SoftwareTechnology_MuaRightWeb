// File: c_sellerOrder.js 
const orderModel = require("../../models/seller/m_order");

const ALLOWED_UPDATE_STATES = ['Approved', 'Shipped', 'Delivered'];

/**
 * Lấy danh sách đơn hàng theo trạng thái
 */
async function getOrders(sellerId, state) {
    if (isNaN(sellerId)) {
        throw new Error("Seller ID không hợp lệ.");
    }
    // Không cần map nữa, state từ frontend đã đúng chuẩn
    return await orderModel.getSellerOrders(sellerId, state);
}

/**
 * Lấy chi tiết đơn hàng (Dùng cho Modal)
 */
async function getOrderDetail(orderId, sellerId) {
    if (isNaN(orderId) || isNaN(sellerId)) {
        throw new Error("ID đơn hàng hoặc ID người bán không hợp lệ.");
    }
    const detail = await orderModel.getOrderDetail(orderId, sellerId);
    if (!detail) {
        throw new Error("Không tìm thấy đơn hàng hoặc bạn không có quyền xem đơn hàng này.");
    }
    return detail;
}

/**
 * Cập nhật trạng thái đơn hàng chung (Approved, Shipped, Delivered)
 */
async function updateOrderState(orderId, newState) {
    if (isNaN(orderId)) {
        throw new Error("Order ID không hợp lệ.");
    }

    if (!ALLOWED_UPDATE_STATES.includes(newState)) {
        throw new Error(`Trạng thái cập nhật '${newState}' không hợp lệ.`);
    }

    const success = await orderModel.updateOrderStatus(orderId, newState);

    if (!success) {
        throw new Error(`Không thể cập nhật. Đơn hàng #${orderId} có thể không ở trạng thái hợp lệ để chuyển sang '${newState}'.`);
    }
    return { success: true, message: `Đã cập nhật đơn hàng #${orderId} sang trạng thái '${newState}'!` };
}

/**
 * Hủy đơn hàng (Chỉ từ Pending -> Cancelled)
 */
async function cancelOrder(orderId, cancelReason) {
    if (isNaN(orderId)) {
        throw new Error("Order ID không hợp lệ.");
    }
    if (!cancelReason || !cancelReason.trim()) {
        throw new Error("Lý do hủy đơn hàng là bắt buộc.");
    }

    const success = await orderModel.updateOrderStatus(orderId, 'Cancelled', cancelReason);

    if (!success) {
        throw new Error(`Không thể hủy. Đơn hàng #${orderId} có thể đã được xử lý hoặc không tồn tại.`);
    }
    return { success: true, message: `Đã hủy thành công đơn hàng #${orderId}.` };
}

module.exports = {
    getOrders,
    getOrderDetail,
    updateOrderState,
    cancelOrder,
};