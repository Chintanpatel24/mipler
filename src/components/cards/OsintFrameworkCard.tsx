import React from 'react';
import { Handle, Position } from 'reactflow';
import { BaseCard } from './BaseCard';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import type { CardData } from '../../types';

export const OsintFrameworkCard: React.FC<{ id: string; data: CardData }> = ({ id, data }) => {
  const updateCard = useWorkspaceStore((s) => s.updateCard);
  return (
    <>
      <Handle type="source" position={Position.Top} id="t" className="mipler-handle" style={{ top: -7 }} />
      <Handle type="source" position={Position.Bottom} id="b" className="mipler-handle" style={{ bottom: -7 }} />
      <Handle type="source" position={Position.Left} id="l" className="mipler-handle" style={{ left: -7 }} />
      <Handle type="source" position={Position.Right} id="r" className="mipler-handle" style={{ right: -7 }} />
      <BaseCard id={id} title={data.title} width={data.width} cardColor={data.cardColor} onTitleChange={(t) => updateCard(id, { title: t })}
        headerExtra={<a href="https://osintframework.com/" target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono text-black/40 bg-black/5 px-1.5 py-0.5 rounded">↗</a>}>
        <iframe src="https://osintframework.com/" title="OSINT" sandbox="allow-scripts allow-same-origin allow-popups" className="w-full rounded border border-black/10 bg-white" style={{ height: 300 }} />
      </BaseCard>
    </>
  );
};