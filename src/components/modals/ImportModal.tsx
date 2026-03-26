import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { uploadWorkspace } from '../../utils/fileSystem';

export const ImportModal: React.FC = () => {
  const { importModalOpen, setImportModalOpen, loadWorkspaceState } = useWorkspaceStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const doImport = async () => {
    setBusy(true);
    setError('');
    setStatus('Selecting file...');
    try {
      const state = await uploadWorkspace();
      if (state) {
        setStatus('Loading workspace...');
        loadWorkspaceState(state);
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
          Import a previously exported Mipler workspace. All current work will be replaced.
        </p>

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
