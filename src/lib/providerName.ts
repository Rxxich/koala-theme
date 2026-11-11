// Имя провайдера над кнопкой подключения вместо надписи «Отключено» / «Подключено» (pages/home.tsx).
//
// CSS не копирует текст, а только переставляет элементы. Шапка карточки профиля - логотип, имя и кнопка обновления
// (data-guide="home-profile-header") - переезжает к кнопке: карточка становится display: contents, её содержимое -
// пунктами колонки главной, и order ставит шапку перед блоком кнопки. Объявление провайдера остаётся сверху и
// получает стекло плиток (announceAsTile). Колонка (flex-col h-full) раньше отдавала свободное место блоку кнопки
// (grow-3), а он центровал кнопку в себе; теперь место делят поля margin: auto над шапкой и под блоком кнопки.
//
// Вид букв - SVG-фильтр на имени: тени и блики считаются по форме букв (SourceAlpha), лицо букв - обычный color,
// поэтому эмодзи в имени остаются цветными. Выключено - буквы вдавлены, подключено - светятся одним из видов,
// при подключении мигают, как лампа при пуске, при ошибке красные.

import { fontStack } from './fonts';
import { FPS } from './frames';
import type { NameLook, Scheme, ThemeConfig } from './types';

const P = ':root';
const H = '[data-guide="home-profile-header"]';
const ANNOUNCE = '[data-guide="home-profile-announce"]';
const CARD = `div:has(> ${H})`;
// Вложенный :has браузер не принимает: колонку главной узнаём по шапке через ступеньку
const COL = `.flex-col.h-full:has(> div > ${H})`;
const BTN = '[data-guide="home-power-toggle"]';
const CONN = `${COL} > div:has(> ${BTN})`;
// Состояния - по классам кнопки, как в power.ts
const LIT = `:has(${BTN} > div[class*="border-stroke-power-on"])`;
const LOAD = `:has(${BTN} svg[role="status"].opacity-100)`;
const ERR = `:has(${BTN} > div > div > img:nth-child(4).opacity-100)`;
/** Плитки главной (generator.ts, TILE) */
const TILE = 'div.rounded-2xl.border-stroke';

type Decl = string | false | null | undefined | 0;
type RuleFn = (selector: string | string[], decls: Decl[]) => string;

/* ---------- Фильтры ---------- */

const r2 = (v: number) => Math.round(v * 100) / 100;
const px = (v: number) => `${r2(v)}px`;
/** Слой фильтра: примитивы и имя результата для feMerge. id - уникальный префикс результатов слоя */
type Layer = (id: string) => { defs: string; node: string };

const flood = (id: string, color: string, op: number, mask: string) =>
  `<feFlood flood-color='${color}' flood-opacity='${op}'/><feComposite in2='${mask}' operator='in' result='${id}'/>`;
