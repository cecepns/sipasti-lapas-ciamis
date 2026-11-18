import { useCallback, useEffect, useState } from 'react';
import { Edit3, Loader2, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
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
import { ROLE_LABELS, toIsoDate } from '@/utils/formatters';

const ROLE_OPTIONS = [
  { value: 'wali_pas', label: 'Wali PAS' },
  { value: 'mitra', label: 'Mitra Keagamaan' },
  { value: 'kasubsi', label: 'Kasubsi Reg & Bimkemas' },
  { value: 'kasi_binadik', label: 'Kasi Binadik' },
  { value: 'kalapas', label: 'Ka. Lapas' },
  { value: 'admin', label: 'Admin SIPASTI' },
];

const STATUS_OPTIONS = [
  { value: 'aktif', label: 'Aktif' },
  { value: 'pending', label: 'Pending' },
  { value: 'nonaktif', label: 'Nonaktif' },
];

const EMPTY_FORM = {
  id: null,
  nama: '',
  nip_nik: '',
  email: '',
  password: '',
  role: ROLE_OPTIONS[0],
  instansi: 'Lapas Kelas IIB Ciamis',
  jabatan: 'Wali Pemasyarakatan',
  no_hp: '',
  status: STATUS_OPTIONS[0],
};

export function UsersPage() {
  const { page, limit, pagination, setPagination, handlePageChange, handleLimitChange, resetPage } =
    usePagination(10);

  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [filterRole, setFilterRole] = useState(null);
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
      const res = await request.get(API_ENDPOINTS.USERS.LIST, {
        page,
        limit,
        search,
        startDate: toIsoDate(dateRange.startDate),
        endDate: toIsoDate(dateRange.endDate),
        role: filterRole?.value,
        status: filterStatus?.value,
      });
      setRows(res.data || []);
      setPagination(res.pagination);
    } catch (err) {
      setError(extractErrorMessage(err, 'Gagal memuat data pengguna'));
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, dateRange, filterRole, filterStatus, setPagination]);

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
      nama: item.nama || '',
      nip_nik: item.nip_nik || '',
      email: item.email || '',
      password: '',
      role: ROLE_OPTIONS.find((r) => r.value === item.role) || ROLE_OPTIONS[0],
      instansi: item.instansi || '',
      jabatan: item.jabatan || '',
      no_hp: item.no_hp || '',
      status: STATUS_OPTIONS.find((s) => s.value === item.status) || STATUS_OPTIONS[0],
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.nama.trim() || !form.email.trim()) {
      return toast.error('Nama dan email wajib diisi');
    }
    if (!form.id && form.password && form.password.length < 6) {
      return toast.error('Kata sandi minimal 6 karakter');
    }
    setSaving(true);
    try {
      const payload = {
        nama: form.nama.trim(),
        nip_nik: form.nip_nik,
        email: form.email.trim(),
        role: form.role?.value || 'wali_pas',
        instansi: form.instansi,
        jabatan: form.jabatan,
        no_hp: form.no_hp,
        status: form.status?.value || 'aktif',
      };
      if (form.password) payload.password = form.password;

      if (form.id) {
        await request.put(API_ENDPOINTS.USERS.DETAIL(form.id), payload);
        toast.success('Data pengguna berhasil diperbarui');
      } else {
        await request.post(API_ENDPOINTS.USERS.LIST, payload);
        toast.success('Akun pengguna baru berhasil dibuat');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Gagal menyimpan data pengguna'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item) => {
    showConfirmToast({
      title: 'Hapus Akun Pengguna?',
      message: `Hapus akun ${item.nama} (${ROLE_LABELS[item.role] || item.role})?`,
      onConfirm: async () => {
        try {
          await request.del(API_ENDPOINTS.USERS.DETAIL(item.id));
          toast.success('Akun pengguna dihapus');
          fetchData();
        } catch (err) {
          toast.error(extractErrorMessage(err, 'Gagal menghapus pengguna'));
        }
      },
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Manajemen Akun</h1>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Tambah Akun
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs grid gap-3 md:grid-cols-12">
        <div className="md:col-span-4">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              resetPage();
            }}
            placeholder="Cari nama, NIP/NIK, email, instansi..."
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
            options={ROLE_OPTIONS}
            value={filterRole}
            onChange={(v) => {
              setFilterRole(v);
              resetPage();
            }}
            placeholder="Peran"
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

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : error ? (
          <div className="p-6">
            <ErrorState message={error} onRetry={fetchData} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="Belum ada data pengguna" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3.5">Nama & Email</th>
                    <th className="px-4 py-3.5">NIP / NIK & Instansi</th>
                    <th className="px-4 py-3.5 text-center">Peran</th>
                    <th className="px-4 py-3.5 text-center">Binaan / Penilaian</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-4 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900">{item.nama}</p>
                        <p className="text-xs text-slate-500">{item.email}</p>
                      </td>
                      <td className="px-4 py-3.5 text-xs">
                        <p className="font-semibold text-slate-800">{item.nip_nik || '-'}</p>
                        <p className="text-slate-500">{item.instansi || '-'}</p>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <StatusBadge
                          label={ROLE_LABELS[item.role] || item.role}
                          variant={
                            item.role === 'admin'
                              ? 'purple'
                              : item.role === 'wali_pas'
                              ? 'emerald'
                              : item.role === 'mitra'
                              ? 'amber'
                              : 'blue'
                          }
                        />
                      </td>
                      <td className="px-4 py-3.5 text-center text-xs text-slate-600">
                        <strong>{item.total_wbp_binaan || 0}</strong> WBP •{' '}
                        <strong>{item.total_penilaian || 0}</strong> nilai
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <StatusBadge
                          label={item.status}
                          variant={
                            item.status === 'aktif'
                              ? 'emerald'
                              : item.status === 'pending'
                              ? 'amber'
                              : 'rose'
                          }
                        />
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? 'Edit Akun Pengguna' : 'Tambah Wali PAS / Pengguna Baru'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap *</label>
              <input
                type="text"
                required
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">NIP / NIK</label>
              <input
                type="text"
                value={form.nip_nik}
                onChange={(e) => setForm({ ...form, nip_nik: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kata Sandi {form.id ? '(Kosongkan jika tidak ubah)' : '(Default: sipasti123)'}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Minimal 6 karakter"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Peran / Hak Akses *</label>
              <SelectInput
                options={ROLE_OPTIONS}
                value={form.role}
                onChange={(v) => setForm({ ...form, role: v })}
                isClearable={false}
                isSearchable={false}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status Akun</label>
              <SelectInput
                options={STATUS_OPTIONS}
                value={form.status}
                onChange={(v) => setForm({ ...form, status: v })}
                isClearable={false}
                isSearchable={false}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Instansi</label>
              <input
                type="text"
                value={form.instansi}
                onChange={(e) => setForm({ ...form, instansi: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jabatan</label>
              <input
                type="text"
                value={form.jabatan}
                onChange={(e) => setForm({ ...form, jabatan: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">No. HP</label>
              <input
                type="text"
                value={form.no_hp}
                onChange={(e) => setForm({ ...form, no_hp: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
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
              Simpan Akun
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
