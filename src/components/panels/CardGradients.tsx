// Заготовки градиента карточек плитками - в «Палитре» и в «Поверхностях». Цвета заготовок берутся из
// палитры, поэтому плитки показывают их в цветах текущей схемы.

import { useEditScheme, useStore } from '../../state/store';
import { rgba } from '../../lib/color';
import { cardGradientCss, cardPreview } from '../../lib/generator';
import { CARD_GRADIENTS, applyCardGradient } from '../../lib/defaults';
import type { CardGradientPreset, ThemeConfig } from '../../lib/types';
import { Choice } from '../ui';
import { useCfg } from './common';

const PRESETS = Object.keys(CARD_GRADIENTS) as CardGradientPreset[];

/** full - ещё «Сплошной цвет» и «Лёгкий» (в «Поверхностях» они в переключателе вида). onOwn - щелчок по плитке своего градиента */
export function CardGradientTiles({ full, onOwn }: { full?: boolean; onOwn?: () => void }) {
  const { config, update } = useCfg();
  const notify = useStore((st) => st.notify);
  const scheme = useEditScheme();
  const s = config.surfaces, p = config.palette[scheme];
  const on = s.custom && s.gradient;
  const own = on && s.gradientKind !== 'soft';
  // Плитки - в непрозрачности карточек, но не бледнее 70%, иначе заготовки не различить
  const alpha = Math.max(70, s.fill === 'solid' ? 100 : s.opacity);
  // Градиент - это заливка: у карточек «Контур» и «Без фона» её нет, поэтому они становятся стеклом
  const pick = (fn: (c: ThemeConfig) => void) => {
    const refill = s.fill === 'outline' || s.fill === 'transparent';
    update((c) => {
      fn(c);
      c.surfaces.custom = true;
      if (refill) { c.surfaces.fill = 'glass'; c.surfaces.liquid = false; }
    });
    if (refill) notify('Карточки стали стеклянными: у «Контура» и «Без фона» нет заливки под градиент');
  };
  const tile = (key: string, label: string, bg: string, active: boolean, onClick: () => void, title?: string) => (
    <Choice key={key} active={active} onClick={onClick} title={title}>
      <span className="cg-back" style={{ background: p.background }}>
        <span className="mini-card" style={{ background: bg, borderColor: p.stroke }}><i style={{ background: p.foreground }} /><b style={{ background: p.mutedForeground }} /></span>
      </span>
      <span>{label}</span>
    </Choice>
  );
  return (
    <div className="choice-grid">
      {full && tile('off', 'Сплошной цвет', rgba(p.card, alpha / 100), !on, () => update((c) => { c.surfaces.gradient = false; }))}
      {full && tile('soft', 'Лёгкий', cardPreview({ ...s, custom: true, gradient: true, gradientKind: 'soft' }, p, scheme, alpha), on && s.gradientKind === 'soft',
        () => pick((c) => { c.surfaces.gradient = true; c.surfaces.gradientKind = 'soft'; }), 'Чуть светлее сверху - объём без теней')}
      {PRESETS.map((id) => tile(id, CARD_GRADIENTS[id].label, cardGradientCss(CARD_GRADIENTS[id].shape, CARD_GRADIENTS[id].stops(p), alpha),
        own && s.gradientPreset === id, () => pick((c) => applyCardGradient(c.surfaces, id)), 'Цвета - из палитры, для светлой и тёмной схемы сразу'))}
      {own && !s.gradientPreset && tile('own', 'Свой', cardPreview(s, p, scheme, alpha), true, () => onOwn?.(), 'Свои точки цвета: от палитры не зависят')}
    </div>
  );
}
