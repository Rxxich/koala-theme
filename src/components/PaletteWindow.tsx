// Окно "Палитра": плавающее окно поверх превью. Слева - роли цветов, справа - значения
// для светлой и тёмной темы клиента. Сверху - живые образцы, снизу - проверка контраста.

import { Fragment, useEffect, useRef, useState } from 'react';
import { Copy, ClipboardPaste, Dices, Wand2, Minus, X, AlertTriangle, GripHorizontal } from 'lucide-react';
import { useStore } from '../state/store';
import { ROLES, ROLE_GROUPS, SWATCHES, contrastIssues, generatePalettes, rederive } from '../lib/palette';
import { PALETTES, swatchStrip } from '../data/palettes';
import { normalize } from '../lib/color';
import { copyText } from '../lib/share';
import type { Mode, Palette, Scheme } from '../lib/types';
import { ColorField } from './ColorPicker';
import { Segmented, Tip, cx } from './ui';
import { readLocal, writeLocal } from '../lib/storage';

const POS_KEY = 'koala-theme:palette-pos';
const SCHEMES: { scheme: Scheme; label: string }[] = [{ scheme: 'light', label: 'Светлая' }, { scheme: 'dark', label: 'Тёмная' }];

function Sample({ p }: { p: Palette }) {
  return (
    <div className="pw-sample" style={{ background: p.background, borderColor: p.stroke }}>
      <span className="pw-chip" style={{ background: p.card, color: p.foreground, borderColor: p.stroke }}>Аа</span>
      <span className="pw-chip pw-chip-accent" style={{ background: p.primary, color: p.primaryForeground }}>Кнопка</span>
      <span className="pw-orb" style={{ background: `radial-gradient(circle at 30% 40%, ${p.powerOnStart}, ${p.powerOnEnd})`, borderColor: p.powerOnStroke }} />
      <span className="pw-muted" style={{ color: p.mutedForeground }}>подпись</span>
    </div>
  );
}

