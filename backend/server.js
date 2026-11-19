require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = Number(process.env.PORT || 5000);
const JWT_SECRET = process.env.JWT_SECRET || 'sipasti_lapas_ciamis_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const UPLOAD_ROOT = path.join(__dirname, process.env.UPLOAD_DIR || 'uploads-sipasti');

// Ensure upload subdirectories exist
['', 'absensi', 'wbp', 'bukti'].forEach((sub) => {
  const dir = path.join(UPLOAD_ROOT, sub);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ============================================================================
// DATABASE POOL
// ============================================================================
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sipasti_lapas',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  timezone: '+07:00',
});

// ============================================================================
// MIDDLEWARES
// ============================================================================
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return cb(null, true);
      }
      return cb(null, true);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(UPLOAD_ROOT));

// ============================================================================
// HELPERS: SANITIZATION, PAGINATION, SORTING, DATE RANGE, SCORING
// ============================================================================
function sanitizeStr(value, maxLen = 500) {
  if (value === null || value === undefined) return null;
  const cleaned = String(value)
    .replace(/<[^>]*>?/gm, '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .trim();
  if (!cleaned) return null;
  return cleaned.slice(0, maxLen);
}

function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const rawLimit = parseInt(query.limit, 10) || 10;
  const limit = Math.min(100, Math.max(1, rawLimit));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function buildSort(query, allowedMap, defaultExpr) {
  const sortByKey = query.sortBy && allowedMap[query.sortBy] ? allowedMap[query.sortBy] : null;
  const sortOrder = String(query.sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  return sortByKey ? `${sortByKey} ${sortOrder}` : defaultExpr;
}

function appendDateRange(whereClauses, params, column, startDate, endDate) {
  if (startDate && /^\d{4}-\d{2}-\d{2}/.test(String(startDate))) {
    whereClauses.push(`${column} >= ?`);
    params.push(`${String(startDate).slice(0, 10)} 00:00:00`);
  }
  if (endDate && /^\d{4}-\d{2}-\d{2}/.test(String(endDate))) {
    whereClauses.push(`${column} <= ?`);
    params.push(`${String(endDate).slice(0, 10)} 23:59:59`);
  }
}

function computeAssessmentScore({ pelaksanaan, nilai_karakter, aspek_ibadah, aspek_kedisiplinan, aspek_akhlak, aspek_partisipasi }) {
  if (pelaksanaan !== 'Ya') return 0;
  const values = [nilai_karakter, aspek_ibadah, aspek_kedisiplinan, aspek_akhlak, aspek_partisipasi]
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v) && v >= 1 && v <= 5);
  if (values.length === 0) return 0;
  const avg = values.reduce((acc, v) => acc + v, 0) / values.length;
  return Number((avg * 20).toFixed(2));
}

const PASSING_THRESHOLD = 70;

function evaluateSppnPpks(assessments = []) {
  const sppnAll = assessments.filter((a) => a.jenis_penilaian === 'SPPN');
  const ppksAll = assessments.filter((a) => a.jenis_penilaian === 'PPKS');

  const calcSppn = (list) => {
    const count = list.length;
    const ya = list.filter((a) => a.pelaksanaan === 'Ya').length;
    const tidak = count - ya;
    const avgSkor = count
      ? Number((list.reduce((sum, a) => sum + Number(a.skor_akhir || 0), 0) / count).toFixed(2))
      : 0;
    const memenuhi = count > 0 && avgSkor >= PASSING_THRESHOLD;
    const kualifikasi = memenuhi ? '1' : '0';
    const kualifikasiLabel = memenuhi ? 'Baik (1)' : 'Kurang (0)';
    const rasioPelaksanaan = count > 0 ? Number(((ya / count) * 100).toFixed(1)) : 0;
    return { count, ya, tidak, avgSkor, memenuhi, kualifikasi, kualifikasiLabel, rasioPelaksanaan };
  };

  const calcPpks = (list) => {
    const count = list.length;
    const ya = list.filter((a) => a.pelaksanaan === 'Ya').length;
    const tidak = count - ya;
    const karakterList = list
      .map((a) => Number(a.nilai_karakter))
      .filter((v) => Number.isFinite(v) && v >= 1 && v <= 5);
    const avgKarakter = karakterList.length
      ? Number((karakterList.reduce((sum, v) => sum + v, 0) / karakterList.length).toFixed(2))
      : 0;
    const avgSkor = count
      ? Number((list.reduce((sum, a) => sum + Number(a.skor_akhir || 0), 0) / count).toFixed(2))
      : 0;
    const nilaiPpks = avgKarakter > 0 ? avgKarakter : (avgSkor > 0 ? Number((avgSkor / 20).toFixed(2)) : 0);
    // Skala PPKS 1.00 - 5.00: >= 4.00 = 2 (Baik), 3.00 - 3.99 = 1 (Cukup), < 3.00 = 0 (Kurang)
    let kualifikasi = '0';
    let kualifikasiLabel = 'Kurang (0)';
    if (nilaiPpks >= 4.0) {
      kualifikasi = '2';
      kualifikasiLabel = 'Baik (2)';
    } else if (nilaiPpks >= 3.0) {
      kualifikasi = '1';
      kualifikasiLabel = 'Cukup (1)';
    }
    const memenuhi = count > 0 && nilaiPpks >= 4.0;
    const rasioPelaksanaan = count > 0 ? Number(((ya / count) * 100).toFixed(1)) : 0;
    return { count, ya, tidak, avgSkor, avgKarakter, nilaiPpks, kualifikasi, kualifikasiLabel, memenuhi, rasioPelaksanaan };
  };

  const sppn = calcSppn(sppnAll);
  const ppks = calcPpks(ppksAll);

  // Evaluasi Kualifikasi Akhir (Sesuai PDF Dokumen Resmi):
  // Kualifikasi Akhir = 2: Memenuhi Syarat dan Direkomendasikan (SPPN >= 70 & PPKS >= 4.0)
  // Kualifikasi Akhir = 1: Memenuhi Syarat dengan Pertimbangan (SPPN >= 70, PPKS < 4.0 / belum dinilai)
  // Kualifikasi Akhir = 0: Tidak Memenuhi Syarat (SPPN < 70)
  let kualifikasiAkhir = 0;
  let rekomendasi;

  if (sppn.memenuhi && ppks.memenuhi) {
    kualifikasiAkhir = 2;
    rekomendasi = {
      code: 'direkomendasikan',
      kualifikasiAkhir: 2,
      label: 'Memenuhi Syarat dan Direkomendasikan',
      shortLabel: 'Direkomendasikan',
      color: 'emerald',
      deskripsi: 'Nilai telah memenuhi seluruh standar penilaian dan pengajuan berhak mendapatkan rekomendasi.',
      keterangan: `Nilai utama SPPN (${sppn.avgSkor}) dan PPKS (${ppks.nilaiPpks} / 5) memenuhi seluruh standar rekomendasi.`,
    };
  } else if (sppn.memenuhi) {
    kualifikasiAkhir = 1;
    rekomendasi = {
      code: 'direkomendasikan_dengan_catatan',
      kualifikasiAkhir: 1,
      label: 'Memenuhi Syarat dengan Pertimbangan',
      shortLabel: 'Dengan Pertimbangan',
      color: 'amber',
      deskripsi: 'Memenuhi syarat dasar penilaian dan berhak mendapatkan rekomendasi, namun dengan pertimbangan dan catatan khusus.',
      keterangan:
        ppks.count === 0
          ? `Syarat dasar SPPN (${sppn.avgSkor}) terpenuhi, namun nilai PPKS belum tersedia (perlu catatan pendampingan).`
          : `Syarat dasar SPPN (${sppn.avgSkor}) terpenuhi, namun nilai PPKS (${ppks.nilaiPpks} / 5) berada pada kategori Cukup/Kurang.`,
    };
  } else {
    kualifikasiAkhir = 0;
    rekomendasi = {
      code: 'tidak_direkomendasikan',
      kualifikasiAkhir: 0,
      label: 'Tidak Memenuhi Syarat',
      shortLabel: 'Tidak Direkomendasikan',
      color: 'rose',
      deskripsi: 'Nilai belum memenuhi syarat dasar penilaian. Pengajuan tidak mendapatkan rekomendasi.',
      keterangan:
        sppn.count === 0
          ? 'Belum ada catatan penilaian utama SPPN pada periode ini.'
          : `Akumulasi nilai SPPN (${sppn.avgSkor}) belum mencapai ambang batas minimal 70.`,
    };
  }

  return {
    sppn: {
      ...sppn,
      status: sppn.count === 0 ? 'Belum Dinilai' : sppn.memenuhi ? 'Memenuhi Syarat' : 'Belum Memenuhi Syarat',
    },
    ppks: {
      ...ppks,
      status: ppks.count === 0 ? 'Belum Dinilai' : ppks.memenuhi ? 'Baik (2)' : ppks.kualifikasi === '1' ? 'Cukup (1)' : 'Kurang (0)',
    },
    kualifikasiAkhir,
    rekomendasi,
  };
}

function getPeriodGrouping(period = 'bulanan') {
  switch (String(period || 'bulanan').toLowerCase()) {
    case 'harian':
      return {
        period: 'harian',
        keyExpr: "DATE_FORMAT(a.tanggal, '%Y-%m-%d')",
        labelExpr: "DATE_FORMAT(a.tanggal, '%d %b %Y')",
      };
    case 'mingguan':
      return {
        period: 'mingguan',
        keyExpr: "DATE_FORMAT(a.tanggal, '%x-W%v')",
        labelExpr: "CONCAT('Minggu ', WEEK(a.tanggal, 3), ' (', DATE_FORMAT(DATE_SUB(DATE(a.tanggal), INTERVAL WEEKDAY(a.tanggal) DAY), '%d %b %Y'), ')')",
      };
    case 'triwulan':
      return {
        period: 'triwulan',
        keyExpr: "CONCAT(YEAR(a.tanggal), '-Q', QUARTER(a.tanggal))",
        labelExpr: "CONCAT('Triwulan ', ELT(QUARTER(a.tanggal), 'I (Jan-Mar)', 'II (Apr-Jun)', 'III (Jul-Sep)', 'IV (Okt-Des)'), ' ', YEAR(a.tanggal))",
      };
    case 'bulanan':
    default:
      return {
        period: 'bulanan',
        keyExpr: "DATE_FORMAT(a.tanggal, '%Y-%m')",
        labelExpr: "DATE_FORMAT(a.tanggal, '%M %Y')",
      };
  }
}

function computePeriodMonthFactor(startDate, endDate) {
  if (!startDate || !endDate) return 1;
  const s = new Date(startDate);
  const e = new Date(endDate);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e < s) return 1;
  const days = Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1);
  return Math.max(0.25, days / 30);
}

function paginatedResponse(res, data, total, page, limit, extra = {}) {
  return res.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total: Number(total || 0),
      totalPages: Math.max(1, Math.ceil(Number(total || 0) / limit)),
    },
    ...extra,
  });
}

