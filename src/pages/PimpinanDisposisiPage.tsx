import React, { useState } from 'react';
import {
  FileSignature,
  Clock,
  AlertTriangle,
  Users,
  Calendar,
  Send,
  CheckCircle2,
  FileText,
  Search,
  Sparkles,
  ChevronRight,
  X,
  Building,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SuratMasuk, User } from '../types';
import { formatTanggalTakAmbigu, isSuratOverdue } from '../utils/dateHelper';

export const PimpinanDisposisiPage: React.FC = () => {
  const { suratList, users, submitDisposisi, currentUser, setActiveTab } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSurat, setSelectedSurat] = useState<SuratMasuk | null>(null);

  // Modal / Sheet form state
  const [instruksi, setInstruksi] = useState('');
  const [selectedPegawaiIds, setSelectedPegawaiIds] = useState<string[]>([]);
  const [batasWaktu, setBatasWaktu] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Available staff for disposition
  const availableEmployees = users.filter((u) => u.peran === 'Pegawai' && u.status === 'aktif');

  // Letters awaiting disposition
  const pendingLetters = suratList.filter(
    (s) => s.status === 'Menunggu Disposisi' && !s.isDeleted && !s.isArchived
  );

  const filteredLetters = pendingLetters.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.nomorSurat.toLowerCase().includes(q) ||
      s.nomorAgenda.toLowerCase().includes(q) ||
      s.pengirim.toLowerCase().includes(q) ||
      s.perihal.toLowerCase().includes(q)
    );
  });

  const handleOpenDisposisiModal = (surat: SuratMasuk) => {
    setSelectedSurat(surat);
    setInstruksi('Hadir mewakili Kepala Dinas. Tindak lanjuti kegiatan dan laporkan hasil pelaksanaan.');
    setSelectedPegawaiIds([]);
    setBatasWaktu(surat.tanggalKegiatan || '');
    setFeedbackMessage(null);
  };

  const handleTogglePegawai = (id: string) => {
    setSelectedPegawaiIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleQuickPreset = (presetText: string) => {
    setInstruksi(presetText);
  };

  const handleSubmitDisposisi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSurat) return;

    if (selectedPegawaiIds.length === 0) {
      setFeedbackMessage({ type: 'error', text: 'Pilih minimal satu pegawai yang ditugaskan.' });
      return;
    }
    if (!instruksi.trim()) {
      setFeedbackMessage({ type: 'error', text: 'Petunjuk arahan disposisi pimpinan wajib diisi.' });
      return;
    }

    setIsSubmitting(true);
    setFeedbackMessage(null);

    try {
      const res = await submitDisposisi({
        suratId: selectedSurat.id,
        instruksi: instruksi.trim(),
        pegawaiIds: selectedPegawaiIds,
        batasWaktu: batasWaktu || undefined,
      });

      if (res.success) {
        setFeedbackMessage({ type: 'success', text: res.summary });
        setTimeout(() => {
          setSelectedSurat(null);
          setActiveTab('agenda_kegiatan');
        }, 1500);
      } else {
        setFeedbackMessage({ type: 'error', text: res.summary });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Gagal menyimpan disposisi.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold font-mono uppercase mb-1.5">
            <FileSignature className="w-3.5 h-3.5 text-amber-600" />
            <span>Kewenangan Pimpinan Dinas</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Lembar Disposisi Pimpinan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Berikan arahan kedinasan dan tunjuk pegawai pelaksana tugas. Agenda kegiatan kedinasan secara otomatis terbentuk setelah disposisi disimpan.
          </p>
        </div>

        {/* Count Pill */}
        <div className="px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3 shrink-0">
          <Clock className="w-5 h-5 text-amber-500" />
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Menunggu Disposisi</p>
            <p className="text-sm font-extrabold text-slate-900">{pendingLetters.length} Naskah Dinas</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari berdasarkan nomor surat, agenda, pengirim, atau perihal kegiatan..."
          className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-xs text-slate-900 placeholder-slate-400 shadow-xs focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Letter Cards Grid */}
      {filteredLetters.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">
            Tidak Ada Surat Menunggu Disposisi
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Semua surat masuk yang telah diverifikasi oleh sekretariat telah selesai didisposisikan.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLetters.map((surat) => {
            const overdue = isSuratOverdue(surat.createdAt, surat.status);
            return (
              <div
                key={surat.id}
                className={`bg-white rounded-3xl p-6 shadow-xs border transition-all flex flex-col justify-between gap-4 hover:shadow-md ${
                  overdue ? 'border-2 border-red-400 bg-red-50/20' : 'border-slate-200'
                }`}
              >
                <div className="space-y-3">
                  {/* Top badges */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg">
                      {surat.nomorAgenda}
                    </span>

                    {overdue ? (
                      <span className="font-mono text-[10px] font-extrabold text-red-700 bg-red-100 border border-red-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                        Lewat Batas (&gt;1 Hari)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                        Menunggu Disposisi
                      </span>
                    )}
                  </div>

                  {/* Perihal & Details */}
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 line-clamp-2 leading-snug">
                      {surat.perihal}
                    </h3>
                    <p className="text-xs font-semibold text-slate-600 mt-1">
                      {surat.pengirim}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      No. Surat: {surat.nomorSurat}
                    </p>
                  </div>

                  {/* Event Schedule Info */}
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 space-y-1 text-xs text-slate-700">
                    <p className="flex items-center gap-1.5">
                      <span>📅</span>
                      <strong className="text-slate-900">{formatTanggalTakAmbigu(surat.tanggalKegiatan)}</strong>
                      <span>&bull;</span>
                      <span>⏰ {surat.waktuKegiatan || '09:00'} WITA</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-slate-600">
                      <span>📍</span>
                      <span className="truncate">{surat.tempatKegiatan || 'Kota Banjarmasin'}</span>
                    </p>
                  </div>

                  {surat.ringkasan && (
                    <p className="text-xs text-slate-500 line-clamp-2 italic">
                      &ldquo;{surat.ringkasan}&rdquo;
                    </p>
                  )}
                </div>

                {/* Bottom Action */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Diterima: {formatTanggalTakAmbigu(surat.tanggalDiterima)}
                  </span>

                  <button
                    onClick={() => handleOpenDisposisiModal(surat)}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-md shadow-amber-600/30 flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileSignature className="w-4 h-4" />
                    <span>Beri Disposisi</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Disposisi Sheet Modal */}
      {selectedSurat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs select-none">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-amber-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-600/30">
                  <FileSignature className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Formulir Disposisi Kepala Dinas
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {selectedSurat.nomorAgenda} &bull; No: {selectedSurat.nomorSurat}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSurat(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitDisposisi} className="flex-1 overflow-y-auto p-6 space-y-5">
              {feedbackMessage && (
                <div
                  className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
                    feedbackMessage.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                      : 'bg-red-50 border border-red-300 text-red-800'
                  }`}
                >
                  {feedbackMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{feedbackMessage.text}</span>
                </div>
              )}

              {/* Perihal & Pengirim Info */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1 text-xs">
                <p className="text-[11px] font-bold text-slate-500 uppercase font-mono">Perihal</p>
                <p className="font-extrabold text-slate-900">{selectedSurat.perihal}</p>
                <p className="text-slate-600">Pengirim: {selectedSurat.pengirim}</p>
              </div>

              {/* Multi-Employee Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Tunjuk Pegawai Pelaksana Tugas (Dapat Pilih Lebih dari 1) *
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-2xl p-2 bg-slate-50">
                  {availableEmployees.map((peg) => {
                    const isSelected = selectedPegawaiIds.includes(peg.id);
                    return (
                      <div
                        key={peg.id}
                        onClick={() => handleTogglePegawai(peg.id)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-blue-500 text-blue-950 font-semibold'
                            : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // handled by parent div
                            className="w-4 h-4 text-blue-600 rounded border-slate-300"
                          />
                          <div className="min-w-0">
                            <p className="text-xs truncate">{peg.nama}</p>
                            <p className="text-[10px] text-slate-500 truncate">
                              {peg.jabatan} &bull; {peg.bidang}
                            </p>
                          </div>
                        </div>

                        {peg.telegramConnected && (
                          <span className="text-[10px] text-sky-600 font-mono bg-sky-50 px-1.5 py-0.5 rounded shrink-0">
                            Telegram Aktif
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Presets for Pimpinan */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Petunjuk / Arahan Disposisi Pimpinan *
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    'Hadir mewakili Kepala Dinas.',
                    'Tindak lanjuti & laporkan hasil.',
                    'Koordinasikan dengan instansi terkait.',
                    'Siapkan bahan paparan & materi.',
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleQuickPreset(preset)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={3}
                  value={instruksi}
                  onChange={(e) => setInstruksi(e.target.value)}
                  placeholder="Ketik instruksi lengkap untuk pegawai yang ditunjuk..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              {/* Batas Waktu Tindak Lanjut */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Batas Waktu Tindak Lanjut
                </label>
                <input
                  type="date"
                  value={batasWaktu}
                  onChange={(e) => setBatasWaktu(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono"
                />
              </div>

              {/* Core Rule Note */}
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-[11px] text-blue-900">
                <strong>Aturan Inti:</strong> Menyimpan disposisi ini akan secara otomatis membentuk Agenda Kegiatan Kedinasan resmi serta memicu notifikasi multi-saluran (In-App, Email, Kalender, Telegram) kepada seluruh pegawai yang ditunjuk.
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedSurat(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-md shadow-amber-600/30 flex items-center gap-2 disabled:opacity-40 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Menyimpan &amp; Membentuk Agenda...</span>
                  ) : (
                    <>
                      <span>Simpan Disposisi &amp; Bentuk Agenda</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
