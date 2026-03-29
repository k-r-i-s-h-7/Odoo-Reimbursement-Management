const prisma = require("../../config/db");
const { hashPassword, comparePassword } = require("../../utils/hash");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../utils/jwt");

const signup = async (data) => {
  const hashedPassword = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash: hashedPassword,
      companyId: data.companyId,
      roleId: data.roleId,
    },
  });

  return user;
};

const login = async (email, password) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) throw new Error("Invalid credentials");

  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) throw new Error("Invalid credentials");

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken, refreshToken };
};

const refresh = async (token) => {
  const existing = await prisma.refreshToken.findUnique({
    where: { token },
  });

  if (!existing) throw new Error("Invalid refresh token");

  const user = await prisma.user.findUnique({
    where: { id: existing.userId },
  });

  const accessToken = generateAccessToken(user);
  return { accessToken };
};

const logout = async (token) => {
  await prisma.refreshToken.delete({
    where: { token },
  });
};

module.exports = {
  signup,
  login,
  refresh,
  logout,
};