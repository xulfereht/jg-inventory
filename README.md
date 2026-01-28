# JG 한약재 재고관리 시스템

한의원을 위한 한약재 재고관리 시스템입니다. 단일 실행 파일로 배포되어 설치 없이 바로 사용할 수 있습니다.

## 주요 기능

### 1. 품목 관리
- **품목 등록/수정/삭제**: 한약재 품목 정보 관리
- **단위 설정**: 봉, 근, kg, 박스 등 품목별 개봉 단위 지정
- **안전재고 설정**: 품목별 최소 보유 수량 설정
- **즐겨찾기**: 자주 사용하는 품목 빠른 접근
- **동의어 지원**: 품목 검색 시 동의어로도 검색 가능

### 2. 입고(로트) 관리
- **입고 등록**: 구매일, 유통기한, 수량, 단가, 원산지 기록
- **구매처별 관리**: 입고 시 구매처 연결
- **로트 추적**: 동일 품목의 여러 입고 건 개별 관리
- **FEFO 방식**: 유통기한 빠른 순서로 자동 소진

### 3. 개봉 관리 (핵심 기능)
- **원클릭 개봉**: 품목 선택 후 버튼 하나로 개봉 처리
- **즐겨찾기 빠른 접근**: 자주 사용하는 품목 상단 표시
- **검색 기능**: 품목명/동의어로 빠른 검색
- **개봉 이력**: 최근 개봉 내역 실시간 표시
- **자동 재고 차감**: 개봉 시 가장 오래된 로트에서 자동 차감

### 4. 알림 시스템
- **재고 부족 알림**: 안전재고 이하 시 자동 알림
- **유통기한 임박 알림**: 30일 이내 만료 예정 품목 알림
- **만료 알림**: 유통기한 경과 품목 알림
- **미사용 재고 알림**: 장기간 사용하지 않은 품목 알림
- **알림 상태 관리**: 확인/해결 처리로 알림 관리

### 5. 실사 (재고 조정)
- **실사 생성**: 전체 품목 시스템 재고 스냅샷 생성
- **실수량 입력**: 실제 재고 수량 입력
- **차이 확인**: 시스템 재고와 실수량 차이 자동 계산
- **재고 조정**: 승인 시 시스템 재고 일괄 조정
- **워크플로우**: 작성 → 제출 → 승인 단계별 관리

### 6. 리포트
- **구매처별 월간 리포트**: 구매처별 월간 구매 금액/수량 분석
- **만료 위험 리포트**: 30/60/90일 내 만료 예정 품목 목록
- **재고 현황 리포트**: 전체 품목 재고 상태 한눈에 보기
- **데이터 내보내기**: JSON 형식으로 전체 데이터 백업

### 7. 구매처 관리
- **구매처 등록**: 업체명, 연락처, 리드타임 관리
- **입고 연결**: 입고 등록 시 구매처 선택
- **구매처별 분석**: 구매처별 거래 내역 조회

## 기술 스택

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Fastify 4.x
- **ORM**: Prisma 5.x
- **Database**: SQLite (파일 기반, 설치 불필요)

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 5.x
- **상태 관리**: TanStack React Query
- **UI**: Tailwind CSS + Custom Components
- **라우팅**: React Router 6.x

### 배포
- **패키징**: @yao-pkg/pkg (Node.js → 실행 파일)
- **번들링**: esbuild

## 설치 및 실행

### 방법 1: 실행 파일 사용 (권장)

