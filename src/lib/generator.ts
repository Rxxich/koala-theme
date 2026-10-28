// Генератор CSS темы для Koala Clash.
//
// Как тема попадает в клиент: провайдер отдаёт в ответе подписки заголовок custom-css со ссылкой
// на файл, клиент скачивает его (main/resolve/theme.ts) и вставляет через webContents.insertCSS()
// ПЕРЕД своими стилями. Поэтому при равной специфичности побеждает клиент - все правила ниже
// начинаются с :root (или html.dark / html:not(.dark)), чтобы быть сильнее.
// Утилиты Tailwind v4 лежат внутри @layer, их перебивает любое правило без слоя.
// Селекторы взяты из исходников клиента 1.5.0: data-slot у компонентов shadcn/ui, data-guide у
// элементов главной, классы там, где атрибутов нет.

import { mix, readableOn, rgba, rgbToHsl, parseColor } from './color';
import { fontStack, isGoogleFontsUrl, isMonoFont } from './fonts';
import { APP_WRAPPER, isAppPalette } from './defaults';
import { highlightShadow, shadowReach, shadowSet, textShadowCss, textShadowReach, TOP_ROOM } from './shadows';
import { powerKeyframes, powerRules, type GlassLook } from './power';
import { particleSet, patternLayer } from './backdrop';
import { clickRules, funRules, PROXY_SEL } from './effects';
import { dividerRules } from './dividers';
import type { Background, GradientStop, IconPlate, Scheme, SelectedStyle, StyleColor, ThemeConfig } from './types';

const P = ':root';
const WRAP = `${P} [data-slot="sidebar-wrapper"]`;
const MAP = `${WRAP} > img.pointer-events-none`;
const CARD_BASE = '[data-slot="card"]:not([class*="border-primary/"]):not([class*="bg-amber-500"])';
const SELECTED = `${P} [data-slot="card"][class*="border-primary/"]`;
const PINNED = `${P} [data-slot="card"][class*="bg-amber-500"]`;
const PROXY = `${P} ${PROXY_SEL}`;
const TILE = 'div.rounded-2xl.border-stroke';
/** Тень клиента shadow-sm - к ней добавляется блик по кромке при тенях «Как в клиенте» */
const APP_SHADOW_SM = '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)';
const PROFILE = 'div.rounded-2xl[aria-busy]';
const POPUPS = ['dialog-content', 'alert-dialog-content', 'dropdown-menu-content', 'select-content', 'popover-content', 'context-menu-content']
  .map((s) => `[data-slot="${s}"]`).join(', ');

/** 26 букв-регионов U+1F1E6..U+1F1FF: имя сервера начинается с флага */
const FLAG_TITLES = Array.from({ length: 26 }, (_, i) => `[title^="\\1F1${(0xe6 + i).toString(16).toUpperCase()}"]`);
const FLAG = `span.flag-emoji:is(${FLAG_TITLES.join(', ')})`;

export const EASE: Record<Exclude<ThemeConfig['motion']['easing'], 'app'>, string> = {
  smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
  spring: 'linear(0, 0.4 8%, 1.15 18%, 0.9 30%, 1.06 42%, 0.97 55%, 1.02 68%, 0.995 82%, 1)',
  snappy: 'cubic-bezier(0.2, 0, 0, 1)',
  bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  linear: 'linear'
};

/* ---------- Форматирование ---------- */

type Decl = string | false | null | undefined | 0;
function rule(selector: string | string[], decls: Decl[]): string {
  const body = decls.filter(Boolean) as string[];
  if (!body.length) return '';
  const sel = Array.isArray(selector) ? selector.join(',\n') : selector;
  return `${sel} {\n${body.map((d) => (d.startsWith('/*') ? `    ${d}` : `    ${d};`)).join('\n')}\n}\n`;
}
function section(n: number, title: string, note: string, body: string): string {
  if (!body.trim()) return '';
  const lines = note ? `\n${note.split('\n').map((l) => `   ${l}`).join('\n')}` : '';
  return `\n/* =====================================================================\n   ${n}. ${title.toUpperCase()}${lines}\n   ===================================================================== */\n\n${body}`;
}
const pct = (v: number) => `${Math.round(v * 100) / 100}%`;
const px = (v: number) => `${Math.round(v * 100) / 100}px`;
const cm = (color: string, amount: number, to = 'transparent') => `color-mix(in srgb, ${color} ${pct(amount)}, ${to})`;
/** Цвет подложки строк прокси: --kt-row-k от 0 до 1 проявляет её при раскрытии группы */
const rowFade = (color: string, amount: number) => `color-mix(in srgb, ${color} calc(${pct(amount)} * var(--kt-row-k, 1)), transparent)`;
/** Цвет, выбранный у стиля в «Поверхностях». null - «Авто»: свои цвета стиля */
function pickColor(c: StyleColor, custom: string): string | null {
  if (c === 'auto') return null;
  if (c === 'primary') return 'var(--primary)';
  if (c === 'power') return 'var(--gradient-start-power-on)';
  if (c === 'foreground') return 'var(--foreground)';
  return /^#[0-9a-f]{3,8}$/i.test(custom) ? custom : null;
}
/** Чёрный или белый текст поверх заливки цветом c - по его светлоте (относительный цвет CSS) */
const onColor = (c: string) => `oklch(from ${c} clamp(0, (0.68 - l) * 1000, 1) 0 0)`;
/**
 * Свой цвет стиля внутри элемента: акцент палитры и цвета кнопки подключения заменяются выбранным, и
 * всё, что построено на них, - стили темы и классы клиента (bg-primary/10, border-primary/30...) -
 * перекрашивается само. Переменную саму на себя не заменяем: она ссылалась бы на себя и пропала бы
 */
function accentVars(c: string | null, fg = false): Decl[] {
  if (!c) return [];
  const primary = c !== 'var(--primary)', power = c !== 'var(--gradient-start-power-on)';
  return [primary && `--primary: ${c}`, primary && fg && `--primary-foreground: ${onColor(c)}`,
    power && `--gradient-start-power-on: ${c}`, power && `--gradient-end-power-on: ${c}`, power && `--stroke-power-on: ${c}`, power && fg && `--kt-on-power: ${onColor(c)}`];
}
/** Раскрытие группы прокси по-своему - только когда тема меняет карточки или их тени */
const rowsFixed = (cfg: ThemeConfig) => cfg.surfaces.custom || cfg.shadows.preset !== 'app';
/** Стеклянные карточки с размытием - при их анимации нужен слой перерисовки (см. motionRules) */
const glassRedraw = (cfg: ThemeConfig) => cfg.surfaces.custom && cfg.surfaces.fill === 'glass' && cfg.surfaces.blur > 0;
/** Постоянные анимации выбранного сервера. У текущего профиля - только блик и сияние, без «дыхания» */
function selectedAnims(cfg: ThemeConfig, v = cfg.surfaces.selected, breath = cfg.fun.breathing): string[] {
  const a: string[] = [];
  if (v === 'shine') a.push('kt-sel-shine 3.6s ease-in-out infinite');
  if (v === 'aurora') a.push('kt-sel-aurora 6s ease-in-out infinite alternate');
  if (breath) a.push('kt-breath 2.6s ease-in-out infinite');
  return a;
}
const REDRAW_LAYER = ['content: ""', 'position: fixed', 'inset: 0', 'z-index: 2147483647', 'pointer-events: none', 'background: #000', 'opacity: 0', 'visibility: hidden', 'will-change: opacity'];

/** Контексты режимов: какой селектор отвечает за светлую и тёмную схему при выбранном режиме */
export function schemeScopes(mode: ThemeConfig['mode']): { scheme: Scheme; sel: string }[] {
  if (mode === 'dark') return [{ scheme: 'dark', sel: 'html:root' }];
  if (mode === 'light') return [{ scheme: 'light', sel: 'html:root' }];
  return [{ scheme: 'light', sel: 'html:not(.dark)' }, { scheme: 'dark', sel: 'html.dark' }];
}

/* ---------- Фон ---------- */

function stopsCss(bg: Background): string {
  return [...bg.stops].sort((a, b) => a.pos - b.pos).map((s) => `${s.color} ${s.pos}%`).join(', ');
}

/**
 * Слой градиента/картинки для ::before обёртки. null - только сплошной цвет.
 * flowing - перетекание: пятна меша и центр градиента ходят по кругу, угол качается. Всё считается
 * от одного угла --kt-flow (0...360deg, анимация kt-bg-flow) через sin/cos - у каждого пятна свои
 * радиус, фаза, направление и скорость (1 или 2 оборота за период), так что движение не синхронное,
 * а в конце периода всё сходится в начало и цикл не дёргается
 */
function backgroundLayer(bg: Background, flowing = false): string | null {
  const orbit = (base: number, r: number, fn: 'cos' | 'sin', turn = 1, phase = 0) =>
    flowing ? `calc(${base}% + ${r}% * ${fn}(var(--kt-flow) * ${turn} + ${phase}deg))` : `${base}%`;
  switch (bg.kind) {
    case 'linear': return `linear-gradient(${flowing ? `calc(${bg.angle}deg + 28deg * sin(var(--kt-flow)))` : `${bg.angle}deg`}, ${stopsCss(bg)})`;
    case 'radial': return `radial-gradient(${bg.radialShape} at ${orbit(bg.radialX, 12, 'cos')} ${orbit(bg.radialY, 9, 'sin')}, ${stopsCss(bg)})`;
    case 'conic': return `conic-gradient(from ${flowing ? `calc(${bg.angle}deg + var(--kt-flow))` : `${bg.angle}deg`} at ${orbit(bg.radialX, 6, 'cos')} ${orbit(bg.radialY, 5, 'sin')}, ${stopsCss(bg)})`;
    case 'mesh': return bg.blobs.map((b, i) => {
      const turn = (i % 2 ? -1 : 1) * (i % 3 === 2 ? 2 : 1);
      const phase = i * 137;
      // Пятно ещё и дышит: размер ±12%
      const size = flowing ? `calc(${b.size}% + ${Math.round(b.size * 12) / 100}% * sin(var(--kt-flow) * ${turn} + ${phase + 90}deg))` : `${b.size}%`;
      return `radial-gradient(${size} ${size} at ${orbit(b.x, 14 - (i % 3) * 3, 'cos', turn, phase)} ${orbit(b.y, 10 + (i % 2) * 4, 'sin', turn, phase)}, ${b.color} 0%, transparent 70%)`;
    }).join(',\n        ');
    case 'image': {
      const url = bg.imageUrl.trim();
      if (!url) return null;
      return `url("${url.replace(/["\\\n]/g, '')}")`;
    }
    default: return null;
  }
}

/** CSS-фон для миниатюр в редакторе */
export function bgPreview(bg: Partial<Background>, fallback: string): string {
  const full = { ...defaultBg, ...bg } as Background;
  const layer = backgroundLayer(full);
  const base = full.kind === 'app' || full.kind === 'palette' ? fallback : full.color;
  if (!layer) return base;
  return full.kind === 'image' ? `${layer} center / cover no-repeat, ${base}` : `${layer}, ${base}`;
}
const defaultBg: Partial<Background> = { kind: 'solid', color: '#000000', angle: 180, stops: [], radialShape: 'ellipse', radialX: 50, radialY: 50, blobs: [], imageUrl: '' };

function noiseUri(amount: number): string {
  const a = Math.round(Math.min(0.5, amount / 100) * 1000) / 1000;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0 0 0 0 ${a}'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>`;
  return `url("data:image/svg+xml,${svg.replace(/</g, '%3C').replace(/>/g, '%3E')}")`;
}

