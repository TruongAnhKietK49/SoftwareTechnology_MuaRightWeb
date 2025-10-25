let Products = [];
let filteredProducts = [];
let currentPage = 1;
const itemsPerPage = 8;

// 🧭 Tải danh sách sản phẩm
async function loadProducts() {
  const container = document.getElementById("product-cards-container");
  container.innerHTML = `
    <div class="text-center py-5 w-100">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Đang tải dữ liệu...</span>
      </div>
      <p class="mt-3">Đang tải dữ liệu sản phẩm...</p>
    </div>
  `;

  try {
    const res = await fetch("http://localhost:3000/admin/Products");
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    Products = await res.json();
    filteredProducts = [...Products];
    renderProducts(1);
    populateFilters();
    console.log("✅ Tải danh sách sản phẩm:", Products);
  } catch (err) {
    console.error("❌ Lỗi khi tải danh sách sản phẩm:", err);
    container.innerHTML = `
      <div class="text-center text-muted py-5">
        <i class="bi bi-exclamation-triangle display-6"></i>
        <p class="mt-3">Không thể tải dữ liệu sản phẩm.</p>
      </div>`;
  }
}

// ✅ Hàm đổ dữ liệu vào các filter (danh mục, người bán, thương hiệu)
function populateFilters() {
  const categorySet = new Set();
  const sellerSet = new Set();
  const brandSet = new Set();

  Products.forEach((p) => {
    if (p.Category) categorySet.add(p.Category);
    if (p.SellerName) sellerSet.add(p.SellerName);
    if (p.Brand) brandSet.add(p.Brand);
  });

  const categoryFilter = document.getElementById("categoryFilter");
  const sellerFilter = document.getElementById("sellerFilter");
  const brandFilter = document.getElementById("brandFilter");

  // Thêm danh mục
  categorySet.forEach((category) => {
    const opt = document.createElement("option");
    opt.value = category;
    opt.textContent = category;
    categoryFilter.appendChild(opt);
  });

  // Thêm người bán
  sellerSet.forEach((seller) => {
    const opt = document.createElement("option");
    opt.value = seller;
    opt.textContent = seller;
    sellerFilter.appendChild(opt);
  });

  // Thêm thương hiệu
  brandSet.forEach((brand) => {
    const opt = document.createElement("option");
    opt.value = brand;
    opt.textContent = brand;
    brandFilter.appendChild(opt);
  });
}

// ✅ Áp dụng bộ lọc
function applyFilters() {
  const categoryValue = document.getElementById("categoryFilter").value;
  const sellerValue = document.getElementById("sellerFilter").value;
  const priceValue = document.getElementById("priceFilter").value;
  const brandValue = document.getElementById("brandFilter").value;

  filteredProducts = Products.filter((p) => {
    const matchCategory = !categoryValue || p.Category === categoryValue;
    const matchSeller = !sellerValue || p.SellerName === sellerValue;
    const matchBrand = !brandValue || p.Brand === brandValue;

    // Xử lý khoảng giá
    let matchPrice = true;
    if (priceValue) {
      const [min, max] = priceValue.split("-");
      const priceK = p.Price / 1000; // đổi sang nghìn để dễ so
      if (priceValue === "1000+") matchPrice = priceK > 1000;
      else matchPrice = priceK >= Number(min) && priceK <= Number(max);
    }

    return matchCategory && matchSeller && matchBrand && matchPrice;
  });

  currentPage = 1;
  renderProducts(currentPage);
}

// ✅ Đặt lại bộ lọc
function resetFilters() {
  document.getElementById("categoryFilter").value = "";
  document.getElementById("sellerFilter").value = "";
  document.getElementById("priceFilter").value = "";
  document.getElementById("brandFilter").value = "";

  filteredProducts = [...Products];
  renderProducts(1);
}

// ✅ Gán sự kiện cho nút
document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("applyFilters")
    ?.addEventListener("click", applyFilters);
  document
    .getElementById("resetFilters")
    ?.addEventListener("click", resetFilters);
});

