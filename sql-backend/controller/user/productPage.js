let PRODUCTS = [],
  PER_PAGE = 8,
  $ = (s) => document.querySelector(s);
async function getProductList() {
  try {
    const r = await fetch("http://localhost:3000/products/getProductList");
    if (!r.ok) throw "ERR";
    PRODUCTS = (await r.json()).data;
    render();
    console.log(PRODUCTS);
  } catch (e) {
    console.error(e);
  }
}
getProductList();

const getCart = async () => {
  try {
    const r = await fetch("http://localhost:3000/cart/getAllItem");
    return r.ok ? (await r.json()).data : [];
  } catch (e) {
    return [];
  }
};
const saveCart = async (cart) => {
  localStorage.setItem("cart", JSON.stringify(cart));
  await renderCartUI();
};
const addToCart = async (p, q) => {
  const cart = await getCart(),
    f = cart.find((i) => i.ProductId == p.ProductId);
  if (f) {
    f.Quantity += q;
    await fetch(`http://localhost:3000/cart/update/${f.ProductId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Quantity: f.Quantity,
        UnitPrice: f.Quantity * f.Price,
      }),
    });
  } else {
    await fetch("http://localhost:3000/cart/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        CustomerId: account.AccountId,
        ProductId: p.ProductId,
        NameProduct: p.NameProduct,
        Quantity: q,
        UnitPrice: q * p.Price,
      }),
    });
    cart.push({ ...p, Quantity: q });
  }
  saveCart(cart);
};

const fmtPrice = (n) => `$${n}`,
  starIcons = (s) => {
    const f = Math.floor(s),
      h = s - f >= 0.5 ? 1 : 0,
      e = 5 - f - h;
    return (
      '<i class="bi bi-star-fill"></i>'.repeat(f) +
      (h ? '<i class="bi bi-star-half"></i>' : "") +
      '<i class="bi bi-star"></i>'.repeat(e)
    );
  };
const _k = (id) => "reviews_" + id,
  getUserReviews = (id) => JSON.parse(localStorage.getItem(_k(id)) || "[]"),
  addUserReview = (id, r) => {
    const a = getUserReviews(id);
    a.push(r);
    localStorage.setItem(_k(id), JSON.stringify(a));
  };
const averageWithUser = (p) => {
  const u = getUserReviews(p.ProductId),
    c = u.length,
    a = c ? u.reduce((s, r) => s + Number(r.rating || 0), 0) / c : 0;
  return { avg: a, count: c, user: u };
};

const fillBrands = () => {
  const b = [...new Set(PRODUCTS.map((p) => p.Brand))].sort(),
    sel = $("#brandSelect");
  sel.innerHTML = '<option value="">Tất cả</option>';
  b.forEach((v) =>
    sel.appendChild(
      Object.assign(document.createElement("option"), {
        value: v,
        textContent: v,
      })
    )
  );
};

const stateFromURL = () => {
  const p = new URLSearchParams(location.search);
  return {
    q: p.get("q") || "",
    brand: p.get("brand") || "",
    gender: p.get("gender") || "",
    price: p.get("price") || "",
    page: parseInt(p.get("page") || "1", 10),
    highlight: p.get("highlight") || "",
  };
};
const pushState = (st) => {
  const s = new URLSearchParams();
  Object.entries(st).forEach(([k, v]) => {
    if (v && (k !== "page" || v > 1)) s.set(k, v);
  });
  history.replaceState(null, "", "?" + s.toString());
};
const applyFilters = (st) =>
  PRODUCTS.filter(
    (p) =>
      (!st.q || p.NameProduct.toLowerCase().includes(st.q.toLowerCase())) &&
      (!st.brand || p.Brand === st.brand) &&
      (!st.gender || p.Category === st.gender) &&
      (!st.price ||
        (p.Price >= Number(st.price.split("-")[0] || 0) &&
          p.Price <= Number(st.price.split("-")[1] || 1e9)))
  );

function render() {
  fillBrands();
  const st = stateFromURL();
  ["searchInput", "brandSelect", "genderSelect", "priceSelect"].forEach(
    (id) =>
      ($(id == "searchInput" ? `#${id}` : `#${id}`).value =
        st[id == "searchInput" ? "q" : id.toLowerCase()])
  );
  const f = applyFilters(st),
    tp = Math.max(1, Math.ceil(f.length / PER_PAGE));
  st.page = Math.min(st.page, tp);
  $("#grid").innerHTML = f
    .slice((st.page - 1) * PER_PAGE, st.page * PER_PAGE)
    .map((p) => {
      const { avg, count } = averageWithUser(p);
      return `<div class="col-6 col-md-3"><div id="${
        p.ProductId
      }" class="product-card h-100"><img class="product-thumb" src="${
        p.ImageUrl
      }" alt="${
        p.NameProduct
      }"><div class="card-overlay"><button class="btn btn-sm btn-outline-light pill" data-view="${
        p.ProductId
      }" data-bs-toggle="modal" data-bs-target="#productModal">Xem chi tiết sản phẩm <i class="bi bi-arrow-right"></i></button></div><div class="p-3"><div class="d-flex justify-content-between small mb-1"><span class="badge rounded-pill badge-tag">${
        p.Brand
      }</span><span class="small-muted">${
        p.Category
      }</span></div><div class="product-title mb-1">${
        p.NameProduct
      }</div><div class="d-flex align-items-center gap-1 mb-2"><span class="stars small">${starIcons(
        avg
      )}</span><span class="small text-secondary">(${count})</span></div><div class="d-flex justify-content-between align-items-center"><span class="price">${fmtPrice(
        p.Price
      )}</span><button class="btn btn-sm btn-gold" data-cart="${
        p.ProductId
      }" title="Thêm vào giỏ"><i class="bi bi-bag-plus"></i></button></div></div></div></div>`;
    })
    .join("");

  let html = "";
  const add = (p, t, d = false, a = false) =>
    (html += `<li class="page-item ${d ? "disabled" : ""} ${
      a ? "active" : ""
    }"><a class="page-link" href="#" data-page="${p}">${t}</a></li>`);
  add(st.page - 1, "&laquo;", st.page === 1);
  for (let i = 1; i <= tp; i++) add(i, i, false, i === st.page);
  add(st.page + 1, "&raquo;", st.page === tp);
  $("#pagination").innerHTML = html;
  st.highlight &&
    document
      .getElementById(st.highlight)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  pushState(st);
}

