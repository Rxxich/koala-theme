// Тени: каждый стиль описан слоями для "света сверху" (тень вниз). Направление, дальность,
// размытие и разброс применяются ко всем слоям, поэтому любой стиль можно повернуть и подстроить.

import { mix, rgba } from './color';
import type { Palette, Scheme, ShadowPreset, Shadows, ThemeConfig } from './types';

/** Слой тени. dx/dy - смещение при свете сверху, c - цвет слоя */
interface Layer { dx: number; dy: number; blur: number; spread?: number; a: number; c?: 'base' | 'white' | 'accent' | 'pa' | 'pb' | 'solid'; inset?: boolean; fixed?: boolean }

const L = (dx: number, dy: number, blur: number, a: number, extra: Partial<Layer> = {}): Layer => ({ dx, dy, blur, a, ...extra });

export const SHADOW_LAYERS: Record<Exclude<ShadowPreset, 'app'>, { card: Layer[]; pop: Layer[]; btn: Layer[] }> = {
  none: { card: [], pop: [], btn: [] },
  soft: { card: [L(0, 1, 2, 0.05), L(0, 6, 16, 0.07)], pop: [L(0, 2, 6, 0.06), L(0, 20, 50, 0.16)], btn: [L(0, 1, 2, 0.08), L(0, 4, 10, 0.08)] },
  medium: { card: [L(0, 2, 4, 0.07), L(0, 10, 28, 0.14)], pop: [L(0, 4, 10, 0.08), L(0, 28, 64, 0.24)], btn: [L(0, 2, 4, 0.1), L(0, 6, 16, 0.12)] },
  floating: { card: [L(0, 6, 12, 0.05), L(0, 24, 56, 0.2)], pop: [L(0, 10, 20, 0.08), L(0, 40, 90, 0.32)], btn: [L(0, 6, 18, 0.16)] },
  layered: {
    card: [L(0, 1, 1, 0.04), L(0, 2, 2, 0.04), L(0, 4, 4, 0.04), L(0, 8, 8, 0.04), L(0, 16, 16, 0.04), L(0, 32, 32, 0.04)],
    pop: [L(0, 2, 2, 0.05), L(0, 4, 4, 0.05), L(0, 8, 8, 0.05), L(0, 16, 16, 0.05), L(0, 32, 32, 0.05), L(0, 64, 64, 0.05)],
    btn: [L(0, 1, 1, 0.06), L(0, 2, 2, 0.06), L(0, 4, 4, 0.06)]
  },
  glow: { card: [L(0, 0, 0, 0.12, { spread: 1, c: 'accent', fixed: true }), L(0, 0, 24, 0.16, { c: 'accent' })], pop: [L(0, 0, 0, 0.16, { spread: 1, c: 'accent', fixed: true }), L(0, 0, 40, 0.22, { c: 'accent' }), L(0, 24, 60, 0.3)], btn: [L(0, 0, 18, 0.4, { c: 'accent' })] },
  gradient: { card: [L(-8, 4, 24, 0.22, { c: 'pa' }), L(8, 8, 24, 0.22, { c: 'pb' })], pop: [L(-14, 8, 40, 0.25, { c: 'pa' }), L(14, 14, 40, 0.25, { c: 'pb' })], btn: [L(-4, 3, 12, 0.35, { c: 'pa' }), L(4, 5, 12, 0.35, { c: 'pb' })] },
  ambient: { card: [L(0, 14, 30, 0.22, { spread: -10, c: 'accent' }), L(0, 1, 2, 0.06)], pop: [L(0, 24, 50, 0.28, { spread: -14, c: 'accent' }), L(0, 4, 10, 0.1)], btn: [L(0, 8, 18, 0.4, { spread: -6, c: 'accent' })] },
  neumorph: { card: [L(6, 6, 16, 0.13), L(-6, -6, 16, 0.85, { c: 'white' })], pop: [L(10, 10, 30, 0.18), L(-8, -8, 24, 0.8, { c: 'white' })], btn: [L(3, 3, 8, 0.14), L(-3, -3, 8, 0.8, { c: 'white' })] },
  hard: { card: [L(4, 4, 0, 1, { c: 'solid' })], pop: [L(6, 6, 0, 1, { c: 'solid' })], btn: [L(3, 3, 0, 1, { c: 'solid' })] },
  retro: { card: [L(4, 4, 0, 1, { c: 'accent' }), L(4, 4, 0, 1, { spread: 1.5, c: 'solid' })], pop: [L(6, 6, 0, 1, { c: 'accent' }), L(6, 6, 0, 1, { spread: 1.5, c: 'solid' })], btn: [L(3, 3, 0, 1, { c: 'accent' })] },
  long: { card: Array.from({ length: 10 }, (_, i) => L(i + 1, i + 1, 0, 0.09 - i * 0.008)), pop: Array.from({ length: 14 }, (_, i) => L(i + 1, i + 1, 0, 0.08 - i * 0.005)), btn: Array.from({ length: 5 }, (_, i) => L(i + 1, i + 1, 0, 0.12 - i * 0.02)) },
  dual: { card: [L(-6, 6, 18, 0.25, { c: 'accent' }), L(6, 6, 18, 0.25, { c: 'pa' })], pop: [L(-10, 10, 30, 0.25, { c: 'accent' }), L(10, 10, 30, 0.25, { c: 'pa' })], btn: [L(-3, 3, 10, 0.35, { c: 'accent' }), L(3, 3, 10, 0.35, { c: 'pa' })] },
  outline: { card: [L(0, 0, 0, 0.18, { spread: 1.5, c: 'accent', fixed: true }), L(0, 6, 14, 0.08)], pop: [L(0, 0, 0, 0.22, { spread: 1.5, c: 'accent', fixed: true }), L(0, 16, 40, 0.18)], btn: [L(0, 0, 0, 0.4, { spread: 1.5, c: 'accent', fixed: true })] },
  inner: { card: [L(0, 1, 3, 0.12, { inset: true }), L(0, 0, 0, 0.04, { spread: 1, inset: true, fixed: true })], pop: [L(0, 18, 40, 0.2)], btn: [L(0, 1, 2, 0.15, { inset: true })] }
};

