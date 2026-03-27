import React, { useState, useRef, useEffect } from 'react';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import type { CardType, LineStyle } from '../types';

const QUICK_COLORS = ['#888888','#e0e0e0','#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899'];

// Professional SVG Icons
const Icons = {
  note: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M3 2h8a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"/>
      <path d="M4 5h6M4 7h6M4 9h3"/>
    </svg>
  ),
  image: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="2" y="2" width="10" height="10" rx="1"/>
      <circle cx="5" cy="5" r="1" fill="currentColor"/>
      <path d="M12 9l-3-3-5 6"/>
    </svg>
  ),
  gif: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="2" y="2" width="10" height="10" rx="1"/>
      <path d="M5 6h1v2H5zM8 6v2M9 6h1M9 7h1M9 8h1"/>
    </svg>
  ),
  video: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="1" y="3" width="9" height="8" rx="1"/>
      <path d="M10 6l3-2v6l-3-2z" fill="currentColor" stroke="none"/>
    </svg>
  ),
  pdf: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M3 2h5l3 3v7a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"/>
      <path d="M8 2v3h3"/>
      <path d="M4 8h4M4 10h2"/>
    </svg>
  ),
  whois: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="7" cy="7" r="5"/>
      <path d="M7 4v3l2 2"/>
      <circle cx="7" cy="7" r="1" fill="currentColor"/>
    </svg>
  ),
  dns: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="2" y="2" width="4" height="4" rx="0.5"/>
      <rect x="8" y="2" width="4" height="4" rx="0.5"/>
      <rect x="5" y="8" width="4" height="4" rx="0.5"/>
      <path d="M4 6v2h3M10 6v4h-1"/>
    </svg>
  ),
  reverseImage: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="6" cy="6" r="4"/>
      <path d="M9 9l3 3"/>
      <path d="M4 6h4M6 4v4"/>
    </svg>
  ),
  osint: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="7" cy="7" r="5"/>
      <circle cx="7" cy="7" r="2"/>
      <path d="M7 2v2M7 10v2M2 7h2M10 7h2"/>
    </svg>
  ),
  url: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M6 8l2-2"/>
      <path d="M5 9a2 2 0 01-.5-2.5l1-1.5a2 2 0 013 0"/>
      <path d="M9 5a2 2 0 01.5 2.5l-1 1.5a2 2 0 01-3 0"/>
    </svg>
  ),
  api: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M2 4h10M2 7h10M2 10h10"/>
      <circle cx="4" cy="4" r="1" fill="currentColor"/>
      <circle cx="8" cy="7" r="1" fill="currentColor"/>
      <circle cx="5" cy="10" r="1" fill="currentColor"/>
    </svg>
  ),
  grid: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <circle cx="3" cy="3" r="1"/>
      <circle cx="7" cy="3" r="1"/>
      <circle cx="11" cy="3" r="1"/>
      <circle cx="3" cy="7" r="1"/>
      <circle cx="7" cy="7" r="1"/>
      <circle cx="11" cy="7" r="1"/>
      <circle cx="3" cy="11" r="1"/>
      <circle cx="7" cy="11" r="1"/>
      <circle cx="11" cy="11" r="1"/>
    </svg>
  ),
  ai: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="7" cy="7" r="5"/>
      <circle cx="5" cy="6" r="0.8" fill="currentColor"/>
      <circle cx="9" cy="6" r="0.8" fill="currentColor"/>
      <path d="M5 9c.5.5 1.5 1 2 1s1.5-.5 2-1"/>
    </svg>
  ),
  undo: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <path d="M3 7a4 4 0 114 4"/>
      <path d="M3 7l2-2M3 7l2 2"/>
    </svg>
  ),
  menu: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <circle cx="7" cy="3" r="1.2"/>
      <circle cx="7" cy="7" r="1.2"/>
      <circle cx="7" cy="11" r="1.2"/>
    </svg>
  ),
  chevron: (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 4l2 2 2-2"/>
    </svg>
  ),
  edit: (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1">
      <path d="M7.5 1.5L9.5 3.5L3.5 9.5L1 10L1.5 7.5L7.5 1.5Z"/>
    </svg>
  ),
  close: (
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="1" y1="1" x2="8" y2="8"/>
      <line x1="8" y1="1" x2="1" y2="8"/>
    </svg>
  ),
  export: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M7 2v7M4 5l3-3 3 3"/>
      <path d="M2 9v2a1 1 0 001 1h8a1 1 0 001-1V9"/>
    </svg>
  ),
  import: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M7 9V2M4 6l3 3 3-3"/>
      <path d="M2 9v2a1 1 0 001 1h8a1 1 0 001-1V9"/>
    </svg>
  ),
  settings: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="7" cy="7" r="2"/>
      <path d="M7 1v2M7 11v2M1 7h2M11 7h2M2.8 2.8l1.4 1.4M9.8 9.8l1.4 1.4M2.8 11.2l1.4-1.4M9.8 4.2l1.4-1.4"/>
    </svg>
  ),
  trash: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M3 4h8l-.5 8a1 1 0 01-1 1h-5a1 1 0 01-1-1L3 4z"/>
      <path d="M2 4h10M5 4V2h4v2"/>
    </svg>
  ),
  plus: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M6 2v8M2 6h8"/>
    </svg>
  ),
  combine: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="1" y="1" width="5" height="5" rx="0.5"/>
      <rect x="8" y="8" width="5" height="5" rx="0.5"/>
      <path d="M6 3.5h2M8 3.5v4.5H3.5"/>
    </svg>
  ),
  zoomFit: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M1 4V1h3M10 1h3v3M13 10v3h-3M4 13H1v-3"/>
      <rect x="4" y="4" width="6" height="6" rx="0.5"/>
    </svg>
  ),
  centerView: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="7" cy="7" r="2"/>
      <path d="M7 1v3M7 10v3M1 7h3M10 7h3"/>
    </svg>
  ),
};

