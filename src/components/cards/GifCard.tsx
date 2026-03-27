import React, { useCallback } from 'react';
import { BaseCard } from './BaseCard';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import type { CardData } from '../../types';

interface GifCardProps {
  id: string;
  data: CardData;
}

export const GifCard: React.FC<GifCardProps> = ({ id, data }) => {
  const updateCard = useWorkspaceStore((s) => s.updateCard);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.includes('gif')) {
      alert('Please select a GIF file');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateCard(id, {
        gifData: reader.result as string,
        fileName: file.name,
        title: data.title === 'GIF' ? file.name.replace(/\.[^/.]+$/, '') : data.title,
      });
    };
    reader.readAsDataURL(file);
  }, [id, data.title, updateCard]);

  const handleUrlLoad = useCallback(() => {
    const url = prompt('Enter GIF URL:');
    if (url) {
      updateCard(id, { gifData: url, fileName: 'External GIF' });
    }
  }, [id, updateCard]);

  const handleRemove = useCallback(() => {
    updateCard(id, { gifData: undefined, fileName: undefined });
  }, [id, updateCard]);

  return (
    <BaseCard
      id={id}
      title={data.title}
      width={data.width || 320}
      cardColor={data.cardColor}
      onTitleChange={(title) => updateCard(id, { title })}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.gifData ? (
          <div style={{ position: 'relative' }}>
            <img
              src={data.gifData}
              alt={data.fileName || 'GIF'}
              style={{
                width: '100%',
                borderRadius: 4,
                background: '#0a0a0a',
              }}
            />
            <div style={{ 
              position: 'absolute', 
              top: 6, 
              right: 6, 
              display: 'flex', 
              gap: 4 
            }}>
              <button
                onClick={handleRemove}
                style={{
                  padding: '4px 8px',
                  background: 'rgba(0,0,0,0.7)',
                  border: '1px solid #333',
                  borderRadius: 4,
                  color: '#888',
                  fontSize: 10,
                  cursor: 'pointer',
                  fontFamily: 'IBM Plex Mono, monospace',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#888')}
              >
                Remove
              </button>
            </div>
            {data.fileName && (
              <p style={{ 
                fontSize: 10, 
                color: '#555', 
                marginTop: 6, 
                fontFamily: 'IBM Plex Mono, monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {data.fileName}
              </p>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px 16px',
                border: '1px dashed #333',
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#555';
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#333';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" fill="#555" />
                <path d="M21 15L16 10L5 21" />
                <path d="M14 14L12 12L8 16" />
              </svg>
              <span style={{ fontSize: 11, color: '#555', marginTop: 8, fontFamily: 'IBM Plex Sans' }}>
                Drop GIF or click to upload
              </span>
              <input
                type="file"
                accept=".gif,image/gif"
                onChange={handleFile}
                style={{ display: 'none' }}
              />
            </label>
            <button
              onClick={handleUrlLoad}
              style={{
                padding: '8px 12px',
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: 5,
                color: '#666',
                fontSize: 11,
                cursor: 'pointer',
                fontFamily: 'IBM Plex Sans',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#444';
                e.currentTarget.style.color = '#aaa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#2a2a2a';
                e.currentTarget.style.color = '#666';
              }}
            >
              Load from URL
            </button>
          </div>
        )}
      </div>
    </BaseCard>
  );
};
