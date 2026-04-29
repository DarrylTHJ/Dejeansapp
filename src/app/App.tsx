import { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DraggablePatch } from './components/DraggablePatch';
import { JeansCanvas } from './components/JeansCanvas';
import { SuccessModal } from './components/SuccessModal';

const AVAILABLE_PATCHES = [
  { id: 'patch-1', name: 'Flower', price: 8.50, imageUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=200&q=80' },
  { id: 'patch-2', name: 'Star', price: 6.00, imageUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=200&q=80' },
  { id: 'patch-3', name: 'Peace', price: 7.50, imageUrl: 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=200&q=80' },
  { id: 'patch-4', name: 'Moon', price: 9.00, imageUrl: 'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?w=200&q=80' },
  { id: 'patch-5', name: 'Heart', price: 5.50, imageUrl: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=200&q=80' },
  { id: 'patch-6', name: 'Butterfly', price: 10.00, imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&q=80' },
];

const BASE_JEANS_PRICE = 45.00;

interface PlacedPatch {
  id: string;
  patchId: string;
  name: string;
  price: number;
  imageUrl: string;
  x: number;
  y: number;
}

export default function App() {
  const [placedPatches, setPlacedPatches] = useState<PlacedPatch[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [designId, setDesignId] = useState('');

  const totalPrice = BASE_JEANS_PRICE + placedPatches.reduce((sum, patch) => sum + patch.price, 0);

  const handlePatchAdded = (patch: PlacedPatch) => {
    setPlacedPatches((prev) => [...prev, patch]);
  };

  const handleRemovePatch = (id: string) => {
    setPlacedPatches((prev) => prev.filter((p) => p.id !== id));
  };

  const handleFinalizeDesign = () => {
    const id = `PATCH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setDesignId(id);
    setShowModal(true);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen" style={{ backgroundColor: '#FEFCFA' }}>
        {/* Navigation Bar */}
        <nav className="px-8 py-6 flex items-center justify-between border-b" style={{ borderColor: '#E8E4DF' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full" style={{ backgroundColor: '#A8B5A0' }} />
            <span className="text-xl text-stone-800">ReThreaded</span>
          </div>
          <div className="px-6 py-2 rounded-full" style={{ backgroundColor: '#F5F1ED' }}>
            <span className="text-stone-600">Total Price: </span>
            <span className="text-stone-800">RM {totalPrice.toFixed(2)}</span>
          </div>
        </nav>

        {/* Main Content */}
        <div className="flex h-[calc(100vh-88px)]">
          {/* Left Panel - Canvas */}
          <div className="w-[60%] p-8">
            <JeansCanvas
              onPatchAdded={handlePatchAdded}
              placedPatches={placedPatches}
              onRemovePatch={handleRemovePatch}
            />
          </div>

          {/* Right Panel - Inventory */}
          <div className="w-[40%] p-8 flex flex-col" style={{ backgroundColor: '#F5F1ED' }}>
            <h2 className="text-2xl mb-6 text-stone-800">Select Your Patches</h2>

            <div className="flex-1 overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4">
                {AVAILABLE_PATCHES.map((patch) => (
                  <DraggablePatch
                    key={patch.id}
                    id={patch.id}
                    name={patch.name}
                    price={patch.price}
                    imageUrl={patch.imageUrl}
                  />
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-6 pt-6 border-t" style={{ borderColor: '#E8E4DF' }}>
              <button
                onClick={handleFinalizeDesign}
                disabled={placedPatches.length === 0}
                className="w-full py-4 px-6 rounded-xl text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#A8B5A0',
                  boxShadow: placedPatches.length > 0 ? '0 4px 12px rgba(168, 181, 160, 0.3)' : 'none'
                }}
              >
                Finalize Design
              </button>
              {placedPatches.length === 0 && (
                <p className="text-xs text-center mt-3 text-stone-500">
                  Add at least one patch to continue
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Success Modal */}
        <SuccessModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          designId={designId}
        />
      </div>
    </DndProvider>
  );
}