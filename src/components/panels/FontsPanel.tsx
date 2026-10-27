// Разделы "Шрифты" и "Флаги".

import { useEffect, useState } from 'react';
import { Plus, X, Copy, ExternalLink, Info, AlertTriangle } from 'lucide-react';
import { useStore } from '../../state/store';
import { FONT_EXAMPLE_URL, FONT_KINDS, GOOGLE_FONTS, SYSTEM_FONTS, extractFontUrl, familiesFromUrl, googleFontUrl, isGoogleFontsUrl, isMonoFont, type FontInfo } from '../../lib/fonts';
import { useEditScheme } from '../../state/store';
import { textShadowCss } from '../../lib/shadows';
import { ColorField } from '../ColorPicker';
import { copyText } from '../../lib/share';
import type { FlagStyle, Flags, Fonts, TextShadow } from '../../lib/types';
import { Button, Choice, Group, Row, Segmented, Select, Slider, TextField, Toggle, cx } from '../ui';
import { PanelHead, useCfg } from './common';

/** Подгружает шрифты в сам сайт, чтобы образцы в списках рисовались нужным шрифтом */
function useSiteFonts(urls: string[]) {
  useEffect(() => {
    for (const u of urls) {
      if (!isGoogleFontsUrl(u) || document.querySelector(`link[data-kt-font="${CSS.escape(u)}"]`)) continue;
      const l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = u; l.dataset.ktFont = u;
      document.head.appendChild(l);
    }
  }, [urls.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
}

type Role = 'ui' | 'heading' | 'mono';
const ROLE_LABEL: Record<Role, string> = { ui: 'Интерфейс', heading: 'Заголовки', mono: 'Цифры' };
const SAMPLE = 'Koala Clash · Подключено 128 ms';

export function FontsPanel() {
  const { config, update, set } = useCfg();
  const notify = useStore((s) => s.notify);
  const f = config.fonts;
  const [role, setRole] = useState<Role>('ui');
  const [kind, setKind] = useState<FontInfo['kind'] | 'all'>('all');
  const scheme = useEditScheme();
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const families = [...new Set(f.imports.flatMap(familiesFromUrl))];

  // Образцы шрифтов каталога: только нужные буквы (параметр text) - это лёгкие запросы
  const previewUrls = GOOGLE_FONTS.map((g) => `https://fonts.googleapis.com/css2?family=${g.family.replace(/ /g, '+')}&text=${encodeURIComponent(g.family + 'Аа лат')}`);
  useSiteFonts([...f.imports, ...previewUrls]);

  const addUrl = (raw: string) => {
    const url = extractFontUrl(raw);
    if (!url || !isGoogleFontsUrl(url)) { setError('Нужна ссылка вида https://fonts.googleapis.com/css2?family=...'); return null; }
    const fams = familiesFromUrl(url);
    if (!fams.length) { setError('В ссылке не найден параметр family='); return null; }
    update((c) => { if (!c.fonts.imports.includes(url)) c.fonts.imports.push(url); });
    setError(''); setLink('');
    return fams;
  };
  const applyFamily = (family: string, r: Role = role) => update((c) => { c.fonts[r] = family; }, `font-${r}`);

  const quickAdd = (family: string, weights?: string | null) => {
    const exists = families.includes(family);
    if (!exists) update((c) => { c.fonts.imports.push(googleFontUrl(family, weights)); });
    applyFamily(family);
    notify(`${family} → ${ROLE_LABEL[role].toLowerCase()}`);
  };

  const options = (r: Role) => [
    { value: '', label: 'Как в клиенте (системный)' },
    ...families.map((x) => ({ value: x, label: x, group: 'Подключённые Google Fonts' })),
    ...SYSTEM_FONTS.filter((s) => r !== 'mono' || s.kind === 'mono' || s.kind === 'display').map((s) => ({ value: s.family, label: s.note ? `${s.family} · ${s.note}` : s.family, group: 'Системные шрифты Windows' }))
  ];
  const fontOf = (r: Role) => (f[r] ? `"${f[r]}", system-ui` : 'system-ui');

  return (
    <>
      <PanelHead title="Шрифты" text="Шрифты интерфейса, заголовков и цифр. В самом клиенте гарантированно работают только системные шрифты Windows - Google Fonts он не загружает." />

      <Group title="Шрифты по ролям">
        {(['ui', 'heading', 'mono'] as Role[]).map((r) => (
          <div key={r} className="font-role">
            <div className="font-role-head">
              <span className="row-label">{ROLE_LABEL[r]}</span>
              <Select value={f[r]} onChange={(v) => applyFamily(v, r)} options={options(r)} />
            </div>
            <div className="font-sample" style={{ fontFamily: fontOf(r), fontWeight: r === 'heading' ? f.headingWeight : f.weight }}>
              {r === 'mono' ? '01:24:37 · 184.2 GB · 48 ms' : r === 'heading' ? 'Главная · Прокси' : SAMPLE}
            </div>
            {f[r] && !SYSTEM_FONTS.some((s) => s.family === f[r]) && (
              <div className="csp-note warn">
                <AlertTriangle size={14} />
                <span>{f[r]} - шрифт Google Fonts. В конструкторе он виден, а в Koala Clash не загрузится: там останется шрифт клиента{r === 'mono' && !isMonoFont(f[r]) ? ', цифры не изменятся' : ''}. Чтобы {f[r]} появился у вас в клиенте, установите его в Windows: fonts.google.com → Get font → Download, откройте .ttf → «Установить», перезапустите Koala Clash. У подписчиков без этого шрифта будет шрифт клиента.</span>
              </div>
            )}
          </div>
        ))}
      </Group>

      <Group title="Google Fonts по ссылке" hint="Вставьте ссылку на шрифт, код <link> или @import - конструктор сам найдёт названия шрифтов">
        <div className="font-add">
          <TextField mono value={link} placeholder={FONT_EXAMPLE_URL} onChange={(v) => { setLink(v); setError(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { const fams = addUrl(link); if (fams) applyFamily(fams[0]); } }} />
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => { const fams = addUrl(link); if (fams) applyFamily(fams[0]); }}>Добавить</Button>
        </div>
        {error && <p className="note note-bad">{error}</p>}
        <details className="howto">
          <summary>Как получить ссылку</summary>
          <ol>
            <li>Откройте <a href="https://fonts.google.com/?subset=cyrillic" target="_blank" rel="noreferrer">fonts.google.com <ExternalLink size={11} /></a> - фильтр уже показывает шрифты с кириллицей.</li>
            <li>Выберите шрифт → <b>Get font</b> → <b>Get embed code</b>.</li>
            <li>Скопируйте адрес из строки <code>&lt;link href="..."&gt;</code> или весь блок целиком.</li>
            <li>Вставьте сюда и нажмите «Добавить». Шрифт сразу применится к выбранной роли.</li>
          </ol>
          <div className="example">
            <span>Пример ссылки:</span>
            <code>{FONT_EXAMPLE_URL}</code>
            <div className="btn-row">
              <Button size="sm" variant="soft" icon={<Copy size={13} />} onClick={async () => notify((await copyText(FONT_EXAMPLE_URL)) ? 'Ссылка скопирована' : 'Не удалось скопировать')}>Копировать</Button>
              <Button size="sm" variant="soft" icon={<Plus size={13} />} onClick={() => { const fams = addUrl(FONT_EXAMPLE_URL); if (fams) applyFamily(fams[0]); }}>Подключить пример</Button>
            </div>
            <span>Несколько шрифтов в одной ссылке: <code>?family=Inter:wght@400;600&amp;family=JetBrains+Mono</code></span>
          </div>
        </details>
        {f.imports.length > 0 && (
          <ul className="font-list">
            {f.imports.map((u) => (
              <li key={u}>
                <span className="font-list-name" style={{ fontFamily: `"${familiesFromUrl(u)[0]}", system-ui` }}>{familiesFromUrl(u).join(', ')}</span>
                <code title={u}>{u.replace('https://fonts.googleapis.com/css2?', '')}</code>
                <button type="button" className="icon-btn" title="Убрать шрифт" onClick={() => update((c) => {
                  const fams = familiesFromUrl(u);
                  c.fonts.imports = c.fonts.imports.filter((x) => x !== u);
                  for (const r of ['ui', 'heading', 'mono'] as Role[]) if (fams.includes(c.fonts[r])) c.fonts[r] = '';
                })}><X size={14} /></button>
              </li>
            ))}
          </ul>
        )}
        <div className="csp-note">
          <Info size={14} />
          <span>В Koala Clash стоит защита CSP (<code>default-src 'self'</code>): шрифты можно брать только из файлов самой программы. Шрифт с Google Fonts там не загрузится - ни по ссылке, ни встроенный в тему. Он появится только у тех, у кого установлен в Windows: тема обращается к нему по имени. Для темы, которую получат все подписчики, надёжны системные шрифты.</span>
        </div>
      </Group>

      <Group title="Быстрый выбор" hint="Щелчок подключает шрифт из Google Fonts и сразу применяет его к выбранной роли" aside={<Segmented<Role> size="sm" value={role} onChange={setRole} options={[{ value: 'ui', label: 'Интерфейс' }, { value: 'heading', label: 'Заголовки' }, { value: 'mono', label: 'Цифры' }]} />}>
        <Segmented wrap size="sm" value={kind} onChange={setKind} options={FONT_KINDS} />
        <div className="font-chips">
          {GOOGLE_FONTS.filter((g) => (kind === 'all' || g.kind === kind) && (role !== 'mono' || g.kind === 'mono' || g.kind === 'display' || kind !== 'all')).map((g) => (
            <button key={g.family} type="button" className={cx('font-chip', f[role] === g.family && 'active')} style={{ fontFamily: `"${g.family}", system-ui` }}
              onClick={() => quickAdd(g.family, g.weights)} title={g.latin ? `${g.family}: только латиница - русский текст покажется запасным шрифтом` : `Подключить ${g.family} из Google Fonts`}>
              {g.family}<small>{g.latin ? 'Aa · лат' : 'Аа'}</small>
            </button>
          ))}
        </div>
      </Group>

      <Group title="Настройка текста">
        <Slider label="Масштаб интерфейса" hint="Меняет размер всего: текста, отступов, кнопок" value={f.scale} min={85} max={120} unit="%" onChange={(v) => set('fonts', 'scale', v)} />
        <Slider label="Насыщенность текста" value={f.weight} min={300} max={600} step={50} onChange={(v) => set('fonts', 'weight', v)} />
        <Slider label="Насыщенность заголовков" value={f.headingWeight} min={300} max={900} step={50} onChange={(v) => set('fonts', 'headingWeight', v)} />
        <Slider label="Межбуквенный интервал" value={f.letterSpacing} min={-4} max={10} step={0.5} unit="%" onChange={(v) => set('fonts', 'letterSpacing', v)} />
        <Toggle label="Цифры одинаковой ширины" hint="Скорость и пинг не «прыгают» при обновлении" checked={f.tabular} onChange={(v) => set('fonts', 'tabular', v)} />
        <Toggle label="Заголовок страницы капсом" checked={f.uppercaseTitles} onChange={(v) => set('fonts', 'uppercaseTitles', v)} />
        <Toggle label="Сглаживание шрифтов" checked={f.smoothing} onChange={(v) => set('fonts', 'smoothing', v as Fonts['smoothing'])} />
        <Toggle label="Фикс флагов в описании сервера" hint="В Windows флаги в описании сервера и других текстах карточки без класса flag-emoji показываются буквами (NL, DE). Галочка подключает к ним шрифт twemoji, как у названий серверов" checked={f.flagFix} onChange={(v) => set('fonts', 'flagFix', v)} />
      </Group>

      <TextShadowGroup scheme={scheme} />
    </>
  );
}

const TEXT_SHADOWS: { value: TextShadow; label: string }[] = [
  { value: 'none', label: 'Нет' }, { value: 'soft', label: 'Мягкая' }, { value: 'glow', label: 'Свечение' }, { value: 'neon', label: 'Неон' },
  { value: 'hard', label: 'Жёсткая' }, { value: 'long', label: 'Длинная' }, { value: 'outline', label: 'Обводка' }, { value: 'emboss', label: 'Тиснение' }
];

function TextShadowGroup({ scheme }: { scheme: 'light' | 'dark' }) {
  const { config, set } = useCfg();
  const f = config.fonts;
  const p = config.palette[scheme];
  const preview = (v: TextShadow) => textShadowCss({ ...config, fonts: { ...f, textShadow: v } }, scheme) ?? 'none';
  return (
    <Group title="Тень текста" hint="Тень у заголовков или у всего текста. Цвет и форма подстраиваются под палитру">
      <div className="ts-grid" style={{ background: p.background, color: p.foreground }}>
        {TEXT_SHADOWS.map((t) => (
          <button key={t.value} type="button" className={cx('ts-tile', f.textShadow === t.value && 'active')} onClick={() => set('fonts', 'textShadow', t.value)}>
            <b style={{ textShadow: preview(t.value) }}>Аа</b>
            <small>{t.label}</small>
          </button>
        ))}
      </div>
      {f.textShadow !== 'none' && (
        <>
          <Row label="Где"><Segmented size="sm" value={f.textShadowTarget} onChange={(v) => set('fonts', 'textShadowTarget', v)} options={[{ value: 'titles', label: 'Заголовки' }, { value: 'all', label: 'Весь текст' }]} /></Row>
          <Row label="Цвет" stack>
            <Segmented size="sm" value={f.textShadowColor} onChange={(v) => set('fonts', 'textShadowColor', v)} options={[{ value: 'auto', label: 'Авто' }, { value: 'primary', label: 'Акцент' }, { value: 'power', label: 'Цвет кнопки' }, { value: 'custom', label: 'Свой' }]} />
          </Row>
          {f.textShadowColor === 'custom' && <Row label="Свой цвет"><ColorField value={f.textShadowCustom} onChange={(v) => set('fonts', 'textShadowCustom', v)} /></Row>}
          <Slider label="Заметность" value={f.textShadowOpacity} min={5} max={100} unit="%" onChange={(v) => set('fonts', 'textShadowOpacity', v)} />
          {['soft', 'glow', 'neon'].includes(f.textShadow) && <Slider label="Размытие" value={f.textShadowBlur} min={0} max={300} step={5} unit="%" onChange={(v) => set('fonts', 'textShadowBlur', v)} />}
          {['soft', 'hard', 'long'].includes(f.textShadow) && (
            <>
              <Slider label="Дальность" value={f.textShadowDistance} min={0} max={400} step={10} unit="%" onChange={(v) => set('fonts', 'textShadowDistance', v)} />
              <Slider label="Направление" hint="90° - тень вниз, 0° - вправо" value={f.textShadowAngle} min={0} max={359} unit="°" onChange={(v) => set('fonts', 'textShadowAngle', v)} />
            </>
          )}
        </>
      )}
    </Group>
  );
}

/* ---------- Флаги ---------- */

const FLAG_PRESETS: { id: string; name: string; flags: Partial<Flags> }[] = [
  { id: 'app', name: 'Как в клиенте', flags: { style: 'app' } },
  { id: 'sage', name: 'Как в Sage & Night', flags: { style: 'corner', size: 114, rotate: -50, x: -50, y: 15, opacity: 45, fade: true, blur: 0, side: 'right', hideInline: true } },
  { id: 'straight', name: 'Ровно справа', flags: { style: 'corner', size: 80, rotate: 0, x: -14, y: 50, opacity: 30, fade: true, blur: 0, side: 'right', hideInline: true } },
  { id: 'tilt', name: 'Наклон вправо', flags: { style: 'corner', size: 100, rotate: 35, x: -40, y: 25, opacity: 40, fade: true, blur: 0, side: 'right', hideInline: true } },
  { id: 'left', name: 'Слева, наискось', flags: { style: 'corner', size: 100, rotate: 40, x: -46, y: 20, opacity: 30, fade: true, blur: 0, side: 'left', hideInline: true } },
  { id: 'water', name: 'Водяной знак', flags: { style: 'watermark', size: 150, rotate: 0, x: -14, opacity: 22, blur: 2, fade: true, side: 'right', hideInline: true } },
  { id: 'badge', name: 'Значок', flags: { style: 'badge', size: 20, opacity: 100 } },
  { id: 'round', name: 'Круглые', flags: { style: 'round', size: 22, opacity: 100 } },
  { id: 'hide', name: 'Без флагов', flags: { style: 'hide' } }
];
const STYLES: { value: FlagStyle; label: string }[] = [
  { value: 'app', label: 'Обычные' }, { value: 'corner', label: 'В углу' }, { value: 'watermark', label: 'Водяной знак' },
  { value: 'badge', label: 'Значок' }, { value: 'round', label: 'Круг' }, { value: 'hide', label: 'Скрыть' }
];

function FlagCard({ flags }: { flags: Partial<Flags> }) {
  const s = flags.style ?? 'app';
  const corner = s === 'corner' || s === 'watermark';
  const side = flags.side ?? 'right';
  const scale = 0.42;
  return (
    <span className={cx('flag-card', `fcs-${s}`)}>
      {corner && (
        <span className="fc-big" style={{
          fontSize: (flags.size ?? 100) * scale, [side]: (flags.x ?? 0) * scale,
          top: s === 'watermark' ? '50%' : `${flags.y ?? 15}%`,
          transform: `translateY(${s === 'watermark' ? '-50%' : '-45%'}) rotate(${flags.rotate ?? 0}deg)`,
          opacity: (flags.opacity ?? 40) / 100,
          filter: [flags.blur ? `blur(${flags.blur * scale}px)` : '', flags.dim ? `brightness(${100 - flags.dim}%)` : ''].join(' ').trim() || undefined,
          maskImage: flags.fade ? `linear-gradient(to ${side === 'right' ? 'left' : 'right'}, #000 35%, transparent)` : undefined
        }}>🇳🇱</span>
      )}
      {(s === 'badge' || s === 'round') && side === 'left' && <span className={s === 'round' ? 'fc-round' : 'fc-badge'}>🇳🇱</span>}
      <span className="fc-text">
        <b>{s === 'app' || (corner && !flags.hideInline) ? '🇳🇱 ' : ''}Нидерланды</b>
        <small>VLESS Reality</small>
      </span>
      <em>48</em>
      {(s === 'badge' || s === 'round') && side === 'right' && <span className={s === 'round' ? 'fc-round' : 'fc-badge'}>🇳🇱</span>}
    </span>
  );
}

export function FlagsPanel() {
  const { config, update, set } = useCfg();
  const setUi = useStore((s) => s.set);
  const fl = config.flags;
  useEffect(() => { setUi({ page: 'proxies' }); }, [setUi]);
  const apply = (patch: Partial<Flags>) => update((c) => { c.flags = { ...c.flags, ...patch }; });
  const active = FLAG_PRESETS.find((p) => Object.entries(p.flags).every(([k, v]) => fl[k as keyof Flags] === v));

  return (
    <>
      <PanelHead title="Флаги серверов" text="Как показывать флаг страны в карточке сервера. Работает, если название сервера начинается с эмодзи-флага." />
      <Group title="Примеры">
        <div className="flag-grid">
          {FLAG_PRESETS.map((p) => (
            <Choice key={p.id} active={active?.id === p.id} onClick={() => apply(p.flags)}>
              <FlagCard flags={p.id === 'app' ? { style: 'app' } : { ...fl, ...p.flags }} />
              <span>{p.name}</span>
            </Choice>
          ))}
        </div>
      </Group>
      <Group title="Стиль">
        <Segmented<FlagStyle> wrap size="sm" value={fl.style} options={STYLES} onChange={(v) => update((c) => {
          // У значка и угла разный масштаб размера - подставляем разумное значение при переключении
          c.flags.style = v;
          if ((v === 'badge' || v === 'round') && c.flags.size > 40) c.flags.size = v === 'round' ? 22 : 20;
          if ((v === 'corner' || v === 'watermark') && c.flags.size < 40) c.flags.size = v === 'watermark' ? 150 : 100;
        })} />
        {(fl.style === 'corner' || fl.style === 'watermark') && (
          <>
            <Row label="Сторона"><Segmented size="sm" value={fl.side} onChange={(v) => set('flags', 'side', v)} options={[{ value: 'left', label: 'Слева' }, { value: 'right', label: 'Справа' }]} /></Row>
            <Slider label="Размер" value={fl.size} min={40} max={200} unit="px" onChange={(v) => set('flags', 'size', v)} />
            <Slider label="Наклон" hint="Минус - наклон влево, плюс - вправо" value={fl.rotate} min={-90} max={90} unit="°" onChange={(v) => set('flags', 'rotate', v)} />
            <Slider label="Сдвиг от края" hint="Отрицательное значение уводит флаг за край карточки" value={fl.x} min={-120} max={40} unit="px" onChange={(v) => set('flags', 'x', v)} />
            {fl.style === 'corner' && <Slider label="Высота" value={fl.y} min={-20} max={100} unit="%" onChange={(v) => set('flags', 'y', v)} />}
            <Slider label="Непрозрачность" value={fl.opacity} min={5} max={100} unit="%" onChange={(v) => set('flags', 'opacity', v)} />
            <Slider label="Размытие" value={fl.blur} min={0} max={12} unit="px" onChange={(v) => set('flags', 'blur', v)} />
            <Toggle label="Плавно растворять к центру" checked={fl.fade} onChange={(v) => set('flags', 'fade', v)} />
            <Toggle label="Убрать маленький флаг из названия" checked={fl.hideInline} onChange={(v) => set('flags', 'hideInline', v)} />
          </>
        )}
        {(fl.style === 'badge' || fl.style === 'round') && (
          <>
            <Row label="Сторона"><Segmented size="sm" value={fl.side} onChange={(v) => set('flags', 'side', v)} options={[{ value: 'left', label: 'Слева' }, { value: 'right', label: 'Справа' }]} /></Row>
            <Slider label="Размер" value={Math.min(34, fl.size)} min={14} max={34} unit="px" onChange={(v) => set('flags', 'size', v)} />
          </>
        )}
        {fl.style !== 'app' && fl.style !== 'hide' && (
          <>
            <Slider label="Затемнение" hint="Делает флаг темнее, чтобы он не спорил с текстом" value={fl.dim} min={0} max={80} unit="%" onChange={(v) => set('flags', 'dim', v)} />
            <Toggle label="Ярче у выбранного сервера" hint="Снимает затемнение, делает флаг непрозрачнее и подсвечивает его цветом акцента" checked={fl.selectedBoost} onChange={(v) => set('flags', 'selectedBoost', v)} />
            {(fl.style === 'corner' || fl.style === 'watermark') && fl.blur > 0 && (
              <Toggle label="Не размывать флаг у выбранного сервера" checked={fl.selectedNoBlur} onChange={(v) => set('flags', 'selectedNoBlur', v)} />
            )}
            <Toggle label="Чёрно-белые, цвет при наведении" checked={fl.grayscale} onChange={(v) => set('flags', 'grayscale', v)} />
          </>
        )}
      </Group>
      <p className="note">Флаг - это первая «буква» названия сервера, поэтому названия вида <code>🇳🇱 Нидерланды</code> подходят, а <code>Нидерланды 🇳🇱</code> - нет. Переименовать серверы может только провайдер подписки.</p>
    </>
  );
}
