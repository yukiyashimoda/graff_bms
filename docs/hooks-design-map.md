# Hooks Design Map — graff_BMS

> 作成日: 2026-05-20  
> 対象: `src/components/admin/**` および `src/components/menu/MenuClient.tsx`  
> アーキテクチャ前提: Next.js 15 App Router / Server Actions / Supabase / no external state manager (Zustand 等なし)

---

## 1. Hooks Design Map（一覧表）

### 凡例
- **L** = ローカル state (`useState`)
- **E** = 副作用 (`useEffect`)
- **M** = メモ化 (`useMemo`)
- **C** = コールバック安定化 (`useCallback`)
- **O** = 楽観的更新 (`useOptimistic` / `useTransition`)

---

### 1-1. `StockGrid.tsx` ★ 最高難度

| Hook | 具体的な state/effect | 設計意図・役割 |
|------|----------------------|---------------|
| `useState` × 10 | `items`, `deltas`, `query`, `lowOnly`, `zeroOnly`, `catFilter`, `showList`, `priceModal`, `orderDone/Error/Saving`, `deliveryModal/Date`, `pendingCartItems` | `items` だけが「Server から受け取った真の在庫」。`deltas` は「未コミットの差分」として分離し、コミット前はローカルで完結させる二層設計 |
| `useOptimistic` | `applyOptimistic(state, updates)` | Server Action のレスポンスを待つ間、UI 上の数量を即座に反映するため。`useTransition` で包むことで Concurrent Mode のサスペンドと協調 |
| `useTransition` | `startTransition(async () => ...)` | Server Action 呼び出しを非緊急マークし、入力応答性を維持。`isPending` で「コミット中」を表示 |
| `useMemo` | `categories` | `items` 配列から重複除去してカテゴリ一覧を生成。`items` が変わらない限り毎レンダリングで Set 走査を行わないための最適化 |
| `useCallback` × 4 | `handleAdjust`, `handleReset`, `handlePriceIn`, `handleOpenPriceModal` | `StockCard` が `memo()` でラップされているため、コールバックの参照が変わると全カードが再レンダリングされる。`[]` / `[router]` 依存で一度だけ生成し参照を安定化 |

**重要パターン解説 — `deltas` + `useOptimistic` の二層構造**

```
[Server state: items] ←─── Server Action 完了後に router.refresh() で同期
        ↓
[Client diff: deltas] ←─── ユーザー操作でローカルに積み上げ（未コミット）
        ↓
[UI state: optimisticItems] ←─── コミット中はサーバー応答前に先行反映
```

カート方式（`deltas`）を採用した理由: 在庫調整は「複数商品をまとめて1回コミット」が業務上自然なため。

---

### 1-2. `OrderCart.tsx`

| Hook | 具体的な state/effect | 設計意図・役割 |
|------|----------------------|---------------|
| `useState` × 7 | `cart`, `query`, `lowOnly`, `catFilter`, `saving`, `showList`, `doneMsg`, `confirmError` | `cart` は `Record<productId, quantity>` 形式。商品 id をキーにすることで「特定商品の数量変更」が O(1)。モーダル表示 (`showList`) と操作完了メッセージ (`doneMsg`) を分離することで UI の状態遷移を明確化 |
| `useMemo` — `categories` | `items` 依存 | フィルターボタン用カテゴリ一覧。props が変わるまで不変なため最適化効果大 |
| `useMemo` — `bySupplier` | `pendingIds, items, cart` 依存 | 確認モーダル用「業者ごとにグループ化した発注リスト」。モーダルを開く操作は低頻度なため、開くたびに都度計算でも問題ないが、モーダル内のレンダリング中に参照が変わらないよう `useMemo` で固定 |
| `useMemo` — `filtered` | `items, query, lowOnly, catFilter` 依存 | 検索・フィルター結果。キーストロークのたびに全 `items` を走査するコストを抑制 |

---

### 1-3. `PricingClient.tsx`

