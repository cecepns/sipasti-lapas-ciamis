import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ label = 'Memuat data...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-2.5 text-slate-500">
      <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
      <span className="text-xs sm:text-sm font-medium">{label}</span>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="grid gap-4 px-4 py-3.5 animate-pulse" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }).map((__, cIdx) => (
            <div key={cIdx} className="h-4 rounded-md bg-slate-200/75" />
          ))}
        </div>
      ))}
    </div>
  );
}
