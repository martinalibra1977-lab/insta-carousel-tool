import { StaticCanvas } from 'fabric';
import { getEditDims, getExportMultiplier, type AspectId } from './aspect';
import type { SlideData } from '../types';

async function renderSlideCanvasElement(slide: SlideData, aspect: AspectId): Promise<HTMLCanvasElement> {
  const { width, height } = getEditDims(aspect);
  const staticCanvas = new StaticCanvas(undefined, {
    width,
    height,
    backgroundColor: '#ffffff',
  });
  if (slide.json) {
    await staticCanvas.loadFromJSON(slide.json);
  }
  staticCanvas.renderAll();
  const multiplier = getExportMultiplier(aspect);
  const el = staticCanvas.toCanvasElement(multiplier);
  staticCanvas.dispose();
  return el;
}

function drawPageNumber(canvasEl: HTMLCanvasElement, current: number, total: number) {
  const ctx = canvasEl.getContext('2d');
  if (!ctx) return;
  const label = `${current} / ${total}`;
  const fontSize = Math.round(canvasEl.width * 0.03);
  ctx.font = `600 ${fontSize}px Inter, sans-serif`;
  const paddingX = fontSize * 0.9;
  const paddingY = fontSize * 0.55;
  const textWidth = ctx.measureText(label).width;
  const pillW = textWidth + paddingX * 2;
  const pillH = fontSize + paddingY * 2;
  const margin = canvasEl.width * 0.035;
  const x = canvasEl.width - pillW - margin;
  const y = canvasEl.height - pillH - margin;
  const r = pillH / 2;

  ctx.fillStyle = 'rgba(18,16,23,0.72)';
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + pillW, y, x + pillW, y + pillH, r);
  ctx.arcTo(x + pillW, y + pillH, x, y + pillH, r);
  ctx.arcTo(x, y + pillH, x, y, r);
  ctx.arcTo(x, y, x + pillW, y, r);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.font = `600 ${fontSize}px Inter, sans-serif`;
  ctx.fillText(label, x + paddingX, y + pillH / 2 + 1);
}

function canvasElToBlob(canvasEl: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvasEl.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas konnte nicht exportiert werden.'));
    }, 'image/png');
  });
}

export async function exportSlidePNGBlob(
  slide: SlideData,
  aspect: AspectId,
  pageNumber?: { current: number; total: number },
): Promise<Blob> {
  const el = await renderSlideCanvasElement(slide, aspect);
  if (pageNumber) drawPageNumber(el, pageNumber.current, pageNumber.total);
  return canvasElToBlob(el);
}

export function slugify(input: string): string {
  return (
    input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-+|-+$)/g, '') || 'karussell'
  );
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export async function downloadSlidePNG(
  slide: SlideData,
  aspect: AspectId,
  index: number,
  total: number,
  showPageNumbers: boolean,
  projectName: string,
) {
  const blob = await exportSlidePNGBlob(
    slide,
    aspect,
    showPageNumbers ? { current: index + 1, total } : undefined,
  );
  const { saveAs } = await import('file-saver');
  saveAs(blob, `${slugify(projectName)}-slide-${pad(index + 1)}.png`);
}

export async function exportAllAsZip(
  slides: SlideData[],
  aspect: AspectId,
  showPageNumbers: boolean,
  projectName: string,
  onProgress?: (done: number, total: number) => void,
) {
  const [{ default: JSZip }, { saveAs }] = await Promise.all([import('jszip'), import('file-saver')]);
  const zip = new JSZip();
  for (let i = 0; i < slides.length; i++) {
    const blob = await exportSlidePNGBlob(
      slides[i],
      aspect,
      showPageNumbers ? { current: i + 1, total: slides.length } : undefined,
    );
    zip.file(`${slugify(projectName)}-slide-${pad(i + 1)}.png`, blob);
    onProgress?.(i + 1, slides.length);
  }
  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `${slugify(projectName)}.zip`);
}
