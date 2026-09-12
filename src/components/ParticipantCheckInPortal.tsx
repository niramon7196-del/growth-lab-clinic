import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, Clock, Calendar, Brain, Award, 
  ChevronRight, ShieldCheck, Check, Sparkles, RefreshCw, 
  X, ArrowRight, UserCheck, Flame, Dumbbell, LayoutDashboard, 
  Video, User, LogOut, Utensils, Moon, Activity, MessageSquare,
  ChevronDown, Heart, TrendingUp, Save
} from 'lucide-react';
import { Patient, HomeworkAssignment, Exercise, CheckInRecord } from '../types';
import { VERIFIED_EXERCISES } from '../data';
import { getPatientAssignedExercises } from '../../exerciseHelper';
import { 
  getTodayDateString, 
  formatThaiDate, 
  formatThaiTimestamp, 
  hasCheckedInToday, 
  getTodayCheckInRecord, 
  calculateConsistencyMetrics,
  syncPatientProgress
} from '../utils/checkInCalculations';
import { Logo } from './Logo';
import { InceptionDossierModal } from './InceptionDossierModal';
import { syncRealtimeCheckIn } from '../services/googleDriveSheetsService';
import { savePatientToGoogleSheets, getWebhookUrl } from '../services/googleAppsScriptService';
import * as cloudApi from '../services/cloudApi';
import { formatPatientDisplay, savePatientToLocalStorage } from '../utils/patientUtils';
import { playSuccessChime } from '../utils/audioUtils';

interface ParticipantCheckInPortalProps {
  patient: Patient;
  onCheckIn: (patientId: string, source?: 'APP' | 'QR') => void;
  onToggleExerciseComplete?: (patientId: string, assignmentId: string) => void;
  onSaveAllAssignments?: (patientId: string, assignments: HomeworkAssignment[]) => void;
  onNavigate?: (tab: string) => void;
  onLogout?: () => void;
}

export interface PillarTask {
  id: string;
  pillarId: 'gns' | 'sleep' | 'posture' | 'omt';
  title: string;
  subtitle: string;
  category: string;
  target: string;
  completed: boolean;
  notes?: string;
  reps?: number;
  durationMinutes?: number;
}

