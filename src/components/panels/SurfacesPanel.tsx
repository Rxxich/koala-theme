// Разделы "Поверхности" и "Тени".

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useEditScheme, useStore } from '../../state/store';
import { readableOn, rgba } from '../../lib/color';
import { shadowSet } from '../../lib/shadows';
import { cardPreview, liquidOn } from '../../lib/generator';
import { cardStops, defaultConfig, detachCardGradient } from '../../lib/defaults';
import { GradientEditor } from '../GradientEditor';
import { CardGradientTiles } from './CardGradients';
import type { ButtonStyle, CardFill, CardGradient, ThemeConfig, Divider, DividerEffect, DividerStyle,HoverStyle, IconPlate, IconShape, NavActive, Palette, ProfileSwitch, SelectedHover, SelectedStyle, ShadowPreset, SidebarStyle, StyleColor, Surfaces } from '../../lib/types';
import { ColorField } from '../ColorPicker';
import { Button, Choice, Group, Row, Segmented, Slider, Toggle, cx } from '../ui';
import { PanelHead, SchemeSwitch, useCfg } from './common';

const SIDEBAR: { value: SidebarStyle; label: string }[] = [
  { value: 'app', label: 'Как в клиенте' }, { value: 'cards', label: 'Как карточки' }, { value: 'glass', label: 'Стекло' }, { value: 'solid', label: 'Сплошная' }, { value: 'outline', label: 'Контур' }, { value: 'transparent', label: 'Без фона' }
];
/** Фон карточек: 'app' - как в клиенте (свои настройки выключены), 'liquid' - стекло с преломлением */
type FillChoice = CardFill | 'app' | 'liquid';
const CARD_FILL: { value: FillChoice; label: string }[] = [
  { value: 'app', label: 'Как в клиенте' }, { value: 'glass', label: 'Стекло' }, { value: 'liquid', label: 'Жидкое стекло' }, { value: 'solid', label: 'Сплошные' }, { value: 'outline', label: 'Контур' }, { value: 'transparent', label: 'Без фона' }
];
const NAV: { value: NavActive; label: string }[] = [
  { value: 'app', label: 'Рамка' }, { value: 'fill', label: 'Заливка' }, { value: 'gradient', label: 'Градиент' }, { value: 'bar', label: 'Полоска' }, { value: 'glow', label: 'Свечение' }, { value: 'solid', label: 'Инверсия' },
  { value: 'scale', label: 'Увеличение' }, { value: 'capsule', label: 'Капсула' }, { value: 'neon', label: 'Неон' }, { value: 'underline', label: 'Подчёркивание' }, { value: 'dot', label: 'Точка' },
  { value: 'liquid', label: 'Жидкое стекло' }
];
const SELECTED: { value: SelectedStyle; label: string }[] = [
  { value: 'app', label: 'Как в клиенте' }, { value: 'tint', label: 'Тонировка' }, { value: 'gradient', label: 'Градиент' }, { value: 'glow', label: 'Свечение' },
  { value: 'outline', label: 'Обводка' }, { value: 'bar', label: 'Полоска слева' }, { value: 'power', label: 'Цвет кнопки' },
  { value: 'neon', label: 'Неон' }, { value: 'brutal', label: 'Брутализм' }, { value: 'stripes', label: 'Штриховка' }, { value: 'shine', label: 'Блик' },
  { value: 'aurora', label: 'Сияние' }, { value: 'corners', label: 'Уголки' }, { value: 'inset', label: 'Вдавленная' }, { value: 'spotlight', label: 'Прожектор' },
  { value: 'underline', label: 'Подчёркивание' }
];
const SELECTED_HOVER: { value: SelectedHover; label: string }[] = [
  { value: 'none', label: 'Нет' }, { value: 'brighten', label: 'Ярче' }, { value: 'lift', label: 'Подъём' }, { value: 'glow', label: 'Свечение' }, { value: 'scale', label: 'Увеличение' }, { value: 'shift', label: 'Ярче рамка' }
];
const HOVER: { value: HoverStyle; label: string }[] = [
  { value: 'app', label: 'Подсветка' }, { value: 'lift', label: 'Подъём' }, { value: 'scale', label: 'Увеличение' }, { value: 'glow', label: 'Свечение' }, { value: 'border', label: 'Рамка акцента' }, { value: 'none', label: 'Нет' }
];
const PROFILE_SWITCH: { value: ProfileSwitch; label: string }[] = [
  { value: 'app', label: 'Тускнеет' }, { value: 'pulse', label: 'Пульс' }, { value: 'shimmer', label: 'Блик' }, { value: 'none', label: 'Без эффекта' }
];
const STYLE_COLORS: { value: StyleColor; label: string }[] = [
  { value: 'auto', label: 'Авто' }, { value: 'primary', label: 'Акцент' }, { value: 'power', label: 'Цвет кнопки' }, { value: 'foreground', label: 'Цвет текста' }, { value: 'custom', label: 'Свой' }
];

/** Цвета превью с выбранным цветом стиля - как accentVars в генераторе: акцент и цвета кнопки подключения заменяются им */
function tones(p: Palette, c: StyleColor, custom: string) {
  const x = c === 'primary' ? p.primary : c === 'power' ? p.powerOnStart : c === 'foreground' ? p.foreground : c === 'custom' ? custom : null;
  return { pick: x, primary: x ?? p.primary, a: x && c !== 'power' ? x : p.powerOnStart, b: x && c !== 'power' ? x : p.powerOnEnd, pf: x && c !== 'primary' ? readableOn(x) : p.primaryForeground };
}

