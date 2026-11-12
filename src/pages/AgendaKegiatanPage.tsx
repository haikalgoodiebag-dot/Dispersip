import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  List,
  Search,
  Filter,
  Printer,
  CalendarPlus,
  Download,
  Share2,
  Copy,
  CheckCircle2,
  Clock,
  MapPin,
  Building,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CetakAgendaModal } from '../components/CetakAgendaModal';
import {
  formatTanggalTakAmbigu,
  generateGoogleCalendarUrl,
  downloadIcsFile,
  generateTelegramShareUrl,
} from '../utils/dateHelper';
import { AgendaKegiatan } from '../types';

export const AgendaKegiatanPage: React.FC = () => {
  const { agendaList, currentUser, users } = useApp();

  const [viewMode, setViewMode] = useState<'daftar' | 'kalender'>('daftar');
  const [searchQuery, setSearchQuery] = useState('');
  const [pegawaiFilter, setPegawaiFilter] = useState('semua');
  const [statusFilter, setStatusFilter] = useState('semua');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedAgendaIdForPrint, setSelectedAgendaIdForPrint] = useState<string | undefined>();
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Calendar month state (defaults to November 2026)
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(2026, 10, 1)); // Nov 2026

  if (!currentUser) return null;

  const isPegawai = currentUser.peran === 'Pegawai';

  // Base list filtered by role (Pegawai only sees their assigned agendas)
  const roleFilteredList = useMemo(() => {
    if (isPegawai) {
      return agendaList.filter((a) =>
        a.pegawaiDitugaskan.some((p) => p.pegawaiId === currentUser.id)
      );
    }
    return agendaList;
  }, [agendaList, isPegawai, currentUser.id]);

  // Filtered agenda list
  const filteredAgendas = useMemo(() => {
    return roleFilteredList.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        item.namaKegiatan.toLowerCase().includes(q) ||
        item.perihal.toLowerCase().includes(q) ||
        item.nomorAgenda.toLowerCase().includes(q) ||
        item.nomorSurat.toLowerCase().includes(q) ||
        item.tempat.toLowerCase().includes(q) ||
        item.pengirim.toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (pegawaiFilter !== 'semua') {
        const hasPegawai = item.pegawaiDitugaskan.some((p) => p.pegawaiId === pegawaiFilter);
        if (!hasPegawai) return false;
      }

      if (statusFilter === 'terdisposisi' && item.isDibatalkan) return false;
      if (statusFilter === 'dibatalkan' && !item.isDibatalkan) return false;

      return true;
    });
  }, [roleFilteredList, searchQuery, pegawaiFilter, statusFilter]);

  const handleCopyMessage = (agenda: AgendaKegiatan) => {
    const text = `🏛 *AGENDA KEDINASAN DISPERSIP BANJARMASIN*
📌 *Kegiatan:* ${agenda.namaKegiatan}
📅 *Hari/Tanggal:* ${agenda.tanggalTampilan}
⏰ *Waktu:* ${agenda.jam}
📍 *Tempat:* ${agenda.tempat}
✉️ *No. Surat:* ${agenda.nomorSurat} (${agenda.pengirim})
📝 *Arahan Disposisi:* "${agenda.instruksiPimpinan || '-'}"
👥 *Petugas Ditunjuk:* ${agenda.pegawaiDitugaskan.map((p) => p.nama).join(', ')}`;

    navigator.clipboard.writeText(text);
    setCopyFeedback(agenda.id);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const handlePrintSingle = (agendaId: string) => {
    setSelectedAgendaIdForPrint(agendaId);
    setIsPrintModalOpen(true);
  };

  // Calendar calculations
  const monthYearLabel = currentMonth.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold font-mono uppercase mb-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
            <span>Agenda Kedinasan Kota Banjarmasin</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Agenda Kegiatan Kedinasan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isPegawai
              ? 'Daftar penugasan kegiatan kedinasan yang telah didisposisikan kepada Anda.'
              : 'Daftar agenda resmi yang telah disetujui melalui lembar disposisi pimpinan dinas.'}
          </p>
        </div>

        {/* View Toggle & Print Button */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center border border-slate-200">
            <button
              onClick={() => setViewMode('daftar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'daftar' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Daftar</span>
            </button>
            <button
              onClick={() => setViewMode('kalender')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'kalender' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Kalender</span>
            </button>
          </div>

          <button
            onClick={() => {
              setSelectedAgendaIdForPrint(undefined);
              setIsPrintModalOpen(true);
            }}
            className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>Cetak Agenda</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan kegiatan, nomor surat, agenda, atau tempat..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {!isPegawai && (
            <select
              value={pegawaiFilter}
              onChange={(e) => setPegawaiFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium cursor-pointer"
            >
              <option value="semua">Semua Pegawai</option>
              {users
                .filter((u) => u.peran === 'Pegawai')
                .map((peg) => (
                  <option key={peg.id} value={peg.id}>
                    {peg.nama}
                  </option>
                ))}
            </select>
          )}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium cursor-pointer"
          >
            <option value="semua">Semua Status</option>
            <option value="terdisposisi">Terdisposisi</option>
            <option value="dibatalkan">Dibatalkan</option>
          </select>
        </div>
      </div>

      {/* View: Daftar Agenda */}
      {viewMode === 'daftar' && (
        <div className="space-y-4">
          {filteredAgendas.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-xs text-slate-400 shadow-xs">
              Tidak ada agenda kegiatan yang cocok dengan kriteria pencarian.
            </div>
          ) : (
            filteredAgendas.map((agenda) => {
              const gcalUrl = generateGoogleCalendarUrl({
                title: agenda.namaKegiatan,
                dateStr: agenda.tanggal,
                timeStr: agenda.jam,
                location: agenda.tempat,
                description: `Nomor Surat: ${agenda.nomorSurat}\nPengirim: ${agenda.pengirim}\nArahan Pimpinan: ${agenda.instruksiPimpinan || '-'}`,
              });

              const tgShareUrl = generateTelegramShareUrl(
                `🏛 AGENDA DISPERSIP BANJARMASIN\n\nKegiatan: ${agenda.namaKegiatan}\nTanggal: ${agenda.tanggalTampilan}\nWaktu: ${agenda.jam}\nTempat: ${agenda.tempat}\nArahan Disposisi: ${agenda.instruksiPimpinan || '-'}`
              );

              return (
                <div
                  key={agenda.id}
                  className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg">
                          {agenda.nomorAgenda}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          Terdisposisi Resmi
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          Surat: {agenda.nomorSurat} ({agenda.pengirim})
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                        {agenda.namaKegiatan}
                      </h3>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-600 pt-1">
                        <span className="flex items-center gap-1 font-semibold text-slate-900">
                          <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                          {agenda.tanggalTampilan}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-slate-900">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          {agenda.jam}
                        </span>
                        <span className="flex items-center gap-1 text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-red-500" />
                          {agenda.tempat}
                        </span>
                      </div>
                    </div>

                    {/* Quick Integration Tools for Section 9 */}
                    <div className="flex items-center gap-1.5 shrink-0 self-start">
                      <a
                        href={gcalUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="Tambah ke Google Kalender"
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <CalendarPlus className="w-3.5 h-3.5 text-blue-600" />
                        <span className="hidden sm:inline">Google Kalender</span>
                      </a>

                      <button
                        onClick={() =>
                          downloadIcsFile({
                            title: agenda.namaKegiatan,
                            dateStr: agenda.tanggal,
                            timeStr: agenda.jam,
                            location: agenda.tempat,
                            description: `Nomor Surat: ${agenda.nomorSurat}\nPengirim: ${agenda.pengirim}\nArahan Pimpinan: ${agenda.instruksiPimpinan || '-'}`,
                            fileName: `Agenda_${agenda.nomorAgenda.replace(/\//g, '_')}.ics`,
                          })
                        }
                        title="Unduh file .ics iCalendar"
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-600" />
                        <span className="hidden sm:inline">.ics</span>
                      </button>

                      <a
                        href={tgShareUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="Bagikan ke Telegram"
                        className="p-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-600 transition-colors"
                      >
                        <Share2 className="w-4 h-4 text-sky-500" />
                      </a>

                      <button
                        onClick={() => handleCopyMessage(agenda)}
                        title="Salin Pesan Format Telegram"
                        className="p-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                      >
                        {copyFeedback === agenda.id ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-slate-600" />
                        )}
                      </button>

                      <button
                        onClick={() => handlePrintSingle(agenda.id)}
                        title="Cetak Lembar Detail Agenda"
                        className="p-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Disposisi Instruction Box */}
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900">
                        Arahan Disposisi: {agenda.pimpinanNama || 'Kepala Dinas'}
                      </span>
                      {agenda.batasWaktu && (
                        <span className="text-[11px] font-semibold text-amber-800">
                          Batas Waktu: {agenda.batasWaktu}
                        </span>
                      )}
                    </div>
                    <p className="text-amber-950 font-medium italic">
                      &ldquo;{agenda.instruksiPimpinan || 'Tindak lanjuti naskah dinas ini.'}&rdquo;
                    </p>
                  </div>

                  {/* Assigned Staff Pills */}
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">
                      Pegawai Ditugaskan:
                    </span>
                    {agenda.pegawaiDitugaskan.map((peg, idx) => (
                      <span
                        key={idx}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                          peg.isConfirmed
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <UserCheck className={`w-3.5 h-3.5 ${peg.isConfirmed ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span>{peg.nama}</span>
                        <span className="text-[10px] font-normal">
                          ({peg.isConfirmed ? 'Sudah Konfirmasi' : 'Belum Konfirmasi'})
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* View: Kalender Bulanan */}
      {viewMode === 'kalender' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          {/* Calendar Month Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="text-base font-extrabold text-slate-900 capitalize">
              {monthYearLabel}
            </h2>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 cursor-pointer"
                aria-label="Bulan sebelumnya"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <button
                onClick={() => setCurrentMonth(new Date(2026, 10, 1))}
                className="px-3 py-1 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-100 cursor-pointer"
              >
                Bulan Ini
              </button>
              <button
                onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 cursor-pointer"
                aria-label="Bulan berikutnya"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-2xl overflow-hidden border border-slate-200 text-xs">
            {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((dayName, idx) => (
              <div
                key={idx}
                className="bg-slate-100 p-2.5 text-center font-bold text-slate-600 font-mono text-[11px]"
              >
                {dayName}
              </div>
            ))}

            {/* Empty boxes before first day */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} className="bg-slate-50 min-h-24 p-2 opacity-50" />
            ))}

            {/* Calendar Days */}
            {Array.from({ length: totalDaysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dayStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
              const dayAgendas = filteredAgendas.filter((a) => a.tanggal === dayStr);

              return (
                <div
                  key={`day-${dayNum}`}
                  className="bg-white min-h-28 p-2 flex flex-col justify-between hover:bg-blue-50/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-700 text-xs">
                      {dayNum}
                    </span>
                    {dayAgendas.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                    )}
                  </div>

                  <div className="space-y-1 mt-1 flex-1">
                    {dayAgendas.map((agd) => (
                      <div
                        key={agd.id}
                        onClick={() => handlePrintSingle(agd.id)}
                        className="p-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-950 text-[10px] font-semibold leading-tight line-clamp-2 cursor-pointer hover:bg-blue-100 transition-colors"
                        title={`${agd.namaKegiatan} (${agd.jam})`}
                      >
                        {agd.namaKegiatan}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Printing Modal */}
      <CetakAgendaModal
        isOpen={isPrintModalOpen}
        onClose={() => {
          setIsPrintModalOpen(false);
          setSelectedAgendaIdForPrint(undefined);
        }}
        selectedAgendaId={selectedAgendaIdForPrint}
      />
    </div>
  );
};
