// public/js/shipper.js
const API_BASE = `${location.origin}/api/shipper`; // chỉnh nếu BE khác origin
// Có thể lấy shipperId sau đăng nhập:
function getShipperId() {
  const raw = localStorage.getItem('account');
  if (!raw) return null;
  try {
    const acc = JSON.parse(raw);
    const id = Number(acc?.AccountId ?? acc?.ShipperId);
    return Number.isFinite(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

const shipperId = getShipperId(); // fallback 1

// Helper fetch JSON
async function http(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...opts,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`[${res.status}] ${text || res.statusText}`);
  }
  return res.json().catch(() => ({}));
}

// ===============================
// 1) LẤY ĐƠN HÀNG
// ===============================
export async function getPendingOrders() {
  return http(`/orders/pending`, { method: 'GET' });
}

export async function getMyOrders() {
  return http(`/orders/my-orders/${shipperId}`, { method: 'GET' });
}

// ===============================
// 2) NHẬN ĐƠN & CẬP NHẬT TRẠNG THÁI
// ===============================
export async function acceptOrder(orderId) {
  return http(`/orders/accept`, {
    method: 'POST',
    body: JSON.stringify({ orderId, shipperId }),
  });
}

// newState: 'Delivered' | 'Cancelled'
export async function updateOrderStatus(orderId, newState) {
  return http(`/orders/update-status`, {
    method: 'POST',
    body: JSON.stringify({ orderId, shipperId, newState }),
  });
}

// ===============================
// 3) RENDER UI
// ===============================
const elPendingContainer = document.querySelector('#pending-orders-container');
const elMyOrdersTbody   = document.querySelector('#my-orders-tbody'); // đổi id trong HTML

function currency(vndOrUsd) {
  // Đổi theo dữ liệu thực tế. Tạm hiển thị số có phân cách.
  if (typeof vndOrUsd === 'number') return vndOrUsd.toLocaleString('vi-VN');
  return vndOrUsd || '';
}

function orderCard(order) {
  const id = order.OrderId;
  // Lấy ảnh đầu tiên trong chi tiết nếu có
  const img = (order.Details?.[0]?.ImageUrl) || '../../images/placeholder-product.png';
  const firstName = (order.Details?.[0]?.NameProduct) || 'Sản phẩm';
  const qty = (order.Details?.[0]?.Quantity) || 1;
  const seller = (order.Details?.[0]?.SellerStore) || 'Kho';
  return `
    <div class="col-lg-4 col-md-6 order-card" data-order-id="${id}">
      <div class="product-card text-center glass-card">
        <img src="${img}" class="img-fluid mb-3 product-thumb" alt="product">
        <h4 class="text-white">#${id}</h4>
        <p class="text-accent fw-bold m-0">${firstName} (x${qty})</p>
        <ul class="list-unstyled text-white small pt-2 text-start">
          <li><strong class="text-accent">Lấy hàng:</strong> ${seller}</li>
          <li><strong class="text-accent">Giao hàng:</strong> ${order.ShipAddress || '-'}</li>
          <li><strong class="text-accent">Phí ship:</strong> ${currency(order.ShippingFee)}</li>
          <li><strong class="text-accent">Tổng tiền:</strong> ${currency(order.TotalAmount)}</li>
        </ul>
        <button class="btn btn-accent mt-3 order-accept-btn" data-id="${id}">
          <i class="fa-solid fa-truck-fast me-1"></i> CHỌN GIAO
        </button>
      </div>
    </div>
  `;
}

function myOrderRow(order) {
  const id = order.OrderId;
  const state = order.State;
  return `
    <tr data-order-id="${id}">
      <td class="fw-semibold">#${id}</td>
      <td>${order.ShipAddress || '-'}</td>
      <td class="text-accent fw-bold">${currency(order.TotalAmount)}</td>
      <td class="text-center">
        <div class="btn-group gap-2">
          <button class="btn btn-success btn-sm order-action-btn deliver-btn" data-id="${id}" ${state==='Delivered'?'disabled':''}>
            <i class="fa-solid fa-circle-check me-1"></i> ĐÃ GIAO
          </button>
          <button class="btn btn-danger btn-sm order-action-btn cancel-btn" data-id="${id}" ${state==='Cancelled'?'disabled':''}>
            <i class="fa-solid fa-ban me-1"></i> HỦY GIAO
          </button>
        </div>
        <div class="small mt-1"><span class="badge bg-state">${state}</span></div>
      </td>
    </tr>
  `;
}

// ===============================
// 4) BOOTSTRAP PAGE
// ===============================
async function refreshPending() {
  try {
    const data = await getPendingOrders();
    elPendingContainer.innerHTML = data.length
      ? data.map(orderCard).join('')
      : `<div class="col-12"><div class="empty-state">Chưa có đơn chờ nhận</div></div>`;
  } catch (e) {
    toast('Lỗi tải đơn chờ nhận: ' + e.message, 'danger');
  }
}

async function refreshMyOrders() {
  try {
    const data = await getMyOrders();
    elMyOrdersTbody.innerHTML = data.length
      ? data.map(myOrderRow).join('')
      : `<tr><td colspan="4"><div class="empty-state">Bạn chưa nhận đơn nào</div></td></tr>`;
  } catch (e) {
    toast('Lỗi tải đơn của tôi: ' + e.message, 'danger');
  }
}

// ===============================
// 5) SỰ KIỆN NÚT
// ===============================
document.addEventListener('click', async (ev) => {
  const acceptBtn = ev.target.closest('.order-accept-btn');
  if (acceptBtn) {
    const id = Number(acceptBtn.dataset.id);
    acceptBtn.disabled = true;
    try {
      await acceptOrder(id);
      toast(`Đã nhận đơn #${id}`, 'success');
      await Promise.all([refreshPending(), refreshMyOrders()]);
    } catch (e) {
      toast(`Nhận đơn thất bại: ${e.message}`, 'danger');
      acceptBtn.disabled = false;
    }
  }

  const deliverBtn = ev.target.closest('.deliver-btn');
  if (deliverBtn) {
    const id = Number(deliverBtn.dataset.id);
    deliverBtn.disabled = true;
    try {
      await updateOrderStatus(id, 'Delivered');
      toast(`Đã cập nhật #${id} → ĐÃ GIAO`, 'success');
      await refreshMyOrders();
    } catch (e) {
      toast(`Cập nhật thất bại: ${e.message}`, 'danger');
      deliverBtn.disabled = false;
    }
  }

  const cancelBtn = ev.target.closest('.cancel-btn');
  if (cancelBtn) {
    const id = Number(cancelBtn.dataset.id);
    if (!confirm(`Hủy giao đơn #${id}?`)) return;
    cancelBtn.disabled = true;
    try {
      await updateOrderStatus(id, 'Cancelled');
      toast(`Đơn #${id} đã hủy giao`, 'warning');
      // Hủy giao → quay lại “đơn chờ nhận”
      await Promise.all([refreshPending(), refreshMyOrders()]);
    } catch (e) {
      toast(`Cập nhật thất bại: ${e.message}`, 'danger');
      cancelBtn.disabled = false;
    }
  }
});

// ===============================
// 6) TOAST NHO NHẸ
// ===============================
function toast(message, type = 'info') {
  const holder = document.getElementById('toast-holder') || (() => {
    const d = document.createElement('div');
    d.id = 'toast-holder';
    d.className = 'toast-holder';
    document.body.appendChild(d);
    return d;
  })();
  const item = document.createElement('div');
  item.className = `toast-item toast-${type}`;
  item.textContent = message;
  holder.appendChild(item);
  setTimeout(() => item.classList.add('show'));
  setTimeout(() => {
    item.classList.remove('show');
    setTimeout(() => item.remove(), 300);
  }, 2500);
}

// Khởi động
(async function init() {
  await Promise.all([refreshPending(), refreshMyOrders()]);
})();