function backgroundRules(cfg: ThemeConfig, scheme: Scheme, scope: string, kfs: Record<string, string>): string {
  const bg = cfg.background[scheme];
  const pal = cfg.palette[scheme];
  const w = `${scope} [data-slot="sidebar-wrapper"]`;
  let out = '';
  if (bg.kind !== 'app') out += rule(w, [`background: ${bg.kind === 'palette' ? pal.background : bg.color} !important`, 'isolation: isolate']);
  // Тема одной палитры, фон "как в клиенте": в "чужом" режиме клиент красит обёртку в цвет своей схемы
  else if (cfg.mode !== 'both') out += rule(w, [`background: ${APP_WRAPPER[scheme]} !important`]);

  const anim = bg.animation;
  const layer = backgroundLayer(bg, anim === 'flow');
  if (layer) {
    const isImage = bg.kind === 'image';
    const dimC = rgba(pal.background, bg.imageDim / 100);
    const dim = isImage && bg.imageDim > 0 ? `linear-gradient(${dimC}, ${dimC}), ` : '';
    const spin = anim === 'spin';
    const blurPad = Math.max(isImage ? bg.imageBlur : 0, bg.blurPages ? bg.blurPagesAmount : 0);
    out += rule(`${w}::before`, [
      'content: ""',
      'position: absolute',
      `inset: ${spin ? '-50%' : blurPad ? `-${blurPad * 2}px` : '0'}`,
      'z-index: 0',
      'pointer-events: none',
      `background: ${dim}${layer}`,
      isImage && `background-size: ${bg.imageFit === 'repeat' ? 'auto' : `${dim ? 'auto, ' : ''}${bg.imageFit}`}`,
      isImage && `background-position: ${dim ? 'center, ' : ''}${bg.imageX}% ${bg.imageY}%`,
      isImage && `background-repeat: ${bg.imageFit === 'repeat' ? 'repeat' : 'no-repeat'}`,
      isImage && bg.imageBlur > 0 && `filter: blur(${bg.imageBlur}px)`,
      isImage && bg.imageOpacity < 100 && `opacity: ${bg.imageOpacity / 100}`,
      !isImage && anim === 'pan' && 'background-size: 220% 220%',
      anim !== 'none' && `animation: kt-bg-${anim} ${bg.animSpeed}s ${anim === 'spin' || anim === 'hue' || anim === 'flow' ? 'linear' : 'ease-in-out'} infinite${anim === 'pan' || anim === 'breathe' ? ' alternate' : ''}`,
      bg.blurPages && 'transition: filter 0.6s ease'
    ]);
    // На внутренних страницах клиент вешает на карту класс blur-3xl - по нему узнаём, что мы не на главной.
    // Карта при этом может быть скрыта: класс всё равно переключается
    if (bg.blurPages) out += rule(`${w}:has(> img.blur-3xl)::before`, [`filter: blur(${bg.blurPagesAmount + (isImage ? bg.imageBlur : 0)}px)`]);
  }

  // ::after - частицы (если "под интерфейсом"), узор, зерно, виньетка
  const overlays: string[] = [];
  const parts = cfg.fun.particlesOver ? null : particleSet(cfg.fun, pal, scheme);
  if (parts) overlays.push(...parts.layers);
  const pat = patternLayer(bg, pal.foreground);
  const staticCount = () => overlays.length - (parts?.layers.length ?? 0);
  if (pat) overlays.push(pat);
  if (bg.noise > 0) overlays.push(`${noiseUri(bg.noise)} 0 0 / 220px 220px`);
  if (bg.vignette > 0) overlays.push(`radial-gradient(ellipse at center, transparent 50%, ${rgba(scheme === 'dark' ? '#000000' : mix(pal.background, '#000000', 0.7), bg.vignette / 100)} 100%)`);
  if (overlays.length) {
    let animDecl: string | false = false;
    if (parts) {
      // Сдвигаем только слои частиц; у узора и зерна позиция в обоих кадрах одинаковая
      const stat = Array.from({ length: staticCount() }, () => '0 0');
      const name = `pt-${scheme}${scope === 'html:root' ? '' : ''}`;
      kfs[name] = `from { background-position: ${[...parts.from, ...stat].join(', ')}; } to { background-position: ${[...parts.to, ...stat].join(', ')}; }`;
      animDecl = `animation: kt-${name} ${parts.duration}s linear infinite`;
    }
    out += rule(`${w}::after`, ['content: ""', 'position: absolute', 'inset: 0', 'z-index: 0', 'pointer-events: none', `background: ${overlays.join(',\n        ')}`, animDecl]);
  }

  // Частицы поверх интерфейса
  if (cfg.fun.particlesOver) {
    const ps = particleSet(cfg.fun, pal, scheme);
    if (ps) {
      const name = `pto-${scheme}`;
      kfs[name] = `from { background-position: ${ps.from.join(', ')}; } to { background-position: ${ps.to.join(', ')}; }`;
      out += rule(`${scope} body::after`, ['content: ""', 'position: fixed', 'inset: 0', 'z-index: 45', 'pointer-events: none', `background: ${ps.layers.join(',\n        ')}`, `animation: kt-${name} ${ps.duration}s linear infinite`]);
    }
  }
  return out;
}

function mapRules(cfg: ThemeConfig): string {
  const m = cfg.map;
  if (!m.show) return rule(MAP, ['display: none !important']);
  const filters: string[] = [];
  if (m.tintPrimary) {
    // Перекраска карты в цвет акцента: sepia даёт оттенок ~40°, дальше поворачиваем к нужному
    const pal = cfg.palette[cfg.mode === 'light' ? 'light' : 'dark'];
    const rgb = parseColor(pal.primary);
    const h = rgb ? rgbToHsl(rgb).h : 210;
    filters.push('sepia(1)', 'saturate(2.6)', `hue-rotate(${Math.round(h - 40)}deg)`);
  }
  if (m.grayscale) filters.push(`grayscale(${m.grayscale}%)`);
  if (m.hue) filters.push(`hue-rotate(${m.hue}deg)`);
  if (m.brightness !== 100) filters.push(`brightness(${m.brightness}%)`);
  const f = filters.join(' ');
  let out = rule(MAP, [m.opacity !== 65 && `opacity: ${m.opacity / 100} !important`, f && `filter: ${f} !important`]);
  // На внутренних страницах клиент размывает карту классом blur-3xl - сохраняем это поведение
  if (f || !m.blurPages) out += rule(`${MAP}.blur-3xl`, [`filter: ${m.blurPages ? 'blur(64px) ' : ''}${f || 'none'} !important`]);
  // Тема с одной палитрой: в "чужом" режиме клиента карта светлая/тёмная не в тон - инвертируем
  if (cfg.mode !== 'both') {
    const wrong = cfg.mode === 'dark' ? 'html:not(.dark)' : 'html.dark';
    const inv = `invert(1) hue-rotate(180deg) ${cfg.mode === 'dark' ? 'brightness(0.75)' : 'brightness(1.25)'}`;
    out += rule(`${wrong} [data-slot="sidebar-wrapper"] > img.pointer-events-none`, [`filter: ${inv} ${f} !important`]);
    out += rule(`${wrong} [data-slot="sidebar-wrapper"] > img.pointer-events-none.blur-3xl`, [`filter: ${inv} ${m.blurPages ? 'blur(64px)' : ''} ${f} !important`]);
  }
  return out;
}

/* ---------- Палитра ---------- */

/** Свой градиент карточек (не «Лёгкий»): точки цвета схемы с прозрачностью заливки alpha, % */
export function cardGradientCss(s: ThemeConfig['surfaces'], stops: GradientStop[], alpha: number): string {
  const list = [...stops].sort((a, b) => a.pos - b.pos).map((x) => `${cm(x.color, alpha)} ${pct(x.pos)}`).join(', ');
  const at = `at ${pct(s.gradientX)} ${pct(s.gradientY)}`;
  if (s.gradientKind === 'radial') return `radial-gradient(ellipse ${at}, ${list})`;
  if (s.gradientKind === 'conic') return `conic-gradient(from ${s.gradientAngle}deg ${at}, ${list})`;
  return `linear-gradient(${s.gradientAngle}deg, ${list})`;
}
const ownGradient = (s: ThemeConfig['surfaces']) => s.custom && s.gradient && s.gradientKind !== 'soft';

function paletteRules(cfg: ThemeConfig, scheme: Scheme, scope: string): string {
  const p = cfg.palette[scheme];
  const sh = shadowSet(cfg.shadows, scheme, p, cfg.surfaces.highlight);
  // Стандартная палитра клиента в двухрежимной теме - переменные не трогаем, клиент задаёт их сам
  const isDefault = cfg.mode === 'both' && isAppPalette(p, scheme);
  const onPower = readableOn(mix(p.powerOnStart, p.powerOnEnd, 0.5));
  const v = (name: string, val: string) => `--${name}: ${val} !important`;
  const t = (name: string, val: string) => `--kt-${name}: ${val}`;
  const vars = isDefault ? [] : [
    '/* Переменные клиента (assets/main.css) */',
    v('background', p.background), v('foreground', p.foreground),
    v('card', p.card), v('card-foreground', p.foreground),
    v('popover', p.popover), v('popover-foreground', p.foreground),
    v('primary', p.primary), v('primary-foreground', p.primaryForeground),
    v('secondary', p.secondary), v('secondary-foreground', p.foreground),
    v('muted', p.secondary), v('muted-foreground', p.mutedForeground),
    v('accent', p.accent), v('accent-foreground', p.foreground),
    v('border', p.border), v('input', p.stroke), v('ring', p.primary), v('stroke', p.stroke),
    v('destructive', p.destructive), v('destructive-foreground', '#ffffff'),
    v('success', p.success), v('success-foreground', readableOn(p.success)), v('warning', p.warning),
    '/* Кнопка подключения, переключатели, вкладки, стрелки трафика */',
    v('stroke-power-on', p.powerOnStroke), v('gradient-start-power-on', p.powerOnStart), v('gradient-end-power-on', p.powerOnEnd),
    v('stroke-power-off', p.powerOffStroke), v('gradient-start-power-off', p.powerOffStart), v('gradient-end-power-off', p.powerOffEnd),
    '/* Карточки профилей */',
    v('profile-active', rgba(p.primary, scheme === 'dark' ? 0.14 : 0.1)), v('stroke-profile-active', mix(p.primary, p.card, 0.45)),
    v('profile-inactive', cm(p.card, cfg.surfaces.custom ? cardAlpha(cfg.surfaces) : 50)), v('stroke-profile-inactive', p.border),
    '/* Графики */',
    v('chart-1', p.primary), v('chart-2', p.powerOnStart), v('chart-3', p.success), v('chart-4', p.warning), v('chart-5', p.destructive),
    '/* Боковая панель */',
    v('sidebar', p.card), v('sidebar-foreground', p.foreground), v('sidebar-primary', p.primary),
    v('sidebar-primary-foreground', p.primaryForeground), v('sidebar-accent', p.accent),
    v('sidebar-accent-foreground', p.foreground), v('sidebar-border', p.border), v('sidebar-ring', p.primary)
  ];
  const own = [
    cfg.surfaces.buttons === 'power' && t('on-power', onPower),
    // Блик по кромке - отдельной переменной: им рисуют карточки при тенях клиента (с тенями темы он
    // входит в тень карточек) и стеклянные кнопки подключения при любых тенях
    cfg.surfaces.highlight && t('highlight', highlightShadow(scheme)),
    sh && t('shadow-card', sh.card), sh && t('shadow-hover', sh.hover), sh && t('shadow-pop', sh.pop), sh && t('shadow-btn', sh.button),
    // Тень кнопки подключения - без блика: у кнопки он свой, иначе получался двойной
    sh && cfg.shadows.power && cfg.surfaces.highlight && t('shadow-bare', sh.bare),
    sh && cfg.shadows.power && cfg.surfaces.highlight && t('shadow-bare-hover', sh.bareHover),
    // Свой градиент карточек: цвета у каждой схемы свои. glass-grad - для стеклянной панели и окошка режима
    ownGradient(cfg.surfaces) && t('card-grad', cardGradientCss(cfg.surfaces, cfg.surfaces.gradientStops[scheme], cardAlpha(cfg.surfaces))),
    ownGradient(cfg.surfaces) && t('glass-grad', cardGradientCss(cfg.surfaces, cfg.surfaces.gradientStops[scheme], cfg.surfaces.opacity))
  ].filter(Boolean) as string[];
  return rule(scope, [...vars, own.length ? '/* Переменные темы */' : false, ...own]);
}

/* ---------- Поверхности ---------- */

/** Непрозрачность заливки карточек: стекло - по ползунку, сплошные - 100%, контур и "без фона" - 0 */
export const cardAlpha = (s: ThemeConfig['surfaces']) => s.fill === 'solid' ? 100 : s.fill === 'glass' ? s.opacity : 0;

/** «Лёгкий» градиент карточек: чуть светлее сверху */
const shade = (a: number, b: number) => `linear-gradient(180deg, ${cm('color-mix(in oklab, var(--card) 94%, var(--foreground))', a)}, ${cm('var(--card)', b)})`;

/**
 * Стекло по ползункам «Карточки и плитки» - даже если сами карточки другие (сплошные, контур).
 * Им же рисуются стеклянная боковая панель, окошко режима и тумблер «Стекло»
 */
function glassLook(s: ThemeConfig['surfaces']): GlassLook {
  const fill = ownGradient(s) ? 'var(--kt-glass-grad)' : s.gradient ? shade(s.opacity, Math.max(0, s.opacity - 14)) : cm('var(--card)', s.opacity);
  // Шероховатость стекла - зерно отдельным верхним слоем фона: матовое стекло вместо гладкого
  const grain = s.grain > 0 ? `${noiseUri(s.grain * 0.45)} 0 0 / 180px 180px, ` : '';
  const stroke = pickColor(s.borderColor, s.borderCustom) ?? 'var(--stroke)';
  return {
    grain, fill,
    filter: s.blur > 0 ? `blur(${s.blur}px) saturate(${s.saturate}%)` : 'none',
    stroke: s.borderOpacity >= 100 ? stroke : cm(stroke, s.borderOpacity)
  };
}

