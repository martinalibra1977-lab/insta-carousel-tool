export interface FontOption {
  label: string;
  value: string;
  googleFont?: string;
}

export const FONT_OPTIONS: FontOption[] = [
  { label: 'Poppins', value: 'Poppins, sans-serif', googleFont: 'Poppins:wght@400;600;700' },
  { label: 'Montserrat', value: 'Montserrat, sans-serif', googleFont: 'Montserrat:wght@400;600;800' },
  { label: 'Playfair Display', value: '"Playfair Display", serif', googleFont: 'Playfair+Display:wght@400;700' },
  { label: 'Bebas Neue', value: '"Bebas Neue", sans-serif', googleFont: 'Bebas+Neue' },
  { label: 'Caveat', value: 'Caveat, cursive', googleFont: 'Caveat:wght@500;700' },
  { label: 'Roboto Mono', value: '"Roboto Mono", monospace', googleFont: 'Roboto+Mono:wght@400;700' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
];

export function googleFontsHref(): string {
  const families = FONT_OPTIONS.filter((f) => f.googleFont)
    .map((f) => `family=${f.googleFont}`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}
