import React from 'react';
import { User as UserIcon, RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const TopStatusBar: React.FC = () => {
  const { currentUser, resetDemoData } = useApp();

  if (!currentUser) return null;

  return (
    <div className="bg-[#081023] border-b border-slate-800 text-white px-4 py-2 sm:px-6 select-none shrink-0 font-sans">
      <div className="flex flex-col gap-1.5 text-xs">
        {/* Row 1: DEMO OPERASIONAL & Deskripsi */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded text-[11px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/40 font-mono tracking-wider">
            DEMO OPERASIONAL
          </span>
          <span className="text-slate-300 text-xs font-normal">
            Data tersimpan di penyimpanan browser (Local Storage) &amp; terkoneksi AI Gemini untuk analisis surat.
          </span>
        </div>

        {/* Row 2: Login User & Tombol Reset Demo */}
        <div className="flex items-center gap-3 text-slate-300 text-xs">
          <div className="flex items-center gap-1.5 truncate">
            <UserIcon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">
              Login: <strong className="text-white font-semibold">{currentUser.nama}</strong> ({currentUser.jabatan})
            </span>
          </div>

          <button
            onClick={() => {
              if (window.confirm('Kembalikan seluruh data contoh ke setelan awal Dispersip Banjarmasin?')) {
                resetDemoData();
              }
            }}
            title="Kembalikan data contoh demo ke awal"
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#132247] hover:bg-[#1a2f63] text-slate-200 hover:text-white border border-slate-700 text-[11px] font-medium transition-colors shrink-0 cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-3 h-3 text-slate-300" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
