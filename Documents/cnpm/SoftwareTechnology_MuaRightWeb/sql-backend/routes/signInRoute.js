const { getPool, closePool } = require("./config");
const express = require("express");
const router = express.Router();
const { checkLogin } = require("../models/m_signIn");

router.post("/signin", async (req, res) => {
  try {
    const dataUser = req.body;
    console.log("Nhận dữ liệu sign in: ", dataUser);
    const account = await checkLogin(dataUser);
    console.log(account);
    
    if (account) {
      console.log("✅ Đăng nhập thành công!");
      res.status(200).json({
        success: true,
        message: "Đăng nhập thành công!",
        account: account,
      });
    } else {
      console.log("❌ Sai tài khoản hoặc mật khẩu!");
      res
        .status(401)
        .json({ success: false, message: "Sai tài khoản hoặc mật khẩu!" });
    }
  } catch (err) {
    console.error("🔥 Lỗi server:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

module.exports = router;
