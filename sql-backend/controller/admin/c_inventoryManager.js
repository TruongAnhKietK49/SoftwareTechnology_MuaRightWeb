// ==================== CẤU HÌNH ====================
let pendingProducts = [];
let filteredProducts = [];
let currentPage = 1;
const itemsPerPage = 8;

// ==================== TẢI DỮ LIỆU ====================
async function loadPendingProducts() {
  try {
    const res = await fetch("http://localhost:3000/seller/pendingProducts");
    if (!res.ok) throw new Error("Không thể tải dữ liệu!");
    pendingProducts = await res.json();
    filteredProducts = [...pendingProducts];
    populateFilterOptions();
    renderProducts();
  } catch (err) {
    console.error("❌ Lỗi khi tải sản phẩm:", err);
    document.getElementById(
      "product-cards-container"
    ).innerHTML = `<p class="text-center text-danger py-5">Không thể tải dữ liệu sản phẩm!</p>`;
  }
}

// ==================== HIỂN THỊ SẢN PHẨM ====================
function renderProducts(page = 1) {
  const container = document.getElementById("product-cards-container");
  container.innerHTML = "";

  if (!filteredProducts.length) {
    container.innerHTML = `
      <div class="text-center py-5 w-100 text-muted">
        <i class="bi bi-box-seam display-6 d-block mb-3"></i>
        Không có sản phẩm nào đang chờ duyệt
      </div>`;
    return;
  }

  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageItems = filteredProducts.slice(start, end);

  pageItems.forEach((p, index) => {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <div class="card-checkbox">
        <input class="form-check-input product-checkbox item" 
              type="checkbox" 
              data-index="${pendingProducts.indexOf(p)}">
      </div>

      <div class="product-card-header">
        <img src="${p.ImageUrl || "https://via.placeholder.com/300x200"}" 
            alt="${p.NameProduct}" class="product-img">
        <div class="product-info">
          <div class="product-name">${p.NameProduct}</div>
          <span class="product-category">${p.Category || "Không rõ"}</span>
        </div>
      </div>

      <div class="product-details">
        <div class="product-detail-item">
          <span class="product-detail-label">Người bán:</span>
          <span class="product-detail-value">${p.SellerName || "Ẩn danh"}</span>
        </div>
        <div class="product-detail-item">
          <span class="product-detail-label">Giá:</span>
          <span class="product-price">${Number(p.Price || 0).toLocaleString(
            "vi-VN"
          )}₫</span>
        </div>
      </div>

      <div class="product-actions">
        <button class="btn btn-outline-success btn-sm" 
                title="Duyệt" 
                onclick="approveProduct(${pendingProducts.indexOf(p)})">
          <i class="bi bi-check-lg me-1"></i> Duyệt
        </button>
        <button class="btn btn-outline-danger btn-sm" 
                title="Từ chối" 
                onclick="rejectProduct(${pendingProducts.indexOf(p)})">
          <i class="bi bi-x-lg me-1"></i> Từ chối
        </button>
        <button class="btn btn-outline-info btn-sm" 
                title="Xem chi tiết" 
                onclick="viewProductDetail(${pendingProducts.indexOf(p)})">
          <i class="bi bi-eye me-1"></i> Xem
        </button>
      </div>
    `;

    container.appendChild(card);
  });

  setupSelectAllCheckbox();
  renderPagination(page);
}

// ==================== PHÂN TRANG ====================
function renderPagination(page) {
  const pagination = document.querySelector(".pagination");
  if (!pagination) return;

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  pagination.innerHTML = "";

  const prevDisabled = page === 1 ? "disabled" : "";
  const nextDisabled = page === totalPages ? "disabled" : "";

  pagination.innerHTML += `
    <li class="page-item ${prevDisabled}">
      <a class="page-link" href="#" onclick="changePage(${page - 1})">Trước</a>
    </li>`;

  for (let i = 1; i <= totalPages; i++) {
    pagination.innerHTML += `
      <li class="page-item ${i === page ? "active" : ""}">
        <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
      </li>`;
  }

  pagination.innerHTML += `
    <li class="page-item ${nextDisabled}">
      <a class="page-link" href="#" onclick="changePage(${page + 1})">Sau</a>
    </li>`;
}

function changePage(page) {
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderProducts(currentPage);
}

// ==================== CHECKBOX ====================
function setupSelectAllCheckbox() {
  const selectAll = document.getElementById("selectAll");
  const checkboxes = document.querySelectorAll(".product-checkbox");
  if (!selectAll) return;

  selectAll.addEventListener("change", (e) => {
    checkboxes.forEach((cb) => (cb.checked = e.target.checked));
  });

  checkboxes.forEach((cb) => {
    cb.addEventListener("change", () => {
      const allChecked = [...checkboxes].every((c) => c.checked);
      selectAll.checked = allChecked;
    });
  });
}

// ==================== DUYỆT / TỪ CHỐI ====================
async function approveProduct(index) {
  const product = pendingProducts[index];
  if (!product) return;

  try {
    const res = await fetch("http://localhost:3000/admin/approveProduct", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product }),
    });
    const data = await res.json();

    if (res.ok) {
      alert("✅ Đã duyệt sản phẩm!");
      pendingProducts.splice(index, 1);
      filteredProducts = [...pendingProducts];
      renderProducts(currentPage);
    } else {
      alert("❌ " + data.error);
    }
  } catch (err) {
    console.error("❌ Lỗi duyệt:", err);
  }
}

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
      renderProducts(currentPage);
    } else {
      alert("❌ " + data.error);
    }
  } catch (err) {
    console.error("❌ Lỗi từ chối:", err);
  }
}

// ==================== DUYỆT / XOÁ NHIỀU ====================
async function approveSelectedProducts() {
  const checked = [...document.querySelectorAll(".product-checkbox:checked")];
  if (checked.length === 0) return alert("⚠️ Chưa chọn sản phẩm nào!");
  if (!confirm(`Duyệt ${checked.length} sản phẩm?`)) return;

  for (const cb of checked) {
    const index = parseInt(cb.dataset.index);
    await approveProduct(index);
  }
}

async function removeSelectedProducts() {
  const checked = [...document.querySelectorAll(".product-checkbox:checked")];
  if (checked.length === 0) return alert("⚠️ Chưa chọn sản phẩm nào!");
  if (!confirm(`Từ chối ${checked.length} sản phẩm?`)) return;

  for (const cb of checked) {
    const index = parseInt(cb.dataset.index);
    await rejectProduct(index);
  }
}

// ==================== TÌM KIẾM ====================
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
  filteredProducts = !kw
    ? [...pendingProducts]
    : pendingProducts.filter((p) =>
        normalizeString(
          p.NameProduct + p.Category + p.TagName + p.SellerName
        ).includes(kw)
      );
  renderProducts(1);
}

// ==================== BỘ LỌC ====================

// 🔹 Điền dữ liệu động vào các select box
function populateFilterOptions() {
  const categoryFilter = document.getElementById("categoryFilter");
  const sellerFilter = document.getElementById("sellerFilter");
  const brandFilter = document.getElementById("brandFilter");

  // Lấy danh sách duy nhất cho từng loại
  const categories = [
    ...new Set(pendingProducts.map((p) => p.Category).filter(Boolean)),
  ];
  const sellers = [
    ...new Set(pendingProducts.map((p) => p.SellerName).filter(Boolean)),
  ];
  const brands = [
    ...new Set(pendingProducts.map((p) => p.Brand).filter(Boolean)),
  ];

  // Đổ dữ liệu vào select
  categoryFilter.innerHTML =
    `<option value="">Tất cả danh mục</option>` +
    categories.map((c) => `<option value="${c}">${c}</option>`).join("");

  sellerFilter.innerHTML =
    `<option value="">Tất cả người bán</option>` +
    sellers.map((s) => `<option value="${s}">${s}</option>`).join("");

  brandFilter.innerHTML =
    `<option value="">Tất cả thương hiệu</option>` +
    brands.map((b) => `<option value="${b}">${b}</option>`).join("");
}

// 🔹 Áp dụng bộ lọc
function applyFilters() {
  const category = document.getElementById("categoryFilter").value;
  const seller = document.getElementById("sellerFilter").value;
  const price = document.getElementById("priceFilter").value;
  const brand = document.getElementById("brandFilter").value;

  filteredProducts = pendingProducts.filter((p) => {
    let match = true;

    if (category && p.Category !== category) match = false;
    if (seller && p.SellerName !== seller) match = false;
    if (brand && p.Brand !== brand) match = false;

    // Lọc theo khoảng giá
    if (price) {
      const [minStr, maxStr] = price.split("-");
      const min = minStr ? Number(minStr) * 1000 : 0;
      const max = maxStr ? Number(maxStr) * 1000 : Infinity;
      const priceValue = Number(p.Price) || 0;
      if (priceValue < min || priceValue > max) match = false;
    }

    return match;
  });

  renderProducts(1);
}

// 🔹 Đặt lại bộ lọc
function resetFilters() {
  document.getElementById("categoryFilter").value = "";
  document.getElementById("sellerFilter").value = "";
  document.getElementById("priceFilter").value = "";
  document.getElementById("brandFilter").value = "";
  filteredProducts = [...pendingProducts];
  renderProducts(1);
}

// ==================== MODAL CHI TIẾT ====================
function viewProductDetail(index) {
  const product = pendingProducts[index];
  if (!product) return;

  document.getElementById("detailImage").src =
    product.ImageUrl || "https://via.placeholder.com/400";
  document.getElementById("detailName").innerText =
    product.NameProduct || "Không có tên";
  document.getElementById("detailCategory").innerText =
    product.Category || "Không rõ";
  document.getElementById("detailSeller").innerText =
    product.SellerName || "Không rõ";
  document.getElementById("detailPrice").innerText =
    Number(product.Price || 0).toLocaleString("vi-VN") + "₫";
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

// ==================== KHI TẢI TRANG ====================
document.addEventListener("DOMContentLoaded", () => {
  loadPendingProducts();

  document
    .getElementById("applyFilters")
    ?.addEventListener("click", applyFilters);

  document
    .getElementById("resetFilters")
    ?.addEventListener("click", resetFilters);

  document
    .getElementById("btn-approve-selected")
    ?.addEventListener("click", approveSelectedProducts);

  document
    .getElementById("btn-reject-selected")
    ?.addEventListener("click", removeSelectedProducts);

  const searchInput = document.getElementById("search-input");
  const searchBtn = document.getElementById("btn-search");
  searchInput?.addEventListener("input", (e) => handleSearch(e.target.value));
  searchBtn?.addEventListener("click", () => handleSearch(searchInput.value));
});
