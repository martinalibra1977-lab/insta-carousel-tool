import { useRef, useState } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { ASPECTS, type AspectId } from '../lib/aspect';
import { downloadSlidePNG, exportAllAsZip } from '../lib/export';
import { useDismiss } from '../lib/useDismiss';
import type { ProjectFile } from '../types';
import './TopBar.css';

export default function TopBar({ onPreview }: { onPreview: () => void }) {
  const projectName = useEditorStore((s) => s.projectName);
  const setProjectName = useEditorStore((s) => s.setProjectName);
  const aspect = useEditorStore((s) => s.aspect);
  const setAspect = useEditorStore((s) => s.setAspect);
  const showPageNumbers = useEditorStore((s) => s.showPageNumbers);
  const togglePageNumbers = useEditorStore((s) => s.togglePageNumbers);
  const saveError = useEditorStore((s) => s.saveError);
  const resetProject = useEditorStore((s) => s.resetProject);
  const loadProject = useEditorStore((s) => s.loadProject);
  const slides = useEditorStore((s) => s.slides);
  const activeSlideId = useEditorStore((s) => s.activeSlideId);

  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const exportWrapRef = useRef<HTMLDivElement | null>(null);

  useDismiss(exportWrapRef, exportOpen, () => setExportOpen(false));

  const activeIndex = slides.findIndex((s) => s.id === activeSlideId);

  async function handleExportCurrent() {
    if (activeIndex < 0) return;
    setExporting('single');
    try {
      await downloadSlidePNG(slides[activeIndex], aspect, activeIndex, slides.length, showPageNumbers, projectName);
    } finally {
      setExporting(null);
      setExportOpen(false);
    }
  }

  async function handleExportAll() {
    setExporting('zip');
    try {
      await exportAllAsZip(slides, aspect, showPageNumbers, projectName);
    } finally {
      setExporting(null);
      setExportOpen(false);
    }
  }

  function handleExportProjectFile() {
    const data: ProjectFile = {
      version: 1,
      projectName,
      aspect,
      showPageNumbers,
      slides,
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.trim() || 'karussell'}.carousel.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportOpen(false);
  }

  function handleImportProjectFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as ProjectFile;
        if (!data.slides) throw new Error('invalid');
        loadProject(data);
      } catch {
        window.alert('Diese Projektdatei konnte nicht gelesen werden.');
      }
    };
    reader.readAsText(file);
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-logo">📐 Karussell Studio</div>
        <input
          className="project-name-input"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="Projektname"
        />
      </div>

      <div className="topbar-center">
        <select
          className="select-input aspect-select"
          value={aspect}
          onChange={(e) => setAspect(e.target.value as AspectId)}
        >
          {Object.values(ASPECTS).map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>

        <label className="page-number-toggle">
          <input type="checkbox" checked={showPageNumbers} onChange={togglePageNumbers} />
          Seitenzahlen
        </label>

        {saveError && <span className="save-warning" title="Automatisches Speichern fehlgeschlagen (Speicher voll). Bitte Projekt als Datei sichern.">⚠ Speichern fehlgeschlagen</span>}
      </div>

      <div className="topbar-right">
        <button className="btn" onClick={onPreview}>
          👁 Vorschau
        </button>

        <div className="export-wrap" ref={exportWrapRef}>
          <button className="btn btn-primary" onClick={() => setExportOpen((v) => !v)}>
            ⬇ Exportieren
          </button>
          {exportOpen && (
            <div className="export-menu">
              <button className="btn btn-ghost" onClick={handleExportCurrent} disabled={!!exporting}>
                {exporting === 'single' ? 'Exportiere…' : 'Aktuelle Slide (PNG)'}
              </button>
              <button className="btn btn-ghost" onClick={handleExportAll} disabled={!!exporting}>
                {exporting === 'zip' ? 'Exportiere…' : `Alle ${slides.length} Slides (ZIP)`}
              </button>
              <div className="export-menu-divider" />
              <button className="btn btn-ghost" onClick={handleExportProjectFile}>
                Projekt sichern (.json)
              </button>
              <button className="btn btn-ghost" onClick={() => fileInputRef.current?.click()}>
                Projekt importieren
              </button>
              <div className="export-menu-divider" />
              <button
                className="btn btn-ghost btn-danger"
                onClick={() => {
                  if (window.confirm('Neues Projekt starten? Nicht gesicherte Änderungen gehen verloren.')) {
                    resetProject();
                  }
                  setExportOpen(false);
                }}
              >
                Neues Projekt
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportProjectFile(file);
              e.target.value = '';
              setExportOpen(false);
            }}
          />
        </div>
      </div>
    </header>
  );
}
