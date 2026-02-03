import { config } from 'dotenv';
import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

config();

async function main() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('DATABASE_URL is not set');
        return;
    }

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        const users = await prisma.user.findMany({
            select: {
                email: true,
                role: true,
                status: true,
            }
        });
        console.log('--- Users in Database ---');
        console.table(users);

        const logs = await prisma.auditLog.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: {
                action: true,
                message: true,
                createdAt: true,
                metadata: true,
            }
        });
        console.log('--- Recent Audit Logs ---');
        console.table(logs);

    } catch (error) {
        console.error('Error fetching data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
