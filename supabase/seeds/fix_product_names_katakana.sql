-- =============================================================================
-- 商品名（name カラム）をカタカナ表記に一括更新
-- Supabase Dashboard > SQL Editor で実行してください
-- =============================================================================

-- コニャック / ブランデー
UPDATE products SET name = 'ヘネシー XO' WHERE name_en = 'Hennessy XO';
UPDATE products SET name = 'ヘネシー VSOP' WHERE name_en = 'Hennessy VSOP';
UPDATE products SET name = 'ヘネシー VS' WHERE name_en = 'Hennessy VS';
UPDATE products SET name = 'レミー マルタン XO' WHERE name_en = 'Rémy Martin XO';
UPDATE products SET name = 'レミー マルタン VSOP' WHERE name_en = 'Rémy Martin VSOP';
UPDATE products SET name = 'ヘネシー VS コニャック' WHERE name_en = 'Hennessy V.S Cognac';

-- スコッチウイスキー
UPDATE products SET name = 'ザ・マッカラン 12年' WHERE name_en = 'The Macallan 12';
UPDATE products SET name = 'マッカラン 12年 ダブルカスク' WHERE name_en = 'The Macallan 12 Double Cask';
UPDATE products SET name = 'グレンフィディック 12年' WHERE name_en = 'Glenfiddich 12';
UPDATE products SET name = 'ラフロイグ 10年' WHERE name_en = 'Laphroaig 10';
UPDATE products SET name = 'ボウモア 12年' WHERE name_en = 'Bowmore 12';
UPDATE products SET name = 'バルヴェニー 14年' WHERE name_en = 'Balvenie 14';
UPDATE products SET name = 'ジョニーウォーカー ブラック' WHERE name_en = 'Johnnie Walker Black';
UPDATE products SET name = 'ジョニーウォーカー ブルー' WHERE name_en = 'Johnnie Walker Blue';
UPDATE products SET name = 'シーバスリーガル 12年' WHERE name_en = 'Chivas Regal 12';
UPDATE products SET name = 'グレンリベット 12年' WHERE name_en = 'The Glenlivet 12 Year Old';
UPDATE products SET name = 'バランタイン ファイネスト' WHERE name_en = 'Ballantine''s Finest';
UPDATE products SET name = 'デュワーズ ホワイトラベル' WHERE name_en = 'Dewar''s White Label';

-- アイリッシュウイスキー
UPDATE products SET name = 'ジェムソン' WHERE name_en = 'Jameson';
UPDATE products SET name = 'ジェームソン アイリッシュ ウイスキー' WHERE name_en = 'Jameson Irish Whiskey';

-- ジャパニーズウイスキー
UPDATE products SET name = '響 17年' WHERE name_en = 'Hibiki 17';
UPDATE products SET name = '響 ジャパニーズ ハーモニー' WHERE name_en = 'Hibiki Japanese Harmony';
UPDATE products SET name = '山崎 12年' WHERE name_en = 'Yamazaki 12';
UPDATE products SET name = '白州 12年' WHERE name_en = 'Hakushu 12';
UPDATE products SET name = 'ニッカ フロムザバレル' WHERE name_en = 'Nikka From The Barrel';
UPDATE products SET name = 'ニッカ フロム ザ バレル' WHERE name_en = 'Nikka From the Barrel';

-- バーボン
UPDATE products SET name = 'ジャック ダニエル ブラック' WHERE name_en = 'Jack Daniel''s Old No.7';
UPDATE products SET name = 'ジムビーム ホワイト' WHERE name_en = 'Jim Beam White Label';

-- ジン
UPDATE products SET name = 'ヘンドリックス ジン' WHERE name_en = 'Hendrick''s Gin';
UPDATE products SET name = 'タンカレー' WHERE name_en = 'Tanqueray';
UPDATE products SET name = 'タンカレー ナンバーテン' WHERE name_en = 'Tanqueray No.10';
UPDATE products SET name = 'ボンベイ サファイア' WHERE name_en = 'Bombay Sapphire';
UPDATE products SET name = '季 六（ROKU）' WHERE name_en = 'Roku Gin';

