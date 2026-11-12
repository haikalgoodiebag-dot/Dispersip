import React, { useState } from 'react';
import {
  Settings,
  Mail,
  Send,
  Calendar,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const PengaturanNotifikasiPage: React.FC = () => {
  const {
    settings,
    updateSettings,
    emailServerStatus,
    telegramServerStatus,
    calendarServerStatus,
    sendTestEmail,
    currentUser,
  } = useApp();

  const [testEmailAddress, setTestEmailAddress] = useState(currentUser?.email || 'admin.contoh@gmail.com');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestSending(true);
    setTestResult(null);

    const res = await sendTestEmail(testEmailAddress);
    setTestResult(res);
    setTestSending(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold font-mono uppercase mb-1.5">
            <Settings className="w-3.5 h-3.5 text-blue-600" />
            <span>Konfigurasi Integrasi &bull; Administrator</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Pengaturan Saluran Notifikasi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Atur status koneksi dan parameter otomatisasi pengiriman pemberitahuan penugasan kedinasan ke Email, Kalender, dan Telegram.
          </p>
        </div>
      </div>

      {/* 3 Status Cards for Services */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Email Status */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase font-mono">Email (Gmail)</h3>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                emailServerStatus.configured
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                  : 'bg-amber-50 text-amber-800 border border-amber-300'
              }`}
            >
              {emailServerStatus.configured ? 'Terkonfigurasi' : 'Belum Terkonfigurasi'}
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {emailServerStatus.info}
          </p>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Status Saluran:</span>
            <label className="flex items-center gap-1.5 font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={settings.channelEmailEnabled}
                onChange={(e) => updateSettings({ channelEmailEnabled: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span>{settings.channelEmailEnabled ? 'Aktif' : 'Nonaktif'}</span>
            </label>
          </div>
        </div>

        {/* Telegram Status */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-sky-500" />
              <h3 className="text-xs font-bold text-slate-900 uppercase font-mono">Telegram Bot</h3>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                telegramServerStatus.configured
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                  : 'bg-amber-50 text-amber-800 border border-amber-300'
              }`}
            >
              {telegramServerStatus.configured ? 'Terkonfigurasi' : 'Belum Terkonfigurasi'}
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {telegramServerStatus.info}
          </p>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Status Saluran:</span>
            <label className="flex items-center gap-1.5 font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={settings.channelTelegramEnabled}
                onChange={(e) => updateSettings({ channelTelegramEnabled: e.target.checked })}
                className="w-4 h-4 text-sky-500 rounded"
              />
              <span>{settings.channelTelegramEnabled ? 'Aktif' : 'Nonaktif'}</span>
            </label>
          </div>
        </div>

        {/* Google Calendar Status */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase font-mono">Google Kalender</h3>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                calendarServerStatus.configured
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                  : 'bg-amber-50 text-amber-800 border border-amber-300'
              }`}
            >
              {calendarServerStatus.configured ? 'Terkonfigurasi' : 'Belum Terkonfigurasi'}
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {calendarServerStatus.info}
          </p>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Status Saluran:</span>
            <label className="flex items-center gap-1.5 font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={settings.channelCalendarEnabled}
                onChange={(e) => updateSettings({ channelCalendarEnabled: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span>{settings.channelCalendarEnabled ? 'Aktif' : 'Nonaktif'}</span>
            </label>
          </div>
        </div>
      </div>

      {/* Timing and General Parameters */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 uppercase font-mono">
          Parameter Pengingat &amp; Kalender Dinas
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Batas Peringatan Disposisi Pimpinan
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={5}
                value={settings.pengingatDisposisiHariKerja}
                onChange={(e) =>
                  updateSettings({ pengingatDisposisiHariKerja: parseInt(e.target.value, 10) || 1 })
                }
                className="w-24 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold"
              />
              <span className="text-slate-600">Hari Kerja (&gt;1 hari = merah)</span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Durasi Default Kegiatan (Bila Jam Selesai Ambigu)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={8}
                value={settings.defaultEventDurationHours}
                onChange={(e) =>
                  updateSettings({ defaultEventDurationHours: parseInt(e.target.value, 10) || 2 })
                }
                className="w-24 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold"
              />
              <span className="text-slate-600">Jam (Default 2 Jam)</span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Grup Telegram Dinas (Ringkasan Harian)
            </label>
            <input
              type="text"
              value={settings.telegramGroupChatId || ''}
              onChange={(e) => updateSettings({ telegramGroupChatId: e.target.value })}
              placeholder="@dispersip_bjm_kegiatan"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Test Email Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 uppercase font-mono">
          Uji Coba Pengiriman Notifikasi Email
        </h3>
        <p className="text-xs text-slate-500">
          Uji coba pengiriman email konfirmasi ke alamat aparatur sipil negara untuk memverifikasi kesiapan pengiriman penugasan.
        </p>

        <form onSubmit={handleTestEmail} className="flex flex-col sm:flex-row gap-3 max-w-lg">
          <input
            type="email"
            value={testEmailAddress}
            onChange={(e) => setTestEmailAddress(e.target.value)}
            placeholder="nama@gmail.com"
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono"
            required
          />
          <button
            type="submit"
            disabled={testSending}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {testSending ? <span>Mengirim Uji...</span> : <span>Kirim Email Tes</span>}
          </button>
        </form>

        {testResult && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 max-w-lg ${
              testResult.success
                ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                : 'bg-red-50 border border-red-300 text-red-800'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}
      </div>

      {/* Setup Instructions for Non-Configured Services */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <Info className="w-4 h-4 text-blue-600" />
          <span>Panduan Konfigurasi Kredensial Saluran (Backend Environment)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1.5">
            <p className="font-bold text-slate-900">1. Konfigurasi Gmail SMTP Server:</p>
            <p>Tambahkan variabel berikut pada file .env di server:</p>
            <pre className="bg-slate-100 p-2 rounded-lg text-[11px] font-mono text-slate-800 overflow-x-auto">
              GMAIL_USER=dispersip.bjm@gmail.com&#10;GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
            </pre>
            <p className="text-[11px] text-slate-500">
              Gunakan App Password resmi dari akun Google Dinas Anda.
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1.5">
            <p className="font-bold text-slate-900">2. Konfigurasi Telegram Bot API:</p>
            <p>Buat bot baru melalui @BotFather di Telegram lalu tambahkan:</p>
            <pre className="bg-slate-100 p-2 rounded-lg text-[11px] font-mono text-slate-800 overflow-x-auto">
              TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57&#10;TELEGRAM_BOT_USERNAME=DispersipBjmBot
            </pre>
            <p className="text-[11px] text-slate-500">
              Pegawai menautkan akun dengan membuka t.me/BotName?start=KODE_UNIK di menu Profil Saya.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
