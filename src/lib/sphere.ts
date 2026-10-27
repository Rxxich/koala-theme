// Сферы кнопки подключения из анимированного SVG: "Сеть" и "Глобус".
//
// В CSS нельзя провести линии между точками, которые вращаются в 3D, поэтому вращение посчитано
// заранее: для каждого кадра - проекция шара на плоскость, а SMIL плавно перетекает между кадрами
// (у всех кадров одинаковая структура пути, и браузер интерполирует координаты). Картинка служит
// маской (mask-image), цвет даёт фон элемента - так сфера берёт цвета кнопки из палитры и меняет
// их по состоянию без отдельных картинок. SMIL в SVG-картинках работает без скриптов, CSP клиента
// разрешает data:-картинки (img-src * data:).

type V3 = [number, number, number];
interface Pt { x: number; y: number; z: number }

const C0 = 128;
const RAD = 112;
const TILT = 0.36;
/** Кадров на оборот: шаг 18°, на глаз движение по кругу гладкое (отклонение от дуги - меньше пикселя) */
const FRAMES = 20;

const n = (v: number) => String(Math.round(v));
const f1 = (v: number) => String(Math.round(v * 10) / 10);
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const dist = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const seeded = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

/** Поворот вокруг вертикальной оси на угол a, наклон к зрителю, проекция (с лёгкой перспективой) */
function rot(p: V3, a: number, persp: boolean): Pt {
  const [x0, y0, z0] = p;
  const x1 = x0 * Math.cos(a) + z0 * Math.sin(a), z1 = -x0 * Math.sin(a) + z0 * Math.cos(a);
  const y2 = y0 * Math.cos(TILT) - z1 * Math.sin(TILT), z2 = y0 * Math.sin(TILT) + z1 * Math.cos(TILT);
  const k = persp ? 4 / (4 - z2) : 1;
  return { x: C0 + x1 * RAD * k, y: C0 - y2 * RAD * k, z: z2 };
}

const angles = (animated: boolean) => animated ? Array.from({ length: FRAMES + 1 }, (_, i) => (i / FRAMES) * Math.PI * 2) : [0];
const loop = (dur: number) => `dur='${dur}s' repeatCount='indefinite'`;
/** Атрибут d: неподвижный или с анимацией по кадрам */
const animD = (frames: string[], dur: number) => frames.length > 1 ? `d='${frames[0]}'><animate attributeName='d' ${loop(dur)} values='${frames.join(';')}'/>` : `d='${frames[0]}'>`;

/** Яркий узел: ореол дышит, по кадрам меняются положение и прозрачность (за шаром узел гаснет).
 *  В неподвижном кадре ореол тоже замирает: любая SMIL-анимация заставляет браузер перерисовывать кнопку каждый кадр */
function hub(p: V3, i: number, as: number[], dur: number, persp: boolean): string {
  const pos = as.map((a) => rot(p, a, persp));
  const op = (q: Pt) => f1(clamp((q.z + 0.05) * 1.8));
  if (pos.length === 1) return `<g fill='#fff' transform='translate(${n(pos[0].x)} ${n(pos[0].y)})' opacity='${op(pos[0])}'><circle r='8' opacity='.3'/><circle r='3.4'/></g>`;
  const halo = `<circle r='8' opacity='.3'><animate attributeName='r' values='6;11;6' dur='${f1(2.2 + i * 0.37)}s' repeatCount='indefinite'/></circle><circle r='3.4'/>`;
  return `<g fill='#fff'><animateTransform attributeName='transform' type='translate' ${loop(dur)} values='${pos.map((q) => `${n(q.x)} ${n(q.y)}`).join(';')}'/>`
    + `<animate attributeName='opacity' ${loop(dur)} values='${pos.map(op).join(';')}'/>${halo}</g>`;
}

/* ---------- Сеть ---------- */

interface Net { pts: V3[]; edges: [number, number][]; hubs: number[]; adj: number[][] }
let netModel: Net | null = null;

