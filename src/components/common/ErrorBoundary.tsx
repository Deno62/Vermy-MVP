import { Component, ErrorInfo, ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: any }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught error', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex items-center justify-center p-6">
          <div className="max-w-md text-center space-y-3">
            <h1 className="text-2xl font-semibold">Etwas ist schiefgelaufen</h1>
            <p className="text-muted-foreground">Bitte laden Sie die Seite neu. Der Fehler wurde in der Konsole protokolliert.</p>
            <button className="underline" onClick={() => window.location.reload()}>Neu laden</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
