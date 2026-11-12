export type UserRole =
  | 'Administrator'
  | 'Staf Sekretariat'
  | 'Pimpinan'
  | 'Pegawai'
  | 'Admin'
  | 'Petugas';

export interface User {
  id: string;
  nama: string; // Nama lengkap beserta gelar
  nip?: string;
  peran: UserRole;
  email: string;
  jabatan: string;
  unit: string;
  bidang: string;
  username: string;
  status: 'aktif' | 'nonaktif';
  hashedPassword: string;
  isFirstLogin?: boolean;
  emailConfirmedByPegawai?: boolean;
  telegramConnected?: boolean;
  telegramChatId?: string;
  telegramUsername?: string;
  notifPreferences?: {
    email: boolean;
    googleCalendar: boolean;
    telegram: boolean;
    inApp: boolean;
  };
  failedAttempts?: number;
  lockedUntil?: number;
  lastLogin?: string;
}

export type TingkatKeyakinan = 'tinggi' | 'sedang' | 'rendah';

export interface GeminiConfidenceMap {
  nomor_surat: TingkatKeyakinan;
  pengirim: TingkatKeyakinan;
  perihal: TingkatKeyakinan;
  tanggal_kegiatan: TingkatKeyakinan;
  waktu_kegiatan: TingkatKeyakinan;
  tempat_kegiatan: TingkatKeyakinan;
  ringkasan: TingkatKeyakinan;
  [key: string]: TingkatKeyakinan;
}

export interface GeminiExtractedData {
  nomor_surat: string;
  pengirim: string;
  perihal: string;
  tanggal_kegiatan: string; // DD-MM-YYYY
  waktu_kegiatan: string; // 24 jam, WITA
  tempat_kegiatan: string;
  ringkasan: string; // maksimal 3 kalimat
  tingkat_keyakinan: GeminiConfidenceMap;
  catatan: string;
}

export type StatusSurat =
  | 'Diterima'
  | 'Menunggu Disposisi'
  | 'Terdisposisi'
  | 'Dikonfirmasi'
  | 'Dihapus'
  | 'Diarsipkan'
  | 'Menunggu Verifikasi'
  | 'Sudah Didisposisi'
  | 'Sudah Dikonfirmasi'
  | 'Dibatalkan';

export interface PegawaiTugasDisposisi {
  pegawaiId: string;
  nama: string;
  jabatan: string;
  email: string;
  emailStatus: 'Menunggu' | 'Terkirim' | 'Gagal' | 'Simulasi';
  emailSentAt?: string;
  emailErrorReason?: string;
  emailRetryCount: number;
  telegramStatus?: 'Menunggu' | 'Terkirim' | 'Gagal' | 'Simulasi' | 'Belum Terhubung';
  telegramSentAt?: string;
  telegramErrorReason?: string;
  calendarStatus?: 'Tersinkron' | 'Gagal' | 'Simulasi';
  isConfirmed: boolean;
  confirmedAt?: string;
}

export interface DisposisiData {
  id: string;
  suratId: string;
  instruksi: string;
  pegawaiDitunjuk: PegawaiTugasDisposisi[];
  batasWaktuTindakLanjut?: string;
  pimpinanId: string;
  pimpinanNama: string;
  pimpinanPeran: string;
  tanggalDisposisi: string;
  status: 'Disetujui' | 'Ditolak/Dibatalkan';
  emailResultSummary?: string;
}

