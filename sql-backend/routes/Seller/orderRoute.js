const express = require("express");
const router = express.Router();

const orderController = require("../../controller/seller/c_sellerOrder");

// GET /seller/orders/:sellerId?state=...
router.get("/orders/:sellerId", async (req, res) => {
    const sellerId = parseInt(req.params.sellerId);
    const state = req.query.state || 'All';

    try {
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

// GET /seller/order/detail/:orderId/:sellerId
router.get("/order/detail/:orderId/:sellerId", async (req, res) => {
    const orderId = parseInt(req.params.orderId);
    const sellerId = parseInt(req.params.sellerId);

    try {
        const orderDetail = await orderController.getOrderDetail(orderId, sellerId);
        res.json({ success: true, data: orderDetail });
    } catch (err) {
        console.error("[ROUTE ERROR] /order/detail :", err);
        res.status(404).json({ success: false, message: err.message || "Lỗi server khi lấy chi tiết đơn hàng." });
    }
});

// PUT /seller/orders/:orderId/status
router.put("/orders/:orderId/status", async (req, res) => {
    const orderId = parseInt(req.params.orderId);
    const { newState, sellerId } = req.body;

    if (!newState || !sellerId) {
        return res.status(400).json({ success: false, message: "Thiếu thông tin 'newState' hoặc 'sellerId'." });
    }

    try {
        const result = await orderController.updateOrderState(orderId, newState, sellerId);
        res.json(result);
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// PUT /seller/orders/:orderId/cancel
router.put("/orders/:orderId/cancel", async (req, res) => {
    const orderId = parseInt(req.params.orderId);
    const { cancelReason, sellerId } = req.body;

    if (!cancelReason || !sellerId) {
        return res.status(400).json({ success: false, message: "Thiếu thông tin 'cancelReason' hoặc 'sellerId'." });
    }

    try {
        const result = await orderController.cancelOrder(orderId, cancelReason, sellerId);
        res.json(result);
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

router.post("/orders/bulk-update", async (req, res) => {
    const { orderIds, action, sellerId } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0 || !action || !sellerId) {
        return res.status(400).json({ success: false, message: "Dữ liệu không hợp lệ." });
    }

    try {
        const result = await orderController.bulkUpdateOrderState(orderIds, action, sellerId);
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;