/** bare и bareHover - тень карточек без блика по кромке: для кнопки подключения, у которой блик свой */
export interface ShadowSet { card: string; hover: string; bare: string; bareHover: string; pop: string; button: string }

/** Смещение, размытие и разброс слоя с учётом направления света и ползунков. grow - во сколько раз тень больше (наведение) */
function placer(s: Shadows) {
  const rad = ((s.angle - 90) * Math.PI) / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  const dist = s.distance / 100, blurK = s.blur / 100;
  const hardMul = s.preset === 'hard' || s.preset === 'retro' ? s.hardOffset / 4 : 1;
  return (l: Layer, grow = 1) => {
    const m = l.fixed ? 1 : dist * hardMul * grow;
    return {
      x: (l.dx * cos - l.dy * sin) * m, y: (l.dx * sin + l.dy * cos) * m,
      blur: l.fixed ? l.blur : l.blur * blurK * grow,
      spread: (l.spread ?? 0) + (l.fixed || l.c === 'solid' ? 0 : s.spread)
    };
  };
}

/** Запас под тень над страницей, px. Больше нельзя: выше - прозрачный заголовок страницы, и
 *  прокрученные карточки заезжали бы под его надпись (см. «Место для теней» в генераторе) */
export const TOP_ROOM = 16;

/**
 * Слой тени карточек, который поднимается выше TOP_ROOM, у верхних карточек обрывался ровной линией
 * (заметно на светлом фоне у «Парящих»). Сжимаем слой разбросом и сдвигаем вниз на столько же: низ
 * тени остаётся на месте, бока - чуть уже, а верх укладывается в запас и тает до края. Сдвиг ограничен
 * четвертью размытия, чтобы тень, направленная вверх, не исчезала совсем
 */
