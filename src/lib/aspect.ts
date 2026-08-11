export type AspectId = 'square' | 'portrait' | 'story';

export interface AspectDef {
  id: AspectId;
  label: string;
  ratioW: number;
  ratioH: number;
  exportW: number;
  exportH: number;
}

export const ASPECTS: Record<AspectId, AspectDef> = {
  square: {
    id: 'square',
    label: 'Quadratisch (1:1)',
    ratioW: 1,
    ratioH: 1,
    exportW: 1080,
    exportH: 1080,
  },
  portrait: {
    id: 'portrait',
    label: 'Hochformat (4:5)',
    ratioW: 4,
    ratioH: 5,
    exportW: 1080,
    exportH: 1350,
  },
  story: {
    id: 'story',
    label: 'Story (9:16)',
    ratioW: 9,
    ratioH: 16,
    exportW: 1080,
    exportH: 1920,
  },
};

export const EDIT_WIDTH = 400;

export function getEditDims(aspect: AspectId): { width: number; height: number } {
  const def = ASPECTS[aspect];
  const width = EDIT_WIDTH;
  const height = Math.round((width * def.ratioH) / def.ratioW);
  return { width, height };
}

export function getExportMultiplier(aspect: AspectId): number {
  const def = ASPECTS[aspect];
  const { width } = getEditDims(aspect);
  return def.exportW / width;
}
