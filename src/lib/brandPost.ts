import { StaticCanvas, FabricImage, Textbox, Rect, loadSVGFromString, util, type Group } from 'fabric';
import { getEditDims, type AspectId } from './aspect';

// Martina Libra brand tokens — see claude code/context/brand-voice.md
export const BRAND = {
  navy: '#152B4E',
  pink: '#E5127D',
  cream: '#F7F1E7',
  headlineFont: '"Playfair Display", serif',
  bodyFont: 'Poppins, sans-serif',
};

export interface BrandedPostInput {
  photoDataUrl: string;
  headline: string;
  headlineHighlights: string[];
  body: string;
  bodyHighlights: string[];
}

function styleRunsForHighlights(
  text: string,
  highlights: string[],
  baseColor: string,
  highlightColor: string,
): Record<number, Record<number, { fill: string }>> {
  const line: Record<number, { fill: string }> = {};
  for (let i = 0; i < text.length; i++) line[i] = { fill: baseColor };
  for (const h of highlights) {
    if (!h) continue;
    let idx = text.indexOf(h);
    while (idx !== -1) {
      for (let i = idx; i < idx + h.length; i++) line[i] = { fill: highlightColor };
      idx = text.indexOf(h, idx + h.length);
    }
  }
  return { 0: line };
}

const HEART_SVG = `
<svg width="220" height="60" viewBox="0 0 220 60" xmlns="http://www.w3.org/2000/svg">
  <path d="M6 32 C 60 8, 90 54, 110 30" stroke="${BRAND.pink}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M110 30 C 130 54, 160 8, 214 32" stroke="${BRAND.pink}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M110 20 C 106 11, 95 11, 95 21 C 95 30, 110 39, 110 39 C 110 39, 125 30, 125 21 C 125 11, 114 11, 110 20 Z" fill="${BRAND.pink}"/>
</svg>`;

async function loadHeartDivider(): Promise<Group> {
  const { objects, options } = await loadSVGFromString(HEART_SVG);
  const valid = objects.filter((o): o is NonNullable<typeof o> => o !== null);
  return util.groupSVGElements(valid, options) as Group;
}

/** Renders a branded post (logo top-left, cropped photo right, serif headline +
 * heart divider + body text left) to an offscreen canvas and returns its JSON +
 * thumbnail, ready to store as a new slide. Runs off the live editor canvas so it
 * can never race with the slide-switch effect that loads/clears it. */
export async function renderBrandedSlide(
  input: BrandedPostInput,
  aspect: AspectId,
  logoUrl: string,
): Promise<{ json: Record<string, unknown>; thumbnail: string }> {
  const { width: cw, height: ch } = getEditDims(aspect);
  const fc = new StaticCanvas(undefined, { width: cw, height: ch, backgroundColor: BRAND.cream });

  // Photo: right-side vertical strip, cropped to cover.
  const photoImg = await FabricImage.fromURL(input.photoDataUrl);
  const boxX = cw * 0.5;
  const boxY = ch * 0.14;
  const boxW = cw * 0.46;
  const boxH = ch * 0.84;
  const iw = photoImg.width ?? boxW;
  const ih = photoImg.height ?? boxH;
  const scale = Math.max(boxW / iw, boxH / ih);
  photoImg.set({
    originX: 'left',
    originY: 'top',
    left: boxX + (boxW - iw * scale) / 2,
    top: boxY + (boxH - ih * scale) / 2,
    scaleX: scale,
    scaleY: scale,
  });
  photoImg.clipPath = new Rect({
    left: boxX,
    top: boxY,
    width: boxW,
    height: boxH,
    originX: 'left',
    originY: 'top',
    absolutePositioned: true,
  });
  fc.add(photoImg);

  // Logo: top-left.
  const logo = await FabricImage.fromURL(logoUrl, { crossOrigin: 'anonymous' });
  const logoW = cw * 0.34;
  const logoScale = logoW / (logo.width ?? logoW);
  logo.set({
    left: cw * 0.06,
    top: ch * 0.035,
    originX: 'left',
    originY: 'top',
    scaleX: logoScale,
    scaleY: logoScale,
  });
  fc.add(logo);

  // Headline: serif, left column, navy with pink emphasis.
  const headlineWidth = cw * 0.42;
  const headline = new Textbox(input.headline, {
    left: cw * 0.06,
    top: ch * 0.28,
    width: headlineWidth,
    originX: 'left',
    originY: 'top',
    fontFamily: BRAND.headlineFont,
    fontSize: Math.round(cw * 0.062),
    lineHeight: 1.15,
    fill: BRAND.navy,
    styles: styleRunsForHighlights(input.headline, input.headlineHighlights, BRAND.navy, BRAND.pink),
  });
  fc.add(headline);

  // Heart-swirl divider, positioned under the (already-wrapped) headline.
  const heart = await loadHeartDivider();
  const headlineBottom = (headline.top ?? 0) + headline.height * headline.scaleY;
  const heartScale = (headlineWidth * 0.45) / (heart.width || 1);
  heart.set({
    left: cw * 0.06,
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
    left: cw * 0.06,
    top: bodyTop,
    width: headlineWidth,
    originX: 'left',
    originY: 'top',
    fontFamily: BRAND.bodyFont,
    fontSize: Math.round(cw * 0.032),
    lineHeight: 1.35,
    fill: BRAND.navy,
    styles: styleRunsForHighlights(input.body, input.bodyHighlights, BRAND.navy, BRAND.pink),
  });
  fc.add(body);

  fc.renderAll();
  const json = fc.toJSON() as Record<string, unknown>;
  const thumbnail = fc.toDataURL({ format: 'jpeg', quality: 0.55, multiplier: 260 / cw });
  fc.dispose();
  return { json, thumbnail };
}
