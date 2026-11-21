-- ============================================================================
-- MIGRATION #003: SINKRONISASI MASTER TABEL `programs`
-- Project  : SI PASTI - Lapas Kelas IIB Ciamis
-- Target   : Tabel `programs` pada database `sipasti_lapas`
-- Purpose  :
-- Menyelaraskan 5 Program Pembinaan Spiritual Resmi Lapas Kelas IIB Ciamis
-- dengan proporsi bobot tepat 100.00% (Sesuai Revisi Sheet 1 & PDF Panduan):
-- 1. Pembelajaran Al-Quran & Tahsin    : Bobot 30.00% (Target: 24 sesi/bln)
-- 2. Sholat Fardhu Berjamaah           : Bobot 25.00% (Target: 30 sesi/bln)
-- 3. Kajian Fiqih & Ibadah             : Bobot 20.00% (Target: 16 sesi/bln)
-- 4. Bimbingan Konseling Rohani        : Bobot 15.00% (Target: 12 sesi/bln)
-- 5. Peringatan Hari Besar Islam (PHBI): Bobot 10.00% (Target:  4 sesi/bln)
-- Total Bobot                          : 100.00%
--
-- CARA PAKAI:
-- Menggunakan INSERT ... ON DUPLICATE KEY UPDATE sehingga:
-- 1. Jika ID program 1-5 sudah ada, hanya atribut nama/bobot/target yang diperbarui.
-- 2. Relasi data assessments yang merujuk ke ID program ini tetap utuh dan aman.
-- ============================================================================

USE `sipasti_lapas`;

INSERT INTO `programs` (
  `id`, 
  `kode_program`, 
  `nama_program`, 
  `kategori`, 
  `deskripsi`, 
  `bobot`, 
  `target_bulanan`, 
  `jadwal`, 
  `lokasi`, 
  `status`
)
VALUES
  (
    1, 
    'PRG-QURAN-TAHSIN', 
    'Pembelajaran Al-Quran & Tahsin', 
    'Keduanya', 
    'Program tahsin, tadarus harian, dan hafalan surat Al-Quran bersama Wali PAS dan Mitra Kemenag.', 
    30.00, 
    24, 
    'Senin - Sabtu, 08:30 WIB', 
    'Masjid At-Taubah Lapas Ciamis', 
    'aktif'
  ),
  (
    2, 
    'PRG-SHOLAT-FARDHU', 
    'Sholat Fardhu Berjamaah', 
    'Keduanya', 
    'Pelaksanaan sholat fardhu 5 waktu berjamaah secara disiplin dan tepat waktu di masjid/blok hunian.', 
    25.00, 
    30, 
    'Setiap Hari (5 Waktu)', 
    'Masjid At-Taubah Lapas Ciamis', 
    'aktif'
  ),
  (
    3, 
    'PRG-KAJIAN-FIQIH', 
    'Kajian Fiqih & Ibadah', 
    'Keduanya', 
    'Pendalaman hukum ibadah praktis, thaharah, dan fiqih keseharian bersama Penyuluh Agama Kemenag.', 
    20.00, 
    16, 
    'Selasa & Kamis, 09:30 WIB', 
    'Masjid At-Taubah Lapas Ciamis', 
    'aktif'
  ),
  (
    4, 
    'PRG-KONSELING-ROHANI', 
    'Bimbingan Konseling Rohani', 
    'PPKS', 
    'Bimbingan personal dan konseling spiritual bersama Wali PAS untuk penguatan mental moral.', 
    15.00, 
    12, 
    'Rabu & Sabtu, 10:00 WIB', 
    'Ruang Bimbingan Rohani', 
    'aktif'
  ),
  (
    5, 
    'PRG-PHBI', 
    'Peringatan Hari Besar Islam', 
    'SPPN', 
    'Kegiatan hari besar keagamaan, istighosah akbar, tabligh akbar, dan peringatan hari besar Islam lainnya.', 
    10.00, 
    4, 
    'Insidental & Bulanan', 
    'Aula Pembinaan Lapas Ciamis', 
    'aktif'
  )
ON DUPLICATE KEY UPDATE
  `kode_program`   = VALUES(`kode_program`),
  `nama_program`   = VALUES(`nama_program`),
  `kategori`       = VALUES(`kategori`),
  `deskripsi`      = VALUES(`deskripsi`),
  `bobot`          = VALUES(`bobot`),
  `target_bulanan` = VALUES(`target_bulanan`),
  `jadwal`         = VALUES(`jadwal`),
  `lokasi`         = VALUES(`lokasi`),
  `status`         = VALUES(`status`);
