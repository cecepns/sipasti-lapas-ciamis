import { useCallback, useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Award,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileDown,
  ScanFace,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { request, extractErrorMessage } from '@/utils/request';
import { API_ENDPOINTS } from '@/utils/endpoints';
import { DateRangeFilter } from '@/components/common/DateRangeFilter';
import { SelectInput } from '@/components/common/SelectInput';
import { AsyncSelectInput } from '@/components/common/AsyncSelectInput';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate, formatNumber, toIsoDate } from '@/utils/formatters';
import { exportAssessmentsPdf } from '@/utils/pdfGenerator';

const JENIS_OPTIONS = [
  { value: 'SPPN', label: 'SPPN (Penilaian Pembinaan)' },
  { value: 'PPKS', label: 'PPKS (Kepribadian Spiritual)' },
];

export function DashboardUmumPage() {
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedJenis, setSelectedJenis] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const loadProgramOptions = useCallback(async (search) => {
    const res = await request.get(API_ENDPOINTS.PROGRAMS.LIST, { search, limit: 25, status: 'aktif' });
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
        jenis_penilaian: selectedJenis?.value,
      });
      setData(res.data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Gagal memuat Dasbor Umum'));
    } finally {
      setLoading(false);
    }
  }, [dateRange, selectedProgram, selectedJenis]);

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
        jenis_penilaian: selectedJenis?.value,
      });
      await exportAssessmentsPdf(res.data || [], {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        jenis_penilaian: selectedJenis?.value,
      });
      toast.success('Laporan PDF Dasbor Umum berhasil diunduh');
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Gagal mengunduh PDF'));
    } finally {
      setExporting(false);
    }
  };

  const kpi = data?.kpi || {};

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Dasbor Umum SIPASTI</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Agregasi, komparasi & pemantauan aktivitas pembinaan spiritual WBP Lapas Kelas IIB Ciamis
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={exporting || loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors shrink-0"
        >
          <FileDown className="h-4 w-4" />
          {exporting ? 'Menyiapkan PDF...' : 'Download Laporan PDF'}
        </button>
      </div>

      {/* Filters bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
        <div className="grid gap-3 md:grid-cols-12 items-center">
          <div className="md:col-span-6">
            <DateRangeFilter
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onChange={setDateRange}
              showPresets
            />
          </div>
          <div className="md:col-span-3">
            <AsyncSelectInput
              loadOptionsFn={loadProgramOptions}
              value={selectedProgram}
              onChange={setSelectedProgram}
              placeholder="Filter Program Spiritual..."
            />
          </div>
          <div className="md:col-span-3">
            <SelectInput
              options={JENIS_OPTIONS}
              value={selectedJenis}
              onChange={setSelectedJenis}
              placeholder="Semua Instrumen (SPPN/PPKS)"
              isSearchable={false}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Mengolah agregasi data SIPASTI..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {[
              {
                label: 'WBP Aktif',
                value: formatNumber(kpi.wbp_aktif),
                sub: `${kpi.wbp_enrolled_face || 0} terdaftar Face ID`,
                icon: Users,
                tone: 'bg-emerald-50 text-emerald-700',
              },
              {
                label: 'Total Penilaian',
                value: formatNumber(kpi.total_penilaian),
                sub: `SPPN: ${kpi.total_sppn || 0} • PPKS: ${kpi.total_ppks || 0}`,
                icon: ClipboardCheck,
                tone: 'bg-sky-50 text-sky-700',
              },
              {
                label: 'Pelaksanaan Ya',
                value: `${kpi.tingkat_pelaksanaan || 0}%`,
                sub: `${kpi.total_ya || 0} Ya • ${kpi.total_tidak || 0} Tidak`,
                icon: CheckCircle2,
                tone: 'bg-teal-50 text-teal-700',
              },
              {
                label: 'Nilai Karakter',
                value: `${kpi.rata_karakter || 0} / 5`,
                sub: `Skor rata-rata: ${kpi.rata_skor || 0}`,
                icon: Award,
                tone: 'bg-amber-50 text-amber-700',
              },
              {
                label: 'Absensi Face ID',
                value: formatNumber(kpi.total_absensi),
                sub: `${kpi.face_verified_count || 0} terverifikasi wajah`,
                icon: ScanFace,
                tone: 'bg-indigo-50 text-indigo-700',
              },
              {
                label: 'Menunggu Kasubsi',
                value: formatNumber(kpi.menunggu_verifikasi),
                sub: 'Respon belum diverifikasi',
                icon: Clock,
                tone: 'bg-rose-50 text-rose-700',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-500">{item.label}</span>
                    <div className={`rounded-xl p-2 ${item.tone}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-3 text-2xl font-extrabold text-slate-900">{item.value}</p>
                  <p className="mt-1 text-[11px] text-slate-500 truncate">{item.sub}</p>
                </div>
              );
            })}
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <h3 className="text-base font-bold text-slate-900">
                Tren Penilaian SPPN & PPKS per Bulan
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Perbandingan jumlah catatan pelaksanaan kegiatan spiritual bulanan
              </p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.monthly_trend || []}>
                    <defs>
                      <linearGradient id="colorSppn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorPpks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="bulan" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="sppn" name="SPPN" stroke="#059669" fill="url(#colorSppn)" strokeWidth={2.5} />
                    <Area type="monotone" dataKey="ppks" name="PPKS" stroke="#f59e0b" fill="url(#colorPpks)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <h3 className="text-base font-bold text-slate-900">
                Realisasi per Program Spiritual
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Total sesi terlaksana (Ya) dibanding total pencatatan
              </p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.program_breakdown || []} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="nama_program" width={135} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="jumlah_ya" name="Terlaksana (Ya)" fill="#059669" radius={[0, 6, 6, 0]} />
                    <Bar dataKey="total_log" name="Total Log" fill="#cbd5e1" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Bottom Tables */}
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-6 rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
              <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="text-base font-bold text-slate-900">Top Warga Binaan Terbaik</h3>
                <p className="text-xs text-slate-500">Berdasarkan rata-rata skor dan keaktifan spiritual</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Warga Binaan</th>
                      <th className="px-4 py-3">Wali PAS</th>
                      <th className="px-4 py-3 text-center">Karakter</th>
                      <th className="px-4 py-3 text-right">Skor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(data?.top_wbp || []).map((w) => (
                      <tr key={w.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900 text-xs sm:text-sm">{w.nama}</p>
                          <p className="text-[11px] text-slate-500">{w.no_registrasi} • {w.blok_kamar}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">{w.wali_pas_nama || '-'}</td>
                        <td className="px-4 py-3 text-center font-bold text-amber-600 text-xs">
                          {w.rata_karakter || '-'} / 5
                        </td>
                        <td className="px-4 py-3 text-right">
                          <StatusBadge
                            label={`${w.rata_skor} (${w.predikat?.label || '-'})`}
                            variant={w.predikat?.color || 'slate'}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lg:col-span-6 rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
              <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="text-base font-bold text-slate-900">Aktivitas Penilaian Terbaru</h3>
                <p className="text-xs text-slate-500">Respon input terbaru dari Wali PAS & Mitra</p>
              </div>
              <div className="divide-y divide-slate-100">
                {(data?.recent_activities || []).map((act) => (
                  <div key={act.id} className="px-5 py-3 flex items-start justify-between gap-3 hover:bg-slate-50/70">
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{act.wbp_nama}</p>
                      <p className="text-xs text-slate-600">
                        {act.nama_program} • <span className="text-slate-400">Asesor: {act.asesor_nama}</span>
                      </p>
                      {act.keterangan && (
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{act.keterangan}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <div className="flex items-center justify-end gap-1">
                        <StatusBadge label={act.jenis_penilaian} variant={act.jenis_penilaian === 'SPPN' ? 'emerald' : 'amber'} />
                        <StatusBadge label={act.pelaksanaan} variant={act.pelaksanaan === 'Ya' ? 'blue' : 'rose'} />
                      </div>
                      <p className="text-[10px] text-slate-400">{formatDate(act.tanggal)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
