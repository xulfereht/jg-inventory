import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { CreateOpenEventSchema } from "../lib/schemas.js";
import { createOpenEvent, OpenEventError } from "../services/fefo.js";

export async function openEventRoutes(app: FastifyInstance) {
  // POST /api/open-events - 오픈 이벤트 생성 (FEFO 차감)
  app.post("/open-events", async (request, reply) => {
    const parsed = CreateOpenEventSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Bad Request",
        message: parsed.error.issues[0].message,
        statusCode: 400,
      });
    }

    try {
      const openEvent = await createOpenEvent(parsed.data);
      return reply.status(201).send(openEvent);
    } catch (err) {
      if (err instanceof OpenEventError) {
        return reply.status(err.statusCode).send({
          error: err.statusCode === 409 ? "Conflict" : "Bad Request",
          message: err.message,
          statusCode: err.statusCode,
        });
      }
      throw err;
    }
  });

  // GET /api/open-events - 오픈 이벤트 목록 (필터)
  app.get("/open-events", async (request) => {
    const { itemId, startDate, endDate, limit } = request.query as {
      itemId?: string;
      startDate?: string;
      endDate?: string;
      limit?: string;
    };

    const where: Record<string, unknown> = {};
    if (itemId) where.itemId = itemId;
    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      };
    }

    const events = await prisma.openEvent.findMany({
      where,
      include: {
        item: { select: { id: true, name: true, openUnit: true } },
        lot: {
          select: {
            id: true,
            expiryDate: true,
            supplier: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit ? parseInt(limit, 10) : 50,
    });

    return events;
  });

  // GET /api/items/:itemId/open-events - 품목별 오픈 이벤트
  app.get("/items/:itemId/open-events", async (request) => {
    const { itemId } = request.params as { itemId: string };

    const events = await prisma.openEvent.findMany({
      where: { itemId },
      include: {
        item: { select: { id: true, name: true, openUnit: true } },
        lot: {
          select: {
            id: true,
            expiryDate: true,
            purchaseDate: true,
            supplier: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return events;
  });
}
