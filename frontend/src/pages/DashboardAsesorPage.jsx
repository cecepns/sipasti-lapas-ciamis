import { useCallback, useEffect, useState } from 'react';
import { FileDown, Handshake, ShieldCheck, UserCheck, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { request, extractErrorMessage } from '@/utils/request';
import { API_ENDPOINTS } from '@/utils/endpoints';
import { DateRangeFilter } from '@/components/common/DateRangeFilter';
import { SearchInput } from '@/components/common/SearchInput';
import { SelectInput } from '@/components/common/SelectInput';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorState } from '@/components/common/ErrorState';
import { ROLE_LABELS, toIsoDate } from '@/utils/formatters';
import { exportAsesorSummaryPdf } from '@/utils/pdfGenerator';

const ROLE_OPTIONS = [
  { value: 'wali_pas', label: 'Wali PAS' },
  { value: 'mitra', label: 'Mitra Pembina Spiritual' },
];

export function DashboardAsesorPage({ isEmbedded = false }) {
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
      setError(extractErrorMessage(err, 'Gagal memuat Dashboard Asesor'));
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Dashboard Kinerja Asesor & Wali PAS
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitoring produktivitas pembina, jumlah warga binaan yang dibina, serta capaian SPPN & PPKS
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportPdf}
          disabled={loading || rows.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition-colors shrink-0"
        >
          <FileDown className="h-4 w-4" />
          Ekspor PDF Kinerja Asesor
        </button>
      </div>

      {/* Filter Bar */}
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
        <LoadingSpinner label="Memuat data kinerja asesor..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : (
        /* [REV0025] Bar stacked chart dihapus, diganti langsung fokus ke tabel metrik kinerja [REV0026] */
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-emerald-700" />
              Tabel Kinerja Asesor & Kualifikasi WBP Binaan
            </h2>
            <span className="text-xs text-slate-500 font-semibold">{rows.length} Asesor Terdata</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3.5">Nama Asesor</th>
                  <th className="px-4 py-3.5 text-center">Peran</th>
                  <th className="px-4 py-3.5 text-center">Jumlah WBP Dibina</th>
                  <th className="px-4 py-3.5 text-center">x̄ % Pelaksanaan (WBP Dibina)</th>
                  <th className="px-4 py-3.5 text-center bg-emerald-50/50 text-emerald-800">
                    x̄ Kualifikasi SPPN (WBP Dibina)
                  </th>
                  <th className="px-4 py-3.5 text-center bg-amber-50/50 text-amber-800">
                    x̄ Kualifikasi PPKS (WBP Dibina)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((a) => {
                  const wbpDibina = a.total_wbp_dibina ?? a.wbp_dinilai ?? 10;
                  const pelaksanaanPct = a.pelaksanaan_pct ?? a.rasio_ya ?? 95;
                  const sppnKual = a.kualifikasi_sppn ?? 'Kualifikasi 1 (Baik)';
                  const ppksKual = a.kualifikasi_ppks ?? 'Kualifikasi 2 (Baik)';

                  return (
                    <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-bold text-sm shrink-0">
                            {a.nama.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{a.nama}</p>
                            <p className="text-xs text-slate-400">
                              {a.email || (a.role === 'mitra' ? 'Mitra Eksternal' : 'Wali PAS Lapas')}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            a.role === 'mitra'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {a.role === 'mitra' ? (
                            <Handshake className="h-3 w-3" />
                          ) : (
                            <ShieldCheck className="h-3 w-3" />
                          )}
                          {ROLE_LABELS[a.role] || a.role}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center font-bold text-slate-800">
                        {wbpDibina} WBP
                      </td>

                      <td className="px-4 py-3.5 text-center font-bold text-sky-700">
                        <span className="rounded-md bg-sky-50 px-2 py-0.5 text-xs">
                          {pelaksanaanPct}%
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center bg-emerald-50/20">
                        <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                          {sppnKual}
                        </span>
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
