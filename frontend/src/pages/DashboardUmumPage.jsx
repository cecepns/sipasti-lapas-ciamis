import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileDown,
  Filter,
  Handshake,
  Layers,
  Minus,
  PieChart as PieChartIcon,
  PlusCircle,
  ScanFace,
  Search,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { request, extractErrorMessage } from '@/utils/request';
import { API_ENDPOINTS } from '@/utils/endpoints';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorState } from '@/components/common/ErrorState';
import { SelectInput } from '@/components/common/SelectInput';
import {
  formatDate,
  formatNumber,
  ROLE_LABELS,
  TRIWULAN_OPTIONS,
  TREND_OPTIONS,
  KUALIFIKASI_AKHIR_OPTIONS,
  TIPE_ASESOR_OPTIONS,
} from '@/utils/formatters';
import { exportAssessmentsPdf } from '@/utils/pdfGenerator';

export function DashboardUmumPage() {
  const { user } = useAuth();

  // Filter Bar Global State (Berdasarkan Wireframe Image 1)
  const [selectedTw, setSelectedTw] = useState(TRIWULAN_OPTIONS[0]);
  const [selectedBulan, setSelectedBulan] = useState('Semua Bulan');
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedTrend, setSelectedTrend] = useState(TREND_OPTIONS[0]);
  const [selectedKualifikasi, setSelectedKualifikasi] = useState(KUALIFIKASI_AKHIR_OPTIONS[0]);
  const [selectedAsesor, setSelectedAsesor] = useState(TIPE_ASESOR_OPTIONS[0]);

  const [programsList, setProgramsList] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  // Fetch Program Options
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const res = await request.get(API_ENDPOINTS.PROGRAMS.LIST, { status: 'aktif' });
        const opts = (res.data || []).map((p) => ({
          value: p.id,
          label: `${p.nama_program} (${p.bobot}%)`,
        }));
        setProgramsList([{ value: 'all', label: 'Semua Program' }, ...opts]);
      } catch {
        // Fallback options
        setProgramsList([
          { value: 'all', label: 'Semua Program' },
          { value: 1, label: 'Pembelajaran Al-Quran (30%)' },
          { value: 2, label: 'Sholat Fardhu Berjamaah (25%)' },
          { value: 3, label: 'Kajian Fiqih & Ibadah (20%)' },
          { value: 4, label: 'Bimbingan Konseling Rohani (15%)' },
          { value: 5, label: 'Peringatan Hari Besar Islam (10%)' },
        ]);
      }
    };
    fetchPrograms();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await request.get(API_ENDPOINTS.DASHBOARD.UMUM, {
        triwulan: selectedTw.key,
        bulan: selectedBulan,
        program_id: selectedProgram?.value !== 'all' ? selectedProgram?.value : undefined,
        trend: selectedTrend?.value !== 'all' ? selectedTrend?.value : undefined,
        kualifikasi_akhir: selectedKualifikasi?.value !== 'all' ? selectedKualifikasi?.value : undefined,
        tipe_asesor: selectedAsesor?.value !== 'all' ? selectedAsesor?.value : undefined,
      });
      setData(res.data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Gagal memuat Dasbor Umum'));
    } finally {
      setLoading(false);
    }
  }, [selectedTw, selectedBulan, selectedProgram, selectedTrend, selectedKualifikasi, selectedAsesor]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const res = await request.get(API_ENDPOINTS.REPORTS.EXPORT_DATA, {
        type: 'assessments',
        triwulan: selectedTw.key,
      });
      await exportAssessmentsPdf(res.data || [], {
        triwulan: selectedTw.key,
      });
      toast.success('Laporan PDF Dasbor berhasil diunduh');
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Gagal mengunduh PDF'));
    } finally {
      setExporting(false);
    }
  };

  // Fallback structures if backend values are null
  const bu = data?.bagian_utama || {
    wbp_aktif: { title: 'WBP Aktif', value: 120, unit: 'WBP', trend: '+1.7%', trend_status: 'up', trend_label: 'v. Trimester Sebelumnya' },
    program_aktif: { title: 'Program Aktif', value: 5, unit: 'Program', trend: '0%', trend_status: 'stable', trend_label: 'v. Trimester Sebelumnya' },
    walipas_aktif: { title: 'Walipas Aktif', value: 8, unit: 'Orang', trend: '+12.5%', trend_status: 'up', trend_label: 'v. Trimester Sebelumnya' },
    mitra_aktif: { title: 'Mitra Aktif', value: 4, unit: 'Instansi', trend: '+25.0%', trend_status: 'up', trend_label: 'v. Trimester Sebelumnya' },
    rata_sppn: { title: 'Rata-rata SPPN', value: 82.4, unit: '/ 100', trend: '+4.2%', trend_status: 'up', trend_label: 'v. Trimester Sebelumnya' },
    rata_ppks: { title: 'Rata-rata PPKS', value: 4.35, unit: '/ 5.00', trend: '+0.18', trend_status: 'up', trend_label: 'v. Trimester Sebelumnya' },
    total_direkomendasikan: { title: 'Total Direkomendasikan', value: 85, unit: 'WBP', trend: '+5.2%', trend_status: 'up', trend_label: 'v. Trimester Sebelumnya' },
  };

  const bs = data?.bagian_sekunder || {
    sebaran_pelaksanaan: [
      { name: 'Pelaksanaan = 1 (Ya)', count: 360, pct: 94.2, color: '#10b981' },
      { name: 'Pelaksanaan = 0 (Tidak)', count: 24, pct: 5.8, color: '#ef4444' },
    ],
    sebaran_predikat: [
      { name: 'Direkomendasikan (Kual 2)', count: 85, pct: 70.8, color: '#10b981' },
      { name: 'Dg Pertimbangan (Kual 1)', count: 25, pct: 20.8, color: '#f59e0b' },
      { name: 'Tidak Memenuhi (Kual 0)', count: 10, pct: 8.4, color: '#ef4444' },
    ],
    pelaksanaan_line: [
      { hari: 'H-10', tw_berjalan: 92.0, tw_sebelumnya: 85.0 },
      { hari: 'H-20', tw_berjalan: 93.5, tw_sebelumnya: 86.2 },
      { hari: 'H-30', tw_berjalan: 94.0, tw_sebelumnya: 87.5 },
      { hari: 'H-40', tw_berjalan: 95.2, tw_sebelumnya: 88.0 },
      { hari: 'H-50', tw_berjalan: 94.6, tw_sebelumnya: 88.5 },
      { hari: 'H-60', tw_berjalan: 96.0, tw_sebelumnya: 89.4 },
      { hari: 'H-70', tw_berjalan: 95.8, tw_sebelumnya: 90.1 },
      { hari: 'H-80', tw_berjalan: 96.5, tw_sebelumnya: 90.8 },
    ],
  };

  const bt = data?.bagian_tambahan || {
    komparasi_scatter: [
      { id: 1, nama: 'Ahmad bin Zulkifli', sppn: 86, ppks: 4.45, kualifikasi: 2, predikat: 'Kualifikasi 2: Direkomendasikan', color: '#10b981' },
      { id: 2, nama: 'Budi Santoso', sppn: 81, ppks: 4.20, kualifikasi: 2, predikat: 'Kualifikasi 2: Direkomendasikan', color: '#10b981' },
      { id: 3, nama: 'Cecep Sunandar', sppn: 74, ppks: 3.75, kualifikasi: 1, predikat: 'Kualifikasi 1: Dg Pertimbangan', color: '#f59e0b' },
      { id: 4, nama: 'Dedi Kurniawan', sppn: 66, ppks: 3.60, kualifikasi: 0, predikat: 'Kualifikasi 0: Tidak Memenuhi', color: '#ef4444' },
      { id: 5, nama: 'Eko Prasetyo', sppn: 88, ppks: 4.60, kualifikasi: 2, predikat: 'Kualifikasi 2: Direkomendasikan', color: '#10b981' },
      { id: 6, nama: 'Fajar Nugraha', sppn: 72, ppks: 3.85, kualifikasi: 1, predikat: 'Kualifikasi 1: Dg Pertimbangan', color: '#f59e0b' },
      { id: 7, nama: 'Gunawan Wibowo', sppn: 63, ppks: 3.20, kualifikasi: 0, predikat: 'Kualifikasi 0: Tidak Memenuhi', color: '#ef4444' },
      { id: 8, nama: 'Hendra Saputra', sppn: 79, ppks: 4.15, kualifikasi: 2, predikat: 'Kualifikasi 2: Direkomendasikan', color: '#10b981' },
    ],
    tantangan_program: [
      { nama_program: 'Tahsin Quran', bobot: 30, pelaksanaan: 45, target: 48 },
      { nama_program: 'Sholat Berjamaah', bobot: 25, pelaksanaan: 58, target: 60 },
      { nama_program: 'Kajian Fiqih', bobot: 20, pelaksanaan: 34, target: 36 },
      { nama_program: 'Konseling Rohani', bobot: 15, pelaksanaan: 24, target: 24 },
      { nama_program: 'PHBI', bobot: 10, pelaksanaan: 12, target: 12 },
    ],
    hambatan_pareto: [
      { alasan: 'Sakit / Rawat Klinik', count: 18, persentase: 40.0, kumulatif: 40.0 },
      { alasan: 'Jadwal Sidang Pengadilan', count: 12, persentase: 26.7, kumulatif: 66.7 },
      { alasan: 'Kunjungan / Besukan Keluarga', count: 7, persentase: 15.6, kumulatif: 82.3 },
      { alasan: 'Piket / Kebersihan Lingkungan', count: 5, persentase: 11.1, kumulatif: 93.4 },
      { alasan: 'Dispensasi Lainnya', count: 3, persentase: 6.6, kumulatif: 100.0 },
    ],
    aktivitas_walipas_mitra: [
      { periode: 'Mg 1', walipas: 38, mitra: 24 },
      { periode: 'Mg 2', walipas: 42, mitra: 29 },
      { periode: 'Mg 3', walipas: 40, mitra: 31 },
      { periode: 'Mg 4', walipas: 45, mitra: 30 },
      { periode: 'Mg 5', walipas: 43, mitra: 35 },
      { periode: 'Mg 6', walipas: 48, mitra: 36 },
      { periode: 'Mg 7', walipas: 46, mitra: 38 },
      { periode: 'Mg 8', walipas: 50, mitra: 40 },
    ],
    tabel_ranking_predikat: [
      { id: 1, nama: 'Eko Prasetyo', sppn: 88, ppks: 4.60, kualifikasi: 2, predikat: 'Kualifikasi 2: Direkomendasikan' },
      { id: 2, nama: 'Ahmad bin Zulkifli', sppn: 86, ppks: 4.45, kualifikasi: 2, predikat: 'Kualifikasi 2: Direkomendasikan' },
      { id: 3, nama: 'Budi Santoso', sppn: 81, ppks: 4.20, kualifikasi: 2, predikat: 'Kualifikasi 2: Direkomendasikan' },
      { id: 4, nama: 'Hendra Saputra', sppn: 79, ppks: 4.15, kualifikasi: 2, predikat: 'Kualifikasi 2: Direkomendasikan' },
      { id: 5, nama: 'Cecep Sunandar', sppn: 74, ppks: 3.75, kualifikasi: 1, predikat: 'Kualifikasi 1: Dg Pertimbangan' },
      { id: 6, nama: 'Fajar Nugraha', sppn: 72, ppks: 3.85, kualifikasi: 1, predikat: 'Kualifikasi 1: Dg Pertimbangan' },
      { id: 7, nama: 'Dedi Kurniawan', sppn: 66, ppks: 3.60, kualifikasi: 0, predikat: 'Kualifikasi 0: Tidak Memenuhi' },
      { id: 8, nama: 'Gunawan Wibowo', sppn: 63, ppks: 3.20, kualifikasi: 0, predikat: 'Kualifikasi 0: Tidak Memenuhi' },
    ],
    tabel_tren: [
      { id: 7, nama: 'Gunawan Wibowo', sppn_ini: 63, sppn_lalu: 70, sppn_trend_pct: -10.0, ppks_ini: 3.20, ppks_lalu: 3.50, ppks_trend_pct: -8.6, status_tren: 'Menurun' },
      { id: 4, nama: 'Dedi Kurniawan', sppn_ini: 66, sppn_lalu: 71, sppn_trend_pct: -7.0, ppks_ini: 3.60, ppks_lalu: 3.75, ppks_trend_pct: -4.0, status_tren: 'Menurun' },
      { id: 3, nama: 'Cecep Sunandar', sppn_ini: 74, sppn_lalu: 75, sppn_trend_pct: -1.3, ppks_ini: 3.75, ppks_lalu: 3.72, ppks_trend_pct: 0.8, status_tren: 'Stabil' },
      { id: 2, nama: 'Budi Santoso', sppn_ini: 81, sppn_lalu: 79, sppn_trend_pct: 2.5, ppks_ini: 4.20, ppks_lalu: 4.10, ppks_trend_pct: 2.4, status_tren: 'Meningkat' },
      { id: 1, nama: 'Ahmad bin Zulkifli', sppn_ini: 86, sppn_lalu: 82, sppn_trend_pct: 4.9, ppks_ini: 4.45, ppks_lalu: 4.25, ppks_trend_pct: 4.7, status_tren: 'Meningkat' },
      { id: 5, nama: 'Eko Prasetyo', sppn_ini: 88, sppn_lalu: 83, sppn_trend_pct: 6.0, ppks_ini: 4.60, ppks_lalu: 4.35, ppks_trend_pct: 5.7, status_tren: 'Meningkat' },
    ],
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Institutional Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-850 via-teal-850 to-slate-900 px-6 py-6 sm:px-8 sm:py-7 text-white shadow-xl shadow-emerald-950/20 border border-emerald-700/30">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="flex items-center gap-2.5 shrink-0">
              <img
                src="/logo-kemenas.png"
                alt="Logo Kementerian"
                className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-contain bg-white p-1.5 shadow-md border border-white/20"
              />
              <img
                src="/logo-sipasti.png"
                alt="Logo SIPASTI"
                className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-contain bg-white p-1.5 shadow-md border border-white/20"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-200 border border-white/15">
                <span>{ROLE_LABELS[user?.role] || user?.role}</span>
                <span>•</span>
                <span>{formatDate(new Date(), 'EEEE, dd MMMM yyyy')}</span>
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-white">
                Selamat Datang, {user?.nama}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 font-medium">
                Dasbor Pemantauan Pembinaan Spiritual • Lapas Kelas IIB Ciamis
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {['admin', 'wali_pas', 'mitra'].includes(user?.role) && (
              <Link
                to="/app/penilaian"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-950 shadow-md hover:bg-amber-300 transition-colors"
              >
                <PlusCircle className="h-4 w-4" />
                Input Penilaian
              </Link>
            )}
            <Link
              to="/app/rekap-penilaian"
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 border border-white/20 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-white/25 transition-colors"
            >
              <Calendar className="h-4 w-4" />
              Rekap Triwulan
            </Link>
            <Link
              to="/app/panduan"
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 border border-white/20 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-white/25 transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              Buku Panduan
            </Link>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={exporting || loading}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-emerald-850 shadow-sm hover:bg-emerald-50 disabled:opacity-50 transition-colors"
            >
              <FileDown className="h-4 w-4" />
              {exporting ? 'Menyiapkan...' : 'Unduh PDF'}
            </button>
          </div>
        </div>
      </div>

      {/* Segmented Switcher Tabs between Dashboards */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 w-fit max-w-full overflow-x-auto">
        <Link
          to="/app/dasbor-umum"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-emerald-800 bg-white shadow-xs border border-slate-200/60 whitespace-nowrap"
        >
          <Layers className="h-4 w-4 text-emerald-600" />
          <span>Dasbor Umum</span>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
            Aktif
          </span>
        </Link>
        <Link
          to="/app/dasbor-wbp"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all whitespace-nowrap"
        >
          <Award className="h-4 w-4 text-slate-500" />
          <span>Dasbor WBP</span>
        </Link>
        <Link
          to="/app/dasbor-program"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all whitespace-nowrap"
        >
          <BookOpen className="h-4 w-4 text-slate-500" />
          <span>Dasbor Program</span>
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* FILTER BAR GLOBAL (Sesuai Wireframe Image 1: Triwulan, Program, Trend, dll) */}
      {/* ========================================================================= */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-emerald-700" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Filter Bar Global
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Secara triwulan, tanpa date range acak. Jika pun difilter lebih kecil (bulan/minggu/hari) tetap dalam rentang triwulan.
          </p>
        </div>

        {/* Global Controls Row 1 */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {/* Pilih Triwulan */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Pilih Triwulan</label>
            <div className="inline-flex w-full rounded-xl bg-slate-100 p-1 text-xs font-bold">
              {TRIWULAN_OPTIONS.map((tw) => (
                <button
                  key={tw.key}
                  type="button"
                  onClick={() => {
                    setSelectedTw(tw);
                    setSelectedBulan('Semua Bulan');
                  }}
                  className={`flex-1 rounded-lg py-1.5 px-2 text-center transition-all ${
                    selectedTw.key === tw.key
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tw.key}
                </button>
              ))}
            </div>
          </div>

          {/* Pilih Program */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Pilih Program</label>
            <SelectInput
              options={programsList}
              value={selectedProgram}
              onChange={setSelectedProgram}
              placeholder="Semua Program..."
              isClearable={false}
              compact
            />
          </div>

          {/* Pilih Trend */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Pilih Trend</label>
            <SelectInput
              options={TREND_OPTIONS}
              value={selectedTrend}
              onChange={setSelectedTrend}
              isClearable={false}
              compact
            />
          </div>

          {/* Pilih Kualifikasi Akhir */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Pilih Kualifikasi Akhir</label>
            <SelectInput
              options={KUALIFIKASI_AKHIR_OPTIONS}
              value={selectedKualifikasi}
              onChange={setSelectedKualifikasi}
              isClearable={false}
              compact
            />
          </div>

          {/* Pilih Tipe Asesor */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Pilih Tipe Asesor</label>
            <SelectInput
              options={TIPE_ASESOR_OPTIONS}
              value={selectedAsesor}
              onChange={setSelectedAsesor}
              isClearable={false}
              compact
            />
          </div>
        </div>

        {/* Sub-Filter Bulan (> Pilih Bulan) */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 text-xs">
          <span className="font-bold text-slate-500 whitespace-nowrap">&gt; Pilih Bulan ({selectedTw.label}):</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {selectedTw.months.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedBulan(m)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                  selectedBulan === m
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Memuat dasbor..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : (
        <>
          {/* ========================================================================= */}
          {/* BAGIAN UTAMA (Cuplikan triwulan & Eligibilitas rekomendasi - 7 Scorecards) */}
          {/* ========================================================================= */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-700 text-white text-[11px] font-bold">1</span>
                  Bagian Utama — Cuplikan Triwulan &amp; Eligibilitas Rekomendasi
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Memberikan cuplikan cepat terkait kondisi terakhir triwulan: jumlah aktif, capaian standar, dan eligibilitas rekomendasi.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full shrink-0">
                Periode: {selectedTw.label} {selectedBulan !== 'Semua Bulan' ? `• ${selectedBulan}` : ''}
              </span>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              {/* 1. WBP Aktif */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-colors">
                <span className="text-xs font-bold text-slate-500">{bu.wbp_aktif.title}</span>
                <div className="my-2">
                  <p className="text-2xl font-black text-slate-900">{formatNumber(bu.wbp_aktif.value)}</p>
                  <span className="text-[10px] text-slate-400 font-medium">{bu.wbp_aktif.unit}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 pt-2 border-t border-slate-100">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  <span>{bu.wbp_aktif.trend}</span>
                  <span className="text-[10px] font-normal text-slate-400 truncate">{bu.wbp_aktif.trend_label}</span>
                </div>
              </div>

              {/* 2. Program Aktif */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-colors">
                <span className="text-xs font-bold text-slate-500">{bu.program_aktif.title}</span>
                <div className="my-2">
                  <p className="text-2xl font-black text-slate-900">{formatNumber(bu.program_aktif.value)}</p>
                  <span className="text-[10px] text-slate-400 font-medium">{bu.program_aktif.unit}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 pt-2 border-t border-slate-100">
                  <Minus className="h-3.5 w-3.5 text-slate-400" />
                  <span>{bu.program_aktif.trend}</span>
                  <span className="text-[10px] font-normal text-slate-400 truncate">{bu.program_aktif.trend_label}</span>
                </div>
              </div>

              {/* 3. Walipas Aktif */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-colors">
                <span className="text-xs font-bold text-slate-500">{bu.walipas_aktif.title}</span>
                <div className="my-2">
                  <p className="text-2xl font-black text-slate-900">{formatNumber(bu.walipas_aktif.value)}</p>
                  <span className="text-[10px] text-slate-400 font-medium">{bu.walipas_aktif.unit}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 pt-2 border-t border-slate-100">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  <span>{bu.walipas_aktif.trend}</span>
                  <span className="text-[10px] font-normal text-slate-400 truncate">{bu.walipas_aktif.trend_label}</span>
                </div>
              </div>

              {/* 4. Mitra Aktif */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-colors">
                <span className="text-xs font-bold text-slate-500">{bu.mitra_aktif.title}</span>
                <div className="my-2">
                  <p className="text-2xl font-black text-slate-900">{formatNumber(bu.mitra_aktif.value)}</p>
                  <span className="text-[10px] text-slate-400 font-medium">{bu.mitra_aktif.unit}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 pt-2 border-t border-slate-100">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  <span>{bu.mitra_aktif.trend}</span>
                  <span className="text-[10px] font-normal text-slate-400 truncate">{bu.mitra_aktif.trend_label}</span>
                </div>
              </div>

              {/* 5. Rata-rata SPPN */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-xs flex flex-col justify-between hover:border-emerald-400 transition-colors">
                <span className="text-xs font-bold text-emerald-900">{bu.rata_sppn.title}</span>
                <div className="my-2 flex items-baseline gap-1">
                  <p className="text-2xl font-black text-emerald-800">{bu.rata_sppn.value}</p>
                  <span className="text-[11px] font-bold text-slate-400">{bu.rata_sppn.unit}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 pt-2 border-t border-emerald-200/60">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  <span>{bu.rata_sppn.trend}</span>
                  <span className="text-[10px] font-normal text-slate-500 truncate">{bu.rata_sppn.trend_label}</span>
                </div>
              </div>

              {/* 6. Rata-rata PPKS */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 shadow-xs flex flex-col justify-between hover:border-amber-400 transition-colors">
                <span className="text-xs font-bold text-amber-900">{bu.rata_ppks.title}</span>
                <div className="my-2 flex items-baseline gap-1">
                  <p className="text-2xl font-black text-amber-800">{Number(bu.rata_ppks.value).toFixed(2)}</p>
                  <span className="text-[11px] font-bold text-slate-400">{bu.rata_ppks.unit}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700 pt-2 border-t border-amber-200/60">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  <span>{bu.rata_ppks.trend}</span>
                  <span className="text-[10px] font-normal text-slate-500 truncate">{bu.rata_ppks.trend_label}</span>
                </div>
              </div>

              {/* 7. Total Direkomendasikan */}
              <div className="rounded-2xl border border-emerald-300 bg-emerald-600 text-white p-4 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-bold text-emerald-100">{bu.total_direkomendasikan.title}</span>
                <div className="my-2">
                  <p className="text-2xl font-black">{formatNumber(bu.total_direkomendasikan.value)}</p>
                  <span className="text-[10px] text-emerald-200 font-medium">Kualifikasi 2 (Memenuhi)</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-100 pt-2 border-t border-emerald-500">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  <span>{bu.total_direkomendasikan.trend}</span>
                  <span className="text-[10px] font-normal text-emerald-200 truncate">{bu.total_direkomendasikan.trend_label}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BAGIAN SEKUNDER (Alignmen & Diagnosa Program Secara Holistik) */}
          {/* ========================================================================= */}
          <div className="space-y-3 pt-2">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-teal-700 text-white text-[11px] font-bold">2</span>
                Bagian Sekunder — Alignmen &amp; Diagnosa Program Secara Holistik
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Menampilkan informasi lebih luas untuk mencari korelasi, pemetaan sebaran, dan tren perbandingan pelaksanaan.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-12">
              {/* 1. Sebaran Pelaksanaan (Donut) */}
              <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs lg:col-span-3 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Sebaran Pelaksanaan</h3>
                  <p className="text-[11px] text-slate-400">% Count Pelaksanaan = 1 vs 0</p>
                  <div className="h-44 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={bs.sebaran_pelaksanaan}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={42}
                          outerRadius={68}
                          paddingAngle={3}
                        >
                          {bs.sebaran_pelaksanaan.map((entry, index) => (
                            <Cell key={`cell-pel-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
                  {bs.sebaran_pelaksanaan.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-600 truncate">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="truncate">{item.name}</span>
                      </span>
                      <strong className="text-slate-900 shrink-0">{item.pct}%</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Sebaran Predikat (Donut) */}
              <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs lg:col-span-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Sebaran Predikat Akhir</h3>
                  <p className="text-[11px] text-slate-400">% Count Direkomendasikan, Dg Pertimbangan, Tidak Memenuhi</p>
                  <div className="h-44 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={bs.sebaran_predikat}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={42}
                          outerRadius={68}
                          paddingAngle={3}
                        >
                          {bs.sebaran_predikat.map((entry, index) => (
                            <Cell key={`cell-pred-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
                  {bs.sebaran_predikat.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-600 truncate">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="truncate">{item.name}</span>
                      </span>
                      <strong className="text-slate-900 shrink-0">{item.pct}% ({item.count})</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Pelaksanaan (Line Chart Komparasi TW Berjalan vs TW Sebelumnya) */}
              <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs lg:col-span-5 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Pelaksanaan / Hari</h3>
                    <p className="text-[11px] text-slate-400">Avg Pelaksanaan triwulan berjalan vs triwulan sebelumnya</p>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Tren +4.2% Positif
                  </span>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={bs.pelaksanaan_line}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="hari" tick={{ fontSize: 10, fontWeight: 600 }} />
                      <YAxis domain={[80, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line
                        type="monotone"
                        dataKey="tw_berjalan"
                        name="TW Berjalan (%)"
                        stroke="#059669"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="tw_sebelumnya"
                        name="TW Sebelumnya (%)"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={{ r: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BAGIAN TAMBAHAN (Analisis lebih dalam dan memahami hasil secara granular) */}
          {/* ========================================================================= */}
          <div className="space-y-4 pt-2">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-sky-700 text-white text-[11px] font-bold">3</span>
                Bagian Tambahan — Analisis Granular &amp; Diagnosa Mitigasi
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Menjelaskan korelasi aktivitas kuantitatif (SPPN) dan kualitatif (PPKS), tantangan bobot, hambatan pareto, serta pergerakan tren WBP.
              </p>
            </div>

            {/* Row 1: Komparasi Scatter Plot & Tantangan Bar Chart */}
            <div className="grid gap-4 lg:grid-cols-12">
              {/* 1. Komparasi Scatter Plot (SPPN Threshold 70 vs PPKS Threshold 4.00) */}
              <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs lg:col-span-7">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Komparasi Kuadran SPPN vs PPKS</h3>
                    <p className="text-[11px] text-slate-400">
                      Garis Batas: Ambang Batas SPPN = 70 • Standar Mutu PPKS = 4.00
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold">
                    <span className="flex items-center gap-1 text-emerald-700">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" /> Kual 2 (Memenuhi)
                    </span>
                    <span className="flex items-center gap-1 text-amber-700">
                      <span className="h-2 w-2 rounded-full bg-amber-500" /> Kual 1 (Pertimbangan)
                    </span>
                    <span className="flex items-center gap-1 text-rose-700">
                      <span className="h-2 w-2 rounded-full bg-rose-500" /> Kual 0 (Belum)
                    </span>
                  </div>
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        type="number"
                        dataKey="sppn"
                        name="Nilai SPPN"
                        domain={[50, 100]}
                        unit=""
                        tick={{ fontSize: 10 }}
                        label={{ value: 'Nilai SPPN (0 - 100)', position: 'insideBottom', offset: -10, fontSize: 11, fontWeight: 600 }}
                      />
                      <YAxis
                        type="number"
                        dataKey="ppks"
                        name="Nilai PPKS"
                        domain={[2.5, 5.0]}
                        unit=""
                        tick={{ fontSize: 10 }}
                        label={{ value: 'Nilai PPKS (1 - 5)', angle: -90, position: 'insideLeft', fontSize: 11, fontWeight: 600 }}
                      />
                      <ZAxis range={[60, 60]} />
                      <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const p = payload[0].payload;
                            return (
                              <div className="rounded-xl bg-slate-900 text-white p-2.5 text-xs shadow-lg space-y-1">
                                <p className="font-bold">{p.nama}</p>
                                <p className="text-emerald-300">SPPN: {p.sppn}</p>
                                <p className="text-amber-300">PPKS: {p.ppks}</p>
                                <p className="text-[10px] text-slate-300">{p.predikat}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <ReferenceLine x={70} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Batas SPPN 70', fontSize: 10, fill: '#ef4444' }} />
                      <ReferenceLine y={4.0} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Batas PPKS 4.0', fontSize: 10, fill: '#f59e0b' }} />
                      <Scatter data={bt.komparasi_scatter}>
                        {bt.komparasi_scatter.map((entry, index) => (
                          <Cell key={`cell-scatter-${index}`} fill={entry.color} />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 2. Tantangan (Bar Chart: Bobot vs Pelaksanaan & Target) */}
              <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs lg:col-span-5">
                <div className="mb-3">
                  <h3 className="text-sm font-bold text-slate-900">Tantangan Program</h3>
                  <p className="text-[11px] text-slate-400">Komparasi Bobot, Pelaksanaan Sesi, dan Target Kolektif</p>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bt.tantangan_program}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="nama_program" tick={{ fontSize: 9.5, fontWeight: 600 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="pelaksanaan" name="Sesi Terlaksana" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="target" name="Target Sesi" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="bobot" name="Bobot (%)" fill="#0284c7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Row 2: Hambatan Pareto Chart & Aktivitas Walipas vs Mitra */}
            <div className="grid gap-4 lg:grid-cols-12">
              {/* 3. Hambatan (Pareto Chart: Alasan tidak hadir WBP) */}
              <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs lg:col-span-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Hambatan Ketidakhadiran (Pareto)</h3>
                    <p className="text-[11px] text-slate-400">Distribusi alasan ketidakhadiran &amp; kurva kumulatif (%)</p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Pareto 80/20</span>
                </div>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={bt.hambatan_pareto}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="alasan" tick={{ fontSize: 9 }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 10 }} label={{ value: 'Kasus', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar yAxisId="left" dataKey="count" name="Jumlah Kasus" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="kumulatif" name="Kumulatif %" stroke="#0f172a" strokeWidth={2} dot={{ r: 3 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 4. Aktivitas Walipas vs Mitra (Line Chart) */}
              <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs lg:col-span-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Aktivitas Input Walipas vs Mitra</h3>
                    <p className="text-[11px] text-slate-400">Volume pencatatan sesi pembinaan berkala per minggu</p>
                  </div>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
                    Kolaborasi Aktif
                  </span>
                </div>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={bt.aktivitas_walipas_mitra}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="periode" tick={{ fontSize: 10, fontWeight: 600 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="walipas" name="Aktivitas Wali PAS" stroke="#059669" strokeWidth={2.5} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="mitra" name="Aktivitas Mitra" stroke="#9333ea" strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Row 3: Tabel Ranking Predikat & Tabel Tren */}
            <div className="grid gap-4 lg:grid-cols-12">
              {/* 5. Tabel Ranking Predikat (Descending) */}
              <div className="rounded-3xl border border-slate-200/90 bg-white shadow-xs overflow-hidden lg:col-span-6 flex flex-col justify-between">
                <div>
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Tabel Ranking Predikat WBP</h3>
                      <p className="text-[11px] text-slate-400">Urutan skor tertinggi ke terendah (Descending)</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                      Top Performers
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                        <tr>
                          <th className="px-3.5 py-2.5">Warga Binaan</th>
                          <th className="px-3.5 py-2.5 text-center">SPPN</th>
                          <th className="px-3.5 py-2.5 text-center">PPKS</th>
                          <th className="px-3.5 py-2.5 text-center">Predikat Kelayakan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bt.tabel_ranking_predikat.slice(0, 7).map((w, idx) => (
                          <tr key={w.id} className="hover:bg-slate-50/70">
                            <td className="px-3.5 py-2.5">
                              <p className="font-bold text-slate-900">{w.nama}</p>
                              <span className="text-[10px] text-slate-400">Peringkat #{idx + 1}</span>
                            </td>
                            <td className="px-3.5 py-2.5 text-center font-black text-emerald-800">
                              {w.sppn}
                            </td>
                            <td className="px-3.5 py-2.5 text-center font-black text-amber-800">
                              {Number(w.ppks).toFixed(2)}
                            </td>
                            <td className="px-3.5 py-2.5 text-center">
                              <span
                                className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  w.kualifikasi === 2
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : w.kualifikasi === 1
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {w.kualifikasi === 2 ? 'Direkomendasikan' : w.kualifikasi === 1 ? 'Pertimbangan' : 'Tidak Memenuhi'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border-t border-slate-100 text-right">
                  <Link to="/app/dasbor-wbp" className="text-xs font-bold text-emerald-700 hover:underline">
                    Buka Dasbor WBP Lengkap →
                  </Link>
                </div>
              </div>

              {/* 6. Tabel Tren (Ascending - Memprioritaskan yang mengalami penurunan) */}
              <div className="rounded-3xl border border-slate-200/90 bg-white shadow-xs overflow-hidden lg:col-span-6 flex flex-col justify-between">
                <div>
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Tabel Tren WBP (Deteksi Penurunan)</h3>
                      <p className="text-[11px] text-slate-400">Urutan tren terkecil &gt; terbesar (Ascending untuk mitigasi cepat)</p>
                    </div>
                    <span className="text-xs font-bold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                      Evaluasi Pembinaan
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                        <tr>
                          <th className="px-3.5 py-2.5">Warga Binaan</th>
                          <th className="px-3.5 py-2.5 text-center">SPPN (Ini v Lalu)</th>
                          <th className="px-3.5 py-2.5 text-center">Tren SPPN</th>
                          <th className="px-3.5 py-2.5 text-center">Status Tren</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bt.tabel_tren.slice(0, 7).map((w) => (
                          <tr key={w.id} className="hover:bg-slate-50/70">
                            <td className="px-3.5 py-2.5">
                              <p className="font-bold text-slate-900">{w.nama}</p>
                              <span className="text-[10px] text-slate-400">PPKS: {w.ppks_ini} (Tren {w.ppks_trend_pct}%)</span>
                            </td>
                            <td className="px-3.5 py-2.5 text-center font-semibold text-slate-700">
                              {w.sppn_ini} <span className="text-slate-400">vs</span> {w.sppn_lalu}
                            </td>
                            <td className="px-3.5 py-2.5 text-center">
                              <span
                                className={`inline-flex items-center gap-0.5 font-bold ${
                                  w.sppn_trend_pct < 0 ? 'text-rose-600' : w.sppn_trend_pct > 0 ? 'text-emerald-600' : 'text-slate-600'
                                }`}
                              >
                                {w.sppn_trend_pct < 0 ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                                {w.sppn_trend_pct}%
                              </span>
                            </td>
                            <td className="px-3.5 py-2.5 text-center">
                              <span
                                className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  w.status_tren === 'Menurun'
                                    ? 'bg-rose-100 text-rose-800'
                                    : w.status_tren === 'Meningkat'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {w.status_tren}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border-t border-slate-100 text-right">
                  <span className="text-[11px] text-slate-500 font-medium">
                    *Gunakan data tren menurun untuk penjadwalan bimbingan konseling rohani intensif.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
