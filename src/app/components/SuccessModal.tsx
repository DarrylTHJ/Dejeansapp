import { X, Copy, Check, Loader2, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  designId: string;
}

export function SuccessModal({ isOpen, onClose, designId }: SuccessModalProps) {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;
  const isLoading = !designId;

  const handleCopy = () => {
    navigator.clipboard.writeText(designId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      role="dialog" aria-modal="true"
    >
      {/* Backdrop */}
      <div
        onClick={!isLoading ? onClose : undefined}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(120, 80, 0, 0.35)',
          backdropFilter: 'blur(6px)',
        }}
      />

      {/* Modal card */}
      <div
        style={{
          position: 'relative',
          background: 'linear-gradient(145deg, #FFFBEB 0%, #FFF9E0 100%)',
          borderRadius: 24,
          border: '1.5px solid #FDE68A',
          boxShadow: '0 24px 60px rgba(180, 130, 30, 0.2)',
          maxWidth: 440,
          width: '100%',
          padding: '36px 32px',
          textAlign: 'center',
        }}
      >
        {/* Decorative top dots */}
        <div style={{ position: 'absolute', top: 16, left: 20, display: 'flex', gap: 6 }}>
          {['#FCD34D', '#86EFAC', '#93C5FD'].map((c, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
          ))}
        </div>

        {!isLoading && (
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute', top: 14, right: 14,
              background: '#FEF3C7', border: '1px solid #FDE68A',
              borderRadius: '50%', width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#92400E',
            }}
          >
            <X size={16} />
          </button>
        )}

        {/* Icon */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            width: 72, height: 72, margin: '0 auto', borderRadius: '50%',
            background: isLoading
              ? 'linear-gradient(135deg, #FDE68A, #FCD34D)'
              : 'linear-gradient(135deg, #6EE7B7, #34D399)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: isLoading
              ? '0 4px 20px rgba(251, 191, 36, 0.4)'
              : '0 4px 20px rgba(52, 211, 153, 0.4)',
          }}>
            {isLoading
              ? <Loader2 size={34} color="white" style={{ animation: 'spin 1s linear infinite' }} />
              : <Sparkles size={34} color="white" />
            }
          </div>
        </div>

        {isLoading ? (
          <>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', color: '#78350F', marginBottom: 8 }}>
              Saving your design…
            </h2>
            <p style={{ color: '#A16207', fontSize: '0.875rem' }}>
              Locking in your one-of-a-kind creation.
            </p>
          </>
        ) : (
          <>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', color: '#78350F', marginBottom: 6 }}>
              Your design is ready! ✦
            </h2>
            <p style={{ color: '#A16207', fontSize: '0.875rem', marginBottom: 18 }}>
              Your unique Design ID has been saved.
            </p>

            {/* Design ID box */}
            <div style={{
              background: '#FFFDE7',
              border: '1.5px solid #FDE68A',
              borderRadius: 12,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              marginBottom: 14,
            }}>
              <code style={{ fontSize: '1.05rem', color: '#78350F', fontWeight: 600, flex: 1, textAlign: 'left' }}>
                {designId}
              </code>
              <button
                id="copy-design-id-btn"
                onClick={handleCopy}
                aria-label="Copy Design ID to clipboard"
                style={{
                  background: copied ? '#34D399' : '#FEF3C7',
                  border: `1px solid ${copied ? '#6EE7B7' : '#FDE68A'}`,
                  borderRadius: 8,
                  padding: '6px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: copied ? 'white' : '#92400E',
                  transition: 'all 0.2s ease',
                }}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: '#B45309', marginBottom: 22, lineHeight: 1.5 }}>
              Paste this ID into the <strong>'Remarks'</strong> section when you checkout on Shopee so we can match your custom design.
            </p>

            <a
              id="shopee-checkout-btn"
              href="https://shopee.com.my/product/737889337/52209752525/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #F97316, #EE4D2D)',
                color: 'white',
                borderRadius: 12,
                fontWeight: 600,
                fontSize: '0.95rem',
                textDecoration: 'none',
                textAlign: 'center',
                boxShadow: '0 4px 14px rgba(238, 77, 45, 0.35)',
                transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              🛍 Checkout on Shopee
            </a>
          </>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
