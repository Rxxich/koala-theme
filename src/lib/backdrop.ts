// Узоры и частицы для фона окна.
//
// Все узоры бесшовные: CSS-градиенты повторяются сами, SVG-плитки нарисованы так, что линии
// на краях продолжаются в соседней плитке. Топография строится фильтром feTurbulence
// (stitchTiles="stitch" склеивает шум по краям) и выделением контуров feConvolveMatrix
// с edgeMode="wrap" - поэтому линии не обрываются на стыках.
//
// Частицы - набор маленьких градиентов, у каждого своя плитка. Анимация сдвигает плитки ровно
// на их размер, поэтому движение зациклено без рывка, а разные размеры плиток дают параллакс.

import { mix, rgba } from './color';
import type { Background, Fun, Palette, Scheme } from './types';

const svgUri = (svg: string) => `url("data:image/svg+xml,${svg.replace(/"/g, "'").replace(/#/g, '%23').replace(/</g, '%3C').replace(/>/g, '%3E').replace(/\s+/g, ' ')}")`;
const r1 = (v: number) => Math.round(v * 10) / 10;

/** Слой узора: CSS-значение background (с позицией и размером) */
export function patternLayer(bg: Background, fg: string): string | null {
  const a = bg.patternOpacity / 100;
  const c = rgba(fg, a);
  const hex = fg.slice(0, 7);
  const op = a.toFixed(3);
  const k = bg.patternScale / 100;
  const s = (v: number) => `${r1(v * k)}px`;
  const tile = (svg: string, w: number, h: number) => `${svgUri(svg)} 0 0 / ${s(w)} ${s(h)}`;
  const stroke = (paths: string, w: number, h: number, sw = 1.2) =>
    tile(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><g fill="none" stroke="${hex}" stroke-opacity="${op}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${paths}</g></svg>`, w, h);
  switch (bg.pattern) {
    case 'dots': return `radial-gradient(circle at 1px 1px, ${c} 1px, transparent 1.6px) 0 0 / ${s(22)} ${s(22)}`;
    case 'grid': return `linear-gradient(${c} 1px, transparent 1px) 0 0 / ${s(34)} ${s(34)}, linear-gradient(90deg, ${c} 1px, transparent 1px) 0 0 / ${s(34)} ${s(34)}`;
    case 'lines': return `repeating-linear-gradient(0deg, ${c} 0 1px, transparent 1px ${s(5)})`;
    case 'diagonal': return `repeating-linear-gradient(45deg, ${c} 0 1px, transparent 1px ${s(14)})`;
    case 'topo': return topoLayer(hex, a, k);
    case 'waves': return stroke('<path d="M0 20c20-14 40-14 60 0s40 14 60 0"/>', 120, 40, 1.4);
    case 'hex': return stroke('<path d="M13.86 0 27.71 8v16l-13.85 8L0 24V8zM13.86 32v16"/>', 27.71, 48, 1);
    case 'cross': return stroke('<path d="M12 8v8M8 12h8"/>', 24, 24, 1.3);
    case 'zigzag': return stroke('<path d="M0 12 10 4l10 8 10-8 10 8"/>', 40, 16, 1.2);
    case 'circles': return `repeating-radial-gradient(circle at 50% 50%, ${c} 0 1px, transparent 1px ${s(28)})`;
    case 'halftone': return `radial-gradient(circle, ${c} 0 1.3px, transparent 1.8px) 0 0 / ${s(12)} ${s(12)}, radial-gradient(circle, ${rgba(fg, a * 0.6)} 0 1px, transparent 1.5px) ${s(6)} ${s(6)} / ${s(12)} ${s(12)}`;
    case 'isometric': return `repeating-linear-gradient(30deg, ${c} 0 1px, transparent 1px ${s(24)}), repeating-linear-gradient(150deg, ${c} 0 1px, transparent 1px ${s(24)})`;
    case 'circuit': return tile(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><g fill="none" stroke="${hex}" stroke-opacity="${op}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M0 20h16l6 6h12M64 20H52l-6-6V8M40 0v9M40 64V52l-6-6H22M10 38h10v10H10z"/></g><g fill="${hex}" fill-opacity="${op}"><circle cx="34" cy="26" r="2.2"/><circle cx="46" cy="8" r="2.2"/><circle cx="40" cy="9" r="2.2"/><circle cx="22" cy="46" r="2.2"/></g></svg>`, 64, 64);
    case 'plaid': return `repeating-linear-gradient(0deg, ${c} 0 2px, transparent 2px ${s(6)}, ${rgba(fg, a * 0.5)} ${s(6)} calc(${s(6)} + 1px), transparent calc(${s(6)} + 1px) ${s(32)}), repeating-linear-gradient(90deg, ${c} 0 2px, transparent 2px ${s(6)}, ${rgba(fg, a * 0.5)} ${s(6)} calc(${s(6)} + 1px), transparent calc(${s(6)} + 1px) ${s(32)})`;
    case 'stars': return [
      `radial-gradient(1px 1px at 20px 30px, ${c}, transparent)`, `radial-gradient(1.5px 1.5px at 130px 80px, ${c}, transparent)`,
      `radial-gradient(1px 1px at 70px 160px, ${c}, transparent)`, `radial-gradient(1.2px 1.2px at 180px 190px, ${c}, transparent)`,
      `radial-gradient(1px 1px at 200px 40px, ${c}, transparent)`
    ].map((l) => `${l} 0 0 / ${s(220)} ${s(220)}`).join(', ');
    default: return null;
  }
}

function topoLayer(hex: string, a: number, k: number): string {
  const size = 420;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><filter id="t" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.0055" numOctaves="2" seed="11" stitchTiles="stitch"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0"/>
    <feComponentTransfer><feFuncA type="linear" slope="2.4" intercept="-0.7"/></feComponentTransfer>
    <feComponentTransfer><feFuncA type="discrete" tableValues="0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1 0 1"/></feComponentTransfer>
    <feConvolveMatrix order="3" kernelMatrix="0 -1 0 -1 4 -1 0 -1 0" edgeMode="wrap" result="e"/>
    <feFlood flood-color="${hex}" flood-opacity="${Math.min(1, a * 1.6).toFixed(3)}"/>
    <feComposite in2="e" operator="in"/></filter><rect width="100%" height="100%" filter="url(#t)"/></svg>`;
  return `${svgUri(svg)} 0 0 / ${r1(size * k)}px ${r1(size * k)}px`;
}

/* ---------- Частицы ---------- */

export interface ParticleSet { layers: string[]; from: string[]; to: string[]; duration: number }

const seeded = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

export function particleSet(f: Fun, pal: Palette, scheme: Scheme): ParticleSet | null {
  if (f.particles === 'none') return null;
  const dark = scheme === 'dark';
  const op = f.particlesOpacity / 100;
  const base = f.particlesColor === 'primary' ? pal.primary : f.particlesColor === 'power' ? pal.powerOnStart : f.particlesColor === 'custom' ? f.particlesCustom
    : dark ? '#ffffff' : mix(pal.foreground, pal.background, 0.35);
  const rand = seeded(f.particles.length * 97 + 13);
  // В пределах ползунка: от плотности зависит число слоёв, и огромное число из чужой ссылки вешало вкладку
  const density = Math.min(200, Math.max(30, f.particlesDensity)) / 100;
  const layers: string[] = [], from: string[] = [], to: string[] = [];
  const add = (img: string, w: number, h: number, dx: number, dy: number) => {
    const x0 = Math.round(rand() * w), y0 = Math.round(rand() * h);
    layers.push(`${img} ${x0}px ${y0}px / ${w}px ${h}px`);
    from.push(`${x0}px ${y0}px`);
    to.push(`${x0 + dx}px ${y0 + dy}px`);
  };
  const count = (n: number) => Math.max(2, Math.round(n * density));
  const tiles = [180, 240, 300, 360, 420];

  switch (f.particles) {
    case 'snow':
      for (let i = 0; i < count(9); i++) {
        const t = tiles[i % 4], r = 1 + (i % 3) * 0.7;
        add(`radial-gradient(circle, ${rgba(base, op)} 0 ${r}px, transparent ${r + 0.8}px)`, t, t, t * (i % 2 ? 1 : 0), t * 2);
      }
      break;
    case 'stars':
      for (let i = 0; i < count(10); i++) {
        const t = tiles[i % 5], r = 0.6 + (i % 3) * 0.45;
        add(`radial-gradient(circle, ${rgba(base, op * (0.5 + (i % 3) * 0.25))} 0 ${r}px, transparent ${r + 0.9}px)`, t, t, -t, 0);
      }
      break;
    case 'fireflies': {
      const glow = f.particlesColor === 'auto' ? (dark ? '#ffe9a0' : pal.powerOnEnd) : base;
      for (let i = 0; i < count(7); i++) {
        const t = tiles[(i + 1) % 5];
        const dirs = [[t, -t], [-t, -t], [t, t], [-t, t]][i % 4];
        add(`radial-gradient(circle, ${rgba(glow, op)} 0 1.4px, ${rgba(glow, op * 0.35)} 2.5px, transparent 7px)`, t, t, dirs[0], dirs[1]);
      }
      break;
    }
    case 'rain':
      // Сдвиг за цикл обязан быть кратен размеру плитки, иначе на повторе анимации капли прыгают.
      // Ширина = половина высоты: сдвиг на плитку влево за три плитки вниз даёт всем слоям один наклон
      for (let i = 0; i < count(10); i++) {
        const h = 140 + (i % 5) * 30, w = h / 2;
        add(`radial-gradient(0.6px 12px at 50% 50%, ${rgba(base, op * 0.8)}, transparent)`, w, h, -w, h * 3);
      }
      break;
    case 'sakura': {
      const pink = f.particlesColor === 'auto' ? '#ffb7c8' : base;
      for (let i = 0; i < count(8); i++) {
        const t = tiles[i % 5];
        add(`radial-gradient(${4 + (i % 3)}px ${2.4 + (i % 2)}px at 50% 50%, ${rgba(pink, op)} 80%, transparent)`, t, t, t, t);
      }
      break;
    }
    case 'bubbles':
      for (let i = 0; i < count(7); i++) {
        const t = tiles[i % 5], r = 3 + (i % 4) * 2;
        add(`radial-gradient(circle, transparent 0 ${r}px, ${rgba(base, op * 0.8)} ${r + 0.6}px ${r + 1.4}px, transparent ${r + 2.2}px)`, t, t, 0, -t * 2);
      }
      break;
    case 'confetti': {
      const colors = [pal.primary, pal.powerOnStart, pal.powerOnEnd, pal.warning, pal.destructive, pal.success];
      for (let i = 0; i < count(12); i++) {
        const t = tiles[i % 5];
        const c = colors[i % colors.length];
        add(`radial-gradient(${i % 2 ? '3px 1.6px' : '1.8px 3px'} at 50% 50%, ${rgba(c, op)} 90%, transparent)`, t, t, t * (i % 3 === 0 ? 1 : -1), t * 2);
      }
      break;
    }
  }
  const base_dur = { snow: 26, stars: 120, fireflies: 34, rain: 3.2, sakura: 30, bubbles: 30, confetti: 18 }[f.particles];
  return { layers, from, to, duration: Math.round((base_dur / Math.max(0.2, f.particlesSpeed / 100)) * 10) / 10 };
}
