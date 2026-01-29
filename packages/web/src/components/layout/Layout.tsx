import { type ReactNode, useState } from 'react';
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
  HelpCircle,
  X,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAlertSummary, getServerInfo } from '@/lib/api';

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
  const [showHelp, setShowHelp] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const { data: alertSummary } = useQuery({
    queryKey: ['alertSummary'],
    queryFn: getAlertSummary,
    refetchInterval: 60000,
  });

  const { data: serverInfo } = useQuery({
    queryKey: ['serverInfo'],
    queryFn: getServerInfo,
  });

  const activeAlertCount =
    (alertSummary?.low_stock ?? 0) +
    (alertSummary?.expiring_soon ?? 0) +
    (alertSummary?.expired ?? 0);

  const copyToClipboard = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-neutral-200 bg-white">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-neutral-200 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-soft">
            <Pill className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-base font-bold text-neutral-900">
              JG 한약재
            </span>
            <p className="text-[10px] text-neutral-400">재고관리 시스템</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-thin">
          {/* Primary action: Open */}
          <div className="mb-2">
            <span className="px-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              메인
            </span>
          </div>
          <NavLink
            to="/open"
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-accent-50 text-accent-700 shadow-soft'
                  : 'text-accent-600 hover:bg-accent-50/50 hover:text-accent-700',
              )
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                    isActive ? 'bg-accent-100' : 'bg-accent-50 group-hover:bg-accent-100',
                  )}
                >
                  <PackageOpen className="h-4 w-4" />
                </div>
                <span className="flex-1">오픈 차감</span>
                <ChevronRight
                  className={cn(
                    'h-4 w-4 transition-transform',
                    isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50',
                  )}
                />
              </>
            )}
          </NavLink>

          <div className="my-3 border-t border-neutral-100" />

          <div className="mb-2">
            <span className="px-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              관리
            </span>
          </div>
          {navigation.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary-50 text-primary-700 shadow-soft'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                      isActive
                        ? 'bg-primary-100 text-primary-600'
                        : 'bg-neutral-100 text-neutral-500 group-hover:bg-neutral-200 group-hover:text-neutral-700',
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                  </div>
                  <span className="flex-1">{item.name}</span>
                  <ChevronRight
                    className={cn(
                      'h-4 w-4 transition-transform',
                      isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50',
                    )}
                  />
                </>
              )}
            </NavLink>
          ))}

          <div className="my-3 border-t border-neutral-100" />

          <div className="mb-2">
            <span className="px-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              운영
            </span>
          </div>
          {secondaryNavigation.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary-50 text-primary-700 shadow-soft'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                      isActive
                        ? 'bg-primary-100 text-primary-600'
                        : 'bg-neutral-100 text-neutral-500 group-hover:bg-neutral-200 group-hover:text-neutral-700',
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                  </div>
                  <span className="flex-1">{item.name}</span>
                  {item.showBadge && activeAlertCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-error-500 px-1.5 text-[10px] font-semibold text-white shadow-soft">
                      {activeAlertCount > 99 ? '99+' : activeAlertCount}
                    </span>
                  )}
                  {!item.showBadge && (
                    <ChevronRight
                      className={cn(
                        'h-4 w-4 transition-transform',
                        isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50',
                      )}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-neutral-200 p-4 space-y-3">
          {/* Help Button */}
          <button
            onClick={() => setShowHelp(true)}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
          >
            <HelpCircle className="h-4 w-4" />
            <span>도움말</span>
          </button>

          {/* Server Access Info */}
          {serverInfo && serverInfo.urls.length > 0 && (
            <div className="rounded-xl bg-neutral-50 p-3">
              <p className="text-[10px] font-medium text-neutral-500 mb-2">
                다른 기기 접속
              </p>
              <div className="space-y-1.5">
                {serverInfo.urls.map((url) => (
                  <button
                    key={url}
                    onClick={() => copyToClipboard(url)}
                    className="flex w-full items-center gap-1.5 rounded-lg bg-white px-2 py-1.5 text-[11px] text-primary-600 font-mono transition-colors hover:bg-primary-50"
                  >
                    {copiedUrl === url ? (
                      <Check className="h-3 w-3 text-success-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    <span className="truncate">{url}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Copyright */}
          <div className="text-center pt-1">
            <p className="text-[10px] text-neutral-400">JG Inventory v0.2.0</p>
            <a
              href="https://aimo.liveklass.com/classes/284812"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-neutral-400 hover:text-primary-500 transition-colors"
            >
              Powered by AIMO
            </a>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-6">
          <h1 className="text-base font-semibold text-neutral-800">
            JG 한약재 재고관리
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">
              {new Date().toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'short',
              })}
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="page-container">{children}</div>
        </main>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-medium mx-4 animate-fade-in scrollbar-thin">
            <button
              onClick={() => setShowHelp(false)}
              className="absolute right-4 top-4 rounded-xl p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold text-neutral-900 mb-4">
              JG 한약재 재고관리 사용 가이드
            </h2>

            <div className="space-y-6 text-sm text-neutral-600">
              {/* Quick Start */}
              <section className="rounded-xl bg-primary-50 p-4">
                <h3 className="font-semibold text-primary-800 mb-2">빠른 시작</h3>
                <ol className="list-decimal list-inside space-y-1.5 ml-1 text-primary-700">
                  <li><strong>품목 등록</strong>: 품목 관리 → 새 품목 추가</li>
                  <li><strong>입고 등록</strong>: 입고 등록 → 품목 선택 후 수량/단가 입력</li>
                  <li><strong>개봉 차감</strong>: 오픈 차감 → 품목 클릭으로 1개 차감</li>
                </ol>
              </section>

              {/* Core Features */}
              <section>
                <h3 className="font-semibold text-neutral-800 mb-3">핵심 기능</h3>
                <div className="space-y-3">
                  <div className="flex gap-3 items-start">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-100">
                      <PackageOpen className="h-4 w-4 text-accent-600" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-700">오픈 차감</p>
                      <p className="text-neutral-500 text-xs mt-0.5">새 약재를 개봉할 때 버튼 하나로 재고 차감. 유통기한 임박 로트부터 자동 선택(FEFO)됩니다.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning-50">
                      <Bell className="h-4 w-4 text-warning-600" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-700">알림 시스템</p>
                      <p className="text-neutral-500 text-xs mt-0.5">재고 부족, 유통기한 임박, 만료 품목을 자동으로 알려줍니다.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-info-50">
                      <ClipboardCheck className="h-4 w-4 text-info-600" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-700">실사 기능</p>
                      <p className="text-neutral-500 text-xs mt-0.5">실제 재고와 시스템 재고를 비교하고 차이를 조정할 수 있습니다.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Network Access */}
              <section>
                <h3 className="font-semibold text-neutral-800 mb-2">네트워크 접속</h3>
                <div className="rounded-xl bg-info-50 p-4">
                  <p className="text-info-800 mb-2 text-xs">
                    같은 네트워크의 다른 기기(스마트폰, 태블릿, 다른 PC)에서 접속하려면:
                  </p>
                  {serverInfo && serverInfo.urls.length > 0 ? (
                    <div className="space-y-1.5">
                      {serverInfo.urls.map((url) => (
                        <div key={url} className="flex items-center gap-2">
                          <code className="flex-1 rounded-lg bg-white px-2 py-1.5 text-info-700 font-mono text-xs">
                            {url}
                          </code>
                          <button
                            onClick={() => copyToClipboard(url)}
                            className="rounded-lg bg-info-100 px-2.5 py-1.5 text-xs font-medium text-info-700 hover:bg-info-200 transition-colors"
                          >
                            {copiedUrl === url ? '복사됨!' : '복사'}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-info-600 text-xs">서버 정보를 불러오는 중...</p>
                  )}
                  <p className="text-info-600 text-xs mt-2">
                    * 클라이언트는 별도 설치 없이 브라우저만 있으면 됩니다.
                  </p>
                </div>
              </section>

              {/* Firewall Troubleshooting */}
              <section>
                <h3 className="font-semibold text-neutral-800 mb-2">다른 기기에서 접속이 안 될 때</h3>
                <div className="rounded-xl bg-warning-50 p-4 space-y-2">
                  <p className="text-warning-800 text-xs font-medium">
                    Windows 방화벽 설정 확인
                  </p>
                  <ol className="list-decimal list-inside text-xs text-warning-700 space-y-1">
                    <li>프로그램 첫 실행 시 "네트워크 액세스 허용" 팝업에서 <strong>허용</strong> 클릭</li>
                    <li>팝업을 놓쳤다면: Windows 검색 → "방화벽" → "앱 허용"</li>
                    <li>"설정 변경" → jg-inventory-win.exe 찾기 → <strong>개인</strong> 체크</li>
                  </ol>
                  <p className="text-warning-600 text-xs mt-2">
                    * 서버 PC에서 본인 IP로 접속은 되는데 다른 기기에서 안 되면 방화벽 문제입니다.
                  </p>
                </div>
              </section>

              {/* Tips */}
              <section>
                <h3 className="font-semibold text-neutral-800 mb-2">팁</h3>
                <ul className="space-y-1.5 ml-1 text-neutral-500 text-xs">
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-neutral-400" />
                    자주 사용하는 품목은 <strong className="text-neutral-700">즐겨찾기</strong>에 추가하세요
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-neutral-400" />
                    월 1회 <strong className="text-neutral-700">실사</strong>로 재고 정확도를 유지하세요
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-neutral-400" />
                    <strong className="text-neutral-700">리포트</strong>에서 구매처별 월간 분석을 확인하세요
                  </li>
                </ul>
              </section>

              {/* Support */}
              <section className="border-t border-neutral-200 pt-4">
                <p className="text-xs text-neutral-400">
                  더 자세한 내용은{' '}
                  <a
                    href="https://aimo.liveklass.com/classes/284812"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-500 hover:underline inline-flex items-center gap-1"
                  >
                    AIMO 강의 <ExternalLink className="h-3 w-3" />
                  </a>
                  에서 확인하세요.
                </p>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
