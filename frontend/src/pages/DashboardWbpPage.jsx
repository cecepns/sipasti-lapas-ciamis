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
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Eye,
  FileDown,
  ScanFace,
  ShieldCheck,
  UserCircle2,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { request, extractErrorMessage } from '@/utils/request';
import { API_ENDPOINTS } from '@/utils/endpoints';
import { getAssetUrl } from '@/utils/api';
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
import {
  formatDate,
  formatDateTime,
  INSTRUMEN_INFO,
  toIsoDate,
} from '@/utils/formatters';
import { exportWbpProfilePdf, exportWbpRankingPdf } from '@/utils/pdfGenerator';

const SORT_OPTIONS = [
  { value: 'sppn_skor:DESC', label: 'Skor SPPN (Utama) Tertinggi' },
  { value: 'sppn_skor:ASC', label: 'Skor SPPN (Utama) Terendah' },
  { value: 'ppks_skor:DESC', label: 'Skor PPKS (Pendukung) Tertinggi' },
  { value: 'nama:ASC', label: 'Nama WBP (A-Z)' },
];

const REKOMENDASI_OPTIONS = [
  { value: 'direkomendasikan', label: 'Direkomendasikan' },
  { value: 'direkomendasikan_dengan_catatan', label: 'Direkomendasikan dengan Catatan' },
  { value: 'tidak_direkomendasikan', label: 'Tidak Direkomendasikan' },
];

