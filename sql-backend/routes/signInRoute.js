const express = require("express");
const router = express.Router();
const { findUserByEmail, lockUserAccount } = require("../models/m_signIn");

const loginAttempts = {};
const MAX_ATTEMPTS = 3;

router.post("/signin", async (req, res) => {
  try {
    const dataUser = req.body;
    const { Email, PasswordHash } = dataUser;
    const userIdentifier = Email.toLowerCase();

    if (!Email || !PasswordHash) {
        return res.status(400).json({ success: false, message: "Vui lòng nhập email và mật khẩu." });
    }

    const account = await findUserByEmail(Email);

    if (!account) {
        return res.status(401).json({ success: false, message: "Tài khoản hoặc mật khẩu không chính xác." });
    }

    if (account.State === 'Inactive') {
        return res.status(401).json({ success: false, message: "Tài khoản của bạn đã bị khóa." });
    }

    if (account.PasswordHash === PasswordHash) {
        console.log(`✅ Đăng nhập thành công!`);
        delete loginAttempts[userIdentifier];

        const redirectParam = req.query.redirect;
        let redirectInfo = null;
        switch (redirectParam) {
            case 'index': redirectInfo = { redirect: "../../index.html" }; break;
            case 'product': redirectInfo = { redirect: "../../views/user/Product_Page.html" }; break;
            case 'blog': redirectInfo = { redirect: "../../views/user/Blog_Page.html" }; break;
        }

        const responseData = { success: true, message: "Đăng nhập thành công!", account: account };
        if (redirectInfo) { Object.assign(responseData, redirectInfo); }
        
        return res.status(200).json(responseData);

    } else {
        console.log(`❌ Đăng nhập thất bại!`);
        
        const currentAttempts = (loginAttempts[userIdentifier] || 0) + 1;
        loginAttempts[userIdentifier] = currentAttempts;

        if (currentAttempts >= MAX_ATTEMPTS) {
            await lockUserAccount(account.AccountId);
            delete loginAttempts[userIdentifier];
            return res.status(401).json({ success: false, message: "Bạn đã nhập sai quá 3 lần. Tài khoản đã bị khóa." });
        } else {
            const attemptsLeft = MAX_ATTEMPTS - currentAttempts;
            return res.status(401).json({ success: false, message: `Tài khoản hoặc mật khẩu không chính xác. Bạn còn ${attemptsLeft} lần thử.` });
        }
    }
  } catch (err) {
    console.error("🔥 Lỗi server trong signInRoute:", err);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
});

module.exports = router;