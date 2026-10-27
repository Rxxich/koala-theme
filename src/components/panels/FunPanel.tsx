// Раздел "Разное": нестандартные эффекты, которых нет в обычных темах.

import { useEffect } from 'react';
import { useStore, useEditScheme } from '../../state/store';
import type { Particles, PingGlow } from '../../lib/types';
import { ColorField } from '../ColorPicker';
import { Choice, Group, Row, Segmented, Slider, Toggle, cx } from '../ui';
import { PanelHead, useCfg } from './common';

const PING: { value: PingGlow; label: string }[] = [
  { value: 'none', label: 'Нет' }, { value: 'bar', label: 'Полоска' }, { value: 'dot', label: 'Точка' }, { value: 'glow', label: 'Свечение' }, { value: 'tint', label: 'Заливка' }
];
const PARTICLES: { value: Particles; label: string }[] = [
  { value: 'none', label: 'Нет' }, { value: 'snow', label: 'Снег' }, { value: 'stars', label: 'Звёзды' }, { value: 'fireflies', label: 'Светлячки' },
  { value: 'rain', label: 'Дождь' }, { value: 'sakura', label: 'Лепестки' }, { value: 'bubbles', label: 'Пузыри' }, { value: 'confetti', label: 'Конфетти' }
];

export function FunPanel() {
  const { config, set } = useCfg();
  const setUi = useStore((s) => s.set);
  const f = config.fun;
  const p = config.palette[useEditScheme()];
  useEffect(() => { setUi({ page: 'proxies' }); }, [setUi]);
  const vars = { '--ok': p.success, '--mid': p.warning, '--bad': p.destructive, '--c': p.card, '--st': p.stroke, '--fg': p.foreground } as React.CSSProperties;

  return (
    <>
      <PanelHead title="Разное" text="Нестандартные эффекты: интерфейс реагирует на пинг и подключение, падает снег, выбранный сервер обводит бегущий свет." />

      <Group title="Подсветка по пингу" hint="Карточка сервера окрашивается по задержке, как цифры пинга в клиенте: зелёный - до 500 мс, жёлтый - 500 мс и больше, красный - сервер не ответил. Цвета - из палитры (Успех, Предупреждение, Ошибка)">
        <div className="ping-grid" style={vars}>
          {PING.map((o) => (
            <Choice key={o.value} active={f.ping === o.value} onClick={() => set('fun', 'ping', o.value)}>
              <span className={cx('ping-demo', `pd-${o.value}`)}><i style={{ '--k': 'var(--ok)' } as React.CSSProperties} /><i style={{ '--k': 'var(--mid)' } as React.CSSProperties} /><i style={{ '--k': 'var(--bad)' } as React.CSSProperties} /></span>
              <span>{o.label}</span>
            </Choice>
          ))}
        </div>
        {f.ping !== 'none' && (
          <Toggle label="Скрыть цифры пинга" hint="О задержке говорит цвет карточки. Цифры появляются при наведении на кнопку проверки, нажатие по-прежнему перепроверяет сервер" checked={f.pingHide} onChange={(v) => set('fun', 'pingHide', v)} />
        )}
        {f.ping !== 'none' && f.pingHide && (
          <Toggle label="Не показывать и при наведении" hint="Цифр не будет совсем, только цвет карточки, и место пинга не подсвечивается при наведении. Нажатие туда по-прежнему перепроверяет сервер, во время проверки крутится значок загрузки" checked={f.pingHideHover} onChange={(v) => set('fun', 'pingHideHover', v)} />
        )}
      </Group>

      <Group title="Живой интерфейс">
        <Toggle label="Фон откликается на подключение" hint="Когда соединение установлено, за кнопкой на главной разгорается мягкое свечение цвета кнопки" checked={f.reactive} onChange={(v) => { set('fun', 'reactive', v); if (v) setUi({ page: 'home', power: 'on' }); }} />
        {f.reactive && <Slider label="Сила свечения" value={f.reactiveStrength} min={10} max={100} unit="%" onChange={(v) => set('fun', 'reactiveStrength', v)} />}
        <Toggle label="Бегущая рамка у выбранного сервера" hint="По краю выбранной карточки бежит полоса света в цветах кнопки" checked={f.runningBorder} onChange={(v) => set('fun', 'runningBorder', v)} />
        <Toggle label="Выбранный сервер «дышит»" hint="Вокруг выбранной карточки мягко пульсирует ореол" checked={f.breathing} onChange={(v) => set('fun', 'breathing', v)} />
      </Group>

      <Group title="Частицы" hint="Анимированные частицы поверх фона или поверх всего интерфейса. Не мешают нажатиям">
        <div className="particle-grid">
          {PARTICLES.map((o) => (
            <Choice key={o.value} active={f.particles === o.value} onClick={() => set('fun', 'particles', o.value)}>
              <span className={cx('pt-demo', `ptd-${o.value}`)} />
              <span>{o.label}</span>
            </Choice>
          ))}
        </div>
        {f.particles !== 'none' && (
          <>
            <Row label="Где"><Segmented size="sm" value={f.particlesOver ? 'over' : 'under'} onChange={(v) => set('fun', 'particlesOver', v === 'over')} options={[{ value: 'under', label: 'Под карточками' }, { value: 'over', label: 'Поверх всего' }]} /></Row>
            <Slider label="Количество" value={f.particlesDensity} min={30} max={200} step={10} unit="%" onChange={(v) => set('fun', 'particlesDensity', v)} />
            <Slider label="Скорость" value={f.particlesSpeed} min={20} max={300} step={10} unit="%" onChange={(v) => set('fun', 'particlesSpeed', v)} />
            <Slider label="Заметность" value={f.particlesOpacity} min={10} max={100} unit="%" onChange={(v) => set('fun', 'particlesOpacity', v)} />
            <Row label="Цвет" stack>
              <Segmented size="sm" value={f.particlesColor} onChange={(v) => set('fun', 'particlesColor', v)} options={[{ value: 'auto', label: 'Авто' }, { value: 'primary', label: 'Акцент' }, { value: 'power', label: 'Цвет кнопки' }, { value: 'custom', label: 'Свой' }]} />
            </Row>
            {f.particlesColor === 'custom' && <Row label="Свой цвет"><ColorField value={f.particlesCustom} onChange={(v) => set('fun', 'particlesCustom', v)} /></Row>}
          </>
        )}
      </Group>
    </>
  );
}
