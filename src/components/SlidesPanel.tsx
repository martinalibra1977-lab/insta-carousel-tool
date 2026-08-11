import { useRef, useState } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import './SlidesPanel.css';

const MAX_SLIDES = 20;
const RECOMMENDED_MAX = 10;

export default function SlidesPanel() {
  const slides = useEditorStore((s) => s.slides);
  const activeSlideId = useEditorStore((s) => s.activeSlideId);
  const setActiveSlide = useEditorStore((s) => s.setActiveSlide);
  const addSlide = useEditorStore((s) => s.addSlide);
  const duplicateSlide = useEditorStore((s) => s.duplicateSlide);
  const removeSlide = useEditorStore((s) => s.removeSlide);
  const reorderSlides = useEditorStore((s) => s.reorderSlides);

  const dragIndex = useRef<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function handleDrop(index: number) {
    if (dragIndex.current === null || dragIndex.current === index) {
      setOverIndex(null);
      return;
    }
    reorderSlides(dragIndex.current, index);
    dragIndex.current = null;
    setOverIndex(null);
  }

  return (
    <aside className="slides-panel">
      <div className="slides-panel-header">
        <span>Slides</span>
        <span className="slides-count">
          {slides.length}
          {slides.length > RECOMMENDED_MAX ? ' ⚠' : ''}
        </span>
      </div>

      <div className="slides-list">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`slide-thumb ${slide.id === activeSlideId ? 'active' : ''} ${
              overIndex === index ? 'drag-over' : ''
            }`}
            draggable
            onClick={() => setActiveSlide(slide.id)}
            onDragStart={() => {
              dragIndex.current = index;
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setOverIndex(index);
            }}
            onDragLeave={() => setOverIndex((cur) => (cur === index ? null : cur))}
            onDrop={() => handleDrop(index)}
            onDragEnd={() => {
              dragIndex.current = null;
              setOverIndex(null);
            }}
          >
            <div className="slide-thumb-index">{index + 1}</div>
            <div className="slide-thumb-preview">
              {slide.thumbnail ? (
                <img src={slide.thumbnail} alt={`Slide ${index + 1}`} draggable={false} />
              ) : (
                <div className="slide-thumb-empty" />
              )}
            </div>
            <div className="slide-thumb-actions">
              <button
                className="mini-btn"
                title="Duplizieren"
                onClick={(e) => {
                  e.stopPropagation();
                  if (slides.length >= MAX_SLIDES) return;
                  duplicateSlide(slide.id);
                }}
              >
                ⧉
              </button>
              <button
                className="mini-btn mini-btn-danger"
                title="Löschen"
                disabled={slides.length <= 1}
                onClick={(e) => {
                  e.stopPropagation();
                  removeSlide(slide.id);
                }}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        className="btn btn-primary add-slide-btn"
        disabled={slides.length >= MAX_SLIDES}
        onClick={addSlide}
      >
        + Slide hinzufügen
      </button>
      {slides.length > RECOMMENDED_MAX && (
        <p className="slides-hint">Instagram zeigt i. d. R. max. {RECOMMENDED_MAX} Slides pro Karussell an.</p>
      )}
    </aside>
  );
}
