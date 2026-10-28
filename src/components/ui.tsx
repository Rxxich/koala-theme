// Базовые элементы управления редактора.

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle } from 'lucide-react';

export function cx(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(' ');
}

/* ---------- Подсказка "?" ---------- */

// Пузырь - в отдельном слое поверх страницы (портал в body, position: fixed): внутри панели его
// обрезала прокрутка панели, как только он заходил на сцену с окном клиента
export function Tip({ text }: { text: string }) {
  const anchor = useRef<HTMLSpanElement>(null);
  const bubble = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);

  useLayoutEffect(() => {
    const a = anchor.current, b = bubble.current;
    if (!open || !a || !b) return;
    const r = a.getBoundingClientRect();
    const left = Math.max(8, Math.min(window.innerWidth - b.offsetWidth - 8, r.left - 12));
    // Над значком, а если сверху не хватает места - под ним
    const above = r.top - b.offsetHeight - 8;
    b.style.left = `${left}px`;
    b.style.top = `${above >= 8 ? above : r.bottom + 8}px`;
    b.classList.toggle('below', above < 8);
  }, [open]);

  return (
    <span ref={anchor} className="tip" tabIndex={0} aria-label={text}
      onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}>
      <HelpCircle size={13} />
      {open && createPortal(<span ref={bubble} className="tip-bubble" role="tooltip">{text}</span>, document.body)}
    </span>
  );
}

/* ---------- Раздел и строка ---------- */

export function Group({ title, hint, children, aside }: { title?: string; hint?: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="group">
      {(title || aside) && (
        <header className="group-head">
          <h3>{title}{hint && <Tip text={hint} />}</h3>
          {aside}
        </header>
      )}
      <div className="group-body">{children}</div>
    </section>
  );
}

export function Row({ label, hint, children, stack }: { label: ReactNode; hint?: string; children: ReactNode; stack?: boolean }) {
  return (
    <div className={cx('row', stack && 'row-stack')}>
      <span className="row-label">{label}{hint && <Tip text={hint} />}</span>
      <div className="row-control">{children}</div>
    </div>
  );
}

/* ---------- Ползунок ---------- */

interface SliderProps {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  hint?: string;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  disabled?: boolean;
}

export function Slider({ label, value, min, max, step = 1, unit = '', hint, onChange, format, disabled }: SliderProps) {
  const p = ((value - min) / (max - min)) * 100;
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <div className={cx('slider', disabled && 'is-disabled')}>
      <div className="slider-top">
        <span className="row-label">{label}{hint && <Tip text={hint} />}</span>
        <label className="slider-value">
          <input
            value={draft ?? (format ? format(value) : String(value))}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={(e) => e.target.select()}
            onBlur={() => {
              if (draft !== null) {
                const n = parseFloat(draft.replace(',', '.'));
                if (!Number.isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
              }
              setDraft(null);
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            disabled={disabled}
            aria-label={typeof label === 'string' ? label : undefined}
          />
          {unit && <span>{unit}</span>}
        </label>
      </div>
      <input
        type="range" className="range" min={min} max={max} step={step} value={value} disabled={disabled}
        style={{ '--p': `${Math.max(0, Math.min(100, p))}%` } as React.CSSProperties}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

/* ---------- Переключатель ---------- */

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label?: ReactNode; hint?: string }) {
  const sw = (
    <button type="button" role="switch" aria-checked={checked} className={cx('switch', checked && 'on')} onClick={() => onChange(!checked)}>
      <span />
    </button>
  );
  if (!label) return sw;
  return (
    <div className="row toggle-row" onClick={(e) => { if ((e.target as HTMLElement).closest('.switch')) return; onChange(!checked); }}>
      <span className="row-label">{label}{hint && <Tip text={hint} />}</span>
      {sw}
    </div>
  );
}

/* ---------- Сегменты ---------- */

export interface Option<T extends string> { value: T; label: ReactNode; title?: string }

export function Segmented<T extends string>({ value, options, onChange, size, wrap }: { value: T; options: Option<T>[]; onChange: (v: T) => void; size?: 'sm'; wrap?: boolean }) {
  return (
    <div className={cx('segmented', size === 'sm' && 'segmented-sm', wrap && 'segmented-wrap')} role="radiogroup">
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} title={o.title}
          className={cx(value === o.value && 'active')} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Карточки выбора (пресеты) ---------- */

export function Choice({ active, onClick, children, title, className }: { active?: boolean; onClick: () => void; children: ReactNode; title?: string; className?: string }) {
  return (
    <button type="button" className={cx('choice', active && 'active', className)} onClick={onClick} title={title} aria-pressed={active}>
      {children}
    </button>
  );
}

/* ---------- Поле ввода ---------- */

export function TextField({ value, onChange, placeholder, mono, onCommit, ...rest }: { value: string; onChange?: (v: string) => void; onCommit?: (v: string) => void; placeholder?: string; mono?: boolean } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'>) {
  return (
    <input className={cx('field', mono && 'mono')} value={value} placeholder={placeholder}
      onChange={(e) => onChange?.(e.target.value)}
      onBlur={(e) => onCommit?.(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter' && onCommit) onCommit((e.target as HTMLInputElement).value); }}
      spellCheck={false} {...rest} />
  );
}

export function Select<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string; group?: string }[]; onChange: (v: T) => void }) {
  const groups = [...new Set(options.map((o) => o.group ?? ''))];
  return (
    <select className="field select" value={value} onChange={(e) => onChange(e.target.value as T)}>
      {groups.map((g) => g
        ? <optgroup key={g} label={g}>{options.filter((o) => o.group === g).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</optgroup>
        : options.filter((o) => !o.group).map((o) => <option key={o.value} value={o.value}>{o.label}</option>))}
    </select>
  );
}

/* ---------- Всплывающее окно у элемента ---------- */

export function Popover({ anchor, open, onClose, children, width = 280, placement = 'bottom' }: { anchor: HTMLElement | null; open: boolean; onClose: () => void; children: ReactNode; width?: number; placement?: 'bottom' | 'right' }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !anchor) return;
    const place = () => {
      const r = anchor.getBoundingClientRect();
      const h = ref.current?.offsetHeight ?? 300;
      let left = placement === 'right' ? r.right + 10 : r.left;
      let top = placement === 'right' ? r.top - 8 : r.bottom + 8;
      left = Math.max(8, Math.min(window.innerWidth - width - 8, left));
      if (top + h > window.innerHeight - 8) top = Math.max(8, (placement === 'right' ? window.innerHeight - h - 8 : r.top - h - 8));
      setPos({ left, top });
    };
    place();
    const ro = new ResizeObserver(place);
    if (ref.current) ro.observe(ref.current);
    window.addEventListener('resize', place);
    return () => { ro.disconnect(); window.removeEventListener('resize', place); };
  }, [open, anchor, width, placement]);

  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => {
      const t = e.target as Node;
      if (ref.current?.contains(t) || anchor?.contains(t)) return;
      onClose();
    };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key); };
  }, [open, anchor, onClose]);

  if (!open) return null;
  return createPortal(
    <div ref={ref} className="popover" style={{ width, left: pos?.left ?? -9999, top: pos?.top ?? -9999 }}>
      {children}
    </div>,
    document.body
  );
}

/* ---------- Кнопки ---------- */

export function Button({ children, variant = 'ghost', size, icon, ...rest }: { variant?: 'primary' | 'ghost' | 'soft' | 'danger'; size?: 'sm' | 'icon'; icon?: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...rest} className={cx('btn', `btn-${variant}`, size && `btn-${size}`, rest.className)}>
      {icon}{children}
    </button>
  );
}
