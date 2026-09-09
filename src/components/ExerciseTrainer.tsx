import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, Check, Award, Flame, Watch, Info, RefreshCw, Star, Users, Volume2, 
  ArrowLeft, CheckCircle2, Film, Brain, Activity, Calendar, Target, Zap, 
  BookOpen, ChevronRight, X, Heart, Sparkles, Shield, CheckSquare, Clock, Circle, Minus,
  Plus, Trash2, ClipboardList, Eye, CheckCircle, ExternalLink, Timer as TimerIcon, ListChecks
} from 'lucide-react';
import { Exercise, Patient, SessionLog, AnatomyPart, HabitItemStatus, EFHabitLog, HomeworkAssignment } from '../types';
import { SEED_EXERCISES, VERIFIED_EXERCISES } from '../data';
import { useScrollLock } from '../utils';
import VideoPlayer from './VideoPlayer';
import PatientContextBar from './PatientContextBar';
import InteractiveWorkoutPlayer, { WorkoutExerciseItem } from './InteractiveWorkoutPlayer';

// Define the clinical exercises for trainer
const CLINICAL_EXERCISES = VERIFIED_EXERCISES.filter(ex => ex.sourceStatus === 'VERIFIED');

interface ExerciseTrainerProps {
  patients?: Patient[];
  onAddLog?: (log: { patientId: string; date: string; exerciseId: string; repsCompleted: number; score: number; notes?: string }) => void;
  selectedPatientId?: string;
  patientId?: string;
  onSelectPatient?: (patientId: string) => void;
  onBack?: () => void;
  userRole?: any;
  activeSubTab?: string;
  logs?: SessionLog[];
}

export interface FacialAnatomyInfo {
  id: string;
  nameTh: string;
  nameEn: string;
  part: AnatomyPart;
  description: string;
  omtFunction: string;
  iconBg: string;
  relatedExercises: string[];
}

export const FACIAL_ANATOMY_DATA: FacialAnatomyInfo[] = [
  {
    id: 'lips',
    nameTh: 'ริมฝีปาก (Lips)',
    nameEn: 'Orbicularis Oris & Lip Seal',
    part: 'ริมฝีปาก',
    description: 'กล้ามเนื้อรอบริมฝีปาก ทำหน้าที่ปิดช่องปาก ควบคุมการดูด การกลืน และการออกเสียง',
    omtFunction: 'การปิดริมฝีปากสนิทขณะพัก (Lip Seal) ช่วยป้องกันการหายใจทางปาก กระตุ้นการขยายของขากรรไกร และลดฟันยื่น',
    iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
    relatedExercises: ['EF-002', 'EF-005', 'EF-008']
  },
  {
    id: 'tongue',
    nameTh: 'ลิ้นและฐานลิ้น (Tongue)',
    nameEn: 'Genioglossus & Tongue Posture',
    part: 'ลิ้น',
    description: 'มวลกล้ามเนื้อหลักในช่องปาก กำหนดรูปร่างของเพดานปากและขากรรไกรบน',
    omtFunction: 'การวางแผ่นลิ้นแนบเพดานปาก (Spot Position) ช่วยขยายโครงสร้างขากรรไกรบนตามธรรมชาติ และเปิดทางเดินหายใจส่วนบน',
    iconBg: 'bg-sky-50 text-sky-600 border-sky-200',
    relatedExercises: ['EF-003', 'EF-004', 'EF-005', 'EF-008']
  },
  {
    id: 'jaw',
    nameTh: 'ขากรรไกรและข้อต่อ (Jaw & TMJ)',
    nameEn: 'Mandible & Temporomandibular Joint',
    part: 'ขากรรไกร',
    description: 'กระดูกขากรรไกรล่างและข้อต่อขากรรไกร ควบคุมการอ้า-หุบปาก การเคี้ยว และการสบฟัน',
    omtFunction: 'จัดตำแหน่งขากรรไกรล่างไม่ให้ถอยหลังหรือเอียงข้าง ช่วยให้การสบฟันสมดุลและลดอาการเกร็งปวดข้อต่อ TMJ',
    iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    relatedExercises: ['EF-004', 'EF-006', 'EF-007', 'EF-008']
  },
  {
    id: 'cheeks',
    nameTh: 'แก้มและกล้ามเนื้อบดเคี้ยว (Cheeks)',
    nameEn: 'Buccinator & Masseter Muscles',
    part: 'แก้ม',
    description: 'กล้ามเนื้อแก้มและกล้ามเนื้อบดเคี้ยวข้างแก้ม ควบคุมการคลุกเคล้าอาหารและการสบฟัน',
    omtFunction: 'สร้างแรงเกร็งสมดุลสองข้าง ป้องกันแก้มตอบหรือแก้มเกร็งผิดวิธีเวลากลืน และช่วยรักษารูปหน้าให้ได้สัดส่วน',
    iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
    relatedExercises: ['EF-002', 'EF-005', 'EF-006', 'EF-008']
  },
  {
    id: 'airway',
    nameTh: 'ทางเดินหายใจส่วนบน (Upper Airway)',
    nameEn: 'Nasal Cavity & Pharynx',
    part: 'ทางเดินหายใจ',
    description: 'โพรงจมูก คอหอย และระบบทางเดินหายใจส่วนบน',
    omtFunction: 'การหายใจทางจมูก (Nasal Breathing) เพิ่มก๊าซไนตริกออกไซด์ (Nitric Oxide) ดักจับฝุ่นละออง และส่งเสริมการเจริญของใบหน้าส่วนกลาง',
    iconBg: 'bg-teal-50 text-teal-600 border-teal-200',
    relatedExercises: ['EF-001', 'EF-007', 'EF-008']
  }
];

// Helper to find video URL for verified exercises
const getExerciseVideoUrl = (ex: Exercise): string => {
  if (ex.videoUrl) return ex.videoUrl;
  const matched = SEED_EXERCISES.find(s => s.category === ex.category);
  return matched?.videoUrl || 'https://www.youtube.com/embed/Pyi350fPC5c';
};

