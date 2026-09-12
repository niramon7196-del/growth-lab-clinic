import { parseAndCleanAssignedTasks, sanitizeTaskCode } from '../utils/cleanTasks';
import { detectGenderFromPatientData } from '../utils/patientUtils';
import { 
  routeAppointmentToGoogleSheets, 
  dataRouter, 
  formatAppointment9Columns, 
  APPOINTMENT_COLUMNS, 
  APPOINTMENT_SHEET_NAME 
} from './dataRouter';

export { dataRouter, routeAppointmentToGoogleSheets, formatAppointment9Columns, APPOINTMENT_COLUMNS, APPOINTMENT_SHEET_NAME };

/**
 * Google Apps Script Integration for Growth Lab
 * Connects patient registration, check-ins, homework, and reports directly to Google Sheets.
 */

// 1. Central API Endpoint for Google Apps Script Web App
export const API_URL = 'https://script.google.com/macros/s/AKfycbwwG3zgIjm11hxw2B971OkOgmnQ1gPGareMVCUBplGcU3MwLLCXxMFgjD0B604ccaJc/exec';
export const CHECKIN_BASE_URL = API_URL;
export const DEFAULT_WEBHOOK_URL = API_URL;

export function getWebhookUrl(): string {
  try {
    const raw = localStorage.getItem('growth_lab_settings') || localStorage.getItem('growthlab_settings') || localStorage.getItem('growthlab_clinic_info');
    if (raw) {
      const parsed = JSON.parse(raw);
      const urlCandidate = parsed.appsScriptWebhookUrl || parsed.webhookUrl || parsed.gasWebhookUrl;
      if (urlCandidate && typeof urlCandidate === 'string' && urlCandidate.trim() !== '') {
        const stored = urlCandidate.trim();
        // If it still points to the old apps script url, migrate it to the current master API_URL
        if (
          !stored.includes('AKfycbwwG3zgIjm11hxw2B971OkOgmnQ1gPGareMVCUBplGcU3MwLLCXxMFgjD0B604ccaJc') ||
          stored.includes('AKfycbwKBK8vNUYLH7sAdM9x') ||
          stored.includes('AKfycbwFdmRIkDUI9NiyjlPS0RP57qh3jrBXfPv2d6ADhMiFk_MPpp1lk7EcVd4b0hREBipP') ||
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
    console.warn('[googleAppsScriptService] Error reading settings:', e);
  }
  return API_URL;
}

/**
 * 1. Save Patient to Google Sheets (action: 'savePatient')
 * Live Cloud Sync: POST to Google Apps Script Web App with text/plain;charset=utf-8 headers.
 */
export async function savePatientToGoogleSheets(
  patient: any,
  webhookUrl?: string
): Promise<{ success: boolean; data?: any; error?: any }> {
  const targetUrl = webhookUrl || getWebhookUrl() || API_URL;
  if (!targetUrl) {
    console.warn('[googleAppsScriptService] No webhook URL provided for patient save.');
    return { success: false, error: 'No webhook URL' };
  }

  try {
    const fn = (patient.firstName || '').toString().trim();
    const ln = (patient.lastName || '').toString().trim();
    const fullName = (patient.name || `${fn} ${ln}`.trim() || patient.nickname || patient.hn || '').toString().trim() || '-';
    const hn = (patient.hn || patient.id || '').toString().trim() || '-';
    const nickname = (patient.nickname || '').toString().trim() || '-';
    const gender = (patient.gender || detectGenderFromPatientData(patient) || 'ชาย').toString().trim() || '-';
    const birthDate = (patient.birthDate || patient.dob || '').toString().trim() || '-';
    const phone = (patient.phone || patient.parentPhone || patient.tel || '').toString().trim() || '-';
    
    // Extract assigned tasks list formatted cleanly for Google Sheets
    let assignedTasksStr = '-';
    if (Array.isArray(patient.assignedTasks) && patient.assignedTasks.length > 0) {
      assignedTasksStr = patient.assignedTasks.join(', ');
    } else if (typeof patient.assignedTasks === 'string' && patient.assignedTasks.trim()) {
      assignedTasksStr = patient.assignedTasks.trim();
    } else if (Array.isArray(patient.assignedExercises) && patient.assignedExercises.length > 0) {
      assignedTasksStr = patient.assignedExercises.join(', ');
    }

    const status = (patient.status && String(patient.status).toLowerCase() === 'active') ? 'Active' : (patient.status ? String(patient.status) : 'Active');

    const requestBody = {
      action: 'savePatient',
      sheetName: 'Patients',
      payload: {
        hn,
        name: fullName,
        nickname,
        gender,
        birthDate,
        phone,
        assignedTasks: assignedTasksStr,
        status,
        notes: (patient.notes || '').toString().trim() || '-',
        weight: patient.weight || '-',
        height: patient.height || '-',
        age: patient.age || '-',
        startDate: patient.startDate || new Date().toISOString().split('T')[0]
      }
    };

    let resData: any = null;
    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(requestBody),
      });
      resData = await response.json();
    } catch {
      // Fallback mode for environments handling redirects with no-cors
      await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(requestBody),
        mode: 'no-cors'
      });
      resData = { status: 'success', note: 'POST sent (no-cors mode)' };
    }

    console.log('[googleAppsScriptService] savePatient successfully synced to Google Sheets:', hn, resData);
    return { success: true, data: resData };
  } catch (error) {
    console.error('[googleAppsScriptService] Failed to save patient to Google Sheets:', error);
    return { success: false, error };
  }
}

