import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Award,
  BookOpen,
  CalendarRange,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileDown,
  Info,
  PlusCircle,
  ScanFace,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { request, extractErrorMessage } from '@/utils/request';
import { API_ENDPOINTS } from '@/utils/endpoints';
import { getAssetUrl } from '@/utils/api';
import { DateRangeFilter } from '@/components/common/DateRangeFilter';
import { AsyncSelectInput } from '@/components/common/AsyncSelectInput';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  formatDate,
  formatNumber,
  INSTRUMEN_INFO,
  PERIOD_LABELS,
  ROLE_LABELS,
  toIsoDate,
} from '@/utils/formatters';
import { exportAssessmentsPdf } from '@/utils/pdfGenerator';

const PERIOD_TABS = [
  { key: 'harian', label: 'Harian' },
  { key: 'mingguan', label: 'Mingguan' },
  { key: 'bulanan', label: 'Bulanan' },
  { key: 'triwulan', label: 'Per 3 Bulan' },
];

const PROGRAM_GRADIENTS = [
  'from-emerald-600 to-teal-500',
  'from-blue-600 to-cyan-500',
  'from-amber-500 to-orange-500',
  'from-violet-600 to-purple-500',
  'from-rose-600 to-pink-500',
  'from-indigo-600 to-sky-500',
];

