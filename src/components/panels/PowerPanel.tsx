// Разделы "Кнопка подключения" и "Анимации".

import { useMemo } from 'react';
import { RotateCcw } from 'lucide-react';
import { useStore, useEditScheme } from '../../state/store';
import { EASE } from '../../lib/generator';
import { sphereImage } from '../../lib/sphere';
import { POWER_PLAIN, POWER_STRETCH, POWER_TOGGLES } from '../../lib/power';
import type { ClickEffect, DayScene, Easing, Entrance, PowerFill, PowerHover, PowerIcon, PowerIdle, PowerRing, PowerShape, PowerStyle, PowerVolume, ToggleLook } from '../../lib/types';
import { ColorField } from '../ColorPicker';
import { Button, Choice, Group, Row, Segmented, Slider, Toggle, cx } from '../ui';
import { PanelHead, useCfg } from './common';

const STYLES: { value: PowerStyle; label: string; note: string; fun?: boolean }[] = [
  { value: 'app', label: 'Как в клиенте', note: 'Стандартный круг, настраиваются цвета и эффекты ниже' },
  { value: 'glow', label: 'Свечение', note: 'Мягкий ореол и кольцо вокруг' },
  { value: 'pulse', label: 'Пульс', note: 'Расходящиеся кольца, как сонар' },
  { value: 'ring', label: 'Кольцо', note: 'Плавное градиентное кольцо вращается' },
  { value: 'glass', label: 'Стекло', note: 'Объёмный стеклянный шар с бликом' },
  { value: 'neon', label: 'Неон', note: 'Светящаяся неоновая трубка' },
  { value: 'minimal', label: 'Минимал', note: 'Плоский круг с тонкой рамкой' },
  { value: 'sphere', label: 'Сфера из частиц', note: 'Как в Koala Sage & Night: 150 вращающихся точек' },
  { value: 'network', label: 'Сеть', note: 'Шар-сеть: точки и связи вращаются, узлы мерцают, по связям бегут сигналы' },
  { value: 'globe', label: 'Глобус', note: 'Вращающаяся сетка меридианов и параллелей с огоньками городов' },
  { value: 'dots', label: 'Звёздный шар', note: 'Шар из 600 частиц вращается в 3D: ближние крупнее и ярче, дальние гаснут, вспыхивают искры' },
  { value: 'plasma', label: 'Плазма', note: 'Энергошар: внутри закручиваются два встречных вихря' },
  { value: 'rocket', label: 'Ракета', note: 'Стоит на земле, при подключении взлетает с пламенем', fun: true },
  { value: 'orbit', label: 'Орбита', note: 'Планета, вокруг кружат спутники', fun: true },
  { value: 'radar', label: 'Радар', note: 'Бегущий луч и отметки целей', fun: true },
  { value: 'liquid', label: 'Жидкость', note: 'Наполняется волнами при подключении', fun: true },
  { value: 'equalizer', label: 'Эквалайзер', note: 'Полоски танцуют, пока есть соединение', fun: true },
  { value: 'heartbeat', label: 'Кардиограмма', note: 'Линия пульса и биение сердца', fun: true },
  { value: 'portal', label: 'Портал', note: 'Закручивающийся вихрь', fun: true },
  { value: 'toggle', label: 'Тумблер', note: 'Большой переключатель вместо круга', fun: true },
  { value: 'daynight', label: 'День и ночь', note: 'Тумблер-пейзаж: солнце и облака сменяются луной и звёздами', fun: true }
];
const RINGS: { value: PowerRing; label: string }[] = [
  { value: 'app', label: 'Как в клиенте' }, { value: 'gradient', label: 'Градиент' }, { value: 'primary', label: 'Акцент' }, { value: 'foreground', label: 'Цвет текста' }, { value: 'custom', label: 'Свой' }
];
const VOLUMES: { value: PowerVolume; label: string }[] = [
  { value: 'none', label: 'Плоская' }, { value: 'convex', label: 'Выпуклая' }, { value: 'concave', label: 'Вдавленная' }, { value: 'gloss', label: 'Глянец' }
];

