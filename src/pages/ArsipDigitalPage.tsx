import React, { useState } from 'react';
import { FolderArchive, Search, Filter, Download, FileText, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatTanggalTakAmbigu } from '../utils/dateHelper';

export const ArsipDigitalPage: React.FC = () => {
  const { suratList, agendaList } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('2026');

  const archivedSurat = suratList.filter((s) => s.isArchived || s.status === 'Diarsipkan');

  const filtered = archivedSurat.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.nomorSurat.toLowerCase().includes(q) ||
      s.nomorAgenda.toLowerCase().includes(q) ||
      s.pengirim.toLowerCase().includes(q) ||
      s.perihal.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold font-mono uppercase mb-1.5">
            <FolderArchive className="w-3.5 h-3.5 text-blue-600" />
            <span>Depo Kearsipan Digital</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Arsip Digital Kedinasan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Repositori penyimpanan permanen naskah dinas dan agenda kegiatan yang telah selesai dilaksanakan.
          </p>
        </div>

        <div className="px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-700">
          Total Terarsip: {archivedSurat.length} Berkas
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari dalam arsip digital..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900"
          />
        </div>

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono cursor-pointer"
        >
          <option value="2026">Tahun Anggaran 2026</option>
          <option value="2025">Tahun Anggaran 2025</option>
        </select>
      </div>

      {/* Grid */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <FolderArchive className="w-8 h-8 text-slate-300 mx-auto" />
            <p>Belum ada berkas yang dipindahkan ke Arsip Digital.</p>
            <p className="text-[11px] text-slate-400">
              Surat yang telah selesai ditindaklanjuti pada menu Arsip Surat Masuk dapat diarsipkan ke sini.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((surat) => (
              <div key={surat.id} className="py-3.5 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {surat.nomorAgenda}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">{surat.nomorSurat}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1">{surat.perihal}</h4>
                  <p className="text-[11px] text-slate-500">{surat.pengirim}</p>
                </div>
                <div className="text-right text-[11px] text-slate-400 font-mono">
                  {surat.archivedAt ? new Date(surat.archivedAt).toLocaleDateString('id-ID') : 'Arsip 2026'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