document.getElementById("searchInput").addEventListener("input", (e) => {
  const st = stateFromURL();
  st.q = e.target.value;
  st.page = 1;
  st.highlight = "";
  pushState(st);
  render();
});
["brandSelect", "genderSelect", "priceSelect"].forEach((id) =>
  $(id).addEventListener("change", (e) => {
    const st = stateFromURL();
    st[id.toLowerCase()] = e.target.value;
    st.page = 1;
    st.highlight = "";
    pushState(st);
    render();
  })
);
$("#pagination").addEventListener("click", (e) => {
  const a = e.target.closest("a.page-link");
  if (!a) return;
  e.preventDefault();
  const st = stateFromURL(),
    p = parseInt(a.dataset.page, 10);
  !isNaN(p) && ((st.page = p), (st.highlight = ""), pushState(st), render());
});
document.addEventListener("click", (e) => {
  const v = e.target.closest("[data-view]");
  v && openProductModal(v.dataset.view);
  const c = e.target.closest("[data-cart]");
  c &&
    PRODUCTS.find((p) => p.ProductId === c.dataset.cart) &&
    addToCart(
      PRODUCTS.find((p) => p.ProductId === c.dataset.cart),
      1
    );
});

const bsModal = new bootstrap.Modal($("#productModal"));
const PM = Object.fromEntries(
  [
    "title",
    "image",
    "thumb1",
    "thumb2",
    "brand",
    "gender",
    "price",
    "id",
    "stars",
    "stars_big",
    "score",
    "avg",
    "count",
    "desc",
    "detail",
    "reviews",
    "minus",
    "plus",
    "qty",
    "form",
  ].map((k) => [k, $(`#pm-${k}`)])
);

