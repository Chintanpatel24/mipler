import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { createProjectZip, downloadBlob } from '../../utils/zipUtils';
import { downloadWorkspace, saveWithFileSystemAccess, hasFileSystemAccess } from '../../utils/fileSystem';

export const ExportModal: React.FC = () => {
  const { exportModalOpen, setExportModalOpen, getWorkspaceState, workspaceName } =
    useWorkspaceStore();
  const [exporting, setExporting] = useState(false);

  const handleExportZip = async () => {
    setExporting(true);
    try {
      const state = getWorkspaceState();
      const blob = await createProjectZip(state);
      const filename = `${workspaceName.replace(/\s+/g, '_')}_export.zip`;
      downloadBlob(blob, filename);
    } catch (err) {
      console.error('Export failed:', err);
    }
    setExporting(false);
  };

  const handleExportJson = () => {
    const state = getWorkspaceState();
    downloadWorkspace(state);
  };

  const handleSaveAs = async () => {
    if (hasFileSystemAccess()) {
      const state = getWorkspaceState();
      await saveWithFileSystemAccess(state);
    } else {
      handleExportJson();
    }
  };

  return (
    <Modal
      open={exportModalOpen}
      onClose={() => setExportModalOpen(false)}
      title="Export Project"
    >
      <div className="space-y-4">
        <p className="text-sm text-wall-textMuted">
          Export your investigation workspace. Choose a format:
        </p>

        <div className="space-y-2">
          <Button onClick={handleExportZip} disabled={exporting} className="w-full justify-start">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="opacity-60">
              <path d="M6.5 7.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v.938l.4 1.599a1 1 0 0 1-.416 1.074l-.93.62a1 1 0 0 1-1.109 0l-.93-.62a1 1 0 0 1-.415-1.074l.4-1.599V7.5z"/>
              <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm5.5-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H8.5v1H10v1H8.5v1H10v1H8.5v1H7V5.5H5.5v-1H7v-1H5.5v-1H7V1z"/>
            </svg>
            {exporting ? 'Creating ZIP...' : 'Export as ZIP (full project)'}
          </Button>

          <Button onClick={handleExportJson} variant="secondary" className="w-full justify-start">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="opacity-60">
              <path fillRule="evenodd" d="M14 4.5V14a2 2 0 0 1-2 2h-1v-1h1a1 1 0 0 0 1-1V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v9H2V2a2 2 0 0 1 2-2h5.5L14 4.5z"/>
            </svg>
            Export as JSON (workspace only)
          </Button>

          {hasFileSystemAccess() && (
            <Button onClick={handleSaveAs} variant="secondary" className="w-full justify-start">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="opacity-60">
                <path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9.5a1 1 0 0 0-1 .724L7.539 6H4.5a.5.5 0 0 0 0 1h2.789l-.562 2.252A.5.5 0 0 0 7.214 10h1.572a.5.5 0 0 0 .486-.387L10 7h3.5a.5.5 0 0 0 0-1h-2.75l.961-3.852A1 1 0 0 0 10.724 1H2z"/>
              </svg>
              Save to folder (File System Access)
            </Button>
          )}
        </div>

        <p className="text-xs text-wall-textDim">
          ZIP includes: workspace.json, notes/ (markdown), assets/ (images, PDFs).
          All data stays local — nothing is uploaded.
        </p>
      </div>
    </Modal>
  );
};