/** Выбор цвета стиля - как у разделителей: цвета палитры или свой */
function ColorPick({ label = 'Цвет', hint = 'Авто - цвета самого стиля', value, custom, onChange, onCustom }: {
  label?: string; hint?: string; value: StyleColor; custom: string; onChange: (v: StyleColor) => void; onCustom: (v: string) => void;
}) {
  return (
    <>
      <Row label={label} hint={hint} stack><Segmented<StyleColor> wrap size="sm" value={value} onChange={onChange} options={STYLE_COLORS} /></Row>
      {value === 'custom' && <Row label="Свой цвет"><ColorField value={custom} onChange={onCustom} /></Row>}
    </>
  );
}

const PLATES: { value: IconPlate; label: string }[] = [
  { value: 'app', label: 'Без подложки' }, { value: 'soft', label: 'Мягкая' }, { value: 'solid', label: 'Плотная' }, { value: 'tint', label: 'Акцент' },
  { value: 'power', label: 'Цвет кнопки' }, { value: 'glass', label: 'Стекло' }, { value: 'white', label: 'Светлая' }
];
const SHAPES: { value: IconShape; label: string }[] = [
  { value: 'app', label: 'Как в клиенте' }, { value: 'squircle', label: 'Скруглённая' }, { value: 'circle', label: 'Круг' }, { value: 'square', label: 'Квадрат' }
];
const SHAPE_R: Record<IconShape, string> = { app: '6px', squircle: '32%', circle: '50%', square: '0' };
const BUTTONS: { value: ButtonStyle; label: string }[] = [
  { value: 'app', label: 'Сплошные' }, { value: 'glossy', label: 'Объёмные' }, { value: 'power', label: 'Градиент кнопки' }, { value: 'glow', label: 'Свечение' }, { value: 'outline', label: 'Контурные' }, { value: 'pill', label: 'Капсулы' },
  { value: 'pushable', label: 'Клавиша' }, { value: 'brutal', label: 'Брутализм' }, { value: 'liquid', label: 'Жидкое стекло' }
];

/** Стекло под жидкое: размытие 4px, непрозрачность до 30%, насыщенность от 150% - как у жидкого стекла Apple */
function thinGlass(s: Surfaces) {
  s.blur = 4;
  s.opacity = Math.min(s.opacity, 30);
  s.saturate = Math.max(s.saturate, 150);
}

