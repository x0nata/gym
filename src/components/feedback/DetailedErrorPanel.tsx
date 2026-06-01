import { AlertTriangle, Bug, LifeBuoy } from "lucide-react";
import type { AppErrorDetails } from "../../lib/errorHandling";

type DetailedErrorPanelProps = {
  error: AppErrorDetails;
  className?: string;
};

export function DetailedErrorPanel({ error, className }: DetailedErrorPanelProps) {
  return (
    <div className={`border-2 border-red-500 bg-red-50 text-red-900 p-4 ${className ?? ""}`.trim()}>
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 border-2 border-red-500 bg-white flex items-center justify-center shrink-0">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <p className="text-sm font-black uppercase tracking-wider">{error.title}</p>
          <p className="text-sm font-bold leading-relaxed">{error.message}</p>

          {error.hint && (
            <div className="flex items-start gap-2 text-xs font-bold uppercase tracking-wider text-red-800">
              <LifeBuoy className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{error.hint}</span>
            </div>
          )}

          {(error.code || error.requestId || error.technical) && (
            <details className="mt-2 border border-red-300 bg-white/70 p-2">
              <summary className="cursor-pointer text-[11px] font-black uppercase tracking-widest inline-flex items-center gap-1.5">
                <Bug className="h-3.5 w-3.5" />
                Error details
              </summary>
              <div className="mt-2 space-y-1 text-[11px] font-mono break-all text-red-950">
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
