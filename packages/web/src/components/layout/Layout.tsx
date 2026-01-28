import { type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Package,
  Truck,
  ClipboardPlus,
  Pill,
  PackageOpen,
  ClipboardCheck,
  Bell,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAlertSummary } from '@/lib/api';

const navigation = [
  { name: '품목 관리', href: '/items', icon: Package },
  { name: '구매처 관리', href: '/suppliers', icon: Truck },
  { name: '입고 등록', href: '/lots/new', icon: ClipboardPlus },
];

const secondaryNavigation = [
  { name: '실사 관리', href: '/inventory-counts', icon: ClipboardCheck },
  { name: '알림', href: '/alerts', icon: Bell, showBadge: true },
  { name: '리포트', href: '/reports', icon: BarChart3 },
];

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { data: alertSummary } = useQuery({
    queryKey: ['alertSummary'],
    queryFn: getAlertSummary,
    refetchInterval: 60000,
  });

  const activeAlertCount =
    (alertSummary?.low_stock ?? 0) +
    (alertSummary?.expiring_soon ?? 0) +
    (alertSummary?.expired ?? 0);

  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Sidebar */}
      <aside className="flex w-60 flex-col border-r border-neutral-200 bg-white">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-neutral-200 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
            <Pill className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-neutral-900">
            JG 한약재
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {/* Primary action: Open */}
          <NavLink
            to="/open"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
                isActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700',
              )
            }
          >
            <PackageOpen className="h-5 w-5 flex-shrink-0" />
            오픈 차감
          </NavLink>

          <div className="my-2 border-t border-neutral-100" />

          {navigation.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
                )
              }
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.name}
            </NavLink>
          ))}

          <div className="my-2 border-t border-neutral-100" />

          {secondaryNavigation.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
                )
              }
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.name}
              {item.showBadge && activeAlertCount > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
                  {activeAlertCount > 99 ? '99+' : activeAlertCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-neutral-200 px-5 py-3">
          <p className="text-xs text-neutral-400">JG Inventory v0.1.0</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center border-b border-neutral-200 bg-white px-6">
          <h1 className="text-lg font-semibold text-neutral-800">
            JG 한약재 재고관리
          </h1>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="page-container">{children}</div>
        </main>
      </div>
    </div>
  );
}