| Hook | 具体的な state/effect | 設計意図・役割 |
|------|----------------------|---------------|
| `useState` × 8（遅延初期化） | `prices`, `shotPrices`, `glassPrices`, `cocktailPrices` | `useState(() => Object.fromEntries(...))` の関数形式を使用。初回レンダリング時にのみ `map()` を実行し、以降は実行しない。100件超の商品がある場合に有効 |
| `useState` × 4 | `activeTab`, `query`, `catFilter`, `saving`, `saved` | タブ切り替えで `query` と `catFilter` をリセットする (`setActiveTab` のクリックハンドラで同時セット) ことで、タブをまたいだ検索状態の混入を防ぐ |
| `useMemo` — `categories` | `products` 依存 | カテゴリフィルターボタン生成。`products` は Server Component から渡される安定した配列なので、初回のみ計算 |
| `useMemo` — `dirtyCount` | `activeTab, products/glasses/cocktails, prices/shotPrices/glassPrices/cocktailPrices` 依存 | 変更件数のカウント。フローティングボタンのラベル (`3件を更新`) に使用。入力のたびに全商品と diff 比較するコストを抑制 |

---

### 1-4. `MenuClient.tsx`

| Hook | 具体的な state/effect | 設計意図・役割 |
|------|----------------------|---------------|
| `useState` — `query` | 検索文字列 | リアルタイム検索。`useMemo` の `filtered` と協調 |
| `useState` — `darkMode` | ダークモードフラグ | 初期値は `false`（SSR セーフ）。ブラウザ側の実際値は `useEffect` で上書き |
| `useEffect` — darkMode 初期化 | `[]` 依存 | `localStorage` と `window.matchMedia` は **ブラウザ専用 API** であり SSR 時に存在しない。`useEffect` の中に閉じることで「クライアントサイドのみ実行」を保証するための意図的な非同期初期化 |
| `useEffect` — Supabase リアルタイム | `[router]` 依存 | `stock` / `products` テーブルへの変更を Postgres Changes で購読し、変更があれば `router.refresh()` でサーバーデータを再取得。`return () => supabase.removeChannel(channel)` でアンマウント時に購読解除（リーク防止）。`router` は App Router では安定した参照なので事実上マウント時の1回のみ購読 |
| `useMemo` × 複数 | `categories`, `sections`, `filtered` | 575行の大型コンポーネントを手続き的なロジックで構成するため、各段階の加工結果を個別にメモ化。詳細は §3「意図解説」参照 |

---

### 1-5. `InventoryMain.tsx`

| Hook | 具体的な state/effect | 設計意図・役割 |
|------|----------------------|---------------|
| `useState` × 6 | `startingSession`, `startError`, `menuOpen`, `actionLoading`, `actionError` | `actionLoading` を `'reset' \| 'delete' \| null` の Union 型にすることで、「どの操作中か」を単一 state で表現。`boolean` 2本より状態の組み合わせ爆発を防ぐ |
| `useRef` | `menuRef` | ドロップダウンメニューの DOM 参照。state ではなく ref を使うことで、DOM 参照の変化がレンダリングを引き起こさないようにする |
| `useEffect` — click outside | `[menuOpen]` 依存 | **`if (!menuOpen) return`** で早期リターンすることが重要。メニューが閉じているときはリスナーを登録せず、開いたときだけ登録する。`cleanup` で確実に解除。依存に `menuOpen` を入れることで「開く→リスナー追加 / 閉じる→リスナー削除」を正確に制御 |

---

### 1-6. `IssuerForm.tsx`

| Hook | 具体的な state/effect | 設計意図・役割 |
|------|----------------------|---------------|
| `useState` × 7 | `saving`, `saved`, `error`, `name`, `phone`, `email`, `address`, `logoPreview`, `logoFile`, `removeLogo`, `dragging` | フォームフィールドを制御コンポーネントとして保持。Server Component の初期値 (`settings`) をそのまま `useState` の初期値に渡し、編集中はローカルで管理 |
| `useRef` | `fileInputRef` | `<input type="file">` を非表示にしてカスタムデザインのボタンからプログラマティックに `.click()` を呼ぶため。DOM 操作を直接行う用途に限定した ref の適切な使用 |
| `useCallback` — `onDrop` | `[]` 依存 | ドラッグ&ドロップの `onDrop` ハンドラ。`applyFile` はコンポーネント内で定義された安定した関数のため、`[]` で問題なし |

---

### 1-7. `StockTable.tsx`

| Hook | 具体的な state/effect | 設計意図・役割 |
|------|----------------------|---------------|
| `useState` × 6 | `modal`, `qty`, `cost`, `notes`, `loading`, `error` | `modal` を `{ product, mode } \| null` の Union 型で表現し「モーダルが開いているか」と「どの商品・モードか」を単一 state に統合。`null` = 閉じた状態という直感的な表現 |
| — | `error` | Server Action が `throw` した際に `loading` が永久に `true` になるバグを防ぐために追加。`try/catch/finally` と組み合わせて使用 |

