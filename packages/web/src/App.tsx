import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { OpenDashboardPage } from '@/pages/open/OpenDashboardPage';
import { ItemListPage } from '@/pages/items/ItemListPage';
import { ItemFormPage } from '@/pages/items/ItemFormPage';
import { ItemDetailPage } from '@/pages/items/ItemDetailPage';
import { LotHistoryPage } from '@/pages/items/LotHistoryPage';
import { SupplierListPage } from '@/pages/suppliers/SupplierListPage';
import { SupplierFormPage } from '@/pages/suppliers/SupplierFormPage';
import { LotFormPage } from '@/pages/lots/LotFormPage';
import { InventoryCountListPage } from '@/pages/inventory-counts/InventoryCountListPage';
import { InventoryCountDetailPage } from '@/pages/inventory-counts/InventoryCountDetailPage';
import { AlertListPage } from '@/pages/alerts/AlertListPage';
import { ReportsPage } from '@/pages/reports/ReportsPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/open" replace />} />

        {/* Open */}
        <Route path="/open" element={<OpenDashboardPage />} />

        {/* Items */}
        <Route path="/items" element={<ItemListPage />} />
        <Route path="/items/new" element={<ItemFormPage />} />
        <Route path="/items/:id" element={<ItemDetailPage />} />
        <Route path="/items/:id/edit" element={<ItemFormPage />} />
        <Route path="/items/:id/lots" element={<LotHistoryPage />} />

        {/* Suppliers */}
        <Route path="/suppliers" element={<SupplierListPage />} />
        <Route path="/suppliers/new" element={<SupplierFormPage />} />
        <Route path="/suppliers/:id/edit" element={<SupplierFormPage />} />

        {/* Lots */}
        <Route path="/lots/new" element={<LotFormPage />} />

        {/* Inventory Counts */}
        <Route path="/inventory-counts" element={<InventoryCountListPage />} />
        <Route path="/inventory-counts/:id" element={<InventoryCountDetailPage />} />

        {/* Alerts */}
        <Route path="/alerts" element={<AlertListPage />} />

        {/* Reports */}
        <Route path="/reports" element={<ReportsPage />} />
      </Routes>
    </Layout>
  );
}
