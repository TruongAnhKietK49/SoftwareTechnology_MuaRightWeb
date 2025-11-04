let allAccountsCache = [];
let currentPage = 1;
const itemsPerPage = 8;

// --- Lấy dữ liệu account từ API
async function getAccount() {
  const res = await fetch("http://localhost:3000/admin/accounts");
  const data = await res.json();
  return data;
}

// --- Render dữ liệu accounts ---
async function testGetAccount(filterRole = "All") {
  try {
    const accounts = await getAccount();
    allAccountsCache = accounts;
    console.log(accounts);

    // Xác định tbody theo role
    const tableMap = {
      All: "userAccount",
      Customer: "customerAccount",
      Seller: "sellerAccount",
      Shipper: "shipperAccount",
    };

    const targetTableId = tableMap[filterRole];
    const tableAccount = document.getElementById(targetTableId);
    tableAccount.innerHTML = "";

    // Ẩn nội dung của các tab khác
    Object.values(tableMap).forEach((id) => {
      if (id !== targetTableId) {
        const el = document.getElementById(id);
        if (el) el.innerHTML = "";
      }
    });

    // 🔍 Lọc dữ liệu
    const filteredAccounts =
      filterRole === "All"
        ? accounts
        : accounts.filter(
            (acc) => acc.Role?.toLowerCase() === filterRole.toLowerCase()
          );

    // Nếu không có dữ liệu
    if (filteredAccounts.length === 0) {
      tableAccount.innerHTML = `
        <tr><td colspan="7" class="text-center text-muted">Không có người dùng nào.</td></tr>
      `;
      return;
    }

    // 🧮 Phân trang
    const totalItems = filteredAccounts.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (currentPage > totalPages) currentPage = totalPages || 1;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const visibleAccounts = filteredAccounts.slice(startIndex, endIndex);

    // --- Render danh sách ---
    visibleAccounts.forEach((account) => {
      const roleClass =
        account.Role === "Customer"
          ? "role-customer"
          : account.Role === "Seller"
          ? "role-seller"
          : account.Role === "Shipper"
          ? "role-shipper"
          : "";

      const statusClass =
        account.State === "Active" ? "status-active" : "status-inactive";
      const row = document.createElement("div");
      row.innerHTML = `
        <div class="user-card">
          <div class="card-checkbox">
            <input class="form-check-input item" type="checkbox" value="${account.AccountId}">
          </div>
          <div class="user-card-header">
            <img src="${account.ImageUrl}" alt="${account.Username}" class="user-avatar">
            <div class="user-info">
              <div class="user-username">@${account.Username}</div>
            </div>
          </div>
          <div class="user-details">
            <div class="user-detail-item">
              <i class="bi bi-envelope"></i>
              <span>${account.Email}</span>
            </div>
            <div class="user-detail-item">
              <i class="bi bi-telephone"></i>
              <span>${account.Phone}</span>
            </div>
          </div>
          <div class="d-flex justify-content-between align-items-center">
            <span class="user-role ${roleClass}">${account.Role}</span>
            <span class="user-status ${statusClass}">
              <i class="bi bi-circle-fill me-1"></i>${account.State}
            </span>
          </div>
          <div class="user-actions">
            <button class="btn btn-sm btn-outline-primary edit-user"
                data-id="${account.AccountId}"
                data-bs-toggle="modal"
                data-bs-target="#editUserModal">
              <i class="bi bi-pencil me-1"></i>Sửa
            </button>

            <button class="btn btn-sm btn-outline-danger delete-user" data-id="${account.AccountId}">
              <i class="bi bi-trash me-1"></i>Xóa
            </button>
          </div>
        </div>
      `;
      tableAccount.appendChild(row);
    });

    // --- Gọi lại setup checkbox tổng ---
    setupCheckAll(filterRole);

    // --- Nút Xóa ---
    const deleteButtons = tableAccount.querySelectorAll(".btn-outline-danger");
    deleteButtons.forEach((btn, i) => {
      btn.addEventListener("click", async () => {
        const username = visibleAccounts[i].Username;
        if (!confirm(`Bạn có chắc muốn xóa tài khoản "${username}" không?`))
          return;

        try {
          const response = await fetch(
            `http://localhost:3000/admin/accounts/${username}`,
            { method: "DELETE" }
          );
          const result = await response.json();
          alert(result.message);
          if (result.success) testGetAccount(filterRole);
        } catch (err) {
          console.error("Lỗi khi xóa tài khoản:", err);
          alert("Đã xảy ra lỗi khi xóa tài khoản!");
        }
      });
    });

    // --- Nút Sửa ---
    const editButtons = tableAccount.querySelectorAll(".btn-outline-primary");
    editButtons.forEach((btn, i) => {
      btn.addEventListener("click", () => {
        const account = visibleAccounts[i];
        document.getElementById("editEmail").value = account.Email || "";
        document.getElementById("editPhone").value = account.Phone || "";
        document.getElementById("editState").value = account.State || "";
        document.getElementById("saveEditBtn").dataset.username =
          account.Username;
      });
    });

    // --- Cập nhật phân trang ---
    const info = document.getElementById("paginationInfo");
    if (info) {
      info.innerHTML = `
        Hiển thị <strong>${endIndex}</strong> trong tổng số <strong>${totalItems}</strong> người dùng
      `;
    }

    renderPagination(totalPages, filterRole);
  } catch (err) {
    console.error("❌ Lỗi tải tài khoản:", err);
  }
}

