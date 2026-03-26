import React from 'react';
import { Handle, Position } from 'reactflow';
import { BaseCard } from './BaseCard';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import type { CardData } from '../../types';

export const ReverseImageCard: React.FC<{ id: string; data: CardData }> = ({ id, data }) => {
  const updateCard = useWorkspaceStore((s) => s.updateCard);
  const services = [{ name: 'Google', url: 'https://images.google.com/' }, { name: 'TinEye', url: 'https://tineye.com/' }, { name: 'Yandex', url: 'https://yandex.com/images/' }];
  const cur = data.url || services[0].url;
  return (
    <>
      <Handle type="source" position={Position.Top} id="t" className="mipler-handle" style={{ top: -7 }} />
      <Handle type="source" position={Position.Bottom} id="b" className="mipler-handle" style={{ bottom: -7 }} />
      <Handle type="source" position={Position.Left} id="l" className="mipler-handle" style={{ left: -7 }} />
      <Handle type="source" position={Position.Right} id="r" className="mipler-handle" style={{ right: -7 }} />
      <BaseCard id={id} title={data.title} width={data.width} cardColor={data.cardColor} onTitleChange={(t) => updateCard(id, { title: t })}>
        <div className="flex gap-1 mb-2">{services.map((s) => <button key={s.name} onClick={() => updateCard(id, { url: s.url })} className={`px-2.5 py-1 text-[10px] rounded font-medium ${cur === s.url ? 'bg-black/10 text-black/70' : 'bg-black/3 text-black/40'}`}>{s.name}</button>)}</div>
        <iframe src={cur} title="Rev Image" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" className="w-full rounded border border-black/10 bg-white" style={{ height: 280 }} />
      </BaseCard>
    </>
  );
};