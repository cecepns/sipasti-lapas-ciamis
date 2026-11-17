import toast from 'react-hot-toast';
import { AlertTriangle } from 'lucide-react';

/**
 * Interactive confirmation toast powered by react-hot-toast
 */
export function showConfirmToast({
  title = 'Konfirmasi Hapus',
  message = 'Apakah Anda yakin ingin menghapus data ini?',
  confirmText = 'Ya, Hapus',
  cancelText = 'Batal',
  variant = 'danger',
  onConfirm,
}) {
  toast.custom(
    (t) => (
      <div
        className={`pointer-events-auto w-full max-w-sm rounded-2xl bg-white p-4 shadow-2xl border border-slate-200 transition-all ${
          t.visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              variant === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-slate-900">{title}</h4>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">{message}</p>
            <div className="mt-3.5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => toast.dismiss(t.id)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={async () => {
                  toast.dismiss(t.id);
                  await onConfirm?.();
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors ${
                  variant === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    ),
    { duration: Infinity, position: 'top-center' }
  );
}
