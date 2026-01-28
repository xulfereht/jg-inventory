import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardCheck,
  ArrowLeft,
  Save,
  Send,
  CheckCircle,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  getInventoryCount,
  updateCountItem,
  submitInventoryCount,
  approveInventoryCount,
} from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import type { InventoryCount, CountItem } from '@/types';

const statusLabels: Record<InventoryCount['status'], string> = {
  draft: '작성 중',
  submitted: '제출됨',
  approved: '승인됨',
};

const statusVariants: Record<
  InventoryCount['status'],
  'secondary' | 'warning' | 'success'
> = {
  draft: 'secondary',
  submitted: 'warning',
  approved: 'success',
};

export function InventoryCountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [localChanges, setLocalChanges] = useState<
    Record<string, number | null>
  >({});
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const {
    data: count,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['inventoryCount', id],
    queryFn: () => getInventoryCount(id!),
    enabled: Boolean(id),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      itemId,
      actualQty,
    }: {
      itemId: string;
      actualQty: number | null;
    }) => {
      return updateCountItem(id!, itemId, { actualQty });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryCount', id] });
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => submitInventoryCount(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryCount', id] });
      queryClient.invalidateQueries({ queryKey: ['inventoryCounts'] });
      setNotification({ type: 'success', message: '실사가 제출되었습니다.' });
      setTimeout(() => setNotification(null), 3000);
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || '제출에 실패했습니다.';
      setNotification({ type: 'error', message });
      setTimeout(() => setNotification(null), 3000);
    },
  });

  const approveMutation = useMutation({
    mutationFn: () => approveInventoryCount(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryCount', id] });
      queryClient.invalidateQueries({ queryKey: ['inventoryCounts'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setNotification({
        type: 'success',
        message: '실사가 승인되고 재고가 조정되었습니다.',
      });
      setTimeout(() => setNotification(null), 3000);
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || '승인에 실패했습니다.';
      setNotification({ type: 'error', message });
      setTimeout(() => setNotification(null), 3000);
    },
  });

  const handleActualQtyChange = useCallback(
    (itemId: string, value: string) => {
      const numValue = value === '' ? null : Number(value);
      setLocalChanges((prev) => ({ ...prev, [itemId]: numValue }));
    },
    [],
  );

  const handleSave = useCallback(async () => {
    const promises = Object.entries(localChanges).map(([itemId, actualQty]) =>
      updateMutation.mutateAsync({ itemId, actualQty }),
    );
    await Promise.all(promises);
    setLocalChanges({});
    setNotification({ type: 'success', message: '저장되었습니다.' });
    setTimeout(() => setNotification(null), 2000);
  }, [localChanges, updateMutation]);

  const getActualQty = (item: CountItem): number | null => {
    if (item.id in localChanges) {
      return localChanges[item.id];
    }
    return item.actualQty;
  };

  const getDifference = (item: CountItem): number | null => {
    const actualQty = getActualQty(item);
    if (actualQty === null) return null;
    return actualQty - item.systemQty;
  };

  const allItemsFilled =
    count?.countItems.every((item) => {
      const actualQty = getActualQty(item);
      return actualQty !== null;
    }) ?? false;

  const hasChanges = Object.keys(localChanges).length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !count) {
    return (
      <div className="py-12 text-center">
        <ClipboardCheck className="mx-auto h-12 w-12 text-neutral-300" />
        <p className="mt-4 text-sm text-neutral-500">
          실사를 찾을 수 없습니다.
        </p>
        <Link to="/inventory-counts" className="mt-4 inline-block">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
            목록으로
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Notification */}
      {notification && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${
            notification.type === 'success'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border border-red-200 bg-red-50 text-red-800'
          }`}
          role="status"
          aria-live="polite"
        >
          {notification.message}
        </div>
      )}

      {/* Back link */}
      <Link
        to="/inventory-counts"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700"
      >
        <ArrowLeft className="h-4 w-4" />
        실사 목록
      </Link>

      {/* Header */}
      <div className="mt-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100">
            <ClipboardCheck className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="page-title">재고 실사</h2>
              <Badge variant={statusVariants[count.status]}>
                {statusLabels[count.status]}
              </Badge>
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-neutral-500">
              <Calendar className="h-4 w-4" />
              {format(new Date(count.countDate), 'yyyy년 MM월 dd일')}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {count.status === 'draft' && (
            <>
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={!hasChanges || updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                저장
              </Button>
              <Button
                onClick={() => submitMutation.mutate()}
                disabled={!allItemsFilled || hasChanges || submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                제출
              </Button>
            </>
          )}
          {count.status === 'submitted' && (
            <Button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {approveMutation.isPending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              승인 및 재고 조정
            </Button>
          )}
        </div>
      </div>

      {/* Items table */}
      <Card className="mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600">
                  품목명
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600">
                  시스템 재고
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600">
                  실사 수량
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600">
                  차이
                </th>
              </tr>
            </thead>
            <tbody>
              {count.countItems.map((item) => {
                const actualQty = getActualQty(item);
                const difference = getDifference(item);

                return (
                  <tr
                    key={item.id}
                    className="border-b border-neutral-100 last:border-b-0"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-neutral-900">
                        {item.item.name}
                      </span>
                      <span className="ml-1 text-xs text-neutral-400">
                        ({item.item.openUnit})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-neutral-600">
                      {item.systemQty}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {count.status === 'draft' ? (
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={actualQty ?? ''}
                          onChange={(e) =>
                            handleActualQtyChange(item.id, e.target.value)
                          }
                          className="w-24 rounded-lg border border-neutral-300 px-2 py-1 text-right text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                          placeholder="-"
                        />
                      ) : (
                        <span className="text-sm text-neutral-900">
                          {actualQty ?? '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {difference !== null ? (
                        <span
                          className={`text-sm font-semibold ${
                            difference > 0
                              ? 'text-blue-600'
                              : difference < 0
                                ? 'text-red-600'
                                : 'text-neutral-400'
                          }`}
                        >
                          {difference > 0 ? '+' : ''}
                          {difference}
                        </span>
                      ) : (
                        <span className="text-sm text-neutral-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Summary */}
      {count.status !== 'draft' && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <p className="text-xs font-medium text-neutral-500">총 품목</p>
            <p className="mt-1 text-2xl font-bold text-neutral-900">
              {count.countItems.length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-neutral-500">차이 발생</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">
              {count.countItems.filter((i) => i.difference !== 0).length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-neutral-500">
              총 차이 수량
            </p>
            <p className="mt-1 text-2xl font-bold text-neutral-900">
              {count.countItems.reduce((sum, i) => sum + (i.difference ?? 0), 0)}
            </p>
          </Card>
        </div>
      )}

      {/* Help text for draft */}
      {count.status === 'draft' && (
        <p className="mt-4 text-sm text-neutral-500">
          모든 품목의 실사 수량을 입력한 후 제출하세요.
          {!allItemsFilled && (
            <span className="ml-1 text-amber-600">
              ({count.countItems.filter((i) => getActualQty(i) === null).length}
              개 미입력)
            </span>
          )}
        </p>
      )}
    </div>
  );
}