export function DashboardWbpPage() {
  const { page, limit, pagination, setPagination, handlePageChange, handleLimitChange, resetPage } =
    usePagination(10);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [selectedWali, setSelectedWali] = useState(null);
  const [selectedRek, setSelectedRek] = useState(null);
  const [sortOption, setSortOption] = useState(SORT_OPTIONS[0]);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Profile modal state
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [profileTab, setProfileTab] = useState('sppn');

  const loadWaliOptions = useCallback(async (q) => {
    const res = await request.get(API_ENDPOINTS.USERS.LIST, { search: q, role: 'wali_pas', limit: 25 });
    return (res.data || []).map((u) => ({ value: u.id, label: u.nama }));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [sortBy, sortOrder] = (sortOption?.value || 'sppn_skor:DESC').split(':');
      const res = await request.get(API_ENDPOINTS.DASHBOARD.WBP, {
        page,
        limit,
        search,
        startDate: toIsoDate(dateRange.startDate),
        endDate: toIsoDate(dateRange.endDate),
        wali_pas_id: selectedWali?.value,
        rekomendasi: selectedRek?.value,
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
  }, [page, limit, search, dateRange, selectedWali, selectedRek, sortOption, setPagination]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openProfile = async (wbpId) => {
    setProfileOpen(true);
    setProfileLoading(true);
    setProfileData(null);
    setProfileTab('sppn');
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
        rekomendasi: selectedRek?.value,
      });
      await exportWbpRankingPdf(res.data || [], dateRange);
      toast.success('Rekap PDF Evaluasi WBP (SPPN & PPKS Terpisah) berhasil diunduh');
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Gagal mengunduh PDF'));
    }
  };

  const handleExportSinglePdf = async () => {
    if (!profileData) return;
    await exportWbpProfilePdf(profileData, dateRange);
    toast.success(`Rapor Profil PDF ${profileData.nama} berhasil diunduh`);
  };

  const getRekIcon = (code) => {
    if (code === 'direkomendasikan') return CheckCircle2;
    if (code === 'direkomendasikan_dengan_catatan') return AlertTriangle;
    return XCircle;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
          Dasbor & Profil WBP
        </h1>
        <button
          type="button"
          onClick={handleExportAllPdf}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors"
        >
          <FileDown className="h-4 w-4" />
          Unduh Rekap PDF
        </button>
      </div>

      {/* Compact Decision Legend */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Direkomendasikan: SPPN ≥ 70 & PPKS ≥ 70
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 font-semibold text-amber-800">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          Dengan Catatan: SPPN ≥ 70, PPKS &lt; 70
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 font-semibold text-rose-800">
          <span className="h-2 w-2 rounded-full bg-rose-500" />
          Tidak Direkomendasikan: SPPN &lt; 70
        </span>
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
              showPresets={false}
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
            options={REKOMENDASI_OPTIONS}
            value={selectedRek}
            onChange={(v) => {
              setSelectedRek(v);
              resetPage();
            }}
            placeholder="Filter Keputusan Rekomendasi..."
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
            description="Sesuaikan filter pencarian, rekomendasi, atau rentang tanggal."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3.5">Warga Binaan</th>
                    <th className="px-4 py-3.5">Wali PAS</th>
                    <th className="px-4 py-3.5 text-center bg-emerald-50/50 text-emerald-800">
                      SPPN
                    </th>
                    <th className="px-4 py-3.5 text-center bg-amber-50/50 text-amber-800">
                      PPKS
                    </th>
                    <th className="px-4 py-3.5 text-center">Face ID</th>
                    <th className="px-4 py-3.5 text-center">Rekomendasi</th>
                    <th className="px-4 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {w.foto_wajah ? (
                            <img
                              src={getAssetUrl(w.foto_wajah)}
                              alt={w.nama}
                              className="h-10 w-10 rounded-xl object-cover border border-emerald-200 shrink-0"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-bold text-sm shrink-0">
                              {w.nama.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900">{w.nama}</p>
                            <p className="text-xs text-slate-500">
                              {w.no_registrasi} • {w.blok_kamar || '-'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-medium text-slate-700">
                        {w.wali_pas_nama || '-'}
                      </td>
                      <td className="px-4 py-3.5 text-center bg-emerald-50/20">
                        <span className="block text-base font-extrabold text-emerald-800">
                          {w.sppn_skor}
                        </span>
                        <span
                          className={`text-[10px] font-bold ${
                            w.sppn_memenuhi ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {w.sppn_status} ({w.sppn_count}x)
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center bg-amber-50/20">
                        <span className="block text-base font-extrabold text-amber-800">
                          {w.ppks_skor}
                        </span>
                        <span
                          className={`text-[10px] font-bold ${
                            w.ppks_memenuhi ? 'text-emerald-600' : 'text-amber-700'
                          }`}
                        >
                          {w.ppks_status} ({w.ppks_count}x)
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                          <ScanFace className="h-3.5 w-3.5" />
                          {w.absensi_face_verified}/{w.total_absensi}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <StatusBadge
                          label={w.rekomendasi?.label || '-'}
                          variant={w.rekomendasi?.color || 'slate'}
                          icon={getRekIcon(w.rekomendasi?.code)}
                        />
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
        title={profileData ? `Profil & Evaluasi WBP — ${profileData.nama}` : 'Memuat Profil WBP'}
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
              Download PDF Profil (Dengan Foto & Kop Kementerian)
            </button>
          </>
        }
      >
        {profileLoading ? (
          <LoadingSpinner label="Menyusun profil terpisah SPPN & PPKS..." />
        ) : profileData ? (
          <div className="space-y-5">
            {/* WBP Photo + Biodata + Recommendation Banner */}
            <div className="grid gap-4 sm:grid-cols-12 items-start">
              <div className="sm:col-span-3 flex flex-col items-center">
                {profileData.foto_wajah ? (
                  <img
                    src={getAssetUrl(profileData.foto_wajah)}
                    alt={profileData.nama}
                    className="h-40 w-32 rounded-2xl object-cover border-2 border-emerald-200 shadow-md"
                  />
                ) : (
                  <div className="flex h-40 w-32 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400">
                    <UserCircle2 className="h-12 w-12" />
                    <span className="mt-1 text-[11px] font-semibold">Pas Foto 3x4</span>
                  </div>
                )}
                <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {profileData.has_face_id ? 'Face ID Terdaftar' : 'Belum Enroll Face ID'}
                </span>
              </div>

              <div className="sm:col-span-9 space-y-3">
                <div
                  className={`rounded-2xl border p-4 ${
                    profileData.ringkasan?.rekomendasi?.color === 'emerald'
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                      : profileData.ringkasan?.rekomendasi?.color === 'amber'
                      ? 'border-amber-300 bg-amber-50 text-amber-950'
                      : 'border-rose-300 bg-rose-50 text-rose-950'
                  }`}
                >
                  <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                    Keputusan Rekomendasi Kelayakan
                  </p>
                  <p className="text-lg font-extrabold mt-0.5">
                    {profileData.ringkasan?.rekomendasi?.label}
                  </p>
                  <p className="text-xs mt-1 opacity-90">
                    {profileData.ringkasan?.rekomendasi?.keterangan}
                  </p>
                </div>

                {/* Separated SPPN vs PPKS Cards */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border-2 border-emerald-200 bg-white p-3.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                      SPPN — {INSTRUMEN_INFO.SPPN.kepanjangan} (Utama)
                    </span>
                    <div className="mt-1.5 flex items-baseline justify-between">
                      <span className="text-2xl font-extrabold text-emerald-800">
                        {profileData.ringkasan?.sppn?.avgSkor ?? 0}
                        <span className="text-xs font-medium text-slate-400"> / 100</span>
                      </span>
                      <StatusBadge
                        label={profileData.ringkasan?.sppn?.status || '-'}
                        variant={profileData.ringkasan?.sppn?.memenuhi ? 'emerald' : 'rose'}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Terlaksana: {profileData.ringkasan?.sppn?.ya ?? 0}/{profileData.ringkasan?.sppn?.count ?? 0} sesi • Karakter: {profileData.ringkasan?.sppn?.avgKarakter || '-'}/5
                    </p>
                  </div>

                  <div className="rounded-2xl border-2 border-amber-200 bg-white p-3.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">
                      PPKS — {INSTRUMEN_INFO.PPKS.kepanjangan} (Monitoring)
                    </span>
                    <div className="mt-1.5 flex items-baseline justify-between">
                      <span className="text-2xl font-extrabold text-amber-800">
                        {profileData.ringkasan?.ppks?.avgSkor ?? 0}
                        <span className="text-xs font-medium text-slate-400"> / 100</span>
                      </span>
                      <StatusBadge
                        label={profileData.ringkasan?.ppks?.status || '-'}
                        variant={profileData.ringkasan?.ppks?.memenuhi ? 'emerald' : 'amber'}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Terlaksana: {profileData.ringkasan?.ppks?.ya ?? 0}/{profileData.ringkasan?.ppks?.count ?? 0} sesi • Karakter: {profileData.ringkasan?.ppks?.avgKarakter || '-'}/5
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart comparing SPPN vs PPKS per program */}
            <div className="rounded-2xl border border-slate-200 p-4">
              <h4 className="text-sm font-bold text-slate-900 mb-3">
                Perbandingan Skor SPPN (Utama) vs PPKS (Monitoring) per Program
              </h4>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={(profileData.sppn_program_summary || []).map((s, i) => ({
                      nama_program: s.nama_program,
                      skor_sppn: s.rata_skor,
                      skor_ppks: profileData.ppks_program_summary?.[i]?.rata_skor || 0,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="nama_program" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="skor_sppn" name="Skor SPPN (Utama)" fill="#059669" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="skor_ppks" name="Skor PPKS (Monitoring)" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Separated Tabs: SPPN | PPKS | Absensi Face ID */}
            <div>
              <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 mb-3">
                {[
                  { key: 'sppn', label: `Penilaian SPPN Utama (${(profileData.sppn_assessments || []).length})` },
                  { key: 'ppks', label: `Monitoring PPKS (${(profileData.ppks_assessments || []).length})` },
                  { key: 'absensi', label: `Absensi Face ID (${(profileData.attendances || []).length})` },
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setProfileTab(t.key)}
                    className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                      profileTab === t.key
                        ? t.key === 'ppks'
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {profileTab === 'sppn' && (
                <div className="max-h-56 overflow-y-auto rounded-xl border border-emerald-200 divide-y divide-slate-100">
                  {(profileData.sppn_assessments || []).map((a) => (
                    <div key={a.id} className="px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{a.nama_program}</span>
                        <span className="text-slate-400"> • {formatDate(a.tanggal)} • {a.asesor_nama}</span>
                        {a.keterangan && <p className="text-slate-500 mt-0.5">{a.keterangan}</p>}
                      </div>
                      <StatusBadge label={`SPPN ${a.skor_akhir} (${a.pelaksanaan})`} variant={a.pelaksanaan === 'Ya' ? 'emerald' : 'rose'} />
                    </div>
                  ))}
                  {(profileData.sppn_assessments || []).length === 0 && (
                    <p className="p-4 text-center text-xs text-slate-400">Belum ada penilaian SPPN pada periode ini.</p>
                  )}
                </div>
              )}

              {profileTab === 'ppks' && (
                <div className="max-h-56 overflow-y-auto rounded-xl border border-amber-200 divide-y divide-slate-100">
                  {(profileData.ppks_assessments || []).map((a) => (
                    <div key={a.id} className="px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{a.nama_program}</span>
                        <span className="text-slate-400"> • {formatDate(a.tanggal)} • {a.asesor_nama}</span>
                        {a.keterangan && <p className="text-slate-500 mt-0.5">{a.keterangan}</p>}
                      </div>
                      <StatusBadge label={`PPKS ${a.skor_akhir} (${a.pelaksanaan})`} variant={a.pelaksanaan === 'Ya' ? 'amber' : 'rose'} />
                    </div>
                  ))}
                  {(profileData.ppks_assessments || []).length === 0 && (
                    <p className="p-4 text-center text-xs text-slate-400">Belum ada penilaian PPKS pada periode ini (perlu monitoring pembinaan spiritual).</p>
                  )}
                </div>
              )}

              {profileTab === 'absensi' && (
                <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                  {(profileData.attendances || []).map((att) => (
                    <div key={att.id} className="px-3.5 py-2.5 flex items-center justify-between text-xs">
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
                  {(profileData.attendances || []).length === 0 && (
                    <p className="p-4 text-center text-xs text-slate-400">Belum ada riwayat absensi Face ID pada periode ini.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
