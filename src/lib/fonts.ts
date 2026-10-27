// Шрифты: системные шрифты Windows и каталог Google Fonts с поддержкой кириллицы.

export interface FontInfo {
  family: string;
  kind: 'sans' | 'serif' | 'mono' | 'display' | 'hand';
  /** Веса для ссылки Google Fonts. null - у шрифта одно начертание */
  weights?: string | null;
  note?: string;
}

/** Есть в Windows 10/11 без установки - работают в клиенте всегда */
export const SYSTEM_FONTS: FontInfo[] = [
  { family: 'Segoe UI Variable Display', kind: 'sans', note: 'Windows 11' },
  { family: 'Segoe UI Variable Text', kind: 'sans', note: 'Windows 11' },
  { family: 'Segoe UI', kind: 'sans' },
  { family: 'Bahnschrift', kind: 'display', note: 'почти DIN' },
  { family: 'Franklin Gothic Medium', kind: 'display' },
  { family: 'Impact', kind: 'display' },
  { family: 'Gabriola', kind: 'display', note: 'витиеватый' },
  { family: 'Calibri', kind: 'sans' },
  { family: 'Candara', kind: 'sans' },
  { family: 'Corbel', kind: 'sans' },
  { family: 'Tahoma', kind: 'sans' },
  { family: 'Trebuchet MS', kind: 'sans' },
  { family: 'Verdana', kind: 'sans' },
  { family: 'Georgia', kind: 'serif' },
  { family: 'Sitka Text', kind: 'serif' },
  { family: 'Cambria', kind: 'serif' },
  { family: 'Constantia', kind: 'serif' },
  { family: 'Palatino Linotype', kind: 'serif' },
  { family: 'Cascadia Mono', kind: 'mono', note: 'Windows 11' },
  { family: 'Consolas', kind: 'mono' },
  { family: 'Lucida Console', kind: 'mono' },
  { family: 'Courier New', kind: 'mono' },
  { family: 'Ink Free', kind: 'hand' },
  { family: 'Segoe Print', kind: 'hand' },
  { family: 'Segoe Script', kind: 'hand' },
  { family: 'Comic Sans MS', kind: 'hand' }
];

/** Популярные шрифты Google Fonts. latin: true - без кириллицы (русский текст покажется запасным шрифтом) */
export const GOOGLE_FONTS: (FontInfo & { latin?: boolean })[] = [
  // Без засечек
  { family: 'Inter', kind: 'sans', weights: '400;500;600;700' },
  { family: 'Mulish', kind: 'sans', weights: '400;500;600;700;800' },
  { family: 'Manrope', kind: 'sans', weights: '400;500;600;700;800' },
  { family: 'Onest', kind: 'sans', weights: '400;500;600;700' },
  { family: 'Golos Text', kind: 'sans', weights: '400;500;600;700' },
  { family: 'Rubik', kind: 'sans', weights: '400;500;600;700' },
  { family: 'Montserrat', kind: 'sans', weights: '400;500;600;700' },
  { family: 'Nunito', kind: 'sans', weights: '400;600;700;800' },
  { family: 'Raleway', kind: 'sans', weights: '400;500;600;700' },
  { family: 'Jost', kind: 'sans', weights: '400;500;600;700' },
  { family: 'Geologica', kind: 'sans', weights: '400;500;600;700' },
  { family: 'Commissioner', kind: 'sans', weights: '400;500;600;700' },
  { family: 'Wix Madefor Display', kind: 'sans', weights: '400;500;600;700;800' },
  { family: 'Ysabeau Office', kind: 'sans', weights: '400;500;600;700' },
  { family: 'IBM Plex Sans', kind: 'sans', weights: '400;500;600;700' },
  { family: 'Fira Sans', kind: 'sans', weights: '400;500;600;700' },
  { family: 'Open Sans', kind: 'sans', weights: '400;500;600;700' },
  { family: 'Roboto Flex', kind: 'sans', weights: '400;500;600;700' },
  { family: 'Ubuntu', kind: 'sans', weights: '400;500;700' },
  { family: 'Exo 2', kind: 'sans', weights: '400;500;600;700' },
  { family: 'Outfit', kind: 'sans', weights: '400;500;600;700', latin: true },
  { family: 'Plus Jakarta Sans', kind: 'sans', weights: '400;500;600;700', latin: true },
  { family: 'Space Grotesk', kind: 'sans', weights: '400;500;600;700', latin: true },
  { family: 'Sora', kind: 'sans', weights: '400;500;600;700', latin: true },
  { family: 'DM Sans', kind: 'sans', weights: '400;500;600;700', latin: true },
  // Акцентные
  { family: 'Comfortaa', kind: 'display', weights: '400;500;600;700' },
  { family: 'Unbounded', kind: 'display', weights: '400;500;600;700' },
  { family: 'Oswald', kind: 'display', weights: '400;500;600;700' },
  { family: 'Tenor Sans', kind: 'display', weights: null },
  { family: 'Philosopher', kind: 'display', weights: '400;700' },
  { family: 'Russo One', kind: 'display', weights: null },
  { family: 'Tektur', kind: 'display', weights: '400;500;600;700' },
  { family: 'Press Start 2P', kind: 'display', weights: null },
  { family: 'Orbitron', kind: 'display', weights: '400;500;600;700', latin: true },
  { family: 'Syne', kind: 'display', weights: '400;500;600;700', latin: true },
  // С засечками
  { family: 'Playfair Display', kind: 'serif', weights: '400;600;700' },
  { family: 'Lora', kind: 'serif', weights: '400;500;600;700' },
  { family: 'Cormorant', kind: 'serif', weights: '400;500;600;700' },
  { family: 'Literata', kind: 'serif', weights: '400;500;600;700' },
  { family: 'Prata', kind: 'serif', weights: null },
  { family: 'PT Serif', kind: 'serif', weights: '400;700' },
  // Рукописные
  { family: 'Caveat', kind: 'hand', weights: '400;600;700' },
  { family: 'Marck Script', kind: 'hand', weights: null },
  { family: 'Neucha', kind: 'hand', weights: null },
  // Моноширинные
  { family: 'JetBrains Mono', kind: 'mono', weights: '400;500;600;700' },
  { family: 'Fira Code', kind: 'mono', weights: '400;500;600;700' },
  { family: 'IBM Plex Mono', kind: 'mono', weights: '400;500;600' },
  { family: 'Roboto Mono', kind: 'mono', weights: '400;500;600;700' },
  { family: 'Ubuntu Mono', kind: 'mono', weights: '400;700' },
  { family: 'Space Mono', kind: 'mono', weights: '400;700' }
];

