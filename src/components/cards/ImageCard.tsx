import React, { useCallback } from 'react';
import { BaseCard } from './BaseCard';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import type { CardData } from '../../types';

export const ImageCard: React.FC<{ id: string; data: CardData }> = ({ id, data }) => {
  const updateCard = useWorkspaceStore((s) => s.updateCard);
  const isLight = data.cardColor === '#ffffff' || data.cardColor === '#f5f5f0';
  const textColor = isLight ? '#2a2a2a' : '#ccc';

  const pick = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const f = input.files?.[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = (e) => updateCard(id, { imageData: e.target?.result as string, fileName: f.name, title: f.name });
      r.readAsDataURL(f);
    };
    input.click();
  }, [id, updateCard]);

  return (
    <BaseCard id={id} title={data.title} width={data.width} cardColor={data.cardColor} onTitleChange={(t) => updateCard(id, { title: t })}>
      {data.imageData
        ? <img src={data.imageData} alt={data.title} onClick={pick}
            style={{ width: '100%', borderRadius: 4, border: '1px solid #2a2a2a', cursor: 'pointer', maxHeight: 280, objectFit: 'contain', display: 'block' }} />
        : <button onClick={pick}
            style={{ width: '100%', padding: '32px 0', border: '1px dashed #2a2a2a', borderRadius: 4, background: 'transparent', color: '#444', fontSize: 11, cursor: 'pointer', fontFamily: 'IBM Plex Sans' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#444')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#2a2a2a')}>
            Click to upload image
          </button>
      }
      <textarea
        value={data.content}
        onChange={(e) => updateCard(id, { content: e.target.value })}
        placeholder="Caption..."
        rows={2}
        style={{ width: '100%', marginTop: 6, background: 'transparent', fontSize: 11, resize: 'none', border: 'none', outline: 'none', color: textColor, fontFamily: 'IBM Plex Sans' }}
      />
    </BaseCard>
  );
};
