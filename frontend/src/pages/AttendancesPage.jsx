import { useCallback, useEffect, useState } from 'react';
import {
  Camera,
  FileDown,
  Loader2,
  Plus,
  ScanFace,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { request, extractErrorMessage } from '@/utils/request';
import { API_ENDPOINTS } from '@/utils/endpoints';
import { getAssetUrl } from '@/utils/api';
import { usePagination } from '@/hooks/usePagination';
import { SearchInput } from '@/components/common/SearchInput';
import { DateRangeFilter } from '@/components/common/DateRangeFilter';
import { AsyncSelectInput } from '@/components/common/AsyncSelectInput';
import { SelectInput } from '@/components/common/SelectInput';
import { Pagination } from '@/components/common/Pagination';
import { Modal } from '@/components/common/Modal';
import { FaceIdCamera } from '@/components/common/FaceIdCamera';
import { showConfirmToast } from '@/components/common/ConfirmToast';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { TableSkeleton } from '@/components/common/LoadingSpinner';
import { ErrorState } from '@/components/common/ErrorState';
import { formatDateTime, toIsoDate } from '@/utils/formatters';
import { exportAttendancesPdf } from '@/utils/pdfGenerator';

const STATUS_OPTIONS = [
  { value: 'Hadir', label: 'Hadir' },
  { value: 'Terlambat', label: 'Terlambat' },
  { value: 'Izin', label: 'Izin' },
  { value: 'Sakit', label: 'Sakit' },
];

const FACE_FILTER_OPTIONS = [
  { value: '1', label: 'Terverifikasi Face ID' },
  { value: '0', label: 'Perlu Cek Manual' },
];

export function AttendancesPage() {
  const { user } = useAuth();
  const canDelete = ['admin', 'wali_pas', 'kasubsi'].includes(user?.role);

  const { page, limit, pagination, setPagination, handlePageChange, handleLimitChange, resetPage } =
    usePagination(10);

  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [filterWbp, setFilterWbp] = useState(null);
  const [filterProgram, setFilterProgram] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterFace, setFilterFace] = useState(null);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // New Face ID Attendance Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedWbp, setSelectedWbp] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [statusOption, setStatusOption] = useState(STATUS_OPTIONS[0]);
  const [lokasi, setLokasi] = useState('Masjid At-Taubah Lapas Kelas IIB Ciamis');
  const [catatan, setCatatan] = useState('');
  const [captureData, setCaptureData] = useState(null);
  const [saving, setSaving] = useState(false);

  // Lightbox preview modal
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const loadWbpOptions = useCallback(async (q) => {
    const res = await request.get(API_ENDPOINTS.PUBLIC.WBP_SEARCH, { search: q, limit: 20 });
    return (res.data || []).map((w) => ({
      value: w.id,
      label: `${w.nama} (${w.no_registrasi})`,
      raw: w,
    }));
  }, []);

  const loadProgramOptions = useCallback(async (q) => {
    const res = await request.get(API_ENDPOINTS.PROGRAMS.LIST, { search: q, limit: 25, status: 'aktif' });
    return (res.data || []).map((p) => ({ value: p.id, label: p.nama_program }));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await request.get(API_ENDPOINTS.ATTENDANCES.LIST, {
        page,
        limit,
        search,
        startDate: toIsoDate(dateRange.startDate),
        endDate: toIsoDate(dateRange.endDate),
        wbp_id: filterWbp?.value,
        program_id: filterProgram?.value,
        status_kehadiran: filterStatus?.value,
        face_verified: filterFace?.value,
      });
      setRows(res.data || []);
      setPagination(res.pagination);
    } catch (err) {
      setError(extractErrorMessage(err, 'Gagal memuat data absensi'));
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, dateRange, filterWbp, filterProgram, filterStatus, filterFace, setPagination]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedWbp) return toast.error('Warga Binaan wajib dipilih');
    if (!selectedProgram) return toast.error('Program wajib dipilih');
    if (!captureData?.file) return toast.error('Foto selfie Face ID wajib diambil melalui kamera');

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('wbp_id', selectedWbp.value);
      fd.append('program_id', selectedProgram.value);
      fd.append('status_kehadiran', statusOption?.value || 'Hadir');
      fd.append('lokasi', lokasi);
      fd.append('catatan', catatan);
      fd.append('face_match_score', captureData.faceMatchScore);
      fd.append('face_verified', captureData.faceVerified ? '1' : '0');
      fd.append('foto_selfie', captureData.file);

      await request.upload(API_ENDPOINTS.ATTENDANCES.LIST, fd, 'post');
      toast.success('Absensi Face ID & selfie berhasil dicatat');
      setModalOpen(false);
      setSelectedWbp(null);
      setCaptureData(null);
      setCatatan('');
      fetchData();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Gagal menyimpan absensi'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item) => {
    showConfirmToast({
      title: 'Hapus Log Absensi?',
      message: `Hapus catatan absensi ${item.wbp_nama} pada ${formatDateTime(item.tanggal_absen)}?`,
      onConfirm: async () => {
        try {
          await request.del(API_ENDPOINTS.ATTENDANCES.DETAIL(item.id));
          toast.success('Catatan absensi dihapus');
          fetchData();
        } catch (err) {
          toast.error(extractErrorMessage(err, 'Gagal menghapus absensi'));
        }
      },
    });
  };

  const handleExportPdf = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.REPORTS.EXPORT_DATA, {
        type: 'attendances',
        startDate: toIsoDate(dateRange.startDate),
        endDate: toIsoDate(dateRange.endDate),
        wbp_id: filterWbp?.value,
        program_id: filterProgram?.value,
      });
      await exportAttendancesPdf(res.data || [], dateRange);
      toast.success('Laporan PDF Absensi Face ID berhasil diunduh');
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Gagal mengunduh PDF'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Absensi WBP (Face ID & Selfie)</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Pencatatan kehadiran warga binaan berbasis verifikasi biometrik wajah dan bukti foto selfie kamera
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportPdf}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
          >
            <FileDown className="h-4 w-4" />
            Export PDF
          </button>
          <button
            type="button"
            onClick={() => {
              setCaptureData(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Absensi Face ID Baru
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
        <div className="grid gap-3 md:grid-cols-12">
          <div className="md:col-span-4">
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                resetPage();
              }}
              placeholder="Cari nama WBP, program, lokasi..."
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
              loadOptionsFn={loadWbpOptions}
              value={filterWbp}
              onChange={(v) => {
                setFilterWbp(v);
                resetPage();
              }}
              placeholder="Filter WBP..."
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <AsyncSelectInput
            loadOptionsFn={loadProgramOptions}
            value={filterProgram}
            onChange={(v) => {
              setFilterProgram(v);
              resetPage();
            }}
            placeholder="Filter Program..."
          />
          <SelectInput
            options={STATUS_OPTIONS}
            value={filterStatus}
            onChange={(v) => {
              setFilterStatus(v);
              resetPage();
            }}
            placeholder="Status Kehadiran"
            isSearchable={false}
          />
          <SelectInput
            options={FACE_FILTER_OPTIONS}
            value={filterFace}
            onChange={(v) => {
              setFilterFace(v);
              resetPage();
            }}
            placeholder="Status Face ID"
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
            icon={ScanFace}
            title="Belum ada log absensi"
            description="Klik tombol Absensi Face ID Baru atau buka Kiosk Absensi untuk mencatat kehadiran WBP."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3.5">Selfie</th>
                    <th className="px-4 py-3.5">Waktu Absen</th>
                    <th className="px-4 py-3.5">Warga Binaan</th>
                    <th className="px-4 py-3.5">Program & Lokasi</th>
                    <th className="px-4 py-3.5 text-center">Kehadiran</th>
                    <th className="px-4 py-3.5 text-center">Verifikasi Face ID</th>
                    <th className="px-4 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        {item.foto_selfie ? (
                          <button
                            type="button"
                            onClick={() => setPreviewPhoto({ url: getAssetUrl(item.foto_selfie), item })}
                            className="group relative h-12 w-12 overflow-hidden rounded-xl border border-slate-200"
                          >
                            <img
                              src={getAssetUrl(item.foto_selfie)}
                              alt={item.wbp_nama}
                              className="h-full w-full object-cover group-hover:scale-110 transition-transform"
                            />
                          </button>
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                            <Camera className="h-5 w-5" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                        {formatDateTime(item.tanggal_absen)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">{item.wbp_nama}</p>
                        <p className="text-xs text-slate-500">
                          {item.wbp_no_registrasi} • {item.blok_kamar}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800 text-xs">{item.nama_program}</p>
                        <p className="text-[11px] text-slate-500">{item.lokasi || '-'}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge
                          label={item.status_kehadiran}
                          variant={
                            item.status_kehadiran === 'Hadir'
                              ? 'emerald'
                              : item.status_kehadiran === 'Terlambat'
                              ? 'amber'
                              : 'slate'
                          }
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <StatusBadge
                            label={item.face_verified ? 'Terverifikasi' : 'Manual/Cek'}
                            variant={item.face_verified ? 'emerald' : 'amber'}
                            icon={item.face_verified ? ShieldCheck : ShieldAlert}
                          />
                          <span className="text-[11px] font-semibold text-slate-500">
                            Match: {item.face_match_score ?? 0}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                            title="Hapus Absensi"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
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

      {/* Create Face ID Attendance Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Catat Absensi WBP (Face ID & Selfie Kamera)"
        subtitle="Pilih warga binaan, pilih kegiatan spiritual, lalu pindai wajah menggunakan kamera"
        size="xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Warga Binaan *</label>
              <AsyncSelectInput
                loadOptionsFn={loadWbpOptions}
                value={selectedWbp}
                onChange={(opt) => {
                  setSelectedWbp(opt);
                  setCaptureData(null);
                }}
                placeholder="Ketik nama / no. reg WBP..."
                isClearable={false}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Program Spiritual *</label>
              <AsyncSelectInput
                loadOptionsFn={loadProgramOptions}
                value={selectedProgram}
                onChange={setSelectedProgram}
                placeholder="Pilih program..."
                isClearable={false}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Status Kehadiran</label>
              <SelectInput
                options={STATUS_OPTIONS}
                value={statusOption}
                onChange={setStatusOption}
                isClearable={false}
                isSearchable={false}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Lokasi</label>
              <input
                type="text"
                value={lokasi}
                onChange={(e) => setLokasi(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Catatan</label>
              <input
                type="text"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Opsional..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <FaceIdCamera
              mode="verify"
              subjectName={selectedWbp?.raw?.nama || ''}
              referenceDescriptor={selectedWbp?.raw?.face_descriptor || null}
              onCapture={setCaptureData}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving || !captureData?.file}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Menyimpan...' : 'Simpan Absensi Face ID'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Photo Preview Lightbox */}
      <Modal
        isOpen={Boolean(previewPhoto)}
        onClose={() => setPreviewPhoto(null)}
        title={previewPhoto?.item?.wbp_nama || 'Foto Selfie Absensi'}
        subtitle={
          previewPhoto?.item
            ? `${previewPhoto.item.nama_program} • ${formatDateTime(previewPhoto.item.tanggal_absen)} • Match ${previewPhoto.item.face_match_score}%`
            : ''
        }
        size="md"
      >
        {previewPhoto && (
          <img
            src={previewPhoto.url}
            alt="Selfie Face ID"
            className="w-full rounded-2xl object-cover border border-slate-200"
          />
        )}
      </Modal>
    </div>
  );
}
