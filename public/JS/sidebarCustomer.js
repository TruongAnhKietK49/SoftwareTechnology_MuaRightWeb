document.addEventListener("DOMContentLoaded", async () => {
  const sidebar = document.getElementById("sidebar");

  // === 1️⃣ Tải HEADER ===
  try {
    const response = await fetch("../../../template/includes/header.html");
    if (!response.ok) throw new Error("Không thể tải header");

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
      // 🟢 Đổi href của thẻ <a> chứa username sang trang profile
      const usernameLink = usernameEl?.closest("a");
      if (usernameLink) {
        usernameLink.setAttribute("href", "../../views/user/profile_page.html");

        // 🔧 Khi click vào username, cũng kích hoạt chuyển trang
        usernameEl.style.cursor = "pointer";
        usernameEl.addEventListener("click", (e) => {
          e.preventDefault();
          window.location.href = "../../views/user/profile_page.html";
        });
      }
    } else {
      if (usernameEl) usernameEl.innerText = "Khách";
      if (authBtn) {
        authBtn.textContent = "Đăng nhập";
        authBtn.onclick = () => {
          window.location.href = "../../../template/pages/signIn_page.html";
        };
        // 🔴 Vô hiệu hóa link username
        const usernameLink = usernameEl?.closest("a");
        if (usernameLink) {
          usernameLink.setAttribute("href", "#");
          usernameLink.addEventListener("click", (e) => {
            e.preventDefault();
            alert("Vui lòng đăng nhập để xem trang cá nhân.");
          });
        }
      }

      // 🚫 Nếu chưa đăng nhập, vô hiệu hóa click vào username
      usernameEl?.addEventListener("click", (e) => {
        e.preventDefault();
        // Tuỳ bạn: có thể chỉ đơn giản return, hoặc bật alert / chuyển hướng
        alert("Vui lòng đăng nhập để xem thông tin tài khoản.");
      });
    }

    // --- 4️⃣ Gọi hàm setActiveNav() sau khi header đã được tải ---
    setActiveNav();
  } catch (error) {
    console.error("Lỗi khi tải header:", error);
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
  const currentPath = window.location.pathname.split("/").pop();
  const navLinks = document.querySelectorAll("#sidebar .nav-link, #sidebar a");

  navLinks.forEach((link) => {
    const linkPath = link.getAttribute("href")?.split("/").pop();
    if (linkPath === currentPath) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }

    link.addEventListener("click", () => {
      navLinks.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");
    });
  });
}
