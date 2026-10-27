// Перехват ошибок интерфейса: вместо белого экрана - объяснение и выход. Тема хранится в браузере,
// и настройка, которую конструктор не смог показать, иначе ломала бы сайт и после перезагрузки.

import { Component, type ReactNode } from 'react';
import { RotateCcw, Undo2 } from 'lucide-react';
import { useStore } from '../state/store';
import { defaultConfig } from '../lib/defaults';
import { Button } from './ui';

interface Props { children: ReactNode; area: string }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };
  private unsub?: () => void;

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error(`[koala-theme] Не удалось показать ${this.props.area}:`, error);
  }

  // Любая правка темы (в том числе Ctrl+Z) - новая попытка показать
  componentDidMount() {
    this.unsub = useStore.subscribe((s, prev) => { if (this.state.error && s.config !== prev.config) this.setState({ error: null }); });
  }

  componentWillUnmount() {
    this.unsub?.();
  }

  render() {
    if (!this.state.error) return this.props.children;
    const { past, undo, replace } = useStore.getState();
    return (
      <div className="crash" role="alert">
        <b>Не удалось показать {this.props.area}</b>
        <p className="note">В теме есть настройка, которую конструктор не понял. Отмените последнее изменение или начните с чистой темы.</p>
        <div className="btn-row">
          {past.length > 0 && <Button size="sm" variant="soft" icon={<Undo2 size={14} />} onClick={undo}>Отменить изменение</Button>}
          <Button size="sm" variant="soft" icon={<RotateCcw size={14} />} onClick={() => replace(defaultConfig(), 'Открыта чистая тема. Ctrl+Z - вернуть прежнюю')}>Чистая тема</Button>
        </div>
      </div>
    );
  }
}
