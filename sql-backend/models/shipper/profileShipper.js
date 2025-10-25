/* ====== CONFIG ====== */
const API_BASE = 'http://localhost:3000/api/shipper';
function getShipperId() {
  const raw = localStorage.getItem('account');
  if (!raw) return null;
  try {
    const acc = JSON.parse(raw);
    const id = Number(acc?.AccountId ?? acc?.ShipperId);
    return Number.isFinite(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}
const shipperId = getShipperId();

/* ====== DOM ====== */
const $ = (sel) => document.querySelector(sel);
const navName = $('#nav-shipper-name');
const navAvatar = $('#nav-shipper-avatar');
const vehicleIcon = $('#vehicle-icon-nav');

const nameDisp = $('#shipper-name-display');
const idDisp = $('#shipper-id-display');
const ratingDisp = $('#shipper-rating');
const deliveredDisp = $('#shipper-delivered-count');
const regionDisp = $('#shipper-region-display');
const vehicleDisp = $('#shipper-vehicle-display');

const usernameEl = $('#shipper-username');
const emailEl = $('#shipper-email');
const phoneEl = $('#shipper-phone');
const addressEl = $('#shipper-address');
const statusEl = $('#shipper-status');

const fullNameEl = $('#shipper-fullName');
const birthdayEl = $('#shipper-birthday');
const genderEl = $('#shipper-gender');
const licenseEl = $('#shipper-license-no-full');
const vehicleInfoEl = $('#shipper-vehicle-info-full');

const avatarMain = $('#shipper-avatar');

// Modal controls
const modalAvatarPreview = $('#modal-avatar-preview');
const avatarInput = $('#avatarInput'); // (nếu còn giữ upload file)
const btnChangeAvatar = avatarInput?.nextElementSibling;
const saveBtn = $('#saveProfileBtn');

// Modal fields
const fFullName = $('#modal-fullName');
const fBirth = $('#modal-birthDate');
const fEmail = $('#modal-email');
const fPhone = $('#modal-phone');
const fAddress = $('#modal-address');
const fRegion = $('#modal-region');
const fLicense = $('#modal-license-no');
const fVehicle = $('#modal-vehicle-info');
const fGender = $('#modal-gender');
const fAvatarUrl = $('#modal-avatar-url');   // ⬅️ thêm biến trỏ input URL

// logout
const btnLogout = $('#logout-btn');

/* ====== Toast nhỏ gọn ====== */
const toastCtr = document.createElement('div');
toastCtr.className = 'toast-ctr';
document.body.appendChild(toastCtr);
function toast(msg, type = 'ok') {
  const el = document.createElement('div');
  el.className = 'toast-item ' + (type === 'ok' ? 'ok' : 'err');
  el.textContent = msg;
  toastCtr.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 250); }, 2400);
}

/* ====== Utils ====== */
const fmtDate = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  if (Number.isNaN(+dt)) return '';
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};
const viewDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '';

function vehicleIconClass(v) {
  const s = (v || '').toLowerCase();
  if (s.includes('ô tô') || s.includes('oto') || s.includes('car')) return 'bi bi-car-front-fill text-info';
  if (s.includes('tải') || s.includes('truck')) return 'bi bi-truck-front-fill text-warning';
  return 'bi bi-bicycle text-primary';
}

function isValidHttpUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch { return false; }
}

/* ====== HTTP helpers ====== */
async function httpGetProfile() {
  const res = await fetch(`${API_BASE}/profile/${shipperId}`);
  const json = await res.json();
  if (!res.ok || !json?.success) throw new Error(json?.message || res.statusText);
  return json.profile;
}

