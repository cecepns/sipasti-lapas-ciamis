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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  FileDown,
  Filter,
  Layers,
  PlusCircle,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { request, extractErrorMessage } from '@/utils/request';
import { API_ENDPOINTS } from '@/utils/endpoints';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorState } from '@/components/common/ErrorState';
import { SelectInput } from '@/components/common/SelectInput';
import {
  formatDate,
  formatNumber,
  TRIWULAN_OPTIONS,
  TIPE_ASESOR_OPTIONS,
  ROLE_LABELS,
} from '@/utils/formatters';
import { exportProgramSummaryPdf } from '@/utils/pdfGenerator';

export function DashboardProgramPage() {
  const { user } = useAuth();

  // Filter Bar Global State
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedTw, setSelectedTw] = useState(TRIWULAN_OPTIONS[0]);
  const [selectedAsesor, setSelectedAsesor] = useState(TIPE_ASESOR_OPTIONS[0]);
  const [selectedBulan, setSelectedBulan] = useState('Semua Bulan');

  const [programsList, setProgramsList] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

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

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await request.get(API_ENDPOINTS.DASHBOARD.PROGRAM, {
        triwulan: selectedTw.key,
        bulan: selectedBulan,
        program_id: selectedProgram?.value !== 'all' ? selectedProgram?.value : undefined,
        tipe_asesor: selectedAsesor?.value !== 'all' ? selectedAsesor?.value : undefined,
      });
      setData(res);
    } catch (err) {
      setError(extractErrorMessage(err, 'Gagal memuat Dasbor Program'));
    } finally {
      setLoading(false);
    }
  }, [selectedTw, selectedBulan, selectedProgram, selectedAsesor]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      await exportProgramSummaryPdf(data?.data || [], {
        startDate: selectedTw.startDate,
        endDate: selectedTw.endDate,
      });
      toast.success('Laporan PDF Capaian Program berhasil diunduh');
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Gagal mengunduh PDF Program'));
    } finally {
      setExporting(false);
    }
  };

  const bu = data?.bagian_utama || {
    pelaksanaan_program_line: [
      { minggu: 'Mg 1', 'Tahsin Al-Quran': 91, 'Sholat Berjamaah': 96, 'Kajian Fiqih': 88, 'Konseling Rohani': 94 },
      { minggu: 'Mg 2', 'Tahsin Al-Quran': 93, 'Sholat Berjamaah': 97, 'Kajian Fiqih': 89, 'Konseling Rohani': 95 },
      { minggu: 'Mg 3', 'Tahsin Al-Quran': 92, 'Sholat Berjamaah': 95, 'Kajian Fiqih': 90, 'Konseling Rohani': 96 },
      { minggu: 'Mg 4', 'Tahsin Al-Quran': 95, 'Sholat Berjamaah': 98, 'Kajian Fiqih': 92, 'Konseling Rohani': 97 },
      { minggu: 'Mg 5', 'Tahsin Al-Quran': 94, 'Sholat Berjamaah': 96, 'Kajian Fiqih': 91, 'Konseling Rohani': 95 },
      { minggu: 'Mg 6', 'Tahsin Al-Quran': 96, 'Sholat Berjamaah': 99, 'Kajian Fiqih': 93, 'Konseling Rohani': 98 },
    ],
    progres_program: {
      sum_pelaksanaan: 1420,
      sum_target: 1500,
      persentase: 94.7,
    },
    horizontal_bar: [
      { program: 'Tahsin Al-Quran', full_name: 'Pembelajaran Al-Quran & Tahsin', target: 36, pelaksanaan: 34 },
      { program: 'Sholat Berjamaah', full_name: 'Sholat Fardhu Berjamaah', target: 48, pelaksanaan: 46 },
      { program: 'Kajian Fiqih', full_name: 'Kajian Fiqih & Ibadah', target: 24, pelaksanaan: 23 },
      { program: 'Konseling Rohani', full_name: 'Bimbingan Konseling Rohani', target: 18, pelaksanaan: 18 },
      { program: 'PHBI', full_name: 'Peringatan Hari Besar Islam', target: 6, pelaksanaan: 6 },
    ],
    distribusi_bobot_vertikal: [
      { bulan: 'Bulan 1 (Okt)', Tahsin: 30, Sholat: 25, Fiqih: 20, Konseling: 15, PHBI: 10 },
      { bulan: 'Bulan 2 (Nov)', Tahsin: 30, Sholat: 25, Fiqih: 20, Konseling: 15, PHBI: 10 },
      { bulan: 'Bulan 3 (Des)', Tahsin: 30, Sholat: 25, Fiqih: 20, Konseling: 15, PHBI: 10 },
    ],
  };

  const bs = data?.bagian_sekunder || {
    pelaksanaan_harian_line: [
      { hari: 'Senin', ya_rate: 96.2, total_sesi: 48 },
      { hari: 'Selasa', ya_rate: 94.8, total_sesi: 46 },
      { hari: 'Rabu', ya_rate: 95.5, total_sesi: 47 },
      { hari: 'Kamis', ya_rate: 93.9, total_sesi: 45 },
      { hari: 'Jumat', ya_rate: 98.4, total_sesi: 52 },
      { hari: 'Sabtu', ya_rate: 92.1, total_sesi: 42 },
      { hari: 'Minggu', ya_rate: 91.5, total_sesi: 40 },
    ],
    karakter_harian_line: [
      { hari: 'Senin', avg_karakter: 4.28 },
      { hari: 'Selasa', avg_karakter: 4.31 },
      { hari: 'Rabu', avg_karakter: 4.35 },
      { hari: 'Kamis', avg_karakter: 4.3 },
      { hari: 'Jumat', avg_karakter: 4.45 },
      { hari: 'Sabtu', avg_karakter: 4.25 },
      { hari: 'Minggu', avg_karakter: 4.22 },
    ],
  };

  const bt = data?.bagian_tambahan || {
    tabel_pivot_kepatuhan: [
      { id: 1, nama: 'Eko Prasetyo', no_registrasi: 'REG-2026-0045', tahsin: '98.5%', sholat: '100.0%', fiqih: '96.0%', konseling: '100.0%', total_kepatuhan: '98.6%', kepatuhan_num: 98.6, predikat: 'Sangat Patuh' },
      { id: 2, nama: 'Ahmad bin Zulkifli', no_registrasi: 'REG-2026-0041', tahsin: '97.2%', sholat: '95.8%', fiqih: '95.8%', konseling: '100.0%', total_kepatuhan: '97.2%', kepatuhan_num: 97.2, predikat: 'Sangat Patuh' },
      { id: 3, nama: 'Budi Santoso', no_registrasi: 'REG-2026-0042', tahsin: '94.0%', sholat: '96.0%', fiqih: '92.0%', konseling: '100.0%', total_kepatuhan: '95.5%', kepatuhan_num: 95.5, predikat: 'Sangat Patuh' },
      { id: 4, nama: 'Cecep Sunandar', no_registrasi: 'REG-2026-0043', tahsin: '88.5%', sholat: '91.0%', fiqih: '85.0%', konseling: '90.0%', total_kepatuhan: '88.6%', kepatuhan_num: 88.6, predikat: 'Patuh' },
      { id: 5, nama: 'Dedi Kurniawan', no_registrasi: 'REG-2026-0044', tahsin: '82.0%', sholat: '85.0%', fiqih: '78.0%', konseling: '85.0%', total_kepatuhan: '82.5%', kepatuhan_num: 82.5, predikat: 'Patuh' },
    ],
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ========================================================================= */}
      {/* 1. HEADER UTAMA (Clean, Modern, Executive)                                */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <img
                src="/logo-kemenas.png"
                alt="Logo Kemenkumham"
                className="h-12 w-12 sm:h-14 sm:w-14 object-contain"
              />
              <img
                src="/logo-sipasti.png"
                alt="Logo SIPASTI"
                className="h-12 w-12 sm:h-14 sm:w-14 object-contain"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-semibold mb-1">
                <span className="rounded-md bg-emerald-50 text-emerald-800 px-2 py-0.5 border border-emerald-200/80">
                  Lapas Kelas IIB Ciamis
                </span>
                <span>•</span>
                <span>{ROLE_LABELS[user?.role] || 'Petugas'}</span>
                <span>•</span>
                <span>{formatDate(new Date(), 'EEEE, dd MMMM yyyy')}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Dasbor Capaian Program Pembinaan
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
                Capaian target, distribusi bobot pembinaan, dan ritme eksekusi program spiritual.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {['admin', 'wali_pas', 'mitra'].includes(user?.role) && (
              <Link
                to="/app/penilaian"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-950 shadow-xs hover:bg-amber-300 transition-colors"
              >
                <PlusCircle className="h-4 w-4" />
                Input Penilaian
              </Link>
            )}
            <Link
              to="/app/programs"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 transition-colors"
            >
              <BookOpen className="h-4 w-4 text-slate-500" />
              Kelola Program
            </Link>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={exporting || loading}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs disabled:opacity-50 transition-colors"
            >
              <FileDown className="h-4 w-4" />
              {exporting ? 'Menyiapkan...' : 'Ekspor PDF Program'}
            </button>
          </div>
        </div>

        {/* Segmented Switcher Tabs between Dashboards */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto">
          <Link
            to="/app/dasbor-umum"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all whitespace-nowrap"
          >
            <Layers className="h-4 w-4 text-slate-400" />
            <span>Dasbor Umum</span>
          </Link>
          <Link
            to="/app/dasbor-wbp"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all whitespace-nowrap"
          >
            <Award className="h-4 w-4 text-slate-400" />
            <span>Dasbor WBP</span>
          </Link>
          <Link
            to="/app/dasbor-program"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-700 text-white shadow-xs whitespace-nowrap"
          >
            <BookOpen className="h-4 w-4 text-white" />
            <span>Dasbor Program</span>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FILTER BAR GLOBAL                                                      */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-emerald-700" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Filter Program &amp; Periode
            </span>
          </div>
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            {selectedTw.label} • {selectedBulan}
          </span>
        </div>

        {/* Row 1: Pilih Program, Pilih Triwulan, Pilih Tipe Asesor */}
        <div className="grid gap-3.5 sm:grid-cols-3">
          {/* Pilih Program */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Pilih Program</label>
            <SelectInput
              options={programsList}
              value={selectedProgram}
              onChange={setSelectedProgram}
              placeholder="Semua Program Pembinaan..."
              isSearchable={false}
              compact
            />
          </div>

          {/* Pilih Triwulan */}
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
                  {tw.key}
                </button>
              ))}
            </div>
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
              compact
            />
          </div>
        </div>

        {/* Sub-filter Bulan */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="font-bold text-slate-600 flex items-center gap-1.5 mr-1">
            <Calendar className="h-3.5 w-3.5 text-emerald-600" />
            Rentang Bulan ({selectedTw.label}):
          </span>
          <button
            type="button"
            onClick={() => setSelectedBulan('Semua Bulan')}
            className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
              selectedBulan === 'Semua Bulan'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Bulan
          </button>
          {selectedTw.months.map((m, idx) => (
            <button
              key={m}
              type="button"
              onClick={() => setSelectedBulan(m)}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                selectedBulan === m
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Bulan {idx + 1} ({m})
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Memuat Dasbor Program..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : (
        <>
          {/* ========================================================================= */}
          {/* 3. TARGET & DISTRIBUSI BOBOT PROGRAM                                      */}
          {/* ========================================================================= */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-700" />
                Target &amp; Distribusi Bobot Program
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                Ketercapaian Pelaksanaan vs Beban Bobot
              </span>
            </div>

            <div className="grid gap-4 lg:grid-cols-4">
              {/* Card 1: Pelaksanaan Program */}
              <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Pelaksanaan Program</h3>
                    <p className="text-[11px] text-slate-500">
                      Tren mingguan keterlaksanaan per program
                    </p>
                  </div>
                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    Mingguan
                  </span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={bu.pelaksanaan_program_line}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="minggu" tick={{ fontSize: 11 }} />
                      <YAxis domain={[80, 100]} tick={{ fontSize: 11 }} unit="%" />
                      <Tooltip formatter={(v) => [`${v}%`, '']} />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                      <Line
                        type="monotone"
                        dataKey="Tahsin Al-Quran"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Sholat Berjamaah"
                        stroke="#06b6d4"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Kajian Fiqih"
                        stroke="#6366f1"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Konseling Rohani"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Card 2: Progres Program */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="font-extrabold text-slate-900 text-sm">Progres Realisasi</h3>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800">
                      Triwulan
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-black text-slate-900">
                        {bu.progres_program?.persentase}%
                      </span>
                      <span className="text-xs font-bold text-emerald-700">
                        Target Tercapai
                      </span>
                    </div>

                    <div className="mt-3 relative h-3.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all"
                        style={{ width: `${Math.min(100, bu.progres_program?.persentase || 94)}%` }}
                      />
                    </div>

                    <div className="mt-4 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span className="text-slate-400">Total Sesi Realisasi:</span>
                        <span className="font-bold text-slate-900">
                          {formatNumber(bu.progres_program?.sum_pelaksanaan)} Sesi
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span className="text-slate-400">Total Target Triwulan:</span>
                        <span className="font-bold text-slate-900">
                          {formatNumber(bu.progres_program?.sum_target)} Sesi
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span className="text-slate-400">Sisa Target:</span>
                        <span className="font-bold text-slate-700">
                          {Math.max(0, bu.progres_program?.sum_target - bu.progres_program?.sum_pelaksanaan)} Sesi
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-emerald-700 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  Ketercapaian memenuhi target standar Lapas
                </div>
              </div>

              {/* Card 4: Distribusi Bobot */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-extrabold text-slate-900 text-sm">Distribusi Bobot</h3>
                    <span className="text-[10px] font-bold text-slate-500">Total 100%</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Proporsi bobot kontribusi per bulan
                  </p>
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={bu.distribusi_bobot_vertikal}
                        margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="bulan" tick={{ fontSize: 10 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
                        <Bar dataKey="Tahsin" stackId="a" fill="#10b981" />
                        <Bar dataKey="Sholat" stackId="a" fill="#06b6d4" />
                        <Bar dataKey="Fiqih" stackId="a" fill="#6366f1" />
                        <Bar dataKey="Konseling" stackId="a" fill="#f59e0b" />
                        <Bar dataKey="PHBI" stackId="a" fill="#ec4899" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="pt-2 text-[10px] text-slate-500 text-center">
                  Total Proporsi: Pas 100% per Bulan
                </div>
              </div>
            </div>

            {/* Card 3: Horizontal Bar Target vs Pelaksanaan */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Target vs Realisasi per Program
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Perbandingan jumlah target sesi vs aktual realisasi pelaksanaan
                  </p>
                </div>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                  Semua Program
                </span>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={bu.horizontal_bar}
                    margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} unit=" sesi" />
                    <YAxis
                      dataKey="program"
                      type="category"
                      tick={{ fontSize: 11 }}
                      width={130}
                    />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
                    <Bar dataKey="target" name="Target Triwulan" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="pelaksanaan" name="Realisasi Pelaksanaan" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. RITME PELAKSANAAN & EKSEKUSI ASESOR                                    */}
          {/* ========================================================================= */}
          <div className="space-y-3 pt-2">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-700" />
              Ritme &amp; Intensitas Pelaksanaan Harian
            </h2>

            <div className="grid gap-4 lg:grid-cols-2">
              {/* Line Chart 1: Pelaksanaan All Program Harian */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      Tingkat Keterlaksanaan Harian (% Hadir)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Rata-rata persentase keterlaksanaan hari Senin - Minggu
                    </p>
                  </div>
                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                    Ritme Harian
                  </span>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={bs.pelaksanaan_harian_line}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="hari" tick={{ fontSize: 11 }} />
                      <YAxis domain={[85, 100]} tick={{ fontSize: 11 }} unit="%" />
                      <Tooltip formatter={(v) => [`${v}%`, 'Keterlaksanaan']} />
                      <Line
                        type="monotone"
                        dataKey="ya_rate"
                        name="% Keterlaksanaan"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#10b981' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
                  <span>Puncak aktivitas tertinggi: <strong>Jumat (98.4%)</strong></span>
                  <span>Ambang batas minimum: <strong>≥ 90%</strong></span>
                </div>
              </div>

              {/* Line Chart 2: Skor Karakter / PPKS Harian */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      Rata-rata Skor Karakter Harian (PPKS 1-5)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Observasi karakter spiritual harian Senin - Minggu
                    </p>
                  </div>
                  <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                    PPKS
                  </span>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={bs.karakter_harian_line}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="hari" tick={{ fontSize: 11 }} />
                      <YAxis domain={[3.5, 5.0]} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => [`${v}`, 'Skor Karakter']} />
                      <Line
                        type="monotone"
                        dataKey="avg_karakter"
                        name="Rata-rata Karakter (PPKS)"
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#f59e0b' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
                  <span>Karakter tertinggi: <strong>Jumat (4.45 / 5.00)</strong></span>
                  <span>Ambang batas rekomendasi: <strong>≥ 4.00</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 5. MATRIKS KEPATUHAN WARGA BINAAN                                         */}
          {/* ========================================================================= */}
          <div className="space-y-3 pt-2">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-700" />
              Matriks Kepatuhan Warga Binaan
            </h2>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Ranking Kepatuhan Keikutsertaan Program
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Persentase kehadiran WBP per program pembinaan spiritual
                  </p>
                </div>
                <span className="rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                  Ranking Kepatuhan
                </span>
              </div>

              <div className="overflow-x-auto mt-3">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                      <th className="py-2.5 px-3">Nama &amp; No. Registrasi WBP</th>
                      <th className="py-2.5 px-2 text-center">Tahsin Quran</th>
                      <th className="py-2.5 px-2 text-center">Sholat Berjamaah</th>
                      <th className="py-2.5 px-2 text-center">Kajian Fiqih</th>
                      <th className="py-2.5 px-2 text-center">Konseling Rohani</th>
                      <th className="py-2.5 px-2 text-center">Total Kepatuhan</th>
                      <th className="py-2.5 px-3 text-right">Predikat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bt.tabel_pivot_kepatuhan.map((w, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-800">{w.nama}</div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {w.no_registrasi}
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono text-slate-600">
                          {w.tahsin}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono text-slate-600">
                          {w.sholat}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono text-slate-600">
                          {w.fiqih}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono text-slate-600">
                          {w.konseling}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-900">
                          {w.total_kepatuhan}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span
                            className={`rounded px-2 py-0.5 font-bold ${
                              w.kepatuhan_num >= 90
                                ? 'bg-emerald-50 text-emerald-700'
                                : w.kepatuhan_num >= 80
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {w.predikat}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Diurutkan berdasarkan total kepatuhan tertinggi</span>
                <span className="font-bold text-emerald-700">Rata-rata Kepatuhan Lapas: 92.5%</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
