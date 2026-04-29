import { useDrag } from 'react-dnd';

// Warm accent colour per patch to give each card a unique feel
const PATCH_ACCENTS: Record<string, { bg: string; border: string; badge: string; text: string }> = {
  'patch-1': { bg: '#FFF0F6', border: '#FBCFE8', badge: '#FCE7F3', text: '#9D174D' }, // Flower — rose
  'patch-2': { bg: '#FFFBEB', border: '#FDE68A', badge: '#FEF3C7', text: '#92400E' }, // Star — amber
  'patch-3': { bg: '#F5F3FF', border: '#DDD6FE', badge: '#EDE9FE', text: '#5B21B6' }, // Peace — violet
  'patch-4': { bg: '#EFF6FF', border: '#BFDBFE', badge: '#DBEAFE', text: '#1E40AF' }, // Moon — blue
  'patch-5': { bg: '#FFF1F2', border: '#FECDD3', badge: '#FFE4E6', text: '#9F1239' }, // Heart — red
  'patch-6': { bg: '#ECFDF5', border: '#A7F3D0', badge: '#D1FAE5', text: '#065F46' }, // Butterfly — emerald
};

interface DraggablePatchProps {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
}

export function DraggablePatch({ id, name, price, imageUrl }: DraggablePatchProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'PATCH',
    item: { id, name, price, imageUrl },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));

  const accent = PATCH_ACCENTS[id] ?? PATCH_ACCENTS['patch-2'];

  return (
    <div
      ref={drag}
      style={{
        opacity: isDragging ? 0.4 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        transform: isDragging ? 'scale(0.96)' : 'scale(1)',
        transition: 'opacity 0.15s ease, transform 0.15s ease',
      }}
    >
      <div
        style={{
          background: accent.bg,
          border: `1.5px solid ${accent.border}`,
          borderRadius: 16,
          padding: '12px 10px 10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          boxShadow: '0 2px 8px rgba(180, 140, 60, 0.08)',
          transition: 'box-shadow 0.2s ease, transform 0.2s ease',
          userSelect: 'none',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 20px rgba(180, 140, 60, 0.18)';
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(180, 140, 60, 0.08)';
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        }}
      >
        {/* Image */}
        <div style={{ width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img
            src={imageUrl}
            alt={name}
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))',
            }}
          />
        </div>

        {/* Name */}
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: accent.text, letterSpacing: '0.02em' }}>
          {name}
        </span>

        {/* Price badge */}
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 500,
            color: accent.text,
            background: accent.badge,
            border: `1px solid ${accent.border}`,
            borderRadius: 99,
            padding: '2px 10px',
          }}
        >
          +RM {price.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
