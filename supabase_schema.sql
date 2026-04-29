-- ============================================================
-- Upcycled Jeans Customizer — Supabase Database Schema
-- Run this in your Supabase project's SQL Editor
-- ============================================================

-- Enable pgcrypto for gen_random_uuid() if not already enabled
create extension if not exists pgcrypto;

-- ============================================================
-- TABLE: designs
-- Stores each finalized design session
-- ============================================================
create table if not exists designs (
  id           uuid        primary key default gen_random_uuid(),
  design_id    text        unique not null,   -- e.g. "PATCH-A1B2C3"
  base_size    text        not null default 'M', -- S, M, L
  total_price  decimal(10, 2) not null,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- TABLE: design_patches
-- Stores each patch applied to a design, with % coordinates
-- ============================================================
create table if not exists design_patches (
  id              uuid    primary key default gen_random_uuid(),
  design_id       uuid    not null references designs(id) on delete cascade,
  patch_id        text    not null,   -- matches local asset identifier, e.g. "patch-1"
  coord_x_percent float   not null,   -- 0.0 – 100.0
  coord_y_percent float   not null    -- 0.0 – 100.0
);

-- ============================================================
-- FUNCTION + TRIGGER: Auto-generate human-readable design_id
-- Generates a value like "PATCH-A1B2C3" on INSERT
-- ============================================================
create or replace function generate_design_id()
returns trigger as $$
begin
  new.design_id := 'PATCH-' || upper(substring(md5(new.id::text) from 1 for 6));
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_generate_design_id on designs;
create trigger trg_generate_design_id
  before insert on designs
  for each row
  execute procedure generate_design_id();

-- ============================================================
-- ROW LEVEL SECURITY (optional but recommended)
-- Allows anonymous inserts (for the web app) while keeping reads restricted
-- ============================================================
alter table designs        enable row level security;
alter table design_patches enable row level security;

-- Allow anon role to insert new designs
create policy "Allow anon insert on designs"
  on designs for insert
  to anon
  with check (true);

-- Allow anon role to insert design patches
create policy "Allow anon insert on design_patches"
  on design_patches for insert
  to anon
  with check (true);

-- Allow anon to read their own designs (by design_id text)
create policy "Allow anon read designs"
  on designs for select
  to anon
  using (true);

-- ============================================================
-- Done! Go to Supabase Dashboard → Table Editor to verify.
-- ============================================================
