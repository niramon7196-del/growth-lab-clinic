import { Patient, CheckInRecord, PatientProgress, WeeklyLesson } from '../types';
import { VERIFIED_EXERCISES } from '../data';

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Strictly parses a date string (YYYY-MM-DD) into a local Date without UTC conversion or timezone shifts.
 */
export function parseLocalDate(dateStr?: string | null): Date {
  if (!dateStr) return new Date();
  const clean = (dateStr.includes('T') ? dateStr.split('T')[0] : dateStr).trim();
  const parts = clean.split('-');
  if (parts.length >= 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m, d);
    }
  }
  const dObj = new Date(dateStr);
  return isNaN(dObj.getTime()) ? new Date() : dObj;
}

/**
 * Extracts local date components and Thai labels strictly from local calendar day/month/year.
 */
export function getLocalDateParts(dateStr?: string | null) {
  if (!dateStr) {
    const now = new Date();
    dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
  const clean = (dateStr.includes('T') ? dateStr.split('T')[0] : dateStr).trim();
  const parts = clean.split('-');
  let y = 2026;
  let m = 8; // Sep (0-indexed)
  let d = 17;
  if (parts.length >= 3) {
    const parsedY = parseInt(parts[0], 10);
    const parsedM = parseInt(parts[1], 10) - 1;
    const parsedD = parseInt(parts[2], 10);
    if (!isNaN(parsedY) && !isNaN(parsedM) && !isNaN(parsedD)) {
      y = parsedY;
      m = parsedM;
      d = parsedD;
    }
  } else {
    const dObj = new Date(dateStr);
    if (!isNaN(dObj.getTime())) {
      y = dObj.getFullYear();
      m = dObj.getMonth();
      d = dObj.getDate();
    }
  }

  const localObj = new Date(y, m, d);
  const monthsThaiShort = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const monthsThaiLong = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
    'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
    'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const thaiDayNames = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
  const thaiDayShort = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
  const dayIdx = localObj.getDay();
  const thaiYear = y > 2400 ? y : y + 543;

  return {
    year: y,
    monthIndex: m,
    day: d,
    thaiYear,
    thaiMonthShort: monthsThaiShort[m] || '',
    thaiMonthLong: monthsThaiLong[m] || '',
    thaiWeekdayShort: thaiDayShort[dayIdx] || '',
    thaiWeekdayLong: thaiDayNames[dayIdx] || '',
    formattedShort: `${d} ${monthsThaiShort[m] || ''}`,
    formattedFull: `${d} ${monthsThaiShort[m] || ''} ${thaiYear}`,
    formattedWithWeekday: `${thaiDayShort[dayIdx] || ''} ${d} ${monthsThaiShort[m] || ''} ${thaiYear}`
  };
}

export function formatThaiDate(
  dateStr: string,
  options?: { showYear?: boolean; longMonth?: boolean; showWeekday?: boolean }
): string {
  if (!dateStr) return '';
  try {
    let clean = (dateStr.includes('T') ? dateStr.split('T')[0] : dateStr).trim();

    if (clean.includes('/')) {
      const slashParts = clean.split('/');
      if (slashParts.length === 3 && slashParts[2].length === 4) {
        clean = `${slashParts[2]}-${slashParts[1].padStart(2, '0')}-${slashParts[0].padStart(2, '0')}`;
      }
    }

    const [year, month, day] = clean.split('-');
    if (!year || !month || !day) return dateStr;

    const yNum = parseInt(year, 10);
    const mNum = parseInt(month, 10);
    const dNum = parseInt(day, 10);
    if (isNaN(yNum) || isNaN(mNum) || isNaN(dNum)) return dateStr;

    const thaiYear = yNum > 2400 ? yNum : yNum + 543;
    const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    const thaiMonthsLong = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
      "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
      "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];

    const monthName = options?.longMonth ? thaiMonthsLong[mNum - 1] : thaiMonths[mNum - 1];

    let prefix = '';
    if (options?.showWeekday) {
      let adYear = yNum;
      if (adYear > 2400) adYear -= 543;
      // Direct Sakamoto algorithm for exact day of week (0=Sun..6=Sat) without any timezone/UTC conversion
      const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
      let calcYear = adYear;
      if (mNum < 3) calcYear -= 1;
      const dayIdx = (calcYear + Math.floor(calcYear / 4) - Math.floor(calcYear / 100) + Math.floor(calcYear / 400) + t[mNum - 1] + dNum) % 7;
      const thaiDayNames = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
      const thaiDayShort = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
      prefix = options?.longMonth ? `${thaiDayNames[dayIdx]}ที่ ` : `${thaiDayShort[dayIdx]} `;
    }

    const yearPart = options?.showYear !== false ? ` ${thaiYear}` : '';
    return `${prefix}${dNum} ${monthName}${yearPart}`.trim();
  } catch {
    return dateStr;
  }
}

/**
 * Safely format appointment times.
 * Formats all appointment times using a regex or parser: if it contains an ISO string,
 * extracts the hours:minutes in Bangkok timezone or regex fallback to "10:30".
 * Never displays the "1899-12-30" string under any circumstance.
 */
export function formatAppointmentTime(rawTime: any): string {
  if (!rawTime) return '10:30';
  let str = String(rawTime).trim();
  if (!str) return '10:30';

  // Remove trailing "น." or " น." if already present
  str = str.replace(/\s*น\.?$/, '').trim();

  // If already clean HH:mm (e.g. "10:30" or "09:15")
  if (/^\d{1,2}:\d{2}$/.test(str)) {
    const [h, m] = str.split(':');
    return `${h.padStart(2, '0')}:${m}`;
  }

  // If HH:mm:ss (e.g. "10:30:00")
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(str)) {
    const [h, m] = str.split(':');
    return `${h.padStart(2, '0')}:${m}`;
  }

  // If ISO format like "1899-12-30T03:47:56.000Z" from Google Sheets time cells
  if (str.includes('T') || str.includes('1899')) {
    try {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        const bangkokTime = new Intl.DateTimeFormat('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'Asia/Bangkok'
        }).format(d);
        if (bangkokTime && /^\d{2}:\d{2}$/.test(bangkokTime)) {
          return bangkokTime;
        }
      }
    } catch {}

    const isoMatch = str.match(/T(\d{2}):(\d{2})/);
    if (isoMatch) {
      const utcHours = parseInt(isoMatch[1], 10);
      const minutes = isoMatch[2];
      if (str.endsWith('Z')) {
        const bkkHours = (utcHours + 7) % 24;
        return `${String(bkkHours).padStart(2, '0')}:${minutes}`;
      }
      return `${isoMatch[1]}:${minutes}`;
    }
    return '10:30';
  }

  // If dot separated (e.g. "10.30")
  const dotMatch = str.match(/^(\d{1,2})\.(\d{2})/);
  if (dotMatch) {
    return `${dotMatch[1].padStart(2, '0')}:${dotMatch[2]}`;
  }

  // Any HH:mm inside string
  const anyTimeMatch = str.match(/(\d{1,2}):(\d{2})/);
  if (anyTimeMatch) {
    return `${anyTimeMatch[1].padStart(2, '0')}:${anyTimeMatch[2]}`;
  }

  return '10:30';
}

