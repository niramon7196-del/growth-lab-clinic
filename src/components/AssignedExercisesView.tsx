import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, CheckCircle2, Play, Clock, Sparkles, ShieldCheck, ArrowLeft, ChevronRight, Check, Upload, Video, Trash2, Loader2, AlertCircle, X } from 'lucide-react';
import { Patient, HomeworkAssignment, Exercise } from '../types';
import { VERIFIED_EXERCISES } from '../data';
import { getPatientAssignedExercises } from '../../exerciseHelper';
import { Logo } from "./Logo";
import NutritionTracker from "./NutritionTracker";
import SleepTracker from "./SleepTracker";
import EfLogRecord from "./EfLogRecord";
import InteractiveWorkoutPlayer, { WorkoutExerciseItem } from './InteractiveWorkoutPlayer';
import { uploadParticipantVideo, deleteParticipantVideoByUrl } from '../lib/firebaseStorage';
import { getExerciseMedia, formatVideoEmbedUrl } from '../utils/exerciseMediaManager';
import { syncHomeworkToGoogleSheets,  getWebhookUrl } from '../services/googleAppsScriptService';
import { logExerciseSession } from '../services/cloudApi';
import { ErrorBoundary } from './ErrorBoundary';

interface AssignedExercisesViewProps {
  patient: Patient;
  onBack?: () => void;
  onCompleteExercise?: (assignmentId: string) => void;
  onExerciseView?: (exerciseId: string) => void;
  onUpdatePatientNutrition?: (patientId: string, log: any) => void;
  onUpdatePatientSleep?: (patientId: string, log?: any, monthlyProfile?: any) => void;
  onUpdatePatientEfLog?: (patientId: string, log: any) => void;
  initialExerciseId?: string | null;
  onClearInitialExerciseId?: () => void;
  initialStage?: 'all' | 'gns' | 'sleep' | 'exercise' | 'omt';
  onClearInitialStage?: () => void;
  settings?: any;
}

const FALLBACK_PATIENT: Patient = {
  id: 'guest',
  hn: 'HN-GUEST',
  title: 'ผู้รับการดูแล',
  firstName: 'ผู้ใช้งาน',
  lastName: 'ทั่วไป',
  nickname: 'ผู้ใช้งาน',
  age: 0,
  gender: 'other',
  phone: '',
  startDate: new Date().toISOString().split('T')[0],
  status: 'active',
  assignments: [],
  weight: 0,
  height: 0,
  notes: ''
};

