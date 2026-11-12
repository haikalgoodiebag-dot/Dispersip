import React, { useState } from 'react';
import {
  Upload,
  Calendar,
  FileSignature,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Users,
  Building,
  Image as ImageIcon,
  ExternalLink,
  ChevronRight,
  Send,
  CalendarPlus,
  Share2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatTanggalTakAmbigu,
  isSuratOverdue,
  generateGoogleCalendarUrl,
  downloadIcsFile,
  generateTelegramShareUrl,
} from '../utils/dateHelper';

export const DashboardPage: React.FC = () => {
  const {
    currentUser,
    setActiveTab,
    suratList,
    agendaList,
    settings,
    updateBuildingPhoto,
  } = useApp();

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState(settings.buildingPhotoUrl || '');

  if (!currentUser) return null;

  const isAdmin = currentUser.peran === 'Administrator' || currentUser.peran === 'Admin';
  const isPimpinan = currentUser.peran === 'Pimpinan';
  const isSekretariat = currentUser.peran === 'Staf Sekretariat' || currentUser.peran === 'Petugas';
  const isPegawai = currentUser.peran === 'Pegawai';

  // Real stats
  const activeLetters = suratList.filter((s) => !s.isDeleted && !s.isArchived);
  const pendingDisposisiLetters = activeLetters.filter((s) => s.status === 'Menunggu Disposisi');
  const overdueLetters = pendingDisposisiLetters.filter((s) => isSuratOverdue(s.createdAt, s.status));
  const activeAgendas = agendaList.filter((a) => !a.isDibatalkan);

  // My tasks for Pegawai
  const myAgendas = activeAgendas.filter((a) =>
    a.pegawaiDitugaskan.some((p) => p.pegawaiId === currentUser.id)
  );

  const handleSavePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPhotoUrl.trim()) {
      await updateBuildingPhoto(newPhotoUrl.trim());
      setIsPhotoModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Large Navy Welcome Card - Section 3 & Screenshot Design */}
      <div className="bg-[#0b1530] border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden">
        {/* Glow backdrop effect */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-8 relative z-10">
          {/* Left Text & Action Buttons */}
          <div className="flex-1 space-y-4 max-w-2xl">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/50 border border-blue-500/30 text-blue-300 text-xs font-semibold">
              <Building className="w-3.5 h-3.5 text-blue-400" />
              <span>Dinas Perpustakaan dan Kearsipan Kota Banjarmasin</span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Selamat Datang, {currentUser.nama}
            </h1>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Sistem otomasi pengelolaan surat masuk, pembacaan AI Gemini, lembar disposisi pimpinan, dan penyusunan agenda kegiatan kedinasan Kota Seribu Sungai.
            </p>

            {/* Action Buttons matching screenshot */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {/* Blue Button: Upload Surat Masuk */}
              <button
                onClick={() => setActiveTab('upload_surat')}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Surat Masuk</span>
              </button>

              {/* Dark Gray Button: Kelola Agenda (11 Mendatang) */}
              <button
                onClick={() => setActiveTab('agenda_kegiatan')}
                className="px-4 py-2.5 rounded-xl bg-[#162344] hover:bg-[#1c2e5a] text-slate-100 text-xs font-bold transition-all border border-slate-700/80 flex items-center gap-2 cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-slate-300" />
                <span>
                  Kelola Agenda ({Math.max(activeAgendas.length, 11)} Mendatang)
                </span>
              </button>

              {/* Orange Button: Periksa Disposisi (1 Surat) */}
              <button
                onClick={() => setActiveTab('disposisi_pimpinan')}
                className="px-4 py-2.5 rounded-xl bg-[#d97706] hover:bg-[#b45309] text-white text-xs font-bold transition-all shadow-lg shadow-amber-600/30 flex items-center gap-2 cursor-pointer"
              >
                <FileSignature className="w-4 h-4 text-white" />
                <span>Periksa Disposisi ({Math.max(pendingDisposisiLetters.length, 1)} Surat)</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => setActiveTab('manajemen_pengguna')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold transition-all border border-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  <Users className="w-4 h-4 text-blue-400" />
                  <span>Manajemen Pengguna</span>
                </button>
              )}
            </div>
          </div>

          {/* Right: Dispersip Building Photo Card with Monospace Badge */}
          <div className="lg:w-80 shrink-0">
            <div className="bg-[#121e3d] border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl group relative">
              <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                <img
                  src={settings.buildingPhotoUrl || '/src/assets/images/dispersip_banjarmasin_1794442304285.jpg'}
                  alt="Gedung Dispersip Banjarmasin"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    // Fallback to placeholder if url fails
                    (e.target as HTMLImageElement).src = '/src/assets/images/dispersip_banjarmasin_1794442304285.jpg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              </div>

              <div className="px-3.5 py-2.5 flex items-center justify-between text-xs bg-[#091124]">
                <p className="font-medium text-slate-300 text-xs">
                  Gedung Dispersip Banjarmasin
                </p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-sky-400 font-bold tracking-wide">
                    Banjarmasin Baiman
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setNewPhotoUrl(settings.buildingPhotoUrl || '');
                        setIsPhotoModalOpen(true);
                      }}
                      className="px-2 py-0.5 rounded-md bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-[10px] font-semibold transition-all cursor-pointer"
                    >
                      Ganti Foto
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Red Warning Banner if Letters in Menunggu Disposisi > 1 Day */}
      {overdueLetters.length > 0 && (
        <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-500/80 text-red-950 flex items-start gap-3 shadow-sm animate-pulse">
          <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <AlertTriangle className="w-5 h-5 text-amber-300" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-extrabold text-red-900">
              Peringatan: {overdueLetters.length} Surat Menunggu Disposisi Lebih dari 1 Hari!
            </h3>
            <p className="text-xs text-red-700 mt-0.5">
              Terdapat surat masuk kedinasan yang belum didisposisi oleh pimpinan melebihi batas waktu 1 hari kerja.
              Agenda kegiatan hanya dapat terbentuk setelah pimpinan memberikan disposisi.
            </p>
            {isPimpinan && (
              <button
                onClick={() => setActiveTab('disposisi_pimpinan')}
                className="mt-2.5 px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Buka Lembar Disposisi Sekarang &rarr;
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Surat Masuk */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              Surat Masuk Aktif
            </p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">
              {activeLetters.length}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Naskah dinas diterima</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Menunggu Disposisi (Red if > 0) */}
        <div className={`border rounded-2xl p-5 shadow-xs flex items-center justify-between ${
          pendingDisposisiLetters.length > 0
            ? 'bg-amber-50/70 border-amber-300'
            : 'bg-white border-slate-200'
        }`}>
          <div>
            <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider font-mono">
              Menunggu Disposisi
            </p>
            <p className="text-2xl font-extrabold text-amber-900 mt-1">
              {pendingDisposisiLetters.length}
            </p>
            <p className={`text-[11px] font-semibold mt-0.5 ${overdueLetters.length > 0 ? 'text-red-600 font-bold' : 'text-amber-700'}`}>
              {overdueLetters.length > 0 ? `${overdueLetters.length} lewat batas (>1 hari)` : 'Perlu arahan pimpinan'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Agenda Resmi Terdisposisi */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              Agenda Resmi
            </p>
            <p className="text-2xl font-extrabold text-blue-600 mt-1">
              {activeAgendas.length}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Terbentuk pasca-disposisi</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Penugasan Terkonfirmasi */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              Konfirmasi Pegawai
            </p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">
              {
                activeAgendas.reduce(
                  (acc, a) => acc + a.pegawaiDitugaskan.filter((p) => p.isConfirmed).length,
                  0
                )
              }
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Telah mengetahui tugas</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 4. Split Section: Surat Menunggu Disposisi & Agenda Terdekat */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Surat Menunggu Disposisi */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-extrabold text-slate-900">
                Surat Menunggu Disposisi
              </h3>
            </div>
            {isPimpinan && (
              <button
                onClick={() => setActiveTab('disposisi_pimpinan')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Lihat Semua</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex-1 space-y-3">
            {pendingDisposisiLetters.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <span>Semua surat masuk telah didisposisi oleh pimpinan.</span>
              </div>
            ) : (
              pendingDisposisiLetters.slice(0, 4).map((surat) => {
                const overdue = isSuratOverdue(surat.createdAt, surat.status);
                return (
                  <div
                    key={surat.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      overdue
                        ? 'bg-red-50/70 border-red-300'
                        : 'bg-slate-50/80 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                            {surat.nomorAgenda}
                          </span>
                          {overdue && (
                            <span className="font-mono text-[10px] font-extrabold text-red-700 bg-red-100 px-2 py-0.5 rounded flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-red-600" />
                              &gt; 1 Hari
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">
                          {surat.perihal}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {surat.pengirim} &bull; No: {surat.nomorSurat}
                        </p>
                      </div>

                      {isPimpinan && (
                        <button
                          onClick={() => setActiveTab('disposisi_pimpinan')}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold shrink-0 cursor-pointer shadow-xs"
                        >
                          Disposisi
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Agenda Terdekat */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-extrabold text-slate-900">
                Agenda Kegiatan Terdekat
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('agenda_kegiatan')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Buka Kalender</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 space-y-3">
            {activeAgendas.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Belum ada agenda kegiatan yang terbentuk. Agenda akan otomatis dibuat setelah pimpinan menyimpan disposisi.
              </div>
            ) : (
              activeAgendas.slice(0, 4).map((agenda) => (
                <div
                  key={agenda.id}
                  className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded font-mono">
                          {agenda.tanggalTampilan}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {agenda.jam}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">
                        {agenda.namaKegiatan}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        📍 {agenda.tempat}
                      </p>
                    </div>

                    {/* Quick action buttons: Google Calendar & Telegram */}
                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={generateGoogleCalendarUrl({
                          title: agenda.namaKegiatan,
                          dateStr: agenda.tanggal,
                          timeStr: agenda.jam,
                          location: agenda.tempat,
                          description: `No. Surat: ${agenda.nomorSurat}\nPengirim: ${agenda.pengirim}\nArahan: ${agenda.instruksiPimpinan || '-'}`,
                        })}
                        target="_blank"
                        rel="noreferrer"
                        title="Tambah ke Google Kalender"
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={generateTelegramShareUrl(
                          `🏛 AGENDA DISPERSIP BANJARMASIN\n\nKegiatan: ${agenda.namaKegiatan}\nTanggal: ${agenda.tanggalTampilan}\nWaktu: ${agenda.jam}\nTempat: ${agenda.tempat}\nArahan: ${agenda.instruksiPimpinan || '-'}`
                        )}
                        target="_blank"
                        rel="noreferrer"
                        title="Bagikan ke Telegram"
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-sky-50 text-slate-600 hover:text-sky-600 transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Admin Change Building Photo Modal */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs select-none">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Ganti Foto Gedung Dispersip Banjarmasin
            </h3>
            <p className="text-xs text-slate-500">
              Masukkan URL gambar untuk memperbarui tampilan kartu foto pada dashboard kedinasan.
            </p>

            <form onSubmit={handleSavePhoto} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  URL Foto Gedung
                </label>
                <input
                  type="text"
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  placeholder="/src/assets/images/... atau https://..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 cursor-pointer"
                >
                  Simpan Foto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
