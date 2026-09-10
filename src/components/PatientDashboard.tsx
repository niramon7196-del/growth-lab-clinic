import React, { useState, useMemo, useEffect } from 'react';
import * as cloudApi from '../services/cloudApi';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Calendar, 
  Apple, 
  Brain, 
  Moon, 
  Flame, 
  TrendingUp, 
  CheckCircle2, 
  User, 
  BookOpen, 
  Camera, 
  QrCode, 
  PlayCircle, 
  History, 
  Info, 
  ChevronRight, 
  Clock,
  Sparkles,
  Smile,
  Zap,
  Target,
  AlertCircle,
  Award,
  Plus,
  X,
  Check,
  Scale,
  Download,
  Ruler,
  Utensils,
  Video,
  Activity,
  Dumbbell,
  ArrowLeft,
  CalendarPlus,
  Share2,
  Smartphone,
  Copy,
  CalendarCheck,
  CalendarClock,
  Loader2,
  Send
} from 'lucide-react';
import { Patient, SessionLog, Appointment, HomeworkAssignment, NutritionLog, GrowthLog, SleepLog, EFRecordLog } from '../types';
import { VERIFIED_EXERCISES } from '../data';
import InteractiveWorkoutPlayer, { WorkoutExerciseItem } from './InteractiveWorkoutPlayer';
import PatientInteractiveCalendar from './PatientInteractiveCalendar';
import { getExerciseMedia, formatVideoEmbedUrl } from '../utils/exerciseMediaManager';
import { calculateBMI, calculateMonthlySleepSummary } from '../utils/clinicalCalculations';
import { getParamCaseInsensitive, formatPatientDisplay } from '../utils/patientUtils';
import { calculateConsistencyMetrics } from '../utils/checkInCalculations';
import { playSuccessChime } from '../utils/audioUtils';
import { getPatientAssignedExercises } from '../../exerciseHelper';
import { Logo } from './Logo';
import { syncAppointmentToGoogleSheets, getWebhookUrl } from '../services/googleAppsScriptService';
import { getCleanPatientDisplayName, getCleanNotes } from './AppointmentsList';

interface PatientDashboardProps {
  patient?: Patient;
  logs: SessionLog[];
  appointments: Appointment[];
  onNavigate: (tab: string, patientId?: string, subTab?: string) => void;
  onUpdatePatientNutrition?: (patientId: string, log: NutritionLog) => void;
  onUpdatePatientGrowth?: (patientId: string, log: GrowthLog) => void;
  onUpdatePatientAssignments?: (patientId: string, assignments: HomeworkAssignment[]) => void;
  onUpdatePatientSleep?: (patientId: string, log: SleepLog) => void;
  onUpdatePatientEfLog?: (patientId: string, log: EFRecordLog) => void;
  onCheckIn?: (patientId: string, source?: 'APP' | 'QR') => void;
  onUpdateAppointmentStatus?: (id: string, status: string, notes?: string) => void;
}

export function getExerciseTitle(input: string): string {
  if (!input) return 'แบบฝึกกล้ามเนื้อปาก OMT';
  const found = VERIFIED_EXERCISES.find(e => e.id === input || e.title === input);
  if (found && found.title && !found.title.startsWith('ex_')) {
    return found.title;
  }
  const fallbackMap: Record<string, string> = {
    'ex_1': 'การฝึกหายใจผ่านจมูก (Nasal Breathing)',
    'ex_2': 'การฝึกตำแหน่งลิ้นแตะเพดานปาก (Mewing Position)',
    'ex_3': 'การฝึกกลืนที่ถูกต้อง (Proper Swallowing)',
    'ex_4': 'การฝึกริมฝีปากและกล้ามเนื้อรอบปาก (Lip Seal Training)',
    'ex_5': 'การฝึกออกเสียงชะลอกลมปาก (Speech & Articulation)',
    'breathing_1': 'การฝึกหายใจผ่านจมูก (Diaphragmatic Nasal Breathing)',
    'tongue_1': 'การฝึกตำแหน่งลิ้นแตะเพดานปาก (Mewing Spot)',
    'swallow_1': 'การฝึกกลืนที่ถูกต้อง (Proper Swallowing)',
    'lip_1': 'การฝึกความแข็งแรงของริมฝีปาก (Lip Seal)'
  };
  if (fallbackMap[input]) return fallbackMap[input];
  if (input.startsWith('ex_')) return 'แบบฝึกกล้ามเนื้อปาก OMT';
  return input;
}

const GROWTH_POSTURE_EXERCISES = [
  {
    id: 'posture_stretch',
    title: 'ท่ายืดเหยียดแนวกระดูกสันหลัง (Spinal Stretch & Decompression)',
    subtitle: 'กระตุ้นแผ่นการเจริญเติบโต (Epiphyseal Plate) และปรับบุคลิกภาพ',
    duration: '5 นาที (10-15 วินาที x 5-10 รอบ)',
    category: 'ยืดเหยียดตัว',
    description: 'ท่ายืดเหยียดแนวกระดูกสันหลังช่วยคลายหมอนรองกระดูก เพิ่มพื้นที่ข้อต่อ และกระตุ้นแผ่นเจริญเติบโตที่ขาและแนวกระดูกสันหลัง',
    steps: [
      'ยืนตรง เท้าสองข้างแยกห่างเท่าระดับหัวไหล่',
      'ประสานมือชูขึ้นเหนือศีรษะ หงายฝ่ามือขึ้นด้านบน',
      'ยืดตัวขึ้นให้สุด เขย่งปลายเท้า หายใจเข้าลึกๆ ค้างไว้ 10-15 วินาที',
      'ค่อยๆ วางส้นเท้าลง ผ่อนคลายร่างกาย หายใจออก',
      'ทำซ้ำ 5-10 รอบ ทุกวันเช้าและเย็น'
    ]
  },
  {
    id: 'bone_loading_jump',
    title: 'ท่ากระโดด Bone Loading (Growth Plate Stimulation)',
    subtitle: 'กระตุ้นมวลกระดูกและขยายความยาวกระดูกขา',
    duration: '5-10 นาที (30-50 ครั้ง/เซ็ต)',
    category: 'กระตุ้นกระดูก',
    description: 'การกระโดดสร้างแรงอัดเบาๆ (Impact Force) ลงบนแผ่นการเจริญเติบโต ช่วยเร่งการสะสมแคลเซียมและความยาวกระดูก',
    steps: [
      'ยืนหลังตรง ย่อเข่าเล็กน้อย เหวี่ยงแขนไปด้านหลังเตรียมตัว',
      'กระโดดขึ้นในแนวตั้งให้สูงที่สุด พร้อมชูสองแขนขึ้นเหนือศีรษะ',
      'ลงสู่พื้นด้วยปลายเท้าเบาๆ และย่อเข่าเพื่อซับแรงกระแทก',
      'กระโดดต่อเนื่อง 30-50 ครั้ง ต่อ 1 เซ็ต (ทำวันละ 2-3 เซ็ต)',
      'สามารถใช้การกระโดดเชือกทดแทนได้'
    ]
  },
  {
    id: 'wall_stand_alignment',
    title: 'ท่ายืนปรับบุคลิกภาพ (Posture Alignment & Wall Stand)',
    subtitle: 'จัดแนวกระดูกสันหลัง ลำตัวตรง สง่า ไม่หลังค่อม',
    duration: '5-10 นาที',
    category: 'ปรับบุคลิกภาพ',
    description: 'การยืนชิดผนัง 5 จุดช่วยรีเซ็ตระบบความจำกล้ามเนื้อ (Muscle Memory) ให้บุคลิกภาพสง่า ลำตัวยืดตรง ไม่หลังค่อม',
    steps: [
      'ยืนหันหลังชิดผนังเรียบ ให้ส้นเท้า น่อง สะโพก สะบัก และท้ายทอยสัมผัสผนัง',
      'เก็บคางเข้าหาอกเล็กน้อย ตามองตรงไปข้างหน้า',
      'แขม่วท้องเบาๆ หายใจเข้าออกสม่ำเสมอเป็นจังหวะ',
      'ค้างท่ายืนชิดผนัง 5-10 นาที โดยไม่เกร็งไหล่',
      'ทำทุกวันหลังตื่นนอนหรือก่อนเข้านอน'
    ]
  }
];

