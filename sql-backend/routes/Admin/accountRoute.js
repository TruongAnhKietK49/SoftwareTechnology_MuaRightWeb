const sql = require("mssql");
const { getPool, closePool } = require("../config");
const express = require("express");
const router = express.Router();

// Lấy thông tin tài khoản trên SQL
router.get("/accounts", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
        SELECT AccountId, Username, Email, PasswordHash, Phone, Role, State, ImageUrl 
        FROM Account
        WHERE Role <> 'Admin'
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error("Lỗi khi lấy tài khoản:", err);
    res.status(500).send("Lỗi server");
  }
});

// 🧩 Xóa tài khoản theo Username (xử lý toàn bộ khóa ngoại an toàn)
router.delete("/accounts/:username", async (req, res) => {
  const username = req.params.username;

  try {
    const pool = await getPool();

    // 🔍 1️⃣ Lấy thông tin tài khoản
    const accResult = await pool
      .request()
      .query(
        `SELECT AccountId, Role FROM Account WHERE Username = N'${username}'`
      );

    if (accResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài khoản!",
      });
    }

    const { AccountId, Role } = accResult.recordset[0];

    console.log(`🧾 Bắt đầu xóa tài khoản ${username} (${Role})`);

    // ============================
    // 2️⃣ Xử lý từng Role riêng
    // ============================

    // --- CUSTOMER ---
    if (Role === "Customer") {
      await pool.request().query(`
        -- Xóa các order items của đơn hàng của customer
        DELETE FROM OrderItem
        WHERE OrderId IN (SELECT OrderId FROM OrderProduct WHERE CustomerId = ${AccountId});

        -- Xóa voucher usage
        DELETE FROM VoucherUsage WHERE CustomerId = ${AccountId};

        -- Xóa order
        DELETE FROM OrderProduct WHERE CustomerId = ${AccountId};

        -- Xóa basket
        DELETE FROM Basket WHERE CustomerId = ${AccountId};

        -- Xóa review
        DELETE FROM Review WHERE CustomerId = ${AccountId};

        -- Xóa profile
        DELETE FROM CustomerProfile WHERE CustomerId = ${AccountId};
      `);
    }

    // --- SELLER ---
    else if (Role === "Seller") {
      await pool.request().query(`
    -- Xóa review của sản phẩm do seller tạo
    DELETE FROM Review 
    WHERE ProductId IN (SELECT ProductId FROM Product WHERE SellerId = ${AccountId});

    -- Xóa order item chứa sản phẩm của seller
    DELETE FROM OrderItem 
    WHERE ProductId IN (SELECT ProductId FROM Product WHERE SellerId = ${AccountId});

    -- ⚠️ Xóa order item có SellerId trỏ trực tiếp đến seller này
    DELETE FROM OrderItem WHERE SellerId = ${AccountId};

    -- Xóa voucher do seller tạo
    DELETE FROM Voucher WHERE CreatedBySeller = ${AccountId};

    -- ⚠️ Xóa các sản phẩm trong giỏ hàng trước khi xóa Product
    DELETE FROM Basket 
    WHERE ProductId IN (SELECT ProductId FROM Product WHERE SellerId = ${AccountId});

    -- Xóa sản phẩm
    DELETE FROM Product WHERE SellerId = ${AccountId};

    -- Xóa profile
    DELETE FROM SellerProfile WHERE SellerId = ${AccountId};
  `);

      // 🧩 4️⃣ Xóa sản phẩm chờ duyệt của Seller trong pendingProducts.json
      const fs = require("fs");
      const path = require("path");

      const filePath = path.join(
        __dirname,
        "../../../public/DATA/pendingProducts.json"
      );

      try {
        if (fs.existsSync(filePath)) {
          const data = fs.readFileSync(filePath, "utf8");
          let products = JSON.parse(data);

          // ✅ Ép kiểu về number để so sánh chính xác
          const sellerIdNum = Number(AccountId);

          // ✅ Lọc ra sản phẩm của seller bị xóa (để đếm trước)
          const deletedItems = products.filter(
            (p) => Number(p.SellerId) === sellerIdNum
          );

          // ✅ Giữ lại sản phẩm của các seller khác
          const newProducts = products.filter(
            (p) => Number(p.SellerId) !== sellerIdNum
          );

          // ✅ Ghi lại file JSON
          fs.writeFileSync(
            filePath,
            JSON.stringify(newProducts, null, 2),
            "utf8"
          );

          console.log(
            `🗑️ Đã xóa ${deletedItems.length} sản phẩm chờ duyệt của seller ${username} (ID: ${AccountId})`
          );
        } else {
          console.warn(
            "⚠️ File pendingProducts.json không tồn tại, bỏ qua bước xóa."
          );
        }
      } catch (fileErr) {
        console.error("❌ Lỗi khi cập nhật pendingProducts.json:", fileErr);
      }
    }

    // --- SHIPPER ---
    else if (Role === "Shipper") {
      await pool.request().query(`
        -- Hủy gán shipper trong các đơn hàng trước khi xóa
        UPDATE OrderProduct SET ShipperId = NULL WHERE ShipperId = ${AccountId};

        -- Xóa profile
        DELETE FROM ShipperProfile WHERE ShipperId = ${AccountId};
      `);
    }

    // --- ADMIN ---
    else if (Role === "Admin") {
      await pool.request().query(`
        -- Xóa voucher admin tạo
        DELETE FROM Voucher WHERE CreatedByAdmin = ${AccountId};

        -- Xóa profile
        DELETE FROM AdminProfile WHERE AdminId = ${AccountId};
      `);
    }

    // ============================
    // 3️⃣ Cuối cùng xóa Account
    // ============================
    await pool.request().query(`
      DELETE FROM Account WHERE AccountId = ${AccountId};
    `);

    console.log(
      `✅ Đã xóa tài khoản và dữ liệu liên quan của ${username} (${Role})`
    );

    res.json({
      success: true,
      message: `Đã xóa tài khoản ${username} (${Role}) và toàn bộ dữ liệu liên quan.`,
    });
  } catch (err) {
    console.error("❌ Lỗi khi xóa tài khoản:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa tài khoản.",
    });
  }
});

