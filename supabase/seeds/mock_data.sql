-- =============================================================================
-- graff.bms モックデータ — 発注先 10件 + 商品 100件
-- Supabase Dashboard > SQL Editor で実行してください
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 発注先 10件
-- ---------------------------------------------------------------------------
INSERT INTO suppliers (name, name_en, phone, notes) VALUES
  ('東洋スピリッツ株式会社',       'Toyo Spirits Co.',           '00-0000-0001', 'コニャック・シャンパン・ウイスキー'),
  ('アジアインポート株式会社',     'Asia Import Co.',            '00-0000-0002', 'スコッチ・アイリッシュ・ジン'),
  ('パシフィックビバレッジ',       'Pacific Beverage Co.',       '00-0000-0003', 'ラム・テキーラ・ジン'),
  ('日本酒類販売株式会社',         'Nihon Liquor Sales',         '00-0000-0004', '国産ウイスキー・クラフトジン'),
  ('北海道ブリュワリー販売',       'Hokkaido Brewery Sales',     '00-0000-0005', 'ビール・発泡酒'),
  ('東洋麦酒株式会社',             'Toyo Beer Co.',              '00-0000-0006', 'ビール・ハードセルツァー'),
  ('丸亀物産株式会社',             'Marukame Trading',           '00-0000-0007', '総合飲料卸・輸入ワイン'),
  ('横浜輸入商事',                  'Yokohama Import Co.',        '00-0000-0008', '輸入スピリッツ・ワイン'),
  ('プレミアムワインズジャパン',   'Premium Wines Japan',        '00-0000-0009', '輸入ワイン・シャンパン専門'),
  ('フジフードサービス',           'Fuji Food Service',          '00-0000-0010', 'ソフトドリンク・ミキサー類')
;

-- ---------------------------------------------------------------------------
-- カテゴリ ID を変数的に使うため CTE で取得してから INSERT
-- ---------------------------------------------------------------------------
WITH
  cat AS (
    SELECT id, name_en FROM categories
  ),
  sup AS (
    SELECT id, name FROM suppliers
  ),

