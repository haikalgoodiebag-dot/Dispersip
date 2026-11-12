import React from 'react';
import {
  LayoutDashboard,
  Upload,
  Archive,
  Trash2,
  Sparkles,
  FileSignature,
  Calendar,
  Bell,
  FolderArchive,
  FileText,
  Users,
  Settings,
  History,
  UserCheck,
  Building2,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';

interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpenMobile, onCloseMobile }) => {
  const { currentUser, activeTab, setActiveTab, suratList, agendaList, unreadCount } = useApp();

  if (!currentUser) return null;

  const role: UserRole = currentUser.peran;

  // Compute badges
  const pendingDisposisiCount = suratList.filter((s) => s.status === 'Menunggu Disposisi' && !s.isDeleted).length;
  const myPendingTasksCount = agendaList.filter((a) =>
    a.pegawaiDitugaskan.some((p) => p.pegawaiId === currentUser.id && !p.isConfirmed)
  ).length;

  // Normalized role string for display
  let roleLabel = 'Pegawai';
  if (role === 'Administrator' || role === 'Admin') roleLabel = 'Administrator';
  else if (role === 'Staf Sekretariat' || role === 'Petugas') roleLabel = 'Staf Sekretariat';
  else if (role === 'Pimpinan') roleLabel = 'Pimpinan';
  else if (role === 'Pegawai') roleLabel = 'Pegawai';

  // Master menu items definition according to Section 6
  const allMenuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['Administrator', 'Admin', 'Staf Sekretariat', 'Petugas', 'Pimpinan', 'Pegawai'],
    },
    {
      id: 'upload_surat',
      label: 'Upload Surat Masuk',
      icon: Upload,
      badgeText: 'Baru',
      badgeColor: 'bg-blue-950/80 text-blue-400 border border-blue-800/60',
      roles: ['Staf Sekretariat', 'Petugas', 'Pimpinan'],
    },
    {
      id: 'arsip_surat',
      label: 'Arsip Surat Masuk',
      icon: Archive,
      badgeCount: suratList.filter((s) => !s.isDeleted && !s.isArchived).length,
      roles: ['Staf Sekretariat', 'Petugas', 'Pimpinan'],
    },
    {
      id: 'surat_terhapus',
      label: 'Surat Terhapus (Sampah)',
      icon: Trash2,
      badgeCount: suratList.filter((s) => s.isDeleted).length > 0 ? suratList.filter((s) => s.isDeleted).length : undefined,
      roles: ['Staf Sekretariat', 'Petugas', 'Pimpinan'],
    },
    {
      id: 'pembacaan_ai',
      label: 'Pembacaan Surat AI',
      icon: Sparkles,
      badgeText: 'Gemini',
      badgeColor: 'bg-blue-950/80 text-blue-400 border border-blue-800/60',
      roles: ['Staf Sekretariat', 'Petugas', 'Pimpinan'],
    },
    {
      id: 'disposisi_pimpinan',
      label: 'Disposisi Pimpinan',
      icon: FileSignature,
      badgeCount: pendingDisposisiCount > 0 ? pendingDisposisiCount : undefined,
      badgeCountColor: 'bg-amber-500 text-slate-950',
      roles: ['Pimpinan'],
    },
    {
      id: 'agenda_kegiatan',
      label: 'Agenda Kegiatan',
      icon: Calendar,
      badgeCount: agendaList.length > 0 ? agendaList.length : undefined,
      roles: ['Staf Sekretariat', 'Petugas', 'Pimpinan', 'Pegawai'],
    },
    {
      id: 'notifikasi_penugasan',
      label: 'Notifikasi Penugasan',
      icon: Bell,
      badgeCount: role === 'Pegawai'
        ? (myPendingTasksCount > 0 ? myPendingTasksCount : undefined)
        : (unreadCount > 0 ? unreadCount : undefined),
      badgeCountColor: 'bg-red-500 text-white',
      roles: ['Staf Sekretariat', 'Petugas', 'Pimpinan', 'Pegawai'],
    },
    {
      id: 'arsip_digital',
      label: 'Arsip Digital',
      icon: FolderArchive,
      roles: ['Staf Sekretariat', 'Petugas', 'Pimpinan'],
    },
    {
      id: 'laporan',
      label: 'Laporan',
      icon: FileText,
      roles: ['Staf Sekretariat', 'Petugas', 'Pimpinan'],
    },
    {
      id: 'manajemen_pengguna',
      label: 'Manajemen Pengguna',
      icon: Users,
      roles: ['Administrator', 'Admin'],
    },
    {
      id: 'pengaturan_notifikasi',
      label: 'Pengaturan Notifikasi',
      icon: Settings,
      roles: ['Administrator', 'Admin'],
    },
    {
      id: 'riwayat_aktivitas',
      label: 'Riwayat Aktivitas',
      icon: History,
      roles: ['Administrator', 'Admin'],
    },
    {
      id: 'profil_saya',
      label: 'Profil Saya',
      icon: UserCheck,
      roles: ['Administrator', 'Admin', 'Staf Sekretariat', 'Petugas', 'Pimpinan', 'Pegawai'],
    },
  ];

  // Strictly filter menus for current role
  const visibleMenus = allMenuItems.filter((item) => item.roles.includes(role));

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  const sidebarContent = (
    <div className="h-full flex flex-col bg-[#091124] text-slate-200 select-none">
      {/* Top Header / Branding */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Square Rounded Blue Logo with Building Icon */}
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 shrink-0">
              <Building2 className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-blue-400 tracking-wider uppercase font-mono leading-none">
                PEMERINTAH KOTA BANJARMASIN
              </p>
              <h2 className="text-base font-extrabold text-white tracking-tight mt-1 leading-tight">
                Agenda Kegiatan
              </h2>
              <p className="text-[11px] text-slate-400 leading-tight">
                Dinas Perpustakaan &amp; Kearsipan
              </p>
            </div>
          </div>

          {/* Close button on mobile */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Tutup menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Hak Akses Pill */}
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">Hak Akses:</span>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 tracking-wide font-mono">
            {roleLabel}
          </span>
        </div>
      </div>

      {/* Navigation Menu List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 sidebar-scroll">
        <div className="px-3 pb-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            MENU NAVIGASI
          </p>
        </div>

        {visibleMenus.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>

              {/* Badge Text (e.g. "Baru", "Gemini") */}
              {item.badgeText && (
                <span
                  className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                    isActive ? 'bg-white/20 text-white' : item.badgeColor
                  }`}
                >
                  {item.badgeText}
                </span>
              )}

              {/* Badge Count */}
              {item.badgeCount !== undefined && (
                <span
                  className={`ml-2 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    isActive
                      ? 'bg-white text-blue-700'
                      : item.badgeCountColor || 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {item.badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Fixed Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-[#070d1e] text-[11px] text-slate-400">
        <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
          <span>Sistem Operasional</span>
          <span className="text-blue-400 font-bold">v1.0.0</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1 font-sans">
          Dinas Perpustakaan &amp; Kearsipan Kota Banjarmasin
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 border-r border-slate-800 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-xs h-full z-10 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
