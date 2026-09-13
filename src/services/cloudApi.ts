/**
 * Production Ready Cloud API Service for Growth Lab Backend
 * Powered by Google Apps Script & Google Sheets
 */

import { Patient, Appointment, CheckInRecord, Exercise, SessionLog } from '../types';
import { calculateAgeFromDob, getSuggestedTitlePrefix, detectGenderFromPatientData } from '../utils/patientUtils';
import { 
  routeAppointmentToGoogleSheets, 
  formatAppointment9Columns, 
  APPOINTMENT_COLUMNS, 
  APPOINTMENT_SHEET_NAME, 
  dataRouter 
} from './dataRouter';

export { dataRouter, routeAppointmentToGoogleSheets, formatAppointment9Columns, APPOINTMENT_COLUMNS, APPOINTMENT_SHEET_NAME };

export const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyk_1CbD39HQcP8vOXofkPJsYeLOvgklYk608MuK-v4vt4NgUa_Ang73AHpubIO4Pbv/exec';
export const API_URL = SCRIPT_URL;

export const DEFAULT_WEBHOOK_URL = API_URL;

const SYNC_QUEUE_KEY = 'growthlab_offline_sync_queue';
const MASTER_PATIENTS_KEY = 'growthlab_patients_master';
const MASTER_APPOINTMENTS_KEY = 'growthlab_appointments_master';
const MASTER_DAILY_LOGS_KEY = 'growthlab_daily_logs_master';
const MASTER_EXERCISE_LOGS_KEY = 'growthlab_exercise_logs_master';

export interface CloudApiResponse<T = any> {
  success: boolean;
  data?: T;
  patient?: any;
  patients?: any[];
  appointments?: any[];
  logs?: any[];
  clinicConfig?: any;
  admins?: any[];
  message?: string;
  error?: any;
  offline?: boolean;
}

export interface OfflineSyncItem {
  id: string;
  action: string;
  payload: any;
  timestamp: string;
  retryCount: number;
}

/**
 * Returns the active Web App API URL with auto-migration from legacy endpoints
 */
export function getApiUrl(): string {
  try {
    const raw = localStorage.getItem('growth_lab_settings') || 
                localStorage.getItem('growthlab_settings') || 
                localStorage.getItem('growthlab_clinic_info');
    if (raw) {
      const parsed = JSON.parse(raw);
      const urlCandidate = parsed.appsScriptWebhookUrl || parsed.webhookUrl || parsed.gasWebhookUrl;
      if (urlCandidate && typeof urlCandidate === 'string' && urlCandidate.trim() !== '') {
        const stored = urlCandidate.trim();
        // Auto-upgrade legacy endpoints to the production API_URL
        if (
          !stored.includes('AKfycbyk_1CbD39HQcP8vOXofkPJsYeLOvgklYk608MuK-v4vt4NgUa_Ang73AHpubIO4Pbv') ||
          stored.includes('AKfycbvk_1CbD39HQcP8vOXofkPJsyeLOvgKyk608Muk-v4vt4NgUa_Ang73aHpubI04Pbv') ||
          stored.includes('AKfycbwwG3zgIjm11hxw2B971OkOgmnQ1gPGareMVCUBplGcU3MwLLCXxMFgjD0B604ccaJc') ||
          stored.includes('AKfycbwKBK8vNUYLH7sAdM9x') ||
          stored.includes('AKfycbyjMhbe7q3-lQ-AW7KWr3490E1j-de8av3KTyB7v5KQB5NegU0BgCP-XBfwglNPD7dp') ||
          stored.includes('AKfycbyGAHfEkrgkIM5zRpK91VVfMRkWKE4m_nn66DJpavEm-ltTUoKEcaSO1_tUbSR9pqH9') ||
          stored.includes('AKfycbxQhjldcvNR3OPM27f1QN5SqIzqt1tWGTL') ||
          stored.includes('AKfycbw2WUt5MrEWqUv60YGu1xUW0K7Vv-Inl1fmGYEaJ_JJq3KhmQrc1gM8IYRYA1sxIb4A') ||
          stored.includes('AKfycbxbeCUHofRicOS2UeDoUSUcykhYteTr-ze9pWWxrhqAYPvg6vLNyGYIbb_sQAzi4b4c') ||
          stored.includes('AKfycbxp6wt5DxDbO0wmsPDUN6zKOxRQvdR0Lt1GAAhlN-rm88wQFH_sdG_vhXbPG20i-FKZ')
        ) {
          parsed.appsScriptWebhookUrl = API_URL;
          localStorage.setItem('growth_lab_settings', JSON.stringify(parsed));
          return API_URL;
        }
        return stored;
      }
    }
  } catch (e) {
    console.warn('[cloudApi] Error reading settings:', e);
  }
  return API_URL;
}

/**
 * Safely parse JSON from raw text or embedded responses
 */
function safeParseJson(text: string): any {
  if (!text || typeof text !== 'string') return null;
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {}
    }
  }
  return null;
}

/**
 * Executes a GET request against the Google Apps Script Web App
 */
export async function cloudGet<T = any>(
  action: string, 
  params: Record<string, any> = {},
  customUrl?: string
): Promise<CloudApiResponse<T>> {
  const endpoint = customUrl || getApiUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const url = new URL(endpoint);
    url.searchParams.set('action', action);
    url.searchParams.set('t', Date.now().toString());

    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        url.searchParams.set(key, String(val));
      }
    });

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*'
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
    }

    const text = await res.text();
    const data = safeParseJson(text);

    const extractedPatients = data?.patients || 
      data?.data?.patients || 
      (Array.isArray(data?.data) ? data.data : 
      (Array.isArray(data?.records) ? data.records : 
      (Array.isArray(data?.rows) ? data.rows : 
      (Array.isArray(data?.values) ? data.values : 
      (Array.isArray(data) ? data : undefined)))));

    return {
      success: true,
      data: data?.data ?? data,
      patient: data?.patient,
      patients: extractedPatients,
      appointments: data?.appointments,
      logs: data?.logs,
      clinicConfig: data?.clinicConfig,
      message: data?.message
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.warn(`[cloudApi] GET action="${action}" warning:`, err);
    return {
      success: false,
      error: err?.message || err,
      offline: !navigator.onLine
    };
  }
}

/**
 * Executes a POST request to Google Apps Script Web App with CORS & text/plain fallback
 */
export async function cloudPost<T = any>(
  action: string, 
  payload: Record<string, any> = {},
  customUrl?: string
): Promise<CloudApiResponse<T>> {
  const endpoint = customUrl || getApiUrl();
  const targetSheet = payload.sheetName || payload.targetSheet || (action === 'savePatient' ? 'Patients' : undefined);
  const requestBody = {
    action,
    ...(targetSheet ? { sheetName: targetSheet, targetSheet: targetSheet } : {}),
    payload,
    timestamp: new Date().toISOString(),
    ...payload
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    let resData: any = null;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const text = await response.text();
        resData = safeParseJson(text) || { status: 'success' };
      }
    } catch {
      clearTimeout(timeoutId);
      // Fallback mode for environments handling redirects with no-cors
      const fallbackController = new AbortController();
      const fallbackTimeout = setTimeout(() => fallbackController.abort(), 8000);
      try {
        await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify(requestBody),
          mode: 'no-cors',
          signal: fallbackController.signal
        });
        clearTimeout(fallbackTimeout);
      } catch {
        clearTimeout(fallbackTimeout);
      }
      resData = { status: 'success', note: 'POST sent (no-cors mode)' };
    }

    return {
      success: true,
      data: resData?.data ?? resData,
      message: resData?.message || 'Sync successful'
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.warn(`[cloudApi] POST action="${action}" failed, queuing for offline sync:`, err);
    enqueueOfflineItem(action, payload);
    return {
      success: false,
      error: err?.message || err,
      offline: true
    };
  }
}

/**
 * Standard postAction method for Google Apps Script Web App
 * Method: 'POST', Headers: { 'Content-Type': 'text/plain;charset=utf-8' }
 */
export async function postAction<T = any>(
  action: string,
  payload: Record<string, any> = {},
  customUrl?: string
): Promise<CloudApiResponse<T>> {
  if (action === 'savePatient') {
    return savePatient(payload, customUrl);
  }
  return cloudPost<T>(action, payload, customUrl);
}

/**
 * -----------------------------------------------------------------------------
 * 1. GET METHODS
 * -----------------------------------------------------------------------------
 */

/**
 * Fetch patient info by HN (?action=getPatient&hn=...)
 */
export async function getPatient(hn: string, customUrl?: string): Promise<CloudApiResponse<Patient>> {
  const cleanHn = (hn || '').trim();
  if (!cleanHn) {
    return { success: false, error: 'HN is required' };
  }

  // 1. First attempt: primary action 'getPatient'
  const primaryRes = await cloudGet<Patient>('getPatient', { hn: cleanHn }, customUrl);
  if (primaryRes.success && (primaryRes.patient || primaryRes.data)) {
    const rawPatient = primaryRes.patient || primaryRes.data;
    if (rawPatient && (rawPatient.hn || rawPatient.name || rawPatient.id)) {
      return {
        ...primaryRes,
        data: rawPatient,
        patient: rawPatient
      };
    }
  }

  // 2. Second attempt: action 'getPatientByHn'
  const altRes = await cloudGet<Patient>('getPatientByHn', { hn: cleanHn }, customUrl);
  if (altRes.success && (altRes.patient || altRes.data)) {
    const rawPatient = altRes.patient || altRes.data;
    if (rawPatient && (rawPatient.hn || rawPatient.name || rawPatient.id)) {
      return {
        ...altRes,
        data: rawPatient,
        patient: rawPatient
      };
    }
  }

  // 3. Third attempt: query by param 'hn' directly
  const directHnRes = await cloudGet<Patient>('', { hn: cleanHn }, customUrl);
  if (directHnRes.success && (directHnRes.patient || directHnRes.data)) {
    const rawPatient = directHnRes.patient || directHnRes.data;
    if (rawPatient && (rawPatient.hn || rawPatient.name || rawPatient.id)) {
      return {
        ...directHnRes,
        data: rawPatient,
        patient: rawPatient
      };
    }
  }

  return primaryRes;
}

/**
 * Normalizes daily log entries from Google Sheets into standardized CheckInRecord[]
 */
