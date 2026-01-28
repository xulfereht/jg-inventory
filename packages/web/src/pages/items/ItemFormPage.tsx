import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { getItem, createItem, updateItem } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

const UNIT_OPTIONS = [
  { value: 'g', label: 'g (그램)' },
  { value: 'kg', label: 'kg (킬로그램)' },
  { value: '근', label: '근' },
  { value: '봉', label: '봉' },
  { value: '팩', label: '팩' },
  { value: '박스', label: '박스' },
  { value: '개', label: '개' },
  { value: '포', label: '포' },
];

export function ItemFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const [name, setName] = useState('');
  const [openUnit, setOpenUnit] = useState('봉');
  const [safetyStock, setSafetyStock] = useState(5);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch existing item for edit mode
  const { data: existingItem, isLoading: isLoadingItem } = useQuery({
    queryKey: ['item', id],
    queryFn: () => getItem(id!),
    enabled: isEdit,
  });

  // Populate form with existing data
  useEffect(() => {
    if (existingItem) {
      setName(existingItem.name);
      setOpenUnit(existingItem.openUnit);
      setSafetyStock(existingItem.safetyStock);
    }
  }, [existingItem]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      navigate('/items');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Parameters<typeof updateItem>[1] }) =>
      updateItem(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['item', id] });
      navigate('/items');
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = '품목명을 입력해주세요.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const dto = {
      name: name.trim(),
      openUnit,
      safetyStock,
    };

    if (isEdit && id) {
      updateMutation.mutate({ id, dto });
    } else {
      createMutation.mutate(dto);
    }
  };

  if (isEdit && isLoadingItem) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div>
        <Link
          to="/items"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700"
        >
          <ArrowLeft className="h-4 w-4" />
          품목 목록
        </Link>
        <h2 className="page-title mt-2">
          {isEdit ? '품목 수정' : '품목 등록'}
        </h2>
        <p className="page-description">
          {isEdit
            ? '품목 정보를 수정합니다.'
            : '새로운 한약재 품목을 등록합니다.'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-6 max-w-lg space-y-5">
        <Input
          label="표준 품목명"
          placeholder="예: 황기, 당귀"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          required
        />

        <Select
          label="기본 단위"
          options={UNIT_OPTIONS}
          value={openUnit}
          onChange={(e) => setOpenUnit(e.target.value)}
        />

        <Input
          label="안전 재고"
          type="number"
          min={0}
          value={safetyStock}
          onChange={(e) => setSafetyStock(Number(e.target.value))}
        />

        {/* Error messages from API */}
        {(createMutation.error || updateMutation.error) && (
          <p className="text-sm text-red-600">
            저장 중 오류가 발생했습니다. 다시 시도해주세요.
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isPending}>
            <Save className="h-4 w-4" />
            {isPending ? '저장 중...' : isEdit ? '수정' : '등록'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/items')}
          >
            취소
          </Button>
        </div>
      </form>
    </div>
  );
}
