// Готовые темы конструктора. Каждая собирается из настроек по умолчанию + изменений,
// поэтому её можно открыть, поменять что угодно и сохранить как свою.

import { deepMerge, makeBackground, styledBase } from '../lib/defaults';
import { derivePalette } from '../lib/palette';
import type { DeepPartial, Palette, ThemeConfig } from '../lib/types';
import { GRADIENTS, photoUrl } from './gradients';
import { paletteById } from './palettes';
import { googleFontUrl } from '../lib/fonts';

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  tags: string[];
  build: () => ThemeConfig;
}

const grad = (id: string) => GRADIENTS.find((g) => g.id === id)!.bg;
const pal = (id: string) => paletteById(id)!;

function make(name: string, description: string, paletteId: string | { light: Palette; dark: Palette }, patch: DeepPartial<ThemeConfig>): ThemeConfig {
  const base = styledBase();
  const p = typeof paletteId === 'string' ? pal(paletteId) : paletteId;
  const cfg = deepMerge(base, { name, description, palette: { light: p.light, dark: p.dark }, ...patch } as DeepPartial<ThemeConfig>);
  cfg.background.light = makeBackground(cfg.background.light);
  cfg.background.dark = makeBackground(cfg.background.dark);
  return cfg;
}

const pixelPalette = {
  light: derivePalette('light', { background: '#9bbc0f', foreground: '#0f380f', card: '#8bac0f', popover: '#9bbc0f', primary: '#0f380f', primaryForeground: '#9bbc0f', powerOnStart: '#306230', powerOnEnd: '#0f380f', powerOffStart: '#8bac0f', powerOffEnd: '#306230', stroke: '#306230', border: '#306230', mutedForeground: '#306230', accent: '#8bac0f' }),
  dark: derivePalette('dark', { background: '#0b0e24', foreground: '#fff1e8', card: '#1d2b53', popover: '#1d2b53', primary: '#ffec27', primaryForeground: '#0b0e24', powerOnStart: '#00e436', powerOnEnd: '#29adff', powerOffStart: '#83769c', powerOffEnd: '#5f574f', stroke: '#5f574f', border: '#3b3f63', mutedForeground: '#c2c3c7', accent: '#2a3a6b' })
};
const graphitePalette = {
  light: derivePalette('light', { background: '#f4f4f6', foreground: '#18181b', card: '#ffffff', primary: '#4f5bd5', powerOnStart: '#a5b4fc', powerOnEnd: '#5b6ef0' }),
  dark: derivePalette('dark', { background: '#09090b', foreground: '#ededef', card: '#111114', popover: '#18181b', primary: '#8b9cff', powerOnStart: '#8b9cff', powerOnEnd: '#6577f3', stroke: '#26262b', border: '#1c1c20' })
};