function fitTop(p: { x: number; y: number; blur: number; spread: number }) {
  const over = p.spread + p.blur - p.y - TOP_ROOM;
  if (over <= 0) return p;
  const d = Math.min(over / 2, p.blur / 4);
  return { ...p, y: p.y + d, spread: p.spread - d };
}

/** Во сколько раз тень при наведении больше обычной */
const hoverGrow = (s: Shadows) => {
  const h = s.hover / 100;
  return s.preset === 'hard' || s.preset === 'retro' || s.preset === 'long' ? 1 + (h - 1) * 0.5 : h;
};

/** Слои стиля. Неизвестный стиль (из повреждённого конфига) - как «Без теней», а не ошибка */
const layersOf = (s: Shadows) => SHADOW_LAYERS[s.preset as Exclude<ShadowPreset, 'app'>] ?? SHADOW_LAYERS.none;

/** Насколько тень карточек выходит за их левый и верхний край, px (hover - с тенью при наведении) */
export function shadowReach(s: Shadows, hover: boolean): { left: number; top: number } {
  if (s.preset === 'app' || !s.cards) return { left: 0, top: 0 };
  const place = placer(s);
  let left = 0, top = 0;
  for (const grow of hover ? [1, hoverGrow(s)] : [1]) {
    for (const l of layersOf(s).card) {
      if (l.inset) continue;
      const p = fitTop(place(l, grow));
      left = Math.max(left, p.spread + p.blur - p.x);
      top = Math.max(top, p.spread + p.blur - p.y);
    }
  }
  return { left, top };
}

/**
 * Блики по кромке карточек: сверху и снизу. Нижний слабее - это свет, прошедший сквозь толщу стекла.
 * В тёмной схеме при 6% верхнего не было видно на прозрачных карточках поверх фона
 */
export function highlightShadow(scheme: Scheme, top = true, bottom = false): string {
  const dark = scheme === 'dark';
  return [top && `inset 0 1px 0 rgba(255, 255, 255, ${dark ? 0.18 : 0.7})`, bottom && `inset 0 -1px 0 rgba(255, 255, 255, ${dark ? 0.12 : 0.5})`].filter(Boolean).join(', ');
}
/** Есть хоть один блик по кромке */
export const hasHighlight = (s: { highlight: boolean; highlightBottom: boolean }) => s.highlight || s.highlightBottom;

export function shadowSet(s: Shadows, scheme: Scheme, pal: Palette, highlight: boolean, highlightBottom = false): ShadowSet | null {
  if (s.preset === 'app') return null;
  const dark = scheme === 'dark';
  const k = s.intensity / 100;
  const base = s.color === 'primary' ? pal.primary : s.color === 'power' ? pal.powerOnEnd : s.color === 'custom' ? s.customColor : dark ? '#000000' : mix(pal.background, '#000000', 0.8);
  const accent = s.color === 'auto' ? pal.primary : base;
  const boost = dark && s.color === 'auto' ? 3.2 : 1;
  const place = placer(s);

  const color = (l: Layer, mul: number) => {
    const a = Math.min(1, l.a * mul);
    switch (l.c) {
      case 'white': return dark ? rgba('#ffffff', Math.min(1, 0.045 * k * mul / 0.85 * l.a)) : rgba('#ffffff', Math.min(1, a * Math.min(1, k)));
      case 'accent': return rgba(accent, Math.min(1, a * k));
      case 'pa': return rgba(pal.powerOnStart, Math.min(1, a * k));
      case 'pb': return rgba(pal.powerOnEnd, Math.min(1, a * k));
      case 'solid': return s.color === 'auto' ? pal.foreground : base;
      default: return rgba(base, Math.min(1, a * k * boost));
    }
  };
  // fit - тень карточек, которые стоят в прокрутке страницы: верх укладывается в TOP_ROOM
  const render = (layers: Layer[], mul = 1, grow = 1, fit = false) => layers.map((l) => {
    const p = place(l, grow);
    const { x, y, blur, spread } = fit && !l.inset ? fitTop(p) : p;
    const r = (v: number) => Math.round(v * 10) / 10;
    return `${l.inset ? 'inset ' : ''}${r(x)}px ${r(y)}px ${r(blur)}px ${r(spread)}px ${color(l, mul)}`;
  });
  const hi = (highlight || highlightBottom) && s.preset !== 'neumorph' ? [highlightShadow(scheme, highlight, highlightBottom)] : [];
  const join = (xs: string[]) => xs.join(', ') || 'none';
  const set = layersOf(s);
  const h = s.hover / 100;
  return {
    card: join([...hi, ...render(set.card, 1, 1, true)]),
    hover: join([...hi, ...render(set.card, h, hoverGrow(s), true)]),
    bare: join(render(set.card, 1, 1, true)),
    bareHover: join(render(set.card, h, hoverGrow(s), true)),
    pop: join(render(set.pop)),
    button: join(render(set.btn))
  };
}

