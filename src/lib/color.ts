// Работа с цветом: разбор, перевод между моделями (RGB, HSV, HSL, OKLCH),
// смешивание и контраст по WCAG. Все цвета в конфиге темы хранятся строкой #rrggbb[aa].

export interface RGBA { r: number; g: number; b: number; a: number }
export interface HSV { h: number; s: number; v: number }
export interface HSL { h: number; s: number; l: number }
export interface OKLCH { l: number; c: number; h: number }

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const round = (v: number, d = 0) => { const p = 10 ** d; return Math.round(v * p) / p; };

export function parseColor(input: string): RGBA | null {
  const s = input.trim().toLowerCase();
  if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  let m = s.match(/^#?([0-9a-f]{3,8})$/);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('');
    if (h.length !== 6 && h.length !== 8) return null;
    return {
      r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16),
      a: h.length === 8 ? round(parseInt(h.slice(6, 8), 16) / 255, 3) : 1
    };
  }
  m = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/);
  if (m) {
    const a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return { r: +m[1], g: +m[2], b: +m[3], a: clamp(a) };
  }
  m = s.match(/^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%(?:[\s,/]+([\d.]+%?))?\s*\)$/);
  if (m) {
    const a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return { ...hslToRgb({ h: +m[1], s: +m[2] / 100, l: +m[3] / 100 }), a: clamp(a) };
  }
  m = s.match(/^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?(?:\s*\/\s*([\d.]+%?))?\s*\)$/);
  if (m) {
    const l = m[2] ? parseFloat(m[1]) / 100 : parseFloat(m[1]);
    const a = m[5] === undefined ? 1 : m[5].endsWith('%') ? parseFloat(m[5]) / 100 : parseFloat(m[5]);
    return { ...oklchToRgb({ l, c: +m[3], h: +m[4] }), a: clamp(a) };
  }
  return null;
}

export const isColor = (s: string) => parseColor(s) !== null;

const hex2 = (n: number) => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, '0');

export function toHex(c: RGBA, forceAlpha = false): string {
  const base = `#${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}`;
  return c.a < 1 || forceAlpha ? base + hex2(c.a * 255) : base;
}

/** Нормализует любой поддерживаемый цвет в #rrggbb[aa]. Если разобрать нельзя - возвращает fallback */
export function normalize(input: string, fallback = '#000000'): string {
  const c = parseColor(input);
  return c ? toHex(c) : fallback;
}

export function rgba(hex: string, alpha?: number): string {
  const c = parseColor(hex) ?? { r: 0, g: 0, b: 0, a: 1 };
  const a = alpha === undefined ? c.a : c.a * alpha;
  return `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${round(clamp(a), 3)})`;
}

export function withAlpha(hex: string, alpha: number): string {
  const c = parseColor(hex) ?? { r: 0, g: 0, b: 0, a: 1 };
  return toHex({ ...c, a: clamp(alpha) });
}

export const alphaOf = (hex: string) => parseColor(hex)?.a ?? 1;

/* ---------- HSV / HSL ---------- */

export function rgbToHsv({ r, g, b }: RGBA): HSV {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max ? d / max : 0, v: max };
}

export function hsvToRgb({ h, s, v }: HSV): { r: number; g: number; b: number } {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return { r: f(5) * 255, g: f(3) * 255, b: f(1) * 255 };
}

export function rgbToHsl({ r, g, b }: RGBA): HSL {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  let h = 0, s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
}

export function hslToRgb({ h, s, l }: HSL): { r: number; g: number; b: number } {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return { r: f(0) * 255, g: f(8) * 255, b: f(4) * 255 };
}

/* ---------- OKLCH ---------- */

const toLinear = (c: number) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const fromLinear = (c: number) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function rgbToOklch({ r, g, b }: RGBA): OKLCH {
  const lr = toLinear(r), lg = toLinear(g), lb = toLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  let h = (Math.atan2(B, A) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: L, c: Math.sqrt(A * A + B * B), h };
}

function oklchToLinear({ l: L, c, h }: OKLCH) {
  const A = c * Math.cos((h * Math.PI) / 180), B = c * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  ];
}

