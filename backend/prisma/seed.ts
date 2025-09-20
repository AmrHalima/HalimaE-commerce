import { PrismaClient } from '@prisma/client';
import * as arogn2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  await prisma.role.createMany({
    data: [
      { name: 'admin' },
      { name: 'employee' },
      { name: 'manager' },
    ],
    skipDuplicates: false,
  });

  const adminRole = await prisma.role.findFirst({ where: { name: 'admin' }, select: { id: true } });

  await prisma.user.create({
    data: {
        name: "admin",
        email: "admin@test.com",
        passwordHash: await arogn2.hash('123456789'),
        roleId: adminRole?.id
    }
  })
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });