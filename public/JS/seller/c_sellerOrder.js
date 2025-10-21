// File: c_sellerOrder.js (ĐÃ SỬA LỖI VÀ HOÀN THIỆN)
const API_URL = "http://localhost:3000/seller";
let sellerId = null;
let allOrders = [];
let currentFilter = 'ALL'; // Sửa giá trị mặc định để khớp với backend

const STATUS_CONFIG = {
    'Pending': { class: 'bg-warning', text: 'Chờ xác nhận', icon: 'clock' },
    'Approved': { class: 'bg-info', text: 'Đã xác nhận', icon: 'check' },
    'Shipped': { class: 'bg-primary', text: 'Đang giao', icon: 'truck' },
    'Delivered': { class: 'bg-success', text: 'Đã giao', icon: 'check-circle' },
    'Cancelled': { class: 'bg-danger', text: 'Đã hủy', icon: 'times-circle' }
};

const DB_STATUS_MAP = {
    'pending': 'Pending',
    'confirmed': 'Approved',
    'shipping': 'Shipped',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled',
    'all': 'ALL'
};

// --- HÀM LẤY DỮ LIỆU CHÍNH ---
async function loadOrders(status = currentFilter) {
    try {
        const accountString = localStorage.getItem("account");
        if (!accountString) {
            console.error("Không tìm thấy tài khoản Seller trong localStorage.");
            alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
            window.location.href = '../../template/pages/signIn_page.html';
            return;
        }

        const account = JSON.parse(accountString);
         sellerId = account.AccountId; 

        if (!sellerId || isNaN(sellerId)) {
            console.error("AccountId không hợp lệ từ localStorage:", sellerId);
            console.log("Dữ liệu account từ localStorage:", account); 
            document.getElementById('ordersContainer').innerHTML = `<p class="text-center text-danger mt-5">Không thể xác thực người bán. Vui lòng đăng nhập lại.</p>`;
            return;
        }

        const apiUrl = status.toUpperCase() === 'ALL'
                       ? `${API_URL}/orders/${sellerId}`
                       : `${API_URL}/orders/${sellerId}?state=${status}`;

        const response = await fetch(apiUrl);
        const result = await response.json();

        if (response.ok && result.success) {
            allOrders = result.data.map(order => ({
                ...order,
                id: order.OrderId,
                state: order.State,
                total: order.TotalAmount,
                // SỬA LẠI: API trả về CustomerName và CustomerPhone trực tiếp
                customerName: order.CustomerName,
                customerPhone: order.CustomerPhone,
                date: new Date(order.OrderDate).toLocaleString('vi-VN', {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit'
                }).replace(',', ' -')
            }));

            displayOrders(allOrders);
            updateStatusCounts(allOrders);
        } else {
            console.error("Lỗi API tải đơn hàng:", result.message);
            document.getElementById('ordersContainer').innerHTML = `<p class="text-center text-muted mt-5">Không thể tải đơn hàng: ${result.message}</p>`;
            updateStatusCounts([]);
        }
    } catch (error) {
        console.error('❌ Lỗi loadOrders:', error);
        document.getElementById('ordersContainer').innerHTML = `<p class="text-center text-danger mt-5">Lỗi kết nối Server. Vui lòng kiểm tra backend.</p>`;
    }
}

// --- RENDER VÀ FILTER ---
function updateStatusCounts(ordersList) {
    const all = ordersList;
    const pending = all.filter(o => o.state === 'Pending');
    const approved = all.filter(o => o.state === 'Approved');
    const shipping = all.filter(o => o.state === 'Shipped');
    const delivered = all.filter(o => o.state === 'Delivered');
    const cancelled = all.filter(o => o.state === 'Cancelled');

    // SỬA LẠI: Đếm tổng số đơn hàng của seller thay vì chỉ những đơn hàng đang hiển thị
    document.getElementById('countAll').textContent = all.length;
    document.getElementById('countPending').textContent = pending.length;
    // SỬA LẠI: Tab "Đã xác nhận" chỉ nên đếm đơn 'Approved'
    document.getElementById('countConfirmed').textContent = approved.length;
    document.getElementById('countShipping').textContent = shipping.length;
    document.getElementById('countDelivered').textContent = delivered.length;
    document.getElementById('countCancelled').textContent = cancelled.length;
}


function displayOrders(ordersToDisplay) {
    const container = document.getElementById('ordersContainer');
    container.innerHTML = '';

    if (ordersToDisplay.length === 0) {
        container.innerHTML = `<p class="text-center text-muted mt-5">Không có đơn hàng nào trong trạng thái này.</p>`;
        return;
    }

    ordersToDisplay.forEach(order => {
        container.innerHTML += createOrderCard(order);
    });
}

