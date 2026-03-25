-- =============================================================================
-- グラス管理テーブル
-- =============================================================================

CREATE TABLE glasses (
  id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text          NOT NULL,
  name_en      text          NOT NULL DEFAULT '',
  type         text          NOT NULL DEFAULT 'other'
               CHECK (type IN ('highball', 'rocks', 'wine', 'champagne', 'shot', 'cocktail', 'beer', 'other')),
  size_ml      numeric(8,1),
  image_url    text,
  notes        text,
  is_available boolean       NOT NULL DEFAULT true,
  sort_order   int           NOT NULL DEFAULT 0,
  created_at   timestamptz   NOT NULL DEFAULT now(),
  updated_at   timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_glasses_type      ON glasses(type);
CREATE INDEX idx_glasses_available ON glasses(is_available);

CREATE TRIGGER set_updated_at_glasses
  BEFORE UPDATE ON glasses
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- RLS
ALTER TABLE glasses ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーは全操作可能
CREATE POLICY "glasses_auth_all" ON glasses
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- anon は is_available=true のみ参照可能
CREATE POLICY "glasses_anon_select" ON glasses
  FOR SELECT TO anon USING (is_available = true);
