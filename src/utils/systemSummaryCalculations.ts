import { Patient, CheckInRecord } from '../types';

export const THAI_MONTH_NAMES_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export const THAI_MONTH_NAMES_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 
  'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 
  'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

/**
 * Format "2026-08" to "สิงหาคม 2569" or "ส.ค. 69"
 */
export function formatYearMonthThai(yearMonthStr: string, isShort = false): string {
  if (!yearMonthStr) return '';
  const parts = yearMonthStr.split('-');
  if (parts.length < 2) return yearMonthStr;

  const yearCE = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;

  if (isNaN(yearCE) || isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11) {
    return yearMonthStr;
  }

  const yearBE = yearCE + 543;
  const shortYear = String(yearBE).slice(-2);
  const monthName = isShort ? THAI_MONTH_NAMES_SHORT[monthIdx] : THAI_MONTH_NAMES_FULL[monthIdx];
  return isShort ? `${monthName} ${shortYear}` : `${monthName} ${yearBE}`;
}

/**
 * Get current year-month string "YYYY-MM"
 */
export function getCurrentYearMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Generate a list of available months (past N months + any month found in data)
 */
export function getAvailableMonthsList(patients: Patient[], maxPastMonths = 12): Array<{ value: string; label: string }> {
  const foundMonths = new Set<string>();
  
  // Always include current month
  const currentYM = getCurrentYearMonth();
  foundMonths.add(currentYM);

  // Scan patient checkInHistory & startDates
  patients.forEach(patient => {
    if (patient.startDate && patient.startDate.length >= 7) {
      foundMonths.add(patient.startDate.substring(0, 7));
    }
    (patient.checkInHistory || []).forEach(record => {
      if (record.date && record.date.length >= 7) {
        foundMonths.add(record.date.substring(0, 7));
      }
    });
  });

  // Ensure recent past months exist in the dropdown
  const now = new Date();
  for (let i = 0; i < maxPastMonths; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    foundMonths.add(`${y}-${m}`);
  }

  const sortedYM = Array.from(foundMonths).sort((a, b) => b.localeCompare(a));

  return sortedYM.map(ym => ({
    value: ym,
    label: formatYearMonthThai(ym)
  }));
}

/**
 * System-wide current metrics calculation (for main Dashboard)
 */
export interface SystemOverviewMetrics {
  totalPatients: number;
  newUsersThisMonth: number;
  checkInsThisMonth: number;
  activeUsersCount: number;  // checked in <= 30 days
  atRiskUsersCount: number;  // checked in 31-60 days
  dormantUsersCount: number; // checked in 61-90 days
  inactiveUsersCount: number; // checked in > 90 days or never
}

export function calculateSystemOverviewMetrics(patients: Patient[]): SystemOverviewMetrics {
  const currentYM = getCurrentYearMonth();
  const today = new Date();

  const validPatients = (patients || []).filter(p => p && p.id);

  if (validPatients.length === 0) {
    return {
      totalPatients: 0,
      newUsersThisMonth: 0,
      checkInsThisMonth: 0,
      activeUsersCount: 0,
      atRiskUsersCount: 0,
      dormantUsersCount: 0,
      inactiveUsersCount: 0
    };
  }

  let newUsersThisMonth = 0;
  let checkInsThisMonth = 0;
  let activeUsersCount = 0;
  let atRiskUsersCount = 0;
  let dormantUsersCount = 0;
  let inactiveUsersCount = 0;

  validPatients.forEach(patient => {
    // New users this month (check startDate or createdDate)
    const regDate = patient.startDate || ((patient as any).createdDate ? (patient as any).createdDate.split('T')[0] : '');
    const isNewThisMonth = Boolean(
      (regDate && regDate.startsWith(currentYM)) ||
      ((patient as any).createdDate && (patient as any).createdDate.startsWith(currentYM))
    );
    if (isNewThisMonth) {
      newUsersThisMonth++;
    }

    // Check-ins this month
    const history = patient.checkInHistory || [];
    const monthRecords = history.filter(h => h && h.date && h.date.startsWith(currentYM));
    checkInsThisMonth += monthRecords.length;

    // Days since last check-in
    let daysSinceLast = -1;
    if (history.length > 0) {
      const validHistory = history.filter(h => h && h.date);
      if (validHistory.length > 0) {
        const sorted = [...validHistory].sort((a, b) => b.date.localeCompare(a.date));
        const latestDateStr = sorted[0].date;
        const latestDate = new Date(latestDateStr);
        if (!isNaN(latestDate.getTime())) {
          const diffMs = today.getTime() - latestDate.getTime();
          daysSinceLast = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        }
      }
    }

    if (history.length === 0) {
      inactiveUsersCount++;
    } else if (daysSinceLast <= 30) {
      activeUsersCount++;
    } else if (daysSinceLast <= 60) {
      atRiskUsersCount++;
    } else if (daysSinceLast <= 90) {
      dormantUsersCount++;
    } else {
      inactiveUsersCount++;
    }
  });

  return {
    totalPatients: validPatients.length,
    newUsersThisMonth,
    checkInsThisMonth,
    activeUsersCount,
    atRiskUsersCount,
    dormantUsersCount,
    inactiveUsersCount
  };
}

/**
 * Item for timeframe analytics (Line Chart, Bar Chart, Grouped Chart, Summary Table)
 */
export interface TimeframeSeriesItem {
  yearMonth: string;          // e.g. "2026-08"
  label: string;              // e.g. "ส.ค. 69"
  fullLabel: string;          // e.g. "สิงหาคม 2569"
  totalUsers: number;         // Cumulative patients up to end of this month
  newUsers: number;           // Patients registered in this month
  returningUsers: number;     // Unique patients who checked in during this month
  checkIns: number;           // Total check-in events logged in this month
  activeCount: number;        // Active (<= 30d as of month end)
  atRiskCount: number;        // At Risk (31-60d as of month end)
  dormantCount: number;       // Dormant (61-90d as of month end)
  inactiveCount: number;      // Inactive (>90d as of month end)
}

