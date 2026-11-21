-- ============================================================================
-- MIGRATION #004: SYNC EXISTING DATA `assessments`
-- Project  : SI PASTI - Lapas Kelas IIB Ciamis
-- Target   : Data tabel `assessments` pada database `sipasti_lapas`
-- Purpose  :
-- Menyelaraskan data penilaian yang sudah ada di database:
-- 1. Menentukan `triwulan` (TW-I s/d TW-IV) dan `tahun` otomatis berdasarkan kolom `tanggal`.
-- 2. Mengisi nilai 5 sub-indikator PPKS (`sub_ibadah` s/d `sub_sosial`) dari data nilai karakter yang telah tersimpan.
-- 3. Mengisi default `alasan_tidak_hadir` = 'Sakit' untuk riwayat ketidakhadiran lama yang belum memiliki alasan.
--
-- CARA PAKAI:
-- File ini di-upload/import SETELAH Migration #001 dijalankan.
-- ============================================================================

USE `sipasti_lapas`;

UPDATE `assessments`
SET
  `triwulan` = CASE
    WHEN MONTH(`tanggal`) IN (1, 2, 3) THEN 'TW-I'
    WHEN MONTH(`tanggal`) IN (4, 5, 6) THEN 'TW-II'
    WHEN MONTH(`tanggal`) IN (7, 8, 9) THEN 'TW-III'
    ELSE 'TW-IV'
  END,
  `tahun` = YEAR(`tanggal`),
  `sub_ibadah` = COALESCE(`sub_ibadah`, `aspek_ibadah`, `nilai_karakter`, 4),
  `sub_pemahaman` = COALESCE(`sub_pemahaman`, `aspek_akhlak`, `nilai_karakter`, 4),
  `sub_kedisiplinan` = COALESCE(`sub_kedisiplinan`, `aspek_kedisiplinan`, `nilai_karakter`, 4),
  `sub_akhlak` = COALESCE(`sub_akhlak`, `aspek_akhlak`, `nilai_karakter`, 4),
  `sub_sosial` = COALESCE(`sub_sosial`, `aspek_partisipasi`, `nilai_karakter`, 4),
  `alasan_tidak_hadir` = CASE
    WHEN `pelaksanaan` = 'Tidak' AND (`alasan_tidak_hadir` IS NULL OR `alasan_tidak_hadir` = '') THEN 'Sakit'
    ELSE `alasan_tidak_hadir`
  END
WHERE `triwulan` IS NULL 
   OR `triwulan` = '' 
   OR `sub_ibadah` IS NULL;
