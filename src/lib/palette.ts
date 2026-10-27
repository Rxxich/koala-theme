// Построение полной палитры из нескольких опорных цветов.
// Используется в пресетах, в кнопке "Автоподбор" и в генераторе случайной палитры.

import { adjust, contrast, isLight, mix, oklch, readableOn, toOklch } from './color';
import type { Palette, PaletteKey, Scheme } from './types';

export interface PaletteSeed {
  background: string;
  foreground?: string;
  primary: string;
  card?: string;
  popover?: string;
  powerOnStart?: string;
  powerOnEnd?: string;
  powerOffStart?: string;
  powerOffEnd?: string;
  accent?: string;
  primaryForeground?: string;
  mutedForeground?: string;
  stroke?: string;
  border?: string;
  secondary?: string;
}

export function derivePalette(scheme: Scheme, seed: PaletteSeed): Palette {
  const light = scheme === 'light';
  const bg = seed.background;
  const fg = seed.foreground ?? (light ? mix(bg, '#000000', 0.86) : mix(bg, '#ffffff', 0.9));
  const card = seed.card ?? (light ? mix(bg, '#ffffff', 0.72) : mix(bg, fg, 0.055));
  const popover = seed.popover ?? (light ? mix(card, '#ffffff', 0.6) : mix(bg, fg, 0.085));
  const primary = seed.primary;
  const onStart = seed.powerOnStart ?? adjust(primary, { l: light ? 0.16 : 0.12, c: -0.02 });
  const onEnd = seed.powerOnEnd ?? primary;
  return {
    background: bg,
    foreground: fg,
    card,
    popover,
    primary,
    primaryForeground: seed.primaryForeground ?? readableOn(primary),
    secondary: seed.secondary ?? mix(bg, fg, light ? 0.045 : 0.075),
    mutedForeground: seed.mutedForeground ?? mix(fg, bg, light ? 0.4 : 0.42),
    accent: seed.accent ?? mix(card, primary, light ? 0.12 : 0.16),
    border: seed.border ?? mix(bg, fg, light ? 0.1 : 0.11),
    stroke: seed.stroke ?? mix(bg, fg, light ? 0.16 : 0.17),
    destructive: light ? '#dc2b3f' : '#f0566a',
    success: light ? '#1f9d55' : '#3dd68c',
    warning: light ? '#d48806' : '#f5b83d',
    powerOnStart: onStart,
    powerOnEnd: onEnd,
    powerOnStroke: light ? onEnd : onStart,
    powerOffStart: seed.powerOffStart ?? mix(bg, fg, light ? 0.3 : 0.32),
    powerOffEnd: seed.powerOffEnd ?? mix(bg, fg, light ? 0.5 : 0.18),
    powerOffStroke: mix(bg, fg, light ? 0.26 : 0.28)
  };
}

/** Пересчитать производные роли от основных (фон, текст, акцент, кнопка подключения) */
export function rederive(scheme: Scheme, p: Palette): Palette {
  return derivePalette(scheme, {
    background: p.background, foreground: p.foreground, primary: p.primary,
    powerOnStart: p.powerOnStart, powerOnEnd: p.powerOnEnd
  });
}

/* ---------- Генератор гармоничных палитр ----------
   Всё считается в OKLCH: там одинаковая "светлота" действительно выглядит одинаково светлой,
   поэтому любые оттенки, подставленные по схеме гармонии, сочетаются без грязи.
   Случайными выбираются: базовый оттенок, схема гармонии, насыщенность акцента, тон и
   насыщенность фона (от нейтрального серого до заметно окрашенного), глубина тёмного фона. */

export type Harmony = 'analog' | 'complement' | 'split' | 'triad' | 'tetrad' | 'mono' | 'neutral';

export const HARMONIES: { value: Harmony; label: string; hint: string }[] = [
  { value: 'analog', label: 'Аналоговая', hint: 'Соседние оттенки на круге: спокойно и цельно' },
  { value: 'complement', label: 'Контраст', hint: 'Противоположные оттенки: ярко и энергично' },
  { value: 'split', label: 'Расщеплённая', hint: 'Оттенок и два соседа его противоположности' },
  { value: 'triad', label: 'Триада', hint: 'Три оттенка через 120°: игриво' },
  { value: 'tetrad', label: 'Тетрада', hint: 'Два контрастных пары: насыщенно' },
  { value: 'mono', label: 'Монохром', hint: 'Один оттенок разной светлоты' },
  { value: 'neutral', label: 'Нейтральная', hint: 'Серый фон и один яркий акцент' }
];

export interface GenOptions {
  hue?: number;
  harmony?: Harmony;
  /** Насыщенность акцента: 0.4 - приглушённо, 1 - обычно, 1.4 - сочно */
  vivid?: number;
  /** Насколько фон окрашен в базовый оттенок: 0 - нейтральный, 1 - заметно */
  tint?: number;
}