-- ── スピリッツ 32件 ──────────────────────────────────────────────────────────
  spirits_rows (name, name_en, cost_price, selling_price, tags, is_recommended, custom_tag, unit, supplier_name) AS (VALUES
    -- Cognac / Brandy
    ('ヘネシー XO',            'Hennessy XO',            18000, 58000, ARRAY['コニャック','フランス','プレミアム'], true,  'おすすめ',  '本', '東洋スピリッツ株式会社'),
    ('ヘネシー VSOP',          'Hennessy VSOP',           9000, 32000, ARRAY['コニャック','フランス'],            false, null,        '本', '東洋スピリッツ株式会社'),
    ('ヘネシー VS',             'Hennessy VS',             6000, 19000, ARRAY['コニャック','フランス'],            false, null,        '本', '東洋スピリッツ株式会社'),
    ('レミー マルタン XO',     'Rémy Martin XO',          17000, 56000, ARRAY['コニャック','フランス','プレミアム'], false, null,       '本', '横浜輸入商事'),
    -- Scotch Whisky
    ('ザ・マッカラン 12年',    'The Macallan 12',          8500, 28000, ARRAY['シングルモルト','スコッチ','スペイサイド'], true, null,    '本', '横浜輸入商事'),
    ('グレンフィディック 12年','Glenfiddich 12',            5500, 17000, ARRAY['シングルモルト','スコッチ','スペイサイド'], false, null,   '本', 'アジアインポート株式会社'),
    ('ラフロイグ 10年',        'Laphroaig 10',             5800, 18000, ARRAY['シングルモルト','スコッチ','アイラ','スモーキー'], false, null, '本', '横浜輸入商事'),
    ('ボウモア 12年',           'Bowmore 12',               5200, 16000, ARRAY['シングルモルト','スコッチ','アイラ'], false, null,        '本', '東洋スピリッツ株式会社'),
    ('バルヴェニー 14年',       'Balvenie 14',              9000, 28000, ARRAY['シングルモルト','スコッチ','スペイサイド'], false, null,   '本', '横浜輸入商事'),
    ('ジョニーウォーカー ブラック', 'Johnnie Walker Black',  4500, 14000, ARRAY['ブレンデッド','スコッチ'],         false, null,        '本', '東洋スピリッツ株式会社'),
    ('ジョニーウォーカー ブルー',  'Johnnie Walker Blue',  22000, 70000, ARRAY['ブレンデッド','スコッチ','プレミアム'], true, 'プレミアム','本', '東洋スピリッツ株式会社'),
    ('シーバスリーガル 12年',   'Chivas Regal 12',          4800, 15000, ARRAY['ブレンデッド','スコッチ'],         false, null,        '本', 'アジアインポート株式会社'),
    -- Irish Whiskey
    ('ジェムソン',              'Jameson',                  4000, 12000, ARRAY['アイリッシュ','ウイスキー'],        false, null,        '本', 'アジアインポート株式会社'),
    -- Japanese Whisky
    ('響 17年',                 'Hibiki 17',               22000, 75000, ARRAY['ジャパニーズ','ブレンデッド','プレミアム'], true, 'NEW', '本', '日本酒類販売株式会社'),
    ('山崎 12年',               'Yamazaki 12',             12000, 40000, ARRAY['ジャパニーズ','シングルモルト'],    true,  null,        '本', '日本酒類販売株式会社'),
    ('白州 12年',               'Hakushu 12',              12000, 38000, ARRAY['ジャパニーズ','シングルモルト'],    false, null,        '本', '日本酒類販売株式会社'),
    ('ニッカ フロムザバレル',   'Nikka From The Barrel',    3500, 11000, ARRAY['ジャパニーズ','ブレンデッド'],      false, null,        '本', '丸亀物産株式会社'),
    -- Gin
    ('ヘンドリックス',          'Hendrick''s Gin',           7500, 24000, ARRAY['ジン','スコットランド','フローラル'], true, null,      '本', 'アジアインポート株式会社'),
    ('タンカレー',              'Tanqueray',                 5000, 16000, ARRAY['ジン','イギリス'],                 false, null,        '本', '東洋スピリッツ株式会社'),
    ('ボンベイサファイア',      'Bombay Sapphire',           5200, 16000, ARRAY['ジン','イギリス'],                 false, null,        '本', 'パシフィックビバレッジ'),
    ('季 ROKU',                 'Roku Gin',                  4800, 15000, ARRAY['ジン','ジャパニーズ','クラフト'],   false, null,        '本', '日本酒類販売株式会社'),
    -- Vodka
    ('グレイグース',            'Grey Goose',                7500, 23000, ARRAY['ウォッカ','フランス'],              false, null,        '本', 'パシフィックビバレッジ'),
    ('アブソルート',            'Absolut Vodka',             4000, 12000, ARRAY['ウォッカ','スウェーデン'],          false, null,        '本', 'アジアインポート株式会社'),
    ('ベルヴェデール',          'Belvedere Vodka',           7800, 24000, ARRAY['ウォッカ','ポーランド'],            false, null,        '本', '東洋スピリッツ株式会社'),
    -- Rum
    ('バカルディ スペリオール', 'Bacardi Superior',          3500, 11000, ARRAY['ラム','キューバ','ホワイト'],       false, null,        '本', 'パシフィックビバレッジ'),
    ('ディプロマティコ リゼルバ','Diplomatico Reserva',      6500, 20000, ARRAY['ラム','ベネズエラ','プレミアム'],   false, null,        '本', '丸亀物産株式会社'),
    -- Tequila
    ('パトロン シルバー',       'Patrón Silver',             8000, 26000, ARRAY['テキーラ','メキシコ','ブランコ'],   false, null,        '本', 'パシフィックビバレッジ'),
    ('ドン フリオ ブランコ',   'Don Julio Blanco',           9000, 29000, ARRAY['テキーラ','メキシコ'],              false, null,        '本', '東洋スピリッツ株式会社'),
    ('カサミゴス ブランコ',     'Casamigos Blanco',           8500, 27000, ARRAY['テキーラ','メキシコ'],              false, null,        '本', '東洋スピリッツ株式会社'),
    -- Liqueur
    ('コアントロー',            'Cointreau',                 4500, 14000, ARRAY['リキュール','フランス','オレンジ'], false, null,        '本', 'アジアインポート株式会社'),
    ('カンパリ',                'Campari',                   4000, 12000, ARRAY['リキュール','イタリア'],            false, null,        '本', '丸亀物産株式会社'),
    ('ベイリーズ',              'Baileys',                   4200, 13000, ARRAY['リキュール','アイルランド','クリーム'], false, null,    '本', '東洋スピリッツ株式会社')
  ),

