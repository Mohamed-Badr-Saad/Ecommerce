-- The storefront uses Prisma on the trusted server, not Supabase's public Data API.
-- RLS with no public policies keeps application rows closed to anon/authenticated roles.
DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'users', 'sessions', 'accounts', 'verifications', 'categories', 'products',
    'product_variants', 'product_images', 'product_tags', 'product_collections',
    'reviews', 'orders', 'order_items', 'payments', 'payment_attempts', 'carts',
    'cart_items', 'addresses', 'wishlists', 'wishlist_items', 'media', 'banners',
    'policy_pages', 'admin_activity_logs', 'store_settings',
    '_ProductToProductTag', '_ProductToProductCollection'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', table_name);
  END LOOP;
END $$;

-- Supabase Storage is absent in plain local PostgreSQL, so create the bucket only
-- when this migration is deployed to a hosted Supabase database.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'storage') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'talie-catalog',
      'talie-catalog',
      true,
      6291456,
      ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
    )
    ON CONFLICT (id) DO UPDATE SET
      public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;
  END IF;
END $$;
