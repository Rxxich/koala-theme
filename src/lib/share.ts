// Скачивание, буфер обмена, ссылка "Поделиться" (конфиг сжат в адресе после #) и импорт файлов.

import { sanitizeConfig } from './defaults';
import { decodeConfig } from './generator';
import type { ThemeConfig } from './types';

export function downloadText(filename: string, text: string, type = 'text/css') {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

/** Имя файла из названия темы: "Моя тема" → koala-moya-tema.css */
export function fileNameFor(name: string): string {
  const map: Record<string, string> = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' };
  const slug = name.toLowerCase().split('').map((c) => map[c] ?? c).join('')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'theme';
  return slug.startsWith('koala') ? `${slug}.css` : `koala-${slug}.css`;
}

/* ---------- Ссылка "Поделиться" ---------- */

const toB64Url = (bytes: Uint8Array) => {
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromB64Url = (s: string) => {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

export async function encodeShare(cfg: ThemeConfig): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(cfg));
  if ('CompressionStream' in window) return 'z' + toB64Url(await pipe(json, new CompressionStream('deflate-raw')));
  return 'j' + toB64Url(json);
}

export async function decodeShare(hash: string): Promise<ThemeConfig | null> {
  try {
    const kind = hash[0], data = fromB64Url(hash.slice(1));
    const bytes = kind === 'z' ? await pipe(data, new DecompressionStream('deflate-raw')) : data;
    return sanitizeConfig(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}

export async function shareUrl(cfg: ThemeConfig): Promise<string> {
  const base = location.href.split('#')[0];
  return `${base}#t=${await encodeShare(cfg)}`;
}

/* ---------- Импорт ---------- */

export type ImportResult = { ok: true; config: ThemeConfig } | { ok: false; error: string };

export function importText(text: string): ImportResult {
  const trimmed = text.trim();
  if (trimmed.startsWith('{')) {
    try { return { ok: true, config: sanitizeConfig(JSON.parse(trimmed)) }; } catch { return { ok: false, error: 'Не удалось прочитать JSON' }; }
  }
  const embedded = decodeConfig(trimmed);
  if (embedded) return { ok: true, config: sanitizeConfig(embedded) };
  return { ok: false, error: 'В файле нет настроек koala-theme. Импортировать можно только темы, собранные в конструкторе (.css) или файл настроек (.json)' };
}

export function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsText(file);
  });
}
