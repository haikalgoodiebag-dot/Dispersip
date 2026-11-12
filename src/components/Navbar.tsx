import React, { useState } from 'react';
import {
  BookOpen,
  LayoutDashboard,
  FileCheck,
  FileSignature,
  Calendar,
  Users,
  Mail,
  History,
  KeyRound,
  LogOut,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Clock,
  Menu,
  X,
  Bell,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';

interface NavbarProps {
  onOpenChangePassword: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenChangePassword }) => {
  const {
    currentUser,
    logout,
    activeTab,
    setActiveTab,
    emailServerStatus,
    resetDemoData,
    suratList,
    agendaList,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!currentUser) return null;

  const role: UserRole = currentUser.peran;

  // Unread / pending counts for notifications
  const pendingDisposisiCount = suratList.filter((s) => s.status === 'Menunggu Disposisi').length;
  const myPendingConfirmationCount = agendaList.filter((a) =>
    a.pegawaiDitugaskan.some((p) => p.pegawaiId === currentUser.id && !p.isConfirmed)
  ).length;

  const navItems = [
    {
      id: 'dasbor',
      label: 'Dasbor & Kalender',
      icon: LayoutDashboard,
      roles: ['Petugas', 'Pimpinan', 'Pegawai', 'Admin'],
    },
    {
      id: 'verifikasi_surat',
      label: 'Verifikasi Surat Masuk',
      icon: FileCheck,
      roles: ['Petugas'],
    },
    {
      id: 'disposisi_digital',
      label: 'Disposisi Digital',
      icon: FileSignature,
      badge: pendingDisposisiCount > 0 ? pendingDisposisiCount : undefined,
      roles: ['Pimpinan'],
    },
    {
      id: 'penugasan_saya',
      label: 'Penugasan Saya',
      icon: Calendar,
      badge: myPendingConfirmationCount > 0 ? myPendingConfirmationCount : undefined,
      roles: ['Pegawai'],
    },
    {
      id: 'buku_agenda',
      label: 'Buku Agenda',
      icon: BookOpen,
      roles: ['Petugas', 'Pimpinan'],
    },
    {
      id: 'surat_tertunda',
      label: 'Surat Tertunda',
      icon: Clock,
      badge: pendingDisposisiCount > 0 ? pendingDisposisiCount : undefined,
      roles: ['Petugas'],
    },
    {
      id: 'data_pegawai',
      label: 'Data Pegawai',
      icon: Users,
      roles: ['Admin'],
    },
    {
      id: 'pengaturan_email',
      label: 'Pengaturan Email',
      icon: Mail,
      roles: ['Admin'],
    },
    {
      id: 'riwayat_audit',
      label: 'Riwayat Audit',
      icon: History,
      roles: ['Petugas', 'Pimpinan', 'Pegawai', 'Admin'],
    },
  ];

  const visibleTabs = navItems.filter((item) => item.roles.includes(role));

  return (
    <header className="sticky top-0 z-40 bg-[#091124] border-b border-slate-800 text-slate-100 shadow-xl">
      {/* Simulation Banner if Gmail is unconfigured (Requirement Section 6) */}
      {!emailServerStatus.configured && (
        <div className="bg-amber-950/90 border-b border-amber-600/40 text-amber-200 px-4 py-2 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-semibold">
              Email belum dikonfigurasi, pengiriman hanya simulasi.
            </span>
            <span className="hidden md:inline text-amber-300/80 text-[11px]">
              &bull; Notifikasi tetap tersimpan dalam riwayat sistem dan aplikasi berjalan penuh.
            </span>
          </div>
          {role === 'Admin' && (
            <button
              onClick={() => setActiveTab('pengaturan_email')}
              className="text-[11px] underline font-bold text-amber-300 hover:text-white shrink-0"
            >
              Atur Kredensial
            </button>
          )}
        </div>
      )}

      {/* Main Top Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Left */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('dasbor')}>
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-amber-300 shadow-md">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-extrabold tracking-tight text-white block leading-tight">
                  Disperpusip Kota Banjarmasin
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  WITA (Asia/Makassar)
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 font-mono">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Info & Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Admin Reset Demo Button */}
            {role === 'Admin' && (
              <button
                onClick={() => {
                  if (window.confirm('Atur ulang data ke kondisi bawaan awal Disperpusip?')) {
                    resetDemoData();
                  }
                }}
                title="Atur Ulang Data Demo"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px]">Atur Ulang Demo</span>
              </button>
            )}

            {/* User Pill */}
            <div className="flex items-center gap-2 bg-[#121e3d] border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs">
              <div className="w-6 h-6 rounded-lg bg-blue-700 text-white font-bold flex items-center justify-center text-[10px]">
                {currentUser.nama.charAt(0)}
              </div>
              <div className="hidden sm:block leading-tight text-left">
                <p className="font-bold text-white truncate max-w-[140px] text-xs">
                  {currentUser.nama}
                </p>
                <p className="text-[10px] text-blue-400 font-semibold">{currentUser.peran}</p>
              </div>
            </div>

            {/* Change Password Button */}
            <button
              onClick={onOpenChangePassword}
              title="Ganti Kata Sandi"
              className="p-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              aria-label="Ganti Kata Sandi"
            >
              <KeyRound className="w-4 h-4" />
            </button>

            {/* Logout Button */}
            <button
              onClick={logout}
              title="Keluar"
              className="p-2 rounded-xl border border-red-500/30 hover:bg-red-950/60 text-red-400 hover:text-red-300 transition-colors"
              aria-label="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-slate-800 space-y-1">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold ${
                    isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge !== undefined && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 font-mono">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
