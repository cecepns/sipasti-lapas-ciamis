import { useCallback, useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Award, Eye, FileDown, ScanFace, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { request, extractErrorMessage } from '@/utils/request';
import { API_ENDPOINTS } from '@/utils/endpoints';
import { usePagination } from '@/hooks/usePagination';
import { DateRangeFilter } from '@/components/common/DateRangeFilter';
import { SearchInput } from '@/components/common/SearchInput';
import { AsyncSelectInput } from '@/components/common/AsyncSelectInput';
import { SelectInput } from '@/components/common/SelectInput';
import { Pagination } from '@/components/common/Pagination';
import { Modal } from '@/components/common/Modal';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner, TableSkeleton } from '@/components/common/LoadingSpinner';
import { ErrorState } from '@/components/common/ErrorState';
import { formatDate, formatDateTime, toIsoDate } from '@/utils/formatters';
import { exportWbpProfilePdf, exportWbpRankingPdf } from '@/utils/pdfGenerator';

const SORT_OPTIONS = [
  { value: 'skor_total:DESC', label: 'Skor Tertinggi' },
  { value: 'skor_total:ASC', label: 'Skor Terendah' },
  { value: 'capaian_persen:DESC', label: 'Capaian Tertinggi' },
  { value: 'nama:ASC', label: 'Nama (A-Z)' },
];

const JENIS_OPTIONS = [
  { value: 'SPPN', label: 'Khusus SPPN' },
  { value: 'PPKS', label: 'Khusus PPKS' },
];

