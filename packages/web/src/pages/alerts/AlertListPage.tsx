import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  RefreshCw,
  AlertTriangle,
  Clock,
  XCircle,
  Package,
  Eye,
  CheckCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  getAlerts,
  getAlertSummary,
  evaluateAlerts,
  acknowledgeAlert,
  resolveAlert,
} from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import type { Alert } from '@/types';

const typeLabels: Record<Alert['type'], string> = {
  low_stock: '재고 부족',
  expiring_soon: '만료 임박',
  expired: '만료됨',
  dead_stock: '미사용',
};

const typeIcons: Record<Alert['type'], React.ElementType> = {
  low_stock: AlertTriangle,
  expiring_soon: Clock,
  expired: XCircle,
  dead_stock: Package,
};

const typeBadgeVariants: Record<
  Alert['type'],
  'destructive' | 'warning' | 'secondary' | 'default'
> = {
  low_stock: 'destructive',
  expiring_soon: 'warning',
  expired: 'destructive',
  dead_stock: 'secondary',
};

const statusLabels: Record<Alert['status'], string> = {
  active: '활성',
  acknowledged: '확인됨',
  resolved: '해결됨',
};

export function AlertListPage() {
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Auto-refresh every 60 seconds
  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts', typeFilter, statusFilter],
    queryFn: () =>
      getAlerts({
        type: typeFilter || undefined,
        status: statusFilter || undefined,
      }),
    refetchInterval: 60000,
  });

  const { data: summary } = useQuery({
    queryKey: ['alertSummary'],
    queryFn: getAlertSummary,
    refetchInterval: 60000,
  });

  const evaluateMutation = useMutation({
    mutationFn: evaluateAlerts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alertSummary'] });
    },
  });

  const acknowledgeMutation = useMutation({
    mutationFn: acknowledgeAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alertSummary'] });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: resolveAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alertSummary'] });
    },
  });

  const typeOptions = [
    { value: '', label: '전체 유형' },
    { value: 'low_stock', label: '재고 부족' },
    { value: 'expiring_soon', label: '만료 임박' },
    { value: 'expired', label: '만료됨' },
    { value: 'dead_stock', label: '미사용' },
  ];

  const statusOptions = [
    { value: '', label: '전체 상태' },
    { value: 'active', label: '활성' },
    { value: 'acknowledged', label: '확인됨' },
    { value: 'resolved', label: '해결됨' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-primary-600" />
            <h2 className="page-title">알림</h2>
          </div>
          <p className="page-description">
            재고 관련 알림을 확인하고 관리합니다.
          </p>
        </div>
        <Button
          onClick={() => evaluateMutation.mutate()}
          disabled={evaluateMutation.isPending}
          variant="outline"
        >
          {evaluateMutation.isPending ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          알림 갱신
        </Button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Card className="p-4">
            <p className="text-xs font-medium text-neutral-500">전체</p>
            <p className="mt-1 text-2xl font-bold text-neutral-900">
              {summary.total}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-red-600">재고 부족</p>
            <p className="mt-1 text-2xl font-bold text-red-600">
              {summary.low_stock}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-amber-600">만료 임박</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">
              {summary.expiring_soon}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-red-600">만료됨</p>
            <p className="mt-1 text-2xl font-bold text-red-600">
              {summary.expired}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-neutral-500">미사용</p>
            <p className="mt-1 text-2xl font-bold text-neutral-600">
              {summary.dead_stock}
            </p>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="mt-6 flex gap-3">
        <div className="w-40">
          <Select
            options={typeOptions}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          />
        </div>
        <div className="w-40">
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="mt-8 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          <p className="mt-2 text-sm text-neutral-500">불러오는 중...</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && alerts.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center">
          <Bell className="mx-auto h-12 w-12 text-neutral-300" />
          <p className="mt-4 text-sm text-neutral-500">알림이 없습니다.</p>
        </div>
      )}

      {/* Alerts list */}
      {!isLoading && alerts.length > 0 && (
        <div className="mt-6 space-y-3">
          {alerts.map((alert) => {
            const Icon = typeIcons[alert.type];
            return (
              <Card key={alert.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                        alert.type === 'low_stock' || alert.type === 'expired'
                          ? 'bg-red-100'
                          : alert.type === 'expiring_soon'
                            ? 'bg-amber-100'
                            : 'bg-neutral-100'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${
                          alert.type === 'low_stock' || alert.type === 'expired'
                            ? 'text-red-600'
                            : alert.type === 'expiring_soon'
                              ? 'text-amber-600'
                              : 'text-neutral-600'
                        }`}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={typeBadgeVariants[alert.type]}>
                          {typeLabels[alert.type]}
                        </Badge>
                        {alert.status !== 'active' && (
                          <Badge variant="secondary">
                            {statusLabels[alert.status]}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-neutral-900">
                        {alert.message}
                      </p>
                      <p className="mt-1 text-xs text-neutral-400">
                        {format(new Date(alert.createdAt), 'yyyy-MM-dd HH:mm')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {alert.status === 'active' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => acknowledgeMutation.mutate(alert.id)}
                        disabled={acknowledgeMutation.isPending}
                      >
                        <Eye className="h-4 w-4" />
                        확인
                      </Button>
                    )}
                    {alert.status !== 'resolved' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resolveMutation.mutate(alert.id)}
                        disabled={resolveMutation.isPending}
                        className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                        해결
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Auto-refresh notice */}
      <p className="mt-4 text-xs text-neutral-400">
        알림은 60초마다 자동으로 갱신됩니다.
      </p>
    </div>
  );
}