export function SurfacesPanel() {
  const { config, set, update } = useCfg();
  const setUi = useStore((st) => st.set);
  const notify = useStore((st) => st.notify);
  const s = config.surfaces;
  const scheme = useEditScheme();
  const p = config.palette[scheme];
  /** Настройки профилей - и превью переходит на страницу профилей, где их видно */
  const setProfile = <K extends 'profileSelected' | 'profileSelectedHover' | 'profileHover' | 'profileSwitch' | 'profileColor' | 'profileCustom'>(k: K, v: Surfaces[K]) => {
    set('surfaces', k, v);
    setUi({ page: 'profiles' });
  };
  /** Любая настройка карточек включает "свои поверхности" */
  const setCard = <K extends 'opacity' | 'blur' | 'saturate' | 'grain' | 'liquidStrength' | 'liquidEdge' | 'borderWidth' | 'borderOpacity' | 'gradient' | 'highlight' | 'highlightBottom' | 'borderColor' | 'borderCustom'>(k: K, v: (typeof s)[K]) =>
    update((c) => { c.surfaces[k] = v; c.surfaces.custom = true; }, `surfaces.${k}`);
  const liquid = liquidOn(s);
  const fill: FillChoice = !s.custom ? 'app' : liquid ? 'liquid' : s.fill;
  const glass = s.fill === 'glass';
  const stroke = tones(p, s.borderColor, s.borderCustom).pick ?? p.stroke;
  const selT = tones(p, s.selectedColor, s.selectedCustom), profT = tones(p, s.profileColor, s.profileCustom);
  const navT = tones(p, s.navColor, s.navCustom), btnT = tones(p, s.buttonsColor, s.buttonsCustom), iconT = tones(p, s.iconColor, s.iconCustom);

  const selPreview = (v: SelectedStyle, t: ReturnType<typeof tones>): React.CSSProperties => {
    const base: React.CSSProperties = { background: rgba(p.card, s.opacity / 100), borderColor: stroke };
    const pa = (k: number) => rgba(t.primary, k);
    const line = (c: string) => `linear-gradient(${c}, ${c})`;
    switch (v) {
      case 'tint': return { ...base, background: pa(0.18), borderColor: pa(0.55) };
      case 'gradient': return { ...base, background: `linear-gradient(115deg, ${pa(0.32)}, ${pa(0.06)})`, borderColor: pa(0.5) };
      case 'glow': return { ...base, background: pa(0.14), borderColor: pa(0.7), boxShadow: `0 0 14px ${pa(0.4)}` };
      case 'outline': return { ...base, borderColor: 'transparent', boxShadow: `inset 0 0 0 2px ${t.primary}` };
      case 'bar': return { ...base, background: pa(0.09), boxShadow: `inset 3px 0 0 ${t.primary}` };
      case 'power': return { ...base, background: `linear-gradient(115deg, ${rgba(t.a, 0.32)}, ${rgba(t.b, 0.14)})`, borderColor: rgba(t.pick && t.a === t.pick ? t.pick : p.powerOnStroke, 0.6) };
      case 'neon': return { ...base, background: pa(0.08), borderColor: t.primary, boxShadow: `0 0 4px ${pa(0.8)}, 0 0 12px ${pa(0.45)}, inset 0 0 8px ${pa(0.3)}` };
      // Рамка - отдельными свойствами: сокращение border вместе с borderColor из base React не любит
      case 'brutal': return { ...base, background: pa(0.22), borderWidth: 2, borderColor: p.foreground, boxShadow: `3px 3px 0 ${p.foreground}`, translate: '-1px -1px' };
      case 'stripes': return { ...base, background: `repeating-linear-gradient(135deg, ${pa(0.16)} 0 5px, transparent 5px 10px), ${pa(0.08)}`, borderColor: pa(0.55) };
      case 'shine': return { ...base, background: `linear-gradient(105deg, transparent 30%, rgba(255, 255, 255, 0.18) 50%, transparent 70%), ${pa(0.12)}`, borderColor: pa(0.5) };
      case 'aurora': return { ...base, background: `linear-gradient(120deg, ${rgba(t.a, 0.34)}, ${pa(0.16)}, ${rgba(t.b, 0.34)})`, borderColor: pa(0.45) };
      case 'corners': return { ...base, background: ['left 3px top 3px / 8px 2px', 'left 3px top 3px / 2px 8px', 'right 3px bottom 3px / 8px 2px', 'right 3px bottom 3px / 2px 8px']
        .map((q) => `${line(t.primary)} ${q} no-repeat`).join(', ') + `, ${pa(0.1)}`, borderColor: pa(0.25) };
      case 'inset': return { ...base, background: pa(0.06), borderColor: 'transparent', boxShadow: 'inset 3px 3px 7px rgba(0, 0, 0, 0.35), inset -2px -2px 5px rgba(255, 255, 255, 0.07)' };
      case 'spotlight': return { ...base, background: `radial-gradient(120% 160% at 0% 50%, ${pa(0.32)}, transparent 62%), ${base.background}`, borderColor: pa(0.4) };
      case 'underline': return { ...base, background: `linear-gradient(90deg, ${t.a}, ${t.b}) left bottom / 100% 2px no-repeat, ${pa(0.08)}`, borderColor: pa(0.25) };
      default: return { ...base, background: pa(0.1), borderColor: pa(0.3) };
    }
  };

  return (
    <>
      <PanelHead title="Поверхности" text="Карточки, плитки главной, боковая панель и всплывающие окна: прозрачность, стекло, рамки, скругления." />

      <Group title="Карточки и плитки" hint="Варианты фона - те же, что у боковой панели. Чтобы панель всегда совпадала с карточками, выберите у неё «Как карточки»">
        <Segmented<FillChoice> wrap size="sm" value={fill} options={CARD_FILL} onChange={(v) => {
          // Густое стекло (по умолчанию размытие 24px) прячет преломление целиком - при выборе жидкого делаем его прозрачнее
          const thick = v === 'liquid' && !liquid && (s.blur > 8 || s.opacity > 40);
          update((c) => {
            c.surfaces.custom = v !== 'app';
            if (v === 'app') return;
            c.surfaces.fill = v === 'liquid' ? 'glass' : v;
            c.surfaces.liquid = v === 'liquid';
            if (thick) thinGlass(c.surfaces);
          });
          if (thick) notify('Стекло стало прозрачнее: размытие 4px, непрозрачность до 30% - иначе преломления не видно. Ctrl+Z - вернуть');
        }} />
        {!s.custom && <p className="note">Сейчас карточки выглядят как в Koala Clash. Подвиньте любой ползунок - включатся свои настройки (стекло).</p>}
        {s.custom && s.fill === 'transparent' && <p className="note">Карточки без фона и рамки: остаётся только текст поверх фона окна. Выбранный сервер по-прежнему выделяется.</p>}
        <div className={cx('stack', !s.custom && 'dimmed')}>
          {(glass || !s.custom) && (
            <>
              <Slider label="Непрозрачность" hint="100% - карточки сплошные, меньше - сквозь них виден фон" value={s.opacity} min={0} max={100} unit="%" onChange={(v) => setCard('opacity', v)} />
              <Slider label="Размытие фона" hint="Эффект матового стекла под полупрозрачными карточками. 0 - выключить" value={s.blur} min={0} max={60} unit="px" onChange={(v) => setCard('blur', v)} />
              <Slider label="Насыщенность стекла" value={s.saturate} min={50} max={250} unit="%" disabled={s.blur === 0} onChange={(v) => setCard('saturate', v)} />
              <Slider label="Шероховатость стекла" hint="Мелкое зерно поверх стекла - как у матового, пескоструйного стекла. Действует и на стеклянную боковую панель, окна и меню" value={s.grain} min={0} max={100} unit="%" onChange={(v) => setCard('grain', v)} />
            </>
          )}
          {liquid && (
            <>
              <p className="note">Фон под карточками изгибается у краёв, как под толстой линзой. Лучше всего видно на картинке или узоре фона, когда стекло почти прозрачное. Действует и на стеклянную боковую панель и кнопку подключения «Стекло».</p>
              <div className="csp-note warn">
                <AlertTriangle size={14} />
                <span>Жидкое стекло нагружает видеокарту сильнее обычного. Пока ничего не двигается, оно ничего не стоит, но при прокрутке списка серверов и любой анимации стекло каждой карточки пересчитывается заново в каждом кадре. Сильное размытие (больше 4px) добавляет нагрузки: на экранах 144-180 Гц прокрутка начинает подтормаживать, а на слабом компьютере (встроенная графика ноутбука) может тормозить и на обычном экране. Если интерфейс стал медленнее - уменьшите размытие или вернитесь к обычному «Стеклу».</span>
              </div>
              {(s.blur > 8 || s.opacity > 40) && (
                <Button size="sm" variant="soft" title="Размытие 4px, непрозрачность до 30%, насыщенность от 150% - как у жидкого стекла Apple. Сильное размытие и плотная заливка прячут преломление"
                  onClick={() => update((c) => thinGlass(c.surfaces))}>Сделать стекло прозрачнее</Button>
              )}
              <Slider label="Преломление" hint="Насколько далеко сдвигается фон у самого края. Если сдвиг больше половины карточки, фон у края отражается, как в капле" value={s.liquidStrength} min={2} max={40} unit="px" onChange={(v) => setCard('liquidStrength', v)} />
              <Slider label="Ширина кромки" hint="Полоса у края, где фон изгибается: узкая - чёткая грань, широкая - плавная линза" value={s.liquidEdge} min={6} max={50} unit="px" onChange={(v) => setCard('liquidEdge', v)} />
            </>
          )}
          {s.fill !== 'transparent' && (
            <>
              <Slider label="Толщина рамки" value={s.borderWidth} min={s.fill === 'outline' ? 1 : 0} max={3} step={0.5} unit="px" onChange={(v) => setCard('borderWidth', v)} />
              <Slider label="Заметность рамки" value={s.borderOpacity} min={0} max={100} unit="%" disabled={s.borderWidth === 0} onChange={(v) => setCard('borderOpacity', v)} />
              {s.borderWidth > 0 && <ColorPick label="Цвет рамки" hint="Авто - цвет рамок из палитры. Рамки карточек, плиток, профилей, окон и боковой панели" value={s.borderColor} custom={s.borderCustom}
                onChange={(v) => setCard('borderColor', v)} onCustom={(v) => setCard('borderCustom', v)} />}
            </>
          )}
          {(glass || s.fill === 'solid' || !s.custom) && (
            <>
              <Toggle label="Градиент" hint="Заливка карточек и плиток градиентом. Действует и на боковую панель «Как карточки» и «Стекло»" checked={s.gradient} onChange={(v) => setCard('gradient', v)} />
              {s.gradient && <CardGradientBlock />}
              <Toggle label="Блик по верхней кромке" hint="Светлая линия сверху, как у стекла. Работает при любом стиле теней, кроме «Неоморфизма» - у него свой объём" checked={s.highlight} onChange={(v) => setCard('highlight', v)} />
              <Toggle label="Блик по нижней кромке" hint="Светлая линия снизу, слабее верхней - свет, прошедший сквозь толщу стекла. Вместе с верхним получается кромка жидкого стекла. Тоже не работает с «Неоморфизмом»" checked={s.highlightBottom} onChange={(v) => setCard('highlightBottom', v)} />
            </>
          )}
        </div>
        <Slider label="Скругление" hint="От этого значения считаются все радиусы: кнопки, поля, карточки. 0 - острые углы" value={s.radius} min={0} max={1.75} step={0.025} unit="rem" onChange={(v) => set('surfaces', 'radius', v)} />
        <div className="radius-demo">
          {[0.6, 1, 1.4].map((k) => <span key={k} style={{ borderRadius: `calc(${s.radius}rem * ${k})`, borderColor: s.custom ? stroke : p.stroke, borderWidth: s.borderWidth,
            background: cardPreview(s, p, scheme, Math.max(30, s.custom && s.fill === 'solid' ? 100 : s.opacity)) }} />)}
        </div>
      </Group>

      <Group title="Выбранный сервер">
        <div className="choice-grid">
          {SELECTED.map((o) => (
            <Choice key={o.value} active={s.selected === o.value} onClick={() => set('surfaces', 'selected', o.value)}>
              <span className="mini-card" style={selPreview(o.value, selT)}><i style={{ background: p.foreground }} /><b style={{ background: p.mutedForeground }} /></span>
              <span>{o.label}</span>
            </Choice>
          ))}
        </div>
        <Row label="При наведении" hint="Что происходит, когда курсор над уже выбранным сервером" stack>
          <Segmented<SelectedHover> wrap size="sm" value={s.selectedHover} onChange={(v) => set('surfaces', 'selectedHover', v)} options={SELECTED_HOVER} />
        </Row>
        <ColorPick hint="Авто - цвета самого стиля: акцент, у «Цвета кнопки» и «Подчёркивания» - цвета кнопки подключения. Действует и на стиль клиента" value={s.selectedColor} custom={s.selectedCustom}
          onChange={(v) => set('surfaces', 'selectedColor', v)} onCustom={(v) => set('surfaces', 'selectedCustom', v)} />
      </Group>

      <Group title="Наведение">
        <Row label="Карточки серверов" stack>
          <Segmented<HoverStyle> wrap size="sm" value={s.hover} onChange={(v) => set('surfaces', 'hover', v)} options={HOVER} />
        </Row>
        <Row label="Группы и кнопка сервера" hint="Шапки групп на странице «Прокси» и кнопка с названием сервера на главной" stack>
          <Segmented<HoverStyle> wrap size="sm" value={s.groupHover} onChange={(v) => set('surfaces', 'groupHover', v)} options={HOVER} />
        </Row>
        <ColorPick hint="Авто - акцент палитры. Цвет рамки и свечения при наведении, подсветка фона - его оттенком" value={s.hoverColor} custom={s.hoverCustom}
          onChange={(v) => set('surfaces', 'hoverColor', v)} onCustom={(v) => set('surfaces', 'hoverCustom', v)} />
      </Group>

      <Group title="Профили" hint="Карточки подписок на странице «Профили». Превью само переходит на неё">
        <Row label="Текущий профиль" hint="Те же стили, что у выбранного сервера" stack>
          <div className="choice-grid">
            {SELECTED.map((o) => (
              <Choice key={o.value} active={s.profileSelected === o.value} onClick={() => setProfile('profileSelected', o.value)}>
                <span className="mini-card" style={selPreview(o.value, profT)}><i style={{ background: p.foreground }} /><b style={{ background: p.mutedForeground }} /></span>
                <span>{o.label}</span>
              </Choice>
            ))}
          </div>
        </Row>
        <Row label="Наведение на текущий" stack>
          <Segmented<SelectedHover> wrap size="sm" value={s.profileSelectedHover} onChange={(v) => setProfile('profileSelectedHover', v)} options={SELECTED_HOVER} />
        </Row>
        <Row label="Наведение на остальные" stack>
          <Segmented<HoverStyle> wrap size="sm" value={s.profileHover} onChange={(v) => setProfile('profileHover', v)} options={HOVER} />
        </Row>
        <Row label="Переключение" hint="Что происходит с карточкой, на которую щёлкнули, пока Koala Clash переключает профиль" stack>
          <Segmented<ProfileSwitch> wrap size="sm" value={s.profileSwitch} onChange={(v) => setProfile('profileSwitch', v)} options={PROFILE_SWITCH} />
        </Row>
        <ColorPick hint="Авто - цвета самого стиля. Текущий профиль, рамка и свечение при наведении - и у стиля клиента" value={s.profileColor} custom={s.profileCustom}
          onChange={(v) => setProfile('profileColor', v)} onCustom={(v) => setProfile('profileCustom', v)} />
      </Group>

      <Group title="Иконки групп прокси" hint="Картинки, которые провайдер задаёт группам. В клиенте они без подложки">
        <div className="choice-grid">
          {PLATES.map((o) => (
            <Choice key={o.value} active={s.iconPlate === o.value} onClick={() => set('surfaces', 'iconPlate', o.value)}>
              <span className={`gi gi-${o.value}`} style={{ '--p': iconT.primary, '--fg': p.foreground, '--st': p.stroke, '--sec': p.secondary, '--a': iconT.a, '--b': iconT.b,
                '--gi-r': SHAPE_R[s.iconShape], '--gi-pad': o.value === 'app' ? '0px' : `${s.iconPad}px` } as React.CSSProperties}><i /></span>
              <span>{o.label}</span>
            </Choice>
          ))}
        </div>
        {s.iconPlate !== 'app' && <Slider label="Отступ картинки" hint="Расстояние от картинки до края подложки" value={s.iconPad} min={0} max={10} unit="px" onChange={(v) => set('surfaces', 'iconPad', v)} />}
        {(s.iconPlate === 'tint' || s.iconPlate === 'power') && <ColorPick label="Цвет подложки" hint="Авто - акцент у «Акцента», цвета кнопки подключения у «Цвета кнопки»" value={s.iconColor} custom={s.iconCustom}
          onChange={(v) => set('surfaces', 'iconColor', v)} onCustom={(v) => set('surfaces', 'iconCustom', v)} />}
        <Row label="Форма" hint="И у картинок, и у цветных значков групп без картинки" stack>
          <Segmented<IconShape> wrap size="sm" value={s.iconShape} onChange={(v) => set('surfaces', 'iconShape', v)} options={SHAPES} />
        </Row>
        <Toggle label="Оживают при наведении" hint="Иконка чуть увеличивается и наклоняется, когда курсор над группой" checked={s.iconHover} onChange={(v) => set('surfaces', 'iconHover', v)} />
      </Group>

      <Group title="Боковая панель">
        <Row label="Фон панели" stack><Segmented<SidebarStyle> wrap size="sm" value={s.sidebar} onChange={(v) => set('surfaces', 'sidebar', v)} options={SIDEBAR} /></Row>
        <Row label="Активный пункт" stack>
          <div className="nav-demo">
            {NAV.map((o) => (
              <button key={o.value} type="button" className={cx('nav-demo-item', `nd-${o.value}`, s.navActive === o.value && 'active')} onClick={() => set('surfaces', 'navActive', o.value)}
                style={{ '--p': navT.primary, '--pf': navT.pf, '--fg': p.foreground, '--bg': p.background, '--ac': p.accent, '--st': navT.pick ?? p.stroke, '--a': navT.a, '--b': navT.b,
                  '--inv': navT.pick ?? p.foreground, '--inv-fg': navT.pick ? navT.pf : p.background, '--r': `${s.navRadius}px`, '--o': `${s.navOpacity}%` } as React.CSSProperties}>
                <span className="nd-pill"><i />{o.label}</span>
              </button>
            ))}
          </div>
        </Row>
        {s.navActive === 'liquid' && (
          <>
            <Slider label="Скругление пункта" hint="Пункт меню высотой 32px: от 16px - круг или капсула. Преломление берёт силу и кромку из «Жидкого стекла» карточек, только слабее"
              value={s.navRadius} min={0} max={16} unit="px" onChange={(v) => set('surfaces', 'navRadius', v)} />
            <Slider label="Непрозрачность пункта" hint="Насколько плотно пункт залит цветом акцента. 0 - чистое стекло: остаются только блики и тонкая кромка"
              value={s.navOpacity} min={0} max={100} unit="%" onChange={(v) => set('surfaces', 'navOpacity', v)} />
          </>
        )}
        <ColorPick hint="Авто - цвета самого стиля. У «Рамки» и «Увеличения» - цвет рамки, у «Инверсии» - заливка" value={s.navColor} custom={s.navCustom}
          onChange={(v) => set('surfaces', 'navColor', v)} onCustom={(v) => set('surfaces', 'navCustom', v)} />
      </Group>

      <DividersGroup />

      <Group title="Основные кнопки" hint="Кнопки «Сохранить», «Импортировать» и другие залитые акцентом">
        <div className="btn-demo">
          {BUTTONS.map((o) => (
            <button key={o.value} type="button" className={cx('btn-demo-item', s.buttons === o.value && 'active')} onClick={() => set('surfaces', 'buttons', o.value)}>
              <span className={`bd bd-${o.value}`} style={{ '--p': btnT.primary, '--pf': o.value === 'liquid' && s.buttonsOpacity < 45 ? p.foreground : btnT.pf, '--a': btnT.a, '--b': btnT.b,
                '--fg': p.foreground, '--r': `${s.buttonsRadius}px`, '--o': `${s.buttonsOpacity}%` } as React.CSSProperties}>Кнопка</span>
              <small>{o.label}</small>
            </button>
          ))}
        </div>
        {s.buttons === 'liquid' && (
          <>
            <Slider label="Скругление кнопок" hint="У всех кнопок с текстом, как у «Капсул». Кнопки высотой 36px: от 18px - капсула. Преломление берёт силу и кромку из «Жидкого стекла» карточек, только слабее"
              value={s.buttonsRadius} min={0} max={18} unit="px" onChange={(v) => set('surfaces', 'buttonsRadius', v)} />
            <Slider label="Непрозрачность кнопок" hint="Насколько плотно кнопки залиты цветом акцента. Ниже 45% текст на них - цвета текста темы: сквозь кнопку уже виден фон карточки, а не акцент"
              value={s.buttonsOpacity} min={0} max={100} unit="%" onChange={(v) => set('surfaces', 'buttonsOpacity', v)} />
          </>
        )}
        <ColorPick hint="Авто - акцент палитры, у «Градиента кнопки» - цвета кнопки подключения. Текст на кнопке станет чёрным или белым - что читается лучше" value={s.buttonsColor} custom={s.buttonsCustom}
          onChange={(v) => set('surfaces', 'buttonsColor', v)} onCustom={(v) => set('surfaces', 'buttonsCustom', v)} />
      </Group>
    </>
  );
}

