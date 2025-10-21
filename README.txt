🤖Các gói gần tải
Dự án dùng HTML, CSS, BOOTSTRAP và xử lý backend bằng Node.JS + Express
Cài NodeJS (nếu chưa có)
Clone code từ Repository
Cài package.json (lệnh npm init -y)
Tiếp tục cài "npm install express mssql cors"
Kiểm tra bằng lệnh npm list express mssql cors

🎃Cấu hình config
Tiến hành chạy 'WebDatabase.sql' có trong public/DATA (Chạy bằng SQL Server Management hoặc mssql của VS Code)
  ⏩Create tất cả các bảng
Vào SQL Server Management Studio 2022 >> Security >> Login >> Chọn tài khoản sa.
-> Xem cấu hình config trong 'config.js' ở mục sql-backend/routes
Cấp quyền WebDB cho tài khoản sa, mật khẩu đặt '123'

📬Cách chạy project
Chạy 'databasePrototype.js' trong folder sql-backend (để tạo dự liệu mẫu)
Chạy file server.js trong sql-backend để RUN server
=>Thông báo kết nối thành công là được!
Có thể sử dụng web bình thường rồi..!