-- ウォッカ
UPDATE products SET name = 'グレイグース' WHERE name_en = 'Grey Goose';
UPDATE products SET name = 'グレイグース ウォッカ' WHERE name_en = 'Grey Goose Vodka';
UPDATE products SET name = 'アブソルート ウォッカ' WHERE name_en = 'Absolut Vodka';
UPDATE products SET name = 'アブソルート ブルー ウォッカ' WHERE name_en = 'Absolut Blue Vodka';
UPDATE products SET name = 'ベルヴェデール ウォッカ' WHERE name_en = 'Belvedere Vodka';

-- ラム
UPDATE products SET name = 'バカルディ スペリオール' WHERE name_en = 'Bacardi Superior';
UPDATE products SET name = 'バカルディ スペリオール ホワイトラム' WHERE name_en = 'Bacardí Superior White Rum';
UPDATE products SET name = 'ディプロマティコ リゼルバ' WHERE name_en = 'Diplomatico Reserva';
UPDATE products SET name = 'ハバナクラブ 3年' WHERE name_en = 'Havana Club 3 Year Old';

-- テキーラ
UPDATE products SET name = 'パトロン シルバー' WHERE name_en = 'Patrón Silver';
UPDATE products SET name = 'パトロン シルバー テキーラ' WHERE name_en = 'Patrón Silver Tequila';
UPDATE products SET name = 'ドン フリオ ブランコ' WHERE name_en = 'Don Julio Blanco';
UPDATE products SET name = 'カサミゴス ブランコ' WHERE name_en = 'Casamigos Blanco';
UPDATE products SET name = 'クエルボ エスペシャル シルバー' WHERE name_en = 'José Cuervo Especial Silver';

-- リキュール
UPDATE products SET name = 'コアントロー' WHERE name_en = 'Cointreau';
UPDATE products SET name = 'コアントロー トリプル セック' WHERE name_en = 'Cointreau Triple Sec';
UPDATE products SET name = 'カンパリ' WHERE name_en = 'Campari';
UPDATE products SET name = 'カンパリ ビター リキュール' WHERE name_en = 'Campari Bitter Liqueur';
UPDATE products SET name = 'ベイリーズ' WHERE name_en = 'Baileys';
UPDATE products SET name = 'ベイリーズ オリジナル アイリッシュクリーム' WHERE name_en = 'Bailey''s Original Irish Cream';
UPDATE products SET name = 'カルーア コーヒーリキュール' WHERE name_en = 'Kahlúa Coffee Liqueur';
UPDATE products SET name = 'ミドリ メロンリキュール' WHERE name_en = 'Midori Melon Liqueur';
UPDATE products SET name = 'ディサローノ アマレット オリジナーレ' WHERE name_en = 'Disaronno Amaretto Originale';
UPDATE products SET name = 'ルジェ クレーム・ド・カシス' WHERE name_en = 'Lejay Crème de Cassis';
UPDATE products SET name = 'アペロール アペリティフ' WHERE name_en = 'Aperol Aperitif';
UPDATE products SET name = 'ブルーキュラソー' WHERE name_en = 'Blue Curaçao';
UPDATE products SET name = 'パッソア パッションフルーツ リキュール' WHERE name_en = 'Passoã Passion Fruit Liqueur';
UPDATE products SET name = 'マリブ ホワイトラム ココナッツ' WHERE name_en = 'Malibu Coconut Rum';
UPDATE products SET name = 'グランマルニエ コルドン ルージュ' WHERE name_en = 'Grand Marnier Cordon Rouge';
UPDATE products SET name = 'シャルトリューズ ジョーヌ（イエロー）' WHERE name_en = 'Chartreuse Jaune Yellow';
UPDATE products SET name = 'ドランブイ スコッチハニーリキュール' WHERE name_en = 'Drambuie Scotch Honey Liqueur';
UPDATE products SET name = 'サンブーカ アニス リキュール' WHERE name_en = 'Sambuca Anise Liqueur';
UPDATE products SET name = 'ピーチシュナップス' WHERE name_en = 'Peach Schnapps';
UPDATE products SET name = 'スイートベルモット' WHERE name_en = 'Sweet Vermouth';
UPDATE products SET name = 'ドライベルモット' WHERE name_en = 'Dry Vermouth';
UPDATE products SET name = 'クレーム・ド・ペシェ（ピーチブランデー）' WHERE name_en = 'Crème de Pêche';
UPDATE products SET name = 'アンゴスチュラ ビターズ' WHERE name_en = 'Angostura Bitters';
UPDATE products SET name = 'アンゴスチュラ アロマティック ビターズ' WHERE name_en = 'Angostura Aromatic Bitters';
UPDATE products SET name = 'ペイショーズ ビターズ' WHERE name_en = 'Peychaud''s Bitters';