// --- Checkbox tổng (Select All) ---
function setupCheckAll() {
  const checkAll = document.getElementById("selectAll");
  if (!checkAll) return;

  // Lấy tất cả checkbox con trong phần danh sách user
  const checkboxes = document.querySelectorAll(
    '.user-cards-container input[type="checkbox"].item'
  );

  // Khi click checkbox tổng
  checkAll.addEventListener("change", function () {
    const isChecked = this.checked;
    checkboxes.forEach((cb) => (cb.checked = isChecked));
  });

  // Khi click từng checkbox con → cập nhật lại checkbox tổng
  checkboxes.forEach((cb) => {
    cb.addEventListener("change", function () {
      const allChecked = Array.from(checkboxes).every((c) => c.checked);
      checkAll.checked = allChecked;
    });
  });
}

// --- Hành động hàng loạt ---
document.querySelectorAll(".action-buttons .btn").forEach((button) => {
  button.addEventListener("click", async function () {
    const checkedBoxes = document.querySelectorAll(
      '.user-card input[type="checkbox"].item:checked'
    );

    if (checkedBoxes.length === 0) {
      alert("Vui lòng chọn ít nhất một người dùng!");
      return;
    }

    const action = this.textContent.trim();
    const isDelete = action.includes("Xóa");
    const isLock = action.includes("Tạm khóa");
    const isActivate = action.includes("Kích hoạt");

    if (
      !confirm(
        `Bạn có chắc chắn muốn ${action.toLowerCase()} ${
          checkedBoxes.length
        } người dùng này không?`
      )
    )
      return;

    for (const checkbox of checkedBoxes) {
      const userCard = checkbox.closest(".user-card");
      const username = userCard
        ?.querySelector(".user-username")
        ?.textContent.replace("@", "")
        .trim();

      if (!username) continue;

      try {
        if (isDelete) {
          const res = await fetch(
            `http://localhost:3000/admin/accounts/${username}`,
            { method: "DELETE" }
          );
          const data = await res.json();
          if (!data.success) console.warn(`Không xóa được ${username}`);
        } else {
          const newState = isLock ? "Inactive" : isActivate ? "Active" : null;
          if (!newState) continue;

          const res = await fetch(
            `http://localhost:3000/admin/accounts/${username}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ State: newState }),
            }
          );
          const data = await res.json();
          if (!data.success) console.warn(`Không cập nhật được ${username}`);
        }
      } catch (err) {
        console.error(`Lỗi khi xử lý ${username}:`, err);
      }
    }

    alert(
      `✅ Đã ${action.toLowerCase()} ${
        checkedBoxes.length
      } người dùng thành công!`
    );

    // Bỏ chọn checkbox tổng sau khi xử lý xong
    const selectAll = document.getElementById("selectAll");
    if (selectAll) selectAll.checked = false;

    // Reload lại danh sách
    const activeTab = document
      .querySelector("#userTabs .nav-link.active")
      .textContent.trim();
    const currentRole = activeTab.includes("Khách")
      ? "Customer"
      : activeTab.includes("Người bán")
      ? "Seller"
      : activeTab.includes("Shipper")
      ? "Shipper"
      : "All";

    testGetAccount(currentRole);
  });
});

// --- Nút chỉnh sửa ---
document.getElementById("saveEditBtn").addEventListener("click", async () => {
  const username = document.getElementById("saveEditBtn").dataset.username;
  const email = document.getElementById("editEmail").value;
  const phone = document.getElementById("editPhone").value;
  const password = document.getElementById("editPassword").value;
  const state = document.getElementById("editState").value;

  if (!username) {
    alert("Không xác định được tài khoản cần sửa!");
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:3000/admin/accounts/${username}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Email: email,
          Phone: phone,
          PasswordHash: password,
          State: state,
        }),
      }
    );

    const result = await response.json();
    alert(result.message);

    if (result.success) {
      document.activeElement.blur();
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("editUserModal")
      );
      modal.hide();

      const activeTab = document
        .querySelector("#userTabs .nav-link.active")
        .textContent.trim();
      const currentRole = activeTab.includes("Khách")
        ? "Customer"
        : activeTab.includes("Người bán")
        ? "Seller"
        : activeTab.includes("Shipper")
        ? "Shipper"
        : "All";

      testGetAccount(currentRole);
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật tài khoản:", error);
    alert("Đã xảy ra lỗi khi cập nhật tài khoản!");
  }
});

// --- Chuyển tab ---
document.querySelectorAll("#userTabs .nav-link").forEach((tab) => {
  tab.addEventListener("click", (e) => {
    e.preventDefault();
    currentPage = 1;
    document
      .querySelectorAll("#userTabs .nav-link")
      .forEach((link) => link.classList.remove("active"));
    tab.classList.add("active");

    const role = tab.dataset.role;

    testGetAccount(role);
  });
});

// --- Xử lý thêm người dùng mới ---
document.getElementById("btnAddUser").addEventListener("click", async () => {
  const username = document.getElementById("userName").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const password = document.getElementById("password").value.trim();
  const role = document.getElementById("role").value.trim();

  if (!username || !email || !password || !role) {
    alert("Vui lòng điền đầy đủ các trường bắt buộc!");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/admin/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Username: username,
        Email: email,
        Phone: phone,
        PasswordHash: password,
        Role: role,
      }),
    });

    const data = await response.json();

    if (data.success) {
      alert("✅ Thêm người dùng thành công!");
      document.getElementById("addUserForm").reset();

      // Đóng modal
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("addUserModal")
      );
      modal.hide();

      // Reload danh sách user (gọi lại hàm load dữ liệu)
      if (typeof testGetAccount === "function") {
        testGetAccount();
      } else {
        location.reload();
      }
    } else {
      alert(`⚠️ ${data.message}`);
    }
  } catch (err) {
    console.error("❌ Lỗi khi thêm người dùng:", err);
    alert("Lỗi khi thêm người dùng!");
  }
});

// --- Xử lý tìm kiếm người dùng ---
document.getElementById("searchBtn").addEventListener("click", handleSearch);
document.getElementById("searchInput").addEventListener("input", handleSearch);
async function handleSearch() {
  currentPage = 1;

  const keyword = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();

  // Nếu chưa load dữ liệu thì tải lại
  if (allAccountsCache.length === 0) {
    allAccountsCache = await getAccount();
  }

  // Nếu không nhập gì -> hiện lại toàn bộ
  if (keyword === "") {
    testGetAccount("All");
    return;
  }

  // Lọc danh sách theo Username hoặc Email
  const filtered = allAccountsCache.filter(
    (acc) =>
      acc.Username.toLowerCase().includes(keyword) ||
      acc.Email.toLowerCase().includes(keyword) ||
      acc.Role.toLowerCase().includes(keyword) ||
      acc.State.toLowerCase().includes(keyword) ||
      acc.Phone.toLowerCase().includes(keyword)
  );

  // Gọi lại testGetAccount nhưng truyền dữ liệu tùy chỉnh
  renderFilteredAccounts(filtered);
}

// --- Hàm render riêng cho dữ liệu đã lọc ---
function renderFilteredAccounts(accounts) {
  const tableAccount = document.getElementById("userAccount");
  tableAccount.innerHTML = "";

  if (accounts.length === 0) {
    tableAccount.innerHTML = `
      <tr><td colspan="7" class="text-center text-muted">Không tìm thấy người dùng nào.</td></tr>
    `;
    return;
  }

  accounts.forEach((account) => {
    const roleClass =
      account.Role === "Customer"
        ? "role-customer"
        : account.Role === "Seller"
        ? "role-seller"
        : account.Role === "Shipper"
        ? "role-shipper"
        : "";

    const statusClass =
      account.State === "Active" ? "status-active" : "status-inactive";
    const row = document.createElement("tr");
    row.innerHTML = `
      <div class="user-card">
          <div class="card-checkbox">
            <input class="form-check-input item" type="checkbox" value="${account.AccountId}">
          </div>
          <div class="user-card-header">
            <img src="${account.ImageUrl}" alt="${account.Username}" class="user-avatar">
            <div class="user-info">
              <div class="user-username">@${account.Username}</div>
            </div>
          </div>
          <div class="user-details">
            <div class="user-detail-item">
              <i class="bi bi-envelope"></i>
              <span>${account.Email}</span>
            </div>
            <div class="user-detail-item">
              <i class="bi bi-telephone"></i>
              <span>${account.Phone}</span>
            </div>
          </div>
          <div class="d-flex justify-content-between align-items-center">
            <span class="user-role ${roleClass}">${account.Role}</span>
            <span class="user-status ${statusClass}">
              <i class="bi bi-circle-fill me-1"></i>${account.State}
            </span>
          </div>
          <div class="user-actions">
            <button class="btn btn-sm btn-outline-primary edit-user"
                data-id="${account.AccountId}"
                data-bs-toggle="modal"
                data-bs-target="#editUserModal">
              <i class="bi bi-pencil me-1"></i>Sửa
            </button>

            <button class="btn btn-sm btn-outline-danger delete-user" data-id="${account.AccountId}">
              <i class="bi bi-trash me-1"></i>Xóa
            </button>
          </div>
        </div>
    `;
    tableAccount.appendChild(row);
  });
}

// --- Hàm xử lý render trang ---
function renderPagination(totalPages, currentRole) {
  const pagination = document.getElementById("pagination");
  if (!pagination) return;

  pagination.innerHTML = "";

  // Nút "Trước"
  const prevItem = document.createElement("li");
  prevItem.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
  prevItem.innerHTML = `<a class="page-link" href="#">Trước</a>`;
  prevItem.addEventListener("click", (e) => {
    e.preventDefault();
    if (currentPage > 1) {
      currentPage--;
      testGetAccount(currentRole);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
  pagination.appendChild(prevItem);

  // Nút số trang
  for (let i = 1; i <= totalPages; i++) {
    const li = document.createElement("li");
    li.className = `page-item ${i === currentPage ? "active" : ""}`;
    li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
    li.addEventListener("click", (e) => {
      e.preventDefault();
      currentPage = i;
      testGetAccount(currentRole);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    pagination.appendChild(li);
  }

  // Nút "Sau"
  const nextItem = document.createElement("li");
  nextItem.className = `page-item ${
    currentPage === totalPages ? "disabled" : ""
  }`;
  nextItem.innerHTML = `<a class="page-link" href="#">Sau</a>`;
  nextItem.addEventListener("click", (e) => {
    e.preventDefault();
    if (currentPage < totalPages) {
      currentPage++;
      testGetAccount(currentRole);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
  pagination.appendChild(nextItem);
}

// --- Khi load trang ---
document.addEventListener("DOMContentLoaded", () => testGetAccount("All"));