function createOrderCard(order) {
    const config = STATUS_CONFIG[order.state];
    // SỬA LẠI: Dùng order.customerName
    const initials = (order.customerName || 'KH').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    let actions = '';
    if (order.state === 'Pending') {
        actions = `
            <button class="btn btn-success btn-sm me-1" onclick="confirmOrder(${order.id})"><i class="fas fa-check"></i> Xác nhận</button>
            <button class="btn btn-danger btn-sm" onclick="showCancelModal(${order.id})"><i class="fas fa-times"></i> Hủy</button>`;
    } else if (order.state === 'Approved') {
        actions = `<button class="btn btn-primary btn-sm" onclick="updateOrderStatus(${order.id}, 'Shipped')"><i class="fas fa-shipping-fast"></i> Giao hàng</button>`;
    } else if (order.state === 'Shipped') {
        actions = `<button class="btn btn-success btn-sm" onclick="updateOrderStatus(${order.id}, 'Delivered')"><i class="fas fa-check"></i> Đã giao</button>`;
    } else if (order.state === 'Delivered') {
        actions = `<span class="badge bg-success"><i class="fas fa-check-circle"></i> Giao thành công</span>`;
    } else if (order.state === 'Cancelled') {
        actions = `<span class="badge bg-danger"><i class="fas fa-times-circle"></i> Đã hủy</span>`;
    }

    return `
        <div class="order-card" onclick="showOrderDetail(${order.id})">
            <div class="order-header">
                <div>
                    <span class="order-id">#DH${order.id}</span>
                    <span class="badge ${config.class} ms-2"><i class="fas fa-${config.icon}"></i> ${config.text}</span>
                </div>
                <div class="order-date"><i class="far fa-calendar"></i> ${order.date}</div>
            </div>
            <div class="order-body-simple">
                 <div class="customer-info-simple">
                    <div class="customer-avatar">${initials}</div>
                    <div class="customer-details">
                        <h6>${order.customerName || 'Khách hàng'}</h6>
                        <p><i class="fas fa-phone"></i> ${order.customerPhone || '-'}</p>
                    </div>
                </div>
                 <div class="order-total-simple">
                    <div class="order-total-label">Tổng tiền:</div>
                    <div class="order-total-amount">${formatPrice(order.total)}</div>
                </div>
            </div>
            <div class="order-footer-actions">
                ${actions}
            </div>
        </div>`;
}

function filterByStatus(statusKey) { 
    const dbStatus = DB_STATUS_MAP[statusKey];
    currentFilter = dbStatus;

    document.querySelectorAll('.status-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelector(`[data-status="${statusKey}"]`).classList.add('active'); // ✅ Tìm tab bằng data-status

    if (dbStatus === 'ALL') {
        displayOrders(allOrders);
    } else {
        const filtered = allOrders.filter(order => order.state === dbStatus);
        displayOrders(filtered);
    }
}

// --- HÀM XỬ LÝ API ---
async function confirmOrder(orderId) {
    event.stopPropagation(); // Ngăn modal chi tiết mở ra
    if (!confirm(`Xác nhận đơn hàng #DH${orderId} này?`)) return;
    await updateOrderStatus(orderId, 'Approved');
}

async function updateOrderStatus(orderId, newStatus) {
    event.stopPropagation(); // Ngăn modal chi tiết mở ra
    const statusText = STATUS_CONFIG[newStatus]?.text || newStatus;
    if (!confirm(`Chuyển đơn hàng #DH${orderId} sang trạng thái "${statusText}"?`)) return;

    try {
        const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newState: newStatus })
        });
        const result = await response.json();
        alert(result.message);
        if (response.ok && result.success) await loadOrders(currentFilter);
        else alert(`Lỗi: ${result.message}`);
    } catch (error) {
        console.error(`❌ Lỗi khi cập nhật sang ${newStatus}:`, error);
        alert(`Lỗi kết nối Server khi cập nhật trạng thái đơn hàng!`);
    }
}

function showCancelModal(orderId) {
    event.stopPropagation(); // Ngăn modal chi tiết mở ra
    document.getElementById('cancelOrderId').value = orderId;
    const modal = new bootstrap.Modal(document.getElementById('cancelOrderModal'));
    modal.show();
}

