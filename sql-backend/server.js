const { getPool, closePool } = require("./routes/config");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
app.use(cors());
// app.use(bodyParser.json());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

const accountRoutes = require("./routes/Admin/accountRoute");
const adminProfileRoutes = require("./routes/Admin/adminProfileRoute");
const inventoryRoutes = require("./routes/Admin/inventoryRoute");
const warehouseRoutes = require("./routes/Admin/warehouseRoute");
const dashboardRoutes = require("./routes/Admin/dashboardRoute");
app.use(
  "/admin",
  adminProfileRoutes,
  accountRoutes,
  inventoryRoutes,
  warehouseRoutes,
  dashboardRoutes
);

const shipperRoutes = require("./routes/Shipper/shipperRoutes");
app.use("/api/shipper", shipperRoutes);
const sellerDashboardRoutes = require("./routes/Seller/sellerDashboardRoute");
const productRoutes = require("./routes/Seller/productRoute");
const sellerOrderRoute = require("./routes/Seller/orderRoute");
const statisticRoutes = require("./routes/Seller/statisticRoute");
const profileRoutes = require("./routes/Seller/profileRoute");
const voucherRoutes = require("./routes/Seller/voucherRoute");
app.use(
  "/seller",
  sellerOrderRoute,
  sellerDashboardRoutes,
  productRoutes,
  statisticRoutes,
  profileRoutes,
  voucherRoutes
);

const signUpRoutes = require("./routes/signUpRoute");
const signInRoutes = require("./routes/signInRoute");
app.use("/api", signUpRoutes, signInRoutes);

const cartRoutes = require("./routes/cartRoutes");
app.use("/cart", cartRoutes);

const productUserRoutes = require("./routes/productRoutes");
app.use("/products", productUserRoutes);

const userProfileRoutes = require("./routes/userRoutes");
const paymentRoutes = require("./routes/User/paymentRoute");
const orderHistoryRoutes = require("./routes/User/orderHistoryRoute");
app.use("/user", userProfileRoutes, paymentRoutes, orderHistoryRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});
