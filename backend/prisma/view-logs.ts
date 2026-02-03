import { config } from 'dotenv';
import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

config();

async function main() {
    const connectionString = (process.env.DATABASE_URL || '').trim();
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        const logs = await prisma.auditLog.findMany({
            take: 20,
            orderBy: { createdAt: 'desc' },
            select: { action: true, message: true, createdAt: true, metadata: true }
        });
        for (const log of logs) {
            console.log(`[${log.createdAt.toISOString()}] ${log.action}: ${log.message}`);
        }
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}
main();
