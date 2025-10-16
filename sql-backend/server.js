const { getPool, closePool } = require("./routes/config");
const { insertUser } = require("./models/m_signUp");

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get("/admin/accounts", async (req, res) => {
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

app.post("/api/signup", async (req, res) => {
  try {
    const dataUser = req.body;
    console.log("Nhận dữ liệu từ client:", dataUser);

    // Gọi hàm insertUser trong models
    await insertUser(dataUser);

    res.status(201).json({ message: "Đăng ký thành công!" });
  } catch (err) {
    console.error("Lỗi khi đăng ký:", err);
    res.status(500).json({ message: "Đăng ký thất bại!" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});
