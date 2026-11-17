import { format, isValid, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export const ROLE_LABELS = {
  admin: 'Admin SIPASTI',
  wali_pas: 'Wali PAS',
  mitra: 'Mitra Keagamaan',
  kasubsi: 'Kasubsi Reg & Bimkemas',
  kasi_binadik: 'Kasi Binadik',
  kalapas: 'Ka. Lapas',
};

export const ROLE_COLORS = {
  admin: 'bg-purple-100 text-purple-800 border-purple-200',
  wali_pas: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  mitra: 'bg-amber-100 text-amber-800 border-amber-200',
  kasubsi: 'bg-sky-100 text-sky-800 border-sky-200',
  kasi_binadik: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  kalapas: 'bg-slate-900 text-amber-300 border-slate-700',
};

export function toIsoDate(date) {
  if (!date) return '';
  if (typeof date === 'string') return date.slice(0, 10);
  if (!isValid(date)) return '';
  return format(date, 'yyyy-MM-dd');
}

export function formatDate(value, pattern = 'dd MMM yyyy') {
  if (!value) return '-';
  const d = typeof value === 'string' ? parseISO(value.replace(' ', 'T')) : new Date(value);
  if (!isValid(d)) return '-';
  return format(d, pattern, { locale: localeId });
}

export function formatDateTime(value) {
  return formatDate(value, 'dd MMM yyyy, HH:mm');
}

export function formatNumber(value, decimals = 0) {
  const num = Number(value || 0);
  return num.toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatDateRangeLabel(startDate, endDate) {
  if (!startDate && !endDate) return 'Semua Periode';
  if (startDate && endDate) {
    return `${formatDate(startDate, 'dd MMM yyyy')} — ${formatDate(endDate, 'dd MMM yyyy')}`;
  }
  if (startDate) return `Mulai ${formatDate(startDate, 'dd MMM yyyy')}`;
  return `Sampai ${formatDate(endDate, 'dd MMM yyyy')}`;
}
