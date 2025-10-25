// ========================== SIDEBAR SETUP ==========================

async function loadSidebar() {
  try {
    const res = await fetch("../../../views/admin/navAdminPage.html");
    const html = await res.text();
    document.getElementById("sidebar").innerHTML = html;
    initSidebarBehavior();
  } catch (err) {
    console.error("❌ Lỗi khi tải sidebar:", err);
  }
}

function initSidebarBehavior() {
  const account = JSON.parse(localStorage.getItem("account"));
  if (!account) {
    window.location.href = "../../template/pages/signIn_page.html";
    return;
  }

  // Hiển thị tên & ảnh đại diện
  const nameElement = document.querySelector("#sidebar #username");
  const avatarImg = document.querySelector("#sidebar .user-profile img");
  if (nameElement) nameElement.innerText = account.Username;
  if (avatarImg)
    avatarImg.src = account.ImageUrl || "https://i.pravatar.cc/100?u=admin";

  // Logout
  const logoutBtn = document.querySelector("#sidebar .btn-signout");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  // Active link hiện tại
  const currentPage = window.location.pathname.split("/").pop();
  document.querySelectorAll("#sidebar .nav-link").forEach((link) => {
    const linkPage = link.getAttribute("href");
    if (linkPage === currentPage) {
      link.classList.add("active", "bg-primary", "text-white", "fw-bold");
    } else {
      link.classList.remove("active", "bg-primary", "text-white", "fw-bold");
    }
  });
}

function logout() {
  if (confirm("Bạn có chắc muốn đăng xuất không?")) {
    localStorage.removeItem("account");
    window.location.href = "../../template/pages/signIn_page.html";
  }
}

// ✅ Gắn sự kiện toggle ngay khi DOM sẵn sàng
document.addEventListener("DOMContentLoaded", () => {
  // Load sidebar
  loadSidebar();

  // Gắn toggle sidebar (ngoài sidebar)
  const toggleBtn = document.getElementById("sidebarToggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      document.getElementById("sidebar").classList.toggle("show");
    });
  }

  
  document.addEventListener("click", function (event) {
    const sidebar = document.getElementById("sidebar");
    const toggleBtn = document.getElementById("sidebarToggle");
    if (
      window.innerWidth <= 992 &&
      sidebar &&
      toggleBtn &&
      !sidebar.contains(event.target) &&
      !toggleBtn.contains(event.target)
    ) {
      sidebar.classList.remove("show");
    }
  });
});
