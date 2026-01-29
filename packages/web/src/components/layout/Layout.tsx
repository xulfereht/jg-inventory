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
        <div className="border-t border-neutral-200 px-4 py-3 space-y-2">
          {/* Help Button */}
          <button
            onClick={() => setShowHelp(true)}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
            도움말
          </button>

          {/* Server Access Info */}
          {serverInfo && serverInfo.urls.length > 0 && (
            <div className="rounded-lg bg-neutral-50 p-2">
              <p className="text-[10px] font-medium text-neutral-500 mb-1">
                다른 기기 접속 주소
              </p>
              {serverInfo.urls.map((url) => (
                <button
                  key={url}
                  onClick={() => copyToClipboard(url)}
                  className="flex w-full items-center gap-1 text-[11px] text-primary-600 hover:text-primary-700 font-mono"
                >
                  {copiedUrl === url ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  {url}
                </button>
              ))}
            </div>
          )}

          {/* Copyright */}
          <div className="text-center pt-1">
            <p className="text-[10px] text-neutral-400">JG Inventory v0.1.0</p>
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

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl mx-4">
            <button
              onClick={() => setShowHelp(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold text-neutral-900 mb-4">
              JG 한약재 재고관리 사용 가이드
            </h2>

            <div className="space-y-6 text-sm text-neutral-600">
              {/* Quick Start */}
              <section>
                <h3 className="font-semibold text-neutral-800 mb-2">빠른 시작</h3>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li><strong>품목 등록</strong>: 품목 관리 → 새 품목 추가</li>
                  <li><strong>입고 등록</strong>: 입고 등록 → 품목 선택 후 수량/단가 입력</li>
                  <li><strong>개봉 차감</strong>: 오픈 차감 → 품목 클릭으로 1개 차감</li>
                </ol>
              </section>

              {/* Core Features */}
              <section>
                <h3 className="font-semibold text-neutral-800 mb-2">핵심 기능</h3>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-neutral-700">오픈 차감</p>
                    <p className="text-neutral-500">새 약재를 개봉할 때 버튼 하나로 재고 차감. 유통기한 임박 로트부터 자동 선택(FEFO)됩니다.</p>
                  </div>
                  <div>
                    <p className="font-medium text-neutral-700">알림 시스템</p>
                    <p className="text-neutral-500">재고 부족, 유통기한 임박, 만료 품목을 자동으로 알려줍니다.</p>
                  </div>
                  <div>
                    <p className="font-medium text-neutral-700">실사 기능</p>
                    <p className="text-neutral-500">실제 재고와 시스템 재고를 비교하고 차이를 조정할 수 있습니다.</p>
                  </div>
                </div>
              </section>

              {/* Network Access */}
              <section>
                <h3 className="font-semibold text-neutral-800 mb-2">네트워크 접속</h3>
                <div className="rounded-lg bg-blue-50 p-3">
                  <p className="text-blue-800 mb-2">
                    같은 네트워크의 다른 기기(스마트폰, 태블릿, 다른 PC)에서 접속하려면:
                  </p>
                  {serverInfo && serverInfo.urls.length > 0 ? (
                    <div className="space-y-1">
                      {serverInfo.urls.map((url) => (
                        <div key={url} className="flex items-center gap-2">
                          <code className="flex-1 rounded bg-white px-2 py-1 text-blue-700 font-mono text-xs">
                            {url}
                          </code>
                          <button
                            onClick={() => copyToClipboard(url)}
                            className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 hover:bg-blue-200"
                          >
                            {copiedUrl === url ? '복사됨!' : '복사'}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-blue-600 text-xs">서버 정보를 불러오는 중...</p>
                  )}
                  <p className="text-blue-600 text-xs mt-2">
                    * 클라이언트는 별도 설치 없이 브라우저만 있으면 됩니다.
                  </p>
                </div>
              </section>

              {/* Firewall Troubleshooting */}
              <section>
                <h3 className="font-semibold text-neutral-800 mb-2">다른 기기에서 접속이 안 될 때</h3>
                <div className="rounded-lg bg-amber-50 p-3 space-y-2">
                  <p className="text-amber-800 text-sm font-medium">
                    Windows 방화벽 설정 확인
                  </p>
                  <ol className="list-decimal list-inside text-xs text-amber-700 space-y-1">
                    <li>프로그램 첫 실행 시 "네트워크 액세스 허용" 팝업에서 <strong>허용</strong> 클릭</li>
                    <li>팝업을 놓쳤다면: Windows 검색 → "방화벽" → "앱 허용"</li>
                    <li>"설정 변경" → jg-inventory-win.exe 찾기 → <strong>개인</strong> 체크</li>
                  </ol>
                  <p className="text-amber-600 text-xs mt-2">
                    * 서버 PC에서 본인 IP로 접속은 되는데 다른 기기에서 안 되면 방화벽 문제입니다.
                  </p>
                </div>
              </section>

              {/* Tips */}
              <section>
                <h3 className="font-semibold text-neutral-800 mb-2">팁</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-neutral-500">
                  <li>자주 사용하는 품목은 <strong>즐겨찾기</strong>에 추가하세요</li>
                  <li>월 1회 <strong>실사</strong>로 재고 정확도를 유지하세요</li>
                  <li><strong>리포트</strong>에서 구매처별 월간 분석을 확인하세요</li>
                </ul>
              </section>

              {/* Support */}
              <section className="border-t pt-4">
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
