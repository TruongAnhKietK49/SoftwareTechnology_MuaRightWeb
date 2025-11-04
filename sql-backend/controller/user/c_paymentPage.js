// ===================== CÁC HÀM LOAD DỮ LIỆU =====================
const account = JSON.parse(localStorage.getItem("account")) || {};

async function loadAccount() {
  try {
    const response = await fetch(
      `http://localhost:3000/user/profile/${account.AccountId}`
    );
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu tài khoản:", error);
    return null;
  }
}

async function loadCartItems() {
  try {
    const response = await fetch(
      `http://localhost:3000/cart/getAllItem/${account.AccountId}`
    );
    const result = await response.json();
    console.log(result.data);
    return result.data || [];
    
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu giỏ hàng:", error);
    return [];
  }
}

async function populateUserInfo() {
  const profile = await loadAccount();
  if (!profile) return;
  document.getElementById("fullName").value = profile.FullName || "";
  document.getElementById("phone").value = profile.Phone || "";
  document.getElementById("email").value = profile.Email || "";
  document.getElementById("address").value = profile.Address || "";
}

// ===================== HIỂN THỊ DANH SÁCH GIỎ HÀNG =====================
async function displayCartItems() {
  const cartItems = await loadCartItems();
  const cartList = document.getElementById("cartList");
  cartList.innerHTML = "";

  if (cartItems.length === 0) {
    cartList.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-white py-4">
          <i class="bi bi-cart-x fs-1 d-block mb-2"></i>
          <p>Giỏ hàng của bạn đang trống.</p>
        </td>
      </tr>`;
    return;
  }

  cartItems.forEach((item) => {
    const total = item.Price * item.Quantity;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-center align-middle">
        <input type="checkbox" class="form-check-input select-item"
          data-id="${item.BasketId}"
          data-productid="${item.ProductId}"
          data-sellerid="${item.SellerId}"
          data-price="${item.Price}"
          data-quantity="${item.Quantity}">
      </td>
      <td>
        <div class="d-flex align-items-center">
          <img src="${item.ImageUrl}" alt="${item.NameProduct}"
            class="product-img me-3" style="width:80px; height:80px; object-fit:cover;">
          <div>
            <div class="product-name fw-semibold">${item.NameProduct}</div>
            <small class="text-muted">${item.Brand}</small>
          </div>
        </div>
      </td>
      <td class="product-price">${item.Price.toLocaleString("vi-VN")}₫</td>
      <td class="text-center align-middle">
        <input type="text" class="quantity-input form-control form-control-sm text-center mx-auto"
          value="${item.Quantity}" style="width:50px;" readonly>
      </td>
      <td class="product-price">${total.toLocaleString("vi-VN")}₫</td>`;
    cartList.appendChild(tr);
  });

  // Xử lý cập nhật đơn hàng
  const updateBtn = document.getElementById("updateOrderBtn");
  if (updateBtn) {
    updateBtn.onclick = function () {
      const shippingFee = 30000;
      let orderTotal = 0;

      const selectedItems = document.querySelectorAll(".select-item:checked");
      if (selectedItems.length === 0) {
        alert("Vui lòng chọn ít nhất một sản phẩm để cập nhật đơn hàng.");
        return;
      }

      selectedItems.forEach((checkbox) => {
        const price = parseInt(checkbox.dataset.price);
        const quantity = parseInt(checkbox.dataset.quantity);
        orderTotal += price * quantity;
      });

      // Cập nhật giao diện (chưa có giảm giá)
      document.getElementById("orderTotal").textContent =
        orderTotal.toLocaleString("vi-VN") + "₫";
      document.getElementById("shippingFee").textContent =
        shippingFee.toLocaleString("vi-VN") + "₫";

      // Reset giảm giá về 0
      document.getElementById("discount").textContent = "-0₫";

      // Tổng thanh toán = tổng hàng + ship
      const totalPayment = orderTotal + shippingFee;
      document.getElementById("totalPayment").textContent =
        totalPayment.toLocaleString("vi-VN") + "₫";

      // Lưu tạm giá trị gốc để voucher có thể tính dựa trên đó
      document.getElementById("orderTotal").dataset.value = orderTotal;
      document.getElementById("shippingFee").dataset.value = shippingFee;
    };
  }
}