function surfaceRules(cfg: ThemeConfig): string {
  const s = cfg.surfaces;
  const sh = cfg.shadows.preset !== 'app';
  const glass = s.fill === 'glass';
  const alpha = cardAlpha(s);
  const gl = glassLook(s);
  const glassBlur = gl.filter, glassFill = gl.fill, glassGrain = gl.grain;
  const own = ownGradient(s);
  const grain = glass ? glassGrain : '';
  const blur = glass ? glassBlur : 'none';
  const fill = !glass && s.fill !== 'solid' ? 'transparent' : own ? 'var(--kt-card-grad)'
    : s.gradient ? shade(alpha, Math.max(0, alpha - (glass ? 14 : 0))) : cm('var(--card)', alpha);
  const bw = s.fill === 'transparent' ? 0 : s.fill === 'outline' ? Math.max(1, s.borderWidth) : s.borderWidth;
  const stroke = pickColor(s.borderColor, s.borderCustom) ?? 'var(--stroke)';
  const border = bw === 0 ? 'transparent' : gl.stroke;
  let out = '';

  // Скругления. Клиент считает rounded-sm/md/lg/xl как --radius ± несколько пикселей, поэтому при
  // --radius: 0 углы всё равно остаются круглыми. Пересчитываем пропорционально - 0 даёт острые углы
  if (Math.abs(s.radius - 0.625) > 0.001) {
    out += rule(`${P} .rounded-2xl`, ['border-radius: calc(var(--radius) * 1.6)']);
    out += rule(`${P} .rounded-xl`, ['border-radius: calc(var(--radius) * 1.4)']);
    out += rule(`${P} .rounded-lg`, ['border-radius: var(--radius)']);
    out += rule(`${P} .rounded-md`, ['border-radius: calc(var(--radius) * 0.8)']);
    out += rule(`${P} :is(.rounded-sm, .rounded)`, ['border-radius: calc(var(--radius) * 0.6)']);
    out += rule(`${P} :is(${POPUPS}, [data-slot="sidebar-inner"])`, ['border-radius: calc(var(--radius) * 1.4) !important']);
  }

  if (s.custom) {
    out += rule([`${P} ${CARD_BASE}`, `${P} ${TILE}`, `${P} [data-slot="accordion"]`], [
      `background: ${grain}${fill} !important`,
      `border-color: ${border} !important`,
      `border-width: ${bw}px !important`,
      `backdrop-filter: ${blur} !important`
    ]);
    // Подложка раскрытой группы прокси - прозрачнее карточек. --kt-row-k проявляет её при раскрытии (см. ниже)
    out += rule(`${P} div[class*="bg-card/30"]`, [`background: ${rowFade('var(--card)', alpha * 0.5)} !important`,
      `border-color: ${bw === 0 ? 'transparent' : rowFade(stroke, Math.min(100, s.borderOpacity))} !important`]);
    out += rule([`${P} ${PROFILE}`, PINNED], [`backdrop-filter: ${blur} !important`, `border-width: ${bw}px !important`]);
    // Рамка профилей - отдельная переменная клиента (border-stroke-profile-inactive) со своим цветом из
    // палитры. Задаём её всегда, а не только при своём цвете: иначе при «Авто» заметность рамок до
    // профилей не доходила. Рамку текущего профиля оформляет его стиль
    out += rule(`${P} ${PROFILE}`, [`--stroke-profile-inactive: ${border}`]);
    // Окна и меню остаются читаемыми при любом фоне карточек
    out += rule(`${P} :is(${POPUPS})`, [
      `background: ${grain}${cm('var(--popover)', Math.max(alpha, 78))} !important`,
      `border-color: ${bw === 0 ? 'var(--stroke)' : border} !important`,
      `backdrop-filter: blur(${Math.max(s.blur, 18)}px) saturate(${s.saturate}%) !important`
    ]);
    out += rule(`${P} [data-sonner-toast]`, [
      `background: ${cm('var(--popover)', Math.max(alpha, 85))} !important`,
      'border-radius: var(--radius) !important',
      `backdrop-filter: blur(${Math.max(s.blur, 18)}px) !important`
    ]);
  }

  // Тени
  if (sh) {
    if (cfg.shadows.cards) {
      out += rule([`${P} ${CARD_BASE}`, `${P} ${TILE}`, `${P} ${PROFILE}`, `${P} [data-slot="accordion"]`, PINNED], ['box-shadow: var(--kt-shadow-card) !important']);
      // Подложка раскрытой группы прокси: у последней строки клиент рисует свою тень (shadow-sm), и при
      // «Без тени» она оставалась. Тень темы ей не даём: она легла бы ступенькой только по бокам
      // последней строки. Тени дают карточки серверов внутри
      out += rule(`${P} div[class*="bg-card/30"]`, ['box-shadow: none !important']);
      // Свои тени клиента (shadow-sm) у выбранного сервера и активного подключения - тоже тенью темы.
      // Стиль выбранного со своей тенью (свечение, неон...) задан ниже и перекрывает эту
      out += rule([SELECTED, `${P} [class*="from-gradient-start-power-on/[0.06]"]`], ['box-shadow: var(--kt-shadow-card) !important']);
    }
    if (cfg.shadows.popups) out += rule([`${P} :is(${POPUPS})`, `${P} [data-sonner-toast]`], ['box-shadow: var(--kt-shadow-pop) !important']);
    // Активная кнопка режима внизу боковой панели (Правила/Глобальный) - как активная вкладка, со своей
    // тенью клиента (shadow-sm), которая иначе оставалась при «Без тени»
    if (cfg.shadows.buttons) out += rule([`${P} [data-slot="button"]:is([data-variant="default"], [data-variant="outline"], [data-variant="destructive"], [data-variant="secondary"])`,
      `${P} [data-slot="tabs-trigger"][data-state="active"]`, `${P} [data-slot="sidebar-footer"] button[class*="from-gradient-start-power-on/15"]`], ['box-shadow: var(--kt-shadow-btn) !important']);
  } else if (s.highlight) {
    // Блик по кромке при тенях «Как в клиенте»: раньше он рисовался только вместе с тенями темы и при
    // тенях клиента молча пропадал. У карточек он идёт одним списком с их тенью клиента (shadow-sm)
    out += rule([`${P} ${CARD_BASE}`, `${P} [data-slot="accordion"]`], [`box-shadow: var(--kt-highlight), ${APP_SHADOW_SM} !important`]);
    out += rule([`${P} ${TILE}`, `${P} ${PROFILE}`], ['box-shadow: var(--kt-highlight) !important']);
  }

  // Раскрытие группы прокси. Каждая строка серверов в клиенте - отдельный элемент списка со своей
  // подложкой, и клиент проявляет строку целиком (proxy-row-enter: прозрачность и сдвиг, задержка
  // строки - инлайн-стилем). Пока строка анимируется, она - отдельный слой: подложка следующей строки
  // ложится поверх теней карточек, а в конце анимации тени разом «догружаются». Прозрачность строки к
  // тому же выключает стекло карточек внутри. Поэтому строка сама не двигается и не проявляется -
  // плавно появляется только её подложка (анимируется --kt-row-k, отдельного слоя это не создаёт), а
  // карточки появляются своей анимацией с задержкой своей строки. Карточки - position: relative:
  // так их тени всегда рисуются поверх подложек соседних строк, а не то поверх, то под ними
  if (rowsFixed(cfg)) {
    const ROW = `${P} .animate-proxy-row-enter`;
    out += rule(ROW, ['animation-name: kt-row-bg !important', 'animation-fill-mode: backwards !important']);
    // Без своих поверхностей подложка как у клиента (bg-card/30, border-border/50), но проявляется
    if (!s.custom) out += rule(ROW, ['background-color: color-mix(in oklab, var(--card) calc(30% * var(--kt-row-k, 1)), transparent)',
      'border-color: color-mix(in oklab, var(--border) calc(50% * var(--kt-row-k, 1)), transparent)']);
    out += rule(PROXY, ['position: relative']);
    out += rule(`${ROW} > div`, ['animation-delay: inherit']);
    // С появлением карточек серверы появляются им (--kt-fresh у строки равна 1), без него - сами
    out += rule(`${ROW} > div > ${PROXY_SEL}`, [cfg.motion.entrance === 'none' && 'animation: kt-row-in var(--kt-dur-slow) var(--kt-ease-out) backwards', 'animation-delay: inherit !important']);
  }

  // Место для теней у края страницы. Страница прокручивается внутри .content (а та - внутри .main),
  // и прокрутка срезает всё, что выходит за её край: тень и свечение карточек обрывались ровной
  // линией у боковой панели и под заголовком. Расширяем области прокрутки наружу, а содержимое
  // возвращаем на место отступом той же величины. Слева у страницы и так есть 8px
  const reach = shadowReach(cfg.shadows, s.hover === 'lift' || s.groupHover === 'lift' || s.profileHover === 'lift');
  const selGlow = (v: SelectedStyle) => v === 'glow' ? 22 : v === 'neon' ? 16 : 0;
  const glowReach = Math.max([s.hover, s.groupHover, s.profileHover].includes('glow') ? 18 : 0, selGlow(s.selected), selGlow(s.profileSelected),
    s.selectedHover === 'glow' || s.profileSelectedHover === 'glow' ? 10 : 0);
  const roomL = Math.min(40, Math.ceil(Math.max(reach.left, glowReach)));
  // Сверху - не больше 16px: прокручиваемое содержимое уходит под заголовок страницы, а он прозрачный.
  // Подъём выносит карточку на 2px вверх вместе с тенью: у самой верхней группы прокси срезалась рамка
  const lifts = [s.hover, s.groupHover, s.selectedHover, s.profileHover, s.profileSelectedHover].includes('lift');
  const roomT = Math.min(TOP_ROOM, Math.ceil(Math.max(reach.top + (lifts ? 2 : 0), glowReach)));
  const content = `${P} .content.custom-scrollbar`;
  if (roomL > 8) {
    out += rule(`${P} .main.overflow-y-auto`, [`margin-left: -${roomL}px`, `padding-left: ${roomL}px`]);
    out += rule(content, [`margin-left: -${roomL}px`, `padding-left: ${roomL}px`]);
    // Списки прокси, правил, логов и подключений прокручиваются сами (react-virtuoso). Список в них
    // спозиционирован абсолютно, поэтому отступ - у обёрток списка, а не у области прокрутки
    out += rule(`${P} [data-virtuoso-scroller]`, [`margin-left: -${roomL}px`]);
    out += rule(`${P} [data-virtuoso-scroller] > div`, [`padding-left: ${roomL}px`]);
    // Боковая панель - над расширенной областью, иначе та перехватит наведение и клики у её края
    out += rule(`${P} [data-slot="sidebar-container"]`, ['z-index: 11']);
  }
  if (roomT > 0) {
    // Высота .content посчитана от высоты окна - отступ в неё не входит (content-box), и низ остаётся на месте
    out += rule(content, ['box-sizing: content-box', `margin-top: -${roomT}px`, `padding-top: ${roomT}px`]);
    out += rule(`${content}::-webkit-scrollbar-track`, [`margin-top: ${roomT}px`]);
    // Список прокси (GroupedVirtuoso) прокручивается сам и срезал верх первой группы ещё раз, по своему
    // краю. Расширяем его вверх, а слой со списком и липкую шапку текущей группы опускаем на место:
    // клиент ставит им top: 0 инлайн-стилем. Шапка при прокрутке липнет там же, где группа стоит в покое.
    // Только у прокси: списки правил, логов и подключений стоят под панелью поиска и накрыли бы её
    const VS = `${P} [class~="h-[calc(100vh-58px)]"] > [data-virtuoso-scroller]`;
    out += rule(VS, [`margin-top: -${roomT}px`, `height: calc(100% + ${roomT}px) !important`]);
    out += rule(`${VS} > :is([data-viewport-type], div:has(> [data-testid="virtuoso-top-item-list"]))`, [`top: ${roomT}px !important`]);
    out += rule(`${VS}::-webkit-scrollbar-track`, [`margin-top: ${roomT}px`]);
  }

  // Боковая панель
  const sbSel = `${P} [data-slot="sidebar-inner"]`;
  // Тень панели - как у карточек: тенью темы, а при тенях «Как в клиенте» - бликом поверх своей тени
  // клиента (shadow-sm). Раньше блик у панели был только вместе с тенями темы
  const sbShadow = sh ? cfg.shadows.cards && 'box-shadow: var(--kt-shadow-card) !important'
    : s.highlight && `box-shadow: var(--kt-highlight), ${APP_SHADOW_SM} !important`;
  // "Как карточки": тот же фон, рамка и стекло, что у карточек (если у карточек свои настройки)
  if (s.sidebar === 'cards' && s.custom) out += rule(sbSel, [`background: ${grain}${fill} !important`, `border-color: ${border} !important`, `border-width: ${bw}px !important`, `backdrop-filter: ${blur} !important`,
    (s.fill === 'glass' || s.fill === 'solid') && sbShadow || 'box-shadow: none !important']);
  if (s.sidebar === 'glass') out += rule(sbSel, [`background: ${glassGrain}${glassFill} !important`, `border-color: ${border} !important`, `backdrop-filter: ${glassBlur} !important`, sbShadow]);
  if (s.sidebar === 'solid') out += rule(sbSel, ['background: var(--card) !important', `border-color: ${border} !important`, 'backdrop-filter: none !important', sbShadow]);
  if (s.sidebar === 'transparent') out += rule(sbSel, ['background: transparent !important', 'border-color: transparent !important', 'box-shadow: none !important', 'backdrop-filter: none !important']);
  if (s.sidebar === 'outline') out += rule(sbSel, ['background: transparent !important', `border-color: ${border} !important`, 'box-shadow: none !important', 'backdrop-filter: none !important']);
  // Переключатель режима внизу панели (Правила/Глобальный) - отдельное окошко со своими фоном и рамкой
  // (bg-card/50 border-stroke), их не меняла ни одна настройка. Повторяет фон панели, а при панели
  // «Как в клиенте» - карточки: толщину, цвет и заметность рамки
  const SW = `${P} [data-slot="sidebar-footer"] div.rounded-lg.border-stroke.backdrop-blur-xl`;
  const sw = s.sidebar === 'app' || s.sidebar === 'cards' ? (s.custom ? 'cards' : 'app') : s.sidebar;
  if (sw === 'cards') out += rule(SW, [`background: ${grain}${fill} !important`, `border-color: ${border} !important`, `border-width: ${bw}px !important`, `backdrop-filter: ${blur} !important`]);
  if (sw === 'glass') out += rule(SW, [`background: ${glassGrain}${glassFill} !important`, `border-color: ${border} !important`, `backdrop-filter: ${glassBlur} !important`]);
  if (sw === 'solid') out += rule(SW, ['background: var(--card) !important', `border-color: ${border} !important`, 'backdrop-filter: none !important']);
  if (sw === 'outline') out += rule(SW, ['background: transparent !important', `border-color: ${border} !important`, 'backdrop-filter: none !important']);
  if (sw === 'transparent') out += rule(SW, ['background: transparent !important', 'border-color: transparent !important', 'backdrop-filter: none !important']);

  // Активный пункт меню
  const nav = `${P} [data-slot="sidebar-menu-button"][data-active="true"]`;
  if (s.navActive === 'fill') out += rule(nav, [`background: ${cm('var(--primary)', 16)} !important`, 'color: var(--primary) !important', 'box-shadow: none !important']);
  if (s.navActive === 'gradient') out += rule(nav, ['background: linear-gradient(135deg, color-mix(in srgb, var(--gradient-start-power-on) 30%, transparent), color-mix(in srgb, var(--gradient-end-power-on) 22%, transparent)) !important', 'box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--stroke-power-on) 45%, transparent) !important']);
  if (s.navActive === 'glow') out += rule(nav, ['background: var(--primary) !important', 'color: var(--primary-foreground) !important', `box-shadow: 0 4px 16px ${cm('var(--primary)', 45)} !important`]);
  if (s.navActive === 'solid') out += rule(nav, ['background: var(--foreground) !important', 'color: var(--background) !important', 'box-shadow: none !important']);
  if (s.navActive === 'bar') {
    out += rule(nav, [`background: ${cm('var(--accent)', 70)} !important`, 'box-shadow: none !important']);
    out += rule(`${nav}::before`, ['content: ""', 'position: absolute', 'left: 0', 'top: 22%', 'bottom: 22%', 'width: 3px', 'border-radius: 3px', 'background: var(--primary)']);
  }
  // Увеличение: рамка клиента, а сам пункт крупнее. Клиент плавно меняет у пунктов только размеры
  // и цвета - добавляем transform, чтобы пункт рос и уменьшался при переходе между страницами
  if (s.navActive === 'scale') {
    out += rule(`${P} [data-slot="sidebar-menu-button"]`, ['transition-property: width, height, padding, color, background-color, box-shadow, transform']);
    out += rule(nav, ['transform: scale(1.06)']);
  }
  if (s.navActive === 'capsule') out += rule(nav, ['border-radius: 999px !important', `background: ${cm('var(--primary)', 16)} !important`, 'color: var(--primary) !important',
    `box-shadow: inset 0 0 0 1px ${cm('var(--primary)', 40)} !important`]);
  if (s.navActive === 'neon') {
    out += rule(nav, [`background: ${cm('var(--primary)', 10)} !important`, 'color: var(--primary) !important',
      `box-shadow: 0 0 0 1px var(--primary), 0 0 8px ${cm('var(--primary)', 45)}, inset 0 0 8px ${cm('var(--primary)', 22)} !important`, `text-shadow: 0 0 8px ${cm('var(--primary)', 60)}`]);
    out += rule(`${nav} > svg`, [`filter: drop-shadow(0 0 3px ${cm('var(--primary)', 70)})`]);
  }
  // Полоска и точка - ::before (::after занят эффектом нажатия). Встают от пункта списка (li.relative)
  if (s.navActive === 'underline') {
    out += rule(nav, ['background: transparent !important', 'box-shadow: none !important']);
    out += rule(`${nav}::before`, ['content: ""', 'position: absolute', 'left: 8px', 'right: 8px', 'bottom: 2px', 'height: 2px', 'border-radius: 2px',
      'background: linear-gradient(90deg, var(--gradient-start-power-on), var(--gradient-end-power-on))']);
  }
  if (s.navActive === 'dot') {
    out += rule(nav, [`background: ${cm('var(--accent)', 70)} !important`, 'box-shadow: none !important']);
    out += rule(`${nav}::before`, ['content: ""', 'position: absolute', 'right: 10px', 'top: 50%', 'width: 6px', 'height: 6px', 'margin-top: -3px', 'border-radius: 50%',
      'background: var(--primary)', `box-shadow: 0 0 6px ${cm('var(--primary)', 70)}`]);
    // В свёрнутой панели от пункта остаётся иконка - точка уходит в угол, чтобы не лечь на неё
    out += rule(`${P} [data-slot="sidebar"][data-state="collapsed"] [data-slot="sidebar-menu-button"][data-active="true"]::before`, ['right: 2px', 'top: 2px', 'width: 5px', 'height: 5px', 'margin-top: 0']);
  }
  // Свой цвет активного пункта. Стили на акценте и цвете кнопки перекрашивают их переменные, у рамки
  // клиента (и «Увеличения» с ней) это цвет рамки, у инверсии - заливка
  const nc = pickColor(s.navColor, s.navCustom);
  if (nc) out += rule(nav, [...accentVars(nc, true), (s.navActive === 'app' || s.navActive === 'scale') && `--tw-ring-color: ${nc}`,
    ...(s.navActive === 'solid' ? [`background: ${nc} !important`, `color: ${onColor(nc)} !important`] : [])]);
  // Тем же цветом - активная кнопка режима (Правила/Глобальный): её градиент и рамка - цвета кнопки подключения
  out += rule(`${P} [data-slot="sidebar-footer"] button[class*="from-gradient-start-power-on/15"]`, accentVars(nc));

  // Выбранный сервер
  const sel = SELECTED;
  const card = cm('var(--card)', s.custom ? alpha : 50);
  const pm = (k: number) => cm('var(--primary)', k);
  const tint = (k: number) => `color-mix(in srgb, var(--primary) ${k}%, ${card})`;
  const bgSel = (bg: string) => `background: ${grain}${bg} !important`;
  const bar = (c: string) => `linear-gradient(${c}, ${c})`;
  // Рамка выбранного - той же толщины, что у остальных карточек: стоило ей стать толще, и при щелчке
  // выбранная карточка вырастала, а прежняя сжималась - ряд прыгал. Если у карточек рамки нет, цвет
  // рамки выбранного рисуем контуром по внутреннему краю: контур не занимает места
  const selOutline = s.custom && bw === 0;
  const bc = (c: string, w = 1): Decl[] => selOutline || w > 1 ? [`outline: ${w}px solid ${c}`, `outline-offset: -${w}px`, w > 1 && 'border-color: transparent !important']
    : [`border-color: ${c} !important`];
  // Контур рисуется поверх фона и псевдоэлементов, и полосы у края (подчёркивание, полоска слева, полоска
  // пинга) теряли под ним пиксель - а при дробном масштабе экрана то один, то два, и толщина полосы
  // плясала от сервера к серверу. Ставим их внутрь контура, как раньше они стояли внутри рамки
  // Насколько контур заходит дальше настоящей рамки (у клиента без своих поверхностей она 1px)
  const frameOf = (v: SelectedStyle) => Math.max(0, (v === 'brutal' ? 2 : selOutline ? 1 : 0) - (s.custom ? bw : 1));
  const fw = frameOf(s.selected);
  const baseSel = s.custom ? [`backdrop-filter: ${blur} !important`, `border-width: ${bw}px !important`] : [];
  // Стили выбранного - и у сервера, и у текущего профиля. ci - отступ уголков от края: у профиля
  // скругление больше, и уголки у самого края оно срезало бы
  const selDecls = (v: Exclude<SelectedStyle, 'app'>, fw: number, ci = 5): Decl[] => ({
    tint: [bgSel(tint(16)), ...bc(pm(55))],
    gradient: [bgSel(`linear-gradient(115deg, ${pm(30)}, ${pm(6)})`), ...bc(pm(50))],
    glow: [bgSel(tint(14)), ...bc(pm(70)), `box-shadow: 0 0 0 1px ${pm(45)}, 0 0 22px ${pm(35)} !important`],
    outline: [bgSel(card), 'border-color: transparent !important', 'box-shadow: inset 0 0 0 2px var(--primary) !important'],
    bar: [bgSel(tint(9)), ...bc(pm(35)), `box-shadow: inset ${3 + fw}px 0 0 var(--primary) !important`],
    power: [bgSel('linear-gradient(115deg, color-mix(in srgb, var(--gradient-start-power-on) 30%, transparent), color-mix(in srgb, var(--gradient-end-power-on) 14%, transparent))'), ...bc('color-mix(in srgb, var(--stroke-power-on) 60%, transparent)')],
    // Неон: яркая рамка, свечение снаружи и внутри
    neon: [bgSel(tint(8)), ...bc('var(--primary)'), `box-shadow: 0 0 4px ${pm(80)}, 0 0 16px ${pm(45)}, inset 0 0 12px ${pm(30)} !important`],
    // Необрутализм: рамка цвета текста и жёсткая тень без размытия, карточка чуть приподнята.
    // Рамка 2px - контуром, по той же причине: настоящая рамка толще обычной раздвигала карточку
    brutal: [bgSel(tint(22)), ...bc('var(--foreground)', 2), 'box-shadow: 4px 4px 0 var(--foreground) !important', 'translate: -2px -2px'],
    stripes: [bgSel(`repeating-linear-gradient(135deg, ${pm(16)} 0 6px, transparent 6px 12px), ${tint(8)}`), ...bc(pm(55))],
    // Блик и сияние анимируют позицию фона - её нельзя задавать с !important, поэтому фон по частям.
    // Сама анимация - в motionRules, общим списком с остальными (selectedAnims)
    shine: [`background-color: ${tint(12)} !important`, 'background-image: linear-gradient(105deg, transparent 38%, rgba(255, 255, 255, 0.16) 50%, transparent 62%) !important',
      'background-size: 250% 100% !important', 'background-repeat: no-repeat !important', ...bc(pm(50))],
    aurora: [`background-color: ${card} !important`, `background-image: linear-gradient(120deg, color-mix(in srgb, var(--gradient-start-power-on) 34%, transparent), ${pm(16)}, color-mix(in srgb, var(--gradient-end-power-on) 34%, transparent), ${pm(10)}) !important`,
      'background-size: 300% 100% !important', ...bc(pm(45))],
    // Уголки-скобки, как рамка прицела. Отступ 5px - чтобы скругление карточки их не срезало
    corners: [bgSel(['left C top C / 12px 2px', 'left C top C / 2px 12px', 'right C top C / 12px 2px', 'right C top C / 2px 12px',
      'left C bottom C / 12px 2px', 'left C bottom C / 2px 12px', 'right C bottom C / 12px 2px', 'right C bottom C / 2px 12px']
      .map((p) => `${bar('var(--primary)')} ${p.replace(/C/g, `${ci}px`)} no-repeat`).join(', ') + `, ${tint(10)}`), ...bc(pm(25))],
    // Вдавленная: внутренние тени, как нажатая клавиша (неоморфизм)
    inset: [bgSel(tint(6)), 'border-color: transparent !important', 'box-shadow: inset 3px 3px 8px rgba(0, 0, 0, 0.35), inset -2px -2px 6px rgba(255, 255, 255, 0.07) !important'],
    spotlight: [bgSel(`radial-gradient(120% 160% at 0% 50%, ${pm(32)}, transparent 62%), ${card}`), ...bc(pm(40))],
    underline: [bgSel(`linear-gradient(90deg, var(--gradient-start-power-on), var(--gradient-end-power-on)) left 0 bottom ${fw}px / 100% 2px no-repeat, ${tint(8)}`), ...bc(pm(25))]
  } satisfies Record<Exclude<SelectedStyle, 'app'>, Decl[]>)[v] ?? [];
  // Свой цвет выбранного сервера - и у стиля клиента: его классы (bg-primary/10, border-primary/30)
  // берут акцент из той же переменной
  out += rule(sel, accentVars(pickColor(s.selectedColor, s.selectedCustom)));
  if (s.selected !== 'app') out += rule(sel, [...baseSel, ...selDecls(s.selected, fw), fw > 0 && `--kt-frame: ${fw}px`]);
  // И у стиля клиента: его рамка (1px) оставалась при рамке карточек 0 - выбранный был выше соседей, и
  // ряд прыгал при каждом щелчке. Цвет рамки клиента (border-primary/30) тогда - контуром
  if (s.selected === 'app' && s.custom) out += rule(sel, [`border-width: ${bw}px !important`, ...(selOutline ? bc(pm(30)) : [])]);

  // Подъём - без transform: под ним браузер растягивает готовую картинку стеклянного слоя, и текст
  // мылится. Карточка поднимается через top на 2px и на столько же вытягивается вниз - нижний край
  // на месте. Иначе курсор на нижнем пикселе рамки оказывается то в карточке, то под ней, и
  // наведение мигает. У карточек серверов и групп своих отступов нет (py-0)
  const LIFT = ['position: relative', 'top: -2px', 'padding-bottom: 2px', 'margin-bottom: -2px'];
  // В покое top должен быть числом: переход от auto не анимируется, top прыгал бы сразу, высота
  // росла бы плавно - и низ на миг уходил бы из-под курсора
  const LIFT_BASE = ['position: relative', 'top: 0'];
  // Увеличение - transform: плавно, хотя текст в увеличенной карточке чуть мягче. Пробовали
  // zoom у содержимого: текст чёткий, но рост идёт рывками. Курсор из увеличенной карточки не
  // выпадает - она растёт во все стороны
  // Переход для сдвига там, где клиент анимирует не всё (transition-colors)
  const moveT = ['top', 'margin', 'padding', 'height', 'transform'].map((p) => `${p} var(--kt-dur) var(--kt-ease)`).join(', ');

  // Наведение на выбранный сервер. Фон выбранного задан с !important, поэтому подсветка клиента
  // (hover:bg-primary/15) не срабатывает - даём свою
  const selHov = `${sel}:hover`;
  const sh2 = s.selectedHover;
  if (sh2 !== 'none') out += rule(sel, [`transition: transform var(--kt-dur) var(--kt-ease), filter var(--kt-dur) var(--kt-ease), border-color var(--kt-dur) var(--kt-ease), outline-color var(--kt-dur) var(--kt-ease), ${moveT} !important`]);
  if (sh2 === 'brighten') out += rule(selHov, ['filter: brightness(1.1) saturate(1.12)']);
  if (sh2 === 'lift') out += rule(sel, LIFT_BASE) + rule(selHov, [...LIFT, 'filter: brightness(1.05)']);
  if (sh2 === 'glow') out += rule(selHov, [`filter: drop-shadow(0 0 10px ${cm('var(--primary)', 45)})`]);
  if (sh2 === 'scale') out += rule(selHov, ['transform: scale(1.025)']);
  if (sh2 === 'shift') out += rule(selHov, [...(s.selected === 'brutal' ? ['outline-color: var(--primary)'] : bc('var(--primary)')), 'filter: brightness(1.06)']);

  // Фон карточки при наведении. Градиент заливки нельзя плавно сменить на цвет: картинка фона
  // меняется скачком, а цвет под ней только начинает проявляться, и карточка на миг становится почти
  // прозрачной - "моргает". Поэтому градиент остаётся, а подсветка - цветом акцента под ним
  const gradFill = s.gradient && (glass || s.fill === 'solid');
  const hoverFill = (k: number) => gradFill ? `background-color: ${cm('var(--accent)', k)} !important`
    : `background: ${grain}color-mix(in srgb, var(--accent) ${k}%, ${cm('var(--card)', alpha)}) !important`;

  // Наведение на обычную карточку сервера
  // Наведение на кнопку пинга внутри карточки - тоже наведение на карточку, как у выбранного сервера
  const hov = `${PROXY}:not([class*="border-primary/"]):hover`;
  const hovBg = s.custom && hoverFill(35);
  // Свой цвет наведения: им рамка и свечение, а подсветка фона - его оттенком. Подсветку и клиент
  // (hover:bg-accent/50), и тема берут из --accent - её и меняем у карточки под курсором
  const hc = pickColor(s.hoverColor, s.hoverCustom);
  const hcol = hc ?? 'var(--primary)';
  const hAcc = hc && `--accent: color-mix(in srgb, ${hc} 22%, var(--card))`;
  if (hAcc && s.hover !== 'none') out += rule(hov, [hAcc]);
  if (s.hover === 'app' && s.custom) out += rule(hov, [hoverFill(50)]);
  // Покой - через :where(), с нулевым весом: селектор карточки сервера тяжелее, чем у наведения на
  // выбранный, и его top: 0 перебивал подъём выбранного - тот только вытягивался вниз и будто опускался
  if (s.hover === 'lift') out += rule(`:where(${PROXY})`, LIFT_BASE) + rule(hov, [...LIFT, sh && 'box-shadow: var(--kt-shadow-hover) !important', hovBg]);
  if (s.hover === 'glow') out += rule(hov, [`border-color: ${cm(hcol, 45)} !important`, `box-shadow: 0 0 18px ${cm(hcol, 20)} !important`]);
  if (s.hover === 'scale') out += rule(hov, ['transform: scale(1.025)', hovBg]);
  if (s.hover === 'border') out += rule(hov, [`border-color: ${hcol} !important`, hovBg]);
  if (s.hover === 'none') out += rule(hov, [s.custom ? `background: ${grain}${fill} !important` : 'background: transparent !important']);

  // Профили (components/profiles/profile-item.tsx). Текущий - aria-selected="true", стили те же, что у
  // выбранного сервера. У карточки профиля свои отступы (px-4 pt-3 pb-2), и всё плавно меняет сам
  // клиент (transition-all), свой переход не нужен
  const PCARD = `${P} ${PROFILE}`;
  const PSEL = `${PCARD}[aria-selected="true"]`;
  const ps = s.profileSelected, psh = s.profileSelectedHover, ph = s.profileHover;
  // Свой цвет профилей - акцентом внутри карточек. Стиль клиента берёт цвета текущего из своих
  // переменных (они посчитаны от акцента палитры) - пересчитываем их от выбранного
  const pc = pickColor(s.profileColor, s.profileCustom);
  if (pc) out += rule(PCARD, [...accentVars(pc), '--profile-active: color-mix(in srgb, var(--primary) 14%, transparent)',
    '--stroke-profile-active: color-mix(in srgb, var(--primary) 55%, var(--card))']);
  if (ps !== 'app') out += rule(PSEL, [...baseSel, ...selDecls(ps, frameOf(ps), 9)]);
  // Подъём - как у серверов, через top, но к своему нижнему отступу карточки (pb-2) прибавляем 2px
  const PLIFT = ['top: -2px', 'padding-bottom: calc(var(--spacing) * 2 + 2px)', 'margin-bottom: -2px'];
  if (psh === 'lift' || ph === 'lift') out += rule(`:where(${PCARD})`, ['top: 0']);
  const pSelHov = `${PSEL}:hover`;
  if (psh === 'brighten') out += rule(pSelHov, ['filter: brightness(1.1) saturate(1.12)']);
  if (psh === 'lift') out += rule(pSelHov, [...PLIFT, 'filter: brightness(1.05)']);
  if (psh === 'glow') out += rule(pSelHov, [`filter: drop-shadow(0 0 10px ${cm('var(--primary)', 45)})`]);
  if (psh === 'scale') out += rule(pSelHov, ['transform: scale(1.02)']);
  if (psh === 'shift') out += rule(pSelHov, [...(ps === 'brutal' ? ['outline-color: var(--primary)'] : bc('var(--primary)')), 'filter: brightness(1.06)']);
  // Остальные профили. «Подсветка» - как в клиенте (hover:bg-accent/60): их фон задан цветом
  // --profile-inactive без !important, и подсветка клиента работает сама
  const pHov = `${PCARD}:not([aria-selected="true"]):hover`;
  if (pc && ph !== 'none') out += rule(pHov, ['--accent: color-mix(in srgb, var(--primary) 22%, var(--card))']);
  if (ph === 'lift') out += rule(pHov, [...PLIFT, sh && 'box-shadow: var(--kt-shadow-hover) !important']);
  if (ph === 'scale') out += rule(pHov, ['transform: scale(1.02)']);
  if (ph === 'glow') out += rule(pHov, [`border-color: ${cm('var(--primary)', 45)} !important`, `box-shadow: 0 0 18px ${cm('var(--primary)', 20)} !important`]);
  if (ph === 'border') out += rule(pHov, ['border-color: var(--primary) !important']);
  if (ph === 'none') out += rule(pHov, ['background-color: var(--profile-inactive) !important']);
  // Переключение: пока ядро перезапускается, у всех карточек aria-busy, а та, на которую щёлкнули,
  // тускнеет и чуть сжимается (opacity-60 scale-[0.98]). Селектор потяжелее правил появления и
  // анимаций текущего профиля - иначе они вытеснили бы пульс
  const BUSY = `${PCARD}[role="button"][aria-busy="true"].opacity-60`;
  const pw = s.profileSwitch;
  if (pw !== 'app') out += rule(BUSY, [pw !== 'pulse' && 'opacity: 1', 'scale: none']);
  if (pw === 'pulse') out += rule(BUSY, ['animation: kt-prof-pulse 0.8s ease-in-out infinite alternate']);
  if (pw === 'shimmer') {
    // Полоса света проезжает по карточке сдвигом (translate) - это делает видеокарта, без перерисовки
    out += rule(BUSY, ['overflow: hidden']);
    out += rule(`${BUSY}::before`, ['content: ""', 'position: absolute', 'inset: 0', 'border-radius: inherit', 'pointer-events: none', 'z-index: 1',
      `background: linear-gradient(105deg, transparent 30%, ${cm('var(--foreground)', 14)} 50%, transparent 70%)`, 'animation: kt-prof-sweep 1.1s ease-in-out infinite']);
  }

  // Наведение на группы прокси и кнопку выбора сервера на главной. Со своими поверхностями их фон
  // задан с !important (карточки и плитки), и подсветка клиента (hover:bg-card/65 и /70) не
  // срабатывает - даём свою. У группы - только пока курсор не на кнопке внутри (поиск, проверка)
  const GROUP = `${P} [data-slot="card"].cursor-pointer.isolate`;
  const HOME = `${P} [data-guide="home-group-selector"] > div`;
  const gh = s.groupHover;
  const gHov = `${GROUP}:not(:has(button:hover, input:hover)):hover`, hHov = `${HOME}:hover`;
  const gBg = s.custom && hoverFill(45);
  // У кнопки на главной клиент плавно меняет только цвет
  if (gh !== 'none') out += rule(HOME, [...LIFT_BASE, `transition: background var(--kt-dur) var(--kt-ease), border-color var(--kt-dur) var(--kt-ease), box-shadow var(--kt-dur) var(--kt-ease), ${moveT}`]);
  if (hAcc && gh !== 'none') out += rule([gHov, hHov], [hAcc]);
  // Подсветка: фон светлее и рамка с оттенком акцента - заметно на любой палитре, даже когда акцент близок к карточке
  if (gh === 'app') out += rule([gHov, hHov], [gBg, `border-color: color-mix(in srgb, ${hcol} 30%, var(--stroke)) !important`]);
  if (gh === 'lift') {
    out += rule(GROUP, LIFT_BASE) + rule(gHov, [...LIFT, sh && 'box-shadow: var(--kt-shadow-hover) !important', gBg]);
    // У кнопки на главной свои отступы и высота (h-9 pl-3 pr-1 py-3) - прибавляем к ним
    out += rule(hHov, ['top: -2px', 'height: calc(2.25rem + 2px)', 'padding-bottom: calc(0.75rem + 2px)', 'margin-bottom: -2px',
      sh && 'box-shadow: var(--kt-shadow-hover) !important', gBg]);
  }
  if (gh === 'scale') {
    // Группа во всю ширину - увеличиваем едва заметно, иначе вылезает за край списка
    out += rule(gHov, ['transform: scale(1.012)', gBg]);
    out += rule(hHov, ['transform: scale(1.04)', gBg]);
  }
  if (gh === 'glow') out += rule([gHov, hHov], [`border-color: ${cm(hcol, 45)} !important`, `box-shadow: 0 0 18px ${cm(hcol, 20)} !important`]);
  if (gh === 'border') out += rule([gHov, hHov], [`border-color: ${hcol} !important`, gBg]);
  // Со своими поверхностями фон и так закреплён, без них - гасим подсветку клиента
  if (gh === 'none' && !s.custom) out += rule([gHov, hHov], [`background-color: ${cm('var(--card)', 50)} !important`]);

  // Иконки групп прокси: картинка от провайдера (Avatar, у клиента bg-transparent) или, если её нет,
  // цветной квадрат по типу группы. Подложка - только под картинкой: у квадрата она своя, цвет типа
  const ICON = `${GROUP} .size-9.rounded-md`;
  const PLATE: Record<Exclude<IconPlate, 'app'>, Decl[]> = {
    soft: [`background: ${cm('var(--foreground)', 8)} !important`, `box-shadow: inset 0 0 0 1px ${cm('var(--stroke)', 70)}`],
    solid: ['background: var(--secondary) !important', 'box-shadow: inset 0 0 0 1px var(--stroke)'],
    tint: [`background: ${cm('var(--primary)', 14)} !important`, `box-shadow: inset 0 0 0 1px ${cm('var(--primary)', 35)}`],
    power: ['background: linear-gradient(135deg, var(--gradient-start-power-on), var(--gradient-end-power-on)) !important',
      'box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 2px 8px color-mix(in srgb, var(--gradient-end-power-on) 35%, transparent)'],
    glass: ['background: linear-gradient(160deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.05)) !important',
      'box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35), inset 0 0 0 1px rgba(255, 255, 255, 0.14), 0 4px 12px rgba(0, 0, 0, 0.18)'],
    // Светлая "плитка приложения": тёмные и цветные логотипы провайдеров рисуют под светлый фон
    white: ['background: #fff !important', 'box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25)']
  };
  if (s.iconPlate !== 'app') out += rule(`${GROUP} [data-slot="avatar"]`, [...accentVars(pickColor(s.iconColor, s.iconCustom)), ...(PLATE[s.iconPlate] ?? []), `padding: ${s.iconPad}px`]);
  if (s.iconShape !== 'app') out += rule(ICON, [`border-radius: ${{ squircle: '32%', circle: '50%', square: '0' }[s.iconShape]} !important`]);
  if (s.iconHover) {
    out += rule(ICON, ['transition: transform var(--kt-dur) var(--kt-ease-out)']);
    out += rule(`${GROUP}:hover .size-9.rounded-md`, ['transform: scale(1.1) rotate(-6deg)']);
  }

  // Кнопки
  const btn = `${P} [data-slot="button"][data-variant="default"]`;
  // Свой цвет основных кнопок: заливка клиента (bg-primary) и все стили кнопок берут его вместо акцента
  out += rule(btn, accentVars(pickColor(s.buttonsColor, s.buttonsCustom), true));
  if (s.buttons === 'glossy') out += rule(btn, ['background: linear-gradient(180deg, color-mix(in oklab, var(--primary) 80%, white), var(--primary)) !important', `box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28), 0 1px 2px rgba(0, 0, 0, 0.2), 0 4px 12px ${cm('var(--primary)', 28)} !important`]);
  if (s.buttons === 'power') out += rule(btn, ['background: linear-gradient(135deg, var(--gradient-start-power-on), var(--gradient-end-power-on)) !important', 'color: var(--kt-on-power) !important', 'border: 0 !important']);
  if (s.buttons === 'glow') {
    out += rule(btn, [`box-shadow: 0 0 0 1px ${cm('var(--primary)', 40)}, 0 6px 20px ${cm('var(--primary)', 45)} !important`]);
    out += rule(`${btn}:hover`, [`box-shadow: 0 0 0 1px ${cm('var(--primary)', 60)}, 0 8px 28px ${cm('var(--primary)', 60)} !important`]);
  }
  if (s.buttons === 'outline') out += rule(btn, ['background: transparent !important', 'color: var(--primary) !important', 'box-shadow: inset 0 0 0 1.5px var(--primary) !important']);
  // Фон этих кнопок задан с !important, и подсветка клиента (hover:bg-primary/90) не срабатывает - даём свою
  const btnHov = `${btn}:hover:not(:disabled)`;
  if (s.buttons === 'glossy' || s.buttons === 'power') out += rule(btnHov, ['filter: brightness(1.12) saturate(1.08)']);
  if (s.buttons === 'outline') out += rule(btnHov, [`background: ${cm('var(--primary)', 12)} !important`]);
  if (s.buttons === 'pill') out += rule(`${P} [data-slot="button"]:not([data-size^="icon"])`, ['border-radius: 999px !important']);
  // Объёмная клавиша: снизу торец, при нажатии кнопка опускается на него
  if (s.buttons === 'pushable') {
    out += rule(btn, ['box-shadow: 0 4px 0 color-mix(in oklab, var(--primary) 55%, black) !important', 'translate: 0 -2px', 'transition: translate 0.12s ease, box-shadow 0.12s ease !important']);
    out += rule(`${btn}:active:not(:disabled)`, ['box-shadow: 0 0 0 color-mix(in oklab, var(--primary) 55%, black) !important', 'translate: 0 2px']);
  }
  // Необрутализм: рамка и жёсткая тень цвета текста
  if (s.buttons === 'brutal') {
    out += rule(btn, ['border: 2px solid var(--foreground) !important', 'box-shadow: 3px 3px 0 var(--foreground) !important', 'transition: translate 0.12s ease, box-shadow 0.12s ease !important']);
    out += rule(`${btn}:hover:not(:disabled)`, ['translate: -1px -1px', 'box-shadow: 4px 4px 0 var(--foreground) !important']);
    out += rule(`${btn}:active:not(:disabled)`, ['translate: 2px 2px', 'box-shadow: 1px 1px 0 var(--foreground) !important']);
  }
  if (s.hover === 'lift') out += rule(`${P} [data-slot="button"]:not([data-variant="ghost"]):not([data-variant="link"]):hover`, ['transform: translateY(-1px)']);
  return out;
}

