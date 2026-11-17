import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SelectInput } from './SelectInput';

const LIMIT_OPTIONS = [
  { value: 10, label: '10 / halaman' },
  { value: 25, label: '25 / halaman' },
  { value: 50, label: '50 / halaman' },
  { value: 100, label: '100 / halaman' },
];

function getVisiblePages(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push('...');
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < total - 1) pages.push('...');
  pages.push(total);
  return pages;
}

export function Pagination({ pagination, onPageChange, onLimitChange }) {
  const { page = 1, limit = 10, total = 0, totalPages = 1 } = pagination || {};
  const pages = getVisiblePages(page, totalPages);
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 px-4 py-3.5 bg-slate-50/50 rounded-b-xl">
      <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-600">
        <span>
          Menampilkan <strong className="text-slate-900">{from}–{to}</strong> dari{' '}
          <strong className="text-slate-900">{total}</strong> data
        </span>
        <div className="w-36">
          <SelectInput
            value={LIMIT_OPTIONS.find((o) => o.value === Number(limit)) || LIMIT_OPTIONS[0]}
            onChange={(opt) => opt && onLimitChange?.(opt.value)}
            options={LIMIT_OPTIONS}
            isSearchable={false}
            isClearable={false}
            menuPlacement="top"
            compact
          />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange?.(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {pages.map((p, idx) =>
          p === '...' ? (
            <span key={`dots-${idx}`} className="px-2 text-xs text-slate-400">
              ...
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange?.(p)}
              className={`min-w-[32px] h-8 rounded-lg px-2 text-xs font-semibold transition-all ${
                p === page
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange?.(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
