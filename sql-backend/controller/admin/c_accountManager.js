let allAccountsCache = [];
let currentPage = 1;
const itemsPerPage = 5;

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
    visibleAccounts.forEach((account, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="text-center" data-label="Chọn">
          <input class="form-check-input item" type="checkbox">
        </td>
        <td data-label="Ảnh">
          <img src="${account.ImageUrl}" class="user-avatar" alt="User Avatar">
        </td>
        <td data-label="Thông tin">
          <div class="user-name-email">
            <div class="user-name">${account.Username}</div>
            <div class="user-email">${account.Email}</div>
          </div>
        </td>
        <td data-label="Vai trò">
          <span class="badge ${
            account.Role == "Customer"
              ? "bg-primary"
              : account.Role == "Seller"
              ? "bg-secondary"
              : "bg-info"
          }">${account.Role}</span>
        </td>
        <td data-label="Trạng thái"><span class="badge ${
          account.State === "Active" ? "bg-success" : "bg-warning"
        }">${account.State}</span></td>
        <td data-label="Số điện thoại"><span class="badge bg-warning">${
          account.Phone || "-"
        } </span></td>
        <td class="text-center" data-label="Hành động">
          <div class="btn-group btn-group-custom" role="group">
            <button class="btn btn-outline-primary btn-sm" title="Sửa"
                data-bs-toggle="modal" data-bs-target="#editUserModal">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-outline-danger btn-sm" title="Xóa">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      `;
      tableAccount.appendChild(row);
    });

    // --- Checkbox tổng ---
    const checkAllId =
      filterRole === "Customer"
        ? "checkAllCustomers"
        : filterRole === "Seller"
        ? "checkAllSellers"
        : filterRole === "Shipper"
        ? "checkAllShippers"
        : "checkAll";

    const checkAll = document.getElementById(checkAllId);
    const checkboxes = tableAccount.querySelectorAll(".item");

    if (checkAll) {
      checkAll.addEventListener("change", function () {
        checkboxes.forEach((cb) => (cb.checked = this.checked));
      });

      checkboxes.forEach((cb) => {
        cb.addEventListener("change", function () {
          if (!this.checked) checkAll.checked = false;
          else if (Array.from(checkboxes).every((c) => c.checked))
            checkAll.checked = true;
        });
      });
    }

    // --- Nút Xóa ---
    const deleteButtons = tableAccount.querySelectorAll(".btn-outline-danger");
    deleteButtons.forEach((btn, i) => {
      btn.addEventListener("click", async () => {
        const username = filteredAccounts[i].Username;
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
        const account = filteredAccounts[i];
        document.getElementById("editEmail").value = account.Email || "";
        document.getElementById("editPhone").value = account.Phone || "";
        document.getElementById("editState").value = account.State || "";
        document.getElementById("saveEditBtn").dataset.username =
          account.Username;
      });
    });

    // --- Cập nhật thông tin phân trang ---
    const info = document.getElementById("paginationInfo");
    if (info) {
      info.innerHTML = `
    Hiển thị <strong>${endIndex}</strong> trong tổng số <strong>${totalItems}</strong> người dùng
  `;
    }

    // --- Render nút phân trang ---
    renderPagination(totalPages, filterRole);
  } catch (err) {
    console.error("❌ Lỗi tải tài khoản:", err);
  }
}

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

    const text = tab.textContent.trim();
    let role = "All";
    if (text.includes("Khách")) role = "Customer";
    else if (text.includes("Người bán")) role = "Seller";
    else if (text.includes("Shipper")) role = "Shipper";

    testGetAccount(role);
  });
});

// --- Handle bulk actions (Tạm khóa / Kích hoạt / Xóa) ---
document.querySelectorAll(".action-buttons .btn").forEach((button) => {
  button.addEventListener("click", async function () {
    const checkedRows = document.querySelectorAll(
      'tbody input[type="checkbox"]:checked'
    );
    const selectedCount = checkedRows.length;

    if (selectedCount === 0) {
      alert("Vui lòng chọn ít nhất một người dùng để thực hiện thao tác này.");
      return;
    }

    const action = this.textContent.trim();

    // Xác định loại hành động
    const isLockAction = action.includes("Tạm khóa");
    const isDeleteAction = action.includes("Xóa");
    const isActivateAction = action.includes("Kích hoạt");

    if (
      !confirm(
        `Bạn có chắc chắn muốn ${action.toLowerCase()} ${selectedCount} người dùng đã chọn?`
      )
    )
      return;

    for (const checkbox of checkedRows) {
      const row = checkbox.closest("tr");
      const username = row.querySelector(".user-name")?.textContent.trim();
      if (!username) continue;

      try {
        // 🗑️ Nếu là hành động XÓA
        if (isDeleteAction) {
          const res = await fetch(
            `http://localhost:3000/admin/accounts/${username}`,
            { method: "DELETE" }
          );
          const data = await res.json();
          if (data.success) console.log(`🗑️ Đã xóa: ${username}`);
          else console.warn(`⚠️ Không thể xóa ${username}: ${data.message}`);
        }

        // 🔒 Nếu là hành động TẠM KHÓA hoặc KÍCH HOẠT
        else {
          const newState = isLockAction
            ? "Inactive"
            : isActivateAction
            ? "Active"
            : null;
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
          if (data.success) console.log(`🔄 ${username} → ${newState}`);
          else
            console.warn(`⚠️ Không thể cập nhật ${username}: ${data.message}`);
        }
      } catch (err) {
        console.error(`❌ Lỗi khi xử lý ${username}:`, err);
      }
    }

    // ✅ Lấy tab hiện tại để reload đúng danh sách
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

    alert(
      `✅ Đã ${action.toLowerCase()} ${selectedCount} người dùng thành công!`
    );

    // 🔁 Reload đúng tab hiện tại
    testGetAccount(currentRole);
  });
});

// --- Xử lý thêm người dùng mới ---
document.getElementById("btnAddUser").addEventListener("click", async () => {
  const username = document.getElementById("username").value.trim();
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
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="text-center"><input class="form-check-input item" type="checkbox"></td>
      <td><img src="${
        account.ImageUrl
      }" class="user-avatar" alt="User Avatar"></td>
      <td>
        <div class="user-name">${account.Username}</div>
        <div class="user-email">${account.Email}</div>
      </td>
      <td><span class="badge ${
        account.Role == "Customer"
          ? "bg-primary"
          : account.Role == "Seller"
          ? "bg-secondary"
          : "bg-info"
      }">${account.Role}</span></td>
      <td><span class="badge ${
        account.State === "Active" ? "bg-success" : "bg-warning"
      }">${account.State}</span></td>
      <td data-label="phone"><span class="badge bg-warning">${
        account.Phone || "-"
      } </span></td>
      <td class="text-center">
        <div class="btn-group btn-group-custom" role="group">
          <button class="btn btn-outline-primary btn-sm" title="Sửa"
              data-bs-toggle="modal" data-bs-target="#editUserModal">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-outline-danger btn-sm" title="Xóa">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
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
    }
  });
  pagination.appendChild(nextItem);
}

// --- Khi load trang ---
document.addEventListener("DOMContentLoaded", () => testGetAccount("All"));
