export function SectionCard({ title, icon: Icon, action, children, className = '', bodyClassName = 'p-5' }) {
  return (
    <section
      className={`rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden flex flex-col ${className}`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2 min-w-0">
          {Icon && <Icon className="h-4 w-4 text-emerald-600 shrink-0" />}
          <span className="truncate">{title}</span>
        </h3>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className={`flex-1 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
