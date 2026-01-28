import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../lib/prisma.js";
import { createAuditLog } from "../lib/audit.js";
import { CreateSupplierSchema, UpdateSupplierSchema } from "../lib/schemas.js";

export const supplierRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/suppliers - List suppliers
  app.get("/suppliers", async (_request, reply) => {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: "asc" },
    });
    return reply.send(suppliers);
  });

  // GET /api/suppliers/:id - Get supplier
  app.get<{
    Params: { id: string };
  }>("/suppliers/:id", async (request, reply) => {
    const { id } = request.params;

    const supplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!supplier) {
      return reply.status(404).send({ error: "거래처를 찾을 수 없습니다" });
    }

    return reply.send(supplier);
  });

  // POST /api/suppliers - Create supplier
  app.post("/suppliers", async (request, reply) => {
    const parsed = CreateSupplierSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const { name } = parsed.data;

    // Check unique name
    const existing = await prisma.supplier.findUnique({
      where: { name },
    });

    if (existing) {
      return reply
        .status(409)
        .send({ error: `'${name}' 거래처가 이미 존재합니다` });
    }

    const supplier = await prisma.supplier.create({
      data: parsed.data,
    });

    await createAuditLog({
      action: "CREATE",
      entity: "Supplier",
      entityId: supplier.id,
      after: supplier,
    });

    return reply.status(201).send(supplier);
  });

  // PUT /api/suppliers/:id - Update supplier
  app.put<{
    Params: { id: string };
  }>("/suppliers/:id", async (request, reply) => {
    const { id } = request.params;
    const parsed = UpdateSupplierSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const existing = await prisma.supplier.findUnique({ where: { id } });

    if (!existing) {
      return reply.status(404).send({ error: "거래처를 찾을 수 없습니다" });
    }

    // If name is being changed, check uniqueness
    if (parsed.data.name && parsed.data.name !== existing.name) {
      const duplicate = await prisma.supplier.findUnique({
        where: { name: parsed.data.name },
      });
      if (duplicate) {
        return reply
          .status(409)
          .send({ error: `'${parsed.data.name}' 거래처가 이미 존재합니다` });
      }
    }

    const updated = await prisma.supplier.update({
      where: { id },
      data: parsed.data,
    });

    await createAuditLog({
      action: "UPDATE",
      entity: "Supplier",
      entityId: id,
      before: existing,
      after: updated,
    });

    return reply.send(updated);
  });

  // DELETE /api/suppliers/:id - Delete supplier
  app.delete<{
    Params: { id: string };
  }>("/suppliers/:id", async (request, reply) => {
    const { id } = request.params;

    const existing = await prisma.supplier.findUnique({ where: { id } });

    if (!existing) {
      return reply.status(404).send({ error: "거래처를 찾을 수 없습니다" });
    }

    await prisma.supplier.delete({ where: { id } });

    await createAuditLog({
      action: "DELETE",
      entity: "Supplier",
      entityId: id,
      before: existing,
    });

    return reply.status(204).send();
  });
};
