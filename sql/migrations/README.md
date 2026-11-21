# Panduan Migrasi Database SI PASTI — Lapas Kelas IIB Ciamis

## 🌟 File Migrasi Utama (Rekomendasi — Tinggal Upload 1 File Ini):

### 📄 [`migration_si_pasti_update_semua.sql`](migration_si_pasti_update_semua.sql)
*(atau file [`20261121_001_update_sppn_ppks_and_programs.sql`](20261121_001_update_sppn_ppks_and_programs.sql))*

File ini **100% aman dari error `#1060 (Duplicate column name)`**. 
Script ini memeriksa setiap kolom (`triwulan`, `tahun`, `sub_ibadah`, `kualifikasi_akhir`, dll.) secara otomatis. Jika kolom sudah ada di database Anda, perintah penambahan kolom tersebut dilewati tanpa error, lalu langsung melanjutkan ke kolom yang belum ada, menyinkronkan 5 program resmi Lapas Ciamis, dan melengkapi data riwayat penilaian.

---

## 🚀 Cara Import Cepat via phpMyAdmin

1. Buka **phpMyAdmin** di browser Anda.
2. Di panel sebelah kiri, pilih database: **`sipasti_lapas`**.
3. Klik tab **"Import"** di bar menu atas.
4. Klik **"Choose File" / "Pilih File"**, pilih file:
   👉 **`migration_si_pasti_update_semua.sql`**
5. Gulir ke bawah dan klik tombol **"Kirim" / "Go"**.
6. Selesai! Pesan hijau sukses akan tampil:
   `MIGRASI BERHASIL! Seluruh tabel, kolom baru, data program, dan riwayat penilaian telah tersinkronisasi 100%.`

---

## 📁 File Migrasi Per Tabel (Opsi Modular)

Jika Anda ingin meng-upload secara bertahap per tabel:

| No | File | Keterangan |
|---|---|---|
| 1 | [`001_alter_table_assessments.sql`](001_alter_table_assessments.sql) | Kolom baru tabel `assessments` |
| 2 | [`002_alter_table_wbp.sql`](002_alter_table_wbp.sql) | Kolom baru tabel `wbp` |
| 3 | [`003_update_master_programs.sql`](003_update_master_programs.sql) | Sinkronisasi master 5 program |
| 4 | [`004_sync_existing_data.sql`](004_sync_existing_data.sql) | Inisialisasi triwulan data lama |
