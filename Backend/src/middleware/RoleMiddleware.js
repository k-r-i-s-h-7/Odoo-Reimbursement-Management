const prisma = require("../../config/db");

const authorize = (...roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.roleId) {
        return res.status(403).json({ message: "Forbidden: No role assigned" });
      }

      const role = await prisma.role.findUnique({
        where: { id: req.user.roleId }
      });

      if (!role || !roles.includes(role.name)) {
        return res.status(403).json({ message: "Forbidden: You don't have the required role" });
      }
      next();
    } catch (err) {
      return res.status(500).json({ message: "Internal server error during authorization" });
    }
  };
};

module.exports = { authorize };