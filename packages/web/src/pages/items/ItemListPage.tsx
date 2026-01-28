import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Plus, Search, Star, AlertTriangle } from 'lucide-react';
import { getItems, toggleFavorite } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export function ItemListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch all items with search
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['items', debouncedSearch],
    queryFn: () =>
      getItems(debouncedSearch ? { search: debouncedSearch } : undefined),
  });

  // Toggle favorite mutation
  const favoriteMutation = useMutation({
    mutationFn: toggleFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  const handleToggleFavorite = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      favoriteMutation.mutate(id);
    },
    [favoriteMutation],
  );

  const favorites = items.filter((item) => item.isFavorite);
  const others = items.filter((item) => !item.isFavorite);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-primary-600" />
            <h2 className="page-title">품목 목록</h2>
          </div>
          <p className="page-description">
            등록된 한약재 품목을 조회하고 관리합니다.
          </p>
        </div>
        <Link to="/items/new">
          <Button>
            <Plus className="h-4 w-4" />
            품목 등록
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="mt-6 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          placeholder="품목명으로 검색..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex h-10 w-full rounded-lg border border-neutral-300 bg-white pl-10 pr-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="mt-8 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          <p className="mt-2 text-sm text-neutral-500">불러오는 중...</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && items.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-neutral-300" />
          <p className="mt-4 text-sm text-neutral-500">
            {debouncedSearch
              ? '검색 결과가 없습니다.'
              : '등록된 품목이 없습니다.'}
          </p>
          {!debouncedSearch && (
            <Link to="/items/new" className="mt-4 inline-block">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4" />
                첫 품목 등록하기
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Favorites section */}
      {!isLoading && favorites.length > 0 && (
        <div className="mt-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-700">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            즐겨찾기
          </h3>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onNavigate={() => navigate(`/items/${item.id}`)}
                onToggleFavorite={(e) => handleToggleFavorite(e, item.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* All items section */}
      {!isLoading && others.length > 0 && (
        <div className="mt-6">
          {favorites.length > 0 && (
            <h3 className="text-sm font-semibold text-neutral-600">
              전체 품목
            </h3>
          )}
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onNavigate={() => navigate(`/items/${item.id}`)}
                onToggleFavorite={(e) => handleToggleFavorite(e, item.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ItemCard({
  item,
  onNavigate,
  onToggleFavorite,
}: {
  item: import('@/types').ItemResponse;
  onNavigate: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
}) {
  const isLowStock = item.currentStock <= 0;

  return (
    <Card
      className="cursor-pointer p-4 transition-shadow hover:shadow-md"
      onClick={onNavigate}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold text-neutral-900">
            {item.name}
          </h4>
        </div>
        <button
          onClick={onToggleFavorite}
          className="ml-2 flex-shrink-0 rounded-lg p-1.5 transition-colors hover:bg-neutral-100"
          aria-label={item.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
        >
          <Star
            className={`h-4 w-4 ${
              item.isFavorite
                ? 'fill-amber-400 text-amber-400'
                : 'text-neutral-300'
            }`}
          />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-neutral-500">재고</span>
          <span
            className={`text-sm font-semibold ${
              isLowStock ? 'text-red-600' : 'text-neutral-900'
            }`}
          >
            {item.currentStock}
          </span>
          <span className="text-xs text-neutral-400">{item.openUnit}</span>
        </div>

        {isLowStock && (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            재고 부족
          </Badge>
        )}
      </div>
    </Card>
  );
}