/** Точки на шаре, связи между близкими точками (не больше четырёх у каждой) и самые связанные - узлы */
function network(): Net {
  if (netModel) return netModel;
  const rand = seeded(29);
  // Спираль Фибоначчи с разбросом: покрывает шар равномерно, но без заметного узора
  const N = 76, golden = Math.PI * (3 - Math.sqrt(5));
  const pts: V3[] = Array.from({ length: N }, (_, i) => {
    const y = 1 - ((i + 0.5) / N) * 2 + (rand() - 0.5) * 0.06, r = Math.sqrt(Math.max(0, 1 - y * y));
    const t = i * golden + (rand() - 0.5) * 0.5;
    return [r * Math.cos(t), y, r * Math.sin(t)];
  });
  const pairs: [number, number, number][] = [];
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
    const d = dist(pts[i], pts[j]);
    if (d < 0.5) pairs.push([d, i, j]);
  }
  pairs.sort((a, b) => a[0] - b[0]);
  const deg = pts.map(() => 0);
  const edges: [number, number][] = [];
  for (const [, i, j] of pairs) {
    if (deg[i] >= 4 || deg[j] >= 4 || edges.length >= 130) continue;
    edges.push([i, j]); deg[i]++; deg[j]++;
  }
  const adj = pts.map(() => [] as number[]);
  for (const [i, j] of edges) { adj[i].push(j); adj[j].push(i); }
  const hubs: number[] = [];
  for (const i of pts.map((_, k) => k).sort((a, b) => deg[b] - deg[a])) {
    if (hubs.length < 6 && hubs.every((h) => dist(pts[h], pts[i]) > 0.7)) hubs.push(i);
  }
  return (netModel = { pts, edges, hubs, adj });
}

/** Сигналы: светящиеся точки бегут по связям на видимой стороне шара, цепочками по три перехода */
function pulses(m: Net, dur: number): string {
  const HOP = 0.75 / dur;
  const at = (i: number, t: number) => rot(m.pts[i], t * Math.PI * 2, true);
  let out = '';
  for (let k = 0; k < 6; k++) {
    const keys: { t: number; x: number; y: number; o: number }[] = [];
    let seed = k * 7 + 3;
    const starts = [0, 1, 2].map((c) => (k / 6 + c / 3 + 0.04) % 1).sort((x, y) => x - y);
    for (const t0 of starts) {
      if (t0 + HOP * 3 > 0.98) continue;
      // Начало - связь, оба конца которой смотрят на зрителя
      const ok = m.edges.filter(([i, j]) => at(i, t0).z > 0.35 && at(j, t0).z > 0.35);
      if (!ok.length) continue;
      seed = (seed * 31 + 11) % 997;
      let [a, b] = ok[seed % ok.length];
      let t = t0;
      keys.push({ t: t - 0.001, ...at(a, t), o: 0 });
      for (let hop = 0; hop < 3; hop++) {
        for (const s of [0, 0.25, 0.5, 0.75, 1]) {
          const ts = t + HOP * s, A = at(a, ts), B = at(b, ts);
          keys.push({ t: ts, x: A.x + (B.x - A.x) * s, y: A.y + (B.y - A.y) * s, o: hop === 0 && s === 0 ? 0.3 : 1 });
        }
        t += HOP;
        const next = m.adj[b].filter((v) => v !== a && at(v, t).z > 0.2);
        if (!next.length) break;
        a = b; b = next[(seed + hop) % next.length];
      }
      const last = keys[keys.length - 1];
      keys.push({ t: t + 0.001, x: last.x, y: last.y, o: 0 });
    }
    if (!keys.length) continue;
    keys.unshift({ ...keys[0], t: 0, o: 0 });
    keys.push({ ...keys[keys.length - 1], t: 1, o: 0 });
    const kt = keys.map((q) => String(Math.round(q.t * 10000) / 10000)).join(';');
    out += `<g fill='#fff' opacity='0'><animateTransform attributeName='transform' type='translate' ${loop(dur)} keyTimes='${kt}' values='${keys.map((q) => `${n(q.x)} ${n(q.y)}`).join(';')}'/>`
      + `<animate attributeName='opacity' ${loop(dur)} keyTimes='${kt}' values='${keys.map((q) => f1(q.o)).join(';')}'/><circle r='6' opacity='.35'/><circle r='2.6'/></g>`;
  }
  return out;
}

