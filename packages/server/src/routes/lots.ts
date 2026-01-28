import type { FastifyPluginAsync } from "fastify";
import { addDays, isBefore } from "date-fns";
import { prisma } from "../lib/prisma.js";
import { createAuditLog } from "../lib/audit.js";
import { CreateLotSchema, UpdateLotSchema } from "../lib/schemas.js";

function addExpiryFlags<T extends { expiryDate: Date | null }>(
  lot: T
): T & { isExpiringSoon: boolean; isExpired: boolean } {
  const now = new Date();
  const thirtyDaysFromNow = addDays(now, 30);

  const isExpired = lot.expiryDate ? isBefore(lot.expiryDate, now) : false;
  const isExpiringSoon =
    lot.expiryDate && !isExpired
      ? isBefore(lot.expiryDate, thirtyDaysFromNow)
      : false;

  return { ...lot, isExpiringSoon, isExpired };
}

export const lotRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/lots - List lots (query: itemId)
  app.get<{
    Querystring: { itemId?: string };
  }>("/lots", async (request, reply) => {
    const { itemId } = request.query;

    const where: Record<string, unknown> = {};
    if (itemId) {
      where.itemId = itemId;
    }

    const lots = await prisma.lot.findMany({
      where,
      include: {
        item: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
      orderBy: { purchaseDate: "desc" },
    });

    const result = lots.map(addExpiryFlags);

    return reply.send(result);
  });

  // GET /api/lots/:id - Get lot with item and supplier info
  app.get<{
    Params: { id: string };
  }>("/lots/:id", async (request, reply) => {
    const { id } = request.params;

    const lot = await prisma.lot.findUnique({
      where: { id },
      include: {
        item: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
    });

    if (!lot) {
      return reply.status(404).send({ error: "로트를 찾을 수 없습니다" });
    }

    return reply.send(addExpiryFlags(lot));
  });

  // POST /api/lots - Create lot
  app.post("/lots", async (request, reply) => {
    const parsed = CreateLotSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const { itemId, initialQty, ...data } = parsed.data;

    // Validate item exists
    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) {
      return reply.status(404).send({ error: "품목을 찾을 수 없습니다" });
    }

    // Validate supplier exists if provided
    if (data.supplierId) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: data.supplierId },
      });
      if (!supplier) {
        return reply.status(404).send({ error: "거래처를 찾을 수 없습니다" });
      }
    }

    const lot = await prisma.lot.create({
      data: {
        ...data,
        itemId,
        initialQty,
        unopenedQty: initialQty, // Set unopenedQty = initialQty
      },
      include: {
        item: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      action: "CREATE",
      entity: "Lot",
      entityId: lot.id,
      after: lot,
    });

    return reply.status(201).send(addExpiryFlags(lot));
  });

  // PUT /api/lots/:id - Update lot (cannot change initialQty/unopenedQty)
  app.put<{
    Params: { id: string };
  }>("/lots/:id", async (request, reply) => {
    const { id } = request.params;
    const parsed = UpdateLotSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const existing = await prisma.lot.findUnique({ where: { id } });

    if (!existing) {
      return reply.status(404).send({ error: "로트를 찾을 수 없습니다" });
    }

    // Validate supplier exists if provided
    if (parsed.data.supplierId) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: parsed.data.supplierId },
      });
      if (!supplier) {
        return reply.status(404).send({ error: "거래처를 찾을 수 없습니다" });
      }
    }

    const updated = await prisma.lot.update({
      where: { id },
      data: parsed.data,
      include: {
        item: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      action: "UPDATE",
      entity: "Lot",
      entityId: id,
      before: existing,
      after: updated,
    });

    return reply.send(addExpiryFlags(updated));
  });

  // DELETE /api/lots/:id - Delete lot
  app.delete<{
    Params: { id: string };
  }>("/lots/:id", async (request, reply) => {
    const { id } = request.params;

    const existing = await prisma.lot.findUnique({ where: { id } });

    if (!existing) {
      return reply.status(404).send({ error: "로트를 찾을 수 없습니다" });
    }

    await prisma.lot.delete({ where: { id } });

    await createAuditLog({
      action: "DELETE",
      entity: "Lot",
      entityId: id,
      before: existing,
    });

    return reply.status(204).send();
  });

  // GET /api/items/:itemId/lots - Get lots by item (sorted by purchaseDate desc)
  app.get<{
    Params: { itemId: string };
  }>("/items/:itemId/lots", async (request, reply) => {
    const { itemId } = request.params;

    // Validate item exists
    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) {
      return reply.status(404).send({ error: "품목을 찾을 수 없습니다" });
    }

    const lots = await prisma.lot.findMany({
      where: { itemId },
      include: {
        supplier: { select: { id: true, name: true } },
      },
      orderBy: { purchaseDate: "desc" },
    });

    const result = lots.map(addExpiryFlags);

    return reply.send(result);
  });
};
