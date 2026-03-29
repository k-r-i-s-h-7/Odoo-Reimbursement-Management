const { verifyAccessToken } = require("../utils/jwt");

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) return res.status(401).json({ message: "No token" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyAccessToken(token);
    console.log("Access token(Undecoded)",token)
    console.log("Access token of user is",decoded)
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = { authenticate };