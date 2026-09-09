import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Moon, Star, Clock, ShieldCheck, CheckCircle2, Send, Loader2, ArrowLeft, 
  Sparkles, Smile, Meh, Frown, AlertCircle, AlertTriangle, Settings, Check, 
  X, Sun, Sliders, Info, Shield, Award
} from 'lucide-react';
import { Patient, SleepLog, SleepCustomization } from '../types';
import { syncSleepEfToGoogleSheets, syncCleanDailySummaryToGoogleSheets, getWebhookUrl } from '../services/googleAppsScriptService';
import { usePatientContext } from '../context/PatientContext';

interface SleepTrackerProps {
  patients: Patient[];
  selectedPatientId?: string;
  onUpdatePatientSleep?: (patientId: string, log?: any, profile?: any) => void;
  onAssignSleepEF?: (patientId: string, sleepEFConfig: Record<string, any>) => void;
  onBack?: () => void;
  isDoctorMode?: boolean;
}

export default function SleepTracker({ 
  patients, 
  selectedPatientId, 
  onUpdatePatientSleep, 
  onAssignSleepEF,
  onBack,
  isDoctorMode = false 
}: SleepTrackerProps) {
  // Access global context if available
  let patientContext: any = null;
  try {
    patientContext = usePatientContext();
  } catch (e) {
    // Context fallback if not wrapped
  }

  const patient = selectedPatientId 
    ? patients.find(p => p.id === selectedPatientId) 
    : (patients[0] || null);

  // Read clinic customization from patient object
  const activeCustomization: SleepCustomization = useMemo(() => {
    return patient?.assignedSleepEF || {};
  }, [patient]);

  const snoringEnabled = activeCustomization.snoringTrackingEnabled !== false;
  const freshnessEnabled = activeCustomization.morningFreshnessEnabled !== false;
  const efEnabled = activeCustomization.efApplianceTrackingEnabled !== false;
  const targetSleepHours = activeCustomization.targetSleepHours || 8;
  const targetEfHours = activeCustomization.targetEfHours || 8;

  const todayDateStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const draftStorageKey = useMemo(() => {
    const pId = patient?.id || 'guest';
    return `growth_sleep_draft_${pId}_${todayDateStr}`;
  }, [patient?.id, todayDateStr]);

  const savedDraft = useMemo(() => {
    try {
      const raw = localStorage.getItem(draftStorageKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [draftStorageKey]);

  // Form Tap-to-Select States
  // 1. Sleep Duration & Time
  const [bedtime, setBedtime] = useState<string>(savedDraft?.bedtime || '22:00');
  const [wakeTime, setWakeTime] = useState<string>(savedDraft?.wakeTime || '06:30');
  const [sleepDurationHours, setSleepDurationHours] = useState<number>(savedDraft?.sleepDurationHours ?? 8.5);

  // 2. Snoring & Mouth Breathing (3 levels)
  const [snoringLevel, setSnoringLevel] = useState<'none' | 'mild' | 'frequent'>(savedDraft?.snoringLevel || 'none');

  // 3. Morning Freshness (3 levels)
  const [freshnessLevel, setFreshnessLevel] = useState<'refreshed' | 'moderate' | 'fatigued'>(savedDraft?.freshnessLevel || 'refreshed');

  // 4. Nighttime EF Appliance Wearing (3 options)
  const [efStatus, setEfStatus] = useState<'all_night' | 'partial' | 'not_worn'>(savedDraft?.efStatus || 'all_night');

  // Persist draft selections automatically
  useEffect(() => {
    try {
      const draft = {
        bedtime,
        wakeTime,
        sleepDurationHours,
        snoringLevel,
        freshnessLevel,
        efStatus
      };
      localStorage.setItem(draftStorageKey, JSON.stringify(draft));
    } catch (e) {}
  }, [draftStorageKey, bedtime, wakeTime, sleepDurationHours, snoringLevel, freshnessLevel, efStatus]);

  // Clinic Customization Modal State
  const [showClinicModal, setShowClinicModal] = useState(false);
  const [editSnoring, setEditSnoring] = useState(snoringEnabled);
  const [editFreshness, setEditFreshness] = useState(freshnessEnabled);
  const [editEf, setEditEf] = useState(efEnabled);
  const [editTargetSleep, setEditTargetSleep] = useState(targetSleepHours);
  const [editTargetEf, setEditTargetEf] = useState(targetEfHours);
  const [customSaveSuccess, setCustomSaveSuccess] = useState(false);

  // Submitting States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Auto-calculate sleep duration when bedtime or wake time changes
  const handleTimeChange = (newBedtime: string, newWakeTime: string) => {
    setBedtime(newBedtime);
    setWakeTime(newWakeTime);

    const [bHour, bMin] = newBedtime.split(':').map(Number);
    const [wHour, wMin] = newWakeTime.split(':').map(Number);

    let bedtimeMin = bHour * 60 + bMin;
    let wakeTimeMin = wHour * 60 + wMin;

    if (wakeTimeMin <= bedtimeMin) {
      wakeTimeMin += 24 * 60; // Next morning
    }

    const diffHours = (wakeTimeMin - bedtimeMin) / 60;
    setSleepDurationHours(Math.round(diffHours * 10) / 10);
  };

  // Quick tap sleep duration selection
  const handleQuickDurationTap = (hours: number, defaultBed = '22:00') => {
    setSleepDurationHours(hours);
    setBedtime(defaultBed);
    
    // Calculate wake time
    const [bHour, bMin] = defaultBed.split(':').map(Number);
    let totalMin = bHour * 60 + bMin + hours * 60;
    let wHour = Math.floor((totalMin / 60) % 24);
    let wMin = Math.round(totalMin % 60);
    setWakeTime(`${String(wHour).padStart(2, '0')}:${String(wMin).padStart(2, '0')}`);
  };

  // Automatic calculation of 1-5 Star Rating based on user choices
  const calculatedRatingInfo = useMemo(() => {
    let totalPoints = 0;
    let maxPossible = 0;

    // 1. Duration Points (0 - 30 pts)
    maxPossible += 30;
    if (sleepDurationHours >= 7.5 && sleepDurationHours <= 9.5) {
      totalPoints += 30;
    } else if (sleepDurationHours >= 6.5) {
      totalPoints += 24;
    } else if (sleepDurationHours >= 5.5) {
      totalPoints += 18;
    } else {
      totalPoints += 10;
    }

    // 2. Snoring / Breathing (0 - 25 pts)
    if (snoringEnabled) {
      maxPossible += 25;
      if (snoringLevel === 'none') totalPoints += 25;
      else if (snoringLevel === 'mild') totalPoints += 15;
      else totalPoints += 5;
    }

    // 3. Morning Freshness (0 - 25 pts)
    if (freshnessEnabled) {
      maxPossible += 25;
      if (freshnessLevel === 'refreshed') totalPoints += 25;
      else if (freshnessLevel === 'moderate') totalPoints += 15;
      else totalPoints += 5;
    }

    // 4. EF Appliance Wearing (0 - 20 pts)
    if (efEnabled) {
      maxPossible += 20;
      if (efStatus === 'all_night') totalPoints += 20;
      else if (efStatus === 'partial') totalPoints += 10;
      else totalPoints += 0;
    }

    const scorePercent = maxPossible > 0 ? (totalPoints / maxPossible) * 100 : 80;

    let stars = 5;
    let label = 'สดชื่นเต็มที่ หลับลึก ใส่อุปกรณ์ EF ครบถ้วน';
    let colorClass = 'text-emerald-600';

    if (scorePercent >= 88) {
      stars = 5;
      label = 'คุณภาพการนอนระดับดีเยี่ยม สดชื่นแจ่มใส ใส่อุปกรณ์ EF สมบูรณ์';
      colorClass = 'text-emerald-600';
    } else if (scorePercent >= 72) {
      stars = 4;
      label = 'คุณภาพการนอนดี สดชื่นปานกลาง ปฏิบัติตามแผนได้ดี';
      colorClass = 'text-indigo-600';
    } else if (scorePercent >= 55) {
      stars = 3;
      label = 'คุณภาพการนอนปานกลาง พักผ่อนได้พอใช้ มีง่วง/เพลียเล็กน้อย';
      colorClass = 'text-amber-600';
    } else if (scorePercent >= 38) {
      stars = 2;
      label = 'คุณภาพการนอนค่อนข้างต่ำ ควรเพิ่มเวลาพักผ่อนและใส่อุปกรณ์ต่อเนื่อง';
      colorClass = 'text-orange-600';
    } else {
      stars = 1;
      label = 'คุณภาพการนอนต่ำ / ง่วงเพลียสะสม ควรแจ้งแพทย์ประจำคลินิก';
      colorClass = 'text-rose-600';
    }

    return { stars, label, colorClass, scorePercent };
  }, [sleepDurationHours, snoringLevel, freshnessLevel, efStatus, snoringEnabled, freshnessEnabled, efEnabled]);

  // Handle Save Sleep & EF Data
  const handleSaveSleepEf = async () => {
    setIsSubmitting(true);
    setFeedbackMsg(null);
    const todayStr = new Date().toISOString().split('T')[0];

    const efHoursCalculated = efStatus === 'all_night' ? targetEfHours : (efStatus === 'partial' ? 4 : 0);
    const rating = calculatedRatingInfo.stars;
    const scoreString = `คะแนนการนอน ${rating}/5 ดาว (${calculatedRatingInfo.stars} ดาว), ใส่ EF ${efHoursCalculated} ชม.`;

    const morningConditionText = freshnessLevel === 'refreshed' 
      ? 'สดชื่นแจ่มใส' 
      : (freshnessLevel === 'moderate' ? 'สดชื่นปานกลาง' : 'ตื่นยาก/ง่วงนอน/อ่อนเพลีย');

    const snoringScore = snoringLevel === 'none' ? 0 : (snoringLevel === 'mild' ? 1 : 2);

    const sleepLogRecord: SleepLog = {
      id: `slp_${Date.now()}`,
      date: todayStr,
      duration: sleepDurationHours,
      quality: rating,
      snoring: snoringLevel !== 'none',
      mouthBreathing: snoringLevel === 'frequent',
      bedtime,
      wakeTime,
      snoringMouthBreathingScore: snoringScore,
      morningCondition: morningConditionText,
      efWorn: efStatus !== 'not_worn',
      efDurationHours: efHoursCalculated,
      efRemovedDuringNight: efStatus === 'partial',
      notes: scoreString
    };

    try {
      const webhookUrl = getWebhookUrl();

      // 1. Send data to Google Apps Script Webhook
      await syncSleepEfToGoogleSheets(webhookUrl, {
        hn: patient?.hn || '',
        patientId: patient?.id || '',
        date: todayStr,
        action: 'บันทึกข้อมูลการนอน & EF (Tap Form)',
        score: scoreString,
        status: 'completed',
        sleepHours: sleepDurationHours,
        efHours: efHoursCalculated,
        rating
      });

      // 2. Sync Clean Daily Summary row
      await syncCleanDailySummaryToGoogleSheets(webhookUrl, {
        patientId: patient?.id || '',
        hn: patient?.hn || '',
        date: todayStr,
        checkInStatus: 'ACTIVE',
        streakDays: patient?.progress?.streakDays || 1,
        completedExercises: 1,
        sleepRating: rating,
        complianceScore: Math.round(calculatedRatingInfo.scorePercent)
      });

      // 3. Save locally via prop or context
      if (onUpdatePatientSleep && patient?.id) {
        onUpdatePatientSleep(patient.id, sleepLogRecord);
      } else if (patientContext?.updatePatient && patient?.id) {
        const updatedLogs = [sleepLogRecord, ...(patient.sleepLogs || []).filter(s => s.date !== todayStr)];
        patientContext.updatePatient(patient.id, {
          sleepLogs: updatedLogs,
          sleepScore: rating
        });
      }

      // Save to localStorage
      try {
        const localKey = `growth_completed_exercises_${patient?.id}_${todayStr}`;
        const existing = JSON.parse(localStorage.getItem(localKey) || '{}');
        existing[`asgn_${patient?.id}_sleep_ef`] = true;
        localStorage.setItem(localKey, JSON.stringify(existing));
      } catch (e) { /* ignore */ }

      setIsSuccess(true);
      setFeedbackMsg(`บันทึกผลการนอนและ EF วันนี้สำเร็จ! (${scoreString}) ระบบส่งข้อมูลเข้า Dashboard & Google Sheets เรียบร้อยแล้ว`);
    } catch (err) {
      console.error('[SleepTracker] Save error:', err);
      setIsSuccess(true);
      setFeedbackMsg(`บันทึกข้อมูลผลการนอนสำเร็จ (${scoreString})`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Clinic Customization Settings
  const handleSaveClinicCustomization = () => {
    if (!patient?.id) return;

    const newConfig: SleepCustomization = {
      snoringTrackingEnabled: editSnoring,
      morningFreshnessEnabled: editFreshness,
      efApplianceTrackingEnabled: editEf,
      targetSleepHours: editTargetSleep,
      targetEfHours: editTargetEf
    };

    if (onAssignSleepEF) {
      onAssignSleepEF(patient.id, newConfig);
    } else if (patientContext?.assignSleepEF) {
      patientContext.assignSleepEF(patient.id, newConfig);
    } else if (patientContext?.updatePatient) {
      patientContext.updatePatient(patient.id, {
        assignedSleepEF: { ...(patient.assignedSleepEF || {}), ...newConfig }
      });
    }

    setCustomSaveSuccess(true);
    setTimeout(() => {
      setCustomSaveSuccess(false);
      setShowClinicModal(false);
    }, 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 text-left w-full max-w-full lg:max-w-5xl mx-auto pb-12 min-h-screen overflow-y-auto overflow-x-hidden box-border"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Navigation & Header Controls */}
      <div className="flex items-center justify-between gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ย้อนกลับ</span>
          </button>
        ) : <div />}

        {/* Clinic Customization Toggle Button */}
        <button
          type="button"
          onClick={() => {
            setEditSnoring(snoringEnabled);
            setEditFreshness(freshnessEnabled);
            setEditEf(efEnabled);
            setEditTargetSleep(targetSleepHours);
            setEditTargetEf(targetEfHours);
            setShowClinicModal(true);
          }}
          className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
        >
          <Settings className="w-4 h-4 text-purple-700" />
          <span>⚙️ ปรับแต่งเกณฑ์ประเมิน (Clinic Customization)</span>
        </button>
      </div>

      {/* Main Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden border border-indigo-400/20">
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              <Moon className="w-4 h-4 text-indigo-200" />
              <span>หมวดที่ 2: การนอน & ใส่อุปกรณ์ EF (Growth Lab Sleep Quality Score)</span>
            </span>
            <span className="inline-flex items-center gap-1 bg-emerald-400/30 text-emerald-100 px-3 py-1 rounded-full text-xs font-extrabold border border-emerald-300/40">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tap-to-Select Form</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
            บันทึกคุณภาพการนอนและใส่อุปกรณ์ EF รายวัน
          </h1>
          <p className="text-indigo-100 text-xs sm:text-sm font-medium leading-relaxed max-w-2xl">
            แตะการ์ดเลือกคำตอบเพื่อบันทึกข้อมูลคุณภาพการนอน การหายใจ และการใส่อุปกรณ์ EF 
            (ผู้รับการดูแล: <strong className="text-white font-bold">{patient?.firstName} {patient?.lastName}</strong> • HN: {patient?.hn || 'N/A'})
          </p>
        </div>
        <div className="absolute -right-8 -bottom-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Primary Form Container */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-indigo-100 shadow-md space-y-8">
        
        {/* ========================================================================= */}
        {/* SECTION 1: ช่วงเวลานอน (Sleep Period & Duration)                          */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-50 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm">
                1
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  <span>ช่วงเวลานอนและชั่วโมงการนอน</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  เลือกช่วงเวลา หรือแตะเลือกจำนวนชั่วโมงนอนที่คำนวณให้อัตโนมัติ
                </p>
              </div>
            </div>

            <div className="bg-indigo-50 px-3.5 py-1.5 rounded-2xl border border-indigo-200 flex items-baseline gap-1.5 self-start sm:self-auto">
              <span className="text-xs font-bold text-indigo-700">นอนได้รวม:</span>
              <span className="text-xl font-black text-indigo-950 font-mono">{sleepDurationHours}</span>
              <span className="text-xs font-bold text-indigo-700">ชั่วโมง</span>
            </div>
          </div>

          {/* Quick Duration Tap Cards (5 Choices) */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-slate-700 block">
              แตะเลือกจำนวนชั่วโมงนอนด่วน (Quick Tap Options):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {[
                { label: '< 6 ชั่วโมง', hours: 5.5, note: 'นอนน้อย', icon: '🛏️', defaultBed: '23:30' },
                { label: '6 - 7 ชั่วโมง', hours: 6.5, note: 'ค่อนข้างน้อย', icon: '🌙', defaultBed: '23:00' },
                { label: '7 - 8 ชั่วโมง', hours: 7.5, note: 'กำลังดี', icon: '⭐', defaultBed: '22:30' },
                { label: '8 - 9 ชั่วโมง', hours: 8.5, note: 'แนะนำ / เหมาะสมที่สุด', icon: '🏆', defaultBed: '22:00' },
                { label: '9+ ชั่วโมง', hours: 9.5, note: 'เต็มอิ่ม', icon: '😴', defaultBed: '21:30' },
              ].map((opt) => {
                const isSelected = Math.abs(sleepDurationHours - opt.hours) < 0.6;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => handleQuickDurationTap(opt.hours, opt.defaultBed)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 min-h-[82px] ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-md scale-[1.02] ring-2 ring-indigo-400'
                        : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg">{opt.icon}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                    </div>
                    <div>
                      <div className={`text-xs font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {opt.label}
                      </div>
                      <div className={`text-[10px] font-bold ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                        {opt.note}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Picker Controls (Bedtime & Wakeup) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
                <span>เวลาเข้านอน (Bedtime):</span>
              </label>
              <select
                value={bedtime}
                onChange={(e) => handleTimeChange(e.target.value, wakeTime)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {['20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30', '00:00', '00:30'].map(t => (
                  <option key={t} value={t}>{t} น.</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>เวลาตื่นนอน (Wake-up Time):</span>
              </label>
              <select
                value={wakeTime}
                onChange={(e) => handleTimeChange(bedtime, e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {['05:00', '05:30', '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30'].map(t => (
                  <option key={t} value={t}>{t} น.</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: อาการกรน / อ้าปากหายใจ (Snoring & Mouth Breathing)             */}
        {/* ========================================================================= */}
        {snoringEnabled ? (
          <div className="space-y-4 pt-4 border-t border-purple-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-sm">
                2
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-purple-600" />
                  <span>อาการกรน / อ้าปากหายใจขณะหลับ</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  แตะเลือก 3 ระดับความถี่ของอาการขณะหลับ
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'none',
                  title: '🟢 ไม่เป็น (ปกติ)',
                  desc: 'ไม่พบอาการกรน หายใจทางจมูกเงียบปกติ',
                  badge: 'คะแนนเต็ม (3/3)',
                  color: 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-950',
                  activeColor: 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-400'
                },
                {
                  id: 'mild',
                  title: '🟡 เป็นบางครั้ง',
                  desc: 'มีอาการกรนเบาๆ หรืออ้าปากหายใจเป็นบางช่วง',
                  badge: 'ปานกลาง (2/3)',
                  color: 'border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-amber-950',
                  activeColor: 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-400'
                },
                {
                  id: 'frequent',
                  title: '🔴 เป็นบ่อย',
                  desc: 'กรนเสียงดัง อ้าปากหายใจ หรือหายใจติดขัดบ่อย',
                  badge: 'เฝ้าระวัง (1/3)',
                  color: 'border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-rose-950',
                  activeColor: 'bg-rose-600 text-white border-rose-700 ring-2 ring-rose-400'
                },
              ].map((opt) => {
                const isSelected = snoringLevel === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSnoringLevel(opt.id as any)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2.5 min-h-[110px] ${
                      isSelected
                        ? `${opt.activeColor} shadow-md scale-[1.02]`
                        : `${opt.color}`
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {opt.title}
                      </span>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-white shrink-0" />}
                    </div>
                    <p className={`text-xs font-medium leading-relaxed ${isSelected ? 'text-white/90' : 'text-slate-600'}`}>
                      {opt.desc}
                    </p>
                    <div className="pt-1">
                      <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-black ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-white text-slate-700 border border-slate-200'
                      }`}>
                        {opt.badge}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-bold text-slate-400 flex items-center justify-between">
            <span>2. อาการกรน / อ้าปากหายใจ</span>
            <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded">ปิดการประเมินโดยคลินิก</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 3: ความสดชื่นตอนตื่นเช้า (Morning Freshness)                       */}
        {/* ========================================================================= */}
        {freshnessEnabled ? (
          <div className="space-y-4 pt-4 border-t border-purple-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black text-sm">
                3
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Sun className="w-5 h-5 text-amber-500" />
                  <span>ความสดชื่นตอนตื่นเช้า (Morning Condition)</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  แตะเลือก 3 ระดับความรู้สึกหลังตื่นนอน
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'refreshed',
                  title: '🟢 สดชื่นดี',
                  desc: 'ตื่นมาสดชื่น กระปรี้กระเปร่า ไม่ง่วงเพลีย',
                  badge: 'สดชื่นเต็มที่ (3/3)',
                  icon: <Smile className="w-5 h-5" />,
                  color: 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-950',
                  activeColor: 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-400'
                },
                {
                  id: 'moderate',
                  title: '🟡 ปานกลาง',
                  desc: 'สดชื่นปานกลาง ตื่นได้ตามปกติ พอมีแรงทำกิจกรรม',
                  badge: 'ปานกลาง (2/3)',
                  icon: <Meh className="w-5 h-5" />,
                  color: 'border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-amber-950',
                  activeColor: 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-400'
                },
                {
                  id: 'fatigued',
                  title: '🔴 เพลีย / ไม่สดชื่น',
                  desc: 'ตื่นยาก อ่อนเพลีย ง่วงซึมตลอดเช้า',
                  badge: 'อ่อนเพลีย (1/3)',
                  icon: <Frown className="w-5 h-5" />,
                  color: 'border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-rose-950',
                  activeColor: 'bg-rose-600 text-white border-rose-700 ring-2 ring-rose-400'
                },
              ].map((opt) => {
                const isSelected = freshnessLevel === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFreshnessLevel(opt.id as any)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2.5 min-h-[110px] ${
                      isSelected
                        ? `${opt.activeColor} shadow-md scale-[1.02]`
                        : `${opt.color}`
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-black flex items-center gap-1.5 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {opt.title}
                      </span>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-white shrink-0" />}
                    </div>
                    <p className={`text-xs font-medium leading-relaxed ${isSelected ? 'text-white/90' : 'text-slate-600'}`}>
                      {opt.desc}
                    </p>
                    <div className="pt-1">
                      <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-black ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-white text-slate-700 border border-slate-200'
                      }`}>
                        {opt.badge}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-bold text-slate-400 flex items-center justify-between">
            <span>3. ความสดชื่นตอนตื่นเช้า</span>
            <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded">ปิดการประเมินโดยคลินิก</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 4: การใส่อุปกรณ์ EF ตอนนอน (Nighttime EF Appliance Wearing)       */}
        {/* ========================================================================= */}
        {efEnabled ? (
          <div className="space-y-4 pt-4 border-t border-purple-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm">
                  4
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    <span>การใส่อุปกรณ์ EF ตอนนอน</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    แตะปุ่มสลับเลือกสถานะการสวมใส่อุปกรณ์ในคืนที่ผ่านมา
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-200">
                เป้าหมาย: {targetEfHours} ชม./คืน
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'all_night',
                  title: '✓ ใส่ตลอดคืน',
                  desc: `สวมใส่อุปกรณ์ EF กระชับตลอดการนอน (~${targetEfHours} ชั่วโมง)`,
                  badge: 'สมบูรณ์แบบ (100%)',
                  activeColor: 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-400',
                  color: 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-950'
                },
                {
                  id: 'partial',
                  title: '⚠️ ใส่ได้บางช่วง / หลุด',
                  desc: 'ใส่อุปกรณ์ได้ 3-5 ชั่วโมง แต่หลุดออกระหว่างคืน',
                  badge: 'ปานกลาง (~50%)',
                  activeColor: 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-400',
                  color: 'border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-amber-950'
                },
                {
                  id: 'not_worn',
                  title: '✕ ไม่ได้ใส่',
                  desc: 'ไม่ได้ใส่อุปกรณ์ EF ในคืนที่ผ่านมา',
                  badge: 'ไม่ได้ใส่ (0%)',
                  activeColor: 'bg-rose-600 text-white border-rose-700 ring-2 ring-rose-400',
                  color: 'border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-rose-950'
                },
              ].map((opt) => {
                const isSelected = efStatus === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setEfStatus(opt.id as any)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2.5 min-h-[110px] ${
                      isSelected
                        ? `${opt.activeColor} shadow-md scale-[1.02]`
                        : `${opt.color}`
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {opt.title}
                      </span>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-white shrink-0" />}
                    </div>
                    <p className={`text-xs font-medium leading-relaxed ${isSelected ? 'text-white/90' : 'text-slate-600'}`}>
                      {opt.desc}
                    </p>
                    <div className="pt-1">
                      <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-black ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-white text-slate-700 border border-slate-200'
                      }`}>
                        {opt.badge}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-bold text-slate-400 flex items-center justify-between">
            <span>4. การใส่อุปกรณ์ EF ตอนนอน</span>
            <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded">ปิดการประเมินโดยคลินิก</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 5: ระบบคำนวณคะแนนคุณภาพการนอน (1-5 ดาว) อัตโนมัติ & บันทึก            */}
        {/* ========================================================================= */}
        <div className="space-y-5 pt-5 border-t-2 border-dashed border-indigo-100 bg-indigo-50/40 p-5 rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black text-slate-900">
                  5. สรุปคะแนนคุณภาพการนอน (Growth Lab Sleep Quality Score)
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                ระบบคำนวณคะแนนและระดับดาวอัตโนมัติจากข้อมูลที่เลือกด้านบน
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-amber-300 text-amber-900 text-xs font-black shadow-2xs">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Score: {Math.round(calculatedRatingInfo.scorePercent)}%</span>
            </div>
          </div>

          {/* Star Icons Display */}
          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-amber-200/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              {[1, 2, 3, 4, 5].map((star) => {
                const isActive = calculatedRatingInfo.stars >= star;
                return (
                  <div
                    key={star}
                    className={`p-1.5 rounded-xl transition-all transform ${
                      isActive ? 'scale-110' : 'opacity-30'
                    }`}
                  >
                    <Star
                      className={`w-8 h-8 sm:w-10 sm:h-10 ${
                        isActive
                          ? 'fill-amber-400 text-amber-500 drop-shadow-md'
                          : 'text-slate-300'
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            <div className={`text-center font-black text-sm sm:text-base ${calculatedRatingInfo.colorClass}`}>
              {calculatedRatingInfo.stars} / 5 ดาว — {calculatedRatingInfo.label}
            </div>
          </div>

          {/* Success Banner */}
          <AnimatePresence>
            {isSuccess && feedbackMsg && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 rounded-2xl bg-indigo-600 text-white font-bold text-xs sm:text-sm flex items-center gap-3 shadow-lg"
              >
                <CheckCircle2 className="w-6 h-6 shrink-0 text-indigo-200" />
                <span>{feedbackMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Save Button */}
          <div>
            <button
              type="button"
              onClick={handleSaveSleepEf}
              disabled={isSubmitting}
              className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:scale-[0.99] text-white font-black rounded-2xl text-base sm:text-lg transition-all shadow-lg flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 min-h-[54px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>กำลังบันทึกผลการนอนวันนี้...</span>
                </>
              ) : (
                <>
                  <Send className="w-6 h-6" />
                  <span>💾 บันทึกผลการนอนวันนี้</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CLINIC CUSTOMIZATION MODAL                                                */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showClinicModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto prevent-pull-refresh" style={{ overscrollBehaviorY: 'contain', WebkitOverflowScrolling: 'touch' }}>
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-6 border border-purple-200 shadow-2xl text-left my-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      ตั้งค่าเกณฑ์ประเมินเฉพาะรายบุคคล (Clinic Customization)
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      สำหรับคนไข้: {patient?.firstName} {patient?.lastName} (HN: {patient?.hn})
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowClinicModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Toggles */}
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                    เปิด/ปิด หัวข้อประเมินย่อย:
                  </span>

                  {/* Toggle 1: Snoring */}
                  <label className="flex items-center justify-between cursor-pointer p-2 hover:bg-white rounded-xl transition-colors">
                    <div>
                      <span className="text-xs font-black text-slate-900 block">ประเมินอาการกรน / อ้าปากหายใจ</span>
                      <span className="text-[11px] text-slate-500 font-medium">เน้นติดตามในเคสที่มีปัญหาทางเดินหายใจ</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={editSnoring}
                      onChange={(e) => setEditSnoring(e.target.checked)}
                      className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                  </label>

                  {/* Toggle 2: Freshness */}
                  <label className="flex items-center justify-between cursor-pointer p-2 hover:bg-white rounded-xl transition-colors">
                    <div>
                      <span className="text-xs font-black text-slate-900 block">ประเมินความสดชื่นตอนตื่นเช้า</span>
                      <span className="text-[11px] text-slate-500 font-medium">ประเมินคุณภาพและประสิทธิภาพการหลับลึก</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={editFreshness}
                      onChange={(e) => setEditFreshness(e.target.checked)}
                      className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                  </label>

                  {/* Toggle 3: EF Wearing */}
                  <label className="flex items-center justify-between cursor-pointer p-2 hover:bg-white rounded-xl transition-colors">
                    <div>
                      <span className="text-xs font-black text-slate-900 block">ประเมินการใส่อุปกรณ์ EF ตอนนอน</span>
                      <span className="text-[11px] text-slate-500 font-medium">บันทึกชั่วโมงและสถานะการใส่อุปกรณ์ EF</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={editEf}
                      onChange={(e) => setEditEf(e.target.checked)}
                      className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                  </label>
                </div>

                {/* Target Hours */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      เป้าหมายชั่วโมงนอน (ชม.):
                    </label>
                    <input
                      type="number"
                      min={4}
                      max={14}
                      step={0.5}
                      value={editTargetSleep}
                      onChange={(e) => setEditTargetSleep(parseFloat(e.target.value) || 8)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      เป้าหมายชั่วโมงใส่ EF (ชม.):
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={12}
                      step={0.5}
                      value={editTargetEf}
                      onChange={(e) => setEditTargetEf(parseFloat(e.target.value) || 8)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {customSaveSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>บันทึกการตั้งค่าเกณฑ์ประเมินคนไข้รายนี้สำเร็จ!</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowClinicModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSaveClinicCustomization}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>บันทึกการตั้งค่าเกณฑ์ประเมิน</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