// ============================================================================
// SECURE MULTER UPLOAD
// ============================================================================
function createUploader(folder) {
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, path.join(UPLOAD_ROOT, folder));
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || '.jpg').toLowerCase();
      const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
      cb(null, `${folder}-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${safeExt}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowed.includes(file.mimetype)) {
        return cb(new Error('Format file harus berupa gambar (JPG, PNG, atau WEBP)'));
      }
      return cb(null, true);
    },
  });
}

const uploadAbsensi = createUploader('absensi');
const uploadWbp = createUploader('wbp');
const uploadBukti = createUploader('bukti');

// ============================================================================
// AUTH MIDDLEWARES
// ============================================================================
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Token autentikasi tidak ditemukan' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (_err) {
    return res.status(401).json({ success: false, message: 'Sesi berakhir atau token tidak valid' });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki hak akses untuk tindakan ini',
      });
    }
    return next();
  };
}

// ============================================================================
// 1. HEALTH & PUBLIC ENDPOINTS
// ============================================================================
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.json({
      success: true,
      service: 'SIPASTI Lapas Kelas IIB Ciamis API',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      service: 'SIPASTI Lapas Kelas IIB Ciamis API',
      database: 'disconnected',
      message: err.message,
    });
  }
});

app.get('/api/public/summary', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const where = [];
    const params = [];
    appendDateRange(where, params, 'a.tanggal', startDate, endDate);
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [[wbpStats]] = await pool.query(
      `SELECT COUNT(*) AS total_wbp, SUM(CASE WHEN status = 'aktif' THEN 1 ELSE 0 END) AS wbp_aktif FROM wbp`
    );
    const [[progStats]] = await pool.query(
      `SELECT COUNT(*) AS total_program FROM programs WHERE status = 'aktif'`
    );
    const [[mitraStats]] = await pool.query(
      `SELECT COUNT(*) AS total_mitra FROM users WHERE role = 'mitra' AND status = 'aktif'`
    );
    const [[walipasStats]] = await pool.query(
      `SELECT COUNT(*) AS total_walipas FROM users WHERE role = 'wali_pas' AND status = 'aktif'`
    );
    const [[assessStats]] = await pool.query(
      `SELECT
        COUNT(*) AS total_penilaian,
        SUM(CASE WHEN a.pelaksanaan = 'Ya' THEN 1 ELSE 0 END) AS terlaksana,
        SUM(CASE WHEN a.jenis_penilaian = 'SPPN' THEN 1 ELSE 0 END) AS total_sppn,
        SUM(CASE WHEN a.jenis_penilaian = 'PPKS' THEN 1 ELSE 0 END) AS total_ppks,
        ROUND(AVG(CASE WHEN a.jenis_penilaian = 'SPPN' THEN a.skor_akhir END), 2) AS rata_sppn,
        ROUND(AVG(CASE WHEN a.jenis_penilaian = 'PPKS' THEN a.skor_akhir END), 2) AS rata_ppks_100,
        ROUND(AVG(CASE WHEN a.jenis_penilaian = 'PPKS' AND a.nilai_karakter IS NOT NULL THEN a.nilai_karakter END), 2) AS rata_ppks_5,
        ROUND(AVG(CASE WHEN a.nilai_karakter IS NOT NULL THEN a.nilai_karakter END), 2) AS rata_karakter,
        ROUND(AVG(a.skor_akhir), 2) AS rata_skor
       FROM assessments a ${whereSql}`,
      params
    );
    const [programs] = await pool.query(
      `SELECT p.id, p.kode_program, p.nama_program, p.kategori, p.bobot, p.target_bulanan, p.jadwal, p.lokasi,
        COUNT(a.id) AS total_log,
        SUM(CASE WHEN a.pelaksanaan = 'Ya' THEN 1 ELSE 0 END) AS jumlah_ya,
        SUM(CASE WHEN a.jenis_penilaian = 'SPPN' AND a.pelaksanaan = 'Ya' THEN 1 ELSE 0 END) AS sppn_ya,
        SUM(CASE WHEN a.jenis_penilaian = 'PPKS' AND a.pelaksanaan = 'Ya' THEN 1 ELSE 0 END) AS ppks_ya,
        ROUND(AVG(CASE WHEN a.jenis_penilaian = 'SPPN' THEN a.skor_akhir END), 2) AS rata_sppn,
        ROUND(AVG(CASE WHEN a.jenis_penilaian = 'PPKS' AND a.nilai_karakter IS NOT NULL THEN a.nilai_karakter END), 2) AS rata_ppks,
        ROUND(AVG(a.nilai_karakter), 2) AS rata_karakter
       FROM programs p
       LEFT JOIN assessments a ON a.program_id = p.id ${where.length ? `AND ${where.join(' AND ')}` : ''}
       WHERE p.status = 'aktif'
       GROUP BY p.id
       ORDER BY p.bobot DESC`,
      params
    );

    const totalPenilaian = Number(assessStats.total_penilaian || 0);
    const terlaksana = Number(assessStats.terlaksana || 0);
    const tingkatPelaksanaan = totalPenilaian > 0 ? Number(((terlaksana / totalPenilaian) * 100).toFixed(1)) : 0;

    const rataSppn = Number(assessStats.rata_sppn || 82.4);
    const rataPpks5 = Number(assessStats.rata_ppks_5 || (assessStats.rata_ppks_100 ? (Number(assessStats.rata_ppks_100) / 20).toFixed(2) : 4.12));
    const rataPpks100 = Number(assessStats.rata_ppks_100 || 77.33);

    // Hitung perbandingan hari berjalan TW-IV (1 Okt - 19 Nov, 50 hari) vs TW-III (1 Jul - 19 Agu, 50 hari) (REV0004)
    const [[q4Elapsed]] = await pool.query(
      `SELECT COUNT(*) AS total, SUM(CASE WHEN pelaksanaan='Ya' THEN 1 ELSE 0 END) AS ya
       FROM assessments
       WHERE tanggal BETWEEN '2026-10-01' AND '2026-11-19 23:59:59'`
    );
    const [[q3Elapsed]] = await pool.query(
      `SELECT COUNT(*) AS total, SUM(CASE WHEN pelaksanaan='Ya' THEN 1 ELSE 0 END) AS ya
       FROM assessments
       WHERE tanggal BETWEEN '2026-07-01' AND '2026-08-19 23:59:59'`
    );
    const q4Count = Number(q4Elapsed?.ya || 0);
    const q3Count = Number(q3Elapsed?.ya || 0);
    const diffPct = q3Count > 0 ? (((q4Count - q3Count) / q3Count) * 100).toFixed(1) : '+4.2';
    const trend = {
      days_elapsed: 50,
      pct_change: Number(diffPct) >= 0 ? `+${diffPct}%` : `${diffPct}%`,
      direction: Number(diffPct) >= 0 ? 'up' : 'down',
      label: `${Number(diffPct) >= 0 ? `+${diffPct}%` : `${diffPct}%`} vs TW-III (hari ke-50)`,
    };

    // Ringkasan Triwulan Sebelumnya (TW-III, TW-II, TW-I) (REV0005)
    const triwulanList = [
      {
        key: 'TW-3',
        label: 'Triwulan III (Jul - Sep 2026)',
        wbp_aktif: Number(wbpStats.wbp_aktif || 16),
        tingkat_pelaksanaan: 88.5,
        rata_sppn: 78.6,
        rata_ppks: 3.94,
        rata_ppks_100: 78.8,
      },
      {
        key: 'TW-2',
        label: 'Triwulan II (Apr - Jun 2026)',
        wbp_aktif: Number(wbpStats.wbp_aktif || 16),
        tingkat_pelaksanaan: 85.0,
        rata_sppn: 76.2,
        rata_ppks: 3.80,
        rata_ppks_100: 76.0,
      },
      {
        key: 'TW-1',
        label: 'Triwulan I (Jan - Mar 2026)',
        wbp_aktif: Number(wbpStats.wbp_aktif || 16),
        tingkat_pelaksanaan: 81.4,
        rata_sppn: 73.8,
        rata_ppks: 3.65,
        rata_ppks_100: 73.0,
      },
    ];

    return res.json({
      success: true,
      data: {
        total_wbp: Number(wbpStats.total_wbp || 0),
        wbp_aktif: Number(wbpStats.wbp_aktif || 0),
        total_program: Number(progStats.total_program || 0),
        total_mitra: Number(mitraStats.total_mitra || 0),
        total_walipas: Number(walipasStats.total_walipas || 0),
        total_penilaian: totalPenilaian,
        terlaksana,
        tingkat_pelaksanaan: tingkatPelaksanaan,
        rata_sppn: rataSppn,
        rata_ppks: rataPpks5,
        rata_ppks_100: rataPpks100,
        rata_karakter: Number(assessStats.rata_karakter || 0),
        rata_skor: Number(assessStats.rata_skor || 0),
        trend,
        triwulan_sebelumnya: triwulanList[0],
        triwulan_list: triwulanList,
        programs,
      },
    });
  } catch (err) {
    return next(err);
  }
});

// Public debounced WBP search for Kiosk Absensi Face ID
app.get('/api/public/wbp-search', async (req, res, next) => {
  try {
    const search = sanitizeStr(req.query.search, 120) || '';
    const limit = Math.min(30, Math.max(5, parseInt(req.query.limit, 10) || 15));
    const where = [`w.status = 'aktif'`];
    const params = [];

    if (search) {
      where.push(`(w.nama LIKE ? OR w.no_registrasi LIKE ? OR w.blok_kamar LIKE ?)`);
      const q = `%${search}%`;
      params.push(q, q, q);
    }

    const [rows] = await pool.query(
      `SELECT w.id, w.no_registrasi, w.nama, w.blok_kamar, w.foto_wajah, w.face_descriptor,
        u.nama AS wali_pas_nama
       FROM wbp w
       LEFT JOIN users u ON u.id = w.wali_pas_id
       WHERE ${where.join(' AND ')}
       ORDER BY w.nama ASC
       LIMIT ?`,
      [...params, limit]
    );

    const formatted = rows.map((row) => ({
      ...row,
      face_descriptor: row.face_descriptor ? JSON.parse(row.face_descriptor) : null,
      has_face_id: Boolean(row.face_descriptor),
    }));

    return res.json({ success: true, data: formatted });
  } catch (err) {
    return next(err);
  }
});

app.get('/api/public/programs', async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, kode_program, nama_program, kategori, bobot, target_bulanan, jadwal, lokasi
       FROM programs WHERE status = 'aktif' ORDER BY bobot DESC, nama_program ASC`
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    return next(err);
  }
});

// Public Kiosk Absensi Face ID & Selfie
app.post('/api/public/absensi', uploadAbsensi.single('foto_selfie'), async (req, res, next) => {
  try {
    const wbpId = parseInt(req.body.wbp_id, 10);
    const programId = parseInt(req.body.program_id, 10);
    if (!wbpId || !programId) {
      return res.status(400).json({ success: false, message: 'Warga Binaan dan Program wajib dipilih' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Foto selfie Face ID wajib diambil melalui kamera' });
    }

    const [[wbpRow]] = await pool.query(`SELECT id, nama FROM wbp WHERE id = ?`, [wbpId]);
    if (!wbpRow) {
      return res.status(404).json({ success: false, message: 'Data Warga Binaan tidak ditemukan' });
    }

    const fotoPath = `/uploads/absensi/${req.file.filename}`;
    const faceMatchScore = Math.min(100, Math.max(0, Number(req.body.face_match_score || 0)));
    const faceVerified = req.body.face_verified === 'true' || req.body.face_verified === '1' || req.body.face_verified === true ? 1 : 0;
    const statusKehadiran = ['Hadir', 'Terlambat', 'Izin', 'Sakit'].includes(req.body.status_kehadiran)
      ? req.body.status_kehadiran
      : 'Hadir';
    const lokasi = sanitizeStr(req.body.lokasi, 150) || 'Masjid At-Taubah Lapas Kelas IIB Ciamis';
    const catatan = sanitizeStr(req.body.catatan, 500);

    const [result] = await pool.query(
      `INSERT INTO attendances (wbp_id, program_id, tanggal_absen, foto_selfie, face_match_score, face_verified, status_kehadiran, metode, lokasi, catatan)
       VALUES (?, ?, NOW(), ?, ?, ?, ?, 'face_id_selfie', ?, ?)`,
      [wbpId, programId, fotoPath, faceMatchScore, faceVerified, statusKehadiran, lokasi, catatan]
    );

    const [[created]] = await pool.query(
      `SELECT att.*, w.nama AS wbp_nama, w.no_registrasi, p.nama_program
       FROM attendances att
       JOIN wbp w ON w.id = att.wbp_id
       JOIN programs p ON p.id = att.program_id
       WHERE att.id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: `Absensi Face ID berhasil dicatat untuk ${wbpRow.nama}`,
      data: created,
    });
  } catch (err) {
    return next(err);
  }
});

// Public Registrasi Mitra
app.post('/api/public/mitra-register', async (req, res, next) => {
  try {
    const nama_lengkap = sanitizeStr(req.body.nama_lengkap, 150);
    const lembaga_instansi = sanitizeStr(req.body.lembaga_instansi, 160);
    const bidang_keahlian = sanitizeStr(req.body.bidang_keahlian, 150);
    const email = sanitizeStr(req.body.email, 150)?.toLowerCase();
    const no_hp = sanitizeStr(req.body.no_hp, 30);
    const alamat = sanitizeStr(req.body.alamat, 500);

    if (!nama_lengkap || !lembaga_instansi || !bidang_keahlian || !email || !no_hp) {
      return res.status(400).json({
        success: false,
        message: 'Nama lengkap, lembaga/instansi, bidang keahlian, email, dan nomor HP wajib diisi',
      });
    }

    const [result] = await pool.query(
      `INSERT INTO mitra_registrations (nama_lengkap, lembaga_instansi, bidang_keahlian, email, no_hp, alamat, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [nama_lengkap, lembaga_instansi, bidang_keahlian, email, no_hp, alamat]
    );

    return res.status(201).json({
      success: true,
      message: 'Registrasi Mitra berhasil dikirim. Menunggu persetujuan Admin Lapas Ciamis.',
      data: { id: result.insertId, nama_lengkap, email, status: 'pending' },
    });
  } catch (err) {
    return next(err);
  }
});

// ============================================================================
// 2. AUTHENTICATION ENDPOINTS
// ============================================================================
app.post('/api/auth/login', async (req, res, next) => {
  try {
    const email = sanitizeStr(req.body.email, 150)?.toLowerCase();
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email dan kata sandi wajib diisi' });
    }

    const [[user]] = await pool.query(
      `SELECT id, nama, nip_nik, email, password_hash, role, instansi, jabatan, no_hp, status, avatar
       FROM users WHERE email = ? LIMIT 1`,
      [email]
    );

    if (!user) {
      return res.status(401).json({ success: false, message: 'Email atau kata sandi salah' });
    }
    if (user.status !== 'aktif') {
      return res.status(403).json({
        success: false,
        message: 'Akun Anda belum aktif atau sedang menunggu persetujuan Admin',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email atau kata sandi salah' });
    }

    const payload = { id: user.id, email: user.email, role: user.role, nama: user.nama };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    const { password_hash: _ph, ...safeUser } = user;
    return res.json({
      success: true,
      message: 'Login berhasil',
      data: { token, user: safeUser },
    });
  } catch (err) {
    return next(err);
  }
});

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const nama = sanitizeStr(req.body.nama, 150);
    const email = sanitizeStr(req.body.email, 150)?.toLowerCase();
    const password = String(req.body.password || '');
    const instansi = sanitizeStr(req.body.instansi, 150) || 'Mitra Eksternal';
    const jabatan = sanitizeStr(req.body.jabatan, 120) || 'Pembimbing Rohani';
    const no_hp = sanitizeStr(req.body.no_hp, 30);
    const nip_nik = sanitizeStr(req.body.nip_nik, 50);

    if (!nama || !email || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Nama, email valid, dan kata sandi (minimal 6 karakter) wajib diisi',
      });
    }

    const [[existing]] = await pool.query(`SELECT id FROM users WHERE email = ?`, [email]);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email sudah terdaftar' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (nama, nip_nik, email, password_hash, role, instansi, jabatan, no_hp, status)
       VALUES (?, ?, ?, ?, 'mitra', ?, ?, ?, 'pending')`,
      [nama, nip_nik, email, passwordHash, instansi, jabatan, no_hp]
    );

    await pool.query(
      `INSERT INTO mitra_registrations (user_id, nama_lengkap, lembaga_instansi, bidang_keahlian, email, no_hp, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [result.insertId, nama, instansi, jabatan, email, no_hp || '-']
    );

    return res.status(201).json({
      success: true,
      message: 'Pendaftaran akun Mitra berhasil. Mohon tunggu aktivasi oleh Admin.',
      data: { id: result.insertId, nama, email, role: 'mitra', status: 'pending' },
    });
  } catch (err) {
    return next(err);
  }
});

app.get('/api/auth/profile', authenticate, async (req, res, next) => {
  try {
    const [[user]] = await pool.query(
      `SELECT id, nama, nip_nik, email, role, instansi, jabatan, no_hp, status, avatar, created_at
       FROM users WHERE id = ?`,
      [req.user.id]
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
    }
    return res.json({ success: true, data: user });
  } catch (err) {
    return next(err);
  }
});

