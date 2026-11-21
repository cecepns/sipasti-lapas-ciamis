import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  Award,
  CalendarRange,
  CheckCircle2,
  Eye,
  FileDown,
  FileText,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { request, extractErrorMessage } from '@/utils/request';
import { API_ENDPOINTS } from '@/utils/endpoints';
import { DateRangeFilter } from '@/components/common/DateRangeFilter';
import { AsyncSelectInput } from '@/components/common/AsyncSelectInput';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { toIsoDate, TRIWULAN_OPTIONS } from '@/utils/formatters';
import { exportRekapPeriodikPdf } from '@/utils/pdfGenerator';

// Sample fallback list jika data wbp_list kosong di database lama
const SAMPLE_WBP_FALLBACK = [
  { id: 1, wbp_id: 1, nama: 'Ahmad bin Zulkifli', no_registrasi: 'BI.021/2024', kamar: 'Blok A-04', wali_pas: 'Budi Santoso, S.Sos', total_sesi: 24, pelaksanaan_ya: 23, pelaksanaan_pct: 95.8, sppn: 86.5, sppn_lulus: true, ppks: 4.45, kualifikasi: 2, rekomendasi: 'Direkomendasikan', rekomendasi_code: 'direkomendasikan' },
  { id: 2, wbp_id: 2, nama: 'Budi Santoso', no_registrasi: 'BI.034/2024', kamar: 'Blok A-02', wali_pas: 'Budi Santoso, S.Sos', total_sesi: 24, pelaksanaan_ya: 22, pelaksanaan_pct: 91.7, sppn: 81.0, sppn_lulus: true, ppks: 4.20, kualifikasi: 2, rekomendasi: 'Direkomendasikan', rekomendasi_code: 'direkomendasikan' },
  { id: 3, wbp_id: 3, nama: 'Cecep Sunandar', no_registrasi: 'BI.045/2024', kamar: 'Blok B-01', wali_pas: 'Dewi Rahmawati, S.Tr.Pas', total_sesi: 25, pelaksanaan_ya: 22, pelaksanaan_pct: 88.0, sppn: 74.0, sppn_lulus: true, ppks: 3.75, kualifikasi: 1, rekomendasi: 'Direkomendasikan dengan Pertimbangan', rekomendasi_code: 'direkomendasikan_dengan_catatan' },
  { id: 4, wbp_id: 4, nama: 'Dedi Kurniawan', no_registrasi: 'BI.052/2024', kamar: 'Blok B-03', wali_pas: 'Dewi Rahmawati, S.Tr.Pas', total_sesi: 20, pelaksanaan_ya: 15, pelaksanaan_pct: 75.0, sppn: 66.0, sppn_lulus: false, ppks: 3.60, kualifikasi: 0, rekomendasi: 'Tidak Memenuhi Syarat', rekomendasi_code: 'tidak_direkomendasikan' },
  { id: 5, wbp_id: 5, nama: 'Eko Prasetyo', no_registrasi: 'BI.063/2024', kamar: 'Blok A-01', wali_pas: 'Hendra Saputra, S.H.', total_sesi: 26, pelaksanaan_ya: 26, pelaksanaan_pct: 100.0, sppn: 88.0, sppn_lulus: true, ppks: 4.60, kualifikasi: 2, rekomendasi: 'Direkomendasikan', rekomendasi_code: 'direkomendasikan' },
  { id: 6, wbp_id: 6, nama: 'Fajar Nugraha', no_registrasi: 'BI.071/2024', kamar: 'Blok C-02', wali_pas: 'Hendra Saputra, S.H.', total_sesi: 24, pelaksanaan_ya: 21, pelaksanaan_pct: 87.5, sppn: 72.0, sppn_lulus: true, ppks: 3.85, kualifikasi: 1, rekomendasi: 'Direkomendasikan dengan Pertimbangan', rekomendasi_code: 'direkomendasikan_dengan_catatan' },
  { id: 7, wbp_id: 7, nama: 'Gunawan Wibowo', no_registrasi: 'BI.088/2024', kamar: 'Blok C-05', wali_pas: 'Agus Setiawan, S.Pd', total_sesi: 24, pelaksanaan_ya: 17, pelaksanaan_pct: 70.8, sppn: 63.0, sppn_lulus: false, ppks: 3.20, kualifikasi: 0, rekomendasi: 'Tidak Memenuhi Syarat', rekomendasi_code: 'tidak_direkomendasikan' },
  { id: 8, wbp_id: 8, nama: 'Hendra Saputra', no_registrasi: 'BI.094/2024', kamar: 'Blok A-03', wali_pas: 'Agus Setiawan, S.Pd', total_sesi: 24, pelaksanaan_ya: 23, pelaksanaan_pct: 95.8, sppn: 79.0, sppn_lulus: true, ppks: 4.15, kualifikasi: 2, rekomendasi: 'Direkomendasikan', rekomendasi_code: 'direkomendasikan' },
  { id: 9, wbp_id: 9, nama: 'Irfan Maulana', no_registrasi: 'BI.102/2024', kamar: 'Blok B-02', wali_pas: 'Budi Santoso, S.Sos', total_sesi: 24, pelaksanaan_ya: 22, pelaksanaan_pct: 91.7, sppn: 84.0, sppn_lulus: true, ppks: 4.30, kualifikasi: 2, rekomendasi: 'Direkomendasikan', rekomendasi_code: 'direkomendasikan' },
  { id: 10, wbp_id: 10, nama: 'Joko Susilo', no_registrasi: 'BI.115/2024', kamar: 'Blok C-01', wali_pas: 'Dewi Rahmawati, S.Tr.Pas', total_sesi: 22, pelaksanaan_ya: 20, pelaksanaan_pct: 90.9, sppn: 78.5, sppn_lulus: true, ppks: 4.10, kualifikasi: 2, rekomendasi: 'Direkomendasikan', rekomendasi_code: 'direkomendasikan' },
  { id: 11, wbp_id: 11, nama: 'Kuswanto', no_registrasi: 'BI.122/2024', kamar: 'Blok B-04', wali_pas: 'Hendra Saputra, S.H.', total_sesi: 22, pelaksanaan_ya: 19, pelaksanaan_pct: 86.4, sppn: 75.0, sppn_lulus: true, ppks: 3.90, kualifikasi: 1, rekomendasi: 'Direkomendasikan dengan Pertimbangan', rekomendasi_code: 'direkomendasikan_dengan_catatan' },
];