/* ---------- Флаги ---------- */

function flagRules(cfg: ThemeConfig): string {
  const f = cfg.flags;
  if (f.style === 'app') return '';
  const card = `${P} [data-slot="card"]`;
  // Маленький флаг в названии убираем через ::first-letter: Chromium берёт в него графему целиком, то есть
  // обе буквы-региона флага. font-size: 0 гасит флаг вместе с его тенью, float выносит его из строки - и
  // пробел за флагом оказывается в начале строки и схлопывается. Ничего не обрезается, поэтому свечение
  // и неон у начала имени не срезаются ровной линией (раньше флаг уводили за край сдвигом строки)
  const hideInline = rule(`${card} ${FLAG}::first-letter`, ['font-size: 0', 'float: left']);
  if (f.style === 'hide') return hideInline;

  let out = rule(`${card}:has(${FLAG})`, ['position: relative', 'isolation: isolate']);
  // Флаг ставим от содержимого карточки, а не от неё самой. В покое они совпадают (у карточки сервера
  // нет своих отступов), но «Подъём» вытягивает карточку на 2px вниз, и флаг на середине или на
  // доле высоты поднимался лишь на 1px, а при дробном масштабе экрана - и вовсе стоял на месте
  out += rule(`${card}:has(${FLAG}) > [data-slot="card-content"]`, ['position: relative']);
  if (f.hideInline && (f.style === 'corner' || f.style === 'watermark')) out += hideInline;
  const side = f.side === 'left' ? 'left' : 'right';
  const after = `${card} ${FLAG}::after`;
  // Размытие есть только у флага в углу и водяного знака. У значка и круглого его нет, даже если
  // ползунок остался выставленным от другого стиля - иначе флаг размывался у выбранного и при наведении
  const blurs = f.style === 'corner' || f.style === 'watermark';
  const filterOf = (blur: boolean, gray: boolean, dim = true) => [blur && blurs && f.blur ? `blur(${f.blur}px)` : '',gray && f.grayscale ? 'grayscale(1)' : '', dim && f.dim ? `brightness(${100 - f.dim}%)` : ''].filter(Boolean).join(' ');
  // У значка тень входит в filter, поэтому любая замена filter должна её сохранять
  const SHADOW = 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.25))';
  const withShadow = (flt: string) => (f.style === 'badge' ? [SHADOW, flt].filter(Boolean).join(' ') : flt || 'none');
  const fade = 'transition: opacity var(--kt-dur) var(--kt-ease), filter var(--kt-dur) var(--kt-ease), box-shadow var(--kt-dur) var(--kt-ease)';

  if (f.style === 'corner' || f.style === 'watermark') {
    const water = f.style === 'watermark';
    const filter = filterOf(true, true);
    out += rule(after, [
      'content: attr(title)', 'text-indent: 0', 'position: absolute',
      `${side}: ${px(f.x)}`, `top: ${water ? '50%' : pct(f.y)}`,
      'z-index: -1', 'display: block', 'width: 1.4em', 'overflow: hidden', 'white-space: nowrap',
      `font-size: ${px(f.size)}`, 'line-height: 1',
      `transform: translateY(${water ? '-50%' : '-45%'}) rotate(${f.rotate}deg)`,
      `opacity: ${f.opacity / 100}`, 'pointer-events: none',
      filter && `filter: ${filter}`,
      f.fade && `-webkit-mask-image: linear-gradient(to ${side === 'right' ? 'left' : 'right'}, #000 35%, transparent)`,
      f.fade && `mask-image: linear-gradient(to ${side === 'right' ? 'left' : 'right'}, #000 35%, transparent)`,
      'transition: opacity var(--kt-dur) var(--kt-ease), filter var(--kt-dur) var(--kt-ease), transform var(--kt-dur-slow) var(--kt-ease)'
    ]);
  }
  if (f.style === 'badge' || f.style === 'round') {
    const round = f.style === 'round';
    const box = Math.round(f.size);
    const filter = filterOf(false, true);
    out += rule(`${card}:has(${FLAG}) [data-slot="card-content"]`, [`padding-${side}: ${box + 22}px !important`]);
    out += rule(after, round ? [
      'content: attr(title)', 'position: absolute', `${side}: 12px`, 'top: 50%', 'transform: translateY(-50%)',
      `width: ${box}px`, `height: ${box}px`, 'border-radius: 50%', 'overflow: hidden', 'white-space: nowrap',
      `font-size: ${Math.round(box * 1.55)}px`, `line-height: ${box}px`, `text-indent: -${Math.round(box * 0.26)}px`,
      'box-shadow: 0 0 0 1.5px var(--stroke), 0 2px 6px rgba(0, 0, 0, 0.18)', 'pointer-events: none',
      filter && `filter: ${filter}`, `opacity: ${Math.max(f.opacity, 60) / 100}`, fade
    ] : [
      'content: attr(title)', 'text-indent: 0', 'position: absolute', `${side}: 12px`, 'top: 50%', 'transform: translateY(-50%)',
      'width: 1.16em', 'overflow: hidden', 'white-space: nowrap', `font-size: ${box}px`, 'line-height: 1',
      'border-radius: 4px', `filter: ${withShadow(filter)}`, 'pointer-events: none',
      `opacity: ${Math.max(f.opacity, 60) / 100}`, fade
    ]);
    out += hideInline;
  }
  if (f.grayscale) out += rule(`${card}:hover ${FLAG}::after`, [`filter: ${withShadow(filterOf(true, false))}`]);

  // У выбранного сервера: ярче (без затемнения), без размытия, в цвете.
  // Правило идёт после наведения, чтобы при наведении на выбранный сервер затемнение не возвращалось.
  const boost = f.selectedBoost;
  const baseOpacity = (f.style === 'badge' || f.style === 'round' ? Math.max(f.opacity, 60) : f.opacity) / 100;
  const selFilter = [filterOf(!f.selectedNoBlur, false, !boost), boost && 'brightness(1.08) saturate(1.2)'].filter(Boolean).join(' ');
  const selDecls: Decl[] = [boost && `opacity: ${Math.min(1, Math.round((baseOpacity + 0.25) * 100) / 100)}`];
  if (boost || f.selectedNoBlur || f.grayscale) {
    selDecls.push(`filter: ${f.style === 'badge' && boost ? `${SHADOW} drop-shadow(0 0 5px ${cm('var(--primary)', 60)}) ${selFilter}` : withShadow(selFilter)}`);
  }
  if (boost && f.style === 'round') selDecls.push(`box-shadow: 0 0 0 1.5px var(--primary), 0 2px 8px ${cm('var(--primary)', 35)}`);
  out += rule(`${SELECTED} ${FLAG}::after`, selDecls);
  return out;
}

