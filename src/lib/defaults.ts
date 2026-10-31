// Настройки по умолчанию и слияние частичных пресетов с полным конфигом.
//
// defaultConfig() - тема "как в Koala Clash": палитра и всё оформление совпадают со стандартными
// стилями клиента, поэтому из неё получается почти пустой CSS. Пользователь меняет то, что хочет.
// styledBase() - аккуратная основа для шаблонов конструктора (стекло, тени, анимации).

import { mix } from './color';
import type { Background, CardGradientPreset, DeepPartial, GradientStop, MeshBlob, Palette, Scheme, Surfaces, ThemeConfig } from './types';

/** Стандартная палитра клиента (assets/main.css: :root и .dark), переведённая из OKLCH в HEX */
export const APP_PALETTE: Record<Scheme, Palette> = {
  light: {
    background: '#ffffff', foreground: '#0a0a0a', card: '#fafafa', popover: '#ffffff',
    primary: '#171717', primaryForeground: '#fafafa', secondary: '#f5f5f5', mutedForeground: '#737373',
    accent: '#fafafa', border: '#e5e5e5', stroke: '#fafafa',
    destructive: '#e40016', success: '#00a447', warning: '#f69e00',
    powerOnStart: '#00ff77', powerOnEnd: '#00ca5e', powerOnStroke: '#b7ffe0',
    powerOffStart: '#ffd0c9', powerOffEnd: '#f6716a', powerOffStroke: '#f1b4af'
  },
  dark: {
    background: '#0a0a0a', foreground: '#fafafa', card: '#364e6e', popover: '#171717',
    primary: '#e5e5e5', primaryForeground: '#171717', secondary: '#262626', mutedForeground: '#a1a1a1',
    accent: '#3a516e', border: '#ffffff1a', stroke: '#4a6282',
    destructive: '#ff6568', success: '#008139', warning: '#f69e00',
    powerOnStart: '#00ff77', powerOnEnd: '#05bc5a', powerOnStroke: '#50d776',
    powerOffStart: '#f76c66', powerOffEnd: '#6d2b28', powerOffStroke: '#a85f5a'
  }
};

/** Цвет корневого контейнера, который клиент задаёт инлайн-стилем (App.tsx) */
export const APP_WRAPPER: Record<Scheme, string> = { light: '#c5d4f1', dark: '#080f16' };

export const isAppPalette = (p: Palette, scheme: Scheme) =>
  (Object.keys(APP_PALETTE[scheme]) as (keyof Palette)[]).every((k) => p[k].toLowerCase() === APP_PALETTE[scheme][k]);

export function makeBackground(over: Partial<Background> = {}): Background {
  return {
    kind: 'app',
    color: '#0b0f17',
    angle: 160,
    stops: [{ color: '#1b2735', pos: 0 }, { color: '#090a0f', pos: 100 }],
    radialShape: 'ellipse',
    radialX: 50,
    radialY: 100,
    blobs: [
      { color: '#3b82f6', x: 15, y: 20, size: 55 },
      { color: '#a855f7', x: 85, y: 25, size: 50 },
      { color: '#14b8a6', x: 50, y: 95, size: 60 }
    ],
    imageUrl: '',
    imageFit: 'cover',
    imageX: 50,
    imageY: 50,
    imageBlur: 0,
    imageDim: 30,
    imageOpacity: 100,
    blurPages: false,
    blurPagesAmount: 24,
    animation: 'none',
    animSpeed: 30,
    noise: 0,
    pattern: 'none',
    patternOpacity: 6,
    patternScale: 100,
    vignette: 0,
    ...over
  };
}

/** Форма градиента карточек - то, что ставит заготовка вместе с точками */
export type CardGradientShape = Pick<Surfaces, 'gradientKind' | 'gradientAngle' | 'gradientX' | 'gradientY'>;
const linear = (angle: number): CardGradientShape => ({ gradientKind: 'linear', gradientAngle: angle, gradientX: 50, gradientY: 0 });
const radial = (x: number, y: number): CardGradientShape => ({ gradientKind: 'radial', gradientAngle: 180, gradientX: x, gradientY: y });

