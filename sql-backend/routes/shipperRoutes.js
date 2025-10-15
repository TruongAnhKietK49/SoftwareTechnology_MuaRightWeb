// File: sql-backend/routes/shipper.routes.js

const express = require('express');
const router = express.Router();
// ĐƯỜNG DẪN ĐÃ SỬA LỖI
const cShipper = require('../controller/shipper/c_shipper'); 

// Middleware giả định: Bỏ qua kiểm tra đăng nhập cho mục đích phát triển
function isAuthenticatedShipper(req, res, next) {
    return next(); 
}

// ==================================================================
// 1. TRANG PROFILE (GET /shipper/profile)
// ==================================================================
router.get('/profile', isAuthenticatedShipper, cShipper.renderProfilePage);

// ==================================================================
// 2. TRANG PRODUCTS (GET /shipper/products)
// ==================================================================
router.get('/products', isAuthenticatedShipper, cShipper.renderProductsPage);

// ==================================================================
// 3. XỬ LÝ NHẬN ĐƠN HÀNG (POST /shipper/accept-order)
// ==================================================================
router.post('/accept-order', isAuthenticatedShipper, cShipper.acceptOrder);


module.exports = router;