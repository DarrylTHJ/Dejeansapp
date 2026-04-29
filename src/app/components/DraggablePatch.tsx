import { useDrag } from 'react-dnd';

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
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className="cursor-grab active:cursor-grabbing transition-opacity"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <div className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-24 object-contain mb-2"
        />
        <div className="text-xs text-center text-stone-600">{name}</div>
        <div className="text-sm text-center mt-1" style={{ color: '#C87D5C' }}>
          +RM {price.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
