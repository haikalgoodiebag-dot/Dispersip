import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Mail,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  FileSignature,
  FileText,
  Filter,
  Users,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Building,
  MapPin,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatTanggalTakAmbigu } from '../utils/dateHelper';
import { AgendaKegiatan, SuratMasuk } from '../types';

export const DasborDanKalenderPage: React.FC = () => {
  const {
    currentUser,
    suratList,
    agendaList,
    users,
    setActiveTab,
    emailServerStatus,
  } = useApp();

  const [filterBulan, setFilterBulan] = useState<string>('2026-11');
  const [filterPengirim, setFilterPengirim] = useState<string>('semua');
  const [filterPegawai, setFilterPegawai] = useState<string>('semua');
  const [viewMode, setViewMode] = useState<'kalender' | 'daftar'>('kalender');

  // Metrics
  const totalVerifikasi = suratList.filter((s) => s.status === 'Menunggu Verifikasi').length;
  const totalMenungguDisposisi = suratList.filter((s) => s.status === 'Menunggu Disposisi').length;
  const totalSudahDisposisi = suratList.filter((s) => s.status === 'Sudah Didisposisi' || s.status === 'Sudah Dikonfirmasi').length;
  const totalDibatalkan = suratList.filter((s) => s.status === 'Dibatalkan').length;

  // Email metrics across all definitive assignments
  const allAssignments = agendaList.flatMap((a) => a.pegawaiDitugaskan);
  const emailTerkirimCount = allAssignments.filter((a) => a.emailStatus === 'Terkirim').length;
  const emailSimulasiCount = allAssignments.filter((a) => a.emailStatus === 'Simulasi').length;
  const emailGagalCount = allAssignments.filter((a) => a.emailStatus === 'Gagal').length;
  const belumKonfirmasiCount = allAssignments.filter((a) => !a.isConfirmed).length;

  // Pending letters (> 1 working day or near activity)
  const pendingLetters = suratList.filter((s) => s.status === 'Menunggu Disposisi');

  // Filtered Agendas
  const filteredAgendas = useMemo(() => {
    return agendaList.filter((agenda) => {
      const matchMonth = agenda.tanggal.startsWith(filterBulan);
      const matchPengirim =
        filterPengirim === 'semua' ||
        agenda.asalInstansi.toLowerCase().includes(filterPengirim.toLowerCase());
      const matchPegawai =
        filterPegawai === 'semua' ||
        agenda.pegawaiDitugaskan.some((p) => p.pegawaiId === filterPegawai);

      return matchMonth && matchPengirim && matchPegawai;
    });
  }, [agendaList, filterBulan, filterPengirim, filterPegawai]);

  // Unique senders for filter dropdown
  const uniqueSenders = useMemo(() => {
    const set = new Set(suratList.map((s) => s.asalInstansi));
    return Array.from(set).filter(Boolean);
  }, [suratList]);

  // Calendar Day Calculation for 2026-11
  const daysInMonth = useMemo(() => {
    const [y, m] = filterBulan.split('-').map(Number);
    const date = new Date(y, m, 0);
    return date.getDate();
  }, [filterBulan]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0d1b3e] to-[#0a1128] rounded-2xl p-6 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Pemerintah Kota Banjarmasin
              </span>
              <span className="text-xs text-slate-400">Zona Waktu: WITA</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Dasbor & Kalender Agenda Kegiatan
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Dinas Perpustakaan dan Kearsipan Kota Banjarmasin &bull; Masuk sebagai <strong>{currentUser?.nama}</strong> ({currentUser?.peran})
            </p>
          </div>

          {/* Quick CTA depending on role */}
          <div className="flex items-center gap-2">
            {currentUser?.peran === 'Petugas' && (
              <button
                onClick={() => setActiveTab('verifikasi_surat')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-2 cursor-pointer transition-all"
              >
                <FileCheck className="w-4 h-4" />
                Unggah Surat Masuk
              </button>
            )}
            {currentUser?.peran === 'Pimpinan' && (
              <button
                onClick={() => setActiveTab('disposisi_digital')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-2 cursor-pointer transition-all"
              >
                <FileSignature className="w-4 h-4" />
                Beri Disposisi ({totalMenungguDisposisi})
              </button>
            )}
            {currentUser?.peran === 'Pegawai' && (
              <button
                onClick={() => setActiveTab('penugasan_saya')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-2 cursor-pointer transition-all"
              >
                <CalendarIcon className="w-4 h-4" />
                Lihat Penugasan Saya
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Menunggu Disposisi</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {totalMenungguDisposisi}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Surat siap ditindaklanjuti</div>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Sudah Didisposisi</span>
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400 font-mono">
            {totalSudahDisposisi}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Agenda definitif aktif</div>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Email Penugasan</span>
            <Mail className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {emailTerkirimCount + emailSimulasiCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {emailSimulasiCount > 0 ? `${emailSimulasiCount} via simulasi` : 'Terkirim langsung'}
          </div>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Belum Dikonfirmasi</span>
            <AlertTriangle className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400 font-mono">
            {belumKonfirmasiCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Pegawai belum membaca</div>
        </div>
      </div>

      {/* Section: Surat Belum Didisposisi (Penting & Mendesak) */}
      {pendingLetters.length > 0 && (
        <div className="bg-[#0f172a] border border-amber-500/30 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Surat Masuk Menunggu Disposisi Pimpinan ({pendingLetters.length})
              </h2>
            </div>
            {currentUser?.peran === 'Pimpinan' && (
              <button
                onClick={() => setActiveTab('disposisi_digital')}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                Proses Sekarang <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingLetters.map((surat) => {
              // Priority logic: if activity date is within 3 days
              const tglMulai = surat.mengandungKegiatan ? surat.kegiatan?.tanggalMulai : undefined;
              const isNear = !!tglMulai && tglMulai <= '2026-11-15';

              return (
                <div
                  key={surat.id}
                  className="bg-[#091124] rounded-xl p-4 border border-slate-800 hover:border-slate-700 transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-300">
                      {surat.nomorAgenda}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isNear && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-bold">
                          Segera: Kegiatan Dekat
                        </span>
                      )}
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {surat.sifatSurat}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xs font-bold text-white line-clamp-2">
                    {surat.perihal}
                  </h3>

                  <div className="text-[11px] text-slate-400 space-y-1">
                    <div>Asal: <strong>{surat.asalInstansi}</strong></div>
                    <div>No. Surat: {surat.nomorSurat}</div>
                    {surat.kegiatan?.tanggalMulai && (
                      <div className="text-blue-300 font-medium">
                        Jadwal: {formatTanggalTakAmbigu(surat.kegiatan.tanggalMulai)} &bull; {surat.kegiatan.jamMulai} WITA
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">
                      Diterima: {formatTanggalTakAmbigu(surat.tanggalDiterima)}
                    </span>
                    {currentUser?.peran === 'Pimpinan' && (
                      <button
                        onClick={() => setActiveTab('disposisi_digital')}
                        className="text-blue-400 hover:text-white font-bold"
                      >
                        Beri Disposisi &rarr;
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Calendar & Agenda Explorer */}
      <div className="bg-[#0f172a] rounded-2xl p-6 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-400" />
              Kalender Kegiatan Kedinasan
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Agenda definitif (biru) setelah disposisi vs Draf (abu-abu) sebelum disposisi pimpinan.
            </p>
          </div>

          {/* View Mode Toggle & Month selector */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
              <button
                onClick={() => setViewMode('kalender')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  viewMode === 'kalender'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Kalender
              </button>
              <button
                onClick={() => setViewMode('daftar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  viewMode === 'daftar'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Daftar
              </button>
            </div>

            <input
              type="month"
              value={filterBulan}
              onChange={(e) => setFilterBulan(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-[#091124] p-3 rounded-xl border border-slate-800 text-xs">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Filter Instansi Pengirim:</label>
            <select
              value={filterPengirim}
              onChange={(e) => setFilterPengirim(e.target.value)}
              className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none text-xs"
            >
              <option value="semua">Semua Instansi</option>
              {uniqueSenders.map((instansi) => (
                <option key={instansi} value={instansi}>
                  {instansi}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Filter Pegawai Ditugaskan:</label>
            <select
              value={filterPegawai}
              onChange={(e) => setFilterPegawai(e.target.value)}
              className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none text-xs"
            >
              <option value="semua">Semua Pegawai</option>
              {users
                .filter((u) => u.peran === 'Pegawai')
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterPengirim('semua');
                setFilterPegawai('semua');
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white text-xs w-full hover:bg-slate-800"
            >
              Atur Ulang Filter
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-blue-600" />
            <span>Definitif (Disposisi Pimpinan Disimpan)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-slate-700 border border-dashed border-slate-500" />
            <span>Draf (Menunggu Disposisi Pimpinan)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-red-900 border border-red-600" />
            <span>Dibatalkan</span>
          </div>
        </div>

        {/* Calendar Grid View */}
        {viewMode === 'kalender' ? (
          <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d) => (
              <div
                key={d}
                className="hidden md:block text-center font-bold text-xs text-slate-400 py-1.5 bg-slate-900/60 rounded-lg border border-slate-800/80"
              >
                {d}
              </div>
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => {
              const dayNum = i + 1;
              const dayStr = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
              const dateStr = `${filterBulan}-${dayStr}`;

              const dayAgendas = filteredAgendas.filter((a) => a.tanggal === dateStr);

              return (
                <div
                  key={dateStr}
                  className={`min-h-[110px] bg-[#091124] border rounded-xl p-2 flex flex-col justify-between transition-colors ${
                    dayAgendas.length > 0 ? 'border-blue-500/30' : 'border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-300 font-mono">
                      {dayNum}
                    </span>
                    {dayAgendas.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-600/30 text-blue-300 font-bold">
                        {dayAgendas.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1">
                    {dayAgendas.map((agenda) => {
                      return (
                        <div
                          key={agenda.id}
                          title={`${agenda.perihal} - ${agenda.tempat}`}
                          className={`p-1.5 rounded-lg text-[10px] leading-tight font-medium cursor-pointer transition-all ${
                            agenda.isDibatalkan
                              ? 'bg-red-950/40 text-red-300 border border-red-800/40 line-through'
                              : agenda.isDefinitif
                              ? 'bg-blue-600/20 text-blue-200 border border-blue-500/40 hover:bg-blue-600/40'
                              : 'bg-slate-800/60 text-slate-300 border border-dashed border-slate-600'
                          }`}
                        >
                          <div className="font-bold truncate text-[11px]">
                            {agenda.jam}
                          </div>
                          <div className="truncate text-white">
                            {agenda.perihal}
                          </div>
                          <div className="text-[9px] text-slate-400 truncate">
                            {agenda.tempat}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table List View */
          <div className="space-y-3">
            {filteredAgendas.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Tidak ada agenda kegiatan pada filter yang dipilih.
              </div>
            ) : (
              filteredAgendas.map((agenda) => (
                <div
                  key={agenda.id}
                  className="bg-[#091124] rounded-xl p-4 border border-slate-800 hover:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-blue-400 font-bold">
                        {agenda.nomorAgenda}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          agenda.isDibatalkan
                            ? 'bg-red-500/20 text-red-400'
                            : agenda.isDefinitif
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {agenda.isDibatalkan
                          ? 'Dibatalkan'
                          : agenda.isDefinitif
                          ? 'Definitif'
                          : 'Draf'}
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-sm">{agenda.perihal}</h3>
                    <div className="text-slate-400 flex flex-wrap items-center gap-3 text-[11px]">
                      <span>{agenda.tanggalTampilan} ({agenda.jam})</span>
                      <span>&bull; Lokasi: {agenda.tempat}</span>
                      <span>&bull; Pengirim: {agenda.asalInstansi}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[11px] text-slate-400">Pegawai Ditugaskan:</div>
                    <div className="font-semibold text-slate-200">
                      {agenda.pegawaiDitugaskan.map((p) => p.nama).join(', ') || '-'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
