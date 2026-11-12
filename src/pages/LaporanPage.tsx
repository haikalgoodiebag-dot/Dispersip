import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  Building,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CetakAgendaModal } from '../components/CetakAgendaModal';

export const LaporanPage: React.FC = () => {
  const { suratList, agendaList, users } = useApp();

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Statistics
  const totalSurat = suratList.length;
  const suratTerdisposisi = suratList.filter((s) => s.status === 'Terdisposisi' || s.status === 'Dikonfirmasi').length;
  const suratMenunggu = suratList.filter((s) => s.status === 'Menunggu Disposisi').length;
  const totalAgenda = agendaList.length;
  const totalPenugasan = agendaList.reduce((acc, a) => acc + a.pegawaiDitugaskan.length, 0);
  const penugasanDikonfirmasi = agendaList.reduce(
    (acc, a) => acc + a.pegawaiDitugaskan.filter((p) => p.isConfirmed).length,
    0
  );

  const persentaseDisposisi = totalSurat > 0 ? Math.round((suratTerdisposisi / totalSurat) * 100) : 0;
  const persentaseKonfirmasi = totalPenugasan > 0 ? Math.round((penugasanDikonfirmasi / totalPenugasan) * 100) : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold font-mono uppercase mb-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Rekapitulasi Kinerja &bull; Tahun 2026</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Laporan &amp; Ringkasan Eksekutif
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Laporan menyeluruh volume surat masuk, rasio kecepatan disposisi pimpinan, dan konfirmasi penugasan pegawai.
          </p>
        </div>

        <button
          onClick={() => setIsPrintModalOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Printer className="w-4 h-4 text-amber-300" />
          <span>Cetak Laporan Rekapitulasi (PDF)</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">
              Tingkat Disposisi Naskah
            </span>
            <span className="text-base font-extrabold text-blue-600 font-mono">
              {persentaseDisposisi}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all"
              style={{ width: `${persentaseDisposisi}%` }}
            />
          </div>
          <p className="text-xs text-slate-500">
            {suratTerdisposisi} dari {totalSurat} naskah telah diselesaikan disposisinya oleh pimpinan.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">
              Tingkat Konfirmasi Pegawai
            </span>
            <span className="text-base font-extrabold text-emerald-600 font-mono">
              {persentaseKonfirmasi}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all"
              style={{ width: `${persentaseKonfirmasi}%` }}
            />
          </div>
          <p className="text-xs text-slate-500">
            {penugasanDikonfirmasi} dari {totalPenugasan} penugasan kedinasan telah dikonfirmasi oleh aparatur terkait.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">
              Agenda Resmi Terbentuk
            </span>
            <span className="text-base font-extrabold text-amber-600 font-mono">
              {totalAgenda}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Seluruh agenda kegiatan terbentuk secara otomatis setelah pimpinan menyimpan lembar disposisi.
          </p>
        </div>
      </div>

      {/* Details Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900">
          Ringkasan Kegiatan Kedinasan Kota Banjarmasin
        </h3>

        <div className="divide-y divide-slate-100 text-xs">
          {agendaList.map((a) => (
            <div key={a.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="font-bold text-slate-900">{a.namaKegiatan}</p>
                <p className="text-[11px] text-slate-500">
                  {a.nomorAgenda} &bull; {a.tanggalTampilan} ({a.jam}) &bull; {a.tempat}
                </p>
              </div>

              <div className="text-right sm:text-right">
                <span className="text-[11px] font-semibold text-slate-700 block">
                  Petugas: {a.pegawaiDitugaskan.map((p) => p.nama).join(', ')}
                </span>
                <span className="text-[10px] text-emerald-600 font-mono font-bold">
                  {a.pegawaiDitugaskan.every((p) => p.isConfirmed) ? 'Semua Dikonfirmasi' : 'Dalam Proses Konfirmasi'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Printing Modal */}
      <CetakAgendaModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
      />
    </div>
  );
};
