// Галерея: готовые темы (CSS-файлы) и шаблоны конструктора.

import { useMemo } from 'react';
import { Eye, Download, Wand2, Sparkles } from 'lucide-react';
import { useStore } from '../state/store';
import { GALLERY, type GalleryTheme } from '../data/themes';
import { PRESETS } from '../data/presets';
import { bgPreview } from '../lib/generator';
import { downloadText } from '../lib/share';
import type { ThemeConfig } from '../lib/types';
import { Button, cx } from './ui';

interface ThumbColors { bg: string; card: string; primary: string; a: string; b: string; fg?: string; stroke?: string }

/** Миниатюра окна клиента в цветах темы */
export function Thumb({ c, background, radius = 6 }: { c: ThumbColors; background?: string; radius?: number }) {
  return (
    <span className="thumb" style={{
      background: background ?? c.bg, '--c': c.card, '--p': c.primary, '--a': c.a, '--b': c.b,
      '--fg': c.fg ?? 'rgba(127,127,127,.6)', '--st': c.stroke ?? 'rgba(127,127,127,.25)', '--r': `${radius}px`
    } as React.CSSProperties}>
      <span className="th-side"><i /><i /><i /><i /></span>
      <span className="th-main">
        <span className="th-tile" />
        <span className="th-tile th-tile-s" />
        <span className="th-orb" />
        <span className="th-pill" />
      </span>
    </span>
  );
}

const swatchColors = (s: string[]): ThumbColors => ({ bg: s[0], card: s[1], primary: s[2], a: s[3], b: s[4] });

function configThumb(cfg: ThemeConfig, scheme: 'light' | 'dark') {
  const p = cfg.palette[scheme];
  const bg = cfg.background[scheme];
  return { c: { bg: p.background, card: p.card, primary: p.primary, a: p.powerOnStart, b: p.powerOnEnd, fg: p.mutedForeground, stroke: p.stroke }, background: bgPreview(bg, p.background), radius: Math.round(cfg.surfaces.radius * 8) };
}

function GalleryCard({ t }: { t: GalleryTheme }) {
  const viewing = useStore((s) => s.viewing);
  const set = useStore((s) => s.set);
  const replace = useStore((s) => s.replace);
  const notify = useStore((s) => s.notify);
  const download = async () => {
    try {
      const css = await (await fetch(t.file)).text();
      downloadText(t.file.split('/').pop()!, css);
    } catch { notify('Не удалось скачать файл'); }
  };
  const preset = PRESETS.find((p) => p.id === t.preset);
  return (
    <article className={cx('gcard', viewing === t.id && 'active')}>
      <button type="button" className="gcard-thumbs" onClick={() => set({ viewing: t.id, tab: 'gallery' })} title="Смотреть в окне клиента">
        <Thumb c={swatchColors(t.swatches.dark)} />
        {t.swatches.light && <Thumb c={swatchColors(t.swatches.light)} />}
        <span className="gcard-eye"><Eye size={16} />Смотреть</span>
      </button>
      <div className="gcard-body">
        <div className="gcard-title">
          <h3>{t.name}</h3>
          <span className="badge">{t.mode === 'dark' ? 'Тёмная' : 'Светлая + тёмная'}</span>
        </div>
        <p>{t.description}</p>
        <div className="feature-chips">{t.features.map((f) => <span key={f}>{f}</span>)}</div>
        <div className="btn-row">
          <Button size="sm" variant={viewing === t.id ? 'primary' : 'soft'} icon={<Eye size={14} />} onClick={() => set({ viewing: viewing === t.id ? null : t.id })}>{viewing === t.id ? 'Открыта' : 'Смотреть'}</Button>
          <Button size="sm" variant="soft" icon={<Download size={14} />} onClick={download}>Скачать</Button>
          {preset && <Button size="sm" variant="ghost" icon={<Wand2 size={14} />} title={`Открыть в конструкторе пресет «${preset.name}» - похожий по цветам и настроению`}
            onClick={() => { replace(preset.build(), `Открыт пресет «${preset.name}». Ctrl+Z - вернуть свою тему`); set({ tab: 'editor', section: 'palette' }); }}>В конструктор</Button>}
        </div>
      </div>
    </article>
  );
}

export function Gallery() {
  const replace = useStore((s) => s.replace);
  const set = useStore((s) => s.set);
  const dark = useStore((s) => s.dark);
  const built = useMemo(() => PRESETS.map((p) => ({ p, cfg: p.build() })), []);

  return (
    <div className="gallery">
      <header className="panel-head">
        <h2>Галерея</h2>
        <p>Готовые темы открываются в окне клиента как есть - кликайте по интерфейсу и смотрите. Шаблоны конструктора можно сразу менять под себя.</p>
      </header>

      <h3 className="gallery-sub"><Sparkles size={14} />Готовые темы</h3>
      <div className="gallery-list">{GALLERY.map((t) => <GalleryCard key={t.id} t={t} />)}</div>

      <h3 className="gallery-sub"><Wand2 size={14} />Шаблоны конструктора</h3>
      <p className="note">Собраны из настроек конструктора: откройте, поменяйте что угодно и скачайте как свою тему.</p>
      <div className="preset-grid">
        {built.map(({ p, cfg }) => {
          const scheme = cfg.mode === 'light' ? 'light' : cfg.mode === 'dark' ? 'dark' : dark ? 'dark' : 'light';
          const th = configThumb(cfg, scheme);
          return (
            <button key={p.id} type="button" className="pcard" onClick={() => { replace(cfg, `Открыт шаблон «${p.name}». Ctrl+Z - вернуть свою тему`); set({ tab: 'editor', section: 'palette' }); }}>
              <Thumb c={th.c} background={th.background} radius={th.radius} />
              <span className="pcard-name">{p.name}</span>
              <span className="pcard-desc">{p.description}</span>
              <span className="feature-chips">{p.tags.map((tg) => <span key={tg}>{tg}</span>)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
