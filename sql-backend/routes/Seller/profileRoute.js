const express = require("express");
const router = express.Router();

const sellerProfileController = require("../../controller/seller/c_sellerProfile");

// GET /seller/profile/:sellerId
router.get("/profile/:sellerId", sellerProfileController.getProfile);

// PUT /seller/profile/:sellerId
router.put("/profile/:sellerId", sellerProfileController.updateProfile);

module.exports = router;