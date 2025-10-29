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
<script>
    // ✅ CẤU HÌNH API
    const API_BASE = 'http://localhost:3000/api/shipper'; 
    const LOGOUT_REDIRECT_URL = '../../template/pages/signIn_page.html'; // Kiểm tra đường dẫn này!
    
    // ✅ HÀM GET SHIPPER ID
    function getShipperId() {
        const raw = localStorage.getItem('account');
        if (!raw) return null;
        try {
            const acc = JSON.parse(raw);
            const id = Number(acc?.AccountId ?? acc?.ShipperId); 
            return Number.isFinite(id) && id > 0 ? id : null;
        } catch { return null; }
    }
    const shipperId = getShipperId();
    if (!shipperId) {
        // Nếu không có ID, chuyển hướng về đăng nhập
        location.href = LOGOUT_REDIRECT_URL; 
    }

    // ✅ HÀM XÁC ĐỊNH ICON PHƯƠNG TIỆN (Copy từ profileShipper.js)
    function vehicleIconClass(v) {
        const s = (v || '').toLowerCase();
        if (s.includes('ô tô') || s.includes('car')) return 'bi bi-car-front-fill text-danger';
        if (s.includes('tải') || s.includes('truck')) return 'bi bi-truck-front-fill text-warning';
        return 'bi bi-motorcycle text-info';
    }

    // ✅ HÀM GỌI API LẤY PROFILE
    async function httpGetProfile() {
        const res = await fetch(`${API_BASE}/profile/${shipperId}`);
        const json = await res.json();
        if (!res.ok || !json?.success) throw new Error(json?.message || res.statusText);
        return json.profile;
    }

    // ✅ HÀM RENDER PROFILE LÊN HEADER
    function renderHeader(p) {
        const navName = document.getElementById('nav-shipper-name');
        const navAvatar = document.getElementById('nav-shipper-avatar');
        const vehicleIcon = document.getElementById('vehicle-icon-nav');
        
        // Cập nhật Tên, Avatar
        if (navName) navName.textContent = `Hi, ${p.FullName || p.Username || '—'}`;
        if (navAvatar) navAvatar.src = p.ImageUrl || '../../img/image 11.png';
        
        // Cập nhật ICON PHƯƠNG TIỆN
        if (vehicleIcon) vehicleIcon.innerHTML = `<i class="${vehicleIconClass(p.VehicleInfo)}" style="font-size:1.5rem"></i>`;
    }

    // ✅ LOGIC CHÍNH: CHẠY KHI TẢI TRANG
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            const profile = await httpGetProfile();
            renderHeader(profile);
            
            // LOGIC CHO NÚT ĐĂNG XUẤT
            const btnLogout = document.getElementById('logout-btn');
            if (btnLogout) {
                btnLogout.addEventListener('click', async () => {
                    // Gọi API logout (tuỳ chọn, chỉ cần cho session/token)
                    fetch(`${API_BASE}/logout`, { method: 'POST' }).catch(() => {});
                    
                    // Xóa localStorage và chuyển hướng
                    localStorage.removeItem('account'); // Xóa key chính
                    
                    // Xóa các key khác (nếu có, giống logic trong profileShipper.js)
                    ['shipperToken','shipperId','shipperUsername','shipperFullName','shipperEmail','shipperAvatar']
                        .forEach(k => localStorage.removeItem(k));
                    
                    setTimeout(() => location.href = LOGOUT_REDIRECT_URL, 100); 
                });
            }
        } catch (e) {
            console.error('Lỗi tải header/profile:', e);
            // Nếu lỗi nặng (401/404), có thể chuyển hướng về đăng nhập
        }
    });
</script>

