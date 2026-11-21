-- ============================================================================
-- MIGRATION #002: ALTER TABLE `wbp`
-- Project  : SI PASTI - Lapas Kelas IIB Ciamis
-- Target   : Tabel `wbp` pada database `sipasti_lapas`
-- Purpose  :
-- Menambahkan kolom pendukung kualifikasi & integrasi evaluasi:
-- 1. `kualifikasi_akhir`   : 2 = Direkomendasikan, 1 = Direkomendasikan dengan Pertimbangan, 0 = Tidak Memenuhi Syarat
-- 2. `sppn_terakhir`       : Skor SPPN periode berjalan (0-100)
-- 3. `ppks_terakhir`       : Skor PPKS periode berjalan (1-5)
-- 4. `status_rekomendasi`  : Status rekomendasi hak integrasi
-- Serta 1 Index untuk mempercepat filter kualifikasi WBP.
--
-- CARA PAKAI:
-- File ini tinggal di-upload/import langsung di phpMyAdmin atau MySQL CLI.
-- Tidak menghapus data WBP yang sudah ada.
-- ============================================================================

USE `sipasti_lapas`;

ALTER TABLE `wbp`
  ADD COLUMN `kualifikasi_akhir` TINYINT UNSIGNED NULL DEFAULT 2 
    COMMENT '2 = Direkomendasikan, 1 = Direkomendasikan dengan Pertimbangan, 0 = Tidak Memenuhi Syarat' 
    AFTER `status`,
  ADD COLUMN `sppn_terakhir` DECIMAL(5,2) NULL DEFAULT 82.50 
    COMMENT 'Skor SPPN periode berjalan (0-100)' 
    AFTER `kualifikasi_akhir`,
  ADD COLUMN `ppks_terakhir` DECIMAL(3,2) NULL DEFAULT 4.25 
    COMMENT 'Skor PPKS periode berjalan (1-5)' 
    AFTER `sppn_terakhir`,
  ADD COLUMN `status_rekomendasi` VARCHAR(60) NULL DEFAULT 'direkomendasikan' 
    COMMENT 'direkomendasikan | direkomendasikan_dengan_catatan | tidak_direkomendasikan' 
    AFTER `ppks_terakhir`,
  ADD INDEX `idx_wbp_kualifikasi` (`kualifikasi_akhir`);
