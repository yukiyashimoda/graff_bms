-- product-images バケット作成
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 認証済みユーザーはアップロード可
CREATE POLICY "auth upload product images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images');

-- 全員が参照可（公開メニュー用）
CREATE POLICY "public read product images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'product-images');

-- 認証済みユーザーは削除可
CREATE POLICY "auth delete product images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images');
