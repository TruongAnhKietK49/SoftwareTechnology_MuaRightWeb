const express = require("express");
const sql = require("mssql");
const cors = require("cors");

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

let poolPromise = null;
async function getPool() {
  if (!poolPromise) {
    poolPromise = sql
      .connect(config)
      .then((pool) => {
        console.log("✅ Kết nối SQL Server thành công!");
        return pool;
      })
      .catch((err) => {
        poolPromise = null; 
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

(async () => {
  try {
    await getPool();
    console.log("🚀 Server đã khởi động và kết nối thành công!");
  } catch (err) {
    console.error("❌ Không thể khởi động server:", err);
  }
})();

module.exports = {getPool, closePool}