export function calculateTimeframeSeriesData(patients: Patient[], monthsCount = 6): TimeframeSeriesItem[] {
  const result: TimeframeSeriesItem[] = [];
  const now = new Date();

  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yearCE = d.getFullYear();
    const monthIdx = d.getMonth();
    const monthNumStr = String(monthIdx + 1).padStart(2, '0');
    const yearMonthStr = `${yearCE}-${monthNumStr}`;

    const monthEndDate = new Date(yearCE, monthIdx + 1, 0);
    const monthEndDateStr = monthEndDate.toISOString().split('T')[0];

    let totalUsers = 0;
    let newUsers = 0;
    let checkIns = 0;
    const returningUserSet = new Set<string>();

    let activeCount = 0;
    let atRiskCount = 0;
    let dormantCount = 0;
    let inactiveCount = 0;

    patients.forEach(patient => {
      const regDate = patient.startDate || '1970-01-01';
      
      // Cumulative registered patients up to end of this month
      if (regDate <= monthEndDateStr) {
        totalUsers++;
      }

      // New users registered in this month
      if (regDate.startsWith(yearMonthStr)) {
        newUsers++;
      }

      const history = patient.checkInHistory || [];
      const monthCheckIns = history.filter(h => h.date && h.date.startsWith(yearMonthStr));
      checkIns += monthCheckIns.length;

      if (monthCheckIns.length > 0) {
        returningUserSet.add(patient.id);
      }

      // Activity status as of month end
      const historyUpToMonth = history.filter(h => h.date && h.date <= monthEndDateStr);
      if (historyUpToMonth.length === 0) {
        inactiveCount++;
      } else {
        const sorted = [...historyUpToMonth].sort((a, b) => b.date.localeCompare(a.date));
        const latestDateStr = sorted[0].date;
        const latestDate = new Date(latestDateStr);
        const diffMs = monthEndDate.getTime() - latestDate.getTime();
        const daysSince = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

        if (daysSince <= 30) {
          activeCount++;
        } else if (daysSince <= 60) {
          atRiskCount++;
        } else if (daysSince <= 90) {
          dormantCount++;
        } else {
          inactiveCount++;
        }
      }
    });

    const label = `${THAI_MONTH_NAMES_SHORT[monthIdx]} ${String(yearCE + 543).slice(-2)}`;
    const fullLabel = `${THAI_MONTH_NAMES_FULL[monthIdx]} ${yearCE + 543}`;

    result.push({
      yearMonth: yearMonthStr,
      label,
      fullLabel,
      totalUsers,
      newUsers,
      returningUsers: returningUserSet.size,
      checkIns,
      activeCount,
      atRiskCount,
      dormantCount,
      inactiveCount
    });
  }

  return result;
}

/**
 * Age Breakdown Calculation (เด็กเล็ก vs เด็กโต)
 */
export interface AgeSummaryData {
  total: number;
  youngKidsCount: number;    // age <= 6 (เด็กเล็ก)
  youngKidsPercent: number;
  olderKidsCount: number;    // age >= 7 (เด็กโต)
  olderKidsPercent: number;
}

export function calculateAgeSummary(patients: Patient[]): AgeSummaryData {
  const total = patients.length;
  if (total === 0) {
    return {
      total: 0,
      youngKidsCount: 0,
      youngKidsPercent: 0,
      olderKidsCount: 0,
      olderKidsPercent: 0
    };
  }

  let youngKidsCount = 0;
  let olderKidsCount = 0;

  patients.forEach(p => {
    const age = p.age ?? 0;
    if (age <= 6) {
      youngKidsCount++;
    } else {
      olderKidsCount++;
    }
  });

  const youngKidsPercent = Math.round((youngKidsCount / total) * 1000) / 10;
  const olderKidsPercent = Math.round((olderKidsCount / total) * 1000) / 10;

  return {
    total,
    youngKidsCount,
    youngKidsPercent,
    olderKidsCount,
    olderKidsPercent
  };
}

/**
 * User Activity Status Donut Data
 */
export interface ActivityStatusDonutItem {
  name: string;
  value: number;
  percent: number;
  color: string;
  key: 'active' | 'atRisk' | 'dormant' | 'inactive';
}

export function calculateActivityStatusDonut(patients: Patient[]): ActivityStatusDonutItem[] {
  const metrics = calculateSystemOverviewMetrics(patients);
  const total = patients.length || 1;

  return [
    {
      key: 'active',
      name: 'ใช้งานสม่ำเสมอ (≤30 วัน)',
      value: metrics.activeUsersCount,
      percent: Math.round((metrics.activeUsersCount / total) * 1000) / 10,
      color: '#10B981' // Green
    },
    {
      key: 'atRisk',
      name: 'ขาดช่วง 31–60 วัน',
      value: metrics.atRiskUsersCount,
      percent: Math.round((metrics.atRiskUsersCount / total) * 1000) / 10,
      color: '#F59E0B' // Amber
    },
    {
      key: 'dormant',
      name: 'ขาดช่วง 61–90 วัน',
      value: metrics.dormantUsersCount,
      percent: Math.round((metrics.dormantUsersCount / total) * 1000) / 10,
      color: '#F97316' // Orange
    },
    {
      key: 'inactive',
      name: 'เกิน 90 วัน / ไม่กลับมา',
      value: metrics.inactiveUsersCount,
      percent: Math.round((metrics.inactiveUsersCount / total) * 1000) / 10,
      color: '#EF4444' // Rose/Red
    }
  ];
}
