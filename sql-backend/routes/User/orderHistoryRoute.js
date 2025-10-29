const express = require("express");
const router = express.Router();
const { getPool } = require("../config");

// 📦 API lấy lịch sử đơn hàng theo CustomerId
router.get("/order-history/:CustomerId", async (req, res) => {
  const pool = await getPool();
  const CustomerId = req.params.CustomerId;

  try {
    // 1️⃣ Lấy danh sách đơn hàng
    const ordersQuery = `
      SELECT 
        op.OrderId,
        op.OrderDate,
        op.State,
        op.ShipAddress,
        op.ShipPhone,
        op.SubTotal,
        op.DiscountAmt,
        op.ShippingFee,
        op.TotalAmount,
        op.VoucherId
      FROM OrderProduct op
      WHERE op.CustomerId = @CustomerId
      ORDER BY op.OrderDate DESC
    `;
    const ordersResult = await pool
      .request()
      .input("CustomerId", CustomerId)
      .query(ordersQuery);

    const orders = ordersResult.recordset;

    if (orders.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // 2️⃣ Lấy tất cả item theo danh sách OrderId
    const orderIds = orders.map((o) => o.OrderId);
    const itemsQuery = `
      SELECT 
        oi.OrderId,
        oi.ProductId,
        p.NameProduct AS ProductName,
        oi.Quantity,
        oi.UnitPrice,
        oi.LineTotal,
        s.FullName AS SellerName,
        p.ImageUrl
      FROM OrderItem oi
      JOIN Product p ON oi.ProductId = p.ProductId
      JOIN SellerProfile s ON oi.SellerId = s.SellerId
      WHERE oi.OrderId IN (${orderIds.join(",")})
    `;
    const itemsResult = await pool.request().query(itemsQuery);

    // 3️⃣ Gom nhóm item theo từng đơn
    const itemsByOrder = {};
    for (const item of itemsResult.recordset) {
      if (!itemsByOrder[item.OrderId]) itemsByOrder[item.OrderId] = [];
      itemsByOrder[item.OrderId].push(item);
    }

    // 4️⃣ Gắn items vào từng đơn hàng
    const data = orders.map((order) => ({
      ...order,
      items: itemsByOrder[order.OrderId] || [],
    }));

    // ✅ Trả về kết quả
    res.json({ success: true, data });
  } catch (err) {
    console.error("Error fetching order history:", err);
    res.status(500).json({ success: false, message: "Lỗi server." });
  }
});

// Hàm huỷ đơn hàng
router.post("/cancel-order/:OrderId", async (req, res) => {
  const pool = await getPool();
  const OrderId = req.params.OrderId;

  const transaction = pool.transaction();

  try {
    await transaction.begin();

    // 1️⃣ Lấy thông tin khách hàng & tổng tiền của đơn hàng
    const getOrderQuery = `
      SELECT CustomerId, TotalAmount
      FROM OrderProduct
      WHERE OrderId = @OrderId AND State != 'Cancelled';
    `;

    const orderResult = await transaction
      .request()
      .input("OrderId", OrderId)
      .query(getOrderQuery);

    if (orderResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng hoặc đơn đã bị hủy.",
      });
    }

    const { CustomerId, TotalAmount } = orderResult.recordset[0];

    // 2️⃣ Cập nhật trạng thái đơn hàng → Cancelled
    const cancelQuery = `
      UPDATE OrderProduct
      SET State = 'Cancelled', UpdatedAt = SYSUTCDATETIME()
      WHERE OrderId = @OrderId;
    `;

    await transaction.request().input("OrderId", OrderId).query(cancelQuery);

    // 3️⃣ Trừ lại số tiền khỏi Balance của khách hàng
    const updateBalanceQuery = `
       UPDATE CustomerProfile
        SET Balance = CASE 
                        WHEN Balance - @TotalAmount < 0 THEN 0 
                        ELSE Balance - @TotalAmount 
                      END
        WHERE CustomerId = @CustomerId;
    `;

    await transaction
      .request()
      .input("CustomerId", CustomerId)
      .input("TotalAmount", TotalAmount)
      .query(updateBalanceQuery);

    await transaction.commit();

    res.json({
      success: true,
      message: "Đơn hàng đã được hủy và số tiền đã được cập nhật.",
    });
  } catch (err) {
    await transaction.rollback();
    console.error("Error canceling order:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi hủy đơn hàng.",
    });
  }
});

module.exports = router;
