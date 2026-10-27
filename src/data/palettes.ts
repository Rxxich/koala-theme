// Готовые палитры. Каждая - пара (светлая + тёмная), чтобы тема выглядела цельно в обоих режимах.

import { derivePalette } from '../lib/palette';
import { APP_PALETTE } from '../lib/defaults';
import { mix } from '../lib/color';
import { gradientById } from './gradients';
import type { Background, Palette, Scheme } from '../lib/types';

export interface PalettePreset {
  id: string;
  name: string;
  light: Palette;
  dark: Palette;
}

const pair = (id: string, name: string, light: Parameters<typeof derivePalette>[1], dark: Parameters<typeof derivePalette>[1]): PalettePreset => ({
  id, name, light: derivePalette('light', light), dark: derivePalette('dark', dark)
});

/** Палитра темы Koala Sage & Night (custom.css) - значения перенесены один в один */
const sage: Palette = {
  background: '#ebf2ee', foreground: '#13221a', card: '#fbfefc', popover: '#ffffff',
  primary: '#177c52', primaryForeground: '#ffffff', secondary: '#eef4f1', mutedForeground: '#57685e',
  accent: '#def1e5', border: '#dce5e0', stroke: '#c4d2ca',
  destructive: '#d2384a', success: '#2d8949', warning: '#b8892d',
  powerOnStart: '#85e0be', powerOnEnd: '#177c52', powerOnStroke: '#177c52',
  powerOffStart: '#b3beb7', powerOffEnd: '#7f8d85', powerOffStroke: '#a9b4ae'
};
const night: Palette = {
  background: '#090a0f', foreground: '#e6ebf2', card: '#131a24', popover: '#151d28',
  primary: '#8ab8ee', primaryForeground: '#090a0f', secondary: '#1a2230', mutedForeground: '#8f9bab',
  accent: '#1c2838', border: '#1f2733', stroke: '#2e3949',
  destructive: '#ec7f9c', success: '#3dbb83', warning: '#e8b26a',
  powerOnStart: '#dbe8ff', powerOnEnd: '#6f9fdc', powerOnStroke: '#8ab8ee',
  powerOffStart: '#5d6878', powerOffEnd: '#3c4552', powerOffStroke: '#4c5868'
};