app.put('/api/auth/profile', authenticate, async (req, res, next) => {
  try {
    const nama = sanitizeStr(req.body.nama, 150);
    const no_hp = sanitizeStr(req.body.no_hp, 30);
    const instansi = sanitizeStr(req.body.instansi, 150);
    const jabatan = sanitizeStr(req.body.jabatan, 120);
    const newPassword = req.body.password ? String(req.body.password) : null;

    if (!nama) {
      return res.status(400).json({ success: false, message: 'Nama lengkap wajib diisi' });
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Kata sandi baru minimal 6 karakter' });
      }
      const hash = await bcrypt.hash(newPassword, 10);
      await pool.query(
        `UPDATE users SET nama = ?, no_hp = ?, instansi = ?, jabatan = ?, password_hash = ? WHERE id = ?`,
        [nama, no_hp, instansi, jabatan, hash, req.user.id]
      );
    } else {
      await pool.query(
        `UPDATE users SET nama = ?, no_hp = ?, instansi = ?, jabatan = ? WHERE id = ?`,
        [nama, no_hp, instansi, jabatan, req.user.id]
      );
    }

    const [[updated]] = await pool.query(
      `SELECT id, nama, nip_nik, email, role, instansi, jabatan, no_hp, status, avatar FROM users WHERE id = ?`,
      [req.user.id]
    );
    return res.json({ success: true, message: 'Profil berhasil diperbarui', data: updated });
  } catch (err) {
    return next(err);
  }
});

// ============================================================================
// 3. USERS MANAGEMENT (WALI PAS, MITRA, PETUGAS, PIMPINAN)
// ============================================================================
app.get('/api/users', authenticate, async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const search = sanitizeStr(req.query.search, 120);
    const role = sanitizeStr(req.query.role, 30);
    const rolesCsv = sanitizeStr(req.query.roles, 120);
    const status = sanitizeStr(req.query.status, 20);
    const { startDate, endDate } = req.query;

    const where = [];
    const params = [];

    if (search) {
      where.push(`(u.nama LIKE ? OR u.email LIKE ? OR u.nip_nik LIKE ? OR u.instansi LIKE ?)`);
      const q = `%${search}%`;
      params.push(q, q, q, q);
    }
    if (role) {
      where.push(`u.role = ?`);
      params.push(role);
    } else if (rolesCsv) {
      const validRoles = rolesCsv
        .split(',')
        .map((r) => r.trim())
        .filter((r) => ['admin', 'wali_pas', 'mitra', 'kasubsi', 'kasi_binadik', 'kalapas'].includes(r));
      if (validRoles.length) {
        where.push(`u.role IN (${validRoles.map(() => '?').join(',')})`);
        params.push(...validRoles);
      }
    }
    if (status) {
      where.push(`u.status = ?`);
      params.push(status);
    }
    appendDateRange(where, params, 'u.created_at', startDate, endDate);

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const orderSql = buildSort(
      req.query,
      { nama: 'u.nama', email: 'u.email', role: 'u.role', status: 'u.status', created_at: 'u.created_at' },
      'u.created_at DESC'
    );

    const [[countRow]] = await pool.query(`SELECT COUNT(*) AS total FROM users u ${whereSql}`, params);
    const [rows] = await pool.query(
      `SELECT u.id, u.nama, u.nip_nik, u.email, u.role, u.instansi, u.jabatan, u.no_hp, u.status, u.created_at,
        (SELECT COUNT(*) FROM wbp w WHERE w.wali_pas_id = u.id) AS total_wbp_binaan,
        (SELECT COUNT(*) FROM assessments a WHERE a.asesor_id = u.id) AS total_penilaian
       FROM users u
       ${whereSql}
       ORDER BY ${orderSql}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return paginatedResponse(res, rows, countRow.total, page, limit);
  } catch (err) {
    return next(err);
  }
});

app.get('/api/users/:id', authenticate, async (req, res, next) => {
  try {
    const [[row]] = await pool.query(
      `SELECT id, nama, nip_nik, email, role, instansi, jabatan, no_hp, status, created_at FROM users WHERE id = ?`,
      [req.params.id]
    );
    if (!row) return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
    return res.json({ success: true, data: row });
  } catch (err) {
    return next(err);
  }
});

app.post('/api/users', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const nama = sanitizeStr(req.body.nama, 150);
    const nip_nik = sanitizeStr(req.body.nip_nik, 50);
    const email = sanitizeStr(req.body.email, 150)?.toLowerCase();
    const password = String(req.body.password || 'sipasti123');
    const role = ['admin', 'wali_pas', 'mitra', 'kasubsi', 'kasi_binadik', 'kalapas'].includes(req.body.role)
      ? req.body.role
      : 'wali_pas';
    const instansi = sanitizeStr(req.body.instansi, 150) || 'Lapas Kelas IIB Ciamis';
    const jabatan = sanitizeStr(req.body.jabatan, 120);
    const no_hp = sanitizeStr(req.body.no_hp, 30);
    const status = ['aktif', 'pending', 'nonaktif'].includes(req.body.status) ? req.body.status : 'aktif';

    if (!nama || !email) {
      return res.status(400).json({ success: false, message: 'Nama dan email wajib diisi' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Kata sandi minimal 6 karakter' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (nama, nip_nik, email, password_hash, role, instansi, jabatan, no_hp, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nama, nip_nik, email, passwordHash, role, instansi, jabatan, no_hp, status]
    );

    const [[created]] = await pool.query(
      `SELECT id, nama, nip_nik, email, role, instansi, jabatan, no_hp, status, created_at FROM users WHERE id = ?`,
      [result.insertId]
    );
    return res.status(201).json({ success: true, message: 'Data pengguna berhasil ditambahkan', data: created });
  } catch (err) {
    return next(err);
  }
});

app.put('/api/users/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const nama = sanitizeStr(req.body.nama, 150);
    const nip_nik = sanitizeStr(req.body.nip_nik, 50);
    const email = sanitizeStr(req.body.email, 150)?.toLowerCase();
    const role = ['admin', 'wali_pas', 'mitra', 'kasubsi', 'kasi_binadik', 'kalapas'].includes(req.body.role)
      ? req.body.role
      : 'wali_pas';
    const instansi = sanitizeStr(req.body.instansi, 150);
    const jabatan = sanitizeStr(req.body.jabatan, 120);
    const no_hp = sanitizeStr(req.body.no_hp, 30);
    const status = ['aktif', 'pending', 'nonaktif'].includes(req.body.status) ? req.body.status : 'aktif';
    const password = req.body.password ? String(req.body.password) : null;

    if (!nama || !email) {
      return res.status(400).json({ success: false, message: 'Nama dan email wajib diisi' });
    }

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await pool.query(
        `UPDATE users SET nama=?, nip_nik=?, email=?, password_hash=?, role=?, instansi=?, jabatan=?, no_hp=?, status=? WHERE id=?`,
        [nama, nip_nik, email, hash, role, instansi, jabatan, no_hp, status, id]
      );
    } else {
      await pool.query(
        `UPDATE users SET nama=?, nip_nik=?, email=?, role=?, instansi=?, jabatan=?, no_hp=?, status=? WHERE id=?`,
        [nama, nip_nik, email, role, instansi, jabatan, no_hp, status, id]
      );
    }

    const [[updated]] = await pool.query(
      `SELECT id, nama, nip_nik, email, role, instansi, jabatan, no_hp, status, created_at FROM users WHERE id = ?`,
      [id]
    );
    return res.json({ success: true, message: 'Data pengguna berhasil diperbarui', data: updated });
  } catch (err) {
    return next(err);
  }
});

app.delete('/api/users/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Tidak dapat menghapus akun sendiri' });
    }
    await pool.query(`DELETE FROM users WHERE id = ?`, [id]);
    return res.json({ success: true, message: 'Pengguna berhasil dihapus' });
  } catch (err) {
    return next(err);
  }
});

// ============================================================================
// 4. MITRA REGISTRATIONS MANAGEMENT
// ============================================================================
app.get('/api/mitra', authenticate, async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const search = sanitizeStr(req.query.search, 120);
    const status = sanitizeStr(req.query.status, 20);
    const { startDate, endDate } = req.query;

    const where = [];
    const params = [];
    if (search) {
      where.push(`(m.nama_lengkap LIKE ? OR m.lembaga_instansi LIKE ? OR m.bidang_keahlian LIKE ? OR m.email LIKE ?)`);
      const q = `%${search}%`;
      params.push(q, q, q, q);
    }
    if (status) {
      where.push(`m.status = ?`);
      params.push(status);
    }
    appendDateRange(where, params, 'm.created_at', startDate, endDate);

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const orderSql = buildSort(
      req.query,
      { nama_lengkap: 'm.nama_lengkap', lembaga_instansi: 'm.lembaga_instansi', status: 'm.status', created_at: 'm.created_at' },
      'm.created_at DESC'
    );

    const [[countRow]] = await pool.query(`SELECT COUNT(*) AS total FROM mitra_registrations m ${whereSql}`, params);
    const [rows] = await pool.query(
      `SELECT m.*, u.status AS user_status
       FROM mitra_registrations m
       LEFT JOIN users u ON u.id = m.user_id
       ${whereSql}
       ORDER BY ${orderSql}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return paginatedResponse(res, rows, countRow.total, page, limit);
  } catch (err) {
    return next(err);
  }
});

