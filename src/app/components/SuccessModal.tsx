import { X, Copy, Check, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  designId: string;
}

export function SuccessModal({ isOpen, onClose, designId }: SuccessModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(designId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLoading = !designId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Design finalised">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900 bg-opacity-40 backdrop-blur-sm"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in-95 duration-200"
        style={{ backgroundColor: '#FEFCFA' }}
      >
        {!isLoading && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        )}

        <div className="text-center">
          {/* Icon */}
          <div className="mb-4">
            <div
              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
              style={{ backgroundColor: isLoading ? '#D4D4AA' : '#A8B5A0' }}
            >
              {isLoading
                ? <Loader2 size={32} className="text-white animate-spin" />
                : <Check size={32} className="text-white" />
              }
            </div>
          </div>

          {isLoading ? (
            <>
              <h2 className="text-2xl mb-3 text-stone-800">Saving your design…</h2>
              <p className="text-stone-500 text-sm">Please wait while we record your custom design.</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl mb-3 text-stone-800">Your Custom Jeans are Ready!</h2>

              <p className="text-stone-600 mb-3">Your unique Design ID is:</p>

              {/* Design ID copy box */}
              <div
                className="rounded-lg p-4 mb-4 flex items-center justify-between gap-3"
                style={{ backgroundColor: '#F5F1ED' }}
              >
                <code className="text-lg text-stone-800 flex-1 text-left">{designId}</code>
                <button
                  id="copy-design-id-btn"
                  onClick={handleCopy}
                  className="p-2 rounded-lg transition-colors"
                  style={{
                    backgroundColor: copied ? '#A8B5A0' : '#E8E4DF',
                    color: copied ? 'white' : '#5C5C5C',
                  }}
                  aria-label="Copy Design ID to clipboard"
                >
                  {copied ? <Check size={20} /> : <Copy size={20} />}
                </button>
              </div>

              <p className="text-sm text-stone-600 mb-6">
                Please copy this ID and paste it into the <strong>'Remarks'</strong> section during checkout on Shopee.
              </p>

              {/* Phase 4: Shopee checkout link — using generic URL until product listing is live */}
              <a
                id="shopee-checkout-btn"
                href="https://shopee.com.my"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 px-6 rounded-lg text-white text-center font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#EE4D2D' }}
              >
                Checkout on Shopee
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
