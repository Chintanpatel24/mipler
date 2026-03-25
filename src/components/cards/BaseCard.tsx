import React, { type ReactNode } from 'react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';

interface BaseCardProps {
  id: string;
  title: string;
  children: ReactNode;
  width?: number;
  onTitleChange?: (title: string) => void;
  headerExtra?: ReactNode;
  color?: string;
}

export const BaseCard: React.FC<BaseCardProps> = ({
  id,
  title,
  children,
  width = 280,
  onTitleChange,
  headerExtra,
}) => {
  const removeCard = useWorkspaceStore((s) => s.removeCard);

  return (
    <div
      className="paper-card paper-texture rounded-sm shadow-paper relative pin-hole select-none"
      style={{
        width: `${width}px`,
        minHeight: '80px',
        border: '1px solid #d0d0c8',
      }}
    >
      {/* Header / Drag Handle */}
      <div className="card-drag-handle flex items-center gap-2 px-3 py-2 border-b border-wall-paperBorder/50 cursor-grab active:cursor-grabbing bg-gradient-to-b from-[#fafaf5] to-[#f5f5f0]">
        {/* Drag dots */}
        <div className="flex flex-col gap-0.5 mr-1 opacity-40">
          <div className="flex gap-0.5">
            <span className="w-1 h-1 rounded-full bg-wall-paperMuted" />
            <span className="w-1 h-1 rounded-full bg-wall-paperMuted" />
          </div>
          <div className="flex gap-0.5">
            <span className="w-1 h-1 rounded-full bg-wall-paperMuted" />
            <span className="w-1 h-1 rounded-full bg-wall-paperMuted" />
          </div>
          <div className="flex gap-0.5">
            <span className="w-1 h-1 rounded-full bg-wall-paperMuted" />
            <span className="w-1 h-1 rounded-full bg-wall-paperMuted" />
          </div>
        </div>

        {/* Title */}
        {onTitleChange ? (
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="flex-1 bg-transparent text-wall-paperText font-medium text-sm border-none outline-none placeholder-wall-paperMuted"
            placeholder="Card title..."
          />
        ) : (
          <span className="flex-1 text-wall-paperText font-medium text-sm truncate">
            {title}
          </span>
        )}

        {headerExtra}

        {/* Close button */}
        <button
          onClick={() => removeCard(id)}
          className="text-wall-paperMuted hover:text-red-500 transition-colors p-0.5 ml-1"
          title="Remove card"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M3.05 3.05a.5.5 0 0 1 .707 0L6 5.293l2.243-2.243a.5.5 0 0 1 .707.707L6.707 6l2.243 2.243a.5.5 0 0 1-.707.707L6 6.707 3.757 8.95a.5.5 0 0 1-.707-.707L5.293 6 3.05 3.757a.5.5 0 0 1 0-.707z" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="px-3 py-2">{children}</div>
    </div>
  );
};