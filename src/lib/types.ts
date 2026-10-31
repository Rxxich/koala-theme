// Схема настроек темы. Из этого объекта генератор (lib/generator.ts) собирает CSS,
// он же сохраняется в localStorage, в ссылку "Поделиться" и в конец экспортированного файла.

export type Scheme = 'light' | 'dark';
/** both - светлая и тёмная палитры; dark/light - одна палитра для обоих режимов клиента */
export type Mode = 'both' | 'dark' | 'light';

export interface Palette {
  background: string;
  foreground: string;
  card: string;
  popover: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  mutedForeground: string;
  accent: string;
  border: string;
  stroke: string;
  destructive: string;
  success: string;
  warning: string;
  powerOnStart: string;
  powerOnEnd: string;
  powerOnStroke: string;
  powerOffStart: string;
  powerOffEnd: string;
  powerOffStroke: string;
}
export type PaletteKey = keyof Palette;

export interface GradientStop { color: string; pos: number }
export interface MeshBlob { color: string; x: number; y: number; size: number }

/** app - как в клиенте (цвет обёртки и карта не трогаются), palette - цвет "Фон" из палитры */
export type BgKind = 'app' | 'palette' | 'solid' | 'linear' | 'radial' | 'conic' | 'mesh' | 'image';
export type BgPattern = 'none' | 'dots' | 'grid' | 'lines' | 'diagonal' | 'topo' | 'waves' | 'stars'
  | 'hex' | 'cross' | 'zigzag' | 'circles' | 'halftone' | 'isometric' | 'circuit' | 'plaid';
export type BgAnimation = 'none' | 'flow' | 'pan' | 'hue' | 'breathe' | 'spin';

export interface Background {
  kind: BgKind;
  color: string;
  angle: number;
  stops: GradientStop[];
  radialShape: 'circle' | 'ellipse';
  radialX: number;
  radialY: number;
  blobs: MeshBlob[];
  imageUrl: string;
  imageFit: 'cover' | 'contain' | 'repeat';
  imageX: number;
  imageY: number;
  imageBlur: number;
  imageDim: number;
  imageOpacity: number;
  /** Размывать фон (градиент или картинку) на всех страницах, кроме главной */
  blurPages: boolean;
  blurPagesAmount: number;
  animation: BgAnimation;
  animSpeed: number;
  noise: number;
  pattern: BgPattern;
  patternOpacity: number;
  patternScale: number;
  vignette: number;
}

export interface MapSettings {
  show: boolean;
  opacity: number;
  grayscale: number;
  hue: number;
  brightness: number;
  tintPrimary: boolean;
  blurPages: boolean;
}

/** 'cards' - боковая панель повторяет фон карточек */
export type SidebarStyle = 'app' | 'cards' | 'glass' | 'solid' | 'transparent' | 'outline';
export type CardFill = 'glass' | 'solid' | 'transparent';
export type NavActive = 'app' | 'fill' | 'gradient' | 'bar' | 'glow' | 'solid' | 'scale' | 'capsule' | 'neon' | 'underline' | 'dot' | 'liquid';
export type SelectedStyle = 'app' | 'tint' | 'gradient' | 'glow' | 'outline' | 'bar' | 'power'
  | 'neon' | 'brutal' | 'stripes' | 'shine' | 'aurora' | 'corners' | 'inset' | 'spotlight' | 'underline';
export type HoverStyle = 'app' | 'lift' | 'glow' | 'scale' | 'border' | 'none';
export type SelectedHover = 'none' | 'brighten' | 'lift' | 'glow' | 'scale' | 'shift';
/** Цвет стиля в «Поверхностях»: 'auto' - свои цвета стиля (обычно акцент палитры), 'power' - цвет кнопки подключения */
export type StyleColor = 'auto' | 'primary' | 'power' | 'foreground' | 'custom';
/** Карточка, на которую щёлкнули, пока профиль переключается ('app' - тускнеет и чуть сжимается) */
export type ProfileSwitch = 'app' | 'pulse' | 'shimmer' | 'none';
export type ButtonStyle = 'app' | 'glossy' | 'power' | 'glow' | 'outline' | 'pill' | 'pushable' | 'brutal' | 'liquid';
/** Подложка под картинкой группы прокси ('app' - без подложки, как в клиенте) */
export type IconPlate = 'app' | 'soft' | 'solid' | 'tint' | 'power' | 'glass' | 'white';
export type IconShape = 'app' | 'squircle' | 'circle' | 'square';
/** Градиент карточек: 'soft' - лёгкий (чуть светлее сверху), остальные - свои точки цвета */
export type CardGradient = 'soft' | 'linear' | 'radial' | 'conic';
/** Заготовки градиента карточек (lib/defaults.ts, CARD_GRADIENTS) */
export type CardGradientPreset = 'lighter' | 'deep' | 'accent' | 'corner' | 'halo' | 'power' | 'duo' | 'aurora';

