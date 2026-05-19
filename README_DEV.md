# graff.bms — Developer Documentation

> **目的**: このプロジェクトを初めて触る開発者が、1時間で全体像と実装意図を把握できるリファレンス。

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Directory Structure](#2-directory-structure)
3. [Tech Stack & Design Intent](#3-tech-stack--design-intent)
4. [Database Schema](#4-database-schema)
5. [Key Components & Logic](#5-key-components--logic)
6. [Shared Utilities](#6-shared-utilities)
7. [Auth & Middleware](#7-auth--middleware)
8. [Operations & Deployment](#8-operations--deployment)
9. [Phase 2 Implementation Notes](#9-phase-2-implementation-notes)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Vercel (hnd1)                    │
│                                                     │
│  ┌──────────────┐     ┌─────────────────────────┐  │
│  │ Public Menu  │     │      Admin BMS           │  │
│  │ /[locale]    │     │  /admin/(protected)/*    │  │
│  │              │     │                          │  │
│  │ SSG + 30s    │     │  Server Components       │  │
│  │ ISR          │     │  + Server Actions        │  │
│  └──────┬───────┘     └──────────┬───────────────┘  │
│         │                        │                  │
│         │  Service Role          │  Service Role    │
│         │  (公開メニューも       │  (RLS バイパス)  │
│         │   Service Role使用)    │                  │
└─────────┼────────────────────────┼──────────────────┘
          │                        │
          ▼                        ▼
┌─────────────────────────────────────────────────────┐
│                  Supabase (Postgres)                │
│                                                     │
│  Tables: products, stock, purchase_orders, ...      │
│  RPC Functions: process_stock_transaction, ...      │
│  DB Triggers: trg_check_price_alert                 │
│  Storage: company logos (Storage Bucket)            │
│  Auth: email/password (Supabase Auth)               │
└─────────────────────────────────────────────────────┘
```

### データフローの要点

| 操作 | フロー |
|------|--------|
| 管理画面の読み取り | Server Component → `createServiceClient()` → Supabase |
| 管理画面の書き込み | `'use client'` → Server Action (`'use server'`) → `createServiceClient()` → Supabase → `revalidatePath()` |
| 公開メニュー | `generateStaticParams()` で全ロケール静的生成 → `revalidate = 30` で 30 秒 ISR |
| 在庫更新の楽観的表示 | `useOptimistic` + `useTransition` でサーバー応答前に UI を先行更新 |

---

## 2. Directory Structure

```
src/
├── app/
│   ├── [locale]/                   # 公開メニュー（多言語対応）
│   │   └── page.tsx                # SSG + ISR 30s
│   └── admin/
│       ├── login/                  # ログイン画面
│       └── (protected)/            # 認証済みルート群
│           ├── layout.tsx          # サイドバー + ボトムナビ (Client Component)
│           ├── page.tsx            # ダッシュボード
│           ├── products/           # メニュー管理
│           ├── stock/              # 入出庫管理
│           │   └── history/        # トランザクション履歴
│           ├── orders/             # 発注/検品
│           │   └── [id]/print/     # 発注書印刷ページ
│           ├── pricing/            # 原価計算
│           ├── inventory/          # 棚卸し
│           │   └── [id]/           # 棚卸しセッション詳細
│           ├── alerts/             # 価格アラート
│           └── settings/           # 設定
│               ├── issuer/         # 発注者情報
│               ├── categories/     # カテゴリ管理
│               ├── alerts/         # アラート閾値
│               ├── stock-alerts/   # 在庫アラート
│               ├── order-template/ # 発注テキスト雛形
│               └── inventory-schedule/ # 棚卸しスケジュール
│
├── components/admin/               # UI コンポーネント (Server/Client 混在)
│   ├── stock/
│   │   ├── StockGrid.tsx           # useOptimistic + useTransition 使用
│   │   ├── StockTable.tsx          # 商品詳細 + 入出庫モーダル
│   │   └── StockPageClient.tsx     # ビュー切り替え (Grid/Table)
│   ├── orders/
│   │   ├── OrderCart.tsx           # 発注カート (bySupplier useMemo)
│   │   └── OrdersPageClient.tsx    # 発注一覧 + ステータス管理
│   ├── inventory/
│   │   └── InventoryMain.tsx       # 棚卸しセッション管理
│   └── pricing/
│       └── PricingClient.tsx       # 商品/グラス/カクテルの原価率一覧
│
├── hooks/                          # カスタムフック
│   ├── useAsyncAction.ts           # loading/error を集約した非同期ラッパー
│   ├── useToast.ts                 # 一時フィードバックメッセージ
│   └── useSearchFilter.ts          # useMemo ベースの検索フィルタ
│
├── lib/
│   ├── supabase/
│   │   ├── server.ts               # createClient() / createServiceClient()
│   │   └── client.ts               # ブラウザ用クライアント
│   ├── types/database.ts           # Supabase CLI 自動生成の型定義
│   ├── ui.ts                       # デザイントークン (インラインスタイル定数)
│   ├── format.ts                   # formatPrice / calcCostRate / formatDate
│   ├── revalidate.ts               # revalidatePath の組み合わせを集約
│   └── categoryColor.ts            # カテゴリ名 → バッジスタイルのマッピング
│
├── i18n/
│   ├── routing.ts                  # 対応ロケール: ja/en/ko/zh-CN/zh-TW
│   └── request.ts                  # next-intl 設定
│
└── proxy.ts                        # middleware: i18n + auth ガード
```

---

## 3. Tech Stack & Design Intent

| 技術 | バージョン | 採用理由 |
|------|-----------|---------|
| Next.js | 16.2.1 | App Router による Server Component + Server Action でクライアント JS を最小化 |
| React | 19 | `useOptimistic` / `useTransition` による楽観的 UI 更新 |
| Supabase | @supabase/ssr ^0.9 | Cookie ベースのセッション管理で SSR と相性良好 |
| next-intl | ^4.8.3 | `[locale]` セグメントで全ロケールを静的生成できる |
| Tailwind CSS | v4 | ユーティリティクラスはレイアウト・スペーシングのみ使用。色はCSS変数に統一 |
| TypeScript | ^5 | `database.ts` の自動生成型でDBスキーマ変更を型レベルで検出 |
| Vercel | — | `regions: ["hnd1"]` で東京リージョンに固定（日本のバー向け） |

### なぜ CSS 変数 + インラインスタイルを選んだか

Tailwind のカラーユーティリティはビルド時に固定されるため、ダークテーマのデザイントークンをランタイムで制御できない。`globals.css` で `--bg-base` / `--accent` 等の変数を定義し、`src/lib/ui.ts` の `styles.*` オブジェクトを介してインラインスタイルとして適用することで、**色の変更が全コンポーネントに一元反映される**。

### なぜ Server Actions を選んだか

- フォーム送信 → API Route → fetch という3層を1層（Server Action）に削減
- `revalidatePath()` を Action 内で直接呼べるため、キャッシュ無効化のコードが分散しない
- `lib/revalidate.ts` で revalidate パターンを集約し、ページ追加時の漏れを防止

---

## 4. Database Schema

### テーブル一覧と役割

```
products                   # 商品マスタ（メニューの基幹エンティティ）
├── spirits_details        # 1:1 ウイスキー等の詳細（容量・ショット価格）
├── wine_details           # 1:1 ワインの詳細（産地・ヴィンテージ・ブドウ品種）
├── soft_drink_details     # 1:1 ソフトドリンク詳細（ミキサー判定・容量）
├── stock                  # 1:1 現在庫数 + 最小在庫数
├── inventory_batches      # 1:N 仕入れロット（FIFO 出庫の根拠）
└── price_history          # 1:N 仕入れ価格の履歴

categories                 # カテゴリマスタ（sort_order で並び順管理）
suppliers                  # 仕入れ先マスタ
glasses                    # グラスワイン（products を参照、serving_ml で原価計算）
cocktails                  # カクテルマスタ（recipe_steps は text[]）
cocktail_ingredients       # カクテル材料（product_id + quantity + unit）

purchase_orders            # 発注書ヘッダ
purchase_order_items       # 発注書明細（inspection_status で検品フロー管理）

inventory_sessions         # 棚卸しセッション（in_progress / submitted / approved）
inventory_session_items    # セッション品目（system_quantity vs actual_quantity）

stock_transactions         # 入出庫トランザクションログ（type: in/out/adjustment）
price_alerts               # 価格アラート（5%以上の仕入れ価格上昇を DB トリガーが自動生成）
company_profile            # 自社情報（id=1 の単一行テーブル）
inventory_settings         # 棚卸しスケジュール設定（id=1 の単一行テーブル）
```

### ER 図（主要リレーション）

```
suppliers ─────────────────── products ──── stock
                                  │          │
                             ┌────┤          └── inventory_batches (FIFO ロット)
                             │    │
                      spirits_details     price_history
                      wine_details        price_alerts (DB trigger)
                      soft_drink_details
                             │
                    purchase_order_items ── purchase_orders ── suppliers
                             │
                    inventory_session_items ── inventory_sessions
```

### SQL ビュー

| ビュー名 | 役割 |
|---------|------|
| `cocktail_cost_view` | カクテルの材料合計原価と原価率を集計。`pricing/page.tsx` ではビューを使わず Server Component 側で計算（ビューは将来の最適化候補） |

### RPC 関数（N+1 問題を DB 側で解決）

| 関数名 | 呼び出し元 | 目的 |
|--------|-----------|------|
| `process_stock_transaction` | `stock/actions.ts` | 在庫 UPSERT + FIFO ロット管理 + トランザクション記録を 1 往復に集約 |
| `apply_inventory_session_adjustments` | `inventory/actions.ts` | 棚卸し差異の adjustment 一括 INSERT + セッション承認を 1 往復に集約 |
| `receive_purchase_order` | `orders/actions.ts` | 全品目の `process_stock_transaction('in')` + 発注書ステータス更新を 1 往復に集約 |
| `create_orders_from_cart` | `orders/actions.ts` | JSONB 配列を supplier_id でグループ化して発注書を一括作成 |

> **なぜ RPC か**: Server Action から品目数 N 回の INSERT/UPDATE を行うと N 往復の HTTP ラウンドトリップが発生する。DB 関数に押し込むことで**ネットワーク往復 1 回**に削減。特に受領処理（10 品目なら 10 → 1 往復）で顕著な効果がある。

### DB トリガー

- `trg_check_price_alert`: `stock_transactions` への INSERT 後に発火。`type='in'` かつ `cost_price IS NOT NULL` のとき、`price_history` を追記し、前回比 5%（`company_profile.alert_threshold`）以上の上昇があれば `price_alerts` に自動 INSERT し `products.cost_price` を更新する。

### FIFO ロット管理の仕組み

```
入庫時:
  同一価格 → 最新 inventory_batches の quantity_rem に加算
  価格が異なる → 新規ロットを INSERT

出庫時:
  received_at ASC の順に inventory_batches を走査
  quantity_rem が尽きるまで FIFO で減算
  → 古いロットから先に消費される
```

---

## 5. Key Components & Logic

### StockGrid — 楽観的 UI 更新

`src/components/admin/stock/StockGrid.tsx`

```
[Server Data]  →  useState(initialItems)
                        ↓
              useOptimistic(items, reducer)
                        ↓
              applyOptimistic(updates) ← startTransition() の中で実行
                        ↓
              Server Action (recordStockTransaction)
                        ↓
              revalidatePath → router.refresh() で正データに同期
```

**設計意図**: 在庫 +1/-1 のたびにサーバー往復を待つと UX が悪い。`useOptimistic` で先に画面を更新しつつ、バックグラウンドで Server Action を実行。失敗時は自動でロールバックされる。

---

### OrderCart — bySupplier useMemo の依存配列

`src/components/admin/orders/OrderCart.tsx`

```ts
const bySupplier = useMemo(() => {
  const pendingIds = Object.keys(cart)   // ← useMemo 内部で計算
  // ...
}, [cart, items])                        // ← Object.keys() は外に出さない
```

**なぜ内部で計算するか**: `Object.keys(cart)` を useMemo の外で変数に入れると毎レンダリング新しい配列参照が生まれ、依存配列に入れてもメモ化が機能しない。依存元（`cart`）を直接 deps に入れることで正しくメモ化される。

---

### 棚卸しフロー (InventoryMain)

`src/components/admin/inventory/InventoryMain.tsx`

```
[棚卸し開始] → createInventorySession()
               → 全商品 + 在庫数をスナップショットとして inventory_session_items に INSERT
                    ↓
[実測値入力] → saveInventoryActuals() （revalidate なし — クライアント管理）
                    ↓
[申請]       → submitInventorySession() → status: 'submitted'
                    ↓
[承認]       → approveInventorySession()
               → Supabase Auth でパスワード再検証（独立クライアント使用）
               → apply_inventory_session_adjustments() RPC で差異調整
```

**承認時のパスワード再検証**: 現在ログイン中のセッションに影響を与えないよう、`createSupabaseClient(ANON_KEY)` で独立したクライアントを生成してパスワード検証を実施している（`src/app/admin/(protected)/inventory/actions.ts`）。

---

### 発注書印刷ページ

`src/app/admin/(protected)/orders/[id]/print/page.tsx`

- Server Component でデータ取得 → `PrintPageClient.tsx` に渡す
- A4 縦サイズに収まるよう CSS の `@media print` + `transform: scale()` で自動フィット
- `PrintButton.tsx` (`'use client'`) が `window.print()` を呼ぶ

---

### 公開メニュー（多言語）

`src/app/[locale]/page.tsx`

```ts
export const revalidate = 30   // 30秒 ISR
export function generateStaticParams() {
  return ['ja', 'en', 'ko', 'zh-CN', 'zh-TW'].map(locale => ({ locale }))
}
```

- **なぜ ISR か**: 全ロケール完全静的だとメニュー更新（商品追加等）が即時反映されない。30 秒 ISR で「高速配信」と「更新の即応性」を両立。
- `revalidateMenu()` (`lib/revalidate.ts`) は `revalidatePath('/ja', 'page')` + `revalidatePath('/en', 'page')` を呼ぶため、在庫更新・商品更新時に公開メニューも自動的に更新される。
- `MenuClient.tsx` はカテゴリ名の `name_en` フィールドをキーに `SECTION_SORT` でセクション順序を決定（DB の sort_order に依存しない）。

---

### 原価計算ページ

`src/app/admin/(protected)/pricing/page.tsx`

Server Component 内で商品・グラスワイン・カクテルの 3 種類を `Promise.all` で並列取得し、カクテルの材料原価は以下の計算式で算出する。

```ts
function calcIngCost(qty, unit, cost, vol): number | null {
  // ml/cl/oz/dash/tsp → ml に換算して ml/円 × 使用量
  // 本単位（シロップ等） → cost × qty
  // vol が null（未設定） → null を返す（"—" 表示）
}
```

`ML_PER` テーブル: `{ ml: 1, cl: 10, oz: 29.57, dash: 0.6, tsp: 5 }`

---

## 6. Shared Utilities

### `src/lib/ui.ts` — デザイントークン

```ts
export const styles = {
  card:         { background: 'var(--bg-surface)', border: '1px solid var(--border)' },
  input:        { background: 'var(--bg-base)', ... },
  btnPrimary:   { background: 'rgba(129,236,255,0.12)', color: '#81ecff', ... },
  btnSecondary: { ... },
  btnDanger:    { color: '#d84f2a', ... },
  badge:        { warn: {...}, normal: {...} },
  text:         { primary: {...}, secondary: {...}, muted: {...} },
}
```

> コンポーネント内でローカル `const inputStyle = {...}` を定義しない。`styles.*` に集約することで**テーマ変更が 1 ファイルで完結**する。

### `src/lib/revalidate.ts` — revalidatePath の集約

| 関数 | 再検証対象 |
|------|-----------|
| `revalidateMenu()` | `/ja`, `/en` (公開メニュー) |
| `revalidateStock()` | `/admin/stock`, `/admin` + `revalidateMenu()` |
| `revalidateProducts()` | `/admin/products` + `revalidateMenu()` |
| `revalidateOrders()` | `/admin/orders`, `/admin/orders/history` |

> 新しいロケールを追加する際は `revalidateMenu()` だけ修正すれば全 Actions に反映される。

### `src/lib/format.ts` — 表示フォーマット

| 関数 | 用途 |
|------|------|
| `formatPrice(price)` | `¥1,000` 形式。`null` は `—` |
| `formatQuantity(qty, unit)` | `3 本` 形式 |
| `calcCostRate(cost, selling)` | 原価率 % (小数第1位)。selling=0 なら `null` |
| `formatDate(date)` | `YYYY/MM/DD` |
| `formatDateTime(date)` | `YYYY/MM/DD HH:mm` |

### カスタムフック (`src/hooks/`)

| フック | 役割 |
|--------|------|
| `useAsyncAction(action)` | `loading` / `error` / `clearError` / `run()` を提供。Server Action の try/catch を共通化 |
| `useToast(durationMs)` | `message` / `show(msg)` を提供。`setTimeout` で自動クリア |
| `useSearchFilter(items, predicate)` | `query` / `setQuery` / `filtered` を提供。`useMemo` でフィルタをメモ化 |

---

## 7. Auth & Middleware

### middleware (`src/proxy.ts`)

```ts
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/admin')) {
    return intlMiddleware(request)   // next-intl がロケール処理
  }

  // DEMO モード: 認証をスキップ
  return NextResponse.next()
}
```

> **現在 DEMO モード**: admin ルートの認証チェックがコメントアウトされている。本番運用時は `createClient().auth.getUser()` でセッション検証を追加すること。

### Supabase クライアントの使い分け

| クライアント | 生成関数 | 用途 |
|------------|---------|------|
| `createClient()` (server) | Cookie ベース | auth.signIn/signOut |
| `createServiceClient()` | Service Role Key | Server Actions（RLS バイパス） |
| `createClient()` (browser) | ANON Key | Client Component（Realtime等） |

**Service Role Key は必ず Server Actions / Server Components 内のみで使用**（クライアントに漏れると RLS が無効化される）。

### ロゴアップロード

`src/app/admin/(protected)/settings/actions.ts` → `saveIssuerProfile()`

- Supabase Storage Bucket (`STORAGE_BUCKET` 環境変数) の `logos/` パスに `upsert: true` でアップロード
- ファイル名は `company-logo.{ext}` で固定（バージョン管理不要）

---

## 8. Operations & Deployment

### 環境変数

| 変数名 | 必須 | 説明 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase 匿名キー |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service Role キー（サーバーサイド専用） |
| `STORAGE_BUCKET` | ✅ | ロゴ保存先の Storage Bucket 名 |
| `BULK_DELETE_PASSWORD` | 任意 | 月次トランザクション一括削除の保護パスワード |

### Vercel デプロイ

```json
// vercel.json
{ "regions": ["hnd1"] }
```

- `hnd1` = 東京リージョン。Supabase の Postgres が同リージョンにある場合、DB 往復レイテンシを最小化できる。
- Edge Runtime は使用していない（全て Node.js Runtime）。Server Actions が Cookie を読む都合、Edge との互換性に注意。

### Supabase マイグレーション

```bash
supabase db push          # ローカルの migrations/ を適用
supabase gen types typescript --linked > src/lib/types/database.ts
```

**マイグレーションファイルの命名規則**: `YYYYMMDDNNNNNN_snake_case.sql`（例: `20260326000011_rpc_functions.sql`）

### シードデータ

| ファイル | 用途 |
|---------|------|
| `supabase/seeds/mock_data.sql` | 開発/デモ用のダミーデータ（サプライヤー名・電話番号はすべて架空） |
| `supabase/seeds/reset_and_seed.sql` | DB リセット + シード投入を一括実行 |
| `supabase/seeds/fix_product_names_katakana.sql` | 商品名の表記揺れ修正（必要に応じて手動実行） |

### 型定義の更新

```bash
npm run db:types
# → npx supabase gen types typescript --linked > src/lib/types/database.ts
```

DB スキーマ変更後は必ずこのコマンドを実行し、`ProductWithRelations` 等のカスタム型も `database.ts` 末尾で更新する。

### PWA

- `src/app/manifest.ts` で Web App Manifest を動的生成
- `src/components/admin/SwRegister.tsx` が `useEffect` 内で `/sw.js` を登録
- `public/sw.js` を配置してオフライン対応やキャッシュ戦略を実装（現在は基本的な登録のみ）

---

## 9. Phase 2 Implementation Notes

### 実装済み機能

| 機能 | 場所 |
|------|------|
| メニュー管理（商品・カクテル・グラスワイン） | `/admin/products` |
| 入出庫管理（FIFO ロット + 楽観的 UI） | `/admin/stock` |
| 発注/検品フロー（カート → 発注書 → 検品） | `/admin/orders` |
| 発注書 PDF 印刷 | `/admin/orders/[id]/print` |
| 棚卸し（セッション管理 + パスワード承認） | `/admin/inventory` |
| 原価計算（商品/グラス/カクテル） | `/admin/pricing` |
| 価格アラート（DB トリガー自動生成） | `/admin/alerts` |
| 公開メニュー（多言語 5 言語 ISR） | `/[locale]` |
| 会社情報 + ロゴアップロード | `/admin/settings/issuer` |
| カテゴリ管理 | `/admin/settings/categories` |
| 発注テキスト雛形 | `/admin/settings/order-template` |
| 棚卸しスケジュール設定 | `/admin/settings/inventory-schedule` |
| 在庫アラート設定 | `/admin/settings/stock-alerts` |

### 未実装 / 今後の検討項目

| 項目 | 現状 | 備考 |
|------|------|------|
| 認証ガード | middleware で DEMO モード（認証スキップ） | `proxy.ts` の `NextResponse.next()` をセッション検証に差し替え |
| ダッシュボード KPI | `page.tsx` に骨格のみ | 売上推移・在庫回転率などの集計クエリが未実装 |
| 管理画面の検索バー | ヘッダーに UI のみ | 全商品横断検索のロジックが未実装 |
| ベルアイコン通知 | ヘッダーに UI のみ | `price_alerts` の未読数リアルタイム表示が未実装 |
| Supabase Realtime | `MenuClient.tsx` にクライアントあり | 在庫変更の即時反映（オプション） |
| マルチユーザー / ロール | 単一ユーザー想定 | スタッフ権限分離が必要な場合は RLS ポリシーを追加 |
| モバイル棚卸し入力 | PC 向けのみ最適化 | `/admin/inventory/[id]` はタブレット使用を想定、スマホ対応が課題 |
| テスト | なし | Server Actions は `vitest` + `supabase-js` モックで単体テスト可能 |

### 状態管理の方針

グローバル状態管理ライブラリ（Zustand/Jotai 等）は**意図的に導入していない**。

- サーバーが正データの Source of Truth（Server Component がデータを取得）
- 書き込みは Server Action → `revalidatePath` でキャッシュを破棄 → React が再レンダリング
- ローカル UI 状態（モーダル開閉・検索クエリ）は `useState` で十分
- 楽観的更新が必要な箇所のみ `useOptimistic` + `useTransition` を採用

この方針の下でグローバル状態を導入する場合は、**サーバー状態（DB 由来）とクライアント状態（UI ローカル）を明確に分離**すること。

---

*Generated: 2026-05-20 | graff.bms v0.1.0*
