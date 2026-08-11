import { useCanvasEditor } from '../canvas/CanvasContext';
import { FONT_OPTIONS } from '../lib/fonts';
import './PropertiesPanel.css';

type AnyObj = Record<string, any>;

export default function PropertiesPanel() {
  const {
    selected,
    updateSelected,
    deleteSelected,
    duplicateSelected,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
  } = useCanvasEditor();

  if (!selected) {
    return (
      <aside className="properties-panel">
        <div className="properties-empty">
          <p>Kein Element ausgewählt</p>
          <p className="properties-empty-hint">Wähle ein Element auf der Slide oder füge ein neues über die Toolbar hinzu.</p>
        </div>
      </aside>
    );
  }

  const obj = selected as unknown as AnyObj;
  const type = obj.type as string;
  const isText = type === 'i-text' || type === 'textbox' || type === 'text';
  const isShape = type === 'rect' || type === 'circle' || type === 'triangle';
  const isLine = type === 'line';

  return (
    <aside className="properties-panel">
      <div className="properties-section">
        <span className="field-label">Element</span>
        <div className="layer-btn-row">
          <button className="btn btn-icon" title="Nach vorne" onClick={bringToFront}>
            ⤒
          </button>
          <button className="btn btn-icon" title="Eine Ebene vor" onClick={bringForward}>
            ↑
          </button>
          <button className="btn btn-icon" title="Eine Ebene zurück" onClick={sendBackward}>
            ↓
          </button>
          <button className="btn btn-icon" title="Nach hinten" onClick={sendToBack}>
            ⤓
          </button>
        </div>
        <div className="layer-btn-row">
          <button className="btn" onClick={duplicateSelected}>
            Duplizieren
          </button>
          <button className="btn btn-danger" onClick={deleteSelected}>
            Löschen
          </button>
        </div>
      </div>

      {isText && (
        <div className="properties-section">
          <span className="field-label">Schriftart</span>
          <select
            className="select-input"
            value={obj.fontFamily ?? 'Poppins, sans-serif'}
            onChange={(e) => updateSelected({ fontFamily: e.target.value })}
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>

          <span className="field-label">Größe</span>
          <input
            type="range"
            min={10}
            max={140}
            value={obj.fontSize ?? 36}
            onChange={(e) => updateSelected({ fontSize: Number(e.target.value) })}
          />

          <span className="field-label">Farbe</span>
          <input
            type="color"
            value={typeof obj.fill === 'string' ? obj.fill : '#000000'}
            onChange={(e) => updateSelected({ fill: e.target.value })}
          />

          <span className="field-label">Stil</span>
          <div className="toggle-row">
            <button
              className={`toggle-btn ${obj.fontWeight === 'bold' ? 'active' : ''}`}
              onClick={() => updateSelected({ fontWeight: obj.fontWeight === 'bold' ? 'normal' : 'bold' })}
            >
              B
            </button>
            <button
              className={`toggle-btn ${obj.fontStyle === 'italic' ? 'active' : ''}`}
              onClick={() => updateSelected({ fontStyle: obj.fontStyle === 'italic' ? 'normal' : 'italic' })}
            >
              I
            </button>
            <button
              className={`toggle-btn ${obj.underline ? 'active' : ''}`}
              onClick={() => updateSelected({ underline: !obj.underline })}
            >
              U
            </button>
          </div>

          <span className="field-label">Ausrichtung</span>
          <div className="toggle-row">
            {(['left', 'center', 'right'] as const).map((a) => (
              <button
                key={a}
                className={`toggle-btn ${obj.textAlign === a ? 'active' : ''}`}
                onClick={() => updateSelected({ textAlign: a })}
              >
                {a === 'left' ? '⟸' : a === 'center' ? '↔' : '⟹'}
              </button>
            ))}
          </div>
        </div>
      )}

      {(isShape || isLine) && (
        <div className="properties-section">
          {!isLine && (
            <>
              <span className="field-label">Füllfarbe</span>
              <input
                type="color"
                value={typeof obj.fill === 'string' ? obj.fill : '#8134ff'}
                onChange={(e) => updateSelected({ fill: e.target.value })}
              />
            </>
          )}
          <span className="field-label">Rahmenfarbe</span>
          <input
            type="color"
            value={typeof obj.stroke === 'string' ? obj.stroke : '#000000'}
            onChange={(e) => updateSelected({ stroke: e.target.value })}
          />
          <span className="field-label">Rahmenstärke</span>
          <input
            type="range"
            min={0}
            max={30}
            value={obj.strokeWidth ?? 0}
            onChange={(e) => updateSelected({ strokeWidth: Number(e.target.value) })}
          />
        </div>
      )}

      <div className="properties-section">
        <span className="field-label">Deckkraft</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={obj.opacity ?? 1}
          onChange={(e) => updateSelected({ opacity: Number(e.target.value) })}
        />

        <span className="field-label">Drehung</span>
        <input
          type="range"
          min={0}
          max={360}
          value={Math.round(obj.angle ?? 0)}
          onChange={(e) => updateSelected({ angle: Number(e.target.value) })}
        />
      </div>
    </aside>
  );
}