---

### 1-8. `AlertsClient.tsx`

| Hook | 具体的な state/effect | 設計意図・役割 |
|------|----------------------|---------------|
| `useState` — `loading` | 「全既読」ボタンの処理中フラグ | 1件ずつの既読 (`handleMark`) は loading 表示なし。全既読のみ loading を持つ非対称な設計は、全既読が重い操作（複数行 UPDATE）であるのに対し、1件既読が軽量（単一行 UPDATE）であることの反映 |
| `useCallback` — `handleMark` | `[router]` 依存 | ⚠️ **効果が薄い**。`handleMark` は `memo()` でラップされた子コンポーネントに渡されておらず、アラートリスト上でインラインで呼ばれるだけなので参照安定化の恩恵がない（§2 改善提案参照）|

---

### 1-9. `PrintPageClient.tsx`

| Hook | 具体的な state/effect | 設計意図・役割 |
|------|----------------------|---------------|
| `useEffect` — A4 スケーリング | `[order]` 依存 | 発注書を `width: 794px`（A4実寸）で固定し、モバイル表示時は `transform: scale()` でフィットさせる。`window.addEventListener('resize')` は **ブラウザ専用 API** のため `useEffect` 内に封じ込め。クリーンアップで確実にリスナーを削除 |

---

### 1-10. その他（シンプルパターン）

| コンポーネント | Hook | 設計意図 |
|--------------|------|---------|
| `SwRegister.tsx` | `useEffect([], [])` | Service Worker の登録はブラウザ専用 API (`navigator.serviceWorker`) のため `useEffect` 必須。空依存配列でマウント時1回のみ実行 |
| `StockPageClient.tsx` | `useState` — `tab` | タブ UI の最小実装。サーバーデータは全タブ分を一度に渡してクライアントで切り替え（タブ切り替えによる追加フェッチなし）|
| `ProductsPageClient.tsx` | `useState` — `active` | 同上。3タブ（PRODUCTS / GLASSES / COCKTAILS）の切り替え専用 |
| `ProductForm.tsx` | `useState` × 3 | `categoryId` の変更を `useState` で保持し、`detailType` は同期的な関数呼び出しで派生。**`useEffect` を使わない派生計算**の正しい例 |

---

## 2. 実施した改善

### ✅ `OrderCart.tsx` — `bySupplier` の依存配列バグを修正

`useMemo` の依存配列比較は参照等値 (`===`) で行われる。`Object.keys(cart)` は毎レンダリングで新しい配列を生成するため、`cart` が変化していなくても `bySupplier` が再計算されていた。`pendingIds` を依存から除去し、`useMemo` 内で `Object.keys(cart)` を計算するように修正。

```tsx
// 修正前: pendingIds（毎回新配列）を依存に渡していた
const pendingIds = Object.keys(cart)
const bySupplier = useMemo(() => { ... }, [pendingIds, items, cart])

// 修正後: cart を直接依存とし、useMemo 内で keys を取得
const bySupplier = useMemo(() => {
  for (const id of Object.keys(cart)) { ... }
}, [cart, items])
```

---

### ✅ `AlertsClient.tsx` — 効果のない `useCallback` を削除

`handleMark` は `memo()` でラップされた子コンポーネントに渡されておらず、参照安定化の恩恵がなかった。通常の `async function` に変更してシンプル化。

---

### ✅ カスタム Hook 3本を `src/hooks/` に実装・適用

#### `useAsyncAction` — `src/hooks/useAsyncAction.ts`

loading/error の管理パターンを共通化。`OrderCart`（発注書作成）と `IssuerForm`（会社情報保存）に適用済み。

```ts
function useAsyncAction<T>(action: () => Promise<T>) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function run(): Promise<T | undefined> {
    setLoading(true); setError(null)
    try   { return await action() }
    catch (e) { setError(e instanceof Error ? e.message : '処理に失敗しました') }
    finally   { setLoading(false) }
  }

  return { run, loading, error, clearError }
}
```

**適用コンポーネント:** `OrderCart`（`confirm.run` / `confirm.loading` / `confirm.error`）、`IssuerForm`（`save.run` / `save.loading` / `save.error`）

> `StockGrid`・`InventoryMain` は成功時に `router.push()` や楽観的更新との協調が必要なため、独自の try/catch を維持。

