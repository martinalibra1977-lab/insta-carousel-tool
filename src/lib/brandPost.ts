import { StaticCanvas, FabricImage, Textbox, loadSVGFromString, util, type Group } from 'fabric';
import { getEditDims, getExportMultiplier, type AspectId } from './aspect';

// Martina Libra brand tokens — see claude code/context/brand-voice.md
export const BRAND = {
  navy: '#152B4E',
  pink: '#E5127D',
  gold: '#B8912F',
  cream: '#F7F1E7',
  headlineFont: '"Playfair Display", serif',
  bodyFont: 'Poppins, sans-serif',
};

export interface BrandedPostInput {
  photoDataUrl: string;
  headline: string;
  headlineHighlights: string[];
  headlineGoldHighlights?: string[];
  body: string;
  bodyHighlights: string[];
  bodyGoldHighlights?: string[];
}

function styleRunsForHighlights(
  text: string,
  baseColor: string,
  colorGroups: Array<{ highlights: string[]; color: string }>,
): Record<number, Record<number, { fill: string }>> {
  const line: Record<number, { fill: string }> = {};
  for (let i = 0; i < text.length; i++) line[i] = { fill: baseColor };
  for (const group of colorGroups) {
    for (const h of group.highlights) {
      if (!h) continue;
      let idx = text.indexOf(h);
      while (idx !== -1) {
        for (let i = idx; i < idx + h.length; i++) line[i] = { fill: group.color };
        idx = text.indexOf(h, idx + h.length);
      }
    }
  }
  return { 0: line };
}

const HEART_SVG = `
<svg width="220" height="60" viewBox="0 0 220 60" xmlns="http://www.w3.org/2000/svg">
  <path d="M6 32 C 60 8, 90 54, 110 30" stroke="${BRAND.gold}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M110 30 C 130 54, 160 8, 214 32" stroke="${BRAND.gold}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M110 20 C 106 11, 95 11, 95 21 C 95 30, 110 39, 110 39 C 110 39, 125 30, 125 21 C 125 11, 114 11, 110 20 Z" fill="${BRAND.gold}"/>
</svg>`;

async function loadHeartDivider(): Promise<Group> {
  const { objects, options } = await loadSVGFromString(HEART_SVG);
  const valid = objects.filter((o): o is NonNullable<typeof o> => o !== null);
  return util.groupSVGElements(valid, options) as Group;
}

/** Renders a branded post as a split layout: a dedicated text panel on the left
 * (solid cream background, always readable) and the photo confined to its own
 * panel on the right — text never sits on top of the photo. Returns the JSON +
 * thumbnail, ready to store as a new slide. Runs off the live editor canvas so it
 * can never race with the slide-switch effect that loads/clears it. */