export function PowerPanel() {
  const { config, set, update } = useCfg();
  const setUi = useStore((s) => s.set);
  const power = useStore((s) => s.power);
  const p = config.palette[useEditScheme()];
  const pw = config.power;
  const orb = { '--a': p.powerOnStart, '--b': p.powerOnEnd, '--s': p.powerOnStroke, '--bg': p.background, '--c': p.card, '--p': p.primary } as React.CSSProperties;
  const pick = (v: PowerStyle) => {
    update((c) => {
      c.power.style = v;
      // Стиль "Свечение" без подсветки выглядит как стандартный - включаем её
      if (v === 'glow' && c.power.glow === 0) c.power.glow = 60;
    });
    setUi({ page: 'home', power: power === 'off' ? 'on' : power });
  };
  const standard = !['sphere', 'rocket', 'equalizer', 'heartbeat', 'toggle', 'daynight', 'network', 'globe', 'dots'].includes(pw.style);
  const ball = ['sphere', 'network', 'globe', 'dots', 'plasma'].includes(pw.style);
  const toggle = POWER_TOGGLES.includes(pw.style);
  const plain = POWER_PLAIN.includes(pw.style);
  // Превью SVG-сфер - те же картинки, что попадут в тему: вращение под курсором, в покое неподвижный кадр
  const nets = useMemo(() => ({
    '--net': sphereImage('network', true, 40), '--globe': sphereImage('globe', true, 30), '--dots': sphereImage('dots', true, 24),
    '--net-s': sphereImage('network', false, 40), '--globe-s': sphereImage('globe', false, 30), '--dots-s': sphereImage('dots', false, 24)
  }) as React.CSSProperties, []);

  return (
    <>
      <PanelHead title="Кнопка подключения" text="Главная кнопка на домашней странице. Цвета берутся из палитры (группа «Кнопка подключения»)." />
      <div className="power-states">
        {(['off', 'loading', 'on', 'error'] as const).map((s) => (
          <button key={s} type="button" className={cx('chip', power === s && 'active')} onClick={() => setUi({ power: s, page: 'home' })}>
            {{ off: 'Отключено', loading: 'Подключение', on: 'Подключено', error: 'Ошибка' }[s]}
          </button>
        ))}
      </div>
      <Group title="Стиль">
        <div className="power-grid">
          {STYLES.map((o) => (
            <Choice key={o.value} active={pw.style === o.value} onClick={() => pick(o.value)} title={o.note} className={o.fun ? 'choice-fun' : undefined}>
              <span className={`orb orb-${o.value}`} style={o.value === 'network' || o.value === 'globe' || o.value === 'dots' ? { ...orb, ...nets } : orb}><i /></span>
              <span className="choice-title">{o.label}</span>
              <small>{o.note}</small>
            </Choice>
          ))}
        </div>
      </Group>

      <Group title="Подсветка позади" hint="Цветное свечение под кнопкой. Работает с любым стилем, кроме сферы (у неё своё)">
        <Slider label="Сила" value={pw.glow} min={0} max={100} unit="%" onChange={(v) => set('power', 'glow', v)} />
        {pw.glow > 0 && (
          <>
            <Slider label="Размер" value={pw.glowSize} min={100} max={300} step={5} unit="%" onChange={(v) => set('power', 'glowSize', v)} />
            <Slider label="Мягкость" value={pw.glowBlur} min={0} max={60} unit="px" onChange={(v) => set('power', 'glowBlur', v)} />
            <Row label="Цвет" stack>
              <Segmented size="sm" value={pw.glowColor} onChange={(v) => set('power', 'glowColor', v)} options={[{ value: 'power', label: 'Цвет кнопки' }, { value: 'primary', label: 'Акцент' }, { value: 'custom', label: 'Свой' }]} />
            </Row>
            {pw.glowColor === 'custom' && <Row label="Свой цвет"><ColorField value={pw.glowCustom} onChange={(v) => set('power', 'glowCustom', v)} /></Row>}
            <Toggle label="Светиться и когда отключено" checked={pw.glowOff} onChange={(v) => set('power', 'glowOff', v)} />
            <Toggle label="Дышать при подключении" checked={pw.glowPulse} onChange={(v) => set('power', 'glowPulse', v)} />
          </>
        )}
      </Group>

      {toggle && (
        <Group title="Тумблер">
          {pw.style === 'toggle' && (
            <>
              <Row label="Вид"><Segmented<ToggleLook> size="sm" value={pw.toggleLook} onChange={(v) => set('power', 'toggleLook', v)} options={[{ value: 'classic', label: 'Классический' }, { value: 'glass', label: 'Стекло' }]} /></Row>
              {pw.toggleLook === 'glass' && (
                <>
                  <p className="note">Дорожка - стекло карточек из «Поверхностей»: непрозрачность, градиент, размытие, насыщенность, шероховатость, цвет и заметность рамки, блики по верхней и нижней кромке. Толщина рамки - ниже, в «Форме и заливке».</p>
                  <Toggle label="Свечение ручки" hint="Ручка светится цветом кнопки подключения, свет растекается по стеклу. Выключите - останется ручка цвета кнопки с обычной тенью" checked={pw.toggleGlow} onChange={(v) => set('power', 'toggleGlow', v)} />
                </>
              )}
              <Toggle label="Значок на ручке" hint="Питание и пауза. Спиннер подключения и знак ошибки видны всегда" checked={pw.toggleIcon} onChange={(v) => set('power', 'toggleIcon', v)} />
            </>
          )}
          {pw.style === 'daynight' && (
            <>
              <Row label="Пейзаж"><Segmented<DayScene> size="sm" value={pw.dayScene} onChange={(v) => set('power', 'dayScene', v)} options={[{ value: 'clouds', label: 'Облака' }, { value: 'hills', label: 'Холмы' }]} /></Row>
              <Toggle label="День, когда подключено" hint="Выключите - и подключение будет ночью, а отключённая кнопка - днём" checked={pw.dayOn} onChange={(v) => set('power', 'dayOn', v)} />
            </>
          )}
        </Group>
      )}

      <Group title="Форма и заливка">
        <Slider label="Размер" value={pw.size} min={70} max={150} unit="%" onChange={(v) => set('power', 'size', v)} />
        {!ball && !toggle && (
          <Row label="Форма"><Segmented<PowerShape> size="sm" value={pw.shape} options={[{ value: 'circle', label: 'Круг' }, { value: 'squircle', label: 'Сквиркл' }, { value: 'square', label: 'Квадрат' }]}
            onChange={(v) => update((c) => { c.power.shape = v; if (v !== 'circle') c.power.corner = v === 'square' ? 20 : 34; })} /></Row>
        )}
        {!ball && !toggle && pw.shape !== 'circle' && <Slider label="Скругление углов" hint="Доля от высоты кнопки. 50% - углы полностью круглые" value={pw.corner} min={0} max={50} unit="%" onChange={(v) => set('power', 'corner', v)} />}
        {POWER_STRETCH.includes(pw.style) && <Slider label="Ширина" hint="Круг шире 100% становится капсулой, сквиркл и квадрат - прямоугольником" value={pw.stretch} min={100} max={200} step={5} unit="%" onChange={(v) => set('power', 'stretch', v)} />}
        {standard && !ball && (
          <>
            <Row label="Заливка" stack>
              <Segmented<PowerFill> wrap size="sm" value={pw.fill} onChange={(v) => set('power', 'fill', v)} options={[
                { value: 'app', label: 'Как в клиенте' }, { value: 'radial', label: 'Радиальная' }, { value: 'linear', label: 'Линейная' }, { value: 'conic', label: 'Коническая' }, { value: 'solid', label: 'Сплошная' }, { value: 'none', label: 'Прозрачная' }
              ]} />
            </Row>
            {pw.fill !== 'app' && pw.fill !== 'none' && pw.style !== 'glass' && <Slider label="Плотность заливки" value={pw.fillOpacity} min={10} max={100} unit="%" onChange={(v) => set('power', 'fillOpacity', v)} />}
            {(pw.fill === 'radial' || pw.fill === 'linear' || pw.fill === 'conic' || (plain && pw.ringColor === 'gradient')) && (
              <Slider label="Направление" hint="Угол градиента заливки и градиентной рамки. У радиальной заливки - откуда падает свет" value={pw.fillAngle} min={0} max={360} unit="°" onChange={(v) => set('power', 'fillAngle', v)} />
            )}
          </>
        )}
        {!ball && <Slider label={pw.style === 'daynight' ? 'Толщина рамки дорожки' : 'Толщина рамки'} value={pw.ringWidth} min={0} max={6} step={0.5} unit="px" onChange={(v) => set('power', 'ringWidth', v)} />}
        {pw.style === 'glass' && <p className="note">Стекло - как у карточек в «Поверхностях»: непрозрачность (она же плотность заливки), размытие, насыщенность, шероховатость, цвет и заметность рамки, блики по верхней и нижней кромке. «Прозрачная» заливка - стекло цвета карточек.</p>}
        {pw.style === 'glass' && <Slider label="Размер блика" hint="Светлое пятно сверху, как на стеклянном шаре. 0 - без блика" value={pw.glassShine} min={0} max={200} step={5} unit="%" onChange={(v) => set('power', 'glassShine', v)} />}
        {plain && (
          <>
            <Row label="Цвет рамки" hint="Градиент - цветами кнопки подключения, по направлению выше" stack>
              <Segmented<PowerRing> wrap size="sm" value={pw.ringColor} onChange={(v) => set('power', 'ringColor', v)} options={RINGS} />
            </Row>
            {pw.ringColor === 'custom' && <Row label="Свой цвет"><ColorField value={pw.ringCustom} onChange={(v) => set('power', 'ringCustom', v)} /></Row>}
            <Slider label="Внешнее кольцо" hint="Второе тонкое кольцо вокруг кнопки с зазором. 0 - нет" value={pw.outerRing} min={0} max={6} step={0.5} unit="px" onChange={(v) => set('power', 'outerRing', v)} />
            {pw.outerRing > 0 && <Slider label="Зазор до кольца" value={pw.outerGap} min={2} max={16} unit="px" onChange={(v) => set('power', 'outerGap', v)} />}
          </>
        )}
        {pw.style === 'sphere' && <Slider label="Размер частиц" value={pw.sphereDot} min={0.8} max={3} step={0.1} unit="px" onChange={(v) => set('power', 'sphereDot', v)} />}
        {!ball && (
          <>
            <Toggle label="Тень из вкладки «Тени»" hint="Тень карточек под кнопкой, при наведении - тень наведения. То же, что «Тени» → «Где показывать» → «Кнопка подключения»"
              checked={config.shadows.power} onChange={(v) => set('shadows', 'power', v)} />
            {config.shadows.power && config.shadows.preset === 'app' && <p className="note">Сейчас тени «Как в клиенте» - выберите стиль во вкладке «Тени», и тень появится.</p>}
          </>
        )}
      </Group>

      {plain && (
        <Group title="Объём">
          <Segmented<PowerVolume> wrap size="sm" value={pw.volume} onChange={(v) => set('power', 'volume', v)} options={VOLUMES} />
          <Slider label="Тень под кнопкой" value={pw.drop} min={0} max={100} unit="%" onChange={(v) => set('power', 'drop', v)} />
        </Group>
      )}

      {standard && (
        <Group title="Иконка">
          <Segmented<PowerIcon> wrap size="sm" value={pw.icon} onChange={(v) => set('power', 'icon', v)} options={[
            { value: 'app', label: 'Белая' }, { value: 'foreground', label: 'Цвет текста' }, { value: 'primary', label: 'Акцент' }, { value: 'power', label: 'Цвет кнопки' }, { value: 'custom', label: 'Свой' }, { value: 'hide', label: 'Скрыть' }
          ]} />
          {pw.icon === 'custom' && <Row label="Свой цвет"><ColorField value={pw.iconCustom} onChange={(v) => set('power', 'iconCustom', v)} /></Row>}
          {pw.icon !== 'hide' && <Slider label="Размер иконки" value={pw.iconSize} min={50} max={140} unit="%" onChange={(v) => set('power', 'iconSize', v)} />}
        </Group>
      )}

      <Group title="Поведение">
        {pw.style !== 'sphere' && (
          <>
            <Row label="Наведение" stack>
              <Segmented<PowerHover> wrap size="sm" value={pw.hover} onChange={(v) => set('power', 'hover', v)} options={[
                { value: 'app', label: 'Как в клиенте' }, { value: 'scale', label: 'Увеличение' }, { value: 'lift', label: 'Подъём' }, { value: 'tilt', label: 'Наклон' }, { value: 'glow', label: 'Ярче подсветка' }, { value: 'none', label: 'Без отклика' }
              ]} />
            </Row>
            <Row label="В покое (отключено)" stack>
              <Segmented<PowerIdle> wrap size="sm" value={pw.idle} onChange={(v) => set('power', 'idle', v)} options={[
                { value: 'none', label: 'Стоит' }, { value: 'float', label: 'Парит' }, { value: 'breathe', label: 'Дышит' }, { value: 'wobble', label: 'Покачивается' }
              ]} />
            </Row>
          </>
        )}
        <Toggle label="Анимации стиля" hint="Вращение, волны, пламя и другие движения выбранного стиля" checked={pw.animate} onChange={(v) => set('power', 'animate', v)} />
        <Slider label="Скорость анимаций" value={pw.speed} min={0.3} max={3} step={0.1} unit="×" onChange={(v) => set('power', 'speed', v)} />
      </Group>
    </>
  );
}