/** Полоска внутри букв со стороны, противоположной сдвигу: сверху при dy > 0 */
const inner = (dx: number, dy: number, blur: number, color: string, op: number): Layer => (id) => ({
  defs: `<feOffset in='SourceAlpha' dx='${r2(dx)}' dy='${r2(dy)}' result='${id}o'/><feGaussianBlur in='${id}o' stdDeviation='${r2(blur)}' result='${id}b'/>`
    + `<feComposite in='SourceAlpha' in2='${id}b' operator='out' result='${id}m'/>${flood(id, color, op, `${id}m`)}`,
  node: id
});
/** Полоска снаружи букв по сдвигу: блик кромки под вдавленными буквами, тень под приподнятыми */
const outer = (dy: number, blur: number, color: string, op: number): Layer => (id) => ({
  defs: `<feOffset in='SourceAlpha' dy='${r2(dy)}' result='${id}o'/><feGaussianBlur in='${id}o' stdDeviation='${r2(blur)}' result='${id}b'/>`
    + `<feComposite in='${id}b' in2='SourceAlpha' operator='out' result='${id}m'/>${flood(id, color, op, `${id}m`)}`,
  node: id
});
/** Кольцо у края изнутри: буквы минус их размытие. Толщина стекла */
const ring = (blur: number, color: string, op: number): Layer => (id) => ({
  defs: `<feGaussianBlur in='SourceAlpha' stdDeviation='${r2(blur)}' result='${id}b'/>`
    + `<feComposite in='SourceAlpha' in2='${id}b' operator='arithmetic' k2='1' k3='-1' result='${id}m'/>${flood(id, color, op, `${id}m`)}`,
  node: id
});
/** Свет вокруг букв их же цветом, насыщеннее: у белых букв белый, у цветных - их цвет */
const halo = (blur: number, op: number): Layer => (id) => ({
  defs: `<feColorMatrix in='SourceGraphic' type='saturate' values='2' result='${id}s'/><feGaussianBlur in='${id}s' stdDeviation='${r2(blur)}' result='${id}b'/>`
    + `<feComponentTransfer in='${id}b' result='${id}'><feFuncA type='linear' slope='${op}'/></feComponentTransfer>`,
  node: id
});
/** Лицо букв - их цвет (color). op < 1 - полупрозрачное: сквозь стекло виден фон */
const face = (op = 1): Layer => (id) => op === 1 ? { defs: '', node: 'SourceGraphic' } : {
  defs: `<feComponentTransfer in='SourceGraphic' result='${id}'><feFuncA type='linear' slope='${op}'/></feComponentTransfer>`,
  node: id
};
/** Заливка букв одним цветом */
const fill = (color: string, op: number): Layer => (id) => ({ defs: flood(id, color, op, 'SourceAlpha'), node: id });
/** Зерно матового стекла: шум только по форме букв. Считается вместе с фильтром - при смене состояния, не в покое */
const grain = (op: number): Layer => (id) => ({
  defs: `<feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='3' result='${id}t'/>`
    + `<feColorMatrix in='${id}t' values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 ${r2(op * 3)} -${op}' result='${id}n'/>`
    + `<feComposite in='${id}n' in2='SourceAlpha' operator='in' result='${id}'/>`,
  node: id
});

/** Фильтр из слоёв, снизу вверх. Цвета без #: в data: он начал бы ссылку на фрагмент */
function filterUrl(layers: Layer[], region: string): string {
  const ls = layers.map((l, i) => l(`l${i}`));
  const svg = `<svg xmlns='http://www.w3.org/2000/svg'><filter id='f' ${region} color-interpolation-filters='sRGB'>${ls.map((l) => l.defs).join('')}`
    + `<feMerge>${ls.map((l) => `<feMergeNode in='${l.node}'/>`).join('')}</feMerge></filter></svg>`;
  return `url("data:image/svg+xml,${svg.replace(/</g, '%3C').replace(/>/g, '%3E')}#f")`;
}
// Область фильтра - доли от строки имени (не проценты: % в data: начинает код символа). Свет вокруг букв уходит
// на три своих размытия, у короткого имени по бокам это больше четверти ширины
const REGION_ON = "x='-0.4' y='-1.2' width='1.8' height='3.4'";
const REGION_OFF = "x='-0.1' y='-0.4' width='1.2' height='1.8'";

const WHITE = 'white', BLACK = 'black', SLATE = 'rgb(58,66,80)', GREY = 'rgb(93,102,118)';

/**
 * Подключено: слои по виду и схеме. k - масштаб от размера имени (подобраны на 26px). В светлой схеме белым
 * буквам нужны серая кромка и тень под ними, иначе на светлом фоне их не видно
 */
