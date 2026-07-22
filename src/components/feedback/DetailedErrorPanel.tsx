import { AlertTriangle, Bug, LifeBuoy } from "lucide-react";
import type { AppErrorDetails } from "../../lib/errorHandling";

type DetailedErrorPanelProps = {
  error: AppErrorDetails;
  className?: string;
};

export function DetailedErrorPanel({ error, className }: DetailedErrorPanelProps) {
  return (
    <div
      className={`rounded-2xl border border-danger/40 bg-danger/10 p-4 ${className ?? ""}`.trim()}
    >
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-danger/15 text-danger shrink-0">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <p className="text-sm font-bold text-theme">{error.title}</p>
          <p className="text-sm text-theme-secondary leading-relaxed">{error.message}</p>

          {error.hint && (
            <div className="flex items-start gap-2 text-xs text-theme-secondary">
              <LifeBuoy className="h-3.5 w-3.5 mt-0.5 shrink-0 text-danger" />
              <span>{error.hint}</span>
            </div>
          )}

          {(error.code || error.requestId || error.technical) && (
            <details className="mt-2 rounded-lg border border-theme bg-hover p-2">
              <summary className="cursor-pointer text-[11px] font-semibold text-theme-muted inline-flex items-center gap-1.5">
                <Bug className="h-3.5 w-3.5" />
                Error details
              </summary>
              <div className="mt-2 space-y-1 text-[11px] font-mono break-all text-theme-secondary">
                {error.code && <p>Code: {error.code}</p>}
                {error.requestId && <p>Request ID: {error.requestId}</p>}
                {error.technical && <p>Raw: {error.technical}</p>}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
