const bcrypt = require('bcryptjs')
const { randomBytes } = require('crypto')

const SALT_ROUNDS = 12

/** Hash a plain-text password */
const hashPassword = (plain) => bcrypt.hash(plain, SALT_ROUNDS)

/** Compare plain-text with hash */
const comparePassword = (plain, hash) => bcrypt.compare(plain, hash)

/**
 * Generate a cryptographically secure temporary password.
 * Format: 16 random hex chars — e.g. "a3f8c12d9b4e7f01"
 */
const generateTempPassword = () => randomBytes(8).toString('hex')

/**
 * Generate a secure password-reset token.
 * Returns a 32-byte hex string.
 */
const generateResetToken = () => randomBytes(32).toString('hex')

module.exports = { hashPassword, comparePassword, generateTempPassword, generateResetToken }