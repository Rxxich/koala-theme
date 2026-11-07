// «Случайная тема»: тема целиком из согласованных частей. Сначала выбирается характер (стекло,
// матовая, неон, мягкая, брутализм) - он решает, какие стили карточек, теней, кнопки подключения
// и анимаций сочетаются. Палитра - из генератора, фон - из её же цветов или фото в тон палитре.
// Шрифты, свой CSS и автор остаются от текущей темы: шрифты клиент берёт только системные.

import { deepMerge, makeBackground, styledBase } from './defaults';
import { generatePalettes, hueName, hueOf, type Harmony } from './palette';
import { mix } from './color';
import { PHOTOS, photoUrl } from '../data/gradients';
import type { Background, BgKind, BgPattern, DeepPartial, Palette, Scheme, ThemeConfig } from './types';

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const int = (a: number, b: number) => Math.round(rnd(a, b));
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const chance = (p: number) => Math.random() < p;

interface Mood {
  name: string;
  harmonies: Harmony[];
  vivid: [number, number];
  /** Вероятность фото на фоне вместо градиента из палитры */
  photo: number;
  kinds: BgKind[];
  patterns: BgPattern[];
  /** Вероятность узора поверх фона */
  pattern: number;
  patch: () => DeepPartial<ThemeConfig>;
}

const MOODS: Mood[] = [
  {
    name: 'Стекло', harmonies: ['analog', 'split', 'triad', 'complement'], vivid: [0.9, 1.2], photo: 0.4,
    kinds: ['mesh', 'mesh', 'radial', 'linear'], patterns: ['dots', 'topo', 'waves', 'stars'], pattern: 0.25,
    patch: () => ({
      surfaces: {
        fill: 'glass', opacity: int(40, 65), blur: int(18, 30), saturate: int(120, 180), radius: pick([0.75, 0.875, 1, 1.125]), highlight: chance(0.6),
        sidebar: 'glass', sidebarIcons: pick(['app', 'duo', 'solarDuo']), selected: pick(['tint', 'glow', 'gradient', 'power', 'aurora', 'shine']), selectedHover: 'brighten', hover: pick(['lift', 'glow']),
        navActive: pick(['fill', 'gradient', 'glow', 'capsule']), buttons: pick(['app', 'glossy', 'glow'])
      },
      shadows: { preset: pick(['soft', 'floating', 'ambient', 'layered']) },
      power: { style: pick(['glow', 'ring', 'glass', 'pulse', 'sphere', 'plasma', 'globe', 'orbit']), glow: int(50, 80) },
      motion: { easing: 'smooth', entrance: pick(['rise', 'blur', 'fade', 'scale']) }
    })
  },
  {
    name: 'Матовая', harmonies: ['analog', 'mono', 'neutral', 'split'], vivid: [0.8, 1.1], photo: 0.15,
    kinds: ['palette', 'linear', 'radial'], patterns: ['dots', 'grid', 'diagonal', 'hex', 'circles'], pattern: 0.35,
    patch: () => ({
      surfaces: {
        fill: 'solid', opacity: int(88, 100), blur: 0, radius: pick([0.5, 0.625, 0.75, 0.875]), highlight: chance(0.4),
        sidebar: pick(['solid', 'cards']), sidebarIcons: pick(['app', 'solarBroken', 'chunk']), selected: pick(['tint', 'bar', 'outline', 'inset', 'underline', 'corners']), selectedHover: 'none', hover: pick(['lift', 'border']),
        navActive: pick(['solid', 'bar', 'fill', 'dot', 'underline']), buttons: pick(['app', 'pill', 'pushable'])
      },
      shadows: { preset: pick(['soft', 'medium', 'layered']) },
      power: { style: pick(['minimal', 'ring', 'app', 'glow', 'toggle', 'equalizer']), glow: int(30, 60) },
      motion: { easing: pick(['smooth', 'snappy']), entrance: pick(['fade', 'rise', 'slide']) }
    })
  },
  {
    name: 'Неон', harmonies: ['complement', 'split', 'triad', 'tetrad'], vivid: [1.25, 1.45], photo: 0.25,
    kinds: ['mesh', 'radial'], patterns: ['grid', 'circuit', 'hex', 'lines'], pattern: 0.6,
    patch: () => ({
      mode: 'dark',
      surfaces: {
        fill: 'glass', opacity: int(35, 50), blur: int(16, 24), saturate: int(140, 200), radius: pick([0.5, 0.625, 0.75]), highlight: true,
        sidebar: 'glass', sidebarIcons: pick(['duo', 'solarBroken']), selected: pick(['glow', 'neon']), selectedHover: 'glow', hover: 'glow', navActive: pick(['glow', 'neon']), buttons: 'glow'
      },
      shadows: { preset: 'glow', intensity: int(100, 130) },
      power: { style: pick(['neon', 'pulse', 'ring', 'radar', 'portal', 'network']), glow: int(80, 95) },
      motion: { easing: 'snappy', entrance: pick(['slide', 'blur', 'fade']) },
      extras: { statusColor: true, title: 'gradient', scrollbar: 'accent' }
    })
  },
  {
    name: 'Мягкая', harmonies: ['analog', 'mono', 'triad'], vivid: [0.6, 0.85], photo: 0.3,
    kinds: ['mesh', 'mesh', 'linear'], patterns: ['dots', 'circles', 'waves'], pattern: 0.2,
    patch: () => ({
      surfaces: {
        fill: 'glass', opacity: int(62, 80), blur: int(16, 24), saturate: int(110, 140), radius: pick([1.125, 1.25, 1.5]), highlight: true,
        sidebar: pick(['glass', 'cards']), sidebarIcons: pick(['solarDuo', 'duo']), selected: pick(['tint', 'gradient', 'power']), selectedHover: 'brighten', hover: 'scale', navActive: pick(['capsule', 'fill']), buttons: 'pill'
      },
      shadows: { preset: pick(['soft', 'ambient']) },
      power: { style: pick(['pulse', 'glass', 'liquid', 'daynight', 'glow', 'heartbeat']), glow: int(55, 75) },
      motion: { easing: pick(['bounce', 'spring']), entrance: 'scale' }
    })
  },
  {
    name: 'Брутализм', harmonies: ['neutral', 'mono', 'complement'], vivid: [1, 1.3], photo: 0,
    kinds: ['solid'], patterns: ['grid', 'dots', 'zigzag', 'plaid', 'isometric'], pattern: 0.7,
    patch: () => ({
      surfaces: {
        fill: 'solid', opacity: 100, blur: 0, borderWidth: 2, radius: pick([0, 0.25, 0.375]), highlight: false,
        sidebar: 'solid', sidebarIcons: 'chunk', selected: pick(['outline', 'brutal']), selectedHover: 'none', hover: 'lift', navActive: 'solid', buttons: 'brutal'
      },
      shadows: { preset: pick(['hard', 'retro']), hardOffset: int(3, 6), buttons: true },
      power: { style: pick(['minimal', 'toggle', 'equalizer']) },
      motion: { easing: 'snappy', entrance: 'none', press: true },
      extras: { scrollbar: 'thin' }
    })
  }
];