const LOOKS: Record<NameLook, Record<Scheme, (k: number) => Layer[]>> = {
  // Приподнятые: блик по верхней кромке, книзу темнее, тень под буквами
  raised: {
    dark: (k) => [halo(12 * k, 0.14), outer(2.5 * k, 1.6 * k, BLACK, 0.55), halo(1.4 * k, 0.3), face(),
      inner(0, 1.2 * k, 0.4 * k, WHITE, 0.9), inner(0, -2.2 * k, 1.8 * k, SLATE, 0.4), inner(0, -k, 0.4 * k, SLATE, 0.35)],
    light: (k) => [outer(0, 0.7 * k, GREY, 0.55), outer(3 * k, 3 * k, BLACK, 0.3), outer(1.2 * k, 0.6 * k, BLACK, 0.3), face(),
      inner(0, 1.2 * k, 0.4 * k, WHITE, 0.9), inner(0, -2.4 * k, 2 * k, GREY, 0.55)]
  },
  // Матовое стекло: буквы чуть прозрачные, с зерном и светлой кромкой, свет вокруг мягкий
  frost: {
    dark: (k) => [halo(14 * k, 0.2), halo(4 * k, 0.32), face(0.86), grain(0.1), ring(1.5 * k, BLACK, 0.28),
      inner(0, k, 0.3 * k, WHITE, 0.85), inner(0, -1.2 * k, 0.5 * k, BLACK, 0.22)],
    light: (k) => [outer(0, 0.8 * k, GREY, 0.7), outer(3 * k, 4 * k, BLACK, 0.28), halo(5 * k, 0.3), face(0.92), grain(0.08), ring(1.5 * k, BLACK, 0.4),
      inner(0, k, 0.3 * k, WHITE, 0.95), inner(0, -1.2 * k, 0.6 * k, SLATE, 0.3)]
  },
  // Прозрачное стекло: почти прозрачные буквы, светлое кольцо толщины стекла и блики по кромке с двух сторон.
  // Жидким оно быть не может: преломлять фон умеет только backdrop-filter, а его нельзя обрезать по форме букв,
  // которые CSS не знает заранее
  glass: {
    dark: (k) => [halo(10 * k, 0.14), outer(1.5 * k, 2 * k, BLACK, 0.22), face(0.2), ring(2.6 * k, WHITE, 0.4), ring(1.1 * k, BLACK, 0.16),
      inner(0.9 * k, 1.1 * k, 0.35 * k, WHITE, 0.95), inner(-0.8 * k, -0.9 * k, 0.35 * k, WHITE, 0.55)],
    light: (k) => [outer(2 * k, 2.5 * k, BLACK, 0.3), outer(0, 0.7 * k, GREY, 0.6), face(0.45), ring(2.6 * k, WHITE, 0.5), ring(1.1 * k, SLATE, 0.3),
      inner(0.9 * k, 1.1 * k, 0.35 * k, WHITE, 1), inner(-0.8 * k, -0.9 * k, 0.35 * k, WHITE, 0.7)]
  }
};
/** Выключено: буквы вдавлены - заливка, тень верхней стенки, блик кромки снизу. В тёмной схеме тело букв светлее фона, так заметнее */
const OFF: Record<Scheme, (k: number) => Layer[]> = {
  dark: (k) => [outer(2 * k, 0, WHITE, 0.4), fill(WHITE, 0.12), inner(0, 2 * k, 0, BLACK, 0.85)],
  light: (k) => [outer(1.5 * k, 0, WHITE, 0.9), fill('rgb(140,140,140)', 0.32), inner(0, 1.5 * k, 0, BLACK, 0.35)]
};

/** Масштаб деталей фильтра от размера имени */
const scaleOf = (pw: ThemeConfig['power']) => Math.min(2, Math.max(0.6, pw.nameSize / 26));

/**
 * Подключение: вспышки, потом свет держится и гаснет, по кругу. Кадры, на которых меняется вид, лежат на общей
 * сетке (frames.ts): 54 кадра по 1/30 с, как у слоя перерисовки окна в power.ts
 */
const WARM_FRAMES = 54;
const WARM: [number, boolean][] = [[0, false], [5, true], [8, false], [19, true], [22, false], [25, true], [46, false]];

/* ---------- Правила ---------- */

/** Объявление провайдера осталось без своей карточки - даём ему стекло и рамку плиток: дописываем в их селекторы */
export function announceAsTile(css: string): string {
  return css.replaceAll(TILE, `:is(${TILE}, ${ANNOUNCE})`).replaceAll('.rounded-2xl::before', `:is(.rounded-2xl, ${ANNOUNCE})::before`);
}

export function providerNameKeyframes(cfg: ThemeConfig, scopes: { scheme: Scheme }[]): Record<string, string> {
  const pw = cfg.power;
  if (!pw.providerName || !pw.animate) return {};
  const k = scaleOf(pw);
  const kf: Record<string, string> = {};
  for (const { scheme } of scopes) {
    const on = filterUrl(LOOKS[pw.nameLook][scheme](k), REGION_ON), off = filterUrl(OFF[scheme](k), REGION_OFF);
    kf[`name-warm-${scheme}`] = WARM.map(([f, lit]) => `${r2((f * 100) / WARM_FRAMES)}% { filter: ${lit ? on : off}; }`).join(' ');
  }
  return kf;
}

