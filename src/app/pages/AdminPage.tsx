import { useState } from 'react';
import { Search, ArrowLeft, Package, Ruler, DollarSign, Calendar, Layers } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { ReadOnlyCanvas } from '../components/ReadOnlyCanvas';
import { PATCH_IMAGE_MAP, AVAILABLE_PATCHES } from '../constants/patches';
import type { PatchSide } from '../constants/patches';

interface DesignRecord {
  id: string;
  design_id: string;
  base_size: string;
  total_price: number;
  created_at: string;
}

interface PatchRecord {
  patch_id: string;
  coord_x_percent: number;
  coord_y_percent: number;
  side: PatchSide;
}

const C = {
  bg: '#FFFBEB', panel: '#FFF8D6', navBg: '#FFFDE7',
  border: '#FDE68A', borderSoft: '#FEF3C7',
  accentDark: '#92400E', accentMid: '#B45309', accentLight: '#A16207',
};

export function AdminPage() {
  const [query, setQuery]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [design, setDesign]     = useState<DesignRecord | null>(null);
  const [patches, setPatches]   = useState<PatchRecord[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const term = query.trim().toUpperCase();
    if (!term) return;

    setLoading(true);
    setError(null);
    setDesign(null);
    setPatches([]);

    try {
      // 1. Look up the design by human-readable ID
      const { data: designData, error: designErr } = await supabase
        .from('designs')
        .select('id, design_id, base_size, total_price, created_at')
        .eq('design_id', term)
        .single();

      if (designErr || !designData) {
        setError(`No design found for ID "${term}". Check the ID and try again.`);
        return;
      }

      // 2. Fetch all patches for this design
      const { data: patchData, error: patchErr } = await supabase
        .from('design_patches')
        .select('patch_id, coord_x_percent, coord_y_percent, side')
        .eq('design_id', designData.id);

      if (patchErr) throw patchErr;

      setDesign(designData);
      setPatches(patchData ?? []);
    } catch (err) {
      setError('Something went wrong fetching the design. Check your Supabase connection.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Build patch list with image URLs for the ReadOnlyCanvas
  const enrichedPatches = patches.map((p) => ({
    patchId:  p.patch_id,
    imageUrl: PATCH_IMAGE_MAP[p.patch_id] ?? '',
    name:     AVAILABLE_PATCHES.find((a) => a.id === p.patch_id)?.name ?? p.patch_id,
    x:        p.coord_x_percent,
    y:        p.coord_y_percent,
    side:     (p.side ?? 'front') as PatchSide,
  }));

  const frontPatches = enrichedPatches.filter((p) => p.side === 'front');
  const backPatches  = enrichedPatches.filter((p) => p.side === 'back');

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Inter', sans-serif" }}>

      {/* ── Admin Navbar ─────────────────────────────────── */}
      <nav style={{
        padding: '0 32px', height: 64, display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
        background: C.navBg, borderBottom: `1.5px solid ${C.border}`,
        boxShadow: '0 2px 12px rgba(180,130,30,0.08)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg,#FCD34D,#F59E0B)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.75rem', fontWeight: 700, color: 'white',
          }}>RJ</div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', color: C.accentDark }}>
            ReThreaded
          </span>
          <span style={{
            fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em',
            color: 'white', background: '#EF4444',
            borderRadius: 99, padding: '2px 8px', textTransform: 'uppercase',
          }}>Seller Dashboard</span>
        </div>

        <a
          href="/"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: '0.8rem', color: C.accentMid, textDecoration: 'none',
            padding: '6px 12px', borderRadius: 99,
            border: `1px solid ${C.border}`, background: C.borderSoft,
          }}
        >
          <ArrowLeft size={14} /> Back to Customiser
        </a>
      </nav>

      {/* ── Page content ─────────────────────────────────── */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '2rem', color: C.accentDark, margin: '0 0 8px',
          }}>
            Design Viewer ✦
          </h1>
          <p style={{ color: C.accentLight, fontSize: '0.9rem', margin: 0 }}>
            Enter a customer's Design ID to see their custom jeans layout
          </p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} style={{ marginBottom: 40, display: 'flex', gap: 12, maxWidth: 520, margin: '0 auto 40px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.accentLight }}
            />
            <input
              id="design-id-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. PATCH-A1B2C3"
              style={{
                width: '100%', padding: '12px 14px 12px 38px',
                borderRadius: 12, border: `1.5px solid ${C.border}`,
                background: '#FFFDE7', fontSize: '0.95rem', color: C.accentDark,
                outline: 'none', fontFamily: 'monospace', letterSpacing: '0.05em',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#F59E0B')}
              onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 22px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg,#FCD34D,#F59E0B)',
              color: 'white', fontWeight: 700, fontSize: '0.9rem',
              cursor: loading ? 'wait' : 'pointer',
              boxShadow: '0 4px 12px rgba(245,158,11,0.35)',
            }}
          >
            {loading ? '…' : 'Look up'}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div style={{
            maxWidth: 520, margin: '0 auto 24px',
            padding: '14px 18px', borderRadius: 12,
            background: '#FEF3C7', border: '1.5px solid #FCD34D', color: '#78350F',
            fontSize: '0.85rem',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Design result */}
        {design && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>

            {/* Metadata cards */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))',
              gap: 14, marginBottom: 32,
            }}>
              {[
                { icon: <Package size={18} />, label: 'Design ID',   value: design.design_id, mono: true },
                { icon: <Ruler size={18} />,   label: 'Base Size',   value: design.base_size },
                { icon: <DollarSign size={18} />, label: 'Total Price', value: `RM ${Number(design.total_price).toFixed(2)}` },
                { icon: <Calendar size={18} />, label: 'Created',    value: new Date(design.created_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' }) },
                { icon: <Layers size={18} />,  label: 'Patches',     value: `${patches.length} total (${frontPatches.length} front / ${backPatches.length} back)` },
              ].map(({ icon, label, value, mono }) => (
                <div key={label} style={{
                  background: C.panel, border: `1.5px solid ${C.border}`, borderRadius: 14,
                  padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.accentLight, fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {icon} {label}
                  </div>
                  <div style={{ fontSize: mono ? '1rem' : '0.95rem', fontWeight: 700, color: C.accentDark, fontFamily: mono ? 'monospace' : 'inherit' }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {/* Canvas previews */}
            <div style={{
              background: C.panel, border: `1.5px solid ${C.border}`,
              borderRadius: 20, padding: 24,
            }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: C.accentDark, margin: '0 0 20px' }}>
                Customer's Design Layout
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <ReadOnlyCanvas patches={enrichedPatches} side="front" label="Front View" />
                <ReadOnlyCanvas patches={enrichedPatches} side="back"  label="Back View"  />
              </div>

              {/* Patch list */}
              {patches.length > 0 && (
                <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', color: C.accentDark, margin: '0 0 12px' }}>
                    Patch Placement Details
                  </h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', color: C.accentLight, borderBottom: `1px solid ${C.border}` }}>
                        {['Patch', 'Side', 'X Position', 'Y Position'].map((h) => (
                          <th key={h} style={{ padding: '6px 12px', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {enrichedPatches.map((p, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
                          <td style={{ padding: '8px 12px', color: C.accentDark, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <img src={p.imageUrl} alt={p.name} style={{ width: 24, height: 24, objectFit: 'contain' }} />
                            {p.name}
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <span style={{
                              fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                              background: p.side === 'front' ? '#DBEAFE' : '#D1FAE5',
                              color: p.side === 'front' ? '#1E40AF' : '#065F46',
                            }}>
                              {p.side}
                            </span>
                          </td>
                          <td style={{ padding: '8px 12px', color: C.accentMid, fontFamily: 'monospace' }}>{p.x.toFixed(1)}%</td>
                          <td style={{ padding: '8px 12px', color: C.accentMid, fontFamily: 'monospace' }}>{p.y.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
