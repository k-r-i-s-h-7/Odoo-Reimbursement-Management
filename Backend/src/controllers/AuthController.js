const authService = require("../services/AuthService");

const signup = async (req, res, next) => {
  try {
    const user = await authService.signup(req.body);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    console.log("BODY:", req.body);
    console.log("EMAIL:", req.body?.email);
    const data = await authService.login(
      req.body.email,
      req.body.password
    );
    
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const data = await authService.refresh(req.body.refreshToken);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.body.refreshToken);
    res.json({ message: "Logged out" });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/forgot-password  { email }
const forgotPassword = async (req, res, next) => {
  try {
    await authService.forgotPassword(req.body.email);
    // Always return success to avoid revealing account existence
    res.json({ message: "If that email is registered, a temporary password has been sent." });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/send-password  { userId }  (admin action)
const sendPasswordToUser = async (req, res, next) => {
  try {
    await authService.sendPasswordToUser(req.body.userId);
    res.json({ message: "Temporary password sent successfully." });
  } catch (err) {
    next(err);
  }
};

const createUser = async (req, res) => {
  const { name, email, role } = req.body;
  const result = await AuthService.createUser(req.user, { name, email, role });
  res.status(201).json(result);
};

module.exports = {
  signup,
  login,
  refresh,
  logout,
  forgotPassword,
  sendPasswordToUser,
  createUser
};