export const PALETTES: PalettePreset[] = [
  { id: 'app', name: 'Koala Clash', light: { ...APP_PALETTE.light }, dark: { ...APP_PALETTE.dark } },
  pair('koala', 'Koala+',{ background: '#eef2f8', primary: '#3b5bdb', powerOnStart: '#7ee0b5', powerOnEnd: '#1f9d6b', powerOffStart: '#f3b1aa', powerOffEnd: '#e0645a' },
    { background: '#0a0e15', primary: '#8ab4ff', powerOnStart: '#7ef0c4', powerOnEnd: '#22b37d', powerOffStart: '#f2a69d', powerOffEnd: '#d9574c' }),
  pair('ocean', 'Океан', { background: '#ecf5fa', foreground: '#0b2233', primary: '#0077b6', powerOnStart: '#7fdcf0', powerOnEnd: '#0077b6' },
    { background: '#04111d', foreground: '#dcecf7', primary: '#4cc9f0', powerOnStart: '#90f1ff', powerOnEnd: '#0096c7' }),
  pair('sunset', 'Закат', { background: '#fff4ec', foreground: '#2b160c', primary: '#d9480f', powerOnStart: '#ffc078', powerOnEnd: '#f03e3e' },
    { background: '#170d10', foreground: '#f8e9e1', primary: '#ff8c42', powerOnStart: '#ffd166', powerOnEnd: '#ff5e62' }),
  pair('sakura', 'Сакура', { background: '#fdf1f5', foreground: '#2e1520', primary: '#c2255c', powerOnStart: '#ffc2d9', powerOnEnd: '#e64980' },
    { background: '#170e14', foreground: '#f7e6ee', primary: '#f48fb1', powerOnStart: '#ffd1e3', powerOnEnd: '#e75480' }),
  pair('lavender', 'Лаванда', { background: '#f4f2fe', foreground: '#1d1834', primary: '#6741d9', powerOnStart: '#c4b5fd', powerOnEnd: '#7048e8' },
    { background: '#0f0d1a', foreground: '#ebe7fb', primary: '#a78bfa', powerOnStart: '#d0bfff', powerOnEnd: '#7c3aed' }),
  pair('forest', 'Лес', { background: '#eff4ec', foreground: '#132013', primary: '#2f6b3a', powerOnStart: '#a9e5a0', powerOnEnd: '#2f9e44' },
    { background: '#0a110c', foreground: '#e1ecdf', primary: '#7fcf8c', powerOnStart: '#b2f2bb', powerOnEnd: '#2f9e44' }),
  pair('nord', 'Nord', { background: '#eceff4', foreground: '#2e3440', primary: '#5e81ac', powerOnStart: '#8fbcbb', powerOnEnd: '#5e81ac', powerOffStart: '#d08770', powerOffEnd: '#bf616a' },
    { background: '#242933', foreground: '#eceff4', card: '#2e3440', popover: '#3b4252', primary: '#88c0d0', powerOnStart: '#8fbcbb', powerOnEnd: '#5e81ac', powerOffStart: '#d08770', powerOffEnd: '#bf616a' }),
  pair('mono', 'Монохром', { background: '#f4f4f5', foreground: '#18181b', card: '#ffffff', primary: '#18181b', powerOnStart: '#d4d4d8', powerOnEnd: '#27272a' },
    { background: '#09090b', foreground: '#fafafa', card: '#131316', primary: '#fafafa', powerOnStart: '#fafafa', powerOnEnd: '#71717a' }),
  pair('neon', 'Неон', { background: '#f6f3ff', foreground: '#1a1033', primary: '#c000a8', powerOnStart: '#00d4ff', powerOnEnd: '#c000a8' },
    { background: '#07060d', foreground: '#f2ecff', card: '#110f1d', primary: '#ff2bd6', powerOnStart: '#00f0ff', powerOnEnd: '#ff2bd6', powerOffStart: '#3a3550', powerOffEnd: '#221f30' }),
  pair('coffee', 'Кофе', { background: '#f6f0e8', foreground: '#2a1d14', card: '#fdfaf6', primary: '#7b4a2a', powerOnStart: '#e9c46a', powerOnEnd: '#a0522d' },
    { background: '#14100c', foreground: '#efe4d8', primary: '#d4a373', powerOnStart: '#f4d58d', powerOnEnd: '#bc6c25' }),
  pair('lime', 'Графит и лайм', { background: '#f2f5ee', foreground: '#161a12', primary: '#4d7c0f', powerOnStart: '#d9f99d', powerOnEnd: '#65a30d' },
    { background: '#0c0e0d', foreground: '#ecefe8', card: '#141716', primary: '#c6f432', primaryForeground: '#0c0e0d', powerOnStart: '#e4ff7a', powerOnEnd: '#7cb518' }),
  pair('aurora', 'Сияние', { background: '#edf9f6', foreground: '#0f2420', primary: '#0f9f83', powerOnStart: '#6ee7cf', powerOnEnd: '#7048e8' },
    { background: '#04050b', foreground: '#e6eaf3', card: '#11141f', primary: '#6ee7cf', powerOnStart: '#2df5b0', powerOnEnd: '#7d5cff' }),
  pair('gold', 'Золото', { background: '#faf7f0', foreground: '#231c0f', primary: '#9a6b00', powerOnStart: '#ffe08a', powerOnEnd: '#c08a00' },
    { background: '#0e0c08', foreground: '#f3ead6', card: '#18150f', primary: '#e8c26a', primaryForeground: '#0e0c08', powerOnStart: '#ffe9a8', powerOnEnd: '#c9952c' }),
  pair('mocha', 'Мокко', { background: '#eff1f5', foreground: '#4c4f69', card: '#ffffff', primary: '#8839ef', powerOnStart: '#94e2d5', powerOnEnd: '#40a02b', powerOffStart: '#f5c2e7', powerOffEnd: '#d20f39' },
    { background: '#1e1e2e', foreground: '#cdd6f4', card: '#252536', popover: '#2b2b3d', primary: '#cba6f7', powerOnStart: '#94e2d5', powerOnEnd: '#a6e3a1', powerOffStart: '#f5c2e7', powerOffEnd: '#f38ba8' }),
  pair('vampire', 'Вампир', { background: '#f8f8f2', foreground: '#282a36', primary: '#7c3aed', powerOnStart: '#8be9fd', powerOnEnd: '#50fa7b' },
    { background: '#1d1e26', foreground: '#f8f8f2', card: '#282a36', popover: '#30323f', primary: '#bd93f9', powerOnStart: '#8be9fd', powerOnEnd: '#50fa7b', powerOffStart: '#ffb86c', powerOffEnd: '#ff5555' }),
  pair('retro', 'Ретро', { background: '#fbf1c7', foreground: '#3c3836', card: '#fdf6d8', primary: '#af3a03', powerOnStart: '#b8bb26', powerOnEnd: '#79740e', powerOffStart: '#fe8019', powerOffEnd: '#cc241d' },
    { background: '#1d2021', foreground: '#ebdbb2', card: '#282828', popover: '#32302f', primary: '#fabd2f', primaryForeground: '#1d2021', powerOnStart: '#b8bb26', powerOnEnd: '#98971a', powerOffStart: '#fe8019', powerOffEnd: '#cc241d' }),
  pair('tokyo-night', 'Ночной Токио', { background: '#e6e7ed', foreground: '#343b59', primary: '#34548a', powerOnStart: '#7dcfff', powerOnEnd: '#2e7de9' },
    { background: '#16161e', foreground: '#c0caf5', card: '#1f2030', popover: '#24283b', primary: '#7aa2f7', powerOnStart: '#7dcfff', powerOnEnd: '#bb9af7', powerOffStart: '#ff9e64', powerOffEnd: '#f7768e' }),
  pair('rose-gold', 'Розовое золото', { background: '#fbf3f0', foreground: '#2f1f1c', card: '#fffaf8', primary: '#b4636b', powerOnStart: '#f6c9a8', powerOnEnd: '#c97b84' },
    { background: '#161012', foreground: '#f4e6e2', card: '#211a1c', primary: '#e8a598', primaryForeground: '#161012', powerOnStart: '#f7d1b5', powerOnEnd: '#c97b84' }),
  pair('matcha', 'Матча', { background: '#f3f4ec', foreground: '#1f2418', card: '#fbfcf6', primary: '#5b7b2e', powerOnStart: '#cfe3a1', powerOnEnd: '#6d8f3a' },
    { background: '#11140e', foreground: '#e3e8d8', card: '#1a1e15', primary: '#a9c97a', primaryForeground: '#11140e', powerOnStart: '#d4ecaa', powerOnEnd: '#6d8f3a' }),
  pair('terracotta', 'Терракота', { background: '#f8efe8', foreground: '#2d1c14', card: '#fdf7f2', primary: '#b4532a', powerOnStart: '#f2b880', powerOnEnd: '#c2410c' },
    { background: '#150e0b', foreground: '#f2e3d8', card: '#211713', primary: '#e98a5c', primaryForeground: '#150e0b', powerOnStart: '#fbc596', powerOnEnd: '#c2410c' }),
  pair('glacier', 'Ледник', { background: '#eef5f9', foreground: '#11283a', card: '#fbfdff', primary: '#2b6cb0', powerOnStart: '#b8e6f5', powerOnEnd: '#3b8fd1' },
    { background: '#071017', foreground: '#dcebf5', card: '#0f1b25', primary: '#8fd3f4', primaryForeground: '#071017', powerOnStart: '#c9f1ff', powerOnEnd: '#4aa3df' }),
  pair('cherry', 'Вишня', { background: '#fbf0f2', foreground: '#2b1218', primary: '#b3123f', powerOnStart: '#ffb3c6', powerOnEnd: '#d6244f' },
    { background: '#14090c', foreground: '#f6e4e8', card: '#211116', primary: '#ff6b8b', powerOnStart: '#ffc2d1', powerOnEnd: '#e11d48' }),
  pair('indigo', 'Индиго', { background: '#f1f2fb', foreground: '#161a3a', primary: '#3f3fbf', powerOnStart: '#a5b4fc', powerOnEnd: '#4f46e5' },
    { background: '#0a0b1a', foreground: '#e2e4fb', card: '#13152b', primary: '#8c9bff', powerOnStart: '#c7d2fe', powerOnEnd: '#6366f1' }),
  pair('tropic', 'Тропики', { background: '#effaf6', foreground: '#0f2a24', primary: '#0f8a73', powerOnStart: '#ffd166', powerOnEnd: '#06d6a0', powerOffStart: '#ffb3a7', powerOffEnd: '#ef476f' },
    { background: '#06130f', foreground: '#dff5ee', card: '#0e1f1a', primary: '#2ee6b5', primaryForeground: '#06130f', powerOnStart: '#ffd166', powerOnEnd: '#06d6a0', powerOffStart: '#ff8fa3', powerOffEnd: '#ef476f' }),
  pair('cyber-yellow', 'Кибер-жёлтый', { background: '#f7f6ee', foreground: '#141414', card: '#ffffff', primary: '#141414', powerOnStart: '#fff200', powerOnEnd: '#ffb800' },
    { background: '#0b0b0b', foreground: '#f2f2f2', card: '#151515', popover: '#1c1c1c', primary: '#fcee0a', primaryForeground: '#0b0b0b', powerOnStart: '#fcee0a', powerOnEnd: '#00f0ff', powerOffStart: '#3a3a3a', powerOffEnd: '#ff003c' }),
  pair('lilac', 'Сирень', { background: '#f8f4fb', foreground: '#2a1e33', primary: '#8e4fc2', powerOnStart: '#e5c8f5', powerOnEnd: '#a35fd6' },
    { background: '#120d17', foreground: '#efe4f6', card: '#1c1523', primary: '#d2a8f0', primaryForeground: '#120d17', powerOnStart: '#ecd5fa', powerOnEnd: '#a35fd6' }),
  pair('ocean-deep', 'Глубина', { background: '#edf3f7', foreground: '#0c1f2c', primary: '#00668a', powerOnStart: '#00c2c7', powerOnEnd: '#005f8f' },
    { background: '#020b12', foreground: '#d3e6ef', card: '#08161f', popover: '#0c1e29', primary: '#36d6e7', primaryForeground: '#020b12', powerOnStart: '#5ff5f0', powerOnEnd: '#0083b8' }),
  pair('sand', 'Песок', { background: '#f7f2e9', foreground: '#2b2418', card: '#fdfaf4', primary: '#8a6a2e', powerOnStart: '#e9d29a', powerOnEnd: '#b08944' },
    { background: '#12100b', foreground: '#efe6d3', card: '#1c1912', primary: '#d9bf86', primaryForeground: '#12100b', powerOnStart: '#efdcae', powerOnEnd: '#b08944' }),
  pair('burgundy', 'Бургунди', { background: '#f7f0f0', foreground: '#2a1416', primary: '#8c1c2c', powerOnStart: '#e8a0a8', powerOnEnd: '#9f2337' },
    { background: '#110709', foreground: '#f2e2e4', card: '#1d0f12', primary: '#e36a7d', powerOnStart: '#f4b6bf', powerOnEnd: '#a82a40' }),
  pair('slate', 'Сланец', { background: '#f1f3f5', foreground: '#1a1f26', card: '#ffffff', primary: '#475569', powerOnStart: '#94a3b8', powerOnEnd: '#334155' },
    { background: '#0c0f13', foreground: '#e3e7ec', card: '#151a20', primary: '#a7b4c6', primaryForeground: '#0c0f13', powerOnStart: '#cbd5e1', powerOnEnd: '#64748b' }),
  pair('peach', 'Персик', { background: '#fff6f0', foreground: '#2c1a12', card: '#fffbf8', primary: '#d26a3b', powerOnStart: '#ffd3b0', powerOnEnd: '#f08a5d' },
    { background: '#140d0a', foreground: '#f6e7de', card: '#20160f', primary: '#ffad7f', primaryForeground: '#140d0a', powerOnStart: '#ffdcc2', powerOnEnd: '#f08a5d' }),
  pair('emerald-night', 'Изумрудная ночь', { background: '#eef6f2', foreground: '#0f241b', primary: '#047857', powerOnStart: '#6ee7b7', powerOnEnd: '#059669' },
    { background: '#03100b', foreground: '#d8f0e5', card: '#0a1d15', primary: '#34d399', primaryForeground: '#03100b', powerOnStart: '#a7f3d0', powerOnEnd: '#10b981', powerOffStart: '#3d5a4e', powerOffEnd: '#1d2e27' }),
  { id: 'sage-night', name: 'Шалфей и ночь', light: sage, dark: night }
];