// Cập nhật thông tin tài khoản
router.put("/accounts/:username", async (req, res) => {
  const username = req.params.username;
  const { Email, Phone, PasswordHash, State } = req.body;

  try {
    const pool = await getPool();

    // Kiểm tra tài khoản tồn tại
    const check = await pool
      .request()
      .input("username", sql.NVarChar, username)
      .query(`SELECT * FROM Account WHERE Username = @username`);

    if (check.recordset.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy tài khoản!" });
    }

    // Build dynamic update: chỉ thêm những cột client thực sự muốn cập nhật
    const fields = [];
    const request = pool.request();

    request.input("username", sql.NVarChar, username);

    if (req.body.hasOwnProperty("Email")) {
      fields.push("Email = @Email");
      request.input("Email", sql.NVarChar, Email);
    }

    if (req.body.hasOwnProperty("Phone")) {
      fields.push("Phone = @Phone");
      request.input("Phone", sql.NVarChar, Phone);
    }

    if (
      req.body.hasOwnProperty("PasswordHash") &&
      PasswordHash !== undefined &&
      String(PasswordHash).trim() !== ""
    ) {
      fields.push("PasswordHash = @PasswordHash");
      request.input("PasswordHash", sql.NVarChar, PasswordHash);
    }

    if (req.body.hasOwnProperty("State")) {
      fields.push("State = @State");
      request.input("State", sql.NVarChar, State);
    }

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Không có trường hợp lệ nào để cập nhật.",
      });
    }

    const updateQuery = `
      UPDATE Account
      SET ${fields.join(", ")}
      WHERE Username = @username
    `;

    const result = await request.query(updateQuery);

    if (result.rowsAffected[0] > 0) {
      console.log(`✅ Đã cập nhật tài khoản: ${username}`);
      res.json({ success: true, message: "Cập nhật tài khoản thành công!" });
    } else {
      res.status(400).json({
        success: false,
        message: "Không có thay đổi nào được áp dụng!",
      });
    }
  } catch (err) {
    console.error("❌ Lỗi khi cập nhật tài khoản:", err);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server khi cập nhật tài khoản." });
  }
});

// Thêm tài khoản mới
router.post("/accounts", async (req, res) => {
  const { Username, Email, Phone, PasswordHash, Role } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!Username || !Email || !PasswordHash || !Role) {
    return res.status(400).json({
      success: false,
      message: "Thiếu thông tin cần thiết (Username, Email, Password, Role)",
    });
  }

  try {
    const pool = await getPool();

    // Kiểm tra trùng Username hoặc Email
    const check = await pool
      .request()
      .input("Username", sql.NVarChar, Username)
      .input("Email", sql.NVarChar, Email)
      .input("Phone", sql.NVarChar, Phone)
      .query(
        "SELECT * FROM Account WHERE Username = @Username OR Email = @Email OR Phone = @Phone"
      );

    if (check.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Username hoặc Email hoặc Phone đã tồn tại!",
      });
    }

    // Thêm tài khoản mới
    await pool
      .request()
      .input("Username", sql.NVarChar, Username)
      .input("Email", sql.NVarChar, Email)
      .input("Phone", sql.NVarChar, Phone || "")
      .input("PasswordHash", sql.NVarChar, PasswordHash)
      .input("Role", sql.NVarChar, Role)
      .input("State", sql.NVarChar, "Active")
      .input("ImageUrl", sql.NVarChar, "").query(`
        INSERT INTO Account (Username, Email, Phone, PasswordHash, Role, State, ImageUrl)
        VALUES (@Username, @Email, @Phone, @PasswordHash, @Role, @State, @ImageUrl)
      `);

    console.log(`✅ Đã thêm tài khoản mới: ${Username}`);
    res.json({ success: true, message: "Thêm tài khoản thành công!" });
  } catch (err) {
    console.error("❌ Lỗi khi thêm tài khoản:", err);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server khi thêm tài khoản." });
  }
});

module.exports = router;