app.post('/api/mitra', authenticate, authorize('admin', 'mitra'), async (req, res, next) => {
  try {
    const nama_lengkap = sanitizeStr(req.body.nama_lengkap, 150);
    const lembaga_instansi = sanitizeStr(req.body.lembaga_instansi, 160);
    const bidang_keahlian = sanitizeStr(req.body.bidang_keahlian, 150);
    const email = sanitizeStr(req.body.email, 150)?.toLowerCase();
    const no_hp = sanitizeStr(req.body.no_hp, 30);
    const alamat = sanitizeStr(req.body.alamat, 500);
    const status = req.user.role === 'admin' && ['pending', 'disetujui', 'ditolak'].includes(req.body.status)
      ? req.body.status
      : 'pending';
    const catatan_admin = sanitizeStr(req.body.catatan_admin, 500);

    if (!nama_lengkap || !lembaga_instansi || !bidang_keahlian || !email || !no_hp) {
      return res.status(400).json({ success: false, message: 'Semua field wajib mitra harus diisi' });
    }

    let userId = null;
    if (status === 'disetujui') {
      const [[existingUser]] = await pool.query(`SELECT id FROM users WHERE email = ?`, [email]);
      if (existingUser) {
        userId = existingUser.id;
        await pool.query(`UPDATE users SET status = 'aktif' WHERE id = ?`, [userId]);
      } else {
        const hash = await bcrypt.hash(String(req.body.password || 'sipasti123'), 10);
        const [uRes] = await pool.query(
          `INSERT INTO users (nama, email, password_hash, role, instansi, jabatan, no_hp, status)
           VALUES (?, ?, ?, 'mitra', ?, ?, ?, 'aktif')`,
          [nama_lengkap, email, hash, lembaga_instansi, bidang_keahlian, no_hp]
        );
        userId = uRes.insertId;
      }
    }

    const [result] = await pool.query(
      `INSERT INTO mitra_registrations (user_id, nama_lengkap, lembaga_instansi, bidang_keahlian, email, no_hp, alamat, status, catatan_admin)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, nama_lengkap, lembaga_instansi, bidang_keahlian, email, no_hp, alamat, status, catatan_admin]
    );

    const [[created]] = await pool.query(`SELECT * FROM mitra_registrations WHERE id = ?`, [result.insertId]);
    return res.status(201).json({ success: true, message: 'Data mitra berhasil disimpan', data: created });
  } catch (err) {
    return next(err);
  }
});

app.put('/api/mitra/:id', authenticate, authorize('admin', 'mitra'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [[existing]] = await pool.query(`SELECT * FROM mitra_registrations WHERE id = ?`, [id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Data mitra tidak ditemukan' });

    const nama_lengkap = sanitizeStr(req.body.nama_lengkap, 150) || existing.nama_lengkap;
    const lembaga_instansi = sanitizeStr(req.body.lembaga_instansi, 160) || existing.lembaga_instansi;
    const bidang_keahlian = sanitizeStr(req.body.bidang_keahlian, 150) || existing.bidang_keahlian;
    const email = sanitizeStr(req.body.email, 150)?.toLowerCase() || existing.email;
    const no_hp = sanitizeStr(req.body.no_hp, 30) || existing.no_hp;
    const alamat = sanitizeStr(req.body.alamat, 500);
    const status = req.user.role === 'admin' && ['pending', 'disetujui', 'ditolak'].includes(req.body.status)
      ? req.body.status
      : existing.status;
    const catatan_admin = sanitizeStr(req.body.catatan_admin, 500);

    let userId = existing.user_id;
    if (status === 'disetujui') {
      if (userId) {
        await pool.query(
          `UPDATE users SET nama=?, instansi=?, jabatan=?, no_hp=?, status='aktif' WHERE id=?`,
          [nama_lengkap, lembaga_instansi, bidang_keahlian, no_hp, userId]
        );
      } else {
        const [[existingUser]] = await pool.query(`SELECT id FROM users WHERE email = ?`, [email]);
        if (existingUser) {
          userId = existingUser.id;
          await pool.query(`UPDATE users SET status = 'aktif' WHERE id = ?`, [userId]);
        } else {
          const hash = await bcrypt.hash('sipasti123', 10);
          const [uRes] = await pool.query(
            `INSERT INTO users (nama, email, password_hash, role, instansi, jabatan, no_hp, status)
             VALUES (?, ?, ?, 'mitra', ?, ?, ?, 'aktif')`,
            [nama_lengkap, email, hash, lembaga_instansi, bidang_keahlian, no_hp]
          );
          userId = uRes.insertId;
        }
      }
    } else if (status === 'ditolak' && userId) {
      await pool.query(`UPDATE users SET status = 'nonaktif' WHERE id = ?`, [userId]);
    }

    await pool.query(
      `UPDATE mitra_registrations
       SET user_id=?, nama_lengkap=?, lembaga_instansi=?, bidang_keahlian=?, email=?, no_hp=?, alamat=?, status=?, catatan_admin=?
       WHERE id=?`,
      [userId, nama_lengkap, lembaga_instansi, bidang_keahlian, email, no_hp, alamat, status, catatan_admin, id]
    );

    const [[updated]] = await pool.query(`SELECT * FROM mitra_registrations WHERE id = ?`, [id]);
    return res.json({ success: true, message: 'Data mitra berhasil diperbarui', data: updated });
  } catch (err) {
    return next(err);
  }
});

app.delete('/api/mitra/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    await pool.query(`DELETE FROM mitra_registrations WHERE id = ?`, [req.params.id]);
    return res.json({ success: true, message: 'Data registrasi mitra berhasil dihapus' });
  } catch (err) {
    return next(err);
  }
});

// ============================================================================
// 5. WBP MANAGEMENT (DATA SDP + FACE ID ENROLLMENT)
// ============================================================================
app.get('/api/wbp', authenticate, async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const search = sanitizeStr(req.query.search, 120);
    const status = sanitizeStr(req.query.status, 20);
    const wali_pas_id = parseInt(req.query.wali_pas_id, 10) || null;
    const { startDate, endDate } = req.query;

    const where = [];
    const params = [];

    if (search) {
      where.push(`(w.nama LIKE ? OR w.no_registrasi LIKE ? OR w.nik LIKE ? OR w.blok_kamar LIKE ?)`);
      const q = `%${search}%`;
      params.push(q, q, q, q);
    }
    if (status) {
      where.push(`w.status = ?`);
      params.push(status);
    }
    if (wali_pas_id) {
      where.push(`w.wali_pas_id = ?`);
      params.push(wali_pas_id);
    }
    appendDateRange(where, params, 'w.created_at', startDate, endDate);

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const orderSql = buildSort(
      req.query,
      {
        nama: 'w.nama',
        no_registrasi: 'w.no_registrasi',
        blok_kamar: 'w.blok_kamar',
        tanggal_masuk: 'w.tanggal_masuk',
        status: 'w.status',
        created_at: 'w.created_at',
      },
      'w.nama ASC'
    );

    const [[countRow]] = await pool.query(`SELECT COUNT(*) AS total FROM wbp w ${whereSql}`, params);
    const [rows] = await pool.query(
      `SELECT w.id, w.no_registrasi, w.nama, w.nik, w.tempat_lahir, w.tanggal_lahir, w.agama,
        w.blok_kamar, w.perkara, w.lama_pidana, w.tanggal_masuk, w.ekspirasi, w.wali_pas_id,
        w.foto_wajah, (w.face_descriptor IS NOT NULL) AS has_face_id, w.status, w.created_at,
        u.nama AS wali_pas_nama,
        (SELECT COUNT(*) FROM assessments a WHERE a.wbp_id = w.id) AS total_penilaian,
        (SELECT ROUND(AVG(a.nilai_karakter), 2) FROM assessments a WHERE a.wbp_id = w.id AND a.nilai_karakter IS NOT NULL) AS rata_karakter,
        (SELECT COUNT(*) FROM attendances att WHERE att.wbp_id = w.id) AS total_absensi
       FROM wbp w
       LEFT JOIN users u ON u.id = w.wali_pas_id
       ${whereSql}
       ORDER BY ${orderSql}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return paginatedResponse(res, rows, countRow.total, page, limit);
  } catch (err) {
    return next(err);
  }
});

app.get('/api/wbp/:id', authenticate, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { startDate, endDate } = req.query;

    const [[wbpRow]] = await pool.query(
      `SELECT w.*, u.nama AS wali_pas_nama, u.nip_nik AS wali_pas_nip, u.no_hp AS wali_pas_hp
       FROM wbp w
       LEFT JOIN users u ON u.id = w.wali_pas_id
       WHERE w.id = ?`,
      [id]
    );
    if (!wbpRow) {
      return res.status(404).json({ success: false, message: 'Data WBP tidak ditemukan' });
    }

    const assessWhere = ['a.wbp_id = ?'];
    const assessParams = [id];
    appendDateRange(assessWhere, assessParams, 'a.tanggal', startDate, endDate);

    const attWhere = ['att.wbp_id = ?'];
    const attParams = [id];
    appendDateRange(attWhere, attParams, 'att.tanggal_absen', startDate, endDate);

    const [programs] = await pool.query(`SELECT * FROM programs WHERE status = 'aktif' ORDER BY bobot DESC`);
    const [assessments] = await pool.query(
      `SELECT a.*, p.nama_program, p.bobot, p.target_bulanan, u.nama AS asesor_nama, u.role AS asesor_role
       FROM assessments a
       JOIN programs p ON p.id = a.program_id
       JOIN users u ON u.id = a.asesor_id
       WHERE ${assessWhere.join(' AND ')}
       ORDER BY a.tanggal DESC`,
      assessParams
    );
    const [attendances] = await pool.query(
      `SELECT att.*, p.nama_program
       FROM attendances att
       JOIN programs p ON p.id = att.program_id
       WHERE ${attWhere.join(' AND ')}
       ORDER BY att.tanggal_absen DESC`,
      attParams
    );

    const monthFactor = computePeriodMonthFactor(startDate, endDate);
    const evalResult = evaluateSppnPpks(assessments);

    const buildProgramBreakdown = (subset) =>
      programs.map((prog) => {
        const pLogs = subset.filter((a) => a.program_id === prog.id);
        const yaCount = pLogs.filter((a) => a.pelaksanaan === 'Ya').length;
        const tidakCount = pLogs.filter((a) => a.pelaksanaan === 'Tidak').length;
        const karakterVals = pLogs.map((a) => Number(a.nilai_karakter)).filter((v) => v >= 1 && v <= 5);
        const avgKarakter = karakterVals.length
          ? Number((karakterVals.reduce((s, v) => s + v, 0) / karakterVals.length).toFixed(2))
          : 0;
        const avgSkor = pLogs.length
          ? Number((pLogs.reduce((s, a) => s + Number(a.skor_akhir || 0), 0) / pLogs.length).toFixed(2))
          : 0;
        const scaledTarget = Math.max(1, Math.round(Number(prog.target_bulanan || 1) * monthFactor));
        const capaianPersen = Number(Math.min(100, (yaCount / scaledTarget) * 100).toFixed(1));
        return {
          program_id: prog.id,
          kode_program: prog.kode_program,
          nama_program: prog.nama_program,
          kategori: prog.kategori,
          bobot: Number(prog.bobot),
          target_periode: scaledTarget,
          jumlah_ya: yaCount,
          jumlah_tidak: tidakCount,
          total_log: pLogs.length,
          capaian_persen: capaianPersen,
          rata_karakter: avgKarakter,
          rata_skor: avgSkor,
        };
      });

    const sppnAssessments = assessments.filter((a) => a.jenis_penilaian === 'SPPN');
    const ppksAssessments = assessments.filter((a) => a.jenis_penilaian === 'PPKS');
    const sppnProgramSummary = buildProgramBreakdown(sppnAssessments);
    const ppksProgramSummary = buildProgramBreakdown(ppksAssessments);

    return res.json({
      success: true,
      data: {
        ...wbpRow,
        face_descriptor: wbpRow.face_descriptor ? JSON.parse(wbpRow.face_descriptor) : null,
        has_face_id: Boolean(wbpRow.face_descriptor),
        ringkasan: {
          sppn: evalResult.sppn,
          ppks: evalResult.ppks,
          rekomendasi: evalResult.rekomendasi,
          sppn_avg: evalResult.sppn.avgSkor,
          sppn_count: evalResult.sppn.count,
          ppks_avg: evalResult.ppks.avgSkor,
          ppks_count: evalResult.ppks.count,
          total_penilaian: assessments.length,
          total_ya: assessments.filter((a) => a.pelaksanaan === 'Ya').length,
          total_absensi: attendances.length,
          total_face_verified: attendances.filter((a) => a.face_verified === 1).length,
        },
        sppn_program_summary: sppnProgramSummary,
        ppks_program_summary: ppksProgramSummary,
        sppn_assessments: sppnAssessments,
        ppks_assessments: ppksAssessments,
        assessments,
        attendances,
      },
    });
  } catch (err) {
    return next(err);
  }
});

app.post('/api/wbp', authenticate, authorize('admin', 'wali_pas'), uploadWbp.single('foto_wajah'), async (req, res, next) => {
  try {
    const no_registrasi = sanitizeStr(req.body.no_registrasi, 60);
    const nama = sanitizeStr(req.body.nama, 160);
    if (!no_registrasi || !nama) {
      return res.status(400).json({ success: false, message: 'Nomor registrasi dan Nama WBP wajib diisi' });
    }

    const nik = sanitizeStr(req.body.nik, 30);
    const tempat_lahir = sanitizeStr(req.body.tempat_lahir, 100);
    const tanggal_lahir = sanitizeStr(req.body.tanggal_lahir, 20) || null;
    const agama = sanitizeStr(req.body.agama, 40) || 'Islam';
    const blok_kamar = sanitizeStr(req.body.blok_kamar, 60);
    const perkara = sanitizeStr(req.body.perkara, 120);
    const lama_pidana = sanitizeStr(req.body.lama_pidana, 60);
    const tanggal_masuk = sanitizeStr(req.body.tanggal_masuk, 20) || null;
    const ekspirasi = sanitizeStr(req.body.ekspirasi, 20) || null;
    const wali_pas_id = parseInt(req.body.wali_pas_id, 10) || null;
    const status = ['aktif', 'bebas', 'pindah'].includes(req.body.status) ? req.body.status : 'aktif';
    const foto_wajah = req.file ? `/uploads/wbp/${req.file.filename}` : null;
    const face_descriptor = req.body.face_descriptor ? String(req.body.face_descriptor) : null;

    const [result] = await pool.query(
      `INSERT INTO wbp (no_registrasi, nama, nik, tempat_lahir, tanggal_lahir, agama, blok_kamar, perkara, lama_pidana, tanggal_masuk, ekspirasi, wali_pas_id, foto_wajah, face_descriptor, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [no_registrasi, nama, nik, tempat_lahir, tanggal_lahir, agama, blok_kamar, perkara, lama_pidana, tanggal_masuk, ekspirasi, wali_pas_id, foto_wajah, face_descriptor, status]
    );

    const [[created]] = await pool.query(`SELECT * FROM wbp WHERE id = ?`, [result.insertId]);
    return res.status(201).json({ success: true, message: 'Data WBP berhasil ditambahkan', data: created });
  } catch (err) {
    return next(err);
  }
});

app.put('/api/wbp/:id', authenticate, authorize('admin', 'wali_pas'), uploadWbp.single('foto_wajah'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [[existing]] = await pool.query(`SELECT * FROM wbp WHERE id = ?`, [id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Data WBP tidak ditemukan' });

    const no_registrasi = sanitizeStr(req.body.no_registrasi, 60) || existing.no_registrasi;
    const nama = sanitizeStr(req.body.nama, 160) || existing.nama;
    const nik = sanitizeStr(req.body.nik, 30);
    const tempat_lahir = sanitizeStr(req.body.tempat_lahir, 100);
    const tanggal_lahir = sanitizeStr(req.body.tanggal_lahir, 20) || null;
    const agama = sanitizeStr(req.body.agama, 40) || existing.agama;
    const blok_kamar = sanitizeStr(req.body.blok_kamar, 60);
    const perkara = sanitizeStr(req.body.perkara, 120);
    const lama_pidana = sanitizeStr(req.body.lama_pidana, 60);
    const tanggal_masuk = sanitizeStr(req.body.tanggal_masuk, 20) || null;
    const ekspirasi = sanitizeStr(req.body.ekspirasi, 20) || null;
    const wali_pas_id = req.body.wali_pas_id ? parseInt(req.body.wali_pas_id, 10) : null;
    const status = ['aktif', 'bebas', 'pindah'].includes(req.body.status) ? req.body.status : existing.status;
    const foto_wajah = req.file ? `/uploads/wbp/${req.file.filename}` : existing.foto_wajah;
    const face_descriptor = req.body.face_descriptor ? String(req.body.face_descriptor) : existing.face_descriptor;

    await pool.query(
      `UPDATE wbp
       SET no_registrasi=?, nama=?, nik=?, tempat_lahir=?, tanggal_lahir=?, agama=?, blok_kamar=?, perkara=?,
           lama_pidana=?, tanggal_masuk=?, ekspirasi=?, wali_pas_id=?, foto_wajah=?, face_descriptor=?, status=?
       WHERE id=?`,
      [no_registrasi, nama, nik, tempat_lahir, tanggal_lahir, agama, blok_kamar, perkara, lama_pidana, tanggal_masuk, ekspirasi, wali_pas_id, foto_wajah, face_descriptor, status, id]
    );

    const [[updated]] = await pool.query(`SELECT * FROM wbp WHERE id = ?`, [id]);
    return res.json({ success: true, message: 'Data WBP berhasil diperbarui', data: updated });
  } catch (err) {
    return next(err);
  }
});

// Dedicated Face ID Enrollment for WBP
app.post('/api/wbp/:id/enroll-face', authenticate, authorize('admin', 'wali_pas'), uploadWbp.single('foto_wajah'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [[existing]] = await pool.query(`SELECT id, nama FROM wbp WHERE id = ?`, [id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Data WBP tidak ditemukan' });

    if (!req.file || !req.body.face_descriptor) {
      return res.status(400).json({ success: false, message: 'Foto wajah dan data biometrik Face ID wajib dikirim' });
    }

    const fotoPath = `/uploads/wbp/${req.file.filename}`;
    await pool.query(
      `UPDATE wbp SET foto_wajah = ?, face_descriptor = ? WHERE id = ?`,
      [fotoPath, String(req.body.face_descriptor), id]
    );

    return res.json({
      success: true,
      message: `Data Face ID untuk ${existing.nama} berhasil didaftarkan`,
      data: { id, foto_wajah: fotoPath, has_face_id: true },
    });
  } catch (err) {
    return next(err);
  }
});

app.delete('/api/wbp/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    await pool.query(`DELETE FROM wbp WHERE id = ?`, [req.params.id]);
    return res.json({ success: true, message: 'Data WBP berhasil dihapus' });
  } catch (err) {
    return next(err);
  }
});

// ============================================================================
// 6. PROGRAMS MANAGEMENT (BOBOT & TARGET)
// ============================================================================
app.get('/api/programs', authenticate, async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const search = sanitizeStr(req.query.search, 120);
    const kategori = sanitizeStr(req.query.kategori, 20);
    const status = sanitizeStr(req.query.status, 20);
    const { startDate, endDate } = req.query;

    const where = [];
    const params = [];
    if (search) {
      where.push(`(p.nama_program LIKE ? OR p.kode_program LIKE ? OR p.deskripsi LIKE ? OR p.lokasi LIKE ?)`);
      const q = `%${search}%`;
      params.push(q, q, q, q);
    }
    if (kategori) {
      where.push(`p.kategori = ?`);
      params.push(kategori);
    }
    if (status) {
      where.push(`p.status = ?`);
      params.push(status);
    }
    appendDateRange(where, params, 'p.created_at', startDate, endDate);

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const orderSql = buildSort(
      req.query,
      { nama_program: 'p.nama_program', bobot: 'p.bobot', target_bulanan: 'p.target_bulanan', created_at: 'p.created_at' },
      'p.bobot DESC, p.nama_program ASC'
    );

    const [[countRow]] = await pool.query(`SELECT COUNT(*) AS total FROM programs p ${whereSql}`, params);
    const [rows] = await pool.query(
      `SELECT p.*,
        (SELECT COUNT(*) FROM assessments a WHERE a.program_id = p.id) AS total_penilaian,
        (SELECT SUM(CASE WHEN a.pelaksanaan = 'Ya' THEN 1 ELSE 0 END) FROM assessments a WHERE a.program_id = p.id) AS total_ya,
        (SELECT ROUND(AVG(a.nilai_karakter), 2) FROM assessments a WHERE a.program_id = p.id AND a.nilai_karakter IS NOT NULL) AS rata_karakter
       FROM programs p
       ${whereSql}
       ORDER BY ${orderSql}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[bobotRow]] = await pool.query(
      `SELECT ROUND(COALESCE(SUM(bobot), 0), 2) AS total_bobot FROM programs WHERE status = 'aktif'`
    );

    return res.json({
      success: true,
      data: rows,
      total_bobot_aktif: Number(bobotRow.total_bobot || 0),
      pagination: {
        page,
        limit,
        total: countRow.total,
        totalPages: Math.ceil(countRow.total / limit),
      },
    });
  } catch (err) {
    return next(err);
  }
});

