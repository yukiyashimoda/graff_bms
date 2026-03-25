-- カクテルテーブルにレシピ手順カラムを追加
ALTER TABLE cocktails
  ADD COLUMN IF NOT EXISTS recipe_steps text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN cocktails.recipe_steps IS 'レシピ手順（順番配列）';
