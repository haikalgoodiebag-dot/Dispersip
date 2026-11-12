import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  RotateCw,
  Mail,
  Send,
  Calendar,
  AlertCircle,
  Share2,
  CalendarPlus,
  Download,
  Building,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatTanggalTakAmbigu,
  generateGoogleCalendarUrl,
  downloadIcsFile,
  generateTelegramShareUrl,
} from '../utils/dateHelper';

export const NotifikasiPenugasanPage: React.FC = () => {
  const {
    currentUser,
    agendaList,
    suratList,
    confirmPenugasan,
    retrySendNotification,
  } = useApp();

  const [retryingKey, setRetryingKey] = useState<string | null>(null);
  const [retryFeedback, setRetryFeedback] = useState<{ id: string; message: string } | null>(null);

  if (!currentUser) return null;

  const isPegawai = currentUser.peran === 'Pegawai';
  const isPimpinanOrSekretariat =
    currentUser.peran === 'Pimpinan' ||
    currentUser.peran === 'Staf Sekretariat' ||
    currentUser.peran === 'Administrator' ||
    currentUser.peran === 'Admin';

  // For Pegawai: only personal assignments
  const myAgendas = agendaList.filter((a) =>
    a.pegawaiDitugaskan.some((p) => p.pegawaiId === currentUser.id)
  );

  const handleRetry = async (
    agendaId: string,
    pegawaiId: string,
    channel: 'email' | 'telegram' | 'calendar'
  ) => {
    const key = `${agendaId}_${pegawaiId}_${channel}`;
    setRetryingKey(key);
    setRetryFeedback(null);

    const res = await retrySendNotification(agendaId, pegawaiId, channel);
    setRetryFeedback({ id: key, message: res.message || (res.success ? 'Berhasil dikirim' : 'Gagal') });
    setRetryingKey(null);

    setTimeout(() => setRetryFeedback(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold font-mono uppercase mb-1.5">
            <Bell className="w-3.5 h-3.5 text-blue-600" />
            <span>Pemberitahuan Kedinasan</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {isPegawai ? 'Penugasan Kedinasan Saya' : 'Pemantauan Notifikasi Penugasan Multi-Saluran'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isPegawai
              ? 'Daftar penugasan kegiatan kedinasan yang telah didisposisikan kepada Anda. Harap konfirmasi penerimaan tugas.'
              : 'Pantau status pengiriman notifikasi penugasan per pegawai ke Aplikasi, Email Gmail, Google Kalender, dan Telegram.'}
          </p>
        </div>
      </div>

      {/* View for Pegawai: Personal assignments with "Konfirmasi Telah Mengetahui" button */}
      {isPegawai ? (
        <div className="space-y-4">
          {myAgendas.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-xs text-slate-400 shadow-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <span>Belum ada penugasan kedinasan baru untuk Anda.</span>
            </div>
          ) : (
            myAgendas.map((agenda) => {
              const myAssignment = agenda.pegawaiDitugaskan.find((p) => p.pegawaiId === currentUser.id);
              const isConfirmed = myAssignment?.isConfirmed;

              const gcalUrl = generateGoogleCalendarUrl({
                title: agenda.namaKegiatan,
                dateStr: agenda.tanggal,
                timeStr: agenda.jam,
                location: agenda.tempat,
                description: `Nomor Surat: ${agenda.nomorSurat}\nPengirim: ${agenda.pengirim}\nArahan Pimpinan: ${agenda.instruksiPimpinan || '-'}`,
              });

              return (
                <div
                  key={agenda.id}
                  className={`bg-white rounded-3xl p-6 shadow-xs border transition-all space-y-4 ${
                    isConfirmed ? 'border-slate-200' : 'border-2 border-blue-400 bg-blue-50/20'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                          {agenda.nomorAgenda}
                        </span>
                        {isConfirmed ? (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-mono">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Dikonfirmasi: {myAssignment?.confirmedAt || 'Sudah'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Menunggu Konfirmasi Anda
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-extrabold text-slate-900 mt-1">
                        {agenda.namaKegiatan}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono">
                        Surat: {agenda.nomorSurat} &bull; Pengirim: {agenda.pengirim}
                      </p>
                    </div>

                    {/* Konfirmasi Button for Pegawai */}
                    {!isConfirmed ? (
                      <button
                        onClick={() => confirmPenugasan(agenda.id)}
                        className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30 flex items-center gap-2 shrink-0 cursor-pointer animate-pulse"
                      >
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span>Konfirmasi Telah Mengetahui</span>
                      </button>
                    ) : (
                      <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Telah Dikonfirmasi</span>
                      </div>
                    )}
                  </div>

                  {/* Schedule Details */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-1.5 text-xs">
                    <p className="flex items-center gap-2">
                      <span>📅 <strong>Hari/Tanggal:</strong> {agenda.tanggalTampilan}</span>
                      <span>&bull;</span>
                      <span>⏰ <strong>Waktu:</strong> {agenda.jam}</span>
                    </p>
                    <p>📍 <strong>Tempat:</strong> {agenda.tempat}</p>
                    {agenda.batasWaktu && (
                      <p className="text-amber-800 font-semibold">
                        ⏳ <strong>Batas Waktu:</strong> {agenda.batasWaktu}
                      </p>
                    )}
                  </div>

                  {/* Disposisi Instruction Box */}
                  <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 space-y-1 text-xs">
                    <span className="font-bold text-amber-900 block">
                      Arahan Disposisi ({agenda.pimpinanNama || 'Kepala Dinas'}):
                    </span>
                    <p className="text-amber-950 italic">
                      &ldquo;{agenda.instruksiPimpinan || 'Tindak lanjuti penugasan ini.'}&rdquo;
                    </p>
                  </div>

                  {/* Backup Integration Actions */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400">
                      Simpan ke kalender pribadi Anda:
                    </span>
                    <div className="flex items-center gap-2">
                      <a
                        href={gcalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-600 text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <CalendarPlus className="w-3.5 h-3.5 text-blue-600" />
                        <span>Google Kalender</span>
                      </a>
                      <button
                        onClick={() =>
                          downloadIcsFile({
                            title: agenda.namaKegiatan,
                            dateStr: agenda.tanggal,
                            timeStr: agenda.jam,
                            location: agenda.tempat,
                            description: `Nomor Surat: ${agenda.nomorSurat}\nArahan: ${agenda.instruksiPimpinan || '-'}`,
                          })
                        }
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-600" />
                        <span>Unduh .ics</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* View for Sekretariat & Pimpinan: Multi-channel monitoring per assignment */
        <div className="space-y-4">
          {agendaList.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-xs text-slate-400 shadow-xs">
              Belum ada data penugasan kegiatan yang didisposisikan.
            </div>
          ) : (
            agendaList.map((agenda) => (
              <div
                key={agenda.id}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                        {agenda.nomorAgenda}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {agenda.nomorSurat} &bull; {agenda.tanggalTampilan} ({agenda.jam})
                      </span>
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900 mt-1">
                      {agenda.namaKegiatan}
                    </h3>
                  </div>
                </div>

                {/* Table of staff notification channels */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-mono text-[10px] uppercase">
                        <th className="pb-2">Pegawai</th>
                        <th className="pb-2">In-App</th>
                        <th className="pb-2">Email (Gmail)</th>
                        <th className="pb-2">Telegram Bot</th>
                        <th className="pb-2">Google Kalender</th>
                        <th className="pb-2">Status Konfirmasi</th>
                        <th className="pb-2 text-right">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {agenda.pegawaiDitugaskan.map((peg, idx) => {
                        const emailKey = `${agenda.id}_${peg.pegawaiId}_email`;
                        const tgKey = `${agenda.id}_${peg.pegawaiId}_telegram`;

                        return (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="py-3 font-semibold text-slate-900">
                              <div>{peg.nama}</div>
                              <div className="text-[10px] text-slate-400 font-mono font-normal">
                                {peg.email}
                              </div>
                            </td>

                            {/* In-App */}
                            <td className="py-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                Terkirim
                              </span>
                            </td>

                            {/* Email */}
                            <td className="py-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  peg.emailStatus === 'Terkirim'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : peg.emailStatus === 'Simulasi'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                }`}
                              >
                                {peg.emailStatus || 'Simulasi'}
                              </span>
                            </td>

                            {/* Telegram */}
                            <td className="py-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  peg.telegramStatus === 'Terkirim'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : peg.telegramStatus === 'Belum Terhubung'
                                    ? 'bg-slate-100 text-slate-600'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {peg.telegramStatus || 'Simulasi'}
                              </span>
                            </td>

                            {/* Google Calendar */}
                            <td className="py-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                {peg.calendarStatus || 'Tersinkron'}
                              </span>
                            </td>

                            {/* Konfirmasi Status */}
                            <td className="py-3">
                              {peg.isConfirmed ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 font-mono">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  Dikonfirmasi
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 font-mono">
                                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                                  Belum
                                </span>
                              )}
                            </td>

                            {/* Retry Action */}
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleRetry(agenda.id, peg.pegawaiId, 'email')}
                                  disabled={retryingKey === emailKey}
                                  title="Kirim ulang email penugasan"
                                  className="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-[10px] font-semibold text-slate-700 cursor-pointer"
                                >
                                  {retryingKey === emailKey ? '...' : 'Email'}
                                </button>
                                <button
                                  onClick={() => handleRetry(agenda.id, peg.pegawaiId, 'telegram')}
                                  disabled={retryingKey === tgKey}
                                  title="Kirim ulang pesan Telegram"
                                  className="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-[10px] font-semibold text-slate-700 cursor-pointer"
                                >
                                  {retryingKey === tgKey ? '...' : 'Telegram'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {retryFeedback && (
                  <p className="text-[11px] text-blue-600 font-semibold text-right">
                    {retryFeedback.message}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