export function PaletteWindow({ onClose }: { onClose: () => void }) {
  const palette = useStore((s) => s.config.palette);
  const mode = useStore((s) => s.config.mode);
  const update = useStore((s) => s.update);
  const notify = useStore((s) => s.notify);
  const ref = useRef<HTMLDivElement>(null);
  const [min, setMin] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(() => {
    try { return JSON.parse(readLocal(POS_KEY) || 'null'); } catch { return null; }
  });

  // Не даём окну уехать за пределы сцены
  useEffect(() => {
    const el = ref.current, parent = el?.parentElement;
    if (!el || !parent || !pos) return;
    const pr = parent.getBoundingClientRect();
    const x = Math.max(0, Math.min(pr.width - 120, pos.x));
    const y = Math.max(0, Math.min(pr.height - 48, pos.y));
    if (x !== pos.x || y !== pos.y) setPos({ x, y });
  }, [pos]);

  const startDrag = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const el = ref.current!, parent = el.parentElement!;
    const pr = parent.getBoundingClientRect(), r = el.getBoundingClientRect();
    const dx = e.clientX - r.left, dy = e.clientY - r.top;
    const move = (ev: PointerEvent) => setPos({ x: ev.clientX - pr.left - dx, y: ev.clientY - pr.top - dy });
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      setPos((p) => { if (p) writeLocal(POS_KEY, JSON.stringify(p)); return p; });
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const unused: Scheme | null = mode === 'dark' ? 'light' : mode === 'light' ? 'dark' : null;
  const setColor = (scheme: Scheme, key: keyof Palette, hex: string) =>
    update((c) => { c.palette[scheme][key] = hex; }, `pal-${scheme}-${key}`);

  const auto = () => {
    update((c) => {
      for (const s of ['light', 'dark'] as Scheme[]) c.palette[s] = rederive(s, c.palette[s]);
    });
    notify('Остальные цвета подобраны от фона, текста, акцента и кнопки. Ctrl+Z - отменить');
  };
  const random = () => {
    const r = generatePalettes();
    update((c) => { c.palette.light = r.light; c.palette.dark = r.dark; });
    notify(`Палитра «${r.name}», оттенок ${r.hue}°`);
  };
  const copy = async () => {
    const ok = await copyText(JSON.stringify({ light: palette.light, dark: palette.dark }, null, 2));
    notify(ok ? 'Палитра скопирована в буфер обмена' : 'Не удалось скопировать');
  };
  const paste = async () => {
    try {
      const data = JSON.parse(await navigator.clipboard.readText());
      if (!data?.light || !data?.dark) throw new Error('format');
      update((c) => {
        for (const s of ['light', 'dark'] as Scheme[]) {
          for (const r of ROLES) if (typeof data[s][r.key] === 'string') c.palette[s][r.key] = normalize(data[s][r.key], c.palette[s][r.key]);
        }
      });
      notify('Палитра вставлена');
    } catch {
      notify('В буфере обмена нет палитры. Скопируйте её кнопкой "Копировать"');
    }
  };

  let lastGroup = '';
  return (
    <div ref={ref} className={cx('pwin', min && 'pwin-min')} style={pos ? { left: pos.x, top: pos.y, right: 'auto' } : undefined}
      role="dialog" aria-label="Палитра">
      <header className="pwin-head" onPointerDown={startDrag}>
        <GripHorizontal size={14} className="pwin-grip" />
        <h2>Палитра</h2>
        <div className="pwin-actions">
          <button onClick={auto} title="Автоподбор: пересчитать остальные цвета от основных"><Wand2 size={15} /></button>
          <button onClick={random} title="Случайная гармоничная палитра"><Dices size={15} /></button>
          <button onClick={copy} title="Копировать палитру"><Copy size={15} /></button>
          <button onClick={paste} title="Вставить палитру из буфера"><ClipboardPaste size={15} /></button>
          <span className="pwin-sep" />
          <button onClick={() => setMin(!min)} title={min ? 'Развернуть' : 'Свернуть'}><Minus size={15} /></button>
          <button onClick={onClose} title="Закрыть"><X size={15} /></button>
        </div>
      </header>
      {!min && (
        <div className="pwin-body">
          <div className="pwin-mode">
            <span className="row-label">Режимы темы<Tip text="Обе - тема меняется вместе с темой клиента. Только тёмная/светлая - одна палитра всегда, даже если в клиенте выбран другой режим" /></span>
            <Segmented<Mode> size="sm" value={mode} onChange={(v) => update((c) => { c.mode = v; })} options={[
              { value: 'both', label: 'Обе' }, { value: 'dark', label: 'Только тёмная' }, { value: 'light', label: 'Только светлая' }
            ]} />
          </div>
          <div className="pwin-presets" aria-label="Готовые палитры">
            {PALETTES.map((p) => (
              <button key={p.id} className="pp" title={`Палитра «${p.name}»`} onClick={() => update((c) => { c.palette.light = { ...p.light }; c.palette.dark = { ...p.dark }; })}>
                <span className="pp-strip">
                  {swatchStrip(p.light).slice(0, 3).map((c, i) => <i key={'l' + i} style={{ background: c }} />)}
                  {swatchStrip(p.dark).slice(0, 3).map((c, i) => <i key={'d' + i} style={{ background: c }} />)}
                </span>
                <span>{p.name}</span>
              </button>
            ))}
          </div>

          <div className="pw-grid">
            <div className="pw-corner" />
            {SCHEMES.map(({ scheme, label }) => (
              <div key={scheme} className={cx('pw-cell pw-headcell', unused === scheme && 'pw-unused')}>
                <Sample p={palette[scheme]} />
                <span className="pw-scheme">{label}{unused === scheme && <em>не используется</em>}</span>
              </div>
            ))}

            {ROLES.map((role) => {
              const head = role.group !== lastGroup ? ROLE_GROUPS[role.group] : null;
              lastGroup = role.group;
              return (
                <Fragment key={role.key}>
                  {head && <div className="pw-group">{head}</div>}
                  <div className="pw-label"><span>{role.label}</span><Tip text={role.help} /></div>
                  {SCHEMES.map(({ scheme }) => (
                    <div key={scheme} className={cx('pw-cell', unused === scheme && 'pw-unused')}>
                      <ColorField
                        value={palette[scheme][role.key]}
                        onChange={(hex) => setColor(scheme, role.key, hex)}
                        swatches={SWATCHES[scheme][role.key] ?? SWATCHES.accent}
                        label={`${role.label}, ${scheme === 'dark' ? 'тёмная' : 'светлая'} тема`}
                      />
                    </div>
                  ))}
                </Fragment>
              );
            })}

            <div className="pw-corner" />
            {SCHEMES.map(({ scheme }) => {
              const issues = unused === scheme ? [] : contrastIssues(palette[scheme]);
              return (
                <div key={scheme} className="pw-cell pw-issues">
                  {issues.length === 0
                    ? <span className="pw-ok">{unused === scheme ? '' : 'Контраст в порядке'}</span>
                    : issues.map((i) => <span key={i.label} className="pw-warn"><AlertTriangle size={12} />{i.label} {i.ratio.toFixed(1)}:1 - плохо читается</span>)}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