/* ---------- Анимации ---------- */

function motionRules(cfg: ThemeConfig): string {
  const m = cfg.motion;
  let out = '';
  if (m.easing !== 'app' || m.speed !== 1) {
    out += rule(`${P} :is([data-slot="card"], [data-slot="button"], [data-slot="sidebar-menu-button"], [data-slot="switch"], [data-slot="switch-thumb"], [data-slot="tabs-trigger"], ${TILE}, ${PROFILE})`, [
      'transition-duration: var(--kt-dur) !important', m.easing !== 'app' && 'transition-timing-function: var(--kt-ease) !important'
    ]);
  }
  if (m.entrance !== 'none') {
    // Списки прокси, правил, логов и подключений (react-virtuoso) пересоздают карточки при раскрытии
    // группы и при прокрутке - и появление проигрывалось бы заново у всех групп ниже раскрытой.
    // Поэтому внутри списка оно работает только сразу после открытия страницы: --kt-fresh равна 1,
    // пока идут первые появления, потом 0. Она задаёт размах в ключевых кадрах появления: при 0
    // карточка с первого кадра на месте и видна. В длительность её подставить нельзя - браузер не
    // берёт анимируемую переменную в свойства animation-*
    out += rule(`${P} [data-virtuoso-scroller]`, [`animation: kt-fresh calc(var(--kt-dur-slow) + ${11 * m.stagger + 400}ms) steps(1, end) forwards`]);
    // Серверы только что раскрытой группы появляются как обычно - это и есть их появление
    out += rule(`${P} .animate-proxy-row-enter`, ['--kt-fresh: 1']);
    const targets = `${P} .content :is([data-slot="card"], ${TILE}, ${PROFILE}, [data-slot="accordion"])`;
    out += rule(targets, [`animation: kt-in-${m.entrance} var(--kt-dur-slow) var(--kt-ease-out) backwards`]);
    if (m.stagger > 0) {
      for (let i = 2; i <= 12; i++) {
        const d = `animation-delay: ${(i - 1) * m.stagger}ms`;
        // Раскрывающиеся блоки настроек (accordion) - в общей очереди с карточками, иначе на странице
        // настроек они появлялись разом, вперёд карточек над ними
        out += rule([`${P} .content :is([data-slot="card"], ${TILE}, ${PROFILE}, [data-slot="accordion"]):nth-child(${i})`, `${P} .content :nth-child(${i}) > :is([data-slot="card"], ${PROFILE}):only-child`,
          // В списке react-virtuoso карточка вложена в обёртку элемента списка
          `${P} .content [data-testid="virtuoso-item-list"] > :nth-child(${i}) > * > [data-slot="card"]`], [d]);
      }
    }
  }
  // Стекло во время появления. Пока карточки проявляются, браузер перерисовывает только часть окна,
  // и размытие под стеклом на границе перерисовки ложится полосами. Почти невидимый слой на всё окно
  // меняется каждый кадр, пока идёт появление, - кадр перерисовывается целиком (как у кнопки
  // подключения). .content создаётся заново при открытии страницы, первая строка раскрытой группы
  // (-mt-5) - при раскрытии. После анимации слой скрыт
  if (glassRedraw(cfg)) {
    if (m.entrance !== 'none') out += rule(`${P} .content::after`, [...REDRAW_LAYER, `animation: kt-redraw-in calc(var(--kt-dur-slow) + ${11 * m.stagger + 200}ms) linear`]);
    if (rowsFixed(cfg)) out += rule(`${P} .animate-proxy-row-enter[class~="-mt-5"]::after`, [...REDRAW_LAYER, 'animation: kt-redraw-in calc(var(--kt-dur-slow) + 500ms) linear']);
  }
  // Свои анимации выбранного сервера (блик или сияние фона, «дыхание» рамки) - одним списком, и в нём
  // же появление карточки: правило с одним animation вытесняет все остальные. Раньше появление
  // (оно специфичнее) гасило блик, а «дыхание» - блик и сияние
  const own = selectedAnims(cfg);
  if (own.length) {
    out += rule(SELECTED, [`animation: ${own.join(', ')}`]);
    const enter = 'var(--kt-dur-slow) var(--kt-ease-out) backwards';
    if (m.entrance !== 'none') out += rule(`${P} .content div[data-slot="card"].cursor-pointer[class*="border-primary/"]`, [`animation: ${own.join(', ')}, kt-in-${m.entrance} ${enter}`]);
    else if (rowsFixed(cfg)) out += rule(`${P} .animate-proxy-row-enter > div > ${PROXY_SEL}[class*="border-primary/"]`, [`animation: ${own.join(', ')}, kt-row-in ${enter}`, 'animation-delay: inherit !important']);
  }
  // То же у текущего профиля: блик или сияние - вместе с появлением карточки
  const ownProfile = selectedAnims(cfg, cfg.surfaces.profileSelected, false);
  if (ownProfile.length) {
    out += rule(`${P} ${PROFILE}[aria-selected="true"]`, [`animation: ${ownProfile.join(', ')}`]);
    if (m.entrance !== 'none') out += rule(`${P} .content ${PROFILE}[aria-selected="true"]`, [`animation: ${ownProfile.join(', ')}, kt-in-${m.entrance} var(--kt-dur-slow) var(--kt-ease-out) backwards`]);
  }
  if (m.press) {
    out += rule(`${P} :is(${PROXY_SEL}, [data-slot="button"], ${PROFILE}, [data-slot="sidebar-menu-button"]):active:not(:disabled):not(:has(button:active))`, [`transform: scale(${m.pressScale / 100}) !important`, 'transition-duration: 90ms !important']);
  }
  if (m.popups === 'spring' || m.popups === 'fade') {
    const kf = m.popups === 'spring' ? 'kt-pop-spring' : 'kt-pop-fade';
    out += rule(`${P} :is(${POPUPS}, [data-slot="tooltip-content"])[data-state="open"]`, [`animation: ${kf} var(--kt-dur-slow) ${m.popups === 'spring' ? 'var(--kt-spring)' : 'var(--kt-ease-out)'} !important`]);
    out += rule(`${P} [data-slot="dialog-overlay"][data-state="open"]`, ['animation: kt-pop-fade var(--kt-dur) var(--kt-ease-out) !important']);
  }
  if (m.popups === 'none') out += rule(`${P} :is(${POPUPS}, [data-slot="dialog-overlay"], [data-slot="tooltip-content"])`, ['animation: none !important']);
  return out;
}

