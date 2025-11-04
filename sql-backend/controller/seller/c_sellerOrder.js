const orderModel = require("../../models/seller/m_order");

const ALLOWED_UPDATE_STATES = ['Approved', 'Shipped', 'Delivered'];

const ALLOWED_BULK_ACTIONS = ['Approved', 'Cancelled', 'Shipped'];

/**
 * Lấy danh sách đơn hàng theo trạng thái
 */
async function getOrders(sellerId, state) {
    if (isNaN(sellerId)) {
        throw new Error("Seller ID không hợp lệ.");
    }
    return await orderModel.getSellerOrders(sellerId, state);
}

/**
 * Lấy chi tiết đơn hàng 
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
async function updateOrderState(orderId, newState, sellerId) { 
    if (isNaN(orderId) || isNaN(sellerId)) {
        throw new Error("ID không hợp lệ.");
    }

    if (!ALLOWED_UPDATE_STATES.includes(newState)) {
        throw new Error(`Trạng thái cập nhật '${newState}' không hợp lệ.`);
    }

    const success = await orderModel.updateOrderStatus(orderId, newState, sellerId);

    if (!success) {
        throw new Error(`Không thể cập nhật. Đơn hàng #${orderId} có thể không tồn tại hoặc không ở trạng thái hợp lệ để chuyển sang '${newState}'.`);
    }
    return { success: true, message: `Đã cập nhật đơn hàng #${orderId} sang trạng thái '${newState}'!` };
}

/**
 * Hủy đơn hàng 
 */
async function cancelOrder(orderId, cancelReason, sellerId) { 
    if (isNaN(orderId) || isNaN(sellerId)) {
        throw new Error("ID không hợp lệ.");
    }
    if (!cancelReason || !cancelReason.trim()) {
        throw new Error("Lý do hủy đơn hàng là bắt buộc.");
    }

    const success = await orderModel.updateOrderStatus(orderId, 'Cancelled', sellerId);

    if (!success) {
        throw new Error(`Không thể hủy. Đơn hàng #${orderId} có thể đã được xử lý hoặc không tồn tại.`);
    }
    return { success: true, message: `Đã hủy thành công đơn hàng #${orderId}.` };
}

async function bulkUpdateOrderState(orderIds, action, sellerId) {
    if (isNaN(sellerId)) {
        throw new Error("Seller ID không hợp lệ.");
    }
    if (!ALLOWED_BULK_ACTIONS.includes(action)) {
        throw new Error("Hành động không được phép.");
    }
    const updatedCount = await orderModel.bulkUpdateOrderStatus(orderIds, action, sellerId);
    if (updatedCount > 0) {
        return { success: true, message: `Đã cập nhật thành công ${updatedCount} đơn hàng.` };
    } else {
        throw new Error("Không có đơn hàng nào được cập nhật. Có thể các đơn hàng đã chọn không ở trạng thái hợp lệ cho hành động này.");
    }
}

module.exports = {
    getOrders,
    getOrderDetail,
    updateOrderState,
    cancelOrder,
    bulkUpdateOrderState
};