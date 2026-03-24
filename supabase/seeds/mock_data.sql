-- =============================================================================
-- graff.bms モックデータ — 発注先 10件 + 商品 100件
-- Supabase Dashboard > SQL Editor で実行してください
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 発注先 10件
-- ---------------------------------------------------------------------------
INSERT INTO suppliers (name, name_en, phone, notes) VALUES
  ('MHDモエ ヘネシー ディアジオ', 'MHD Moët Hennessy Diageo',  '03-6688-7200', 'コニャック・シャンパン・ウイスキー'),
  ('ペルノ・リカール・ジャパン',   'Pernod Ricard Japan',        '03-5802-2671', 'スコッチ・アイリッシュ・ジン'),
  ('バカルディ ジャパン',          'Bacardi Japan',              '03-5447-6000', 'ラム・テキーラ・ジン'),
  ('サントリー酒類',               'Suntory Liquors',            '0120-139-310', '国産ウイスキー・クラフトジン'),
  ('アサヒビール',                  'Asahi Breweries',            '0120-011-121', 'ビール・発泡酒'),
  ('キリンビール',                  'Kirin Brewery',              '0120-111-560', 'ビール・ハードセルツァー'),
  ('国分グループ本社',              'Kokubu Group',               '03-3276-4111', '総合飲料卸・輸入ワイン'),
  ('明治屋',                        'Meidi-ya',                   '03-3538-0241', '輸入スピリッツ・ワイン'),
  ('ジャパンインポートシステム',    'Japan Import System',        '03-3583-1001', '輸入ワイン・シャンパン専門'),
  ('フードリンクジャパン',          'Foodlink Japan',             '03-3562-3411', 'ソフトドリンク・ミキサー類')
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
    ('ヘネシー XO',            'Hennessy XO',            18000, 58000, ARRAY['コニャック','フランス','プレミアム'], true,  'おすすめ',  '本', 'MHDモエ ヘネシー ディアジオ'),
    ('ヘネシー VSOP',          'Hennessy VSOP',           9000, 32000, ARRAY['コニャック','フランス'],            false, null,        '本', 'MHDモエ ヘネシー ディアジオ'),
    ('ヘネシー VS',             'Hennessy VS',             6000, 19000, ARRAY['コニャック','フランス'],            false, null,        '本', 'MHDモエ ヘネシー ディアジオ'),
    ('レミー マルタン XO',     'Rémy Martin XO',          17000, 56000, ARRAY['コニャック','フランス','プレミアム'], false, null,       '本', '明治屋'),
    -- Scotch Whisky
    ('ザ・マッカラン 12年',    'The Macallan 12',          8500, 28000, ARRAY['シングルモルト','スコッチ','スペイサイド'], true, null,    '本', '明治屋'),
    ('グレンフィディック 12年','Glenfiddich 12',            5500, 17000, ARRAY['シングルモルト','スコッチ','スペイサイド'], false, null,   '本', 'ペルノ・リカール・ジャパン'),
    ('ラフロイグ 10年',        'Laphroaig 10',             5800, 18000, ARRAY['シングルモルト','スコッチ','アイラ','スモーキー'], false, null, '本', '明治屋'),
    ('ボウモア 12年',           'Bowmore 12',               5200, 16000, ARRAY['シングルモルト','スコッチ','アイラ'], false, null,        '本', 'MHDモエ ヘネシー ディアジオ'),
    ('バルヴェニー 14年',       'Balvenie 14',              9000, 28000, ARRAY['シングルモルト','スコッチ','スペイサイド'], false, null,   '本', '明治屋'),
    ('ジョニーウォーカー ブラック', 'Johnnie Walker Black',  4500, 14000, ARRAY['ブレンデッド','スコッチ'],         false, null,        '本', 'MHDモエ ヘネシー ディアジオ'),
    ('ジョニーウォーカー ブルー',  'Johnnie Walker Blue',  22000, 70000, ARRAY['ブレンデッド','スコッチ','プレミアム'], true, 'プレミアム','本', 'MHDモエ ヘネシー ディアジオ'),
    ('シーバスリーガル 12年',   'Chivas Regal 12',          4800, 15000, ARRAY['ブレンデッド','スコッチ'],         false, null,        '本', 'ペルノ・リカール・ジャパン'),
    -- Irish Whiskey
    ('ジェムソン',              'Jameson',                  4000, 12000, ARRAY['アイリッシュ','ウイスキー'],        false, null,        '本', 'ペルノ・リカール・ジャパン'),
    -- Japanese Whisky
    ('響 17年',                 'Hibiki 17',               22000, 75000, ARRAY['ジャパニーズ','ブレンデッド','プレミアム'], true, 'NEW', '本', 'サントリー酒類'),
    ('山崎 12年',               'Yamazaki 12',             12000, 40000, ARRAY['ジャパニーズ','シングルモルト'],    true,  null,        '本', 'サントリー酒類'),
    ('白州 12年',               'Hakushu 12',              12000, 38000, ARRAY['ジャパニーズ','シングルモルト'],    false, null,        '本', 'サントリー酒類'),
    ('ニッカ フロムザバレル',   'Nikka From The Barrel',    3500, 11000, ARRAY['ジャパニーズ','ブレンデッド'],      false, null,        '本', '国分グループ本社'),
    -- Gin
    ('ヘンドリックス',          'Hendrick''s Gin',           7500, 24000, ARRAY['ジン','スコットランド','フローラル'], true, null,      '本', 'ウィリアム グラント'),
    ('タンカレー',              'Tanqueray',                 5000, 16000, ARRAY['ジン','イギリス'],                 false, null,        '本', 'MHDモエ ヘネシー ディアジオ'),
    ('ボンベイサファイア',      'Bombay Sapphire',           5200, 16000, ARRAY['ジン','イギリス'],                 false, null,        '本', 'バカルディ ジャパン'),
    ('季 ROKU',                 'Roku Gin',                  4800, 15000, ARRAY['ジン','ジャパニーズ','クラフト'],   false, null,        '本', 'サントリー酒類'),
    -- Vodka
    ('グレイグース',            'Grey Goose',                7500, 23000, ARRAY['ウォッカ','フランス'],              false, null,        '本', 'バカルディ ジャパン'),
    ('アブソルート',            'Absolut Vodka',             4000, 12000, ARRAY['ウォッカ','スウェーデン'],          false, null,        '本', 'ペルノ・リカール・ジャパン'),
    ('ベルヴェデール',          'Belvedere Vodka',           7800, 24000, ARRAY['ウォッカ','ポーランド'],            false, null,        '本', 'MHDモエ ヘネシー ディアジオ'),
    -- Rum
    ('バカルディ スペリオール', 'Bacardi Superior',          3500, 11000, ARRAY['ラム','キューバ','ホワイト'],       false, null,        '本', 'バカルディ ジャパン'),
    ('ディプロマティコ リゼルバ','Diplomatico Reserva',      6500, 20000, ARRAY['ラム','ベネズエラ','プレミアム'],   false, null,        '本', '国分グループ本社'),
    -- Tequila
    ('パトロン シルバー',       'Patrón Silver',             8000, 26000, ARRAY['テキーラ','メキシコ','ブランコ'],   false, null,        '本', 'バカルディ ジャパン'),
    ('ドン フリオ ブランコ',   'Don Julio Blanco',           9000, 29000, ARRAY['テキーラ','メキシコ'],              false, null,        '本', 'MHDモエ ヘネシー ディアジオ'),
    ('カサミゴス ブランコ',     'Casamigos Blanco',           8500, 27000, ARRAY['テキーラ','メキシコ'],              false, null,        '本', 'MHDモエ ヘネシー ディアジオ'),
    -- Liqueur
    ('コアントロー',            'Cointreau',                 4500, 14000, ARRAY['リキュール','フランス','オレンジ'], false, null,        '本', 'ペルノ・リカール・ジャパン'),
    ('カンパリ',                'Campari',                   4000, 12000, ARRAY['リキュール','イタリア'],            false, null,        '本', '国分グループ本社'),
    ('ベイリーズ',              'Baileys',                   4200, 13000, ARRAY['リキュール','アイルランド','クリーム'], false, null,    '本', 'MHDモエ ヘネシー ディアジオ')
  ),