function baseKeyframes(cfg: ThemeConfig): Record<string, string> {
  const kf: Record<string, string> = {};
  const KF: Record<string, string> = {
    'bg-pan': 'from { background-position: 0% 30%; } to { background-position: 100% 70%; }',
    'bg-hue': 'to { filter: hue-rotate(360deg); }',
    'bg-breathe': 'from { transform: scale(1); opacity: 0.85; } to { transform: scale(1.12); opacity: 1; }',
    'bg-spin': 'to { transform: rotate(360deg); }',
    'bg-flow': 'to { --kt-flow: 360deg; }',
    // Появление: размах задаёт --kt-fresh (1 - обычное, 0 - карточка сразу на месте, см. motionRules)
    'in-fade': 'from { opacity: calc(1 - var(--kt-fresh, 1)); }',
    'in-rise': 'from { opacity: calc(1 - var(--kt-fresh, 1)); transform: translateY(calc(10px * var(--kt-fresh, 1))); }',
    'in-scale': 'from { opacity: calc(1 - var(--kt-fresh, 1)); transform: scale(calc(1 - 0.05 * var(--kt-fresh, 1))); }',
    'in-blur': 'from { opacity: calc(1 - var(--kt-fresh, 1)); filter: blur(calc(8px * var(--kt-fresh, 1))); }',
    'in-slide': 'from { opacity: calc(1 - var(--kt-fresh, 1)); transform: translateX(calc(-14px * var(--kt-fresh, 1))); }',
    'in-flip': 'from { opacity: calc(1 - var(--kt-fresh, 1)); transform: perspective(600px) rotateX(calc(-18deg * var(--kt-fresh, 1))) translateY(calc(6px * var(--kt-fresh, 1))); }',
    'pop-spring': 'from { opacity: 0; scale: 0.9; }',
    'pop-fade': 'from { opacity: 0; }'
  };
  // Ключевые кадры - только известных анимаций: неизвестное имя из повреждённого конфига роняло сборку CSS
  for (const a of new Set([cfg.background.light.animation, cfg.background.dark.animation])) if (KF[`bg-${a}`]) kf[`bg-${a}`] = KF[`bg-${a}`];
  if (cfg.motion.entrance !== 'none') {
    if (KF[`in-${cfg.motion.entrance}`]) kf[`in-${cfg.motion.entrance}`] = KF[`in-${cfg.motion.entrance}`];
    kf.fresh = 'from { --kt-fresh: 1; } to { --kt-fresh: 0; }';
  }
  if (cfg.motion.popups === 'spring') kf['pop-spring'] = KF['pop-spring'];
  if (cfg.motion.popups === 'spring' || cfg.motion.popups === 'fade') kf['pop-fade'] = KF['pop-fade'];
  // Раскрытие группы: подложка строки проявляется, серверы без своего появления выезжают сами (см. surfaceRules)
  if (rowsFixed(cfg)) {
    kf['row-bg'] = 'from { --kt-row-k: 0; }';
    if (cfg.motion.entrance === 'none') kf['row-in'] = 'from { opacity: 0; translate: 0 -8px; }';
  }
  // Слой перерисовки на время появления: прозрачность меняется каждый кадр, вне анимации слой скрыт
  if (glassRedraw(cfg) && (cfg.motion.entrance !== 'none' || rowsFixed(cfg))) kf['redraw-in'] = 'from { visibility: visible; opacity: 0.002; } to { visibility: visible; opacity: 0.004; }';
  // Выбранный сервер: блик проезжает слева направо, сияние переливается туда-обратно
  const sel = [cfg.surfaces.selected, cfg.surfaces.profileSelected];
  if (sel.includes('shine')) kf['sel-shine'] = '0%, 20% { background-position: 130% 0; } 80%, 100% { background-position: -30% 0; }';
  if (sel.includes('aurora')) kf['sel-aurora'] = 'from { background-position: 0% 50%; } to { background-position: 100% 50%; }';
  // Переключение профиля: карточка мерцает или по ней проезжает полоса света
  if (cfg.surfaces.profileSwitch === 'pulse') kf['prof-pulse'] = 'from { opacity: 1; } to { opacity: 0.45; }';
  if (cfg.surfaces.profileSwitch === 'shimmer') kf['prof-sweep'] = 'from { translate: -100% 0; } to { translate: 100% 0; }';
  return kf;
}

