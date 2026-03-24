-- =============================================================================
-- graff.bms リセット＆モックデータ投入
-- Supabase SQL Editor にそのまま貼り付けて実行
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 既存データを全削除
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
-- 業者 5 社（固定 UUID）
-- ---------------------------------------------------------------------------
INSERT INTO suppliers (id, name, name_en, contact_name, phone, address) VALUES
  ('aaaaaaaa-0001-0000-0000-000000000000', '山田酒販株式会社',      'Yamada Liquor',      '山田 太郎', '011-111-1111', '北海道札幌市中央区北1条西2丁目'),
  ('aaaaaaaa-0002-0000-0000-000000000000', '北海道ビバレッジ',       'Hokkaido Beverage',  '佐藤 花子', '011-222-2222', '北海道札幌市北区北24条西5丁目'),
  ('aaaaaaaa-0003-0000-0000-000000000000', 'プレミアムスピリッツ',   'Premium Spirits',    '鈴木 一郎', '03-3333-3333', '東京都港区六本木3丁目'),
  ('aaaaaaaa-0004-0000-0000-000000000000', 'グローバルワインズ',     'Global Wines',       '田中 美咲', '06-4444-4444', '大阪府大阪市北区梅田1丁目'),
  ('aaaaaaaa-0005-0000-0000-000000000000', 'フードサプライ株式会社', 'Food Supply Co.',    '高橋 健二', '011-555-5555', '北海道札幌市豊平区平岸2条');

-- ---------------------------------------------------------------------------
-- 商品（カテゴリ ID はサブクエリで取得）
-- ---------------------------------------------------------------------------

