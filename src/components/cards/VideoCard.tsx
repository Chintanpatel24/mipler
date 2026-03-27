import React, { useCallback, useRef } from 'react';
import { BaseCard } from './BaseCard';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import type { CardData } from '../../types';

interface VideoCardProps {
  id: string;
  data: CardData;
}

export const VideoCard: React.FC<VideoCardProps> = ({ id, data }) => {
  const updateCard = useWorkspaceStore((s) => s.updateCard);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.includes('video')) {
      alert('Please select a video file');
      return;
    }

    // Check file size (limit to 50MB for base64)
    if (file.size > 50 * 1024 * 1024) {
      alert('Video file too large. Maximum size is 50MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateCard(id, {
        videoData: reader.result as string,
        fileName: file.name,
        title: data.title === 'Video' ? file.name.replace(/\.[^/.]+$/, '') : data.title,
      });
    };
    reader.readAsDataURL(file);
  }, [id, data.title, updateCard]);

  const handleUrlLoad = useCallback(() => {
    const url = prompt('Enter video URL (MP4, WebM, etc.):');
    if (url) {
      updateCard(id, { videoData: url, fileName: 'External Video' });
    }
  }, [id, updateCard]);

  const handleRemove = useCallback(() => {
    updateCard(id, { videoData: undefined, fileName: undefined });
  }, [id, updateCard]);

  return (
    <BaseCard
      id={id}
      title={data.title}
      width={data.width || 360}
      cardColor={data.cardColor}
      onTitleChange={(title) => updateCard(id, { title })}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.videoData ? (
          <div style={{ position: 'relative' }}>
            <video
              ref={videoRef}
              src={data.videoData}
              controls
              style={{
                width: '100%',
                borderRadius: 4,
                background: '#0a0a0a',
                maxHeight: 300,
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
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <polygon points="10,8 16,12 10,16" fill="#555" stroke="none" />
              </svg>
              <span style={{ fontSize: 11, color: '#555', marginTop: 8, fontFamily: 'IBM Plex Sans' }}>
                Drop video or click to upload
              </span>
              <span style={{ fontSize: 9, color: '#444', marginTop: 2, fontFamily: 'IBM Plex Mono' }}>
                Max 50MB
              </span>
              <input
                type="file"
                accept="video/*"
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