const EASINGS: { value: Easing; label: string }[] = [
  { value: 'app', label: 'Как в клиенте' }, { value: 'smooth', label: 'Плавная' }, { value: 'spring', label: 'Пружина' }, { value: 'snappy', label: 'Резкая' }, { value: 'bounce', label: 'С отскоком' }, { value: 'linear', label: 'Линейная' }
];
const ENTRANCES: { value: Entrance; label: string }[] = [
  { value: 'none', label: 'Нет' }, { value: 'fade', label: 'Проявление' }, { value: 'rise', label: 'Всплытие' }, { value: 'scale', label: 'Увеличение' },
  { value: 'blur', label: 'Из размытия' }, { value: 'slide', label: 'Сдвиг' }, { value: 'flip', label: 'Переворот' }
];
const CLICKS: { value: ClickEffect; label: string; note: string }[] = [
  { value: 'none', label: 'Нет', note: 'Без эффекта' },
  { value: 'wave', label: 'Волна', note: 'Кольцо расходится из центра - как в Koala Sage & Night' },
  { value: 'double', label: 'Двойная волна', note: 'Два кольца одно за другим' },
  { value: 'ripple', label: 'Капля', note: 'Заливка растекается из центра и гаснет' },
  { value: 'flash', label: 'Вспышка', note: 'Карточка коротко вспыхивает цветом' },
  { value: 'glow', label: 'Сияние', note: 'Свет изнутри по краям карточки' },
  { value: 'border', label: 'Рамка', note: 'Рамка загорается и гаснет' },
  { value: 'shine', label: 'Блик', note: 'Полоса света пробегает по карточке' },
  { value: 'sparks', label: 'Искры', note: 'Искры разлетаются из центра и гаснут' },
  { value: 'confetti', label: 'Конфетти', note: 'Разноцветные искры в цветах кнопки подключения и акцента' },
  { value: 'corners', label: 'Прицел', note: 'Уголки сжимаются к центру и разлетаются к краям - как захват цели' },
  { value: 'scan', label: 'Скан', note: 'Яркая линия со шлейфом проходит слева направо' },
  { value: 'fill', label: 'Заливка', note: 'Цвет наплывает слева направо и растворяется' },
  { value: 'echo', label: 'Эхо', note: 'Кольцо расходится наружу от рамки карточки' }
];
/** Что меняет ползунок размера у каждого эффекта */
const CLICK_SIZE: Partial<Record<ClickEffect, [string, string]>> = {
  wave: ['Толщина', 'px'], double: ['Толщина', 'px'], glow: ['Толщина', 'px'], border: ['Толщина', 'px'], shine: ['Ширина блика', '%'],
  sparks: ['Размер искр', 'px'], confetti: ['Размер искр', 'px'], corners: ['Длина уголков', 'px'], scan: ['Шлейф', '%'], echo: ['Размах', 'px']
};

