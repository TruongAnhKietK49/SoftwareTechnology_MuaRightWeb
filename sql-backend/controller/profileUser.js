// Lấy thông tin tài khoản từ localStorage
const account = JSON.parse(localStorage.getItem("account")) || {
  AccountId: null,
};
async function fetchUserProfile(CustomerId) {
  try {
    const response = await fetch(
      `http://localhost:3000/user/profile/${CustomerId}`
    );
    if (!response.ok) throw new Error("Failed to fetch profile data");

    const profileData = await response.json();
    return Array.isArray(profileData) ? profileData[0] : profileData;
  } catch (error) {
    console.error("Error fetching profile data:", error);
    alert("Lỗi khi tải thông tin người dùng.");
    return null;
  }
}

// Lấy lịch sử đơn hàng
async function fetchOrderHistories() {
  const CustomerId = JSON.parse(localStorage.getItem("account")).AccountId;
  try {
    const response = await fetch(
      `http://localhost:3000/user/order-history/${CustomerId}`
    );
    if (!response.ok) throw new Error("Failed to fetch order history");

    const orderHistory = await response.json();
    console.log(orderHistory);

    return orderHistory.data || [];
  } catch (error) {
    console.error("Error fetching order histories:", error);
    alert("Lỗi khi tải lịch sử đơn hàng.");
    return [];
  }
}

// Hiển thị thông tin người dùng lên trang profile
function renderProfilePage(data) {
  if (!data) return;

  document.getElementById("profile-join-date").textContent = data.JoinDate
    ? new Date(data.JoinDate).toISOString().split("T")[0]
    : "";
  document.getElementById("profile-avatar-img").src =
    data.ImageUrl || "../../public/Images/default-avatar.png";
  document.getElementById("profile-username").textContent = data.Username || "";
  document.getElementById("profile-email").textContent = data.Email || "";
  document.getElementById("profile-phone").textContent = data.Phone || "";
  document.getElementById("profile-fullname").textContent = data.FullName || "";
  document.getElementById("profile-gender").textContent = data.Gender || "";
  document.getElementById("profile-birthday").textContent = data.Birthday
    ? new Date(data.Birthday).toISOString().split("T")[0]
    : "";
  document.getElementById("profile-address").textContent = data.Address || "";
  document.getElementById("profile-balance").textContent = data.Balance
    ? data.Balance.toLocaleString("vi-VN") + "₫"
    : "0₫";
}

async function openEditModal() {
  const CustomerId = JSON.parse(localStorage.getItem("account")).AccountId;
  const profile = await fetchUserProfile(CustomerId);
  if (!profile) return;

  document.getElementById("edit-email").value = profile.Email || "";
  document.getElementById("edit-phone").value = profile.Phone || "";
  document.getElementById("edit-fullname").value = profile.FullName || "";
  document.getElementById("edit-address").value = profile.Address || "";
  document.getElementById("edit-birthday").value = profile.Birthday
    ? new Date(profile.Birthday).toISOString().split("T")[0]
    : "";
  document.getElementById("edit-gender").value = profile.Gender || "";
}

