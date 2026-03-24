-- =============================================================================
-- graff.bms - 商品詳細テーブル追加 & products カラム拡張
-- =============================================================================

-- ---------------------------------------------------------------------------
-- products テーブルへのカラム追加
-- ---------------------------------------------------------------------------
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_recommended       boolean   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_tag           text,
  ADD COLUMN IF NOT EXISTS display_out_of_stock boolean   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS default_supplier_id  uuid      REFERENCES suppliers(id) ON DELETE SET NULL;

COMMENT ON COLUMN products.is_recommended       IS 'おすすめ表示フラグ';
COMMENT ON COLUMN products.custom_tag           IS '任意の単一カスタムタグ（例: "NEW", "SOLD OUT"）';
COMMENT ON COLUMN products.display_out_of_stock IS 'true = 在庫切れ時もメニューに表示する';
COMMENT ON COLUMN products.default_supplier_id  IS 'デフォルト発注先（supplier_id と独立して設定可）';

CREATE INDEX IF NOT EXISTS idx_products_recommended ON products(is_recommended);

-- ---------------------------------------------------------------------------
-- ワイン詳細テーブル（products と 1:1）
-- ---------------------------------------------------------------------------
CREATE TABLE wine_details (
  product_id      uuid        PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  country         text        NOT NULL DEFAULT '',
  region          text        NOT NULL DEFAULT '',        -- 産地（日本語）
  region_en       text        NOT NULL DEFAULT '',        -- 産地（英語）
  grape_varieties text[]      NOT NULL DEFAULT '{}',      -- ブドウ品種（複数可）
  body            text        CHECK (body IN ('light', 'medium', 'full')),
  vintage         smallint    CHECK (vintage BETWEEN 1900 AND 2100),
  description     text        NOT NULL DEFAULT '',        -- 説明（日本語）
  description_en  text        NOT NULL DEFAULT '',        -- 説明（英語）
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  wine_details               IS 'ワイン固有の詳細情報（products と 1:1）';
COMMENT ON COLUMN wine_details.grape_varieties IS '例: ARRAY[''Cabernet Sauvignon'', ''Merlot'']';
COMMENT ON COLUMN wine_details.body           IS 'ボディ感: light / medium / full';

CREATE TRIGGER set_updated_at_wine_details
  BEFORE UPDATE ON wine_details
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ---------------------------------------------------------------------------
-- スピリッツ詳細テーブル（products と 1:1）
-- ---------------------------------------------------------------------------
CREATE TABLE spirits_details (
  product_id    uuid          PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  type          text          NOT NULL DEFAULT '',   -- whisky / gin / vodka / rum 等
  volume_ml     int           CHECK (volume_ml > 0),
  shot_price    numeric(10,2) CHECK (shot_price >= 0),
  age_statement text,                                -- '12 Years' / 'NAS' 等
  created_at    timestamptz   NOT NULL DEFAULT now(),
  updated_at    timestamptz   NOT NULL DEFAULT now()
);

COMMENT ON TABLE  spirits_details            IS 'スピリッツ固有の詳細情報（products と 1:1）';
COMMENT ON COLUMN spirits_details.type        IS '例: whisky, gin, vodka, rum, tequila, brandy';
COMMENT ON COLUMN spirits_details.shot_price  IS '1ショット販売価格';
COMMENT ON COLUMN spirits_details.age_statement IS '熟成年数表記（例: "12 Years", "NAS"）';

CREATE TRIGGER set_updated_at_spirits_details
  BEFORE UPDATE ON spirits_details
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ---------------------------------------------------------------------------
-- ソフトドリンク詳細テーブル（products と 1:1）
-- ---------------------------------------------------------------------------
CREATE TABLE soft_drink_details (
  product_id  uuid        PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  volume_ml   int         CHECK (volume_ml > 0),
  is_mixer    boolean     NOT NULL DEFAULT false,   -- カクテル用ミキサーとして使用するか
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  soft_drink_details         IS 'ソフトドリンク固有の詳細情報（products と 1:1）';
COMMENT ON COLUMN soft_drink_details.is_mixer IS 'true = ミキサー用途（コスト計算対象になる）';

CREATE TRIGGER set_updated_at_soft_drink_details
  BEFORE UPDATE ON soft_drink_details
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE wine_details        ENABLE ROW LEVEL SECURITY;
ALTER TABLE spirits_details     ENABLE ROW LEVEL SECURITY;
ALTER TABLE soft_drink_details  ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーは全操作可
CREATE POLICY "authenticated_all" ON wine_details       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON spirits_details    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON soft_drink_details FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 公開メニュー: anon は products の is_available=true に紐付く詳細のみ参照可
CREATE POLICY "public_menu_wine_details"
  ON wine_details FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM products WHERE products.id = wine_details.product_id AND products.is_available = true
  ));

CREATE POLICY "public_menu_spirits_details"
  ON spirits_details FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM products WHERE products.id = spirits_details.product_id AND products.is_available = true
  ));

CREATE POLICY "public_menu_soft_drink_details"
  ON soft_drink_details FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM products WHERE products.id = soft_drink_details.product_id AND products.is_available = true
  ));
