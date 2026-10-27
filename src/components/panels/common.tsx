// Общее для панелей: доступ к конфигу и переключатель редактируемой схемы.

import { Moon, Sun } from 'lucide-react';
import { useStore, useEditScheme } from '../../state/store';
import type { ThemeConfig } from '../../lib/types';
import { cx } from '../ui';

export function useCfg() {
  const config = useStore((s) => s.config);
  const update = useStore((s) => s.update);
  /** Изменить поле: set('surfaces', 'blur', 20) */
  function set<K extends keyof ThemeConfig, F extends keyof ThemeConfig[K]>(group: K, field: F, value: ThemeConfig[K][F]) {
    update((c) => { (c[group] as ThemeConfig[K])[field] = value; }, `${String(group)}.${String(field)}`);
  }
  return { config, update, set };
}

/** "Настраиваю: светлая / тёмная" - переключает и превью, чтобы сразу видеть результат */
export function SchemeSwitch({ note }: { note?: string }) {
  const scheme = useEditScheme();
  const mode = useStore((s) => s.config.mode);
  const set = useStore((s) => s.set);
  const locked = mode !== 'both';
  return (
    <div className="scheme-switch">
      <span>{note ?? 'Настраиваю'}</span>
      <div className="segmented segmented-sm">
        <button type="button" className={cx(scheme === 'light' && 'active')} disabled={locked && scheme !== 'light'} onClick={() => set({ dark: false })}><Sun size={13} />Светлую</button>
        <button type="button" className={cx(scheme === 'dark' && 'active')} disabled={locked && scheme !== 'dark'} onClick={() => set({ dark: true })}><Moon size={13} />Тёмную</button>
      </div>
    </div>
  );
}

export function PanelHead({ title, text }: { title: string; text: string }) {
  return (
    <header className="panel-head">
      <h2>{title}</h2>
      <p>{text}</p>
    </header>
  );
}
