import { useCallback, useEffect, useState } from 'react';
import { BookOpenCheck, CheckCircle2, AlertTriangle, Edit3, Loader2, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { request, extractErrorMessage } from '@/utils/request';
import { API_ENDPOINTS } from '@/utils/endpoints';
import { usePagination } from '@/hooks/usePagination';
import { SearchInput } from '@/components/common/SearchInput';
import { DateRangeFilter } from '@/components/common/DateRangeFilter';
import { SelectInput } from '@/components/common/SelectInput';
import { Pagination } from '@/components/common/Pagination';
import { Modal } from '@/components/common/Modal';
import { showConfirmToast } from '@/components/common/ConfirmToast';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { TableSkeleton } from '@/components/common/LoadingSpinner';
import { ErrorState } from '@/components/common/ErrorState';
import { toIsoDate } from '@/utils/formatters';

// [REV0040] Hanya 2 kategori: SPPN atau PPKS (hapus Keduanya)
const KATEGORI_OPTIONS = [
  { value: 'SPPN', label: 'SPPN (Instrumen Utama)' },
  { value: 'PPKS', label: 'PPKS (Kualitatif Komplementer)' },
];

const STATUS_OPTIONS = [
  { value: 'aktif', label: 'Aktif' },
  { value: 'nonaktif', label: 'Nonaktif' },
];

const EMPTY_FORM = {
  id: null,
  kode_program: '',
  nama_program: '',
  kategori: KATEGORI_OPTIONS[0],
  deskripsi: '',
  bobot: 20,
  target_bulanan: 12,
  jadwal: 'Senin - Kamis, 08:30 - 10:00 WIB',
  status: STATUS_OPTIONS[0],
};

export function ProgramsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const { page, limit, pagination, setPagination, handlePageChange, handleLimitChange, resetPage } =
    usePagination(10);

  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [filterKategori, setFilterKategori] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await request.get(API_ENDPOINTS.PROGRAMS.LIST, {
        page,
        limit,
        search,
        startDate: toIsoDate(dateRange.startDate),
        endDate: toIsoDate(dateRange.endDate),
        kategori: filterKategori?.value,
        status: filterStatus?.value,
      });
      setRows(res.data || []);
      setPagination(res.pagination);
    } catch (err) {
      setError(extractErrorMessage(err, 'Gagal memuat data program'));
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, dateRange, filterKategori, filterStatus, setPagination]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // [REV0042] Hitung total bobot aktif
  const totalBobotAktif = rows
    .filter((r) => r.status === 'aktif')
    .reduce((s, p) => s + Number(p.bobot || 0), 0);
  const isBobotValid = totalBobotAktif === 100;

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setForm({
      id: item.id,
      kode_program: item.kode_program || '',
      nama_program: item.nama_program || '',
      kategori: KATEGORI_OPTIONS.find((k) => k.value === item.kategori) || KATEGORI_OPTIONS[0],
      deskripsi: item.deskripsi || '',
      bobot: Number(item.bobot || 0),
      target_bulanan: Number(item.target_bulanan || 10),
      jadwal: item.jadwal || '',
      status: STATUS_OPTIONS.find((s) => s.value === item.status) || STATUS_OPTIONS[0],
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.kode_program.trim() || !form.nama_program.trim()) {
      return toast.error('Kode dan Nama Program wajib diisi');
    }
    setSaving(true);
    try {
      // [REV0044] Lokasi dihapus dari payload
      const payload = {
        kode_program: form.kode_program.trim(),
        nama_program: form.nama_program.trim(),
        kategori: form.kategori?.value || 'SPPN',
        deskripsi: form.deskripsi,
        bobot: Number(form.bobot),
        target_bulanan: Number(form.target_bulanan),
        jadwal: form.jadwal,
        status: form.status?.value || 'aktif',
      };
      if (form.id) {
        await request.put(API_ENDPOINTS.PROGRAMS.DETAIL(form.id), payload);
        toast.success('Program berhasil diperbarui');
      } else {
        await request.post(API_ENDPOINTS.PROGRAMS.LIST, payload);
        toast.success('Program pembinaan baru berhasil ditambahkan');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Gagal menyimpan program'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item) => {
    showConfirmToast({
      title: 'Hapus Program Pembinaan?',
      message: `Hapus program "${item.nama_program}"? Program yang sudah dipakai dalam penilaian tidak dapat dihapus.`,
      onConfirm: async () => {
        try {
          await request.del(API_ENDPOINTS.PROGRAMS.DETAIL(item.id));
          toast.success('Program berhasil dihapus');
          fetchData();
        } catch (err) {
          toast.error(extractErrorMessage(err, 'Gagal menghapus program'));
        }
      },
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Program Pembinaan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Konfigurasi program spiritual, alokasi bobot persentase, dan target pelaksanaan
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* [REV0042] Indikator Validasi Total Bobot 100% */}
          <div
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold border ${
              isBobotValid
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-rose-50 text-rose-800 border-rose-300'
            }`}
          >
            {isBobotValid ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            )}
            <span>Total Bobot: {totalBobotAktif}% {isBobotValid ? '(Tepat 100%)' : '(Wajib 100%)'}</span>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Tambah Program
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs grid gap-3 md:grid-cols-12">
        <div className="md:col-span-4">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              resetPage();
            }}
            placeholder="Cari kode atau nama program..."
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
        <div className="md:col-span-2">
          <SelectInput
            options={KATEGORI_OPTIONS}
            value={filterKategori}
            onChange={(v) => {
              setFilterKategori(v);
              resetPage();
            }}
            placeholder="Kategori (SPPN/PPKS)"
            isSearchable={false}
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
          <TableSkeleton rows={5} cols={6} />
        ) : error ? (
          <div className="p-6">
            <ErrorState message={error} onRetry={fetchData} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState icon={BookOpenCheck} title="Belum ada program pembinaan" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3.5">Program</th>
                    <th className="px-4 py-3.5 text-center">Kategori</th>
                    <th className="px-4 py-3.5 text-center">Bobot</th>
                    <th className="px-4 py-3.5 text-center">Target / Bulan</th>
                    {/* [REV0043] Header Jadwal (Lokasi Dihapus) */}
                    <th className="px-4 py-3.5">Jadwal</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    {isAdmin && <th className="px-4 py-3.5 text-right">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900">{item.nama_program}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{item.kode_program}</p>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-extrabold border ${
                            item.kategori === 'SPPN'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                        >
                          {item.kategori || 'SPPN'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center font-black text-emerald-800">
                        {item.bobot}%
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                        {item.target_bulanan} sesi
                      </td>
                      {/* [REV0043] Kolom Jadwal tanpa lokasi */}
                      <td className="px-4 py-3.5 text-xs text-slate-700 font-medium">
                        {item.jadwal || 'Terjadwal rutin'}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <StatusBadge
                          label={item.status}
                          variant={item.status === 'aktif' ? 'emerald' : 'slate'}
                        />
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(item)}
                              className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50"
                              title="Edit Program"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                              title="Hapus Program"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
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

      {/* [REV0044] Modal Dialog Form (Input Lokasi Dihapus) */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? 'Edit Program Pembinaan Spiritual' : 'Tambah Program Pembinaan Spiritual'}
        subtitle="Alokasikan kategori (SPPN / PPKS) dan bobot penilaian program"
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kode Program *</label>
              <input
                type="text"
                required
                value={form.kode_program}
                onChange={(e) => setForm({ ...form, kode_program: e.target.value })}
                placeholder="Contoh: PRG-TAHSIN"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Program *</label>
              <input
                type="text"
                required
                value={form.nama_program}
                onChange={(e) => setForm({ ...form, nama_program: e.target.value })}
                placeholder="Contoh: Pembelajaran Al-Qur'an & Tahsin"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              {/* [REV0040] Opsi kategori hanya SPPN atau PPKS */}
              <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Instrumen *</label>
              <SelectInput
                options={KATEGORI_OPTIONS}
                value={form.kategori}
                onChange={(v) => setForm({ ...form, kategori: v })}
                isClearable={false}
                isSearchable={false}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bobot Penilaian (%) *</label>
              <input
                type="number"
                min="1"
                max="100"
                required
                value={form.bobot}
                onChange={(e) => setForm({ ...form, bobot: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Sesi / Bulan *</label>
              <input
                type="number"
                min="1"
                max="100"
                required
                value={form.target_bulanan}
                onChange={(e) => setForm({ ...form, target_bulanan: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* [REV0044] Lokasi Dihapus, hanya Jadwal yang ditampilkan */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jadwal Pelaksanaan</label>
              <input
                type="text"
                value={form.jadwal}
                onChange={(e) => setForm({ ...form, jadwal: e.target.value })}
                placeholder="Contoh: Senin - Kamis, 08:30 - 10:00 WIB"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status Keaktifan</label>
              <SelectInput
                options={STATUS_OPTIONS}
                value={form.status}
                onChange={(v) => setForm({ ...form, status: v })}
                isClearable={false}
                isSearchable={false}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi & Ruang Lingkup</label>
            <textarea
              rows={3}
              value={form.deskripsi}
              onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
              placeholder="Deskripsi kegiatan pembinaan..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Menyimpan...' : form.id ? 'Simpan Perubahan' : 'Tambah Program'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
