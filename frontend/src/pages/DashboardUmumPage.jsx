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
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileDown,
  Layers,
  PieChart as PieChartIcon,
  PlusCircle,
  ScanFace,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { request, extractErrorMessage } from '@/utils/request';
import { API_ENDPOINTS } from '@/utils/endpoints';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SectionCard } from '@/components/dashboard/SectionCard';
import {
  formatDate,
  formatNumber,
  ROLE_LABELS,
  TRIWULAN_OPTIONS,
} from '@/utils/formatters';
import { exportAssessmentsPdf } from '@/utils/pdfGenerator';

export function DashboardUmumPage() {
  const { user } = useAuth();
  const [selectedTw, setSelectedTw] = useState('tw4');
  const [selectedCompTw, setSelectedCompTw] = useState('tw3');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await request.get(API_ENDPOINTS.DASHBOARD.UMUM, {
        triwulan: selectedTw,
      });
      setData(res.data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Gagal memuat Dasbor Umum'));
    } finally {
      setLoading(false);
    }
  }, [selectedTw]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const res = await request.get(API_ENDPOINTS.REPORTS.EXPORT_DATA, {
        type: 'assessments',
        triwulan: selectedTw,
      });
      await exportAssessmentsPdf(res.data || [], {
        triwulan: selectedTw,
      });
      toast.success('Laporan PDF berhasil diunduh');
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Gagal mengunduh PDF'));
    } finally {
      setExporting(false);
    }
  };

  const s0 = data?.section0_system || {};
  const s1 = data?.section1_program || {};
  const s2List = data?.section2_comparison || [
    { id: 'tw3', label: 'Triwulan III', wbp_aktif: 118, pelaksanaan: 90.0, sppn: 78.2, ppks: 4.15, status: 'Selesai' },
    { id: 'tw2', label: 'Triwulan II', wbp_aktif: 115, pelaksanaan: 88.5, sppn: 76.8, ppks: 4.02, status: 'Selesai' },
    { id: 'tw1', label: 'Triwulan I', wbp_aktif: 110, pelaksanaan: 85.0, sppn: 74.5, ppks: 3.95, status: 'Selesai' },
  ];
  const compData = s2List.find((t) => t.id === selectedCompTw) || s2List[0];

  const rekDist = s1?.rekomendasi_distribution || [
    { name: 'Kualifikasi 2 (Direkomendasikan)', value: 85, color: '#10b981' },
    { name: 'Kualifikasi 1 (Dengan Pertimbangan)', value: 25, color: '#f59e0b' },
    { name: 'Kualifikasi 0 (Tidak Memenuhi Syarat)', value: 10, color: '#ef4444' },
  ];
  const totalRekWbp = rekDist.reduce((s, r) => s + Number(r.value || 0), 0);

  return (
    <div className="space-y-6">
      {/* [REV0012] Header Banner: Eksposur Luas Logo Kemenimpas & SIPASTI, Bebas Subtitle Bertele-tele */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-850 via-teal-850 to-slate-900 px-6 py-6 sm:px-8 sm:py-7 text-white shadow-xl shadow-emerald-950/20 border border-emerald-700/30">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Logo & Headline */}
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

          {/* Action Buttons */}
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

      {/* [REV0015 & REV0016] Triwulan Selector Bar (Hapus tab Harian/Mingguan/Bulanan) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Calendar className="h-4 w-4 text-emerald-700" />
          <span>Periode Evaluasi Akumulatif:</span>
        </div>

        <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
          {TRIWULAN_OPTIONS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTw(t.id)}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                selectedTw === t.id
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Memuat dasbor..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : (
        <>
          {/* ======================================================== */}
          {/* [REV0018] SECTION 0: STATUS SISTEM & OPERASIONAL */}
          {/* ======================================================== */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-800 text-xs font-black text-white">
                0
              </span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                Status Sistem & Operasional Lapas
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {/* S0-1: WBP Aktif */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Warga Binaan Aktif</span>
                  <div className="rounded-xl p-2 bg-sky-50 text-sky-700">
                    <Users className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-2 text-2xl font-black text-slate-900">
                  {formatNumber(s0.wbp_aktif ?? 120)}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Total terdaftar: {formatNumber(s0.total_wbp ?? 120)} WBP
                </p>
              </div>

              {/* S0-2: Absensi Biometrik Face ID */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Absensi Face ID</span>
                  <div className="rounded-xl p-2 bg-emerald-50 text-emerald-700">
                    <ScanFace className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-2 text-2xl font-black text-slate-900">
                  {formatNumber(s0.total_absensi ?? 450)}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {s0.face_verified_count ?? 420} terverifikasi wajah ({s0.wbp_enrolled_face ?? 115} terdaftar)
                </p>
              </div>

              {/* S0-3: Menunggu Verifikasi Kasubsi */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Menunggu Verifikasi</span>
                  <div className="rounded-xl p-2 bg-rose-50 text-rose-700">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-2 text-2xl font-black text-slate-900">
                  {formatNumber(s0.menunggu_verifikasi ?? 3)}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Antrean verifikasi Kasubsi Registrasi & Bimkemas
                </p>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* [REV0018] SECTION 1: KONTEKS PROGRAM TRIWULAN BERJALAN */}
          {/* ======================================================== */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-700 text-xs font-black text-white">
                  1
                </span>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Capaian Program {s1.triwulan || 'Triwulan IV (Berjalan)'}
                  </h2>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-bold text-emerald-700">
                <TrendingUp className="h-3.5 w-3.5" />
                {s1.trend || '+4.2% vs TW-III (hari ke-50)'}
              </span>
            </div>

            {/* Metrik Kunci Program Triwulan */}
            <div className="grid gap-4 sm:grid-cols-3">
              {/* SPPN */}
              <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Rata-rata Nilai SPPN
                  </span>
                  <ShieldCheck className="h-5 w-5 text-emerald-700" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <p className="text-3xl font-black text-emerald-900">{s1.rata_sppn ?? 82.4}</p>
                  <span className="text-xs font-bold text-slate-400">/ 100</span>
                  <span className="rounded bg-emerald-100 text-emerald-800 px-1.5 py-0.5 text-[10px] font-extrabold">
                    Syarat ≥ 70
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Instrumen Utama pengusulan hak remisi dan integrasi.
                </p>
              </div>

              {/* PPKS */}
              <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/60 to-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                    Rata-rata Nilai PPKS
                  </span>
                  <Award className="h-5 w-5 text-amber-700" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <p className="text-3xl font-black text-amber-900">{s1.rata_ppks ?? 4.35}</p>
                  <span className="text-xs font-bold text-slate-400">/ 5.00</span>
                  <span className="rounded bg-amber-100 text-amber-800 px-1.5 py-0.5 text-[10px] font-extrabold">
                    Standar ≥ 4.00
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Kualitatif Komplementer pemantauan 5 sub-indikator karakter.
                </p>
              </div>

              {/* Tingkat Pelaksanaan */}
              <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50/60 to-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-800">
                    Tingkat Pelaksanaan
                  </span>
                  <CheckCircle2 className="h-5 w-5 text-sky-700" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <p className="text-3xl font-black text-sky-900">{s1.tingkat_pelaksanaan ?? 94.2}%</p>
                  <span className="text-xs font-bold text-slate-500">
                    ({s1.terlaksana ?? 360}/{s1.total_penilaian ?? 384} sesi)
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Persentase keterlaksanaan sesi program spiritual terjadwal.
                </p>
              </div>
            </div>

            {/* Charts Row: Tren Triwulan & Sebaran Rekomendasi 2/1/0 */}
            <div className="grid gap-5 lg:grid-cols-12">
              <SectionCard
                className="lg:col-span-8"
                title="Tren Penilaian Akumulatif Triwulan"
                icon={TrendingUp}
                action={
                  <Link
                    to="/app/rekap-penilaian"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    Rekap Lengkap
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                }
              >
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data?.period_trend || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="period_label" tick={{ fontSize: 11, fontWeight: 600 }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar yAxisId="left" dataKey="sppn" name="Sesi SPPN" fill="#10b981" radius={[6, 6, 0, 0]} />
                      <Bar yAxisId="left" dataKey="ppks" name="Sesi PPKS" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="rata_sppn"
                        name="Skor SPPN (0-100)"
                        stroke="#0284c7"
                        strokeWidth={2.5}
                        dot={{ r: 4 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>

              {/* Sebaran Kualifikasi 2, 1, 0 */}
              <SectionCard
                className="lg:col-span-4"
                title="Sebaran Rekomendasi"
                icon={PieChartIcon}
                action={<span className="text-xs font-bold text-slate-500">{totalRekWbp} WBP</span>}
              >
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={rekDist}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
                        innerRadius={45}
                        paddingAngle={3}
                      >
                        {rekDist.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                  {rekDist.map((r) => (
                    <div key={r.name} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-slate-600 truncate">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                        <span className="truncate">{r.name}</span>
                      </span>
                      <strong className="text-slate-900 shrink-0 ml-2">{r.value}</strong>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>

            {/* Program Score Cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                  Capaian Per Program Pembinaan ({s1.triwulan || 'Triwulan IV'})
                </h3>
                <Link
                  to="/app/program-pembinaan"
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  Kelola Program →
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {(s1.programs || []).map((prog) => (
                  <div
                    key={prog.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          {prog.kategori || 'SPPN'} • Bobot {prog.bobot}%
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          Target {prog.target_bulanan}x/bln
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{prog.nama_program}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{prog.jadwal || 'Terjadwal rutin'}</p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-600">
                        SPPN: <strong className="text-emerald-700">{prog.jumlah_ya || 0}</strong>
                      </span>
                      <span className="text-amber-700 font-bold">
                        PPKS: {prog.rata_karakter || '4.2'} / 5
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* [REV0019] SECTION 2: KOMPARASI TRIWULAN SEBELUMNYA */}
          {/* ======================================================== */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-600 text-xs font-black text-white">
                  2
                </span>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Ringkasan Capaian Triwulan Sebelumnya
                  </h2>
                </div>
              </div>

              {/* Selector Triwulan Pembanding */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Pilih Triwulan:</span>
                <div className="inline-flex rounded-xl bg-slate-200/80 p-1 text-xs font-bold">
                  {s2List.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedCompTw(t.id)}
                      className={`rounded-lg px-3 py-1 transition-all ${
                        selectedCompTw === t.id
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 font-semibold">Periode Pembanding</span>
                <p className="text-lg font-black text-slate-900 mt-1">{compData.label}</p>
                <span className="inline-block mt-2 rounded bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5">
                  Status: {compData.status}
                </span>
              </div>

              <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 font-semibold">WBP Terbina</span>
                <p className="text-2xl font-black text-slate-900 mt-1">{compData.wbp_aktif} WBP</p>
                <p className="text-xs text-slate-400 mt-1">Tercatat di akhir periode</p>
              </div>

              <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 font-semibold">x̄ Nilai SPPN</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-emerald-700">{compData.sppn}</span>
                  <span className="text-xs text-slate-400">/ 100</span>
                </div>
                <span className="text-[11px] text-emerald-700 font-bold">
                  {compData.sppn >= 70 ? 'Memenuhi Syarat (≥70)' : 'Tidak Memenuhi'}
                </span>
              </div>

              <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 font-semibold">x̄ Nilai PPKS</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-amber-700">{compData.ppks}</span>
                  <span className="text-xs text-slate-400">/ 5.00</span>
                </div>
                <span className="text-[11px] text-amber-700 font-bold">
                  {compData.ppks >= 4.0 ? 'Kualifikasi Baik (≥4.0)' : 'Kualifikasi Cukup'}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
