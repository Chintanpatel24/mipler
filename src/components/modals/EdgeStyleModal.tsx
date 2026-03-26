import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import type { LineStyle } from '../../types';

const COLORS = ['#888888','#ffffff','#ff4444','#ff8800','#ffcc00','#44ff44','#00ccff','#4488ff','#aa44ff','#ff44aa','#ff6666','#66ff66','#6666ff','#ffaa00','#00ffaa'];
const STYLES: { value: LineStyle; label: string; preview: string }[] = [
  { value: 'dashed', label: 'Dashed', preview: '- - - -' },
  { value: 'dotted', label: 'Dotted', preview: '· · · ·' },
  { value: 'solid', label: 'Solid', preview: '————' },
];

export const EdgeStyleModal: React.FC = () => {
  const { edgeStyleModalOpen, selectedEdgeId, edges, setEdgeStyleModalOpen, updateEdgeStyle, defaultEdgeColor, defaultLineStyle, defaultStrokeWidth, setDefaultEdgeColor, setDefaultLineStyle, setDefaultStrokeWidth } = useWorkspaceStore();
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
    <Modal open={edgeStyleModalOpen} onClose={() => setEdgeStyleModalOpen(false)} title="Connection Style" width="max-w-md">
      <div className="space-y-4">
        <div className="bg-wall-bg rounded-lg p-3 border border-wall-cardBorder">
          <svg width="100%" height="36" viewBox="0 0 300 36"><circle cx="18" cy="18" r={5} fill={color} stroke="#333" strokeWidth={1} /><line x1="23" y1="18" x2="277" y2="18" stroke={color} strokeWidth={sw} strokeDasharray={dashMap[ls]} strokeLinecap="round" /><circle cx="282" cy="18" r={5} fill={color} stroke="#333" strokeWidth={1} /></svg>
        </div>
        <div><p className="text-xs text-wall-textMuted mb-2">Color</p><div className="flex flex-wrap gap-1.5">{COLORS.map((c) => <button key={c} onClick={() => setColor(c)} className={`w-6 h-6 rounded-full border-2 hover:scale-110 transition-all ${color === c ? 'border-white scale-110' : 'border-wall-cardBorder'}`} style={{ backgroundColor: c }} />)}<input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border border-wall-cardBorder" /></div></div>
        <div><p className="text-xs text-wall-textMuted mb-2">Pattern</p><div className="flex gap-2">{STYLES.map((s) => <button key={s.value} onClick={() => setLs(s.value)} className={`flex-1 py-2 rounded-lg border text-xs ${ls === s.value ? 'bg-wall-cardHover border-wall-textMuted text-wall-text' : 'bg-wall-card border-wall-cardBorder text-wall-textMuted'}`}><span className="font-mono">{s.preview}</span><br/><span className="text-[10px]">{s.label}</span></button>)}</div></div>
        <div><p className="text-xs text-wall-textMuted mb-2">Thickness</p><div className="flex gap-1.5">{[1,1.5,2,3,4,5].map((w) => <button key={w} onClick={() => setSw(w)} className={`flex-1 py-2 rounded-lg border flex items-center justify-center ${sw === w ? 'bg-wall-cardHover border-wall-textMuted' : 'bg-wall-card border-wall-cardBorder'}`}><div className="rounded-full" style={{ width: 20, height: Math.max(w, 1), backgroundColor: color }} /></button>)}</div></div>
        <div className="flex gap-2 pt-2 border-t border-wall-cardBorder"><Button onClick={apply} className="flex-1">Apply</Button><Button onClick={applyAll} variant="secondary" className="flex-1">Apply to All</Button></div>
      </div>
    </Modal>
  );
};