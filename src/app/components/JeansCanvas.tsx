import { useDrop } from 'react-dnd';
import { X } from 'lucide-react';
import { useRef } from 'react';

interface PlacedPatch {
  id: string;
  patchId: string;
  name: string;
  price: number;
  imageUrl: string;
  /** Percentage (0–100) relative to canvas width */
  x: number;
  /** Percentage (0–100) relative to canvas height */
  y: number;
}

interface JeansCanvasProps {
  onPatchAdded: (patch: PlacedPatch) => void;
  placedPatches: PlacedPatch[];
  onRemovePatch: (id: string) => void;
}

export function JeansCanvas({ onPatchAdded, placedPatches, onRemovePatch }: JeansCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'PATCH',
    drop: (item: { id: string; name: string; price: number; imageUrl: string }, monitor) => {
      const offset = monitor.getClientOffset();
      const container = containerRef.current;

      if (offset && container) {
        const rect = container.getBoundingClientRect();

        // --- Phase 1 Fix: store as percentages, not raw pixels ---
        const xPercent = ((offset.x - rect.left) / rect.width) * 100;
        const yPercent = ((offset.y - rect.top) / rect.height) * 100;

        // Clamp to [0, 100] so patches can't be dropped outside bounds
        const x = Math.min(100, Math.max(0, xPercent));
        const y = Math.min(100, Math.max(0, yPercent));

        onPatchAdded({
          id: `placed-${Date.now()}`,
          patchId: item.id,
          name: item.name,
          price: item.price,
          imageUrl: item.imageUrl,
          x,
          y,
        });
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  // Merge the drop ref and our containerRef
  const setRefs = (node: HTMLDivElement | null) => {
    containerRef.current = node;
    drop(node);
  };

  return (
    <div
      id="jeans-canvas"
      ref={setRefs}
      className="relative w-full h-full rounded-2xl overflow-hidden transition-all"
      style={{
        backgroundColor: '#F5F1ED',
        boxShadow: isOver ? '0 0 0 3px #A8B5A0' : '0 4px 6px rgba(0,0,0,0.05)',
      }}
    >
      {/* Jeans Base Image — Phase 4: local asset */}
      <img
        src="/jeans-base.png"
        alt="Blue denim jeans — customise with patches"
        className="w-full h-full object-contain"
        style={{ filter: 'brightness(1.05)' }}
      />

      {/* Placed Patches — positions are now percentage-based */}
      {placedPatches.map((patch) => (
        <div
          key={patch.id}
          className="absolute group"
          style={{
            // Translate by -50% of the patch element's own size to centre on cursor
            left: `calc(${patch.x}% - 40px)`,
            top: `calc(${patch.y}% - 40px)`,
            width: 80,
            height: 80,
          }}
        >
          <img
            src={patch.imageUrl}
            alt={patch.name}
            className="w-full h-full object-contain pointer-events-none"
          />
          <button
            onClick={() => onRemovePatch(patch.id)}
            className="absolute -top-2 -right-2 bg-stone-800 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label={`Remove ${patch.name} patch`}
          >
            <X size={14} />
          </button>
        </div>
      ))}

      {/* Drop hint overlay */}
      {isOver && (
        <div className="absolute inset-0 bg-stone-900 bg-opacity-5 flex items-center justify-center pointer-events-none">
          <div
            className="text-stone-600 px-4 py-2 rounded-lg font-medium"
            style={{ backgroundColor: '#F5F1ED' }}
          >
            Drop patch here
          </div>
        </div>
      )}

      {/* Empty state hint */}
      {placedPatches.length === 0 && !isOver && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-stone-400 text-sm">Drag patches from the right panel →</p>
        </div>
      )}
    </div>
  );
}