/** Сглаживание жидкого стекла (lib/generator.ts, liquidUri) */
export type LiquidSmooth = 'off' | 'soft' | 'exact';
/** Вид стекла карточек: обычное, жидкое, жидкое light */
export type GlassKind = 'glass' | 'liquid' | 'light';
/** Непрозрачность, размытие и насыщенность, которые запоминаются для каждого вида стекла. opacity < 0 - не запомнены */
export interface GlassTone { opacity: number; blur: number; saturate: number }

export interface Surfaces {
  /** false - карточки как в клиенте, правила фона/стекла/рамок не генерируются */
  custom: boolean;
  /** Фон карточек и плиток (при custom) */
  fill: CardFill;
  /** Шероховатость стекла: зерно поверх полупрозрачных поверхностей, % */
  grain: number;
  /** Жидкое стекло: фон под стеклом преломляется у краёв (SVG-фильтр в backdrop-filter). Только при fill: 'glass' */
  liquid: boolean;
  /** Насколько далеко сдвигается фон у самого края, px */
  liquidStrength: number;
  /** Ширина полосы у края, где фон изгибается, px */
  liquidEdge: number;
  /** Сглаживание преломления: 'soft' - размытие на полпикселя, 'exact' - несколько выборок фона на пиксель */
  liquidSmooth: LiquidSmooth;
  /** Радужность у кромки: красный канал сдвигается сильнее, синий слабее, %. 0 - выключена */
  liquidRainbow: number;
  /** Жидкое стекло light: кромка светится тем, что лежит под стеклом в глубине, стекло матовое. Только при liquid */
  liquidLight: boolean;
  /** Ширина светящейся кромки light, px */
  liquidRim: number;
  /** Откуда кромка берёт свет: на сколько px ближе к середине */
  liquidReach: number;
  /** Яркость свечения кромки, %: 100 - как фон под стеклом */
  liquidShine: number;
  /** Кромка светится на любом фоне светлой рамкой. false - только там, где в глубине под стеклом ярче, чем у края */
  liquidRimAlways: boolean;
  /** Мягкий светлый ободок по краю стекла light */
  liquidGlow: boolean;
  /** Свои непрозрачность, размытие и насыщенность у каждого вида стекла: при переключении вида возвращаются */
  glassMemory: Record<GlassKind, GlassTone>;
  opacity: number;
  blur: number;
  saturate: number;
  borderWidth: number;
  borderOpacity: number;
  radius: number;
  gradient: boolean;
  gradientKind: CardGradient;
  /** Угол линейного и конического градиента, ° */
  gradientAngle: number;
  /** Центр радиального и конического градиента, % */
  gradientX: number;
  gradientY: number;
  /** Точки цвета - для каждой схемы свои: цвета обычно берутся из её палитры */
  gradientStops: Record<Scheme, GradientStop[]>;
  /** Заготовка, от которой берутся точки: они пересчитываются от палитры при каждой её смене. '' - свои точки gradientStops */
  gradientPreset: CardGradientPreset | '';
  highlight: boolean;
  /** Блик по нижней кромке - вместе с верхним в одной переменной --kt-highlight */
  highlightBottom: boolean;
  /** Цвет рамки карточек (при custom). 'auto' - цвет рамок палитры */
  borderColor: StyleColor;
  borderCustom: string;
  sidebar: SidebarStyle;
  navActive: NavActive;
  /** Скругление активного пункта в стиле «Жидкое стекло», px */
  navRadius: number;
  /** Плотность заливки акцентом у активного пункта «Жидкое стекло», % */
  navOpacity: number;
  navColor: StyleColor;
  navCustom: string;
  selected: SelectedStyle;
  selectedHover: SelectedHover;
  selectedColor: StyleColor;
  selectedCustom: string;
  hover: HoverStyle;
  /** Наведение на группы прокси и кнопку выбора сервера на главной */
  groupHover: HoverStyle;
  /** Цвет наведения: подсветка, свечение и рамка у серверов и групп */
  hoverColor: StyleColor;
  hoverCustom: string;
  /** Текущий профиль на странице «Профили» - те же стили, что у выбранного сервера */
  profileSelected: SelectedStyle;
  profileSelectedHover: SelectedHover;
  /** Наведение на остальные профили */
  profileHover: HoverStyle;
  profileSwitch: ProfileSwitch;
  profileColor: StyleColor;
  profileCustom: string;
  iconPlate: IconPlate;
  /** Цвет цветных подложек иконок - «Акцент» и «Цвет кнопки» */
  iconColor: StyleColor;
  iconCustom: string;
  iconShape: IconShape;
  /** Отступ картинки от края подложки, px */
  iconPad: number;
  /** Иконка группы чуть увеличивается и наклоняется при наведении */
  iconHover: boolean;
  buttons: ButtonStyle;
  /** Скругление кнопок в стиле «Жидкое стекло», px */
  buttonsRadius: number;
  /** Плотность заливки акцентом у кнопок «Жидкое стекло», % */
  buttonsOpacity: number;
  buttonsColor: StyleColor;
  buttonsCustom: string;
}

