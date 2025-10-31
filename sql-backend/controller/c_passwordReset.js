const passwordModel = require('../models/m_passwordReset');

function generateRandomPassword(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

const handleResetWithVerification = async (req, res) => {
    try {
        const { email, username, phone } = req.body;

        const user = await passwordModel.findUserByDetails(email, username, phone);

        if (!user) {
            return res.status(400).json({ message: 'Thông tin không chính xác hoặc không khớp. Vui lòng kiểm tra lại.' });
        }

        const newPassword = generateRandomPassword();
        await passwordModel.updateUserPassword(user.AccountId, newPassword);

       
        res.status(200).json({
            message: 'Khôi phục thành công! Mật khẩu mới của bạn là (hãy sao chép và đăng nhập):',
            newPassword: newPassword
        });

    } catch (err) {
        console.error("Lỗi trong controller khôi phục mật khẩu:", err);
        res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
};

module.exports = {
    handleResetWithVerification
};