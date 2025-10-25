const express = require("express");
const router = express.Router();
const sellerController = require("../../controller/seller/c_sellerDashboard");

// Endpoint: GET /seller/dashboard/:sellerId
router.get("/dashboard/:sellerId", async (req, res) => {
    const sellerId = parseInt(req.params.sellerId);

    try {
        const data = await sellerController.getDashboardData(sellerId);
        res.json({ success: true, data: data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message || "Lỗi server khi lấy dữ liệu dashboard." });
    }
});

// Endpoint: PUT /seller/orders/:orderId/confirm (Vẫn giữ ở đây vì liên quan đến Dashboard)
router.put("/orders/:orderId/confirm", async (req, res) => {
    const orderId = parseInt(req.params.orderId);

    try {
        const result = await sellerController.confirmOrder(orderId);
        res.json(result);
    } catch (err) {
        res.status(400).json({ success: false, message: err.message || "Lỗi server khi xác nhận đơn hàng." });
    }
});

// Endpoint: GET /seller/orders/:orderId - Lấy chi tiết một đơn hàng
router.get("/orders/:orderId", async (req, res) => {
    const orderId = parseInt(req.params.orderId, 10);
    // Giả sử sellerId được lấy từ session/token đã xác thực
    // Tạm thời, chúng ta sẽ lấy từ query string để test, VÍ DỤ: /seller/orders/1?sellerId=1
    // Trong thực tế, bạn sẽ lấy từ req.user.id hoặc tương tự
    const sellerId = parseInt(req.query.sellerId, 10); 

    try {
        const result = await sellerController.getOrderDetails(orderId, sellerId);
        res.json({ success: true, data: result });
    } catch (err) {
        res.status(404).json({ success: false, message: err.message });
    }
});

module.exports = router;