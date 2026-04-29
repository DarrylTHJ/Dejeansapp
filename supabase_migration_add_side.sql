-- ============================================================
-- Migration: Add 'side' column to design_patches
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Add side column (defaults to 'front' so existing rows are unaffected)
ALTER TABLE design_patches
  ADD COLUMN IF NOT EXISTS side TEXT NOT NULL DEFAULT 'front'
  CHECK (side IN ('front', 'back'));

-- Allow anon to read design_patches (needed for admin viewer)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'design_patches'
      AND policyname = 'Allow anon read design_patches'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Allow anon read design_patches"
        ON design_patches FOR SELECT
        TO anon
        USING (true);
    $policy$;
  END IF;
END $$;

-- ============================================================
-- Done! Existing records default to side = 'front'.
-- ============================================================
