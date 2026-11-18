import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  formatDate,
  formatDateRangeLabel,
  formatDateTime,
  INSTRUMEN_INFO,
  PERIOD_LABELS,
  REKOMENDASI_RULES,
  ROLE_LABELS,
} from './formatters';
import { getAssetUrl } from './api';

const imageCache = new Map();

async function loadImageAsDataUrl(url) {
  if (!url) return null;
  if (imageCache.has(url)) return imageCache.get(url);
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
    if (dataUrl) imageCache.set(url, dataUrl);
    return dataUrl;
  } catch {
    return null;
  }
}

/**
 * Kop Surat Resmi Lapas Kelas IIB Ciamis:
 * - Kiri: Logo Kementerian / Pemasyarakatan (/logo-kementerian.png)
 * - Kanan: Logo SIPASTI (/logo-sipasti.png)
 */
async function drawOfficialHeader(doc, title, subtitle) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const [logoKementerian, logoSipasti] = await Promise.all([
    loadImageAsDataUrl('/logo-kementerian.png'),
    loadImageAsDataUrl('/logo-sipasti.png'),
  ]);

  if (logoKementerian) {
    doc.addImage(logoKementerian, 'PNG', 14, 9, 23, 23);
  }
  if (logoSipasti) {
    doc.addImage(logoSipasti, 'PNG', pageWidth - 37, 9, 23, 23);
  }

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('KEMENTERIAN IMIGRASI DAN PEMASYARAKATAN REPUBLIK INDONESIA', pageWidth / 2, 13.5, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text('DIREKTORAT JENDERAL PEMASYARAKATAN — KANWIL JAWA BARAT', pageWidth / 2, 18, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(4, 120, 87);
  doc.text('LEMBAGA PEMASYARAKATAN KELAS IIB CIAMIS', pageWidth / 2, 23, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Jl. Ir. H. Juanda No.146, Ciamis — Telp: 0851-6984-1951 | Email: kontak@sipastilapasciamis.com', pageWidth / 2, 27.5, { align: 'center' });
  doc.text('SIPASTI (Sistem Informasi Penilaian Aktivitas Spiritual Terintegrasi)', pageWidth / 2, 31.5, { align: 'center' });

  // Double institutional divider line
  doc.setDrawColor(4, 120, 87);
  doc.setLineWidth(1.0);
  doc.line(14, 35, pageWidth - 14, 35);
  doc.setLineWidth(0.35);
  doc.line(14, 36.6, pageWidth - 14, 36.6);

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(15, 23, 42);
  doc.text(title.toUpperCase(), pageWidth / 2, 44, { align: 'center' });

  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(subtitle, pageWidth / 2, 49, { align: 'center' });
  }

  return subtitle ? 54 : 49;
}

function drawSignatureFooter(doc, startY) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = startY + 12;

  if (y + 38 > pageHeight) {
    doc.addPage();
    y = 24;
  }

  const todayLabel = `Ciamis, ${formatDate(new Date(), 'dd MMMM yyyy')}`;
  const rightColX = pageWidth - 78;
  const leftColX = 22;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('Mengetahui,', leftColX, y);
  doc.text(todayLabel, rightColX, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Kepala Lapas Kelas IIB Ciamis', leftColX, y + 5);
  doc.text('Kasi Binadik dan Giatja', rightColX, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.line(leftColX, y + 25, leftColX + 56, y + 25);
  doc.line(rightColX, y + 25, rightColX + 56, y + 25);

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('NIP. .............................................', leftColX, y + 29.5);
  doc.text('NIP. .............................................', rightColX, y + 29.5);

  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Dicetak melalui SIPASTI Lapas Kelas IIB Ciamis — Halaman ${i} dari ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }
}

/**
 * 1. RAPOR PROFIL INDIVIDUAL WBP (Dengan Foto Profil WBP + Pemisahan SPPN Utama & PPKS Pendukung)
 */
export async function exportWbpProfilePdf(detail, dateRange = {}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const periodLabel = formatDateRangeLabel(dateRange.startDate, dateRange.endDate);
  let y = await drawOfficialHeader(
    doc,
    'Profil & Rapor Penilaian Pembinaan Warga Binaan',
    `Periode Evaluasi: ${periodLabel}`
  );

  const ringkasan = detail.ringkasan || {};
  const sppn = ringkasan.sppn || { avgSkor: 0, count: 0, ya: 0, status: 'Belum Dinilai' };
  const ppks = ringkasan.ppks || { avgSkor: 0, count: 0, ya: 0, status: 'Belum Dinilai' };
  const rek = ringkasan.rekomendasi || { label: '-', keterangan: '-', color: 'slate' };

  // WBP Profile Photo box (left: 30mm x 38mm) + Biodata table (right)
  const photoX = 14;
  const photoY = y;
  const photoW = 30;
  const photoH = 38;
  const wbpPhotoUrl = detail.foto_wajah ? getAssetUrl(detail.foto_wajah) : null;
  const wbpPhotoData = wbpPhotoUrl ? await loadImageAsDataUrl(wbpPhotoUrl) : null;

  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(photoX, photoY, photoW, photoH, 2, 2, 'FD');

  if (wbpPhotoData) {
    try {
      const fmt = wbpPhotoData.includes('image/png') ? 'PNG' : 'JPEG';
      doc.addImage(wbpPhotoData, fmt, photoX + 1, photoY + 1, photoW - 2, photoH - 2);
    } catch {
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Foto Profil WBP', photoX + photoW / 2, photoY + photoH / 2, { align: 'center' });
    }
  } else {
    doc.setDrawColor(148, 163, 184);
    doc.circle(photoX + photoW / 2, photoY + 13, 6, 'S');
    doc.roundedRect(photoX + 7, photoY + 21, 16, 9, 3, 3, 'S');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Pas Foto 3x4', photoX + photoW / 2, photoY + 34.5, { align: 'center' });
  }

  autoTable(doc, {
    startY: photoY,
    margin: { left: photoX + photoW + 4, right: 14 },
    theme: 'grid',
    styles: { fontSize: 8.2, cellPadding: 2.1 },
    headStyles: { fillColor: [4, 120, 87], textColor: 255, fontStyle: 'bold' },
    head: [['Biodata Warga Binaan Pemasyarakatan (WBP)', '']],
    body: [
      ['Nama Lengkap', detail.nama || '-'],
      ['No. Registrasi / NIK', `${detail.no_registrasi || '-'} / ${detail.nik || '-'}`],
      ['Blok / Kamar', detail.blok_kamar || '-'],
      ['Perkara / Lama Pidana', `${detail.perkara || '-'} (${detail.lama_pidana || '-'})`],
      ['Wali PAS Pembina', detail.wali_pas_nama || '-'],
      ['Absensi Face ID', `${ringkasan.total_face_verified ?? 0} terverifikasi / ${ringkasan.total_absensi ?? 0} total kehadiran`],
    ],
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40, fillColor: [248, 250, 252] },
    },
  });

  y = Math.max(photoY + photoH + 5, doc.lastAutoTable.finalY + 5);

  // Separated SPPN vs PPKS Decision Banner
  const rekColorMap = {
    emerald: { bg: [236, 253, 245], border: [16, 185, 129], text: [6, 95, 70] },
    amber: { bg: [255, 251, 235], border: [245, 158, 11], text: [146, 64, 14] },
    rose: { bg: [255, 241, 242], border: [225, 29, 72], text: [159, 18, 57] },
    slate: { bg: [248, 250, 252], border: [148, 163, 184], text: [51, 65, 85] },
  };
  const rc = rekColorMap[rek.color] || rekColorMap.slate;

  doc.setFillColor(...rc.bg);
  doc.setDrawColor(...rc.border);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, y, pageWidth - 28, 20, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...rc.text);
  doc.text(`KEPUTUSAN REKOMENDASI KELAYAKAN: ${(rek.label || '-').toUpperCase()}`, 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(51, 65, 85);
  const splitKet = doc.splitTextToSize(rek.keterangan || '-', pageWidth - 36);
  doc.text(splitKet, 18, y + 11.5);

  y += 24;

  // Comparison box: SPPN (Primary) vs PPKS (Supporting) — NOT MERGED!
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: { fontSize: 8.2, cellPadding: 2.5 },
    head: [
      [
        { content: 'PENILAIAN UTAMA: SPPN\n(Sistem Penilaian Pembinaan Narapidana)', styles: { fillColor: [4, 120, 87], textColor: 255 } },
        { content: 'PENILAIAN PENDUKUNG / MONITORING: PPKS\n(Penilaian Pembinaan Kepribadian Spiritual)', styles: { fillColor: [180, 83, 9], textColor: 255 } },
      ],
    ],
    body: [
      [
        `Rata-rata Skor SPPN: ${sppn.avgSkor ?? 0} / 100\nStatus Syarat Utama (>= 70): ${sppn.status}\nPelaksanaan SPPN: ${sppn.ya ?? 0} Ya dari ${sppn.count ?? 0} sesi | Karakter: ${sppn.avgKarakter || '-'}/5`,
        `Rata-rata Skor PPKS: ${ppks.avgSkor ?? 0} / 100\nStatus Monitoring (>= 70): ${ppks.status}\nPelaksanaan PPKS: ${ppks.ya ?? 0} Ya dari ${ppks.count ?? 0} sesi | Karakter: ${ppks.avgKarakter || '-'}/5`,
      ],
    ],
  });

  y = doc.lastAutoTable.finalY + 7;

  // SECTION 1: SPPN ONLY
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(4, 120, 87);
  doc.text('1. RINCIAN PENILAIAN UTAMA — SPPN (Sistem Penilaian Pembinaan Narapidana)', 14, y);

  const sppnRows = detail.sppn_assessments || (detail.assessments || []).filter((a) => a.jenis_penilaian === 'SPPN');
  autoTable(doc, {
    startY: y + 3,
    theme: 'striped',
    styles: { fontSize: 7.8, cellPadding: 2.2 },
    headStyles: { fillColor: [4, 120, 87], textColor: 255 },
    head: [['Tanggal', 'Program Pembinaan', 'Asesor', 'Pelaksanaan', 'Karakter (1-5)', 'Skor SPPN', 'Keterangan']],
    body:
      sppnRows.length > 0
        ? sppnRows.slice(0, 20).map((a) => [
            formatDate(a.tanggal, 'dd/MM/yyyy'),
            a.nama_program,
            a.asesor_nama,
            a.pelaksanaan,
            a.nilai_karakter ?? '-',
            a.skor_akhir,
            a.keterangan || '-',
          ])
        : [['-', 'Belum ada catatan penilaian SPPN pada periode ini', '-', '-', '-', '-', '-']],
  });

  y = doc.lastAutoTable.finalY + 7;

  // SECTION 2: PPKS ONLY
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(180, 83, 9);
  doc.text('2. RINCIAN PENILAIAN PENDUKUNG / MONITORING — PPKS (Penilaian Pembinaan Kepribadian Spiritual)', 14, y);

  const ppksRows = detail.ppks_assessments || (detail.assessments || []).filter((a) => a.jenis_penilaian === 'PPKS');
  autoTable(doc, {
    startY: y + 3,
    theme: 'striped',
    styles: { fontSize: 7.8, cellPadding: 2.2 },
    headStyles: { fillColor: [180, 83, 9], textColor: 255 },
    head: [['Tanggal', 'Program Spiritual', 'Asesor', 'Pelaksanaan', 'Karakter (1-5)', 'Skor PPKS', 'Catatan Monitoring']],
    body:
      ppksRows.length > 0
        ? ppksRows.slice(0, 20).map((a) => [
            formatDate(a.tanggal, 'dd/MM/yyyy'),
            a.nama_program,
            a.asesor_nama,
            a.pelaksanaan,
            a.nilai_karakter ?? '-',
            a.skor_akhir,
            a.keterangan || '-',
          ])
        : [['-', 'Belum ada catatan penilaian PPKS pada periode ini (perlu monitoring)', '-', '-', '-', '-', '-']],
  });

  drawSignatureFooter(doc, doc.lastAutoTable.finalY);
  const safeName = (detail.nama || 'WBP').replace(/[^a-zA-Z0-9]+/g, '_');
  doc.save(`Rapor_Profil_SIPASTI_${safeName}.pdf`);
}

