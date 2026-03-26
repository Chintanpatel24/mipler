import React, { type ReactNode, useState } from 'react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';

const CARD_COLORS = [
  '#f5f5f0', '#fff9db', '#e3f2fd', '#e8f5e9', '#fce4ec',
  '#f3e5f5', '#fff3e0', '#e0f2f1', '#fafafa', '#263238',
];

interface BaseCardProps {
  id: string;
  title: string;
  children: ReactNode;
  width?: number;
  cardColor?: string;
  onTitleChange?: (t: string) => void;
  headerExtra?: ReactNode;
}

export const BaseCard: React.FC<BaseCardProps> = ({
  id, title, children, width = 300, cardColor = '#f5f5f0', onTitleChange, headerExtra,
}) => {
  const removeCard = useWorkspaceStore((s) => s.removeCard);
  const setCardColor = useWorkspaceStore((s) => s.setCardColor);
  const [showColors, setShowColors] = useState(false);

  const isDark = cardColor === '#263238';
  const textColor = isDark ? '#e0e0e0' : '#1a1a1a';
  const mutedColor = isDark ? '#90a4ae' : '#888';
  const borderColor = isDark ? '#37474f' : '#c8c8c0';
  const headerBg = isDark ? '#2c3e44' : undefined;

  return (
    <div
      className="rounded shadow-paper relative pin-hole select-none group"
      style={{ width: `${width}px`, minHeight: '90px', border: `1px solid ${borderColor}`, backgroundColor: cardColor }}
    >
      {/* Header */}
      <div
        className="card-drag-handle flex items-center gap-2 px-3 py-2.5 cursor-grab active:cursor-grabbing rounded-t"
        style={{
          borderBottom: `1px solid ${borderColor}`,
          background: headerBg || `linear-gradient(to bottom, ${cardColor}, ${cardColor}ee)`,
        }}
      >
        {/* Color picker toggle */}
        <div className="relative">
          <button
            onClick={() => setShowColors(!showColors)}
            className="w-4 h-4 rounded-full border border-black/20 hover:scale-125 transition-transform"
            style={{ backgroundColor: cardColor }}
            title="Change card color"
          />
          {showColors && (
            <>
              <div className="fixed inset-0 z-50" onClick={() => setShowColors(false)} />
              <div className="absolute top-6 left-0 z-50 bg-wall-surface border border-wall-cardBorder rounded-lg p-2 shadow-xl flex gap-1 flex-wrap w-32 animate-fade-in">
                {CARD_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setCardColor(id, c); setShowColors(false); }}
                    className={`w-5 h-5 rounded-full border-2 hover:scale-110 transition-all ${cardColor === c ? 'border-white' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {onTitleChange ? (
          <input type="text" value={title} onChange={(e) => onTitleChange(e.target.value)}
            className="flex-1 bg-transparent font-semibold text-[13px] border-none outline-none"
            style={{ color: textColor }} placeholder="Title..." />
        ) : (
          <span className="flex-1 font-semibold text-[13px] truncate" style={{ color: textColor }}>{title}</span>
        )}

        {headerExtra}

        <button onClick={() => removeCard(id)}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-500/20 transition-all text-xs opacity-0 group-hover:opacity-100"
          style={{ color: mutedColor }} title="Remove">✕</button>
      </div>

      <div className="px-3 py-2.5">{children}</div>
    </div>
  );
};