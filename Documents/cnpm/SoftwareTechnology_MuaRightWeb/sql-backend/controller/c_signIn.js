async function SignIn() {
  try {
    const emailInput = document.getElementById("email");
    const passInput = document.getElementById("password");
    console.log("Email element:", emailInput);
    console.log("Password element:", passInput);

    const objData = {
      Email: emailInput.value,
      PasswordHash: passInput.value,
    };
    console.log("Gửi lên server:", objData);

    const response = await fetch("http://localhost:3000/api/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(objData),
    });

    const result = await response.json();
    if (response.ok && result.success) {
      // ✅ Lưu thông tin tài khoản vào localStorage
      localStorage.setItem("account", JSON.stringify(result.account));
      // ✅ Chuyển trang theo Role
      const role = result.account.Role;
      console.log(role);
      alert(result.message);
      
      switch (role) {
        case "Customer":
          window.location.href = "../../index.html";
          break;
        case "Seller":
          window.location.href = "../../views/seller/homeSeller_page.html";
          break;
        case "Shipper":
          window.location.href = "../../views/shipper/homeShipper_page.html";
          break;
        case "Admin":
          window.location.href = "../../views/admin/admin_dashboard.html";
          break;
        default:
          alert("Không xác định được vai trò người dùng!");
      }
    } else {
      alert(result.message || "Đăng nhập thất bại!");
    }
  } catch (e) {
    console.error("❌ Lỗi fetch:", e);
    alert("Đăng nhập thất bại!");
    console.log("Chi tiết lỗi:", e.name, e.message);
  }
}
