-- purchase_order_items に受領済み数量を追加
ALTER TABLE purchase_order_items
  ADD COLUMN IF NOT EXISTS received_quantity numeric(10,2) NOT NULL DEFAULT 0;
