import { execSync } from "child_process";
import { copyFileSync, mkdirSync, existsSync, readdirSync, cpSync, writeFileSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const MONOREPO_ROOT = join(ROOT, "../..");
const WEB_ROOT = join(MONOREPO_ROOT, "packages/web");
const DIST = join(ROOT, "dist");

console.log("🔨 Building JG Inventory Management System...\n");

// 1. Clean dist
console.log("1. Cleaning dist folder...");
if (existsSync(DIST)) {
  execSync(`rm -rf ${DIST}`);
}
mkdirSync(DIST, { recursive: true });
mkdirSync(join(DIST, "bin"), { recursive: true });

// 2. Build Frontend
console.log("\n2. Building frontend...");
execSync("npm run build", { cwd: WEB_ROOT, stdio: "inherit" });

// 3. Generate Prisma client
console.log("\n3. Generating Prisma client...");
execSync("npx prisma generate", { cwd: ROOT, stdio: "inherit" });

// 4. Build Server with esbuild
console.log("\n4. Bundling server with esbuild...");
execSync(
  `npx esbuild src/index.ts --bundle --platform=node --target=node18 --outfile=dist/server.cjs --format=cjs --external:@prisma/client --external:prisma`,
  { cwd: ROOT, stdio: "inherit" }
);

// 5. Copy Prisma schema
console.log("\n5. Copying Prisma files...");
mkdirSync(join(DIST, "prisma"), { recursive: true });
copyFileSync(
  join(ROOT, "prisma/schema.prisma"),
  join(DIST, "prisma/schema.prisma")
);

// Find Prisma client in pnpm structure
const pnpmPrismaClient = join(
  MONOREPO_ROOT,
  "node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma/client"
);
const regularPrismaClient = join(MONOREPO_ROOT, "node_modules/.prisma/client");
const prismaClientPath = existsSync(pnpmPrismaClient) ? pnpmPrismaClient : regularPrismaClient;

console.log(`   Using Prisma client from: ${prismaClientPath}`);

// Copy query engine files for all platforms
const engineFiles = readdirSync(prismaClientPath).filter(
  (f) => f.includes("query_engine") || f.includes("libquery") || f.endsWith(".node")
);

for (const file of engineFiles) {
  console.log(`   Copying ${file}...`);
  copyFileSync(join(prismaClientPath, file), join(DIST, file));
}

// 6. Copy Prisma node_modules
console.log("\n6. Copying Prisma node_modules...");
const pnpmPrismaClientPkg = join(
  MONOREPO_ROOT,
  "node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client"
);
const regularPrismaClientPkg = join(MONOREPO_ROOT, "node_modules/@prisma/client");
const prismaClientPkgPath = existsSync(pnpmPrismaClientPkg) ? pnpmPrismaClientPkg : regularPrismaClientPkg;

mkdirSync(join(DIST, "node_modules/@prisma"), { recursive: true });
mkdirSync(join(DIST, "node_modules/.prisma"), { recursive: true });

cpSync(prismaClientPkgPath, join(DIST, "node_modules/@prisma/client"), { recursive: true });
cpSync(prismaClientPath, join(DIST, "node_modules/.prisma/client"), { recursive: true });

// 7. Copy Frontend build
console.log("\n7. Copying frontend build...");
const webDistPath = join(WEB_ROOT, "dist");
if (existsSync(webDistPath)) {
  cpSync(webDistPath, join(DIST, "public"), { recursive: true });
  console.log("   Frontend files copied to dist/public/");
} else {
  console.error("   ERROR: Frontend build not found!");
  process.exit(1);
}

// 7.5 Create fresh database with schema
console.log("\n7.5. Creating initial database...");
const distDbPath = join(DIST, "data.db");
const sourceDbPath = join(ROOT, "prisma", "data.db");

// Make sure migrations are applied to source db
execSync(`npx prisma migrate deploy`, { cwd: ROOT, stdio: "inherit" });

// Copy the database (will include any seed data)
if (existsSync(sourceDbPath)) {
  copyFileSync(sourceDbPath, distDbPath);
  console.log("   Database copied to dist/");
} else {
  console.error("   ERROR: Source database not found at", sourceDbPath);
  process.exit(1);
}

// 8. Create launcher with embedded database
console.log("\n8. Creating launcher with embedded database...");

// Read and encode the database as base64
const dbBuffer = readFileSync(sourceDbPath);
const dbBase64 = dbBuffer.toString('base64');
console.log(`   Database size: ${dbBuffer.length} bytes (${dbBase64.length} base64 chars)`);

const launcherCode = `
const path = require('path');
const fs = require('fs');

// Embedded database (base64 encoded)
const INIT_DB_BASE64 = "${dbBase64}";

// Determine base directory
const baseDir = path.dirname(process.execPath);
const dbPath = path.join(baseDir, 'data.db');

// Set DATABASE_URL before anything else (SQLite needs file: prefix with absolute path)
process.env.DATABASE_URL = 'file:' + dbPath;

console.log('');
console.log('========================================');
console.log('  JG 한약재 재고관리 시스템');
console.log('========================================');
console.log('');
console.log('  서버 주소: http://localhost:3100');
console.log('  데이터 위치: ' + dbPath);
console.log('');

// Check if database exists, if not create from embedded
if (!fs.existsSync(dbPath)) {
  console.log('  데이터베이스 초기화 중...');
  try {
    const dbBuffer = Buffer.from(INIT_DB_BASE64, 'base64');
    fs.writeFileSync(dbPath, dbBuffer);
    console.log('  새 데이터베이스가 생성되었습니다.');
    console.log('');
  } catch (e) {
    console.error('  데이터베이스 초기화 실패:', e.message);
  }
}

console.log('  다른 기기에서 접속하려면:');
console.log('  http://[이 컴퓨터 IP]:3100');
console.log('');
console.log('  종료하려면 이 창을 닫으세요.');
console.log('========================================');
console.log('');

// Start server
require('./server.cjs');
`.trim();

writeFileSync(join(DIST, "index.cjs"), launcherCode);

// 9. Create pkg config
console.log("\n9. Creating pkg config...");
const pkgConfig = {
  name: "jg-inventory",
  bin: "index.cjs",
  pkg: {
    scripts: ["server.cjs"],
    assets: [
      "prisma/**/*",
      "public/**/*",
      "node_modules/**/*",
      "*.node"
    ],
    targets: ["node18-win-x64", "node18-macos-x64"],
    outputPath: "bin"
  }
};

writeFileSync(join(DIST, "package.json"), JSON.stringify(pkgConfig, null, 2));

console.log("\n✅ Build complete!");
console.log("\n📦 Creating executables...");

// 10. Run pkg
execSync("npx @yao-pkg/pkg .", { cwd: DIST, stdio: "inherit" });

console.log("\n🎉 All done!");
console.log("\nGenerated files:");
console.log("  - dist/bin/jg-inventory-win.exe (Windows)");
console.log("  - dist/bin/jg-inventory-macos (Mac)");
console.log("\nWindows에서 사용:");
console.log("  1. jg-inventory-win.exe를 원하는 폴더에 복사");
console.log("  2. 더블클릭으로 실행");
console.log("  3. 브라우저에서 http://localhost:3100 접속");
