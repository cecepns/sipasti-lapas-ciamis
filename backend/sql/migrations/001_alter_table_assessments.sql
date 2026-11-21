-- ============================================================================
-- MIGRATION #001: ALTER TABLE `assessments`
-- Project  : SI PASTI - Lapas Kelas IIB Ciamis
-- Target   : Tabel `assessments` pada database `sipasti_lapas`
-- Purpose  :
-- Menambahkan kolom pendukung fitur baru:
-- 1. `alasan_tidak_hadir` : Alasan jika WBP tidak hadir / kegiatan batal
-- 2. `sub_ibadah`         : PPKS Sub-Indikator 1 (Kesadaran & Praktik Ibadah)
-- 3. `sub_pemahaman`      : PPKS Sub-Indikator 2 (Pemahaman Nilai Keagamaan)
-- 4. `sub_kedisiplinan`   : PPKS Sub-Indikator 3 (Kedisiplinan Waktu & Aturan)
-- 5. `sub_akhlak`         : PPKS Sub-Indikator 4 (Perilaku Keseharian & Akhlak)
-- 6. `sub_sosial`         : PPKS Sub-Indikator 5 (Hubungan Sosial & Toleransi)
-- 7. `triwulan`           : Filter periode triwulan (TW-I, TW-II, TW-III, TW-IV)
-- 8. `tahun`              : Filter tahun penilaian
-- Serta 2 Index pendukung query dashboard & grafik Pareto.
--
-- CARA PAKAI:
-- File ini tinggal di-upload/import langsung di phpMyAdmin atau MySQL CLI.
-- Tidak menghapus data lama tabel `assessments`.
-- ============================================================================

USE `sipasti_lapas`;

ALTER TABLE `assessments`
  ADD COLUMN `alasan_tidak_hadir` VARCHAR(150) NULL DEFAULT NULL 
    COMMENT 'Alasan jika pelaksanaan Tidak (Sakit, Sidang, Kunjungan, Piket, Dispensasi, Lainnya)' 
    AFTER `pelaksanaan`,
  ADD COLUMN `sub_ibadah` TINYINT UNSIGNED NULL DEFAULT 4 
    COMMENT 'PPKS Sub-Indikator 1: Kesadaran & Praktik Ibadah (1-5)' 
    AFTER `aspek_partisipasi`,
  ADD COLUMN `sub_pemahaman` TINYINT UNSIGNED NULL DEFAULT 4 
    COMMENT 'PPKS Sub-Indikator 2: Pemahaman Nilai Keagamaan (1-5)' 
    AFTER `sub_ibadah`,
  ADD COLUMN `sub_kedisiplinan` TINYINT UNSIGNED NULL DEFAULT 4 
    COMMENT 'PPKS Sub-Indikator 3: Kedisiplinan Waktu & Aturan (1-5)' 
    AFTER `sub_pemahaman`,
  ADD COLUMN `sub_akhlak` TINYINT UNSIGNED NULL DEFAULT 4 
    COMMENT 'PPKS Sub-Indikator 4: Perilaku Keseharian & Akhlak (1-5)' 
    AFTER `sub_kedisiplinan`,
  ADD COLUMN `sub_sosial` TINYINT UNSIGNED NULL DEFAULT 4 
    COMMENT 'PPKS Sub-Indikator 5: Hubungan Sosial & Toleransi (1-5)' 
    AFTER `sub_akhlak`,
  ADD COLUMN `triwulan` VARCHAR(10) NULL DEFAULT 'TW-IV' 
    COMMENT 'Periode Triwulan: TW-I, TW-II, TW-III, TW-IV' 
    AFTER `tanggal`,
  ADD COLUMN `tahun` SMALLINT UNSIGNED NULL DEFAULT 2026 
    COMMENT 'Tahun penilaian (contoh: 2026)' 
    AFTER `triwulan`,
  ADD INDEX `idx_assess_tw_thn` (`triwulan`, `tahun`),
  ADD INDEX `idx_assess_alasan` (`alasan_tidak_hadir`);
