-- 次回棚卸し予定日（シンプルなリマインド用）
ALTER TABLE inventory_settings
  ADD COLUMN IF NOT EXISTS next_inventory_date date;