/** Заготовки градиента карточек: точки цвета - из палитры схемы, поэтому меняются вместе с ней */
export const CARD_GRADIENTS: Record<CardGradientPreset, { label: string; shape: CardGradientShape; stops: (p: Palette) => GradientStop[] }> = {
  lighter: { label: 'Светлее сверху', shape: linear(180), stops: (p) => [{ color: mix(p.card, p.foreground, 0.12), pos: 0 }, { color: p.card, pos: 100 }] },
  deep: { label: 'Глубже книзу', shape: linear(180), stops: (p) => [{ color: p.card, pos: 0 }, { color: mix(p.card, p.background, 0.7), pos: 100 }] },
  accent: { label: 'Акцент', shape: linear(160), stops: (p) => [{ color: mix(p.card, p.primary, 0.45), pos: 0 }, { color: p.card, pos: 75 }] },
  corner: { label: 'Свет из угла', shape: radial(0, 0), stops: (p) => [{ color: mix(p.card, p.primary, 0.5), pos: 0 }, { color: p.card, pos: 60 }] },
  halo: { label: 'Ореол', shape: radial(50, 0), stops: (p) => [{ color: mix(p.card, p.powerOnStart, 0.45), pos: 0 }, { color: p.card, pos: 70 }] },
  power: { label: 'Цвета кнопки', shape: linear(135), stops: (p) => [{ color: mix(p.card, p.powerOnStart, 0.45), pos: 0 }, { color: mix(p.card, p.powerOnEnd, 0.28), pos: 100 }] },
  duo: { label: 'Два цвета', shape: linear(120), stops: (p) => [{ color: mix(p.card, p.primary, 0.38), pos: 0 }, { color: mix(p.card, p.powerOnEnd, 0.38), pos: 100 }] },
  aurora: { label: 'Сияние', shape: linear(120), stops: (p) => [{ color: mix(p.card, p.primary, 0.38), pos: 0 }, { color: p.card, pos: 50 }, { color: mix(p.card, p.powerOnStart, 0.38), pos: 100 }] }
};

/** Точки градиента карточек для схемы: у заготовки - от текущей палитры, иначе свои */
export const cardStops = (s: Surfaces, p: Palette, scheme: Scheme): GradientStop[] =>
  s.gradientPreset ? CARD_GRADIENTS[s.gradientPreset].stops(p) : s.gradientStops[scheme];

/** Включить заготовку градиента: её форма и точки, которые дальше следуют за палитрой */
export function applyCardGradient(s: Surfaces, id: CardGradientPreset) {
  Object.assign(s, CARD_GRADIENTS[id].shape, { gradient: true, gradientPreset: id });
}

/** Отвязать градиент от заготовки перед правкой точек: точки обеих схем фиксируются такими, какие они сейчас */
export function detachCardGradient(c: ThemeConfig) {
  const s = c.surfaces;
  if (!s.gradientPreset) return;
  s.gradientStops = { light: cardStops(s, c.palette.light, 'light'), dark: cardStops(s, c.palette.dark, 'dark') };
  s.gradientPreset = '';
}

