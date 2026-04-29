import { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DraggablePatch } from './components/DraggablePatch';
import { JeansCanvas } from './components/JeansCanvas';
import { SuccessModal } from './components/SuccessModal';
import { supabase } from '../lib/supabaseClient';

// ── Patches (local assets) ───────────────────────────────────────────────
const AVAILABLE_PATCHES = [
  { id: 'patch-1', name: 'Flower',    price: 8.50,  imageUrl: '/patches/flower.png' },
  { id: 'patch-2', name: 'Star',      price: 6.00,  imageUrl: '/patches/star.png' },
  { id: 'patch-3', name: 'Peace',     price: 7.50,  imageUrl: '/patches/peace.png' },
  { id: 'patch-4', name: 'Moon',      price: 9.00,  imageUrl: '/patches/moon.png' },
  { id: 'patch-5', name: 'Heart',     price: 5.50,  imageUrl: '/patches/heart.png' },
  { id: 'patch-6', name: 'Butterfly', price: 10.00, imageUrl: '/patches/butterfly.png' },
];

const BASE_JEANS_PRICE = 45.00;

interface PlacedPatch {
  id: string;
  patchId: string;
  name: string;
  price: number;
  imageUrl: string;
  x: number; // percentage
  y: number; // percentage
}

// ── Colour tokens ────────────────────────────────────────────────────────
const C = {
  bg:          '#FFFBEB',   // warm cream-yellow page background
  panel:       '#FFF8D6',   // right panel
  navBg:       '#FFFDE7',   // navbar
  border:      '#FDE68A',   // yellow border
  borderSoft:  '#FEF3C7',   // softer border
  accent:      '#F59E0B',   // amber highlight
  accentDark:  '#92400E',   // dark amber text
  accentMid:   '#B45309',   // medium amber text
  accentLight: '#A16207',   // lighter amber
  textPrimary: '#1C1917',
  textMuted:   '#78716C',
  green:       '#A8B5A0',   // sage green (finalize button)
  greenDark:   '#6B7C65',
  white:       '#FFFFFF',
};