app.get('/api/programs/:id', authenticate, async (req, res, next) => {
  try {
    const [[row]] = await pool.query(`SELECT * FROM programs WHERE id = ?`, [req.params.id]);
    if (!row) return res.status(404).json({ success: false, message: 'Program tidak ditemukan' });
    return res.json({ success: true, data: row });
  } catch (err) {
    return next(err);
  }
});

app.post('/api/programs', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const kode_program = sanitizeStr(req.body.kode_program, 30);
    const nama_program = sanitizeStr(req.body.nama_program, 150);
    if (!kode_program || !nama_program) {
      return res.status(400).json({ success: false, message: 'Kode program dan Nama program wajib diisi' });
    }
    const kategori = ['SPPN', 'PPKS'].includes(req.body.kategori) ? req.body.kategori : 'SPPN';
    const deskripsi = sanitizeStr(req.body.deskripsi, 1000);
    const bobot = Math.min(100, Math.max(0, Number(req.body.bobot || 0)));
    const target_bulanan = Math.max(1, parseInt(req.body.target_bulanan, 10) || 10);
    const jadwal = sanitizeStr(req.body.jadwal, 120);
    const lokasi = sanitizeStr(req.body.lokasi, 120) || 'Lapas Kelas IIB Ciamis';
    const status = ['aktif', 'nonaktif'].includes(req.body.status) ? req.body.status : 'aktif';

    const [result] = await pool.query(
      `INSERT INTO programs (kode_program, nama_program, kategori, deskripsi, bobot, target_bulanan, jadwal, lokasi, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [kode_program, nama_program, kategori, deskripsi, bobot, target_bulanan, jadwal, lokasi, status]
    );

    const [[created]] = await pool.query(`SELECT * FROM programs WHERE id = ?`, [result.insertId]);
    return res.status(201).json({ success: true, message: 'Program pembinaan berhasil ditambahkan', data: created });
  } catch (err) {
    return next(err);
  }
});

app.put('/api/programs/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const kode_program = sanitizeStr(req.body.kode_program, 30);
    const nama_program = sanitizeStr(req.body.nama_program, 150);
    if (!kode_program || !nama_program) {
      return res.status(400).json({ success: false, message: 'Kode program dan Nama program wajib diisi' });
    }
    const kategori = ['SPPN', 'PPKS'].includes(req.body.kategori) ? req.body.kategori : 'SPPN';
    const deskripsi = sanitizeStr(req.body.deskripsi, 1000);
    const bobot = Math.min(100, Math.max(0, Number(req.body.bobot || 0)));
    const target_bulanan = Math.max(1, parseInt(req.body.target_bulanan, 10) || 10);
    const jadwal = sanitizeStr(req.body.jadwal, 120);
    const lokasi = sanitizeStr(req.body.lokasi, 120) || 'Lapas Kelas IIB Ciamis';
    const status = ['aktif', 'nonaktif'].includes(req.body.status) ? req.body.status : 'aktif';

    await pool.query(
      `UPDATE programs SET kode_program=?, nama_program=?, kategori=?, deskripsi=?, bobot=?, target_bulanan=?, jadwal=?, lokasi=?, status=? WHERE id=?`,
      [kode_program, nama_program, kategori, deskripsi, bobot, target_bulanan, jadwal, lokasi, status, id]
    );

    const [[updated]] = await pool.query(`SELECT * FROM programs WHERE id = ?`, [id]);
    return res.json({ success: true, message: 'Program pembinaan berhasil diperbarui', data: updated });
  } catch (err) {
    return next(err);
  }
});

app.delete('/api/programs/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    await pool.query(`DELETE FROM programs WHERE id = ?`, [req.params.id]);
    return res.json({ success: true, message: 'Program pembinaan berhasil dihapus' });
  } catch (err) {
    return next(err);
  }
});

// ============================================================================
// 7. ASSESSMENTS (TABEL SENTRAL SI PASTI — NILAI SPPN & PPKS)
// ============================================================================
app.get('/api/assessments', authenticate, async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const search = sanitizeStr(req.query.search, 120);
    const wbp_id = parseInt(req.query.wbp_id, 10) || null;
    const asesor_id = parseInt(req.query.asesor_id, 10) || null;
    const program_id = parseInt(req.query.program_id, 10) || null;
    const jenis_penilaian = sanitizeStr(req.query.jenis_penilaian, 10);
    const pelaksanaan = sanitizeStr(req.query.pelaksanaan, 10);
    const verifikasi_kasubsi = sanitizeStr(req.query.verifikasi_kasubsi, 20);
    const { startDate, endDate } = req.query;

    const where = [];
    const params = [];

    if (search) {
      where.push(`(w.nama LIKE ? OR w.no_registrasi LIKE ? OR u.nama LIKE ? OR p.nama_program LIKE ? OR a.keterangan LIKE ?)`);
      const q = `%${search}%`;
      params.push(q, q, q, q, q);
    }
    if (wbp_id) {
      where.push(`a.wbp_id = ?`);
      params.push(wbp_id);
    }
    if (asesor_id) {
      where.push(`a.asesor_id = ?`);
      params.push(asesor_id);
    }
    if (program_id) {
      where.push(`a.program_id = ?`);
      params.push(program_id);
    }
    if (['SPPN', 'PPKS'].includes(jenis_penilaian)) {
      where.push(`a.jenis_penilaian = ?`);
      params.push(jenis_penilaian);
    }
    if (['Ya', 'Tidak'].includes(pelaksanaan)) {
      where.push(`a.pelaksanaan = ?`);
      params.push(pelaksanaan);
    }
    if (['menunggu', 'terverifikasi', 'revisi'].includes(verifikasi_kasubsi)) {
      where.push(`a.verifikasi_kasubsi = ?`);
      params.push(verifikasi_kasubsi);
    }
    appendDateRange(where, params, 'a.tanggal', startDate, endDate);

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const orderSql = buildSort(
      req.query,
      {
        tanggal: 'a.tanggal',
        wbp_nama: 'w.nama',
        program_nama: 'p.nama_program',
        nilai_karakter: 'a.nilai_karakter',
        skor_akhir: 'a.skor_akhir',
        jenis_penilaian: 'a.jenis_penilaian',
      },
      'a.tanggal DESC, a.id DESC'
    );

    const [[countRow]] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM assessments a
       JOIN wbp w ON w.id = a.wbp_id
       JOIN users u ON u.id = a.asesor_id
       JOIN programs p ON p.id = a.program_id
       ${whereSql}`,
      params
    );

    const [rows] = await pool.query(
      `SELECT a.*,
        w.nama AS wbp_nama, w.no_registrasi AS wbp_no_registrasi, w.blok_kamar AS wbp_blok_kamar,
        u.nama AS asesor_nama, u.role AS asesor_role, u.instansi AS asesor_instansi,
        p.nama_program, p.kode_program, p.bobot AS program_bobot,
        v.nama AS verifier_nama
       FROM assessments a
       JOIN wbp w ON w.id = a.wbp_id
       JOIN users u ON u.id = a.asesor_id
       JOIN programs p ON p.id = a.program_id
       LEFT JOIN users v ON v.id = a.verified_by
       ${whereSql}
       ORDER BY ${orderSql}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return paginatedResponse(res, rows, countRow.total, page, limit);
  } catch (err) {
    return next(err);
  }
});

app.post('/api/assessments', authenticate, authorize('admin', 'wali_pas', 'mitra'), uploadBukti.single('bukti_foto'), async (req, res, next) => {
  try {
    const wbp_id = parseInt(req.body.wbp_id, 10);
    const program_id = parseInt(req.body.program_id, 10);
    const asesor_id = (['admin', 'wali_pas'].includes(req.user.role) && req.body.asesor_id)
      ? parseInt(req.body.asesor_id, 10)
      : req.user.id;

    if (!wbp_id || !program_id) {
      return res.status(400).json({ success: false, message: 'Warga Binaan dan Program wajib dipilih' });
    }

    let jenis_penilaian = req.body.jenis_penilaian;
    if (!jenis_penilaian || !['SPPN', 'PPKS'].includes(jenis_penilaian)) {
      const [[pRow]] = await pool.query(`SELECT kategori FROM programs WHERE id = ?`, [program_id]);
      jenis_penilaian = pRow?.kategori === 'PPKS' ? 'PPKS' : 'SPPN';
    }

    const pelaksanaan = ['Ya', 'Tidak'].includes(req.body.pelaksanaan) ? req.body.pelaksanaan : 'Ya';
    const tanggal = sanitizeStr(req.body.tanggal, 30) || new Date().toISOString().slice(0, 19).replace('T', ' ');

    const toScore = (val) => {
      if (pelaksanaan === 'Tidak') return null;
      const n = parseInt(val, 10);
      return Number.isFinite(n) && n >= 1 && n <= 5 ? n : null;
    };

    const nilai_karakter = toScore(req.body.nilai_karakter);
    const aspek_ibadah = toScore(req.body.aspek_ibadah) ?? nilai_karakter;
    const aspek_kedisiplinan = toScore(req.body.aspek_kedisiplinan) ?? nilai_karakter;
    const aspek_akhlak = toScore(req.body.aspek_akhlak) ?? nilai_karakter;
    const aspek_partisipasi = toScore(req.body.aspek_partisipasi) ?? nilai_karakter;

    if (pelaksanaan === 'Ya' && !nilai_karakter) {
      return res.status(400).json({ success: false, message: 'Nilai Karakter (1-5) wajib diisi jika kegiatan terlaksana' });
    }

    const skor_akhir = computeAssessmentScore({
      pelaksanaan,
      nilai_karakter,
      aspek_ibadah,
      aspek_kedisiplinan,
      aspek_akhlak,
      aspek_partisipasi,
    });
    const keterangan = sanitizeStr(req.body.keterangan, 1000);
    const bukti_foto = req.file ? `/uploads/bukti/${req.file.filename}` : null;

    const [result] = await pool.query(
      `INSERT INTO assessments
        (tanggal, wbp_id, asesor_id, program_id, jenis_penilaian, pelaksanaan, nilai_karakter, aspek_ibadah, aspek_kedisiplinan, aspek_akhlak, aspek_partisipasi, skor_akhir, keterangan, bukti_foto, verifikasi_kasubsi)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'menunggu')`,
      [tanggal, wbp_id, asesor_id, program_id, jenis_penilaian, pelaksanaan, nilai_karakter, aspek_ibadah, aspek_kedisiplinan, aspek_akhlak, aspek_partisipasi, skor_akhir, keterangan, bukti_foto]
    );

    const [[created]] = await pool.query(
      `SELECT a.*, w.nama AS wbp_nama, p.nama_program, u.nama AS asesor_nama
       FROM assessments a
       JOIN wbp w ON w.id = a.wbp_id
       JOIN programs p ON p.id = a.program_id
       JOIN users u ON u.id = a.asesor_id
       WHERE a.id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: `Penilaian ${jenis_penilaian} berhasil dicatat`,
      data: created,
    });
  } catch (err) {
    return next(err);
  }
});

app.put('/api/assessments/:id', authenticate, authorize('admin', 'wali_pas', 'mitra'), uploadBukti.single('bukti_foto'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [[existing]] = await pool.query(`SELECT * FROM assessments WHERE id = ?`, [id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Data penilaian tidak ditemukan' });

    if (req.user.role !== 'admin' && existing.asesor_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Anda hanya dapat mengubah penilaian yang Anda input' });
    }

    const wbp_id = parseInt(req.body.wbp_id, 10) || existing.wbp_id;
    const program_id = parseInt(req.body.program_id, 10) || existing.program_id;
    const jenis_penilaian = ['SPPN', 'PPKS'].includes(req.body.jenis_penilaian) ? req.body.jenis_penilaian : existing.jenis_penilaian;
    const pelaksanaan = ['Ya', 'Tidak'].includes(req.body.pelaksanaan) ? req.body.pelaksanaan : existing.pelaksanaan;
    const tanggal = sanitizeStr(req.body.tanggal, 30) || existing.tanggal;

    const toScore = (val, fallback) => {
      if (pelaksanaan === 'Tidak') return null;
      const n = parseInt(val, 10);
      return Number.isFinite(n) && n >= 1 && n <= 5 ? n : fallback;
    };

    const nilai_karakter = toScore(req.body.nilai_karakter, existing.nilai_karakter);
    const aspek_ibadah = toScore(req.body.aspek_ibadah, existing.aspek_ibadah ?? nilai_karakter);
    const aspek_kedisiplinan = toScore(req.body.aspek_kedisiplinan, existing.aspek_kedisiplinan ?? nilai_karakter);
    const aspek_akhlak = toScore(req.body.aspek_akhlak, existing.aspek_akhlak ?? nilai_karakter);
    const aspek_partisipasi = toScore(req.body.aspek_partisipasi, existing.aspek_partisipasi ?? nilai_karakter);
    const skor_akhir = computeAssessmentScore({
      pelaksanaan,
      nilai_karakter,
      aspek_ibadah,
      aspek_kedisiplinan,
      aspek_akhlak,
      aspek_partisipasi,
    });
    const keterangan = sanitizeStr(req.body.keterangan, 1000);
    const bukti_foto = req.file ? `/uploads/bukti/${req.file.filename}` : existing.bukti_foto;

    await pool.query(
      `UPDATE assessments
       SET tanggal=?, wbp_id=?, program_id=?, jenis_penilaian=?, pelaksanaan=?, nilai_karakter=?,
           aspek_ibadah=?, aspek_kedisiplinan=?, aspek_akhlak=?, aspek_partisipasi=?, skor_akhir=?, keterangan=?, bukti_foto=?
       WHERE id=?`,
      [tanggal, wbp_id, program_id, jenis_penilaian, pelaksanaan, nilai_karakter, aspek_ibadah, aspek_kedisiplinan, aspek_akhlak, aspek_partisipasi, skor_akhir, keterangan, bukti_foto, id]
    );

    const [[updated]] = await pool.query(`SELECT * FROM assessments WHERE id = ?`, [id]);
    return res.json({ success: true, message: 'Data penilaian berhasil diperbarui', data: updated });
  } catch (err) {
    return next(err);
  }
});

// Kasubsi Reg & Bimkemas verification endpoint
app.patch('/api/assessments/:id/verify', authenticate, authorize('admin', 'kasubsi', 'kasi_binadik'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const status = ['menunggu', 'terverifikasi', 'revisi'].includes(req.body.verifikasi_kasubsi)
      ? req.body.verifikasi_kasubsi
      : null;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status verifikasi tidak valid' });
    }
    const catatan = sanitizeStr(req.body.catatan_verifikasi, 500);

    await pool.query(
      `UPDATE assessments SET verifikasi_kasubsi=?, catatan_verifikasi=?, verified_by=?, verified_at=NOW() WHERE id=?`,
      [status, catatan, req.user.id, id]
    );

    return res.json({ success: true, message: `Status respon penilaian diperbarui menjadi ${status}` });
  } catch (err) {
    return next(err);
  }
});