const kfCss = (kf: Record<string, string>) =>
  Object.entries(kf).map(([k, v]) => `@keyframes kt-${k} {\n    ${v.replace(/\} /g, '}\n    ')}\n}\n`).join('');

const PROPS: Record<string, string> = {
  '--kt-rip': 'syntax: "<percentage>"; inherits: false; initial-value: 0%;',
  '--kt-shine': 'syntax: "<percentage>"; inherits: false; initial-value: -70%;',
  '--kt-ang': 'syntax: "<angle>"; inherits: false; initial-value: 0deg;',
  // Наследуется: её читают карточки внутри списка
  '--kt-fresh': 'syntax: "<number>"; inherits: true; initial-value: 1;',
  '--kt-row-k': 'syntax: "<number>"; inherits: false; initial-value: 1;',
  '--kt-flow': 'syntax: "<angle>"; inherits: false; initial-value: 0deg;'
};

/* ---------- Шрифты ---------- */

function fontRules(cfg: ThemeConfig): string {
  const f = cfg.fonts;
  let out = '';
  if (f.scale !== 100) out += rule(`html${P}`, [`font-size: ${f.scale}%`]);
  out += rule(`${P} body`, [
    f.ui && `font-family: ${fontStack(f.ui, 'sans')}`,
    f.weight !== 400 && `font-weight: ${f.weight}`,
    f.letterSpacing !== 0 && `letter-spacing: ${f.letterSpacing / 100}em`,
    f.tabular && 'font-variant-numeric: tabular-nums',
    f.smoothing && '-webkit-font-smoothing: antialiased',
    f.smoothing && 'text-rendering: optimizeLegibility'
  ]);
  // Названия серверов (.flag-emoji) клиент рисует своим набором шрифтов - подменяем, сохраняя twemoji для флагов
  if (f.ui) out += rule(`${P} .flag-emoji`, [`font-family: ${fontStack(f.ui, 'sans', true)}`]);
  // Фикс флагов: у описания сервера и других текстов карточки нет класса flag-emoji, и в Windows
  // флаги в них показываются буквами (NL, DE). Добавляем им шрифт twemoji в конец набора
  if (f.flagFix) out += rule(`${P} [data-slot="card"] :is(p, span, div):not(:has(*)):not(.flag-emoji):not([data-slot="button"] *)`, [`font-family: ${fontStack(f.ui || 'system-ui', 'sans', true).replace('"system-ui", ', '')} !important`]);
  out += rule(`${P} :is(.title, h1, h2, h3, h4, [data-slot="dialog-title"], [data-slot="card-title"], .inline-grid.uppercase)`, [
    f.heading && `font-family: ${fontStack(f.heading, 'sans')}`,
    f.headingWeight !== 600 && `font-weight: ${f.headingWeight}`
  ]);
  if (f.uppercaseTitles) out += rule(`${P} .title`, ['text-transform: uppercase', 'letter-spacing: 0.08em', 'font-size: 0.95rem']);
  // Запасной набор у цифр - по самому шрифту. Если шрифт не загрузится (Google Fonts в клиенте
  // заблокированы), немоноширинный шрифт уступает место обычному шрифту клиента, и цифры не меняются.
  // Раньше запасным всегда был моноширинный набор, и вместо Tektur цифры рисовались Cascadia Mono
  if (f.mono) out += rule(`${P} :is(.tabular-nums, .font-bold.text-base, time, [data-slot="card"] [data-slot="button"] > span > span)`, [`font-family: ${fontStack(f.mono, isMonoFont(f.mono) ? 'mono' : 'sans')}`]);
  // Тень текста
  if (f.textShadow !== 'none') {
    for (const { scheme, sel } of schemeScopes(cfg.mode)) {
      const ts = textShadowCss(cfg, scheme);
      if (!ts) continue;
      const target = f.textShadowTarget === 'all' ? `${sel} body` : `${sel} :is(.title, h1, h2, h3, h4, [data-slot="dialog-title"], .inline-grid.uppercase, .font-bold.text-base)`;
      out += rule(target, [`text-shadow: ${ts}`]);
    }
    // Названия серверов, профилей, правил и подключений обрезаются многоточием (truncate: overflow
    // hidden), и тень срезалась ровной линией по краю строки. overflow: clip с запасом выпускает тень
    // наружу, а многоточие работает как раньше. Блоки-раскладки (flex, grid) не трогаем: их
    // содержимое без многоточия вылезло бы за край
    const reach = textClipReach(cfg);
    if (reach > 0) {
      const LINE = `${P} :is(.truncate, .text-ellipsis.overflow-hidden, .whitespace-nowrap.overflow-hidden):not(.flex, .grid)`;
      out += rule(LINE, ['overflow: clip', `overflow-clip-margin: ${reach}px`]);
      // С clip строка во flex-ряду перестаёт сжиматься уже текста (в отличие от hidden), и длинное имя
      // уезжало под кнопку пинга без многоточия. Возвращаем сжатие, не трогая заданные клиентом min-w-*
      out += rule(`${LINE}:not([class*="min-w-"])`, ['min-width: 0']);
      // Подробности узла «одна строка» и «скрыто» (настройки группы в клиенте): имя сервера лежит в
      // flex-ряду, который сам обрезается (flex text-ellipsis overflow-hidden whitespace-nowrap), и тень
      // срезалась уже по нему. В ряду только имя с многоточием и короткий тип - выпускаем тень и тут
      const ROW_LINE = `${P} .flex.text-ellipsis.overflow-hidden.whitespace-nowrap`;
      out += rule(ROW_LINE, ['overflow: clip', `overflow-clip-margin: ${reach}px`]);
      out += rule(`${ROW_LINE}:not([class*="min-w-"])`, ['min-width: 0']);
    }
  }
  return out;
}

