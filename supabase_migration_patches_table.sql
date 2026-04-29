-- ============================================================
-- Migration: patches table + Supabase Storage setup instructions
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Table: patches
-- Stores all available patch products managed by the seller
CREATE TABLE IF NOT EXISTS patches (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        NOT NULL,
  price        DECIMAL(10, 2) NOT NULL,
  image_url    TEXT        NOT NULL,    -- public URL from Supabase Storage
  is_available BOOLEAN     NOT NULL DEFAULT true,  -- false = sold out / hidden
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security
ALTER TABLE patches ENABLE ROW LEVEL SECURITY;

-- Anon users (customer app) can read all patches
CREATE POLICY "Allow anon read patches"
  ON patches FOR SELECT
  TO anon
  USING (true);

-- Anon users (admin page) can insert patches
CREATE POLICY "Allow anon insert patches"
  ON patches FOR INSERT
  TO anon
  WITH CHECK (true);

-- Anon users (admin page) can update patches (e.g. toggle availability)
CREATE POLICY "Allow anon update patches"
  ON patches FOR UPDATE
  TO anon
  USING (true);

-- Anon users (admin page) can delete patches
CREATE POLICY "Allow anon delete patches"
  ON patches FOR DELETE
  TO anon
  USING (true);

-- ============================================================
-- IMPORTANT: Supabase Storage Setup (do this in the Dashboard)
-- ============================================================
-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "New Bucket"
-- 3. Name: patches
-- 4. Check "Public bucket" → Create
--
-- This allows patch images to be publicly accessible via URL.
-- ============================================================

-- ============================================================
-- Seed: Insert the 6 original AI-generated patches
-- (Only run this if you want to pre-populate the DB)
-- Replace the image_url values with your actual public URLs
-- from Supabase Storage after uploading the files there.
-- ============================================================
-- INSERT INTO patches (name, price, image_url) VALUES
--   ('Flower',    8.50,  'https://pfpgtykwbpajdottjnkd.supabase.co/storage/v1/object/public/patches/flower.png'),
--   ('Star',      6.00,  'https://pfpgtykwbpajdottjnkd.supabase.co/storage/v1/object/public/patches/star.png'),
--   ('Peace',     7.50,  'https://pfpgtykwbpajdottjnkd.supabase.co/storage/v1/object/public/patches/peace.png'),
--   ('Moon',      9.00,  'https://pfpgtykwbpajdottjnkd.supabase.co/storage/v1/object/public/patches/moon.png'),
--   ('Heart',     5.50,  'https://pfpgtykwbpajdottjnkd.supabase.co/storage/v1/object/public/patches/heart.png'),
--   ('Butterfly', 10.00, 'https://pfpgtykwbpajdottjnkd.supabase.co/storage/v1/object/public/patches/butterfly.png');
