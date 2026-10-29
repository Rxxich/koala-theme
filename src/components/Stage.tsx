// Сцена: "рабочий стол" с окном Koala Clash. Внутри iframe - макет клиента (public/preview),
// в который вставляется CSS темы. Панель сверху управляет состоянием макета.

import { useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Moon, Sun, Power, Loader, AlertTriangle, PanelLeft, MessageSquare, MousePointer2, Bell, SquareStack,
  RotateCcw, Maximize2, ScanLine, Palette as PaletteIcon, X, Download, Wand2, Home, Users, Server, Cable, ListChecks, ScrollText, Settings
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { generateCSS } from '../lib/generator';
import { mix, rgba } from '../lib/color';
import { useStore, type PowerState, type PreviewPage } from '../state/store';
import { galleryById } from '../data/themes';
import { presetById } from '../data/presets';
import { PaletteWindow } from './PaletteWindow';
import { cx } from './ui';
import { downloadText } from '../lib/share';
import { readLocal, writeLocal } from '../lib/storage';

interface KTApi {
  setCSS: (css: string) => void;
  setDark: (d: boolean) => void;
  go: (p: string) => void;
  setPower: (s: string) => void;
  setSidebar: (v: boolean) => void;
  replay: () => void;
  toast: (t: string, type?: string) => void;
  dialog: (k?: string) => void;
  closeDialog: () => void;
  menu: () => void;
  tooltip: () => void;
  highlight: (sel: string | null) => void;
  getState: () => { page: PreviewPage; dark: boolean; power: PowerState; sidebar: boolean };
  listen: (fn: (e: { type: string; value: unknown }) => void) => () => void;
}

const SIZES = [
  { id: '800x700', w: 800, h: 700, label: '800 × 700', note: 'по умолчанию' },
  { id: '800x600', w: 800, h: 600, label: '800 × 600', note: 'минимум' },
  { id: '960x720', w: 960, h: 720, label: '960 × 720' },
  { id: '1120x760', w: 1120, h: 760, label: '1120 × 760' }
];

const PAGES: { id: PreviewPage; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Главная', icon: Home },
  { id: 'profiles', label: 'Профили', icon: Users },
  { id: 'proxies', label: 'Прокси', icon: Server },
  { id: 'connections', label: 'Подключения', icon: Cable },
  { id: 'rules', label: 'Правила', icon: ListChecks },
  { id: 'logs', label: 'Логи', icon: ScrollText },
  { id: 'settings', label: 'Настройки', icon: Settings }
];

const POWER: { id: PowerState; label: string; icon: typeof Power }[] = [
  { id: 'off', label: 'Отключено', icon: Power },
  { id: 'loading', label: 'Подключение', icon: Loader },
  { id: 'on', label: 'Подключено', icon: Power },
  { id: 'error', label: 'Ошибка ядра', icon: AlertTriangle }
];

const themeCache = new Map<string, string>();

export function Stage() {
  const config = useStore((s) => s.config);
  const { dark, page, power, sidebar, viewing, paletteOpen, tab } = useStore(useShallow((s) => ({
    dark: s.dark, page: s.page, power: s.power, sidebar: s.sidebar, viewing: s.viewing, paletteOpen: s.paletteOpen, tab: s.tab
  })));
  const set = useStore((s) => s.set);
  const replace = useStore((s) => s.replace);
  const frame = useRef<HTMLIFrameElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const [kt, setKt] = useState<KTApi | null>(null);
  const [size, setSize] = useState(() => readLocal('koala-theme:size') || '800x700');
  const [fit, setFit] = useState(true);
  const [scale, setScale] = useState(1);
  const [viewCss, setViewCss] = useState<string | null>(null);
  const win = SIZES.find((s) => s.id === size) ?? SIZES[0];

  // CSS темы конструктора. useDeferredValue - чтобы ползунки не тормозили на тяжёлых темах
  const deferred = useDeferredValue(config);
  const css = useMemo(() => generateCSS(deferred, { embedConfig: false }), [deferred]);

  // Готовая тема из галереи
  useEffect(() => {
    if (!viewing) { setViewCss(null); return; }
    const t = galleryById(viewing);
    if (!t) return;
    if (themeCache.has(t.file)) { setViewCss(themeCache.get(t.file)!); return; }
    fetch(t.file).then((r) => r.text()).then((text) => { themeCache.set(t.file, text); setViewCss(text); }).catch(() => setViewCss(''));
  }, [viewing]);

  // Подключение к макету
  const onLoad = () => {
    const w = frame.current?.contentWindow as (Window & { KT?: KTApi }) | null;
    if (!w?.KT) return;
    setKt(w.KT);
  };
  useEffect(() => {
    if (!kt) return;
    return kt.listen((e) => {
      const s = useStore.getState();
      if (e.type === 'dark' && e.value !== s.dark) s.set({ dark: e.value as boolean });
      if (e.type === 'page' && e.value !== s.page) s.set({ page: e.value as PreviewPage });
      if (e.type === 'power' && e.value !== s.power) s.set({ power: e.value as PowerState });
      if (e.type === 'sidebar' && e.value !== s.sidebar) s.set({ sidebar: e.value as boolean });
    });
  }, [kt]);

  useEffect(() => { kt?.setCSS(viewing ? viewCss ?? '' : css); }, [kt, css, viewing, viewCss]);
  useEffect(() => { if (kt && kt.getState().dark !== dark) kt.setDark(dark); }, [kt, dark]);
  useEffect(() => { if (kt && kt.getState().page !== page) kt.go(page); }, [kt, page]);
  useEffect(() => { if (kt && kt.getState().power !== power) kt.setPower(power); }, [kt, power]);
  useEffect(() => { if (kt && kt.getState().sidebar !== sidebar) kt.setSidebar(sidebar); }, [kt, sidebar]);

  // Тема с одной палитрой: переключаем превью в её режим, чтобы сразу было видно результат
  useEffect(() => {
    if (config.mode === 'dark' && !dark) set({ dark: true });
    if (config.mode === 'light' && dark) set({ dark: false });
  }, [config.mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Масштаб окна под размер сцены: «Вписать» - не крупнее 100%, «Увеличить» - на всю сцену, но не мельче
  // 100% (на тесном экране - натуральная величина с прокруткой). 48 - поля сцены, 14 - отступ до подписи
  useLayoutEffect(() => {
    const el = area.current;
    if (!el) return;
    const calc = () => {
      const r = el.getBoundingClientRect();
      const cap = (el.querySelector<HTMLElement>('.stage-caption')?.offsetHeight ?? 16) + 14;
      // Вниз до процента - без лишних долей пикселя, из-за которых появлялась прокрутка
      const s = Math.floor(Math.min((r.width - 48) / win.w, (r.height - 48 - cap) / win.h) * 100) / 100;
      setScale(fit ? Math.max(0.3, Math.min(1, s)) : Math.max(1, s));
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    return () => ro.disconnect();
  }, [win.w, win.h, fit]);

  // Окно сжимаем через zoom, а не transform: под transform: scale стекло (backdrop-filter) макета
  // оставляет полосы при частичной перерисовке. Chromium передаёт zoom внутрь iframe как масштаб
  // экрана, и макет остаётся прежней ширины - брейкпоинты не сдвигаются. Если браузер так не умеет,
  // ширина внутри iframe уменьшится - тогда возвращаемся к transform
  const [zoomOk, setZoomOk] = useState(true);
  useEffect(() => {
    if (!kt || !zoomOk || scale === 1) return;
    const id = setTimeout(() => {
      const w = frame.current?.contentWindow;
      if (w && Math.abs(w.innerWidth - win.w) > 1) setZoomOk(false);
    }, 250);
    return () => clearTimeout(id);
  }, [kt, zoomOk, scale, win.w]);

  const pal = config.palette[dark ? 'dark' : 'light'];
  const glow = viewing ? '#6b7cff' : pal.primary;
  const glow2 = viewing ? '#7cf0c5' : pal.powerOnStart;
  const viewTheme = viewing ? galleryById(viewing) : null;
  const modeLocked = !viewing && config.mode !== 'both';

  return (
    <div className={cx('stage', !dark && 'stage-light')} style={{
      '--glow-a': rgba(glow, dark ? 0.22 : 0.18), '--glow-b': rgba(glow2, dark ? 0.16 : 0.2),
      '--desk': dark ? mix('#07080c', glow, 0.04) : mix('#e9ecf2', glow, 0.05)
    } as React.CSSProperties}>
      <div className="stage-toolbar">
        <div className="tb-group" role="group" aria-label="Тема клиента">
          <button className={cx('tb-btn', dark && 'active')} disabled={modeLocked && config.mode === 'light'} onClick={() => set({ dark: true })} title="Тёмная тема клиента"><Moon size={15} /></button>
          <button className={cx('tb-btn', !dark && 'active')} disabled={modeLocked && config.mode === 'dark'} onClick={() => set({ dark: false })} title="Светлая тема клиента"><Sun size={15} /></button>
        </div>
        <div className="tb-group tb-pages" role="group" aria-label="Страница">
          {PAGES.map((p) => (
            <button key={p.id} className={cx('tb-btn', page === p.id && 'active')} onClick={() => set({ page: p.id })} title={p.label}>
              <p.icon size={15} /><span className="tb-label">{p.label}</span>
            </button>
          ))}
        </div>
        <div className="tb-group" role="group" aria-label="Подключение">
          {POWER.map((p) => (
            <button key={p.id} className={cx('tb-btn', `pw-${p.id}`, power === p.id && 'active')} onClick={() => set({ power: p.id, page: 'home' })} title={p.label}>
              <p.icon size={15} className={p.id === 'loading' && power === 'loading' ? 'spin' : ''} />
            </button>
          ))}
        </div>
        <div className="tb-group" role="group" aria-label="Элементы интерфейса">
          <button className={cx('tb-btn', sidebar && 'active')} onClick={() => set({ sidebar: !sidebar })} title="Развернуть боковую панель"><PanelLeft size={15} /></button>
          <button className="tb-btn" onClick={() => kt?.menu()} title="Показать меню"><SquareStack size={15} /></button>
          <button className="tb-btn" onClick={() => kt?.tooltip()} title="Показать подсказку"><MousePointer2 size={15} /></button>
          <button className="tb-btn" onClick={() => kt?.toast('Профиль обновлён', 'success')} title="Показать уведомление"><Bell size={15} /></button>
          <button className="tb-btn" onClick={() => kt?.dialog('import')} title="Показать диалог"><MessageSquare size={15} /></button>
          <button className="tb-btn" onClick={() => kt?.replay()} title="Проиграть анимации появления ещё раз"><RotateCcw size={15} /></button>
        </div>
        <div className="tb-spacer" />
        <div className="tb-group" role="group" aria-label="Окно">
          <select className="tb-select" value={size} onChange={(e) => { setSize(e.target.value); writeLocal('koala-theme:size', e.target.value); }} title="Размер окна">
            {SIZES.map((s) => <option key={s.id} value={s.id}>{s.label}{s.note ? ` · ${s.note}` : ''}</option>)}
          </select>
          <button className={cx('tb-btn', fit && 'active')} onClick={() => setFit(!fit)} title={fit ? 'Увеличить на всю сцену' : 'Вписать в экран'}>
            {fit ? <Maximize2 size={15} /> : <ScanLine size={15} />}
          </button>
          {tab === 'editor' && !viewing && (
            <button className={cx('tb-btn tb-palette', paletteOpen && 'active')} onClick={() => set({ paletteOpen: !paletteOpen })} title="Окно палитры">
              <PaletteIcon size={15} /><span className="tb-label">Палитра</span>
            </button>
          )}
        </div>
      </div>

      {viewTheme && (
        <div className="view-banner">
          <span className="view-dot" />
          <span>Просмотр готовой темы <b>{viewTheme.name}</b></span>
          <button className="btn btn-soft btn-sm" onClick={() => viewCss && downloadText(viewTheme.file.split('/').pop()!, viewCss)}><Download size={14} />Скачать</button>
          <button className="btn btn-soft btn-sm" onClick={() => { const p = presetById(viewTheme.preset); if (p) { replace(p.build(), `Открыт пресет «${p.name}»`); set({ tab: 'editor' }); } }}><Wand2 size={14} />Похожая в конструкторе</button>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => set({ viewing: null })} title="Вернуться к своей теме"><X size={15} /></button>
        </div>
      )}

      <div className={cx('stage-area', !fit && 'stage-scroll')} ref={area}>
        <div className="window-holder" style={{ width: win.w * scale, height: win.h * scale }}>
          <div className="app-window" style={{ width: win.w, height: win.h, ...(zoomOk ? { zoom: scale } : { transform: `scale(${scale})` }) }}>
            <iframe ref={frame} src="preview/index.html" title="Превью Koala Clash" onLoad={onLoad} />
          </div>
        </div>
        <div className="stage-caption">
          {viewTheme ? viewTheme.name : config.name || 'Моя тема'} · {dark ? 'тёмная' : 'светлая'} · {Math.round(scale * 100)}%
        </div>
      </div>

      {paletteOpen && tab === 'editor' && !viewing && <PaletteWindow onClose={() => set({ paletteOpen: false })} />}
    </div>
  );
}
