import { Appointment, Patient } from '../types';

export const PATIENT_TREATING_DENTIST = 'ทพญ. นภาพร วรรณษา';

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
  const now = referenceDate ? new Date(referenceDate) : new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const todayDate = now.getDate();

  const pId = patient?.id || 'PAT-001';
  const pHn = patient?.hn || 'HN-001';
  const pName = patient
    ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || patient.nickname || 'ผู้รับการดูแล'
    : 'ผู้รับการดูแล';

  // 1. Upcoming Primary OMT & EF Trainer Checkup in Current Month
  // Choose a day that is in the current month: if today <= 16, day 18; else if today <= 24, day 26; else day 28 (or today + 3)
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  let primaryDay = todayDate + 4;
  if (primaryDay > daysInCurrentMonth) {
    primaryDay = Math.min(26, daysInCurrentMonth);
  }
  // If primaryDay <= todayDate, choose next available day or day 25
  if (primaryDay <= todayDate && todayDate < daysInCurrentMonth) {
    primaryDay = Math.min(todayDate + 2, daysInCurrentMonth);
  }

  const primaryDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(primaryDay).padStart(2, '0')}`;

  // 2. Secondary Airway & Tongue Posture Checkup in Current Month (earlier or later)
  let secondaryDay = Math.min(primaryDay + 10, daysInCurrentMonth);
  if (secondaryDay === primaryDay) {
    secondaryDay = Math.max(1, primaryDay - 8);
  }
  const secondaryDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(secondaryDay).padStart(2, '0')}`;

  // 3. Completed Recent Checkup in Current Month (earlier in the month, e.g. day 4 or 6)
  const completedDay = Math.max(1, Math.min(6, todayDate > 6 ? 4 : 2));
  const completedDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(completedDay).padStart(2, '0')}`;

  // 4. Next Month Follow-up Checkup (for seamless navigation when clicking next month)
  const nextMonthDate = new Date(year, month + 1, 14);
  const nextMonthDateStr = formatYmd(nextMonthDate);

  // 5. Previous Month Checkup (for viewing history)
  const prevMonthDate = new Date(year, month - 1, 20);
  const prevMonthDateStr = formatYmd(prevMonthDate);

  const mockList: Appointment[] = [
    {
      id: `appt_${pId}_primary_${primaryDateStr}`,
      patientId: pId,
      patientName: pName,
      hn: pHn,
      date: primaryDateStr,
      time: '10:30',
      type: 'ตรวจติดตาม OMT & ประเมิน EF Trainer',
      dentistName: PATIENT_TREATING_DENTIST,
      status: 'pending',
      notes: 'ตรวจเช็กความก้าวหน้ากล้ามเนื้อปากและลิ้น + รบกวนนำอุปกรณ์ EF Trainer มาด้วยค่ะ'
    },
    {
      id: `appt_${pId}_secondary_${secondaryDateStr}`,
      patientId: pId,
      patientName: pName,
      hn: pHn,
      date: secondaryDateStr,
      time: '14:00',
      type: 'ประเมินการฝึกหายใจทางจมูก & ท่าทางการกลืน',
      dentistName: PATIENT_TREATING_DENTIST,
      status: 'pending',
      notes: 'ตรวจเช็กการกลืนที่ถูกต้องและการวางตำแหน่งลิ้นขณะพัก (Resting Tongue Posture)'
    },
    {
      id: `appt_${pId}_completed_${completedDateStr}`,
      patientId: pId,
      patientName: pName,
      hn: pHn,
      date: completedDateStr,
      time: '11:00',
      type: 'บันทึกภาพถ่าย Before/After & ตรวจสแกนช่องปาก',
      dentistName: PATIENT_TREATING_DENTIST,
      status: 'completed',
      notes: 'คนไข้มาตรวจตามนัด การหายใจทางจมูกและการสบฟันดีขึ้นมาก ให้ฝึกท่าบริหาร OMT ต่อเนื่องทุกวัน'
    },
    {
      id: `appt_${pId}_next_${nextMonthDateStr}`,
      patientId: pId,
      patientName: pName,
      hn: pHn,
      date: nextMonthDateStr,
      time: '10:00',
      type: 'ตรวจวัดมิติขากรรไกรและ Growth Lab Composite Score',
      dentistName: PATIENT_TREATING_DENTIST,
      status: 'pending',
      notes: 'นัดหมายตรวจวัดการขยายตัวของขากรรไกรและบันทึกภาพพัฒนาการรายเดือน'
    },
    {
      id: `appt_${pId}_prev_${prevMonthDateStr}`,
      patientId: pId,
      patientName: pName,
      hn: pHn,
      date: prevMonthDateStr,
      time: '13:30',
      type: 'ตรวจประเมินเริ่มต้น & ออกแบบโปรแกรม OMT',
      dentistName: PATIENT_TREATING_DENTIST,
      status: 'completed',
      notes: 'เริ่มโปรแกรมการฝึกกล้ามเนื้อปากใบหน้า 4 เสาหลักเรียบร้อย'
    }
  ];

  return mockList;
};

/**
 * Resolves patient appointments with zero dependency on Google Sheets raw availability:
 * 1. Looks up locally saved appointments (including user-confirmed/rescheduled updates)
 * 2. Matches rawAppointments from props/backend (if available)
 * 3. Checks patient.appointments record
 * 4. If none found, generates authentic stable mock appointments for this patient
 *    and immediately persists them so updates survive reloads.
 */
export const resolvePatientAppointments = (
  patient?: Patient,
  rawAppointments: Appointment[] = [],
  referenceDate?: Date
): Appointment[] => {
  if (!patient) {
    return rawAppointments.length > 0
      ? rawAppointments
      : getStableMockAppointmentsForPatient(undefined, referenceDate);
  }

  const pHn = (patient.hn || '').trim().toLowerCase();
  const pId = (patient.id || '').trim().toLowerCase();

  // 1. Gather all local appointments from localStorage if available
  let localAppointments: Appointment[] = [];
  try {
    const rawLocal = localStorage.getItem('growth_lab_appointments');
    if (rawLocal) {
      const parsed = JSON.parse(rawLocal);
      if (Array.isArray(parsed)) {
        localAppointments = parsed;
      }
    }
  } catch (e) {
    console.warn('[appointmentMockService] Local read error:', e);
  }

  // 2. Filter matches from rawAppointments and localAppointments
  const allCandidatePool = [...localAppointments, ...rawAppointments];
  const matchedFromPool = allCandidatePool.filter(a => {
    if (a.status === 'cancelled') return false;
    const aHn = ((a as any).hn || (a as any).HN || '').trim().toLowerCase();
    const aPatId = (a.patientId || '').trim().toLowerCase();
    const matchHn = pHn && (aHn === pHn || aPatId === pHn);
    const matchId = pId && (aPatId === pId || aHn === pId);
    return matchHn || matchId;
  });

  // 3. Include any appointments attached to patient object
  const fromPatientRecord: Appointment[] = (patient.appointments || []).map((pa: any, idx: number) => ({
    id: pa.id || `pa_${patient.id}_${idx}`,
    patientId: patient.id,
    patientName: `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || patient.nickname || 'ผู้รับการดูแล',
    hn: patient.hn || 'HN-001',
    date: pa.date,
    time: pa.time || '10:00',
    type: pa.type || 'clinical',
    notes: pa.notes || pa.title || '',
    status: pa.status || 'pending',
    dentistName: PATIENT_TREATING_DENTIST
  }));

  const combined = [...matchedFromPool, ...fromPatientRecord];

  // De-duplicate by ID or (date + time)
  const map = new Map<string, Appointment>();
  for (const item of combined) {
    const key = item.id || `${item.date}_${item.time}`;
    if (!map.has(key)) {
      map.set(key, {
        ...item,
        dentistName: PATIENT_TREATING_DENTIST
      });
    }
  }

  const uniqueList = Array.from(map.values())
    .filter(a => a.status !== 'cancelled')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 4. If we have appointments, return them!
  if (uniqueList.length > 0) {
    return uniqueList.map(a => ({
      ...a,
      dentistName: PATIENT_TREATING_DENTIST
    }));
  }

  // 5. Fallback: Generate stable mock appointments immediately
  const stableMock = getStableMockAppointmentsForPatient(patient, referenceDate);

  // Persist stable appointments to localStorage so that user updates are remembered
  try {
    const updatedGlobal = [...localAppointments, ...stableMock];
    // Deduplicate
    const globalDedup = Array.from(new Map(updatedGlobal.map(a => [a.id, a])).values());
    localStorage.setItem('growth_lab_appointments', JSON.stringify(globalDedup));
  } catch (e) {
    console.warn('[appointmentMockService] Local write fallback error:', e);
  }

  return stableMock;
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
