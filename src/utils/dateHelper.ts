const NAMA_BULAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const NAMA_HARI = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

/**
 * Format date into unambiguous Indonesian format (e.g. "12 November 2026")
 */
export function formatTanggalTakAmbigu(
  input: string | Date | undefined | null,
  withDayName = false
): string {
  if (!input) return '-';

  let date: Date;

  if (typeof input === 'string') {
    if (input.includes('-') || input.includes('/')) {
      const parts = input.split(/[-/]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          // YYYY-MM-DD
          date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        } else {
          // DD-MM-YYYY
          date = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        }
      } else {
        date = new Date(input);
      }
    } else {
      date = new Date(input);
    }
  } else {
    date = input;
  }

  if (isNaN(date.getTime())) {
    return String(input);
  }

  const day = date.getDate();
  const month = NAMA_BULAN[date.getMonth()];
  const year = date.getFullYear();

  if (withDayName) {
    const dayName = NAMA_HARI[date.getDay()];
    return `${dayName}, ${day} ${month} ${year}`;
  }

  return `${day} ${month} ${year}`;
}

/**
 * Format current timestamp into WITA representation (e.g. "12 November 2026, 14:30 WITA")
 */
export function getWitaTimestamp(date: Date = new Date()): string {
  const tgl = formatTanggalTakAmbigu(date);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${tgl}, ${hh}:${mm} WITA`;
}

/**
 * Generate sequential Agenda Number (format: NA/YYYY/0001)
 */
export function generateNomorAgenda(existingListCount: number, year: number = 2026): string {
  const nextSeq = (existingListCount + 1).toString().padStart(4, '0');
  return `NA/${year}/${nextSeq}`;
}

/**
 * Hash password with salt
 */
export function hashPassword(plain: string): string {
  const salt = 'dispersip_banjarmasin_baiman_';
  let hash = 0;
  const str = salt + plain;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'dsp_hash_' + Math.abs(hash).toString(16);
}

/**
 * Check if a letter has been in "Menunggu Disposisi" for more than 1 day
 */
export function isSuratOverdue(createdAtIso: string, status: string): boolean {
  if (status !== 'Menunggu Disposisi' && status !== 'Menunggu Verifikasi') return false;
  if (!createdAtIso) return false;
  const created = new Date(createdAtIso).getTime();
  const now = Date.now();
  // 1 day = 24 * 60 * 60 * 1000 = 86400000 ms
  return now - created > 86400000;
}

/**
 * Parse date and time into UTC string for Google Calendar TEMPLATE URL
 * WITA is UTC+8
 */
export function parseWitaToUtcFormat(dateStr: string, timeStr?: string, durationHours = 2): { startUtc: string; endUtc: string } {
  let y = 2026, m = 11, d = 20, hh = 9, mm = 0;

  if (dateStr) {
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts[0].length === 4) {
        y = parseInt(parts[0], 10);
        m = parseInt(parts[1], 10);
        d = parseInt(parts[2], 10);
      } else {
        d = parseInt(parts[0], 10);
        m = parseInt(parts[1], 10);
        y = parseInt(parts[2], 10);
      }
    }
  }

  if (timeStr) {
    const cleanTime = timeStr.replace(/[^0-9:]/g, '');
    const tParts = cleanTime.split(':');
    if (tParts.length >= 2) {
      hh = parseInt(tParts[0], 10) || 9;
      mm = parseInt(tParts[1], 10) || 0;
    }
  }

  // Convert WITA (UTC+8) to UTC
  const witaEpoch = Date.UTC(y, m - 1, d, hh - 8, mm, 0);
  const startDate = new Date(witaEpoch);
  const endDate = new Date(witaEpoch + durationHours * 3600000);

  const formatUtc = (dt: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}T${pad(dt.getUTCHours())}${pad(dt.getUTCMinutes())}00Z`;
  };

  return {
    startUtc: formatUtc(startDate),
    endUtc: formatUtc(endDate),
  };
}

/**
 * Generate Google Calendar TEMPLATE URL
 */
export function generateGoogleCalendarUrl(params: {
  title: string;
  dateStr: string;
  timeStr?: string;
  location?: string;
  description?: string;
  durationHours?: number;
}): string {
  const { startUtc, endUtc } = parseWitaToUtcFormat(params.dateStr, params.timeStr, params.durationHours || 2);
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: params.title,
    dates: `${startUtc}/${endUtc}`,
    details: params.description || '',
    location: params.location || 'Dispersip Kota Banjarmasin',
    ctz: 'Asia/Makassar',
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

/**
 * Generate and trigger download of .ics iCalendar file with VALARM reminders
 */
export function downloadIcsFile(params: {
  title: string;
  dateStr: string;
  timeStr?: string;
  location?: string;
  description?: string;
  fileName?: string;
  durationHours?: number;
}) {
  const { startUtc, endUtc } = parseWitaToUtcFormat(params.dateStr, params.timeStr, params.durationHours || 2);
  const uid = `agenda-${Date.now()}@dispersip.banjarmasinkota.go.id`;
  const cleanTitle = (params.title || 'Agenda Kegiatan').replace(/\n/g, ' ');
  const cleanLocation = (params.location || 'Kota Banjarmasin').replace(/\n/g, ' ');
  const cleanDesc = (params.description || '').replace(/\n/g, '\\n');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Dispersip Kota Banjarmasin//Agenda Kegiatan v1.0//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${startUtc}`,
    `DTSTART:${startUtc}`,
    `DTEND:${endUtc}`,
    `SUMMARY:${cleanTitle}`,
    `DESCRIPTION:${cleanDesc}`,
    `LOCATION:${cleanLocation}`,
    'STATUS:CONFIRMED',
    // Reminder 1 day before
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:Pengingat H-1 Kegiatan: ${cleanTitle}`,
    'END:VALARM',
    // Reminder 1 hour before
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    `DESCRIPTION:Pengingat 1 Jam Sebelum: ${cleanTitle}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = params.fileName || `Agenda_${params.dateStr || 'kegiatan'}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate Telegram share URL
 */
export function generateTelegramShareUrl(text: string, appUrl = window.location.origin): string {
  const q = new URLSearchParams({
    url: appUrl,
    text,
  });
  return `https://t.me/share/url?${q.toString()}`;
}