-- シャンパン
UPDATE products SET name = 'モエ・エ・シャンドン ブリュット' WHERE name_en = 'Moët & Chandon Brut';
UPDATE products SET name = 'モエ・エ・シャンドン ブリュット アンペリアル' WHERE name_en = 'Moët & Chandon Brut Impérial';
UPDATE products SET name = 'ドン ペリニョン 2015' WHERE name_en = 'Dom Pérignon 2015';
UPDATE products SET name = 'クリュッグ グランキュヴェ' WHERE name_en = 'Krug Grande Cuvée';
UPDATE products SET name = 'ヴーヴ クリコ イエローラベル' WHERE name_en = 'Veuve Clicquot Yellow';
UPDATE products SET name = 'ヴーヴ・クリコ イエローラベル' WHERE name_en = 'Veuve Clicquot Yellow Label';
UPDATE products SET name = 'ローラン ペリエ ロゼ' WHERE name_en = 'Laurent-Perrier Rosé';
UPDATE products SET name = 'ルイ ロデレール クリスタル' WHERE name_en = 'Louis Roederer Cristal';
UPDATE products SET name = 'ボランジェ スペシャル キュヴェ' WHERE name_en = 'Bollinger Special Cuvée';
UPDATE products SET name = 'テタンジェ ブリュット レゼルヴ' WHERE name_en = 'Taittinger Brut Réserve';
UPDATE products SET name = 'ペリエ ジュエ ベル エポック' WHERE name_en = 'Perrier-Jouët Belle Époque';
UPDATE products SET name = 'ニコラ フィアット ブリュット' WHERE name_en = 'Nicolas Feuillatte Brut';
UPDATE products SET name = 'ニコラ・フィアット リザーヴ エクスクルーシブ' WHERE name_en = 'Nicolas Feuillatte Réserve Exclusive';
UPDATE products SET name = 'ポル・ロジェ ブリュット レゼルヴ' WHERE name_en = 'Pol Roger Brut Réserve';

-- スパークリングワイン
UPDATE products SET name = 'フレシネ コルドン ネグロ カヴァ' WHERE name_en = 'Freixenet Cordon Negro Cava';
UPDATE products SET name = 'サンテロ プロセッコ ファッション ヴィクティム' WHERE name_en = 'Santero Prosecco Fashion Victim';
UPDATE products SET name = 'ロエデラー エステート ブリュット' WHERE name_en = 'Roederer Estate Brut';
UPDATE products SET name = 'グラハム ベック ブリュット' WHERE name_en = 'Graham Beck Brut';
UPDATE products SET name = 'ルイ・ブジェ クレマン・ド・ブルゴーニュ' WHERE name_en = 'Louis Bouillot Crémant de Bourgogne';

