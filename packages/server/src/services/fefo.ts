import { prisma } from "../lib/prisma.js";

/**
 * FEFO (First Expired, First Out) 로트 선택
 * 1. 유효기간이 있는 로트: expiryDate ASC (가장 빨리 만료되는 것 우선)
 * 2. 유효기간이 없는 로트: purchaseDate ASC (가장 오래된 것 우선)
 */
export async function selectFefoLot(itemId: string) {
  // 유효기간이 있는 로트 중 가장 빨리 만료되는 것
  const lotWithExpiry = await prisma.lot.findFirst({
    where: {
      itemId,
      unopenedQty: { gt: 0 },
      expiryDate: { not: null },
    },
    orderBy: { expiryDate: "asc" },
  });

  if (lotWithExpiry) return lotWithExpiry;

  // 유효기간이 없는 로트 중 가장 오래된 것 (FIFO fallback)
  const lotWithoutExpiry = await prisma.lot.findFirst({
    where: {
      itemId,
      unopenedQty: { gt: 0 },
      expiryDate: null,
    },
    orderBy: { purchaseDate: "asc" },
  });

  return lotWithoutExpiry;
}

/**
 * 오픈 이벤트 생성 + 로트 차감 (트랜잭션)
 */
export async function createOpenEvent(params: {
  itemId: string;
  lotId?: string;
  quantity: number;
  userId?: string;
  location?: string;
}) {
  const { itemId, lotId, quantity, userId, location } = params;

  // 품목 존재 확인
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) {
    throw new OpenEventError("품목이 존재하지 않습니다", 400);
  }

  // 로트 선택: 지정된 lotId 또는 FEFO
  let lot;
  if (lotId) {
    lot = await prisma.lot.findUnique({ where: { id: lotId } });
    if (!lot) {
      throw new OpenEventError("로트가 존재하지 않습니다", 400);
    }
    if (lot.itemId !== itemId) {
      throw new OpenEventError("로트가 해당 품목에 속하지 않습니다", 400);
    }
  } else {
    lot = await selectFefoLot(itemId);
  }

  if (!lot) {
    throw new OpenEventError("오픈 가능한 미개봉 재고가 없습니다", 409);
  }

  if (lot.unopenedQty < quantity) {
    throw new OpenEventError(
      `해당 로트의 미개봉 수량(${lot.unopenedQty})이 부족합니다`,
      409
    );
  }

  // 트랜잭션: OpenEvent 생성 + unopenedQty 차감
  const [openEvent] = await prisma.$transaction([
    prisma.openEvent.create({
      data: {
        itemId,
        lotId: lot.id,
        quantity,
        userId,
        location,
      },
      include: {
        lot: {
          include: {
            supplier: { select: { id: true, name: true } },
          },
        },
        item: { select: { id: true, name: true, openUnit: true } },
      },
    }),
    prisma.lot.update({
      where: { id: lot.id },
      data: { unopenedQty: { decrement: quantity } },
    }),
    prisma.auditLog.create({
      data: {
        action: "OPEN",
        entity: "OpenEvent",
        entityId: lot.id,
        userId,
        before: JSON.stringify({ unopenedQty: lot.unopenedQty }),
        after: JSON.stringify({ unopenedQty: lot.unopenedQty - quantity }),
      },
    }),
  ]);

  return openEvent;
}

export class OpenEventError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}
