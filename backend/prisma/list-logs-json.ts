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
        });
        console.log('JSON_START');
        console.log(JSON.stringify(logs));
        console.log('JSON_END');
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}
main();
