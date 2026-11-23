-- ============================================================================
-- SIPASTI - Sistem Informasi Penilaian Aktivitas Spiritual Terintegrasi
-- Lembaga Pemasyarakatan (Lapas) Kelas IIB Ciamis
-- Database Export & Seed Data (MySQL 8.0+ / MariaDB 10.4+)
-- Terupdate Sesuai Revisi Format SPPN & PPKS Terpisah dan 5 Program Spiritual
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `sipasti_lapas`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `sipasti_lapas`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `attendances`;
DROP TABLE IF EXISTS `assessments`;
DROP TABLE IF EXISTS `mitra_registrations`;
DROP TABLE IF EXISTS `wbp`;
DROP TABLE IF EXISTS `programs`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- 1. Tabel Users (Admin, Wali PAS, Mitra, Kasubsi Reg & Bimkemas, Kasi Binadik, Ka. Lapas)
-- Default password untuk semua akun seed: "sipasti123"
-- ----------------------------------------------------------------------------
CREATE TABLE `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nama` VARCHAR(150) NOT NULL,
  `nip_nik` VARCHAR(50) NULL,
  `email` VARCHAR(150) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'wali_pas', 'mitra', 'kasubsi', 'kasi_binadik', 'kalapas') NOT NULL DEFAULT 'wali_pas',
  `instansi` VARCHAR(150) NULL DEFAULT 'Lapas Kelas IIB Ciamis',
  `jabatan` VARCHAR(120) NULL,
  `no_hp` VARCHAR(30) NULL,
  `status` ENUM('aktif', 'pending', 'nonaktif') NOT NULL DEFAULT 'aktif',
  `avatar` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. Tabel Programs (5 Program Pembinaan Spiritual Resmi - Total Bobot 100%)
