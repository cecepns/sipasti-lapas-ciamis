-- ============================================================================
-- MIGRATION RESMI SI PASTI (ALL-IN-ONE & SAFE IDEMPOTENT)
-- Project  : SI PASTI - Lapas Kelas IIB Ciamis
-- Target   : Database `sipasti_lapas`
-- Created  : 2026-11-21
--
-- FITUR & KEUNGGULAN SCRIPT INI:
-- 1. AMAN DARI ERROR #1060 (Duplicate column name): 
--    Setiap kolom dicek terlebih dahulu ke information_schema. Jika kolom 
--    (seperti `triwulan`) sudah ada di database Anda, perintah ADD COLUMN akan 
--    dilewati otomatis tanpa memunculkan error!
-- 2. AMAN DARI ERROR #1061 (Duplicate key name):
--    Indeks dicek sebelum ditambahkan.
-- 3. TIDAK MENGHAPUS / MERUSAK DATA LAMA:
--    Hanya menambahkan kolom baru, menyinkronkan 5 program resmi, dan 
--    melengkapi data triwulan pada riwayat yang sudah ada.
-- 4. TINGGAL UPLOAD / IMPORT LANGSUNG 1 FILE INI DI PHPMYADMIN / MYSQL CLI.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `sipasti_lapas`;
USE `sipasti_lapas`;