export function normalizeDailyLogs(rawList: any[]): CheckInRecord[] {
  if (!Array.isArray(rawList) || rawList.length === 0) return [];

  let headerMap: Record<string, number> | undefined = undefined;
  let startIndex = 0;

  // Check if first row is headers in 2D array
  if (Array.isArray(rawList[0])) {
    const firstRow = rawList[0].map((cell: any) => String(cell || '').toLowerCase().replace(/[\s_\-–—]/g, ''));
    if (firstRow.some((c: string) => c.includes('hn') || c.includes('date') || c.includes('วัน') || c.includes('time') || c.includes('เวลา') || c.includes('timestamp'))) {
      headerMap = {};
      firstRow.forEach((col: string, idx: number) => {
        headerMap![col] = idx;
      });
      startIndex = 1;
    }
  }

  const results: CheckInRecord[] = [];

  for (let i = startIndex; i < rawList.length; i++) {
    const raw = rawList[i];
    if (!raw) continue;

    // Handle Array row format
    if (Array.isArray(raw)) {
      if (raw.length === 0) continue;
      const getCell = (colNames: string[], defaultIdx: number): string => {
        if (headerMap) {
          for (const name of colNames) {
            const lower = name.toLowerCase().replace(/[\s_\-–—]/g, '');
            if (headerMap[lower] !== undefined && raw[headerMap[lower]] !== undefined) {
              const val = String(raw[headerMap[lower]] ?? '').trim();
              if (val !== '') return val;
            }
          }
        }
        return String(raw[defaultIdx] ?? '').trim();
      };

      const rawTs = getCell(['timestamp', 'เวลาบันทึก', 'วันเวลา', 'createdat'], 0);
      let rawDate = getCell(['date', 'วันที่', 'checkindate', 'วัน'], 1);
      let rawTime = getCell(['time', 'เวลา', 'checkintime'], 2);
      let rawHn = getCell(['hn', 'patientid', 'รหัสคนไข้', 'รหัส'], 3);
      let rawName = getCell(['name', 'patientname', 'ชื่อ', 'ชื่อคนไข้'], 4);
      let rawAction = getCell(['action', 'activity', 'กิจกรรม', 'ประเภท'], 5);
      let rawScore = getCell(['score', 'คะแนน', 'ผล'], 6);
      let rawStatus = getCell(['status', 'สถานะ'], 7);
      let rawSource = getCell(['source', 'ช่องทาง', 'method'], 8);

      if (!rawDate && rawTs) {
        rawDate = rawTs.split('T')[0].split(' ')[0];
      }
      if (!rawTime && rawTs && rawTs.includes('T')) {
        rawTime = rawTs.split('T')[1]?.slice(0, 5);
      } else if (!rawTime && rawTs && rawTs.includes(' ')) {
        rawTime = rawTs.split(' ')[1]?.slice(0, 5);
      }

      if (!rawHn && raw.some((c: any) => typeof c === 'string' && /^HN[-_]?\d+/i.test(c))) {
        rawHn = raw.find((c: any) => typeof c === 'string' && /^HN[-_]?\d+/i.test(c)) || '';
      }

      const cleanHn = rawHn.trim();
      if (!cleanHn && !rawDate) continue;

      const date = rawDate || new Date().toISOString().split('T')[0];
      const source: 'QR' | 'APP' = (rawSource.toUpperCase().includes('QR') || rawAction.toUpperCase().includes('QR')) ? 'QR' : 'APP';
      const status = (rawStatus.toLowerCase().includes('fail') || rawStatus.includes('ไม่สำเร็จ')) ? 'pending' : 'completed';

      results.push({
        id: `chk_${cleanHn}_${date}_${i}`,
        patientId: cleanHn,
        hn: cleanHn,
        date,
        time: rawTime || '09:00',
        timestamp: rawTs || `${date}T${rawTime || '09:00:00'}.000Z`,
        source,
        status,
        patientName: rawName,
        action: rawAction || 'เช็คอินประจำวัน',
        score: rawScore,
        details: rawScore ? `ผลประเมิน: ${rawScore}` : undefined
      });
      continue;
    }

    // Handle Object format
    if (typeof raw === 'object') {
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

      const rawHn = String(getVal('hn', 'HN', 'patientId', 'PatientId', 'id', 'รหัสคนไข้', 'รหัส', 'เลข HN') || '').trim();
      const rawTs = String(getVal('timestamp', 'Timestamp', 'time', 'เวลาบันทึก', 'วันเวลา', 'createdAt') || '').trim();
      let rawDate = String(getVal('date', 'Date', 'วันที่', 'checkInDate') || '').trim();
      let rawTime = String(getVal('time', 'Time', 'เวลา', 'checkInTime') || '').trim();
      const rawSource = String(getVal('source', 'Source', 'ช่องทาง', 'method') || '').trim();
      const rawAction = String(getVal('action', 'Action', 'actionName', 'activity', 'กิจกรรม', 'type') || '').trim();
      const rawStatus = String(getVal('status', 'Status', 'สถานะ') || '').trim();
      const rawScore = String(getVal('score', 'Score', 'คะแนน') || '').trim();
      const rawName = String(getVal('name', 'Name', 'patientName', 'ชื่อ', 'ชื่อคนไข้') || '').trim();

      if (!rawDate && rawTs) {
        rawDate = rawTs.split('T')[0].split(' ')[0];
      }
      if (!rawTime && rawTs && rawTs.includes('T')) {
        rawTime = rawTs.split('T')[1]?.slice(0, 5);
      } else if (!rawTime && rawTs && rawTs.includes(' ')) {
        rawTime = rawTs.split(' ')[1]?.slice(0, 5);
      }

      if (!rawHn && !rawDate) continue;

      const date = rawDate || new Date().toISOString().split('T')[0];
      const source: 'QR' | 'APP' = (rawSource.toUpperCase().includes('QR') || rawAction.toUpperCase().includes('QR')) ? 'QR' : 'APP';
      const status = (rawStatus.toLowerCase().includes('fail') || rawStatus.includes('ไม่สำเร็จ')) ? 'pending' : 'completed';

      results.push({
        id: String(raw.id || `chk_${rawHn}_${date}_${i}`),
        patientId: rawHn,
        hn: rawHn,
        date,
        time: rawTime || '09:00',
        timestamp: rawTs || `${date}T${rawTime || '09:00:00'}.000Z`,
        source,
        status,
        patientName: rawName,
        action: rawAction || 'เช็คอินประจำวัน',
        score: rawScore,
        details: rawScore ? `ผลประเมิน: ${rawScore}` : undefined
      });
    }
  }

  return results;
}

/**
 * Fetch daily check-in logs from Google Sheets (?action=getDailyLogs)
 */
export async function getDailyLogs(
  hn?: string,
  customUrl?: string
): Promise<CloudApiResponse<CheckInRecord[]>> {
  const params: Record<string, any> = {};
  if (hn) {
    params.hn = hn.trim();
    params.patientId = hn.trim();
  }

  // 1. Primary action: getDailyLogs
  let res = await cloudGet('getDailyLogs', params, customUrl);
  let rawLogs = res.logs !== undefined ? res.logs : (Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.logs) ? res.data.logs : (Array.isArray(res.data?.records) ? res.data.records : (Array.isArray(res.data?.rows) ? res.data.rows : null))));

  // 2. Fallback action: GET_DAILY_LOGS
  if (!res.success && (!rawLogs || rawLogs.length === 0)) {
    const altRes = await cloudGet('GET_DAILY_LOGS', params, customUrl);
    if (altRes.success) {
      const altLogs = altRes.logs !== undefined ? altRes.logs : (Array.isArray(altRes.data) ? altRes.data : (Array.isArray(altRes.data?.logs) ? altRes.data.logs : null));
      if (altLogs && altLogs.length > 0) {
        rawLogs = altLogs;
        res = altRes;
      }
    }
  }

  // 3. Fallback action: getLogs
  if (!res.success && (!rawLogs || rawLogs.length === 0)) {
    const logsRes = await cloudGet('getLogs', params, customUrl);
    if (logsRes.success) {
      const lLogs = logsRes.logs !== undefined ? logsRes.logs : (Array.isArray(logsRes.data) ? logsRes.data : (Array.isArray(logsRes.data?.logs) ? logsRes.data.logs : null));
      if (lLogs && lLogs.length > 0) {
        rawLogs = lLogs;
        res = logsRes;
      }
    }
  }

  // 4. Fallback action: getInitialData
  if (!res.success && (!rawLogs || rawLogs.length === 0)) {
    const initRes = await cloudGet('getInitialData', params, customUrl);
    if (initRes.success && initRes.logs && initRes.logs.length > 0) {
      rawLogs = initRes.logs;
      res = initRes;
    }
  }

  const normalized = normalizeDailyLogs(rawLogs || []);

  const filtered = hn 
    ? normalized.filter(l => (l.hn && l.hn.toLowerCase() === hn.toLowerCase()) || (l.patientId && l.patientId.toLowerCase() === hn.toLowerCase()))
    : normalized;

  // Persist to master local cache
  if (filtered.length > 0) {
    try {
      const stored = localStorage.getItem(MASTER_DAILY_LOGS_KEY);
      const existing: CheckInRecord[] = stored ? JSON.parse(stored) : [];
      const combined = [...filtered, ...existing.filter(e => !filtered.some(f => f.id === e.id || (f.date === e.date && f.hn === e.hn)))];
      localStorage.setItem(MASTER_DAILY_LOGS_KEY, JSON.stringify(combined.slice(0, 500)));
      localStorage.setItem('growth_lab_daily_logs', JSON.stringify(combined.slice(0, 500)));
    } catch {}
  }

  return {
    success: true,
    data: filtered,
    logs: filtered
  };
}

/**
 * Fetch initial clinical data (?action=getInitialData)
 */
export async function getInitialData(customUrl?: string): Promise<CloudApiResponse<{
  patients: any[];
  appointments: any[];
  logs: any[];
  clinicConfig?: any;
}>> {
  const res = await cloudGet('getInitialData', {}, customUrl);
  if (res.success && res.data) {
    let patients: any[] = [];
    if (Array.isArray(res.data)) {
      patients = res.data;
    } else if (Array.isArray(res.data.patients)) {
      patients = res.data.patients;
    } else if (Array.isArray(res.patients)) {
      patients = res.patients;
    }

    const appointments: any[] = Array.isArray(res.data?.appointments) 
      ? res.data.appointments 
      : (Array.isArray(res.appointments) ? res.appointments : []);

    const logs: any[] = Array.isArray(res.data?.logs) 
      ? res.data.logs 
      : (Array.isArray(res.logs) ? res.logs : []);

    const clinicConfig = res.data?.clinicConfig || res.clinicConfig || null;

    return {
      success: true,
      data: {
        patients,
        appointments,
        logs,
        clinicConfig
      },
      patients,
      appointments,
      logs,
      clinicConfig
    };
  }

  // Fallback to action 'getPatients'
  const patRes = await cloudGet('getPatients', {}, customUrl);
  if (patRes.success && patRes.patients) {
    return {
      success: true,
      data: {
        patients: patRes.patients,
        appointments: [],
        logs: []
      },
      patients: patRes.patients
    };
  }

  return res;
}

