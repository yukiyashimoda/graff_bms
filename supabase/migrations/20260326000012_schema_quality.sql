-- =============================================================================
-- スキーマ品質向上
-- 対応項目:
--   [高] 1. 監査テーブルの ON DELETE CASCADE → SET NULL（履歴保護）
--   [高] 2. 在庫・価格系テーブルの CHECK 制約追加（データ品質）
--   [高] 3. anon ロールの cocktail_ingredients RLS を修正（情報漏洩防止）
--   [中] 4. inventory_batches / inventory_session_items → SET NULL（記録保護）
--   [中] 5. suppliers.name インデックス追加
--   [中] 6. 重複インデックス idx_inv_sessions_status を削除
--   [中] 7. process_stock_transaction を更新（adjustment 時に inventory_batches も同期）
--   [中] 8. apply_inventory_session_adjustments を更新（同上）
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. 監査テーブルの ON DELETE CASCADE → SET NULL
--    商品削除時に入出庫履歴・価格履歴・価格アラートが連鎖削除されるのを防ぐ
--    product_id = NULL になることで「削除済み商品の記録」として保持される
-- -----------------------------------------------------------------------------

-- stock_transactions
ALTER TABLE stock_transactions
  ALTER COLUMN product_id DROP NOT NULL;

ALTER TABLE stock_transactions
  DROP CONSTRAINT IF EXISTS stock_transactions_product_id_fkey;

ALTER TABLE stock_transactions
  ADD CONSTRAINT stock_transactions_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

-- price_history
ALTER TABLE price_history
  ALTER COLUMN product_id DROP NOT NULL;

ALTER TABLE price_history
  DROP CONSTRAINT IF EXISTS price_history_product_id_fkey;

ALTER TABLE price_history
  ADD CONSTRAINT price_history_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

-- price_alerts
ALTER TABLE price_alerts
  ALTER COLUMN product_id DROP NOT NULL;

ALTER TABLE price_alerts
  DROP CONSTRAINT IF EXISTS price_alerts_product_id_fkey;

ALTER TABLE price_alerts
  ADD CONSTRAINT price_alerts_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;


-- -----------------------------------------------------------------------------
-- 2. CHECK 制約の追加（DB レベルでのデータ品質保証）
-- -----------------------------------------------------------------------------

-- stock: 在庫数・最低在庫数は 0 以上
ALTER TABLE stock
  ADD CONSTRAINT check_stock_quantity_nonneg
  CHECK (quantity >= 0);

ALTER TABLE stock
  ADD CONSTRAINT check_stock_min_quantity_nonneg
  CHECK (min_quantity >= 0);

-- products: 価格は NULL または 0 以上
ALTER TABLE products
  ADD CONSTRAINT check_products_prices_nonneg
  CHECK (
    (cost_price    IS NULL OR cost_price    >= 0) AND
    (selling_price IS NULL OR selling_price >= 0)
  );

-- inventory_batches: 残数は 0 以上、入庫数は正
ALTER TABLE inventory_batches
  ADD CONSTRAINT check_batch_rem_nonneg
  CHECK (quantity_rem >= 0);

ALTER TABLE inventory_batches
  ADD CONSTRAINT check_batch_in_positive
  CHECK (quantity_in > 0);

-- purchase_order_items: 発注数は正
ALTER TABLE purchase_order_items
  ADD CONSTRAINT check_po_item_qty_positive
  CHECK (quantity > 0);


-- -----------------------------------------------------------------------------
-- 3. anon ロールの cocktail_ingredients RLS を修正
--    修正前: is_available = false のカクテルのレシピも anon に公開されていた
--    修正後: is_available = true のカクテルのレシピのみ公開
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "public_menu_cocktail_ingredients" ON cocktail_ingredients;

CREATE POLICY "public_menu_cocktail_ingredients"
  ON cocktail_ingredients FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM cocktails
      WHERE cocktails.id = cocktail_id
        AND cocktails.is_available = true
    )
  );


-- -----------------------------------------------------------------------------
-- 4. inventory_batches / inventory_session_items の ON DELETE CASCADE → SET NULL
--    商品削除後もロット情報・棚卸し記録が残るようにする
-- -----------------------------------------------------------------------------

-- inventory_batches
ALTER TABLE inventory_batches
  ALTER COLUMN product_id DROP NOT NULL;

ALTER TABLE inventory_batches
  DROP CONSTRAINT IF EXISTS inventory_batches_product_id_fkey;

ALTER TABLE inventory_batches
  ADD CONSTRAINT inventory_batches_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

-- inventory_session_items
ALTER TABLE inventory_session_items
  ALTER COLUMN product_id DROP NOT NULL;

ALTER TABLE inventory_session_items
  DROP CONSTRAINT IF EXISTS inventory_session_items_product_id_fkey;

ALTER TABLE inventory_session_items
  ADD CONSTRAINT inventory_session_items_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;


