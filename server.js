const express = require("express");
const sql = require("mssql");

const app = express();
app.use(express.json()); // để đọc body JSON

// ⚡ Cấu hình kết nối
const config = {
  user: "anhkiet",               // user SQL Server
  password: "123456",       // password
  server: "Henry\\SQLEXPRESS",      // hoặc "localhost\\SQLEXPRESS"
  port: 1433,               // cổng SQL
  database: "WebDB",   // tên DB
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

// ✅ Kết nối
sql.connect(config)
  .then(() => console.log("✅ Kết nối SQL Server thành công!"))
  .catch(err => console.error("❌ Lỗi kết nối:", err));