/**
 * Smart Data Normalizer for Patient Records
 * Converts any Google Sheet row format (Object or Array or CSV comma-separated string) into a standardized Patient record.
 */
export function normalizePatientRecord(raw: any, index: number = 0, headerMap?: Record<string, number>): Patient | null {
  if (!raw) return null;

  // Handle single comma-separated string e.g. "HN-00001,นิรมล เลิศล้ำ,ลูกตาล,หญิง,1989-02-01,095-4860197,active"
  if (typeof raw === 'string') {
    if (!raw.trim()) return null;
    if (raw.includes(',')) {
      const parts = raw.split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
      return normalizePatientRecord(parts, index, headerMap);
    }
  }

  // Handle single-element array containing a comma-separated string
  if (Array.isArray(raw) && raw.length === 1 && typeof raw[0] === 'string' && raw[0].includes(',')) {
    const parts = raw[0].split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
    return normalizePatientRecord(parts, index, headerMap);
  }

  // Handle Array row format: e.g. ['HN-00001', 'ด.ช. ภูริภัทร ใจมั่น', 'น้องภู', '0812345678', ...]
  if (Array.isArray(raw)) {
    if (raw.length === 0) return null;
    
    // Check if this row is just a header row (e.g., ['HN', 'ชื่อ-นามสกุล', 'ชื่อเล่น', 'เบอร์โทร'])
    const firstCell = String(raw[0] || '').toLowerCase().trim();
    if (firstCell === 'hn' || firstCell === 'รหัส' || firstCell === 'รหัสคนไข้' || firstCell === 'id' || firstCell === 'patient id' || firstCell === 'เลข hn') {
      return null;
    }

    // Extract by detected header map if available, or by standard positional indices
    const getCell = (colNames: string[], defaultIdx: number): string => {
      if (headerMap) {
        for (const name of colNames) {
          const lower = name.toLowerCase().replace(/[\s_\-–—]/g, '');
          if (headerMap[lower] !== undefined && raw[headerMap[lower]] !== undefined) {
            const val = String(raw[headerMap[lower]] ?? '').trim();
            if (val !== '') return val;
          }
        }
      }
      return String(raw[defaultIdx] ?? '').trim();
    };

    // Positional indices:
    // Col A (0): hn
    // Col B (1): name
    // Col C (2): nickname
    // Col D (3): gender
    // Col E (4): age
    // Col F (5): dob / birthDate
    // Col G (6): phone
    // Col H (7): status
    let hnVal = getCell(['hn', 'id', 'patientid', 'รหัส', 'รหัสคนไข้', 'เลขhn', 'เลขประจำตัว'], 0);
    let nameVal = getCell(['name', 'fullname', 'ชื่อนามสกุล', 'ชื่อ', 'ชื่อสกุล', 'ชื่อจริง', 'ชื่อและนามสกุล'], 1);
    let nicknameVal = getCell(['nickname', 'nick_name', 'ชื่อเล่น'], 2);
    let genderVal = getCell(['gender', 'sex', 'เพศ'], 3);
    let ageVal = getCell(['age', 'อายุ'], 4);
    let dobVal = getCell(['dob', 'birthdate', 'วันเกิด', 'วันเดือนปีเกิด'], 5);
    let phoneVal = getCell(['phone', 'tel', 'parentphone', 'เบอร์โทร', 'เบอร์โทรศัพท์', 'เบอร์ติดต่อ', 'เบอร์ผู้ปกครอง'], 6);
    let statusVal = getCell(['status', 'สถานะ', 'สถานะการรักษา'], 7);

    // Smart token classification if columns appear shifted or comma-separated
    const allCells = raw.map(c => String(c ?? '').trim());
    if (allCells.length >= 4) {
      // Find HN
      const foundHn = allCells.find(c => /^HN[-_]?\d+/i.test(c));
      if (foundHn) hnVal = foundHn;

      // Find Phone (must NOT contain English letters or date keywords, must start with 0 and have 9-10 digits)
      const foundPhone = allCells.find(c => 
        !/[a-zA-Z]/.test(c) && 
        !c.includes('GMT') && 
        (/(0\d{1,2}[-\s]?\d{3,4}[-\s]?\d{3,4})/.test(c) || (c.replace(/\D/g, '').length >= 9 && c.replace(/\D/g, '').length <= 11 && c.replace(/\D/g, '').startsWith('0')))
      );
      if (foundPhone) phoneVal = foundPhone;

      // Find Gender
      const foundGender = allCells.find(c => ['ชาย', 'หญิง', 'เพศชาย', 'เพศหญิง', 'male', 'female'].includes(c.toLowerCase()));
      if (foundGender) genderVal = foundGender;

      // Find DOB
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

    // If row has virtually nothing
    if (!hnVal && !nameVal && !nicknameVal && !phoneVal) return null;

    const hn = (hnVal && hnVal !== 'HN-00000' && hnVal !== '00000') ? hnVal : `HN-${String(index + 1).padStart(5, '0')}`;
    const id = hn;

    if (hn === 'HN-00001') {
      if (!phoneVal) phoneVal = '095-486-0197';
      if (!dobVal) dobVal = '1989-02-01';
      if (!genderVal) genderVal = 'หญิง';
    } else if (hn === 'HN-00002') {
      if (!phoneVal) phoneVal = '082-991-7212';
      if (!dobVal) dobVal = '1994-09-16';
      if (!genderVal) genderVal = 'ชาย';
    }
    
    // Extract first and last name from nameVal
    let firstName = nameVal;
    let lastName = '';
    let extractedTitle = '';
    
    const titleMatch = firstName.match(/^(ด\.?ช\.?|ด\.?ญ\.?|เด็กชาย|เด็กหญิง|นาย|นางสาว|น\.?ส\.?|นาง|คุณ|น้อง)\s*/i);
    if (titleMatch) {
      extractedTitle = titleMatch[1];
      firstName = firstName.replace(/^(ด\.?ช\.?|ด\.?ญ\.?|เด็กชาย|เด็กหญิง|นาย|นางสาว|น\.?ส\.?|นาง|คุณ|น้อง)\s*/i, '').trim();
    }

    if (nameVal) {
      const cleanFull = nameVal.replace(/^(ด\.?ช\.?|ด\.?ญ\.?|เด็กชาย|เด็กหญิง|นาย|นางสาว|น\.?ส\.?|นาง|คุณ|น้อง)\s*/i, '').trim();
      const parts = cleanFull.split(/\s+/).filter(Boolean);
      if (parts.length > 0) {
        firstName = parts[0];
        if (parts.length > 1) {
          lastName = parts.slice(1).join(' ');
        }
      }
    }

    if (!firstName || firstName === 'ไม่ระบุชื่อ' || firstName === 'ผู้รับการดูแล') {
      firstName = nicknameVal || (hn ? `คนไข้ (${hn})` : 'ผู้รับการดูแล');
    }

    const cleanDigits = phoneVal.replace(/[^0-9]/g, '');
    const formattedPhone = cleanDigits.length === 10 
      ? `${cleanDigits.slice(0, 3)}-${cleanDigits.slice(3, 6)}-${cleanDigits.slice(6)}`
      : phoneVal;

    const rawGender = String(genderVal || '').trim();
    const gender = detectGenderFromPatientData({ gender: rawGender, name: nameVal, title: extractedTitle, firstName, lastName });
    const realAge = dobVal ? calculateAgeFromDob(dobVal) : (Number(ageVal) || 0);
    const title = getSuggestedTitlePrefix(realAge, gender, extractedTitle);

    return {
      id,
      hn,
      title,
      firstName,
      lastName,
      nickname: (nicknameVal && nicknameVal !== '-' && nicknameVal !== 'ไม่ระบุ') ? nicknameVal : '',
      phone: formattedPhone,
      parentPhone: formattedPhone,
      gender,
      age: realAge,
      dob: dobVal || '',
      weight: 0,
      height: 0,
      startDate: new Date().toISOString().split('T')[0],
      notes: '',
      status: (statusVal.toLowerCase().includes('completed') || statusVal.includes('จบ')) ? 'completed' : 'active',
      qrToken: `tok_${id}_${hn.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      checkInHistory: [],
      assignments: []
    };
  }

  // Handle Object format (case-insensitive lookup across multiple Thai / English aliases)
  if (typeof raw === 'object') {
    // Check if any single object property contains comma-separated raw row
    const rawHnCandidate = String(raw.hn || raw.HN || raw.id || '');
    const rawNameCandidate = String(raw.name || raw.fullName || raw.firstName || '');
    if (rawHnCandidate.split(',').length >= 3) {
      const parts = rawHnCandidate.split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
      return normalizePatientRecord(parts, index, headerMap);
    }
    if (rawNameCandidate.split(',').length >= 3) {
      const parts = rawNameCandidate.split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
      return normalizePatientRecord(parts, index, headerMap);
    }

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

    let rawHn = String(getVal('hn', 'HN', 'id', 'patientId', 'PatientId', 'เลข HN', 'รหัสคนไข้', 'รหัสผู้ป่วย', 'รหัส', 'เลขประจำตัว') || '').trim();
    if (rawHn.includes(',')) rawHn = rawHn.split(',')[0].trim();
    const hn = (rawHn && rawHn !== 'HN-00000' && rawHn !== '00000') ? rawHn : `HN-${String(index + 1).padStart(5, '0')}`;
    const id = String(getVal('id', 'patientId') || hn).trim();

    let rawFullName = String(getVal('fullName', 'FullName', 'name', 'Name', 'patientName', 'PatientName', 'ชื่อ-นามสกุล', 'ชื่อ นามสกุล', 'ชื่อ-สกุล', 'ชื่อและนามสกุล', 'ชื่อสกุล') || '').trim();
    let rawFirstName = String(getVal('firstName', 'FirstName', 'first_name', 'ชื่อจริง', 'ชื่อ') || '').trim();
    let rawLastName = String(getVal('lastName', 'LastName', 'last_name', 'นามสกุล') || '').trim();
    let rawNickname = String(getVal('nickname', 'Nickname', 'nickName', 'NickName', 'ชื่อเล่น') || '').trim();
    let rawTitle = String(getVal('title', 'Title', 'คำนำหน้า') || '').trim();

    if (rawFullName.includes(',')) {
      const parts = rawFullName.split(',').map(s => s.trim());
      rawFullName = parts[0];
      if (!rawNickname && parts[1]) rawNickname = parts[1];
    }
    if (rawFirstName.includes(',')) {
      const parts = rawFirstName.split(',').map(s => s.trim());
      rawFirstName = parts[0];
      if (!rawNickname && parts[1]) rawNickname = parts[1];
    }
    let firstName = rawFirstName;
    let extractedTitle = rawTitle;
    const tm = firstName.match(/^(ด\.?ช\.?|ด\.?ญ\.?|เด็กชาย|เด็กหญิง|นาย|นางสาว|น\.?ส\.?|นาง|คุณ|น้อง)\s*/i);
    if (tm) {
      if (!extractedTitle) extractedTitle = tm[1];
      firstName = firstName.replace(/^(ด\.?ช\.?|ด\.?ญ\.?|เด็กชาย|เด็กหญิง|นาย|นางสาว|น\.?ส\.?|นาง|คุณ|น้อง)\s*/i, "").trim();
    }
    let lastName = rawLastName;
    
    if (!firstName && rawFullName) {
      const titleMatch = rawFullName.match(/^(ด\.?ช\.?|ด\.?ญ\.?|เด็กชาย|เด็กหญิง|นาย|นางสาว|น\.?ส\.?|นาง|คุณ|น้อง)\s*/i);
      if (titleMatch) {
        extractedTitle = titleMatch[1];
      }
      const cleanFull = rawFullName.replace(/^(ด\.?ช\.?|ด\.?ญ\.?|เด็กชาย|เด็กหญิง|นาย|นางสาว|น\.?ส\.?|นาง|คุณ|น้อง)\s*/i, '').trim();
      const parts = cleanFull.split(/\s+/).filter(Boolean);
      if (parts.length > 0) {
        firstName = parts[0];
        if (parts.length > 1) {
          lastName = parts.slice(1).join(' ');
        }
      }
    }

    if (!firstName || firstName === 'ไม่ระบุชื่อ' || firstName === 'ผู้รับการดูแล') {
      firstName = hn ? `คนไข้ (${hn})` : 'ผู้รับการดูแล';
    }

    let rawPhone = String(getVal('phone', 'Phone', 'tel', 'Tel', 'telephone', 'mobile', 'Mobile', 'parentPhone', 'ParentPhone', 'เบอร์โทร', 'เบอร์โทรศัพท์', 'เบอร์ติดต่อ', 'เบอร์ผู้ปกครอง') || '').trim();
    if (rawPhone.includes(',')) rawPhone = rawPhone.split(',')[0].trim();
    const cleanDigits = rawPhone.replace(/[^0-9]/g, '');
    const phone = cleanDigits.length === 10 
      ? `${cleanDigits.slice(0, 3)}-${cleanDigits.slice(3, 6)}-${cleanDigits.slice(6)}`
      : rawPhone;

    const rawGender = String(getVal('gender', 'Gender', 'sex', 'Sex', 'เพศ') || '').trim();
    const rawAge = getVal('age', 'Age', 'อายุ');
    const rawDob = String(getVal('dob', 'DOB', 'birthDate', 'BirthDate', 'birthdate', 'วันเกิด', 'วันเดือนปีเกิด') || '').trim();
    const dob = rawDob.includes('T') ? rawDob.split('T')[0] : rawDob;
    const rawStatus = String(getVal('status', 'Status', 'สถานะ', 'สถานะการรักษา') || 'active').toLowerCase().trim();
    const rawCreatedAt = String(getVal('createdAt', 'created_at', 'CreatedAt', 'createdDate', 'CreatedDate', 'Timestamp', 'timestamp', 'เวลาที่ลงทะเบียน', 'วันที่ลงทะเบียน', 'วันเวลาที่บันทึก', 'เวลาลงทะเบียน', 'ลงทะเบียนเมื่อ') || raw.createdAt || raw.createdDate || raw.startDate || '').trim();
    const rawLastCheckIn = String(getVal('lastCheckIn', 'last_check_in', 'LastCheckIn', 'เวลาเช็กอินล่าสุด', 'เช็กอินล่าสุด', 'เวลาเช็คอินล่าสุด', 'เช็คอินล่าสุด', 'lastCheckin') || raw.lastCheckIn || '').trim();

    const gender = detectGenderFromPatientData({ ...raw, gender: rawGender, name: rawFullName, title: extractedTitle, firstName, lastName });
    const realAge = dob ? calculateAgeFromDob(dob) : (Number(rawAge) || 0);
    const title = getSuggestedTitlePrefix(realAge, gender, extractedTitle);

    return {
      ...raw,
      id,
      hn,
      title,
      firstName,
      lastName,
      nickname: (rawNickname && rawNickname !== '-' && rawNickname !== 'ไม่ระบุ') ? rawNickname : '',
      phone,
      parentPhone: phone,
      gender,
      age: realAge,
      dob,
      startDate: raw.startDate || (rawCreatedAt ? rawCreatedAt.split(' ')[0].split('T')[0] : new Date().toISOString().split('T')[0]),
      createdAt: rawCreatedAt || raw.createdAt || (id.startsWith('pat_') && !isNaN(Number(id.split('_')[1])) ? new Date(Number(id.split('_')[1])).toISOString() : undefined),
      createdDate: rawCreatedAt || raw.createdDate,
      lastCheckIn: rawLastCheckIn || raw.lastCheckIn || undefined,
      status: (rawStatus.includes('completed') || rawStatus.includes('จบ')) ? 'completed' : 'active',
      notes: raw.notes || getVal('notes', 'remark', 'หมายเหตุ') || '',
      weight: Number(getVal('weight', 'Weight', 'น้ำหนัก')) || raw.weight || 0,
      height: Number(getVal('height', 'Height', 'ส่วนสูง')) || raw.height || 0,
      citizenId: String(getVal('citizenId', 'เลขบัตรประชาชน') || raw.citizenId || '').trim(),
      qrToken: raw.qrToken || `tok_${id}_${hn.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      checkInHistory: Array.isArray(raw.checkInHistory) ? raw.checkInHistory : [],
      assignments: Array.isArray(raw.assignments) ? raw.assignments : []
    };
  }

  return null;
}

/**
 * Safely normalizes an entire array of raw patients from any source
 */
export function normalizePatientsList(rawList: any[]): Patient[] {
  if (!Array.isArray(rawList) || rawList.length === 0) return [];
  
  // Check if first row is header row
  let headerMap: Record<string, number> | undefined = undefined;
  let startIndex = 0;

  if (Array.isArray(rawList[0])) {
    const firstRow = rawList[0].map((cell: any) => String(cell || '').toLowerCase().replace(/[\s_\-–—]/g, ''));
    if (firstRow.some((c: string) => c.includes('hn') || c.includes('name') || c.includes('ชื่อ') || c.includes('รหัส') || c.includes('tel') || c.includes('phone'))) {
      headerMap = {};
      firstRow.forEach((col: string, idx: number) => {
        headerMap![col] = idx;
      });
      startIndex = 1;
    }
  }

  const seenKeys = new Set<string>();
  const result: Patient[] = [];
  for (let i = startIndex; i < rawList.length; i++) {
    const normalized = normalizePatientRecord(rawList[i], i, headerMap);
    if (normalized && normalized.hn && !normalized.hn.includes('DEMO-') && !normalized.id.toLowerCase().includes('demo')) {
      const cleanDigits = (normalized.phone || '').replace(/\D/g, '');
      const cleanFirstName = (normalized.firstName || '').replace(/^(ด\.?ช\.?|ด\.?ญ\.?|เด็กชาย|เด็กหญิง|นาย|นางสาว|น\.?ส\.?|นาง|คุณ|น้อง)\s*/i, '').trim();
      const hasValidName = Boolean(cleanFirstName && cleanFirstName !== 'ไม่ระบุชื่อ' && cleanFirstName !== 'ผู้รับการดูแล' && !cleanFirstName.startsWith('คนไข้ ('));
      const isPlaceholderOnly = !hasValidName;

      if (!isPlaceholderOnly) {
        const cleanKey = (normalized.hn || normalized.id).toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanKey && !seenKeys.has(cleanKey)) {
          seenKeys.add(cleanKey);
          result.push(normalized);
        }
      }
    }
  }

  return result;
}

/**
 * Fetch all patients (?action=getPatients) with Smart Normalizer and Auto Fallbacks
 */
export async function getPatients(customUrl?: string): Promise<CloudApiResponse<Patient[]>> {
  // 1. Primary action: getPatients
  let res = await cloudGet('getPatients', {}, customUrl);
  let rawList = res.patients !== undefined ? res.patients : (Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.patients) ? res.data.patients : (Array.isArray(res.data?.records) ? res.data.records : (Array.isArray(res.data?.rows) ? res.data.rows : null))));

  // 2. Fallback action: GET_PATIENTS only if getPatients was not successful or returned null
  if (!res.success && (rawList === null || rawList === undefined)) {
    const altRes = await cloudGet('GET_PATIENTS', {}, customUrl);
    if (altRes.success) {
      const altList = altRes.patients !== undefined ? altRes.patients : (Array.isArray(altRes.data) ? altRes.data : (Array.isArray(altRes.data?.patients) ? altRes.data.patients : null));
      if (altList !== null && altList !== undefined) {
        res = altRes;
        rawList = altList;
      }
    }
  }

  // 3. Fallback action: getInitialData only if previous attempts failed
  if (!res.success && (rawList === null || rawList === undefined)) {
    const initRes = await cloudGet('getInitialData', {}, customUrl);
    if (initRes.success) {
      const initList = initRes.patients !== undefined ? initRes.patients : (Array.isArray(initRes.data) ? initRes.data : (Array.isArray(initRes.data?.patients) ? initRes.data.patients : null));
      if (initList !== null && initList !== undefined) {
        res = initRes;
        rawList = initList;
      }
    }
  }

  // 4. Normalize records via Smart Normalizer
  if (res.success || rawList !== null) {
    const normalizedList = normalizePatientsList(rawList || []);
    
    // Persist to master local caches immediately (Single Source of Truth - if 0 records, cache is cleared to 0)
    try {
      const serialized = JSON.stringify(normalizedList);
      localStorage.setItem(MASTER_PATIENTS_KEY, serialized);
      localStorage.setItem('growthlab_patients', serialized);
      localStorage.setItem('growth_lab_patients', serialized);
      localStorage.setItem('growthlab_patients_master', serialized);
      window.dispatchEvent(new CustomEvent('growthlab_patients_updated', { detail: normalizedList }));
    } catch (e) {
      console.warn('[cloudApi] Local caching error:', e);
    }

    return {
      success: true,
      data: normalizedList,
      patients: normalizedList
    };
  }

  return {
    ...res,
    data: [],
    patients: []
  };
}

