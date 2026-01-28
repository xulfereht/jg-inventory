import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  ArrowLeft,
  Edit,
  Trash2,
  History,
  ClipboardPlus,
  Star,
  Calendar,
  Truck,
  PackageOpen,
} from 'lucide-react';
import { format } from 'date-fns';
import { getItem, deleteItem, toggleFavorite, getItemLots, createOpenEvent } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/Dialog';

export function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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

  // Fetch item
  const {
    data: item,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['item', id],
    queryFn: () => getItem(id!),
    enabled: Boolean(id),
  });

  // Fetch recent lots
  const { data: lots = [] } = useQuery({
    queryKey: ['itemLots', id],
    queryFn: () => getItemLots(id!),
    enabled: Boolean(id),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => deleteItem(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      navigate('/items');
    },
  });

  // Toggle favorite mutation
  const favoriteMutation = useMutation({
    mutationFn: () => toggleFavorite(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item', id] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  // Open mutation
  const openMutation = useMutation({
    mutationFn: () => createOpenEvent({ itemId: id! }),
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !item) {
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

  const recentLots = lots.slice(0, 3);

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
        to="/items"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700"
      >
        <ArrowLeft className="h-4 w-4" />
        품목 목록
      </Link>

      {/* Header */}
      <div className="mt-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100">
            <Package className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="page-title">{item.name}</h2>
              <button
                onClick={() => favoriteMutation.mutate()}
                className="rounded-lg p-1 transition-colors hover:bg-neutral-100"
                aria-label={
                  item.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'
                }
              >
                <Star
                  className={`h-5 w-5 ${
                    item.isFavorite
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-neutral-300'
                  }`}
                />
              </button>
            </div>
            {item.storage && (
              <p className="page-description">{item.storage}</p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Link to={`/items/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" />
              수정
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            삭제
          </Button>
        </div>
      </div>

      {/* Info grid */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-medium text-neutral-500">현재 재고</p>
          <p
            className={`mt-1 text-2xl font-bold ${
              item.currentStock <= 0 ? 'text-red-600' : 'text-neutral-900'
            }`}
          >
            {item.currentStock}
            <span className="ml-1 text-sm font-normal text-neutral-400">
              {item.openUnit}
            </span>
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-neutral-500">기본 단위</p>
          <p className="mt-1 text-lg font-semibold text-neutral-900">
            {item.openUnit}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-neutral-500">등록일</p>
          <p className="mt-1 text-lg font-semibold text-neutral-900">
            {format(new Date(item.createdAt), 'yyyy-MM-dd')}
          </p>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="mt-6 flex gap-3">
        <Button
          onClick={() => openMutation.mutate()}
          disabled={item.currentStock <= 0 || openMutation.isPending}
          className="bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500"
          size="lg"
          aria-label={`${item.name} 오픈`}
        >
          {openMutation.isPending ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <PackageOpen className="h-4 w-4" />
          )}
          오픈
        </Button>
        <Link to={`/items/${id}/lots`}>
          <Button variant="outline">
            <History className="h-4 w-4" />
            로트 이력
          </Button>
        </Link>
        <Link to={`/lots/new?itemId=${id}`}>
          <Button>
            <ClipboardPlus className="h-4 w-4" />
            입고 등록
          </Button>
        </Link>
      </div>

      {/* Recent lots preview */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-neutral-700">
          최근 입고 이력
        </h3>
        {recentLots.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">
            입고 이력이 없습니다.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {recentLots.map((lot) => {
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
                <Card key={lot.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-sm text-neutral-600">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(lot.purchaseDate), 'yyyy-MM-dd')}
                      </div>
                      {lot.supplier && (
                        <div className="flex items-center gap-1.5 text-sm text-neutral-600">
                          <Truck className="h-3.5 w-3.5" />
                          {lot.supplier.name}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-neutral-900">
                        <span className="font-semibold">
                          {lot.unopenedQty}
                        </span>
                        <span className="text-neutral-400">
                          /{lot.initialQty} {item.openUnit}
                        </span>
                      </span>
                      {isExpired && (
                        <Badge variant="destructive">만료됨</Badge>
                      )}
                      {isExpiringSoon && (
                        <Badge variant="warning">만료 임박</Badge>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
        {lots.length > 3 && (
          <Link
            to={`/items/${id}/lots`}
            className="mt-3 inline-block text-sm text-primary-600 hover:text-primary-700"
          >
            전체 이력 보기 ({lots.length}건)
          </Link>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="품목 삭제"
        description={`"${item.name}" 품목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        cancelLabel="취소"
        variant="destructive"
      />
    </div>
  );
}