-- スピリッツ 30 品
INSERT INTO products (id, category_id, supplier_id, name, name_en, unit, cost_price, selling_price, is_available) VALUES
  ('bbbbbbbb-0001-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Spirits'), 'aaaaaaaa-0003-0000-0000-000000000000', 'グレンリベット 12年',       'The Glenlivet 12',          '本', 4200, 900,  true),
  ('bbbbbbbb-0002-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Spirits'), 'aaaaaaaa-0003-0000-0000-000000000000', 'グレンフィディック 12年',   'Glenfiddich 12',            '本', 4500, 950,  true),
  ('bbbbbbbb-0003-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Spirits'), 'aaaaaaaa-0003-0000-0000-000000000000', 'マッカラン 12年',           'Macallan 12',               '本', 6800, 1200, true),
  ('bbbbbbbb-0004-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Spirits'), 'aaaaaaaa-0003-0000-0000-000000000000', 'ラガヴーリン 16年',         'Lagavulin 16',              '本', 8500, 1500, true),
  ('bbbbbbbb-0005-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Spirits'), 'aaaaaaaa-0003-0000-0000-000000000000', 'ボウモア 12年',             'Bowmore 12',                '本', 4800, 1000, true),
  ('bbbbbbbb-0006-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Spirits'), 'aaaaaaaa-0001-0000-0000-000000000000', 'サントリー山崎',            'Yamazaki',                  '本', 9800, 1800, true),
  ('bbbbbbbb-0007-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Spirits'), 'aaaaaaaa-0001-0000-0000-000000000000', 'サントリー白州',            'Hakushu',                   '本', 8500, 1600, true),
  ('bbbbbbbb-0008-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Spirits'), 'aaaaaaaa-0001-0000-0000-000000000000', 'ニッカ フロム ザ バレル',   'Nikka From The Barrel',     '本', 3200, 800,  true),
  ('bbbbbbbb-0009-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Spirits'), 'aaaaaaaa-0001-0000-0000-000000000000', 'ジャックダニエル',          'Jack Daniel''s',            '本', 2800, 700,  true),
  ('bbbbbbbb-0010-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Spirits'), 'aaaaaaaa-0001-0000-0000-000000000000', 'ジムビーム',               'Jim Beam',                  '本', 2200, 650,  true),
  ('bbbbbbbb-0011-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Spirits'), 'aaaaaaaa-0003-0000-0000-000000000000', 'タンカレー',               'Tanqueray',                 '本', 2600, 700,  true),
  ('bbbbbbbb-0012-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Spirits'), 'aaaaaaaa-0003-0000-0000-000000000000', 'ヘンドリックス',           'Hendrick''s',               '本', 3800, 900,  true),
  ('bbbbbbbb-0013-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Spirits'), 'aaaaaaaa-0003-0000-0000-000000000000', 'ボンベイサファイア',        'Bombay Sapphire',           '本', 2800, 750,  true),
  ('bbbbbbbb-0014-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Spirits'), 'aaaaaaaa-0002-0000-0000-000000000000', '北の誉ジン',               'Kita Gin',                  '本', 3200, 800,  true),
  ('bbbbbbbb-0015-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Spirits'), 'aaaaaaaa-0001-0000-0000-000000000000', 'ストリチナヤ',             'Stolichnaya',               '本', 2200, 650,  true),
  ('bbbbbbbb-0016-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Spirits'), 'aaaaaaaa-0001-0000-0000-000000000000', 'グレイグース',             'Grey Goose',                '本', 4200, 950,  true),
  ('bbbbbbbb-0017-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Spirits'), 'aaaaaaaa-0001-0000-0000-000000000000', 'アブソルート',             'Absolut',                   '本', 2000, 600,  true),
  ('bbbbbbbb-0018-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Spirits'), 'aaaaaaaa-0002-0000-0000-000000000000', 'ベルヴェデール',           'Belvedere',                 '本', 3800, 900,  true),
  ('bbbbbbbb-0019-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Spirits'), 'aaaaaaaa-0001-0000-0000-000000000000', 'バカルディ スペリオール',   'Bacardi Superior',          '本', 2000, 600,  true),
  ('bbbbbbbb-0020-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Spirits'), 'aaaaaaaa-0001-0000-0000-000000000000', 'ハバナクラブ 7年',          'Havana Club 7',             '本', 3200, 800,  true),
  ('bbbbbbbb-0021-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Spirits'), 'aaaaaaaa-0003-0000-0000-000000000000', 'マイヤーズラム',           'Myers''s Rum',              '本', 2400, 650,  true),
  ('bbbbbbbb-0022-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Spirits'), 'aaaaaaaa-0004-0000-0000-000000000000', 'ホセクエルボ シルバー',     'Jose Cuervo Silver',        '本', 2400, 700,  true),
  ('bbbbbbbb-0023-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Spirits'), 'aaaaaaaa-0004-0000-0000-000000000000', 'パトロン シルバー',         'Patron Silver',             '本', 5500, 1100, true),
  ('bbbbbbbb-0024-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Spirits'), 'aaaaaaaa-0004-0000-0000-000000000000', '1800 レポサド',            '1800 Reposado',             '本', 3600, 850,  true),
  ('bbbbbbbb-0025-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Spirits'), 'aaaaaaaa-0004-0000-0000-000000000000', 'ヘネシー V.S',             'Hennessy V.S',              '本', 4500, 1000, true),
  ('bbbbbbbb-0026-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Spirits'), 'aaaaaaaa-0004-0000-0000-000000000000', 'レミーマルタン VSOP',      'Remy Martin VSOP',          '本', 5800, 1200, true),
  ('bbbbbbbb-0027-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Spirits'), 'aaaaaaaa-0001-0000-0000-000000000000', 'カンパリ',                 'Campari',                   '本', 2200, 650,  true),
  ('bbbbbbbb-0028-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Spirits'), 'aaaaaaaa-0001-0000-0000-000000000000', 'コアントロー',             'Cointreau',                 '本', 2800, 750,  true),
  ('bbbbbbbb-0029-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Spirits'), 'aaaaaaaa-0001-0000-0000-000000000000', 'ベイリーズ',               'Baileys',                   '本', 2600, 700,  true),
  ('bbbbbbbb-0030-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Spirits'), 'aaaaaaaa-0001-0000-0000-000000000000', 'カルーア',                 'Kahlua',                    '本', 2200, 650,  true);

