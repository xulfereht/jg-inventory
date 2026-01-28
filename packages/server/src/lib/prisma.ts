import { PrismaClient } from "@prisma/client";
import { existsSync } from "fs";
import { join, dirname } from "path";

// Ensure DATABASE_URL is set for packaged exe
if (!process.env.DATABASE_URL) {
  const possiblePaths = [
    join(process.cwd(), "data.db"),
    join(dirname(process.execPath), "data.db"),
  ];

  for (const dbPath of possiblePaths) {
    // Use the first valid location (or create at first path)
    process.env.DATABASE_URL = `file:${dbPath}`;
    break;
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