-- 赤ワイン
UPDATE products SET name = 'バローロ 2019' WHERE name_en = 'Barolo 2019';
UPDATE products SET name = 'シャトー・マルゴー 2018' WHERE name_en = 'Château Margaux 2018';
UPDATE products SET name = 'カベルネ・ソーヴィニヨン ナパ' WHERE name_en = 'Napa Cabernet Sauvignon';
UPDATE products SET name = 'マルベック メンドーサ' WHERE name_en = 'Mendoza Malbec';
UPDATE products SET name = 'リオハ グラン レゼルバ' WHERE name_en = 'Rioja Gran Reserva';
UPDATE products SET name = 'コート・デュ・ローヌ' WHERE name_en = 'Côtes du Rhône Rouge';
UPDATE products SET name = 'ピノ・ノワール ブルゴーニュ' WHERE name_en = 'Pinot Noir Bourgogne';
UPDATE products SET name = 'バルバレスコ 2020' WHERE name_en = 'Barbaresco 2020';
UPDATE products SET name = 'キアンティ クラッシコ' WHERE name_en = 'Chianti Classico DOCG';
UPDATE products SET name = 'カッシェロ・デル・ディアブロ カベルネ・ソーヴィニヨン' WHERE name_en = 'Casillero del Diablo Cabernet Sauvignon';
UPDATE products SET name = 'コノスル ピノ・ノワール レゼルヴァ' WHERE name_en = 'Cono Sur Pinot Noir Reserva';
UPDATE products SET name = 'マルケス・デ・カセレス リオハ ティント' WHERE name_en = 'Marqués de Cáceres Rioja Tinto';
UPDATE products SET name = 'ムートン・カデ ルージュ ボルドー' WHERE name_en = 'Mouton Cadet Rouge Bordeaux';
UPDATE products SET name = 'ヤルンバ サミュエルズ コレクション シラーズ' WHERE name_en = 'Yalumba Samuel''s Collection Shiraz';
UPDATE products SET name = 'アマローネ' WHERE name_en = 'Amarone della Valpolicella';

-- 白ワイン
UPDATE products SET name = 'シャブリ プルミエクリュ' WHERE name_en = 'Chablis 1er Cru';
UPDATE products SET name = 'プイィ・フュメ' WHERE name_en = 'Pouilly-Fumé';
UPDATE products SET name = 'ソーヴィニヨン・ブラン ニュージーランド' WHERE name_en = 'Sauvignon Blanc NZ';
UPDATE products SET name = 'リースリング アルザス' WHERE name_en = 'Riesling Alsace';
UPDATE products SET name = 'シャルドネ ブルゴーニュ' WHERE name_en = 'Chardonnay Bourgogne';
UPDATE products SET name = 'ゲヴュルツトラミネール' WHERE name_en = 'Gewurztraminer';
UPDATE products SET name = 'ヴェルデホ ルエダ' WHERE name_en = 'Verdejo Rueda';
UPDATE products SET name = 'ソーテルヌ' WHERE name_en = 'Sauternes';
UPDATE products SET name = 'ポルト' WHERE name_en = 'Port Wine';
UPDATE products SET name = 'バローネ ヴェルナッチャ' WHERE name_en = 'Vernaccia di San Gimignano';
UPDATE products SET name = 'グリューナー フェルトリナー' WHERE name_en = 'Grüner Veltliner';
UPDATE products SET name = 'アンリ・ブルジョワ サンセール ブラン' WHERE name_en = 'Henri Bourgeois Sancerre Blanc';
UPDATE products SET name = 'ドメーヌ・ラロッシュ シャブリ サン・マルタン' WHERE name_en = 'Domaine Laroche Chablis Saint Martin';
UPDATE products SET name = 'マルケス・デ・リスカル ルエダ ヴェルデホ' WHERE name_en = 'Marqués de Riscal Rueda Verdejo';
UPDATE products SET name = 'クロ・デュ・ヴァル シャルドネ ナパ' WHERE name_en = 'Clos du Val Chardonnay Napa';
UPDATE products SET name = 'クナップスタイン リースリング クレア・ヴァレー' WHERE name_en = 'Knappstein Riesling Clare Valley';
UPDATE products SET name = 'オレンジワイン ジョージア' WHERE name_en = 'Georgian Amber Wine';
UPDATE products SET name = 'ナチュラルワイン フランス' WHERE name_en = 'Natural Wine France';

