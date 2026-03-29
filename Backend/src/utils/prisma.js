const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  errorFormat: 'pretty',
})

// Test connection on startup
prisma.$executeRawUnsafe('SELECT 1').then(() => {
  console.log('[Prisma] ✓ Database connection successful')
}).catch((err) => {
  console.error('[Prisma] ❌ Database connection failed:', err.message)
  console.error('[Prisma] Ensure DATABASE_URL is correct and database server is running')
})

module.exports = { prisma }