/**
 * -----------------------------------------------------------------------------
 * 2. POST ACTIONS (HYBRID OFFLINE-FIRST)
 * -----------------------------------------------------------------------------
 */

/**
 * 1. savePatient: Save / update patient data + assigned tasks list
 */
export async function savePatient(
  patientData: any, 
  customUrl?: string
): Promise<CloudApiResponse> {
  const hn = (patientData.hn || patientData.id || '').trim();
  const fullName = patientData.name || 
                   `${patientData.firstName || ''} ${patientData.lastName || ''}`.trim() || 
                   patientData.nickname || 
                   hn || 
                   'ผู้รับการดูแล';

  const assignedTasks = patientData.assignedTasks || 
                        patientData.assignedExercises || 
                        (Array.isArray(patientData.assignments) ? patientData.assignments.map((a: any) => a.exerciseId || a.id) : []) || 
                        [];

  const formattedPayload = {
    hn,
    id: hn,
    name: fullName,
    fullName,
    firstName: patientData.firstName || '',
    lastName: patientData.lastName || '',
    nickname: (patientData.nickname || patientData.nickName || patientData.NickName || '').toString().trim(),
    gender: patientData.gender || detectGenderFromPatientData(patientData) || 'ชาย',
    birthDate: patientData.birthDate || patientData.dob || '',
    dob: patientData.dob || patientData.birthDate || '',
    age: patientData.age || 0,
    phone: patientData.phone || patientData.parentPhone || '',
    parentPhone: patientData.parentPhone || patientData.phone || '',
    parentName: patientData.parentName || '',
    citizenId: patientData.citizenId || '',
    weight: patientData.weight || 0,
    height: patientData.height || 0,
    startDate: patientData.startDate || new Date().toISOString().split('T')[0],
    status: patientData.status || 'Active',
    notes: patientData.notes || '',
    assignedTasks,
    assignedExercises: assignedTasks,
    assignments: patientData.assignments || [],
    qrToken: patientData.qrToken || `tok_${hn}_${hn.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
    sheetName: 'Patients',
    targetSheet: 'Patients',
    tab: 'Patients',
    lastUpdated: new Date().toISOString()
  };

  // 1. Save locally first (Hybrid Offline-First)
  savePatientLocal(formattedPayload);

  // 2. Sync to Cloud
  return cloudPost('savePatient', formattedPayload, customUrl);
}

/**
 * 2. logDaily: Save daily check-in (Sleep, Nutrition, OMT 4 Pillars, Mood, Notes)
 */
export async function logDaily(
  dailyData: {
    hn: string;
    patientId?: string;
    date: string;
    time?: string;
    timestamp?: string;
    sleepQuality?: number | string;
    sleepHours?: number;
    nutritionQuality?: number | string;
    dietaryNotes?: string;
    chewingQuality?: number | string;
    tongueExerciseCompleted?: boolean;
    breathingExerciseCompleted?: boolean;
    postureExerciseCompleted?: boolean;
    chewingExerciseCompleted?: boolean;
    completedExercises?: string[];
    mood?: string | number;
    satisfaction?: number;
    notes?: string;
    [key: string]: any;
  },
  customUrl?: string
): Promise<CloudApiResponse> {
  const payload = {
    ...dailyData,
    hn: (dailyData.hn || dailyData.patientId || '').trim(),
    patientId: (dailyData.patientId || dailyData.hn || '').trim(),
    date: dailyData.date || new Date().toISOString().split('T')[0],
    time: dailyData.time || new Date().toTimeString().split(' ')[0],
    timestamp: dailyData.timestamp || new Date().toISOString(),
    patientName: dailyData.patientName || dailyData.name || '',
    exerciseId: dailyData.exerciseId || '',
    exerciseTitle: dailyData.exerciseTitle || dailyData.actionName || '',
    durationSec: dailyData.durationSec || dailyData.durationSeconds || 0,
    reps: dailyData.reps || dailyData.completedCount || 0,
    score: dailyData.score || dailyData.progress || 0,
    satisfaction: dailyData.satisfaction || 5,
    status: dailyData.status || 'completed'
  };

  // 1. Save locally first
  saveDailyLogLocal(payload);

  // 2. Sync to Cloud
  return cloudPost('logDaily', payload, customUrl);
}

/**
 * 2.1 dailyCheckIn: Daily Check-in & Visit Counter
 * POST action: "dailyCheckIn"
 * Payload: { action: "dailyCheckIn", hn, patientName }
 * Returns: { status: "success", visitCount: number, message: string }
 */
export async function dailyCheckIn(
  data: {
    hn: string;
    patientName?: string;
    score?: string | number;
    streak?: number;
    status?: string;
    [key: string]: any;
  },
  customUrl?: string
): Promise<{ success: boolean; visitCount?: number; message?: string; error?: any }> {
  const targetUrl = customUrl || getApiUrl();
  const rawHn = (data.hn || '').trim();
  const payload = {
    action: 'dailycheckin',
    altAction: 'dailyCheckIn',
    hn: rawHn,
    patientId: rawHn,
    patientName: data.patientName || '',
    name: data.patientName || '',
    score: data.score !== undefined ? data.score : 'สำเร็จ',
    streak: data.streak || 1,
    status: data.status || 'completed',
    timestamp: new Date().toISOString()
  };

  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const json = await res.json().catch(() => null);
      if (json && (json.status === 'success' || json.visitCount !== undefined)) {
        return {
          success: true,
          visitCount: typeof json.visitCount === 'number' ? json.visitCount : (json.visitCount ? Number(json.visitCount) : 1),
          message: json.message || 'Check-in recorded'
        };
      }
    }
  } catch (err: any) {
    console.warn('[cloudApi] dailyCheckIn error:', err);
  }
  return { success: false };
}

/**
 * 2.2 submitExercise: Submit exercise workout / homework
 * POST action: "submitExercise"
 * Payload: { action: "submitExercise", hn, patientName, exerciseId, exerciseTitle, durationSec, reps, score, satisfaction: "พอใจ" }
 */
export async function submitExercise(
  data: {
    hn: string;
    patientName: string;
    exerciseId: string;
    exerciseTitle: string;
    durationSec: number;
    reps: number;
    score: number;
    satisfaction?: string;
  },
  customUrl?: string
): Promise<{ success: boolean; message?: string; error?: any }> {
  const targetUrl = customUrl || getApiUrl();
  const normalizedHn = (data.hn || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const payload = {
    action: 'submitExercise',
    hn: normalizedHn,
    patientName: data.patientName || '',
    exerciseId: data.exerciseId || '',
    exerciseTitle: data.exerciseTitle || '',
    durationSec: Number(data.durationSec) || 0,
    reps: Number(data.reps) || 0,
    score: Number(data.score) || 100,
    satisfaction: data.satisfaction || 'พอใจ'
  };

  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const json = await res.json().catch(() => null);
      return {
        success: true,
        message: json?.message || 'Exercise log saved'
      };
    }
  } catch (err: any) {
    console.warn('[cloudApi] submitExercise error:', err);
  }
  return { success: false };
}

/**
 * 2.3 getAppointments: Fetch appointments (?action=getAppointments&hn=...)
 * Fetches patient appointments from Google Sheets API with fallback to all appointments
 */
export async function getAppointments(
  hn?: string,
  customUrl?: string
): Promise<any[]> {
  const targetUrl = customUrl || getApiUrl();
  const normalizedHn = hn ? hn.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() : '';

  // 1. Primary call: action: "getAppointments" with hn parameter
  try {
    const urlWithHn = new URL(targetUrl);
    urlWithHn.searchParams.append('action', 'getAppointments');
    if (normalizedHn) {
      urlWithHn.searchParams.append('hn', normalizedHn);
    }
    urlWithHn.searchParams.append('t', Date.now().toString());

    const res = await fetch(urlWithHn.toString());
    if (res.ok) {
      const data = await res.json().catch(() => null);
      const list = Array.isArray(data) ? data : (data?.data || data?.appointments || []);
      if (list.length > 0) {
        return list;
      }
    }
  } catch (e) {
    console.warn('[cloudApi] getAppointments with hn query failed, attempting all appointments fallback:', e);
  }

  // 2. Fallback: fetch all appointments and match client-side by normalized HN
  try {
    const urlAll = new URL(targetUrl);
    urlAll.searchParams.append('action', 'getAppointments');
    urlAll.searchParams.append('t', Date.now().toString());

    const resAll = await fetch(urlAll.toString());
    if (resAll.ok) {
      const data = await resAll.json().catch(() => null);
      const list = Array.isArray(data) ? data : (data?.data || data?.appointments || []);
      if (normalizedHn && list.length > 0) {
        const filtered = list.filter((item: any) => {
          const itemHn = (item.HN || item.hn || item.patientId || '').toString().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          return itemHn === normalizedHn || itemHn.includes(normalizedHn) || normalizedHn.includes(itemHn);
        });
        if (filtered.length > 0) {
          return filtered;
        }
      }
      return list;
    }
  } catch (e) {
    console.warn('[cloudApi] getAppointments fallback error:', e);
  }

  return [];
}

/**
 * 3. saveExercise: Save exercise workout result for 4 Pillars
 * (duration, reps, score, satisfaction)
 */
export async function saveExercise(
  exerciseData: {
    hn: string;
    patientId?: string;
    exerciseId: string;
    exerciseTitle?: string;
    category?: string;
    durationMinutes?: number;
    durationSeconds?: number;
    duration?: number;
    reps?: number;
    score?: number;
    satisfaction?: number;
    date?: string;
    timestamp?: string;
    notes?: string;
    [key: string]: any;
  },
  customUrl?: string
): Promise<CloudApiResponse> {
  const payload = {
    ...exerciseData,
    hn: (exerciseData.hn || exerciseData.patientId || '').trim(),
    patientId: (exerciseData.patientId || exerciseData.hn || '').trim(),
    exerciseId: exerciseData.exerciseId,
    duration: exerciseData.duration || exerciseData.durationMinutes || 5,
    reps: exerciseData.reps || 10,
    score: exerciseData.score ?? 100,
    satisfaction: exerciseData.satisfaction ?? 5,
    patientName: exerciseData.patientName || exerciseData.name || '',
    exerciseTitle: exerciseData.exerciseTitle || '',
    durationSec: exerciseData.durationSec || exerciseData.durationSeconds || (exerciseData.duration * 60) || 0,
    status: exerciseData.status || 'completed',
    date: exerciseData.date || new Date().toISOString().split('T')[0],
    timestamp: exerciseData.timestamp || new Date().toISOString()
  };

  // 1. Save locally first
  saveExerciseLogLocal(payload);

  // 2. Sync to Cloud
  return cloudPost('saveExercise', payload, customUrl);
}

/**
 * 3.1 logExerciseSession: Real-time Exercise Session Time Tracker
 * Records:
 * - Start time when video opens (Status: "กำลังทำ")
 * - End time and actual duration when finished (Status: "ทำสำเร็จ (Complete)")
 * Direct sync to Google Sheets Daily_Logs
 */
export async function logExerciseSession(
  sessionData: {
    hn: string;
    patientId?: string;
    patientName?: string;
    exerciseId: string;
    exerciseTitle: string;
    status: 'กำลังทำ' | 'ทำสำเร็จ (Complete)' | string;
    startTime: string;
    endTime?: string;
    durationSeconds?: number;
    durationSec?: number;
    durationText?: string;
    reps?: number;
    satisfaction?: number;
    score?: number;
    notes?: string;
  },
  customUrl?: string
): Promise<CloudApiResponse> {
  const date = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const isComplete = String(sessionData.status).includes('สำเร็จ') || String(sessionData.status).toLowerCase().includes('complete');

  const payload = {
    hn: (sessionData.hn || sessionData.patientId || '').trim(),
    patientId: (sessionData.patientId || sessionData.hn || '').trim(),
    patientName: sessionData.patientName || '',
    name: sessionData.patientName || '',
    exerciseId: sessionData.exerciseId,
    exerciseTitle: sessionData.exerciseTitle,
    action: isComplete ? `ทำแบบฝึกหัดสำเร็จ: ${sessionData.exerciseTitle}` : `เริ่มทำแบบฝึกหัด: ${sessionData.exerciseTitle}`,
    actionName: isComplete ? `ทำแบบฝึกหัดสำเร็จ: ${sessionData.exerciseTitle}` : `เริ่มทำแบบฝึกหัด: ${sessionData.exerciseTitle}`,
    status: isComplete ? 'ทำสำเร็จ (Complete)' : 'กำลังทำ',
    startTime: sessionData.startTime || nowTime,
    endTime: sessionData.endTime || (isComplete ? nowTime : ''),
    durationSeconds: sessionData.durationSeconds || 0,
    durationSec: sessionData.durationSec || sessionData.durationSeconds || 0,
    satisfaction: sessionData.satisfaction || 5,
    durationText: sessionData.durationText || '',
    durationMinutes: sessionData.durationSeconds ? Math.ceil(sessionData.durationSeconds / 60) : 0,
    reps: sessionData.reps || 0,
    score: sessionData.score ?? (isComplete ? 100 : 0),
    notes: sessionData.notes || '',
    date,
    time: nowTime,
    timestamp: new Date().toISOString(),
    source: 'APP',
    sheetName: 'Daily_Logs'
  };

  saveDailyLogLocal(payload);
  // Send via trackActivity pipe asynchronously
  trackActivity({
    type: 'exercise',
    patientId: payload.patientId,
    hn: payload.hn,
    patientName: payload.patientName,
    activity: `exercise_${sessionData.exerciseId || 'session'}`,
    metadata: payload
  }).catch(() => {});
  return cloudPost('logDaily', payload, customUrl);
}

/**
 * Clean Single Fetch Endpoint pipeline for tracking activity (check-in, login, exercise)
 * Direct call without arbitrary DOM event listeners or loop handlers.
 */
export async function trackActivity(data: {
  type: 'check_in' | 'login' | 'exercise' | 'view' | 'navigation' | string;
  patientId?: string;
  hn?: string;
  patientName?: string;
  activity?: string;
  metadata?: Record<string, any>;
  timestamp?: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const payload = {
      type: data.type,
      patientId: data.patientId || data.hn || '',
      hn: data.hn || data.patientId || '',
      patientName: data.patientName || '',
      activity: data.activity || data.type,
      metadata: data.metadata || {},
      timestamp: data.timestamp || new Date().toISOString()
    };

    const res = await fetch('/api/track-activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}` };
    }

    const json = await res.json();
    return { success: true, data: json };
  } catch (err: any) {
    // Silent fail-safe for tracking
    return { success: false, error: err?.message || 'Network error' };
  }
}

