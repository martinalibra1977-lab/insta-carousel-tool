import { useState } from 'react';
import { CanvasProvider } from './canvas/CanvasContext';
import TopBar from './components/TopBar';
import SlidesPanel from './components/SlidesPanel';
import Toolbar from './components/Toolbar';
import CanvasStage from './components/CanvasStage';
import PropertiesPanel from './components/PropertiesPanel';
import PreviewModal from './components/PreviewModal';
import './App.css';

function App() {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <CanvasProvider>
      <div className="app-shell">
        <TopBar onPreview={() => setPreviewOpen(true)} />
        <div className="app-body">
          <SlidesPanel />
          <main className="app-main">
            <Toolbar />
            <CanvasStage />
          </main>
          <PropertiesPanel />
        </div>
      </div>
      {previewOpen && <PreviewModal onClose={() => setPreviewOpen(false)} />}
    </CanvasProvider>
  );
}

export default App;