-- ワイン 20 品
INSERT INTO products (id, category_id, supplier_id, name, name_en, unit, cost_price, selling_price, is_available) VALUES
  ('bbbbbbbb-0031-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Wine'), 'aaaaaaaa-0004-0000-0000-000000000000', 'カッシェロ デル ディアブロ カベルネ', 'Casillero Cabernet',  '本', 1800, 5500,  true),
  ('bbbbbbbb-0032-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Wine'), 'aaaaaaaa-0004-0000-0000-000000000000', 'モンテス アルファ メルロ',  'Montes Alpha Merlot',       '本', 2400, 7000,  true),
  ('bbbbbbbb-0033-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Wine'), 'aaaaaaaa-0004-0000-0000-000000000000', 'バロン フィリップ',         'Baron Philippe',            '本', 3200, 9500,  true),
  ('bbbbbbbb-0034-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Wine'), 'aaaaaaaa-0004-0000-0000-000000000000', 'コノスル ピノノワール',     'Cono Sur Pinot Noir',       '本', 1500, 4800,  true),
  ('bbbbbbbb-0035-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Wine'), 'aaaaaaaa-0004-0000-0000-000000000000', 'ダリオ プリンチッチ',       'Dario Princic Rosso',       '本', 4200, 12000, true),
  ('bbbbbbbb-0036-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Wine'), 'aaaaaaaa-0001-0000-0000-000000000000', 'サントネージュ 紫波',       'Sainte Neige Shiwa',        '本', 2800, 8000,  true),
  ('bbbbbbbb-0037-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Wine'), 'aaaaaaaa-0001-0000-0000-000000000000', 'マンズワイン 甲州',         'Manns Wine Koshu',          '本', 1800, 5500,  true),
  ('bbbbbbbb-0038-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Wine'), 'aaaaaaaa-0004-0000-0000-000000000000', 'クラウディベイ ソーヴィニヨン', 'Cloudy Bay SB',          '本', 2800, 8500,  true),
  ('bbbbbbbb-0039-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Wine'), 'aaaaaaaa-0004-0000-0000-000000000000', 'サンタリタ シャルドネ',     'Santa Rita Chardonnay',     '本', 1400, 4500,  true),
  ('bbbbbbbb-0040-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Wine'), 'aaaaaaaa-0004-0000-0000-000000000000', 'ドメーヌ ラファージュ',     'Domaine Lafage Blanc',      '本', 2200, 6500,  true),
  ('bbbbbbbb-0041-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Wine'), 'aaaaaaaa-0004-0000-0000-000000000000', 'ウルフブラス リースリング', 'Wolf Blass Riesling',       '本', 1600, 5000,  true),
  ('bbbbbbbb-0042-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Wine'), 'aaaaaaaa-0001-0000-0000-000000000000', 'グレイス ケルナー',         'Grace Kerner',              '本', 2400, 7000,  true),
  ('bbbbbbbb-0043-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Wine'), 'aaaaaaaa-0004-0000-0000-000000000000', 'ミラヴァル ロゼ',           'Miraval Rose',              '本', 3200, 9800,  true),
  ('bbbbbbbb-0044-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Wine'), 'aaaaaaaa-0004-0000-0000-000000000000', 'ドメーヌ オット ロゼ',      'Domaine Ott Rose',          '本', 4800, 14000, true),
  ('bbbbbbbb-0045-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Wine'), 'aaaaaaaa-0002-0000-0000-000000000000', '岩の原ワイン ロゼ',         'Iwanohara Rose',            '本', 2000, 6000,  true),
  ('bbbbbbbb-0046-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Wine'), 'aaaaaaaa-0001-0000-0000-000000000000', 'ハウスワイン 赤',           'House Red',                 'デキャンタ', 900, 2800, true),
  ('bbbbbbbb-0047-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Wine'), 'aaaaaaaa-0001-0000-0000-000000000000', 'ハウスワイン 白',           'House White',               'デキャンタ', 900, 2800, true),
  ('bbbbbbbb-0048-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Wine'), 'aaaaaaaa-0001-0000-0000-000000000000', 'ハウスワイン ロゼ',         'House Rose',                'デキャンタ', 900, 2800, true),
  ('bbbbbbbb-0049-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Wine'), 'aaaaaaaa-0004-0000-0000-000000000000', 'オーガニック 赤',           'Organic Red',               '本', 2200, 6800,  true),
  ('bbbbbbbb-0050-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Wine'), 'aaaaaaaa-0004-0000-0000-000000000000', 'オーガニック 白',           'Organic White',             '本', 2000, 6200,  true);

