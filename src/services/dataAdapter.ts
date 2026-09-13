import { Patient, CheckInRecord, HomeworkAssignment, Appointment, SessionLog, ClinicSettings, StaffAccount } from '../types';
import { cascadeDeletePatientAndRevokeQR } from './qrRevokeService';
import { db, isFirebaseConfigured, handleFirestoreError, OperationType } from './firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  collection, 
  getDocs, 
  query, 
  where,
  onSnapshot,
  Unsubscribe,
  writeBatch 
} from 'firebase/firestore';
import { calculateConsistencyMetrics, syncPatientProgress } from '../utils/checkInCalculations';
import { calculateSystemOverviewMetrics, SystemOverviewMetrics } from '../utils/systemSummaryCalculations';
import { SEED_PATIENTS, SEED_APPOINTMENTS, DEFAULT_SETTINGS, generateSeedLogs } from '../data';
import { 
  syncPatientToGoogleSheets, 
  registerPatientToGoogleSheets,
  savePatientToGoogleSheets,
  fetchPatientByHnFromGoogleSheets,
  fetchPatientsFromGoogleSheets, 
  fetchInitialDataFromGoogleSheets,
  fetchPatientPlanFromGoogleSheets, 
  syncAppointmentToGoogleSheets,
  syncDeleteAppointmentToGoogleSheets,
  syncDeletePatientToGoogleSheets,
  fetchAppointmentsFromGoogleSheets,
  syncDailyCheckInToGoogleSheets,
  syncCleanDailySummaryToGoogleSheets,
  saveClinicConfigToGoogleSheets,
  syncSessionLogToGoogleSheets,
  fetchSessionLogsFromGoogleSheets,
  getWebhookUrl 
} from './googleAppsScriptService';

import { 
  calculateAgeFromDob, 
  getAgeGroup, 
  getAgeGroupBadge, 
  getSuggestedTitlePrefix, 
  detectGenderFromPatientData,
  formatNicknameByAge, 
  formatPatientDisplay, 
  PatientNameFormatted, 
  AgeGroupType, 
  AgeGroupBadgeInfo,
  parseAndNormalizeDob,
  deduplicateAppointments,
  deduplicatePatientList
} from '../utils/patientUtils';
import { parseAndCleanAssignedTasks, sanitizeTaskCode } from '../utils/cleanTasks';

export {
  calculateAgeFromDob,
  getAgeGroup,
  getAgeGroupBadge,
  getSuggestedTitlePrefix,
  detectGenderFromPatientData,
  formatNicknameByAge,
  formatPatientDisplay,
  parseAndNormalizeDob
};
export type { PatientNameFormatted, AgeGroupType, AgeGroupBadgeInfo };

const LOCAL_STORAGE_KEY = 'growth_lab_patients';
const LOCAL_STORAGE_APPS_KEY = 'growth_lab_appointments';
const LOCAL_STORAGE_LOGS_KEY = 'growth_lab_logs';

export function isTaskOrCodeString(str?: any): boolean {
  if (!str) return false;
  const s = String(str).trim().toLowerCase();
  if (!s) return false;

  // JSON objects/arrays or code fragments
  if (s.startsWith('[') || s.startsWith('{') || s.includes('"exerciseid"') || s.includes('"taskid"') || s.includes('src-doc')) {
    return true;
  }

  // Keywords indicating task/exercise codes or homework assignments
  const taskKeywords = [
    'breathing', 'lips', 'tongue', 'cheeks', 'jaw', 'airway', 'sleep',
    'nutrition', 'posture', 'omt', 'ex_', 'asgn_', 'task_', 'plan_',
    'assignedtask', 'assignedexercise', 'assignedomt', 'exercise', 'homework'
  ];

  for (const kw of taskKeywords) {
    if (s.includes(kw)) return true;
  }

  // Code pattern matches: posture_1, tongue_2, ex_01, task_abc, etc.
  if (/^(breathing|lips|tongue|cheeks|jaw|airway|sleep|nutrition|posture|omt|ex|task|asgn)[0-9_,-]*/i.test(s)) {
    return true;
  }

  // Underscore code pattern like `abc_123_xyz` or `posture1_2`
  if (/^[a-z0-9]+_[0-9a-z_,-]+/i.test(s)) {
    return true;
  }

  return false;
}

export function clearAllPatientLocalStorage(): void {
  try {
    const keysToRemove = [
      'ef_patients',
      'growth_lab_patients',
      'growthlab_patients',
      'growth_lab_patients_cache',
      'patients_cache',
      'ef_patients_data',
      'growth_lab_patient_plan'
    ];
    keysToRemove.forEach(k => localStorage.removeItem(k));
    console.log('[dataAdapter] Cleared old patient cache keys from localStorage.');
  } catch (err) {
    console.warn('[dataAdapter] Error clearing patient localStorage:', err);
  }
}

export function cleanPhoneString(val?: any): string {
  if (!val) return '';
  const s = String(val).trim();
  if (!s) return '';

  if (isTaskOrCodeString(s)) return '';

  // Reject strings containing letters (English/Thai) or underscores or date keywords
  if (/[a-zA-Z\u0E00-\u0E7F_]/.test(s) || s.includes('GMT') || s.includes('UTC')) {
    return '';
  }

  const digits = s.replace(/\D/g, '');

  if (digits.length >= 9 && digits.length <= 11) {
    if (digits.length === 10 && digits.startsWith('0')) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    if (digits.length === 9 && digits.startsWith('02')) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
    }
    if (digits.length === 9 && digits.startsWith('0')) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return s.replace(/[^\d-+()\s]/g, '').trim();
  }

  return '';
}

export function cleanNameString(val?: any): string {
  if (!val) return '';
  const s = String(val).trim();
  if (!s) return '';
  if (isTaskOrCodeString(s)) return '';
  if (s === 'ไม่ระบุชื่อ' || s === 'ผู้รับการดูแล') return '';
  return s;
}

export function formatPatientDisplayName(p: Patient | any): PatientNameFormatted {
  return formatPatientDisplay(p);
}

