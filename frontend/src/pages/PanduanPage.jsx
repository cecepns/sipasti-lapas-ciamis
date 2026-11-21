import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileDown,
  FileText,
  Filter,
  HelpCircle,
  Info,
  Layers,
  LayoutDashboard,
  PieChart,
  ScanFace,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { INSTRUMEN_INFO, REKOMENDASI_RULES } from '@/utils/formatters';
import { exportBukuPanduanPdf } from '@/utils/pdfGenerator';

const CHAPTERS = [
  { id: 'konsep', label: '1. Rumus SPPN & PPKS', icon: BookOpen },
  { id: 'rekomendasi', label: '2. Matriks 3 Level Kualifikasi', icon: ShieldCheck },
  { id: 'input', label: '3. SOP & Penginputan Data', icon: ClipboardCheck },
  { id: 'dashboard', label: '4. Panduan Membaca Dashboard Analitik', icon: LayoutDashboard },
  { id: 'peran', label: '5. Panduan Peran Asesor & Petugas', icon: Users },
  { id: 'faceid', label: '6. Absensi Biometrik Face ID', icon: ScanFace },
  { id: 'laporan', label: '7. Standarisasi Laporan & Kop PDF', icon: CalendarRange },
];

const ROLE_GUIDES = [
  {
    role: 'Admin SIPASTI',
    color: 'border-purple-200 bg-purple-50/50',
    badge: 'bg-purple-600 text-white',
    steps: [
      'Kelola Master Data WBP (SDP) di menu Data WBP, lengkapi biodata, pas foto profil 3x4, dan penugasan Wali PAS.',
      'Atur Program Pembinaan Spiritual di menu Program Pembinaan: pastikan kategori tepat (SPPN / PPKS) dan total bobot aktif tepat 100%.',
      'Kelola akun Wali PAS, Kasubsi, Kasi Binadik, dan Ka. Lapas di menu Manajemen Akun.',
      'Setujui pendaftaran Mitra Keagamaan di menu Data Mitra agar akun asesor otomatis aktif.',
    ],
  },
  {
    role: 'Wali PAS (Wali Pemasyarakatan)',
    color: 'border-emerald-200 bg-emerald-50/50',
    badge: 'bg-emerald-600 text-white',
    steps: [
      'Daftarkan wajah (Enroll Face ID) WBP binaannya melalui tombol Face ID di halaman Data WBP.',
      'Input data kegiatan spiritual di menu Penilaian: kategori instrumen otomatis terdeteksi dari program yang dipilih (SPPN atau PPKS).',
      'Catat kehadiran atau pantau absensi biometrik Face ID di menu Absensi Face ID.',
      'Cek perkembangan WBP binaan di Dashboard WBP dan cetak Rapor Profil PDF resmi.',
    ],
  },
  {
    role: 'Mitra Pembina Spiritual (Kemenag / Pesantren / Rohaniwan)',
    color: 'border-amber-200 bg-amber-50/50',
    badge: 'bg-amber-600 text-white',
    steps: [
      'Lakukan pendaftaran melalui Formulir Registrasi Mitra dan tunggu verifikasi Admin Lapas.',
      'Setelah akun aktif, masuk ke portal SIPASTI untuk menginput hasil penilaian kehadiran serta rubrik karakter spiritual 5 sub-indikator (skala 1-5).',
      'Pantau capaian pembinaan pada Dashboard Program dan Dashboard Kinerja Asesor.',
    ],
  },
  {
    role: 'Kasubsi Reg & Bimkemas',
    color: 'border-sky-200 bg-sky-50/50',
    badge: 'bg-sky-600 text-white',
    steps: [
      'Buka menu Penilaian untuk meninjau dan memvalidasi respon input dari Wali PAS & Mitra.',
      'Klik tombol Verifikasi Kasubsi (ikon perisai) untuk menetapkan status "Terverifikasi" atau "Perlu Revisi" disertai catatan pembinaan.',
      'Gunakan menu Rekap Penilaian untuk mengevaluasi akumulasi capaian Triwulan dan mengklik jumlah WBP untuk melihat rincian nama WBP.',
    ],
  },
  {
    role: 'Kasi Binadik & Kepala Lapas (Ka. Lapas)',
    color: 'border-slate-300 bg-slate-100/70',
    badge: 'bg-slate-900 text-amber-300',
    steps: [
      'Pantau Dashboard Umum dengan analisis lengkap: 8 Scorecard utama, Donut Chart sebaran, Scatter Plot SPPN vs PPKS, Pareto Chart hambatan, serta tren performa triwulan.',
      'Buka Dashboard WBP untuk meninjau Evaluasi Kualifikasi Akhir 3 Level Predikat (Kualifikasi 2, 1, atau 0).',
      'Unduh Rapor PDF resmi berkop circular Kemenimpas baku di atas garis pembatas dan Header SIPASTI di bawahnya sebagai berkas sidang TPP.',
    ],
  },
];