export async function renderBrandedSlide(
  input: BrandedPostInput,
  aspect: AspectId,
  logoUrl: string,
): Promise<{ json: Record<string, unknown>; thumbnail: string }> {
  const { width: cw, height: ch } = getEditDims(aspect);
  const fc = new StaticCanvas(undefined, { width: cw, height: ch, backgroundColor: BRAND.cream });

  // Split the canvas into a text panel (left) and a photo panel (right).
  const textPanelWidth = cw * 0.56;
  const photoPanelX = textPanelWidth;
  const photoPanelWidth = cw - photoPanelX;

  // Photo: pre-cropped (cover-fit) to the exact photo-panel size on an offscreen
  // canvas, then placed unscaled. Cropping the pixels themselves — rather than
  // using a Fabric clipPath — means the crop survives the JSON export/reload
  // round-trip the app uses for full-resolution export.
  const rawPhoto = await FabricImage.fromURL(input.photoDataUrl);
  const iw = rawPhoto.width ?? photoPanelWidth;
  const ih = rawPhoto.height ?? ch;
  const cropScale = Math.max(photoPanelWidth / iw, ch / ih);
  const srcCropW = photoPanelWidth / cropScale;
  const srcCropH = ch / cropScale;
  const srcCropX = (iw - srcCropW) / 2;
  const srcCropY = (ih - srcCropH) / 2;

  const renderMultiplier = getExportMultiplier(aspect);
  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = Math.round(photoPanelWidth * renderMultiplier);
  cropCanvas.height = Math.round(ch * renderMultiplier);
  const ctx = cropCanvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  ctx.drawImage(
    rawPhoto.getElement() as CanvasImageSource,
    srcCropX,
    srcCropY,
    srcCropW,
    srcCropH,
    0,
    0,
    cropCanvas.width,
    cropCanvas.height,
  );
  const croppedDataUrl = cropCanvas.toDataURL('image/jpeg', 0.92);

  const photoImg = await FabricImage.fromURL(croppedDataUrl);
  photoImg.set({
    originX: 'left',
    originY: 'top',
    left: photoPanelX,
    top: 0,
    scaleX: photoPanelWidth / cropCanvas.width,
    scaleY: ch / cropCanvas.height,
  });
  fc.add(photoImg);

  // Logo: smaller, top of the text panel.
  const logo = await FabricImage.fromURL(logoUrl, { crossOrigin: 'anonymous' });
  const logoW = textPanelWidth * 0.4;
  const logoScale = logoW / (logo.width ?? logoW);
  logo.set({
    left: textPanelWidth / 2,
    top: ch * 0.045,
    originX: 'center',
    originY: 'top',
    scaleX: logoScale,
    scaleY: logoScale,
  });
  fc.add(logo);

  // Headline: serif, fills the text panel, navy with pink/gold emphasis.
  const textLeft = cw * 0.07;
  const headlineWidth = textPanelWidth - textLeft - cw * 0.04;
  const headline = new Textbox(input.headline, {
    left: textLeft,
    top: ch * 0.26,
    width: headlineWidth,
    originX: 'left',
    originY: 'top',
    fontFamily: BRAND.headlineFont,
    fontSize: Math.round(cw * 0.068),
    lineHeight: 1.15,
    fill: BRAND.navy,
    styles: styleRunsForHighlights(input.headline, BRAND.navy, [
      { highlights: input.headlineHighlights, color: BRAND.pink },
      { highlights: input.headlineGoldHighlights ?? [], color: BRAND.gold },
    ]),
  });
  fc.add(headline);

  // Heart-swirl divider, positioned under the (already-wrapped) headline.
  const heart = await loadHeartDivider();
  const headlineBottom = (headline.top ?? 0) + headline.height * headline.scaleY;
  const heartScale = (headlineWidth * 0.5) / (heart.width || 1);
  heart.set({
    left: textLeft,
    top: headlineBottom + ch * 0.03,
    originX: 'left',
    originY: 'top',
    scaleX: heartScale,
    scaleY: heartScale,
  });
  fc.add(heart);

  // Body text below the divider.
  const bodyTop = (heart.top ?? 0) + heart.height * heart.scaleY + ch * 0.035;
  const body = new Textbox(input.body, {
    left: textLeft,
    top: bodyTop,
    width: headlineWidth,
    originX: 'left',
    originY: 'top',
    fontFamily: BRAND.bodyFont,
    fontSize: Math.round(cw * 0.036),
    lineHeight: 1.35,
    fill: BRAND.navy,
    styles: styleRunsForHighlights(input.body, BRAND.navy, [
      { highlights: input.bodyHighlights, color: BRAND.pink },
      { highlights: input.bodyGoldHighlights ?? [], color: BRAND.gold },
    ]),
  });
  fc.add(body);

  fc.renderAll();
  const json = fc.toJSON() as Record<string, unknown>;
  const thumbnail = fc.toDataURL({ format: 'jpeg', quality: 0.55, multiplier: 260 / cw });
  fc.dispose();
  return { json, thumbnail };
}
