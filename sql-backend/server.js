const { getPool, closePool } = require("./routes/config");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
app.use(cors());
app.use(bodyParser.json());

const accountRoutes = require("./routes/Admin/accountRoute");
app.use("/admin", accountRoutes);

const signUpRoutes = require("./routes/signUpRoute")
app.use("/api", signUpRoutes);

const signInRoutes = require("./routes/signInRoute")
app.use('/api', signInRoutes)


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});
