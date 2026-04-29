import { useDrop } from 'react-dnd';
import { X, Move } from 'lucide-react';
import { useRef, useCallback } from 'react';

interface PlacedPatch {
  id: string;
  patchId: string;
  name: string;
  price: number;
  imageUrl: string;
  x: number; // percentage 0–100
  y: number; // percentage 0–100
}

interface JeansCanvasProps {
  onPatchAdded: (patch: PlacedPatch) => void;
  onMovePatch: (id: string, x: number, y: number) => void;
  onRemovePatch: (id: string) => void;
  placedPatches: PlacedPatch[];
}

export function JeansCanvas({ onPatchAdded, onMovePatch, onRemovePatch, placedPatches }: JeansCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Initial drop (from inventory panel) ──────────────────────────────
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'PATCH',
    drop: (item: { id: string; name: string; price: number; imageUrl: string }, monitor) => {
      const offset = monitor.getClientOffset();
      const container = containerRef.current;
      if (!offset || !container) return;

      const rect = container.getBoundingClientRect();
      const x = Math.min(100, Math.max(0, ((offset.x - rect.left) / rect.width) * 100));
      const y = Math.min(100, Math.max(0, ((offset.y - rect.top) / rect.height) * 100));

      onPatchAdded({
        id: `placed-${Date.now()}`,
        patchId: item.id,
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl,
        x,
        y,
      });
    },
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  }));

  const setRefs = (node: HTMLDivElement | null) => {
    containerRef.current = node;
    drop(node);
  };

  // ── Repositioning: pointer-drag after placement ───────────────────────
  const handlePatchPointerDown = useCallback(
    (e: React.PointerEvent, patchId: string) => {
      // Don't trigger when clicking the remove button
      if ((e.target as HTMLElement).closest('button')) return;
      e.preventDefault();
      e.stopPropagation();

      const container = containerRef.current;
      if (!container) return;

      const moveHandler = (ev: PointerEvent) => {
        const rect = container.getBoundingClientRect();
        const x = Math.min(100, Math.max(0, ((ev.clientX - rect.left) / rect.width) * 100));
        const y = Math.min(100, Math.max(0, ((ev.clientY - rect.top) / rect.height) * 100));
        onMovePatch(patchId, x, y);
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

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Canvas label */}
      <div className="flex items-center justify-between px-1">
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', color: '#92400E', fontWeight: 600 }}>
          Your Canvas
        </span>
        <span style={{ fontSize: '0.75rem', color: '#A16207', background: '#FEF9C3', padding: '2px 10px', borderRadius: 99, border: '1px solid #FDE68A' }}>
          {placedPatches.length === 0 ? 'Drop patches below' : `${placedPatches.length} patch${placedPatches.length > 1 ? 'es' : ''} placed`}
        </span>
      </div>

      {/* Drop zone */}
      <div
        id="jeans-canvas"
        ref={setRefs}
        className="relative flex-1 overflow-hidden"
        style={{
          borderRadius: '20px',
          border: isOver
            ? '2.5px dashed #F59E0B'
            : '2px solid #FDE68A',
          background: isOver
            ? 'rgba(254, 243, 199, 0.6)'
            : 'rgba(255, 253, 235, 0.5)',
          boxShadow: isOver
            ? '0 0 0 4px rgba(245, 158, 11, 0.15), inset 0 0 30px rgba(245, 158, 11, 0.05)'
            : '0 4px 20px rgba(180, 140, 60, 0.08)',
          transition: 'border 0.15s ease, box-shadow 0.15s ease, background 0.15s ease',
          cursor: 'crosshair',
        }}
      >
        {/* Jeans image — NO dark overlay, just a clean transparent hint */}
        <img
          src="/jeans-base.png"
          alt="Plain blue denim jeans ready to be customised"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            pointerEvents: 'none',
            userSelect: 'none',
            // Slightly warmer tone to match the yellow palette
            filter: 'brightness(1.02) saturate(0.95)',
            transition: 'filter 0.15s ease',
          }}
          draggable={false}
        />

        {/* Drop hint — only text, no dark overlay ──────────────── */}
        {isOver && (
          <div
            style={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#FEF3C7',
              border: '1.5px solid #FCD34D',
              borderRadius: 99,
              padding: '6px 18px',
              fontSize: '0.8rem',
              color: '#92400E',
              fontWeight: 500,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(180,130,30,0.15)',
            }}
          >
            ✦ Release to place patch
          </div>
        )}

        {/* Empty state hint */}
        {placedPatches.length === 0 && !isOver && (
          <div
            style={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              color: '#D97706',
              fontSize: '0.78rem',
              fontWeight: 500,
              opacity: 0.7,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            ← Drag patches from the panel
          </div>
        )}

        {/* Placed patches — draggable for repositioning ──────────── */}
        {placedPatches.map((patch) => (
          <div
            key={patch.id}
            onPointerDown={(e) => handlePatchPointerDown(e, patch.id)}
            className="group"
            style={{
              position: 'absolute',
              left: `calc(${patch.x}% - 44px)`,
              top: `calc(${patch.y}% - 44px)`,
              width: 88,
              height: 88,
              cursor: 'grab',
              touchAction: 'none',
              userSelect: 'none',
            }}
          >
            {/* Patch image */}
            <img
              src={patch.imageUrl}
              alt={patch.name}
              draggable={false}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                pointerEvents: 'none',
                filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.2))',
                transition: 'transform 0.1s ease',
              }}
            />

            {/* Hover overlay controls */}
            <div
              className="opacity-0 group-hover:opacity-100"
              style={{ transition: 'opacity 0.15s ease' }}
            >
              {/* Move indicator */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: 'rgba(255,255,255,0.85)',
                  borderRadius: '50%',
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                }}
              >
                <Move size={14} color="#92400E" />
              </div>

              {/* Remove button */}
              <button
                onClick={(e) => { e.stopPropagation(); onRemovePatch(patch.id); }}
                aria-label={`Remove ${patch.name} patch`}
                style={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  background: '#EF4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: 22,
                  height: 22,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
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
