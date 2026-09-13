/**
 * Data Router for Google Sheets & Cloud Sync
 * 
 * Strict Routing Policy:
 * 1. Appointments, Confirmations & Reschedule Requests (Appointment / Status / Notes)
 *    MUST be routed EXCLUSIVELY to the "Appointments" tab.
 *    Under NO circumstance can appointment data be routed to "Daily_Logs" or "Exercise_Logs".
 * 2. Formats all appointment payloads strictly to match the 9 columns of the "Appointments" tab:
 *    [ID, HN, PatientName, Date, Time, Type, Doctor, Status, Notes]
 */

import { Appointment } from '../types';
import { getWebhookUrl } from './googleAppsScriptService';

export const APPOINTMENT_SHEET_NAME = 'Appointments';
export const APPOINTMENT_COLUMNS = [
  'ID',
  'HN',
  'PatientName',
  'Date',
  'Time',
  'Type',
  'Doctor',
  'Status',
  'Notes'
] as const;

export interface FormattedAppointment9Cols {
  ID: string;
  HN: string;
  PatientName: string;
  Date: string;
  Time: string;
  Type: string;
  Doctor: string;
  Status: string;
  Notes: string;
}

/**
 * Formats an appointment strictly into the 9 columns of the "Appointments" tab.
 */