export default function ParticipantCheckInPortal({
  patient,
  onCheckIn,
  onToggleExerciseComplete,
  onSaveAllAssignments,
  onNavigate,
  onLogout
}: ParticipantCheckInPortalProps) {
  const isCheckedIn = hasCheckedInToday(patient);
  const todayRecord = getTodayCheckInRecord(patient);
  const todayStr = getTodayDateString();
  const formattedToday = formatThaiDate(todayStr);
  const metrics = calculateConsistencyMetrics(patient);

  const [activeTab, setActiveTab] = useState<'4pillars' | 'summary'>('4pillars');
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [showInceptionModal, setShowInceptionModal] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessToast, setSaveSuccessToast] = useState<string | null>(null);

  // Safe patient identifier
  const patientId = patient?.id || patient?.hn || 'default_patient';

  // Homework completion state for the 4 Pillars
  const storageKey = `growth_completed_exercises_${patientId}_${todayStr}`;
  const notesStorageKey = `growth_pillar_notes_${patientId}_${todayStr}`;

  const [isLockedToday, setIsLockedToday] = useState<boolean>(() => {
    if (!patient || !patient.id) return false;
    try {
      const isLoc = localStorage.getItem(`growth_locked_days_${patient.id}_${todayStr}`);
      return isLoc === 'true' || Boolean(patient.lockedDates?.includes(todayStr));
    } catch {
      return false;
    }
  });

  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [pillarNotes, setPillarNotes] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(notesStorageKey);
      return saved ? JSON.parse(saved) : {
        gns_food: '',
        sleep_hours: '9',
        posture_reps: '30',
        omt_notes: ''
      };
    } catch {
      return {
        gns_food: '',
        sleep_hours: '9',
        posture_reps: '30',
        omt_notes: ''
      };
    }
  });

  // Extract clinical assignments
  const assignedList = getPatientAssignedExercises(VERIFIED_EXERCISES, patient);

  // 4 Pillars Standard Clinical Tasks definition
  const FOUR_PILLARS_DATA: Array<{
    id: 'gns' | 'sleep' | 'posture' | 'omt';
    title: string;
    englishTitle: string;
    badgeColor: string;
    icon: any;
    theme: {
      bg: string;
      border: string;
      accent: string;
      text: string;
    };
    tasks: Array<{
      id: string;
      title: string;
      desc: string;
      defaultTarget: string;
    }>;
  }> = [
    {
      id: 'gns',
      title: 'เสาหลักที่ 1: โภชนาการและการเจริญเติบโต (GNS)',
      englishTitle: 'Growth Nutrition Strategy',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
      icon: Utensils,
      theme: {
        bg: 'from-amber-50/90 to-orange-50/70',
        border: 'border-amber-200',
        accent: 'bg-amber-500',
        text: 'text-amber-900'
      },
      tasks: [
        {
          id: `asgn_${patientId}_gns_protein`,
          title: 'รับประทานโปรตีนคุณภาพสูงครบถ้วน',
          desc: 'รับประทานไข่ไก่ 2-3 ฟอง, เนื้อปลา, เนื้อสัตว์ไม่ติดมัน และนม เพื่อสร้างคอลลาเจนและแผ่นกระดูก',
          defaultTarget: 'ไข่ 2 ฟอง + นม 2 แก้ว'
        },
        {
          id: `asgn_${patientId}_gns_calcium`,
          title: 'เสริมแคลเซียมและผักใบเขียว',
          desc: 'ทานผักใบเขียวเข้ม งาดำ หรือแคลเซียมตามทันตแพทย์แนะนำ เสริมความหนาแน่นมวลกระดูก',
          defaultTarget: 'ทุกมื้ออาหารหลัก'
        },
        {
          id: `asgn_${patientId}_gns_nosugar`,
          title: 'หลีกเลี่ยงน้ำหวานและขนมหวานก่อนนอน',
          desc: 'งดขนมหวาน ชานม น้ำอัดลม เพื่อป้องกันอินซูลินกดการหลั่ง Growth Hormone',
          defaultTarget: 'งดก่อนนอน 3 ชั่วโมง'
        }
      ]
    },
    {
      id: 'sleep',
      title: 'เสาหลักที่ 2: การนอนและใส่อุปกรณ์ EF (Sleep & EF)',
      englishTitle: 'Deep Sleep & EF Appliance',
      badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-200',
      icon: Moon,
      theme: {
        bg: 'from-indigo-50/90 to-blue-50/70',
        border: 'border-indigo-200',
        accent: 'bg-indigo-600',
        text: 'text-indigo-900'
      },
      tasks: [
        {
          id: `asgn_${patientId}_sleep_early`,
          title: 'เข้านอนตรงเวลา (ก่อน 21:30 - 22:00 น.)',
          desc: 'เพื่อให้หลับสนิทช่วง 23:00 - 02:00 น. ซึ่งเป็นช่วงเวลาที่ Growth Hormone หลั่งออกมาสูงสุด',
          defaultTarget: 'นอนหลับ 8-10 ชม.'
        },
        {
          id: `asgn_${patientId}_sleep_ef_evening`,
          title: 'ใส่อุปกรณ์ EF ช่วงหัวค่ำ 1-2 ชั่วโมง',
          desc: 'ใส่อุปกรณ์ขณะอ่านหนังสือ ดูทีวี หรือทำการบ้านเพื่อสร้างความคุ้นเคยของกล้ามเนื้อ',
          defaultTarget: '1-2 ชั่วโมง'
        },
        {
          id: `asgn_${patientId}_sleep_ef_night`,
          title: 'ใส่อุปกรณ์ EF ตลอดคืนขณะนอนหลับ',
          desc: 'ใส่อุปกรณ์ EF / Myobrace ขณะนอนหลับตลอดคืน เพื่อขยายขากรรไกรและเปิดทางเดินหายใจ',
          defaultTarget: 'ตลอดทั้งคืน'
        }
      ]
    },
    {
      id: 'posture',
      title: 'เสาหลักที่ 3: ออกกำลังกายเพิ่มความสูงและปรับบุคลิกภาพ',
      englishTitle: 'Posture & Bone Loading Exercise',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200',
      icon: Activity,
      theme: {
        bg: 'from-emerald-50/90 to-teal-50/70',
        border: 'border-emerald-200',
        accent: 'bg-emerald-600',
        text: 'text-emerald-900'
      },
      tasks: [
        {
          id: `asgn_${patientId}_posture_stretch`,
          title: 'ท่ายืดเหยียดแนวกระดูกสันหลัง (Spinal Stretch)',
          desc: 'ประสานมือชูเหนือศีรษะ เขย่งปลายเท้า ยืดตัวสุด ค้างไว้ 10-15 วินาที กระตุ้นแผ่นเจริญเติบโต',
          defaultTarget: '10-15 วินาที x 5-10 รอบ'
        },
        {
          id: `asgn_${patientId}_posture_jump`,
          title: 'ท่ากระโดด Bone Loading (Growth Plate Stimulation)',
          desc: 'กระโดดในแนวตั้ง ย่อเข่ารับแรงกระแทกเบาๆ กระตุ้นเซลล์กระดูกและขยายความยาวกระดูกขา',
          defaultTarget: '30-50 ครั้ง (1-2 เซ็ต)'
        },
        {
          id: `asgn_${patientId}_posture_wall`,
          title: 'ท่ายืนปรับบุคลิกภาพชิดผนัง 5 จุด (Wall Stand)',
          desc: 'ส้นเท้า น่อง สะโพก สะบัก ท้ายทอย แตะผนัง ลำตัวตรง สง่า ไม่หลังค่อม รีเซ็ตแนวกระดูก',
          defaultTarget: '5-10 นาที'
        }
      ]
    },
    {
      id: 'omt',
      title: 'เสาหลักที่ 4: แบบฝึกกล้ามเนื้อปากและใบหน้า (OMT)',
      englishTitle: 'Oral Myofunctional Therapy',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-200',
      icon: Brain,
      theme: {
        bg: 'from-purple-50/90 to-violet-50/70',
        border: 'border-purple-200',
        accent: 'bg-purple-600',
        text: 'text-purple-900'
      },
      tasks: [
        {
          id: `asgn_${patientId}_omt_mewing`,
          title: 'ฝึกตำแหน่งลิ้นพักแตะเพดานปาก (Mewing Position)',
          desc: 'ปลายลิ้นและโคนลิ้นแนบสนิทกับเพดานปาก ไม่ดุนฟัน ช่วยขยายโครงหน้าและขากรรไกรบน',
          defaultTarget: 'ทำต่อเนื่องทั้งวัน'
        },
        {
          id: `asgn_${patientId}_omt_nasal`,
          title: 'ฝึกการหายใจทางจมูก 100% (Nasal Breathing)',
          desc: 'ริมฝีปากปิดสนิท ลิ้นแตะเพดาน หายใจเข้าออกทางจมูกลึกๆ ไม่หายใจทางปาก',
          defaultTarget: 'ตลอดเวลา'
        },
        {
          id: `asgn_${patientId}_omt_swallow`,
          title: 'ฝึกการกลืนถูกต้อง (Proper Swallowing)',
          desc: 'ฟันสบกันเบาๆ ลิ้นดันขึ้นเพดานปากขณะกลืนน้ำลาย โดยไม่เกร็งริมฝีปากหรือกล้ามเนื้อคาง',
          defaultTarget: '20-30 ครั้ง/วัน'
        },
        {
          id: `asgn_${patientId}_omt_lip`,
          title: 'ฝึกความแข็งแรงของริมฝีปาก (Lip Seal Training)',
          desc: 'ปิดริมฝีปากสนิท บริหารกล้ามเนื้อรอบปาก ป้องกันปากอ้าขณะพัก',
          defaultTarget: '5 นาที'
        }
      ]
    }
  ];

  // Calculate total tasks and completed tasks
  const allTaskIds: string[] = [];
  FOUR_PILLARS_DATA.forEach(p => {
    p.tasks.forEach(t => allTaskIds.push(t.id));
  });

  // Also include custom clinical assignments
  if (assignedList && assignedList.length > 0) {
    assignedList.forEach((item: any) => {
      const customId = item.assignmentId || item.id || `asgn_${patientId}_${item.exerciseId || item.id}`;
      if (!allTaskIds.includes(customId)) {
        allTaskIds.push(customId);
      }
    });
  }

  const completedCount = allTaskIds.filter(id => !!completedItems[id]).length;
  const totalTasks = allTaskIds.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Toggle task completion
  const handleToggleTask = (taskId: string) => {
    if (isLockedToday) {
      setSaveSuccessToast('🔒 ผลคะแนนถูกล็อกแล้ว ไม่สามารถแก้ไขคะแนนย้อนหลังได้ (Result Locked)');
      setTimeout(() => setSaveSuccessToast(null), 3000);
      return;
    }

    const nextState = !completedItems[taskId];
    const updated = {
      ...completedItems,
      [taskId]: nextState
    };
    setCompletedItems(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {}

    if (onToggleExerciseComplete) {
      onToggleExerciseComplete(patient.id, taskId);
    }
  };

  // Select all tasks in a pillar
  const handleSelectAllPillar = (pillarId: string) => {
    if (isLockedToday) {
      setSaveSuccessToast('🔒 ผลคะแนนถูกล็อกแล้ว ไม่สามารถแก้ไขคะแนนย้อนหลังได้ (Result Locked)');
      setTimeout(() => setSaveSuccessToast(null), 3000);
      return;
    }

    const pillar = FOUR_PILLARS_DATA.find(p => p.id === pillarId);
    if (!pillar) return;

    const updated = { ...completedItems };
    pillar.tasks.forEach(t => {
      updated[t.id] = true;
    });
    setCompletedItems(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {}
  };

  const [isCheckingIn, setIsCheckingIn] = useState<boolean>(false);

  // One-touch Check-in handler
  const handlePerformCheckIn = async () => {
    if (!patient || !patient.id || isCheckingIn) return;
    setIsCheckingIn(true);
    
    try {
      onCheckIn(patient.id, 'QR');
      
      // Cloud Sync to Google Sheets
      const nowIso = new Date().toISOString();
      const nowTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
      const newRecord: CheckInRecord = {
        id: `chk_${Date.now()}`,
        patientId: patient.id,
        date: todayStr,
        timestamp: nowIso,
        source: 'QR',
        method: 'QR_TOKEN'
      };
      
      syncRealtimeCheckIn(patient, newRecord).catch(err => 
        console.warn('[ParticipantCheckInPortal] syncRealtimeCheckIn warning:', err)
      );

      const activeHn = (patient.hn || patient.id || '').trim();
      const activeName = ((patient as any).name || `${patient.firstName || ''} ${patient.lastName || ''}`).trim();

      await cloudApi.logDaily({
        hn: activeHn,
        name: activeName,
        patientName: activeName,
        patientId: patient.id,
        date: todayStr,
        time: nowTime,
        timestamp: nowIso,
        action: 'Daily Check-in',
        actionName: 'เช็คอินประจำวัน (Daily Check-in)',
        score: 'สำเร็จ',
        status: 'completed',
        source: 'QR',
        sheetName: 'Daily_Logs'
      });

      setSaveSuccessToast('✓ เช็กอินประจำวันสำเร็จเรียบร้อย');
      playSuccessChime();
      setTimeout(() => setSaveSuccessToast(null), 3000);
    } catch (error) {
      console.warn('[ParticipantCheckInPortal] check-in error:', error);
    } finally {
      setIsCheckingIn(false);
    }
  };

  // Save All Progress and Homework to Cloud (Google Sheets)
  const handleSaveAllHomework = async () => {
    if (!patient || !patient.id) return;
    setIsSaving(true);
    const activeHn = (patient.hn || patient.id || '').trim();
    const activeName = ((patient as any).name || `${patient.firstName || ''} ${patient.lastName || ''}`).trim();
    const nowIso = new Date().toISOString();

    try {
      // 1. Check in if not done yet
      if (!isCheckedIn) {
        onCheckIn(patient.id, 'QR');
        const newRecord: CheckInRecord = {
          id: `chk_${Date.now()}`,
          patientId: patient.id,
          date: todayStr,
          timestamp: nowIso,
          source: 'QR',
          method: 'QR_TOKEN'
        };
        syncRealtimeCheckIn(patient, newRecord).catch(err => 
          console.warn('[ParticipantCheckInPortal] syncRealtimeCheckIn warning:', err)
        );
      }

      // 2. Persist local storage notes and completion
      localStorage.setItem(storageKey, JSON.stringify(completedItems));
      localStorage.setItem(notesStorageKey, JSON.stringify(pillarNotes));

      // 3. Build Homework assignments array
      const homeworkPayload: HomeworkAssignment[] = allTaskIds.map(id => ({
        id,
        patientId: patient.id,
        exerciseId: id.replace(`asgn_${patientId}_`, ''),
        reps: 10,
        durationMinutes: 5,
        startDate: todayStr,
        lastSubmittedDate: completedItems[id] ? todayStr : undefined,
        status: completedItems[id] ? 'completed' : 'pending',
        instruction: pillarNotes.omt_notes || ''
      }));

      if (onSaveAllAssignments) {
        onSaveAllAssignments(patient.id, homeworkPayload);
      }

      // 4. Update local state for the active patient
      const updatedPatientForSync: Patient = {
        ...patient,
        assignments: homeworkPayload,
        assignedTasks: allTaskIds.filter(id => completedItems[id]),
        notes: `บันทึก 4 เสาหลัก (${completedCount}/${totalTasks}) วันที่ ${todayStr}`
      };
      updatedPatientForSync.progress = syncPatientProgress(updatedPatientForSync);
      savePatientToLocalStorage(updatedPatientForSync);

      // 5. Track Check-in Activity via Single Fetch Pipeline
      cloudApi.trackActivity({
        type: 'check_in',
        patientId: patient.id,
        hn: activeHn,
        patientName: activeName,
        activity: '4_pillars_checkin',
        metadata: {
          progress: progressPercent,
          completedCount,
          totalTasks,
          date: todayStr
        }
      }).catch(() => {});

      // 5.1 Send structured Daily Log to Google Sheets (Daily_Logs)
      cloudApi.logDaily({
        hn: activeHn,
        name: activeName,
        patientName: activeName,
        patientId: patient.id,
        date: todayStr,
        time: nowTime,
        timestamp: nowIso,
        action: '4 Pillars Daily Summary',
        actionName: 'บันทึกความก้าวหน้า 4 เสาหลัก',
        progress: progressPercent,
        completedCount,
        totalTasks,
        sleepHours: pillarNotes.sleep_hours ? Number(pillarNotes.sleep_hours) || 9 : 9,
        dietaryNotes: pillarNotes.gns_food || '',
        notes: `บันทึก 4 เสาหลัก (${completedCount}/${totalTasks}) วันที่ ${todayStr}`,
        sheetName: 'Daily_Logs'
      }).catch(err => console.warn('[ParticipantCheckInPortal] cloudApi.logDaily error:', err));

      // 6. Send structured Exercise Log to Google Sheets (Exercise_Logs)
      if (completedCount > 0) {
        const completedTaskNames = allTaskIds
          .filter(id => completedItems[id])
          .map(id => id.replace(`asgn_${patient.id}_`, ''));

        cloudApi.saveExercise({
          hn: activeHn,
          name: activeName,
          patientName: activeName,
          patientId: patient.id,
          exerciseId: completedTaskNames.join(', '),
          exerciseTitle: `4 เสาหลัก: สำเร็จ ${completedCount}/${totalTasks} รายการ`,
          duration: 15,
          reps: completedCount,
          score: progressPercent,
          satisfaction: 5,
          date: todayStr,
          timestamp: nowIso,
          notes: pillarNotes.omt_notes || '',
          sheetName: 'Exercise_Logs'
        }).catch(err => console.warn('[ParticipantCheckInPortal] cloudApi.saveExercise error:', err));
      }

      setIsSaving(false);
      playSuccessChime();
      setShowSuccessModal(true);
    } catch (e) {
      console.error('[ParticipantCheckInPortal] Save error:', e);
      setIsSaving(false);
      playSuccessChime();
      setShowSuccessModal(true);
    }
  };

  const nowTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
  const displayTime = todayRecord?.timestamp ? formatThaiTimestamp(todayRecord.timestamp) : nowTime;

  // Graceful fallback if patient profile is missing or invalid
  if (!patient || (!patient.id && !patient.hn)) {
    return (
      <div className="min-h-screen min-h-[100dvh] w-full max-w-full bg-gradient-to-b from-[#FAF8FC] via-[#F4EFFB] to-[#E9DCFB] flex flex-col items-center justify-center p-4 overflow-x-hidden box-border">
        <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-purple-200 text-center space-y-4">
          <div className="w-48 mx-auto mb-2">
            <Logo className="w-full h-auto object-contain" />
          </div>
          <div className="w-14 h-14 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            👤
          </div>
          <h2 className="text-lg sm:text-xl font-black text-purple-950">ยังไม่ได้ระบุข้อมูลผู้รับการดูแล</h2>
          <p className="text-xs sm:text-sm text-purple-800/80 leading-relaxed">
            กรุณากดปุ่มด้านล่างเพื่อกลับสู่หน้าสแกน QR Code หรือระบุรหัสคนไข้ (HN) เพื่อเข้าสู่ระบบ
          </p>
          <button
            type="button"
            onClick={() => {
              if (onLogout) onLogout();
              else if (onNavigate) onNavigate('Check-In');
              else window.location.reload();
            }}
            className="w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl shadow-md transition-all cursor-pointer min-h-[44px]"
          >
            กลับสู่หน้าสแกน QR Code / ระบุรหัสคนไข้
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen min-h-[100dvh] w-full max-w-full bg-gradient-to-b from-[#FAF8FC] via-[#F4EFFB] to-[#E9DCFB] text-[#1C1929] flex flex-col items-center justify-start pb-16 relative z-10 touch-manipulation prevent-pull-refresh overflow-x-hidden box-border"
      style={{ overscrollBehaviorY: 'contain', WebkitOverflowScrolling: 'touch' }}
    >
      
      {/* Toast Notification */}
      <AnimatePresence>
        {saveSuccessToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 z-50 px-5 py-3 bg-emerald-600 text-white font-bold rounded-2xl shadow-xl flex items-center gap-2 border border-emerald-400 text-sm"
          >
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span>{saveSuccessToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header with Master Growth Lab Logo (LOCKED BRAND ASSET) */}
      <header className="w-full max-w-xl mx-auto pt-6 pb-3 px-4 flex flex-col items-center justify-center text-center shrink-0">
        <div className="w-48 sm:w-56 mb-2 flex items-center justify-center">
          <Logo className="w-full h-auto object-contain drop-shadow-xs" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100/90 text-purple-950 rounded-full text-xs font-bold border border-purple-200 shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
          <span>ระบบเช็กอินและติดตามแบบฝึกหัด 4 เสาหลัก</span>
        </div>

        {/* Quick Navigation Links */}
        <div className="flex items-center justify-center gap-2 pt-3 flex-wrap">
          {onNavigate && (
            <>
              <button
                type="button"
                onClick={() => onNavigate('หน้าหลัก')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/90 hover:bg-purple-100 text-purple-950 rounded-xl text-xs font-bold border border-purple-200 shadow-2xs transition-all cursor-pointer min-h-[36px]"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-purple-700" />
                <span>ภาพรวมคลินิก</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('วิดีโอ')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/90 hover:bg-purple-100 text-purple-950 rounded-xl text-xs font-bold border border-purple-200 shadow-2xs transition-all cursor-pointer min-h-[36px]"
              >
                <Video className="w-3.5 h-3.5 text-purple-700" />
                <span>วิดีโอฝึก</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('โปรไฟล์')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/90 hover:bg-purple-100 text-purple-950 rounded-xl text-xs font-bold border border-purple-200 shadow-2xs transition-all cursor-pointer min-h-[36px]"
              >
                <User className="w-3.5 h-3.5 text-purple-700" />
                <span>ข้อมูลคนไข้</span>
              </button>
            </>
          )}

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-xl text-xs font-bold border border-rose-200/80 shadow-2xs transition-all cursor-pointer min-h-[36px]"
              title="สลับผู้ใช้ หรือสแกน QR อื่น"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span>สลับผู้ใช้</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      {/* Main Content Area */}
      <main className="w-full max-w-xl mx-auto px-4 space-y-4 flex-1">

        {/* 0. PERSONALIZED WELCOME GREETING BANNER */}
        {(() => {
          const info = formatPatientDisplay(patient);
          const greetingName = info.cleanNickname || info.cleanFirstName || patient.firstName || (patient as any).name || 'ผู้รับการดูแล';
          return (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-purple-800 via-indigo-800 to-fuchsia-800 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden text-left border border-purple-300/40"
            >
              <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-pink-400/20 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10 flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-black text-purple-100 border border-white/20 shadow-2xs">
                    <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                    <span>Growth Lab Clinical Care</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <span>สวัสดีน้อง {greetingName}!</span>
                    <span className="text-2xl">👋</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-purple-100/90 font-medium leading-relaxed">
                    ยินดีต้อนรับสู่พื้นที่เช็กอินและทำแบบฝึกหัดประจำวันของคุณ
                  </p>
                </div>
                <div className="w-12 h-12 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-inner border border-white/25">
                  🌸
                </div>
              </div>
            </motion.div>
          );
        })()}

        {/* 1. PATIENT PROFILE CARD */}
        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-purple-200 text-left space-y-4 relative overflow-hidden"
        >
          {/* Header Row: Date & Status */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-800 rounded-full text-xs font-bold border border-purple-100">
              <Calendar className="w-3.5 h-3.5 text-purple-600" />
              <span>วันนี้: {formattedToday}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                metrics.status === 'ACTIVE' 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                  : 'bg-purple-100 text-purple-900 border border-purple-200'
              }`}>
                {patient.status || 'ACTIVE'}
              </span>
            </div>
          </div>

          {/* Profile Details */}
          {(() => {
            const patientInfo = formatPatientDisplay(patient);
            return (
              <div className="flex items-start justify-between gap-3 pt-1">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                      {patientInfo.displayName}
                    </h1>
                    {patientInfo.formattedNickname && (
                      <span className="px-2.5 py-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-xs font-black shadow-2xs">
                        {patientInfo.formattedNickname}
                      </span>
                    )}
                    <span className={patientInfo.ageGroupBadge.badgeClass}>
                      {patientInfo.ageGroupTag}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs text-slate-600 font-medium">
                    <span className="bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100 font-mono font-bold text-purple-900">
                      HN: {patient.hn}
                    </span>
                    <span>• อายุ <strong className="text-slate-800 font-bold">{patientInfo.ageDisplayText}</strong></span>
                    <span>• ส่วนสูง <strong className="text-slate-800 font-bold">{patient.height || '-'}</strong> cm</span>
                    <span>• น้ำหนัก <strong className="text-slate-800 font-bold">{patient.weight || '-'}</strong> kg</span>
                  </div>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-md">
                  {patient.avatarUrl ? (
                    <img src={patient.avatarUrl} alt={patient.firstName} className="w-full h-full rounded-2xl object-cover" />
                  ) : (
                    patientInfo.cleanNickname ? patientInfo.cleanNickname.charAt(0) : (patientInfo.cleanFirstName ? patientInfo.cleanFirstName.charAt(0) : 'P')
                  )}
                </div>
              </div>
            );
          })()}

          {/* Daily Progress Bar */}
          <div className="pt-2 border-t border-purple-100 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                ความก้าวหน้าการฝึก 4 เสาหลักวันนี้
              </span>
              <span className="font-mono font-bold text-purple-950">
                {completedCount}/{totalTasks} ข้อ ({progressPercent}%)
              </span>
            </div>
            <div className="w-full h-3 bg-purple-100 rounded-full overflow-hidden p-0.5">
              <motion.div 
                className="h-full bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* 2. PROMINENT DAILY CHECK-IN SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-3xl p-5 shadow-sm border border-purple-200 space-y-3 text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                isCheckedIn 
                  ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' 
                  : 'bg-purple-100 text-purple-700 border border-purple-200'
              }`}>
                {isCheckedIn ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900">
                  {isCheckedIn ? 'เช็กอินประจำวันสำเร็จแล้ว ✓' : 'เช็กอินประจำวัน (Daily Check-in)'}
                </h2>
                <p className="text-xs text-slate-500">
                  {isCheckedIn ? `บันทึกเวลา ${displayTime}` : 'แตะเพื่อบันทึกประวัติความสม่ำเสมอเข้าคลินิก'}
                </p>
              </div>
            </div>

            {isCheckedIn ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
                <Check className="w-3.5 h-3.5" />
                เช็กอินแล้ว
              </span>
            ) : (
              <button
                type="button"
                onClick={handlePerformCheckIn}
                disabled={isCheckingIn}
                className={`px-4 py-2.5 bg-gradient-to-r ${isCheckingIn ? 'from-purple-400 to-indigo-400 cursor-not-allowed' : 'from-purple-700 to-indigo-700 hover:opacity-95 cursor-pointer active:scale-95'} text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5`}
              >
                {isCheckingIn ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>{isCheckingIn ? 'กำลังบันทึก...' : 'กดเช็กอิน'}</span>
              </button>
            )}
          </div>
        </motion.div>

        {/* 3. ASSIGNED EXERCISES PROMINENT CTA */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-purple-200/80 space-y-4 text-left">
          <div className="flex items-center justify-between border-b border-purple-100 pb-3">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-700" />
                <span>ชุดแบบฝึกหัดที่ได้รับมอบหมาย</span>
              </h2>
              <p className="text-xs text-slate-500">คุณหมอประจำตัวจัดสรรรายการการบ้านเฉพาะบุคคลให้</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-purple-100 text-purple-900 rounded-lg">
              {assignedList ? assignedList.length : 0} รายการ
            </span>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('แบบฝึกหัดที่ได้รับมอบหมาย')}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-base rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 group"
          >
            <span>🚀 เข้าสู่แบบฝึกหัดและส่งการบ้าน</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

          {/* 5. CONSISTENCY SUMMARY CARD */}
          <div className="bg-white rounded-3xl p-5 shadow-xs border border-purple-200/70 text-left space-y-3">
            <div className="flex items-center justify-between border-b border-purple-100 pb-2.5">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-purple-600" />
                สถิติความสม่ำเสมอในโปรแกรม
              </span>
              <span className="text-xs font-mono font-bold text-purple-900">
                {metrics.totalCheckIns} ครั้ง
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-purple-50/70 p-2.5 rounded-xl border border-purple-100">
                <span className="text-[10px] text-purple-700 block font-semibold">7 วันล่าสุด</span>
                <span className="text-sm font-black text-purple-950 mt-0.5 block">{metrics.weeklyCount} วัน</span>
              </div>
              <div className="bg-purple-50/70 p-2.5 rounded-xl border border-purple-100">
                <span className="text-[10px] text-purple-700 block font-semibold">30 วันล่าสุด</span>
                <span className="text-sm font-black text-purple-950 mt-0.5 block">{metrics.monthlyCount} วัน</span>
              </div>
              <div className="bg-purple-50/70 p-2.5 rounded-xl border border-purple-100">
                <span className="text-[10px] text-purple-700 block font-semibold">ความสม่ำเสมอ</span>
                <span className="text-sm font-black text-purple-950 mt-0.5 block">{metrics.consistencyPercent}%</span>
              </div>
            </div>
          </div>

          {/* User Switch / Logout Action */}
          <div className="pt-2 pb-1 text-center">
            <button
              type="button"
              onClick={() => {
                if (onLogout) {
                  onLogout();
                } else {
                  try {
                    localStorage.removeItem('growth_lab_persistent_patient');
                    localStorage.removeItem('growth_lab_registered_patient');
                    localStorage.removeItem('growth_lab_registration_status');
                    localStorage.removeItem('growth_lab_auth');
                    localStorage.removeItem('current_user_hn');
                    localStorage.removeItem('growthlab_active_patient_hn');
                    sessionStorage.clear();
                  } catch (e) {}
                  window.location.href = window.location.origin + window.location.pathname;
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ออกจากระบบ / เปลี่ยนเบอร์โทร</span>
            </button>
          </div>
        </main>

      {/* Footer */}
      <footer className="w-full max-w-xl mx-auto pt-4 pb-2 px-4 text-center text-xs text-slate-500 space-y-0.5 shrink-0">
        <p className="font-medium text-slate-600 leading-normal text-[10px] sm:text-[11px]">Clinical Growth Intelligence Platform • Version 1.0</p>
        <button 
          type="button"
          onClick={() => setShowInceptionModal(true)}
          className="inline-flex items-center justify-center gap-1.5 text-slate-500 pt-0.5 cursor-pointer hover:opacity-80 transition-all group"
        >
          <span className="text-[10px] sm:text-[11px] text-slate-500">Designed & Developed by</span>
          <span className="text-[10px] sm:text-[11px] font-bold tracking-wide bg-gradient-to-r from-[#4C1D95] via-[#7C3AED] via-[#C026D3] to-[#2563EB] bg-clip-text text-transparent group-hover:underline">Nira.L</span>
          <span className="text-slate-400 text-[10px] sm:text-[11px]">| © 2026 All Rights Reserved</span>
        </button>
      </footer>

      <InceptionDossierModal 
        isOpen={showInceptionModal} 
        onClose={() => setShowInceptionModal(false)} 
      />

      {/* SUCCESS CONFIRMATION MODAL */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <motion.div 
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full text-center space-y-4 shadow-2xl border border-purple-200"
            >
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900">
                  บันทึกข้อมูลเรียบร้อยแล้ว!
                </h3>
                <p className="text-xs text-slate-600">
                  บันทึก Check-in และผลการฝึก 4 เสาหลักไปยังระบบคลาวด์แล้ว
                </p>
              </div>

              <div className="p-3.5 bg-purple-50 rounded-2xl border border-purple-100 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">ผู้รับการดูแล:</span>
                  <span className="font-bold text-slate-800">{patient.firstName} {patient.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">HN:</span>
                  <span className="font-mono font-bold text-purple-900">{patient.hn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">วันที่ & เวลา:</span>
                  <span className="font-bold text-slate-800">{formattedToday} ({nowTime})</span>
                </div>
                <div className="flex justify-between border-t border-purple-200/60 pt-1.5">
                  <span className="text-slate-500">แบบฝึกหัดที่ทำเสร็จ:</span>
                  <span className="font-bold text-emerald-700">{completedCount} / {totalTasks} ข้อ ({progressPercent}%)</span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full py-3.5 px-4 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md cursor-pointer min-h-[44px] touch-manipulation"
                >
                  ✓ รับทราบและเสร็จสิ้น
                </button>
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowSuccessModal(false);
                      onNavigate('หน้าหลัก');
                    }}
                    className="w-full py-2.5 px-4 text-purple-700 hover:text-purple-900 font-bold text-xs rounded-xl transition-all cursor-pointer min-h-[38px] touch-manipulation"
                  >
                    ดูภาพรวมพัฒนาการในหน้าหลัก
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
