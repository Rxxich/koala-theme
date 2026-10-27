// Раздел "Фон": шаблоны, тип фона, градиенты, меш, фото и своя картинка по ссылке, анимация,
// размытие на внутренних страницах, узоры и зерно, а также карта мира из стандартной темы.

import { Plus, Trash2, Shuffle, Link2, Waves } from 'lucide-react';
import { useEditScheme, useStore } from '../../state/store';
import { GRADIENTS, PHOTOS, photoThumb, photoUrl } from '../../data/gradients';
import { bgPreview } from '../../lib/generator';
import { makeBackground, APP_WRAPPER } from '../../lib/defaults';
import { mix } from '../../lib/color';
import { SWATCHES } from '../../lib/palette';
import type { Background, BgAnimation, BgKind, BgPattern } from '../../lib/types';
import { ColorField } from '../ColorPicker';
import { GradientEditor } from '../GradientEditor';
import { Button, Choice, Group, Row, Segmented, Slider, TextField, Toggle, cx } from '../ui';
import { PanelHead, SchemeSwitch } from './common';

const KINDS: { value: BgKind; label: string }[] = [
  { value: 'app', label: 'Как в клиенте' }, { value: 'palette', label: 'Из палитры' }, { value: 'solid', label: 'Цвет' }, { value: 'linear', label: 'Линейный' },
  { value: 'radial', label: 'Радиальный' }, { value: 'conic', label: 'Конический' }, { value: 'mesh', label: 'Меш' }, { value: 'image', label: 'Картинка' }
];
const ANIMS: { value: BgAnimation; label: string }[] = [
  { value: 'none', label: 'Нет' }, { value: 'flow', label: 'Перетекание' }, { value: 'pan', label: 'Дрейф' }, { value: 'hue', label: 'Смена оттенка' }, { value: 'breathe', label: 'Дыхание' }, { value: 'spin', label: 'Вращение' }
];
const PATTERNS: { value: BgPattern; label: string }[] = [
  { value: 'none', label: 'Нет' }, { value: 'dots', label: 'Точки' }, { value: 'grid', label: 'Сетка' }, { value: 'lines', label: 'Развёртка' },
  { value: 'diagonal', label: 'Диагональ' }, { value: 'topo', label: 'Топография' }, { value: 'waves', label: 'Волны' }, { value: 'stars', label: 'Звёзды' },
  { value: 'hex', label: 'Соты' }, { value: 'cross', label: 'Плюсы' }, { value: 'zigzag', label: 'Зигзаг' }, { value: 'circles', label: 'Круги' },
  { value: 'halftone', label: 'Растр' }, { value: 'isometric', label: 'Изометрия' }, { value: 'circuit', label: 'Плата' }, { value: 'plaid', label: 'Клетка' }
];

