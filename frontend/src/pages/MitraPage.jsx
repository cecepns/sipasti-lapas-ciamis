import { useCallback, useEffect, useState } from 'react';
import { Edit3, Handshake, Loader2, Plus, Trash2 } from 'lucide-react';
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
import { formatDate, toIsoDate } from '@/utils/formatters';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Menunggu Persetujuan' },
  { value: 'disetujui', label: 'Disetujui (Aktifkan Akun Mitra)' },
  { value: 'ditolak', label: 'Ditolak' },
];

const EMPTY_FORM = {
  id: null,
  nama_lengkap: '',
  lembaga_instansi: '',
  bidang_keahlian: '',
  email: '',
  no_hp: '',
  alamat: '',
  status: STATUS_OPTIONS[0],
  catatan_admin: '',
};

export function MitraPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const canCreate = ['admin', 'mitra'].includes(user?.role);

  const { page, limit, pagination, setPagination, handlePageChange, handleLimitChange, resetPage } =
    usePagination(10);

  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
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
      const res = await request.get(API_ENDPOINTS.MITRA.LIST, {
        page,
        limit,
        search,
        startDate: toIsoDate(dateRange.startDate),
        endDate: toIsoDate(dateRange.endDate),
        status: filterStatus?.value,
      });
      setRows(res.data || []);
      setPagination(res.pagination);
    } catch (err) {
      setError(extractErrorMessage(err, 'Gagal memuat data registrasi mitra'));
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, dateRange, filterStatus, setPagination]);

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
      nama_lengkap: item.nama_lengkap || '',
      lembaga_instansi: item.lembaga_instansi || '',
      bidang_keahlian: item.bidang_keahlian || '',
      email: item.email || '',
      no_hp: item.no_hp || '',
      alamat: item.alamat || '',
      status: STATUS_OPTIONS.find((s) => s.value === item.status) || STATUS_OPTIONS[0],
      catatan_admin: item.catatan_admin || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.nama_lengkap || !form.lembaga_instansi || !form.email) {
      return toast.error('Nama, lembaga/instansi, dan email wajib diisi');
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        status: form.status?.value || 'pending',
      };
      if (form.id) {
        await request.put(API_ENDPOINTS.MITRA.DETAIL(form.id), payload);
        toast.success('Data mitra berhasil diperbarui');
      } else {
        await request.post(API_ENDPOINTS.MITRA.LIST, payload);
        toast.success('Registrasi mitra berhasil ditambahkan');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Gagal menyimpan data mitra'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item) => {
    showConfirmToast({
      title: 'Hapus Registrasi Mitra?',
      message: `Hapus data registrasi mitra ${item.nama_lengkap} (${item.lembaga_instansi})?`,
      onConfirm: async () => {
        try {
          await request.del(API_ENDPOINTS.MITRA.DETAIL(item.id));
          toast.success('Data mitra dihapus');
          fetchData();
        } catch (err) {
          toast.error(extractErrorMessage(err, 'Gagal menghapus mitra'));
        }
      },
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Data Mitra</h1>
        {canCreate && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Tambah Mitra
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs grid gap-3 md:grid-cols-12">
        <div className="md:col-span-5">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              resetPage();
            }}
            placeholder="Cari nama mitra, lembaga, bidang keahlian..."
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
        <div className="md:col-span-3">
          <SelectInput
            options={STATUS_OPTIONS}
            value={filterStatus}
            onChange={(v) => {
              setFilterStatus(v);
              resetPage();
            }}
            placeholder="Filter Status"
            isSearchable={false}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : error ? (
          <div className="p-6">
            <ErrorState message={error} onRetry={fetchData} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState icon={Handshake} title="Belum ada data registrasi mitra" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3.5">Mitra & Lembaga</th>
                    <th className="px-4 py-3.5">Bidang Keahlian</th>
                    <th className="px-4 py-3.5">Kontak</th>
                    <th className="px-4 py-3.5">Tanggal Daftar</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    {canCreate && <th className="px-4 py-3.5 text-right">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900">{item.nama_lengkap}</p>
                        <p className="text-xs text-slate-500">{item.lembaga_instansi}</p>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-700">{item.bidang_keahlian}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        <p>{item.email}</p>
                        <p className="text-slate-400">{item.no_hp}</p>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500">{formatDate(item.created_at)}</td>
                      <td className="px-4 py-3.5 text-center">
                        <StatusBadge
                          label={item.status}
                          variant={
                            item.status === 'disetujui'
                              ? 'emerald'
                              : item.status === 'ditolak'
                              ? 'rose'
                              : 'amber'
                          }
                        />
                      </td>
                      {canCreate && (
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(item)}
                              className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50"
                              title="Edit / Verifikasi Mitra"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => handleDelete(item)}
                                className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                                title="Hapus Mitra"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
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

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? 'Edit / Persetujuan Registrasi Mitra' : 'Input Data Mitra Baru'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap *</label>
              <input
                type="text"
                required
                value={form.nama_lengkap}
                onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Lembaga / Instansi *</label>
              <input
                type="text"
                required
                value={form.lembaga_instansi}
                onChange={(e) => setForm({ ...form, lembaga_instansi: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Bidang Keahlian *</label>
            <input
              type="text"
              required
              value={form.bidang_keahlian}
              onChange={(e) => setForm({ ...form, bidang_keahlian: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
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
              <label className="block text-xs font-bold text-slate-700 mb-1">No. HP *</label>
              <input
                type="text"
                required
                value={form.no_hp}
                onChange={(e) => setForm({ ...form, no_hp: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Alamat</label>
            <textarea
              rows={2}
              value={form.alamat}
              onChange={(e) => setForm({ ...form, alamat: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {isAdmin && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status Persetujuan (Disetujui otomatis membuat akun login Mitra)
                </label>
                <SelectInput
                  options={STATUS_OPTIONS}
                  value={form.status}
                  onChange={(v) => setForm({ ...form, status: v })}
                  isClearable={false}
                  isSearchable={false}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Admin</label>
                <textarea
                  rows={2}
                  value={form.catatan_admin}
                  onChange={(e) => setForm({ ...form, catatan_admin: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </>
          )}

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
              Simpan Mitra
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
