// «Шар света» кнопки подключения и ручки тумблера: стеклянный шар с лентой света внутри.
//
// Лента - перекрученная полоса, которая вращается вокруг горизонтальной оси. Её кривая меняется во времени,
// но вращение раскладывается на две неподвижные формы, горб и волну: каждая сжимается и переворачивается
// через scaleY, между ними четверть оборота, а наложенные они дают то самое перекручивание. Анимируется только
// transform, поэтому картинка растрируется один раз, а частота кадров ограничена ступеньками (см. frames.ts). Морфинг
// кривой кадрами внутри SVG пришлось бы растрировать на каждом кадре.
//
// Поперёк лента - не линии, а белое ядро и широкое свечение: с одной стороны холодное, с другой тёплое. При
// перевороте стороны меняются местами, как и на настоящей каустике.
//
// Схемы разные. Тёмная - прозрачный шар, лента складывается с фоном (screen). На светлом фоне так свет не виден,
// поэтому светлый шар плотный: тёмный верх и серебристый низ, как на образце, а лента рисуется поверх обычным
// наложением, и у неё свои, светлые ореолы.

import { mix } from './color';

const r1 = (x: number) => Math.round(x * 10) / 10;
const svgUrl = (svg: string) => `url("data:image/svg+xml,${svg.replace(/"/g, "'").replace(/#/g, '%23').replace(/</g, '%3C').replace(/>/g, '%3E').replace(/\s+/g, ' ')}")`;
const stops = (list: [number, string, number?][]) => list.map(([o, c, a = 1]) => `<stop offset='${o}' stop-color='${c}' stop-opacity='${a}'/>`).join('');
const NS = "xmlns='http://www.w3.org/2000/svg'";
/** Область фильтров с запасом: у размытия по умолчанию она тесная, и края свечения обрезаются прямоугольником */
const FR = "filterUnits='userSpaceOnUse' x='-14' y='-14' width='156' height='156'";

/** Цвета бликов на ободе. Набор один, а серпы и их порядок у схем свои */
interface Glints { blue: string; cyan: string; green: string; orange: string; deep: string; peach: string; pale: string; white: string }
/** Цвета ленты и бликов обода. bloom - сила белого свечения вокруг ядра */
export interface OrbInk { cool: string; coolIn: string; coolHalo: string; warm: string; warmIn: string; warmHalo: string; bloom: number; glints: Glints }

/** Природная призма, тёмная схема: цвета сняты с кадров образца */
export const PRISM_INK: OrbInk = {
  cool: '#86a6d2', coolIn: '#d2f5ff', coolHalo: '#4d6079', warm: '#d6ab85', warmIn: '#ffeab8', warmHalo: '#5e4d3e', bloom: 0.34,
  glints: { blue: '#4f7ff0', cyan: '#58d0f4', green: '#70eab0', orange: '#e8823f', deep: '#c8502e', peach: '#ee9a60', pale: '#efe8e6', white: '#f0f2f4' }
};
/** Природная призма, светлая схема: цвета сняты со светлого образца */
export const PRISM_INK_LIGHT: OrbInk = {
  cool: '#8fc4f6', coolIn: '#c8f6ff', coolHalo: '#a4bcd6', warm: '#f8ae8c', warmIn: '#ffeec0', warmHalo: '#a58d7d', bloom: 0.2,
  glints: { blue: '#8ac2ff', cyan: '#9fd8ff', green: '#9fd8ff', orange: '#ffb48e', deep: '#ffb48e', peach: '#ff9d6e', pale: '#f6f5c4', white: '#ffffff' }
};
/**
 * Лента двух цветов: ядро остаётся белым, это источник света, а цвет получают свечение и блики на ободе. Ореолы на
 * тёмном шаре - притушенные цвета, на светлом - разбелённые: тёмные легли бы на серебро грязным пятном
 */
export const inkOf = (cool: string, warm: string, light: boolean): OrbInk => ({
  cool, coolIn: mix(cool, '#ffffff', 0.65), coolHalo: light ? mix(cool, '#ffffff', 0.35) : mix(cool, '#000000', 0.55),
  warm, warmIn: mix(warm, '#ffffff', 0.65), warmHalo: light ? mix(warm, '#ffffff', 0.35) : mix(warm, '#000000', 0.6), bloom: light ? 0.2 : 0.34,
  glints: { blue: mix(cool, '#000000', 0.25), cyan: cool, green: mix(cool, '#ffffff', 0.3), orange: warm, deep: mix(warm, '#000000', 0.3), peach: warm, pale: light ? mix(warm, '#ffffff', 0.7) : '#efe8e6', white: light ? '#ffffff' : '#f0f2f4' }
});