-- ── ワイン 25件 ──────────────────────────────────────────────────────────────
  wine_rows (name, name_en, cost_price, selling_price, tags, is_recommended, custom_tag, unit, supplier_name) AS (VALUES
    -- Red
    ('バローロ 2019',           'Barolo 2019',              12000, 38000, ARRAY['赤','イタリア','ピエモンテ','フルボディ'], true, null, '本', 'プレミアムワインズジャパン'),
    ('シャトー・マルゴー 2018', 'Château Margaux 2018',    85000,260000, ARRAY['赤','フランス','ボルドー','プレミアム'], true, 'プレミアム','本', 'プレミアムワインズジャパン'),
    ('カベルネ・ソーヴィニヨン ナパ','Napa Cabernet Sauvignon', 8500, 28000, ARRAY['赤','アメリカ','カリフォルニア','フルボディ'], false, null, '本', '丸亀物産株式会社'),
    ('マルベック メンドーサ',   'Mendoza Malbec',            4500, 14000, ARRAY['赤','アルゼンチン','フルボディ'],    false, null,        '本', '丸亀物産株式会社'),
    ('リオハ グラン レゼルバ',  'Rioja Gran Reserva',        7000, 22000, ARRAY['赤','スペイン','テンプラニーリョ'], false, null,        '本', 'プレミアムワインズジャパン'),
    ('コート・デュ・ローヌ',    'Côtes du Rhône Rouge',      3500, 11000, ARRAY['赤','フランス','ローヌ'],            false, null,        '本', 'プレミアムワインズジャパン'),
    ('ピノ・ノワール ブルゴーニュ','Pinot Noir Bourgogne',   9000, 28000, ARRAY['赤','フランス','ブルゴーニュ'],      false, null,        '本', 'プレミアムワインズジャパン'),
    ('バルバレスコ 2020',       'Barbaresco 2020',           8000, 25000, ARRAY['赤','イタリア','ピエモンテ'],        false, null,        '本', 'プレミアムワインズジャパン'),
    ('キアンティ クラッシコ',   'Chianti Classico DOCG',     5000, 16000, ARRAY['赤','イタリア','トスカーナ'],        false, null,        '本', 'プレミアムワインズジャパン'),
    -- White
    ('シャブリ プルミエクリュ', 'Chablis 1er Cru',           7500, 24000, ARRAY['白','フランス','ブルゴーニュ','辛口'], true, null,    '本', 'プレミアムワインズジャパン'),
    ('プイィ・フュメ',          'Pouilly-Fumé',               6500, 20000, ARRAY['白','フランス','ロワール','辛口'],   false, null,        '本', 'プレミアムワインズジャパン'),
    ('ソーヴィニヨン・ブラン ニュージーランド','Sauvignon Blanc NZ', 3800, 12000, ARRAY['白','ニュージーランド','辛口'], false, null,   '本', '丸亀物産株式会社'),
    ('リースリング アルザス',   'Riesling Alsace',            5000, 16000, ARRAY['白','フランス','アルザス'],          false, null,        '本', 'プレミアムワインズジャパン'),
    ('シャルドネ ブルゴーニュ', 'Chardonnay Bourgogne',       6000, 19000, ARRAY['白','フランス','ブルゴーニュ'],      false, null,        '本', 'プレミアムワインズジャパン'),
    ('ゲヴュルツトラミネール', 'Gewurztraminer',              4800, 15000, ARRAY['白','フランス','アルザス','アロマティック'], false, null,'本', 'プレミアムワインズジャパン'),
    ('ヴェルデホ ルエダ',       'Verdejo Rueda',              3500, 11000, ARRAY['白','スペイン','辛口'],              false, null,        '本', '丸亀物産株式会社'),
    -- Rosé
    ('プロヴァンス ロゼ',       'Provence Rosé',              4200, 13000, ARRAY['ロゼ','フランス','プロヴァンス'],    false, null,        '本', 'プレミアムワインズジャパン'),
    ('バンドール ロゼ',         'Bandol Rosé',                5500, 17000, ARRAY['ロゼ','フランス','プロヴァンス'],    false, null,        '本', 'プレミアムワインズジャパン'),
    -- Orange / Natural
    ('オレンジワイン ジョージア','Georgian Amber Wine',        5000, 16000, ARRAY['オレンジ','ジョージア','自然派'],   false, 'NEW',       '本', '丸亀物産株式会社'),
    ('ナチュラルワイン フランス','Natural Wine France',        5500, 17000, ARRAY['自然派','フランス'],                false, null,        '本', 'プレミアムワインズジャパン'),
    -- Dessert
    ('ソーテルヌ',              'Sauternes',                  9000, 28000, ARRAY['デザートワイン','フランス','甘口'],  false, null,        '本', 'プレミアムワインズジャパン'),
    ('ポルト',                  'Port Wine',                  5000, 16000, ARRAY['ポートワイン','ポルトガル','甘口'],  false, null,        '本', '丸亀物産株式会社'),
    ('アマローネ',              'Amarone della Valpolicella',  14000, 44000, ARRAY['赤','イタリア','ヴェネト','フルボディ'], false, null, '本', 'プレミアムワインズジャパン'),
    ('バローネ ヴェルナッチャ', 'Vernaccia di San Gimignano',  4500, 14000, ARRAY['白','イタリア','トスカーナ'],        false, null,        '本', 'プレミアムワインズジャパン'),
    ('グリューナー フェルトリナー','Grüner Veltliner',          4800, 15000, ARRAY['白','オーストリア','辛口'],         false, null,        '本', '丸亀物産株式会社')
  ),

