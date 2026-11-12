import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Printer,
  Download,
  Eye,
  Calendar,
  Filter,
  CheckCircle2,
  FileText,
  AlertCircle,
  Building,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateAgendaPdf } from '../utils/pdfGenerator';
import { AgendaKegiatan, User } from '../types';

interface CetakAgendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAgendaId?: string;
}

type RentangWaktu =
  | 'hari_ini'
  | 'besok'
  | 'minggu_ini'
  | 'minggu_depan'
  | 'bulan_ini'
  | 'bulan_depan'
  | 'triwulan'
  | 'tahun_ini'
  | 'kustom';

export const CetakAgendaModal: React.FC<CetakAgendaModalProps> = ({
  isOpen,
  onClose,
  selectedAgendaId,
}) => {
  const { agendaList, suratList, settings, currentUser, users } = useApp();

  const [jenisCetak, setJenisCetak] = useState<'daftar' | 'detail' | 'rekap' | 'per_pegawai'>(
    selectedAgendaId ? 'detail' : 'daftar'
  );
  const [rentang, setRentang] = useState<RentangWaktu>('bulan_ini');
  const [customStart, setCustomStart] = useState<string>('2026-11-01');
  const [customEnd, setCustomEnd] = useState<string>('2026-11-30');
  const [statusFilter, setStatusFilter] = useState<'semua' | 'terdisposisi' | 'dibatalkan'>('semua');
  const [pegawaiFilter, setPegawaiFilter] = useState<string>('semua');
  const [konfirmasiFilter, setKonfirmasiFilter] = useState<'semua' | 'sudah' | 'belum'>('semua');
  const [withSignature, setWithSignature] = useState(true);
  const [withSummary, setWithSummary] = useState(true);

  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If selectedAgendaId passed, set to detail
  useEffect(() => {
    if (selectedAgendaId) {
      setJenisCetak('detail');
    }
  }, [selectedAgendaId]);

  // Clean up object URL on unmount or change
  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, [pdfPreviewUrl]);

  if (!isOpen || !currentUser) return null;

  // Base list filtered by role permissions
  const roleFilteredList = useMemo(() => {
    if (currentUser.peran === 'Pegawai') {
      return agendaList.filter((a) =>
        a.pegawaiDitugaskan.some((p) => p.pegawaiId === currentUser.id)
      );
    }
    return agendaList;
  }, [agendaList, currentUser]);

  // Date range calculation
  const { startDate, endDate, rentangLabel } = useMemo(() => {
    // Current reference date (November 2026 in the context)
    const baseDate = new Date();
    const y = baseDate.getFullYear();
    const m = baseDate.getMonth();
    const d = baseDate.getDate();

    const formatDateStr = (date: Date) => {
      const yy = date.getFullYear();
      const mm = (date.getMonth() + 1).toString().padStart(2, '0');
      const dd = date.getDate().toString().padStart(2, '0');
      return `${yy}-${mm}-${dd}`;
    };

    switch (rentang) {
      case 'hari_ini': {
        const str = formatDateStr(baseDate);
        return { startDate: str, endDate: str, rentangLabel: 'Hari Ini' };
      }
      case 'besok': {
        const tomorrow = new Date(baseDate);
        tomorrow.setDate(d + 1);
        const str = formatDateStr(tomorrow);
        return { startDate: str, endDate: str, rentangLabel: 'Besok' };
      }
      case 'minggu_ini': {
        const curr = new Date(baseDate);
        const first = curr.getDate() - curr.getDay() + 1; // Monday
        const monday = new Date(curr.setDate(first));
        const sunday = new Date(curr.setDate(first + 6));
        return {
          startDate: formatDateStr(monday),
          endDate: formatDateStr(sunday),
          rentangLabel: 'Minggu Ini',
        };
      }
      case 'minggu_depan': {
        const curr = new Date(baseDate);
        const first = curr.getDate() - curr.getDay() + 8; // Next Monday
        const nextMon = new Date(curr.setDate(first));
        const nextSun = new Date(curr.setDate(first + 6));
        return {
          startDate: formatDateStr(nextMon),
          endDate: formatDateStr(nextSun),
          rentangLabel: 'Minggu Depan',
        };
      }
      case 'bulan_ini': {
        const firstDay = new Date(y, m, 1);
        const lastDay = new Date(y, m + 1, 0);
        return {
          startDate: formatDateStr(firstDay),
          endDate: formatDateStr(lastDay),
          rentangLabel: 'Bulan Ini',
        };
      }
      case 'bulan_depan': {
        const firstDay = new Date(y, m + 1, 1);
        const lastDay = new Date(y, m + 2, 0);
        return {
          startDate: formatDateStr(firstDay),
          endDate: formatDateStr(lastDay),
          rentangLabel: 'Bulan Depan',
        };
      }
      case 'triwulan': {
        const qStartMonth = Math.floor(m / 3) * 3;
        const firstDay = new Date(y, qStartMonth, 1);
        const lastDay = new Date(y, qStartMonth + 3, 0);
        return {
          startDate: formatDateStr(firstDay),
          endDate: formatDateStr(lastDay),
          rentangLabel: 'Triwulan Berjalan',
        };
      }
      case 'tahun_ini': {
        return {
          startDate: `${y}-01-01`,
          endDate: `${y}-12-31`,
          rentangLabel: `Tahun ${y}`,
        };
      }
      case 'kustom':
      default: {
        return {
          startDate: customStart,
          endDate: customEnd,
          rentangLabel: 'Rentang Kustom',
        };
      }
    }
  }, [rentang, customStart, customEnd]);

  // Validation: End date must not be before start date
  const isDateInvalid = rentang === 'kustom' && customEnd < customStart;

  // Filter agenda items
  const filteredAgendaList = useMemo(() => {
    if (jenisCetak === 'detail') {
      if (selectedAgendaId) {
        return roleFilteredList.filter((a) => a.id === selectedAgendaId);
      }
      return roleFilteredList.slice(0, 1);
    }

    return roleFilteredList.filter((item) => {
      // Date filter
      const itemDate = item.tanggal;
      if (itemDate < startDate || itemDate > endDate) {
        return false;
      }

      // Status filter
      if (statusFilter === 'terdisposisi' && item.isDibatalkan) return false;
      if (statusFilter === 'dibatalkan' && !item.isDibatalkan) return false;

      // Pegawai filter
      if (pegawaiFilter !== 'semua') {
        const hasPegawai = item.pegawaiDitugaskan.some((p) => p.pegawaiId === pegawaiFilter);
        if (!hasPegawai) return false;
      }

      // Konfirmasi filter
      if (konfirmasiFilter === 'sudah') {
        const isAllConfirmed = item.pegawaiDitugaskan.length > 0 && item.pegawaiDitugaskan.every((p) => p.isConfirmed);
        if (!isAllConfirmed) return false;
      } else if (konfirmasiFilter === 'belum') {
        const hasUnconfirmed = item.pegawaiDitugaskan.some((p) => !p.isConfirmed);
        if (!hasUnconfirmed) return false;
      }

      return true;
    });
  }, [
    roleFilteredList,
    jenisCetak,
    selectedAgendaId,
    startDate,
    endDate,
    statusFilter,
    pegawaiFilter,
    konfirmasiFilter,
  ]);

  const targetPegawaiObj = users.find((u) => u.id === pegawaiFilter);

  // Generate PDF document
  const handleGeneratePdf = (mode: 'preview' | 'download' | 'print') => {
    setErrorMessage(null);
    if (isDateInvalid) {
      setErrorMessage('Tanggal Akhir tidak boleh lebih awal dari Tanggal Mulai.');
      return;
    }

    setIsGenerating(true);
    try {
      const doc = generateAgendaPdf({
        agendaList: filteredAgendaList,
        suratList,
        settings,
        currentUser,
        jenisCetak,
        rentangLabel,
        startDateStr: startDate,
        endDateStr: endDate,
        withSignature,
        withSummary,
        singleAgenda: filteredAgendaList[0],
        filterPegawaiNama: targetPegawaiObj?.nama,
      });

      const autoFileName = `Agenda-Kegiatan_${startDate}sd${endDate}.pdf`;

      if (mode === 'download') {
        doc.save(autoFileName);
      } else if (mode === 'preview') {
        const blob = doc.output('blob');
        if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
        const newUrl = URL.createObjectURL(blob);
        setPdfPreviewUrl(newUrl);
      } else if (mode === 'print') {
        // Fallback: standalone print page
        const blob = doc.output('blob');
        const blobUrl = URL.createObjectURL(blob);
        const printWindow = window.open(blobUrl, '_blank');
        if (printWindow) {
          printWindow.focus();
        } else {
          alert('Mohon izinkan pop-up peramban untuk mencetak langsung.');
        }
      }
    } catch (err: any) {
      console.error('PDF generation error:', err);
      setErrorMessage(err.message || 'Gagal membuat dokumen PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30">
              <Printer className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                Cetak Agenda Kegiatan Kedinasan
              </h2>
              <p className="text-xs text-slate-500">
                Format resmi Kop Dinas Perpustakaan &amp; Kearsipan Kota Banjarmasin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left: Rentang & Jenis Cetak */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Jenis Cetak
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setJenisCetak('daftar');
                      setPdfPreviewUrl(null);
                    }}
                    className={`p-2.5 rounded-xl border text-left font-semibold transition-all cursor-pointer ${
                      jenisCetak === 'daftar'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    Daftar Agenda (Landscape)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setJenisCetak('rekap');
                      setPdfPreviewUrl(null);
                    }}
                    className={`p-2.5 rounded-xl border text-left font-semibold transition-all cursor-pointer ${
                      jenisCetak === 'rekap'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    Rekapitulasi Menyeluruh
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setJenisCetak('per_pegawai');
                      setPdfPreviewUrl(null);
                    }}
                    className={`p-2.5 rounded-xl border text-left font-semibold transition-all cursor-pointer ${
                      jenisCetak === 'per_pegawai'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    Agenda per Pegawai
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setJenisCetak('detail');
                      setPdfPreviewUrl(null);
                    }}
                    className={`p-2.5 rounded-xl border text-left font-semibold transition-all cursor-pointer ${
                      jenisCetak === 'detail'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    Detail 1 Agenda (Portrait)
                  </button>
                </div>
              </div>

              {/* Rentang Waktu */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Rentang Waktu Kegiatan
                </label>
                <select
                  value={rentang}
                  onChange={(e) => {
                    setRentang(e.target.value as RentangWaktu);
                    setPdfPreviewUrl(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="hari_ini">Hari Ini</option>
                  <option value="besok">Besok</option>
                  <option value="minggu_ini">Minggu Ini</option>
                  <option value="minggu_depan">Minggu Depan</option>
                  <option value="bulan_ini">Bulan Ini (November 2026)</option>
                  <option value="bulan_depan">Bulan Depan (Desember 2026)</option>
                  <option value="triwulan">Triwulan Berjalan</option>
                  <option value="tahun_ini">Tahun Ini (2026)</option>
                  <option value="kustom">Rentang Kustom (Pilih Tanggal)</option>
                </select>
              </div>

              {/* Custom Date Pickers */}
              {rentang === 'kustom' && (
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Tanggal Mulai
                    </label>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => {
                        setCustomStart(e.target.value);
                        setPdfPreviewUrl(null);
                      }}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Tanggal Akhir
                    </label>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => {
                        setCustomEnd(e.target.value);
                        setPdfPreviewUrl(null);
                      }}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                    />
                  </div>
                  {isDateInvalid && (
                    <p className="col-span-2 text-[11px] text-red-600 font-semibold mt-1">
                      Tanggal akhir tidak boleh lebih awal dari tanggal mulai.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Right: Filters & Additional Options */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Filter Pegawai
                </label>
                <select
                  value={pegawaiFilter}
                  onChange={(e) => {
                    setPegawaiFilter(e.target.value);
                    setPdfPreviewUrl(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium cursor-pointer"
                >
                  <option value="semua">Semua Pegawai Ditugaskan</option>
                  {users
                    .filter((u) => u.peran === 'Pegawai')
                    .map((peg) => (
                      <option key={peg.id} value={peg.id}>
                        {peg.nama} - {peg.jabatan}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Status Agenda
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as any);
                      setPdfPreviewUrl(null);
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium cursor-pointer"
                  >
                    <option value="semua">Semua Status</option>
                    <option value="terdisposisi">Hanya Terdisposisi</option>
                    <option value="dibatalkan">Hanya Dibatalkan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Status Konfirmasi
                  </label>
                  <select
                    value={konfirmasiFilter}
                    onChange={(e) => {
                      setKonfirmasiFilter(e.target.value as any);
                      setPdfPreviewUrl(null);
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium cursor-pointer"
                  >
                    <option value="semua">Semua</option>
                    <option value="sudah">Sudah Dikonfirmasi</option>
                    <option value="belum">Belum Dikonfirmasi</option>
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-2 space-y-2">
                <label className="flex items-center gap-2.5 text-xs text-slate-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={withSignature}
                    onChange={(e) => {
                      setWithSignature(e.target.checked);
                      setPdfPreviewUrl(null);
                    }}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300"
                  />
                  <span>Sertakan Lembar Pengesahan Tanda Tangan Kepala Dinas</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-slate-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={withSummary}
                    onChange={(e) => {
                      setWithSummary(e.target.checked);
                      setPdfPreviewUrl(null);
                    }}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300"
                  />
                  <span>Tampilkan Kotak Rekapitulasi Jumlah Agenda</span>
                </label>
              </div>
            </div>
          </div>

          {/* Item Count Banner */}
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs text-blue-900">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Jumlah data yang akan dicetak: <strong>{filteredAgendaList.length}</strong> agenda kegiatan ({rentangLabel})
              </span>
            </div>
            <span className="text-[11px] text-blue-700 font-mono">
              Ukuran A4 &bull; {jenisCetak === 'detail' ? 'Portrait' : 'Landscape'}
            </span>
          </div>

          {/* PDF Preview Modal Frame if active */}
          {pdfPreviewUrl && (
            <div className="border border-slate-300 rounded-2xl overflow-hidden bg-slate-100 shadow-inner">
              <div className="bg-slate-200 px-4 py-2 flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Pratinjau Dokumen PDF (jsPDF)</span>
                <span className="text-[11px] text-slate-500 font-mono">
                  Agenda-Kegiatan_{startDate}sd{endDate}.pdf
                </span>
              </div>
              <iframe
                src={pdfPreviewUrl}
                className="w-full h-80 border-0"
                title="Pratinjau PDF Agenda"
              />
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => handleGeneratePdf('print')}
            disabled={isGenerating || filteredAgendaList.length === 0 || isDateInvalid}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-200/70 text-slate-700 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Halaman (Browser)</span>
          </button>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={() => handleGeneratePdf('preview')}
              disabled={isGenerating || filteredAgendaList.length === 0 || isDateInvalid}
              className="px-4 py-2.5 rounded-xl border border-blue-600 hover:bg-blue-50 text-blue-700 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              <span>Pratinjau PDF</span>
            </button>

            <button
              type="button"
              onClick={() => handleGeneratePdf('download')}
              disabled={isGenerating || filteredAgendaList.length === 0 || isDateInvalid}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all disabled:opacity-40 cursor-pointer flex items-center gap-2 shadow-lg shadow-blue-600/30"
            >
              <Download className="w-4 h-4" />
              <span>Unduh PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
