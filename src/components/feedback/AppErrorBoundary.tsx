import { Component, type ErrorInfo, type ReactNode } from "react";
import { RefreshCcw, ShieldAlert } from "lucide-react";
import { toDisplayError, type AppErrorDetails } from "../../lib/errorHandling";
import { DetailedErrorPanel } from "./DetailedErrorPanel";

type Props = {
  children: ReactNode;
};

type State = {
  error: AppErrorDetails | null;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return {
      error: toDisplayError(error, {
        title: "Something went wrong",
        fallbackMessage: "Something went wrong.",
      }),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error("AppErrorBoundary caught error", error, errorInfo);
    }
  }

  reload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-theme-raised flex items-center justify-center p-4 font-['Outfit']">
        <div className="w-full max-w-2xl border-4 border-theme-strong bg-theme-raised shadow-[4px_4px_0px_0px_var(--border-strong)]">
          <div className="p-4 md:p-6 border-b-4 border-theme-strong bg-theme-sidebar flex items-center gap-3">
            <div className="h-10 w-10 border-2 border-theme-strong bg-white flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-theme-muted">Error</p>
              <h1 className="text-lg font-black uppercase font-['Syncopate']">Oops</h1>
            </div>
          </div>

          <div className="p-4 md:p-6 space-y-4">
            <DetailedErrorPanel error={this.state.error} />
            <button
              onClick={this.reload}
              className="h-11 px-4 border-2 border-theme-strong bg-black text-white text-xs font-black uppercase tracking-widest inline-flex items-center gap-2 hover:bg-theme-raised hover:text-theme transition-colors"
            >
              <RefreshCcw className="h-4 w-4" />
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
