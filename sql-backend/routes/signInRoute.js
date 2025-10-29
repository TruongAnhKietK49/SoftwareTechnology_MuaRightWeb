const { getPool, closePool } = require("./config");
const express = require("express");
const router = express.Router();
const { checkLogin } = require("../models/m_signIn");

router.post("/signin", async (req, res) => {
  try {
    const dataUser = req.body;
    const { Email, PasswordHash } = dataUser;

    if (!Email || !PasswordHash) {
        return res.status(400).json({ success: false, message: "Vui lòng nhập email và mật khẩu." });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(Email)) {
        return res.status(400).json({ success: false, message: "Email không hợp lệ." });
    }

    const account = await checkLogin(dataUser);

    if (account) {
      console.log("✅ Đăng nhập thành công!");

      const redirectParam = req.query.redirect; 

      let redirectInfo = null;
      switch (redirectParam) {
          case 'index':
              redirectInfo = { redirect: "../../index.html" };
              break;
          case 'product':
              redirectInfo = { redirect: "../../views/user/Product_Page.html" };
              break;
          case 'blog':
              redirectInfo = { redirect: "../../views/user/Blog_Page.html" };
              break;
      }

      const responseData = {
        success: true,
        message: "Đăng nhập thành công!",
        account: account,
      };

      if (redirectInfo) {
          Object.assign(responseData, redirectInfo);  // Thêm thông tin redirect vào response
      }

      res.status(200).json(responseData);
    } else {
      console.log("❌ Sai tài khoản hoặc mật khẩu!");
      res
        .status(401)
        .json({ success: false, message: "Tài khoản hoặc mật khẩu không chính xác." });
    }
  } catch (err) {
    console.error("🔥 Lỗi server:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});
module.exports = router;