export function MotionPanel() {
  const { config, set } = useCfg();
  const m = config.motion;
  const p = config.palette[useEditScheme()];
  const setUi = useStore((s) => s.set);
  const replay = () => {
    const page = useStore.getState().page;
    const w = document.querySelector<HTMLIFrameElement>('.app-window iframe')?.contentWindow as (Window & { KT?: { replay: () => void } }) | null;
    if (page === 'home') setUi({ page: 'proxies' });
    setTimeout(() => w?.KT?.replay(), 30);
  };
  const fxColor = m.clickColor === 'power' ? p.powerOnStart : m.clickColor === 'foreground' ? p.foreground : m.clickColor === 'custom' ? m.clickCustom : p.primary;

  return (
    <>
      <PanelHead title="Анимации" text="Скорость и характер движения, появление карточек, эффекты нажатия и всплывающие окна." />
      <Group title="Скорость и кривая">
        <Slider label="Длительность" hint="Множитель для всех переходов темы: 0.5 - вдвое быстрее, 2 - вдвое медленнее" value={m.speed} min={0.25} max={3} step={0.05} unit="×" onChange={(v) => set('motion', 'speed', v)} />
        <div className="ease-grid">
          {EASINGS.map((e) => (
            <Choice key={e.value} active={m.easing === e.value} onClick={() => set('motion', 'easing', e.value)}>
              <span className="ease-track"><i style={{ animationTimingFunction: e.value === 'app' ? 'ease' : EASE[e.value], animationDuration: `${1.4 * m.speed}s` }} /></span>
              <span>{e.label}</span>
            </Choice>
          ))}
        </div>
      </Group>

      <Group title="Эффект нажатия" hint="Что происходит в момент клика. Попробуйте прямо на плитках ниже - или в окне клиента">
        <div className="fx-grid">
          {CLICKS.map((c) => (
            <Choice key={c.value} active={m.click === c.value} onClick={() => set('motion', 'click', c.value)} title={c.note}>
              <span className={`fx-demo fx-${c.value}`} style={{ '--fx': fxColor, '--fx-d': `${m.clickDuration}ms`, '--fx-o': `${m.clickOpacity}%`, '--fx-s': `${m.clickSize}px`, '--fx-a': p.powerOnStart, '--fx-b': p.powerOnEnd, '--fx-c': p.primary } as React.CSSProperties}>
                <i /><b />
              </span>
              <span>{c.label}</span>
            </Choice>
          ))}
        </div>
        {/* Вдавливание работает с любым эффектом - держим его сразу под плитками, а не после настроек эффекта */}
        <Toggle label="Нажатие «вдавливает» кнопки и карточки" checked={m.press} onChange={(v) => set('motion', 'press', v)} />
        {m.press && <Slider label="Глубина" value={100 - m.pressScale} min={1} max={10} unit="%" onChange={(v) => set('motion', 'pressScale', 100 - v)} />}
        {m.click !== 'none' && (
          <>
            <Row label="Цвет" stack>
              <Segmented size="sm" value={m.clickColor} onChange={(v) => set('motion', 'clickColor', v)} options={[
                { value: 'primary', label: 'Акцент' }, { value: 'power', label: 'Цвет кнопки' }, { value: 'foreground', label: 'Цвет текста' }, { value: 'custom', label: 'Свой' }
              ]} />
            </Row>
            {m.clickColor === 'custom' && <Row label="Свой цвет"><ColorField value={m.clickCustom} onChange={(v) => set('motion', 'clickCustom', v)} /></Row>}
            <Slider label="Длительность" value={m.clickDuration} min={250} max={3000} step={50} unit="мс" onChange={(v) => set('motion', 'clickDuration', v)} />
            {CLICK_SIZE[m.click] && <Slider label={CLICK_SIZE[m.click]![0]} value={m.clickSize} min={4} max={40} unit={CLICK_SIZE[m.click]![1]} onChange={(v) => set('motion', 'clickSize', v)} />}
            <Slider label="Яркость" value={m.clickOpacity} min={10} max={100} unit="%" onChange={(v) => set('motion', 'clickOpacity', v)} />
            <div className="targets">
              <span className="row-label">Где работает</span>
              <Toggle label="Карточки серверов" checked={m.clickProxies} onChange={(v) => set('motion', 'clickProxies', v)} />
              <Toggle label="Заголовки групп" checked={m.clickGroups} onChange={(v) => set('motion', 'clickGroups', v)} />
              <Toggle label="Карточки профилей" checked={m.clickProfiles} onChange={(v) => set('motion', 'clickProfiles', v)} />
              <Toggle label="Кнопки" checked={m.clickButtons} onChange={(v) => set('motion', 'clickButtons', v)} />
              <Toggle label="Пункты бокового меню" checked={m.clickNav} onChange={(v) => set('motion', 'clickNav', v)} />
            </div>
          </>
        )}
      </Group>

      <Group title="Появление карточек" aside={<Button size="sm" variant="soft" icon={<RotateCcw size={13} />} onClick={replay}>Проиграть</Button>}
        hint="Анимация, с которой карточки появляются при переходе на страницу">
        <div className="entrance-grid">
          {ENTRANCES.map((e) => (
            <Choice key={e.value} active={m.entrance === e.value} onClick={() => { set('motion', 'entrance', e.value); setTimeout(replay, 60); }}>
              <span className={`ent ent-${e.value}`}><i /><i /><i /></span>
              <span>{e.label}</span>
            </Choice>
          ))}
        </div>
        {m.entrance !== 'none' && <Slider label="Каскад" hint="Задержка между соседними карточками. 0 - все сразу" value={m.stagger} min={0} max={120} step={5} unit="мс" onChange={(v) => set('motion', 'stagger', v)} />}
      </Group>
      <Group title="Окна и меню">
        <Row label="Появление" stack>
          <Segmented wrap size="sm" value={m.popups} onChange={(v) => set('motion', 'popups', v)} options={[
            { value: 'app', label: 'Как в клиенте' }, { value: 'spring', label: 'Пружина' }, { value: 'fade', label: 'Проявление' }, { value: 'none', label: 'Без анимации' }
          ]} />
        </Row>
        <Toggle label="Уважать системное «убрать анимации»" hint="Если в Windows выключены эффекты анимации, тема станет статичной" checked={m.reduce} onChange={(v) => set('motion', 'reduce', v)} />
      </Group>
    </>
  );
}
