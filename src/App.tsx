import React, { useEffect } from 'react';
import { WallCanvas } from './components/WallCanvas';
import { Toolbar } from './components/Toolbar';
import { ExportModal } from './components/modals/ExportModal';
import { ImportModal } from './components/modals/ImportModal';
import { CustomUrlModal } from './components/modals/CustomUrlModal';
import { useWorkspaceStore } from './store/useWorkspaceStore';
import { loadAutoSave } from './utils/fileSystem';

const App: React.FC = () => {
  const loadWorkspaceState = useWorkspaceStore(
    (s) => s.loadWorkspaceState
  );

  useEffect(() => {
    const autoSave = loadAutoSave();
    if (
      autoSave &&
      autoSave.nodes &&
      autoSave.nodes.length > 0
    ) {
      loadWorkspaceState(autoSave);
    }
  }, [loadWorkspaceState]);

  return (
    <div className="w-screen h-screen flex flex-col bg-wall-bg">
      <Toolbar />
      <div className="flex-1 pt-12">
        <WallCanvas />
      </div>
      <ExportModal />
      <ImportModal />
      <CustomUrlModal />
    </div>
  );
};

export default App;