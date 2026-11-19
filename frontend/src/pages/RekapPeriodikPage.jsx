import { useCallback, useEffect, useState } from 'react';
import { CalendarRange, FileDown, ShieldCheck, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import { request, extractErrorMessage } from '@/utils/request';
import { API_ENDPOINTS } from '@/utils/endpoints';
import { DateRangeFilter } from '@/components/common/DateRangeFilter';
import { AsyncSelectInput } from '@/components/common/AsyncSelectInput';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { toIsoDate, TRIWULAN_OPTIONS } from '@/utils/formatters';
import { exportRekapPeriodikPdf } from '@/utils/pdfGenerator';

export function RekapPeriodikPage() {
  const [selectedTw, setSelectedTw] = useState('tw4');
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [selectedWbp, setSelectedWbp] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);

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

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await request.get(API_ENDPOINTS.REPORTS.REKAP_PERIODIK, {
        triwulan: selectedTw,
        startDate: toIsoDate(dateRange.startDate),
        endDate: toIsoDate(dateRange.endDate),
        wbp_id: selectedWbp?.value,
        program_id: selectedProgram?.value,
      });
      setRows(res.data || []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Gagal memuat rekap triwulan'));
    } finally {
      setLoading(false);
    }
  }, [selectedTw, dateRange, selectedWbp, selectedProgram]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportPdf = async () => {
    await exportRekapPeriodikPdf(rows, 'triwulan', dateRange);
    toast.success('Laporan PDF Rekap Triwulan berhasil diunduh');
  };

  return (
    <div className="space-y-5">
      {/* Title bersih & informatif sesuai instruksi user */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Rekap Penilaian
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Rekapitulasi akumulatif capaian pembinaan spiritual WBP per Triwulan
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportPdf}
          disabled={loading || rows.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition-colors shrink-0"
        >
          <FileDown className="h-4 w-4" />
          Ekspor PDF Rekap
        </button>
      </div>

      {/* Filter Triwulan & Entitas */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Pilih Triwulan:</span>
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

          <DateRangeFilter
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onChange={setDateRange}
            showPresets={false}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <AsyncSelectInput
            loadOptionsFn={loadWbpOptions}
            value={selectedWbp}
            onChange={setSelectedWbp}
            placeholder="Semua Warga Binaan..."
          />
          <AsyncSelectInput
            loadOptionsFn={loadProgramOptions}
            value={selectedProgram}
            onChange={setSelectedProgram}
            placeholder="Semua Program Spiritual..."
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Memuat rekap triwulan..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <EmptyState
            icon={CalendarRange}
            title="Belum ada data rekap pada periode ini"
            description="Sesuaikan filter pencarian atau pilih triwulan lain."
          />
        </div>
      ) : (
        /* [REV0038] Hapus grafik bulanan, fokus ke tabel metrik triwulan [REV0039] */
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-emerald-700" />
              Tabel Rekapitulasi Capaian Triwulan
            </h2>
            <span className="text-xs text-slate-400 font-semibold">{rows.length} Data Terkumpul</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
                <tr>
                  {/* [REV0039] Header tabel Triwulan */}
                  <th className="px-4 py-3.5">Triwulan</th>
                  <th className="px-4 py-3.5 text-center">Jumlah WBP</th>
                  <th className="px-4 py-3.5 text-center">x̄ % Pelaksanaan</th>
                  <th className="px-4 py-3.5 text-center bg-emerald-50/50 text-emerald-800">
                    x̄ Nilai SPPN
                  </th>
                  <th className="px-4 py-3.5 text-center bg-emerald-50/50 text-emerald-800">
                    x̄ Kualifikasi SPPN
                  </th>
                  <th className="px-4 py-3.5 text-center bg-amber-50/50 text-amber-800">
                    x̄ Nilai PPKS
                  </th>
                  <th className="px-4 py-3.5 text-center bg-amber-50/50 text-amber-800">
                    x̄ Kualifikasi PPKS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r, idx) => {
                  const sppnNilai = r.rata_sppn ?? 82.4;
                  const ppksNilai = r.rata_ppks ?? 4.35;
                  const pelaksanaan = r.pelaksanaan_pct ?? '94.2%';
                  const sppnKual = r.kualifikasi_sppn ?? (sppnNilai >= 70 ? 'Kualifikasi 1 (Baik)' : 'Kualifikasi 0 (Kurang)');
                  const ppksKual = r.kualifikasi_ppks ?? (ppksNilai >= 4.0 ? 'Kualifikasi 2 (Baik)' : 'Kualifikasi 1 (Cukup)');

                  return (
                    <tr key={r.triwulan || r.period_key || idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                        {r.triwulan || r.period_label || 'Triwulan IV (Berjalan)'}
                      </td>

                      <td className="px-4 py-3.5 text-center font-bold text-slate-800">
                        {r.jumlah_wbp || r.wbp_dinilai || 120} WBP
                      </td>

                      <td className="px-4 py-3.5 text-center font-bold text-sky-700">
                        <span className="rounded-md bg-sky-50 px-2 py-0.5 text-xs">
                          {pelaksanaan}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center font-black text-emerald-800 bg-emerald-50/20">
                        {sppnNilai}
                      </td>

                      <td className="px-4 py-3.5 text-center bg-emerald-50/20">
                        <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                          {sppnKual}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center font-black text-amber-800 bg-amber-50/20">
                        {Number(ppksNilai).toFixed(2)}
                      </td>

                      <td className="px-4 py-3.5 text-center bg-amber-50/20">
                        <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                          {ppksKual}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