async function httpUpdateProfile(payload) {
  const res = await fetch(`${API_BASE}/profile/${shipperId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok || !json?.success) throw new Error(json?.message || res.statusText);
  return json;
}

/* ====== Render ====== */
function renderProfile(p) {
  // navbar
  if (navName) navName.textContent = `Hi, ${p.FullName || p.Username || '—'}`;
  if (navAvatar) navAvatar.src = p.ImageUrl || '../../img/image 11.png';
  if (vehicleIcon) vehicleIcon.innerHTML = `<i class="${vehicleIconClass(p.VehicleInfo)}" style="font-size:1.5rem"></i>`;

  // left
  avatarMain.src = p.ImageUrl || '../../img/image 11.png';
  nameDisp.textContent = p.FullName || p.Username || '—';
  idDisp.textContent = shipperId;
  ratingDisp.textContent = (p.Rating ?? 4.9) + '/5.0';
  deliveredDisp.textContent = p.DeliveredCount ?? 0;
  regionDisp.textContent = p.Region || '—';
  vehicleDisp.textContent = p.VehicleInfo || '—';

  // right - account
  usernameEl.textContent = p.Username || '—';
  emailEl.textContent = p.Email || '—';
  phoneEl.textContent = p.Phone || '—';
  addressEl.textContent = p.Address || '—';
  statusEl.textContent = p.State === 'Active' ? 'Đang hoạt động' : (p.State || '—');
  statusEl.className = `badge ${p.State === 'Active' ? 'bg-success' : 'bg-warning'}`;

  // right - personal
  fullNameEl.textContent = p.FullName || '—';
  birthdayEl.textContent = viewDate(p.Birthday);
  genderEl.textContent = p.Gender || '—';
  licenseEl.textContent = p.LicenseNo || '—';
  vehicleInfoEl.textContent = p.VehicleInfo || '—';

  // modal values
  fFullName.value = p.FullName || '';
  fBirth.value = fmtDate(p.Birthday);
  fEmail.value = p.Email || '';
  fPhone.value = p.Phone || '';
  fAddress.value = p.Address || '';
  fRegion.value = p.Region || '';
  fLicense.value = p.LicenseNo || '';
  fVehicle.value = p.VehicleInfo || 'Xe máy';
  fGender.value = p.Gender || 'Nam';
  modalAvatarPreview.src = p.ImageUrl || '../../img/image 11.png';
  if (fAvatarUrl) fAvatarUrl.value = p.ImageUrl || '';
}

/* ====== Load profile ====== */
async function loadProfile() {
  try {
    const profile = await httpGetProfile();
    renderProfile(profile);
  } catch (e) {
    console.error(e);
    toast('Lỗi tải hồ sơ: ' + e.message, 'err');
  }
}

/* ====== Update profile ====== */
async function updateProfile() {
  // chọn ảnh theo ưu tiên: URL hợp lệ > (nếu có) file base64 > giữ nguyên preview src
  const typedUrl = (fAvatarUrl?.value || '').trim();
  let imageUrl = '';
  if (typedUrl && isValidHttpUrl(typedUrl)) {
    imageUrl = typedUrl;
  } else if (modalAvatarPreview?.dataset?.blobUrl) {
    imageUrl = modalAvatarPreview.dataset.blobUrl; // base64 từ file
  } else if (modalAvatarPreview?.src) {
    imageUrl = modalAvatarPreview.src; // giữ nguyên
  }

  const payload = {
    fullName: fFullName.value?.trim(),
    address: fAddress.value?.trim(),
    birthday: fBirth.value || null,
    gender: fGender.value,
    vehicleInfo: fVehicle.value,
    licenseNo: fLicense.value?.trim(),
    region: fRegion.value?.trim(),
    email: fEmail.value?.trim(),
    phone: fPhone.value?.trim(),
    imageUrl, // ⬅️ gởi lên BE
  };

  if (!payload.birthday) delete payload.birthday;

  try {
    saveBtn.disabled = true; saveBtn.textContent = 'Đang lưu...';
    await httpUpdateProfile(payload);
    toast('Đã cập nhật hồ sơ');

    // ✅ cập nhật ngay UI
    if (imageUrl) {
      avatarMain.src = imageUrl;
      if (navAvatar) navAvatar.src = imageUrl;
      if (modalAvatarPreview) modalAvatarPreview.src = imageUrl;
    }

    // ✅ lưu lại vào localStorage.account.ImageUrl để trang khác dùng
    const raw = localStorage.getItem('account');
    if (raw) {
      try {
        const acc = JSON.parse(raw);
        acc.ImageUrl = imageUrl;
        localStorage.setItem('account', JSON.stringify(acc));
      } catch {}
    }

    // refresh lại để đồng bộ mọi field
    await loadProfile();

    // đóng modal
    const modalEl = document.getElementById('editProfileModal');
    if (modalEl) {
      const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
      modal.hide();
    }
  } catch (e) {
    console.error(e);
    toast('Lỗi lưu hồ sơ: ' + e.message, 'err');
  } finally {
    saveBtn.disabled = false; saveBtn.textContent = 'Lưu thay đổi';
  }
}

/* ====== Avatar: upload file (nếu còn giữ) ====== */
btnChangeAvatar?.addEventListener('click', () => avatarInput.click());
avatarInput?.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    modalAvatarPreview.src = reader.result;
    modalAvatarPreview.dataset.blobUrl = reader.result; // dùng tạm base64
    if (fAvatarUrl) fAvatarUrl.value = ''; // xoá URL nếu người dùng chọn file
  };
  reader.readAsDataURL(file);
});

/* ====== Avatar: xem trước khi nhập URL ====== */
fAvatarUrl?.addEventListener('change', () => {
  const v = fAvatarUrl.value.trim();
  if (isValidHttpUrl(v)) {
    modalAvatarPreview.src = v;
    delete modalAvatarPreview.dataset.blobUrl; // ưu tiên URL, bỏ base64
  }
});
fAvatarUrl?.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') fAvatarUrl.dispatchEvent(new Event('change'));
});

/* ====== Logout ====== */
btnLogout?.addEventListener('click', async () => {
  try {
    await fetch(`${API_BASE}/logout`, { method: 'POST' }).catch(()=>{});
  } finally {
    ['shipperToken','shipperId','shipperUsername','shipperFullName','shipperEmail','shipperAvatar']
      .forEach(k => localStorage.removeItem(k));
    toast('Đã đăng xuất');
    setTimeout(()=> location.href = '../../template/pages/signIn_page.html', 600);
  }
});

/* ====== Save click ====== */
saveBtn?.addEventListener('click', updateProfile);

/* ====== Init ====== */
loadProfile();
