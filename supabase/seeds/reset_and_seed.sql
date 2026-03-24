-- =============================================================================
-- graff.bms リセット＆モックデータ投入
-- Supabase SQL Editor にそのまま貼り付けて実行
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 既存データを全削除（CASCADE で依存テーブルも連鎖削除）
-- ---------------------------------------------------------------------------
TRUNCATE TABLE
  purchase_order_items,
  purchase_orders,
  inventory_batches,
  stock_transactions,
  price_alerts,
  price_history,
  cocktail_ingredients,
  cocktails,
  stock,
  products,
  suppliers
RESTART IDENTITY CASCADE;

-- ---------------------------------------------------------------------------
-- カテゴリ ID を取得しやすいよう一時変数代わりに DO ブロックを使用
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  -- カテゴリ
  cat_spirits   uuid;
  cat_wine      uuid;
  cat_champagne uuid;
  cat_beer      uuid;
  cat_soft      uuid;
  cat_food      uuid;
  cat_other     uuid;

  -- 業者
  sup_yamada    uuid;
  sup_hokkaido  uuid;
  sup_premium   uuid;
  sup_global    uuid;
  sup_food      uuid;

  -- 商品 ID（stock 挿入用）
  pid uuid;

BEGIN
  -- カテゴリ取得
  SELECT id INTO cat_spirits   FROM categories WHERE name_en = 'Spirits';
  SELECT id INTO cat_wine      FROM categories WHERE name_en = 'Wine';
  SELECT id INTO cat_champagne FROM categories WHERE name_en = 'Champagne';
  SELECT id INTO cat_beer      FROM categories WHERE name_en = 'Beer';
  SELECT id INTO cat_soft      FROM categories WHERE name_en = 'Soft Drink';
  SELECT id INTO cat_food      FROM categories WHERE name_en = 'Food';
  SELECT id INTO cat_other     FROM categories WHERE name_en = 'Others';

  -- =========================================================================
  -- 業者 5 社
  -- =========================================================================
  INSERT INTO suppliers (id, name, name_en, contact_name, phone, address)
  VALUES
    (gen_random_uuid(), '山田酒販株式会社',     'Yamada Liquor',       '山田 太郎', '011-111-1111', '北海道札幌市中央区北1条西2丁目'),
    (gen_random_uuid(), '北海道ビバレッジ',      'Hokkaido Beverage',   '佐藤 花子', '011-222-2222', '北海道札幌市北区北24条西5丁目'),
    (gen_random_uuid(), 'プレミアムスピリッツ',  'Premium Spirits',     '鈴木 一郎', '03-3333-3333', '東京都港区六本木3丁目'),
    (gen_random_uuid(), 'グローバルワインズ',    'Global Wines',        '田中 美咲', '06-4444-4444', '大阪府大阪市北区梅田1丁目'),
    (gen_random_uuid(), 'フードサプライ株式会社','Food Supply Co.',     '高橋 健二', '011-555-5555', '北海道札幌市豊平区平岸2条');

  SELECT id INTO sup_yamada   FROM suppliers WHERE name = '山田酒販株式会社';
  SELECT id INTO sup_hokkaido FROM suppliers WHERE name = '北海道ビバレッジ';
  SELECT id INTO sup_premium  FROM suppliers WHERE name = 'プレミアムスピリッツ';
  SELECT id INTO sup_global   FROM suppliers WHERE name = 'グローバルワインズ';
  SELECT id INTO sup_food     FROM suppliers WHERE name = 'フードサプライ株式会社';

  -- =========================================================================
  -- スピリッツ 30 品
  -- =========================================================================
  -- ウイスキー
  INSERT INTO products (id, category_id, supplier_id, name, name_en, unit, cost_price, selling_price, is_available)
  VALUES
    (gen_random_uuid(), cat_spirits, sup_premium, 'グレンリベット 12年', 'The Glenlivet 12',   '本', 4200, 900,  true),
    (gen_random_uuid(), cat_spirits, sup_premium, 'グレンフィディック 12年', 'Glenfiddich 12', '本', 4500, 950,  true),
    (gen_random_uuid(), cat_spirits, sup_premium, 'マッカラン 12年',     'Macallan 12',        '本', 6800, 1200, true),
    (gen_random_uuid(), cat_spirits, sup_premium, 'ラガヴーリン 16年',   'Lagavulin 16',       '本', 8500, 1500, true),
    (gen_random_uuid(), cat_spirits, sup_premium, 'ボウモア 12年',       'Bowmore 12',         '本', 4800, 1000, true),
    (gen_random_uuid(), cat_spirits, sup_yamada,  'サントリー山崎',      'Yamazaki',           '本', 9800, 1800, true),
    (gen_random_uuid(), cat_spirits, sup_yamada,  'サントリー白州',      'Hakushu',            '本', 8500, 1600, true),
    (gen_random_uuid(), cat_spirits, sup_yamada,  'ニッカ フロム ザ バレル', 'Nikka From The Barrel', '本', 3200, 800, true),
    (gen_random_uuid(), cat_spirits, sup_yamada,  'ジャックダニエル',    'Jack Daniel''s',     '本', 2800, 700,  true),
    (gen_random_uuid(), cat_spirits, sup_yamada,  'ジムビーム',          'Jim Beam',           '本', 2200, 650,  true);

  -- ジン
  INSERT INTO products (id, category_id, supplier_id, name, name_en, unit, cost_price, selling_price, is_available)
  VALUES
    (gen_random_uuid(), cat_spirits, sup_premium, 'タンカレー',          'Tanqueray',          '本', 2600, 700,  true),
    (gen_random_uuid(), cat_spirits, sup_premium, 'ヘンドリックス',      'Hendrick''s',        '本', 3800, 900,  true),
    (gen_random_uuid(), cat_spirits, sup_premium, 'ボンベイサファイア',  'Bombay Sapphire',    '本', 2800, 750,  true),
    (gen_random_uuid(), cat_spirits, sup_hokkaido,'北の誉ジン',          'Kita no Hokmare Gin','本', 3200, 800,  true);

  -- ウォッカ
  INSERT INTO products (id, category_id, supplier_id, name, name_en, unit, cost_price, selling_price, is_available)
  VALUES
    (gen_random_uuid(), cat_spirits, sup_yamada,  'ストリチナヤ',        'Stolichnaya',        '本', 2200, 650,  true),
    (gen_random_uuid(), cat_spirits, sup_yamada,  'グレイグース',        'Grey Goose',         '本', 4200, 950,  true),
    (gen_random_uuid(), cat_spirits, sup_yamada,  'アブソルート',        'Absolut',            '本', 2000, 600,  true),
    (gen_random_uuid(), cat_spirits, sup_hokkaido,'ベルヴェデール',      'Belvedere',          '本', 3800, 900,  true);

  -- ラム
  INSERT INTO products (id, category_id, supplier_id, name, name_en, unit, cost_price, selling_price, is_available)
  VALUES
    (gen_random_uuid(), cat_spirits, sup_yamada,  'バカルディ スペリオール', 'Bacardi Superior','本', 2000, 600,  true),
    (gen_random_uuid(), cat_spirits, sup_yamada,  'ハバナクラブ 7年',    'Havana Club 7',      '本', 3200, 800,  true),
    (gen_random_uuid(), cat_spirits, sup_premium, 'マイヤーズラム',      'Myers''s Rum',       '本', 2400, 650,  true);

  -- テキーラ
  INSERT INTO products (id, category_id, supplier_id, name, name_en, unit, cost_price, selling_price, is_available)
  VALUES
    (gen_random_uuid(), cat_spirits, sup_global,  'ホセクエルボ シルバー','Jose Cuervo Silver', '本', 2400, 700,  true),
    (gen_random_uuid(), cat_spirits, sup_global,  'パトロン シルバー',   'Patron Silver',      '本', 5500, 1100, true),
    (gen_random_uuid(), cat_spirits, sup_global,  '1800 レポサド',       '1800 Reposado',      '本', 3600, 850,  true);

  -- ブランデー・リキュール
  INSERT INTO products (id, category_id, supplier_id, name, name_en, unit, cost_price, selling_price, is_available)
  VALUES
    (gen_random_uuid(), cat_spirits, sup_global,  'ヘネシー V.S',        'Hennessy V.S',       '本', 4500, 1000, true),
    (gen_random_uuid(), cat_spirits, sup_global,  'レミーマルタン VSOP', 'Remy Martin VSOP',   '本', 5800, 1200, true),
    (gen_random_uuid(), cat_spirits, sup_yamada,  'カンパリ',            'Campari',            '本', 2200, 650,  true),
    (gen_random_uuid(), cat_spirits, sup_yamada,  'コアントロー',        'Cointreau',          '本', 2800, 750,  true),
    (gen_random_uuid(), cat_spirits, sup_yamada,  'ベイリーズ',          'Baileys',            '本', 2600, 700,  true),
    (gen_random_uuid(), cat_spirits, sup_yamada,  'カルーア',            'Kahlúa',             '本', 2200, 650,  true),
    (gen_random_uuid(), cat_spirits, sup_hokkaido,'アペロール',          'Aperol',             '本', 2400, 700,  true);

  -- =========================================================================
  -- ワイン 20 品
  -- =========================================================================
  INSERT INTO products (id, category_id, supplier_id, name, name_en, unit, cost_price, selling_price, is_available)
  VALUES
    -- 赤ワイン
    (gen_random_uuid(), cat_wine, sup_global, 'カッシェロ デル ディアブロ カベルネ', 'Casillero del Diablo Cabernet', '本', 1800, 5500, true),
    (gen_random_uuid(), cat_wine, sup_global, 'モンテス アルファ メルロ',  'Montes Alpha Merlot',           '本', 2400, 7000, true),
    (gen_random_uuid(), cat_wine, sup_global, 'バロン フィリップ ロートシルト', 'Baron Philippe Rothschild',  '本', 3200, 9500, true),
    (gen_random_uuid(), cat_wine, sup_global, 'コノスル ピノノワール',    'Cono Sur Pinot Noir',           '本', 1500, 4800, true),
    (gen_random_uuid(), cat_wine, sup_global, 'ダリオ プリンチッチ',      'Dario Princic Rosso',           '本', 4200, 12000,true),
    (gen_random_uuid(), cat_wine, sup_yamada,  'サントネージュ 紫波',     'Sainte Neige Shiwa',            '本', 2800, 8000, true),
    (gen_random_uuid(), cat_wine, sup_yamada,  'マンズワイン 甲州',       'Manns Wine Koshu',              '本', 1800, 5500, true),
    -- 白ワイン
    (gen_random_uuid(), cat_wine, sup_global, 'クラウディベイ ソーヴィニヨンブラン', 'Cloudy Bay SB',         '本', 2800, 8500, true),
    (gen_random_uuid(), cat_wine, sup_global, 'サンタリタ 120 シャルドネ','Santa Rita 120 Chardonnay',     '本', 1400, 4500, true),
    (gen_random_uuid(), cat_wine, sup_global, 'ドメーヌ ラファージュ',    'Domaine Lafage Blanc',          '本', 2200, 6500, true),
    (gen_random_uuid(), cat_wine, sup_global, 'ウルフブラス リースリング','Wolf Blass Riesling',           '本', 1600, 5000, true),
    (gen_random_uuid(), cat_wine, sup_yamada,  'グレイス ケルナー',       'Grace Kerner',                  '本', 2400, 7000, true),
    -- ロゼ
    (gen_random_uuid(), cat_wine, sup_global, 'ミラヴァル ロゼ',         'Miraval Rosé',                  '本', 3200, 9800, true),
    (gen_random_uuid(), cat_wine, sup_global, 'ドメーヌ オット ロゼ',    'Domaine Ott Rosé',              '本', 4800, 14000,true),
    (gen_random_uuid(), cat_wine, sup_hokkaido,'岩の原ワイン ロゼ',      'Iwanohara Rosé',                '本', 2000, 6000, true),
    -- グラスワイン用（デキャンタ）
    (gen_random_uuid(), cat_wine, sup_yamada,  'ハウスワイン 赤',         'House Red',                     'デキャンタ', 900, 2800, true),
    (gen_random_uuid(), cat_wine, sup_yamada,  'ハウスワイン 白',         'House White',                   'デキャンタ', 900, 2800, true),
    (gen_random_uuid(), cat_wine, sup_yamada,  'ハウスワイン ロゼ',       'House Rosé',                    'デキャンタ', 900, 2800, true),
    (gen_random_uuid(), cat_wine, sup_global,  'オーガニック 赤',         'Organic Red',                   '本', 2200, 6800, true),
    (gen_random_uuid(), cat_wine, sup_global,  'オーガニック 白',         'Organic White',                 '本', 2000, 6200, true);

  -- =========================================================================
  -- シャンパン・スパークリング 8 品
  -- =========================================================================
  INSERT INTO products (id, category_id, supplier_id, name, name_en, unit, cost_price, selling_price, is_available)
  VALUES
    (gen_random_uuid(), cat_champagne, sup_global, 'モエ アンペリアル',        'Moët Impérial',       '本', 6800, 18000, true),
    (gen_random_uuid(), cat_champagne, sup_global, 'ヴーヴ クリコ イエロー',   'Veuve Clicquot Yellow','本', 7500, 20000, true),
    (gen_random_uuid(), cat_champagne, sup_global, 'ニコラ フィアット ブリュット','Nicolas Feuillatte', '本', 5200, 14000, true),
    (gen_random_uuid(), cat_champagne, sup_global, 'ポメリー ブリュット',       'Pommery Brut',        '本', 5800, 16000, true),
    (gen_random_uuid(), cat_champagne, sup_global, 'プロセッコ サンタ マルゲリータ','Santa Margherita Prosecco','本', 2800, 8000, true),
    (gen_random_uuid(), cat_champagne, sup_yamada,  'スパークリング ハーフ',   'Sparkling Half',      'ハーフ', 1800, 5500, true),
    (gen_random_uuid(), cat_champagne, sup_hokkaido,'カバ フレシネット',       'Freixenet Cava',      '本', 1600, 5000, true),
    (gen_random_uuid(), cat_champagne, sup_hokkaido,'アスティ スプマンテ',     'Asti Spumante',       '本', 1800, 5500, true);

  -- =========================================================================
  -- ビール 12 品
  -- =========================================================================
  INSERT INTO products (id, category_id, supplier_id, name, name_en, unit, cost_price, selling_price, is_available)
  VALUES
    (gen_random_uuid(), cat_beer, sup_hokkaido, 'サッポロ クラシック',    'Sapporo Classic',     '缶', 220, 600,  true),
    (gen_random_uuid(), cat_beer, sup_hokkaido, 'サッポロ 黒ラベル',      'Sapporo Black Label', '缶', 200, 550,  true),
    (gen_random_uuid(), cat_beer, sup_hokkaido, 'エビス プレミアム',      'Yebisu Premium',      '缶', 240, 650,  true),
    (gen_random_uuid(), cat_beer, sup_hokkaido, 'キリン一番搾り',         'Kirin Ichiban',       '缶', 200, 550,  true),
    (gen_random_uuid(), cat_beer, sup_hokkaido, 'アサヒスーパードライ',   'Asahi Super Dry',     '缶', 200, 550,  true),
    (gen_random_uuid(), cat_beer, sup_hokkaido, 'ハイネケン',             'Heineken',            '缶', 280, 700,  true),
    (gen_random_uuid(), cat_beer, sup_hokkaido, 'コロナ エキストラ',      'Corona Extra',        '本', 300, 750,  true),
    (gen_random_uuid(), cat_beer, sup_hokkaido, 'ギネス ドラフト',        'Guinness Draught',    '缶', 380, 900,  true),
    (gen_random_uuid(), cat_beer, sup_hokkaido, 'よなよなエール',         'Yona Yona Ale',       '缶', 350, 850,  true),
    (gen_random_uuid(), cat_beer, sup_hokkaido, 'インドの青鬼 IPA',       'Oni IPA',             '缶', 380, 900,  true),
    (gen_random_uuid(), cat_beer, sup_hokkaido, 'コエドビール 瑠璃',      'Coedo Ruri',          '本', 320, 800,  true),
    (gen_random_uuid(), cat_beer, sup_hokkaido, 'ノンアルコールビール',   'Non-Alcoholic Beer',  '缶', 160, 450,  true);

  -- =========================================================================
  -- ソフトドリンク・ミキサー 15 品
  -- =========================================================================
  INSERT INTO products (id, category_id, supplier_id, name, name_en, unit, cost_price, selling_price, is_available)
  VALUES
    (gen_random_uuid(), cat_soft, sup_hokkaido, 'コーラ',                 'Cola',                '本', 80,  350,  true),
    (gen_random_uuid(), cat_soft, sup_hokkaido, 'ジンジャーエール',       'Ginger Ale',          '本', 80,  350,  true),
    (gen_random_uuid(), cat_soft, sup_hokkaido, 'トニックウォーター',     'Tonic Water',         '本', 90,  350,  true),
    (gen_random_uuid(), cat_soft, sup_hokkaido, 'ソーダ水',               'Soda Water',          '本', 60,  300,  true),
    (gen_random_uuid(), cat_soft, sup_hokkaido, 'オレンジジュース',       'Orange Juice',        '本', 120, 400,  true),
    (gen_random_uuid(), cat_soft, sup_hokkaido, 'グレープフルーツジュース','Grapefruit Juice',   '本', 120, 400,  true),
    (gen_random_uuid(), cat_soft, sup_hokkaido, 'クランベリージュース',   'Cranberry Juice',     '本', 130, 400,  true),
    (gen_random_uuid(), cat_soft, sup_hokkaido, 'パイナップルジュース',   'Pineapple Juice',     '本', 120, 400,  true),
    (gen_random_uuid(), cat_soft, sup_hokkaido, 'ライムジュース',         'Lime Juice',          '本', 150, 400,  true),
    (gen_random_uuid(), cat_soft, sup_hokkaido, 'レモンサワーの素',       'Lemon Sour Base',     '本', 480, 700,  true),
    (gen_random_uuid(), cat_soft, sup_hokkaido, 'グレナデンシロップ',     'Grenadine Syrup',     '本', 350, 0,    true),
    (gen_random_uuid(), cat_soft, sup_hokkaido, 'シュガーシロップ',       'Sugar Syrup',         '本', 200, 0,    true),
    (gen_random_uuid(), cat_soft, sup_hokkaido, 'ミネラルウォーター',     'Mineral Water',       '本', 60,  300,  true),
    (gen_random_uuid(), cat_soft, sup_hokkaido, 'ウーロン茶',             'Oolong Tea',          '本', 80,  350,  true),
    (gen_random_uuid(), cat_soft, sup_hokkaido, 'コーヒー（豆）',         'Coffee Beans',        'kg', 2800, 0,   true);

  -- =========================================================================
  -- フード 10 品
  -- =========================================================================
  INSERT INTO products (id, category_id, supplier_id, name, name_en, unit, cost_price, selling_price, is_available)
  VALUES
    (gen_random_uuid(), cat_food, sup_food, 'ミックスナッツ',            'Mixed Nuts',          '袋', 280, 600,  true),
    (gen_random_uuid(), cat_food, sup_food, 'オリーブ',                  'Olives',              '瓶', 450, 800,  true),
    (gen_random_uuid(), cat_food, sup_food, 'チーズ盛り合わせ',          'Cheese Plate',        '皿', 650, 1400, true),
    (gen_random_uuid(), cat_food, sup_food, 'サーモンマリネ',            'Salmon Mariné',       '皿', 700, 1600, true),
    (gen_random_uuid(), cat_food, sup_food, 'ブルスケッタ',              'Bruschetta',          '皿', 480, 1100, true),
    (gen_random_uuid(), cat_food, sup_food, 'ポテトフライ',              'French Fries',        '皿', 280, 700,  true),
    (gen_random_uuid(), cat_food, sup_food, 'ガーリックトースト',        'Garlic Toast',        '皿', 200, 500,  true),
    (gen_random_uuid(), cat_food, sup_food, 'クラッカー',                'Crackers',            '袋', 180, 400,  true),
    (gen_random_uuid(), cat_food, sup_food, 'チョコレート',              'Chocolate',           '箱', 350, 700,  true),
    (gen_random_uuid(), cat_food, sup_food, 'ドライフルーツ',            'Dried Fruits',        '袋', 280, 600,  true);

  -- =========================================================================
  -- その他 5 品
  -- =========================================================================
  INSERT INTO products (id, category_id, supplier_id, name, name_en, unit, cost_price, selling_price, is_available)
  VALUES
    (gen_random_uuid(), cat_other, sup_food,     'ガーニッシュ用レモン',  'Lemon',               '個', 30,  0,    true),
    (gen_random_uuid(), cat_other, sup_food,     'ガーニッシュ用ライム',  'Lime',                '個', 35,  0,    true),
    (gen_random_uuid(), cat_other, sup_food,     'カクテル用チェリー',    'Cocktail Cherry',     '瓶', 600, 0,    true),
    (gen_random_uuid(), cat_other, sup_hokkaido, 'マドラー',              'Stirrer',             '本', 5,   0,    true),
    (gen_random_uuid(), cat_other, sup_hokkaido, 'コースター',            'Coaster',             '枚', 8,   0,    true);

  -- =========================================================================
  -- stock テーブルに初期在庫を挿入（全商品）
  -- =========================================================================
  INSERT INTO stock (product_id, quantity, min_quantity)
  SELECT
    p.id,
    CASE
      WHEN c.name_en = 'Spirits'    THEN (random() * 8 + 2)::int
      WHEN c.name_en = 'Wine'       THEN (random() * 12 + 3)::int
      WHEN c.name_en = 'Champagne'  THEN (random() * 6 + 1)::int
      WHEN c.name_en = 'Beer'       THEN (random() * 24 + 6)::int
      WHEN c.name_en = 'Soft Drink' THEN (random() * 20 + 5)::int
      WHEN c.name_en = 'Food'       THEN (random() * 10 + 2)::int
      ELSE (random() * 15 + 2)::int
    END,
    CASE
      WHEN c.name_en = 'Spirits'    THEN 3
      WHEN c.name_en = 'Wine'       THEN 4
      WHEN c.name_en = 'Champagne'  THEN 2
      WHEN c.name_en = 'Beer'       THEN 12
      WHEN c.name_en = 'Soft Drink' THEN 6
      WHEN c.name_en = 'Food'       THEN 3
      ELSE 2
    END
  FROM products p
  JOIN categories c ON c.id = p.category_id;

END $$;

-- 確認
SELECT
  c.name AS カテゴリ,
  COUNT(p.id) AS 商品数
FROM products p
JOIN categories c ON c.id = p.category_id
GROUP BY c.name, c.sort_order
ORDER BY c.sort_order;

SELECT COUNT(*) AS 在庫レコード数 FROM stock;
SELECT COUNT(*) AS 業者数 FROM suppliers;
