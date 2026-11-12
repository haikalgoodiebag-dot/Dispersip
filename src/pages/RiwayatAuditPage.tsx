import React, { useState } from 'react';
import { History, Shield, Search, Lock, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const RiwayatAuditPage: React.FC = () => {
  const { auditLogs } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('semua');

  const filteredLogs = auditLogs.filter((log) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      log.penggunaNama.toLowerCase().includes(q) ||
      log.tindakan.toLowerCase().includes(q) ||
      log.keterangan.toLowerCase().includes(q);

    const matchRole = roleFilter === 'semua' || log.peran === roleFilter;

    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0f172a] rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Integritas & Akuntabilitas ASN
            </span>
            <span className="text-xs text-slate-400 font-mono">WITA (Asia/Makassar)</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <History className="w-5 h-5 text-blue-400" />
            Riwayat Audit Sistem (Log Aktivitas)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Catatan permanen dan terenskripsi atas seluruh aktivitas verifikasi surat, disposisi, pengiriman email, serta akses akun.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-300">
          <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Arsip Log Tidak Dapat Dihapus / Diubah</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0f172a] p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs text-slate-400 font-medium">Filter Peran:</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-[#091124] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="semua">Semua Peran</option>
            <option value="Petugas">Petugas</option>
            <option value="Pimpinan">Pimpinan</option>
            <option value="Pegawai">Pegawai</option>
            <option value="Admin">Admin</option>
            <option value="Sistem">Sistem</option>
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari tindakan, keterangan, nama..."
            className="w-full bg-[#0b1329] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-[#0f172a] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#091124] text-slate-400 border-b border-slate-800 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Waktu (WITA)</th>
                <th className="py-3 px-4">Pengguna & Peran</th>
                <th className="py-3 px-4">Tindakan</th>
                <th className="py-3 px-4">Keterangan Aktivitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500">
                    Tidak ada catatan riwayat audit yang cocok.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {log.waktu}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-white">{log.penggunaNama}</div>
                      <span
                        className={`inline-block mt-0.5 px-2 py-0.2 rounded-full text-[9px] font-bold ${
                          log.peran === 'Admin'
                            ? 'bg-purple-500/20 text-purple-300'
                            : log.peran === 'Pimpinan'
                            ? 'bg-amber-500/20 text-amber-300'
                            : log.peran === 'Petugas'
                            ? 'bg-blue-500/20 text-blue-300'
                            : log.peran === 'Pegawai'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {log.peran}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-semibold text-blue-400">{log.tindakan}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 leading-relaxed max-w-xl">
                      {log.keterangan}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
