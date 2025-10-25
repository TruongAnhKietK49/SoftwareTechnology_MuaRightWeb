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

// Xóa tài khoản theo Username
router.delete("/accounts/:username", async (req, res) => {
  const username = req.params.username;

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .query(`DELETE FROM Account WHERE Username = N'${username}'`);

    if (result.rowsAffected[0] > 0) {
      console.log(`✅ Đã xóa tài khoản: ${username}`);
      res.json({ success: true, message: "Xóa tài khoản thành công!" });
    } else {
      res
        .status(404)
        .json({ success: false, message: "Không tìm thấy tài khoản!" });
    }
  } catch (err) {
    console.error("❌ Lỗi khi xóa tài khoản:", err);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server khi xóa tài khoản." });
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
