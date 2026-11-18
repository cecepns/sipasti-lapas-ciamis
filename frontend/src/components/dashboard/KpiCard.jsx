const ACCENT_STYLES = {
  emerald: {
    iconBg: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    bar: 'bg-emerald-500',
  },
  amber: {
    iconBg: 'bg-amber-50 text-amber-600 ring-amber-100',
    bar: 'bg-amber-500',
  },
  sky: {
    iconBg: 'bg-sky-50 text-sky-600 ring-sky-100',
    bar: 'bg-sky-500',
  },
  teal: {
    iconBg: 'bg-teal-50 text-teal-600 ring-teal-100',
    bar: 'bg-teal-500',
  },
  violet: {
    iconBg: 'bg-violet-50 text-violet-600 ring-violet-100',
    bar: 'bg-violet-500',
  },
  rose: {
    iconBg: 'bg-rose-50 text-rose-600 ring-rose-100',
    bar: 'bg-rose-500',
  },
};

export function KpiCard({ label, value, meta, icon: Icon, accent = 'emerald', progress = 0 }) {
  const style = ACCENT_STYLES[accent] || ACCENT_STYLES.emerald;
  const clampedProgress = Math.max(0, Math.min(100, Number(progress) || 0));

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500 truncate">{label}</p>
          <p className="mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        {Icon && (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${style.iconBg}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      {meta && <p className="mt-2 text-xs text-slate-500 truncate">{meta}</p>}

      <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${style.bar}`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}