export const Toolbar: React.FC = () => {
  const s = useWorkspaceStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showLineMenu, setShowLineMenu] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editingInvId, setEditingInvId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingInvId && editRef.current) editRef.current.focus();
  }, [editingInvId]);

  const cardGroups = [
    {
      label: 'Content',
      items: [
        { type: 'note' as CardType, label: 'Note', icon: Icons.note },
        { type: 'image' as CardType, label: 'Image', icon: Icons.image },
        { type: 'gif' as CardType, label: 'GIF', icon: Icons.gif },
        { type: 'video' as CardType, label: 'Video', icon: Icons.video },
        { type: 'pdf' as CardType, label: 'Document', icon: Icons.pdf },
      ],
    },
    {
      label: 'OSINT Tools',
      items: [
        { type: 'whois' as CardType, label: 'WHOIS Lookup', icon: Icons.whois },
        { type: 'dns' as CardType, label: 'DNS Lookup', icon: Icons.dns },
        { type: 'reverse-image' as CardType, label: 'Reverse Image', icon: Icons.reverseImage },
        { type: 'osint-framework' as CardType, label: 'OSINT Framework', icon: Icons.osint },
      ],
    },
  ];

  const activeInv = s.investigations.find((i) => i.id === s.activeInvestigationId);

  const startRename = (id: string, name: string) => {
    setEditingInvId(id);
    setEditingName(name);
  };

  const commitRename = () => {
    if (editingInvId && editingName.trim()) {
      s.renameInvestigation(editingInvId, editingName.trim());
    }
    setEditingInvId(null);
  };

  const ToolbarButton: React.FC<{
    onClick: () => void;
    active?: boolean;
    title: string;
    children: React.ReactNode;
    style?: React.CSSProperties;
  }> = ({ onClick, active, title, children, style }) => (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        padding: '5px 8px',
        borderRadius: 4,
        fontSize: 11,
        color: active ? '#e0e0e0' : '#777',
        border: 'none',
        background: active ? '#252525' : 'transparent',
        cursor: 'pointer',
        transition: 'all 0.12s',
        fontFamily: 'IBM Plex Sans, sans-serif',
        fontWeight: 500,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = '#1e1e1e';
          e.currentTarget.style.color = '#bbb';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = '#777';
        }
      }}
    >
      {children}
    </button>
  );

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      zIndex: 40, 
      background: 'linear-gradient(180deg, #161616 0%, #141414 100%)', 
      borderBottom: '1px solid #1e1e1e',
      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', height: 42, padding: '0 12px', gap: 2 }}>
        
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 12 }}>
          <div style={{ 
            width: 26, 
            height: 26, 
            background: 'linear-gradient(135deg, #1a1a1a 0%, #222 100%)', 
            border: '1px solid #2a2a2a', 
            borderRadius: 5, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <span style={{ 
              fontSize: 12, 
              fontWeight: 700, 
              color: '#e0e0e0', 
              fontFamily: 'IBM Plex Mono, monospace',
            }}>M</span>
          </div>
          <span style={{ 
            fontSize: 11, 
            fontWeight: 600, 
            color: '#555', 
            letterSpacing: '0.1em', 
            fontFamily: 'IBM Plex Mono, monospace' 
          }} className="hidden sm:inline">
            MIPLER
          </span>
        </div>

        {/* Investigation Picker */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => s.setInvestigationMenuOpen(!s.investigationMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 10px',
              background: s.investigationMenuOpen ? '#222' : 'transparent',
              border: '1px solid transparent',
              borderColor: s.investigationMenuOpen ? '#333' : 'transparent',
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'all 0.12s',
            }}
            onMouseEnter={(e) => {
              if (!s.investigationMenuOpen) e.currentTarget.style.background = '#1a1a1a';
            }}
            onMouseLeave={(e) => {
              if (!s.investigationMenuOpen) e.currentTarget.style.background = 'transparent';
            }}
          >
            <span style={{ 
              maxWidth: 140, 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap', 
              fontSize: 12, 
              fontWeight: 500, 
              color: '#ccc',
              fontFamily: 'IBM Plex Sans, sans-serif',
            }}>
              {activeInv?.name || 'Untitled'}
            </span>
            {Icons.chevron}
          </button>

          {s.investigationMenuOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => s.setInvestigationMenuOpen(false)} />
              <div className="animate-fade-in" style={{ 
                position: 'absolute', 
                left: 0, 
                top: 'calc(100% + 4px)', 
                zIndex: 50,
                width: 240, 
                background: '#1a1a1a', 
                border: '1px solid #2a2a2a', 
                borderRadius: 6, 
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)', 
                padding: 4,
                overflow: 'hidden',
              }}>
                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {s.investigations.map((inv) => (
                    <div key={inv.id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 4, 
                      padding: '6px 8px',
                      borderRadius: 4,
                      background: inv.id === s.activeInvestigationId ? '#252525' : 'transparent',
                    }}>
                      {editingInvId === inv.id ? (
                        <input
                          ref={editRef}
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onBlur={commitRename}
                          onKeyDown={(e) => { 
                            if (e.key === 'Enter') commitRename(); 
                            if (e.key === 'Escape') setEditingInvId(null); 
                          }}
                          style={{ 
                            flex: 1, 
                            background: '#111', 
                            border: '1px solid #444', 
                            borderRadius: 3, 
                            padding: '3px 6px', 
                            fontSize: 11, 
                            color: '#e0e0e0', 
                            outline: 'none', 
                            fontFamily: 'inherit' 
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <button
                          onClick={() => { s.switchInvestigation(inv.id); s.setInvestigationMenuOpen(false); }}
                          style={{ 
                            flex: 1, 
                            textAlign: 'left', 
                            fontSize: 11, 
                            color: inv.id === s.activeInvestigationId ? '#e0e0e0' : '#888', 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer', 
                            fontFamily: 'IBM Plex Sans, sans-serif',
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap', 
                            padding: '2px 0' 
                          }}
                        >
                          {inv.name}
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); startRename(inv.id, inv.name); }}
                        style={{ 
                          padding: 4, 
                          color: '#555', 
                          background: 'none', 
                          border: 'none', 
                          cursor: 'pointer', 
                          borderRadius: 3,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#aaa')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#555')}
                        title="Rename"
                      >
                        {Icons.edit}
                      </button>
                      {s.investigations.length > 1 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${inv.name}"?`)) s.removeInvestigation(inv.id); }}
                          style={{ 
                            padding: 4, 
                            color: '#555', 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer', 
                            borderRadius: 3,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#555')}
                          title="Delete"
                        >
                          {Icons.close}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                <div style={{ borderTop: '1px solid #222', marginTop: 4, paddingTop: 4 }}>
                  <button
                    onClick={() => { s.addInvestigation(); s.setInvestigationMenuOpen(false); }}
                    style={{ 
                      width: '100%', 
                      padding: '8px 10px', 
                      textAlign: 'left', 
                      fontSize: 11, 
                      color: '#666', 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer', 
                      fontFamily: 'IBM Plex Sans, sans-serif',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      borderRadius: 4,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#222'; e.currentTarget.style.color = '#ccc'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#666'; }}
                  >
                    {Icons.plus}
                    New Investigation
                  </button>
                  {s.investigations.length > 1 && (
                    <button
                      onClick={() => { if (confirm('Combine all investigations?')) { s.combineInvestigations(); s.setInvestigationMenuOpen(false); } }}
                      style={{ 
                        width: '100%', 
                        padding: '8px 10px', 
                        textAlign: 'left', 
                        fontSize: 11, 
                        color: '#666', 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer', 
                        fontFamily: 'IBM Plex Sans, sans-serif',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        borderRadius: 4,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#222'; e.currentTarget.style.color = '#ccc'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#666'; }}
                    >
                      {Icons.combine}
                      Combine All
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div style={{ width: 1, height: 20, background: '#222', margin: '0 6px' }} />

        {/* Add Card Dropdown */}
        <div style={{ position: 'relative' }}>
          <ToolbarButton
            onClick={() => setShowAddMenu(!showAddMenu)}
            active={showAddMenu}
            title="Add Card"
          >
            {Icons.plus}
            <span>Add</span>
            {Icons.chevron}
          </ToolbarButton>

          {showAddMenu && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowAddMenu(false)} />
              <div className="animate-fade-in" style={{ 
                position: 'absolute', 
                left: 0, 
                top: 'calc(100% + 4px)', 
                zIndex: 50,
                width: 200, 
                background: '#1a1a1a', 
                border: '1px solid #2a2a2a', 
                borderRadius: 6, 
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)', 
                padding: 6,
              }}>
                {cardGroups.map((group, gi) => (
                  <div key={group.label}>
                    {gi > 0 && <div style={{ borderTop: '1px solid #222', margin: '6px 0' }} />}
                    <p style={{ 
                      fontSize: 9, 
                      color: '#555', 
                      padding: '4px 8px', 
                      fontFamily: 'IBM Plex Mono, monospace', 
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}>
                      {group.label}
                    </p>
                    {group.items.map(({ type, label, icon }) => (
                      <button
                        key={type}
                        onClick={() => { s.addCard(type); setShowAddMenu(false); }}
                        style={{ 
                          width: '100%', 
                          padding: '7px 8px', 
                          textAlign: 'left', 
                          fontSize: 11, 
                          color: '#888', 
                          background: 'none', 
                          border: 'none', 
                          cursor: 'pointer', 
                          fontFamily: 'IBM Plex Sans, sans-serif',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          borderRadius: 4,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#252525'; e.currentTarget.style.color = '#e0e0e0'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#888'; }}
                      >
                        <span style={{ opacity: 0.8 }}>{icon}</span>
                        {label}
                      </button>
                    ))}
                  </div>
                ))}
                
                <div style={{ borderTop: '1px solid #222', margin: '6px 0' }} />
                <button
                  onClick={() => { s.setCustomUrlModalOpen(true); setShowAddMenu(false); }}
                  style={{ 
                    width: '100%', 
                    padding: '7px 8px', 
                    textAlign: 'left', 
                    fontSize: 11, 
                    color: '#888', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    fontFamily: 'IBM Plex Sans, sans-serif',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    borderRadius: 4,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#252525'; e.currentTarget.style.color = '#e0e0e0'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#888'; }}
                >
                  <span style={{ opacity: 0.8 }}>{Icons.url}</span>
                  Custom URL
                </button>
              </div>
            </>
          )}
        </div>

        {/* Quick add buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ToolbarButton onClick={() => s.addCard('note')} title="Add Note">{Icons.note}</ToolbarButton>
          <ToolbarButton onClick={() => s.addCard('image')} title="Add Image">{Icons.image}</ToolbarButton>
          <ToolbarButton onClick={() => s.addCard('video')} title="Add Video">{Icons.video}</ToolbarButton>
        </div>

        <div style={{ width: 1, height: 20, background: '#222', margin: '0 6px' }} />

        {/* API Workspace */}
        <ToolbarButton
          onClick={() => s.setApiWorkspaceOpen(!s.apiWorkspaceOpen)}
          active={s.apiWorkspaceOpen}
          title="API Workspace"
        >
          {Icons.api}
          <span className="hidden sm:inline">API</span>
        </ToolbarButton>

        {/* Line Style */}
        <div style={{ position: 'relative' }}>
          <ToolbarButton
            onClick={() => setShowLineMenu(!showLineMenu)}
            active={showLineMenu}
            title="Line Style"
          >
            <svg width="16" height="16" viewBox="0 0 16 16">
              <line 
                x1="2" y1="14" x2="14" y2="2" 
                stroke={s.defaultEdgeColor} 
                strokeWidth={Math.min(s.defaultStrokeWidth, 2.5)}
                strokeDasharray={s.defaultLineStyle === 'dashed' ? '4 2' : s.defaultLineStyle === 'dotted' ? '2 2' : '0'} 
              />
            </svg>
          </ToolbarButton>
          
          {showLineMenu && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowLineMenu(false)} />
              <div className="animate-fade-in" style={{ 
                position: 'absolute', 
                left: 0, 
                top: 'calc(100% + 4px)', 
                zIndex: 50,
                width: 200, 
                background: '#1a1a1a', 
                border: '1px solid #2a2a2a', 
                borderRadius: 6, 
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)', 
                padding: 12,
              }}>
                <p style={{ fontSize: 9, color: '#555', marginBottom: 8, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Color</p>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                  {QUICK_COLORS.map((c) => (
                    <button 
                      key={c} 
                      onClick={() => s.setDefaultEdgeColor(c)}
                      style={{ 
                        width: 18, 
                        height: 18, 
                        borderRadius: '50%', 
                        background: c, 
                        border: s.defaultEdgeColor === c ? '2px solid #fff' : '2px solid transparent', 
                        cursor: 'pointer', 
                        transition: 'transform 0.1s' 
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    />
                  ))}
                  <input 
                    type="color" 
                    value={s.defaultEdgeColor} 
                    onChange={(e) => s.setDefaultEdgeColor(e.target.value)}
                    style={{ width: 18, height: 18, borderRadius: '50%', border: '1px solid #333', cursor: 'pointer', padding: 0 }} 
                  />
                </div>
                
                <p style={{ fontSize: 9, color: '#555', marginBottom: 6, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Style</p>
                <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                  {(['solid','dashed','dotted'] as LineStyle[]).map((l) => (
                    <button 
                      key={l} 
                      onClick={() => s.setDefaultLineStyle(l)}
                      style={{ 
                        flex: 1, 
                        padding: '5px 0', 
                        borderRadius: 4, 
                        border: `1px solid ${s.defaultLineStyle === l ? '#444' : '#2a2a2a'}`,
                        background: s.defaultLineStyle === l ? '#252525' : 'transparent', 
                        fontSize: 10, 
                        color: s.defaultLineStyle === l ? '#ccc' : '#666', 
                        cursor: 'pointer', 
                        fontFamily: 'IBM Plex Sans, sans-serif',
                        textTransform: 'capitalize',
                      }}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                
                <p style={{ fontSize: 9, color: '#555', marginBottom: 6, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Weight</p>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[1,2,3,4].map((w) => (
                    <button 
                      key={w} 
                      onClick={() => s.setDefaultStrokeWidth(w)}
                      style={{ 
                        flex: 1, 
                        padding: '8px 0', 
                        borderRadius: 4, 
                        border: `1px solid ${s.defaultStrokeWidth === w ? '#444' : '#2a2a2a'}`,
                        background: s.defaultStrokeWidth === w ? '#252525' : 'transparent', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}
                    >
                      <div style={{ width: 16, height: Math.max(w, 1), background: s.defaultEdgeColor, borderRadius: 1 }} />
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Grid Toggle */}
        <ToolbarButton
          onClick={() => s.setShowDots(!s.showDots)}
          active={s.showDots}
          title="Toggle Grid"
        >
          <span style={{ opacity: s.showDots ? 1 : 0.4 }}>{Icons.grid}</span>
        </ToolbarButton>

        {/* AI Panel */}
        <ToolbarButton
          onClick={() => s.setAiPanelOpen(!s.aiPanelOpen)}
          active={s.aiPanelOpen}
          title="AI Assistant"
        >
          {Icons.ai}
          <span className="hidden sm:inline">AI</span>
        </ToolbarButton>

        <div style={{ flex: 1 }} />

        {/* Stats */}
        <div style={{ 
          display: 'flex', 
          gap: 12, 
          marginRight: 8, 
          fontSize: 10, 
          color: '#444', 
          fontFamily: 'IBM Plex Mono, monospace' 
        }} className="hidden md:flex">
          <span>{s.nodes.length} nodes</span>
          <span>{s.edges.length} edges</span>
        </div>

        {/* Undo */}
        <ToolbarButton onClick={() => s.undo()} title="Undo (Ctrl+Z)">
          {Icons.undo}
        </ToolbarButton>

        {/* Menu */}
        <div style={{ position: 'relative' }}>
          <ToolbarButton onClick={() => setShowMenu(!showMenu)} active={showMenu} title="Menu">
            {Icons.menu}
          </ToolbarButton>
          
          {showMenu && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowMenu(false)} />
              <div className="animate-fade-in" style={{ 
                position: 'absolute', 
                right: 0, 
                top: 'calc(100% + 4px)', 
                zIndex: 50,
                width: 180, 
                background: '#1a1a1a', 
                border: '1px solid #2a2a2a', 
                borderRadius: 6, 
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)', 
                padding: 4,
              }}>
                {[
                  { label: 'Export', icon: Icons.export, action: () => { s.setExportModalOpen(true); setShowMenu(false); } },
                  { label: 'Import', icon: Icons.import, action: () => { s.setImportModalOpen(true); setShowMenu(false); } },
                  { label: 'API Settings', icon: Icons.settings, action: () => { s.setApiSettingsOpen(true); setShowMenu(false); } },
                ].map(({ label, icon, action }) => (
                  <button 
                    key={label} 
                    onClick={action}
                    style={{ 
                      width: '100%', 
                      padding: '8px 10px', 
                      textAlign: 'left', 
                      fontSize: 11, 
                      color: '#888', 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer', 
                      fontFamily: 'IBM Plex Sans, sans-serif',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      borderRadius: 4,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#252525'; e.currentTarget.style.color = '#e0e0e0'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#888'; }}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
                
                <div style={{ borderTop: '1px solid #222', margin: '4px 0' }} />
                
                <button
                  onClick={() => { if (confirm('Clear the current workspace?')) { s.clearWorkspace(); setShowMenu(false); } }}
                  style={{ 
                    width: '100%', 
                    padding: '8px 10px', 
                    textAlign: 'left', 
                    fontSize: 11, 
                    color: '#666', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    fontFamily: 'IBM Plex Sans, sans-serif',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    borderRadius: 4,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#2a1a1a'; e.currentTarget.style.color = '#ef4444'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#666'; }}
                >
                  {Icons.trash}
                  Clear Workspace
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
