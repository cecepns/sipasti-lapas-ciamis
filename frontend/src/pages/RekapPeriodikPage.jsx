import { useCallback, useEffect, useState } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CalendarRange, FileDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { request, extractErrorMessage } from '@/utils/request';
import { API_ENDPOINTS } from '@/utils/endpoints';
import { DateRangeFilter } from '@/components/common/DateRangeFilter';
import { AsyncSelectInput } from '@/components/common/AsyncSelectInput';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { PERIOD_LABELS, toIsoDate } from '@/utils/formatters';
import { exportRekapPeriodikPdf } from '@/utils/pdfGenerator';

const PERIODS = [
  { key: 'harian', label: 'Rekap Harian', desc: 'Rincian per tanggal pelaksanaan', grad: 'from-emerald-600 to-teal-500' },
  { key: 'mingguan', label: 'Rekap Mingguan', desc: 'Akumulasi per minggu berjalan', grad: 'from-blue-600 to-cyan-500' },
  { key: 'bulanan', label: 'Rekap Bulanan', desc: 'Evaluasi rutin tiap bulan', grad: 'from-amber-500 to-orange-500' },
  { key: 'triwulan', label: 'Rekap Per 3 Bulan (Triwulan)', desc: 'Evaluasi triwulan (Q1–Q4)', grad: 'from-violet-600 to-purple-500' },
];