-- ── ワイン 25件 ──────────────────────────────────────────────────────────────
  wine_rows (name, name_en, cost_price, selling_price, tags, is_recommended, custom_tag, unit, supplier_name) AS (VALUES
    -- Red
    ('バローロ 2019',           'Barolo 2019',              12000, 38000, ARRAY['赤','イタリア','ピエモンテ','フルボディ'], true, null, '本', 'ジャパンインポートシステム'),
    ('シャトー・マルゴー 2018', 'Château Margaux 2018',    85000,260000, ARRAY['赤','フランス','ボルドー','プレミアム'], true, 'プレミアム','本', 'ジャパンインポートシステム'),
    ('カベルネ・ソーヴィニヨン ナパ','Napa Cabernet Sauvignon', 8500, 28000, ARRAY['赤','アメリカ','カリフォルニア','フルボディ'], false, null, '本', '国分グループ本社'),
    ('マルベック メンドーサ',   'Mendoza Malbec',            4500, 14000, ARRAY['赤','アルゼンチン','フルボディ'],    false, null,        '本', '国分グループ本社'),
    ('リオハ グラン レゼルバ',  'Rioja Gran Reserva',        7000, 22000, ARRAY['赤','スペイン','テンプラニーリョ'], false, null,        '本', 'ジャパンインポートシステム'),
    ('コート・デュ・ローヌ',    'Côtes du Rhône Rouge',      3500, 11000, ARRAY['赤','フランス','ローヌ'],            false, null,        '本', 'ジャパンインポートシステム'),
    ('ピノ・ノワール ブルゴーニュ','Pinot Noir Bourgogne',   9000, 28000, ARRAY['赤','フランス','ブルゴーニュ'],      false, null,        '本', 'ジャパンインポートシステム'),
    ('バルバレスコ 2020',       'Barbaresco 2020',           8000, 25000, ARRAY['赤','イタリア','ピエモンテ'],        false, null,        '本', 'ジャパンインポートシステム'),
    ('キアンティ クラッシコ',   'Chianti Classico DOCG',     5000, 16000, ARRAY['赤','イタリア','トスカーナ'],        false, null,        '本', 'ジャパンインポートシステム'),
    -- White
    ('シャブリ プルミエクリュ', 'Chablis 1er Cru',           7500, 24000, ARRAY['白','フランス','ブルゴーニュ','辛口'], true, null,    '本', 'ジャパンインポートシステム'),
    ('プイィ・フュメ',          'Pouilly-Fumé',               6500, 20000, ARRAY['白','フランス','ロワール','辛口'],   false, null,        '本', 'ジャパンインポートシステム'),
    ('ソーヴィニヨン・ブラン ニュージーランド','Sauvignon Blanc NZ', 3800, 12000, ARRAY['白','ニュージーランド','辛口'], false, null,   '本', '国分グループ本社'),
    ('リースリング アルザス',   'Riesling Alsace',            5000, 16000, ARRAY['白','フランス','アルザス'],          false, null,        '本', 'ジャパンインポートシステム'),
    ('シャルドネ ブルゴーニュ', 'Chardonnay Bourgogne',       6000, 19000, ARRAY['白','フランス','ブルゴーニュ'],      false, null,        '本', 'ジャパンインポートシステム'),
    ('ゲヴュルツトラミネール', 'Gewurztraminer',              4800, 15000, ARRAY['白','フランス','アルザス','アロマティック'], false, null,'本', 'ジャパンインポートシステム'),
    ('ヴェルデホ ルエダ',       'Verdejo Rueda',              3500, 11000, ARRAY['白','スペイン','辛口'],              false, null,        '本', '国分グループ本社'),
    -- Rosé
    ('プロヴァンス ロゼ',       'Provence Rosé',              4200, 13000, ARRAY['ロゼ','フランス','プロヴァンス'],    false, null,        '本', 'ジャパンインポートシステム'),
    ('バンドール ロゼ',         'Bandol Rosé',                5500, 17000, ARRAY['ロゼ','フランス','プロヴァンス'],    false, null,        '本', 'ジャパンインポートシステム'),
    -- Orange / Natural
    ('オレンジワイン ジョージア','Georgian Amber Wine',        5000, 16000, ARRAY['オレンジ','ジョージア','自然派'],   false, 'NEW',       '本', '国分グループ本社'),
    ('ナチュラルワイン フランス','Natural Wine France',        5500, 17000, ARRAY['自然派','フランス'],                false, null,        '本', 'ジャパンインポートシステム'),
    -- Dessert
    ('ソーテルヌ',              'Sauternes',                  9000, 28000, ARRAY['デザートワイン','フランス','甘口'],  false, null,        '本', 'ジャパンインポートシステム'),
    ('ポルト',                  'Port Wine',                  5000, 16000, ARRAY['ポートワイン','ポルトガル','甘口'],  false, null,        '本', '国分グループ本社'),
    ('アマローネ',              'Amarone della Valpolicella',  14000, 44000, ARRAY['赤','イタリア','ヴェネト','フルボディ'], false, null, '本', 'ジャパンインポートシステム'),
    ('バローネ ヴェルナッチャ', 'Vernaccia di San Gimignano',  4500, 14000, ARRAY['白','イタリア','トスカーナ'],        false, null,        '本', 'ジャパンインポートシステム'),
    ('グリューナー フェルトリナー','Grüner Veltliner',          4800, 15000, ARRAY['白','オーストリア','辛口'],         false, null,        '本', '国分グループ本社')
  ),

