# SIPASTI — Lapas Kelas IIB Ciamis

**Sistem Informasi Penilaian Aktivitas Spiritual Terintegrasi (SI PASTI)** untuk Lembaga Pemasyarakatan Kelas IIB Ciamis. Seluruh alur ekstraksi data, pencatatan penilaian **SPPN & PPKS**, **Absensi Biometrik Face ID & Selfie Kamera**, pengolahan bobot/target, 4 Dasbor Analitik, hingga **Export Laporan PDF resmi** dikelola 100% mandiri di dalam aplikasi (tanpa integrasi Google Forms/Sheets/Looker).

## Fitur Utama

1. **4 Dasbor Visualisasi & Pengolahan Data**
   - **Dasbor Umum**: KPI utama, tren SPPN & PPKS bulanan, realisasi per program, top WBP, aktivitas terbaru.
   - **Dasbor & Profil WBP**: Skor total berbobot (`Bobot`, `Target`, `Jumlah`, `Nilai Karakter`), predikat kelayakan remisi/integrasi, detail profil & grafik per WBP, dan **Download PDF Rapor WBP**.
   - **Dasbor Program**: Evaluasi bobot, target kolektif, realisasi Ya/Tidak, capaian %, rata-rata skor.
   - **Dasbor Asesor**: Monitoring produktivitas input penilaian oleh **Wali PAS** dan **Mitra Keagamaan**.
2. **Penilaian SPPN & PPKS (Tabel Sentral SI PASTI)**
   - Input & edit via Modal oleh **Admin**, **Wali PAS**, dan **Mitra**.
   - Verifikasi respon data oleh **Kasubsi Reg & Bimkemas** / **Kasi Binadik**.
   - Upload bukti foto kegiatan opsional.
3. **Absensi Warga Binaan dengan Face ID & Selfie Kamera**
   - Pendaftaran biometrik Face ID WBP (128-dimensi descriptor wajah + foto referensi) di halaman Data WBP.
   - Kiosk Absensi publik (`/absensi-kiosk`) & halaman Absensi internal (`/app/absensi`) dengan kamera live, deteksi wajah oval, pencocokan biometrik Face ID, dan simpan foto selfie ke `backend/uploads-sipasti/absensi/`.
4. **Filter Rentang Waktu, Debounce Search & React Select**
   - Semua data & dasbor mendukung filter rentang waktu menggunakan `react-datepicker`.
   - Komponen select menggunakan `react-select` & `react-select/async` dengan debounce `>= 350ms` pada pencarian API.
   - Semua tabel mendukung pencarian realtime (debounce `>= 350ms`) dan pagination backend (`10`, `25`, `50`, `100`).
5. **Export Laporan PDF Resmi**
   - Kop surat resmi Lapas Kelas IIB Ciamis dilengkapi logo baru SIPASTI, tabel rekapitulasi, dan blok tanda tangan Ka. Lapas & Kasi Binadik.
6. **PWA (Progressive Web App)**
   - Mendukung instalasi aplikasi di perangkat mobile/tablet petugas dan kiosk absensi.

## Tech Stack

- **Frontend**: React + Vite + JSX, PWA (`vite-plugin-pwa`), TailwindCSS, Lucide React, React Hot Toast, React Datepicker, React Select, Recharts, jsPDF + jspdf-autotable, Axios.
- **Backend**: Express JS (1 file utama `backend/server.js`), MySQL (`mysql2`), Multer (`uploads-sipasti/`), JWT + bcryptjs, CORS, dotenv.

## Instalasi & Menjalankan Lokal

### 1. Import Database MySQL
```bash
mysql -u root -p < backend/sql/database.sql
```

### 2. Jalankan Backend
```bash
cd backend
cp .env.example .env   # sesuaikan DB_USER, DB_PASSWORD, DB_NAME
npm install
npm run dev
```
Backend berjalan di `https://api.kingcreativestudio.my.id/sipasti-lapas`.

### 3. Jalankan Frontend
```bash
cd frontend
cp .env.example .env   # pastikan VITE_API_URL=https://api.kingcreativestudio.my.id/sipasti-lapas/api
npm install
npm run dev
```
Frontend berjalan di `http://localhost:5173`.

## Akun Demo Default (Password: `sipasti123`)

| Peran | Email |
|---|---|
| Admin SIPASTI | `admin@sipastilapasciamis.com` |
| Ka. Lapas | `kalapas@sipastilapasciamis.com` |
| Kasi Binadik | `kasibinadik@sipastilapasciamis.com` |
| Kasubsi Reg & Bimkemas | `kasubsi@sipastilapasciamis.com` |
| Wali PAS | `hendra.walipas@sipastilapasciamis.com` |
| Mitra Keagamaan | `mitra@sipastilapasciamis.com` |
# sipasti-lapas-ciamis
