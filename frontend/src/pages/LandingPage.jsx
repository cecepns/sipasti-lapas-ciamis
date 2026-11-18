import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Handshake,
  LogIn,
  Mail,
  MapPin,
  Phone,
  ScanFace,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { request } from '@/utils/request';
import { API_ENDPOINTS } from '@/utils/endpoints';
import { DateRangeFilter } from '@/components/common/DateRangeFilter';
import { formatNumber, toIsoDate } from '@/utils/formatters';

export function LandingPage() {
  const [summary, setSummary] = useState(null);
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const res = await request.get(API_ENDPOINTS.PUBLIC.SUMMARY, {
          startDate: toIsoDate(dateRange.startDate),
          endDate: toIsoDate(dateRange.endDate),
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
  }, [dateRange]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src="/logo-kementerian.png"
              alt="Logo Kementerian Pemasyarakatan"
              className="h-10 w-10 rounded-xl object-contain bg-white border border-slate-100 p-0.5 shadow-xs"
            />
            <img
              src="/logo-sipasti.png"
              alt="Logo SIPASTI"
              className="h-10 w-10 rounded-xl object-contain bg-white border border-emerald-100 p-0.5 shadow-xs"
            />
            <div>
              <span className="block text-lg font-extrabold tracking-tight text-emerald-700 leading-none">
                SIPASTI
              </span>
              <span className="block text-[11px] font-semibold text-slate-500 mt-0.5">
                Lapas Kelas IIB Ciamis
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <a href="#ringkasan" className="hover:text-emerald-700 transition-colors">
              Ringkasan Dasbor
            </a>
            <a href="#program" className="hover:text-emerald-700 transition-colors">
              Program Spiritual
            </a>
            <Link to="/panduan" className="hover:text-emerald-700 transition-colors">
              Buku Panduan
            </Link>
            <Link to="/registrasi-mitra" className="hover:text-emerald-700 transition-colors">
              Registrasi Mitra
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/absensi-kiosk"
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs sm:text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              <ScanFace className="h-4 w-4" />
              <span className="hidden sm:inline">Absensi Face ID</span>
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-700 transition-colors"
            >
              <LogIn className="h-4 w-4" />
              <span>Masuk Portal</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.16),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.22),transparent_45%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3.5 py-1.5 text-xs font-semibold text-emerald-200">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                Kementerian Imigrasi & Pemasyarakatan RI — Lapas Kelas IIB Ciamis
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                Sistem Informasi Penilaian Aktivitas Spiritual Terintegrasi{' '}
                <span className="text-amber-300">(SI PASTI)</span>
              </h1>

              <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-2xl">
                Platform digital terpadu untuk mencatat kehadiran biometrik Face ID, mengevaluasi
                penilaian pembinaan kepribadian spiritual berbasis instrumen SPPN & PPKS, serta
                menyajikan rapor objektif berbasis data sebagai dasar pengusulan hak remisi dan
                integrasi Warga Binaan Pemasyarakatan.
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
                  Dasbor Petugas & Pimpinan
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
                      SPPN • PPKS • Face ID • PDF Rapor
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-5">
                  {[
                    { icon: ScanFace, title: 'Absensi Face ID', desc: 'Verifikasi wajah & selfie kamera' },
                    { icon: ClipboardCheck, title: 'SPPN & PPKS', desc: 'Skor berbobot & terukur' },
                    { icon: FileText, title: 'Export PDF Resmi', desc: 'Rapor WBP & rekapitulasi' },
                    { icon: Handshake, title: 'Kolaborasi Mitra', desc: 'Wali PAS, Kemenag & Pesantren' },
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

      {/* Live Public Dashboard Preview */}
      <section id="ringkasan" className="mx-auto max-w-7xl w-full px-4 py-12 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Transparansi Pembinaan Berbasis Data
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
              Ringkasan Kinerja Pembinaan Spiritual
            </h2>
          </div>
          <DateRangeFilter
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onChange={setDateRange}
            placeholder="Filter rentang waktu..."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: 'Warga Binaan Aktif',
              value: loading ? '...' : formatNumber(summary?.wbp_aktif ?? 0),
              sub: `Total terdaftar: ${formatNumber(summary?.total_wbp ?? 0)} WBP`,
              icon: Users,
              color: 'bg-emerald-50 text-emerald-700',
            },
            {
              label: 'Tingkat Pelaksanaan',
              value: loading ? '...' : `${summary?.tingkat_pelaksanaan ?? 0}%`,
              sub: `${formatNumber(summary?.terlaksana ?? 0)} dari ${formatNumber(summary?.total_penilaian ?? 0)} sesi`,
              icon: CheckCircle2,
              color: 'bg-sky-50 text-sky-700',
            },
            {
              label: 'Rata-rata Nilai Karakter',
              value: loading ? '...' : `${summary?.rata_karakter ?? 0} / 5`,
              sub: `Skor konversi: ${summary?.rata_skor ?? 0} / 100`,
              icon: Award,
              color: 'bg-amber-50 text-amber-700',
            },
            {
              label: 'Asesor Pembinaan',
              value: loading ? '...' : formatNumber((summary?.total_walipas ?? 0) + (summary?.total_mitra ?? 0)),
              sub: `${summary?.total_walipas ?? 0} Wali PAS • ${summary?.total_mitra ?? 0} Mitra`,
              icon: Handshake,
              color: 'bg-purple-50 text-purple-700',
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">{card.label}</span>
                  <div className={`rounded-xl p-2 ${card.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-extrabold text-slate-900">{card.value}</p>
                <p className="mt-1 text-xs text-slate-500">{card.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Programs grid */}
        <div id="program" className="mt-12">
          <h3 className="text-xl font-extrabold text-slate-900 mb-4">
            Program Pembinaan Spiritual & Bobot Penilaian
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(summary?.programs || []).map((prog) => (
              <div
                key={prog.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between"
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
                  <p className="text-xs text-slate-400 mt-0.5">{prog.lokasi}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Terlaksana: <strong className="text-slate-800">{prog.jumlah_ya || 0}</strong></span>
                  <span className="text-emerald-700 font-bold">Karakter {prog.rata_karakter || '-'} / 5</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="tentang" className="bg-emerald-900 text-white py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold">
            Tentang SI PASTI Lapas Kelas IIB Ciamis
          </h2>
          <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
            Sistem Informasi Penilaian Aktivitas Spiritual Terintegrasi (SI PASTI) merupakan sistem
            berbasis digital di Lembaga Pemasyarakatan (Lapas) Kelas IIB Ciamis yang dirancang untuk
            mengelola, mencatat, dan memantau kegiatan pembinaan kepribadian spiritual warga binaan
            secara terstruktur, terukur, dan transparan. Melalui pengintegrasian pendataan aktivitas
            harian, absensi biometrik Face ID, penilaian perkembangan perilaku (SPPN & PPKS), serta
            keterlibatan mitra keagamaan, sistem ini menghadirkan rekapitulasi data akurat berbasis
            bukti (data-driven) sebagai pertimbangan objektif pengusulan hak remisi dan integrasi.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-300 mt-auto">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
                Formulir Registrasi Mitra Keagamaan
              </Link>
              <Link to="/login" className="hover:text-emerald-400 transition-colors">
                Portal Login Petugas, Wali PAS & Pimpinan
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
