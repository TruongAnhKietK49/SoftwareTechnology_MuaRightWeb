const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const pendingPath = path.join(
  __dirname,
  "../../../public/DATA/pendingProducts.json"
);

// 📥 POST: seller gửi sản phẩm pending
router.post("/pendingProducts", async (req, res) => {
  try {
    const newProducts = req.body; // mảng sản phẩm
    // Đọc file cũ
    let currentData = [];
    if (fs.existsSync(pendingPath)) {
      const raw = fs.readFileSync(pendingPath, "utf8");
      if (raw.trim() !== "") currentData = JSON.parse(raw);
    }

    // Gộp dữ liệu mới vào file cũ
    const updated = [...currentData, ...newProducts];

    fs.writeFileSync(pendingPath, JSON.stringify(updated, null, 2), "utf8");

    res
      .status(200)
      .json({ message: "Đã thêm sản phẩm vào danh sách chờ duyệt" });
  } catch (error) {
    console.error("❌ Lỗi khi thêm sản phẩm chờ duyệt:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 📤 GET: adminProduct.html lấy danh sách pending
router.get("/pendingProducts", (req, res) => {
  try {
    if (!fs.existsSync(pendingPath)) return res.json([]);

    const data = JSON.parse(fs.readFileSync(pendingPath, "utf8"));
    res.json(data);
  } catch (error) {
    console.error("❌ Lỗi khi đọc pendingProducts:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;