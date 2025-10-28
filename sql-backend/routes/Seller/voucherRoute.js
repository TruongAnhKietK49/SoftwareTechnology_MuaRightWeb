const express = require("express");
const router = express.Router();
const voucherController = require("../../controller/seller/c_sellerVoucher");

router.get("/vouchers/:sellerId", async (req, res) => {
    try {
        const sellerId = parseInt(req.params.sellerId);
        const vouchers = await voucherController.getVouchers(sellerId);
        res.json({ success: true, data: vouchers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post("/vouchers", async (req, res) => {
    try {
        const result = await voucherController.addVoucher(req.body);
        res.status(201).json(result);
    } catch (err) {
        if (err.message.includes('UNIQUE KEY constraint')) {
            return res.status(400).json({ success: false, message: "Mã voucher này đã tồn tại. Vui lòng chọn mã khác." });
        }
        res.status(400).json({ success: false, message: err.message });
    }
});

router.put("/vouchers/:voucherId", async (req, res) => {
    try {
        const voucherId = parseInt(req.params.voucherId);
        const sellerId = req.body.CreatedBySeller;
        if (!sellerId) {
            return res.status(401).json({ success: false, message: "Không thể xác thực người bán." });
        }
        const result = await voucherController.updateVoucher(voucherId, sellerId, req.body);
        res.json(result);
    } catch (err) {
        res.status(404).json({ success: false, message: err.message });
    }
});

router.delete("/vouchers/:voucherId", async (req, res) => {
    try {
        const voucherId = parseInt(req.params.voucherId);
        const account = JSON.parse(req.headers['x-account'] || '{}');
        const sellerId = account.AccountId;

        if (!sellerId) {
             return res.status(401).json({ success: false, message: "Không thể xác thực người dùng." });
        }

        const result = await voucherController.deleteVoucher(voucherId, sellerId);
        res.json(result);
    } catch (err) {
        res.status(404).json({ success: false, message: err.message });
    }
});

module.exports = router;