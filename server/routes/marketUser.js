const express = require("express")
const router = express.Router()
const MarketUser = require("../models/marketUser")
const auth = require("../middleware/auth")

router.post("/marketRegister", auth, async (req, res) => {
  try {
    console.log("📦 MARKET REGISTER BODY:", req.body);
    console.log("🔐 AUTH USER:", req.user);

    const {
      full_name,
      email,
      phone_number,
      state_of_origin,
      university,
      department,
      address
    } = req.body;

    if (
      !full_name ||
      !email ||
      !phone_number ||
      !state_of_origin ||
      !university ||
      !department ||
      !address
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const existEmail = await MarketUser.findOne({ email });

    if (existEmail) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    const marketUser = new MarketUser({
      user: req.user.id,
      department,
      university,
      full_name,
      email,
      phone_number,
      state_of_origin,
      address
    });

    await marketUser.save();

    res.status(201).json({
      message: "User registered",
      user: {
        id: marketUser._id,
        email: marketUser.email,
        full_name: marketUser.full_name,
        department: marketUser.department,
        university: marketUser.university,
        address: marketUser.address,
        phone_number: marketUser.phone_number,
        state_of_origin: marketUser.state_of_origin,
      }
    });

  } catch (err) {
    console.error("❌ MARKET REGISTER ERROR:", err);

    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
});

module.exports = router;