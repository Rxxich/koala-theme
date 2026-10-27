// Разделительные полосы.
//
// Горизонтальные - компонент Separator клиента (components/ui/separator.tsx: data-slot="separator",
// bg-border h-px): строки настроек, панели правил и логов, окна. Вертикальные - полосы на главной
// (pages/home.tsx): две h-8 w-px bg-stroke между цифрами подписки и h-3 w-px bg-stroke между трафиком
// вверх и вниз, плюс вертикальный Separator, если он где-то встретится.
//
// Полоса - пустой div, поэтому рисуем её фоном, а блик пускаем псевдоэлементом ::after.
// Скрытая полоса остаётся на месте (visibility): на главной она - колонка сетки, и без неё цифры
// подписки разъехались бы.

import type { Divider, ThemeConfig } from './types';

type Decl = string | false | null | undefined | 0;
type RuleFn = (selector: string | string[], decls: Decl[]) => string;

const P = ':root';
const H = `${P} [data-slot="separator"][data-orientation="horizontal"]`;
const V_SEP = `${P} [data-slot="separator"][data-orientation="vertical"]`;
/** Полосы главной: высота у клиента - h-8 (2rem) и h-3 (0.75rem) */
const V_HOME: [string, string][] = [[`${P} .h-8.w-px.bg-stroke`, '2rem'], [`${P} .h-3.w-px.bg-stroke`, '0.75rem']];

const cm = (c: string, k: number) => `color-mix(in srgb, ${c} ${Math.round(k)}%, transparent)`;

/** Полоса отличается от клиентской - иначе правил нет совсем */
const changed = (d: Divider) => d.style !== 'app' || d.color !== 'auto' || d.opacity !== 100 || d.size !== 1 || d.length !== 100 || d.effect !== 'none';

function decls(d: Divider, vertical: boolean): { base: Decl[]; after: Decl[] | null } {
  if (d.style === 'hidden') return { base: ['visibility: hidden'], after: null };
  const dir = vertical ? '180deg' : '90deg';
  const auto = vertical ? 'var(--stroke)' : 'var(--border)';
  const raw = d.color === 'primary' ? 'var(--primary)' : d.color === 'power' ? 'var(--gradient-start-power-on)' : d.color === 'custom' ? d.custom : auto;
  const col = cm(raw, d.opacity);
  const style = d.style === 'app' ? 'solid' : d.style;
  // Точкам и двойной линии нужна высота побольше, иначе их не разглядеть
  const size = style === 'dotted' ? Math.max(2, d.size) : style === 'double' ? Math.max(3, d.size) : d.size;
  const along = vertical ? 'repeat-y' : 'repeat-x';

  let bg: string;
  switch (style) {
    case 'fade': bg = `linear-gradient(${dir}, transparent, ${col}, transparent)`; break;
    case 'gradient': bg = `linear-gradient(${dir}, ${cm('var(--gradient-start-power-on)', d.opacity)}, ${cm('var(--primary)', d.opacity)}, ${cm('var(--gradient-end-power-on)', d.opacity)})`; break;
    case 'dashed': {
      const dash = Math.max(4, size * 4);
      bg = `repeating-linear-gradient(${dir}, ${col} 0 ${dash}px, transparent ${dash}px ${Math.round(dash * 1.75)}px)`;
      break;
    }
    case 'dotted':
      bg = `radial-gradient(circle closest-side, ${col} 92%, transparent) ${vertical ? `50% 0 / ${size}px ${Math.round(size * 2.6)}px` : `0 50% / ${Math.round(size * 2.6)}px ${size}px`} ${along}`;
      break;
    case 'double': {
      const line = `linear-gradient(${col}, ${col})`;
      bg = vertical ? `${line} left / 1px 100% no-repeat, ${line} right / 1px 100% no-repeat` : `${line} top / 100% 1px no-repeat, ${line} bottom / 100% 1px no-repeat`;
      break;
    }
    // «Цвет кнопки» у сплошной полосы - его же градиент: у кнопки подключения цвет переливается
    default: bg = d.color === 'power' ? `linear-gradient(${dir}, ${cm('var(--gradient-start-power-on)', d.opacity)}, ${cm('var(--gradient-end-power-on)', d.opacity)})` : col;
  }

  const glowCol = cm(style === 'gradient' ? 'var(--primary)' : raw, Math.min(100, d.opacity * 0.8));
  const base: Decl[] = [
    `background: ${bg}`,
    vertical ? `width: ${size}px` : `height: ${size}px`,
    size >= 2 && style !== 'double' && 'border-radius: 999px',
    d.effect === 'glow' && `box-shadow: 0 0 ${4 + size * 2}px ${glowCol}`,
    d.effect === 'pulse' && 'animation: kt-div-pulse 2.6s ease-in-out infinite',
    d.effect === 'shimmer' && 'position: relative',
    d.effect === 'shimmer' && 'overflow: hidden'
  ];
  // Блик - светлая версия цвета полосы, пробегает вдоль неё
  const after: Decl[] | null = d.effect === 'shimmer' ? [
    'content: ""', 'position: absolute', 'inset: 0', 'pointer-events: none',
    `background: linear-gradient(${dir}, transparent, color-mix(in srgb, ${style === 'gradient' ? 'var(--primary)' : raw} 35%, white), transparent) no-repeat`,
    `background-size: ${vertical ? '100% 45%' : '45% 100%'}`,
    `animation: kt-div-shine-${vertical ? 'v' : 'h'} 2.8s ease-in-out infinite`
  ] : null;
  return { base, after };
}

export function dividerRules(cfg: ThemeConfig, rule: RuleFn): { css: string; keyframes: Record<string, string> } {
  const { h, v } = cfg.dividers;
  const kf: Record<string, string> = {};
  let css = '';

  if (changed(h)) {
    const { base, after } = decls(h, false);
    // Короче обычной - по центру своей строки
    css += rule(H, [...base, h.style !== 'hidden' && h.length < 100 && `width: ${h.length}%`, h.style !== 'hidden' && h.length < 100 && 'margin-inline: auto']);
    if (after) css += rule(`${H}::after`, after);
  }
  if (changed(v)) {
    const { base, after } = decls(v, true);
    const k = v.length / 100;
    css += rule([V_SEP, ...V_HOME.map(([s]) => s)], base);
    if (v.style !== 'hidden' && v.length !== 100) {
      for (const [s, hgt] of V_HOME) css += rule(s, [`height: calc(${hgt} * ${k})`]);
      css += rule(V_SEP, [`height: ${v.length}%`]);
    }
    if (after) css += rule([V_SEP, ...V_HOME.map(([s]) => s)].map((s) => `${s}::after`), after);
  }

  const effects = [h, v].filter(changed).map((d) => d.style === 'hidden' ? 'none' : d.effect);
  if (effects.includes('pulse')) kf['div-pulse'] = '0%, 100% { opacity: 1; } 50% { opacity: 0.35; }';
  if (changed(h) && h.style !== 'hidden' && h.effect === 'shimmer') kf['div-shine-h'] = 'from { background-position: -100% 0; } to { background-position: 200% 0; }';
  if (changed(v) && v.style !== 'hidden' && v.effect === 'shimmer') kf['div-shine-v'] = 'from { background-position: 0 -100%; } to { background-position: 0 200%; }';
  return { css, keyframes: kf };
}
