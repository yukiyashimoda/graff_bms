-- ---------------------------------------------------------------------------
-- inventory_batches: ロット別仕入れ記録
-- 同じ商品でも「いつ・いくらで仕入れたか」を別レコードで管理する
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_batches (
  id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   uuid          NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  cost_price   numeric(10,2) NOT NULL,
  quantity_in  numeric(10,2) NOT NULL,   -- このロットで入庫した数量
  quantity_rem numeric(10,2) NOT NULL,   -- 残在庫（出庫の都度 FIFO で減算）
  notes        text,
  received_at  timestamptz   NOT NULL DEFAULT now(),
  created_at   timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_batches_product_fifo
  ON inventory_batches(product_id, received_at ASC);

CREATE INDEX IF NOT EXISTS idx_batches_product_rem
  ON inventory_batches(product_id, quantity_rem) WHERE quantity_rem > 0;

ALTER TABLE inventory_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_all" ON inventory_batches
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON inventory_batches
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- DBトリガー (check_price_alert) の修正:
-- stock_transactions の type='in' & cost_price IS NOT NULL 時に発火し
-- price_history / price_alerts / products.cost_price を更新する。
-- JS側の重複 insert を廃止するため、この関数が唯一の価格更新ルートとなる。
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_price_alert()
RETURNS trigger AS $$
DECLARE
  prev_price  numeric(10,2);
  change_rate numeric(6,4);
BEGIN
  IF NEW.type <> 'in' OR NEW.cost_price IS NULL OR NEW.quantity = 0 THEN
    RETURN NEW;
  END IF;

  SELECT cost_price INTO prev_price
  FROM price_history
  WHERE product_id = NEW.product_id
  ORDER BY recorded_at DESC
  LIMIT 1;

  IF prev_price IS NOT NULL AND prev_price > 0 THEN
    change_rate := (NEW.cost_price - prev_price) / prev_price;
    IF change_rate >= 0.05 THEN
      INSERT INTO price_alerts (product_id, previous_price, new_price, change_rate)
      VALUES (NEW.product_id, prev_price, NEW.cost_price, change_rate);
    END IF;
  END IF;

  INSERT INTO price_history (product_id, cost_price)
  VALUES (NEW.product_id, NEW.cost_price);

  UPDATE products SET cost_price = NEW.cost_price WHERE id = NEW.product_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
