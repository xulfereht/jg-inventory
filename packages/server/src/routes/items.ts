import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../lib/prisma.js";
import { createAuditLog } from "../lib/audit.js";
import { CreateItemSchema, UpdateItemSchema } from "../lib/schemas.js";

export const itemRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/items - List items (query: search, favorite), favorites first
  app.get<{
    Querystring: { search?: string; favorite?: string };
  }>("/items", async (request, reply) => {
    const { search, favorite } = request.query;

    const where: Record<string, unknown> = {};

    if (favorite === "true") {
      where.isFavorite = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { synonyms: { contains: search } },
      ];
    }

    const items = await prisma.item.findMany({
      where,
      include: {
        lots: {
          select: { unopenedQty: true },
        },
      },
      orderBy: [{ isFavorite: "desc" }, { name: "asc" }],
    });

    const result = items.map((item) => {
      const currentStock = item.lots.reduce(
        (sum, lot) => sum + lot.unopenedQty,
        0
      );
      const { lots, synonyms, ...rest } = item;
      return {
        ...rest,
        synonyms: synonyms ? JSON.parse(synonyms) : [],
        currentStock,
      };
    });

    return reply.send(result);
  });

  // GET /api/items/autocomplete - Autocomplete (query: q), max 10 results
  app.get<{
    Querystring: { q?: string };
  }>("/items/autocomplete", async (request, reply) => {
    const { q } = request.query;

    if (!q || q.length === 0) {
      return reply.send([]);
    }

    const items = await prisma.item.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { synonyms: { contains: q } },
        ],
      },
      select: { id: true, name: true, synonyms: true },
      take: 10,
      orderBy: { name: "asc" },
    });

    const result = items.map((item) => ({
      ...item,
      synonyms: item.synonyms ? JSON.parse(item.synonyms) : [],
    }));

    return reply.send(result);
  });

  // GET /api/items/:id - Get item with currentStock
  app.get<{
    Params: { id: string };
  }>("/items/:id", async (request, reply) => {
    const { id } = request.params;

    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        lots: {
          select: { unopenedQty: true },
        },
      },
    });

    if (!item) {
      return reply.status(404).send({ error: "품목을 찾을 수 없습니다" });
    }

    const currentStock = item.lots.reduce(
      (sum, lot) => sum + lot.unopenedQty,
      0
    );
    const { lots, synonyms, ...rest } = item;

    return reply.send({
      ...rest,
      synonyms: synonyms ? JSON.parse(synonyms) : [],
      currentStock,
    });
  });

  // POST /api/items - Create item
  app.post("/items", async (request, reply) => {
    const parsed = CreateItemSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const { synonyms, ...data } = parsed.data;

    // Check unique name
    const existing = await prisma.item.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      return reply
        .status(409)
        .send({ error: `'${data.name}' 품목이 이미 존재합니다` });
    }

    const item = await prisma.item.create({
      data: {
        ...data,
        synonyms: synonyms ? JSON.stringify(synonyms) : null,
      },
    });

    await createAuditLog({
      action: "CREATE",
      entity: "Item",
      entityId: item.id,
      after: item,
    });

    return reply.status(201).send({
      ...item,
      synonyms: item.synonyms ? JSON.parse(item.synonyms) : [],
    });
  });

  // PUT /api/items/:id - Update item
  app.put<{
    Params: { id: string };
  }>("/items/:id", async (request, reply) => {
    const { id } = request.params;
    const parsed = UpdateItemSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const existing = await prisma.item.findUnique({ where: { id } });

    if (!existing) {
      return reply.status(404).send({ error: "품목을 찾을 수 없습니다" });
    }

    const { synonyms, ...data } = parsed.data;

    // If name is being changed, check uniqueness
    if (data.name && data.name !== existing.name) {
      const duplicate = await prisma.item.findUnique({
        where: { name: data.name },
      });
      if (duplicate) {
        return reply
          .status(409)
          .send({ error: `'${data.name}' 품목이 이미 존재합니다` });
      }
    }

    const updateData: Record<string, unknown> = { ...data };
    if (synonyms !== undefined) {
      updateData.synonyms = synonyms ? JSON.stringify(synonyms) : null;
    }

    const updated = await prisma.item.update({
      where: { id },
      data: updateData,
    });

    await createAuditLog({
      action: "UPDATE",
      entity: "Item",
      entityId: id,
      before: existing,
      after: updated,
    });

    return reply.send({
      ...updated,
      synonyms: updated.synonyms ? JSON.parse(updated.synonyms) : [],
    });
  });

  // DELETE /api/items/:id - Delete item
  app.delete<{
    Params: { id: string };
  }>("/items/:id", async (request, reply) => {
    const { id } = request.params;

    const existing = await prisma.item.findUnique({ where: { id } });

    if (!existing) {
      return reply.status(404).send({ error: "품목을 찾을 수 없습니다" });
    }

    await prisma.item.delete({ where: { id } });

    await createAuditLog({
      action: "DELETE",
      entity: "Item",
      entityId: id,
      before: existing,
    });

    return reply.status(204).send();
  });

  // PATCH /api/items/:id/favorite - Toggle favorite
  app.patch<{
    Params: { id: string };
  }>("/items/:id/favorite", async (request, reply) => {
    const { id } = request.params;

    const existing = await prisma.item.findUnique({ where: { id } });

    if (!existing) {
      return reply.status(404).send({ error: "품목을 찾을 수 없습니다" });
    }

    const updated = await prisma.item.update({
      where: { id },
      data: { isFavorite: !existing.isFavorite },
    });

    await createAuditLog({
      action: "UPDATE",
      entity: "Item",
      entityId: id,
      before: { isFavorite: existing.isFavorite },
      after: { isFavorite: updated.isFavorite },
    });

    return reply.send({
      ...updated,
      synonyms: updated.synonyms ? JSON.parse(updated.synonyms) : [],
    });
  });
};
