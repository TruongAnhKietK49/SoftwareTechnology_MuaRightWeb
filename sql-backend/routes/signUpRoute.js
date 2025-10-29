const { getPool, closePool } = require("./config");
const express = require("express");
const router = express.Router();
const { insertUser } = require("../models/m_signUp");

router.post("/signup", async (req, res) => {
  try {
    const { commonData, profileData } = req.body;

    if (!commonData || !profileData) {
        return res.status(400).json({ message: "Dữ liệu gửi lên không hợp lệ." });
    }

    const { Username, Email, Phone, PasswordHash, Role } = commonData;

    if (!Username || !Email || !Phone || !PasswordHash || !Role) {
        return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin bắt buộc." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(Email)) {
        return res.status(400).json({ message: "Định dạng email không hợp lệ." });
    }

    const phoneRegex = /^\d{10,11}$/;
    if (!phoneRegex.test(Phone)) {
        return res.status(400).json({ message: "Số điện thoại chỉ được chứa ký tự số." });
    }

    if (PasswordHash.length < 8) {
        return res.status(400).json({ message: "Mật khẩu phải dài ít nhất 8 ký tự." });
    }

    if (Role === 'Seller' && (!profileData.StoreName || profileData.StoreName.trim() === '')) {
        return res.status(400).json({ message: "Vui lòng nhập tên cửa hàng của bạn." });
    }

    // Gọi hàm insertUser trong models
    await insertUser(req.body);

    res.status(201).json({ message: "Đăng ký thành công!" });
  } catch (err) {
    console.error("Lỗi khi đăng ký:", err);
    // Xử lý lỗi trùng lặp từ model
    if (err.message.includes("đã tồn tại") || err.message.includes("đã được sử dụng")) {
      return res.status(409).json({ message: err.message }); 
    }
    res.status(500).json({ message: "Đăng ký thất bại do lỗi máy chủ!" });
  }
});

module.exports = router;