export function DashboardWbpPage() {
  const { page, limit, pagination, setPagination, handlePageChange, handleLimitChange, resetPage } =
    usePagination(10);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [selectedWali, setSelectedWali] = useState(null);
  const [selectedJenis, setSelectedJenis] = useState(null);
  const [sortOption, setSortOption] = useState(SORT_OPTIONS[0]);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Profile modal state
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);

  const loadWaliOptions = useCallback(async (q) => {
    const res = await request.get(API_ENDPOINTS.USERS.LIST, { search: q, role: 'wali_pas', limit: 25 });
    return (res.data || []).map((u) => ({ value: u.id, label: u.nama }));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [sortBy, sortOrder] = (sortOption?.value || 'skor_total:DESC').split(':');
      const res = await request.get(API_ENDPOINTS.DASHBOARD.WBP, {
        page,
        limit,
        search,
        startDate: toIsoDate(dateRange.startDate),
        endDate: toIsoDate(dateRange.endDate),
        wali_pas_id: selectedWali?.value,
        jenis_penilaian: selectedJenis?.value,
        sortBy,
        sortOrder,
      });
      setRows(res.data || []);
      setPagination(res.pagination);
    } catch (err) {
      setError(extractErrorMessage(err, 'Gagal memuat Dasbor WBP'));
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, dateRange, selectedWali, selectedJenis, sortOption, setPagination]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openProfile = async (wbpId) => {
    setProfileOpen(true);
    setProfileLoading(true);
    setProfileData(null);
    try {
      const res = await request.get(API_ENDPOINTS.WBP.DETAIL(wbpId), {
        startDate: toIsoDate(dateRange.startDate),
        endDate: toIsoDate(dateRange.endDate),
      });
      setProfileData(res.data);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Gagal memuat profil WBP'));
      setProfileOpen(false);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleExportAllPdf = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.DASHBOARD.WBP, {
        page: 1,
        limit: 100,
        search,
        startDate: toIsoDate(dateRange.startDate),
        endDate: toIsoDate(dateRange.endDate),
        wali_pas_id: selectedWali?.value,
        jenis_penilaian: selectedJenis?.value,
      });
      await exportWbpRankingPdf(res.data || [], dateRange);
      toast.success('Rekap PDF Akumulasi WBP berhasil diunduh');
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Gagal mengunduh PDF'));
    }
  };

  const handleExportSinglePdf = async () => {
    if (!profileData) return;
    await exportWbpProfilePdf(profileData, dateRange);
    toast.success(`Rapor PDF ${profileData.nama} berhasil diunduh`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Dasbor & Profil WBP</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Akumulasi skor berbobot, capaian target program, predikat kelayakan & rapor PDF individu WBP
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportAllPdf}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
        >
          <FileDown className="h-4 w-4" />
          Download Rekap WBP (PDF)
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
        <div className="grid gap-3 md:grid-cols-12">
          <div className="md:col-span-4">
            <SearchInput
              value={search}
              onChange={(val) => {
                setSearch(val);
                resetPage();
              }}
              placeholder="Cari nama WBP, no. registrasi, blok..."
            />
          </div>
          <div className="md:col-span-4">
            <DateRangeFilter
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onChange={(r) => {
                setDateRange(r);
                resetPage();
              }}
            />
          </div>
          <div className="md:col-span-4">
            <AsyncSelectInput
              loadOptionsFn={loadWaliOptions}
              value={selectedWali}
              onChange={(v) => {
                setSelectedWali(v);
                resetPage();
              }}
              placeholder="Filter Wali PAS..."
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SelectInput
            options={JENIS_OPTIONS}
            value={selectedJenis}
            onChange={(v) => {
              setSelectedJenis(v);
              resetPage();
            }}
            placeholder="Semua Jenis (SPPN & PPKS)"
            isSearchable={false}
          />
          <SelectInput
            options={SORT_OPTIONS}
            value={sortOption}
            onChange={(v) => setSortOption(v || SORT_OPTIONS[0])}
            isClearable={false}
            isSearchable={false}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : error ? (
          <div className="p-6">
            <ErrorState message={error} onRetry={fetchData} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Award}
            title="Belum ada data evaluasi WBP"
            description="Sesuaikan filter pencarian atau rentang tanggal untuk melihat akumulasi nilai WBP."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3.5">Warga Binaan</th>
                    <th className="px-4 py-3.5">Wali PAS</th>
                    <th className="px-4 py-3.5 text-center">Capaian Target</th>
                    <th className="px-4 py-3.5 text-center">Karakter / SPPN / PPKS</th>
                    <th className="px-4 py-3.5 text-center">Absensi Face ID</th>
                    <th className="px-4 py-3.5 text-center">Skor & Predikat</th>
                    <th className="px-4 py-3.5 text-right">Rapor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900">{w.nama}</p>
                        <p className="text-xs text-slate-500">
                          {w.no_registrasi} • {w.blok_kamar || '-'}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-medium text-slate-700">
                        {w.wali_pas_nama || '-'}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="text-xs font-bold text-slate-900">{w.capaian_persen}%</span>
                          <span className="text-[11px] text-slate-400">
                            {w.jumlah_ya} / {w.target_total} sesi
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center text-xs">
                        <span className="font-bold text-amber-600">{w.rata_karakter || '-'}</span>
                        <span className="text-slate-400"> / </span>
                        <span className="font-semibold text-emerald-700">{w.sppn_avg || '-'}</span>
                        <span className="text-slate-400"> / </span>
                        <span className="font-semibold text-sky-700">{w.ppks_avg || '-'}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                          <ScanFace className="h-3.5 w-3.5" />
                          {w.absensi_face_verified}/{w.total_absensi}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-sm font-extrabold text-slate-900">{w.skor_total}</span>
                          <StatusBadge
                            label={w.predikat?.label || '-'}
                            variant={w.predikat?.color || 'slate'}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => openProfile(w.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Profil & PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              pagination={pagination}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
            />
          </>
        )}
      </div>

      {/* Individual WBP Profile & Rapor Modal */}
      <Modal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        title={profileData ? `Profil Pembinaan — ${profileData.nama}` : 'Memuat Profil WBP'}
        subtitle={profileData ? `${profileData.no_registrasi} • ${profileData.blok_kamar || '-'}` : ''}
        size="2xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setProfileOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleExportSinglePdf}
              disabled={!profileData}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <FileDown className="h-4 w-4" />
              Download PDF Rapor WBP
            </button>
          </>
        }
      >
        {profileLoading ? (
          <LoadingSpinner label="Menyusun rapor penilaian WBP..." />
        ) : profileData ? (
          <div className="space-y-6">
            {/* Top summary banner */}
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                <span className="text-[11px] font-bold uppercase text-emerald-700">Skor Berbobot</span>
                <p className="text-2xl font-extrabold text-emerald-900 mt-1">
                  {profileData.ringkasan?.skor_total_berbobot ?? 0}
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  {profileData.ringkasan?.predikat?.rekomendasi}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                <span className="text-[11px] font-bold uppercase text-slate-500">Rata-rata SPPN</span>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">
                  {profileData.ringkasan?.sppn_avg ?? 0}
                </p>
                <p className="text-[11px] text-slate-500">{profileData.ringkasan?.sppn_count ?? 0} penilaian</p>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                <span className="text-[11px] font-bold uppercase text-slate-500">Rata-rata PPKS</span>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">
                  {profileData.ringkasan?.ppks_avg ?? 0}
                </p>
                <p className="text-[11px] text-slate-500">{profileData.ringkasan?.ppks_count ?? 0} penilaian</p>
              </div>
              <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4">
                <span className="text-[11px] font-bold uppercase text-indigo-700">Absensi Face ID</span>
                <p className="text-2xl font-extrabold text-indigo-900 mt-1">
                  {profileData.ringkasan?.total_face_verified ?? 0}/{profileData.ringkasan?.total_absensi ?? 0}
                </p>
                <p className="text-[11px] text-indigo-700 flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {profileData.has_face_id ? 'Face ID Terdaftar' : 'Belum Enroll Face ID'}
                </p>
              </div>
            </div>

            {/* Chart Capaian Program */}
            <div className="rounded-2xl border border-slate-200 p-4">
              <h4 className="text-sm font-bold text-slate-900 mb-3">
                Capaian & Skor per Program Pembinaan Spiritual
              </h4>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profileData.program_summary || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="nama_program" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="capaian_persen" name="Capaian (%)" fill="#059669" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="skor_program" name="Skor Program" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Program breakdown table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2.5">Program</th>
                    <th className="px-3 py-2.5 text-center">Bobot</th>
                    <th className="px-3 py-2.5 text-center">Target</th>
                    <th className="px-3 py-2.5 text-center">Ya</th>
                    <th className="px-3 py-2.5 text-center">Capaian</th>
                    <th className="px-3 py-2.5 text-center">Karakter</th>
                    <th className="px-3 py-2.5 text-right">Kontribusi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(profileData.program_summary || []).map((p) => (
                    <tr key={p.program_id}>
                      <td className="px-3 py-2.5 font-semibold text-slate-800">{p.nama_program}</td>
                      <td className="px-3 py-2.5 text-center">{p.bobot}%</td>
                      <td className="px-3 py-2.5 text-center">{p.target_periode}x</td>
                      <td className="px-3 py-2.5 text-center font-bold text-emerald-700">{p.jumlah_ya}x</td>
                      <td className="px-3 py-2.5 text-center">{p.capaian_persen}%</td>
                      <td className="px-3 py-2.5 text-center">{p.rata_karakter || '-'}</td>
                      <td className="px-3 py-2.5 text-right font-bold">{p.kontribusi_bobot}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Recent assessments */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">
                Riwayat Penilaian Terbaru ({(profileData.assessments || []).length})
              </h4>
              <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                {(profileData.assessments || []).slice(0, 15).map((a) => (
                  <div key={a.id} className="px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{a.nama_program}</span>
                      <span className="text-slate-400"> • {formatDate(a.tanggal)} • {a.asesor_nama}</span>
                      {a.keterangan && <p className="text-slate-500 mt-0.5">{a.keterangan}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <StatusBadge label={a.jenis_penilaian} variant={a.jenis_penilaian === 'SPPN' ? 'emerald' : 'amber'} />
                      <StatusBadge label={`${a.pelaksanaan} (${a.skor_akhir})`} variant={a.pelaksanaan === 'Ya' ? 'blue' : 'rose'} />
                    </div>
                  </div>
                ))}
                {(profileData.assessments || []).length === 0 && (
                  <p className="p-4 text-center text-xs text-slate-400">Belum ada riwayat penilaian pada periode ini.</p>
                )}
              </div>
            </div>

            {/* Recent Face ID Attendances */}
            {(profileData.attendances || []).length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-2">
                  Riwayat Absensi Face ID ({profileData.attendances.length})
                </h4>
                <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                  {profileData.attendances.slice(0, 10).map((att) => (
                    <div key={att.id} className="px-3.5 py-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-800">{att.nama_program}</span>
                        <span className="text-slate-400"> • {formatDateTime(att.tanggal_absen)}</span>
                      </div>
                      <StatusBadge
                        label={`${att.status_kehadiran} • Face ${att.face_match_score}%`}
                        variant={att.face_verified ? 'emerald' : 'amber'}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
