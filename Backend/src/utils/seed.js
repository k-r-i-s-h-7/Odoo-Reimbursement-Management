/**
 * Seed script — run once with: npm run db:seed
 * Creates the three core roles required by the schema.
 */
require('dotenv').config()
const { prisma } = require('./prisma')

const ROLES = ['ADMIN', 'MANAGER', 'EMPLOYEE']

async function seed() {
  console.log('🌱  Seeding roles...')

  for (const name of ROLES) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    })
    console.log(`   ✓  Role "${name}" ready`)
  }

  console.log('✅  Seed complete')
  await prisma.$disconnect()
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})