import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { createAuditLog } from "../lib/audit.js";

const CreateCountSchema = z.object({
  countDate: z.string().transform((v) => new Date(v)),
  note: z.string().optional(),
});

const UpdateCountItemSchema = z.object({
  actualQty: z.number().int().min(0),
  note: z.string().optional(),
});

export async function inventoryCountRoutes(app: FastifyInstance) {
  // POST /api/inventory-counts - 실사 생성 (스냅샷)
  app.post("/inventory-counts", async (request, reply) => {
    const parsed = CreateCountSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Bad Request", message: parsed.error.issues[0].message, statusCode: 400 });
    }

    // 모든 품목의 현재 재고 스냅샷
    const items = await prisma.item.findMany({
      include: { lots: { select: { unopenedQty: true } } },
    });

    const count = await prisma.inventoryCount.create({
      data: {
        countDate: parsed.data.countDate,
        note: parsed.data.note,
        status: "draft",
        countItems: {
          create: items.map((item) => ({
            itemId: item.id,
            systemQty: item.lots.reduce((sum, lot) => sum + lot.unopenedQty, 0),
          })),
        },
      },
      include: {
        countItems: { include: { item: { select: { id: true, name: true, openUnit: true } } } },
      },
    });

    return reply.status(201).send(count);
  });

  // GET /api/inventory-counts - 실사 목록
  app.get("/inventory-counts", async (request) => {
    const { status } = request.query as { status?: string };
    const where = status ? { status } : {};

    return prisma.inventoryCount.findMany({
      where,
      include: {
        countItems: { include: { item: { select: { id: true, name: true, openUnit: true } } } },
      },
      orderBy: { countDate: "desc" },
    });
  });

  // GET /api/inventory-counts/:id - 실사 상세
  app.get("/inventory-counts/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const count = await prisma.inventoryCount.findUnique({
      where: { id },
      include: {
        countItems: {
          include: { item: { select: { id: true, name: true, openUnit: true, safetyStock: true } } },
          orderBy: { item: { name: "asc" } },
        },
      },
    });

    if (!count) {
      return reply.status(404).send({ error: "Not Found", message: "실사를 찾을 수 없습니다", statusCode: 404 });
    }

    return count;
  });

  // PATCH /api/inventory-counts/:id/items/:itemId - 실사 수량 입력
  app.patch("/inventory-counts/:countId/items/:itemId", async (request, reply) => {
    const { countId, itemId } = request.params as { countId: string; itemId: string };
    const parsed = UpdateCountItemSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Bad Request", message: parsed.error.issues[0].message, statusCode: 400 });
    }

    const countItem = await prisma.countItem.findFirst({
      where: { countId, itemId },
    });

    if (!countItem) {
      return reply.status(404).send({ error: "Not Found", message: "실사 항목을 찾을 수 없습니다", statusCode: 404 });
    }

    const { actualQty, note } = parsed.data;
    const difference = actualQty - countItem.systemQty;

    const updated = await prisma.countItem.update({
      where: { id: countItem.id },
      data: { actualQty, difference, note },
      include: { item: { select: { id: true, name: true, openUnit: true } } },
    });

    return updated;
  });

  // POST /api/inventory-counts/:id/submit - 실사 제출
  app.post("/inventory-counts/:id/submit", async (request, reply) => {
    const { id } = request.params as { id: string };

    const count = await prisma.inventoryCount.findUnique({
      where: { id },
      include: { countItems: true },
    });

    if (!count) {
      return reply.status(404).send({ error: "Not Found", message: "실사를 찾을 수 없습니다", statusCode: 404 });
    }

    if (count.status !== "draft") {
      return reply.status(400).send({ error: "Bad Request", message: "이미 제출된 실사입니다", statusCode: 400 });
    }

    // 모든 항목에 actualQty가 입력되었는지 확인
    const incomplete = count.countItems.filter((ci) => ci.actualQty === null);
    if (incomplete.length > 0) {
      return reply.status(400).send({
        error: "Bad Request",
        message: `${incomplete.length}개 품목의 실사 수량이 입력되지 않았습니다`,
        statusCode: 400,
      });
    }

    const updated = await prisma.inventoryCount.update({
      where: { id },
      data: { status: "submitted" },
    });

    return updated;
  });

  // POST /api/inventory-counts/:id/approve - 실사 승인 + 재고 조정
  app.post("/inventory-counts/:id/approve", async (request, reply) => {
    const { id } = request.params as { id: string };

    const count = await prisma.inventoryCount.findUnique({
      where: { id },
      include: {
        countItems: {
          include: { item: { include: { lots: { orderBy: { expiryDate: "asc" } } } } },
        },
      },
    });

    if (!count) {
      return reply.status(404).send({ error: "Not Found", message: "실사를 찾을 수 없습니다", statusCode: 404 });
    }

    if (count.status !== "submitted") {
      return reply.status(400).send({ error: "Bad Request", message: "제출된 실사만 승인할 수 있습니다", statusCode: 400 });
    }

    // 차이가 있는 항목만 조정
    const adjustments = count.countItems.filter((ci) => ci.difference !== 0 && ci.difference !== null);

    // 트랜잭션으로 재고 조정
    await prisma.$transaction(async (tx) => {
      for (const ci of adjustments) {
        const diff = ci.difference!;
        const item = ci.item;

        if (diff > 0) {
          // 재고 증가: 가장 최근 로트에 추가 (없으면 새 로트 생성)
          const latestLot = item.lots[item.lots.length - 1];
          if (latestLot) {
            await tx.lot.update({
              where: { id: latestLot.id },
              data: { unopenedQty: { increment: diff } },
            });
          } else {
            await tx.lot.create({
              data: {
                itemId: item.id,
                purchaseDate: new Date(),
                initialQty: diff,
                unopenedQty: diff,
                note: `실사 조정 (+${diff})`,
              },
            });
          }
        } else {
          // 재고 감소: FEFO 순서로 차감
          let remaining = Math.abs(diff);
          for (const lot of item.lots) {
            if (remaining <= 0) break;
            const deduct = Math.min(lot.unopenedQty, remaining);
            if (deduct > 0) {
              await tx.lot.update({
                where: { id: lot.id },
                data: { unopenedQty: { decrement: deduct } },
              });
              remaining -= deduct;
            }
          }
        }

        // 감사 로그
        await tx.auditLog.create({
          data: {
            action: "ADJUST",
            entity: "InventoryCount",
            entityId: id,
            before: JSON.stringify({ itemId: item.id, systemQty: ci.systemQty }),
            after: JSON.stringify({ itemId: item.id, actualQty: ci.actualQty, difference: diff }),
          },
        });
      }

      // 실사 상태 업데이트
      await tx.inventoryCount.update({
        where: { id },
        data: { status: "approved", approvedAt: new Date() },
      });
    });

    return { success: true, adjustedItems: adjustments.length };
  });

  // DELETE /api/inventory-counts/:id - 실사 삭제 (draft만)
  app.delete("/inventory-counts/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const count = await prisma.inventoryCount.findUnique({ where: { id } });
    if (!count) {
      return reply.status(404).send({ error: "Not Found", message: "실사를 찾을 수 없습니다", statusCode: 404 });
    }

    if (count.status !== "draft") {
      return reply.status(400).send({ error: "Bad Request", message: "진행중이거나 승인된 실사는 삭제할 수 없습니다", statusCode: 400 });
    }

    await prisma.inventoryCount.delete({ where: { id } });
    return { success: true };
  });
}