// 📦 Render danh sách sản phẩm dạng card
function renderProducts(page = 1) {
  const container = document.getElementById("product-cards-container");
  container.innerHTML = "";

  if (!filteredProducts || filteredProducts.length === 0) {
    container.innerHTML = `
      <div class="text-center text-muted py-5">
        <i class="bi bi-box-seam display-6 mb-2"></i>
        <p>Không có sản phẩm nào.</p>
      </div>`;
    renderPagination();
    return;
  }

  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageItems = filteredProducts.slice(start, end);

  pageItems.forEach((p) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <div class="card-checkbox">
        <input class="form-check-input product-checkbox item" type="checkbox" value="${
          p.ProductId
        }">
      </div>
      <div class="product-card-header">
        <img src="${p.ImageUrl || "https://via.placeholder.com/150"}" 
             alt="${p.NameProduct}" class="product-img">
        <div class="product-info">
          <div class="product-name">${p.NameProduct}</div>
          <span class="product-category">${p.Category || "Không rõ"}</span>
        </div>
      </div>
      <div class="product-details">
        <div class="product-detail-item">
          <span class="product-detail-label">Người bán:</span>
          <span class="product-detail-value">${p.SellerName}</span>
        </div>
        <div class="product-detail-item">
          <span class="product-detail-label">Số lượng:</span>
          <span class="product-detail-value">${p.Quantity}</span>
        </div>
        <div class="product-detail-item">
          <span class="product-detail-label">Giá:</span>
          <span class="product-price">${formatPrice(p.Price)}</span>
        </div>
        <div class="product-detail-item rating">
          <span class="product-detail-label">Đánh giá:</span>
          <span class="product-detail-value">
            ${renderStars(p.AverageRating)} 
            <span class="text-muted small">(${p.TotalReviews || 0})</span>
          </span>
        </div>
      </div>
      <div class="product-actions">
        <button class="btn btn-outline-primary btn-sm view-product" data-id="${
          p.ProductId
        }">
          <i class="bi bi-eye me-1"></i> Xem
        </button>
        <button class="btn btn-outline-danger btn-sm delete-product" data-id="${
          p.ProductId
        }">
          <i class="bi bi-trash me-1"></i> Xóa
        </button>
      </div>
    `;
    container.appendChild(card);
  });

  // Gắn sự kiện sau khi render
  setupCheckAll();
  setupProductEvents();
  renderPagination();
}

// Checkbox tổng
function setupCheckAll() {
  const checkAll = document.getElementById("selectAll");
  if (!checkAll) return;

  // Lấy tất cả checkbox con trong phần danh sách user
  const checkboxes = document.querySelectorAll(
    '.card-checkbox input[type="checkbox"].item'
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

// Render đánh giá cho sản phẩm
function renderStars(rating) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  let stars = "";

  // Sao đầy
  for (let i = 0; i < fullStars; i++) {
    stars += `<i class="bi bi-star-fill text-warning"></i>`;
  }

  // Nửa sao
  if (halfStar) {
    stars += `<i class="bi bi-star-half text-warning"></i>`;
  }

  // Sao rỗng
  for (let i = 0; i < emptyStars; i++) {
    stars += `<i class="bi bi-star text-warning"></i>`;
  }

  return stars;
}

// 💰 Format giá
function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

// 🎯 Thiết lập sự kiện nút Xem / Xóa
function setupProductEvents() {
  document.querySelectorAll(".view-product").forEach((btn) => {
    btn.addEventListener("click", () => viewProductDetail(btn.dataset.id));
  });

  document.querySelectorAll(".delete-product").forEach((btn) => {
    btn.addEventListener("click", () => removeProduct(btn.dataset.id));
  });
}

// 🗑️ Xóa sản phẩm đơn
async function removeProduct(productId) {
  const product = Products.find((p) => p.ProductId == productId);
  if (!product) return;

  if (!confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${product.NameProduct}"?`))
    return;

  try {
    const res = await fetch(
      `http://localhost:3000/admin/products/${productId}`,
      {
        method: "DELETE",
      }
    );

    if (!res.ok) throw new Error("Không thể xóa sản phẩm");

    alert("✅ Xóa sản phẩm thành công!");
    filteredProducts = filteredProducts.filter((p) => p.ProductId != productId);
    renderProducts(currentPage);
  } catch (error) {
    console.error("❌ Lỗi khi xóa sản phẩm:", error);
    alert("Đã xảy ra lỗi khi xóa sản phẩm!");
  }
}

// 🗑️ Xóa nhiều sản phẩm
async function removeSelectedProducts() {
  const checkboxes = document.querySelectorAll(".product-checkbox:checked");
  if (checkboxes.length === 0) {
    alert("Vui lòng chọn ít nhất một sản phẩm để xóa!");
    return;
  }

  if (!confirm(`Bạn có chắc muốn xóa ${checkboxes.length} sản phẩm đã chọn?`))
    return;

  const selectedIds = Array.from(checkboxes).map((cb) => cb.value);

  try {
    for (const id of selectedIds) {
      await fetch(`http://localhost:3000/admin/products/${id}`, {
        method: "DELETE",
      });
    }

    alert("✅ Xóa sản phẩm thành công!");
    filteredProducts = filteredProducts.filter(
      (p) => !selectedIds.includes(p.ProductId.toString())
    );
    renderProducts(currentPage);
  } catch (error) {
    console.error("❌ Lỗi khi xóa sản phẩm:", error);
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
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// 👁️ Xem chi tiết sản phẩm (hiển thị modal)
function viewProductDetail(productId) {
  const product = Products.find((p) => p.ProductId == productId);
  if (!product) return;

  document.getElementById("detailImage").src =
    product.ImageUrl || "https://via.placeholder.com/400";
  document.getElementById("detailName").innerText =
    product.NameProduct || "Không có tên";
  document.getElementById("detailCategory").innerText =
    product.Category || "Không xác định";
  document.getElementById("detailSeller").innerText =
    product.SellerName || `Người bán #${product.SellerId}`;
  document.getElementById("detailPrice").innerText = formatPrice(product.Price);
  document.getElementById("detailQuantity").innerText =
    product.Quantity || "Không rõ";
  document.getElementById("detailWarranty").innerText =
    product.Warranty || "Không có";
  document.getElementById("detailTag").innerText =
    product.TagName || "Không có";
  document.getElementById("detailDescription").innerText =
    product.Description || "Không có mô tả";

  new bootstrap.Modal(document.getElementById("productDetailModal")).show();
}

// 🚀 Khi trang load
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();

  const searchInput = document.getElementById("search-input");
  const searchBtn = document.getElementById("btn-search");
  searchBtn?.addEventListener("click", () => handleSearch(searchInput.value));
  searchInput?.addEventListener("input", (e) => handleSearch(e.target.value));
});

// 🔍 Tìm kiếm sản phẩm theo tên
function handleSearch(keyword) {
  keyword = keyword.trim().toLowerCase();
  filteredProducts = Products.filter((p) =>
    p.NameProduct.toLowerCase().includes(keyword)
  );
  currentPage = 1;
  renderProducts();
}
