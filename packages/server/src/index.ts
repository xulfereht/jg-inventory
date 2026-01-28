import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import fastifyStatic from "@fastify/static";
import { itemRoutes } from "./routes/items.js";
import { supplierRoutes } from "./routes/suppliers.js";
import { lotRoutes } from "./routes/lots.js";
import { openEventRoutes } from "./routes/open-events.js";
import { inventoryCountRoutes } from "./routes/inventory-counts.js";
import { alertRoutes } from "./routes/alerts.js";
import { reportRoutes } from "./routes/reports.js";

const PORT = Number(process.env.PORT) || 3100;
const HOST = process.env.HOST || "0.0.0.0";

// Resolve static files path (for packaged exe)
function getStaticPath(): string | null {
  // Try multiple locations
  const candidates = [
    join(process.cwd(), "public"),
    join(dirname(process.execPath), "public"),
    // @ts-ignore - __dirname may not exist in ESM
    typeof __dirname !== "undefined" ? join(__dirname, "public") : null,
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

async function main() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || "info",
      transport:
        process.env.NODE_ENV === "development"
          ? { target: "pino-pretty" }
          : undefined,
    },
  });

  // Plugins
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  });

  await app.register(cookie);

  // Routes
  await app.register(itemRoutes, { prefix: "/api" });
  await app.register(supplierRoutes, { prefix: "/api" });
  await app.register(lotRoutes, { prefix: "/api" });
  await app.register(openEventRoutes, { prefix: "/api" });
  await app.register(inventoryCountRoutes, { prefix: "/api" });
  await app.register(alertRoutes, { prefix: "/api" });
  await app.register(reportRoutes, { prefix: "/api" });

  // Health check
  app.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }));

  // Serve static frontend files
  const staticPath = getStaticPath();
  if (staticPath) {
    app.log.info(`Serving static files from ${staticPath}`);
    await app.register(fastifyStatic, {
      root: staticPath,
      prefix: "/",
      wildcard: false,
    });

    // SPA fallback - serve index.html for non-API routes
    app.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith("/api/")) {
        reply.status(404).send({ error: "Not Found" });
      } else {
        reply.sendFile("index.html");
      }
    });
  }

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];

  for (const signal of signals) {
    process.on(signal, async () => {
      app.log.info(`Received ${signal}, shutting down gracefully...`);
      await app.close();
      process.exit(0);
    });
  }

  // Start
  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`Server listening on http://${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