export type ShadowPreset = 'app' | 'none' | 'soft' | 'medium' | 'floating' | 'layered' | 'glow' | 'gradient' | 'ambient'
  | 'neumorph' | 'hard' | 'retro' | 'long' | 'dual' | 'outline' | 'inner';
export interface Shadows {
  preset: ShadowPreset;
  intensity: number;
  color: 'auto' | 'primary' | 'power' | 'custom';
  customColor: string;
  /** Направление света: 90° - тень вниз, 0° - вправо */
  angle: number;
  distance: number;
  blur: number;
  spread: number;
  hardOffset: number;
  hover: number;
  cards: boolean;
  popups: boolean;
  buttons: boolean;
  /** Кнопка подключения на главной */
  power: boolean;
}

export type PowerStyle = 'app' | 'glow' | 'pulse' | 'ring' | 'glass' | 'neon' | 'minimal' | 'sphere'
  | 'network' | 'globe' | 'dots' | 'plasma'
  | 'rocket' | 'orbit' | 'radar' | 'liquid' | 'equalizer' | 'heartbeat' | 'portal' | 'toggle' | 'daynight';
export type PowerShape = 'circle' | 'squircle' | 'square';
/** Цвет рамки круга: 'app' - цвета рамки кнопки из палитры, 'gradient' - градиентом цветов кнопки */
export type PowerRing = 'app' | 'gradient' | 'primary' | 'foreground' | 'custom';
export type PowerVolume = 'none' | 'convex' | 'concave' | 'gloss';
export type ToggleLook = 'classic' | 'glass';
export type DayScene = 'clouds' | 'hills';
export type PowerFill = 'app' | 'radial' | 'linear' | 'conic' | 'solid' | 'none';
export type PowerHover = 'app' | 'scale' | 'lift' | 'tilt' | 'glow' | 'none';
export type PowerIdle = 'none' | 'float' | 'breathe' | 'wobble';
export type PowerIcon = 'app' | 'foreground' | 'primary' | 'power' | 'custom' | 'hide';

export interface Power {
  style: PowerStyle;
  size: number;
  animate: boolean;
  speed: number;
  sphereDot: number;
  /* Подсветка позади кнопки - работает с любым стилем */
  glow: number;
  glowSize: number;
  glowBlur: number;
  glowColor: 'power' | 'primary' | 'custom';
  glowCustom: string;
  glowOff: boolean;
  glowPulse: boolean;
  /* Форма и заливка круга */
  shape: PowerShape;
  /** Скругление углов у сквиркла и квадрата, % от высоты */
  corner: number;
  /** Ширина кнопки, % (круг шире 100% становится капсулой) */
  stretch: number;
  fill: PowerFill;
  fillOpacity: number;
  /** Направление линейной и конической заливки, °; у радиальной - откуда падает свет */
  fillAngle: number;
  ringWidth: number;
  ringColor: PowerRing;
  ringCustom: string;
  /** Второе кольцо снаружи: толщина (0 - нет) и зазор до круга, px */
  outerRing: number;
  outerGap: number;
  volume: PowerVolume;
  /** Тень под кнопкой, % */
  drop: number;
  /** Стиль «Стекло»: размер блика сверху, % (0 - без блика) */
  glassShine: number;
  /* Тумблеры */
  toggleLook: ToggleLook;
  toggleIcon: boolean;
  /** Тумблер «Стекло»: ручка светится цветом кнопки */
  toggleGlow: boolean;
  dayScene: DayScene;
  /** «День и ночь»: днём - подключено (иначе наоборот) */
  dayOn: boolean;
  /* Поведение */
  hover: PowerHover;
  idle: PowerIdle;
  icon: PowerIcon;
  iconCustom: string;
  iconSize: number;
}

export type Easing = 'app' | 'smooth' | 'spring' | 'snappy' | 'bounce' | 'linear';
export type Entrance = 'none' | 'fade' | 'rise' | 'scale' | 'blur' | 'slide' | 'flip';
export type ClickEffect = 'none' | 'wave' | 'ripple' | 'double' | 'flash' | 'glow' | 'shine' | 'border'
  | 'sparks' | 'confetti' | 'corners' | 'scan' | 'fill' | 'echo';
