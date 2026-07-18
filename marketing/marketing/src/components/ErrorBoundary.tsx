import { Component, type ReactNode } from 'react';
import { THEME } from '../lib/theme';
import { detectInitialLanguage, t } from '../lib/i18n';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; errorInfo: string; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, errorInfo: '' };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error.message, errorInfo.componentStack);
    this.setState({ errorInfo: errorInfo.componentStack || '' });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: '' });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const lang = detectInitialLanguage();
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100dvh', padding: 24, textAlign: 'center', background: THEME.bg.app, color: THEME.text.primary,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{t(lang, 'error_title')}</h2>
          <p style={{ color: THEME.text.muted, fontSize: 14, marginBottom: 20, maxWidth: 360 }}>
            {this.state.error?.message || t(lang, 'error_unknown')}
          </p>
          <button
            onClick={this.handleReset}
            style={{
              padding: '12px 32px', borderRadius: 12, border: 'none',
              background: THEME.brand.primary, color: 'white', fontSize: 16, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {t(lang, 'error_retry')}
          </button>
          {this.state.errorInfo && (
            <details style={{ marginTop: 20, maxWidth: 400, textAlign: 'left' }}>
              <summary style={{ fontSize: 11, color: THEME.text.subtle, cursor: 'pointer' }}>{t(lang, 'error_details')}</summary>
              <pre style={{ fontSize: 10, color: THEME.text.muted, marginTop: 8, whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{this.state.errorInfo}</pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
