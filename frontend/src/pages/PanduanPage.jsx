import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CalendarRange,
  CheckCircle2,
  ClipboardCheck,
  FileDown,
  ScanFace,
  ShieldCheck,
  Users,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { INSTRUMEN_INFO, REKOMENDASI_RULES } from '@/utils/formatters';
import { exportBukuPanduanPdf } from '@/utils/pdfGenerator';

const CHAPTERS = [
  { id: 'konsep', label: '1. Konsep SPPN & PPKS', icon: BookOpen },
  { id: 'rekomendasi', label: '2. Aturan Rekomendasi', icon: ShieldCheck },
  { id: 'peran', label: '3. Panduan Per Peran', icon: Users },
  { id: 'faceid', label: '4. Absensi Face ID', icon: ScanFace },
  { id: 'laporan', label: '5. Rekap & Export PDF', icon: CalendarRange },
];

const ROLE_GUIDES = [
  {
    role: 'Admin SIPASTI',
    color: 'border-purple-200 bg-purple-50/50',
    badge: 'bg-purple-600 text-white',
    steps: [
      'Kelola Master Data WBP (SDP) di menu Data WBP, lengkapi biodata, pas foto profil 3x4, dan penugasan Wali PAS.',
      'Atur Program Pembinaan Spiritual (bobot, target bulanan, jadwal, lokasi) di menu Data Program.',
      'Kelola akun Wali PAS, Kasubsi, Kasi Binadik, dan Ka. Lapas di menu Wali PAS & Akun.',
      'Setujui pendaftaran Mitra Keagamaan di menu Registrasi Mitra agar akun Mitra otomatis aktif.',
    ],
  },
  {
    role: 'Wali PAS (Wali Pemasyarakatan)',
    color: 'border-emerald-200 bg-emerald-50/50',
    badge: 'bg-emerald-600 text-white',
    steps: [
      'Daftarkan wajah (Enroll Face ID) WBP binaannya melalui tombol ikon Face ID di halaman Data WBP.',
      'Input Nilai SPPN (Utama) dan Nilai PPKS (Pendukung Monitoring) secara terpisah di menu Penilaian SPPN & PPKS.',
      'Catat atau pantau kehadiran WBP dengan kamera selfie di menu Absensi Face ID.',
      'Cek perkembangan WBP binaan di Dasbor & Profil WBP dan unduh Rapor Profil WBP dalam format PDF.',
    ],
  },
  {
    role: 'Mitra Keagamaan (Kemenag / Pesantren / MUI)',
    color: 'border-amber-200 bg-amber-50/50',
    badge: 'bg-amber-600 text-white',
    steps: [
      'Lakukan pendaftaran melalui halaman Registrasi Mitra dan tunggu persetujuan Admin Lapas.',
      'Setelah akun aktif, masuk ke portal SIPASTI untuk menginput hasil penilaian SPPN maupun monitoring PPKS sesuai kegiatan yang dibimbing.',
      'Pantau riwayat penilaian dan capaian program pada Dasbor Program & Dasbor Asesor.',
    ],
  },
  {
    role: 'Kasubsi Reg & Bimkemas',
    color: 'border-sky-200 bg-sky-50/50',
    badge: 'bg-sky-600 text-white',
    steps: [
      'Buka menu Penilaian SPPN & PPKS untuk meninjau respon input dari Wali PAS & Mitra.',
      'Klik ikon Verifikasi (perisai biru) untuk menetapkan status "Terverifikasi" atau "Perlu Revisi" disertai catatan.',
      'Gunakan menu Rekap Periodik untuk mengevaluasi data Harian, Mingguan, Bulanan, dan Per 3 Bulan (Triwulan).',
    ],
  },
  {
    role: 'Kasi Binadik & Kepala Lapas (Ka. Lapas)',
    color: 'border-slate-300 bg-slate-100/70',
    badge: 'bg-slate-900 text-amber-300',
    steps: [
      'Pantau ringkasan eksekutif, grafik tren SPPN vs PPKS, serta sebaran rekomendasi kelayakan di Dasbor Umum.',
      'Buka Dasbor & Profil WBP untuk meninjau keputusan kelayakan (Direkomendasikan / Dengan Catatan / Tidak Direkomendasikan).',
      'Klik "Profil & PDF" untuk melihat profil lengkap beserta foto WBP dan mengunduh Rapor PDF resmi berkop Kementerian & SIPASTI.',
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
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Buku Panduan SIPASTI
          </h1>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-60 transition-colors shrink-0"
          >
            <FileDown className="h-4 w-4" />
            {downloading ? 'Menyiapkan PDF...' : 'Unduh Panduan (PDF)'}
          </button>
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
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
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
          {activeTab === 'konsep' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Penjabaran Resmi Instrumen SPPN & PPKS
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Dalam sistem SI PASTI Lapas Kelas IIB Ciamis, penilaian <strong>SPPN</strong> dan{' '}
                  <strong>PPKS</strong> dicatat dan dievaluasi secara <strong>TERPISAH</strong>{' '}
                  (tidak digabung menjadi satu angka) agar fungsi utama dan fungsi monitoring tetap objektif.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded-xl bg-emerald-600 px-3 py-1 text-sm font-extrabold text-white">
                      {INSTRUMEN_INFO.SPPN.singkatan}
                    </span>
                    <span className="text-xs font-bold text-emerald-700">
                      {INSTRUMEN_INFO.SPPN.peran}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-emerald-950">
                    {INSTRUMEN_INFO.SPPN.kepanjangan}
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {INSTRUMEN_INFO.SPPN.deskripsi}
                  </p>
                  <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-4">
                    <li>Menjadi indikator <strong>inti/primer</strong> kelayakan pengusulan hak remisi dan integrasi.</li>
                    <li>Ambang batas memenuhi syarat: <strong>Rata-rata Skor SPPN ≥ 70</strong> (skala 0–100).</li>
                    <li>Jika SPPN tidak memenuhi syarat (&lt; 70), status otomatis <strong>Tidak Direkomendasikan</strong>.</li>
                  </ul>
                </div>

                <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/50 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded-xl bg-amber-500 px-3 py-1 text-sm font-extrabold text-white">
                      {INSTRUMEN_INFO.PPKS.singkatan}
                    </span>
                    <span className="text-xs font-bold text-amber-800">
                      {INSTRUMEN_INFO.PPKS.peran}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-amber-950">
                    {INSTRUMEN_INFO.PPKS.kepanjangan}
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {INSTRUMEN_INFO.PPKS.deskripsi}
                  </p>
                  <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-4">
                    <li>Berfungsi sebagai instrumen <strong>pendukung & monitoring</strong> pembinaan spiritual WBP.</li>
                    <li>Ambang batas baik: <strong>Rata-rata Skor PPKS ≥ 70</strong>.</li>
                    <li>Jika SPPN sudah memenuhi syarat namun PPKS &lt; 70, WBP tetap dapat diusulkan dengan status <strong>Direkomendasikan dengan Catatan</strong> untuk mengikuti didikan spiritual lanjutan.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rekomendasi' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Matriks Keputusan Rekomendasi Kelayakan WBP
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Berikut logika penetapan status rekomendasi otomatis berdasarkan nilai SPPN dan PPKS secara terpisah:
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {REKOMENDASI_RULES.map((rule) => {
                  const Icon =
                    rule.color === 'emerald'
                      ? CheckCircle2
                      : rule.color === 'amber'
                      ? AlertTriangle
                      : XCircle;
                  const style =
                    rule.color === 'emerald'
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                      : rule.color === 'amber'
                      ? 'border-amber-300 bg-amber-50 text-amber-950'
                      : 'border-rose-300 bg-rose-50 text-rose-950';
                  return (
                    <div key={rule.code} className={`rounded-2xl border-2 p-5 space-y-2.5 ${style}`}>
                      <Icon className="h-7 w-7" />
                      <h3 className="text-base font-extrabold">{rule.label}</h3>
                      <p className="text-xs font-bold bg-white/70 rounded-xl p-2.5">{rule.syarat}</p>
                      <p className="text-xs leading-relaxed opacity-90">{rule.arti}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'peran' && (
            <div className="space-y-5">
              <h2 className="text-xl font-extrabold text-slate-900">
                Panduan Operasional Berdasarkan Peran (Role)
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
                Panduan Pendaftaran (Enroll) & Absensi Face ID Kamera Selfie
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
                    <li>Klik <strong>Pindai & Simpan Wajah</strong>. Sistem menyimpan 128 titik fitur wajah sekaligus menjadikan foto tersebut sebagai <strong>Foto Profil WBP</strong> di Rapor PDF.</li>
                  </ol>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 space-y-2.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 uppercase">
                    <ClipboardCheck className="h-4 w-4" /> Tahap 2: Absensi Harian Selfie Face ID
                  </span>
                  <ol className="list-decimal pl-4 space-y-2 text-xs sm:text-sm text-slate-700">
                    <li>Buka <strong>Kiosk Absensi WBP</strong> (<code>/absensi-kiosk</code>) pada tablet/HP masjid atau menu <strong>Absensi Face ID</strong> di dalam portal.</li>
                    <li>Ketik nama atau nomor registrasi WBP (pencarian otomatis dengan debounce) dan pilih Program Kegiatan.</li>
                    <li>Klik <strong>Scan Face ID & Selfie</strong> untuk mengambil foto dan mencocokkan biometrik secara otomatis.</li>
                    <li>Klik <strong>Kirim Absensi Face ID</strong>; bukti selfie dan skor kecocokan wajah tersimpan dan dapat diunduh sebagai PDF.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'laporan' && (
            <div className="space-y-5">
              <h2 className="text-xl font-extrabold text-slate-900">
                Panduan Rekap Periodik (Harian, Mingguan, Bulanan, Per 3 Bulan) & Export PDF
              </h2>
              <div className="space-y-3 text-sm text-slate-700">
                <p>
                  Seluruh laporan PDF di SIPASTI otomatis menggunakan <strong>Kop Surat Resmi Lapas Kelas IIB Ciamis</strong>{' '}
                  dengan <strong>Logo Kementerian Pemasyarakatan</strong> di sebelah kiri dan{' '}
                  <strong>Logo SIPASTI</strong> di sebelah kanan, lengkap dengan kolom tanda tangan Kepala Lapas dan Kasi Binadik.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <h4 className="font-extrabold text-slate-900 text-sm">Rekap Periodik</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Buka menu <strong>Rekap Periodik</strong>, lalu pilih tab <strong>Harian</strong>,{' '}
                      <strong>Mingguan</strong>, <strong>Bulanan</strong>, atau <strong>Per 3 Bulan (Triwulan)</strong>.
                      Gunakan filter rentang tanggal, WBP, Program, atau Asesor, kemudian klik <strong>Export PDF</strong>.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <h4 className="font-extrabold text-slate-900 text-sm">Rapor Profil Individual WBP</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Buka menu <strong>Dasbor & Profil WBP</strong>, klik <strong>Profil & PDF</strong> pada baris WBP,
                      lalu klik <strong>Download PDF Profil</strong>. Rapor menampilkan Pas Foto WBP 3x4, keputusan rekomendasi,
                      serta rincian SPPN dan PPKS secara terpisah.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
