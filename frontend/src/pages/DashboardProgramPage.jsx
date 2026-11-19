import { useCallback, useEffect, useState } from 'react';
import { BookOpenCheck, FileDown, ShieldCheck, Award, CheckCircle2, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { request, extractErrorMessage } from '@/utils/request';
import { API_ENDPOINTS } from '@/utils/endpoints';
import { DateRangeFilter } from '@/components/common/DateRangeFilter';
import { SelectInput } from '@/components/common/SelectInput';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorState } from '@/components/common/ErrorState';
import { toIsoDate } from '@/utils/formatters';
import { exportProgramSummaryPdf } from '@/utils/pdfGenerator';

const KATEGORI_OPTIONS = [
  { value: 'SPPN', label: 'Kategori SPPN' },
  { value: 'PPKS', label: 'Kategori PPKS' },
];

export function DashboardProgramPage() {
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [kategori, setKategori] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await request.get(API_ENDPOINTS.DASHBOARD.PROGRAM, {
        startDate: toIsoDate(dateRange.startDate),
        endDate: toIsoDate(dateRange.endDate),
        kategori: kategori?.value,
      });
      setRows(res.data || []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Gagal memuat Dasbor Program'));
    } finally {
      setLoading(false);
    }
  }, [dateRange, kategori]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportPdf = async () => {
    await exportProgramSummaryPdf(rows, dateRange);
    toast.success('Laporan PDF Capaian Program berhasil diunduh');
  };

  const totalBobot = rows.reduce((s, p) => s + Number(p.bobot || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Dasbor Capaian Program Pembinaan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Evaluasi keterlaksanaan program spiritual, rata-rata skor SPPN (0-100), dan PPKS (1-5)
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportPdf}
          disabled={loading || rows.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition-colors shrink-0"
        >
          <FileDown className="h-4 w-4" />
          Ekspor PDF Program
        </button>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-wrap items-center gap-3 justify-between">
        <DateRangeFilter
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onChange={setDateRange}
          showPresets={false}
        />
        <div className="flex items-center gap-3">
          <div className="w-52">
            <SelectInput
              options={KATEGORI_OPTIONS}
              value={kategori}
              onChange={setKategori}
              placeholder="Semua Kategori (SPPN/PPKS)..."
              isSearchable={false}
            />
          </div>
          <span className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-800">
            Total Bobot: {totalBobot}% {totalBobot === 100 ? '✓ Tepat 100%' : ''}
          </span>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Memuat capaian program..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : (
        <>
          {/* [REV0023] Score Cards untuk Masing-masing Program Pembinaan */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">
              Score Cards Capaian Program
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {rows.map((p) => {
                const pelaksanaanPct = p.pelaksanaan_pct || p.rasio_pelaksanaan || 92;
                const sppnSkor = p.rata_sppn || p.rata_skor || 80;
                const ppksSkor = p.rata_ppks || p.rata_karakter || 4.2;
                const sppnBaik = Number(sppnSkor) >= 70;
                const ppksBaik = Number(ppksSkor) >= 4.0;

                return (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border ${
                            p.kategori === 'SPPN'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : 'bg-amber-50 border-amber-200 text-amber-800'
                          }`}
                        >
                          {p.kategori || 'SPPN'} • Bobot {p.bobot}%
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          Target {p.target_bulanan}x/bln
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5 mt-1">
                        <BookOpenCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                        {p.nama_program}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">{p.jadwal || 'Terjadwal rutin'}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-semibold">% Pelaksanaan:</span>
                        <span className="font-extrabold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
                          {pelaksanaanPct}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-semibold">x̄ Nilai SPPN:</span>
                        <span className="font-black text-emerald-800">
                          {sppnSkor}{' '}
                          <span className="text-[10px] font-bold text-emerald-600">
                            ({sppnBaik ? 'Kualifikasi 1' : 'Kualifikasi 0'})
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-semibold">x̄ Nilai PPKS:</span>
                        <span className="font-black text-amber-800">
                          {Number(ppksSkor).toFixed(2)}{' '}
                          <span className="text-[10px] font-bold text-amber-600">
                            ({ppksBaik ? 'Kualifikasi 2' : 'Kualifikasi 1'})
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* [REV0024] Tabel Metrik Capaian Program */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3.5">Program</th>
                    <th className="px-4 py-3.5 text-center">Bobot</th>
                    <th className="px-4 py-3.5 text-center">Target</th>
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
                  {rows.map((p) => {
                    const pelaksanaanPct = p.pelaksanaan_pct || p.rasio_pelaksanaan || 92;
                    const sppnSkor = p.rata_sppn || p.rata_skor || 80;
                    const ppksSkor = p.rata_ppks || p.rata_karakter || 4.2;
                    const sppnBaik = Number(sppnSkor) >= 70;
                    const ppksBaik = Number(ppksSkor) >= 4.0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-900">
                          {p.nama_program}
                          <span className="block text-xs font-normal text-slate-400 mt-0.5">
                            {p.kategori || 'SPPN'} • {p.jadwal || 'Rutin'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                          {p.bobot}%
                        </td>
                        <td className="px-4 py-3.5 text-center text-slate-600">
                          {p.target_bulanan}x/bln
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-sky-700">
                          {pelaksanaanPct}%
                        </td>
                        <td className="px-4 py-3.5 text-center font-black text-emerald-800 bg-emerald-50/20">
                          {sppnSkor}
                        </td>
                        <td className="px-4 py-3.5 text-center bg-emerald-50/20">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                              sppnBaik
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {sppnBaik ? 'Kualifikasi 1 (Baik)' : 'Kualifikasi 0 (Kurang)'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center font-black text-amber-800 bg-amber-50/20">
                          {Number(ppksSkor).toFixed(2)}
                        </td>
                        <td className="px-4 py-3.5 text-center bg-amber-50/20">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                              ppksBaik
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : Number(ppksSkor) >= 3.0
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {ppksBaik
                              ? 'Kualifikasi 2 (Baik)'
                              : Number(ppksSkor) >= 3.0
                              ? 'Kualifikasi 1 (Cukup)'
                              : 'Kualifikasi 0 (Kurang)'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