/** Тема "как в Koala Clash" - стартовая точка конструктора */
export function defaultConfig(): ThemeConfig {
  return {
    version: 1,
    name: 'Моя тема',
    author: '',
    description: '',
    mode: 'both',
    palette: { light: { ...APP_PALETTE.light }, dark: { ...APP_PALETTE.dark } },
    background: {
      light: makeBackground({ color: APP_WRAPPER.light, stops: [{ color: '#f6f8fc', pos: 0 }, { color: '#dfe7f6', pos: 100 }] }),
      dark: makeBackground({ color: APP_WRAPPER.dark })
    },
    map: { show: true, opacity: 65, grayscale: 0, hue: 0, brightness: 100, tintPrimary: false, blurPages: true },
    surfaces: {
      custom: false, fill: 'glass', grain: 0, liquid: false, liquidStrength: 18, liquidEdge: 20, liquidSmooth: 'off', liquidRainbow: 0,
      liquidLight: false, liquidRim: 10, liquidReach: 30, liquidShine: 170, liquidRimAlways: false, liquidGlow: true,
      glassMemory: { glass: { opacity: -1, blur: -1, saturate: -1 }, liquid: { opacity: -1, blur: -1, saturate: -1 }, light: { opacity: -1, blur: -1, saturate: -1 } },
      opacity: 50, blur: 24, saturate: 100, borderWidth: 1, borderOpacity: 100, radius: 0.625,
      gradient: false, gradientKind: 'soft', gradientAngle: 180, gradientX: 50, gradientY: 0,
      gradientStops: { light: CARD_GRADIENTS.lighter.stops(APP_PALETTE.light), dark: CARD_GRADIENTS.lighter.stops(APP_PALETTE.dark) }, gradientPreset: '',
      highlight: false, highlightBottom: false, borderColor: 'auto', borderCustom: '#7c8cff', sidebar: 'app', navActive: 'app', navRadius: 12, navOpacity: 14, navColor: 'auto', navCustom: '#7c8cff',
      selected: 'app', selectedHover: 'none', selectedColor: 'auto', selectedCustom: '#7c8cff', hover: 'app', groupHover: 'app', hoverColor: 'auto', hoverCustom: '#7c8cff',
      profileSelected: 'app', profileSelectedHover: 'none', profileHover: 'app', profileSwitch: 'app', profileColor: 'auto', profileCustom: '#7c8cff',
      iconPlate: 'app', iconColor: 'auto', iconCustom: '#7c8cff', iconShape: 'app', iconPad: 5, iconHover: false, buttons: 'app', buttonsRadius: 14, buttonsOpacity: 72, buttonsColor: 'auto', buttonsCustom: '#7c8cff'
    },
    dividers: {
      h: { style: 'app', color: 'auto', custom: '#7c8cff', opacity: 100, size: 1, length: 100, effect: 'none' },
      v: { style: 'app', color: 'auto', custom: '#7c8cff', opacity: 100, size: 1, length: 100, effect: 'none' }
    },
    shadows: {
      preset: 'app', intensity: 100, color: 'auto', customColor: '#000000', angle: 90, distance: 100, blur: 100, spread: 0,
      hardOffset: 4, hover: 140, cards: true, popups: true, buttons: false, power: false
    },
    power: {
      style: 'app', size: 100, animate: true, speed: 1, sphereDot: 1.5,
      glow: 0, glowSize: 170, glowBlur: 24, glowColor: 'power', glowCustom: '#7c8cff', glowOff: false, glowPulse: false,
      shape: 'circle', corner: 34, stretch: 100, fill: 'app', fillOpacity: 50, fillAngle: 145, ringWidth: 2,
      ringColor: 'app', ringCustom: '#7c8cff', outerRing: 0, outerGap: 6, volume: 'none', drop: 0, glassShine: 100,
      toggleLook: 'classic', toggleIcon: true, toggleGlow: true, dayScene: 'clouds', dayOn: true,
      hover: 'app', idle: 'none', icon: 'app', iconCustom: '#ffffff', iconSize: 100
    },
    motion: {
      speed: 1, easing: 'app', entrance: 'none', stagger: 30, press: false, pressScale: 97, popups: 'app', reduce: true,
      click: 'none', clickColor: 'primary', clickCustom: '#7c8cff', clickDuration: 1200, clickSize: 14, clickOpacity: 45,
      clickProxies: true, clickGroups: false, clickProfiles: true, clickButtons: false, clickNav: false
    },
    fonts: {
      imports: [], ui: '', heading: '', mono: '', scale: 100, weight: 400, headingWeight: 600,
      letterSpacing: 0, tabular: false, uppercaseTitles: false, smoothing: false, flagFix: false,
      textShadow: 'none', textShadowTarget: 'titles', textShadowColor: 'auto', textShadowCustom: '#000000',
      textShadowBlur: 100, textShadowDistance: 100, textShadowAngle: 90, textShadowOpacity: 60
    },
    flags: {
      style: 'app', hideInline: true, size: 114, rotate: -50, x: -50, y: 15, opacity: 45,
      fade: true, blur: 0, dim: 0, side: 'right', selectedBoost: true, selectedNoBlur: false, grayscale: false
    },
    extras: { scrollbar: 'app', selection: false, tooltip: 'app', title: 'app', focusRing: false, statusColor: false, customCss: '' },
    fun: {
      ping: 'none', pingDotInPlace: false, pingDotSize: 6,pingHide: false, pingHideHover: false, reactive: false, reactiveStrength: 60, runningBorder: false, breathing: false,
      particles: 'none', particlesOver: false, particlesDensity: 100, particlesSpeed: 100, particlesOpacity: 70,
      particlesColor: 'auto', particlesCustom: '#ffffff'
    }
  };
}

