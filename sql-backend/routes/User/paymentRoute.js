const express = require("express");
const router = express.Router();
const { checkVoucher, createInvoice } = require("../../models/user/m_user");

// Kiểm tra voucher
router.post("/check-voucher", async (req, res) => {
  const { voucherCode, customerId } = req.body;
  try {
    const result = await checkVoucher(voucherCode, customerId);
    res.json(result);
  } catch (error) {
    console.error("Lỗi khi xử lý yêu cầu kiểm tra voucher:", error);
    res
      .status(500)
      .json({ valid: false, message: "Lỗi server khi kiểm tra voucher." });
  }
});

// Đặt hàng và tạo hoá đơn (chức năng có thể được mở rộng sau)
router.post("/create-invoice", async (req, res) => {
  const orderData = req.body;
  try {
    const result = await createInvoice(orderData);
    res.json(result);
  } catch (error) {
    console.error("Lỗi khi tạo hoá đơn:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server khi tạo hoá đơn." });
  }
});

module.exports = router;
