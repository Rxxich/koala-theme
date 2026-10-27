// Раздел "Палитра": генератор гармоничных палитр, готовые палитры, основные цвета схемы.

import { useState } from 'react';
import { Palette as PaletteIcon, Dices, Wand2, AlertTriangle, CheckCircle2, Sparkles, RotateCcw } from 'lucide-react';
import { useStore, useEditScheme } from '../../state/store';
import { PALETTES, paletteBackground, swatchStrip, type PalettePreset } from '../../data/palettes';
import { APP_PALETTE, makeBackground } from '../../lib/defaults';
import { bgPreview } from '../../lib/generator';
import { HARMONIES, SWATCHES, contrastIssues, generatePalettes, palettesFromColor, rederive, type GenResult, type Harmony } from '../../lib/palette';
import type { Mode, PaletteKey, Scheme } from '../../lib/types';
import { ColorField } from '../ColorPicker';
import { Button, Group, Row, Segmented, Select, Slider, Toggle, cx } from '../ui';
import { PanelHead, SchemeSwitch, useCfg } from './common';

/** Миниатюра фона палитры */
function PaletteBg({ pp, scheme }: { pp: PalettePreset; scheme: Scheme }) {
  return <i style={{ background: bgPreview(paletteBackground(pp, scheme), pp[scheme].background) }} />;
}

const KEY_COLORS: { key: PaletteKey; label: string; hint: string }[] = [
  { key: 'background', label: 'Фон', hint: 'Основной фон окна' },
  { key: 'card', label: 'Карточки', hint: 'Плитки, карточки серверов, панель' },
  { key: 'foreground', label: 'Текст', hint: 'Основной текст' },
  { key: 'primary', label: 'Акцент', hint: 'Кнопки, выбранный сервер, фокус' },
  { key: 'powerOnStart', label: 'Подключено: от', hint: 'Градиент кнопки подключения, переключатели, вкладки' },
  { key: 'powerOnEnd', label: 'Подключено: до', hint: 'Конец градиента кнопки подключения' }
];

