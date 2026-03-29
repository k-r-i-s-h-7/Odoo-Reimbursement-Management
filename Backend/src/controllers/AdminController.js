const AuthService = require('../services/AuthService');
const prisma = require('../../config/db');

const createUser = async (req, res) => {
  try {
    const { name, email, role, managerId } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }

    // role from frontend is "EMPLOYEE"/"MANAGER", normalize to match your DB role names
    const normalizedRole = role === 'MANAGER' ? 'Manager' : 'Employee';

    const result = await AuthService.createUser(req.user, {
      name,
      email,
      role: normalizedRole,
      managerId: managerId || null,
    });

    return res.status(201).json({
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: role,              // return original casing for frontend
      managerId: result.user.managerId ?? null,
    });
  } catch (err) {
    if (err.code === 'P2002') {  // Prisma unique constraint (duplicate email)
      return res.status(409).json({ error: 'A user with this email already exists.' });
    }
    return res.status(500).json({ error: err.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { companyId: req.user.companyId },
      select: {
        id: true,
        name: true,
        email: true,
        managerId: true,
        role: { select: { name: true } },
      },
    });

    return res.json(
      users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        managerId: u.managerId ?? null,
        role: u.role?.name?.toUpperCase() ?? 'EMPLOYEE',
      }))
    );
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { createUser, getUsers };