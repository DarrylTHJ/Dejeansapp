import { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Loader2 } from 'lucide-react';
import { DraggablePatch } from './components/DraggablePatch';
import { JeansCanvas } from './components/JeansCanvas';
import { SuccessModal } from './components/SuccessModal';
import { supabase } from '../lib/supabaseClient';
import { BASE_JEANS_PRICE } from './constants/patches';
import type { PatchSide, PatchRecord } from './constants/patches';

interface PlacedPatch {
  id: string;
  patchId: string;
  name: string;
  price: number;
  imageUrl: string;
  x: number;
  y: number;
  side: PatchSide;
}

const C = {
  bg: '#FFFBEB', panel: '#FFF8D6', navBg: '#FFFDE7',
  border: '#FDE68A', borderSoft: '#FEF3C7',
  accent: '#F59E0B', accentDark: '#92400E', accentMid: '#B45309', accentLight: '#A16207',
};

export default function App() {
  // ── Patches from DB ─────────────────────────────────────────────────
  const [availablePatches, setAvailablePatches] = useState<PatchRecord[]>([]);
  const [patchesLoading, setPatchesLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('patches')
      .select('id, name, price, image_url, is_available, created_at')
      .eq('is_available', true)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setAvailablePatches(data as PatchRecord[]);
        setPatchesLoading(false);
      });
  }, []);

  // ── Design state ─────────────────────────────────────────────────────
  const [placedPatches, setPlacedPatches] = useState<PlacedPatch[]>([]);
  const [currentSide, setCurrentSide] = useState<PatchSide>('front');
  const [showModal, setShowModal] = useState(false);
  const [designId, setDesignId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [baseSize, setBaseSize] = useState<'S' | 'M' | 'L'>('M');

  const totalPrice = BASE_JEANS_PRICE + placedPatches.reduce((sum, p) => sum + p.price, 0);

  const handlePatchAdded = (patch: PlacedPatch) => setPlacedPatches((prev) => [...prev, patch]);
  const handleRemovePatch = (id: string) => setPlacedPatches((prev) => prev.filter((p) => p.id !== id));
  const handleMovePatch = (id: string, x: number, y: number) =>
    setPlacedPatches((prev) => prev.map((p) => (p.id === id ? { ...p, x, y } : p)));
  const handleFlipSide = () =>
    setCurrentSide((s) => (s === 'front' ? 'back' : 'front'));

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
            design_id: designRow.id,
            patch_id: p.patchId,   // UUID from patches table
            coord_x_percent: p.x,
            coord_y_percent: p.y,
            side: p.side,
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

  const frontCount = placedPatches.filter((p) => p.side === 'front').length;
  const backCount = placedPatches.filter((p) => p.side === 'back').length;

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Inter', sans-serif" }}>

        {/* ── Navbar ─────────────────────────────────────────── */}
        <nav style={{
          padding: '0 32px', height: 68, display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
          background: C.navBg, borderBottom: `1.5px solid ${C.border}`,
          boxShadow: '0 2px 12px rgba(180,130,30,0.08)',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg,#FCD34D,#F59E0B)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(245,158,11,0.35)',
              fontSize: '0.8rem', fontWeight: 700, color: 'white',
            }}>RJ</div>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', color: C.accentDark }}>
              Customize your jeans now!
            </span>
            <span style={{
              fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em',
              color: C.accentLight, background: C.borderSoft,
              border: `1px solid ${C.border}`, borderRadius: 99,
              padding: '2px 8px', textTransform: 'uppercase',
            }}>Custom Denim</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.8rem', color: C.accentLight, fontWeight: 500 }}>Size:</span>
            {(['S', 'M', 'L'] as const).map((size) => (
              <button
                key={size} id={`size-btn-${size}`}
                onClick={() => setBaseSize(size)} aria-pressed={baseSize === size}
                style={{
                  width: 34, height: 34, borderRadius: '50%',
                  border: `1.5px solid ${baseSize === size ? C.accent : C.border}`,
                  background: baseSize === size ? 'linear-gradient(135deg,#FCD34D,#F59E0B)' : C.navBg,
                  color: baseSize === size ? 'white' : C.accentMid,
                  fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                  boxShadow: baseSize === size ? '0 2px 8px rgba(245,158,11,0.3)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >{size}</button>
            ))}
          </div>

          <div style={{
            padding: '8px 20px',
            background: 'linear-gradient(135deg,#FEF3C7,#FDE68A)',
            border: `1.5px solid ${C.border}`, borderRadius: 99,
            boxShadow: '0 2px 8px rgba(180,130,30,0.1)',
          }}>
            <span style={{ fontSize: '0.8rem', color: C.accentLight }}>Total: </span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: C.accentDark }}>
              RM {totalPrice.toFixed(2)}
            </span>
          </div>
        </nav>

        {/* ── Tagline strip ──────────────────────────────────── */}
        <div style={{
          textAlign: 'center', padding: '8px 0',
          background: `repeating-linear-gradient(90deg,transparent,transparent 20px,rgba(253,230,138,0.3) 20px,rgba(253,230,138,0.3) 21px)`,
          borderBottom: `1px solid ${C.borderSoft}`,
        }}>
          <p style={{ margin: 0, fontSize: '0.72rem', color: C.accentMid, letterSpacing: '0.12em', fontWeight: 500 }}>
            ✦ &nbsp; DRAG • PLACE • FLIP • CUSTOMISE • CHECKOUT &nbsp; ✦
          </p>
        </div>

        {/* ── Main layout ────────────────────────────────────── */}
        <div style={{ display: 'flex', height: 'calc(100vh - 96px)' }}>

          {/* Left — Canvas */}
          <div style={{ flex: '0 0 60%', padding: '16px 16px 16px 24px', display: 'flex', flexDirection: 'column' }}>
            <JeansCanvas
              placedPatches={placedPatches}
              currentSide={currentSide}
              onPatchAdded={handlePatchAdded}
              onRemovePatch={handleRemovePatch}
              onMovePatch={handleMovePatch}
              onFlipSide={handleFlipSide}
            />
          </div>

          <div style={{ width: 1, background: C.border, margin: '16px 0' }} />

          {/* Right — Patch Inventory */}
          <div style={{
            flex: '0 0 40%', display: 'flex', flexDirection: 'column',
            padding: '16px 24px 16px 16px', background: C.panel,
          }}>
            <div style={{ marginBottom: 14 }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', color: C.accentDark, margin: '0 0 3px' }}>
                Choose Your Patches
              </h2>
              <p style={{ margin: 0, fontSize: '0.75rem', color: C.accentLight }}>
                Each patch is hand-applied to your upcycled denim ✦
              </p>
            </div>

            {/* Patch grid */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
              {patchesLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 10 }}>
                  <Loader2 size={28} color={C.accentLight} style={{ animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: '0.8rem', color: C.accentLight }}>Loading patches…</span>
                </div>
              ) : availablePatches.length === 0 ? (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: '100%', flexDirection: 'column', gap: 8,
                  textAlign: 'center', padding: 20,
                }}>
                  <span style={{ fontSize: '2rem' }}>🪡</span>
                  <span style={{ fontSize: '0.85rem', color: C.accentLight, fontWeight: 500 }}>No patches available</span>
                  <span style={{ fontSize: '0.72rem', color: '#D97706' }}>
                    Stay tuned for more soon!
                  </span>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {availablePatches.map((patch) => (
                    <DraggablePatch
                      key={patch.id}
                      id={patch.id}
                      name={patch.name}
                      price={patch.price}
                      imageUrl={patch.image_url}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Action area */}
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1.5px solid ${C.border}` }}>
              {error && (
                <div style={{
                  marginBottom: 10, padding: '10px 14px',
                  background: '#FEF3C7', border: '1px solid #FCD34D',
                  borderRadius: 10, fontSize: '0.75rem', color: '#78350F',
                }}>⚠️ {error}</div>
              )}

              {placedPatches.length > 0 && (
                <div style={{
                  marginBottom: 12, padding: '10px 14px',
                  background: C.borderSoft, border: `1px solid ${C.border}`, borderRadius: 12,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    {[{ label: 'Front', count: frontCount }, { label: 'Back', count: backCount }].map(({ label, count }) => (
                      <div key={label} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        fontSize: '0.72rem', color: count > 0 ? C.accentDark : '#D1D5DB', fontWeight: 500,
                      }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: count > 0 ? 'linear-gradient(135deg,#FCD34D,#F59E0B)' : '#E5E7EB',
                        }} />
                        {label}: {count} patch{count !== 1 ? 'es' : ''}
                      </div>
                    ))}
                  </div>
                  {placedPatches.map((p) => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: C.accentMid, marginBottom: 2 }}>
                      <span>✦ {p.name} <span style={{ opacity: 0.6 }}>({p.side})</span></span>
                      <span>+RM {p.price.toFixed(2)}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: C.accentDark, fontWeight: 600 }}>
                    <span>Base jeans ({baseSize})</span>
                    <span>RM {BASE_JEANS_PRICE.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <button
                id="finalize-design-btn"
                onClick={handleFinalizeDesign}
                disabled={placedPatches.length === 0 || isSubmitting}
                style={{
                  width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                  background: placedPatches.length > 0
                    ? 'linear-gradient(135deg,#86EFAC,#4ADE80)' : '#E7E5E4',
                  color: placedPatches.length > 0 ? '#14532D' : '#A8A29E',
                  fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.02em',
                  cursor: placedPatches.length > 0 && !isSubmitting ? 'pointer' : 'not-allowed',
                  boxShadow: placedPatches.length > 0 ? '0 4px 16px rgba(74,222,128,0.35)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {isSubmitting ? '⏳ Saving Design…' : '✦ Finalize My Design'}
              </button>

              {placedPatches.length === 0 && (
                <p style={{ textAlign: 'center', fontSize: '0.7rem', color: C.accentLight, marginTop: 6 }}>
                  Add at least one patch to continue
                </p>
              )}
            </div>
          </div>
        </div>

        <SuccessModal
          isOpen={showModal}
          onClose={() => { if (!isSubmitting) setShowModal(false); }}
          designId={designId}
        />
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </DndProvider>
  );
}