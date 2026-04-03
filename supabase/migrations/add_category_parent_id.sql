-- カテゴリの親子階層（大カテゴリー / サブカテゴリー）を追加
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES categories(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS categories_parent_id_idx ON categories(parent_id);
