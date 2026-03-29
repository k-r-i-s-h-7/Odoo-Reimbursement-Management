const prisma = require("../../config/db");
const { hashPassword, comparePassword } = require("../utils/hash");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/jwt");
const { sendPasswordEmail } = require("./EmailService");
const crypto = require("crypto");

// Generates a random 12-character alphanumeric password
const generateRandomPassword = () => {
  return crypto.randomBytes(9).toString("base64").replace(/[+/=]/g, "X").slice(0, 12);
};


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
  // Fetch user including role and company
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      role: true,
      company: true,
    },
  });

  if (!user) {
    throw new Error("Invalid credentials"); // Consistent error message
  }

  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) {
    throw new Error("Invalid credentials");
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Optionally store refresh token in DB
  // await prisma.refreshToken.create({
  //   data: {
  //     userId: user.id,
  //     token: refreshToken,
  //     expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  //   },
  // });

  return {
    accessToken,
    refreshToken,
    company: user.company,
    role: user.role,
  };
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

// Forgot Password: finds user by email, generates random password, emails it
const forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Return silently — never reveal whether an email exists
    return;
  }

  const plainPassword = generateRandomPassword();
  const hashedPassword = await hashPassword(plainPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashedPassword },
  });

  await sendPasswordEmail(user.email, user.name, plainPassword);
};

// Admin: send a new random password to a specific user by their ID
const sendPasswordToUser = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new Error("User not found");
  }

  const plainPassword = generateRandomPassword();
  const hashedPassword = await hashPassword(plainPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashedPassword },
  });

  await sendPasswordEmail(user.email, user.name, plainPassword);
};

// Admin: create an employee or manager account within the same company
const createUser = async (adminUser, { name, email, role = "Employee", managerId = null }) => {
  let assignedRole = await prisma.role.findFirst({ where: { name: role } });
  if (!assignedRole) {
    assignedRole = await prisma.role.create({ data: { name: role } });
  }

  const plainPassword = generateRandomPassword();
  const hashedPassword = await hashPassword(plainPassword);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: hashedPassword,
      companyId: adminUser.companyId,
      roleId: assignedRole.id,
      ...(managerId ? { managerId } : {}), // only set if provided
    },
  });

  await sendPasswordEmail(user.email, user.name, plainPassword);
  // console.log("User created successfully : ",data)
  return { user };
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