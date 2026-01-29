import axios from 'axios';
import type {
  Item,
  ItemResponse,
  CreateItemDto,
  UpdateItemDto,
  Supplier,
  CreateSupplierDto,
  UpdateSupplierDto,
  Lot,
  LotResponse,
  CreateLotDto,
  OpenEventResponse,
  CreateOpenEventDto,
} from '@/types';

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── Items ──

export async function getItems(params?: {
  search?: string;
  favorite?: boolean;
}): Promise<ItemResponse[]> {
  const { data } = await client.get<ItemResponse[]>('/items', { params });
  return data;
}

export async function getItem(id: string): Promise<ItemResponse> {
  const { data } = await client.get<ItemResponse>(`/items/${id}`);
  return data;
}

export async function createItem(dto: CreateItemDto): Promise<Item> {
  const { data } = await client.post<Item>('/items', dto);
  return data;
}

export async function updateItem(
  id: string,
  dto: UpdateItemDto,
): Promise<Item> {
  const { data } = await client.patch<Item>(`/items/${id}`, dto);
  return data;
}

export async function deleteItem(id: string): Promise<void> {
  await client.delete(`/items/${id}`);
}

export async function toggleFavorite(id: string): Promise<Item> {
  const { data } = await client.patch<Item>(`/items/${id}/favorite`);
  return data;
}

export async function autocompleteItems(
  q: string,
): Promise<{ id: string; name: string }[]> {
  const { data } = await client.get<{ id: string; name: string }[]>(
    '/items/autocomplete',
    { params: { q } },
  );
  return data;
}

// ── Suppliers ──

export async function getSuppliers(): Promise<Supplier[]> {
  const { data } = await client.get<Supplier[]>('/suppliers');
  return data;
}

export async function getSupplier(id: string): Promise<Supplier> {
  const { data } = await client.get<Supplier>(`/suppliers/${id}`);
  return data;
}

export async function createSupplier(dto: CreateSupplierDto): Promise<Supplier> {
  const { data } = await client.post<Supplier>('/suppliers', dto);
  return data;
}

export async function updateSupplier(
  id: string,
  dto: UpdateSupplierDto,
): Promise<Supplier> {
  const { data } = await client.patch<Supplier>(`/suppliers/${id}`, dto);
  return data;
}

export async function deleteSupplier(id: string): Promise<void> {
  await client.delete(`/suppliers/${id}`);
}

// ── Lots ──

export async function getLots(params?: {
  itemId?: string;
}): Promise<LotResponse[]> {
  const { data } = await client.get<LotResponse[]>('/lots', { params });
  return data;
}

export async function getLot(id: string): Promise<LotResponse> {
  const { data } = await client.get<LotResponse>(`/lots/${id}`);
  return data;
}

export async function createLot(dto: CreateLotDto): Promise<Lot> {
  const { data } = await client.post<Lot>('/lots', dto);
  return data;
}

export async function getItemLots(itemId: string): Promise<LotResponse[]> {
  const { data } = await client.get<LotResponse[]>(`/items/${itemId}/lots`);
  return data;
}

// ── Open Events ──

export async function createOpenEvent(
  dto: CreateOpenEventDto,
): Promise<OpenEventResponse> {
  const { data } = await client.post<OpenEventResponse>('/open-events', dto);
  return data;
}

export async function getOpenEvents(params?: {
  itemId?: string;
  limit?: number;
}): Promise<OpenEventResponse[]> {
  const { data } = await client.get<OpenEventResponse[]>('/open-events', {
    params,
  });
  return data;
}

export async function getItemOpenEvents(
  itemId: string,
): Promise<OpenEventResponse[]> {
  const { data } = await client.get<OpenEventResponse[]>(
    `/items/${itemId}/open-events`,
  );
  return data;
}

// ── Inventory Counts ──

export async function getInventoryCounts(): Promise<
  import('@/types').InventoryCount[]
> {
  const { data } = await client.get<import('@/types').InventoryCount[]>(
    '/inventory-counts',
  );
  return data;
}

export async function getInventoryCount(
  id: string,
): Promise<import('@/types').InventoryCount> {
  const { data } = await client.get<import('@/types').InventoryCount>(
    `/inventory-counts/${id}`,
  );
  return data;
}

export async function createInventoryCount(): Promise<
  import('@/types').InventoryCount
> {
  const { data } = await client.post<import('@/types').InventoryCount>(
    '/inventory-counts',
  );
  return data;
}

export async function updateCountItem(
  countId: string,
  itemId: string,
  dto: { actualQty: number | null; note?: string },
): Promise<import('@/types').CountItem> {
  const { data } = await client.patch<import('@/types').CountItem>(
    `/inventory-counts/${countId}/items/${itemId}`,
    dto,
  );
  return data;
}

export async function submitInventoryCount(
  id: string,
): Promise<import('@/types').InventoryCount> {
  const { data } = await client.post<import('@/types').InventoryCount>(
    `/inventory-counts/${id}/submit`,
  );
  return data;
}

export async function approveInventoryCount(
  id: string,
): Promise<import('@/types').InventoryCount> {
  const { data } = await client.post<import('@/types').InventoryCount>(
    `/inventory-counts/${id}/approve`,
  );
  return data;
}

export async function deleteInventoryCount(id: string): Promise<void> {
  await client.delete(`/inventory-counts/${id}`);
}

// ── Alerts ──

export async function evaluateAlerts(): Promise<import('@/types').Alert[]> {
  const { data } = await client.post<import('@/types').Alert[]>(
    '/alerts/evaluate',
  );
  return data;
}

export async function getAlerts(params?: {
  type?: string;
  status?: string;
}): Promise<import('@/types').Alert[]> {
  const { data } = await client.get<import('@/types').Alert[]>('/alerts', {
    params,
  });
  return data;
}

export async function getAlertSummary(): Promise<
  import('@/types').AlertSummary
> {
  const { data } = await client.get<import('@/types').AlertSummary>(
    '/alerts/summary',
  );
  return data;
}

export async function acknowledgeAlert(
  id: string,
): Promise<import('@/types').Alert> {
  const { data } = await client.patch<import('@/types').Alert>(
    `/alerts/${id}/acknowledge`,
  );
  return data;
}

export async function resolveAlert(
  id: string,
): Promise<import('@/types').Alert> {
  const { data } = await client.patch<import('@/types').Alert>(
    `/alerts/${id}/resolve`,
  );
  return data;
}

// ── Reports ──

export async function getSupplierMonthlyReport(params: {
  year: number;
  month: number;
}): Promise<import('@/types').SupplierMonthlyReport> {
  const { data } = await client.get<import('@/types').SupplierMonthlyReport>(
    '/reports/supplier-monthly',
    { params },
  );
  return data;
}

export async function getExpiryRiskReport(params?: {
  days?: number;
}): Promise<import('@/types').ExpiryRiskReport> {
  const { data } = await client.get<import('@/types').ExpiryRiskReport>(
    '/reports/expiry-risk',
    { params },
  );
  return data;
}

export async function getInventoryStatusReport(): Promise<
  import('@/types').InventoryStatusReport
> {
  const { data } = await client.get<import('@/types').InventoryStatusReport>(
    '/reports/inventory-status',
  );
  return data;
}

export async function exportInventoryData(): Promise<unknown> {
  const { data } = await client.get('/reports/export/inventory');
  return data;
}

// ── Server Info ──

export interface ServerInfo {
  port: number;
  addresses: string[];
  urls: string[];
}

export async function getServerInfo(): Promise<ServerInfo> {
  const { data } = await client.get<ServerInfo>('/server-info');
  return data;
}
