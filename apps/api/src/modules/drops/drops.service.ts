import { prisma } from '../../db/prisma.js';

export async function listDrops() {
  const drops = await prisma.drop.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      purchases: {
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { user: { select: { username: true } } }
      }
    }
  });

  return drops.map((drop) => ({
    id: drop.id,
    name: drop.name,
    totalStock: drop.totalStock,
    availableStock: drop.availableStock,
    startsAt: drop.startsAt.toISOString(),
    endsAt: drop.endsAt?.toISOString() ?? null,
    latestPurchasers: drop.purchases.map((purchase) => ({
      username: purchase.user.username,
      purchasedAt: purchase.createdAt.toISOString()
    }))
  }));
}

export async function getLatestPurchasers(dropId: string) {
  const purchases = await prisma.purchase.findMany({
    where: { dropId },
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: { user: { select: { username: true } } }
  });

  return purchases.map((purchase) => ({
    username: purchase.user.username,
    purchasedAt: purchase.createdAt.toISOString()
  }));
}

export async function createDrop(input: { name: string; totalStock: number; startsAt: Date; endsAt?: Date }) {
  return prisma.drop.create({
    data: {
      name: input.name,
      totalStock: input.totalStock,
      availableStock: input.totalStock,
      startsAt: input.startsAt,
      endsAt: input.endsAt
    }
  });
}
