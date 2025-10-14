async function getAccount() {
  const res = await fetch("http://localhost:3000/admin/accounts");
  const data = await res.json();
  return data;
}

// Hàm test get account
async function testGetAccount() {
  try {
    const res = await getAccount();
    console.log(res);
    const tableAccount = document.getElementById("userAccount");
    tableAccount.innerHTML = "";
    res.forEach((account, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td class="text-center" data-label="choice">
                    <input class="form-check-input item" type="checkbox">
                </td>
                <td data-label="image">
                    <img src="${account.ImageUrl}" class="user-avatar"
                        alt="User Avatar">
                </td>
                <td data-label="info">
                    <div class="user-name">${account.Username}</div>
                    <div class="user-email">${account.Email}</div>
                </td>
                <td data-label="role">
                    <span class="badge ${
                      account.Role == "Customer"
                        ? "bg-primary"
                        : account.Role == "Seller"
                        ? "bg-secondary"
                        : "bg-info"
                    }">${account.Role}</span>
                </td>
                <td data-label="state"><span class="badge ${
                  account.State === "Active" ? "bg-success" : "bg-warning"
                }">${account.State}</span></td>
                <td data-label="phone"><span class="badge bg-warning">${
                  account.Phone
                }</span></td>
                <td class="text-center" data-label="Hành động">
                    <div class="btn-group btn-group-custom" role="group">
                        <button class="btn btn-outline-primary btn-sm" title="Sửa"
                            data-bs-toggle="modal" data-bs-target="#editUserModal">
                                <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm" title="Xóa"
                            data-bs-toggle="modal" data-bs-target="#deleteUserModal">
                                <i class="bi bi-trash"></i>
                        </button>
                        <button class="btn btn-outline-info btn-sm" title="Xem chi tiết">
                            <i class="bi bi-eye"></i>
                        </button>
                    </div>
                </td>
            `;
      tableAccount.appendChild(row);
    });
    
    const checkAll = document.getElementById("checkAll");
    const checkboxes = document.querySelectorAll(".item");
    checkAll.addEventListener("change", function () {
      checkboxes.forEach((cb) => (cb.checked = this.checked));
    });

    checkboxes.forEach((cb) => {
      cb.addEventListener("change", function () {
        if (!this.checked) {
          checkAll.checked = false; // bỏ tích checkbox tổng
        } else if (Array.from(checkboxes).every((c) => c.checked)) {
          checkAll.checked = true; // nếu tất cả con đều tích -> tích lại checkbox tổng
        }
      });
    });

  } catch (err) {
    console.log("Lỗi thông báo", err);
  }
}
document.addEventListener("DOMContentLoaded", () => {
  testGetAccount();
});
