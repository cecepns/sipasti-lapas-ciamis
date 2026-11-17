const VARIANT_MAP = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  blue: 'bg-sky-50 text-sky-700 border-sky-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
};

export function StatusBadge({ label, variant = 'slate', icon: Icon }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${
        VARIANT_MAP[variant] || VARIANT_MAP.slate
      }`}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </span>
  );
}
