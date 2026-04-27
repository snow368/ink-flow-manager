import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-dvh p-8 text-center">
          <div className="text-6xl mb-4">😵</div>
          <h2 className="text-xl font-bold mb-2">Oops, something broke</h2>
          <p className="text-ink-400 mb-6 text-sm">{this.state.error?.message || 'Unexpected error'}</p>
          <button onClick={this.handleReset} className="bg-accent-500 text-white px-8 py-3 rounded-xl font-medium">
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
