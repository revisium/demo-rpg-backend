import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/__generated__/client';
import { getRequiredEnv } from '../../src/shared/config/env';

interface RoleConfig {
  id: string;
  name: string;
  level: number;
  permissions: Array<{ action: string; subject: string; condition?: Record<string, string> }>;
}

const ROLES: Record<string, RoleConfig> = {
  admin: {
    id: 'admin',
    name: 'Admin',
    level: 0,
    permissions: [{ action: 'manage', subject: 'all' }],
  },
  user: {
    id: 'user',
    name: 'User',
    level: 1,
    permissions: [
      { action: 'read', subject: 'Task' },
      { action: 'create', subject: 'Task' },
      { action: 'update', subject: 'Task', condition: { userId: '${userId}' } },
      { action: 'delete', subject: 'Task', condition: { userId: '${userId}' } },
    ],
  },
};

async function main() {
  const adapter = new PrismaPg({ connectionString: getRequiredEnv('DATABASE_URL') });
  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.$connect();

    for (const roleData of Object.values(ROLES)) {
      await prisma.role.upsert({
        where: { id: roleData.id },
        update: {},
        create: {
          id: roleData.id,
          name: roleData.name,
          level: roleData.level,
          permissions: {
            create: roleData.permissions.map((p) => ({
              action: p.action,
              subject: p.subject,
              condition: p.condition ? structuredClone(p.condition) : undefined,
            })),
          },
        },
      });
    }

    const adminPassword = getRequiredEnv('ADMIN_PASSWORD');
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        username: 'admin',
        password: hashedPassword,
        roleId: 'admin',
      },
    });

    console.warn('Seed completed successfully');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
