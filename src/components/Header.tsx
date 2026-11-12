import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Bell,
  User as UserIcon,
  LogOut,
  ChevronDown,
  CheckCircle2,
  Clock,
  Sparkles,
  Shield,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

const TAB_TITLES: Record<string, string> = {
  dashboard: 'Dashboard & Ringkasan Eksekutif',
  upload_surat: 'Upload Surat Masuk',
  arsip_surat: 'Arsip Surat Masuk',
  surat_terhapus: 'Surat Terhapus (Sampah)',
  pembacaan_ai: 'Pembacaan Surat AI Gemini',
  disposisi_pimpinan: 'Lembar Disposisi Pimpinan',
  agenda_kegiatan: 'Agenda Kegiatan Kedinasan',
  notifikasi_penugasan: 'Notifikasi & Status Penugasan',
  arsip_digital: 'Arsip Digital Kedinasan',
  laporan: 'Laporan & Rekapitulasi',
  manajemen_pengguna: 'Manajemen Pengguna & Akun',
  pengaturan_notifikasi: 'Pengaturan Saluran Notifikasi',
  riwayat_aktivitas: 'Riwayat Aktivitas & Audit',
  profil_saya: 'Profil Saya',
};

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const {
    currentUser,
    activeTab,
    setActiveTab,
    logout,
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    switchDemoRole,
  } = useApp();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationPopoverOpen, setNotificationPopoverOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationPopoverOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  const currentTabTitle = TAB_TITLES[activeTab] || 'Dashboard & Ringkasan Eksekutif';

  // Get user's notifications
  const userNotifs = notifications.filter((n) => n.userId === currentUser.id).slice(0, 5);

  // Current active demo mode button
  const currentRole = currentUser.peran;
  const isPimpinanMode = currentRole === 'Pimpinan';
  const isSekretariatMode = currentRole === 'Staf Sekretariat' || currentRole === 'Petugas';
  const isPegawaiMode = currentRole === 'Pegawai';

  // Initials for avatar
  const avatarInitial = currentUser.nama.startsWith('Dr.') ? 'D' : currentUser.nama.charAt(0).toUpperCase();

  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 shrink-0 select-none shadow-xs">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Hamburger (mobile) + Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 -ml-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Buka navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium truncate">
            <span className="text-slate-500 hidden sm:inline">Dispersip Kota Banjarmasin</span>
            <span className="text-slate-300 hidden sm:inline">/</span>
            <span className="text-slate-900 font-bold truncate text-sm">
              {currentTabTitle}
            </span>
          </nav>
        </div>

        {/* Center / Right: Mode Demo pill container (exact match with screenshot) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200 text-xs">
            <div className="flex items-center gap-1 pl-2 pr-1 text-slate-600 font-semibold text-[11px]">
              <Shield className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>Mode Demo:</span>
            </div>

            <button
              type="button"
              onClick={() => switchDemoRole('Pimpinan')}
              className={`px-3 py-1 rounded-xl text-xs transition-all cursor-pointer ${
                isPimpinanMode
                  ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 font-medium hover:bg-white/60'
              }`}
            >
              Pimpinan
            </button>

            <button
              type="button"
              onClick={() => switchDemoRole('Sekretariat')}
              className={`px-3 py-1 rounded-xl text-xs transition-all cursor-pointer ${
                isSekretariatMode
                  ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 font-medium hover:bg-white/60'
              }`}
            >
              Sekretariat
            </button>

            <button
              type="button"
              onClick={() => switchDemoRole('Pegawai')}
              className={`px-3 py-1 rounded-xl text-xs transition-all cursor-pointer ${
                isPegawaiMode
                  ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 font-medium hover:bg-white/60'
              }`}
            >
              Pegawai
            </button>
          </div>

          {/* Notification Bell with Red Badge '16' as in screenshot */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotificationPopoverOpen(!notificationPopoverOpen)}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Notifikasi"
              title="Notifikasi Penugasan"
            >
              <Bell className="w-5 h-5 text-slate-600" />
              <span className="absolute top-1 right-0.5 bg-red-600 text-white rounded-full text-[10px] font-bold px-1.5 py-0.2 font-mono flex items-center justify-center shadow-xs">
                {unreadCount > 0 ? unreadCount : 16}
              </span>
            </button>

            {/* Notification Popover Dropdown */}
            {notificationPopoverOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Pemberitahuan</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 font-mono">
                      {unreadCount > 0 ? unreadCount : 16} Baru
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                    >
                      Tandai dibaca
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {userNotifs.length === 0 ? (
                    <div className="py-6 px-4 text-center text-xs text-slate-500">
                      <p className="font-semibold text-slate-700 mb-1">Pemberitahuan Agenda Terbaru</p>
                      <p className="text-[11px] text-slate-400">
                        Surat masuk baru dan konfirmasi penugasan pimpinan otomatis muncul di sini.
                      </p>
                    </div>
                  ) : (
                    userNotifs.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          markNotificationAsRead(notif.id);
                          setActiveTab('notifikasi_penugasan');
                          setNotificationPopoverOpen(false);
                        }}
                        className={`p-3 text-xs transition-colors cursor-pointer hover:bg-slate-50 ${
                          !notif.isRead ? 'bg-blue-50/60 font-medium' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-slate-900 line-clamp-1">{notif.perihal}</p>
                          <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                            {notif.waktuNotif.split(',')[1] || notif.waktuNotif}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                          {notif.catatanPimpinan || 'Kegiatan kedinasan dijadwalkan.'}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-slate-100 text-center">
                  <button
                    onClick={() => {
                      setActiveTab('notifikasi_penugasan');
                      setNotificationPopoverOpen(false);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                  >
                    Buka Semua Notifikasi Penugasan &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Card with Dark Navy Round Avatar 'D' */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2.5 p-1 rounded-2xl hover:bg-slate-100 transition-colors text-left cursor-pointer"
              aria-label="Menu Pengguna"
            >
              {/* Dark Navy Avatar with Initial */}
              <div className="w-9 h-9 rounded-full bg-[#1e3a8a] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                {avatarInitial}
              </div>

              <div className="hidden sm:block text-left leading-tight max-w-[170px]">
                <div className="font-bold text-xs text-slate-900 truncate">
                  {currentUser.nama}
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {currentUser.jabatan}
                </div>
              </div>

              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {/* Profile Dropdown */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">{currentUser.nama}</p>
                  <p className="text-[11px] text-slate-500 truncate">{currentUser.jabatan}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    {currentUser.peran}
                  </span>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setActiveTab('profil_saya');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <span>Profil Saya &amp; Kontak</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('dashboard');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    <span>Dashboard Utama</span>
                  </button>
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      if (window.confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
                        logout();
                      }
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer font-semibold"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>Keluar Akun</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