async function updateUserProfile() {
  const CustomerId = JSON.parse(localStorage.getItem("account")).AccountId;

  const updatedData = {
    Email: document.getElementById("edit-email").value,
    Phone: document.getElementById("edit-phone").value,
    FullName: document.getElementById("edit-fullname").value,
    Address: document.getElementById("edit-address").value,
    Birthday: document.getElementById("edit-birthday").value,
    Gender: document.getElementById("edit-gender").value,
  };

  try {
    const response = await fetch(
      `http://localhost:3000/user/profile/${CustomerId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      }
    );

    if (!response.ok) throw new Error("Failed to update profile");

    alert("Cập nhật thông tin thành công!");
    const updatedProfile = await fetchUserProfile(CustomerId);
    renderProfilePage(updatedProfile);

    // Ẩn modal sau khi cập nhật
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("editProfileModal")
    );
    modal.hide();
  } catch (error) {
    console.error("Error updating profile:", error);
    alert("Lỗi khi cập nhật thông tin người dùng.");
  }
}

// Tải lịch sử đơn hàng
async function renderOrderHistory() {
  const orderHistory = await fetchOrderHistories();
  const historyContainer = document.getElementById("order-history-container");
  historyContainer.innerHTML = "";

  if (!orderHistory || orderHistory.length === 0) {
    historyContainer.innerHTML =
      '<p class="text-muted text-center">Bạn chưa có đơn hàng nào.</p>';
    return;
  }

  orderHistory.forEach((order) => {
    // ⚙️ Trạng thái đơn hàng
    let statusClass = "";
    let statusText = "";
    switch (order.State) {
      case "Pending":
        statusClass = "text-warning";
        statusText = "Chờ xử lý";
        break;
      case "Approved":
        statusClass = "text-info";
        statusText = "Đã duyệt";
        break;
      case "Shipped":
        statusClass = "text-primary";
        statusText = "Đang giao";
        break;
      case "Delivered":
        statusClass = "text-success";
        statusText = "Đã giao";
        break;
      case "Cancelled":
        statusClass = "text-danger";
        statusText = "Đã hủy";
        break;
      default:
        statusText = order.State || "Không xác định";
    }

    // ⚙️ Danh sách sản phẩm trong đơn
    const itemsHTML = order.items
      .map(
        (item) => `
        <div class="order-item">
          <img src="${item.ImageUrl || "../../public/Images/no-image.png"}" 
               alt="${item.ProductName}" class="item-image">
          <div class="item-details">
            <div class="item-name">${item.ProductName}</div>
            <div class="item-seller">Người bán: ${item.SellerName}</div>
            <div class="item-price">${formatPrice(item.UnitPrice)}</div>
          </div>
          <div class="item-quantity">x${item.Quantity}</div>
        </div>
      `
      )
      .join("");

    const orderDiv = document.createElement("div");
    orderDiv.classList.add("order-history-item");
    orderDiv.innerHTML = `
      <div class="order-card">
        <div class="order-header">
          <div>
            <div class="order-id">#${order.OrderId}</div>
            <div class="order-date">${formatDate(order.OrderDate)}</div>
          </div>
          <span class="order-status ${statusClass}">${statusText}</span>
        </div>

        <div class="order-items">
          ${itemsHTML}
        </div>

        <div class="order-summary">
          <div class="order-total">Tổng cộng: ${formatPrice(
            order.TotalAmount
          )}</div>
          <div class="order-actions">
            ${
              order.State === "Pending"
                ? `
              <button class="btn btn-outline-danger btn-sm" onclick="cancelOrder('${order.OrderId}')">
                <i class="bi bi-x-circle me-1"></i>Hủy đơn
              </button>
            `
                : ""
            }
            <button class="btn btn-outline-light btn-sm" onclick="viewOrderDetails('${
              order.OrderId
            }')">
              <i class="bi bi-eye me-1"></i>Chi tiết
            </button>
            ${
              order.State === "Delivered"
                ? `
              <button class="btn btn-warning btn-sm text-dark" onclick="reorder('${order.OrderId}')">
                <i class="bi bi-arrow-repeat me-1"></i>Mua lại
              </button>
            `
                : ""
            }
          </div>
        </div>
      </div>
    `;

    historyContainer.appendChild(orderDiv);
  });
}

// Hàm định dạng ngày tháng
function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// Hàm định dạng tiền tệ
function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price || 0);
}

// Hủy đơn hàng
async function cancelOrder(orderId) {
  if (!confirm("Bạn có chắc muốn hủy đơn hàng này không?")) return;

  try {
    const response = await fetch(
      `http://localhost:3000/user/cancel-order/${orderId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      alert(data.message || "Không thể hủy đơn hàng. Vui lòng thử lại.");
      return;
    }

    // ✅ Cập nhật giao diện
    const orderCard = Array.from(document.querySelectorAll(".order-card")).find(
      (card) =>
        card.querySelector(".order-id")?.textContent.includes(`#${orderId}`)
    );

    if (orderCard) {
      const statusEl = orderCard.querySelector(".order-status");
      statusEl.textContent = "Đã hủy";
      statusEl.className = "order-status text-danger";

      const cancelBtn = orderCard.querySelector(".btn-outline-danger");
      if (cancelBtn) cancelBtn.remove();

      alert("Đơn hàng đã được hủy thành công.");
      window.location.reload();
    } else {
      window.location.reload();
    }
  } catch (err) {
    console.error("Lỗi khi hủy đơn hàng:", err);
    alert("Có lỗi xảy ra khi hủy đơn hàng. Vui lòng thử lại sau.");
  }
}

// Khởi tạo trang khi tải xong
document.addEventListener("DOMContentLoaded", async () => {
  const account = JSON.parse(localStorage.getItem("account"));
  if (!account || !account.AccountId) {
    window.location.href = "../../template/pages/signIn_page.html";
    return;
  }

  const CustomerId = account.AccountId;
  const profileData = await fetchUserProfile(CustomerId);
  renderProfilePage(profileData);

  const editModal = document.getElementById("editProfileModal");
  editModal.addEventListener("show.bs.modal", openEditModal);

  document
    .getElementById("save-profile-btn")
    .addEventListener("click", updateUserProfile);
  await renderOrderHistory();
});
