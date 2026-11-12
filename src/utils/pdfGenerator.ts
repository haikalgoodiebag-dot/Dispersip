import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AgendaKegiatan, SuratMasuk, SystemSettings, User } from '../types';

export interface GeneratePdfOptions {
  agendaList: AgendaKegiatan[];
  suratList: SuratMasuk[];
  settings: SystemSettings;
  currentUser: User;
  jenisCetak: 'daftar' | 'detail' | 'rekap' | 'per_pegawai';
  rentangLabel: string;
  startDateStr?: string;
  endDateStr?: string;
  withSignature?: boolean;
  withSummary?: boolean;
  singleAgenda?: AgendaKegiatan;
  filterPegawaiNama?: string;
}

export function generateAgendaPdf(options: GeneratePdfOptions): jsPDF {
  const {
    agendaList,
    suratList,
    settings,
    currentUser,
    jenisCetak,
    rentangLabel,
    startDateStr,
    endDateStr,
    withSignature = true,
    withSummary = true,
    singleAgenda,
    filterPegawaiNama,
  } = options;

  const isDetail = jenisCetak === 'detail';
  const orientation = isDetail ? 'portrait' : 'landscape';

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Draw Kop Dinas Pemkot Banjarmasin
  const drawKopDinas = (startY = 10) => {
    // Emblem Box
    doc.setFillColor(37, 99, 235); // Royal Blue
    doc.roundedRect(14, startY, 14, 14, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('KB', 21, startY + 9, { align: 'center' });

    // Official Header Text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(settings.instansiNama || 'PEMERINTAH KOTA BANJARMASIN', pageWidth / 2, startY + 3, { align: 'center' });

    doc.setFontSize(13);
    doc.setTextColor(37, 99, 235);
    doc.text(settings.instansiSub || 'DINAS PERPUSTAKAAN DAN KEARSIPAN', pageWidth / 2, startY + 9, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(settings.instansiAlamat || 'Jl. Kapten Piere Tendean No. 1, Kel. Gadang, Kec. Banjarmasin Tengah, Kota Banjarmasin', pageWidth / 2, startY + 14, { align: 'center' });
    doc.text(settings.instansiKontak || 'Pos-el: dispersip@banjarmasinkota.go.id | WITA (Asia/Makassar)', pageWidth / 2, startY + 18, { align: 'center' });

    // Dividing lines
    const lineY = startY + 22;
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.8);
    doc.line(14, lineY, pageWidth - 14, lineY);
    doc.setLineWidth(0.2);
    doc.line(14, lineY + 1.2, pageWidth - 14, lineY + 1.2);

    return lineY + 5;
  };

  let currentY = drawKopDinas(10);

  // Document Title & Metadata
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  let titleText = 'AGENDA KEGIATAN KEDINASAN';
  if (isDetail) titleText = 'LEMBAR PENUGASAN DAN DISPOSISI KEGIATAN';
  else if (jenisCetak === 'rekap') titleText = 'REKAPITULASI AGENDA & DISPOSISI KEGIATAN';
  else if (jenisCetak === 'per_pegawai') titleText = `AGENDA PENUGASAN: ${filterPegawaiNama || 'PEGAWAI'}`;

  doc.text(titleText, pageWidth / 2, currentY + 3, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const periodeText = startDateStr && endDateStr
    ? `Rentang Waktu: ${rentangLabel} (${startDateStr} s.d. ${endDateStr})`
    : `Filter Rentang: ${rentangLabel}`;
  doc.text(periodeText, pageWidth / 2, currentY + 8, { align: 'center' });

  const nowPrintStr = new Date().toLocaleString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) + ' WITA';

  doc.setFontSize(7.5);
  doc.text(
    `Dicetak pada: ${nowPrintStr} | Operator: ${currentUser.nama} (${currentUser.peran})`,
    pageWidth / 2,
    currentY + 12,
    { align: 'center' }
  );

  currentY += 16;

  // Render Single Agenda Detail View
  if (isDetail && singleAgenda) {
    // Summary box
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, currentY, pageWidth - 28, 48, 2, 2, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, currentY, pageWidth - 28, 48, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('I. DATA SURAT & KEGIATAN', 18, currentY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Nomor Agenda', 18, currentY + 12);
    doc.text(`: ${singleAgenda.nomorAgenda}`, 55, currentY + 12);

    doc.text('Nomor Surat', 18, currentY + 17);
    doc.text(`: ${singleAgenda.nomorSurat}`, 55, currentY + 17);

    doc.text('Pengirim / Asal', 18, currentY + 22);
    doc.text(`: ${singleAgenda.pengirim || singleAgenda.asalInstansi}`, 55, currentY + 22);

    doc.text('Perihal Kegiatan', 18, currentY + 27);
    const splitPerihal = doc.splitTextToSize(`: ${singleAgenda.perihal}`, pageWidth - 78);
    doc.text(splitPerihal, 55, currentY + 27);

    doc.text('Waktu / Jadwal', 18, currentY + 36);
    doc.text(`: ${singleAgenda.tanggalTampilan} | ${singleAgenda.jam}`, 55, currentY + 36);

    doc.text('Tempat', 18, currentY + 41);
    doc.text(`: ${singleAgenda.tempat}`, 55, currentY + 41);

    currentY += 52;

    // Disposisi Pimpinan Box
    doc.setFillColor(254, 243, 199); // amber soft
    doc.roundedRect(14, currentY, pageWidth - 28, 38, 2, 2, 'F');
    doc.setDrawColor(245, 158, 11);
    doc.roundedRect(14, currentY, pageWidth - 28, 38, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(180, 83, 9);
    doc.text('II. PETUNJUK DISPOSISI PIMPINAN', 18, currentY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('Pemberi Disposisi', 18, currentY + 12);
    doc.text(`: ${singleAgenda.pimpinanNama || 'Kepala Dinas'}`, 55, currentY + 12);

    doc.text('Instruksi Arahan', 18, currentY + 17);
    const splitInstruksi = doc.splitTextToSize(`: ${singleAgenda.instruksiPimpinan || '-'}`, pageWidth - 78);
    doc.text(splitInstruksi, 55, currentY + 17);

    doc.text('Batas Waktu', 18, currentY + 27);
    doc.text(`: ${singleAgenda.batasWaktu || '-'}`, 55, currentY + 27);

    doc.text('Status Kegiatan', 18, currentY + 32);
    doc.text(`: ${singleAgenda.isDibatalkan ? 'DIBATALKAN' : 'TERDISPOSISI (AGENDA RESMI)'}`, 55, currentY + 32);

    currentY += 44;

    // Pegawai Ditugaskan Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('III. DAFTAR PEGAWAI YANG DITUGASKAN', 14, currentY);
    currentY += 3;

    const assignedRows = singleAgenda.pegawaiDitugaskan.map((pt, idx) => [
      (idx + 1).toString(),
      pt.nama,
      pt.email,
      pt.emailStatus,
      pt.telegramStatus || 'Terkirim',
      pt.isConfirmed ? `Dikonfirmasi (${pt.confirmedAt || 'Sudah'})` : 'Belum Konfirmasi',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Nama Pegawai', 'Email Pegawai', 'Email', 'Telegram', 'Status Konfirmasi']],
      body: assignedRows.length > 0 ? assignedRows : [['-', 'Belum ada pegawai ditunjuk', '-', '-', '-', '-']],
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: [15, 23, 42] },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  } else {
    // Tabular View for Daftar & Rekap Agenda
    if (withSummary) {
      const totalKegiatan = agendaList.length;
      const totalKonfirmasi = agendaList.filter((a) =>
        a.pegawaiDitugaskan.some((p) => p.isConfirmed)
      ).length;
      const totalMenungguKonfirmasi = totalKegiatan - totalKonfirmasi;

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, currentY, pageWidth - 28, 10, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text('REKAPITULASI:', 18, currentY + 6.5);

      doc.setFont('helvetica', 'normal');
      doc.text(
        `Total: ${totalKegiatan} Agenda Kegiatan  |  Dikonfirmasi Pegawai: ${totalKonfirmasi}  |  Menunggu Konfirmasi: ${totalMenungguKonfirmasi}`,
        48,
        currentY + 6.5
      );

      currentY += 14;
    }

    if (agendaList.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text('Tidak ada data agenda kegiatan pada rentang filter yang dipilih.', pageWidth / 2, currentY + 20, {
        align: 'center',
      });
      currentY += 35;
    } else {
      const tableData = agendaList.map((agenda, index) => {
        const pegawaiStr = agenda.pegawaiDitugaskan
          .map((p) => `${p.nama} [${p.isConfirmed ? 'Dikonfirmasi' : 'Belum Konfirmasi'}]`)
          .join('\n');

        return [
          (index + 1).toString(),
          agenda.nomorAgenda,
          agenda.tanggalTampilan,
          agenda.jam,
          agenda.perihal,
          agenda.tempat,
          agenda.pengirim || agenda.asalInstansi,
          agenda.nomorSurat,
          pegawaiStr || '-',
          agenda.instruksiPimpinan || '-',
          agenda.isDibatalkan ? 'Dibatalkan' : 'Terdisposisi',
        ];
      });

      autoTable(doc, {
        startY: currentY,
        head: [
          [
            'No',
            'No. Agenda',
            'Tanggal',
            'Waktu (WITA)',
            'Kegiatan / Perihal',
            'Tempat',
            'Pengirim Surat',
            'Nomor Surat',
            'Pegawai Ditugaskan',
            'Instruksi Disposisi',
            'Status',
          ],
        ],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontSize: 7,
          fontStyle: 'bold',
          halign: 'center',
        },
        bodyStyles: {
          fontSize: 6.8,
          textColor: [15, 23, 42],
          cellPadding: 2,
        },
        columnStyles: {
          0: { cellWidth: 7, halign: 'center' },
          1: { cellWidth: 18 },
          2: { cellWidth: 22 },
          3: { cellWidth: 16 },
          4: { cellWidth: 44 },
          5: { cellWidth: 26 },
          6: { cellWidth: 30 },
          7: { cellWidth: 28 },
          8: { cellWidth: 36 },
          9: { cellWidth: 30 },
          10: { cellWidth: 15, halign: 'center' },
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        margin: { left: 14, right: 14 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;
    }
  }

  // Signature Block
  if (withSignature) {
    if (currentY + 38 > pageHeight - 15) {
      doc.addPage();
      currentY = 20;
    }

    const sigX = pageWidth - 80;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Banjarmasin, ' + new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), sigX, currentY);
    doc.text('Kepala Dinas Perpustakaan dan Kearsipan', sigX, currentY + 5);
    doc.text('Kota Banjarmasin,', sigX, currentY + 9);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(settings.pimpinanNama || 'Dr. Hj. Nurul Fadhilah, S.Sos, M.AP', sigX, currentY + 28);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`NIP. ${settings.pimpinanNip || '19710815 199703 2 004'}`, sigX, currentY + 33);
  }

  // Footer on all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);

    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 8, pageWidth - 14, pageHeight - 8);

    doc.text(
      'Dispersip Kota Banjarmasin - Sistem Agenda Kegiatan Kedinasan v1.0',
      14,
      pageHeight - 5
    );
    doc.text('Dokumen resmi kedinasan Pemerintah Kota Banjarmasin', pageWidth / 2, pageHeight - 5, { align: 'center' });
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - 14, pageHeight - 5, { align: 'right' });
  }

  return doc;
}