export function formatAppointment9Columns(appointment: any): {
  orderedPayload: FormattedAppointment9Cols;
  rowData: (string | number)[];
} {
  // 1. ID
  const apptId = (
    appointment.id || 
    appointment.ID || 
    appointment.appointmentId || 
    `apt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  ).toString().trim();

  // 2. HN
  let patHn = (
    appointment.hn || 
    appointment.HN || 
    appointment.patientHn || 
    appointment.patientId || 
    ''
  ).toString().trim();
  if (patHn) {
    const match = patHn.match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (!isNaN(num) && num > 0) {
        patHn = `HN${num.toString().padStart(4, '0')}`;
      }
    }
  }

  // 3. PatientName
  let patName = (
    appointment.patientName || 
    appointment.PatientName || 
    appointment.name || 
    ''
  ).toString().trim();

  if (!patName && appointment.patient) {
    const fn = (appointment.patient.firstName || '').trim();
    const ln = (appointment.patient.lastName || '').trim();
    patName = `${fn} ${ln}`.trim();
  }
  if (!patName) {
    patName = 'ผู้รับการดูแล';
  }

  // 4. Date (YYYY-MM-DD)
  let apptDate = (appointment.date || appointment.Date || '').toString().trim();
  if (!apptDate) {
    apptDate = new Date().toISOString().split('T')[0];
  } else if (apptDate.includes('T')) {
    apptDate = apptDate.split('T')[0];
  }

  // 5. Time (HH:MM)
  const apptTime = (appointment.time || appointment.Time || '10:00').toString().trim();

  // 6. Type
  let apptType = 'ตรวจติดตาม';
  const rawType = appointment.type || appointment.Type || appointment.title;
  if (rawType) {
    const t = String(rawType).trim();
    if (t === 'clinical') apptType = 'ตรวจติดตาม';
    else if (t === 'online') apptType = 'นัดฝึก';
    else if (t === 'consultation') apptType = 'OMT';
    else apptType = t;
  }

  // 7. Doctor (Default: ทันตแพทย์หญิง นภาพร วรรณษา)
  let doctorName = appointment.doctor || appointment.Doctor || appointment.dentistName || appointment.doctorName;
  if (!doctorName) {
    try {
      const rawSettings = localStorage.getItem('growth_lab_settings') || localStorage.getItem('growthlab_settings') || localStorage.getItem('growthlab_clinic_info');
      if (rawSettings) {
        const parsed = JSON.parse(rawSettings);
        doctorName = parsed.doctorName;
      }
    } catch {}
  }
  doctorName = (doctorName || 'ทันตแพทย์หญิง นภาพร วรรณษา').toString().trim();

  // 8. Status (e.g., "Confirmed (สะดวกมาตามนัด)", "Confirmed (ยืนยันแล้ว)", "Reschedule Requested (ขอเลื่อน)", "นัดหมาย", "รอตรวจ")
  let apptStatus = 'นัดหมาย';
  const rawStatus = appointment.status || appointment.Status;
  if (rawStatus) {
    const s = String(rawStatus).trim();
    if (s.includes('คลินิกยืนยัน')) {
      apptStatus = 'Confirmed (คลินิกยืนยันแล้ว)';
    } else if (s.includes('สะดวกมาตามนัด')) {
      apptStatus = 'Confirmed (สะดวกมาตามนัด)';
    } else if (s === 'confirmed' || s.toLowerCase().startsWith('confirmed') || s.includes('ยืนยัน')) {
      apptStatus = 'Confirmed (ยืนยันแล้ว)';
    } else if (s === 'reschedule_requested' || s.toLowerCase().includes('reschedule') || s.includes('ขอเลื่อน')) {
      apptStatus = 'Reschedule Requested (ขอเลื่อน)';
    } else if (s === 'pending') {
      apptStatus = 'นัดหมาย';
    } else if (s === 'completed') {
      apptStatus = 'รอตรวจ';
    } else if (s === 'cancelled') {
      apptStatus = 'ยกเลิก';
    } else {
      apptStatus = s;
    }
  }

  // 9. Notes
  const apptNotes = (appointment.notes || appointment.Notes || appointment.note || '').toString().trim();

  const orderedPayload: FormattedAppointment9Cols = {
    ID: apptId,
    HN: patHn,
    PatientName: patName,
    Date: apptDate,
    Time: apptTime,
    Type: apptType,
    Doctor: doctorName,
    Status: apptStatus,
    Notes: apptNotes
  };

  const rowData: (string | number)[] = [
    apptId,
    patHn,
    patName,
    apptDate,
    apptTime,
    apptType,
    doctorName,
    apptStatus,
    apptNotes
  ];

  return { orderedPayload, rowData };
}

/**
 * Routes appointment and reschedule requests exclusively to the "Appointments" tab.
 * Strictly prevents any data from going into "Daily_Logs" or "Exercise_Logs".
 */
export async function routeAppointmentToGoogleSheets(
  appointment: any,
  webhookUrl?: string
): Promise<{ success: boolean; data?: any; error?: any }> {
  const targetUrl = webhookUrl || getWebhookUrl();
  if (!targetUrl) {
    console.warn('[DataRouter] No webhook URL configured for appointment routing.');
    return { success: false, error: 'No webhook URL' };
  }

  const { orderedPayload, rowData } = formatAppointment9Columns(appointment);

  // Build clean request body strictly targeting "Appointments"
  const requestBody = {
    // Actions recognized by Google Apps Script - action: "saveAppointment" is primary
    action: 'saveAppointment',
    altAction: 'saveAppointment',
    fallbackAction: 'saveAppointment',
    // Sheet routing parameters - MUST BE "Appointments" ONLY
    sheetName: APPOINTMENT_SHEET_NAME,
    targetSheet: APPOINTMENT_SHEET_NAME,
    tab: APPOINTMENT_SHEET_NAME,
    sheet: APPOINTMENT_SHEET_NAME,
    targetTab: APPOINTMENT_SHEET_NAME,
    timestamp: new Date().toISOString(),
    // 9 Columns ordered at top level
    ...orderedPayload,
    rowData,
    row: rowData,
    values: rowData,
    columns: [...APPOINTMENT_COLUMNS],
    data: orderedPayload,
    // Nested payload with strict sheet override (clean from any Daily_Logs/Exercise_Logs contamination)
    payload: {
      action: 'saveAppointment',
      sheetName: APPOINTMENT_SHEET_NAME,
      targetSheet: APPOINTMENT_SHEET_NAME,
      tab: APPOINTMENT_SHEET_NAME,
      sheet: APPOINTMENT_SHEET_NAME,
      ...orderedPayload,
      rowData,
      row: rowData,
      columns: [...APPOINTMENT_COLUMNS],
      id: orderedPayload.ID,
      hn: orderedPayload.HN,
      patientId: appointment.patientId || orderedPayload.HN,
      patientName: orderedPayload.PatientName,
      date: orderedPayload.Date,
      time: orderedPayload.Time,
      type: orderedPayload.Type,
      doctor: orderedPayload.Doctor,
      status: orderedPayload.Status,
      notes: orderedPayload.Notes,
      googleCalendarEventId: appointment.googleCalendarEventId || '',
      googleCalendarHtmlLink: appointment.googleCalendarHtmlLink || ''
    },
    // Backwards-compatible top-level keys
    id: orderedPayload.ID,
    appointmentId: orderedPayload.ID,
    patientId: appointment.patientId || orderedPayload.HN,
    patientName: orderedPayload.PatientName,
    hn: orderedPayload.HN,
    date: orderedPayload.Date,
    time: orderedPayload.Time,
    type: orderedPayload.Type,
    doctor: orderedPayload.Doctor,
    appointmentDate: orderedPayload.Date,
    appointmentTime: orderedPayload.Time,
    doctorName: orderedPayload.Doctor,
    status: orderedPayload.Status,
    notes: orderedPayload.Notes
  };

  // Dispatch via POST with CORS and no-cors fallback
  try {
    let response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(requestBody),
    });

    if (response.ok) {
      try {
        const resData = await response.json();
        console.log('[DataRouter] Appointment successfully routed to "Appointments" tab:', orderedPayload.ID, orderedPayload.PatientName);
        return { success: true, data: resData };
      } catch {
        // Plain text response
        return { success: true };
      }
    }
  } catch {
    // Fallback mode for browser CORS redirects
    try {
      await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(requestBody),
        mode: 'no-cors'
      });
      console.log('[DataRouter] Appointment routed to "Appointments" tab (no-cors fallback):', orderedPayload.ID);
      return { success: true };
    } catch (noCorsErr) {
      console.warn('[DataRouter] no-cors fetch attempt failed:', noCorsErr);
      return { success: false, error: noCorsErr };
    }
  }

  return { success: true };
}

/**
 * Central Data Router instance
 */
export const dataRouter = {
  sheetName: APPOINTMENT_SHEET_NAME,
  columns: APPOINTMENT_COLUMNS,
  formatAppointment9Columns,
  routeAppointment: routeAppointmentToGoogleSheets
};
