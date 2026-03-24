-- =============================================================================
-- graff.bms - 統合管理システム 初期スキーマ
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 共通ユーティリティ
-- ---------------------------------------------------------------------------

-- updated_at を自動更新するトリガー関数
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- カテゴリマスタ
-- ---------------------------------------------------------------------------
CREATE TABLE categories (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  name_en     text        NOT NULL DEFAULT '',
  sort_order  int         NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 発注先マスタ
-- ---------------------------------------------------------------------------
CREATE TABLE suppliers (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  name_en      text        NOT NULL DEFAULT '',
  contact_name text,
  phone        text,
  address      text,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at_suppliers
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ---------------------------------------------------------------------------
-- 商品マスタ（在庫管理 & メニュー共通）
-- ---------------------------------------------------------------------------
CREATE TABLE products (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id    uuid          REFERENCES categories(id) ON DELETE SET NULL,
  supplier_id    uuid          REFERENCES suppliers(id)  ON DELETE SET NULL,
  name           text          NOT NULL,
  name_en        text          NOT NULL DEFAULT '',
  unit           text          NOT NULL DEFAULT '本',         -- 本/ml/g 等
  cost_price     numeric(10,2),                               -- 最新仕入れ価格
  selling_price  numeric(10,2),                               -- 販売単価
  image_url      text,
  tags           text[]        NOT NULL DEFAULT '{}',
  is_available   boolean       NOT NULL DEFAULT true,         -- false = 入荷待ち
  notes          text,
  created_at     timestamptz   NOT NULL DEFAULT now(),
  updated_at     timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_category   ON products(category_id);
CREATE INDEX idx_products_supplier   ON products(supplier_id);
CREATE INDEX idx_products_available  ON products(is_available);
CREATE INDEX idx_products_tags       ON products USING GIN(tags);

CREATE TRIGGER set_updated_at_products
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ---------------------------------------------------------------------------
-- 在庫テーブル（product と 1:1）
-- ---------------------------------------------------------------------------
CREATE TABLE stock (
  id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   uuid          NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  quantity     numeric(10,2) NOT NULL DEFAULT 0,
  min_quantity numeric(10,2) NOT NULL DEFAULT 0,   -- 最低在庫閾値
  updated_at   timestamptz   NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at_stock
  BEFORE UPDATE ON stock
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ---------------------------------------------------------------------------
-- 入出庫トランザクション履歴
-- ---------------------------------------------------------------------------
CREATE TABLE stock_transactions (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid          NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type        text          NOT NULL CHECK (type IN ('in', 'out', 'adjustment')),
  quantity    numeric(10,2) NOT NULL,
  cost_price  numeric(10,2),   -- 'in' 時の仕入れ価格（スナップショット）
  notes       text,
  created_at  timestamptz   NOT NULL DEFAULT now(),
  created_by  uuid          REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_stock_tx_product    ON stock_transactions(product_id);
CREATE INDEX idx_stock_tx_created_at ON stock_transactions(created_at DESC);

-- ---------------------------------------------------------------------------
-- 価格履歴（前回比 5% 超高騰アラート用）
-- ---------------------------------------------------------------------------
CREATE TABLE price_history (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid          NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  cost_price  numeric(10,2) NOT NULL,
  recorded_at timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_price_history_product ON price_history(product_id, recorded_at DESC);

-- ---------------------------------------------------------------------------
-- 価格変動アラート関数 & トリガー
-- 新規入庫 (stock_transactions.type = 'in') 時に、前回仕入れ価格と比較し
-- 5% 以上高騰していれば price_alerts テーブルに記録する
-- ---------------------------------------------------------------------------
CREATE TABLE price_alerts (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     uuid          NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  previous_price numeric(10,2) NOT NULL,
  new_price      numeric(10,2) NOT NULL,
  change_rate    numeric(6,4)  NOT NULL,   -- 例: 0.08 = 8% 上昇
  is_read        boolean       NOT NULL DEFAULT false,
  created_at     timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_price_alerts_unread ON price_alerts(is_read, created_at DESC);

CREATE OR REPLACE FUNCTION check_price_alert()
RETURNS trigger AS $$
DECLARE
  prev_price numeric(10,2);
  change_rate numeric(6,4);
BEGIN
  -- 仕入れトランザクションかつ cost_price が指定されている場合のみチェック
  IF NEW.type <> 'in' OR NEW.cost_price IS NULL THEN
    RETURN NEW;
  END IF;

  -- 直近の仕入れ価格を取得
  SELECT cost_price INTO prev_price
  FROM price_history
  WHERE product_id = NEW.product_id
  ORDER BY recorded_at DESC
  LIMIT 1;

  -- 履歴が存在し、前回価格が 0 より大きい場合のみ比較
  IF prev_price IS NOT NULL AND prev_price > 0 THEN
    change_rate := (NEW.cost_price - prev_price) / prev_price;
    IF change_rate >= 0.05 THEN
      INSERT INTO price_alerts (product_id, previous_price, new_price, change_rate)
      VALUES (NEW.product_id, prev_price, NEW.cost_price, change_rate);
    END IF;
  END IF;

  -- 価格履歴に記録
  INSERT INTO price_history (product_id, cost_price)
  VALUES (NEW.product_id, NEW.cost_price);

  -- products.cost_price を最新値に更新
  UPDATE products SET cost_price = NEW.cost_price WHERE id = NEW.product_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_price_alert
  AFTER INSERT ON stock_transactions
  FOR EACH ROW EXECUTE FUNCTION check_price_alert();

-- ---------------------------------------------------------------------------
-- カクテル・メニューマスタ
-- ---------------------------------------------------------------------------
CREATE TABLE cocktails (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text          NOT NULL,
  name_en         text          NOT NULL DEFAULT '',
  description     text          NOT NULL DEFAULT '',
  description_en  text          NOT NULL DEFAULT '',
  selling_price   numeric(10,2),
  image_url       text,
  tags            text[]        NOT NULL DEFAULT '{}',
  is_available    boolean       NOT NULL DEFAULT true,
  sort_order      int           NOT NULL DEFAULT 0,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_cocktails_available ON cocktails(is_available);
CREATE INDEX idx_cocktails_tags      ON cocktails USING GIN(tags);

CREATE TRIGGER set_updated_at_cocktails
  BEFORE UPDATE ON cocktails
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ---------------------------------------------------------------------------
-- カクテル材料（レシピ）
-- ---------------------------------------------------------------------------
CREATE TABLE cocktail_ingredients (
  id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  cocktail_id  uuid          NOT NULL REFERENCES cocktails(id) ON DELETE CASCADE,
  product_id   uuid          NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity     numeric(10,3) NOT NULL,   -- 使用量
  unit         text          NOT NULL,   -- ml / g / 個 等
  UNIQUE (cocktail_id, product_id)
);

CREATE INDEX idx_cocktail_ingredients_cocktail ON cocktail_ingredients(cocktail_id);
CREATE INDEX idx_cocktail_ingredients_product  ON cocktail_ingredients(product_id);

-- ---------------------------------------------------------------------------
-- カクテル原価計算ビュー
-- cocktail_ingredients × products.cost_price から原価・原価率を算出
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW cocktail_cost_view AS
SELECT
  c.id                                           AS cocktail_id,
  c.name,
  c.name_en,
  c.selling_price,
  COALESCE(SUM(
    ci.quantity * p.cost_price
    -- 単位変換: ingredient が 'ml' で product が '本' の場合はそのまま比率計算
    -- 厳密な変換は アプリ側ロジックで行う
  ), 0)                                          AS total_cost,
  CASE
    WHEN c.selling_price > 0
    THEN ROUND(
      COALESCE(SUM(ci.quantity * p.cost_price), 0)
      / c.selling_price * 100, 1
    )
    ELSE NULL
  END                                            AS cost_rate_pct
FROM cocktails c
LEFT JOIN cocktail_ingredients ci ON ci.cocktail_id = c.id
LEFT JOIN products p              ON p.id = ci.product_id
GROUP BY c.id, c.name, c.name_en, c.selling_price;

-- ---------------------------------------------------------------------------
-- 発注書
-- ---------------------------------------------------------------------------
CREATE TABLE purchase_orders (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id     uuid        NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  status          text        NOT NULL DEFAULT 'draft'
                              CHECK (status IN ('draft', 'sent', 'received', 'cancelled')),
  order_date      date        NOT NULL DEFAULT CURRENT_DATE,
  expected_date   date,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid        REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status   ON purchase_orders(status);

CREATE TRIGGER set_updated_at_purchase_orders
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ---------------------------------------------------------------------------
-- 発注書明細
-- ---------------------------------------------------------------------------
CREATE TABLE purchase_order_items (
  id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid          NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id        uuid          NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity          numeric(10,2) NOT NULL,
  unit_price        numeric(10,2),
  notes             text,
  UNIQUE (purchase_order_id, product_id)
);

CREATE INDEX idx_po_items_order   ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_po_items_product ON purchase_order_items(product_id);

-- ---------------------------------------------------------------------------
-- Row Level Security (RLS)
-- 認証済みユーザーは全テーブルを読み書き可
-- 公開メニュー用に cocktails / products は anon でも SELECT 可
-- ---------------------------------------------------------------------------
ALTER TABLE categories          ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE products            ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock               ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history       ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE cocktails           ENABLE ROW LEVEL SECURITY;
ALTER TABLE cocktail_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders     ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーは全操作可
CREATE POLICY "authenticated_all" ON categories           FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON suppliers            FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON products             FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON stock                FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON stock_transactions   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON price_history        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON price_alerts         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON cocktails            FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON cocktail_ingredients FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON purchase_orders      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON purchase_order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 公開メニュー: anon ユーザーは is_available=true の商品・カクテルのみ参照可
CREATE POLICY "public_menu_products"
  ON products FOR SELECT TO anon
  USING (is_available = true);

CREATE POLICY "public_menu_cocktails"
  ON cocktails FOR SELECT TO anon
  USING (is_available = true);

CREATE POLICY "public_menu_categories"
  ON categories FOR SELECT TO anon
  USING (true);

CREATE POLICY "public_menu_cocktail_ingredients"
  ON cocktail_ingredients FOR SELECT TO anon
  USING (true);

-- ---------------------------------------------------------------------------
-- シードデータ: 初期カテゴリ
-- ---------------------------------------------------------------------------
INSERT INTO categories (name, name_en, sort_order) VALUES
  ('スピリッツ',   'Spirits',     1),
  ('ワイン',       'Wine',        2),
  ('シャンパン',   'Champagne',   3),
  ('ビール',       'Beer',        4),
  ('ソフトドリンク', 'Soft Drink', 5),
  ('フード',       'Food',        6),
  ('その他',       'Others',      99);
