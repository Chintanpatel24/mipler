import React from 'react';
import { BaseCard } from './BaseCard';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import type { CardData } from '../../types';

export const OsintFrameworkCard: React.FC<{ id: string; data: CardData }> = ({ id, data }) => {
  const updateCard = useWorkspaceStore((s) => s.updateCard);
  const tag = (
    <a href="https://osintframework.com/" target="_blank" rel="noopener noreferrer"
      style={{ fontSize: 9, fontFamily: 'IBM Plex Mono, monospace', color: '#666', background: '#222', padding: '1px 6px', borderRadius: 3, textDecoration: 'none' }}>
      OSINT FW
    </a>
  );
  return (
    <BaseCard id={id} title={data.title} width={data.width} cardColor={data.cardColor}
      onTitleChange={(t) => updateCard(id, { title: t })} headerExtra={tag}>
      <iframe src="https://osintframework.com/" title="OSINT Framework"
        sandbox="allow-scripts allow-same-origin allow-popups"
        style={{ width: '100%', height: 300, borderRadius: 4, border: '1px solid #2a2a2a', background: '#fff' }} />
    </BaseCard>
  );
};
