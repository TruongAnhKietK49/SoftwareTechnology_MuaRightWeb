const {
  insertUser,
  getUsers,
  deleteUserById,
  getProdcuts
} = require("../../models/user/m_user");
const { getPool,closePool } = require("../../routes/config");

// Test insertUser
async function testInsertUser() {
  try {
    const objUser = [
      {
        Username: "henry123",
        Email: "henry@example.com",
        Phone: "01341234567",
        PasswordHash: "123456",
        Role: "Customer",
      },
      {
        FullName: "Henry Nguyen",
        Address: "123 Main St, Cityville",
        Birthday: "1990-05-15",
        Gender: "Nam",
        Balance: 50000000,
      },
    ];

    const res = await insertUser(objUser[0], objUser[1]);
    console.log("➕ Inserted user:", res);
  } catch (err) {
    console.error(err);
  }
}
//testInsertUser();

// Test getUsers
async function testGetUsers() {
  try {
    const res = await getUsers();
    console.log("📄 All users:", res);
  } catch (err) {
    console.error(err);
  }
}
testGetUsers();

// Test deleteUserById
async function testDeleteUser(userId) {
  try {
    const res = await deleteUserById(userId);
    console.log("✅ Delete:", res);
  } catch (err) {
    console.error(err);
  }
}
//testDeleteUser(1).finally(() => closePool());
async function renderProduct() {
  const res = await getProdcuts();
}