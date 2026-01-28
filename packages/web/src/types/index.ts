// ── Item ──

export interface Item {
  id: string;
  name: string;
  synonyms: string[];
  openUnit: string;
  safetyStock: number;
  storage: string | null;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ItemResponse extends Item {
  currentStock: number;
}

export interface CreateItemDto {
  name: string;
  synonyms?: string[];
  openUnit: string;
  safetyStock?: number;
  storage?: string | null;
}

export interface UpdateItemDto {
  name?: string;
  synonyms?: string[];
  openUnit?: string;
  safetyStock?: number;
  storage?: string | null;
}

// ── Supplier ──

export interface Supplier {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierDto {
  name: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
}

export interface UpdateSupplierDto {
  name?: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
}

// ── Lot ──

export interface Lot {
  id: string;
  itemId: string;
  supplierId: string | null;
  initialQty: number;
  unopenedQty: number;
  unitPrice: number | null;
  expiryDate: string | null;
  purchaseDate: string;
  origin: string | null;
  note: string | null;
  createdAt: string;
  isExpiringSoon?: boolean;
  isExpired?: boolean;
}

export interface LotResponse extends Lot {
  item: { id: string; name: string };
  supplier: { id: string; name: string } | null;
}

export interface CreateLotDto {
  itemId: string;
  supplierId?: string | null;
  initialQty: number;
  unitPrice?: number | null;
  expiryDate?: string | null;
  purchaseDate?: string;
  origin?: string | null;
  note?: string | null;
}

// ── Open Event ──

export interface OpenEvent {
  id: string;
  lotId: string;
  itemId: string;
  quantity: number;
  userId: string | null;
  location: string | null;
  createdAt: string;
}

export interface OpenEventResponse extends OpenEvent {
  item: { id: string; name: string; openUnit: string };
  lot: {
    id: string;
    expiryDate: string | null;
    supplier: { id: string; name: string } | null;
  };
}

export interface CreateOpenEventDto {
  itemId: string;
  lotId?: string;
  quantity?: number;
  location?: string;
}

// ── Inventory Count ──

export interface InventoryCount {
  id: string;
  countDate: string;
  status: 'draft' | 'submitted' | 'approved';
  note: string | null;
  createdBy: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  countItems: CountItem[];
}

export interface CountItem {
  id: string;
  countId: string;
  itemId: string;
  systemQty: number;
  actualQty: number | null;
  difference: number | null;
  note: string | null;
  item: { id: string; name: string; openUnit: string; safetyStock?: number };
}

// ── Alert ──

export interface Alert {
  id: string;
  type: 'low_stock' | 'expiring_soon' | 'expired' | 'dead_stock';
  itemId: string | null;
  lotId: string | null;
  message: string;
  status: 'active' | 'acknowledged' | 'resolved';
  resolvedAt: string | null;
  createdAt: string;
}

export interface AlertSummary {
  total: number;
  low_stock: number;
  expiring_soon: number;
  expired: number;
  dead_stock: number;
}

// ── Reports ──

export interface SupplierMonthlyReport {
  period: string;
  startDate: string;
  endDate: string;
  suppliers: SupplierReportItem[];
  summary: {
    totalSuppliers: number;
    totalLots: number;
    totalQty: number;
    totalAmount: number;
  };
}

export interface SupplierReportItem {
  supplierId: string;
  supplierName: string;
  totalQty: number;
  totalAmount: number;
  avgUnitPrice: number;
  lotCount: number;
  items: { itemId: string; itemName: string; qty: number; amount: number }[];
}

export interface ExpiryRiskReport {
  daysAhead: number;
  lots: ExpiryRiskItem[];
  summary: {
    total: number;
    expired: number;
    critical: number;
    warning: number;
    totalQty: number;
    estimatedTotalLoss: number;
  };
}

export interface ExpiryRiskItem {
  lotId: string;
  itemId: string;
  itemName: string;
  openUnit: string;
  supplierName: string;
  unopenedQty: number;
  expiryDate: string;
  daysUntilExpiry: number;
  status: 'expired' | 'critical' | 'warning';
  estimatedLoss: number;
}

export interface InventoryStatusReport {
  generatedAt: string;
  items: InventoryStatusItem[];
  summary: {
    totalItems: number;
    outOfStock: number;
    lowStock: number;
    totalValue: number;
    totalExpiringQty: number;
    totalExpiredQty: number;
  };
}

export interface InventoryStatusItem {
  itemId: string;
  itemName: string;
  openUnit: string;
  safetyStock: number;
  currentStock: number;
  stockStatus: 'ok' | 'low' | 'out';
  lotCount: number;
  totalValue: number;
  expiringQty: number;
  expiredQty: number;
}
