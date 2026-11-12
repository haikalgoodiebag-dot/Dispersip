import React, { useState, useMemo } from 'react';
import { History, Search, Filter, Shield, Clock, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const RiwayatAktivitasPage: React.FC = () => {
  const { auditLogs } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [tindakanFilter, setTindakanFilter] = useState('semua');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const q = searchQuery.toLowerCase();
      const match =
        log.tindakan.toLowerCase().includes(q) ||
        log.keterangan.toLowerCase().includes(q) ||
        log.penggunaNama.toLowerCase().includes(q) ||
        log.peran.toLowerCase().includes(q);

      if (!match) return false;
      if (tindakanFilter !== 'semua' && log.tindakan !== tindakanFilter) return false;

      return true;
    });
  }, [auditLogs, searchQuery, tindakanFilter]);

  const uniqueActions = useMemo(() => {
    const set = new Set<string>();
    auditLogs.forEach((l) => set.add(l.tindakan));
    return Array.from(set);
  }, [auditLogs]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold font-mono uppercase mb-1.5">
            <History className="w-3.5 h-3.5 text-blue-600" />
            <span>Audit Trail &bull; Keamanan Sistem</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Riwayat Aktivitas &amp; Log Audit
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Catatan log audit resmi kedinasan yang bersifat permanen (immutable) untuk transparansi pengelolaan naskah dinas dan penugasan.
          </p>
        </div>

        <div className="px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-700">
          Total Log: {auditLogs.length} Catatan
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari dalam riwayat audit berdasarkan nama, tindakan, atau keterangan..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={tindakanFilter}
          onChange={(e) => setTindakanFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium cursor-pointer"
        >
          <option value="semua">Semua Tindakan</option>
          {uniqueActions.map((act, idx) => (
            <option key={idx} value={act}>
              {act}
            </option>
          ))}
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-mono text-[10px] uppercase">
                <th className="py-3 px-4">Waktu (WITA)</th>
                <th className="py-3 px-4">Pengguna &amp; Role</th>
                <th className="py-3 px-4">Tindakan</th>
                <th className="py-3 px-4">Rincian Keterangan Aktivitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {log.waktu}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-bold text-slate-900">{log.penggunaNama}</div>
                    <span className="inline-block mt-0.5 px-2 py-0.2 rounded-full text-[10px] font-mono bg-blue-50 text-blue-700 font-semibold">
                      {log.peran}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                    {log.tindakan}
                  </td>
                  <td className="py-3 px-4 text-slate-600 leading-relaxed max-w-md">
                    {log.keterangan}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
