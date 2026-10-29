// Возможности браузера, в котором открыт сайт. Тема работает в Koala Clash (Chromium), а превью - в любом браузере.

/**
 * SVG-фильтры в backdrop-filter (жидкое стекло) рисует только Chromium. Firefox и Safari значение принимают
 * (CSS.supports отвечает true), но фильтр не рисуют, поэтому узнаём движок по строке браузера: у Chrome,
 * Edge, Opera, Яндекс Браузера и Electron в ней есть Chrome/, у Firefox и Safari - нет
 */
export const svgBackdrop = typeof navigator !== 'undefined' && /\b(Chrome|Chromium)\//.test(navigator.userAgent);