export async function exportAssessmentsPdf(rows, filters = {}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const periodLabel = formatDateRangeLabel(filters.startDate, filters.endDate);
  const jenisLabel = filters.jenis_penilaian
    ? ` | Instrumen: ${filters.jenis_penilaian} (${INSTRUMEN_INFO[filters.jenis_penilaian]?.kepanjangan || ''})`
    : ' | Instrumen: SPPN (Utama) & PPKS (Pendukung Monitoring) — Dipisahkan per Kolom Jenis';
  const y = await drawOfficialHeader(
    doc,
    'Laporan Rekapitulasi Penilaian SPPN & PPKS',
    `Periode: ${periodLabel}${jenisLabel}`
  );

  autoTable(doc, {
    startY: y,
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 2.4 },
    headStyles: { fillColor: [4, 120, 87], textColor: 255 },
    head: [['No', 'Tanggal', 'Nama WBP', 'No. Reg', 'Program Spiritual', 'Instrumen', 'Asesor', 'Pelaksanaan', 'Karakter', 'Skor', 'Kasubsi', 'Keterangan']],
    body: rows.map((r, idx) => [
      idx + 1,
      formatDate(r.tanggal, 'dd/MM/yyyy'),
      r.wbp_nama,
      r.no_registrasi || r.wbp_no_registrasi || '-',
      r.nama_program,
      r.jenis_penilaian === 'SPPN' ? 'SPPN (Utama)' : 'PPKS (Pendukung)',
      r.asesor_nama,
      r.pelaksanaan,
      r.nilai_karakter ?? '-',
      r.skor_akhir,
      r.verifikasi_kasubsi || '-',
      r.keterangan || '-',
    ]),
  });

  drawSignatureFooter(doc, doc.lastAutoTable.finalY);
  doc.save(`Rekap_Penilaian_SIPASTI_${formatDate(new Date(), 'yyyyMMdd')}.pdf`);
}