/** Основа для шаблонов: стекло, мягкие тени, плавные анимации */
export function styledBase(): ThemeConfig {
  return deepMerge(defaultConfig(), {
    background: { light: { kind: 'palette' }, dark: { kind: 'palette' } },
    surfaces: { custom: true, opacity: 55, blur: 24, saturate: 140, radius: 0.75, highlight: true, sidebar: 'glass', selected: 'tint', selectedHover: 'brighten', hover: 'lift' },
    shadows: { preset: 'soft' },
    power: { style: 'glow', glow: 60 },
    motion: { easing: 'smooth', entrance: 'rise', press: true },
    fonts: { tabular: true, smoothing: true },
    extras: { scrollbar: 'thin', selection: true, focusRing: true }
  });
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Глубокое слияние: массивы и примитивы из patch заменяют значения base */
export function deepMerge<T>(base: T, patch: DeepPartial<T> | undefined): T {
  if (!patch) return base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(patch as Record<string, unknown>)) {
    if (v === undefined) continue;
    const cur = out[k];
    out[k] = isObj(cur) && isObj(v) ? deepMerge(cur, v as DeepPartial<typeof cur>) : v;
  }
  return out as T;
}

/**
 * Слияние загруженного конфига с образцом: только известные поля и только того же типа, что в
 * образце (числа - конечные). Повреждённый файл, старая или чужая ссылка «Поделиться» иначе роняли
 * генератор, а сохранённый в браузере конфиг ронял сайт и после перезагрузки
 */
function mergeTyped<T>(base: T, raw: unknown): T {
  if (!isObj(base) || !isObj(raw)) return base;
  const out: Record<string, unknown> = { ...base };
  for (const [k, cur] of Object.entries(base)) {
    const v = raw[k];
    if (v === undefined) continue;
    if (isObj(cur)) out[k] = mergeTyped(cur, v);
    else if (Array.isArray(cur)) { if (Array.isArray(v)) out[k] = v; }
    else if (typeof cur === 'number') { if (typeof v === 'number' && Number.isFinite(v)) out[k] = v; }
    else if (typeof v === typeof cur) out[k] = v;
  }
  return out as T;
}
const finite = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
const isStop = (x: unknown): x is GradientStop => isObj(x) && typeof x.color === 'string' && finite(x.pos);
const isBlob = (x: unknown): x is MeshBlob => isObj(x) && typeof x.color === 'string' && finite(x.x) && finite(x.y) && finite(x.size);

/** Приводит загруженный конфиг (из файла, ссылки, localStorage) к полной актуальной схеме */
export function sanitizeConfig(raw: unknown): ThemeConfig {
  const base = defaultConfig();
  if (!isObj(raw)) return base;
  const merged = mergeTyped(base, raw);
  merged.version = 1;
  merged.fonts.imports = merged.fonts.imports.filter((x) => typeof x === 'string');
  // Конфиги первой версии: поверхности всегда были свои
  if (isObj(raw.surfaces) && raw.surfaces.custom === undefined) merged.surfaces.custom = true;
  // Скругление углов раньше было постоянным: у квадрата 20%, у сквиркла 34%
  if (isObj(raw.power) && raw.power.corner === undefined && merged.power.shape === 'square') merged.power.corner = 20;
  for (const s of ['light', 'dark'] as const) {
    const bg = merged.background[s];
    bg.stops = bg.stops.filter(isStop);
    if (bg.stops.length < 2) bg.stops = makeBackground().stops;
    bg.blobs = bg.blobs.filter(isBlob);
    const gs = merged.surfaces.gradientStops;
    gs[s] = gs[s].filter(isStop);
    if (gs[s].length < 2) gs[s] = base.surfaces.gradientStops[s];
  }
  if (!Object.hasOwn(CARD_GRADIENTS, merged.surfaces.gradientPreset)) merged.surfaces.gradientPreset = '';
  if (!['off', 'soft', 'exact'].includes(merged.surfaces.liquidSmooth)) merged.surfaces.liquidSmooth = 'off';
  // Карточки «Контур» убраны: прозрачное стекло без размытия с рамкой выглядит так же
  const su = merged.surfaces;
  if ((su.fill as string) === 'outline') Object.assign(su, { fill: 'glass', liquid: false, opacity: 0, blur: 0, borderWidth: Math.max(1, su.borderWidth) });
  if (!['glass', 'solid', 'transparent'].includes(su.fill)) su.fill = 'glass';
  return merged;
}