function networkSvg(animated: boolean, dur: number): string {
  const m = network();
  const as = angles(animated);
  const lines: string[] = [], dots: string[] = [];
  for (const a of as) {
    const P = m.pts.map((p) => rot(p, a, true));
    // Связь за шаром схлопывается в точку посередине - при повороте она "прорастает" из центра
    lines.push(m.edges.map(([i, j]) => {
      const A = P[i], B = P[j];
      if (A.z > -0.08 && B.z > -0.08 && A.z + B.z > 0.12) return `M${n(A.x)} ${n(A.y)}L${n(B.x)} ${n(B.y)}`;
      const x = n((A.x + B.x) / 2), y = n((A.y + B.y) / 2);
      return `M${x} ${y}L${x} ${y}`;
    }).join(''));
    // Точка - короткий штрих: спереди крупная, сзади тонкая (выглядит тусклее), в глубине пропадает
    dots.push(P.map((q) => `M${n(q.x - 1.7)} ${n(q.y)}h${q.z > 0.05 ? 3 : q.z > -0.6 ? 1 : 0}`).join(''));
  }
  return `<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256' viewBox='0 0 256 256' fill='none'>`
    + `<circle cx='128' cy='128' r='112' stroke='#fff' stroke-opacity='.16' stroke-width='1.5'/>`
    + `<path stroke='#fff' stroke-opacity='.5' stroke-width='1.6' ${animD(lines, dur)}</path>`
    + `<path stroke='#fff' stroke-opacity='.9' stroke-width='3.4' ${animD(dots, dur)}</path>`
    + m.hubs.map((h, i) => hub(m.pts[h], i, as, dur, true)).join('')
    + (animated ? pulses(m, dur) : '')
    + `</svg>`;
}

/* ---------- Глобус ---------- */

function globeSvg(animated: boolean, dur: number): string {
  const ct = Math.cos(TILT), st = Math.sin(TILT);
  const as = angles(animated);
  let front = '', back = '';
  // Параллели при вращении не двигаются - это неподвижные эллипсы: ближняя дуга яркая, дальняя тусклая
  for (const deg of [-60, -30, 0, 30, 60]) {
    const phi = (deg * Math.PI) / 180, r = Math.cos(phi);
    const cy = C0 - RAD * Math.sin(phi) * ct, rx = RAD * r, ry = RAD * r * st;
    const c = (-Math.sin(phi) * st) / (r * ct);
    const P = (t: number) => `${f1(C0 + rx * Math.cos(t))} ${f1(cy + ry * Math.sin(t))}`;
    const full = `M${f1(C0 - rx)} ${f1(cy)}a${f1(rx)} ${f1(ry)} 0 1 0 ${f1(2 * rx)} 0a${f1(rx)} ${f1(ry)} 0 1 0 ${f1(-2 * rx)} 0`;
    if (c <= -1) { front += full; continue; }
    if (c >= 1) { back += full; continue; }
    const t1 = Math.asin(c), t2 = Math.PI - t1, large = t2 - t1 > Math.PI ? 1 : 0;
    front += `M${P(t1)}A${f1(rx)} ${f1(ry)} 0 ${large} 1 ${P(t2)}`;
    back += `M${P(t2)}A${f1(rx)} ${f1(ry)} 0 ${1 - large} 1 ${P(t1 + Math.PI * 2)}`;
  }
  // Меридианы - большие круги через полюса. Проекция большого круга - эллипс с большой полуосью R,
  // поэтому каждый меридиан - круг, сжатый по одной оси и повёрнутый. Ближняя половина эллипса -
  // со стороны y > 0 в сжатых координатах, её вырезает clipPath
  let meridians = '';
  for (let m = 0; m < 6; m++) {
    const lam = (m * Math.PI) / 6;
    let prev = 0;
    const rotV: string[] = [], scaleV: string[] = [];
    as.forEach((a, i) => {
      const nx0 = Math.sin(lam), nz0 = -Math.cos(lam);
      const nx = nx0 * Math.cos(a) + nz0 * Math.sin(a), nz1 = -nx0 * Math.sin(a) + nz0 * Math.cos(a);
      const ny = -nz1 * st, nz = nz1 * ct;
      const L = Math.hypot(nx, ny) || 1;
      const ux = ny / L, uy = -nx / L;
      const wx = ny * 0 - nz * uy, wy = nz * ux - nx * 0;
      let ang = (Math.atan2(-uy, ux) * 180) / Math.PI;
      if (i > 0) { while (ang - prev > 180) ang -= 360; while (ang - prev < -180) ang += 360; }
      prev = ang;
      // Знак z у второй оси всегда отрицательный, поэтому ближняя половина - при обратном знаке сжатия
      const k = -(wx * uy - wy * ux);
      rotV.push(f1(ang));
      scaleV.push(`1 ${Math.round(k * 1000) / 1000}`);
    });
    // Толщина без масштаба (иначе сжатый круг истончается) - в пикселях экрана, поэтому тоньше параллелей
    const ring = `<circle r='112' vector-effect='non-scaling-stroke' stroke-width='.8' clip-path='url(#f)' stroke-opacity='.75'/><circle r='112' vector-effect='non-scaling-stroke' stroke-width='.8' clip-path='url(#b)' stroke-opacity='.2'/>`;
    meridians += rotV.length > 1
      ? `<g><animateTransform attributeName='transform' type='rotate' ${loop(dur)} values='${rotV.join(';')}'/><g><animateTransform attributeName='transform' type='scale' ${loop(dur)} values='${scaleV.join(';')}'/>${ring}</g></g>`
      : `<g transform='rotate(${rotV[0]})'><g transform='scale(${scaleV[0]})'>${ring}</g></g>`;
  }
  const cities: V3[] = [[0.35, 0.55, 0.76], [-0.6, 0.2, 0.77], [0.8, -0.3, -0.52], [-0.2, -0.5, -0.84], [0.1, 0.9, -0.42]].map((p) => {
    const l = Math.hypot(...p); return [p[0] / l, p[1] / l, p[2] / l] as V3;
  });
  return `<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256' viewBox='0 0 256 256' fill='none' stroke='#fff' stroke-width='1.5'>`
    + `<defs><clipPath id='f'><rect x='-130' y='0' width='260' height='130'/></clipPath><clipPath id='b'><rect x='-130' y='-130' width='260' height='130'/></clipPath></defs>`
    + `<circle cx='128' cy='128' r='112' stroke-opacity='.55'/>`
    + `<path d='${back}' stroke-opacity='.2'/><path d='${front}' stroke-opacity='.7'/>`
    + `<g transform='translate(128 128)'>${meridians}</g>`
    + `<g stroke='none'>${cities.map((p, i) => hub(p, i, as, dur, false)).join('')}</g>`
    + `</svg>`;
}