[Releases](https://github.com/xulfereht/jg-inventory/releases) 페이지에서 운영체제에 맞는 파일을 다운로드하세요.

**Windows:**
1. `jg-inventory-win.exe` 다운로드
2. 원하는 폴더에 저장
3. 더블클릭으로 실행
4. 브라우저에서 `http://localhost:3100` 접속

**Mac:**
1. `jg-inventory-macos` 다운로드
2. 터미널에서 실행 권한 부여: `chmod +x jg-inventory-macos`
3. 실행: `./jg-inventory-macos`
4. 브라우저에서 `http://localhost:3100` 접속

### 방법 2: 소스에서 빌드

```bash
# 저장소 클론
git clone https://github.com/xulfereht/jg-inventory.git
cd jg-inventory

# 의존성 설치
pnpm install

# 데이터베이스 설정
cd packages/server
npx prisma migrate deploy
npx prisma db seed

# 개발 서버 실행
pnpm dev

# 또는 실행 파일 빌드
pnpm build:bundle
```

## 네트워크 사용

같은 네트워크의 다른 기기에서 접속하려면:

1. 서버 실행 중인 컴퓨터의 IP 주소 확인
   - Windows: `ipconfig` 명령어
   - Mac: `ifconfig` 또는 시스템 환경설정 → 네트워크
2. 다른 기기 브라우저에서 `http://[서버IP]:3100` 접속

> 클라이언트는 별도 설치 없이 브라우저만 있으면 됩니다.

## 프로젝트 구조

```
jg-inventory/
├── packages/
│   ├── server/              # Backend
│   │   ├── src/
│   │   │   ├── routes/      # API 라우트
│   │   │   ├── lib/         # 유틸리티
│   │   │   └── index.ts     # 서버 엔트리
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts      # 샘플 데이터
│   │   └── scripts/
│   │       └── build.mjs    # 빌드 스크립트
│   │
│   └── web/                 # Frontend
│       ├── src/
│       │   ├── pages/       # 페이지 컴포넌트
│       │   ├── components/  # 공통 컴포넌트
│       │   ├── lib/         # API 클라이언트
│       │   └── types/       # TypeScript 타입
│       └── index.html
│
├── pnpm-workspace.yaml
└── package.json
```

## API 엔드포인트

### 품목 (Items)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/items` | 품목 목록 조회 |
| GET | `/api/items/:id` | 품목 상세 조회 |
| POST | `/api/items` | 품목 등록 |
| PUT | `/api/items/:id` | 품목 수정 |
| DELETE | `/api/items/:id` | 품목 삭제 |
| POST | `/api/items/:id/favorite` | 즐겨찾기 토글 |
| GET | `/api/items/:id/lots` | 품목별 로트 목록 |

### 로트 (Lots)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/lots` | 로트 목록 조회 |
| POST | `/api/lots` | 입고 등록 |
| PUT | `/api/lots/:id` | 로트 수정 |
| DELETE | `/api/lots/:id` | 로트 삭제 |

### 개봉 (Open Events)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/open-events` | 개봉 이력 조회 |
| POST | `/api/open-events` | 개봉 처리 |

### 알림 (Alerts)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/alerts` | 알림 목록 조회 |
| GET | `/api/alerts/summary` | 알림 요약 |
| POST | `/api/alerts/evaluate` | 알림 재평가 |
| POST | `/api/alerts/:id/acknowledge` | 알림 확인 처리 |
| POST | `/api/alerts/:id/resolve` | 알림 해결 처리 |

### 실사 (Inventory Counts)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/inventory-counts` | 실사 목록 |
| POST | `/api/inventory-counts` | 실사 생성 |
| GET | `/api/inventory-counts/:id` | 실사 상세 |
| PUT | `/api/inventory-counts/:id/items/:itemId` | 실수량 입력 |
| POST | `/api/inventory-counts/:id/submit` | 실사 제출 |
| POST | `/api/inventory-counts/:id/approve` | 실사 승인 |

### 리포트 (Reports)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/reports/supplier-monthly` | 구매처별 월간 |
| GET | `/api/reports/expiry-risk` | 만료 위험 |
| GET | `/api/reports/inventory-status` | 재고 현황 |
| GET | `/api/reports/export` | 데이터 내보내기 |

### 구매처 (Suppliers)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/suppliers` | 구매처 목록 |
| POST | `/api/suppliers` | 구매처 등록 |
| PUT | `/api/suppliers/:id` | 구매처 수정 |
| DELETE | `/api/suppliers/:id` | 구매처 삭제 |

## 데이터 모델

```
Item (품목)
├── id, name, synonyms
├── openUnit (개봉 단위)
├── safetyStock (안전재고)
├── isFavorite
└── lots[], openEvents[]

Lot (입고/로트)
├── id, itemId, supplierId
├── purchaseDate, expiryDate
├── initialQty, unopenedQty
├── unitPrice, origin, note
└── openEvents[]

OpenEvent (개봉 이벤트)
├── id, lotId, itemId
├── quantity
└── createdAt

Supplier (구매처)
├── id, name
├── contact, leadTime
└── lots[]

Alert (알림)
├── id, type, itemId, lotId
├── message, status
└── createdAt, resolvedAt

InventoryCount (실사)
├── id, countDate, status
├── note, createdBy
├── approvedBy, approvedAt
└── countItems[]

CountItem (실사 항목)
├── id, countId, itemId
├── systemQty, actualQty
├── difference, note
```

## 샘플 데이터

초기 설치 시 다음 샘플 데이터가 포함됩니다:

**품목 (12종)**
- 황기, 당귀, 인삼, 감초, 백출, 복령
- 천궁, 백작약, 숙지황, 진피, 대추, 생강

**구매처 (3곳)**
- 동의한약방, 청명약업, 제일한약재

**알림 시나리오**
- 재고 부족 품목
- 유통기한 임박 로트
- 만료된 로트

## 개발

```bash
# 개발 서버 실행 (Frontend + Backend 동시)
pnpm dev

# Frontend만 실행
cd packages/web && pnpm dev

# Backend만 실행
cd packages/server && pnpm dev

# 데이터베이스 마이그레이션
cd packages/server && npx prisma migrate dev

# 샘플 데이터 시드
cd packages/server && npx prisma db seed

# Prisma Studio (DB GUI)
cd packages/server && npx prisma studio
```

## 라이선스

MIT License

## 기여

이슈와 PR을 환영합니다.
