import React from 'react';
import { Trash2, RotateCcw, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatTanggalTakAmbigu } from '../utils/dateHelper';

export const SuratTerhapusPage: React.FC = () => {
  const { suratList, restoreSurat, permanentDeleteSurat, currentUser } = useApp();

  const trashedLetters = suratList.filter((s) => s.isDeleted);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold font-mono uppercase mb-1.5">
            <Trash2 className="w-3.5 h-3.5 text-red-600" />
            <span>Surat Terhapus (Sampah)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Sampah Dokumen Surat Masuk
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Surat yang dihapus tersimpan sementara di sini. Anda dapat memulihkan surat kembali ke arsip atau menghapusnya secara permanen.
          </p>
        </div>

        <div className="px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-700">
          Total Terhapus: {trashedLetters.length}
        </div>
      </div>

      {/* List */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        {trashedLetters.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <span>Kotak sampah kosong. Tidak ada surat yang terhapus.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-mono text-[10px] uppercase">
                  <th className="py-3 px-4">No. Agenda</th>
                  <th className="py-3 px-4">Nomor &amp; Asal Surat</th>
                  <th className="py-3 px-4">Perihal</th>
                  <th className="py-3 px-4">Waktu Dihapus</th>
                  <th className="py-3 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trashedLetters.map((surat) => (
                  <tr key={surat.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-slate-600">
                      {surat.nomorAgenda}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{surat.nomorSurat}</div>
                      <div className="text-[11px] text-slate-500">{surat.pengirim}</div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-bold text-slate-900 line-clamp-2">{surat.perihal}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {surat.deletedAt ? new Date(surat.deletedAt).toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => restoreSurat(surat.id)}
                          className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Pulihkan</span>
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Hapus permanen surat ${surat.nomorSurat}? Tindakan ini tidak dapat dibatalkan.`)) {
                              permanentDeleteSurat(surat.id);
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus Permanen</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
