-- Migration: Add latitude/longitude columns to posts table
-- Aman dijalankan berulang kali (idempotent)

-- 1. Tambah kolom from_lat (jika belum ada)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'from_lat'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN from_lat numeric;
  END IF;
END $$;

-- 2. Tambah kolom from_lng (jika belum ada)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'from_lng'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN from_lng numeric;
  END IF;
END $$;

-- 3. Tambah kolom to_lat (jika belum ada)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'to_lat'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN to_lat numeric;
  END IF;
END $$;

-- 4. Tambah kolom to_lng (jika belum ada)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'to_lng'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN to_lng numeric;
  END IF;
END $$;

-- 5. Tambah komentar (aman dijalankan ulang)
COMMENT ON COLUMN public.posts.from_lat IS 'Latitude of departure location';
COMMENT ON COLUMN public.posts.from_lng IS 'Longitude of departure location';
COMMENT ON COLUMN public.posts.to_lat IS 'Latitude of destination location';
COMMENT ON COLUMN public.posts.to_lng IS 'Longitude of destination location';

-- 6. Buat index (jika belum ada)
CREATE INDEX IF NOT EXISTS idx_posts_from_coords ON public.posts (from_lat, from_lng) WHERE from_lat IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_to_coords ON public.posts (to_lat, to_lng) WHERE to_lat IS NOT NULL;