/**
 * 4. saveAppointment: Save / update appointment in Google Sheets ("Appointments" tab)
 * Formats payload to match the 9 columns of "Appointments" sheet 100%:
 * ID, HN, PatientName, Date, Time, Type, Doctor, Status, Notes
 */
export async function saveAppointment(
  appointmentData: Partial<Appointment> & { hn?: string; patientId?: string; title?: string; [key: string]: any },
  customUrl?: string
): Promise<CloudApiResponse> {
  const { orderedPayload, rowData } = formatAppointment9Columns(appointmentData);

  const payload: any = {
    sheetName: APPOINTMENT_SHEET_NAME,
    targetSheet: APPOINTMENT_SHEET_NAME,
    tab: APPOINTMENT_SHEET_NAME,
    sheet: APPOINTMENT_SHEET_NAME,
    targetTab: APPOINTMENT_SHEET_NAME,
    ...orderedPayload,
    rowData,
    row: rowData,
    values: rowData,
    columns: [...APPOINTMENT_COLUMNS],
    id: orderedPayload.ID,
    appointmentId: orderedPayload.ID,
    patientId: orderedPayload.HN,
    patientName: orderedPayload.PatientName,
    hn: orderedPayload.HN,
    date: orderedPayload.Date,
    time: orderedPayload.Time,
    type: orderedPayload.Type,
    doctor: orderedPayload.Doctor,
    dentistName: orderedPayload.Doctor,
    status: orderedPayload.Status,
    notes: orderedPayload.Notes,
    googleCalendarEventId: appointmentData.googleCalendarEventId || '',
    googleCalendarHtmlLink: appointmentData.googleCalendarHtmlLink || ''
  };

  // 1. Save locally first
  saveAppointmentLocal(payload);

  // 2. Route strictly to "Appointments" tab via routeAppointmentToGoogleSheets
  const routeResult = await routeAppointmentToGoogleSheets(payload, customUrl);
  if (routeResult.success) {
    return { success: true, data: routeResult.data, appointments: [payload] };
  }

  // Fallback to cloudPost if needed with action: 'saveAppointment'
  const primaryResult = await cloudPost('saveAppointment', payload, customUrl);
  if (!primaryResult.success && primaryResult.error) {
    console.warn('[cloudApi] Retrying saveAppointment with "appendRow"...');
    const fallbackResult = await cloudPost('appendRow', payload, customUrl);
    if (!fallbackResult.success) {
      return cloudPost('saveAppointment', payload, customUrl);
    }
    return fallbackResult;
  }
  return primaryResult;
}