function openProductModal(id) {
  const p = PRODUCTS.find((x) => x.ProductId == id);
  if (!p) return;
  const { avg, count, user } = averageWithUser(p);
  PM.title.textContent = p.NameProduct;
  [PM.image, PM.thumb1, PM.thumb2].forEach((x) => (x.src = p.ImageUrl));
  PM.price.textContent = fmtPrice(p.Price);
  PM.id.textContent = p.ProductId;
  PM.stars.innerHTML = PM.stars_big.innerHTML = starIcons(avg);
  PM.score.textContent = PM.avg.textContent = `${avg.toFixed(1)}/5`;
  PM.count.textContent = count;
  PM.desc.textContent = "Hương thơm cân bằng, dễ dùng hằng ngày.";
  PM.detail.innerHTML = [
    "Hương đầu: cam bergamot – trái cây tươi.",
    "Hương giữa: hoa trắng/hồng – mịn và sâu.",
    "Hương cuối: gỗ – hổ phách – vani ấm áp.",
    "Độ lưu hương: 6–8 giờ • Độ toả: vừa – xa.",
  ]
    .map((li) => `<li>${li}</li>`)
    .join("");
  PM.reviews.innerHTML = user.length
    ? user
        .slice()
        .reverse()
        .map(
          (r) =>
            `<div class="review-item"><div class="d-flex align-items-center justify-content-between"><div class="fw-semibold">${(
              r.name || "Khách"
            ).replace(/</g, "&lt;")}</div><div class="stars">${starIcons(
              r.rating
            )}</div></div><div class="small text-secondary">${new Date(
              r.time
            ).toLocaleString()}</div><div class="mt-1">${(r.text || "").replace(
              /</g,
              "&lt;"
            )}</div></div>`
        )
        .join("")
    : '<div class="text-secondary small">Chưa có đánh giá</div>';
  bsModal.show();
}

// Modal qty + submit
PM.minus.addEventListener(
  "click",
  () => (PM.qty.value = Math.max(1, parseInt(PM.qty.value || 1, 10) - 1))
);
PM.plus.addEventListener(
  "click",
  () => (PM.qty.value = Math.min(99, parseInt(PM.qty.value || 1, 10) + 1))
);
$("#pm-addcart").addEventListener("click", () => {
  const p = PRODUCTS.find((x) => x.ProductId == PM.id.textContent),
    q = parseInt(PM.qty.value || 1, 10);
  p && q > 0 && addToCart(p, q);
});
PM.form.addEventListener("submit", (e) => {
  e.preventDefault();
  addUserReview(PM.id.textContent, {
    name: (rv_name.value || "").trim() || "Khách",
    rating: parseInt(rv_rating.value, 10),
    text: (rv_text.value || "").trim(),
    time: Date.now(),
  });
  rv_text.value = "";
  pm_toast.style.display = "block";
  setTimeout(() => (pm_toast.style.display = "none"), 1500);
  openProductModal(PM.id.textContent);
});

