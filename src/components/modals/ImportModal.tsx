import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { importProjectZip, selectZipFile } from '../../utils/zipUtils';
import { uploadWorkspace, loadWithFileSystemAccess, hasFileSystemAccess } from '../../utils/fileSystem';

export const ImportModal: React.FC = () => {
  const { importModalOpen, setImportModalOpen, loadWorkspaceState } = useWorkspaceStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const zipImport = async () => {
    setBusy(true);
    setError('');
    setStatus('Selecting file...');
    try {
      const file = await selectZipFile();
      if (!file) {
        setBusy(false);
        setStatus('');
        return;
      }
      setStatus(`Reading ${file.name} (${(file.size / 1024).toFixed(1)} KB)...`);
      const state = await importProjectZip(file);
      setStatus(`Loaded ${state.nodes.length} cards, ${state.edges.length} connections`);
      loadWorkspaceState(state);
      setTimeout(() => setImportModalOpen(false), 500);
    } catch (e: any) {
      setError(e.message || 'Failed to import ZIP. Make sure it is a valid Mipler export.');
      setStatus('');
    }
    setBusy(false);
  };

  const jsonImport = async () => {
    setError('');
    setStatus('');
    try {
      const state = hasFileSystemAccess()
        ? await loadWithFileSystemAccess()
        : await uploadWorkspace();
      if (state) {
        loadWorkspaceState(state);
        setImportModalOpen(false);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to import JSON');
    }
  };

  return (
    <Modal open={importModalOpen} onClose={() => { setImportModalOpen(false); setError(''); setStatus(''); }} title="Import Project">
      <div className="space-y-4">
        <p className="text-sm text-wall-textMuted">
          Import a previously exported investigation. All current work will be replaced.
        </p>

        {error && (
          <div className="px-3 py-2.5 bg-red-900/20 border border-red-800/30 rounded-lg text-xs text-red-400 flex items-start gap-2">
            <span className="text-red-500 mt-0.5">⚠</span>
            <div>
              <p className="font-medium mb-0.5">Import failed</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {status && !error && (
          <div className="px-3 py-2 bg-wall-card border border-wall-cardBorder rounded-lg text-xs text-wall-textMuted">
            {status}
          </div>
        )}

        <div className="space-y-2">
          <Button onClick={zipImport} disabled={busy} className="w-full justify-start">
            📦 {busy ? 'Importing...' : 'Import ZIP project'}
          </Button>
          <Button onClick={jsonImport} variant="secondary" className="w-full justify-start">
            📄 Import JSON workspace
          </Button>
        </div>

        <p className="text-xs text-wall-textDim">
          Your data stays local. Nothing is uploaded to any server.
        </p>
      </div>
    </Modal>
  );
};