-- 棚卸し周期設定を柔軟なスケジュール型に拡張
ALTER TABLE inventory_settings
  ADD COLUMN IF NOT EXISTS schedule_type  text    NOT NULL DEFAULT 'interval'
    CHECK (schedule_type IN ('interval', 'monthly_end', 'monthly_times')),
  ADD COLUMN IF NOT EXISTS schedule_value integer;
