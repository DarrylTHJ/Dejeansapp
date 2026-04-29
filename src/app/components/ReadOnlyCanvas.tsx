import type { PatchSide } from '../constants/patches';

interface ReadOnlyPatch {
  patchId: string;
  imageUrl: string;
  name: string;
  x: number;
  y: number;
  side: PatchSide;
}

interface ReadOnlyCanvasProps {
  patches: ReadOnlyPatch[];
  side: PatchSide;
  label?: string;
}

/** A non-interactive version of JeansCanvas used by the admin viewer. */
export function ReadOnlyCanvas({ patches, side, label }: ReadOnlyCanvasProps) {
  const visible = patches.filter((p) => p.side === side);
  const jeansSrc = side === 'front' ? '/jeans-base.png' : '/jeans-back.png';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {label && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: "'Playfair Display', serif", fontSize: '0.95rem',
            color: '#92400E', fontWeight: 600,
          }}>{label}</span>
          <span style={{
            fontSize: '0.68rem', color: '#A16207',
            background: '#FEF3C7', border: '1px solid #FDE68A',
            borderRadius: 99, padding: '2px 8px',
          }}>
            {visible.length} patch{visible.length !== 1 ? 'es' : ''}
          </span>
        </div>
      )}

      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '3/4',
        borderRadius: 16,
        border: '2px solid #FDE68A',
        background: 'rgba(255,253,235,0.5)',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(180,140,60,0.1)',
      }}>
        <img
          src={jeansSrc}
          alt={`${side} view`}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          draggable={false}
        />

        {visible.map((patch, i) => (
          <div
            key={i}
            title={patch.name}
            style={{
              position: 'absolute',
              left: `calc(${patch.x}% - 32px)`,
              top: `calc(${patch.y}% - 32px)`,
              width: 64,
              height: 64,
              pointerEvents: 'none',
            }}
          >
            <img
              src={patch.imageUrl}
              alt={patch.name}
              draggable={false}
              style={{
                width: '100%', height: '100%', objectFit: 'contain',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
              }}
            />
          </div>
        ))}

        {visible.length === 0 && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            padding: '0 0 14px',
          }}>
            <span style={{ fontSize: '0.7rem', color: '#D97706', opacity: 0.6 }}>
              No patches on {side}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