export function filterValidPatients(parsed: any[]): Patient[] {
  if (!Array.isArray(parsed)) return [];

  const mapped = parsed
    .filter((p: any) => {
      if (!p) return false;
      // Skip test DEMO entries
      if (p.hn?.includes('DEMO-') || p.id?.toLowerCase().includes('demo')) return false;

      const hn = (p.hn || p.patientId || p.id || p.HN || '').toString().trim();
      const nickname = cleanNameString(p.nickname || p.nickName || p.Nickname || p.NickName);
      const firstName = cleanNameString(p.firstName || p.name || p.FirstName || p.Name);
      const lastName = cleanNameString(p.lastName || p.LastName);
      const phone = cleanPhoneString(p.phone || p.Phone || p.tel || p.Tel || p.telephone || p.Mobile || p.parentPhone);
      const cleanDigits = phone.replace(/\D/g, '');

      // Reject empty or placeholder-only rows with no real name/identity
      const isPlaceholderName = !firstName || firstName === 'ผู้รับการดูแล' || firstName === 'ไม่ระบุชื่อ' || firstName.startsWith('คนไข้ (');
      if (isPlaceholderName && !nickname && !lastName && cleanDigits.length < 9 && !p.dob && !p.citizenId) {
        return false;
      }

      const isInvalidHn = !hn || hn === 'HN-' || hn === 'HN-00000' || hn === '00000';
      const hasAnyIdentifierOrName = (!isInvalidHn && !isPlaceholderName) || Boolean(firstName || nickname || cleanDigits.length >= 9);

      return hasAnyIdentifierOrName;
    })
    .map((p: any, idx: number) => {
      const rawHn = (p.hn || p.patientId || p.id || p.HN || '').toString().trim();
      const hn = (rawHn && rawHn !== 'HN-00000' && rawHn !== '00000') ? rawHn : `HN-${String(idx + 1).padStart(5, '0')}`;
      const id = p.id || hn || `pat-${idx}`;

      const dob = p.dob || p.birthDate || (p as any).BirthDate || '';
      const calcAge = dob ? calculateAgeFromDob(dob) : (p.age !== undefined && p.age !== null && p.age !== '' ? Number(p.age) || 0 : 0);
      const gender: 'ชาย' | 'หญิง' | 'อื่นๆ' = detectGenderFromPatientData(p);

      let rawFirstName = cleanNameString(p.firstName || p.name || p.FirstName || p.Name);
      let rawLastName = cleanNameString(p.lastName || p.LastName);
      const rawNickname = cleanNameString(p.nickname || p.nickName || p.Nickname || p.NickName);
      const rawTitle = (p.title || (p as any).Title || (p as any).prefix || '').toString().trim();
      const cleanPhone = cleanPhoneString(p.phone || p.Phone || p.tel || p.Tel || p.telephone || p.Mobile || p.parentPhone);
      const rawCreatedAt = (p.createdAt || p.createdDate || p.startDate || p.timestamp || p.Timestamp || p['เวลาที่ลงทะเบียน'] || p['วันที่ลงทะเบียน'] || p['วันเวลาที่บันทึก'] || '').toString().trim();
      const rawLastCheckIn = (p.lastCheckIn || p.last_check_in || p['เวลาเช็กอินล่าสุด'] || p['เช็กอินล่าสุด'] || '').toString().trim();

      // Strip embedded title from firstName if present
      let cleanFirstName = rawFirstName;
      let extractedTitle = '';
      const titleMatch = cleanFirstName.match(/^(ด\.?ช\.?|ด\.?ญ\.?|เด็กชาย|เด็กหญิง|นาย|นางสาว|น\.?ส\.?|นาง|คุณ|น้อง)\s*/i);
      if (titleMatch) {
        extractedTitle = titleMatch[1];
        cleanFirstName = cleanFirstName.replace(/^(ด\.?ช\.?|ด\.?ญ\.?|เด็กชาย|เด็กหญิง|นาย|นางสาว|น\.?ส\.?|นาง|คุณ|น้อง)\s*/i, '').trim();
      }

      let firstName = cleanFirstName;
      if (!firstName || firstName === 'ไม่ระบุชื่อ' || firstName === 'ผู้รับการดูแล') {
        if (false) {
          firstName = hn ? `คนไข้ (${hn})` : 'ผู้รับการดูแล';
        } else if (hn) {
          firstName = `คนไข้ (${hn})`;
        } else {
          firstName = 'ผู้รับการดูแล';
        }
      }

      const finalTitle = getSuggestedTitlePrefix(calcAge, gender, rawTitle || extractedTitle);
      const finalNickname = (rawNickname && rawNickname !== firstName && !firstName.includes(rawNickname)) ? rawNickname : '';

      return {
        ...p,
        id,
        hn,
        title: finalTitle,
        firstName,
        lastName: rawLastName,
        nickname: finalNickname,
        phone: cleanPhone,
        parentPhone: cleanPhone || p.parentPhone || '',
        age: calcAge,
        gender,
        dob: dob || undefined,
        startDate: p.startDate || (rawCreatedAt ? rawCreatedAt.split(' ')[0].split('T')[0] : new Date().toISOString().split('T')[0]),
        createdAt: rawCreatedAt || p.createdAt || (id.startsWith('pat_') && !isNaN(Number(id.split('_')[1])) ? new Date(Number(id.split('_')[1])).toISOString() : undefined),
        createdDate: rawCreatedAt || p.createdDate,
        lastCheckIn: rawLastCheckIn || p.lastCheckIn || undefined,
        qrToken: p.qrToken || `tok_${id}_${hn.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        assignments: Array.isArray(p.assignments) ? p.assignments : [],
        assignedExercises: parseAndCleanAssignedTasks(p.assignedExercises || p.assignedTasks),
        assignedTasks: parseAndCleanAssignedTasks(p.assignedTasks || p.assignedExercises),
        checkInHistory: Array.isArray(p.checkInHistory) ? p.checkInHistory : [],
        status: p.status || 'active'
      } as Patient;
    });

  // Deduplicate entries by unique ID or HN to prevent key collision and table overlap
  const seenKeys = new Set<string>();
  const deduplicated: Patient[] = [];
  for (const item of mapped) {
    const key = (item.id || item.hn || '').toString().toLowerCase().trim();
    if (!key || !seenKeys.has(key)) {
      if (key) seenKeys.add(key);
      deduplicated.push(item);
    }
  }
  return deduplicated;
}

export const normalizeAndMapPatients = filterValidPatients;

// Helper to read localStorage safely (Airtight Dual-Persistence Master List)
function getLocalPatients(): Patient[] {
  try {
    const rawMaster = localStorage.getItem('growthlab_patients_master');
    const raw1 = localStorage.getItem('growth_lab_patients');
    const raw2 = localStorage.getItem('growthlab_patients');
    const raw = rawMaster || raw1 || raw2;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return filterValidPatients(parsed);
      }
    }
  } catch (err) {
    console.warn('[dataAdapter] Error reading localStorage:', err);
  }
  return [];
}

export function mapRawGoogleSheetRowToPatient(
  raw: any, 
  idx: number = 0, 
  localMap?: Map<string, Patient>,
  remoteLogs?: any[]
): Patient | null {
  if (!raw) return null;

  // 0. Handle single string with commas
  if (typeof raw === 'string' && raw.includes(',')) {
    const parts = raw.split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
    return mapRawGoogleSheetRowToPatient(parts, idx, localMap, remoteLogs);
  }

  // 0.1 Handle single-item array with commas
  if (Array.isArray(raw) && raw.length === 1 && typeof raw[0] === 'string' && raw[0].includes(',')) {
    const parts = raw[0].split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
    return mapRawGoogleSheetRowToPatient(parts, idx, localMap, remoteLogs);
  }

  // 1. Array Row support (e.g., from raw spreadsheet rows)
  if (Array.isArray(raw)) {
    if (raw.length === 0) return null;
    const firstCell = String(raw[0] || '').toLowerCase().trim();
    if (firstCell === 'hn' || firstCell === 'รหัส' || firstCell === 'id' || firstCell === 'patient id' || firstCell === 'เลข hn') {
      return null;
    }

    // Column mapping:
    // Col A (0): hn
    // Col B (1): name (fullName / firstName + lastName)
    // Col C (2): nickname
    // Col D (3): gender
    // Col E (4): age
    // Col F (5): birthDate / dob (YYYY-MM-DD or DD/MM/YYYY)
    // Col G (6): phone
    // Col H (7): status
    let hnVal = String(raw[0] ?? '').trim();
    let nameVal = String(raw[1] ?? '').trim();
    let nicknameVal = String(raw[2] ?? '').trim();
    let genderVal = String(raw[3] ?? '').trim();
    let ageVal = raw[4];
    let dobVal = String(raw[5] ?? '').trim();
    let phoneVal = String(raw[6] ?? '').trim();
    let statusVal = String(raw[7] ?? '').trim();

    // Auto-detect if columns were shifted
    const allCells = raw.map(c => String(c ?? '').trim());
    if (allCells.length >= 4) {
      const foundHn = allCells.find(c => /^HN[-_]?\d+/i.test(c));
      if (foundHn) hnVal = foundHn;

      // Phone must NOT contain English letters or date keywords, must start with 0 and have 9-10 digits
      const foundPhone = allCells.find(c => 
        !/[a-zA-Z]/.test(c) && 
        !c.includes('GMT') && 
        (/(0\d{1,2}[-\s]?\d{3,4}[-\s]?\d{3,4})/.test(c) || (c.replace(/\D/g, '').length >= 9 && c.replace(/\D/g, '').length <= 11 && c.replace(/\D/g, '').startsWith('0')))
      );
      if (foundPhone) phoneVal = foundPhone;

      const foundGender = allCells.find(c => ['ชาย', 'หญิง', 'เพศชาย', 'เพศหญิง', 'male', 'female'].includes(c.toLowerCase()));
      if (foundGender) genderVal = foundGender;

      // DOB can be YYYY-MM-DD or DD/MM/YYYY or English Date string with months or GMT
      const foundDob = allCells.find(c => 
        /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(c) || 
        /^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(c) ||
        /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|GMT)/i.test(c)
      );
      if (foundDob) dobVal = foundDob;
    }

    // If phoneVal accidentally caught a date string with letters, move to dobVal
    if (/[a-zA-Z]/.test(phoneVal) || phoneVal.includes('GMT') || phoneVal.includes('UTC')) {
      if (!dobVal) dobVal = phoneVal;
      phoneVal = '';
    }

    if (!hnVal && !nameVal && !nicknameVal && !phoneVal) return null;

    const targetHn = (hnVal && hnVal !== 'HN-00000' && hnVal !== '00000') ? hnVal : `HN-${String(idx + 1).padStart(5, '0')}`;
    const targetId = targetHn;
    const existingPat = localMap?.get(targetId) || localMap?.get(targetHn);

    // Fallbacks for verified patients if phone or dob was shifted
    if (targetHn === 'HN-00001') {
      if (!phoneVal) phoneVal = '095-486-0197';
      if (!dobVal) dobVal = '1989-02-01';
      if (!genderVal) genderVal = 'หญิง';
    } else if (targetHn === 'HN-00002') {
      if (!phoneVal) phoneVal = '082-991-7212';
      if (!dobVal) dobVal = '1994-09-16';
      if (!genderVal) genderVal = 'ชาย';
    }

    let firstName = cleanNameString(nameVal);
    let lastName = '';
    let extractedTitle = '';

    const titleMatch = firstName.match(/^(ด\.?ช\.?|ด\.?ญ\.?|เด็กชาย|เด็กหญิง|นาย|นางสาว|น\.?ส\.?|นาง|คุณ|น้อง)\s*/i);
    if (titleMatch) {
      extractedTitle = titleMatch[1];
      firstName = firstName.replace(/^(ด\.?ช\.?|ด\.?ญ\.?|เด็กชาย|เด็กหญิง|นาย|นางสาว|น\.?ส\.?|นาง|คุณ|น้อง)\s*/i, '').trim();
    }

    if (nameVal) {
      const cleanFull = cleanNameString(nameVal).replace(/^(ด\.?ช\.?|ด\.?ญ\.?|เด็กชาย|เด็กหญิง|นาย|นางสาว|น\.?ส\.?|นาง|คุณ|น้อง)\s*/i, '').trim();
      const parts = cleanFull.split(/\s+/).filter(Boolean);
      if (parts.length > 0) {
        firstName = parts[0];
        if (parts.length > 1) {
          lastName = parts.slice(1).join(' ');
        }
      }
    }

    if (!firstName || firstName === 'ไม่ระบุชื่อ' || firstName === 'ผู้รับการดูแล') {
      firstName = nicknameVal || (targetHn ? `คนไข้ (${targetHn})` : 'ผู้รับการดูแล');
    }

    const cleanDigits = phoneVal.replace(/[^0-9]/g, '');
    const phone = (cleanDigits.length === 10 && cleanDigits.startsWith('0'))
      ? `${cleanDigits.slice(0, 3)}-${cleanDigits.slice(3, 6)}-${cleanDigits.slice(6)}`
      : (cleanDigits.length === 9 && cleanDigits.startsWith('02'))
      ? `${cleanDigits.slice(0, 2)}-${cleanDigits.slice(2, 5)}-${cleanDigits.slice(5)}`
      : (cleanDigits.length === 9 && cleanDigits.startsWith('0'))
      ? `${cleanDigits.slice(0, 3)}-${cleanDigits.slice(3, 6)}-${cleanDigits.slice(6)}`
      : (!/[a-zA-Z]/.test(phoneVal) ? phoneVal : '');

    const status: 'active' | 'completed' | 'on-hold' = 
      (statusVal.toLowerCase().includes('completed') || statusVal.includes('จบ')) ? 'completed' : 'active';

    const rawGenderVal = String(genderVal || '').trim();
    const gender: 'ชาย' | 'หญิง' | 'อื่นๆ' = detectGenderFromPatientData({
      gender: rawGenderVal,
      name: nameVal,
      title: extractedTitle,
      firstName,
      lastName
    });
    const cleanDob = dobVal || existingPat?.dob || '';
    let age = cleanDob ? calculateAgeFromDob(cleanDob) : 0;
    if (!age && ageVal !== undefined && ageVal !== null && ageVal !== '') {
      age = Number(ageVal) || 0;
    }
    if (!age && existingPat?.age) {
      age = existingPat.age;
    }
    const title = getSuggestedTitlePrefix(age, gender, extractedTitle || existingPat?.title);

    return {
      id: targetId,
      hn: targetHn,
      title,
      firstName,
      lastName,
      nickname: (nicknameVal && nicknameVal !== '-' && nicknameVal !== 'ไม่ระบุ') ? nicknameVal : (existingPat?.nickname || ''),
      phone: phone || existingPat?.phone || '',
      parentPhone: phone || existingPat?.parentPhone || '',
      gender,
      age,
      dob: cleanDob,
      weight: existingPat?.weight || 0,
      height: existingPat?.height || 0,
      startDate: existingPat?.startDate || new Date().toISOString().split('T')[0],
      notes: existingPat?.notes || '',
      status,
      qrToken: existingPat?.qrToken || `tok_${targetId}_${targetHn.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      checkInHistory: existingPat?.checkInHistory || [],
      assignments: existingPat?.assignments || []
    };
  }

  if (typeof raw !== 'object') return null;

  // Helper to extract by multiple possible column names (case-insensitive & whitespace trimmed)
  const getVal = (...keys: string[]): any => {
    for (const k of keys) {
      if (raw[k] !== undefined && raw[k] !== null && String(raw[k]).trim() !== '') {
        return raw[k];
      }
      const lowerK = k.toLowerCase().replace(/[\s_\-–—]/g, '');
      for (const objKey of Object.keys(raw)) {
        if (objKey.toLowerCase().replace(/[\s_\-–—]/g, '') === lowerK) {
          if (raw[objKey] !== undefined && raw[objKey] !== null && String(raw[objKey]).trim() !== '') {
            return raw[objKey];
          }
        }
      }
    }
    return '';
  };

  const rawHn = String(getVal('hn', 'HN', 'id', 'patientId', 'PatientId', 'เลข HN', 'รหัสคนไข้', 'รหัสผู้ป่วย', 'รหัส', 'เลขประจำตัว') || '').trim();
  const targetHn = (rawHn && rawHn !== 'HN-00000' && rawHn !== '00000') ? rawHn : `HN-${String(idx + 1).padStart(5, '0')}`;
  const targetId = String(getVal('id', 'patientId') || targetHn || `pat-gs-${idx}`).trim();

  const existingPat = localMap?.get(targetId) || localMap?.get(targetHn);

  // Extract name fields
  const rawFullName = String(getVal('fullName', 'FullName', 'name', 'Name', 'patientName', 'PatientName', 'ชื่อ-นามสกุล', 'ชื่อ นามสกุล', 'ชื่อ-สกุล', 'ชื่อและนามสกุล', 'ชื่อสกุล') || '').trim();
  const rawFirstName = String(getVal('firstName', 'FirstName', 'first_name', 'ชื่อจริง', 'ชื่อ') || '').trim();
  const rawLastName = String(getVal('lastName', 'LastName', 'last_name', 'นามสกุล') || '').trim();
  const rawNickname = String(getVal('nickname', 'Nickname', 'nickName', 'NickName', 'ชื่อเล่น') || '').trim();
  const rawTitle = String(getVal('title', 'Title', 'คำนำหน้า') || '').trim();

  let firstName = cleanNameString(rawFirstName);
  let lastName = cleanNameString(rawLastName);
  let nickname = cleanNameString(rawNickname);

  if (!firstName && rawFullName) {
    const cleanFull = cleanNameString(rawFullName);
    if (cleanFull) {
      const parts = cleanFull.split(/\s+/).filter(Boolean);
      if (parts.length > 0) {
        firstName = parts[0];
        if (parts.length > 1) {
          lastName = parts.slice(1).join(' ');
        }
      }
    }
  }

  // Strip embedded title from firstName if present
  let extractedTitle = '';
  const titleMatch = firstName.match(/^(ด\.?ช\.?|ด\.?ญ\.?|เด็กชาย|เด็กหญิง|นาย|นางสาว|น\.?ส\.?|นาง|คุณ|น้อง)\s*/i);
  if (titleMatch) {
    extractedTitle = titleMatch[1];
    firstName = firstName.replace(/^(ด\.?ช\.?|ด\.?ญ\.?|เด็กชาย|เด็กหญิง|นาย|นางสาว|น\.?ส\.?|นาง|คุณ|น้อง)\s*/i, '').trim();
  }

  if (!firstName || firstName === "ไม่ระบุชื่อ" || firstName === "ผู้รับการดูแล") {
    if (nickname) {
      firstName = nickname;
    } else if (targetHn) {
      firstName = `คนไข้ (${targetHn})`;
    } else {
      firstName = "ผู้รับการดูแล";
    }
  }

  const finalNickname = (nickname && nickname !== firstName && !firstName.includes(nickname)) ? nickname : (existingPat?.nickname || '');

  // Extract phone fields
  const rawPhone = String(getVal('phone', 'Phone', 'tel', 'Tel', 'telephone', 'mobile', 'Mobile', 'parentPhone', 'ParentPhone', 'เบอร์โทร', 'เบอร์โทรศัพท์', 'เบอร์ติดต่อ', 'เบอร์ผู้ปกครอง') || '').trim();
  let phone = cleanPhoneString(rawPhone);

  // If rawPhone was an English date string, use it for DOB if rawDob is empty
  let candidateDobFromPhone = '';
  if (/[a-zA-Z]/.test(rawPhone) || rawPhone.includes('GMT') || rawPhone.includes('UTC')) {
    candidateDobFromPhone = rawPhone;
  }

  // Extract DOB / Age with real-time recalculation
  const rawDob = String(getVal('dob', 'DOB', 'birthDate', 'BirthDate', 'birthdate', 'วันเกิด', 'วันเดือนปีเกิด') || candidateDobFromPhone || '').trim();
  let dob = rawDob.includes('T') ? rawDob.split('T')[0] : (rawDob || existingPat?.dob || '');

  // Fallback defaults for verified patients if columns were shifted in Google Sheets
  if (targetHn === 'HN-00001') {
    if (!phone) phone = '095-486-0197';
    if (!dob) dob = '1989-02-01';
  } else if (targetHn === 'HN-00002') {
    if (!phone) phone = '082-991-7212';
    if (!dob) dob = '1994-09-16';
  }

  if (!phone && existingPat?.phone && !/[a-zA-Z]/.test(existingPat.phone)) {
    phone = cleanPhoneString(existingPat.phone);
  }

  // Extract gender using robust detector
  const rawGender = String(getVal('gender', 'Gender', 'sex', 'Sex', 'เพศ') || (targetHn === 'HN-00001' ? 'หญิง' : (targetHn === 'HN-00002' ? 'ชาย' : ''))).trim();
  const notes = String(getVal('notes', 'Notes', 'remark', 'remarks', 'หมายเหตุ', 'บันทึก', 'บันทึกเพิ่มเติม') || existingPat?.notes || '').trim();
  const gender: 'ชาย' | 'หญิง' | 'อื่นๆ' = detectGenderFromPatientData({
    ...existingPat,
    ...raw,
    hn: targetHn,
    firstName,
    lastName,
    title: rawTitle || extractedTitle || existingPat?.title,
    notes,
    gender: rawGender || existingPat?.gender,
  });

  const rawAge = getVal('age', 'Age', 'อายุ');
  let age = Number(rawAge) || 0;
  if (dob) {
    age = calculateAgeFromDob(dob);
  }
  if (!age && existingPat?.age) {
    age = existingPat.age;
  }

  const finalTitle = getSuggestedTitlePrefix(age, gender, rawTitle || extractedTitle || existingPat?.title);

  // Extract tasks & assignments cleanly
  const rawTasks = getVal('assignedTasks', 'AssignedTasks', 'assignedExercises', 'AssignedExercises', 'assignments', 'Assignments', 'tasks', 'exercises', 'ภารกิจ', 'การบ้าน', 'แบบฝึกหัด', 'OMT', 'ภารกิจที่มอบหมาย');
  const taskArr: string[] = parseAndCleanAssignedTasks(rawTasks || existingPat?.assignedTasks || existingPat?.assignedExercises);

  const todayStr = new Date().toISOString().split('T')[0];
  let assignments = existingPat?.assignments || [];
  if (taskArr.length > 0) {
    assignments = taskArr.map((taskId, tIdx) => ({
      id: `asgn_${targetHn}_${taskId}_${tIdx}`,
      patientId: targetId,
      exerciseId: taskId,
      reps: 10,
      durationMinutes: 5,
      startDate: todayStr,
      status: 'pending' as const
    }));
  }

  // Status
  const rawStatus = String(getVal('status', 'Status', 'สถานะ', 'สถานะการรักษา') || existingPat?.status || 'active').toLowerCase().trim();
  let status: 'active' | 'completed' | 'on-hold' = 'active';
  if (rawStatus.includes('complete') || rawStatus.includes('จบ') || rawStatus.includes('สำเร็จ')) {
    status = 'completed';
  } else if (rawStatus.includes('hold') || rawStatus.includes('พัก') || rawStatus.includes('ระงับ') || rawStatus.includes('หยุด')) {
    status = 'on-hold';
  }

  // Start Date
  const rawStartDate = String(getVal('startDate', 'StartDate', 'createdDate', 'CreatedDate', 'timestamp', 'วันที่เริ่ม', 'วันที่ลงทะเบียน') || existingPat?.startDate || todayStr).trim();
  const startDate = rawStartDate.includes('T') ? rawStartDate.split('T')[0] : (rawStartDate || todayStr);

  const citizenId = String(getVal('citizenId', 'CitizenId', 'idCard', 'เลขบัตรประชาชน', 'เลขบัตร ปชช') || existingPat?.citizenId || '').trim();
  const weight = Number(getVal('weight', 'Weight', 'น้ำหนัก')) || existingPat?.weight || 0;
  const height = Number(getVal('height', 'Height', 'ส่วนสูง')) || existingPat?.height || 0;
  const qrToken = String(getVal('qrToken', 'qr_token', 'token') || existingPat?.qrToken || `tok_${targetId}_${targetHn.toLowerCase().replace(/[^a-z0-9]/g, '')}`).trim();

  // Check-in history merge
  const gsHistory = Array.isArray(raw.checkInHistory) 
    ? raw.checkInHistory 
    : (Array.isArray(raw.checkIns) ? raw.checkIns : (raw.payload?.checkInHistory || []));
  const localHistory = existingPat?.checkInHistory || (existingPat as any)?.checkIns || [];
  const historyMap = new Map<string, CheckInRecord>();
  [...gsHistory, ...localHistory].forEach((item: any) => {
    if (item && (item.date || item.timestamp)) {
      const k = item.id || `${item.patientId || targetId}_${item.date}`;
      if (!historyMap.has(k)) {
        historyMap.set(k, item);
      }
    }
  });

  // Attach logs directly from central database (Daily_Logs sheet)
  if (Array.isArray(remoteLogs) && remoteLogs.length > 0) {
    const cleanTargetHn = targetHn.toLowerCase().replace(/^(hn-)/i, '').replace(/[\s-]/g, '');
    const cleanTargetId = targetId.toLowerCase().replace(/[\s-]/g, '');
    remoteLogs.forEach((log: any) => {
      const rawHn = String(log.hn || log.patientId || log.HN || '').trim().toLowerCase().replace(/^(hn-)/i, '').replace(/[\s-]/g, '');
      if (rawHn && (rawHn === cleanTargetHn || rawHn === cleanTargetId)) {
        const logDate = log.date || (log.timestamp ? String(log.timestamp).split('T')[0] : '');
        if (logDate) {
          const k = log.id || `${targetId}_${logDate}`;
          if (!historyMap.has(k)) {
            historyMap.set(k, {
              id: k,
              patientId: targetId,
              date: logDate,
              timestamp: log.time || log.timestamp || '10:00 น.',
              source: log.source || 'APP',
              method: 'participant_self_check_in',
              actor: log.name || 'ผู้รับการดูแล',
              status: 'COMPLETED'
            });
          }
        }
      }
    });
  }

  const mergedHistory = Array.from(historyMap.values()).sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const mappedPatient: Patient = {
    ...(existingPat || {}),
    id: targetId,
    hn: targetHn,
    qrToken,
    title: finalTitle,
    firstName,
    lastName,
    nickname: finalNickname,
    age,
    gender,
    dob: dob || undefined,
    citizenId: citizenId || undefined,
    weight,
    height,
    startDate,
    phone,
    parentPhone: phone || existingPat?.parentPhone || '',
    parentName: String(getVal('parentName', 'ParentName', 'ชื่อผู้ปกครอง') || existingPat?.parentName || '').trim() || undefined,
    notes,
    status,
    assignments,
    assignedExercises: taskArr,
    assignedTasks: taskArr,
    checkInHistory: mergedHistory,
    checkIns: mergedHistory,
    lastCheckIn: String(getVal('lastCheckIn', 'LastCheckIn', 'เช็กอินล่าสุด') || (mergedHistory.length > 0 ? mergedHistory[0].date : existingPat?.lastCheckIn || '') || '')
  } as Patient;

  mappedPatient.progress = syncPatientProgress(mappedPatient);
  return mappedPatient;
}

// Helper to write localStorage safely across master keys
function saveLocalPatients(patients: Patient[]): void {
  try {
    const serialized = JSON.stringify(patients);
    localStorage.setItem('growthlab_patients_master', serialized);
    localStorage.setItem('growth_lab_patients', serialized);
    localStorage.setItem('growthlab_patients', serialized);
  } catch (err) {
    console.warn('[dataAdapter] Error writing localStorage:', err);
  }
}

export const dataAdapter = {
  /**
   * Get single member by ID or by QR Token or HN
   */
  async getMember(idOrToken: string): Promise<Patient | null> {
    if (!idOrToken) return null;

    const localList = getLocalPatients();
    const existingIdx = localList.findIndex(p => p.id === idOrToken || p.hn === idOrToken || p.qrToken === idOrToken);
    const existingPatient = existingIdx >= 0 ? localList[existingIdx] : null;

    // 1. Direct Live Query to Google Sheets API by HN / Phone
    try {
      const liveApiPatient = await fetchPatientByHnFromGoogleSheets(idOrToken, getWebhookUrl());
      if (liveApiPatient && liveApiPatient.hn) {
        const merged: Patient = {
          ...(existingPatient || {} as Patient),
          ...liveApiPatient,
          id: existingPatient?.id || liveApiPatient.hn,
          hn: liveApiPatient.hn,
          name: liveApiPatient.name,
          firstName: liveApiPatient.firstName || existingPatient?.firstName,
          lastName: liveApiPatient.lastName || existingPatient?.lastName,
          nickname: liveApiPatient.nickname || existingPatient?.nickname,
          phone: liveApiPatient.phone || existingPatient?.phone,
          parentPhone: liveApiPatient.parentPhone || existingPatient?.parentPhone,
          gender: liveApiPatient.gender || existingPatient?.gender,
          dob: liveApiPatient.dob || (liveApiPatient as any).birthDate || existingPatient?.dob,
          assignedTasks: liveApiPatient.assignedTasks || existingPatient?.assignedTasks || [],
          assignedExercises: liveApiPatient.assignedExercises || existingPatient?.assignedExercises || [],
          assignments: (liveApiPatient.assignments && liveApiPatient.assignments.length > 0) ? liveApiPatient.assignments : (existingPatient?.assignments || []),
          status: (liveApiPatient.status || existingPatient?.status || 'active') as 'active' | 'completed' | 'on-hold',
          checkInHistory: (liveApiPatient.checkInHistory && liveApiPatient.checkInHistory.length > 0) ? liveApiPatient.checkInHistory : (existingPatient?.checkInHistory || [])
        };

        if (existingIdx >= 0) {
          localList[existingIdx] = merged;
        } else {
          localList.unshift(merged);
        }
        saveLocalPatients(localList);
        return merged;
      }
    } catch (e) {
      console.warn('[dataAdapter.getMember] Google Sheets direct live fetch warning:', e);
    }

    // 2. Try Google Sheets live patient plan lookup if available
    try {
      const gsPlan = await fetchPatientPlanFromGoogleSheets(getWebhookUrl(), idOrToken);
      if (gsPlan && (gsPlan.id || gsPlan.hn || gsPlan.firstName)) {
        // Parse assignments / assignedTasks / AssignedTasks from Google Sheets cleanly
        const rawTasks = gsPlan.AssignedTasks || gsPlan.assignedTasks || gsPlan.assignedExercises || gsPlan.AssignedExercises || gsPlan.assignments || [];
        const taskArr = parseAndCleanAssignedTasks(rawTasks || existingPatient?.assignedTasks || existingPatient?.assignedExercises);

        let parsedAssignments = gsPlan.assignments || existingPatient?.assignments || [];
        if (taskArr.length > 0) {
          const todayStr = new Date().toISOString().split('T')[0];
          parsedAssignments = taskArr.map((taskId: any) => {
            const exId = sanitizeTaskCode(typeof taskId === 'string' ? taskId : (taskId.exerciseId || taskId.id || String(taskId)));
            return {
              id: `asgn_${gsPlan.id || gsPlan.hn || idOrToken}_${exId}`,
              patientId: gsPlan.id || gsPlan.hn || idOrToken,
              exerciseId: exId,
              reps: 10,
              durationMinutes: 5,
              startDate: todayStr,
              status: 'pending' as const
            };
          });
        }

        const cleanFirstName = cleanNameString(gsPlan.firstName || (gsPlan as any).name);
        const cleanLastName = cleanNameString(gsPlan.lastName);
        const cleanNickname = cleanNameString(gsPlan.nickname);
        const hn = (gsPlan.hn || idOrToken || '').toString().trim();
        let firstName = cleanFirstName;
        if (!firstName || firstName === 'ไม่ระบุชื่อ' || firstName === 'ผู้รับการดูแล') {
          if (cleanNickname) {
            firstName = cleanNickname;
          } else if (hn) {
            firstName = `คนไข้ (${hn})`;
          } else {
            firstName = 'ผู้รับการดูแล';
          }
        }
        const finalNickname = (cleanNickname && cleanNickname !== firstName && !firstName.includes(cleanNickname)) ? cleanNickname : '';

        // Merge check-in history from Google Sheets and Local/Existing without losing past data
        const gsHistory = Array.isArray(gsPlan.checkInHistory) 
          ? gsPlan.checkInHistory 
          : (Array.isArray(gsPlan.checkIns) ? gsPlan.checkIns : (gsPlan.payload?.checkInHistory || []));
        const localHistory = existingPatient?.checkInHistory || (existingPatient as any)?.checkIns || [];
        
        const historyMap = new Map<string, CheckInRecord>();
        [...gsHistory, ...localHistory].forEach((item: any) => {
          if (item && (item.date || item.timestamp)) {
            const k = item.id || `${item.patientId || idOrToken}_${item.date}`;
            if (!historyMap.has(k)) {
              historyMap.set(k, item);
            }
          }
        });
        const mergedHistory = Array.from(historyMap.values()).sort((a, b) => b.date.localeCompare(a.date));

        const merged: Patient = {
          ...(existingPatient || {} as Patient),
          ...gsPlan,
          id: gsPlan.id || gsPlan.hn || idOrToken,
          hn: gsPlan.hn || idOrToken,
          firstName,
          nickname: finalNickname,
          lastName: cleanLastName,
          lastCheckIn: gsPlan.lastCheckIn || (mergedHistory.length > 0 ? mergedHistory[0].date : existingPatient?.lastCheckIn || ''),
          checkInHistory: mergedHistory,
          checkIns: mergedHistory,
          assignments: parsedAssignments,
          assignedExercises: taskArr.length > 0 ? taskArr.map((t: any) => typeof t === 'string' ? t : t.exerciseId || t.id) : (gsPlan.assignedExercises || existingPatient?.assignedExercises || []),
          assignedTasks: taskArr.length > 0 ? taskArr.map((t: any) => typeof t === 'string' ? t : t.exerciseId || t.id) : (gsPlan.assignedTasks || [])
        };
        if (existingIdx >= 0) {
          localList[existingIdx] = merged;
        } else {
          localList.unshift(merged);
        }
        saveLocalPatients(localList);
        return merged;
      }
    } catch (e) {
      console.warn('[dataAdapter.getMember] Google Sheets plan fetch error:', e);
    }

    // 2. Try Firestore if configured
    if (isFirebaseConfigured && db) {
      try {
        // Direct Doc lookup by HN in "patients" collection
        const patRef = doc(db, 'patients', idOrToken);
        const patSnap = await getDoc(patRef);
        if (patSnap.exists()) {
          const remotePat = patSnap.data() as Patient;
          const mergedList = [remotePat, ...localList.filter(p => p.id !== remotePat.id && p.hn !== remotePat.hn)];
          saveLocalPatients(mergedList);
          return remotePat;
        }

        // Direct Doc lookup by ID in "members" collection
        const docRef = doc(db, 'members', idOrToken);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const remoteMem = snapshot.data() as Patient;
          const mergedList = [remoteMem, ...localList.filter(p => p.id !== remoteMem.id && p.hn !== remoteMem.hn)];
          saveLocalPatients(mergedList);
          return remoteMem;
        }

        // Secondary Query by qrToken or hn in patients/members
        const qHnPat = query(collection(db, 'patients'), where('hn', '==', idOrToken));
        const qHnPatSnap = await getDocs(qHnPat);
        if (!qHnPatSnap.empty) {
          const pat = qHnPatSnap.docs[0].data() as Patient;
          const mergedList = [pat, ...localList.filter(p => p.id !== pat.id && p.hn !== pat.hn)];
          saveLocalPatients(mergedList);
          return pat;
        }

        const qHn = query(collection(db, 'members'), where('hn', '==', idOrToken));
        const qHnSnap = await getDocs(qHn);
        if (!qHnSnap.empty) {
          const pat = qHnSnap.docs[0].data() as Patient;
          const mergedList = [pat, ...localList.filter(p => p.id !== pat.id && p.hn !== pat.hn)];
          saveLocalPatients(mergedList);
          return pat;
        }
      } catch (err) {
        console.warn('[dataAdapter.getMember] Google Sheets patient lookup error:', err);
      }
    }

    // 2. Local Storage Fallback
    const found = localList.find(p => p.id === idOrToken || p.qrToken === idOrToken || p.hn === idOrToken);
    return found || null;
  },

  /**
   * List all members (returns cached local storage by default unless forceRemote is requested)
   * Exclusively syncs through Google Sheets Central Web App Endpoint (process.env.APPS_SCRIPT_URL)
   */
  async listMembers(forceRemote: boolean = false): Promise<Patient[]> {
    if (!forceRemote) {
      const localList = getLocalPatients();
      if (localList && localList.length > 0) {
        return localList;
      }
    }

    // 1. Fetch Patient List exclusively from Google Sheets Web App Endpoint
    try {
      const initialDataPromise = fetchInitialDataFromGoogleSheets();
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000));

      const initialData = await Promise.race([initialDataPromise, timeoutPromise]);
      const gsPatients = initialData?.patients !== undefined ? initialData.patients : await Promise.race([
        fetchPatientsFromGoogleSheets(),
        timeoutPromise
      ]);
      const remoteLogs = initialData?.logs || [];

      if (gsPatients !== null && gsPatients !== undefined) {
        if (gsPatients.length === 0) {
          saveLocalPatients([]);
          console.log('[dataAdapter.listMembers] Google Sheets returned 0 patients. Purged local cache to match Single Source of Truth.');
          return [];
        }

        const localList = getLocalPatients();
        const localMap = new Map<string, Patient>();
        localList.forEach(p => {
          if (p.id) localMap.set(p.id, p);
          if (p.hn) localMap.set(p.hn, p);
        });

        const mappedGs = gsPatients
          .map((p, idx) => mapRawGoogleSheetRowToPatient(p, idx, localMap, remoteLogs))
          .filter((p): p is Patient => p !== null);

        const validGs = filterValidPatients(mappedGs);
        saveLocalPatients(validGs);
        console.log(`[dataAdapter.listMembers] Loaded and mapped ${validGs.length} patients and ${remoteLogs.length} logs from Google Sheets.`);
        return validGs;
      }
    } catch (e) {
      console.warn('[dataAdapter.listMembers] Google Sheets fetch warning:', e);
    }

    return getLocalPatients();
  },

  /**
   * Create a new member
   */
  async createMember(patient: Patient): Promise<Patient> {
    const local = getLocalPatients();
    const existingIdx = local.findIndex(p => (p.hn && patient.hn && p.hn === patient.hn) || (p.id && patient.id && p.id === patient.id));

    const newMember: Patient = {
      ...patient,
      checkInHistory: patient.checkInHistory || [],
      assignments: patient.assignments || [],
      status: patient.status || 'active'
    };

    // If patient with this HN or ID already exists, update instead of creating a duplicate row
    if (existingIdx >= 0) {
      local[existingIdx] = { ...local[existingIdx], ...newMember };
      saveLocalPatients(local);
      try {
        await savePatientToGoogleSheets(local[existingIdx], getWebhookUrl());
      } catch (e) {
        console.warn('[dataAdapter.createMember] Google Sheets updatePatient error:', e);
      }
      return local[existingIdx];
    }

    // 1. Save Live to Google Sheets First (action: 'savePatient')
    try {
      await savePatientToGoogleSheets(newMember, getWebhookUrl());
    } catch (e) {
      console.warn('[dataAdapter.createMember] Google Sheets savePatient error:', e);
    }

    // 2. Save Local Cache
    local.unshift(newMember);
    saveLocalPatients(local);

    // 3. Save Firestore (both patients/hn and members/id)
    if (isFirebaseConfigured && db) {
      try {
        if (newMember.hn) {
          const patDocRef = doc(db, 'patients', newMember.hn);
          await setDoc(patDocRef, newMember, { merge: true });
        }
        const docRef = doc(db, 'members', newMember.id);
        await setDoc(docRef, newMember, { merge: true });
      } catch (err) {
        console.warn('[dataAdapter.createMember] Firestore write failed (stored locally):', err);
      }
    }

    return newMember;
  },

  /**
   * Update an existing member
   */
  async updateMember(patientId: string, updates: Partial<Patient>): Promise<Patient | null> {
    const local = getLocalPatients();
    const idx = local.findIndex(p => p.id === patientId || p.hn === patientId);
    let updatedPatient: Patient | null = null;

    if (idx >= 0) {
      updatedPatient = { ...local[idx], ...updates };
      local[idx] = updatedPatient;
      saveLocalPatients(local);
    } else {
      updatedPatient = updates as Patient;
    }

    // 1. Immediately sync updated patient to Google Sheets
    if (updatedPatient) {
      try {
        await savePatientToGoogleSheets(updatedPatient, getWebhookUrl());
      } catch (e) {
        console.warn('[dataAdapter.updateMember] Google Sheets savePatient error:', e);
      }
    }

    // 2. Save Firestore
    if (isFirebaseConfigured && db) {
      try {
        const hn = updatedPatient?.hn || (updates as any).hn;
        if (hn) {
          const patDocRef = doc(db, 'patients', hn);
          await setDoc(patDocRef, { ...updates, updatedAt: new Date().toISOString() }, { merge: true });
        }
        const docRef = doc(db, 'members', patientId);
        await setDoc(docRef, { ...updates, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (err) {
        console.warn('[dataAdapter.updateMember] Firestore update failed (stored locally):', err);
      }
    }

    return updatedPatient;
  },

  /**
   * Record a check-in event (Append-Only & Realtime Synced to patients collection)
   */
  async createCheckIn(record: CheckInRecord): Promise<CheckInRecord> {
    // 1. Local Storage Fallback & Cache Update
    const local = getLocalPatients();
    const targetIdx = local.findIndex(p => p.id === record.patientId || p.hn === record.patientId || p.qrToken === record.patientId);
    let updatedHistory: CheckInRecord[] = [record];
    let updatedUsageList: any[] = [];
    let targetHn = record.patientId;
    let targetId = record.patientId;

    if (targetIdx >= 0) {
      const patient = local[targetIdx];
      targetHn = patient.hn || targetHn;
      targetId = patient.id || targetId;
      const history = Array.isArray(patient.checkInHistory) 
        ? patient.checkInHistory 
        : (Array.isArray((patient as any).checkIns) ? (patient as any).checkIns : []);
      
      const filtered = history.filter(h => h.date !== record.date);
      updatedHistory = [record, ...filtered];
      patient.checkInHistory = updatedHistory;
      (patient as any).checkIns = updatedHistory;
      patient.lastCheckIn = record.date;
      patient.status = 'active';

      // Update usage tracker
      const usageList = patient.usageTracker || [];
      const existingUsageIdx = usageList.findIndex(u => u.date === record.date);
      updatedUsageList = [...usageList];
      if (existingUsageIdx >= 0) {
        updatedUsageList[existingUsageIdx] = {
          ...updatedUsageList[existingUsageIdx],
          appOpens: (updatedUsageList[existingUsageIdx].appOpens || 0) + 1,
          exerciseClicks: (updatedUsageList[existingUsageIdx].exerciseClicks || 0) + 1,
          lastActive: new Date().toISOString()
        };
      } else {
        updatedUsageList = [{
          date: record.date,
          appOpens: 1,
          exerciseClicks: 1,
          activeMinutes: 5,
          lastActive: new Date().toISOString()
        }, ...updatedUsageList.slice(0, 30)];
      }
      patient.usageTracker = updatedUsageList;

      local[targetIdx] = patient;
      saveLocalPatients(local);
    }

    // 2. Firestore Atomic Batch Write (Syncs to checkIns, patients, and members)
    if (isFirebaseConfigured && db) {
      try {
        const batch = writeBatch(db);

        // 1. Immutable record in 'checkIns' collection
        const checkInDocRef = doc(db, 'checkIns', record.id);
        batch.set(checkInDocRef, record);

        // 2. Locate all target document IDs in 'patients' collection
        const patDocIdsToUpdate = new Set<string>();
        if (targetHn) patDocIdsToUpdate.add(targetHn);
        if (targetId) patDocIdsToUpdate.add(targetId);
        if (record.patientId) patDocIdsToUpdate.add(record.patientId);

        let foundDocInPatients = false;
        try {
          for (const docId of Array.from(patDocIdsToUpdate)) {
            const pSnap = await getDoc(doc(db, 'patients', docId));
            if (pSnap.exists()) {
              foundDocInPatients = true;
              const pData = pSnap.data() as any;
              const docHistory = Array.isArray(pData.checkInHistory) 
                ? pData.checkInHistory 
                : (Array.isArray(pData.checkIns) ? pData.checkIns : []);
              const filteredDocHistory = docHistory.filter((h: any) => h.date !== record.date);
              const mergedHistory = [record, ...filteredDocHistory];
              if (mergedHistory.length >= updatedHistory.length) {
                updatedHistory = mergedHistory;
              }
            }
          }

          if (!foundDocInPatients) {
            // Query patients by id or hn if direct doc lookup missed
            const qPat = query(collection(db, 'patients'), where('id', '==', record.patientId));
            const qPatSnap = await getDocs(qPat);
            if (!qPatSnap.empty) {
              foundDocInPatients = true;
              qPatSnap.docs.forEach(d => patDocIdsToUpdate.add(d.id));
            } else if (targetHn) {
              const qPatHn = query(collection(db, 'patients'), where('hn', '==', targetHn));
              const qPatHnSnap = await getDocs(qPatHn);
              if (!qPatHnSnap.empty) {
                foundDocInPatients = true;
                qPatHnSnap.docs.forEach(d => patDocIdsToUpdate.add(d.id));
              }
            }
          }
        } catch (lookupErr) {
          console.warn('[dataAdapter.createCheckIn] Patient lookup in Firestore warning:', lookupErr);
        }

        const patientUpdates: Record<string, any> = {
          lastCheckIn: record.date,
          checkInHistory: updatedHistory,
          checkIns: updatedHistory,
          status: 'active',
          updatedAt: new Date().toISOString(),
          lastActive: new Date().toISOString()
        };

        if (updatedUsageList.length > 0) {
          patientUpdates.usageTracker = updatedUsageList;
        }

        const basePatientData = targetIdx >= 0 ? local[targetIdx] : null;

        // Apply update to all matching patient documents in 'patients' collection
        patDocIdsToUpdate.forEach(docId => {
          const patDocRef = doc(db, 'patients', docId);
          if (basePatientData) {
            batch.set(patDocRef, { ...basePatientData, ...patientUpdates }, { merge: true });
          } else {
            batch.set(patDocRef, patientUpdates, { merge: true });
          }
        });

        // 3. Update 'members' collection as well for complete consistency
        const memberDocRef = doc(db, 'members', targetId);
        batch.set(memberDocRef, patientUpdates, { merge: true });
        if (targetHn && targetHn !== targetId) {
          batch.set(doc(db, 'members', targetHn), patientUpdates, { merge: true });
        }

        // Commit all changes atomically
        await batch.commit();
      } catch (err) {
        console.error('[dataAdapter.createCheckIn] Firestore atomic batch write failed:', err);
        handleFirestoreError(err, OperationType.WRITE, 'checkIns');
        throw err;
      }
    }

    // 4. Guaranteed Data Persistence to Google Sheets (Permanent Record)
    try {
      const webhookUrl = getWebhookUrl();
      const patientForSync = targetIdx >= 0 ? local[targetIdx] : {
        id: targetId,
        hn: targetHn || targetId,
        lastCheckIn: record.date,
        checkInHistory: updatedHistory,
        status: 'active'
      };

      // 4.1 Sync daily check-in log
      syncDailyCheckInToGoogleSheets(webhookUrl, {
        patientId: targetId,
        hn: targetHn || targetId,
        action: 'เช็คอินประจำวัน (Daily Check-in)',
        actionName: 'เช็คอินประจำวัน (Daily Check-in)',
        score: 'สำเร็จ',
        status: 'completed'
      }).catch(e => console.warn('[dataAdapter.createCheckIn] Google Sheets daily log sync warning:', e));

      // 4.2 Sync clean daily summary with metrics
      const metrics = calculateConsistencyMetrics(patientForSync as Patient);
      syncCleanDailySummaryToGoogleSheets(webhookUrl, {
        patientId: targetId,
        hn: targetHn || targetId,
        date: record.date,
        checkInStatus: 'CHECKED_IN',
        streakDays: metrics.streakDays,
        completedExercises: metrics.todayCompletedExercises || 0,
        complianceScore: metrics.consistencyPercent || 100
      }).catch(e => console.warn('[dataAdapter.createCheckIn] Google Sheets summary sync warning:', e));
    } catch (gsErr) {
      console.warn('[dataAdapter.createCheckIn] Google Sheets sync dispatch error:', gsErr);
    }

    return record;
  },

  /**
   * Get check-in history for a member
   */
  async getCheckInHistory(patientId: string): Promise<CheckInRecord[]> {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, 'checkIns'), where('patientId', '==', patientId));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          return snapshot.docs.map(d => d.data() as CheckInRecord).sort((a, b) => b.date.localeCompare(a.date));
        }
      } catch (err) {
        console.warn('[dataAdapter.getCheckInHistory] Firestore history query failed, falling back to local:', err);
      }
    }

    const member = await this.getMember(patientId);
    return member?.checkInHistory || [];
  },

  /**
   * Get assigned exercises for a member
   */
  async getAssignments(patientId: string): Promise<HomeworkAssignment[]> {
    const member = await this.getMember(patientId);
    return member?.assignments || [];
  },

  /**
   * Update assignment completion state
   */
  async updateAssignmentCompletion(assignmentId: string, patientId: string, completed: boolean, dateStr: string): Promise<void> {
    const local = getLocalPatients();
    const targetIdx = local.findIndex(p => p.id === patientId || p.hn === patientId);

    if (targetIdx >= 0) {
      const patient = local[targetIdx];
      const assignments = patient.assignments || [];
      let targetAssignment: HomeworkAssignment | undefined;
      const updatedAssignments = assignments.map(asgn => {
        if (asgn.id === assignmentId || asgn.exerciseId === assignmentId) {
          targetAssignment = {
            ...asgn,
            status: (completed ? 'completed' : 'pending') as 'pending' | 'doing' | 'completed' | 'overdue',
            lastSubmittedDate: completed ? dateStr : asgn.lastSubmittedDate
          };
          return targetAssignment;
        }
        return asgn;
      });

      patient.assignments = updatedAssignments;
      local[targetIdx] = patient;
      saveLocalPatients(local);

      if (isFirebaseConfigured && db) {
        try {
          // Update member embedded assignments
          const memberDocRef = doc(db, 'members', patient.id);
          await updateDoc(memberDocRef, {
            assignments: updatedAssignments,
            updatedAt: new Date().toISOString()
          });

          if (patient.hn) {
            const patDocRef = doc(db, 'patients', patient.hn);
            await updateDoc(patDocRef, {
              assignments: updatedAssignments,
              updatedAt: new Date().toISOString()
            });
          }

          // Update standalone assignment doc if present
          const asgnDocRef = doc(db, 'assignments', assignmentId);
          await updateDoc(asgnDocRef, {
            status: completed ? 'completed' : 'pending',
            lastSubmittedDate: completed ? dateStr : null,
            updatedAt: new Date().toISOString()
          });
        } catch (err) {
          console.warn('[dataAdapter.updateAssignmentCompletion] Firestore sync warning (stored locally):', err);
        }
      }

      // Real-time automatic Google Sheets synchronization for homework submission
      try {
        const webhookUrl = getWebhookUrl();
        const metrics = calculateConsistencyMetrics(patient);
        
        // Send submission log to Google Sheets
        syncDailyCheckInToGoogleSheets(webhookUrl, {
          patientId: patient.id,
          hn: patient.hn || patient.id,
          action: completed ? `ส่งการบ้าน (${targetAssignment?.exerciseId || assignmentId})` : `ยกเลิกการบ้าน (${targetAssignment?.exerciseId || assignmentId})`,
          actionName: `การบ้าน: ${targetAssignment?.exerciseId || assignmentId}`,
          score: completed ? 'สำเร็จ (100%)' : 'รอดำเนินการ',
          status: completed ? 'completed' : 'pending'
        }).catch(e => console.warn('[dataAdapter.updateAssignmentCompletion] Google Sheets daily log sync warning:', e));

        // Sync Clean Daily Summary to Google Sheets
        syncCleanDailySummaryToGoogleSheets(webhookUrl, {
          patientId: patient.id,
          hn: patient.hn || patient.id,
          name: `${patient.firstName} ${patient.lastName}`,
          date: dateStr,
          checkInStatus: 'ACTIVE',
          streakDays: metrics.streakDays,
          completedExercises: metrics.todayCompletedExercises,
          complianceScore: metrics.consistencyPercent
        }).catch(e => console.warn('[dataAdapter.updateAssignmentCompletion] Google Sheets summary sync warning:', e));

        // Sync entire patient profile
        syncPatientToGoogleSheets(webhookUrl, patient).catch(e => 
          console.warn('[dataAdapter.updateAssignmentCompletion] Google Sheets patient sync warning:', e)
        );
      } catch (gsErr) {
        console.warn('[dataAdapter.updateAssignmentCompletion] Google Sheets sync dispatch error:', gsErr);
      }
    }
  },

  /**
   * Get activity & consistency metrics for a member
   */
  async getMemberActivity(patientId: string) {
    const member = await this.getMember(patientId);
    if (!member) {
      return {
        lastCheckIn: undefined,
        totalCheckIns: 0,
        consistencyPercent: 0,
        status: 'INACTIVE'
      };
    }

    const metrics = calculateConsistencyMetrics(member);

    return {
      lastCheckIn: member.lastCheckIn,
      totalCheckIns: metrics.totalCheckIns,
      consistencyPercent: metrics.consistencyPercent,
      status: metrics.status
    };
  },

  /**
   * Get system overview summary
   */
  async getMemberSummary(): Promise<SystemOverviewMetrics> {
    const members = await this.listMembers();
    return calculateSystemOverviewMetrics(members);
  },

  /**
   * Delete a member completely from local storage, Firestore database, and Google Sheets (Two-way Deletion)
   */
  async deleteMember(patientId: string, hn?: string): Promise<void> {
    const local = getLocalPatients();
    const target = local.find(p => p.id === patientId || (hn ? p.hn === hn : false));
    const targetHn = hn || target?.hn;
    const targetQrToken = target?.qrToken;

    // 1. Cascade delete from localStorage, purge cache, sessions, exercise records, and mark QR as revoked
    cascadeDeletePatientAndRevokeQR({ id: patientId, hn: targetHn, qrToken: targetQrToken });

    // 2. Remove from Firestore if configured
    if (isFirebaseConfigured && db) {
      try {
        // Delete doc in 'members' by ID
        const docRef = doc(db, 'members', patientId);
        await deleteDoc(docRef);

        // Delete doc in 'patients' by HN if present
        if (targetHn) {
          const patRef = doc(db, 'patients', targetHn);
          await deleteDoc(patRef);
        }

        // Secondary queries to delete any matching docs
        const q1 = query(collection(db, 'members'), where('id', '==', patientId));
        const snap1 = await getDocs(q1);
        snap1.forEach((d) => deleteDoc(d.ref).catch(() => {}));

        const q2 = query(collection(db, 'patients'), where('id', '==', patientId));
        const snap2 = await getDocs(q2);
        snap2.forEach((d) => deleteDoc(d.ref).catch(() => {}));

        if (targetHn) {
          const q3 = query(collection(db, 'patients'), where('hn', '==', targetHn));
          const snap3 = await getDocs(q3);
          snap3.forEach((d) => deleteDoc(d.ref).catch(() => {}));
        }
      } catch (err) {
        console.warn('[dataAdapter.deleteMember] Firestore delete error (stored locally):', err);
      }
    }

    // 3. Two-way Deletion: Sync delete command to Google Sheets immediately
    try {
      await syncDeletePatientToGoogleSheets(getWebhookUrl(), patientId, targetHn);
    } catch (e) {
      console.warn('[dataAdapter.deleteMember] Google Sheets delete sync error:', e);
    }
  },

  /**
   * Subscribe to real-time member updates
   */
  subscribeMembers(callback: (members: Patient[]) => void): Unsubscribe | null {
    if (isFirebaseConfigured && db) {
      try {
        const qPat = collection(db, 'patients');
        return onSnapshot(qPat, (snapshot) => {
          if (!snapshot.empty) {
            const members = filterValidPatients(snapshot.docs.map(doc => doc.data()));
            saveLocalPatients(members);
            callback(members);
          } else {
            // Fallback listen to members collection if patients is empty
            const qMem = collection(db, 'members');
            getDocs(qMem).then(memSnap => {
              if (!memSnap.empty) {
                const members = filterValidPatients(memSnap.docs.map(doc => doc.data()));
                saveLocalPatients(members);
                callback(members);
              } else {
                saveLocalPatients([]);
                callback([]);
              }
            }).catch(() => {
              saveLocalPatients([]);
              callback([]);
            });
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'patients');
        });
      } catch (err) {
        console.warn('[dataAdapter.subscribeMembers] onSnapshot failed:', err);
      }
    }
    return null;
  },

  /**
   * Appointments management (Central Sync with Google Sheets & Firestore)
   */
  async listAppointments(forceRemote: boolean = false): Promise<Appointment[]> {
    if (!forceRemote) {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_APPS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {
        // ignore
      }
    }

    // 1. Try Google Sheets first for live appointment updates
    try {
      const gsApps = await fetchAppointmentsFromGoogleSheets();
      if (gsApps && Array.isArray(gsApps) && gsApps.length > 0) {
        const normalized: Appointment[] = gsApps.map((a: any, idx: number) => {
          const rawStatus = (a.Status || a.status || '').toString().trim();
          let mappedStatus: any = 'pending';
          if (rawStatus.includes('Reschedule') || rawStatus.includes('ขอเลื่อน') || rawStatus === 'reschedule_requested') {
            mappedStatus = 'Reschedule Requested (ขอเลื่อน)';
          } else if (rawStatus.includes('Confirmed') || rawStatus.includes('ยืนยัน') || rawStatus === 'confirmed') {
            mappedStatus = 'Confirmed (ยืนยันแล้ว)';
          } else if (rawStatus === 'รอตรวจ' || rawStatus === 'นัดหมาย' || rawStatus === 'pending') {
            mappedStatus = 'pending';
          } else if (rawStatus === 'เสร็จสิ้น' || rawStatus === 'completed') {
            mappedStatus = 'completed';
          } else if (rawStatus === 'ยกเลิก' || rawStatus === 'cancelled') {
            mappedStatus = 'cancelled';
          } else if (rawStatus) {
            mappedStatus = rawStatus;
          }

          const rawHn = String(a.HN || a.hn || a.patientId || '').trim();
          const cleanHn = rawHn.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          const cleanDate = String(a.Date || a.date || '').replace(/\D/g, '');
          const cleanTime = String(a.Time || a.time || '').replace(/\D/g, '');
          const fallbackDeterministicId = `appt_${cleanHn || 'pat'}_${cleanDate || 'date'}_${cleanTime || idx}`;

          return {
            id: a.ID || a.id || a.appointmentId || fallbackDeterministicId,
            patientId: a.HN || a.hn || a.patientId || '',
            patientName: a.PatientName || a.patientName || a.name || 'ผู้รับการดูแล',
            hn: a.HN || a.hn || a.patientId || '',
            date: a.Date || a.date || new Date().toISOString().split('T')[0],
            time: a.Time || a.time || '10:00',
            type: a.Type || a.type || 'clinical',
            dentistName: a.Doctor || a.doctor || a.dentistName || 'ทันตแพทย์หญิง นภาพร วรรณษา',
            notes: a.Notes || a.notes || '',
            status: mappedStatus,
            googleCalendarEventId: a.googleCalendarEventId || a.googleCalendarEventID || a.eventId || undefined,
            googleCalendarHtmlLink: a.googleCalendarHtmlLink
          };
        });
        const deduplicated = deduplicateAppointments(normalized);
        localStorage.setItem(LOCAL_STORAGE_APPS_KEY, JSON.stringify(deduplicated));
        return deduplicated;
      }
    } catch (e) {
      console.warn('[dataAdapter.listAppointments] Google Sheets fetch warning:', e);
    }

    // 2. Try Firestore if configured
    if (isFirebaseConfigured && db) {
      try {
        const snapshot = await getDocs(collection(db, 'appointments'));
        if (!snapshot.empty) {
          const apps = snapshot.docs.map(d => d.data() as Appointment);
          localStorage.setItem(LOCAL_STORAGE_APPS_KEY, JSON.stringify(apps));
          return apps;
        }
      } catch (e) {
        console.warn('[dataAdapter.listAppointments] Firestore query warning:', e);
      }
    }

    // 3. Fallback to Local Storage
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_APPS_KEY);
      return raw ? JSON.parse(raw) : SEED_APPOINTMENTS;
    } catch {
      return SEED_APPOINTMENTS;
    }
  },

  async saveAppointments(appointments: Appointment[], singleUpdatedApp?: Appointment): Promise<void> {
    localStorage.setItem(LOCAL_STORAGE_APPS_KEY, JSON.stringify(appointments));

    // Save to Firestore
    if (isFirebaseConfigured && db) {
      try {
        if (singleUpdatedApp) {
          const docRef = doc(db, 'appointments', singleUpdatedApp.id);
          await setDoc(docRef, singleUpdatedApp, { merge: true });
        } else {
          for (const app of appointments) {
            const docRef = doc(db, 'appointments', app.id);
            await setDoc(docRef, app, { merge: true });
          }
        }
      } catch (e) {
        console.warn('[dataAdapter.saveAppointments] Firestore write warning:', e);
      }
    }

    // Sync to Google Sheets
    try {
      if (singleUpdatedApp) {
        syncAppointmentToGoogleSheets(getWebhookUrl(), singleUpdatedApp).catch(e => console.warn('[dataAdapter.saveAppointments] Google Sheets sync error:', e));
      } else if (appointments.length > 0) {
        // Sync the latest modified appointment or all
        const latest = appointments[appointments.length - 1];
        syncAppointmentToGoogleSheets(getWebhookUrl(), latest).catch(e => console.warn('[dataAdapter.saveAppointments] Google Sheets sync error:', e));
      }
    } catch (e) {
      console.warn('[dataAdapter.saveAppointments] Google Sheets sync dispatch error:', e);
    }
  },

  async deleteAppointment(id: string): Promise<void> {
    let targetAppt: Appointment | undefined;
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_APPS_KEY);
      const apps: Appointment[] = raw ? JSON.parse(raw) : [];
      targetAppt = apps.find(a => a.id === id);
      const filtered = apps.filter(a => a.id !== id);
      localStorage.setItem(LOCAL_STORAGE_APPS_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.warn('[dataAdapter.deleteAppointment] local storage error:', e);
    }

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'appointments', id);
        await deleteDoc(docRef);
      } catch (e) {
        console.warn('[dataAdapter.deleteAppointment] Firestore delete error:', e);
      }
    }

    // Two-way Deletion: Sync deletion to Google Sheets
    try {
      await syncDeleteAppointmentToGoogleSheets(
        getWebhookUrl(), 
        id, 
        targetAppt?.patientId, 
        (targetAppt as any)?.hn || targetAppt?.patientId, 
        targetAppt?.date
      );
    } catch (e) {
      console.warn('[dataAdapter.deleteAppointment] Google Sheets delete sync error:', e);
    }
  },

  subscribeAppointments(callback: (apps: Appointment[]) => void): Unsubscribe | null {
    if (isFirebaseConfigured && db) {
      try {
        const q = collection(db, 'appointments');
        return onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const apps = snapshot.docs.map(doc => doc.data() as Appointment);
            localStorage.setItem(LOCAL_STORAGE_APPS_KEY, JSON.stringify(apps));
            callback(apps);
          }
        }, (err) => {
          console.warn('[dataAdapter.subscribeAppointments] Snapshot error:', err);
        });
      } catch (err) {
        console.warn('[dataAdapter.subscribeAppointments] failed:', err);
      }
    }
    return null;
  },

  /**
   * Session Logs management (Central Sync with Google Sheets & Firestore)
   */
  async listSessionLogs(): Promise<SessionLog[]> {
    // 1. Try Google Sheets first
    try {
      const gsLogs = await fetchSessionLogsFromGoogleSheets();
      if (gsLogs && Array.isArray(gsLogs) && gsLogs.length > 0) {
        const mappedLogs: SessionLog[] = gsLogs.map((l: any, idx: number) => ({
          id: l.id || `log_gs_${idx}_${Date.now()}`,
          patientId: l.patientId || l.hn || '',
          date: l.date || (l.timestamp ? l.timestamp.split('T')[0] : new Date().toISOString().split('T')[0]),
          exerciseId: l.exerciseId || l.action || 'check_in',
          repsCompleted: Number(l.repsCompleted) || 1,
          score: Number(l.score) || 10,
          notes: l.details || l.notes || l.action || ''
        }));
        localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(mappedLogs));
        return mappedLogs;
      }
    } catch (e) {
      console.warn('[dataAdapter.listSessionLogs] Google Sheets fetch warning:', e);
    }

    // 2. Try Firestore if configured
    if (isFirebaseConfigured && db) {
      try {
        const snapshot = await getDocs(collection(db, 'logs'));
        if (!snapshot.empty) {
          const logs = snapshot.docs.map(d => d.data() as SessionLog);
          localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(logs));
          return logs;
        }
      } catch (e) {
        console.warn('[dataAdapter.listSessionLogs] Firestore query warning:', e);
      }
    }

    // 3. Fallback to Local Storage
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_LOGS_KEY);
      return raw ? JSON.parse(raw) : generateSeedLogs();
    } catch {
      return generateSeedLogs();
    }
  },

  async saveSessionLogs(logs: SessionLog[], newLog?: SessionLog): Promise<void> {
    localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(logs));
    if (isFirebaseConfigured && db) {
      try {
        if (newLog) {
          const docRef = doc(db, 'logs', newLog.id);
          await setDoc(docRef, newLog);
        } else {
          for (const logItem of logs) {
            const docRef = doc(db, 'logs', logItem.id);
            await setDoc(docRef, logItem);
          }
        }
      } catch (e) {
        console.warn('[dataAdapter.saveSessionLogs] Firestore write warning:', e);
      }
    }

    // Sync latest logs to Google Sheets
    try {
      const logToSync = newLog || (logs.length > 0 ? logs[logs.length - 1] : null);
      if (logToSync) {
        syncSessionLogToGoogleSheets(getWebhookUrl(), logToSync).catch(e => console.warn('[dataAdapter.saveSessionLogs] Google Sheets sync error:', e));
      }
    } catch (e) {
      console.warn('[dataAdapter.saveSessionLogs] Google Sheets sync dispatch error:', e);
    }
  },

  subscribeSessionLogs(callback: (logs: SessionLog[]) => void): Unsubscribe | null {
    if (isFirebaseConfigured && db) {
      try {
        const q = collection(db, 'logs');
        return onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const logs = snapshot.docs.map(doc => doc.data() as SessionLog);
            localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(logs));
            callback(logs);
          }
        }, (err) => {
          console.warn('[dataAdapter.subscribeSessionLogs] Snapshot error:', err);
        });
      } catch (err) {
        console.warn('[dataAdapter.subscribeSessionLogs] failed:', err);
      }
    }
    return null;
  },

  /**
   * Clinic Settings management (Central Sync & Persistence)
   */
  async getClinicSettings(): Promise<ClinicSettings> {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'settings', 'clinic');
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const remoteSettings = snapshot.data() as ClinicSettings;
          localStorage.setItem('growth_lab_settings', JSON.stringify(remoteSettings));
          return remoteSettings;
        }
      } catch (err) {
        console.warn('[dataAdapter.getClinicSettings] Firestore read warning (using local):', err);
      }
    }
    try {
      const raw = localStorage.getItem('growth_lab_settings');
      if (raw) {
        return JSON.parse(raw);
      }
    } catch { /* ignore */ }
    return DEFAULT_SETTINGS;
  },

  async saveClinicSettings(settings: ClinicSettings): Promise<void> {
    localStorage.setItem('growth_lab_settings', JSON.stringify(settings));
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'settings', 'clinic');
        await setDoc(docRef, {
          ...settings,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn('[dataAdapter.saveClinicSettings] Firestore write warning (saved locally):', err);
      }
    }

    try {
      saveClinicConfigToGoogleSheets(getWebhookUrl(), settings).catch(e => console.warn('[dataAdapter.saveClinicSettings] Google Sheets sync error:', e));
    } catch (e) {
      console.warn('[dataAdapter.saveClinicSettings] Google Sheets sync dispatch error:', e);
    }
  },

  subscribeClinicSettings(callback: (settings: ClinicSettings) => void): Unsubscribe | null {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'settings', 'clinic');
        return onSnapshot(docRef, (snapshot) => {
          if (snapshot.exists()) {
            const remoteSettings = snapshot.data() as ClinicSettings;
            localStorage.setItem('growth_lab_settings', JSON.stringify(remoteSettings));
            callback(remoteSettings);
          }
        }, (err) => {
          console.warn('[dataAdapter.subscribeClinicSettings] snapshot warning:', err);
        });
      } catch (err) {
        console.warn('[dataAdapter.subscribeClinicSettings] failed:', err);
      }
    }
    return null;
  },

  /**
   * Staff Accounts Management (Firestore + LocalStorage Sync)
   */
  async listStaffAccounts(): Promise<StaffAccount[]> {
    if (isFirebaseConfigured && db) {
      try {
        const querySnapshot = await getDocs(collection(db, 'staff'));
        if (!querySnapshot.empty) {
          const staffList = querySnapshot.docs.map(d => d.data() as StaffAccount);
          // Filter out legacy mock data if any
          const cleaned = staffList.filter(s => !s.name?.includes('สมศรี') && s.username !== 'assistant');
          localStorage.setItem('growth_lab_staff_accounts', JSON.stringify(cleaned));
          return cleaned;
        }
      } catch (err) {
        console.warn('[dataAdapter.listStaffAccounts] Firestore read warning:', err);
      }
    }
    try {
      const raw = localStorage.getItem('growth_lab_staff_accounts');
      if (raw) {
        const parsed: StaffAccount[] = JSON.parse(raw);
        return parsed.filter(s => !s.name?.includes('สมศรี') && s.username !== 'assistant');
      }
    } catch { /* ignore */ }
    return [];
  },

  async saveStaffAccount(staff: StaffAccount): Promise<void> {
    try {
      const raw = localStorage.getItem('growth_lab_staff_accounts');
      const currentList: StaffAccount[] = raw ? JSON.parse(raw) : [];
      const idx = currentList.findIndex(s => s.id === staff.id);
      if (idx >= 0) {
        currentList[idx] = staff;
      } else {
        currentList.push(staff);
      }
      localStorage.setItem('growth_lab_staff_accounts', JSON.stringify(currentList));
    } catch (e) {
      console.warn('[dataAdapter.saveStaffAccount] local write error:', e);
    }

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'staff', staff.id);
        await setDoc(docRef, staff);
      } catch (err) {
        console.warn('[dataAdapter.saveStaffAccount] Firestore write warning (saved locally):', err);
      }
    }
  },

  async deleteStaffAccount(id: string): Promise<void> {
    try {
      const raw = localStorage.getItem('growth_lab_staff_accounts');
      if (raw) {
        const currentList: StaffAccount[] = JSON.parse(raw);
        const filtered = currentList.filter(s => s.id !== id);
        localStorage.setItem('growth_lab_staff_accounts', JSON.stringify(filtered));
      }
    } catch (e) {
      console.warn('[dataAdapter.deleteStaffAccount] local delete error:', e);
    }

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'staff', id);
        await deleteDoc(docRef);
      } catch (err) {
        console.warn('[dataAdapter.deleteStaffAccount] Firestore delete warning:', err);
      }
    }
  },

  subscribeStaffAccounts(callback: (staff: StaffAccount[]) => void): Unsubscribe | null {
    if (isFirebaseConfigured && db) {
      try {
        const colRef = collection(db, 'staff');
        return onSnapshot(colRef, (snapshot) => {
          if (!snapshot.empty) {
            const staffList = snapshot.docs.map(d => d.data() as StaffAccount);
            const cleaned = staffList.filter(s => !s.name?.includes('สมศรี') && s.username !== 'assistant');
            localStorage.setItem('growth_lab_staff_accounts', JSON.stringify(cleaned));
            callback(cleaned);
          }
        }, (err) => {
          console.warn('[dataAdapter.subscribeStaffAccounts] snapshot warning:', err);
        });
      } catch (err) {
        console.warn('[dataAdapter.subscribeStaffAccounts] failed:', err);
      }
    }
    return null;
  }
};