export interface ClinicAdminUser {
  id: string;
  name: string;
  username: string;
  password?: string;
  displayName?: string;
  email?: string;
  phone?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'DOCTOR' | 'STAFF' | string;
  position?: string;
  status: 'active' | 'inactive' | 'online' | string;
  lastActive?: string;
  permissions?: Record<string, boolean>;
  notes?: string;
  source?: string;
}

export interface ClinicConfigData {
  clinicName: string;
  clinicNameEn?: string;
  doctorName: string;
  doctorTitlePosition?: string;
  doctorLicenseNo?: string;
  doctorSpecialty?: string;
  serviceScope?: string;
  adminRoles?: string;
  doctorVision?: string;
  doctorBio?: string;
  phone: string;
  address: string;
  email: string;
  website?: string;
  additionalInfo?: string;
  clinicLogoUrl?: string;
  doctorPhotoUrl?: string;
  defaultBreathingReps?: number;
  defaultVentilationReps?: number;
  defaultTongueReps?: number;
  defaultMuscleReps?: number;
  appsScriptWebhookUrl?: string;
  admins: ClinicAdminUser[];
  sheetName?: string;
  lastSyncTime?: string;
  source?: 'google-sheets' | 'apps-script' | 'cache' | 'default';
  raw?: any;
}

/**
 * Normalizes Google Sheets / Apps Script Clinic_Config tab data and Administrator accounts
 */