export const FONT_KINDS: { value: FontInfo['kind'] | 'all'; label: string }[] = [
  { value: 'all', label: 'Все' }, { value: 'sans', label: 'Без засечек' }, { value: 'display', label: 'Акцентные' },
  { value: 'serif', label: 'С засечками' }, { value: 'hand', label: 'Рукописные' }, { value: 'mono', label: 'Моно' }
];

export const FONT_EXAMPLE_URL = 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&display=swap';

export function googleFontUrl(family: string, weights?: string | null): string {
  const fam = family.trim().replace(/\s+/g, '+');
  return `https://fonts.googleapis.com/css2?family=${fam}${weights ? `:wght@${weights}` : ''}&display=swap`;
}

export function isGoogleFontsUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return u.protocol === 'https:' && (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.bunny.net');
  } catch {
    return false;
  }
}

/** Достаёт названия семейств из ссылки: ?family=Inter:wght@400;700&family=Exo+2 → ["Inter", "Exo 2"] */
export function familiesFromUrl(url: string): string[] {
  try {
    const u = new URL(url.trim());
    return u.searchParams.getAll('family')
      .flatMap((f) => f.split('|'))
      .map((f) => f.split(':')[0].replace(/\+/g, ' ').trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

/** Достаёт ссылку из того, что вставил пользователь: голая ссылка, <link href="...">, @import url(...) */
export function extractFontUrl(input: string): string | null {
  const s = input.trim();
  const m = s.match(/https:\/\/fonts\.(?:googleapis\.com|bunny\.net)\/[^\s"')<>]+/);
  return m ? m[0].replace(/&amp;/g, '&') : null;
}

/** Моноширинный ли шрифт: по каталогам, а для шрифтов по своей ссылке - по названию */
export function isMonoFont(family: string): boolean {
  const known = [...SYSTEM_FONTS, ...GOOGLE_FONTS].find((x) => x.family.toLowerCase() === family.trim().toLowerCase());
  return known ? known.kind === 'mono' : /mono|code|courier|consol/i.test(family);
}

const FALLBACK: Record<'sans' | 'mono', string> = {
  sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
  mono: "ui-monospace, 'Cascadia Mono', Consolas, 'SFMono-Regular', monospace"
};

/**
 * Стек шрифтов: выбранный, затем системные, в конце шрифты эмодзи. twemoji (картинки флагов, шрифт
 * клиента) - только там, где флаги нужны (flags): у клиента он стоит лишь у названий серверов
 * (.flag-emoji), а в общем стеке превращал бы буквы NL, DE в флаги во всех текстах, например в описании сервера
 */
export function fontStack(family: string, kind: 'sans' | 'mono', flags = false): string {
  const f = family.trim().replace(/["\\;{}]/g, '');
  return `"${f}", ${FALLBACK[kind]}, ${flags ? "'Apple Color Emoji', 'twemoji'" : "'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'"}`;
}
