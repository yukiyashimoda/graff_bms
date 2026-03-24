-- =============================================================================
-- パフォーマンス最適化: 不足インデックスの追加
-- =============================================================================

-- products: 一覧ページで created_at DESC ORDER BY に使用
CREATE INDEX IF NOT EXISTS idx_products_created_at
  ON products(created_at DESC);

-- purchase_orders: 発注履歴の降順ソートに使用
CREATE INDEX IF NOT EXISTS idx_purchase_orders_created_at
  ON purchase_orders(created_at DESC);

-- inventory_sessions: 承認済みセッションの最新取得に使用
-- eq('status','approved').order('approved_at', desc)
CREATE INDEX IF NOT EXISTS idx_inventory_sessions_approved
  ON inventory_sessions(status, approved_at DESC);

-- inventory_sessions: 進行中セッションの取得に使用
-- in('status',['in_progress','submitted']).order('started_at', desc)
CREATE INDEX IF NOT EXISTS idx_inventory_sessions_active
  ON inventory_sessions(status, started_at DESC);

-- stock_transactions: 商品別履歴の絞り込み + 日時ソートの複合
-- 既存の単独インデックス (product_id), (created_at DESC) を複合で補完
CREATE INDEX IF NOT EXISTS idx_stock_tx_product_created
  ON stock_transactions(product_id, created_at DESC);
