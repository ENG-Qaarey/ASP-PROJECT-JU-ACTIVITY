import { config } from 'dotenv';
import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

// Load environment variables
config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('� Starting non-destructive seed...');

  console.log('\n🌱 Seeding database...');
  const securePassword = 'Jamiila@JU2024Secure!';
  const hashedPassword = await bcrypt.hash(securePassword, 10);

  // 1. Categories
  const categories = ['Workshop', 'Seminar', 'Training', 'Extracurricular'];
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('   ✅ Categories seeded');

  // 2. Admin
  await prisma.user.upsert({
    where: { email: 'jamiila@gmail.com' },
    update: {},
    create: {
      name: 'ENG-jamiila',
      email: 'jamiila@gmail.com',
      passwordHash: hashedPassword,
      role: 'admin',
      department: 'Computer Science',
      status: 'active',
      emailVerified: true,
      passwordVersion: 1,
      adminProfile: { create: { permissions: '["*"]', accessLevel: 'full' } },
    },
  });
  console.log('   ✅ Admin ensured (jamiila@gmail.com)');

  console.log('\n✨ Seeding complete!');
  console.log(`🔑 Admin user uses password: ${securePassword}`);
  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

