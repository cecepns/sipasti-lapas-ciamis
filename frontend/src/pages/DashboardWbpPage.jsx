import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileDown,
  Filter,
  Layers,
  Minus,
  PlusCircle,
  ScanFace,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { request, extractErrorMessage } from '@/utils/request';
import { API_ENDPOINTS } from '@/utils/endpoints';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorState } from '@/components/common/ErrorState';
import { SelectInput } from '@/components/common/SelectInput';
import { Modal } from '@/components/common/Modal';
import {
  formatDate,
  formatNumber,
  TRIWULAN_OPTIONS,
  TIPE_ASESOR_OPTIONS,
  ROLE_LABELS,
} from '@/utils/formatters';
import { exportWbpProfilePdf } from '@/utils/pdfGenerator';
import { getAssetUrl } from '@/utils/api';

export function DashboardWbpPage() {
  const { user } = useAuth();

  // Filter Bar Global State (Sesuai Wireframe Image 2: Dasbor WBP)
  const [selectedTw, setSelectedTw] = useState(TRIWULAN_OPTIONS[0]);
  const [selectedBulan, setSelectedBulan] = useState('Semua Bulan');
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedAsesor, setSelectedAsesor] = useState(TIPE_ASESOR_OPTIONS[0]);
  const [selectedWbp, setSelectedWbp] = useState(null);

  // Lists & Data State
  const [wbpOptions, setWbpOptions] = useState([]);
  const [programsList, setProgramsList] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  // Profile Modal State (untuk rincian riwayat asesmen WBP)
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileDetails, setProfileDetails] = useState(null);

  // Fetch Program Options
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const res = await request.get(API_ENDPOINTS.PROGRAMS.LIST, { status: 'aktif' });
        const opts = (res.data || []).map((p) => ({
          value: p.id,
          label: `${p.nama_program} (${p.bobot}%)`,
        }));
        setProgramsList([{ value: 'all', label: 'Semua Program' }, ...opts]);
      } catch {
        setProgramsList([
          { value: 'all', label: 'Semua Program' },
          { value: 1, label: 'Pembelajaran Al-Quran (30%)' },
          { value: 2, label: 'Sholat Fardhu Berjamaah (25%)' },
          { value: 3, label: 'Kajian Fiqih & Ibadah (20%)' },
          { value: 4, label: 'Bimbingan Konseling Rohani (15%)' },
          { value: 5, label: 'Peringatan Hari Besar Islam (10%)' },
        ]);
      }
    };
    fetchPrograms();
  }, []);

  // Fetch Dashboard Data from Backend
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await request.get(API_ENDPOINTS.DASHBOARD.WBP, {
        triwulan: selectedTw.key,
        bulan: selectedBulan,
        program_id: selectedProgram?.value !== 'all' ? selectedProgram?.value : undefined,
        tipe_asesor: selectedAsesor?.value !== 'all' ? selectedAsesor?.value : undefined,
        wbp_id: selectedWbp?.value || undefined,
      });

      const opts = res.wbp_options || [];
      setWbpOptions(opts);

      // Default select first WBP if none selected
      if (!selectedWbp && opts.length > 0) {
        setSelectedWbp(opts[0]);
      }

      setDashboardData(res.selected_wbp_dashboard);
    } catch (err) {
      setError(extractErrorMessage(err, 'Gagal memuat Dasbor WBP'));
    } finally {
      setLoading(false);
    }
  }, [selectedTw, selectedBulan, selectedProgram, selectedAsesor, selectedWbp]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open Full Profile Modal
  const openProfileModal = async (wbpId) => {
    if (!wbpId) return;
    setProfileModalOpen(true);
    setProfileLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.WBP.DETAIL(wbpId));
      setProfileDetails(res.data);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Gagal memuat profil WBP'));
      setProfileModalOpen(false);
    } finally {
      setProfileLoading(false);
    }
  };

  // Export PDF
  const handleExportPdf = async () => {
    if (!dashboardData) return;
    setExporting(true);
    try {
      const res = await request.get(API_ENDPOINTS.WBP.DETAIL(dashboardData.identitas?.id || 1));
      await exportWbpProfilePdf(res.data || dashboardData.identitas);
      toast.success(`Rapor Evaluasi WBP ${dashboardData.identitas?.nama || ''} berhasil diekspor`);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Gagal mengekspor PDF WBP'));
    } finally {
      setExporting(false);
    }
  };

  // Data Fallbacks strictly matching Wireframe Image 2
  const d = dashboardData || {
    identitas: {
      id: 1,
      nama: 'Ahmad bin Zulkifli',
      no_registrasi: 'REG-2026-0041',
      blok_kamar: 'Blok B-04',
      wali_pas_nama: 'Hendra Setiawan, S.H.',
      mitra_nama: 'Kemenag Ciamis',
      foto_wajah: null,
    },
    kualifikasi: {
      kualifikasi_akhir: 2,
      predikat_label: 'Kualifikasi 2: Memenuhi Syarat & Direkomendasikan',
      deskripsi:
        'Nilai telah memenuhi seluruh standar penilaian dan pengajuan berhak mendapatkan rekomendasi.',
      status_tren: 'Meningkat (+4.2% vs TW-III)',
    },
    sppn: {
      nilai: 84.5,
      predikat: 'Kualifikasi 1 (Memenuhi Syarat)',
      tren: '+4.5% vs Kuartal Sebelumnya',
    },
    ppks: {
      nilai: 4.35,
      predikat: 'Kualifikasi 2 (Sangat Baik)',
      tren: '+0.18 vs Kuartal Sebelumnya',
    },
    sppn_threshold: {
      nilai: 84.5,
      threshold: 70,
      pct_achieved: 120.7,
    },
    ppks_threshold: {
      nilai: 4.35,
      threshold: 4.0,
      pct_achieved: 108.8,
    },
    pelaksanaan_line: [
      { minggu: 'Mg 1', tw_berjalan: 92, tw_sebelumnya: 84 },
      { minggu: 'Mg 2', tw_berjalan: 95, tw_sebelumnya: 85 },
      { minggu: 'Mg 3', tw_berjalan: 94, tw_sebelumnya: 88 },
      { minggu: 'Mg 4', tw_berjalan: 96, tw_sebelumnya: 86 },
      { minggu: 'Mg 5', tw_berjalan: 95, tw_sebelumnya: 89 },
      { minggu: 'Mg 6', tw_berjalan: 98, tw_sebelumnya: 90 },
    ],
    distribusi_pelaksanaan: [
      { name: 'Pelaksanaan 1 (Hadir)', value: 38, pct: 95.0, color: '#10b981' },
      { name: 'Pelaksanaan 0 (Absen)', value: 2, pct: 5.0, color: '#ef4444' },
    ],
    sppn_benchmark: [
      { label: 'SPPN WBP', value: 84.5, fill: '#10b981' },
      { label: 'All-WBP (Lapas)', value: 82.4, fill: '#64748b' },
    ],
    ppks_benchmark: [
      { label: 'PPKS WBP', value: 4.35, fill: '#f59e0b' },
      { label: 'All-WBP (Lapas)', value: 4.12, fill: '#64748b' },
    ],
    tabel_program_pivot: [
      {
        program: 'Pembelajaran Al-Quran & Tahsin',
        bulan1: 12,
        bulan2: 12,
        bulan3: 11,
        count: 35,
        avg_pelaksanaan: '97.2%',
      },
      {
        program: 'Sholat Fardhu Berjamaah',
        bulan1: 15,
        bulan2: 16,
        bulan3: 15,
        count: 46,
        avg_pelaksanaan: '95.8%',
      },
      {
        program: 'Kajian Fiqih & Ibadah',
        bulan1: 8,
        bulan2: 8,
        bulan3: 7,
        count: 23,
        avg_pelaksanaan: '95.8%',
      },
      {
        program: 'Bimbingan Konseling Rohani',
        bulan1: 6,
        bulan2: 6,
        bulan3: 6,
        count: 18,
        avg_pelaksanaan: '100.0%',
      },
      {
        program: 'Peringatan Hari Besar Islam',
        bulan1: 2,
        bulan2: 3,
        bulan3: 3,
        count: 8,
        avg_pelaksanaan: '100.0%',
      },
    ],
    tabel_ppks_pivot: [
      {
        dimensi: '1. Kesadaran & Praktik Ibadah',
        bulan1: 4.4,
        bulan2: 4.5,
        bulan3: 4.6,
        avg_nilai: 4.5,
        status: 'Baik (≥4.0)',
      },
      {
        dimensi: '2. Pemahaman Nilai Keagamaan',
        bulan1: 4.2,
        bulan2: 4.3,
        bulan3: 4.4,
        avg_nilai: 4.3,
        status: 'Baik (≥4.0)',
      },
      {
        dimensi: '3. Kedisiplinan Waktu & Aturan',
        bulan1: 4.1,
        bulan2: 4.2,
        bulan3: 4.3,
        avg_nilai: 4.2,
        status: 'Baik (≥4.0)',
      },
      {
        dimensi: '4. Perilaku Keseharian & Akhlak',
        bulan1: 4.3,
        bulan2: 4.4,
        bulan3: 4.5,
        avg_nilai: 4.4,
        status: 'Baik (≥4.0)',
      },
      {
        dimensi: '5. Hubungan Sosial & Toleransi',
        bulan1: 4.2,
        bulan2: 4.3,
        bulan3: 4.4,
        avg_nilai: 4.3,
        status: 'Baik (≥4.0)',
      },
    ],
  };

  const isKualifikasi2 = d.kualifikasi?.kualifikasi_akhir === 2;
  const isKualifikasi1 = d.kualifikasi?.kualifikasi_akhir === 1;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Institutional Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-850 via-teal-850 to-slate-900 px-6 py-6 sm:px-8 sm:py-7 text-white shadow-xl shadow-emerald-950/20 border border-emerald-700/30">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="flex items-center gap-2.5 shrink-0">
              <img
                src="/logo-kemenas.png"
                alt="Logo Kementerian"
                className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-contain bg-white p-1.5 shadow-md border border-white/20"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md border border-white/10 text-emerald-100">
                <span>Lapas Kelas IIB Ciamis</span>
                <span className="h-1 w-1 rounded-full bg-emerald-400" />
                <span>{ROLE_LABELS[user?.role] || 'Petugas'}</span>
              </div>
              <h1 className="mt-1.5 text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
                Dasbor WBP
              </h1>
              <p className="mt-1 max-w-2xl text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
                Konteks peserta, posisi capaian program, eligibilitas rekomendasi, serta diagnosa
                performa individual WBP.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {['admin', 'wali_pas', 'mitra'].includes(user?.role) && (
              <Link
                to="/app/penilaian"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-950 shadow-md hover:bg-amber-300 transition-colors"
              >
                <PlusCircle className="h-4 w-4" />
                Input Penilaian
              </Link>
            )}
            <button
              type="button"
              onClick={() => openProfileModal(d.identitas?.id)}
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 border border-white/20 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-white/25 transition-colors"
            >
              <Eye className="h-4 w-4" />
              Detail WBP
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={exporting || loading}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-emerald-850 shadow-sm hover:bg-emerald-50 disabled:opacity-50 transition-colors"
            >
              <FileDown className="h-4 w-4" />
              {exporting ? 'Menyiapkan...' : 'Ekspor Rapor WBP'}
            </button>
          </div>
        </div>
      </div>

      {/* Segmented Switcher Tabs between Dashboards */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 w-fit max-w-full overflow-x-auto">
        <Link
          to="/app/dasbor-umum"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all whitespace-nowrap"
        >
          <Layers className="h-4 w-4 text-slate-500" />
          <span>Dasbor Umum</span>
        </Link>
        <Link
          to="/app/dasbor-wbp"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-emerald-800 bg-white shadow-xs border border-slate-200/60 whitespace-nowrap"
        >
          <Award className="h-4 w-4 text-emerald-600" />
          <span>Dasbor WBP</span>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
            Aktif
          </span>
        </Link>
        <Link
          to="/app/dasbor-program"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all whitespace-nowrap"
        >
          <BookOpen className="h-4 w-4 text-slate-500" />
          <span>Dasbor Program</span>
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* FILTER BAR GLOBAL (Sesuai Wireframe Image 2: Pilih WBP, Triwulan, Program, Tipe Asesor, > Pilih Bulan) */}
      {/* ========================================================================= */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-emerald-700" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Filter Bar Global
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            Secara triwulan, tanpa date range acak. Filter waktu terkunci dalam rentang triwulan.
          </span>
        </div>

        {/* Row 1: Pilih WBP, Pilih Triwulan, Pilih Program, Pilih Tipe Asesor */}
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Pilih WBP */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Pilih WBP</label>
            <SelectInput
              options={wbpOptions}
              value={selectedWbp}
              onChange={setSelectedWbp}
              placeholder="Pilih WBP aktif / binaan..."
              isSearchable
            />
          </div>

          {/* Pilih Triwulan (Pills) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Pilih Triwulan</label>
            <div className="grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200/80">
              {TRIWULAN_OPTIONS.map((tw) => (
                <button
                  key={tw.key}
                  type="button"
                  onClick={() => {
                    setSelectedTw(tw);
                    setSelectedBulan('Semua Bulan');
                  }}
                  className={`rounded-lg py-1.5 text-center text-xs font-bold transition-all ${
                    selectedTw.key === tw.key
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {tw.label.slice(0, 5)}
                </button>
              ))}
            </div>
          </div>

          {/* Pilih Program */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Pilih Program</label>
            <SelectInput
              options={programsList}
              value={selectedProgram}
              onChange={setSelectedProgram}
              placeholder="Semua Program..."
              isSearchable={false}
            />
          </div>

          {/* Pilih Tipe Asesor */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Pilih Tipe Asesor</label>
            <SelectInput
              options={TIPE_ASESOR_OPTIONS}
              value={selectedAsesor}
              onChange={setSelectedAsesor}
              placeholder="Pilih Tipe Asesor..."
              isSearchable={false}
            />
          </div>
        </div>

        {/* Sub-filter: > Pilih Bulan (Rentang Triwulan) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 mr-1">
            <Calendar className="h-3.5 w-3.5 text-emerald-600" />
            &gt; Pilih Bulan:
          </span>
          <button
            type="button"
            onClick={() => setSelectedBulan('Semua Bulan')}
            className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
              selectedBulan === 'Semua Bulan'
                ? 'bg-emerald-850 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Bulan ({selectedTw.label})
          </button>
          {selectedTw.months.map((m, idx) => (
            <button
              key={m}
              type="button"
              onClick={() => setSelectedBulan(m)}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                selectedBulan === m
                  ? 'bg-emerald-850 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Bulan {idx + 1} ({m})
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Memuat Dasbor WBP..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : (
        <>
          {/* ========================================================================= */}
          {/* BAGIAN UTAMA (Konteks Peserta dan Posisi - 6 Cards Berdasarkan Wireframe Image 2) */}
          {/* ========================================================================= */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <div>
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <User className="h-4 w-4 text-emerald-700" />
                  Bagian Utama — Konteks Peserta dan Posisi
                </h2>
                <p className="text-xs text-slate-500">
                  Goals: Memberikan gambaran siapa WBP, di mana posisi dan capaian dalam programnya, serta eligibilitas kualifikasi rekomendasi.
                </p>
              </div>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                {selectedTw.label} • {selectedBulan}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
              {/* Card 1: Identitas WBP */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Identitas WBP
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200">
                      {d.identitas?.foto_wajah ? (
                        <img
                          src={getAssetUrl(d.identitas.foto_wajah)}
                          alt={d.identitas.nama}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-6 w-6 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-extrabold text-slate-900 text-sm truncate" title={d.identitas?.nama}>
                        {d.identitas?.nama}
                      </h3>
                      <p className="text-xs font-mono font-bold text-slate-500 truncate">
                        {d.identitas?.no_registrasi}
                      </p>
                      <span className="inline-block mt-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                        {d.identitas?.blok_kamar || 'Kamar -'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1 text-[11px]">
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-400">Walipas:</span>
                    <span className="font-semibold truncate max-w-[110px]" title={d.identitas?.wali_pas_nama}>
                      {d.identitas?.wali_pas_nama}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-400">Mitra:</span>
                    <span className="font-semibold truncate max-w-[110px]" title={d.identitas?.mitra_nama}>
                      {d.identitas?.mitra_nama}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Kualifikasi */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Kualifikasi
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-extrabold ${
                        isKualifikasi2
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : isKualifikasi1
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {isKualifikasi2 ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                      Kualifikasi {d.kualifikasi?.kualifikasi_akhir}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-bold text-slate-900 leading-snug">
                    {d.kualifikasi?.predikat_label}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">
                    {d.kualifikasi?.deskripsi}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Status Tren:</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <ArrowUpRight className="h-3 w-3" />
                    {d.kualifikasi?.status_tren}
                  </span>
                </div>
              </div>

              {/* Card 3: SPPN */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      SPPN (0-100)
                    </span>
                    <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                      Utama
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-900">
                      {formatNumber(d.sppn?.nilai, 1)}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">/ 100</span>
                  </div>
                  <div className="mt-1">
                    <span
                      className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded ${
                        Number(d.sppn?.nilai) >= 70
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {d.sppn?.predikat}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] flex items-center justify-between text-slate-500">
                  <span>v. TW Sebelumnya:</span>
                  <span className="font-bold text-emerald-700">{d.sppn?.tren}</span>
                </div>
              </div>

              {/* Card 4: PPKS */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      PPKS (1-5)
                    </span>
                    <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                      Karakter
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-900">
                      {formatNumber(d.ppks?.nilai, 2)}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">/ 5.00</span>
                  </div>
                  <div className="mt-1">
                    <span
                      className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded ${
                        Number(d.ppks?.nilai) >= 4.0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {d.ppks?.predikat}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] flex items-center justify-between text-slate-500">
                  <span>v. TW Sebelumnya:</span>
                  <span className="font-bold text-emerald-700">{d.ppks?.tren}</span>
                </div>
              </div>

              {/* Card 5: SPPN vs Treshold (Progress Bar) */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      SPPN vs Threshold
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">Ambang: 70</span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-lg font-black text-slate-900">
                      {formatNumber(d.sppn_threshold?.nilai, 1)}
                    </span>
                    <span className="text-xs font-bold text-emerald-700">
                      {d.sppn_threshold?.pct_achieved}% Target
                    </span>
                  </div>

                  {/* Progress Bar with 70 Threshold indicator */}
                  <div className="mt-2 relative">
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          Number(d.sppn_threshold?.nilai) >= 70 ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, (Number(d.sppn_threshold?.nilai) / 100) * 100)}%` }}
                      />
                    </div>
                    {/* Marker line at 70% */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-slate-900 z-10"
                      style={{ left: '70%' }}
                      title="Threshold: 70"
                    />
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-600">
                  {Number(d.sppn_threshold?.nilai) >= 70 ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Melampaui Ambang Batas (+{(Number(d.sppn_threshold?.nilai) - 70).toFixed(1)})
                    </span>
                  ) : (
                    <span className="text-rose-700 font-bold flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      Di Bawah Ambang (-{(70 - Number(d.sppn_threshold?.nilai)).toFixed(1)})
                    </span>
                  )}
                </div>
              </div>

              {/* Card 6: PPKS vs Treshold (Progress Bar) */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      PPKS vs Threshold
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">Ambang: 4.00</span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-lg font-black text-slate-900">
                      {formatNumber(d.ppks_threshold?.nilai, 2)}
                    </span>
                    <span className="text-xs font-bold text-emerald-700">
                      {d.ppks_threshold?.pct_achieved}% Target
                    </span>
                  </div>

                  {/* Progress Bar with 4.00 / 5.00 (80%) indicator */}
                  <div className="mt-2 relative">
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          Number(d.ppks_threshold?.nilai) >= 4.0 ? 'bg-amber-500' : 'bg-slate-400'
                        }`}
                        style={{
                          width: `${Math.min(100, (Number(d.ppks_threshold?.nilai) / 5.0) * 100)}%`,
                        }}
                      />
                    </div>
                    {/* Marker line at 80% (which represents 4.00 on 1-5 scale) */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-slate-900 z-10"
                      style={{ left: '80%' }}
                      title="Threshold: 4.00"
                    />
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-600">
                  {Number(d.ppks_threshold?.nilai) >= 4.0 ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Melampaui Ambang (+{(Number(d.ppks_threshold?.nilai) - 4.0).toFixed(2)})
                    </span>
                  ) : (
                    <span className="text-amber-700 font-bold flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Di Bawah Ambang (-{(4.0 - Number(d.ppks_threshold?.nilai)).toFixed(2)})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BAGIAN SEKUNDER (Keseimbangan dalam Program & Arah Pembinaan - 4 Charts)   */}
          {/* ========================================================================= */}
          <div className="space-y-3 pt-2">
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-700" />
                Bagian Sekunder — Keseimbangan dalam Program dan Arah Pembinaan
              </h2>
              <p className="text-xs text-slate-500">
                Goals: Menunjukkan di mana kekuatan dan kekurangan WBP di semua program dan sepanjang triwulan, dan bagaimana performanya bergerak.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-4">
              {/* Chart 1: Pelaksanaan/Aktivitas (Line Chart) */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                      Pelaksanaan/Aktivitas
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      TW Berjalan vs Komparasi TW Sebelumnya
                    </p>
                  </div>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={d.pelaksanaan_line} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="minggu" tick={{ fontSize: 11 }} />
                      <YAxis domain={[70, 100]} tick={{ fontSize: 11 }} unit="%" />
                      <Tooltip formatter={(v) => [`${v}%`, '']} />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                      <Line
                        type="monotone"
                        dataKey="tw_berjalan"
                        name="TW Berjalan"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#10b981' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="tw_sebelumnya"
                        name="TW Sebelumnya"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={{ r: 3, fill: '#94a3b8' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Distribusi Pelaksanaan (Donut Chart) */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                      Distribusi Pelaksanaan
                    </h3>
                    <p className="text-[11px] text-slate-500">% Pelaksanaan 1 vs Pelaksanaan 0</p>
                  </div>
                </div>
                <div className="h-56 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={d.distribusi_pelaksanaan}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="45%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {d.distribusi_pelaksanaan.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v, name, p) => [`${v} sesi (${p.payload.pct}%)`, name]} />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 3: SPPN vs Benchmark (Bar Chart) */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                      SPPN vs Benchmark
                    </h3>
                    <p className="text-[11px] text-slate-500">SPPN WBP vs Rata-rata All-WBP Lapas</p>
                  </div>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={d.sppn_benchmark} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => [`${v}`, 'Skor SPPN']} />
                      <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Ambang (70)', fontSize: 10, fill: '#ef4444' }} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {d.sppn_benchmark.map((entry, index) => (
                          <Cell key={`sppn-b-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 4: PPKS vs Benchmark (Bar Chart) */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                      PPKS vs Benchmark
                    </h3>
                    <p className="text-[11px] text-slate-500">PPKS WBP vs Rata-rata All-WBP Lapas</p>
                  </div>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={d.ppks_benchmark} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => [`${v}`, 'Skor PPKS']} />
                      <ReferenceLine y={4.0} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Ambang (4.00)', fontSize: 10, fill: '#ef4444' }} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {d.ppks_benchmark.map((entry, index) => (
                          <Cell key={`ppks-b-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BAGIAN TAMBAHAN (Analisa Kekuatan, Hambatan & Pengecualian - 2 Tabel Pivot) */}
          {/* ========================================================================= */}
          <div className="space-y-3 pt-2">
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-700" />
                Bagian Tambahan — Analisa Kekuatan, Hambatan, Perbaikan, dan Pengecualian
              </h2>
              <p className="text-xs text-slate-500">
                Goals: Menampilkan fakta kuantitatif analisa spesifik untuk verifikasi dan perencanaan pembinaan lanjutan.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {/* Tabel Program Pivot */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">
                        Tabel Matriks Pelaksanaan Program
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Dimensi: Program | Kolom: Bulan 1, Bulan 2, Bulan 3 | Metrik: Avg. Keterlaksanaan
                      </p>
                    </div>
                    <span className="rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                      Pivot Program
                    </span>
                  </div>

                  <div className="overflow-x-auto mt-3">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                          <th className="py-2.5 px-3">Program Pembinaan</th>
                          <th className="py-2.5 px-2 text-center">Bulan 1</th>
                          <th className="py-2.5 px-2 text-center">Bulan 2</th>
                          <th className="py-2.5 px-2 text-center">Bulan 3</th>
                          <th className="py-2.5 px-2 text-center">Total</th>
                          <th className="py-2.5 px-3 text-right">Kepatuhan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {d.tabel_program_pivot.map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-slate-800">
                              {p.program}
                            </td>
                            <td className="py-2.5 px-2 text-center text-slate-600 font-mono">
                              {p.bulan1}
                            </td>
                            <td className="py-2.5 px-2 text-center text-slate-600 font-mono">
                              {p.bulan2}
                            </td>
                            <td className="py-2.5 px-2 text-center text-slate-600 font-mono">
                              {p.bulan3}
                            </td>
                            <td className="py-2.5 px-2 text-center font-bold text-slate-900 font-mono">
                              {p.count}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="rounded bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700">
                                {p.avg_pelaksanaan}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Satuan: Jumlah Kehadiran Sesi / Bulan</span>
                  <span className="font-bold text-slate-700">Keterlaksanaan Sangat Tinggi</span>
                </div>
              </div>

              {/* Tabel PPKS Pivot */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">
                        Tabel Matriks Sub-Indikator PPKS
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Dimensi: 5 Sub-Indikator PPKS | Kolom: Bulan 1, 2, 3 | Metrik: Avg. Nilai (1.00 - 5.00)
                      </p>
                    </div>
                    <span className="rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-800 border border-amber-200">
                      Pivot PPKS
                    </span>
                  </div>

                  <div className="overflow-x-auto mt-3">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                          <th className="py-2.5 px-3">Sub-Indikator PPKS</th>
                          <th className="py-2.5 px-2 text-center">Bulan 1</th>
                          <th className="py-2.5 px-2 text-center">Bulan 2</th>
                          <th className="py-2.5 px-2 text-center">Bulan 3</th>
                          <th className="py-2.5 px-2 text-center">Rata-rata</th>
                          <th className="py-2.5 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {d.tabel_ppks_pivot.map((dim, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-slate-800">
                              {dim.dimensi}
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono text-slate-600">
                              {formatNumber(dim.bulan1, 1)}
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono text-slate-600">
                              {formatNumber(dim.bulan2, 1)}
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono text-slate-600">
                              {formatNumber(dim.bulan3, 1)}
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-900">
                              {formatNumber(dim.avg_nilai, 2)}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span
                                className={`rounded px-2 py-0.5 font-bold ${
                                  Number(dim.avg_nilai) >= 4.0
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-amber-50 text-amber-700'
                                }`}
                              >
                                {dim.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Skala: 1.00 (Sangat Kurang) s.d 5.00 (Sangat Baik)</span>
                  <span className="font-bold text-emerald-700">Ambang Batas Minimum: 4.00</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Profile Details Modal */}
      <Modal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        title={`Profil & Evaluasi Lengkap: ${profileDetails?.nama || d.identitas?.nama}`}
        size="lg"
      >
        {profileLoading ? (
          <LoadingSpinner label="Memuat rincian profil WBP..." />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="h-16 w-16 rounded-xl bg-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                {profileDetails?.foto_wajah ? (
                  <img
                    src={getAssetUrl(profileDetails.foto_wajah)}
                    alt={profileDetails.nama}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8 text-slate-400" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-base font-bold text-slate-900">{profileDetails?.nama}</h4>
                <p className="text-xs font-mono text-slate-500">
                  {profileDetails?.no_registrasi} • {profileDetails?.blok_kamar}
                </p>
                <div className="mt-1 flex items-center gap-3 text-xs text-slate-600">
                  <span>Wali PAS: <strong>{profileDetails?.wali_pas_nama || '-'}</strong></span>
                  <span>•</span>
                  <span>Mitra: <strong>{profileDetails?.mitra_nama || 'Kemenag Ciamis'}</strong></span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-xs text-emerald-700 font-bold uppercase">Skor SPPN</span>
                <div className="text-2xl font-black text-emerald-900 mt-1">
                  {formatNumber(profileDetails?.sppn_skor || d.sppn?.nilai, 1)} / 100
                </div>
                <p className="text-[11px] text-emerald-700 mt-0.5">Ambang batas 70 (Syarat Remisi/Integrasi)</p>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-xs text-amber-700 font-bold uppercase">Skor PPKS</span>
                <div className="text-2xl font-black text-amber-900 mt-1">
                  {formatNumber(profileDetails?.ppks_skor || d.ppks?.nilai, 2)} / 5.00
                </div>
                <p className="text-[11px] text-amber-700 mt-0.5">Ambang batas 4.00 (Karakter Spiritual)</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={exporting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800"
              >
                <FileDown className="h-4 w-4" />
                Unduh PDF Rapor
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
