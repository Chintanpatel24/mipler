import React from 'react';
import { BaseCard } from './BaseCard';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import type { CardData } from '../../types';

export const NoteCard: React.FC<{ id: string; data: CardData }> = ({ id, data }) => {
  const updateCard = useWorkspaceStore((s) => s.updateCard);
  const isLight = data.cardColor === '#ffffff' || data.cardColor === '#f5f5f0';
  const textColor = isLight ? '#2a2a2a' : '#cccccc';

  return (
    <BaseCard id={id} title={data.title} width={data.width} cardColor={data.cardColor} onTitleChange={(t) => updateCard(id, { title: t })}>
      <textarea
        value={data.content}
        onChange={(e) => updateCard(id, { content: e.target.value })}
        placeholder="Type investigation notes here..."
        style={{
          width: '100%', background: 'transparent', fontSize: 12,
          lineHeight: 1.6, resize: 'none', border: 'none', outline: 'none',
          minHeight: 120, color: textColor, fontFamily: 'IBM Plex Sans, sans-serif',
        }}
      />
    </BaseCard>
  );
};
