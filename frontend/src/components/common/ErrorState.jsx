import { AlertCircle, RefreshCw } from 'lucide-react';

export function ErrorState({ message = 'Gagal memuat data dari server.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/50 py-10 px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600 mb-3">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h4 className="text-sm font-bold text-rose-900">Terjadi Kendala</h4>
      <p className="mt-1 max-w-md text-xs sm:text-sm text-rose-700">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Coba Lagi
        </button>
      )}
    </div>
  );
}
