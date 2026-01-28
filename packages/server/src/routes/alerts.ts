import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { addDays, isBefore } from "date-fns";

export async function alertRoutes(app: FastifyInstance) {
  // POST /api/alerts/evaluate - 알림 규칙 평가 및 생성
  app.post("/alerts/evaluate", async () => {
    const now = new Date();
    const alerts: { type: string; itemId?: string; lotId?: string; message: string }[] = [];

    // 1. 안전재고 이하 (low_stock)
    const items = await prisma.item.findMany({
      include: { lots: { select: { unopenedQty: true } } },
    });

    for (const item of items) {
      const currentStock = item.lots.reduce((sum, lot) => sum + lot.unopenedQty, 0);
      if (currentStock <= item.safetyStock) {
        alerts.push({
          type: "low_stock",
          itemId: item.id,
          message: `${item.name}: 재고 ${currentStock}${item.openUnit} (안전재고 ${item.safetyStock} 이하)`,
        });
      }
    }

    // 2. 만료 임박 (30일 이내) / 만료됨
    const lots = await prisma.lot.findMany({
      where: { unopenedQty: { gt: 0 }, expiryDate: { not: null } },
      include: { item: { select: { id: true, name: true, openUnit: true } } },
    });

    for (const lot of lots) {
      if (!lot.expiryDate) continue;
      const expiryDate = new Date(lot.expiryDate);

      if (isBefore(expiryDate, now)) {
        alerts.push({
          type: "expired",
          itemId: lot.itemId,
          lotId: lot.id,
          message: `${lot.item.name}: 유효기간 만료 (${lot.unopenedQty}${lot.item.openUnit})`,
        });
      } else if (isBefore(expiryDate, addDays(now, 30))) {
        alerts.push({
          type: "expiring_soon",
          itemId: lot.itemId,
          lotId: lot.id,
          message: `${lot.item.name}: 유효기간 30일 이내 (${lot.unopenedQty}${lot.item.openUnit})`,
        });
      }
    }

    // 3. 장기 미회전 (90일 이상 오픈 이벤트 없음)
    const deadStockThreshold = addDays(now, -90);
    for (const item of items) {
      const currentStock = item.lots.reduce((sum, lot) => sum + lot.unopenedQty, 0);
      if (currentStock === 0) continue;

      const lastOpen = await prisma.openEvent.findFirst({
        where: { itemId: item.id },
        orderBy: { createdAt: "desc" },
      });

      if (!lastOpen || isBefore(new Date(lastOpen.createdAt), deadStockThreshold)) {
        alerts.push({
          type: "dead_stock",
          itemId: item.id,
          message: `${item.name}: 90일 이상 미사용 (재고 ${currentStock}${item.openUnit})`,
        });
      }
    }

    // 기존 active 알림 중 중복 제거 후 새 알림 생성
    const existingAlerts = await prisma.alert.findMany({
      where: { status: "active" },
    });

    const existingKeys = new Set(
      existingAlerts.map((a) => `${a.type}-${a.itemId || ""}-${a.lotId || ""}`)
    );

    const newAlerts = alerts.filter(
      (a) => !existingKeys.has(`${a.type}-${a.itemId || ""}-${a.lotId || ""}`)
    );

    if (newAlerts.length > 0) {
      await prisma.alert.createMany({ data: newAlerts });
    }

    // 해결된 알림 자동 resolved 처리
    const currentKeys = new Set(
      alerts.map((a) => `${a.type}-${a.itemId || ""}-${a.lotId || ""}`)
    );

    const resolvedAlerts = existingAlerts.filter(
      (a) => !currentKeys.has(`${a.type}-${a.itemId || ""}-${a.lotId || ""}`)
    );

    if (resolvedAlerts.length > 0) {
      await prisma.alert.updateMany({
        where: { id: { in: resolvedAlerts.map((a) => a.id) } },
        data: { status: "resolved", resolvedAt: now },
      });
    }

    return {
      evaluated: alerts.length,
      created: newAlerts.length,
      resolved: resolvedAlerts.length,
    };
  });

  // GET /api/alerts - 알림 목록
  app.get("/alerts", async (request) => {
    const { status, type } = request.query as { status?: string; type?: string };
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.type = type;

    return prisma.alert.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  });

  // GET /api/alerts/summary - 알림 요약 (대시보드용)
  app.get("/alerts/summary", async () => {
    const active = await prisma.alert.groupBy({
      by: ["type"],
      where: { status: "active" },
      _count: true,
    });

    const summary = {
      total: 0,
      low_stock: 0,
      expiring_soon: 0,
      expired: 0,
      dead_stock: 0,
    };

    for (const a of active) {
      summary[a.type as keyof typeof summary] = a._count;
      summary.total += a._count;
    }

    return summary;
  });

  // PATCH /api/alerts/:id/acknowledge - 알림 확인
  app.patch("/alerts/:id/acknowledge", async (request, reply) => {
    const { id } = request.params as { id: string };

    const alert = await prisma.alert.findUnique({ where: { id } });
    if (!alert) {
      return reply.status(404).send({ error: "Not Found", message: "알림을 찾을 수 없습니다", statusCode: 404 });
    }

    return prisma.alert.update({
      where: { id },
      data: { status: "acknowledged" },
    });
  });

  // PATCH /api/alerts/:id/resolve - 알림 해결
  app.patch("/alerts/:id/resolve", async (request, reply) => {
    const { id } = request.params as { id: string };

    const alert = await prisma.alert.findUnique({ where: { id } });
    if (!alert) {
      return reply.status(404).send({ error: "Not Found", message: "알림을 찾을 수 없습니다", statusCode: 404 });
    }

    return prisma.alert.update({
      where: { id },
      data: { status: "resolved", resolvedAt: new Date() },
    });
  });
}
