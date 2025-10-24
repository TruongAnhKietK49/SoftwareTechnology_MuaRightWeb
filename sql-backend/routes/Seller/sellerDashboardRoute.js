const express = require("express");
const router = express.Router();
const sellerController = require("../../controller/seller/c_sellerDashboard");

// GET /seller/dashboard/:sellerId
router.get("/dashboard/:sellerId", async (req, res) => {
    const sellerId = parseInt(req.params.sellerId);

    try {
        const data = await sellerController.getDashboardData(sellerId);
        res.json({ success: true, data: data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message || "Lỗi server khi lấy dữ liệu dashboard." });
    }
});

module.exports = router;