export default function PatientDashboard({ 
  patient, 
  logs, 
  appointments, 
  onNavigate,
  onUpdatePatientNutrition,
  onUpdatePatientGrowth,
  onUpdatePatientAssignments,
  onUpdatePatientSleep,
  onUpdatePatientEfLog,
  onCheckIn,
  onUpdateAppointmentStatus
}: PatientDashboardProps) {
  // Quick Action Modal States
  const [showNutritionModal, setShowNutritionModal] = useState(false);
  const [showGrowthModal, setShowGrowthModal] = useState(false);
  const [showEfModal, setShowEfModal] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showOmtModal, setShowOmtModal] = useState(false);
  const [activeEvidenceVideo, setActiveEvidenceVideo] = useState<{url: string, title: string} | null>(null);

  const handleDownloadMedia = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      window.open(url, '_blank');
    }
  };

  const [showCheckInModal, setShowCheckInModal] = useState(false);

  const currentAssignments = React.useMemo(() => {
    return getPatientAssignedExercises(VERIFIED_EXERCISES, patient);
  }, [patient]);

  // Daily Check-in State
  const todayStr = new Date().toISOString().split('T')[0];
  const [checkInDate, setCheckInDate] = useState<string>(() => {
    return localStorage.getItem(`growth_lab_checkin_${patient?.id}`) || '';
  });
  const isCheckedInToday = checkInDate === todayStr;
  const [streakCount, setStreakCount] = useState<number>(() => {
    return Number(localStorage.getItem(`growth_lab_streak_${patient?.id}`) || '0');
  });

  // Check-in Form Inputs (Default unchecked for 100% clean blank initial state)
  const [checkInEfWorn, setCheckInEfWorn] = useState(false);
  const [checkInGoodSleep, setCheckInGoodSleep] = useState(false);
  const [checkInNasalBreathe, setCheckInNasalBreathe] = useState(false);
  const [checkInWater, setCheckInWater] = useState(false);
  const [checkInNotes, setCheckInNotes] = useState('');
  const [isSavingCheckIn, setIsSavingCheckIn] = useState(false);

  // Auto-trigger daily check-in gatekeeper if not checked in today
  useEffect(() => {
    if (patient && !isCheckedInToday) {
      const timer = setTimeout(() => {
        setShowCheckInModal(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [patient?.id, isCheckedInToday]);

  const handleSaveCheckIn = () => {
    setIsSavingCheckIn(true);
    setTimeout(() => {
      setCheckInDate(todayStr);
      localStorage.setItem(`growth_lab_checkin_${patient?.id}`, todayStr);
      const nextStreak = streakCount + (isCheckedInToday ? 0 : 1);
      setStreakCount(nextStreak);
      localStorage.setItem(`growth_lab_streak_${patient?.id}`, String(nextStreak));

      // Real-time Sync to Google Sheets Daily_Logs via cloudApi
      if (patient) {
        const patientHn = patient.hn || patient.id;
        const patientName = `${patient.firstName} ${patient.lastName}`.trim();
        const score = (checkInEfWorn ? 25 : 0) + (checkInGoodSleep ? 25 : 0) + (checkInNasalBreathe ? 25 : 0) + (checkInWater ? 25 : 0);
        
        cloudApi.logDaily({
          hn: patientHn,
          patientId: patient.id,
          name: patientName,
          patientName: patientName,
          date: todayStr,
          timestamp: new Date().toISOString(),
          efWorn: checkInEfWorn,
          goodSleep: checkInGoodSleep,
          nasalBreathe: checkInNasalBreathe,
          waterDrinking: checkInWater,
          score: score,
          notes: checkInNotes,
          actionName: 'Daily Check-in Completed',
          status: 'completed',
          sheetName: 'Daily_Logs'
        }).catch(err => console.warn('[PatientDashboard] cloudApi.logDaily checkin error:', err));
      }

      if (patient?.id && onCheckIn) {
        onCheckIn(patient.id, 'APP');
      }
      playSuccessChime();
      setIsSavingCheckIn(false);
      setShowCheckInModal(false);
      // Requirement 3: Direct navigation to assigned exercises after check-in
      if (onNavigate) {
        onNavigate('แบบฝึกหัดที่ได้รับมอบหมาย');
      }
    }, 400);
  };

  // Requirement 1: GNS Touch Checklist 5 Items (Default unchecked for 100% clean blank state)
  const [gnsProtein, setGnsProtein] = useState<boolean>(false);
  const [gnsCalcium, setGnsCalcium] = useState<boolean>(false);
  const [gnsVegFruit, setGnsVegFruit] = useState<boolean>(false);
  const [gnsLowSugar, setGnsLowSugar] = useState<boolean>(false);
  const [gnsWater, setGnsWater] = useState<boolean>(false);
  const [isSavingNutrition, setIsSavingNutrition] = useState(false);

  const handleSaveNutrition = () => {
    if (!patient) return;
    setIsSavingNutrition(true);
    setTimeout(() => {
      const checkedCount = (gnsProtein ? 1 : 0) + (gnsCalcium ? 1 : 0) + (gnsVegFruit ? 1 : 0) + (gnsLowSugar ? 1 : 0) + (gnsWater ? 1 : 0);
      const totalScore = checkedCount * 20;
      const todayStr = new Date().toISOString().split('T')[0];

      const newLog: NutritionLog = {
        id: `nut_${Date.now()}`,
        date: todayStr,
        protein: gnsProtein ? 5 : 0,
        calciumVitD: gnsCalcium ? 5 : 0,
        vegFruit: gnsVegFruit ? 5 : 0,
        foodQuality: gnsLowSugar ? 5 : 0,
        waterConsistency: gnsWater ? 5 : 0,
        totalScore: totalScore
      };

      if (onUpdatePatientNutrition) {
        onUpdatePatientNutrition(patient.id, newLog);
      }

      // Real-time Cloud API sync
      cloudApi.logDaily({
        hn: patient.hn || patient.id,
        patientId: patient.id,
        name: `${patient.firstName} ${patient.lastName}`.trim(),
        patientName: `${patient.firstName} ${patient.lastName}`.trim(),
        date: todayStr,
        timestamp: new Date().toISOString(),
        nutritionQuality: totalScore,
        score: totalScore,
        actionName: 'Nutrition Checklist Completed',
        notes: `Protein:${gnsProtein}, Calcium:${gnsCalcium}, Veg:${gnsVegFruit}, LowSugar:${gnsLowSugar}, Water:${gnsWater}`,
        status: 'completed',
        sheetName: 'Daily_Logs'
      }).catch(e => console.warn('[PatientDashboard] cloudApi.logDaily nutrition error:', e));

      // Persist state in localStorage
      try {
        localStorage.setItem(`growth_gns_${patient.id}_${todayStr}`, JSON.stringify({
          gnsProtein, gnsCalcium, gnsVegFruit, gnsLowSugar, gnsWater, totalScore, isDone: true
        }));
      } catch (e) {
        console.error(e);
      }

      playSuccessChime();
      setIsSavingNutrition(false);
      setShowNutritionModal(false);
    }, 400);
  };

  // Requirement 2: EF Appliance & Daily Sleep Quality Score Form States
  const [efBedtime, setEfBedtime] = useState<string>('21:30');
  const [efActualSleepTime, setEfActualSleepTime] = useState<string>('22:00');
  const [efWakeTime, setEfWakeTime] = useState<string>('06:30');
  const [efNighttimeAwakenings, setEfNighttimeAwakenings] = useState<number>(0);
  const [efSnoringMouthBreathingScore, setEfSnoringMouthBreathingScore] = useState<number>(0);
  const [efMorningCondition, setEfMorningCondition] = useState<string>('🙂 สดชื่นดี');
  const [efWorn, setEfWorn] = useState<boolean>(true);
  const [efDurationHours, setEfDurationHours] = useState<number>(8.0);
  const [efRemovedDuringNight, setEfRemovedDuringNight] = useState<boolean>(false);
  const [efRemovalReason, setEfRemovalReason] = useState<string>('');
  const [efSleepQualityScore, setEfSleepQualityScore] = useState<number>(5);
  const [efNotes, setEfNotes] = useState<string>('');
  const [isSavingEf, setIsSavingEf] = useState<boolean>(false);

  const calculateNetSleepHours = (actualTime: string, wTime: string): number => {
    if (!actualTime || !wTime) return 8.0;
    try {
      const [aH, aM] = actualTime.split(':').map(Number);
      const [wH, wM] = wTime.split(':').map(Number);
      let startMins = aH * 60 + aM;
      let endMins = wH * 60 + wM;
      if (endMins < startMins) {
        endMins += 24 * 60;
      }
      const diffMins = endMins - startMins;
      const hours = Math.max(0, Number((diffMins / 60).toFixed(1)));
      return hours;
    } catch {
      return 8.0;
    }
  };

  const handleSaveEfAppliance = () => {
    if (!patient) return;
    setIsSavingEf(true);
    const netSleepHours = calculateNetSleepHours(efActualSleepTime, efWakeTime);
    const todayStr = new Date().toISOString().split('T')[0];

    const sleepLog: SleepLog = {
      id: `sleep_${patient.id}_${Date.now()}`,
      date: todayStr,
      duration: netSleepHours,
      quality: efSleepQualityScore,
      snoring: efSnoringMouthBreathingScore > 0,
      mouthBreathing: efSnoringMouthBreathingScore === 2,
      bedtime: efBedtime,
      actualSleepTime: efActualSleepTime,
      wakeTime: efWakeTime,
      nighttimeAwakenings: efNighttimeAwakenings,
      snoringMouthBreathingScore: efSnoringMouthBreathingScore,
      morningCondition: efMorningCondition,
      efWorn,
      efDurationHours: efWorn ? efDurationHours : 0,
      efRemovedDuringNight,
      efRemovalReason: efRemovedDuringNight ? efRemovalReason : undefined,
      notes: efNotes.trim() || undefined
    };

    const efLog: EFRecordLog = {
      id: `ef_${patient.id}_${Date.now()}`,
      date: todayStr,
      status: efWorn ? 'worn' : 'failed',
      efWorn,
      durationHours: efWorn ? efDurationHours : 0,
      removedDuringNight: efRemovedDuringNight,
      removalReason: efRemovedDuringNight ? efRemovalReason : undefined,
      notes: efNotes.trim() || undefined
    };

    if (onUpdatePatientSleep) {
      onUpdatePatientSleep(patient.id, sleepLog);
    }
    if (onUpdatePatientEfLog) {
      onUpdatePatientEfLog(patient.id, efLog);
    }

    // Real-time Cloud API sync
    cloudApi.logDaily({
      hn: patient.hn || patient.id,
      patientId: patient.id,
      name: `${patient.firstName} ${patient.lastName}`.trim(),
      patientName: `${patient.firstName} ${patient.lastName}`.trim(),
      date: todayStr,
      timestamp: new Date().toISOString(),
      sleepHours: netSleepHours,
      sleepQuality: efSleepQualityScore,
      efWorn: efWorn,
      efDurationHours: efDurationHours,
      score: (efWorn ? 50 : 0) + (efSleepQualityScore * 10),
      actionName: 'Sleep & EF Log Completed',
      notes: efNotes,
      status: 'completed',
      sheetName: 'Daily_Logs'
    }).catch(e => console.warn('[PatientDashboard] cloudApi.logDaily sleep error:', e));

    try {
      localStorage.setItem(`growth_sleep_${patient.id}_${todayStr}`, JSON.stringify({ ...sleepLog, isDone: true }));
      localStorage.setItem(`growth_ef_${patient.id}_${todayStr}`, JSON.stringify({ ...efLog, isDone: true }));
    } catch (e) {
      console.error(e);
    }

    playSuccessChime();
    setTimeout(() => {
      setIsSavingEf(false);
      setShowEfModal(false);
    }, 300);
  };

  // Requirement 3: Exercise Guide & Completed State
  const [selectedExerciseGuide, setSelectedExerciseGuide] = useState<typeof GROWTH_POSTURE_EXERCISES[0] | null>(null);
  const [completedExercisesMap, setCompletedExercisesMap] = useState<Record<string, boolean>>(() => {
    if (!patient) return {};
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      const saved1 = localStorage.getItem(`growth_completed_exercises_${patient.id}_${todayStr}`);
      const saved2 = localStorage.getItem(`growth_completed_assignments_${patient.id}_${todayStr}`);
      const map1 = saved1 ? JSON.parse(saved1) : {};
      const map2 = saved2 ? JSON.parse(saved2) : {};
      return { ...map1, ...map2 };
    } catch {
      return {};
    }
  });

  // Keep completed map updated when patient assignments change
  React.useEffect(() => {
    if (!patient) return;
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      const saved1 = localStorage.getItem(`growth_completed_exercises_${patient.id}_${todayStr}`);
      const saved2 = localStorage.getItem(`growth_completed_assignments_${patient.id}_${todayStr}`);
      const map1 = saved1 ? JSON.parse(saved1) : {};
      const map2 = saved2 ? JSON.parse(saved2) : {};
      
      const assignmentsMap: Record<string, boolean> = {};
      currentAssignments.forEach((a: any) => {
        if (a.status === 'completed') {
          assignmentsMap[a.id] = true;
          if (a.exerciseId) assignmentsMap[a.exerciseId] = true;
          if (a.assignmentId) assignmentsMap[a.assignmentId] = true;
        }
      });

      setCompletedExercisesMap(prev => ({ ...prev, ...map1, ...map2, ...assignmentsMap }));
    } catch (e) {
      console.error(e);
    }
  }, [patient?.id, patient?.assignments]);

  const daysInProgram = Math.max(1, Math.floor((new Date().getTime() - new Date(patient?.startDate || Date.now()).getTime()) / (1000 * 60 * 60 * 24)) + 1);

  const isGnsDoneToday = gnsProtein || gnsCalcium || gnsVegFruit || gnsLowSugar || gnsWater || (() => {
    if (!patient) return false;
    const todayStr = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem(`growth_gns_${patient.id}_${todayStr}`);
    if (saved) {
      try { return Boolean(JSON.parse(saved).isDone); } catch { return true; }
    }
    return Boolean(patient.nutritionLogs?.some(n => n.date === todayStr));
  })();

  const currentGnsScore = isGnsDoneToday ? (((gnsProtein ? 1 : 0) + (gnsCalcium ? 1 : 0) + (gnsVegFruit ? 1 : 0) + (gnsLowSugar ? 1 : 0) + (gnsWater ? 1 : 0)) * 20 || 100) : 0;

  const isEfDoneToday = (() => {
    if (!patient) return false;
    const todayStr = new Date().toISOString().split('T')[0];
    const savedEf = localStorage.getItem(`growth_ef_${patient.id}_${todayStr}`);
    const savedSleep = localStorage.getItem(`growth_sleep_${patient.id}_${todayStr}`);
    if (savedEf || savedSleep) {
      return true;
    }
    return Boolean(
      patient.sleepLogs?.some(s => s.date === todayStr) ||
      patient.efRecordLogs?.some(e => e.date === todayStr)
    );
  })();

  const isPostureDoneToday = GROWTH_POSTURE_EXERCISES.some(ex => completedExercisesMap[ex.id]);

  const isOmtDoneToday = Boolean(completedExercisesMap['omt_done_today']) || (() => {
    if (!patient) return false;
    if (currentAssignments.length === 0) return false;
    return currentAssignments.some((a: any) => a.status === 'completed' || completedExercisesMap[a.id] || completedExercisesMap[a.exerciseId] || completedExercisesMap[a.assignmentId]);
  })();

  const handleCompleteGrowthExercise = (ex: typeof GROWTH_POSTURE_EXERCISES[0]) => {
    if (!patient) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const newMap = { ...completedExercisesMap, [ex.id]: true };
    setCompletedExercisesMap(newMap);
    try {
      localStorage.setItem(`growth_completed_exercises_${patient.id}_${todayStr}`, JSON.stringify(newMap));
    } catch (e) {
      console.error(e);
    }

    // Real-time Cloud API sync
    cloudApi.saveExercise({
      hn: patient.hn || patient.id,
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`.trim(),
      exerciseId: ex.id,
      exerciseTitle: ex.title,
      category: (ex as any).categoryTag || ex.category || 'EXERCISE',
      status: 'completed',
      timestamp: new Date().toISOString(),
      date: todayStr,
      sheetName: 'Exercise_Logs'
    }).catch(e => console.warn('[PatientDashboard] cloudApi.saveExercise error:', e));

    playSuccessChime();
  };

  const handleSaveExercises = () => {
    if (!patient) return;
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      localStorage.setItem(`growth_completed_exercises_${patient.id}_${todayStr}`, JSON.stringify(completedExercisesMap));
    } catch (e) {
      console.error(e);
    }
    playSuccessChime();
    setShowExerciseModal(false);
  };

  // OMT Exercise Completion
  const handleCompleteOmtAssignment = (assignId: string, exTitle: string) => {
    if (!patient) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const newMap = { ...completedExercisesMap, [assignId]: true, omt_done_today: true };
    setCompletedExercisesMap(newMap);
    try {
      localStorage.setItem(`growth_completed_exercises_${patient.id}_${todayStr}`, JSON.stringify(newMap));
      localStorage.setItem(`growth_completed_assignments_${patient.id}_${todayStr}`, JSON.stringify(newMap));
    } catch (e) {
      console.error(e);
    }

    // Real-time Cloud API sync
    cloudApi.saveExercise({
      hn: patient.hn || patient.id,
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`.trim(),
      exerciseId: assignId,
      exerciseTitle: exTitle || 'OMT Homework',
      category: 'OMT',
      status: 'completed',
      timestamp: new Date().toISOString(),
      date: todayStr,
      sheetName: 'Exercise_Logs'
    }).catch(e => console.warn('[PatientDashboard] cloudApi.saveExercise OMT error:', e));

    if (onUpdatePatientAssignments) {
      const updated = currentAssignments.map((a: any) => (a.id === assignId || a.assignmentId === assignId) ? { ...a, status: 'completed' as const } : a);
      onUpdatePatientAssignments(patient.id, updated);
    }
    playSuccessChime();
  };

  const handleSaveOmtHomework = () => {
    if (!patient) return;
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      localStorage.setItem(`growth_completed_assignments_${patient.id}_${todayStr}`, JSON.stringify(completedExercisesMap));
    } catch (e) {
      console.error(e);
    }
    playSuccessChime();
    setShowOmtModal(false);
  };

  // Growth Quick Log State
  const [growthHeight, setGrowthHeight] = useState<string>(patient?.height ? String(patient.height) : '');
  const [growthWeight, setGrowthWeight] = useState<string>(patient?.weight ? String(patient.weight) : '');
  const [isSavingGrowth, setIsSavingGrowth] = useState(false);

  const handleSaveGrowth = () => {
    if (!patient) return;
    setIsSavingGrowth(true);
    setTimeout(() => {
      const today = new Date().toISOString().split('T')[0];
      const numWeight = parseFloat(growthWeight) || 0;
      const numHeight = parseFloat(growthHeight) || 0;
      const prevHeight = patient.height || 0;
      const bmiVal = calculateBMI(numWeight, numHeight);

      const newLog: GrowthLog = {
        id: `gro_${Date.now()}`,
        date: today,
        height: numHeight,
        weight: numWeight,
        bmi: bmiVal,
        previousHeight: prevHeight,
        previousMeasurementDate: patient.growthLogs && patient.growthLogs.length > 0 ? patient.growthLogs[patient.growthLogs.length - 1].date : undefined,
        notes: `อัปเดตสถิติประจำสัปดาห์โดยผู้ปกครอง`
      };

      if (onUpdatePatientGrowth) {
        onUpdatePatientGrowth(patient.id, newLog);
      }
      playSuccessChime();
      setIsSavingGrowth(false);
      setShowGrowthModal(false);
    }, 400);
  };

  if (!patient) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <p className="text-slate-500 font-bold">ไม่พบข้อมูลผู้รับการดูแล</p>
      </div>
    );
  }

  const patientLogs = logs.filter(l => l.patientId === patient.id || l.patientId === patient.hn);
  const patientAppointments = useMemo(() => {
    const fromGlobal = appointments.filter(a => (a.patientId === patient.id || a.patientId === patient.hn || (a as any).hn === patient.hn) && a.status !== 'cancelled');
    const fromPatientRecord: Appointment[] = (patient.appointments || []).map((pa: any, idx: number) => ({
      id: pa.id || `pa_${idx}`,
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`.trim(),
      date: pa.date,
      time: pa.time || '10:00',
      type: pa.type || 'clinical',
      notes: pa.notes || pa.title || '',
      status: pa.status || 'pending'
    }));
    const combined = [...fromGlobal, ...fromPatientRecord];
    const unique = Array.from(new Map(combined.map(item => [item.id || item.date, item])).values());
    return unique.filter(a => a.status !== 'cancelled').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [appointments, patient]);

  const age = patient.age || 8;
  const isKidTier = age < 15;

  const analytics = useMemo(() => {
    const nutritionLogs = patient.nutritionLogs || [];
    const latestNutrition = nutritionLogs.length > 0 ? nutritionLogs[nutritionLogs.length - 1] : null;
    const weeklyGns = latestNutrition?.totalScore ?? (latestNutrition as any)?.weeklyGnsScore ?? 85;

    const sleepLogs = patient.sleepLogs || [];
    const sleepSummary = calculateMonthlySleepSummary(sleepLogs);
    const hasSleepRedFlags = sleepSummary.redFlagDaysCount > 0 || sleepLogs.some(s => s.hasRedFlag || s.snoring || s.mouthBreathing);

    const efLogs = patient.efRecordLogs || [];
    const efWornCount = efLogs.filter(l => l.efWorn).length;
    const efAdherenceRate = efLogs.length > 0 ? Math.round((efWornCount / efLogs.length) * 100) : (sleepSummary.efAdherencePercent || 88);

    const compositeScore = Math.round(
      (weeklyGns * 0.35) + 
      ((hasSleepRedFlags ? 70 : 92) * 0.25) + 
      (efAdherenceRate * 0.25) + 
      (88 * 0.15)
    );

    return {
      weeklyGns,
      hasSleepRedFlags,
      efAdherenceRate,
      compositeScore,
      bmi: (patient.weight && patient.height && Number(patient.weight) > 0 && Number(patient.height) > 0)
        ? calculateBMI(patient.weight, patient.height)
        : 0
    };
  }, [patient]);

  const consistencyMetrics = useMemo(() => calculateConsistencyMetrics(patient), [patient]);

  const totalHomework = currentAssignments.length;
  const completedHomework = currentAssignments.filter((a: any) => a.status === 'completed' || completedExercisesMap[a.id] || completedExercisesMap[a.exerciseId] || completedExercisesMap[a.assignmentId]).length;

  const urlName = getParamCaseInsensitive(
    typeof window !== 'undefined' ? window.location.search : '',
    ['name', 'fullname', 'firstname', 'fullName', 'firstName']
  ) || getParamCaseInsensitive(
    typeof window !== 'undefined' ? window.location.hash : '',
    ['name', 'fullname', 'firstname', 'fullName', 'firstName']
  );

  let rawName = `${patient.firstName || ''} ${patient.lastName || ''}`.replace(/ผู้รับการดูแลใหม่/g, '').replace(/\(HN-.*?\)/g, '').trim();
  if (!rawName || rawName === 'ผู้รับการดูแล') {
    if (urlName) {
      rawName = urlName;
    } else if (patient.nickname && patient.nickname !== 'ผู้รับการดูแลใหม่' && patient.nickname !== 'ผู้รับการดูแล') {
      rawName = patient.nickname;
    } else {
      rawName = 'ผู้รับการดูแล';
    }
  }
  const patientInfo = formatPatientDisplay(patient);
  const fullName = patientInfo.displayName;
  const hnCode = patient.hn || patient.id;

  const completedMissionsCount = (isGnsDoneToday ? 1 : 0) + (isEfDoneToday ? 1 : 0) + (isPostureDoneToday ? 1 : 0) + (isOmtDoneToday ? 1 : 0);
  const progressPercent = Math.round((completedMissionsCount / 4) * 100);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-4 text-left w-full max-w-full pb-6 box-border"
    >
      {/* ========================================================================= */}
      {/* 1. Header Greeting Banner + Integrated Daily Check-in Button            */}
      {/* ========================================================================= */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border-2 border-amber-400/60 shadow-lg p-4 sm:p-5 space-y-2 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Logo className="w-16 h-auto" />
              <span className="bg-slate-100 px-2.5 py-0.5 rounded-full text-xs sm:text-[13px] font-bold text-slate-700 border border-slate-200">
                HN: {hnCode}
              </span>
              <span className={patientInfo.ageGroupBadge.badgeClass}>
                {patientInfo.ageGroupTag}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
              <span>👋 สวัสดี {fullName}</span>
              {patientInfo.formattedNickname && (
                <span className="text-lg sm:text-xl text-purple-700 font-bold">
                  {patientInfo.formattedNickname}
                </span>
              )}
            </h1>
            <p className="text-slate-600 text-sm font-semibold">
              อายุ: {patientInfo.ageDisplayText} • โปรแกรมประจำสัปดาห์: แผนปรับโครงสร้าง & OMT
            </p>
          </div>

          {/* Daily Check-in Button in Header */}
          <div className="shrink-0">
            {isCheckedInToday ? (
              <div className="px-3.5 py-2 rounded-xl font-black text-sm bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>✓ เช็กอินวันนี้แล้ว</span>
                <span className="ml-0.5 px-2 py-0.5 rounded-full bg-emerald-200 text-[11px] sm:text-xs text-emerald-900 border border-emerald-300 font-black">
                  🔥 {streakCount} วัน
                </span>
              </div>
            ) : (
              <button type="button"
                onClick={() => setShowCheckInModal(true)}
                className="px-3.5 py-2 rounded-xl font-black text-sm transition-all shadow-md cursor-pointer flex items-center gap-2 border bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-300 animate-pulse"
              >
                <Calendar className="w-4 h-4 text-slate-950" />
                <span>📅 กดเช็กอินประจำวัน</span>
                <span className="ml-0.5 px-2 py-0.5 rounded-full bg-black/30 text-[11px] sm:text-xs text-amber-200 border border-white/10 font-black">
                  🔥 {streakCount} วัน
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Middle Section: Today's Exercise Progress Summary & Prominent CTA    */}
      {/* ========================================================================= */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border-2 border-amber-400/60 shadow-lg p-4 sm:p-5 space-y-3 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
              <h2 className="text-sm sm:text-base font-black text-slate-900">🎯 สรุปความคืบหน้าการทำแบบฝึกหัดวันนี้</h2>
            </div>
            <p className="text-xs sm:text-[13px] text-slate-500 font-medium">
              ติดตามผลการฝึกประจำวันตามแผนการดูแล 4 เสาหลัก
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-900 border border-purple-200 text-sm font-black shrink-0">
            <span>วันนี้ทำไปแล้ว</span>
            <span className="text-purple-700 font-black text-sm">
              {completedHomework} จาก {totalHomework}
            </span>
            <span>ท่า</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm font-bold text-slate-600">
            <span>ระดับความสำเร็จประจำวัน:</span>
            <span className="text-purple-700 font-black">
              {totalHomework > 0 ? Math.round((completedHomework / totalHomework) * 100) : 0}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div 
              className="h-full bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${totalHomework > 0 ? Math.min(100, Math.round((completedHomework / totalHomework) * 100)) : 0}%` }}
            />
          </div>
        </div>

        {/* Prominent Main Action Button */}
        <div>
          <button type="button"
            onClick={() => onNavigate('แบบฝึกหัดที่ได้รับมอบหมาย_WIZARD')}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-base sm:text-lg rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 group border border-purple-400/30"
          >
            <span className="text-xl group-hover:scale-110 transition-transform">🚀</span>
            <span>เริ่มทำแบบฝึกหัดวันนี้</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Minimal 4 Pillars Shortcut Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1.5 border-t border-slate-100">
          <button type="button"
            onClick={() => onNavigate('แบบฝึกหัดที่ได้รับมอบหมาย_WIZARD')}
            className="p-2 sm:p-2.5 rounded-xl bg-purple-50/70 hover:bg-purple-100/80 border border-purple-200/80 transition-all text-left space-y-0.5 cursor-pointer group"
          >
            <div className="flex items-center justify-between text-sm font-extrabold text-purple-900">
              <span>👄 1. OMT ฝึกปาก</span>
              <ChevronRight className="w-3.5 h-3.5 text-purple-500 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-[11px] sm:text-xs text-purple-700 font-bold">
              {isOmtDoneToday ? '✓ ฝึกเสร็จแล้ว' : 'แตะเพื่อเข้าฝึก ➔'}
            </p>
          </button>

          <button type="button"
            onClick={() => setShowEfModal(true)}
            className="p-2 sm:p-2.5 rounded-xl bg-indigo-50/70 hover:bg-indigo-100/80 border border-indigo-200/80 transition-all text-left space-y-0.5 cursor-pointer group"
          >
            <div className="flex items-center justify-between text-sm font-extrabold text-indigo-900">
              <span>🌙 2. EF & การนอน</span>
              <ChevronRight className="w-3.5 h-3.5 text-indigo-500 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-[11px] sm:text-xs text-indigo-700 font-bold">
              {isEfDoneToday ? '✓ บันทึกเรียบร้อย' : 'แตะเพื่อลงบันทึก ➔'}
            </p>
          </button>

          <button type="button"
            onClick={() => setShowNutritionModal(true)}
            className="p-2 sm:p-2.5 rounded-xl bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200/80 transition-all text-left space-y-0.5 cursor-pointer group"
          >
            <div className="flex items-center justify-between text-sm font-extrabold text-emerald-900">
              <span>🥗 3. GNS โภชนาการ</span>
              <ChevronRight className="w-3.5 h-3.5 text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-[11px] sm:text-xs text-emerald-700 font-bold">
              {isGnsDoneToday ? `✓ ${currentGnsScore}/100` : 'แตะเพื่อประเมิน ➔'}
            </p>
          </button>

          <button type="button"
            onClick={() => setShowGrowthModal(true)}
            className="p-2 sm:p-2.5 rounded-xl bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200/80 transition-all text-left space-y-0.5 cursor-pointer group"
          >
            <div className="flex items-center justify-between text-sm font-extrabold text-amber-900">
              <span>📏 4. ส่วนสูง & ท่าทาง</span>
              <ChevronRight className="w-3.5 h-3.5 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-[11px] sm:text-xs text-amber-700 font-bold">
              {isPostureDoneToday ? '✓ อัปเดตแล้ว' : 'แตะเพื่ออัปเดต ➔'}
            </p>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2.1 Full Monthly Interactive Calendar (Synced with Google Sheets / Clinic) */}
      {/* ========================================================================= */}
      <PatientInteractiveCalendar
        patient={patient}
        appointments={appointments}
        onUpdateAppointmentStatus={onUpdateAppointmentStatus}
      />

      {/* ========================================================================= */}
      {/* 2.2 Knowledge Hub Colorful Shortcut Card (คลังความรู้สุขภาพ & เคล็ดลับ)     */}
      {/* ========================================================================= */}
      <div 
        onClick={() => onNavigate('คลังความรู้')}
        className="bg-gradient-to-r from-purple-700 via-indigo-700 to-sky-700 hover:from-purple-800 hover:to-indigo-800 text-white p-3.5 sm:p-4 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer border border-purple-300/30 space-y-2.5 group relative overflow-hidden text-left"
      >
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] sm:text-xs shadow-xs">
              <span>⚡ สรุปสั้น อ่านง่ายใน 30 วินาที</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
              <span>📚 คลังความรู้ & เคล็ดลับการเติบโต (แตะเพื่ออ่าน)</span>
              <ChevronRight className="w-5 h-5 text-amber-300 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-purple-100 text-sm font-medium">
              คู่มือใส่อุปกรณ์ EF • บริหารกล้ามเนื้อปาก OMT • หายใจทางจมูก 100% • โภชนาการ GNS • พฤติกรรมที่ต้องระวัง • Q&A ผู้ปกครอง
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap shrink-0">
            <span className="px-2 py-1 rounded-lg bg-sky-500/30 text-sky-200 border border-sky-300/30 text-[11px] sm:text-xs font-bold">
              🦷 EF
            </span>
            <span className="px-2 py-1 rounded-lg bg-purple-500/30 text-purple-200 border border-purple-300/30 text-[11px] sm:text-xs font-bold">
              👅 OMT
            </span>
            <span className="px-2 py-1 rounded-lg bg-emerald-500/30 text-emerald-200 border border-emerald-300/30 text-[11px] sm:text-xs font-bold">
              🫁 หายใจ
            </span>
            <span className="px-2 py-1 rounded-lg bg-amber-500/30 text-amber-200 border border-amber-300/30 text-[11px] sm:text-xs font-bold">
              🥦 GNS
            </span>
            <span className="px-2 py-1 rounded-lg bg-rose-500/30 text-rose-200 border border-rose-300/30 text-[11px] sm:text-xs font-bold">
              🚫 ระวัง
            </span>
            <span className="px-2 py-1 rounded-lg bg-yellow-400 text-slate-950 font-black text-[11px] sm:text-xs shadow-xs">
              💡 Q&A
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. Bottom Section: Consistency & Streak History Summary                  */}
      {/* ========================================================================= */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-purple-100 shadow-2xs space-y-3 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900">📊 สรุปประวัติความสม่ำเสมอ (Streak 7 วัน / 30 วัน)</h2>
              <p className="text-xs sm:text-[13px] text-slate-500 font-medium">สถิติการเช็คอินและการฝึกย้อนหลังสะสมอย่างต่อเนื่อง</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs sm:text-[13px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              STATUS: {consistencyMetrics.status === 'ACTIVE' || isCheckedInToday ? 'ACTIVE (กำลังรับการดูแล)' : 'INACTIVE'}
            </span>
          </div>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Card 1: Streak 7 Days */}
          <div className="p-2.5 sm:p-3 rounded-xl bg-purple-50/70 border border-purple-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-[13px] font-extrabold text-purple-900">Streak 7 วัน</span>
              <div className="w-6 h-6 rounded-md bg-purple-600 text-white flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-purple-950">{consistencyMetrics.weeklyCount}/7</span>
              <span className="text-xs sm:text-[13px] font-bold text-purple-700">วัน ({consistencyMetrics.weeklyCompliancePercent}%)</span>
            </div>
            {/* 7-Day Sparkline Dots */}
            <div className="flex items-center gap-1 pt-0.5">
              {consistencyMetrics.recent7Days.map((d) => (
                <div 
                  key={d.date}
                  title={`${d.dayLabel} (${d.date}): ${d.isCheckedIn ? 'ฝึก/เช็กอินแล้ว' : 'ยังไม่ได้เข้าฝึก'}`}
                  className={`w-3 h-3 rounded-2xs flex items-center justify-center text-[7px] font-black ${
                    d.isCheckedIn ? 'bg-emerald-500 text-white shadow-2xs' : 'bg-purple-200/70 text-purple-600'
                  }`}
                >
                  {d.isCheckedIn ? '✓' : '•'}
                </div>
              ))}
            </div>
            <p className="text-[11px] sm:text-xs text-purple-800 font-bold leading-tight break-words">
              {consistencyMetrics.classification.categoryLabelTh}
            </p>
          </div>

          {/* Card 2: Streak 30 Days */}
          <div className="p-2.5 sm:p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-[13px] font-extrabold text-indigo-900">Streak 30 วัน</span>
              <div className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center">
                <Award className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-indigo-950">{consistencyMetrics.monthlyCount}/30</span>
              <span className="text-xs sm:text-[13px] font-bold text-indigo-700">วัน ({consistencyMetrics.monthlyCompliancePercent}%)</span>
            </div>
            <div className="flex items-center gap-1 pt-0.5">
              <span className={`px-2 py-0.5 rounded-md text-[11px] sm:text-xs font-black ${
                consistencyMetrics.monthlyCompliancePercent >= 70 ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'
              }`}>
                {consistencyMetrics.monthlyCompliancePercent >= 70 ? '🏆 เหรียญทอง (Gold)' : '🥈 เหรียญเงิน (Silver)'}
              </span>
            </div>
          </div>

          {/* Card 3: App Sessions Today */}
          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-[13px] font-extrabold text-slate-600">การเข้าใช้งานวันนี้</span>
              <div className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-slate-900">{consistencyMetrics.todayAppOpens}</span>
              <span className="text-xs sm:text-[13px] font-bold text-slate-500">ครั้ง</span>
            </div>
            <p className="text-xs sm:text-[13px] text-slate-500 font-medium leading-tight break-words">
              เช็คอินล่าสุด: {consistencyMetrics.lastCheckInDate || 'วันนี้'}
            </p>
          </div>

          {/* Card 4: Current Consecutive Days */}
          <div className="p-2.5 sm:p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-[13px] font-extrabold text-amber-900">สะสมต่อเนื่อง</span>
              <div className="w-6 h-6 rounded-md bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                <Flame className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-amber-950">{streakCount}</span>
              <span className="text-xs sm:text-[13px] font-bold text-amber-800">วันติด 🔥</span>
            </div>
            <p className="text-[11px] sm:text-xs text-amber-800 font-bold leading-tight break-words">
              {streakCount > 0 ? 'ความสม่ำเสมอยอดเยี่ยม!' : 'เริ่มต้นวันใหม่ด้วยการเช็กอิน'}
            </p>
          </div>
        </div>
      </div>

      {/* Save to Home Screen Guide Card */}
      <div className="bg-gradient-to-br from-purple-50/80 via-indigo-50/60 to-amber-50/50 p-4 rounded-2xl border border-purple-200/80 shadow-2xs space-y-3 text-left">
        <div className="flex items-center justify-between border-b border-purple-200/60 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-lg">📱</span>
            <div>
              <h3 className="text-sm font-black text-slate-900">วิธีเพิ่มแอปลงหน้าจอมือถือ (Add to Home Screen)</h3>
              <p className="text-xs sm:text-[13px] text-slate-500 font-medium">บันทึกทางเข้าไว้ที่หน้าจอหลักบนมือถือ เปิดใช้งานง่าย ปลอดภัย 100%</p>
            </div>
          </div>
          <span className="text-[11px] sm:text-xs font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
            ไม่ต้องลงโปรแกรม
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {/* Android Box */}
          <div className="p-3 bg-white/95 rounded-xl border border-emerald-200/80 shadow-2xs space-y-1">
            <div className="flex items-center gap-1.5 text-sm font-black text-emerald-900">
              <span className="text-base">🤖</span>
              <span>สำหรับ Android (Chrome)</span>
            </div>
            <p className="text-xs sm:text-[13px] text-slate-700 font-semibold pl-6">
              แตะจุด 3 จุดมุมขวาบน <span className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-300 font-mono text-sm">⋮</span> ➔ เลือก <strong className="text-emerald-800">"เพิ่มลงในหน้าจอหลัก"</strong>
            </p>
          </div>

          {/* iOS Box */}
          <div className="p-3 bg-white/95 rounded-xl border border-blue-200/80 shadow-2xs space-y-1">
            <div className="flex items-center gap-1.5 text-sm font-black text-blue-900">
              <span className="text-base">🍎</span>
              <span>สำหรับ iPhone / iPad (Safari)</span>
            </div>
            <p className="text-xs sm:text-[13px] text-slate-700 font-semibold pl-6">
              แตะปุ่มแชร์ด้านล่าง <Share2 className="w-3.5 h-3.5 inline text-blue-600 mx-0.5" /> ➔ เลือก <strong className="text-blue-800">"เพิ่มไปยังหน้าจอโฮม"</strong>
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EXERCISE MODAL FOR CARD [3]                                               */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showExerciseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto prevent-pull-refresh" style={{ overscrollBehaviorY: 'contain', WebkitOverflowScrolling: 'touch' }}>
            <motion.div 
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-xl rounded-3xl p-4 sm:p-5 sm:p-6 md:p-8 shadow-2xl space-y-5 text-left max-h-[85vh] overflow-y-auto custom-scrollbar my-auto flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg">
                    🏃
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">ออกกำลังกายเพิ่มความสูง & บุคลิกภาพ</h3>
                    <p className="text-sm text-slate-500">รายการท่าออกกำลังกายเฉพาะที่คลินิกติ๊กเลือกให้</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowExerciseModal(false)}
                  className="p-2.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                  aria-label="ปิดหน้าต่างออกกำลังกาย"
                  title="ปิดหน้าต่าง"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 flex-1">
                {GROWTH_POSTURE_EXERCISES.map((ex) => {
                  const isDone = Boolean(completedExercisesMap[ex.id]);
                  return (
                    <div 
                      key={ex.id}
                      className={`p-4 rounded-2xl border transition-all space-y-2 ${
                        isDone ? 'bg-emerald-50/80 border-emerald-300' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[11px] sm:text-xs font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                            {ex.category}
                          </span>
                          <h4 className="text-sm font-black text-slate-900 mt-1">{ex.title}</h4>
                          <p className="text-sm text-slate-500 mt-0.5">{ex.subtitle}</p>
                        </div>
                        <button type="button"
                          onClick={() => {
                            const updated = { ...completedExercisesMap, [ex.id]: !isDone };
                            setCompletedExercisesMap(updated);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                            isDone ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isDone ? 'ทำสำเร็จแล้ว' : 'ติ๊กเลือกทำ'}</span>
                        </button>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button type="button"
                          onClick={() => setSelectedExerciseGuide(ex)}
                          className="text-sm text-purple-700 hover:underline font-bold flex items-center gap-1"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>ดูขั้นตอนวิธีฝึก & คลิป</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100 shrink-0">
                <button type="button"
                  onClick={() => setShowExerciseModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all cursor-pointer min-h-[44px]"
                >
                  ปิด / ยกเลิก
                </button>
                <button type="button"
                  onClick={handleSaveExercises}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
                >
                  <Check className="w-4 h-4" />
                  <span>บันทึกข้อมูลการออกกำลังกาย</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* OMT MODAL FOR CARD [4]                                                    */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showOmtModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto prevent-pull-refresh" style={{ overscrollBehaviorY: 'contain', WebkitOverflowScrolling: 'touch' }}>
            <motion.div 
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-xl rounded-3xl p-4 sm:p-5 sm:p-6 md:p-8 shadow-2xl space-y-5 text-left max-h-[85vh] overflow-y-auto custom-scrollbar my-auto flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg">
                    👄
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">แบบฝึกกล้ามเนื้อปาก OMT ประจำวัน</h3>
                    <p className="text-sm text-slate-500">รายชื่อท่า OMT ภาษาไทยเต็มเฉพาะที่คลินิกจัดสรรให้</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowOmtModal(false)}
                  className="p-2.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                  aria-label="ปิดหน้าต่าง OMT"
                  title="ปิดหน้าต่าง"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {totalHomework > 0 ? (
                <div className="space-y-3 flex-1">
                  {currentAssignments.map((assign: any) => {
                    const rawExId = assign.exerciseId || assign.id;
                    const fullTitle = getExerciseTitle(rawExId);
                    const isDone = assign.status === 'completed' || completedExercisesMap[assign.id] || completedExercisesMap[assign.exerciseId];
                    const exData = VERIFIED_EXERCISES.find(e => e.id === rawExId);

                    return (
                      <div 
                        key={assign.id}
                        className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                          isDone ? 'bg-emerald-50/80 border-emerald-300' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <span className="text-[11px] sm:text-xs font-extrabold text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                              OMT Exercise
                            </span>
                            <p className="text-sm font-bold text-slate-900 mt-1">{fullTitle}</p>
                            <p className="text-sm text-slate-500">
                              เป้าหมาย: {assign.reps || 10} ครั้ง / {assign.durationMinutes || 5} นาที
                            </p>
                            {assign.instruction && (
                              <p className="text-sm text-purple-700 italic">
                                💬 คำแนะนำ: "{assign.instruction}"
                              </p>
                            )}
                          </div>

                          <button type="button"
                            onClick={() => {
                              handleCompleteOmtAssignment(assign.id, fullTitle);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                              isDone ? 'bg-emerald-600 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>{isDone ? 'ทำเสร็จแล้ว' : 'ติ๊กทำสำเร็จ'}</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2 pt-1 border-t border-purple-100">
                          <button type="button"
                            onClick={() => {
                              setSelectedExerciseGuide({
                                id: rawExId,
                                title: fullTitle,
                                subtitle: exData?.subTitle || 'ฝึกกล้ามเนื้อปากและลิ้น OMT อย่างสม่ำเสมอ',
                                duration: '5-10 นาที',
                                description: 'ปฏิบัติทีละขั้นตอนอย่างตั้งใจเพื่อกระตุ้นพัฒนาการ',
                                steps: exData?.steps || ['วางปลายลิ้นที่จุด Spot', 'ดูดแผ่นลิ้นแนบเพดานปาก', 'กลืนน้ำลายโดยไม่เกร็งริมฝีปาก'],
                                category: 'OMT'
                              });
                            }}
                            className="text-sm text-purple-700 hover:text-purple-900 font-black flex items-center gap-1 cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>▶ เข้าฝึกด้วย Interactive Player & ดูคลิป</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center bg-purple-50/50 rounded-2xl border border-purple-100 space-y-3 flex-1">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto text-xl font-bold">
                    📋
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-800">คุณหมอยังไม่ได้มอบหมายแบบฝึกหัดประจำสัปดาห์นี้</h4>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto">
                      ระบบจะแสดงรายการแบบฝึกหัดเมื่อคุณหมอประจำตัวจัดสรรรายการการบ้านรายบุคคลให้ครับ/ค่ะ
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-3 border-t border-slate-100 shrink-0">
                <button type="button"
                  onClick={() => setShowOmtModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all cursor-pointer min-h-[44px]"
                >
                  ปิด / ยกเลิก
                </button>
                <button type="button"
                  onClick={() => handleSaveOmtHomework()}
                  className="flex-1 py-3 bg-purple-700 hover:bg-purple-800 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
                >
                  <Check className="w-4 h-4" />
                  <span>บันทึกข้อมูล OMT</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>



      {/* ========================================================================= */}
      {/* MODAL 0: DAILY SLEEP & EF LOG (GROWTH LAB SLEEP QUALITY SCORE 1-5)       */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showEfModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto prevent-pull-refresh" style={{ overscrollBehaviorY: 'contain', WebkitOverflowScrolling: 'touch' }}>
            <motion.div 
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-xl rounded-3xl p-4 sm:p-5 sm:p-6 md:p-8 shadow-2xl space-y-6 text-left max-h-[85vh] overflow-y-auto custom-scrollbar my-auto flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xl">
                    🌙
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      Growth Lab Sleep Quality Score
                    </h3>
                    <p className="text-sm text-slate-500">
                      แบบบันทึกคุณภาพการนอนและการสวมใส่อุปกรณ์ EF ประจำวัน
                    </p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowEfModal(false)}
                  className="p-2.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                  aria-label="ปิดหน้าต่างบันทึกการนอนและ EF"
                  title="ปิดหน้าต่าง"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Section 1: Sleep Schedule */}
              <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 space-y-3">
                <h4 className="text-sm font-black text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span>1. บันทึกเวลานอน (Sleep Schedule)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs sm:text-[13px] font-bold text-slate-700 block mb-1">เข้านอน (เวลา)</label>
                    <input 
                      type="time" 
                      value={efBedtime}
                      onChange={(e) => setEfBedtime(e.target.value)}
                      className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-sm font-bold text-slate-800 text-center"
                    />
                  </div>
                  <div>
                    <label className="text-xs sm:text-[13px] font-bold text-slate-700 block mb-1">หลับจริง (เวลา)</label>
                    <input 
                      type="time" 
                      value={efActualSleepTime}
                      onChange={(e) => setEfActualSleepTime(e.target.value)}
                      className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-sm font-bold text-slate-800 text-center"
                    />
                  </div>
                  <div>
                    <label className="text-xs sm:text-[13px] font-bold text-slate-700 block mb-1">ตื่นนอน (เวลา)</label>
                    <input 
                      type="time" 
                      value={efWakeTime}
                      onChange={(e) => setEfWakeTime(e.target.value)}
                      className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-sm font-bold text-slate-800 text-center"
                    />
                  </div>
                </div>

                {/* Auto Calculated Sleep Duration Banner */}
                <div className="p-3 bg-white rounded-xl border border-purple-200 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">⏱️ ชั่วโมงนอนสุทธิ (คำนวณอัตโนมัติ):</span>
                  <span className="text-sm font-black text-purple-700 bg-purple-100 px-3 py-1 rounded-lg">
                    {calculateNetSleepHours(efActualSleepTime, efWakeTime)} ชั่วโมง
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 italic">
                  คำแนะนำ AASM: เด็ก 6-12 ปี ควรนอน 9-12 ชม./วัน, อายุ 13-18 ปี ควรนอน 8-10 ชม./วัน
                </p>
              </div>

              {/* Section 2: Night Symptoms & Morning Condition */}
              <div className="space-y-3">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                  2. อาการระหว่างคืน & ความสดชื่นตอนเช้า
                </h4>

                {/* Awakenings */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-800">ตื่นกลางดึก (จำนวนครั้ง)</p>
                    <p className="text-[11px] sm:text-xs text-slate-500">สะดุ้งตื่น ตื่นมาเข้าห้องน้ำ หรือตื่นร้องงอแง</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={() => setEfNighttimeAwakenings(Math.max(0, efNighttimeAwakenings - 1))}
                      className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 font-bold text-slate-700 flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-black text-sm text-purple-900">{efNighttimeAwakenings}</span>
                    <button 
                      type="button"
                      onClick={() => setEfNighttimeAwakenings(efNighttimeAwakenings + 1)}
                      className="w-8 h-8 rounded-lg bg-purple-100 hover:bg-purple-200 font-bold text-purple-800 flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Snoring / Mouth Breathing Score */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div>
                    <p className="text-sm font-bold text-slate-800">อาการกรน / อ้าปากหายใจ</p>
                    <p className="text-[11px] sm:text-xs text-slate-500">สังเกตจากเสียงกรน หายใจติดขัด หรือนอนอ้าปาก</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { score: 0, label: '0 = ไม่เป็น' },
                      { score: 1, label: '1 = เป็นบางครั้ง' },
                      { score: 2, label: '2 = เป็นบ่อย' }
                    ].map(opt => (
                      <button
                        key={opt.score}
                        type="button"
                        onClick={() => setEfSnoringMouthBreathingScore(opt.score)}
                        className={`py-2 px-2 rounded-xl text-sm font-bold transition-all border cursor-pointer ${
                          efSnoringMouthBreathingScore === opt.score
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Morning Condition */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div>
                    <p className="text-sm font-bold text-slate-800">ความสดชื่นตอนเช้า</p>
                    <p className="text-[11px] sm:text-xs text-slate-500">สภาวะอารมณ์และความตื่นตัวหลังตื่นนอน</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { label: '🙂 สดชื่นดี', val: '🙂 สดชื่นดี' },
                      { label: '😐 ปานกลาง', val: '😐 ปานกลาง' },
                      { label: '🙁 ไม่สดชื่น', val: '🙁 ไม่สดชื่น' }
                    ].map(opt => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setEfMorningCondition(opt.val)}
                        className={`py-2 px-2 rounded-xl text-sm font-bold transition-all border cursor-pointer ${
                          efMorningCondition === opt.val
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 3: EF Appliance Wear Log */}
              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-indigo-900 uppercase tracking-wider">
                    3. การใส่อุปกรณ์ EF (EF Appliance Wear)
                  </h4>
                  <button
                    type="button"
                    onClick={() => setEfWorn(!efWorn)}
                    className={`px-3 py-1 rounded-full text-sm font-extrabold cursor-pointer transition-all ${
                      efWorn ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {efWorn ? '✓ ใส่ EF เมื่อคืน' : '✕ ไม่ได้ใส่ EF'}
                  </button>
                </div>

                {efWorn && (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-indigo-200">
                      <span className="text-sm font-bold text-slate-700">ชั่วโมงที่ใส่ EF (ชม.):</span>
                      <input 
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        value={efDurationHours}
                        onChange={(e) => setEfDurationHours(Number(e.target.value))}
                        className="w-20 p-1.5 bg-indigo-50 border border-indigo-200 rounded-lg text-center font-black text-indigo-900 text-sm"
                      />
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-indigo-200 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={efRemovedDuringNight}
                          onChange={(e) => setEfRemovedDuringNight(e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-bold text-slate-800">มีการถอดอุปกรณ์ หรือหลุดกลางดึก</span>
                      </label>
                      {efRemovedDuringNight && (
                        <input 
                          type="text"
                          placeholder="ระบุเหตุผล เช่น หลุดเอง, เจ็บฟัน, อึดอัดแน่น"
                          value={efRemovalReason}
                          onChange={(e) => setEfRemovalReason(e.target.value)}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Section 4: Sleep Quality Score 1-5 */}
              <div className="space-y-2">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                  4. คะแนนคุณภาพการนอน (Sleep Quality Score 1-5)
                </h4>
                <p className="text-xs sm:text-[13px] text-slate-500">
                  เลือกระดับคะแนนประเมินโดยรวมประจำวันนี้ตามเกณฑ์มาตรฐาน Growth Lab
                </p>

                <div className="space-y-1.5">
                  {[
                    { score: 5, bg: 'bg-emerald-50 border-emerald-300 text-emerald-950', badge: 'bg-emerald-600 text-white', label: '5 = ดีมาก', desc: 'นอนเพียงพอ หลับต่อเนื่อง หายใจปกติ ตื่นสดชื่น' },
                    { score: 4, bg: 'bg-teal-50 border-teal-300 text-teal-950', badge: 'bg-teal-600 text-white', label: '4 = ดี', desc: 'มีปัญหาเล็กน้อย แต่กลับไปหลับได้ง่าย' },
                    { score: 3, bg: 'bg-amber-50 border-amber-300 text-amber-950', badge: 'bg-amber-500 text-white', label: '3 = ปานกลาง', desc: 'เริ่มมีสิ่งรบกวน ควรปรับพฤติกรรม' },
                    { score: 2, bg: 'bg-orange-50 border-orange-300 text-orange-950', badge: 'bg-orange-500 text-white', label: '2 = ควรปรับปรุง', desc: 'ปัญหาชัดเจน ควรประเมินซ้ำ' },
                    { score: 1, bg: 'bg-rose-50 border-rose-300 text-rose-950', badge: 'bg-rose-600 text-white', label: '1 = แย่', desc: 'การนอนผิดปกติชัดเจน ควรประเมินเพิ่มเติม' }
                  ].map(item => (
                    <button
                      key={item.score}
                      type="button"
                      onClick={() => setEfSleepQualityScore(item.score)}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        efSleepQualityScore === item.score
                          ? `${item.bg} ring-2 ring-purple-600 shadow-xs font-bold`
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2 py-0.5 rounded-md text-sm font-black ${item.badge}`}>
                          {item.label}
                        </span>
                        <span className="text-sm font-medium">{item.desc}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                        efSleepQualityScore === item.score ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-300'
                      }`}>
                        {efSleepQualityScore === item.score && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 5: Notes */}
              <div className="space-y-1">
                <label className="text-xs sm:text-[13px] font-bold text-slate-600">ข้อความบันทึกเพิ่มเติม (ถ้ามี):</label>
                <input 
                  type="text" 
                  placeholder="เช่น วันนี้น้องใส่ง่าย ไม่บ่นเจ็บ นอนหลับยาว" 
                  value={efNotes}
                  onChange={(e) => setEfNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-purple-600"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button type="button"
                  onClick={() => setShowEfModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button type="button"
                  onClick={handleSaveEfAppliance}
                  disabled={isSavingEf}
                  className={`flex-1 py-3 font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isSavingEf ? 'bg-slate-400 text-white cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingEf ? 'กำลังบันทึก...' : 'บันทึกข้อมูลการนอน & EF'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 1: QUICK NUTRITION SCORE RECORDING                                  */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showNutritionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto prevent-pull-refresh" style={{ overscrollBehaviorY: 'contain', WebkitOverflowScrolling: 'touch' }}>
            <motion.div 
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-3xl p-4 sm:p-5 sm:p-6 md:p-8 shadow-2xl space-y-6 text-left max-h-[85vh] overflow-y-auto custom-scrollbar my-auto flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">บันทึกโภชนาการประจำวัน (GNS)</h3>
                    <p className="text-sm text-slate-500">ประเมินอาหารและโภชนาการ 5 หมวดหลักวันนี้</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowNutritionModal(false)}
                  className="p-2.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                  aria-label="ปิดหน้าต่างโภชนาการ"
                  title="ปิดหน้าต่าง"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 flex-1">
                {/* 1. Protein */}
                <button
                  type="button"
                  onClick={() => setGnsProtein(!gnsProtein)}
                  className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                    gnsProtein ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${gnsProtein ? 'bg-emerald-600 text-white' : 'border border-slate-300'}`}>
                      {gnsProtein && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <span className="text-sm">1. ได้รับโปรตีนคุณภาพดี (ไข่, ปลา, ไก่, เนื้อสัตว์)</span>
                  </div>
                  <span className="text-xs sm:text-[13px] font-black shrink-0">{gnsProtein ? '+20' : '0'}</span>
                </button>

                {/* 2. Calcium */}
                <button
                  type="button"
                  onClick={() => setGnsCalcium(!gnsCalcium)}
                  className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                    gnsCalcium ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${gnsCalcium ? 'bg-emerald-600 text-white' : 'border border-slate-300'}`}>
                      {gnsCalcium && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <span className="text-sm">2. แคลเซียม & วิตามินดี (นมสด 2-3 แก้ว หรือโยเกิร์ต)</span>
                  </div>
                  <span className="text-xs sm:text-[13px] font-black shrink-0">{gnsCalcium ? '+20' : '0'}</span>
                </button>

                {/* 3. Veg & Fruit */}
                <button
                  type="button"
                  onClick={() => setGnsVegFruit(!gnsVegFruit)}
                  className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                    gnsVegFruit ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${gnsVegFruit ? 'bg-emerald-600 text-white' : 'border border-slate-300'}`}>
                      {gnsVegFruit && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <span className="text-sm">3. ผักและผลไม้หลากสี มีใยอาหาร</span>
                  </div>
                  <span className="text-xs sm:text-[13px] font-black shrink-0">{gnsVegFruit ? '+20' : '0'}</span>
                </button>

                {/* 4. Food Quality */}
                <button
                  type="button"
                  onClick={() => setGnsLowSugar(!gnsLowSugar)}
                  className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                    gnsLowSugar ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${gnsLowSugar ? 'bg-emerald-600 text-white' : 'border border-slate-300'}`}>
                      {gnsLowSugar && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <span className="text-sm">4. ลดหวาน งดน้ำอัดลม ขนมกรุบกรอบ และของทอด</span>
                  </div>
                  <span className="text-xs sm:text-[13px] font-black shrink-0">{gnsLowSugar ? '+20' : '0'}</span>
                </button>

                {/* 5. Water */}
                <button
                  type="button"
                  onClick={() => setGnsWater(!gnsWater)}
                  className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                    gnsWater ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${gnsWater ? 'bg-emerald-600 text-white' : 'border border-slate-300'}`}>
                      {gnsWater && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <span className="text-sm">5. ดื่มน้ำเปล่าสะอาดเพียงพอ (6-8 แก้ว)</span>
                  </div>
                  <span className="text-xs sm:text-[13px] font-black shrink-0">{gnsWater ? '+20' : '0'}</span>
                </button>

                {/* Calculated preview */}
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between">
                  <span className="text-sm font-bold text-emerald-800">คะแนนประเมิน GNS วันนี้:</span>
                  <span className="text-xl font-black text-emerald-700">
                    {((gnsProtein ? 1 : 0) + (gnsCalcium ? 1 : 0) + (gnsVegFruit ? 1 : 0) + (gnsLowSugar ? 1 : 0) + (gnsWater ? 1 : 0)) * 20} / 100
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2 shrink-0 border-t border-slate-100">
                <button type="button"
                  onClick={() => setShowNutritionModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all cursor-pointer min-h-[44px]"
                >
                  ยกเลิก
                </button>
                <button type="button"
                  onClick={handleSaveNutrition}
                  disabled={isSavingNutrition}
                  className={`flex-1 py-3 font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px] ${isSavingNutrition ? 'bg-slate-400 text-white cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingNutrition ? 'กำลังบันทึก...' : 'บันทึกคะแนน'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 2: QUICK WEEKLY GROWTH UPDATE (HEIGHT & WEIGHT)                     */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showGrowthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto prevent-pull-refresh" style={{ overscrollBehaviorY: 'contain', WebkitOverflowScrolling: 'touch' }}>
            <motion.div 
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl p-4 sm:p-5 sm:p-6 md:p-8 shadow-2xl space-y-6 text-left max-h-[85vh] overflow-y-auto custom-scrollbar my-auto flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Ruler className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">อัปเดตข้อมูลการเติบโตประจำสัปดาห์</h3>
                    <p className="text-sm text-slate-500">บันทึกส่วนสูงและน้ำหนักล่าสุด</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowGrowthModal(false)}
                  className="p-2.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                  aria-label="ปิดหน้าต่างอัปเดตการเติบโต"
                  title="ปิดหน้าต่าง"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 flex-1">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                    <Ruler className="w-4 h-4 text-purple-600" />
                    <span>ส่วนสูงปัจจุบัน (เซนติเมตร / cm):</span>
                  </label>
                  <input 
                    type="text"
                    inputMode="decimal"
                    placeholder="ตัวอย่าง 125"
                    value={growthHeight}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                        setGrowthHeight(val);
                      }
                    }}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-purple-600"
                  />
                  {patient.height && (
                    <p className="text-xs sm:text-[13px] text-slate-400">
                      เดิม: {patient.height} ซม. {(parseFloat(growthHeight) || 0) > patient.height ? `(เพิ่มขึ้น +${((parseFloat(growthHeight) || 0) - patient.height).toFixed(1)} ซม. 🎉)` : ''}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-purple-600" />
                    <span>น้ำหนักปัจจุบัน (กิโลกรัม / kg):</span>
                  </label>
                  <input 
                    type="text"
                    inputMode="decimal"
                    placeholder="ตัวอย่าง 45.5"
                    value={growthWeight}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                        setGrowthWeight(val);
                      }
                    }}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-purple-600"
                  />
                  {patient.weight && (
                    <p className="text-xs sm:text-[13px] text-slate-400">
                      เดิม: {patient.weight} กก.
                    </p>
                  )}
                </div>

                {/* BMI Preview */}
                <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 flex items-center justify-between">
                  <span className="text-sm font-bold text-purple-900">ดัชนีมวลกายคำนวณ (BMI):</span>
                  <span className="text-base font-black text-purple-700">
                    {calculateBMI(parseFloat(growthWeight) || 0, parseFloat(growthHeight) || 0)} kg/m²
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2 shrink-0 border-t border-slate-100">
                <button type="button"
                  onClick={() => setShowGrowthModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all cursor-pointer min-h-[44px]"
                >
                  ยกเลิก
                </button>
                <button type="button"
                  onClick={handleSaveGrowth}
                  disabled={isSavingGrowth}
                  className={`flex-1 py-3 font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px] ${isSavingGrowth ? 'bg-slate-400 text-white cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingGrowth ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 3: DAILY CHECK-IN & HABIT CONFIRMATION                              */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showCheckInModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto prevent-pull-refresh" style={{ overscrollBehaviorY: 'contain', WebkitOverflowScrolling: 'touch' }}>
            <motion.div 
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl p-4 sm:p-5 sm:p-6 md:p-8 shadow-2xl space-y-6 text-left max-h-[85vh] overflow-y-auto custom-scrollbar my-auto flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">เริ่มวันใหม่ เช็กอินกันก่อนน้าาา ✨</h3>
                    <p className="text-sm text-slate-500">บันทึกกิจวัตรและการดูแลประจำวันนี้</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowCheckInModal(false)}
                  className="p-2.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                  aria-label="ปิดหน้าต่างเช็กอิน"
                  title="ปิดหน้าต่าง"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 flex-1">
                {/* 1. EF Worn */}
                <button
                  type="button"
                  onClick={() => setCheckInEfWorn(!checkInEfWorn)}
                  className={`w-full p-3.5 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                    checkInEfWorn 
                      ? 'bg-purple-50/80 border-purple-200 text-purple-950' 
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
                      checkInEfWorn ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      1
                    </div>
                    <div>
                      <p className="text-sm font-bold">สวมใส่อุปกรณ์ EF เข้านอนเมื่อคืน</p>
                      <p className="text-[11px] sm:text-xs text-slate-500">ช่วยปรับตำแหน่งขากรรไกรและการหายใจ</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    checkInEfWorn ? 'bg-purple-600 text-white' : 'border border-slate-300'
                  }`}>
                    {checkInEfWorn && <Check className="w-3.5 h-3.5" />}
                  </div>
                </button>

                {/* 2. Sleep Quality */}
                <button
                  type="button"
                  onClick={() => setCheckInGoodSleep(!checkInGoodSleep)}
                  className={`w-full p-3.5 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                    checkInGoodSleep 
                      ? 'bg-indigo-50/80 border-indigo-200 text-indigo-950' 
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
                      checkInGoodSleep ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      2
                    </div>
                    <div>
                      <p className="text-sm font-bold">นอนหลับสนิท 8+ ชั่วโมง</p>
                      <p className="text-[11px] sm:text-xs text-slate-500">เข้านอนตรงเวลาและตื่นสดชื่น</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    checkInGoodSleep ? 'bg-indigo-600 text-white' : 'border border-slate-300'
                  }`}>
                    {checkInGoodSleep && <Check className="w-3.5 h-3.5" />}
                  </div>
                </button>

                {/* 3. Nasal Breathing */}
                <button
                  type="button"
                  onClick={() => setCheckInNasalBreathe(!checkInNasalBreathe)}
                  className={`w-full p-3.5 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                    checkInNasalBreathe 
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' 
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
                      checkInNasalBreathe ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      3
                    </div>
                    <div>
                      <p className="text-sm font-bold">หายใจทางจมูก & ริมฝีปากปิดสนิท</p>
                      <p className="text-[11px] sm:text-xs text-slate-500">ไม่อ้าปากระหว่างทำกิจกรรม</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    checkInNasalBreathe ? 'bg-emerald-600 text-white' : 'border border-slate-300'
                  }`}>
                    {checkInNasalBreathe && <Check className="w-3.5 h-3.5" />}
                  </div>
                </button>

                {/* 4. Hydration */}
                <button
                  type="button"
                  onClick={() => setCheckInWater(!checkInWater)}
                  className={`w-full p-3.5 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                    checkInWater 
                      ? 'bg-sky-50/80 border-sky-200 text-sky-950' 
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
                      checkInWater ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      4
                    </div>
                    <div>
                      <p className="text-sm font-bold">ดื่มน้ำเปล่าสะอาดเพียงพอ</p>
                      <p className="text-[11px] sm:text-xs text-slate-500">ดื่มน้ำหลังตื่นนอนและตลอดวัน</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    checkInWater ? 'bg-sky-600 text-white' : 'border border-slate-300'
                  }`}>
                    {checkInWater && <Check className="w-3.5 h-3.5" />}
                  </div>
                </button>

                {/* Optional Note */}
                <div className="space-y-1 pt-1">
                  <label className="text-xs sm:text-[13px] font-bold text-slate-600">ข้อความบันทึกเพิ่มเติม (ถ้ามี):</label>
                  <input 
                    type="text" 
                    placeholder="เช่น วันนี้น้องตื่นเช้า อารมณ์ดี ทานข้าวหมดจาน" 
                    value={checkInNotes}
                    onChange={(e) => setCheckInNotes(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-purple-600"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2 shrink-0 border-t border-slate-100">
                <button type="button"
                  onClick={() => setShowCheckInModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all cursor-pointer min-h-[44px]"
                >
                  ยกเลิก
                </button>
                <button type="button"
                  onClick={handleSaveCheckIn}
                  disabled={isSavingCheckIn}
                  className={`flex-1 py-3 font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px] ${isSavingCheckIn ? 'bg-slate-400 text-white cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingCheckIn ? 'กำลังบันทึก...' : 'บันทึกการเช็กอิน'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Evidence Video Modal */}
      <AnimatePresence>
        {activeEvidenceVideo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto prevent-pull-refresh" style={{ overscrollBehaviorY: 'contain', WebkitOverflowScrolling: 'touch' }}>
            <motion.div 
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto custom-scrollbar my-auto flex flex-col"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                  <Video className="w-4 h-4 text-purple-600" />
                  <span>{activeEvidenceVideo.title}</span>
                </h3>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => handleDownloadMedia(activeEvidenceVideo.url, `growthlab_${activeEvidenceVideo.title}.mp4`)}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-sm rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 min-h-[36px]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ดาวน์โหลดคลิป</span>
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setActiveEvidenceVideo(null)}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="ปิดหน้าต่างวิดีโอ"
                    title="ปิดหน้าต่าง"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-4 sm:p-6 bg-slate-100 flex-1">
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-inner border border-slate-200">
                  <video 
                    src={activeEvidenceVideo.url} 
                    controls 
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interactive Workout Player Modal */}
      <AnimatePresence>
        {selectedExerciseGuide && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 sm:p-5 bg-slate-900/80 backdrop-blur-sm overflow-y-auto prevent-pull-refresh" style={{ overscrollBehaviorY: 'contain', WebkitOverflowScrolling: 'touch' }}>
            <motion.div 
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 text-left p-4 sm:p-6 space-y-4 my-auto max-h-[85vh] overflow-y-auto custom-scrollbar flex flex-col"
            >
              {/* Prominent Touch Friendly Close Button */}
              <button
                type="button"
                onClick={() => setSelectedExerciseGuide(null)}
                className="absolute top-3 sm:top-4 sm:p-5 right-3 sm:right-5 z-40 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5 text-sm font-bold border border-slate-200 min-h-[44px] touch-manipulation"
                aria-label="ปิดหน้าต่างแบบฝึกหัด"
                title="ปิดหน้าต่างแบบฝึกหัด"
              >
                <X className="w-4 h-4 text-slate-500 group-hover:text-rose-600" />
                <span>ปิด</span>
              </button>

              {(() => {
                const isOmtCategory = (selectedExerciseGuide as any).category === 'OMT' || selectedExerciseGuide.id.includes('tongue') || selectedExerciseGuide.id.includes('lips') || selectedExerciseGuide.id.includes('swallow') || selectedExerciseGuide.id.includes('breathing') || selectedExerciseGuide.id.includes('OMT');
                const centralMedia = getExerciseMedia(selectedExerciseGuide.id, selectedExerciseGuide.title);
                const activeUrl = centralMedia?.videoUrl || (selectedExerciseGuide as any).videoUrl || (isOmtCategory ? 'https://www.youtube.com/embed/Pyi350fPC5c' : 'https://www.youtube.com/embed/Pyi350fPC5c');
                const formatted = formatVideoEmbedUrl(activeUrl);

                const workoutItem: WorkoutExerciseItem = {
                  id: selectedExerciseGuide.id,
                  code: selectedExerciseGuide.id,
                  categoryTag: isOmtCategory ? 'OMT' : 'EXERCISE',
                  difficultyLevel: 'ปานกลาง',
                  title: selectedExerciseGuide.title,
                  subtitle: selectedExerciseGuide.subtitle,
                  description: selectedExerciseGuide.subtitle || (isOmtCategory ? 'แบบฝึกกล้ามเนื้อปากและลิ้น OMT ประจำวันเพื่อสุขภาพช่องปากและการสบฟันที่ดี' : 'แบบฝึกออกกำลังกายเพิ่มความสูงและเสริมสร้างบุคลิกภาพอย่างถูกวิธี'),
                  targetReps: isOmtCategory ? 10 : 1,
                  targetUnit: isOmtCategory ? 'ครั้ง' : 'เซ็ต',
                  recommendedDurationMinutes: isOmtCategory ? 5 : 10,
                  videoUrl: formatted.embedUrl || 'https://www.youtube.com/embed/Pyi350fPC5c',
                  steps: selectedExerciseGuide.steps,
                };

                return (
                  <InteractiveWorkoutPlayer
                    exercise={workoutItem}
                    patient={patient}
                    onBack={() => setSelectedExerciseGuide(null)}
                    onComplete={() => {
                      if (isOmtCategory) {
                        handleCompleteOmtAssignment(selectedExerciseGuide.id, selectedExerciseGuide.title);
                      } else {
                        handleCompleteGrowthExercise(selectedExerciseGuide);
                      }
                      setSelectedExerciseGuide(null);
                    }}
                    categoryType={isOmtCategory ? 'OMT' : 'EXERCISE'}
                    isCompletedToday={Boolean(completedExercisesMap[selectedExerciseGuide.id])}
                  />
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