export function RekapPeriodikPage() {
  const [period, setPeriod] = useState('bulanan');
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [selectedWbp, setSelectedWbp] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedAsesor, setSelectedAsesor] = useState(null);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadWbpOptions = useCallback(async (q) => {
    const res = await request.get(API_ENDPOINTS.WBP.LIST, { search: q, limit: 20 });
    return (res.data || []).map((w) => ({ value: w.id, label: `${w.nama} (${w.no_registrasi})` }));
  }, []);

  const loadProgramOptions = useCallback(async (q) => {
    const res = await request.get(API_ENDPOINTS.PROGRAMS.LIST, { search: q, limit: 25 });
    return (res.data || []).map((p) => ({ value: p.id, label: p.nama_program }));
  }, []);

  const loadAsesorOptions = useCallback(async (q) => {
    const res = await request.get(API_ENDPOINTS.USERS.LIST, { search: q, roles: 'wali_pas,mitra', limit: 25 });
    return (res.data || []).map((u) => ({ value: u.id, label: `${u.nama} (${u.instansi || u.role})` }));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await request.get(API_ENDPOINTS.REPORTS.REKAP_PERIODIK, {
        period,
        startDate: toIsoDate(dateRange.startDate),
        endDate: toIsoDate(dateRange.endDate),
        wbp_id: selectedWbp?.value,
        program_id: selectedProgram?.value,
        asesor_id: selectedAsesor?.value,
      });
      setRows(res.data || []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Gagal memuat rekap periodik'));
    } finally {
      setLoading(false);
    }
  }, [period, dateRange, selectedWbp, selectedProgram, selectedAsesor]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportPdf = async () => {
    await exportRekapPeriodikPdf(rows, period, dateRange);
    toast.success(`PDF Rekap ${PERIOD_LABELS[period]} berhasil diunduh`);
  };

  const chartData = [...rows].reverse();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Rekap Penilaian Periodik (Harian, Mingguan, Bulanan & Per 3 Bulan)
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitoring terpisah nilai utama <strong>SPPN</strong> & pendukung{' '}
            <strong>PPKS</strong> serta sebaran rekomendasi kelayakan di setiap rentang periode
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={loading || rows.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 shrink-0"
        >
          <FileDown className="h-4 w-4" />
          Export PDF ({PERIOD_LABELS[period]})
        </button>
      </div>

      {/* Period Selector Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PERIODS.map((p) => {
          const active = period === p.key;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              className={`rounded-2xl border p-4 text-left transition-all ${
                active
                  ? `border-transparent bg-gradient-to-br ${p.grad} text-white shadow-lg scale-[1.01]`
                  : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold">{p.label}</span>
                <CalendarRange className={`h-4 w-4 ${active ? 'text-amber-300' : 'text-emerald-600'}`} />
              </div>
              <p className={`text-xs mt-1 ${active ? 'text-emerald-100' : 'text-slate-500'}`}>
                {p.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
        <DateRangeFilter
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onChange={setDateRange}
          showPresets
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <AsyncSelectInput
            loadOptionsFn={loadWbpOptions}
            value={selectedWbp}
            onChange={setSelectedWbp}
            placeholder="Filter Warga Binaan (ketik nama)..."
          />
          <AsyncSelectInput
            loadOptionsFn={loadProgramOptions}
            value={selectedProgram}
            onChange={setSelectedProgram}
            placeholder="Filter Program Spiritual..."
          />
          <AsyncSelectInput
            loadOptionsFn={loadAsesorOptions}
            value={selectedAsesor}
            onChange={setSelectedAsesor}
            placeholder="Filter Asesor (Wali PAS / Mitra)..."
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label={`Menyusun rekap ${PERIOD_LABELS[period]}...`} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white">
          <EmptyState
            icon={CalendarRange}
            title="Belum ada data pada periode ini"
            description="Ubah rentang waktu atau filter untuk melihat rekap penilaian periodik."
          />
        </div>
      ) : (
        <>
          {/* Composed Chart */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <h3 className="text-base font-extrabold text-slate-900 mb-1">
              Grafik Rekap {PERIOD_LABELS[period]} — SPPN (Utama) vs PPKS (Pendukung)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Perbandingan jumlah sesi terlaksana & rata-rata skor (0–100) secara terpisah
            </p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="period_label" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="total_sppn" name="Sesi SPPN (Utama)" fill="#059669" radius={[6, 6, 0, 0]} />
                  <Bar yAxisId="left" dataKey="total_ppks" name="Sesi PPKS (Pendukung)" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="rata_sppn" name="Rata Skor SPPN" stroke="#047857" strokeWidth={2.5} />
                  <Line yAxisId="right" type="monotone" dataKey="rata_ppks" name="Rata Skor PPKS" stroke="#d97706" strokeWidth={2.5} strokeDasharray="4 4" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Periodic Table */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3.5">Periode ({PERIOD_LABELS[period]})</th>
                    <th className="px-4 py-3.5 text-center">WBP Dinilai</th>
                    <th className="px-4 py-3.5 text-center bg-emerald-50/50 text-emerald-800">
                      SPPN Utama (Ya/Tot • Skor)
                    </th>
                    <th className="px-4 py-3.5 text-center bg-amber-50/50 text-amber-800">
                      PPKS Pendukung (Ya/Tot • Skor)
                    </th>
                    <th className="px-4 py-3.5 text-center text-emerald-700">Direkomendasikan</th>
                    <th className="px-4 py-3.5 text-center text-amber-700">Dengan Catatan</th>
                    <th className="px-4 py-3.5 text-center text-rose-700">Tidak Direk.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r) => (
                    <tr key={r.period_key} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                        {r.period_label || r.period_key}
                      </td>
                      <td className="px-4 py-3.5 text-center font-semibold text-slate-700">
                        {r.wbp_dinilai} WBP
                      </td>
                      <td className="px-4 py-3.5 text-center bg-emerald-50/20">
                        <span className="font-extrabold text-emerald-800">{r.rata_sppn || '-'}</span>
                        <span className="block text-[11px] text-slate-500">
                          {r.sppn_ya}/{r.total_sppn} sesi • Karakter {r.karakter_sppn || '-'}/5
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center bg-amber-50/20">
                        <span className="font-extrabold text-amber-800">{r.rata_ppks || '-'}</span>
                        <span className="block text-[11px] text-slate-500">
                          {r.ppks_ya}/{r.total_ppks} sesi • Karakter {r.karakter_ppks || '-'}/5
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-extrabold text-emerald-800">
                          {r.direkomendasikan}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-extrabold text-amber-800">
                          {r.dengan_catatan}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-block rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-extrabold text-rose-800">
                          {r.tidak_direkomendasikan}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
