import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { downloadWorkspace } from '../../utils/fileSystem';

export const ExportModal: React.FC = () => {
  const { exportModalOpen, setExportModalOpen, getWorkspaceState } = useWorkspaceStore();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const state = getWorkspaceState();
      downloadWorkspace(state);
    } catch (err) {
      console.error('Export failed:', err);
    }
    setExporting(false);
    setExportModalOpen(false);
  };

  return (
    <Modal open={exportModalOpen} onClose={() => setExportModalOpen(false)} title="Export Workspace">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ fontSize: 12, color: '#666', fontFamily: 'IBM Plex Sans' }}>
          Export your full workspace including all investigations, cards, connections, API keys and AI chat history as a JSON file.
        </p>

        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 6, padding: '10px 12px' }}>
          <p style={{ fontSize: 11, color: '#555', fontFamily: 'IBM Plex Mono, monospace', marginBottom: 4 }}>INCLUDED IN EXPORT</p>
          {[
            'All investigations and canvases',
            'Cards, notes, images, PDFs',
            'All connections and edge styles',
            'API key and provider settings',
            'AI chat history',
            'Grid and display preferences',
          ].map((item) => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#3a3a3a', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#888', fontFamily: 'IBM Plex Sans' }}>{item}</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleExport}
          disabled={exporting}
          style={{
            padding: '8px 16px', background: '#0e639c', color: '#fff',
            border: 'none', borderRadius: 5, fontSize: 12, cursor: exporting ? 'default' : 'pointer',
            fontFamily: 'IBM Plex Sans', opacity: exporting ? 0.6 : 1,
          }}
        >
          {exporting ? 'Exporting...' : 'Export as JSON'}
        </button>

        <p style={{ fontSize: 11, color: '#444', fontFamily: 'IBM Plex Sans' }}>
          All data stays local. Nothing is uploaded to any server.
        </p>
      </div>
    </Modal>
  );
};
