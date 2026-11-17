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
import { FileDown, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { request, extractErrorMessage } from '@/utils/request';
import { API_ENDPOINTS } from '@/utils/endpoints';
import { DateRangeFilter } from '@/components/common/DateRangeFilter';
import { SearchInput } from '@/components/common/SearchInput';
import { SelectInput } from '@/components/common/SelectInput';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ROLE_LABELS, toIsoDate } from '@/utils/formatters';
import { exportAsesorSummaryPdf } from '@/utils/pdfGenerator';

const ROLE_OPTIONS = [
  { value: 'wali_pas', label: 'Wali PAS' },
  { value: 'mitra', label: 'Mitra Keagamaan' },
];

export function DashboardAsesorPage() {
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [search, setSearch] = useState('');
  const [roleOption, setRoleOption] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await request.get(API_ENDPOINTS.DASHBOARD.ASESOR, {
        startDate: toIsoDate(dateRange.startDate),
        endDate: toIsoDate(dateRange.endDate),
        search,
        role: roleOption?.value,
      });
      setRows(res.data || []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Gagal memuat Dasbor Asesor'));
    } finally {
      setLoading(false);
    }
  }, [dateRange, search, roleOption]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportPdf = async () => {
    await exportAsesorSummaryPdf(rows, dateRange);
    toast.success('Laporan PDF Kinerja Asesor berhasil diunduh');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Dasbor Asesor (Wali PAS & Mitra)</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitoring keaktifan input penilaian SPPN & PPKS oleh Wali PAS dan Mitra Keagamaan
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={loading || rows.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
        >
          <FileDown className="h-4 w-4" />
          Download Laporan Asesor (PDF)
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs grid gap-3 md:grid-cols-12">
        <div className="md:col-span-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Cari nama asesor atau instansi..."
          />
        </div>
        <div className="md:col-span-5">
          <DateRangeFilter
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onChange={setDateRange}
          />
        </div>
        <div className="md:col-span-3">
          <SelectInput
            options={ROLE_OPTIONS}
            value={roleOption}
            onChange={setRoleOption}
            placeholder="Semua Peran Asesor"
            isSearchable={false}
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Menghitung kinerja Wali PAS & Mitra..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Produktivitas Input Penilaian SPPN & PPKS per Asesor
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="nama" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total_sppn" name="SPPN" stackId="a" fill="#059669" />
                  <Bar dataKey="total_ppks" name="PPKS" stackId="a" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3.5">Nama Asesor</th>
                    <th className="px-4 py-3.5 text-center">Peran</th>
                    <th className="px-4 py-3.5 text-center">Total Input</th>
                    <th className="px-4 py-3.5 text-center">SPPN / PPKS</th>
                    <th className="px-4 py-3.5 text-center">WBP Dinilai</th>
                    <th className="px-4 py-3.5 text-center">Rasio Ya</th>
                    <th className="px-4 py-3.5 text-right">Rata Karakter / Skor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 shrink-0">
                            <UserCheck className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{a.nama}</p>
                            <p className="text-xs text-slate-500">{a.instansi || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <StatusBadge
                          label={ROLE_LABELS[a.role] || a.role}
                          variant={a.role === 'wali_pas' ? 'emerald' : 'amber'}
                        />
                      </td>
                      <td className="px-4 py-3.5 text-center font-extrabold text-slate-900">
                        {a.total_penilaian}
                      </td>
                      <td className="px-4 py-3.5 text-center text-xs">
                        <span className="font-bold text-emerald-700">{a.total_sppn}</span> /{' '}
                        <span className="font-bold text-amber-600">{a.total_ppks}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center text-xs font-semibold text-slate-700">
                        {a.wbp_dinilai} WBP
                      </td>
                      <td className="px-4 py-3.5 text-center font-semibold text-slate-800">
                        {a.rasio_ya}%
                      </td>
                      <td className="px-4 py-3.5 text-right text-xs">
                        <span className="font-bold text-amber-600">{a.rata_karakter || '-'} / 5</span>
                        <span className="text-slate-400"> • </span>
                        <span className="font-bold text-slate-900">{a.rata_skor}</span>
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
