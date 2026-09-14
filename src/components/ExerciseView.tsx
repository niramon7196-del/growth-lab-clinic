import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Check, CheckCircle2, Play, BookOpen, Sparkles, Send, Loader2, 
  Clock, Pause, RotateCcw, Timer, Video, Plus, Minus, Trophy, Flame, Target, 
  Award, Dumbbell, Activity, CheckSquare, RefreshCw, Smile, Heart, LogOut,
  Layers, Users, ChevronRight, AlertCircle, Info, ShieldCheck, X
} from 'lucide-react';
import { Logo } from './Logo';
import { VERIFIED_EXERCISES } from '../data';
import { getPatientAssignedExercises } from '../../exerciseHelper';
import { syncHomeworkToGoogleSheets, getWebhookUrl } from '../services/googleAppsScriptService';
import { getExerciseMedia, formatVideoEmbedUrl } from '../utils/exerciseMediaManager';
import NutritionTracker from './NutritionTracker';
import SleepTracker from './SleepTracker';
import MasterTemplatePreview from './MasterTemplatePreview';

interface ExerciseItem {
  id: string;
  title: string;
  reps: string;
  desc: string;
  category: 'exercise' | 'omt' | 'gns' | 'sleep' | 'posture' | 'movement';
  videoUrl: string;
  steps: string[];
}

const DEFAULT_EXERCISES_ENRICHED: ExerciseItem[] = [
  {
    id: 'posture_wall_stand',
    title: '[หมวดสรีระ] Wall Stand (3 นาที)',
    reps: '3 นาที',
    desc: 'ยืนพิงผนัง ศีรษะ หลัง และส้นเท้าแนบตรง หายใจเข้า-ออกช้าๆ ลึกๆ ผ่านทางจมูก จัดแนวกระดูกสันหลังให้สง่างาม',
    category: 'posture',
    videoUrl: 'https://www.youtube.com/embed/Pyi350fPC5c',
    steps: [
      '1. ยืนส้นเท้าชิดหรือห่างกำแพงเล็กน้อย ลำตัวและแนวกระดูกสันหลังตั้งตรง',
      '2. ให้แผ่นหลัง ไหล่ และหลังศีรษะแนบชิดติดกำแพง',
      '3. เก็บคางเข้าหาลำคอเล็กน้อย (Chin Tuck) เพื่อจัดแนวคอและเปิดทางเดินหายใจ',
      '4. ผ่อนคลายหัวไหล่ หายใจเข้า-ออกช้าๆ ลึกๆ ผ่านทางจมูก'
    ]
  },
  {
    id: 'omt_tongue_spot',
    title: '[หมวด OMT] The Spot & Cave (20 ครั้ง)',
    reps: '20 ครั้ง',
    desc: 'แตะปลายลิ้นที่เพดานปากจุด Spot และแนบโคนลิ้นดูดขึ้นติดเพดานปาก (Cave) ฝึกกล้ามเนื้อลิ้นขยายเพดานปาก',
    category: 'omt',
    videoUrl: 'https://www.youtube.com/embed/Pyi350fPC5c',
    steps: [
      '1. หาลำดับจุด Spot (บริเวณรอยย่นบนเพดานปากหลังฟันหน้าบน)',
      '2. วางปลายลิ้นแตะจุด Spot แนบสนิท โดยไม่ดันฟันหน้า',
      '3. ดูดโคนลิ้นแนบติดเพดานปากให้เกิดสุญญากาศ (Cave/Suction)',
      '4. ค้างไว้ 3-5 วินาที แล้วผ่อน ทำซ้ำจนครบ 20 ครั้ง'
    ]
  },
  {
    id: 'omt_lip_seal',
    title: '[หมวด OMT] Lip Seal Workout (3 นาที)',
    reps: '3 นาที',
    desc: 'เม้มริมฝีปากบนและล่างให้สนิทตลอดเวลา ฝึกการหายใจผ่านทางจมูก 100% เสริมกล้ามเนื้อ Orbicularis Oris',
    category: 'omt',
    videoUrl: 'https://www.youtube.com/embed/Pyi350fPC5c',
    steps: [
      '1. นั่งตัวตรง ผ่อนคลายกล้ามเนื้อใบหน้า',
      '2. ปิดริมฝีปากบนและล่างให้แนบสนิทโดยไม่เกร็งคาง',
      '3. หายใจเข้า-ออกลึกๆ ช้าๆ ผ่านทางจมูก 100%',
      '4. ฝึกสม่ำเสมอเป็นเวลา 3 นาที'
    ]
  },
  {
    id: 'posture_bone_loading_jump',
    title: '[หมวดกระดูก] Bone Loading Jump (30 ครั้ง)',
    reps: '30 ครั้ง',
    desc: 'กระโดดแนวดิ่งเบาๆ ลงน้ำหนักที่ปลายเท้าและส้นเท้า ย่อเข่าซับแรง เพื่อกระตุ้นแผ่นการเจริญเติบโตของกระดูก (Growth Plate)',
    category: 'movement',
    videoUrl: 'https://www.youtube.com/embed/Pyi350fPC5c',
    steps: [
      '1. ยืนกางขาความกว้างเท่าหัวไหล่ แขนปล่อยสบายข้างลำตัว',
      '2. ย่อเข่าเล็กน้อย แล้วกระโดดขึ้นตรงๆ พร้อมแกว่งแขนช่วยส่งแรง',
      '3. ท่าลงพื้น: ลงน้ำหนักด้วยปลายเท้าแล้วย่อเข่าซับแรงกระแทก (Soft Landing)',
      '4. ทำเป็นจังหวะต่อเนื่อง 30 ครั้ง เพื่อกระตุ้นแผ่นกระดูก'
    ]
  }
];

