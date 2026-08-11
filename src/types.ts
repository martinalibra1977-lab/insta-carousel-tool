import type { AspectId } from './lib/aspect';

export interface SlideData {
  id: string;
  json: Record<string, unknown> | null;
  thumbnail: string | null;
}

export interface ProjectFile {
  version: 1;
  projectName: string;
  aspect: AspectId;
  showPageNumbers: boolean;
  slides: SlideData[];
}
