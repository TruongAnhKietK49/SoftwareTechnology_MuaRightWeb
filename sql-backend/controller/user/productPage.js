const account = JSON.parse(localStorage.getItem("account")) || {};
const API_BASE = "http://localhost:3000";
const PER_PAGE = 8;

let PRODUCTS = [];
let PRODUCTS_REVIEW = [];

// DOM Elements
const elements = {
  searchInput: document.getElementById("searchInput"),
  brandSelect: document.getElementById("brandSelect"),
  genderSelect: document.getElementById("genderSelect"),
  priceSelect: document.getElementById("priceSelect"),
  grid: document.getElementById("grid"),
  pagination: document.getElementById("pagination"),
  cartCount: document.getElementById("cartCount"),
  cartItems: document.getElementById("cartItems"),
  cartTotal: document.getElementById("cartTotal"),
  miniCartLabel: document.getElementById("miniCartLabel"),
  btnClearCart: document.getElementById("btnClearCart"),
};

// Modal Elements
const modalElements = {
  title: document.getElementById("pm-title"),
  image: document.getElementById("pm-image"),
  thumb1: document.getElementById("pm-thumb1"),
  thumb2: document.getElementById("pm-thumb2"),
  brand: document.getElementById("pm-brand"),
  gender: document.getElementById("pm-gender"),
  price: document.getElementById("pm-price"),
  id: document.getElementById("pm-id"),
  stars: document.getElementById("pm-stars"),
  starsBig: document.getElementById("pm-stars-big"),
  score: document.getElementById("pm-score"),
  avg: document.getElementById("pm-avg"),
  count: document.getElementById("pm-count"),
  desc: document.getElementById("pm-desc"),
  detail: document.getElementById("pm-detail"),
  reviews: document.getElementById("pm-reviews"),
  minus: document.getElementById("pm-minus"),
  plus: document.getElementById("pm-plus"),
  qty: document.getElementById("pm-qty"),
  form: document.getElementById("pm-form"),
  rating: document.getElementById("rv-rating"),
  text: document.getElementById("rv-text"),
  toast: document.getElementById("pm-toast"),
  addCart: document.getElementById("pm-addcart"),
};

let productModal;