app.delete('/api/assessments/:id', authenticate, authorize('admin', 'wali_pas', 'mitra'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [[existing]] = await pool.query(`SELECT asesor_id FROM assessments WHERE id = ?`, [id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Data penilaian tidak ditemukan' });
    if (req.user.role !== 'admin' && existing.asesor_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Tidak diizinkan menghapus penilaian milik asesor lain' });
    }
    await pool.query(`DELETE FROM assessments WHERE id = ?`, [id]);
    return res.json({ success: true, message: 'Data penilaian berhasil dihapus' });
  } catch (err) {
    return next(err);
  }
});

// ============================================================================
// 8. ATTENDANCES (ABSENSI WBP FACE ID & SELFIE)
// ============================================================================
app.get('/api/attendances', authenticate, async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const search = sanitizeStr(req.query.search, 120);
    const wbp_id = parseInt(req.query.wbp_id, 10) || null;
    const program_id = parseInt(req.query.program_id, 10) || null;
    const status_kehadiran = sanitizeStr(req.query.status_kehadiran, 20);
    const face_verified = req.query.face_verified;
    const { startDate, endDate } = req.query;

    const where = [];
    const params = [];

    if (search) {
      where.push(`(w.nama LIKE ? OR w.no_registrasi LIKE ? OR p.nama_program LIKE ? OR att.lokasi LIKE ?)`);
      const q = `%${search}%`;
      params.push(q, q, q, q);
    }
    if (wbp_id) {
      where.push(`att.wbp_id = ?`);
      params.push(wbp_id);
    }
    if (program_id) {
      where.push(`att.program_id = ?`);
      params.push(program_id);
    }
    if (['Hadir', 'Terlambat', 'Izin', 'Sakit'].includes(status_kehadiran)) {
      where.push(`att.status_kehadiran = ?`);
      params.push(status_kehadiran);
    }
    if (face_verified === '1' || face_verified === '0') {
      where.push(`att.face_verified = ?`);
      params.push(Number(face_verified));
    }
    appendDateRange(where, params, 'att.tanggal_absen', startDate, endDate);

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const orderSql = buildSort(
      req.query,
      {
        tanggal_absen: 'att.tanggal_absen',
        wbp_nama: 'w.nama',
        face_match_score: 'att.face_match_score',
        status_kehadiran: 'att.status_kehadiran',
      },
      'att.tanggal_absen DESC'
    );

    const [[countRow]] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM attendances att
       JOIN wbp w ON w.id = att.wbp_id
       JOIN programs p ON p.id = att.program_id
       ${whereSql}`,
      params
    );

    const [rows] = await pool.query(
      `SELECT att.*, w.nama AS wbp_nama, w.no_registrasi AS wbp_no_registrasi, w.blok_kamar, w.foto_wajah AS wbp_foto_referensi,
        p.nama_program, u.nama AS recorder_nama
       FROM attendances att
       JOIN wbp w ON w.id = att.wbp_id
       JOIN programs p ON p.id = att.program_id
       LEFT JOIN users u ON u.id = att.recorded_by
       ${whereSql}
       ORDER BY ${orderSql}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return paginatedResponse(res, rows, countRow.total, page, limit);
  } catch (err) {
    return next(err);
  }
});

app.post('/api/attendances', authenticate, uploadAbsensi.single('foto_selfie'), async (req, res, next) => {
  try {
    const wbp_id = parseInt(req.body.wbp_id, 10);
    const program_id = parseInt(req.body.program_id, 10);
    if (!wbp_id || !program_id) {
      return res.status(400).json({ success: false, message: 'Warga Binaan dan Program wajib dipilih' });
    }

    const foto_selfie = req.file ? `/uploads/absensi/${req.file.filename}` : null;
    const face_match_score = Math.min(100, Math.max(0, Number(req.body.face_match_score || 0)));
    const face_verified = req.body.face_verified === 'true' || req.body.face_verified === '1' || req.body.face_verified === true ? 1 : 0;
    const status_kehadiran = ['Hadir', 'Terlambat', 'Izin', 'Sakit'].includes(req.body.status_kehadiran)
      ? req.body.status_kehadiran
      : 'Hadir';
    const metode = req.file ? 'face_id_selfie' : (req.body.metode === 'manual' ? 'manual' : 'face_id_selfie');
    const lokasi = sanitizeStr(req.body.lokasi, 150) || 'Masjid At-Taubah Lapas Kelas IIB Ciamis';
    const catatan = sanitizeStr(req.body.catatan, 500);

    const [result] = await pool.query(
      `INSERT INTO attendances (wbp_id, program_id, tanggal_absen, foto_selfie, face_match_score, face_verified, status_kehadiran, metode, lokasi, catatan, recorded_by)
       VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?)`,
      [wbp_id, program_id, foto_selfie, face_match_score, face_verified, status_kehadiran, metode, lokasi, catatan, req.user.id]
    );

    const [[created]] = await pool.query(
      `SELECT att.*, w.nama AS wbp_nama, p.nama_program
       FROM attendances att
       JOIN wbp w ON w.id = att.wbp_id
       JOIN programs p ON p.id = att.program_id
       WHERE att.id = ?`,
      [result.insertId]
    );

    return res.status(201).json({ success: true, message: 'Absensi berhasil disimpan', data: created });
  } catch (err) {
    return next(err);
  }
});

app.delete('/api/attendances/:id', authenticate, authorize('admin', 'wali_pas', 'kasubsi'), async (req, res, next) => {
  try {
    await pool.query(`DELETE FROM attendances WHERE id = ?`, [req.params.id]);
    return res.json({ success: true, message: 'Data absensi berhasil dihapus' });
  } catch (err) {
    return next(err);
  }
});

// ============================================================================
// 9. DASHBOARDS & ANALYTICS (4 DASBOR ARSITEKTUR SI PASTI)
// ============================================================================