/** Запас под тень текста у строк с многоточием, px (overflow-clip-margin); 0 - тени нет. Без потолка:
 * у неона с сильным размытием свечение уходит на 84px, и прежний потолок 40px срезал его заметной гранью */
function textClipReach(cfg: ThemeConfig): number {
  return cfg.fonts.textShadow === 'none' ? 0 : Math.ceil(textShadowReach(cfg));
}

/* ---------- Мелочи ---------- */

function extrasRules(cfg: ThemeConfig): string {
  const e = cfg.extras;
  let out = '';
  if (e.scrollbar === 'hidden') out += rule(`${P} *::-webkit-scrollbar`, ['width: 0 !important', 'height: 0 !important']);
  if (e.scrollbar === 'thin' || e.scrollbar === 'accent') {
    out += rule(`${P} *::-webkit-scrollbar`, ['width: 10px', 'height: 10px']);
    out += rule([`${P} *::-webkit-scrollbar-track`, `${P} *::-webkit-scrollbar-corner`], ['background: transparent !important']);
    const thumb = e.scrollbar === 'accent'
      ? 'linear-gradient(180deg, var(--gradient-start-power-on), var(--gradient-end-power-on)) padding-box'
      : `${cm('var(--foreground)', 22)} padding-box`;
    out += rule(`${P} *::-webkit-scrollbar-thumb`, [`background: ${thumb} !important`, 'border: 3px solid transparent !important', 'border-radius: 999px', 'min-height: 32px']);
    out += rule(`${P} *::-webkit-scrollbar-thumb:hover`, ['border-width: 2px !important', e.scrollbar === 'thin' && `background: ${cm('var(--foreground)', 40)} padding-box !important`]);
  }
  if (e.selection) out += rule(`${P} ::selection`, [`background: ${cm('var(--primary)', 35)}`, 'color: var(--foreground)']);
  if (e.focusRing) out += rule(`${P} :focus-visible`, [`--tw-ring-color: ${cm('var(--ring)', 65)} !important`, `outline-color: ${cm('var(--ring)', 65)} !important`]);

  const tip = `${P} [data-slot="tooltip-content"]`;
  if (e.tooltip === 'card') {
    out += rule(tip, ['background: var(--popover) !important', 'color: var(--popover-foreground) !important', 'border: 1px solid var(--stroke)', 'box-shadow: var(--kt-shadow-pop, 0 8px 24px rgba(0, 0, 0, 0.2))']);
    out += rule(`${tip} svg`, ['fill: var(--popover) !important', 'background: var(--popover) !important']);
  }
  if (e.tooltip === 'accent') {
    out += rule(tip, ['background: var(--primary) !important', 'color: var(--primary-foreground) !important']);
    out += rule(`${tip} svg`, ['fill: var(--primary) !important', 'background: var(--primary) !important']);
  }
  if (e.tooltip === 'glass') {
    out += rule(tip, [`background: ${cm('var(--popover)', 70)} !important`, 'color: var(--popover-foreground) !important', 'border: 1px solid var(--stroke)', 'backdrop-filter: blur(14px)']);
    // Стрелку (ромб цвета текста) Radix рисует с инлайн-стилем display: block - без !important она остаётся
    out += rule(`${tip} svg`, ['display: none !important']);
  }

  const title = `${P} .title`;
  if (e.title === 'gradient') out += rule(title, ['background: linear-gradient(90deg, var(--foreground), var(--primary) 70%, var(--gradient-start-power-on))', '-webkit-background-clip: text', 'background-clip: text', 'color: transparent !important', 'font-weight: 700']);
  if (e.title === 'accent') out += rule(title, ['color: var(--primary) !important', 'font-weight: 650']);
  if (e.title === 'outline') out += rule(title, ['color: transparent !important', '-webkit-text-stroke: 1px var(--foreground)', 'font-weight: 800', 'letter-spacing: 0.02em']);

  if (e.statusColor) {
    // Надпись состояния - соседний блок перед кнопкой подключения
    out += rule(`${P} div:has(+ [data-guide="home-power-toggle"] > div[class*="border-stroke-power-on"]) .uppercase`, ['color: var(--stroke-power-on) !important', 'text-shadow: 0 0 18px color-mix(in srgb, var(--stroke-power-on) 45%, transparent)']);
    out += rule(`${P} div:has(+ [data-guide="home-power-toggle"] > div > div > img:nth-child(4).opacity-100) .uppercase`, ['color: var(--destructive) !important']);
  }
  return out;
}

/* ---------- Сборка ---------- */

const MODE_TEXT: Record<ThemeConfig['mode'], string> = {
  both: 'светлая и тёмная палитры (переключаются вместе с темой клиента)',
  dark: 'одна тёмная палитра для обоих режимов клиента',
  light: 'одна светлая палитра для обоих режимов клиента'
};

export function encodeConfig(cfg: ThemeConfig): string {
  const bytes = new TextEncoder().encode(JSON.stringify(cfg));
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/(.{100})/g, '$1\n');
}

export function decodeConfig(css: string): unknown | null {
  const m = css.match(/koala-theme:config\s+([A-Za-z0-9+/=\s]+?)\s*\*\//);
  if (!m) return null;
  try {
    const bin = atob(m[1].replace(/\s+/g, ''));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

export interface GenerateOptions { embedConfig?: boolean; date?: Date }

export function generateCSS(cfg: ThemeConfig, opts: GenerateOptions = {}): string {
  const name = (cfg.name || 'Моя тема').replace(/\*\//g, '').replace(/[\r\n]+/g, ' ').trim();
  const date = (opts.date ?? new Date()).toLocaleDateString('ru-RU');
  const desc = cfg.description.trim().replace(/\*\//g, '');
  const imports = cfg.fonts.imports.filter(isGoogleFontsUrl);
  const m = cfg.motion;
  let n = 0;

  let css = `/* ${name} */\n/*\n  Тема для Koala Clash, собрана в конструкторе koala-theme ${date}.\n`;
  if (cfg.author.trim()) css += `  Автор: ${cfg.author.trim().replace(/\*\//g, '')}\n`;
  if (desc) css += `\n${desc.split('\n').map((l) => `  ${l}`).join('\n')}\n`;
  css += `\n  Режим: ${MODE_TEXT[cfg.mode]}.\n`;
  css += `  Установка: провайдер отдаёт в ответе подписки заголовок custom-css со ссылкой на этот файл,\n`;
  css += `  клиент скачает тему при обновлении подписки.\n`;
  css += `  Редактирование: откройте файл в koala-theme (кнопка "Импорт") - настройки сохранены в конце файла.\n*/\n`;
  if (imports.length) {
    css += `\n/* Шрифты Google Fonts. В клиенте действует CSP (default-src 'self'), и внешние шрифты там не\n   загружаются - шрифт появится, только если установлен в Windows: тема найдёт его по имени */\n`;
    css += imports.map((u) => `@import url("${u.replace(/"/g, '')}");`).join('\n') + '\n';
  }

  const easing = m.easing === 'app' ? 'smooth' : m.easing;
  const settings = rule(P, [
    Math.abs(cfg.surfaces.radius - 0.625) > 0.001 && `--radius: ${cfg.surfaces.radius}rem !important`,
    `--kt-ease: ${EASE[easing]}`,
    `--kt-ease-out: ${easing === 'linear' ? 'linear' : EASE[easing === 'spring' ? 'smooth' : easing]}`,
    `--kt-spring: ${EASE.spring}`,
    `--kt-dur-fast: ${Math.round(140 * m.speed)}ms`,
    `--kt-dur: ${Math.round(220 * m.speed)}ms`,
    `--kt-dur-slow: ${Math.round(440 * m.speed)}ms`
  ]);
  css += section(++n, 'Настройки', 'Скругление углов, кривые и длительности анимаций', settings);

  for (const { scheme, sel } of schemeScopes(cfg.mode)) {
    css += section(++n, `Палитра: ${scheme === 'dark' ? 'тёмная' : 'светлая'}`, cfg.mode === 'both' ? `Действует, когда в клиенте выбрана ${scheme === 'dark' ? 'тёмная' : 'светлая'} тема` : 'Действует в обоих режимах клиента', paletteRules(cfg, scheme, sel));
  }

  css += section(++n, 'Шрифты', '', fontRules(cfg));

  const kfs: Record<string, string> = {};
  let bgCss = '';
  for (const { scheme, sel } of schemeScopes(cfg.mode)) bgCss += backgroundRules(cfg, scheme, sel, kfs);
  css += section(++n, 'Фон окна', 'Корневой контейнер [data-slot="sidebar-wrapper"]. Клиент задаёт ему цвет инлайн-стилем,\nпоэтому нужен !important. ::before - градиент или картинка, ::after - частицы, узор, зерно, виньетка', bgCss);
  css += section(++n, 'Карта на фоне', 'Картинка map_darktheme / map_lighttheme из App.tsx', mapRules(cfg));
  css += section(++n, 'Поверхности', 'Карточки, плитки главной, боковая панель, окна, меню, выбранный сервер, кнопки, тени', surfaceRules(cfg));
  css += section(++n, 'Кнопка подключения', 'pages/home.tsx, data-guide="home-power-toggle". Состояния определяются по классам круга и видимой иконке', powerRules(cfg, rule, glassLook(cfg.surfaces)));
  css += section(++n, 'Флаги серверов', 'Название сервера - <span class="flag-emoji" title="...">. Правила срабатывают, только если\nназвание начинается с флага (буквы-регионы U+1F1E6...U+1F1FF)', flagRules(cfg));

  const div = dividerRules(cfg, rule);
  if (div.css) css += section(++n, 'Разделители', 'Горизонтальные полосы (Separator: настройки, правила, логи, окна) и вертикальные на главной', div.css);

  const click = clickRules(cfg, rule);
  const fun = funRules(cfg, rule);
  css += section(++n, 'Разное', 'Подсветка по пингу, реакция фона на подключение, бегущая рамка, «дыхание» выбранного', fun.css);

  const props = [...new Set([...click.props, ...fun.props, ...(m.entrance !== 'none' ? ['--kt-fresh'] : []), ...(rowsFixed(cfg) ? ['--kt-row-k'] : []),
    ...(cfg.background.light.animation === 'flow' || cfg.background.dark.animation === 'flow' ? ['--kt-flow'] : [])])];
  const propsCss = props.map((p) => `@property ${p} {\n    ${PROPS[p].replace(/; /g, ';\n    ')}\n}\n`).join('');
  const allKf = { ...baseKeyframes(cfg), ...powerKeyframes(cfg), ...fun.keyframes, ...div.keyframes, ...kfs };
  css += section(++n, 'Анимации', 'Переходы, появление карточек, эффект нажатия, ключевые кадры', propsCss + motionRules(cfg) + click.css + kfCss(allKf));
  css += section(++n, 'Мелочи', 'Полоса прокрутки, выделение текста, подсказки, заголовок страницы', extrasRules(cfg));
  if (m.reduce) {
    css += section(++n, 'Уменьшение анимации', 'Если в системе выключены эффекты анимации, всё становится мгновенным', `@media (prefers-reduced-motion: reduce) {\n    ${P} *, ${P} *::before, ${P} *::after {\n        animation-duration: 0.01ms !important;\n        animation-iteration-count: 1 !important;\n        transition-duration: 0.01ms !important;\n    }\n}\n`);
  }
  if (cfg.extras.customCss.trim()) css += section(++n, 'Свой CSS', 'Добавлено вручную в конструкторе', cfg.extras.customCss.trim() + '\n');
  if (opts.embedConfig !== false) css += `\n/* koala-theme:config\n${encodeConfig(cfg)}\n*/\n`;
  return css;
}
