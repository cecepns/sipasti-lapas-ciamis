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
  CalendarRange,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileDown,
  PieChart as PieChartIcon,
  PlusCircle,
  ScanFace,
  ShieldCheck,
  TrendingUp,
  Trophy,
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
import { KpiCard } from '@/components/dashboard/KpiCard';
import { SectionCard } from '@/components/dashboard/SectionCard';
import {
  formatDate,
  formatNumber,
  PERIOD_LABELS,
  ROLE_LABELS,
  toIsoDate,
} from '@/utils/formatters';
import { exportAssessmentsPdf } from '@/utils/pdfGenerator';

const PERIOD_TABS = [
  { key: 'harian', label: 'Harian' },
  { key: 'mingguan', label: 'Mingguan' },
  { key: 'bulanan', label: 'Bulanan' },
  { key: 'triwulan', label: 'Triwulan' },
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
    const res = await request.get(API_ENDPOINTS.PROGRAMS.LIST, {
      search,
      limit: 25,
      status: 'aktif',
    });
    return (res.data || []).map((p) => ({
      value: p.id,
      label: `${p.nama_program} (${p.bobot}%)`,
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
      toast.success('Laporan PDF berhasil diunduh');
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Gagal mengunduh PDF'));
    } finally {
      setExporting(false);
    }
  };

  const kpi = data?.kpi || {};
  const rekDist = data?.rekomendasi_distribution || [];
  const totalRekWbp = rekDist.reduce((s, r) => s + Number(r.value || 0), 0);

  const kpiItems = [
    {
      label: 'Rata Skor SPPN',
      value: kpi.rata_sppn || 0,
      meta: `${kpi.total_sppn || 0} sesi • Karakter ${kpi.karakter_sppn || '-'}/5`,
      icon: ShieldCheck,
      accent: 'emerald',
      progress: Number(kpi.rata_sppn || 0),
    },
    {
      label: 'Rata Skor PPKS',
      value: kpi.rata_ppks || 0,
      meta: `${kpi.total_ppks || 0} sesi • Karakter ${kpi.karakter_ppks || '-'}/5`,
      icon: Award,
      accent: 'amber',
      progress: Number(kpi.rata_ppks || 0),
    },
    {
      label: 'Warga Binaan Aktif',
      value: formatNumber(kpi.wbp_aktif),
      meta: `${kpi.wbp_enrolled_face || 0} terdaftar Face ID`,
      icon: Users,
      accent: 'sky',
      progress: kpi.wbp_aktif ? Math.round(((kpi.wbp_enrolled_face || 0) / kpi.wbp_aktif) * 100) : 0,
    },
    {
      label: 'Tingkat Pelaksanaan',
      value: `${kpi.tingkat_pelaksanaan || 0}%`,
      meta: `${kpi.total_ya || 0} Ya • ${kpi.total_tidak || 0} Tidak`,
      icon: CheckCircle2,
      accent: 'teal',
      progress: Number(kpi.tingkat_pelaksanaan || 0),
    },
    {
      label: 'Absensi Face ID',
      value: formatNumber(kpi.total_absensi),
      meta: `${kpi.face_verified_count || 0} terverifikasi wajah`,
      icon: ScanFace,
      accent: 'violet',
      progress: kpi.total_absensi
        ? Math.round(((kpi.face_verified_count || 0) / kpi.total_absensi) * 100)
        : 0,
    },
    {
      label: 'Menunggu Verifikasi',
      value: formatNumber(kpi.menunggu_verifikasi),
      meta: 'Verifikasi Kasubsi',
      icon: Clock,
      accent: 'rose',
      progress: kpi.total_penilaian
        ? Math.round(((kpi.menunggu_verifikasi || 0) / kpi.total_penilaian) * 100)
        : 0,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Compact Executive Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-700 via-teal-700 to-sky-700 px-5 py-4 sm:px-6 sm:py-5 text-white shadow-md shadow-emerald-900/10">
        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-emerald-100/90">
              {ROLE_LABELS[user?.role] || user?.role} • {formatDate(new Date(), 'EEEE, dd MMMM yyyy')}
            </p>
            <h1 className="mt-1 text-xl sm:text-2xl font-extrabold tracking-tight text-white truncate">
              Selamat Datang, {user?.nama}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {['admin', 'wali_pas', 'mitra'].includes(user?.role) && (
              <Link
                to="/app/penilaian"
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-xs hover:bg-amber-300 transition-colors whitespace-nowrap"
              >
                <PlusCircle className="h-4 w-4" />
                Input Nilai
              </Link>
            )}
            <Link
              to="/app/rekap-penilaian"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 border border-white/25 px-3 py-2 text-xs font-semibold text-white hover:bg-white/25 transition-colors whitespace-nowrap"
            >
              <CalendarRange className="h-4 w-4" />
              Rekap
            </Link>
            <Link
              to="/app/panduan"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 border border-white/25 px-3 py-2 text-xs font-semibold text-white hover:bg-white/25 transition-colors whitespace-nowrap"
            >
              <BookOpen className="h-4 w-4" />
              Panduan
            </Link>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={exporting || loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-emerald-800 shadow-xs hover:bg-emerald-50 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              <FileDown className="h-4 w-4" />
              {exporting ? 'Menyiapkan...' : 'Unduh PDF'}
            </button>
          </div>
        </div>
      </div>

      {/* Unified Filter Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-xs flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1">
          <DateRangeFilter
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onChange={setDateRange}
            showPresets={false}
          />
          <div className="w-full sm:w-56">
            <AsyncSelectInput
              loadOptionsFn={loadProgramOptions}
              value={selectedProgram}
              onChange={setSelectedProgram}
              placeholder="Semua Program..."
            />
          </div>
        </div>

        <div className="inline-flex self-start lg:self-auto rounded-xl bg-slate-100 p-1">
          {PERIOD_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setPeriod(t.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                period === t.key
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Memuat data dasbor..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : (
        <>
          {/* KPI Summary Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {kpiItems.map((item) => (
              <KpiCard key={item.label} {...item} />
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid gap-5 lg:grid-cols-12">
            <SectionCard
              className="lg:col-span-8"
              title={`Tren Penilaian ${PERIOD_LABELS[period]}`}
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
                      name="Skor SPPN"
                      stroke="#0284c7"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="rata_ppks"
                      name="Skor PPKS"
                      stroke="#ea580c"
                      strokeWidth={2.5}
                      strokeDasharray="5 4"
                      dot={{ r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard
              className="lg:col-span-4"
              title="Sebaran Rekomendasi"
              icon={PieChartIcon}
              bodyClassName="p-5 flex flex-col justify-between"
            >
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={rekDist}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={44}
                      outerRadius={72}
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

              <div className="space-y-2 mt-3">
                {rekDist.map((item) => {
                  const pct = totalRekWbp ? Math.round((item.value / totalRekWbp) * 100) : 0;
                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-semibold text-slate-700 truncate">{item.name}</span>
                      </div>
                      <span className="font-bold text-slate-900 shrink-0 ml-2">
                        {item.value} <span className="font-medium text-slate-400">({pct}%)</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </div>

          {/* Program Progress Grid */}
          {(data?.program_breakdown || []).length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(data?.program_breakdown || []).map((prog) => {
                const rasio = prog.total_log ? Math.round((prog.jumlah_ya / prog.total_log) * 100) : 0;
                return (
                  <div
                    key={prog.id}
                    className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{prog.nama_program}</h4>
                      <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 shrink-0">
                        {prog.bobot}%
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
                      <span>{prog.jumlah_ya || 0}/{prog.total_log || 0} Ya</span>
                      <span className="font-bold text-slate-700">{rasio}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${rasio}%` }}
                      />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-emerald-50/70 px-2.5 py-1.5">
                        <span className="block text-[10px] font-bold text-emerald-700">SPPN</span>
                        <strong className="text-sm text-emerald-950">{prog.rata_sppn || '-'}</strong>
                      </div>
                      <div className="rounded-xl bg-amber-50/70 px-2.5 py-1.5">
                        <span className="block text-[10px] font-bold text-amber-700">PPKS</span>
                        <strong className="text-sm text-amber-950">{prog.rata_ppks || '-'}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom Row: Top WBP Leaderboard + Recent Activities */}
          <div className="grid gap-5 lg:grid-cols-12">
            <SectionCard
              className="lg:col-span-7"
              title="Peringkat Evaluasi WBP"
              icon={Trophy}
              bodyClassName="p-0"
              action={
                <Link
                  to="/app/dasbor-wbp"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Lihat Semua
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            >
              {(data?.top_wbp || []).length === 0 ? (
                <p className="p-6 text-center text-xs text-slate-400">Belum ada data evaluasi WBP.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Warga Binaan</th>
                        <th className="px-4 py-3 text-center">SPPN</th>
                        <th className="px-4 py-3 text-center">PPKS</th>
                        <th className="px-4 py-3 text-right">Rekomendasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(data?.top_wbp || []).map((w, idx) => (
                        <tr key={w.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <span
                                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold shrink-0 ${
                                  idx === 0
                                    ? 'bg-amber-100 text-amber-800'
                                    : idx === 1
                                    ? 'bg-slate-200 text-slate-700'
                                    : idx === 2
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {idx + 1}
                              </span>
                              {w.foto_wajah ? (
                                <img
                                  src={getAssetUrl(w.foto_wajah)}
                                  alt={w.nama}
                                  className="h-8 w-8 rounded-lg object-cover border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs shrink-0">
                                  {w.nama.charAt(0)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 text-xs sm:text-sm truncate">
                                  {w.nama}
                                </p>
                                <p className="text-[11px] text-slate-500 truncate">
                                  {w.no_registrasi} • {w.wali_pas_nama || '-'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                              {w.sppn_skor}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
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
              )}
            </SectionCard>

            <SectionCard
              className="lg:col-span-5"
              title="Aktivitas Terbaru"
              icon={ClipboardCheck}
              bodyClassName="p-0"
            >
              {(data?.recent_activities || []).length === 0 ? (
                <p className="p-6 text-center text-xs text-slate-400">Belum ada aktivitas penilaian.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {(data?.recent_activities || []).map((act) => (
                    <div
                      key={act.id}
                      className="px-5 py-3 flex items-start justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                          {act.wbp_nama}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {act.nama_program} • {act.asesor_nama}
                        </p>
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        <StatusBadge
                          label={act.jenis_penilaian}
                          variant={act.jenis_penilaian === 'SPPN' ? 'emerald' : 'amber'}
                        />
                        <p className="text-[11px] font-medium text-slate-500">
                          {formatDate(act.tanggal)} • {act.skor_akhir}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}
