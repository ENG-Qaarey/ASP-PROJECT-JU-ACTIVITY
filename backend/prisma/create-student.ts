import { config } from 'dotenv';
import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

config();

async function main() {
    const connectionString = (process.env.DATABASE_URL || '').trim();
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        const passwordHash = await bcrypt.hash('Password123!', 10);
        const student = await prisma.user.upsert({
            where: { email: 'student@gmail.com' },
            update: {
                passwordHash,
                status: 'active',
                emailVerified: true,
            },
            create: {
                name: 'Test Student',
                email: 'student@gmail.com',
                passwordHash,
                role: 'student',
                status: 'active',
                emailVerified: true,
                passwordVersion: 1,
                department: 'Testing',
            }
        });
        console.log('✅ Student user created/updated: student@gmail.com / Password123!');
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}
main();