export interface SuratMasuk {
  id: string;
  nomorAgenda: string;
  nomorSurat: string;
  pengirim: string;
  asalInstansi: string;
  perihal: string;
  tanggalSurat: string;
  tanggalSuratTampilan: string;
  tanggalDiterima: string;
  tanggalKegiatan?: string;
  waktuKegiatan?: string;
  tempatKegiatan?: string;
  ringkasan: string;
  tingkatKeyakinan?: Partial<GeminiConfidenceMap>;
  catatanAi?: string[];
  status: StatusSurat;
  isDeleted?: boolean;
  deletedAt?: string;
  isArchived?: boolean;
  archivedAt?: string;
  fileName: string;
  fileMime?: string;
  fileSize?: number;
  filePreviewUrl?: string;
  disposisi?: DisposisiData;
  createdAt: string;
  updatedAt: string;
  // Legacy compatibility fields
  penandatanganNama?: string;
  penandatanganJabatan?: string;
  tujuanSurat?: string;
  sifatSurat?: 'Biasa' | 'Penting' | 'Segera' | 'Sangat Segera' | 'Rahasia';
  klasifikasiKategori?: 'Undangan' | 'Pemberitahuan' | 'Permohonan' | 'Edaran' | 'Laporan' | 'Lainnya';
  ringkasanIsi?: string;
  keteranganLampiran?: string;
  mengandungKegiatan?: boolean;
  kegiatan?: {
    namaKegiatan: string;
    tanggalMulai: string;
    tanggalSelesai: string;
    hari: string;
    jamMulai: string;
    jamSelesai: string;
    tempat: string;
    keteranganWaktu: string;
    ketentuanPeserta: string;
  };
  jadwalDinasLampiran?: any[];
  perluVerifikasi?: any[];
  isVerifiedByPetugas?: boolean;
  verifiedByPetugasNama?: string;
  verifiedAt?: string;
}

export interface AgendaKegiatan {
  id: string;
  suratId: string;
  nomorAgenda: string;
  nomorSurat: string;
  pengirim: string;
  asalInstansi: string;
  perihal: string;
  namaKegiatan: string;
  tanggal: string; // YYYY-MM-DD
  tanggalTampilan: string;
  jam: string; // WITA
  tempat: string;
  ringkasan?: string;
  instruksiPimpinan?: string;
  batasWaktu?: string;
  pimpinanNama?: string;
  isDisetujui?: boolean;
  isDefinitif: boolean;
  isDibatalkan: boolean;
  isRahasia?: boolean;
  googleCalendarEventId?: string;
  createdAt?: string;
  pegawaiDitugaskan: Array<{
    pegawaiId: string;
    nama: string;
    email: string;
    jabatan?: string;
    bidang?: string;
    isConfirmed: boolean;
    confirmedAt?: string;
    emailStatus: 'Menunggu' | 'Terkirim' | 'Gagal' | 'Simulasi';
    telegramStatus?: 'Menunggu' | 'Terkirim' | 'Gagal' | 'Simulasi' | 'Belum Terhubung';
    calendarStatus?: 'Tersinkron' | 'Gagal' | 'Simulasi';
  }>;
}

export interface InAppNotification {
  id: string;
  userId: string;
  suratId: string;
  agendaId?: string;
  nomorSurat: string;
  perihal: string;
  tanggalKegiatan: string;
  waktuKegiatan: string;
  tempatKegiatan: string;
  catatanPimpinan: string;
  waktuNotif: string;
  isRead: boolean;
  isConfirmed: boolean;
  confirmedAt?: string;
}

export interface RiwayatAudit {
  id: string;
  waktu: string;
  penggunaNama: string;
  peran: string;
  tindakan: string;
  keterangan: string;
}

export interface EmailLog {
  id: string;
  suratId: string;
  nomorAgenda: string;
  recipientEmail: string;
  recipientNama: string;
  subject: string;
  status: 'Terkirim' | 'Gagal' | 'Menunggu' | 'Simulasi';
  errorReason?: string;
  sentAt: string;
  retryCount: number;
}

export interface SystemSettings {
  pengingatDisposisiHariKerja: number;
  batasWaktuKonfirmasiJamKerja: number;
  instansiNama: string;
  instansiSub: string;
  instansiAlamat: string;
  instansiKontak: string;
  pimpinanNama: string;
  pimpinanNip: string;
  telegramBotUsername: string;
  telegramGroupChatId?: string;
  defaultEventDurationHours: number;
  channelEmailEnabled: boolean;
  channelTelegramEnabled: boolean;
  channelCalendarEnabled: boolean;
  channelInAppEnabled: boolean;
  buildingPhotoUrl?: string;
}