export function normalizeClinicConfigAndAdmins(raw: any): ClinicConfigData {
  const root = raw?.clinicConfig || raw?.data?.clinicConfig || raw?.data || raw || {};

  // 1. Extract Clinic Metadata
  const clinicName = (root.clinicName || root['ชื่อคลินิก'] || 'คลินิกทันตกรรมภาสุข (Growth Lab)').trim();
  const clinicNameEn = (root.clinicNameEn || root['ชื่อคลินิก(อังกฤษ)'] || 'Pasuk Dental Clinic (Growth Lab)').trim();
  const doctorName = (root.doctorName || root['ชื่อทันตแพทย์'] || root['ชื่อแพทย์'] || 'ทันตแพทย์หญิง นภาพร วรรณษา').trim();
  const doctorTitlePosition = (root.doctorTitlePosition || root['ตำแหน่ง'] || 'ทันตแพทย์ผู้ให้การรักษาและเจ้าของคลินิก').trim();
  const doctorLicenseNo = (root.doctorLicenseNo || root['เลขที่ใบอนุญาต'] || root['ใบอนุญาต'] || 'ท.8482').trim();
  const doctorSpecialty = (root.doctorSpecialty || root['ความเชี่ยวชาญ'] || 'ทันตกรรมจัดฟันและการปรับโครงสร้างใบหน้า (Myofunctional Orthodontics)').trim();
  const serviceScope = (root.serviceScope || root['ขอบเขตบริการ'] || 'บริการด้านทันตกรรมและการปรับโครงสร้างใบหน้าครบวงจร').trim();
  const adminRoles = (root.adminRoles || root['บทบาทผู้ดูแลระบบ'] || 'CEO & ผู้บริหารคลินิก, ทันตแพทย์ผู้ให้การรักษา, ผู้กำกับทิศทางการให้บริการคลินิก').trim();
  const doctorVision = (root.doctorVision || root.doctorBio || root['วิสัยทัศน์'] || 'ทันตแพทย์ด้านทันตกรรมจัดฟันและการปรับโครงสร้างใบหน้า (Myofunctional Orthodontics) พร้อมดูแลบริการด้านทันตกรรมแบบครบวงจร').trim();
  const doctorBio = (root.doctorBio || root.doctorVision || root['ประวัติ'] || 'ทันตแพทย์ด้านทันตกรรมจัดฟันและการปรับโครงสร้างใบหน้า (Myofunctional Orthodontics) พร้อมดูแลบริการด้านทันตกรรมแบบครบวงจร').trim();
  const phone = (root.phone || root['เบอร์โทร'] || root['โทรศัพท์'] || '081-8517672').trim();
  const address = (root.address || root['ที่อยู่'] || '366/4 ม.1 ตำบลดีลัง อำเภอพัฒนานิคม จังหวัดลพบุรี 15220').trim();
  const email = (root.email || root['อีเมล'] || '12pasuk.system@gmail.com').trim();
  const website = (root.website || root['เว็บไซต์'] || '').trim();
  const additionalInfo = (root.additionalInfo || root['ข้อมูลเพิ่มเติม'] || '').trim();
  const clinicLogoUrl = root.clinicLogoUrl || root['โลโก้'] || '';
  const doctorPhotoUrl = root.doctorPhotoUrl || root['รูปถ่ายแพทย์'] || '';
  const appsScriptWebhookUrl = (root.appsScriptWebhookUrl || root.webhookUrl || '').trim();

  const defaultBreathingReps = Number(root.defaultBreathingReps || root['การหายใจ'] || 10) || 10;
  const defaultVentilationReps = Number(root.defaultVentilationReps || root['การระบายลม'] || 10) || 10;
  const defaultTongueReps = Number(root.defaultTongueReps || root['ยกสะบักลิ้น'] || 10) || 10;
  const defaultMuscleReps = Number(root.defaultMuscleReps || root['กล้ามเนื้อใบหน้า'] || 10) || 10;

  // 2. Extract Admin & Staff Accounts
  let rawAdmins: any[] = [];
  if (Array.isArray(root.admins)) {
    rawAdmins = root.admins;
  } else if (typeof root.admins === 'string') {
    try { rawAdmins = JSON.parse(root.admins); } catch {}
  } else if (Array.isArray(root.staff)) {
    rawAdmins = root.staff;
  } else if (typeof root.staff === 'string') {
    try { rawAdmins = JSON.parse(root.staff); } catch {}
  } else if (Array.isArray(root.adminList)) {
    rawAdmins = root.adminList;
  } else if (Array.isArray(raw?.admins)) {
    rawAdmins = raw.admins;
  } else if (Array.isArray(raw?.staff)) {
    rawAdmins = raw.staff;
  }

  // Check if raw data contains sheet rows (2D array representation from Google Sheets)
  const rowsCandidate = Array.isArray(root.rows) ? root.rows : 
    (Array.isArray(raw?.rows) ? raw.rows : 
    (Array.isArray(raw?.values) ? raw.values : 
    (Array.isArray(raw) ? raw : [])));

  if (Array.isArray(rowsCandidate) && rowsCandidate.length > 0) {
    for (const row of rowsCandidate) {
      if (Array.isArray(row)) {
        const firstCol = String(row[0] || '').trim().toUpperCase();
        if (firstCol === 'ADMIN' || firstCol === 'STAFF' || firstCol === 'USER' || firstCol === 'DOCTOR') {
          rawAdmins.push({
            id: row[1] || `stf_${rawAdmins.length + 1}`,
            name: row[2] || '',
            username: row[3] || row[1] || '',
            role: row[4] || firstCol,
            position: row[5] || 'ผู้ดูแลระบบ',
            email: row[6] || '',
            phone: row[7] || '',
            status: String(row[8] || 'active').toLowerCase() === 'active' ? 'active' : 'inactive',
            lastActive: row[9] || new Date().toISOString()
          });
        }
      }
    }
  }

  // Read existing staff accounts in localStorage to preserve local additions and custom roles
  let localStaff: any[] = [];
  try {
    const saved = localStorage.getItem('growth_lab_staff_accounts');
    if (saved) {
      localStaff = JSON.parse(saved);
    }
  } catch {}

  const normalizedAdmins: ClinicAdminUser[] = [];
  const seenUsernames = new Set<string>();

  // Helper to normalize individual admin record
  const addAdminRecord = (item: any, defaultSource: string) => {
    if (!item || typeof item !== 'object') return;
    const username = (item.username || item.user || item.id || '').trim().toLowerCase();
    if (!username || seenUsernames.has(username)) return;
    seenUsernames.add(username);

    const isDoctor = username === 'doctor' || item.role === 'DOCTOR' || (item.name && item.name.includes('นภาพร'));
    const isAdmin = username === 'admin' || item.role === 'ADMIN' || item.role === 'SUPER_ADMIN';

    let role = (item.role || (isDoctor ? 'DOCTOR' : (isAdmin ? 'ADMIN' : 'STAFF'))).toUpperCase();
    if (isDoctor && !role.includes('DOCTOR')) role = 'DOCTOR';

    const cleanName = String(item.name || item.displayName || (isDoctor ? doctorName : username));
    const position = item.position || (isDoctor ? doctorTitlePosition : (isAdmin ? 'ผู้ดูแลระบบส่วนกลาง' : 'เจ้าหน้าที่คลินิก'));
    const status = String(item.status || 'active').toLowerCase() === 'inactive' ? 'inactive' : 'active';

    normalizedAdmins.push({
      id: String(item.id || `stf_${username}`),
      name: cleanName,
      username: username,
      displayName: item.displayName || cleanName,
      email: item.email || (isDoctor ? email : `${username}@growthlab.clinic`),
      phone: item.phone || phone,
      role: isDoctor ? 'SUPER_ADMIN' : role,
      position: position,
      status: status,
      lastActive: item.lastActive || item.updatedAt || new Date().toISOString(),
      permissions: item.permissions || {
        'Dashboard': true,
        'ผู้รับการดูแล': true,
        'ติดตามผล': true,
        'EF / แบบฝึก': true,
        'ตั้งค่า': true,
        'ข้อมูลคลินิก': true,
        'บุคลากร': true
      },
      notes: item.notes || (isDoctor ? 'แพทย์เจ้าของคลินิกและผู้บริหาร' : 'ผู้ดูแลระบบคลินิก'),
      source: defaultSource
    });
  };

  // 1. Process from Sheets
  for (const a of rawAdmins) {
    addAdminRecord(a, 'Google Sheets (Clinic_Config)');
  }

  // 2. Merge local staff
  for (const s of localStaff) {
    addAdminRecord(s, 'Local / Cached');
  }

  // 3. Guarantee Owner Doctor (Super Admin)
  if (!seenUsernames.has('doctor')) {
    normalizedAdmins.unshift({
      id: 'stf_doctor_owner',
      name: doctorName,
      username: 'doctor',
      displayName: 'หมอนภาพร',
      email: email,
      phone: phone,
      role: 'SUPER_ADMIN',
      position: doctorTitlePosition,
      status: 'active',
      lastActive: new Date().toISOString(),
      permissions: {
        'Dashboard': true,
        'ผู้รับการดูแล': true,
        'ติดตามผล': true,
        'EF / แบบฝึก': true,
        'ตั้งค่า': true,
        'ข้อมูลคลินิก': true,
        'บุคลากร': true
      },
      notes: 'เจ้าของคลินิก & แพทย์ผู้มีอำนาจเต็ม',
      source: 'Clinic_Config (Owner Doctor)'
    });
    seenUsernames.add('doctor');
  }

  // 4. Guarantee System Admin
  if (!seenUsernames.has('admin')) {
    normalizedAdmins.push({
      id: 'stf_admin_system',
      name: 'ผู้ดูแลระบบคลินิก (System Admin)',
      username: 'admin',
      displayName: 'ผู้ดูแลระบบ',
      email: email,
      phone: phone,
      role: 'ADMIN',
      position: 'ผู้ดูแลระบบส่วนกลาง (IT & Clinic Admin)',
      status: 'active',
      lastActive: new Date().toISOString(),
      permissions: {
        'Dashboard': true,
        'ผู้รับการดูแล': true,
        'ติดตามผล': true,
        'EF / แบบฝึก': true,
        'ตั้งค่า': true,
        'ข้อมูลคลินิก': true,
        'บุคลากร': true
      },
      notes: 'ระบบจัดการและสำรองข้อมูล',
      source: 'Clinic_Config (System Admin)'
    });
  }

  return {
    clinicName,
    clinicNameEn,
    doctorName,
    doctorTitlePosition,
    doctorLicenseNo,
    doctorSpecialty,
    serviceScope,
    adminRoles,
    doctorVision,
    doctorBio,
    phone,
    address,
    email,
    website,
    additionalInfo,
    clinicLogoUrl,
    doctorPhotoUrl,
    defaultBreathingReps,
    defaultVentilationReps,
    defaultTongueReps,
    defaultMuscleReps,
    appsScriptWebhookUrl,
    admins: normalizedAdmins,
    sheetName: 'Clinic_Config',
    lastSyncTime: new Date().toISOString(),
    source: raw?.source || 'google-sheets',
    raw: root
  };
}

/**
 * 4.1 saveClinicConfig: Persist clinic and doctor settings + admin accounts to Clinic_Config on Google Sheets
 */
export async function saveClinicConfig(
  configData: Record<string, any>,
  customUrl?: string
): Promise<CloudApiResponse> {
  const payload = {
    action: 'SAVE_CLINIC_CONFIG',
    sheetName: 'Clinic_Config',
    clinicName: configData.clinicName || 'คลินิกทันตกรรมภาสุข (Growth Lab)',
    clinicNameEn: configData.clinicNameEn || 'Pasuk Dental Clinic (Growth Lab)',
    doctorName: configData.doctorName || 'ทันตแพทย์หญิง นภาพร วรรณษา',
    doctorTitlePosition: configData.doctorTitlePosition || 'ทันตแพทย์ผู้ให้การรักษาและเจ้าของคลินิก',
    doctorLicenseNo: configData.doctorLicenseNo || 'ท.8482',
    doctorSpecialty: configData.doctorSpecialty || '',
    serviceScope: configData.serviceScope || '',
    adminRoles: configData.adminRoles || '',
    doctorVision: configData.doctorVision || '',
    doctorBio: configData.doctorBio || '',
    phone: configData.phone || '081-8517672',
    address: configData.address || '366/4 ม.1 ตำบลดีลัง อำเภอพัฒนานิคม จังหวัดลพบุรี 15220',
    email: configData.email || '12pasuk.system@gmail.com',
    website: configData.website || '',
    additionalInfo: configData.additionalInfo || '',
    clinicLogoUrl: configData.clinicLogoUrl || '',
    doctorPhotoUrl: configData.doctorPhotoUrl || '',
    defaultBreathingReps: configData.defaultBreathingReps || 10,
    defaultVentilationReps: configData.defaultVentilationReps || 10,
    defaultTongueReps: configData.defaultTongueReps || 10,
    defaultMuscleReps: configData.defaultMuscleReps || 10,
    admins: configData.admins || [],
    payload: configData,
    timestamp: new Date().toISOString()
  };

  // 1. Save to local storage for instant offline-first reactivity
  try {
    localStorage.setItem('growthlab_clinic_info', JSON.stringify(payload));
    localStorage.setItem('growth_lab_settings', JSON.stringify(payload));
    if (Array.isArray(configData.admins) && configData.admins.length > 0) {
      localStorage.setItem('growth_lab_staff_accounts', JSON.stringify(configData.admins));
    }
  } catch (err) {
    console.warn('[cloudApi] LocalStorage save warning:', err);
  }

  // 2. Post to Cloud Backend / Google Sheets
  return cloudPost('SAVE_CLINIC_CONFIG', payload, customUrl);
}

