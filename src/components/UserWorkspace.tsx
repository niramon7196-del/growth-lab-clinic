import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  User, 
  QrCode, 
  Calendar, 
  Clock, 
  Brain, 
  Apple, 
  Moon, 
  Flame, 
  Camera, 
  CheckCircle2, 
  Activity, 
  Edit2, 
  Trash2, 
  Plus, 
  ShieldCheck, 
  TrendingUp, 
  Sparkles, 
  FileText, 
  Video, 
  Phone, 
  Download, 
  Printer, 
  ChevronRight, 
  AlertCircle, 
  History,
  Scale,
  Ruler,
  Award,
  CalendarPlus,
  Loader2
} from 'lucide-react';
import { Patient, SessionLog, Appointment, HomeworkAssignment, NutritionLog, GrowthLog, ExerciseLog, CheckInRecord } from '../types';
import { calculateConsistencyMetrics, formatThaiDate, formatThaiTimestamp, hasCheckedInToday, formatAppointmentTime } from '../utils/checkInCalculations';
import HomeworkAssignmentManager from './HomeworkAssignmentManager';
import TreatmentRecords from './TreatmentRecords';
import GrowthNutritionScore from './GrowthNutritionScore';
import SleepTracker from './SleepTracker';
import ExerciseTracker from './ExerciseTracker';
import ExerciseTrainer from './ExerciseTrainer';
import BeforeAfter from './BeforeAfter';
import { VERIFIED_EXERCISES } from '../data';
import { resolvePatientAppointments } from '../utils/appointmentMockService';
import { getPatientAssignedExercises } from '../../exerciseHelper';
import { useScrollLock } from '../utils';
import { Logo } from './Logo';
import { downloadAppointmentIcs, getGoogleCalendarWebUrl, saveLocalCalendarRecord } from '../utils/calendarExport';
import { syncAppointmentToGoogleCalendar, getGoogleCalendarConnectionStatus } from '../services/googleCalendar';
import { generateQRDataURL, getParticipantDeepLink, createDownloadableQRCanvas } from '../utils/qrCodeGenerator';
import PatientQRModal from './PatientQRModal';
import { formatPatientDisplay, detectGenderFromPatientData } from '../utils/patientUtils';

interface UserWorkspaceProps {
  patient?: Patient;
  logs: SessionLog[];
  appointments: Appointment[];
  onBack: () => void;
  onEditPatient: (patient: Patient) => void;
  onDeletePatient: (patientId: string) => void;
  onAddLog: (log: Omit<SessionLog, 'id'>) => void;
  onDeleteLog: (logId: string) => void;
  onCheckIn: (
    patientId: string, 
    source?: 'APP' | 'QR', 
    performedBy?: string, 
    method?: 'participant_self_check_in' | 'staff_recorded_check_in'
  ) => void;
  onAddAppointment: (appointment: Omit<Appointment, 'id' | 'patientName'>) => void;
  onUpdateAppointmentStatus: (id: string, status: 'pending' | 'completed' | 'cancelled') => void;
  onDeleteAppointment: (id: string) => void;
  onUpdatePatientAssignments?: (patientId: string, assignments: HomeworkAssignment[]) => void;
  onUpdatePatientNutrition?: (patientId: string, log: NutritionLog) => void;
  onUpdatePatientGrowth?: (patientId: string, log: GrowthLog) => void;
  onUpdatePatientExercise?: (patientId: string, log: ExerciseLog) => void;
  onUpdatePatientSleep?: (patientId: string, log: any) => void;
  videoList?: any[];
  settings?: any;
}

