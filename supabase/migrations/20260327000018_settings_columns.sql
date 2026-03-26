-- company_profile にアプリ設定カラムを追加
ALTER TABLE company_profile
  ADD COLUMN IF NOT EXISTS alert_threshold    NUMERIC(5,2) DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS order_text_template TEXT;

-- デフォルトの発注テキスト雛形を設定
UPDATE company_profile
SET order_text_template = 'お世話になっております。
下記の通り発注をお願いいたします。

【注文内容】
{{items}}

{{delivery}}'
WHERE id = 1 AND order_text_template IS NULL;

-- check_price_alert トリガーを company_profile のしきい値を参照するよう更新
CREATE OR REPLACE FUNCTION check_price_alert()
RETURNS trigger AS $$
DECLARE
  prev_price  numeric(10,2);
  change_rate numeric(6,4);
  threshold   numeric(5,2);
BEGIN
  IF NEW.type <> 'in' OR NEW.cost_price IS NULL OR NEW.quantity = 0 THEN
    RETURN NEW;
  END IF;

  -- しきい値を company_profile から取得（デフォルト 5%）
  SELECT COALESCE(alert_threshold, 5.0) / 100.0 INTO threshold
  FROM company_profile WHERE id = 1;

  SELECT cost_price INTO prev_price
  FROM price_history
  WHERE product_id = NEW.product_id
  ORDER BY recorded_at DESC
  LIMIT 1;

  IF prev_price IS NOT NULL AND prev_price > 0 THEN
    change_rate := (NEW.cost_price - prev_price) / prev_price;
    IF change_rate >= threshold THEN
      INSERT INTO price_alerts (product_id, previous_price, new_price, change_rate)
      VALUES (NEW.product_id, prev_price, NEW.cost_price, change_rate);
    END IF;
  END IF;

  INSERT INTO price_history (product_id, cost_price)
  VALUES (NEW.product_id, NEW.cost_price);

  UPDATE products SET cost_price = NEW.cost_price WHERE id = NEW.product_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
