const express = require("express");
const router = express.Router();

const sellerProfileController = require("../../controller/seller/c_sellerProfile");

router.get("/profile/:sellerId", sellerProfileController.getProfile);
router.put("/profile/:sellerId", sellerProfileController.updateProfile);
router.put("/profile/:sellerId/change-password", sellerProfileController.changePassword);

module.exports = router;