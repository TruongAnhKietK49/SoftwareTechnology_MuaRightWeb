const express = require("express");
const router = express.Router();
const statisticController = require("../../controller/seller/c_sellerStatistic");

// GET /seller/statistics/:sellerId?period=...
router.get("/statistics/:sellerId", async (req, res) => {
    const sellerId = parseInt(req.params.sellerId);
    
    const validPeriods = ['today', '7days', '30days', '3months', '6months', '1year', 'custom'];
    let { period = '30days', startDate, endDate } = req.query;

    if (!validPeriods.includes(period)) {
        period = '30days'; 
    }

    const options = { period };
    if (period === 'custom' && startDate && endDate) {
        options.startDate = startDate;
        options.endDate = endDate;
    }

    try {
        const data = await statisticController.getStatistics(sellerId, options);
        res.json({ success: true, data: data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message || "Lỗi server khi lấy dữ liệu thống kê." });
    }
});

module.exports = router;