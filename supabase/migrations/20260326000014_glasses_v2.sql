-- =============================================================================
-- グラス管理テーブル再設計
-- 旧スキーマ（物理グラス）→ グラス提供管理（開栓ボトルの杯売り）
-- =============================================================================

DROP TABLE IF EXISTS glasses;

CREATE TABLE glasses (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    uuid          NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  serving_ml    numeric(8,1)  NOT NULL CHECK (serving_ml > 0),
  bottle_ml     numeric(8,1),
  selling_price numeric(10,2) CHECK (selling_price >= 0),
  opened_at     timestamptz   NOT NULL DEFAULT now(),
  is_available  boolean       NOT NULL DEFAULT true,
  notes         text,
  created_at    timestamptz   NOT NULL DEFAULT now(),
  updated_at    timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_glasses_product    ON glasses(product_id);
CREATE INDEX idx_glasses_available  ON glasses(is_available);
CREATE INDEX idx_glasses_opened_at  ON glasses(opened_at);

CREATE TRIGGER set_updated_at_glasses
  BEFORE UPDATE ON glasses
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE glasses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "glasses_auth_all" ON glasses
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "glasses_anon_select" ON glasses
  FOR SELECT TO anon USING (is_available = true);