/* ---------- Градиент карточек ---------- */

const CARD_GRADIENT_KINDS: { value: CardGradient; label: string }[] = [
  { value: 'soft', label: 'Лёгкий' }, { value: 'linear', label: 'Линейный' }, { value: 'radial', label: 'Радиальный' }, { value: 'conic', label: 'Конический' }
];

/** Свой градиент карточек: точки цвета, как у фона окна. Точки у светлой и тёмной схемы свои */
function CardGradientBlock() {
  const { config, update } = useCfg();
  const s = config.surfaces;
  const scheme = useEditScheme();
  const p = config.palette[scheme];
  // Как и остальные настройки карточек, любая правка градиента включает свои поверхности
  const edit = (fn: (c: ThemeConfig) => void, key?: string) => update((c) => { fn(c); c.surfaces.custom = true; }, key);
  const put = <K extends 'gradientAngle' | 'gradientX' | 'gradientY'>(k: K, v: Surfaces[K]) => edit((c) => { c.surfaces[k] = v; }, `surfaces.${k}`);
  const pickKind = (v: CardGradient) => edit((c) => {
    // Первый переход на свой градиент: точки - из палитры темы («Светлее сверху»), а не стандартной палитры клиента
    if (c.surfaces.gradientKind === 'soft' && v !== 'soft' && !c.surfaces.gradientPreset
      && JSON.stringify(c.surfaces.gradientStops) === JSON.stringify(defaultConfig().surfaces.gradientStops)) c.surfaces.gradientPreset = 'lighter';
    c.surfaces.gradientKind = v;
  });
  const own = s.gradientKind !== 'soft';
  return (
    <div className="card-grad" id="card-gradient">
      <Segmented<CardGradient> wrap size="sm" value={s.gradientKind} onChange={pickKind} options={CARD_GRADIENT_KINDS} />
      {!own && <p className="note">Карточка чуть светлее сверху - объём без теней. Свои цвета и положения - в линейном, радиальном и коническом.</p>}
      {own && (
        <>
          <CardGradientTiles />
          <p className="note">{s.gradientPreset
            ? 'Цвета заготовки берутся из палитры и меняются вместе с ней. Если подвинуть или перекрасить точку, градиент станет своим и от палитры отвяжется.'
            : 'Свои точки цвета: от палитры они не зависят. Заготовка выше снова свяжет градиент с палитрой.'}</p>
          {config.mode === 'both' && <SchemeSwitch note="Цвета для схемы" />}
          <GradientEditor stops={cardStops(s, p, scheme)} onChange={(stops) => edit((c) => { detachCardGradient(c); c.surfaces.gradientStops[scheme] = stops; }, 'surfaces.gradientStops')}
            swatches={[p.card, p.primary, p.powerOnStart, p.powerOnEnd, p.foreground, p.background, p.accent]} />
          <p className="note">Прозрачность точек - от непрозрачности карточек выше.</p>
          {s.gradientKind !== 'radial' && <Slider label="Угол" value={s.gradientAngle} min={0} max={360} unit="°" onChange={(v) => put('gradientAngle', v)} />}
          {s.gradientKind !== 'linear' && (
            <>
              <Slider label="Центр по горизонтали" value={s.gradientX} min={0} max={100} unit="%" onChange={(v) => put('gradientX', v)} />
              <Slider label="Центр по вертикали" value={s.gradientY} min={0} max={100} unit="%" onChange={(v) => put('gradientY', v)} />
            </>
          )}
        </>
      )}
    </div>
  );
}

