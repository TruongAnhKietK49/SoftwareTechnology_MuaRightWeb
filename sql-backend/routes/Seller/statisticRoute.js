const express = require("express");
const router = express.Router();
const statisticController = require("../../controller/seller/c_sellerStatistic");

// Endpoint: GET /seller/statistics/:sellerId?period=...
router.get("/statistics/:sellerId", async (req, res) => {
    const sellerId = parseInt(req.params.sellerId);
    const period = req.query.period || '1month';

    try {
        const data = await statisticController.getStatistics(sellerId, period);
        res.json({ success: true, data: data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message || "Lỗi server khi lấy dữ liệu thống kê." });
    }
});

module.exports = router;