import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { importProjectZip, selectZipFile } from '../../utils/zipUtils';
import {
  uploadWorkspace,
  loadWithFileSystemAccess,
  hasFileSystemAccess,
  loadAutoSave,
} from '../../utils/fileSystem';

export const ImportModal: React.FC = () => {
  const { importModalOpen, setImportModalOpen, loadWorkspaceState } =
    useWorkspaceStore();
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');

  const handleImportZip = async () => {
    setImporting(true);
    setError('');
    try {
      const file = await selectZipFile();
      if (!file) {
        setImporting(false);
        return;
      }
      const state = await importProjectZip(file);
      loadWorkspaceState(state);
      setImportModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to import ZIP');
    }
    setImporting(false);
  };

  const handleImportJson = async () => {
    setError('');
    try {
      let state;
      if (hasFileSystemAccess()) {
        state = await loadWithFileSystemAccess();
      } else {
        state = await uploadWorkspace();
      }
      if (state) {
        loadWorkspaceState(state);
        setImportModalOpen(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to import JSON');
    }
  };

  const handleRestoreAutoSave = () => {
    setError('');
    const state = loadAutoSave();
    if (state) {
      loadWorkspaceState(state);
      setImportModalOpen(false);
    } else {
      setError('No auto-save found');
    }
  };

  return (
    <Modal
      open={importModalOpen}
      onClose={() => setImportModalOpen(false)}
      title="Import Project"
    >
      <div className="space-y-4">
        <p className="text-sm text-wall-textMuted">
          Import a previously exported investigation workspace.
        </p>

        {error && (
          <div className="px-3 py-2 bg-red-900/20 border border-red-800/30 rounded text-xs text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Button
            onClick={handleImportZip}
            disabled={importing}
            className="w-full justify-start"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="opacity-60">
              <path d="M6.5 7.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v.938l.4 1.599a1 1 0 0 1-.416 1.074l-.93.62a1 1 0 0 1-1.109 0l-.93-.62a1 1 0 0 1-.415-1.074l.4-1.599V7.5z"/>
              <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm5.5-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H8.5v1H10v1H8.5v1H10v1H8.5v1H7V5.5H5.5v-1H7v-1H5.5v-1H7V1z"/>
            </svg>
            {importing ? 'Importing...' : 'Import ZIP project'}
          </Button>

          <Button onClick={handleImportJson} variant="secondary" className="w-full justify-start">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="opacity-60">
              <path fillRule="evenodd" d="M14 4.5V14a2 2 0 0 1-2 2h-1v-1h1a1 1 0 0 0 1-1V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v9H2V2a2 2 0 0 1 2-2h5.5L14 4.5z"/>
            </svg>
            Import JSON workspace
          </Button>

          <Button onClick={handleRestoreAutoSave} variant="ghost" className="w-full justify-start">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="opacity-60">
              <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
              <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
            </svg>
            Restore auto-save
          </Button>
        </div>

        <p className="text-xs text-wall-textDim">
          Your data never leaves your computer. Import reads from your local files only.
        </p>
      </div>
    </Modal>
  );
};