-- ── シャンパン 10件 ──────────────────────────────────────────────────────────
  champagne_rows (name, name_en, cost_price, selling_price, tags, is_recommended, custom_tag, unit, supplier_name) AS (VALUES
    ('モエ・エ・シャンドン ブリュット','Moët & Chandon Brut',   7500, 24000, ARRAY['シャンパン','フランス'],           true,  null,        '本', 'MHDモエ ヘネシー ディアジオ'),
    ('ドン ペリニョン 2015',    'Dom Pérignon 2015',          28000, 90000, ARRAY['シャンパン','フランス','プレミアム'], true, 'プレミアム','本', 'MHDモエ ヘネシー ディアジオ'),
    ('クリュッグ グランキュヴェ','Krug Grande Cuvée',          28000, 88000, ARRAY['シャンパン','フランス','プレミアム'], false, null,      '本', 'MHDモエ ヘネシー ディアジオ'),
    ('ヴーヴ クリコ イエローラベル','Veuve Clicquot Yellow',   9000, 29000, ARRAY['シャンパン','フランス'],            false, null,        '本', 'MHDモエ ヘネシー ディアジオ'),
    ('ローラン ペリエ ロゼ',    'Laurent-Perrier Rosé',       14000, 44000, ARRAY['シャンパン','フランス','ロゼ'],     false, null,        '本', 'ジャパンインポートシステム'),
    ('ルイ ロデレール クリスタル','Louis Roederer Cristal',    30000, 95000, ARRAY['シャンパン','フランス','プレミアム'], false, 'プレミアム','本', 'ジャパンインポートシステム'),
    ('ボランジェ スペシャル キュヴェ','Bollinger Special Cuvée', 12000, 38000, ARRAY['シャンパン','フランス'],         false, null,        '本', 'ジャパンインポートシステム'),
    ('テタンジェ ブリュット',   'Taittinger Brut Réserve',     9500, 30000, ARRAY['シャンパン','フランス'],            false, null,        '本', 'ジャパンインポートシステム'),
    ('ペリエ ジュエ ベル エポック','Perrier-Jouët Belle Époque', 18000, 58000, ARRAY['シャンパン','フランス'],         false, null,        '本', 'ペルノ・リカール・ジャパン'),
    ('ニコラ フィアット ブリュット','Nicolas Feuillatte Brut',   6800, 21000, ARRAY['シャンパン','フランス'],          false, null,        '本', 'ジャパンインポートシステム')
  ),

