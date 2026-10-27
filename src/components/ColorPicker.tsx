// Выбор цвета: поле насыщенности/яркости, оттенок, прозрачность, ввод в HEX/RGB/HSL/OKLCH,
// пипетка (EyeDropper API), свотчи и недавние цвета.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Pipette } from 'lucide-react';
import { formatColor, hsvToRgb, parseColor, rgbToHsv, toHex, type HSV } from '../lib/color';
import { Popover, cx } from './ui';
import { readLocal, writeLocal } from '../lib/storage';

const RECENT_KEY = 'koala-theme:recent-colors';
type Format = 'hex' | 'rgb' | 'hsl' | 'oklch';

function loadRecent(): string[] {
  try { return JSON.parse(readLocal(RECENT_KEY) || '[]').slice(0, 12); } catch { return []; }
}
function pushRecent(c: string) {
  try {
    const list = [c, ...loadRecent().filter((x) => x !== c)].slice(0, 12);
    writeLocal(RECENT_KEY, JSON.stringify(list));
  } catch { /* без истории */ }
}

function useDrag(onMove: (x: number, y: number) => void, onEnd?: () => void) {
  return useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const move = (ev: PointerEvent | React.PointerEvent) => {
      onMove(Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (ev.clientY - r.top) / r.height)));
    };
    move(e);
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); onEnd?.(); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }, [onMove, onEnd]);
}

interface PickerProps {
  value: string;
  onChange: (hex: string) => void;
  swatches?: string[];
  alpha?: boolean;
}

export function ColorPicker({ value, onChange, swatches = [], alpha = true }: PickerProps) {
  const parsed = parseColor(value) ?? { r: 0, g: 0, b: 0, a: 1 };
  const [hsv, setHsv] = useState<HSV>(() => rgbToHsv(parsed));
  const [a, setA] = useState(parsed.a);
  const [format, setFormat] = useState<Format>(() => (readLocal('koala-theme:color-format') as Format) || 'hex');
  const [text, setText] = useState<string | null>(null);
  const [recent, setRecent] = useState(loadRecent);
  const lastOut = useRef(value);

  // Синхронизация, если цвет поменяли снаружи (свотч, отмена)
  useEffect(() => {
    if (value === lastOut.current) return;
    const c = parseColor(value);
    if (!c) return;
    const h = rgbToHsv(c);
    setHsv((prev) => ({ ...h, h: h.s === 0 || h.v === 0 ? prev.h : h.h }));
    setA(c.a);
    lastOut.current = value;
  }, [value]);

  const emit = (next: HSV, nextA = a) => {
    const hex = toHex({ ...hsvToRgb(next), a: Math.round(nextA * 1000) / 1000 });
    lastOut.current = hex;
    onChange(hex);
  };
  const commit = () => { pushRecent(lastOut.current); setRecent(loadRecent()); };

  const dragSV = useDrag((x, y) => { const n = { ...hsv, s: x, v: 1 - y }; setHsv(n); emit(n); }, commit);
  const dragH = useDrag((x) => { const n = { ...hsv, h: x * 360 }; setHsv(n); emit(n); }, commit);
  const dragA = useDrag((x) => { setA(x); emit(hsv, x); }, commit);

  const pickScreen = async () => {
    const ED = (window as unknown as { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper;
    if (!ED) return;
    try {
      const res = await new ED().open();
      const c = parseColor(res.sRGBHex);
      if (!c) return;
      const n = rgbToHsv(c);
      setHsv(n); emit(n, a); commit();
    } catch { /* отменили */ }
  };

  const setFromText = (s: string) => {
    const c = parseColor(s);
    if (!c) return false;
    const n = rgbToHsv(c);
    setHsv(n); setA(c.a); emit(n, c.a); commit();
    return true;
  };

  const pure = toHex({ ...hsvToRgb({ h: hsv.h, s: 1, v: 1 }), a: 1 });
  const solid = toHex({ ...hsvToRgb(hsv), a: 1 });
  const current = toHex({ ...hsvToRgb(hsv), a });
  const hasEyeDropper = typeof window !== 'undefined' && 'EyeDropper' in window;

  return (
    <div className="cp">
      <div className="cp-sv" style={{ background: pure }} onPointerDown={dragSV}>
        <div className="cp-sv-white" />
        <div className="cp-sv-black" />
        <span className="cp-thumb" style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: solid }} />
      </div>
      <div className="cp-sliders">
        <div className="cp-preview checker"><span style={{ background: current }} /></div>
        <div className="cp-bars">
          <div className="cp-bar cp-hue" onPointerDown={dragH}><span className="cp-knob" style={{ left: `${(hsv.h / 360) * 100}%` }} /></div>
          {alpha && (
            <div className="cp-bar cp-alpha checker" onPointerDown={dragA}>
              <div style={{ background: `linear-gradient(90deg, transparent, ${solid})` }} />
              <span className="cp-knob" style={{ left: `${a * 100}%` }} />
            </div>
          )}
        </div>
        {hasEyeDropper && <button type="button" className="cp-eye" onClick={pickScreen} title="Пипетка: взять цвет с экрана"><Pipette size={15} /></button>}
      </div>
      <div className="cp-input">
        <div className="cp-formats">
          {(['hex', 'rgb', 'hsl', 'oklch'] as Format[]).map((f) => (
            <button key={f} type="button" className={cx(format === f && 'active')} onClick={() => { setFormat(f); setText(null); writeLocal('koala-theme:color-format', f); }}>{f.toUpperCase()}</button>
          ))}
        </div>
        <input
          className="field mono"
          value={text ?? formatColor(current, format)}
          onChange={(e) => { setText(e.target.value); setFromText(e.target.value); }}
          onBlur={() => setText(null)}
          spellCheck={false}
          aria-label="Значение цвета"
        />
      </div>
      {swatches.length > 0 && (
        <div className="cp-swatches">
          {swatches.map((s) => <button key={s} type="button" className="sw checker" title={s} onClick={() => setFromText(s)}><span style={{ background: s }} /></button>)}
        </div>
      )}
      {recent.length > 0 && (
        <>
          <div className="cp-caption">Недавние</div>
          <div className="cp-swatches">
            {recent.map((s) => <button key={s} type="button" className="sw checker" title={s} onClick={() => setFromText(s)}><span style={{ background: s }} /></button>)}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- Поле цвета: образец + HEX + всплывающий выбор ---------- */

interface FieldProps {
  value: string;
  onChange: (hex: string) => void;
  swatches?: string[];
  alpha?: boolean;
  compact?: boolean;
  label?: string;
  placement?: 'bottom' | 'right';
}

export function ColorField({ value, onChange, swatches, alpha = true, compact, label, placement }: FieldProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);
  return (
    <div className={cx('color-field', compact && 'compact')}>
      <button ref={btn} type="button" className="sw sw-lg checker" onClick={() => setOpen((o) => !o)} aria-label={label ? `Выбрать цвет: ${label}` : 'Выбрать цвет'} title={value}>
        <span style={{ background: value }} />
      </button>
      {!compact && (
        <input
          className="field mono"
          value={draft ?? value}
          onChange={(e) => { setDraft(e.target.value); const c = parseColor(e.target.value); if (c) onChange(toHex(c)); }}
          onBlur={() => setDraft(null)}
          spellCheck={false}
          aria-label={label ?? 'Цвет'}
        />
      )}
      <Popover anchor={btn.current} open={open} onClose={close} width={264} placement={placement}>
        <ColorPicker value={value} onChange={onChange} swatches={swatches} alpha={alpha} />
      </Popover>
    </div>
  );
}
