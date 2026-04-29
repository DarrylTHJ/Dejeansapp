import { useDrop } from 'react-dnd';
import { useState } from 'react';
import { X } from 'lucide-react';

interface PlacedPatch {
  id: string;
  patchId: string;
  name: string;
  price: number;
  imageUrl: string;
  x: number;
  y: number;
}

interface JeansCanvasProps {
  onPatchAdded: (patch: PlacedPatch) => void;
  placedPatches: PlacedPatch[];
  onRemovePatch: (id: string) => void;
}

export function JeansCanvas({ onPatchAdded, placedPatches, onRemovePatch }: JeansCanvasProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'PATCH',
    drop: (item: { id: string; name: string; price: number; imageUrl: string }, monitor) => {
      const offset = monitor.getClientOffset();
      const dropZone = document.getElementById('jeans-canvas');
      if (offset && dropZone) {
        const rect = dropZone.getBoundingClientRect();
        const x = offset.x - rect.left;
        const y = offset.y - rect.top;

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

  return (
    <div
      id="jeans-canvas"
      ref={drop}
      className="relative w-full h-full rounded-2xl overflow-hidden transition-all"
      style={{
        backgroundColor: '#F5F1ED',
        boxShadow: isOver ? '0 0 0 3px #A8B5A0' : '0 4px 6px rgba(0,0,0,0.05)',
      }}
    >
      {/* Jeans Image */}
      <img
        src="https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80"
        alt="Blue jeans"
        className="w-full h-full object-contain"
        style={{ filter: 'brightness(1.05)' }}
      />

      {/* Placed Patches */}
      {placedPatches.map((patch) => (
        <div
          key={patch.id}
          className="absolute group"
          style={{
            left: patch.x - 40,
            top: patch.y - 40,
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
            aria-label="Remove patch"
          >
            <X size={14} />
          </button>
        </div>
      ))}

      {/* Drop Hint */}
      {isOver && (
        <div className="absolute inset-0 bg-stone-900 bg-opacity-5 flex items-center justify-center pointer-events-none">
          <div className="text-stone-600 px-4 py-2 rounded-lg" style={{ backgroundColor: '#F5F1ED' }}>
            Drop patch here
          </div>
        </div>
      )}
    </div>
  );
}
