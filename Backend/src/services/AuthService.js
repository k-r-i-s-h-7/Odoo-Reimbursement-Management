const prisma = require("../../config/db");
const { hashPassword, comparePassword } = require("../utils/hash");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/jwt");


const signup = async (data) => {
  const {
    name,
    email,
    password,
    companyName,
    country,
    currency,
  } = data;

  // 1. Hash password
  const hashedPassword = await hashPassword(password);

  // 2. Create Company
  const company = await prisma.company.create({
    data: {
      name: companyName,
      country: country,
      baseCurrency: currency,
    },
  });

  // 3. Get or create default role (Admin)
  let role = await prisma.role.findFirst({
    where: { name: "Admin" },
  });

  if (!role) {
    role = await prisma.role.create({
      data: { name: "Admin" },
    });
  }

  // 4. Create User
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: hashedPassword,
      companyId: company.id,
      roleId: role.id,
    },
  });

  // 5. Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // 6. Store refresh token
  // console.log(prisma);
  // await prisma.refreshToken.create({
  //   data: {
  //     userId: user.id,
  //     token: refreshToken,
  //     expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  //   },
  // });

  return {
    user,
    company,
    accessToken,
    refreshToken,
  };
};

const login = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });
if (!user) {
  return res.status(404).json({ error: 'User not found' });
}
  
  if (!user) throw new Error("Invalid credentials");

  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) throw new Error("Invalid credentials");

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // await prisma.refreshToken.create({
  //   data: {
  //     userId: user.id,
  //     token: refreshToken,
  //     expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  //   },
  // });

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