export interface Motion {
  speed: number;
  easing: Easing;
  entrance: Entrance;
  stagger: number;
  press: boolean;
  pressScale: number;
  popups: 'app' | 'spring' | 'fade' | 'none';
  reduce: boolean;
  /* Эффект при нажатии */
  click: ClickEffect;
  clickColor: 'primary' | 'power' | 'foreground' | 'custom';
  clickCustom: string;
  clickDuration: number;
  clickSize: number;
  clickOpacity: number;
  clickProxies: boolean;
  clickGroups: boolean;
  clickProfiles: boolean;
  clickButtons: boolean;
  clickNav: boolean;
}

export type TextShadow = 'none' | 'soft' | 'glow' | 'neon' | 'hard' | 'outline' | 'emboss' | 'long';
export interface Fonts {
  imports: string[];
  ui: string;
  heading: string;
  mono: string;
  scale: number;
  weight: number;
  headingWeight: number;
  letterSpacing: number;
  tabular: boolean;
  uppercaseTitles: boolean;
  smoothing: boolean;
  /** Шрифт twemoji для текстов в карточках без класса flag-emoji (описание сервера) */
  flagFix: boolean;
  textShadow: TextShadow;
  textShadowTarget: 'titles' | 'all';
  textShadowColor: 'auto' | 'primary' | 'power' | 'custom';
  textShadowCustom: string;
  textShadowBlur: number;
  textShadowDistance: number;
  textShadowAngle: number;
  textShadowOpacity: number;
}

export type FlagStyle = 'app' | 'hide' | 'corner' | 'watermark' | 'badge' | 'round';
export interface Flags {
  style: FlagStyle;
  hideInline: boolean;
  size: number;
  rotate: number;
  x: number;
  y: number;
  opacity: number;
  fade: boolean;
  blur: number;
  /** Затемнение флага, % */
  dim: number;
  side: 'right' | 'left';
  selectedBoost: boolean;
  selectedNoBlur: boolean;
  grayscale: boolean;
}

export interface Extras {
  scrollbar: 'app' | 'thin' | 'accent' | 'hidden';
  selection: boolean;
  tooltip: 'app' | 'card' | 'accent' | 'glass';
  title: 'app' | 'gradient' | 'accent' | 'outline';
  focusRing: boolean;
  statusColor: boolean;
  customCss: string;
}

export type Particles = 'none' | 'snow' | 'stars' | 'fireflies' | 'rain' | 'sakura' | 'bubbles' | 'confetti';
export type PingGlow = 'none' | 'bar' | 'glow' | 'dot' | 'tint';
export interface Fun {
  /** Подсветка карточки сервера по задержке: зелёная, жёлтая, красная */
  ping: PingGlow;
  /** Точка пинга - вместо цифр задержки на кнопке проверки, а не в углу карточки */
  pingDotInPlace: boolean;
  /** Диаметр точки пинга, px */
  pingDotSize: number;
  /** Спрятать цифры пинга (видны при наведении на кнопку проверки) */
  pingHide: boolean;
  /** Цифры пинга не появляются и при наведении */
  pingHideHover: boolean;
  /** Фон окна откликается на подключение (на главной) */
  reactive: boolean;
  reactiveStrength: number;
  /** Бегущая градиентная рамка у выбранного сервера */
  runningBorder: boolean;
  /** Мягко "дышащий" выбранный сервер */
  breathing: boolean;
  particles: Particles;
  particlesOver: boolean;
  particlesDensity: number;
  particlesSpeed: number;
  particlesOpacity: number;
  particlesColor: 'auto' | 'primary' | 'power' | 'custom';
  particlesCustom: string;
}

export type DividerStyle = 'app' | 'hidden' | 'solid' | 'fade' | 'gradient' | 'dashed' | 'dotted' | 'double';
export type DividerEffect = 'none' | 'glow' | 'shimmer' | 'pulse';
export interface Divider {
  style: DividerStyle;
  color: 'auto' | 'primary' | 'power' | 'custom';
  custom: string;
  /** Непрозрачность цвета, % */
  opacity: number;
  /** Толщина, px */
  size: number;
  /** Длина от обычной, % */
  length: number;
  effect: DividerEffect;
}
/** Разделительные полосы: горизонтальные (настройки, правила, логи, окна) и вертикальные на главной */
export interface Dividers {
  h: Divider;
  v: Divider;
}

export interface ThemeConfig {
  version: 1;
  name: string;
  author: string;
  description: string;
  mode: Mode;
  palette: Record<Scheme, Palette>;
  background: Record<Scheme, Background>;
  map: MapSettings;
  surfaces: Surfaces;
  dividers: Dividers;
  shadows: Shadows;
  power: Power;
  motion: Motion;
  fonts: Fonts;
  flags: Flags;
  extras: Extras;
  fun: Fun;
}

/** Рекурсивно-частичный тип - для пресетов, которые меняют только часть настроек */
export type DeepPartial<T> = { [K in keyof T]?: T[K] extends (infer U)[] ? U[] : T[K] extends object ? DeepPartial<T[K]> : T[K] };