export const registerPatientToGoogleSheets = savePatientToGoogleSheets;
export const syncPatientToGoogleSheets = (webhookUrl: string | undefined, patient: any) => savePatientToGoogleSheets(patient, webhookUrl);

/**
 * Normalizes raw patient object from Google Sheets API into standard Patient model
 */
export function normalizeApiPatient(raw: any): any {
  if (!raw) return null;
  const hn = (raw.hn || raw.HN || raw.id || '').toString().trim();
  const rawName = (raw.name || raw.Name || raw.fullName || '').toString().trim();
  
  const parts = rawName.split(/\s+/);
  const firstName = raw.firstName || (parts.length > 0 ? parts[0] : `คนไข้ (${hn})`);
  const lastName = raw.lastName || (parts.length > 1 ? parts.slice(1).join(' ') : '');
  const rawNickname = (raw.nickname || raw.Nickname || raw.nickName || raw.NickName || raw['ชื่อเล่น'] || '').toString().trim();
  const nickname = (rawNickname && rawNickname !== '-' && rawNickname !== 'ไม่ระบุ') ? rawNickname : '';
  const rawPhone = (raw.phone !== undefined && raw.phone !== null && raw.phone !== '-') ? String(raw.phone).trim() : '';
  const phone = (rawPhone && !rawPhone.startsWith('0') && rawPhone.length === 9) ? `0${rawPhone}` : rawPhone;
  const rawGender = (raw.gender || raw.Gender || raw.sex || raw.Sex || raw['เพศ'] || '').toString().trim();
  const gender = detectGenderFromPatientData({
    ...raw,
    hn,
    name: rawName,
    firstName,
    lastName,
    gender: rawGender,
    nickname
  });
  const birthDate = raw.birthDate ? (String(raw.birthDate).includes('T') ? String(raw.birthDate).split('T')[0] : String(raw.birthDate)) : (raw.dob || '');

  const assignedTasks: string[] = parseAndCleanAssignedTasks(raw.assignedTasks || raw.assignedExercises || raw.AssignedTasks);

  const todayStr = new Date().toISOString().split('T')[0];
  const assignments = assignedTasks.map((taskId, idx) => ({
    id: `asgn_${hn}_${sanitizeTaskCode(taskId)}_${idx}`,
    patientId: hn,
    exerciseId: sanitizeTaskCode(taskId),
    reps: 10,
    durationMinutes: 5,
    startDate: todayStr,
    status: 'pending' as const
  }));

  return {
    id: hn,
    hn,
    name: rawName || `${firstName} ${lastName}`.trim(),
    firstName,
    lastName,
    nickname,
    gender,
    birthDate,
    dob: birthDate,
    phone,
    parentPhone: phone,
    assignedTasks,
    assignedExercises: assignedTasks,
    assignments,
    status: raw.status || 'Active',
    checkInHistory: raw.checkInHistory || [],
    checkIns: raw.checkInHistory || [],
    startDate: raw.startDate || todayStr,
    qrToken: raw.qrToken || `tok_${hn}_${hn.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
    notes: raw.notes || ''
  };
}

/**
 * Fetch patient directly from Google Sheets API by HN or Phone
 * Real Cloud API Query - Never uses mock data
 */
export async function fetchPatientByHnFromGoogleSheets(
  hnOrPhone: string,
  webhookUrl?: string
): Promise<any | null> {
  const targetUrl = webhookUrl || getWebhookUrl() || API_URL;
  if (!targetUrl || !hnOrPhone) return null;

  const cleanQuery = hnOrPhone.trim();
  if (!cleanQuery) return null;

  const tryFetch = async (queryParam: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    try {
      const url = new URL(targetUrl);
      url.searchParams.append('hn', queryParam);
      url.searchParams.append('t', Date.now().toString());

      const res = await fetch(url.toString(), {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const text = await res.text();
        let data: any = null;
        try {
          data = JSON.parse(text);
        } catch {
          // If response was not direct JSON, return null
          return null;
        }

        if (data) {
          if (data.found === true && data.patient) {
            console.log(`[googleAppsScriptService] Found live patient on Google Sheets:`, data.patient);
            return normalizeApiPatient(data.patient);
          } else if (data.patient) {
            return normalizeApiPatient(data.patient);
          } else if (data.data && (data.data.hn || data.data.name)) {
            return normalizeApiPatient(data.data);
          } else if (data.hn || (data.name && data.status !== 'error')) {
            return normalizeApiPatient(data);
          }
        }
      }
    } catch (err) {
      console.warn(`[googleAppsScriptService] Query HN ${queryParam} error:`, err);
    }
    return null;
  };

  // 1. Try direct clean query
  const directResult = await tryFetch(cleanQuery);
  if (directResult) return directResult;

  // 2. If query starts with 0 (e.g. Thai mobile 0891234567), retry with stripped leading 0
  if (cleanQuery.startsWith('0')) {
    const stripped = cleanQuery.replace(/^0+/, '');
    const strippedResult = await tryFetch(stripped);
    if (strippedResult) return strippedResult;
  }

  // 3. If query is numeric, retry with HN- prefix
  if (/^\d+$/.test(cleanQuery)) {
    const hnPrefixedResult = await tryFetch(`HN-${cleanQuery}`);
    if (hnPrefixedResult) return hnPrefixedResult;
  }

  // 4. Fallback: fetch all patients from API and find by normalized HN
  try {
    const allPatients = await fetchPatientsFromGoogleSheets(targetUrl);
    if (allPatients && allPatients.length > 0) {
      const normalizedQuery = cleanQuery.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const matched = allPatients.find((p: any) => {
        const pHn = (p.hn || p.id || '').toString().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const pPhone = (p.phone || '').toString().replace(/[^0-9]/g, '');
        return (pHn && (pHn === normalizedQuery || pHn.includes(normalizedQuery) || normalizedQuery.includes(pHn))) ||
               (pPhone && pPhone === cleanQuery.replace(/[^0-9]/g, ''));
      });
      if (matched) {
        return normalizeApiPatient(matched);
      }
    }
  } catch (err) {
    console.warn('[googleAppsScriptService] Fallback all patients lookup error:', err);
  }

  return null;
}

/**
 * 3. Fetch Initial Data from Google Sheets (Calls 'getInitialData' or fallback 'getPatients')
 * Retrieves patients, appointments, logs, and clinic settings in real-time.
 */
export async function fetchInitialDataFromGoogleSheets(
  webhookUrl?: string
): Promise<{
  patients?: any[];
  appointments?: any[];
  logs?: any[];
  clinicConfig?: any;
} | null> {
  const targetUrl = webhookUrl || getWebhookUrl() || API_URL;
  if (!targetUrl) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const url = new URL(targetUrl);
    url.searchParams.append('action', 'getInitialData');
    url.searchParams.append('t', Date.now().toString());

    const res = await fetch(url.toString(), {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      if (json) {
        let patientsList: any[] = extractPatientsListFromResponse(json);
        if (Array.isArray(json) && json.length === 0) {
          patientsList = [];
        }

        const appointments = Array.isArray(json.appointments) 
          ? json.appointments 
          : (json.data && Array.isArray(json.data.appointments) ? json.data.appointments : []);

        const logs = Array.isArray(json.logs) 
          ? json.logs 
          : (json.data && Array.isArray(json.data.logs) ? json.data.logs : []);

        const clinicConfig = json.clinicConfig || (json.data && json.data.clinicConfig) || null;

        return {
          patients: patientsList,
          appointments,
          logs,
          clinicConfig
        };
      }
    }
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('[googleAppsScriptService] getInitialData GET error, falling back to getPatients:', err);
  }

  // Fallback to fetchPatientsFromGoogleSheets
  try {
    const patients = await fetchPatientsFromGoogleSheets(targetUrl);
    if (patients !== null && patients !== undefined) {
      return { patients };
    }
  } catch (err) {
    console.warn('[googleAppsScriptService] Fallback patient fetch error:', err);
  }

  return null;
}

/**
 * Helper to safely extract patients array from various Google Apps Script response formats:
 * - Direct array of patient objects
 * - 2D Array of rows from Google Sheets (row 0 = headers)
 * - Object with keys: patients, data, records, result, rows, values, items, members
 * - Dictionary object keyed by HN / ID
 */
export function extractPatientsListFromResponse(data: any): any[] {
  if (!data) return [];

  // 1. Direct array
  if (Array.isArray(data)) {
    if (data.length === 0) return [];
    // Check if 2D array of rows (first row is column headers)
    if (Array.isArray(data[0])) {
      const headers = data[0].map((h: any) => String(h || '').trim());
      const rows = data.slice(1);
      return rows.map((row: any[]) => {
        const obj: any = {};
        headers.forEach((h: string, i: number) => {
          if (h) obj[h] = row[i];
        });
        // Positional fallbacks matching exact columns: Col A = hn, Col B = name, Col C = nickname, Col D = gender, Col E = birthDate, Col F = phone, Col G = assignedTasks, Col H = status
        if (!obj.hn && row[0] !== undefined) obj.hn = row[0];
        if (!obj.name && row[1] !== undefined) obj.name = row[1];
        if (!obj.nickname && row[2] !== undefined) obj.nickname = row[2];
        if (!obj.gender && row[3] !== undefined) obj.gender = row[3];
        if (!obj.birthDate && row[4] !== undefined) obj.birthDate = row[4];
        if (!obj.phone && row[5] !== undefined) obj.phone = row[5];
        if (!obj.assignedTasks && row[6] !== undefined) obj.assignedTasks = row[6];
        if (!obj.status && row[7] !== undefined) obj.status = row[7];
        return obj;
      }).filter((item: any) => Object.keys(item).length > 0);
    }
    return data;
  }

  // 2. Object with nested array candidates
  if (typeof data === 'object') {
    const candidates = [
      data.patients,
      data.data?.patients,
      data.data?.members,
      data.data?.records,
      data.data?.rows,
      data.data?.patientList,
      data.data,
      data.records,
      data.result,
      data.members,
      data.rows,
      data.values,
      data.items,
      data.patientList
    ];

    for (const c of candidates) {
      if (Array.isArray(c)) {
        if (c.length === 0) return [];
        return extractPatientsListFromResponse(c);
      }
    }

    // 3. Object dictionary keyed by HN or ID (e.g. { "HN-001": {...}, "HN-002": {...} })
    const values = Object.values(data);
    if (values.length > 0 && values.some(v => typeof v === 'object' && v !== null && ((v as any).hn || (v as any).name || (v as any).HN || (v as any)['ชื่อ'] || (v as any)['ชื่อ-นามสกุล']))) {
      return values.filter(v => typeof v === 'object' && v !== null);
    }

    // If response explicitly has success: true or empty container
    if (data.success === true && (data.data === undefined || data.data === null || (Array.isArray(data.data) && data.data.length === 0))) {
      return [];
    }
  }

  return [];
}

/**
 * 4. Fetch fresh patient list from Google Sheets (Auto Fetch & Sync)
 * Prioritizes action: 'getPatients' as the primary API query parameter.
 */
export async function fetchPatientsFromGoogleSheets(
  webhookUrl?: string
): Promise<any[] | null> {
  const targetUrl = webhookUrl || getWebhookUrl();
  if (!targetUrl) return null;

  // Primary action: 'getPatients' followed by fallback actions
  const actionsToTry = ['getPatients', 'GET_PATIENTS', 'getInitialData', 'getMembers'];

  for (const action of actionsToTry) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    try {
      const url = new URL(targetUrl);
      url.searchParams.set('action', action);
      url.searchParams.set('t', Date.now().toString());

      const res = await fetch(url.toString(), {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const text = await res.text();
        let parsedData: any = null;
        try {
          parsedData = JSON.parse(text);
        } catch {
          // If wrapped in HTML or callback
          const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
          if (match) {
            try {
              parsedData = JSON.parse(match[0]);
            } catch {}
          }
        }

        if (parsedData !== null && parsedData !== undefined) {
          const list = extractPatientsListFromResponse(parsedData);
          if (Array.isArray(list)) {
            console.log(`[googleAppsScriptService] Successfully fetched ${list.length} patients from Google Sheets via action="${action}".`);
            return list;
          }
        }
      }
    } catch (err) {
      console.warn(`[googleAppsScriptService] Fetch patients warning on action=${action}:`, err);
    }
  }

  return null;
}

/**
 * 4.1 Fetch Daily Check-in Logs directly from Google Sheets (Daily_Logs)
 */
export async function fetchDailyLogsFromGoogleSheets(
  hn?: string,
  webhookUrl?: string
): Promise<any[] | null> {
  const targetUrl = webhookUrl || getWebhookUrl();
  if (!targetUrl) return null;

  const actionsToTry = ['getDailyLogs', 'GET_DAILY_LOGS', 'getLogs', 'getInitialData'];

  for (const action of actionsToTry) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    try {
      const url = new URL(targetUrl);
      url.searchParams.set('action', action);
      if (hn) {
        url.searchParams.set('hn', hn.trim());
        url.searchParams.set('patientId', hn.trim());
      }
      url.searchParams.set('t', Date.now().toString());

      const res = await fetch(url.toString(), {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const text = await res.text();
        let parsedData: any = null;
        try {
          parsedData = JSON.parse(text);
        } catch {
          const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
          if (match) {
            try {
              parsedData = JSON.parse(match[0]);
            } catch {}
          }
        }

        if (parsedData) {
          let list: any[] = [];
          if (Array.isArray(parsedData)) {
            list = parsedData;
          } else if (Array.isArray(parsedData.logs)) {
            list = parsedData.logs;
          } else if (Array.isArray(parsedData.data)) {
            list = parsedData.data;
          } else if (Array.isArray(parsedData.records)) {
            list = parsedData.records;
          } else if (Array.isArray(parsedData.data?.logs)) {
            list = parsedData.data.logs;
          }

          if (Array.isArray(list) && list.length > 0) {
            console.log(`[googleAppsScriptService] Successfully fetched ${list.length} daily logs from Google Sheets (action=${action}).`);
            return list;
          }
        }
      }
    } catch (err) {
      console.warn(`[googleAppsScriptService] Fetch daily logs warning on action=${action}:`, err);
    }
  }

  return null;
}

/**
 * 5. Fetch live patient plan from Google Sheets when patient scans QR or inputs HN
 */
export async function fetchPatientPlanFromGoogleSheets(
  webhookUrl: string | undefined,
  patientIdOrHn: string
): Promise<any | null> {
  const targetUrl = webhookUrl || getWebhookUrl();
  if (!targetUrl || !patientIdOrHn) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);
  try {
    const url = new URL(targetUrl);
    url.searchParams.append('action', 'GET_PATIENT_PLAN');
    url.searchParams.append('hn', patientIdOrHn);
    url.searchParams.append('patientId', patientIdOrHn);
    url.searchParams.append('t', Date.now().toString());

    const res = await fetch(url.toString(), {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error('Failed to fetch patient plan');
    const data = await res.json();

    if (data && (data.id || data.hn || data.assignedExercises || data.assignments)) {
      console.log(`[googleAppsScriptService] Fetched live plan for patient ${patientIdOrHn}:`, data);
      return data;
    }
  } catch (err) {
    console.warn(`[googleAppsScriptService] Fetch plan warning for ${patientIdOrHn}:`, err);
  }
  return null;
}

/**
 * 6. Sync Homework & Exercise completion scores back to Google Sheets (action: 'saveExercise')
 */
export async function syncHomeworkToGoogleSheets(
  webhookUrl: string,
  payload: {
    hn: string;
    patientId: string;
    date: string;
    omtScore: number;
    exerciseScore: number;
    sleepStatus: string;
    nutritionStatus: string;
    videoLink?: string;
    completedExercises?: string[];
    [key: string]: any;
  }
) {
  const targetUrl = webhookUrl || getWebhookUrl();
  if (!targetUrl) {
    console.warn('[googleAppsScriptService] No webhook URL provided.');
    return;
  }

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'saveExercise',
        sheetName: 'Exercise_Logs',
        altAction: 'SAVE_DAILY_SUMMARY',
        timestamp: new Date().toISOString(),
        hn: payload.hn || payload.patientId || '',
        patientId: payload.patientId || payload.hn || '',
        exerciseId: (payload.completedExercises && payload.completedExercises[0]) || 'omt_exercise',
        durationSec: payload.durationSec || 300,
        reps: payload.reps || 10,
        score: payload.exerciseScore || payload.omtScore || 100,
        satisfaction: payload.satisfaction || 5,
        status: payload.status || 'completed',
        patientName: payload.patientName || payload.name || '',
        exerciseTitle: payload.exerciseTitle || 'ส่งการบ้านสรุปผลประจำวัน (SAVE_DAILY_SUMMARY)',
        payload,
        ...payload
      }),
      mode: 'no-cors'
    });

    console.log('[googleAppsScriptService] Exercise scores submitted to Google Sheets:', payload.hn);
    return response;
  } catch (error) {
    console.error('[googleAppsScriptService] Failed to sync homework:', error);
    throw error;
  }
}

/**
 * 7. Sync Nutrition GNS Checklist to Google Sheets
 */
export async function syncNutritionToGoogleSheets(
  webhookUrl: string,
  payload: {
    hn: string;
    patientId: string;
    date: string;
    action?: string;
    score: string;
    status: string;
    patientName?: string;
    name?: string;
    exerciseId?: string;
    exerciseTitle?: string;
    durationSec?: number;
    reps?: number;
    satisfaction?: number;
    itemsChecked?: string[];
  }
) {
  const targetUrl = webhookUrl || getWebhookUrl();
  if (!targetUrl) return;

  try {
    const bodyData = {
      action: payload.action || 'บันทึกโภชนาการ GNS',
      sheetName: 'Daily_Logs',
      timestamp: new Date().toISOString(),
      hn: payload.hn || '',
      patientId: payload.patientId || '',
      date: payload.date || new Date().toISOString().split('T')[0],
      score: payload.score || '100/100',
      status: payload.status || 'completed',
      patientName: payload.patientName || payload.name || '',
      exerciseId: payload.exerciseId || 'nutrition_gns',
      exerciseTitle: payload.exerciseTitle || 'บันทึกโภชนาการ GNS',
      durationSec: payload.durationSec || 60,
      reps: payload.reps || 1,
      satisfaction: payload.satisfaction || 5,
      itemsChecked: payload.itemsChecked || [],
      payload,
      ...payload
    };

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(bodyData),
      mode: 'no-cors'
    });
    console.log('[googleAppsScriptService] Nutrition GNS submitted to Google Sheets:', payload.hn);
    return response;
  } catch (error) {
    console.error('[googleAppsScriptService] Failed to sync nutrition:', error);
    throw error;
  }
}

/**
 * 8. Sync Sleep Quality & EF Device Logs to Google Sheets
 */
export async function syncSleepEfToGoogleSheets(
  webhookUrl: string,
  payload: {
    hn: string;
    patientId: string;
    date: string;
    action?: string;
    score: string;
    status: string;
    patientName?: string;
    name?: string;
    exerciseId?: string;
    exerciseTitle?: string;
    durationSec?: number;
    reps?: number;
    satisfaction?: number;
    sleepHours: number;
    efHours: number;
    rating: number;
  }
) {
  const targetUrl = webhookUrl || getWebhookUrl();
  if (!targetUrl) return;

  try {
    const bodyData = {
      action: payload.action || 'บันทึกข้อมูลการนอน & EF',
      sheetName: 'Daily_Logs',
      timestamp: new Date().toISOString(),
      hn: payload.hn || '',
      patientId: payload.patientId || '',
      date: payload.date || new Date().toISOString().split('T')[0],
      score: payload.score || 'คะแนนการนอน 4/5, ใส่ EF 8 ชม.',
      status: payload.status || 'completed',
      patientName: payload.patientName || payload.name || '',
      exerciseId: payload.exerciseId || 'sleep_ef',
      exerciseTitle: payload.exerciseTitle || 'บันทึกข้อมูลการนอน & EF',
      durationSec: payload.durationSec || 60,
      reps: payload.reps || 1,
      satisfaction: payload.satisfaction || 5,
      sleepHours: payload.sleepHours || 8,
      efHours: payload.efHours || 8,
      rating: payload.rating || 5,
      ...payload
    };

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(bodyData),
      mode: 'no-cors'
    });
    console.log('[googleAppsScriptService] Sleep & EF submitted to Google Sheets:', payload.hn);
    return response;
  } catch (error) {
    console.error('[googleAppsScriptService] Failed to sync Sleep & EF:', error);
    throw error;
  }
}

/**
 * 9. Sync Daily Check-in to Google Sheets (action: 'logDaily')
 */
export async function syncDailyCheckInToGoogleSheets(
  webhookUrl: string,
  payload: {
    patientId: string;
    hn?: string;
    action?: string;
    actionName?: string;
    score?: string;
    status?: string;
    [key: string]: any;
  }
) {
  const targetUrl = webhookUrl || getWebhookUrl();
  if (!targetUrl) return;

  try {
    const bodyData = {
      action: 'logDaily',
      sheetName: 'Daily_Logs',
      altAction: payload.action || 'เช็คอินประจำวัน (Daily Check-in)',
      actionName: payload.actionName || 'เช็คอินประจำวัน (Daily Check-in)',
      patientId: payload.patientId || payload.hn || '',
      hn: payload.hn || payload.patientId || '',
      score: payload.score || 'สำเร็จ',
      status: payload.status || 'completed',
      timestamp: new Date().toISOString(),
      patientName: payload.patientName || payload.name || '',
      exerciseId: payload.exerciseId || payload.action || 'daily_checkin',
      exerciseTitle: payload.exerciseTitle || payload.actionName || 'เช็คอินประจำวัน (Daily Check-in)',
      durationSec: payload.durationSec || 0,
      reps: payload.reps || 1,
      satisfaction: payload.satisfaction || 5,
      payload,
      ...payload
    };

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(bodyData),
      mode: 'no-cors'
    });

    console.log('[googleAppsScriptService] Daily check-in logged to Google Sheets:', bodyData.hn || bodyData.patientId);
    return response;
  } catch (error) {
    console.error('[googleAppsScriptService] Failed to sync check-in to Google Sheets:', error);
  }
}

/**
 * 10. Sync Clean Daily Summary (1 Row Per Patient Per Day Policy)
 */
export async function syncCleanDailySummaryToGoogleSheets(
  webhookUrl: string,
  summaryData: {
    patientId: string;
    hn: string;
    date: string;
    checkInStatus: string;
    streakDays: number;
    completedExercises: number;
    gnsScore?: number;
    sleepRating?: number;
    complianceScore: number;
    name?: string;
    patientName?: string;
    checkInTime?: string;
    totalAppOpens?: number;
    classification?: string;
  }
) {
  const targetUrl = webhookUrl || getWebhookUrl();
  if (!targetUrl) return;

  try {
    const payloadData = {
      action: 'SAVE_DAILY_SUMMARY',
      sheetName: 'Daily_Logs',
      timestamp: new Date().toISOString(),
      patientId: summaryData.patientId,
      hn: summaryData.hn,
      date: summaryData.date,
      score: `${summaryData.complianceScore}% (Streak: ${summaryData.streakDays} วัน)`,
      status: summaryData.checkInStatus,
      patientName: summaryData.patientName || summaryData.name || '',
      exerciseId: 'daily_summary',
      exerciseTitle: 'Daily Summary Report',
      durationSec: 0,
      reps: summaryData.completedExercises || 0,
      satisfaction: summaryData.sleepRating || 5,
      payload: summaryData,
      ...summaryData
    };

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payloadData),
      mode: 'no-cors'
    });

    console.log('[googleAppsScriptService] Clean Daily Summary synced to Google Sheets:', summaryData.hn);
    return response;
  } catch (error) {
    console.error('[googleAppsScriptService] Failed to sync clean daily summary:', error);
  }
}

export async function fetchRemoteHomeworkSync(
  webhookUrl: string,
  patientId: string
) {
  const targetUrl = webhookUrl || getWebhookUrl();
  if (!targetUrl) return null;

  try {
    const url = new URL(targetUrl);
    url.searchParams.append('action', 'GET_DAILY_SUMMARY');
    url.searchParams.append('patientId', patientId);
    url.searchParams.append('t', Date.now().toString());

    const res = await fetch(url.toString(), {
      method: 'GET'
    });
    if (!res.ok) throw new Error('Failed to fetch remote homework data');
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('[googleAppsScriptService] Fetch remote data warning:', err);
    return null;
  }
}

/**
 * 11. Sync Monthly Analytics and Patient Grouping Report to Google Sheets
 */
export async function syncMonthlyAnalyticsToGoogleSheets(
  webhookUrl: string,
  monthlyReportData: {
    month: string;
    totalPatients: number;
    consistentCount: number;
    irregularCount: number;
    dormantCount: number;
    totalCheckIns: number;
    patientBreakdown: Array<{
      hn: string;
      name: string;
      category: string;
      categoryLabel: string;
      checkInDays: number;
      compliancePercent: number;
      lastCheckIn: string;
    }>;
  }
) {
  const targetUrl = webhookUrl || getWebhookUrl();
  if (!targetUrl) return;

  try {
    const bodyData = {
      action: 'SAVE_MONTHLY_REPORT',
      sheetName: 'Logs',
      actionName: 'รายงานสรุปภาพรวมสิ้นเดือน (Monthly Analytics Report)',
      timestamp: new Date().toISOString(),
      month: monthlyReportData.month,
      totalPatients: monthlyReportData.totalPatients,
      score: `สม่ำเสมอ: ${monthlyReportData.consistentCount} | ขาดๆ หายๆ: ${monthlyReportData.irregularCount} | หายไปนาน: ${monthlyReportData.dormantCount}`,
      payload: monthlyReportData
    };

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(bodyData),
      mode: 'no-cors'
    });
    console.log('[googleAppsScriptService] Monthly Analytics Report submitted to Google Sheets:', monthlyReportData.month);
    return response;
  } catch (error) {
    console.error('[googleAppsScriptService] Failed to sync monthly report to Google Sheets:', error);
    throw error;
  }
}

/**
 * 12. Sync Appointment to Google Sheets (Appointments tab - Upsert / Create)
 * Sends POST request to Google Apps Script Web App targeting the "Appointments" tab.
 * Column order (100% alignment):
 * 1. ID: Appointment ID (auto-generated or timestamp/UUID)
 * 2. HN: Patient HN
 * 3. PatientName: Patient full name
 * 4. Date: Appointment date (YYYY-MM-DD)
 * 5. Time: Appointment time (HH:MM)
 * 6. Type: Appointment type (ตรวจติดตาม, นัดฝึก, OMT)
 * 7. Doctor: Treating doctor name (e.g., ทันตแพทย์หญิง นภาพร วรรณษา)
 * 8. Status: Appointment status ("นัดหมาย", "รอตรวจ", "Confirmed")
 * 9. Notes: Additional notes
 */
export async function syncAppointmentToGoogleSheets(
  webhookUrl: string | undefined,
  appointment: any
) {
  const targetUrl = webhookUrl || getWebhookUrl() || API_URL;
  if (!targetUrl) {
    console.warn('[googleAppsScriptService] No webhook URL provided for appointment sync.');
    return { success: false, error: 'No webhook URL' };
  }

  // Strictly route via dataRouter exclusively to the "Appointments" tab
  // Formats to the 9 columns: ID, HN, PatientName, Date, Time, Type, Doctor, Status, Notes
  return routeAppointmentToGoogleSheets(appointment, targetUrl);
}

/**
 * 13. Delete Appointment from Google Sheets (Appointments tab) - Explicit Staff Delete Only
 */
export async function syncDeleteAppointmentToGoogleSheets(
  webhookUrl: string | undefined,
  appointmentId: string,
  patientId?: string,
  hn?: string,
  date?: string
) {
  const targetUrl = webhookUrl || getWebhookUrl() || API_URL;
  if (!targetUrl || !appointmentId) return;

  try {
    const payloadData = {
      action: 'DELETE_APPOINTMENT',
      altAction: 'deleteAppointment',
      actionName: 'ลบรายการนัดหมาย (Delete Appointment)',
      timestamp: new Date().toISOString(),
      appointmentId: appointmentId,
      id: appointmentId,
      patientId: patientId || '',
      hn: hn || '',
      date: date || '',
      payload: { 
        appointmentId, 
        id: appointmentId, 
        patientId: patientId || '', 
        hn: hn || '', 
        date: date || '' 
      }
    };

    let response: any = null;
    try {
      response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payloadData),
      });
    } catch {
      response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payloadData),
        mode: 'no-cors'
      });
    }

    console.log('[googleAppsScriptService] Delete Appointment synced to Google Sheets:', appointmentId);
    return response;
  } catch (error) {
    console.error('[googleAppsScriptService] Failed to sync delete appointment to Google Sheets:', error);
  }
}

/**
 * 14. Delete Patient / Member from Google Sheets (Patients tab) - Explicit Staff Delete Only
 */
export async function syncDeletePatientToGoogleSheets(
  webhookUrl: string | undefined,
  patientId: string,
  hn?: string
) {
  const targetUrl = webhookUrl || getWebhookUrl();
  if (!targetUrl || (!patientId && !hn)) return;

  try {
    const payloadData = {
      action: 'DELETE_PATIENT',
      actionName: 'ลบข้อมูลผู้รับการดูแล (Delete Patient)',
      timestamp: new Date().toISOString(),
      patientId: patientId,
      id: patientId,
      hn: hn || patientId,
      payload: { 
        patientId, 
        id: patientId, 
        hn: hn || patientId 
      }
    };

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payloadData),
      mode: 'no-cors'
    });

    console.log('[googleAppsScriptService] Delete Patient synced to Google Sheets:', patientId, hn);
    return response;
  } catch (error) {
    console.error('[googleAppsScriptService] Failed to sync delete patient to Google Sheets:', error);
  }
}

/**
 * 15. Fetch Appointments from Google Sheets
 */
export async function fetchAppointmentsFromGoogleSheets(
  webhookUrl?: string,
  hn?: string
): Promise<any[] | null> {
  const targetUrl = webhookUrl || getWebhookUrl();
  if (!targetUrl) return null;

  const normalizedHn = hn ? hn.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() : '';

  try {
    const url = new URL(targetUrl);
    url.searchParams.append('action', 'getAppointments');
    if (normalizedHn) {
      url.searchParams.append('hn', normalizedHn);
    }
    url.searchParams.append('t', Date.now().toString());

    const res = await fetch(url.toString(), {
      method: 'GET'
    });

    if (res.ok) {
      const data = await res.json().catch(() => null);
      let appointmentsList: any[] = [];
      if (Array.isArray(data)) {
        appointmentsList = data;
      } else if (data && Array.isArray(data.appointments)) {
        appointmentsList = data.appointments;
      } else if (data && Array.isArray(data.data)) {
        appointmentsList = data.data;
      }

      if (appointmentsList.length > 0) {
        console.log(`[googleAppsScriptService] Fetched ${appointmentsList.length} fresh appointments from Google Sheets.`);
        return appointmentsList;
      }
    }
  } catch (err) {
    console.warn('[googleAppsScriptService] Fetch appointments warning:', err);
  }

  // Fallback: if hn query returned empty, try getting all appointments and filter locally
  if (normalizedHn) {
    try {
      const fallbackUrl = new URL(targetUrl);
      fallbackUrl.searchParams.append('action', 'getAppointments');
      fallbackUrl.searchParams.append('t', Date.now().toString());
      const resFallback = await fetch(fallbackUrl.toString());
      if (resFallback.ok) {
        const data = await resFallback.json().catch(() => null);
        const list = Array.isArray(data) ? data : (data?.appointments || data?.data || []);
        if (Array.isArray(list) && list.length > 0) {
          const matched = list.filter((item: any) => {
            const itemHn = (item.HN || item.hn || item.patientId || '').toString().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            return itemHn === normalizedHn || itemHn.includes(normalizedHn) || normalizedHn.includes(itemHn);
          });
          if (matched.length > 0) {
            return matched;
          }
        }
      }
    } catch (e) {
      console.warn('[googleAppsScriptService] Fetch all appointments fallback warning:', e);
    }
  }

  return null;
}

/**
 * 16. Fetch Clinic Config (Clinic Name & Doctor Name) from Google Sheets
 */
export async function fetchClinicConfigFromGoogleSheets(
  webhookUrl?: string
): Promise<{ clinicName?: string; doctorName?: string; [key: string]: any } | null> {
  const targetUrl = webhookUrl || getWebhookUrl();
  if (!targetUrl) return null;

  try {
    const url = new URL(targetUrl);
    url.searchParams.append('action', 'GET_CLINIC_CONFIG');
    url.searchParams.append('t', Date.now().toString());

    const res = await fetch(url.toString(), {
      method: 'GET'
    });

    if (!res.ok) throw new Error('Failed response from Google Sheets for clinic config');
    const data = await res.json();

    if (data && (data.clinicName || data.doctorName || data.data)) {
      const cfg = data.data || data;
      console.log('[googleAppsScriptService] Fetched clinic config from Google Sheets:', cfg);
      return cfg;
    }
  } catch (err) {
    console.warn('[googleAppsScriptService] Fetch clinic config warning:', err);
  }
  return null;
}

/**
 * 17. Save Clinic Config (Clinic Name & Doctor Name) to Google Sheets
 */
export async function saveClinicConfigToGoogleSheets(
  webhookUrl: string | undefined,
  configData: {
    clinicName?: string;
    doctorName?: string;
    clinicNameEn?: string;
    phone?: string;
    address?: string;
    email?: string;
    doctorTitlePosition?: string;
    doctorLicenseNo?: string;
    doctorSpecialty?: string;
    [key: string]: any;
  }
) {
  const targetUrl = webhookUrl || getWebhookUrl();
  if (!targetUrl) return;

  try {
    const payloadData = {
      action: 'SAVE_CLINIC_CONFIG',
      actionName: 'บันทึกตั้งค่าคลินิก (Save Clinic Config)',
      timestamp: new Date().toISOString(),
      clinicName: configData.clinicName || 'คลินิกทันตกรรมภาสุข (Growth Lab)',
      doctorName: configData.doctorName || 'ทันตแพทย์หญิง นภาพร วรรณษา',
      payload: configData
    };

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payloadData),
      mode: 'no-cors'
    });

    console.log('[googleAppsScriptService] Clinic config saved to Google Sheets:', configData.clinicName, configData.doctorName);
    return response;
  } catch (error) {
    console.error('[googleAppsScriptService] Failed to save clinic config to Google Sheets:', error);
  }
}

/**
 * 18. Sync Session / Clinic Log to Google Sheets (Logs tab)
 */
export async function syncSessionLogToGoogleSheets(
  webhookUrl: string | undefined,
  logData: any
) {
  const targetUrl = webhookUrl || getWebhookUrl();
  if (!targetUrl || !logData) return;

  try {
    const payloadData = {
      action: 'SAVE_LOG',
      sheetName: 'Logs',
      actionName: 'บันทึกประวัติการใช้งาน (Save Log)',
      timestamp: logData.timestamp || new Date().toISOString(),
      id: logData.id,
      patientId: logData.patientId || '',
      patientName: logData.patientName || '',
      hn: logData.hn || logData.patientId || '',
      type: logData.type || 'SESSION',
      actionType: logData.action || logData.actionType || 'CHECK_IN',
      details: logData.details || '',
      payload: logData
    };

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payloadData),
      mode: 'no-cors'
    });

    console.log('[googleAppsScriptService] Session log saved to Google Sheets:', logData.id);
    return response;
  } catch (error) {
    console.error('[googleAppsScriptService] Failed to save session log to Google Sheets:', error);
  }
}

/**
 * 19. Fetch Session Logs from Google Sheets
 */
export async function fetchSessionLogsFromGoogleSheets(
  webhookUrl?: string
): Promise<any[] | null> {
  const targetUrl = webhookUrl || getWebhookUrl();
  if (!targetUrl) return null;

  try {
    const url = new URL(targetUrl);
    url.searchParams.append('action', 'GET_LOGS');
    url.searchParams.append('t', Date.now().toString());

    const res = await fetch(url.toString(), {
      method: 'GET'
    });

    if (!res.ok) throw new Error('Failed response from Google Sheets for logs');
    const data = await res.json();

    let logsList: any[] = [];
    if (Array.isArray(data)) {
      logsList = data;
    } else if (data && Array.isArray(data.logs)) {
      logsList = data.logs;
    } else if (data && Array.isArray(data.data)) {
      logsList = data.data;
    }

    if (logsList.length > 0) {
      console.log(`[googleAppsScriptService] Fetched ${logsList.length} logs from Google Sheets.`);
      return logsList;
    }
  } catch (err) {
    console.warn('[googleAppsScriptService] Fetch logs warning:', err);
  }
  return null;
}

// Re-export cloud API methods for unified access
export {
  cloudApi,
  getPatient,
  getInitialData,
  getPatients,
  savePatient,
  logDaily,
  saveExercise,
  saveAppointment,
  verifyStaff,
  flushOfflineQueue
} from './cloudApi';

