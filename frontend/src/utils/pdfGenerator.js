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
 * Kop Surat Resmi Lapas Kelas IIB Ciamis Sesuai Standar IMIPAS (REV0015):
 * - Kiri Atas: Logo Kementerian Imigrasi & Pemasyarakatan (Lingkaran)
 * - Teks Kop: Kemenimpas (Bold), Ditjen & Kanwil (Normal/Tidak Bold), Lapas Ciamis (Bold), Alamat (Normal) — Semua Warna HITAM PEKAT
 * - Pembatas: Garis ganda pembatas Kop (Hitam)
 * - Di Bawah Garis: Logo SIPASTI + Header SIPASTI + Judul Dokumen Laporan
 */
async function drawOfficialHeader(doc, title, subtitle) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const [logoImipas, logoSipasti] = await Promise.all([
    loadImageAsDataUrl('/logo-kemenas.png'),
    loadImageAsDataUrl('/logo-sipasti.png'),
  ]);

  // 1. Logo Kementerian Imigrasi & Pemasyarakatan (IMIPAS) Lingkaran di Kiri Atas Kop
  if (logoImipas) {
    doc.addImage(logoImipas, 'PNG', 14, 7.5, 23, 23);
  }

  // 2. Teks Kop Surat Resmi Lembaga Pemasyarakatan Kelas IIB Ciamis (Warna Hitam Semua Sesuai Standar)
  const centerX = (pageWidth + 24) / 2;
  doc.setTextColor(0, 0, 0);

  // Baris 1: KEMENTERIAN IMIGRASI DAN PEMASYARAKATAN (Bold, 9.5pt, Hitam)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('KEMENTERIAN IMIGRASI DAN PEMASYARAKATAN REPUBLIK INDONESIA', centerX, 10.5, { align: 'center' });

  // Baris 2 & 3: DIREKTORAT JENDERAL & KANWIL (Tidak Di-bold, Standar Dinas, 8.5pt, Hitam)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('DIREKTORAT JENDERAL PEMASYARAKATAN', centerX, 14.5, { align: 'center' });
  doc.text('KANTOR WILAYAH JAWA BARAT', centerX, 18.2, { align: 'center' });

  // Baris 4: LEMBAGA PEMASYARAKATAN KELAS IIB CIAMIS (Bold, 11pt, Hitam Pekat)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('LEMBAGA PEMASYARAKATAN KELAS IIB CIAMIS', centerX, 22.8, { align: 'center' });

  // Baris 5 & 6: Alamat, Telepon/Faksimile (Tidak Di-bold, Hitam Pekat)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Jalan Ir. H. Juanda No. 146, Kab. Ciamis, Ciamis', centerX, 26.8, { align: 'center' });
  doc.text('Telepon : 0265-771013, Faksimile : 0265-771013', centerX, 30.2, { align: 'center' });

  // 3. Garis Pembatas Kop Baku (Double Line Hitam Standar)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  doc.line(14, 33.2, pageWidth - 14, 33.2);
  doc.setLineWidth(0.25);
  doc.line(14, 34.3, pageWidth - 14, 34.3);

  // 4. Di Bawah Garis: Logo SIPASTI + Header SIPASTI + Judul Dokumen (Sesuai Permintaan)
  if (logoSipasti) {
    doc.addImage(logoSipasti, 'PNG', 14, 37.0, 13.5, 13.5);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(4, 120, 87);
  doc.text('SIPASTI (SISTEM INFORMASI PENILAIAN AKTIVITAS SPIRITUAL TERINTEGRASI)', 31, 41.0);

  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(title.toUpperCase(), 31, 46.0);

  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(subtitle, 31, 50.5);
  }

  return subtitle ? 55 : 51;
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
  const sppn = ringkasan.sppn || {
    avgSkor: detail.sppn?.nilai ?? 0,
    count: detail.sppn?.count ?? 0,
    ya: detail.sppn?.ya ?? 0,
    status: detail.sppn?.predikat || (detail.sppn?.nilai >= 70 ? 'Memenuhi Syarat' : 'Belum Memenuhi'),
    avgKarakter: detail.sppn?.avgKarakter || '-',
  };
  const ppks = ringkasan.ppks || {
    avgSkor: detail.ppks?.nilai ?? 0,
    count: detail.ppks?.count ?? 0,
    ya: detail.ppks?.ya ?? 0,
    status: detail.ppks?.predikat || (detail.ppks?.nilai >= 4.0 ? 'Baik' : 'Cukup'),
    avgKarakter: detail.ppks?.nilai ? `${detail.ppks.nilai}/5` : '-',
  };
  const rek = ringkasan.rekomendasi || (detail.kualifikasi ? {
    label: detail.kualifikasi.predikat_label || (detail.kualifikasi.kualifikasi_akhir === 2 ? 'Memenuhi Syarat & Direkomendasikan' : detail.kualifikasi.kualifikasi_akhir === 1 ? 'Direkomendasikan dengan Pertimbangan' : 'Tidak Memenuhi Syarat'),
    keterangan: detail.kualifikasi.deskripsi || '-',
    color: detail.kualifikasi.kualifikasi_akhir === 2 ? 'emerald' : detail.kualifikasi.kualifikasi_akhir === 1 ? 'amber' : 'rose',
  } : { label: '-', keterangan: '-', color: 'slate' });

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
    head: [['Biodata Warga Binaan', '']],
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
    : ' | Instrumen: SPPN (Utama) & PPKS (Pendukung Monitoring)';
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

