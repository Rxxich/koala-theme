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
import { mix } from './color';
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

/** Стили, которые движутся всё время, и те, что только при подключении и подключено */
const MOVING_ALWAYS = ['liquid', 'plasma', 'portal'];
const MOVING_ON = ['pulse', 'ring', 'neon', 'network', 'globe', 'dots', 'sphere', 'rocket', 'orbit', 'radar', 'equalizer', 'heartbeat'];

/** Когда кнопка анимирована - условие для :root (без вложенного :has, его браузер не принимает), иначе null */
function movingWhen(pw: ThemeConfig['power']): string | null {
  if (!pw.animate) return null;
  const btn = '[data-guide="home-power-toggle"]';
  if (MOVING_ALWAYS.includes(pw.style) || (pw.idle !== 'none' && pw.style !== 'sphere')) return `:root:has(${btn})`;
  if (MOVING_ON.includes(pw.style) || (pw.glowPulse && pw.glow > 0)) return `:root:has(${btn} > div[class*="border-stroke-power-on"], ${btn} svg[role="status"].opacity-100)`;
  return null;
}

type Decl = string | false | null | undefined | 0;
type RuleFn = (selector: string | string[], decls: Decl[]) => string;

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

/** Схемы, для которых нужно "запечь" цвета в картинки */
function bakeScopes(cfg: ThemeConfig): { scheme: Scheme; sel: string }[] {
  if (cfg.mode === 'dark') return [{ scheme: 'dark', sel: 'html:root' }];
  if (cfg.mode === 'light') return [{ scheme: 'light', sel: 'html:root' }];
  return [{ scheme: 'light', sel: 'html:not(.dark)' }, { scheme: 'dark', sel: 'html.dark' }];
}
const scoped = (sel: string, part: string) => part.replace(':root', sel);

