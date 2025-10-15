// File: sql-backend/controller/c_shipper.js

const mShipper = require('../models/m_shipper');

// HÀM GIẢ ĐỊNH LẤY ID SHIPPER TỪ SESSION
// TRONG THỰC TẾ, BẠN CẦN LẤY AccountId TỪ SESSION SAU KHI ĐĂNG NHẬP THÀNH CÔNG
function getShipperInfoFromSession(req) {
    // Dữ liệu mẫu (CẦN THAY THẾ BẰNG DỮ LIỆU SESSION THỰC TẾ)
    return {
        accountId: 101, // Dùng ID này để truy vấn Profile
        username: 'Tom'
    };
}


// ------------------------------------------------------------------
// 1. Logic cho Trang PROFILE (profile.page.html)
// ------------------------------------------------------------------
exports.renderProfilePage = async (req, res) => {
    try {
        const shipperSession = getShipperInfoFromSession(req);
        
        const profileData = await mShipper.getShipperProfile(shipperSession.accountId);

        if (!profileData) {
            return res.status(404).send("Không tìm thấy hồ sơ Shipper.");
        }
        
        const viewData = {
            // Chuẩn hóa tên biến để dễ dàng sử dụng trong template
            fullName: profileData.FullName,
            shipperId: profileData.ShipperId,
            rating: profileData.Rating,
            completedOrders: profileData.CompletedOrders,
            phone: profileData.PhoneNumber,
            email: profileData.Email,
            activeRegion: profileData.ActiveRegion,
            bankAccount: profileData.BankAccount,
            hiName: shipperSession.username
        };
        
        // TODO: THAY THẾ bằng hàm render template engine thực tế của bạn (ví dụ: res.render)
        // Hiện tại dùng res.json để kiểm tra dữ liệu
        res.json(viewData); 

    } catch (error) {
        console.error("Lỗi Controller Profile:", error);
        res.status(500).send("Lỗi máy chủ khi tải hồ sơ.");
    }
};


// ------------------------------------------------------------------
// 2. Logic cho Trang PRODUCTS (products.page.html)
// ------------------------------------------------------------------
exports.renderProductsPage = async (req, res) => {
    try {
        const shipperSession = getShipperInfoFromSession(req);

        // Lấy 2 danh sách đơn hàng
        const availableOrders = await mShipper.getAvailableOrders();
        const myOrders = await mShipper.getMyCompletedOrders(shipperSession.accountId);

        const viewData = {
            hiName: shipperSession.username,
            availableOrders: availableOrders, // Đơn hàng CHỜ NHẬN
            myCompletedOrders: myOrders, // Đơn hàng ĐÃ GIAO / HỦY GIAO
        };

        // TODO: THAY THẾ bằng hàm render template engine thực tế của bạn
        res.json(viewData); 

    } catch (error) {
        console.error("Lỗi Controller Products:", error);
        res.status(500).send("Lỗi máy chủ khi tải danh sách đơn hàng.");
    }
};

// ------------------------------------------------------------------
// 3. Xử lý nhận đơn hàng (Khi bấm nút CHỌN GIAO)
// ------------------------------------------------------------------
exports.acceptOrder = async (req, res) => {
    try {
        const shipperSession = getShipperInfoFromSession(req);
        // Đảm bảo request body có chứa orderId (dùng trong form hoặc AJAX)
        const { orderId } = req.body; 

        if (!orderId) {
            return res.status(400).send("Thiếu Mã Đơn hàng.");
        }

        const success = await mShipper.acceptOrder(orderId, shipperSession.accountId);

        if (success) {
            // Chuyển hướng về lại trang Products sau khi nhận đơn thành công
            res.redirect('/shipper/products?status=accepted'); 
        } else {
            // Có thể đơn hàng đã có người nhận hoặc trạng thái không hợp lệ
            res.status(409).send("Đơn hàng không hợp lệ hoặc đã có Shipper khác nhận.");
        }

    } catch (error) {
        console.error("Lỗi Controller Accept Order:", error);
        res.status(500).send("Lỗi máy chủ khi xử lý nhận đơn.");
    }
};
