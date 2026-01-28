import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardCheck, Plus, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import {
  getInventoryCounts,
  createInventoryCount,
  deleteInventoryCount,
} from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/Dialog';
import type { InventoryCount } from '@/types';

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

export function InventoryCountListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<InventoryCount | null>(null);

  const { data: counts = [], isLoading } = useQuery({
    queryKey: ['inventoryCounts'],
    queryFn: getInventoryCounts,
  });

  const createMutation = useMutation({
    mutationFn: createInventoryCount,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventoryCounts'] });
      navigate(`/inventory-counts/${data.id}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInventoryCount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryCounts'] });
      setDeleteTarget(null);
    },
  });

  const handleDelete = (e: React.MouseEvent, count: InventoryCount) => {
    e.stopPropagation();
    setDeleteTarget(count);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <ClipboardCheck className="h-6 w-6 text-primary-600" />
            <h2 className="page-title">실사 관리</h2>
          </div>
          <p className="page-description">
            재고 실사를 생성하고 관리합니다.
          </p>
        </div>
        <Button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          새 실사
        </Button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="mt-8 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          <p className="mt-2 text-sm text-neutral-500">불러오는 중...</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && counts.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center">
          <ClipboardCheck className="mx-auto h-12 w-12 text-neutral-300" />
          <p className="mt-4 text-sm text-neutral-500">
            등록된 실사가 없습니다.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
          >
            <Plus className="h-4 w-4" />
            첫 실사 시작하기
          </Button>
        </div>
      )}

      {/* Counts list */}
      {!isLoading && counts.length > 0 && (
        <div className="mt-6 space-y-3">
          {counts.map((count) => (
            <Card
              key={count.id}
              className="cursor-pointer p-4 transition-shadow hover:shadow-md"
              onClick={() => navigate(`/inventory-counts/${count.id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(count.countDate), 'yyyy-MM-dd')}
                  </div>
                  <Badge variant={statusVariants[count.status]}>
                    {statusLabels[count.status]}
                  </Badge>
                  {count.countItems && (
                    <span className="text-sm text-neutral-500">
                      {count.countItems.length}개 품목
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {count.status === 'draft' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={(e) => handleDelete(e, count)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              {count.note && (
                <p className="mt-2 text-sm text-neutral-500">{count.note}</p>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="실사 삭제"
        description="이 실사를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmLabel="삭제"
        cancelLabel="취소"
        variant="destructive"
      />
    </div>
  );
}