/** Фон схемы из цветов её же палитры: так он гарантированно сочетается с карточками */
function paletteBackground(p: Palette, scheme: Scheme, mood: Mood): Background {
  const dark = scheme === 'dark';
  const base = p.background;
  const k = dark ? rnd(0.28, 0.45) : rnd(0.3, 0.5);
  const kind = pick(mood.kinds);
  const bg: Partial<Background> = { kind, color: base };
  if (kind === 'mesh') {
    const corners: [number, number][] = [[0, 0], [100, 0], [0, 100], [100, 100], [50, 0], [50, 100]];
    const spots = [...corners].sort(() => Math.random() - 0.5).slice(0, 3);
    bg.blobs = [p.primary, p.powerOnStart, p.powerOnEnd].map((c, i) => ({ color: mix(base, c, k * (i ? 0.85 : 1)), x: spots[i][0], y: spots[i][1], size: int(45, 70) }));
  } else if (kind === 'radial') {
    Object.assign(bg, { radialShape: 'ellipse', radialX: int(15, 85), radialY: pick([0, 0, 100, 50]), stops: [{ color: mix(base, p.primary, k), pos: 0 }, { color: base, pos: 100 }] });
  } else if (kind === 'linear') {
    bg.angle = pick([135, 160, 180, 200, 225]);
    bg.stops = [{ color: mix(base, p.powerOnStart, k * 0.8), pos: 0 }, { color: base, pos: 50 }, { color: mix(base, p.powerOnEnd, k * 0.7), pos: 100 }];
  }
  if (kind === 'mesh' || kind === 'linear' || kind === 'radial') bg.noise = int(0, 4);
  if (dark && kind !== 'solid') bg.vignette = pick([0, 20, 35]);
  if (chance(mood.pattern)) Object.assign(bg, { pattern: pick(mood.patterns), patternOpacity: dark ? int(5, 8) : int(6, 10) });
  return makeBackground(bg);
}

export function randomTheme(current: ThemeConfig): ThemeConfig {
  const mood = pick(MOODS);
  // Фото выбираем до палитры: оттенок акцента берём из тона тёмного снимка
  const photos = chance(mood.photo) ? { dark: pick(PHOTOS.filter((x) => x.scheme === 'dark')), light: pick(PHOTOS.filter((x) => x.scheme === 'light')) } : null;
  const gen = generatePalettes({ hue: photos ? hueOf(photos.dark.tone) : undefined, harmony: pick(mood.harmonies), vivid: rnd(...mood.vivid) });

  const cfg = deepMerge(styledBase(), {
    ...mood.patch(),
    name: `${hueName(gen.hue)} - ${mood.name.toLowerCase()}`,
    author: current.author,
    palette: { light: gen.light, dark: gen.dark },
    map: { show: !photos && mood.name !== 'Брутализм' && chance(0.35), opacity: int(25, 45), tintPrimary: true },
    flags: pick<DeepPartial<ThemeConfig['flags']>>([{ style: 'app' }, { style: 'round', size: 22 }, { style: 'badge', size: 20 }])
  } as DeepPartial<ThemeConfig>);

  for (const scheme of ['light', 'dark'] as const) {
    const ph = photos?.[scheme];
    cfg.background[scheme] = ph
      ? makeBackground({ kind: 'image', imageUrl: photoUrl(ph.id), color: ph.tone, imageDim: scheme === 'dark' ? int(25, 40) : int(10, 20), blurPages: true })
      : paletteBackground(cfg.palette[scheme], scheme, mood);
  }
  cfg.fonts = structuredClone(current.fonts);
  cfg.extras.customCss = current.extras.customCss;
  cfg.extras.noProfileEdit = current.extras.noProfileEdit;
  return cfg;
}
