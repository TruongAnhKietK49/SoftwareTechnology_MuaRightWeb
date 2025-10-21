// controller/c_shipper.js

const shipperModel = require('../models/m_shipper'); // Import Model
// const authService = require('../services/authService'); // Giả định có service mã hóa mật khẩu

// Controller 1: Lấy thông tin Profile
async function getProfile(req, res) {
    const shipperId = req.params.id; // Lấy ID Shipper từ URL (ví dụ: /api/shipper/profile/101)

    // TODO: Thêm logic xác thực Token JWT ở đây

    try {
        const profileData = await shipperModel.getShipperProfile(shipperId);

        if (profileData) {
            res.status(200).json({
                success: true,
                profile: profileData
            });
        } else {
            res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ Shipper' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lấy hồ sơ', error: error.message });
    }
}

// Controller 2: Cập nhật Profile
async function updateProfile(req, res) {
    const shipperId = req.params.id;
    const updateData = req.body;
    
    // 1. Mã hóa mật khẩu mới nếu có
    if (updateData.newPassword && updateData.newPassword.length > 0) {
        // updateData.passwordHash = await authService.hashPassword(updateData.newPassword); // Giả định hàm mã hóa
        updateData.passwordHash = 'hashed_' + updateData.newPassword; // Dùng placeholder
    }

    try {
        await shipperModel.updateShipperProfile(shipperId, updateData);

        // Logic thay đổi tên (Nếu tên đổi, cần cập nhật trên Front-end)
        if (updateData.fullName) {
             // Cập nhật session hoặc token (việc này cần logic JWT/Session)
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật hồ sơ thành công!'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi máy chủ khi cập nhật hồ sơ', error: error.message });
    }
}

// Controller 3: Đăng xuất (Log Out)
function logout(req, res) {
    // 1. Xóa Token JWT hoặc Session ID
    // res.clearCookie('authToken'); 
    // req.session.destroy();

    // 2. Trả về tín hiệu chuyển hướng về trang đăng nhập (signIn)
    res.status(200).json({
        success: true,
        message: 'Đăng xuất thành công',
        redirect: '/signin' // Frontend sẽ tự động chuyển hướng về trang này
    });
}
// controller/c_shipper.js (Phần bổ sung cho các hàm Profile đã có)

const shipperModel = require('../models/m_shipper');

// Controller 4: Lấy danh sách đơn hàng mới (Pending)
async function getPendingOrders(req, res) {
    try {
        const orders = await shipperModel.getPendingOrders();
        res.status(200).json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lấy đơn hàng mới.', error: error.message });
    }
}

// Controller 5: Lấy danh sách đơn hàng của Shipper (My Orders)
async function getMyOrders(req, res) {
    const shipperId = req.params.shipperId; // Lấy ShipperId từ URL/Token

    if (!shipperId) return res.status(400).json({ success: false, message: 'Thiếu ID Shipper.' });

    try {
        const orders = await shipperModel.getMyOrders(shipperId);
        res.status(200).json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lấy đơn hàng của tôi.', error: error.message });
    }
}

// Controller 6: Shipper chấp nhận đơn (Chọn Giao)
async function acceptOrder(req, res) {
    const { orderId, shipperId } = req.body; // Cần OrderId và ShipperId

    if (!orderId || !shipperId) return res.status(400).json({ success: false, message: 'Thiếu thông tin OrderId hoặc ShipperId.' });

    try {
        const success = await shipperModel.acceptOrder(orderId, shipperId);
        if (success) {
            res.status(200).json({ success: true, message: 'Đã nhận đơn hàng thành công! Đang chuyển sang danh sách Đơn hàng của tôi.' });
        } else {
            res.status(400).json({ success: false, message: 'Không thể nhận đơn hàng này (Có thể đã có Shipper khác nhận).' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi máy chủ khi chấp nhận đơn hàng.', error: error.message });
    }
}

// Controller 7: Shipper cập nhật trạng thái (Đã Giao / Hủy Giao)
async function updateOrderStatus(req, res) {
    const { orderId, shipperId, newState } = req.body;
    
    if (!['Delivered', 'Cancelled'].includes(newState)) {
        return res.status(400).json({ success: false, message: 'Trạng thái cập nhật không hợp lệ.' });
    }
    
    try {
        const success = await shipperModel.updateOrderStatus(orderId, shipperId, newState);
        
        if (success) {
            let message = (newState === 'Delivered') 
                ? 'Đơn hàng đã được đánh dấu là Đã Giao thành công!' 
                : 'Đã hủy đơn hàng và trả lại đơn hàng vào danh sách chờ.';
            
            res.status(200).json({ success: true, message });
        } else {
            res.status(400).json({ success: false, message: 'Không thể cập nhật trạng thái đơn hàng.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi máy chủ khi cập nhật trạng thái.', error: error.message });
    }
}

// Module export (Cần thêm các hàm mới vào module.exports gốc)
// module.exports = { getProfile, updateProfile, logout, getPendingOrders, getMyOrders, acceptOrder, updateOrderStatus };

module.exports = {
    getProfile,
    updateProfile,
    logout,
    getPendingOrders,
    getMyOrders,
    acceptOrder,
    updateOrderStatus,
    // ... các controllers cho đơn hàng sẽ thêm sau
};
