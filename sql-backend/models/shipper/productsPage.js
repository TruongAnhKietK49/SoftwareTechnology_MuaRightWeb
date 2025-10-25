// public/JS/shipper/productsPage.js

// Lấy ID Shipper hiện tại (GIẢ ĐỊNH: ID Shipper là 1)
const SHIPPER_ID = 1; 

// Các containers trong HTML
const pendingOrdersContainer = document.getElementById('pending-orders-container');
const myOrdersTableBody = document.getElementById('my-orders-table-body');


// -------------------------------------------------------------
// HELPER: Lấy tên cửa hàng từ chi tiết sản phẩm (Lấy Hàng)
// -------------------------------------------------------------
function getStoreName(details) {
    if (details && details.length > 0) {
        return details[0].SellerStore;
    }
    return "Kho tổng";
}

// -------------------------------------------------------------
// 1. CHỨC NĂNG: LOAD DỮ LIỆU KHI TRANG MỞ
// -------------------------------------------------------------

async function loadAllOrders() {
    // 1. Load Đơn hàng mới
    try {
        const resPending = await fetch('/api/shipper/orders/pending');
        const dataPending = await resPending.json();

        if (dataPending.success && dataPending.orders) {
            renderPendingOrders(dataPending.orders);
        }
    } catch (error) {
        console.error('Lỗi load đơn hàng mới:', error);
    }

    // 2. Load Đơn hàng của tôi
    try {
        const resMyOrders = await fetch(`/api/shipper/orders/my-orders/${SHIPPER_ID}`);
        const dataMyOrders = await resMyOrders.json();

        if (dataMyOrders.success && dataMyOrders.orders) {
            renderMyOrdersTable(dataMyOrders.orders);
        }
    } catch (error) {
        console.error('Lỗi load đơn hàng của tôi:', error);
    }
}


// -------------------------------------------------------------
// 2. RENDER: DỰNG GIAO DIỆN (Đơn hàng mới)
// -------------------------------------------------------------

function renderPendingOrders(orders) {
    // Xóa nội dung cũ
    pendingOrdersContainer.innerHTML = ''; 

    if (orders.length === 0) {
        pendingOrdersContainer.innerHTML = '<p class="text-secondary">Không có đơn hàng mới nào đang chờ nhận.</p>';
        return;
    }

    orders.forEach(order => {
        // Lấy chi tiết sản phẩm (tên và số lượng)
        const productDetails = order.Details.map(d => `${d.NameProduct} (x${d.Quantity})`).join(', ');
        
        // Lấy địa chỉ lấy hàng (dùng tên Store/Kho)
        const pickupAddress = getStoreName(order.Details); 
        
        const cardHTML = `
            <div class="col-lg-4 col-md-6 order-card" data-order-id="${order.OrderId}">
                <div class="product-card text-center">
                    <img src="${order.Details[0]?.ImageUrl || '../../images/default.png'}" class="img-fluid mb-3" style="max-height: 150px;">
                    <h4 class="text-white">#DH${order.OrderId}</h4>
                    <p class="text-brown-gold fw-bold m-0">${productDetails}</p>
                    
                    <ul class="list-unstyled text-white small pt-2">
                        <li><strong class="text-brown-gold">Lấy Hàng:</strong> ${pickupAddress}</li>
                        <li><strong class="text-brown-gold">Giao Hàng:</strong> ${order.ShipAddress}</li>
                        <li><strong class="text-brown-gold">Tổng Thu:</strong> ${order.TotalAmount} USD</li>
                    </ul>
                    <button class="btn btn-select mt-3" onclick="handleAcceptOrder(${order.OrderId})">CHỌN GIAO</button>
                </div>
            </div>
        `;
        pendingOrdersContainer.innerHTML += cardHTML;
    });
}


// -------------------------------------------------------------
// 3. RENDER: DỰNG GIAO DIỆN (Đơn hàng của tôi)
// -------------------------------------------------------------

function renderMyOrdersTable(orders) {
    // Xóa nội dung cũ
    myOrdersTableBody.innerHTML = ''; 
    
    orders.forEach(order => {
        let actionHTML = '';

        if (order.State === 'Approved') {
            // Đơn hàng đang giao (Hiển thị nút hành động)
            actionHTML = `
                <button class="btn btn-success btn-sm me-2 order-action-btn" onclick="handleUpdateStatus(${order.OrderId}, 'Delivered')">ĐÃ GIAO</button>
                <button class="btn btn-danger btn-sm order-action-btn" onclick="handleUpdateStatus(${order.OrderId}, 'Cancelled')">HỦY GIAO</button>
            `;
        } else if (order.State === 'Delivered') {
            // Đã giao (Hiển thị trạng thái thành công)
            actionHTML = `<span class="badge bg-success p-2 px-3">ĐÃ GIAO</span>`;
        } else if (order.State === 'Cancelled') {
            // Đã hủy (Hiển thị trạng thái hủy)
            actionHTML = `<span class="badge bg-danger p-2 px-3">HỦY GIAO</span>`;
        }
        
        const rowHTML = `
            <tr data-order-id="${order.OrderId}">
                <td>#DH${order.OrderId}</td>
                <td>${order.ShipAddress}</td>
                <td style="color: ${order.TotalAmount > 0 ? '#CD7F32' : '#007BFF'};">${order.TotalAmount} USD</td>
                <td class="text-center">${actionHTML}</td>
            </tr>
        `;
        myOrdersTableBody.innerHTML += rowHTML;
    });
}


// -------------------------------------------------------------
// 4. HANDLER: XỬ LÝ HÀNH ĐỘNG
// -------------------------------------------------------------

// Xử lý nút CHỌN GIAO
async function handleAcceptOrder(orderId) {
    try {
        const response = await fetch('/api/shipper/orders/accept', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: orderId, shipperId: SHIPPER_ID })
        });
        
        const data = await response.json();

        if (data.success) {
            alert(data.message);
            // Tải lại toàn bộ dữ liệu để cập nhật hai danh sách
            await loadAllOrders(); 
        } else {
            alert(`Lỗi: ${data.message}`);
        }
    } catch (error) {
        console.error('Lỗi khi nhận đơn:', error);
        alert('Không thể kết nối để nhận đơn hàng.');
    }
}

// Xử lý nút ĐÃ GIAO / HỦY GIAO
async function handleUpdateStatus(orderId, newState) {
    // Nếu Hủy giao, cần yêu cầu lý do (tùy chọn)
    if (newState === 'Cancelled') {
        const reason = prompt('Vui lòng nhập lý do hủy đơn hàng:');
        if (!reason) return; // Nếu hủy không nhập lý do thì dừng lại
        // Lý do hủy có thể gửi lên API để lưu vào database (chức năng nâng cao)
    }

    try {
        const response = await fetch('/api/shipper/orders/update-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: orderId, shipperId: SHIPPER_ID, newState: newState })
        });

        const data = await response.json();

        if (data.success) {
            alert(data.message);
            // Tải lại toàn bộ dữ liệu để cập nhật trạng thái
            await loadAllOrders(); 
        } else {
            alert(`Lỗi: ${data.message}`);
        }
    } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái:', error);
        alert('Không thể kết nối để cập nhật trạng thái.');
    }
}

// Bắt đầu khi trang tải xong
window.onload = loadAllOrders;