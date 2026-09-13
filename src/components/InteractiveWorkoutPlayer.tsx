import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Watch, RefreshCw, CheckCircle2, ArrowLeft, Check, Film, 
  Target, Clock, Award, Volume2, Info, ChevronRight, X, AlertTriangle, ShieldAlert, Activity,
  Upload, Video, Trash2, Loader2, AlertCircle, Camera, Link2, HeartPulse, CheckSquare
} from 'lucide-react';
import { Patient } from '../types';
import { GENERAL_EXERCISE_PRECAUTIONS } from '../data/growthExercisesData';
import { uploadParticipantVideo } from '../lib/firebaseStorage';
import { getExerciseMedia } from '../utils/exerciseMediaManager';
import { playSuccessChime } from '../utils/audioUtils';
import { logExerciseSession } from '../services/cloudApi';

export interface WorkoutExerciseItem {
  id: string;
  code?: string;
  categoryTag?: string; // "APPLIANCE" | "OMT" | "EXERCISE" | "JUMP & IMPACT" | "STRENGTH" | "CORE"
  difficultyLevel?: string; // "ง่าย" | "ปานกลาง" | "ยาก" | "เฉพาะท่า"
  title: string;
  subtitle?: string;
  description?: string;
  purpose?: string;
  targetReps?: number;
  targetUnit?: string;
  recommendedDurationMinutes?: number;
  videoUrl?: string;
  steps?: string[];
  instruction?: string;
  precautions?: string[];
  assignmentId?: string;
  participantVideoUrl?: string;
}

export interface WorkoutAssessmentData {
  // Movement (Default)
  softLanding?: boolean;
  kneeAlignment?: boolean;
  trunkControl?: boolean;
  // OMT
  tonguePosture?: boolean;
  lipSeal?: boolean;
  nasalBreathing?: boolean;
  // EF / Appliance
  wearTimeSufficient?: boolean;
  deviceCleaned?: boolean;
  // Vitals
  height?: number;
  
  painFree: boolean;
  needsImprovement: boolean;
  needsImprovementNote?: string;
  painPresent: boolean;
  painLocations: string[];
  painScore: number;
}

export interface InteractiveWorkoutPlayerProps {
  exercise: WorkoutExerciseItem;
  patient?: Patient;
  onBack?: () => void;
  onComplete?: (
    exerciseId: string, 
    repsCompleted: number, 
    durationSecs: number, 
    notes?: string,
    assessment?: WorkoutAssessmentData,
    participantVideoUrl?: string
  ) => void;
  categoryType?: 'OMT' | 'EF' | 'EXERCISE';
  completedRepsCount?: number;
  isCompletedToday?: boolean;
  stepIndex?: number;
  totalSteps?: number;
  hasNextStep?: boolean;
  isFinalStep?: boolean;
  onNextStep?: () => void;
  onRequestFinalConfirm?: () => void;
  isLockedToday?: boolean;
}

