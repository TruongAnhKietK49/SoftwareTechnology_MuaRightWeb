// server.js
const express = require("express");
const sql = require("mssql");
const cors = require("cors");

const app = express();
app.use(cors());


const config = {
  server: "localhost", // Mặc định sẽ là localhost
  database: "WebDB", // Tên database
  user: "sa", // Tên user có sẵn trong SQL Server
  password: "123", // Đổi mật khẩu giống là được
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

app.get("/admin/accounts", async (req, res)=> {
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT AccountId, Username, Email, Phone, Role, State FROM Account");
    res.json(result.recordset);
  } catch (err) {
    console.error("Lỗi khi lấy tài khoản:", err);
    res.status(500).send("Lỗi server");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});

let poolPromise = null;

// Trả về một pool đã kết nối (tái sử dụng cùng 1 connection)
async function getPool() {
  if (!poolPromise) {
    poolPromise = sql
      .connect(config)
      .then((pool) => {
        console.log("✅ Kết nối SQL Server thành công!");
        return pool;
      })
      .catch((err) => {
        poolPromise = null; // reset nếu lỗi để lần sau thử lại
        console.error("❌ Lỗi khi kết nối SQL Server:", err);
        throw err;
      });
  }
  return poolPromise;
}

async function closePool() {
  try {
    await sql.close();
    poolPromise = null;
    console.log("🔒 Đóng kết nối SQL Server.");
  } catch (err) {
    console.error("Lỗi khi đóng pool:", err);
  }
}

// tidy up on exit
process.on("SIGINT", async () => {
  await closePool();
  process.exit(0);
});

// Khởi động server và kết nối đến SQL Server
(async () => {
  try {
    await getPool();
    console.log("🚀 Server đã khởi động và kết nối thành công!");
  } catch (err) {
    console.error("❌ Không thể khởi động server:", err);
  }
})();

module.exports = { sql, getPool, closePool };
