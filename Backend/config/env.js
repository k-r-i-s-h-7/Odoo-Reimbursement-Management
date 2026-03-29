require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 5000,
  ACCESS_SECRET: process.env.ACCESS_SECRET,
  REFRESH_SECRET: process.env.REFRESH_SECRET,
};