-- ロゼワイン
UPDATE products SET name = 'プロヴァンス ロゼ' WHERE name_en = 'Provence Rosé';
UPDATE products SET name = 'バンドール ロゼ' WHERE name_en = 'Bandol Rosé';
UPDATE products SET name = 'ミラヴァル プロヴァンス ロゼ' WHERE name_en = 'Miraval Provence Rosé';
UPDATE products SET name = 'シャトー・ダキエリア タヴェル ロゼ' WHERE name_en = 'Château d''Aqueria Tavel Rosé';
UPDATE products SET name = 'アンティノリ サンタ・クリスティーナ ロザート' WHERE name_en = 'Antinori Santa Cristina Rosato';
UPDATE products SET name = 'コノスル ロゼ オルガニコ' WHERE name_en = 'Cono Sur Rosé Orgánico';
UPDATE products SET name = 'ベタニー エステート ロゼ' WHERE name_en = 'Bethany Estate Rosé';

-- ビール
UPDATE products SET name = 'アサヒ スーパードライ' WHERE name_en = 'Asahi Super Dry';
UPDATE products SET name = 'スーパードライ 生ジョッキ缶' WHERE name_en = 'Asahi Super Dry Jokki';
UPDATE products SET name = 'キリン一番搾り' WHERE name_en = 'Kirin Ichiban';
UPDATE products SET name = 'サッポロ 黒ラベル' WHERE name_en = 'Sapporo Black Label';
UPDATE products SET name = 'ヱビスビール' WHERE name_en = 'Yebisu Beer';
UPDATE products SET name = 'エビス プレミアム' WHERE name_en = 'Yebisu Premium';
UPDATE products SET name = 'プレミアム モルツ' WHERE name_en = 'The Premium Malt''s';
UPDATE products SET name = 'ギネス ドラフト缶' WHERE name_en = 'Guinness Draught';
UPDATE products SET name = 'コロナ エキストラ' WHERE name_en = 'Corona Extra';
UPDATE products SET name = 'ハイネケン' WHERE name_en = 'Heineken';
UPDATE products SET name = 'ヒューガルデン ホワイト' WHERE name_en = 'Hoegaarden White';
UPDATE products SET name = 'デュベル' WHERE name_en = 'Duvel';
UPDATE products SET name = 'ヴェデット エクストラ ホワイト' WHERE name_en = 'Vedett Extra White';
UPDATE products SET name = 'クラフトビール アイピーエー' WHERE name_en = 'Craft Beer IPA';
UPDATE products SET name = 'クラフトビール スタウト' WHERE name_en = 'Craft Beer Stout';
UPDATE products SET name = 'よなよなエール' WHERE name_en = 'Yona Yona Ale';
UPDATE products SET name = 'ブルックリン ラガー' WHERE name_en = 'Brooklyn Lager';
UPDATE products SET name = 'アンカー スチーム ビール' WHERE name_en = 'Anchor Steam Beer';
UPDATE products SET name = 'ペローニ ナストロ アズッロ' WHERE name_en = 'Peroni Nastro Azzurro';
UPDATE products SET name = 'インドの青鬼 アイピーエー' WHERE name_en = 'Yoho India Blue Ogre IPA';

