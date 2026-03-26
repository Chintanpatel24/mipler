import React, { useState } from 'react';
import { Button } from './ui/Button';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import type { CardType, LineStyle } from '../types';

const QUICK_COLORS = ['#888888','#ffffff','#ff4444','#ffcc00','#44ff44','#4488ff','#aa44ff'];

export const Toolbar: React.FC = () => {
  const s = useWorkspaceStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showLineMenu, setShowLineMenu] = useState(false);

  const cards: { type: CardType; label: string; icon: string }[] = [
    { type: 'note', label: 'Note', icon: '📝' }, { type: 'image', label: 'Image', icon: '🖼' },
    { type: 'pdf', label: 'PDF', icon: '📄' }, { type: 'whois', label: 'WHOIS', icon: '🔍' },
    { type: 'dns', label: 'DNS', icon: '🌐' }, { type: 'reverse-image', label: 'Rev.Img', icon: '🔎' },
    { type: 'osint-framework', label: 'OSINT', icon: '🧰' },
  ];

  const activeInv = s.investigations.find((i) => i.id === s.activeInvestigationId);

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-wall-surface/95 backdrop-blur-sm border-b border-wall-cardBorder">
      <div className="flex items-center h-12 px-3 gap-2">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-2">
          <div className="w-7 h-7 bg-wall-card border border-wall-cardBorder rounded-md flex items-center justify-center">
            <span className="text-xs font-bold text-wall-accent">M</span>
          </div>
          <span className="text-sm font-bold text-wall-text tracking-wider hidden sm:inline">MIPLER</span>
        </div>

        {/* Investigation picker */}
        <div className="relative">
          <button onClick={() => s.setInvestigationMenuOpen(!s.investigationMenuOpen)}
            className="flex items-center gap-1 px-2 py-1 text-sm text-wall-text hover:bg-wall-card rounded-md transition-colors max-w-[180px]">
            <span className="truncate">{activeInv?.name || 'Untitled'}</span>
            <span className="text-wall-textDim text-[10px]">▼</span>
          </button>
          {s.investigationMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => s.setInvestigationMenuOpen(false)} />
              <div className="absolute left-0 top-full mt-1 z-50 w-64 bg-wall-surface border border-wall-cardBorder rounded-lg shadow-xl py-1 animate-fade-in">
                {s.investigations.map((inv) => (
                  <div key={inv.id} className={`flex items-center gap-2 px-3 py-2 hover:bg-wall-card ${inv.id === s.activeInvestigationId ? 'bg-wall-card' : ''}`}>
                    <button onClick={() => { s.switchInvestigation(inv.id); s.setInvestigationMenuOpen(false); }} className="flex-1 text-left text-sm text-wall-text truncate">{inv.name}</button>
                    <input type="text" value={inv.name} onChange={(e) => s.renameInvestigation(inv.id, e.target.value)} onClick={(e) => e.stopPropagation()}
                      className="absolute opacity-0 pointer-events-none" />
                    <button onClick={(e) => { e.stopPropagation(); const name = prompt('Rename:', inv.name); if (name) s.renameInvestigation(inv.id, name); }}
                      className="text-wall-textDim hover:text-wall-text text-[10px] p-1">✏</button>
                    {s.investigations.length > 1 && (
                      <button onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${inv.name}"?`)) s.removeInvestigation(inv.id); }}
                        className="text-wall-textDim hover:text-red-400 text-[10px] p-1">✕</button>
                    )}
                  </div>
                ))}
                <div className="border-t border-wall-cardBorder mt-1 pt-1">
                  <button onClick={() => { s.addInvestigation(); s.setInvestigationMenuOpen(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-wall-textMuted hover:bg-wall-card hover:text-wall-text">+ New Investigation</button>
                  {s.investigations.length > 1 && (
                    <button onClick={() => { if (confirm('Combine all investigations into one?')) { s.combineInvestigations(); s.setInvestigationMenuOpen(false); } }}
                      className="w-full px-3 py-2 text-left text-sm text-wall-textMuted hover:bg-wall-card hover:text-wall-text">⊕ Combine All</button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="w-px h-6 bg-wall-cardBorder" />

        {/* Card buttons */}
        <div className="flex items-center gap-0.5 overflow-x-auto">
          {cards.map(({ type, label, icon }) => (
            <button key={type} onClick={() => s.addCard(type)} className="flex items-center gap-1 px-1.5 py-1.5 text-xs text-wall-textMuted hover:text-wall-text hover:bg-wall-card rounded-md whitespace-nowrap" title={label}>
              <span className="text-sm">{icon}</span><span className="hidden xl:inline">{label}</span>
            </button>
          ))}
          <button onClick={() => s.setCustomUrlModalOpen(true)} className="flex items-center gap-1 px-1.5 py-1.5 text-xs text-wall-textMuted hover:text-wall-text hover:bg-wall-card rounded-md whitespace-nowrap">🔗</button>
        </div>

        <div className="w-px h-6 bg-wall-cardBorder" />

        {/* Line style */}
        <div className="relative">
          <button onClick={() => setShowLineMenu(!showLineMenu)} className="px-1.5 py-1.5 text-xs text-wall-textMuted hover:text-wall-text hover:bg-wall-card rounded-md" title="Line style">
            <svg width="14" height="14" viewBox="0 0 14 14"><line x1="1" y1="13" x2="13" y2="1" stroke={s.defaultEdgeColor} strokeWidth={2} strokeDasharray={s.defaultLineStyle === 'dashed' ? '4 2' : s.defaultLineStyle === 'dotted' ? '2 2' : '0'} /></svg>
          </button>
          {showLineMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowLineMenu(false)} />
              <div className="absolute left-0 top-full mt-1 z-50 w-48 bg-wall-surface border border-wall-cardBorder rounded-lg shadow-xl p-2.5 animate-fade-in space-y-2">
                <div className="flex gap-1 flex-wrap">{QUICK_COLORS.map((c) => <button key={c} onClick={() => s.setDefaultEdgeColor(c)} className={`w-5 h-5 rounded-full border-2 ${s.defaultEdgeColor === c ? 'border-white scale-110' : 'border-wall-cardBorder'}`} style={{ backgroundColor: c }} />)}</div>
                <div className="flex gap-1">{(['solid','dashed','dotted'] as LineStyle[]).map((l) => <button key={l} onClick={() => s.setDefaultLineStyle(l)} className={`flex-1 py-1 rounded text-[10px] border ${s.defaultLineStyle === l ? 'bg-wall-cardHover border-wall-textMuted text-wall-text' : 'bg-wall-card border-wall-cardBorder text-wall-textMuted'}`}>{l}</button>)}</div>
                <div className="flex gap-1">{[1,2,3,4].map((w) => <button key={w} onClick={() => s.setDefaultStrokeWidth(w)} className={`flex-1 py-1.5 rounded border flex items-center justify-center ${s.defaultStrokeWidth === w ? 'bg-wall-cardHover border-wall-textMuted' : 'bg-wall-card border-wall-cardBorder'}`}><div style={{ width: 14, height: Math.max(w, 1), backgroundColor: s.defaultEdgeColor, borderRadius: 2 }} /></button>)}</div>
              </div>
            </>
          )}
        </div>

        {/* Dots toggle */}
        <button onClick={() => s.setShowDots(!s.showDots)} className={`px-1.5 py-1.5 text-xs rounded-md transition-colors ${s.showDots ? 'text-wall-text bg-wall-card' : 'text-wall-textDim'}`} title="Toggle grid dots">⋯</button>

        {/* AI */}
        <button onClick={() => s.setAiPanelOpen(!s.aiPanelOpen)} className={`px-1.5 py-1.5 text-xs rounded-md transition-colors ${s.aiPanelOpen ? 'text-wall-text bg-wall-card' : 'text-wall-textMuted hover:text-wall-text hover:bg-wall-card'}`} title="AI Assistant">🤖</button>

        <div className="flex-1" />

        {/* Stats */}
        <div className="text-[10px] text-wall-textDim font-mono hidden md:flex items-center gap-3 mr-2">
          <span>{s.nodes.length} cards</span>
          <span>{s.edges.length} links</span>
          <span>{s.investigations.length} inv</span>
        </div>

        {/* Undo */}
        <button onClick={() => s.undo()} className="text-wall-textMuted hover:text-wall-text px-1.5 py-1.5 text-xs rounded-md hover:bg-wall-card" title="Undo (Ctrl+Z)">↩</button>

        {/* Menu */}
        <div className="relative">
          <Button variant="ghost" size="sm" onClick={() => setShowMenu(!showMenu)}>⋮</Button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 w-52 bg-wall-surface border border-wall-cardBorder rounded-lg shadow-xl py-1 animate-fade-in">
                <button onClick={() => { s.setExportModalOpen(true); setShowMenu(false); }} className="w-full px-3 py-2.5 text-left text-sm text-wall-text hover:bg-wall-card flex items-center gap-2">📦 Export</button>
                <button onClick={() => { s.setImportModalOpen(true); setShowMenu(false); }} className="w-full px-3 py-2.5 text-left text-sm text-wall-text hover:bg-wall-card flex items-center gap-2">📂 Import</button>
                <button onClick={() => { s.setApiSettingsOpen(true); setShowMenu(false); }} className="w-full px-3 py-2.5 text-left text-sm text-wall-text hover:bg-wall-card flex items-center gap-2">⚙ API Settings</button>
                <div className="border-t border-wall-cardBorder my-1" />
                <button onClick={() => { if (confirm('Clear workspace?')) s.clearWorkspace(); setShowMenu(false); }} className="w-full px-3 py-2.5 text-left text-sm text-red-400 hover:bg-red-900/20 flex items-center gap-2">🗑 Clear</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};