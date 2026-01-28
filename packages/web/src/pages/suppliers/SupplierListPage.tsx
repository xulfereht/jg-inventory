import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Truck, Plus, Trash2, Edit, Phone, Mail, MapPin } from 'lucide-react';
import { getSuppliers, deleteSupplier } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/Dialog';

export function SupplierListPage() {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Fetch suppliers
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: getSuppliers,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setDeleteTarget(null);
    },
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Truck className="h-6 w-6 text-primary-600" />
            <h2 className="page-title">구매처 목록</h2>
          </div>
          <p className="page-description">
            등록된 구매처를 조회하고 관리합니다.
          </p>
        </div>
        <Link to="/suppliers/new">
          <Button>
            <Plus className="h-4 w-4" />
            구매처 등록
          </Button>
        </Link>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="mt-8 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          <p className="mt-2 text-sm text-neutral-500">불러오는 중...</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && suppliers.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center">
          <Truck className="mx-auto h-12 w-12 text-neutral-300" />
          <p className="mt-4 text-sm text-neutral-500">
            등록된 구매처가 없습니다.
          </p>
          <Link to="/suppliers/new" className="mt-4 inline-block">
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4" />
              첫 구매처 등록하기
            </Button>
          </Link>
        </div>
      )}

      {/* Supplier list */}
      {!isLoading && suppliers.length > 0 && (
        <div className="mt-6 space-y-3">
          {suppliers.map((supplier) => (
            <Card key={supplier.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-neutral-900">
                    {supplier.name}
                  </h4>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                    {supplier.contactName && (
                      <span className="text-sm text-neutral-600">
                        담당자: {supplier.contactName}
                      </span>
                    )}
                    {supplier.phone && (
                      <span className="flex items-center gap-1 text-sm text-neutral-600">
                        <Phone className="h-3.5 w-3.5 text-neutral-400" />
                        {supplier.phone}
                      </span>
                    )}
                    {supplier.email && (
                      <span className="flex items-center gap-1 text-sm text-neutral-600">
                        <Mail className="h-3.5 w-3.5 text-neutral-400" />
                        {supplier.email}
                      </span>
                    )}
                    {supplier.address && (
                      <span className="flex items-center gap-1 text-sm text-neutral-600">
                        <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                        {supplier.address}
                      </span>
                    )}
                  </div>
                  {supplier.notes && (
                    <p className="mt-1.5 text-xs text-neutral-500">
                      {supplier.notes}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="ml-4 flex gap-1">
                  <Link to={`/suppliers/${supplier.id}/edit`}>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() =>
                      setDeleteTarget({
                        id: supplier.id,
                        name: supplier.name,
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="구매처 삭제"
        description={`"${deleteTarget?.name}" 구매처를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        cancelLabel="취소"
        variant="destructive"
      />
    </div>
  );
}
