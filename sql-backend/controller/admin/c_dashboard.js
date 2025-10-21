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

// Gọi hàm khi trang tải xong
document.addEventListener("DOMContentLoaded", loadRevenueChart);

document.addEventListener(
  "DOMContentLoaded",
  () => loadingStatistics(),
  loadRevenueChart()
);
