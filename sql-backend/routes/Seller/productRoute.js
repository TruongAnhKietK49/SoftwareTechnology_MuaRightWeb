// File: productRoute.js

const express = require("express");
const router = express.Router();
const productController = require("../../controller/seller/c_sellerProduct");
const fs = require('fs');
const path = require('path');

// Định nghĩa đường dẫn tới pendingProducts.json
const pendingPath = path.join(
  __dirname,
  "../../../public/DATA/pendingProducts.json"
);

// 🔍 GET: Admin lấy danh sách sản phẩm chờ duyệt
// URL: GET /seller/pendingProducts 
router.get("/pendingProducts", (req, res) => {
    try {
        if (!fs.existsSync(pendingPath)) {
            return res.status(200).json([]);
        }

        const data = fs.readFileSync(pendingPath, "utf8");
        const pendingList = JSON.parse(data);
        
        // Trả về danh sách chờ duyệt
        res.status(200).json(pendingList);
    } catch (error) {
        console.error("❌ Lỗi khi lấy danh sách chờ duyệt:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});
// -------------------------------------------------------------------------------- //

// [GET] Lấy danh sách sản phẩm ĐÃ ĐƯỢC DUYỆT của một người bán
// URL: GET /seller/products/:sellerId
router.get("/products/:sellerId", async (req, res) => {
    try {
        const sellerId = parseInt(req.params.sellerId);
        const products = await productController.getProducts(sellerId);
        res.json({ success: true, data: products });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Người bán gửi một sản phẩm mới để CHỜ DUYỆT
// URL: POST /seller/products/submit
router.post("/products/submit", async (req, res) => {
    try {
        const newProduct = req.body;
        if (!newProduct || !newProduct.NameProduct || !newProduct.SellerId) {
             return res.status(400).json({ success: false, message: "Thiếu dữ liệu sản phẩm quan trọng." });
        }
        
        // 1. Đọc danh sách hiện tại từ file JSON
        let pendingList = [];
        if (fs.existsSync(pendingPath)) {
            const data = fs.readFileSync(pendingPath, "utf8");
            // Kiểm tra nếu file rỗng
            if (data.trim() !== "") pendingList = JSON.parse(data); 
        }

        // 2. Thêm sản phẩm mới vào danh sách
        pendingList.push(newProduct);

        // 3. Ghi lại danh sách đã cập nhật vào file JSON
        fs.writeFileSync(pendingPath, JSON.stringify(pendingList, null, 2), "utf8");

        res.status(201).json({ 
            success: true, 
            message: "✅ Sản phẩm đã được gửi đi và chờ Admin duyệt!" 
        });

    } catch (err) {
        console.error("❌ Lỗi khi gửi sản phẩm chờ duyệt:", err);
        res.status(500).json({ success: false, message: "Lỗi Server nội bộ: Không thể lưu sản phẩm chờ duyệt." });
    }
});

// Cập nhật thông tin một sản phẩm ĐÃ ĐƯỢC DUYỆT
// URL: PUT /seller/products/:productId
router.put("/products/:productId", async (req, res) => {
    try {
        const productId = parseInt(req.params.productId);
        const result = await productController.updateProduct(productId, req.body);
        res.json(result);
    } catch (err) {
        res.status(404).json({ success: false, message: err.message });
    }
});

// Xóa một sản phẩm
// URL: DELETE /seller/products/:productId
router.delete("/products/:productId", async (req, res) => {
    try {
        const productId = parseInt(req.params.productId);
        const result = await productController.deleteProduct(productId);
        res.json(result);
    } catch (err) {
        res.status(404).json({ success: false, message: err.message });
    }
});

module.exports = router;