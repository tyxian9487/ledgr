import { Component, ErrorInfo, ReactNode } from 'react';
import { useTranslation } from '../context/LanguageContext';

function ErrorFallback({ message, onReset }: { message: string; onReset: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-950 text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <span className="text-2xl">⚠️</span>
      </div>
      <h1 className="text-lg font-bold text-gray-800 dark:text-white mb-2">{t('error.went_wrong')}</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
        {message}
      </p>
      <button
        onClick={onReset}
        className="px-5 py-2.5 rounded-2xl bg-green-600 text-white text-sm font-semibold"
      >
        {t('error.try_again')}
      </button>
    </div>
  );
}

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorFallback
          message={this.state.error.message}
          onReset={() => this.setState({ error: null })}
        />
      );
    }
    return this.props.children;
  }
}