-- ── シャンパン 10件 ──────────────────────────────────────────────────────────
  champagne_rows (name, name_en, cost_price, selling_price, tags, is_recommended, custom_tag, unit, supplier_name) AS (VALUES
    ('モエ・エ・シャンドン ブリュット','Moët & Chandon Brut',   7500, 24000, ARRAY['シャンパン','フランス'],           true,  null,        '本', '東洋スピリッツ株式会社'),
    ('ドン ペリニョン 2015',    'Dom Pérignon 2015',          28000, 90000, ARRAY['シャンパン','フランス','プレミアム'], true, 'プレミアム','本', '東洋スピリッツ株式会社'),
    ('クリュッグ グランキュヴェ','Krug Grande Cuvée',          28000, 88000, ARRAY['シャンパン','フランス','プレミアム'], false, null,      '本', '東洋スピリッツ株式会社'),
    ('ヴーヴ クリコ イエローラベル','Veuve Clicquot Yellow',   9000, 29000, ARRAY['シャンパン','フランス'],            false, null,        '本', '東洋スピリッツ株式会社'),
    ('ローラン ペリエ ロゼ',    'Laurent-Perrier Rosé',       14000, 44000, ARRAY['シャンパン','フランス','ロゼ'],     false, null,        '本', 'プレミアムワインズジャパン'),
    ('ルイ ロデレール クリスタル','Louis Roederer Cristal',    30000, 95000, ARRAY['シャンパン','フランス','プレミアム'], false, 'プレミアム','本', 'プレミアムワインズジャパン'),
    ('ボランジェ スペシャル キュヴェ','Bollinger Special Cuvée', 12000, 38000, ARRAY['シャンパン','フランス'],         false, null,        '本', 'プレミアムワインズジャパン'),
    ('テタンジェ ブリュット',   'Taittinger Brut Réserve',     9500, 30000, ARRAY['シャンパン','フランス'],            false, null,        '本', 'プレミアムワインズジャパン'),
    ('ペリエ ジュエ ベル エポック','Perrier-Jouët Belle Époque', 18000, 58000, ARRAY['シャンパン','フランス'],         false, null,        '本', 'アジアインポート株式会社'),
    ('ニコラ フィアット ブリュット','Nicolas Feuillatte Brut',   6800, 21000, ARRAY['シャンパン','フランス'],          false, null,        '本', 'プレミアムワインズジャパン')
  ),

