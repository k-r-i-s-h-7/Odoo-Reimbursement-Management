const jwt = require("jsonwebtoken");
const { ACCESS_SECRET, REFRESH_SECRET } = require("../../config/env");

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      roleId: user.roleId,
      companyId: user.companyId,
    },
    ACCESS_SECRET,
    { expiresIn: "10d" }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign({ userId: user.id }, REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, ACCESS_SECRET);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, REFRESH_SECRET);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};