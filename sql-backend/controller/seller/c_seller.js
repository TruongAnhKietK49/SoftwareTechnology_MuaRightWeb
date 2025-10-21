// sql-backend/controller/seller/c_seller.js
const fs = require("fs");
const path = require("path");

async function pendingProduct() {
  try {
    // Đọc file JSON chứa sản phẩm
    const dataPath = path.join(
      __dirname,
      "../../../public/DATA/product_warehouse.json"
    );
    const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

    // Gửi toàn bộ sản phẩm lên server admin
    const response = await fetch("http://localhost:3000/seller/pendingProducts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    console.log("✅ Đã gửi sản phẩm chờ duyệt thành công!");
  } catch (error) {
    console.error("💥 Lỗi trong quá trình gửi sản phẩm:", error);
  }
}

