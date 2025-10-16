async function createUser() {
  try {
    const activeRole = document
      .querySelector(".role-btn.active")
      .getAttribute("data-role");

    const commonData = {
      Username: document.getElementById("username").value,
      Email: document.getElementById("email").value,
      Phone: document.getElementById("phone").value,
      PasswordHash: document.getElementById("password").value,
      Role: activeRole,
      ImageUrl: ''
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
        StoreName: document.getElementById("storeName").value,
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
    if (response.ok) {
      alert(result.message);
      window.location.href = "../../template/pages/signIn_page.html";
    } else {
      alert(result.error || "Đăng ký thất bại!");
    }
  } catch (e) {
    console.log("Lỗi: ", e);
    alert("Thất bại khi tạo tài khoản!");
  }
}
