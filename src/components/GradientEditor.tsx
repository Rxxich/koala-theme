// Редактор градиента: полоса с точками-цветами. Перетащите точку, чтобы сдвинуть,
// щёлкните по полосе, чтобы добавить новую, выберите точку, чтобы поменять цвет.

import { useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { mix } from '../lib/color';
import type { GradientStop } from '../lib/types';
import { ColorField } from './ColorPicker';
import { Button, Slider } from './ui';

interface Props {
  stops: GradientStop[];
  onChange: (stops: GradientStop[]) => void;
  swatches?: string[];
}

export function GradientEditor({ stops, onChange, swatches }: Props) {
  const bar = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState(0);
  const sorted = [...stops].map((s, i) => ({ ...s, i })).sort((a, b) => a.pos - b.pos);
  const css = `linear-gradient(90deg, ${sorted.map((s) => `${s.color} ${s.pos}%`).join(', ')})`;
  const cur = stops[Math.min(sel, stops.length - 1)];

  const posFrom = (clientX: number) => {
    const r = bar.current!.getBoundingClientRect();
    return Math.round(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
  };

  const drag = (i: number) => (e: React.PointerEvent) => {
    e.stopPropagation();
    setSel(i);
    const move = (ev: PointerEvent) => onChange(stops.map((s, j) => (j === i ? { ...s, pos: posFrom(ev.clientX) } : s)));
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const add = (e: React.PointerEvent) => {
    const pos = posFrom(e.clientX);
    const left = [...sorted].reverse().find((s) => s.pos <= pos) ?? sorted[0];
    const right = sorted.find((s) => s.pos >= pos) ?? sorted[sorted.length - 1];
    const t = right.pos === left.pos ? 0.5 : (pos - left.pos) / (right.pos - left.pos);
    const next = [...stops, { color: mix(left.color, right.color, t), pos }];
    onChange(next);
    setSel(next.length - 1);
  };

  return (
    <div className="gred">
      <div className="gred-bar checker" ref={bar} onPointerDown={add} title="Щёлкните, чтобы добавить цвет">
        <div style={{ background: css }} />
        {stops.map((s, i) => (
          <button key={i} type="button" className={`gred-stop${i === sel ? ' active' : ''}`} style={{ left: `${s.pos}%`, background: s.color }}
            onPointerDown={drag(i)} aria-label={`Точка ${i + 1}: ${s.color}, ${s.pos}%`} />
        ))}
      </div>
      {cur && (
        <div className="gred-edit">
          <ColorField value={cur.color} onChange={(c) => onChange(stops.map((s, j) => (j === sel ? { ...s, color: c } : s)))} swatches={swatches} label="Цвет точки" />
          <div className="gred-pos">
            <Slider label="Позиция" value={cur.pos} min={0} max={100} unit="%" onChange={(v) => onChange(stops.map((s, j) => (j === sel ? { ...s, pos: v } : s)))} />
          </div>
          <Button size="icon" variant="ghost" disabled={stops.length <= 2} title="Удалить точку"
            onClick={() => { onChange(stops.filter((_, j) => j !== sel)); setSel(0); }}><Trash2 size={15} /></Button>
        </div>
      )}
    </div>
  );
}
