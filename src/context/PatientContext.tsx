import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Patient, 
  PatientProfileInfo,
  SubmissionLog, 
  PatientAppointmentRecord, 
  Appointment, 
  SessionLog, 
  SystemNotification, 
  ClinicSettings, 
  HomeworkAssignment, 
  CheckInRecord,
  DailyUsageTracker
} from '../types';
import { DEFAULT_SETTINGS } from '../data';
import { dataAdapter, cleanPhoneString, cleanNameString, clearAllPatientLocalStorage } from '../services/dataAdapter';
import { cascadeDeletePatientAndRevokeQR } from '../services/qrRevokeService';
import { isFirebaseConfigured, subscribePatientByHN } from '../services/firebase';
import { authService } from '../services/authService';
import { getTodayDateString, syncPatientProgress } from '../utils/checkInCalculations';
import { getParamCaseInsensitive } from '../utils/patientUtils';
import { syncDailyCheckInToGoogleSheets, getWebhookUrl } from '../services/googleAppsScriptService';

export interface PatientContextStats {
  totalPatients: number;
  activePatients: number;
  totalCheckInsToday: number;
  todayCheckInRate: number;
  completedExercisesToday: number;
  activeSubmissionsCount: number;
}

export interface PatientContextType {
  // Core Entities
  patients: Patient[];
  currentPatient: Patient | null;
  selectedPatientId: string | undefined;
  appointments: Appointment[];
  logs: SessionLog[];
  notifications: SystemNotification[];
  settings: ClinicSettings;
  isLoading: boolean;
  stats: PatientContextStats;

  // Patient Selection & Querying
  setSelectedPatientId: (id: string | undefined, persist?: boolean) => void;
  getPatientById: (id: string) => Patient | undefined;
  getPatientByHn: (hn: string) => Patient | undefined;
  setCurrentPatientByHn: (hn: string) => Patient | null;

  // Patient Management (CRUD)
  addPatient: (patientData: Partial<Patient>) => Promise<Patient>;
  updatePatient: (patientId: string, updates: Partial<Patient>) => Promise<Patient | undefined>;
  deletePatient: (patientId: string) => Promise<boolean>;

  // Clinic Prescriptions & Assignments (Single Source of Truth)
  assignOMT: (patientId: string, omtTaskIds: string[]) => void;
  assignExercises: (patientId: string, exerciseIds: string[]) => void;
  assignSleepEF: (patientId: string, sleepEFConfig: Record<string, any>) => void;
  assignGNS: (patientId: string, gnsConfig: Record<string, any>) => void;
  updatePatientAssignments: (patientId: string, assignments: HomeworkAssignment[]) => void;
  toggleAssignmentComplete: (patientId: string, assignmentId: string) => void;

  // Submissions & Check-ins
  submitTaskLog: (patientId: string, submission: SubmissionLog) => void;
  checkInPatient: (
    patientId: string, 
    source?: 'APP' | 'QR', 
    performedBy?: string, 
    method?: 'participant_self_check_in' | 'staff_recorded_check_in' | string
  ) => CheckInRecord;
  trackAppUsage: (patientId: string, type: 'open' | 'exercise') => void;

  // Appointments
  addAppointment: (appointment: Omit<Appointment, 'id'> | PatientAppointmentRecord, patientId?: string) => void;
  updateAppointment: (appointmentId: string, updates: Partial<Appointment>) => void;
  deleteAppointment: (appointmentId: string) => void;