-- ソフトドリンク / ミキサー
UPDATE products SET name = 'フィーバーツリー プレミアム トニック' WHERE name_en = 'Fever-Tree Premium Tonic';
UPDATE products SET name = 'フィーバーツリー ジンジャービア' WHERE name_en = 'Fever-Tree Ginger Beer';
UPDATE products SET name = 'フィーバーツリー ジンジャーエール' WHERE name_en = 'Fever-Tree Ginger Ale';
UPDATE products SET name = 'サンペレグリノ スパークリング' WHERE name_en = 'S.Pellegrino Sparkling';
UPDATE products SET name = 'ペリエ' WHERE name_en = 'Perrier';
UPDATE products SET name = 'コーラ（コカ・コーラ）' WHERE name_en = 'Coca-Cola';
UPDATE products SET name = 'ジンジャーエール 国産' WHERE name_en = 'Ginger Ale';
UPDATE products SET name = 'オレンジジュース' WHERE name_en = 'Orange Juice';
UPDATE products SET name = 'オレンジジュース（100%）' WHERE name_en = 'Orange Juice 100%';
UPDATE products SET name = 'グレープフルーツジュース' WHERE name_en = 'Grapefruit Juice';
UPDATE products SET name = 'グレープフルーツジュース（100%）' WHERE name_en = 'Grapefruit Juice 100%';
UPDATE products SET name = 'クランベリージュース' WHERE name_en = 'Cranberry Juice';
UPDATE products SET name = 'ライム果汁（業務用）' WHERE name_en = 'Lime Juice';
UPDATE products SET name = 'パイナップルジュース' WHERE name_en = 'Pineapple Juice';
UPDATE products SET name = 'レモン果汁（業務用）' WHERE name_en = 'Lemon Juice';
UPDATE products SET name = 'マンゴージュース' WHERE name_en = 'Mango Juice';
UPDATE products SET name = 'ピーチネクター' WHERE name_en = 'Peach Nectar';
UPDATE products SET name = 'トマトジュース' WHERE name_en = 'Tomato Juice';
UPDATE products SET name = 'ソーダウォーター（ウィルキンソン）' WHERE name_en = 'Soda Water';
UPDATE products SET name = 'トニックウォーター（フィーバーツリー）' WHERE name_en = 'Tonic Water Fever-Tree';
UPDATE products SET name = 'ジンジャーエール（カナダドライ）' WHERE name_en = 'Ginger Ale Canada Dry';
UPDATE products SET name = 'ジンジャービア（フィーバーツリー）' WHERE name_en = 'Ginger Beer Fever-Tree';
UPDATE products SET name = 'ココナッツミルク' WHERE name_en = 'Coconut Milk';
UPDATE products SET name = 'グレナデンシロップ' WHERE name_en = 'Grenadine Syrup';
UPDATE products SET name = 'シュガーシロップ（ガムシロップ）' WHERE name_en = 'Simple Syrup';
UPDATE products SET name = 'アガベシロップ' WHERE name_en = 'Agave Syrup';
UPDATE products SET name = 'ハニーシロップ' WHERE name_en = 'Honey Syrup';
UPDATE products SET name = 'オルジェ アーモンドシロップ（モナン）' WHERE name_en = 'Orgeat Almond Syrup Monin';

-- フルーツ / その他材料
UPDATE products SET name = 'ライム' WHERE name_en = 'Lime';
UPDATE products SET name = 'レモン' WHERE name_en = 'Lemon';
UPDATE products SET name = 'オレンジ' WHERE name_en = 'Orange';
UPDATE products SET name = 'マラスキーノチェリー' WHERE name_en = 'Maraschino Cherry';
UPDATE products SET name = 'フレッシュミント' WHERE name_en = 'Fresh Mint';
UPDATE products SET name = 'グリーンオリーブ' WHERE name_en = 'Green Olive';
UPDATE products SET name = '卵白' WHERE name_en = 'Egg White';
UPDATE products SET name = 'コーシャーソルト（縁塩用）' WHERE name_en = 'Kosher Salt';
UPDATE products SET name = 'エスプレッソ（1ショット分）' WHERE name_en = 'Espresso Shot';
UPDATE products SET name = 'ライトクリーム（生クリーム）' WHERE name_en = 'Light Cream';
