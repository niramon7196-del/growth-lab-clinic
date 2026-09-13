import { Appointment, Patient } from '../types';
import { formatAppointmentTime } from './checkInCalculations';

export const PATIENT_TREATING_DENTIST = 'ทันตแพทย์หญิง นภาพร วรรณษา';

/**
 * Format Date object to YYYY-MM-DD in local time
 */
export const formatYmd = (d: Date): string => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Generates clinically realistic, stable mock appointments for a Growth Lab patient.
 * Anchored around the reference date (defaulting to current date) so that appointments
 * always appear in the current month, next month, and recent history.
 */
export const getStableMockAppointmentsForPatient = (
  patient?: Patient,
  referenceDate?: Date
): Appointment[] => {
  // Stop generating hardcoded mock appointments
  return [];
};

/**
 * Resolves patient appointments from live rawAppointments and local state:
 * Matches live appointments by matching hn or patientId.
 */
export const resolvePatientAppointments = (
  patient?: Patient,
  rawAppointments: Appointment[] = [],
  referenceDate?: Date
): Appointment[] => {
  const isMockId = (id?: string) => {
    if (!id) return false;
    return id.startsWith('appt_seed_') || id.startsWith('apt-') || id.startsWith('mock_') || id.startsWith('sample_');
  };

  if (!patient) {
    return (rawAppointments || [])
      .filter(a => a && a.status !== 'cancelled' && !isMockId(a.id))
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  }

  const pHn = (patient.hn || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const pId = (patient.id || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  // Strictly match from rawAppointments passed from Google Sheets / central appointments state
  const matchedFromPool = (rawAppointments || []).filter(a => {
    if (!a || a.status === 'cancelled' || isMockId(a.id)) return false;
    const aHn = ((a as any).hn || (a as any).HN || (a as any).patientHn || '').toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const aPatId = (a.patientId || '').toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    const matchHn = Boolean(pHn && (aHn === pHn || aPatId === pHn));
    const matchId = Boolean(pId && (aPatId === pId || aHn === pId));
    return matchHn || matchId;
  });

  // Include any real appointments attached to patient object (excluding mocks)
  const fromPatientRecord: Appointment[] = (patient.appointments || [])
    .filter((pa: any) => pa && pa.status !== 'cancelled' && !isMockId(pa.id))
    .map((pa: any, idx: number) => ({
      id: pa.id || `pa_${patient.id}_${idx}`,
      patientId: patient.id,
      patientName: `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || patient.nickname || 'ผู้รับการดูแล',
      hn: patient.hn || '',
      date: pa.date,
      time: formatAppointmentTime(pa.time || '10:30'),
      type: pa.type || 'clinical',
      notes: pa.notes || pa.title || '',
      status: pa.status || 'pending',
      dentistName: (pa.dentistName && pa.dentistName.includes('นภาพร')) ? PATIENT_TREATING_DENTIST : (pa.dentistName || PATIENT_TREATING_DENTIST)
    }));

  const combined = [...matchedFromPool, ...fromPatientRecord];

  // De-duplicate by ID or composite key
  const map = new Map<string, Appointment>();
  for (const item of combined) {
    const key = item.id || `${item.hn || item.patientId}_${item.date}_${item.time}`;
    if (!map.has(key)) {
      const normalizedDoc = (item.dentistName && item.dentistName.includes('นภาพร'))
        ? PATIENT_TREATING_DENTIST
        : (item.dentistName || PATIENT_TREATING_DENTIST);
      map.set(key, {
        ...item,
        time: formatAppointmentTime(item.time || '10:30'),
        dentistName: normalizedDoc
      });
    }
  }

  return Array.from(map.values())
    .filter(a => a.status !== 'cancelled' && !isMockId(a.id))
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
};

/**
 * Saves or updates an appointment in localStorage
 */
export const persistAppointmentLocally = (updatedAppt: Appointment): void => {
  try {
    const rawLocal = localStorage.getItem('growth_lab_appointments');
    let list: Appointment[] = [];
    if (rawLocal) {
      const parsed = JSON.parse(rawLocal);
      if (Array.isArray(parsed)) list = parsed;
    }
    const exists = list.some(a => a.id === updatedAppt.id);
    let updated: Appointment[];
    if (exists) {
      updated = list.map(a => (a.id === updatedAppt.id ? updatedAppt : a));
    } else {
      updated = [updatedAppt, ...list];
    }
    localStorage.setItem('growth_lab_appointments', JSON.stringify(updated));
  } catch (e) {
    console.warn('[appointmentMockService] Persist locally failed:', e);
  }
};
