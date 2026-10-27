// Мелкие настройки интерфейса в браузере (размер окна, формат цвета, ссылка на CSS...). Хранилище
// бывает недоступно: приватный режим, запрет сайтам хранить данные. Тогда чтение даёт null, а запись
// молча пропускается - иначе исключение при отрисовке оставляло бы пустое место вместо превью.

export function readLocal(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

export function writeLocal(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* недоступно или нет места */ }
}
