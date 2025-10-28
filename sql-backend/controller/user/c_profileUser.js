// Lấy thông tin tài khoản từ localStorage
const account =
  JSON.parse(localStorage.getItem("account")) || { AccountId: null };
async function fetchAdminProfile() {
  try {
    const res = await fetch(`http://localhost:3000/user/profile/${account.AccountId}`);
    const data = await res.json();

    if (!res.ok) {
      console.error("❌ Không tìm thấy thông tin user:", data.message);
      return null;
    }
    console.log("✅ Thông tin user:", data);
    return data;
  } catch (err) {
    console.error("Lỗi khi tải thông tin user:", err);
    return null;
  }
}

fetchAdminProfile();

// Hiển thị thông tin admin
function displayAdminProfile(data) {
  if (!data) return;

  const defaultAvatar = "https://i.pravatar.cc/150?u=admin";
  const avatar = document.getElementById("admin-avatar");
  const nameElement = document.getElementById("admin-name");

  if (avatar) avatar.src = data.ImageUrl || defaultAvatar;
  if (nameElement) nameElement.innerText = data.FullName;

  document.getElementById("admin-imgUrl").innerText =
    data.ImageUrl || defaultAvatar;
  document.getElementById("admin-username").innerText = data.Username || "";
  document.getElementById("admin-email").innerText = data.Email || "";
  document.getElementById("admin-phone").innerText = data.Phone || "";
  document.getElementById("admin-fullName").innerText = data.FullName || "";
  document.getElementById("admin-birthday").innerText = data.Birthday
    ? new Date(data.Birthday).toISOString().split("T")[0]
    : "";
  document.getElementById("admin-gender").innerText = data.Gender || "";
  document.getElementById("admin-position").innerText = data.Position || "";
  document.getElementById("admin-note").innerText = data.Note || "";
}


// Điền thông tin vào form chỉnh sửa
function populateEditForm(data) {
  if (!data) return;
  const defaultAvatar = "https://i.pravatar.cc/150?u=admin";

  document.getElementById("avatarUrl").value = data.ImageUrl || defaultAvatar;
  document.getElementById("avatarPreview").querySelector("img").src =
    data.ImageUrl || defaultAvatar;
  document.getElementById("userName").value = data.Username || "";
  document.getElementById("email").value = data.Email || "";
  document.getElementById("phone").value = data.Phone || "";
  document.getElementById("password").value = data.PasswordHash || "";
  document.getElementById("fullName").value = data.FullName || "";
  document.getElementById("birthDate").value = data.Birthday
    ? data.Birthday.split("T")[0]
    : "";
  document.getElementById("gender").value = data.Gender || "Khác";
  document.getElementById("position").value = data.Position || "";
  document.getElementById("adminNote").value = data.Note || "";
}


// Cập nhật hồ sơ admin
async function updateAdminProfile() {
  const username = document.getElementById("userName").value.trim();
  const updatedData = {
    Email: document.getElementById("email").value.trim(),
    Phone: document.getElementById("phone").value.trim(),
    ImageUrl: document.getElementById("avatarUrl").value.trim(),
    PasswordHash: document.getElementById("password").value.trim(),
    FullName: document.getElementById("fullName").value.trim(),
    Birthday: document.getElementById("birthDate").value,
    Gender: document.getElementById("gender").value,
    Position: document.getElementById("position").value.trim(),
    Note: document.getElementById("adminNote").value.trim(),
  };

  try {
    const res = await fetch(`http://localhost:3000/admin/profile/${username}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData),
    });

    const data = await res.json();

    if (res.ok) {
      alert("✅ Thông tin đã được cập nhật thành công!");

      // Lấy lại thông tin admin mới nhất từ phản hồi server
      const newAdminData = data.updatedAccount || updatedData;

      // Ẩn modal
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("editProfileModal")
      );
      if (modal) modal.hide();

      // Cập nhật lại giao diện
      displayAdminProfile(newAdminData);

      // 🧩 Cập nhật sidebar avatar
      const sidebarAvatar = document.querySelector(
        "#sidebar .user-profile img"
      );
      if (sidebarAvatar) sidebarAvatar.src = newAdminData.ImageUrl;

      // 🧩 Cập nhật lại localStorage (dữ liệu mới nhất)
      const currentAccount = JSON.parse(localStorage.getItem("account")) || {};
      const updatedAccount = { ...currentAccount, ...newAdminData };
      localStorage.setItem("account", JSON.stringify(updatedAccount));
    } else {
      alert(`❌ Lỗi khi cập nhật: ${data.message || data.error}`);
    }
  } catch (err) {
    console.error("Lỗi khi gửi dữ liệu cập nhật:", err);
    alert("❌ Không thể kết nối đến server.");
  }
}