---

#### `useToast` — `src/hooks/useToast.ts`

`setTimeout` で自動消去するメッセージ表示パターンを共通化。

```ts
function useToast(durationMs = 4000) {
  const [message, setMessage] = useState<string | null>(null)
  function show(msg: string) {
    setMessage(msg)
    setTimeout(() => setMessage(null), durationMs)
  }
  return { message, show }
}
```

**適用コンポーネント:** `OrderCart`（発注完了トースト）、`IssuerForm`（保存完了ラベル、2000ms）

---

#### `useSearchFilter` — `src/hooks/useSearchFilter.ts`

テキスト検索 + `useMemo` フィルタリングパターンを共通化。既存コンポーネントは多次元フィルター（lowOnly / catFilter 等）を独自に持つため今回は適用外。新規コンポーネント作成時の標準として利用する。

```ts
function useSearchFilter<T>(
  items: T[],
  predicate: (item: T, query: string) => boolean,
) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(
    () => (!query ? items : items.filter(i => predicate(i, query.toLowerCase()))),
    [items, query],
  )
  return { query, setQuery, filtered }
}
```

---

### 🟢 良好な設計（変更なし）

| 箇所 | 評価理由 |
|------|---------|
| `StockGrid.tsx` — `useOptimistic` + `useTransition` | Server Action + 楽観的更新の正規実装。`deltas`（未コミット差分）と `items`（サーバー真値）の二層分離は理想的 |
| `PricingClient.tsx` — `useState(() => ...)` 遅延初期化 | 100件超の `map()` を初回のみ実行。コスト認識が正確 |
| `InventoryMain.tsx` — `if (!menuOpen) return` | クリックアウト検知を「メニューが開いているときだけ」登録する最小限のリスナー管理 |
| `ProductForm.tsx` — `useEffect` なしの派生計算 | `categoryId` → `detailType` を同期関数で計算。「`useEffect` で同期させる」アンチパターンを回避 |
| `MenuClient.tsx` — 2本の `useEffect` 分離 | ライフサイクルが異なる2つの副作用（ダークモード初期化 vs リアルタイム購読）を別 `useEffect` に分けることで、依存関係と目的が明確 |

---

## 3. Intent Documentation — なぜここが `useEffect` なのか

### 3-1. `MenuClient.tsx` — darkMode 初期化

```tsx
useEffect(() => {
  const saved = localStorage.getItem('menu-dark-mode')
  if (saved !== null) {
    setDarkMode(saved === '1')
  } else {
    setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches)
  }
}, [])
```

**なぜ `useEffect` か:**  
Next.js App Router では Server Component も Client Component も**サーバーサイドで初回レンダリングされる**。`localStorage` と `window.matchMedia` はブラウザ専用 API であり、サーバー実行時に参照すると `ReferenceError` になる。  
`useEffect` は「ブラウザでマウントされた後に実行する」ことを保証するため、ここに書くことが必須。

**初期値を `false` にする理由:**  
`useState(false)` で始めることで SSR とクライアントの初期 HTML が一致する（Hydration mismatch 回避）。実際の設定は Effect で上書きされるため、ユーザーには一瞬のちらつきのみ生じる可能性があるが、ダークモード切り替えは視覚的インパクトが大きいため許容範囲。

---

### 3-2. `MenuClient.tsx` — Supabase リアルタイム購読

```tsx
useEffect(() => {
  const supabase = createClient()
  const channel = supabase
    .channel('menu-stock-watch')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'stock' },    () => router.refresh())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => router.refresh())
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}, [router])
```

**なぜ `useEffect` か:**  
WebSocket 接続はブラウザ専用の副作用。またコンポーネントのアンマウント時に接続を閉じる「クリーンアップ」が必要であり、これは `useEffect` の return 関数でのみ表現できる。

**なぜ `router.refresh()` を呼ぶか:**  
Next.js App Router では `router.refresh()` が「現在のルートのサーバーコンポーネントを再実行してキャッシュを無効化」する。Supabase のリアルタイムイベントを受け取った際にこれを呼ぶことで、在庫データをサーバー経由で最新化する。クライアント側で State を直接更新するよりも、サーバーデータを信頼できる単一のソースとして扱える。

**なぜ `[router]` を依存配列に入れるか:**  
ESLint の `exhaustive-deps` ルールへの準拠。`router` は App Router では**安定した参照**（マウント中に変わらない）なので、実質的にこの Effect はマウント時の1回のみ実行される。