// Video Guide Metadata List
const EF_VIDEO_GUIDES = [
  {
    id: 'vid_1',
    exerciseId: 'EF-001',
    title: 'วิดีโอสาธิต: การหายใจผ่านจมูก (Nasal Breathing)',
    duration: '3:45 นาที',
    videoUrl: 'https://www.youtube.com/embed/Pyi350fPC5c',
    thumbnailColor: 'from-teal-700 to-slate-900',
    category: 'การหายใจ'
  },
  {
    id: 'vid_2',
    exerciseId: 'EF-002',
    title: 'วิดีโอสาธิต: การปิดริมฝีปากสนิท (Lip Seal)',
    duration: '4:10 นาที',
    videoUrl: 'https://www.youtube.com/embed/Pyi350fPC5c',
    thumbnailColor: 'from-rose-700 to-slate-900',
    category: 'ริมฝีปาก'
  },
  {
    id: 'vid_3',
    exerciseId: 'EF-003',
    title: 'วิดีโอสาธิต: การวางลิ้นตำแหน่ง Spot (Tongue Posture)',
    duration: '5:20 นาที',
    videoUrl: 'https://www.youtube.com/embed/Pyi350fPC5c',
    thumbnailColor: 'from-sky-700 to-slate-900',
    category: 'ตำแหน่งลิ้น'
  },
  {
    id: 'vid_4',
    exerciseId: 'EF-005',
    title: 'วิดีโอสาธิต: การกลืนถูกวิธีแบบ OMT (Myofunctional Swallow)',
    duration: '4:50 นาที',
    videoUrl: 'https://www.youtube.com/embed/Pyi350fPC5c',
    thumbnailColor: 'from-purple-700 to-slate-900',
    category: 'การกลืน'
  }
];

