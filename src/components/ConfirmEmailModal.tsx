import React from 'react';
import { Mail, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ConfirmEmailModal: React.FC = () => {
  const { currentUser, updateUser } = useApp();

  if (!currentUser || currentUser.peran !== 'Pegawai' || currentUser.emailConfirmedByPegawai) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0d1730] border border-blue-500/50 rounded-3xl p-6 sm:p-7 shadow-2xl text-white space-y-4 animate-in zoom-in-95">
        <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
          <Mail className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-base font-bold text-white">Konfirmasi Alamat Gmail Pegawai</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Selamat datang di sistem Agenda Kegiatan Disperpusip Kota Banjarmasin. Setiap penugasan resmi dari pimpinan akan langsung dikirimkan ke alamat Gmail kedinasan Anda.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#132247] border border-slate-700 space-y-1">
          <p className="text-[11px] text-slate-400 font-semibold uppercase">Alamat Gmail Terdaftar:</p>
          <p className="text-base font-mono font-bold text-blue-300">{currentUser.email}</p>
          <p className="text-[10px] text-slate-400 pt-1">
            Nama: {currentUser.nama} &bull; {currentUser.jabatan}
          </p>
        </div>

        <div className="text-[11px] text-slate-400 flex items-start gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Alamat ini hanya digunakan untuk notifikasi penugasan kedinasan resmi dan tidak disebarluaskan untuk keperluan lain.
          </span>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={() => updateUser(currentUser.id, { emailConfirmedByPegawai: true })}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Konfirmasi Alamat Gmail Benar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
