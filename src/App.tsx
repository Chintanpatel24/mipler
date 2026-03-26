import React, { useEffect } from 'react';
import { WallCanvas } from './components/WallCanvas';
import { Toolbar } from './components/Toolbar';
import { ExportModal } from './components/modals/ExportModal';
import { ImportModal } from './components/modals/ImportModal';
import { CustomUrlModal } from './components/modals/CustomUrlModal';
import { EdgeStyleModal } from './components/modals/EdgeStyleModal';
import { ApiSettingsModal } from './components/modals/ApiSettingsModal';
import { AiPanel } from './components/AiPanel';
import { clearAllLocalData } from './utils/fileSystem';

const App: React.FC = () => {
  useEffect(() => { clearAllLocalData(); }, []);

  return (
    <div className="w-screen h-screen flex flex-col bg-wall-bg">
      <Toolbar />
      <div className="flex-1 pt-12 relative">
        <WallCanvas />
        <AiPanel />
      </div>
      <ExportModal />
      <ImportModal />
      <CustomUrlModal />
      <EdgeStyleModal />
      <ApiSettingsModal />
    </div>
  );
};

export default App;