// ===================== ÁP DỤNG VOUCHER =====================
document
  .getElementById("applyVoucherBtn")
  .addEventListener("click", async () => {
    const voucherCode = document.getElementById("voucher").value.trim();
    const messageDiv = document.getElementById("voucherMessage");
    const customerId = account.AccountId;

    // Kiểm tra nếu chưa cập nhật đơn hàng
    const orderTotalRaw = document.getElementById("orderTotal").dataset.value;
    if (!orderTotalRaw || orderTotalRaw === "0") {
      alert("Vui lòng cập nhật đơn hàng trước khi áp dụng voucher!");
      return;
    }

    if (!voucherCode) {
      messageDiv.textContent = "⚠️ Vui lòng nhập mã giảm giá.";
      messageDiv.classList.add("text-danger");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/user/check-voucher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voucherCode, customerId }),
      });

      const data = await response.json();
      console.log("Kết quả kiểm tra voucher:", data);

      if (!data.valid) {
        messageDiv.textContent =
          data.message || "❌ Mã giảm giá không hợp lệ hoặc đã được sử dụng.";
        messageDiv.classList.remove("text-success");
        messageDiv.classList.add("text-danger");
        document.getElementById("discount").textContent = "-0₫";
        return;
      }

      if (data.valid && data.voucherId) {
        document.getElementById("voucher").dataset.voucherid = data.voucherId;
      }

      // ✅ Voucher hợp lệ
      messageDiv.textContent = "✅ Áp dụng mã giảm giá thành công!";
      messageDiv.classList.remove("text-danger");
      messageDiv.classList.add("text-success");

      // Lấy dữ liệu cần tính
      const orderTotal = parseFloat(orderTotalRaw);
      const shippingFee = parseFloat(
        document.getElementById("shippingFee").dataset.value || "0"
      );

      const discountType = data.DiscountType || data.discountType;
      const discountVal = parseFloat(data.DiscountVal || data.discountVal || 0);

      let discountAmount = 0;
      if (discountType === "Percent") {
        discountAmount = (orderTotal * discountVal) / 100;
      } else {
        discountAmount = discountVal;
      }

      if (isNaN(discountAmount) || discountAmount < 0) discountAmount = 0;

      // Cập nhật hiển thị giảm giá và tổng tiền
      document.getElementById(
        "discount"
      ).textContent = `-${discountAmount.toLocaleString("vi-VN")}₫`;

      const totalPayment = orderTotal - discountAmount + shippingFee;
      document.getElementById(
        "totalPayment"
      ).textContent = `${totalPayment.toLocaleString("vi-VN")}₫`;
    } catch (error) {
      console.error("Lỗi khi áp dụng voucher:", error);
      messageDiv.textContent = "❌ Lỗi khi kiểm tra mã giảm giá.";
      messageDiv.classList.add("text-danger");
    }
  });

// ===================== PHƯƠNG THỨC THANH TOÁN =====================
document.querySelectorAll(".payment-method").forEach((method) => {
  method.addEventListener("click", function () {
    document
      .querySelectorAll(".payment-method")
      .forEach((m) => m.classList.remove("active"));
    this.classList.add("active");
  });
});

// ===================== ĐẶT HÀNG NGAY =====================
document.getElementById("placeOrderBtn").addEventListener("click", async () => {
  try {
    // 🧾 1. Lấy thông tin khách hàng
    const fullName = document.getElementById("fullName").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const address = document.getElementById("address").value.trim();

    if (!fullName || !phone || !address) {
      alert("⚠️ Vui lòng nhập đầy đủ thông tin giao hàng!");
      return;
    }

    const totalOrder = document.getElementById("orderTotal").textContent;
    if( totalOrder === "") {
      alert("⚠️ Vui lòng chọn sản phẩm để cập nhật đơn!");
      return;
    }

    // 🛒 2. Lấy danh sách sản phẩm đã chọn trong giỏ
    const selectedItems = document.querySelectorAll(".select-item:checked");
    if (selectedItems.length === 0) {
      alert("⚠️ Vui lòng chọn ít nhất một sản phẩm để đặt hàng!");
      return;
    }
    
    // Lấy dữ liệu từ giỏ hàng (vì loadCartItems() trả về dữ liệu đầy đủ từ API)
    const cartItems = await loadCartItems();

    // 3️⃣ Tạo danh sách items đúng cấu trúc
    const items = Array.from(selectedItems)
      .map((checkbox) => {
        const basketId = checkbox.dataset.id;
        const found = cartItems.find((c) => c.BasketId == basketId);
        if (!found) return null;
        return {
          productId: found.ProductId,
          sellerId: found.SellerId || null,
          quantity: found.Quantity,
          unitPrice: found.Price,
        };
      })
      .filter((x) => x !== null);

    if (items.length === 0) {
      alert("⚠️ Không tìm thấy thông tin sản phẩm trong giỏ hàng!");
      return;
    }

    console.log("✅ Sản phẩm chọn mua:", items);

    // 💰 4. Tính toán tiền
    const orderTotal = parseFloat(
      document.getElementById("orderTotal").dataset.value || "0"
    );
    const shippingFee = parseFloat(
      document.getElementById("shippingFee").dataset.value || "0"
    );
    const discountText =
      document.getElementById("discount").textContent.replace(/[^\d]/g, "") ||
      "0";
    const discountAmt = parseFloat(discountText) || 0;

    const totalAmount = orderTotal - discountAmt + shippingFee;

    // 🎟️ 5. Lấy voucherId (nếu có)
    const voucherId =
      document.getElementById("voucher").dataset.voucherid || null;

    // 🧠 6. Tạo object hoá đơn đúng chuẩn
    const orderObj = {
      customerId: account.AccountId,
      shipAddress: address,
      shipPhone: phone,
      items,
      shippingFee,
      discountAmt,
      totalAmount,
      voucherId,
    };

    console.log("📦 Dữ liệu gửi API:", orderObj);

    // 🚀 7. Gửi dữ liệu sang backend
    const response = await fetch("http://localhost:3000/user/create-invoice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderObj),
    });

    const result = await response.json();
    console.log("📬 Kết quả trả về:", result);

    if (result.success) {
      alert("🎉 Đặt hàng thành công!");
      // window.location.href = `/user/order-success.html?id=${result.orderId}`;
      window.location.href = `../../../views/user/payment_page.html`;
    } else {
      alert(result.message || "❌ Đặt hàng thất bại. Vui lòng thử lại!");
    }
  } catch (error) {
    console.error("💥 Lỗi khi đặt hàng:", error);
    alert("⚠️ Đã xảy ra lỗi trong quá trình tạo đơn hàng!");
  }
});

// ===================== KHỞI CHẠY =====================
document.addEventListener("DOMContentLoaded", () => {
  populateUserInfo();
  displayCartItems();
});
