// Шаблоны фона: градиенты, меш-градиенты (в том числе перетекающие) и фотографии.

import type { Background, Scheme } from '../lib/types';

export interface GradientPreset {
  id: string;
  name: string;
  scheme: Scheme;
  bg: Partial<Background>;
}

const lin = (angle: number, ...colors: string[]): Partial<Background> => ({
  kind: 'linear', angle, stops: colors.map((color, i) => ({ color, pos: Math.round((i / (colors.length - 1)) * 100) }))
});
const rad = (x: number, y: number, ...colors: string[]): Partial<Background> => ({
  kind: 'radial', radialShape: 'ellipse', radialX: x, radialY: y, stops: colors.map((color, i) => ({ color, pos: Math.round((i / (colors.length - 1)) * 100) }))
});
const mesh = (color: string, ...blobs: [string, number, number, number][]): Partial<Background> => ({
  kind: 'mesh', color, blobs: blobs.map(([c, x, y, size]) => ({ color: c, x, y, size }))
});
const conic = (angle: number, color: string, ...colors: string[]): Partial<Background> => ({
  kind: 'conic', angle, radialX: 50, radialY: 50, color, stops: colors.map((c, i) => ({ color: c, pos: Math.round((i / (colors.length - 1)) * 100) }))
});
/** Живой фон: пятна медленно перетекают (анимация flow), лёгкое зерно убирает полосы на переходах */
const flow = (bg: Partial<Background>, speed = 28): Partial<Background> => ({ ...bg, animation: 'flow', animSpeed: speed, noise: 4 });

