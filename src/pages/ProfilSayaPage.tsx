import React, { useState } from 'react';
import {
  User as UserIcon,
  Shield,
  KeyRound,
  Send,
  Bell,
  Mail,
  Calendar,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Save,
  Check,
  Building,
  Briefcase,
  Hash,
  AtSign,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ChangePasswordModal } from '../components/ChangePasswordModal';

export const ProfilSayaPage: React.FC = () => {
  const {
    currentUser,
    updateUser,
    logout,
    connectTelegramUser,
    disconnectTelegramUser,
    updateUserPreferences,
    telegramServerStatus,
  } = useApp();

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState(currentUser?.email || '');
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Telegram link state
  const [telegramChatIdInput, setTelegramChatIdInput] = useState(currentUser?.telegramChatId || '');
  const [telegramUsernameInput, setTelegramUsernameInput] = useState(currentUser?.telegramUsername || '');
  const [telegramLinkCode, setTelegramLinkCode] = useState<string | null>(null);
  const [isLoadingTgCode, setIsLoadingTgCode] = useState(false);
  const [tgSaveMsg, setTgSaveMsg] = useState<string | null>(null);

  // Notification preferences state
  const [notifPrefs, setNotifPrefs] = useState({
    inApp: currentUser?.notifPreferences?.inApp ?? true,
    email: currentUser?.notifPreferences?.email ?? true,
    telegram: currentUser?.notifPreferences?.telegram ?? false,
    googleCalendar: currentUser?.notifPreferences?.googleCalendar ?? true,
  });
  const [prefSavedMsg, setPrefSavedMsg] = useState(false);

  if (!currentUser) {
    return (
      <div className="p-8 text-center text-slate-500">
        Silakan masuk terlebih dahulu untuk melihat profil Anda.
      </div>
    );
  }

  // Handle email update
  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailStatusMsg(null);
    if (!emailInput || !emailInput.includes('@')) {
      setEmailStatusMsg({ type: 'error', text: 'Format email tidak valid.' });
      return;
    }

    setIsSavingEmail(true);
    const res = updateUser(currentUser.id, { email: emailInput.trim() });
    setIsSavingEmail(false);

    if (res.success) {
      setEmailStatusMsg({ type: 'success', text: 'Alamat email dinas berhasil disimpan.' });
      setTimeout(() => setEmailStatusMsg(null), 3000);
    } else {
      setEmailStatusMsg({ type: 'error', text: res.message || 'Gagal menyimpan perubahan email.' });
    }
  };

  // Generate Telegram code
  const handleGenerateTelegramCode = async () => {
    setIsLoadingTgCode(true);
    try {
      const res = await fetch('/api/telegram/link-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, username: currentUser.username }),
      });
      if (res.ok) {
        const data = await res.json();
        setTelegramLinkCode(data.code);
      } else {
        // Fallback local code
        const code = `DSP_${currentUser.username.toUpperCase()}_${Math.floor(1000 + Math.random() * 9000)}`;
        setTelegramLinkCode(code);
      }
    } catch {
      const code = `DSP_${currentUser.username.toUpperCase()}_${Math.floor(1000 + Math.random() * 9000)}`;
      setTelegramLinkCode(code);
    } finally {
      setIsLoadingTgCode(false);
    }
  };

  // Save Telegram Manual Connection
  const handleSaveTelegram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!telegramChatIdInput.trim()) {
      alert('Masukkan Chat ID Telegram yang valid (angka ID akun Telegram Anda).');
      return;
    }
    connectTelegramUser(currentUser.id, telegramChatIdInput.trim(), telegramUsernameInput.trim() || undefined);
    setTgSaveMsg('Koneksi Telegram berhasil diperbarui!');
    setTimeout(() => setTgSaveMsg(null), 3000);
  };

  // Disconnect Telegram
  const handleDisconnectTelegram = () => {
    if (confirm('Apakah Anda yakin ingin memutuskan integrasi bot Telegram dengan akun ini?')) {
      disconnectTelegramUser(currentUser.id);
      setTelegramChatIdInput('');
      setTelegramUsernameInput('');
      setTelegramLinkCode(null);
    }
  };

  // Save Notification Preferences
  const handleTogglePreference = (channel: keyof typeof notifPrefs) => {
    const updated = {
      ...notifPrefs,
      [channel]: !notifPrefs[channel],
    };
    setNotifPrefs(updated);
    updateUserPreferences(currentUser.id, updated);
    setPrefSavedMsg(true);
    setTimeout(() => setPrefSavedMsg(false), 2500);
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const botUsername = telegramServerStatus.botUsername || 'DispersipBjmBot';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Top Banner Identity Card */}
      <div className="bg-[#0b1530] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          {/* Avatar with Initials */}
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white text-3xl font-extrabold shadow-lg shadow-blue-600/30 ring-4 ring-blue-500/30 shrink-0">
            {getInitials(currentUser.nama)}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                {currentUser.peran}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  currentUser.status === 'aktif'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}
              >
                Status: {currentUser.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
              </span>
              {currentUser.nip && (
                <span className="px-3 py-1 rounded-full text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  NIP: {currentUser.nip}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {currentUser.nama}
            </h1>
            <p className="text-blue-300 font-medium text-sm mt-1 flex items-center justify-center sm:justify-start gap-2">
              <Briefcase className="w-4 h-4 text-blue-400" />
              <span>{currentUser.jabatan}</span>
              <span className="text-blue-500">&bull;</span>
              <span>{currentUser.bidang || currentUser.unit}</span>
            </p>
            <p className="text-slate-400 text-xs mt-2 flex items-center justify-center sm:justify-start gap-2 font-mono">
              <AtSign className="w-3.5 h-3.5 text-slate-500" />
              <span>Username: {currentUser.username}</span>
              <span className="text-slate-600">&bull;</span>
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span>{currentUser.email}</span>
            </p>
          </div>

          {/* Quick Action: Logout & Password */}
          <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>Ubah Kata Sandi</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm('Apakah Anda ingin keluar dari akun?')) {
                  logout();
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar Akun</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Data Identitas Resmi Kedinasan */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Identitas Kedinasan</h2>
              <p className="text-xs text-slate-500">Data administratif resmi pegawai pemerintah</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Nama Lengkap dan Gelar
              </label>
              <div className="p-3 bg-slate-50 rounded-xl font-medium text-slate-800 border border-slate-200/80">
                {currentUser.nama}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  NIP Pegawai
                </label>
                <div className="p-3 bg-slate-50 rounded-xl font-mono text-slate-800 border border-slate-200/80">
                  {currentUser.nip || '-'}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Hak Akses / Role
                </label>
                <div className="p-3 bg-slate-50 rounded-xl font-semibold text-blue-700 border border-slate-200/80">
                  {currentUser.peran}
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Jabatan Struktural / Fungsional
              </label>
              <div className="p-3 bg-slate-50 rounded-xl font-medium text-slate-800 border border-slate-200/80">
                {currentUser.jabatan}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Bidang / Unit Kerja
              </label>
              <div className="p-3 bg-slate-50 rounded-xl font-medium text-slate-800 border border-slate-200/80">
                {currentUser.bidang || currentUser.unit}
              </div>
            </div>

            <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-[11px] text-blue-900 leading-relaxed">
              <span className="font-semibold">Catatan Administrasi:</span> Perubahan NIP, Jabatan, dan Hak Akses (Role) hanya dapat dilakukan oleh <span className="font-semibold text-blue-800">Administrator Sistem</span> melalui menu Manajemen Pengguna.
            </div>
          </div>
        </div>

        {/* Section 2: Edit Profil Yang Diizinkan (Email & Kontak) */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Ubah Profil Kontak</h2>
                <p className="text-xs text-slate-500">Alamat surel dinas untuk notifikasi dan penugasan</p>
              </div>
            </div>

            <form onSubmit={handleSaveEmail} className="space-y-4">
              {emailStatusMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    emailStatusMsg.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                      : 'bg-red-50 border border-red-300 text-red-800'
                  }`}
                >
                  {emailStatusMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  )}
                  <span>{emailStatusMsg.text}</span>
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Alamat Surel (Email) Dinas
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                    placeholder="nama@banjarmasinkota.go.id"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Surel digunakan untuk menerima disposisi baru, pengingat penugasan, dan pemulihan akun.
                </p>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Username Akun Login
                </label>
                <div className="p-3 bg-slate-100/80 rounded-xl font-mono text-xs text-slate-600 border border-slate-200">
                  {currentUser.username} (Permanen)
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingEmail}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingEmail ? 'Menyimpan...' : 'Simpan Perubahan Kontak'}</span>
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Keamanan Akun:</span>
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Ganti Kata Sandi Saya &rarr;</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section 3: Integrasi Telegram Bot Kedinasan */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Sambungkan Bot Telegram</h2>
              <p className="text-xs text-slate-500">
                Terima pemberitahuan penugasan dan disposisi instan langsung ke Telegram Anda
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                currentUser.telegramConnected || currentUser.telegramChatId
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {currentUser.telegramConnected || currentUser.telegramChatId ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tersambung (Chat ID: {currentUser.telegramChatId})</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Belum Tersambung</span>
                </>
              )}
            </span>
          </div>
        </div>

        {tgSaveMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{tgSaveMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Cara 1: Deep Link Bot dengan Kode Unik */}
          <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-200/80 space-y-3">
            <h3 className="font-bold text-sky-900 text-xs flex items-center gap-1.5">
              <span>Metode 1: Tautan Otomatis Bot (Direkomendasikan)</span>
            </h3>
            <p className="text-[11px] text-sky-800 leading-relaxed">
              Dapatkan kode penghubung akun kedinasan dan kirimkan ke bot Telegram Dispersip Kota Banjarmasin:
            </p>

            {telegramLinkCode ? (
              <div className="space-y-2">
                <div className="p-3 bg-white rounded-xl border border-sky-300 font-mono text-center text-sm font-bold text-sky-900 tracking-wider">
                  {telegramLinkCode}
                </div>
                <a
                  href={`https://t.me/${botUsername}?start=${telegramLinkCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Buka Bot Telegram (@{botUsername})</span>
                </a>
                <p className="text-[10px] text-sky-700 text-center">
                  Setelah menekan Mulai / Start di Telegram, akun Anda akan otomatis terhubung.
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGenerateTelegramCode}
                disabled={isLoadingTgCode}
                className="w-full py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isLoadingTgCode ? 'Membuat Kode...' : 'Buat Kode Penghubung Telegram'}</span>
              </button>
            )}
          </div>

          {/* Cara 2: Masukkan Chat ID Manual */}
          <form onSubmit={handleSaveTelegram} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <span>Metode 2: Masukkan Chat ID Manual</span>
            </h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Bila Anda sudah mengetahui ID Telegram Anda (misal dari @userinfobot), masukkan di sini:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">
                  Telegram Chat ID
                </label>
                <input
                  type="text"
                  value={telegramChatIdInput}
                  onChange={(e) => setTelegramChatIdInput(e.target.value)}
                  placeholder="Contoh: 123456789"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">
                  Username Telegram
                </label>
                <input
                  type="text"
                  value={telegramUsernameInput}
                  onChange={(e) => setTelegramUsernameInput(e.target.value)}
                  placeholder="@username"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Simpan Chat ID
              </button>
              {(currentUser.telegramConnected || currentUser.telegramChatId) && (
                <button
                  type="button"
                  onClick={handleDisconnectTelegram}
                  className="py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Putuskan
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Section 4: Preferensi Saluran Notifikasi */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between gap-4 mb-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Preferensi Saluran Notifikasi</h2>
              <p className="text-xs text-slate-500">Pilih media untuk menerima pemberitahuan kegiatan kedinasan</p>
            </div>
          </div>

          {prefSavedMsg && (
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1 border border-emerald-200 animate-in fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>Tersimpan otomatis</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* In-App */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-700 mt-0.5">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-slate-800">Notifikasi Dalam Aplikasi</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Lonceng notifikasi merah di bilah navigasi atas (Wajib aktif)
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notifPrefs.inApp}
              disabled
              className="mt-1 w-4 h-4 text-blue-600 rounded-sm cursor-not-allowed opacity-70"
            />
          </div>

          {/* Email */}
          <div className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 mt-0.5">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-slate-800">Surel (Email) Dinas</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Kirim salinan lembar disposisi dan jadwal penugasan ke alamat email Anda
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer mt-1">
              <input
                type="checkbox"
                checked={notifPrefs.email}
                onChange={() => handleTogglePreference('email')}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Google Calendar */}
          <div className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 mt-0.5">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-slate-800">Sinkronisasi Google Calendar</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tambahkan jadwal kegiatan otomatis ke kalender ponsel/Google Calendar Anda
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer mt-1">
              <input
                type="checkbox"
                checked={notifPrefs.googleCalendar}
                onChange={() => handleTogglePreference('googleCalendar')}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Telegram */}
          <div className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-sky-100 text-sky-700 mt-0.5">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-slate-800">Pemberitahuan Bot Telegram</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Peringatan pesan instan begitu pimpinan menyimpan lembar disposisi
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer mt-1">
              <input
                type="checkbox"
                checked={notifPrefs.telegram}
                onChange={() => handleTogglePreference('telegram')}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
};
