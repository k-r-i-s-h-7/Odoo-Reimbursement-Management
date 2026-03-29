const express = require("express");
const router = express.Router();
const {
  signup,
  login,
  refresh,
  logout,
  forgotPassword,
  sendPasswordToUser,
  createUser
} = require("../controllers/AuthController");
const { authenticate } = require("../middleware/AuthMiddleware");
const {authorize } = require("../middleware/RoleMiddleware")
router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/send-password", sendPasswordToUser);
// router.post("/create",authenticate, createUser);
module.exports = router;
