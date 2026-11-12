import React, { useState, useMemo } from 'react';
import {
  Archive,
  Search,
  Filter,
  Eye,
  Trash2,
  FolderArchive,
  Send,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  X,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatTanggalTakAmbigu, isSuratOverdue } from '../utils/dateHelper';
import { SuratMasuk } from '../types';

export const ArsipSuratPage: React.FC = () => {
  const { suratList, deleteSurat, archiveSurat, sendToPimpinan, currentUser, setActiveTab } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('semua');
  const [selectedSuratDetail, setSelectedSuratDetail] = useState<SuratMasuk | null>(null);

  if (!currentUser) return null;

  const isSekretariat =
    currentUser.peran === 'Staf Sekretariat' ||
    currentUser.peran === 'Petugas' ||
    currentUser.peran === 'Administrator' ||
    currentUser.peran === 'Admin';

  const isPimpinan = currentUser.peran === 'Pimpinan';

  // Active non-deleted, non-archived letters
  const activeSurat = suratList.filter((s) => !s.isDeleted && !s.isArchived);

  const filteredSurat = useMemo(() => {
    return activeSurat.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        item.nomorSurat.toLowerCase().includes(q) ||
        item.nomorAgenda.toLowerCase().includes(q) ||
        item.pengirim.toLowerCase().includes(q) ||
        item.perihal.toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (statusFilter !== 'semua') {
        if (statusFilter === 'overdue') {
          return isSuratOverdue(item.createdAt, item.status);
        }
        return item.status === statusFilter;
      }

      return true;
    });
  }, [activeSurat, searchQuery, statusFilter]);

  const getStatusBadge = (surat: SuratMasuk) => {
    const overdue = isSuratOverdue(surat.createdAt, surat.status);

    if (overdue) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300 font-mono animate-pulse">
          <AlertTriangle className="w-3 h-3 text-red-600" />
          Menunggu (&gt;1 Hari)
        </span>
      );
    }

    switch (surat.status) {
      case 'Diterima':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            Diterima
          </span>
        );
      case 'Menunggu Disposisi':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            Menunggu Disposisi
          </span>
        );
      case 'Terdisposisi':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
            Terdisposisi
          </span>
        );
      case 'Dikonfirmasi':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            Dikonfirmasi Pegawai
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            {surat.status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold font-mono uppercase mb-1.5">
            <Archive className="w-3.5 h-3.5 text-blue-600" />
            <span>Kearsipan Surat Masuk</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Arsip Surat Masuk
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar seluruh naskah dinas masuk beserta nomor agenda registrasi, status disposisi, dan riwayat penugasan.
          </p>
        </div>

        {isSekretariat && (
          <button
            onClick={() => setActiveTab('upload_surat')}
            className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <span>Upload Surat Baru</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nomor surat, agenda, pengirim, atau perihal..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 font-medium cursor-pointer"
        >
          <option value="semua">Semua Status ({activeSurat.length})</option>
          <option value="Menunggu Disposisi">Menunggu Disposisi</option>
          <option value="overdue">Lewat Batas (&gt;1 Hari)</option>
          <option value="Terdisposisi">Terdisposisi</option>
          <option value="Dikonfirmasi">Dikonfirmasi</option>
          <option value="Diterima">Diterima (Draf)</option>
        </select>
      </div>

      {/* Letters Table / Cards */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        {filteredSurat.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Tidak ada arsip surat masuk yang sesuai dengan filter pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-mono text-[10px] uppercase">
                  <th className="py-3 px-4">No. Agenda</th>
                  <th className="py-3 px-4">Nomor &amp; Asal Surat</th>
                  <th className="py-3 px-4">Perihal Kegiatan</th>
                  <th className="py-3 px-4">Jadwal Acara</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSurat.map((surat) => (
                  <tr key={surat.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {surat.nomorAgenda}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{surat.nomorSurat}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{surat.pengirim}</div>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-bold text-slate-900 line-clamp-2">{surat.perihal}</div>
                      {surat.ringkasan && (
                        <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                          {surat.ringkasan}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-slate-700">
                      <div>📅 {formatTanggalTakAmbigu(surat.tanggalKegiatan)}</div>
                      <div className="text-[11px] text-slate-500 font-mono">⏰ {surat.waktuKegiatan || '09:00'} WITA</div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(surat)}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedSuratDetail(surat)}
                          title="Lihat Detail Naskah"
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {surat.status === 'Diterima' && isSekretariat && (
                          <button
                            onClick={() => sendToPimpinan(surat.id)}
                            title="Kirim ke Pimpinan"
                            className="p-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {surat.status === 'Menunggu Disposisi' && isPimpinan && (
                          <button
                            onClick={() => setActiveTab('disposisi_pimpinan')}
                            title="Beri Disposisi"
                            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold cursor-pointer"
                          >
                            Disposisi
                          </button>
                        )}

                        {isSekretariat && (
                          <>
                            <button
                              onClick={() => archiveSurat(surat.id)}
                              title="Pindahkan ke Arsip Digital"
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            >
                              <FolderArchive className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Pindahkan surat ${surat.nomorSurat} ke Surat Terhapus (Sampah)?`)) {
                                  deleteSurat(surat.id);
                                }
                              }}
                              title="Pindah ke Sampah"
                              className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Surat Detail Modal */}
      {selectedSuratDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs select-none">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded">
                  {selectedSuratDetail.nomorAgenda}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">
                  Detail Naskah Dinas Surat Masuk
                </h3>
              </div>
              <button
                onClick={() => setSelectedSuratDetail(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Nomor Surat</p>
                  <p className="font-bold text-slate-900">{selectedSuratDetail.nomorSurat}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Pengirim</p>
                  <p className="font-bold text-slate-900">{selectedSuratDetail.pengirim}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Perihal</p>
                <p className="font-bold text-slate-900 text-sm">{selectedSuratDetail.perihal}</p>
              </div>

              <div className="bg-blue-50 p-3 rounded-2xl border border-blue-200 space-y-1">
                <p className="font-bold text-blue-900">Jadwal Acara / Kegiatan:</p>
                <p>📅 Hari/Tanggal: {formatTanggalTakAmbigu(selectedSuratDetail.tanggalKegiatan)}</p>
                <p>⏰ Waktu: {selectedSuratDetail.waktuKegiatan || '09:00'} WITA</p>
                <p>📍 Tempat: {selectedSuratDetail.tempatKegiatan || '-'}</p>
              </div>

              {selectedSuratDetail.ringkasan && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Ringkasan Isi</p>
                  <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {selectedSuratDetail.ringkasan}
                  </p>
                </div>
              )}

              {selectedSuratDetail.disposisi && (
                <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 space-y-2">
                  <p className="font-bold text-amber-900">Lembar Disposisi Kepala Dinas:</p>
                  <p className="text-amber-950 italic">&ldquo;{selectedSuratDetail.disposisi.instruksi}&rdquo;</p>
                  <div className="pt-1 text-[11px] text-amber-800">
                    <strong>Pegawai Ditugaskan:</strong>{' '}
                    {selectedSuratDetail.disposisi.pegawaiDitunjuk.map((p) => p.nama).join(', ')}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedSuratDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