-- ── ビール 18件 ──────────────────────────────────────────────────────────────
  beer_rows (name, name_en, cost_price, selling_price, tags, is_recommended, custom_tag, unit, supplier_name) AS (VALUES
    ('アサヒ スーパードライ',   'Asahi Super Dry',             250,   700, ARRAY['ビール','国産','ラガー'],           false, null, '缶', 'アサヒビール'),
    ('キリン一番搾り',          'Kirin Ichiban',                250,   700, ARRAY['ビール','国産'],                    false, null, '缶', 'キリンビール'),
    ('サッポロ 黒ラベル',       'Sapporo Black Label',          250,   700, ARRAY['ビール','国産'],                    false, null, '缶', '国分グループ本社'),
    ('ヱビスビール',            'Yebisu Beer',                  280,   800, ARRAY['ビール','国産','プレミアム'],       false, null, '缶', 'サントリー酒類'),
    ('ギネス ドラフト',         'Guinness Draught',             350,   900, ARRAY['ビール','アイルランド','スタウト'],  true,  null, '缶', '明治屋'),
    ('コロナ エキストラ',       'Corona Extra',                 320,   850, ARRAY['ビール','メキシコ','ラガー'],       false, null, '本', '国分グループ本社'),
    ('ハイネケン',              'Heineken',                     300,   800, ARRAY['ビール','オランダ','ラガー'],       false, null, '本', '国分グループ本社'),
    ('ヒューガルデン ホワイト', 'Hoegaarden White',             330,   900, ARRAY['ビール','ベルギー','白ビール'],     false, null, '本', '国分グループ本社'),
    ('デュベル',                'Duvel',                        400,  1100, ARRAY['ビール','ベルギー','ゴールデンエール'], false, null, '本', '国分グループ本社'),
    ('ヴェデット エクストラ ホワイト','Vedett Extra White',      350,   950, ARRAY['ビール','ベルギー','白ビール'],     false, null, '本', '国分グループ本社'),
    ('クラフトビール IPA',      'Craft Beer IPA',               420,  1100, ARRAY['クラフトビール','IPA','国産'],      true,  'NEW', '缶', 'アサヒビール'),
    ('クラフトビール スタウト', 'Craft Beer Stout',             420,  1100, ARRAY['クラフトビール','スタウト','国産'],  false, null, '缶', 'キリンビール'),
    ('よなよなエール',          'Yona Yona Ale',                380,  1000, ARRAY['クラフトビール','ペールエール','国産'], false, null,'缶', '国分グループ本社'),
    ('ブルックリン ラガー',     'Brooklyn Lager',               350,   950, ARRAY['クラフトビール','アメリカ'],        false, null, '缶', '明治屋'),
    ('スーパードライ 生ジョッキ缶','Asahi Super Dry Jokki',     280,   750, ARRAY['ビール','国産'],                    false, null, '缶', 'アサヒビール'),
    ('プレミアム モルツ',       'The Premium Malt''s',           270,   750, ARRAY['ビール','国産','プレミアム'],       false, null, '缶', 'サントリー酒類'),
    ('アンカー スチーム ビール','Anchor Steam Beer',             380,  1000, ARRAY['クラフトビール','アメリカ','スチームビール'], false, null,'本','明治屋'),
    ('ペローニ ナストロ アズッロ','Peroni Nastro Azzurro',       320,   850, ARRAY['ビール','イタリア','ラガー'],       false, null, '本', '国分グループ本社')
  ),

