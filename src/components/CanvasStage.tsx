import { useEffect } from 'react';
import { useCanvasEditor } from '../canvas/CanvasContext';
import { useEditorStore } from '../store/useEditorStore';
import { getEditDims } from '../lib/aspect';
import './CanvasStage.css';

export default function CanvasStage() {
  const { canvasElRef, deleteSelected, canvas } = useCanvasEditor();
  const aspect = useEditorStore((s) => s.aspect);
  const showPageNumbers = useEditorStore((s) => s.showPageNumbers);
  const slides = useEditorStore((s) => s.slides);
  const activeSlideId = useEditorStore((s) => s.activeSlideId);
  const { width, height } = getEditDims(aspect);

  const slideIndex = slides.findIndex((s) => s.id === activeSlideId);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const active = canvas?.getActiveObject() as { isEditing?: boolean } | undefined;
      if (active?.isEditing) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (canvas?.getActiveObject()) {
          e.preventDefault();
          deleteSelected();
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canvas, deleteSelected]);

  return (
    <div className="canvas-stage">
      <div className="canvas-frame" style={{ width, height }}>
        <canvas ref={canvasElRef} />
        {showPageNumbers && slideIndex >= 0 && (
          <div className="page-number-badge">
            {slideIndex + 1} / {slides.length}
          </div>
        )}
      </div>
    </div>
  );
}
