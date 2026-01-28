import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { getSupplier, createSupplier, updateSupplier } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function SupplierFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch existing supplier for edit mode
  const { data: existingSupplier, isLoading: isLoadingSupplier } = useQuery({
    queryKey: ['supplier', id],
    queryFn: () => getSupplier(id!),
    enabled: isEdit,
  });

  // Populate form
  useEffect(() => {
    if (existingSupplier) {
      setName(existingSupplier.name);
      setContactName(existingSupplier.contactName ?? '');
      setPhone(existingSupplier.phone ?? '');
      setEmail(existingSupplier.email ?? '');
      setAddress(existingSupplier.address ?? '');
      setNotes(existingSupplier.notes ?? '');
    }
  }, [existingSupplier]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      navigate('/suppliers');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: Parameters<typeof updateSupplier>[1];
    }) => updateSupplier(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier', id] });
      navigate('/suppliers');
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = '거래처명을 입력해주세요.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const dto = {
      name: name.trim(),
      contactName: contactName.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
      notes: notes.trim() || null,
    };

    if (isEdit && id) {
      updateMutation.mutate({ id, dto });
    } else {
      createMutation.mutate(dto);
    }
  };

  if (isEdit && isLoadingSupplier) {
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
          to="/suppliers"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700"
        >
          <ArrowLeft className="h-4 w-4" />
          구매처 목록
        </Link>
        <h2 className="page-title mt-2">
          {isEdit ? '구매처 수정' : '구매처 등록'}
        </h2>
        <p className="page-description">
          {isEdit
            ? '구매처 정보를 수정합니다.'
            : '새로운 구매처를 등록합니다.'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-6 max-w-lg space-y-5">
        <Input
          label="거래처명"
          placeholder="예: 경동시장 한약재상"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          required
        />

        <Input
          label="담당자명"
          placeholder="담당자 이름 (선택)"
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
        />

        <Input
          label="연락처"
          placeholder="전화번호 (선택)"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <Input
          label="이메일"
          placeholder="이메일 주소 (선택)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          label="주소"
          placeholder="주소 (선택)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-neutral-700">
            비고
          </label>
          <textarea
            placeholder="비고 사항 (선택)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="flex w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

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
            onClick={() => navigate('/suppliers')}
          >
            취소
          </Button>
        </div>
      </form>
    </div>
  );
}