export default function InteractiveWorkoutPlayer({
  exercise,
  patient,
  onBack,
  onComplete,
  categoryType = 'EXERCISE',
  completedRepsCount = 0,
  isCompletedToday = false,
  stepIndex = 0,
  totalSteps = 1,
  hasNextStep = false,
  isFinalStep = false,
  onNextStep,
  onRequestFinalConfirm,
  isLockedToday = false
}: InteractiveWorkoutPlayerProps) {
  const [repsDone, setRepsDone] = useState<number>(completedRepsCount || exercise.targetReps || 1);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isDone, setIsDone] = useState<boolean>(isCompletedToday);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [userNotes, setUserNotes] = useState<string>('');
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

  // Homework Video Upload State
  const [participantVideoUrl, setParticipantVideoUrl] = useState<string | undefined>(exercise.participantVideoUrl);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Landing & Pain Assessment State
  const [softLanding, setSoftLanding] = useState<boolean>(true);
  const [kneeAlignment, setKneeAlignment] = useState<boolean>(true);
  const [trunkControl, setTrunkControl] = useState<boolean>(true);
  
  // OMT & EF Assessment State
  const [tonguePosture, setTonguePosture] = useState<boolean>(true);
  const [lipSeal, setLipSeal] = useState<boolean>(true);
  const [nasalBreathing, setNasalBreathing] = useState<boolean>(true);
  const [wearTimeSufficient, setWearTimeSufficient] = useState<boolean>(true);
  const [deviceCleaned, setDeviceCleaned] = useState<boolean>(true);
  
  // Vitals State
  const [heightInput, setHeightInput] = useState<string>('');
  const [painFree, setPainFree] = useState<boolean>(true);
  const [needsImprovement, setNeedsImprovement] = useState<boolean>(false);
  const [improvementNote, setImprovementNote] = useState<string>('');
  const [painPresent, setPainPresent] = useState<boolean>(false);
  const [selectedPainLocations, setSelectedPainLocations] = useState<string[]>([]);
  const [painScore, setPainScore] = useState<number>(0);

  // Real-time Exercise Session Time Tracker
  const startTimeRef = useRef<string>(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [sessionStartTime, setSessionStartTime] = useState<string>(startTimeRef.current);
  const [sessionEndTime, setSessionEndTime] = useState<string>('');

  // Track initial exercise start & dispatch status "กำลังทำ (In Progress)" to Google Sheets Daily_Logs
  useEffect(() => {
    const nowTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    startTimeRef.current = nowTime;
    setSessionStartTime(nowTime);

    if (patient) {
      logExerciseSession({
        hn: patient.hn || patient.id,
        patientId: patient.id,
        patientName: `${patient.firstName} ${patient.lastName || ''}`.trim() || patient.nickname,
        exerciseId: exercise.id,
        exerciseTitle: exercise.title,
        status: 'กำลังทำ (In Progress)',
        startTime: nowTime,
        reps: 0
      }).catch(err => console.warn('[InteractiveWorkoutPlayer] logExerciseSession start error:', err));
    }
  }, [exercise.id, patient?.id]);

  useEffect(() => {
    setRepsDone(completedRepsCount || exercise.targetReps || 1);
    setIsDone(isCompletedToday);
    setParticipantVideoUrl(exercise.participantVideoUrl);
  }, [completedRepsCount, isCompletedToday, exercise.targetReps, exercise.participantVideoUrl]);

  // Timer interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  const targetReps = exercise.targetReps || 1;
  const targetUnit = exercise.targetUnit || 'ครั้ง';
  const recMinutes = exercise.recommendedDurationMinutes || 5;
  const codeLabel = exercise.code || exercise.id;
  const categoryTag = exercise.categoryTag || (categoryType === 'EF' ? 'APPLIANCE' : categoryType === 'OMT' ? 'OMT' : 'EXERCISE');
  const difficulty = exercise.difficultyLevel || 'เฉพาะท่า';
  const videoSrc = exercise.videoUrl || 'https://www.youtube.com/embed/Pyi350fPC5c';

  const progressPercent = isDone ? 100 : Math.min(100, Math.round((repsDone / Math.max(1, targetReps)) * 100));

  const formatTimerDigital = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTimer = () => {
    setIsTimerRunning(true);
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
    setRepsDone(0);
    setIsDone(false);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      setUploadError('ขนาดไฟล์วิดีโอใหญ่เกินไป (สูงสุด 100MB)');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(10);

    try {
      // Create instant local blob preview
      const localUrl = URL.createObjectURL(file);
      setParticipantVideoUrl(localUrl);

      // Attempt upload to Firebase Storage if patient and assignment exist
      if (patient?.id && (exercise.assignmentId || exercise.id)) {
        try {
          const remoteUrl = await uploadParticipantVideo(
            file, 
            patient.id, 
            exercise.assignmentId || exercise.id, 
            setUploadProgress
          );
          setParticipantVideoUrl(remoteUrl);
        } catch (err) {
          console.warn('[InteractiveWorkoutPlayer] Remote storage upload skipped/failed, using local URL preview:', err);
        }
      }
      setIsUploading(false);
    } catch (err) {
      setUploadError('ไม่สามารถโหลดไฟล์วิดีโอได้ กรุณาลองใหม่อีกครั้ง');
      setIsUploading(false);
    }
  };

  const handleDeleteVideo = () => {
    setParticipantVideoUrl(undefined);
  };

  const handleSaveAndComplete = async () => {
    if (isLockedToday || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const finalReps = Math.max(1, repsDone || targetReps);
      const endNowTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const mins = Math.floor(timerSeconds / 60);
      const secs = timerSeconds % 60;
      const durationText = mins > 0 ? `${mins} นาที ${secs} วินาที` : `${secs} วินาที`;

      setSessionEndTime(endNowTime);
      setRepsDone(finalReps);
      setIsDone(true);
      setIsTimerRunning(false);
      setShowSuccessToast(true);
      playSuccessChime();

      // Log completion to Google Sheets Daily_Logs with start/end time and duration
      if (patient) {
        await logExerciseSession({
          hn: patient.hn || patient.id,
          patientId: patient.id,
          patientName: `${patient.firstName} ${patient.lastName || ''}`.trim() || patient.nickname,
          exerciseId: exercise.id,
          exerciseTitle: exercise.title,
          status: 'สำเร็จ (Completed)',
          startTime: sessionStartTime || startTimeRef.current,
          endTime: endNowTime,
          durationSeconds: timerSeconds,
          durationText: durationText,
          reps: finalReps,
          score: 100,
          notes: userNotes || ''
        }).catch(err => console.warn('[InteractiveWorkoutPlayer] logExerciseSession complete error:', err));
      }

      const assessmentPayload: WorkoutAssessmentData = {
        softLanding,
        kneeAlignment,
        trunkControl,
        tonguePosture,
        lipSeal,
        nasalBreathing,
        wearTimeSufficient,
        deviceCleaned,
        height: heightInput ? Number(heightInput) : undefined,
        painFree,
        needsImprovement,
        needsImprovementNote: improvementNote,
        painPresent,
        painLocations: selectedPainLocations,
        painScore: painPresent ? painScore : 0
      };

      if (isFinalStep && onRequestFinalConfirm) {
        // Prompt final confirmation modal from parent
        onRequestFinalConfirm();
        setShowSuccessToast(false);
        return;
      }

      if (onComplete) {
        onComplete(
          exercise.id, 
          finalReps, 
          timerSeconds, 
          userNotes, 
          assessmentPayload, 
          participantVideoUrl
        );
      }

      if (hasNextStep && onNextStep) {
        setTimeout(() => {
          setShowSuccessToast(false);
          onNextStep();
        }, 500);
      } else {
        setTimeout(() => {
          setShowSuccessToast(false);
          if (onBack) {
            onBack();
          }
        }, 1200);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsList = exercise.steps && exercise.steps.length > 0 
    ? exercise.steps 
    : [
        'ทำความสะอาดเครื่องมือและช่องปากให้เรียบร้อย',
        'ใส่เครื่องมือเข้าช่องปาก วางตำแหน่งจุดลิ้น (Tongue tag) ให้ตรง',
        'ปิดริมฝีปากให้สนิท และหายใจทางจมูก',
        'ปฏิบัติอย่างต่อเนื่องตามระยะเวลาที่แนะนำ'
      ];

  return (
    <div className="space-y-5 text-left w-full max-w-full overflow-x-hidden box-border animate-in fade-in duration-200">
      
      {/* Top Navigation & Patient Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {onBack && (
          <button type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-black text-purple-700 bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-xl border border-purple-200/80 transition-all cursor-pointer shadow-2xs self-start min-h-[44px] touch-manipulation"
            aria-label="ย้อนกลับหน้าหลัก"
          >
            <ArrowLeft className="w-4 h-4 text-purple-600" />
            <span>← กลับหน้าหลัก</span>
          </button>
        )}

        {patient && (
          <div className="bg-purple-50/80 border border-purple-200/70 px-4 py-2 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {patient.nickname ? patient.nickname.charAt(0) : (patient.firstName ? patient.firstName.charAt(0) : 'น')}
            </div>
            <div className="text-xs">
              <span className="font-black text-slate-900">
                น้อง{patient.nickname || patient.firstName} {patient.lastName ? `(${patient.firstName} ${patient.lastName})` : ''}
              </span>
              <span className="text-slate-500 font-medium ml-2">
                HN: {patient.hn || patient.id}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Progressive Mission Step Bar */}
      {totalSteps > 1 && (
        <div className="bg-white/90 border border-purple-200/80 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-600 text-white shadow-xs">
              🚀 ภารกิจด่านที่ {stepIndex + 1} / {totalSteps}
            </span>
            <span className="text-xs font-bold text-[#1C1929] truncate max-w-xs sm:max-w-md">
              {exercise.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-32 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
              <div 
                className="bg-gradient-to-r from-purple-600 to-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${Math.round(((stepIndex + 1) / totalSteps) * 100)}%` }}
              />
            </div>
            <span className="text-[11px] font-extrabold text-purple-700 font-mono">
              {Math.round(((stepIndex + 1) / totalSteps) * 100)}%
            </span>
          </div>
        </div>
      )}

      {showSuccessToast && (
        <div className="bg-emerald-600 text-white p-4 rounded-2xl text-xs font-black flex items-center justify-between shadow-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span>✓ บันทึกผล & ส่งการบ้านสำเร็จ! สถานะเปลี่ยนเป็น "🟢 ทำเรียบร้อยแล้ว" ทันที</span>
          </div>
        </div>
      )}

      {/* Main Interactive Workout Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-6">
        
        {/* HEADER SECTION: Category Tags, Title, Description & Target Box */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 border-b border-slate-100 pb-5">
          <div className="space-y-2.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-black text-white bg-[#8527D7] px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                {categoryTag}
              </span>
              <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                รหัส: {codeLabel}
              </span>
              <span className="text-[11px] font-bold text-purple-800 bg-purple-50 border border-purple-200/80 px-3 py-1 rounded-full">
                {difficulty}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-[#1C1929] tracking-tight leading-snug">
              {exercise.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              {exercise.subtitle || exercise.description || exercise.purpose || 'เพื่อปรับโครงสร้างใบหน้า ปรับตำแหน่งลิ้น และเสริมสร้างพัฒนาการช่องปาก'}
            </p>

            {/* Live Session Time & Sync Status Indicator */}
            <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 border border-slate-200/80 text-slate-700 font-bold">
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                <span>เริ่มเมื่อ: <span className="font-mono text-purple-900">{sessionStartTime} น.</span></span>
              </div>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold border ${
                isDone 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isDone ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                <span>สถานะ: {isDone ? 'ทำสำเร็จ (Complete)' : 'กำลังทำ'}</span>
              </div>
              {sessionEndTime && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-100/70 border border-emerald-200 text-emerald-900 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>เสร็จสิ้น: <span className="font-mono">{sessionEndTime} น.</span></span>
                </div>
              )}
            </div>
          </div>

          {/* TARGET SUMMARY BOX (TOP RIGHT) */}
          <div className="bg-purple-50/70 border border-purple-200/70 rounded-2xl p-4 text-xs font-bold space-y-1.5 shrink-0 lg:min-w-[220px] text-left shadow-2xs">
            <div className="flex items-center justify-between gap-2 text-purple-900">
              <span>🎯 เป้าหมาย:</span>
              <span className="text-purple-700 font-black">{targetReps} {targetUnit}</span>
            </div>
            <div className="flex items-center justify-between gap-2 text-slate-700">
              <span>⏱️ เวลาแนะนำ:</span>
              <span className="text-slate-900 font-mono font-bold">{recMinutes} นาที</span>
            </div>
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-purple-200/60">
              <span className="text-slate-500">สำเร็จแล้ว:</span>
              {isDone ? (
                <span className="text-emerald-700 font-black bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                  🟢 {repsDone} {targetUnit} (100%)
                </span>
              ) : (
                <span className="text-purple-900 font-mono font-bold">
                  {repsDone} {targetUnit} ({progressPercent}%)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* WORKOUT MEDIA PLAYER & CONTROL PANEL GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Demonstration Video & Step-by-Step Instructions */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Film className="w-4 h-4 text-purple-600" />
                <span>วิดีโอสาธิตท่าฝึก (Clinical Demonstration)</span>
              </div>
              <span className="text-[10px] font-extrabold text-purple-800 bg-purple-50 border border-purple-200/70 px-2.5 py-1 rounded-lg truncate max-w-[280px]">
                {exercise.title}
              </span>
            </div>

            {/* 2-Column Side-by-Side Video & Steps Layout (Media Library Style) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              {/* Column 1: Compact Video Card (max-w-sm ~340px) */}
              <div className="md:col-span-5 w-full max-w-sm mx-auto md:mx-0 space-y-3 shrink-0">
                <div className="aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md relative w-full flex items-center justify-center">
                  <iframe
                    src={videoSrc.includes('autoplay') ? videoSrc : `${videoSrc}?autoplay=0&rel=0`}
                    title={exercise.title}
                    className="w-full h-full border-0 absolute inset-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>

                {exercise.instruction && (
                  <div className="p-3 bg-purple-50/90 border border-purple-200/80 rounded-2xl text-xs space-y-1">
                    <span className="font-black text-purple-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                      💬 คำแนะนำพิเศษจากคลินิก
                    </span>
                    <p className="text-purple-950 font-medium leading-relaxed text-[11px]">
                      "{exercise.instruction}"
                    </p>
                  </div>
                )}
              </div>

              {/* Column 2: Step-by-Step Instructions & Demonstration Image */}
              <div className="md:col-span-7 space-y-3">
                {(() => {
                  const mediaInfo = getExerciseMedia(exercise.id, exercise.title);
                  const displayImg = mediaInfo?.imageUrl;
                  return displayImg ? (
                    <div className="rounded-2xl overflow-hidden border border-purple-100 bg-slate-100 max-h-40">
                      <img src={displayImg} alt={exercise.title} className="w-full h-40 object-cover" />
                    </div>
                  ) : null;
                })()}

                <div className="p-4 sm:p-4 bg-purple-50/50 rounded-2xl border border-purple-100/80 space-y-2.5">
                  <h3 className="text-xs sm:text-sm font-black text-purple-950 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-4 bg-purple-600 rounded-full"></span>
                    <span>ขั้นตอนการฝึกที่ถูกต้อง:</span>
                  </h3>
                  <div className="space-y-2">
                    {stepsList.map((step, idx) => (
                      <div key={idx} className="p-2.5 bg-white rounded-xl border border-purple-100 flex items-start gap-2.5 shadow-2xs">
                        <div className="w-5 h-5 rounded-full bg-[#8527D7] text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                          {idx + 1}
                        </div>
                        <p className="text-xs text-slate-800 font-medium leading-relaxed pt-0.5">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Purple Control Box & Homework Video Submission */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Control Box Container */}
            <div className="bg-purple-50/60 p-5 rounded-3xl border border-purple-200/80 space-y-4 shadow-xs">
              
              {/* Progress Bar & Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-700">ความคืบหน้ารอบการฝึก</span>
                  <span className="text-purple-800 font-mono font-black">
                    {repsDone} / {targetReps} ( {progressPercent}% )
                  </span>
                </div>
                <div className="w-full bg-white h-3 rounded-full overflow-hidden border border-purple-200/80 p-0.5">
                  <div 
                    className="bg-[#8527D7] h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* DARK PURPLE STATUS BOX (bg-[#230B48] matching IMG_3961) */}
              <div className="bg-[#230B48] text-white p-5 rounded-2xl shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-purple-800/70 pb-3">
                  <span className="text-xs font-mono uppercase tracking-wider text-purple-200 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>สถานะ: {isDone ? 'ฝึกสำเร็จแล้ว 🎉' : isTimerRunning ? 'กำลังจับเวลาฝึก...' : 'พร้อมฝึกฝน'}</span>
                  </span>
                  <span className="text-xs font-mono font-black bg-[#15042D] text-purple-200 px-3 py-1 rounded-lg border border-purple-700/60 shadow-inner">
                    {formatTimerDigital(timerSeconds)}
                  </span>
                </div>

                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-purple-900/90 border-2 border-purple-400/60 text-purple-100 font-mono font-black text-xs flex items-center justify-center shrink-0 shadow-inner">
                    {categoryTag === 'APPLIANCE' ? 'EF' : categoryTag === 'OMT' ? 'OMT' : 'EX'}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-white leading-snug">
                      กด "เริ่มฝึกวันนี้" เพื่อเริ่มจับเวลาและฝึกตามคลิป
                    </h3>
                    <p className="text-[11px] text-purple-300 font-medium leading-relaxed">
                      ดูตัวอย่างและลงมือทำพร้อมกดบันทึกผลได้ทันที
                    </p>
                  </div>
                </div>
              </div>

              {/* TIMER CONTROL BUTTONS */}
              <div className="flex gap-2 pt-1">
                {!isTimerRunning ? (
                  <button
                    type="button"
                    onClick={handleStartTimer}
                    className="flex-1 py-3.5 bg-[#8527D7] hover:bg-purple-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>▶ เริ่มฝึกวันนี้</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePauseTimer}
                    className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                  >
                    <Watch className="w-4 h-4" />
                    <span>⏸ หยุดชั่วคราว</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleResetTimer}
                  className="px-4 py-3.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  title="รีเซ็ตเวลา"
                >
                  <RefreshCw className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {/* PATIENT VIDEO SUBMISSION SECTION (ระบบส่งคลิปการบ้าน) */}
              <div className="space-y-3 bg-white p-4 rounded-2xl border border-purple-200/80 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h4 className="text-xs font-extrabold text-[#1C1929] uppercase tracking-wider flex items-center gap-2">
                    <Video className="w-4 h-4 text-purple-600" />
                    <span>ส่งคลิปวิดีโอการบ้าน (Patient Video)</span>
                  </h4>
                  {participantVideoUrl && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                      แนบคลิปแล้ว
                    </span>
                  )}
                </div>

                <input 
                  type="file" 
                  accept="video/*" 
                  capture="user"
                  className="hidden" 
                  ref={videoInputRef}
                  onChange={handleVideoUpload}
                />

                {participantVideoUrl ? (
                  <div className="space-y-2.5 pt-1">
                    {participantVideoUrl.startsWith('http') && (participantVideoUrl.includes('drive.google.com') || participantVideoUrl.includes('youtu')) ? (
                      <div className="p-3 bg-purple-50/80 rounded-xl border border-purple-200 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Link2 className="w-4 h-4 text-purple-700 shrink-0" />
                          <span className="text-xs text-purple-900 font-bold truncate">{participantVideoUrl}</span>
                        </div>
                        <a href={participantVideoUrl} target="_blank" rel="noreferrer" className="text-[10px] text-purple-700 underline shrink-0 font-bold">เปิดดู</a>
                      </div>
                    ) : (
                      <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-200 shadow-xs relative">
                        <video 
                          src={participantVideoUrl} 
                          controls 
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => videoInputRef.current?.click()}
                        className="flex-1 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs rounded-xl border border-purple-200 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" /> เปลี่ยนคลิปวิดีโอ
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteVideo}
                        className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-all cursor-pointer flex items-center justify-center"
                        title="ลบคลิปวิดีโอ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => videoInputRef.current?.click()}
                      className="w-full py-3 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 text-purple-900 border border-purple-200 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                          <span>กำลังอัปโหลดวิดีโอ {uploadProgress}%...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4 text-purple-600" />
                          <span>📹 ถ่ายคลิป / อัปโหลดวิดีโอขณะฝึก</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-2 pt-1">
                      <div className="relative flex-1">
                        <Link2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="url"
                          placeholder="หรือวางลิงก์คลิป Google Drive / YouTube"
                          defaultValue=""
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                              setParticipantVideoUrl(e.currentTarget.value.trim());
                            }
                          }}
                          onBlur={(e) => {
                            if (e.target.value.trim()) {
                              setParticipantVideoUrl(e.target.value.trim());
                            }
                          }}
                          className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-slate-50/50"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {uploadError && (
                  <div className="p-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>

              {/* POST-WORKOUT ASSESSMENT FORM (Landing Quality & Pain Screen) */}
              <div className="p-4 bg-white rounded-2xl border border-purple-200/80 shadow-2xs space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-extrabold text-[#1C1929] uppercase tracking-wider flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-emerald-600" />
                    <span>แบบประเมินคุณภาพการฝึก (Post-Workout Assessment)</span>
                  </h4>
                  <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200/60">
                    Clinic Quality Checklist
                  </span>
                </div>

                {/* Dynamic Assessment Checklist based on categoryTag */}
                <div className="space-y-2">
                  <span className="text-[11px] font-black text-slate-700 block">
                    1. ประเมินคุณภาพและการปฏิบัติตัว (Daily Assessment):
                  </span>
                  
                  {/* OMT Specific */}
                  {categoryTag === 'OMT' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <label className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold cursor-pointer transition-all ${tonguePosture ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                        <input
                          type="checkbox"
                          checked={tonguePosture}
                          onChange={(e) => setTonguePosture(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>✓ ลิ้นแตะเพดานปาก</span>
                      </label>
                      <label className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold cursor-pointer transition-all ${lipSeal ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                        <input
                          type="checkbox"
                          checked={lipSeal}
                          onChange={(e) => setLipSeal(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>✓ ปิดริมฝีปากสนิท</span>
                      </label>
                      <label className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold cursor-pointer transition-all ${nasalBreathing ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                        <input
                          type="checkbox"
                          checked={nasalBreathing}
                          onChange={(e) => setNasalBreathing(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>✓ หายใจทางจมูก</span>
                      </label>
                    </div>
                  )}

                  {/* EF / Appliance Specific */}
                  {categoryTag === 'APPLIANCE' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold cursor-pointer transition-all ${wearTimeSufficient ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                        <input
                          type="checkbox"
                          checked={wearTimeSufficient}
                          onChange={(e) => setWearTimeSufficient(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>✓ ใส่เครื่องมือครบตามเวลา</span>
                      </label>
                      <label className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold cursor-pointer transition-all ${deviceCleaned ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                        <input
                          type="checkbox"
                          checked={deviceCleaned}
                          onChange={(e) => setDeviceCleaned(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>✓ ทำความสะอาดเครื่องมือแล้ว</span>
                      </label>
                    </div>
                  )}

                  {/* Exercise Default Specific */}
                  {categoryTag !== 'OMT' && categoryTag !== 'APPLIANCE' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <label className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold cursor-pointer transition-all ${softLanding ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                        <input
                          type="checkbox"
                          checked={softLanding}
                          onChange={(e) => setSoftLanding(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>✓ ย่อเข่าซับแรงนุ่มนวล</span>
                      </label>

                      <label className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold cursor-pointer transition-all ${kneeAlignment ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                        <input
                          type="checkbox"
                          checked={kneeAlignment}
                          onChange={(e) => setKneeAlignment(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>✓ เข่าตรงไม่บิดเข้าใน</span>
                      </label>

                      <label className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold cursor-pointer transition-all ${trunkControl ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                        <input
                          type="checkbox"
                          checked={trunkControl}
                          onChange={(e) => setTrunkControl(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>✓ ลำตัวตั้งตรงมั่นคง</span>
                      </label>
                    </div>
                  )}
                  
                  {/* General Intake: Height */}
                  <div className="pt-2 mt-2 border-t border-slate-100">
                    <label className="text-[11px] font-black text-slate-700 block mb-1">
                      ส่วนสูงล่าสุด (Height) ซม. <span className="text-slate-400 font-normal">(ถ้ามี)</span>:
                    </label>
                    <input
                      type="number"
                      value={heightInput}
                      onChange={(e) => setHeightInput(e.target.value)}
                      placeholder="เช่น 120"
                      className="w-full sm:w-1/3 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                    />
                  </div>
                </div>

                {/* 2. Pain Screening */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-700">
                      2. คัดกรองอาการเจ็บปวด (Pain Screen):
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPainPresent(!painPresent);
                        if (painPresent) setPainScore(0);
                      }}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${painPresent ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'}`}
                    >
                      {painPresent ? '⚠️ มีอาการปวด/เจ็บ' : '🟢 ไม่มีอาการปวด (Pain-Free)'}
                    </button>
                  </div>

                  {painPresent && (
                    <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2.5 text-xs animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-rose-900 font-bold">ระดับความเจ็บปวด (0-10):</span>
                        <span className="font-mono font-black text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200">{painScore}/10</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={painScore}
                        onChange={(e) => setPainScore(Number(e.target.value))}
                        className="w-full accent-rose-600"
                      />
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {['เข่า', 'ข้อเท้า', 'หลัง', 'ขากรรไกร', 'กล้ามเนื้อน่อง'].map(loc => {
                          const isSel = selectedPainLocations.includes(loc);
                          return (
                            <button
                              key={loc}
                              type="button"
                              onClick={() => {
                                if (isSel) {
                                  setSelectedPainLocations(selectedPainLocations.filter(l => l !== loc));
                                } else {
                                  setSelectedPainLocations([...selectedPainLocations, loc]);
                                }
                              }}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${isSel ? 'bg-rose-600 text-white border-rose-700' : 'bg-white text-rose-800 border-rose-200 hover:bg-rose-100'}`}
                            >
                              {loc}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* PRIMARY SUBMIT BUTTON */}
              <div className="pt-2">
                {isLockedToday ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-4 text-slate-400 bg-slate-100 font-black text-sm sm:text-base rounded-2xl border border-slate-200 flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    <span>🔒 การบ้านวันนี้ถูกล็อกแล้ว (ส่งเรียบร้อย)</span>
                  </button>
                ) : hasNextStep ? (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSaveAndComplete}
                    className="w-full py-4 text-white font-black text-sm sm:text-base rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-600 hover:from-purple-700 hover:via-indigo-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>กำลังบันทึก...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5 stroke-[3]" />
                        <span>ทำสำเร็จ (Complete) & ไปท่าถัดไป</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSaveAndComplete}
                    className="w-full py-4 text-white font-black text-sm sm:text-base rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-purple-600 hover:from-emerald-700 hover:via-teal-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>กำลังบันทึกและส่งผล...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5 stroke-[3]" />
                        <span>บันทึกและส่งผล (Submit)</span>
                      </>
                    )}
                  </button>
                )}
                
                {onBack && (
                  <button
                    type="button"
                    onClick={onBack}
                    className="w-full py-3 mt-3 text-slate-600 font-bold text-sm bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    กลับหน้าหลัก
                  </button>
                )}

                <p className="text-[11px] text-slate-500 font-medium text-center mt-3">
                  {hasNextStep 
                    ? `ระบบจะ Auto-save สถานะด่านที่ ${(stepIndex || 0) + 1} และนำทางเข้าสู่ด่านที่ ${(stepIndex || 0) + 2} อัตโนมัติ`
                    : 'เมื่อบันทึกด่านสุดท้าย ระบบจะส่งคะแนนเข้า Google Sheets และแสดงหน้าต่างสรุปผล'}
                </p>
              </div>

            </div>

            {/* PRECAUTIONS FOOTER */}
            <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-[11px] space-y-1.5 text-amber-950">
              <div className="font-black text-amber-900 flex items-center gap-1.5 uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>คำแนะนำและข้อควรระวังในการฝึก</span>
              </div>
              {GENERAL_EXERCISE_PRECAUTIONS.map((pText, i) => (
                <p key={i} className="leading-relaxed font-medium">
                  • {pText}
                </p>
              ))}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

