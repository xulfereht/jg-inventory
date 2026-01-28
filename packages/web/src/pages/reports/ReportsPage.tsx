import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Download,
  ChevronDown,
  ChevronRight,
  Truck,
  AlertTriangle,
  Package,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  getSupplierMonthlyReport,
  getExpiryRiskReport,
  getInventoryStatusReport,
  exportInventoryData,
} from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';

type TabType = 'supplier' | 'expiry' | 'status';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('ko-KR').format(value) + '원';

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('supplier');
  const currentDate = new Date();
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [expiryDays, setExpiryDays] = useState(60);
  const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(
    new Set(),
  );

  const tabs: { key: TabType; label: string; icon: React.ElementType }[] = [
    { key: 'supplier', label: '구매처별 월간', icon: Truck },
    { key: 'expiry', label: '만료 위험', icon: AlertTriangle },
    { key: 'status', label: '재고 현황', icon: Package },
  ];

  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = currentDate.getFullYear(); y >= 2020; y--) {
      years.push({ value: String(y), label: `${y}년` });
    }
    return years;
  }, []);

  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: String(i + 1),
      label: `${i + 1}월`,
    }));
  }, []);

  const daysOptions = [
    { value: '30', label: '30일' },
    { value: '60', label: '60일' },
    { value: '90', label: '90일' },
  ];

  // Supplier monthly report
  const { data: supplierReport, isLoading: supplierLoading } = useQuery({
    queryKey: ['supplierMonthlyReport', year, month],
    queryFn: () => getSupplierMonthlyReport({ year, month }),
    enabled: activeTab === 'supplier',
  });

  // Expiry risk report
  const { data: expiryReport, isLoading: expiryLoading } = useQuery({
    queryKey: ['expiryRiskReport', expiryDays],
    queryFn: () => getExpiryRiskReport({ days: expiryDays }),
    enabled: activeTab === 'expiry',
  });

  // Inventory status report
  const { data: statusReport, isLoading: statusLoading } = useQuery({
    queryKey: ['inventoryStatusReport'],
    queryFn: getInventoryStatusReport,
    enabled: activeTab === 'status',
  });

  const handleExport = async () => {
    try {
      const data = await exportInventoryData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const toggleSupplierExpand = (supplierId: string) => {
    setExpandedSuppliers((prev) => {
      const next = new Set(prev);
      if (next.has(supplierId)) {
        next.delete(supplierId);
      } else {
        next.add(supplierId);
      }
      return next;
    });
  };

  const isLoading =
    (activeTab === 'supplier' && supplierLoading) ||
    (activeTab === 'expiry' && expiryLoading) ||
    (activeTab === 'status' && statusLoading);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-primary-600" />
            <h2 className="page-title">리포트</h2>
          </div>
          <p className="page-description">재고 현황 리포트를 확인합니다.</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4" />
          내보내기
        </Button>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 rounded-lg border border-neutral-200 bg-neutral-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="mt-8 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          <p className="mt-2 text-sm text-neutral-500">불러오는 중...</p>
        </div>
      )}

      {/* Supplier Monthly Report */}
      {activeTab === 'supplier' && !supplierLoading && (
        <div className="mt-6">
          {/* Filters */}
          <div className="flex gap-3">
            <div className="w-28">
              <Select
                options={yearOptions}
                value={String(year)}
                onChange={(e) => setYear(Number(e.target.value))}
              />
            </div>
            <div className="w-24">
              <Select
                options={monthOptions}
                value={String(month)}
                onChange={(e) => setMonth(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Summary */}
          {supplierReport && (
            <>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Card className="p-4">
                  <p className="text-xs font-medium text-neutral-500">
                    구매처 수
                  </p>
                  <p className="mt-1 text-2xl font-bold text-neutral-900">
                    {supplierReport.summary.totalSuppliers}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs font-medium text-neutral-500">
                    입고 건수
                  </p>
                  <p className="mt-1 text-2xl font-bold text-neutral-900">
                    {supplierReport.summary.totalLots}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs font-medium text-neutral-500">
                    총 입고량
                  </p>
                  <p className="mt-1 text-2xl font-bold text-neutral-900">
                    {supplierReport.summary.totalQty}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs font-medium text-neutral-500">
                    총 금액
                  </p>
                  <p className="mt-1 text-2xl font-bold text-primary-600">
                    {formatCurrency(supplierReport.summary.totalAmount)}
                  </p>
                </Card>
              </div>

              {/* Table */}
              <Card className="mt-4 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600">
                          구매처
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600">
                          입고량
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600">
                          금액
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600">
                          평균단가
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600">
                          건수
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplierReport.suppliers.map((supplier) => (
                        <>
                          <tr
                            key={supplier.supplierId}
                            className="cursor-pointer border-b border-neutral-100 hover:bg-neutral-50"
                            onClick={() =>
                              toggleSupplierExpand(supplier.supplierId)
                            }
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {expandedSuppliers.has(supplier.supplierId) ? (
                                  <ChevronDown className="h-4 w-4 text-neutral-400" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-neutral-400" />
                                )}
                                <span className="font-medium text-neutral-900">
                                  {supplier.supplierName}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-neutral-600">
                              {supplier.totalQty}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-neutral-900">
                              {formatCurrency(supplier.totalAmount)}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-neutral-600">
                              {formatCurrency(Math.round(supplier.avgUnitPrice))}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-neutral-600">
                              {supplier.lotCount}
                            </td>
                          </tr>
                          {expandedSuppliers.has(supplier.supplierId) &&
                            supplier.items.map((item) => (
                              <tr
                                key={`${supplier.supplierId}-${item.itemId}`}
                                className="border-b border-neutral-50 bg-neutral-50/50"
                              >
                                <td className="px-4 py-2 pl-12 text-sm text-neutral-600">
                                  {item.itemName}
                                </td>
                                <td className="px-4 py-2 text-right text-sm text-neutral-500">
                                  {item.qty}
                                </td>
                                <td className="px-4 py-2 text-right text-sm text-neutral-500">
                                  {formatCurrency(item.amount)}
                                </td>
                                <td className="px-4 py-2" />
                                <td className="px-4 py-2" />
                              </tr>
                            ))}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}

          {supplierReport && supplierReport.suppliers.length === 0 && (
            <div className="mt-8 rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center">
              <Truck className="mx-auto h-12 w-12 text-neutral-300" />
              <p className="mt-4 text-sm text-neutral-500">
                해당 기간의 입고 데이터가 없습니다.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Expiry Risk Report */}
      {activeTab === 'expiry' && !expiryLoading && (
        <div className="mt-6">
          {/* Filter */}
          <div className="w-28">
            <Select
              options={daysOptions}
              value={String(expiryDays)}
              onChange={(e) => setExpiryDays(Number(e.target.value))}
            />
          </div>

          {/* Summary */}
          {expiryReport && (
            <>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Card className="p-4">
                  <p className="text-xs font-medium text-neutral-500">
                    전체 위험
                  </p>
                  <p className="mt-1 text-2xl font-bold text-neutral-900">
                    {expiryReport.summary.total}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs font-medium text-red-600">만료됨</p>
                  <p className="mt-1 text-2xl font-bold text-red-600">
                    {expiryReport.summary.expired}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs font-medium text-orange-600">긴급</p>
                  <p className="mt-1 text-2xl font-bold text-orange-600">
                    {expiryReport.summary.critical}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs font-medium text-amber-600">주의</p>
                  <p className="mt-1 text-2xl font-bold text-amber-600">
                    {expiryReport.summary.warning}
                  </p>
                </Card>
              </div>

              <Card className="mt-4 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-neutral-500">
                    위험 재고량: {expiryReport.summary.totalQty}
                  </p>
                  <p className="text-sm font-semibold text-red-600">
                    예상 손실: {formatCurrency(expiryReport.summary.estimatedTotalLoss)}
                  </p>
                </div>
              </Card>

              {/* Table */}
              <Card className="mt-4 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600">
                          품목
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600">
                          구매처
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600">
                          수량
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-600">
                          유효기간
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-600">
                          D-Day
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-600">
                          상태
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600">
                          예상손실
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {expiryReport.lots.map((lot) => (
                        <tr
                          key={lot.lotId}
                          className="border-b border-neutral-100 last:border-b-0"
                        >
                          <td className="px-4 py-3">
                            <span className="font-medium text-neutral-900">
                              {lot.itemName}
                            </span>
                            <span className="ml-1 text-xs text-neutral-400">
                              ({lot.openUnit})
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-neutral-600">
                            {lot.supplierName || '-'}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-neutral-900">
                            {lot.unopenedQty}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-neutral-600">
                            {format(new Date(lot.expiryDate), 'yyyy-MM-dd')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`text-sm font-semibold ${
                                lot.daysUntilExpiry < 0
                                  ? 'text-red-600'
                                  : lot.daysUntilExpiry <= 7
                                    ? 'text-orange-600'
                                    : 'text-amber-600'
                              }`}
                            >
                              {lot.daysUntilExpiry < 0
                                ? `D+${Math.abs(lot.daysUntilExpiry)}`
                                : `D-${lot.daysUntilExpiry}`}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge
                              variant={
                                lot.status === 'expired'
                                  ? 'destructive'
                                  : lot.status === 'critical'
                                    ? 'warning'
                                    : 'secondary'
                              }
                            >
                              {lot.status === 'expired'
                                ? '만료'
                                : lot.status === 'critical'
                                  ? '긴급'
                                  : '주의'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-red-600">
                            {formatCurrency(lot.estimatedLoss)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}

          {expiryReport && expiryReport.lots.length === 0 && (
            <div className="mt-8 rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-neutral-300" />
              <p className="mt-4 text-sm text-neutral-500">
                만료 위험 품목이 없습니다.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Inventory Status Report */}
      {activeTab === 'status' && !statusLoading && statusReport && (
        <div className="mt-6">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card className="p-4">
              <p className="text-xs font-medium text-neutral-500">전체 품목</p>
              <p className="mt-1 text-2xl font-bold text-neutral-900">
                {statusReport.summary.totalItems}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-red-600">재고 없음</p>
              <p className="mt-1 text-2xl font-bold text-red-600">
                {statusReport.summary.outOfStock}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-amber-600">재고 부족</p>
              <p className="mt-1 text-2xl font-bold text-amber-600">
                {statusReport.summary.lowStock}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-neutral-500">총 가치</p>
              <p className="mt-1 text-2xl font-bold text-primary-600">
                {formatCurrency(statusReport.summary.totalValue)}
              </p>
            </Card>
          </div>

          {/* Table */}
          <Card className="mt-4 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600">
                      품목
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600">
                      현재고
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600">
                      안전재고
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-600">
                      상태
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600">
                      가치
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600">
                      만료임박
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600">
                      만료됨
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {statusReport.items.map((item) => (
                    <tr
                      key={item.itemId}
                      className="border-b border-neutral-100 last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-neutral-900">
                          {item.itemName}
                        </span>
                        <span className="ml-1 text-xs text-neutral-400">
                          ({item.openUnit})
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-neutral-900">
                        {item.currentStock}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-neutral-600">
                        {item.safetyStock}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={
                            item.stockStatus === 'out'
                              ? 'destructive'
                              : item.stockStatus === 'low'
                                ? 'warning'
                                : 'success'
                          }
                        >
                          {item.stockStatus === 'out'
                            ? '없음'
                            : item.stockStatus === 'low'
                              ? '부족'
                              : '정상'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-neutral-900">
                        {formatCurrency(item.totalValue)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        {item.expiringQty > 0 ? (
                          <span className="text-amber-600">
                            {item.expiringQty}
                          </span>
                        ) : (
                          <span className="text-neutral-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        {item.expiredQty > 0 ? (
                          <span className="text-red-600">{item.expiredQty}</span>
                        ) : (
                          <span className="text-neutral-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <p className="mt-4 text-xs text-neutral-400">
            생성 시각:{' '}
            {format(new Date(statusReport.generatedAt), 'yyyy-MM-dd HH:mm')}
          </p>
        </div>
      )}
    </div>
  );
}