export function formatThaiTimestamp(timestampStr?: string): string {
  if (!timestampStr) return '';
  if (timestampStr.includes('น.')) return timestampStr;
  try {
    const d = new Date(timestampStr);
    if (!isNaN(d.getTime())) {
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${hours}:${mins} น.`;
    }
  } catch {
    // fallback
  }
  return timestampStr;
}

/**
 * Check if patient has already checked in today
 */
export function hasCheckedInToday(patient?: Patient | null): boolean {
  if (!patient) return false;
  const today = getTodayDateString();
  const history = patient.checkInHistory || (patient as any).checkIns || [];
  return history.some((item: any) => item.date === today);
}

/**
 * Get today's check-in record for a patient (if any)
 */
export function getTodayCheckInRecord(patient?: Patient | null): CheckInRecord | undefined {
  if (!patient) return undefined;
  const today = getTodayDateString();
  const history = patient.checkInHistory || (patient as any).checkIns || [];
  return history.find((item: any) => item.date === today);
}

/**
 * Calculate consecutive daily streak count for a patient
 */
export function calculateStreak(patient?: Patient | null): number {
  if (!patient) return 0;
  const history = patient.checkInHistory || (patient as any).checkIns || [];
  if (!history || history.length === 0) return 0;
  
  const uniqueDates = (Array.from(new Set(
    history
      .map((h: any) => String(h.date || (h.timestamp ? h.timestamp.split('T')[0] : '') || '').trim())
      .filter(Boolean)
  )) as string[]).sort().reverse();

  if (uniqueDates.length === 0) return 0;

  const today = getTodayDateString();
  const todayObj = new Date(today);
  const yesterdayObj = new Date(todayObj.getTime() - 86400000);
  const yesterday = `${yesterdayObj.getFullYear()}-${String(yesterdayObj.getMonth() + 1).padStart(2, '0')}-${String(yesterdayObj.getDate()).padStart(2, '0')}`;
  
  let streak = 0;
  let checkDate = new Date(uniqueDates[0]);
  
  for (let i = 0; i < uniqueDates.length; i++) {
    const d = new Date(uniqueDates[i]);
    const diff = Math.round((checkDate.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (i === 0 || diff === 1) {
      streak++;
      checkDate = d;
    } else if (diff === 0) {
      continue;
    } else {
      break;
    }
  }

  // If latest checkin is today or yesterday, return calculated consecutive run
  if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
    return Math.max(1, streak);
  }

  // If patient has check-ins, return the latest run or minimum 1 if they have total checkins
  return streak > 0 ? streak : (uniqueDates.length > 0 ? 1 : 0);
}

export type PatientComplianceCategory = 'NEW' | 'CONSISTENT' | 'IRREGULAR' | 'DORMANT';

export interface PatientStatusClassification {
  category: PatientComplianceCategory;
  categoryLabelTh: string; // (1) Active ≤ 7 วัน / สม่ำเสมอ, (2) At Risk 8-30 วัน, (3) Inactive > 30 วัน
  statusBadge: 'NEW' | 'ACTIVE' | 'AT RISK' | 'DORMANT' | 'INACTIVE';
  descriptionTh: string;
  colorClass: string;
  bgColorClass: string;
  borderColorClass: string;
}

export interface DailyCheckInSummary {
  date: string;
  dayLabel: string;
  isCheckedIn: boolean;
  appOpens: number;
  completedExercises: number;
}

/**
 * Calculates patient classification based on 3-Ring Matrix:
 * - Ring 1: Active ≤ 7 วัน (CONSISTENT)
 * - Ring 2: At Risk 8-30 วัน (IRREGULAR)
 * - Ring 3: Inactive > 30 วัน (DORMANT)
 */
export function getPatientClassification(
  daysSinceLastCheckIn: number, 
  hasAnyCheckIn: boolean, 
  weeklyCompliance: number = 0,
  elapsedDays: number = 1
): PatientStatusClassification {
  if (!hasAnyCheckIn || daysSinceLastCheckIn < 0) {
    return {
      category: 'CONSISTENT',
      categoryLabelTh: 'Active ≤ 7 วัน (เริ่มต้นโปรแกรม)',
      statusBadge: 'ACTIVE',
      descriptionTh: elapsedDays <= 1 
        ? 'สมาชิกใหม่ (รอเช็คอินครั้งแรก)' 
        : `เริ่มโปรแกรม ${elapsedDays} วัน (Active)`,
      colorClass: 'text-emerald-700',
      bgColorClass: 'bg-emerald-50',
      borderColorClass: 'border-emerald-200'
    };
  }

  // Active ≤ 7 วัน
  if (daysSinceLastCheckIn <= 7) {
    return {
      category: 'CONSISTENT',
      categoryLabelTh: daysSinceLastCheckIn === 0 ? 'เช็คอินแล้ววันนี้ / Active' : `Active (เช็คอินล่าสุด ${daysSinceLastCheckIn} วันที่แล้ว)`,
      statusBadge: 'ACTIVE',
      descriptionTh: daysSinceLastCheckIn === 0 ? 'เช็คอินแล้ววันนี้' : `Active (ล่าสุด ${daysSinceLastCheckIn} วันที่แล้ว)`,
      colorClass: 'text-emerald-700',
      bgColorClass: 'bg-emerald-50',
      borderColorClass: 'border-emerald-200'
    };
  }

  // At Risk 8-30 วัน
  if (daysSinceLastCheckIn <= 30) {
    return {
      category: 'IRREGULAR',
      categoryLabelTh: 'At Risk (ขาดช่วง 8 - 30 วัน)',
      statusBadge: 'AT RISK',
      descriptionTh: `ขาดการฝึก ${daysSinceLastCheckIn} วัน (ช่วง 8-30 วัน)`,
      colorClass: 'text-amber-700',
      bgColorClass: 'bg-amber-50',
      borderColorClass: 'border-amber-200'
    };
  }

  // Inactive > 30 วัน
  return {
    category: 'DORMANT',
    categoryLabelTh: 'Inactive (ขาดการฝึกเกิน 30 วัน)',
    statusBadge: 'INACTIVE',
    descriptionTh: `ขาดการฝึก ${daysSinceLastCheckIn} วัน (> 30 วัน)`,
    colorClass: 'text-rose-700',
    bgColorClass: 'bg-rose-50',
    borderColorClass: 'border-rose-200'
  };
}

export function calculateUserStatus(daysSinceLastCheckIn: number, hasAnyCheckIn: boolean): 'NEW' | 'ACTIVE' | 'AT RISK' | 'DORMANT' | 'INACTIVE' {
  if (!hasAnyCheckIn || daysSinceLastCheckIn < 0) return 'ACTIVE';
  if (daysSinceLastCheckIn <= 7) return 'ACTIVE';
  if (daysSinceLastCheckIn <= 30) return 'AT RISK';
  return 'INACTIVE';
}

export interface ConsistencyMetrics {
  totalCheckIns: number;
  daysCheckedIn: number;
  lastCheckInDate?: string;
  lastCheckInTimestamp?: string;
  daysSinceLastCheckIn: number;
  programDays?: number;
  consistencyPercent: number;
  consistencyText: string;
  weeklyCount: number;
  weeklyCompliancePercent: number;
  monthlyCount: number;
  monthlyCompliancePercent: number;
  streakDays: number;
  todayAppOpens: number;
  todayCompletedExercises: number;
  weeklyBehaviorScore?: number;
  status: 'NEW' | 'ACTIVE' | 'AT RISK' | 'DORMANT' | 'INACTIVE';
  classification: PatientStatusClassification;
  recent7Days: DailyCheckInSummary[];
}

export function calculateConsistencyMetrics(patient?: Patient | null): ConsistencyMetrics {
  const history = patient ? (patient.checkInHistory || (patient as any).checkIns || []) : [];
  const uniqueDates = Array.from(new Set(history.map((h: any) => h.date))).sort();
  const totalCheckIns = history.length;
  const daysCheckedIn = uniqueDates.length;

  let lastCheckInDate: string | undefined = undefined;
  let lastCheckInTimestamp: string | undefined = undefined;
  let daysSinceLastCheckIn = -1;

  if (history.length > 0) {
    const validHistory = history.filter((h: any) => h && h.date);
    if (validHistory.length > 0) {
      const sorted = [...validHistory].sort((a, b) => b.date.localeCompare(a.date));
      const latest = sorted[0];
      lastCheckInDate = latest.date;
      lastCheckInTimestamp = latest.timestamp;

      const todayStr = getTodayDateString();
      const todayObj = new Date(todayStr);
      const lastObj = new Date(latest.date);
      if (!isNaN(lastObj.getTime())) {
        const diffTime = todayObj.getTime() - lastObj.getTime();
        daysSinceLastCheckIn = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
      }
    }
  }

  // Determine total program days elapsed since start date or earliest record
  let startDate = patient?.startDate ? new Date(patient.startDate) : new Date(getTodayDateString());
  if (isNaN(startDate.getTime())) {
    startDate = new Date(getTodayDateString());
  }
  const todayObj = new Date(getTodayDateString());
  const elapsedDays = Math.max(1, Math.floor((todayObj.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  const effectiveSpan = Math.max(1, Math.min(elapsedDays, 30));
  const consistencyPercent = daysCheckedIn > 0 
    ? Math.min(100, Math.max(Math.round((daysCheckedIn / effectiveSpan) * 100), 20))
    : 0;
  const consistencyText = `${daysCheckedIn} / ${elapsedDays} วัน (${consistencyPercent}%)`;

  const todayMs = todayObj.getTime();
  const sevenDaysAgo = new Date(todayMs - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(todayMs - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const weeklyCount = uniqueDates.filter(d => d >= sevenDaysAgo).length;
  const weeklyCompliancePercent = Math.min(100, Math.round((weeklyCount / 7) * 100));

  const monthlyCount = uniqueDates.filter(d => d >= thirtyDaysAgo).length;
  const monthlyCompliancePercent = Math.min(100, Math.round((monthlyCount / 30) * 100));

  const streakDays = calculateStreak(patient);

  // Today Usage Tracker stats
  const todayStr = getTodayDateString();
  const usageTrackers = patient?.usageTracker || [];
  const todayUsage = usageTrackers.find(u => u.date === todayStr);
  const todayAppOpens = todayUsage?.appOpens || (hasCheckedInToday(patient) ? 1 : 0);

  // Today completed exercises count
  const completedAssignments = (patient?.assignments || []).filter(a => a.status === 'completed').length;
  const todayCompletedExercises = (todayUsage?.exerciseClicks || 0) + completedAssignments;

  // Behavior Composite Score calculation (0 - 100)
  const gnsScore = patient?.nutritionLogs && patient.nutritionLogs.length > 0 
    ? patient.nutritionLogs[patient.nutritionLogs.length - 1].totalScore 
    : 85;
  const sleepRating = patient.sleepLogs && patient.sleepLogs.length > 0 
    ? (patient.sleepLogs[patient.sleepLogs.length - 1].quality || 4) * 20 
    : 80;
  const weeklyBehaviorScore = Math.min(100, Math.round(
    (weeklyCompliancePercent * 0.40) + (gnsScore * 0.30) + (sleepRating * 0.30)
  ));

  const status = calculateUserStatus(daysSinceLastCheckIn, history.length > 0);
  const classification = getPatientClassification(daysSinceLastCheckIn, history.length > 0, weeklyCompliancePercent, elapsedDays);

  // Calculate 7-day practice consistency breakdown
  const dayNamesThai = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
  const recent7Days: DailyCheckInSummary[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayMs - i * 24 * 60 * 60 * 1000);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayLabel = dayNamesThai[d.getDay()];
    const isCheckedIn = uniqueDates.includes(dateKey);
    const usage = usageTrackers.find(u => u.date === dateKey);
    const appOpens = usage?.appOpens || (isCheckedIn ? 1 : 0);
    const completedExercises = usage?.exerciseClicks || (isCheckedIn ? 2 : 0);

    recent7Days.push({
      date: dateKey,
      dayLabel,
      isCheckedIn,
      appOpens,
      completedExercises
    });
  }

  return {
    totalCheckIns,
    daysCheckedIn,
    lastCheckInDate,
    lastCheckInTimestamp,
    daysSinceLastCheckIn,
    programDays: elapsedDays,
    consistencyPercent,
    consistencyText,
    weeklyCount,
    weeklyCompliancePercent,
    monthlyCount,
    monthlyCompliancePercent,
    streakDays,
    todayAppOpens,
    todayCompletedExercises,
    weeklyBehaviorScore,
    status,
    classification,
    recent7Days
  };
}

/**
 * Calculates current week number (1-indexed) based on patient's startDate
 */
export function calculateCurrentWeek(patient: Patient): number {
  if (!patient.startDate) return 1;
  const start = new Date(patient.startDate);
  const now = new Date(getTodayDateString());
  if (isNaN(start.getTime())) return 1;
  const diffDays = Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  return Math.min(12, Math.max(1, Math.floor(diffDays / 7) + 1));
}

/**
 * Generates Weekly Lessons program structure for Growth Lab
 */
export function getWeeklyLessons(currentWeek: number = 1): WeeklyLesson[] {
  const verified = VERIFIED_EXERCISES.filter(ex => ex.sourceStatus === 'VERIFIED');
  
  const weeklyTemplates: Array<{
    week: number;
    title: string;
    subTitle: string;
    description: string;
    category: WeeklyLesson['category'];
    exerciseFilter: (id: string, cat: string) => boolean;
    targetCheckIns: number;
  }> = [
    {
      week: 1,
      title: 'สัปดาห์ที่ 1: การหายใจผ่านจมูกและการปิดริมฝีปาก',
      subTitle: 'Nasal Breathing & Lip Seal Foundation',
      description: 'ปรับพฤติกรรมการหายใจให้ผ่านจมูก 100% และฝึกความแข็งแรงกล้ามเนื้อรอบปากเพื่อปิดปากสนิท',
      category: 'breathing',
      exerciseFilter: (id, cat) => cat === 'breathing' || cat === 'lips',
      targetCheckIns: 5,
    },
    {
      week: 2,
      title: 'สัปดาห์ที่ 2: ตำแหน่งลิ้นและฝึกการกลืน OMT',
      subTitle: 'Tongue Posture & Correct Swallowing',
      description: 'ฝึกให้ปลายลิ้นแตะจุด Spot บนเพดานปาก และกลืนน้ำลายโดยไม่ดันฟันหน้า',
      category: 'tongue',
      exerciseFilter: (id, cat) => cat === 'tongue' || cat === 'swallowing',
      targetCheckIns: 5,
    },
    {
      week: 3,
      title: 'สัปดาห์ที่ 3: ความแข็งแรงกล้ามเนื้อใบหน้าและขากรรไกร',
      subTitle: 'Orofacial Muscle Strength & Tone',
      description: 'กระชับกล้ามเนื้อกระพุ้งแก้มและขากรรไกรเพื่อรองรับโครงสร้างการเจริญเติบโตใบหน้า',
      category: 'lips',
      exerciseFilter: (id, cat) => cat === 'muscle' || cat === 'cheek_jaw' || cat === 'lips',
      targetCheckIns: 6,
    },
    {
      week: 4,
      title: 'สัปดาห์ที่ 4: บุคลิกภาพ ท่าทาง และการหายใจขณะเคลื่อนไหว',
      subTitle: 'Posture, Core Alignment & Exercise Movement',
      description: 'จัดระเบียบลำตัว แนวกระดูกสันหลัง และฝึกการออกกำลังกายกระตุ้นการเจริญเติบโต',
      category: 'posture',
      exerciseFilter: (id, cat) => cat === 'posture' || cat === 'movement' || cat === 'core' || cat === 'jump',
      targetCheckIns: 6,
    }
  ];

  return weeklyTemplates.map(tmpl => {
    const matchedExercises = verified.filter(ex => tmpl.exerciseFilter(ex.id, ex.category));
    let status: WeeklyLesson['status'] = 'locked';
    if (tmpl.week < currentWeek) {
      status = 'completed';
    } else if (tmpl.week === currentWeek) {
      status = 'active';
    }

    return {
      id: `lesson_wk_${tmpl.week}`,
      week: tmpl.week,
      title: tmpl.title,
      subTitle: tmpl.subTitle,
      description: tmpl.description,
      category: tmpl.category,
      exercises: matchedExercises.length > 0 ? matchedExercises : verified.slice(0, 2),
      targetCheckIns: tmpl.targetCheckIns,
      status
    };
  });
}

/**
 * Synchronizes pending progress data into patient_progress object
 */
export function syncPatientProgress(patient: Patient): PatientProgress {
  const currentWeek = calculateCurrentWeek(patient);
  const consistency = calculateConsistencyMetrics(patient);
  const assignments = patient.assignments || [];
  
  const completedAssignments = assignments.filter(a => a.status === 'completed').length;
  const totalAssignments = assignments.length;
  
  const completionRate = totalAssignments > 0 
    ? Math.round((completedAssignments / totalAssignments) * 100) 
    : (consistency.totalCheckIns > 0 ? Math.min(100, consistency.totalCheckIns * 20) : 0);

  // Weekly progress calculation
  const lessons = getWeeklyLessons(currentWeek);
  const weeklyProgress = lessons.map(lesson => {
    const isPast = lesson.week < currentWeek;
    const isCurrent = lesson.week === currentWeek;
    
    const weekCompleted = isPast || (isCurrent && completionRate >= 80);
    const completedCount = isPast ? lesson.exercises.length : (isCurrent ? Math.min(lesson.exercises.length, completedAssignments) : 0);
    
    return {
      week: lesson.week,
      completed: weekCompleted,
      completedLessons: completedCount,
      totalLessons: lesson.exercises.length,
      score: weekCompleted ? 100 : Math.round((completedCount / (lesson.exercises.length || 1)) * 100)
    };
  });

  const nowTimestamp = new Date().toISOString();

  return {
    patientId: patient.id,
    currentWeek,
    totalCompletedLessons: completedAssignments,
    totalCheckIns: consistency.totalCheckIns,
    lastSyncTimestamp: nowTimestamp,
    completionRate,
    streakDays: consistency.daysSinceLastCheckIn === 0 ? consistency.daysCheckedIn : 0,
    weeklyProgress
  };
}
