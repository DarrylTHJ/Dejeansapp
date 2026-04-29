// Shared patch catalogue — used by both the customer app and the admin viewer
export const AVAILABLE_PATCHES = [
  { id: 'patch-1', name: 'Flower',    price: 8.50,  imageUrl: '/patches/flower.png' },
  { id: 'patch-2', name: 'Star',      price: 6.00,  imageUrl: '/patches/star.png' },
  { id: 'patch-3', name: 'Peace',     price: 7.50,  imageUrl: '/patches/peace.png' },
  { id: 'patch-4', name: 'Moon',      price: 9.00,  imageUrl: '/patches/moon.png' },
  { id: 'patch-5', name: 'Heart',     price: 5.50,  imageUrl: '/patches/heart.png' },
  { id: 'patch-6', name: 'Butterfly', price: 10.00, imageUrl: '/patches/butterfly.png' },
] as const;

export const BASE_JEANS_PRICE = 45.00;

export type PatchSide = 'front' | 'back';

// Quick lookup: patch_id → imageUrl (for admin viewer)
export const PATCH_IMAGE_MAP: Record<string, string> = Object.fromEntries(
  AVAILABLE_PATCHES.map((p) => [p.id, p.imageUrl])
);
