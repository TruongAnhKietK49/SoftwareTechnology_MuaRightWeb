const { getPool, closePool } = require("./config");
const express = require("express");
const router = express.Router();
const { insertUser } = require("../models/m_signUp");

router.post("/signup", async (req, res) => {
  try {
    const dataUser = req.body;
    console.log("Nhận dữ liệu từ client:", dataUser);

    // Gọi hàm insertUser trong models
    await insertUser(dataUser);

    res.status(201).json({ message: "Đăng ký thành công!" });
  } catch (err) {
    console.error("Lỗi khi đăng ký:", err);
    res.status(500).json({ message: "Đăng ký thất bại!" });
  }
});

module.exports = router;