export async function exportRekapPeriodikPdf(rows, period = 'bulanan', filters = {}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const periodLabel = formatDateRangeLabel(filters.startDate, filters.endDate);
  const pTitle = PERIOD_LABELS[period] || 'Bulanan';
  const y = await drawOfficialHeader(
    doc,
    `Rekapitulasi Penilaian ${pTitle} (SPPN Utama & PPKS Pendukung)`,
    `Rentang Tanggal: ${periodLabel} | Pengelompokan: ${pTitle}`
  );

  autoTable(doc, {
    startY: y,
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [4, 120, 87], textColor: 255 },
    head: [
      [
        'No',
        `Periode (${pTitle})`,
        'WBP Dinilai',
        'Sesi SPPN (Ya/Tot)',
        'Rata SPPN (Utama)',
        'Sesi PPKS (Ya/Tot)',
        'Rata PPKS (Pendukung)',
        'Direkomendasikan',
        'Dgn Catatan',
        'Tidak Direk.',
      ],
    ],
    body: rows.map((r, idx) => [
      idx + 1,
      r.period_label || r.period_key,
      `${r.wbp_dinilai} WBP`,
      `${r.sppn_ya} / ${r.total_sppn}`,
      r.rata_sppn || '-',
      `${r.ppks_ya} / ${r.total_ppks}`,
      r.rata_ppks || '-',
      `${r.direkomendasikan} WBP`,
      `${r.dengan_catatan} WBP`,
      `${r.tidak_direkomendasikan} WBP`,
    ]),
  });

  drawSignatureFooter(doc, doc.lastAutoTable.finalY);
  doc.save(`Rekap_${period}_SIPASTI_${formatDate(new Date(), 'yyyyMMdd')}.pdf`);
}