-- シャンパン 8 品
INSERT INTO products (id, category_id, supplier_id, name, name_en, unit, cost_price, selling_price, is_available) VALUES
  ('bbbbbbbb-0051-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Champagne'), 'aaaaaaaa-0004-0000-0000-000000000000', 'モエ アンペリアル',         'Moet Imperial',             '本', 6800, 18000, true),
  ('bbbbbbbb-0052-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Champagne'), 'aaaaaaaa-0004-0000-0000-000000000000', 'ヴーヴ クリコ イエロー',    'Veuve Clicquot Yellow',     '本', 7500, 20000, true),
  ('bbbbbbbb-0053-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Champagne'), 'aaaaaaaa-0004-0000-0000-000000000000', 'ニコラ フィアット',         'Nicolas Feuillatte',        '本', 5200, 14000, true),
  ('bbbbbbbb-0054-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Champagne'), 'aaaaaaaa-0004-0000-0000-000000000000', 'ポメリー ブリュット',       'Pommery Brut',              '本', 5800, 16000, true),
  ('bbbbbbbb-0055-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Champagne'), 'aaaaaaaa-0004-0000-0000-000000000000', 'プロセッコ サンタ マルゲリータ', 'Santa Margherita Prosecco','本', 2800, 8000, true),
  ('bbbbbbbb-0056-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Champagne'), 'aaaaaaaa-0001-0000-0000-000000000000', 'スパークリング ハーフ',     'Sparkling Half',            'ハーフ', 1800, 5500, true),
  ('bbbbbbbb-0057-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Champagne'), 'aaaaaaaa-0002-0000-0000-000000000000', 'カバ フレシネット',         'Freixenet Cava',            '本', 1600, 5000, true),
  ('bbbbbbbb-0058-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Champagne'), 'aaaaaaaa-0002-0000-0000-000000000000', 'アスティ スプマンテ',       'Asti Spumante',             '本', 1800, 5500, true);

-- ビール 12 品
INSERT INTO products (id, category_id, supplier_id, name, name_en, unit, cost_price, selling_price, is_available) VALUES
  ('bbbbbbbb-0059-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Beer'), 'aaaaaaaa-0002-0000-0000-000000000000', 'サッポロ クラシック',       'Sapporo Classic',           '缶', 220, 600, true),
  ('bbbbbbbb-0060-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Beer'), 'aaaaaaaa-0002-0000-0000-000000000000', 'サッポロ 黒ラベル',         'Sapporo Black Label',       '缶', 200, 550, true),
  ('bbbbbbbb-0061-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Beer'), 'aaaaaaaa-0002-0000-0000-000000000000', 'エビス プレミアム',         'Yebisu Premium',            '缶', 240, 650, true),
  ('bbbbbbbb-0062-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Beer'), 'aaaaaaaa-0002-0000-0000-000000000000', 'キリン一番搾り',            'Kirin Ichiban',             '缶', 200, 550, true),
  ('bbbbbbbb-0063-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Beer'), 'aaaaaaaa-0002-0000-0000-000000000000', 'アサヒスーパードライ',      'Asahi Super Dry',           '缶', 200, 550, true),
  ('bbbbbbbb-0064-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Beer'), 'aaaaaaaa-0002-0000-0000-000000000000', 'ハイネケン',               'Heineken',                  '缶', 280, 700, true),
  ('bbbbbbbb-0065-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Beer'), 'aaaaaaaa-0002-0000-0000-000000000000', 'コロナ エキストラ',         'Corona Extra',              '本', 300, 750, true),
  ('bbbbbbbb-0066-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Beer'), 'aaaaaaaa-0002-0000-0000-000000000000', 'ギネス ドラフト',           'Guinness Draught',          '缶', 380, 900, true),
  ('bbbbbbbb-0067-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Beer'), 'aaaaaaaa-0002-0000-0000-000000000000', 'よなよなエール',            'Yona Yona Ale',             '缶', 350, 850, true),
  ('bbbbbbbb-0068-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Beer'), 'aaaaaaaa-0002-0000-0000-000000000000', 'インドの青鬼 IPA',          'Oni IPA',                   '缶', 380, 900, true),
  ('bbbbbbbb-0069-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Beer'), 'aaaaaaaa-0002-0000-0000-000000000000', 'コエドビール 瑠璃',         'Coedo Ruri',                '本', 320, 800, true),
  ('bbbbbbbb-0070-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Beer'), 'aaaaaaaa-0002-0000-0000-000000000000', 'ノンアルコールビール',      'Non-Alcoholic Beer',        '缶', 160, 450, true);

