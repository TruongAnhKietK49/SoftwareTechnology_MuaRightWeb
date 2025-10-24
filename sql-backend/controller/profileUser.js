async function fetchUserProfile(CustomerId) {
  try {
    const response = await fetch(`http://localhost:3000/user/profile/${CustomerId}`);
    if (!response.ok) throw new Error("Failed to fetch profile data");

    const profileData = await response.json();
    return Array.isArray(profileData) ? profileData[0] : profileData;
  } catch (error) {
    console.error("Error fetching profile data:", error);
    alert("Lỗi khi tải thông tin người dùng.");
    return null;
  }
}

function renderProfilePage(data) {
  if (!data) return;

  document.getElementById("profile-join-date").textContent = data.JoinDate
    ? new Date(data.JoinDate).toISOString().split("T")[0]
    : "";
  document.getElementById("profile-avatar-img").src =
    data.ImageUrl || "../../public/Images/default-avatar.png";
  document.getElementById("profile-username").textContent = data.Username || "";
  document.getElementById("profile-email").textContent = data.Email || "";
  document.getElementById("profile-phone").textContent = data.Phone || "";
  document.getElementById("profile-fullname").textContent = data.FullName || "";
  document.getElementById("profile-gender").textContent = data.Gender || "";
  document.getElementById("profile-birthday").textContent = data.Birthday
    ? new Date(data.Birthday).toISOString().split("T")[0]
    : "";
  document.getElementById("profile-address").textContent = data.Address || "";
  document.getElementById("profile-balance").textContent =
    data.Balance ? data.Balance.toLocaleString("vi-VN") + "₫" : "0₫";
}

async function openEditModal() {
  const CustomerId = JSON.parse(localStorage.getItem("account")).AccountId;
  const profile = await fetchUserProfile(CustomerId);
  if (!profile) return;

  document.getElementById("edit-email").value = profile.Email || "";
  document.getElementById("edit-phone").value = profile.Phone || "";
  document.getElementById("edit-fullname").value = profile.FullName || "";
  document.getElementById("edit-address").value = profile.Address || "";
  document.getElementById("edit-birthday").value = profile.Birthday
    ? new Date(profile.Birthday).toISOString().split("T")[0]
    : "";
  document.getElementById("edit-gender").value = profile.Gender || "";
}

async function updateUserProfile() {
  const CustomerId = JSON.parse(localStorage.getItem("account")).AccountId;

  const updatedData = {
    Email: document.getElementById("edit-email").value,
    Phone: document.getElementById("edit-phone").value,
    FullName: document.getElementById("edit-fullname").value,
    Address: document.getElementById("edit-address").value,
    Birthday: document.getElementById("edit-birthday").value,
    Gender: document.getElementById("edit-gender").value,
  };

  try {
    const response = await fetch(`http://localhost:3000/user/profile/${CustomerId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData),
    });

    if (!response.ok) throw new Error("Failed to update profile");

    alert("Cập nhật thông tin thành công!");
    const updatedProfile = await fetchUserProfile(CustomerId);
    renderProfilePage(updatedProfile);

    // Ẩn modal sau khi cập nhật
    const modal = bootstrap.Modal.getInstance(document.getElementById("editProfileModal"));
    modal.hide();
  } catch (error) {
    console.error("Error updating profile:", error);
    alert("Lỗi khi cập nhật thông tin người dùng.");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const account = JSON.parse(localStorage.getItem("account"));
  if (!account || !account.AccountId) {
    window.location.href = "../../template/pages/signIn_page.html";
    return;
  }

  const CustomerId = account.AccountId;
  const profileData = await fetchUserProfile(CustomerId);
  renderProfilePage(profileData);

  const editModal = document.getElementById("editProfileModal");
  editModal.addEventListener("show.bs.modal", openEditModal);

  document.getElementById("save-profile-btn").addEventListener("click", updateUserProfile);
});