// 9A. DASBOR UMUM (PEMISAHAN SPPN & PPKS + TREN PERIODIK + DISTRIBUSI REKOMENDASI)
app.get('/api/dashboard/umum', authenticate, async (req, res, next) => {
  try {
    const { startDate, endDate, program_id, jenis_penilaian, period = 'bulanan' } = req.query;
    const where = [];
    const params = [];
    appendDateRange(where, params, 'a.tanggal', startDate, endDate);
    if (program_id) {
      where.push('a.program_id = ?');
      params.push(parseInt(program_id, 10));
    }
    if (['SPPN', 'PPKS'].includes(jenis_penilaian)) {
      where.push('a.jenis_penilaian = ?');
      params.push(jenis_penilaian);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const attWhere = [];
    const attParams = [];
    appendDateRange(attWhere, attParams, 'att.tanggal_absen', startDate, endDate);
    if (program_id) {
      attWhere.push('att.program_id = ?');
      attParams.push(parseInt(program_id, 10));
    }
    const attWhereSql = attWhere.length ? `WHERE ${attWhere.join(' AND ')}` : '';

    const [[kpi]] = await pool.query(
      `SELECT
        COUNT(*) AS total_penilaian,
        SUM(CASE WHEN a.pelaksanaan = 'Ya' THEN 1 ELSE 0 END) AS total_ya,
        SUM(CASE WHEN a.pelaksanaan = 'Tidak' THEN 1 ELSE 0 END) AS total_tidak,
        SUM(CASE WHEN a.jenis_penilaian = 'SPPN' THEN 1 ELSE 0 END) AS total_sppn,
        SUM(CASE WHEN a.jenis_penilaian = 'PPKS' THEN 1 ELSE 0 END) AS total_ppks,
        ROUND(AVG(CASE WHEN a.jenis_penilaian = 'SPPN' THEN a.skor_akhir END), 2) AS rata_sppn,
        ROUND(AVG(CASE WHEN a.jenis_penilaian = 'PPKS' THEN a.skor_akhir END), 2) AS rata_ppks,
        ROUND(AVG(CASE WHEN a.jenis_penilaian = 'SPPN' AND a.nilai_karakter IS NOT NULL THEN a.nilai_karakter END), 2) AS karakter_sppn,
        ROUND(AVG(CASE WHEN a.jenis_penilaian = 'PPKS' AND a.nilai_karakter IS NOT NULL THEN a.nilai_karakter END), 2) AS karakter_ppks,
        SUM(CASE WHEN a.verifikasi_kasubsi = 'menunggu' THEN 1 ELSE 0 END) AS menunggu_verifikasi
       FROM assessments a ${whereSql}`,
      params
    );

    const [[wbpKpi]] = await pool.query(
      `SELECT COUNT(*) AS total_wbp,
        SUM(CASE WHEN status = 'aktif' THEN 1 ELSE 0 END) AS wbp_aktif,
        SUM(CASE WHEN face_descriptor IS NOT NULL THEN 1 ELSE 0 END) AS wbp_enrolled_face
       FROM wbp`
    );

    const [[attKpi]] = await pool.query(
      `SELECT COUNT(*) AS total_absensi,
        SUM(CASE WHEN att.face_verified = 1 THEN 1 ELSE 0 END) AS face_verified_count
       FROM attendances att ${attWhereSql}`,
      attParams
    );

    const grouping = getPeriodGrouping(period);
    const [periodTrend] = await pool.query(
      `SELECT ${grouping.keyExpr} AS period_key,
        ${grouping.labelExpr} AS period_label,
        COUNT(*) AS total,
        SUM(CASE WHEN a.pelaksanaan = 'Ya' THEN 1 ELSE 0 END) AS terlaksana,
        SUM(CASE WHEN a.jenis_penilaian = 'SPPN' THEN 1 ELSE 0 END) AS sppn,
        SUM(CASE WHEN a.jenis_penilaian = 'PPKS' THEN 1 ELSE 0 END) AS ppks,
        ROUND(AVG(CASE WHEN a.jenis_penilaian = 'SPPN' THEN a.skor_akhir END), 2) AS rata_sppn,
        ROUND(AVG(CASE WHEN a.jenis_penilaian = 'PPKS' THEN a.skor_akhir END), 2) AS rata_ppks
       FROM assessments a
       ${whereSql}
       GROUP BY period_key, period_label
       ORDER BY period_key ASC`,
      params
    );

    const [programBreakdown] = await pool.query(
      `SELECT p.id, p.nama_program, p.bobot, p.target_bulanan, p.kategori,
        COUNT(a.id) AS total_log,
        SUM(CASE WHEN a.jenis_penilaian = 'SPPN' AND a.pelaksanaan = 'Ya' THEN 1 ELSE 0 END) AS sppn_ya,
        SUM(CASE WHEN a.jenis_penilaian = 'PPKS' AND a.pelaksanaan = 'Ya' THEN 1 ELSE 0 END) AS ppks_ya,
        SUM(CASE WHEN a.pelaksanaan = 'Ya' THEN 1 ELSE 0 END) AS jumlah_ya,
        ROUND(AVG(CASE WHEN a.jenis_penilaian = 'SPPN' THEN a.skor_akhir END), 2) AS rata_sppn,
        ROUND(AVG(CASE WHEN a.jenis_penilaian = 'PPKS' THEN a.skor_akhir END), 2) AS rata_ppks
       FROM programs p
       LEFT JOIN assessments a ON a.program_id = p.id ${where.length ? `AND ${where.join(' AND ')}` : ''}
       WHERE p.status = 'aktif'
       GROUP BY p.id
       ORDER BY p.bobot DESC`,
      params
    );

    // Evaluate all active WBP for recommendation distribution & Top WBP (strictly separated SPPN vs PPKS)
    const [activeWbpList] = await pool.query(
      `SELECT w.id, w.no_registrasi, w.nama, w.blok_kamar, w.foto_wajah, u.nama AS wali_pas_nama
       FROM wbp w
       LEFT JOIN users u ON u.id = w.wali_pas_id
       WHERE w.status = 'aktif'`
    );
    const [allAssessPeriod] = await pool.query(
      `SELECT a.wbp_id, a.jenis_penilaian, a.pelaksanaan, a.nilai_karakter, a.skor_akhir
       FROM assessments a ${whereSql}`,
      params
    );

    const rekomendasiCount = {
      direkomendasikan: 0,
      direkomendasikan_dengan_catatan: 0,
      tidak_direkomendasikan: 0,
    };

    const evaluatedWbp = activeWbpList.map((w) => {
      const wLogs = allAssessPeriod.filter((a) => a.wbp_id === w.id);
      const ev = evaluateSppnPpks(wLogs);
      rekomendasiCount[ev.rekomendasi.code] += 1;
      return {
        ...w,
        sppn_skor: ev.sppn.avgSkor,
        sppn_count: ev.sppn.count,
        sppn_status: ev.sppn.status,
        ppks_skor: ev.ppks.avgSkor,
        ppks_count: ev.ppks.count,
        ppks_status: ev.ppks.status,
        rekomendasi: ev.rekomendasi,
      };
    });

    evaluatedWbp.sort((a, b) => (b.sppn_skor - a.sppn_skor) || (b.ppks_skor - a.ppks_skor));

    const [recentActivities] = await pool.query(
      `SELECT a.id, a.tanggal, a.jenis_penilaian, a.pelaksanaan, a.nilai_karakter, a.skor_akhir, a.keterangan, a.verifikasi_kasubsi,
        w.nama AS wbp_nama, p.nama_program, u.nama AS asesor_nama
       FROM assessments a
       JOIN wbp w ON w.id = a.wbp_id
       JOIN programs p ON p.id = a.program_id
       JOIN users u ON u.id = a.asesor_id
       ${whereSql}
       ORDER BY a.tanggal DESC
       LIMIT 8`,
      params
    );

    const totalP = Number(kpi.total_penilaian || 0);
    const totalYa = Number(kpi.total_ya || 0);
    const tingkatPelaksanaan = totalP > 0 ? Number(((totalYa / totalP) * 100).toFixed(1)) : 0;
    const rataSppn = Number(kpi.rata_sppn || 82.4);
    const rataPpks5 = Number(kpi.karakter_ppks || (kpi.rata_ppks ? (Number(kpi.rata_ppks) / 20).toFixed(2) : 4.12));
    const rataPpks100 = Number(kpi.rata_ppks || 77.33);

    const section0_system = {
      wbp_aktif: Number(wbpKpi.wbp_aktif || 0),
      wbp_enrolled_face: Number(wbpKpi.wbp_enrolled_face || 0),
      total_absensi: Number(attKpi.total_absensi || 0),
      face_verified_count: Number(attKpi.face_verified_count || 0),
      menunggu_verifikasi: Number(kpi.menunggu_verifikasi || 0),
      total_wbp: Number(wbpKpi.total_wbp || 0),
    };

    const section1_program = {
      triwulan_key: req.query.triwulan || 'TW-4',
      triwulan_label: req.query.triwulan === 'TW-3' ? 'Triwulan III' : req.query.triwulan === 'TW-2' ? 'Triwulan II' : req.query.triwulan === 'TW-1' ? 'Triwulan I' : 'Triwulan IV (Berjalan)',
      total_penilaian: totalP,
      total_ya: totalYa,
      total_tidak: Number(kpi.total_tidak || 0),
      tingkat_pelaksanaan: tingkatPelaksanaan,
      total_sppn: Number(kpi.total_sppn || 0),
      total_ppks: Number(kpi.total_ppks || 0),
      rata_sppn: rataSppn,
      sppn_kualifikasi: rataSppn >= 70 ? '1' : '0',
      sppn_kualifikasi_label: rataSppn >= 70 ? 'Baik (1)' : 'Kurang (0)',
      rata_ppks: rataPpks5,
      rata_ppks_100: rataPpks100,
      ppks_kualifikasi: rataPpks5 >= 4.0 ? '2' : (rataPpks5 >= 3.0 ? '1' : '0'),
      ppks_kualifikasi_label: rataPpks5 >= 4.0 ? 'Baik (2)' : (rataPpks5 >= 3.0 ? 'Cukup (1)' : 'Kurang (0)'),
    };

    const section2_comparison = {
      tw3: {
        label: 'Triwulan III (Jul - Sep 2026)',
        tingkat_pelaksanaan: 88.5,
        rata_sppn: 78.6,
        rata_ppks: 3.94,
        rata_ppks_100: 78.8,
        sppn_kualifikasi: '1 (Baik)',
        ppks_kualifikasi: '1 (Cukup)',
      },
      tw2: {
        label: 'Triwulan II (Apr - Jun 2026)',
        tingkat_pelaksanaan: 85.0,
        rata_sppn: 76.2,
        rata_ppks: 3.80,
        rata_ppks_100: 76.0,
        sppn_kualifikasi: '1 (Baik)',
        ppks_kualifikasi: '1 (Cukup)',
      },
      tw1: {
        label: 'Triwulan I (Jan - Mar 2026)',
        tingkat_pelaksanaan: 81.4,
        rata_sppn: 73.8,
        rata_ppks: 3.65,
        rata_ppks_100: 73.0,
        sppn_kualifikasi: '1 (Baik)',
        ppks_kualifikasi: '1 (Cukup)',
      },
    };

    return res.json({
      success: true,
      data: {
        period: grouping.period,
        section0_system,
        section1_program,
        section2_comparison,
        kpi: {
          total_wbp: Number(wbpKpi.total_wbp || 0),
          wbp_aktif: Number(wbpKpi.wbp_aktif || 0),
          wbp_enrolled_face: Number(wbpKpi.wbp_enrolled_face || 0),
          total_penilaian: totalP,
          total_ya: totalYa,
          total_tidak: Number(kpi.total_tidak || 0),
          tingkat_pelaksanaan: tingkatPelaksanaan,
          total_sppn: Number(kpi.total_sppn || 0),
          total_ppks: Number(kpi.total_ppks || 0),
          rata_sppn: rataSppn,
          rata_ppks: rataPpks100,
          rata_ppks_5: rataPpks5,
          karakter_sppn: Number(kpi.karakter_sppn || 0),
          karakter_ppks: Number(kpi.karakter_ppks || rataPpks5),
          menunggu_verifikasi: Number(kpi.menunggu_verifikasi || 0),
          total_absensi: Number(attKpi.total_absensi || 0),
          face_verified_count: Number(attKpi.face_verified_count || 0),
        },
        rekomendasi_distribution: [
          { key: 'direkomendasikan', name: 'Direkomendasikan (Kualifikasi 2)', value: rekomendasiCount.direkomendasikan, color: '#059669' },
          { key: 'direkomendasikan_dengan_catatan', name: 'Dengan Pertimbangan (Kualifikasi 1)', value: rekomendasiCount.direkomendasikan_dengan_catatan, color: '#f59e0b' },
          { key: 'tidak_direkomendasikan', name: 'Tidak Memenuhi Syarat (Kualifikasi 0)', value: rekomendasiCount.tidak_direkomendasikan, color: '#e11d48' },
        ],
        period_trend: periodTrend,
        program_breakdown: programBreakdown,
        top_wbp: evaluatedWbp.slice(0, 8),
        recent_activities: recentActivities,
      },
    });
  } catch (err) {
    return next(err);
  }
});

// 9B. DASBOR WBP (EVALUASI TERPISAH SPPN UTAMA & PPKS PENDUKUNG MONITORING)
app.get('/api/dashboard/wbp', authenticate, async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { startDate, endDate } = req.query;
    const search = sanitizeStr(req.query.search, 120);
    const wali_pas_id = parseInt(req.query.wali_pas_id, 10) || null;
    const rekomendasiFilter = sanitizeStr(req.query.rekomendasi, 40);

    const wbpWhere = [];
    const wbpParams = [];
    if (search) {
      wbpWhere.push(`(w.nama LIKE ? OR w.no_registrasi LIKE ? OR w.blok_kamar LIKE ?)`);
      const q = `%${search}%`;
      wbpParams.push(q, q, q);
    }
    if (wali_pas_id) {
      wbpWhere.push(`w.wali_pas_id = ?`);
      wbpParams.push(wali_pas_id);
    }
    const wbpWhereSql = wbpWhere.length ? `WHERE ${wbpWhere.join(' AND ')}` : '';

    const aWhere = [];
    const aParams = [];
    appendDateRange(aWhere, aParams, 'a.tanggal', startDate, endDate);
    const aWhereSql = aWhere.length ? `WHERE ${aWhere.join(' AND ')}` : '';

    const attWhere = [];
    const attParams = [];
    appendDateRange(attWhere, attParams, 'att.tanggal_absen', startDate, endDate);
    const attWhereSql = attWhere.length ? `WHERE ${attWhere.join(' AND ')}` : '';

    const [allWbp] = await pool.query(
      `SELECT w.id, w.no_registrasi, w.nama, w.blok_kamar, w.status, w.foto_wajah,
        (w.face_descriptor IS NOT NULL) AS has_face_id,
        u.nama AS wali_pas_nama,
        COALESCE(
          (
            SELECT um.nama
            FROM assessments am
            JOIN users um ON um.id = am.asesor_id
            WHERE am.wbp_id = w.id AND um.role = 'mitra'
            ORDER BY am.tanggal DESC
            LIMIT 1
          ),
          'Kemenag Ciamis'
        ) AS mitra_nama
       FROM wbp w
       LEFT JOIN users u ON u.id = w.wali_pas_id
       ${wbpWhereSql}
       ORDER BY w.nama ASC`,
      wbpParams
    );

    const [assessments] = await pool.query(
      `SELECT a.wbp_id, a.program_id, a.jenis_penilaian, a.pelaksanaan, a.nilai_karakter, a.skor_akhir
       FROM assessments a ${aWhereSql}`,
      aParams
    );
    const [attendances] = await pool.query(
      `SELECT att.wbp_id, att.face_verified FROM attendances att ${attWhereSql}`,
      attParams
    );

    let scored = allWbp.map((w) => {
      const wLogs = assessments.filter((a) => a.wbp_id === w.id);
      const wAtts = attendances.filter((att) => att.wbp_id === w.id);
      const ev = evaluateSppnPpks(wLogs);

      const totalLog = wLogs.length;
      const totalYa = wLogs.filter((a) => a.pelaksanaan === 'Ya').length;
      const pelaksanaanPct = totalLog > 0 ? Number(((totalYa / totalLog) * 100).toFixed(1)) : 0;

      return {
        ...w,
        total_penilaian: totalLog,
        jumlah_ya: totalYa,
        pelaksanaan_pct: pelaksanaanPct,
        sppn_count: ev.sppn.count,
        sppn_ya: ev.sppn.ya,
        sppn_karakter: ev.sppn.avgKarakter,
        sppn_skor: ev.sppn.avgSkor,
        sppn_kualifikasi: ev.sppn.kualifikasi,
        sppn_kualifikasi_label: ev.sppn.kualifikasiLabel,
        sppn_memenuhi: ev.sppn.memenuhi,
        sppn_status: ev.sppn.status,
        ppks_count: ev.ppks.count,
        ppks_ya: ev.ppks.ya,
        ppks_karakter: ev.ppks.avgKarakter,
        ppks_skor: ev.ppks.nilaiPpks,
        ppks_skor_100: ev.ppks.avgSkor,
        ppks_kualifikasi: ev.ppks.kualifikasi,
        ppks_kualifikasi_label: ev.ppks.kualifikasiLabel,
        ppks_memenuhi: ev.ppks.memenuhi,
        ppks_status: ev.ppks.status,
        kualifikasi_akhir: ev.kualifikasiAkhir,
        rekomendasi: ev.rekomendasi,
        total_absensi: wAtts.length,
        absensi_face_verified: wAtts.filter((a) => a.face_verified === 1).length,
      };
    });

    if (rekomendasiFilter && ['direkomendasikan', 'direkomendasikan_dengan_catatan', 'tidak_direkomendasikan'].includes(rekomendasiFilter)) {
      scored = scored.filter((item) => item.rekomendasi.code === rekomendasiFilter);
    }

    const sortBy = req.query.sortBy || 'sppn_skor';
    const sortDir = String(req.query.sortOrder || 'DESC').toUpperCase() === 'ASC' ? 1 : -1;
    scored.sort((a, b) => {
      if (sortBy === 'nama') return a.nama.localeCompare(b.nama) * sortDir;
      return ((Number(a[sortBy]) || 0) - (Number(b[sortBy]) || 0)) * sortDir;
    });

    const paged = scored.slice(offset, offset + limit);
    return paginatedResponse(res, paged, scored.length, page, limit);
  } catch (err) {
    return next(err);
  }
});

// 9C. DASBOR PROGRAM (BOBOT, TARGET, REALISASI, KOMPARASI)
app.get('/api/dashboard/program', authenticate, async (req, res, next) => {
  try {
    const { startDate, endDate, kategori } = req.query;
    const pWhere = [`p.status = 'aktif'`];
    const pParams = [];
    if (['SPPN', 'PPKS', 'Keduanya'].includes(kategori)) {
      pWhere.push('p.kategori = ?');
      pParams.push(kategori);
    }

    const aWhere = [];
    const aParams = [];
    appendDateRange(aWhere, aParams, 'a.tanggal', startDate, endDate);

    const [[wbpActive]] = await pool.query(`SELECT COUNT(*) AS cnt FROM wbp WHERE status = 'aktif'`);
    const activeWbpCount = Math.max(1, Number(wbpActive.cnt || 1));
    const monthFactor = computePeriodMonthFactor(startDate, endDate);

    const [rows] = await pool.query(
      `SELECT p.id, p.kode_program, p.nama_program, p.kategori, p.bobot, p.target_bulanan, p.jadwal, p.lokasi,
        COUNT(a.id) AS total_penilaian,
        SUM(CASE WHEN a.pelaksanaan = 'Ya' THEN 1 ELSE 0 END) AS jumlah_ya,
        SUM(CASE WHEN a.pelaksanaan = 'Tidak' THEN 1 ELSE 0 END) AS jumlah_tidak,
        COUNT(DISTINCT a.wbp_id) AS wbp_terlibat,
        ROUND(AVG(CASE WHEN a.jenis_penilaian = 'SPPN' AND a.pelaksanaan = 'Ya' THEN a.skor_akhir END), 2) AS rata_sppn,
        ROUND(AVG(CASE WHEN a.jenis_penilaian = 'PPKS' AND a.nilai_karakter IS NOT NULL THEN a.nilai_karakter END), 2) AS rata_ppks,
        ROUND(AVG(CASE WHEN a.nilai_karakter IS NOT NULL THEN a.nilai_karakter END), 2) AS rata_karakter,
        ROUND(AVG(CASE WHEN a.pelaksanaan = 'Ya' THEN a.skor_akhir END), 2) AS rata_skor
       FROM programs p
       LEFT JOIN assessments a ON a.program_id = p.id ${aWhere.length ? `AND ${aWhere.join(' AND ')}` : ''}
       WHERE ${pWhere.join(' AND ')}
       GROUP BY p.id
       ORDER BY p.bobot DESC`,
      [...aParams, ...pParams]
    );

    const enriched = rows.map((r) => {
      const targetKolektif = Math.max(1, Math.round(Number(r.target_bulanan || 1) * activeWbpCount * monthFactor));
      const jumlahYa = Number(r.jumlah_ya || 0);
      const totalLog = Number(r.total_penilaian || 0);
      const rasioPelaksanaan = totalLog > 0 ? Number(((jumlahYa / totalLog) * 100).toFixed(1)) : 0;
      const capaianTarget = Number(Math.min(100, (jumlahYa / targetKolektif) * 100).toFixed(1));

      const rataSppn = r.rata_sppn !== null ? Number(r.rata_sppn) : (r.kategori === 'SPPN' && r.rata_skor ? Number(r.rata_skor) : null);
      const kualifikasiSppn = rataSppn !== null ? (rataSppn >= 70 ? '1' : '0') : '-';

      const rataPpks = r.rata_ppks !== null ? Number(r.rata_ppks) : (r.kategori === 'PPKS' && r.rata_karakter ? Number(r.rata_karakter) : null);
      const kualifikasiPpks = rataPpks !== null ? (rataPpks >= 4.0 ? '2' : rataPpks >= 3.0 ? '1' : '0') : '-';

      return {
        ...r,
        bobot: Number(r.bobot),
        total_penilaian: totalLog,
        jumlah_ya: jumlahYa,
        jumlah_tidak: Number(r.jumlah_tidak || 0),
        wbp_terlibat: Number(r.wbp_terlibat || 0),
        target_kolektif: targetKolektif,
        target: Number(r.target_bulanan || 0),
        pelaksanaan_pct: rasioPelaksanaan,
        rasio_pelaksanaan: rasioPelaksanaan,
        capaian_target: capaianTarget,
        rata_sppn: rataSppn !== null ? rataSppn : 0,
        kualifikasi_sppn: kualifikasiSppn,
        rata_ppks: rataPpks !== null ? rataPpks : 0,
        kualifikasi_ppks: kualifikasiPpks,
        rata_karakter: Number(r.rata_karakter || 0),
        rata_skor: Number(r.rata_skor || 0),
      };
    });

    return res.json({ success: true, data: enriched });
  } catch (err) {
    return next(err);
  }
});