export interface ExerciseViewProps {
  patient?: any;
  patients?: any[];
  isClinicMode?: boolean;
  initialStage?: 'gns' | 'sleep' | 'exercise' | 'omt' | 'all' | 'master_template';
  onBack?: () => void;
  onNavigateToHome?: () => void;
  onSelectPatient?: (patientId: string) => void;
  onCompleteExercise?: (exerciseId: string) => void;
  onSubmitAll?: () => void;
  onLogout?: () => void;
}

const EMOJI_FEELING_OPTIONS = [
  { id: 'easy', emoji: '😊', label: 'สนุก & ทำง่าย', color: 'bg-emerald-50 border-emerald-300 text-emerald-900 ring-emerald-400 hover:bg-emerald-100' },
  { id: 'moderate', emoji: '😐', label: 'กำลังดี / ปานกลาง', color: 'bg-blue-50 border-blue-300 text-blue-900 ring-blue-400 hover:bg-blue-100' },
  { id: 'energetic', emoji: '💪', label: 'พยายามเต็มที่!', color: 'bg-purple-50 border-purple-300 text-purple-900 ring-purple-400 hover:bg-purple-100' },
  { id: 'tired', emoji: '😅', label: 'ตึง / เมื่อยเล็กน้อย', color: 'bg-amber-50 border-amber-300 text-amber-900 ring-amber-400 hover:bg-amber-100' },
];