export default function AssignedExercisesView({ 
  patient: inputPatient, 
  onBack, 
  onCompleteExercise, 
  onExerciseView, 
  onUpdatePatientNutrition, 
  onUpdatePatientSleep, 
  onUpdatePatientEfLog,
  initialExerciseId,
  onClearInitialExerciseId,
  initialStage = 'gns',
  onClearInitialStage,
  settings
}: AssignedExercisesViewProps) {
  const patient = inputPatient || FALLBACK_PATIENT;
  const [selectedStageTab, setSelectedStageTab] = useState<'gns' | 'sleep' | 'exercise' | 'omt'>(() => {
    try {
      const savedPatient = localStorage.getItem(`growth_lab_assigned_stage_${patient.id}`);
      if (savedPatient && ['gns', 'sleep', 'exercise', 'omt'].includes(savedPatient)) {
        return savedPatient as any;
      }
      const savedGlobal = localStorage.getItem('growth_lab_active_homework_stage');
      if (savedGlobal && ['gns', 'sleep', 'exercise', 'omt'].includes(savedGlobal)) {
        return savedGlobal as any;
      }
    } catch {}
    return initialStage && initialStage !== 'all' ? (initialStage as any) : 'gns';
  });

  const handleStageTabChange = (stage: 'gns' | 'sleep' | 'exercise' | 'omt') => {
    setSelectedStageTab(stage);
    try {
      localStorage.setItem(`growth_lab_assigned_stage_${patient.id}`, stage);
      localStorage.setItem('growth_lab_active_homework_stage', stage);
    } catch {}
  };
  
  useEffect(() => {
    if (initialStage && initialStage !== 'all') {
      setSelectedStageTab(initialStage as any);
      try {
        localStorage.setItem(`growth_lab_assigned_stage_${patient.id}`, initialStage);
        localStorage.setItem('growth_lab_active_homework_stage', initialStage);
      } catch {}
    }
  }, [initialStage, patient.id]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showFinalConfirmModal, setShowFinalConfirmModal] = useState<boolean>(false);
  const [showHabitScoreModal, setShowHabitScoreModal] = useState<boolean>(false);
  const [habitScoreData, setHabitScoreData] = useState<{
    score: number;
    grade: string;
    streakDays: number;
    completionPercent: number;
    feedback: string;
  } | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [isLockedToday, setIsLockedToday] = useState<boolean>(() => {
    if (!patient) return false;
    try {
      const isLoc = localStorage.getItem(`growth_locked_days_${patient.id}_${todayStr}`);
      return isLoc === 'true' || Boolean(patient.lockedDates?.includes(todayStr));
    } catch {
      return false;
    }
  });

  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>(() => {
    if (!patient) return {};
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

  // Standard 4-Stage Fallback Homeworks
    const default4StageMissions: HomeworkAssignment[] = useMemo(() => [
    {
      id: `asgn_${patient.id}_posture_wall`,
      patientId: patient.id,
      exerciseId: 'posture_7',
      reps: 1,
      durationMinutes: 5,
      startDate: todayStr,
      status: 'pending' as const,
      instruction: 'ท่ายืนปรับบุคลิกภาพ (Posture Alignment & Wall Stand)'
    },
    {
      id: `asgn_${patient.id}_jump_bone`,
      patientId: patient.id,
      exerciseId: 'EX_1',
      reps: 50,
      durationMinutes: 5,
      startDate: todayStr,
      status: 'pending' as const,
      instruction: 'ท่ากระโดดกระตุ้นการเจริญเติบโต (Bone Loading)'
    },
    {
      id: `asgn_${patient.id}_spine_stretch`,
      patientId: patient.id,
      exerciseId: 'EX_2',
      reps: 10,
      durationMinutes: 5,
      startDate: todayStr,
      status: 'pending' as const,
      instruction: 'ท่ายืดเหยียดแนวกระดูกสันหลัง (Spinal Stretch)'
    },
    {
      id: `asgn_${patient.id}_tongue_spot`,
      patientId: patient.id,
      exerciseId: 'tongue_3',
      reps: 10,
      durationMinutes: 5,
      startDate: todayStr,
      status: 'pending' as const,
      instruction: 'ท่าบริหารกล้ามเนื้อช่องปากและลิ้น (Tongue/Lip Seal)'
    }
  ], [patient.id, todayStr]);

  // Get full resolved assigned exercises using centralized helper
  const assignedList = useMemo(() => {
    return getPatientAssignedExercises(VERIFIED_EXERCISES, patient);
  }, [patient]);

  // Get list of assigned homeworks for this patient
  const assignments: HomeworkAssignment[] = useMemo(() => {
    return assignedList.map((item: any) => ({
      id: item.assignmentId || item.id || `asgn_${patient.id}_${item.exerciseId || item.id}`,
      patientId: patient.id,
      exerciseId: item.exerciseId || item.id,
      reps: item.reps || item.targetReps || 10,
      durationMinutes: item.durationMinutes || 5,
      startDate: item.startDate || todayStr,
      status: item.status || 'pending',
      instruction: item.instruction || item.description || ''
    }));
  }, [assignedList, patient.id, todayStr]);

  // Map assignments to full Exercise objects
  const assignedItems = useMemo(() => {
    return assignedList.map((item: any) => {
      const asgn: HomeworkAssignment = {
        id: item.assignmentId || item.id || `asgn_${patient.id}_${item.exerciseId || item.id}`,
        patientId: patient.id,
        exerciseId: item.exerciseId || item.id,
        reps: item.reps || item.targetReps || 10,
        durationMinutes: item.durationMinutes || 5,
        startDate: item.startDate || todayStr,
        status: item.status || 'pending',
        instruction: item.instruction || item.description || ''
      };
      return {
        assignment: asgn,
        exercise: item as Exercise
      };
    });
  }, [assignedList, patient.id, todayStr]);

  // Sync initialStage changes from sidebar dropdown
  useEffect(() => {
    if (initialStage && initialStage !== 'all') {
      if ((initialStage as string) === 'wizard') {
        setSelectedStageTab('gns');
        if (assignedItems.length > 0) {
          const firstIncomplete = assignedItems.find(a => {
            const isDone = isLockedToday || completedMap[a.assignment.id] || a.assignment.status === 'completed';
            return !isDone;
          });
          setSelectedExercise(firstIncomplete ? firstIncomplete.exercise : assignedItems[0].exercise);
        }
        if (onClearInitialStage) onClearInitialStage();
      } else {
        setSelectedStageTab(initialStage as any);
        if (onClearInitialStage) onClearInitialStage();
      }
    }
  }, [initialStage, assignedItems]);

  // Filtered items based on selected stage tab
  const filteredAssignedItems = useMemo(() => {
    if (selectedStageTab === 'gns') {
      return assignedItems.filter(i => i.exercise.category === 'nutrition' || i.exercise.id === 'nutrition_gns');
    }
    if (selectedStageTab === 'sleep') {
      return assignedItems.filter(i => i.exercise.category === 'sleep' || i.exercise.category === 'appliance' || i.exercise.id.startsWith('EFA') || i.exercise.id === 'sleep_ef');
    }
    if (selectedStageTab === 'exercise') {
      return assignedItems.filter(i => 
        i.exercise.category === 'posture' || 
        i.exercise.category === 'movement' || 
        i.exercise.category === 'jump' || 
        i.exercise.category === 'strength' || 
        i.exercise.category === 'core' || 
        i.exercise.id.startsWith('EX_') || 
        i.exercise.id.startsWith('posture')
      );
    }
    if (selectedStageTab === 'omt') {
      return assignedItems.filter(i => 
        i.exercise.category === 'breathing' || 
        i.exercise.category === 'lips' || 
        i.exercise.category === 'tongue' || 
        i.exercise.category === 'swallowing' || 
        i.exercise.category === 'cheek_jaw' || 
        i.exercise.category === 'daily' ||
        i.exercise.id.startsWith('OMT') ||
        i.exercise.id.startsWith('breathing') ||
        i.exercise.id.startsWith('lips') ||
        i.exercise.id.startsWith('tongue') ||
        i.exercise.id.startsWith('swallowing') ||
        i.exercise.id.startsWith('cheek_jaw')
      );
    }
    return assignedItems;
  }, [assignedItems, selectedStageTab]);

  // Handle initialExerciseId navigation from sidebar dropdown
  useEffect(() => {
    if (initialExerciseId && assignedItems.length > 0) {
      const found = assignedItems.find(
        item => item.exercise.id === initialExerciseId || item.assignment.id === initialExerciseId || item.assignment.exerciseId === initialExerciseId
      );
      if (found) {
        setSelectedExercise(found.exercise);
        if (onExerciseView) onExerciseView(found.exercise.id);
      }
      if (onClearInitialExerciseId) {
        onClearInitialExerciseId();
      }
    }
  }, [initialExerciseId, assignedItems, onExerciseView, onClearInitialExerciseId]);

  // Automatically activate first item if a specific stage has only 1 item and user opened it directly
  useEffect(() => {
    if (initialStage && initialStage !== 'all' && filteredAssignedItems.length === 1 && !selectedExercise) {
      // Keep in view or set selected
    }
  }, [initialStage, filteredAssignedItems, selectedExercise]);

  // Real-time Exercise Start Logger: Dispatch "กำลังทำ (In Progress)" to Google Sheets Daily_Logs
  useEffect(() => {
    if (!selectedExercise || !patient || isLockedToday) return;
    const nowTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });


    logExerciseSession({
      hn: patient.hn || patient.id,
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName || ''}`.trim() || patient.nickname,
      exerciseId: selectedExercise.id,
      exerciseTitle: selectedExercise.title,
      status: 'กำลังทำ (In Progress)',
      startTime: nowTime,
      reps: 0
    }).catch(err => console.warn('[AssignedExercisesView] Start exercise log error:', err));
  }, [selectedExercise?.id, patient?.id, isLockedToday]);

  // Current step calculation
  const currentStepIndex = useMemo(() => {
    if (!selectedExercise) return 0;
    const idx = assignedItems.findIndex(
      item => item.exercise.id === selectedExercise.id || item.assignment.id === selectedExercise.id || item.assignment.exerciseId === selectedExercise.id
    );
    return Math.max(0, idx);
  }, [selectedExercise, assignedItems]);

  const totalSteps = assignedItems.length;
  const hasNextStep = currentStepIndex < totalSteps - 1;
  const isFinalStep = totalSteps > 0 && currentStepIndex === totalSteps - 1;

  // Helper to get assignment from current selected exercise
  const currentAssignment = selectedExercise ? patient.assignments?.find(a => a.exerciseId === selectedExercise.id) : null;

  const handleToggleComplete = (asgnId: string) => {
    const newCompletedMap = {
      ...completedMap,
      [asgnId]: true
    };
    setCompletedMap(newCompletedMap);

    try {
      localStorage.setItem(`growth_completed_exercises_${patient.id}_${todayStr}`, JSON.stringify(newCompletedMap));
      localStorage.setItem(`growth_completed_assignments_${patient.id}_${todayStr}`, JSON.stringify(newCompletedMap));
    } catch (e) {
      console.error(e);
    }

    if (onCompleteExercise) {
      onCompleteExercise(asgnId);
    }
  };

  const handleNextStepTransition = () => {
    if (currentStepIndex < totalSteps - 1) {
      const currentItem = assignedItems[currentStepIndex];
      if (currentItem) {
        handleToggleComplete(currentItem.assignment.id);
      }
      const nextItem = assignedItems[currentStepIndex + 1];
      setSelectedExercise(nextItem.exercise);
      if (onExerciseView) onExerciseView(nextItem.exercise.id);
    }
  };

  const calculateHabitScore = () => {
    const streak = patient.checkInHistory?.length || 1;
    const baseScore = 95;
    const bonus = Math.min(5, Math.floor(streak / 3));
    const finalScore = Math.min(100, baseScore + bonus);

    return {
      score: finalScore,
      grade: finalScore >= 98 ? 'A+ (ยอดเยี่ยมเป็นเลิศ 🌟🌟🌟)' : 'A (ยอดเยี่ยมมาก 🌟🌟)',
      streakDays: streak,
      completionPercent: 100,
      feedback: `ยินดีด้วยครับ/ค่ะ! น้อง${patient.nickname || patient.firstName} ทำการบ้านครบทุกด่านแล้ว ความมีวินัยในการฝึกอย่างสม่ำเสมอทุกวัน เป็นหัวใจสำคัญที่สุดในการสร้างการเจริญเติบโตของขากรรไกรและทางเดินหายใจที่ดีเยี่ยม`
    };
  };

  const handleFinalConfirmSubmit = () => {
    // Complete all assignments
    const newCompleted: Record<string, boolean> = { ...completedMap };
    assignedItems.forEach(item => {
      newCompleted[item.assignment.id] = true;
      if (onCompleteExercise) {
        onCompleteExercise(item.assignment.id);
      }
    });
    setCompletedMap(newCompleted);

    try {
      localStorage.setItem(`growth_completed_exercises_${patient.id}_${todayStr}`, JSON.stringify(newCompleted));
      localStorage.setItem(`growth_completed_assignments_${patient.id}_${todayStr}`, JSON.stringify(newCompleted));
      localStorage.setItem(`growth_locked_days_${patient.id}_${todayStr}`, 'true');
    } catch (e) {
      console.error(e);
    }

    setIsLockedToday(true);
    const scoreData = calculateHabitScore();
    setHabitScoreData(scoreData);
    setShowFinalConfirmModal(false);
    setSelectedExercise(null);
    setShowHabitScoreModal(true);

    // Call Google Apps Script Webhook
    const webhookUrl = getWebhookUrl();
    const completedTitles = assignedItems.map(i => i.exercise.title).join(', ');

    syncHomeworkToGoogleSheets(webhookUrl, {
      hn: patient.hn || '',
      patientId: patient.id,
      date: todayStr,
      omtScore: scoreData.score,
      exerciseScore: scoreData.score,
      sleepStatus: 'COMPLETED',
      nutritionStatus: 'COMPLETED',
      videoLink: patient.assignments?.find(a => a.videoUrl)?.videoUrl || '',
      completedExercises: assignedItems.map(i => i.exercise.id)
    }).catch(e => console.error('[AssignedExercisesView] webhook error:', e));

    logExerciseSession({
      hn: patient.hn || patient.id,
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName || ''}`.trim() || patient.nickname,
      exerciseId: 'all_homework_completed',
      exerciseTitle: `ทำการบ้านประจำวันครบทุกด่าน (${assignedItems.length} กิจกรรม: ${completedTitles})`,
      status: 'สำเร็จ (Completed)',
      startTime: '',
      score: scoreData.score,
      reps: assignedItems.length,
      notes: `เกรด: ${scoreData.grade}, ความต่อเนื่อง: ${scoreData.streakDays} วัน`
    }).catch(err => console.warn('[AssignedExercisesView] logExerciseSession complete error:', err));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="w-full max-w-full lg:max-w-4xl mx-auto space-y-6 text-left p-2 sm:p-4 md:p-6 min-h-screen overflow-y-auto overflow-x-hidden box-border"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-purple-100/80 shadow-2xs mb-4">
        <div className="space-y-0.5">
          <h1 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-600 shrink-0" />
            <span>แบบฝึกหัดที่ได้รับมอบหมาย</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            เลือกหมวดหมู่และฝึกปฏิบัติตามวิดีโอสาธิตประจำวัน
          </p>
        </div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-purple-600" />
            <span>← ย้อนกลับหน้าหลัก</span>
          </button>
        )}
      </div>

      {/* 4-Stage Navigation Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
        {[
          { id: 'gns', label: '🥗 [1] โภชนาการ (GNS)', color: 'emerald' },
          { id: 'sleep', label: '🌙 [2] การนอน & อุปกรณ์ EF', color: 'indigo' },
          { id: 'exercise', label: '🏃 [3] ออกกำลังกายเพิ่มความสูง', color: 'amber' },
          { id: 'omt', label: '👄 [4] แบบฝึกกล้ามเนื้อปาก OMT', color: 'purple' },
        ].map((tab) => {
          const isActive = selectedStageTab === tab.id;
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => {
                handleStageTabChange(tab.id as any);
                const filtered = assignedItems.filter(item => {
                  if (tab.id === 'gns') return item.exercise.category === 'nutrition';
                  if (tab.id === 'sleep') return item.exercise.category === 'sleep' || (item.exercise.category as string) === 'appliance';
                  if (tab.id === 'exercise') return item.exercise.category === 'posture' || item.exercise.category === 'movement' || item.exercise.category === 'jump' || item.exercise.category === 'strength';
                  if ((tab.id as string) === 'omt') return (item.exercise.category as string) === 'omt' || item.exercise.id.startsWith('OMT');
                  return false;
                });
                if (filtered.length > 0) {
                  const firstIncomplete = filtered.find(a => {
                    const isDone = isLockedToday || completedMap[a.assignment.id] || a.assignment.status === 'completed';
                    return !isDone;
                  });
                  setSelectedExercise(firstIncomplete ? firstIncomplete.exercise : filtered[0].exercise);
                }
              }}
              className={`px-3.5 py-2 rounded-2xl text-xs font-black shrink-0 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                isActive
                  ? 'bg-purple-700 text-white shadow-md'
                  : 'bg-white text-[#4A267A] hover:bg-purple-50 border border-purple-200/70'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Locked Status Banner if day is completed and locked */}
      {isLockedToday && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shadow-lg space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black flex items-center gap-2">
                  <span>🔒 ส่งการบ้านประจำวันนี้ครบถ้วนแล้ว</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-emerald-950">
                    บันทึกข้อมูลแล้ว
                  </span>
                </h3>
                <p className="text-xs text-emerald-200/90 font-medium">
                  คุณหมอได้รับผลการฝึกประจำวันของน้องเรียบร้อยแล้ว ข้อมูลของวันนี้ถูกล็อกเพื่อความแม่นยำ
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const scoreData = calculateHabitScore();
                setHabitScoreData(scoreData);
                setShowHabitScoreModal(true);
              }}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all shrink-0"
            >
              <span>🏆 ดูคะแนน Habit Score</span>
            </button>
          </div>
        </div>
      )}

      {/* Assigned Exercise List */}
      {filteredAssignedItems.length === 0 ? (
        <div className="p-12 text-center bg-purple-50/40 rounded-3xl border border-purple-100 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-purple-100/80 text-purple-700 flex items-center justify-center mx-auto text-2xl shadow-2xs">
            🧘
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-800">คุณหมอยังไม่ได้มอบหมายแบบฝึกหัดประจำสัปดาห์นี้</h3>
            <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
              ระบบจะแสดงรายการแบบฝึกหัดเมื่อคุณหมอประจำตัวจัดสรรรายการการบ้านประจำสัปดาห์รายบุคคลให้ครับ/ค่ะ
            </p>
          </div>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับสู่หน้าหลัก</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-extrabold text-[#1C1929] uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-600" />
              <span>ลำดับภารกิจ ({filteredAssignedItems.length} รายการ)</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              ฝึกทีละด่านและกดบันทึกเพื่อก้าวไปด่านถัดไป
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredAssignedItems.map(({ assignment, exercise }, index) => {
              const isDone = isLockedToday || completedMap[assignment.id] || assignment.status === 'completed';

              return (
                <div 
                  key={assignment.id} 
                  onClick={() => { 
                    setSelectedExercise(exercise); 
                    if (onExerciseView) onExerciseView(exercise.id); 
                  }}
                  className={`aurora-card p-5 sm:p-6 rounded-3xl border transition-all cursor-pointer ${
                    isDone 
                      ? 'bg-emerald-50/60 border-emerald-200/80' 
                      : 'bg-white border-purple-200/80 hover:border-purple-300 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-extrabold text-xs flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-purple-100/70 text-purple-800 border border-purple-200/60">
                          {exercise.category === 'nutrition' ? 'ด่านที่ 1 โภชนาการ GNS' : (exercise.category === 'sleep' || exercise.category === 'appliance') ? 'ด่านที่ 2 การนอน & EF' : (exercise.category === 'posture' || exercise.category === 'movement' || exercise.category === 'jump' || exercise.category === 'strength') ? 'ด่านที่ 3 เพิ่มความสูง & บุคลิกภาพ' : 'ด่านที่ 4 แบบฝึก OMT'} • {exercise.durationMinutes || assignment.durationMinutes || 5} นาที
                        </span>
                        {isDone ? (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <Check className="w-3 h-3" /> สำเร็จแล้ว ✓
                          </span>
                        ) : (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            ⏳ ค้างส่ง
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-[#1C1929] leading-snug">
                        {exercise.title}
                      </h3>
                      {exercise.subTitle && (
                        <p className="text-xs font-bold text-purple-700">
                          {exercise.subTitle}
                        </p>
                      )}
                      <p className="text-xs text-[#59556E] font-medium leading-relaxed">
                        {assignment.instruction || exercise.purpose || exercise.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-purple-100">
                      <button
                        type="button"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setSelectedExercise(exercise); 
                          if (onExerciseView) onExerciseView(exercise.id); 
                        }}
                        className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md min-h-[44px]"
                      >
                        <Play className="w-4 h-4 text-white" />
                        <span>{isDone ? 'ดูทบทวนด่านนี้' : `เริ่มฝึกด่านนี้`}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmation Modal upon saving final exercise */}
      <AnimatePresence>
        {showFinalConfirmModal && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto prevent-pull-refresh" style={{ overscrollBehaviorY: 'contain', WebkitOverflowScrolling: 'touch' }}>
            <motion.div 
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className="relative bg-white p-5 sm:p-8 rounded-3xl shadow-2xl border border-purple-200 max-w-md w-full text-center space-y-5 max-h-[85vh] overflow-y-auto custom-scrollbar my-auto flex flex-col"
            >
              <button
                type="button"
                onClick={() => setShowFinalConfirmModal(false)}
                className="absolute top-4 right-4 p-2.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="ปิดหน้าต่างยืนยัน"
                title="ปิดหน้าต่าง"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto text-2xl shadow-inner shrink-0">
                📝
              </div>

              <div className="space-y-2 flex-1">
                <h3 className="text-lg sm:text-xl font-black text-[#1C1929]">
                  ยืนยันการบันทึกผลการบ้านวันนี้?
                </h3>
                <p className="text-xs sm:text-sm text-[#59556E] leading-relaxed">
                  คุณต้องการยืนยันการบันทึกผลการบ้านวันนี้หรือไม่? (เมื่อบันทึกแล้วจะไม่สามารถกลับมาแก้ไขข้อมูลของวันนี้ได้)
                </p>
              </div>

              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 text-xs text-purple-900 font-bold shrink-0">
                🌟 ระบบจะทำการสรุปคะแนน Habit & Engagement Score และบันทึกประวัติการฝึกสะสมทันที
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 shrink-0 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFinalConfirmModal(false)}
                  className="py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-all cursor-pointer min-h-[44px] flex items-center justify-center"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleFinalConfirmSubmit}
                  className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-purple-600 text-white font-black text-xs shadow-lg hover:from-emerald-700 hover:to-purple-700 transition-all cursor-pointer min-h-[44px] flex items-center justify-center"
                >
                  ✓ ยืนยันบันทึกผล
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Habit & Engagement Score Modal */}
      <AnimatePresence>
        {showHabitScoreModal && habitScoreData && (
          <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto prevent-pull-refresh" style={{ overscrollBehaviorY: 'contain', WebkitOverflowScrolling: 'touch' }}>
            <motion.div 
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="relative bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-950 p-5 sm:p-8 rounded-3xl shadow-2xl border border-purple-400/40 max-w-lg w-full text-white text-center space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar my-auto flex flex-col"
            >
              <button
                type="button"
                onClick={() => {
                  setShowHabitScoreModal(false);
                  if (onBack) onBack();
                }}
                className="absolute top-4 right-4 p-2.5 rounded-full text-purple-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="ปิดหน้าต่างคะแนน"
                title="ปิดหน้าต่าง"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-2 shrink-0">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-950 flex items-center justify-center mx-auto text-4xl shadow-xl shadow-amber-500/30 ring-4 ring-white/20 animate-bounce">
                  🏆
                </div>
                <h3 className="text-2xl font-black tracking-tight text-white pt-2">
                  ยินดีด้วย! ส่งการบ้านสำเร็จแล้ว
                </h3>
                <p className="text-xs text-purple-200 font-medium">
                  น้อง{patient.nickname || patient.firstName} ทำภารกิจประจำวันครบถ้วนทุกด่าน
                </p>
              </div>

              {/* Habit Score Card */}
              <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 space-y-3 shrink-0">
                <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  คะแนนความใส่ใจและวินัยการฝึก (Habit & Engagement Score)
                </div>
                <div className="text-4xl sm:text-5xl font-black text-white font-mono flex items-center justify-center gap-1">
                  <span>{habitScoreData.score}</span>
                  <span className="text-lg sm:text-xl text-purple-300 font-sans font-bold">/ 100</span>
                </div>
                <span className="inline-block px-3 py-1 bg-amber-400/20 text-amber-300 text-xs font-extrabold rounded-full border border-amber-300/30">
                  {habitScoreData.grade}
                </span>

                <div className="grid grid-cols-2 gap-2 pt-2 text-left text-xs border-t border-white/15">
                  <div className="bg-black/20 p-2.5 rounded-xl">
                    <span className="text-purple-300 block text-[10px]">ความสม่ำเสมอต่อเนื่อง</span>
                    <span className="font-bold text-white block mt-0.5">{habitScoreData.streakDays} วันสะสม 🔥</span>
                  </div>
                  <div className="bg-black/20 p-2.5 rounded-xl">
                    <span className="text-purple-300 block text-[10px]">การส่งงานประจำวัน</span>
                    <span className="font-bold text-emerald-300 block mt-0.5">ครบ 100% (ล็อกผล) ✓</span>
                  </div>
                </div>
              </div>

              {/* Doctor Reinforcement Message */}
              <div className="p-4 rounded-2xl bg-purple-500/20 border border-purple-300/20 text-xs text-purple-100 leading-relaxed text-left shrink-0">
                <div className="font-extrabold text-amber-300 mb-1 flex items-center gap-1.5">
                  <span>💬 ข้อความเสริมแรงบวกจากคุณหมอ Growth Lab:</span>
                </div>
                {habitScoreData.feedback}
              </div>

              <div className="shrink-0 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowHabitScoreModal(false);
                    if (onBack) onBack();
                  }}
                  className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-purple-600 hover:from-emerald-400 hover:to-purple-500 text-slate-950 font-black text-sm rounded-2xl shadow-xl transition-all cursor-pointer min-h-[44px] flex items-center justify-center"
                >
                  กลับสู่หน้าหลัก
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Exercise Detail Modal with Progressive Flow */}
      <AnimatePresence>
        {selectedExercise && (
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-5 lg:p-6 animate-in fade-in duration-200 overflow-y-auto prevent-pull-refresh"
            style={{ overscrollBehaviorY: 'contain', WebkitOverflowScrolling: 'touch' }}
          >
            <motion.div 
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className="aurora-card p-4 sm:p-6 lg:p-8 rounded-3xl shadow-2xl border border-purple-200 w-full bg-white flex flex-col text-left overflow-hidden transition-all duration-300 my-auto max-h-[85vh]"
              style={{
                maxWidth: (selectedExercise.category !== 'nutrition' && selectedExercise.category !== 'sleep' && selectedExercise.category !== 'appliance') ? '1100px' : '600px',
              }}
            >
              <div className="flex items-start justify-between border-b border-purple-100 pb-4 mb-4 shrink-0">
                <div className="space-y-1 pr-4">
                  <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
                    {totalSteps > 1 ? `ภารกิจด่านที่ ${currentStepIndex + 1} จาก ${totalSteps} ด่าน` : 'หน้าต่างฝึกพร้อมวิดีโอและตัวจับเวลา'}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-[#1C1929]">{selectedExercise.title}</h3>
                </div>
                <button 
                  type="button"
                  onClick={() => setSelectedExercise(null)} 
                  className="p-2.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-purple-50 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="ปิดหน้าต่างแบบฝึกหัด"
                  title="ปิดหน้าต่าง"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto custom-scrollbar pr-1 sm:pr-2 flex-1" style={{ WebkitOverflowScrolling: 'touch' }}>
                <ErrorBoundary onReset={() => setSelectedExercise(null)}>
                {selectedExercise.category === 'nutrition' && onUpdatePatientNutrition ? (
                  <div className="mt-4 pt-2">
                    <NutritionTracker patient={patient} onUpdateNutrition={(pId, log) => {
                      onUpdatePatientNutrition(pId, log);
                      const assignmentId = assignments.find(a => a.exerciseId === selectedExercise.id)?.id;
                      if (assignmentId) handleToggleComplete(assignmentId);
                      setSelectedExercise(null);
                    }} />
                  </div>
                ) : selectedExercise.category === 'sleep' && onUpdatePatientSleep ? (
                  <div className="mt-4 pt-2">
                    <SleepTracker patients={[patient]} selectedPatientId={patient.id} onUpdatePatientSleep={(pId, log, profile) => {
                      onUpdatePatientSleep(pId, log, profile);
                      const assignmentId = assignments.find(a => a.exerciseId === selectedExercise.id)?.id;
                      if (assignmentId) handleToggleComplete(assignmentId);
                      setSelectedExercise(null);
                    }} />
                  </div>
                ) : selectedExercise.category === 'appliance' && onUpdatePatientEfLog ? (
                  <div className="mt-4 pt-2">
                    <EfLogRecord patients={[patient]} selectedPatientId={patient.id} onUpdatePatientEfLog={(pId, log) => {
                      onUpdatePatientEfLog(pId, log);
                      const assignmentId = assignments.find(a => a.exerciseId === selectedExercise.id)?.id;
                      if (assignmentId) handleToggleComplete(assignmentId);
                      setSelectedExercise(null);
                    }} />
                  </div>
                ) : (
                  (() => {
                    const centralMedia = getExerciseMedia(selectedExercise.id, selectedExercise.title);
                    const activeUrl = centralMedia?.videoUrl || selectedExercise.videoUrl || 'https://www.youtube.com/embed/Pyi350fPC5c';
                    const formatted = formatVideoEmbedUrl(activeUrl);
                    const assignment = assignments.find(a => a.exerciseId === selectedExercise.id) || assignments.find(a => a.id === selectedExercise.id);

                    const workoutItem: WorkoutExerciseItem = {
                      id: selectedExercise.id,
                      code: selectedExercise.id,
                      categoryTag: (selectedExercise.category as string) === 'appliance' ? 'APPLIANCE' : ((selectedExercise.category as string) === 'omt' || selectedExercise.id.startsWith('OMT')) ? 'OMT' : 'EXERCISE',
                      difficultyLevel: (selectedExercise as any).difficulty || 'เฉพาะท่า',
                      title: selectedExercise.title,
                      subtitle: selectedExercise.subTitle || selectedExercise.description,
                      description: selectedExercise.description,
                      purpose: selectedExercise.purpose,
                      targetReps: selectedExercise.targetReps || assignment?.reps || 1,
                      targetUnit: (selectedExercise as any).targetUnit || 'ครั้ง',
                      recommendedDurationMinutes: selectedExercise.durationMinutes || assignment?.durationMinutes || 5,
                      videoUrl: formatted.embedUrl || 'https://www.youtube.com/embed/Pyi350fPC5c',
                      steps: selectedExercise.steps,
                      instruction: assignment?.instruction || (selectedExercise as any).instruction,
                      assignmentId: assignment?.id,
                      participantVideoUrl: assignment?.participantVideoUrl
                    };

                    return (
                      <InteractiveWorkoutPlayer
                        exercise={workoutItem}
                        patient={patient}
                        onBack={() => setSelectedExercise(null)}
                        stepIndex={currentStepIndex}
                        totalSteps={totalSteps}
                        hasNextStep={hasNextStep}
                        isFinalStep={isFinalStep}
                        isLockedToday={isLockedToday}
                        onNextStep={handleNextStepTransition}
                        onRequestFinalConfirm={() => setShowFinalConfirmModal(true)}
                        onComplete={(exerciseId, repsDone, durationSecs, notes, assessment, videoUrl) => {
                          if (assignment) {
                            if (videoUrl) {
                              assignment.participantVideoUrl = videoUrl;
                              assignment.participantVideoDate = new Date().toISOString();
                            }
                            handleToggleComplete(assignment.id);
                          } else {
                            handleToggleComplete(selectedExercise.id);
                          }
                        }}
                        categoryType={(selectedExercise.category as string) === 'omt' ? 'OMT' : (selectedExercise.category as string) === 'appliance' ? 'EF' : 'EXERCISE'}
                        isCompletedToday={Boolean(completedMap[assignment?.id || selectedExercise.id])}
                      />
                    );
                  })()
                )}
                </ErrorBoundary>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export { default as ExerciseView } from './ExerciseView';
