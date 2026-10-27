import { useEffect, useState } from 'react';
import { Palette, Image, Layers, SunDim, Power, Sparkles, Type, Flag, SlidersHorizontal, Code2, Wand2 } from 'lucide-react';
import { useStore, type Section } from './state/store';
import { decodeShare, importText, readFile } from './lib/share';
import { TopBar } from './components/TopBar';
import { Stage } from './components/Stage';
import { Gallery } from './components/Gallery';
import { Install } from './components/Install';
import { ExportModal } from './components/ExportModal';
import { PalettePanel } from './components/panels/PalettePanel';
import { BackgroundPanel } from './components/panels/BackgroundPanel';
import { SurfacesPanel, ShadowsPanel } from './components/panels/SurfacesPanel';
import { PowerPanel, MotionPanel } from './components/panels/PowerPanel';
import { FontsPanel, FlagsPanel } from './components/panels/FontsPanel';
import { ExtrasPanel, CodePanel } from './components/panels/ExtrasPanel';
import { FunPanel } from './components/panels/FunPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { cx } from './components/ui';

const SECTIONS: { id: Section; label: string; icon: typeof Palette; panel: () => JSX.Element }[] = [
  { id: 'palette', label: 'Палитра', icon: Palette, panel: PalettePanel },
  { id: 'background', label: 'Фон', icon: Image, panel: BackgroundPanel },
  { id: 'surfaces', label: 'Поверхности', icon: Layers, panel: SurfacesPanel },
  { id: 'shadows', label: 'Тени', icon: SunDim, panel: ShadowsPanel },
  { id: 'power', label: 'Кнопка', icon: Power, panel: PowerPanel },
  { id: 'motion', label: 'Анимации', icon: Sparkles, panel: MotionPanel },
  { id: 'fonts', label: 'Шрифты', icon: Type, panel: FontsPanel },
  { id: 'flags', label: 'Флаги', icon: Flag, panel: FlagsPanel },
  { id: 'fun', label: 'Разное', icon: Wand2, panel: FunPanel },
  { id: 'extras', label: 'Детали', icon: SlidersHorizontal, panel: ExtrasPanel },
  { id: 'code', label: 'Код', icon: Code2, panel: CodePanel }
];

export default function App() {
  const { tab, section, exportOpen, toast, set, undo, redo, replace, notify } = useStore();
  const [dragOver, setDragOver] = useState(false);
  const Panel = SECTIONS.find((s) => s.id === section)?.panel ?? PalettePanel;

  // Тема из ссылки "Поделиться" (#t=...)
  useEffect(() => {
    const m = location.hash.match(/#t=([\w-]+)/);
    if (!m) return;
    decodeShare(m[1]).then((cfg) => {
      if (cfg) replace(cfg, `Открыта тема «${cfg.name}» по ссылке`);
      history.replaceState(null, '', location.pathname + location.search);
    });
  }, [replace]);

  // Горячие клавиши: отмена и повтор
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, select, [contenteditable]')) return;
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyY') { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [undo, redo]);

  // Перетаскивание файла темы в окно
  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    const res = importText(await readFile(f));
    if (res.ok) { replace(res.config, `Тема «${res.config.name}» загружена`); set({ tab: 'editor' }); } else notify(res.error);
  };

  return (
    <div className="app" onDragOver={(e) => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); setDragOver(true); } }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setDragOver(false); }} onDrop={onDrop}>
      <TopBar />
      <main className="workspace">
        {tab === 'editor' && (
          <nav className="rail" aria-label="Разделы конструктора">
            {SECTIONS.map((s) => (
              <button key={s.id} type="button" className={cx('rail-btn', section === s.id && 'active')} onClick={() => set({ section: s.id })} title={s.label}>
                <s.icon size={18} />
                <span>{s.label}</span>
              </button>
            ))}
          </nav>
        )}
        <aside className={cx('panel', tab !== 'editor' && 'panel-wide')} key={tab + section}>
          <ErrorBoundary area="этот раздел">
            {tab === 'editor' && <Panel />}
            {tab === 'gallery' && <Gallery />}
            {tab === 'install' && <Install />}
          </ErrorBoundary>
        </aside>
        <ErrorBoundary area="превью темы"><Stage /></ErrorBoundary>
      </main>
      {exportOpen && <ErrorBoundary area="экспорт"><ExportModal /></ErrorBoundary>}
      {toast && <div className="site-toast" key={toast.id} role="status">{toast.text}</div>}
      {dragOver && <div className="drop-hint"><span>Отпустите файл темы (.css из koala-theme или .json)</span></div>}
    </div>
  );
}
