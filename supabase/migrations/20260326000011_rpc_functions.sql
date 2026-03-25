-- ===========================================================================
-- RPC Functions: N+1 DB通信をDB内関数で1往復に集約
-- 対象:
--   1. process_stock_transaction    … FIFO出庫 + ロット管理 + 在庫更新
--   2. apply_inventory_session_adjustments … 棚卸し差異の一括適用
--   3. receive_purchase_order       … 発注受領 + 全品目の在庫入庫
--   4. create_orders_from_cart      … カートから発注書を業者単位で一括作成
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. process_stock_transaction
--    recordStockTransaction() (stock/actions.ts) の DB 版
--    - stock を UPSERT
--    - 入庫時: ロット（inventory_batches）を同一価格なら加算、異なれば新規
--    - 出庫時: FIFO でロットから減算（N往復 → ループ1本）
--    - stock_transactions に記録（DBトリガーが price_history / alerts を自動更新）
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION process_stock_transaction(
  p_product_id  UUID,
  p_type        TEXT,           -- 'in' | 'out' | 'adjustment'
  p_quantity    NUMERIC,
  p_cost_price  NUMERIC DEFAULT NULL,
  p_notes       TEXT    DEFAULT NULL
)
RETURNS NUMERIC                 -- 更新後の在庫数を返す
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
BEGIN
  -- 1. 現在の在庫数を取得
  SELECT quantity INTO v_current
  FROM stock
  WHERE product_id = p_product_id;
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

  -- 出庫・調整時の実効原価は p_cost_price をそのまま使う
  v_effective_cost := p_cost_price;

  -- 4. 入庫時: ロット管理（price が同じなら加算、異なれば新規ロット）
  IF p_type = 'in' AND p_quantity > 0 THEN
    -- 最新ロットを取得
    SELECT id, quantity_rem, quantity_in, cost_price
    INTO v_latest
    FROM inventory_batches
    WHERE product_id = p_product_id
    ORDER BY received_at DESC
    LIMIT 1;

    -- 実効入庫価格: 渡された価格 → なければ最新ロット価格
    v_incoming_price := COALESCE(p_cost_price, v_latest.cost_price);

    -- 実効コスト確定
    IF v_incoming_price IS NOT NULL THEN
      v_effective_cost := v_incoming_price;
    ELSE
      -- バッチも引数も未設定 → products.cost_price にフォールバック
      SELECT cost_price INTO v_effective_cost
      FROM products WHERE id = p_product_id;
      v_effective_cost := COALESCE(v_effective_cost, 0);
    END IF;

    -- 同一価格 → 最新ロットに加算 / 異なる or ロット未存在 → 新規ロット
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

  -- 5. stock_transactions に記録
  --    type='in' & cost_price IS NOT NULL の場合、DBトリガー(trg_check_price_alert) が
  --    price_history / price_alerts / products.cost_price を自動更新する
  INSERT INTO stock_transactions (product_id, type, quantity, cost_price, notes)
  VALUES (p_product_id, p_type, p_quantity, v_effective_cost, p_notes);

  -- 6. 出庫時: FIFO でロット在庫を減算（ループ内 UPDATE はすべて同一 DB トランザクション）
  IF p_type = 'out' AND p_quantity > 0 THEN
    v_remaining := p_quantity;
    FOR v_batch IN
      SELECT id, quantity_rem
      FROM inventory_batches
      WHERE product_id = p_product_id
        AND quantity_rem > 0
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

  RETURN v_new_quantity;
END;
$$;

GRANT EXECUTE ON FUNCTION process_stock_transaction(UUID, TEXT, NUMERIC, NUMERIC, TEXT)
  TO authenticated, service_role;


-- ---------------------------------------------------------------------------
-- 2. apply_inventory_session_adjustments
--    approveInventorySession() (inventory/actions.ts) の DB 版
--    パスワード検証は Server Action 側で完了済みの前提で呼び出す
--    - 差異品目に adjustment トランザクションを一括 INSERT
--    - stock を実測値で UPDATE
--    - セッションを approved に UPDATE
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION apply_inventory_session_adjustments(
  p_session_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item RECORD;
BEGIN
  -- 差異がある品目（実測 ≠ システム値）に対して在庫調整を実行
  FOR v_item IN
    SELECT product_id, system_quantity, actual_quantity
    FROM inventory_session_items
    WHERE session_id   = p_session_id
      AND actual_quantity IS NOT NULL
      AND actual_quantity != system_quantity
  LOOP
    -- 調整トランザクション: quantity = 差分（正/負両方あり）
    INSERT INTO stock_transactions (product_id, type, quantity, notes)
    VALUES (
      v_item.product_id,
      'adjustment',
      v_item.actual_quantity - v_item.system_quantity,
      '棚卸し差異調整'
    );

    -- 在庫を実測値で上書き
    UPDATE stock
    SET quantity = v_item.actual_quantity
    WHERE product_id = v_item.product_id;
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


-- ---------------------------------------------------------------------------
-- 3. receive_purchase_order
--    receiveOrder() (orders/actions.ts) の DB 版
--    - 発注書を received に更新
--    - 各品目に対して process_stock_transaction('in') を呼び出し
--      → 品目数 × (N往復) が 1 往復に集約
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION receive_purchase_order(
  p_order_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item RECORD;
BEGIN
  -- 発注書ステータスを受領済みに更新
  UPDATE purchase_orders
  SET status = 'received'
  WHERE id = p_order_id;

  -- 各品目を入庫処理（process_stock_transaction が FIFO/ロット管理を担当）
  FOR v_item IN
    SELECT product_id, quantity, unit_price
    FROM purchase_order_items
    WHERE purchase_order_id = p_order_id
  LOOP
    PERFORM process_stock_transaction(
      v_item.product_id,
      'in',
      v_item.quantity,
      v_item.unit_price,
      NULL
    );
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION receive_purchase_order(UUID)
  TO authenticated, service_role;


-- ---------------------------------------------------------------------------
-- 4. create_orders_from_cart
--    createOrdersFromCart() (orders/actions.ts) の DB 版
--    - cartItems (JSONB配列) を supplier_id でグループ化
--    - 業者ごとに purchase_orders を INSERT
--    - 対応する purchase_order_items を一括 INSERT
--    - 作成した発注書数を返す
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_orders_from_cart(
  p_cart_items JSONB  -- [{product_id, supplier_id, quantity, unit_price}, ...]
)
RETURNS INT           -- 作成した発注書数
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_supplier_id UUID;
  v_order_id    UUID;
  v_count       INT := 0;
BEGIN
  -- 業者ごとに発注書を作成
  FOR v_supplier_id IN
    SELECT DISTINCT (value->>'supplier_id')::UUID
    FROM jsonb_array_elements(p_cart_items)
  LOOP
    -- 発注書を作成
    INSERT INTO purchase_orders (supplier_id, status, order_date)
    VALUES (v_supplier_id, 'draft', CURRENT_DATE)
    RETURNING id INTO v_order_id;

    -- この業者の品目を一括 INSERT
    INSERT INTO purchase_order_items
      (purchase_order_id, product_id, quantity, unit_price)
    SELECT
      v_order_id,
      (item->>'product_id')::UUID,
      (item->>'quantity')::NUMERIC,
      (item->>'unit_price')::NUMERIC   -- JSON null → SQL NULL に自動変換
    FROM jsonb_array_elements(p_cart_items) AS item
    WHERE (item->>'supplier_id')::UUID = v_supplier_id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION create_orders_from_cart(JSONB)
  TO authenticated, service_role;