export default function App() {
  const [placedPatches, setPlacedPatches]   = useState<PlacedPatch[]>([]);
  const [showModal, setShowModal]           = useState(false);
  const [designId, setDesignId]             = useState('');
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [baseSize, setBaseSize]             = useState<'S' | 'M' | 'L'>('M');

  const totalPrice = BASE_JEANS_PRICE + placedPatches.reduce((sum, p) => sum + p.price, 0);

  const handlePatchAdded = (patch: PlacedPatch) =>
    setPlacedPatches((prev) => [...prev, patch]);

  const handleRemovePatch = (id: string) =>
    setPlacedPatches((prev) => prev.filter((p) => p.id !== id));

  // Repositioning after placement
  const handleMovePatch = (id: string, x: number, y: number) =>
    setPlacedPatches((prev) => prev.map((p) => (p.id === id ? { ...p, x, y } : p)));

  // ── Supabase save ────────────────────────────────────────────────────
  const handleFinalizeDesign = async () => {
    if (placedPatches.length === 0) return;
    setError(null);
    setIsSubmitting(true);
    setDesignId('');
    setShowModal(true);

    try {
      const { data: designRow, error: designError } = await supabase
        .from('designs')
        .insert({ base_size: baseSize, total_price: totalPrice })
        .select('id, design_id')
        .single();

      if (designError) throw designError;

      const { error: patchError } = await supabase
        .from('design_patches')
        .insert(
          placedPatches.map((p) => ({
            design_id:       designRow.id,
            patch_id:        p.patchId,
            coord_x_percent: p.x,
            coord_y_percent: p.y,
          }))
        );

      if (patchError) throw patchError;
      setDesignId(designRow.design_id);
    } catch (err) {
      console.error('[Supabase] Error:', err);
      setShowModal(false);
      const fallback = `PATCH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      setDesignId(fallback);
      setShowModal(true);
      setError('Could not save to database — a local ID was generated instead.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Inter', sans-serif" }}>

        {/* ── Navbar ──────────────────────────────────────────────── */}
        <nav style={{
          padding: '0 32px',
          height: 68,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: C.navBg,
          borderBottom: `1.5px solid ${C.border}`,
          boxShadow: '0 2px 12px rgba(180,130,30,0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #FCD34D, #F59E0B)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(245,158,11,0.35)',
              fontSize: '0.8rem', fontWeight: 700, color: 'white',
            }}>
              RJ
            </div>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', color: C.accentDark, letterSpacing: '-0.01em' }}>
              ReThreaded
            </span>
            <span style={{
              fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em',
              color: C.accentLight, background: C.borderSoft,
              border: `1px solid ${C.border}`, borderRadius: 99,
              padding: '2px 8px', textTransform: 'uppercase',
            }}>
              Custom Denim
            </span>
          </div>

          {/* Size selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.8rem', color: C.accentLight, fontWeight: 500 }}>Size:</span>
            {(['S', 'M', 'L'] as const).map((size) => (
              <button
                key={size}
                id={`size-btn-${size}`}
                onClick={() => setBaseSize(size)}
                aria-pressed={baseSize === size}
                aria-label={`Select size ${size}`}
                style={{
                  width: 34, height: 34, borderRadius: '50%',
                  border: `1.5px solid ${baseSize === size ? C.accent : C.border}`,
                  background: baseSize === size
                    ? 'linear-gradient(135deg, #FCD34D, #F59E0B)'
                    : C.navBg,
                  color: baseSize === size ? 'white' : C.accentMid,
                  fontWeight: 600, fontSize: '0.8rem',
                  cursor: 'pointer',
                  boxShadow: baseSize === size ? '0 2px 8px rgba(245,158,11,0.3)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {size}
              </button>
            ))}
          </div>

          {/* Price pill */}
          <div style={{
            padding: '8px 20px',
            background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
            border: `1.5px solid ${C.border}`,
            borderRadius: 99,
            boxShadow: '0 2px 8px rgba(180,130,30,0.1)',
          }}>
            <span style={{ fontSize: '0.8rem', color: C.accentLight }}>Total: </span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: C.accentDark }}>
              RM {totalPrice.toFixed(2)}
            </span>
          </div>
        </nav>

        {/* ── Hero tagline strip ───────────────────────────────────── */}
        <div style={{
          textAlign: 'center',
          padding: '10px 0 6px',
          background: `repeating-linear-gradient(
            90deg,
            transparent,
            transparent 20px,
            rgba(253, 230, 138, 0.3) 20px,
            rgba(253, 230, 138, 0.3) 21px
          )`,
          borderBottom: `1px solid ${C.borderSoft}`,
        }}>
          <p style={{ margin: 0, fontSize: '0.75rem', color: C.accentMid, letterSpacing: '0.12em', fontWeight: 500 }}>
            ✦ &nbsp; DRAG • PLACE • CUSTOMISE • CHECKOUT &nbsp; ✦
          </p>
        </div>

        {/* ── Main layout ──────────────────────────────────────────── */}
        <div style={{ display: 'flex', height: 'calc(100vh - 98px)' }}>

          {/* Left — Canvas */}
          <div style={{ flex: '0 0 60%', padding: '20px 16px 20px 24px', display: 'flex', flexDirection: 'column' }}>
            <JeansCanvas
              placedPatches={placedPatches}
              onPatchAdded={handlePatchAdded}
              onRemovePatch={handleRemovePatch}
              onMovePatch={handleMovePatch}
            />
          </div>

          {/* Divider */}
          <div style={{ width: 1, background: C.border, margin: '16px 0' }} />

          {/* Right — Inventory */}
          <div style={{
            flex: '0 0 40%',
            display: 'flex',
            flexDirection: 'column',
            padding: '20px 24px 20px 16px',
            background: C.panel,
          }}>
            {/* Panel header */}
            <div style={{ marginBottom: 16 }}>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '1.3rem',
                color: C.accentDark,
                margin: '0 0 4px',
              }}>
                Choose Your Patches
              </h2>
              <p style={{ margin: 0, fontSize: '0.78rem', color: C.accentLight }}>
                Each patch is hand-applied to your upcycled denim ✦
              </p>
            </div>

            {/* Patch grid */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {AVAILABLE_PATCHES.map((patch) => (
                  <DraggablePatch
                    key={patch.id}
                    id={patch.id}
                    name={patch.name}
                    price={patch.price}
                    imageUrl={patch.imageUrl}
                  />
                ))}
              </div>
            </div>

            {/* Bottom action area */}
            <div style={{
              marginTop: 16,
              paddingTop: 16,
              borderTop: `1.5px solid ${C.border}`,
            }}>
              {/* Error alert */}
              {error && (
                <div style={{
                  marginBottom: 12,
                  padding: '10px 14px',
                  background: '#FEF3C7',
                  border: '1px solid #FCD34D',
                  borderRadius: 10,
                  fontSize: '0.78rem',
                  color: '#78350F',
                }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Placed patch summary */}
              {placedPatches.length > 0 && (
                <div style={{
                  marginBottom: 14,
                  padding: '10px 14px',
                  background: C.borderSoft,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                }}>
                  {placedPatches.map((p) => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: C.accentMid, marginBottom: 3 }}>
                      <span>✦ {p.name}</span>
                      <span>+RM {p.price.toFixed(2)}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: C.accentDark, fontWeight: 600 }}>
                    <span>Base jeans ({baseSize})</span>
                    <span>RM {BASE_JEANS_PRICE.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Finalize button */}
              <button
                id="finalize-design-btn"
                onClick={handleFinalizeDesign}
                disabled={placedPatches.length === 0 || isSubmitting}
                style={{
                  width: '100%',
                  padding: '15px',
                  borderRadius: 14,
                  border: 'none',
                  background: placedPatches.length > 0
                    ? 'linear-gradient(135deg, #86EFAC, #4ADE80)'
                    : '#E7E5E4',
                  color: placedPatches.length > 0 ? '#14532D' : '#A8A29E',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: placedPatches.length > 0 && !isSubmitting ? 'pointer' : 'not-allowed',
                  boxShadow: placedPatches.length > 0
                    ? '0 4px 16px rgba(74, 222, 128, 0.35)'
                    : 'none',
                  transition: 'all 0.2s ease',
                  letterSpacing: '0.02em',
                }}
                onMouseEnter={(e) => {
                  if (placedPatches.length > 0)
                    (e.currentTarget as HTMLButtonElement).style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = '1';
                }}
              >
                {isSubmitting ? '⏳ Saving Design…' : '✦ Finalize My Design'}
              </button>

              {placedPatches.length === 0 && (
                <p style={{ textAlign: 'center', fontSize: '0.72rem', color: C.accentLight, marginTop: 8 }}>
                  Add at least one patch to continue
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Modal ──────────────────────────────────────────────── */}
        <SuccessModal
          isOpen={showModal}
          onClose={() => { if (!isSubmitting) setShowModal(false); }}
          designId={designId}
        />
      </div>
    </DndProvider>
  );
}