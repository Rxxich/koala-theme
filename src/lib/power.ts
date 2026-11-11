// Кнопка подключения (pages/home.tsx, data-guide="home-power-toggle").
//
// Разметка: <button> → <div> (круг 128px, классы состояния) → <div class="relative size-16">
// → [svg-спиннер, img пауза, img питание, img ошибка]. Состояние определяется по классам:
//   подключено - у круга класс border-stroke-power-on;
//   подключение - у спиннера класс opacity-100;
//   ошибка - у 4-й иконки (alert) класс opacity-100.
//
// Слои, которые использует тема:
//   button::after        - подсветка позади кнопки (общая для всех стилей)
//   button::before       - декор стиля снаружи круга (кольцо, орбита, волны)
//   круг::before/::after - декор внутри круга (звёзды, луч радара, жидкость)
//   иконки::before/after - рисунок вместо иконки (ракета и пламя, эквалайзер, кардиограмма)

import particleSphere from '../snippets/particle-sphere.css?raw';
import { inkOf, orbBody, orbBodyLight, PRISM_INK, PRISM_INK_LIGHT, ribbonImage, rimImage } from './caustic';
import { mix } from './color';
import { type Curve, FPS, halfOf, pace, paceDecl } from './frames';
import { hasHighlight } from './shadows';
import { sphereImage } from './sphere';
import type { Palette, Scheme, ThemeConfig } from './types';

const B = ':root [data-guide="home-power-toggle"]';
const C = `${B} > div`;
const I = `${B} > div > div`;
const ICONS = `${I} > :is(img, svg)`;
const ON_HAS = ':has(> div[class*="border-stroke-power-on"])';
const LOAD_HAS = ':has(svg[role="status"].opacity-100)';
const ERR_HAS = ':has(> div > div > img:nth-child(4).opacity-100)';
const ON = `${B}${ON_HAS}`;
const LOAD = `${B}${LOAD_HAS}`;
const ERR = `${B}${ERR_HAS}`;
/** Выключено и не подключается (покой) */
const IDLE = `${B}:not(${ON_HAS}):not(${LOAD_HAS})`;

/** Стили, у которых круг не перекрашивается самим стилем: им доступны цвет рамки, внешнее кольцо и объём */
export const POWER_PLAIN: readonly string[] = ['app', 'glow', 'pulse', 'ring'];
/** Стили, которые можно растянуть в ширину (у орбиты и шаров рисунок рассчитан на круг) */
export const POWER_STRETCH: readonly string[] = ['app', 'glow', 'pulse', 'ring', 'glass', 'neon', 'minimal', 'radar', 'liquid', 'portal'];
/** Тумблеры: своя форма дорожки, форма и заливка круга к ним не применяются */
export const POWER_TOGGLES: readonly string[] = ['toggle', 'daynight'];

/** Объём круга - внутренние тени */
const VOLUME: Record<ThemeConfig['power']['volume'], string[]> = {
  none: [],
  convex: ['inset 0 2px 2px rgba(255, 255, 255, 0.35)', 'inset 0 -10px 18px rgba(0, 0, 0, 0.28)'],
  concave: ['inset 0 8px 16px rgba(0, 0, 0, 0.38)', 'inset 0 -2px 2px rgba(255, 255, 255, 0.2)'],
  gloss: ['inset 0 1px 1px rgba(255, 255, 255, 0.55)']
};
/** Глянец - светлая шапка сверху, отдельным верхним слоем фона */
const GLOSS = 'radial-gradient(120% 75% at 50% 0%, rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0.08) 58%, transparent 60%)';

/** Стили, которые движутся всё время, и те, что только при подключении и подключено */
const MOVING_ALWAYS = ['liquid', 'plasma', 'portal'];
const MOVING_ON = ['pulse', 'ring', 'network', 'globe', 'dots', 'sphere', 'caustic', 'rocket', 'orbit', 'radar', 'equalizer', 'heartbeat'];
/** Тумблер, на ручке которого «Шар света» */
const orbToggle = (pw: ThemeConfig['power']) => pw.style === 'toggle' && pw.toggleLook === 'orb';
/** Дорожка тумблера: длинная и короткая сторона и ход ручки от середины, px. «Нить» - узкая длинная капсула с бусиной */
export const toggleTrack = (pw: ThemeConfig['power']) => pw.toggleLook === 'filament' ? { long: 176, short: 52, travel: 70 } : { long: 152, short: 74, travel: 39 };
/** Отрезков в кадрах kt-orb-twist и точек орбиты: с такими числами ступеньки ложатся на общую сетку кадров (frames.ts) */
const ORB_PARTS = 10, ORBIT_POINTS = 32;

/** Когда кнопка анимирована - условие для :root (без вложенного :has, его браузер не принимает), иначе null */
function movingWhen(pw: ThemeConfig['power']): string | null {
  if (!pw.animate) return null;
  const btn = '[data-guide="home-power-toggle"]';
  if (MOVING_ALWAYS.includes(pw.style) || (pw.idle !== 'none' && pw.style !== 'sphere')) return `:root:has(${btn})`;
  if (MOVING_ON.includes(pw.style) || orbToggle(pw) || (pw.glowPulse && pw.glow > 0)) return `:root:has(${btn} > div[class*="border-stroke-power-on"], ${btn} svg[role="status"].opacity-100)`;
  return null;
}

type Decl = string | false | null | undefined | 0;
type RuleFn = (selector: string | string[], decls: Decl[]) => string;

/** Стекло карточек из «Поверхностей» (glassLook в генераторе): зерно, заливка, фильтр, цвет рамки */
/** filterPower - то же стекло для кнопки подключения: у жидкого light полоса повторяет её скругление */
/** layer - если кромка отражает то, что вокруг: стекло рисует слой больше кнопки на pad px, его фильтр - filter */
/** rimOver - если кромка отражает то, что на кнопке (значок, ручку тумблера): фильтр слоя поверх них */
/** tint - заливка без привязки к рамке (fill - с border-box под световой рамкой), tintAlpha - её наименьшая непрозрачность, 0-1 */
export interface GlassLook { grain: string; fill: string; tint: string; tintAlpha: number; filter: string; filterPower: string; layer: { pad: number; filter: string } | null; rimOver: string | null; stroke: string; edge: boolean }

/** Кнопка подключения - из стекла карточек: стиль «Стекло» или стеклянный тумблер */
export const powerGlassy = (pw: ThemeConfig['power']) => pw.style === 'glass' || (pw.style === 'toggle' && pw.toggleLook !== 'classic');

/**
 * Стекло кнопки с отражением того, что вокруг. Как у карточек (generator.ts, surfaceRules): стекло рисует
 * слой ::before круга, больше круга на pad px с каждой стороны, - так у края есть то, что лежит рядом,
 * в том числе подсветка позади кнопки. Круг - без своего стекла и заливки: заливка с бликом шара лежит на
 * слое поверх стекла, внутренние тени круга слой рисует сам (inherit). Скругление - только маской
 */
const glassLayer = (layer: NonNullable<GlassLook['layer']>, radius: string, bg: string): Decl[] => [
  'content: ""', 'position: absolute', `inset: -${layer.pad}px`, `border: ${layer.pad}px solid transparent`, `border-radius: ${radius}`,
  'z-index: -1', 'pointer-events: none', `backdrop-filter: ${layer.filter}`, 'mask: linear-gradient(#000 0 0) padding-box',
  `background: ${bg}`, 'box-shadow: inherit'
];
/**
 * Рамка стеклянной кнопки толщиной w. Световой рамке (generator.ts, edgeFrame) нужна ненулевая, а цвет у неё
 * прозрачный. !important обязателен: border с ним сбрасывает и border-image, и обычное значение не проходит
 */
const glassBorder = (glass: GlassLook, w: number): Decl[] => [`border: ${glass.edge ? Math.max(1, w) : w}px solid ${glass.stroke} !important`, glass.edge && 'border-image: var(--kt-edge-pw-f) !important'];
/** Фон круга - на слой: его край - край круга внутри рамки (padding-box), а не край слоя */
const onLayer = (bg: string) => bg.replaceAll(' border-box', ' padding-box');
/** Отражение того, что на кнопке: слой поверх значка отдаёт только полосу у края, прозрачную вне отражения (как у карточек) */
const rimOverlay = (filter: string): Decl[] => ['content: ""', 'position: absolute', 'inset: 0', 'border-radius: inherit', 'z-index: 1', 'pointer-events: none',
  `backdrop-filter: ${filter}`];

/** Орбита: полуоси эллипса, запас под спутник (px) и радиус круга кнопки, который загораживает дальнюю половину */
const ORBIT = { a: 92, b: 26, pad: 8, r: 64 };
const ORBIT_MASK = `linear-gradient(transparent 50%, #000 50%), radial-gradient(circle at 50% 50%, transparent ${ORBIT.r - 0.5}px, #000 ${ORBIT.r + 0.5}px)`;
/** Положение двух спутников (напротив друг друга) для угла t на орбите */
function orbitPos(t: number): string {
  const { a, b, pad } = ORBIT;
  const at = (k: number) => `${Math.round((a + pad + (a - 1) * Math.cos(k) - 8) * 10) / 10}px ${Math.round((b + pad + (b - 1) * Math.sin(k) - 8) * 10) / 10}px`;
  return `${at(t)}, ${at(t + Math.PI)}`;
}

const svgUrl = (svg: string) => `url("data:image/svg+xml,${svg.replace(/"/g, "'").replace(/#/g, '%23').replace(/</g, '%3C').replace(/>/g, '%3E').replace(/\s+/g, ' ')}")`;

/** Иконки клиента (assets/on_icon.svg, pause_icon.svg, alert_icon.svg) с подменой цвета */
export const POWER_ICONS = {
  pause: (c: string) => svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72" fill="none"><path d="M21 10V62M51 10V62" stroke="${c}" stroke-width="9" stroke-linecap="round"/></svg>`),
  power: (c: string) => svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72" fill="none"><path d="M56.4 19.63a28.5 28.5 0 1 1-40.31 0M36.27 5.25v31" stroke="${c}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>`),
  alert: (c: string) => svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72" fill="none"><path d="M36 9V43" stroke="${c}" stroke-width="8" stroke-linecap="round"/><circle cx="36" cy="60.5" r="5.5" fill="${c}"/></svg>`)
};

function rocketSvg(p: Palette, scheme: Scheme): string {
  const body = scheme === 'dark' ? '#eef1f7' : '#f7f8fb';
  const shade = scheme === 'dark' ? '#c9d0de' : '#d5dae4';
  return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <path d="M19 34 9 44v7l10-5z M45 34l10 10v7l-10-5z" fill="${p.powerOnEnd}"/>
    <path d="M32 3c10 8 14 19 14 31v11H18V34C18 22 22 11 32 3z" fill="${body}"/>
    <path d="M32 3c10 8 14 19 14 31v11h-7V34c0-12-2-22-7-31z" fill="${shade}"/>
    <path d="M32 3c4.5 3.6 7.7 8 9.8 13H22.2C24.3 11 27.5 6.6 32 3z" fill="${p.powerOnEnd}"/>
    <circle cx="32" cy="27" r="6.5" fill="${shade}"/><circle cx="32" cy="27" r="4.5" fill="${p.powerOnStart}"/>
    <circle cx="30.5" cy="25.5" r="1.4" fill="#ffffff" opacity="0.8"/>
    <path d="M29 45h6v8h-6z" fill="${p.powerOnEnd}" opacity="0.9"/>
    <path d="M26 45h12l-2 5h-8z" fill="#5b6475"/></svg>`);
}

function ecgSvg(color: string, flat: boolean): string {
  const d = flat ? 'M0 20 H56' : 'M0 20 H14 L18 14 L22 20 L25 20 L28 4 L32 34 L35 20 L40 20 L43 16 L46 20 H56';
  return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="56" height="40" viewBox="0 0 56 40"><path d="${d}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/></svg>`);
}

