const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const pendingPath = path.join(
  __dirname,
  "../../../public/DATA/pendingProducts.json"
);

// ✅ POST: admin DUYỆT sản phẩm
const { insertProduct } = require("../../models/admin/m_inventoryManager");

router.post("/approveProduct", async (req, res) => {
  try {
    const { product } = req.body; // 👈 Lấy đúng product từ request
    if (!product) {
      return res.status(400).json({ error: "Thiếu dữ liệu sản phẩm" });
    }

    await insertProduct(product);

    // Sau khi insert thành công thì xóa sản phẩm khỏi pending.json
    const pendingPath = path.join(
      __dirname,
      "../../../public/DATA/pendingProducts.json"
    );
    let pendingList = JSON.parse(fs.readFileSync(pendingPath, "utf8"));
    pendingList = pendingList.filter(
      (p) => p.NameProduct !== product.NameProduct
    );
    fs.writeFileSync(pendingPath, JSON.stringify(pendingList, null, 2), "utf8");

    res.status(200).json({ message: "Duyệt sản phẩm thành công!" });
  } catch (error) {
    console.error("❌ Lỗi khi duyệt sản phẩm:", error);
    res.status(400).json({ error: "Duyệt sản phẩm thất bại!" });
  }
});

// ❌ POST: admin TỪ CHỐI sản phẩm
router.post("/rejectProduct", (req, res) => {
  try {
    const { NameProduct } = req.body;
    if (!NameProduct)
      return res.status(400).json({ error: "Thiếu nameProduct" });

    if (!fs.existsSync(pendingPath))
      return res.status(404).json({ error: "Không có danh sách chờ duyệt" });

    const data = JSON.parse(fs.readFileSync(pendingPath, "utf8"));
    const newList = data.filter((p) => p.NameProduct !== NameProduct);
    fs.writeFileSync(pendingPath, JSON.stringify(newList, null, 2), "utf8");

    res.json({ message: "❌ Sản phẩm đã bị từ chối và xóa khỏi danh sách!" });
  } catch (error) {
    console.error("❌ Lỗi khi từ chối sản phẩm:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


module.exports = router;