export const GRADIENTS: GradientPreset[] = [
  // Тёмные
  { id: 'night-sky', name: 'Ночное небо', scheme: 'dark', bg: { ...rad(50, 100, '#1b2735', '#090a0f'), color: '#090a0f' } },
  { id: 'aurora', name: 'Сияние', scheme: 'dark', bg: mesh('#04050b', ['#0f766e', 15, 15, 60], ['#6d28d9', 85, 20, 55], ['#16a34a', 55, 100, 70]) },
  { id: 'polar', name: 'Полярная ночь', scheme: 'dark', bg: mesh('#03060d', ['#0d9488', 20, 0, 45], ['#1d4ed8', 80, 10, 45], ['#7c3aed', 50, 30, 30], ['#020617', 50, 100, 80]) },
  { id: 'deep', name: 'Глубина', scheme: 'dark', bg: mesh('#050816', ['#1e3a8a', 10, 90, 70], ['#0e7490', 90, 10, 55], ['#312e81', 60, 50, 50]) },
  { id: 'neon', name: 'Неон', scheme: 'dark', bg: mesh('#07060d', ['#c026d3', 0, 0, 55], ['#0891b2', 100, 100, 60], ['#4c1d95', 100, 0, 40]) },
  { id: 'synthwave', name: 'Синтвейв', scheme: 'dark', bg: { ...lin(180, '#0d0221', '#2a0a4a', '#7a1f6e', '#f2545b'), color: '#0d0221' } },
  { id: 'lava', name: 'Лавовая лампа', scheme: 'dark', bg: mesh('#12060a', ['#e11d48', 25, 70, 45], ['#f97316', 70, 30, 40], ['#9333ea', 80, 90, 45], ['#be123c', 10, 10, 35]) },
  { id: 'ember', name: 'Угли', scheme: 'dark', bg: mesh('#0f0907', ['#9a3412', 20, 100, 60], ['#7f1d1d', 90, 80, 50], ['#78350f', 60, 0, 40]) },
  { id: 'twilight', name: 'Сумерки', scheme: 'dark', bg: { ...lin(165, '#2a1b3d', '#1a1530', '#0b0a12'), color: '#0b0a12' } },
  { id: 'abyss', name: 'Бездна', scheme: 'dark', bg: { ...lin(180, '#0f2027', '#203a43', '#2c5364'), color: '#0f2027' } },
  { id: 'jade', name: 'Нефрит', scheme: 'dark', bg: mesh('#03100c', ['#047857', 0, 0, 60], ['#0f766e', 100, 60, 55], ['#14532d', 40, 100, 50]) },
  { id: 'indigo-haze', name: 'Индиго', scheme: 'dark', bg: { ...rad(80, 0, '#4338ca', '#1e1b4b', '#0b0a1f'), color: '#0b0a1f' } },
  { id: 'holo', name: 'Голограмма', scheme: 'dark', bg: mesh('#0a0a14', ['#22d3ee', 10, 20, 40], ['#a78bfa', 50, 60, 40], ['#f472b6', 90, 20, 40], ['#34d399', 70, 100, 40]) },
  { id: 'cosmos', name: 'Космос', scheme: 'dark', bg: { ...mesh('#05040d', ['#312e81', 30, 30, 55], ['#701a75', 75, 70, 50], ['#0c4a6e', 90, 10, 35]), pattern: 'stars', patternOpacity: 70 } },
  { id: 'graphite', name: 'Графит', scheme: 'dark', bg: { ...rad(20, 0, '#25272c', '#0c0d0f'), color: '#0c0d0f' } },
  { id: 'warm-graphite', name: 'Тёплый графит', scheme: 'dark', bg: { ...rad(80, 100, '#3a2f28', '#15110e'), color: '#15110e', noise: 6 } },
  { id: 'forest-night', name: 'Ночной лес', scheme: 'dark', bg: mesh('#070d09', ['#14532d', 0, 100, 70], ['#365314', 100, 30, 50], ['#064e3b', 50, 0, 40]) },
  { id: 'cyber', name: 'Кибер', scheme: 'dark', bg: { ...lin(135, '#020617', '#0f172a', '#082f49'), pattern: 'grid', patternOpacity: 8, vignette: 40 } },
  { id: 'prism', name: 'Призма', scheme: 'dark', bg: conic(210, '#0b0b12', '#1e1b4b', '#0c4a6e', '#4a044e', '#1e1b4b') },
  { id: 'emerald-rays', name: 'Изумрудные лучи', scheme: 'dark', bg: conic(180, '#020a07', '#022c22', '#065f46', '#022c22', '#064e3b', '#022c22') },
  // По мотивам подборок Gradient Builder (традиционные японские цвета)
  { id: 'wisteria', name: 'Глициния', scheme: 'dark', bg: mesh('#140b1b', ['#3b1e4a', 15, 15, 70], ['#5d3a7e', 85, 75, 55], ['#8a6aae', 60, 105, 35]) },
  { id: 'indigo-depth', name: 'Индиговая глубь', scheme: 'dark', bg: { ...lin(180, '#274a78', '#181b3a', '#0b0d1f'), color: '#0b0d1f' } },
  { id: 'crimson-dusk', name: 'Багровые сумерки', scheme: 'dark', bg: { ...rad(85, 0, '#6e1424', '#3c3044', '#120a10'), color: '#120a10' } },
  { id: 'madder-clouds', name: 'Закатные облака', scheme: 'dark', bg: mesh('#140a0c', ['#b7282e', 10, 100, 60], ['#ee7800', 70, 90, 45], ['#f8b500', 95, 60, 25]) },
  // Перетекающие - цвета из наборов Gradient Builder, каждый в пару к готовой палитре (см. palettes.ts)
  { id: 'sakura-night', name: 'Сакура ночью', scheme: 'dark', bg: flow(mesh('#120a10', ['#3a1426', 15, 20, 70], ['#8f2a55', 70, 90, 70], ['#e75480', 100, 100, 40])) },
  { id: 'lavender-silk', name: 'Лавандовый шёлк', scheme: 'dark', bg: flow(mesh('#0f0d1a', ['#2a1f4d', 20, 20, 70], ['#5b3fb0', 85, 70, 55], ['#a78bfa', 60, 105, 32])) },
  { id: 'ocean-surf', name: 'Ночной прибой', scheme: 'dark', bg: flow(mesh('#04111d', ['#073b5c', 20, 70, 75], ['#0096c7', 80, 95, 55], ['#4cc9f0', 45, 110, 32])) },
  { id: 'sunset-evening', name: 'Вечерний закат', scheme: 'dark', bg: flow(mesh('#170d10', ['#3b1220', 50, 40, 80], ['#b23a48', 20, 100, 60], ['#ff8c42', 75, 105, 48], ['#ffd166', 95, 112, 28])) },
  { id: 'aurora-polar', name: 'Полярное сияние', scheme: 'dark', bg: flow(mesh('#04050b', ['#0f766e', 20, 55, 55], ['#2df5b0', 45, 62, 26], ['#7d5cff', 80, 50, 50], ['#1a1446', 60, 100, 60]), 24) },
  { id: 'neon-prism', name: 'Неоновая призма', scheme: 'dark', bg: flow(mesh('#07060d', ['#3a0a52', 30, 80, 70], ['#a3168f', 72, 100, 45], ['#0b8ea6', 45, 112, 45]), 20) },
  { id: 'forest-mist', name: 'Лесной туман', scheme: 'dark', bg: flow(mesh('#0a110c', ['#16301d', 30, 80, 80], ['#2f6b3a', 70, 100, 55], ['#7fcf8c', 68, 22, 16])) },
  { id: 'indigo-glass', name: 'Индиговое стекло', scheme: 'dark', bg: flow(mesh('#0a0b1a', ['#181b3a', 20, 20, 70], ['#4f46e5', 85, 85, 50], ['#8c9bff', 95, 100, 24])) },
  { id: 'gold-glint', name: 'Золотые блики', scheme: 'dark', bg: flow(mesh('#0e0c08', ['#3a2c10', 50, 80, 80], ['#c9952c', 45, 110, 50], ['#ffe9a8', 60, 106, 18])) },
  { id: 'city-night', name: 'Ночной город', scheme: 'dark', bg: flow(mesh('#16161e', ['#24283b', 50, 20, 80], ['#7aa2f7', 25, 105, 45], ['#bb9af7', 80, 105, 45])) },
  // Светлые
  { id: 'sage-mist', name: 'Шалфей', scheme: 'light', bg: { ...lin(170, '#f3f8f4', '#ebf2ee', '#ddeae2'), color: '#ebf2ee' } },
  { id: 'dawn', name: 'Рассвет', scheme: 'light', bg: { ...lin(160, '#fff1eb', '#ace0f9'), color: '#f3f6fb' } },
  { id: 'cold-dawn', name: 'Холодный рассвет', scheme: 'light', bg: mesh('#f4f7fb', ['#c7d2fe', 0, 0, 60], ['#fbcfe8', 100, 0, 50], ['#bae6fd', 50, 100, 60]) },
  { id: 'peach', name: 'Персик', scheme: 'light', bg: { ...lin(135, '#ffecd2', '#fcb69f'), color: '#fff4ec' } },
  { id: 'pink-sunset', name: 'Розовый закат', scheme: 'light', bg: { ...lin(180, '#ffd6e0', '#ffc6a8', '#ffe9b8'), color: '#fff1ea' } },
  { id: 'mint', name: 'Мята', scheme: 'light', bg: { ...lin(120, '#e0f7ef', '#c2ecdf', '#d9f2fb'), color: '#ecf8f3' } },
  { id: 'lavender-sky', name: 'Лавандовое небо', scheme: 'light', bg: { ...lin(150, '#e0c3fc', '#8ec5fc'), color: '#eef0fe' } },
  { id: 'candy', name: 'Карамель', scheme: 'light', bg: mesh('#fff7f2', ['#fbcfe8', 10, 10, 60], ['#fde68a', 90, 20, 50], ['#bfdbfe', 50, 100, 65]) },
  { id: 'sakura-mesh', name: 'Сакура', scheme: 'light', bg: mesh('#fdf2f6', ['#fbcfe8', 0, 0, 55], ['#fecdd3', 100, 30, 50], ['#e9d5ff', 40, 100, 60]) },
  { id: 'watercolor', name: 'Акварель', scheme: 'light', bg: { ...mesh('#fbfaf7', ['#bfdbfe', 15, 30, 45], ['#fde68a', 60, 15, 40], ['#fbcfe8', 85, 70, 45], ['#bbf7d0', 30, 90, 40]), noise: 8 } },
  { id: 'champagne', name: 'Шампань', scheme: 'light', bg: { ...lin(160, '#fdfbf6', '#f3e7d3', '#e8d5b7'), color: '#f6efe3', noise: 5 } },
  { id: 'cloud', name: 'Облака', scheme: 'light', bg: mesh('#f5f7fb', ['#dbeafe', 0, 0, 65], ['#ede9fe', 100, 40, 55], ['#e0f2fe', 30, 100, 60]) },
  { id: 'sand', name: 'Песок', scheme: 'light', bg: mesh('#faf6ee', ['#fde7c8', 0, 100, 70], ['#f5e1d0', 100, 0, 60], ['#efe6d8', 60, 50, 50]) },
  { id: 'glacier', name: 'Ледник', scheme: 'light', bg: { ...rad(50, 0, '#ffffff', '#e0f2fe', '#bae6fd'), color: '#e0f2fe' } },
  { id: 'spotlight', name: 'Прожектор', scheme: 'light', bg: { ...rad(50, 0, '#ffffff', '#e8edf5'), color: '#e8edf5' } },
  { id: 'paper', name: 'Бумага', scheme: 'light', bg: { kind: 'solid', color: '#f7f4ee', noise: 10 } },
  { id: 'blueprint', name: 'Чертёж', scheme: 'light', bg: { kind: 'solid', color: '#eef3fb', pattern: 'grid', patternOpacity: 10 } },
  { id: 'iris', name: 'Ирис', scheme: 'light', bg: conic(140, '#f5f3ff', '#ede9fe', '#e0e7ff', '#fce7f3', '#ede9fe') },
  { id: 'hanada', name: 'Небо ханада', scheme: 'light', bg: { ...rad(50, 110, '#a0d8ef', '#eaf4fc'), color: '#eaf4fc' } },
  { id: 'cherry-haze', name: 'Вишнёвая дымка', scheme: 'light', bg: mesh('#fef4f4', ['#eebbcb', 10, 10, 60], ['#f09199', 90, 95, 45], ['#fde2e8', 80, 15, 40]) },
  { id: 'sun-kissed', name: 'Солнечное небо', scheme: 'light', bg: { ...lin(180, '#a0d8ef', '#fff1cf', '#f5b1aa'), color: '#fff1cf' } },
  { id: 'celadon', name: 'Селадон', scheme: 'light', bg: { ...rad(20, 10, '#eef7f9', '#d6eaf3', '#a9d6c4'), color: '#d6eaf3' } },
  { id: 'sakura-day', name: 'Сакура днём', scheme: 'light', bg: flow(mesh('#fef4f4', ['#eebbcb', 15, 10, 55], ['#f09199', 8, 12, 30], ['#f6d3de', 90, 95, 60])) },
  { id: 'lavender-flow', name: 'Лавандовый поток', scheme: 'light', bg: flow(mesh('#f4f2fe', ['#ddd6fe', 10, 90, 65], ['#c4b5fd', 85, 85, 55], ['#e0e7ff', 70, 10, 60])) },
  { id: 'sea-breeze', name: 'Морской бриз', scheme: 'light', bg: flow(mesh('#f5fbfe', ['#d4eef8', 30, 20, 70], ['#a0d8ef', 90, 80, 60], ['#7fc4e6', 100, 100, 35])) },
  { id: 'apricot-dawn', name: 'Абрикосовый рассвет', scheme: 'light', bg: flow(mesh('#fff4ec', ['#ffc078', 10, 5, 50], ['#ffb08a', 90, 100, 55], ['#ffd8b8', 80, 20, 50])) },
  { id: 'mint-flow', name: 'Мятный поток', scheme: 'light', bg: flow(mesh('#edf9f6', ['#c8f3e9', 15, 15, 60], ['#d9d0ff', 60, 75, 55], ['#a7f0dc', 90, 100, 50])) },
  { id: 'neon-rings', name: 'Неоновая дымка', scheme: 'light', bg: flow(mesh('#f6f3ff', ['#f7b6ee', 0, 0, 55], ['#9fe9ff', 70, 60, 55], ['#e6e0ff', 100, 100, 60]), 20) },
  { id: 'bamboo-morning', name: 'Бамбуковое утро', scheme: 'light', bg: flow(mesh('#eff4ec', ['#c9e3d4', 10, 15, 60], ['#d6e9ca', 80, 30, 55], ['#a9e5a0', 85, 95, 50])) },
  { id: 'indigo-mist', name: 'Индиговая дымка', scheme: 'light', bg: flow(mesh('#f1f2fb', ['#dfe3fd', 20, 20, 70], ['#c7d2fe', 70, 70, 55], ['#e9e4ff', 95, 10, 50])) },
  { id: 'gold-morning', name: 'Золотое утро', scheme: 'light', bg: flow(mesh('#faf7f0', ['#f6e7c1', 50, 40, 80], ['#ffe08a', 50, 70, 50], ['#f3d9a4', 50, 105, 60])) },
  { id: 'lilac-stripes', name: 'Сиреневые волны', scheme: 'light', bg: flow(mesh('#e6e7ed', ['#cdd3ee', 30, 30, 70], ['#a9b8ee', 70, 75, 55], ['#d6ccf2', 90, 100, 50])) }
];