export interface GenResult { light: Palette; dark: Palette; harmony: Harmony; hue: number; name: string }

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const HUE_NAMES: [number, string][] = [
  [15, 'Коралл'], [40, 'Янтарь'], [65, 'Горчица'], [95, 'Лайм'], [140, 'Изумруд'], [175, 'Бирюза'],
  [205, 'Лазурь'], [235, 'Сапфир'], [265, 'Индиго'], [295, 'Аметист'], [325, 'Фуксия'], [350, 'Рубин'], [361, 'Коралл']
];
export const hueName = (h: number) => HUE_NAMES.find(([lim]) => ((h % 360) + 360) % 360 < lim)?.[1] ?? 'Оттенок';

/** Оттенки схемы: [акцент, начало градиента кнопки, конец градиента кнопки, оттенок фона] */
function harmonyHues(h: number, harmony: Harmony): [number, number, number, number] {
  switch (harmony) {
    case 'analog': { const d = rnd(22, 45) * (Math.random() < 0.5 ? 1 : -1); return [h, h + d, h - d * 0.3, h + d * 0.5]; }
    case 'complement': return [h, h + 180, h + rnd(-15, 15), Math.random() < 0.5 ? h : h + 180];
    case 'split': { const d = rnd(25, 40); return [h, h + 180 - d, h + 180 + d, h]; }
    case 'triad': return [h, h + 120, h + 240, pick([h, h + 120, h + 240])];
    case 'tetrad': return [h, h + 90, h + 180, h + 270];
    case 'mono': return [h, h, h, h];
    case 'neutral': return [h, h + rnd(-20, 20), h + rnd(-10, 10), rnd(0, 360)];
  }
}

export function generatePalettes(opts: GenOptions = {}): GenResult {
  const hue = opts.hue ?? rnd(0, 360);
  const harmony = opts.harmony ?? pick(HARMONIES.map((x) => x.value));
  const vivid = opts.vivid ?? rnd(0.7, 1.25);
  const tint = opts.tint ?? (harmony === 'neutral' ? 0 : Math.pow(Math.random(), 1.4));
  const [hA, hB, hC, hBg] = harmonyHues(hue, harmony);
  // Тёплые или холодные нейтрали для почти серых фонов - чтобы серый не был "мёртвым"
  const bgHue = tint < 0.15 ? (Math.random() < 0.5 ? 250 : 60) : hBg;
  const bgC = 0.004 + tint * 0.035;
  const darkDepth = rnd(0.12, 0.2);
  const mono = harmony === 'mono';

  const light = derivePalette('light', {
    background: oklch(rnd(0.955, 0.985), bgC, bgHue),
    primary: oklch(rnd(0.45, 0.56), 0.15 * vivid, hA),
    powerOnStart: oklch(mono ? 0.85 : rnd(0.78, 0.86), (mono ? 0.09 : 0.14) * vivid, hB),
    powerOnEnd: oklch(rnd(0.5, 0.6), 0.16 * vivid, hC),
    powerOffStart: oklch(0.86, 0.05 * vivid, hA + 160),
    powerOffEnd: oklch(0.66, 0.1 * vivid, hA + 160)
  });
  const dark = derivePalette('dark', {
    background: oklch(darkDepth, bgC + 0.006, bgHue),
    primary: oklch(rnd(0.74, 0.84), 0.13 * vivid, hA),
    powerOnStart: oklch(mono ? 0.88 : rnd(0.82, 0.9), (mono ? 0.08 : 0.13) * vivid, hB),
    powerOnEnd: oklch(rnd(0.6, 0.7), 0.15 * vivid, hC),
    powerOffStart: oklch(0.55, 0.06 * vivid, hA + 160),
    powerOffEnd: oklch(0.32, 0.04 * vivid, hA + 160)
  });
  const hLabel = HARMONIES.find((x) => x.value === harmony)!.label.toLowerCase();
  return { light, dark, harmony, hue: Math.round(((hue % 360) + 360) % 360), name: `${hueName(hue)}, ${hLabel}` };
}

/** Совместимость: одна схема из случайной пары */
export function randomPalette(scheme: Scheme, hue?: number, harmony?: Harmony): Palette {
  return generatePalettes({ hue, harmony })[scheme];
}

/** Палитра от выбранного цвета: оттенок берётся из него, остальное - по схеме гармонии */
export function palettesFromColor(hex: string, harmony?: Harmony): GenResult {
  const o = toOklch(hex);
  return generatePalettes({ hue: o.h, harmony, vivid: Math.max(0.4, Math.min(1.5, o.c / 0.14)) });
}

export interface RoleInfo { key: PaletteKey; label: string; help: string; group: 'base' | 'accent' | 'power' | 'status' }

