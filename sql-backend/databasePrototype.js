// Insert dữ liệu mẫu vào bảng (chạy 1 lần)
const { getPool, closePool } = require("./routes/config");

// Đọc file JSON
const fs = require("fs");
const path = require("path");

// Insert Account
async function insertAccount() {
  try {
    const pool = await getPool();
    const dataPath = path.join(__dirname, "../public/DATA/Accounts.json");
    const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

    for (const key of Object.keys(data)) {
      for (let entry of data[key]) {
        const accObj = entry[0];
        const profObj = entry[1];

        // --- Insert Account ---
        const reqAcc = pool.request();
        const accCols = Object.keys(accObj);
        accCols.forEach((col) => reqAcc.input(col, accObj[col]));

        const accColNames = accCols.join(", ");
        const accColParams = accCols.map((c) => `@${c}`).join(", ");

        const result = await reqAcc.query(`
          INSERT INTO Account (${accColNames})
          OUTPUT INSERTED.AccountId AS AccountId, INSERTED.Role AS Role
          VALUES (${accColParams});
        `);

        const accountId = result.recordset[0].AccountId;
        const roleAccount = result.recordset[0].Role;
        const profileTable = roleAccount + "Profile";
        const profileId = roleAccount + "Id";

        // --- Insert Profile ---
        const reqProf = pool.request();
        reqProf.input(profileId, accountId);

        const profCols = Object.keys(profObj);
        profCols.forEach((col) => reqProf.input(col, profObj[col]));

        const profColNames = [profileId, ...profCols].join(", ");
        const profColParams = [
          `@${profileId}`,
          ...profCols.map((c) => `@${c}`),
        ].join(", ");

        await reqProf.query(`
          INSERT INTO ${profileTable} (${profColNames})
          VALUES (${profColParams});
        `);

        console.log(`✔ Insert ${roleAccount}: ${accObj.Username}`);
      }
    }
  } catch (err) {
    console.error("❌ Lỗi khi chèn dữ liệu mẫu:", err);
  } finally {
    await closePool();
  }
}

// Insert Product
async function insertProduct() {
  try {
    const pool = await getPool();
    const dataPath = path.join(
      __dirname,
      "../public/DATA/product_warehouse.json"
    );
    const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    for (const product of data) {
      const req = pool.request();
      const cols = Object.keys(product);
      cols.forEach((col) => req.input(col, product[col]));
      await req.query(`
        INSERT INTO Product (${cols.join(", ")})
        VALUES (${cols.map((c) => `@${c}`).join(", ")});
      `);
      console.log(`✔ Insert Product: ${product.NameProduct}`);
    }
  } catch (error) {
    console.log("Lỗi khi insert sản phẩm: ", error);
  } finally {
    await closePool();
  }
}

// Insert Review
async function insertReview() {
  try {
    const pool = await getPool();
    const dataPath = path.join(__dirname, "../public/DATA/reviews.json");
    const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    for (const review of data) {
      const req = pool.request();
      const cols = Object.keys(review);
      cols.forEach((col) => req.input(col, review[col]));
      await req.query(`
        INSERT INTO Review (${cols.join(", ")})
        VALUES (${cols.map((c) => `@${c}`).join(", ")});
      `);
      console.log(`✔ Insert Product Review: ${review.ProductId}`);
    }
  } catch (error) {
    console.log("Lỗi khi insert-review: ", error);
  } finally {
    await closePool();
  }
}

// Insert Basket
async function insertBasket() {
  try {
    const pool = await getPool();
    const dataPath = path.join(__dirname, "../public/DATA/basket.json");
    const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    for (const basket of data) {
      const req = pool.request();
      const cols = Object.keys(basket);
      cols.forEach((col) => req.input(col, basket[col]));
      await req.query(`
        INSERT INTO Basket (${cols.join(", ")})
        VALUES (${cols.map((c) => `@${c}`).join(", ")});
      `);
      console.log(`✔ Insert Basket: ProductId ${basket.ProductId} và CustomerId ${basket.CustomerId}`);
    }
  } catch (error) {
    console.log("Lỗi khi insert-basket: ", error);
  } finally {
    await closePool();
  }
}

// Insert OrderProduct
async function insertOrderProduct() {
  try {
    const pool = await getPool();

    const dataPath = path.join(__dirname, "../public/DATA/orderProducts.json");
    const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

    for (const orderProduct of data) {
      const req = pool.request();
      const cols = Object.keys(orderProduct);
      cols.forEach((col) => req.input(col, orderProduct[col]));
      await req.query(`
        INSERT INTO OrderProduct (${cols.join(", ")})
        VALUES (${cols.map((c) => `@${c}`).join(", ")});
      `);
      console.log(`✔ Insert OrderProduct: ${orderProduct.CustomerId}`);
    }
  } catch (error) {
    console.log("Lỗi khi insert-orderProduct: ", error);
  }
}

// Insert OrderItem
async function insertOrderItem() {
  try {
    const pool = await getPool();

    const dataPath = path.join(__dirname, "../public/DATA/orderItems.json");
    const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

    for (const orderItem of data) {
      const req = pool.request();
      const cols = Object.keys(orderItem);
      cols.forEach((col) => req.input(col, orderItem[col]));
      await req.query(`
        INSERT INTO OrderItem (${cols.join(", ")})
        VALUES (${cols.map((c) => `@${c}`).join(", ")});
      `);
      console.log(`✔ Insert OrderItem: ${orderItem.OrderId}`);
    }
  } catch (error) {
    console.log("Lỗi khi insert-orderItem: ", error);
  }
}

// Insert Voucher
async function insertVoucher() {
  try {
    const pool = await getPool();
    const dataPath = path.join(__dirname, "../public/DATA/vouchers.json");
    const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

    for (const voucher of data) {
      const req = pool.request();
      const cols = Object.keys(voucher);
      cols.forEach((col) => req.input(col, voucher[col]));
      await req.query(`
        INSERT INTO Voucher (${cols.join(", ")})
        VALUES (${cols.map((c) => `@${c}`).join(", ")});
      `);
      console.log(`✔ Insert Voucher: ${voucher.Code}`);
    }
  } catch (error) {
    console.log("Lỗi khi insert-voucher: ", error);
  } finally {
    await closePool();
  }
}

// Run functions
async function run() {
  await insertAccount();
  await insertProduct();
  await insertReview();
  await insertBasket();
  await insertOrderProduct();
  await insertOrderItem();
  await insertVoucher();
}
run();