export async function exportAttendancesPdf(rows, filters = {}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const periodLabel = formatDateRangeLabel(filters.startDate, filters.endDate);
  const y = await drawOfficialHeader(
    doc,
    'Laporan Rekapitulasi Absensi Face ID & Selfie Warga Binaan',
    `Periode: ${periodLabel} | Total Kehadiran: ${rows.length} catatan`
  );

  autoTable(doc, {
    startY: y,
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 2.4 },
    headStyles: { fillColor: [4, 120, 87], textColor: 255 },
    head: [['No', 'Waktu Absen', 'Nama WBP', 'No. Reg', 'Blok/Kamar', 'Program', 'Status', 'Face ID', 'Skor Match', 'Lokasi', 'Catatan']],
    body: rows.map((r, idx) => [
      idx + 1,
      formatDateTime(r.tanggal_absen),
      r.wbp_nama,
      r.no_registrasi || r.wbp_no_registrasi || '-',
      r.blok_kamar || '-',
      r.nama_program,
      r.status_kehadiran,
      r.face_verified ? 'Terverifikasi' : 'Manual/Selfie',
      `${r.face_match_score ?? 0}%`,
      r.lokasi || '-',
      r.catatan || '-',
    ]),
  });

  drawSignatureFooter(doc, doc.lastAutoTable.finalY);
  doc.save(`Rekap_Absensi_FaceID_SIPASTI_${formatDate(new Date(), 'yyyyMMdd')}.pdf`);
}

