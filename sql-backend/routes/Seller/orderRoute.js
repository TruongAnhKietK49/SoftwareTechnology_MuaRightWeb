// File: orderRoute.js 
const express = require("express");
const router = express.Router();

const orderController = require("../../controller/seller/c_sellerOrder");

// Endpoint: GET /seller/orders/:sellerId?state=...
router.get("/orders/:sellerId", async (req, res) => {
    const sellerId = parseInt(req.params.sellerId);
    const state = req.query.state || 'All';

    try {
        // Kiểm tra isNaN ngay đây
        if (isNaN(sellerId)) {
            return res.status(400).json({ success: false, message: "Seller ID không hợp lệ." });
        }
        const orders = await orderController.getOrders(sellerId, state);
        res.json({ success: true, data: orders });
    } catch (err) {
        console.error("[ROUTE ERROR] /orders/:sellerId :", err);
        res.status(500).json({ success: false, message: err.message || "Lỗi server khi lấy danh sách đơn hàng." });
    }
});

// Endpoint: GET /seller/order/detail/:orderId/:sellerId
router.get("/order/detail/:orderId/:sellerId", async (req, res) => {
    const orderId = parseInt(req.params.orderId);
    const sellerId = parseInt(req.params.sellerId);

    try {
        const orderDetail = await orderController.getOrderDetail(orderId, sellerId);
        // Controller sẽ throw error nếu không tìm thấy, nên ta bắt lỗi đó
        res.json({ success: true, data: orderDetail });
    } catch (err) {
        console.error("[ROUTE ERROR] /order/detail :", err);
        res.status(404).json({ success: false, message: err.message || "Lỗi server khi lấy chi tiết đơn hàng." });
    }
});

// Endpoint: PUT /seller/orders/:orderId/status
router.put("/orders/:orderId/status", async (req, res) => {
    const orderId = parseInt(req.params.orderId);
    const { newState } = req.body;

    if (!newState) {
        return res.status(400).json({ success: false, message: "Thiếu trạng thái cập nhật (newState)." });
    }

    try {
        const result = await orderController.updateOrderState(orderId, newState);
        res.json(result);
    } catch (err) {
        console.error("[ROUTE ERROR] /orders/:orderId/status :", err);
        res.status(400).json({ success: false, message: err.message });
    }
});

// Endpoint: PUT /seller/orders/:orderId/cancel
router.put("/orders/:orderId/cancel", async (req, res) => {
    const orderId = parseInt(req.params.orderId);
    const { cancelReason } = req.body;

    try {
        const result = await orderController.cancelOrder(orderId, cancelReason);
        res.json(result);
    } catch (err) {
        console.error("[ROUTE ERROR] /orders/:orderId/cancel :", err);
        res.status(400).json({ success: false, message: err.message });
    }
});

module.exports = router;