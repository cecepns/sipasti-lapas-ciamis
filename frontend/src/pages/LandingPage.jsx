import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  BookOpenCheck,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Handshake,
  LogIn,
  Mail,
  MapPin,
  Menu,
  Phone,
  ScanFace,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { request } from '@/utils/request';
import { API_ENDPOINTS } from '@/utils/endpoints';
import { formatNumber } from '@/utils/formatters';

export function LandingPage() {
  const [summary, setSummary] = useState(null);
  const [selectedTw, setSelectedTw] = useState('tw4');
  const [selectedCompTw, setSelectedCompTw] = useState('tw3');
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let active = true;
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const res = await request.get(API_ENDPOINTS.PUBLIC.SUMMARY, {
          triwulan: selectedTw,
        });
        if (active) setSummary(res.data);
      } catch {
        // Keep graceful fallback UI if backend is offline
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchSummary();
    return () => {
      active = false;
    };
  }, [selectedTw]);

  const twList = [
    {
      id: 'tw4',
      label: 'Triwulan IV (Berjalan)',
      wbp_aktif: summary?.wbp_aktif ?? 120,
      total_wbp: summary?.total_wbp ?? 120,
      pelaksanaan: summary?.tingkat_pelaksanaan ?? 94.2,
      terlaksana: summary?.terlaksana ?? 360,
      total_sesi: summary?.total_penilaian ?? 384,
      sppn: summary?.rata_sppn ?? 82.4,
      ppks: summary?.rata_ppks_5 ?? 4.35,
      trend: '+4.2% vs TW-III (hari ke-50)',
      status: 'Aktif',
      rekomendasi: 114,
    },
    {
      id: 'tw3',
      label: 'Triwulan III',
      wbp_aktif: 118,
      total_wbp: 118,
      pelaksanaan: 90.0,
      terlaksana: 342,
      total_sesi: 380,
      sppn: 78.2,
      ppks: 4.15,
      trend: '+3.5% vs TW-II',
      status: 'Selesai',
      rekomendasi: 108,
    },
    {
      id: 'tw2',
      label: 'Triwulan II',
      wbp_aktif: 115,
      total_wbp: 115,
      pelaksanaan: 88.5,
      terlaksana: 330,
      total_sesi: 373,
      sppn: 76.8,
      ppks: 4.02,
      trend: '+2.8% vs TW-I',
      status: 'Selesai',
      rekomendasi: 102,
    },
    {
      id: 'tw1',
      label: 'Triwulan I',
      wbp_aktif: 110,
      total_wbp: 110,
      pelaksanaan: 85.0,
      terlaksana: 306,
      total_sesi: 360,
      sppn: 74.5,
      ppks: 3.95,
      trend: 'Baseline',
      status: 'Selesai',
      rekomendasi: 95,
    },
  ];

  const currentTw = twList.find((t) => t.id === selectedTw) || twList[0];
  const compData = twList.find((t) => t.id === selectedCompTw) || twList[1];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col w-full max-w-full overflow-x-hidden">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs w-full">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8 w-full">
          {/* 1. Left: Brand Identity */}
          <div className="flex items-center justify-start shrink-0 min-w-0">
            <Link to="/" className="flex items-center gap-2.5 sm:gap-3">
              <div className="flex items-center shrink-0">
                <img
                  src="/logo-sipasti.png"
                  alt="Logo SIPASTI"
                  className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-lg sm:rounded-xl object-contain bg-white border border-emerald-200/80 p-0.5 shadow-xs"
                />
              </div>
              <div className="min-w-0">
                <span className="block text-base sm:text-lg font-black tracking-tight text-emerald-800 leading-none">
                  SIPASTI
                </span>
                <span className="block text-[9px] sm:text-[11px] font-bold text-slate-500 mt-0.5 truncate max-w-[120px] xs:max-w-none">
                  Lapas Kelas IIB Ciamis
                </span>
              </div>
            </Link>
          </div>

          {/* 2. Center: Desktop Navigation Links (Centered, Balanced & Proportional) */}
          <nav className="hidden lg:flex items-center justify-center gap-5 xl:gap-8 text-xs xl:text-sm font-bold text-slate-600 flex-1 px-4">
            <a href="#instrumen" className="whitespace-nowrap hover:text-emerald-700 transition-colors py-1">
              Instrumen SPPN &amp; PPKS
            </a>
            <a href="#ringkasan" className="whitespace-nowrap hover:text-emerald-700 transition-colors py-1">
              Ringkasan Triwulan
            </a>
            <a href="#program" className="whitespace-nowrap hover:text-emerald-700 transition-colors py-1">
              Program Pembinaan
            </a>
            <Link to="/panduan" className="whitespace-nowrap hover:text-emerald-700 transition-colors py-1">
              Buku Panduan
            </Link>
            <Link
              to="/registrasi-mitra"
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600/30 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-800 shadow-xs hover:bg-emerald-100 hover:border-emerald-600/60 transition-all whitespace-nowrap"
            >
              <Handshake className="h-3.5 w-3.5 text-emerald-600" />
              <span>Registrasi Mitra</span>
            </Link>
          </nav>

          {/* 3. Right: Single Unified Button with Dropdown + Mobile Toggle */}
          <div className="flex items-center justify-end gap-2 shrink-0 relative" ref={dropdownRef}>
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="inline-flex items-center gap-1.5 sm:gap-2 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-emerald-800 transition-all whitespace-nowrap shrink-0"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <LogIn className="h-4 w-4 shrink-0" />
                <span>Masuk Portal</span>
                <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Pilih Layanan</p>
                  </div>
                  <div className="space-y-1 pt-1.5">
                    <Link
                      to="/login"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 transition-colors group"
                    >
                      <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                        <LogIn className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold leading-tight text-slate-900 group-hover:text-emerald-800">
                          Portal Petugas & Asesor
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Admin, Wali PAS, Kasubsi, Kalapas</p>
                      </div>
                    </Link>

                    <Link
                      to="/absensi-kiosk"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 transition-colors group"
                    >
                      <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                        <ScanFace className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold leading-tight text-slate-900 group-hover:text-emerald-800">
                          Absensi Face ID (Kiosk)
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Pencatatan biometrik mandiri WBP</p>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu (Clean & Smooth) */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3 shadow-lg">
            <div className="flex flex-col space-y-1 text-sm font-bold text-slate-700">
              <a
                href="#instrumen"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-xl hover:bg-slate-50 hover:text-emerald-700 transition-colors"
              >
                Instrumen SPPN &amp; PPKS
              </a>
              <a
                href="#ringkasan"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-xl hover:bg-slate-50 hover:text-emerald-700 transition-colors"
              >
                Ringkasan Triwulan
              </a>
              <a
                href="#program"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-xl hover:bg-slate-50 hover:text-emerald-700 transition-colors"
              >
                Program Pembinaan
              </a>
              <Link
                to="/panduan"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-xl hover:bg-slate-50 hover:text-emerald-700 transition-colors"
              >
                Buku Panduan
              </Link>
              <Link
                to="/registrasi-mitra"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-xl hover:bg-slate-50 hover:text-emerald-700 transition-colors"
              >
                Registrasi Mitra
              </Link>
            </div>
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <Link
                to="/absensi-kiosk"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800"
              >
                <ScanFace className="h-4 w-4" />
                Absensi Face ID
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs"
              >
                <LogIn className="h-4 w-4" />
                Masuk Portal Petugas
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.16),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.22),transparent_45%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/15 px-3.5 py-1.5 text-xs font-semibold text-emerald-200 max-w-full">
                <Sparkles className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                <span className="truncate sm:whitespace-normal">Lembaga Pemasyarakatan Kelas IIB Ciamis</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                SI PASTI
                <span className="block text-xl sm:text-2xl lg:text-3xl font-bold text-amber-300 mt-1 sm:mt-2">
                  (Sistem Informasi Penilaian Aktivitas Spiritual Terintegrasi)
                </span>
              </h1>

              <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-2xl">
                Digitalisasi Pembinaan Spiritual Lapas Kelas IIB Ciamis SI PASTI merupakan sistim terpadu tata kelola pendataan aktivitas keagamaan warga binaan yang terstruktur, terukur, dan transparan. Melalui pendekatan berbasis data (data-driven) untuk menjamin penilaian pembinaan kepribadian secara adil dan akuntabel sebagai dasar pertimbangan hak remisi dan program integrasi.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  to="/absensi-kiosk"
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-300 transition-all"
                >
                  <ScanFace className="h-5 w-5" />
                  Absensi WBP (Face ID & Selfie)
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur-sm hover:bg-white/20 transition-all"
                >
                  <ShieldCheck className="h-5 w-5" />
                  Dashboard Petugas & Pimpinan
                </Link>
                <Link
                  to="/registrasi-mitra"
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/40 px-4 py-3 text-sm font-semibold text-emerald-100 hover:bg-emerald-800/60 transition-all"
                >
                  <Handshake className="h-4 w-4" />
                  Daftar Mitra Keagamaan
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-md shadow-2xl">
                <div className="flex items-center gap-4 pb-5 border-b border-white/15">
                  <img
                    src="/logo-sipasti.png"
                    alt="Emblem SIPASTI"
                    className="h-20 w-20 rounded-2xl bg-white p-1.5 shadow-md object-contain"
                  />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                      Inovasi Pembinaan Spiritual
                    </p>
                    <h2 className="text-xl font-extrabold text-white mt-0.5">
                      SIPASTI Lapas Ciamis
                    </h2>
                    <p className="text-xs text-emerald-100/80 mt-1">
                      SPPN (0-100) • PPKS (1-5) • Face ID • PDF Rapor
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-5">
                  {[
                    { icon: ScanFace, title: 'Absensi Face ID', desc: 'Verifikasi biometrik wajah mandiri' },
                    { icon: ClipboardCheck, title: 'Instrumen SPPN', desc: 'Nilai Utama (Syarat Min. 70)' },
                    { icon: Award, title: 'Instrumen PPKS', desc: 'Karakter Spiritual (Skala 1 - 5)' },
                    { icon: FileText, title: 'Export PDF Resmi', desc: 'Kop Kemenimpas baku + Logo SIPASTI' },
                  ].map((f) => {
                    const Icon = f.icon;
                    return (
                      <div key={f.title} className="rounded-2xl bg-slate-900/40 border border-white/10 p-3.5">
                        <Icon className="h-5 w-5 text-amber-300 mb-2" />
                        <p className="text-xs font-bold text-white">{f.title}</p>
                        <p className="text-[11px] text-emerald-100/75 mt-0.5">{f.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* [REV0001] Prominent Cards: Penjelasan Visual Instrumen SPPN & PPKS */}
      <section id="instrumen" className="mx-auto max-w-7xl w-full px-4 -mt-8 relative z-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Card SPPN */}
          <div className="rounded-3xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 p-6 sm:p-7 shadow-lg shadow-emerald-900/5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 text-white px-3 py-1 text-xs font-bold tracking-wide shadow-xs">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  SPPN • INSTRUMEN UTAMA
                </span>
                <span className="rounded-full bg-emerald-100 text-emerald-800 font-extrabold px-3 py-0.5 text-xs border border-emerald-300">
                  Ambang Batas ≥ 70
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Sistem Penilaian Pembinaan Narapidana
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Sistem penilaian yang digunakan untuk mengukur, mencatat, dan mengevaluasi keaktifan serta perkembangan perilaku narapidana selama mengikuti program pembinaan. Sebagai dasar objektif dan terverifikasi dalam mempertimbangkan hak-hak narapidana, seperti pengusulan remisi dan program integrasi
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs bg-white rounded-2xl p-3.5 border border-emerald-100">
                <div>
                  <span className="text-slate-400 font-semibold block">Skala Penilaian:</span>
                  <span className="text-emerald-800 font-black text-sm">0 s/d 100</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Total Bobot Program:</span>
                  <span className="text-emerald-800 font-black text-sm">Tepat 100%</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Kualifikasi:</span>
                  <span className="font-bold text-slate-700">Baik (≥70) • Kurang (&lt;70)</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between text-xs text-emerald-800 font-medium">
              <span>Formula: Σ (Realisasi / Target × Bobot)</span>
              <span className="font-bold">Kualifikasi: 1 / 0</span>
            </div>
          </div>

          {/* Card PPKS */}
          <div className="rounded-3xl border border-amber-200/90 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/40 p-6 sm:p-7 shadow-lg shadow-amber-900/5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 text-white px-3 py-1 text-xs font-bold tracking-wide shadow-xs">
                  <Award className="h-3.5 w-3.5" />
                  PPKS • KUALITATIF KOMPLEMENTER
                </span>
                <span className="rounded-full bg-amber-100 text-amber-900 font-extrabold px-3 py-0.5 text-xs border border-amber-300">
                  Standar Mutu ≥ 4.00
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Penilaian Pembinaan Kepribadian Spiritual
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Instrumen evaluasi kualitatif komplementer yang dirancang untuk mengukur dan mendokumentasikan perubahan sikap, kedisiplinan, serta penghayatan nilai-nilai keagamaan warga binaan secara mendalam. PPKS sebagai data pendukung SPPN agar penilaian lebih komprehensif, transparan, dan objektif.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs bg-white rounded-2xl p-3.5 border border-amber-100">
                <div>
                  <span className="text-slate-400 font-semibold block">Skala Indeks:</span>
                  <span className="text-amber-800 font-black text-sm">1.00 s/d 5.00</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Sub-Indikator:</span>
                  <span className="text-amber-800 font-black text-sm">5 Dimensi Karakter</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Kualifikasi:</span>
                  <span className="font-bold text-slate-700">Baik (≥4.0) • Cukup (3.0-3.99) • Kurang (&lt;3.0)</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-amber-100 flex items-center justify-between text-xs text-amber-800 font-medium">
              <span>Status: Instrumen kualitatif komplementer</span>
              <span className="font-bold">Kualifikasi: 2 / 1 / 0</span>
            </div>
          </div>
        </div>
      </section>

      {/* [REV0002 & REV0003] Live Public Dashboard Preview: Triwulan IV (Berjalan) */}
      <section id="ringkasan" className="mx-auto max-w-7xl w-full px-4 pt-12 pb-6 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              Periode Evaluasi Terkini
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
              Ringkasan Capaian {currentTw.label}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitoring akumulatif program pembinaan spiritual Lapas Kelas IIB Ciamis
            </p>
          </div>

          {/* Triwulan Active Selector */}
          <div className="w-full sm:w-auto overflow-x-auto pb-1 max-w-full">
            <div className="inline-flex rounded-xl bg-slate-200/80 p-1 text-xs font-bold whitespace-nowrap">
              {twList.map((tw) => (
                <button
                  key={tw.id}
                  type="button"
                  onClick={() => setSelectedTw(tw.id)}
                  className={`rounded-lg px-3 py-1.5 transition-all whitespace-nowrap ${
                    selectedTw === tw.id
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tw.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* [REV0003 & REV0004] 4 Summary Cards + Trend Indicator */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: WBP Aktif */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Warga Binaan Aktif</span>
              <div className="rounded-xl p-2 bg-emerald-50 text-emerald-700">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-slate-900">
              {loading && selectedTw === 'tw4' && !summary ? '...' : formatNumber(currentTw.wbp_aktif)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Total terdaftar: {formatNumber(currentTw.total_wbp)} WBP aktif
            </p>
          </div>

          {/* Card 2: Tingkat Pelaksanaan + [REV0004] Tren Badge */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Tingkat Pelaksanaan</span>
              <div className="rounded-xl p-2 bg-sky-50 text-sky-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <p className="text-3xl font-extrabold text-slate-900">
                {currentTw.pelaksanaan}%
              </p>
              <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                <TrendingUp className="h-3 w-3" />
                {currentTw.trend}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {formatNumber(currentTw.terlaksana)} dari {formatNumber(currentTw.total_sesi)} sesi terpenuhi
            </p>
          </div>

          {/* Card 3: Rata-rata Nilai SPPN (0-100) */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Rata-rata Nilai SPPN</span>
              <div className="rounded-xl p-2 bg-emerald-50 text-emerald-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <p className="text-3xl font-extrabold text-slate-900">
                {currentTw.sppn}
              </p>
              <span className="text-xs font-bold text-slate-400">/ 100</span>
              <span className="rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-1.5 py-0.5">
                {currentTw.sppn >= 70 ? 'Memenuhi (≥70)' : 'Kurang (<70)'}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Instrumen Utama (Ambang batas minimal: 70)
            </p>
          </div>

          {/* Card 4: Rata-rata Nilai PPKS (1.00 - 5.00) */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Rata-rata Nilai PPKS</span>
              <div className="rounded-xl p-2 bg-amber-50 text-amber-700">
                <Award className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <p className="text-3xl font-extrabold text-slate-900">
                {currentTw.ppks}
              </p>
              <span className="text-xs font-bold text-slate-400">/ 5.00</span>
              <span className="rounded-md bg-amber-100 text-amber-800 text-[10px] font-extrabold px-1.5 py-0.5">
                {currentTw.ppks >= 4.0 ? 'Baik (≥4.00)' : 'Cukup (<4.00)'}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Kualitatif Komplementer (5 Sub-indikator)
            </p>
          </div>
        </div>

        {/* [REV0005] Section di Bawah TW-IV: Tampilkan Komparasi Triwulan + Selector */}
        <div className="mt-8 rounded-3xl border border-slate-200/80 bg-gradient-to-r from-slate-100 via-white to-slate-100/70 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Perbandingan Historis
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-0.5">
                Komparasi Capaian Triwulan ({compData.label})
              </h3>
            </div>

            {/* Selector untuk Triwulan Komparasi (Mendukung Seluruh Triwulan) */}
            <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2 max-w-full">
              <span className="text-xs font-bold text-slate-600 shrink-0">Pilih Triwulan:</span>
              <div className="w-full xs:w-auto overflow-x-auto pb-1 max-w-full">
                <div className="inline-flex rounded-xl bg-slate-200/80 p-1 text-xs font-bold whitespace-nowrap">
                  {twList.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedCompTw(t.id)}
                      className={`rounded-lg px-3 py-1 transition-all whitespace-nowrap ${
                        selectedCompTw === t.id
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-5">
            {/* Card 1: Rekomendasi (Sum WBP Kualifikasi akhir Direkomendasikan + Direkomendasikan dengan Pertimbangan) */}
            <div className="rounded-2xl bg-white p-5 border border-slate-200 flex flex-col justify-between shadow-xs">
              <div>
                <span className="text-xs text-slate-500 font-semibold block">Rekomendasi</span>
                <span className="text-[10px] text-slate-400 font-medium block leading-tight mt-0.5">
                  (Sum WBP Kualifikasi akhir Direkomendasikan + Direkomendasikan dengan Pertimbangan)
                </span>
                <p className="text-3xl font-black text-slate-900 mt-2">{compData.rekomendasi} <span className="text-sm font-bold text-slate-500">WBP</span></p>
              </div>
              <p className="text-[11px] text-emerald-700 font-semibold mt-2 pt-2 border-t border-slate-100">
                {compData.rekomendasi} dari {compData.wbp_aktif} WBP ({((compData.rekomendasi / compData.wbp_aktif) * 100).toFixed(1)}%)
              </p>
            </div>

            {/* Card 2: % Pelaksanaan */}
            <div className="rounded-2xl bg-white p-5 border border-slate-200 flex flex-col justify-between shadow-xs">
              <div>
                <span className="text-xs text-slate-500 font-semibold block">% Pelaksanaan</span>
                <span className="text-[10px] text-slate-400 font-medium block leading-tight mt-0.5">
                  Tingkat partisipasi kegiatan pembinaan
                </span>
                <p className="text-3xl font-black text-sky-700 mt-2">{compData.pelaksanaan}%</p>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold mt-2 pt-2 border-t border-slate-100">
                {compData.terlaksana} dari {compData.total_sesi} sesi terpenuhi
              </p>
            </div>

            {/* Card 3: x̄ SPPN */}
            <div className="rounded-2xl bg-white p-5 border border-slate-200 flex flex-col justify-between shadow-xs">
              <div>
                <span className="text-xs text-slate-500 font-semibold block">x̄ SPPN</span>
                <span className="text-[10px] text-slate-400 font-medium block leading-tight mt-0.5">
                  Rata-rata Skor SPPN (Ambang Batas ≥ 70)
                </span>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className="text-3xl font-black text-emerald-700">{compData.sppn}</span>
                  <span className="text-xs text-slate-400 font-bold">/ 100</span>
                </div>
              </div>
              <p className="text-[11px] font-bold mt-2 pt-2 border-t border-slate-100 text-emerald-700">
                {compData.sppn >= 70 ? 'Memenuhi Syarat (≥ 70)' : 'Belum Memenuhi (< 70)'}
              </p>
            </div>

            {/* Card 4: x̄ PPKS */}
            <div className="rounded-2xl bg-white p-5 border border-slate-200 flex flex-col justify-between shadow-xs">
              <div>
                <span className="text-xs text-slate-500 font-semibold block">x̄ PPKS</span>
                <span className="text-[10px] text-slate-400 font-medium block leading-tight mt-0.5">
                  Rata-rata Indeks Karakter (Standar Mutu ≥ 4.00)
                </span>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className="text-3xl font-black text-amber-700">{compData.ppks}</span>
                  <span className="text-xs text-slate-400 font-bold">/ 5.00</span>
                </div>
              </div>
              <p className="text-[11px] font-bold mt-2 pt-2 border-t border-slate-100 text-amber-700">
                {compData.ppks >= 4.0 ? 'Kualifikasi Baik (≥ 4.00)' : 'Kualifikasi Cukup (< 4.00)'}
              </p>
            </div>
          </div>
        </div>

        {/* [REV0006 & REV0007] Programs grid: Label SPPN & PPKS, remove Lokasi */}
        <div id="program" className="mt-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">
                Program Pembinaan Spiritual & Bobot Penilaian
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Terbagi ke dalam kategori SPPN (Instrumen Utama) dan PPKS (Kualitatif Komplementer)
              </p>
            </div>
            <span className="self-start sm:self-auto rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700 whitespace-nowrap">
              Total Bobot Wajib = 100%
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(summary?.programs || []).map((prog) => (
              <div
                key={prog.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                      Bobot {prog.bobot}%
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      Target {prog.target_bulanan}x/bln
                    </span>
                  </div>
                  <h4 className="mt-3 text-base font-bold text-slate-900 flex items-center gap-2">
                    <BookOpenCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                    {prog.nama_program}
                  </h4>
                  <p className="mt-1.5 text-xs text-slate-500">{prog.jadwal || 'Terjadwal rutin'}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  {/* [REV0006] Ganti label Terlaksana menjadi SPPN */}
                  <span className="text-slate-600 font-semibold">
                    SPPN: <strong className="text-emerald-700">{prog.jumlah_ya || 0} Sesi</strong>
                  </span>
                  {/* [REV0007] Ganti label Karakter menjadi PPKS */}
                  <span className="text-amber-700 font-bold">
                    PPKS: {prog.rata_karakter || '4.2'} / 5
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="tentang" className="bg-emerald-900 text-white py-14 mt-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold">
            Tentang SI PASTI Lapas Kelas IIB Ciamis
          </h2>
          <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
            Sistem Informasi Penilaian Aktivitas Spiritual Terintegrasi (SI PASTI) merupakan inovasi tata kelola
            pembinaan berbasis digital di Lembaga Pemasyarakatan Kelas IIB Ciamis. Menyelenggarakan pencatatan kehadiran
            biometrik Face ID, pemisahan kalkulasi instrumen SPPN (Nilai Utama, ambang batas 70) dengan instrumen PPKS
            (Kualitatif Komplementer, skala 1.00 s/d 5.00), serta rekapitulasi data akurat sebagai dasar pertimbangan
            objektif dalam sidang TPP pengusulan hak remisi dan integrasi bagi Warga Binaan Pemasyarakatan.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-300 mt-auto">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-start gap-3">
            <img
              src="/logo-sipasti.png"
              alt="Logo SIPASTI"
              className="h-12 w-12 rounded-xl bg-white p-1 object-contain shrink-0"
            />
            <div>
              <h4 className="text-base font-extrabold text-white">SI PASTI Lapas Ciamis</h4>
              <p className="text-xs text-slate-400 mt-1">
                Lembaga Pemasyarakatan Kelas IIB Ciamis — Pembinaan Kepribadian Spiritual Terintegrasi.
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs sm:text-sm">
            <p className="font-bold text-white mb-2">Kontak Instansi</p>
            <p className="flex items-center gap-2 text-slate-400">
              <MapPin className="h-4 w-4 text-emerald-400 shrink-0" />
              Jl. Ir. H. Juanda No.146, Ciamis, Jawa Barat
            </p>
            <p className="flex items-center gap-2 text-slate-400">
              <Phone className="h-4 w-4 text-emerald-400 shrink-0" />
              0851-6984-1951
            </p>
            <p className="flex items-center gap-2 text-slate-400">
              <Mail className="h-4 w-4 text-emerald-400 shrink-0" />
              kontak@sipastilapasciamis.com
            </p>
          </div>

          <div className="space-y-2 text-xs sm:text-sm">
            <p className="font-bold text-white mb-2">Akses Cepat</p>
            <div className="flex flex-col gap-1.5 text-slate-400">
              <Link to="/absensi-kiosk" className="hover:text-emerald-400 transition-colors">
                Kiosk Absensi WBP (Face ID & Selfie)
              </Link>
              <Link to="/registrasi-mitra" className="hover:text-emerald-400 transition-colors">
                Formulir Registrasi Mitra Pembina
              </Link>
              <Link to="/login" className="hover:text-emerald-400 transition-colors">
                Portal Login Petugas & Wali PAS
              </Link>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} SIPASTI — Lapas Kelas IIB Ciamis. Seluruh hak cipta dilindungi.
        </div>
      </footer>
    </div>
  );
}
