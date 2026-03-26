-- purchase_order_items に検品ステータスを追加
ALTER TABLE purchase_order_items
  ADD COLUMN IF NOT EXISTS inspection_status text
    CHECK (inspection_status IN ('arrived', 'partial', 'missing', 'price_changed'));
