import { useCallback, useEffect, useState } from 'react';
import {
  Edit3,
  Loader2,
  Plus,
  ScanFace,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
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
import { formatDate, toIsoDate } from '@/utils/formatters';

const STATUS_OPTIONS = [
  { value: 'aktif', label: 'Aktif (Sedang Dibina)' },
  { value: 'bebas', label: 'Bebas' },
  { value: 'pindah', label: 'Pindah Lapas' },
];

const AGAMA_OPTIONS = [
  { value: 'Islam', label: 'Islam' },
  { value: 'Kristen', label: 'Kristen' },
  { value: 'Katolik', label: 'Katolik' },
  { value: 'Hindu', label: 'Hindu' },
  { value: 'Buddha', label: 'Buddha' },
  { value: 'Konghucu', label: 'Konghucu' },
];

const EMPTY_FORM = {
  id: null,
  no_registrasi: '',
  nama: '',
  nik: '',
  tempat_lahir: '',
  tanggal_lahir: null,
  agama: AGAMA_OPTIONS[0],
  blok_kamar: '',
  perkara: '',
  lama_pidana: '',
  tanggal_masuk: null,
  ekspirasi: null,
  wali_pas: null,
  status: STATUS_OPTIONS[0],
  foto_file: null,
  foto_preview: null,
};

export function WbpPage() {
  const { user } = useAuth();
  const canEdit = ['admin', 'wali_pas'].includes(user?.role);
  const canDelete = user?.role === 'admin';

  const { page, limit, pagination, setPagination, handlePageChange, handleLimitChange, resetPage } =
    usePagination(10);

  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [filterWali, setFilterWali] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create/Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Enroll Face ID Modal
  const [enrollModal, setEnrollModal] = useState({ open: false, wbp: null });
  const [enrollCapture, setEnrollCapture] = useState(null);
  const [enrolling, setEnrolling] = useState(false);

  const loadWaliOptions = useCallback(async (q) => {
    const res = await request.get(API_ENDPOINTS.USERS.LIST, { search: q, role: 'wali_pas', limit: 25 });
    return (res.data || []).map((u) => ({ value: u.id, label: u.nama }));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await request.get(API_ENDPOINTS.WBP.LIST, {
        page,
        limit,
        search,
        startDate: toIsoDate(dateRange.startDate),
        endDate: toIsoDate(dateRange.endDate),
        wali_pas_id: filterWali?.value,
        status: filterStatus?.value,
      });
      setRows(res.data || []);
      setPagination(res.pagination);
    } catch (err) {
      setError(extractErrorMessage(err, 'Gagal memuat data WBP'));
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, dateRange, filterWali, filterStatus, setPagination]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setForm({
      id: item.id,
      no_registrasi: item.no_registrasi || '',
      nama: item.nama || '',
      nik: item.nik || '',
      tempat_lahir: item.tempat_lahir || '',
      tanggal_lahir: item.tanggal_lahir ? new Date(item.tanggal_lahir) : null,
      agama: AGAMA_OPTIONS.find((a) => a.value === item.agama) || AGAMA_OPTIONS[0],
      blok_kamar: item.blok_kamar || '',
      perkara: item.perkara || '',
      lama_pidana: item.lama_pidana || '',
      tanggal_masuk: item.tanggal_masuk ? new Date(item.tanggal_masuk) : null,
      ekspirasi: item.ekspirasi ? new Date(item.ekspirasi) : null,
      wali_pas: item.wali_pas_id ? { value: item.wali_pas_id, label: item.wali_pas_nama || 'Wali PAS' } : null,
      status: STATUS_OPTIONS.find((s) => s.value === item.status) || STATUS_OPTIONS[0],
      foto_file: null,
      foto_preview: item.foto_wajah ? getAssetUrl(item.foto_wajah) : null,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.no_registrasi.trim() || !form.nama.trim()) {
      return toast.error('No. Registrasi dan Nama WBP wajib diisi');
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('no_registrasi', form.no_registrasi.trim());
      fd.append('nama', form.nama.trim());
      fd.append('nik', form.nik || '');
      fd.append('tempat_lahir', form.tempat_lahir || '');
      if (form.tanggal_lahir) fd.append('tanggal_lahir', toIsoDate(form.tanggal_lahir));
      fd.append('agama', form.agama?.value || 'Islam');
      fd.append('blok_kamar', form.blok_kamar || '');
      fd.append('perkara', form.perkara || '');
      fd.append('lama_pidana', form.lama_pidana || '');
      if (form.tanggal_masuk) fd.append('tanggal_masuk', toIsoDate(form.tanggal_masuk));
      if (form.ekspirasi) fd.append('ekspirasi', toIsoDate(form.ekspirasi));
      if (form.wali_pas?.value) fd.append('wali_pas_id', form.wali_pas.value);
      fd.append('status', form.status?.value || 'aktif');
      if (form.foto_file) {
        fd.append('foto_wajah', form.foto_file);
      }

      if (form.id) {
        await request.upload(API_ENDPOINTS.WBP.DETAIL(form.id), fd, 'put');
        toast.success('Data WBP berhasil diperbarui');
      } else {
        await request.upload(API_ENDPOINTS.WBP.LIST, fd, 'post');
        toast.success('Data WBP baru berhasil ditambahkan');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Gagal menyimpan data WBP'));
    } finally {
      setSaving(false);
    }
  };

  const handleEnrollSubmit = async () => {
    if (!enrollModal.wbp || !enrollCapture?.file || !enrollCapture?.descriptor) {
      return toast.error('Silakan pindai wajah terlebih dahulu');
    }
    setEnrolling(true);
    try {
      const fd = new FormData();
      fd.append('foto_wajah', enrollCapture.file);
      fd.append('face_descriptor', JSON.stringify(enrollCapture.descriptor));
      const res = await request.upload(API_ENDPOINTS.WBP.ENROLL_FACE(enrollModal.wbp.id), fd, 'post');
      toast.success(res.message || 'Face ID WBP berhasil didaftarkan');
      setEnrollModal({ open: false, wbp: null });
      setEnrollCapture(null);
      fetchData();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Gagal mendaftarkan Face ID'));
    } finally {
      setEnrolling(false);
    }
  };

  const handleDelete = (item) => {
    showConfirmToast({
      title: 'Hapus Data WBP?',
      message: `Hapus ${item.nama} (${item.no_registrasi}) beserta seluruh riwayat penilaian dan absensinya?`,
      onConfirm: async () => {
        try {
          await request.del(API_ENDPOINTS.WBP.DETAIL(item.id));
          toast.success('Data WBP berhasil dihapus');
          fetchData();
        } catch (err) {
          toast.error(extractErrorMessage(err, 'Gagal menghapus WBP'));
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Data Warga Binaan (SDP)</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelola data WBP, penugasan Wali PAS, serta pendaftaran biometrik Face ID
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Tambah Data WBP
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs grid gap-3 md:grid-cols-12">
        <div className="md:col-span-4">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              resetPage();
            }}
            placeholder="Cari nama WBP, no. registrasi, blok..."
          />
        </div>
        <div className="md:col-span-3">
          <DateRangeFilter
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onChange={(r) => {
              setDateRange(r);
              resetPage();
            }}
          />
        </div>
        <div className="md:col-span-3">
          <AsyncSelectInput
            loadOptionsFn={loadWaliOptions}
            value={filterWali}
            onChange={(v) => {
              setFilterWali(v);
              resetPage();
            }}
            placeholder="Filter Wali PAS..."
          />
        </div>
        <div className="md:col-span-2">
          <SelectInput
            options={STATUS_OPTIONS}
            value={filterStatus}
            onChange={(v) => {
              setFilterStatus(v);
              resetPage();
            }}
            placeholder="Status"
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
            icon={Users}
            title="Belum ada data Warga Binaan"
            description="Tambahkan data WBP baru atau ubah filter pencarian."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3.5">Warga Binaan</th>
                    <th className="px-4 py-3.5">Blok / Perkara</th>
                    <th className="px-4 py-3.5">Wali PAS</th>
                    <th className="px-4 py-3.5 text-center">Biometrik Face ID</th>
                    <th className="px-4 py-3.5 text-center">Aktivitas</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-4 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {item.foto_wajah ? (
                            <img
                              src={getAssetUrl(item.foto_wajah)}
                              alt={item.nama}
                              className="h-10 w-10 rounded-xl object-cover border border-emerald-200 shrink-0"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-bold text-sm shrink-0">
                              {item.nama.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900">{item.nama}</p>
                            <p className="text-xs text-slate-500">{item.no_registrasi}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs">
                        <p className="font-semibold text-slate-800">{item.blok_kamar || '-'}</p>
                        <p className="text-slate-500">
                          {item.perkara || '-'} • {item.lama_pidana || '-'}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-medium text-slate-700">
                        {item.wali_pas_nama || '-'}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {item.has_face_id ? (
                          <StatusBadge label="Terdaftar" variant="emerald" icon={ShieldCheck} />
                        ) : (
                          <StatusBadge label="Belum Enroll" variant="amber" />
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center text-xs text-slate-600">
                        <p>
                          <strong>{item.total_penilaian}</strong> nilai • <strong>{item.total_absensi}</strong> absen
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Ekspirasi: {formatDate(item.ekspirasi)}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <StatusBadge
                          label={item.status}
                          variant={item.status === 'aktif' ? 'emerald' : item.status === 'bebas' ? 'blue' : 'slate'}
                        />
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {canEdit && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEnrollCapture(null);
                                  setEnrollModal({ open: true, wbp: item });
                                }}
                                className="rounded-lg p-1.5 text-indigo-600 hover:bg-indigo-50"
                                title="Daftarkan / Perbarui Face ID"
                              >
                                <ScanFace className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openEdit(item)}
                                className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50"
                                title="Edit WBP"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                              title="Hapus WBP"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
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

      {/* Create/Edit WBP Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? 'Edit Data Warga Binaan' : 'Tambah Data Warga Binaan (SDP)'}
        size="xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">No. Registrasi *</label>
              <input
                type="text"
                required
                value={form.no_registrasi}
                onChange={(e) => setForm({ ...form, no_registrasi: e.target.value })}
                placeholder="BI.017/2026/CMS"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap WBP *</label>
              <input
                type="text"
                required
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                placeholder="NAMA BIN AYAH"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">NIK</label>
              <input
                type="text"
                value={form.nik}
                onChange={(e) => setForm({ ...form, nik: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tempat Lahir</label>
              <input
                type="text"
                value={form.tempat_lahir}
                onChange={(e) => setForm({ ...form, tempat_lahir: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Lahir</label>
              <DatePicker
                selected={form.tanggal_lahir}
                onChange={(d) => setForm({ ...form, tanggal_lahir: d })}
                dateFormat="dd/MM/yyyy"
                placeholderText="Pilih tanggal..."
                showYearDropdown
                scrollableYearDropdown
                yearDropdownItemNumber={60}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                portalId="datepicker-portal"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Agama</label>
              <SelectInput
                options={AGAMA_OPTIONS}
                value={form.agama}
                onChange={(v) => setForm({ ...form, agama: v })}
                isClearable={false}
                isSearchable={false}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Blok / Kamar</label>
              <input
                type="text"
                value={form.blok_kamar}
                onChange={(e) => setForm({ ...form, blok_kamar: e.target.value })}
                placeholder="Blok A / Kamar 01"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status Pembinaan</label>
              <SelectInput
                options={STATUS_OPTIONS}
                value={form.status}
                onChange={(v) => setForm({ ...form, status: v })}
                isClearable={false}
                isSearchable={false}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Perkara</label>
              <input
                type="text"
                value={form.perkara}
                onChange={(e) => setForm({ ...form, perkara: e.target.value })}
                placeholder="Pidana Umum / Narkotika..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Lama Pidana</label>
              <input
                type="text"
                value={form.lama_pidana}
                onChange={(e) => setForm({ ...form, lama_pidana: e.target.value })}
                placeholder="2 Tahun 6 Bulan"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Masuk</label>
              <DatePicker
                selected={form.tanggal_masuk}
                onChange={(d) => setForm({ ...form, tanggal_masuk: d })}
                dateFormat="dd/MM/yyyy"
                placeholderText="Pilih tanggal..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                portalId="datepicker-portal"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Ekspirasi</label>
              <DatePicker
                selected={form.ekspirasi}
                onChange={(d) => setForm({ ...form, ekspirasi: d })}
                dateFormat="dd/MM/yyyy"
                placeholderText="Pilih tanggal..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                portalId="datepicker-portal"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Wali PAS Pembina</label>
              <AsyncSelectInput
                loadOptionsFn={loadWaliOptions}
                value={form.wali_pas}
                onChange={(v) => setForm({ ...form, wali_pas: v })}
                placeholder="Cari Wali PAS..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Pas Foto Profil WBP 3x4 (Ditampilkan pada Laporan Profil PDF)
            </label>
            <div className="flex items-center gap-4">
              {form.foto_preview && (
                <img
                  src={form.foto_preview}
                  alt="Preview Foto WBP"
                  className="h-16 w-14 rounded-xl object-cover border border-emerald-200 shrink-0"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setForm({
                    ...form,
                    foto_file: file,
                    foto_preview: file ? URL.createObjectURL(file) : form.foto_preview,
                  });
                }}
                className="block w-full text-xs text-slate-500 file:mr-3 file:rounded-xl file:border-0 file:bg-emerald-50 file:px-3.5 file:py-2 file:text-xs file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100"
              />
            </div>
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
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {form.id ? 'Simpan Perubahan' : 'Simpan Data WBP'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Enroll Face ID Modal */}
      <Modal
        isOpen={enrollModal.open}
        onClose={() => setEnrollModal({ open: false, wbp: null })}
        title={`Pendaftaran Face ID — ${enrollModal.wbp?.nama || ''}`}
        subtitle="Ambil foto referensi wajah untuk verifikasi biometrik otomatis saat absensi WBP"
        size="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setEnrollModal({ open: false, wbp: null })}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleEnrollSubmit}
              disabled={enrolling || !enrollCapture?.file}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {enrolling && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan Data Face ID
            </button>
          </>
        }
      >
        <FaceIdCamera
          mode="enroll"
          subjectName={enrollModal.wbp?.nama || ''}
          onCapture={setEnrollCapture}
        />
      </Modal>
    </div>
  );
}
