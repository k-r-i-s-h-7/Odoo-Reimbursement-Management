/**
 * Auth Service
 * ─────────────────────────────────────────────────────────────────────────────
 * All authentication business logic lives here.
 * The controller stays thin and just handles HTTP concerns.
 *
 * Implements:
 *  - signup       → create Company + Admin user
 *  - login        → verify credentials, issue access + refresh tokens
 *  - refresh      → verify refresh token, issue new access token
 *  - logout       → invalidate refresh token
 *  - forgotPassword → generate reset token, send email
 *  - resetPassword  → validate token, update password
 */

const { prisma } = require('../utils/prisma')
const { hashPassword, comparePassword, generateTempPassword, generateResetToken } = require('../utils/password')
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt')
const { sendPasswordResetEmail } = require('./EmailServices')

// ─── In-memory stores ─────────────────────────────────────────────────────────
// In production replace both with Redis or a DB table.
const refreshTokenStore = new Set()           // valid refresh tokens
const resetTokenStore   = new Map()           // resetToken → { userId, expiresAt }

// ─── Country → Currency mapping ───────────────────────────────────────────────
const COUNTRY_CURRENCY_MAP = {
  India: 'INR',
  'United States': 'USD',
  'United Kingdom': 'GBP',
  Germany: 'EUR',
  France: 'EUR',
  Japan: 'JPY',
  Canada: 'CAD',
  Australia: 'AUD',
  Singapore: 'SGD',
  'United Arab Emirates': 'AED',
}
const deriveCurrency = (country) => COUNTRY_CURRENCY_MAP[country] ?? 'USD'

// ─── Signup ──────────────────────────────────────────────────────────────────
const signup = async ({ name, email, password, country }) => {
  if (!name || !email || !password || !country) {
    throw Object.assign(new Error('Name, email, password, and country are required.'), { statusCode: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw Object.assign(new Error('An account with this email already exists.'), { statusCode: 409 })
  }

  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } })
  if (!adminRole) {
    throw Object.assign(new Error('Server misconfiguration: ADMIN role not seeded.'), { statusCode: 500 })
  }

  const passwordHash = await hashPassword(password)
  const baseCurrency = deriveCurrency(country)

  const { user, company } = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: { country, baseCurrency },
    })
    const user = await tx.user.create({
      data: { name, email, passwordHash, companyId: company.id, roleId: adminRole.id },
    })
    return { user, company }
  })

  const accessToken  = signAccessToken({ id: user.id, role: 'ADMIN', companyId: company.id })
  const refreshToken = signRefreshToken({ id: user.id })
  refreshTokenStore.add(refreshToken)

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: 'ADMIN', companyId: company.id },
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────
const login = async (email, password) => {
  if (!email || !password) {
    throw Object.assign(new Error('Email and password are required.'), { statusCode: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  })

  if (!user || !(await comparePassword(password, user.passwordHash))) {
    throw Object.assign(new Error('Invalid email or password.'), { statusCode: 401 })
  }

  const accessToken  = signAccessToken({ id: user.id, role: user.role.name, companyId: user.companyId })
  const refreshToken = signRefreshToken({ id: user.id })
  refreshTokenStore.add(refreshToken)

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role.name, companyId: user.companyId },
  }
}

// ─── Refresh ──────────────────────────────────────────────────────────────────
const refresh = async (token) => {
  if (!token) {
    throw Object.assign(new Error('Refresh token is required.'), { statusCode: 400 })
  }

  if (!refreshTokenStore.has(token)) {
    throw Object.assign(new Error('Refresh token is invalid or has been revoked.'), { statusCode: 401 })
  }

  let decoded
  try {
    decoded = verifyRefreshToken(token)
  } catch {
    refreshTokenStore.delete(token)
    throw Object.assign(new Error('Refresh token is expired or invalid.'), { statusCode: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    include: { role: true },
  })

  if (!user) {
    throw Object.assign(new Error('User no longer exists.'), { statusCode: 401 })
  }

  const accessToken = signAccessToken({ id: user.id, role: user.role.name, companyId: user.companyId })

  return { accessToken }
}

// ─── Logout ───────────────────────────────────────────────────────────────────
const logout = async (token) => {
  if (token) {
    refreshTokenStore.delete(token)
  }
}

// ─── Forgot Password ─────────────────────────────────────────────────────────
const forgotPassword = async (email) => {
  if (!email) {
    throw Object.assign(new Error('Email is required.'), { statusCode: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email } })

  // Silently return if user not found — prevents email enumeration
  if (!user) return

  const resetToken = generateResetToken()
  resetTokenStore.set(resetToken, { userId: user.id, expiresAt: Date.now() + 60 * 60 * 1000 }) // 1 hour

  await sendPasswordResetEmail({ to: user.email, name: user.name, resetToken })
    .catch((err) => console.error('[EmailError] forgotPassword:', err))
}

// ─── Reset Password ───────────────────────────────────────────────────────────
const resetPassword = async (token, newPassword) => {
  if (!token || !newPassword) {
    throw Object.assign(new Error('Token and new password are required.'), { statusCode: 400 })
  }

  const entry = resetTokenStore.get(token)
  if (!entry || Date.now() > entry.expiresAt) {
    throw Object.assign(new Error('Reset token is invalid or has expired.'), { statusCode: 400 })
  }

  if (newPassword.length < 8) {
    throw Object.assign(new Error('Password must be at least 8 characters.'), { statusCode: 400 })
  }

  const passwordHash = await hashPassword(newPassword)
  await prisma.user.update({ where: { id: entry.userId }, data: { passwordHash } })

  resetTokenStore.delete(token)
}

// Export store so admin.service can register reset tokens for newly created users
module.exports = { signup, login, refresh, logout, forgotPassword, resetPassword, resetTokenStore, deriveCurrency }