async function confirmCancelOrder() {
    const orderId = document.getElementById('cancelOrderId').value;
    const reason = document.getElementById('cancelReason').value;
    const note = document.getElementById('cancelNote').value;
    const cancelReason = reason + (note ? ` (Ghi chú: ${note})` : '');

    if (!reason) {
        alert('Vui lòng chọn lý do hủy đơn');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cancelReason })
        });
        const result = await response.json();
        alert(result.message);
        if (response.ok && result.success) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('cancelOrderModal'));
            modal.hide();
            await loadOrders(currentFilter);
        } else {
            alert(`Lỗi: ${result.message}`);
        }
    } catch (error) {
        console.error("❌ Lỗi hủy đơn hàng:", error);
        alert('Lỗi kết nối Server khi hủy đơn hàng!');
    }
}

// --- HÀM TIỆN ÍCH ---
function formatPrice(price) {
    if (price === null || price === undefined) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

async function showOrderDetail(orderId) {
    const modalElement = document.getElementById('orderDetailModal');
    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    const contentDiv = document.getElementById('orderDetailContent');
    contentDiv.innerHTML = '<p class="text-center my-5"><i class="fas fa-spinner fa-spin"></i> Đang tải chi tiết...</p>';
    modal.show();

    try {
        const response = await fetch(`${API_URL}/order/detail/${orderId}/${sellerId}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Không thể tải chi tiết đơn hàng.');
        }

        const detail = result.data;
        const statusConfig = STATUS_CONFIG[detail.State]; // Lấy config từ trạng thái DB

        let itemsHtml = detail.Items.map(item => `
            <div class="order-item-detail">
                <img src="${item.ImageUrl || '../../public/images/default-product.png'}" alt="${item.NameProduct}" class="item-image" onerror="this.onerror=null;this.src='../../public/images/default-product.png';">
                <div class="item-info">
                    <h6>${item.NameProduct}</h6>
                    <p class="text-muted">Đơn giá: ${formatPrice(item.UnitPrice)}</p>
                    <p class="text-muted">Số lượng: ${item.Quantity}</p>
                </div>
                <div class="item-price">${formatPrice(item.LineTotal)}</div>
            </div>
        `).join('');

        contentDiv.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h5>Thông tin khách hàng</h5>
                    <p><strong>Tên:</strong> ${detail.CustomerName}</p>
                    <p><strong>SĐT:</strong> ${detail.CustomerPhone}</p>
                    <p><strong>Địa chỉ:</strong> ${detail.CustomerAddress}</p>
                </div>
                <div class="col-md-6">
                    <h5>Thông tin đơn hàng</h5>
                    <p><strong>Mã đơn hàng:</strong> #DH${detail.OrderId}</p>
                    <p><strong>Ngày đặt:</strong> ${new Date(detail.OrderDate).toLocaleString('vi-VN')}</p>
                    <p><strong>Trạng thái:</strong> <span class="badge ${statusConfig.class}">${statusConfig.text}</span></p>
                    <p><strong>Địa chỉ giao hàng:</strong> ${detail.ShipAddress || detail.CustomerAddress}</p>
                </div>
            </div>
            <hr>
            <h5>Sản phẩm của bạn trong đơn</h5>
            <div class="items-container">${itemsHtml}</div>
            <hr>
            <div class="text-end">
                <p class="mb-1"><strong>Tổng tiền các sản phẩm:</strong> ${formatPrice(detail.SubTotalForSeller)}</p>
            </div>
        `;

    } catch (error) {
        contentDiv.innerHTML = `<p class="text-center text-danger my-5">${error.message}</p>`;
        console.error("❌ Lỗi showOrderDetail:", error);
    }
}

function printOrder() { window.print(); }
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('show'); }

// --- KHỞI TẠO ---
document.addEventListener('DOMContentLoaded', function() {
    const accountString = localStorage.getItem("account");
    if (!accountString) {
        alert("Vui lòng đăng nhập để truy cập.");
        window.location.href = '../../template/pages/signIn_page.html';
        return;
    }
    const account = JSON.parse(accountString);
    if (account.Role !== 'Seller') {
         alert("Bạn không có quyền truy cập trang này.");
         window.location.href = '../../template/pages/signIn_page.html';
         return;
    }

    loadOrders();

    document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
            localStorage.removeItem('account');
            window.location.href = '../../template/pages/signIn_page.html';
        }
    });

    document.getElementById('searchInput').addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        const filtered = allOrders.filter(order =>
            order.id.toString().includes(searchTerm) ||
            (order.customerName && order.customerName.toLowerCase().includes(searchTerm))
        );
        displayOrders(filtered);
    });

    document.querySelectorAll('.status-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            filterByStatus(this.dataset.status);
        });
    });
});