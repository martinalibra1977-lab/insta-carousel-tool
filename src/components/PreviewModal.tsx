import { useEffect, useState } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { ASPECTS } from '../lib/aspect';
import './PreviewModal.css';

export default function PreviewModal({ onClose }: { onClose: () => void }) {
  const slides = useEditorStore((s) => s.slides);
  const aspect = useEditorStore((s) => s.aspect);
  const showPageNumbers = useEditorStore((s) => s.showPageNumbers);
  const projectName = useEditorStore((s) => s.projectName);
  const [index, setIndex] = useState(0);
  const def = ASPECTS[aspect];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(slides.length - 1, i + 1));
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, slides.length]);

  const slide = slides[index];

  return (
    <div className="preview-overlay" onClick={onClose}>
      <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
        <button className="preview-close" onClick={onClose}>
          ✕
        </button>

        <div className="ig-post">
          <div className="ig-post-header">
            <div className="ig-avatar" />
            <div className="ig-post-username">dein_account</div>
            <div className="ig-post-more">⋯</div>
          </div>

          <div
            className="ig-post-media"
            style={{ aspectRatio: `${def.ratioW} / ${def.ratioH}` }}
          >
            {slide?.thumbnail ? (
              <img src={slide.thumbnail} alt={`Slide ${index + 1}`} />
            ) : (
              <div className="ig-post-media-empty">Slide {index + 1} leer</div>
            )}

            {index > 0 && (
              <button className="ig-nav ig-nav-left" onClick={() => setIndex((i) => i - 1)}>
                ‹
              </button>
            )}
            {index < slides.length - 1 && (
              <button className="ig-nav ig-nav-right" onClick={() => setIndex((i) => i + 1)}>
                ›
              </button>
            )}

            {slides.length > 1 && (
              <div className="ig-dots">
                {slides.map((s, i) => (
                  <span key={s.id} className={`ig-dot ${i === index ? 'active' : ''}`} />
                ))}
              </div>
            )}

            {showPageNumbers && (
              <div className="ig-page-badge">
                {index + 1} / {slides.length}
              </div>
            )}
          </div>

          <div className="ig-post-actions">
            <span>♡</span>
            <span>💬</span>
            <span>✈</span>
            <span className="ig-post-actions-save">🔖</span>
          </div>
          <div className="ig-post-caption">
            <b>dein_account</b> {projectName}
          </div>
        </div>
      </div>
    </div>
  );
}