// API Functions
const api = {
  async get(url) {
    const res = await fetch(`${API_BASE}${url}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async post(url, data) {
    const res = await fetch(`${API_BASE}${url}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async put(url, data) {
    const res = await fetch(`${API_BASE}${url}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  },

  async delete(url) {
    const res = await fetch(`${API_BASE}${url}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  },
};

// Utility Functions
const utils = {
  $(sel) {
    return document.querySelector(sel);
  },

  fmtPrice(n) {
    return `$${n}`;
  },

  starIcons(score) {
    const full = Math.floor(score);
    const half = score - full >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return (
      '<i class="bi bi-star-fill"></i>'.repeat(full) +
      (half ? '<i class="bi bi-star-half"></i>' : "") +
      '<i class="bi bi-star"></i>'.repeat(empty)
    );
  },

  debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  },
};

// Data Functions
const dataManager = {
  async init() {
    try {
      const [products, reviews] = await Promise.all([
        api.get("/products/getProductList"),
        api.get("/products/getProductReview"),
      ]);
      PRODUCTS = products.data;
      PRODUCTS_REVIEW = reviews.data;
      renderManager.render(); // Fixed: call renderManager directly
    } catch (error) {
      console.error("Initialization error:", error);
      PRODUCTS = [];
      PRODUCTS_REVIEW = [];
    }
  },

  // Get user reviews
  getUserReviews(productId) {
    return (
      PRODUCTS_REVIEW.filter((review) => review.ProductId == productId) || []
    );
  },

  // Calculate average rating
  averageWithUser(product) {
    const user = this.getUserReviews(product.ProductId);
    const count = user.length;
    const avg = count
      ? user.reduce((sum, r) => sum + Number(r.Rating || 0), 0) / count
      : 0;
    return { avg, count, user };
  },

  fillBrands() {
    const brands = [...new Set(PRODUCTS.map((p) => p.Brand))].sort();
    elements.brandSelect.innerHTML =
      '<option value="">Thương hiệu</option>' +
      brands
        .map((brand) => `<option value="${brand}">${brand}</option>`)
        .join("");
  },
};

// Cart Functions
const cartManager = {
  async getCart() {
    try {
      const data = await api.get(`/cart/getAllItem/${account.AccountId}`);
      return data.data || [];
    } catch (error) {
      console.error("Get cart error:", error);
      return [];
    }
  },

  async addToCart(product, quantity = 1) {
    const cart = await this.getCart();
    const existingItem = cart.find(
      (item) => item.ProductId == product.ProductId
    );

    if (existingItem) {
      existingItem.Quantity += quantity;
      await api.put(`/cart/update/${existingItem.ProductId}`, {
        Quantity: existingItem.Quantity,
        UnitPrice: existingItem.Quantity * existingItem.Price,
      });
    } else {
      await api.post("/cart/add", {
        CustomerId: account.AccountId,
        ProductId: product.ProductId,
        NameProduct: product.NameProduct,
        Quantity: quantity,
        UnitPrice: quantity * product.Price,
      });
    }
    this.renderCartUI();
  },

  async updateCartItem(productId, updates) {
    const cart = await this.getCart();
    const item = cart.find((item) => item.ProductId == productId);
    if (!item) return;

    if (updates.Quantity === 1) {
      item.Quantity++;
    } else if (updates.Quantity === -1) {
      item.Quantity = Math.max(1, item.Quantity - 1);
    }

    await api.put(`/cart/update/${productId}`, {
      Quantity: item.Quantity,
      UnitPrice: item.Quantity * item.Price,
    });
    this.renderCartUI();
  },

  async removeCartItem(productId) {
    await api.delete(`/cart/remove/${productId}`);
    this.renderCartUI();
  },

  async clearCart() {
    await api.delete("/cart/clear");
    localStorage.removeItem("cart");
    this.renderCartUI();
  },

  async renderCartUI() {
    const cart = await this.getCart();
    const totalQty = cart.reduce((sum, item) => sum + item.Quantity, 0);
    const totalMoney = cart.reduce(
      (sum, item) => sum + item.Quantity * item.Price,
      0
    );

    // Update cart badge
    elements.cartCount.textContent = totalQty;
    elements.cartCount.style.display = totalQty ? "inline-block" : "none";
    if (elements.miniCartLabel) {
      elements.miniCartLabel.textContent = `🛒 Giỏ hàng (${totalQty})`;
    }

    // Update cart items
    if (elements.cartItems) {
      elements.cartItems.innerHTML = cart.length
        ? cart
            .map(
              (item) => `
                    <div class="list-group-item py-3">
                        <div class="d-flex align-items-center">
                            <img src="${
                              item.ImageUrl
                            }" class="cart-thumb me-3" alt="${
                item.NameProduct
              }">
                            <div class="flex-grow-1">
                                <div class="d-flex justify-content-between align-items-start">
                                    <div>
                                        <div class="fw-semibold">${
                                          item.NameProduct
                                        }</div>
                                        <div class="small text-secondary">Đơn giá: ${utils.fmtPrice(
                                          item.Price
                                        )}</div>
                                        <div class="small mt-1">
                                            <span class="badge bg-light text-dark">SL: ${
                                              item.Quantity
                                            }</span>
                                        </div>
                                    </div>
                                    <button class="btn btn-sm btn-outline-light" data-remove="${
                                      item.ProductId
                                    }" title="Xóa">
                                        <i class="bi bi-x-lg"></i>
                                    </button>
                                </div>
                                <div class="d-flex align-items-center gap-2 mt-2">
                                    <div class="input-group input-group-sm" style="width:140px">
                                        <button class="btn btn-outline-gold" data-dec="${
                                          item.ProductId
                                        }" type="button">–</button>
                                        <input class="form-control text-center" value="${
                                          item.Quantity
                                        }" readonly>
                                        <button class="btn btn-gold" data-inc="${
                                          item.ProductId
                                        }" type="button">+</button>
                                    </div>
                                    <div class="ms-auto fw-semibold">${utils.fmtPrice(
                                      item.Quantity * item.Price
                                    )}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `
            )
            .join("")
        : '<div class="text-secondary small">Giỏ hàng đang trống.</div>';
    }

    if (elements.cartTotal) {
      elements.cartTotal.textContent = utils.fmtPrice(totalMoney);
    }
  },
};

// URL State Management
const urlState = {
  get() {
    const params = new URLSearchParams(location.search);
    return {
      q: params.get("q") || "",
      brand: params.get("brand") || "",
      gender: params.get("gender") || "",
      price: params.get("price") || "",
      page: Math.max(1, parseInt(params.get("page")) || 1),
      highlight: params.get("highlight") || "",
    };
  },

  set(state) {
    const sp = new URLSearchParams();
    Object.entries(state).forEach(([key, value]) => {
      if (value && (key !== "page" || value > 1)) sp.set(key, value);
    });
    history.replaceState(null, "", "?" + sp.toString());
  },
};

// Filter Functions
const filterManager = {
  apply(filters) {
    return PRODUCTS.filter((product) => {
      const matchesSearch =
        !filters.q ||
        product.NameProduct.toLowerCase().includes(filters.q.toLowerCase());
      const matchesBrand = !filters.brand || product.Brand === filters.brand;
      const matchesGender =
        !filters.gender || product.Category === filters.gender;
      const matchesPrice =
        !filters.price || this.checkPriceRange(product.Price, filters.price);

      return matchesSearch && matchesBrand && matchesGender && matchesPrice;
    });
  },

  checkPriceRange(price, range) {
    const [minStr, maxStr] = range.split("-");
    const min = Number(minStr) || 0;
    const max = Number(maxStr) || 9999999;
    return price >= min && price <= max;
  },
};

// Render Functions
const renderManager = {
  render() {
    dataManager.fillBrands();
    const state = urlState.get();

    // Update filter values
    if (elements.searchInput) elements.searchInput.value = state.q;
    if (elements.brandSelect) elements.brandSelect.value = state.brand;
    if (elements.genderSelect) elements.genderSelect.value = state.gender;
    if (elements.priceSelect) elements.priceSelect.value = state.price;

    const filtered = filterManager.apply(state);
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    state.page = Math.min(state.page, totalPages);

    const start = (state.page - 1) * PER_PAGE;
    const pageItems = filtered.slice(start, start + PER_PAGE);

    this.renderGrid(pageItems);
    this.renderPagination(state.page, totalPages);
    this.highlightProduct(state.highlight);

    urlState.set(state);
  },

  renderGrid(products) {
    if (!elements.grid) return;

    elements.grid.innerHTML = products
      .map((product) => {
        const { avg, count } = dataManager.averageWithUser(product);
        return `
                    <div class="col-6 col-md-3">
                        <div id="${
                          product.ProductId
                        }" class="product-card h-100">
                            <img class="product-thumb" src="${
                              product.ImageUrl
                            }" alt="${product.NameProduct}">
                            <div class="card-overlay">
                                <button class="btn btn-sm btn-outline-light pill" data-view="${
                                  product.ProductId
                                }" 
                                        data-bs-toggle="modal" data-bs-target="#productModal">
                                    Xem chi tiết <i class="bi bi-arrow-right"></i>
                                </button>
                            </div>
                            <div class="p-3">
                                <div class="d-flex justify-content-between small mb-1">
                                    <span class="badge rounded-pill badge-tag">${
                                      product.Brand
                                    }</span>
                                    <span class="small-muted">${
                                      product.Category
                                    }</span>
                                </div>
                                <div class="product-title mb-1">${
                                  product.NameProduct
                                }</div>
                                <div class="d-flex align-items-center gap-1 mb-2">
                                    <span class="stars small">${utils.starIcons(
                                      avg
                                    )}</span>
                                    <span class="small text-secondary">(${count})</span>
                                </div>
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="price">${utils.fmtPrice(
                                      product.Price
                                    )}</span>
                                    <button class="btn btn-sm btn-gold" data-cart="${
                                      product.ProductId
                                    }" title="Thêm vào giỏ">
                                        <i class="bi bi-bag-plus"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
      })
      .join("");
  },

  renderPagination(currentPage, totalPages) {
    if (!elements.pagination) return;

    let html = "";

    const addPageItem = (page, text, disabled = false, active = false) => {
      html += `<li class="page-item ${disabled ? "disabled" : ""} ${
        active ? "active" : ""
      }">
                           <a class="page-link" href="#" data-page="${page}">${text}</a>
                         </li>`;
    };

    addPageItem(currentPage - 1, "&laquo;", currentPage === 1);
    for (let i = 1; i <= totalPages; i++) {
      addPageItem(i, i, false, i === currentPage);
    }
    addPageItem(currentPage + 1, "&raquo;", currentPage === totalPages);

    elements.pagination.innerHTML = html;
  },

  highlightProduct(productId) {
    if (productId) {
      const element = document.getElementById(productId);
      if (element) {
        element.classList.add("highlight");
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  },

  openProductModal(productId) {
    const product = PRODUCTS.find((p) => p.ProductId == productId);
    if (!product) return;

    const { avg, count, user } = dataManager.averageWithUser(product);

    // Fill basic info
    modalElements.title.textContent = product.NameProduct;
    modalElements.image.src = product.ImageUrl;
    modalElements.image.alt = product.NameProduct;
    modalElements.thumb1.src = product.ImageUrl;
    modalElements.thumb2.src = product.ImageUrl;
    modalElements.price.textContent = utils.fmtPrice(product.Price);
    modalElements.id.textContent = product.ProductId;

    // Fill ratings
    modalElements.stars.innerHTML = utils.starIcons(avg);
    modalElements.starsBig.innerHTML = utils.starIcons(avg);
    modalElements.score.textContent = `${avg.toFixed(1)} / 5`;
    modalElements.avg.textContent = `${avg.toFixed(1)} / 5`;
    modalElements.count.textContent = count;

    // Fill descriptions
    modalElements.desc.textContent = "Hương thơm cân bằng, dễ dùng hằng ngày.";
    modalElements.detail.innerHTML = [
      "Hương đầu: cam bergamot – trái cây tươi.",
      "Hương giữa: hoa trắng/hồng – mịn và sâu.",
      "Hương cuối: gỗ – hổ phách – vani ấm áp.",
      "Độ lưu hương: 6–8 giờ • Độ toả: vừa – xa.",
    ]
      .map((item) => `<li>${item}</li>`)
      .join("");

    // Fill reviews
    modalElements.reviews.innerHTML = user.length
      ? ""
      : '<div class="text-secondary small">Chưa có đánh giá từ người dùng gần đây.</div>';

    user
      .slice()
      .reverse()
      .forEach((review) => {
        const reviewEl = document.createElement("div");
        reviewEl.className = "review-item";
        reviewEl.innerHTML = `
                    <div class="d-flex align-items-center justify-content-between">
                        <div class="fw-semibold">${(
                          review.Name || "Khách"
                        ).replace(/</g, "&lt;")}</div>
                        <div class="stars">${utils.starIcons(
                          review.Rating
                        )}</div>
                    </div>
                    <div class="small text-secondary">${new Date(
                      review.CreatedAt
                    ).toLocaleString()}</div>
                    <div class="mt-1">${(review.Comment || "").replace(
                      /</g,
                      "&lt;"
                    )}</div>
                `;
        modalElements.reviews.appendChild(reviewEl);
      });

    if (productModal) {
      productModal.show();
    }
  },
};

// Event Handlers
const eventHandlers = {
  init() {
    // Initialize modal
    const modalElement = document.getElementById("productModal");
    if (modalElement) {
      productModal = new bootstrap.Modal(modalElement);
    }

    // Filter events
    if (elements.searchInput) {
      elements.searchInput.addEventListener(
        "input",
        utils.debounce((e) => this.onFilterChange({ q: e.target.value }), 300)
      );
    }
    if (elements.brandSelect) {
      elements.brandSelect.addEventListener("change", (e) =>
        this.onFilterChange({ brand: e.target.value })
      );
    }
    if (elements.genderSelect) {
      elements.genderSelect.addEventListener("change", (e) =>
        this.onFilterChange({ gender: e.target.value })
      );
    }
    if (elements.priceSelect) {
      elements.priceSelect.addEventListener("change", (e) =>
        this.onFilterChange({ price: e.target.value })
      );
    }

    // Pagination
    if (elements.pagination) {
      elements.pagination.addEventListener("click", (e) => {
        const pageLink = e.target.closest("a.page-link");
        if (!pageLink) return;
        e.preventDefault();
        const page = parseInt(pageLink.dataset.page);
        if (!isNaN(page)) this.onFilterChange({ page });
      });
    }

    // Product interactions
    document.addEventListener("click", (e) => {
      const viewBtn = e.target.closest("[data-view]");
      const cartBtn = e.target.closest("[data-cart]");

      if (viewBtn) {
        e.preventDefault();
        renderManager.openProductModal(viewBtn.dataset.view);
      } else if (cartBtn) {
        e.preventDefault();
        const product = PRODUCTS.find(
          (p) => p.ProductId === cartBtn.dataset.cart
        );
        if (product) cartManager.addToCart(product, 1);
      }
    });

    // Cart actions
    if (elements.cartItems) {
      elements.cartItems.addEventListener("click", async (e) => {
        const incBtn = e.target.closest("[data-inc]");
        const decBtn = e.target.closest("[data-dec]");
        const remBtn = e.target.closest("[data-remove]");

        if (incBtn)
          await cartManager.updateCartItem(incBtn.dataset.inc, { Quantity: 1 });
        if (decBtn)
          await cartManager.updateCartItem(decBtn.dataset.dec, {
            Quantity: -1,
          });
        if (remBtn) await cartManager.removeCartItem(remBtn.dataset.remove);
      });
    }

    if (elements.btnClearCart) {
      elements.btnClearCart.addEventListener("click", () =>
        cartManager.clearCart()
      );
    }

    // Modal events
    if (modalElements.minus) {
      modalElements.minus.addEventListener("click", () => {
        modalElements.qty.value = Math.max(
          1,
          parseInt(modalElements.qty.value) - 1
        );
      });
    }

    if (modalElements.plus) {
      modalElements.plus.addEventListener("click", () => {
        modalElements.qty.value = Math.min(
          99,
          parseInt(modalElements.qty.value) + 1
        );
      });
    }

    if (modalElements.addCart) {
      modalElements.addCart.addEventListener("click", () => {
        const product = PRODUCTS.find(
          (p) => p.ProductId == modalElements.id.textContent
        );
        const quantity = parseInt(modalElements.qty.value) || 1;
        if (product) cartManager.addToCart(product, quantity);
      });
    }

    if (modalElements.form) {
      modalElements.form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const reviewData = {
          rating: parseInt(modalElements.rating.value),
          text: modalElements.text.value.trim(),
        };

        if (!reviewData.text) return;

        try {
          await api.post("/products/addReview", {
            ProductId: modalElements.id.textContent,
            CustomerId: account.AccountId,
            Rating: reviewData.rating,
            Comment: reviewData.text,
            CreatedAt: new Date().toISOString(),
          });

          modalElements.text.value = "";
          modalElements.toast.style.display = "block";
          setTimeout(() => (modalElements.toast.style.display = "none"), 1500);

          await dataManager.init();
          renderManager.openProductModal(modalElements.id.textContent);
        } catch (error) {
          console.error("Review submission error:", error);
        }
      });
    }

    // Floating cart
    this.initFloatingCart();
  },

  onFilterChange(updates) {
    const state = {
      ...urlState.get(),
      ...updates,
      page: updates.page || 1,
      highlight: "",
    };
    urlState.set(state);
    renderManager.render();
  },

  initFloatingCart() {
    const fab = document.querySelector(".cart-fab");
    const fabBtn = document.getElementById("btnCartFab");
    const offcart = document.getElementById("offcart");

    if (!fab || !fabBtn || !offcart) return;

    let dragging = false,
      moved = false,
      startX = 0,
      startY = 0,
      offsetX = 0,
      offsetY = 0;

    const onMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved = true;
      if (!moved) return;

      fab.style.left = `${e.clientX - offsetX}px`;
      fab.style.top = `${e.clientY - offsetY}px`;
      fab.style.right = fab.style.bottom = "auto";
      fab.style.transform = "none";
      e.preventDefault();
    };

    const onUp = () => {
      dragging = false;
      fab.classList.remove("dragging");
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);

      if (!moved) {
        const cart = bootstrap.Offcanvas.getOrCreateInstance(offcart);
        cart.show();
      }
      setTimeout(() => (moved = false), 0);
    };

    fabBtn.addEventListener("pointerdown", (e) => {
      dragging = true;
      moved = false;
      fab.classList.add("dragging");

      const rect = fab.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      offsetX = startX - rect.left;
      offsetY = startY - rect.top;

      document.addEventListener("pointermove", onMove, { passive: false });
      document.addEventListener("pointerup", onUp, { passive: false });
    });

    fabBtn.addEventListener("click", (e) => {
      if (dragging || moved) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    });
  },
};

// Navigation height utility
function setNavHeight() {
  const nav = document.querySelector(".navbar");
  if (nav) {
    document.documentElement.style.setProperty(
      "--nav-h",
      `${nav.offsetHeight}px`
    );
  }
}

// Initialize application
async function initApp() {
  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", async () => {
      await dataManager.init();
      eventHandlers.init();
      await cartManager.renderCartUI();
      setNavHeight();
    });
  } else {
    await dataManager.init();
    eventHandlers.init();
    await cartManager.renderCartUI();
    setNavHeight();
  }

  window.addEventListener("resize", setNavHeight);
  if (document.fonts?.ready) {
    document.fonts.ready.then(setNavHeight);
  }
}

// Start the application
initApp();
