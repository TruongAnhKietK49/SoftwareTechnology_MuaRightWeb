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
          <img 
            src="${item.ImageUrl}" 
            alt="${item.NameProduct}" 
            class="product-img rounded me-3"
          >
          <div>
            <div class="fw-semibold">${item.NameProduct}</div>
            <small >${item.Category}</small>
          </div>
        </div>
      </td>
      <td class="text-center fw-semibold">${item.TotalSold}</td>
      <td class="text-end fw-semibold ">
        ${item.Revenue.toLocaleString("vi-VN")}₫
      </td>

      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Lỗi khi tải top sản phẩm:", err);
  }
}

// ===== Doanh thu theo Brand (Pie Chart) =====
async function loadRevenueByBrand() {
  try {
    const response = await fetch(
      "http://localhost:3000/admin/dashboard/revenue-pie-chart"
    );
    const data = await response.json();

    // Kiểm tra dữ liệu
    if (!data || data.length === 0) {
      console.warn("⚠️ Không có dữ liệu doanh thu theo brand");
      const ctx = document.getElementById("pieChart").getContext("2d");
      ctx.font = "16px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        "Không có dữ liệu",
        ctx.canvas.width / 2,
        ctx.canvas.height / 2
      );
      return;
    }

    // Chuẩn bị dữ liệu
    const brands = data.map((item) => item.Brand);
    const revenues = data.map((item) => item.Revenue);

    // Lấy phần tử canvas và đặt chiều cao đồng bộ
    const canvas = document.getElementById("pieChart");
    canvas.height = 300; // chiều cao cố định để khớp với lineChart
    const ctx = canvas.getContext("2d");

    // Hủy biểu đồ cũ nếu tồn tại (tránh bị trùng lặp)
    if (window.pieChartInstance) {
      window.pieChartInstance.destroy();
    }

    // Tạo biểu đồ tròn
    window.pieChartInstance = new Chart(ctx, {
      type: "pie",
      data: {
        labels: brands,
        datasets: [
          {
            label: "Doanh thu",
            data: revenues,
            backgroundColor: [
              "#4e73df",
              "#1cc88a",
              "#36b9cc",
              "#f6c23e",
              "#e74a3b",
              "#858796",
              "#2e59d9",
              "#17a673",
              "#6610f2",
              "#20c997",
            ],
            borderWidth: 1,
            hoverOffset: 12,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, // rất quan trọng để khớp chiều cao container
        plugins: {
          legend: {
            position: "bottom",
            labels: { font: { size: 14 } },
          },
          tooltip: {
            callbacks: {
              label: (context) =>
                `${context.label}: ${context.formattedValue}₫`,
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("❌ Lỗi khi tải doanh thu theo brand:", error);
  }
}

// ===== Biểu đồ line Chart =====
let lineChartInstance; // 👈 để quản lý chart line

async function loadUserRegistrationChart() {
  try {
    const res = await fetch(
      "http://localhost:3000/admin/dashboard/user-registration-line"
    );
    const data = await res.json();
    console.log(data);

    if (!Array.isArray(data) || data.length === 0) {
      console.warn("Không có dữ liệu người dùng đăng ký theo tháng.");
      return;
    }

    // Chuẩn bị dữ liệu
    const months = data.map((item) => `Tháng ${item.Month}`);
    const totals = data.map((item) => item.TotalUsers);

    const ctx = document.getElementById("lineChart");

    // ✅ Hủy chart cũ nếu có
    if (lineChartInstance) {
      lineChartInstance.destroy();
    }

    // ✅ Tạo chart mới
    lineChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: months,
        datasets: [
          {
            label: "Người dùng đăng ký",
            data: totals,
            borderWidth: 3,
            fill: true,
            tension: 0.3,
            pointBackgroundColor: "#f72585",
            borderColor: "#3a0ca3",
            backgroundColor: "rgba(67,97,238,0.15)",
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: "Thống kê người dùng đăng ký theo tháng",
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
      },
    });
  } catch (err) {
    console.error("Lỗi khi tải biểu đồ người dùng đăng ký:", err);
  }
}

document.addEventListener(
  "DOMContentLoaded",
  () => loadingStatistics(),
  loadRevenueChart(),
  loadRecentActivities(),
  loadTopProducts(),
  loadRevenueByBrand(),
  loadUserRegistrationChart()
);