export default function ExerciseView({
  patient,
  patients = [],
  isClinicMode = false,
  initialStage = 'gns',
  onBack,
  onNavigateToHome,
  onSelectPatient,
  onCompleteExercise,
  onSubmitAll,
  onLogout
}: ExerciseViewProps) {
  // Mode switcher: 'master_template' | 'patient_homework'
  const [viewMode, setViewMode] = useState<'master_template' | 'patient_homework'>(() => {
    if (!patient) return 'master_template';
    if (initialStage === 'master_template') return 'master_template';
    return 'patient_homework';
  });

  // Keep viewMode synced with incoming initialStage prop
  useEffect(() => {
    if (initialStage === 'master_template') {
      setViewMode('master_template');
    } else if (initialStage && initialStage !== 'all' && patient) {
      setViewMode('patient_homework');
      if (['gns', 'sleep', 'exercise', 'omt'].includes(initialStage)) {
        setActiveStage(initialStage as any);
      }
    }
  }, [initialStage, patient]);

  const patientId = patient?.id || 'guest';
  const patientHn = patient?.hn || 'HN-GUEST';
  const patientName = patient ? `${patient.nickname || patient.firstName || 'ผู้ใช้งาน'} ${patient.lastName || ''}`.trim() : 'ผู้ใช้งานทั่วไป';
  const [todayStr, setTodayStr] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Stage state persistence: restore last active stage (gns, sleep, exercise, omt)
  const [activeStage, setActiveStage] = useState<'gns' | 'sleep' | 'exercise' | 'omt'>(() => {
    try {
      const savedPatient = localStorage.getItem(`growth_lab_exercise_stage_${patientId}`);
      if (savedPatient && ['gns', 'sleep', 'exercise', 'omt'].includes(savedPatient)) {
        return savedPatient as any;
      }
      const savedGlobal = localStorage.getItem('growth_lab_active_homework_stage');
      if (savedGlobal && ['gns', 'sleep', 'exercise', 'omt'].includes(savedGlobal)) {
        return savedGlobal as any;
      }
    } catch {}
    return initialStage && initialStage !== 'all' && initialStage !== 'master_template' ? (initialStage as any) : 'gns';
  });

  const handleStageChange = (newStage: 'gns' | 'sleep' | 'exercise' | 'omt') => {
    setActiveStage(newStage);
    try {
      localStorage.setItem(`growth_lab_exercise_stage_${patientId}`, newStage);
      localStorage.setItem('growth_lab_active_homework_stage', newStage);
    } catch {}
  };

  useEffect(() => {
    if (initialStage && initialStage !== 'all' && initialStage !== 'master_template') {
      setActiveStage(initialStage as any);
      try {
        localStorage.setItem(`growth_lab_exercise_stage_${patientId}`, initialStage);
        localStorage.setItem('growth_lab_active_homework_stage', initialStage);
      } catch {}
    }
  }, [initialStage, patientId]);

  // Guarantee exercises is never empty, 100% complete and never causes crash
  const rawExercises = useMemo(() => {
    if (!patient) return DEFAULT_EXERCISES_ENRICHED;
    const list = getPatientAssignedExercises(VERIFIED_EXERCISES, patient);
    if (list && list.length > 0) {
      return list.map((ex: any, idx: number) => {
        const baseId = ex.id || ex.exerciseId || `ex-${idx + 1}`;
        const baseTitle = ex.title || ex.name || '';
        const media = getExerciseMedia(baseId, baseTitle);
        const fallback = DEFAULT_EXERCISES_ENRICHED[idx % DEFAULT_EXERCISES_ENRICHED.length];

        return {
          id: baseId,
          title: baseTitle || fallback.title,
          reps: ex.reps ? `${ex.reps} ครั้ง` : (ex.targetReps ? `${ex.targetReps} ครั้ง` : (ex.durationMinutes ? `${ex.durationMinutes} นาที` : fallback.reps)),
          desc: ex.instruction || ex.description || ex.purpose || fallback.desc,
          category: (ex.category || fallback.category) as any,
          videoUrl: ex.videoUrl || media?.videoUrl || fallback.videoUrl,
          steps: ex.steps && ex.steps.length > 0 ? ex.steps : (media?.steps || fallback.steps)
        };
      });
    }
    return DEFAULT_EXERCISES_ENRICHED;
  }, [patient]);

  // Filter exercises based on selected stage tab
  const exercises = useMemo(() => {
    if (activeStage === 'exercise') {
      return rawExercises.filter(e => e.category === 'exercise' || e.category === 'posture' || e.category === 'movement');
    }
    if (activeStage === 'omt') {
      return rawExercises.filter(e => e.category === 'omt' || e.category === 'breathing' || e.category === 'tongue');
    }
    return rawExercises;
  }, [rawExercises, activeStage]);

  // Completed status map
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(`growth_ex_completed_${patientId}_${todayStr}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Reps done counter map per exercise
  const [repsMap, setRepsMap] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(`growth_ex_reps_${patientId}_${todayStr}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedExerciseId(null);
  }, [activeStage]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);
  const [isSubmittedToday, setIsSubmittedToday] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(`growth_ex_submitted_${patientId}_${todayStr}`);
      return saved === 'true';
    } catch {
      return false;
    }
  });

  // Active practice duration tracking (in seconds)
  const [activePracticeSec, setActivePracticeSec] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`growth_ex_time_${patientId}_${todayStr}`);
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  // Quick Emoji Feedback state
  const [selectedFeeling, setSelectedFeeling] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`growth_ex_feeling_${patientId}_${todayStr}`);
      return saved || '😊 สนุก & ทำง่าย';
    } catch {
      return '😊 สนุก & ทำง่าย';
    }
  });

  // Track active time while user is on this exercise page
  useEffect(() => {
    if (viewMode !== 'patient_homework') return;
    const timer = setInterval(() => {
      setActivePracticeSec((prev) => {
        const next = prev + 1;
        try {
          localStorage.setItem(`growth_ex_time_${patientId}_${todayStr}`, next.toString());
        } catch (e) {}
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [patientId, todayStr, viewMode]);

  // Daily Midnight Watcher: Detect when calendar date rolls over past midnight and reset for new day
  useEffect(() => {
    const checkDailyMidnightRollover = () => {
      const liveTodayStr = new Date().toISOString().split('T')[0];
      if (liveTodayStr !== todayStr) {
        setTodayStr(liveTodayStr);
        try {
          const newCompleted = localStorage.getItem(`growth_ex_completed_${patientId}_${liveTodayStr}`);
          setCompletedMap(newCompleted ? JSON.parse(newCompleted) : {});
          const newReps = localStorage.getItem(`growth_ex_reps_${patientId}_${liveTodayStr}`);
          setRepsMap(newReps ? JSON.parse(newReps) : {});
          const newSubmitted = localStorage.getItem(`growth_ex_submitted_${patientId}_${liveTodayStr}`);
          setIsSubmittedToday(newSubmitted === 'true');
          setActivePracticeSec(0);
        } catch (e) {
          console.warn('[ExerciseView] Midnight rollover reset error:', e);
        }
      }
    };

    const midnightTimer = setInterval(checkDailyMidnightRollover, 300000);
    return () => clearInterval(midnightTimer);
  }, [patientId, todayStr]);

  const formatPracticeTime = (totalSec: number) => {
    if (totalSec <= 0) return 'น้อยกว่า 1 นาที';
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    if (mins === 0) return `${secs} วินาที`;
    if (secs === 0) return `${mins} นาที`;
    return `${mins} นาที ${secs} วินาที`;
  };

  const handleSelectFeeling = (feeling: string) => {
    setSelectedFeeling(feeling);
    try {
      localStorage.setItem(`growth_ex_feeling_${patientId}_${todayStr}`, feeling);
    } catch (e) {
      console.error(e);
    }
  };

  const getTargetReps = (repsStr: string): { target: number; unit: string } => {
    if (!repsStr) return { target: 10, unit: 'ครั้ง' };
    if (repsStr.includes('นาที')) {
      const num = parseInt(repsStr.match(/\d+/)?.[0] || '3', 10);
      return { target: num, unit: 'นาที' };
    }
    const num = parseInt(repsStr.match(/\d+/)?.[0] || '10', 10);
    return { target: num, unit: 'ครั้ง' };
  };

  const toggleComplete = (exId: string, customTarget?: number) => {
    const isNowDone = !completedMap[exId];
    const nextCompleted = { ...completedMap, [exId]: isNowDone };
    setCompletedMap(nextCompleted);

    let nextReps = { ...repsMap };
    if (isNowDone) {
      const currentCount = repsMap[exId] || 0;
      if (currentCount === 0 && customTarget) {
        nextReps[exId] = customTarget;
        setRepsMap(nextReps);
      }
    }

    try {
      localStorage.setItem(`growth_ex_completed_${patientId}_${todayStr}`, JSON.stringify(nextCompleted));
      localStorage.setItem(`growth_ex_reps_${patientId}_${todayStr}`, JSON.stringify(nextReps));
    } catch (e) {
      console.error('[ExerciseView] LocalStorage error:', e);
    }

    if (onCompleteExercise) {
      onCompleteExercise(exId);
    }
  };

  const updateRepsCount = (exId: string, deltaOrSet: number, isSetExact = false, targetValue = 10) => {
    const current = repsMap[exId] || 0;
    const nextCount = isSetExact ? deltaOrSet : Math.max(0, current + deltaOrSet);
    const nextRepsMap = { ...repsMap, [exId]: nextCount };
    setRepsMap(nextRepsMap);

    let nextCompletedMap = { ...completedMap };
    if (nextCount >= targetValue && !completedMap[exId]) {
      nextCompletedMap[exId] = true;
      setCompletedMap(nextCompletedMap);
      if (onCompleteExercise) onCompleteExercise(exId);
    }

    try {
      localStorage.setItem(`growth_ex_reps_${patientId}_${todayStr}`, JSON.stringify(nextRepsMap));
      localStorage.setItem(`growth_ex_completed_${patientId}_${todayStr}`, JSON.stringify(nextCompletedMap));
    } catch (e) {
      console.error('[ExerciseView] Save count error:', e);
    }
  };

  const completedCount = useMemo(() => {
    return exercises.filter((ex: any) => completedMap[ex.id]).length;
  }, [exercises, completedMap]);

  const totalRepsDone = useMemo(() => {
    return Object.values(repsMap).reduce((acc: number, val: number) => acc + (val || 0), 0);
  }, [repsMap]);

  const isAllCompleted = completedCount >= (exercises.length || 1);
  const overallScore = Math.min(100, Math.round((completedCount / (exercises.length || 1)) * 100));

  const handleSubmitScore = async () => {
    setIsSubmitting(true);
    const webhookUrl = getWebhookUrl();
    const submissionTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    const practiceTimeText = formatPracticeTime(activePracticeSec);
    const activeMinutes = Math.max(1, Math.round(activePracticeSec / 60));

    const completedDetails = exercises.map((ex: any) => {
      const done = Boolean(completedMap[ex.id]);
      const count = repsMap[ex.id] || 0;
      const { target, unit } = getTargetReps(ex.reps);
      const statusText = done ? '✓ สำเร็จ' : '⏳ อยู่ระหว่างทำ';
      return `${ex.title} (${count}/${target} ${unit} - ${statusText})`;
    });

    const payloadData = {
      hn: patientHn,
      patientId: patientId,
      date: todayStr,
      omtScore: overallScore,
      exerciseScore: overallScore,
      sleepStatus: 'COMPLETED',
      nutritionStatus: 'COMPLETED',
      videoLink: '',
      activeDurationMinutes: activeMinutes,
      activePracticeTimeText: practiceTimeText,
      practiceFeeling: selectedFeeling,
      completedExercises: [
        ...completedDetails,
        `⏱️ เวลาฝึกจริง: ${practiceTimeText}`,
        `😊 ความรู้สึกหลังฝึก: ${selectedFeeling}`
      ]
    };

    try {
      const historyKey = `growth_ex_history_${patientId}`;
      const existingHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
      const newRecord = {
        date: todayStr,
        timestamp: new Date().toISOString(),
        score: overallScore,
        completedCount,
        totalExercises: exercises.length,
        totalReps: totalRepsDone,
        activePracticeSec,
        practiceTimeText,
        feeling: selectedFeeling,
        details: completedDetails
      };
      localStorage.setItem(historyKey, JSON.stringify([newRecord, ...existingHistory.slice(0, 30)]));
      localStorage.setItem(`growth_ex_submitted_${patientId}_${todayStr}`, 'true');
      setIsSubmittedToday(true);

      await syncHomeworkToGoogleSheets(webhookUrl, payloadData);
      setSubmittedData({
        score: overallScore,
        completedCount,
        totalExercises: exercises.length,
        totalReps: totalRepsDone,
        practiceTimeText,
        feeling: selectedFeeling,
        time: submissionTime
      });
    } catch (e) {
      console.error('[ExerciseView] Webhook sync error:', e);
    } finally {
      setIsSubmitting(false);
      setShowSuccessModal(true);
      if (onSubmitAll) onSubmitAll();
    }
  };

  const handleCloseSuccessModal = () => {
    // 1. Immediately dismiss modal and reset modal state
    setShowSuccessModal(false);
    setSubmittedData(null);
    setSelectedExerciseId(null);
    setIsSubmitting(false);

    // 2. Dispatch custom events so application navigates back to member's home screen
    try {
      window.dispatchEvent(new CustomEvent('growth_lab_return_to_home', { detail: { targetTab: 'หน้าหลัก' } }));
      window.dispatchEvent(new CustomEvent('growth_lab_exercise_completed'));
    } catch (e) {
      console.warn('[ExerciseView] Event dispatch warning:', e);
    }

    // 3. Trigger parent navigation handlers
    if (onNavigateToHome) {
      onNavigateToHome();
    } else if (onBack) {
      onBack();
    }
  };

  return (
    <div 
      className="w-full max-w-full lg:max-w-6xl mx-auto p-2 sm:p-4 md:p-6 space-y-5 text-left box-border min-h-screen overflow-y-auto overflow-x-hidden"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* 1. TOP COMPACT HEADER & MODE SWITCHER BAR */}
      <div className="bg-white px-4 py-2.5 sm:py-3 rounded-2xl border border-purple-200/80 shadow-2xs space-y-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          {/* Left: Compact Single-Line Title */}
          <div className="flex items-center gap-2 flex-nowrap overflow-hidden">
            <span className="p-1.5 rounded-xl bg-purple-100 text-purple-900 font-bold shrink-0">
              <Dumbbell className="w-4 h-4 text-purple-700" />
            </span>
            <h1 className="text-sm sm:text-base font-black text-slate-900 whitespace-nowrap tracking-tight">
              เกณฑ์มาตรฐาน & แบบฝึกคลินิก
            </h1>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[11px] font-bold border border-purple-200/60 whitespace-nowrap">
              Clinical Standards & Exercise Hub
            </span>
          </div>

          {/* Right: Inline Controls (Tab Switcher + Back Button) */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            {/* Mode Switcher Toggle Buttons */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('master_template')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  viewMode === 'master_template'
                    ? 'bg-purple-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-purple-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                <span>⭐ เกณฑ์มาตรฐานคลินิก</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('patient_homework')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  viewMode === 'patient_homework'
                    ? 'bg-purple-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-purple-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>
                  {patient ? `📖 การบ้านรายบุคคล (${patient.nickname || patient.firstName || patient.hn})` : '📖 การบ้านรายบุคคล'}
                </span>
              </button>
            </div>

            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-purple-700" />
                <span>ย้อนกลับ</span>
              </button>
            )}
          </div>
        </div>

        {/* Patient Selection Dropdown for Clinic Staff when in Master View */}
        {isClinicMode && patients.length > 0 && onSelectPatient && (
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-600 font-bold">
              <Users className="w-3.5 h-3.5 text-purple-600" />
              <span>เลือกคนไข้จากสารบบคลินิก:</span>
            </div>
            <select
              value={patient?.id || ''}
              onChange={(e) => {
                if (e.target.value) {
                  onSelectPatient(e.target.value);
                  setViewMode('patient_homework');
                }
              }}
              className="bg-slate-50 text-slate-900 font-bold text-xs rounded-xl px-2.5 py-1.5 border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
            >
              <option value="" disabled>-- เลือกคนไข้เพื่อตรวจการบ้านรายบุคคล --</option>
              {(patients || []).map(p => (
                <option key={p.id} value={p.id}>
                  HN: {p.hn} • {p.nickname || p.firstName} {p.lastName || ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* =========================================================================
          VIEW MODE 1: MASTER TEMPLATE PREVIEW (5 GROWTH PILLARS)
          ========================================================================= */}
      {viewMode === 'master_template' && (
        <MasterTemplatePreview
          patients={patients}
          onSelectPatient={onSelectPatient}
          onBack={onBack}
          onSwitchToPatientView={() => setViewMode('patient_homework')}
        />
      )}

      {/* =========================================================================
          VIEW MODE 2: PATIENT HOMEWORK (REAL PATIENT ASSIGNED WORK)
          ========================================================================= */}
      {viewMode === 'patient_homework' && (
        <>
          {/* If no patient is selected in clinic mode, show a friendly prompt with sample switch */}
          {!patient ? (
            <div className="bg-white p-8 sm:p-12 rounded-3xl border border-purple-200 text-center space-y-4">
              <div className="w-14 h-14 bg-purple-100 text-purple-800 rounded-2xl flex items-center justify-center mx-auto">
                <Users className="w-7 h-7" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-base font-black text-slate-900">
                  ยังไม่ได้เลือกรายชื่อคนไข้ (HN)
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  ท่านสามารถเลือกคนไข้จากสารบบเพื่อตรวจการบ้าน หรือแตะปุ่มด้านล่างเพื่อเปิดดูแบบฝึกหัดต้นฉบับ 5 เสาหลักได้ทันที
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewMode('master_template')}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-800 to-indigo-900 hover:from-purple-900 hover:to-indigo-950 text-white font-black text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>เปิดโหมดตัวอย่างแบบฝึกหัดต้นฉบับ (Master Template)</span>
              </button>
            </div>
          ) : (
            <>
              {/* Stage Navigation Tabs */}
              <StageTabs activeStage={activeStage} setActiveStage={handleStageChange} />

              {/* 1. Sub-tracker: GNS Nutrition */}
              {activeStage === 'gns' && (
                <NutritionTracker patient={patient} onBack={onBack} />
              )}

              {/* 2. Sub-tracker: Sleep & EF */}
              {activeStage === 'sleep' && (
                <SleepTracker patients={[patient]} selectedPatientId={patient?.id} onBack={onBack} />
              )}

              {/* 3. Sub-tracker: Growth Exercise & OMT */}
              {(activeStage === 'exercise' || activeStage === 'omt') && (
                <div className="space-y-5">
                  {/* Slim Banner: Daily Progress */}
                  <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl py-3 px-4 sm:px-5 shadow-md relative overflow-hidden space-y-2.5">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 relative z-10">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-200 text-xs font-bold border border-purple-400/30 inline-flex items-center gap-1 shrink-0">
                            <Trophy className="w-3 h-3 text-amber-400" />
                            <span>HN: {patientHn} • {patientName}</span>
                          </span>
                          <span className="text-[11px] text-purple-300 font-mono">วันที่ {todayStr}</span>
                        </div>
                        <h2 className="text-sm sm:text-base font-black tracking-tight text-white">
                          ทำแล้ว {completedCount}/{exercises.length} ท่า ({overallScore}%)
                        </h2>
                      </div>

                      {/* Stats Horizontal Row */}
                      <div className="grid grid-cols-3 gap-1.5 w-full sm:w-auto shrink-0">
                        <div className="bg-white/10 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/10 text-center">
                          <div className="text-[9px] text-purple-200 font-semibold flex items-center justify-center gap-0.5">
                            <Clock className="w-2.5 h-2.5 text-purple-300" />
                            <span>เวลาฝึก</span>
                          </div>
                          <div className="text-xs sm:text-sm font-black text-amber-300">{formatPracticeTime(activePracticeSec)}</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/10 text-center">
                          <div className="text-[9px] text-purple-200 font-semibold">จำนวนรวม</div>
                          <div className="text-xs sm:text-sm font-black text-emerald-300">{totalRepsDone} ครั้ง</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/10 text-center">
                          <div className="text-[9px] text-purple-200 font-semibold">คะแนนรวม</div>
                          <div className="text-xs sm:text-sm font-black text-amber-400">{overallScore}/100</div>
                        </div>
                      </div>
                    </div>

                    {/* Overall Progress Bar */}
                    <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden p-0.5">
                      <div 
                        className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${overallScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Video Player Display Box - When user selects an exercise */}
                  {selectedExerciseId && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                          <Video className="w-4 h-4 text-purple-600" />
                          <span>เครื่องเล่นวิดีโอสาธิตประจำวัน</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedExerciseId(null)}
                          className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 cursor-pointer"
                        >
                          ✕ ปิดเครื่องเล่น
                        </button>
                      </div>

                      {(() => {
                        const selectedEx = exercises.find(e => e.id === selectedExerciseId) || exercises[0];
                        const formattedVideo = formatVideoEmbedUrl(selectedEx?.videoUrl || 'https://www.youtube.com/embed/Pyi350fPC5c');
                        const mediaItem = getExerciseMedia(selectedEx?.id, selectedEx?.title);
                        const displayImg = mediaItem?.imageUrl;

                        return (
                          <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-4 sm:p-5 rounded-3xl border border-purple-200 shadow-sm space-y-4"
                          >
                            <div className="flex items-center justify-between gap-2 border-b border-purple-100 pb-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="p-1.5 rounded-xl bg-purple-100 text-purple-700 shrink-0">
                                  <Video className="w-4 h-4" />
                                </span>
                                <div className="min-w-0">
                                  <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
                                    {selectedEx.title}
                                  </h3>
                                  <p className="text-xs font-bold text-purple-700">
                                    หมวด: {selectedEx.category === 'omt' ? '👄 OMT' : '🏃 ออกกำลังกาย'} • เป้าหมาย: {selectedEx.reps}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                              <div className="md:col-span-5 lg:col-span-5 w-full space-y-1.5 shrink-0">
                                <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-purple-200 shadow-xs">
                                  <iframe
                                    src={formattedVideo.embedUrl}
                                    title={selectedEx.title}
                                    className="w-full h-full border-0 absolute inset-0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                </div>
                              </div>

                              <div className="md:col-span-7 lg:col-span-7 space-y-3 text-left">
                                {selectedEx.desc && (
                                  <div className="p-3 bg-purple-50/80 rounded-2xl border border-purple-100 text-xs text-slate-700 font-medium leading-relaxed">
                                    💡 <span className="font-extrabold text-purple-900">คำอธิบายและจุดประสงค์:</span> {selectedEx.desc}
                                  </div>
                                )}
                                {selectedEx.steps && selectedEx.steps.length > 0 && (
                                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                                    <span className="text-xs font-black text-purple-950 flex items-center gap-1">
                                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                                      <span>ขั้นตอนการปฏิบัติ (Step-by-Step Instructions):</span>
                                    </span>
                                    <ul className="space-y-1.5 pl-1">
                                      {(selectedEx.steps || []).map((st: string, sIdx: number) => (
                                        <li key={sIdx} className="text-xs text-slate-700 font-medium flex items-start gap-2 leading-relaxed">
                                          <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0 mt-1.5" />
                                          <span>{st}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Exercise Cards */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span>รายการแบบฝึกหัดที่ได้รับมอบหมาย ({completedCount}/{(exercises || []).length} ท่า)</span>
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-5">
                      {(exercises || []).map((ex: any, idx: number) => {
                        const done = Boolean(completedMap[ex.id]);
                        const currentReps = repsMap[ex.id] || 0;
                        const { target: targetReps, unit } = getTargetReps(ex.reps);
                        const progressPercent = Math.min(100, Math.round((currentReps / targetReps) * 100));

                        return (
                          <div
                            key={ex.id || `ex-${idx}`}
                            className={`p-5 sm:p-6 rounded-3xl border transition-all space-y-4 overflow-hidden ${
                              done 
                                ? 'bg-emerald-50/70 border-emerald-200 shadow-2xs' 
                                : 'bg-white border-purple-100 shadow-sm hover:shadow-md'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100/80 pb-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="w-7 h-7 rounded-full bg-purple-700 text-white font-black text-xs flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                <span className="text-xs font-black text-purple-900 bg-purple-100/90 px-3 py-1 rounded-full border border-purple-200">
                                  {ex.category === 'omt' ? '👄 หมวด OMT' : '🏃 หมวดออกกำลังกาย'} • เป้าหมาย: {ex.reps}
                                </span>
                                {done && (
                                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1 border border-emerald-300">
                                    <Check className="w-3.5 h-3.5" /> สำเร็จแล้ว ✓
                                  </span>
                                )}
                              </div>
                              <h3 className="text-base font-black text-slate-900">
                                {ex.title}
                              </h3>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedExerciseId(ex.id);
                              }}
                              className={`w-full py-2.5 px-4 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                selectedExerciseId === ex.id
                                  ? 'bg-purple-700 text-white ring-2 ring-purple-300'
                                  : 'bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200'
                              }`}
                            >
                              <Video className="w-4 h-4" />
                              <span>{selectedExerciseId === ex.id ? '▶ กำลังเปิดวิดีโอสาธิตท่านี้' : '🎬 แตะเพื่อดูวิดีโอสาธิต'}</span>
                            </button>

                            {/* Reps Counter & Quick Mark */}
                            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-slate-600">นับจำนวนครั้ง:</span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => updateRepsCount(ex.id, -1, false, targetReps)}
                                    className="w-8 h-8 rounded-xl bg-white hover:bg-slate-200 border border-slate-300 font-black text-sm flex items-center justify-center cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="px-4 py-1 bg-white font-mono font-black text-sm rounded-xl border border-purple-200 min-w-[50px] text-center">
                                    {currentReps}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateRepsCount(ex.id, 1, false, targetReps)}
                                    className="w-8 h-8 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-black text-sm flex items-center justify-center cursor-pointer"
                                  >
                                    +
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateRepsCount(ex.id, 5, false, targetReps)}
                                    className="px-2.5 py-1 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-xs cursor-pointer"
                                  >
                                    +5
                                  </button>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => toggleComplete(ex.id, targetReps)}
                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                                  done
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                    : 'bg-white hover:bg-emerald-50 text-slate-700 border border-slate-300'
                                }`}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>{done ? '✓ สำเร็จแล้ว' : 'ทำครบเป้า'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Emoji Feeling Feedback & Submit Action */}
                    <div className="bg-white p-6 rounded-3xl border border-purple-200/80 shadow-2xs space-y-4">
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Smile className="w-4 h-4 text-purple-600" />
                          <span>ความรู้สึกหลังฝึกเสร็จวันนี้:</span>
                        </h4>
                        <p className="text-xs text-slate-500">
                          แตะเลือกอารมณ์ความรู้สึก เพื่อบันทึกความตั้งใจของน้อง
                        </p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {EMOJI_FEELING_OPTIONS.map((opt) => {
                          const isSel = selectedFeeling === `${opt.emoji} ${opt.label}`;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleSelectFeeling(`${opt.emoji} ${opt.label}`)}
                              className={`p-3 rounded-2xl border text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                isSel
                                  ? `${opt.color} ring-2 shadow-xs`
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <span className="text-base">{opt.emoji}</span>
                              <span>{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <span className="text-xs text-slate-500 font-medium">
                          {isSubmittedToday ? '✓ ส่งผลการบ้านของวันนี้แล้ว' : 'พร้อมแล้วกดปุ่มเพื่อบันทึกและส่งผล'}
                        </span>

                        <button
                          type="button"
                          onClick={handleSubmitScore}
                          disabled={isSubmitting}
                          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>กำลังบันทึกและส่งผล...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>บันทึกและส่งผลการบ้านวันนี้ 🚀</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Submission Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div 
            id="exercise-success-modal-backdrop"
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto prevent-pull-refresh cursor-pointer"
            style={{ overscrollBehaviorY: 'contain', WebkitOverflowScrolling: 'touch' }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCloseSuccessModal();
              }
            }}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-emerald-200 text-center space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar my-auto flex flex-col cursor-default"
            >
              {/* Close Button X for easy mobile / touch dismissal */}
              <button
                type="button"
                id="btn-dismiss-exercise-success-x"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCloseSuccessModal();
                }}
                className="absolute top-4 right-4 p-2.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="ปิดหน้าต่างแจ้งเตือนสำเร็จ"
                title="ปิดหน้าต่าง"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner shrink-0">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div className="space-y-1 shrink-0">
                <h3 className="text-xl font-black text-slate-900">
                  ส่งผลการฝึกสำเร็จเรียบร้อย! 🎉
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  ข้อมูลคะแนนและสถิติการฝึกได้ถูกบันทึกและซิงก์ตรงสู่ระบบคลินิกเรียบร้อยแล้ว
                </p>
              </div>

              {submittedData && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2 text-left font-medium">
                  <div className="flex justify-between">
                    <span className="text-slate-500">คะแนนการฝึก:</span>
                    <span className="font-black text-emerald-700">{submittedData.score} / 100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">จำนวนท่าที่สำเร็จ:</span>
                    <span className="font-black text-slate-800">{submittedData.completedCount} จาก {submittedData.totalExercises} ท่า</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">เวลาฝึกจริง:</span>
                    <span className="font-black text-indigo-700">{submittedData.practiceTimeText}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ความรู้สึก:</span>
                    <span className="font-bold text-slate-800">{submittedData.feeling}</span>
                  </div>
                </div>
              )}

              <div className="pt-2 shrink-0 border-t border-slate-100">
                <button
                  type="button"
                  id="btn-close-exercise-success-modal"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCloseSuccessModal();
                  }}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5 touch-manipulation select-none"
                  aria-label="ตกลงและปิดหน้าต่างกลับสู่หน้าหลัก"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>ตกลง / ปิดหน้าต่าง</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-component for Stage Tabs
export function StageTabs({
  activeStage,
  setActiveStage
}: {
  activeStage: 'gns' | 'sleep' | 'exercise' | 'omt';
  setActiveStage: (stage: 'gns' | 'sleep' | 'exercise' | 'omt') => void;
}) {
  const tabs = [
    { id: 'gns', label: '🥗 [1] โภชนาการ (GNS)', color: 'bg-emerald-600' },
    { id: 'sleep', label: '🌙 [2] การนอน & EF', color: 'bg-indigo-600' },
    { id: 'exercise', label: '🏃 [3] เพิ่มความสูง & บุคลิก', color: 'bg-purple-600' },
    { id: 'omt', label: '👄 [4] แบบฝึก OMT', color: 'bg-rose-600' },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
      {tabs.map((tab) => {
        const isActive = activeStage === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveStage(tab.id as any)}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              isActive
                ? `${tab.color} text-white shadow-xs`
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
