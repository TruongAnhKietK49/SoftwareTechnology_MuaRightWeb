const { getPool } = require("../../routes/config");
const sql = require("mssql");

// Hàm kiểm tra voucher
async function checkVoucher(voucherCode, customerId) {
  try {
    const pool = await getPool();

    // 1️⃣ Kiểm tra voucher tồn tại, còn hiệu lực và đang hoạt động
    const voucherQuery = `
      SELECT *
      FROM Voucher
      WHERE Code = @Code
        AND IsActive = 1
        AND (ValidFrom IS NULL OR ValidFrom <= SYSDATETIME())
        AND (ValidTo IS NULL OR ValidTo >= SYSDATETIME())
    `;

    const voucherResult = await pool
      .request()
      .input("Code", voucherCode)
      .query(voucherQuery);

    if (voucherResult.recordset.length === 0) {
      return { valid: false, message: "Voucher không hợp lệ hoặc đã hết hạn." };
    }

    const voucher = voucherResult.recordset[0];

    // 2️⃣ Kiểm tra xem khách hàng đã sử dụng voucher này chưa
    const usageQuery = `
      SELECT * FROM VoucherUsage
      WHERE VoucherId = @VoucherId AND CustomerId = @CustomerId
    `;

    const usageResult = await pool
      .request()
      .input("VoucherId", voucher.VoucherId)
      .input("CustomerId", customerId)
      .query(usageQuery);

    if (usageResult.recordset.length > 0) {
      return { valid: false, message: "Bạn đã sử dụng voucher này rồi." };
    }

    // 3️⃣ Nếu hợp lệ → trả về thông tin giảm giá
    return {
      valid: true,
      message: "Voucher hợp lệ.",
      discountType: voucher.DiscountType, // 'Percent' hoặc 'Fixed'
      discountVal: voucher.DiscountVal,
      minOrderAmount: voucher.MinOrderAmt || 0,
      voucherId: voucher.VoucherId,
    };
  } catch (error) {
    console.error("Lỗi khi kiểm tra voucher:", error);
    return { valid: false, message: "Đã xảy ra lỗi khi kiểm tra voucher." };
  }
}

// Hàm tạo hoá đơn
async function createInvoice(object) {
  const {
    customerId,
    shipAddress,
    shipPhone,
    items = [],
    shippingFee = 0,
    discountAmt = 0,
    totalAmount = 0,
    voucherId = null,
  } = object;

  if (!customerId || items.length === 0) {
    throw new Error("Thiếu dữ liệu khách hàng hoặc giỏ hàng rỗng.");
  }

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const subTotal = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    const orderRequest = new sql.Request(transaction);
    orderRequest.input("CustomerId", customerId);
    orderRequest.input("VoucherId", voucherId);
    orderRequest.input("ShipAddress", shipAddress);
    orderRequest.input("ShipPhone", shipPhone);
    orderRequest.input("SubTotal", subTotal);
    orderRequest.input("DiscountAmt", discountAmt);
    orderRequest.input("ShippingFee", shippingFee);
    orderRequest.input("TotalAmount", totalAmount);

    const orderResult = await orderRequest.query(`
      INSERT INTO OrderProduct 
      (CustomerId, VoucherId, ShipAddress, ShipPhone, SubTotal, DiscountAmt, ShippingFee, TotalAmount)
      OUTPUT INSERTED.OrderId
      VALUES (@CustomerId, @VoucherId, @ShipAddress, @ShipPhone, @SubTotal, @DiscountAmt, @ShippingFee, @TotalAmount)
    `);

    const orderId = orderResult.recordset[0].OrderId;

    for (const item of items) {
      const itemRequest = new sql.Request(transaction);
      itemRequest.input("OrderId", orderId);
      itemRequest.input("ProductId", item.productId);
      itemRequest.input("SellerId", item.sellerId);
      itemRequest.input("Quantity", item.quantity);
      itemRequest.input("UnitPrice", item.unitPrice);
      itemRequest.input("LineTotal", item.unitPrice * item.quantity);

      await itemRequest.query(`
        INSERT INTO OrderItem 
        (OrderId, ProductId, SellerId, Quantity, UnitPrice, LineTotal)
        VALUES (@OrderId, @ProductId, @SellerId, @Quantity, @UnitPrice, @LineTotal)
      `);
    }

    if (voucherId) {
      const voucherRequest = new sql.Request(transaction);
      voucherRequest.input("VoucherId", voucherId);
      voucherRequest.input("CustomerId", customerId);
      voucherRequest.input("OrderId", orderId);
      await voucherRequest.query(`
        INSERT INTO VoucherUsage (VoucherId, CustomerId, OrderId)
        VALUES (@VoucherId, @CustomerId, @OrderId)
      `);
    }

    // ✅ Xóa sản phẩm khỏi giỏ hàng sau khi đặt thành công
    for (const item of items) {
      const deleteReq = new sql.Request(transaction);
      deleteReq.input("CustomerId", customerId);
      deleteReq.input("ProductId", item.productId);
      await deleteReq.query(`
        DELETE FROM Basket WHERE CustomerId = @CustomerId AND ProductId = @ProductId
      `);
    }

    // 3️⃣ Cập nhật số tiền đã chi
    await new sql.Request(transaction)
      .input("CustomerId", sql.Int, customerId)
      .input("Spent", sql.Decimal(18, 2), totalAmount).query(`
      UPDATE CustomerProfile
      SET Balance = Balance + @Spent
      WHERE CustomerId = @CustomerId
    `);

    await transaction.commit();
    console.log("✅ Hoá đơn đã được tạo thành công:", orderId);

    return {
      success: true,
      message: "Tạo hoá đơn thành công.",
      orderId,
    };
  } catch (error) {
    console.error("❌ Lỗi khi tạo hoá đơn:", error);
    await transaction.rollback();
    return {
      success: false,
      message: error.message || "Lỗi khi tạo hoá đơn.",
    };
  }
}

module.exports = {
  checkVoucher,
  createInvoice,
};
