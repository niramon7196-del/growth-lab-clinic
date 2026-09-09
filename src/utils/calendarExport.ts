/**
 * Growth Lab Calendar & Export Utility
 * 
 * Provides:
 * 1. .ICS iCalendar File Export (compatible with Apple Calendar, Outlook, Google Calendar, Android, iOS)
 * 2. Instant Google Calendar Web Event Links (No OAuth / Zero login / No client_id required)
 * 3. LocalStorage persistence for in-app calendar tracking
 */

export interface CalendarAppointmentItem {
  id?: string;
  patientName: string;
  hn?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  type: 'clinical' | 'online' | 'consultation' | string;
  notes?: string;
  location?: string;
}

const LOCAL_STORAGE_CALENDAR_KEY = 'growthlab_calendar_events';

/**
 * Format Date to ICS datetime format (YYYYMMDDTHHmmss)
 */
function formatToIcsDate(dateStr: string, timeStr: string, addMinutes = 0): string {
  try {
    const combined = `${dateStr}T${timeStr || '10:00'}:00`;
    const d = new Date(combined);
    if (isNaN(d.getTime())) {
      const now = new Date();
      return now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    }
    if (addMinutes > 0) {
      d.setTime(d.getTime() + addMinutes * 60000);
    }
    const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const mins = pad(d.getMinutes());
    const secs = pad(d.getSeconds());
    return `${year}${month}${day}T${hours}${mins}${secs}`;
  } catch {
    const now = new Date();
    return now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }
}

/**
 * Clean string for ICS format
 */
function escapeIcsText(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generate standard .ICS iCalendar format string
 */
export function generateIcsContent(item: CalendarAppointmentItem): string {
  const typeLabel =
    item.type === 'clinical'
      ? 'ตรวจติดตามผลที่คลินิก'
      : item.type === 'online'
      ? 'ปรึกษาออนไลน์ (Online Video Call)'
      : 'ปรึกษาเฉพาะทาง Growth Lab';

  const summary = `นัดหมาย Growth Lab: ${item.patientName} (${typeLabel})`;
  const description = `การนัดหมายตรวจและติดตามผลการรักษา Growth Lab\n\n• ผู้รับการดูแล: ${item.patientName}${item.hn ? ` (HN: ${item.hn})` : ''}\n• รูปแบบ: ${typeLabel}\n• วันที่: ${item.date} เวลา: ${item.time} น.\n• บันทึกการตรวจ: ${item.notes || 'ไม่มีบันทึกเพิ่มเติม'}\n• ระบบ: คลินิกทันตกรรมภาสุข (Growth Lab)`;
  const location = item.location || (item.type === 'clinical' ? 'คลินิกทันตกรรมภาสุข (Growth Lab) 366/4 ม.1 ต.ดีลัง อ.พัฒนานิคม จ.ลพบุรี' : 'Online / Google Meet');

  const dtStart = formatToIcsDate(item.date, item.time, 0);
  const dtEnd = formatToIcsDate(item.date, item.time, 45); // default 45 mins
  const nowIcs = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const uid = `growthlab-${item.id || Date.now()}@growthlab.clinic`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Growth Lab Clinic//Appointment Manager//TH',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowIcs}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(location)}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT60M',
    'ACTION:DISPLAY',
    'DESCRIPTION:เตือนความจำนัดหมาย Growth Lab (อีก 1 ชั่วโมง)',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    'DESCRIPTION:เตือนความจำนัดหมาย Growth Lab พรุ่งนี้',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

/**
 * Download .ICS file directly to user device (triggers Calendar app automatically on iOS/Android/Mac/Windows)
 */
export function downloadAppointmentIcs(item: CalendarAppointmentItem): void {
  try {
    const icsData = generateIcsContent(item);
    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeName = (item.patientName || 'appointment').replace(/\s+/g, '_');
    link.download = `growthlab_appointment_${safeName}_${item.date}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    saveLocalCalendarRecord(item);
  } catch (err) {
    console.error('Failed to download .ics calendar file:', err);
  }
}

/**
 * Generate 1-click Google Calendar Web Add URL (No OAuth credentials needed)
 */
export function getGoogleCalendarWebUrl(item: CalendarAppointmentItem): string {
  const typeLabel =
    item.type === 'clinical'
      ? 'ตรวจที่คลินิก'
      : item.type === 'online'
      ? 'ปรึกษาออนไลน์'
      : 'ปรึกษาเฉพาะทาง';

  const startIso = `${item.date}T${item.time || '10:00'}:00`;
  const startDate = new Date(startIso);
  const endDate = new Date(startDate.getTime() + 45 * 60000);

  const formatGCalDate = (d: Date) => {
    if (isNaN(d.getTime())) return new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const datesStr = `${formatGCalDate(startDate)}/${formatGCalDate(endDate)}`;
  const text = `🩺 นัดตรวจติดตาม: ${item.patientName} (${typeLabel}) - Growth Lab`;
  const details = `การนัดหมายตรวจและติดตามผลการรักษา Growth Lab\n\n• ผู้รับการดูแล: ${item.patientName}${item.hn ? ` (HN: ${item.hn})` : ''}\n• รูปแบบ: ${typeLabel}\n• วันเวลา: ${item.date} เวลา ${item.time} น.\n• บันทึก: ${item.notes || 'ไม่มีบันทึกเพิ่มเติม'}\n• คลินิก: คลินิกทันตกรรมภาสุข (Growth Lab)`;
  const location = item.location || (item.type === 'clinical' ? 'คลินิกทันตกรรมภาสุข (Growth Lab) 366/4 ม.1 ต.ดีลัง อ.พัฒนานิคม จ.ลพบุรี' : 'Google Meet / Online');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text,
    dates: datesStr,
    details,
    location,
    ctz: 'Asia/Bangkok'
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Save record to LocalStorage for in-app persistence
 */
export function saveLocalCalendarRecord(item: CalendarAppointmentItem): void {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CALENDAR_KEY);
    const list: any[] = raw ? JSON.parse(raw) : [];
    const record = {
      id: item.id || `appt_${Date.now()}`,
      patientName: item.patientName,
      hn: item.hn,
      date: item.date,
      time: item.time,
      type: item.type,
      notes: item.notes,
      syncedAt: new Date().toISOString(),
    };
    list.unshift(record);
    localStorage.setItem(LOCAL_STORAGE_CALENDAR_KEY, JSON.stringify(list.slice(0, 100)));
  } catch (e) {
    console.warn('LocalStorage calendar save error:', e);
  }
}