export function PanduanPage({ isPublic = false }) {
  const [activeTab, setActiveTab] = useState('konsep');
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      await exportBukuPanduanPdf();
      toast.success('Buku Panduan SIPASTI (PDF) berhasil diunduh');
    } catch {
      toast.error('Gagal membuat PDF Buku Panduan');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className={isPublic ? 'min-h-screen bg-slate-50 py-8 px-4' : ''}>
      <div className={isPublic ? 'mx-auto max-w-6xl space-y-6' : 'space-y-6'}>
        {isPublic && (
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda SIPASTI
          </Link>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Buku Panduan Resmi SIPASTI
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Standar Operasional Prosedur, Metodologi Formula SPPN & Skala PPKS, serta Panduan Peran
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a
              href="/sop-sipasti.pdf"
              download="SOP SISTEM PENILAIAN AKTIVITAS SPIRITUAL TERINTEGRASI (SI PASTI).pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-amber-700 transition-colors"
            >
              <FileDown className="h-4 w-4" />
              Unduh Dokumen SOP (PDF)
            </a>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-60 transition-colors"
            >
              <FileDown className="h-4 w-4" />
              {downloading ? 'Menyiapkan PDF...' : 'Unduh Buku Panduan (PDF)'}
            </button>
          </div>
        </div>

        {/* Chapter Navigation */}
        <div className="flex flex-wrap gap-2">
          {CHAPTERS.map((ch) => {
            const Icon = ch.icon;
            const active = activeTab === ch.id;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => setActiveTab(ch.id)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                  active
                    ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {ch.label}
              </button>
            );
          })}
        </div>

        {/* Chapter Contents */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
          {/* [REV0041] BAB 1: RUMUS SPPN & SKALA PPKS SESUAI PDF 1 */}
          {activeTab === 'konsep' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Bab 1: Konsep & Formula Resmi Perhitungan SPPN & PPKS
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  SIPASTI Lapas Kelas IIB Ciamis menerapkan pemisahan kalkulasi yang tegas antara instrumen kuantitatif{' '}
                  <strong>SPPN (Nilai Utama)</strong> dan instrumen kualitatif{' '}
                  <strong>PPKS (Kualitatif Komplementer)</strong>. Keduanya memiliki fungsi dan skala penilaian yang berbeda.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* SPPN Formula Box */}
                <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/50 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="rounded-xl bg-emerald-700 px-3 py-1 text-xs font-black text-white tracking-wide">
                      SPPN • NILAI UTAMA
                    </span>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                      Ambang Batas ≥ 70
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-emerald-950">
                      Sistem Penilaian Pembinaan Narapidana
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Instrumen kuantitatif utama pemenuhan syarat substantif hak integrasi (PB, CB, CMB) dan remisi.
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-4 border border-emerald-200 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                      Formula Perhitungan SPPN Resmi:
                    </span>
                    <div className="bg-slate-900 text-emerald-300 font-mono text-sm p-3 rounded-lg text-center">
                      Nilai SPPN = Σ [ (Ri / Targeti) × Wi ]
                    </div>
                    <ul className="text-xs text-slate-600 space-y-1 pt-1 list-disc pl-4">
                      <li><strong>Ri</strong>: Realisasi jumlah sesi kehadiran WBP pada program ke-i</li>
                      <li><strong>Targeti</strong>: Target sesi bulanan yang ditetapkan pada program ke-i</li>
                      <li><strong>Wi</strong>: Bobot persentase program ke-i (Total Σ Wi harus tepat 100%)</li>
                    </ul>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-700">
                    <p className="font-bold text-emerald-900">Klasifikasi Kualifikasi SPPN:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-white p-2.5 border border-emerald-200">
                        <span className="font-bold text-emerald-800 block">Kualifikasi 1 (Baik)</span>
                        <span className="text-[11px] text-slate-500">Nilai SPPN ≥ 70 (Memenuhi Syarat)</span>
                      </div>
                      <div className="rounded-lg bg-white p-2.5 border border-rose-200">
                        <span className="font-bold text-rose-800 block">Kualifikasi 0 (Kurang)</span>
                        <span className="text-[11px] text-slate-500">Nilai SPPN &lt; 70 (Tidak Memenuhi Syarat)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PPKS Formula Box */}
                <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/50 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="rounded-xl bg-amber-600 px-3 py-1 text-xs font-black text-white tracking-wide">
                      PPKS • KOMPLEMENTER
                    </span>
                    <span className="text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
                      Standar Mutu ≥ 4.00
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-amber-950">
                      Penilaian Pembinaan Kepribadian Spiritual
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Instrumen pemantauan kualitatif penghayatan spiritual melalui 5 sub-indikator karakter.
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-4 border border-amber-200 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                      Skala & 5 Sub-Indikator Karakter:
                    </span>
                    <div className="bg-slate-900 text-amber-300 font-mono text-sm p-3 rounded-lg text-center">
                      Skala Indeks Komposit: 1.00 s/d 5.00
                    </div>
                    <ol className="text-xs text-slate-600 space-y-1 pt-1 list-decimal pl-4">
                      <li>Kesadaran & Praktik Ibadah Rutin</li>
                      <li>Pemahaman Nilai Keagamaan</li>
                      <li>Ketaatan Terhadap Tata Tertib & Disiplin</li>
                      <li>Perilaku Keseharian & Akhlak Mulia</li>
                      <li>Hubungan Sosial & Toleransi Antar WBP</li>
                    </ol>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-700">
                    <p className="font-bold text-amber-900">Klasifikasi Kualifikasi PPKS:</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      <div className="rounded-lg bg-white p-2 border border-emerald-200 text-center">
                        <span className="font-bold text-emerald-800 text-xs block">Kualifikasi 2</span>
                        <span className="text-[10px] text-slate-500">Baik (≥ 4.00)</span>
                      </div>
                      <div className="rounded-lg bg-white p-2 border border-amber-200 text-center">
                        <span className="font-bold text-amber-800 text-xs block">Kualifikasi 1</span>
                        <span className="text-[10px] text-slate-500">Cukup (3.00-3.99)</span>
                      </div>
                      <div className="rounded-lg bg-white p-2 border border-rose-200 text-center">
                        <span className="font-bold text-rose-800 text-xs block">Kualifikasi 0</span>
                        <span className="text-[10px] text-slate-500">Kurang (&lt; 3.00)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* [REV0041] BAB 2: 3 LEVEL PREDIKAT KUALIFIKASI AKHIR SESUAI PDF 1 */}
          {activeTab === 'rekomendasi' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Bab 2: Matriks Keputusan Evaluasi Kualifikasi Akhir (3 Level Predikat)
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Kualifikasi akhir pengusulan hak Warga Binaan Pemasyarakatan ditentukan secara objektif
                  berdasarkan matriks kombinasi status SPPN dan PPKS:
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                {/* Level 2 */}
                <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/70 p-5 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-700 text-white font-black text-sm">
                        2
                      </span>
                      <span className="rounded-full bg-emerald-200/80 text-emerald-900 font-extrabold text-[11px] px-2.5 py-0.5">
                        SPPN ≥ 70 & PPKS ≥ 4.00
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-emerald-950 mt-3">
                      Memenuhi Syarat dan Direkomendasikan
                    </h3>

                    <p className="mt-2 text-xs leading-relaxed text-slate-700 bg-white/80 p-3 rounded-xl border border-emerald-200 font-medium">
                      &quot;Nilai telah memenuhi seluruh standar penilaian dan pengajuan berhak mendapatkan rekomendasi.&quot;
                    </p>
                  </div>

                  <div className="pt-3 border-t border-emerald-200 text-xs text-emerald-800 font-bold">
                    Hak Usulan: Berhak mendapatkan rekomendasi penuh tanpa catatan.
                  </div>
                </div>

                {/* Level 1 */}
                <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/70 p-5 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-600 text-white font-black text-sm">
                        1
                      </span>
                      <span className="rounded-full bg-amber-200/80 text-amber-900 font-extrabold text-[11px] px-2.5 py-0.5">
                        SPPN ≥ 70 & PPKS &lt; 4.00
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-amber-950 mt-3">
                      Memenuhi Syarat dengan Pertimbangan
                    </h3>

                    <p className="mt-2 text-xs leading-relaxed text-slate-700 bg-white/80 p-3 rounded-xl border border-amber-200 font-medium">
                      &quot;Memenuhi syarat dasar penilaian dan berhak mendapatkan rekomendasi, namun dengan pertimbangan dan catatan khusus.&quot;
                    </p>
                  </div>

                  <div className="pt-3 border-t border-amber-200 text-xs text-amber-800 font-bold">
                    Hak Usulan: Berhak diusulkan dengan didikan spiritual lanjutan.
                  </div>
                </div>

                {/* Level 0 */}
                <div className="rounded-2xl border-2 border-rose-300 bg-rose-50/70 p-5 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-600 text-white font-black text-sm">
                        0
                      </span>
                      <span className="rounded-full bg-rose-200/80 text-rose-900 font-extrabold text-[11px] px-2.5 py-0.5">
                        SPPN &lt; 70
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-rose-950 mt-3">
                      Tidak Memenuhi Syarat
                    </h3>

                    <p className="mt-2 text-xs leading-relaxed text-slate-700 bg-white/80 p-3 rounded-xl border border-rose-200 font-medium">
                      &quot;Nilai belum memenuhi syarat dasar penilaian. Pengajuan tidak mendapatkan rekomendasi.&quot;
                    </p>
                  </div>

                  <div className="pt-3 border-t border-rose-200 text-xs text-rose-800 font-bold">
                    Hak Usulan: Pengajuan ditolak / belum berhak mendapatkan rekomendasi.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BAB 3: TATA CARA PENGINPUTAN DATA (STEP-BY-STEP SOP) */}
          {activeTab === 'input' && (
            <div className="space-y-6">
              <div>
                <span className="rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold px-3 py-1 border border-emerald-300">
                  SOP &amp; Panduan Teknis
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 mt-2">
                  Bab 3: Standar Operasional Prosedur (SOP) &amp; Tata Cara Penginputan Data
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Petunjuk praktis tahap demi tahap bagi Wali PAS dan Mitra Keagamaan dalam mencatat kehadiran,
                  menginput alasan ketidakhadiran, mengevaluasi 5 sub-indikator PPKS, serta mekanisme verifikasi oleh Kasubsi.
                </p>
              </div>

              {/* Banner Unduh Dokumen SOP Resmi */}
              <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50/50 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-sm">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Dokumen Asli SOP SIPASTI Lapas Kelas IIB Ciamis
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Standar Operasional Prosedur resmi berformat PDF yang disahkan oleh Lapas Kelas IIB Ciamis.
                    </p>
                  </div>
                </div>

                <a
                  href="/sop-sipasti.pdf"
                  download="SOP SISTEM PENILAIAN AKTIVITAS SPIRITUAL TERINTEGRASI (SI PASTI).pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-amber-700 transition-colors shrink-0 w-full sm:w-auto"
                >
                  <FileDown className="h-4 w-4" />
                  Unduh Dokumen SOP Resmi (PDF)
                </a>
              </div>

              {/* Step 1: Penilaian SPPN & PPKS */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-700 text-white font-extrabold text-sm">
                    1
                  </span>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Penginputan Formulir Penilaian Harian (SPPN &amp; PPKS)
                    </h3>
                    <p className="text-xs text-slate-500">Menu: <strong>Penilaian SPPN &amp; PPKS</strong> (/app/penilaian)</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 text-xs sm:text-sm text-slate-700">
                  <div className="rounded-xl bg-white p-4 border border-slate-200 space-y-2">
                    <p className="font-bold text-emerald-800 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" /> A. Program SPPN (Nilai Utama)
                    </p>
                    <ol className="list-decimal pl-4 space-y-1.5 text-xs text-slate-600">
                      <li>Buka menu <strong>Penilaian</strong>, klik tombol <strong>+ Input Penilaian</strong>.</li>
                      <li>Pilih nama WBP binaan dan pilih program spiritual berkategori SPPN (misal: <em>Sholat Berjamaah, Tahsin Quran</em>).</li>
                      <li>Pilih status pelaksanaan: <strong>Ya</strong> (Hadir memenuhi sesi) atau <strong>Tidak</strong> (Tidak hadir).</li>
                      <li>
                        <strong className="text-rose-700 font-bold">Wajib Diperhatikan:</strong> Jika memilih <em>Tidak</em>, Anda wajib memilih salah satu <strong>Alasan Ketidakhadiran</strong>:
                        <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[11px] text-slate-500">
                          <li>Sakit / Diperiksa di Klinik</li>
                          <li>Sidang Pengadilan</li>
                          <li>Kunjungan Besuk Keluarga</li>
                          <li>Piket Kebersihan Lingkungan</li>
                          <li>Dispensasi Khusus Petugas</li>
                        </ul>
                      </li>
                      <li>Data alasan ketidakhadiran otomatis dikompilasi ke dalam <strong>Pareto Chart Hambatan</strong> di Dashboard.</li>
                    </ol>
                  </div>

                  <div className="rounded-xl bg-white p-4 border border-slate-200 space-y-2">
                    <p className="font-bold text-amber-800 flex items-center gap-1.5">
                      <Award className="h-4 w-4 text-amber-600" /> B. Program PPKS (Kualitatif Komplementer)
                    </p>
                    <ol className="list-decimal pl-4 space-y-1.5 text-xs text-slate-600">
                      <li>Pilih nama WBP dan program spiritual berkategori PPKS (misal: <em>Kajian Fiqih, Konseling Rohani, PHBI</em>).</li>
                      <li>Sistem otomatis menampilkan rubrik penilaian <strong>5 Sub-Indikator Karakter Spiritual (Skala 1 - 5)</strong>:
                        <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[11px] text-slate-500">
                          <li><strong>Sub 1 (Ibadah):</strong> Praktik dan ketertiban ibadah wajib &amp; sunnah.</li>
                          <li><strong>Sub 2 (Pemahaman):</strong> Daya serap materi aqidah dan nilai moral.</li>
                          <li><strong>Sub 3 (Disiplin):</strong> Ketaatan aturan, hadir tepat waktu, tata tertib.</li>
                          <li><strong>Sub 4 (Akhlak):</strong> Sopan santun, tutur kata, adab pergaulan.</li>
                          <li><strong>Sub 5 (Sosial):</strong> Sikap rukun, toleransi, tolong-menolong antar WBP.</li>
                        </ul>
                      </li>
                      <li>Beri skor (1 = Sangat Kurang, 2 = Kurang, 3 = Cukup, 4 = Baik, 5 = Sangat Baik).</li>
                      <li>Sistem otomatis merata-ratakan skor menjadi nilai komposit indeks PPKS (skala 1.00 - 5.00).</li>
                    </ol>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
                  <Info className="h-4 w-4 shrink-0 text-emerald-700" />
                  <span>
                    Setelah mengklik <strong>Simpan Penilaian</strong>, data tercatat dalam sistem dengan status <em>Menunggu Verifikasi</em> sampai divalidasi oleh Kasubsi Reg &amp; Bimkemas.
                  </span>
                </div>
              </div>

              {/* Step 2: Absensi Face ID */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-700 text-white font-extrabold text-sm">
                    2
                  </span>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Tata Cara Absensi Mandiri Face ID &amp; Selfie WBP
                    </h3>
                    <p className="text-xs text-slate-500">Menu: <strong>Kiosk Absensi Face ID</strong> (/absensi-kiosk) atau <strong>Absensi Face ID</strong> (/app/absensi)</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 text-xs text-slate-600">
                  <div className="rounded-xl bg-white p-3.5 border border-slate-200 space-y-1">
                    <span className="font-bold text-indigo-800 block text-xs">Langkah 1: Pilih WBP &amp; Kegiatan</span>
                    <p>Ketikkan nama atau nomor registrasi WBP pada kotak pencarian cepat, lalu pilih program ibadah yang sedang berlangsung.</p>
                  </div>
                  <div className="rounded-xl bg-white p-3.5 border border-slate-200 space-y-1">
                    <span className="font-bold text-indigo-800 block text-xs">Langkah 2: Verifikasi Wajah</span>
                    <p>WBP menghadap kamera tablet/HP. Sistem memindai 128 titik biometrik wajah dan mencocokkan kemiripan secara instan.</p>
                  </div>
                  <div className="rounded-xl bg-white p-3.5 border border-slate-200 space-y-1">
                    <span className="font-bold text-indigo-800 block text-xs">Langkah 3: Konfirmasi Presensi</span>
                    <p>Klik tombol <em>Kirim Absensi</em>. Presensi otomatis tercatat, foto selfie tersimpan, dan memutakhirkan persentase kehadiran SPPN.</p>
                  </div>
                </div>
              </div>

              {/* Step 3: Verifikasi Kasubsi */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-700 text-white font-extrabold text-sm">
                    3
                  </span>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Tata Cara Verifikasi &amp; Validasi oleh Kasubsi Reg &amp; Bimkemas
                    </h3>
                    <p className="text-xs text-slate-500">Menu: <strong>Penilaian SPPN &amp; PPKS</strong> (/app/penilaian)</p>
                  </div>
                </div>

                <div className="rounded-xl bg-white p-4 border border-slate-200 space-y-2 text-xs sm:text-sm text-slate-700">
                  <p>
                    Sebagai pejabat pemeriksa mutu penilaian, <strong>Kasubsi Reg &amp; Bimkemas</strong> bertanggung jawab memastikan data akurat:
                  </p>
                  <ol className="list-decimal pl-4 space-y-1.5 text-xs text-slate-600">
                    <li>Gunakan filter status: pilih <strong>Menunggu Verifikasi</strong> untuk menyaring entri yang baru masuk.</li>
                    <li>Periksa kesesuaian kehadiran dan skor karakter yang diinput oleh Wali PAS atau Mitra Keagamaan.</li>
                    <li>Klik tombol <strong>Aksi Verifikasi (Ikon Perisai)</strong> pada baris data penilaian.</li>
                    <li>
                      Pilih keputusan:
                      <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[11px]">
                        <li><strong className="text-emerald-700">Terverifikasi:</strong> Penilaian sah dan langsung diperhitungkan dalam akumulasi Rapor Triwulan.</li>
                        <li><strong className="text-rose-700">Perlu Revisi:</strong> Penilaian dikembalikan kepada asesor disertai catatan perbaikan yang wajib ditindaklanjuti.</li>
                      </ul>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* BAB 4: PANDUAN MEMBACA 4 DASBOR ANALITIK (LENGKAP & DETAIL) */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <span className="rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold px-3 py-1 border border-emerald-300">
                  Panduan Analitik &amp; Visualisasi
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 mt-2">
                  Bab 4: Panduan Membaca &amp; Menginterpretasikan Dashboard Analitik
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  SIPASTI menyajikan 4 modul dashboard terpadu dalam 1 halaman: Dashboard Umum, Dashboard &amp; Profil WBP,
                  Dashboard Program Pembinaan, dan Dashboard Kinerja Asesor. Pengguna dapat berganti tampilan cukup dengan 1 klik tab navigasi di atas layar.
                </p>
              </div>

              {/* 1. DASHBOARD UMUM */}
              <div className="rounded-2xl border-2 border-emerald-300 bg-white p-6 space-y-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className="h-5 w-5 text-emerald-700" />
                    <h3 className="text-base font-extrabold text-slate-900">
                      1. Dashboard Umum (Executive Overview Lapas Ciamis)
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    Tab: /app/dashboard?tab=umum
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Dashboard Umum dirancang untuk Kepala Lapas, Kasi Binadik, dan Kasubsi guna memantau kesehatan program pembinaan spiritual
                  secara holistik dalam satu layar berjenjang:
                </p>

                {/* Filter Bar */}
                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 space-y-1.5 text-xs">
                  <span className="font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Filter className="h-3.5 w-3.5 text-emerald-700" /> Filter Bar Global (Atas)
                  </span>
                  <p className="text-slate-600">
                    Memfilter seluruh visualisasi berdasarkan: <strong>Pilih Triwulan</strong> (TW-IV Berjalan, TW-III, TW-II, TW-I),{' '}
                    <strong>Pilih Program</strong>, <strong>Pilih Trend</strong> (Semua, Meningkat, Stabil, Menurun),{' '}
                    <strong>Pilih Kualifikasi Akhir</strong> (Semua, Kualifikasi 2, Kualifikasi 1, Kualifikasi 0),{' '}
                    <strong>Pilih Tipe Asesor</strong> (Semua, Wali PAS, Mitra), dan <strong>Pilih Bulan</strong>.
                  </p>
                </div>

                {/* 8 Scorecards */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-emerald-700" /> A. Bagian Utama: 8 Scorecard Capaian &amp; Tren
                  </h4>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-xs">
                    <div className="rounded-xl border border-slate-200 p-3 bg-white">
                      <span className="font-bold text-slate-800 block">WBP Aktif</span>
                      <p className="text-slate-500 mt-0.5">Jumlah total WBP yang aktif terbina. Dilengkapi badge tren vs trimester sebelumnya.</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3 bg-white">
                      <span className="font-bold text-slate-800 block">Program Aktif</span>
                      <p className="text-slate-500 mt-0.5">Jumlah program spiritual yang aktif berjalan dengan target bulanan terpenuhi.</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3 bg-white">
                      <span className="font-bold text-slate-800 block">Walipas &amp; Mitra Aktif</span>
                      <p className="text-slate-500 mt-0.5">Jumlah petugas Wali PAS dan narasumber Mitra Pembina yang aktif mengevaluasi.</p>
                    </div>
                    <div className="rounded-xl border border-emerald-300 p-3 bg-emerald-50/50">
                      <span className="font-bold text-emerald-900 block">Rata-rata Nilai SPPN</span>
                      <p className="text-slate-600 mt-0.5">Skor kuantitatif utama. Indikator hijau jika mencapai ambang batas ≥ 70, merah jika &lt; 70.</p>
                    </div>
                    <div className="rounded-xl border border-amber-300 p-3 bg-amber-50/50">
                      <span className="font-bold text-amber-900 block">Rata-rata Nilai PPKS</span>
                      <p className="text-slate-600 mt-0.5">Skor komposit karakter (1.00-5.00). Kategori Baik jika ≥ 4.00, Cukup jika 3.00-3.99.</p>
                    </div>
                    <div className="rounded-xl border border-emerald-300 p-3 bg-emerald-50/50">
                      <span className="font-bold text-emerald-900 block">Total Direkomendasikan</span>
                      <p className="text-slate-600 mt-0.5">Jumlah WBP yang telah meraih <em>Kualifikasi 2</em> (SPPN ≥ 70 &amp; PPKS ≥ 4.00).</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3 bg-white sm:col-span-2">
                      <span className="font-bold text-slate-800 block">Badge Perbandingan Hari Triwulan</span>
                      <p className="text-slate-500 mt-0.5">Contoh: <code>+4.2% vs TW-III (hari ke-50)</code>. Perhitungan tren diukur secara <em>like-for-like</em> pada jumlah hari berjalan yang sama antar triwulan.</p>
                    </div>
                  </div>
                </div>

                {/* Donut & Line Charts */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <PieChart className="h-4 w-4 text-emerald-700" /> B. Bagian Sekunder: Sebaran Pelaksanaan &amp; Predikat
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-3 text-xs">
                    <div className="rounded-xl border border-slate-200 p-3.5 bg-white space-y-1">
                      <strong className="text-slate-900 block font-bold">1. Sebaran Pelaksanaan (Donut)</strong>
                      <p className="text-slate-500">Menampilkan persentase kehadiran sukses (<strong>Ya</strong>) vs ketidakhadiran (<strong>Tidak</strong>) dari seluruh sesi pembinaan.</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3.5 bg-white space-y-1">
                      <strong className="text-slate-900 block font-bold">2. Sebaran Predikat (Donut)</strong>
                      <p className="text-slate-500">Memetakan proporsi WBP ke dalam 3 kelompok: <em>Direkomendasikan (Kualifikasi 2)</em>, <em>Dengan Pertimbangan (Kualifikasi 1)</em>, dan <em>Tidak Memenuhi (Kualifikasi 0)</em>.</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3.5 bg-white space-y-1">
                      <strong className="text-slate-900 block font-bold">3. Pelaksanaan Harian (Line)</strong>
                      <p className="text-slate-500">Grafik garis membandingkan ritme pelaksanaan harian triwulan berjalan terhadap triwulan sebelumnya untuk melihat konsistensi pembinaan.</p>
                    </div>
                  </div>
                </div>

                {/* Granular Analytics */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <BarChart3 className="h-4 w-4 text-emerald-700" /> C. Bagian Tambahan: Analisis Granular &amp; Diagnostik
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2 text-xs">
                    <div className="rounded-xl border border-emerald-200 p-3.5 bg-emerald-50/30 space-y-1.5">
                      <span className="font-bold text-emerald-900 flex items-center gap-1 text-xs">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-700" /> Komparasi Scatter Plot (SPPN vs PPKS)
                      </span>
                      <p className="text-slate-600 leading-relaxed">
                        Setiap titik lingkaran mewakili satu orang WBP. Sumbu X adalah nilai SPPN (0-100), Sumbu Y adalah nilai PPKS (1-5).
                        Garis putus-putus pada <strong>SPPN = 70</strong> dan <strong>PPKS = 4.00</strong> membentuk 4 kuadran:
                      </p>
                      <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-500">
                        <li><strong>Kuadran Kanan-Atas (Hijau):</strong> WBP Direkomendasikan Penuh (Kualifikasi 2).</li>
                        <li><strong>Kuadran Kanan-Bawah (Kuning):</strong> Memenuhi Syarat dengan Pertimbangan (Kualifikasi 1).</li>
                        <li><strong>Kuadran Kiri (Merah):</strong> Belum Memenuhi Syarat SPPN (Kualifikasi 0).</li>
                      </ul>
                    </div>

                    <div className="rounded-xl border border-amber-200 p-3.5 bg-amber-50/30 space-y-1.5">
                      <span className="font-bold text-amber-900 flex items-center gap-1 text-xs">
                        <BarChart3 className="h-3.5 w-3.5 text-amber-700" /> Tantangan Program (Bar Chart)
                      </span>
                      <p className="text-slate-600 leading-relaxed">
                        Menjejerkan bobot persentase program (%) dengan realisasi vs target bulanan. Program dengan bobot tinggi namun rasio realisasi rendah
                        dapat segera diidentifikasi sebagai titik rawan untuk segera dibenahi jadwalnya.
                      </p>
                    </div>

                    <div className="rounded-xl border border-rose-200 p-3.5 bg-rose-50/30 space-y-1.5">
                      <span className="font-bold text-rose-900 flex items-center gap-1 text-xs">
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-700" /> Hambatan Pelaksanaan (Pareto Chart)
                      </span>
                      <p className="text-slate-600 leading-relaxed">
                        Mengimplementasikan <strong>Prinsip Pareto 80/20</strong>: diagram batang mengurutkan alasan pembatalan/ketidakhadiran WBP
                        dari yang tertinggi (misal: Sakit, Sidang, Kunjungan) dan garis kurva persentase kumulatif 80%.
                        Membantu pimpinan fokus menyelesaikan 20% penyebab utama yang menyumbang 80% hambatan pembinaan.
                      </p>
                    </div>

                    <div className="rounded-xl border border-sky-200 p-3.5 bg-sky-50/30 space-y-1.5">
                      <span className="font-bold text-sky-900 flex items-center gap-1 text-xs">
                        <TrendingUp className="h-3.5 w-3.5 text-sky-700" /> Aktivitas Walipas vs Mitra (Line Chart)
                      </span>
                      <p className="text-slate-600 leading-relaxed">
                        Membandingkan frekuensi kegiatan yang diampu oleh Wali PAS (pembina internal Lapas) dengan Mitra Pembina Spiritual
                        (Kemenag/Pesantren/MUI) per minggu untuk memastikan kolaborasi pembinaan berjalan seimbang.
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-3.5 bg-white space-y-1.5 sm:col-span-2">
                      <span className="font-bold text-slate-900 text-xs block">
                        Tabel Ranking Predikat &amp; Tabel Tren Capaian
                      </span>
                      <p className="text-slate-600 leading-relaxed">
                        <strong>Tabel Ranking:</strong> Mengurutkan seluruh WBP dari skor tertinggi ke terendah secara transparan.<br />
                        <strong>Tabel Tren:</strong> Menampilkan pergerakan nilai SPPN dan PPKS triwulan ini dibanding triwulan lalu dengan label status:
                        <span className="inline-block mx-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">Meningkat</span>
                        <span className="inline-block mx-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">Stabil</span>
                        <span className="inline-block mx-1 px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">Menurun</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. DASBOR & PROFIL WBP */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-600" />
                    <h3 className="text-base font-extrabold text-slate-900">
                      2. Dashboard &amp; Profil Individu WBP
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                    Tab: /app/dashboard?tab=wbp
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 text-xs text-slate-600">
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 space-y-1">
                    <strong className="text-slate-800 block">Identitas &amp; Wali PAS</strong>
                    <p>Menampilkan foto profil WBP, nama, no. registrasi SDP, kamar hunian, dan petugas Wali PAS pembina.</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 space-y-1">
                    <strong className="text-slate-800 block">Kartu Kualifikasi Akhir</strong>
                    <p>Predikat resmi yang diraih WBP (Kualifikasi 2, 1, atau 0) disertai deskripsi evaluasi dan status pergerakan tren.</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 space-y-1">
                    <strong className="text-slate-800 block">SPPN vs Threshold &amp; PPKS vs Benchmark</strong>
                    <p>Progress bar memvisualisasikan jarak nilai SPPN menuju batas lulus 70, dan skor PPKS dibandingkan benchmark rata-rata Lapas.</p>
                  </div>
                </div>
              </div>

              {/* 3. DASHBOARD PROGRAM & ASESOR */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4 text-sky-600" /> 3. Dashboard Program Pembinaan
                    </h3>
                    <span className="text-[10px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-full">Tab: ?tab=program</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Menyajikan sum realisasi pelaksanaan vs target triwulan per program, horizontal bar capaian,
                    diagram stacked bulanan per kegiatan, serta tabel tingkat kepatuhan WBP pada masing-masing mata bimbingan.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                      <UserCheck className="h-4 w-4 text-violet-600" /> 4. Dashboard Kinerja Asesor
                    </h3>
                    <span className="text-[10px] font-bold text-violet-800 bg-violet-50 px-2 py-0.5 rounded-full">Tab: ?tab=asesor</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Memantau produktivitas penginputan oleh masing-masing Wali PAS dan Mitra Keagamaan,
                    rasio verifikasi Kasubsi (Terverifikasi vs Pending), dan keaktifan bimbingan rohani harian.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'peran' && (
            <div className="space-y-5">
              <h2 className="text-xl font-extrabold text-slate-900">
                Bab 5: Panduan Operasional Peran (SOP Pengguna)
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {ROLE_GUIDES.map((g) => (
                  <div key={g.role} className={`rounded-2xl border p-5 space-y-3 ${g.color}`}>
                    <span className={`inline-block rounded-lg px-3 py-1 text-xs font-extrabold ${g.badge}`}>
                      {g.role}
                    </span>
                    <ol className="space-y-2 text-xs sm:text-sm text-slate-700 list-decimal pl-4">
                      {g.steps.map((s, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {s}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'faceid' && (
            <div className="space-y-5">
              <h2 className="text-xl font-extrabold text-slate-900">
                Bab 6: Panduan Pendaftaran &amp; Absensi Biometrik Face ID
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5 space-y-2.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-indigo-800 uppercase">
                    <ScanFace className="h-4 w-4" /> Tahap 1: Pendaftaran Wajah (Enroll Face ID)
                  </span>
                  <ol className="list-decimal pl-4 space-y-2 text-xs sm:text-sm text-slate-700">
                    <li>Masuk sebagai <strong>Admin</strong> atau <strong>Wali PAS</strong>, buka menu <strong>Data WBP (SDP)</strong>.</li>
                    <li>Klik ikon <strong>Face ID</strong> di kolom aksi pada baris nama WBP.</li>
                    <li>Arahkan wajah WBP tepat di dalam bingkai oval hingga indikator berubah hijau.</li>
                    <li>Klik <strong>Pindai &amp; Simpan Wajah</strong>. Sistem menyimpan 128 titik fitur wajah sekaligus menjadikan foto tersebut sebagai <strong>Foto Profil WBP</strong> di Rapor PDF.</li>
                  </ol>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 space-y-2.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 uppercase">
                    <ClipboardCheck className="h-4 w-4" /> Tahap 2: Absensi Harian Selfie Face ID
                  </span>
                  <ol className="list-decimal pl-4 space-y-2 text-xs sm:text-sm text-slate-700">
                    <li>Buka <strong>Kiosk Absensi WBP</strong> (<code>/absensi-kiosk</code>) pada tablet/HP masjid atau menu <strong>Absensi Face ID</strong> di dalam portal.</li>
                    <li>Ketik nama atau nomor registrasi WBP (pencarian otomatis dengan debounce) dan pilih Program Kegiatan.</li>
                    <li>Ambil foto wajah WBP melalui kamera. Sistem memvalidasi kemiripan biometrik dengan model pencocokan wajah otomatis.</li>
                    <li>Hasil verifikasi langsung tersimpan dalam log riwayat absensi dan memutakhirkan persentase kehadiran WBP.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'laporan' && (
            <div className="space-y-5">
              <h2 className="text-xl font-extrabold text-slate-900">
                Bab 7: Standarisasi Format Laporan &amp; Kop Surat Resmi
              </h2>
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-3 text-sm text-slate-700">
                <p>
                  Seluruh dokumen PDF yang diekspor dari SIPASTI (Rapor Individu WBP, Rekap Triwulan, Capaian Program, dan Kinerja Asesor) menerapkan format kop resmi baku:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
                  <li>
                    <strong>Kop Surat Utama (Bagian Atas)</strong>: Menggunakan logo resmi circular Kementerian Imigrasi &amp; Pemasyarakatan di sebelah kiri, disertai teks instansi baku:
                    <div className="mt-1 p-2 bg-white rounded-lg border border-slate-200 font-serif text-xs">
                      KEMENTERIAN IMIGRASI DAN PEMASYARAKATAN REPUBLIK INDONESIA<br />
                      KANTOR WILAYAH KEMENTERIAN HUKUM DAN HAM JAWA BARAT<br />
                      <strong>LEMBAGA PEMASYARAKATAN KELAS IIB CIAMIS</strong><br />
                      <span className="text-[10px] text-slate-500">Jl. Ir. H. Juanda No. 146, Ciamis, Jawa Barat — Telp/WA: 0851-6984-1951</span>
                    </div>
                  </li>
                  <li>
                    <strong>Garis Pembatas Ganda</strong>: Memisahkan kop instansi kementerian dengan identitas sistem.
                  </li>
                  <li>
                    <strong>Header SIPASTI (Di Bawah Garis)</strong>: Menampilkan Logo SIPASTI di sebelah kiri, judul sistem <em>&quot;SISTEM INFORMASI PENILAIAN AKTIVITAS SPIRITUAL TERINTEGRASI (SI PASTI)&quot;</em>, serta judul spesifik laporan.
                  </li>
                  <li>
                    <strong>Validitas Sidang TPP</strong>: Dokumen dilengkapi barcode verifikasi digital, tanggal cetak, dan tanda tangan resmi Wali PAS &amp; Kepala Lapas.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
