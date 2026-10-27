// Инструкция: как поставить тему в Koala Clash.
//
// Клиент берёт тему из заголовка custom-css в ответе подписки (main/config/profile.ts). Значение - ссылка на CSS-файл. При обновлении подписки клиент скачивает
// файл в папку тем (main/resolve/theme.ts → downloadCustomCss) и включает его, пока профиль активен.

import { useState } from 'react';
import { Download, Upload, Link2, RefreshCw, Copy, Lightbulb, Check } from 'lucide-react';
import { useStore } from '../state/store';
import { copyText } from '../lib/share';
import { Button, TextField } from './ui';
import { readLocal, writeLocal } from '../lib/storage';

export function srrSnippet(url: string) {
  return `{\n  "key": "custom-css",\n  "value": "${url || 'https://example.com/custom.css'}"\n}`;
}

export function Install() {
  const set = useStore((s) => s.set);
  const notify = useStore((s) => s.notify);
  const [url, setUrl] = useState(() => readLocal('koala-theme:css-url') || '');
  const [copied, setCopied] = useState(false);
  const snippet = srrSnippet(url.trim());

  return (
    <div className="install">
      <header className="panel-head">
        <h2>Как установить тему</h2>
        <p>Тему для пользователей подключает провайдер: в ответе подписки он передаёт заголовок <code>custom-css</code> со ссылкой на файл. Клиент скачивает тему сам и включает её для этого профиля.</p>
      </header>

      <ol className="steps">
        <li>
          <span className="step-ico"><Download size={16} /></span>
          <div>
            <h3>Скачайте тему</h3>
            <p>«Экспорт» → «Скачать .css». Имя файла важно: оно станет названием темы в списке клиента (например, <code>koala-night.css</code> → «koala-night»).</p>
            <Button size="sm" variant="primary" onClick={() => set({ exportOpen: true })}>Открыть экспорт</Button>
          </div>
        </li>
        <li>
          <span className="step-ico"><Upload size={16} /></span>
          <div>
            <h3>Разместите файл по прямой ссылке</h3>
            <p>Подойдёт любой адрес, по которому открывается сам файл: свой сервер или CDN, GitHub (raw-ссылка или jsDelivr), объектное хранилище. Клиент скачивает тему через прокси профиля, если он включён.</p>
          </div>
        </li>
        <li>
          <span className="step-ico"><Link2 size={16} /></span>
          <div>
            <h3>Добавьте заголовок custom-css</h3>
            <p>Провайдер отдаёт заголовок в ответе подписки. Пример настройки через <b>Правила ответов (SRR)</b>:</p>
            <TextField mono value={url} placeholder="https://example.com/custom.css" onChange={(v) => { setUrl(v); writeLocal('koala-theme:css-url', v.trim()); }} />
            <pre className="snippet">{snippet}</pre>
            <Button size="sm" variant="soft" icon={copied ? <Check size={13} /> : <Copy size={13} />} onClick={async () => {
              if (await copyText(snippet)) { setCopied(true); setTimeout(() => setCopied(false), 1500); } else notify('Не удалось скопировать');
            }}>Копировать правило</Button>
          </div>
        </li>
        <li>
          <span className="step-ico"><RefreshCw size={16} /></span>
          <div>
            <h3>Обновите подписку</h3>
            <p>Клиент скачает тему при добавлении или обновлении подписки и сразу применит её, пока профиль активен. Если файл по ссылке изменился, тема обновится вместе с подпиской.</p>
          </div>
        </li>
      </ol>

      <h3 className="gallery-sub">Если что-то не так</h3>
      <ul className="faq">
        <li><Lightbulb size={14} /><span><b>Тема не появилась после обновления подписки.</b> Откройте ссылку из заголовка в браузере: должен показаться текст CSS, а не страница сайта или скачивание архива.</span></li>
        <li><Lightbulb size={14} /><span><b>Не подхватился шрифт из Google Fonts.</b> В клиенте действует защита CSP, она может блокировать внешние шрифты. Установите шрифт в Windows - тема найдёт его по имени.</span></li>
        <li><Lightbulb size={14} /><span><b>Не видно картинки на фоне.</b> Ссылка должна быть прямой: в браузере открывается только картинка.</span></li>
        <li><Lightbulb size={14} /><span><b>Флаги не переехали в угол.</b> Стиль флагов работает, только если название сервера начинается с эмодзи-флага.</span></li>
        <li><Lightbulb size={14} /><span><b>Хочу доработать тему позже.</b> В скачанном файле сохранены все настройки - нажмите «Импорт» вверху и выберите этот файл.</span></li>
      </ul>
    </div>
  );
}
