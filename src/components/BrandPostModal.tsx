import { useRef, useState } from 'react';
import { useCanvasEditor } from '../canvas/CanvasContext';
import './BrandPostModal.css';

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function splitHighlights(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function BrandPostModal({ onClose }: { onClose: () => void }) {
  const { generateBrandPost } = useCanvasEditor();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [headline, setHeadline] = useState('Manche Beziehungsmuster fühlen sich vertraut an — obwohl sie dir nicht guttun.');
  const [headlineHighlight, setHeadlineHighlight] = useState('obwohl sie dir nicht guttun.');
  const [headlineGoldHighlight, setHeadlineGoldHighlight] = useState('');
  const [body, setBody] = useState(
    'Du wiederholst nicht, wer du bist. Du wiederholst oft nur, was du gelernt hast. Und genau das darf sich verändern.',
  );
  const [bodyHighlight, setBodyHighlight] = useState('gelernt hast, verändern');
  const [bodyGoldHighlight, setBodyGoldHighlight] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePhotoChange(file: File) {
    const dataUrl = await readFileAsDataURL(file);
    setPhotoDataUrl(dataUrl);
    setPhotoName(file.name);
  }

  async function handleSubmit() {
    if (!photoDataUrl) {
      setError('Bitte zuerst ein Foto auswählen.');
      return;
    }
    setError(null);
    setGenerating(true);
    try {
      await generateBrandPost({
        photoDataUrl,
        headline,
        headlineHighlights: splitHighlights(headlineHighlight),
        headlineGoldHighlights: splitHighlights(headlineGoldHighlight),
        body,
        bodyHighlights: splitHighlights(bodyHighlight),
        bodyGoldHighlights: splitHighlights(bodyGoldHighlight),
      });
      onClose();
    } catch {
      setError('Der Post konnte nicht erstellt werden. Bitte nochmal versuchen.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="brandpost-overlay" onClick={onClose}>
      <div className="brandpost-modal" onClick={(e) => e.stopPropagation()}>
        <button className="brandpost-close" onClick={onClose}>
          ✕
        </button>
        <h2>✨ Marken-Post erstellen</h2>
        <p className="brandpost-hint">
          Foto + Text auswählen — Logo, Farben und Schrift werden automatisch nach deinem Branding gesetzt.
        </p>

        <div className="brandpost-field">
          <label>Foto</label>
          <button className="btn" onClick={() => fileInputRef.current?.click()}>
            {photoName ? `📷 ${photoName}` : '📷 Foto auswählen'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePhotoChange(file);
              e.target.value = '';
            }}
          />
          {photoDataUrl && <img className="brandpost-photo-preview" src={photoDataUrl} alt="Vorschau" />}
        </div>

        <div className="brandpost-field">
          <label>Überschrift</label>
          <textarea rows={3} value={headline} onChange={(e) => setHeadline(e.target.value)} />
        </div>
        <div className="brandpost-field">
          <label>Davon in Pink hervorheben (kommagetrennt, muss exakt im Text vorkommen)</label>
          <input value={headlineHighlight} onChange={(e) => setHeadlineHighlight(e.target.value)} />
        </div>
        <div className="brandpost-field">
          <label>Davon in Gold hervorheben (kommagetrennt, optional)</label>
          <input value={headlineGoldHighlight} onChange={(e) => setHeadlineGoldHighlight(e.target.value)} />
        </div>

        <div className="brandpost-field">
          <label>Fließtext</label>
          <textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <div className="brandpost-field">
          <label>Davon in Pink hervorheben (kommagetrennt)</label>
          <input value={bodyHighlight} onChange={(e) => setBodyHighlight(e.target.value)} />
        </div>
        <div className="brandpost-field">
          <label>Davon in Gold hervorheben (kommagetrennt, optional)</label>
          <input value={bodyGoldHighlight} onChange={(e) => setBodyGoldHighlight(e.target.value)} />
        </div>

        {error && <p className="brandpost-error">{error}</p>}

        <button className="btn btn-primary brandpost-submit" onClick={handleSubmit} disabled={generating}>
          {generating ? 'Erstelle Post…' : 'Post erstellen'}
        </button>
      </div>
    </div>
  );
}