/* ---------- Частицы ---------- */

/** Пояса глубины от ближнего к дальнему: [нижняя граница z, диаметр частицы, непрозрачность] */
const DEPTH: [number, number, number][] = [[0.55, 4.6, 1], [0.1, 3.6, 0.8], [-0.35, 2.4, 0.4], [-Infinity, 1.6, 0.18]];

/** Искра: четырёхлучевая звезда на шаре, вращается вместе с ним, изредка вспыхивает и гаснет за шаром */
function sparkle(p: V3, i: number, as: number[], dur: number): string {
  const pos = as.map((a) => rot(p, a, true));
  const flash = `<g opacity='0'><animate attributeName='opacity' values='0;0;1;0' keyTimes='0;.55;.75;1' dur='${f1(2.3 + i * 0.61)}s' begin='${f1(i * 0.9)}s' repeatCount='indefinite'/>`
    + `<path d='M0-9L1.4-1.4 9 0 1.4 1.4 0 9-1.4 1.4-9 0-1.4-1.4z'/><circle r='2.4'/></g>`;
  return `<g fill='#fff'><animateTransform attributeName='transform' type='translate' ${loop(dur)} values='${pos.map((q) => `${f1(q.x)} ${f1(q.y)}`).join(';')}'/>`
    + `<animate attributeName='opacity' ${loop(dur)} values='${pos.map((q) => f1(clamp(q.z * 2.5))).join(';')}'/>${flash}</g>`;
}

