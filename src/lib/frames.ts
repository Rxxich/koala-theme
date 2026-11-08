// Постоянные анимации темы идут ступеньками, а не на частоте экрана.
//
// Любая анимация, хоть точка в углу, заставляет браузер на каждом своём кадре заново считать окно со стеклом, и на
// экране 180 Гц это полтора ядра процессора. Между ступеньками значение не меняется и считать нечего, а за кадр
// движение обычно меньше пикселя, поэтому ступенек не видно.
//
// Длительность подгоняется так, чтобы ступенька была кратна кадру. Тогда у всех анимаций кнопки и у слоя на всё окно
// (см. power.ts) шаги совпадают и приходятся на одни и те же кадры экрана.

export const FPS = 30;

export type Curve = 'linear' | 'ease-in-out' | 'ease-out' | readonly [number, number, number, number];
const BEZIER = { 'ease-in-out': [0.42, 0, 0.58, 1], 'ease-out': [0, 0, 0.58, 1] } as const;

const fix = (v: number, digits: number) => String(Math.round(v * 10 ** digits) / 10 ** digits).replace(/^0\./, '.');

/** Значение кривой Безье по доле времени. Время вдоль кривой растёт монотонно, поэтому параметр ищется делением пополам */
function bezierAt([x1, y1, x2, y2]: readonly number[], x: number): number {
  const at = (a: number, b: number, t: number) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
  let lo = 0, hi = 1;
  for (let i = 0; i < 20; i++) {
    const t = (lo + hi) / 2;
    if (at(x1, x2, t) < x) lo = t; else hi = t;
  }
  return at(y1, y2, (lo + hi) / 2);
}

/**
 * Плавная кривая ступеньками. steps() разгон и торможение не сохраняет, а linear() с двумя процентами на точку даёт
 * ровную площадку: на ней значение стоит. Первая и последняя площадки - начало и конец кривой, при alternate важно
 * доходить до края. Соседние площадки с одним значением склеиваются: у пологих концов кривой шагов меньше
 */
function stepCurve(curve: readonly number[], n: number): string {
  const points: string[] = [];
  let start = 0, y = fix(bezierAt(curve, 0), 3);
  for (let i = 1; i <= n; i++) {
    const next = i < n ? fix(bezierAt(curve, i / (n - 1)), 3) : '';
    if (next === y) continue;
    points.push(`${y} ${fix((start * 100) / n, 2)}% ${fix((i * 100) / n, 2)}%`);
    start = i;
    y = next;
  }
  return `linear(${points.join(', ')})`;
}

/**
 * Длительность и кривая постоянной анимации. parts - на сколько равных отрезков делят анимацию ключевые кадры: кривая
 * действует на каждый отрезок отдельно. Если кадры стоят неравномерно, parts считается по отрезку, на котором значение
 * меняется
 */
export function frames(sec: number, curve: Curve = 'linear', parts = 1, fps = FPS) {
  const eased = curve !== 'linear';
  const n = Math.max(eased ? 2 : 1, Math.round((sec * fps) / parts));
  const total = (n * parts) / fps;
  const timing = eased ? stepCurve(typeof curve === 'string' ? BEZIER[curve] : curve, n) : `steps(${n})`;
  return { sec: total, dur: `${fix(total, 4)}s`, timing };
}

/** Для сокращённой записи: animation: kt-spin ${pace(2.8)} infinite */
export const pace = (sec: number, curve?: Curve, parts?: number, fps?: number) => {
  const f = frames(sec, curve, parts, fps);
  return `${f.dur} ${f.timing}`;
};

/** Сменить скорость уже идущей анимации: имя то же, поэтому она не перезапускается и остаётся на той же сетке кадров */
export const paceDecl = (sec: number, curve?: Curve, parts?: number, fps?: number) => {
  const f = frames(sec, curve, parts, fps);
  return `animation-duration: ${f.dur}; animation-timing-function: ${f.timing}`;
};

/** Половина длительности, кратная кадру: сдвиг второй анимации той же длины */
export const halfOf = (sec: number, curve?: Curve, parts?: number, fps = FPS) => `${fix(Math.round((frames(sec, curve, parts, fps).sec / 2) * fps) / fps, 4)}s`;
