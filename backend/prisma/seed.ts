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
  console.log('🧨 Starting selective seed - CLEARING ALL DATA EXCEPT ADMIN...');

  // 1. Clear Activity-related data first (foreign key order)
  console.log('🧹 Wiping activity data, messages, and students...');
  await prisma.attendance.deleteMany();
  await prisma.application.deleteMany();
  await prisma.message.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.activity.deleteMany();

  // 2. Clear coordinator profiles
  await prisma.coordinator.deleteMany();

  // 3. Delete all users EXCEPT those with the 'admin' role
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      role: {
        not: 'admin'
      }
    }
  });
  console.log(`   ✅ Wiped ${deletedUsers.count} non-admin users.`);

  // 4. Ensure Categories exist (system data)
  console.log('📂 Ensuring categories exist...');
  const categories = ['Workshop', 'Seminar', 'Training', 'Extracurricular'];
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }

  const securePassword = 'Jamiila@JU2024Secure!';
  const hashedPassword = await bcrypt.hash(securePassword, 10);
  const targetCoordinatorId = 'eaed4031-a177-44a6-8b11-d8243d50ffba';

  // 5. Upsert Admin (Update password if exists, create if not)
  console.log('👑 Ensuring admin user persists...');
  await prisma.user.upsert({
    where: { email: 'jamiila@gmail.com' },
    update: {
      passwordHash: hashedPassword,
      status: 'active',
    },
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

  // 6. Re-seed the essential Coordinator for testing
  console.log('👨‍🏫 Re-creating test coordinator...');
  await prisma.user.create({
    data: {
      id: targetCoordinatorId,
      name: 'Dr. Ahmed Hassan',
      email: 'coordinator1@ju.edu.sa',
      passwordHash: hashedPassword,
      role: 'coordinator',
      department: 'Computer Science',
      status: 'active',
      emailVerified: true,
      passwordVersion: 1,
      coordinatorProfile: {
        create: {
          department: 'Computer Science',
          specialization: 'Software Engineering',
          maxActivities: 10,
          approvalLevel: 'standard',
        },
      },
    },
  });

  console.log('\n✨ Seed complete! All non-admin data cleared.');
  console.log('👤 Admin jamiila@gmail.com was preserved.');
  console.log(`🔑 Credentials remain: ${securePassword}`);
}

main()
  .catch((e) => {
    console.error('❌ Selective seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
