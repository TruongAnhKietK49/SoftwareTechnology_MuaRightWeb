// Load dữ liệu thống kê
// Hàm tải dữ liệu thống kê và hiển thị lên dashboard
async function loadingStatistics() {
  try {
    const res = await fetch("http://localhost:3000/admin/dashboard/statistics");
    if (!res.ok) throw new Error("Không thể tải dữ liệu thống kê");
    const data = await res.json();
    console.log("📊 Dữ liệu thống kê:", data);

    // Gọi hàm hiển thị
    renderStatistics(data);
  } catch (error) {
    console.error("Lỗi khi tải thống kê:", error);
  }
}

// Hàm hiển thị dữ liệu vào giao diện
function renderStatistics(data) {
  const formatCurrency = (num) =>
    num.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  document.getElementById("totalOrders").textContent =
    data.orderProduct.length || 0;
  document.getElementById("totalRevenue").textContent = formatCurrency(
    data.revenue || 0
  );
  document.getElementById("totalUsers").textContent = data.accounts.length || 0;
  document.getElementById("totalProducts").textContent =
    data.products.length || 0;
}

// Lấy dữ liệu tạo voucher
document
  .getElementById("createVoucherForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const voucher = {
      Code: document.getElementById("voucherCode").value.trim(),
      CreatedByAdmin: document.getElementById("username").innerText,
      DiscountType: document.getElementById("discountType").value,
      DiscountVal: parseFloat(document.getElementById("discountVal").value),
      MinOrderAmt: parseFloat(document.getElementById("minOrderAmt").value),
      ValidFrom: document.getElementById("validFrom").value,
      ValidTo: document.getElementById("validTo").value,
    };
    console.log(voucher);

    try {
      const res = await fetch(
        "http://localhost:3000/admin/dashboard/vouchers",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(voucher),
        }
      );

      if (!res.ok) throw new Error("Tạo voucher thất bại");

      alert("🎉 Voucher đã được tạo thành công!");
      e.target.reset();
    } catch (err) {
      console.error(err);
      alert("❌ Có lỗi xảy ra khi tạo voucher.");
    }
  });

// 📊 Tải dữ liệu và vẽ biểu đồ doanh thu theo tháng
async function loadRevenueChart() {
  try {
    const res = await fetch("http://localhost:3000/admin/dashboard/revenue");
    const data = await res.json();

    // Chuyển dữ liệu thành mảng cho biểu đồ
    const labels = data.map((item) => `Tháng ${item.Month}/${item.Year}`);
    const revenues = data.map((item) => item.Revenue);

    // Nếu đã có biểu đồ trước đó, hủy trước khi vẽ mới
    if (
      window.revenueChart &&
      typeof window.revenueChart.destroy === "function"
    ) {
      window.revenueChart.destroy();
    }

    const ctx = document.getElementById("revenueChart").getContext("2d");
    window.revenueChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Doanh thu (VNĐ)",
            data: revenues,
            backgroundColor: "rgba(54, 162, 235, 0.6)",
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return value.toLocaleString("vi-VN") + " ₫";
              },
            },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                return ctx.formattedValue + " ₫";
              },
            },
          },
        },
      },
    });
  } catch (err) {
    console.error("Lỗi khi tải biểu đồ doanh thu:", err);
  }
}

async function loadRecentActivities() {
  try {
    const res = await fetch("http://localhost:3000/admin/recent-activity");
    if (!res.ok) throw new Error("Lỗi tải hoạt động gần đây");
    const activities = await res.json();

    const container = document.querySelector(".activity-list");
    container.innerHTML = "";

    activities.forEach((act) => {
      const html = `
        <div class="activity-item">
          <div class="activity-icon ${act.Color}">
            <i class="${act.Icon}"></i>
          </div>
          <div class="activity-content">
            <div class="activity-title">${act.Title}</div>
            <div class="activity-time">${timeAgo(new Date(act.Time))}</div>
          </div>
        </div>
      `;
      container.insertAdjacentHTML("beforeend", html);
    });
  } catch (err) {
    console.error("❌ Lỗi load hoạt động:", err);
  }
}

// 🕓 Hàm hiển thị "x phút trước"
function timeAgo(time) {
  const diff = Math.floor((Date.now() - time.getTime()) / 60000);
  if (diff < 1) return "Vừa xong";
  if (diff < 60) return `${diff} phút trước`;
  const hours = Math.floor(diff / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

async function loadTopProducts() {
  try {
    const res = await fetch("http://localhost:3000/admin/top-products");
    const data = await res.json();

    const tbody = document.querySelector("#topProductsTable");
    tbody.innerHTML = "";

    data.forEach((item) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          <div class="d-flex align-items-center">
            <img src="${item.ImageUrl}" class="rounded me-3"
                alt="${item.NameProduct}" style="width: 40px; height: 40px; object-fit: cover;">
            <div>
              <div class="fw-semibold">${item.NameProduct}</div>
              <small class="text-muted">${item.Category}</small>
            </div>
          </div>
        </td>
        <td class="text-center">${item.TotalSold}</td>
        <td class="text-end">${item.Revenue.toLocaleString("vi-VN")}₫</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Lỗi khi tải top sản phẩm:", err);
  }
}

document.addEventListener(
  "DOMContentLoaded",
  () => loadingStatistics(),
  loadRevenueChart(),
  loadRecentActivities(),
  loadTopProducts()
);