-- ソフトドリンク 15 品
INSERT INTO products (id, category_id, supplier_id, name, name_en, unit, cost_price, selling_price, is_available) VALUES
  ('bbbbbbbb-0071-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Soft Drink'), 'aaaaaaaa-0002-0000-0000-000000000000', 'コーラ',                'Cola',             '本', 80,  350, true),
  ('bbbbbbbb-0072-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Soft Drink'), 'aaaaaaaa-0002-0000-0000-000000000000', 'ジンジャーエール',      'Ginger Ale',       '本', 80,  350, true),
  ('bbbbbbbb-0073-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Soft Drink'), 'aaaaaaaa-0002-0000-0000-000000000000', 'トニックウォーター',    'Tonic Water',      '本', 90,  350, true),
  ('bbbbbbbb-0074-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Soft Drink'), 'aaaaaaaa-0002-0000-0000-000000000000', 'ソーダ水',              'Soda Water',       '本', 60,  300, true),
  ('bbbbbbbb-0075-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Soft Drink'), 'aaaaaaaa-0002-0000-0000-000000000000', 'オレンジジュース',      'Orange Juice',     '本', 120, 400, true),
  ('bbbbbbbb-0076-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Soft Drink'), 'aaaaaaaa-0002-0000-0000-000000000000', 'グレープフルーツジュース','Grapefruit Juice','本', 120, 400, true),
  ('bbbbbbbb-0077-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Soft Drink'), 'aaaaaaaa-0002-0000-0000-000000000000', 'クランベリージュース',  'Cranberry Juice',  '本', 130, 400, true),
  ('bbbbbbbb-0078-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Soft Drink'), 'aaaaaaaa-0002-0000-0000-000000000000', 'パイナップルジュース',  'Pineapple Juice',  '本', 120, 400, true),
  ('bbbbbbbb-0079-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Soft Drink'), 'aaaaaaaa-0002-0000-0000-000000000000', 'ライムジュース',        'Lime Juice',       '本', 150, 400, true),
  ('bbbbbbbb-0080-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Soft Drink'), 'aaaaaaaa-0002-0000-0000-000000000000', 'レモンサワーの素',      'Lemon Sour Base',  '本', 480, 700, true),
  ('bbbbbbbb-0081-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Soft Drink'), 'aaaaaaaa-0002-0000-0000-000000000000', 'グレナデンシロップ',    'Grenadine Syrup',  '本', 350, 0,   true),
  ('bbbbbbbb-0082-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Soft Drink'), 'aaaaaaaa-0002-0000-0000-000000000000', 'シュガーシロップ',      'Sugar Syrup',      '本', 200, 0,   true),
  ('bbbbbbbb-0083-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Soft Drink'), 'aaaaaaaa-0002-0000-0000-000000000000', 'ミネラルウォーター',    'Mineral Water',    '本', 60,  300, true),
  ('bbbbbbbb-0084-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Soft Drink'), 'aaaaaaaa-0002-0000-0000-000000000000', 'ウーロン茶',            'Oolong Tea',       '本', 80,  350, true),
  ('bbbbbbbb-0085-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Soft Drink'), 'aaaaaaaa-0002-0000-0000-000000000000', 'コーヒー豆',            'Coffee Beans',     'kg', 2800, 0,  true);