export function powerRules(cfg: ThemeConfig, rule: RuleFn): string {
  const pw = cfg.power;
  const dur = (s: number) => `${Math.round((s / Math.max(0.2, pw.speed)) * 100) / 100}s`;
  const anim = pw.animate;
  const st = pw.style;
  let out = '';

  /* ---------- Общие настройки ---------- */
  // Шары всегда круглые и заливаются по-своему
  const ball = st === 'sphere' || st === 'network' || st === 'globe' || st === 'dots' || st === 'plasma';
  const radius = pw.shape === 'circle' ? '50%' : pw.shape === 'squircle' ? '34%' : '20%';
  if (st !== 'app' || pw.glow > 0 || pw.shape !== 'circle') out += rule(B, ['isolation: isolate', `--kt-pw-r: ${radius}`]);
  if (pw.size !== 100 && st !== 'sphere') out += rule(C, [`zoom: ${pw.size / 100}`]);
  if (pw.shape !== 'circle' && st !== 'toggle' && !ball) out += rule(C, ['border-radius: var(--kt-pw-r) !important']);
  if (pw.ringWidth !== 2 && !ball) out += rule(C, [`border-width: ${pw.ringWidth}px !important`]);

  // Заливка круга
  if (pw.fill !== 'app' && !ball) {
    const a = pw.fillOpacity;
    const g = (state: 'off' | 'on') => {
      const s = `var(--gradient-start-power-${state})`, e = `var(--gradient-end-power-${state})`;
      const m = (c: string) => `color-mix(in srgb, ${c} ${a}%, transparent)`;
      switch (pw.fill) {
        case 'radial': return `radial-gradient(circle at 30% 30%, ${m(s)}, ${m(e)})`;
        case 'linear': return `linear-gradient(145deg, ${m(s)}, ${m(e)})`;
        case 'conic': return `conic-gradient(from 200deg, ${m(s)}, ${m(e)}, ${m(s)})`;
        case 'solid': return m(e);
        default: return 'transparent';
      }
    };
    out += rule(C, [`background: ${g('off')} !important`]);
    out += rule(`${ON} > div`, [`background: ${g('on')} !important`]);
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
    if (pw.glowPulse && anim) out += rule(`${ON}::after`, [`animation: kt-pw-glow ${dur(2.8)} ease-in-out infinite alternate`]);
    if (pw.hover === 'glow') out += rule(`${B}:hover:not(:disabled)::after`, [`opacity: ${Math.min(1, gk + 0.3).toFixed(2)}`, 'transform: translate(-50%, -50%) scale(1.18)']);
  }

  // Наведение
  const hov = `${B}:hover:not(:disabled) > div`;
  if (pw.hover !== 'app' && st !== 'sphere') out += rule(C, ['transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.4s ease, box-shadow 0.4s ease, border-color 0.4s ease !important']);
  if (pw.hover === 'scale') out += rule(hov, ['transform: scale(1.07)']);
  if (pw.hover === 'lift') out += rule(hov, ['transform: translateY(-5px)']);
  if (pw.hover === 'tilt') out += rule(hov, ['transform: rotate(-8deg) scale(1.03)']);
  if (pw.hover === 'none') out += rule(B, ['scale: 1 !important']);

  // Анимация в покое (выключено)
  if (pw.idle !== 'none' && anim && st !== 'sphere') {
    const kf = { float: 'kt-pw-float', breathe: 'kt-pw-breathe-c', wobble: 'kt-pw-wobble' }[pw.idle];
    out += rule(`${IDLE} > div`, [`animation: ${kf} ${dur(pw.idle === 'wobble' ? 2.4 : 3.4)} ease-in-out infinite`]);
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

  /* ---------- Стили ---------- */
  const g = pw.glow / 100;
  switch (st) {
    case 'app':
      break;

    case 'glow':
      out += rule(C, ['box-shadow: 0 0 0 6px color-mix(in srgb, var(--stroke-power-off) 14%, transparent) !important']);
      out += rule(`${ON} > div`, ['box-shadow: 0 0 0 8px color-mix(in srgb, var(--stroke-power-on) 18%, transparent), 0 0 30px color-mix(in srgb, var(--gradient-end-power-on) 45%, transparent) !important']);
      break;

    case 'pulse':
      out += rule(C, ['position: relative']);
      out += rule([`${B}::before`, `${C}::after`], ['content: ""', 'position: absolute', 'inset: -2px', 'border-radius: var(--kt-pw-r)', 'pointer-events: none',
        `border: ${Math.max(1, pw.ringWidth)}px solid var(--stroke-power-on)`, 'opacity: 0']);
      out += rule(`${B}::before`, ['z-index: -1']);
      if (anim) {
        out += rule([`${ON}::before`, `${ON} > div::after`], [`animation: kt-pw-ripple ${dur(2.6)} cubic-bezier(0.2, 0.6, 0.35, 1) infinite`]);
        out += rule(`${ON} > div::after`, [`animation-delay: ${dur(1.3)}`]);
        out += rule([`${LOAD}::before`, `${LOAD} > div::after`], ['border-color: var(--stroke-power-off)', `animation: kt-pw-ripple ${dur(1.2)} ease-out infinite`]);
        out += rule(`${LOAD} > div::after`, [`animation-delay: ${dur(0.6)}`]);
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
      out += rule([`${ON}::before`, `${LOAD}::before`], ['opacity: 1', anim && `animation: kt-spin ${dur(2.8)} linear infinite`]);
      if (anim) out += rule(`${LOAD}::before`, [`animation-duration: ${dur(1)}`]);
      out += rule(`${IDLE}::before`, ['opacity: 0.55', 'background: color-mix(in srgb, var(--stroke-power-off) 65%, transparent)']);
      break;
    }

    case 'glass': {
      const glass = (a: string, b: string) => `radial-gradient(120% 120% at 30% 18%, rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0.08) 42%, transparent 70%), radial-gradient(circle at 30% 45%, color-mix(in srgb, ${a} 60%, transparent), color-mix(in srgb, ${b} 60%, transparent)) !important`;
      out += rule(C, [`background: ${glass('var(--gradient-start-power-off)', 'var(--gradient-end-power-off)')}`, 'border: 1px solid rgba(255, 255, 255, 0.38) !important',
        'box-shadow: inset 0 2px 1px rgba(255, 255, 255, 0.5), inset 0 -10px 22px rgba(0, 0, 0, 0.16), 0 18px 40px rgba(0, 0, 0, 0.25) !important',
        'backdrop-filter: blur(16px) saturate(170%) !important']);
      out += rule(`${ON} > div`, [`background: ${glass('var(--gradient-start-power-on)', 'var(--gradient-end-power-on)')}`,
        'box-shadow: inset 0 2px 1px rgba(255, 255, 255, 0.55), inset 0 -10px 22px rgba(0, 0, 0, 0.12), 0 18px 40px rgba(0, 0, 0, 0.2) !important']);
      break;
    }

    case 'neon':
      out += rule(B, ['--kt-pw: var(--stroke-power-off)']);
      out += rule([ON, LOAD], ['--kt-pw: var(--gradient-start-power-on)']);
      out += rule(ERR, ['--kt-pw: var(--destructive)']);
      out += rule(C, ['background: color-mix(in srgb, var(--background) 82%, transparent) !important', `border: ${Math.max(1, pw.ringWidth)}px solid var(--kt-pw) !important`,
        `box-shadow: 0 0 6px var(--kt-pw), 0 0 ${Math.round(26 * g + 8)}px color-mix(in srgb, var(--kt-pw) 70%, transparent), inset 0 0 18px color-mix(in srgb, var(--kt-pw) 45%, transparent) !important`]);
      out += rule(ICONS, ['filter: drop-shadow(0 0 6px var(--kt-pw))']);
      if (anim) out += rule(`${ON} > div`, [`animation: kt-neon ${dur(4)} linear infinite`]);
      out += lightIconFix(cfg, rule);
      break;

    case 'minimal':
      out += rule(C, ['background: var(--card) !important', `border: ${Math.max(1, pw.ringWidth - 0.5)}px solid var(--stroke) !important`, 'box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06) !important', 'backdrop-filter: none !important']);
      out += rule(`${ON} > div`, ['background: color-mix(in srgb, var(--primary) 12%, var(--card)) !important', 'border-color: var(--primary) !important', 'box-shadow: 0 0 0 6px color-mix(in srgb, var(--primary) 14%, transparent) !important']);
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
      if (anim) out += rule(`${LOAD} > div::before`, [`animation: kt-sp-load ${dur(0.9)} ease-in-out infinite alternate`]);
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
        'filter: blur(7px) saturate(1.3)', anim && `animation: kt-spin ${dur(10)} linear infinite`]);
      out += rule(`${C}::after`, [...layer, 'inset: 0',
        'background: repeating-conic-gradient(from 10deg, transparent 0deg 13deg, color-mix(in srgb, var(--kt-sp-a) 45%, white) 14.5deg, transparent 16deg 37deg)',
        '-webkit-mask: radial-gradient(circle, transparent 10%, #000 22%, rgba(0, 0, 0, 0.6) 50%, transparent 66%)', 'mask: radial-gradient(circle, transparent 10%, #000 22%, rgba(0, 0, 0, 0.6) 50%, transparent 66%)',
        'filter: blur(0.8px)', anim && `animation: kt-spin ${dur(16)} linear infinite reverse`]);
      if (anim) {
        out += rule([`${ON} > div::before`, `${LOAD} > div::before`], [`animation-duration: ${dur(3.2)}`]);
        out += rule([`${ON} > div::after`, `${LOAD} > div::after`], [`animation-duration: ${dur(5)}`]);
        out += rule(`${ON} > div`, [`animation: kt-plasma ${dur(2.6)} ease-in-out infinite alternate`]);
      }
      out += rule(I, ['z-index: 2', 'filter: drop-shadow(0 0 6px color-mix(in srgb, var(--kt-sp-a) 80%, transparent))']);
      break;
    }

    case 'rocket': {
      // Иллюминатор с ракетой. Выключено - стоит на земле; подключение - трясётся, вспыхивает пламя;
      // подключено - взлетает вверх-вправо, пламя бьётся, звёзды несутся мимо
      out += rule(C, ['overflow: hidden', 'position: relative',
        'background: radial-gradient(circle at 50% 28%, #23305a, #0b1022 72%) !important', 'backdrop-filter: none !important']);
      out += rule(`${ON} > div`, ['background: radial-gradient(circle at 72% 28%, color-mix(in srgb, var(--gradient-start-power-on) 26%, #151c3c), #070a16 72%) !important']);
      out += rule(`${C}::before`, ['content: ""', 'position: absolute', 'inset: 0', 'pointer-events: none', 'opacity: 0.55',
        'background: radial-gradient(1.2px 1.2px at 12px 18px, #fff, transparent), radial-gradient(1px 1px at 46px 8px, #fff, transparent), radial-gradient(1.4px 1.4px at 30px 40px, #fff, transparent), radial-gradient(1px 1px at 56px 52px, #fff, transparent), radial-gradient(1px 1px at 8px 58px, #fff, transparent)',
        'background-size: 64px 64px']);
      out += rule(`${ON} > div::before`, ['opacity: 1', anim && `animation: kt-rocket-stars ${dur(0.7)} linear infinite`]);
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
      out += rule(`${LOAD} > div > div`, [anim && `animation: kt-rocket-shake ${dur(0.12)} linear infinite`]);
      out += rule(`${LOAD} > div > div::after`, ['opacity: 0.9', 'transform: scaleY(0.55)', anim && `animation: kt-flame ${dur(0.12)} ease-in-out infinite alternate`]);
      out += rule(`${ON} > div > div`, ['transform: translate(5px, -7px) rotate(45deg)', anim && `animation: kt-rocket-fly ${dur(1.6)} ease-in-out ${dur(1)} infinite`]);
      out += rule(`${ON} > div > div::after`, ['opacity: 1', 'transform: scaleY(1.35)', anim && `animation: kt-flame-big ${dur(0.14)} ease-in-out infinite alternate`]);
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
        out += rule(`${ON} > div::after`, [`animation: kt-orbit ${dur(3.2)} linear infinite`]);
        out += rule(`${LOAD} > div::after`, [`animation: kt-orbit ${dur(1.1)} linear infinite`]);
      }
      break;
    }

    case 'radar': {
      out += rule(B, ['--kt-rd: var(--stroke-power-off)']);
      out += rule([ON, LOAD], ['--kt-rd: var(--gradient-start-power-on)']);
      out += rule(ERR, ['--kt-rd: var(--destructive)']);
      out += rule(C, ['overflow: hidden', 'position: relative', 'border-color: color-mix(in srgb, var(--kt-rd) 70%, transparent) !important',
        'background: linear-gradient(90deg, transparent calc(50% - 0.5px), color-mix(in srgb, var(--kt-rd) 28%, transparent) calc(50% - 0.5px) calc(50% + 0.5px), transparent calc(50% + 0.5px)), linear-gradient(0deg, transparent calc(50% - 0.5px), color-mix(in srgb, var(--kt-rd) 28%, transparent) calc(50% - 0.5px) calc(50% + 0.5px), transparent calc(50% + 0.5px)), repeating-radial-gradient(circle, transparent 0 15px, color-mix(in srgb, var(--kt-rd) 26%, transparent) 15px 16px), radial-gradient(circle, color-mix(in srgb, var(--kt-rd) 16%, #05110d), #020806 75%) !important',
        'backdrop-filter: none !important']);
      out += rule(`${C}::before`, ['content: ""', 'position: absolute', 'inset: 0', 'border-radius: inherit', 'pointer-events: none', 'opacity: 0',
        'background: conic-gradient(from 0deg, transparent 0deg, transparent 270deg, color-mix(in srgb, var(--kt-rd) 75%, transparent) 360deg)', 'transition: opacity 0.5s ease']);
      out += rule([`${ON} > div::before`, `${LOAD} > div::before`], ['opacity: 1', anim && `animation: kt-spin ${dur(2.4)} linear infinite`]);
      out += rule(`${C}::after`, ['content: ""', 'position: absolute', 'inset: 0', 'pointer-events: none', 'opacity: 0',
        'background: radial-gradient(circle at 70% 32%, var(--kt-rd) 0 2.5px, transparent 4px), radial-gradient(circle at 28% 66%, var(--kt-rd) 0 2px, transparent 3.5px), radial-gradient(circle at 62% 74%, var(--kt-rd) 0 1.8px, transparent 3px)']);
      out += rule(`${ON} > div::after`, ['opacity: 1', anim && `animation: kt-blink ${dur(2.4)} ease-in-out infinite`]);
      out += rule(I, ['z-index: 2']);
      break;
    }

    case 'liquid': {
      out += rule(C, ['overflow: hidden', 'position: relative', 'background: color-mix(in srgb, var(--card) 45%, transparent) !important']);
      const wave = (alpha: number, r: string) => ['content: ""', 'position: absolute', 'left: 50%', 'width: 230%', 'aspect-ratio: 1', `border-radius: ${r}`, 'pointer-events: none',
        `background: linear-gradient(180deg, color-mix(in srgb, var(--kt-lq-a) ${alpha}%, transparent), color-mix(in srgb, var(--kt-lq-b) ${alpha}%, transparent) 30%)`,
        'top: var(--kt-lq)', 'transform: translateX(-50%) rotate(0deg)', 'transition: top 1.4s cubic-bezier(0.4, 0, 0.2, 1)'];
      out += rule(B, ['--kt-lq: 84%', '--kt-lq-a: var(--gradient-start-power-off)', '--kt-lq-b: var(--gradient-end-power-off)']);
      out += rule(ON, ['--kt-lq: 26%', '--kt-lq-a: var(--gradient-start-power-on)', '--kt-lq-b: var(--gradient-end-power-on)']);
      out += rule(ERR, ['--kt-lq-a: var(--destructive)', '--kt-lq-b: var(--destructive)']);
      out += rule(`${C}::before`, [...wave(95, '42%'), 'z-index: 1', anim && `animation: kt-wave ${dur(7)} linear infinite`]);
      out += rule(`${C}::after`, [...wave(55, '38%'), 'z-index: 0', 'margin-top: -5px', anim && `animation: kt-wave ${dur(11)} linear infinite reverse`]);
      if (anim) out += rule([`${LOAD} > div::before`, `${LOAD} > div::after`], [`animation: kt-wave ${dur(3)} linear infinite, kt-lq-fill ${dur(1.6)} ease-in-out infinite alternate`]);
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
        out += rule(`${ON} > div > div::before`, [`animation: kt-eq ${dur(1.1)} ease-in-out infinite alternate`]);
        out += rule(`${LOAD} > div > div::before`, [`animation: kt-eq-load ${dur(0.9)} ease-in-out infinite alternate`]);
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
        out += rule(`${ON} > div > div::before`, [`animation: kt-ecg ${dur(1.2)} linear infinite`, 'filter: drop-shadow(0 0 4px var(--stroke-power-on))']);
        out += rule(`${LOAD} > div > div::before`, [`animation: kt-ecg ${dur(2.4)} linear infinite`]);
        out += rule(`${ON} > div`, [`animation: kt-heart ${dur(1.2)} ease-in-out infinite`]);
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
        'filter: blur(1.5px)', anim && `animation: kt-portal ${dur(9)} linear infinite`, 'transition: opacity 0.6s ease']);
      out += rule(`${ON} > div::before`, ['opacity: 1', anim && `animation-duration: ${dur(2.2)}`]);
      out += rule(`${LOAD} > div::before`, ['opacity: 0.85', anim && `animation-duration: ${dur(1)}`]);
      out += rule(`${C}::after`, ['content: ""', 'position: absolute', 'inset: 30%', 'border-radius: 50%', 'pointer-events: none',
        'background: radial-gradient(circle, rgba(0, 0, 0, 0.75) 0 40%, transparent 72%)']);
      out += rule(I, ['z-index: 2']);
      break;
    }

    case 'toggle': {
      out += rule(C, ['width: 152px !important', 'height: 74px !important', 'border-radius: 999px !important', 'justify-content: center !important',
        'background: linear-gradient(135deg, var(--gradient-start-power-off), var(--gradient-end-power-off)) !important',
        'box-shadow: inset 0 3px 8px rgba(0, 0, 0, 0.25) !important']);
      out += rule(`${ON} > div`, ['background: linear-gradient(135deg, var(--gradient-start-power-on), var(--gradient-end-power-on)) !important']);
      out += rule(I, ['width: 58px !important', 'height: 58px !important', 'border-radius: 50%', 'background: radial-gradient(circle at 35% 28%, #ffffff, #e4e7ee)',
        'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35), inset 0 -2px 4px rgba(0, 0, 0, 0.08)',
        'transform: translateX(-39px)', 'transition: transform 0.55s cubic-bezier(0.34, 1.45, 0.64, 1)']);
      out += rule(`${ON} > div > div`, ['transform: translateX(39px)']);
      out += rule(`${LOAD} > div > div`, ['transform: translateX(0)']);
      out += rule(ICONS, ['inset: 22% !important', 'width: 56% !important', 'height: 56% !important']);
      for (const { scheme, sel } of bakeScopes(cfg)) {
        const p = cfg.palette[scheme];
        out += rule(scoped(sel, `${I} > img:nth-child(2)`), [`content: ${POWER_ICONS.pause(mix(p.powerOnEnd, '#000000', 0.15))}`]);
        out += rule(scoped(sel, `${I} > img:nth-child(3)`), [`content: ${POWER_ICONS.power(mix(p.powerOffEnd, '#000000', 0.1))}`]);
        out += rule(scoped(sel, `${I} > img:nth-child(4)`), [`content: ${POWER_ICONS.alert(p.destructive)}`]);
        out += rule(scoped(sel, `${I} > svg`), [`color: ${p.powerOffEnd} !important`]);
      }
      break;
    }
  }

  // Стекло рядом с анимированной кнопкой. Chromium перерисовывает за кадр один прямоугольник вокруг
  // всего, что изменилось. Если кнопка движется, а курсор в это время подсвечивает что-то ещё (пункт
  // меню, карточку), прямоугольник растягивается между ними и режет стекло (backdrop-filter) поперёк:
  // перерисованная часть получается светлее, на краю остаётся полоса. Пока кнопка движется, почти
  // невидимый слой на всё окно меняется каждый кадр - кадр перерисовывается целиком, и стекло
  // каждый раз считается заново. Слой прозрачен для мыши и не затемняет окно заметно (0,2-0,4%)
  const moving = movingWhen(pw);
  if (moving) out += rule(`${moving}::after`, ['content: ""', 'position: fixed', 'inset: 0', 'z-index: 2147483647', 'pointer-events: none',
    // Отдельный слой (will-change): иначе смена прозрачности заставит заново растрировать всё окно
    'background: #000', 'opacity: 0.002', 'will-change: opacity', 'animation: kt-redraw 1s linear infinite alternate']);
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
      // 36 точек по эллипсу, между ними линейно - на глаз это гладкая орбита
      const n = 36;
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
  if (movingWhen(pw)) kf.redraw = 'to { opacity: 0.004; }';
  return kf;
}