export const paletteById = (id: string) => PALETTES.find((p) => p.id === id);

/** Фоны к палитрам: перетекающие градиенты из шаблонов фона, подобранные к цветам палитры */
const COMPANION: Record<string, Record<Scheme, string>> = {
  sakura: { dark: 'sakura-night', light: 'sakura-day' },
  lavender: { dark: 'lavender-silk', light: 'lavender-flow' },
  ocean: { dark: 'ocean-surf', light: 'sea-breeze' },
  sunset: { dark: 'sunset-evening', light: 'apricot-dawn' },
  aurora: { dark: 'aurora-polar', light: 'mint-flow' },
  neon: { dark: 'neon-prism', light: 'neon-rings' },
  forest: { dark: 'forest-mist', light: 'bamboo-morning' },
  indigo: { dark: 'indigo-glass', light: 'indigo-mist' },
  gold: { dark: 'gold-glint', light: 'gold-morning' },
  'tokyo-night': { dark: 'city-night', light: 'lilac-stripes' }
};

/**
 * Фон к палитре: свой перетекающий градиент, а у палитр без него - такой же из её цветов. Пятна -
 * акцент и цвета кнопки подключения, разбавленные цветом фона, чтобы текст на них читался
 */
export function paletteBackground(pp: PalettePreset, scheme: Scheme): Partial<Background> {
  const own = COMPANION[pp.id] && gradientById(COMPANION[pp.id][scheme]);
  if (own) return own.bg;
  const p = pp[scheme];
  const k = scheme === 'dark' ? 0.55 : 0.5;
  return {
    kind: 'mesh', color: p.background, animation: 'flow', animSpeed: 28, noise: 4, blobs: [
      { color: mix(p.primary, p.background, k), x: 12, y: 8, size: 60 },
      { color: mix(p.powerOnStart, p.background, k), x: 88, y: 22, size: 50 },
      { color: mix(p.powerOnEnd, p.background, k), x: 55, y: 100, size: 65 }
    ]
  };
}

/** Полоска цветов для превью палитры */
export function swatchStrip(p: Palette): string[] {
  return [p.background, p.card, p.primary, p.powerOnStart, p.powerOnEnd];
}

export type { Scheme };
