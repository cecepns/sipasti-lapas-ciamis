import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate, formatDateRangeLabel, formatDateTime, ROLE_LABELS } from './formatters';

let cachedLogoDataUrl = null;

async function getSipastiLogoDataUrl() {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;
  try {
    const res = await fetch('/logo-sipasti.png');
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        cachedLogoDataUrl = reader.result;
        resolve(cachedLogoDataUrl);
      };
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function drawOfficialHeader(doc, title, subtitle) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const logo = await getSipastiLogoDataUrl();

  if (logo) {
    doc.addImage(logo, 'PNG', 14, 10, 22, 22);
  }

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('KEMENTERIAN IMIGRASI DAN PEMASYARAKATAN REPUBLIK INDONESIA', pageWidth / 2 + 6, 14, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(4, 120, 87);
  doc.text('LEMBAGA PEMASYARAKATAN KELAS IIB CIAMIS', pageWidth / 2 + 6, 20, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Jl. Ir. H. Juanda No.146, Ciamis — Telp: 0851-6984-1951 | Email: kontak@sipastilapasciamis.com', pageWidth / 2 + 6, 25.5, { align: 'center' });
  doc.text('SIPASTI (Sistem Informasi Penilaian Aktivitas Spiritual Terintegrasi)', pageWidth / 2 + 6, 30, { align: 'center' });

  // Double institutional divider line
  doc.setDrawColor(4, 120, 87);
  doc.setLineWidth(0.9);
  doc.line(14, 34.5, pageWidth - 14, 34.5);
  doc.setLineWidth(0.3);
  doc.line(14, 36, pageWidth - 14, 36);

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(title.toUpperCase(), pageWidth / 2, 44, { align: 'center' });

  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(subtitle, pageWidth / 2, 49.5, { align: 'center' });
  }

  return subtitle ? 55 : 50;
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
  const leftColX = 24;

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

  // Page numbers
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

export async function exportWbpProfilePdf(detail, dateRange = {}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const periodLabel = formatDateRangeLabel(dateRange.startDate, dateRange.endDate);
  let y = await drawOfficialHeader(
    doc,
    'Rapor Penilaian Pembinaan Spiritual Warga Binaan',
    `Periode Evaluasi: ${periodLabel}`
  );

  const ringkasan = detail.ringkasan || {};
  const predikat = ringkasan.predikat || { label: '-', rekomendasi: '-' };

  // Biodata box
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: [4, 120, 87], textColor: 255, fontStyle: 'bold' },
    head: [['Biodata Warga Binaan Pemasyarakatan (WBP)', '', 'Ringkasan Capaian SIPASTI', '']],
    body: [
      ['Nama Lengkap', detail.nama || '-', 'Skor Total Berbobot', `${ringkasan.skor_total_berbobot ?? 0} / 100`],
      ['No. Registrasi', detail.no_registrasi || '-', 'Predikat Kelayakan', `${predikat.label} (${predikat.rekomendasi})`],
      ['Blok / Kamar', detail.blok_kamar || '-', 'Rata-rata SPPN / PPKS', `SPPN: ${ringkasan.sppn_avg ?? 0} | PPKS: ${ringkasan.ppks_avg ?? 0}`],
      ['Wali PAS', detail.wali_pas_nama || '-', 'Pelaksanaan Kegiatan', `${ringkasan.total_ya ?? 0} dari ${ringkasan.total_penilaian ?? 0} sesi`],
      ['Perkara / Pidana', `${detail.perkara || '-'} (${detail.lama_pidana || '-'})`, 'Absensi Face ID', `${ringkasan.total_face_verified ?? 0} terverifikasi / ${ringkasan.total_absensi ?? 0} total`],
    ],
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 34, fillColor: [248, 250, 252] },
      1: { cellWidth: 56 },
      2: { fontStyle: 'bold', cellWidth: 38, fillColor: [236, 253, 245] },
      3: { cellWidth: 54 },
    },
  });

  y = doc.lastAutoTable.finalY + 8;

  // Program breakdown table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Rekapitulasi Capaian Per Program (Bobot, Target & Nilai Karakter)', 14, y);

  autoTable(doc, {
    startY: y + 3,
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [4, 120, 87], textColor: 255 },
    head: [['Program Pembinaan', 'Kategori', 'Bobot', 'Target', 'Terlaksana', 'Capaian', 'Karakter (1-5)', 'Kontribusi']],
    body: (detail.program_summary || []).map((p) => [
      p.nama_program,
      p.kategori,
      `${p.bobot}%`,
      `${p.target_periode}x`,
      `${p.jumlah_ya}x`,
      `${p.capaian_persen}%`,
      p.rata_karakter || '-',
      `${p.kontribusi_bobot}`,
    ]),
  });

  y = doc.lastAutoTable.finalY + 8;

  // Assessments history
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('2. Riwayat Penilaian SPPN & PPKS Terbaru', 14, y);

  autoTable(doc, {
    startY: y + 3,
    theme: 'striped',
    styles: { fontSize: 7.8, cellPadding: 2.2 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    head: [['Tanggal', 'Program', 'Jenis', 'Asesor', 'Pelaksanaan', 'Karakter', 'Skor', 'Keterangan']],
    body: (detail.assessments || []).slice(0, 25).map((a) => [
      formatDate(a.tanggal, 'dd/MM/yyyy'),
      a.nama_program,
      a.jenis_penilaian,
      a.asesor_nama,
      a.pelaksanaan,
      a.nilai_karakter ?? '-',
      `${a.skor_akhir}`,
      a.keterangan || '-',
    ]),
  });

  drawSignatureFooter(doc, doc.lastAutoTable.finalY);
  const safeName = (detail.nama || 'WBP').replace(/[^a-zA-Z0-9]+/g, '_');
  doc.save(`Rapor_SIPASTI_${safeName}.pdf`);
}

