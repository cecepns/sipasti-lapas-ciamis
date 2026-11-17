import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CalendarDays, X } from 'lucide-react';
import { startOfMonth, subDays } from 'date-fns';

export function DateRangeFilter({
  startDate,
  endDate,
  onChange,
  placeholder = 'Pilih rentang tanggal...',
  showPresets = false,
  className = '',
}) {
  const handleRangeChange = (dates) => {
    const [start, end] = dates;
    onChange?.({ startDate: start || null, endDate: end || null });
  };

  const applyPreset = (type) => {
    const today = new Date();
    if (type === 'today') {
      onChange?.({ startDate: today, endDate: today });
    } else if (type === '7d') {
      onChange?.({ startDate: subDays(today, 6), endDate: today });
    } else if (type === '30d') {
      onChange?.({ startDate: subDays(today, 29), endDate: today });
    } else if (type === 'month') {
      onChange?.({ startDate: startOfMonth(today), endDate: today });
    } else {
      onChange?.({ startDate: null, endDate: null });
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <div className="relative min-w-[235px] flex-1 sm:flex-initial">
        <CalendarDays className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-emerald-600" />
        <DatePicker
          selectsRange
          startDate={startDate}
          endDate={endDate}
          onChange={handleRangeChange}
          dateFormat="dd/MM/yyyy"
          placeholderText={placeholder}
          isClearable={false}
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
          popperPlacement="bottom-start"
          portalId="datepicker-portal"
        />
        {(startDate || endDate) && (
          <button
            type="button"
            onClick={() => onChange?.({ startDate: null, endDate: null })}
            className="absolute right-2.5 top-1/2 z-10 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            title="Reset rentang waktu"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {showPresets && (
        <div className="flex flex-wrap items-center gap-1">
          {[
            { key: 'today', label: 'Hari Ini' },
            { key: '7d', label: '7 Hari' },
            { key: '30d', label: '30 Hari' },
            { key: 'month', label: 'Bulan Ini' },
            { key: 'all', label: 'Semua' },
          ].map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => applyPreset(preset.key)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