/** Роли палитры в порядке показа в окне "Палитра" */
export const ROLES: RoleInfo[] = [
  { key: 'background', label: 'Фон', help: 'Основной фон окна. Если в разделе "Фон" выбран градиент или картинка - это цвет под ними', group: 'base' },
  { key: 'card', label: 'Карточки', help: 'Плитки главной, карточки серверов и профилей, боковая панель', group: 'base' },
  { key: 'popover', label: 'Всплывающие', help: 'Меню, выпадающие списки, диалоги и уведомления', group: 'base' },
  { key: 'foreground', label: 'Текст', help: 'Основной текст и иконки', group: 'base' },
  { key: 'mutedForeground', label: 'Подписи', help: 'Второстепенный текст: протокол сервера, подписи, плейсхолдеры', group: 'base' },
  { key: 'secondary', label: 'Поля и фон вторичных', help: 'Фон полей ввода, бейджей и вторичных кнопок', group: 'base' },
  { key: 'stroke', label: 'Рамки', help: 'Рамки карточек, полей и кнопок outline', group: 'base' },
  { key: 'border', label: 'Разделители', help: 'Тонкие линии-разделители и рамки таблиц', group: 'base' },
  { key: 'primary', label: 'Акцент', help: 'Кнопки, выбранный сервер, активные элементы, фокус', group: 'accent' },
  { key: 'primaryForeground', label: 'Текст на акценте', help: 'Текст на кнопках, залитых акцентным цветом', group: 'accent' },
  { key: 'accent', label: 'Подсветка', help: 'Фон при наведении и активный пункт меню', group: 'accent' },
  { key: 'powerOnStart', label: 'Подключено: от', help: 'Начало градиента кнопки подключения, переключателей и вкладок', group: 'power' },
  { key: 'powerOnEnd', label: 'Подключено: до', help: 'Конец градиента кнопки подключения', group: 'power' },
  { key: 'powerOnStroke', label: 'Подключено: рамка', help: 'Рамка кнопки подключения и цвет стрелок трафика', group: 'power' },
  { key: 'powerOffStart', label: 'Отключено: от', help: 'Начало градиента выключенной кнопки', group: 'power' },
  { key: 'powerOffEnd', label: 'Отключено: до', help: 'Конец градиента выключенной кнопки', group: 'power' },
  { key: 'powerOffStroke', label: 'Отключено: рамка', help: 'Рамка выключенной кнопки', group: 'power' },
  { key: 'success', label: 'Успех', help: 'Хорошая задержка, успешные уведомления', group: 'status' },
  { key: 'warning', label: 'Предупреждение', help: 'Средняя задержка, предупреждения в логах', group: 'status' },
  { key: 'destructive', label: 'Ошибка', help: 'Кнопки удаления, ошибки ядра и логов', group: 'status' }
];

export const ROLE_GROUPS: Record<RoleInfo['group'], string> = {
  base: 'Основа', accent: 'Акцент', power: 'Кнопка подключения', status: 'Состояния'
};

/** Свотчи для быстрого выбора, по ролям и режимам */
export const SWATCHES: Record<Scheme, Partial<Record<PaletteKey, string[]>>> & { accent: string[] } = {
  accent: ['#22b8cf', '#339af0', '#5c7cfa', '#7950f2', '#be4bdb', '#f06595', '#ff6b6b', '#ff922b', '#fab005', '#82c91e', '#40c057', '#20c997'],
  light: {
    background: ['#ffffff', '#f8f9fa', '#f4f1ea', '#eef2f7', '#ebf2ee', '#fdf2f6', '#f5f3ff'],
    card: ['#ffffff', '#fbfbfd', '#fbfefc', '#f8f6f1', '#f4f6fa'],
    popover: ['#ffffff', '#fdfdfd', '#f9fafb'],
    foreground: ['#111318', '#1a1b1e', '#212529', '#13221a', '#1f1a2b', '#2b1f17'],
    mutedForeground: ['#5c6370', '#6c757d', '#57685e', '#868e96'],
    stroke: ['#dfe3ea', '#d0d7e2', '#c4d2ca', '#e2ddd4'],
    border: ['#e9ecef', '#e3e7ee', '#dce5e0']
  },
  dark: {
    background: ['#000000', '#0b0d12', '#0d1117', '#090a0f', '#111114', '#0f1419', '#120e17'],
    card: ['#11141b', '#161b22', '#131a24', '#1a1b1e', '#18161f'],
    popover: ['#151a22', '#1c2128', '#1b1b22'],
    foreground: ['#ffffff', '#e6edf3', '#e6ebf2', '#ededef', '#c9d1d9'],
    mutedForeground: ['#8b949e', '#8f9bab', '#9aa0aa', '#6e7681'],
    stroke: ['#2b3340', '#30363d', '#2e3949', '#26262b'],
    border: ['#1f2630', '#21262d', '#1f2733']
  }
};

export function contrastIssues(p: Palette): { label: string; ratio: number; min: number }[] {
  const checks: [string, string, string, number][] = [
    ['Текст на фоне', p.foreground, p.background, 4.5],
    ['Текст на карточке', p.foreground, p.card, 4.5],
    ['Подписи на карточке', p.mutedForeground, p.card, 3],
    ['Текст на акценте', p.primaryForeground, p.primary, 4.5],
    ['Текст во всплывающих', p.foreground, p.popover, 4.5]
  ];
  return checks.map(([label, f, b, min]) => ({ label, ratio: contrast(f, b), min })).filter((x) => x.ratio < x.min);
}

export const schemeOf = (hex: string): Scheme => (isLight(hex) ? 'light' : 'dark');
export const hueOf = (hex: string) => toOklch(hex).h;
