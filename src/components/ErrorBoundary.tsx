import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import type { FirestoreErrorInfo } from '../lib/firebase';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
  firestoreError: FirestoreErrorInfo | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
      firestoreError: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let parsed: FirestoreErrorInfo | null = null;
    try {
      if (error.message.trim().startsWith('{')) {
        const candidate = JSON.parse(error.message) as FirestoreErrorInfo;
        if (candidate && typeof candidate.error === 'string' && 'operationType' in candidate) {
          parsed = candidate;
        }
      }
    } catch {
      parsed = null;
    }

    return {
      hasError: true,
      errorMessage: parsed ? parsed.error : error.message || 'An unexpected application error occurred.',
      firestoreError: parsed,
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Application ErrorBoundary caught error:', error.message, info.componentStack);
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      errorMessage: '',
      firestoreError: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#F7F4EC] p-6">
          <div className="w-full max-w-lg rounded-2xl border border-[#092F35]/15 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-[#092F35]">
                  Workspace Interrupted
                </h1>
                <p className="text-xs text-slate-500">
                  A recoverable application or database permission error occurred.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
              <p className="font-medium text-[#092F35]">{this.state.errorMessage}</p>
              {this.state.firestoreError && (
                <div className="mt-2 space-y-1 text-[11px] text-slate-600">
                  <p>
                    Operation:{' '}
                    <span className="font-mono font-medium">
                      {this.state.firestoreError.operationType}
                    </span>
                  </p>
                  {this.state.firestoreError.path && (
                    <p>
                      Path:{' '}
                      <span className="font-mono font-medium">
                        {this.state.firestoreError.path}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 rounded-lg bg-[#092F35] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F4C5C]"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Try Again</span>
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