export async function exportWbpRankingPdf(rows, filters = {}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const periodLabel = formatDateRangeLabel(filters.startDate, filters.endDate);
  const y = await drawOfficialHeader(
    doc,
    'Laporan Evaluasi Kelayakan Warga Binaan (SPPN Utama & PPKS Pendukung)',
    `Periode: ${periodLabel} | Total WBP: ${rows.length} | Penilaian SPPN & PPKS Dipisahkan`
  );

  autoTable(doc, {
    startY: y,
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 2.4 },
    headStyles: { fillColor: [4, 120, 87], textColor: 255 },
    head: [
      [
        'No',
        'No. Registrasi',
        'Nama WBP',
        'Wali PAS',
        'SPPN (Utama)',
        'Status SPPN',
        'PPKS (Pendukung)',
        'Status PPKS',
        'Absen Face ID',
        'Keputusan Rekomendasi',
      ],
    ],
    body: rows.map((r, idx) => [
      idx + 1,
      r.no_registrasi,
      r.nama,
      r.wali_pas_nama || '-',
      `${r.sppn_skor ?? 0} (${r.sppn_count ?? 0}x)`,
      r.sppn_status || '-',
      `${r.ppks_skor ?? 0} (${r.ppks_count ?? 0}x)`,
      r.ppks_status || '-',
      `${r.absensi_face_verified ?? 0}/${r.total_absensi ?? 0}`,
      r.rekomendasi?.label || '-',
    ]),
  });

  drawSignatureFooter(doc, doc.lastAutoTable.finalY);
  doc.save(`Rekap_Evaluasi_WBP_SIPASTI_${formatDate(new Date(), 'yyyyMMdd')}.pdf`);
}

