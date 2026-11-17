import { Inbox } from 'lucide-react';

export function EmptyState({
  icon: Icon = Inbox,
  title = 'Belum ada data',
  description = 'Data yang Anda cari belum tersedia atau tidak sesuai dengan filter aktif.',
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-3">
        <Icon className="h-7 w-7" />
      </div>
      <h4 className="text-sm font-bold text-slate-800">{title}</h4>
      <p className="mt-1 max-w-md text-xs sm:text-sm text-slate-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