/* ---------- Разделители ---------- */

const DIV_STYLES: { value: DividerStyle; label: string }[] = [
  { value: 'app', label: 'Как в клиенте' }, { value: 'solid', label: 'Сплошная' }, { value: 'fade', label: 'Тающая' }, { value: 'gradient', label: 'Градиент' },
  { value: 'dashed', label: 'Штрихи' }, { value: 'dotted', label: 'Точки' }, { value: 'double', label: 'Двойная' }, { value: 'hidden', label: 'Скрыть' }
];
const DIV_EFFECTS: { value: DividerEffect; label: string }[] = [
  { value: 'none', label: 'Нет' }, { value: 'glow', label: 'Свечение' }, { value: 'shimmer', label: 'Бегущий блик' }, { value: 'pulse', label: 'Пульс' }
];

function DividersGroup() {
  const { config, update } = useCfg();
  const setUi = useStore((st) => st.set);
  const p = config.palette[useEditScheme()];
  const [which, setWhich] = useState<'h' | 'v'>('h');
  const d = config.dividers[which];
  const put = <K extends keyof Divider>(k: K, v: Divider[K]) => update((c) => { c.dividers[which][k] = v; }, `dividers.${which}.${k}`);
  // Превью переходит туда, где эти полосы видно: горизонтальные - в настройках, вертикальные - на главной
  const pick = (w: 'h' | 'v') => { setWhich(w); setUi({ page: w === 'h' ? 'settings' : 'home' }); };

  const demo = (st: DividerStyle): React.CSSProperties => {
    const base = which === 'v' ? p.stroke : p.border;
    const raw = d.color === 'primary' ? p.primary : d.color === 'power' ? p.powerOnStart : d.color === 'custom' ? d.custom : base;
    const col = rgba(raw, d.opacity / 100);
    switch (st) {
      case 'hidden': return { background: 'transparent', outline: `1px dashed ${rgba(p.foreground, 0.2)}` };
      case 'fade': return { background: `linear-gradient(90deg, transparent, ${col}, transparent)` };
      case 'gradient': return { background: `linear-gradient(90deg, ${p.powerOnStart}, ${p.primary}, ${p.powerOnEnd})` };
      case 'dashed': return { background: `repeating-linear-gradient(90deg, ${col} 0 6px, transparent 6px 10px)` };
      case 'dotted': return { height: 3, background: `radial-gradient(circle closest-side, ${col} 92%, transparent) 0 50% / 7px 3px repeat-x` };
      case 'double': return { height: 4, background: `linear-gradient(${col}, ${col}) top / 100% 1px no-repeat, linear-gradient(${col}, ${col}) bottom / 100% 1px no-repeat` };
      case 'app': return { background: base };
      default: return { background: d.color === 'power' ? `linear-gradient(90deg, ${p.powerOnStart}, ${p.powerOnEnd})` : col };
    }
  };

  return (
    <Group title="Разделители" hint="Тонкие полосы между строками настроек, под панелью правил и логов, в окнах - и вертикальные полосы между цифрами подписки и трафика на главной">
      <Row label="Какие" stack>
        <Segmented<'h' | 'v'> size="sm" value={which} onChange={pick} options={[{ value: 'h', label: 'Горизонтальные' }, { value: 'v', label: 'Вертикальные на главной' }]} />
      </Row>
      <div className="div-grid">
        {DIV_STYLES.map((o) => (
          <Choice key={o.value} active={d.style === o.value} onClick={() => put('style', o.value)}>
            <span className="div-demo"><i style={demo(o.value)} /></span>
            <span>{o.label}</span>
          </Choice>
        ))}
      </div>
      {d.style !== 'hidden' && (
        <>
          {d.style !== 'gradient' && (
            <Row label="Цвет" stack>
              <Segmented size="sm" value={d.color} onChange={(v) => put('color', v)} options={[{ value: 'auto', label: 'Как в клиенте' }, { value: 'primary', label: 'Акцент' }, { value: 'power', label: 'Цвет кнопки' }, { value: 'custom', label: 'Свой' }]} />
            </Row>
          )}
          {d.color === 'custom' && d.style !== 'gradient' && <Row label="Свой цвет"><ColorField value={d.custom} onChange={(v) => put('custom', v)} /></Row>}
          <Slider label="Непрозрачность" value={d.opacity} min={10} max={100} unit="%" onChange={(v) => put('opacity', v)} />
          <Slider label="Толщина" hint={which === 'h' ? 'Высота полосы' : 'Ширина полосы'} value={d.size} min={1} max={6} unit="px" onChange={(v) => put('size', v)} />
          <Slider label="Длина" hint={which === 'h' ? 'Короткая полоса встаёт по центру строки' : 'Высота полосы от обычной'} value={d.length} min={20} max={which === 'h' ? 100 : 150} step={5} unit="%" onChange={(v) => put('length', v)} />
          <Row label="Эффект" stack><Segmented size="sm" wrap value={d.effect} onChange={(v) => put('effect', v)} options={DIV_EFFECTS} /></Row>
        </>
      )}
    </Group>
  );
}