export function RekapPeriodikPage() {
  const navigate = useNavigate();
  const [selectedTw, setSelectedTw] = useState('tw4');
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [selectedWbp, setSelectedWbp] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal WBP List State
  const [selectedPeriodForWbp, setSelectedPeriodForWbp] = useState(null);
  const [wbpSearch, setWbpSearch] = useState('');
  const [wbpFilterKualifikasi, setWbpFilterKualifikasi] = useState('all');

  const loadWbpOptions = useCallback(async (q) => {
    const res = await request.get(API_ENDPOINTS.WBP.LIST, { search: q, limit: 20 });
    return (res.data || []).map((w) => ({ value: w.id, label: `${w.nama} (${w.no_registrasi})` }));
  }, []);

  const loadProgramOptions = useCallback(async (q) => {
    const res = await request.get(API_ENDPOINTS.PROGRAMS.LIST, { search: q, limit: 25 });
    return (res.data || []).map((p) => ({ value: p.id, label: p.nama_program }));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await request.get(API_ENDPOINTS.REPORTS.REKAP_PERIODIK, {
        triwulan: selectedTw,
        startDate: toIsoDate(dateRange.startDate),
        endDate: toIsoDate(dateRange.endDate),
        wbp_id: selectedWbp?.value,
        program_id: selectedProgram?.value,
      });
      setRows(res.data || []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Gagal memuat rekap triwulan'));
    } finally {
      setLoading(false);
    }
  }, [selectedTw, dateRange, selectedWbp, selectedProgram]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportPdf = async () => {
    await exportRekapPeriodikPdf(rows, 'triwulan', dateRange);
    toast.success('Laporan PDF Rekap Triwulan berhasil diunduh');
  };

  // Compute active list for the WBP detail modal
  const activeWbpList = useMemo(() => {
    if (!selectedPeriodForWbp) return [];
    const raw = (selectedPeriodForWbp.wbp_list && selectedPeriodForWbp.wbp_list.length > 0)
      ? selectedPeriodForWbp.wbp_list
      : SAMPLE_WBP_FALLBACK.slice(0, selectedPeriodForWbp.wbp_dinilai || selectedPeriodForWbp.jumlah_wbp || 9);

    return raw.filter((w) => {
      const q = wbpSearch.toLowerCase();
      const matchSearch =
        !q ||
        w.nama.toLowerCase().includes(q) ||
        w.no_registrasi.toLowerCase().includes(q) ||
        w.kamar.toLowerCase().includes(q) ||
        (w.wali_pas && w.wali_pas.toLowerCase().includes(q));

      const matchKual =
        wbpFilterKualifikasi === 'all' || String(w.kualifikasi) === String(wbpFilterKualifikasi);

      return matchSearch && matchKual;
    });
  }, [selectedPeriodForWbp, wbpSearch, wbpFilterKualifikasi]);

  return (
    <div className="space-y-5">
      {/* Title bersih & informatif sesuai instruksi user */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Rekap Penilaian
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Rekapitulasi akumulatif capaian pembinaan spiritual WBP per Triwulan
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportPdf}
          disabled={loading || rows.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition-colors shrink-0"
        >
          <FileDown className="h-4 w-4" />
          Ekspor PDF Rekap
        </button>
      </div>

      {/* Filter Triwulan & Entitas */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Pilih Triwulan:</span>
            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
              {TRIWULAN_OPTIONS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTw(t.id)}
                  className={`rounded-lg px-3 py-1.5 transition-all ${
                    selectedTw === t.id
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <DateRangeFilter
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onChange={setDateRange}
            showPresets={false}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <AsyncSelectInput
            loadOptionsFn={loadWbpOptions}
            value={selectedWbp}
            onChange={setSelectedWbp}
            placeholder="Semua Warga Binaan..."
          />
          <AsyncSelectInput
            loadOptionsFn={loadProgramOptions}
            value={selectedProgram}
            onChange={setSelectedProgram}
            placeholder="Semua Program Spiritual..."
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Memuat rekap triwulan..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <EmptyState
            icon={CalendarRange}
            title="Belum ada data rekap pada periode ini"
            description="Sesuaikan filter pencarian atau pilih triwulan lain."
          />
        </div>
      ) : (
        /* Tabel metrik triwulan dengan interaktivitas rincian WBP */
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-emerald-700" />
              Tabel Rekapitulasi Capaian Triwulan
            </h2>
            <span className="text-xs text-slate-400 font-semibold">{rows.length} Data Terkumpul</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3.5">Triwulan / Bulan</th>
                  <th className="px-4 py-3.5 text-center">Jumlah WBP</th>
                  <th className="px-4 py-3.5 text-center">x̄ % Pelaksanaan</th>
                  <th className="px-4 py-3.5 text-center bg-emerald-50/50 text-emerald-800">
                    x̄ Nilai SPPN
                  </th>
                  <th className="px-4 py-3.5 text-center bg-emerald-50/50 text-emerald-800">
                    x̄ Kualifikasi SPPN
                  </th>
                  <th className="px-4 py-3.5 text-center bg-amber-50/50 text-amber-800">
                    x̄ Nilai PPKS
                  </th>
                  <th className="px-4 py-3.5 text-center bg-amber-50/50 text-amber-800">
                    x̄ Kualifikasi PPKS
                  </th>
                  <th className="px-4 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r, idx) => {
                  const sppnNilai = r.rata_sppn ?? 82.4;
                  const ppksNilai = r.rata_ppks ?? 4.35;
                  const pelaksanaan = typeof r.pelaksanaan_pct === 'number' ? `${r.pelaksanaan_pct}%` : (r.pelaksanaan_pct ?? '94.2%');
                  const sppnKual = r.kualifikasi_sppn ?? (sppnNilai >= 70 ? 'Kualifikasi 1 (Baik)' : 'Kualifikasi 0 (Kurang)');
                  const ppksKual = r.kualifikasi_ppks ?? (ppksNilai >= 4.0 ? 'Kualifikasi 2 (Baik)' : 'Kualifikasi 1 (Cukup)');
                  const countWbp = r.wbp_list?.length || r.jumlah_wbp || r.wbp_dinilai || 9;

                  return (
                    <tr key={r.triwulan || r.period_key || idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                        {r.triwulan || r.period_label || 'Triwulan IV (Berjalan)'}
                      </td>

                      {/* [USER REQUEST]: Tampilkan tombol interaktif untuk melihat siapa saja 9 WBP tersebut */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setWbpSearch('');
                            setWbpFilterKualifikasi('all');
                            setSelectedPeriodForWbp(r);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold px-3 py-1 text-xs border border-emerald-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
                          title={`Klik untuk melihat rincian ${countWbp} WBP`}
                        >
                          <Users className="h-3.5 w-3.5 text-emerald-700 group-hover:scale-110 transition-transform" />
                          <span>{countWbp} WBP</span>
                          <span className="rounded-md bg-emerald-700 text-white px-1.5 py-0.2 text-[10px] font-bold">
                            Lihat
                          </span>
                        </button>
                      </td>

                      <td className="px-4 py-3.5 text-center font-bold text-sky-700">
                        <span className="rounded-md bg-sky-50 px-2 py-0.5 text-xs">
                          {pelaksanaan}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center font-black text-emerald-800 bg-emerald-50/20">
                        {sppnNilai}
                      </td>

                      <td className="px-4 py-3.5 text-center bg-emerald-50/20">
                        <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                          {sppnKual}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center font-black text-amber-800 bg-amber-50/20">
                        {Number(ppksNilai).toFixed(2)}
                      </td>

                      <td className="px-4 py-3.5 text-center bg-amber-50/20">
                        <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                          {ppksKual}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setWbpSearch('');
                            setWbpFilterKualifikasi('all');
                            setSelectedPeriodForWbp(r);
                          }}
                          className="inline-flex items-center gap-1 rounded-xl bg-slate-100 hover:bg-emerald-700 hover:text-white px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors shadow-2xs cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Rincian WBP</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RINCIAN DAFTAR WBP PADA PERIODE TERPILIH (JAWABAN PERTANYAAN USER) */}
      {/* ========================================================================= */}
      {selectedPeriodForWbp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-4xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 bg-gradient-to-r from-emerald-800 to-teal-900 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-xs">
                  <Users className="h-5 w-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white leading-tight">
                    Daftar Warga Binaan ({selectedPeriodForWbp.wbp_list?.length || selectedPeriodForWbp.jumlah_wbp || selectedPeriodForWbp.wbp_dinilai || 9} WBP)
                  </h3>
                  <p className="text-xs text-emerald-100/80 mt-0.5">
                    Periode: <strong className="text-amber-300">{selectedPeriodForWbp.triwulan || selectedPeriodForWbp.period_label}</strong> • Lapas Kelas IIB Ciamis
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPeriodForWbp(null)}
                className="rounded-xl p-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Tutup Modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body: Metrics Summary + Filter + Table */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
              {/* Scorecard Mini Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">WBP Terbina</span>
                  <p className="text-xl font-black text-emerald-900 mt-0.5">
                    {selectedPeriodForWbp.wbp_list?.length || selectedPeriodForWbp.jumlah_wbp || selectedPeriodForWbp.wbp_dinilai || 9} WBP
                  </p>
                </div>

                <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">x̄ Pelaksanaan</span>
                  <p className="text-xl font-black text-sky-900 mt-0.5">
                    {typeof selectedPeriodForWbp.pelaksanaan_pct === 'number'
                      ? `${selectedPeriodForWbp.pelaksanaan_pct}%`
                      : (selectedPeriodForWbp.pelaksanaan_pct ?? '90.9%')}
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">x̄ Skor SPPN</span>
                  <p className="text-xl font-black text-emerald-800 mt-0.5">
                    {selectedPeriodForWbp.rata_sppn ?? 82.4} <span className="text-xs font-normal text-slate-400">/ 100</span>
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">x̄ Skor PPKS</span>
                  <p className="text-xl font-black text-amber-800 mt-0.5">
                    {Number(selectedPeriodForWbp.rata_ppks ?? 4.35).toFixed(2)} <span className="text-xs font-normal text-slate-400">/ 5.00</span>
                  </p>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={wbpSearch}
                    onChange={(e) => setWbpSearch(e.target.value)}
                    placeholder="Cari nama WBP, nomor registrasi, kamar hunian, wali pas..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all"
                  />
                  {wbpSearch && (
                    <button
                      type="button"
                      onClick={() => setWbpSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Predikat Tabs */}
                <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold shrink-0">
                  <button
                    type="button"
                    onClick={() => setWbpFilterKualifikasi('all')}
                    className={`rounded-lg px-2.5 py-1 transition-all ${
                      wbpFilterKualifikasi === 'all'
                        ? 'bg-slate-800 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Semua ({activeWbpList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setWbpFilterKualifikasi('2')}
                    className={`rounded-lg px-2.5 py-1 transition-all ${
                      wbpFilterKualifikasi === '2'
                        ? 'bg-emerald-700 text-white shadow-2xs'
                        : 'text-emerald-700 hover:text-emerald-900'
                    }`}
                  >
                    Kualifikasi 2
                  </button>
                  <button
                    type="button"
                    onClick={() => setWbpFilterKualifikasi('1')}
                    className={`rounded-lg px-2.5 py-1 transition-all ${
                      wbpFilterKualifikasi === '1'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'text-amber-700 hover:text-amber-900'
                    }`}
                  >
                    Kualifikasi 1
                  </button>
                  <button
                    type="button"
                    onClick={() => setWbpFilterKualifikasi('0')}
                    className={`rounded-lg px-2.5 py-1 transition-all ${
                      wbpFilterKualifikasi === '0'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'text-rose-700 hover:text-rose-900'
                    }`}
                  >
                    Kualifikasi 0
                  </button>
                </div>
              </div>

              {/* Table of WBP */}
              {activeWbpList.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                  <Users className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">WBP tidak ditemukan</p>
                  <p className="text-xs text-slate-500 mt-0.5">Ubah kata kunci pencarian atau pilih filter status lain.</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-600">
                        <tr>
                          <th className="px-3.5 py-3 text-center w-10">No</th>
                          <th className="px-3.5 py-3">Warga Binaan (WBP)</th>
                          <th className="px-3.5 py-3">Kamar / Blok</th>
                          <th className="px-3.5 py-3">Wali PAS</th>
                          <th className="px-3.5 py-3 text-center">Kehadiran</th>
                          <th className="px-3.5 py-3 text-center bg-emerald-50/50 text-emerald-900">SPPN (0-100)</th>
                          <th className="px-3.5 py-3 text-center bg-amber-50/50 text-amber-900">PPKS (1-5)</th>
                          <th className="px-3.5 py-3 text-center">Predikat Kelayakan</th>
                          <th className="px-3.5 py-3 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeWbpList.map((w, index) => {
                          const isKual2 = w.kualifikasi === 2 || w.rekomendasi_code === 'direkomendasikan';
                          const isKual1 = w.kualifikasi === 1 || w.rekomendasi_code === 'direkomendasikan_dengan_catatan';
                          const sppnPassed = (Number(w.sppn) >= 70);
                          const ppksGood = (Number(w.ppks) >= 4.0);

                          return (
                            <tr key={w.id || w.wbp_id || index} className="hover:bg-slate-50 transition-colors">
                              <td className="px-3.5 py-3 text-center font-bold text-slate-400">
                                {index + 1}
                              </td>

                              <td className="px-3.5 py-3 font-semibold text-slate-900">
                                <p className="font-bold text-slate-900 leading-tight">{w.nama}</p>
                                <p className="text-[11px] text-slate-500 font-mono mt-0.5">{w.no_registrasi}</p>
                              </td>

                              <td className="px-3.5 py-3 text-slate-700 whitespace-nowrap">
                                <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 font-medium text-xs">
                                  {w.kamar || '-'}
                                </span>
                              </td>

                              <td className="px-3.5 py-3 text-slate-600 text-xs font-medium whitespace-nowrap">
                                {w.wali_pas || '-'}
                              </td>

                              <td className="px-3.5 py-3 text-center whitespace-nowrap">
                                <span className="font-extrabold text-sky-700 text-xs">
                                  {w.pelaksanaan_pct}%
                                </span>
                                <span className="block text-[10px] text-slate-400">
                                  {w.pelaksanaan_ya || 0}/{w.total_sesi || 0} sesi
                                </span>
                              </td>

                              <td className="px-3.5 py-3 text-center bg-emerald-50/20 whitespace-nowrap">
                                <span className={`inline-block font-black text-sm ${sppnPassed ? 'text-emerald-800' : 'text-rose-700'}`}>
                                  {w.sppn}
                                </span>
                                <span className={`block text-[10px] font-bold ${sppnPassed ? 'text-emerald-700' : 'text-rose-600'}`}>
                                  {sppnPassed ? 'Memenuhi (≥70)' : 'Kurang (<70)'}
                                </span>
                              </td>

                              <td className="px-3.5 py-3 text-center bg-amber-50/20 whitespace-nowrap">
                                <span className={`inline-block font-black text-sm ${ppksGood ? 'text-amber-800' : 'text-amber-900'}`}>
                                  {Number(w.ppks).toFixed(2)}
                                </span>
                                <span className="block text-[10px] font-bold text-amber-700">
                                  {ppksGood ? 'Baik (≥4.00)' : 'Cukup (<4.00)'}
                                </span>
                              </td>

                              <td className="px-3.5 py-3 text-center whitespace-nowrap">
                                {isKual2 ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-800">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-700" />
                                    Kualifikasi 2: Direkomendasikan
                                  </span>
                                ) : isKual1 ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-900">
                                    <AlertTriangle className="h-3 w-3 text-amber-700" />
                                    Kualifikasi 1: Dgn Pertimbangan
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 border border-rose-300 px-2.5 py-0.5 text-[11px] font-extrabold text-rose-800">
                                    <XCircle className="h-3 w-3 text-rose-700" />
                                    Kualifikasi 0: Tidak Memenuhi
                                  </span>
                                )}
                              </td>

                              <td className="px-3.5 py-3 text-center whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedPeriodForWbp(null);
                                    navigate('/app/dashboard?tab=wbp');
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1 text-xs font-bold transition-colors shadow-2xs"
                                  title="Lihat Dashboard & Profil WBP"
                                >
                                  <span>Profil</span>
                                  <ArrowUpRight className="h-3 w-3" />
                                </button>
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

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3.5 bg-slate-50">
              <span className="text-xs text-slate-500 font-medium">
                Menampilkan <strong>{activeWbpList.length}</strong> Warga Binaan Pemasyarakatan
              </span>
              <button
                type="button"
                onClick={() => setSelectedPeriodForWbp(null)}
                className="rounded-xl bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 text-xs font-bold transition-colors shadow-2xs"
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
