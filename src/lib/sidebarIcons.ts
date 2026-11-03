// Наборы иконок бокового меню. Иконки клиента (components/icons/sidebar-icons.tsx) - залитые SVG
// с одним контуром. Тема узнаёт каждую по началу контура, а не по порядку пунктов: без профилей
// в меню три пункта. Родной контур прячется, своя иконка рисуется маской цветом текста - так
// остаются цвета активного пункта и наведения. Рисунки наборов - в sidebarIconArt.ts.

import { ICON_ART, type IconKey } from './sidebarIconArt';
import type { SidebarIcons, ThemeConfig } from './types';

type Decl = string | false | null | undefined | 0;
type RuleFn = (selector: string | string[], decls: Decl[]) => string;
type ArtSet = keyof typeof ICON_ART;

/** credit - автор и лицензия: Solar распространяется по CC BY, автора указываем в теме */
export const SIDEBAR_ICON_SETS: { value: SidebarIcons; label: string; note: string; credit?: string }[] = [
  { value: 'app', label: 'Как в клиенте', note: 'Залитые иконки Koala Clash' },
  { value: 'duo', label: 'Двухцветные', note: 'Плотная деталь на полупрозрачной основе' },
  { value: 'solarDuo', label: 'Мягкие', note: 'Скруглённые двухцветные', credit: 'Solar Bold Duotone - 480 Design, CC BY 4.0' },
  { value: 'solarBroken', label: 'С разрывами', note: 'Тонкие линии с разрывами', credit: 'Solar Broken Line - 480 Design, CC BY 4.0' },
  { value: 'chunk', label: 'Рубленые', note: 'Толстые и угловатые', credit: 'Chunk - Noah Jacobus, общественное достояние' }
];

/** Иконка клиента: селектор её контура -> рисунок набора. Свернуть и развернуть панель - один контур
 *  с разницей в середине, поэтому у них фрагмент из середины; «развернуть» - тот же рисунок, отражённый */
export const SIDEBAR_ICONS: { key: string; art: IconKey; match: string; mirror?: boolean }[] = [
  { key: 'home', art: 'home', match: '[d^="M10.8498 0.334"]' },
  { key: 'profiles', art: 'profiles', match: '[d^="M3 4.125C3 3.03"]' },
  { key: 'proxies', art: 'proxies', match: '[d^="M0 1.89091C0 0.97"]' },
  { key: 'connections', art: 'connections', match: '[d^="M18.8679 5.8216"]' },
  { key: 'rules', art: 'rules', match: '[d^="M18 2H10L8 0H2"]' },
  { key: 'logs', art: 'logs', match: '[d^="M5.55556 15.5556"]' },
  { key: 'settings', art: 'settings', match: '[d^="M3.33644 2.048"]' },
  { key: 'collapse', art: 'panel', match: '[d*="ZM14.6462 6.37949"]' },
  { key: 'expand', art: 'panel', match: '[d*="ZM11.5077 6.37949"]', mirror: true }
];

const svgUrl = (svg: string) => `url("data:image/svg+xml,${svg.replace(/"/g, "'").replace(/#/g, '%23').replace(/</g, '%3C').replace(/>/g, '%3E')}")`;

