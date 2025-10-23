document.addEventListener("DOMContentLoaded", async () => {
  const sidebar = document.getElementById("sidebar");

  // === 1️⃣ Tải HEADER ===
  try {
    const response = await fetch("../../../template/includes/header.html");
    if (!response.ok) throw new Error("Không thể tải sidebar");

    const data = await response.text();
    sidebar.innerHTML = data;

    // --- Xử lý hiển thị tài khoản & nút đăng nhập/đăng xuất ---
    const account = JSON.parse(localStorage.getItem("account"));
    const usernameEl = document.getElementById("username");
    const authBtn = document.getElementById("auth-btn");

    if (account) {
      if (usernameEl) usernameEl.innerText = account.Username;
      if (authBtn) {
        authBtn.textContent = "Đăng xuất";
        authBtn.onclick = logout;
      }
    } else {
      if (usernameEl) usernameEl.innerText = "Khách";
      if (authBtn) {
        authBtn.textContent = "Đăng nhập";
        authBtn.onclick = () => {
          window.location.href = "../../../template/pages/signIn_page.html";
        };
      }
    }

    // --- 4️⃣ Gọi hàm setActiveNav() sau khi header đã được tải ---
    setActiveNav();
  } catch (error) {
    console.error("Lỗi khi tải sidebar:", error);
  }

  // === 2️⃣ Tải FOOTER ===
  const box = document.getElementById("footer-container");
  if (box) {
    const paths = ["../../template/includes/footer.html"];

    for (const p of paths) {
      try {
        const res = await fetch(p, { cache: "no-cache" });
        if (res.ok) {
          const html = await res.text();
          box.innerHTML = html;
          const yearEl = box.querySelector("#mr-year");
          if (yearEl) yearEl.textContent = new Date().getFullYear();
          break;
        }
      } catch (e) {}
    }
  }
});

// === 3️⃣ Hàm logout ===
function logout() {
  if (confirm("Bạn có chắc muốn đăng xuất không?")) {
    localStorage.removeItem("account");
    window.location.reload();
  }
}

// === 4️⃣ Hàm đặt “active” cho tab hiện tại ===
function setActiveNav() {
  const currentPath = window.location.pathname.split("/").pop(); // Lấy tên file hiện tại
  const navLinks = document.querySelectorAll("#sidebar .nav-link, #sidebar a");

  navLinks.forEach((link) => {
    const linkPath = link.getAttribute("href")?.split("/").pop();
    if (linkPath === currentPath) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }

    // Cho phép bấm để đổi active ngay (tránh load lại nếu dùng SPA)
    link.addEventListener("click", () => {
      navLinks.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");
    });
  });
}
