-- service_role によるストレージ操作を許可（サーバーアクション経由のアップロード用）
CREATE POLICY "service role upload product images"
  ON storage.objects FOR INSERT TO service_role
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "service role update product images"
  ON storage.objects FOR UPDATE TO service_role
  USING (bucket_id = 'product-images');

CREATE POLICY "service role delete product images"
  ON storage.objects FOR DELETE TO service_role
  USING (bucket_id = 'product-images');
