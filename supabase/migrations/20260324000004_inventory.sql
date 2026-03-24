-- =============================================================================
-- 棚卸し管理
-- =============================================================================

-- 棚卸し設定（singleton）
CREATE TABLE inventory_settings (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  interval_days integer     NOT NULL DEFAULT 30,   -- 棚卸し周期（日）
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at_inventory_settings
  BEFORE UPDATE ON inventory_settings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

INSERT INTO inventory_settings (interval_days) VALUES (30);

-- 棚卸しセッション
CREATE TABLE inventory_sessions (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  status       text        NOT NULL DEFAULT 'in_progress'
                           CHECK (status IN ('in_progress', 'submitted', 'approved')),
  started_at   timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  approved_at  timestamptz,
  notes        text
);

CREATE INDEX idx_inv_sessions_status ON inventory_sessions(status, started_at DESC);

-- 棚卸し品目（セッションごとスナップショット）
CREATE TABLE inventory_session_items (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      uuid          NOT NULL REFERENCES inventory_sessions(id) ON DELETE CASCADE,
  product_id      uuid          NOT NULL REFERENCES products(id)          ON DELETE CASCADE,
  product_name    text          NOT NULL,
  product_name_en text          NOT NULL DEFAULT '',
  unit            text          NOT NULL DEFAULT '本',
  system_quantity numeric(10,2) NOT NULL,   -- 開始時点の在庫数
  actual_quantity numeric(10,2),            -- 実測値
  notes           text,
  UNIQUE (session_id, product_id)
);

CREATE INDEX idx_inv_items_session ON inventory_session_items(session_id);
