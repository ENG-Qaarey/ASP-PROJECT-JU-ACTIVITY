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

    console.log('--- Reproduction Script ---');

    try {
        // 1. Create a dummy coordinator
        const coordinator = await prisma.user.create({
            data: {
                name: "Delete Me Coord",
                email: "deleteme@coord.com",
                passwordHash: "hash",
                role: "coordinator",
                coordinatorProfile: {
                    create: { department: "Test" }
                }
            }
        });
        console.log(`Created coordinator: ${coordinator.id}`);

        // 2. Create an activity for them
        const activity = await prisma.activity.create({
            data: {
                title: "Test Activity",
                description: "Desc",
                date: new Date(),
                time: "10:00",
                location: "Room 1",
                capacity: 10,
                category: "Workshop",
                coordinatorId: coordinator.id,
                coordinatorName: coordinator.name,
                status: "upcoming"
            }
        });
        console.log(`Created activity: ${activity.id}`);

        // 3. Try to delete the coordinator
        console.log('Attempting to delete coordinator...');
        await prisma.user.delete({
            where: { id: coordinator.id }
        });
        console.log('✅ Delete SUCCESS (Unexpected)');

    } catch (error: any) {
        console.log('❌ Delete FAILED (Expected)');
        console.log('Error code:', error.code);
        console.log('Message:', error.message);
    } finally {
        // Cleanup if needed (manual delete of activity then user if they exist)
        // ...
        await prisma.$disconnect();
    }
}

main();