export async function exportAssessmentsPdf(rows, filters = {}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const periodLabel = formatDateRangeLabel(filters.startDate, filters.endDate);
  const jenisLabel = filters.jenis_penilaian ? ` | Instrumen: ${filters.jenis_penilaian}` : '';
  const y = await drawOfficialHeader(
    doc,
    'Laporan Rekapitulasi Penilaian Aktivitas Spiritual (SPPN & PPKS)',
    `Periode: ${periodLabel}${jenisLabel} | Total Data: ${rows.length} catatan`
  );

  autoTable(doc, {
    startY: y,
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 2.4 },
    headStyles: { fillColor: [4, 120, 87], textColor: 255 },
    head: [['No', 'Tanggal', 'Nama WBP', 'No. Reg', 'Program Spiritual', 'Jenis', 'Asesor', 'Pelaksanaan', 'Karakter', 'Skor', 'Verifikasi', 'Keterangan']],
    body: rows.map((r, idx) => [
      idx + 1,
      formatDate(r.tanggal, 'dd/MM/yyyy'),
      r.wbp_nama,
      r.no_registrasi || r.wbp_no_registrasi || '-',
      r.nama_program,
      r.jenis_penilaian,
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
    'Laporan Akumulasi Penilaian & Kelayakan Pembinaan Spiritual WBP',
    `Periode: ${periodLabel} | Total WBP: ${rows.length}`
  );

  autoTable(doc, {
    startY: y,
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 2.4 },
    headStyles: { fillColor: [4, 120, 87], textColor: 255 },
    head: [['No', 'No. Registrasi', 'Nama WBP', 'Blok/Kamar', 'Wali PAS', 'Terlaksana/Target', 'Capaian', 'Karakter', 'SPPN', 'PPKS', 'Skor Total', 'Predikat']],
    body: rows.map((r, idx) => [
      idx + 1,
      r.no_registrasi,
      r.nama,
      r.blok_kamar || '-',
      r.wali_pas_nama || '-',
      `${r.jumlah_ya}/${r.target_total}`,
      `${r.capaian_persen}%`,
      r.rata_karakter || '-',
      r.sppn_avg || '-',
      r.ppks_avg || '-',
      `${r.skor_total}`,
      r.predikat?.label || '-',
    ]),
  });

  drawSignatureFooter(doc, doc.lastAutoTable.finalY);
  doc.save(`Rekap_Akumulasi_WBP_SIPASTI_${formatDate(new Date(), 'yyyyMMdd')}.pdf`);
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
    head: [['No', 'Kode', 'Nama Program', 'Kategori', 'Bobot', 'Target Kolektif', 'Realisasi Ya', 'Tidak', 'Capaian Target', 'Rata Karakter', 'Rata Skor']],
    body: rows.map((r, idx) => [
      idx + 1,
      r.kode_program,
      r.nama_program,
      r.kategori,
      `${r.bobot}%`,
      r.target_kolektif,
      r.jumlah_ya,
      r.jumlah_tidak,
      `${r.capaian_target}%`,
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
