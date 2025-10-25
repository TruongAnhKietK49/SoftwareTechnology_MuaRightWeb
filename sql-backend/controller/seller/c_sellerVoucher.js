const voucherModel = require("../../models/seller/m_voucher");

async function getVouchers(sellerId) {
    if (isNaN(sellerId)) throw new Error("Seller ID không hợp lệ.");
    return await voucherModel.getVouchersBySeller(sellerId);
}

async function addVoucher(voucherData) {
    if (!voucherData.Code || !voucherData.DiscountType || !voucherData.DiscountVal) {
        throw new Error("Thiếu thông tin voucher quan trọng.");
    }
    const result = await voucherModel.addVoucher(voucherData);
    if (!result) throw new Error("Tạo voucher không thành công.");
    return { success: true, message: "Tạo voucher thành công!" };
}

async function updateVoucher(voucherId, sellerId, voucherData) {
    if (isNaN(voucherId) || isNaN(sellerId)) throw new Error("ID không hợp lệ.");
    const success = await voucherModel.updateVoucherById(voucherId, sellerId, voucherData);
    if (!success) throw new Error("Không tìm thấy voucher để cập nhật hoặc bạn không có quyền thực hiện hành động này.");
    return { success: true, message: "Cập nhật voucher thành công!" };
}

async function deleteVoucher(voucherId, sellerId) {
    if (isNaN(voucherId) || isNaN(sellerId)) throw new Error("ID không hợp lệ.");
    const success = await voucherModel.deleteVoucherById(voucherId, sellerId);
    if (!success) throw new Error("Không tìm thấy voucher để xóa hoặc bạn không có quyền thực hiện hành động này.");
    return { success: true, message: "Đã xóa voucher thành công!" };
}

module.exports = {
    getVouchers,
    addVoucher,
    updateVoucher,
    deleteVoucher,
};