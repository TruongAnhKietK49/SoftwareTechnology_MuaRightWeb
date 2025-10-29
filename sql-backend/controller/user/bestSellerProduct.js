async function getBestSeller() {
    try {
        const res = await fetch("http://localhost:3000/products/bestSeller");
        const data = await res.json();

        const productList = data.recordset || data.recordsets?.[0] || [];

        if (!productList.length) {
            alert("Không có sản phẩm bán chạy nào!");
        }

        return productList;
    } catch (error) {
        console.error("Lỗi khi lấy sản phẩm:", error);
        alert("Không thể tải sản phẩm!");
        return [];
    }
}

const tab1 = document.getElementById("carousel-item-tab1");
const tab2 = document.getElementById("carousel-item-tab2");

function renderBestSeller(productList) {
    tab1.innerHTML = '';
    tab2.innerHTML = '';
    let i = 0;
    productList.forEach(p => {
        const item = 
        `
        <div class="col-6 col-md-3">
            <div class="product-card h-100">
                <img src="${p.ImageUrl}" alt="${p.NameProduct}">
                <div class="product-body">
                <div class="product-title">${p.NameProduct}</div>
                <div class="product-meta">${p.TagName}</div>
                <div class="mt-auto d-flex justify-content-between align-items-center">
                    <div class="product-price">$${p.Price}</div>
                    <a href="./views/user/Product_Page.html" class="btn btn-sm btn-outline-light rounded-pill">Mua</a>
                </div>
                </div>
            </div>
            </div>
        `;
        console.log(item);
        if (i<5)
            tab1.innerHTML+= item;
        else 
            tab2.innerHTML+= item;
        i++;
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    const productList = await getBestSeller();
    console.log(productList);
    renderBestSeller(productList);
})