const SHADOWS: { value: ShadowPreset; label: string }[] = [
  { value: 'app', label: 'Как в клиенте' }, { value: 'none', label: 'Без теней' }, { value: 'soft', label: 'Мягкие' }, { value: 'medium', label: 'Средние' },
  { value: 'floating', label: 'Парящие' }, { value: 'layered', label: 'Многослойные' }, { value: 'glow', label: 'Свечение' }, { value: 'gradient', label: 'Градиентные' },
  { value: 'ambient', label: 'Подсветка снизу' }, { value: 'neumorph', label: 'Неоморфизм' }, { value: 'hard', label: 'Жёсткие' }, { value: 'retro', label: 'Ретро' },
  { value: 'long', label: 'Длинные' }, { value: 'dual', label: 'Двухцветные' }, { value: 'outline', label: 'Контур' }, { value: 'inner', label: 'Внутренние' }
];

export function ShadowsPanel() {
  const { config, set } = useCfg();
  const scheme = useEditScheme();
  const s = config.shadows;
  const p = config.palette[scheme];
  const tune = s.preset !== 'app' && s.preset !== 'none';
  const directional = !['glow', 'outline', 'inner'].includes(s.preset);

  return (
    <>
      <PanelHead title="Тени" text="Глубина интерфейса: тени карточек, окон и кнопок. Направление, дальность и цвет настраиваются для любого стиля." />
      <Group title="Стиль теней">
        <div className="shadow-grid" style={{ background: p.background }}>
          {SHADOWS.map((o) => {
            const sh = o.value === 'app' ? null : shadowSet({ ...s, preset: o.value }, scheme, p, config.surfaces.highlight, config.surfaces.highlightBottom);
            return (
              <button key={o.value} type="button" className={cx('shadow-tile', s.preset === o.value && 'active')} onClick={() => set('shadows', 'preset', o.value)}>
                <span style={{ background: p.card, boxShadow: sh?.card ?? 'none', borderColor: o.value === 'hard' || o.value === 'retro' ? p.foreground : p.stroke }} />
                <small style={{ color: p.foreground }}>{o.label}</small>
              </button>
            );
          })}
        </div>
      </Group>
      {tune && (
        <Group title="Параметры">
          <Slider label="Интенсивность" value={s.intensity} min={0} max={250} unit="%" onChange={(v) => set('shadows', 'intensity', v)} />
          {directional && (
            <div className="angle-row">
              <div className="angle-dial" style={{ '--a': `${s.angle}deg` } as React.CSSProperties}
                onPointerDown={(e) => {
                  const el = e.currentTarget, r = el.getBoundingClientRect();
                  const move = (ev: PointerEvent | React.PointerEvent) => {
                    const a = Math.round((Math.atan2(ev.clientY - (r.top + r.height / 2), ev.clientX - (r.left + r.width / 2)) * 180) / Math.PI);
                    set('shadows', 'angle', (a + 360) % 360);
                  };
                  move(e);
                  const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
                  window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
                }} title="Направление тени: потяните стрелку"><i /></div>
              <div className="angle-sliders">
                <Slider label="Направление" hint="Куда падает тень: 90° - вниз, 0° - вправо, 180° - влево, 270° - вверх" value={s.angle} min={0} max={359} unit="°" onChange={(v) => set('shadows', 'angle', v)} />
              </div>
            </div>
          )}
          <Slider label="Дальность" hint="Насколько далеко тень отходит от карточки" value={s.distance} min={0} max={300} step={5} unit="%" onChange={(v) => set('shadows', 'distance', v)} />
          <Slider label="Размытие" value={s.blur} min={0} max={300} step={5} unit="%" onChange={(v) => set('shadows', 'blur', v)} />
          <Slider label="Разброс" hint="Тень шире (плюс) или уже (минус) самой карточки" value={s.spread} min={-12} max={12} unit="px" onChange={(v) => set('shadows', 'spread', v)} />
          {(s.preset === 'hard' || s.preset === 'retro') && <Slider label="Смещение" value={s.hardOffset} min={1} max={12} unit="px" onChange={(v) => set('shadows', 'hardOffset', v)} />}
          <Slider label="При наведении" hint="Насколько тень усиливается при наведении на карточку (если наведение - «Подъём»)" value={s.hover} min={100} max={250} step={5} unit="%" onChange={(v) => set('shadows', 'hover', v)} />
          <Row label="Цвет тени" stack>
            <Segmented size="sm" value={s.color} onChange={(v) => set('shadows', 'color', v)} options={[
              { value: 'auto', label: s.preset === 'hard' ? 'Цвет текста' : 'Авто' }, { value: 'primary', label: 'Акцент' }, { value: 'power', label: 'Кнопка' }, { value: 'custom', label: 'Свой' }
            ]} />
          </Row>
          {s.color === 'custom' && <Row label="Свой цвет"><ColorField value={s.customColor} onChange={(v) => set('shadows', 'customColor', v)} /></Row>}
        </Group>
      )}
      {s.preset !== 'app' && (
        <Group title="Где показывать">
          <Toggle label="Карточки и плитки" checked={s.cards} onChange={(v) => set('shadows', 'cards', v)} />
          <Toggle label="Окна, меню, уведомления" checked={s.popups} onChange={(v) => set('shadows', 'popups', v)} />
          <Toggle label="Кнопки" checked={s.buttons} onChange={(v) => set('shadows', 'buttons', v)} />
          <Toggle label="Кнопка подключения" hint="Тень карточек под кнопкой на главной, при наведении - тень наведения. У шаров (сфера, сеть, глобус, звёздный шар, плазма) своя подсветка - им тень не добавляется"
            checked={s.power} onChange={(v) => set('shadows', 'power', v)} />
        </Group>
      )}
      <p className="note">Тень текста настраивается в разделе «Шрифты».</p>
    </>
  );
}
