const express = require("express");
const router = express.Router();
const statisticController = require("../../controller/seller/c_sellerStatistic");

// GET /seller/statistics/:sellerId?period=...
router.get("/statistics/:sellerId", async (req, res) => {
    const sellerId = parseInt(req.params.sellerId);
    
    const validPeriods = ['today', '7days', '30days', '3months', '6months', '1year', 'custom'];
    let period = req.query.period || '30days';

    if (!validPeriods.includes(period)) {
        period = '30days'; 
    }

    if (period === 'custom') {
        period = '30days';
    }

    try {
        const data = await statisticController.getStatistics(sellerId, period);
        res.json({ success: true, data: data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message || "Lỗi server khi lấy dữ liệu thống kê." });
    }
});

module.exports = router;