-- ----------------------------------------------------------------------------
CREATE TABLE `programs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `kode_program` VARCHAR(30) NOT NULL,
  `nama_program` VARCHAR(150) NOT NULL,
  `kategori` ENUM('SPPN', 'PPKS', 'Keduanya') NOT NULL DEFAULT 'Keduanya',
  `deskripsi` TEXT NULL,
  `bobot` DECIMAL(5,2) NOT NULL DEFAULT 20.00 COMMENT 'Persentase bobot kontribusi skor total',
  `target_bulanan` INT UNSIGNED NOT NULL DEFAULT 20 COMMENT 'Target pelaksanaan per bulan per WBP',
  `jadwal` VARCHAR(120) NULL,
  `lokasi` VARCHAR(120) NULL DEFAULT 'Masjid At-Taubah Lapas Ciamis',
  `status` ENUM('aktif', 'nonaktif') NOT NULL DEFAULT 'aktif',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_programs_kode` (`kode_program`),
  KEY `idx_programs_status` (`status`),
  KEY `idx_programs_kategori` (`kategori`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. Tabel WBP (Data SDP / Warga Binaan Pemasyarakatan + Face ID + Kualifikasi)
-- ----------------------------------------------------------------------------
CREATE TABLE `wbp` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `no_registrasi` VARCHAR(60) NOT NULL,
  `nama` VARCHAR(160) NOT NULL,
  `nik` VARCHAR(30) NULL,
  `tempat_lahir` VARCHAR(100) NULL,
  `tanggal_lahir` DATE NULL,
  `agama` VARCHAR(40) NOT NULL DEFAULT 'Islam',
  `blok_kamar` VARCHAR(60) NULL,
  `perkara` VARCHAR(120) NULL,
  `lama_pidana` VARCHAR(60) NULL,
  `tanggal_masuk` DATE NULL,
  `ekspirasi` DATE NULL,
  `wali_pas_id` INT UNSIGNED NULL,
  `foto_wajah` VARCHAR(255) NULL COMMENT 'Path foto referensi wajah untuk Face ID',
  `face_descriptor` LONGTEXT NULL COMMENT 'JSON vector 128-dim fitur wajah untuk verifikasi Face ID',
  `status` ENUM('aktif', 'bebas', 'pindah') NOT NULL DEFAULT 'aktif',
  `kualifikasi_akhir` TINYINT UNSIGNED NULL DEFAULT 2 COMMENT '2 = Direkomendasikan, 1 = Direkomendasikan dengan Pertimbangan, 0 = Tidak Memenuhi Syarat',
  `sppn_terakhir` DECIMAL(5,2) NULL DEFAULT 82.50 COMMENT 'Skor SPPN periode berjalan (0-100)',
  `ppks_terakhir` DECIMAL(3,2) NULL DEFAULT 4.25 COMMENT 'Skor PPKS periode berjalan (1-5)',
  `status_rekomendasi` VARCHAR(60) NULL DEFAULT 'direkomendasikan',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_wbp_no_reg` (`no_registrasi`),
  KEY `idx_wbp_nama` (`nama`),
  KEY `idx_wbp_wali` (`wali_pas_id`),
  KEY `idx_wbp_status` (`status`),
  KEY `idx_wbp_kualifikasi` (`kualifikasi_akhir`),
  CONSTRAINT `fk_wbp_wali_pas` FOREIGN KEY (`wali_pas_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. Tabel Mitra Registrations (Registrasi Mitra Keagamaan)
-- ----------------------------------------------------------------------------
CREATE TABLE `mitra_registrations` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NULL,
  `nama_lengkap` VARCHAR(150) NOT NULL,
  `lembaga_instansi` VARCHAR(160) NOT NULL,
  `peran_asesor` VARCHAR(100) NULL DEFAULT 'Mitra Pembina Spiritual',
  `bidang_keahlian` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `no_hp` VARCHAR(30) NOT NULL,
  `alamat` TEXT NULL,
  `status` ENUM('pending', 'disetujui', 'ditolak') NOT NULL DEFAULT 'pending',
  `catatan_admin` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_mitra_status` (`status`),
  KEY `idx_mitra_email` (`email`),
  CONSTRAINT `fk_mitra_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. Tabel Assessments (Tabel Sentral SI PASTI: Nilai SPPN & 5 Sub-Indikator PPKS)
-- ----------------------------------------------------------------------------
CREATE TABLE `assessments` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tanggal` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `triwulan` VARCHAR(10) NULL DEFAULT 'TW-IV' COMMENT 'TW-I, TW-II, TW-III, TW-IV',
  `tahun` SMALLINT UNSIGNED NULL DEFAULT 2026,
  `wbp_id` INT UNSIGNED NOT NULL,
  `asesor_id` INT UNSIGNED NOT NULL,
  `program_id` INT UNSIGNED NOT NULL,
  `jenis_penilaian` ENUM('SPPN', 'PPKS') NOT NULL DEFAULT 'SPPN',
  `pelaksanaan` ENUM('Ya', 'Tidak') NOT NULL DEFAULT 'Ya',
  `alasan_tidak_hadir` VARCHAR(150) NULL DEFAULT NULL COMMENT 'Alasan jika pelaksanaan Tidak (Sakit, Sidang, Kunjungan, Piket, Dispensasi)',
  `nilai_karakter` TINYINT UNSIGNED NULL COMMENT 'Skala 1-5 sesuai instrumen SI PASTI',
  `aspek_ibadah` TINYINT UNSIGNED NULL DEFAULT 4 COMMENT 'Skala 1-5',
  `aspek_kedisiplinan` TINYINT UNSIGNED NULL DEFAULT 4 COMMENT 'Skala 1-5',
  `aspek_akhlak` TINYINT UNSIGNED NULL DEFAULT 4 COMMENT 'Skala 1-5',
  `aspek_partisipasi` TINYINT UNSIGNED NULL DEFAULT 4 COMMENT 'Skala 1-5',
  `sub_ibadah` TINYINT UNSIGNED NULL DEFAULT 4 COMMENT 'PPKS Sub 1: Kesadaran & Praktik Ibadah',
  `sub_pemahaman` TINYINT UNSIGNED NULL DEFAULT 4 COMMENT 'PPKS Sub 2: Pemahaman Nilai Keagamaan',
  `sub_kedisiplinan` TINYINT UNSIGNED NULL DEFAULT 4 COMMENT 'PPKS Sub 3: Kedisiplinan Waktu & Aturan',
  `sub_akhlak` TINYINT UNSIGNED NULL DEFAULT 4 COMMENT 'PPKS Sub 4: Perilaku Keseharian & Akhlak',
  `sub_sosial` TINYINT UNSIGNED NULL DEFAULT 4 COMMENT 'PPKS Sub 5: Hubungan Sosial & Toleransi',
  `skor_akhir` DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Skor konversi 0-100',
  `keterangan` TEXT NULL,
  `bukti_foto` VARCHAR(255) NULL,
  `verifikasi_kasubsi` ENUM('menunggu', 'terverifikasi', 'revisi') NOT NULL DEFAULT 'terverifikasi',
  `catatan_verifikasi` TEXT NULL,
  `verified_by` INT UNSIGNED NULL,
  `verified_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_assess_tanggal` (`tanggal`),
  KEY `idx_assess_tw_thn` (`triwulan`, `tahun`),
  KEY `idx_assess_wbp` (`wbp_id`),
  KEY `idx_assess_asesor` (`asesor_id`),
  KEY `idx_assess_program` (`program_id`),
  KEY `idx_assess_jenis` (`jenis_penilaian`),
  KEY `idx_assess_pelaksanaan` (`pelaksanaan`),
  KEY `idx_assess_alasan` (`alasan_tidak_hadir`),
  KEY `idx_assess_verifikasi` (`verifikasi_kasubsi`),
  CONSTRAINT `fk_assess_wbp` FOREIGN KEY (`wbp_id`) REFERENCES `wbp` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_assess_asesor` FOREIGN KEY (`asesor_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_assess_program` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_assess_verifier` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. Tabel Attendances (Absensi Warga Binaan dengan Face ID & Kamera Selfie)
-- ----------------------------------------------------------------------------
CREATE TABLE `attendances` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `wbp_id` INT UNSIGNED NOT NULL,
  `program_id` INT UNSIGNED NOT NULL,
  `tanggal_absen` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `foto_selfie` VARCHAR(255) NULL,
  `face_match_score` DECIMAL(5,2) NULL DEFAULT 0.00,
  `face_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `status_kehadiran` ENUM('Hadir', 'Terlambat', 'Izin', 'Sakit') NOT NULL DEFAULT 'Hadir',
  `metode` ENUM('face_id_selfie', 'manual') NOT NULL DEFAULT 'face_id_selfie',
  `lokasi` VARCHAR(150) NULL DEFAULT 'Masjid At-Taubah Lapas Kelas IIB Ciamis',
  `catatan` TEXT NULL,
  `recorded_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_att_tanggal` (`tanggal_absen`),
  KEY `idx_att_wbp` (`wbp_id`),
  KEY `idx_att_program` (`program_id`),
  KEY `idx_att_status` (`status_kehadiran`),
  CONSTRAINT `fk_att_wbp` FOREIGN KEY (`wbp_id`) REFERENCES `wbp` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_att_program` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_att_recorder` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SEED DATA (Lapas Kelas IIB Ciamis)
-- Password semua akun demo: sipasti123
-- Hash bcrypt (cost 10): $2a$10$vfC7wKui/KlrPvjXd92.YOrd1ZR1hrUydjiXhzm1lHQOJ2f5BK0Um
-- ============================================================================

INSERT INTO `users` (`id`, `nama`, `nip_nik`, `email`, `password_hash`, `role`, `instansi`, `jabatan`, `no_hp`, `status`) VALUES
(1, 'Administrator SIPASTI', '199001012015031001', 'admin@sipastilapasciamis.com', '$2a$10$vfC7wKui/KlrPvjXd92.YOrd1ZR1hrUydjiXhzm1lHQOJ2f5BK0Um', 'admin', 'Lapas Kelas IIB Ciamis', 'Pengelola Sistem SI PASTI', '085169841951', 'aktif'),
(2, 'Kepala Lapas Kelas IIB Ciamis', '197605142000031001', 'kalapas@sipastilapasciamis.com', '$2a$10$vfC7wKui/KlrPvjXd92.YOrd1ZR1hrUydjiXhzm1lHQOJ2f5BK0Um', 'kalapas', 'Lapas Kelas IIB Ciamis', 'Kepala Lembaga Pemasyarakatan', '081220001001', 'aktif'),
(3, 'Kasi Binadik & Giatja', '198108202006041002', 'kasibinadik@sipastilapasciamis.com', '$2a$10$vfC7wKui/KlrPvjXd92.YOrd1ZR1hrUydjiXhzm1lHQOJ2f5BK0Um', 'kasi_binadik', 'Lapas Kelas IIB Ciamis', 'Kepala Seksi Binadik dan Giatja', '081220001002', 'aktif'),
(4, 'Kasubsi Reg & Bimkemas', '198503122009121003', 'kasubsi@sipastilapasciamis.com', '$2a$10$vfC7wKui/KlrPvjXd92.YOrd1ZR1hrUydjiXhzm1lHQOJ2f5BK0Um', 'kasubsi', 'Lapas Kelas IIB Ciamis', 'Kasubsi Registrasi & Bimkemas', '081220001003', 'aktif'),
(5, 'Hendra Nugraha', '198704152010121004', 'hendra.walipas@sipastilapasciamis.com', '$2a$10$vfC7wKui/KlrPvjXd92.YOrd1ZR1hrUydjiXhzm1lHQOJ2f5BK0Um', 'wali_pas', 'Lapas Kelas IIB Ciamis', 'Wali Pemasyarakatan', '081320100001', 'aktif'),
(6, 'Ii Sukiman', '198409212008011005', 'ii.walipas@sipastilapasciamis.com', '$2a$10$vfC7wKui/KlrPvjXd92.YOrd1ZR1hrUydjiXhzm1lHQOJ2f5BK0Um', 'wali_pas', 'Lapas Kelas IIB Ciamis', 'Wali Pemasyarakatan', '081320100002', 'aktif'),
(7, 'Didiek Nurbani', '198602112009011006', 'didiek.walipas@sipastilapasciamis.com', '$2a$10$vfC7wKui/KlrPvjXd92.YOrd1ZR1hrUydjiXhzm1lHQOJ2f5BK0Um', 'wali_pas', 'Lapas Kelas IIB Ciamis', 'Wali Pemasyarakatan', '081320100003', 'aktif'),
(8, 'Ogie Gustaman', '198811052012121007', 'ogie.walipas@sipastilapasciamis.com', '$2a$10$vfC7wKui/KlrPvjXd92.YOrd1ZR1hrUydjiXhzm1lHQOJ2f5BK0Um', 'wali_pas', 'Lapas Kelas IIB Ciamis', 'Wali Pemasyarakatan', '081320100004', 'aktif'),
(9, 'Dedi Kusmayadi', '198307182007031008', 'dedi.walipas@sipastilapasciamis.com', '$2a$10$vfC7wKui/KlrPvjXd92.YOrd1ZR1hrUydjiXhzm1lHQOJ2f5BK0Um', 'wali_pas', 'Lapas Kelas IIB Ciamis', 'Wali Pemasyarakatan', '081320100005', 'aktif'),
(10, 'Endang Lukman', '198201252006041009', 'endang.walipas@sipastilapasciamis.com', '$2a$10$vfC7wKui/KlrPvjXd92.YOrd1ZR1hrUydjiXhzm1lHQOJ2f5BK0Um', 'wali_pas', 'Lapas Kelas IIB Ciamis', 'Wali Pemasyarakatan', '081320100006', 'aktif'),
(11, 'Herdi Permadi', '198906032014021010', 'herdi.walipas@sipastilapasciamis.com', '$2a$10$vfC7wKui/KlrPvjXd92.YOrd1ZR1hrUydjiXhzm1lHQOJ2f5BK0Um', 'wali_pas', 'Lapas Kelas IIB Ciamis', 'Wali Pemasyarakatan', '081320100007', 'aktif'),
(12, 'Ade Dadang Muslihudin', '198512192009121011', 'ade.walipas@sipastilapasciamis.com', '$2a$10$vfC7wKui/KlrPvjXd92.YOrd1ZR1hrUydjiXhzm1lHQOJ2f5BK0Um', 'wali_pas', 'Lapas Kelas IIB Ciamis', 'Wali Pemasyarakatan', '081320100008', 'aktif'),
(13, 'Ust. Ahmad Fauzi, M.Ag', '3207011205820001', 'mitra@sipastilapasciamis.com', '$2a$10$vfC7wKui/KlrPvjXd92.YOrd1ZR1hrUydjiXhzm1lHQOJ2f5BK0Um', 'mitra', 'Kementerian Agama Kab. Ciamis', 'Penyuluh Agama Islam', '085223001001', 'aktif'),
(14, 'KH. Cecep Abdurrahman', '3207012208780002', 'pesantren.mitra@sipastilapasciamis.com', '$2a$10$vfC7wKui/KlrPvjXd92.YOrd1ZR1hrUydjiXhzm1lHQOJ2f5BK0Um', 'mitra', 'Pondok Pesantren Darussalam Ciamis', 'Pembimbing Tahsin & Kajian Kitab', '085223001002', 'aktif');

-- 5 Program Pembinaan Spiritual Resmi (Total Bobot Tepat 100.00%)
INSERT INTO `programs` (`id`, `kode_program`, `nama_program`, `kategori`, `deskripsi`, `bobot`, `target_bulanan`, `jadwal`, `lokasi`, `status`) VALUES
(1, 'PRG-QURAN-TAHSIN', 'Pembelajaran Al-Quran & Tahsin', 'Keduanya', 'Program tahsin, tadarus harian, dan hafalan surat Al-Quran bersama Wali PAS dan Mitra Kemenag.', 30.00, 24, 'Senin - Sabtu, 08:30 WIB', 'Masjid At-Taubah Lapas Ciamis', 'aktif'),
(2, 'PRG-SHOLAT-FARDHU', 'Sholat Fardhu Berjamaah', 'Keduanya', 'Pelaksanaan sholat fardhu 5 waktu berjamaah secara disiplin dan tepat waktu di masjid/blok hunian.', 25.00, 30, 'Setiap Hari (5 Waktu)', 'Masjid At-Taubah Lapas Ciamis', 'aktif'),
(3, 'PRG-KAJIAN-FIQIH', 'Kajian Fiqih & Ibadah', 'Keduanya', 'Pendalaman hukum ibadah praktis, thaharah, dan fiqih keseharian bersama Penyuluh Agama Kemenag.', 20.00, 16, 'Selasa & Kamis, 09:30 WIB', 'Masjid At-Taubah Lapas Ciamis', 'aktif'),
(4, 'PRG-KONSELING-ROHANI', 'Bimbingan Konseling Rohani', 'PPKS', 'Bimbingan personal dan konseling spiritual bersama Wali PAS untuk penguatan mental moral.', 15.00, 12, 'Rabu & Sabtu, 10:00 WIB', 'Ruang Bimbingan Rohani', 'aktif'),
(5, 'PRG-PHBI', 'Peringatan Hari Besar Islam', 'SPPN', 'Kegiatan hari besar keagamaan, istighosah akbar, tabligh akbar, dan peringatan hari besar Islam lainnya.', 10.00, 4, 'Insidental & Bulanan', 'Aula Pembinaan Lapas Ciamis', 'aktif');

INSERT INTO `wbp` (`id`, `no_registrasi`, `nama`, `nik`, `tempat_lahir`, `tanggal_lahir`, `agama`, `blok_kamar`, `perkara`, `lama_pidana`, `tanggal_masuk`, `ekspirasi`, `wali_pas_id`, `status`, `kualifikasi_akhir`, `sppn_terakhir`, `ppks_terakhir`, `status_rekomendasi`) VALUES
(1, 'BI.001/2025/CMS', 'JAJANG BIN WAWAN', '3207011002910001', 'Ciamis', '1991-02-10', 'Islam', 'Blok A / Kamar 01', 'Pidana Umum', '2 Tahun 6 Bulan', '2025-03-10', '2027-09-10', 5, 'aktif', 2, 84.50, 4.35, 'direkomendasikan'),
(2, 'BI.002/2025/CMS', 'AEP SAEPUL AZIS BIN EJE', '3207021504890002', 'Ciamis', '1989-04-15', 'Islam', 'Blok A / Kamar 02', 'Pidana Umum', '3 Tahun', '2025-01-20', '2028-01-20', 6, 'aktif', 2, 81.00, 4.20, 'direkomendasikan'),
(3, 'BI.003/2025/CMS', 'ASEP FACHRUDIN BIN SAHATA', '3207032206930003', 'Tasikmalaya', '1993-06-22', 'Islam', 'Blok A / Kamar 03', 'Narkotika', '4 Tahun', '2024-11-05', '2028-11-05', 8, 'aktif', 1, 74.00, 3.75, 'direkomendasikan_dengan_catatan'),
(4, 'BI.004/2025/CMS', 'ERWIN HIDAYAT BIN OTANG PERMANA', '3207040808900004', 'Ciamis', '1990-08-08', 'Islam', 'Blok B / Kamar 01', 'Pidana Umum', '2 Tahun', '2025-05-12', '2027-05-12', 7, 'aktif', 0, 66.00, 3.60, 'tidak_direkomendasikan'),
(5, 'BI.005/2025/CMS', 'MOH YUSUF BIN ROBERT', '3207051901950005', 'Banjar', '1995-01-19', 'Islam', 'Blok B / Kamar 02', 'Narkotika', '3 Tahun 6 Bulan', '2024-09-18', '2028-03-18', 5, 'aktif', 2, 88.00, 4.60, 'direkomendasikan'),
(6, 'BI.006/2025/CMS', 'NIZAR HASYIMI BIN YAMAN', '3207062503940006', 'Ciamis', '1994-03-25', 'Islam', 'Blok B / Kamar 03', 'Pidana Umum', '1 Tahun 8 Bulan', '2025-06-01', '2027-02-01', 7, 'aktif', 2, 86.00, 4.45, 'direkomendasikan'),
(7, 'BI.007/2025/CMS', 'ROHADI BIN SAHRUDIN (ALM)', '3207071407860007', 'Ciamis', '1986-07-14', 'Islam', 'Blok C / Kamar 01', 'Pidana Umum', '3 Tahun', '2024-12-10', '2027-12-10', 10, 'aktif', 0, 63.00, 3.20, 'tidak_direkomendasikan'),
(8, 'BI.008/2025/CMS', 'SUHENDAR BIN AEP', '3207080309920008', 'Pangandaran', '1992-09-03', 'Islam', 'Blok C / Kamar 02', 'Pidana Umum', '2 Tahun 4 Bulan', '2025-02-14', '2027-06-14', 6, 'aktif', 2, 79.00, 4.15, 'direkomendasikan'),
(9, 'BI.009/2025/CMS', 'SUPYAN SAORI BIN H TARMUDI', '3207091711880009', 'Ciamis', '1988-11-17', 'Islam', 'Blok C / Kamar 03', 'Narkotika', '5 Tahun', '2024-04-01', '2029-04-01', 6, 'aktif', 1, 72.00, 3.85, 'direkomendasikan_dengan_catatan'),
(10, 'BI.010/2025/CMS', 'UJANG KHIYAR BIN KHOIRUDIN', '3207102805900010', 'Ciamis', '1990-05-28', 'Islam', 'Blok D / Kamar 01', 'Pidana Umum', '2 Tahun', '2025-04-15', '2027-04-15', 9, 'aktif', 2, 82.00, 4.25, 'direkomendasikan'),
(11, 'BI.011/2025/CMS', 'YUYU WAHYUDIN BIN DEDE SUPARDI', '3207110910870011', 'Ciamis', '1987-10-09', 'Islam', 'Blok D / Kamar 02', 'Pidana Umum', '3 Tahun', '2024-10-20', '2027-10-20', 11, 'aktif', 1, 71.00, 3.70, 'direkomendasikan_dengan_catatan'),
(12, 'BI.012/2025/CMS', 'LALAN ANWARI BIN URI', '3207122112930012', 'Ciamis', '1993-12-21', 'Islam', 'Blok D / Kamar 03', 'Pidana Umum', '2 Tahun 6 Bulan', '2025-01-08', '2027-07-08', 12, 'aktif', 2, 83.00, 4.30, 'direkomendasikan'),
(13, 'BI.013/2025/CMS', 'IMAN GUMELAR BIN ILI HERLINA', '3207130603960013', 'Tasikmalaya', '1996-03-06', 'Islam', 'Blok A / Kamar 04', 'Narkotika', '4 Tahun', '2024-08-12', '2028-08-12', 9, 'aktif', 2, 80.00, 4.10, 'direkomendasikan'),
(14, 'BI.014/2025/CMS', 'USEP MUHAMAD FAHMI BIN JAJANG', '3207141206970014', 'Ciamis', '1997-06-12', 'Islam', 'Blok B / Kamar 04', 'Pidana Umum', '1 Tahun 6 Bulan', '2025-07-01', '2027-01-01', 5, 'aktif', 2, 85.00, 4.40, 'direkomendasikan'),
(15, 'BI.015/2025/CMS', 'INDRA PRAHESA BIN DEDI', '3207152408940015', 'Ciamis', '1994-08-24', 'Islam', 'Blok C / Kamar 04', 'Pidana Umum', '2 Tahun', '2025-03-22', '2027-03-22', 5, 'aktif', 1, 70.00, 3.80, 'direkomendasikan_dengan_catatan'),
(16, 'BI.016/2025/CMS', 'RIDHO MAULANA BIN CUCU SUARMAN', '3207163001980016', 'Ciamis', '1998-01-30', 'Islam', 'Blok D / Kamar 04', 'Pidana Umum', '2 Tahun 3 Bulan', '2025-05-05', '2027-08-05', 8, 'aktif', 2, 87.00, 4.50, 'direkomendasikan');

INSERT INTO `mitra_registrations` (`id`, `user_id`, `nama_lengkap`, `lembaga_instansi`, `bidang_keahlian`, `email`, `no_hp`, `alamat`, `status`, `catatan_admin`) VALUES
(1, 13, 'Ust. Ahmad Fauzi, M.Ag', 'Kementerian Agama Kab. Ciamis', 'Tahsin Al-Quran & Bimbingan Rohani Islam', 'mitra@sipastilapasciamis.com', '085223001001', 'Jl. Jend. Sudirman No. 48, Ciamis', 'disetujui', 'Mitra aktif berdasarkan MoU Kemenag Ciamis.'),
(2, 14, 'KH. Cecep Abdurrahman', 'Pondok Pesantren Darussalam Ciamis', 'Kajian Kitab Kuning, Akhlak & Istighosah', 'pesantren.mitra@sipastilapasciamis.com', '085223001002', 'Cijeungjing, Kabupaten Ciamis', 'disetujui', 'Mitra pembinaan pesantren lapas.'),
(3, NULL, 'Ust. Dadan Ramdani, S.Pd.I', 'MUI Kabupaten Ciamis', 'Dakwah & Konseling Spiritual', 'dadan.mui@example.com', '085314009988', 'Jl. Pemuda No. 12, Ciamis', 'pending', 'Menunggu verifikasi surat tugas lembaga.');

INSERT INTO `assessments` (`tanggal`, `triwulan`, `tahun`, `wbp_id`, `asesor_id`, `program_id`, `jenis_penilaian`, `pelaksanaan`, `alasan_tidak_hadir`, `nilai_karakter`, `sub_ibadah`, `sub_pemahaman`, `sub_kedisiplinan`, `sub_akhlak`, `sub_sosial`, `skor_akhir`, `keterangan`, `verifikasi_kasubsi`) VALUES
('2026-09-12 08:45:00', 'TW-III', 2026, 6, 7, 1, 'SPPN', 'Ya', NULL, 5, 5, 5, 5, 5, 5, 100.00, 'Al-Fatihah 1-7 lancar dan tartil', 'terverifikasi'),
('2026-09-12 12:15:00', 'TW-III', 2026, 6, 7, 2, 'PPKS', 'Ya', NULL, 5, 5, 5, 4, 5, 5, 96.00, 'Tepat Waktu berjamaah shaf terdepan', 'terverifikasi'),
('2026-09-15 09:00:00', 'TW-III', 2026, 1, 5, 1, 'SPPN', 'Ya', NULL, 4, 4, 4, 4, 4, 4, 80.00, 'Al-Baqarah 1-20 baik', 'terverifikasi'),
('2026-09-16 12:10:00', 'TW-III', 2026, 2, 6, 2, 'PPKS', 'Ya', NULL, 5, 5, 4, 5, 4, 5, 92.00, 'Tepat Waktu mengikuti dzikir ba\'da sholat', 'terverifikasi'),
('2026-09-18 14:00:00', 'TW-III', 2026, 3, 8, 5, 'SPPN', 'Ya', NULL, 4, 4, 4, 4, 4, 4, 80.00, 'Mengikuti do\'a bersama dengan khusyuk', 'terverifikasi'),
('2026-10-03 08:40:00', 'TW-IV', 2026, 6, 13, 1, 'PPKS', 'Ya', NULL, 5, 5, 5, 5, 5, 5, 100.00, 'Al-Baqarah 22-35 tajwid sangat baik', 'terverifikasi'),
('2026-10-05 12:20:00', 'TW-IV', 2026, 1, 5, 2, 'SPPN', 'Ya', NULL, 4, 4, 5, 4, 4, 4, 84.00, 'Tepat Waktu', 'terverifikasi'),
('2026-10-08 09:10:00', 'TW-IV', 2026, 2, 6, 1, 'SPPN', 'Ya', NULL, 4, 4, 4, 4, 3, 4, 76.00, 'Al-Baqarah 22-35 cukup lancar', 'terverifikasi'),
('2026-10-10 08:30:00', 'TW-IV', 2026, 4, 7, 1, 'PPKS', 'Tidak', 'Sakit / Rawat Klinik', 3, 3, 3, 3, 2, 3, 40.00, 'Sakit (istirahat di poliklinik)', 'terverifikasi'),
('2026-10-12 12:15:00', 'TW-IV', 2026, 5, 5, 2, 'SPPN', 'Ya', NULL, 4, 4, 4, 4, 4, 4, 80.00, 'Tepat Waktu', 'terverifikasi'),
('2026-10-14 09:30:00', 'TW-IV', 2026, 7, 10, 4, 'PPKS', 'Ya', NULL, 4, 4, 4, 5, 4, 4, 84.00, 'Bimbingan konseling rohani intensif', 'terverifikasi'),
('2026-10-18 14:00:00', 'TW-IV', 2026, 8, 14, 5, 'SPPN', 'Ya', NULL, 4, 4, 4, 4, 5, 4, 84.00, 'Aktif memimpin tahlil dan do\'a', 'terverifikasi'),
('2026-10-20 08:50:00', 'TW-IV', 2026, 9, 6, 1, 'SPPN', 'Ya', NULL, 3, 3, 4, 3, 3, 3, 64.00, 'Iqro jilid 5 halaman 12', 'terverifikasi'),
('2026-10-22 12:10:00', 'TW-IV', 2026, 10, 9, 2, 'PPKS', 'Ya', NULL, 4, 4, 4, 4, 4, 4, 80.00, 'Tepat Waktu', 'terverifikasi'),
('2026-10-25 09:00:00', 'TW-IV', 2026, 11, 11, 1, 'SPPN', 'Ya', NULL, 3, 3, 3, 4, 3, 3, 64.00, 'Membaca juz 30 dengan bimbingan', 'terverifikasi'),
('2026-10-28 12:05:00', 'TW-IV', 2026, 12, 12, 2, 'PPKS', 'Ya', NULL, 4, 5, 4, 4, 4, 4, 84.00, 'Tepat Waktu', 'terverifikasi'),
('2026-11-02 08:45:00', 'TW-IV', 2026, 1, 5, 1, 'SPPN', 'Ya', NULL, 4, 4, 4, 5, 4, 4, 84.00, 'Baik, bacaan semakin fasih', 'terverifikasi'),
('2026-11-04 09:15:00', 'TW-IV', 2026, 5, 6, 3, 'PPKS', 'Ya', NULL, 4, 4, 4, 4, 4, 4, 80.00, 'Kajian fiqih thaharah dan sholat', 'terverifikasi'),
('2026-11-06 12:12:00', 'TW-IV', 2026, 6, 7, 2, 'SPPN', 'Ya', NULL, 5, 5, 5, 5, 5, 5, 100.00, 'Hadir tepat waktu dan khusyuk', 'terverifikasi'),
('2026-11-08 08:35:00', 'TW-IV', 2026, 13, 9, 1, 'SPPN', 'Ya', NULL, 4, 4, 4, 4, 4, 4, 80.00, 'Tadarus Al-Imran 1-25', 'terverifikasi'),
('2026-11-10 13:45:00', 'TW-IV', 2026, 14, 13, 5, 'PPKS', 'Ya', NULL, 4, 4, 4, 4, 4, 4, 80.00, 'Mengikuti do\'a bersama dan tausiyah', 'terverifikasi'),
('2026-11-11 08:40:00', 'TW-IV', 2026, 15, 5, 1, 'SPPN', 'Ya', NULL, 3, 3, 3, 4, 3, 3, 64.00, 'Perlu pendampingan makharijul huruf', 'menunggu'),
('2026-11-12 12:15:00', 'TW-IV', 2026, 16, 8, 2, 'PPKS', 'Ya', NULL, 5, 5, 5, 4, 5, 5, 96.00, 'Tepat waktu dan disiplin', 'menunggu'),
('2026-11-14 08:55:00', 'TW-IV', 2026, 2, 14, 1, 'SPPN', 'Ya', NULL, 5, 5, 4, 5, 5, 5, 96.00, 'Setoran hafalan An-Naba sangat baik', 'menunggu'),
('2026-11-15 09:20:00', 'TW-IV', 2026, 3, 8, 4, 'PPKS', 'Tidak', 'Kunjungan / Besukan Keluarga', NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'Besuk keluarga', 'terverifikasi'),
('2026-11-16 12:10:00', 'TW-IV', 2026, 6, 13, 2, 'SPPN', 'Ya', NULL, 5, 5, 5, 5, 5, 5, 100.00, 'Sangat disiplin dan menjadi teladan blok', 'terverifikasi'),
('2026-11-17 08:50:00', 'TW-IV', 2026, 1, 5, 5, 'PPKS', 'Ya', NULL, 5, 5, 4, 5, 5, 5, 96.00, 'Hadir penuh pada do\'a bersama pagi', 'menunggu');

INSERT INTO `attendances` (`wbp_id`, `program_id`, `tanggal_absen`, `foto_selfie`, `face_match_score`, `face_verified`, `status_kehadiran`, `metode`, `lokasi`, `catatan`, `recorded_by`) VALUES
(6, 1, '2026-11-14 08:31:00', NULL, 94.80, 1, 'Hadir', 'face_id_selfie', 'Masjid At-Taubah Lapas Kelas IIB Ciamis', 'Verifikasi Face ID berhasil', 7),
(1, 2, '2026-11-15 11:55:00', NULL, 91.20, 1, 'Hadir', 'face_id_selfie', 'Masjid At-Taubah Lapas Kelas IIB Ciamis', 'Hadir tepat waktu sebelum adzan Dzuhur', 5),
(2, 1, '2026-11-15 08:34:00', NULL, 89.50, 1, 'Hadir', 'face_id_selfie', 'Masjid At-Taubah Lapas Kelas IIB Ciamis', 'Verifikasi Face ID berhasil', 6),
(5, 4, '2026-11-16 07:45:00', NULL, 93.10, 1, 'Hadir', 'face_id_selfie', 'Masjid At-Taubah Lapas Kelas IIB Ciamis', 'Konseling rohani pagi', 5),
(16, 2, '2026-11-16 11:58:00', NULL, 95.40, 1, 'Hadir', 'face_id_selfie', 'Masjid At-Taubah Lapas Kelas IIB Ciamis', 'Verifikasi Face ID berhasil', 8),
(3, 5, '2026-11-17 13:35:00', NULL, 88.60, 1, 'Terlambat', 'face_id_selfie', 'Aula Pembinaan Lapas Ciamis', 'Datang terlambat 5 menit', 8);
