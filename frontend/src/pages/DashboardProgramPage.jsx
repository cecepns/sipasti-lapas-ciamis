import { useCallback, useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BookOpenCheck, FileDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { request, extractErrorMessage } from '@/utils/request';
import { API_ENDPOINTS } from '@/utils/endpoints';
import { DateRangeFilter } from '@/components/common/DateRangeFilter';
import { SelectInput } from '@/components/common/SelectInput';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { toIsoDate } from '@/utils/formatters';
import { exportProgramSummaryPdf } from '@/utils/pdfGenerator';

const KATEGORI_OPTIONS = [
  { value: 'SPPN', label: 'SPPN' },
  { value: 'PPKS', label: 'PPKS' },
  { value: 'Keduanya', label: 'SPPN & PPKS' },
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Dasbor Program Pembinaan</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Evaluasi bobot, target pelaksanaan, realisasi & efektivitas tiap program spiritual
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={loading || rows.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
        >
          <FileDown className="h-4 w-4" />
          Download Laporan Program (PDF)
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-wrap items-center gap-3 justify-between">
        <DateRangeFilter
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onChange={setDateRange}
          showPresets
        />
        <div className="w-full sm:w-56">
          <SelectInput
            options={KATEGORI_OPTIONS}
            value={kategori}
            onChange={setKategori}
            placeholder="Filter Kategori..."
            isSearchable={false}
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Menghitung capaian program spiritual..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Komparasi Pelaksanaan & Rata-rata Skor per Program
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Rasio pelaksanaan Ya (%) dan rata-rata skor konversi (0–100)
            </p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="nama_program" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="rasio_pelaksanaan" name="Rasio Ya (%)" fill="#059669" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="rata_skor" name="Rata Skor (0-100)" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3.5">Program</th>
                    <th className="px-4 py-3.5 text-center">Kategori</th>
                    <th className="px-4 py-3.5 text-center">Bobot</th>
                    <th className="px-4 py-3.5 text-center">Target Kolektif</th>
                    <th className="px-4 py-3.5 text-center">Terlaksana (Ya/Tdk)</th>
                    <th className="px-4 py-3.5 text-center">Rasio Ya</th>
                    <th className="px-4 py-3.5 text-center">Rata Karakter</th>
                    <th className="px-4 py-3.5 text-right">Rata Skor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 shrink-0">
                            <BookOpenCheck className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{p.nama_program}</p>
                            <p className="text-xs text-slate-500">{p.kode_program} • {p.jadwal}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <StatusBadge label={p.kategori} variant="blue" />
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-emerald-700">{p.bobot}%</td>
                      <td className="px-4 py-3.5 text-center text-xs text-slate-600">{p.target_kolektif} sesi</td>
                      <td className="px-4 py-3.5 text-center text-xs">
                        <span className="font-bold text-emerald-700">{p.jumlah_ya}</span> /{' '}
                        <span className="text-rose-600">{p.jumlah_tidak}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-800">{p.rasio_pelaksanaan}%</td>
                      <td className="px-4 py-3.5 text-center font-bold text-amber-600">{p.rata_karakter || '-'} / 5</td>
                      <td className="px-4 py-3.5 text-right font-extrabold text-slate-900">{p.rata_skor}</td>
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
