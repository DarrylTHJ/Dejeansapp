import { useState, useEffect, useRef } from 'react';
import { Search, ArrowLeft, Plus, Trash2, Eye, EyeOff, Upload, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { ReadOnlyCanvas } from '../components/ReadOnlyCanvas';
import { LEGACY_PATCH_MAP } from '../constants/patches';
import type { PatchRecord, PatchSide } from '../constants/patches';

const C = {
  bg: '#FFFBEB', panel: '#FFF8D6', navBg: '#FFFDE7',
  border: '#FDE68A', borderSoft: '#FEF3C7',
  accentDark: '#92400E', accentMid: '#B45309', accentLight: '#A16207',
};

type Tab = 'inventory' | 'viewer';

interface DesignRecord {
  id: string; design_id: string; base_size: string;
  total_price: number; created_at: string;
}
interface DesignPatch {
  patch_id: string; coord_x_percent: number;
  coord_y_percent: number; side: PatchSide;
}

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('inventory');

  // ── Patch Inventory state ────────────────────────────────
  const [patches, setPatches]       = useState<PatchRecord[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [newName, setNewName]       = useState('');
  const [newPrice, setNewPrice]     = useState('');
  const [imageFile, setImageFile]   = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [adding, setAdding]         = useState(false);
  const [addError, setAddError]     = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Design Viewer state ──────────────────────────────────
  const [query, setQuery]           = useState('');
  const [searching, setSearching]   = useState(false);
  const [searchError, setSearchError] = useState('');
  const [design, setDesign]         = useState<DesignRecord | null>(null);
  const [designPatches, setDesignPatches] = useState<DesignPatch[]>([]);

  // ── Load patches list ────────────────────────────────────
  const loadPatches = async () => {
    setLoadingList(true);
    const { data } = await supabase
      .from('patches')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setPatches(data as PatchRecord[]);
    setLoadingList(false);
  };

  useEffect(() => { loadPatches(); }, []);

  // ── Handle image file pick ───────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // ── Add new patch ────────────────────────────────────────
  const handleAddPatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile || !newName.trim() || !newPrice) {
      setAddError('Please fill in all fields and select an image.');
      return;
    }
    const price = parseFloat(newPrice);
    if (isNaN(price) || price <= 0) { setAddError('Enter a valid price.'); return; }

    setAdding(true);
    setAddError('');

    try {
      // Upload to Supabase Storage
      const ext = imageFile.name.split('.').pop();
      const path = `${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('patches')
        .upload(path, imageFile, { contentType: imageFile.type });
      if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage.from('patches').getPublicUrl(path);

      // Insert into DB
      const { error: insertErr } = await supabase
        .from('patches')
        .insert({ name: newName.trim(), price, image_url: publicUrl });
      if (insertErr) throw insertErr;

      // Reset form
      setNewName(''); setNewPrice(''); setImageFile(null); setImagePreview('');
      if (fileRef.current) fileRef.current.value = '';
      await loadPatches();
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setAdding(false);
    }
  };

  // ── Toggle availability ──────────────────────────────────
  const toggleAvailability = async (patch: PatchRecord) => {
    await supabase.from('patches').update({ is_available: !patch.is_available }).eq('id', patch.id);
    setPatches((prev) => prev.map((p) => p.id === patch.id ? { ...p, is_available: !p.is_available } : p));
  };

  // ── Delete patch ─────────────────────────────────────────
  const deletePatch = async (patch: PatchRecord) => {
    if (!confirm(`Delete "${patch.name}"? This cannot be undone.`)) return;
    // Remove image from storage
    const filename = patch.image_url.split('/').pop();
    if (filename) await supabase.storage.from('patches').remove([filename]);
    await supabase.from('patches').delete().eq('id', patch.id);
    setPatches((prev) => prev.filter((p) => p.id !== patch.id));
  };

  // ── Design Viewer search ─────────────────────────────────
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const term = query.trim().toUpperCase();
    if (!term) return;
    setSearching(true); setSearchError(''); setDesign(null); setDesignPatches([]);

    try {
      const { data: d, error: de } = await supabase
        .from('designs').select('id,design_id,base_size,total_price,created_at')
        .eq('design_id', term).single();
      if (de || !d) { setSearchError(`No design found for "${term}".`); return; }

      const { data: dp } = await supabase
        .from('design_patches').select('patch_id,coord_x_percent,coord_y_percent,side')
        .eq('design_id', d.id);

      setDesign(d); setDesignPatches(dp ?? []);
    } catch { setSearchError('Something went wrong. Check your connection.'); }
    finally { setSearching(false); }
  };

  // Build a map of all patches (DB + legacy) for admin viewer
  const patchMap = Object.fromEntries(patches.map((p) => [p.id, { name: p.name, imageUrl: p.image_url }]));
  const enriched = designPatches.map((p) => ({
    patchId: p.patch_id,
    name:     patchMap[p.patch_id]?.name ?? LEGACY_PATCH_MAP[p.patch_id]?.name ?? p.patch_id,
    imageUrl: patchMap[p.patch_id]?.imageUrl ?? LEGACY_PATCH_MAP[p.patch_id]?.imageUrl ?? '',
    x: p.coord_x_percent, y: p.coord_y_percent,
    side: (p.side ?? 'front') as PatchSide,
  }));

  // ── Shared styles ────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 10,
    border: `1.5px solid ${C.border}`, background: '#FFFDE7',
    fontSize: '0.875rem', color: C.accentDark, outline: 'none', boxSizing: 'border-box',
  };
  const btnPrimary: React.CSSProperties = {
    padding: '10px 20px', borderRadius: 10, border: 'none',
    background: 'linear-gradient(135deg,#FCD34D,#F59E0B)',
    color: 'white', fontWeight: 700, fontSize: '0.85rem',
    cursor: 'pointer', boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
    display: 'flex', alignItems: 'center', gap: 6,
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Inter', sans-serif" }}>

      {/* Navbar */}
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
            fontSize: '0.62rem', fontWeight: 700, color: 'white',
            background: '#EF4444', borderRadius: 99, padding: '2px 8px',
          }}>Seller Dashboard</span>
        </div>
        <a href="/" style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: '0.8rem', color: C.accentMid, textDecoration: 'none',
          padding: '6px 12px', borderRadius: 99,
          border: `1px solid ${C.border}`, background: C.borderSoft,
        }}>
          <ArrowLeft size={14} /> Back to Customiser
        </a>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>

        {/* Page title */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', color: C.accentDark, margin: '0 0 6px' }}>
            Admin Dashboard ✦
          </h1>
          <p style={{ color: C.accentLight, fontSize: '0.875rem', margin: 0 }}>
            Manage your patch catalogue and look up customer designs
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: C.borderSoft, borderRadius: 12, padding: 4, border: `1px solid ${C.border}` }}>
          {([['inventory', '🪡 Patch Inventory'], ['viewer', '🔍 Design Viewer']] as [Tab, string][]).map(([t, label]) => (
            <button
              key={t} onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '10px', border: 'none', borderRadius: 9,
                background: tab === t ? 'linear-gradient(135deg,#FCD34D,#F59E0B)' : 'transparent',
                color: tab === t ? 'white' : C.accentMid,
                fontWeight: tab === t ? 700 : 500, fontSize: '0.875rem',
                cursor: 'pointer', transition: 'all 0.15s ease',
                boxShadow: tab === t ? '0 2px 8px rgba(245,158,11,0.3)' : 'none',
              }}
            >{label}</button>
          ))}
        </div>

        {/* ── TAB: Patch Inventory ─────────────────────────── */}
        {tab === 'inventory' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Add New Patch form */}
            <div style={{ background: C.panel, border: `1.5px solid ${C.border}`, borderRadius: 20, padding: 24 }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', color: C.accentDark, margin: '0 0 18px' }}>
                Add New Patch
              </h2>
              <form onSubmit={handleAddPatch}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: C.accentLight, display: 'block', marginBottom: 5 }}>
                      PATCH NAME
                    </label>
                    <input
                      value={newName} onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Skull, Rainbow…" style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = '#F59E0B')}
                      onBlur={(e) => (e.target.style.borderColor = C.border)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: C.accentLight, display: 'block', marginBottom: 5 }}>
                      PRICE (RM)
                    </label>
                    <input
                      type="number" min="0" step="0.50"
                      value={newPrice} onChange={(e) => setNewPrice(e.target.value)}
                      placeholder="e.g. 8.50" style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = '#F59E0B')}
                      onBlur={(e) => (e.target.style.borderColor = C.border)}
                    />
                  </div>
                </div>

                {/* Image upload */}
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: `2px dashed ${C.border}`, borderRadius: 14,
                    padding: '20px', textAlign: 'center', cursor: 'pointer',
                    background: imagePreview ? 'transparent' : C.borderSoft,
                    marginBottom: 14, transition: 'border-color 0.15s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
                    minHeight: 100,
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = '#F59E0B')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = C.border)}
                >
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: 8 }} />
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: C.accentDark }}>{imageFile?.name}</p>
                        <p style={{ margin: '3px 0 0', fontSize: '0.72rem', color: C.accentLight }}>Click to change image</p>
                      </div>
                    </>
                  ) : (
                    <div>
                      <Upload size={24} color={C.accentLight} style={{ margin: '0 auto 8px' }} />
                      <p style={{ margin: 0, fontSize: '0.82rem', color: C.accentLight, fontWeight: 500 }}>
                        Click to upload patch image
                      </p>
                      <p style={{ margin: '3px 0 0', fontSize: '0.7rem', color: '#D97706' }}>PNG, JPG, WebP supported</p>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

                {addError && (
                  <p style={{ color: '#DC2626', fontSize: '0.78rem', margin: '0 0 10px' }}>⚠️ {addError}</p>
                )}

                <button type="submit" disabled={adding} style={{ ...btnPrimary, width: '100%', justifyContent: 'center' }}>
                  {adding
                    ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Uploading…</>
                    : <><Plus size={16} /> Add Patch to Catalogue</>
                  }
                </button>
              </form>
            </div>

            {/* Existing patches grid */}
            <div style={{ background: C.panel, border: `1.5px solid ${C.border}`, borderRadius: 20, padding: 24 }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', color: C.accentDark, margin: '0 0 18px' }}>
                Current Catalogue ({patches.filter(p => p.is_available).length} available / {patches.length} total)
              </h2>

              {loadingList ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <Loader2 size={28} color={C.accentLight} style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              ) : patches.length === 0 ? (
                <p style={{ textAlign: 'center', color: C.accentLight, padding: 40, margin: 0 }}>
                  No patches yet. Add your first one above ↑
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {patches.map((patch) => (
                    <div
                      key={patch.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        background: patch.is_available ? '#FFFDE7' : '#F9FAFB',
                        border: `1.5px solid ${patch.is_available ? C.border : '#E5E7EB'}`,
                        borderRadius: 14, padding: '12px 16px',
                        opacity: patch.is_available ? 1 : 0.6,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <img
                        src={patch.image_url} alt={patch.name}
                        style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 8, flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 600, color: C.accentDark, fontSize: '0.9rem' }}>{patch.name}</p>
                        <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: C.accentMid }}>
                          RM {Number(patch.price).toFixed(2)} &nbsp;·&nbsp;
                          <span style={{ color: patch.is_available ? '#16A34A' : '#9CA3AF' }}>
                            {patch.is_available ? '✓ Available' : '✗ Hidden'}
                          </span>
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: '0.65rem', color: '#9CA3AF', fontFamily: 'monospace' }}>
                          {patch.id}
                        </p>
                      </div>

                      {/* Toggle availability */}
                      <button
                        onClick={() => toggleAvailability(patch)}
                        title={patch.is_available ? 'Hide from shop' : 'Show in shop'}
                        style={{
                          background: patch.is_available ? '#FEF3C7' : '#D1FAE5',
                          border: `1px solid ${patch.is_available ? '#FDE68A' : '#6EE7B7'}`,
                          borderRadius: 8, padding: '7px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: patch.is_available ? C.accentMid : '#059669',
                        }}
                      >
                        {patch.is_available ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => deletePatch(patch)}
                        title="Delete permanently"
                        style={{
                          background: '#FEF2F2', border: '1px solid #FECACA',
                          borderRadius: 8, padding: '7px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#DC2626',
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: Design Viewer ───────────────────────────── */}
        {tab === 'viewer' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.accentLight }} />
                <input
                  value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter Design ID (e.g. PATCH-A1B2C3)"
                  style={{ ...inputStyle, paddingLeft: 36 }}
                  onFocus={(e) => (e.target.style.borderColor = '#F59E0B')}
                  onBlur={(e) => (e.target.style.borderColor = C.border)}
                />
              </div>
              <button type="submit" disabled={searching} style={btnPrimary}>
                {searching ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={16} />}
                {searching ? 'Searching…' : 'Look up'}
              </button>
            </form>

            {searchError && (
              <div style={{ padding: '12px 16px', borderRadius: 12, background: '#FEF3C7', border: '1px solid #FCD34D', color: '#78350F', fontSize: '0.85rem' }}>
                ⚠️ {searchError}
              </div>
            )}

            {design && (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                {/* Metadata */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 24 }}>
                  {[
                    { label: 'Design ID',    value: design.design_id,                                        mono: true },
                    { label: 'Size',         value: design.base_size },
                    { label: 'Total Price',  value: `RM ${Number(design.total_price).toFixed(2)}` },
                    { label: 'Date',         value: new Date(design.created_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' }) },
                    { label: 'Patches',      value: `${designPatches.length} total` },
                  ].map(({ label, value, mono }) => (
                    <div key={label} style={{ background: C.panel, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '12px 14px' }}>
                      <p style={{ margin: '0 0 4px', fontSize: '0.65rem', fontWeight: 600, color: C.accentLight, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                      <p style={{ margin: 0, fontWeight: 700, color: C.accentDark, fontSize: mono ? '0.9rem' : '0.95rem', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Canvases */}
                <div style={{ background: C.panel, border: `1.5px solid ${C.border}`, borderRadius: 20, padding: 24 }}>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', color: C.accentDark, margin: '0 0 18px' }}>
                    Customer's Design
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <ReadOnlyCanvas patches={enriched} side="front" label="Front View" />
                    <ReadOnlyCanvas patches={enriched} side="back"  label="Back View" />
                  </div>

                  {/* Patch table */}
                  {enriched.length > 0 && (
                    <div style={{ marginTop: 20, paddingTop: 18, borderTop: `1px solid ${C.border}` }}>
                      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '0.95rem', color: C.accentDark, margin: '0 0 12px' }}>
                        Placement Details
                      </h3>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                        <thead>
                          <tr style={{ color: C.accentLight, borderBottom: `1px solid ${C.border}` }}>
                            {['Patch', 'Side', 'X', 'Y'].map((h) => (
                              <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {enriched.map((p, i) => (
                            <tr key={i} style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
                              <td style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                {p.imageUrl && <img src={p.imageUrl} alt={p.name} style={{ width: 22, height: 22, objectFit: 'contain' }} />}
                                <span style={{ color: C.accentDark, fontWeight: 500 }}>{p.name}</span>
                              </td>
                              <td style={{ padding: '8px 10px' }}>
                                <span style={{
                                  fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                                  background: p.side === 'front' ? '#DBEAFE' : '#D1FAE5',
                                  color: p.side === 'front' ? '#1E40AF' : '#065F46',
                                }}>{p.side}</span>
                              </td>
                              <td style={{ padding: '8px 10px', color: C.accentMid, fontFamily: 'monospace' }}>{p.x.toFixed(1)}%</td>
                              <td style={{ padding: '8px 10px', color: C.accentMid, fontFamily: 'monospace' }}>{p.y.toFixed(1)}%</td>
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
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
