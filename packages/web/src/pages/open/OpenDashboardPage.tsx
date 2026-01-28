import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  PackageOpen,
  Star,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { getItems, getOpenEvents, createOpenEvent } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { ItemResponse } from '@/types';

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  return `${days}일 전`;
}

interface Notification {
  type: 'success' | 'error';
  message: string;
}

export function OpenDashboardPage() {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [notification, setNotification] = useState<Notification | null>(null);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Auto-hide notification after 2s
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 2000);
    return () => clearTimeout(timer);
  }, [notification]);

  // Fetch favorites
  const { data: favorites = [] } = useQuery({
    queryKey: ['items', { favorite: true }],
    queryFn: () => getItems({ favorite: true }),
  });

  // Fetch search results (only when searching)
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['items', { search: debouncedSearch }],
    queryFn: () => getItems({ search: debouncedSearch }),
    enabled: debouncedSearch.length > 0,
  });

  // Fetch recent open events
  const { data: recentEvents = [] } = useQuery({
    queryKey: ['openEvents', { limit: 10 }],
    queryFn: () => getOpenEvents({ limit: 10 }),
  });

  // Open mutation
  const openMutation = useMutation({
    mutationFn: createOpenEvent,
    onSuccess: (data) => {
      setNotification({
        type: 'success',
        message: `${data.item.name} ${data.quantity}${data.item.openUnit} 오픈 완료`,
      });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['openEvents'] });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || '오픈에 실패했습니다.';
      setNotification({ type: 'error', message });
    },
  });

  const handleOpen = useCallback(
    (itemId: string) => {
      openMutation.mutate({ itemId });
    },
    [openMutation],
  );

  return (
    <div>
      {/* Notification Banner */}
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

      {/* Header */}
      <div className="flex items-center gap-3">
        <PackageOpen className="h-6 w-6 text-emerald-600" />
        <h2 className="page-title">오픈 차감</h2>
      </div>
      <p className="page-description">
        품목을 선택하여 오픈 차감합니다. FEFO 원칙에 따라 자동 선택됩니다.
      </p>

      {/* Search */}
      <div className="relative mt-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          placeholder="품목명 검색..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex h-10 w-full rounded-lg border border-neutral-300 bg-white py-2 pl-10 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          aria-label="품목명 검색"
        />
      </div>

      {/* Search results */}
      {debouncedSearch && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-neutral-600">검색 결과</h3>
          {isSearching ? (
            <div className="mt-4 text-center">
              <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
            </div>
          ) : searchResults.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-500">
              검색 결과가 없습니다.
            </p>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {searchResults.map((item) => (
                <OpenItemCard
                  key={item.id}
                  item={item}
                  onOpen={() => handleOpen(item.id)}
                  isOpenPending={
                    openMutation.isPending &&
                    openMutation.variables?.itemId === item.id
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Favorites section */}
      {!debouncedSearch && favorites.length > 0 && (
        <div className="mt-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-700">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            즐겨찾기
          </h3>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {favorites.map((item) => (
              <OpenItemCard
                key={item.id}
                item={item}
                onOpen={() => handleOpen(item.id)}
                isOpenPending={
                  openMutation.isPending &&
                  openMutation.variables?.itemId === item.id
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* No favorites message */}
      {!debouncedSearch && favorites.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center">
          <Star className="mx-auto h-10 w-10 text-neutral-300" />
          <p className="mt-3 text-sm text-neutral-500">
            즐겨찾기에 등록된 품목이 없습니다.
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            품목 관리에서 자주 사용하는 품목을 즐겨찾기에 추가하세요.
          </p>
        </div>
      )}

      {/* Recent open events */}
      <div className="mt-8">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
          <Clock className="h-4 w-4 text-neutral-400" />
          최근 오픈 이력
        </h3>
        {recentEvents.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">
            오픈 이력이 없습니다.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {recentEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                    <PackageOpen className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-neutral-900">
                      {event.item.name}
                    </span>
                    <span className="ml-2 text-sm text-neutral-500">
                      {event.quantity}
                      {event.item.openUnit} 오픈
                    </span>
                  </div>
                </div>
                <span className="text-xs text-neutral-400">
                  {formatRelativeTime(event.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Open Item Card ──

function OpenItemCard({
  item,
  onOpen,
  isOpenPending,
}: {
  item: ItemResponse;
  onOpen: () => void;
  isOpenPending: boolean;
}) {
  const isZeroStock = item.currentStock <= 0;
  const isLowStock = item.currentStock > 0 && item.currentStock <= 3;

  return (
    <Card className="flex flex-col p-4">
      <div className="flex-1">
        <h4 className="truncate text-sm font-semibold text-neutral-900">
          {item.name}
        </h4>
        <div className="mt-2 flex items-center gap-1.5">
          <span className="text-xs text-neutral-500">재고</span>
          <span
            className={`text-sm font-bold ${
              isZeroStock
                ? 'text-red-600'
                : isLowStock
                  ? 'text-amber-600'
                  : 'text-neutral-900'
            }`}
          >
            {item.currentStock}
          </span>
          <span className="text-xs text-neutral-400">{item.openUnit}</span>
          {isLowStock && (
            <Badge variant="warning" className="ml-1 gap-1">
              <AlertTriangle className="h-3 w-3" />
              부족
            </Badge>
          )}
        </div>
      </div>

      <Button
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
        disabled={isZeroStock || isOpenPending}
        className={`mt-3 w-full ${
          isZeroStock
            ? ''
            : 'bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500'
        }`}
        size="lg"
        aria-label={`${item.name} 오픈`}
      >
        {isOpenPending ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : isZeroStock ? (
          '재고 없음'
        ) : (
          '오픈 +1'
        )}
      </Button>
    </Card>
  );
}
