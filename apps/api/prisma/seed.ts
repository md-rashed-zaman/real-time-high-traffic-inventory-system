import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = ['alex', 'mira', 'sam', 'jules'];

  for (const username of users) {
    await prisma.user.upsert({
      where: { username },
      update: {},
      create: { username }
    });
  }

  const drops = [
    { name: 'Air Jordan 1 Retro High OG', totalStock: 100 },
    { name: 'Nike Dunk Low Limited', totalStock: 50 },
    { name: 'Yeezy Boost Archive Pair', totalStock: 25 }
  ];

  for (const drop of drops) {
    const existing = await prisma.drop.findFirst({ where: { name: drop.name } });

    if (!existing) {
      await prisma.drop.create({
        data: {
          ...drop,
          availableStock: drop.totalStock,
          startsAt: new Date(Date.now() - 1000)
        }
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