export async function exportProgramSummaryPdf(rows, filters = {}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const periodLabel = formatDateRangeLabel(filters.startDate, filters.endDate);
  const y = await drawOfficialHeader(
    doc,
    'Laporan Capaian Program Pembinaan Spiritual (Bobot, Target & Realisasi)',
    `Periode: ${periodLabel}`
  );

  autoTable(doc, {
    startY: y,
    theme: 'striped',
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: [4, 120, 87], textColor: 255 },
    head: [['No', 'Kode', 'Nama Program', 'Kategori', 'Bobot', 'Target Kolektif', 'Realisasi Ya', 'Tidak', 'Rasio Ya', 'Rata Karakter', 'Rata Skor']],
    body: rows.map((r, idx) => [
      idx + 1,
      r.kode_program,
      r.nama_program,
      r.kategori,
      `${r.bobot}%`,
      r.target_kolektif,
      r.jumlah_ya,
      r.jumlah_tidak,
      `${r.rasio_pelaksanaan}%`,
      r.rata_karakter || '-',
      r.rata_skor || '-',
    ]),
  });

  drawSignatureFooter(doc, doc.lastAutoTable.finalY);
  doc.save(`Rekap_Program_SIPASTI_${formatDate(new Date(), 'yyyyMMdd')}.pdf`);
}

export async function exportAsesorSummaryPdf(rows, filters = {}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const periodLabel = formatDateRangeLabel(filters.startDate, filters.endDate);
  const y = await drawOfficialHeader(
    doc,
    'Laporan Kinerja Asesor Pembinaan Spiritual (Wali PAS & Mitra Keagamaan)',
    `Periode: ${periodLabel}`
  );

  autoTable(doc, {
    startY: y,
    theme: 'striped',
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: [4, 120, 87], textColor: 255 },
    head: [['No', 'Nama Asesor', 'Peran', 'Instansi', 'Total Input', 'SPPN', 'PPKS', 'WBP Dinilai', 'Rasio Ya', 'Rata Karakter', 'Rata Skor']],
    body: rows.map((r, idx) => [
      idx + 1,
      r.nama,
      ROLE_LABELS[r.role] || r.role,
      r.instansi || '-',
      r.total_penilaian,
      r.total_sppn,
      r.total_ppks,
      r.wbp_dinilai,
      `${r.rasio_ya}%`,
      r.rata_karakter || '-',
      r.rata_skor || '-',
    ]),
  });

  drawSignatureFooter(doc, doc.lastAutoTable.finalY);
  doc.save(`Rekap_Asesor_SIPASTI_${formatDate(new Date(), 'yyyyMMdd')}.pdf`);
}

/**
 * BUKU PANDUAN PENGGUNAAN APLIKASI SIPASTI (PDF DOWNLOADABLE)
 */
