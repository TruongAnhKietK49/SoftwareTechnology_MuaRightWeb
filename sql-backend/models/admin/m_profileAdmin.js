const { getPool } = require("../../routes/config");

async function getAdminByUsername(username) {
  const pool = await getPool();
  const result = await pool.request().input("Username", username).query(`
      SELECT 
        A.AccountId,
        A.Username, 
        A.Email, 
        A.Phone, 
        A.PasswordHash, 
        A.Role,
        A.State, 
        A.ImageUrl,
        P.FullName, 
        P.Birthday, 
        P.Gender, 
        P.Position, 
        P.Note
      FROM Account AS A
      LEFT JOIN AdminProfile AS P ON A.AccountId = P.AdminId
      WHERE A.Username = @Username AND A.Role = 'Admin'
    `);

  return result.recordset[0];
}

async function updateAdminByUsername(username, data) {
  const pool = await getPool();

  const accRes = await pool
    .request()
    .input("Username", username)
    .query(
      `SELECT AccountId FROM Account WHERE Username = @Username AND Role='Admin'`
    );
  if (accRes.recordset.length === 0)
    throw new Error("Không tìm thấy tài khoản");

  const accountId = accRes.recordset[0].AccountId;

  // Cập nhật bảng Account
  const reqAcc = pool.request();
  reqAcc.input("AccountId", accountId);
  reqAcc.input("Email", data.Email);
  reqAcc.input("Phone", data.Phone);
  reqAcc.input("ImageUrl", data.ImageUrl);
  if (data.PasswordHash && data.PasswordHash.trim() !== "")
    reqAcc.input("PasswordHash", data.PasswordHash);

  await reqAcc.query(`
    UPDATE Account
    SET Email=@Email, Phone=@Phone, ImageUrl=@ImageUrl
        ${
          data.PasswordHash && data.PasswordHash.trim() !== ""
            ? ", PasswordHash=@PasswordHash"
            : ""
        }
    WHERE AccountId=@AccountId
  `);

  // Cập nhật bảng AdminProfile
  const reqProf = pool.request();
  reqProf.input("AdminId", accountId);
  reqProf.input("FullName", data.FullName);
  reqProf.input("Birthday", data.Birthday);
  reqProf.input("Gender", data.Gender);
  reqProf.input("Position", data.Position);
  reqProf.input("Note", data.Note);

  await reqProf.query(`
    MERGE AdminProfile AS target
    USING (SELECT @AdminId AS AdminId) AS source
    ON target.AdminId = source.AdminId
    WHEN MATCHED THEN
      UPDATE SET FullName=@FullName, Birthday=@Birthday, Gender=@Gender, Position=@Position, Note=@Note
    WHEN NOT MATCHED THEN
      INSERT (AdminId, FullName, Birthday, Gender, Position, Note)
      VALUES (@AdminId, @FullName, @Birthday, @Gender, @Position, @Note);
  `);
}

module.exports = { getAdminByUsername, updateAdminByUsername };

