export const BASE_JEANS_PRICE = 45.00;

export type PatchSide = 'front' | 'back';

// ── Legacy map for designs saved before the DB-driven patches ────────────
// Old designs stored patch_id as 'patch-1' through 'patch-6'.
// This mapping lets the admin viewer still render those old designs.
export const LEGACY_PATCH_MAP: Record<string, { name: string; imageUrl: string }> = {
  'patch-1': { name: 'Flower',    imageUrl: '/patches/flower.png' },
  'patch-2': { name: 'Star',      imageUrl: '/patches/star.png' },
  'patch-3': { name: 'Peace',     imageUrl: '/patches/peace.png' },
  'patch-4': { name: 'Moon',      imageUrl: '/patches/moon.png' },
  'patch-5': { name: 'Heart',     imageUrl: '/patches/heart.png' },
  'patch-6': { name: 'Butterfly', imageUrl: '/patches/butterfly.png' },
};

// ── Patch type as returned from Supabase ─────────────────────────────────
export interface PatchRecord {
  id: string;
  name: string;
  price: number;
  image_url: string;
  is_available: boolean;
  created_at: string;
}
