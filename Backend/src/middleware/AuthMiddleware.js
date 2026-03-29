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

const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    
    // TODO: fetch role name from database based on roleId
    // For now, you need to compare with roleId or pass role info in token
    if (req.user.role !== role) {
      return res.status(403).json({ message: "Forbidden: insufficient permissions" });
    }
    
    next();
  };
};

module.exports = { authenticate, requireRole };