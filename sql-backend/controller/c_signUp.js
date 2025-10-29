async function createUser() {
   try {
    const activeRole = document
      .querySelector(".role-btn.active")
      .getAttribute("data-role");

    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const password = document.getElementById("password").value;
    const imageUrl = document.getElementById("image").value.trim();
    const storeName = document.getElementById("storeName").value.trim();

    // 1. Kiểm tra các trường có bị trống không
    if (!username || !email || !phone || !password) {
      alert("Vui lòng điền đầy đủ các thông tin bắt buộc: Tên đăng nhập, Email, Số điện thoại, Mật khẩu.");
      return;
    }

    // 2. Kiểm tra định dạng Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Định dạng email không hợp lệ.");
      return;
    }

    // 3. Kiểm tra định dạng Số điện thoại (chỉ chứa số, 10-11 ký tự)
    const phoneRegex = /^\d{10,11}$/;
    if (!phoneRegex.test(phone)) {
      alert("Số điện thoại chỉ được chứa ký tự số và phải có 10 hoặc 11 chữ số.");
      return;
    }

    // 4. Kiểm tra độ dài mật khẩu
    if (password.length < 8) {
      alert("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }

    if (activeRole === "Seller" && !storeName) {
      alert("Vui lòng nhập tên cửa hàng của bạn.");
      return;
    }


    const commonData = {
      Username: username,
      Email: email,
      Phone: phone,
      PasswordHash: password,
      Role: activeRole,
      ImageUrl: imageUrl,
    };

    let profileData = {};
    console.log(activeRole);

    if (activeRole == "Customer") {
      profileData = {
        FullName: document.getElementById("customerFullName").value,
        Address: document.getElementById("customerAddress").value,
        Birthday: document.getElementById("customerBirthday").value,
        Gender: document.getElementById("customerGender").value,
      };
    } else if (activeRole == "Seller") {
      profileData = {
        FullName: document.getElementById("sellerFullName").value,
        Address: document.getElementById("sellerAddress").value,
        Birthday: document.getElementById("sellerBirthday").value,
        Gender: document.getElementById("sellerGender").value,
        StoreName: storeName, 
        StoreAddress: document.getElementById("storeAddress").value,
      };
    } else if (activeRole == "Shipper") {
      profileData = {
        FullName: document.getElementById("shipperFullName").value,
        Address: document.getElementById("shipperAddress").value,
        Birthday: document.getElementById("shipperBirthday").value,
        Gender: document.getElementById("shipperGender").value,
        VehicleInfo: document.getElementById("vehicleInfo").value,
        LicenseNo: document.getElementById("licenseNo").value,
        Region: document.getElementById("region").value,
      };
    }
    const formData = { commonData, profileData };
    console.log(formData);
    const response = await fetch("http://localhost:3000/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const result = await response.json();
    if (response.status === 201) {
      alert(result.message);
      window.location.href = "../../template/pages/signIn_page.html";
    } else {
      alert(result.message || "Đăng ký thất bại!");
    }
  } catch (e) {
    console.log("Lỗi: ", e);
    alert("Thất bại khi tạo tài khoản!");
  }
}