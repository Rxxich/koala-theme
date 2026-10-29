// Состояние конструктора: текущая тема, история изменений (отмена/повтор) и состояние интерфейса.

import { create } from 'zustand';
import { defaultConfig, sanitizeConfig } from '../lib/defaults';
import { readLocal, writeLocal } from '../lib/storage';
import type { Scheme, ThemeConfig } from '../lib/types';

export type Tab = 'editor' | 'gallery' | 'install';
const SECTIONS = ['palette', 'background', 'surfaces', 'shadows', 'power', 'motion', 'fonts', 'flags', 'fun', 'extras', 'code'] as const;
export type Section = (typeof SECTIONS)[number];
const PAGES = ['home', 'profiles', 'proxies', 'connections', 'rules', 'logs', 'settings'] as const;
export type PreviewPage = (typeof PAGES)[number];
export type PowerState = 'off' | 'loading' | 'on' | 'error';

// v2: с версии, где стартовая тема - стандартный Koala Clash
const STORAGE_KEY = 'koala-theme:config:v2';
/** Раздел конструктора, страница и схема превью - чтобы после перезагрузки продолжить с того же места */
const UI_KEY = 'koala-theme:ui';
const HISTORY_LIMIT = 80;

function loadSaved(): ThemeConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return sanitizeConfig(JSON.parse(raw));
  } catch { /* приватный режим или повреждённые данные */ }
  return defaultConfig();
}

function loadUi(): { section: Section; page: PreviewPage; dark: boolean } {
  const ui = { section: 'palette' as Section, page: 'home' as PreviewPage, dark: true };
  try {
    const v = JSON.parse(readLocal(UI_KEY) || 'null');
    if (SECTIONS.includes(v?.section)) ui.section = v.section;
    if (PAGES.includes(v?.page)) ui.page = v.page;
    if (typeof v?.dark === 'boolean') ui.dark = v.dark;
  } catch { /* повреждённые данные - с начала */ }
  return ui;
}

interface State {
  config: ThemeConfig;
  past: ThemeConfig[];
  future: ThemeConfig[];
  lastCommit: number;
  lastKey: string;

  tab: Tab;
  section: Section;
  dark: boolean;
  page: PreviewPage;
  power: PowerState;
  sidebar: boolean;
  paletteOpen: boolean;
  exportOpen: boolean;
  /** Просмотр готовой CSS-темы из галереи вместо темы конструктора */
  viewing: string | null;
  toast: { id: number; text: string } | null;

  /** Изменить конфиг. key - для склейки частых изменений (ползунки) в один шаг истории */
  update: (fn: (c: ThemeConfig) => void, key?: string) => void;
  replace: (cfg: ThemeConfig, label?: string) => void;
  undo: () => void;
  redo: () => void;
  set: (patch: Partial<Pick<State, 'tab' | 'section' | 'dark' | 'page' | 'power' | 'sidebar' | 'paletteOpen' | 'exportOpen' | 'viewing'>>) => void;
  notify: (text: string) => void;
}

const clone = <T,>(v: T): T => structuredClone(v);

export const useStore = create<State>((set, get) => ({
  config: loadSaved(),
  past: [],
  future: [],
  lastCommit: 0,
  lastKey: '',

  tab: 'editor',
  ...loadUi(),
  power: 'off',
  sidebar: false,
  paletteOpen: false,
  exportOpen: false,
  viewing: null,
  toast: null,

  update(fn, key = '') {
    const { config, past, lastCommit, lastKey } = get();
    const next = clone(config);
    fn(next);
    const now = Date.now();
    // Подряд идущие изменения одного поля (перетаскивание ползунка, выбор цвета) - один шаг истории
    const merge = key && key === lastKey && now - lastCommit < 700;
    set({
      config: next,
      past: merge ? past : [...past, config].slice(-HISTORY_LIMIT),
      future: [],
      lastCommit: now,
      lastKey: key,
      viewing: null
    });
  },
  replace(cfg, label) {
    const { config, past } = get();
    set({ config: sanitizeConfig(clone(cfg)), past: [...past, config].slice(-HISTORY_LIMIT), future: [], lastKey: '', viewing: null });
    if (label) get().notify(label);
  },
  undo() {
    const { past, future, config } = get();
    if (!past.length) return;
    set({ config: past[past.length - 1], past: past.slice(0, -1), future: [config, ...future], lastKey: '' });
  },
  redo() {
    const { past, future, config } = get();
    if (!future.length) return;
    set({ config: future[0], future: future.slice(1), past: [...past, config], lastKey: '' });
  },
  set: (patch) => set(patch),
  notify(text) {
    const id = Date.now();
    set({ toast: { id, text } });
    setTimeout(() => { if (get().toast?.id === id) set({ toast: null }); }, 2600);
  }
}));

// Автосохранение темы в браузере
let saveTimer = 0;
useStore.subscribe((s, prev) => {
  if (s.section !== prev.section || s.page !== prev.page || s.dark !== prev.dark) {
    writeLocal(UI_KEY, JSON.stringify({ section: s.section, page: s.page, dark: s.dark }));
  }
  if (s.config === prev.config) return;
  clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s.config)); } catch { /* нет места */ }
  }, 300);
});

/** Схема, которую сейчас редактируют: совпадает с режимом превью, если тема двухрежимная */
export function useEditScheme(): Scheme {
  const mode = useStore((s) => s.config.mode);
  const dark = useStore((s) => s.dark);
  if (mode === 'dark') return 'dark';
  if (mode === 'light') return 'light';
  return dark ? 'dark' : 'light';
}

// Отладка в режиме разработки: доступ к состоянию из консоли браузера
if (import.meta.env.DEV) (window as unknown as { __ktStore: typeof useStore }).__ktStore = useStore;