// Mini cart render + actions
async function renderCartUI() {
  const cart = await getCart(),
    tQty = cart.reduce((s, i) => s + i.Quantity, 0);
  $("#miniCartLabel").textContent = `🛒 Giỏ hàng (${tQty})`;
  const tMoney = cart.reduce((s, i) => s + i.Quantity * i.Price, 0),
    cc = $("#cartCount");
  cc.textContent = tQty;
  cc.style.display = tQty ? "inline-block" : "none";
  const box = $("#cartItems");
  box.innerHTML = !cart.length
    ? '<div class="text-secondary small">Giỏ hàng đang trống.</div>'
    : cart
        .map(
          (it) =>
            `<div class="list-group-item py-3"><div class="d-flex align-items-center"><img src="${
              it.ImageUrl
            }" class="cart-thumb me-3" alt="${
              it.NameProduct
            }"><div class="flex-grow-1"><div class="d-flex justify-content-between align-items-start"><div><div class="fw-semibold">${
              it.NameProduct
            }</div><div class="small text-secondary">Đơn giá: ${fmtPrice(
              it.Price
            )}</div><div class="small mt-1"><span class="badge bg-light text-dark">SL: <span data-qty-text="${
              it.ProductId
            }">${
              it.Quantity
            }</span></span></div></div><button class="btn btn-sm btn-outline-light" data-remove="${
              it.ProductId
            }" title="Xóa"><i class="bi bi-x-lg"></i></button></div><div class="d-flex align-items-center gap-2 mt-2"><div class="input-group input-group-sm" style="width:140px"><button class="btn btn-outline-gold" data-dec="${
              it.ProductId
            }" type="button">–</button><input class="form-control text-center" value="${
              it.Quantity
            }" disabled><button class="btn btn-gold" data-inc="${
              it.ProductId
            }" type="button">+</button></div><div class="ms-auto fw-semibold">${fmtPrice(
              it.Quantity * it.Price
            )}</div></div></div></div></div>`
        )
        .join("");
  $("#cartTotal").textContent = fmtPrice(tMoney);
}
$("#cartItems").addEventListener("click", async (e) => {
  const cart = await getCart(),
    idInc = e.target.closest("[data-inc]")?.dataset.inc,
    idDec = e.target.closest("[data-dec]")?.dataset.dec,
    idRem = e.target.closest("[data-remove]")?.dataset.remove;
  if (idInc) {
    const it = cart.find((x) => x.ProductId == idInc);
    it &&
      (it.Quantity++,
      await fetch(`http://localhost:3000/cart/update/${idInc}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Quantity: it.Quantity,
          UnitPrice: it.Quantity * it.Price,
        }),
      }),
      saveCart(cart));
  }
  if (idDec) {
    const it = cart.find((x) => x.ProductId == idDec);
    it &&
      ((it.Quantity = Math.max(1, it.Quantity - 1)),
      await fetch(`http://localhost:3000/cart/update/${idDec}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Quantity: it.Quantity, UnitPrice: it.Price }),
      }),
      saveCart(cart));
  }
  if (idRem) {
    const idx = cart.findIndex((x) => x.ProductId == idRem);
    idx > -1 &&
      (await fetch(`http://localhost:3000/cart/remove/${idRem}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      }),
      saveCart(cart));
  }
});
$("#btnClearCart").addEventListener("click", async () => {
  localStorage.removeItem("cart");
  await fetch("http://localhost:3000/cart/clear", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  renderCartUI();
});

// FAB drag
(function () {
  const fab = $(".cart-fab"),
    btn = $("#btnCartFab"),
    off = $("#offcart");
  if (!fab || !btn || !off) return;
  let d = false,
    m = false,
    sX = 0,
    sY = 0,
    oX = 0,
    oY = 0,
    pId = null;
  function onMove(e) {
    if (!d) return;
    const dx = e.clientX - sX,
      dy = e.clientY - sY;
    Math.abs(dx) > 5 || Math.abs(dy) > 5 ? (m = true) : null;
    if (!m) return;
    const x = e.clientX - oX,
      y = e.clientY - oY;
    fab.style.left = x + "px";
    fab.style.top = y + "px";
    fab.style.right = fab.style.bottom = "auto";
    fab.style.transform = "none";
    e.preventDefault();
  }
  function onUp(e) {
    if (!d) return;
    d = false;
    fab.classList.remove("dragging");
    try {
      pId !== null && btn.releasePointerCapture(pId);
    } catch {}
    pId = null;
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", onUp);
    document.removeEventListener("pointercancel", onUp);
    !m && bootstrap.Offcanvas.getOrCreateInstance(off).show();
    setTimeout(() => (m = false), 0);
  }
  btn.addEventListener("pointerdown", (e) => {
    d = true;
    m = false;
    fab.classList.add("dragging");
    pId = e.pointerId;
    try {
      btn.setPointerCapture(pId);
    } catch {}
    const r = fab.getBoundingClientRect();
    sX = e.clientX;
    sY = e.clientY;
    oX = sX - r.left;
    oY = sY - r.top;
    document.addEventListener("pointermove", onMove, { passive: false });
    document.addEventListener("pointerup", onUp, { passive: false });
    document.addEventListener("pointercancel", onUp, { passive: false });
  });
  btn.addEventListener("click", (e) => {
    d || m
      ? (e.preventDefault(), e.stopImmediatePropagation())
      : bootstrap.Offcanvas.getOrCreateInstance(off).show();
  });
})();

// Boot nav height
function setNavH() {
  const n = $(".navbar");
  if (!n) return;
  document.documentElement.style.setProperty(
    "--nav-h",
    (n.offsetHeight || 72) + "px"
  );
}
window.addEventListener("load", setNavH);
window.addEventListener("resize", setNavH);
document.fonts?.ready.then(setNavH);

// Thumbnails
(function () {
  const t1 = $("#pm-thumb1"),
    t2 = $("#pm-thumb2"),
    main = $("#pm-image");
  if (t1 && t2 && main) {
    [t1, t2].forEach((t) =>
      t.addEventListener("click", () => {
        main.src = t.src;
        [t1, t2].forEach((x) => x.classList.remove("active"));
        t.classList.add("active");
      })
    );
  }
})();

render();
renderCartUI();