/** Маска иконки набора: чёрное на прозрачном */
export function sidebarIconUri(set: ArtSet, art: IconKey, mirror = false): string {
  const { viewBox, icons } = ICON_ART[set];
  const body = mirror ? `<g transform="translate(${viewBox.split(' ')[2]} 0) scale(-1 1)">${icons[art]}</g>` : icons[art];
  return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body}</svg>`);
}

export function sidebarIconRules(cfg: ThemeConfig, rule: RuleFn): string {
  const set = cfg.surfaces.sidebarIcons;
  if (set === 'app') return '';
  const btn = ':root [data-slot="sidebar-menu-button"]';
  const all = SIDEBAR_ICONS.map((i) => `${btn} svg:has(> path${i.match})`);
  const credit = SIDEBAR_ICON_SETS.find((s) => s.value === set)?.credit;
  let out = credit ? `/* Иконки: ${credit} */\n` : '';
  out += rule(all, ['background-color: currentColor', '-webkit-mask: center / contain no-repeat', 'mask: center / contain no-repeat']);
  out += rule(all.map((s) => `${s} > path`), ['opacity: 0']);
  for (const [i, ic] of SIDEBAR_ICONS.entries()) {
    const uri = sidebarIconUri(set, ic.art, ic.mirror);
    out += rule(all[i], [`-webkit-mask-image: ${uri}`, `mask-image: ${uri}`]);
  }
  return out;
}

/** Иконки клиента для превью набора «Как в клиенте» в конструкторе - контуры из sidebar-icons.tsx */
export const CLIENT_PREVIEW: { key: string; viewBox: string; d: string }[] = [
  { key: 'home', viewBox: '0 0 20 20', d: 'M10.8498 0.334017C10.3692 -0.111339 9.62689 -0.111339 9.15024 0.334017L0.398713 8.45981C0.0236475 8.81141 -0.101374 9.35443 0.0861584 9.83104C0.273691 10.3076 0.730802 10.6241 1.24652 10.6241H1.87163V17.4998C1.87163 18.8788 2.99292 20 4.37206 20H15.624C17.0032 20 18.1245 18.8788 18.1245 17.4998V10.6241H18.7496C19.2653 10.6241 19.7263 10.3076 19.9138 9.83104C20.1014 9.35443 19.9764 8.8075 19.6013 8.45981L10.8498 0.334017ZM9.37294 12.4993H10.6232C11.6585 12.4993 12.4985 13.3392 12.4985 14.3745V18.1248H7.49761V14.3745C7.49761 13.3392 8.3376 12.4993 9.37294 12.4993Z' },
  { key: 'proxies', viewBox: '0 0 20 16', d: 'M0 1.89091C0 0.976485 0.677949 0 1.79487 0H18.2051C19.3221 0 20 0.976485 20 1.89091V5.38182C20 6.29624 19.3221 7.27273 18.2051 7.27273H1.79487C0.677949 7.27273 0 6.29624 0 5.38182V1.89091ZM3.84615 2.90909C3.64214 2.90909 3.44648 2.98571 3.30223 3.1221C3.15797 3.25849 3.07692 3.44348 3.07692 3.63636C3.07692 3.82925 3.15797 4.01423 3.30223 4.15062C3.44648 4.28701 3.64214 4.36364 3.84615 4.36364H5.89744C6.10145 4.36364 6.29711 4.28701 6.44136 4.15062C6.58562 4.01423 6.66667 3.82925 6.66667 3.63636C6.66667 3.44348 6.58562 3.25849 6.44136 3.1221C6.29711 2.98571 6.10145 2.90909 5.89744 2.90909H3.84615ZM0 10.6182C0 9.70376 0.677949 8.72727 1.79487 8.72727H18.2051C19.3221 8.72727 20 9.70376 20 10.6182V14.1091C20 15.0235 19.3221 16 18.2051 16H1.79487C0.677949 16 0 15.0235 0 14.1091V10.6182ZM3.84615 11.6364C3.64214 11.6364 3.44648 11.713 3.30223 11.8494C3.15797 11.9858 3.07692 12.1708 3.07692 12.3636C3.07692 12.5565 3.15797 12.7415 3.30223 12.8779C3.44648 13.0143 3.64214 13.0909 3.84615 13.0909H5.89744C6.10145 13.0909 6.29711 13.0143 6.44136 12.8779C6.58562 12.7415 6.66667 12.5565 6.66667 12.3636C6.66667 12.1708 6.58562 11.9858 6.44136 11.8494C6.29711 11.713 6.10145 11.6364 5.89744 11.6364H3.84615Z' },
  { key: 'connections', viewBox: '0 0 20 20', d: 'M18.8679 5.8216C19.6226 6.57277 19.6226 7.79343 18.8679 8.4507L16.2264 11.0798L8.86792 3.75587L11.5094 1.12676C12.2642 0.375587 13.4906 0.375587 14.1509 1.12676L15.8491 2.8169L18.6792 0L20 1.31455L17.1698 4.13145L18.8679 5.8216ZM13.3962 11.2676L12.0755 9.95305L9.43396 12.5822L7.45283 10.6103L10.0943 7.98122L8.77359 6.66667L6.13208 9.29577L4.71698 7.98122L2.07547 10.6103C1.32075 11.3615 1.32075 12.5822 2.07547 13.2394L3.77358 14.9296L0 18.6854L1.32075 20L5.09434 16.2441L6.79245 17.9343C7.54717 18.6854 8.77358 18.6854 9.43396 17.9343L12.0755 15.3052L10.7547 13.9906L13.3962 11.2676Z' },
  { key: 'rules', viewBox: '0 0 20 16', d: 'M18 2H10L8 0H2C0.9 0 0.00999999 0.9 0.00999999 2L0 14C0 15.1 0.9 16 2 16H18C19.1 16 20 15.1 20 14V4C20 2.9 19.1 2 18 2ZM5.83 12L3 9.17L4.41 7.76L5.82 9.17L9.36 5.63L10.77 7.04L5.83 12ZM15.41 9L17 10.59L15.59 12L14 10.41L12.41 12L11 10.59L12.59 9L11 7.41L12.41 6L14 7.59L15.59 6L17 7.41L15.41 9Z' }
];
