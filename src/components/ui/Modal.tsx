import React, { type ReactNode, useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: string;
}

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children }) => {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8,
          width: '100%', maxWidth: 420, maxHeight: '85vh',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}
        className="animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderBottom: '1px solid #222',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#ccc', fontFamily: 'IBM Plex Sans' }}>{title}</span>
          <button
            onClick={onClose}
            style={{ color: '#555', background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 4 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ccc')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#555')}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/>
            </svg>
          </button>
        </div>
        {/* Body */}
        <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
};