-- ── ソフトドリンク・ミキサー 15件 ────────────────────────────────────────────
  soft_rows (name, name_en, cost_price, selling_price, tags, is_recommended, custom_tag, unit, supplier_name) AS (VALUES
    ('フィーバーツリー プレミアム トニック','Fever-Tree Premium Tonic', 200, 600, ARRAY['トニックウォーター','ミキサー'], true, null, '本', 'フードリンクジャパン'),
    ('フィーバーツリー ジンジャービア',   'Fever-Tree Ginger Beer',    200, 600, ARRAY['ジンジャービア','ミキサー'],     false, null, '本', 'フードリンクジャパン'),
    ('フィーバーツリー ジンジャーエール', 'Fever-Tree Ginger Ale',     200, 600, ARRAY['ジンジャーエール','ミキサー'],   false, null, '本', 'フードリンクジャパン'),
    ('サンペレグリノ スパークリング',     'S.Pellegrino Sparkling',    150, 500, ARRAY['ミネラルウォーター','イタリア'], false, null, '本', '国分グループ本社'),
    ('ペリエ',                            'Perrier',                   150, 500, ARRAY['ミネラルウォーター','フランス','炭酸'], false, null, '本', '国分グループ本社'),
    ('コーラ',                            'Coca-Cola',                  80, 400, ARRAY['コーラ','ソフトドリンク'],        false, null, '缶', 'フードリンクジャパン'),
    ('ジンジャーエール 国産',             'Ginger Ale',                100, 450, ARRAY['ジンジャーエール','ソフトドリンク'], false, null,'缶', 'フードリンクジャパン'),
    ('オレンジジュース',                  'Orange Juice',               120, 500, ARRAY['ジュース','フレッシュ'],          false, null, '本', 'フードリンクジャパン'),
    ('グレープフルーツジュース',          'Grapefruit Juice',           120, 500, ARRAY['ジュース'],                       false, null, '本', 'フードリンクジャパン'),
    ('クランベリージュース',              'Cranberry Juice',            130, 500, ARRAY['ジュース','ミキサー'],             false, null, '本', 'フードリンクジャパン'),
    ('ライムジュース',                    'Lime Juice',                 200, 550, ARRAY['ジュース','ミキサー'],             false, null, '本', 'フードリンクジャパン'),
    ('グレナデンシロップ',                'Grenadine Syrup',            400, 900, ARRAY['シロップ','ミキサー'],             false, null, '本', 'フードリンクジャパン'),
    ('シュガーシロップ',                  'Simple Syrup',               300, 700, ARRAY['シロップ','ミキサー'],             false, null, '本', 'フードリンクジャパン'),
    ('アンゴスチュラ ビターズ',           'Angostura Bitters',          800,2000, ARRAY['ビターズ','ミキサー'],             false, null, '本', '国分グループ本社'),
    ('ペイショーズ ビターズ',             'Peychaud''s Bitters',         800,2000, ARRAY['ビターズ','ミキサー'],            false, null, '本', '国分グループ本社')
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
