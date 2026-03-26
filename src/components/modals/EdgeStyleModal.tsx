import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import type { LineStyle } from '../../types';

const COLORS = ['#888888','#e0e0e0','#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#06b6d4'];

export const EdgeStyleModal: React.FC = () => {
  const { edgeStyleModalOpen, selectedEdgeId, edges, setEdgeStyleModalOpen, updateEdgeStyle,
    defaultEdgeColor, defaultLineStyle, defaultStrokeWidth, setDefaultEdgeColor, setDefaultLineStyle, setDefaultStrokeWidth } = useWorkspaceStore();
  const edge = edges.find((e) => e.id === selectedEdgeId);
  const [color, setColor] = useState(defaultEdgeColor);
  const [ls, setLs] = useState<LineStyle>(defaultLineStyle);
  const [sw, setSw] = useState(defaultStrokeWidth);

  useEffect(() => {
    if (edge?.data) { setColor(edge.data.color || defaultEdgeColor); setLs(edge.data.lineStyle || defaultLineStyle); setSw(edge.data.strokeWidth || defaultStrokeWidth); }
    else { setColor(defaultEdgeColor); setLs(defaultLineStyle); setSw(defaultStrokeWidth); }
  }, [edge, defaultEdgeColor, defaultLineStyle, defaultStrokeWidth]);

  const dashMap: Record<LineStyle, string> = { dashed: '8 4', dotted: '3 4', solid: '0' };
  const apply = () => { if (selectedEdgeId) updateEdgeStyle(selectedEdgeId, { color, lineStyle: ls, strokeWidth: sw }); setEdgeStyleModalOpen(false); };
  const applyAll = () => { edges.forEach((e) => updateEdgeStyle(e.id, { color, lineStyle: ls, strokeWidth: sw })); setDefaultEdgeColor(color); setDefaultLineStyle(ls); setDefaultStrokeWidth(sw); setEdgeStyleModalOpen(false); };

  return (
    <Modal open={edgeStyleModalOpen} onClose={() => setEdgeStyleModalOpen(false)} title="Connection Style">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Preview */}
        <div style={{ background: '#111', border: '1px solid #222', borderRadius: 5, padding: '10px 0' }}>
          <svg width="100%" height="32" viewBox="0 0 300 32">
            <circle cx="18" cy="16" r={4} fill={color} />
            <line x1="24" y1="16" x2="276" y2="16" stroke={color} strokeWidth={sw} strokeDasharray={dashMap[ls]} strokeLinecap="round" />
            <circle cx="282" cy="16" r={4} fill={color} />
          </svg>
        </div>

        {/* Color */}
        <div>
          <p style={{ fontSize: 10, color: '#555', marginBottom: 8, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.06em' }}>COLOR</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {COLORS.map((c) => (
              <button key={c} onClick={() => setColor(c)}
                style={{ width: 20, height: 20, borderRadius: '50%', background: c, border: `2px solid ${color === c ? '#fff' : 'transparent'}`, cursor: 'pointer', transition: 'transform 0.1s' }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')} />
            ))}
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
              style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #333', cursor: 'pointer', padding: 0 }} />
          </div>
        </div>

        {/* Pattern */}
        <div>
          <p style={{ fontSize: 10, color: '#555', marginBottom: 8, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.06em' }}>PATTERN</p>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['solid','dashed','dotted'] as LineStyle[]).map((l) => (
              <button key={l} onClick={() => setLs(l)}
                style={{
                  flex: 1, padding: '6px 0', borderRadius: 5, fontSize: 11,
                  border: `1px solid ${ls === l ? '#444' : '#2a2a2a'}`,
                  background: ls === l ? '#2a2a2a' : '#1a1a1a',
                  color: ls === l ? '#ccc' : '#555', cursor: 'pointer',
                  fontFamily: 'IBM Plex Mono, monospace',
                }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Weight */}
        <div>
          <p style={{ fontSize: 10, color: '#555', marginBottom: 8, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.06em' }}>WEIGHT</p>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 1.5, 2, 3, 4, 5].map((w) => (
              <button key={w} onClick={() => setSw(w)}
                style={{
                  flex: 1, padding: '7px 0', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${sw === w ? '#444' : '#2a2a2a'}`,
                  background: sw === w ? '#2a2a2a' : '#1a1a1a', cursor: 'pointer',
                }}>
                <div style={{ width: 18, height: Math.max(w, 1), background: color, borderRadius: 1 }} />
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, paddingTop: 4, borderTop: '1px solid #222' }}>
          <button onClick={apply}
            style={{ flex: 1, padding: '7px 0', background: '#0e639c', color: '#fff', border: 'none', borderRadius: 5, fontSize: 12, cursor: 'pointer', fontFamily: 'IBM Plex Sans' }}>
            Apply
          </button>
          <button onClick={applyAll}
            style={{ flex: 1, padding: '7px 0', background: '#2a2a2a', color: '#ccc', border: 'none', borderRadius: 5, fontSize: 12, cursor: 'pointer', fontFamily: 'IBM Plex Sans' }}>
            Apply to All
          </button>
        </div>
      </div>
    </Modal>
  );
};
