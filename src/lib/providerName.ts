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
// при ошибке красные. Мигания при подключении нет: его кадры повторяли фильтры, и вид весил десятки килобайт.
// «Стекло» (pane) - не только фильтр: под буквами стекло плиток, обрезанное по их форме маской (ниже, «Стекло»).
// «Как в клиенте» (app) - только перенос, без вида букв.

import { fontStack } from './fonts';
import type { GlassLook } from './power';
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

// Фильтры пишутся в тему как есть, поэтому разметка короткая: примитив без in берёт результат предыдущего, и
// имя результата есть только у того, что читают дальше; нулевые сдвиги и размытия не пишутся
const flood = (id: string, color: string, op: number, mask: string) =>
  `<feFlood flood-color='${color}' flood-opacity='${r2(op)}'/><feComposite in2='${mask}' operator='in' result='${id}'/>`;
/** Форма букв a, сдвинутая и размытая, - в результат res */
const shift = (a: string, dx: number, dy: number, blur: number, res: string) => {
  const off = dx || dy ? `<feOffset in='${a}'${dx ? ` dx='${r2(dx)}'` : ''}${dy ? ` dy='${r2(dy)}'` : ''}` : '';
  if (blur <= 0) return `${off || `<feOffset in='${a}'`} result='${res}'/>`;
  return `${off && `${off}/>`}<feGaussianBlur${off ? '' : ` in='${a}'`} stdDeviation='${r2(blur)}' result='${res}'/>`;
};
/** Полоска внутри букв со стороны, противоположной сдвигу: сверху при dy > 0. a - откуда форма букв */
const inner = (dx: number, dy: number, blur: number, color: string, op: number, a = 'SourceAlpha'): Layer => (id) => ({
  defs: `${shift(a, dx, dy, blur, `${id}b`)}<feComposite in='${a}' in2='${id}b' operator='out' result='${id}m'/>${flood(id, color, op, `${id}m`)}`,
  node: id
});
/** Полоска снаружи букв по сдвигу: блик кромки под вдавленными буквами, тень под приподнятыми */
const outer = (dy: number, blur: number, color: string, op: number): Layer => (id) => ({
  defs: `${shift('SourceAlpha', 0, dy, blur, `${id}b`)}<feComposite in2='SourceAlpha' operator='out' result='${id}m'/>${flood(id, color, op, `${id}m`)}`,
  node: id
});
/** Кольцо у края изнутри: буквы минус их размытие. Толщина стекла */
const ring = (blur: number, color: string, op: number, a = 'SourceAlpha'): Layer => (id) => ({
  defs: `<feGaussianBlur in='${a}' stdDeviation='${r2(blur)}'/><feComposite in2='${a}' operator='arithmetic' k2='-1' k3='1' result='${id}m'/>${flood(id, color, op, `${id}m`)}`,
  node: id
});
/** Свет вокруг букв их же цветом, насыщеннее: у белых букв белый, у цветных - их цвет */
const halo = (blur: number, op: number): Layer => (id) => ({
  defs: `<feColorMatrix in='SourceGraphic' type='saturate' values='2'/><feGaussianBlur stdDeviation='${r2(blur)}'/>`
    + `<feComponentTransfer result='${id}'><feFuncA type='linear' slope='${r2(op)}'/></feComponentTransfer>`,
  node: id
});
/** Лицо букв - их цвет (color). op < 1 - полупрозрачное: сквозь стекло виден фон */
const face = (op = 1): Layer => (id) => op === 1 ? { defs: '', node: 'SourceGraphic' } : {
  defs: `<feComponentTransfer in='SourceGraphic' result='${id}'><feFuncA type='linear' slope='${r2(op)}'/></feComponentTransfer>`,
  node: id
};
/** Заливка букв одним цветом */
const fill = (color: string, op: number): Layer => (id) => ({ defs: flood(id, color, op, 'SourceAlpha'), node: id });
/** Зерно матового стекла: шум только по форме букв. Считается вместе с фильтром - при смене состояния, не в покое */
const grain = (op: number): Layer => (id) => ({
  defs: `<feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='3'/>`
    + `<feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 ${r2(op * 3)} -${r2(op)}'/>`
    + `<feComposite in2='SourceAlpha' operator='in' result='${id}'/>`,
  node: id
});

