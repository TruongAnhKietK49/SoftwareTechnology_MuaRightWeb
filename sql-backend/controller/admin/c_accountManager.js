async function getAccount() {
  const res = await fetch("http://localhost:3000/admin/accounts");
  const data = await res.json();
  console.log(data);

  return data;
}

// Hàm test get account
async function testGetAccount() {
  try {
    const res = await getAccount();
    //console.log(res);
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
                        <button class="btn btn-outline-danger btn-sm" title="Xóa">
                          <i class="bi bi-trash"></i>
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

    // --- Gắn sự kiện click cho nút Xóa ---
    const deleteButtons = document.querySelectorAll(".btn-outline-danger");
    deleteButtons.forEach((btn, index) => {
      btn.addEventListener("click", async () => {
        const username = res[index].Username;
        console.log(username);

        // Hỏi xác nhận trước khi xóa
        const confirmDelete = confirm(
          `Bạn có chắc muốn xóa tài khoản "${username}" không?`
        );
        if (!confirmDelete) return;

        try {
          const response = await fetch(
            `http://localhost:3000/admin/accounts/${username}`,
            {
              method: "DELETE",
            }
          );

          const result = await response.json();
          alert(result.message);

          if (result.success) {
            // Xóa thành công => cập nhật lại bảng
            testGetAccount();
          }
        } catch (error) {
          console.error("Lỗi khi xóa tài khoản:", error);
          alert("Đã xảy ra lỗi khi xóa tài khoản!");
        }
      });
    });

    // --- Gắn sự kiện click cho nút Sửa ---
    const editButtons = document.querySelectorAll(".btn-outline-primary");
    editButtons.forEach((btn, index) => {
      btn.addEventListener("click", () => {
        const account = res[index];

        // Gán dữ liệu vào các input trong modal
        document.getElementById("editEmail").value = account.Email || "";
        document.getElementById("editPhone").value = account.Phone || "";
        document.getElementById("editState").value = account.State || "";

        // Lưu username hiện tại để dùng khi lưu thay đổi
        document.getElementById("saveEditBtn").dataset.username =
          account.Username;
      });
    });
  } catch (err) {
    console.log("Lỗi thông báo", err);
  }
}
document.addEventListener("DOMContentLoaded", () => {
  testGetAccount();
});
// --- Xử lý khi người dùng lưu thay đổi ---
document.getElementById("saveEditBtn").addEventListener("click", async () => {
  const username = document.getElementById("saveEditBtn").dataset.username;
  const email = document.getElementById("editEmail").value;
  const phone = document.getElementById("editPhone").value;
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
        body: JSON.stringify({ Email: email, Phone: phone, State: state }),
      }
    );

    const result = await response.json();
    alert(result.message);

    if (result.success) {
      // Xóa focus khỏi nút hiện tại để tránh cảnh báo aria-hidden
      document.activeElement.blur();

      // Ẩn modal sau khi cập nhật thành công
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("editUserModal")
      );
      modal.hide();

      // Refresh lại bảng
      testGetAccount();
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật tài khoản:", error);
    alert("Đã xảy ra lỗi khi cập nhật tài khoản!");
  }
});
