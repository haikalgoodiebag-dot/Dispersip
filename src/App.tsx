import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginPage } from './pages/LoginPage';
import { TopStatusBar } from './components/TopStatusBar';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { ConfirmEmailModal } from './components/ConfirmEmailModal';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { UploadSuratPage } from './pages/UploadSuratPage';
import { ArsipSuratPage } from './pages/ArsipSuratPage';
import { SuratTerhapusPage } from './pages/SuratTerhapusPage';
import { PembacaanSuratAiPage } from './pages/PembacaanSuratAiPage';
import { PimpinanDisposisiPage } from './pages/PimpinanDisposisiPage';
import { AgendaKegiatanPage } from './pages/AgendaKegiatanPage';
import { NotifikasiPenugasanPage } from './pages/NotifikasiPenugasanPage';
import { ArsipDigitalPage } from './pages/ArsipDigitalPage';
import { LaporanPage } from './pages/LaporanPage';
import { ManajemenPenggunaPage } from './pages/ManajemenPenggunaPage';
import { PengaturanNotifikasiPage } from './pages/PengaturanNotifikasiPage';
import { RiwayatAktivitasPage } from './pages/RiwayatAktivitasPage';
import { ProfilSayaPage } from './pages/ProfilSayaPage';

import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { UserRole } from './types';

const MainLayout: React.FC = () => {
  const { currentUser, activeTab, setActiveTab } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!currentUser) {
    return <LoginPage />;
  }

  // Strict RBAC permission verification according to Section 4 & Section 6
  const isAuthorized = (tab: string, role: UserRole): boolean => {
    switch (role) {
      case 'Administrator':
      case 'Admin':
        return [
          'dashboard',
          'manajemen_pengguna',
          'pengaturan_notifikasi',
          'riwayat_aktivitas',
          'profil_saya',
        ].includes(tab);

      case 'Staf Sekretariat':
      case 'Petugas':
        return [
          'dashboard',
          'upload_surat',
          'arsip_surat',
          'surat_terhapus',
          'pembacaan_ai',
          'agenda_kegiatan',
          'notifikasi_penugasan',
          'arsip_digital',
          'laporan',
          'profil_saya',
        ].includes(tab);

      case 'Pimpinan':
        return [
          'dashboard',
          'upload_surat',
          'arsip_surat',
          'surat_terhapus',
          'pembacaan_ai',
          'disposisi_pimpinan',
          'agenda_kegiatan',
          'laporan',
          'notifikasi_penugasan',
          'arsip_digital',
          'profil_saya',
        ].includes(tab);

      case 'Pegawai':
        return [
          'dashboard',
          'agenda_kegiatan',
          'notifikasi_penugasan',
          'profil_saya',
        ].includes(tab);

      default:
        return false;
    }
  };

  const renderContent = () => {
    // Check RBAC permission
    if (!isAuthorized(activeTab, currentUser.peran)) {
      return (
        <div className="bg-white rounded-3xl border border-red-200 p-8 sm:p-12 text-center max-w-lg mx-auto my-12 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Anda tidak memiliki akses ke halaman ini</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Peran Anda saat ini (<strong className="text-slate-800">{currentUser.peran}</strong>) tidak memiliki hak akses untuk membuka modul ini sesuai tata kelola RBAC (Role-Based Access Control) Dinas Perpustakaan dan Kearsipan Kota Banjarmasin.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Dashboard</span>
            </button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'upload_surat':
        return <UploadSuratPage />;
      case 'arsip_surat':
        return <ArsipSuratPage />;
      case 'surat_terhapus':
        return <SuratTerhapusPage />;
      case 'pembacaan_ai':
        return <PembacaanSuratAiPage />;
      case 'disposisi_pimpinan':
        return <PimpinanDisposisiPage />;
      case 'agenda_kegiatan':
        return <AgendaKegiatanPage />;
      case 'notifikasi_penugasan':
        return <NotifikasiPenugasanPage />;
      case 'arsip_digital':
        return <ArsipDigitalPage />;
      case 'laporan':
        return <LaporanPage />;
      case 'manajemen_pengguna':
        return <ManajemenPenggunaPage />;
      case 'pengaturan_notifikasi':
        return <PengaturanNotifikasiPage />;
      case 'riwayat_aktivitas':
        return <RiwayatAktivitasPage />;
      case 'profil_saya':
        return <ProfilSayaPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-800 selection:bg-blue-600 selection:text-white">
      {/* 1. Top Status Bar (DEMO OPERASIONAL & Login User) */}
      <TopStatusBar />

      {/* 2. Main App Container: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop & Mobile Responsive Sidebar */}
        <Sidebar
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Right Main Body: Header + Content + Footer */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
          {/* Official Clean White Header with Breadcrumb & User Menu */}
          <Header onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />

          {/* Very Light Gray Content Area with Ultra-Rounded Cards */}
          <main className="flex-1 bg-slate-50 p-4 sm:p-6 lg:p-8">
            {renderContent()}
          </main>

          {/* Footer Kedinasan Pemkot Banjarmasin */}
          <footer className="border-t border-slate-200 bg-white py-3.5 px-6 text-xs text-slate-500 shrink-0">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="text-[11px] text-slate-600">
                &copy; 2026 Dinas Perpustakaan dan Kearsipan Kota Banjarmasin &bull; Sistem Operasional Agenda Kegiatan v1.0.0
              </div>
              <div className="font-mono text-[10px] text-slate-500">
                Zona Waktu Resmi: WITA (Asia/Makassar, UTC+8)
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Mandatory Password Change Modal for First Login */}
      {currentUser.isFirstLogin && (
        <ChangePasswordModal
          isOpen={true}
          onClose={() => {}}
        />
      )}

      {/* Confirm Email Modal if required */}
      <ConfirmEmailModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
