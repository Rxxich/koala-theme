// Эффекты нажатия и раздел "Разное".
//
// Эффект нажатия работает без JS: пока кнопка мыши зажата (:active), слой эффекта мгновенно
// сжимается в исходное состояние (transition: none). Когда кнопку отпускают, переход возвращает
// его в покой - и в этот момент видна волна, вспышка или блик. Радиус волны - анимируемая
// CSS-переменная (@property), поэтому градиент растёт плавно.

import type { ThemeConfig } from './types';

type Decl = string | false | null | undefined | 0;
type RuleFn = (selector: string | string[], decls: Decl[]) => string;

const P = ':root';
export const PROXY_SEL = '[data-slot="card"].cursor-pointer.overflow-hidden:not(.isolate)';
const SELECTED = `${P} [data-slot="card"][class*="border-primary/"]`;
const POWER_ON = '[data-guide="home-power-toggle"] > div[class*="border-stroke-power-on"]';

export function clickRules(cfg: ThemeConfig, rule: RuleFn): { css: string; props: string[] } {
  const m = cfg.motion;
  if (m.click === 'none') return { css: '', props: [] };
  const targets = [
    m.clickProxies && PROXY_SEL,
    m.clickGroups && '[data-slot="card"].cursor-pointer.isolate',
    m.clickProfiles && 'div.rounded-2xl[aria-busy]',
    m.clickButtons && '[data-slot="button"]',
    m.clickNav && '[data-slot="sidebar-menu-button"]'
  ].filter(Boolean) as string[];
  if (!targets.length) return { css: '', props: [] };
  const T = `${P} :is(${targets.join(', ')})`;
  const color = m.clickColor === 'power' ? 'var(--gradient-start-power-on)' : m.clickColor === 'foreground' ? 'var(--foreground)' : m.clickColor === 'custom' ? m.clickCustom : 'var(--primary)';
  const c = (k = 1) => `color-mix(in srgb, ${color} ${Math.round(Math.min(100, m.clickOpacity * k))}%, transparent)`;
  const d = `${m.clickDuration}ms`;
  const sz = m.clickSize;
  const press = `${T}:active:not(:has(button:active))::after`;
  const ease = 'cubic-bezier(0.2, 0.7, 0.2, 1)';
  const ring = (r: string) => `radial-gradient(circle farthest-corner at 50% 50%, transparent calc(${r} - ${sz}px), ${c()} calc(${r} - 3px), transparent ${r})`;
  let css = rule(T, ['position: relative', 'overflow: hidden']);
  const base = ['content: ""', 'position: absolute', 'inset: 0', 'border-radius: inherit', 'pointer-events: none', 'z-index: 1'];
  const props = ['--kt-rip'];

  switch (m.click) {
    case 'wave':
      css += rule(`${T}::after`, [...base, 'opacity: 0', '--kt-rip: 115%', `background: ${ring('var(--kt-rip)')}`, `transition: --kt-rip ${d} ${ease}, opacity ${d} linear`]);
      css += rule(press, ['--kt-rip: 0%', 'opacity: 1', 'transition: none']);
      break;
    case 'double':
      css += rule(`${T}::after`, [...base, 'opacity: 0', '--kt-rip: 130%', `background: ${ring('var(--kt-rip)')}, ${ring('calc(var(--kt-rip) * 0.62)')}`, `transition: --kt-rip ${d} ${ease}, opacity ${d} linear`]);
      css += rule(press, ['--kt-rip: 0%', 'opacity: 1', 'transition: none']);
      break;
    case 'ripple':
      css += rule(`${T}::after`, [...base, 'opacity: 0', '--kt-rip: 115%', `background: radial-gradient(circle farthest-corner at 50% 50%, ${c()} 0 var(--kt-rip), transparent calc(var(--kt-rip) + 1px))`, `transition: --kt-rip ${d} ${ease}, opacity ${d} ease-in`]);
      css += rule(press, ['--kt-rip: 0%', 'opacity: 1', 'transition: none']);
      break;
    case 'flash':
      css += rule(`${T}::after`, [...base, 'opacity: 0', `background: ${c()}`, `transition: opacity ${d} ease-out`]);
      css += rule(press, ['opacity: 1', 'transition: none']);
      props.length = 0;
      break;
    case 'glow':
      css += rule(`${T}::after`, [...base, 'opacity: 0', `box-shadow: inset 0 0 ${sz * 1.6}px ${c(1.3)}, inset 0 0 0 1.5px ${c(1.6)}`, `transition: opacity ${d} ease-out`]);
      css += rule(press, ['opacity: 1', 'transition: none']);
      props.length = 0;
      break;
    case 'border':
      css += rule(`${T}::after`, [...base, 'opacity: 0', `box-shadow: inset 0 0 0 ${Math.max(1, Math.round(sz / 6))}px ${c(2)}`, `transition: opacity ${d} ease-out`]);
      css += rule(press, ['opacity: 1', 'transition: none']);
      props.length = 0;
      break;
    case 'shine':
      css += rule(`${T}::after`, [...base, 'opacity: 0', '--kt-shine: 170%',
        `background: linear-gradient(105deg, transparent calc(var(--kt-shine) - ${sz + 12}%), ${c(1.4)} var(--kt-shine), transparent calc(var(--kt-shine) + ${sz + 12}%))`,
        `transition: --kt-shine ${d} ${ease}, opacity 0s linear ${d}`]);
      css += rule(press, ['--kt-shine: -70%', 'opacity: 1', 'transition: none']);
      props.splice(0, 1, '--kt-shine');
      break;
    case 'sparks':
    case 'confetti': {
      // Искры разлетаются из центра по эллипсу (карточки широкие) и гаснут. --kt-rip - доля пути
      const cols = m.click === 'sparks' ? [c(1.6), c(1)]
        : ['var(--gradient-start-power-on)', 'var(--gradient-end-power-on)', 'var(--primary)', 'var(--foreground)'].map((x) => `color-mix(in srgb, ${x} ${Math.min(100, m.clickOpacity * 1.8)}%, transparent)`);
      css += rule(`${T}::after`, [...base, 'opacity: 0', '--kt-rip: 100%', `background: ${sparkLayers(cols, Math.max(1.5, sz / 5))}`,
        `transition: --kt-rip ${d} cubic-bezier(0.15, 0.8, 0.3, 1), opacity ${d} cubic-bezier(0.6, 0, 0.9, 0.4)`]);
      css += rule(press, ['--kt-rip: 0%', 'opacity: 1', 'transition: none']);
      break;
    }
    case 'corners': {
      // Прицел: уголки сжимаются к центру, пока кнопка зажата, и разлетаются к краям карточки.
      // Карточки низкие и широкие: по высоте уголки короче и сжимаются вдвое меньше
      const bar = `linear-gradient(${c(2)}, ${c(2)})`;
      const L = sz + 4, ax = 'var(--kt-rip)', ay = 'calc(var(--kt-rip) * 0.5)';
      const layers = [['left', 'top'], ['right', 'top'], ['left', 'bottom'], ['right', 'bottom']]
        .flatMap(([x, y]) => [`${bar} ${x} ${ax} ${y} ${ay} / ${L}px 2px no-repeat`, `${bar} ${x} ${ax} ${y} ${ay} / 2px min(${L}px, 24%) no-repeat`]);
      css += rule(`${T}::after`, [...base, 'opacity: 0', '--kt-rip: 0%', `background: ${layers.join(', ')}`,
        `transition: --kt-rip ${d} cubic-bezier(0.2, 0.9, 0.25, 1), opacity ${d} cubic-bezier(0.7, 0, 0.85, 0.3)`]);
      css += rule(press, ['--kt-rip: 22%', 'opacity: 1', 'transition: none']);
      break;
    }
    case 'scan':
      // Скан: яркая вертикальная линия проходит слева направо, за ней тянется шлейф
      css += rule(`${T}::after`, [...base, 'opacity: 0', '--kt-shine: 115%',
        `background: linear-gradient(90deg, transparent calc(var(--kt-shine) - ${sz + 8}%), ${c(0.45)} calc(var(--kt-shine) - 1.5%), ${c(2)} var(--kt-shine), transparent calc(var(--kt-shine) + 0.8%))`,
        `transition: --kt-shine ${d} cubic-bezier(0.25, 0.1, 0.25, 1), opacity 0s linear ${d}`]);
      css += rule(press, ['--kt-shine: -2%', 'opacity: 1', 'transition: none']);
      props.splice(0, 1, '--kt-shine');
      break;
    case 'fill':
      // Заливка: цвет наплывает слева направо и растворяется
      css += rule(`${T}::after`, [...base, 'opacity: 0', '--kt-shine: 130%',
        `background: linear-gradient(90deg, ${c(1.2)} calc(var(--kt-shine) - 30%), ${c(0.6)} var(--kt-shine), transparent calc(var(--kt-shine) + 0.5%))`,
        `transition: --kt-shine ${d} ${ease}, opacity ${d} cubic-bezier(0.6, 0, 0.9, 0.4)`]);
      css += rule(press, ['--kt-shine: 0%', 'opacity: 1', 'transition: none']);
      props.splice(0, 1, '--kt-shine');
      break;
    case 'echo': {
      // Эхо: кольцо расходится наружу от рамки. Рисуется контуром самого элемента - его не обрезает
      // overflow: hidden. Переход дописан к "all", чтобы не потерять переходы клиента
      const w = Math.max(1, Math.round(sz / 6));
      css += rule(T, [`outline: ${w}px solid transparent`, `outline-offset: ${sz}px`,
        `transition: all var(--kt-dur) var(--kt-ease), outline-offset ${d} ${ease}, outline-color ${d} linear !important`]);
      css += rule(`${T}:active:not(:has(button:active))`, [`outline-color: ${c(2)}`, 'outline-offset: 0px', 'transition-duration: 0s !important']);
      props.length = 0;
      break;
    }
  }
  return { css, props };
}

