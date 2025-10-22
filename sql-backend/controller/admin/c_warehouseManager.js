let Products = [];
let filteredProducts = [];
let currentPage = 1;
const itemsPerPage = 5;

// 🧭 Tải danh sách sản phẩm
async function loadProducts() {
  try {
    const res = await fetch("http://localhost:3000/admin/Products");
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    Products = await res.json();
    filteredProducts = [...Products];
    renderProducts(1);
    console.log("✅ Tải danh sách sản phẩm:", Products);
    
  } catch (err) {
    console.error("❌ Lỗi khi tải danh sách sản phẩm chờ duyệt:", err);
  }
}

// 📦 Render danh sách theo trang
function renderProducts(page = 1) {
  const tableBody = document.getElementById("Product-table");
  tableBody.innerHTML = "";

  if (!filteredProducts || filteredProducts.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center text-muted py-4">
          Không có sản phẩm nào
        </td>
      </tr>`;
    renderPagination();
    return;
  }

  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageItems = filteredProducts.slice(start, end);

  pageItems.forEach((p, index) => {
    const globalIndex = Products.indexOf(p);
    renderProductRow(p, globalIndex, tableBody);
  });

  renderPagination();
  setupSelectAllCheckbox();
}

// 📃 Render từng dòng sản phẩm
function renderProductRow(p, index, tableBody) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td class="text-center" data-label="Chọn">
      <input class="form-check-input" type="checkbox" data-index="${index}">
    </td>
    <td data-label="Ảnh">
      <img src="${p.ImageUrl || "https://via.placeholder.com/200"}" 
           class="product-img" alt="Product Image">
    </td>
    <td data-label="Sản phẩm">
      <div class="product-name">${p.NameProduct || "Không có tên"}</div>
      <div class="product-sku">SKU: SP-${1000 + index}</div>
    </td>
    <td data-label="Danh mục">${p.Category || "Khác"}</td>
    <td data-label="Người bán">${
      p.SellerName || "Người bán #" + p.SellerId
    }</td>
    <td data-label="Số lượng"> ${p.Quantity || 0}</td>
    <td class="text-end" data-label="Giá">${Number(p.Price || 0).toLocaleString(
      "vi-VN"
    )}₫</td>
    <td class="text-center" data-label="Hành động">
      <div class="btn-group btn-group-custom" role="group">
        <button class="btn btn-outline-danger btn-sm" title="Từ chối" onclick="removeProduct(${index})">
          <i class="bi bi-x-lg"></i>
        </button>
        <button class="btn btn-outline-info btn-sm" title="Xem chi tiết" onclick="viewProductDetail(${index})">
          <i class="bi bi-eye"></i>
        </button>
      </div>
    </td>
  `;
  tableBody.appendChild(tr);
}

// 🗑️ Xóa sản phẩm
async function removeProduct(index) {
  const nameProduct = filteredProducts[index].NameProduct;
  const productId = filteredProducts[index].ProductId;
  console.log("🗑️ Đang xóa sản phẩm có ID:", productId);

  if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm " + nameProduct + "?"))
    return;

  try {
    const res = await fetch(
      `http://localhost:3000/admin/products/${productId}`,
      {
        method: "DELETE",
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Không thể xóa sản phẩm");
    }

    const data = await res.json();
    alert(data.message || "Xóa sản phẩm thành công!");

    // ✅ Xóa sản phẩm khỏi danh sách hiển thị
    filteredProducts.splice(index, 1);

    // ✅ Gọi hàm render lại bảng
    renderProducts(currentPage);
  } catch (error) {
    console.error("❌ Lỗi khi xóa sản phẩm:", error);
    alert("Đã xảy ra lỗi khi xóa sản phẩm!");
  }
}

// 📦 Xóa tất cả sản phẩm chọn
async function removeSelectedProducts() {
  const checkboxes = document.querySelectorAll(
    "tbody input.form-check-input:checked"
  );
  if (checkboxes.length === 0) {
    alert("Vui lòng chọn ít nhất một sản phẩm để xóa!");
    return;
  }

  if (!confirm(`Bạn có chắc muốn xóa ${checkboxes.length} sản phẩm đã chọn?`))
    return; 

  const selectedIds = Array.from(checkboxes).map((cb) => {
    const index = cb.dataset.index;
    return filteredProducts[index].ProductId;
  });

  try {
    for (const id of selectedIds) {
      const res = await fetch(`http://localhost:3000/admin/products/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        console.error(`❌ Lỗi khi xóa sản phẩm ${id}:`, err.error);
      } else {
        console.log(`🗑️ Đã xóa sản phẩm ID: ${id}`);
      }
    }

    alert("✅ Xóa sản phẩm thành công!");

    // ✅ Cập nhật lại danh sách sản phẩm hiển thị
    filteredProducts = filteredProducts.filter(
      (p) => !selectedIds.includes(p.ProductId)
    );
    renderProducts(currentPage);
  } catch (error) {
    console.error("❌ Lỗi khi xóa sản phẩm:", error);
    alert("Đã xảy ra lỗi khi xóa sản phẩm!");
  }
}

// 📄 Phân trang
function renderPagination() {
  const pagination = document.querySelector(".pagination");
  if (!pagination) return;

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  pagination.innerHTML = "";

  const prevDisabled = currentPage === 1 ? "disabled" : "";
  const nextDisabled = currentPage === totalPages ? "disabled" : "";

  pagination.innerHTML += `
    <li class="page-item ${prevDisabled}">
      <a class="page-link" href="#" onclick="changePage(${
        currentPage - 1
      })">Trước</a>
    </li>`;

  for (let i = 1; i <= totalPages; i++) {
    pagination.innerHTML += `
      <li class="page-item ${i === currentPage ? "active" : ""}">
        <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
      </li>`;
  }

  pagination.innerHTML += `
    <li class="page-item ${nextDisabled}">
      <a class="page-link" href="#" onclick="changePage(${
        currentPage + 1
      })">Sau</a>
    </li>`;
}

function changePage(page) {
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderProducts(currentPage);
}

// ✅ Checkbox “chọn tất cả”
function setupSelectAllCheckbox() {
  const selectAllCheckbox = document.querySelector("th .form-check-input");
  if (!selectAllCheckbox) return;

  selectAllCheckbox.addEventListener("change", (e) => {
    const isChecked = e.target.checked;
    document
      .querySelectorAll("#Product-table .form-check-input")
      .forEach((cb) => (cb.checked = isChecked));
  });
}

// 👁️ Xem chi tiết sản phẩm
function viewProductDetail(index) {
  const product = Products[index];
  if (!product) return;

  document.getElementById("detailImage").src =
    product.ImageUrl || "https://via.placeholder.com/400";
  document.getElementById("detailName").innerText =
    product.NameProduct || "Không có tên";
  document.getElementById("detailCategory").innerText =
    product.Category || "Không xác định";
  document.getElementById("detailSeller").innerText =
    product.SellerName || `Người bán #${product.SellerId}`;
  document.getElementById("detailPrice").innerText = `${Number(
    product.Price || 0
  ).toLocaleString("vi-VN")}₫`;
  document.getElementById("detailQuantity").innerText =
    product.Quantity || "Không rõ";
  document.getElementById("detailWarranty").innerText =
    product.Warranty || "Không có";
  document.getElementById("detailTag").innerText =
    product.TagName || "Không có";
  document.getElementById("detailDescription").innerText =
    product.Description || "Không có mô tả";

  const modal = new bootstrap.Modal(
    document.getElementById("productDetailModal")
  );
  modal.show();
}

// 🧩 Fix aria-hidden cho modal
document.querySelectorAll(".modal").forEach((modal) => {
  modal.addEventListener("hide.bs.modal", () => {
    if (document.activeElement && modal.contains(document.activeElement)) {
      document.activeElement.blur();
    }
  });
  modal.addEventListener("hidden.bs.modal", () =>
    modal.removeAttribute("aria-hidden")
  );
  modal.addEventListener("shown.bs.modal", () => {
    let parent = modal.parentElement;
    while (parent) {
      if (parent.hasAttribute("aria-hidden"))
        parent.removeAttribute("aria-hidden");
      parent = parent.parentElement;
    }
  });
});
window.addEventListener("focusin", () => {
  const modal = document.querySelector(".modal.show");
  if (modal?.hasAttribute("aria-hidden")) modal.removeAttribute("aria-hidden");
});

// 🚀 Khi trang load
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();

  const searchInput = document.getElementById("search-input");
  const searchBtn = document.getElementById("btn-search");
  searchInput?.addEventListener("input", (e) => handleSearch(e.target.value));
  searchBtn?.addEventListener("click", () => handleSearch(searchInput.value));
});