export function PalettePanel() {
  const { config, update } = useCfg();
  const scheme = useEditScheme();
  const set = useStore((s) => s.set);
  const notify = useStore((s) => s.notify);
  const paletteOpen = useStore((s) => s.paletteOpen);
  const p = config.palette[scheme];
  const issues = contrastIssues(p);
  const current = PALETTES.find((x) => x.light.primary === config.palette.light.primary && x.dark.primary === config.palette.dark.primary && x.dark.background === config.palette.dark.background);

  // Генератор
  const [harmony, setHarmony] = useState<Harmony | 'auto'>('auto');
  const [seed, setSeed] = useState('#7c8cff');
  const [vivid, setVivid] = useState(100);
  const [tint, setTint] = useState<number | null>(null);
  const [last, setLast] = useState<GenResult | null>(null);
  const apply = (r: GenResult) => {
    update((c) => { c.palette.light = r.light; c.palette.dark = r.dark; });
    setLast(r);
    notify(`Палитра «${r.name}», оттенок ${r.hue}°. Ctrl+Z - вернуть прежнюю`);
  };
  // Готовые палитры: по желанию вместе с фоном к ним. Узор, зерно, виньетка и размытие фона сохраняются
  const [withBg, setWithBg] = useState(false);
  const applyPreset = (pp: PalettePreset) => update((c) => {
    c.palette.light = { ...pp.light }; c.palette.dark = { ...pp.dark };
    if (!withBg) return;
    for (const s of ['light', 'dark'] as Scheme[]) {
      const cur = c.background[s];
      c.background[s] = makeBackground({ pattern: cur.pattern, patternOpacity: cur.patternOpacity, patternScale: cur.patternScale, noise: cur.noise, vignette: cur.vignette,
        blurPages: cur.blurPages, blurPagesAmount: cur.blurPagesAmount, ...paletteBackground(pp, s) });
    }
  });
  const genRandom = () => apply(generatePalettes({ harmony: harmony === 'auto' ? undefined : harmony, vivid: vivid / 100, tint: tint === null ? undefined : tint / 100 }));
  const genFromSeed = () => {
    const r = palettesFromColor(seed, harmony === 'auto' ? undefined : harmony);
    apply(tint === null && vivid === 100 ? r : generatePalettes({ hue: r.hue, harmony: r.harmony, vivid: vivid / 100, tint: tint === null ? undefined : tint / 100 }));
  };

  return (
    <>
      <PanelHead title="Палитра" text="Цвета интерфейса для светлой и тёмной темы клиента. Полный набор из 20 ролей - в окне палитры." />
      <Button variant="primary" className="wide" icon={<PaletteIcon size={16} />} onClick={() => set({ paletteOpen: !paletteOpen })}>
        {paletteOpen ? 'Закрыть окно палитры' : 'Открыть окно палитры'}
      </Button>

      <Group title="Режимы темы" hint="Обе - светлая и тёмная палитры переключаются вместе с темой клиента. Только тёмная/светлая - одна палитра для обоих режимов.">
        <Segmented<Mode> value={config.mode} onChange={(v) => update((c) => { c.mode = v; })} options={[
          { value: 'both', label: 'Обе' }, { value: 'dark', label: 'Только тёмная' }, { value: 'light', label: 'Только светлая' }
        ]} />
      </Group>

      <Group title="Генератор палитры" hint="Создаёт новую палитру по законам цветовой гармонии в пространстве OKLCH. Каждый раз - новые цвета, не из готового списка">
        <Row label="Гармония">
          <Select<Harmony | 'auto'> value={harmony} onChange={setHarmony} options={[{ value: 'auto', label: 'Случайная схема' }, ...HARMONIES.map((h) => ({ value: h.value, label: `${h.label} - ${h.hint.toLowerCase()}` }))]} />
        </Row>
        <Slider label="Сочность" value={vivid} min={40} max={150} step={5} unit="%" onChange={setVivid} />
        <Slider label="Окраска фона" hint="Насколько фон окрашен в основной оттенок: 0 - нейтральный серый. Пока ползунок не тронут, выбирается случайно" value={tint ?? 50} min={0} max={100} unit={tint === null ? '' : '%'} format={(v) => (tint === null ? 'авто' : String(v))} onChange={setTint} />
        <div className="gen-row">
          <Button variant="primary" icon={<Dices size={15} />} onClick={genRandom}>Случайная</Button>
          <span className="gen-or">или от цвета</span>
          <ColorField compact value={seed} onChange={setSeed} label="Опорный цвет" />
          <Button variant="soft" icon={<Sparkles size={15} />} onClick={genFromSeed}>От цвета</Button>
        </div>
        {tint !== null && <button type="button" className="link-btn" onClick={() => setTint(null)}><RotateCcw size={12} />окраска фона: снова случайно</button>}
        {last && (
          <div className="gen-result">
            <span className="strip">{swatchStrip(last.light).map((c, i) => <i key={i} style={{ background: c }} />)}</span>
            <span className="strip">{swatchStrip(last.dark).map((c, i) => <i key={i} style={{ background: c }} />)}</span>
            <small>{last.name} · {last.hue}°</small>
          </div>
        )}
      </Group>

      <Group title="Готовые палитры" hint="Меняют цвета, а с «Вместе с фоном» - ещё и фон обеих схем. Шрифты и эффекты остаются как были">
        <Toggle label="Вместе с фоном" hint="Над палитрой - её фон: светлый и тёмный. Это перетекающие градиенты на CSS: пятна медленно плывут. У десяти палитр фон подобран отдельно, у остальных собран из их цветов"
          checked={withBg} onChange={setWithBg} />
        <div className="palette-grid">
          {PALETTES.map((pp) => (
            <button key={pp.id} type="button" className={cx('palette-card', current?.id === pp.id && 'active')} onClick={() => applyPreset(pp)}>
              <span className="palette-bg">{(['light', 'dark'] as Scheme[]).map((s) => <PaletteBg key={s} pp={pp} scheme={s} />)}</span>
              <span className="palette-strips">
                <span className="strip">{swatchStrip(pp.light).map((c, i) => <i key={i} style={{ background: c }} />)}</span>
                <span className="strip">{swatchStrip(pp.dark).map((c, i) => <i key={i} style={{ background: c }} />)}</span>
              </span>
              <span className="palette-name">{pp.name}</span>
            </button>
          ))}
        </div>
        <div className="btn-row">
          <Button variant="soft" icon={<Wand2 size={15} />} onClick={() => {
            update((c) => { c.palette.light = rederive('light', c.palette.light); c.palette.dark = rederive('dark', c.palette.dark); });
            notify('Остальные цвета подобраны от основных. Ctrl+Z - отменить');
          }}>Автоподбор</Button>
          <Button variant="ghost" icon={<RotateCcw size={15} />} onClick={() => update((c) => { c.palette.light = { ...APP_PALETTE.light }; c.palette.dark = { ...APP_PALETTE.dark }; })}>Как в Koala Clash</Button>
        </div>
      </Group>

      <Group title="Основные цвета">
        <SchemeSwitch />
        {KEY_COLORS.map((k) => (
          <Row key={k.key} label={k.label} hint={k.hint}>
            <ColorField value={p[k.key]} onChange={(hex) => update((c) => { c.palette[scheme][k.key] = hex; }, `pal-${scheme}-${k.key}`)}
              swatches={SWATCHES[scheme][k.key] ?? SWATCHES.accent} label={k.label} />
          </Row>
        ))}
        <div className={cx('contrast-note', issues.length ? 'bad' : 'good')}>
          {issues.length ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
          {issues.length ? <span>{issues.map((i) => `${i.label}: ${i.ratio.toFixed(1)}:1`).join(' · ')} - текст будет плохо читаться</span> : <span>Контраст текста в порядке</span>}
        </div>
      </Group>
    </>
  );
}
