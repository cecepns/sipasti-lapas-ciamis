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
  { id: 'konsep', label: '1. Rumus SPPN & PPKS', icon: BookOpen },
  { id: 'rekomendasi', label: '2. Matriks 3 Level Kualifikasi', icon: ShieldCheck },
  { id: 'peran', label: '3. Panduan Peran Asesor & Petugas', icon: Users },
  { id: 'faceid', label: '4. Absensi Face ID', icon: ScanFace },
  { id: 'laporan', label: '5. Laporan & Kop Resmi', icon: CalendarRange },
];

const ROLE_GUIDES = [
  {
    role: 'Admin SIPASTI',
    color: 'border-purple-200 bg-purple-50/50',
    badge: 'bg-purple-600 text-white',
    steps: [
      'Kelola Master Data WBP (SDP) di menu Data WBP, lengkapi biodata, pas foto profil 3x4, dan penugasan Wali PAS.',
      'Atur Program Pembinaan Spiritual di menu Program Pembinaan: pastikan kategori tepat (SPPN / PPKS) dan total bobot aktif tepat 100%.',
      'Kelola akun Wali PAS, Kasubsi, Kasi Binadik, dan Ka. Lapas di menu Wali PAS & Akun.',
      'Setujui pendaftaran Mitra Keagamaan di menu Registrasi Mitra agar akun asesor otomatis aktif.',
    ],
  },
  {
    role: 'Wali PAS (Wali Pemasyarakatan)',
    color: 'border-emerald-200 bg-emerald-50/50',
    badge: 'bg-emerald-600 text-white',
    steps: [
      'Daftarkan wajah (Enroll Face ID) WBP binaannya melalui tombol Face ID di halaman Data WBP.',
      'Input data kegiatan spiritual di menu Penilaian: kategori instrumen otomatis terdeteksi dari program yang dipilih.',
      'Catat kehadiran atau pantau absensi biometrik Face ID di menu Absensi.',
      'Cek perkembangan WBP binaan di Dasbor WBP dan cetak Rapor Profil PDF resmi.',
    ],
  },
  {
    role: 'Mitra Pembina Spiritual (Kemenag / Pesantren / Rohaniwan)',
    color: 'border-amber-200 bg-amber-50/50',
    badge: 'bg-amber-600 text-white',
    steps: [
      'Lakukan pendaftaran melalui Formulir Registrasi Mitra dan tunggu verifikasi Admin Lapas.',
      'Setelah akun aktif, masuk ke portal SIPASTI untuk menginput hasil penilaian kehadiran serta rubrik karakter spiritual (skala 1-5).',
      'Pantau capaian pembinaan pada Dasbor Program dan Dasbor Kinerja Asesor.',
    ],
  },
  {
    role: 'Kasubsi Reg & Bimkemas',
    color: 'border-sky-200 bg-sky-50/50',
    badge: 'bg-sky-600 text-white',
    steps: [
      'Buka menu Penilaian untuk meninjau dan memvalidasi respon input dari Wali PAS & Mitra.',
      'Klik tombol Verifikasi Kasubsi untuk menetapkan status "Terverifikasi" atau "Perlu Revisi" disertai catatan pembinaan.',
      'Gunakan menu Rekap Penilaian untuk mengevaluasi akumulasi capaian Triwulan.',
    ],
  },
  {
    role: 'Kasi Binadik & Kepala Lapas (Ka. Lapas)',
    color: 'border-slate-300 bg-slate-100/70',
    badge: 'bg-slate-900 text-amber-300',
    steps: [
      'Pantau Dasbor Umum dengan pembagian Section 0 (Status Sistem), Section 1 (Capaian Triwulan Berjalan), dan Section 2 (Komparasi Historis Triwulan).',
      'Buka Dasbor WBP untuk meninjau Evaluasi Kualifikasi Akhir 3 Level Predikat (Kualifikasi 2, 1, atau 0).',
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

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-60 transition-colors shrink-0"
          >
            <FileDown className="h-4 w-4" />
            {downloading ? 'Menyiapkan PDF...' : 'Unduh Panduan Resmi (PDF)'}
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
                        <span className="text-[11px] text-slate-500">Nilai SPPN &lt; 70 (Tidak Memenuhi)</span>
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

          {activeTab === 'peran' && (
            <div className="space-y-5">
              <h2 className="text-xl font-extrabold text-slate-900">
                Bab 3: Panduan Operasional Peran (SOP Pengguna)
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
                Bab 4: Panduan Pendaftaran & Absensi Biometrik Face ID
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
                Bab 5: Standarisasi Format Laporan & Kop Surat Resmi
              </h2>
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-3 text-sm text-slate-700">
                <p>
                  Seluruh dokumen PDF yang diekspor dari SIPASTI (Rapor Individu WBP, Rekap Triwulan, Capaian Program, dan Kinerja Asesor) menerapkan format kop resmi baku:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
                  <li>
                    <strong>Kop Surat Utama (Bagian Atas)</strong>: Menggunakan logo resmi circular Kementerian Imigrasi & Pemasyarakatan di sebelah kiri, disertai teks instansi baku:
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
                    <strong>Validitas Sidang TPP</strong>: Dokumen dilengkapi barcode verifikasi digital, tanggal cetak, dan tanda tangan resmi Wali PAS & Kepala Lapas.
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
