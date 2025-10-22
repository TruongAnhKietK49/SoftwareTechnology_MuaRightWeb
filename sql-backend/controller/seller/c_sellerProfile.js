const sellerModel = require("../../models/seller/m_profile");

/**
 * Controller để lấy thông tin hồ sơ người bán
 */
const getProfile = async (req, res) => {
    try {
        const sellerId = parseInt(req.params.sellerId);

        if (isNaN(sellerId)) {
            return res.status(400).json({ success: false, message: "Seller ID không hợp lệ" });
        }

        const profile = await sellerModel.getSellerProfile(sellerId);

        if (!profile) {
            return res.status(404).json({ success: false, message: "Không tìm thấy hồ sơ người bán này" });
        }

        res.json({ success: true, data: profile });
    } catch (err) {
        console.error("Lỗi Controller - getProfile:", err);
        res.status(500).json({ success: false, error: "Lỗi server khi lấy thông tin hồ sơ" });
    }
};

/**
 * Controller để cập nhật thông tin hồ sơ người bán
 */
const updateProfile = async (req, res) => {
    try {
        const sellerId = parseInt(req.params.sellerId);
        const data = req.body;

        if (isNaN(sellerId)) {
            return res.status(400).json({ success: false, message: "Seller ID không hợp lệ" });
        }

        // Thực hiện cập nhật
        const success = await sellerModel.updateSellerProfile(sellerId, data);

        if (!success) {
            return res.status(400).json({ success: false, message: "Cập nhật thất bại hoặc không có dữ liệu thay đổi." });
        }
        
        // Lấy lại thông tin mới nhất sau khi cập nhật
        const updatedProfile = await sellerModel.getSellerProfile(sellerId);
        
        res.status(200).json({
            success: true,
            message: "Cập nhật thông tin thành công!",
            data: updatedProfile,
        });
    } catch (err) {
        console.error("Lỗi Controller - updateProfile:", err);
        res.status(500).json({ success: false, error: "Lỗi server khi cập nhật hồ sơ" });
    }
};

module.exports = {
    getProfile,
    updateProfile,
};