-- -----------------------------------------------------------------------------
-- 5. suppliers.name にインデックス追加
--    ORDER BY name でフルスキャンが発生していたのを解消
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);


-- -----------------------------------------------------------------------------
-- 6. 重複インデックスを削除
--    idx_inv_sessions_status (inventory.sql で作成) と
--    idx_inventory_sessions_active (performance_indexes.sql で作成) は
--    同一カラム構成 (status, started_at DESC) で重複している
-- -----------------------------------------------------------------------------

DROP INDEX IF EXISTS idx_inv_sessions_status;


-- -----------------------------------------------------------------------------
-- 7. process_stock_transaction を更新
--    adjustment 時に inventory_batches も差分で同期する
--    修正前: stock.quantity は更新されるが batches は放置 → ロット追跡が乖離
--    修正後: 増分はFIFO外の最新ロットへ加算、減分はFIFO順に減算
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION process_stock_transaction(
  p_product_id  UUID,
  p_type        TEXT,
  p_quantity    NUMERIC,
  p_cost_price  NUMERIC DEFAULT NULL,
  p_notes       TEXT    DEFAULT NULL
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current        NUMERIC;
  v_new_quantity   NUMERIC;
  v_effective_cost NUMERIC;
  v_incoming_price NUMERIC;
  v_latest         RECORD;
  v_batch          RECORD;
  v_remaining      NUMERIC;
  v_deduct         NUMERIC;
  v_diff           NUMERIC;
BEGIN
  -- 1. 現在の在庫数を取得
  SELECT quantity INTO v_current
  FROM stock WHERE product_id = p_product_id;
  v_current := COALESCE(v_current, 0);

  -- 2. 新しい在庫数を計算
  IF p_type = 'in' THEN
    v_new_quantity := v_current + p_quantity;
  ELSIF p_type = 'out' THEN
    v_new_quantity := GREATEST(0, v_current - p_quantity);
  ELSE  -- adjustment: 指定値で上書き
    v_new_quantity := p_quantity;
  END IF;

  -- 3. stock を UPSERT
  INSERT INTO stock (product_id, quantity)
  VALUES (p_product_id, v_new_quantity)
  ON CONFLICT (product_id) DO UPDATE SET quantity = v_new_quantity;

  v_effective_cost := p_cost_price;

  -- 4. 入庫時: ロット管理
  IF p_type = 'in' AND p_quantity > 0 THEN
    SELECT id, quantity_rem, quantity_in, cost_price
    INTO v_latest
    FROM inventory_batches
    WHERE product_id = p_product_id
    ORDER BY received_at DESC
    LIMIT 1;

    v_incoming_price := COALESCE(p_cost_price, v_latest.cost_price);

    IF v_incoming_price IS NOT NULL THEN
      v_effective_cost := v_incoming_price;
    ELSE
      SELECT cost_price INTO v_effective_cost
      FROM products WHERE id = p_product_id;
      v_effective_cost := COALESCE(v_effective_cost, 0);
    END IF;

    IF v_latest.id IS NOT NULL
       AND v_incoming_price IS NOT DISTINCT FROM v_latest.cost_price THEN
      UPDATE inventory_batches
      SET quantity_rem = v_latest.quantity_rem + p_quantity,
          quantity_in  = v_latest.quantity_in  + p_quantity
      WHERE id = v_latest.id;
    ELSE
      INSERT INTO inventory_batches
        (product_id, cost_price, quantity_in, quantity_rem, notes)
      VALUES
        (p_product_id, COALESCE(v_effective_cost, 0), p_quantity, p_quantity, p_notes);
    END IF;
  END IF;

  -- 5. stock_transactions に記録（DBトリガーが price_history / alerts を自動更新）
  INSERT INTO stock_transactions (product_id, type, quantity, cost_price, notes)
  VALUES (p_product_id, p_type, p_quantity, v_effective_cost, p_notes);

  -- 6. 出庫時: FIFO でロット在庫を減算
  IF p_type = 'out' AND p_quantity > 0 THEN
    v_remaining := p_quantity;
    FOR v_batch IN
      SELECT id, quantity_rem
      FROM inventory_batches
      WHERE product_id = p_product_id AND quantity_rem > 0
      ORDER BY received_at ASC
    LOOP
      EXIT WHEN v_remaining <= 0;
      v_deduct := LEAST(v_remaining, v_batch.quantity_rem);
      UPDATE inventory_batches
      SET quantity_rem = v_batch.quantity_rem - v_deduct
      WHERE id = v_batch.id;
      v_remaining := v_remaining - v_deduct;
    END LOOP;
  END IF;

  -- 7. 調整時: ロット在庫も差分で同期（棚卸し差異などを反映）
  IF p_type = 'adjustment' THEN
    v_diff := v_new_quantity - v_current;  -- 正=増加, 負=減少

    IF v_diff > 0 THEN
      -- 増加: 最新ロットに加算（価格変動なし）
      SELECT id, quantity_rem, quantity_in
      INTO v_latest
      FROM inventory_batches
      WHERE product_id = p_product_id
      ORDER BY received_at DESC
      LIMIT 1;

      IF v_latest.id IS NOT NULL THEN
        UPDATE inventory_batches
        SET quantity_rem = v_latest.quantity_rem + v_diff,
            quantity_in  = v_latest.quantity_in  + v_diff
        WHERE id = v_latest.id;
      ELSE
        -- バッチ未作成: コスト 0 の新規バッチを作成
        INSERT INTO inventory_batches
          (product_id, cost_price, quantity_in, quantity_rem, notes)
        VALUES
          (p_product_id, 0, v_diff, v_diff, COALESCE(p_notes, '調整入庫'));
      END IF;

    ELSIF v_diff < 0 THEN
      -- 減少: FIFO でロットから減算
      v_remaining := -v_diff;
      FOR v_batch IN
        SELECT id, quantity_rem
        FROM inventory_batches
        WHERE product_id = p_product_id AND quantity_rem > 0
        ORDER BY received_at ASC
      LOOP
        EXIT WHEN v_remaining <= 0;
        v_deduct := LEAST(v_remaining, v_batch.quantity_rem);
        UPDATE inventory_batches
        SET quantity_rem = v_batch.quantity_rem - v_deduct
        WHERE id = v_batch.id;
        v_remaining := v_remaining - v_deduct;
      END LOOP;
    END IF;
    -- v_diff = 0: 変化なし → 何もしない
  END IF;

  RETURN v_new_quantity;
END;
$$;

GRANT EXECUTE ON FUNCTION process_stock_transaction(UUID, TEXT, NUMERIC, NUMERIC, TEXT)
  TO authenticated, service_role;


-- -----------------------------------------------------------------------------
-- 8. apply_inventory_session_adjustments を更新
--    棚卸し承認時に inventory_batches も差分で同期する
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION apply_inventory_session_adjustments(
  p_session_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item      RECORD;
  v_batch     RECORD;
  v_latest    RECORD;
  v_diff      NUMERIC;
  v_remaining NUMERIC;
  v_deduct    NUMERIC;
BEGIN
  FOR v_item IN
    SELECT product_id, system_quantity, actual_quantity
    FROM inventory_session_items
    WHERE session_id        = p_session_id
      AND actual_quantity   IS NOT NULL
      AND actual_quantity  != system_quantity
      AND product_id        IS NOT NULL  -- 商品が削除済みの行はスキップ
  LOOP
    v_diff := v_item.actual_quantity - v_item.system_quantity;

    -- 調整トランザクションを記録（quantity = 差分）
    INSERT INTO stock_transactions (product_id, type, quantity, notes)
    VALUES (v_item.product_id, 'adjustment', v_diff, '棚卸し差異調整');

    -- stock を実測値で上書き
    UPDATE stock
    SET quantity = v_item.actual_quantity
    WHERE product_id = v_item.product_id;

    -- inventory_batches も差分で同期
    IF v_diff > 0 THEN
      SELECT id, quantity_rem, quantity_in
      INTO v_latest
      FROM inventory_batches
      WHERE product_id = v_item.product_id
      ORDER BY received_at DESC
      LIMIT 1;

      IF v_latest.id IS NOT NULL THEN
        UPDATE inventory_batches
        SET quantity_rem = v_latest.quantity_rem + v_diff,
            quantity_in  = v_latest.quantity_in  + v_diff
        WHERE id = v_latest.id;
      ELSE
        INSERT INTO inventory_batches
          (product_id, cost_price, quantity_in, quantity_rem, notes)
        VALUES
          (v_item.product_id, 0, v_diff, v_diff, '棚卸し差異調整');
      END IF;

    ELSIF v_diff < 0 THEN
      v_remaining := -v_diff;
      FOR v_batch IN
        SELECT id, quantity_rem
        FROM inventory_batches
        WHERE product_id = v_item.product_id AND quantity_rem > 0
        ORDER BY received_at ASC
      LOOP
        EXIT WHEN v_remaining <= 0;
        v_deduct := LEAST(v_remaining, v_batch.quantity_rem);
        UPDATE inventory_batches
        SET quantity_rem = v_batch.quantity_rem - v_deduct
        WHERE id = v_batch.id;
        v_remaining := v_remaining - v_deduct;
      END LOOP;
    END IF;
  END LOOP;

  -- セッションを承認済みに更新
  UPDATE inventory_sessions
  SET status      = 'approved',
      approved_at = NOW()
  WHERE id = p_session_id;
END;
$$;

GRANT EXECUTE ON FUNCTION apply_inventory_session_adjustments(UUID)
  TO authenticated, service_role;