-- ── ビール 18件 ──────────────────────────────────────────────────────────────
  beer_rows (name, name_en, cost_price, selling_price, tags, is_recommended, custom_tag, unit, supplier_name) AS (VALUES
    ('アサヒ スーパードライ',   'Asahi Super Dry',             250,   700, ARRAY['ビール','国産','ラガー'],           false, null, '缶', '北海道ブリュワリー販売'),
    ('キリン一番搾り',          'Kirin Ichiban',                250,   700, ARRAY['ビール','国産'],                    false, null, '缶', '東洋麦酒株式会社'),
    ('サッポロ 黒ラベル',       'Sapporo Black Label',          250,   700, ARRAY['ビール','国産'],                    false, null, '缶', '丸亀物産株式会社'),
    ('ヱビスビール',            'Yebisu Beer',                  280,   800, ARRAY['ビール','国産','プレミアム'],       false, null, '缶', '日本酒類販売株式会社'),
    ('ギネス ドラフト',         'Guinness Draught',             350,   900, ARRAY['ビール','アイルランド','スタウト'],  true,  null, '缶', '横浜輸入商事'),
    ('コロナ エキストラ',       'Corona Extra',                 320,   850, ARRAY['ビール','メキシコ','ラガー'],       false, null, '本', '丸亀物産株式会社'),
    ('ハイネケン',              'Heineken',                     300,   800, ARRAY['ビール','オランダ','ラガー'],       false, null, '本', '丸亀物産株式会社'),
    ('ヒューガルデン ホワイト', 'Hoegaarden White',             330,   900, ARRAY['ビール','ベルギー','白ビール'],     false, null, '本', '丸亀物産株式会社'),
    ('デュベル',                'Duvel',                        400,  1100, ARRAY['ビール','ベルギー','ゴールデンエール'], false, null, '本', '丸亀物産株式会社'),
    ('ヴェデット エクストラ ホワイト','Vedett Extra White',      350,   950, ARRAY['ビール','ベルギー','白ビール'],     false, null, '本', '丸亀物産株式会社'),
    ('クラフトビール IPA',      'Craft Beer IPA',               420,  1100, ARRAY['クラフトビール','IPA','国産'],      true,  'NEW', '缶', '北海道ブリュワリー販売'),
    ('クラフトビール スタウト', 'Craft Beer Stout',             420,  1100, ARRAY['クラフトビール','スタウト','国産'],  false, null, '缶', '東洋麦酒株式会社'),
    ('よなよなエール',          'Yona Yona Ale',                380,  1000, ARRAY['クラフトビール','ペールエール','国産'], false, null,'缶', '丸亀物産株式会社'),
    ('ブルックリン ラガー',     'Brooklyn Lager',               350,   950, ARRAY['クラフトビール','アメリカ'],        false, null, '缶', '横浜輸入商事'),
    ('スーパードライ 生ジョッキ缶','Asahi Super Dry Jokki',     280,   750, ARRAY['ビール','国産'],                    false, null, '缶', '北海道ブリュワリー販売'),
    ('プレミアム モルツ',       'The Premium Malt''s',           270,   750, ARRAY['ビール','国産','プレミアム'],       false, null, '缶', '日本酒類販売株式会社'),
    ('アンカー スチーム ビール','Anchor Steam Beer',             380,  1000, ARRAY['クラフトビール','アメリカ','スチームビール'], false, null,'本','横浜輸入商事'),
    ('ペローニ ナストロ アズッロ','Peroni Nastro Azzurro',       320,   850, ARRAY['ビール','イタリア','ラガー'],       false, null, '本', '丸亀物産株式会社')
  ),