export default function UserWorkspace({
  patient,
  logs,
  appointments,
  onBack,
  onEditPatient,
  onDeletePatient,
  onAddLog,
  onDeleteLog,
  onCheckIn,
  onAddAppointment,
  onUpdateAppointmentStatus,
  onDeleteAppointment,
  onUpdatePatientAssignments,
  onUpdatePatientNutrition,
  onUpdatePatientGrowth,
  onUpdatePatientExercise,
  onUpdatePatientSleep,
  videoList = [],
  settings,
}: UserWorkspaceProps) {
  // 6 Main Workspace Tabs: 'ภาพรวม' | 'แบบฝึก' | 'Check-in' | 'Progress' | 'Before / After' | 'นัดหมาย'
  const [activeTab, setActiveTab] = useState<'ภาพรวม' | 'แบบฝึก' | 'Check-in' | 'Progress' | 'Before / After' | 'นัดหมาย'>('ภาพรวม');

  // Sub-tabs for Progress: 'EF' | 'โภชนาการ' | 'การนอน' | 'การเคลื่อนไหว'
  const [progressSubTab, setProgressSubTab] = useState<'EF' | 'โภชนาการ' | 'การนอน' | 'การเคลื่อนไหว'>('EF');

  // Modal States
  const [showQRModal, setShowQRModal] = useState(false);
  const [showAddApptModal, setShowAddApptModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showManualCheckInModal, setShowManualCheckInModal] = useState(false);
  const [showDeletePatientModal, setShowDeletePatientModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [manualStaffActor, setManualStaffActor] = useState<string>('ทันตแพทย์หญิง นภาพร วรรณษา (ทันตแพทย์ผู้ให้การรักษาและเจ้าของคลินิก)');
  const [qrCopied, setQrCopied] = useState(false);
  const [isDownloadingQR, setIsDownloadingQR] = useState(false);
  const [qrDownloadSuccess, setQrDownloadSuccess] = useState(false);
  useScrollLock(showQRModal || showAddApptModal || showEditProfileModal || showManualCheckInModal || showDeletePatientModal)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowQRModal(false);
        setShowAddApptModal(false);
        setShowEditProfileModal(false);
        setShowManualCheckInModal(false);
        setShowDeletePatientModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);;

  const handleShareOrDownloadQR = async () => {
    if (!patient) return;
    try {
      setIsDownloadingQR(true);
      const deepLink = getParticipantDeepLink(patient);
      const qrUrl = qrDataUrl || await generateQRDataURL(deepLink, { width: 400, margin: 2 });
      if (!qrUrl) {
        setIsDownloadingQR(false);
        return;
      }
      const downloadablePng = await createDownloadableQRCanvas(patient, qrUrl);
      
      const res = await fetch(downloadablePng);
      const blob = await res.blob();
      const fileName = `QRCode_${patient.hn}.png`;
      
      const shareFallback = () => {
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        
        setQrDownloadSuccess(true);
        setTimeout(() => setQrDownloadSuccess(false), 3000);
      };

      if (navigator.canShare) {
        try {
          const file = new File([blob], fileName, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `QR Code ${patient.firstName}`,
            });
            setQrDownloadSuccess(true);
            setTimeout(() => setQrDownloadSuccess(false), 3000);
          } else {
            shareFallback();
          }
        } catch (shareErr) {
          if (shareErr.name !== 'AbortError') {
            console.error('Share error:', shareErr);
            shareFallback();
          }
        }
      } else {
        shareFallback();
      }
    } catch (err) {
      console.error('Download QR error:', err);
    } finally {
      setIsDownloadingQR(false);
    }
  };


  // Generate real scannable QR Code whenever patient or QR modal changes
  React.useEffect(() => {
    if (patient) {
      const token = patient.qrToken || patient.id;
      const deepLink = getParticipantDeepLink(patient);
      generateQRDataURL(deepLink, { width: 400, margin: 2 }).then(url => {
        setQrDataUrl(url);
      });
    }
  }, [patient, showQRModal]);

  // New Appointment Form State
  const [apptDate, setApptDate] = useState(new Date().toISOString().split('T')[0]);
  const [apptTime, setApptTime] = useState('10:00');
  const [apptType, setApptType] = useState<'clinical' | 'online' | 'consultation'>('clinical');
  const [apptNotes, setApptNotes] = useState('');
  const [syncWithGCal, setSyncWithGCal] = useState(true);
  const [isSyncingGCal, setIsSyncingGCal] = useState(false);
  const [syncingApptId, setSyncingApptId] = useState<string | null>(null);
  const [deletingAppt, setDeletingAppt] = useState<Appointment | null>(null);

  // Edit Patient Form State
  const initialGender = patient ? detectGenderFromPatientData(patient) : 'ชาย';
  const [editForm, setEditForm] = useState<{
    firstName: string;
    lastName: string;
    nickname: string;
    hn: string;
    age: number;
    gender: string;
    weight: string;
    height: string;
    phone: string;
    address: string;
    notes: string;
    status: string;
  }>({
    firstName: patient?.firstName || '',
    lastName: patient?.lastName || '',
    nickname: patient?.nickname || '',
    hn: patient?.hn || '',
    age: patient?.age || 7,
    gender: initialGender,
    weight: patient?.weight !== undefined && patient?.weight !== null && patient?.weight > 0 ? String(patient.weight) : '',
    height: patient?.height !== undefined && patient?.height !== null && patient?.height > 0 ? String(patient.height) : '',
    phone: patient?.parentPhone || patient?.phone || '',
    address: patient?.address || '',
    notes: patient?.notes || '',
    status: patient?.status || 'active',
  });

  useEffect(() => {
    if (patient) {
      const g = detectGenderFromPatientData(patient);
      const cleanN = patient.notes?.replace(/\[เพศ:\s*.*?\]\s*/g, '').trim() || '';
      setEditForm({
        firstName: patient.firstName || '',
        lastName: patient.lastName || '',
        nickname: patient.nickname || '',
        hn: patient.hn || '',
        age: patient.age || 7,
        gender: g,
        weight: patient.weight !== undefined && patient.weight !== null && patient.weight > 0 ? String(patient.weight) : '',
        height: patient.height !== undefined && patient.height !== null && patient.height > 0 ? String(patient.height) : '',
        phone: patient.parentPhone || patient.phone || '',
        address: patient.address || '',
        notes: cleanN,
        status: patient.status || 'active',
      });
    }
  }, [patient]);

  // Calculate Consistency Metrics for this specific patient
  const metrics = useMemo(() => {
    return patient ? calculateConsistencyMetrics(patient) : null;
  }, [patient]);

  const patientInfo = useMemo(() => {
    return patient ? formatPatientDisplay(patient) : null;
  }, [patient]);

  const handleDeleteDailyLog = async (e: React.MouseEvent, itemOrId: CheckInRecord | string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm("ต้องการลบรายการประวัตินี้ใช่หรือไม่?")) {
      return;
    }

    const logId = typeof itemOrId === 'string'
      ? itemOrId
      : (itemOrId.id || itemOrId.timestamp || itemOrId.date || '');

    if (patient) {
      const updatedHistory = (patient.checkInHistory || []).filter(l => 
        (l.id || l.timestamp || l.date) !== logId && l.id !== logId && l.timestamp !== logId && l.date !== logId
      );
      const updatedPatient = { ...patient, checkInHistory: updatedHistory };
      onEditPatient(updatedPatient);
    }

    try {
      await fetch("https://script.google.com/macros/s/AKfycbyk_1CbD39HQcP8vOXofkPJsYeLOvgklYk608MuK-v4vt4NgUa_Ang73AHpubIO4Pbv/exec", {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({
          action: "delete",
          sheetName: "Daily_Logs",
          id: logId
        })
      });
    } catch (err) {
      console.warn('[UserWorkspace] Error deleting daily log from Google Sheets:', err);
    }
  };

  // Scoped Data
  const patientLogs = useMemo(() => {
    return patient ? logs.filter((l) => l.patientId === patient.id) : [];
  }, [logs, patient]);

  const patientAppointments = useMemo(() => {
    return resolvePatientAppointments(patient, appointments);
  }, [appointments, patient]);

  const upcomingAppt = useMemo(() => {
    return patientAppointments.find((a) => a.status === 'pending') || patientAppointments[0];
  }, [patientAppointments]);

  // If patient not found, render clean Empty / Error State
  if (!patient) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-purple-200/80 shadow-2xs text-center space-y-4 max-w-2xl mx-auto my-12">
        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto text-rose-500 text-3xl">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">ไม่พบข้อมูลการดูแลรายนี้</h2>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          ไม่สามารถโหลดข้อมูลของรหัสการดูแลที่ระบุได้ กรุณากลับไปที่หน้ารายชื่อเพื่อเลือกการดูแลใหม่อีกครั้ง
        </p>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับไปรายชื่อการดูแล</span>
        </button>
      </div>
    );
  }

  const gender = detectGenderFromPatientData(patient);
  const cleanNotes = patient.notes?.replace(/\[เพศ:\s*.*?\]\s*/g, '').trim() || '-';
  const hasHeightWeight = Boolean(patient.height && Number(patient.height) > 0 && patient.weight && Number(patient.weight) > 0);
  const bmi = hasHeightWeight ? (patient.weight / Math.pow(patient.height / 100, 2)).toFixed(1) : '-';

  // Download .ICS calendar file for this appointment
  const handleDownloadAppointmentIcs = (appt: Appointment) => {
    try {
      downloadAppointmentIcs({
        id: appt.id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        hn: patient.hn,
        date: appt.date,
        time: appt.time,
        type: appt.type,
        notes: appt.notes,
      });
      alert(`ดาวน์โหลดไฟล์ปฏิทิน .ics สำหรับ ${patient.firstName} สำเร็จ!`);
    } catch (err) {
      console.error('Failed to download .ics:', err);
      alert('ไม่สามารถดาวน์โหลดไฟล์ปฏิทินได้');
    }
  };

  // Open Google Calendar Web page directly (no OAuth errors)
  const handleOpenGoogleCalendarForAppointment = (appt: Appointment) => {
    try {
      const url = getGoogleCalendarWebUrl({
        id: appt.id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        hn: patient.hn,
        date: appt.date,
        time: appt.time,
        type: appt.type,
        notes: appt.notes,
      });
      saveLocalCalendarRecord({
        id: appt.id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        hn: patient.hn,
        date: appt.date,
        time: appt.time,
        type: appt.type,
        notes: appt.notes,
      });
      window.open(url, '_blank');
    } catch (err) {
      console.error('Failed to open Google Calendar:', err);
    }
  };

  // Submit Add Appointment for this user
  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncingGCal(true);

    const apptItem = {
      id: `appt_${Date.now()}`,
      patientName: `${patient.firstName} ${patient.lastName}`,
      hn: patient.hn,
      date: apptDate,
      time: apptTime,
      type: apptType,
      notes: apptNotes,
    };

    // Save in LocalStorage
    saveLocalCalendarRecord(apptItem);

    let googleCalendarEventId: string | undefined = undefined;
    let googleCalendarHtmlLink: string | undefined = undefined;

    if (syncWithGCal) {
      const gcalStatus = getGoogleCalendarConnectionStatus();
      if (gcalStatus.isConnected) {
        try {
          const tempAppt: Appointment = {
            id: apptItem.id,
            patientId: patient.id,
            patientName: apptItem.patientName,
            hn: patient.hn,
            date: apptDate,
            time: apptTime,
            type: apptType,
            notes: apptNotes,
            status: 'pending',
          };
          const syncRes = await syncAppointmentToGoogleCalendar(tempAppt);
          googleCalendarEventId = syncRes.googleCalendarEventId;
          googleCalendarHtmlLink = syncRes.googleCalendarHtmlLink;
        } catch (e) {
          console.warn('[UserWorkspace] Google Calendar live sync fallback:', e);
          googleCalendarHtmlLink = getGoogleCalendarWebUrl(apptItem);
          window.open(googleCalendarHtmlLink, '_blank');
        }
      } else {
        googleCalendarHtmlLink = getGoogleCalendarWebUrl(apptItem);
        window.open(googleCalendarHtmlLink, '_blank');
      }
    }

    onAddAppointment({
      patientId: patient.id,
      date: apptDate,
      time: apptTime,
      type: apptType,
      notes: apptNotes,
      status: 'pending',
      googleCalendarEventId,
      googleCalendarHtmlLink,
    });
    setIsSyncingGCal(false);
    setShowAddApptModal(false);
    setApptNotes('');
  };

  // Submit Manual Check-in by Staff
  const handleManualCheckIn = () => {
    onCheckIn(patient.id, 'APP', manualStaffActor, 'staff_recorded_check_in');
    setShowManualCheckInModal(false);
  };

  // Submit Edit Patient
  const handleSaveEditProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedNotes = `[เพศ: ${editForm.gender}] ${editForm.notes}`.trim();
    const parsedWeight = parseFloat(String(editForm.weight).trim());
    const parsedHeight = parseFloat(String(editForm.height).trim());

    onEditPatient({
      ...patient,
      hn: editForm.hn.trim(),
      firstName: editForm.firstName.trim(),
      lastName: editForm.lastName.trim(),
      nickname: editForm.nickname.trim(),
      age: Number(editForm.age) || 7,
      gender: editForm.gender as any,
      weight: isNaN(parsedWeight) ? 0 : parsedWeight,
      height: isNaN(parsedHeight) ? 0 : parsedHeight,
      parentPhone: editForm.phone.trim(),
      phone: editForm.phone.trim(),
      address: editForm.address.trim(),
      notes: formattedNotes,
      status: editForm.status as any,
    });
    setShowEditProfileModal(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 text-left w-full max-w-full overflow-x-hidden box-border pb-12"
    >
      {/* 1. TOP NAVIGATION & PATIENT HERO CARD */}
      <div className="space-y-4">
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-bold text-purple-900 bg-white hover:bg-purple-50 px-4 py-2 rounded-xl border border-purple-200 shadow-2xs transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-purple-700" />
            <span>← กลับไปรายชื่อการดูแลทั้งหมด</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500">
              Workspace รายบุคคล •
            </span>
            <span className="text-xs font-black text-purple-900 bg-purple-50 px-2.5 py-0.5 rounded-lg border border-purple-100 font-mono">
              HN-{patient.hn}
            </span>
          </div>
        </div>

        {/* Hero Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-purple-200/80 shadow-2xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center text-white font-black text-2xl sm:text-3xl shadow-md shrink-0">
                  {patient.nickname?.slice(0, 2) || patient.firstName.slice(0, 2)}
                </div>
                {metrics && (
                  <span
                    className={`w-3.5 h-3.5 rounded-full absolute -top-1 -right-1 border-2 border-white ${
                      hasCheckedInToday(patient)
                        ? 'bg-emerald-500 ring-2 ring-emerald-200 animate-pulse'
                        : metrics.status === 'ACTIVE'
                        ? 'bg-emerald-500'
                        : metrics.status === 'AT RISK'
                        ? 'bg-amber-500'
                        : metrics.status === 'DORMANT'
                        ? 'bg-orange-500'
                        : 'bg-rose-500'
                    }`}
                    title={`สถานะ: ${metrics.status}${hasCheckedInToday(patient) ? ' (เช็คอินวันนี้แล้ว)' : ''}`}
                  />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Logo className="w-24 sm:w-28 h-auto mr-1" />
                  <span className="font-mono text-xs font-black text-purple-900 bg-purple-100 px-2.5 py-0.5 rounded-md border border-purple-200">
                    {patient.hn}
                  </span>
                  <span
                    className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                      patient.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : patient.status === 'completed'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {patient.status === 'active' ? 'กำลังฝึก' : patient.status === 'completed' ? 'สำเร็จ' : 'พักแผน'}
                  </span>
                  {patientInfo && (
                    <span className={patientInfo.ageGroupBadge.badgeClass}>
                      {patientInfo.ageGroupTag}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-[#252536] tracking-tight flex items-center gap-2 flex-wrap">
                  <span>{patientInfo?.displayName || `${patient.firstName} ${patient.lastName}`}</span>
                  {patientInfo?.formattedNickname && (
                    <span className="text-lg sm:text-xl font-bold text-purple-700">
                      {patientInfo.formattedNickname}
                    </span>
                  )}
                </h1>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                  <span>อายุ: <strong className="text-slate-800">{patientInfo?.ageDisplayText || `${patient.age} ปี`}</strong> ({gender})</span>
                  <span>•</span>
                  <span>แพทย์ผู้ดูแล: <strong className="text-slate-800">ทันตแพทย์หญิง นภาพร วรรณษา</strong></span>
                  {patient.parentPhone && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-purple-600" />
                        <strong className="text-slate-800">{patient.parentPhone}</strong>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Hero Actions */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => setShowQRModal(true)}
                className="px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-xs rounded-xl border border-purple-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="เปิดดู QR Code ประจำตัว"
              >
                <QrCode className="w-4 h-4 text-purple-700" />
                <span>ดู QR Code</span>
              </button>
              <button
                onClick={handleShareOrDownloadQR}
                className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="ดาวน์โหลด QR Code ประจำตัวสำหรับพิมพ์มอบให้ผู้ปกครอง"
              >
                <Download className="w-4 h-4 text-emerald-700" />
                <span>ดาวน์โหลด QR</span>
              </button>
              <button
                onClick={() => setShowAddApptModal(true)}
                className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold text-xs rounded-xl border border-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Calendar className="w-4 h-4 text-indigo-700" />
                <span>+ นัดใหม่</span>
              </button>
              <button
                onClick={() => {
                  setEditForm({
                    firstName: patient.firstName,
                    lastName: patient.lastName,
                    nickname: patient.nickname || '',
                    hn: patient.hn,
                    age: patient.age,
                    gender: gender as any,
                    weight: patient.weight !== undefined && patient.weight !== null && patient.weight > 0 ? String(patient.weight) : '',
                    height: patient.height !== undefined && patient.height !== null && patient.height > 0 ? String(patient.height) : '',
                    phone: patient.parentPhone || '',
                    address: (patient as any).address || '',
                    notes: cleanNotes,
                    status: patient.status,
                  });
                  setShowEditProfileModal(true);
                }}
                className="px-3 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer"
                title="แก้ไขข้อมูลการดูแล"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowDeletePatientModal(true)}
                className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-all cursor-pointer"
                title="ลบรายชื่อผู้รับการดูแลนี้"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 6 WORKSPACE TABS NAVIGATION BAR */}
      <div className="flex items-center gap-1.5 p-1.5 bg-white rounded-2xl border border-purple-200/80 shadow-2xs overflow-x-auto no-scrollbar">
        {[
          { id: 'ภาพรวม', label: 'ภาพรวม (Overview)', icon: ShieldCheck },
          { id: 'แบบฝึก', label: 'แบบฝึก (Exercises)', icon: Brain },
          { id: 'Check-in', label: 'บันทึก Check-in', icon: CheckCircle2 },
          { id: 'Progress', label: 'Progress & ประเมินผล', icon: TrendingUp },
          { id: 'Before / After', label: 'ก่อน / หลัง (Before & After)', icon: Camera },
          { id: 'นัดหมาย', label: 'นัดหมาย', icon: Calendar },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. TAB CONTENTS */}
      <div className="space-y-6">
        {/* =========================================================================
            TAB 1: ภาพรวม (Overview)
            ========================================================================= */}
        {activeTab === 'ภาพรวม' && (
          <div className="space-y-6">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: สถานะ Check-in & ความสม่ำเสมอ */}
              <div className="bg-white p-5 rounded-3xl border border-purple-200/80 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                    Status
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        hasCheckedInToday(patient)
                          ? 'bg-emerald-500 ring-2 ring-emerald-200 animate-pulse'
                          : metrics?.status === 'ACTIVE'
                          ? 'bg-emerald-500'
                          : metrics?.status === 'AT RISK'
                          ? 'bg-amber-500'
                          : metrics?.status === 'DORMANT'
                          ? 'bg-orange-500'
                          : 'bg-rose-500'
                      }`}
                    />
                    <span className="text-xl font-black text-slate-900 block">
                      {metrics?.status || 'ACTIVE'}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-500 block mt-0.5">
                    ความสม่ำเสมอในการเช็คอิน
                  </span>
                </div>
              </div>

              {/* Card 2: Streak วันต่อเนื่อง */}
              <div className="bg-white p-5 rounded-3xl border border-amber-200/80 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Flame className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                    Streak
                  </span>
                </div>
                <div>
                  <span className="text-2xl font-black text-slate-900 block">
                    {metrics?.streakDays || 0} <span className="text-xs font-semibold text-slate-500">วันต่อเนื่อง</span>
                  </span>
                  <span className="text-xs font-bold text-slate-500 block mt-0.5">
                    เช็คอินทั้งหมด {metrics?.totalCheckIns || 0} ครั้ง
                  </span>
                </div>
              </div>

              {/* Card 3: สัดส่วนร่างกาย / BMI */}
              <div className="bg-white p-5 rounded-3xl border border-emerald-200/80 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Scale className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    BMI: {bmi}
                  </span>
                </div>
                <div>
                  <span className="text-xl font-black text-slate-900 block">
                    {hasHeightWeight ? (
                      <>{patient.height} <span className="text-xs font-normal text-slate-500">ซม.</span> • {patient.weight} <span className="text-xs font-normal text-slate-500">กก.</span></>
                    ) : (
                      <span className="text-slate-400 font-bold text-base">- (ยังไม่ได้ระบุ)</span>
                    )}
                  </span>
                  <span className="text-xs font-bold text-slate-500 block mt-0.5">
                    ส่วนสูงและน้ำหนักล่าสุด
                  </span>
                </div>
              </div>

              {/* Card 4: นัดหมายครั้งถัดไป */}
              <div className="bg-white p-5 rounded-3xl border border-indigo-200/80 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                    Next Appt
                  </span>
                </div>
                <div>
                  {upcomingAppt ? (
                    <div>
                      <span className="text-sm font-black text-slate-900 block truncate">
                        {formatThaiDate(upcomingAppt.date)} ({formatAppointmentTime(upcomingAppt.time)} น.)
                      </span>
                      <span className="text-xs font-bold text-indigo-700 block mt-0.5">
                        {upcomingAppt.type === 'clinical' ? 'ตรวจที่คลินิก' : upcomingAppt.type === 'online' ? 'ปรึกษาออนไลน์' : 'ปรึกษาพิเศษ'}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-sm font-black text-slate-400 block">
                        ยังไม่มีนัดหมาย
                      </span>
                      <button
                        onClick={() => setShowAddApptModal(true)}
                        className="text-xs font-bold text-indigo-600 hover:underline block mt-0.5 cursor-pointer"
                      >
                        + กดเพิ่มการนัดหมาย
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions & Clinical Overview Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Assigned Homework & Exercises Today */}
              <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-purple-200/80 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    <h3 className="text-base font-black text-slate-900">แบบฝึกที่ได้รับมอบหมายในปัจจุบัน</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('แบบฝึก')}
                    className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>จัดการแบบฝึก</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {(() => {
                  let resolvedList = getPatientAssignedExercises(VERIFIED_EXERCISES, patient);
                  
                  // Fallback: Manually parse patient.assignedTasks if resolvedList is empty 
                  // to support raw comma-separated strings (e.g. "omt_tongue_spot, omt_lip_seal")
                  if (resolvedList.length === 0 && patient) {
                    const rawTasks = patient.assignedTasks || (patient as any).assignedExercises || (patient as any).assignments;
                    if (rawTasks) {
                      const codes = Array.isArray(rawTasks) ? rawTasks : (typeof rawTasks === 'string' ? rawTasks.split(/[,;]+/) : []);
                      const validCodes = codes.map(c => typeof c === 'string' ? c.trim() : (c.exerciseId || c.id || c)).filter(Boolean);
                      if (validCodes.length > 0) {
                        resolvedList = getPatientAssignedExercises(VERIFIED_EXERCISES, validCodes);
                        
                        // Absolute fallback: if mapping still fails, force render basic items
                        if (resolvedList.length === 0) {
                          resolvedList = validCodes.map(code => ({
                            id: code,
                            exerciseId: code,
                            title: String(code).replace(/_/g, ' '),
                            category: 'movement',
                            targetReps: 10,
                            durationMinutes: 5
                          }));
                        }
                      }
                    }
                  }

                  if (resolvedList.length === 0) {
                    return (
                      <div className="p-8 text-center bg-purple-50/40 rounded-2xl border border-purple-100 space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-purple-100/80 text-purple-700 flex items-center justify-center mx-auto text-xl shadow-2xs">
                          🧘
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-black text-slate-800">ยังไม่มีแบบฝึกที่ได้รับมอบหมาย</p>
                          <p className="text-xs text-slate-500 font-medium">ผู้รับการดูแลนี้ยังไม่ได้รับการมอบหมายท่าฝึก 4 เสาหลัก</p>
                        </div>
                        <button
                          onClick={() => setActiveTab('แบบฝึก')}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-2xs cursor-pointer inline-flex items-center gap-1.5 transition-all"
                        >
                          <span>+ มอบหมายแบบฝึกแรก</span>
                        </button>
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-2.5">
                      {resolvedList.map((hw: any) => {
                        const exId = hw.exerciseId || hw.id;
                        const exercise = VERIFIED_EXERCISES.find(e => e.id === exId) || hw;
                        return (
                          <div
                            key={hw.assignmentId || hw.id || exId}
                            className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                                {exercise?.category === 'breathing' ? '🫁' : exercise?.category === 'tongue' ? '👅' : '💪'}
                              </div>
                              <div>
                                <span className="text-xs font-black text-slate-900 block">
                                  {exercise?.title || hw.title || exId}
                                </span>
                                <span className="text-[11px] text-slate-500 font-medium">
                                  เป้าหมาย: {hw.reps || hw.targetReps || 10} ครั้ง • {hw.durationMinutes || 5} นาที
                                </span>
                              </div>
                            </div>

                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border shrink-0 ${
                              hw.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {hw.status === 'completed' ? 'ทำแล้ววันนี้' : 'รอทำ'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Right 1 Col: Clinical Notes & Shortcuts */}
              <div className="space-y-4">
                {/* Clinical Notes Card */}
                <div className="bg-white p-6 rounded-3xl border border-purple-200/80 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-600" />
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">บันทึกทางคลินิก</h4>
                    </div>
                    <button
                      onClick={() => {
                        setEditForm({
                          firstName: patient.firstName,
                          lastName: patient.lastName,
                          nickname: patient.nickname || '',
                          hn: patient.hn,
                          age: patient.age,
                          gender: gender as any,
                          weight: patient.weight !== undefined && patient.weight !== null && patient.weight > 0 ? String(patient.weight) : '',
                          height: patient.height !== undefined && patient.height !== null && patient.height > 0 ? String(patient.height) : '',
                          phone: patient.parentPhone || '',
                          address: (patient as any).address || '',
                          notes: cleanNotes,
                          status: patient.status,
                        });
                        setShowEditProfileModal(true);
                      }}
                      className="text-slate-400 hover:text-purple-600 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 leading-relaxed font-medium">
                    {cleanNotes || 'ไม่มีบันทึกเพิ่มเติม'}
                  </p>
                </div>

                {/* Quick Navigation Cards */}
                <div className="bg-purple-50/70 p-5 rounded-3xl border border-purple-100 space-y-2">
                  <span className="text-[10px] font-black text-purple-900 uppercase tracking-widest block mb-2">
                    เมนูทางลัด Workspace
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setActiveTab('Check-in')}
                      className="p-3 bg-white hover:bg-purple-100 rounded-xl border border-purple-200/80 text-left transition-colors cursor-pointer shadow-2xs"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mb-1" />
                      <span className="text-xs font-bold text-slate-900 block">Check-in</span>
                      <span className="text-[10px] text-slate-500">ดูประวัติเช็คอิน</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('Progress')}
                      className="p-3 bg-white hover:bg-purple-100 rounded-xl border border-purple-200/80 text-left transition-colors cursor-pointer shadow-2xs"
                    >
                      <TrendingUp className="w-4 h-4 text-purple-600 mb-1" />
                      <span className="text-xs font-bold text-slate-900 block">Progress</span>
                      <span className="text-[10px] text-slate-500">EF, นอน, อาหาร</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: แบบฝึก (Exercises)
            ========================================================================= */}
        {activeTab === 'แบบฝึก' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-purple-200/80 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-black text-slate-900">การมอบหมายและจัดการแบบฝึก</h2>
                <p className="text-xs text-slate-500">
                  มอบหมายแบบฝึกเฉพาะบุคคลสำหรับ {patient.firstName} {patient.lastName} (HN: {patient.hn})
                </p>
              </div>
            </div>

            {/* Assignment Manager component */}
            <HomeworkAssignmentManager
              patient={patient}
              onUpdateAssignments={(patientId, assignments) => {
                if (onUpdatePatientAssignments) {
                  onUpdatePatientAssignments(patientId, assignments);
                }
              }}
            />
          </div>
        )}

        {/* =========================================================================
            TAB 3: CHECK-IN (Check-in History)
            ========================================================================= */}
        {activeTab === 'Check-in' && (
          <div className="space-y-6">
            {/* Header with Quick Action */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-purple-200/80 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-0.5 rounded-full text-xs font-black border border-emerald-200 mb-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Check-in History • เช็คอิน
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">
                    เช็คอินของ {patient.firstName} {patient.lastName}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    บันทึกเวลาและช่องทางการเข้าใช้งานรายวัน (QR Code หรือ แอปพลิเคชัน)
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowManualCheckInModal(true)}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ บันทึกเช็คอินแทนการดูแล</span>
                  </button>
                  <button
                    onClick={() => setShowQRModal(true)}
                    className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-xs rounded-xl border border-purple-200 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <QrCode className="w-4 h-4 text-purple-700" />
                    <span>QR Code</span>
                  </button>
                </div>
              </div>

              {/* Consistency KPI Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">สถานะความถี่</span>
                  <span className="text-sm font-black text-emerald-700 block mt-0.5">{metrics?.status || 'ACTIVE'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Streak ปัจจุบัน</span>
                  <span className="text-sm font-black text-amber-700 block mt-0.5">{metrics?.streakDays || 0} วัน</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">เช็คอินเดือนนี้</span>
                  <span className="text-sm font-black text-indigo-700 block mt-0.5">{(metrics as any)?.checkInsThisMonth || 0} ครั้ง</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">รวมทั้งหมด</span>
                  <span className="text-sm font-black text-purple-700 block mt-0.5">{metrics?.totalCheckIns || 0} ครั้ง</span>
                </div>
              </div>
            </div>

            {/* Check-in History Table */}
            <div className="bg-white rounded-3xl border border-purple-200/80 shadow-2xs overflow-hidden">
              {(!patient.checkInHistory || patient.checkInHistory.length === 0) ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto text-purple-600">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-black text-slate-800">ยังไม่มีเช็คอิน</h3>
                  <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                    เมื่อการดูแลทำการเช็คอินผ่านแอป หรือสแกน QR Code ประวัติจะปรากฏที่นี่โดยอัตโนมัติ
                  </p>
                  <button
                    onClick={() => setShowManualCheckInModal(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>บันทึกเช็คอินครั้งแรก</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-purple-50/70 border-b border-purple-100 text-[11px] font-black uppercase tracking-wider text-purple-950">
                        <th className="py-3.5 px-4 sm:px-6">วันที่</th>
                        <th className="py-3.5 px-3">เวลา</th>
                        <th className="py-3.5 px-3">ช่องทาง (Source)</th>
                        <th className="py-3.5 px-3">วิธีการบันทึก & ผู้ดำเนินการ</th>
                        <th className="py-3.5 px-4 text-right">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {patient.checkInHistory.map((rec) => (
                        <tr key={rec.id} className="hover:bg-purple-50/40 transition-colors">
                          <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900">
                            {formatThaiDate(rec.date)}
                          </td>
                          <td className="py-3.5 px-3 font-mono font-medium text-slate-600">
                            {rec.timestamp ? formatThaiTimestamp(rec.timestamp) : '-'}
                          </td>
                          <td className="py-3.5 px-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                              rec.source === 'QR'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-sky-50 text-sky-700 border-sky-200'
                            }`}>
                              {rec.source === 'QR' ? <QrCode className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                              <span>{rec.source === 'QR' ? 'QR Code' : 'Application'}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-slate-700 font-medium">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900">
                                {rec.performedBy || rec.actor || `${patient.firstName} ${patient.lastName}`}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {rec.method === 'staff_recorded_check_in' 
                                  ? '• เจ้าหน้าที่คลินิกบันทึกแทน' 
                                  : '• การดูแลบันทึกด้วยตนเอง'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>สำเร็จ (COMPLETED)</span>
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteDailyLog(e, rec)}
                                className="relative z-20 pointer-events-auto inline-flex items-center gap-1 px-2.5 py-1 text-rose-600 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs shrink-0"
                                title="ลบรายการประวัตินี้"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600 pointer-events-none" />
                                <span className="pointer-events-none">ลบ</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: PROGRESS & การประเมิน
            ========================================================================= */}
        {activeTab === 'Progress' && (
          <div className="space-y-6">
            {/* Sub-tab Navigation */}
            <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-purple-200/80 shadow-2xs overflow-x-auto no-scrollbar">
              {[
                { id: 'EF', label: 'EF & การฝึก', icon: Brain },
                { id: 'โภชนาการ', label: 'รายการอาหาร / GNS', icon: Apple },
                { id: 'การนอน', label: 'การนอนหลับ (Sleep)', icon: Moon },
                { id: 'การเคลื่อนไหว', label: 'การออกกำลังกาย', icon: Flame },
              ].map((sub) => {
                const Icon = sub.icon;
                const isSubActive = progressSubTab === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setProgressSubTab(sub.id as any)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                      isSubActive
                        ? 'bg-purple-100 text-purple-900 border border-purple-200 shadow-2xs'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{sub.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Sub-tab Content Area */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-purple-200/80 shadow-2xs">
              {progressSubTab === 'EF' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-lg font-black text-slate-900">บันทึกและประเมินผล EF / แบบฝึก</h3>
                  </div>
                  <ExerciseTrainer
                    patients={[patient]}
                    selectedPatientId={patient.id}
                    onSelectPatient={() => {}}
                    logs={patientLogs}
                    onAddLog={onAddLog}
                  />
                </div>
              )}

              {progressSubTab === 'โภชนาการ' && (
                <GrowthNutritionScore
                  patients={[patient]}
                  selectedPatientId={patient.id}
                  onUpdatePatientNutrition={onUpdatePatientNutrition || (() => {})}
                />
              )}

              {progressSubTab === 'การนอน' && (
                <SleepTracker
                  patients={[patient]}
                  selectedPatientId={patient.id}
                  onUpdatePatientSleep={onUpdatePatientSleep}
                  onAssignSleepEF={(pId, cfg) => {
                    onEditPatient({
                      ...patient,
                      assignedSleepEF: { ...(patient.assignedSleepEF || {}), ...cfg }
                    });
                  }}
                  isDoctorMode={true}
                />
              )}

              {progressSubTab === 'การเคลื่อนไหว' && (
                <ExerciseTracker
                  patients={[patient]}
                  selectedPatientId={patient.id}
                  onUpdatePatientExercise={onUpdatePatientExercise || (() => {})}
                />
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: ก่อน / หลัง (Before & After) - TOP-LEVEL MAIN TAB
            ========================================================================= */}
        {activeTab === 'Before / After' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-purple-200/80 shadow-2xs">
            <BeforeAfter
              patients={[patient]}
              selectedPatientId={patient.id}
              onUpdatePatient={onEditPatient}
              onBack={() => setActiveTab('ภาพรวม')}
            />
          </div>
        )}

        {/* =========================================================================
            TAB 5: นัดหมาย (Appointments)
            ========================================================================= */}
        {activeTab === 'นัดหมาย' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-purple-200/80 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    การนัดหมายของ {patient.firstName} {patient.lastName}
                  </h2>
                  <p className="text-xs text-slate-500">
                    จัดการ ยืนยัน หรือเพิ่มนัดหมายติดตามผลสำหรับการดูแลรายนี้
                  </p>
                </div>
                <button
                  onClick={() => setShowAddApptModal(true)}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ สร้างนัดหมายใหม่</span>
                </button>
              </div>
            </div>

            {/* Appointments List */}
            <div className="bg-white rounded-3xl border border-purple-200/80 shadow-2xs overflow-hidden">
              {patientAppointments.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto text-purple-600">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-black text-slate-800">ยังไม่มีประวัติการนัดหมาย</h3>
                  <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                    กดปุ่มสร้างนัดหมายใหม่เพื่อบันทึกวันและเวลานัดหมายติดตามผล
                  </p>
                  <button
                    onClick={() => setShowAddApptModal(true)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    + สร้างนัดหมาย
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {patientAppointments.map((appt) => (
                    <div
                      key={appt.id}
                      className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-purple-50/30 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex flex-col items-center justify-center shrink-0">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-900">
                              {formatThaiDate(appt.date)}
                            </span>
                            <span className="text-xs font-bold text-slate-500 font-mono">
                              ({appt.time} น.)
                            </span>
                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                              appt.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : appt.status === 'cancelled'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {appt.status === 'completed' ? 'มาตามนัดแล้ว' : appt.status === 'cancelled' ? 'ยกเลิก' : 'รอดำเนินการ'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">
                            ประเภท: <strong>{appt.type === 'clinical' ? 'ตรวจที่คลินิก' : appt.type === 'online' ? 'ปรึกษาออนไลน์' : 'ปรึกษาพิเศษ'}</strong>
                            {appt.notes && ` • หมายเหตุ: ${appt.notes}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        {/* Google Calendar Web Open */}
                        <button
                          onClick={() => handleOpenGoogleCalendarForAppointment(appt)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition-all cursor-pointer"
                          title="เปิดบันทึกลง Google Calendar"
                        >
                          <CalendarPlus className="w-3.5 h-3.5 text-blue-600" />
                          <span>Google Calendar</span>
                        </button>

                        {/* ICS Calendar File Download */}
                        <button
                          onClick={() => handleDownloadAppointmentIcs(appt)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all cursor-pointer"
                          title="ดาวน์โหลดไฟล์ .ics สำหรับ Apple / Outlook / มือถือ"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-600" />
                          <span>.ICS</span>
                        </button>

                        {appt.status === 'pending' && (
                          <button
                            onClick={() => onUpdateAppointmentStatus(appt.id, 'completed')}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 transition-all cursor-pointer"
                          >
                            ✓ บันทึกว่ามาตรวจแล้ว
                          </button>
                        )}
                        <button
                          onClick={() => setDeletingAppt(appt)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-100"
                          title="ลบนัดหมาย"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 6: ประวัติกิจกรรม (Activity Timeline)
            ========================================================================= */}
        {(activeTab as string) === 'ประวัติ' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-purple-200/80 shadow-2xs space-y-6">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-900">
                ประวัติกิจกรรมทั้งหมดของ {patient.firstName.replace(/\s*\(DEMO\)/, '')} {patient.lastName}
              </h2>
              <p className="text-xs text-slate-500">
                รวมเช็คอิน, การส่งแบบฝึกหัด, การบันทึกนัดหมาย และการประเมิน
              </p>
            </div>

            <div className="space-y-4 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-purple-100">
              {/* Event 1: Registration */}
              <div className="relative flex items-start gap-4 pl-2">
                <div className="w-5 h-5 rounded-full bg-purple-600 border-4 border-white shadow-2xs shrink-0 z-10 mt-0.5" />
                <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">ลงทะเบียนเข้าสู่โปรแกรม Growth Lab</span>
                    <span className="text-[10px] text-slate-400 font-mono">{formatThaiDate(patient.startDate)}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    รหัส HN: {patient.hn} • ผู้รับผิดชอบ: ทันตแพทย์หญิง นภาพร วรรณษา
                  </p>
                </div>
              </div>

              {/* Event Check-ins */}
              {patient.checkInHistory?.map((ci) => (
                <div key={ci.id} className="relative flex items-start gap-4 pl-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 border-4 border-white shadow-2xs shrink-0 z-10 mt-0.5" />
                  <div className="flex-1 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-950">
                        เช็คอินประจำวันสำเร็จ ({ci.source === 'QR' ? 'QR Code' : 'Application'})
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-emerald-700 font-mono">
                          {formatThaiDate(ci.date)} {ci.timestamp ? formatThaiTimestamp(ci.timestamp) : ''}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteDailyLog(e, ci)}
                          className="relative z-20 pointer-events-auto inline-flex items-center gap-1 px-2.5 py-1 text-rose-600 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs shrink-0"
                          title="ลบรายการประวัตินี้"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600 pointer-events-none" />
                          <span className="pointer-events-none">ลบ</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-emerald-800/80 mt-1">
                      สถานะ: สำเร็จ (COMPLETED) • ดำเนินการโดย: {ci.performedBy || patient.firstName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODALS
          ========================================================================= */}

      {/* MODAL 1: QR CODE */}
      <PatientQRModal
        patient={patient || null}
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
      />

      {/* MODAL 2: MANUAL CHECK-IN BY STAFF */}
      <AnimatePresence>
        {showManualCheckInModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overscroll-contain" 
            onClick={(e) => { if (e.target === e.currentTarget) { setShowManualCheckInModal(false); setShowAddApptModal(false); setShowEditProfileModal(false); } }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl border border-purple-200 shadow-2xl max-w-md w-full flex flex-col max-h-[85vh] sm:max-h-[90vh] overflow-hidden text-left"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 bg-emerald-50/70 shrink-0 z-10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-black text-slate-900">บันทึก Check-in แทนผู้เข้าร่วม</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowManualCheckInModal(false)}
                  className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 cursor-pointer shrink-0 shadow-2xs"
                  aria-label="ปิดหน้าต่าง"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div 
                className="p-5 space-y-4 overflow-y-auto overscroll-contain flex-1 bg-white"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-500">การดูแล:</span>
                    <span className="font-bold text-slate-900">{patient.firstName} {patient.lastName} (HN: {patient.hn})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">วันที่บันทึก:</span>
                    <span className="font-bold text-slate-900">{formatThaiDate(new Date().toISOString().split('T')[0])}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">วิธีการบันทึก:</span>
                    <span className="font-bold text-emerald-700">เจ้าหน้าที่คลินิกบันทึกแทน (Staff Recorded Check-in)</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-slate-700 block">
                    ระบุเจ้าหน้าที่ผู้ดำเนินการบันทึก:
                  </label>
                  <select
                    value={manualStaffActor}
                    onChange={(e) => setManualStaffActor(e.target.value)}
                    className="w-full text-xs font-medium bg-white border border-slate-300 rounded-xl p-2.5 outline-none focus:border-purple-600"
                  >
                    <option value="ทันตแพทย์หญิง นภาพร วรรณษา (ทันตแพทย์ผู้ให้การรักษา / เจ้าของคลินิก)">
                      ทันตแพทย์หญิง นภาพร วรรณษา (ทันตแพทย์ผู้ให้การรักษา / เจ้าของคลินิก)
                    </option>
                    <option value="ผู้ช่วยทันตแพทย์ / ผู้ดูแลระบบ">
                      ผู้ช่วยทันตแพทย์ (ผู้ดูแลระบบ)
                    </option>
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowManualCheckInModal(false)}
                  className="flex-1 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleManualCheckIn}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  ✓ ยืนยันบันทึก Check-in
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: ADD APPOINTMENT */}
      <AnimatePresence>
        {showAddApptModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overscroll-contain" 
            onClick={(e) => { if (e.target === e.currentTarget) { setShowManualCheckInModal(false); setShowAddApptModal(false); setShowEditProfileModal(false); } }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl border border-purple-200 shadow-2xl max-w-md w-full flex flex-col max-h-[85vh] sm:max-h-[90vh] overflow-hidden text-left"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 bg-purple-50/70 shrink-0 z-10">
                <h3 className="text-sm sm:text-base font-black text-slate-900">สร้างนัดหมายใหม่</h3>
                <button
                  type="button"
                  onClick={() => setShowAddApptModal(false)}
                  className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 cursor-pointer shrink-0 shadow-2xs"
                  aria-label="ปิดหน้าต่าง"
                >
                  ✕
                </button>
              </div>

              {/* Form wrapping scrollable content and sticky footer */}
              <form onSubmit={handleSaveAppointment} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                {/* Body */}
                <div 
                  className="p-4 sm:p-5 space-y-3 overflow-y-auto overscroll-contain flex-1 bg-white"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">การดูแล</label>
                    <input
                      type="text"
                      disabled
                      value={`${patient.firstName} ${patient.lastName} (HN: ${patient.hn})`}
                      className="w-full text-xs p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">วันที่นัดหมาย *</label>
                      <input
                        type="date"
                        required
                        value={apptDate}
                        onChange={(e) => setApptDate(e.target.value)}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">เวลา *</label>
                      <input
                        type="time"
                        required
                        value={apptTime}
                        onChange={(e) => setApptTime(e.target.value)}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">ประเภทการนัด</label>
                    <select
                      value={apptType}
                      onChange={(e) => setApptType(e.target.value as any)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium cursor-pointer"
                    >
                      <option value="clinical">ตรวจติดตามผลที่คลินิก</option>
                      <option value="online">ปรึกษาออนไลน์ (Teleconsult)</option>
                      <option value="consultation">ปรึกษาเฉพาะทาง</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">หมายเหตุ</label>
                    <input
                      type="text"
                      value={apptNotes}
                      onChange={(e) => setApptNotes(e.target.value)}
                      placeholder="เช่น ตรวจพัฒนาการขากรรไกร"
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>

                  {/* Google Calendar Sync Option */}
                  <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-left">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <CalendarPlus className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-blue-950">เปิดเพิ่มใน Google Calendar</h4>
                        <p className="text-[10px] text-blue-700 font-medium">เปิดหน้าสร้าง Event บน Google Calendar ทันทีเมื่อกดยืนยัน</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={syncWithGCal}
                        onChange={(e) => setSyncWithGCal(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={isSyncingGCal}
                    onClick={() => setShowAddApptModal(false)}
                    className="flex-1 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isSyncingGCal}
                    className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isSyncingGCal ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>กำลังบันทึก...</span>
                      </>
                    ) : (
                      <span>บันทึกการนัด</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: EDIT PROFILE */}
      <AnimatePresence>
        {showEditProfileModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overscroll-contain" 
            onClick={(e) => { if (e.target === e.currentTarget) { setShowManualCheckInModal(false); setShowAddApptModal(false); setShowEditProfileModal(false); } }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl border border-purple-200 shadow-2xl max-w-lg w-full flex flex-col max-h-[85vh] sm:max-h-[90vh] overflow-hidden text-left"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-purple-50/70 shrink-0 z-10">
                <h3 className="text-sm sm:text-base font-black text-slate-900">แก้ไขข้อมูลการดูแล</h3>
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 cursor-pointer shrink-0 shadow-2xs"
                  aria-label="ปิดหน้าต่าง"
                >
                  ✕
                </button>
              </div>

              {/* Form wrapping scrollable content and sticky footer */}
              <form onSubmit={handleSaveEditProfile} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                {/* Body */}
                <div 
                  className="p-4 sm:p-6 space-y-3.5 overflow-y-auto overscroll-contain flex-1 bg-white"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">ชื่อจริง *</label>
                      <input
                        type="text"
                        required
                        value={editForm.firstName}
                        onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">นามสกุล</label>
                      <input
                        type="text"
                        value={editForm.lastName}
                        onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">ชื่อเล่น</label>
                      <input
                        type="text"
                        value={editForm.nickname}
                        onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">เพศ</label>
                      <select
                        value={editForm.gender}
                        onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer font-bold text-slate-800"
                      >
                        <option value="ชาย">👦 เพศชาย</option>
                        <option value="หญิง">👧 เพศหญิง</option>
                        <option value="อื่นๆ">อื่นๆ</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">อายุ (ปี)</label>
                      <input
                        type="number"
                        value={editForm.age}
                        onChange={(e) => setEditForm({ ...editForm, age: Number(e.target.value) })}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">สถานะ</label>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                      >
                        <option value="active">กำลังฝึก</option>
                        <option value="completed">สำเร็จ</option>
                        <option value="on-hold">พักแผน</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">ส่วนสูง (ซม.)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="ตัวอย่าง 125"
                        value={editForm.height}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || /^\d*\.?\d*$/.test(val)) {
                            setEditForm(prev => ({ ...prev, height: val }));
                          }
                        }}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">น้ำหนัก (กก.)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="ตัวอย่าง 45.5"
                        value={editForm.weight}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || /^\d*\.?\d*$/.test(val)) {
                            setEditForm(prev => ({ ...prev, weight: val }));
                          }
                        }}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">เบอร์โทรศัพท์ผู้ปกครอง</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 block">ที่อยู่คนไข้ (Address)</label>
                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                              (position) => {
                                const { latitude, longitude } = position.coords;
                                const locationStr = `พิกัด GPS: ${latitude}, ${longitude}`;
                                setEditForm(prev => ({ 
                                  ...prev, 
                                  address: prev.address ? `${prev.address}\n${locationStr}` : locationStr 
                                }));
                              },
                              (error) => {
                                alert('ไม่สามารถดึงข้อมูลตำแหน่งที่ตั้งได้ กรุณาตรวจสอบการอนุญาตการเข้าถึงตำแหน่งที่ตั้ง (Location)');
                                console.error("Error getting location: ", error);
                              }
                            );
                          } else {
                            alert("เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่งที่ตั้ง (Geolocation)");
                          }
                        }}
                        className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-1 rounded-md hover:bg-indigo-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        📍 ปักหมุดพิกัดปัจจุบัน (GPS)
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">บันทึกเพิ่มเติม</label>
                    <textarea
                      rows={2}
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowEditProfileModal(false)}
                    className="flex-1 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    บันทึกการแก้ไข
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: CONFIRM DELETE PATIENT */}
      <AnimatePresence>
        {showDeletePatientModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overscroll-contain"
            onClick={(e) => { if (e.target === e.currentTarget) setShowDeletePatientModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full z-10 text-center space-y-4 flex flex-col max-h-[85vh] sm:max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="overflow-y-auto overscroll-contain flex-1">
                <h3 className="text-lg font-black text-slate-900">ยืนยันการลบข้อมูล</h3>
                <p className="text-xs text-slate-500 mt-1">
                  คุณต้องการลบข้อมูลของ <span className="font-bold text-slate-800">{patientInfo?.displayName || `${patient.firstName} ${patient.lastName}`} ({patient.hn})</span> ออกจากระบบอย่างถาวรหรือไม่?
                </p>
                <div className="mt-3 p-2.5 bg-rose-50/80 border border-rose-100 rounded-xl text-[11px] text-rose-700 text-left flex items-start gap-2">
                  <span className="shrink-0 font-bold">⚠️</span>
                  <span>ระบบจะส่งคำสั่งลบข้อมูลออกจาก Google Sheets (Two-way Deletion) และฐานข้อมูลทันที</span>
                </div>
              </div>
              <div className="flex gap-3 justify-center pt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowDeletePatientModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeletePatientModal(false);
                    onDeletePatient(patient.id);
                    onBack();
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  ยืนยันการลบถาวร
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: CONFIRM DELETE APPOINTMENT */}
      <AnimatePresence>
        {deletingAppt && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overscroll-contain"
            onClick={(e) => { if (e.target === e.currentTarget) setDeletingAppt(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full z-10 text-center space-y-4 flex flex-col max-h-[85vh] sm:max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="overflow-y-auto overscroll-contain flex-1">
                <h3 className="text-base font-bold text-slate-900">ยืนยันการลบรายการนัดหมาย?</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  คุณต้องการลบนัดหมายวันที่ <span className="font-semibold text-slate-800">{formatThaiDate(deletingAppt.date)} เวลา {formatAppointmentTime(deletingAppt.time)} น.</span> ออกจากระบบใช่หรือไม่?
                </p>
                <div className="mt-2.5 p-2 bg-rose-50 border border-rose-100 rounded-xl text-[11px] text-rose-700">
                  ⚠️ ระบบจะส่งคำสั่งลบข้อมูลออกจาก Google Sheets (Two-way Deletion) และฐานข้อมูลทันที
                </div>
              </div>
              <div className="flex gap-2 justify-center pt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setDeletingAppt(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (deletingAppt) {
                      onDeleteAppointment(deletingAppt.id);
                      setDeletingAppt(null);
                    }
                  }}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ยืนยันการลบ</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
