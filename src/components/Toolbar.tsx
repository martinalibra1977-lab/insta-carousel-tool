import { useRef, useState } from 'react';
import { useCanvasEditor } from '../canvas/CanvasContext';
import { useDismiss } from '../lib/useDismiss';
import './Toolbar.css';

const SOLID_PRESETS = ['#ffffff', '#121017', '#f4efe6', '#ffe08a', '#8134ff', '#dd2a7b'];

const GRADIENT_PRESETS: Array<[string, string]> = [
  ['#f58529', '#dd2a7b'],
  ['#8134ff', '#515bd4'],
  ['#37d29a', '#2b8cff'],
  ['#ff9a8b', '#ff6a88'],
  ['#0f2027', '#2c5364'],
  ['#fdcbf1', '#e6dee9'],
];

export default function Toolbar() {
  const {
    addText,
    addShape,
    addImageFile,
    setBackgroundColor,
    setBackgroundGradient,
    setBackgroundImageFile,
    clearBackgroundImage,
    applyBackgroundToAllSlides,
  } = useCanvasEditor();
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const bgImageInputRef = useRef<HTMLInputElement | null>(null);
  const bgWrapRef = useRef<HTMLDivElement | null>(null);
  const [bgOpen, setBgOpen] = useState(false);
  const [bgTab, setBgTab] = useState<'solid' | 'gradient' | 'image'>('solid');
  const [customColor, setCustomColor] = useState('#ffffff');

  useDismiss(bgWrapRef, bgOpen, () => setBgOpen(false));

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <button className="btn" onClick={() => addText()}>
          <span className="icon">T</span> Text
        </button>
        <button className="btn btn-icon" title="Rechteck" onClick={() => addShape('rect')}>
          ▭
        </button>
        <button className="btn btn-icon" title="Kreis" onClick={() => addShape('circle')}>
          ●
        </button>
        <button className="btn btn-icon" title="Linie" onClick={() => addShape('line')}>
          ╱
        </button>
        <button className="btn" onClick={() => imageInputRef.current?.click()}>
          🖼 Bild
        </button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) addImageFile(file);
            e.target.value = '';
          }}
        />
      </div>

      <div className="toolbar-group toolbar-bg-wrap" ref={bgWrapRef}>
        <button className="btn" onClick={() => setBgOpen((v) => !v)}>
          🎨 Hintergrund
        </button>
        {bgOpen && (
          <div className="bg-popover">
            <div className="bg-tabs">
              <button className={bgTab === 'solid' ? 'active' : ''} onClick={() => setBgTab('solid')}>
                Farbe
              </button>
              <button className={bgTab === 'gradient' ? 'active' : ''} onClick={() => setBgTab('gradient')}>
                Verlauf
              </button>
              <button className={bgTab === 'image' ? 'active' : ''} onClick={() => setBgTab('image')}>
                Bild
              </button>
            </div>

            {bgTab === 'solid' && (
              <div className="bg-panel-content">
                <div className="swatch-row">
                  {SOLID_PRESETS.map((c) => (
                    <button
                      key={c}
                      className="swatch"
                      style={{ background: c }}
                      onClick={() => setBackgroundColor(c)}
                    />
                  ))}
                </div>
                <div className="color-custom-row">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => {
                      setCustomColor(e.target.value);
                      setBackgroundColor(e.target.value);
                    }}
                  />
                  <span>Eigene Farbe</span>
                </div>
              </div>
            )}

            {bgTab === 'gradient' && (
              <div className="bg-panel-content">
                <div className="gradient-grid">
                  {GRADIENT_PRESETS.map(([a, b]) => (
                    <button
                      key={a + b}
                      className="gradient-swatch"
                      style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
                      onClick={() => setBackgroundGradient([a, b], 135)}
                    />
                  ))}
                </div>
              </div>
            )}

            {bgTab === 'image' && (
              <div className="bg-panel-content">
                <button className="btn" onClick={() => bgImageInputRef.current?.click()}>
                  Bild hochladen
                </button>
                <input
                  ref={bgImageInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setBackgroundImageFile(file);
                    e.target.value = '';
                  }}
                />
                <button className="btn btn-ghost" onClick={clearBackgroundImage}>
                  Bild entfernen
                </button>
              </div>
            )}

            <button
              className="btn btn-ghost apply-all-btn"
              onClick={() => {
                applyBackgroundToAllSlides();
                setBgOpen(false);
              }}
            >
              Auf alle Slides anwenden
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
