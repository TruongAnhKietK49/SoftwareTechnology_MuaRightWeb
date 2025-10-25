// routes/shipperRoutes.js
const express = require('express');
const router = express.Router();
const shipperController = require('../../controller/shipper/c_shipper'); // Import Controllers


// 1. API LẤY và CẬP NHẬT Profile
// GET /api/shipper/profile/101
router.get('/profile/:id', shipperController.getProfile); 

// POST /api/shipper/profile/101
router.post('/profile/:id', shipperController.updateProfile);

// 2. API ĐĂNG XUẤT
// POST /api/shipper/logout
router.post('/logout', shipperController.logout);


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

router.post('/login', shipperController.loginShipper);
// -------------------------------------------------------------
// * Các Routes Profile (get/post profile, logout) đã được thêm trước đó *
// -------------------------------------------------------------
module.exports = router;