import React from 'react';
import { Handle, Position } from 'reactflow';
import { BaseCard } from './BaseCard';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import type { CardData } from '../../types';

export const NoteCard: React.FC<{ id: string; data: CardData }> = ({ id, data }) => {
  const updateCard = useWorkspaceStore((s) => s.updateCard);
  const isDark = data.cardColor === '#263238';
  return (
    <>
      <Handle type="source" position={Position.Top} id="t" className="mipler-handle" style={{ top: -7 }} />
      <Handle type="source" position={Position.Bottom} id="b" className="mipler-handle" style={{ bottom: -7 }} />
      <Handle type="source" position={Position.Left} id="l" className="mipler-handle" style={{ left: -7 }} />
      <Handle type="source" position={Position.Right} id="r" className="mipler-handle" style={{ right: -7 }} />
      <BaseCard id={id} title={data.title} width={data.width} cardColor={data.cardColor} onTitleChange={(t) => updateCard(id, { title: t })}>
        <textarea value={data.content} onChange={(e) => updateCard(id, { content: e.target.value })}
          placeholder="Type your investigation notes here..."
          className="w-full bg-transparent text-xs leading-relaxed resize-none border-none outline-none font-handwriting"
          style={{ minHeight: '120px', color: isDark ? '#cfd8dc' : '#2a2a2a' }} />
      </BaseCard>
    </>
  );
};