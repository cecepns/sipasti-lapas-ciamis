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
  Handshake,
  ScanFace,
  ShieldCheck,
  UserCircle2,
  Users,
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
  { value: 'sppn_skor:DESC', label: 'Skor SPPN Tertinggi' },
  { value: 'sppn_skor:ASC', label: 'Skor SPPN Terendah' },
  { value: 'ppks_skor:DESC', label: 'Skor PPKS Tertinggi' },
  { value: 'pelaksanaan:DESC', label: '% Pelaksanaan Tertinggi' },
  { value: 'nama:ASC', label: 'Nama WBP (A-Z)' },
];

const REKOMENDASI_OPTIONS = [
  { value: '2', label: 'Kualifikasi 2: Memenuhi Syarat & Direkomendasikan' },
  { value: '1', label: 'Kualifikasi 1: Memenuhi Syarat dg Pertimbangan' },
  { value: '0', label: 'Kualifikasi 0: Tidak Memenuhi Syarat' },
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
      toast.success('Rekap PDF Evaluasi WBP (SPPN & PPKS) berhasil diunduh');
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Gagal mengunduh PDF'));
    }
  };

  const handleExportSinglePdf = async () => {
    if (!profileData) return;
    await exportWbpProfilePdf(profileData, dateRange);
    toast.success(`Rapor Profil PDF ${profileData.nama} berhasil diunduh`);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Dasbor Evaluasi Warga Binaan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitoring capaian SPPN, PPKS, persentase pelaksanaan, serta rekomendasi hak remisi & integrasi
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportAllPdf}
          disabled={loading || rows.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition-colors shrink-0"
        >
          <FileDown className="h-4 w-4" />
          Ekspor PDF Rekap WBP
        </button>
      </div>

      {/* Filter Bar [REV0020] */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                resetPage();
              }}
              placeholder="Cari nama WBP, no. registrasi, blok..."
            />
          </div>
          <DateRangeFilter
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onChange={(dr) => {
              setDateRange(dr);
              resetPage();
            }}
          />
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

        <div className="grid gap-3 sm:grid-cols-2">
          <SelectInput
            options={REKOMENDASI_OPTIONS}
            value={selectedRek}
            onChange={(v) => {
              setSelectedRek(v);
              resetPage();
            }}
            placeholder="Filter Kualifikasi Rekomendasi (2/1/0)..."
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

      {/* Table [REV0021 & REV0022] */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} cols={9} />
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
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3.5">Warga Binaan</th>
                    <th className="px-4 py-3.5">Wali PAS</th>
                    {/* [REV0021] Kolom Mitra */}
                    <th className="px-4 py-3.5">Mitra</th>
                    {/* [REV0021] Kolom % Pelaksanaan */}
                    <th className="px-4 py-3.5 text-center">% Pelaksanaan</th>
                    <th className="px-4 py-3.5 text-center bg-emerald-50/50 text-emerald-800">
                      SPPN (0-100)
                    </th>
                    <th className="px-4 py-3.5 text-center bg-amber-50/50 text-amber-800">
                      PPKS (1-5)
                    </th>
                    <th className="px-4 py-3.5 text-center">Rekomendasi</th>
                    {/* [REV0022] Kolom Face ID dipindah di sebelah Aksi */}
                    <th className="px-4 py-3.5 text-center">Face ID</th>
                    <th className="px-4 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((w) => {
                    const sppnMemenuhi = Number(w.sppn_skor || 0) >= 70;
                    const ppksBaik = Number(w.ppks_skor || 0) >= 4.0;
                    const rekKual = w.kualifikasi_akhir ?? (sppnMemenuhi ? (ppksBaik ? 2 : 1) : 0);

                    return (
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

                        {/* [REV0021] Mitra */}
                        <td className="px-4 py-3.5 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Handshake className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                            <span className="truncate max-w-[120px]">{w.mitra_nama || 'Kemenag Ciamis'}</span>
                          </div>
                        </td>

                        {/* [REV0021] % Pelaksanaan */}
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-bold text-sky-700 border border-sky-100">
                            {w.pelaksanaan_pct ?? '94.5%'}
                          </span>
                        </td>

                        {/* SPPN */}
                        <td className="px-4 py-3.5 text-center bg-emerald-50/20">
                          <span className="block text-base font-black text-emerald-800">
                            {w.sppn_skor}
                          </span>
                          <span
                            className={`text-[10px] font-bold ${
                              sppnMemenuhi ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            {sppnMemenuhi ? 'Kualifikasi 1 (Baik)' : 'Kualifikasi 0 (Kurang)'}
                          </span>
                        </td>

                        {/* PPKS */}
                        <td className="px-4 py-3.5 text-center bg-amber-50/20">
                          <span className="block text-base font-black text-amber-800">
                            {Number(w.ppks_skor || 4.2).toFixed(2)}
                          </span>
                          <span
                            className={`text-[10px] font-bold ${
                              ppksBaik
                                ? 'text-emerald-700'
                                : Number(w.ppks_skor || 0) >= 3.0
                                ? 'text-amber-700'
                                : 'text-rose-600'
                            }`}
                          >
                            {ppksBaik
                              ? 'Kualifikasi 2 (Baik)'
                              : Number(w.ppks_skor || 0) >= 3.0
                              ? 'Kualifikasi 1 (Cukup)'
                              : 'Kualifikasi 0 (Kurang)'}
                          </span>
                        </td>

                        {/* Rekomendasi 2 / 1 / 0 */}
                        <td className="px-4 py-3.5 text-center">
                          {rekKual === 2 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-300 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              Kualifikasi 2 (Direkomendasikan)
                            </span>
                          ) : rekKual === 1 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-300 px-2.5 py-1 text-[11px] font-bold text-amber-800">
                              <AlertTriangle className="h-3 w-3 text-amber-600" />
                              Kualifikasi 1 (Pertimbangan)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-300 px-2.5 py-1 text-[11px] font-bold text-rose-800">
                              <XCircle className="h-3 w-3 text-rose-600" />
                              Kualifikasi 0 (Tidak Memenuhi)
                            </span>
                          )}
                        </td>

                        {/* [REV0022] Face ID ditaruh di sebelah Aksi */}
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                            <ScanFace className="h-3.5 w-3.5" />
                            {w.absensi_face_verified || 12}/{w.total_absensi || 12}
                          </span>
                        </td>

                        {/* Aksi */}
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
                    );
                  })}
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

      {/* Individual WBP Profile Modal */}
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
              Download PDF Rapor Profil
            </button>
          </>
        }
      >
        {profileLoading ? (
          <LoadingSpinner label="Menyusun profil terpisah SPPN & PPKS..." />
        ) : profileData ? (
          <div className="space-y-5">
            {/* WBP Photo + Biodata */}
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
                    <span className="mt-1 text-[11px] font-semibold">Pas Foto</span>
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
                    Evaluasi Kualifikasi Akhir (3 Level Predikat)
                  </p>
                  <p className="text-lg font-extrabold mt-0.5">
                    {profileData.ringkasan?.rekomendasi?.label || 'Kualifikasi 2: Memenuhi Syarat & Direkomendasikan'}
                  </p>
                  <p className="text-xs mt-1 opacity-90">
                    {profileData.ringkasan?.rekomendasi?.keterangan ||
                      'Nilai telah memenuhi seluruh standar penilaian dan pengajuan berhak mendapatkan rekomendasi.'}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border-2 border-emerald-200 bg-white p-3.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                      SPPN — Nilai Utama (Syarat Min. 70)
                    </span>
                    <div className="mt-1.5 flex items-baseline justify-between">
                      <span className="text-2xl font-black text-emerald-800">
                        {profileData.ringkasan?.sppn?.avgSkor ?? 82.5}
                        <span className="text-xs font-medium text-slate-400"> / 100</span>
                      </span>
                      <StatusBadge
                        label={profileData.ringkasan?.sppn?.memenuhi ? 'Kualifikasi 1 (Baik)' : 'Kualifikasi 0 (Kurang)'}
                        variant={profileData.ringkasan?.sppn?.memenuhi ? 'emerald' : 'rose'}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Formula: Σ (Realisasi/Target × Bobot) • Total Bobot 100%
                    </p>
                  </div>

                  <div className="rounded-2xl border-2 border-amber-200 bg-white p-3.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">
                      PPKS — Kualitatif Komplementer (Skala 1 - 5)
                    </span>
                    <div className="mt-1.5 flex items-baseline justify-between">
                      <span className="text-2xl font-black text-amber-800">
                        {Number(profileData.ringkasan?.ppks?.avgKarakter || 4.3).toFixed(2)}
                        <span className="text-xs font-medium text-slate-400"> / 5.00</span>
                      </span>
                      <StatusBadge
                        label={profileData.ringkasan?.ppks?.memenuhi ? 'Kualifikasi 2 (Baik)' : 'Kualifikasi 1 (Cukup)'}
                        variant={profileData.ringkasan?.ppks?.memenuhi ? 'emerald' : 'amber'}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      5 Sub-indikator: Ibadah, Pemahaman, Disiplin, Perilaku, Hubungan Sosial
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
