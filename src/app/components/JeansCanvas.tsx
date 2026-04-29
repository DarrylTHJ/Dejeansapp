import { useDrop } from 'react-dnd';
import { X, Move, RotateCcw } from 'lucide-react';
import { useRef, useCallback, useState } from 'react';
import type { PatchSide } from '../constants/patches';

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

interface JeansCanvasProps {
  placedPatches: PlacedPatch[];
  currentSide: PatchSide;
  onPatchAdded: (patch: PlacedPatch) => void;
  onMovePatch: (id: string, x: number, y: number) => void;
  onRemovePatch: (id: string) => void;
  onFlipSide: () => void;
}

export function JeansCanvas({
  placedPatches,
  currentSide,
  onPatchAdded,
  onMovePatch,
  onRemovePatch,
  onFlipSide,
}: JeansCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFlipping, setIsFlipping] = useState(false);

  // ── Initial drop from inventory ───────────────────────────────────────
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'PATCH',
    drop: (item: { id: string; name: string; price: number; imageUrl: string }, monitor) => {
      const offset = monitor.getClientOffset();
      const container = containerRef.current;
      if (!offset || !container) return;
      const rect = container.getBoundingClientRect();
      onPatchAdded({
        id: `placed-${Date.now()}`,
        patchId: item.id,
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl,
        x: Math.min(100, Math.max(0, ((offset.x - rect.left) / rect.width) * 100)),
        y: Math.min(100, Math.max(0, ((offset.y - rect.top) / rect.height) * 100)),
        side: currentSide,  // <-- tag which side this was dropped on
      });
    },
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  }), [currentSide, onPatchAdded]);

  const setRefs = (node: HTMLDivElement | null) => {
    containerRef.current = node;
    drop(node);
  };

  // ── Pointer-drag repositioning ────────────────────────────────────────
  const handlePatchPointerDown = useCallback(
    (e: React.PointerEvent, patchId: string) => {
      if ((e.target as HTMLElement).closest('button')) return;
      e.preventDefault();
      e.stopPropagation();
      const container = containerRef.current;
      if (!container) return;

      const moveHandler = (ev: PointerEvent) => {
        const rect = container.getBoundingClientRect();
        onMovePatch(
          patchId,
          Math.min(100, Math.max(0, ((ev.clientX - rect.left) / rect.width) * 100)),
          Math.min(100, Math.max(0, ((ev.clientY - rect.top) / rect.height) * 100))
        );
      };
      const upHandler = () => {
        window.removeEventListener('pointermove', moveHandler);
        window.removeEventListener('pointerup', upHandler);
      };
      window.addEventListener('pointermove', moveHandler);
      window.addEventListener('pointerup', upHandler);
    },
    [onMovePatch]
  );

  // ── Flip with animation ───────────────────────────────────────────────
  const handleFlip = () => {
    if (isFlipping) return;
    setIsFlipping(true);
    setTimeout(() => {
      onFlipSide();
      setIsFlipping(false);
    }, 300); // switch image at the mid-point of the flip
  };

  // Only show patches for the current side
  const visiblePatches = placedPatches.filter((p) => p.side === currentSide);
  const otherSideCount = placedPatches.filter((p) => p.side !== currentSide).length;

  const jeansSrc = currentSide === 'front' ? '/jeans-base.png' : '/jeans-back.png';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 10 }}>

      {/* ── Canvas header bar ──────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.05rem', color: '#92400E', fontWeight: 600 }}>
            {currentSide === 'front' ? 'Front View' : 'Back View'}
          </span>
          {/* Side indicator dots */}
          <div style={{ display: 'flex', gap: 4 }}>
            {(['front', 'back'] as PatchSide[]).map((s) => (
              <div
                key={s}
                style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: currentSide === s
                    ? 'linear-gradient(135deg, #FCD34D, #F59E0B)'
                    : '#FDE68A',
                  transition: 'background 0.2s ease',
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Other-side patch badge */}
          {otherSideCount > 0 && (
            <span style={{
              fontSize: '0.7rem', color: '#A16207',
              background: '#FEF3C7', border: '1px solid #FDE68A',
              borderRadius: 99, padding: '2px 8px',
            }}>
              {otherSideCount} patch{otherSideCount > 1 ? 'es' : ''} on {currentSide === 'front' ? 'back' : 'front'}
            </span>
          )}

          {/* Current side patch count */}
          <span style={{
            fontSize: '0.7rem', color: '#A16207',
            background: '#FFFDE7', border: '1px solid #FDE68A',
            borderRadius: 99, padding: '2px 8px',
          }}>
            {visiblePatches.length === 0 ? 'No patches here' : `${visiblePatches.length} patch${visiblePatches.length > 1 ? 'es' : ''}`}
          </span>
        </div>
      </div>

      {/* ── Drop zone ─────────────────────────────────────────── */}
      <div
        id="jeans-canvas"
        ref={setRefs}
        style={{
          position: 'relative',
          flex: 1,
          overflow: 'hidden',
          borderRadius: 20,
          border: isOver ? '2.5px dashed #F59E0B' : '2px solid #FDE68A',
          background: isOver ? 'rgba(254,243,199,0.6)' : 'rgba(255,253,235,0.5)',
          boxShadow: isOver
            ? '0 0 0 4px rgba(245,158,11,0.15), inset 0 0 30px rgba(245,158,11,0.05)'
            : '0 4px 20px rgba(180,140,60,0.08)',
          transition: 'border 0.15s ease, box-shadow 0.15s ease',
          cursor: 'crosshair',
        }}
      >
        {/* ── Flip button — top-right corner ───────────────── */}
        <button
          onClick={handleFlip}
          title={`Flip to ${currentSide === 'front' ? 'back' : 'front'} view`}
          style={{
            position: 'absolute', top: 10, right: 10, zIndex: 20,
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 12px',
            background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
            border: '1.5px solid #F59E0B',
            borderRadius: 99,
            cursor: 'pointer',
            fontSize: '0.72rem',
            fontWeight: 600,
            color: '#92400E',
            boxShadow: '0 2px 8px rgba(180,130,30,0.2)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 14px rgba(180,130,30,0.35)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(180,130,30,0.2)'; }}
        >
          <RotateCcw
            size={12}
            style={{
              transform: isFlipping ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease',
            }}
          />
          {currentSide === 'front' ? 'Flip to Back' : 'Flip to Front'}
        </button>

        {/* ── Jeans image ──────────────────────────────────── */}
        <img
          src={jeansSrc}
          alt={`${currentSide === 'front' ? 'Front' : 'Back'} view of blue denim jeans`}
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            pointerEvents: 'none',
            userSelect: 'none',
            filter: 'brightness(1.02) saturate(0.95)',
            transform: isFlipping ? 'rotateY(90deg)' : 'rotateY(0deg)',
            transition: 'transform 0.3s ease',
          }}
        />

        {/* ── Drop hint (no dark overlay) ───────────────────── */}
        {isOver && (
          <div style={{
            position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
            background: '#FEF3C7', border: '1.5px solid #FCD34D',
            borderRadius: 99, padding: '5px 16px',
            fontSize: '0.78rem', fontWeight: 500, color: '#92400E',
            pointerEvents: 'none', whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(180,130,30,0.15)',
          }}>
            ✦ Release to place on {currentSide}
          </div>
        )}

        {/* ── Empty state ───────────────────────────────────── */}
        {visiblePatches.length === 0 && !isOver && (
          <div style={{
            position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
            color: '#D97706', fontSize: '0.72rem', fontWeight: 500,
            opacity: 0.65, pointerEvents: 'none', whiteSpace: 'nowrap',
          }}>
            ← Drag patches from the panel to place them
          </div>
        )}

        {/* ── Placed patches ────────────────────────────────── */}
        {visiblePatches.map((patch) => (
          <div
            key={patch.id}
            onPointerDown={(e) => handlePatchPointerDown(e, patch.id)}
            className="group"
            style={{
              position: 'absolute',
              left: `calc(${patch.x}% - 44px)`,
              top: `calc(${patch.y}% - 44px)`,
              width: 88, height: 88,
              cursor: 'grab', touchAction: 'none', userSelect: 'none',
            }}
          >
            <img
              src={patch.imageUrl}
              alt={patch.name}
              draggable={false}
              style={{
                width: '100%', height: '100%', objectFit: 'contain',
                pointerEvents: 'none',
                filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.2))',
              }}
            />
            <div className="opacity-0 group-hover:opacity-100" style={{ transition: 'opacity 0.15s ease' }}>
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%,-50%)',
                background: 'rgba(255,255,255,0.85)', borderRadius: '50%',
                width: 28, height: 28, display: 'flex', alignItems: 'center',
                justifyContent: 'center', pointerEvents: 'none',
                boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
              }}>
                <Move size={14} color="#92400E" />
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onRemovePatch(patch.id); }}
                aria-label={`Remove ${patch.name} patch`}
                style={{
                  position: 'absolute', top: -8, right: -8,
                  background: '#EF4444', color: 'white', border: 'none',
                  borderRadius: '50%', width: 22, height: 22, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(239,68,68,0.4)',
                }}
              >
                <X size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