export function BackgroundPanel() {
  const scheme = useEditScheme();
  const config = useStore((s) => s.config);
  const update = useStore((s) => s.update);
  const bg = config.background[scheme];
  const pal = config.palette[scheme];
  const map = config.map;
  const sw = [...SWATCHES.accent, pal.primary, pal.powerOnStart, pal.powerOnEnd, pal.background];

  const setBg = (patch: Partial<Background>, key?: string) => update((c) => { c.background[scheme] = { ...c.background[scheme], ...patch }; }, key);
  const setMap = <K extends keyof typeof map>(k: K, v: (typeof map)[K]) => update((c) => { c.map[k] = v; }, `map.${k}`);
  const gradientKinds = bg.kind === 'linear' || bg.kind === 'radial' || bg.kind === 'conic';
  const hasLayer = gradientKinds || bg.kind === 'mesh' || (bg.kind === 'image' && !!bg.imageUrl);
  const ordered = [...GRADIENTS].sort((a, b) => Number(b.scheme === scheme) - Number(a.scheme === scheme));
  const photos = [...PHOTOS].sort((a, b) => Number(b.scheme === scheme) - Number(a.scheme === scheme));
  const fallback = bg.kind === 'app' ? APP_WRAPPER[scheme] : pal.background;

  return (
    <>
      <PanelHead title="Фон" text="Фон окна под всеми карточками. Для светлой и тёмной темы клиента настраивается отдельно." />
      <SchemeSwitch />

      <Group title="Шаблоны" hint="Щелчок заменяет фон текущей схемы. Сначала показаны шаблоны, подходящие к ней. Со значком волн - перетекающие: пятна медленно плывут">
        <div className="bg-grid">
          {ordered.map((g) => (
            <button key={g.id} type="button" className="bg-tile" title={g.bg.animation === 'flow' ? `${g.name} · перетекает` : g.name}
              onClick={() => update((c) => {
                const cur = c.background[scheme];
                c.background[scheme] = makeBackground({ pattern: cur.pattern, patternOpacity: cur.patternOpacity, patternScale: cur.patternScale, blurPages: cur.blurPages, blurPagesAmount: cur.blurPagesAmount, ...g.bg, noise: g.bg.noise ?? cur.noise });
              })}>
              <span className="bg-swatch" style={{ background: bgPreview(g.bg, pal.background) }} />
              <span className="bg-name">{g.bg.animation === 'flow' && <Waves size={10} />}{g.name}</span>
            </button>
          ))}
        </div>
      </Group>

      <Group title="Фотографии" hint="Бесплатные фото с Unsplash по прямой ссылке. Клиент разрешает картинки с любых адресов">
        <div className="photo-grid">
          {photos.map((ph) => (
            <button key={ph.id} type="button" className={cx('photo-tile', bg.kind === 'image' && bg.imageUrl.includes(ph.id) && 'active')} title={ph.name}
              onClick={() => setBg({ kind: 'image', imageUrl: photoUrl(ph.id), color: ph.tone, imageDim: ph.scheme === scheme ? (scheme === 'dark' ? 30 : 15) : 45 })}>
              <img src={photoThumb(ph.id)} alt="" loading="lazy" />
              <span>{ph.name}</span>
            </button>
          ))}
        </div>
      </Group>

      <Group title="Тип фона">
        <Segmented<BgKind> wrap value={bg.kind} onChange={(v) => setBg({ kind: v })} options={KINDS} />
        <div className="bg-current" style={{ background: bgPreview(bg, fallback) }} />

        {bg.kind === 'app' && <p className="note">Фон как в Koala Clash: цвет окна и карта мира из стандартной темы. Карту можно настроить ниже.</p>}
        {bg.kind === 'palette' && <p className="note">Фон берётся из цвета «Фон» палитры. Карта мира остаётся поверх, если она включена ниже.</p>}
        {bg.kind === 'solid' && <Row label="Цвет"><ColorField value={bg.color} onChange={(v) => setBg({ color: v }, 'bg-color')} swatches={SWATCHES[scheme].background} /></Row>}

        {gradientKinds && (
          <>
            <GradientEditor stops={bg.stops} onChange={(stops) => setBg({ stops }, 'bg-stops')} swatches={sw} />
            {(bg.kind === 'linear' || bg.kind === 'conic') && <Slider label="Угол" value={bg.angle} min={0} max={360} unit="°" onChange={(v) => setBg({ angle: v }, 'bg-angle')} />}
            {bg.kind === 'radial' && (
              <Row label="Форма"><Segmented size="sm" value={bg.radialShape} onChange={(v) => setBg({ radialShape: v })} options={[{ value: 'ellipse', label: 'Эллипс' }, { value: 'circle', label: 'Круг' }]} /></Row>
            )}
            {(bg.kind === 'radial' || bg.kind === 'conic') && (
              <>
                <Slider label="Центр по горизонтали" value={bg.radialX} min={0} max={100} unit="%" onChange={(v) => setBg({ radialX: v }, 'bg-rx')} />
                <Slider label="Центр по вертикали" value={bg.radialY} min={0} max={100} unit="%" onChange={(v) => setBg({ radialY: v }, 'bg-ry')} />
              </>
            )}
            <Row label="Цвет под градиентом" hint="Виден, если в градиенте есть прозрачные участки"><ColorField value={bg.color} onChange={(v) => setBg({ color: v }, 'bg-color')} /></Row>
          </>
        )}

        {bg.kind === 'mesh' && (
          <>
            <Row label="Основной цвет"><ColorField value={bg.color} onChange={(v) => setBg({ color: v }, 'bg-color')} swatches={SWATCHES[scheme].background} /></Row>
            <div className="blobs">
              {bg.blobs.map((b, i) => (
                <div key={i} className="blob">
                  <div className="blob-head">
                    <ColorField compact value={b.color} onChange={(v) => setBg({ blobs: bg.blobs.map((x, j) => (j === i ? { ...x, color: v } : x)) }, `blob-c${i}`)} swatches={sw} />
                    <span>Пятно {i + 1}</span>
                    <button type="button" className="icon-btn" disabled={bg.blobs.length <= 1} onClick={() => setBg({ blobs: bg.blobs.filter((_, j) => j !== i) })} title="Удалить пятно"><Trash2 size={14} /></button>
                  </div>
                  <div className="blob-sliders">
                    <Slider label="X" value={b.x} min={0} max={100} unit="%" onChange={(v) => setBg({ blobs: bg.blobs.map((x, j) => (j === i ? { ...x, x: v } : x)) }, `blob-x${i}`)} />
                    <Slider label="Y" value={b.y} min={0} max={100} unit="%" onChange={(v) => setBg({ blobs: bg.blobs.map((x, j) => (j === i ? { ...x, y: v } : x)) }, `blob-y${i}`)} />
                    <Slider label="Размер" value={b.size} min={10} max={120} unit="%" onChange={(v) => setBg({ blobs: bg.blobs.map((x, j) => (j === i ? { ...x, size: v } : x)) }, `blob-s${i}`)} />
                  </div>
                </div>
              ))}
            </div>
            <div className="btn-row">
              <Button variant="soft" size="sm" icon={<Plus size={14} />} disabled={bg.blobs.length >= 6}
                onClick={() => setBg({ blobs: [...bg.blobs, { color: mix(pal.primary, pal.powerOnStart, Math.random()), x: Math.round(Math.random() * 100), y: Math.round(Math.random() * 100), size: 50 }] })}>Пятно</Button>
              <Button variant="soft" size="sm" icon={<Shuffle size={14} />}
                onClick={() => setBg({ blobs: bg.blobs.map((b) => ({ ...b, x: Math.round(Math.random() * 100), y: Math.round(Math.random() * 100), size: 35 + Math.round(Math.random() * 45) })) })}>Перемешать</Button>
            </div>
          </>
        )}

        {bg.kind === 'image' && (
          <>
            <Row label={<><Link2 size={13} />Ссылка на картинку</>} stack hint="Прямая ссылка на файл .jpg/.png/.webp/.svg: если открыть её в браузере, показывается только картинка">
              <TextField mono value={bg.imageUrl} placeholder="https://i.imgur.com/abcd123.jpg" onChange={(v) => setBg({ imageUrl: v.trim() }, 'bg-url')} />
            </Row>
            <p className="note">Выберите фото выше или вставьте свою ссылку. Чтобы получить прямую ссылку, откройте картинку в браузере → правой кнопкой → «Копировать адрес изображения».</p>
            <Row label="Заполнение"><Segmented size="sm" value={bg.imageFit} onChange={(v) => setBg({ imageFit: v })} options={[{ value: 'cover', label: 'Заполнить' }, { value: 'contain', label: 'Вписать' }, { value: 'repeat', label: 'Плитка' }]} /></Row>
            <Slider label="Положение X" value={bg.imageX} min={0} max={100} unit="%" onChange={(v) => setBg({ imageX: v }, 'img-x')} />
            <Slider label="Положение Y" value={bg.imageY} min={0} max={100} unit="%" onChange={(v) => setBg({ imageY: v }, 'img-y')} />
            <Slider label="Размытие" value={bg.imageBlur} min={0} max={40} unit="px" onChange={(v) => setBg({ imageBlur: v }, 'img-blur')} />
            <Slider label="Затемнение" hint="Слой цвета фона поверх картинки - чтобы текст читался" value={bg.imageDim} min={0} max={90} unit="%" onChange={(v) => setBg({ imageDim: v }, 'img-dim')} />
            <Slider label="Непрозрачность" value={bg.imageOpacity} min={10} max={100} unit="%" onChange={(v) => setBg({ imageOpacity: v }, 'img-op')} />
            <Row label="Цвет под картинкой"><ColorField value={bg.color} onChange={(v) => setBg({ color: v }, 'bg-color')} /></Row>
          </>
        )}

        {hasLayer && (
          <>
            <Toggle label="Размывать на других страницах" hint="Как карта в клиенте: на главной фон чёткий, на остальных страницах - размытый, чтобы не мешал читать" checked={bg.blurPages} onChange={(v) => setBg({ blurPages: v })} />
            {bg.blurPages && <Slider label="Сила размытия" value={bg.blurPagesAmount} min={4} max={64} unit="px" onChange={(v) => setBg({ blurPagesAmount: v }, 'blur-pages')} />}
          </>
        )}
      </Group>

      {hasLayer && bg.kind !== 'image' && (
        <Group title="Анимация фона" hint="Медленное движение фона. В клиенте выключается, если в системе отключены анимации">
          <Segmented<BgAnimation> wrap size="sm" value={bg.animation} onChange={(v) => setBg({ animation: v })} options={ANIMS} />
          {bg.animation !== 'none' && <Slider label="Период" value={bg.animSpeed} min={4} max={180} unit="с" onChange={(v) => setBg({ animSpeed: v }, 'bg-speed')} />}
        </Group>
      )}

      <Group title="Узор, зерно, виньетка">
        <div className="pattern-grid">
          {PATTERNS.map((pt) => (
            <Choice key={pt.value} active={bg.pattern === pt.value} onClick={() => setBg({ pattern: pt.value })}>
              <span className={cx('pattern-sample', `ps-${pt.value}`)} />
              <span>{pt.label}</span>
            </Choice>
          ))}
        </div>
        {bg.pattern !== 'none' && (
          <>
            <Slider label="Заметность узора" value={bg.patternOpacity} min={2} max={100} unit="%" onChange={(v) => setBg({ patternOpacity: v }, 'pat-op')} />
            <Slider label="Масштаб узора" value={bg.patternScale} min={40} max={300} step={5} unit="%" onChange={(v) => setBg({ patternScale: v }, 'pat-scale')} />
          </>
        )}
        <Slider label="Зерно" hint="Плёночный шум поверх фона. Убирает полосы на плавных градиентах" value={bg.noise} min={0} max={30} unit="%" onChange={(v) => setBg({ noise: v }, 'noise')} />
        <Slider label="Виньетка" hint="Затемнение по краям окна" value={bg.vignette} min={0} max={80} unit="%" onChange={(v) => setBg({ vignette: v }, 'vignette')} />
      </Group>

      <Group title="Карта мира" hint="Картинка с картой из стандартной темы Koala Clash. Общая для обеих схем">
        <Toggle label="Показывать карту" checked={map.show} onChange={(v) => setMap('show', v)} />
        {map.show && (
          <>
            <Slider label="Непрозрачность" value={map.opacity} min={5} max={100} unit="%" onChange={(v) => setMap('opacity', v)} />
            <Toggle label="Перекрасить в цвет акцента" checked={map.tintPrimary} onChange={(v) => setMap('tintPrimary', v)} />
            <Slider label="Обесцветить" value={map.grayscale} min={0} max={100} unit="%" onChange={(v) => setMap('grayscale', v)} />
            <Slider label="Сдвиг оттенка" value={map.hue} min={-180} max={180} unit="°" onChange={(v) => setMap('hue', v)} />
            <Slider label="Яркость" value={map.brightness} min={30} max={200} unit="%" onChange={(v) => setMap('brightness', v)} />
            <Toggle label="Размывать на других страницах" hint="Так делает клиент: чёткая карта только на главной" checked={map.blurPages} onChange={(v) => setMap('blurPages', v)} />
          </>
        )}
      </Group>
    </>
  );
}