/** OKLCH → sRGB. Если цвет вне охвата sRGB, снижает насыщенность, сохраняя светлоту и оттенок */
export function oklchToRgb(c: OKLCH): { r: number; g: number; b: number } {
  let lo = 0, hi = c.c, cur = { ...c };
  const inGamut = (x: number[]) => x.every((v) => v >= -0.0005 && v <= 1.0005);
  if (!inGamut(oklchToLinear(cur))) {
    for (let i = 0; i < 18; i++) {
      const mid = (lo + hi) / 2;
      cur = { ...c, c: mid };
      if (inGamut(oklchToLinear(cur))) lo = mid; else hi = mid;
    }
    cur = { ...c, c: lo };
  }
  const [r, g, b] = oklchToLinear(cur).map((v) => clamp(v));
  return { r: fromLinear(r), g: fromLinear(g), b: fromLinear(b) };
}

export function oklch(l: number, c: number, h: number, a = 1): string {
  return toHex({ ...oklchToRgb({ l: clamp(l), c: Math.max(0, c), h: ((h % 360) + 360) % 360 }), a });
}

export function toOklch(hex: string): OKLCH {
  return rgbToOklch(parseColor(hex) ?? { r: 0, g: 0, b: 0, a: 1 });
}

/* ---------- Смешивание и производные ---------- */

/** Смешивание в OKLab: t=0 - первый цвет, t=1 - второй. Ровнее, чем в sRGB */
export function mix(a: string, b: string, t: number): string {
  const ca = parseColor(a) ?? { r: 0, g: 0, b: 0, a: 1 };
  const cb = parseColor(b) ?? { r: 0, g: 0, b: 0, a: 1 };
  const la = rgbToOklch(ca), lb = rgbToOklch(cb);
  const toLab = (x: OKLCH) => [x.l, x.c * Math.cos((x.h * Math.PI) / 180), x.c * Math.sin((x.h * Math.PI) / 180)];
  const [l1, a1, b1] = toLab(la), [l2, a2, b2] = toLab(lb);
  const L = l1 + (l2 - l1) * t, A = a1 + (a2 - a1) * t, B = b1 + (b2 - b1) * t;
  let h = (Math.atan2(B, A) * 180) / Math.PI;
  if (h < 0) h += 360;
  return toHex({ ...oklchToRgb({ l: L, c: Math.sqrt(A * A + B * B), h }), a: ca.a + (cb.a - ca.a) * t });
}

export function adjust(hex: string, { l = 0, c = 0, h = 0 }: { l?: number; c?: number; h?: number }): string {
  const o = toOklch(hex);
  return oklch(o.l + l, o.c + c, o.h + h, alphaOf(hex));
}

/* ---------- Контраст ---------- */

/** Накладывает полупрозрачный цвет на подложку */
export function flatten(fg: string, bg: string): RGBA {
  const f = parseColor(fg) ?? { r: 0, g: 0, b: 0, a: 1 };
  const b = parseColor(bg) ?? { r: 255, g: 255, b: 255, a: 1 };
  return { r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 };
}

export function luminance(c: RGBA): number {
  return 0.2126 * toLinear(c.r) + 0.7152 * toLinear(c.g) + 0.0722 * toLinear(c.b);
}

export function contrast(fg: string, bg: string): number {
  const b = flatten(bg, '#808080');
  const f = flatten(fg, toHex(b));
  const l1 = luminance(f), l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export const isLight = (hex: string) => luminance(flatten(hex, '#808080')) > 0.36;

/** Цвет текста, который читается на заданном фоне: белый или почти чёрный в тон фона */
export function readableOn(bg: string): string {
  const o = toOklch(bg);
  const dark = oklch(0.18, Math.min(o.c, 0.04), o.h);
  return contrast('#ffffff', bg) >= contrast(dark, bg) ? '#ffffff' : dark;
}

export function formatColor(hex: string, format: 'hex' | 'rgb' | 'hsl' | 'oklch'): string {
  const c = parseColor(hex) ?? { r: 0, g: 0, b: 0, a: 1 };
  const alpha = c.a < 1 ? ` / ${round(c.a * 100)}%` : '';
  if (format === 'rgb') return `rgb(${Math.round(c.r)} ${Math.round(c.g)} ${Math.round(c.b)}${alpha})`;
  if (format === 'hsl') {
    const h = rgbToHsl(c);
    return `hsl(${round(h.h)} ${round(h.s * 100)}% ${round(h.l * 100)}%${alpha})`;
  }
  if (format === 'oklch') {
    const o = rgbToOklch(c);
    return `oklch(${round(o.l * 100, 1)}% ${round(o.c, 3)} ${round(o.h, 1)}${alpha})`;
  }
  return toHex(c);
}