/* «День и ночь»: картинки на дорожку 152×74. Цвета природные и от палитры не зависят */
/** Облака. Маленькие облачка в небе - на той стороне, где днём нет солнца (dx - сдвиг влево) */
const dnClouds = (dx: number) => svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 152 74">
  <g fill="#ffffff" opacity="0.9" transform="translate(${-dx} 0)"><circle cx="102" cy="19" r="6"/><circle cx="110" cy="15" r="8"/><circle cx="119" cy="19" r="6"/><rect x="102" y="19" width="17" height="6" rx="3"/></g>
  <g fill="#ffffff" opacity="0.75" transform="translate(${-dx} 0)"><circle cx="128" cy="33" r="4"/><circle cx="134" cy="30" r="6"/><circle cx="140" cy="33" r="4"/><rect x="128" y="33" width="12" height="4" rx="2"/></g>
  <g fill="#d5ebfd"><circle cx="18" cy="68" r="15"/><circle cx="42" cy="61" r="14"/><circle cx="66" cy="65" r="13"/><circle cx="92" cy="57" r="15"/><circle cx="118" cy="61" r="14"/><circle cx="142" cy="54" r="16"/><rect y="62" width="152" height="12"/></g>
  <g fill="#ffffff"><circle cx="6" cy="74" r="12"/><circle cx="30" cy="70" r="13"/><circle cx="55" cy="72" r="12"/><circle cx="79" cy="67" r="14"/><circle cx="105" cy="70" r="12"/><circle cx="128" cy="65" r="14"/><circle cx="151" cy="67" r="12"/><rect y="70" width="152" height="4"/></g>
</svg>`);
const DN_HILLS = svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 152 74">
  <path d="M0 52 22 38 40 48 62 30 86 46 108 34 130 44 152 36V74H0z" fill="#a9d8a3"/>
  <path d="M0 60Q30 44 62 56T124 52T152 50V74H0z" fill="#78c272"/>
  <path d="M68 74Q78 65 98 63Q116 61 124 56Q114 65 101 68Q88 72 86 74z" fill="#d9f2ff"/>
  <path d="M0 66Q26 57 54 65Q68 69 74 74H0zM102 74Q118 61 152 59V74z" fill="#4fa94b"/>
  <g fill="#2f7a36"><path d="M118 66l4-12 4 12zM126 64l4-14 4 14zM135 63l4-11 4 11zM143 62l4-13 4 13zM12 68l3-10 3 10zM19 69l3-8 3 8z"/></g>
</svg>`);
const DN_STARS = (() => {
  const dots = [[20, 14], [48, 9], [70, 24], [96, 12], [122, 22], [141, 11], [34, 33], [84, 37], [110, 41], [58, 45], [12, 40], [146, 30], [77, 6]];
  const sparks = [[60, 15, 3], [104, 28, 2.6], [132, 38, 2.2], [27, 24, 2.4], [88, 22, 1.8]];
  const spark = ([x, y, r]: number[]) => { const k = r * 0.28; return `<path d="M${x} ${y - r}L${x + k} ${y - k}L${x + r} ${y}L${x + k} ${y + k}L${x} ${y + r}L${x - k} ${y + k}L${x - r} ${y}L${x - k} ${y - k}z"/>`; };
  return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 152 74"><g fill="#ffffff">${dots.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 ? 0.8 : 1.1}" opacity="${i % 2 ? 0.6 : 0.9}"/>`).join('')}${sparks.map(spark).join('')}</g></svg>`);
})();
/** Ореол вокруг солнца или луны: светлые кольца и свечение */
const dnHalo = (night: boolean) => [7, 15, 24].map((r, i) => `0 0 0 ${r}px rgba(255, 255, 255, ${((night ? [0.07, 0.05, 0.03] : [0.15, 0.09, 0.05])[i])})`)
  .concat('0 4px 10px rgba(0, 0, 0, 0.3)', `0 0 22px ${night ? 'rgba(200, 214, 255, 0.45)' : 'rgba(255, 210, 60, 0.75)'}`).join(', ');

/** Схемы, для которых нужно "запечь" цвета в картинки */
function bakeScopes(cfg: ThemeConfig): { scheme: Scheme; sel: string }[] {
  if (cfg.mode === 'dark') return [{ scheme: 'dark', sel: 'html:root' }];
  if (cfg.mode === 'light') return [{ scheme: 'light', sel: 'html:root' }];
  return [{ scheme: 'light', sel: 'html:not(.dark)' }, { scheme: 'dark', sel: 'html.dark' }];
}
const scoped = (sel: string, part: string) => part.replace(':root', sel);

