import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  History,
  ClipboardPlus,
  Calendar,
  Truck,
  Package,
  PackageOpen,
} from 'lucide-react';
import { format } from 'date-fns';
import { getItem, getItemLots, createOpenEvent } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

export function LotHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [openNotification, setOpenNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Auto-hide open notification
  useEffect(() => {
    if (!openNotification) return;
    const timer = setTimeout(() => setOpenNotification(null), 2000);
    return () => clearTimeout(timer);
  }, [openNotification]);

  // Open mutation (specific lot)
  const openMutation = useMutation({
    mutationFn: (lotId: string) =>
      createOpenEvent({ itemId: id!, lotId }),
    onSuccess: (data) => {
      setOpenNotification({
        type: 'success',
        message: `${data.item.name} ${data.quantity}${data.item.openUnit} 오픈 완료`,
      });
      queryClient.invalidateQueries({ queryKey: ['item', id] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['itemLots', id] });
      queryClient.invalidateQueries({ queryKey: ['openEvents'] });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || '오픈에 실패했습니다.';
      setOpenNotification({ type: 'error', message });
    },
  });

  // Fetch item info
  const { data: item, isLoading: isLoadingItem } = useQuery({
    queryKey: ['item', id],
    queryFn: () => getItem(id!),
    enabled: Boolean(id),
  });

  // Fetch lots
  const { data: lots = [], isLoading: isLoadingLots } = useQuery({
    queryKey: ['itemLots', id],
    queryFn: () => getItemLots(id!),
    enabled: Boolean(id),
  });

  const isLoading = isLoadingItem || isLoadingLots;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="py-12 text-center">
        <Package className="mx-auto h-12 w-12 text-neutral-300" />
        <p className="mt-4 text-sm text-neutral-500">
          품목을 찾을 수 없습니다.
        </p>
        <Link to="/items" className="mt-4 inline-block">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
            목록으로
          </Button>
        </Link>
      </div>
    );
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('ko-KR').format(value) + '원';

  return (
    <div>
      {/* Open notification */}
      {openNotification && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${
            openNotification.type === 'success'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border border-red-200 bg-red-50 text-red-800'
          }`}
          role="status"
          aria-live="polite"
        >
          {openNotification.message}
        </div>
      )}

      {/* Back link */}
      <Link
        to={`/items/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700"
      >
        <ArrowLeft className="h-4 w-4" />
        {item.name}
      </Link>

      {/* Header */}
      <div className="mt-3 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <History className="h-6 w-6 text-primary-600" />
            <h2 className="page-title">로트 이력</h2>
          </div>
          <p className="page-description">
            {item.name}의 입고 이력입니다. 현재 총 재고:{' '}
            <span className="font-semibold text-neutral-900">
              {item.currentStock} {item.openUnit}
            </span>
          </p>
        </div>
        <Link to={`/lots/new?itemId=${id}`}>
          <Button>
            <ClipboardPlus className="h-4 w-4" />
            입고 등록
          </Button>
        </Link>
      </div>

      {/* Lots list */}
      {lots.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center">
          <History className="mx-auto h-12 w-12 text-neutral-300" />
          <p className="mt-4 text-sm text-neutral-500">
            입고 이력이 없습니다.
          </p>
          <Link to={`/lots/new?itemId=${id}`} className="mt-4 inline-block">
            <Button variant="outline" size="sm">
              <ClipboardPlus className="h-4 w-4" />
              첫 입고 등록하기
            </Button>
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {lots.map((lot) => {
            const isExpired = lot.isExpired ?? (
              lot.expiryDate &&
              new Date(lot.expiryDate) < new Date()
            );
            const isExpiringSoon = lot.isExpiringSoon ?? (
              lot.expiryDate &&
              !isExpired &&
              new Date(lot.expiryDate).getTime() - Date.now() <
                30 * 24 * 60 * 60 * 1000
            );

            return (
              <Card key={lot.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    {/* Purchase date and supplier */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-neutral-900">
                        <Calendar className="h-4 w-4 text-neutral-400" />
                        {format(new Date(lot.purchaseDate), 'yyyy-MM-dd')}
                      </div>
                      {lot.supplier && (
                        <div className="flex items-center gap-1.5 text-sm text-neutral-600">
                          <Truck className="h-4 w-4 text-neutral-400" />
                          {lot.supplier.name}
                        </div>
                      )}
                    </div>

                    {/* Details row */}
                    <div className="flex items-center gap-4 text-sm text-neutral-600">
                      {lot.unitPrice != null && (
                        <span>단가: {formatCurrency(lot.unitPrice)}</span>
                      )}
                      {lot.expiryDate && (
                        <span>
                          유효기간:{' '}
                          {format(
                            new Date(lot.expiryDate),
                            'yyyy-MM-dd',
                          )}
                        </span>
                      )}
                    </div>

                    {/* Notes */}
                    {lot.note && (
                      <p className="text-xs text-neutral-500">{lot.note}</p>
                    )}
                  </div>

                  {/* Quantity, badges, and open button */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <span className="text-lg font-bold text-neutral-900">
                        {lot.unopenedQty}
                      </span>
                      <span className="text-sm text-neutral-400">
                        /{lot.initialQty} {item.openUnit}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      {isExpired && (
                        <Badge variant="destructive">만료됨</Badge>
                      )}
                      {isExpiringSoon && (
                        <Badge variant="warning">만료 임박</Badge>
                      )}
                      {lot.unopenedQty === 0 && (
                        <Badge variant="secondary">소진</Badge>
                      )}
                    </div>
                    <Button
                      onClick={() => openMutation.mutate(lot.id)}
                      disabled={
                        lot.unopenedQty === 0 ||
                        (openMutation.isPending &&
                          openMutation.variables === lot.id)
                      }
                      className={
                        lot.unopenedQty === 0
                          ? ''
                          : 'bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500'
                      }
                      size="sm"
                      aria-label={`${item.name} 로트 오픈`}
                    >
                      {openMutation.isPending &&
                      openMutation.variables === lot.id ? (
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <PackageOpen className="h-3.5 w-3.5" />
                      )}
                      오픈
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
