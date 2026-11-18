import { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  Edit3,
  FileDown,
  Loader2,
  Plus,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import { useAuth } from '@/context/AuthContext';
import { request, extractErrorMessage } from '@/utils/request';
import { API_ENDPOINTS } from '@/utils/endpoints';
import { usePagination } from '@/hooks/usePagination';
import { SearchInput } from '@/components/common/SearchInput';
import { DateRangeFilter } from '@/components/common/DateRangeFilter';
import { AsyncSelectInput } from '@/components/common/AsyncSelectInput';
import { SelectInput } from '@/components/common/SelectInput';
import { Pagination } from '@/components/common/Pagination';
import { Modal } from '@/components/common/Modal';
import { showConfirmToast } from '@/components/common/ConfirmToast';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { TableSkeleton } from '@/components/common/LoadingSpinner';
import { ErrorState } from '@/components/common/ErrorState';
import { formatDateTime, toIsoDate } from '@/utils/formatters';
import { exportAssessmentsPdf } from '@/utils/pdfGenerator';

const JENIS_OPTIONS = [
  { value: 'SPPN', label: 'SPPN — Sistem Penilaian Pembinaan Narapidana (Nilai Utama)' },
  { value: 'PPKS', label: 'PPKS — Penilaian Pembinaan Kepribadian Spiritual (Pendukung Monitoring)' },
];

const PELAKSANAAN_OPTIONS = [
  { value: 'Ya', label: 'Ya (Terlaksana)' },
  { value: 'Tidak', label: 'Tidak (Tidak Terlaksana)' },
];

const VERIFIKASI_OPTIONS = [
  { value: 'menunggu', label: 'Menunggu Verifikasi' },
  { value: 'terverifikasi', label: 'Terverifikasi' },
  { value: 'revisi', label: 'Perlu Revisi' },
];

const SCORE_OPTIONS = [
  { value: 5, label: '5 — Sangat Baik (Teladan)' },
  { value: 4, label: '4 — Baik' },
  { value: 3, label: '3 — Cukup' },
  { value: 2, label: '2 — Kurang' },
  { value: 1, label: '1 — Sangat Kurang' },
];

const EMPTY_FORM = {
  id: null,
  tanggal: new Date(),
  wbp: null,
  program: null,
  jenis_penilaian: JENIS_OPTIONS[0],
  pelaksanaan: PELAKSANAAN_OPTIONS[0],
  nilai_karakter: SCORE_OPTIONS[1],
  aspek_ibadah: SCORE_OPTIONS[1],
  aspek_kedisiplinan: SCORE_OPTIONS[1],
  aspek_akhlak: SCORE_OPTIONS[1],
  aspek_partisipasi: SCORE_OPTIONS[1],
  keterangan: '',
  bukti_foto: null,
};

export function AssessmentsPage() {
  const { user } = useAuth();
  const canInput = ['admin', 'wali_pas', 'mitra'].includes(user?.role);
  const canVerify = ['admin', 'kasubsi', 'kasi_binadik'].includes(user?.role);

  const { page, limit, pagination, setPagination, handlePageChange, handleLimitChange, resetPage } =
    usePagination(10);

  // Filters
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [filterWbp, setFilterWbp] = useState(null);
  const [filterProgram, setFilterProgram] = useState(null);
  const [filterJenis, setFilterJenis] = useState(null);
  const [filterPelaksanaan, setFilterPelaksanaan] = useState(null);
  const [filterVerifikasi, setFilterVerifikasi] = useState(null);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Verify Modal (Kasubsi Reg & Bimkemas)
  const [verifyModal, setVerifyModal] = useState({ open: false, item: null, status: VERIFIKASI_OPTIONS[1], catatan: '' });
  const [verifying, setVerifying] = useState(false);

  const loadWbpOptions = useCallback(async (q) => {
    const res = await request.get(API_ENDPOINTS.WBP.LIST, { search: q, limit: 20, status: 'aktif' });
    return (res.data || []).map((w) => ({
      value: w.id,
      label: `${w.nama} (${w.no_registrasi})`,
    }));
  }, []);

  const loadProgramOptions = useCallback(async (q) => {
    const res = await request.get(API_ENDPOINTS.PROGRAMS.LIST, { search: q, limit: 25, status: 'aktif' });
    return (res.data || []).map((p) => ({
      value: p.id,
      label: `${p.nama_program} — Bobot ${p.bobot}%`,
    }));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await request.get(API_ENDPOINTS.ASSESSMENTS.LIST, {
        page,
        limit,
        search,
        startDate: toIsoDate(dateRange.startDate),
        endDate: toIsoDate(dateRange.endDate),
        wbp_id: filterWbp?.value,
        program_id: filterProgram?.value,
        jenis_penilaian: filterJenis?.value,
        pelaksanaan: filterPelaksanaan?.value,
        verifikasi_kasubsi: filterVerifikasi?.value,
      });
      setRows(res.data || []);
      setPagination(res.pagination);
    } catch (err) {
      setError(extractErrorMessage(err, 'Gagal memuat data penilaian'));
    } finally {
      setLoading(false);
    }
  }, [
    page,
    limit,
    search,
    dateRange,
    filterWbp,
    filterProgram,
    filterJenis,
    filterPelaksanaan,
    filterVerifikasi,
    setPagination,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreateModal = (presetJenis = 'SPPN') => {
    const jenisOpt = JENIS_OPTIONS.find((j) => j.value === presetJenis) || JENIS_OPTIONS[0];
    setForm({ ...EMPTY_FORM, tanggal: new Date(), jenis_penilaian: jenisOpt });
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    const findScore = (val) => SCORE_OPTIONS.find((s) => s.value === Number(val)) || SCORE_OPTIONS[1];
    setForm({
      id: item.id,
      tanggal: item.tanggal ? new Date(item.tanggal) : new Date(),
      wbp: { value: item.wbp_id, label: `${item.wbp_nama} (${item.wbp_no_registrasi})` },
      program: { value: item.program_id, label: `${item.nama_program} — Bobot ${item.program_bobot}%` },
      jenis_penilaian: JENIS_OPTIONS.find((j) => j.value === item.jenis_penilaian) || JENIS_OPTIONS[0],
      pelaksanaan: PELAKSANAAN_OPTIONS.find((p) => p.value === item.pelaksanaan) || PELAKSANAAN_OPTIONS[0],
      nilai_karakter: findScore(item.nilai_karakter),
      aspek_ibadah: findScore(item.aspek_ibadah),
      aspek_kedisiplinan: findScore(item.aspek_kedisiplinan),
      aspek_akhlak: findScore(item.aspek_akhlak),
      aspek_partisipasi: findScore(item.aspek_partisipasi),
      keterangan: item.keterangan || '',
      bukti_foto: null,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.wbp) return toast.error('Warga Binaan wajib dipilih');
    if (!form.program) return toast.error('Program Spiritual wajib dipilih');

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('tanggal', form.tanggal ? form.tanggal.toISOString().slice(0, 19).replace('T', ' ') : '');
      fd.append('wbp_id', form.wbp.value);
      fd.append('program_id', form.program.value);
      fd.append('jenis_penilaian', form.jenis_penilaian?.value || 'SPPN');
      fd.append('pelaksanaan', form.pelaksanaan?.value || 'Ya');
      if (form.pelaksanaan?.value === 'Ya') {
        fd.append('nilai_karakter', form.nilai_karakter?.value || 4);
        fd.append('aspek_ibadah', form.aspek_ibadah?.value || 4);
        fd.append('aspek_kedisiplinan', form.aspek_kedisiplinan?.value || 4);
        fd.append('aspek_akhlak', form.aspek_akhlak?.value || 4);
        fd.append('aspek_partisipasi', form.aspek_partisipasi?.value || 4);
      }
      fd.append('keterangan', form.keterangan || '');
      if (form.bukti_foto) {
        fd.append('bukti_foto', form.bukti_foto);
      }

      if (form.id) {
        await request.upload(API_ENDPOINTS.ASSESSMENTS.DETAIL(form.id), fd, 'put');
        toast.success('Data penilaian berhasil diperbarui');
      } else {
        await request.upload(API_ENDPOINTS.ASSESSMENTS.LIST, fd, 'post');
        toast.success(`Penilaian ${form.jenis_penilaian?.value} berhasil disimpan`);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Gagal menyimpan data penilaian'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item) => {
    showConfirmToast({
      title: 'Hapus Catatan Penilaian?',
      message: `Hapus penilaian ${item.jenis_penilaian} untuk ${item.wbp_nama} pada program ${item.nama_program}?`,
      onConfirm: async () => {
        try {
          await request.del(API_ENDPOINTS.ASSESSMENTS.DETAIL(item.id));
          toast.success('Catatan penilaian berhasil dihapus');
          fetchData();
        } catch (err) {
          toast.error(extractErrorMessage(err, 'Gagal menghapus penilaian'));
        }
      },
    });
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!verifyModal.item) return;
    setVerifying(true);
    try {
      await request.patch(API_ENDPOINTS.ASSESSMENTS.VERIFY(verifyModal.item.id), {
        verifikasi_kasubsi: verifyModal.status?.value || 'terverifikasi',
        catatan_verifikasi: verifyModal.catatan,
      });
      toast.success('Status verifikasi Kasubsi berhasil diperbarui');
      setVerifyModal({ open: false, item: null, status: VERIFIKASI_OPTIONS[1], catatan: '' });
      fetchData();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Gagal memverifikasi penilaian'));
    } finally {
      setVerifying(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.REPORTS.EXPORT_DATA, {
        type: 'assessments',
        startDate: toIsoDate(dateRange.startDate),
        endDate: toIsoDate(dateRange.endDate),
        wbp_id: filterWbp?.value,
        program_id: filterProgram?.value,
        jenis_penilaian: filterJenis?.value,
      });
      await exportAssessmentsPdf(res.data || [], {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        jenis_penilaian: filterJenis?.value,
      });
      toast.success('Laporan PDF Penilaian SPPN & PPKS berhasil diunduh');
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Gagal mengunduh PDF'));
    }
  };

  const getVerifBadge = (status) => {
    if (status === 'terverifikasi') return <StatusBadge label="Terverifikasi" variant="emerald" icon={CheckCircle2} />;
    if (status === 'revisi') return <StatusBadge label="Revisi" variant="rose" />;
    return <StatusBadge label="Menunggu" variant="amber" />;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
          Penilaian SPPN & PPKS
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportPdf}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs sm:text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            <FileDown className="h-4 w-4" />
            Unduh PDF
          </button>
          {canInput && (
            <>
              <button
                type="button"
                onClick={() => openCreateModal('SPPN')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Input SPPN
              </button>
              <button
                type="button"
                onClick={() => openCreateModal('PPKS')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-amber-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Input PPKS
              </button>
            </>
          )}
        </div>
      </div>

      {/* Quick Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { val: null, label: 'Semua', style: 'bg-slate-900 text-white' },
          {
            val: 'SPPN',
            label: 'SPPN',
            style: 'bg-emerald-600 text-white shadow-xs',
          },
          {
            val: 'PPKS',
            label: 'PPKS',
            style: 'bg-amber-500 text-white shadow-xs',
          },
        ].map((tab) => {
          const isActive = (filterJenis?.value || null) === tab.val;
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => {
                setFilterJenis(tab.val ? JENIS_OPTIONS.find((j) => j.value === tab.val) : null);
                resetPage();
              }}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                isActive
                  ? tab.style
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
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
              placeholder="Cari WBP, asesor, program, keterangan..."
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
              placeholder="Filter WBP (ketik nama)..."
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AsyncSelectInput
            loadOptionsFn={loadProgramOptions}
            value={filterProgram}
            onChange={(v) => {
              setFilterProgram(v);
              resetPage();
            }}
            placeholder="Filter Program Spiritual..."
          />
          <SelectInput
            options={JENIS_OPTIONS}
            value={filterJenis}
            onChange={(v) => {
              setFilterJenis(v);
              resetPage();
            }}
            placeholder="Semua Jenis (SPPN/PPKS)"
            isSearchable={false}
          />
          <SelectInput
            options={PELAKSANAAN_OPTIONS}
            value={filterPelaksanaan}
            onChange={(v) => {
              setFilterPelaksanaan(v);
              resetPage();
            }}
            placeholder="Pelaksanaan (Ya/Tidak)"
            isSearchable={false}
          />
          <SelectInput
            options={VERIFIKASI_OPTIONS}
            value={filterVerifikasi}
            onChange={(v) => {
              setFilterVerifikasi(v);
              resetPage();
            }}
            placeholder="Status Verifikasi Kasubsi"
            isSearchable={false}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} cols={8} />
        ) : error ? (
          <div className="p-6">
            <ErrorState message={error} onRetry={fetchData} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="Belum ada catatan penilaian"
            description="Belum ada data penilaian SPPN/PPKS yang sesuai filter. Klik tombol Input Nilai untuk menambahkan."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3.5">Tanggal</th>
                    <th className="px-4 py-3.5">Warga Binaan</th>
                    <th className="px-4 py-3.5">Program & Jenis</th>
                    <th className="px-4 py-3.5">Asesor</th>
                    <th className="px-4 py-3.5 text-center">Pelaksanaan</th>
                    <th className="px-4 py-3.5 text-center">Karakter / Skor</th>
                    <th className="px-4 py-3.5">Keterangan</th>
                    <th className="px-4 py-3.5 text-center">Kasubsi</th>
                    <th className="px-4 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((item) => {
                    const canModifyRow =
                      user?.role === 'admin' || (canInput && item.asesor_id === user?.id);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                          {formatDateTime(item.tanggal)}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-slate-900 text-xs sm:text-sm">{item.wbp_nama}</p>
                          <p className="text-[11px] text-slate-500">{item.wbp_no_registrasi}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-slate-800 text-xs">{item.nama_program}</p>
                          <div className="mt-1">
                            <StatusBadge
                              label={item.jenis_penilaian}
                              variant={item.jenis_penilaian === 'SPPN' ? 'emerald' : 'amber'}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-700">{item.asesor_nama}</td>
                        <td className="px-4 py-3.5 text-center">
                          <StatusBadge
                            label={item.pelaksanaan}
                            variant={item.pelaksanaan === 'Ya' ? 'blue' : 'rose'}
                          />
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="block font-extrabold text-slate-900">{item.skor_akhir}</span>
                          <span className="text-[11px] text-amber-600 font-semibold">
                            Karakter: {item.nilai_karakter ?? '-'} / 5
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-600 max-w-[200px]">
                          <p className="line-clamp-2">{item.keterangan || '-'}</p>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {getVerifBadge(item.verifikasi_kasubsi)}
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            {canVerify && (
                              <button
                                type="button"
                                onClick={() =>
                                  setVerifyModal({
                                    open: true,
                                    item,
                                    status:
                                      VERIFIKASI_OPTIONS.find((v) => v.value === item.verifikasi_kasubsi) ||
                                      VERIFIKASI_OPTIONS[1],
                                    catatan: item.catatan_verifikasi || '',
                                  })
                                }
                                className="rounded-lg p-1.5 text-sky-600 hover:bg-sky-50"
                                title="Verifikasi Kasubsi"
                              >
                                <ShieldCheck className="h-4 w-4" />
                              </button>
                            )}
                            {canModifyRow && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openEditModal(item)}
                                  className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50"
                                  title="Edit Penilaian"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(item)}
                                  className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                                  title="Hapus Penilaian"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
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

      {/* Create / Edit Assessment Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? 'Edit Penilaian SPPN / PPKS' : 'Input Penilaian SPPN / PPKS Baru'}
        subtitle="Catat pelaksanaan kegiatan spiritual & skor karakter Warga Binaan Pemasyarakatan"
        size="xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tanggal & Waktu Pelaksanaan *
              </label>
              <DatePicker
                selected={form.tanggal}
                onChange={(d) => setForm({ ...form, tanggal: d })}
                showTimeSelect
                dateFormat="dd/MM/yyyy HH:mm"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                portalId="datepicker-portal"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Jenis Instrumen Penilaian *
              </label>
              <SelectInput
                options={JENIS_OPTIONS}
                value={form.jenis_penilaian}
                onChange={(v) => setForm({ ...form, jenis_penilaian: v })}
                isClearable={false}
                isSearchable={false}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Warga Binaan (WBP) *
              </label>
              <AsyncSelectInput
                loadOptionsFn={loadWbpOptions}
                value={form.wbp}
                onChange={(v) => setForm({ ...form, wbp: v })}
                placeholder="Ketik nama atau no. reg WBP..."
                isClearable={false}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Program Pembinaan Spiritual *
              </label>
              <AsyncSelectInput
                loadOptionsFn={loadProgramOptions}
                value={form.program}
                onChange={(v) => setForm({ ...form, program: v })}
                placeholder="Pilih program..."
                isClearable={false}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Pelaksanaan Kegiatan *
            </label>
            <SelectInput
              options={PELAKSANAAN_OPTIONS}
              value={form.pelaksanaan}
              onChange={(v) => setForm({ ...form, pelaksanaan: v })}
              isClearable={false}
              isSearchable={false}
            />
          </div>

          {form.pelaksanaan?.value === 'Ya' && (
            <div className="rounded-2xl bg-emerald-50/60 border border-emerald-100 p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Rubrik Skor Penilaian (Skala 1 – 5)
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Penilaian Karakter Utama *
                </label>
                <SelectInput
                  options={SCORE_OPTIONS}
                  value={form.nilai_karakter}
                  onChange={(v) => setForm({ ...form, nilai_karakter: v })}
                  isClearable={false}
                  isSearchable={false}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { key: 'aspek_ibadah', label: 'Aspek Kesadaran Ibadah' },
                  { key: 'aspek_kedisiplinan', label: 'Aspek Kedisiplinan Waktu' },
                  { key: 'aspek_akhlak', label: 'Aspek Akhlak & Sikap' },
                  { key: 'aspek_partisipasi', label: 'Aspek Partisipasi Aktif' },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {f.label}
                    </label>
                    <SelectInput
                      options={SCORE_OPTIONS}
                      value={form[f.key]}
                      onChange={(v) => setForm({ ...form, [f.key]: v })}
                      isClearable={false}
                      isSearchable={false}
                      compact
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Keterangan Kegiatan / Catatan Observasi
            </label>
            <textarea
              rows={3}
              value={form.keterangan}
              onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
              placeholder="Contoh: Al-Baqarah 22-35 tartil & tepat waktu, atau alasan tidak hadir (Sakit/Besuk)..."
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Bukti Foto Kegiatan (Opsional, JPG/PNG maks 5MB)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setForm({ ...form, bukti_foto: e.target.files?.[0] || null })}
              className="block w-full text-xs text-slate-500 file:mr-3 file:rounded-xl file:border-0 file:bg-emerald-50 file:px-3.5 file:py-2 file:text-xs file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
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
              {saving ? 'Menyimpan...' : form.id ? 'Simpan Perubahan' : 'Simpan Penilaian'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Kasubsi Verification Modal */}
      <Modal
        isOpen={verifyModal.open}
        onClose={() => setVerifyModal({ ...verifyModal, open: false })}
        title="Verifikasi Respon Penilaian (Kasubsi Reg & Bimkemas)"
        subtitle={verifyModal.item ? `${verifyModal.item.wbp_nama} — ${verifyModal.item.nama_program}` : ''}
        size="md"
      >
        <form onSubmit={handleVerifySubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Status Verifikasi</label>
            <SelectInput
              options={VERIFIKASI_OPTIONS}
              value={verifyModal.status}
              onChange={(v) => setVerifyModal({ ...verifyModal, status: v })}
              isClearable={false}
              isSearchable={false}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Catatan Verifikasi</label>
            <textarea
              rows={3}
              value={verifyModal.catatan}
              onChange={(e) => setVerifyModal({ ...verifyModal, catatan: e.target.value })}
              placeholder="Tambahkan catatan verifikasi atau instruksi revisi..."
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setVerifyModal({ ...verifyModal, open: false })}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={verifying}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {verifying && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan Verifikasi
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
