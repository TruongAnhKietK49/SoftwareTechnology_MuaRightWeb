// /routes/userRoutes.js
const express = require("express");
const router = express.Router();
const { insertUser } = require("../models/m_signUp");

router.post("/", async (req, res) => {
  try {
    await insertUser(req.body);
    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error("Error inserting user:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;

