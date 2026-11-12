import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  User,
  UserRole,
  SuratMasuk,
  AgendaKegiatan,
  RiwayatAudit,
  EmailLog,
  SystemSettings,
  InAppNotification,
  DisposisiData,
  PegawaiTugasDisposisi,
} from '../types';
import {
  INITIAL_SETTINGS,
  INITIAL_USERS,
  INITIAL_SURAT_LIST,
  INITIAL_AGENDA_LIST,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
} from '../data/initialData';
import {
  formatTanggalTakAmbigu,
  getWitaTimestamp,
  generateNomorAgenda,
  hashPassword,
  isSuratOverdue,
} from '../utils/dateHelper';

interface AppContextType {
  // Auth
  currentUser: User | null;
  users: User[];
  login: (usernameOrEmail: string, passwordInput: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  changePassword: (newPass: string) => Promise<{ success: boolean; message?: string }>;
  resetDemoData: () => void;
  switchDemoRole: (role: 'Pimpinan' | 'Sekretariat' | 'Pegawai') => void;

  // Active navigation tab
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Surat
  suratList: SuratMasuk[];
  saveSurat: (data: Partial<SuratMasuk>, sendToPimpinan?: boolean) => { success: boolean; surat: SuratMasuk };
  updateSurat: (id: string, updates: Partial<SuratMasuk>) => void;
  sendToPimpinan: (suratId: string) => void;
  deleteSurat: (suratId: string) => void;
  restoreSurat: (suratId: string) => void;
  permanentDeleteSurat: (suratId: string) => void;
  archiveSurat: (suratId: string) => void;

  // Disposisi & Agenda (Core Rule: Agenda is ONLY formed when Disposisi is saved)
  agendaList: AgendaKegiatan[];
  submitDisposisi: (params: {
    suratId: string;
    instruksi: string;
    pegawaiIds: string[];
    batasWaktu?: string;
  }) => Promise<{ success: boolean; summary: string }>;
  confirmPenugasan: (agendaId: string) => void;
  retrySendNotification: (agendaId: string, pegawaiId: string, channel: 'email' | 'telegram' | 'calendar') => Promise<{ success: boolean; message?: string }>;

  // Notifications
  notifications: InAppNotification[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  unreadCount: number;

  // User & Profile Management
  addUser: (newUser: Omit<User, 'id' | 'failedAttempts' | 'lockedUntil'>) => { success: boolean; message?: string };
  updateUser: (id: string, updates: Partial<User>) => { success: boolean; message?: string };
  toggleUserStatus: (id: string) => void;
  adminResetPassword: (id: string, newPlainPass: string) => void;
  connectTelegramUser: (userId: string, chatId: string, username?: string) => void;
  disconnectTelegramUser: (userId: string) => void;
  updateUserPreferences: (userId: string, prefs: User['notifPreferences']) => void;

  // System Settings & Photo
  settings: SystemSettings;
  updateSettings: (updates: Partial<SystemSettings>) => void;
  updateBuildingPhoto: (photoUrl: string) => Promise<boolean>;

  // Audit Logs
  auditLogs: RiwayatAudit[];
  emailLogs: EmailLog[];

  // Service Status
  emailServerStatus: { configured: boolean; senderEmail: string | null; info: string };
  telegramServerStatus: { configured: boolean; botUsername: string; info: string };
  calendarServerStatus: { configured: boolean; info: string };
  refreshServiceStatuses: () => Promise<void>;
  sendTestEmail: (recipientEmail: string) => Promise<{ success: boolean; message: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'dispersip_bjm_users_v1',
  SURAT: 'dispersip_bjm_surat_v1',
  AGENDA: 'dispersip_bjm_agenda_v1',
  NOTIFICATIONS: 'dispersip_bjm_notif_v1',
  AUDIT: 'dispersip_bjm_audit_v1',
  SETTINGS: 'dispersip_bjm_settings_v1',
  SESSION: 'dispersip_bjm_session_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [suratList, setSuratList] = useState<SuratMasuk[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SURAT);
    return saved ? JSON.parse(saved) : INITIAL_SURAT_LIST;
  });

  const [agendaList, setAgendaList] = useState<AgendaKegiatan[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AGENDA);
    return saved ? JSON.parse(saved) : INITIAL_AGENDA_LIST;
  });

  const [notifications, setNotifications] = useState<InAppNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [auditLogs, setAuditLogs] = useState<RiwayatAudit[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);

  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_USERS.find((u) => u.id === 'usr_kepala_dinas') || INITIAL_USERS[2];
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const [emailServerStatus, setEmailServerStatus] = useState<{
    configured: boolean;
    senderEmail: string | null;
    info: string;
  }>({
    configured: false,
    senderEmail: null,
    info: 'Memeriksa status...',
  });

  const [telegramServerStatus, setTelegramServerStatus] = useState<{
    configured: boolean;
    botUsername: string;
    info: string;
  }>({
    configured: false,
    botUsername: 'DispersipBjmBot',
    info: 'Memeriksa status...',
  });

  const [calendarServerStatus, setCalendarServerStatus] = useState<{
    configured: boolean;
    info: string;
  }>({
    configured: false,
    info: 'Memeriksa status...',
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SURAT, JSON.stringify(suratList));
  }, [suratList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AGENDA, JSON.stringify(agendaList));
  }, [agendaList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
  }, [currentUser]);

  // Record Audit Trail
  const recordAudit = useCallback(
    (tindakan: string, keterangan: string, actorName?: string, actorRole?: string) => {
      const newEntry: RiwayatAudit = {
        id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        waktu: getWitaTimestamp(),
        penggunaNama: actorName || currentUser?.nama || 'Sistem Kedinasan',
        peran: actorRole || currentUser?.peran || 'Sistem',
        tindakan,
        keterangan,
      };
      setAuditLogs((prev) => [newEntry, ...prev]);
    },
    [currentUser]
  );

  // Refresh service statuses from backend
  const refreshServiceStatuses = useCallback(async () => {
    try {
      const emailRes = await fetch('/api/email/status');
      if (emailRes.ok) {
        const eData = await emailRes.json();
        setEmailServerStatus({
          configured: eData.configured,
          senderEmail: eData.senderEmail,
          info: eData.info,
        });
      }
    } catch {
      setEmailServerStatus({
        configured: false,
        senderEmail: null,
        info: 'Backend offline atau sedang memulai.',
      });
    }

    try {
      const tgRes = await fetch('/api/telegram/status');
      if (tgRes.ok) {
        const tgData = await tgRes.json();
        setTelegramServerStatus({
          configured: tgData.configured,
          botUsername: tgData.botUsername || 'DispersipBjmBot',
          info: tgData.info,
        });
      }
    } catch {
      setTelegramServerStatus({
        configured: false,
        botUsername: 'DispersipBjmBot',
        info: 'Backend offline.',
      });
    }

    try {
      const calRes = await fetch('/api/calendar/status');
      if (calRes.ok) {
        const cData = await calRes.json();
        setCalendarServerStatus({
          configured: cData.configured,
          info: cData.info,
        });
      }
    } catch {
      setCalendarServerStatus({
        configured: false,
        info: 'Backend offline.',
      });
    }
  }, []);

  useEffect(() => {
    refreshServiceStatuses();
  }, [refreshServiceStatuses]);

  // Inactivity auto logout after 30 minutes
  useEffect(() => {
    if (!currentUser) return;

    let timeoutId: any;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      // 30 minutes
      timeoutId = setTimeout(() => {
        recordAudit('Sesi Otomatis Berakhir', 'Keluar otomatis setelah 30 menit tidak aktif.');
        setCurrentUser(null);
      }, 30 * 60 * 1000);
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, [currentUser, recordAudit]);

  // Login handler: accepts username OR email
  const login = async (
    usernameOrEmail: string,
    passwordInput: string
  ): Promise<{ success: boolean; message?: string }> => {
    const cleanInput = usernameOrEmail.trim().toLowerCase();
    const targetUser = users.find(
      (u) => u.username.toLowerCase() === cleanInput || u.email.toLowerCase() === cleanInput
    );

    // Neutral error message required: "Username atau kata sandi salah"
    if (!targetUser) {
      return { success: false, message: 'Username atau kata sandi salah' };
    }

    if (targetUser.status !== 'aktif') {
      return { success: false, message: 'Akun Anda dinonaktifkan oleh Administrator.' };
    }

    // Check account lockout (5 failed attempts locks for 5 minutes)
    const now = Date.now();
    if (targetUser.lockedUntil && targetUser.lockedUntil > now) {
      const remainingSec = Math.ceil((targetUser.lockedUntil - now) / 1000);
      const remainingMin = Math.ceil(remainingSec / 60);
      return {
        success: false,
        message: `Akun terkunci karena 5 kali salah kata sandi. Coba lagi dalam ${remainingMin} menit (${remainingSec} detik).`,
      };
    }

    // Check hashed password
    const inputHash = hashPassword(passwordInput);
    if (targetUser.hashedPassword !== inputHash) {
      const attempts = (targetUser.failedAttempts || 0) + 1;
      let lockedUntil: number | undefined = undefined;

      if (attempts >= 5) {
        lockedUntil = now + 5 * 60 * 1000; // 5 minutes
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, failedAttempts: attempts, lockedUntil } : u))
      );

      recordAudit(
        'Gagal Login',
        `Percobaan salah kata sandi ke-${attempts} untuk akun: ${targetUser.nama}`,
        targetUser.nama,
        targetUser.peran
      );

      if (attempts >= 5) {
        return {
          success: false,
          message: 'Akun terkunci selama 5 menit karena 5 kali salah kata sandi berturut-turut.',
        };
      }

      return { success: false, message: 'Username atau kata sandi salah' };
    }

    // Successful login: reset failed attempts
    const updatedUser: User = {
      ...targetUser,
      failedAttempts: 0,
      lockedUntil: undefined,
      lastLogin: getWitaTimestamp(),
    };

    setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? updatedUser : u)));
    setCurrentUser(updatedUser);

    recordAudit('Login Berhasil', `Pengguna ${targetUser.nama} berhasil masuk ke sistem.`, targetUser.nama, targetUser.peran);

    // Navigate to role landing
    setActiveTab('dashboard');

    return { success: true };
  };

  const logout = () => {
    if (currentUser) {
      recordAudit('Keluar', `Pengguna ${currentUser.nama} keluar dari aplikasi.`);
    }
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const changePassword = async (newPass: string): Promise<{ success: boolean; message?: string }> => {
    if (!currentUser) return { success: false, message: 'Sesi tidak aktif.' };

    if (newPass.length < 8) {
      return { success: false, message: 'Kata sandi baru minimal 8 karakter.' };
    }
    if (!/[A-Za-z]/.test(newPass) || !/[0-9]/.test(newPass)) {
      return { success: false, message: 'Kata sandi harus memuat kombinasi huruf dan angka.' };
    }

    const newHashed = hashPassword(newPass);
    const updatedUser: User = {
      ...currentUser,
      hashedPassword: newHashed,
      isFirstLogin: false,
    };

    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    setCurrentUser(updatedUser);

    recordAudit('Ganti Kata Sandi', `Pengguna ${currentUser.nama} berhasil memperbarui kata sandi.`);
    return { success: true };
  };

  const resetDemoData = () => {
    setUsers(INITIAL_USERS);
    setSuratList(INITIAL_SURAT_LIST);
    setAgendaList(INITIAL_AGENDA_LIST);
    setNotifications(INITIAL_NOTIFICATIONS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setSettings(INITIAL_SETTINGS);
    localStorage.clear();
    recordAudit('Reset Demo', 'Administrator mengembalikan seluruh data contoh ke setelan awal.');
    alert('Data contoh demo berhasil diatur ulang.');
  };

  const switchDemoRole = useCallback(
    (targetRole: 'Pimpinan' | 'Sekretariat' | 'Pegawai') => {
      let targetUser: User | undefined;
      if (targetRole === 'Pimpinan') {
        targetUser = users.find((u) => u.peran === 'Pimpinan') || users[2];
      } else if (targetRole === 'Sekretariat') {
        targetUser = users.find((u) => u.peran === 'Staf Sekretariat') || users[1];
      } else {
        targetUser = users.find((u) => u.peran === 'Pegawai') || users[4];
      }
      if (targetUser) {
        setCurrentUser(targetUser);
        recordAudit(
          'Ganti Mode Demo',
          `Beralih ke mode demo peran ${targetRole} (${targetUser.nama}).`,
          targetUser.nama,
          targetUser.peran
        );
      }
    },
    [users, recordAudit]
  );

  // Surat Masuk Management
  const saveSurat = (data: Partial<SuratMasuk>, sendToPimpinan = false): { success: boolean; surat: SuratMasuk } => {
    const nextNomorAgenda = generateNomorAgenda(suratList.length, 2026);
    const nowIso = new Date().toISOString();
    const status = sendToPimpinan ? 'Menunggu Disposisi' : 'Diterima';

    const newSurat: SuratMasuk = {
      id: `srt_${Date.now()}`,
      nomorAgenda: nextNomorAgenda,
      nomorSurat: data.nomorSurat || 'Nomor Belum Terisi',
      pengirim: data.pengirim || data.asalInstansi || 'Instansi Pengirim',
      asalInstansi: data.asalInstansi || data.pengirim || 'Instansi Pengirim',
      perihal: data.perihal || 'Perihal Surat',
      tanggalSurat: data.tanggalSurat || nowIso.slice(0, 10),
      tanggalSuratTampilan: formatTanggalTakAmbigu(data.tanggalSurat || nowIso.slice(0, 10)),
      tanggalDiterima: nowIso.slice(0, 10),
      tanggalKegiatan: data.tanggalKegiatan || '',
      waktuKegiatan: data.waktuKegiatan || '09:00',
      tempatKegiatan: data.tempatKegiatan || 'Kota Banjarmasin',
      ringkasan: data.ringkasan || '',
      tingkatKeyakinan: data.tingkatKeyakinan || {},
      catatanAi: data.catatanAi || [],
      status,
      fileName: data.fileName || 'dokumen_surat.pdf',
      fileSize: data.fileSize || 100000,
      createdAt: nowIso,
      updatedAt: nowIso,
      isDeleted: false,
      isArchived: false,
    };

    setSuratList((prev) => [newSurat, ...prev]);

    // Note: Per Core Rule, agenda kegiatan HANYA terbentuk setelah pimpinan menyimpan disposisi!
    // So NO agenda item is created here.

    if (sendToPimpinan) {
      // Notify Pimpinan
      const pimpinanUsers = users.filter((u) => u.peran === 'Pimpinan');
      const newNotifs: InAppNotification[] = pimpinanUsers.map((p) => ({
        id: `notif_${Date.now()}_${p.id}`,
        userId: p.id,
        suratId: newSurat.id,
        nomorSurat: newSurat.nomorSurat,
        perihal: newSurat.perihal,
        tanggalKegiatan: newSurat.tanggalKegiatan || '-',
        waktuKegiatan: newSurat.waktuKegiatan || '-',
        tempatKegiatan: newSurat.tempatKegiatan || '-',
        catatanPimpinan: 'Surat masuk baru memerlukan telaah dan lembar disposisi pimpinan.',
        waktuNotif: getWitaTimestamp(),
        isRead: false,
        isConfirmed: false,
      }));
      setNotifications((prev) => [...newNotifs, ...prev]);
    }

    recordAudit(
      sendToPimpinan ? 'Kirim ke Pimpinan' : 'Simpan Surat Masuk',
      `Surat ${newSurat.nomorSurat} (${newSurat.pengirim}) berhasil didaftarkan. Nomor Agenda: ${newSurat.nomorAgenda}. Status: ${status}.`
    );

    return { success: true, surat: newSurat };
  };

  const updateSurat = (id: string, updates: Partial<SuratMasuk>) => {
    setSuratList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s))
    );
  };

  const sendToPimpinan = (suratId: string) => {
    const surat = suratList.find((s) => s.id === suratId);
    if (!surat) return;

    updateSurat(suratId, { status: 'Menunggu Disposisi' });

    // Notify Pimpinan
    const pimpinanUsers = users.filter((u) => u.peran === 'Pimpinan');
    const newNotifs: InAppNotification[] = pimpinanUsers.map((p) => ({
      id: `notif_${Date.now()}_${p.id}`,
      userId: p.id,
      suratId: surat.id,
      nomorSurat: surat.nomorSurat,
      perihal: surat.perihal,
      tanggalKegiatan: surat.tanggalKegiatan || '-',
      waktuKegiatan: surat.waktuKegiatan || '-',
      tempatKegiatan: surat.tempatKegiatan || '-',
      catatanPimpinan: 'Surat masuk menunggu disposisi pimpinan.',
      waktuNotif: getWitaTimestamp(),
      isRead: false,
      isConfirmed: false,
    }));
    setNotifications((prev) => [...newNotifs, ...prev]);

    recordAudit('Kirim ke Pimpinan', `Surat ${surat.nomorAgenda} diteruskan ke pimpinan untuk disposisi.`);
  };

  const deleteSurat = (suratId: string) => {
    setSuratList((prev) =>
      prev.map((s) =>
        s.id === suratId
          ? { ...s, isDeleted: true, deletedAt: new Date().toISOString(), status: 'Dihapus' }
          : s
      )
    );
    recordAudit('Pindah ke Sampah', `Surat ID ${suratId} dipindahkan ke Surat Terhapus (Sampah).`);
  };

  const restoreSurat = (suratId: string) => {
    setSuratList((prev) =>
      prev.map((s) =>
        s.id === suratId
          ? { ...s, isDeleted: false, deletedAt: undefined, status: s.disposisi ? 'Terdisposisi' : 'Menunggu Disposisi' }
          : s
      )
    );
    recordAudit('Pulihkan Surat', `Surat ID ${suratId} dipulihkan dari Sampah.`);
  };

  const permanentDeleteSurat = (suratId: string) => {
    setSuratList((prev) => prev.filter((s) => s.id !== suratId));
    setAgendaList((prev) => prev.filter((a) => a.suratId !== suratId));
    recordAudit('Hapus Permanen', `Surat ID ${suratId} dihapus permanen dari sistem.`);
  };

  const archiveSurat = (suratId: string) => {
    setSuratList((prev) =>
      prev.map((s) =>
        s.id === suratId
          ? { ...s, isArchived: true, archivedAt: new Date().toISOString(), status: 'Diarsipkan' }
          : s
      )
    );
    recordAudit('Arsipkan Surat', `Surat ID ${suratId} dipindahkan ke Arsip Digital.`);
  };

  // Submit Disposisi Pimpinan - CORE RULE: Agenda is ONLY created here!
  const submitDisposisi = async (params: {
    suratId: string;
    instruksi: string;
    pegawaiIds: string[];
    batasWaktu?: string;
  }): Promise<{ success: boolean; summary: string }> => {
    if (!currentUser || (currentUser.peran !== 'Pimpinan' && currentUser.peran !== 'Administrator')) {
      return { success: false, summary: 'Hanya Pimpinan yang berwenang menyimpan disposisi.' };
    }

    const surat = suratList.find((s) => s.id === params.suratId);
    if (!surat) {
      return { success: false, summary: 'Surat tidak ditemukan.' };
    }

    // Build assigned staff list
    const assignedStaff: PegawaiTugasDisposisi[] = [];
    for (const pid of params.pegawaiIds) {
      const u = users.find((usr) => usr.id === pid);
      if (u) {
        assignedStaff.push({
          pegawaiId: u.id,
          nama: u.nama,
          jabatan: u.jabatan,
          email: u.email,
          emailStatus: 'Menunggu',
          emailRetryCount: 0,
          telegramStatus: u.telegramConnected ? 'Menunggu' : 'Belum Terhubung',
          calendarStatus: 'Simulasi',
          isConfirmed: false,
        });
      }
    }

    if (assignedStaff.length === 0) {
      return { success: false, summary: 'Pilih minimal satu pegawai yang ditunjuk untuk disposisi.' };
    }

    const nowStr = getWitaTimestamp();
    const disposisiId = `dsp_${Date.now()}`;

    // 1. Update Surat status to 'Terdisposisi'
    const newDisposisi: DisposisiData = {
      id: disposisiId,
      suratId: surat.id,
      instruksi: params.instruksi,
      pegawaiDitunjuk: assignedStaff,
      batasWaktuTindakLanjut: params.batasWaktu,
      pimpinanId: currentUser.id,
      pimpinanNama: currentUser.nama,
      pimpinanPeran: currentUser.peran,
      tanggalDisposisi: nowStr,
      status: 'Disetujui',
    };

    // 2. CORE RULE: Agenda kegiatan HANYA terbentuk setelah pimpinan menyimpan disposisi!
    const cleanTanggal = surat.tanggalKegiatan || surat.tanggalSurat;
    const finalTanggal = cleanTanggal.includes('-') && cleanTanggal.split('-')[0].length === 2
      ? `${cleanTanggal.split('-')[2]}-${cleanTanggal.split('-')[1]}-${cleanTanggal.split('-')[0]}`
      : cleanTanggal;

    const agendaId = `agd_${Date.now()}`;
    const newAgenda: AgendaKegiatan = {
      id: agendaId,
      suratId: surat.id,
      nomorAgenda: surat.nomorAgenda,
      nomorSurat: surat.nomorSurat,
      pengirim: surat.pengirim || surat.asalInstansi,
      asalInstansi: surat.asalInstansi || surat.pengirim,
      perihal: surat.perihal,
      namaKegiatan: surat.perihal,
      tanggal: finalTanggal,
      tanggalTampilan: formatTanggalTakAmbigu(finalTanggal),
      jam: `${surat.waktuKegiatan || '09:00'} WITA`,
      tempat: surat.tempatKegiatan || 'Dispersip Kota Banjarmasin',
      ringkasan: surat.ringkasan,
      instruksiPimpinan: params.instruksi,
      batasWaktu: params.batasWaktu,
      pimpinanNama: currentUser.nama,
      isDefinitif: true,
      isDibatalkan: false,
      isDisetujui: true,
      pegawaiDitugaskan: assignedStaff.map((p) => {
        const u = users.find((usr) => usr.id === p.pegawaiId);
        return {
          pegawaiId: p.pegawaiId,
          nama: p.nama,
          email: p.email,
          jabatan: p.jabatan,
          bidang: u?.bidang,
          isConfirmed: false,
          emailStatus: 'Menunggu',
          telegramStatus: p.telegramStatus,
          calendarStatus: 'Simulasi',
        };
      }),
      createdAt: new Date().toISOString(),
    };

    // Add to Agenda List
    setAgendaList((prev) => [newAgenda, ...prev.filter((a) => a.suratId !== surat.id)]);

    // 3. Multi-channel notifications to each assigned employee
    let emailSuccess = 0;
    let telegramSuccess = 0;

    for (const staff of assignedStaff) {
      const u = users.find((usr) => usr.id === staff.pegawaiId);

      // (a) In-App Notification
      const inAppNotif: InAppNotification = {
        id: `notif_${Date.now()}_${staff.pegawaiId}`,
        userId: staff.pegawaiId,
        suratId: surat.id,
        agendaId,
        nomorSurat: surat.nomorSurat,
        perihal: surat.perihal,
        tanggalKegiatan: formatTanggalTakAmbigu(finalTanggal),
        waktuKegiatan: `${surat.waktuKegiatan || '09:00'} WITA`,
        tempatKegiatan: surat.tempatKegiatan || 'Dispersip Kota Banjarmasin',
        catatanPimpinan: params.instruksi,
        waktuNotif: nowStr,
        isRead: false,
        isConfirmed: false,
      };
      setNotifications((prev) => [inAppNotif, ...prev]);

      // (b) Email Notification via Backend
      if (settings.channelEmailEnabled) {
        try {
          const emailRes = await fetch('/api/kirim-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: staff.email,
              subject: `[Penugasan Kedinasan] ${surat.perihal.slice(0, 50)}`,
              pegawaiNama: staff.nama,
              nomorAgenda: surat.nomorAgenda,
              nomorSurat: surat.nomorSurat,
              asalInstansi: surat.asalInstansi,
              perihal: surat.perihal,
              namaKegiatan: surat.perihal,
              jadwalTanggal: formatTanggalTakAmbigu(finalTanggal, true),
              jadwalJam: surat.waktuKegiatan || '09:00',
              tempat: surat.tempatKegiatan || 'Dispersip Kota Banjarmasin',
              instruksiPimpinan: params.instruksi,
              batasWaktu: params.batasWaktu || '-',
              pimpinanNama: currentUser.nama,
            }),
          });
          const eData = await emailRes.json();
          if (emailRes.ok && eData.success) {
            emailSuccess++;
            staff.emailStatus = eData.mode === 'simulation' ? 'Simulasi' : 'Terkirim';
            staff.emailSentAt = nowStr;
            staff.emailRetryCount = 1;
          } else {
            staff.emailStatus = 'Gagal';
            staff.emailErrorReason = eData.error || 'Server menolak pengiriman';
          }
        } catch (err: any) {
          staff.emailStatus = 'Gagal';
          staff.emailErrorReason = err.message;
        }
      }

      // (c) Telegram Notification via Backend
      if (settings.channelTelegramEnabled && u?.telegramConnected && u.telegramChatId) {
        try {
          const tgRes = await fetch('/api/telegram/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chatId: u.telegramChatId,
              perihal: surat.perihal,
              namaKegiatan: surat.perihal,
              tanggal: formatTanggalTakAmbigu(finalTanggal, true),
              waktu: surat.waktuKegiatan || '09:00',
              tempat: surat.tempatKegiatan || 'Dispersip Kota Banjarmasin',
              nomorSurat: surat.nomorSurat,
              instruksi: params.instruksi,
              agendaId,
            }),
          });
          const tgData = await tgRes.json();
          if (tgRes.ok && tgData.success) {
            telegramSuccess++;
            staff.telegramStatus = tgData.mode === 'simulation' ? 'Simulasi' : 'Terkirim';
            staff.telegramSentAt = nowStr;
          }
        } catch {
          staff.telegramStatus = 'Gagal';
        }
      }

      // (d) Google Calendar Event via Backend
      if (settings.channelCalendarEnabled) {
        try {
          await fetch('/api/calendar/create-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              perihal: surat.perihal,
              tempat: surat.tempatKegiatan,
              tanggal: finalTanggal,
              waktu: surat.waktuKegiatan,
              nomorSurat: surat.nomorSurat,
              pengirim: surat.pengirim,
              instruksi: params.instruksi,
              pegawaiEmails: [staff.email],
            }),
          });
          staff.calendarStatus = 'Tersinkron';
        } catch {
          staff.calendarStatus = 'Simulasi';
        }
      }
    }

    const summaryStr = `Disposisi disimpan. Agenda resmi terbentuk. Notifikasi dikirim (${emailSuccess} Email, ${telegramSuccess} Telegram, In-App).`;
    newDisposisi.emailResultSummary = summaryStr;

    // Update Surat state
    setSuratList((prev) =>
      prev.map((s) =>
        s.id === surat.id
          ? {
              ...s,
              status: 'Terdisposisi',
              disposisi: newDisposisi,
              updatedAt: new Date().toISOString(),
            }
          : s
      )
    );

    recordAudit(
      'Simpan Disposisi',
      `Pimpinan (${currentUser.nama}) mendisposisikan surat ${surat.nomorAgenda}. Agenda kegiatan resmi terbentuk. Ditugaskan kepada: ${assignedStaff.map((p) => p.nama).join(', ')}.`
    );

    return { success: true, summary: summaryStr };
  };

  // Confirm Penugasan by Pegawai
  const confirmPenugasan = (agendaId: string) => {
    if (!currentUser) return;
    const nowStr = getWitaTimestamp();

    setAgendaList((prev) =>
      prev.map((a) => {
        if (a.id === agendaId) {
          const updatedStaff = a.pegawaiDitugaskan.map((p) =>
            p.pegawaiId === currentUser.id
              ? { ...p, isConfirmed: true, confirmedAt: nowStr }
              : p
          );
          return { ...a, pegawaiDitugaskan: updatedStaff };
        }
        return a;
      })
    );

    // Update Surat and In-App notification
    setSuratList((prev) =>
      prev.map((s) => {
        const agd = agendaList.find((a) => a.id === agendaId);
        if (agd && agd.suratId === s.id && s.disposisi) {
          const updatedStaff = s.disposisi.pegawaiDitunjuk.map((p) =>
            p.pegawaiId === currentUser.id
              ? { ...p, isConfirmed: true, confirmedAt: nowStr }
              : p
          );
          const allConfirmed = updatedStaff.every((p) => p.isConfirmed);
          return {
            ...s,
            status: allConfirmed ? 'Dikonfirmasi' : s.status,
            disposisi: {
              ...s.disposisi,
              pegawaiDitunjuk: updatedStaff,
            },
          };
        }
        return s;
      })
    );

    setNotifications((prev) =>
      prev.map((n) =>
        n.agendaId === agendaId && n.userId === currentUser.id
          ? { ...n, isConfirmed: true, confirmedAt: nowStr, isRead: true }
          : n
      )
    );

    recordAudit(
      'Konfirmasi Penugasan',
      `Pegawai ${currentUser.nama} menekan "Konfirmasi Telah Mengetahui" penugasan kegiatan.`
    );
  };

  // Retry sending notification
  const retrySendNotification = async (
    agendaId: string,
    pegawaiId: string,
    channel: 'email' | 'telegram' | 'calendar'
  ): Promise<{ success: boolean; message?: string }> => {
    const agenda = agendaList.find((a) => a.id === agendaId);
    if (!agenda) return { success: false, message: 'Agenda tidak ditemukan.' };
    const staff = agenda.pegawaiDitugaskan.find((p) => p.pegawaiId === pegawaiId);
    if (!staff) return { success: false, message: 'Pegawai tidak ditemukan pada agenda ini.' };
    const userTarget = users.find((u) => u.id === pegawaiId);

    if (channel === 'email') {
      try {
        const emailRes = await fetch('/api/kirim-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: staff.email,
            subject: `[Kirim Ulang Penugasan] ${agenda.perihal}`,
            pegawaiNama: staff.nama,
            nomorAgenda: agenda.nomorAgenda,
            nomorSurat: agenda.nomorSurat,
            asalInstansi: agenda.asalInstansi,
            perihal: agenda.perihal,
            namaKegiatan: agenda.namaKegiatan,
            jadwalTanggal: agenda.tanggalTampilan,
            jadwalJam: agenda.jam,
            tempat: agenda.tempat,
            instruksiPimpinan: agenda.instruksiPimpinan || '-',
            batasWaktu: agenda.batasWaktu || '-',
            pimpinanNama: agenda.pimpinanNama || 'Kepala Dinas',
          }),
        });
        const eData = await emailRes.json();
        if (emailRes.ok && eData.success) {
          recordAudit('Kirim Ulang Email', `Berhasil kirim ulang notifikasi email ke ${staff.email}.`);
          return { success: true, message: 'Email penugasan berhasil dikirim ulang.' };
        }
        return { success: false, message: eData.error || 'Gagal mengirim email.' };
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    } else if (channel === 'telegram') {
      if (!userTarget?.telegramConnected || !userTarget.telegramChatId) {
        return { success: false, message: 'Pegawai belum menghubungkan akun Telegram.' };
      }
      try {
        const tgRes = await fetch('/api/telegram/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: userTarget.telegramChatId,
            perihal: agenda.perihal,
            namaKegiatan: agenda.namaKegiatan,
            tanggal: agenda.tanggalTampilan,
            waktu: agenda.jam,
            tempat: agenda.tempat,
            nomorSurat: agenda.nomorSurat,
            instruksi: agenda.instruksiPimpinan,
            agendaId: agenda.id,
          }),
        });
        const tgData = await tgRes.json();
        if (tgRes.ok && tgData.success) {
          recordAudit('Kirim Ulang Telegram', `Berhasil kirim ulang pesan Telegram ke ${staff.nama}.`);
          return { success: true, message: 'Pesan Telegram berhasil dikirim ulang.' };
        }
        return { success: false, message: tgData.error || 'Gagal kirim Telegram.' };
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    }

    return { success: true, message: 'Status saluran diperbarui.' };
  };

  // Notification read handlers
  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    if (!currentUser) return;
    setNotifications((prev) =>
      prev.map((n) => (n.userId === currentUser.id ? { ...n, isRead: true } : n))
    );
  };

  const unreadCount = useMemo(() => {
    if (!currentUser) return 0;
    return notifications.filter((n) => n.userId === currentUser.id && !n.isRead).length;
  }, [notifications, currentUser]);

  // Admin User Management
  const addUser = (
    newUser: Omit<User, 'id' | 'failedAttempts' | 'lockedUntil'>
  ): { success: boolean; message?: string } => {
    if (users.some((u) => u.username.toLowerCase() === newUser.username.toLowerCase())) {
      return { success: false, message: 'Username sudah digunakan oleh akun lain.' };
    }
    if (users.some((u) => u.email.toLowerCase() === newUser.email.toLowerCase())) {
      return { success: false, message: 'Email sudah terdaftar untuk pengguna lain.' };
    }

    const created: User = {
      ...newUser,
      id: `usr_${Date.now()}`,
      status: 'aktif',
      isFirstLogin: true,
      telegramConnected: false,
      notifPreferences: { email: true, googleCalendar: true, telegram: true, inApp: true },
    };

    setUsers((prev) => [...prev, created]);
    recordAudit('Tambah Pengguna', `Administrator menambahkan akun: ${created.nama} (${created.peran})`);
    return { success: true };
  };

  const updateUser = (id: string, updates: Partial<User>): { success: boolean; message?: string } => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
    if (currentUser?.id === id) {
      setCurrentUser((prev) => (prev ? { ...prev, ...updates } : null));
    }
    recordAudit('Ubah Data Pengguna', `Administrator memperbarui akun ID: ${id}`);
    return { success: true };
  };

  const toggleUserStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const newStatus = u.status === 'aktif' ? 'nonaktif' : 'aktif';
          recordAudit('Ubah Status Akun', `Mengubah status ${u.nama} menjadi: ${newStatus}`);
          return { ...u, status: newStatus };
        }
        return u;
      })
    );
  };

  const adminResetPassword = (id: string, newPlainPass: string) => {
    const hashed = hashPassword(newPlainPass);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, hashedPassword: hashed, failedAttempts: 0, lockedUntil: undefined, isFirstLogin: true }
          : u
      )
    );
    recordAudit('Reset Kata Sandi Akun', `Administrator mereset kata sandi akun ID: ${id}. Pengguna wajib mengganti kata sandi saat login.`);
  };

  const connectTelegramUser = (userId: string, chatId: string, username?: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, telegramConnected: true, telegramChatId: chatId, telegramUsername: username }
          : u
      )
    );
    if (currentUser?.id === userId) {
      setCurrentUser((prev) =>
        prev
          ? { ...prev, telegramConnected: true, telegramChatId: chatId, telegramUsername: username }
          : null
      );
    }
    recordAudit('Hubungkan Telegram', `Pengguna ID ${userId} berhasil menghubungkan akun Telegram.`);
  };

  const disconnectTelegramUser = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, telegramConnected: false, telegramChatId: undefined, telegramUsername: undefined }
          : u
      )
    );
    if (currentUser?.id === userId) {
      setCurrentUser((prev) =>
        prev
          ? { ...prev, telegramConnected: false, telegramChatId: undefined, telegramUsername: undefined }
          : null
      );
    }
    recordAudit('Putuskan Telegram', `Pengguna ID ${userId} memutuskan sambungan Telegram.`);
  };

  const updateUserPreferences = (userId: string, prefs: User['notifPreferences']) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, notifPreferences: prefs } : u)));
    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, notifPreferences: prefs } : null));
    }
  };

  // Settings
  const updateSettings = (updates: Partial<SystemSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
    recordAudit('Ubah Pengaturan Notifikasi', 'Administrator memperbarui konfigurasi sistem.');
  };

  const updateBuildingPhoto = async (photoUrl: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/config/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl }),
      });
      if (res.ok) {
        setSettings((prev) => ({ ...prev, buildingPhotoUrl: photoUrl }));
        recordAudit('Ganti Foto Gedung', 'Administrator memperbarui foto Gedung Dispersip Banjarmasin.');
        return true;
      }
      return false;
    } catch {
      setSettings((prev) => ({ ...prev, buildingPhotoUrl: photoUrl }));
      return true;
    }
  };

  const sendTestEmail = async (recipientEmail: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: recipientEmail }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        recordAudit('Uji Email', `Uji pengiriman email ke ${recipientEmail} berhasil (${data.mode}).`);
        return {
          success: true,
          message: data.mode === 'simulation'
            ? 'Email uji berhasil diproses dalam Mode Simulasi Server.'
            : 'Email uji berhasil dikirim ke kotak masuk Gmail Anda!',
        };
      }
      return { success: false, message: data.error || 'Pengujian email gagal.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Koneksi backend gagal.' };
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        login,
        logout,
        changePassword,
        resetDemoData,
        switchDemoRole,

        activeTab,
        setActiveTab,

        suratList,
        saveSurat,
        updateSurat,
        sendToPimpinan,
        deleteSurat,
        restoreSurat,
        permanentDeleteSurat,
        archiveSurat,

        agendaList,
        submitDisposisi,
        confirmPenugasan,
        retrySendNotification,

        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        unreadCount,

        addUser,
        updateUser,
        toggleUserStatus,
        adminResetPassword,
        connectTelegramUser,
        disconnectTelegramUser,
        updateUserPreferences,

        settings,
        updateSettings,
        updateBuildingPhoto,

        auditLogs,
        emailLogs,

        emailServerStatus,
        telegramServerStatus,
        calendarServerStatus,
        refreshServiceStatuses,
        sendTestEmail,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
