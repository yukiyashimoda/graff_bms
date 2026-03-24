-- 発注書に表示する自社情報（シングルトン）
CREATE TABLE IF NOT EXISTS company_profile (
  id         INTEGER PRIMARY KEY DEFAULT 1,
  name       TEXT,
  phone      TEXT,
  email      TEXT,
  address    TEXT,
  logo_url   TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- 初期行を挿入（1行だけ存在する）
INSERT INTO company_profile (id) VALUES (1) ON CONFLICT DO NOTHING;

-- RLS
ALTER TABLE company_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service role full access" ON company_profile;
CREATE POLICY "service role full access" ON company_profile
  TO service_role USING (true) WITH CHECK (true);