/** Фильтр из слоёв, снизу вверх. Слой без node только готовит результат для следующих. Цвета без #: в data: он начал бы ссылку на фрагмент */
function filterUrl(layers: Layer[], region: string): string {
  const ls = layers.map((l, i) => l(`l${i}`));
  const svg = `<svg xmlns='http://www.w3.org/2000/svg'><filter id='f' ${region} color-interpolation-filters='sRGB'>${ls.map((l) => l.defs).join('')}`
    + `<feMerge>${ls.filter((l) => l.node).map((l) => `<feMergeNode in='${l.node}'/>`).join('')}</feMerge></filter></svg>`;
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
const LOOKS: Record<Exclude<NameLook, 'pane' | 'app'>, Record<Scheme, (k: number) => Layer[]>> = {
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

/* ---------- «Стекло» ---------- */

// Стекло плиток по форме букв. backdrop-filter обрезается маской элемента, а маска -webkit-mask-clip: text -
// формой текста, какой бы он ни был: фон под буквами размыт, как под плитками. Маска захватывает и обводку
// -webkit-text-stroke: ею в светлой схеме рисуется тёмная линия снаружи букв, как у плиток. Всё прочее снаружи
// букв маска срезает, свет вокруг и тень под ними здесь невозможны. Лицо - заливка плиток или цвета букв через
// background-clip: text. Прозрачность лица задаёт заливка, а не фильтр: с фильтром, убавлявшим прозрачность
// букв, стекло под ними пропадало. Эмодзи в имени - тоже стекло: их рисует та же прозрачная заливка.
// Цена - одно размытие фона на строку имени, без карты сдвигов жидкого стекла

/**
 * Альфа букв, усиленная до единицы: лицо полупрозрачно, и кромка по его альфе вышла бы бледной. Усиление -
 * ровно до единицы при самой прозрачной заливке (alpha): с запасом сглаживание краёв букв сжималось в ступеньку,
 * и кромка шла рябью
 */
const solid = (alpha: number): Layer => () => ({
  defs: `<feComponentTransfer in='SourceAlpha' result='A'><feFuncA type='linear' slope='${r2(1 / alpha)}'/></feComponentTransfer>`, node: ''
});
/** Самая прозрачная заливка «Стекла», меньше нельзя: у почти прозрачной заливки кромке не по чему строиться */
const PANE_MIN_ALPHA = 0.04;
/**
 * Свет кромки - как у световой рамки плиток (edgeLightImage в shadows.ts): сверху и снизу светлее, снизу ярче,
 * по бокам темнее, у краёв мягкий свет. В светлой схеме бока темнее, чем у плиток: те отделяет от фона тень
 */
const EDGE: Record<Scheme, { top: number; bottom: number; shade: number; soft: number }> = {
  dark: { top: 0.6, bottom: 0.75, shade: 0.33, soft: 0.16 },
  light: { top: 0.9, bottom: 1, shade: 0.6, soft: 0.4 }
};
const paneFilter = (scheme: Scheme, k: number, rim: number, alpha: number) => {
  const e = EDGE[scheme];
  const op = (v: number) => Math.min(1, v * rim);
  return filterUrl([solid(alpha), face(), ring(1.2 * k, BLACK, op(e.shade), 'A'), inner(0, 3 * k, 1.5 * k, WHITE, op(e.soft), 'A'),
    inner(0, -3 * k, 1.5 * k, WHITE, op(e.soft), 'A'), inner(0, 1.1 * k, 0.35 * k, WHITE, op(e.top), 'A'), inner(0, -k, 0.35 * k, WHITE, op(e.bottom), 'A')],
  "x='0' y='0' width='1' height='1'");
};
/**
 * Заливка лица и её наименьшая непрозрачность. Своя - цветом букв (color), сверху плотнее. Слишком прозрачную
 * подбивает белая подложка в PANE_MIN_ALPHA
 */
function paneFill(pw: ThemeConfig['power'], glass: GlassLook): { fill: string; alpha: number } {
  const own = (a: number) => `color-mix(in srgb, currentColor ${r2(a)}%, transparent)`;
  const [fill, alpha] = pw.nameGlassFill === 'tiles' ? [glass.tint, glass.tintAlpha]
    : [`linear-gradient(180deg, ${own(pw.nameGlassTint)}, ${own(pw.nameGlassTint * 0.45)})`, pw.nameGlassTint * 0.0045];
  if (alpha >= PANE_MIN_ALPHA) return { fill, alpha };
  const under = `rgba(255, 255, 255, ${PANE_MIN_ALPHA})`;
  return { fill: `${fill}, linear-gradient(${under}, ${under})`, alpha: PANE_MIN_ALPHA + alpha * (1 - PANE_MIN_ALPHA) };
}

/** «Стекло» при подключении: заливка лица, маска по тексту, стекло под буквами, кромка. В светлой схеме - линия снаружи */
function paneOn(cfg: ThemeConfig, scheme: Scheme, k: number, glass: GlassLook): string[] {
  const pw = cfg.power, su = cfg.surfaces;
  const { fill, alpha } = paneFill(pw, glass);
  const blur = pw.nameGlassFill === 'tiles' ? (su.blur > 0 ? `blur(${su.blur}px) saturate(${su.saturate}%)` : '') : (pw.nameGlassBlur > 0 ? `blur(${pw.nameGlassBlur}px)` : '');
  // В светлой схеме фон под буквами чуть темнее: на светлом ровном фоне светлое стекло иначе сливается с ним
  const backdrop = [blur, scheme === 'light' && 'brightness(0.92)'].filter(Boolean).join(' ') || 'none';
  return [`background: ${fill}`, 'background-clip: text', '-webkit-text-fill-color: transparent', `backdrop-filter: ${backdrop}`,
    '-webkit-mask: linear-gradient(#000 0 0) text', `filter: ${pw.nameGlassRim > 0 ? paneFilter(scheme, k, pw.nameGlassRim / 100, alpha) : 'none'}`,
    ...(scheme === 'light' ? [`-webkit-text-stroke: ${px(k)} rgba(40, 48, 60, ${r2(Math.min(1, 0.35 * pw.nameGlassRim / 100))})`] : [])];
}

/* ---------- Правила ---------- */

/** Объявление провайдера осталось без своей карточки - даём ему стекло и рамку плиток: дописываем в их селекторы */
export function announceAsTile(css: string): string {
  return css.replaceAll(TILE, `:is(${TILE}, ${ANNOUNCE})`).replaceAll('.rounded-2xl::before', `:is(.rounded-2xl, ${ANNOUNCE})::before`);
}

export function providerNameRules(cfg: ThemeConfig, rule: RuleFn, scopes: { scheme: Scheme; sel: string }[], glass: GlassLook): string {
  const pw = cfg.power;
  if (!pw.providerName) return '';
  const k = scaleOf(pw);
  const fade = (p: string) => `${p} var(--kt-dur-slow) var(--kt-ease-fade)`;
  let out = '';

  // Раскладка: шапка - перед блоком кнопки, свободное место - поровну над шапкой и под кнопкой
  out += rule(`${P} ${CARD}`, ['display: contents !important']);
  out += rule([`${P} ${CARD}::before`, `${P} ${CARD}::after`], ['display: none !important']);
  // Подложка - как у карточки профиля в клиенте (rounded-2xl border border-stroke bg-card/50 backdrop-blur-xl): без
  // своих плиток правил TILE в теме нет, и объявление оставалось голым текстом. Свои плитки перебивают её !important.
  // Рамка - по свойствам: сокращение border сбросило бы световую рамку плиток (border-image)
  out += rule(`${P} ${CARD} > ${ANNOUNCE}`, ['margin: 0 !important', 'padding: 1rem', 'border-width: 1px', 'border-style: solid', 'border-color: var(--stroke)', 'border-radius: calc(var(--radius) * 1.6)',
    'background-color: color-mix(in oklab, var(--card) 50%, transparent)', 'backdrop-filter: blur(24px)']);
  out += rule([`${P} ${CONN}`, `${P} ${CONN} ~ *`], ['order: 1']);
  out += rule(`${P} ${CONN}`, ['flex-grow: 0 !important', 'margin-bottom: auto']);
  // Надпись «Отключено» / «Подключено» (CharacterMorph) - её место занимает имя
  out += rule(`${P} ${CONN} > div:has(+ ${BTN})`, ['display: none !important']);
  out += rule(`${P} ${H}`, ['order: 1', 'margin-top: auto', 'align-self: center', 'max-width: 100%', 'min-width: 0']);
  // «Как в клиенте» - только перенос: имя и логотип как в карточке профиля, без фильтров
  if (pw.nameLook === 'app') return out;
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

  // Два состояния: подключено - вид букв, всё остальное (выключено, подключение) - вдавленные буквы. Ошибка - красные
  // буквы: у объёмных и матового стекла - в том же виде, у прозрачного стекла и «Стекла» - без фильтра (их лицо
  // красный не показало бы, а свой фильтр на редкое состояние - пара килобайт). Фильтр, нужный дважды, записан
  // один раз в переменную
  const look = pw.nameLook;
  for (const { scheme, sel } of scopes) {
    const S = `${sel} ${COL}`;
    const color = pw.nameColor === 'custom' ? (scheme === 'dark' ? `color-mix(in srgb, ${pw.nameCustom} 70%, #fff)` : pw.nameCustom) : '#fff';
    const shared = look === 'raised' || look === 'frost';
    out += rule(`${S} ${H} > span`, [`color: ${color} !important`, `filter: ${filterUrl(OFF[scheme](k), REGION_OFF)}`,
      shared && `--kt-name-on: ${filterUrl(LOOKS[look][scheme](k), REGION_ON)}`]);
    out += rule(`${S}${LIT} ${H} > span`, look === 'pane' ? paneOn(cfg, scheme, k, glass)
      : [`filter: ${shared ? 'var(--kt-name-on)' : filterUrl(LOOKS.glass[scheme](k), REGION_ON)}`]);
    out += rule(`${S}${ERR} ${H} > span`, [`color: ${scheme === 'dark' ? 'color-mix(in srgb, var(--destructive) 80%, #fff)' : 'var(--destructive)'} !important`,
      `filter: ${shared ? 'var(--kt-name-on)' : 'none'}`,
      // Ошибка бывает и при включённой кнопке (coreProblem в home.tsx) - тогда снимаем стекло «Стекла»
      look === 'pane' && '-webkit-text-fill-color: currentColor', look === 'pane' && 'backdrop-filter: none',
      look === 'pane' && '-webkit-mask: none', look === 'pane' && scheme === 'light' && '-webkit-text-stroke: 0']);
  }
  return out;
}