export async function exportBukuPanduanPdf() {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = await drawOfficialHeader(
    doc,
    'Buku Panduan Penggunaan Aplikasi SI PASTI',
    'Manual Resmi Petugas, Wali PAS, Mitra Keagamaan, Kasubsi, Kasi Binadik & Ka. Lapas'
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(4, 120, 87);
  doc.text('1. Pengertian Instrumen Penilaian (SPPN & PPKS)', 14, y);

  autoTable(doc, {
    startY: y + 3,
    theme: 'grid',
    styles: { fontSize: 8.2, cellPadding: 2.5 },
    headStyles: { fillColor: [4, 120, 87], textColor: 255 },
    head: [['Singkatan', 'Kepanjangan Resmi', 'Fungsi & Peran dalam SIPASTI']],
    body: [
      [
        INSTRUMEN_INFO.SPPN.singkatan,
        INSTRUMEN_INFO.SPPN.kepanjangan,
        `${INSTRUMEN_INFO.SPPN.peran}. ${INSTRUMEN_INFO.SPPN.deskripsi}`,
      ],
      [
        INSTRUMEN_INFO.PPKS.singkatan,
        INSTRUMEN_INFO.PPKS.kepanjangan,
        `${INSTRUMEN_INFO.PPKS.peran}. ${INSTRUMEN_INFO.PPKS.deskripsi}`,
      ],
    ],
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 20 }, 1: { fontStyle: 'bold', cellWidth: 50 } },
  });

  y = doc.lastAutoTable.finalY + 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(4, 120, 87);
  doc.text('2. Matriks Keputusan Rekomendasi Kelayakan WBP (SPPN & PPKS Tidak Digabung)', 14, y);

  autoTable(doc, {
    startY: y + 3,
    theme: 'grid',
    styles: { fontSize: 8.2, cellPadding: 2.5 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    head: [['Status Rekomendasi', 'Kondisi SPPN & PPKS', 'Tindak Lanjut Pembinaan']],
    body: REKOMENDASI_RULES.map((r) => [r.label, r.syarat, r.arti]),
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 44 } },
  });

  y = doc.lastAutoTable.finalY + 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(4, 120, 87);
  doc.text('3. Alur Penggunaan Berdasarkan Peran (Role)', 14, y);

  autoTable(doc, {
    startY: y + 3,
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 2.4 },
    headStyles: { fillColor: [4, 120, 87], textColor: 255 },
    head: [['Peran / Aktor', 'Hak Akses & Tugas Utama di Aplikasi SIPASTI']],
    body: [
      ['Admin SIPASTI', 'Mengelola Data WBP (SDP) & Enroll Face ID, Data Wali PAS, Data Program, menyetujui Registrasi Mitra, input/edit penilaian & cetak seluruh laporan PDF.'],
      ['Wali PAS', 'Mendaftarkan Face ID WBP binaannya, mencatat Absensi Face ID, menginput Nilai SPPN (Utama) & Nilai PPKS (Pendukung) secara terpisah, serta memantau profil WBP.'],
      ['Mitra Keagamaan', 'Mendaftar via halaman Registrasi Mitra, lalu setelah disetujui Admin dapat menginput Nilai SPPN & PPKS kegiatan pembinaan spiritual.'],
      ['Kasubsi Reg & Bimkemas', 'Memonitor & memverifikasi respon data penilaian SPPN/PPKS (Terverifikasi / Perlu Revisi) serta mengunduh rekap periodik (Harian, Mingguan, Bulanan, Triwulan).'],
      ['Kasi Binadik & Ka. Lapas', 'Memantau Dasbor Umum, Dasbor & Profil WBP, Dasbor Program, Dasbor Asesor, Rekap Periodik, serta mengunduh Rapor Profil WBP PDF lengkap dengan Pas Foto.'],
    ],
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 42 } },
  });

  y = doc.lastAutoTable.finalY + 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(4, 120, 87);
  doc.text('4. Panduan Absensi Face ID & Rekap Periodik', 14, y);

  autoTable(doc, {
    startY: y + 3,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.4 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255 },
    head: [['Fitur', 'Langkah Operasional']],
    body: [
      ['Enroll Face ID WBP', 'Buka menu Data WBP (SDP) -> klik ikon Face ID pada baris WBP -> posisikan wajah di bingkai oval -> klik "Pindai & Simpan Wajah". Foto otomatis menjadi Pas Foto Profil WBP di Rapor PDF.'],
      ['Absensi Selfie Face ID', 'Buka Kiosk Absensi (/absensi-kiosk) atau menu Absensi Face ID -> pilih WBP & Program -> scan wajah di kamera -> sistem mencocokkan biometrik & menyimpan foto selfie.'],
      ['Rekap Periodik & PDF', 'Buka menu Rekap Periodik -> pilih tab Harian, Mingguan, Bulanan, atau Per 3 Bulan (Triwulan) -> gunakan filter rentang tanggal -> klik Export PDF untuk cetak resmi berkop Kementerian & SIPASTI.'],
    ],
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 42 } },
  });

  drawSignatureFooter(doc, doc.lastAutoTable.finalY);
  doc.save(`Buku_Panduan_SIPASTI_Lapas_Ciamis.pdf`);
}