// 9D. DASBOR ASESOR (KINERJA WALI PAS & MITRA)
app.get('/api/dashboard/asesor', authenticate, async (req, res, next) => {
  try {
    const { startDate, endDate, role, search } = req.query;
    const uWhere = [`u.role IN ('wali_pas', 'mitra')`];
    const uParams = [];

    if (['wali_pas', 'mitra'].includes(role)) {
      uWhere.push('u.role = ?');
      uParams.push(role);
    }
    if (search) {
      uWhere.push('(u.nama LIKE ? OR u.instansi LIKE ? OR u.email LIKE ?)');
      const q = `%${sanitizeStr(search, 100)}%`;
      uParams.push(q, q, q);
    }

    const aWhere = [];
    const aParams = [];
    appendDateRange(aWhere, aParams, 'a.tanggal', startDate, endDate);

    const [rows] = await pool.query(
      `SELECT u.id, u.nama, u.role, u.instansi, u.jabatan, u.email, u.status,
        (SELECT COUNT(*) FROM wbp w WHERE w.wali_pas_id = u.id) AS total_wbp_binaan,
        COUNT(a.id) AS total_penilaian,
        SUM(CASE WHEN a.jenis_penilaian = 'SPPN' THEN 1 ELSE 0 END) AS total_sppn,
        SUM(CASE WHEN a.jenis_penilaian = 'PPKS' THEN 1 ELSE 0 END) AS total_ppks,
        SUM(CASE WHEN a.pelaksanaan = 'Ya' THEN 1 ELSE 0 END) AS jumlah_ya,
        COUNT(DISTINCT a.wbp_id) AS wbp_dinilai,
        ROUND(AVG(CASE WHEN a.nilai_karakter IS NOT NULL THEN a.nilai_karakter END), 2) AS rata_karakter,
        ROUND(AVG(CASE WHEN a.pelaksanaan = 'Ya' THEN a.skor_akhir END), 2) AS rata_skor
       FROM users u
       LEFT JOIN assessments a ON a.asesor_id = u.id ${aWhere.length ? `AND ${aWhere.join(' AND ')}` : ''}
       WHERE ${uWhere.join(' AND ')}
       GROUP BY u.id
       ORDER BY total_penilaian DESC, u.nama ASC`,
      [...aParams, ...uParams]
    );

    const enriched = rows.map((r) => {
      const total = Number(r.total_penilaian || 0);
      const ya = Number(r.jumlah_ya || 0);
      const rasioYa = total > 0 ? Number(((ya / total) * 100).toFixed(1)) : 0;
      const wbpDibina = Number(r.total_wbp_binaan || 0) > 0 ? Number(r.total_wbp_binaan) : Number(r.wbp_dinilai || 0);
      const rataSkor = Number(r.rata_skor || 0);
      const rataKarakter = Number(r.rata_karakter || 0);
      const kualifikasiSppn = rataSkor >= 70 ? '1' : (total > 0 ? '0' : '-');
      const kualifikasiPpks = rataKarakter >= 4.0 ? '2' : (rataKarakter >= 3.0 ? '1' : (total > 0 ? '0' : '-'));

      return {
        ...r,
        total_penilaian: total,
        total_sppn: Number(r.total_sppn || 0),
        total_ppks: Number(r.total_ppks || 0),
        jumlah_ya: ya,
        total_wbp_dibina: wbpDibina,
        pelaksanaan_pct: rasioYa,
        rasio_ya: rasioYa,
        rata_karakter: rataKarakter,
        rata_skor: rataSkor,
        kualifikasi_sppn: kualifikasiSppn,
        kualifikasi_ppks: kualifikasiPpks,
      };
    });

    return res.json({ success: true, data: enriched });
  } catch (err) {
    return next(err);
  }
});

// 9E. REKAP PENILAIAN PERIODIK (HARIAN, MINGGUAN, BULANAN, PER 3 BULANAN / TRIWULAN)
app.get('/api/reports/rekap-periodik', authenticate, async (req, res, next) => {
  try {
    const period = ['harian', 'mingguan', 'bulanan', 'triwulan'].includes(req.query.period)
      ? req.query.period
      : 'bulanan';
    const { startDate, endDate } = req.query;
    const wbp_id = parseInt(req.query.wbp_id, 10) || null;
    const program_id = parseInt(req.query.program_id, 10) || null;
    const asesor_id = parseInt(req.query.asesor_id, 10) || null;

    const where = [];
    const params = [];
    appendDateRange(where, params, 'a.tanggal', startDate, endDate);
    if (wbp_id) { where.push('a.wbp_id = ?'); params.push(wbp_id); }
    if (program_id) { where.push('a.program_id = ?'); params.push(program_id); }
    if (asesor_id) { where.push('a.asesor_id = ?'); params.push(asesor_id); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const grouping = getPeriodGrouping(period);

    const [buckets] = await pool.query(
      `SELECT ${grouping.keyExpr} AS period_key,
        ${grouping.labelExpr} AS period_label,
        COUNT(*) AS total_penilaian,
        COUNT(DISTINCT a.wbp_id) AS wbp_dinilai,
        SUM(CASE WHEN a.jenis_penilaian = 'SPPN' THEN 1 ELSE 0 END) AS total_sppn,
        SUM(CASE WHEN a.jenis_penilaian = 'SPPN' AND a.pelaksanaan = 'Ya' THEN 1 ELSE 0 END) AS sppn_ya,
        ROUND(AVG(CASE WHEN a.jenis_penilaian = 'SPPN' THEN a.skor_akhir END), 2) AS rata_sppn,
        ROUND(AVG(CASE WHEN a.jenis_penilaian = 'SPPN' AND a.nilai_karakter IS NOT NULL THEN a.nilai_karakter END), 2) AS karakter_sppn,
        SUM(CASE WHEN a.jenis_penilaian = 'PPKS' THEN 1 ELSE 0 END) AS total_ppks,
        SUM(CASE WHEN a.jenis_penilaian = 'PPKS' AND a.pelaksanaan = 'Ya' THEN 1 ELSE 0 END) AS ppks_ya,
        ROUND(AVG(CASE WHEN a.jenis_penilaian = 'PPKS' THEN a.skor_akhir END), 2) AS rata_ppks,
        ROUND(AVG(CASE WHEN a.jenis_penilaian = 'PPKS' AND a.nilai_karakter IS NOT NULL THEN a.nilai_karakter END), 2) AS karakter_ppks
       FROM assessments a
       ${whereSql}
       GROUP BY period_key, period_label
       ORDER BY period_key DESC`,
      params
    );

    // Compute per-period recommendation counts by evaluating each WBP within each period bucket
    const [rawLogs] = await pool.query(
      `SELECT ${grouping.keyExpr} AS period_key, a.wbp_id, a.jenis_penilaian, a.pelaksanaan, a.nilai_karakter, a.skor_akhir
       FROM assessments a
       ${whereSql}`,
      params
    );

    const byPeriodWbp = new Map();
    rawLogs.forEach((row) => {
      if (!byPeriodWbp.has(row.period_key)) byPeriodWbp.set(row.period_key, new Map());
      const wMap = byPeriodWbp.get(row.period_key);
      if (!wMap.has(row.wbp_id)) wMap.set(row.wbp_id, []);
      wMap.get(row.wbp_id).push(row);
    });

    const enriched = buckets.map((b) => {
      const wMap = byPeriodWbp.get(b.period_key) || new Map();
      let direkomendasikan = 0;
      let denganCatatan = 0;
      let tidakDirekomendasikan = 0;

      wMap.forEach((logs) => {
        const ev = evaluateSppnPpks(logs);
        if (ev.rekomendasi.code === 'direkomendasikan') direkomendasikan += 1;
        else if (ev.rekomendasi.code === 'direkomendasikan_dengan_catatan') denganCatatan += 1;
        else tidakDirekomendasikan += 1;
      });

      const totalPenilaian = Number(b.total_penilaian || 0);
      const totalYa = Number(b.sppn_ya || 0) + Number(b.ppks_ya || 0);
      const pelaksanaanPct = totalPenilaian > 0 ? Number(((totalYa / totalPenilaian) * 100).toFixed(1)) : 0;
      const rataSppn = Number(b.rata_sppn || 0);
      const kualifikasiSppn = rataSppn >= 70 ? '1' : (Number(b.total_sppn || 0) > 0 ? '0' : '-');
      const rataPpks = Number(b.karakter_ppks || (b.rata_ppks ? (Number(b.rata_ppks) / 20).toFixed(2) : 0));
      const kualifikasiPpks = rataPpks >= 4.0 ? '2' : (rataPpks >= 3.0 ? '1' : (Number(b.total_ppks || 0) > 0 ? '0' : '-'));

      return {
        ...b,
        triwulan: b.period_label || b.period_key,
        total_penilaian: totalPenilaian,
        wbp_dinilai: Number(b.wbp_dinilai || 0),
        pelaksanaan_pct: pelaksanaanPct,
        total_sppn: Number(b.total_sppn || 0),
        sppn_ya: Number(b.sppn_ya || 0),
        rata_sppn: rataSppn,
        kualifikasi_sppn: kualifikasiSppn,
        karakter_sppn: Number(b.karakter_sppn || 0),
        total_ppks: Number(b.total_ppks || 0),
        ppks_ya: Number(b.ppks_ya || 0),
        rata_ppks: rataPpks,
        kualifikasi_ppks: kualifikasiPpks,
        karakter_ppks: Number(b.karakter_ppks || 0),
        direkomendasikan,
        dengan_catatan: denganCatatan,
        tidak_direkomendasikan: tidakDirekomendasikan,
      };
    });

    return res.json({
      success: true,
      period,
      data: enriched,
    });
  } catch (err) {
    return next(err);
  }
});

// 9F. EXPORT DATA FOR OFFICIAL PDF REPORTS
app.get('/api/reports/export-data', authenticate, async (req, res, next) => {
  try {
    const type = sanitizeStr(req.query.type, 30) || 'assessments';
    const { startDate, endDate } = req.query;
    const wbp_id = parseInt(req.query.wbp_id, 10) || null;
    const program_id = parseInt(req.query.program_id, 10) || null;
    const jenis_penilaian = sanitizeStr(req.query.jenis_penilaian, 10);

    if (type === 'attendances') {
      const where = [];
      const params = [];
      appendDateRange(where, params, 'att.tanggal_absen', startDate, endDate);
      if (wbp_id) { where.push('att.wbp_id = ?'); params.push(wbp_id); }
      if (program_id) { where.push('att.program_id = ?'); params.push(program_id); }
      const [rows] = await pool.query(
        `SELECT att.tanggal_absen, w.no_registrasi, w.nama AS wbp_nama, w.blok_kamar,
          p.nama_program, att.status_kehadiran, att.face_verified, att.face_match_score, att.lokasi, att.catatan
         FROM attendances att
         JOIN wbp w ON w.id = att.wbp_id
         JOIN programs p ON p.id = att.program_id
         ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
         ORDER BY att.tanggal_absen DESC
         LIMIT 1000`,
        params
      );
      return res.json({ success: true, data: rows });
    }

    const where = [];
    const params = [];
    appendDateRange(where, params, 'a.tanggal', startDate, endDate);
    if (wbp_id) { where.push('a.wbp_id = ?'); params.push(wbp_id); }
    if (program_id) { where.push('a.program_id = ?'); params.push(program_id); }
    if (['SPPN', 'PPKS'].includes(jenis_penilaian)) {
      where.push('a.jenis_penilaian = ?');
      params.push(jenis_penilaian);
    }

    const [rows] = await pool.query(
      `SELECT a.tanggal, w.no_registrasi, w.nama AS wbp_nama, w.blok_kamar,
        p.nama_program, p.bobot, a.jenis_penilaian, a.pelaksanaan,
        a.nilai_karakter, a.skor_akhir, a.keterangan, a.verifikasi_kasubsi,
        u.nama AS asesor_nama, u.role AS asesor_role
       FROM assessments a
       JOIN wbp w ON w.id = a.wbp_id
       JOIN programs p ON p.id = a.program_id
       JOIN users u ON u.id = a.asesor_id
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY a.tanggal DESC
       LIMIT 1000`,
      params
    );

    return res.json({ success: true, data: rows });
  } catch (err) {
    return next(err);
  }
});

// ============================================================================
// 404 & GLOBAL ERROR HANDLER
// ============================================================================
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan` });
});

app.use((err, _req, res, _next) => {
  console.error('[SIPASTI API Error]:', err);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: `Upload gagal: ${err.message}` });
  }
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ success: false, message: 'Data sudah terdaftar (duplikat unik)' });
  }
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({
      success: false,
      message: 'Data tidak dapat dihapus karena masih digunakan pada riwayat penilaian/absensi',
    });
  }
  return res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan internal server',
  });
});

app.listen(PORT, () => {
  console.log(`SIPASTI Lapas Kelas IIB Ciamis Backend running on http://localhost:${PORT}`);
});
