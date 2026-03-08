import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { config } from 'dotenv';
import * as bcrypt from 'bcrypt';

config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const users = await prisma.user.findMany({
        select: { id: true, email: true, passwordHash: true, role: true }
    });

    console.log('Checking Users:');
    const testPassword = 'Jamiila@JU2024Secure!';

    for (const user of users) {
        const isValid = await bcrypt.compare(testPassword, user.passwordHash);
        console.log(`- ${user.email} (${user.role}): Valid=${isValid}`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
