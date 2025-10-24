const express = require("express");
const sql = require("mssql");
const { getPool } = require("./config");

const router = express.Router();

router.get("/profile/:CustomerId", async (req, res) => {
  const pool = await getPool();
  const CustomerId = req.params.CustomerId;

  try {
    const result = await pool.request()
      .input("CustomerId", sql.Int, CustomerId)
      .query(`
        SELECT 
          a.AccountId,
          a.Username,
          a.Email,
          a.Phone,
          a.Role,
          a.ImageUrl,
          c.FullName,
          c.Address,
          c.Birthday,
          c.Gender,
          c.Balance
        FROM Account a
        LEFT JOIN CustomerProfile c ON a.AccountId = c.CustomerId
        WHERE a.AccountId = @CustomerId;
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin người dùng:", error);
    res.status(500).json({ message: "Lỗi server khi lấy thông tin người dùng" });
  }
});

router.put("/profile/:CustomerId", async (req, res) => {
  const pool = await getPool();
  const accountId = req.params.CustomerId;
  try {
  const {
    Email,
    Phone,
    ImageUrl, 
    FullName,
    Address,
    Birthday,
    Gender,
    PasswordHash
    } = req.body;

    // Cập nhật bảng Account
  const reqAcc = pool.request();
  reqAcc.input("AccountId", accountId);
  reqAcc.input("Email", Email);
  reqAcc.input("Phone", Phone);
  reqAcc.input("ImageUrl", ImageUrl);
  if (PasswordHash && PasswordHash.trim() !== "")
    reqAcc.input("PasswordHash", PasswordHash);

  await reqAcc.query(`
    UPDATE Account
    SET Email=@Email, Phone=@Phone, ImageUrl=@ImageUrl
        ${
          PasswordHash && PasswordHash.trim() !== ""
            ? ", PasswordHash=@PasswordHash"
            : ""
        }
    WHERE AccountId=@AccountId
  `);

  // Cập nhật bảng AdminProfile
  const reqProf = pool.request();
  reqProf.input("CustomerId", accountId);
  reqProf.input("FullName", FullName);
  reqProf.input("Birthday", Birthday);
  reqProf.input("Gender", Gender);
  reqProf.input("Address", Address);

  await reqProf.query(`
    MERGE CustomerProfile AS target
    USING (SELECT @CustomerId AS CustomerId) AS source
    ON target.CustomerId = source.CustomerId
    WHEN MATCHED THEN
      UPDATE SET FullName=@FullName, Birthday=@Birthday, Gender=@Gender, Address=@Address
    WHEN NOT MATCHED THEN
      INSERT (CustomerId, FullName, Birthday, Gender, Address)
      VALUES (@CustomerId, @FullName, @Birthday, @Gender, @Address);
  `);

  } catch (error) {
    console.error("Lỗi khi cập nhật thông tin người dùng:", error);
    res.status(500).json({ message: "Lỗi server khi cập nhật thông tin người dùng" });
  }
    res.json({ message: "Cập nhật thông tin người dùng thành công" });
});
module.exports = router;
