const { getPool, closePool } = require("./routes/config");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
app.use(cors());
app.use(bodyParser.json());

const accountRoutes = require("./routes/Admin/accountRoute");
const adminProfileRoutes = require("./routes/Admin/adminProfileRoute");
const inventoryRoutes = require("./routes/Admin/inventoryRoute");
app.use("/admin", adminProfileRoutes, accountRoutes, inventoryRoutes);

const productRoutes = require("./routes/Seller/productRoute");
app.use("/seller", productRoutes);

const signUpRoutes = require("./routes/signUpRoute")
const signInRoutes = require("./routes/signInRoute")
app.use('/api', signUpRoutes, signInRoutes)

const cartRoutes = require("./routes/cartRoutes");
app.use("/cart", cartRoutes);

const productUserRoutes = require("./routes/productRoutes");
app.use("/products", productUserRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});