const XA = 6, XB = 122, AXIS = 64;
/** Огибающая: у концов оси лента сходит на нет, как у линзы */
const env = (x: number) => Math.max(0, Math.sin((Math.PI * (x - XA)) / (XB - XA)));

/**
 * Лента одной формы, viewBox 128×128, ось посередине. h - размах кривой, w - толщина: у маленькой ручки ленту нужно
 * делать толще, иначе ядро теряется. invert меняет стороны местами: на светлом образце тёплая сторона сверху
 */
export function ribbonImage(form: 'hump' | 'wave', ink: OrbInk, h: number, w: number, invert = false): string {
  const flip = (form === 'hump' ? 1 : -1) * (invert ? -1 : 1);
  const y = (x: number) => AXIS - h * env(x) ** 1.5 * (form === 'hump' ? 1 : Math.sin((2 * Math.PI * (x - 64)) / 92) * 1.3);
  // Шаг крупный: ломаная под размытием не видна, а картинка выходит заметно короче
  const xs: number[] = [];
  for (let x = XA; x < XB; x += 8) xs.push(x);
  xs.push(XB);
  const band = (o: number, t: number) => {
    const p = (x: number) => w * env(x) ** 0.8;
    const top = xs.map((x) => `${x} ${r1(y(x) + (o * flip - t) * p(x))}`);
    const bottom = xs.map((x) => `${x} ${r1(y(x) + (o * flip + t) * p(x))}`).reverse();
    return `M${top.join(' L')} L${bottom.join(' L')} Z`;
  };
  const sheet = `M${xs.map((x) => `${x} ${r1(y(x))}`).join(' L')} L${XA} ${AXIS} Z`;
  return svgUrl(`<svg ${NS} viewBox='0 0 128 128'><defs>
    <linearGradient id='x' gradientUnits='userSpaceOnUse' x1='${XA}' y1='0' x2='${XB}' y2='0'>${stops([[0, '#fff', 0.12], [0.1, '#fff', 0.36], [0.26, '#fff', 0.9], [0.38, '#fff'], [0.66, '#fff'], [0.78, '#fff', 0.88], [0.9, '#fff', 0.32], [1, '#fff', 0.12]])}</linearGradient>
    <mask id='m' maskUnits='userSpaceOnUse' x='0' y='0' width='128' height='128'><rect width='128' height='128' fill='url(#x)'/></mask>
    <filter id='a' ${FR}><feGaussianBlur stdDeviation='4.6'/></filter><filter id='b' ${FR}><feGaussianBlur stdDeviation='1.6'/></filter><filter id='d' ${FR}><feGaussianBlur stdDeviation='1.15'/></filter><filter id='c' ${FR}><feGaussianBlur stdDeviation='1.05'/></filter><filter id='s' ${FR}><feGaussianBlur stdDeviation='2.2'/></filter></defs>
    <g mask='url(#m)'>
      <path d='${sheet}' fill='#dfe3e8' opacity='.13' filter='url(#s)'/>
      <path d='${band(0.3, 5.5)}' fill='#fff' opacity='${ink.bloom}' filter='url(#a)'/>
      <path d='${band(-7.5, 7.5)}' fill='${ink.coolHalo}' opacity='.9' filter='url(#a)'/><path d='${band(7.5, 6.8)}' fill='${ink.warmHalo}' opacity='.8' filter='url(#a)'/>
      <path d='${band(-3.3, 2.7)}' fill='${ink.cool}' filter='url(#b)'/><path d='${band(4, 2.3)}' fill='${ink.warm}' filter='url(#b)'/>
      <path d='${band(-1.6, 1.5)}' fill='${ink.coolIn}' filter='url(#d)'/><path d='${band(2.6, 1.4)}' fill='${ink.warmIn}' filter='url(#d)'/>
      <path d='${band(0.3, 2.4)}' fill='#fff' filter='url(#c)'/></g></svg>`);
}

