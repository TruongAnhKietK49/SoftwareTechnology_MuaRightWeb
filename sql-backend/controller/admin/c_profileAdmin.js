// Gọi API lấy thông tin admin
async function fetchAdminProfile(username) {
  try {
    const res = await fetch(`http://localhost:3000/admin/profile/${username}`);
    const data = await res.json();

    if (!res.ok) {
      console.error("❌ Không tìm thấy thông tin admin:", data.message);
      return null;
    }
    console.log("✅ Thông tin admin:", data);
    return data;
  } catch (err) {
    console.error("Lỗi khi tải thông tin admin:", err);
    return null;
  }
}

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

// ========================== AVATAR PREVIEW ==========================

function initAvatarPreview() {
  const avatarInput = document.getElementById("avatarInput");
  const avatarPreview = document.querySelector("#avatarPreview img");
  const avatarUrlInput = document.getElementById("avatarUrl");

  if (avatarInput && avatarPreview) {
    avatarInput.addEventListener("change", function (event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          avatarPreview.src = e.target.result;
          avatarUrlInput.value = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

// ========================== MODAL SAFEGUARD ==========================

function setupModalSafeguard() {
  const modalEl = document.getElementById("editProfileModal");
  if (!modalEl) return;

  modalEl.addEventListener("hide.bs.modal", () => {
    modalEl
      .querySelectorAll("button, input, select, textarea, [tabindex]")
      .forEach((el) => el.blur());
    document.activeElement?.blur();
  });

  modalEl.addEventListener("click", (e) => {
    if (e.target === modalEl) {
      document.activeElement?.blur();
    }
  });
}

// Toggle password visibility
document
  .getElementById("togglePassword")
  .addEventListener("click", function () {
    const passwordInput = document.getElementById("password");
    const type =
      passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);

    // Toggle eye icon
    this.innerHTML =
      type === "password"
        ? '<i class="bi bi-eye"></i>'
        : '<i class="bi bi-eye-slash"></i>';
  });

// ========================== INIT ==========================

document.addEventListener("DOMContentLoaded", async () => {
  await loadSidebar();

  const account = JSON.parse(localStorage.getItem("account"));
  if (!account || !account.Username) {
    window.location.href = "../../template/pages/signIn_page.html";
    return;
  }

  const adminData = await fetchAdminProfile(account.Username);
  if (adminData) {
    displayAdminProfile(adminData);
    populateEditForm(adminData);
  }

  document
    .querySelector("#editProfileModal .btn-primary")
    ?.addEventListener("click", updateAdminProfile);

  initAvatarPreview();
  setupModalSafeguard();
});
