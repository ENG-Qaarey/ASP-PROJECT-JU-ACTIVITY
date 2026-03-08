import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

config();

async function main() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL is not defined in .env');
    }

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        const users = await prisma.user.findMany({
            select: {
                email: true,
                role: true,
                name: true,
                status: true,
            }
        });
        console.log(`--- FOUND ${users.length} USERS ---`);
        console.log(JSON.stringify(users, null, 2));
        console.log('-------------------------');
    } catch (error) {
        console.error('Error fetching users:', error);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
