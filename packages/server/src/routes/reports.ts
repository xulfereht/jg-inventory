import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { startOfMonth, endOfMonth, format, addDays } from "date-fns";

export async function reportRoutes(app: FastifyInstance) {
  // GET /api/reports/supplier-monthly - 구매처별 월간 리포트
  app.get("/reports/supplier-monthly", async (request) => {
    const { year, month } = request.query as { year?: string; month?: string };

    const now = new Date();
    const targetYear = year ? parseInt(year, 10) : now.getFullYear();
    const targetMonth = month ? parseInt(month, 10) - 1 : now.getMonth();

    const startDate = startOfMonth(new Date(targetYear, targetMonth));
    const endDate = endOfMonth(new Date(targetYear, targetMonth));

    // 해당 월에 입고된 로트들
    const lots = await prisma.lot.findMany({
      where: {
        purchaseDate: { gte: startDate, lte: endDate },
      },
      include: {
        item: { select: { id: true, name: true, openUnit: true } },
        supplier: { select: { id: true, name: true } },
      },
    });

    // 구매처별 집계
    const supplierMap = new Map<string, {
      supplierId: string;
      supplierName: string;
      totalQty: number;
      totalAmount: number;
      lotCount: number;
      items: Map<string, { itemId: string; itemName: string; qty: number; amount: number }>;
    }>();

    for (const lot of lots) {
      const supplierId = lot.supplierId || "unknown";
      const supplierName = lot.supplier?.name || "미지정";

      if (!supplierMap.has(supplierId)) {
        supplierMap.set(supplierId, {
          supplierId,
          supplierName,
          totalQty: 0,
          totalAmount: 0,
          lotCount: 0,
          items: new Map(),
        });
      }

      const s = supplierMap.get(supplierId)!;
      s.totalQty += lot.initialQty;
      s.totalAmount += (lot.unitPrice || 0) * lot.initialQty;
      s.lotCount += 1;

      const itemKey = lot.itemId;
      if (!s.items.has(itemKey)) {
        s.items.set(itemKey, {
          itemId: lot.itemId,
          itemName: lot.item.name,
          qty: 0,
          amount: 0,
        });
      }
      const itemData = s.items.get(itemKey)!;
      itemData.qty += lot.initialQty;
      itemData.amount += (lot.unitPrice || 0) * lot.initialQty;
    }

    const result = Array.from(supplierMap.values()).map((s) => ({
      supplierId: s.supplierId,
      supplierName: s.supplierName,
      totalQty: s.totalQty,
      totalAmount: s.totalAmount,
      avgUnitPrice: s.totalQty > 0 ? Math.round(s.totalAmount / s.totalQty) : 0,
      lotCount: s.lotCount,
      items: Array.from(s.items.values()),
    }));

    return {
      period: `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}`,
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
      suppliers: result.sort((a, b) => b.totalAmount - a.totalAmount),
      summary: {
        totalSuppliers: result.length,
        totalLots: lots.length,
        totalQty: result.reduce((sum, s) => sum + s.totalQty, 0),
        totalAmount: result.reduce((sum, s) => sum + s.totalAmount, 0),
      },
    };
  });

  // GET /api/reports/expiry-risk - 만료 위험 목록
  app.get("/reports/expiry-risk", async (request) => {
    const { days } = request.query as { days?: string };
    const daysAhead = days ? parseInt(days, 10) : 60;
    const now = new Date();
    const threshold = addDays(now, daysAhead);

    const lots = await prisma.lot.findMany({
      where: {
        unopenedQty: { gt: 0 },
        expiryDate: { not: null, lte: threshold },
      },
      include: {
        item: { select: { id: true, name: true, openUnit: true } },
        supplier: { select: { id: true, name: true } },
      },
      orderBy: { expiryDate: "asc" },
    });

    const result = lots.map((lot) => {
      const expiryDate = new Date(lot.expiryDate!);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        lotId: lot.id,
        itemId: lot.itemId,
        itemName: lot.item.name,
        openUnit: lot.item.openUnit,
        supplierName: lot.supplier?.name || "미지정",
        unopenedQty: lot.unopenedQty,
        expiryDate: format(expiryDate, "yyyy-MM-dd"),
        daysUntilExpiry,
        status: daysUntilExpiry < 0 ? "expired" : daysUntilExpiry <= 30 ? "critical" : "warning",
        estimatedLoss: (lot.unitPrice || 0) * lot.unopenedQty,
      };
    });

    const expired = result.filter((r) => r.status === "expired");
    const critical = result.filter((r) => r.status === "critical");
    const warning = result.filter((r) => r.status === "warning");

    return {
      daysAhead,
      lots: result,
      summary: {
        total: result.length,
        expired: expired.length,
        critical: critical.length,
        warning: warning.length,
        totalQty: result.reduce((sum, r) => sum + r.unopenedQty, 0),
        estimatedTotalLoss: result.reduce((sum, r) => sum + r.estimatedLoss, 0),
      },
    };
  });

  // GET /api/reports/inventory-status - 재고 현황 리포트
  app.get("/reports/inventory-status", async () => {
    const items = await prisma.item.findMany({
      include: {
        lots: {
          where: { unopenedQty: { gt: 0 } },
          include: { supplier: { select: { name: true } } },
        },
      },
      orderBy: { name: "asc" },
    });

    const now = new Date();

    const result = items.map((item) => {
      const currentStock = item.lots.reduce((sum, lot) => sum + lot.unopenedQty, 0);
      const totalValue = item.lots.reduce((sum, lot) => sum + (lot.unitPrice || 0) * lot.unopenedQty, 0);

      const expiringLots = item.lots.filter((lot) => {
        if (!lot.expiryDate) return false;
        const daysUntil = Math.ceil((new Date(lot.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntil <= 30 && daysUntil > 0;
      });

      const expiredLots = item.lots.filter((lot) => {
        if (!lot.expiryDate) return false;
        return new Date(lot.expiryDate) < now;
      });

      return {
        itemId: item.id,
        itemName: item.name,
        openUnit: item.openUnit,
        safetyStock: item.safetyStock,
        currentStock,
        stockStatus: currentStock === 0 ? "out" : currentStock <= item.safetyStock ? "low" : "ok",
        lotCount: item.lots.length,
        totalValue,
        expiringQty: expiringLots.reduce((sum, lot) => sum + lot.unopenedQty, 0),
        expiredQty: expiredLots.reduce((sum, lot) => sum + lot.unopenedQty, 0),
      };
    });

    const outOfStock = result.filter((r) => r.stockStatus === "out");
    const lowStock = result.filter((r) => r.stockStatus === "low");

    return {
      generatedAt: format(now, "yyyy-MM-dd HH:mm:ss"),
      items: result,
      summary: {
        totalItems: result.length,
        outOfStock: outOfStock.length,
        lowStock: lowStock.length,
        totalValue: result.reduce((sum, r) => sum + r.totalValue, 0),
        totalExpiringQty: result.reduce((sum, r) => sum + r.expiringQty, 0),
        totalExpiredQty: result.reduce((sum, r) => sum + r.expiredQty, 0),
      },
    };
  });

  // GET /api/reports/export/inventory - 엑셀용 데이터 (JSON)
  app.get("/reports/export/inventory", async () => {
    const items = await prisma.item.findMany({
      include: {
        lots: {
          include: { supplier: { select: { name: true } } },
          orderBy: { purchaseDate: "desc" },
        },
      },
      orderBy: { name: "asc" },
    });

    // 플랫 구조로 변환 (엑셀 호환)
    const rows: Record<string, unknown>[] = [];

    for (const item of items) {
      if (item.lots.length === 0) {
        rows.push({
          품목명: item.name,
          단위: item.openUnit,
          안전재고: item.safetyStock,
          로트ID: "",
          구매처: "",
          구입일자: "",
          유효기간: "",
          원산지: "",
          단가: "",
          초기수량: "",
          현재수량: "",
        });
      } else {
        for (const lot of item.lots) {
          rows.push({
            품목명: item.name,
            단위: item.openUnit,
            안전재고: item.safetyStock,
            로트ID: lot.id,
            구매처: lot.supplier?.name || "",
            구입일자: lot.purchaseDate ? format(new Date(lot.purchaseDate), "yyyy-MM-dd") : "",
            유효기간: lot.expiryDate ? format(new Date(lot.expiryDate), "yyyy-MM-dd") : "",
            원산지: lot.origin || "",
            단가: lot.unitPrice || "",
            초기수량: lot.initialQty,
            현재수량: lot.unopenedQty,
          });
        }
      }
    }

    return {
      filename: `inventory-${format(new Date(), "yyyyMMdd")}.json`,
      headers: ["품목명", "단위", "안전재고", "로트ID", "구매처", "구입일자", "유효기간", "원산지", "단가", "초기수량", "현재수량"],
      rows,
    };
  });
}
