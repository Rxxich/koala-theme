// Верхняя панель: логотип, вкладки, отмена/повтор, импорт, поделиться, экспорт.

import { useRef } from 'react';
import { Undo2, Redo2, Upload, Share2, Download, RotateCcw } from 'lucide-react';
import { useStore, type Tab } from '../state/store';
import { defaultConfig } from '../lib/defaults';
import { copyText, importText, readFile, shareUrl } from '../lib/share';
import { Button, cx } from './ui';

const TABS: { id: Tab; label: string }[] = [
  { id: 'editor', label: 'Конструктор' },
  { id: 'gallery', label: 'Галерея' },
  { id: 'install', label: 'Установка' }
];

export function Logo() {
  return (
    <span className="logo">
      <svg viewBox="0 0 64 64" width="26" height="26" aria-hidden>
        <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7cf0c5" /><stop offset="1" stopColor="#7c8cff" /></linearGradient></defs>
        <circle cx="17" cy="22" r="10" fill="url(#lg)" opacity=".55" />
        <circle cx="47" cy="22" r="10" fill="url(#lg)" opacity=".55" />
        <circle cx="32" cy="36" r="16" fill="url(#lg)" />
        <ellipse cx="32" cy="40" rx="5" ry="6.5" fill="#0b0d12" />
      </svg>
      <span className="logo-text">koala<span>·</span>theme</span>
    </span>
  );
}

export function TopBar() {
  const { tab, past, future, undo, redo, set, replace, notify } = useStore();
  const config = useStore((s) => s.config);
  const file = useRef<HTMLInputElement>(null);

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    const res = importText(await readFile(f));
    if (res.ok) { replace(res.config, `Тема «${res.config.name}» загружена`); set({ tab: 'editor' }); }
    else notify(res.error);
    if (file.current) file.current.value = '';
  };

  return (
    <header className="topbar">
      <Logo />
      <nav className="tabs" aria-label="Разделы сайта">
        {TABS.map((t) => (
          <button key={t.id} type="button" className={cx('tab', tab === t.id && 'active')} onClick={() => set({ tab: t.id })}>{t.label}</button>
        ))}
      </nav>
      <div className="topbar-actions">
        <div className="tb-group">
          <button className="tb-btn" disabled={!past.length} onClick={undo} title="Отменить (Ctrl+Z)"><Undo2 size={16} /></button>
          <button className="tb-btn" disabled={!future.length} onClick={redo} title="Повторить (Ctrl+Shift+Z)"><Redo2 size={16} /></button>
          <button className="tb-btn" onClick={() => replace(defaultConfig(), 'Настройки сброшены. Ctrl+Z - вернуть')} title="Начать с чистого листа"><RotateCcw size={16} /></button>
        </div>
        <input ref={file} type="file" accept=".css,.json,text/css,application/json" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        <Button variant="ghost" icon={<Upload size={15} />} onClick={() => file.current?.click()} title="Открыть тему, собранную в koala-theme (.css или .json)"><span className="hide-sm">Импорт</span></Button>
        <Button variant="ghost" icon={<Share2 size={15} />} onClick={async () => notify((await copyText(await shareUrl(config))) ? 'Ссылка на тему скопирована' : 'Не удалось скопировать')} title="Скопировать ссылку с настройками темы"><span className="hide-sm">Поделиться</span></Button>
        <Button variant="primary" icon={<Download size={15} />} onClick={() => set({ exportOpen: true })}>Экспорт</Button>
      </div>
    </header>
  );
}