export function DashboardUmumPage() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [period, setPeriod] = useState('bulanan');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const loadProgramOptions = useCallback(async (search) => {
    const res = await request.get(API_ENDPOINTS.PROGRAMS.LIST, { search, limit: 25, status: 'aktif' });
    return (res.data || []).map((p) => ({
      value: p.id,
      label: `${p.nama_program} (Bobot ${p.bobot}%)`,
    }));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await request.get(API_ENDPOINTS.DASHBOARD.UMUM, {
        startDate: toIsoDate(dateRange.startDate),
        endDate: toIsoDate(dateRange.endDate),
        program_id: selectedProgram?.value,
        period,
      });
      setData(res.data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Gagal memuat Dasbor Umum'));
    } finally {
      setLoading(false);
    }
  }, [dateRange, selectedProgram, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const res = await request.get(API_ENDPOINTS.REPORTS.EXPORT_DATA, {
        type: 'assessments',
        startDate: toIsoDate(dateRange.startDate),
        endDate: toIsoDate(dateRange.endDate),
        program_id: selectedProgram?.value,
      });
      await exportAssessmentsPdf(res.data || [], {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      toast.success('Laporan PDF Dasbor Umum berhasil diunduh');
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Gagal mengunduh PDF'));
    } finally {
      setExporting(false);
    }
  };

  const kpi = data?.kpi || {};
  const rekDist = data?.rekomendasi_distribution || [];
  const totalRekWbp = rekDist.reduce((s, r) => s + Number(r.value || 0), 0);

  return (
    <div className="space-y-6">
      {/* Vibrant Multi-Color Executive Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-700 via-teal-600 via-55% to-sky-700 p-6 sm:p-7 text-white shadow-xl shadow-emerald-900/15">
        <div className="pointer-events-none absolute -right-10 -top-10 h-60 w-60 rounded-full bg-amber-300/25 blur-3xl" />
        <div className="pointer-events-none absolute left-1/3 -bottom-16 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />

        <div className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <img
                src="/logo-kementerian.png"
                alt="Logo Kementerian"
                className="h-14 w-14 rounded-2xl bg-white p-1.5 shadow-lg object-contain"
              />
              <img
                src="/logo-sipasti.png"
                alt="Logo SIPASTI"
                className="h-14 w-14 rounded-2xl bg-white p-1.5 shadow-lg object-contain"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/25 border border-amber-300/50 px-3 py-1 text-[11px] font-extrabold text-amber-100 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                {ROLE_LABELS[user?.role] || user?.role} • {formatDate(new Date(), 'EEEE, dd MMMM yyyy')}
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow-xs">
                Selamat Datang, {user?.nama}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-white/90 max-w-2xl">
                Dasbor Eksekutif <strong>SI PASTI Lapas Kelas IIB Ciamis</strong> — Monitoring
                terpisah <strong>SPPN</strong> (Nilai Utama) & <strong>PPKS</strong> (Pendukung
                Monitoring), Absensi Face ID, serta Rekap Harian, Mingguan, Bulanan & Triwulan.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {['admin', 'wali_pas', 'mitra'].includes(user?.role) && (
              <Link
                to="/app/penilaian"
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 px-4 py-2.5 text-xs sm:text-sm font-extrabold text-slate-950 shadow-lg hover:from-amber-300 hover:to-yellow-300 transition-all"
              >
                <PlusCircle className="h-4 w-4" />
                Input SPPN / PPKS
              </Link>
            )}
            <Link
              to="/app/rekap-penilaian"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 border border-white/30 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-white/30 backdrop-blur-sm transition-all"
            >
              <CalendarRange className="h-4 w-4" />
              Rekap Periodik
            </Link>
            <Link
              to="/app/panduan"
              className="inline-flex items-center gap-1.5 rounded-xl bg-violet-500/80 border border-violet-300/40 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-violet-500 transition-all"
            >
              <BookOpen className="h-4 w-4" />
              Buku Panduan
            </Link>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={exporting || loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500 px-4 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow-md hover:bg-rose-400 disabled:opacity-50 transition-all"
            >
              <FileDown className="h-4 w-4" />
              {exporting ? 'Menyiapkan...' : 'Unduh PDF'}
            </button>
          </div>
        </div>
      </div>

      {/* Vibrant Full-Color Penjabaran SPPN vs PPKS Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 p-4 text-white shadow-md shadow-emerald-600/20">
          <ShieldCheck className="pointer-events-none absolute -right-4 -bottom-4 h-24 w-24 text-white/15" />
          <div className="relative flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 font-black text-xs shadow-sm">
              SPPN
            </div>
            <div>
              <p className="text-sm font-extrabold flex flex-wrap items-center gap-2">
                {INSTRUMEN_INFO.SPPN.kepanjangan}
                <span className="rounded-full bg-white/25 px-2.5 py-0.5 text-[10px] font-bold">
                  NILAI UTAMA (≥ 70)
                </span>
              </p>
              <p className="text-xs text-emerald-50 mt-1 leading-relaxed">
                {INSTRUMEN_INFO.SPPN.deskripsi}
              </p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white shadow-md shadow-amber-500/20">
          <Award className="pointer-events-none absolute -right-4 -bottom-4 h-24 w-24 text-white/15" />
          <div className="relative flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 font-black text-xs shadow-sm">
              PPKS
            </div>
            <div>
              <p className="text-sm font-extrabold flex flex-wrap items-center gap-2">
                {INSTRUMEN_INFO.PPKS.kepanjangan}
                <span className="rounded-full bg-white/25 px-2.5 py-0.5 text-[10px] font-bold">
                  PENDUKUNG MONITORING
                </span>
              </p>
              <p className="text-xs text-amber-50 mt-1 leading-relaxed">
                {INSTRUMEN_INFO.PPKS.deskripsi}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Periodic Switcher */}
      <div className="rounded-2xl border-2 border-emerald-100 bg-white p-4 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <DateRangeFilter
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onChange={setDateRange}
          showPresets
        />
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="w-full sm:w-60">
            <AsyncSelectInput
              loadOptionsFn={loadProgramOptions}
              value={selectedProgram}
              onChange={setSelectedProgram}
              placeholder="Filter Program Spiritual..."
            />
          </div>
          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            {PERIOD_TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setPeriod(t.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-extrabold transition-all ${
                  period === t.key
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Mengolah analitik terpisah SPPN & PPKS..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : (
        <>
          {/* Full-Color Vibrant Gradient KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {[
              {
                label: 'Rata Skor SPPN (Utama)',
                value: `${kpi.rata_sppn || 0}`,
                sub: `${kpi.total_sppn || 0} sesi • Karakter ${kpi.karakter_sppn || '-'}/5`,
                icon: ShieldCheck,
                gradient: 'from-emerald-600 via-emerald-500 to-teal-500',
                shadow: 'shadow-emerald-500/25',
                pct: Math.min(100, Number(kpi.rata_sppn || 0)),
              },
              {
                label: 'Rata Skor PPKS (Monitor)',
                value: `${kpi.rata_ppks || 0}`,
                sub: `${kpi.total_ppks || 0} sesi • Karakter ${kpi.karakter_ppks || '-'}/5`,
                icon: Award,
                gradient: 'from-amber-500 via-orange-500 to-yellow-500',
                shadow: 'shadow-amber-500/25',
                pct: Math.min(100, Number(kpi.rata_ppks || 0)),
              },
              {
                label: 'Warga Binaan Aktif',
                value: formatNumber(kpi.wbp_aktif),
                sub: `${kpi.wbp_enrolled_face || 0} terdaftar Face ID`,
                icon: Users,
                gradient: 'from-blue-600 via-sky-500 to-cyan-500',
                shadow: 'shadow-sky-500/25',
                pct: kpi.wbp_aktif ? Math.round(((kpi.wbp_enrolled_face || 0) / kpi.wbp_aktif) * 100) : 0,
              },
              {
                label: 'Tingkat Pelaksanaan',
                value: `${kpi.tingkat_pelaksanaan || 0}%`,
                sub: `${kpi.total_ya || 0} Ya • ${kpi.total_tidak || 0} Tidak`,
                icon: CheckCircle2,
                gradient: 'from-teal-600 via-cyan-600 to-sky-500',
                shadow: 'shadow-cyan-500/25',
                pct: Math.min(100, Number(kpi.tingkat_pelaksanaan || 0)),
              },
              {
                label: 'Absensi Face ID',
                value: formatNumber(kpi.total_absensi),
                sub: `${kpi.face_verified_count || 0} terverifikasi wajah`,
                icon: ScanFace,
                gradient: 'from-violet-600 via-purple-600 to-indigo-500',
                shadow: 'shadow-violet-500/25',
                pct: kpi.total_absensi
                  ? Math.round(((kpi.face_verified_count || 0) / kpi.total_absensi) * 100)
                  : 0,
              },
              {
                label: 'Menunggu Kasubsi',
                value: formatNumber(kpi.menunggu_verifikasi),
                sub: 'Respon perlu verifikasi',
                icon: Clock,
                gradient: 'from-rose-600 via-pink-600 to-red-500',
                shadow: 'shadow-rose-500/25',
                pct: kpi.total_penilaian
                  ? Math.round(((kpi.menunggu_verifikasi || 0) / kpi.total_penilaian) * 100)
                  : 0,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${item.gradient} p-4 text-white shadow-lg ${item.shadow} hover:-translate-y-1 transition-all duration-200`}
                >
                  <Icon className="pointer-events-none absolute -right-3 -bottom-3 h-20 w-20 text-white/15" />
                  <div className="relative flex items-center justify-between gap-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wide text-white/90 leading-tight">
                      {item.label}
                    </span>
                    <div className="rounded-xl bg-white/20 p-2 backdrop-blur-xs shrink-0">
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <p className="relative mt-3 text-3xl font-black tracking-tight drop-shadow-xs">
                    {item.value}
                  </p>
                  <p className="relative mt-1 text-[11px] font-semibold text-white/85 truncate">
                    {item.sub}
                  </p>
                  <div className="relative mt-3 h-1.5 w-full rounded-full bg-black/20 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-white/90 transition-all duration-500"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts Row with Colorful Gradient Headers */}
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8 rounded-2xl border border-slate-200/80 bg-white shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 via-sky-600 to-teal-500 px-5 py-3.5 text-white flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-amber-300" />
                    Tren Penilaian {PERIOD_LABELS[period]} — SPPN (Utama) vs PPKS (Pendukung)
                  </h3>
                  <p className="text-[11px] text-sky-100">
                    Jumlah sesi & rata-rata skor terpisah berdasarkan periode
                  </p>
                </div>
                <Link
                  to="/app/rekap-penilaian"
                  className="rounded-lg bg-white/20 px-3 py-1 text-xs font-bold text-white hover:bg-white/30"
                >
                  Rekap Lengkap →
                </Link>
              </div>
              <div className="p-5 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data?.period_trend || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="period_label" tick={{ fontSize: 11, fontWeight: 600 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="sppn" name="Sesi SPPN (Utama)" fill="#10b981" radius={[6, 6, 0, 0]} />
                    <Bar yAxisId="left" dataKey="ppks" name="Sesi PPKS (Pendukung)" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="rata_sppn" name="Skor SPPN" stroke="#0284c7" strokeWidth={3} dot={{ r: 5 }} />
                    <Line yAxisId="right" type="monotone" dataKey="rata_ppks" name="Skor PPKS" stroke="#ea580c" strokeWidth={3} strokeDasharray="5 4" dot={{ r: 5 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recommendation Decision Distribution Donut */}
            <div className="lg:col-span-4 rounded-2xl border border-slate-200/80 bg-white shadow-md overflow-hidden flex flex-col">
              <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-5 py-3.5 text-white">
                <h3 className="text-sm sm:text-base font-extrabold">
                  Sebaran Keputusan Rekomendasi
                </h3>
                <p className="text-[11px] text-purple-100">
                  Hasil evaluasi terpisah SPPN & PPKS seluruh WBP aktif
                </p>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={rekDist}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={46}
                        outerRadius={76}
                        paddingAngle={4}
                      >
                        {rekDist.map((entry) => (
                          <Cell key={entry.key} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 mt-2">
                  {rekDist.map((item) => {
                    const pct = totalRekWbp ? Math.round((item.value / totalRekWbp) * 100) : 0;
                    const bgRow =
                      item.key === 'direkomendasikan'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : item.key === 'direkomendasikan_dengan_catatan'
                        ? 'bg-amber-50 border-amber-200 text-amber-950'
                        : 'bg-rose-50 border-rose-200 text-rose-950';
                    return (
                      <div
                        key={item.key}
                        className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs ${bgRow}`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3.5 w-3.5 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-bold">{item.name}</span>
                        </div>
                        <span className="font-black">
                          {item.value} WBP <span className="font-semibold opacity-75">({pct}%)</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Colorful Program Progress Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(data?.program_breakdown || []).map((prog, idx) => {
              const rasio = prog.total_log ? Math.round((prog.jumlah_ya / prog.total_log) * 100) : 0;
              const grad = PROGRAM_GRADIENTS[idx % PROGRAM_GRADIENTS.length];
              return (
                <div
                  key={prog.id}
                  className="rounded-2xl border border-slate-200/80 bg-white shadow-md overflow-hidden hover:-translate-y-0.5 transition-all"
                >
                  <div className={`bg-gradient-to-r ${grad} px-4 py-3 text-white flex items-center justify-between`}>
                    <span className="rounded-lg bg-white/20 px-2 py-0.5 text-[11px] font-extrabold">
                      Bobot {prog.bobot}%
                    </span>
                    <span className="text-[11px] font-bold">
                      {prog.jumlah_ya || 0}/{prog.total_log || 0} Ya ({rasio}%)
                    </span>
                  </div>
                  <div className="p-4">
                    <h4 className="text-sm font-extrabold text-slate-900">{prog.nama_program}</h4>
                    <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${grad}`}
                        style={{ width: `${rasio}%` }}
                      />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-2.5 py-1.5">
                        <span className="block text-[10px] font-extrabold text-emerald-700">SPPN Utama</span>
                        <strong className="text-sm text-emerald-900">{prog.rata_sppn || '-'}</strong>
                      </div>
                      <div className="rounded-xl bg-amber-50 border border-amber-200 px-2.5 py-1.5">
                        <span className="block text-[10px] font-extrabold text-amber-700">PPKS Monitor</span>
                        <strong className="text-sm text-amber-900">{prog.rata_ppks || '-'}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Row: Top WBP Leaderboard + Recent Activities with Colorful Headers */}
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7 rounded-2xl border border-slate-200/80 bg-white shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-3.5 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold">
                    Peringkat Evaluasi WBP (SPPN & PPKS Terpisah)
                  </h3>
                  <p className="text-[11px] text-emerald-100">
                    Berdasarkan Nilai Utama SPPN & pendukung monitoring PPKS
                  </p>
                </div>
                <Link
                  to="/app/dasbor-wbp"
                  className="rounded-lg bg-white/20 px-3 py-1 text-xs font-bold text-white hover:bg-white/30"
                >
                  Semua WBP →
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-emerald-50/70 text-xs font-extrabold uppercase text-emerald-900">
                    <tr>
                      <th className="px-4 py-3">Warga Binaan</th>
                      <th className="px-4 py-3 text-center">SPPN (Utama)</th>
                      <th className="px-4 py-3 text-center">PPKS (Monitor)</th>
                      <th className="px-4 py-3 text-right">Rekomendasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(data?.top_wbp || []).map((w, idx) => (
                      <tr key={w.id} className="hover:bg-emerald-50/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black shrink-0 shadow-xs ${
                                idx === 0
                                  ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950'
                                  : idx === 1
                                  ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-900'
                                  : idx === 2
                                  ? 'bg-gradient-to-br from-orange-400 to-amber-600 text-white'
                                  : 'bg-sky-100 text-sky-800'
                              }`}
                            >
                              {idx + 1}
                            </span>
                            {w.foto_wajah ? (
                              <img
                                src={getAssetUrl(w.foto_wajah)}
                                alt={w.nama}
                                className="h-9 w-9 rounded-xl object-cover border-2 border-emerald-200 shrink-0"
                              />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-extrabold text-xs shrink-0">
                                {w.nama.charAt(0)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">{w.nama}</p>
                              <p className="text-[11px] text-slate-500">{w.no_registrasi} • {w.wali_pas_nama || '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block rounded-lg bg-emerald-100 border border-emerald-300 px-2.5 py-1 text-xs font-black text-emerald-800">
                            {w.sppn_skor}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block rounded-lg bg-amber-100 border border-amber-300 px-2.5 py-1 text-xs font-black text-amber-800">
                            {w.ppks_skor}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <StatusBadge
                            label={w.rekomendasi?.shortLabel || '-'}
                            variant={w.rekomendasi?.color || 'slate'}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-2xl border border-slate-200/80 bg-white shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3.5 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold">Aktivitas Penilaian Terbaru</h3>
                  <p className="text-[11px] text-amber-100">Input SPPN & PPKS terkini dari Wali PAS & Mitra</p>
                </div>
                <ClipboardCheck className="h-5 w-5 text-white" />
              </div>
              <div className="divide-y divide-slate-100">
                {(data?.recent_activities || []).map((act) => (
                  <div key={act.id} className="px-5 py-3 flex items-start justify-between gap-3 hover:bg-amber-50/30 transition-colors">
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{act.wbp_nama}</p>
                      <p className="text-xs text-slate-600">
                        {act.nama_program} • <span className="text-slate-400">{act.asesor_nama}</span>
                      </p>
                      {act.keterangan && (
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{act.keterangan}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <StatusBadge
                        label={act.jenis_penilaian === 'SPPN' ? 'SPPN Utama' : 'PPKS Monitor'}
                        variant={act.jenis_penilaian === 'SPPN' ? 'emerald' : 'amber'}
                      />
                      <p className="text-[10px] font-semibold text-slate-500">
                        {formatDate(act.tanggal)} • Skor {act.skor_akhir}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-sky-200 bg-gradient-to-r from-sky-50 via-emerald-50 to-amber-50 px-4 py-3 flex items-center gap-2.5 text-xs text-slate-700">
            <Info className="h-4 w-4 text-sky-600 shrink-0" />
            <span>
              <strong>Catatan Metodologi:</strong> Nilai <strong>SPPN</strong> dan{' '}
              <strong>PPKS</strong> <strong>tidak digabung</strong>. Keputusan{' '}
              <span className="font-bold text-emerald-700">Direkomendasikan</span>,{' '}
              <span className="font-bold text-amber-700">Direkomendasikan dengan Catatan</span>, atau{' '}
              <span className="font-bold text-rose-700">Tidak Direkomendasikan</span> ditentukan
              dari kelulusan SPPN (utama ≥ 70) dan status monitoring PPKS (pendukung ≥ 70).
            </span>
          </div>
        </>
      )}
    </div>
  );
}
