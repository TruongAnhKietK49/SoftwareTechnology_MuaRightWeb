let pendingProducts = [];
let filteredProducts = [];
let currentPage = 1;
const itemsPerPage = 5;

// 🧭 Tải danh sách sản phẩm chờ duyệt
async function loadPendingProducts() {
  try {
    const res = await fetch("http://localhost:3000/seller/pendingProducts");
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    pendingProducts = await res.json();
    filteredProducts = [...pendingProducts];
    renderProducts(1);
  } catch (err) {
    console.error("❌ Lỗi khi tải danh sách sản phẩm chờ duyệt:", err);
  }
}

// 📦 Render danh sách theo trang
function renderProducts(page = 1) {
  const tableBody = document.getElementById("pendingProduct-table");
  tableBody.innerHTML = "";

  if (!filteredProducts || filteredProducts.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center text-muted py-4">
          Không có sản phẩm nào đang chờ duyệt
        </td>
      </tr>`;
    renderPagination();
    return;
  }

  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageItems = filteredProducts.slice(start, end);

  pageItems.forEach((p, index) => {
    const globalIndex = pendingProducts.indexOf(p);
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
    <td data-label="Ngày gửi">${new Date(
      p.CreatedAt || Date.now()
    ).toLocaleDateString("vi-VN")}</td>
    <td class="text-end" data-label="Giá">${Number(p.Price || 0).toLocaleString(
      "vi-VN"
    )}₫</td>
    <td class="text-center" data-label="Hành động">
      <div class="btn-group btn-group-custom" role="group">
        <button class="btn btn-outline-success btn-sm" title="Duyệt" onclick="approveProduct(${index})">
          <i class="bi bi-check-lg"></i>
        </button>
        <button class="btn btn-outline-danger btn-sm" title="Từ chối" onclick="rejectProduct(${index})">
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
      .querySelectorAll("#pendingProduct-table .form-check-input")
      .forEach((cb) => (cb.checked = isChecked));
  });
}

// ✅ DUYỆT 1 sản phẩm
async function approveProduct(index) {
  const product = pendingProducts[index];
  if (!product) return;
  if (!confirm(`Duyệt sản phẩm "${product.NameProduct}"?`)) return;

  try {
    const res = await fetch("http://localhost:3000/admin/approveProduct", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product }),
    });
    const data = await res.json();

    if (res.ok) {
      alert("✅ Đã duyệt sản phẩm thành công!");
      pendingProducts.splice(index, 1);
      filteredProducts = [...pendingProducts];
      renderProducts(1);
    } else {
      alert("❌ " + data.error);
    }
  } catch (err) {
    console.error("❌ Lỗi duyệt sản phẩm:", err);
  }
}

// ❌ TỪ CHỐI 1 sản phẩm
async function rejectProduct(index) {
  const product = pendingProducts[index];
  if (!product) return;
  if (!confirm(`Từ chối sản phẩm "${product.NameProduct}"?`)) return;

  try {
    const res = await fetch("http://localhost:3000/admin/rejectProduct", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ NameProduct: product.NameProduct }),
    });
    const data = await res.json();

    if (res.ok) {
      alert("🗑️ Đã từ chối sản phẩm!");
      pendingProducts.splice(index, 1);
      filteredProducts = [...pendingProducts];
      renderProducts(1);
    } else {
      alert("❌ " + data.error);
    }
  } catch (err) {
    console.error("❌ Lỗi khi từ chối:", err);
  }
}

// ✅ DUYỆT các mục đã chọn
async function approveSelectedProducts() {
  const checked = [
    ...document.querySelectorAll(
      "#pendingProduct-table .form-check-input:checked"
    ),
  ];
  if (checked.length === 0)
    return alert("⚠️ Vui lòng chọn ít nhất 1 sản phẩm!");
  if (!confirm(`Duyệt ${checked.length} sản phẩm được chọn?`)) return;

  for (const cb of checked) {
    const index = parseInt(cb.dataset.index);
    await approveProduct(index);
  }
}

// ❌ TỪ CHỐI các mục đã chọn
async function rejectSelectedProducts() {
  const checked = [
    ...document.querySelectorAll(
      "#pendingProduct-table .form-check-input:checked"
    ),
  ];
  if (checked.length === 0)
    return alert("⚠️ Vui lòng chọn ít nhất 1 sản phẩm!");
  if (!confirm(`Từ chối ${checked.length} sản phẩm được chọn?`)) return;

  for (const cb of checked) {
    const index = parseInt(cb.dataset.index);
    await rejectProduct(index);
  }
}

// 🔍 Tìm kiếm
function normalizeString(str = "") {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

function handleSearch(keyword) {
  const kw = normalizeString(keyword);
  if (!kw) {
    filteredProducts = [...pendingProducts];
  } else {
    filteredProducts = pendingProducts.filter((p) => {
      const name = normalizeString(p.NameProduct || "");
      const category = normalizeString(p.Category || "");
      const tag = normalizeString(p.TagName || "");
      const seller = normalizeString(p.SellerName || "");
      return (
        name.includes(kw) ||
        category.includes(kw) ||
        tag.includes(kw) ||
        seller.includes(kw)
      );
    });
  }
  renderProducts(1);
}

// 👁️ Xem chi tiết sản phẩm
function viewProductDetail(index) {
  const product = pendingProducts[index];
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
  loadPendingProducts();
  document
    .getElementById("btn-approve-selected")
    ?.addEventListener("click", approveSelectedProducts);
  document
    .getElementById("btn-reject-selected")
    ?.addEventListener("click", rejectSelectedProducts);

  const searchInput = document.getElementById("search-input");
  const searchBtn = document.getElementById("btn-search");
  searchInput?.addEventListener("input", (e) => handleSearch(e.target.value));
  searchBtn?.addEventListener("click", () => handleSearch(searchInput.value));
});
