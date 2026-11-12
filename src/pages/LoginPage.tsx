import React, { useState } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  User as UserIcon,
  ShieldAlert,
  ArrowRight,
  BookOpen,
  Info,
  CheckCircle2,
  Building,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LoginPage: React.FC = () => {
  const { users, login } = useApp();

  const [usernameOrEmail, setUsernameOrEmail] = useState<string>('petugas');
  const [password, setPassword] = useState<string>('Petugas#2026');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [lockCountdown, setLockCountdown] = useState<number | null>(null);

  // Quick preset accounts for evaluation
  const demoAccounts = [
    { label: 'Petugas / Staf', username: 'petugas', pass: 'Petugas#2026', role: 'Staf Sekretariat' },
    { label: 'Kepala Dinas', username: 'pimpinan', pass: 'Pimpinan#2026', role: 'Pimpinan' },
    { label: 'Sekretaris Dinas', username: 'sekretaris', pass: 'Sekretaris#2026', role: 'Pimpinan' },
    { label: 'Pegawai 1 (Hj. Siti)', username: 'pegawai1', pass: 'Pegawai1#2026', role: 'Pegawai' },
    { label: 'Pegawai 2 (Ahmad)', username: 'pegawai2', pass: 'Pegawai2#2026', role: 'Pegawai' },
    { label: 'Administrator', username: 'admin', pass: 'Admin#2026', role: 'Administrator' },
  ];

  const handleSelectPreset = (acc: typeof demoAccounts[0]) => {
    setUsernameOrEmail(acc.username);
    setPassword(acc.pass);
    setErrorMessage('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!usernameOrEmail.trim()) {
      setErrorMessage('Kolom username atau email wajib diisi.');
      return;
    }

    if (!password) {
      setErrorMessage('Kolom kata sandi wajib diisi.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(usernameOrEmail.trim(), password);
      if (!res.success) {
        setErrorMessage(res.message || 'Username atau kata sandi salah');
      }
    } catch {
      setErrorMessage('Terjadi gangguan saat memverifikasi akun.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070d1e] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0f1d3f] via-[#070d1e] to-[#03060f] text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 select-none font-sans">
      {/* Brand Header */}
      <div className="text-center mb-6 max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-xl shadow-blue-600/30 border border-blue-400/30 mb-3">
          <BookOpen className="w-8 h-8 text-amber-300" />
        </div>
        <p className="text-xs font-bold tracking-widest text-blue-400 uppercase font-mono">
          PEMERINTAH KOTA BANJARMASIN
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
          Agenda Kegiatan
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 font-medium mt-0.5">
          Dinas Perpustakaan dan Kearsipan Kota Banjarmasin
        </p>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-[#0d1730]/95 backdrop-blur-md border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle accent glow */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="mb-5 pb-3 border-b border-slate-800/80">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-400" />
            <span>Masuk ke Sistem Kedinasan</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gunakan username atau alamat surel kedinasan resmi Anda.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold">{errorMessage}</span>
                {lockCountdown !== null && lockCountdown > 0 && (
                  <p className="text-[11px] text-red-300 mt-1 font-mono">
                    Hitung mundur pembukaan kunci: {Math.floor(lockCountdown / 60)}m {lockCountdown % 60}s
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Username / Email Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Username atau Alamat Surel
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={usernameOrEmail}
                onChange={(e) => {
                  setUsernameOrEmail(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="Contoh: petugas atau email@banjarmasinkota.go.id"
                autoComplete="username"
                required
                className="w-full bg-[#132247] border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-sans"
              />
            </div>
          </div>

          {/* Password Input with Show/Hide toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Kata Sandi
              </label>
            </div>

            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="Masukkan kata sandi akun"
                autoComplete="current-password"
                required
                className="w-full bg-[#132247] border border-slate-700/80 rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-sans"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                aria-label="Tampilkan atau sembunyikan kata sandi"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-40 disabled:cursor-not-allowed mt-2 cursor-pointer"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Memverifikasi...</span>
              </div>
            ) : (
              <>
                <span>Masuk ke Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Testing Presets for Evaluator */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <span>Pilih Cepat Akun Uji Coba:</span>
            <span className="text-[10px] text-blue-400 font-mono">Klik untuk isi</span>
          </p>

          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map((acc) => (
              <button
                key={acc.username}
                type="button"
                onClick={() => handleSelectPreset(acc)}
                className={`p-2 rounded-xl text-left transition-all border text-xs cursor-pointer ${
                  usernameOrEmail === acc.username
                    ? 'bg-blue-600/20 border-blue-500 text-blue-200 font-semibold shadow-sm'
                    : 'bg-[#101b38] border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="font-bold truncate text-[11px]">{acc.label}</div>
                <div className="text-[10px] text-slate-400 font-mono truncate">{acc.role}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-slate-500 mt-6 font-medium">
        Sekretariat Dinas Perpustakaan dan Kearsipan Kota Banjarmasin &bull; Zona Waktu WITA (UTC+8)
      </p>
    </div>
  );
};