function PatientHomeworkView({
  patientId,
  onAddLog,
  patients,
  externalHandleReset,
  completedExercises,
  setCompletedExercises
}: {
  patientId: string;
  onAddLog?: any;
  patients: Patient[];
  externalHandleReset?: () => void;
  externalCompletedReps?: number;
  externalIsTimerRunning?: boolean;
  externalElapsedSeconds?: number;
  externalHandleStart?: () => void;
  externalHandlePause?: () => void;
  completedExercises: string[];
  setCompletedExercises: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [activeAssign, setActiveAssign] = useState<any | null>(null);
  const [currentStage, setCurrentStage] = useState<'list' | 'detail' | 'train' | 'success'>('list');
  const [completedReps, setCompletedReps] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [score, setScore] = useState(8);
  const [notes, setNotes] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const activePatient = patients.find(p => p.id === patientId);

  const loadLocalAssignments = () => {
    let localList: any[] = [];
    const data = localStorage.getItem('growth_lab_assignments');
    if (data) {
      try {
        localList = JSON.parse(data).filter((a: any) => a.patientId === patientId);
      } catch (e) {}
    }

    if (localList.length > 0) {
      setAssignments(localList);
    } else if (activePatient?.assignments && activePatient.assignments.length > 0) {
      setAssignments(activePatient.assignments);
    } else {
      setAssignments([]);
    }
  };

  useEffect(() => {
    loadLocalAssignments();
    setCurrentStage('list');
    setIsTimerRunning(false);
    setCompletedReps(0);
    setElapsedSeconds(0);
    setActiveAssign(null);
  }, [patientId]);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && elapsedSeconds > 0) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, elapsedSeconds]);

  const handleStartActivity = (assign: any) => {
    setActiveAssign(assign);
    setCompletedReps(0);
    setElapsedSeconds(assign.durationMinutes * 60);
    setIsTimerRunning(false);
    setScore(8);
    setNotes('');
    setCurrentStage('detail');
  };

  const handleStartTimer = () => {
    setIsTimerRunning(true);
    setCurrentStage('train');
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setCompletedReps(0);
    setElapsedSeconds(activeAssign ? activeAssign.durationMinutes * 60 : 300);
    setScore(8);
    setNotes('');
    if (externalHandleReset) {
      externalHandleReset();
    }
  };

  const formatTimerValue = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const handleSubmitHomework = () => {
    if (!activeAssign) return;

    if (onAddLog) {
      onAddLog({
        patientId: activeAssign.patientId,
        date: new Date().toISOString().split('T')[0],
        exerciseId: activeAssign.exerciseId,
        repsCompleted: completedReps || activeAssign.reps,
        score: score,
        notes: notes || 'ส่งการบ้านจากแอปพลิเคชันฝั่งการดูแล'
      });

      if (!completedExercises.includes(activeAssign.exerciseId)) {
        const next = [...completedExercises, activeAssign.exerciseId];
        setCompletedExercises(next);
        localStorage.setItem(`growth_lab_checklist_${activeAssign.patientId}`, JSON.stringify(next));
      }
    }

    const data = localStorage.getItem('growth_lab_assignments');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        const updated = parsed.map((a: any) => {
          if (a.id === activeAssign.id) {
            return {
              ...a,
              status: 'completed',
              lastSubmittedDate: new Date().toISOString().split('T')[0]
            };
          }
          return a;
        });
        localStorage.setItem('growth_lab_assignments', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }

    setFeedbackMsg('ส่งการบ้านให้คุณหมอเรียบร้อยแล้วค่ะ! เก่งมากเลยน้อง' + (activePatient?.nickname || ''));
    loadLocalAssignments();
    setCurrentStage('success');
  };

  const getExerciseTitle = (id: string) => {
    const found = VERIFIED_EXERCISES.find(e => e.id === id);
    return found ? found.title : id;
  };

  const getExerciseObj = (id: string) => {
    return VERIFIED_EXERCISES.find(e => e.id === id);
  };

  const totalCount = assignments.length;
  const completedCount = assignments.filter((a: any) => a.status === 'completed').length;

  if (currentStage === 'success') {
    return (
      <div className="bg-white p-8 rounded-3xl text-center space-y-6 max-w-xl mx-auto border border-purple-100 shadow-sm">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-4xl mx-auto shadow-sm">
          🎉
        </div>
        <h2 className="text-2xl font-black text-slate-800">ส่งการบ้านสำเร็จ!</h2>
        <p className="text-slate-600 font-medium">{feedbackMsg}</p>
        <p className="text-xs text-slate-400">ระบบได้บันทึกการฝึกของน้องเรียบร้อยแล้ว ข้อมูลจะปรากฏในรายงานประวัติความคืบหน้าทันที</p>
        <button 
          type="button"
          onClick={() => setCurrentStage('list')}
          className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer"
        >
          กลับหน้าหลักการบ้าน
        </button>
      </div>
    );
  }

  if (currentStage === 'detail' || currentStage === 'train') {
    const exObj = getExerciseObj(activeAssign.exerciseId);
    const exerciseItem: WorkoutExerciseItem = {
      id: activeAssign.exerciseId || activeAssign.id,
      code: exObj?.id || activeAssign.exerciseId || 'OMT-01',
      categoryTag: exObj?.category ? exObj.category.toUpperCase() : 'OMT',
      difficultyLevel: exObj?.difficultyLevel || 'ปานกลาง',
      title: exObj?.title || getExerciseTitle(activeAssign.exerciseId),
      description: exObj?.purpose || exObj?.description || 'ฝึกบริหารกล้ามเนื้อช่องปากและใบหน้าอย่างถูกต้อง',
      targetReps: activeAssign.reps || 1,
      targetUnit: 'ครั้ง',
      recommendedDurationMinutes: activeAssign.durationMinutes || 5,
      videoUrl: exObj?.videoUrl || 'https://www.youtube.com/embed/Pyi350fPC5c',
      steps: exObj?.steps || [],
      instruction: activeAssign.instruction,
    };

    return (
      <InteractiveWorkoutPlayer
        exercise={exerciseItem}
        patient={activePatient}
        onBack={() => setCurrentStage('list')}
        onComplete={(exId, reps, durationSecs, userNote) => {
          setCompletedReps(reps);
          if (userNote) setNotes(userNote);
          handleSubmitHomework();
        }}
        categoryType="OMT"
        completedRepsCount={completedReps}
        isCompletedToday={activeAssign.status === 'completed'}
      />
    );
  }

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-300">
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center font-bold shadow-inner">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900">
                การบ้าน OMT ประจำวันของน้อง{activePatient?.nickname || activePatient?.firstName || 'ผู้รับการดูแล'} 🧒
              </h1>
              <p className="text-slate-500 text-xs md:text-sm">
                ตารางฝึกอบรมทักษะกล้ามเนื้อช่องปากและใบหน้าเฉพาะบุคคล
              </p>
            </div>
          </div>
          <div>
            <div className="px-4 py-2 bg-purple-50 text-purple-700 rounded-2xl text-xs font-black flex items-center gap-2 border border-purple-100">
              <CheckCircle2 className="w-4 h-4 text-purple-600" />
              <span>ส่งการบ้านแล้ว: {completedCount} / {totalCount} กิจกรรม</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-3">
        <div className="flex justify-between text-xs font-black text-slate-500 uppercase">
          <span>ความก้าวหน้าการทำการบ้านวันนี้</span>
          <span className="text-purple-600">{Math.round(totalCount > 0 ? (completedCount / totalCount) * 100 : 0)}% สำเร็จ</span>
        </div>
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/50">
          <div 
            className="bg-purple-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {assignments.length > 0 ? (
          assignments.map((assign: any) => {
            const isCompleted = assign.status === 'completed';

            return (
              <div 
                key={assign.id}
                className="bg-white p-5 md:p-6 rounded-3xl border border-slate-100 hover:border-purple-200 hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="space-y-2 text-left">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">🏋️</span>
                    <div>
                      <h3 className="text-sm md:text-base font-black text-slate-800">
                        {getExerciseTitle(assign.exerciseId)}
                      </h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-0.5">
                        เป้าหมาย: {assign.reps} ครั้ง | ฝึกอย่างน้อย {assign.durationMinutes} นาที
                      </p>
                    </div>
                  </div>

                  {assign.instruction && (
                    <div className="p-3 bg-purple-50/50 border border-purple-100/30 rounded-xl">
                      <p className="text-xs text-purple-950 font-semibold leading-relaxed">
                        💬 <strong className="text-purple-900">คุณหมอบอก:</strong> "{assign.instruction}"
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                  <div className="flex items-center justify-center">
                    {isCompleted ? (
                      <span className="bg-emerald-50 text-emerald-700 px-3.5 py-1.5 rounded-xl text-xs font-black border border-emerald-100/80 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>ส่งการบ้านแล้ว</span>
                      </span>
                    ) : (
                      <span className="bg-amber-50 text-amber-700 px-3.5 py-1.5 rounded-xl text-xs font-black border border-amber-100/80 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span>รอฝึกฝน</span>
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStartActivity(assign)}
                    className={`py-2.5 px-5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5 ${
                      isCompleted
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    <span>{isCompleted ? 'ฝึกซ้ำ / ดูวิดีโอ' : 'เริ่มฝึกและส่งการบ้าน'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="aurora-card p-12 text-center rounded-3xl border border-purple-200/60 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 text-3xl shadow-xs">
              🌟
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-800">ยังไม่มีการบ้านที่มอบหมายในขณะนี้</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                เมื่อบุคลากรทางการแพทย์หรือทันตแพทย์มอบหมายแบบฝึก OMT ประจำวัน ระบบจะแสดงตารางแบบฝึกหัดเฉพาะบุคคลของน้องที่นี่
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExerciseTrainer({
  patients = [],
  onAddLog,
  selectedPatientId,
  patientId,
  onSelectPatient,
  onBack,
  userRole,
  activeSubTab = 'ef_all',
  logs = [],
}: ExerciseTrainerProps) {
  // Navigation categories inside EF module
  const [internalSubTab, setInternalSubTab] = useState<string>(activeSubTab || 'ef_all');

  useEffect(() => {
    if (activeSubTab) {
      setInternalSubTab(activeSubTab);
    }
  }, [activeSubTab]);

  // Selected anatomy for knowledge modal / filter
  const [selectedAnatomy, setSelectedAnatomy] = useState<FacialAnatomyInfo | null>(null);
  useScrollLock(!!selectedAnatomy);

  // Filter exercises based on internalSubTab
  const filteredExercises = useMemo(() => {
    const efBase = VERIFIED_EXERCISES;
    if (!internalSubTab || internalSubTab === 'ef_all' || internalSubTab === 'ef_status' || internalSubTab === 'ef_video' || internalSubTab === 'ef_monitor' || internalSubTab === 'ef_anatomy') {
      return efBase;
    }
    if (internalSubTab === 'ef_breathing') {
      return efBase.filter(ex => ex.category === 'breathing' || ex.category === 'ventilation');
    }
    if (internalSubTab === 'ef_lips') {
      return efBase.filter(ex => ex.category === 'lips' || ex.category === 'muscle' || ex.relatedAnatomy?.includes('ริมฝีปาก'));
    }
    if (internalSubTab === 'ef_tongue') {
      return efBase.filter(ex => ex.category === 'tongue' || ex.relatedAnatomy?.includes('ลิ้น'));
    }
    if (internalSubTab === 'ef_swallowing') {
      return efBase.filter(ex => ex.category === 'swallowing');
    }
    if (internalSubTab === 'ef_cheek_jaw') {
      return efBase.filter(ex => ex.category === 'cheek_jaw' || ex.relatedAnatomy?.includes('แก้ม') || ex.relatedAnatomy?.includes('ขากรรไกร'));
    }
    if (internalSubTab === 'ef_strength') {
      return efBase.filter(ex => ex.category === 'strength' || ex.category === 'core');
    }
    if (internalSubTab === 'ef_posture') {
      return efBase.filter(ex => ex.category === 'posture' || ex.category === 'movement');
    }
    if (internalSubTab === 'ef_daily') {
      return efBase.filter(ex => ex.category === 'daily');
    }
    return efBase;
  }, [internalSubTab]);

  const [selectedExId, setSelectedExId] = useState<string>(filteredExercises[0]?.id || VERIFIED_EXERCISES[0]?.id || '');
  
  useEffect(() => {
    if (filteredExercises.length > 0 && !filteredExercises.some(ex => ex.id === selectedExId)) {
      setSelectedExId(filteredExercises[0].id);
    }
  }, [filteredExercises, selectedExId]);

  const selectedEx = VERIFIED_EXERCISES.find(ex => ex.id === selectedExId) || filteredExercises[0] || VERIFIED_EXERCISES[0];

  // Specific single video matching the selected exercise
  const currentExerciseVideo = useMemo(() => {
    if (selectedEx?.videoUrl) return selectedEx.videoUrl;
    const guide = EF_VIDEO_GUIDES.find(g => g.exerciseId === selectedEx?.id || g.category === selectedEx?.category);
    if (guide) return guide.videoUrl;
    const seed = SEED_EXERCISES.find(s => s.id === selectedEx?.id || s.category === selectedEx?.category);
    return seed?.videoUrl || 'https://www.youtube.com/embed/Pyi350fPC5c';
  }, [selectedEx]);

  const defaultPid = selectedPatientId || patientId;
  const [trainingPatientId, setTrainingPatientId] = useState<string | undefined>(defaultPid);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  useEffect(() => {
    const current = selectedPatientId || patientId;
    if (current && current !== trainingPatientId) {
      setTrainingPatientId(current);
    }
  }, [selectedPatientId, patientId]);

  const activePid = trainingPatientId || defaultPid;
  const activePatientObj = patients.find(p => p.id === activePid) || patients[0];

  // Breath Trainer Timer States
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerPhase, setTimerPhase] = useState<'idle' | 'inhale' | 'hold' | 'exhale'>('idle');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [completedReps, setCompletedReps] = useState(0);
  
  // Modals & UI States
  const [showScoreModal, setShowScoreModal] = useState(false);
  useScrollLock(showScoreModal);
  const [finalScore, setFinalScore] = useState(8);
  const [feedbackNotes, setFeedbackNotes] = useState('');

  // Checklist Drawer / Modal State
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  useScrollLock(showChecklistModal);

  // Timer Guide Modal State
  const [showTimerModal, setShowTimerModal] = useState(false);
  useScrollLock(showTimerModal);

  // Video Player Modal State
  const [activeVideoModal, setActiveVideoModal] = useState<{ url: string; title: string } | null>(null);
  useScrollLock(!!activeVideoModal);

  // Checklist State for exercise completion
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);

  useEffect(() => {
    if (activePid) {
      const saved = localStorage.getItem(`growth_lab_checklist_${activePid}`);
      if (saved) setCompletedExercises(JSON.parse(saved));
      else setCompletedExercises([]);

      resetBreatheTrainer();
    }
  }, [activePid]);

  const toggleExerciseCompletion = (exId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const pid = activePid;
    setCompletedExercises(prev => {
      const next = prev.includes(exId) ? prev.filter(id => id !== exId) : [...prev, exId];
      localStorage.setItem(`growth_lab_checklist_${pid}`, JSON.stringify(next));
      return next;
    });
  };

  // --- HABIT & BEHAVIOR MONITOR STATE ---
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedHabitDate, setSelectedHabitDate] = useState<string>(todayStr);
  const [habitLogs, setHabitLogs] = useState<Record<string, EFHabitLog>>({});

  useEffect(() => {
    if (!activePid) return;
    const storageKey = `growth_lab_habit_${activePid}_${selectedHabitDate}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setHabitLogs(prev => ({ ...prev, [`${activePid}_${selectedHabitDate}`]: JSON.parse(saved) }));
      } catch (e) {
        console.error("Error loading habit log", e);
      }
    } else {
      const defaultLog: EFHabitLog = {
        id: `habit_${activePid}_${selectedHabitDate}`,
        patientId: activePid,
        date: selectedHabitDate,
        breathing: 'completed',
        lipSeal: 'completed',
        tonguePosture: 'completed',
        swallowing: 'pending',
        muscleRelaxation: 'completed',
        posture: 'pending',
        exerciseExecution: 'completed',
        notes: 'ผู้รับการดูแลตั้งใจฝึกได้ดี ตอบสนองต่อการฝึกหายใจผ่านจมูก 100%'
      };
      setHabitLogs(prev => ({ ...prev, [`${activePid}_${selectedHabitDate}`]: defaultLog }));
    }
  }, [activePid, selectedHabitDate]);

  const currentHabitLog: EFHabitLog = habitLogs[`${activePid}_${selectedHabitDate}`] || {
    id: `habit_${activePid}_${selectedHabitDate}`,
    patientId: activePid,
    date: selectedHabitDate,
    breathing: 'completed',
    lipSeal: 'completed',
    tonguePosture: 'completed',
    swallowing: 'pending',
    muscleRelaxation: 'completed',
    posture: 'pending',
    exerciseExecution: 'completed',
  };

  const updateHabitItemStatus = (itemKey: keyof Omit<EFHabitLog, 'id' | 'patientId' | 'date' | 'notes'>, status: HabitItemStatus) => {
    const updated = {
      ...currentHabitLog,
      [itemKey]: status
    };
    const key = `${activePid}_${selectedHabitDate}`;
    setHabitLogs(prev => ({ ...prev, [key]: updated }));
    localStorage.setItem(`growth_lab_habit_${activePid}_${selectedHabitDate}`, JSON.stringify(updated));
    setSaveFeedback('อัปเดตสถานะพฤติกรรมประจำวันสำเร็จ');
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  const updateHabitNotes = (notesText: string) => {
    const updated = {
      ...currentHabitLog,
      notes: notesText
    };
    const key = `${activePid}_${selectedHabitDate}`;
    setHabitLogs(prev => ({ ...prev, [key]: updated }));
    localStorage.setItem(`growth_lab_habit_${activePid}_${selectedHabitDate}`, JSON.stringify(updated));
  };

  const habitItemsList: { key: keyof Omit<EFHabitLog, 'id' | 'patientId' | 'date' | 'notes'>; label: string; icon: string; desc: string }[] = [
    { key: 'breathing', label: '1. การหายใจ (Nasal Breathing)', icon: '🌬️', desc: 'หายใจผ่านจมูกตลอดทั้งวันขณะทำกิจกรรมปกติ' },
    { key: 'lipSeal', label: '2. Lip Seal (การปิดริมฝีปาก)', icon: '👄', desc: 'ริมฝีปากบนและล่างปิดชิดสนิทขณะพักโดยไม่เกร็งคาง' },
    { key: 'tonguePosture', label: '3. ตำแหน่งลิ้น (Tongue Spot)', icon: '👅', desc: 'แผ่นลิ้นแนบเพดานปาก ปลายลิ้นแตะจุด Spot' },
    { key: 'swallowing', label: '4. การกลืน (Swallowing Pattern)', icon: '💧', desc: 'กลืนน้ำลายถูกวิธี ไม่ดันลิ้นจุกฟันหน้า' },
    { key: 'muscleRelaxation', label: '5. การคลายกล้ามเนื้อ (Relaxation)', icon: '✨', desc: 'ผ่อนคลายกล้ามเนื้อคาง แก้ม และข้อต่อขากรรไกร' },
    { key: 'posture', label: '6. ท่าทาง (Posture Alignment)', icon: '🧘', desc: 'ยืดคอหลังตรง ไม่ยื่นศีรษะไปข้างหน้า (Chin Tuck)' },
    { key: 'exerciseExecution', label: '7. การทำแบบฝึก (Daily OMT)', icon: '🏋️', desc: 'ทำแบบฝึกบริหาร EF ประจำวันครบตามเป้าหมาย' },
  ];

  const completedCountToday = habitItemsList.filter(h => currentHabitLog[h.key] === 'completed').length;
  const totalHabitItems = habitItemsList.length;
  const consistencyRate = Math.round((completedCountToday / totalHabitItems) * 100);

  // Handle breathing simulation ticks
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (timerPhase === 'inhale' && prev >= 6) {
            setTimerPhase('hold');
            return 1;
          } else if (timerPhase === 'hold' && prev >= 3) {
            setTimerPhase('exhale');
            return 1;
          } else if (timerPhase === 'exhale' && prev >= 6) {
            setCompletedReps((reps) => {
              const nextReps = reps + 1;
              if (nextReps >= selectedEx.targetReps) {
                setIsTimerRunning(false);
                setTimerPhase('idle');
                setShowScoreModal(true);
                return selectedEx.targetReps;
              }
              return nextReps;
            });
            setTimerPhase('inhale');
            return 1;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerPhase, selectedEx]);

  const startBreatheTrainer = () => {
    setTimerPhase('inhale');
    setTimerSeconds(1);
    setIsTimerRunning(true);
  };

  const stopBreatheTrainer = () => {
    setIsTimerRunning(false);
  };

  const resetBreatheTrainer = () => {
    setIsTimerRunning(false);
    setTimerPhase('idle');
    setTimerSeconds(0);
    setCompletedReps(0);
    setFeedbackNotes('');
    setFinalScore(10);
    setShowScoreModal(false);
  };

  const handleQuickComplete = () => {
    setCompletedReps(selectedEx.targetReps);
    setShowScoreModal(true);
  };

  const submitTrainingLog = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const targetPid = activePid;
    if (!targetPid) return;

    if (onAddLog) {
      onAddLog({
        patientId: targetPid,
        date: new Date().toISOString().split('T')[0],
        exerciseId: selectedEx.id,
        repsCompleted: completedReps || selectedEx.targetReps,
        score: finalScore,
        notes: feedbackNotes.trim() || undefined,
      });

      if (!completedExercises.includes(selectedEx.id)) {
        const next = [...completedExercises, selectedEx.id];
        setCompletedExercises(next);
        localStorage.setItem(`growth_lab_checklist_${targetPid}`, JSON.stringify(next));
      }
    }

    setShowScoreModal(false);
    setCompletedReps(0);
    setFeedbackNotes('');
    setSaveFeedback(`✓ บันทึกผลการฝึก ${selectedEx.title} สำเร็จ (คะแนน ${finalScore}/10)`);
    setTimeout(() => setSaveFeedback(null), 4000);
  };

  const getPhaseLabel = (phase: string) => {
    if (phase === 'idle') return 'สถานะ';
    if (phase === 'inhale') return 'สูดหายใจเข้า (Inhale)';
    if (phase === 'hold') return 'กลั้น/เกร็งค้าง (Hold)';
    if (phase === 'exhale') return 'ผ่อนลมหายใจ (Exhale)';
    return '';
  };

  const getTargetText = (phase: string) => {
    if (phase === 'idle') return 'รอเริ่มต้น';
    if (phase === 'inhale') return 'สูดลมผ่านจมูก 6 วิ';
    if (phase === 'hold') return 'กลั้นเกร็งไว้ 3 วิ';
    if (phase === 'exhale') return 'ผ่อนลมออกช้าๆ 6 วิ';
    return '';
  };

  const handleSelectPatientId = (newPid: string) => {
    setTrainingPatientId(newPid);
    if (onSelectPatient) {
      onSelectPatient(newPid);
    }
  };

  // Recent logs for active patient in EF module
  const patientEfLogs = useMemo(() => {
    return logs
      .filter(l => l.patientId === activePid)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [logs, activePid]);

  const targetRepsTotal = selectedEx.targetReps || 10;
  const progressPercent = Math.min(100, Math.round((completedReps / targetRepsTotal) * 100));

  // Determine current status string
  const currentTrainingStatus = useMemo(() => {
    if (isTimerRunning) return 'กำลังฝึกอยู่ ⏱️';
    if (completedReps >= targetRepsTotal) return 'ฝึกเสร็จสิ้นแล้ว 🎉';
    if (completedReps > 0) return 'กำลังดำเนินการ';
    return 'ยังไม่ได้เริ่ม';
  }, [isTimerRunning, completedReps, targetRepsTotal]);

  if (userRole === 'PATIENT') {
    return (
      <PatientHomeworkView 
        patientId={patientId || trainingPatientId || ''}
        onAddLog={onAddLog}
        patients={patients}
        externalCompletedReps={completedReps}
        externalIsTimerRunning={isTimerRunning}
        externalElapsedSeconds={timerSeconds}
        externalHandleStart={startBreatheTrainer}
        externalHandlePause={stopBreatheTrainer}
        externalHandleReset={resetBreatheTrainer}
        completedExercises={completedExercises}
        setCompletedExercises={setCompletedExercises}
      />
    );
  }

  return (
    <div className="space-y-6 text-left max-w-full overflow-x-hidden pb-12">
      
      {/* ========================================================================= */}
      {/* 1. PAGE TITLE & DESCRIPTION                                               */}
      {/* ========================================================================= */}
      <section className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xs space-y-3.5 max-w-full">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 text-xs font-black text-purple-700 bg-purple-50 hover:bg-purple-100 px-3.5 py-2 rounded-xl border border-purple-200/80 shadow-2xs transition-all cursor-pointer shrink-0 self-start sm:self-auto"
                title="ย้อนกลับไปหน้าภาพรวม / Dashboard"
              >
                <ArrowLeft className="w-4 h-4 text-purple-600" />
                <span>← กลับหน้าศูนย์กลาง</span>
              </button>
            )}

            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center font-bold shadow-inner shrink-0">
                <Brain className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight truncate">
                    EF / แบบฝึกบริหารช่องปากและใบหน้า
                  </h1>
                  <span className="bg-purple-100 text-purple-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase shrink-0">
                    OMT Care
                  </span>
                </div>
                <p className="text-slate-500 text-xs mt-0.5 line-clamp-1 sm:line-clamp-none">
                  โปรแกรม Orofacial Myofunctional Therapy (OMT) — ฝึกการหายใจ ริมฝีปาก ลิ้น การกลืน กล้ามเนื้อใบหน้า และการบ้าน
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-navigation Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 no-scrollbar pb-1">
          {[
            { id: 'ef_all', label: '📋 แบบฝึกทั้งหมด', icon: BookOpen },
            { id: 'ef_monitor', label: '📊 ติดตามพฤติกรรม', icon: CheckSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = internalSubTab === tab.id;
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => setInternalSubTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. PATIENT CONTEXT                                                        */}
      {/* ========================================================================= */}
      <PatientContextBar 
        patient={activePatientObj}
        patients={patients}
        onSelectPatient={handleSelectPatientId}
      />

      {/* FEEDBACK BANNER */}
      {saveFeedback && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{saveFeedback}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONDITIONAL SUB-VIEWS (Monitor)                                           */}
      {/* ========================================================================= */}

      {internalSubTab === 'ef_monitor' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white p-5 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-100 uppercase">ทำต่อเนื่อง</span>
                <Flame className="w-5 h-5 text-amber-300" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono">14</span>
                <span className="text-xs font-bold text-purple-200">วันติดต่อกัน 🔥</span>
              </div>
              <p className="text-[11px] text-purple-200/80 mt-1">วินัยการฝึกอยู่ในระดับดีเยี่ยม</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">สำเร็จวันนี้</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-800 font-mono">{completedCountToday}</span>
                <span className="text-xs font-bold text-slate-400">/ {totalHabitItems} รายการ</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${consistencyRate}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">ความสม่ำเสมอ</span>
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-purple-700 font-mono">{consistencyRate}%</span>
                <span className="text-xs font-bold text-slate-500">สะสม</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">เกณฑ์ผ่าน: ≥ 80%</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-purple-600" />
                  <span>บันทึกติดตามพฤติกรรมและการฝึกประจำวัน</span>
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">วันที่:</span>
                <input
                  type="date"
                  value={selectedHabitDate}
                  onChange={(e) => setSelectedHabitDate(e.target.value)}
                  className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              {habitItemsList.map((item) => {
                const currentStatus = currentHabitLog[item.key] || 'pending';
                return (
                  <div key={item.key} className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{item.icon}</span>
                        <h4 className="text-xs font-bold text-slate-800">{item.label}</h4>
                      </div>
                      <p className="text-[11px] text-slate-500">{item.desc}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateHabitItemStatus(item.key, 'completed')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          currentStatus === 'completed'
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>ทำแล้ว</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateHabitItemStatus(item.key, 'pending')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          currentStatus === 'pending'
                            ? 'bg-amber-500 text-white shadow-2xs'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-amber-50 hover:text-amber-700'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>ยังไม่ได้ทำ</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRIMARY WORKFLOW: CONSOLIDATED SINGLE TRAINING VIEW                        */}
      {/* ========================================================================= */}
      {internalSubTab !== 'ef_monitor' && (
        <div className="space-y-6">

          {/* ========================================================================= */}
          {/* 4. CONSOLIDATED TODAY'S TRAINING WINDOW (SIDE-BY-SIDE VIDEO & PRACTICE)    */}
          {/* ========================================================================= */}
          <section className="bg-white rounded-3xl border border-purple-200/90 p-5 sm:p-7 shadow-xs space-y-5">
            {/* Header: ชื่อท่า, หมวดหมู่, และสถานะ */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-purple-700 bg-purple-100 px-3 py-1 rounded-xl">
                    {selectedEx.category.toUpperCase()}
                  </span>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-xl">
                    รหัส: {selectedEx.id}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-xl">
                    ระดับ: {selectedEx.difficultyLevel || 'ง่าย'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {selectedEx.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  {selectedEx.purpose || selectedEx.description}
                </p>
              </div>

              {/* Status Badge & Metrics Summary */}
              <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 bg-purple-50/70 p-3.5 rounded-2xl border border-purple-100">
                <div className="flex items-center gap-1.5 text-xs font-black text-purple-950">
                  <span>🎯 เป้าหมาย:</span>
                  <span className="text-sm font-mono text-purple-700">{targetRepsTotal} ครั้ง</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                  <span>⏱️ เวลาแนะนำ:</span>
                  <span className="font-mono text-slate-900">{selectedEx.durationMinutes || 5} นาที</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold">
                  <span className="text-slate-500">สำเร็จแล้ว:</span>
                  <span className="font-mono text-emerald-700">{completedReps} ครั้ง ({progressPercent}%)</span>
                </div>
              </div>
            </div>

            {/* SIDE-BY-SIDE: 1 CLINICAL VIDEO (LEFT) + TIMER & ACTION CONTROLS (RIGHT) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: 1 Relevant Clinical Demonstration Video Clip */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <Film className="w-4 h-4 text-purple-600" />
                    <span>วิดีโอสาธิตท่าฝึก (Clinical Demonstration)</span>
                  </div>
                  <span className="text-[11px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-md">
                    เฉพาะท่า: {selectedEx.title}
                  </span>
                </div>

                <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md aspect-video w-full flex items-center justify-center">
                  <iframe
                    src={currentExerciseVideo}
                    title={selectedEx.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>

                {selectedEx.steps && selectedEx.steps.length > 0 && (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">ขั้นตอนการฝึกที่ถูกต้อง:</h4>
                    <ul className="space-y-1.5">
                      {selectedEx.steps.map((st, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 font-medium">
                          <span className="w-4 h-4 rounded-full bg-purple-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{st}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Right Column: Interactive Practice / Timer / Reps / Submission */}
              <div className="lg:col-span-5 space-y-4 bg-purple-50/40 p-5 rounded-3xl border border-purple-100">
                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>ความคืบหน้ารอบการฝึก</span>
                    <span className="text-purple-700 font-mono font-black">{completedReps} / {targetRepsTotal} ({progressPercent}% )</span>
                  </div>
                  <div className="w-full bg-white h-2.5 rounded-full overflow-hidden border border-purple-200/60">
                    <div 
                      className="bg-purple-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Realtime Breath Guide / Timer Box */}
                <div className="bg-purple-950 text-white p-5 rounded-2xl shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-purple-300">
                      {isTimerRunning ? getPhaseLabel(timerPhase) : 'สถานะ: พร้อมฝึกฝน'}
                    </span>
                    <span className="text-xs font-mono font-bold bg-white/10 px-2 py-0.5 rounded-md">
                      {String(Math.floor(timerSeconds / 60)).padStart(2, '0')}:{String(timerSeconds % 60).padStart(2, '0')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <div className={`w-14 h-14 rounded-full border-3 flex flex-col items-center justify-center shrink-0 transition-all ${
                      isTimerRunning && timerPhase === 'inhale' ? 'border-teal-400 bg-teal-500/20 scale-105' :
                      isTimerRunning && timerPhase === 'hold' ? 'border-sky-400 bg-sky-500/20' :
                      isTimerRunning && timerPhase === 'exhale' ? 'border-amber-400 bg-amber-500/20' :
                      'border-purple-400/40 bg-purple-900/40'
                    }`}>
                      <span className="text-xs font-mono font-bold text-white">
                        {isTimerRunning ? `${String(timerSeconds % 10)}s` : 'OMT'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-white">
                        {isTimerRunning ? getTargetText(timerPhase) : 'กด "เริ่มฝึกวันนี้" เพื่อเริ่มจับเวลาและฝึกตามคลิป'}
                      </p>
                      <span className="text-[10px] text-purple-300 block mt-0.5">
                        ดูตัวอย่างและลงมือทำพร้อมกดบันทึกผลได้ทันที
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons: "เริ่มฝึกวันนี้", "ทำเสร็จแล้ว", "เริ่มใหม่" */}
                <div className="space-y-2 pt-1">
                  <div className="flex gap-2">
                    {!isTimerRunning ? (
                      <button
                        type="button"
                        id="btn-start-training"
                        onClick={startBreatheTrainer}
                        className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>▶ เริ่มฝึกวันนี้</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        id="btn-pause-training"
                        onClick={stopBreatheTrainer}
                        className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                      >
                        <Watch className="w-4 h-4" />
                        <span>⏸ หยุดชั่วคราว</span>
                      </button>
                    )}

                    <button
                      id="btn-reset-training"
                      type="button"
                      onClick={resetBreatheTrainer}
                      className="px-3.5 py-3 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-1 cursor-pointer"
                      title="รีเซ็ตการฝึกรอบปัจจุบัน"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                      <span>↻</span>
                    </button>
                  </div>

                  <button
                    id="btn-complete-training"
                    type="button"
                    onClick={handleQuickComplete}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    title="บันทึกว่าทำแบบฝึกนี้เสร็จสิ้นแล้ว"
                  >
                    <Check className="w-4 h-4 text-white stroke-[3]" />
                    <span>✓ ทำเสร็จแล้ว & บันทึกผล</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 5. COMPACT EXERCISE SELECTOR (เลือกแบบฝึกหัดอื่นในหมวด)                     */}
          {/* ========================================================================= */}
          <section className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  เลือกท่าฝึกอื่นในหมวดนี้
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  คลิกที่ท่าฝึกเพื่อสลับมาแสดงและฝึกในหน้าต่างด้านบน
                </p>
              </div>
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-xl border border-purple-100">
                {filteredExercises.length} แบบฝึก
              </span>
            </div>

            {filteredExercises.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
                <Brain className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">ยังไม่มีข้อมูลแบบฝึกในหมวดหมู่นี้</h4>
                <p className="text-xs text-slate-500">เลือกดูหมวดหมู่อื่นจากแถบเมนูด้านบน</p>
                <button
                  type="button"
                  onClick={() => setInternalSubTab('ef_all')}
                  className="px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl"
                >
                  ดูแบบฝึกทั้งหมด
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredExercises.map((ex) => {
                  const isSelected = selectedExId === ex.id;
                  const isCompleted = completedExercises.includes(ex.id);

                  return (
                    <div
                      key={ex.id}
                      onClick={() => {
                        setSelectedExId(ex.id);
                        resetBreatheTrainer();
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-purple-50/80 border-purple-400 shadow-2xs ring-1 ring-purple-400'
                          : 'bg-slate-50/60 border-slate-200 hover:bg-purple-50/30 hover:border-purple-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                          isSelected ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {ex.category === 'breathing' ? '🌬️' :
                           ex.category === 'lips' ? '👄' :
                           ex.category === 'tongue' ? '👅' :
                           ex.category === 'swallowing' ? '💧' :
                           ex.category === 'posture' ? '🧘' : '🧠'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {ex.title}
                          </h4>
                          <span className="text-[10px] text-slate-500 font-medium">
                            🎯 {ex.targetReps || 10} ครั้ง • ⏱️ {ex.durationMinutes || 5} นาที
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>เสร็จแล้ว</span>
                          </span>
                        )}
                        {isSelected && (
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                            กำลังฝึก
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ========================================================================= */}
          {/* 6. TRAINING TOOLS (เครื่องมือช่วยฝึก)                                     */}
          {/* ========================================================================= */}
          <section className="bg-slate-50/90 rounded-3xl border border-slate-200/90 p-5 space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              เครื่องมือช่วยฝึก
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowChecklistModal(true)}
                className="flex-1 sm:flex-initial px-5 py-2.5 bg-white hover:bg-purple-50 text-purple-800 border border-purple-200 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ListChecks className="w-4 h-4 text-purple-600" />
                <span>☑ Checklist ({completedExercises.length}/{CLINICAL_EXERCISES.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setShowTimerModal(true)}
                className="flex-1 sm:flex-initial px-5 py-2.5 bg-white hover:bg-purple-50 text-purple-800 border border-purple-200 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <TimerIcon className="w-4 h-4 text-purple-600" />
                <span>⏱ Timer จับเวลาฝึกหายใจ</span>
              </button>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 7. PROGRESS / HISTORY (ประวัติการฝึก)                                     */}
          {/* ========================================================================= */}
          <section className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  ประวัติการฝึก
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  บันทึกรอบการฝึกและคะแนนประเมินย้อนหลังของผู้รับการดูแล
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {patientEfLogs.length} รายการ
              </span>
            </div>

            {patientEfLogs.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl space-y-2">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                <h4 className="text-xs font-bold text-slate-700">ยังไม่มีข้อมูลการฝึกสำหรับผู้รับการดูแลคนนี้</h4>
                <p className="text-[11px] text-slate-400">เริ่มต้นการฝึกวันนี้เพื่อสร้างประวัติและคะแนนพัฒนาการ</p>
                <button
                  type="button"
                  onClick={startBreatheTrainer}
                  className="px-4 py-1.5 bg-purple-600 text-white font-bold text-xs rounded-xl mt-1"
                >
                  เริ่มฝึกรอบแรก
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">วันที่</th>
                      <th className="py-2.5 px-3">แบบฝึก</th>
                      <th className="py-2.5 px-3 text-center">จำนวนครั้ง</th>
                      <th className="py-2.5 px-3 text-center">คะแนน</th>
                      <th className="py-2.5 px-3 text-right">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {patientEfLogs.map((log) => {
                      const ex = VERIFIED_EXERCISES.find(e => e.id === log.exerciseId);
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                            {log.date}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-800">
                            {ex ? ex.title : log.exerciseId}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-purple-700">
                            {log.repsCompleted} ครั้ง
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md font-mono font-bold">
                              ★ {log.score}/10
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              ✓ บันทึกแล้ว
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS & DRAWERS                                                          */}
      {/* ========================================================================= */}

      {/* 1. CHECKLIST MODAL */}
      {showChecklistModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-lg w-full text-left overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 bg-purple-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListChecks className="w-5 h-5" />
                <h3 className="text-base font-bold">Checklist รายการแบบฝึกประจำวัน</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowChecklistModal(false)}
                className="p-1 rounded-lg hover:bg-white/20 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <p className="text-xs text-slate-500">
                ทำเครื่องหมายถูกเมื่อผู้รับการดูแลทำแบบฝึกหัดในแต่ละรายการครบถ้วน
              </p>

              <div className="space-y-2">
                {CLINICAL_EXERCISES.map((ex) => {
                  const isChecked = completedExercises.includes(ex.id);
                  return (
                    <div
                      key={ex.id}
                      onClick={() => toggleExerciseCompletion(ex.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isChecked ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:bg-white'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-slate-800">{ex.title}</h4>
                        <p className="text-[11px] text-slate-500">เป้าหมาย: {ex.targetReps} ครั้ง | {ex.durationMinutes} นาที</p>
                      </div>
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center border ${
                        isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-300'
                      }`}>
                        <Check className={`w-3.5 h-3.5 ${isChecked ? 'opacity-100' : 'opacity-0'}`} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowChecklistModal(false)}
                  className="px-5 py-2.5 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700 transition-all cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. TIMER & BREATHING GUIDE MODAL */}
      {showTimerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-md w-full text-left overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 bg-purple-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TimerIcon className="w-5 h-5" />
                <h3 className="text-base font-bold">เครื่องจับเวลาฝึกหายใจ OMT</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTimerModal(false)}
                className="p-1 rounded-lg hover:bg-white/20 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-center">
              <div className="flex flex-col items-center justify-center">
                <div className={`w-36 h-36 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden ${
                  timerPhase === 'inhale' 
                    ? 'bg-teal-50 border-teal-400 scale-105 shadow-md shadow-teal-200' 
                    : timerPhase === 'hold'
                    ? 'bg-sky-50 border-sky-400'
                    : timerPhase === 'exhale'
                    ? 'bg-amber-50 border-amber-400'
                    : 'bg-slate-100 border-slate-300'
                }`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {getPhaseLabel(timerPhase)}
                  </span>
                  <span className="text-4xl font-bold font-mono text-slate-800 mt-1">
                    {timerPhase === 'idle' ? '00' : String(timerSeconds).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 mt-1">
                    {getTargetText(timerPhase)}
                  </span>
                </div>
              </div>

              <div className="flex justify-center gap-2">
                {!isTimerRunning ? (
                  <button
                    type="button"
                    onClick={startBreatheTrainer}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>เริ่มจับเวลา</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopBreatheTrainer}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Watch className="w-4 h-4" />
                    <span>หยุดชั่วคราว</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={resetBreatheTrainer}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>เริ่มใหม่</span>
                </button>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowTimerModal(false)}
                  className="px-5 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. VIDEO PLAYER MODAL */}
      {activeVideoModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-950 rounded-3xl shadow-2xl border border-slate-800 max-w-2xl w-full text-left overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-200 truncate">{activeVideoModal.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideoModal(null)}
                className="p-1 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="aspect-video w-full bg-black relative">
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`${activeVideoModal.url}?autoplay=1&rel=0`}
                title={activeVideoModal.title}
                allowFullScreen
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. FACIAL ANATOMY DETAIL MODAL */}
      {selectedAnatomy && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full text-left overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 bg-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                <h3 className="text-base font-bold">{selectedAnatomy.nameTh}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAnatomy(null)}
                className="p-1 rounded-lg hover:bg-white/20 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">คำศัพท์ทางการแพทย์</span>
                <p className="text-sm font-bold text-indigo-950 font-mono">{selectedAnatomy.nameEn}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">คำอธิบายโครงสร้าง</h4>
                <p className="text-xs text-slate-700 leading-relaxed">{selectedAnatomy.description}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">บทบาทในการฝึก Growth Lab OMT</h4>
                <p className="text-xs text-slate-700 leading-relaxed p-3 bg-slate-50 rounded-xl border border-slate-100">
                  {selectedAnatomy.omtFunction}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    setInternalSubTab('ef_all');
                    setSelectedAnatomy(null);
                  }}
                  className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700 transition-all cursor-pointer"
                >
                  ดูแบบฝึกทั้งหมด
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAnatomy(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. COMPLETED CLINICAL SCORE POPUP */}
      {showScoreModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full text-left">
            <div className="p-5 border-b border-slate-100 bg-purple-600 text-white rounded-t-2xl flex items-center gap-2">
              <Award className="w-5 h-5" />
              <h3 className="text-base font-bold">บันทึกประเมินผลการฝึกบริหาร 🏆</h3>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-purple-50 rounded-xl p-3.5 border border-purple-100">
                <p className="text-xs text-purple-900 leading-relaxed">
                  บันทึกกิจกรรม <strong>{selectedEx.title}</strong> สำหรับผู้รับการดูแล <span className="font-bold">{activePatientObj?.firstName}</span>
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-500">คะแนนประเมิน (Clinical Score):</label>
                  <span className="text-sm font-bold text-purple-700 font-mono">
                    ★ {finalScore} / 10 คะแนน
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={finalScore}
                  onChange={(e) => setFinalScore(parseInt(e.target.value))}
                  className="w-full accent-purple-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">บันทึกเพิ่มเติม</label>
                <textarea
                  placeholder="ข้อสังเกตเพิ่มเติม..."
                  rows={2.5}
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowScoreModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 bg-slate-100 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={submitTrainingLog}
                  className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl"
                >
                  ยืนยันบันทึกผลการฝึก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