export const PRESETS: ThemePreset[] = [
  {
    id: 'aurora-glass', name: 'Aurora Glass', tags: ['тёмная', 'стекло', 'анимация'],
    description: 'Северное сияние медленно дрейфует под матовым стеклом, кнопка в вращающемся кольце',
    build: () => make('Aurora Glass', 'Северное сияние под матовым стеклом', 'aurora', {
      mode: 'dark',
      background: { dark: { ...grad('aurora'), animation: 'pan', animSpeed: 40, noise: 4, vignette: 30 } },
      map: { show: false },
      surfaces: { opacity: 35, blur: 30, saturate: 180, highlight: true, radius: 1, selected: 'glow', hover: 'glow', navActive: 'gradient' },
      shadows: { preset: 'glow', intensity: 70 },
      power: { style: 'ring', glow: 70 },
      flags: { style: 'watermark', size: 150, rotate: 0, x: -14, opacity: 22, blur: 2, fade: true, hideInline: true },
      motion: { entrance: 'blur', popups: 'spring' },
      extras: { tooltip: 'glass', title: 'gradient', scrollbar: 'accent' }
    })
  },
  {
    id: 'ocean-breeze', name: 'Ocean Breeze', tags: ['светлая и тёмная', 'Google Fonts', 'карта'],
    description: 'Морская свежесть: волны на фоне, карта мира в цвет акцента, шрифт Manrope из Google Fonts',
    build: () => make('Ocean Breeze', 'Морская свежесть и шрифт Manrope', 'ocean', {
      background: {
        light: { ...grad('dawn'), pattern: 'waves', patternOpacity: 10 },
        dark: { ...grad('abyss'), pattern: 'waves', patternOpacity: 6 }
      },
      map: { show: true, opacity: 30, tintPrimary: true },
      surfaces: { opacity: 60, blur: 22, radius: 0.9, selected: 'power', hover: 'lift' },
      power: { style: 'glow', glow: 80 },
      flags: { style: 'corner', size: 80, rotate: 0, x: -14, y: 50, opacity: 30, fade: true, hideInline: true },
      fonts: { imports: [googleFontUrl('Manrope', '400;500;600;700;800')], ui: 'Manrope', heading: 'Manrope', headingWeight: 700 }
    })
  },
  {
    id: 'sakura', name: 'Сакура', tags: ['мягкая', 'капсулы', 'Comfortaa'],
    description: 'Розовая пастель днём и сливовая ночь, круглые флаги, кнопки-капсулы и пульсирующая кнопка',
    build: () => make('Сакура', 'Розовая пастель и сливовая ночь', 'sakura', {
      background: {
        light: { ...grad('candy'), color: '#fdf1f5', blobs: [{ color: '#fbcfe8', x: 10, y: 10, size: 60 }, { color: '#fecdd3', x: 90, y: 30, size: 50 }, { color: '#e9d5ff', x: 50, y: 100, size: 65 }] },
        dark: { kind: 'mesh', color: '#170e14', blobs: [{ color: '#831843', x: 0, y: 0, size: 55 }, { color: '#581c87', x: 100, y: 100, size: 60 }, { color: '#9d174d', x: 90, y: 10, size: 35 }], noise: 4 }
      },
      map: { show: false },
      surfaces: { opacity: 70, blur: 20, radius: 1.25, selected: 'tint', hover: 'scale', buttons: 'pill', navActive: 'fill' },
      power: { style: 'pulse', glow: 70 },
      flags: { style: 'round', size: 22 },
      fonts: { imports: [googleFontUrl('Comfortaa', '400;500;600;700')], ui: 'Comfortaa', heading: 'Comfortaa', headingWeight: 700 },
      extras: { title: 'accent' },
      motion: { easing: 'bounce', entrance: 'scale' }
    })
  },
  {
    id: 'mono-brutal', name: 'Mono Brutal', tags: ['брутализм', 'жёсткие тени', 'Unbounded'],
    description: 'Монохромный брутализм: толстые рамки, жёсткие тени со смещением, острые углы и шрифт Unbounded',
    build: () => make('Mono Brutal', 'Монохромный брутализм', 'mono', {
      background: { light: { kind: 'solid', color: '#f4f4f5', pattern: 'grid', patternOpacity: 7 }, dark: { kind: 'solid', color: '#09090b', pattern: 'grid', patternOpacity: 6 } },
      map: { show: false },
      surfaces: { opacity: 100, blur: 0, borderWidth: 2, radius: 0.25, highlight: false, sidebar: 'solid', navActive: 'solid', selected: 'outline', hover: 'lift', buttons: 'app' },
      shadows: { preset: 'hard', hardOffset: 4, buttons: true },
      power: { style: 'minimal' },
      flags: { style: 'hide' },
      fonts: { imports: [googleFontUrl('Unbounded', '400;500;600;700'), googleFontUrl('JetBrains Mono', '400;500;600;700')], heading: 'Unbounded', mono: 'JetBrains Mono', uppercaseTitles: true, headingWeight: 700 },
      motion: { easing: 'snappy', entrance: 'none', press: true },
      extras: { scrollbar: 'thin' }
    })
  },
  {
    id: 'neon-tokyo', name: 'Neon Tokyo', tags: ['тёмная', 'неон', 'сетка'],
    description: 'Киберпанк: неоновая кнопка, светящиеся акценты, сетка и виньетка, шрифт Russo One',
    build: () => make('Neon Tokyo', 'Неоновый киберпанк', 'neon', {
      mode: 'dark',
      background: { dark: { ...grad('neon'), pattern: 'grid', patternOpacity: 7, vignette: 45, animation: 'hue', animSpeed: 60 } },
      map: { show: false },
      surfaces: { opacity: 45, blur: 18, radius: 0.5, selected: 'glow', hover: 'glow', navActive: 'glow', buttons: 'glow' },
      shadows: { preset: 'glow', intensity: 120 },
      power: { style: 'neon', glow: 90 },
      flags: { style: 'round', size: 22, grayscale: true },
      fonts: { imports: [googleFontUrl('Russo One', null)], heading: 'Russo One', headingWeight: 400, uppercaseTitles: true },
      extras: { scrollbar: 'accent', statusColor: true, title: 'gradient', tooltip: 'accent' },
      motion: { entrance: 'slide', easing: 'snappy' }
    })
  },
  {
    id: 'sunset-dune', name: 'Sunset Dune', tags: ['фото', 'стекло', 'тёплая'],
    description: 'Фото дюн днём и огненного заката вечером, стеклянная кнопка, значки-флаги и размытие фона на внутренних страницах',
    build: () => make('Sunset Dune', 'Тёплые дюны на закате', 'sunset', {
      background: {
        light: { kind: 'image', color: '#fff4ec', imageUrl: photoUrl('1542401886-65d6c61db217'), imageDim: 20, blurPages: true },
        dark: { kind: 'image', color: '#170d10', imageUrl: photoUrl('1501898047706-55903296cd09'), imageDim: 45, blurPages: true }
      },
      map: { show: false },
      surfaces: { opacity: 55, blur: 26, radius: 1, selected: 'gradient', hover: 'lift', buttons: 'glossy' },
      power: { style: 'glass', glow: 70 },
      flags: { style: 'badge', size: 20 },
      fonts: { imports: [googleFontUrl('Manrope', '400;500;600;700;800')], ui: 'Manrope', heading: 'Manrope', headingWeight: 800 },
      motion: { entrance: 'scale' }
    })
  },
  {
    id: 'forest-grain', name: 'Forest Grain', tags: ['зерно', 'засечки', 'спокойная'],
    description: 'Лесная тишина: плёночное зерно, мягкие пятна цвета и заголовки с засечками Lora',
    build: () => make('Forest Grain', 'Лес, зерно и засечки', 'forest', {
      background: {
        light: { kind: 'mesh', color: '#eff4ec', blobs: [{ color: '#d3e9c8', x: 0, y: 0, size: 60 }, { color: '#e8e1c8', x: 100, y: 100, size: 60 }, { color: '#cfe5d6', x: 90, y: 10, size: 40 }], noise: 14 },
        dark: { ...grad('forest-night'), noise: 14 }
      },
      map: { show: false },
      surfaces: { opacity: 75, blur: 14, radius: 0.85, selected: 'bar', hover: 'lift', gradient: true },
      shadows: { preset: 'medium', intensity: 80 },
      power: { style: 'glow', glow: 55 },
      flags: { style: 'corner', size: 96, rotate: -30, x: -36, y: 30, opacity: 35 },
      fonts: { imports: [googleFontUrl('Lora', '400;500;600;700')], heading: 'Lora', headingWeight: 600 }
    })
  },
  {
    id: 'nord-calm', name: 'Nord Calm', tags: ['минимализм', 'карта', 'без размытия'],
    description: 'Северная палитра Nord, плоские поверхности без размытия и приглушённая серая карта мира',
    build: () => make('Nord Calm', 'Северная палитра и тишина', 'nord', {
      background: { light: { kind: 'solid', color: '#e5e9f0' }, dark: { kind: 'solid', color: '#242933' } },
      map: { show: true, opacity: 22, grayscale: 100 },
      surfaces: { opacity: 100, blur: 0, radius: 0.5, highlight: false, selected: 'tint', hover: 'none', sidebar: 'solid', navActive: 'fill' },
      shadows: { preset: 'none' },
      power: { style: 'minimal', glow: 40 },
      motion: { entrance: 'fade', easing: 'smooth' }
    })
  },
  {
    id: 'lavender-dream', name: 'Lavender Dream', tags: ['сфера', 'призма', 'флаги слева'],
    description: 'Лавандовое небо днём и вращающаяся призма ночью, сфера из частиц и флаги с левой стороны',
    build: () => make('Lavender Dream', 'Лаванда и призма', 'lavender', {
      background: {
        light: { ...grad('lavender-sky'), noise: 4 },
        dark: { ...grad('prism'), animation: 'spin', animSpeed: 120, noise: 4 }
      },
      map: { show: false },
      surfaces: { opacity: 50, blur: 28, radius: 1.1, selected: 'gradient', hover: 'lift', navActive: 'gradient' },
      power: { style: 'sphere', size: 105, sphereDot: 1.6 },
      flags: { style: 'corner', side: 'left', size: 100, rotate: 40, x: -46, y: 20, opacity: 30, hideInline: true },
      extras: { title: 'gradient' },
      motion: { popups: 'spring' }
    })
  },
  {
    id: 'pixel', name: 'Pixel', tags: ['8-бит', 'Press Start 2P', 'звёзды'],
    description: 'Ретро-консоль: PICO-8 ночью, Game Boy днём, пиксельный шрифт, звёзды и строки развёртки',
    build: () => make('Pixel', 'Ретро-консоль', pixelPalette, {
      background: {
        light: { kind: 'solid', color: '#9bbc0f', pattern: 'lines', patternOpacity: 8 },
        dark: { kind: 'solid', color: '#0b0e24', pattern: 'stars', patternOpacity: 80 }
      },
      map: { show: false },
      surfaces: { opacity: 100, blur: 0, borderWidth: 2, radius: 0, highlight: false, selected: 'outline', hover: 'none', navActive: 'solid', sidebar: 'solid' },
      shadows: { preset: 'hard', hardOffset: 3 },
      power: { style: 'pulse' },
      flags: { style: 'badge', size: 18 },
      fonts: { imports: [googleFontUrl('Press Start 2P', null)], heading: 'Press Start 2P', headingWeight: 400, uppercaseTitles: false },
      motion: { easing: 'linear', entrance: 'none', speed: 0.6 },
      extras: { scrollbar: 'accent' }
    })
  },
  {
    id: 'graphite', name: 'Graphite', tags: ['тёмная', 'минимализм', 'барвинок'],
    description: 'Тёмный графит с барвинковым акцентом: тонкие линии, мягкие тени и никакого лишнего цвета',
    build: () => make('Graphite', 'Графит и барвинок', graphitePalette, {
      mode: 'dark',
      background: { dark: { ...grad('graphite'), noise: 3 } },
      map: { show: false },
      surfaces: { opacity: 85, blur: 10, radius: 0.75, highlight: true, selected: 'bar', hover: 'lift', navActive: 'bar', sidebar: 'solid' },
      shadows: { preset: 'medium', intensity: 90 },
      power: { style: 'ring', glow: 50 },
      flags: { style: 'app' },
      extras: { scrollbar: 'thin', statusColor: true }
    })
  },
  {
    id: 'rocket-launch', name: 'Rocket Launch', tags: ['ракета', 'космос', 'звёзды'],
    description: 'Кнопка-ракета: стоит на земле, при подключении взлетает с пламенем. Космический фон и летящие звёзды',
    build: () => make('Rocket Launch', 'Взлёт к стабильному соединению', 'tokyo-night', {
      mode: 'dark',
      background: { dark: { ...grad('cosmos'), noise: 4, vignette: 35 } },
      map: { show: false },
      surfaces: { opacity: 45, blur: 22, radius: 0.9, selected: 'glow', selectedHover: 'glow', navActive: 'gradient' },
      shadows: { preset: 'ambient', intensity: 90 },
      power: { style: 'rocket', size: 112, glow: 55, glowSize: 190, glowPulse: true, hover: 'lift' },
      motion: { click: 'wave', clickColor: 'power', entrance: 'rise' },
      fun: { particles: 'stars', particlesDensity: 120, particlesOpacity: 80, ping: 'dot' },
      extras: { title: 'gradient', statusColor: true }
    })
  },
  {
    id: 'winter', name: 'Зима', tags: ['снег', 'фото', 'жидкость'],
    description: 'Снегопад поверх интерфейса, заснеженные пики днём и северное сияние ночью, кнопка-жидкость',
    build: () => make('Зима', 'Снегопад и северное сияние', 'glacier', {
      background: {
        light: { kind: 'image', color: '#eef5f9', imageUrl: photoUrl('1454496522488-7a8e488e8606'), imageDim: 25, blurPages: true },
        dark: { kind: 'image', color: '#071017', imageUrl: photoUrl('1531366936337-7c912a4589a7'), imageDim: 35, blurPages: true }
      },
      map: { show: false },
      surfaces: { opacity: 50, blur: 28, saturate: 160, radius: 1.1, selected: 'tint', selectedHover: 'brighten' },
      shadows: { preset: 'floating', intensity: 70 },
      power: { style: 'liquid', glow: 50, glowOff: true, hover: 'scale' },
      motion: { click: 'ripple', clickOpacity: 30 },
      fun: { particles: 'snow', particlesOver: true, particlesOpacity: 85, runningBorder: true },
      fonts: { imports: [googleFontUrl('Nunito', '400;600;700;800')], ui: 'Nunito', heading: 'Nunito', headingWeight: 800 }
    })
  },
  {
    id: 'radar-ops', name: 'Radar Ops', tags: ['радар', 'терминал', 'моно'],
    description: 'Военный терминал: кнопка-радар с бегущим лучом, развёртка, моноширинный шрифт и подсветка серверов по пингу',
    build: () => make('Radar Ops', 'Командный пункт', 'emerald-night', {
      mode: 'dark',
      background: { dark: { kind: 'solid', color: '#020a07', pattern: 'lines', patternOpacity: 7, vignette: 55 } },
      map: { show: true, opacity: 18, tintPrimary: true },
      surfaces: { opacity: 70, blur: 6, radius: 0.3, borderWidth: 1, selected: 'outline', selectedHover: 'shift', navActive: 'bar', highlight: false },
      shadows: { preset: 'glow', intensity: 60 },
      power: { style: 'radar', size: 108, glow: 40 },
      motion: { click: 'border', clickColor: 'power', easing: 'snappy', entrance: 'fade' },
      fun: { ping: 'bar' },
      fonts: { imports: [googleFontUrl('JetBrains Mono', '400;500;600;700')], ui: 'JetBrains Mono', heading: 'JetBrains Mono', mono: 'JetBrains Mono', uppercaseTitles: true, textShadow: 'glow', textShadowOpacity: 45 },
      extras: { scrollbar: 'accent', statusColor: true }
    })
  },
  {
    id: 'pulse-pop', name: 'Pulse Pop', tags: ['эквалайзер', 'конфетти', 'яркая'],
    description: 'Яркая и игривая: кнопка-эквалайзер танцует при подключении, вспышки по клику и конфетти на фоне',
    build: () => make('Pulse Pop', 'Музыка соединения', 'neon', {
      background: {
        light: { ...grad('candy'), noise: 4 },
        dark: { ...grad('holo'), noise: 4, animation: 'pan', animSpeed: 30 }
      },
      map: { show: false },
      surfaces: { opacity: 60, blur: 24, radius: 1.2, selected: 'power', selectedHover: 'scale', hover: 'scale', buttons: 'power', navActive: 'glow' },
      shadows: { preset: 'gradient', intensity: 80 },
      power: { style: 'equalizer', glow: 70, glowPulse: true, shape: 'squircle', hover: 'tilt', idle: 'float' },
      motion: { click: 'shine', easing: 'bounce', entrance: 'scale' },
      fun: { particles: 'confetti', particlesDensity: 70, particlesOpacity: 60, breathing: true },
      fonts: { imports: [googleFontUrl('Unbounded', '400;500;600;700')], heading: 'Unbounded', headingWeight: 600 }
    })
  },
  {
    id: 'neo-brutal', name: 'Необрутализм', tags: ['брутализм', 'жёсткие тени', 'глобус'],
    description: 'Плоские сплошные карточки с толстой рамкой и жёсткой тенью, кнопки-клавиши, боковая панель как карточки и кнопка-глобус',
    build: () => make('Необрутализм', 'Толстые рамки и жёсткие тени', 'cyber-yellow', {
      background: {
        light: { kind: 'solid', color: '#f3f0e2', pattern: 'dots', patternOpacity: 12 },
        dark: { kind: 'solid', color: '#141414', pattern: 'dots', patternOpacity: 8 }
      },
      map: { show: false },
      surfaces: { fill: 'solid', borderWidth: 2, borderOpacity: 100, radius: 0.4, gradient: false, highlight: false,
        sidebar: 'cards', selected: 'brutal', selectedHover: 'lift', hover: 'border', buttons: 'brutal', navActive: 'solid' },
      shadows: { preset: 'hard', hardOffset: 4 },
      power: { style: 'globe', size: 110, glow: 0 },
      motion: { easing: 'snappy', entrance: 'slide', press: true, click: 'flash', clickColor: 'power' },
      fonts: { imports: [googleFontUrl('Rubik', '400;500;600;700')], ui: 'Rubik', heading: 'Rubik', headingWeight: 700 }
    })
  },
  {
    id: 'koala-classic', name: 'Koala Classic+', tags: ['карта', 'как в клиенте'],
    description: 'Знакомый Koala Clash с картой мира, только аккуратнее: стекло, мягкие тени и свечение кнопки',
    build: () => make('Koala Classic+', 'Привычный вид, только аккуратнее', 'koala', {
      background: { light: { kind: 'solid', color: '#c5d4f1' }, dark: { kind: 'solid', color: '#080f16' } },
      map: { show: true, opacity: 65 },
      surfaces: { opacity: 50, blur: 24, radius: 0.75 },
      power: { style: 'glow' }
    })
  }
];

export const presetById = (id: string) => PRESETS.find((p) => p.id === id);
