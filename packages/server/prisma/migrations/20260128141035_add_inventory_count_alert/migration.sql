-- CreateTable
CREATE TABLE "InventoryCount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "countDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "note" TEXT,
    "createdBy" TEXT,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CountItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "countId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "systemQty" INTEGER NOT NULL,
    "actualQty" INTEGER,
    "difference" INTEGER,
    "note" TEXT,
    CONSTRAINT "CountItem_countId_fkey" FOREIGN KEY ("countId") REFERENCES "InventoryCount" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CountItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "itemId" TEXT,
    "lotId" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
