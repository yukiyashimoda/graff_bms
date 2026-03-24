-- display_out_of_stock を「公開フラグ」として再定義（デフォルト true = 公開）
ALTER TABLE products ALTER COLUMN display_out_of_stock SET DEFAULT true;
