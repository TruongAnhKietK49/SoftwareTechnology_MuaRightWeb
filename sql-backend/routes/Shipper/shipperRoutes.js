// routes/shipperRoutes.js

const express = require('express');
const router = express.Router();
const shipperController = require('../controllers/c_shipper'); // Import Controllers

// Middleware xác thực (ví dụ: verifyToken) cần được thêm vào đây
// const authMiddleware = require('../middleware/auth'); 

// 1. API LẤY và CẬP NHẬT Profile
// GET /api/shipper/profile/101
router.get('/profile/:id', shipperController.getProfile); 

// POST /api/shipper/profile/101
router.post('/profile/:id', shipperController.updateProfile);

// 2. API ĐĂNG XUẤT
// POST /api/shipper/logout
router.post('/logout', shipperController.logout);

// -------------------------------------------------------------
// * Các Routes cho Đơn hàng sẽ được thêm vào đây sau *
// -------------------------------------------------------------
// routes/shipperRoutes.js (Phần bổ sung cho các routes Profile đã có)

const express = require('express');
const router = express.Router();
const shipperController = require('../controllers/c_shipper');

// * Giả định Shipper ID = 1 đang hoạt động (Bạn cần thay thế bằng middleware xác thực JWT sau này)
const SHIPPER_ID = 1; 

// -------------------------------------------------------------
// ROUTES CHO TRANG ĐƠN HÀNG (products_page.html)
// -------------------------------------------------------------

// 3. Lấy Danh sách đơn hàng mới (Chờ nhận)
// GET /api/shipper/orders/pending
router.get('/orders/pending', shipperController.getPendingOrders);

// 4. Lấy Đơn hàng của Shipper (Đang giao và Lịch sử)
// GET /api/shipper/orders/my-orders
router.get('/orders/my-orders/:shipperId', shipperController.getMyOrders); 

// 5. Shipper NHẬN ĐƠN (Chọn Giao)
// POST /api/shipper/orders/accept
router.post('/orders/accept', shipperController.acceptOrder);

// 6. Shipper CẬP NHẬT TRẠNG THÁI (Đã Giao / Hủy Giao)
// POST /api/shipper/orders/update-status
router.post('/orders/update-status', shipperController.updateOrderStatus);

// -------------------------------------------------------------
// * Các Routes Profile (get/post profile, logout) đã được thêm trước đó *
// -------------------------------------------------------------
module.exports = router;