/* ---------- Тень текста ---------- */

export function textShadowCss(cfg: ThemeConfig, scheme: Scheme): string | null {
  const f = cfg.fonts;
  if (f.textShadow === 'none') return null;
  const pal = cfg.palette[scheme];
  const dark = scheme === 'dark';
  const op = f.textShadowOpacity / 100;
  const base = f.textShadowColor === 'primary' ? pal.primary : f.textShadowColor === 'power' ? pal.powerOnEnd : f.textShadowColor === 'custom' ? f.textShadowCustom
    : f.textShadow === 'glow' || f.textShadow === 'neon' ? pal.primary : dark ? '#000000' : mix(pal.background, '#000000', 0.75);
  const rad = ((f.textShadowAngle - 90) * Math.PI) / 180;
  const d = f.textShadowDistance / 100, b = f.textShadowBlur / 100;
  const off = (dist: number) => `${Math.round(-Math.sin(rad) * dist * d * 10) / 10}px ${Math.round(Math.cos(rad) * dist * d * 10) / 10}px`;
  const c = (a: number) => rgba(base, Math.min(1, a * op));
  switch (f.textShadow) {
    case 'soft': return `${off(1)} ${2 * b}px ${c(0.5)}, ${off(2)} ${8 * b}px ${c(0.35)}`;
    case 'glow': return `0 0 ${6 * b}px ${c(0.8)}, 0 0 ${16 * b}px ${c(0.5)}`;
    case 'neon': return `0 0 ${2 * b}px ${rgba('#ffffff', 0.8 * op)}, 0 0 ${6 * b}px ${c(1)}, 0 0 ${14 * b}px ${c(0.9)}, 0 0 ${28 * b}px ${c(0.6)}`;
    case 'hard': return `${off(2)} 0 ${c(1)}`;
    case 'outline': return [`1px 0`, `-1px 0`, `0 1px`, `0 -1px`, `1px 1px`, `-1px -1px`, `1px -1px`, `-1px 1px`].map((o) => `${o} 0 ${c(1)}`).join(', ');
    case 'emboss': return dark
      ? `0 -1px 0 ${rgba('#000000', 0.7 * op)}, 0 1px 0 ${rgba('#ffffff', 0.12 * op)}`
      : `0 1px 0 ${rgba('#ffffff', 0.9 * op)}, 0 -1px 0 ${c(0.35)}`;
    case 'long': return Array.from({ length: 6 }, (_, i) => `${off(i + 1)} 0 ${c(0.5 - i * 0.07)}`).join(', ');
  }
  return null;
}

/** Насколько тень текста выходит за буквы, px: смещение плюс размытие самого дальнего слоя */
export function textShadowReach(cfg: ThemeConfig): number {
  const f = cfg.fonts;
  const d = f.textShadowDistance / 100, b = f.textShadowBlur / 100;
  switch (f.textShadow) {
    case 'soft': return 2 * d + 8 * b;
    case 'glow': return 16 * b;
    case 'neon': return 28 * b;
    case 'hard': return 2 * d;
    case 'long': return 6 * d;
    case 'outline': case 'emboss': return 1;
  }
  return 0;
}
