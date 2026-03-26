import React, { useState } from 'react';
import { Button } from './ui/Button';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import type { CardType } from '../types';

export const Toolbar: React.FC = () => {
  const {
    workspaceName,
    setWorkspaceName,
    addCard,
    setExportModalOpen,
    setImportModalOpen,
    setCustomUrlModalOpen,
    clearWorkspace,
    nodes,
    edges,
  } = useWorkspaceStore();

  const [showMenu, setShowMenu] = useState(false);

  const cardTypes: {
    type: CardType;
    label: string;
    icon: string;
  }[] = [
    { type: 'note', label: 'Note', icon: '📝' },
    { type: 'image', label: 'Image', icon: '🖼' },
    { type: 'pdf', label: 'PDF', icon: '📄' },
    { type: 'whois', label: 'WHOIS', icon: '🔍' },
    { type: 'dns', label: 'DNS', icon: '🌐' },
    { type: 'reverse-image', label: 'Rev. Image', icon: '🔎' },
    { type: 'osint-framework', label: 'OSINT FW', icon: '🧰' },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-wall-surface/95 backdrop-blur-sm border-b border-wall-cardBorder">
      <div className="flex items-center h-12 px-4 gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-4">
          <div className="w-6 h-6 bg-wall-card border border-wall-cardBorder rounded flex items-center justify-center">
            <span className="text-xs font-bold text-wall-accent">
              M
            </span>
          </div>
          <span className="text-sm font-semibold text-wall-text tracking-wide hidden sm:inline">
            MIPLER
          </span>
        </div>

        {/* Workspace Name */}
        <input
          type="text"
          value={workspaceName}
          onChange={(e) => setWorkspaceName(e.target.value)}
          className="bg-transparent text-sm text-wall-text border-b border-transparent hover:border-wall-cardBorder focus:border-wall-textMuted outline-none px-1 py-0.5 max-w-[200px] transition-colors"
          placeholder="Investigation name..."
        />

        <div className="w-px h-6 bg-wall-cardBorder mx-1" />

        {/* Add Cards */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {cardTypes.map(({ type, label, icon }) => (
            <button
              key={type}
              onClick={() => addCard(type)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-wall-textMuted hover:text-wall-text hover:bg-wall-card rounded transition-colors whitespace-nowrap"
              title={`Add ${label} card`}
            >
              <span>{icon}</span>
              <span className="hidden lg:inline">
                {label}
              </span>
            </button>
          ))}

          <button
            onClick={() => setCustomUrlModalOpen(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-wall-textMuted hover:text-wall-text hover:bg-wall-card rounded transition-colors whitespace-nowrap"
            title="Add custom URL card"
          >
            <span>🔗</span>
            <span className="hidden lg:inline">
              Custom URL
            </span>
          </button>
        </div>

        <div className="flex-1" />

        {/* Stats */}
        <div className="text-[10px] text-wall-textDim font-mono hidden md:flex items-center gap-3 mr-2">
          <span>{nodes.length} cards</span>
          <span>{edges.length} connections</span>
        </div>

        {/* Menu */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMenu(!showMenu)}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
            </svg>
          </Button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-wall-surface border border-wall-cardBorder rounded-lg shadow-xl py-1 animate-fade-in">
                <button
                  onClick={() => {
                    setExportModalOpen(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-wall-text hover:bg-wall-card transition-colors flex items-center gap-2"
                >
                  <span className="opacity-50">↑</span>{' '}
                  Export Project
                </button>
                <button
                  onClick={() => {
                    setImportModalOpen(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-wall-text hover:bg-wall-card transition-colors flex items-center gap-2"
                >
                  <span className="opacity-50">↓</span>{' '}
                  Import Project
                </button>
                <div className="border-t border-wall-cardBorder my-1" />
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        'Clear the entire workspace? This cannot be undone.'
                      )
                    ) {
                      clearWorkspace();
                    }
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-900/20 transition-colors flex items-center gap-2"
                >
                  <span className="opacity-50">✕</span>{' '}
                  Clear Workspace
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
