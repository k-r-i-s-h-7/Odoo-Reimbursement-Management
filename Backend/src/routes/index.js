const express = require("express");
const router = express.Router();
const authRoutes = require("./AuthRoutes");

const managerRoutes = require('./managerRoutes'); // Adjust if you named it differently

// ... other routes like /auth or /user ...

router.use('/manager', managerRoutes);
const adminRoutes = require("./adminRoutes")
router.use("/auth", authRoutes);
router.use("/admin",adminRoutes)
module.exports = router;