export function providerNameRules(cfg: ThemeConfig, rule: RuleFn, scopes: { scheme: Scheme; sel: string }[]): string {
  const pw = cfg.power;
  if (!pw.providerName) return '';
  const k = scaleOf(pw);
  const fade = (p: string) => `${p} var(--kt-dur-slow) var(--kt-ease-fade)`;
  let out = '';

  // Раскладка: шапка - перед блоком кнопки, свободное место - поровну над шапкой и под кнопкой
  out += rule(`${P} ${CARD}`, ['display: contents !important']);
  out += rule([`${P} ${CARD}::before`, `${P} ${CARD}::after`], ['display: none !important']);
  out += rule(`${P} ${CARD} > ${ANNOUNCE}`, ['margin: 0 !important', 'padding: 1rem', 'border-width: 1px', 'border-style: solid', 'border-radius: calc(var(--radius) * 1.6)']);
  out += rule([`${P} ${CONN}`, `${P} ${CONN} ~ *`], ['order: 1']);
  out += rule(`${P} ${CONN}`, ['flex-grow: 0 !important', 'margin-bottom: auto']);
  // Надпись «Отключено» / «Подключено» (CharacterMorph) - её место занимает имя
  out += rule(`${P} ${CONN} > div:has(+ ${BTN})`, ['display: none !important']);
  out += rule(`${P} ${H}`, ['order: 1', 'margin-top: auto', 'align-self: center', 'max-width: 100%', 'min-width: 0']);
  // Тень текста из «Шрифтов» сломала бы фильтр: он строит блики по форме букв вместе с тенью.
  // Флаги в имени - шрифтом клиента twemoji, как у фикса флагов
  out += rule(`${P} ${H} > span`, [
    `font-size: ${pw.nameSize}px !important`, 'font-weight: 700 !important', 'letter-spacing: 0.01em', 'line-height: 1.25',
    'white-space: nowrap', 'overflow: hidden', 'text-overflow: ellipsis', 'min-width: 0', 'padding: 2px 3px', 'text-shadow: none !important',
    `font-family: ${fontStack(cfg.fonts.ui || 'system-ui', 'sans', true).replace('"system-ui", ', '')} !important`
  ]);
  // Логотип - по размеру имени (у клиента 40px при тексте 16px), серый, пока нет подключения
  const logo = px(Math.round(pw.nameSize * 1.5));
  out += rule(`${P} ${H} > img`, [`width: ${logo}`, `height: ${logo}`, 'flex-shrink: 0', `transition: ${fade('filter')}, ${fade('opacity')}`]);
  out += rule(`${P} ${COL}:not(${LIT}) ${H} > img`, ['filter: grayscale(1) brightness(0.75)', 'opacity: 0.55']);

  for (const { scheme, sel } of scopes) {
    const S = `${sel} ${COL}`;
    const color = pw.nameColor === 'custom' ? (scheme === 'dark' ? `color-mix(in srgb, ${pw.nameCustom} 70%, #fff)` : pw.nameCustom) : '#fff';
    const on = filterUrl(LOOKS[pw.nameLook][scheme](k), REGION_ON);
    out += rule(`${S} ${H} > span`, [`color: ${color} !important`, `filter: ${filterUrl(OFF[scheme](k), REGION_OFF)}`]);
    out += rule(`${S}${LIT} ${H} > span`, [`filter: ${on}`]);
    // Ошибка - красные буквы. Почти прозрачное стекло красный не показало бы: у него буквы как у объёмных
    out += rule(`${S}${ERR} ${H} > span`, [`color: ${scheme === 'dark' ? 'color-mix(in srgb, var(--destructive) 80%, #fff)' : 'var(--destructive)'} !important`,
      `filter: ${pw.nameLook === 'glass' ? filterUrl(LOOKS.raised[scheme](k), REGION_ON) : on}`]);
    // Смена вида - ступеньками, без промежуточных кадров
    if (pw.animate) out += rule(`${S}${LOAD} ${H} > span`, [`animation: kt-name-warm-${scheme} ${r2(WARM_FRAMES / FPS)}s step-end infinite`]);
  }
  return out;
}