/** Искры: десять точек вокруг центра. Позиция - доля свободного места, при --kt-rip: 0% все в центре */
function sparkLayers(cols: string[], r: number): string {
  return Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2 + 0.3;
    const x = Math.round(Math.cos(a) * 46) / 100, y = Math.round(Math.sin(a) * 92) / 100;
    const rr = Math.round((i % 2 ? r * 0.65 : r) * 10) / 10, box = Math.ceil(rr * 2 + 2);
    return `radial-gradient(circle, ${cols[i % cols.length]} 0 ${rr}px, transparent ${rr + 0.8}px) calc(50% + ${x} * var(--kt-rip)) calc(50% + ${y} * var(--kt-rip)) / ${box}px ${box}px no-repeat`;
  }).join(', ');
}

export function funRules(cfg: ThemeConfig, rule: RuleFn): { css: string; keyframes: Record<string, string>; props: string[] } {
  const f = cfg.fun;
  const kf: Record<string, string> = {};
  const props: string[] = [];
  let css = '';
  const PX = `${P} ${PROXY_SEL}`;

  if (f.ping !== 'none') {
    // Цвет пинга клиент задаёт классом в кнопке проверки (proxy-item.tsx → delayColorClass):
    // text-success - до 500 мс, text-warning - 500 мс и больше, text-destructive - таймаут
    const DIGITS = 'span:is(.text-success, .text-warning, .text-destructive)';
    const DELAY = `[data-slot="button"] ${DIGITS}`;
    css += rule(`${PX}:has([data-slot="button"] .text-success)`, ['--kt-ping: var(--success)']);
    css += rule(`${PX}:has([data-slot="button"] .text-warning)`, ['--kt-ping: var(--warning)']);
    css += rule(`${PX}:has([data-slot="button"] .text-destructive)`, ['--kt-ping: var(--destructive)']);
    const sel = `${PX}:has(${DELAY})::before`;
    const base = ['content: ""', 'position: absolute', 'pointer-events: none', 'z-index: 0', 'transition: background 0.4s ease, box-shadow 0.4s ease'];
    // Полоска стоит на долях высоты, поэтому она - у содержимого карточки: «Подъём» вытягивает саму
    // карточку на 2px вниз, и полоска от неё поднималась не вместе с текстом, а сжималась.
    // --kt-frame - толщина контура-рамки у выбранного сервера (generator.ts): полоска встаёт внутрь него
    if (f.ping === 'bar') {
      const content = `${PX}:has(${DELAY}) > [data-slot="card-content"]`;
      css += rule(content, ['position: relative']);
      css += rule(`${content}::after`, [...base, 'left: var(--kt-frame, 0px)', 'top: 22%', 'bottom: 22%', 'width: 3px', 'border-radius: 0 3px 3px 0', 'background: var(--kt-ping)', 'box-shadow: 0 0 8px var(--kt-ping)']);
    }
    if (f.ping === 'glow') css += rule(sel, [...base, 'inset: 0', 'border-radius: inherit', 'box-shadow: inset 0 0 20px -6px var(--kt-ping)']);
    // Точка. На месте пинга цифры гасит font-size: 0, точка - ::before самого числа, цвет - его
    // (text-success...). Во время проверки число скрыто (invisible) вместе с точкой, крутится значок
    // загрузки. Без анимации: в стеклянной карточке она заставляла пересчитывать стекло каждый кадр
    const inPlace = f.ping === 'dot' && f.pingDotInPlace;
    if (f.ping === 'dot') {
      const d = f.pingDotSize;
      const num = `${PX} ${DELAY}`;
      const c = inPlace ? 'currentColor' : 'var(--kt-ping)';
      const o = inPlace ? 0 : 7;
      if (inPlace) {
        css += rule(num, ['position: relative', 'display: block', `width: ${d}px`, `height: ${d}px`, 'font-size: 0 !important']);
        // При наведении на кнопку проверки - снова цифры
        if (!f.pingHideHover) {
          css += rule(`${PX} [data-slot="button"]:hover ${DIGITS}`, ['width: auto', 'height: auto', 'font-size: inherit !important']);
          css += rule(`${PX} [data-slot="button"]:hover ${DIGITS}::before`, ['display: none']);
        }
      }
      css += rule(inPlace ? `${num}::before` : sel, [...base, `left: ${o}px`, `top: ${o}px`, `width: ${d}px`, `height: ${d}px`, 'border-radius: 50%',
        `background: ${c}`, `box-shadow: 0 0 ${d}px ${c}`]);
    }
    if (f.ping === 'tint') css += rule(sel, [...base, 'inset: 0', 'border-radius: inherit', 'background: linear-gradient(90deg, color-mix(in srgb, var(--kt-ping) 16%, transparent), transparent 65%)']);
    // Цифры прячем прозрачностью: кнопка остаётся на месте и по-прежнему запускает проверку.
    // Значок загрузки во время проверки - отдельный элемент, он виден всегда. Точку на месте пинга не
    // трогаем: она сама стоит вместо цифр, и прозрачность спрятала бы её
    if (f.pingHide && !inPlace) {
      css += rule(`${PX} ${DELAY}`, ['opacity: 0', 'transition: opacity 0.2s ease']);
      if (!f.pingHideHover) css += rule(`${PX} [data-slot="button"]:hover ${DIGITS}`, ['opacity: 1']);
      // Цифр нет совсем - гасим и подсветку кнопки при наведении (ghost: hover:bg-accent/50), чтобы
      // на месте пинга не загоралась пустая плашка. Значок непроверенного сервера (без цифр) подсвечивается как раньше
      else css += rule(`${PX} [data-slot="button"]:has(${DIGITS}):hover`, ['background: transparent !important']);
    }
  }

  if (f.reactive) {
    const k = f.reactiveStrength;
    css += rule(`${P} .main::before`, ['content: ""', 'position: fixed', 'inset: 0', 'z-index: -1', 'pointer-events: none', 'opacity: 0',
      `background: radial-gradient(60% 55% at 50% 52%, color-mix(in srgb, var(--gradient-end-power-on) ${Math.round(k * 0.55)}%, transparent), transparent 70%), radial-gradient(40% 35% at 50% 50%, color-mix(in srgb, var(--gradient-start-power-on) ${Math.round(k * 0.35)}%, transparent), transparent 70%)`,
      'transition: opacity 1.4s ease']);
    css += rule(`${P} .main:has(${POWER_ON})::before`, ['opacity: 1', 'animation: kt-reactive 4s ease-in-out infinite alternate']);
    kf.reactive = 'from { transform: scale(1); filter: hue-rotate(0deg); } to { transform: scale(1.08); filter: hue-rotate(18deg); }';
  }

  if (f.runningBorder) {
    props.push('--kt-ang');
    // Рамка обводит содержимое карточки: флаг и полоска пинга тоже стоят от него, и содержимое
    // спозиционировано не всегда - закрепляем, чтобы рамка всегда была от одного и того же блока.
    // В покое содержимое занимает карточку целиком, а «Подъём» вытягивает карточку на 2px вниз - их
    // рамка добирает тем же переходом, что и отступ карточки
    css += rule(`${SELECTED} > [data-slot="card-content"]`, ['position: relative']);
    if (cfg.surfaces.selectedHover === 'lift') css += rule(`${SELECTED}:hover > [data-slot="card-content"]::before`, ['bottom: -2px']);
    css += rule(`${SELECTED} [data-slot="card-content"]::before`, ['content: ""', 'position: absolute', 'inset: 0', 'transition: bottom var(--kt-dur) var(--kt-ease)','border-radius: var(--radius)', 'padding: 1.5px', 'pointer-events: none', 'z-index: 2',
      'background: conic-gradient(from var(--kt-ang), transparent 0 55%, var(--gradient-start-power-on) 75%, var(--primary) 90%, transparent)',
      '-webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', '-webkit-mask-composite: xor',
      'mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', 'mask-composite: exclude',
      'animation: kt-ang 3.2s linear infinite']);
    kf.ang = 'to { --kt-ang: 360deg; }';
  }

  if (f.breathing) {
    // Анимация kt-breath - в генераторе (selectedAnims), одним списком с бликом и появлением карточек
    css += rule(SELECTED, ['outline: 2px solid color-mix(in srgb, var(--primary) 40%, transparent)', 'outline-offset: 0']);
    kf.breath = '0%, 100% { outline-color: color-mix(in srgb, var(--primary) 0%, transparent); outline-offset: 0; } 50% { outline-color: color-mix(in srgb, var(--primary) 45%, transparent); outline-offset: 3px; }';
  }
  return { css, keyframes: kf, props };
}
