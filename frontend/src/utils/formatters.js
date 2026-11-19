import { format, isValid, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export const INSTRUMEN_INFO = {
  SPPN: {
    singkatan: 'SPPN',
    kepanjangan: 'Sistem Penilaian Pembinaan Narapidana',
    peran: 'Penilaian Utama (Penentu Kelayakan Remisi & Integrasi)',
    rumus: 'Nilai SPPN = Σ (Ri / Targeti × Wi)',
    deskripsi:
      'Sistem penilaian yang digunakan untuk mengukur, mencatat, dan mengevaluasi keaktifan serta perkembangan perilaku WBP selama mengikuti program pembinaan. Hasil rekapitulasi menjadi dasar objektif dan terverifikasi untuk remisi dan program integrasi (ambang batas minimal skor 70). Total bobot program bernilai tepat 100.',
  },
  PPKS: {
    singkatan: 'PPKS',
    kepanjangan: 'Penilaian Perkembangan Karakter Spiritual',
    peran: 'Instrumen Evaluasi Kualitatif Komplementer (Skala 1 - 5)',
    skala: '1.00 s/d 5.00',
    deskripsi:
      'Instrumen evaluasi kualitatif komplementer untuk mendokumentasikan perubahan sikap, kedisiplinan, dan penghayatan nilai-nilai keagamaan secara mendalam. Indeks komposit rentang 1 hingga 5 menyempurnakan rekapitulasi data SI PASTI sebagai data pendukung ke dalam SPPN.',
  },
};

export const REKOMENDASI_RULES = [
  {
    code: 'direkomendasikan',
    kualifikasiAkhir: 2,
    label: 'Memenuhi Syarat dan Direkomendasikan',
    shortLabel: 'Direkomendasikan',
    color: 'emerald',
    syarat: 'Kualifikasi SPPN Baik (≥ 70) DAN Kualifikasi PPKS Baik (≥ 4.0)',
    arti: 'Nilai telah memenuhi seluruh standar penilaian dan pengajuan berhak mendapatkan rekomendasi.',
  },
  {
    code: 'direkomendasikan_dengan_catatan',
    kualifikasiAkhir: 1,
    label: 'Memenuhi Syarat dengan Pertimbangan',
    shortLabel: 'Dengan Pertimbangan',
    color: 'amber',
    syarat: 'Kualifikasi SPPN Baik (≥ 70), namun nilai PPKS berada pada kategori Cukup/Kurang (< 4.0)',
    arti: 'Memenuhi syarat dasar penilaian dan berhak mendapatkan rekomendasi, namun dengan pertimbangan dan catatan khusus.',
  },
  {
    code: 'tidak_direkomendasikan',
    kualifikasiAkhir: 0,
    label: 'Tidak Memenuhi Syarat',
    shortLabel: 'Tidak Direkomendasikan',
    color: 'rose',
    syarat: 'Akumulasi nilai SPPN < 70 (Kualifikasi SPPN 0)',
    arti: 'Nilai belum memenuhi syarat dasar penilaian. Pengajuan tidak mendapatkan rekomendasi.',
  },
];

export const TRIWULAN_OPTIONS = [
  { key: 'TW-4', label: 'Triwulan IV (Berjalan)', sub: 'Okt – Des 2026', startDate: '2026-10-01', endDate: '2026-12-31' },
  { key: 'TW-3', label: 'Triwulan III', sub: 'Jul – Sep 2026', startDate: '2026-07-01', endDate: '2026-09-30' },
  { key: 'TW-2', label: 'Triwulan II', sub: 'Apr – Jun 2026', startDate: '2026-04-01', endDate: '2026-06-30' },
  { key: 'TW-1', label: 'Triwulan I', sub: 'Jan – Mar 2026', startDate: '2026-01-01', endDate: '2026-03-31' },
];

export const PERIOD_LABELS = {
  harian: 'Harian',
  mingguan: 'Mingguan',
  bulanan: 'Bulanan',
  triwulan: 'Triwulan',
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
