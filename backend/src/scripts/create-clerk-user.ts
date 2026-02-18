import { config } from 'dotenv';
import { createClerkClient } from '@clerk/backend';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

// Load environment variables
config();

async function setupPrismaUser() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn('⚠️  DATABASE_URL not set. Skipping Prisma setup.');
    return;
  }

  const email = 'jamiila@gmail.com';
  const name = 'ENG-jamiila';
  const securePassword = 'Jamiila@JU2024Secure!';
  const normalizedEmail = email.toLowerCase();

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('\n📊 Setting up admin user in Prisma database...');

    const existingUser = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive',
        },
      },
      include: {
        adminProfile: true,
      },
    });

    if (existingUser) {
      console.log(`✅ User already exists in Prisma`);
      const passwordHash = await bcrypt.hash(securePassword, 10);

      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          email: normalizedEmail,
          name: name,
          passwordHash: passwordHash,
          passwordVersion: existingUser.passwordVersion + 1,
          status: 'active',
          emailVerified: true,
          role: 'admin',
          adminProfile: existingUser.adminProfile ? undefined : {
            create: {
              permissions: JSON.stringify(['*']),
              accessLevel: 'full',
            },
          },
        },
      });

      if (!existingUser.adminProfile) {
        await prisma.admin.create({
          data: {
            userId: existingUser.id,
            permissions: JSON.stringify(['*']),
            accessLevel: 'full',
          },
        });
      }
      console.log(`✅ Prisma user updated successfully!`);
    } else {
      const passwordHash = await bcrypt.hash(securePassword, 10);

      await prisma.user.create({
        data: {
          name: name,
          email: normalizedEmail,
          passwordHash: passwordHash,
          role: 'admin',
          department: 'Systems',
          joinedAt: new Date('2019-11-02'),
          status: 'active',
          emailVerified: true,
          passwordVersion: 1,
          adminProfile: {
            create: {
              permissions: JSON.stringify(['*']),
              accessLevel: 'full',
            },
          },
        },
      });
      console.log(`✅ Admin user created in Prisma database!`);
    }
  } catch (error: any) {
    console.error('❌ Error setting up Prisma user:', error.message);
    if (error.message.includes('authentication failed')) {
      console.error('💡 Check your DATABASE_URL in .env file');
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

async function createClerkUser() {
  const secretKey = process.env.CLERK_SECRET_KEY;

  if (!secretKey) {
    throw new Error('CLERK_SECRET_KEY environment variable is not set');
  }

  const client = createClerkClient({ secretKey });

  // Normalize email to lowercase for consistency
  const email = 'jamiila@gmail.com';
  // Using a secure password that meets Clerk requirements (not in data breach)
  const password = 'Jamiila@JU2024Secure!';
  const firstName = 'ENG';
  const lastName = 'jamiila';
  const role = 'admin';

  try {
    console.log(`🔍 Checking if user with email ${email} exists in Clerk...`);

    // Check if user already exists
    let existingUser: any = null;
    try {
      const users = await client.users.getUserList({
        emailAddress: [email.toLowerCase()]
      });

      if (users.data && users.data.length > 0) {
        existingUser = users.data[0];
      }
    } catch (error: any) {
      // If getUserList fails, try alternative method or continue to create
      console.log(`⚠️  Could not check existing users: ${error.message}`);
    }

    if (existingUser) {
      const userId = existingUser.id as string;
      console.log(`✅ User already exists in Clerk with ID: ${userId}`);
      const emailAddresses = (existingUser.emailAddresses as any[]) || [];
      const primaryEmail = emailAddresses.find(
        (e: any) => e.id === existingUser.primaryEmailAddressId
      ) || emailAddresses[0];
      console.log(`   Email: ${primaryEmail?.emailAddress || 'N/A'}`);

      // Update the user if needed
      console.log(`🔄 Updating user metadata...`);
      try {
        await client.users.updateUser(userId, {
          publicMetadata: {
            role: role,
          },
          unsafeMetadata: {
            role: role,
          },
        });
        console.log(`✅ Metadata updated successfully`);
      } catch (error: any) {
        console.warn(`⚠️  Could not update metadata: ${error.message}`);
      }

      // Remove MFA methods if any exist
      try {
        console.log(`🔒 Checking for MFA methods...`);
        const mfaMethods = await (client.users as any).getMfaMethods({ userId });
        if (mfaMethods && Array.isArray(mfaMethods) && mfaMethods.length > 0) {
          for (const method of mfaMethods) {
            try {
              await (client.users as any).deleteMfaMethod({ userId, methodId: method.id });
              console.log(`   ✅ Removed MFA method: ${method.type}`);
            } catch (delError: any) {
              console.log(`   ⚠️  Could not remove MFA method: ${delError.message}`);
            }
          }
        } else {
          console.log(`   ✅ No MFA methods found`);
        }
      } catch (mfaError: any) {
        console.log(`   ℹ️  MFA check skipped (may not be available via API)`);
      }

      // Update password if needed
      try {
        console.log(`🔑 Resetting password...`);
        await client.users.updateUser(userId, {
          password: password,
        });
        console.log(`✅ Password updated successfully`);
      } catch (error: any) {
        console.warn(`⚠️  Could not update password: ${error.message}`);
        console.warn(`   Note: Password might need to meet Clerk's password requirements`);
      }

      console.log(`✅ User updated successfully!`);
      console.log(`\n📧 Email: ${email}`);
      console.log(`🔑 Password: ${password}`);
      console.log(`👤 Role: ${role}`);
      console.log(`\n✅ The user can now login successfully!`);
      console.log(`\n⚠️  IMPORTANT: If MFA is still required, disable it in Clerk Dashboard:`);
      console.log(`   Settings → Multi-factor Authentication → Disable "Require MFA"`);
      return;
    }

    console.log(`👤 Creating new user in Clerk...`);

    // Create new user in Clerk
    // Note: Email is stored in lowercase internally
    const newUser = await client.users.createUser({
      emailAddress: [email.toLowerCase()],
      password: password,
      firstName: firstName,
      lastName: lastName || firstName,
      publicMetadata: {
        role: role,
      },
      unsafeMetadata: {
        role: role,
      },
    } as any); // Using 'as any' to bypass strict type checking for optional Clerk params

    // Remove MFA methods immediately after creation if any
    try {
      const mfaMethods = await (client.users as any).getMfaMethods({ userId: newUser.id });
      if (mfaMethods && Array.isArray(mfaMethods) && mfaMethods.length > 0) {
        for (const method of mfaMethods) {
          try {
            await (client.users as any).deleteMfaMethod({ userId: newUser.id, methodId: method.id });
            console.log(`   ✅ Removed MFA method: ${method.type}`);
          } catch (delError: any) {
            // Ignore if can't remove
          }
        }
      }
    } catch (mfaError: any) {
      // MFA API may not be available, continue anyway
    }

    console.log(`✅ User created successfully in Clerk!`);
    console.log(`\n📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`👤 Role: ${role}`);
    console.log(`🆔 Clerk User ID: ${newUser.id}`);
    console.log(`\n✅ The user can now login successfully!`);
    console.log(`\n⚠️  IMPORTANT: Disable MFA in Clerk Dashboard to prevent MFA prompts:`);
    console.log(`   1. Go to Clerk Dashboard (https://dashboard.clerk.com)`);
    console.log(`   2. Navigate to: Settings → Multi-factor Authentication`);
    console.log(`   3. Disable "Require MFA" or set it to "Optional"`);
    console.log(`   4. Save changes`);

  } catch (error: any) {
    console.error('❌ Error creating/updating user in Clerk:', error);
    if (error.errors) {
      error.errors.forEach((err: any) => {
        console.error(`   - ${err.message || JSON.stringify(err)}`);
      });
    } else {
      console.error(`   ${error.message || JSON.stringify(error)}`);
    }
    process.exit(1);
  }
}

// Run both Prisma and Clerk setup
async function main() {
  // First setup Prisma
  await setupPrismaUser();

  // Then setup Clerk
  await createClerkUser();
}

main()
  .catch((e) => {
    console.error('❌ Script failed:', e);
    process.exit(1);
  });

