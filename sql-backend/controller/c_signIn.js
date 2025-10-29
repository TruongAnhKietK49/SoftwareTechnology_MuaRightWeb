async function SignIn() {
  try {
    const emailInput = document.getElementById("email");
    const passInput = document.getElementById("password");

    const email = emailInput.value.trim();
    const password = passInput.value;

    if (!email && !password) {
        alert("Vui lòng nhập email và mật khẩu.");
        return;
    }
    if (!email) {
        alert("Vui lòng nhập email.");
        return;
    }
    if (!password) {
        alert("Vui lòng nhập mật khẩu.");
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert("Định dạng email không hợp lệ.");
        return;
    }

    const objData = {
      Email: email,
      PasswordHash: password,
    };


    const urlParams = new URLSearchParams(window.location.search);
    const redirectValue = urlParams.get('redirect'); 

    let apiUrl = "http://localhost:3000/api/signin";
    if (redirectValue) {
      apiUrl += `?redirect=${redirectValue}`;
    }
    
    console.log("Gửi yêu cầu tới API URL:", apiUrl); 


    const response = await fetch(apiUrl, { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(objData),
    });


    const result = await response.json();
    if (response.ok && result.success) {
      localStorage.setItem("account", JSON.stringify(result.account));
      const role = result.account.Role;

      alert(result.message);

      if (result.redirect) {
        window.location.href = result.redirect;
      } else {
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