export const gradientById = (id: string) => GRADIENTS.find((g) => g.id === id);

/* ---------- Фотографии ---------- */

export interface Photo { id: string; name: string; scheme: Scheme; tone: string }

/** Бесплатные фото с Unsplash (images.unsplash.com разрешает прямые ссылки) */
export const PHOTOS: Photo[] = [
  { id: '1531366936337-7c912a4589a7', name: 'Северное сияние', scheme: 'dark', tone: '#0b1a2e' },
  { id: '1483347756197-71ef80e95f73', name: 'Сияние над лесом', scheme: 'dark', tone: '#06120f' },
  { id: '1519681393784-d120267933ba', name: 'Млечный Путь', scheme: 'dark', tone: '#0d1422' },
  { id: '1477346611705-65d1883cee1e', name: 'Горы в сумерках', scheme: 'dark', tone: '#1a1420' },
  { id: '1542642839-83adadcbe645', name: 'Неоновый мост', scheme: 'dark', tone: '#0a0716' },
  { id: '1540959733332-eab4deabeeaf', name: 'Токио', scheme: 'dark', tone: '#0c0b18' },
  { id: '1504333638930-c8787321eee0', name: 'Туманность Ориона', scheme: 'dark', tone: '#06060c' },
  { id: '1462332420958-a05d1e002413', name: 'Столпы творения', scheme: 'dark', tone: '#140d08' },
  { id: '1511884642898-4c92249e20b6', name: 'Туманный лес', scheme: 'dark', tone: '#121612' },
  { id: '1663970206579-c157cba7edda', name: 'Синие волны', scheme: 'dark', tone: '#070818' },
  { id: '1637825891028-564f672aa42c', name: 'Фиолетовая волна', scheme: 'dark', tone: '#0b0620' },
  { id: '1654198340681-a2e0fc449f1b', name: 'Розовый вихрь', scheme: 'dark', tone: '#080609' },
  { id: '1614851099511-773084f6911d', name: 'Закатный градиент', scheme: 'dark', tone: '#12051a' },
  { id: '1620207418302-439b387441b0', name: 'Пурпурный поток', scheme: 'dark', tone: '#140a22' },
  { id: '1557683316-973673baf926', name: 'Мягкий градиент', scheme: 'light', tone: '#3a7a9e' },
  { id: '1542401886-65d6c61db217', name: 'Дюны', scheme: 'light', tone: '#d9a77a' },
  { id: '1507295386538-ddd5e86cd597', name: 'Бирюзовое море', scheme: 'light', tone: '#5ac1c4' },
  { id: '1522383225653-ed111181a951', name: 'Сакура', scheme: 'light', tone: '#f4d6dc' },
  { id: '1454496522488-7a8e488e8606', name: 'Заснеженные пики', scheme: 'light', tone: '#d8e2ee' },
  { id: '1571564756948-51c10b7f058e', name: 'Туманное озеро', scheme: 'light', tone: '#d7dde3' },
  { id: '1501898047706-55903296cd09', name: 'Огненный закат', scheme: 'dark', tone: '#2a1208' },
  { id: '1505051508008-923feaf90180', name: 'Бирюзовый закат', scheme: 'dark', tone: '#0f2a33' }
];

export const photoUrl = (id: string, w = 1920) => `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;
export const photoThumb = (id: string) => `https://images.unsplash.com/photo-${id}?w=320&h=200&q=60&auto=format&fit=crop`;
export const photoById = (id: string) => PHOTOS.find((p) => p.id === id);
