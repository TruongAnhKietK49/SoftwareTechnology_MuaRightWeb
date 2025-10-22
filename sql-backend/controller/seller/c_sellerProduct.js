const productModel = require("../../models/seller/m_product");

async function getProducts(sellerId) {
    if (isNaN(sellerId)) throw new Error("Seller ID không hợp lệ.");
    return await productModel.getProductsBySeller(sellerId);
}

async function updateProduct(productId, productData) {
    if (isNaN(productId)) throw new Error("Product ID không hợp lệ.");
    const success = await productModel.updateProductById(productId, productData);
    if (!success) throw new Error("Không tìm thấy sản phẩm để cập nhật hoặc sản phẩm đang chờ duyệt.");
    return { success: true, message: "Cập nhật sản phẩm thành công!" };
}

async function deleteProduct(productId) {
    if (isNaN(productId)) throw new Error("Product ID không hợp lệ.");
    const success = await productModel.deleteProductById(productId);
    if (!success) throw new Error("Không tìm thấy sản phẩm để xóa.");
    return { success: true, message: "Đã xóa sản phẩm thành công!" };
}

module.exports = {
    getProducts,
    updateProduct,
    deleteProduct,
};