const hexRgb = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const rgbHex = (a: number[]) => `#${a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
const pt = (r: number, a: number) => { const t = (a * Math.PI) / 180; return `${r1(64 + r * Math.cos(t))} ${r1(64 - r * Math.sin(t))}`; };

/** Цвет линии обода через 15°, против часовой от правой точки. Цвет в нём сдержанный, яркое дают серпы */
const RIM_DARK = ['#8a8a88', '#6e7480', '#565d70', '#42485c', '#3a3c44', '#3c3d40', '#444444', '#464644', '#5e5a58', '#7e7876', '#7c6a5e', '#8a7a6a', '#9aa0a2', '#6e8488', '#5e6e80', '#626a72', '#7a7a7a', '#9a9888', '#c8c8bc', '#a8a8a4', '#a09690', '#927c70', '#8e705c', '#86604a'];
const RIM_LIGHT = ['#605c5b', '#444144', '#3a3c3d', '#3b3d41', '#404145', '#454447', '#4b4a4d', '#4e4e50', '#595556', '#72625e', '#c48a76', '#f6f5c4', '#8ac2ff', '#6f7d8a', '#727982', '#7b7e84', '#81878e', '#878d94', '#8d929a', '#8f979d', '#909ca6', '#9ab7d8', '#f6ffff', '#d89b82'];
/** Серп на ободе: начало и конец дуги в градусах, цвет, непрозрачность, толщина посередине */
type Spot = [number, number, keyof Glints, number, number];
/** Разложение цвета как на кадре видео. Справа сверху вниз синий, голубой, зелёный, оранжевый, красный; слева персик, белый, зелёный, голубой, синий */
const SPOTS_DARK: Spot[] = [[58, 22, 'blue', 0.9, 1.8], [34, 8, 'cyan', 1, 2.1], [14, -2, 'green', 0.9, 1.8], [-2, -34, 'orange', 0.85, 1.8], [-24, -52, 'deep', 0.7, 1.5], [118, 148, 'pale', 0.75, 1.4],
  [130, 172, 'peach', 0.95, 2.1], [172, 190, 'white', 0.9, 1.6], [184, 200, 'green', 0.9, 1.6], [192, 222, 'cyan', 0.95, 1.9], [214, 250, 'blue', 0.7, 1.6], [240, 305, 'white', 0.85, 1.6]];
/** На светлом образце радуга только там, где поверхность упирается в обод: слева и справа */
const SPOTS_LIGHT: Spot[] = [[128, 160, 'peach', 0.95, 2.6], [158, 172, 'pale', 0.95, 2.2], [170, 196, 'blue', 1, 2.6], [-8, -26, 'orange', 0.9, 2.4], [-24, -40, 'white', 1, 3], [-36, -62, 'cyan', 1, 2.6]];

/** Серп: снаружи дуга обода, внутри дуга большего радиуса через те же концы, поэтому концы сходят на нет */
function crescent([from, to, role, o, thick]: Spot, glints: Glints): string {
  const R = 63.7, d = (Math.abs(to - from) * Math.PI) / 180, chord = 2 * R * Math.sin(d / 2);
  const inner = Math.max(0.05, R * (1 - Math.cos(d / 2)) - thick), r = (chord * chord / 4 + inner * inner) / (2 * inner), sw = from < to ? 0 : 1;
  return `<path d='M${pt(R, from)} A${R} ${R} 0 0 ${sw} ${pt(R, to)} A${r1(r)} ${r1(r)} 0 0 ${1 - sw} ${pt(R, from)} Z' fill='${glints[role]}' opacity='${o}'/>`;
}

/**
 * Обод: тонкая линия, объём стекла у края и цветные серпы. Цвет обводки по дуге задать нельзя, поэтому линия собрана из
 * отрезков. steps - их число: маленькой ручке хватает 24, большому шару нужно 48. gain - яркость линии
 */
export function rimImage(ink: OrbInk, steps: number, gain: number, light: boolean): string {
  const table = light ? RIM_LIGHT : RIM_DARK;
  const stepA = 360 / steps;
  let ring = '';
  for (let i = 0; i < steps; i++) {
    const a = i * stepA, s = a / 15, x = Math.floor(s), f = s - x, ca = hexRgb(table[x % 24]), cb = hexRgb(table[(x + 1) % 24]);
    const c = rgbHex(ca.map((v, j) => (v + (cb[j] - v) * f) * gain));
    // Отрезки внахлёст: без этого между ними просвечивает
    ring += `<path d='M${pt(63.4, a - 0.6)} A63.4 63.4 0 0 0 ${pt(63.4, a + stepA + 0.6)}' stroke='${c}'/>`;
  }
  // Тёмному шару - объём: мягкое свечение у края и блики на концах оси. Светлому - стальная кромка, как на образце
  const volume = light ? "<circle cx='64' cy='64' r='62.2' fill='none' stroke='#8d929a' stroke-width='1.6' opacity='.5' filter='url(#t)'/>"
    : `<circle cx='64' cy='64' r='60.5' fill='none' stroke='url(#i)' stroke-width='5' filter='url(#s)'/><circle cx='64' cy='64' r='56' fill='none' stroke='#fff' stroke-width='15' opacity='.1' filter='url(#g2)'/>
      <g filter='url(#g)'><ellipse cx='5.5' cy='66' rx='3' ry='17' fill='#d6dade' opacity='.55'/><ellipse cx='122.5' cy='62' rx='3' ry='17' fill='#d6dade' opacity='.55'/></g>`;
  // Серпы дважды: чётко и мягким ореолом вокруг. Через <use> их контуры не повторяются в адресе
  const crescents = (light ? SPOTS_LIGHT : SPOTS_DARK).map((s) => crescent(s, ink.glints)).join('');
  const spots = `<g id='c' filter='url(#s2)'>${crescents}</g><use href='#c' filter='url(#s1)' opacity='.55'/>`;
  return svgUrl(`<svg ${NS} viewBox='0 0 128 128'><defs>
    <filter id='t' ${FR}><feGaussianBlur stdDeviation='.2'/></filter><filter id='g' ${FR}><feGaussianBlur stdDeviation='3'/></filter><filter id='g2' ${FR}><feGaussianBlur stdDeviation='5'/></filter><filter id='s' ${FR}><feGaussianBlur stdDeviation='2.2'/></filter><filter id='s1' ${FR}><feGaussianBlur stdDeviation='1.5'/></filter><filter id='s2' ${FR}><feGaussianBlur stdDeviation='.45'/></filter>
    <linearGradient id='i' gradientUnits='userSpaceOnUse' x1='0' y1='0' x2='0' y2='128'>${stops([[0, '#fff', 0.09], [0.3, '#fff', 0.03], [0.7, '#fff', 0.05], [1, '#fff', 0.26]])}</linearGradient>
    <clipPath id='k'><circle cx='64' cy='64' r='64'/></clipPath></defs>
    <g clip-path='url(#k)'>${volume}
      <circle cx='64' cy='64' r='59.2' fill='none' stroke='url(#i)' stroke-width='.45' opacity='.5' filter='url(#t)'/>
      <g fill='none' stroke-width='1' filter='url(#t)'>${ring}</g>${spots}</g></svg>`);
}

const part = (c: string, pct: number) => `color-mix(in srgb, ${c} ${Math.round(pct)}%, transparent)`;

/**
 * Тело тёмного шара для background: затемнение с силой pct, слабый свет снизу и рассеянный свет вокруг оси, холодный
 * сверху и тёплый снизу. color, cool и warm - значения CSS: так они следуют за палитрой без отдельных картинок.
 * pct 0 - шар совсем прозрачный, виден только обод и лента
 */
export const orbBody = (pct: number, color: string, cool: string, warm: string) => [
  'radial-gradient(ellipse 34% 24% at 50% 90%, rgba(217, 221, 226, 0.12), transparent) no-repeat',
  `radial-gradient(ellipse 42% 24% at 50% 38%, ${part(cool, 0.18 * pct)}, transparent) no-repeat`,
  `radial-gradient(ellipse 42% 22% at 50% 64%, ${part(warm, 0.18 * pct)}, transparent) no-repeat`,
  `radial-gradient(circle closest-side, ${part(color, pct)}, ${part(color, pct * 0.92)} 72%, ${part(color, pct * 0.6)} 97%, ${part(color, pct * 0.4)}) no-repeat`
].join(', ');

/**
 * Тело светлого шара: цвета сняты со светлого образца. Тёмный верх с провалами по бокам, серебристый низ, светлая
 * лужица у дна. Сила фона идёт по корню: на светлой дорожке полупрозрачный шар бледнеет, и белое ядро ленты теряется
 */
export const orbBodyLight = (bg: number) => { const pct = 10 * Math.sqrt(bg); return [
  `radial-gradient(ellipse 30% 13% at 50% 90%, ${part('#f4f5f7', pct * 0.95)}, transparent) no-repeat`,
  `radial-gradient(ellipse 30% 18% at 20% 62%, ${part('#3c4046', pct * 0.6)}, transparent) no-repeat`,
  `radial-gradient(ellipse 30% 24% at 24% 26%, ${part('#16191e', pct * 0.75)}, transparent) no-repeat`,
  `radial-gradient(ellipse 30% 24% at 78% 26%, ${part('#16191e', pct * 0.75)}, transparent) no-repeat`,
  `linear-gradient(180deg, ${part('#3a3b41', pct)}, ${part('#34353c', pct)} 38%, ${part('#46474c', pct)} 47%, ${part('#7c8086', pct)} 56%, ${part('#9aa1aa', pct)} 64%, ${part('#a8adb3', pct)} 76%, ${part('#c6c9cc', pct)} 90%, ${part('#b4b8bc', pct)}) no-repeat`
].join(', '); };
