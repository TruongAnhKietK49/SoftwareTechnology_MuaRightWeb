const voucherModel = require("../../models/seller/m_voucher");

const MIN_FIXED_DISCOUNT = 1000;
function validateVoucherData(voucherData) {
    const { Code, DiscountType, DiscountVal, MinOrderAmt, ValidFrom, ValidTo } = voucherData;

    if (!Code || !DiscountType || !DiscountVal || !ValidFrom || !ValidTo) {
        throw new Error("Vui lòng điền đầy đủ các trường bắt buộc (*).");
    }
    
    if (new Date(ValidFrom) >= new Date(ValidTo)) {
        throw new Error("Ngày bắt đầu phải trước ngày hết hạn.");
    }

    const discountValue = parseFloat(DiscountVal);
    if (DiscountType === 'Percent') {
        if (discountValue <= 0 || discountValue > 100) {
            throw new Error('Giá trị giảm theo % phải lớn hơn 0 và không quá 100.');
        }
    } else if (DiscountType === 'Fixed') {
        if (discountValue < MIN_FIXED_DISCOUNT) {
            throw new Error(`Giá trị giảm theo số tiền phải ít nhất là ${MIN_FIXED_DISCOUNT.toLocaleString('vi-VN')} VNĐ.`);
        }
        const minOrderAmount = parseFloat(MinOrderAmt);
        if (minOrderAmount && discountValue > minOrderAmount) {
            throw new Error('Số tiền giảm không được lớn hơn giá trị đơn hàng tối thiểu.');
        }
    } else {
        throw new Error('Loại giảm giá không hợp lệ.');
    }
}


async function getVouchers(sellerId) {
    if (isNaN(sellerId)) throw new Error("Seller ID không hợp lệ.");
    return await voucherModel.getVouchersBySeller(sellerId);
}

async function addVoucher(voucherData) {
    validateVoucherData(voucherData); 

    const result = await voucherModel.addVoucher(voucherData);
    if (!result) throw new Error("Tạo voucher không thành công trong CSDL.");
    return { success: true, message: "Tạo voucher thành công!" };
}

async function updateVoucher(voucherId, sellerId, voucherData) {
    if (isNaN(voucherId) || isNaN(sellerId)) throw new Error("ID không hợp lệ.");

    validateVoucherData(voucherData);

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