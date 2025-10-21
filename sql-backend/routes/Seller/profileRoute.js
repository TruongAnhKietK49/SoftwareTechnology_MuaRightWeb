const express = require("express");
const router = express.Router();

const {
    getSellerProfile,
    updateSellerProfile,
} = require("../../models/seller/m_profile");

// Endpoint: GET /seller/profile/:sellerId
router.get("/profile/:sellerId", async (req, res) => {
    try {
        const sellerId = parseInt(req.params.sellerId); 
        
        if (isNaN(sellerId)) {
            return res.status(400).json({ message: "Seller ID không hợp lệ" });
        }

        const profile = await getSellerProfile(sellerId);

        if (!profile) {
            return res.status(404).json({ success: false, message: "Không tìm thấy hồ sơ người bán này" });
        }

        res.json({ success: true, data: profile });
    } catch (err) {
        console.error("Lỗi khi lấy thông tin Seller Profile:", err);
        res.status(500).json({ success: false, error: "Lỗi server khi lấy thông tin hồ sơ" });
    }
});

// Endpoint: PUT /seller/profile/:sellerId
router.put("/profile/:sellerId", async (req, res) => {
    try {
        const sellerId = parseInt(req.params.sellerId);
        const data = req.body;
        
        if (isNaN(sellerId)) {
            return res.status(400).json({ message: "Seller ID không hợp lệ" });
        }
        
        await updateSellerProfile(sellerId, data);
        
        const updatedProfile = await getSellerProfile(sellerId);
        
        res.status(200).json({
            success: true,
            message: "Cập nhật thành công",
            data: updatedProfile,
        });
    } catch (err) {
        console.error("Lỗi khi cập nhật Seller Profile:", err);
        res.status(500).json({ success: false, error: "Lỗi server khi cập nhật hồ sơ" });
    }
});

module.exports = router;