export async function exportRekapPeriodikPdf(rows, period = 'triwulan', filters = {}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const periodLabel = formatDateRangeLabel(filters.startDate, filters.endDate);
  const y = await drawOfficialHeader(
    doc,
    'Laporan Rekapitulasi Penilaian Triwulan (SPPN & PPKS)',
    `Rentang Tanggal: ${periodLabel}`
  );

  autoTable(doc, {
    startY: y,
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [4, 120, 87], textColor: 255 },
    head: [
      [
        'No',
        'Triwulan',
        'Jumlah WBP',
        'x̄ % Pelaksanaan',
        'x̄ Nilai SPPN',
        'x̄ Kualifikasi SPPN',
        'x̄ Nilai PPKS',
        'x̄ Kualifikasi PPKS',
      ],
    ],
    body: rows.map((r, idx) => [
      idx + 1,
      r.triwulan || r.period_label || r.period_key,
      `${r.wbp_dinilai} WBP`,
      `${r.pelaksanaan_pct ?? (r.total_penilaian > 0 ? Math.round(((r.sppn_ya + r.ppks_ya) / r.total_penilaian) * 100) : 0)}%`,
      r.rata_sppn || '-',
      r.kualifikasi_sppn || (r.rata_sppn >= 70 ? '1' : '0'),
      r.rata_ppks || '-',
      r.kualifikasi_ppks || (r.rata_ppks >= 4.0 ? '2' : r.rata_ppks >= 3.0 ? '1' : '0'),
    ]),
  });

  drawSignatureFooter(doc, doc.lastAutoTable.finalY);
  doc.save(`Rekap_Penilaian_Triwulan_SIPASTI_${formatDate(new Date(), 'yyyyMMdd')}.pdf`);
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
    'Laporan Evaluasi Kelayakan Warga Binaan (SPPN & PPKS)',
    `Periode: ${periodLabel} | Total WBP: ${rows.length}`
  );

  autoTable(doc, {
    startY: y,
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 2.4 },
    headStyles: { fillColor: [4, 120, 87], textColor: 255 },
    head: [
      [
        'No',
        'Warga Binaan',
        'No. Reg',
        'Wali PAS',
        'Mitra',
        '% Pelaksanaan',
        'SPPN (Utama)',
        'PPKS (Skala 1-5)',
        'Kualifikasi Akhir',
        'Face ID',
      ],
    ],
    body: rows.map((r, idx) => [
      idx + 1,
      r.nama,
      r.no_registrasi,
      r.wali_pas_nama || '-',
      r.mitra_nama || '-',
      `${r.pelaksanaan_pct ?? (r.total_penilaian > 0 ? Math.round(((r.jumlah_ya || 0) / r.total_penilaian) * 100) : 0)}%`,
      `${r.sppn_skor ?? 0} (Kualifikasi ${r.sppn_kualifikasi ?? (r.sppn_skor >= 70 ? '1' : '0')})`,
      `${r.ppks_skor ?? 0} (Kualifikasi ${r.ppks_kualifikasi ?? (r.ppks_skor >= 4.0 ? '2' : r.ppks_skor >= 3.0 ? '1' : '0')})`,
      r.rekomendasi?.label || (r.kualifikasi_akhir === 2 ? 'Direkomendasikan' : r.kualifikasi_akhir === 1 ? 'Direkomendasikan dengan Pertimbangan' : 'Tidak Memenuhi Syarat'),
      `${r.absensi_face_verified ?? 0}/${r.total_absensi ?? 0}`,
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
    'Laporan Capaian Program Pembinaan Spiritual',
    `Periode: ${periodLabel}`
  );

  autoTable(doc, {
    startY: y,
    theme: 'striped',
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: [4, 120, 87], textColor: 255 },
    head: [
      [
        'No',
        'Program Pembinaan',
        'Kategori',
        'Bobot',
        'Target',
        'x̄ % Pelaksanaan',
        'x̄ Nilai SPPN',
        'x̄ Kualifikasi SPPN',
        'x̄ Nilai PPKS',
        'x̄ Kualifikasi PPKS',
      ],
    ],
    body: rows.map((r, idx) => [
      idx + 1,
      r.nama_program,
      r.kategori,
      `${r.bobot}%`,
      `${r.target || r.target_bulanan || 0} sesi`,
      `${r.pelaksanaan_pct ?? r.rasio_pelaksanaan ?? 0}%`,
      r.rata_sppn ?? '-',
      r.kualifikasi_sppn ?? (r.rata_sppn >= 70 ? '1' : '0'),
      r.rata_ppks ?? '-',
      r.kualifikasi_ppks ?? (r.rata_ppks >= 4.0 ? '2' : r.rata_ppks >= 3.0 ? '1' : '0'),
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
    'Laporan Kinerja Asesor Pembinaan Spiritual (Wali PAS & Mitra)',
    `Periode: ${periodLabel}`
  );

  autoTable(doc, {
    startY: y,
    theme: 'striped',
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: [4, 120, 87], textColor: 255 },
    head: [
      [
        'No',
        'Nama Asesor',
        'Peran',
        'Instansi',
        'Jumlah WBP Dibina',
        'x̄ % Pelaksanaan',
        'x̄ Kualifikasi SPPN',
        'x̄ Kualifikasi PPKS',
      ],
    ],
    body: rows.map((r, idx) => [
      idx + 1,
      r.nama,
      ROLE_LABELS[r.role] || r.role,
      r.instansi || '-',
      `${r.total_wbp_dibina ?? (r.role === 'wali_pas' ? r.total_wbp_binaan : r.wbp_dinilai) ?? 0} WBP`,
      `${r.pelaksanaan_pct ?? r.rasio_ya ?? 0}%`,
      r.kualifikasi_sppn ?? (r.rata_skor >= 70 ? '1' : '0'),
      r.kualifikasi_ppks ?? (r.rata_karakter >= 4.0 ? '2' : r.rata_karakter >= 3.0 ? '1' : '0'),
    ]),
  });

  drawSignatureFooter(doc, doc.lastAutoTable.finalY);
  doc.save(`Rekap_Asesor_SIPASTI_${formatDate(new Date(), 'yyyyMMdd')}.pdf`);
}

/**
 * BUKU PANDUAN PENGGUNAAN APLIKASI SIPASTI (PDF DOWNLOADABLE)
 * Mengunduh dokumen resmi Buku Panduan Penggunaan Sistem SI PASTI
 */
export async function exportBukuPanduanPdf() {
  const link = document.createElement('a');
  link.href = '/buku-panduan-sipasti.pdf';
  link.download = 'BUKU_PANDUAN_PENGGUNAAN_SISTEM.pdf';
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