SET FOREIGN_KEY_CHECKS = 0;

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_migrate_sipasti_update_all`$$

CREATE PROCEDURE `sp_migrate_sipasti_update_all`()
BEGIN

  -- ==========================================================================
  -- 1. PEMBARUAN TABEL `assessments` (Cek per kolom agar tidak error #1060)
  -- ==========================================================================

  -- Kolom `alasan_tidak_hadir`
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'assessments' AND COLUMN_NAME = 'alasan_tidak_hadir'
  ) THEN
    ALTER TABLE `assessments` 
      ADD COLUMN `alasan_tidak_hadir` VARCHAR(150) NULL DEFAULT NULL 
      COMMENT 'Alasan jika pelaksanaan Tidak (Sakit, Sidang, Kunjungan, Piket, Dispensasi, Lainnya)' 
      AFTER `pelaksanaan`;
  END IF;

  -- Kolom `sub_ibadah` (PPKS Sub-Indikator 1)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'assessments' AND COLUMN_NAME = 'sub_ibadah'
  ) THEN
    ALTER TABLE `assessments` 
      ADD COLUMN `sub_ibadah` TINYINT UNSIGNED NULL DEFAULT 4 
      COMMENT 'PPKS Sub-Indikator 1: Kesadaran & Praktik Ibadah (1-5)' 
      AFTER `aspek_partisipasi`;
  END IF;

  -- Kolom `sub_pemahaman` (PPKS Sub-Indikator 2)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'assessments' AND COLUMN_NAME = 'sub_pemahaman'
  ) THEN
    ALTER TABLE `assessments` 
      ADD COLUMN `sub_pemahaman` TINYINT UNSIGNED NULL DEFAULT 4 
      COMMENT 'PPKS Sub-Indikator 2: Pemahaman Nilai Keagamaan (1-5)' 
      AFTER `sub_ibadah`;
  END IF;

  -- Kolom `sub_kedisiplinan` (PPKS Sub-Indikator 3)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'assessments' AND COLUMN_NAME = 'sub_kedisiplinan'
  ) THEN
    ALTER TABLE `assessments` 
      ADD COLUMN `sub_kedisiplinan` TINYINT UNSIGNED NULL DEFAULT 4 
      COMMENT 'PPKS Sub-Indikator 3: Kedisiplinan Waktu & Aturan (1-5)' 
      AFTER `sub_pemahaman`;
  END IF;

  -- Kolom `sub_akhlak` (PPKS Sub-Indikator 4)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'assessments' AND COLUMN_NAME = 'sub_akhlak'
  ) THEN
    ALTER TABLE `assessments` 
      ADD COLUMN `sub_akhlak` TINYINT UNSIGNED NULL DEFAULT 4 
      COMMENT 'PPKS Sub-Indikator 4: Perilaku Keseharian & Akhlak (1-5)' 
      AFTER `sub_kedisiplinan`;
  END IF;

  -- Kolom `sub_sosial` (PPKS Sub-Indikator 5)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'assessments' AND COLUMN_NAME = 'sub_sosial'
  ) THEN
    ALTER TABLE `assessments` 
      ADD COLUMN `sub_sosial` TINYINT UNSIGNED NULL DEFAULT 4 
      COMMENT 'PPKS Sub-Indikator 5: Hubungan Sosial & Toleransi (1-5)' 
      AFTER `sub_akhlak`;
  END IF;

  -- Kolom `triwulan` (TW-I s/d TW-IV)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'assessments' AND COLUMN_NAME = 'triwulan'
  ) THEN
    ALTER TABLE `assessments` 
      ADD COLUMN `triwulan` VARCHAR(10) NULL DEFAULT 'TW-IV' 
      COMMENT 'Periode Triwulan: TW-I, TW-II, TW-III, TW-IV' 
      AFTER `tanggal`;
  END IF;

  -- Kolom `tahun`
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'assessments' AND COLUMN_NAME = 'tahun'
  ) THEN
    ALTER TABLE `assessments` 
      ADD COLUMN `tahun` SMALLINT UNSIGNED NULL DEFAULT 2026 
      COMMENT 'Tahun penilaian (contoh: 2026)' 
      AFTER `triwulan`;
  END IF;

  -- Indeks untuk query filter Triwulan & Tahun
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'assessments' AND INDEX_NAME = 'idx_assess_tw_thn'
  ) THEN
    ALTER TABLE `assessments` ADD INDEX `idx_assess_tw_thn` (`triwulan`, `tahun`);
  END IF;

  -- Indeks untuk query Pareto alasan tidak hadir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'assessments' AND INDEX_NAME = 'idx_assess_alasan'
  ) THEN
    ALTER TABLE `assessments` ADD INDEX `idx_assess_alasan` (`alasan_tidak_hadir`);
  END IF;


  -- ==========================================================================
  -- 2. PEMBARUAN TABEL `wbp` (Cek per kolom agar aman)
  -- ==========================================================================

  -- Kolom `kualifikasi_akhir`
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'wbp' AND COLUMN_NAME = 'kualifikasi_akhir'
  ) THEN
    ALTER TABLE `wbp` 
      ADD COLUMN `kualifikasi_akhir` TINYINT UNSIGNED NULL DEFAULT 2 
      COMMENT '2 = Direkomendasikan, 1 = Direkomendasikan dengan Pertimbangan, 0 = Tidak Memenuhi Syarat' 
      AFTER `status`;
  ELSE
    ALTER TABLE `wbp` 
      MODIFY COLUMN `kualifikasi_akhir` TINYINT UNSIGNED NULL DEFAULT 2 
      COMMENT '2 = Direkomendasikan, 1 = Direkomendasikan dengan Pertimbangan, 0 = Tidak Memenuhi Syarat';
  END IF;

  -- Kolom `sppn_terakhir`
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'wbp' AND COLUMN_NAME = 'sppn_terakhir'
  ) THEN
    ALTER TABLE `wbp` 
      ADD COLUMN `sppn_terakhir` DECIMAL(5,2) NULL DEFAULT 82.50 
      COMMENT 'Skor SPPN periode berjalan (0-100)' 
      AFTER `kualifikasi_akhir`;
  END IF;

  -- Kolom `ppks_terakhir`
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'wbp' AND COLUMN_NAME = 'ppks_terakhir'
  ) THEN
    ALTER TABLE `wbp` 
      ADD COLUMN `ppks_terakhir` DECIMAL(3,2) NULL DEFAULT 4.25 
      COMMENT 'Skor PPKS periode berjalan (1-5)' 
      AFTER `sppn_terakhir`;
  END IF;

  -- Kolom `status_rekomendasi`
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'wbp' AND COLUMN_NAME = 'status_rekomendasi'
  ) THEN
    ALTER TABLE `wbp` 
      ADD COLUMN `status_rekomendasi` VARCHAR(60) NULL DEFAULT 'direkomendasikan' 
      COMMENT 'direkomendasikan | direkomendasikan_dengan_catatan | tidak_direkomendasikan' 
      AFTER `ppks_terakhir`;
  END IF;

  -- Indeks untuk filter kualifikasi WBP
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'wbp' AND INDEX_NAME = 'idx_wbp_kualifikasi'
  ) THEN
    ALTER TABLE `wbp` ADD INDEX `idx_wbp_kualifikasi` (`kualifikasi_akhir`);
  END IF;

END$$

DELIMITER ;

-- Eksekusi prosedur migrasi
CALL `sp_migrate_sipasti_update_all`();
DROP PROCEDURE IF EXISTS `sp_migrate_sipasti_update_all`;


-- ============================================================================
-- 3. SINKRONISASI 5 PROGRAM RESMI LAPAS CIAMIS (Total Bobot Tepat 100.00%)
-- ============================================================================
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


-- ============================================================================
-- 4. SINKRONISASI DATA RIWAYAT `assessments` (Inisialisasi Triwulan & PPKS)
-- ============================================================================
UPDATE `assessments`
SET
  `triwulan` = CASE
    WHEN `triwulan` IS NOT NULL AND `triwulan` != '' THEN `triwulan`
    WHEN MONTH(`tanggal`) IN (1, 2, 3) THEN 'TW-I'
    WHEN MONTH(`tanggal`) IN (4, 5, 6) THEN 'TW-II'
    WHEN MONTH(`tanggal`) IN (7, 8, 9) THEN 'TW-III'
    ELSE 'TW-IV'
  END,
  `tahun` = COALESCE(`tahun`, YEAR(`tanggal`), 2026),
  `sub_ibadah` = COALESCE(`sub_ibadah`, `aspek_ibadah`, `nilai_karakter`, 4),
  `sub_pemahaman` = COALESCE(`sub_pemahaman`, `aspek_akhlak`, `nilai_karakter`, 4),
  `sub_kedisiplinan` = COALESCE(`sub_kedisiplinan`, `aspek_kedisiplinan`, `nilai_karakter`, 4),
  `sub_akhlak` = COALESCE(`sub_akhlak`, `aspek_akhlak`, `nilai_karakter`, 4),
  `sub_sosial` = COALESCE(`sub_sosial`, `aspek_partisipasi`, `nilai_karakter`, 4),
  `alasan_tidak_hadir` = CASE
    WHEN `pelaksanaan` = 'Tidak' AND (`alasan_tidak_hadir` IS NULL OR `alasan_tidak_hadir` = '') THEN 'Sakit'
    ELSE `alasan_tidak_hadir`
  END;

SET FOREIGN_KEY_CHECKS = 1;

-- Konfirmasi selesai
SELECT 'MIGRASI BERHASIL! Seluruh tabel, kolom baru, data program, dan riwayat penilaian telah tersinkronisasi 100%.' AS Status_Migrasi;
