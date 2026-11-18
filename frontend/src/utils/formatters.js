import { format, isValid, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export const INSTRUMEN_INFO = {
  SPPN: {
    singkatan: 'SPPN',
    kepanjangan: 'Sistem Penilaian Pembinaan Narapidana',
    peran: 'Penilaian Utama (Penentu Kelayakan)',
    deskripsi:
      'Instrumen penilaian utama berbasis pengamatan perilaku dan pelaksanaan pembinaan narapidana yang menjadi syarat inti pengusulan hak remisi & integrasi (ambang batas minimal skor 70).',
  },
  PPKS: {
    singkatan: 'PPKS',
    kepanjangan: 'Penilaian Pembinaan Kepribadian Spiritual',
    peran: 'Penilaian Pendukung (Monitoring Didikan Lanjutan)',
    deskripsi:
      'Instrumen pendukung untuk memantau kualitas pembinaan kepribadian spiritual. Tidak digabung ke skor SPPN; berfungsi menentukan apakah WBP perlu catatan/didikan spiritual lanjutan.',
  },
};

export const REKOMENDASI_RULES = [
  {
    code: 'direkomendasikan',
    label: 'Direkomendasikan',
    color: 'emerald',
    syarat: 'SPPN >= 70 (Memenuhi Syarat) DAN PPKS >= 70 (Memenuhi Syarat)',
    arti: 'Layak diusulkan hak remisi/integrasi tanpa catatan pembinaan lanjutan.',
  },
  {
    code: 'direkomendasikan_dengan_catatan',
    label: 'Direkomendasikan dengan Catatan',
    color: 'amber',
    syarat: 'SPPN >= 70 (Memenuhi Syarat) NAMUN PPKS < 70 / Belum Dinilai',
    arti: 'Syarat utama SPPN terpenuhi, namun diberi catatan monitoring agar mengikuti didikan/pembinaan spiritual lanjutan.',
  },
  {
    code: 'tidak_direkomendasikan',
    label: 'Tidak Direkomendasikan',
    color: 'rose',
    syarat: 'SPPN < 70 (Belum Memenuhi Syarat)',
    arti: 'Nilai inti SPPN belum memenuhi ambang batas minimal. Wajib pembinaan lanjutan sebelum pengusulan hak.',
  },
];

export const PERIOD_LABELS = {
  harian: 'Harian',
  mingguan: 'Mingguan',
  bulanan: 'Bulanan',
  triwulan: 'Per 3 Bulan (Triwulan)',
};

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
