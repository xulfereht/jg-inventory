import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, ClipboardPlus, Search, X } from 'lucide-react';
import { format } from 'date-fns';
import {
  autocompleteItems,
  getSuppliers,
  getItem,
  createLot,
} from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

export function LotFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const presetItemId = searchParams.get('itemId');

  // Form state
  const [selectedItemId, setSelectedItemId] = useState(presetItemId ?? '');
  const [selectedItemName, setSelectedItemName] = useState('');
  const [selectedItemUnit, setSelectedItemUnit] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(
    format(new Date(), 'yyyy-MM-dd'),
  );
  const [expiryDate, setExpiryDate] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [initialQty, setInitialQty] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Autocomplete state
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce item search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(itemSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [itemSearchQuery]);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch autocomplete suggestions
  const { data: suggestions = [] } = useQuery({
    queryKey: ['autocomplete', debouncedQuery],
    queryFn: () => autocompleteItems(debouncedQuery),
    enabled: debouncedQuery.length > 0,
  });

  // Fetch preset item info
  const { data: presetItem } = useQuery({
    queryKey: ['item', presetItemId],
    queryFn: () => getItem(presetItemId!),
    enabled: Boolean(presetItemId),
  });

  // Set preset item on load
  useEffect(() => {
    if (presetItem && presetItemId) {
      setSelectedItemId(presetItem.id);
      setSelectedItemName(presetItem.name);
      setSelectedItemUnit(presetItem.openUnit);
    }
  }, [presetItem, presetItemId]);

  // Fetch suppliers
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: getSuppliers,
  });

  // Create lot mutation
  const createMutation = useMutation({
    mutationFn: createLot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['item', selectedItemId] });
      queryClient.invalidateQueries({ queryKey: ['itemLots', selectedItemId] });
      if (selectedItemId) {
        navigate(`/items/${selectedItemId}/lots`);
      } else {
        navigate('/items');
      }
    },
  });

  const selectItem = (item: { id: string; name: string }) => {
    setSelectedItemId(item.id);
    setSelectedItemName(item.name);
    setItemSearchQuery('');
    setShowSuggestions(false);
    // Fetch the item to get its unit
    getItem(item.id).then((full) => {
      setSelectedItemUnit(full.openUnit);
    });
  };

  const clearSelectedItem = () => {
    setSelectedItemId('');
    setSelectedItemName('');
    setSelectedItemUnit('');
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!selectedItemId) {
      newErrors.item = '품목을 선택해주세요.';
    }
    if (!purchaseDate) {
      newErrors.purchaseDate = '구입일자를 입력해주세요.';
    }
    if (!initialQty || Number(initialQty) <= 0) {
      newErrors.initialQty = '수량을 입력해주세요.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    createMutation.mutate({
      itemId: selectedItemId,
      supplierId: supplierId || null,
      initialQty: Number(initialQty),
      unitPrice: unitPrice ? Number(unitPrice) : null,
      expiryDate: expiryDate || null,
      purchaseDate: purchaseDate,
      note: note.trim() || null,
    });
  };

  const supplierOptions = [
    { value: '', label: '선택 안함' },
    ...suppliers.map((s) => ({ value: s.id, label: s.name })),
  ];

  return (
    <div>
      {/* Header */}
      <div>
        <Link
          to={selectedItemId ? `/items/${selectedItemId}` : '/items'}
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700"
        >
          <ArrowLeft className="h-4 w-4" />
          {selectedItemName || '품목 목록'}
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <ClipboardPlus className="h-6 w-6 text-primary-600" />
          <h2 className="page-title">입고 등록</h2>
        </div>
        <p className="page-description">
          새로운 입고(로트) 정보를 등록합니다.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-6 max-w-lg space-y-5">
        {/* Item selection with autocomplete */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-neutral-700">
            품목 <span className="text-red-500">*</span>
          </label>
          {selectedItemId ? (
            <div className="flex h-10 items-center gap-2 rounded-lg border border-neutral-300 bg-neutral-50 px-3">
              <span className="flex-1 text-sm text-neutral-900">
                {selectedItemName}
              </span>
              {!presetItemId && (
                <button
                  type="button"
                  onClick={clearSelectedItem}
                  className="rounded p-0.5 text-neutral-400 hover:text-neutral-600"
                  aria-label="품목 선택 해제"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder="품목명 검색..."
                value={itemSearchQuery}
                onChange={(e) => {
                  setItemSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className={`flex h-10 w-full rounded-lg border bg-white pl-10 pr-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 ${
                  errors.item
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20'
                }`}
              />
              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-10 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg"
                >
                  {suggestions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => selectItem(s)}
                      className="flex w-full items-center px-3 py-2.5 text-left text-sm text-neutral-900 hover:bg-neutral-50 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
              {showSuggestions &&
                debouncedQuery.length > 0 &&
                suggestions.length === 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-neutral-200 bg-white p-3 shadow-lg">
                    <p className="text-sm text-neutral-500">
                      검색 결과가 없습니다.
                    </p>
                  </div>
                )}
            </div>
          )}
          {errors.item && (
            <p className="text-xs text-red-600" role="alert">
              {errors.item}
            </p>
          )}
        </div>

        {/* Supplier */}
        <Select
          label="구매처"
          options={supplierOptions}
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
          placeholder="구매처 선택 (선택)"
        />

        {/* Purchase date */}
        <Input
          label="구입일자"
          type="date"
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
          error={errors.purchaseDate}
          required
        />

        {/* Expiration date */}
        <Input
          label="유효기간"
          type="date"
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
        />

        {/* Unit price */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-neutral-700">
            단가
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              placeholder="0"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 pr-10 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
              원
            </span>
          </div>
        </div>

        {/* Quantity */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-neutral-700">
            수량 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              placeholder="0"
              value={initialQty}
              onChange={(e) => setInitialQty(e.target.value)}
              className={`flex h-10 w-full rounded-lg border bg-white px-3 py-2 pr-14 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 ${
                errors.initialQty
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20'
              }`}
              required
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
              {selectedItemUnit || '단위'}
            </span>
          </div>
          {errors.initialQty && (
            <p className="text-xs text-red-600" role="alert">
              {errors.initialQty}
            </p>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-neutral-700">
            메모
          </label>
          <textarea
            placeholder="메모 사항 (선택)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="flex w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        {/* Error from API */}
        {createMutation.error && (
          <p className="text-sm text-red-600">
            저장 중 오류가 발생했습니다. 다시 시도해주세요.
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={createMutation.isPending}>
            <Save className="h-4 w-4" />
            {createMutation.isPending ? '저장 중...' : '입고 등록'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              navigate(
                selectedItemId ? `/items/${selectedItemId}` : '/items',
              )
            }
          >
            취소
          </Button>
        </div>
      </form>
    </div>
  );
}
