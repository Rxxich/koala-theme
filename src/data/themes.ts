// Готовые темы - написанные вручную CSS-файлы (лежат в public/themes).
// Их нельзя разобрать на настройки конструктора, поэтому они открываются "как есть",
// а кнопка "Похожая в конструкторе" загружает ближайший пресет.

export interface GalleryTheme {
  id: string;
  name: string;
  file: string;
  author: 'koala-theme';
  description: string;
  mode: 'both' | 'dark';
  features: string[];
  swatches: { light?: string[]; dark: string[] };
  preset: string;
}

export const GALLERY: GalleryTheme[] = [
  {
    id: 'sage-night', name: 'Koala Sage & Night', file: 'themes/koala-sage-night.css', author: 'koala-theme', mode: 'both',
    description: 'Шалфей днём, ночное небо вечером. Кнопка подключения - вращающаяся сфера из 150 частиц, флаг сервера крупно и наискось в углу карточки.',
    features: ['Сфера из частиц', 'Флаги в углу', 'Палитра Sage', 'Зерно на фоне'],
    swatches: { light: ['#ebf2ee', '#fbfefc', '#177c52', '#85e0be', '#177c52'], dark: ['#090a0f', '#131a24', '#8ab8ee', '#dbe8ff', '#6f9fdc'] },
    preset: 'sage-night'
  },
  {
    id: 'liquid-glass', name: 'Koala Liquid Glass', file: 'themes/koala-liquid-glass.css', author: 'koala-theme', mode: 'both',
    description: 'В духе Apple Liquid Glass: слой живого стекла над цветными обоями, блик по кромке, капсулы и пружинные анимации.',
    features: ['Живое стекло', 'Капсулы', 'Пружинные анимации', 'Дрейф обоев'],
    swatches: { light: ['#eef1f8', '#ffffff', '#007aff', '#4cd964', '#28b14c'], dark: ['#06070d', '#1c1c24', '#0a84ff', '#30d158', '#1f9e45'] },
    preset: 'aurora-glass'
  },
  {
    id: 'lotsiya', name: 'Koala Лоция', file: 'themes/koala-lotsiya.css', author: 'koala-theme', mode: 'both',
    description: 'Морская навигационная карта: вода с изобатами, роза ветров вместо кнопки, остров-панель и пурпурный курс на выбранном сервере.',
    features: ['Роза ветров', 'Изобаты', 'Курсивная антиква', 'Путевые точки'],
    swatches: { light: ['#f7fbfb', '#f7fbfb', '#14284a', '#a8146f', '#14284a'], dark: ['#07121c', '#0c1a28', '#c4d3e0', '#e45bb4', '#c4d3e0'] },
    preset: 'ocean-breeze'
  },
  {
    id: 'arcade', name: 'Koala Arcade', file: 'themes/koala-arcade.css', author: 'koala-theme', mode: 'both',
    description: 'Программа превращается в 8-битную игру: PICO-8 ночью, Game Boy днём, пиксельная кнопка PRESS START, звёзды и развёртка ЭЛТ.',
    features: ['PRESS START', 'Пиксельный курсор', 'Бегущие холмы', 'ЭЛТ-развёртка'],
    swatches: { light: ['#8bac0f', '#9bbc0f', '#0f380f', '#306230', '#0f380f'], dark: ['#0b0e24', '#1d2b53', '#ffec27', '#00e436', '#29adff'] },
    preset: 'pixel'
  },
  {
    id: 'dark-glass', name: 'Koala Dark Glass Aurora', file: 'themes/koala-dark-glass.css', author: 'koala-theme', mode: 'dark',
    description: 'Матовое морозное стекло и занавеси северного сияния. Кнопка - ядро с вращающимся сиянием, по рамке выбранного сервера бежит переливающаяся полоса.',
    features: ['Северное сияние', 'Ядро-кнопка', 'Каскадное появление', 'Только тёмная'],
    swatches: { dark: ['#04050b', '#11141f', '#6ee7cf', '#2df5b0', '#7d5cff'] },
    preset: 'aurora-glass'
  },
  {
    id: 'dark-bento', name: 'Koala Dark Bento', file: 'themes/koala-dark-bento.css', author: 'koala-theme', mode: 'dark',
    description: 'Тёмный минимализм: главная пересобрана бенто-плитками, графит, тонкие линии и один барвинковый акцент. Микровзаимодействия на каждое действие.',
    features: ['Бенто-сетка', 'Микровзаимодействия', 'Барвинковый акцент', 'Только тёмная'],
    swatches: { dark: ['#09090b', '#111114', '#ededef', '#8b9cff', '#6577f3'] },
    preset: 'graphite'
  },
  {
    id: 'grain', name: 'Koala Grain', file: 'themes/koala-grain.css', author: 'koala-theme', mode: 'both',
    description: 'Натриевые сумерки: зернистые цветовые поля сливы и охры, живое плёночное зерно поверх окна и жемчужная кнопка, которая теплеет при подключении.',
    features: ['Плёночное зерно', 'Жемчужная кнопка', 'Матовая бумага', 'Окрашенные тени'],
    swatches: { light: ['#ecebf0', '#faf8fc', '#3d2a55', '#e3a03e', '#7d5aa6'], dark: ['#120e17', '#1e1826', '#e3a547', '#e3a547', '#5b3a8f'] },
    preset: 'forest-grain'
  }
];

export const galleryById = (id: string) => GALLERY.find((t) => t.id === id);
