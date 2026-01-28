import { prisma } from "./prisma.js";

export async function createAuditLog(params: {
  action: string;
  entity: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  userId?: string;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      before: params.before ? JSON.stringify(params.before) : null,
      after: params.after ? JSON.stringify(params.after) : null,
      userId: params.userId ?? null,
    },
  });
}