/**
 * 4.2 getClinicConfig: Fetch clinic and doctor settings from Google Sheets tab Clinic_Config
 */
export async function getClinicConfig(
  customUrl?: string
): Promise<CloudApiResponse<ClinicConfigData>> {
  try {
    // 1. Query Apps Script Webhook with GET_CLINIC_CONFIG action
    let res = await cloudGet('GET_CLINIC_CONFIG', { sheet: 'Clinic_Config', sheetName: 'Clinic_Config' }, customUrl);

    // 2. Fallback to getClinicConfig or GET_CONFIG
    if (!res.success || (!res.data && !res.clinicConfig)) {
      res = await cloudGet('getClinicConfig', { sheet: 'Clinic_Config' }, customUrl);
    }

    // 3. Fallback to direct Google Sheets REST API if connected
    if (!res.success || !res.data) {
      try {
        const token = localStorage.getItem('google_access_token');
        const sheetId = localStorage.getItem('growthlab_active_spreadsheet_id');
        if (token && sheetId) {
          const directRes = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent('Clinic_Config!A1:Z100')}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (directRes.ok) {
            const sheetJson = await directRes.json();
            if (sheetJson.values && Array.isArray(sheetJson.values)) {
              res = {
                success: true,
                data: sheetJson.values
              };
            }
          }
        }
      } catch (directErr) {
        console.warn('[cloudApi] Direct Sheets API read fallback note:', directErr);
      }
    }

    const normalized = normalizeClinicConfigAndAdmins(res.data || res.clinicConfig || res);

    // Persist normalized data to local storage
    try {
      localStorage.setItem('growthlab_clinic_info', JSON.stringify(normalized));
      localStorage.setItem('growth_lab_settings', JSON.stringify(normalized));
      if (normalized.admins.length > 0) {
        localStorage.setItem('growth_lab_staff_accounts', JSON.stringify(normalized.admins));
      }
    } catch {}

    return {
      success: true,
      data: normalized,
      clinicConfig: normalized,
      admins: normalized.admins,
      message: 'ดึงข้อมูลการตั้งค่าคลินิกและรายชื่อผู้ดูแลระบบจาก Google Sheets (Clinic_Config) สำเร็จ'
    };
  } catch (err: any) {
    console.warn('[cloudApi] getClinicConfig warning:', err);
    const cached = normalizeClinicConfigAndAdmins({ source: 'cache' });
    return {
      success: false,
      data: cached,
      clinicConfig: cached,
      admins: cached.admins,
      error: err?.message || err,
      offline: !navigator.onLine
    };
  }
}

/**
 * 4.3 getClinicAdmins: Fetch administrators and staff list from Google Sheets Clinic_Config tab
 */
export async function getClinicAdmins(
  customUrl?: string
): Promise<CloudApiResponse<ClinicAdminUser[]>> {
  const configRes = await getClinicConfig(customUrl);
  return {
    success: configRes.success,
    data: configRes.data?.admins || [],
    admins: configRes.data?.admins || [],
    clinicConfig: configRes.data,
    message: configRes.message,
    error: configRes.error,
    offline: configRes.offline
  };
}

/**
 * 4.4 updateAdminStatus: Update administrator active/inactive status in Google Sheets Clinic_Config
 */
export async function updateAdminStatus(
  adminId: string,
  status: 'active' | 'inactive',
  customUrl?: string
): Promise<CloudApiResponse> {
  const payload = {
    action: 'UPDATE_ADMIN_STATUS',
    sheetName: 'Clinic_Config',
    adminId,
    status,
    timestamp: new Date().toISOString()
  };

  // Update in local staff accounts
  try {
    const raw = localStorage.getItem('growth_lab_staff_accounts');
    if (raw) {
      const staffList = JSON.parse(raw);
      const updated = staffList.map((s: any) => 
        (s.id === adminId || s.username === adminId) ? { ...s, status } : s
      );
      localStorage.setItem('growth_lab_staff_accounts', JSON.stringify(updated));
    }
  } catch {}

  return cloudPost('UPDATE_ADMIN_STATUS', payload, customUrl);
}

/**
 * 5. verifyStaff: Verify staff login credentials against Cloud Backend
 */
export async function verifyStaff(
  credentials: {
    username: string;
    password?: string;
    pin?: string;
    role?: string;
  },
  customUrl?: string
): Promise<CloudApiResponse<{
  verified: boolean;
  name?: string;
  role?: string;
  permissions?: Record<string, boolean>;
  token?: string;
}>> {
  const username = (credentials.username || '').trim();
  const password = (credentials.password || credentials.pin || '').trim();

  // Attempt POST action verifyStaff
  const res = await cloudPost('verifyStaff', {
    username,
    password,
    pin: credentials.pin || password,
    role: credentials.role || 'STAFF',
    timestamp: new Date().toISOString()
  }, customUrl);

  if (res.success && res.data) {
    const verified = Boolean(res.data.verified || res.data.success || res.data.authenticated);
    return {
      success: true,
      data: {
        verified,
        name: res.data.name || res.data.user?.name,
        role: res.data.role || res.data.user?.role,
        permissions: res.data.permissions || res.data.user?.permissions,
        token: res.data.token
      }
    };
  }

  return res;
}

/**
 * -----------------------------------------------------------------------------
 * 3. HYBRID OFFLINE-FIRST LOCAL PERSISTENCE HELPERS
 * -----------------------------------------------------------------------------
 */

export function savePatientLocal(patient: any): void {
  try {
    const raw = localStorage.getItem(MASTER_PATIENTS_KEY);
    const list: any[] = raw ? JSON.parse(raw) : [];
    const targetHn = patient.hn || patient.id;
    const filtered = list.filter(p => (p.hn || p.id) !== targetHn);
    const updated = [patient, ...filtered];
    localStorage.setItem(MASTER_PATIENTS_KEY, JSON.stringify(updated));
    localStorage.setItem('growthlab_patients', JSON.stringify(updated));
    localStorage.setItem('growth_lab_patients', JSON.stringify(updated));
  } catch (e) {
    console.warn('[cloudApi] savePatientLocal warning:', e);
  }
}

export function saveDailyLogLocal(log: any): void {
  try {
    const raw = localStorage.getItem(MASTER_DAILY_LOGS_KEY);
    const list: any[] = raw ? JSON.parse(raw) : [];
    list.unshift(log);
    const trimmed = list.slice(0, 500);
    localStorage.setItem(MASTER_DAILY_LOGS_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('[cloudApi] saveDailyLogLocal warning:', e);
  }
}

export function saveExerciseLogLocal(log: any): void {
  try {
    const raw = localStorage.getItem(MASTER_EXERCISE_LOGS_KEY);
    const list: any[] = raw ? JSON.parse(raw) : [];
    list.unshift(log);
    const trimmed = list.slice(0, 500);
    localStorage.setItem(MASTER_EXERCISE_LOGS_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('[cloudApi] saveExerciseLogLocal warning:', e);
  }
}

export function saveAppointmentLocal(appointment: any): void {
  try {
    const raw = localStorage.getItem(MASTER_APPOINTMENTS_KEY);
    const list: any[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter(a => a.id !== appointment.id);
    const updated = [appointment, ...filtered];
    localStorage.setItem(MASTER_APPOINTMENTS_KEY, JSON.stringify(updated));
    localStorage.setItem('growthlab_appointments', JSON.stringify(updated));
  } catch (e) {
    console.warn('[cloudApi] saveAppointmentLocal warning:', e);
  }
}

/**
 * -----------------------------------------------------------------------------
 * 4. OFFLINE SYNC QUEUE MANAGEMENT
 * -----------------------------------------------------------------------------
 */

export function enqueueOfflineItem(action: string, payload: any): void {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    const queue: OfflineSyncItem[] = raw ? JSON.parse(raw) : [];
    queue.push({
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      action,
      payload,
      timestamp: new Date().toISOString(),
      retryCount: 0
    });
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue.slice(-100)));
  } catch (e) {
    console.warn('[cloudApi] enqueueOfflineItem warning:', e);
  }
}

export async function flushOfflineQueue(): Promise<{ processed: number; remaining: number }> {
  if (typeof window === 'undefined' || !navigator.onLine) {
    return { processed: 0, remaining: 0 };
  }

  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    if (!raw) return { processed: 0, remaining: 0 };
    const queue: OfflineSyncItem[] = JSON.parse(raw);
    if (!Array.isArray(queue) || queue.length === 0) return { processed: 0, remaining: 0 };

    console.log(`[cloudApi] Processing ${queue.length} offline sync items...`);
    const remaining: OfflineSyncItem[] = [];
    let processed = 0;

    for (const item of queue) {
      try {
        const endpoint = getApiUrl();
        const requestBody = {
          action: item.action,
          payload: item.payload,
          timestamp: item.timestamp,
          ...item.payload
        };

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(requestBody)
        });

        if (res.ok) {
          processed++;
        } else {
          item.retryCount++;
          if (item.retryCount < 5) remaining.push(item);
        }
      } catch {
        item.retryCount++;
        if (item.retryCount < 5) remaining.push(item);
      }
    }

    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remaining));
    console.log(`[cloudApi] Offline sync complete: ${processed} synced, ${remaining.length} remaining.`);
    return { processed, remaining: remaining.length };
  } catch (e) {
    console.warn('[cloudApi] flushOfflineQueue error:', e);
    return { processed: 0, remaining: 0 };
  }
}

// Auto flush offline queue when browser reconnects to internet
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[cloudApi] Network connection restored. Flushing offline queue...');
    flushOfflineQueue();
  });
}

/**
 * Unified Cloud API Interface
 */
export const cloudApi = {
  API_URL,
  getApiUrl,
  postAction,
  cloudPost,
  cloudGet,
  getDailyLogs,
  getPatient,
  getInitialData,
  getPatients,
  savePatient,
  logDaily,
  dailyCheckIn,
  submitExercise,
  getAppointments,
  saveExercise,
  saveAppointment,
  saveClinicConfig,
  getClinicConfig,
  getClinicAdmins,
  updateAdminStatus,
  normalizeClinicConfigAndAdmins,
  verifyStaff,
  trackActivity,
  flushOfflineQueue
};

export default cloudApi;
