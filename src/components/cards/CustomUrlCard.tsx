import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { BaseCard } from './BaseCard';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import type { CardData } from '../../types';

export const CustomUrlCard: React.FC<{ id: string; data: CardData }> = ({ id, data }) => {
  const updateCard = useWorkspaceStore((s) => s.updateCard);
  const [urlInput, setUrlInput] = useState(data.url || '');
  const [loaded, setLoaded] = useState(data.url || '');
  const load = () => { let u = urlInput.trim(); if (u && !u.startsWith('http')) u = 'https://' + u; setLoaded(u); updateCard(id, { url: u }); };
  return (
    <>
      <Handle type="source" position={Position.Top} id="t" className="mipler-handle" style={{ top: -7 }} />
      <Handle type="source" position={Position.Bottom} id="b" className="mipler-handle" style={{ bottom: -7 }} />
      <Handle type="source" position={Position.Left} id="l" className="mipler-handle" style={{ left: -7 }} />
      <Handle type="source" position={Position.Right} id="r" className="mipler-handle" style={{ right: -7 }} />
      <BaseCard id={id} title={data.title} width={data.width} cardColor={data.cardColor} onTitleChange={(t) => updateCard(id, { title: t })}>
        <div className="flex gap-1.5 mb-2">
          <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} placeholder="https://..." className="flex-1 px-2.5 py-1.5 bg-white border border-black/10 rounded text-xs outline-none" />
          <button onClick={load} className="px-3 py-1.5 bg-black/5 text-black/60 text-xs rounded font-medium">Load</button>
        </div>
        {loaded ? <iframe src={loaded} title={data.title} sandbox="allow-scripts allow-same-origin allow-forms allow-popups" className="w-full rounded border border-black/10 bg-white" style={{ height: 280 }} />
        : <div className="w-full py-10 border-2 border-dashed border-black/10 rounded text-black/30 text-xs text-center">Enter URL above</div>}
      </BaseCard>
    </>
  );
};