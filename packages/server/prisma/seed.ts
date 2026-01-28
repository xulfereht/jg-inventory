import { PrismaClient } from "@prisma/client";
import { addDays, subDays, format } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  await prisma.openEvent.deleteMany();
  await prisma.countItem.deleteMany();
  await prisma.inventoryCount.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.lot.deleteMany();
  await prisma.item.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.auditLog.deleteMany();

  // Create suppliers
  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        name: "동의한약방",
        contact: "김동의 02-1234-5678",
      },
    }),
    prisma.supplier.create({
      data: {
        name: "청명약업",
        contact: "이청명 031-9876-5432",
      },
    }),
    prisma.supplier.create({
      data: {
        name: "제일한약재",
        contact: "박제일 053-1111-2222",
      },
    }),
  ]);

  console.log(`Created ${suppliers.length} suppliers`);

  // Create items (Korean herbal medicines)
  const itemsData = [
    { name: "황기", openUnit: "봉", safetyStock: 5, isFavorite: true },
    { name: "당귀", openUnit: "봉", safetyStock: 5, isFavorite: true },
    { name: "인삼", openUnit: "근", safetyStock: 3, isFavorite: true },
    { name: "감초", openUnit: "봉", safetyStock: 10, isFavorite: false },
    { name: "백출", openUnit: "봉", safetyStock: 5, isFavorite: false },
    { name: "복령", openUnit: "봉", safetyStock: 5, isFavorite: false },
    { name: "천궁", openUnit: "봉", safetyStock: 5, isFavorite: true },
    { name: "백작약", openUnit: "봉", safetyStock: 5, isFavorite: false },
    { name: "숙지황", openUnit: "봉", safetyStock: 5, isFavorite: false },
    { name: "진피", openUnit: "봉", safetyStock: 8, isFavorite: false },
    { name: "대추", openUnit: "박스", safetyStock: 2, isFavorite: false },
    { name: "생강", openUnit: "kg", safetyStock: 3, isFavorite: false },
  ];

  const items = await Promise.all(
    itemsData.map((data) => prisma.item.create({ data }))
  );

  console.log(`Created ${items.length} items`);

  // Create lots with various scenarios
  const now = new Date();
  const lotsData = [
    // 황기 - 여러 로트, 하나는 만료 임박
    { item: items[0], supplier: suppliers[0], initialQty: 10, daysAgo: 30, expiryDays: 365 },
    { item: items[0], supplier: suppliers[1], initialQty: 5, daysAgo: 7, expiryDays: 20 }, // 만료 임박
    // 당귀
    { item: items[1], supplier: suppliers[0], initialQty: 8, daysAgo: 14, expiryDays: 300 },
    // 인삼 - 고가 품목
    { item: items[2], supplier: suppliers[2], initialQty: 3, daysAgo: 5, expiryDays: 730, unitPrice: 150000 },
    // 감초 - 충분한 재고
    { item: items[3], supplier: suppliers[0], initialQty: 20, daysAgo: 60, expiryDays: 400 },
    // 백출
    { item: items[4], supplier: suppliers[1], initialQty: 7, daysAgo: 21, expiryDays: 350 },
    // 복령
    { item: items[5], supplier: suppliers[0], initialQty: 6, daysAgo: 10, expiryDays: 380 },
    // 천궁 - 재고 부족
    { item: items[6], supplier: suppliers[2], initialQty: 2, daysAgo: 45, expiryDays: 300 },
    // 백작약
    { item: items[7], supplier: suppliers[1], initialQty: 9, daysAgo: 28, expiryDays: 320 },
    // 숙지황 - 만료됨
    { item: items[8], supplier: suppliers[0], initialQty: 4, daysAgo: 400, expiryDays: -10 },
    // 진피
    { item: items[9], supplier: suppliers[2], initialQty: 15, daysAgo: 35, expiryDays: 450 },
    // 대추
    { item: items[10], supplier: suppliers[1], initialQty: 5, daysAgo: 20, expiryDays: 180 },
    // 생강 - 재고 없음 (다 소진)
    { item: items[11], supplier: suppliers[0], initialQty: 3, daysAgo: 90, expiryDays: 30, consumed: true },
  ];

  const lots = await Promise.all(
    lotsData.map((data) =>
      prisma.lot.create({
        data: {
          itemId: data.item.id,
          supplierId: data.supplier.id,
          purchaseDate: subDays(now, data.daysAgo),
          expiryDate: addDays(now, data.expiryDays),
          initialQty: data.initialQty,
          unopenedQty: data.consumed ? 0 : data.initialQty,
          unitPrice: data.unitPrice || Math.floor(Math.random() * 30000) + 10000,
          origin: ["국산", "중국산", "국산"][Math.floor(Math.random() * 3)],
        },
      })
    )
  );

  console.log(`Created ${lots.length} lots`);

  // Create some open events
  const openEventsData = [
    { item: items[0], lot: lots[0], qty: 2 },
    { item: items[0], lot: lots[0], qty: 1 },
    { item: items[1], lot: lots[2], qty: 1 },
    { item: items[3], lot: lots[4], qty: 3 },
    { item: items[6], lot: lots[7], qty: 1 },
  ];

  for (const data of openEventsData) {
    await prisma.openEvent.create({
      data: {
        itemId: data.item.id,
        lotId: data.lot.id,
        quantity: data.qty,
      },
    });
    await prisma.lot.update({
      where: { id: data.lot.id },
      data: { unopenedQty: { decrement: data.qty } },
    });
  }

  console.log(`Created ${openEventsData.length} open events`);

  // Evaluate alerts
  const alertsToCreate: {
    type: string;
    itemId?: string;
    lotId?: string;
    message: string;
    status: string;
  }[] = [];

  // Check for low stock
  for (const item of items) {
    const totalStock = await prisma.lot.aggregate({
      where: { itemId: item.id },
      _sum: { unopenedQty: true },
    });
    const currentStock = totalStock._sum.unopenedQty || 0;
    if (currentStock <= item.safetyStock && currentStock > 0) {
      alertsToCreate.push({
        type: "low_stock",
        itemId: item.id,
        message: `${item.name} 재고가 안전재고(${item.safetyStock}) 이하입니다. 현재: ${currentStock}${item.openUnit}`,
        status: "active",
      });
    }
  }

  // Check for expiring lots
  const expiringLots = await prisma.lot.findMany({
    where: {
      unopenedQty: { gt: 0 },
      expiryDate: { lte: addDays(now, 30), gt: now },
    },
    include: { item: true },
  });

  for (const lot of expiringLots) {
    alertsToCreate.push({
      type: "expiring_soon",
      itemId: lot.itemId,
      lotId: lot.id,
      message: `${lot.item.name} 로트가 30일 내 만료됩니다. 유효기간: ${format(lot.expiryDate!, "yyyy-MM-dd")}`,
      status: "active",
    });
  }

  // Check for expired lots
  const expiredLots = await prisma.lot.findMany({
    where: {
      unopenedQty: { gt: 0 },
      expiryDate: { lt: now },
    },
    include: { item: true },
  });

  for (const lot of expiredLots) {
    alertsToCreate.push({
      type: "expired",
      itemId: lot.itemId,
      lotId: lot.id,
      message: `${lot.item.name} 로트가 만료되었습니다. 유효기간: ${format(lot.expiryDate!, "yyyy-MM-dd")}`,
      status: "active",
    });
  }

  await prisma.alert.createMany({ data: alertsToCreate });
  console.log(`Created ${alertsToCreate.length} alerts`);

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
