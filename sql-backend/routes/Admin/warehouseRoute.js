const express = require("express");
const router = express.Router();

const { getProducts, removeProduct } = require("../../models/admin/m_warehouseManager");
router.get("/products", async (req, res) => {
    try {
        const products = await getProducts();
        res.json(products);
    } catch (err) {
        console.error("Lỗi khi lấy sản phẩm:", err);
        res.status(500).json({ error: "Lỗi server khi lấy sản phẩm" });
    }
});

router.delete("/products/:productId", async (req, res) => {
    try {
        const productId = req.params.productId;
        await removeProduct(productId);
        res.json({ message: "Xóa sản phẩm thành công" });
    } catch (err) {
        console.error("Lỗi khi xóa sản phẩm:", err);
        res.status(500).json({ error: "Lỗi server khi xóa sản phẩm" });
    }
});

module.exports = router;
