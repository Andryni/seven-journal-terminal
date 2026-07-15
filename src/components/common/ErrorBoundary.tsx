import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { AlertOctagon } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 max-w-2xl mx-auto font-mono text-xs text-bloomberg-text-primary">
          <Card title="TERMINAL ERROR / RUNTIME EXCEPTION" headerAction={<AlertOctagon className="w-4 h-4 text-bloomberg-red" />}>
            <div className="space-y-4">
              <div className="bg-bloomberg-red/10 border border-bloomberg-red p-3 rounded-sm text-bloomberg-red-light font-bold">
                Une exception système non gérée est survenue lors de l'affichage de ce panneau.
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-bloomberg-text-secondary uppercase">Message d'erreur :</span>
                <pre className="bg-black/50 border border-bloomberg-border p-2.5 rounded-sm text-white overflow-x-auto select-text">
                  {this.state.error?.toString()}
                </pre>
              </div>

              {this.state.errorInfo && (
                <div className="space-y-1">
                  <span className="text-[10px] text-bloomberg-text-secondary uppercase">Stack Trace :</span>
                  <pre className="bg-black/50 border border-bloomberg-border p-2.5 rounded-sm text-bloomberg-text-secondary overflow-x-auto text-[9px] leading-relaxed max-h-40 overflow-y-auto select-text">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              )}

              <Button onClick={this.handleRetry} className="w-full">
                REDÉMARRER LE TERMINAL (RELOAD)
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
