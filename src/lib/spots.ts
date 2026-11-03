// Где в макете клиента то, что меняет группа настроек. Кнопка «Показать в макете» в заголовке группы
// открывает страницу макета с этим элементом и ненадолго обводит его.
// Селекторы - те же, что у правил темы в generator.ts: макет повторяет разметку клиента.

import type { PreviewPage } from '../state/store';
import { PROXY_SEL } from './effects';

export interface Spot {
  sel: string;
  /** Страницы макета, где элемент есть; без списка - на любой. Кнопка открывает первую */
  pages?: PreviewPage[];
}

export const SPOTS = {
  tiles: { sel: 'div.rounded-2xl.border-stroke, [data-slot="card"]', pages: ['home', 'proxies', 'rules', 'settings'] },
  selected: { sel: '[data-slot="card"][class*="border-primary/"]', pages: ['proxies'] },
  proxies: { sel: PROXY_SEL, pages: ['proxies'] },
  profiles: { sel: 'div.rounded-2xl[aria-busy]', pages: ['profiles'] },
  groupIcons: { sel: '[data-slot="card"].cursor-pointer.isolate [data-slot="avatar"]', pages: ['proxies'] },
  sidebar: { sel: '[data-slot="sidebar-container"]' },
  buttons: { sel: '[data-slot="button"][data-variant="default"]', pages: ['settings'] },
  dividers: { sel: '[data-slot="separator"], .h-8.w-px.bg-stroke, .h-3.w-px.bg-stroke', pages: ['home', 'settings'] },
  power: { sel: '[data-guide="home-power-toggle"]', pages: ['home'] },
  map: { sel: '[data-slot="sidebar-wrapper"] > img.pointer-events-none', pages: ['home'] },
  title: { sel: '.title' },
  flags: { sel: 'span.flag-emoji', pages: ['proxies', 'home'] }
} satisfies Record<string, Spot>;