---

### 3-3. `InventoryMain.tsx` — click outside 検知

```tsx
useEffect(() => {
  if (!menuOpen) return                                // ← 重要: メニューが閉じていたら何もしない
  function handleClick(e: MouseEvent) {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setMenuOpen(false)
    }
  }
  document.addEventListener('mousedown', handleClick)
  return () => document.removeEventListener('mousedown', handleClick)
}, [menuOpen])
```

**なぜ `if (!menuOpen) return` が重要か:**  
依存配列に `menuOpen` を含めることで、Effect は「`menuOpen` が変化するたびに再実行」される。`false → true`（メニューが開く）でリスナーを追加し、`true → false`（メニューが閉じる）でクリーンアップ（リスナー削除）が走る。`if (!menuOpen) return` がなければ、メニューが閉じている間も `document` にリスナーが積み重なる。

**`useRef` を使う理由:**  
`menuRef` でメニューの DOM 要素を参照し、クリックが「メニューの外側か内側か」を `contains()` で判定する。この判定には DOM への直接アクセスが必要であり、React の state や props では表現できないため `useRef` が適切。

---

### 3-4. `PrintPageClient.tsx` — A4 スケーリング

```tsx
useEffect(() => {
  const outer = document.querySelector<HTMLElement>('.a4-outer')
  if (!outer) return
  function setScale() {
    const w = outer!.clientWidth
    if (w < 794) {
      const scale = w / 794
      outer!.style.height = Math.round(1123 * scale) + 'px'
      const doc = outer!.querySelector<HTMLElement>('.a4-doc')
      if (doc) doc.style.transform = `scale(${scale.toFixed(4)})`
    } else {
      outer!.style.height = ''
      const doc = outer!.querySelector<HTMLElement>('.a4-doc')
      if (doc) doc.style.transform = ''
    }
  }
  setScale()
  window.addEventListener('resize', setScale)
  return () => window.removeEventListener('resize', setScale)
}, [order])
```

**なぜ CSS ではなく JS で行うか:**  
A4用紙（794px × 1123px）を `transform: scale()` で縮小する際、コンテナの高さは `transform` では変化しないため、`height` を JS で明示的に設定する必要がある。CSS の `aspect-ratio` や `zoom` では印刷時の挙動が不安定になるため、JS での制御を採用。

**なぜ `[order]` を依存配列に入れるか:**  
`order.items.length` によって `emptyRows`（空行の数）が変わり、ドキュメントの実際の高さが変化するため、order が変わったらスケールを再計算する必要がある。

---

### 3-5. `SwRegister.tsx` — Service Worker 登録

```tsx
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }
}, [])
```

**なぜ `useEffect` かつ空依存配列か:**  
`navigator` はブラウザ専用 API。Service Worker の登録は1回だけ行えばよく、以降は SW が独自のライフサイクルを管理するため、`[]` で「マウント時1回のみ」が正しい。エラーを `.catch(() => {})` で無視するのは、SW が未対応のブラウザ（Safari 旧版等）での silentfail を意図している。

---

## 4. 状態管理の責務判断

### なぜ Zustand（グローバルストア）を使っていないか

このプロジェクトの状態管理は**意図的にサーバーサイドを真値の源泉**としている。

```
[Supabase DB] ─── Server Component ──→ props ──→ Client Component
                                                         ↓ (mutation)
                                              Server Actions ─→ revalidatePath
                                                         ↓
                                              [Client state はローカル+一時的]
```

グローバルストアを使わない理由:
1. **ページ間での共有が不要** — 各管理画面（在庫、発注、商品）のデータは独立しており、クロスコンポーネントの共有状態がほぼ存在しない
2. **Server Actions + `revalidatePath`** — ミューテーション後はサーバー側でキャッシュを無効化し、Server Component が再実行される。クライアント側でグローバル state を更新する必要がない
3. **Supabase リアルタイム** — `MenuClient` のリアルタイム更新も `router.refresh()` でサーバーに委ねる設計
4. **管理画面ユーザーは1人** — 同時編集の競合解決が不要

**Zustand が有効になる境界:**  
「発注カートを複数画面にまたがって保持したい」「通知バッジを複数のヘッダーコンポーネントで共有したい」という要件が生じた場合に導入を検討する。現状の設計では不要。
