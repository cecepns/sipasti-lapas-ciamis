-- ============================================================================
-- Migration: 005_add_peran_asesor_to_mitra_registrations.sql
-- Menambahkan kolom peran_asesor pada tabel mitra_registrations untuk membedakan
-- pendaftar Wali PAS (Petugas Lapas) dan Mitra Keagamaan (Eksternal)
-- ============================================================================

ALTER TABLE `mitra_registrations`
ADD COLUMN `peran_asesor` VARCHAR(100) NULL DEFAULT 'Mitra Pembina Spiritual' AFTER `lembaga_instansi`;

-- Sinkronisasi data lama berdasarkan catatan atau bidang keahlian
UPDATE `mitra_registrations`
SET `peran_asesor` = 'Wali PAS Pembina'
WHERE LOWER(`bidang_keahlian`) LIKE '%wali pas%'
   OR LOWER(`catatan_admin`) LIKE '%wali pas%';
