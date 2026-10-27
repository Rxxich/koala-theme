// Окно экспорта: скачать CSS, скопировать, ссылка "Поделиться", файл настроек JSON.

import { useEffect, useMemo, useState } from 'react';
import { Download, Copy, Link2, FileJson, X, Check, Server } from 'lucide-react';
import { useStore } from '../state/store';
import { generateCSS } from '../lib/generator';
import { copyText, downloadText, fileNameFor, shareUrl } from '../lib/share';
import { Button, TextField } from './ui';
import { srrSnippet } from './Install';
import { readLocal, writeLocal } from '../lib/storage';

export function ExportModal() {
  const config = useStore((s) => s.config);
  const update = useStore((s) => s.update);
  const set = useStore((s) => s.set);
  const notify = useStore((s) => s.notify);
  const css = useMemo(() => generateCSS(config), [config]);
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [cssUrl, setCssUrl] = useState(() => readLocal('koala-theme:css-url') || '');
  const file = fileNameFor(config.name);

  useEffect(() => { shareUrl(config).then(setLink); }, [config]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') set({ exportOpen: false }); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [set]);

  const flash = (id: string) => { setCopied(id); setTimeout(() => setCopied(null), 1600); };

  return (
    <div className="modal-back" onMouseDown={(e) => { if (e.target === e.currentTarget) set({ exportOpen: false }); }}>
      <div className="modal" role="dialog" aria-label="Экспорт темы">
        <header className="modal-head">
          <h2>Экспорт темы</h2>
          <button className="icon-btn" onClick={() => set({ exportOpen: false })} aria-label="Закрыть"><X size={16} /></button>
        </header>
        <div className="modal-body">
          <label className="field-label">Название темы<span>так она будет называться в списке тем клиента</span></label>
          <TextField value={config.name} onChange={(v) => update((c) => { c.name = v; }, 'name')} maxLength={60} />

          <div className="export-main">
            <div className="export-file">
              <span className="file-ico">CSS</span>
              <div>
                <b>{file}</b>
                <small>{(new Blob([css]).size / 1024).toFixed(1)} КБ · {css.split('\n').length} строк · настройки внутри</small>
              </div>
            </div>
            <div className="btn-row">
              <Button variant="primary" icon={<Download size={16} />} onClick={() => { downloadText(file, css); notify('Тема скачана. Импортируйте её в Koala Clash'); }}>Скачать .css</Button>
              <Button variant="soft" icon={copied === 'css' ? <Check size={16} /> : <Copy size={16} />} onClick={async () => { if (await copyText(css)) flash('css'); }}>Копировать CSS</Button>
            </div>
          </div>

          <div className="export-row">
            <div className="export-row-head"><Server size={15} /><b>Заголовок custom-css</b><span>клиент скачает тему из подписки - укажите, где будет лежать файл</span></div>
            <input className="field mono" value={cssUrl} placeholder={`https://example.com/${file}`} onChange={(e) => { setCssUrl(e.target.value); writeLocal('koala-theme:css-url', e.target.value.trim()); }} />
            <pre className="snippet">{srrSnippet(cssUrl.trim() || `https://example.com/${file}`)}</pre>
            <div className="btn-row">
              <Button size="sm" variant="soft" icon={copied === 'srr' ? <Check size={14} /> : <Copy size={14} />} onClick={async () => { if (await copyText(srrSnippet(cssUrl.trim() || `https://example.com/${file}`))) flash('srr'); }}>Копировать правило SRR</Button>
            </div>
          </div>

          <div className="export-row">
            <div className="export-row-head"><Link2 size={15} /><b>Ссылка на тему</b><span>все настройки зашиты в ссылку - отправьте её другу</span></div>
            <div className="font-add">
              <input className="field mono" readOnly value={link} onFocus={(e) => e.target.select()} />
              <Button size="sm" variant="soft" icon={copied === 'link' ? <Check size={14} /> : <Copy size={14} />} onClick={async () => { if (await copyText(link)) flash('link'); }}>Копировать</Button>
            </div>
          </div>

          <div className="export-row">
            <div className="export-row-head"><FileJson size={15} /><b>Файл настроек</b><span>для резервной копии или чтобы продолжить в другом браузере</span></div>
            <Button size="sm" variant="soft" icon={<Download size={14} />} onClick={() => downloadText(file.replace(/\.css$/, '.json'), JSON.stringify(config, null, 2), 'application/json')}>Скачать .json</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