export function powerRules(cfg: ThemeConfig, baseRule: RuleFn, glass: GlassLook): string {
  const pw = cfg.power;
  const dur = (s: number) => `${Math.round((s / Math.max(0.2, pw.speed)) * 100) / 100}s`;
  // Постоянные анимации - ступеньками (см. frames.ts), с учётом скорости кнопки
  const scaled = (s: number) => s / Math.max(0.2, pw.speed);
  const run = (s: number, curve?: Curve, parts?: number) => pace(scaled(s), curve, parts);
  const runDecl = (s: number, curve?: Curve, parts?: number) => paceDecl(scaled(s), curve, parts);
  const half = (s: number, curve?: Curve, parts?: number) => halfOf(scaled(s), curve, parts);
  const anim = pw.animate;
  const st = pw.style;
  let out = '';
  // Шары всегда круглые и заливаются по-своему
  const ball = st === 'sphere' || st === 'network' || st === 'globe' || st === 'dots' || st === 'plasma' || st === 'caustic';

  // Тень из раздела «Тени» («Где показывать» → «Кнопка подключения»). Стили задают кругу свои тени,
  // поэтому она дописывается в конец каждого объявления box-shadow самого круга - в покое, при
  // подключении и при ошибке. Шарам не нужна: у них своё свечение
  const pwShadow = cfg.shadows.preset !== 'app' && cfg.shadows.power && !ball;
  const circle = [C, `${ON} > div`, `${ERR} > div`];
  const rule: RuleFn = (selector, decls) => baseRule(selector, pwShadow && [selector].flat().every((x) => circle.includes(x))
    ? decls.map((d) => typeof d === 'string' && d.startsWith('box-shadow:') ? d.replace(/( !important)?$/, ', var(--kt-pw-sh)$1') : d)
    : decls);
  // Блик по кромке («Поверхности» → «Карточки и плитки») у стеклянных кнопок - один, свой. В тени
  // карточек он уже есть, поэтому кнопке - тень без блика (shadow-bare), иначе блик получался двойным
  const hl = hasHighlight(cfg.surfaces);
  if (pwShadow) {
    out += rule(B, [`--kt-pw-sh: var(${hl ? '--kt-shadow-bare' : '--kt-shadow-card'})`]);
    if (pw.hover !== 'none') out += rule(`${B}:hover:not(:disabled)`, [`--kt-pw-sh: var(${hl ? '--kt-shadow-bare-hover' : '--kt-shadow-hover'})`]);
    // Для стилей без своих теней у круга. Без !important: свои тени стилей ниже его перекрывают
    out += baseRule(C, ['box-shadow: var(--kt-pw-sh)']);
  }

  /* ---------- Общие настройки ---------- */
  const toggle = POWER_TOGGLES.includes(st);
  const plain = POWER_PLAIN.includes(st);
  // Ширина: круг шире 100% становится капсулой. Скругление - в px от высоты круга (128px): в % у
  // растянутой кнопки углы вышли бы овальными
  const wide = pw.stretch > 100 && POWER_STRETCH.includes(st);
  const radius = pw.shape === 'circle' ? (wide ? '64px' : '50%') : `${Math.round(1.28 * pw.corner * 10) / 10}px`;
  if (st !== 'app' || pw.glow > 0 || pw.shape !== 'circle' || wide) out += rule(B, ['isolation: isolate', `--kt-pw-r: ${radius}`]);
  if (pw.size !== 100 && st !== 'sphere') out += rule(C, [`zoom: ${pw.size / 100}`]);
  if ((pw.shape !== 'circle' || wide) && !toggle && !ball) out += rule(C, ['border-radius: var(--kt-pw-r) !important']);
  if (wide) out += rule(C, [`width: ${Math.round(1.28 * pw.stretch)}px !important`]);
  if (pw.ringWidth !== 2 && !ball && st !== 'daynight') out += rule(C, [`border-width: ${pw.ringWidth}px !important`]);

  // Заливка круга. Направление: у линейной - угол, у конической - начало, у радиальной - откуда
  // падает свет (145° - как раньше, свет слева сверху)
  const ang = pw.fillAngle;
  const light = ang === 145 ? '30% 30%'
    : `${Math.round(50 - 28 * Math.sin((ang * Math.PI) / 180))}% ${Math.round(50 + 28 * Math.cos((ang * Math.PI) / 180))}%`;
  const fillOf = (state: 'off' | 'on') => {
    const s = `var(--gradient-start-power-${state})`, e = `var(--gradient-end-power-${state})`;
    // У «Стекла» плотность заливки - непрозрачность стекла карточек из «Поверхностей»
    const m = (c: string) => `color-mix(in srgb, ${c} ${st === 'glass' ? cfg.surfaces.opacity : pw.fillOpacity}%, transparent)`;
    switch (pw.fill) {
      case 'radial': return `radial-gradient(circle at ${light}, ${m(s)}, ${m(e)})`;
      case 'linear': return `linear-gradient(${ang}deg, ${m(s)}, ${m(e)})`;
      case 'conic': return `conic-gradient(from ${ang + 55}deg, ${m(s)}, ${m(e)}, ${m(s)})`;
      case 'solid': return `linear-gradient(${m(e)}, ${m(e)})`;
      // Как в клиенте (bg-radial-[at_30%_45%] from-…/60 to-…/60, у выключенной - /50): нужна, когда
      // поверх или вокруг заливки рисуется ещё слой - глянец или градиентная рамка
      case 'app': {
        const k = state === 'on' ? 60 : 50;
        return `radial-gradient(at 30% 45% in oklab, color-mix(in oklab, ${s} ${k}%, transparent), color-mix(in oklab, ${e} ${k}%, transparent))`;
      }
      default: return 'linear-gradient(transparent, transparent)';
    }
  };
  // Слой фона - на весь круг вместе с рамкой (border-box). По умолчанию картинка фона растягивается
  // только внутри рамки и повторяется: под полупрозрачной рамкой сверху выглядывал тёмный низ
  // градиента, а снизу - светлый верх с бликом
  const bb = (layer: string) => `${layer} border-box`;
  /** Фон стилей, которые красят круг сами (стекло, неон, минимал, радар, жидкость): own - их фон, а
   *  выбранная заливка встаёт вместо него. Раньше стиль перекрывал заливку, и её настройки не работали */
  const fillOr = (state: 'off' | 'on', own: string) => pw.fill === 'app' ? own : bb(fillOf(state));

  // Градиентная рамка - фоном под прозрачной рамкой (border-box), заливка - внутри (padding-box)
  const gradRing = plain && pw.ringColor === 'gradient';
  const gloss = plain && pw.volume === 'gloss';
  // Тумблерам - нет: у них свой фон дорожки, а правило подключённого состояния весомее их правил и
  // подменяло дорожку заливкой (стекло и небо «Дня и ночи» пропадали при подключении)
  if (!ball && !toggle && (pw.fill !== 'app' || gradRing || gloss)) {
    const bg = (state: 'off' | 'on') => [gloss && bb(GLOSS), gradRing ? `${fillOf(state)} padding-box` : bb(fillOf(state)),
      gradRing && `linear-gradient(${ang}deg, var(--gradient-start-power-${state}), var(--gradient-end-power-${state})) border-box`].filter(Boolean).join(', ');
    out += rule(C, [`background: ${bg('off')} !important`, gradRing && 'border-color: transparent !important']);
    out += rule(`${ON} > div`, [`background: ${bg('on')} !important`]);
  }

  if (plain) {
    // Цвет рамки - подменой переменных клиента у кнопки: ими же рисуют кольца «Пульса» и «Кольца»
    const rc = pw.ringColor === 'primary' ? 'var(--primary)' : pw.ringColor === 'foreground' ? 'var(--foreground)' : pw.ringColor === 'custom' ? pw.ringCustom : null;
    if (rc) out += rule(B, [`--stroke-power-on: ${rc}`, `--stroke-power-off: color-mix(in srgb, ${rc} 55%, transparent)`]);
    // Внешнее кольцо - outline: он повторяет скругление круга и не занимает места
    if (pw.outerRing > 0) {
      out += rule(C, [`outline: ${pw.outerRing}px solid color-mix(in srgb, var(--stroke-power-off) 80%, transparent)`, `outline-offset: ${pw.outerGap}px`]);
      out += rule(`${ON} > div`, ['outline-color: var(--stroke-power-on)']);
      out += rule(`${ERR} > div`, ['outline-color: var(--destructive)']);
    }
    // Тени круга одним списком: кольцо стиля «Свечение», объём, тень под кнопкой
    const drop = pw.drop > 0 ? [`0 ${Math.round(4 + pw.drop * 0.14)}px ${Math.round(8 + pw.drop * 0.3)}px rgba(0, 0, 0, ${(pw.drop * 0.005).toFixed(2)})`] : [];
    const own = [...VOLUME[pw.volume], ...drop];
    const off = st === 'glow' ? ['0 0 0 6px color-mix(in srgb, var(--stroke-power-off) 14%, transparent)', ...own] : own;
    const on = st === 'glow' ? ['0 0 0 8px color-mix(in srgb, var(--stroke-power-on) 18%, transparent)', '0 0 30px color-mix(in srgb, var(--gradient-end-power-on) 45%, transparent)', ...own] : own;
    if (off.length) out += rule(C, [`box-shadow: ${off.join(', ')} !important`]);
    if (st === 'glow') out += rule(`${ON} > div`, [`box-shadow: ${on.join(', ')} !important`]);
  }

  // Подсветка позади кнопки
  if (pw.glow > 0 && st !== 'sphere') {
    const gk = pw.glow / 100;
    const offC = pw.glowColor === 'primary' ? 'var(--primary)' : pw.glowColor === 'custom' ? pw.glowCustom : 'var(--gradient-end-power-off)';
    const onC = pw.glowColor === 'primary' ? 'var(--primary)' : pw.glowColor === 'custom' ? pw.glowCustom : 'color-mix(in srgb, var(--gradient-start-power-on) 50%, var(--gradient-end-power-on))';
    out += rule(B, [`--kt-glow: ${offC}`]);
    out += rule([ON, LOAD], [`--kt-glow: ${onC}`]);
    out += rule(ERR, ['--kt-glow: var(--destructive)']);
    out += rule(`${B}::after`, [
      'content: ""', 'position: absolute', 'left: 50%', 'top: 50%', `width: ${pw.glowSize}%`, `height: ${pw.glowSize}%`,
      'transform: translate(-50%, -50%)', 'border-radius: 50%', 'z-index: -1', 'pointer-events: none',
      'background: radial-gradient(closest-side, color-mix(in srgb, var(--kt-glow) 75%, transparent), color-mix(in srgb, var(--kt-glow) 25%, transparent) 55%, transparent)',
      pw.glowBlur > 0 && `filter: blur(${pw.glowBlur}px)`,
      `opacity: ${pw.glowOff ? (gk * 0.55).toFixed(2) : 0}`,
      'transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
    ]);
    out += rule([`${ON}::after`, `${LOAD}::after`, `${ERR}::after`], [`opacity: ${gk.toFixed(2)}`]);
    if (pw.glowPulse && anim) out += rule(`${ON}::after`, [`animation: kt-pw-glow ${run(2.8, 'ease-in-out')} infinite alternate`]);
    if (pw.hover === 'glow') out += rule(`${B}:hover:not(:disabled)::after`, [`opacity: ${Math.min(1, gk + 0.3).toFixed(2)}`, 'transform: translate(-50%, -50%) scale(1.18)']);
  }

  // Наведение
  const hov = `${B}:hover:not(:disabled) > div`;
  if (pw.hover !== 'app' && st !== 'sphere') out += rule(C, ['transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.4s ease, box-shadow 0.4s ease, border-color 0.4s ease, outline-color 0.4s ease !important']);
  if (pw.hover === 'scale') out += rule(hov, ['transform: scale(1.07)']);
  if (pw.hover === 'lift') out += rule(hov, ['transform: translateY(-5px)']);
  if (pw.hover === 'tilt') out += rule(hov, ['transform: rotate(-8deg) scale(1.03)']);
  if (pw.hover === 'none') out += rule(B, ['scale: 1 !important']);

  // Анимация в покое (выключено)
  if (pw.idle !== 'none' && anim && st !== 'sphere') {
    const kf = { float: 'kt-pw-float', breathe: 'kt-pw-breathe-c', wobble: 'kt-pw-wobble' }[pw.idle];
    out += rule(`${IDLE} > div`, [`animation: ${kf} ${pw.idle === 'wobble' ? run(2.4, 'ease-in-out', 4) : run(3.4, 'ease-in-out', 2)} infinite`]);
  }

  // Иконки
  const standardIcons = ['app', 'glow', 'pulse', 'ring', 'glass', 'neon', 'minimal', 'orbit', 'radar', 'liquid', 'portal', 'plasma'].includes(st);
  if (standardIcons) {
    if (pw.icon === 'hide') out += rule(ICONS, ['visibility: hidden']);
    else if (pw.icon !== 'app') {
      for (const { scheme, sel } of bakeScopes(cfg)) {
        const p = cfg.palette[scheme];
        const c = pw.icon === 'foreground' ? p.foreground : pw.icon === 'primary' ? p.primary : pw.icon === 'power' ? p.powerOnStart : pw.iconCustom;
        out += rule(scoped(sel, `${I} > img:nth-child(2)`), [`content: ${POWER_ICONS.pause(c)}`]);
        out += rule(scoped(sel, `${I} > img:nth-child(3)`), [`content: ${POWER_ICONS.power(c)}`]);
        out += rule(scoped(sel, `${I} > img:nth-child(4)`), [`content: ${POWER_ICONS.alert(c)}`]);
        out += rule(scoped(sel, `${I} > svg`), [`color: ${c} !important`]);
      }
    }
    if (pw.iconSize !== 100) out += rule(I, [`zoom: ${pw.iconSize / 100}`]);
  }

  /** Цвета ленты «Шара света» - те, что можно подставить в CSS: холодная сторона и тёплая */
  const orbA = pw.orbColor === 'power' ? 'var(--gradient-start-power-on)' : pw.orbColor === 'primary' ? 'color-mix(in srgb, var(--primary) 75%, white)' : pw.orbColor === 'custom' ? `color-mix(in srgb, ${pw.orbCustom} 75%, white)` : PRISM_INK.cool;
  const orbB = pw.orbColor === 'power' ? 'var(--gradient-end-power-on)' : pw.orbColor === 'primary' ? 'var(--primary)' : pw.orbColor === 'custom' ? pw.orbCustom : PRISM_INK.warm;
  /**
   * «Шар света» на блоке значка (сама кнопка или ручка тумблера): тело и обод - его фон, лента - псевдоэлементы,
   * они перекручиваются вместе (см. caustic.ts). h и w - размах и толщина ленты, steps и gain - обод. Картинки
   * запекаются для каждой схемы: у светлой свой шар и свои цвета, а у цветной ленты ещё и своя палитра. Отключено -
   * тонкая тусклая нить и никакого движения, подключено - лента светится и вращается, при подключении вращается быстро
   */
  const orbLook = (h: number, w: number, steps: number, gain: number) => {
    const body = orbBody(pw.orbBg, pw.orbColor === 'prism' ? '#06070a' : `color-mix(in srgb, ${orbB} 14%, #06070a)`, orbA, orbB);
    const inkFor = (p: Palette, light: boolean) => {
      if (pw.orbColor === 'prism') return light ? PRISM_INK_LIGHT : PRISM_INK;
      if (pw.orbColor === 'power') return inkOf(p.powerOnStart, p.powerOnEnd, light);
      const c = pw.orbColor === 'primary' ? p.primary : pw.orbCustom;
      return inkOf(mix(c, '#ffffff', 0.25), c, light);
    };
    const layer = ['content: ""', 'position: absolute', 'inset: 0', 'pointer-events: none', 'mix-blend-mode: screen', 'background: center / 100% 100% no-repeat', 'rotate: -4deg',
      'will-change: transform', 'transition: transform 0.9s ease, opacity 1s ease'];
    out += rule(I, ['z-index: 2', 'overflow: hidden', 'isolation: isolate', 'border-radius: 50%']);
    out += rule(`${I}::before`, [...layer, 'transform: scaleY(0.2)', 'opacity: 0.34']);
    out += rule(`${I}::after`, [...layer, 'transform: scaleY(-0.1)', 'opacity: 0.3']);
    for (const { scheme, sel } of bakeScopes(cfg)) {
      const light = scheme === 'light', ink = inkFor(cfg.palette[scheme], light);
      out += rule(scoped(sel, I), [`background: ${rimImage(ink, steps, light ? 1 : gain, light)} center / 100% 100% no-repeat, ${light ? orbBodyLight(pw.orbBg) : body}`]);
      out += rule(scoped(sel, `${I}::before`), [`background-image: ${ribbonImage('hump', ink, h, w, light)}`, light && 'mix-blend-mode: normal']);
      out += rule(scoped(sel, `${I}::after`), [`background-image: ${ribbonImage('wave', ink, h, w, light)}`, light && 'mix-blend-mode: normal']);
    }
    const on = `${ON} > div > div`, load = `${LOAD} > div > div`;
    if (anim) {
      out += rule([`${on}::before`, `${load}::before`], [`animation: kt-orb-twist ${run(6.5, 'linear', ORB_PARTS)} infinite alternate`]);
      out += rule([`${on}::after`, `${load}::after`], [`animation: kt-orb-twist ${run(6.5, 'linear', ORB_PARTS)} -${half(6.5, 'linear', ORB_PARTS)} infinite alternate`]);
      out += rule(`${load}::before`, [runDecl(1.2, 'linear', ORB_PARTS)]);
      out += rule(`${load}::after`, [runDecl(1.2, 'linear', ORB_PARTS), `animation-delay: -${half(1.2, 'linear', ORB_PARTS)}`]);
    } else {
      out += rule([`${on}::before`, `${load}::before`], ['opacity: 1', 'transform: scaleY(0.85)']);
      out += rule([`${on}::after`, `${load}::after`], ['opacity: 1', 'transform: scaleY(0.45)']);
    }
    out += rule(`${ERR} > div > div`, ['box-shadow: inset 0 0 14px color-mix(in srgb, var(--destructive) 75%, transparent), 0 0 12px color-mix(in srgb, var(--destructive) 35%, transparent)']);
    out += rule([`${ERR} > div > div::before`, `${ERR} > div > div::after`], ['opacity: 0']);
    // Состояние видно по ленте, значки питания и паузы и спиннер не нужны. Знак ошибки остаётся
    out += rule([`${I} > svg`, `${I} > img:nth-child(2)`, `${I} > img:nth-child(3)`], ['visibility: hidden']);
  };

  /* ---------- Стили ---------- */
  const g = pw.glow / 100;
  switch (st) {
    case 'app':
      break;

    case 'glow':
      // Кольцо и ореол - в общем списке теней круга выше, вместе с объёмом и тенью под кнопкой
      break;

    case 'pulse':
      out += rule(C, ['position: relative']);
      out += rule([`${B}::before`, `${C}::after`], ['content: ""', 'position: absolute', 'inset: -2px', 'border-radius: var(--kt-pw-r)', 'pointer-events: none',
        `border: ${Math.max(1, pw.ringWidth)}px solid var(--stroke-power-on)`, 'opacity: 0']);
      out += rule(`${B}::before`, ['z-index: -1']);
      if (anim) {
        out += rule([`${ON}::before`, `${ON} > div::after`], [`animation: kt-pw-ripple ${run(2.6, [0.2, 0.6, 0.35, 1])} infinite`]);
        out += rule(`${ON} > div::after`, [`animation-delay: ${half(2.6, [0.2, 0.6, 0.35, 1])}`]);
        out += rule([`${LOAD}::before`, `${LOAD} > div::after`], ['border-color: var(--stroke-power-off)', `animation: kt-pw-ripple ${run(1.2, 'ease-out')} infinite`]);
        out += rule(`${LOAD} > div::after`, [`animation-delay: ${half(1.2, 'ease-out')}`]);
      } else {
        out += rule(`${ON}::before`, ['opacity: 0.5', 'transform: scale(1.18)']);
      }
      break;

    case 'ring': {
      // Кольцо рисуется рамкой через mask-composite: края ровные, градиент плавный, без резкого "хвоста"
      const w = Math.max(2, pw.ringWidth + 1);
      out += rule(`${B}::before`, ['content: ""', 'position: absolute', `inset: ${-(w + 6)}px`, 'z-index: -1', 'border-radius: var(--kt-pw-r)', 'pointer-events: none',
        `padding: ${w}px`,
        'background: conic-gradient(from 0deg, transparent 0turn, color-mix(in srgb, var(--gradient-start-power-on) 60%, transparent) 0.15turn, var(--gradient-start-power-on) 0.45turn, var(--gradient-end-power-on) 0.8turn, transparent 1turn)',
        '-webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', '-webkit-mask-composite: xor',
        'mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', 'mask-composite: exclude',
        'opacity: 0', 'transition: opacity 0.5s ease']);
      out += rule([`${ON}::before`, `${LOAD}::before`], ['opacity: 1', anim && `animation: kt-spin ${run(2.8)} infinite`]);
      if (anim) out += rule(`${LOAD}::before`, [runDecl(1)]);
      out += rule(`${IDLE}::before`, ['opacity: 0.55', 'background: color-mix(in srgb, var(--stroke-power-off) 65%, transparent)']);
      break;
    }

    case 'glass': {
      // Стекло карточек из «Поверхностей»: непрозрачность (плотность любой заливки), размытие,
      // насыщенность, шероховатость, цвет и заметность рамки, блик по кромке. Сверху - большой блик
      // шара (размер - ползунком, 0 - без него), под ним зерно и заливка: цветов кнопки, своя или -
      // при «Прозрачной» - стекло цвета карточек, как у стеклянного тумблера
      const k = pw.glassShine / 100;
      const op = cfg.surfaces.opacity;
      const shine = k > 0 ? `${bb(`radial-gradient(${Math.round(120 * k)}% ${Math.round(120 * k)}% at 30% 18%, rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0.08) 42%, transparent 70%)`)}, ` : '';
      const ball3d = (state: 'off' | 'on') => `${shine}${glass.grain}${pw.fill === 'none' ? bb(glass.fill) : fillOr(state,
        bb(`radial-gradient(circle at 30% 45%, color-mix(in srgb, var(--gradient-start-power-${state}) ${op}%, transparent), color-mix(in srgb, var(--gradient-end-power-${state}) ${op}%, transparent))`))} !important`;
      const shadows = (shade: number, drop: number) => `box-shadow: ${[hl && 'var(--kt-highlight)', `inset 0 -10px 22px rgba(0, 0, 0, ${shade})`,
        !pwShadow && `0 18px 40px rgba(0, 0, 0, ${drop})`].filter(Boolean).join(', ')} !important`;
      if (glass.layer) {
        out += rule(C, ['background: transparent !important', ...glassBorder(glass, pw.ringWidth), shadows(0.16, 0.25),
          'backdrop-filter: none !important', 'position: relative', 'isolation: isolate']);
        out += rule(`${C}::before`, glassLayer(glass.layer, `calc(var(--kt-pw-r, 50%) - ${pw.ringWidth}px + ${glass.layer.pad}px)`, onLayer(ball3d('off'))));
        out += rule(`${ON} > div::before`, [`background: ${onLayer(ball3d('on'))}`]);
        out += rule(`${ON} > div`, [shadows(0.12, 0.2)]);
        break;
      }
      out += rule(C, [`background: ${ball3d('off')}`, ...glassBorder(glass, pw.ringWidth), shadows(0.16, 0.25),
        `backdrop-filter: ${glass.filterPower} !important`, glass.rimOver && 'position: relative']);
      out += rule(`${ON} > div`, [`background: ${ball3d('on')}`, shadows(0.12, 0.2)]);
      if (glass.rimOver) out += rule(`${C}::before`, rimOverlay(glass.rimOver));
      break;
    }

    case 'neon':
      out += rule(B, ['--kt-pw: var(--stroke-power-off)']);
      out += rule([ON, LOAD], ['--kt-pw: var(--gradient-start-power-on)']);
      out += rule(ERR, ['--kt-pw: var(--destructive)']);
      if (pw.fill !== 'app') out += rule(`${ON} > div`, [`background: ${bb(fillOf('on'))} !important`]);
      out += rule(C, [`background: ${fillOr('off', 'color-mix(in srgb, var(--background) 82%, transparent)')} !important`, `border: ${Math.max(1, pw.ringWidth)}px solid var(--kt-pw) !important`,
        `box-shadow: 0 0 6px var(--kt-pw), 0 0 ${Math.round(26 * g + 8)}px color-mix(in srgb, var(--kt-pw) 70%, transparent), inset 0 0 18px color-mix(in srgb, var(--kt-pw) 45%, transparent) !important`]);
      out += rule(ICONS, ['filter: drop-shadow(0 0 6px var(--kt-pw))']);
      if (anim) out += rule(`${ON} > div`, [`animation: kt-neon ${dur(4)} step-end infinite`]);
      out += lightIconFix(cfg, rule);
      break;

    case 'minimal':
      out += rule(C, [`background: ${fillOr('off', 'var(--card)')} !important`, `border: ${Math.max(1, pw.ringWidth - 0.5)}px solid var(--stroke) !important`, 'box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06) !important', 'backdrop-filter: none !important']);
      out += rule(`${ON} > div`, [`background: ${fillOr('on', 'color-mix(in srgb, var(--primary) 12%, var(--card))')} !important`, 'border-color: var(--primary) !important', 'box-shadow: 0 0 0 6px color-mix(in srgb, var(--primary) 14%, transparent) !important']);
      if (pw.icon === 'app') out += lightIconFix(cfg, rule);
      break;

    case 'sphere': {
      const r = Math.round(60 * pw.size) / 100;
      let css = particleSphere.replace('--r: 60px;', `--r: ${r}px;`).replace('--dot: 1.5px;', `--dot: ${pw.sphereDot}px;`);
      if (!anim) css += rule('html:is(.dark, :not(.dark)) [data-guide="home-power-toggle"]:has(> div[class*="border-stroke-power-on"])::before', ['animation: none !important']);
      out += rule(B, ['--koala-spring: var(--kt-spring)']) + css;
      break;
    }

    case 'network':
    case 'globe':
    case 'dots': {
      // Круг становится телом шара (лёгкое свечение края), сеть рисует круг::before через SVG-маску.
      // Выключено - неподвижный кадр, подключение и подключено - анимация вращения (см. sphere.ts)
      const base = st === 'network' ? 40 : st === 'globe' ? 30 : 24;
      const still = sphereImage(st, false, base);
      const moving = anim && sphereImage(st, true, Math.round((base / Math.max(0.2, pw.speed)) * 10) / 10);
      out += rule(B, ['--kt-sp-a: var(--gradient-start-power-off)', '--kt-sp-b: var(--gradient-end-power-off)']);
      out += rule([ON, LOAD], ['--kt-sp-a: var(--gradient-start-power-on)', '--kt-sp-b: var(--gradient-end-power-on)']);
      out += rule(ERR, ['--kt-sp-a: var(--destructive)', '--kt-sp-b: color-mix(in srgb, var(--destructive) 60%, white)']);
      // Тело шара. closest-side и no-repeat обязательны: иначе картинка фона повторяется под прозрачной
      // рамкой круга, и сверху, снизу и по бокам торчат кусочки светлого края
      const body = (c: number, m: number, e: number) => `radial-gradient(circle closest-side, color-mix(in srgb, var(--kt-sp-b) ${c}%, transparent) 0 57%, color-mix(in srgb, var(--kt-sp-a) ${m}%, transparent) 88%, color-mix(in srgb, var(--kt-sp-a) ${e}%, transparent) 97%, transparent 100%) no-repeat !important`;
      out += rule(C, ['position: relative', 'border-color: transparent !important', 'backdrop-filter: none !important', 'box-shadow: none !important',
        `background: ${body(12, 8, 26)}`]);
      out += rule(ICONS, ['visibility: hidden']);
      // Картинка - в переменной: в mask и -webkit-mask она длинная (десятки КБ), без переменной её пришлось бы писать дважды
      out += rule(`${C}::before`, ['content: ""', 'position: absolute', 'inset: -2px', 'pointer-events: none',
        'background: linear-gradient(150deg, color-mix(in srgb, var(--kt-sp-a) 70%, white), var(--kt-sp-b))',
        `--kt-sp-img: ${still}`,
        '-webkit-mask: var(--kt-sp-img) center / 100% 100% no-repeat', 'mask: var(--kt-sp-img) center / 100% 100% no-repeat',
        'opacity: 0.65', 'transition: opacity 0.6s ease']);
      // В светлой схеме начало градиента кнопки обычно бледное, и с примесью белого линии сливаются с фоном -
      // рисуем от тёмного конца
      for (const { sel } of bakeScopes(cfg).filter((x) => x.scheme === 'light')) {
        out += rule(scoped(sel, `${C}::before`), ['background: linear-gradient(150deg, color-mix(in srgb, var(--kt-sp-a) 35%, var(--kt-sp-b)), color-mix(in srgb, var(--kt-sp-b) 70%, black))']);
      }
      out += rule([`${ON} > div::before`, `${LOAD} > div::before`], [anim && `--kt-sp-img: ${moving}`, 'opacity: 1']);
      if (anim) out += rule(`${LOAD} > div::before`, [`animation: kt-sp-load ${run(0.9, 'ease-in-out')} infinite alternate`]);
      out += rule(`${ON} > div`, [`background: ${body(22, 12, 40)}`]);
      break;
    }

    case 'plasma': {
      // Шар плазмы: яркое ядро, вокруг вращаются светящиеся сгустки, навстречу - тонкие разряды-молнии
      out += rule(B, ['--kt-sp-a: var(--gradient-start-power-off)', '--kt-sp-b: var(--gradient-end-power-off)', '--kt-sp-k: 0.55']);
      out += rule([ON, LOAD], ['--kt-sp-a: var(--gradient-start-power-on)', '--kt-sp-b: var(--gradient-end-power-on)', '--kt-sp-k: 1']);
      out += rule(ERR, ['--kt-sp-a: var(--destructive)', '--kt-sp-b: #ff8a7a']);
      out += rule(C, ['position: relative', 'overflow: hidden', 'border-color: color-mix(in srgb, var(--kt-sp-a) 55%, transparent) !important', 'backdrop-filter: none !important',
        'background: radial-gradient(circle, color-mix(in srgb, var(--kt-sp-a) 55%, white) 0 5%, color-mix(in srgb, var(--kt-sp-a) 70%, transparent) 14%, color-mix(in srgb, var(--kt-sp-b) 30%, #05060c) 42%, #05060c 76%) !important',
        // Без !important: при подключении тень "дышит" анимацией, а важные объявления анимация не перебивает
        'box-shadow: inset 0 0 22px rgba(0, 0, 0, 0.6), 0 0 calc(30px * var(--kt-sp-k)) color-mix(in srgb, var(--kt-sp-a) 45%, transparent)']);
      const blob = (w: number, h: number, x: number, y: number, c: string) => `radial-gradient(ellipse ${w}% ${h}% at ${x}% ${y}%, ${c}, transparent 70%)`;
      const layer = ['content: ""', 'position: absolute', 'border-radius: 50%', 'pointer-events: none', 'mix-blend-mode: screen', 'opacity: var(--kt-sp-k)', 'transition: opacity 0.6s ease'];
      out += rule(`${C}::before`, [...layer, 'inset: 4%',
        `background: ${blob(30, 16, 28, 40, 'var(--kt-sp-a)')}, ${blob(18, 32, 70, 34, 'var(--kt-sp-b)')}, ${blob(32, 18, 62, 72, 'var(--kt-sp-a)')}, ${blob(16, 26, 32, 70, 'var(--kt-sp-b)')}`,
        'filter: blur(7px) saturate(1.3)', anim && `animation: kt-spin ${run(10)} infinite`]);
      out += rule(`${C}::after`, [...layer, 'inset: 0',
        'background: repeating-conic-gradient(from 10deg, transparent 0deg 13deg, color-mix(in srgb, var(--kt-sp-a) 45%, white) 14.5deg, transparent 16deg 37deg)',
        '-webkit-mask: radial-gradient(circle, transparent 10%, #000 22%, rgba(0, 0, 0, 0.6) 50%, transparent 66%)', 'mask: radial-gradient(circle, transparent 10%, #000 22%, rgba(0, 0, 0, 0.6) 50%, transparent 66%)',
        'filter: blur(0.8px)', anim && `animation: kt-spin ${run(16)} infinite reverse`]);
      if (anim) {
        out += rule([`${ON} > div::before`, `${LOAD} > div::before`], [runDecl(3.2)]);
        out += rule([`${ON} > div::after`, `${LOAD} > div::after`], [runDecl(5)]);
        out += rule(`${ON} > div`, [`animation: kt-plasma ${run(2.6, 'ease-in-out')} infinite alternate`]);
      }
      out += rule(I, ['z-index: 2', 'filter: drop-shadow(0 0 6px color-mix(in srgb, var(--kt-sp-a) 80%, transparent))']);
      break;
    }

    case 'caustic':
      // Сам круг только держит тень, всё остальное рисует блок значка на весь круг
      out += rule(C, ['position: relative', 'border: 0 !important', 'background: transparent !important', 'backdrop-filter: none !important', 'box-shadow: 0 14px 30px rgba(0, 0, 0, 0.4) !important']);
      out += rule(I, ['width: 100% !important', 'height: 100% !important']);
      orbLook(8.5, 1, 48, 1);
      out += rule(`${I} > img:nth-child(4)`, ['inset: 26% !important', 'width: 48% !important', 'height: 48% !important']);
      break;

    case 'rocket': {
      // Иллюминатор с ракетой. Выключено - стоит на земле; подключение - трясётся, вспыхивает пламя;
      // подключено - взлетает вверх-вправо, пламя бьётся, звёзды несутся мимо
      out += rule(C, ['overflow: hidden', 'position: relative',
        'background: radial-gradient(circle at 50% 28%, #23305a, #0b1022 72%) !important', 'backdrop-filter: none !important']);
      out += rule(`${ON} > div`, ['background: radial-gradient(circle at 72% 28%, color-mix(in srgb, var(--gradient-start-power-on) 26%, #151c3c), #070a16 72%) !important']);
      out += rule(`${C}::before`, ['content: ""', 'position: absolute', 'inset: 0', 'pointer-events: none', 'opacity: 0.55',
        'background: radial-gradient(1.2px 1.2px at 12px 18px, #fff, transparent), radial-gradient(1px 1px at 46px 8px, #fff, transparent), radial-gradient(1.4px 1.4px at 30px 40px, #fff, transparent), radial-gradient(1px 1px at 56px 52px, #fff, transparent), radial-gradient(1px 1px at 8px 58px, #fff, transparent)',
        'background-size: 64px 64px']);
      out += rule(`${ON} > div::before`, ['opacity: 1', anim && `animation: kt-rocket-stars ${run(0.7)} infinite`]);
      // Земля: верх холма на 74% высоты круга - ровно там, где сопло ракеты. Сверху - стартовая площадка и тень
      out += rule(`${C}::after`, ['content: ""', 'position: absolute', 'left: -15%', 'right: -15%', 'bottom: -58%', 'height: 84%', 'border-radius: 50%', 'pointer-events: none',
        'background: radial-gradient(22px 3px at 50% 2px, rgba(0, 0, 0, 0.55), transparent), radial-gradient(30px 5px at 50% 3px, color-mix(in srgb, var(--gradient-end-power-off) 35%, #4a5470) 60%, transparent 62%), radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--gradient-end-power-off) 55%, #2a3350), #161b2e 70%)',
        'transition: transform 1.2s cubic-bezier(0.5, 0, 0.2, 1)']);
      out += rule(`${ON} > div::after`, ['transform: translateY(70%)']);
      out += rule(ICONS, ['visibility: hidden']);
      out += rule(I, ['transform: translateY(12px)', 'transition: transform 1s cubic-bezier(0.34, 1.3, 0.64, 1)']);
      out += rule(`${I}::before`, ['content: ""', 'position: absolute', 'inset: 4px', 'z-index: 1', 'background-position: center', 'background-size: contain', 'background-repeat: no-repeat',
        'filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.35))']);
      for (const { scheme, sel } of bakeScopes(cfg)) out += rule(scoped(sel, `${I}::before`), [`background-image: ${rocketSvg(cfg.palette[scheme], scheme)}`]);
      out += rule(`${I}::after`, ['content: ""', 'position: absolute', 'left: 50%', 'top: 47px', 'width: 12px', 'height: 22px', 'margin-left: -6px', 'z-index: 0',
        'border-radius: 50% 50% 50% 50% / 30% 30% 70% 70%', 'transform-origin: 50% 0', 'transform: scaleY(0)', 'opacity: 0',
        'background: radial-gradient(ellipse at 50% 15%, #ffffff 0 12%, #fff2a8 24%, #ffb703 48%, #fb5607 70%, transparent 76%)',
        'filter: blur(0.4px) drop-shadow(0 0 6px #ff9f1c)', 'transition: transform 0.5s ease, opacity 0.3s ease']);
      out += rule(`${LOAD} > div > div`, [anim && `animation: kt-rocket-shake ${run(0.12, 'linear', 4)} infinite`]);
      out += rule(`${LOAD} > div > div::after`, ['opacity: 0.9', 'transform: scaleY(0.55)', anim && `animation: kt-flame ${run(0.12, 'ease-in-out')} infinite alternate`]);
      out += rule(`${ON} > div > div`, ['transform: translate(5px, -7px) rotate(45deg)', anim && `animation: kt-rocket-fly ${run(1.6, 'ease-in-out', 2)} ${dur(1)} infinite`]);
      out += rule(`${ON} > div > div::after`, ['opacity: 1', 'transform: scaleY(1.35)', anim && `animation: kt-flame-big ${run(0.14, 'ease-in-out')} infinite alternate`]);
      out += rule(`${ERR} > div > div`, ['transform: translateY(13px) rotate(-22deg)', 'filter: grayscale(0.7)']);
      out += rule(`${ERR} > div`, ['border-color: var(--destructive) !important']);
      break;
    }

    case 'orbit': {
      // Плоский эллипс орбиты вокруг кнопки. Кольцо (круг::before) и спутники (круг::after) лежат поверх
      // круга, а маска прячет дальнюю (верхнюю) половину там, где её загораживает круг: спутник пролетает
      // перед кнопкой и уходит за неё. Спутники едут по эллипсу через background-position (кадры - в powerKeyframes)
      const { a, b, pad } = ORBIT;
      const box = (p: number) => ['content: ""', 'position: absolute', 'left: 50%', 'top: 50%', `width: ${2 * (a + p)}px`, `height: ${2 * (b + p)}px`,
        `margin: ${-(b + p)}px 0 0 ${-(a + p)}px`, 'pointer-events: none', `-webkit-mask: ${ORBIT_MASK}`, `mask: ${ORBIT_MASK}`];
      const sat = (c: string, r: number) => `radial-gradient(circle, ${c} 0 ${r}px, color-mix(in srgb, ${c} 40%, transparent) ${r + 1.5}px, transparent 8px)`;
      out += rule(B, ['--kt-orb-ring: color-mix(in srgb, var(--stroke-power-off) 55%, transparent)', '--kt-orb-a: var(--stroke-power-off)', '--kt-orb-b: color-mix(in srgb, var(--stroke-power-off) 70%, transparent)']);
      out += rule([ON, LOAD], ['--kt-orb-ring: color-mix(in srgb, var(--stroke-power-on) 70%, transparent)', '--kt-orb-a: var(--gradient-start-power-on)', '--kt-orb-b: var(--gradient-end-power-on)']);
      out += rule(ERR, ['--kt-orb-ring: color-mix(in srgb, var(--destructive) 60%, transparent)', '--kt-orb-a: var(--destructive)']);
      out += rule(C, ['position: relative', 'box-shadow: inset -14px -18px 30px rgba(0, 0, 0, 0.25) !important']);
      out += rule(`${ON} > div`, ['box-shadow: inset -14px -18px 30px rgba(0, 0, 0, 0.25), 0 0 26px color-mix(in srgb, var(--gradient-end-power-on) 40%, transparent) !important']);
      out += rule(`${C}::before`, [...box(0), 'border-radius: 50%', `border: ${Math.max(1, pw.ringWidth - 0.5)}px solid var(--kt-orb-ring)`, 'transition: border-color 0.5s ease']);
      out += rule(`${C}::after`, [...box(pad), 'z-index: 1',
        `background: ${sat('var(--kt-orb-a)', 4)}, ${sat('var(--kt-orb-b)', 2.5)}`, 'background-size: 16px 16px', 'background-repeat: no-repeat',
        `background-position: ${orbitPos(-0.35)}`]);
      if (anim) {
        out += rule(`${ON} > div::after`, [`animation: kt-orbit ${run(3.2, 'linear', ORBIT_POINTS)} infinite`]);
        out += rule(`${LOAD} > div::after`, [`animation: kt-orbit ${run(1.1, 'linear', ORBIT_POINTS)} infinite`]);
      }
      break;
    }

    case 'radar': {
      out += rule(B, ['--kt-rd: var(--stroke-power-off)']);
      out += rule([ON, LOAD], ['--kt-rd: var(--gradient-start-power-on)']);
      out += rule(ERR, ['--kt-rd: var(--destructive)']);
      // Сетка и круги радара - поверх экрана: своей заливки (если выбрана) или тёмно-зелёного
      const screen = (state: 'off' | 'on') => `linear-gradient(90deg, transparent calc(50% - 0.5px), color-mix(in srgb, var(--kt-rd) 28%, transparent) calc(50% - 0.5px) calc(50% + 0.5px), transparent calc(50% + 0.5px)), linear-gradient(0deg, transparent calc(50% - 0.5px), color-mix(in srgb, var(--kt-rd) 28%, transparent) calc(50% - 0.5px) calc(50% + 0.5px), transparent calc(50% + 0.5px)), repeating-radial-gradient(circle, transparent 0 15px, color-mix(in srgb, var(--kt-rd) 26%, transparent) 15px 16px), ${fillOr(state, 'radial-gradient(circle, color-mix(in srgb, var(--kt-rd) 16%, #05110d), #020806 75%)')} !important`;
      out += rule(C, ['overflow: hidden', 'position: relative', 'border-color: color-mix(in srgb, var(--kt-rd) 70%, transparent) !important',
        `background: ${screen('off')}`, 'backdrop-filter: none !important']);
      if (pw.fill !== 'app') out += rule(`${ON} > div`, [`background: ${screen('on')}`]);
      out += rule(`${C}::before`, ['content: ""', 'position: absolute', 'inset: 0', 'border-radius: inherit', 'pointer-events: none', 'opacity: 0',
        'background: conic-gradient(from 0deg, transparent 0deg, transparent 270deg, color-mix(in srgb, var(--kt-rd) 75%, transparent) 360deg)', 'transition: opacity 0.5s ease']);
      out += rule([`${ON} > div::before`, `${LOAD} > div::before`], ['opacity: 1', anim && `animation: kt-spin ${run(2.4)} infinite`]);
      out += rule(`${C}::after`, ['content: ""', 'position: absolute', 'inset: 0', 'pointer-events: none', 'opacity: 0',
        'background: radial-gradient(circle at 70% 32%, var(--kt-rd) 0 2.5px, transparent 4px), radial-gradient(circle at 28% 66%, var(--kt-rd) 0 2px, transparent 3.5px), radial-gradient(circle at 62% 74%, var(--kt-rd) 0 1.8px, transparent 3px)']);
      out += rule(`${ON} > div::after`, ['opacity: 1', anim && `animation: kt-blink ${run(2.4, 'ease-in-out', 2)} infinite`]);
      out += rule(I, ['z-index: 2']);
      break;
    }

    case 'liquid': {
      out += rule(C, ['overflow: hidden', 'position: relative', `background: ${fillOr('off', 'color-mix(in srgb, var(--card) 45%, transparent)')} !important`]);
      if (pw.fill !== 'app') out += rule(`${ON} > div`, [`background: ${bb(fillOf('on'))} !important`]);
      const wave = (alpha: number, r: string) => ['content: ""', 'position: absolute', 'left: 50%', 'width: 230%', 'aspect-ratio: 1', `border-radius: ${r}`, 'pointer-events: none',
        `background: linear-gradient(180deg, color-mix(in srgb, var(--kt-lq-a) ${alpha}%, transparent), color-mix(in srgb, var(--kt-lq-b) ${alpha}%, transparent) 30%)`,
        'top: var(--kt-lq)', 'transform: translateX(-50%) rotate(0deg)', 'transition: top 1.4s cubic-bezier(0.4, 0, 0.2, 1)'];
      out += rule(B, ['--kt-lq: 84%', '--kt-lq-a: var(--gradient-start-power-off)', '--kt-lq-b: var(--gradient-end-power-off)']);
      out += rule(ON, ['--kt-lq: 26%', '--kt-lq-a: var(--gradient-start-power-on)', '--kt-lq-b: var(--gradient-end-power-on)']);
      out += rule(ERR, ['--kt-lq-a: var(--destructive)', '--kt-lq-b: var(--destructive)']);
      out += rule(`${C}::before`, [...wave(95, '42%'), 'z-index: 1', anim && `animation: kt-wave ${run(7)} infinite`]);
      out += rule(`${C}::after`, [...wave(55, '38%'), 'z-index: 0', 'margin-top: -5px', anim && `animation: kt-wave ${run(11)} infinite reverse`]);
      if (anim) out += rule([`${LOAD} > div::before`, `${LOAD} > div::after`], [`animation: kt-wave ${run(3)} infinite, kt-lq-fill ${run(1.6, 'ease-in-out')} infinite alternate`]);
      out += rule(I, ['z-index: 2']);
      break;
    }

    case 'equalizer': {
      out += rule(ICONS, ['visibility: hidden']);
      const bar = (x: number) => `linear-gradient(0deg, var(--kt-eq-b), var(--kt-eq-a)) ${x}px 100% / 7px 20% no-repeat`;
      out += rule(B, ['--kt-eq-a: var(--gradient-start-power-off)', '--kt-eq-b: var(--gradient-end-power-off)']);
      out += rule([ON, LOAD], ['--kt-eq-a: var(--gradient-start-power-on)', '--kt-eq-b: var(--gradient-end-power-on)']);
      out += rule(ERR, ['--kt-eq-a: var(--destructive)', '--kt-eq-b: var(--destructive)']);
      out += rule(`${I}::before`, ['content: ""', 'position: absolute', 'left: 2px', 'right: 2px', 'top: 8px', 'bottom: 10px', 'pointer-events: none',
        `background: ${[0, 12, 24, 36, 48].map(bar).join(', ')}`, 'background-size: 7px 18%, 7px 18%, 7px 18%, 7px 18%, 7px 18%',
        'filter: drop-shadow(0 0 6px color-mix(in srgb, var(--kt-eq-a) 50%, transparent))', 'transition: background-size 0.4s ease']);
      if (anim) {
        out += rule(`${ON} > div > div::before`, [`animation: kt-eq ${run(1.1, 'ease-in-out', 3)} infinite alternate`]);
        out += rule(`${LOAD} > div > div::before`, [`animation: kt-eq-load ${run(0.9, 'ease-in-out')} infinite alternate`]);
      } else {
        out += rule(`${ON} > div > div::before`, ['background-size: 7px 45%, 7px 80%, 7px 60%, 7px 95%, 7px 50%']);
      }
      break;
    }

    case 'heartbeat': {
      out += rule(ICONS, ['visibility: hidden']);
      out += rule(C, ['overflow: hidden']);
      out += rule(`${I}::before`, ['content: ""', 'position: absolute', 'left: 50%', 'top: 50%', 'width: 112px', 'height: 40px', 'margin: -20px 0 0 -56px', 'pointer-events: none',
        'background-repeat: repeat-x', 'background-size: 56px 40px',
        '-webkit-mask: linear-gradient(90deg, transparent, #000 25%, #000 75%, transparent)', 'mask: linear-gradient(90deg, transparent, #000 25%, #000 75%, transparent)']);
      for (const { scheme, sel } of bakeScopes(cfg)) {
        const p = cfg.palette[scheme];
        out += rule(scoped(sel, `${I}::before`), [`background-image: ${ecgSvg(p.powerOffStroke, true)}`]);
        out += rule(scoped(sel, `${ON} > div > div::before`), [`background-image: ${ecgSvg(p.powerOnStroke, false)}`]);
        out += rule(scoped(sel, `${LOAD} > div > div::before`), [`background-image: ${ecgSvg(p.powerOffStroke, false)}`]);
        out += rule(scoped(sel, `${ERR} > div > div::before`), [`background-image: ${ecgSvg(p.destructive, true)}`]);
      }
      if (anim) {
        out += rule(`${ON} > div > div::before`, [`animation: kt-ecg ${run(1.2)} infinite`, 'filter: drop-shadow(0 0 4px var(--stroke-power-on))']);
        out += rule(`${LOAD} > div > div::before`, [`animation: kt-ecg ${run(2.4)} infinite`]);
        out += rule(`${ON} > div`, [`animation: kt-heart ${dur(1.2)} steps(6) infinite`]);
      }
      break;
    }

    case 'portal': {
      out += rule(C, ['overflow: hidden', 'position: relative']);
      out += rule(B, ['--kt-pt-a: var(--gradient-start-power-off)', '--kt-pt-b: var(--gradient-end-power-off)']);
      out += rule([ON, LOAD], ['--kt-pt-a: var(--gradient-start-power-on)', '--kt-pt-b: var(--gradient-end-power-on)']);
      out += rule(ERR, ['--kt-pt-a: var(--destructive)', '--kt-pt-b: #000']);
      out += rule(`${C}::before`, ['content: ""', 'position: absolute', 'inset: -30%', 'pointer-events: none', 'opacity: 0.6',
        'background: repeating-conic-gradient(from 0deg, var(--kt-pt-a) 0deg 14deg, var(--kt-pt-b) 26deg 40deg, var(--kt-pt-a) 52deg 60deg)',
        '-webkit-mask: radial-gradient(circle, #000 18%, rgba(0, 0, 0, 0.6) 45%, transparent 70%)', 'mask: radial-gradient(circle, #000 18%, rgba(0, 0, 0, 0.6) 45%, transparent 70%)',
        'filter: blur(1.5px)', anim && `animation: kt-portal ${run(9, 'linear', 2)} infinite`, 'transition: opacity 0.6s ease']);
      out += rule(`${ON} > div::before`, ['opacity: 1', anim && runDecl(2.2, 'linear', 2)]);
      out += rule(`${LOAD} > div::before`, ['opacity: 0.85', anim && runDecl(1, 'linear', 2)]);
      out += rule(`${C}::after`, ['content: ""', 'position: absolute', 'inset: 30%', 'border-radius: 50%', 'pointer-events: none',
        'background: radial-gradient(circle, rgba(0, 0, 0, 0.75) 0 40%, transparent 72%)']);
      out += rule(I, ['z-index: 2']);
      break;
    }

    case 'toggle': {
      const glassy = pw.toggleLook !== 'classic';
      // Вертикальный тумблер - та же дорожка, повёрнутая стоймя: «подключено» вверху, ручка ходит по вертикали
      const vert = pw.toggleVertical;
      const { long, short, travel } = toggleTrack(pw);
      const size = [`width: ${vert ? short : long}px !important`, `height: ${vert ? long : short}px !important`];
      /** Сдвиг ручки к концу «подключено» на d px: вправо, у вертикального - вверх */
      const shift = (d: number) => `${vert ? 'translateY' : 'translateX'}(${d ? `${vert ? -d : d}px` : 0})`;
      if (glassy) {
        // Дорожка - стекло карточек из «Поверхностей» (заливка, зерно, размытие, цвет рамки), толщина
        // рамки - своя. Ручка - светящийся шар цвета кнопки; свечение растекается по стеклу
        out += rule(B, ['--kt-tg-a: var(--gradient-start-power-off)', '--kt-tg-b: var(--gradient-end-power-off)']);
        out += rule([ON, LOAD], ['--kt-tg-a: var(--gradient-start-power-on)', '--kt-tg-b: var(--gradient-end-power-on)']);
        out += rule(ERR, ['--kt-tg-a: var(--destructive)', '--kt-tg-b: color-mix(in srgb, var(--destructive) 70%, black)']);
        out += rule(C, [...size, 'border-radius: 999px !important', 'justify-content: center !important', 'overflow: hidden',
          `background: ${glass.layer ? 'transparent' : `${glass.grain}${glass.fill}`} !important`,
          ...glassBorder(glass, pw.ringWidth), `backdrop-filter: ${glass.layer ? 'none' : glass.filterPower} !important`,
          glass.layer && 'position: relative', glass.layer && 'isolation: isolate',
          // Блики - только «Блики по кромке» карточек (сверху и снизу); своя тень - если не включена тень из «Теней»
          `box-shadow: ${[hl && 'var(--kt-highlight)', 'inset 0 -8px 16px rgba(0, 0, 0, 0.1)', !pwShadow && '0 10px 24px rgba(0, 0, 0, 0.18)'].filter(Boolean).join(', ')} !important`]);
        if (glass.layer) out += rule(`${C}::before`, glassLayer(glass.layer, '999px', onLayer(`${glass.grain}${glass.fill} padding-box`)));
        if (glass.rimOver) out += rule(C, ['position: relative']) + rule(`${C}::before`, rimOverlay(glass.rimOver));
        if (pw.toggleLook === 'orb') {
          // Ручка - маленький «Шар света». Лента на ней толще, чем на большом шаре: при 58 px ядро иначе теряется
          out += rule(I, [`width: ${pw.knobSize}px !important`, `height: ${pw.knobSize}px !important`, 'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4)',
            `transform: ${shift(-travel)}`, 'transition: transform 0.55s cubic-bezier(0.34, 1.45, 0.64, 1)']);
          orbLook(10, 1.08, 24, 1.1);
          // След за ручкой: тонкая линия вдоль оси дорожки, заканчивается у центра ручки во включённом положении.
          // Середина следа - в 66 px от конца «отключено», поперёк оси холодная сторона и тёплая
          if (pw.orbTrail > 0) {
            const k = pw.orbTrail / 100;
            const at = (across: string) => vert ? `${across} calc(100% - 66px)` : `66px ${across}`;
            const ell = (along: number, across: number) => vert ? `${across}px ${along}px` : `${along}px ${across}px`;
            const side = (c: string, sign: string) => `radial-gradient(ellipse ${ell(52, 5)} at ${at(`calc(50% ${sign} 3px)`)}, color-mix(in srgb, ${c} 70%, transparent), transparent)`;
            out += rule(`${C}::after`, ['content: ""', 'position: absolute', 'inset: 0', 'pointer-events: none', 'opacity: 0', 'transition: opacity 0.9s ease',
              `background: radial-gradient(ellipse ${ell(56, 1.5)} at ${at('50%')}, #fff, transparent), ${side(orbA, '-')}, ${side(orbB, '+')}`]);
            out += rule(`${ON} > div::after`, [`opacity: ${k}`]);
            out += rule(`${LOAD} > div::after`, [`opacity: ${Math.round(k * 50) / 100}`]);
          }
        } else if (pw.toggleLook === 'filament') {
          // «Неоновая нить»: вдоль дорожки тонкая нить, вместо ручки бусина. Отключено - нить тусклая, при подключении
          // светится половина до бусины, подключено - вся, с белым ядром и свечением цвета кнопки. Постоянной анимации
          // нет: всё меняется переходами между состояниями
          const dim = 'color-mix(in srgb, var(--foreground) 14%, transparent)';
          const along = vert ? 'to top' : 'to right';
          const line = vert ? ['left: 50%', 'top: 34px', 'bottom: 34px', 'width: 4px', 'margin-left: -2px'] : ['top: 50%', 'left: 34px', 'right: 34px', 'height: 4px', 'margin-top: -2px'];
          out += rule(C, ['position: relative']);
          out += rule(`${C}::after`, ['content: ""', 'position: absolute', ...line, 'border-radius: 2px', 'pointer-events: none',
            `background: ${dim}`, 'transition: background 0.6s ease, box-shadow 0.6s ease']);
          out += rule(`${LOAD} > div::after`, [`background: linear-gradient(${along}, var(--kt-tg-a) 0 50%, ${dim} 50%)`]);
          out += rule(`${ON} > div::after`, [`background: linear-gradient(${along}, var(--kt-tg-a), #fff 45% 55%, var(--kt-tg-b))`,
            'box-shadow: 0 0 6px 1px color-mix(in srgb, var(--kt-tg-a) 90%, transparent), 0 0 20px 5px color-mix(in srgb, var(--kt-tg-b) 50%, transparent), 0 0 40px 10px color-mix(in srgb, var(--kt-tg-b) 22%, transparent)']);
          out += rule(`${ERR} > div::after`, ['background: var(--destructive)', 'box-shadow: 0 0 8px 1px color-mix(in srgb, var(--destructive) 70%, transparent)']);
          out += rule(I, ['width: 12px !important', 'height: 12px !important', 'border-radius: 50%', 'background: color-mix(in srgb, var(--foreground) 25%, transparent)',
            `transform: ${shift(-travel)}`, 'transition: transform 0.7s cubic-bezier(0.34, 1.3, 0.64, 1), background 0.5s ease, box-shadow 0.5s ease']);
          out += rule(`${ON} > div > div`, ['background: #fff', 'box-shadow: 0 0 8px 2px var(--kt-tg-a), 0 0 18px 6px color-mix(in srgb, var(--kt-tg-b) 60%, transparent)']);
          out += rule(`${ERR} > div > div`, ['background: var(--destructive)', 'box-shadow: 0 0 10px 2px color-mix(in srgb, var(--destructive) 60%, transparent)']);
          // На бусине значки не помещаются: ошибку показывает красная нить
          out += rule(`${I} > :is(img, svg)`, ['visibility: hidden']);
        } else {
          // Ручка: светлое пятно внутри (knobShine), свечение вокруг (knobGlow), диаметр и непрозрачность. Ход
          // ручки от диаметра не зависит: при любом её центр стоит в центре полукруга дорожки
          const shine = pw.knobShine / 100, halo = pw.knobGlow / 100;
          const knobMix = (c: string) => pw.knobOpacity >= 100 ? c : `color-mix(in srgb, ${c} ${pw.knobOpacity}%, transparent)`;
          const tint = shine > 0 ? `color-mix(in srgb, var(--kt-tg-a) ${Math.round(100 - 55 * shine)}%, white)` : 'var(--kt-tg-a)';
          out += rule(I, [`width: ${pw.knobSize}px !important`, `height: ${pw.knobSize}px !important`, 'border-radius: 50%',
            `background: radial-gradient(circle at 50% 42%, ${knobMix(tint)}, ${knobMix('var(--kt-tg-a)')} 55%, ${knobMix('var(--kt-tg-b)')})`,
            // Без свечения остаются блик сверху и обычная тень, как у классической ручки
            `box-shadow: ${[shine > 0 && `inset 0 1px 2px rgba(255, 255, 255, ${Math.round(60 * shine) / 100})`, !pw.toggleGlow ? '0 4px 12px rgba(0, 0, 0, 0.3)'
              : halo > 0 ? `0 0 ${Math.round(16 * halo)}px ${Math.round(4 * halo)}px color-mix(in srgb, var(--kt-tg-a) ${Math.round(70 * halo)}%, transparent), 0 0 ${Math.round(46 * halo)}px ${Math.round(16 * halo)}px color-mix(in srgb, var(--kt-tg-b) ${Math.round(40 * halo)}%, transparent)`
              : false].filter(Boolean).join(', ') || 'none'}`,
            `transform: ${shift(-travel)}`, 'transition: transform 0.55s cubic-bezier(0.34, 1.45, 0.64, 1)']);
        }
      } else {
        out += rule(C, [...size, 'border-radius: 999px !important', 'justify-content: center !important',
          'background: linear-gradient(135deg, var(--gradient-start-power-off), var(--gradient-end-power-off)) !important',
          'box-shadow: inset 0 3px 8px rgba(0, 0, 0, 0.25) !important']);
        out += rule(`${ON} > div`, ['background: linear-gradient(135deg, var(--gradient-start-power-on), var(--gradient-end-power-on)) !important']);
        out += rule(I, ['width: 58px !important', 'height: 58px !important', 'border-radius: 50%', 'background: radial-gradient(circle at 35% 28%, #ffffff, #e4e7ee)',
          'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35), inset 0 -2px 4px rgba(0, 0, 0, 0.08)',
          `transform: ${shift(-travel)}`, 'transition: transform 0.55s cubic-bezier(0.34, 1.45, 0.64, 1)']);
      }
      out += rule(`${ON} > div > div`, [`transform: ${shift(travel)}`]);
      out += rule(`${LOAD} > div > div`, [`transform: ${shift(0)}`]);
      out += rule(ICONS, ['inset: 22% !important', 'width: 56% !important', 'height: 56% !important']);
      // Без значка на ручке остаются только спиннер подключения и знак ошибки
      if (!pw.toggleIcon) out += rule([`${I} > img:nth-child(2)`, `${I} > img:nth-child(3)`], ['visibility: hidden']);
      for (const { scheme, sel } of bakeScopes(cfg)) {
        const p = cfg.palette[scheme];
        out += rule(scoped(sel, `${I} > img:nth-child(2)`), [`content: ${POWER_ICONS.pause(glassy ? '#ffffff' : mix(p.powerOnEnd, '#000000', 0.15))}`]);
        out += rule(scoped(sel, `${I} > img:nth-child(3)`), [`content: ${POWER_ICONS.power(glassy ? '#ffffff' : mix(p.powerOffEnd, '#000000', 0.1))}`]);
        out += rule(scoped(sel, `${I} > img:nth-child(4)`), [`content: ${POWER_ICONS.alert(glassy ? '#ffffff' : p.destructive)}`]);
        out += rule(scoped(sel, `${I} > svg`), [`color: ${glassy ? '#ffffff' : p.powerOffEnd} !important`]);
      }
      break;
    }

    case 'daynight': {
      // Тумблер-пейзаж. Дорожка - дневное небо, круг::before - ночное небо со звёздами (проявляется),
      // круг::after - облака или холмы (ночью темнеют, облака опускаются). Ручка - солнце, её ::before -
      // луна с кратерами. Всё меняется переходами, постоянной анимации нет
      const hills = pw.dayScene === 'hills';
      out += rule(C, ['width: 152px !important', 'height: 74px !important', 'border-radius: 999px !important', 'justify-content: center !important',
        'position: relative', 'overflow: hidden', 'isolation: isolate', `border: ${pw.ringWidth > 0 ? pw.ringWidth + 1 : 0}px solid #e3f2ff !important`,
        `background: ${hills ? 'linear-gradient(180deg, #78c4f4, #d2eefd)' : 'linear-gradient(180deg, #3b98e6, #6fbdf3 55%, #a4d9fa)'} !important`,
        'backdrop-filter: none !important', `box-shadow: inset 0 4px 10px rgba(0, 0, 0, 0.3)${pwShadow ? '' : ', 0 8px 20px rgba(0, 0, 0, 0.18)'} !important`,
        'transition: border-color 0.7s ease, box-shadow 0.4s ease, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) !important']);
      out += rule(`${C}::before`, ['content: ""', 'position: absolute', 'inset: 0', 'z-index: 0', 'pointer-events: none',
        `background: ${DN_STARS} center / 100% 100% no-repeat, linear-gradient(180deg, #0c1230, #1e2950 60%, #34406b)`, 'transition: opacity 0.7s ease']);
      out += rule(`${C}::after`, ['content: ""', 'position: absolute', 'inset: 0', 'z-index: 1', 'pointer-events: none',
        // День при подключении - солнце справа, облачка - слева, и наоборот
        `background: ${hills ? DN_HILLS : dnClouds(pw.dayOn ? 86 : 0)} center bottom / 100% 100% no-repeat`, 'transition: filter 0.7s ease, transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)']);
      out += rule(I, ['z-index: 2', 'width: 58px !important', 'height: 58px !important', 'border-radius: 50%', 'flex-shrink: 0',
        'background: radial-gradient(circle at 36% 30%, #fff8cf, #ffd84a 42%, #f6b40e)',
        'transform: translateX(-39px)', 'transition: transform 0.6s cubic-bezier(0.34, 1.4, 0.64, 1), box-shadow 0.7s ease']);
      out += rule(`${I}::before`, ['content: ""', 'position: absolute', 'inset: 0', 'border-radius: 50%', 'pointer-events: none',
        'background: radial-gradient(circle at 30% 34%, #a3adbf 0 10%, transparent 11%), radial-gradient(circle at 66% 58%, #a9b3c4 0 14%, transparent 15%), radial-gradient(circle at 38% 74%, #b0bac9 0 7%, transparent 8%), radial-gradient(circle at 36% 30%, #f5f7fb, #ccd3df 70%, #b7c0cf)',
        'box-shadow: inset -5px -6px 10px rgba(0, 0, 0, 0.16)', 'transition: opacity 0.6s ease']);
      // Что видно днём и ночью. Отключено - ночь, подключено - день (или наоборот)
      const scene = (night: boolean): [string, Decl[]][] => [
        ['', [`border-color: ${night ? '#56637f' : '#e3f2ff'} !important`]],
        ['::before', [`opacity: ${night ? 1 : 0}`]],
        ['::after', [night ? (hills ? 'filter: hue-rotate(95deg) saturate(0.75) brightness(0.42)' : 'filter: brightness(0.5) saturate(0.55)') : 'filter: none',
          !hills && `transform: translateY(${night ? 16 : 0}%)`]],
        [' > div', [`box-shadow: ${dnHalo(night)}`]],
        [' > div::before', [`opacity: ${night ? 1 : 0}`]]
      ];
      for (const [part, decls] of scene(pw.dayOn)) out += rule(`${C}${part}`, decls);
      for (const [part, decls] of scene(!pw.dayOn)) out += rule(`${ON} > div${part}`, decls);
      out += rule(`${ON} > div > div`, ['transform: translateX(39px)']);
      out += rule(`${LOAD} > div > div`, ['transform: translateX(0)']);
      out += rule(`${ERR} > div`, ['border-color: var(--destructive) !important']);
      // Значки питания и паузы не нужны - видно по солнцу и луне. Спиннер и знак ошибки - на ручке
      out += rule([`${I} > img:nth-child(2)`, `${I} > img:nth-child(3)`], ['visibility: hidden']);
      out += rule(ICONS, ['inset: 22% !important', 'width: 56% !important', 'height: 56% !important']);
      out += rule(`${I} > svg`, ['color: #24324f !important']);
      out += rule(`${I} > img:nth-child(4)`, [`content: ${POWER_ICONS.alert('#d63b3b')}`]);
      break;
    }
  }

  // Стекло рядом с анимированной кнопкой. Chromium перерисовывает за кадр один прямоугольник вокруг
  // всего, что изменилось. Если кнопка движется, а курсор в это время подсвечивает что-то ещё (пункт
  // меню, карточку), прямоугольник растягивается между ними и режет стекло (backdrop-filter) поперёк:
  // перерисованная часть получается светлее, на краю остаётся полоса. Пока кнопка движется, почти
  // невидимый слой на всё окно меняется в те же кадры, что и она, - кадр перерисовывается целиком, и
  // стекло считается заново. Слой прозрачен для мыши и не затемняет окно заметно (0,2-0,4%)
  const moving = movingWhen(pw);
  if (moving) out += rule(`${moving}::after`, ['content: ""', 'position: fixed', 'inset: 0', 'z-index: 2147483647', 'pointer-events: none',
    // Отдельный слой (will-change): иначе смена прозрачности заставит заново растрировать всё окно.
    // Шаги - по общей сетке кадров (frames.ts), у «Звёздного шара» своя: 20 кадров/с (particle-sphere.css)
    'background: #000', 'opacity: 0.002', 'will-change: opacity', `animation: kt-redraw 1s steps(${st === 'sphere' ? 20 : FPS}) infinite alternate`]);
  return out;
}