-- フード 10 品
INSERT INTO products (id, category_id, supplier_id, name, name_en, unit, cost_price, selling_price, is_available) VALUES
  ('bbbbbbbb-0086-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Food'), 'aaaaaaaa-0005-0000-0000-000000000000', 'ミックスナッツ',        'Mixed Nuts',       '袋', 280, 600,  true),
  ('bbbbbbbb-0087-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Food'), 'aaaaaaaa-0005-0000-0000-000000000000', 'オリーブ',              'Olives',           '瓶', 450, 800,  true),
  ('bbbbbbbb-0088-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Food'), 'aaaaaaaa-0005-0000-0000-000000000000', 'チーズ盛り合わせ',      'Cheese Plate',     '皿', 650, 1400, true),
  ('bbbbbbbb-0089-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Food'), 'aaaaaaaa-0005-0000-0000-000000000000', 'サーモンマリネ',        'Salmon Marine',    '皿', 700, 1600, true),
  ('bbbbbbbb-0090-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Food'), 'aaaaaaaa-0005-0000-0000-000000000000', 'ブルスケッタ',          'Bruschetta',       '皿', 480, 1100, true),
  ('bbbbbbbb-0091-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Food'), 'aaaaaaaa-0005-0000-0000-000000000000', 'ポテトフライ',          'French Fries',     '皿', 280, 700,  true),
  ('bbbbbbbb-0092-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Food'), 'aaaaaaaa-0005-0000-0000-000000000000', 'ガーリックトースト',    'Garlic Toast',     '皿', 200, 500,  true),
  ('bbbbbbbb-0093-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Food'), 'aaaaaaaa-0005-0000-0000-000000000000', 'クラッカー',            'Crackers',         '袋', 180, 400,  true),
  ('bbbbbbbb-0094-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Food'), 'aaaaaaaa-0005-0000-0000-000000000000', 'チョコレート',          'Chocolate',        '箱', 350, 700,  true),
  ('bbbbbbbb-0095-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Food'), 'aaaaaaaa-0005-0000-0000-000000000000', 'ドライフルーツ',        'Dried Fruits',     '袋', 280, 600,  true);

-- その他 5 品
INSERT INTO products (id, category_id, supplier_id, name, name_en, unit, cost_price, selling_price, is_available) VALUES
  ('bbbbbbbb-0096-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Others'), 'aaaaaaaa-0005-0000-0000-000000000000', 'ガーニッシュ用レモン',  'Lemon',            '個', 30,  0, true),
  ('bbbbbbbb-0097-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Others'), 'aaaaaaaa-0005-0000-0000-000000000000', 'ガーニッシュ用ライム',  'Lime',             '個', 35,  0, true),
  ('bbbbbbbb-0098-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Others'), 'aaaaaaaa-0005-0000-0000-000000000000', 'カクテル用チェリー',    'Cocktail Cherry',  '瓶', 600, 0, true),
  ('bbbbbbbb-0099-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Others'), 'aaaaaaaa-0002-0000-0000-000000000000', 'マドラー',              'Stirrer',          '本', 5,   0, true),
  ('bbbbbbbb-0100-0000-0000-000000000000', (SELECT id FROM categories WHERE name_en='Others'), 'aaaaaaaa-0002-0000-0000-000000000000', 'コースター',            'Coaster',          '枚', 8,   0, true);

-- ---------------------------------------------------------------------------
-- 在庫（全商品分）
-- ---------------------------------------------------------------------------
INSERT INTO stock (product_id, quantity, min_quantity)
SELECT
  p.id,
  CASE c.name_en
    WHEN 'Spirits'    THEN floor(random() * 8  + 2)
    WHEN 'Wine'       THEN floor(random() * 12 + 3)
    WHEN 'Champagne'  THEN floor(random() * 6  + 1)
    WHEN 'Beer'       THEN floor(random() * 24 + 6)
    WHEN 'Soft Drink' THEN floor(random() * 20 + 5)
    WHEN 'Food'       THEN floor(random() * 10 + 2)
    ELSE              floor(random() * 15 + 2)
  END,
  CASE c.name_en
    WHEN 'Spirits'    THEN 3
    WHEN 'Wine'       THEN 4
    WHEN 'Champagne'  THEN 2
    WHEN 'Beer'       THEN 12
    WHEN 'Soft Drink' THEN 6
    WHEN 'Food'       THEN 3
    ELSE 2
  END
FROM products p
JOIN categories c ON c.id = p.category_id;

-- ---------------------------------------------------------------------------
-- 確認
-- ---------------------------------------------------------------------------
SELECT c.name AS カテゴリ, COUNT(p.id) AS 商品数
FROM products p JOIN categories c ON c.id = p.category_id
GROUP BY c.name, c.sort_order ORDER BY c.sort_order;
