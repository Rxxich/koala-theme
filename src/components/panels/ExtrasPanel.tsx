// Разделы "Детали" (мелочи, сведения о теме, свой CSS) и "Код".

import { useDeferredValue, useMemo, useState } from 'react';
import { Copy, Download, Search } from 'lucide-react';
import { useStore } from '../../state/store';
import { generateCSS } from '../../lib/generator';
import { highlightCss } from '../../lib/highlight';
import { copyText, downloadText, fileNameFor } from '../../lib/share';
import { Button, Group, Row, Segmented, TextField, Toggle } from '../ui';
import { PanelHead, useCfg } from './common';

export function ExtrasPanel() {
  const { config, update, set } = useCfg();
  const e = config.extras;
  return (
    <>
      <PanelHead title="Детали" text="Название темы, полоса прокрутки, подсказки, заголовок страницы и место для своего CSS." />
      <Group title="О теме">
        <Row label="Название" hint="Первая строка файла - так тема называется в списке клиента" stack>
          <TextField value={config.name} onChange={(v) => update((c) => { c.name = v; }, 'name')} placeholder="Моя тема" maxLength={60} />
        </Row>
        <Row label="Автор" stack><TextField value={config.author} onChange={(v) => update((c) => { c.author = v; }, 'author')} placeholder="Ваше имя или ник" maxLength={60} /></Row>
        <Row label="Описание" stack>
          <textarea className="field area" rows={2} value={config.description} placeholder="Пара слов о теме - попадёт в комментарий в начале файла"
            onChange={(ev) => update((c) => { c.description = ev.target.value; }, 'desc')} maxLength={400} />
        </Row>
      </Group>
      <Group title="Полоса прокрутки">
        <Segmented wrap size="sm" value={e.scrollbar} onChange={(v) => set('extras', 'scrollbar', v)} options={[
          { value: 'app', label: 'Как в клиенте' }, { value: 'thin', label: 'Тонкая' }, { value: 'accent', label: 'Градиент кнопки' }, { value: 'hidden', label: 'Скрыть' }
        ]} />
      </Group>
      <Group title="Подсказки">
        <Segmented wrap size="sm" value={e.tooltip} onChange={(v) => set('extras', 'tooltip', v)} options={[
          { value: 'app', label: 'Инверсия' }, { value: 'card', label: 'Карточка' }, { value: 'accent', label: 'Акцент' }, { value: 'glass', label: 'Стекло' }
        ]} />
      </Group>
      <Group title="Заголовок страницы">
        <Segmented wrap size="sm" value={e.title} onChange={(v) => set('extras', 'title', v)} options={[
          { value: 'app', label: 'Обычный' }, { value: 'gradient', label: 'Градиент' }, { value: 'accent', label: 'Акцент' }, { value: 'outline', label: 'Контур' }
        ]} />
      </Group>
      <Group title="Мелочи">
        <Toggle label="Выделение текста цветом акцента" checked={e.selection} onChange={(v) => set('extras', 'selection', v)} />
        <Toggle label="Заметное кольцо фокуса (Tab)" checked={e.focusRing} onChange={(v) => set('extras', 'focusRing', v)} />
        <Toggle label="Надпись «Подключено» цветом кнопки" checked={e.statusColor} onChange={(v) => set('extras', 'statusColor', v)} />
      </Group>
      <Group title="Свой CSS" hint="Добавится в конец темы. Используйте :root перед селектором, чтобы правило было сильнее стилей клиента">
        <textarea className="field area mono code-area" rows={8} spellCheck={false} value={e.customCss}
          placeholder={':root [data-slot="card"] {\n    letter-spacing: 0.01em;\n}'}
          onChange={(ev) => update((c) => { c.extras.customCss = ev.target.value; }, 'custom-css')} />
      </Group>
    </>
  );
}

export function CodePanel() {
  const config = useStore((s) => s.config);
  const notify = useStore((s) => s.notify);
  const deferred = useDeferredValue(config);
  const css = useMemo(() => generateCSS(deferred, { embedConfig: false }), [deferred]);
  const [q, setQ] = useState('');
  const [hit, setHit] = useState(-1);
  const html = useMemo(() => highlightCss(css), [css]);
  const lines = css.split('\n').length;
  const kb = (new Blob([css]).size / 1024).toFixed(1);
  const sections = useMemo(() => [...css.matchAll(/^ {3}(\d+)\. (.+)$/gm)].map((m) => ({ n: m[1], title: m[2] })), [css]);
  // Все вхождения запроса: Enter - к следующему, Shift+Enter - к предыдущему
  const hits = useMemo(() => {
    if (!q) return [];
    const low = css.toLowerCase(), needle = q.toLowerCase(), out: number[] = [];
    for (let i = low.indexOf(needle); i >= 0 && out.length < 999; i = low.indexOf(needle, i + needle.length)) out.push(i);
    return out;
  }, [css, q]);

  /** Прокрутить код к символу idx: строка - по высоте строки самого блока */
  const scrollTo = (idx: number) => {
    const el = document.querySelector<HTMLElement>('.code-view');
    if (!el || idx < 0) return;
    const line = css.slice(0, idx).split('\n').length;
    el.scrollTop = (line - 3) * (parseFloat(getComputedStyle(el).lineHeight) || 18.2);
  };
  const jump = (title: string) => scrollTo(css.indexOf(title));

  return (
    <>
      <PanelHead title="Код темы" text="Готовый CSS обновляется на лету. В скачанный файл дополнительно попадают настройки - чтобы открыть тему здесь снова." />
      <div className="code-meta">
        <span>{lines} строк · {kb} КБ</span>
        <div className="btn-row">
          <Button size="sm" variant="soft" icon={<Copy size={13} />} onClick={async () => notify((await copyText(generateCSS(config))) ? 'CSS скопирован' : 'Не удалось скопировать')}>Копировать</Button>
          <Button size="sm" variant="primary" icon={<Download size={13} />} onClick={() => downloadText(fileNameFor(config.name), generateCSS(config))}>Скачать</Button>
        </div>
      </div>
      <div className="code-toc">
        {sections.map((s) => <button key={s.n} type="button" onClick={() => jump(`${s.n}. ${s.title}`)}>{s.n}. {s.title.toLowerCase()}</button>)}
      </div>
      <div className="code-search">
        <Search size={13} />
        <input value={q} placeholder="Найти в коде: Enter - следующее" onChange={(e) => { setQ(e.target.value); setHit(-1); }} onKeyDown={(e) => {
          if (e.key !== 'Enter' || !hits.length) return;
          const n = hit < 0 ? 0 : (hit + (e.shiftKey ? -1 : 1) + hits.length) % hits.length;
          setHit(n);
          scrollTo(hits[n]);
        }} />
        {q && <small className="code-hits">{hits.length ? `${hit < 0 ? '-' : hit + 1} из ${hits.length}` : 'нет'}</small>}
      </div>
      <pre className="code-view" dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}
