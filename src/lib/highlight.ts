// Простая подсветка синтаксиса CSS для просмотра кода темы. Возвращает HTML.

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function highlightCss(css: string): string {
  let out = '';
  let i = 0;
  let depth = 0;
  const n = css.length;
  while (i < n) {
    // Комментарий
    if (css.startsWith('/*', i)) {
      const end = css.indexOf('*/', i + 2);
      const j = end === -1 ? n : end + 2;
      out += `<span class="hl-c">${esc(css.slice(i, j))}</span>`;
      i = j;
      continue;
    }
    // Строка
    const ch = css[i];
    if (ch === '"' || ch === "'") {
      let j = i + 1;
      while (j < n && css[j] !== ch) j += css[j] === '\\' ? 2 : 1;
      out += `<span class="hl-s">${esc(css.slice(i, j + 1))}</span>`;
      i = j + 1;
      continue;
    }
    if (ch === '{') { depth++; out += '<span class="hl-p">{</span>'; i++; continue; }
    if (ch === '}') { depth = Math.max(0, depth - 1); out += '<span class="hl-p">}</span>'; i++; continue; }
    // Внутри блока: свойство: значение;
    if (depth > 0) {
      const m = css.slice(i).match(/^([ \t]*)(--[\w-]+|-?[a-z][\w-]*)(\s*:)/i);
      const nextBrace = css.indexOf('{', i), nextSemi = css.indexOf(';', i);
      const isDecl = m && (nextBrace === -1 || (nextSemi !== -1 && nextSemi < nextBrace));
      if (m && isDecl) {
        out += `${m[1]}<span class="${m[2].startsWith('--') ? 'hl-v' : 'hl-k'}">${esc(m[2])}</span>${m[3]}`;
        i += m[0].length;
        let j = i;
        while (j < n && css[j] !== ';' && css[j] !== '}' && !css.startsWith('/*', j)) {
          if (css[j] === '"' || css[j] === "'") { const q = css[j]; j++; while (j < n && css[j] !== q) j++; }
          j++;
        }
        out += value(css.slice(i, j));
        i = j;
        continue;
      }
    }
    // Селектор или @-правило до {
    let j = i;
    while (j < n && css[j] !== '{' && css[j] !== '}' && !css.startsWith('/*', j) && !(depth > 0 && css[j] === ';')) j++;
    if (j === i) { out += esc(ch); i++; continue; }
    const chunk = css.slice(i, j);
    out += chunk.trim().startsWith('@') ? `<span class="hl-a">${esc(chunk)}</span>` : depth > 0 && css[j] === ';' ? esc(chunk) : `<span class="hl-sel">${esc(chunk)}</span>`;
    i = j;
  }
  return out;
}

function value(v: string): string {
  return esc(v)
    .replace(/(#[0-9a-f]{3,8})\b/gi, '<span class="hl-n">$1</span>')
    .replace(/(!important)/g, '<span class="hl-i">$1</span>')
    .replace(/\b(\d+(?:\.\d+)?)(px|rem|em|%|deg|ms|s|vh|vw)?\b/g, '<span class="hl-n">$1$2</span>')
    .replace(/\b(var|color-mix|linear-gradient|radial-gradient|conic-gradient|rgba?|url|calc|blur|saturate|cubic-bezier|linear|translateY|translateX|scale|rotate)\(/g, '<span class="hl-f">$1</span>(');
}