/** На светлом фоне белые иконки не видны - затемняем их */
function lightIconFix(cfg: ThemeConfig, rule: RuleFn): string {
  return bakeScopes(cfg).filter((x) => x.scheme === 'light').map((x) =>
    rule(scoped(x.sel, `${ICONS}`), ['filter: invert(1) brightness(0.25)'])).join('');
}

export function powerKeyframes(cfg: ThemeConfig): Record<string, string> {
  const pw = cfg.power;
  const kf: Record<string, string> = {};
  if (pw.glow > 0 && pw.glowPulse) kf['pw-glow'] = 'from { transform: translate(-50%, -50%) scale(0.9); } to { transform: translate(-50%, -50%) scale(1.1); }';
  if (pw.idle === 'float') kf['pw-float'] = '0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); }';
  if (pw.idle === 'breathe') kf['pw-breathe-c'] = '0%, 100% { transform: scale(1); } 50% { transform: scale(1.04); }';
  if (pw.idle === 'wobble') kf['pw-wobble'] = '0%, 100% { transform: rotate(0); } 25% { transform: rotate(-4deg); } 75% { transform: rotate(4deg); }';
  switch (pw.style) {
    case 'pulse': kf['pw-ripple'] = 'from { opacity: 0.7; transform: scale(1); } to { opacity: 0; transform: scale(1.7); }'; break;
    case 'ring': case 'radar': kf.spin = 'to { transform: rotate(360deg); }'; break;
    case 'network': case 'globe': case 'dots': kf['sp-load'] = 'from { opacity: 0.55; } to { opacity: 1; }'; break;
    case 'plasma':
      kf.spin = 'to { transform: rotate(360deg); }';
      kf.plasma = 'from { box-shadow: inset 0 0 22px rgba(0, 0, 0, 0.6), 0 0 24px color-mix(in srgb, var(--kt-sp-a) 40%, transparent); } to { box-shadow: inset 0 0 18px rgba(0, 0, 0, 0.5), 0 0 40px color-mix(in srgb, var(--kt-sp-a) 65%, transparent); }';
      break;
    case 'neon': kf.neon = '0%, 100% { opacity: 1; } 92% { opacity: 1; } 93% { opacity: 0.7; } 94% { opacity: 1; } 96% { opacity: 0.8; } 97% { opacity: 1; }'; break;
    case 'rocket':
      kf['rocket-stars'] = 'to { background-position: -64px 64px, -64px 64px, -64px 64px, -64px 64px, -64px 64px; }';
      kf['rocket-shake'] = '0% { transform: translate(0, 12px); } 25% { transform: translate(-1px, 11px); } 50% { transform: translate(1px, 12px); } 75% { transform: translate(0, 13px); }';
      kf['rocket-fly'] = '0%, 100% { transform: translate(5px, -7px) rotate(45deg); } 50% { transform: translate(8px, -10px) rotate(43deg); }';
      kf.flame = 'from { transform: scaleY(0.45) scaleX(0.9); } to { transform: scaleY(0.65) scaleX(1.05); }';
      kf['flame-big'] = 'from { transform: scaleY(1.15) scaleX(0.9); } to { transform: scaleY(1.6) scaleX(1.08); }';
      break;
    case 'orbit': {
      // Точки по эллипсу, между ними линейно - на глаз это гладкая орбита
      const n = ORBIT_POINTS;
      kf.orbit = Array.from({ length: n + 1 }, (_, i) => `${Math.round((i / n) * 10000) / 100}% { background-position: ${orbitPos(-0.35 + (i / n) * Math.PI * 2)}; }`).join(' ');
      break;
    }
    case 'liquid':
      kf.wave = 'to { transform: translateX(-50%) rotate(360deg); }';
      kf['lq-fill'] = 'from { top: 70%; } to { top: 45%; }';
      break;
    case 'equalizer':
      kf.eq = '0% { background-size: 7px 30%, 7px 75%, 7px 45%, 7px 90%, 7px 35%; } 33% { background-size: 7px 85%, 7px 40%, 7px 95%, 7px 50%, 7px 70%; } 66% { background-size: 7px 50%, 7px 95%, 7px 30%, 7px 70%, 7px 90%; } 100% { background-size: 7px 70%, 7px 55%, 7px 80%, 7px 35%, 7px 60%; }';
      kf['eq-load'] = 'from { background-size: 7px 20%, 7px 35%, 7px 50%, 7px 35%, 7px 20%; } to { background-size: 7px 50%, 7px 35%, 7px 20%, 7px 35%, 7px 50%; }';
      break;
    case 'heartbeat':
      kf.ecg = 'to { background-position: -56px 0; }';
      kf.heart = '0%, 100% { transform: scale(1); } 14% { transform: scale(1.07); } 28% { transform: scale(1); } 42% { transform: scale(1.05); } 70% { transform: scale(1); }';
      break;
    case 'portal': kf.portal = 'from { transform: rotate(0deg) scale(1); } 50% { transform: rotate(180deg) scale(1.08); } to { transform: rotate(360deg) scale(1); }'; break;
  }
  if (pw.style === 'radar') kf.blink = '0%, 100% { opacity: 0.2; } 50% { opacity: 1; }';
  // Сжатие по косинусу, как у вращения: у плоского положения лента быстрее всего и тускнеет, иначе она на миг
  // становится тонкой резкой линией. Кривая разбита на отрезки, потому что steps() её не сохраняет: шаги на отрезке равные
  if (pw.style === 'caustic' || orbToggle(pw)) kf['orb-twist'] = Array.from({ length: ORB_PARTS + 1 }, (_, i) => {
    const y = Math.cos((Math.PI * i) / ORB_PARTS);
    return `${Math.round((i / ORB_PARTS) * 10000) / 100}% { transform: scaleY(${Math.round(y * 1000) / 1000}); opacity: ${Math.round((0.35 + 0.65 * Math.abs(y)) * 1000) / 1000}; }`;
  }).join(' ');
  if (movingWhen(pw)) kf.redraw = 'to { opacity: 0.004; }';
  return kf;
}
