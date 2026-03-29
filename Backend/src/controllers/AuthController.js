const authService = require("../services/AuthServices");

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

module.exports = {
  signup,
  login,
  refresh,
  logout,
};