// Частицы лежат на параллелях, по K·cos(широты) штук на каждой, поэтому поворот на шаг между
// соседними частицами даёт ту же картинку: параллели хватает анимации на один шаг с повтором, а не на
// весь оборот. Глубина - пояса: граница между ближней и дальней частью параллели на экране -
// горизонтальная линия, поэтому пояс - та же параллель (<use>), обрезанная полосой, со своим
// размером и яркостью частиц
function particlesSvg(animated: boolean, dur: number): string {
  const rand = seeded(7);
  const ROWS = 22, K = 40;
  const ct = Math.cos(TILT), st = Math.sin(TILT);
  let defs = '';
  const layers = DEPTH.map(() => '');
  for (let i = 0; i < ROWS; i++) {
    const phi = ((i + 0.5) / ROWS - 0.5) * Math.PI * 0.94;
    const r = Math.cos(phi), y0 = Math.sin(phi);
    const k = Math.max(3, Math.round(K * r));
    const step = (Math.PI * 2) / k, phase = rand() * step;
    // Кадров на шаг столько, чтобы прямая между кадрами отходила от дуги меньше чем на 0.3 единицы
    const F = animated ? Math.max(2, Math.ceil(step / (2 * Math.acos(1 - 0.3 / (RAD * r))))) : 0;
    const frames = Array.from({ length: F + 1 }, (_, f) => Array.from({ length: k }, (_, j) => {
      const t = phase + j * step;
      const q = rot([r * Math.cos(t), y0, r * Math.sin(t)], F ? (f / F) * step : 0, true);
      return `M${f1(q.x)} ${f1(q.y)}h0`;
    }).join(''));
    defs += `<path id='p${i}' ${animD(frames, Math.round((dur / k) * 1000) / 1000)}</path>`;
    // Экранная высота точки параллели с глубиной z. Чем ближе точка, тем она ниже на экране - это верно
    // при наклоне больше 15° (4·sin(TILT) > 1), поэтому пояс и вырезается горизонтальной полосой
    const yAt = (z: number) => C0 - (y0 * ct - ((z - y0 * st) / ct) * st) * RAD * (4 / (4 - z));
    const zMin = y0 * st - r * ct, zMax = y0 * st + r * ct;
    DEPTH.forEach(([lo], b) => {
      const hi = b ? DEPTH[b - 1][0] : Infinity;
      if (zMax < lo || zMin >= hi) return;
      if (lo <= zMin && hi > zMax) { layers[b] += `<use href='#p${i}'/>`; return; }
      const top = lo > zMin ? yAt(lo) : 0, bottom = hi <= zMax ? yAt(hi) : 256;
      defs += `<clipPath id='c${i}-${b}'><rect y='${f1(top)}' width='256' height='${f1(bottom - top)}'/></clipPath>`;
      layers[b] += `<use href='#p${i}' clip-path='url(#c${i}-${b})'/>`;
    });
  }
  // Искры только у вращающегося шара: выключенная кнопка - неподвижная картинка
  const stars: V3[] = Array.from({ length: 6 }, () => {
    const y = rand() * 1.6 - 0.8, t = rand() * Math.PI * 2, r = Math.sqrt(1 - y * y);
    return [r * Math.cos(t), y, r * Math.sin(t)];
  });
  return `<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256' viewBox='0 0 256 256' fill='none' stroke='#fff' stroke-linecap='round'>`
    + `<defs>${defs}</defs>`
    + DEPTH.map(([, w, o], b) => `<g stroke-width='${w}' stroke-opacity='${o}'>${layers[b]}</g>`).reverse().join('')
    + (animated ? `<g stroke='none'>${stars.map((p, i) => sparkle(p, i, angles(true), dur)).join('')}</g>` : '')
    + `</svg>`;
}

export type SphereKind = 'network' | 'globe' | 'dots';

const cache = new Map<string, string>();

/** Картинка сферы для mask-image. animated=false - неподвижный первый кадр (для выключенной кнопки) */
export function sphereImage(kind: SphereKind, animated: boolean, dur: number): string {
  const key = `${kind}:${animated}:${dur}`;
  let v = cache.get(key);
  if (!v) {
    const svg = kind === 'network' ? networkSvg(animated, dur) : kind === 'globe' ? globeSvg(animated, dur) : particlesSvg(animated, dur);
    v = `url("data:image/svg+xml,${svg.replace(/"/g, "'").replace(/#/g, '%23').replace(/</g, '%3C').replace(/>/g, '%3E')}")`;
    cache.set(key, v);
  }
  return v;
}