  // Settings & Notifications
  updateSettings: (newSettings: Partial<ClinicSettings>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  clearAllDemoData: () => void;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function normalizePatientRecord(p: Partial<Patient>): Patient {
  const id = p.id || p.hn || `pat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const rawHn = p.hn || p.profile?.hn || '';
  const hn = rawHn.trim().toUpperCase();
  
  const nickname = (p.nickname || p.profile?.nickname || '').toString().trim();
  let rawFirstName = (p.firstName || (p as any).name || p.profile?.name || '').toString().trim();
  let lastName = (p.lastName || '').toString().trim();

  if (rawFirstName.includes(' ') && !lastName) {
    const nameParts = rawFirstName.split(/\s+/);
    rawFirstName = nameParts[0];
    lastName = nameParts.slice(1).join(' ');
  }

  let firstName = rawFirstName;
  if (!firstName || firstName === 'ไม่ระบุชื่อ' || firstName === 'ผู้รับการดูแล') {
    if (nickname) {
      firstName = hn ? `${nickname} (${hn})` : nickname;
    } else if (hn) {
      firstName = `ผู้ป่วย (${hn})`;
    } else {
      firstName = 'ผู้รับการดูแล';
    }
  }

  const age = Number(p.age || p.profile?.age || 0);
  const phone = cleanPhoneString(p.phone || p.profile?.phone || p.parentPhone);
  const citizenId = p.citizenId || p.profile?.idCard || '';
  const avatarUrl = p.avatarUrl || p.profile?.avatarUrl || '';
  const growthStage = p.growthStage || p.profile?.growthStage || 'Pre-pubertal';

  const profile: PatientProfileInfo = {
    hn,
    name: `${firstName} ${lastName}`.trim(),
    nickname: nickname || firstName,
    age,
    phone,
    idCard: citizenId,
    avatarUrl,
    growthStage
  };

  const assignedOMT = Array.isArray(p.assignedOMT) 
    ? p.assignedOMT 
    : (p.assignments ? p.assignments.filter(a => 
        a.exerciseId?.startsWith('breathing') || 
        a.exerciseId?.startsWith('lips') || 
        a.exerciseId?.startsWith('tongue') || 
        a.exerciseId?.startsWith('swallowing') || 
        a.exerciseId?.startsWith('cheek_jaw') || 
        a.exerciseId?.startsWith('posture') || 
        a.exerciseId?.startsWith('daily') || 
        a.exerciseId?.startsWith('EF-')
      ).map(a => a.exerciseId) : []);

  const assignedExercises = Array.isArray(p.assignedExercises) 
    ? p.assignedExercises 
    : (p.assignments ? p.assignments.filter(a => 
        a.exerciseId?.startsWith('EX_') || 
        a.exerciseId?.startsWith('movement') || 
        a.exerciseId?.startsWith('jump') || 
        a.exerciseId?.startsWith('strength') || 
        a.exerciseId?.startsWith('core')
      ).map(a => a.exerciseId) : []);

  const assignedSleepEF = p.assignedSleepEF || {};
  const assignedGNS = p.assignedGNS || {};
  const submissions: SubmissionLog[] = Array.isArray(p.submissions) ? p.submissions : [];
  const patientAppointments: PatientAppointmentRecord[] = Array.isArray(p.appointments) ? p.appointments : [];

  return {
    ...p,
    id,
    hn,
    qrToken: p.qrToken || `tok_${id}_${(hn || 'hn').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
    title: p.title || '',
    firstName,
    lastName,
    nickname,
    age,
    gender: p.gender || 'ชาย',
    dob: p.dob || '',
    citizenId,
    weight: Number(p.weight) || 0,
    height: Number(p.height) || 0,
    startDate: p.startDate || getTodayDateString(),
    createdDate: p.createdDate || new Date().toISOString(),
    phone,
    parentName: p.parentName || '',
    parentPhone: p.parentPhone || '',
    notes: p.notes || '',
    status: p.status || 'active',
    photoBefore: p.photoBefore || '',
    photoAfter: p.photoAfter || '',
    avatarUrl,
    growthStage,
    treatmentGoals: p.treatmentGoals || [],
    lockedDates: p.lockedDates || [],
    beforeAfterImages: p.beforeAfterImages || [],
    checkInHistory: p.checkInHistory || [],
    lastCheckIn: p.lastCheckIn,
    usageTracker: p.usageTracker || [],
    nutritionLogs: p.nutritionLogs || [],
    sleepLogs: p.sleepLogs || [],
    sleepMonthlyProfiles: p.sleepMonthlyProfiles || [],
    efRecordLogs: p.efRecordLogs || [],
    exerciseLogs: p.exerciseLogs || [],
    growthLogs: p.growthLogs || [],
    eatingBehavior: p.eatingBehavior,
    sleepScore: p.sleepScore,
    exerciseScore: p.exerciseScore,
    orofacialScore: p.orofacialScore,
    familyParticipationScore: p.familyParticipationScore,
    assignments: p.assignments || [],
    progress: p.progress,

    // Single Source of Truth sub-models
    profile,
    assignedOMT,
    assignedExercises,
    assignedSleepEF,
    assignedGNS,
    submissions,
    appointments: patientAppointments,
  };
}

export const PatientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 1. Central Patients State
  
  
  
  



  const [patients, setPatients] = useState<Patient[]>(() => {
    try {
      const local1 = localStorage.getItem('growth_lab_patients');
      const local2 = localStorage.getItem('growthlab_patients');
      const raw = local1 || local2;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Strictly reject mock placeholder entries and any invalid/placeholder data
          return parsed
            .filter((p: Patient) => {
              if (!p) return false;
              if (p.hn?.includes('DEMO-') || p.id?.toLowerCase().includes('demo')) return false;
              const hnStr = (p.hn || p.id || '').toString().trim();
              const nicknameStr = (p.nickname || '').toString().trim();
              const nameStr = (p.firstName || (p as any).name || '').toString().trim();
              const isInvalidHn = !hnStr || hnStr === 'HN-' || hnStr === 'HN-00000' || hnStr === '00000';
              return (!isInvalidHn) || Boolean(nameStr || nicknameStr || p.phone);
            })
            .map(normalizePatientRecord);
        }
      }
    } catch (e) {
      console.warn('[PatientContext] Error reading initial patients from localStorage:', e);
    }
    return [];
  });

  // 2. Active Selected Patient ID
  const [selectedPatientId, setSelectedPatientIdState] = useState<string | undefined>(() => {
    if (typeof window === 'undefined') return undefined;
    const urlHn = getParamCaseInsensitive(window.location.search, ['hn']) || 
                  getParamCaseInsensitive(window.location.hash, ['hn']);
    if (urlHn && !urlHn.includes('DEMO-')) {
      const saved = localStorage.getItem('growth_lab_patients');
      if (saved) {
        try {
          const list: Patient[] = JSON.parse(saved);
          const found = list.find(p => p.hn?.toLowerCase() === urlHn.trim().toLowerCase());
          if (found) return found.id;
        } catch { /* ignore */ }
      }
    }
    const user = authService.getCurrentUser();
    if (user && user.role === 'PATIENT' && user.patientId) {
      return user.patientId;
    }
    return sessionStorage.getItem('growth_lab_selected_patient_id') || 
           localStorage.getItem('growth_lab_selected_patient_id') || 
           undefined;
  });

  // 3. Appointments Store
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try {
      const local = localStorage.getItem('growth_lab_appointments');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('[PatientContext] Error reading appointments:', e);
    }
    return [];
  });

  // 4. Session Logs Store
  const [logs, setLogs] = useState<SessionLog[]>(() => {
    try {
      const local = localStorage.getItem('growth_lab_logs');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('[PatientContext] Error reading logs:', e);
    }
    return [];
  });

  // 5. System Notifications Store
  const [notifications, setNotifications] = useState<SystemNotification[]>(() => {
    try {
      const local = localStorage.getItem('growth_lab_notifications');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('[PatientContext] Error reading notifications:', e);
    }
    return [];
  });

  // 6. Clinic Settings Store
  const [settings, setSettings] = useState<ClinicSettings>(() => {
    try {
      const local = localStorage.getItem('clinic_profile_data') || localStorage.getItem('growthlab_clinic_info') || localStorage.getItem('growth_lab_settings');
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {
      console.warn('[PatientContext] Error reading settings:', e);
    }
    return DEFAULT_SETTINGS;
  });

  // Real-time listener for clinic profile updates
  useEffect(() => {
    const syncClinicSettings = () => {
      try {
        const stored = localStorage.getItem('clinic_profile_data') || 
                       localStorage.getItem('growthlab_clinic_info') || 
                       localStorage.getItem('growth_lab_settings');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object') {
            setSettings(parsed);
          }
        }
      } catch (e) {}
    };
    window.addEventListener('growthlab_clinic_info_updated', syncClinicSettings);
    window.addEventListener('clinic_profile_data_updated', syncClinicSettings);
    window.addEventListener('storage', syncClinicSettings);
    return () => {
      window.removeEventListener('growthlab_clinic_info_updated', syncClinicSettings);
      window.removeEventListener('clinic_profile_data_updated', syncClinicSettings);
      window.removeEventListener('storage', syncClinicSettings);
    };
  }, []);

  // Persist State Changes to LocalStorage
  useEffect(() => {
    localStorage.setItem('growth_lab_patients', JSON.stringify(patients));
    localStorage.setItem('growthlab_patients', JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem('growth_lab_appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('growth_lab_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('growth_lab_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('growthlab_clinic_info', JSON.stringify(settings));
    localStorage.setItem('growth_lab_settings', JSON.stringify(settings));
  }, [settings]);

  // Auto-fetch patients and appointments from dataAdapter (Google Sheets / Storage / Firestore) on mount
  useEffect(() => {
    setIsLoading(false);

    dataAdapter.listMembers().then(remote => {
      if (remote && remote.length > 0) {
        setPatients(remote.map(normalizePatientRecord));
      }
    }).catch(e => console.warn('[PatientContext] Remote members sync error:', e));

    dataAdapter.listAppointments().then(remote => {
      if (remote && remote.length > 0) setAppointments(remote);
    }).catch(e => console.warn('[PatientContext] Remote appointments sync error:', e));

    dataAdapter.listSessionLogs().then(remote => {
      if (remote && remote.length > 0) setLogs(remote);
    }).catch(e => console.warn('[PatientContext] Remote logs sync error:', e));

    dataAdapter.getClinicSettings().then(remote => {
      if (remote) setSettings(remote);
    }).catch(e => console.warn('[PatientContext] Remote settings sync error:', e));

    if (!isFirebaseConfigured) return;

    const unsubMembers = dataAdapter.subscribeMembers(remote => {
      if (remote) setPatients(remote.map(normalizePatientRecord));
    });

    const unsubApps = dataAdapter.subscribeAppointments(remote => {
      if (remote) setAppointments(remote);
    });

    const unsubLogs = dataAdapter.subscribeSessionLogs(remote => {
      if (remote) setLogs(remote);
    });

    return () => {
      if (unsubMembers) unsubMembers();
      if (unsubApps) unsubApps();
      if (unsubLogs) unsubLogs();
    };
  }, []);

  // Selection Handler
  const setSelectedPatientId = useCallback((id: string | undefined, persist: boolean = true) => {
    setSelectedPatientIdState(id);
    if (persist) {
      if (id) {
        sessionStorage.setItem('growth_lab_selected_patient_id', id);
        localStorage.setItem('growth_lab_selected_patient_id', id);
      } else {
        sessionStorage.removeItem('growth_lab_selected_patient_id');
        localStorage.removeItem('growth_lab_selected_patient_id');
      }
    }
  }, []);

  // Compute Current Patient Object
  const currentPatient = useMemo(() => {
    if (!selectedPatientId) {
      const user = authService.getCurrentUser();
      if (user && user.role === 'PATIENT' && (user.patientId || user.hn)) {
        return patients.find(p => p.id === user.patientId || p.hn === user.hn) || null;
      }
      return patients[0] || null;
    }
    return patients.find(p => p.id === selectedPatientId) || patients[0] || null;
  }, [patients, selectedPatientId]);

  // Query helpers
  const getPatientById = useCallback((id: string) => {
    return patients.find(p => p.id === id);
  }, [patients]);

  const getPatientByHn = useCallback((hn: string) => {
    if (!hn) return undefined;
    const clean = hn.trim().toUpperCase().replace(/^(HN-)/, '');
    return patients.find(p => {
      const pHn = (p.hn || '').trim().toUpperCase().replace(/^(HN-)/, '');
      return pHn === clean;
    });
  }, [patients]);

  const setCurrentPatientByHn = useCallback((hn: string) => {
    const found = getPatientByHn(hn);
    if (found) {
      setSelectedPatientId(found.id, true);
      return found;
    }
    return null;
  }, [getPatientByHn, setSelectedPatientId]);

  // Patient CRUD
  const addPatient = useCallback(async (patientData: Partial<Patient>): Promise<Patient> => {
    const normalized = normalizePatientRecord(patientData);
    setPatients(prev => [normalized, ...prev.filter(p => p.id !== normalized.id && p.hn !== normalized.hn)]);
    setSelectedPatientId(normalized.id, true);
    
    if (isFirebaseConfigured) {
      dataAdapter.createMember(normalized).catch(e => console.warn('[PatientContext] Firestore add member failed:', e));
    }
    return normalized;
  }, [setSelectedPatientId]);

  const updatePatient = useCallback(async (patientId: string, updates: Partial<Patient>): Promise<Patient | undefined> => {
    let updatedObj: Patient | undefined;
    setPatients(prev => {
      const next = prev.map(p => {
        if (p.id === patientId || p.hn === updates.hn) {
          const merged = normalizePatientRecord({ ...p, ...updates });
          updatedObj = merged;
          return merged;
        }
        return p;
      });
      return next;
    });

    if (updatedObj && isFirebaseConfigured) {
      dataAdapter.updateMember(patientId, updates).catch(e => console.warn('[PatientContext] Firestore update failed:', e));
    }
    return updatedObj;
  }, []);

  const deletePatient = useCallback(async (patientId: string): Promise<boolean> => {
    let targetHn: string | undefined;
    let targetQrToken: string | undefined;

    setPatients(prev => {
      const target = prev.find(p => p.id === patientId || p.hn === patientId);
      targetHn = target?.hn;
      targetQrToken = target?.qrToken;
      const updated = prev.filter(p => p.id !== patientId && (!targetHn || p.hn !== targetHn));

      // Cascade delete local cache, active sessions, and mark QR as revoked
      cascadeDeletePatientAndRevokeQR({ id: patientId, hn: targetHn, qrToken: targetQrToken });

      return updated;
    });

    if (selectedPatientId === patientId) {
      setSelectedPatientId(undefined);
    }

    dataAdapter.deleteMember(patientId, targetHn).catch(e => console.warn('[PatientContext] deleteMember failed:', e));
    return true;
  }, [selectedPatientId, setSelectedPatientId]);

  // Clinic Prescriptions & Assignments
  const assignOMT = useCallback((patientId: string, omtTaskIds: string[]) => {
    setPatients(prev => prev.map(p => {
      if (p.id !== patientId) return p;
      const existingOMT = p.assignedOMT || [];
      const mergedOMT = Array.from(new Set([...existingOMT, ...omtTaskIds]));
      
      const newAssignments: HomeworkAssignment[] = omtTaskIds.map(taskId => ({
        id: `asgn_omt_${Date.now()}_${taskId}`,
        patientId: p.id,
        exerciseId: taskId,
        reps: 10,
        durationMinutes: 5,
        startDate: getTodayDateString(),
        status: 'pending'
      }));

      const existingAsgn = p.assignments || [];
      const updatedAsgn = [
        ...existingAsgn.filter(a => !omtTaskIds.includes(a.exerciseId)),
        ...newAssignments
      ];

      return normalizePatientRecord({
        ...p,
        assignedOMT: mergedOMT,
        assignments: updatedAsgn
      });
    }));
  }, []);

  const assignExercises = useCallback((patientId: string, exerciseIds: string[]) => {
    setPatients(prev => prev.map(p => {
      if (p.id !== patientId) return p;
      const existingEx = p.assignedExercises || [];
      const mergedEx = Array.from(new Set([...existingEx, ...exerciseIds]));

      const newAssignments: HomeworkAssignment[] = exerciseIds.map(exId => ({
        id: `asgn_ex_${Date.now()}_${exId}`,
        patientId: p.id,
        exerciseId: exId,
        reps: 10,
        durationMinutes: 10,
        startDate: getTodayDateString(),
        status: 'pending'
      }));

      const existingAsgn = p.assignments || [];
      const updatedAsgn = [
        ...existingAsgn.filter(a => !exerciseIds.includes(a.exerciseId)),
        ...newAssignments
      ];

      return normalizePatientRecord({
        ...p,
        assignedExercises: mergedEx,
        assignments: updatedAsgn
      });
    }));
  }, []);

  const assignSleepEF = useCallback((patientId: string, sleepEFConfig: Record<string, any>) => {
    setPatients(prev => prev.map(p => {
      if (p.id !== patientId) return p;
      return normalizePatientRecord({
        ...p,
        assignedSleepEF: { ...(p.assignedSleepEF || {}), ...sleepEFConfig }
      });
    }));
  }, []);

  const assignGNS = useCallback((patientId: string, gnsConfig: Record<string, any>) => {
    setPatients(prev => prev.map(p => {
      if (p.id !== patientId) return p;
      return normalizePatientRecord({
        ...p,
        assignedGNS: { ...(p.assignedGNS || {}), ...gnsConfig }
      });
    }));
  }, []);

  const updatePatientAssignments = useCallback((patientId: string, assignments: HomeworkAssignment[]) => {
    setPatients(prev => prev.map(p => {
      if (p.id !== patientId) return p;
      const omt = assignments
        .filter(a => !a.exerciseId?.startsWith('EX_'))
        .map(a => a.exerciseId);
      const ex = assignments
        .filter(a => a.exerciseId?.startsWith('EX_'))
        .map(a => a.exerciseId);

      const updated = normalizePatientRecord({
        ...p,
        assignments,
        assignedOMT: omt,
        assignedExercises: ex
      });
      return syncPatientProgress(updated) as unknown as Patient;
    }));
  }, []);

  const toggleAssignmentComplete = useCallback((patientId: string, assignmentId: string) => {
    const todayStr = getTodayDateString();
    setPatients(prev => prev.map(p => {
      if (p.id !== patientId) return p;
      const asgns: HomeworkAssignment[] = (p.assignments || []).map(a => {
        if (a.id === assignmentId || a.exerciseId === assignmentId) {
          const nextStatus: HomeworkAssignment['status'] = a.status === 'completed' ? 'pending' : 'completed';
          return {
            ...a,
            status: nextStatus,
            lastSubmittedDate: nextStatus === 'completed' ? todayStr : a.lastSubmittedDate
          };
        }
        return a;
      });

      const updated = normalizePatientRecord({ ...p, assignments: asgns });
      return syncPatientProgress(updated) as unknown as Patient;
    }));
  }, []);

  // Submissions and Task Logs
  const submitTaskLog = useCallback((patientId: string, submission: SubmissionLog) => {
    const newLog: SubmissionLog = {
      id: submission.id || `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: submission.date || getTodayDateString(),
      timestamp: new Date().toISOString(),
      ...submission
    };

    setPatients(prev => prev.map(p => {
      if (p.id !== patientId) return p;
      const existingSubs = p.submissions || [];
      const updatedSubs = [newLog, ...existingSubs];
      
      const newSessionLog: SessionLog = {
        id: `sess_${Date.now()}`,
        patientId: p.id,
        date: newLog.date,
        exerciseId: newLog.taskId,
        repsCompleted: 10,
        score: newLog.score || 10,
        notes: newLog.notes
      };
      setLogs(l => [newSessionLog, ...l]);

      return normalizePatientRecord({
        ...p,
        submissions: updatedSubs
      });
    }));
  }, []);

  // Check-In
  const checkInPatient = useCallback((
    patientId: string, 
    source: 'APP' | 'QR' = 'APP', 
    performedBy?: string,
    method?: 'participant_self_check_in' | 'staff_recorded_check_in' | string
  ): CheckInRecord => {
    const todayStr = getTodayDateString();
    const nowTimestamp = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';

    // Send POST request to Google Apps Script Webhook
    const webhookUrl = getWebhookUrl();
    syncDailyCheckInToGoogleSheets(webhookUrl, {
      patientId: patientId,
      hn: patientId,
      action: 'เช็คอินประจำวัน (Daily Check-in)',
      actionName: 'เช็คอินประจำวัน (Daily Check-in)',
      score: 'สำเร็จ',
      status: 'completed'
    }).catch(e => console.warn('[PatientContext] Daily check-in webhook sync error:', e));

    const newRecord: CheckInRecord = {
      id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      patientId,
      date: todayStr,
      timestamp: nowTimestamp,
      source,
      method: method || 'participant_self_check_in',
      performedBy: performedBy || 'การดูแล',
      actor: performedBy || 'การดูแล',
      status: 'SUCCESS'
    };

    setPatients(prev => prev.map(p => {
      if (p.id !== patientId && p.hn !== patientId) return p;
      const history = p.checkInHistory || (p as any).checkIns || [];
      const filtered = history.filter((h: any) => h.date !== todayStr);
      const updatedHistory = [newRecord, ...filtered];

      const updated = normalizePatientRecord({
        ...p,
        status: 'active',
        lastCheckIn: todayStr,
        checkInHistory: updatedHistory
      });

      try {
        localStorage.setItem(`growth_lab_checkin_${p.id}`, todayStr);
      } catch (e) {
        console.warn('[PatientContext] LocalStorage error:', e);
      }

      return syncPatientProgress(updated) as unknown as Patient;
    }));

    dataAdapter.createCheckIn(newRecord).catch(e => console.warn('[PatientContext] Firestore check-in sync failed:', e));

    return newRecord;
  }, []);

  // App Usage Tracking
  const trackAppUsage = useCallback((patientId: string, type: 'open' | 'exercise') => {
    const todayStr = getTodayDateString();
    setPatients(prev => prev.map(p => {
      if (p.id !== patientId) return p;
      const usage = p.usageTracker || [];
      const todayTracker = usage.find(u => u.date === todayStr) || {
        date: todayStr,
        appOpens: 0,
        exerciseClicks: 0,
        lastActive: new Date().toISOString()
      };

      if (type === 'open') todayTracker.appOpens += 1;
      if (type === 'exercise') todayTracker.exerciseClicks += 1;
      todayTracker.lastActive = new Date().toISOString();

      const newUsage = [...usage.filter(u => u.date !== todayStr), todayTracker];
      return normalizePatientRecord({ ...p, usageTracker: newUsage });
    }));
  }, []);

  // Appointments Management
  const addAppointment = useCallback((appointment: Omit<Appointment, 'id'> | PatientAppointmentRecord, patientId?: string) => {
    const targetPatientId = patientId || ('patientId' in appointment ? appointment.patientId : selectedPatientId);
    const targetPatient = patients.find(p => p.id === targetPatientId);

    const newApp: Appointment = {
      id: `app_${Date.now()}`,
      patientId: targetPatientId || '',
      patientName: targetPatient ? `${targetPatient.firstName} ${targetPatient.lastName}` : (('patientName' in appointment) ? appointment.patientName : 'คนไข้'),
      date: appointment.date,
      time: appointment.time,
      type: ('type' in appointment) ? appointment.type : 'clinical',
      notes: appointment.notes,
      status: appointment.status || 'pending'
    };

    setAppointments(prev => {
      const updated = [newApp, ...prev];
      dataAdapter.saveAppointments(updated, newApp).catch(e => console.warn('[PatientContext] Appointment sync error:', e));
      return updated;
    });

    if (targetPatientId) {
      const patAppRecord: PatientAppointmentRecord = {
        id: newApp.id,
        date: appointment.date,
        time: appointment.time,
        title: ('title' in appointment) ? appointment.title : 'นัดหมายตรวจติดตาม OMT & EF',
        dentistName: ('dentistName' in appointment) ? appointment.dentistName : settings.doctorName,
        status: appointment.status || 'pending',
        notes: appointment.notes
      };

      setPatients(prev => prev.map(p => {
        if (p.id !== targetPatientId) return p;
        const patApps = p.appointments || [];
        return normalizePatientRecord({
          ...p,
          appointments: [patAppRecord, ...patApps]
        });
      }));
    }
  }, [patients, selectedPatientId, settings.doctorName]);

  const updateAppointment = useCallback((appointmentId: string, updates: Partial<Appointment>) => {
    setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, ...updates } : a));
    setPatients(prev => prev.map(p => {
      const patApps = p.appointments || [];
      if (!patApps.some(a => a.id === appointmentId)) return p;
      return normalizePatientRecord({
        ...p,
        appointments: patApps.map(a => a.id === appointmentId ? { ...a, ...updates } : a)
      });
    }));
  }, []);

  const deleteAppointment = useCallback((appointmentId: string) => {
    setAppointments(prev => prev.filter(a => a.id !== appointmentId));
    setPatients(prev => prev.map(p => {
      const patApps = p.appointments || [];
      if (!patApps.some(a => a.id === appointmentId)) return p;
      return normalizePatientRecord({
        ...p,
        appointments: patApps.filter(a => a.id !== appointmentId)
      });
    }));
  }, []);

  // Settings & Notifications
  const updateSettings = useCallback((newSettings: Partial<ClinicSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const clearAllDemoData = useCallback(() => {
    setPatients(prev => prev.filter(p => !p.hn?.includes('DEMO-') && !p.id?.includes('demo')));
    localStorage.removeItem('growth_lab_welcomed');
  }, []);

  // Computed Real-time Stats from Single Source of Truth
  const stats: PatientContextStats = useMemo(() => {
    const todayStr = getTodayDateString();
    const totalPatients = patients.length;
    const activePatients = patients.filter(p => p.status === 'active').length;
    
    let totalCheckInsToday = 0;
    let completedExercisesToday = 0;
    let activeSubmissionsCount = 0;

    patients.forEach(p => {
      if (p.lastCheckIn === todayStr || p.checkInHistory?.some(c => c.date === todayStr)) {
        totalCheckInsToday += 1;
      }
      (p.assignments || []).forEach(a => {
        if (a.status === 'completed' && a.lastSubmittedDate === todayStr) {
          completedExercisesToday += 1;
        }
      });
      activeSubmissionsCount += (p.submissions?.length || 0);
    });

    const todayCheckInRate = totalPatients > 0 
      ? Math.round((totalCheckInsToday / totalPatients) * 100) 
      : 0;

    return {
      totalPatients,
      activePatients,
      totalCheckInsToday,
      todayCheckInRate,
      completedExercisesToday,
      activeSubmissionsCount
    };
  }, [patients]);

  const value: PatientContextType = {
    patients,
    currentPatient,
    selectedPatientId,
    appointments,
    logs,
    notifications,
    settings,
    isLoading,
    stats,

    setSelectedPatientId,
    getPatientById,
    getPatientByHn,
    setCurrentPatientByHn,

    addPatient,
    updatePatient,
    deletePatient,

    assignOMT,
    assignExercises,
    assignSleepEF,
    assignGNS,
    updatePatientAssignments,
    toggleAssignmentComplete,

    submitTaskLog,
    checkInPatient,
    trackAppUsage,

    addAppointment,
    updateAppointment,
    deleteAppointment,

    updateSettings,
    markNotificationRead,
    clearNotifications,
    clearAllDemoData
  };

  return (
    <PatientContext.Provider value={value}>
      {children}
    </PatientContext.Provider>
  );
};

export const usePatientContext = (): PatientContextType => {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatientContext must be used within a PatientProvider');
  }
  return context;
};