-- ── ソフトドリンク・ミキサー 15件 ────────────────────────────────────────────
  soft_rows (name, name_en, cost_price, selling_price, tags, is_recommended, custom_tag, unit, supplier_name) AS (VALUES
    ('フィーバーツリー プレミアム トニック','Fever-Tree Premium Tonic', 200, 600, ARRAY['トニックウォーター','ミキサー'], true, null, '本', 'フジフードサービス'),
    ('フィーバーツリー ジンジャービア',   'Fever-Tree Ginger Beer',    200, 600, ARRAY['ジンジャービア','ミキサー'],     false, null, '本', 'フジフードサービス'),
    ('フィーバーツリー ジンジャーエール', 'Fever-Tree Ginger Ale',     200, 600, ARRAY['ジンジャーエール','ミキサー'],   false, null, '本', 'フジフードサービス'),
    ('サンペレグリノ スパークリング',     'S.Pellegrino Sparkling',    150, 500, ARRAY['ミネラルウォーター','イタリア'], false, null, '本', '丸亀物産株式会社'),
    ('ペリエ',                            'Perrier',                   150, 500, ARRAY['ミネラルウォーター','フランス','炭酸'], false, null, '本', '丸亀物産株式会社'),
    ('コーラ',                            'Coca-Cola',                  80, 400, ARRAY['コーラ','ソフトドリンク'],        false, null, '缶', 'フジフードサービス'),
    ('ジンジャーエール 国産',             'Ginger Ale',                100, 450, ARRAY['ジンジャーエール','ソフトドリンク'], false, null,'缶', 'フジフードサービス'),
    ('オレンジジュース',                  'Orange Juice',               120, 500, ARRAY['ジュース','フレッシュ'],          false, null, '本', 'フジフードサービス'),
    ('グレープフルーツジュース',          'Grapefruit Juice',           120, 500, ARRAY['ジュース'],                       false, null, '本', 'フジフードサービス'),
    ('クランベリージュース',              'Cranberry Juice',            130, 500, ARRAY['ジュース','ミキサー'],             false, null, '本', 'フジフードサービス'),
    ('ライムジュース',                    'Lime Juice',                 200, 550, ARRAY['ジュース','ミキサー'],             false, null, '本', 'フジフードサービス'),
    ('グレナデンシロップ',                'Grenadine Syrup',            400, 900, ARRAY['シロップ','ミキサー'],             false, null, '本', 'フジフードサービス'),
    ('シュガーシロップ',                  'Simple Syrup',               300, 700, ARRAY['シロップ','ミキサー'],             false, null, '本', 'フジフードサービス'),
    ('アンゴスチュラ ビターズ',           'Angostura Bitters',          800,2000, ARRAY['ビターズ','ミキサー'],             false, null, '本', '丸亀物産株式会社'),
    ('ペイショーズ ビターズ',             'Peychaud''s Bitters',         800,2000, ARRAY['ビターズ','ミキサー'],            false, null, '本', '丸亀物産株式会社')
  )

-- ── INSERT ──────────────────────────────────────────────────────────────────
INSERT INTO products (name, name_en, category_id, supplier_id, cost_price, selling_price, unit, tags, is_available, is_recommended, custom_tag)
  SELECT
    r.name, r.name_en,
    (SELECT id FROM cat WHERE name_en = 'Spirits'),
    (SELECT id FROM sup WHERE name = r.supplier_name),
    r.cost_price, r.selling_price, r.unit, r.tags, true, r.is_recommended, r.custom_tag
  FROM spirits_rows r
UNION ALL
  SELECT
    r.name, r.name_en,
    (SELECT id FROM cat WHERE name_en = 'Wine'),
    (SELECT id FROM sup WHERE name = r.supplier_name),
    r.cost_price, r.selling_price, r.unit, r.tags, true, r.is_recommended, r.custom_tag
  FROM wine_rows r
UNION ALL
  SELECT
    r.name, r.name_en,
    (SELECT id FROM cat WHERE name_en = 'Champagne'),
    (SELECT id FROM sup WHERE name = r.supplier_name),
    r.cost_price, r.selling_price, r.unit, r.tags, true, r.is_recommended, r.custom_tag
  FROM champagne_rows r
UNION ALL
  SELECT
    r.name, r.name_en,
    (SELECT id FROM cat WHERE name_en = 'Beer'),
    (SELECT id FROM sup WHERE name = r.supplier_name),
    r.cost_price, r.selling_price, r.unit, r.tags, true, r.is_recommended, r.custom_tag
  FROM beer_rows r
UNION ALL
  SELECT
    r.name, r.name_en,
    (SELECT id FROM cat WHERE name_en = 'Soft Drink'),
    (SELECT id FROM sup WHERE name = r.supplier_name),
    r.cost_price, r.selling_price, r.unit, r.tags, true, r.is_recommended, r.custom_tag
  FROM soft_rows r
;
