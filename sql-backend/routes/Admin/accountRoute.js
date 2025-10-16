const { getPool, closePool } = require("../config");
const express = require("express");
const router = express.Router();

router.get("/accounts", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .query(
        "SELECT AccountId, Username, Email, Phone, Role, State, ImageUrl FROM Account"
      );
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
  const { Email, Phone, State } = req.body;

  try {
    const pool = await getPool();

    // Kiểm tra tài khoản có tồn tại không
    const check = await pool
      .request()
      .query(`SELECT * FROM Account WHERE Username = N'${username}'`);

    if (check.recordset.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy tài khoản!" });
    }

    // Thực hiện cập nhật
    const result = await pool.request().query(`
      UPDATE Account
      SET 
        Email = N'${Email}',
        Phone = N'${Phone}',
        State = N'${State}'
      WHERE Username = N'${username}'
    `);

    if (result.rowsAffected[0] > 0) {
      console.log(`✅ Đã cập nhật tài khoản: ${username}`);
      res.json({ success: true, message: "Cập nhật tài khoản thành công!" });
    } else {
      res
        .status(400)
        .json({
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

module.exports = router;
