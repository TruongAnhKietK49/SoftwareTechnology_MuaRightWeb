const express = require("express");
const router = express.Router();
const {
  getAdminByUsername,
  updateAdminByUsername,
} = require("../../models/admin/m_profileAdmin");

// Lấy thông tin admin
router.get("/profile/:username", async (req, res) => {
  try {
    const username = req.params.username;
    const admin = await getAdminByUsername(username);

    if (!admin) {
      return res.status(404).json({ message: "Không tìm thấy admin này" });
    }

    res.json(admin);
  } catch (err) {
    console.error("Lỗi khi lấy thông tin admin:", err);
    res.status(500).json({ error: "Lỗi server khi lấy thông tin admin" });
  }
});

// Cập nhật thông tin admin
router.put("/profile/:username", async (req, res) => {
  try {
    const username = req.params.username;
    const data = req.body;
    await updateAdminByUsername(username, data);
    // Lấy lại dữ liệu sau khi cập nhật
    const updatedAccount = await getAdminByUsername(username);
    res.status(200).json({
      message: "Cập nhật thành công",
      updatedAccount,
    });
  } catch (err) {
    console.error("Lỗi khi cập nhật admin:", err);
    res.status(500).json({ error: "Lỗi server khi cập nhật admin" });
  }
});

module.exports = router;
