import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { uploadWorkspace } from '../../utils/fileSystem';

export const ImportModal: React.FC = () => {
  const { importModalOpen, setImportModalOpen, loadWorkspaceState, importWorkspaceAsNew } = useWorkspaceStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [importMode, setImportMode] = useState<'replace' | 'add'>('add');

  const doImport = async () => {
    setBusy(true);
    setError('');
    setStatus('Selecting file...');
    try {
      const state = await uploadWorkspace();
      if (state) {
        setStatus('Loading workspace...');
        if (importMode === 'replace') {
          loadWorkspaceState(state);
        } else {
          importWorkspaceAsNew(state);
        }
        setImportModalOpen(false);
      } else {
        setStatus('');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to import. Make sure it is a valid Mipler export.');
      setStatus('');
    }
    setBusy(false);
  };

  return (
    <Modal
      open={importModalOpen}
      onClose={() => { setImportModalOpen(false); setError(''); setStatus(''); }}
      title="Import Workspace"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ fontSize: 12, color: '#666', fontFamily: 'IBM Plex Sans' }}>
          Import a previously exported Mipler workspace.
        </p>

        {/* Import Mode Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 11, color: '#888', fontFamily: 'IBM Plex Mono, monospace' }}>IMPORT MODE</p>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="radio"
              name="importMode"
              checked={importMode === 'add'}
              onChange={() => setImportMode('add')}
              style={{ accentColor: '#0e639c' }}
            />
            <div>
              <span style={{ fontSize: 12, color: '#e0e0e0', fontFamily: 'IBM Plex Sans' }}>Add to existing</span>
              <p style={{ fontSize: 11, color: '#666', fontFamily: 'IBM Plex Sans', marginTop: 2 }}>
                Add imported investigations alongside your current work
              </p>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="radio"
              name="importMode"
              checked={importMode === 'replace'}
              onChange={() => setImportMode('replace')}
              style={{ accentColor: '#0e639c' }}
            />
            <div>
              <span style={{ fontSize: 12, color: '#e0e0e0', fontFamily: 'IBM Plex Sans' }}>Replace all</span>
              <p style={{ fontSize: 11, color: '#666', fontFamily: 'IBM Plex Sans', marginTop: 2 }}>
                Replace current workspace with imported data
              </p>
            </div>
          </label>
        </div>

        {error && (
          <div style={{ padding: '8px 12px', background: '#2a1a1a', border: '1px solid #4a2020', borderRadius: 5 }}>
            <p style={{ fontSize: 11, color: '#ef4444', fontFamily: 'IBM Plex Sans' }}>{error}</p>
          </div>
        )}

        {status && !error && (
          <div style={{ padding: '8px 12px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 5 }}>
            <p style={{ fontSize: 11, color: '#888', fontFamily: 'IBM Plex Mono, monospace' }}>{status}</p>
          </div>
        )}

        <button
          onClick={doImport}
          disabled={busy}
          style={{
            padding: '8px 16px', background: '#0e639c', color: '#fff',
            border: 'none', borderRadius: 5, fontSize: 12, cursor: busy ? 'default' : 'pointer',
            fontFamily: 'IBM Plex Sans', opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? 'Importing...' : 'Select JSON File'}
        </button>

        <p style={{ fontSize: 11, color: '#444', fontFamily: 'IBM Plex Sans' }}>
          Your data stays local. Nothing is uploaded to any server.
        </p>
      </div>
    </Modal>
  );
};
