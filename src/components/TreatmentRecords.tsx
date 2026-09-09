import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardList, Plus, Trash2, Calendar, Star, Check, Activity, 
  Filter, TrendingUp, AlertCircle, Ruler, FileText, ArrowUpRight, 
  Heart, Flame, Moon, AlertTriangle, ChevronRight, Layers, RefreshCw,
  Image as ImageIcon, Download, X, Sun, Contrast
} from 'lucide-react';
import { Patient, SessionLog, GrowthLog, ExerciseLog, SleepLog } from '../types';
import { VERIFIED_EXERCISES } from '../data';

const CLINICAL_EXERCISES = VERIFIED_EXERCISES.filter(ex => ex.sourceStatus === 'VERIFIED');
import { calculateBMI, calculateHeightVelocity } from '../utils/clinicalCalculations';
import EmptyState from './ui/EmptyState';
import RecordDetailModal from './RecordDetailModal';

interface TreatmentRecordsProps {
  patients: Patient[];
  logs: SessionLog[];
  onAddLog: (newLog: Omit<SessionLog, 'id'>) => void;
  onDeleteLog: (logId: string) => void;
  selectedPatientId?: string;
  onSelectPatient: (patientId: string) => void;
  onUpdatePatientGrowth?: (patientId: string, log: GrowthLog) => void;
}

export default function TreatmentRecords({
  patients,
  logs,
  onAddLog,
  onDeleteLog,
  selectedPatientId,
  onSelectPatient,
  onUpdatePatientGrowth
}: TreatmentRecordsProps) {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'growth' | 'session' | 'xray'>('overview');

  // Active Patient derived directly from prop
  const activePatient = selectedPatientId ? patients.find(p => p.id === selectedPatientId) : undefined;

  // X-Ray Viewer State
  const [activeXray, setActiveXray] = useState<any | null>(null);
  const [xrayBrightness, setXrayBrightness] = useState(100);
  const [xrayContrast, setXrayContrast] = useState(100);
  const xrayInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadXray = async (url: string, filename: string) => {
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

  // Session Log State
  const [exerciseId, setExerciseId] = useState(CLINICAL_EXERCISES[0]?.id || '');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [repsCompleted, setRepsCompleted] = useState(10);
  const [score, setScore] = useState(8);
  const [sessionNotes, setSessionNotes] = useState('');

  // Growth & Height Velocity Form State
  const [growthDate, setGrowthDate] = useState(new Date().toISOString().split('T')[0]);
  const [height, setHeight] = useState<string>(activePatient?.height ? String(activePatient.height) : '');
  const [weight, setWeight] = useState<string>(activePatient?.weight ? String(activePatient.weight) : '');
  const [previousHeight, setPreviousHeight] = useState<string>(activePatient?.height ? String(Number((activePatient.height - 1.5).toFixed(1))) : '');
  const [previousDate, setPreviousDate] = useState<string>(
    new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [growthStage, setGrowthStage] = useState<string>('Pubertal Growth Spurt');
  const [skeletalMaturity, setSkeletalMaturity] = useState<string>('Normal');
  const [growthNotes, setGrowthNotes] = useState<string>('');

  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [modalRecord, setModalRecord] = useState<{
    isOpen: boolean;
    date: string;
    growthLog?: GrowthLog;
    exerciseLog?: ExerciseLog;
    sleepLog?: SleepLog;
  }>({
    isOpen: false,
    date: ''
  });

  // Update growth defaults when selected patient changes
  useEffect(() => {
    if (activePatient) {
      setHeight(activePatient.height ? String(activePatient.height) : '');
      setWeight(activePatient.weight ? String(activePatient.weight) : '');
      const pastGrowth = activePatient.growthLogs || [];
      if (pastGrowth.length > 0) {
        const last = pastGrowth[pastGrowth.length - 1];
        setPreviousHeight(String(last.height));
        setPreviousDate(last.date);
      } else {
        setPreviousHeight(activePatient.height ? String(Number((activePatient.height - 1.5).toFixed(1))) : '');
      }
    }
  }, [activePatient?.id]);

  // Calculations for Growth form
  const numHeight = parseFloat(height) || 0;
  const numWeight = parseFloat(weight) || 0;
  const numPrevHeight = parseFloat(previousHeight) || 0;
  const currentBMI = calculateBMI(numWeight, numHeight);
  const velocityResult = calculateHeightVelocity(numHeight, numPrevHeight, growthDate, previousDate);

  // Submit Session Log
  const handleSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient) {
      setFeedback({ text: 'กรุณาเลือกผู้รับการดูแล', type: 'error' });
      return;
    }
    onAddLog({
      patientId: activePatient.id,
      exerciseId,
      date: sessionDate,
      repsCompleted,
      score,
      notes: sessionNotes.trim() || undefined,
    });
    setSessionNotes('');
    setFeedback({ text: `บันทึกเซสชันของ ${activePatient.firstName} สำเร็จ!`, type: 'success' });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Submit Growth Log
  const handleGrowthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient) {
      setFeedback({ text: 'กรุณาเลือกผู้รับการดูแล', type: 'error' });
      return;
    }

    const latestExercise = activePatient.exerciseLogs?.[activePatient.exerciseLogs.length - 1];
    const latestSleep = activePatient.sleepLogs?.[activePatient.sleepLogs.length - 1];

    const newGrowthLog: GrowthLog = {
      id: `gro_${Date.now()}`,
      date: growthDate,
      height: numHeight,
      weight: numWeight,
      bmi: currentBMI,
      previousHeight: numPrevHeight,
      previousMeasurementDate: previousDate,
      heightVelocity: velocityResult.velocity,
      growthStage,
      skeletalMaturity,
      exerciseScore: latestExercise?.exerciseScore || activePatient.exerciseScore || 4,
      sleepScore: latestSleep?.quality || activePatient.sleepScore || 4,
      painStatus: latestExercise?.painInjury?.painPresent ? `มีอาการปวด (${latestExercise.painInjury.painScore}/10)` : 'ไม่มี',
      redFlagStatus: latestSleep?.hasRedFlag ? 'พบ Red Flag' : 'ไม่พบ',
      notes: growthNotes.trim() || undefined
    };

    if (onUpdatePatientGrowth) {
      onUpdatePatientGrowth(activePatient.id, newGrowthLog);
    }
    setGrowthNotes('');
    setFeedback({ text: `บันทึกข้อมูลการเจริญเติบโตของ ${activePatient.firstName} สำเร็จ!`, type: 'success' });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Filtered Session Logs
  const filteredSessionLogs = logs
    .filter((log) => log.patientId === activePatient?.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  // Target patient for overview & multi-domain history
  const targetPatient = activePatient;

  // Helper to compile consolidated assessment history per date for target patient
  const compiledRecords = React.useMemo(() => {
    if (!targetPatient) return [];

    const mapByDate = new Map<string, {
      date: string;
      height: number;
      weight: number;
      bmi: number;
      heightVelocity: number | null;
      growthStage?: string;
      exerciseScore: number;
      sleepScore: number;
      painStatus: string;
      redFlagStatus: string;
    }>();

    // 1. Seed initial patient baseline
    mapByDate.set(targetPatient.startDate || '2026-08-01', {
      date: targetPatient.startDate || '2026-08-01',
      height: targetPatient.height || 120,
      weight: targetPatient.weight || 22,
      bmi: calculateBMI(targetPatient.weight || 22, targetPatient.height || 120),
      heightVelocity: 4.5,
      growthStage: 'Pubertal Growth Spurt',
      exerciseScore: targetPatient.exerciseScore || 4,
      sleepScore: targetPatient.sleepScore || 4,
      painStatus: 'ไม่มี',
      redFlagStatus: 'ไม่พบ'
    });

    // 2. Add growth logs
    (targetPatient.growthLogs || []).forEach(g => {
      const existing = mapByDate.get(g.date) || {
        date: g.date,
        height: g.height,
        weight: g.weight,
        bmi: g.bmi,
        heightVelocity: g.heightVelocity ?? null,
        growthStage: g.growthStage,
        exerciseScore: g.exerciseScore || targetPatient.exerciseScore || 4,
        sleepScore: g.sleepScore || targetPatient.sleepScore || 4,
        painStatus: g.painStatus || 'ไม่มี',
        redFlagStatus: g.redFlagStatus || 'ไม่พบ'
      };
      existing.height = g.height;
      existing.weight = g.weight;
      existing.bmi = g.bmi;
      if (g.heightVelocity !== undefined) existing.heightVelocity = g.heightVelocity;
      if (g.growthStage) existing.growthStage = g.growthStage;
      mapByDate.set(g.date, existing);
    });

    // 3. Add exercise logs
    (targetPatient.exerciseLogs || []).forEach(e => {
      const existing = mapByDate.get(e.date) || {
        date: e.date,
        height: e.growth?.height || targetPatient.height || 120,
        weight: e.growth?.weight || targetPatient.weight || 22,
        bmi: e.growth?.bmi || calculateBMI(targetPatient.weight || 22, targetPatient.height || 120),
        heightVelocity: e.growth?.heightVelocity ?? null,
        growthStage: e.growth?.growthStage,
        exerciseScore: e.exerciseScore || e.consistency || 4,
        sleepScore: targetPatient.sleepScore || 4,
        painStatus: e.painInjury?.painPresent ? `มีอาการปวด (${e.painInjury.painScore}/10)` : 'ไม่มี',
        redFlagStatus: 'ไม่พบ'
      };
      existing.exerciseScore = e.exerciseScore || e.consistency || 4;
      if (e.growth?.height) existing.height = e.growth.height;
      if (e.growth?.weight) existing.weight = e.growth.weight;
      if (e.growth?.bmi) existing.bmi = e.growth.bmi;
      if (e.growth?.heightVelocity !== undefined) existing.heightVelocity = e.growth.heightVelocity;
      if (e.painInjury) existing.painStatus = e.painInjury.painPresent ? `มีอาการปวด (${e.painInjury.painScore}/10)` : 'ไม่มี';
      mapByDate.set(e.date, existing);
    });

    // 4. Add sleep logs
    (targetPatient.sleepLogs || []).forEach(s => {
      const existing = mapByDate.get(s.date) || {
        date: s.date,
        height: targetPatient.height || 120,
        weight: targetPatient.weight || 22,
        bmi: calculateBMI(targetPatient.weight || 22, targetPatient.height || 120),
        heightVelocity: null,
        exerciseScore: targetPatient.exerciseScore || 4,
        sleepScore: s.quality || 4,
        painStatus: 'ไม่มี',
        redFlagStatus: s.hasRedFlag ? 'พบ Red Flag' : 'ไม่พบ'
      };
      existing.sleepScore = s.quality || 4;
      existing.redFlagStatus = s.hasRedFlag ? 'พบ Red Flag' : 'ไม่พบ';
      mapByDate.set(s.date, existing);
    });

    return Array.from(mapByDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [targetPatient]);

  const latestRecord = compiledRecords.length > 0 ? compiledRecords[compiledRecords.length - 1] : null;
  const previousRecord = compiledRecords.length > 1 ? compiledRecords[compiledRecords.length - 2] : null;

  if (!activePatient) {
    return (
      <div className="space-y-6 text-left">
        <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto text-purple-600 text-3xl">
            📋
          </div>
          <h2 className="text-lg font-bold text-slate-800">ยังไม่ได้เลือกสมาชิกผู้รับการดูแล</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            กรุณาเลือกสมาชิกผู้รับการดูแลจากรายการแถบด้านบน เพื่อแสดงประวัติและบันทึกการติดตามผลการรักษา
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-8 text-left w-full max-w-full lg:max-w-7xl mx-auto pb-12 overflow-x-hidden box-border"
    >
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 text-white p-8 md:p-10 rounded-3xl shadow-lg relative overflow-hidden border border-blue-400/20">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
            <ClipboardList className="w-4 h-4" />
            <span>Clinical Follow-Up & Assessment Records</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
            ระบบบันทึกและติดตามผลการพัฒนา Growth Lab
          </h1>
          <p className="text-blue-100 text-sm md:text-base font-medium opacity-95 leading-relaxed">
            บันทึกและติดตามข้อมูลจริงเรื่องการเจริญเติบโต (Growth & Height Velocity), การออกกำลังกาย, การนอน และประวัติเซสชันย้อนหลัง พร้อมระบบเปรียบเทียบผล
          </p>

          {/* Sub-tab view selector */}
          <div className="pt-3 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveSubTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeSubTab === 'overview' ? 'bg-white text-blue-900 shadow-md' : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>1. สรุปประวัติรวม & เปรียบเทียบ</span>
            </button>

            <button
              onClick={() => setActiveSubTab('growth')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeSubTab === 'growth' ? 'bg-white text-blue-900 shadow-md' : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              <Ruler className="w-4 h-4" />
              <span>2. บันทึกการเจริญเติบโต (Growth)</span>
            </button>

            <button
              onClick={() => setActiveSubTab('session')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeSubTab === 'session' ? 'bg-white text-blue-900 shadow-md' : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>3. บันทึกเซสชันการฝึก</span>
            </button>
            <button
              onClick={() => setActiveSubTab('xray')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeSubTab === 'xray' ? 'bg-white text-blue-900 shadow-md' : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>4. ภาพถ่ายเอ็กซเรย์</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Patient Summary Bar */}
      <div className="aurora-card p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 border border-slate-200">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ผู้รับการดูแลปัจจุบัน:</span>
          <span className="text-xs font-bold px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl">
            {activePatient.firstName} {activePatient.lastName} (HN: {activePatient.hn})
          </span>
        </div>

        {activePatient && (
          <div className="text-xs font-bold text-slate-600 flex items-center gap-4">
            <span>HN: <strong className="text-blue-600">{activePatient.hn}</strong></span>
            <span>ชื่อ: <strong className="text-slate-800">{activePatient.firstName} {activePatient.lastName}</strong></span>
            <span>อายุ: <strong className="text-slate-800">{activePatient.age} ปี</strong></span>
          </div>
        )}
      </div>

      {/* Feedback toast */}
      <AnimatePresence>
        {feedback && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-md ${
              feedback.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }`}
          >
            {feedback.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{feedback.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TAB 1: OVERVIEW & COMPARISON */}
      {activeSubTab === 'overview' && (
        <div className="space-y-8">
          {/* Comparison Card (ครั้งก่อน vs ครั้งปัจจุบัน vs การเปลี่ยนแปลง) */}
          <div className="aurora-card p-6 lg:p-8 rounded-3xl space-y-6 border border-blue-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-800">
                  เปรียบเทียบผลการประเมิน (ครั้งก่อน / ครั้งปัจจุบัน / การเปลี่ยนแปลง)
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-medium">เปรียบเทียบข้อมูลย้อนหลัง</span>
            </div>

            {latestRecord && previousRecord ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                {/* 1. Previous Record */}
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="text-xs font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2 flex justify-between">
                    <span>ครั้งก่อนหน้า</span>
                    <span className="text-slate-400">{previousRecord.date}</span>
                  </div>
                  <div className="space-y-2 text-slate-700">
                    <div className="flex justify-between"><span>Height:</span> <strong className="text-slate-900">{previousRecord.height} cm</strong></div>
                    <div className="flex justify-between"><span>Weight:</span> <strong className="text-slate-900">{previousRecord.weight} kg</strong></div>
                    <div className="flex justify-between"><span>BMI:</span> <strong className="text-slate-900">{previousRecord.bmi} kg/m²</strong></div>
                    <div className="flex justify-between"><span>Height Velocity:</span> <strong className="text-slate-900">{previousRecord.heightVelocity !== null ? `${previousRecord.heightVelocity} cm/ปี` : 'N/A'}</strong></div>
                    <div className="flex justify-between"><span>Exercise Score:</span> <strong className="text-rose-600 font-black">{previousRecord.exerciseScore}/5</strong></div>
                    <div className="flex justify-between"><span>Sleep Score:</span> <strong className="text-indigo-600 font-black">{previousRecord.sleepScore}/5</strong></div>
                    <div className="flex justify-between"><span>Pain:</span> <span>{previousRecord.painStatus}</span></div>
                    <div className="flex justify-between"><span>Red Flag:</span> <span>{previousRecord.redFlagStatus}</span></div>
                  </div>
                </div>

                {/* 2. Current Record */}
                <div className="p-5 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-3">
                  <div className="text-xs font-black text-blue-800 uppercase tracking-wider border-b border-blue-200 pb-2 flex justify-between">
                    <span>การประเมินปัจจุบัน</span>
                    <span className="text-blue-600">{latestRecord.date}</span>
                  </div>
                  <div className="space-y-2 text-slate-800">
                    <div className="flex justify-between"><span>Height:</span> <strong className="text-blue-900">{latestRecord.height} cm</strong></div>
                    <div className="flex justify-between"><span>Weight:</span> <strong className="text-blue-900">{latestRecord.weight} kg</strong></div>
                    <div className="flex justify-between"><span>BMI:</span> <strong className="text-blue-900">{latestRecord.bmi} kg/m²</strong></div>
                    <div className="flex justify-between"><span>Height Velocity:</span> <strong className="text-blue-900">{latestRecord.heightVelocity !== null ? `${latestRecord.heightVelocity} cm/ปี` : 'N/A'}</strong></div>
                    <div className="flex justify-between"><span>Exercise Score:</span> <strong className="text-rose-600 font-black">{latestRecord.exerciseScore}/5</strong></div>
                    <div className="flex justify-between"><span>Sleep Score:</span> <strong className="text-indigo-600 font-black">{latestRecord.sleepScore}/5</strong></div>
                    <div className="flex justify-between"><span>Pain:</span> <span>{latestRecord.painStatus}</span></div>
                    <div className="flex justify-between"><span>Red Flag:</span> <span>{latestRecord.redFlagStatus}</span></div>
                  </div>
                </div>

                {/* 3. Change / Delta */}
                <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 space-y-3">
                  <div className="text-xs font-black text-emerald-800 uppercase tracking-wider border-b border-emerald-200 pb-2">
                    การเปลี่ยนแปลง (&Delta; Change)
                  </div>
                  <div className="space-y-2 text-slate-800">
                    <div className="flex justify-between">
                      <span>Height:</span>
                      <strong className={latestRecord.height - previousRecord.height >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                        {(latestRecord.height - previousRecord.height) >= 0 ? '+' : ''}{(latestRecord.height - previousRecord.height).toFixed(1)} cm
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Weight:</span>
                      <strong className={latestRecord.weight - previousRecord.weight >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                        {(latestRecord.weight - previousRecord.weight) >= 0 ? '+' : ''}{(latestRecord.weight - previousRecord.weight).toFixed(1)} kg
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>BMI:</span>
                      <strong>
                        {(latestRecord.bmi - previousRecord.bmi) >= 0 ? '+' : ''}{(latestRecord.bmi - previousRecord.bmi).toFixed(1)}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Height Velocity:</span>
                      <strong className="text-emerald-700">
                        {latestRecord.heightVelocity !== null && previousRecord.heightVelocity !== null
                          ? `${(latestRecord.heightVelocity - previousRecord.heightVelocity) >= 0 ? '+' : ''}${(latestRecord.heightVelocity - previousRecord.heightVelocity).toFixed(2)} cm/ปี`
                          : 'N/A'
                        }
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Exercise Score:</span>
                      <strong className={latestRecord.exerciseScore - previousRecord.exerciseScore >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                        {(latestRecord.exerciseScore - previousRecord.exerciseScore) >= 0 ? '+' : ''}{latestRecord.exerciseScore - previousRecord.exerciseScore}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Sleep Score:</span>
                      <strong className={latestRecord.sleepScore - previousRecord.sleepScore >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                        {(latestRecord.sleepScore - previousRecord.sleepScore) >= 0 ? '+' : ''}{latestRecord.sleepScore - previousRecord.sleepScore}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Pain:</span>
                      <span className="font-bold text-slate-700">{latestRecord.painStatus === previousRecord.painStatus ? 'คงเดิม' : 'เปลี่ยนแปลง'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Red Flag:</span>
                      <span className="font-bold text-slate-700">{latestRecord.redFlagStatus === previousRecord.redFlagStatus ? 'คงเดิม' : 'เปลี่ยนแปลง'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 text-center py-6 bg-slate-50 rounded-2xl">
                {compiledRecords.length === 1 
                  ? 'มีบันทึกข้อมูลแล้ว 1 ครั้ง เมื่อมีบันทึกครั้งที่ 2 ระบบจะแสดงเปรียบเทียบการเปลี่ยนแปลงให้อัตโนมัติ' 
                  : 'ยังไม่มีประวัติการบันทึกสำหรับการเปรียบเทียบ'}
              </div>
            )}
          </div>

          {/* Historical Record List (Cards) */}
          <div className="aurora-card p-6 lg:p-8 rounded-3xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                ประวัติการบันทึกประเมินทั้งหมด (History Logs)
              </h3>
              <span className="text-xs text-slate-400 font-bold">ทั้งหมด {compiledRecords.length} รายการ</span>
            </div>

            {compiledRecords.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...compiledRecords].reverse().map((rec, i) => {
                  const matchingGrowth = targetPatient?.growthLogs?.find(g => g.date === rec.date);
                  const matchingExercise = targetPatient?.exerciseLogs?.find(e => e.date === rec.date);
                  const matchingSleep = targetPatient?.sleepLogs?.find(s => s.date === rec.date);

                  return (
                    <div 
                      key={rec.date + i} 
                      onClick={() => setModalRecord({
                        isOpen: true,
                        date: rec.date,
                        growthLog: matchingGrowth,
                        exerciseLog: matchingExercise,
                        sleepLog: matchingSleep
                      })}
                      className="p-5 bg-slate-50 rounded-2xl border border-slate-200 hover:border-blue-400 space-y-3 text-xs shadow-xs hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                        <span className="font-black text-slate-800 flex items-center gap-1.5 group-hover:text-blue-600">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          {rec.date}
                        </span>
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">Record #{compiledRecords.length - i}</span>
                      </div>

                      <div className="space-y-1.5 text-slate-700">
                        <div>Height: <span className="font-bold text-slate-900">{rec.height} cm</span></div>
                        <div>Weight: <span className="font-bold text-slate-900">{rec.weight} kg</span></div>
                        <div>BMI: <span className="font-bold text-slate-900">{rec.bmi} kg/m²</span></div>
                        <div>Height Velocity: <span className="font-bold text-blue-700">{rec.heightVelocity !== null ? `${rec.heightVelocity} cm/ปี` : 'N/A'}</span></div>
                        <div>Exercise Score: <span className="font-bold text-rose-600">{rec.exerciseScore}/5</span></div>
                        <div>Sleep Score: <span className="font-bold text-indigo-600">{rec.sleepScore}/5</span></div>
                        <div>Pain: <span className="font-bold text-slate-800">{rec.painStatus}</span></div>
                        <div>Red Flag: <span className="font-bold text-slate-800">{rec.redFlagStatus}</span></div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-blue-600 font-bold group-hover:underline">
                        <span>คลิกดูรายละเอียดประเมินแบบ Read-Only</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-slate-400 text-center py-10">ยังไม่มีประวัติการบันทึกสำหรับผู้รับการดูแลนี้</div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: GROWTH & HEIGHT VELOCITY FORM */}
      {activeSubTab === 'growth' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 aurora-card p-6 lg:p-8 rounded-3xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Ruler className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-800">แบบบันทึกข้อมูลการเจริญเติบโต (Growth & Height Velocity)</h2>
              </div>
              <input 
                type="date" 
                value={growthDate} 
                onChange={(e) => setGrowthDate(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <form onSubmit={handleGrowthSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="text-xs font-bold text-slate-700">ส่วนสูงปัจจุบัน (cm) *</label>
                  <input 
                    type="text"
                    inputMode="decimal"
                    placeholder="ตัวอย่าง 125"
                    value={height}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                        setHeight(val);
                      }
                    }}
                    className="w-full text-base font-black p-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="text-xs font-bold text-slate-700">น้ำหนักปัจจุบัน (kg) *</label>
                  <input 
                    type="text"
                    inputMode="decimal"
                    placeholder="ตัวอย่าง 45.5"
                    value={weight}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                        setWeight(val);
                      }
                    }}
                    className="w-full text-base font-black p-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-1">
                  <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider">คำนวณ BMI จริง</span>
                  <div className="text-2xl font-black text-blue-900">{currentBMI} <span className="text-xs font-normal text-blue-700">kg/m²</span></div>
                  <p className="text-[10px] text-blue-700">คำนวณจาก น้ำหนัก / (ส่วนสูง/100)²</p>
                </div>
              </div>

              {/* Height Velocity Section */}
              <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 space-y-4">
                <h3 className="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  คำนวณอัตราการเพิ่มความสูง (Height Velocity - cm/year)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">ส่วนสูงครั้งก่อนหน้า (cm)</label>
                    <input 
                      type="text"
                      inputMode="decimal"
                      placeholder="ตัวอย่าง 123.5"
                      value={previousHeight}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setPreviousHeight(val);
                        }
                      }}
                      className="w-full text-xs font-bold p-2.5 rounded-xl border border-blue-200 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">วันที่วัดครั้งก่อนหน้า</label>
                    <input 
                      type="date" value={previousDate}
                      onChange={(e) => setPreviousDate(e.target.value)}
                      className="w-full text-xs font-bold p-2.5 rounded-xl border border-blue-200 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="p-3.5 bg-white/90 rounded-xl border border-blue-200 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-blue-900">ผลการคำนวณ Height Velocity:</span>
                    <span className="text-lg font-black text-blue-700">
                      {velocityResult.velocity !== null ? `${velocityResult.velocity} cm/ปี` : 'N/A'}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-600 whitespace-pre-line">{velocityResult.detail}</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">ระยะการเจริญเติบโต (Growth Stage)</label>
                    <select
                      value={growthStage}
                      onChange={(e) => setGrowthStage(e.target.value)}
                      className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-white outline-none"
                    >
                      <option value="Pre-pubertal">Pre-pubertal (ก่อนวัยเจริญพันธุ์)</option>
                      <option value="Pubertal Growth Spurt">Pubertal Growth Spurt (ช่วงยืดตัวเร็ว)</option>
                      <option value="Post-pubertal">Post-pubertal (หลังวัยเจริญพันธุ์)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">ความสมบูรณ์ของกระดูก (Skeletal Maturity)</label>
                    <select
                      value={skeletalMaturity}
                      onChange={(e) => setSkeletalMaturity(e.target.value)}
                      className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-white outline-none"
                    >
                      <option value="Normal">Normal (ตามวัย)</option>
                      <option value="Early">Early (โตเร็วกว่าวัย)</option>
                      <option value="Delayed">Delayed (โตช้ากว่าวัย)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">หมายเหตุทางคลินิก (Clinical Notes)</label>
                <textarea
                  value={growthNotes}
                  onChange={(e) => setGrowthNotes(e.target.value)}
                  placeholder="เช่น ข้อสังเกตพัฒนาการทางร่างกาย..."
                  rows={2}
                  className="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>บันทึกข้อมูลการเจริญเติบโต (ไม่เขียนทับ - บันทึกประวัติใหม่)</span>
              </button>
            </form>
          </div>

          {/* Growth Log History */}
          <div className="aurora-card p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              ประวัติการวัดการเจริญเติบโต
            </h3>

            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {(targetPatient?.growthLogs || []).length > 0 ? (
                [...(targetPatient?.growthLogs || [])].reverse().map((g, idx) => (
                  <div key={g.id || idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between items-center font-bold text-slate-800 border-b border-slate-200 pb-1">
                      <span>{g.date}</span>
                      <span className="text-blue-700">{g.height} cm | {g.weight} kg</span>
                    </div>
                    <div className="text-[11px] text-slate-600">BMI: <span className="font-bold">{g.bmi} kg/m²</span></div>
                    <div className="text-[11px] text-slate-600">Height Vel.: <span className="font-bold text-blue-600">{g.heightVelocity !== null ? `${g.heightVelocity} cm/ปี` : 'N/A'}</span></div>
                    {g.growthStage && <div className="text-[10px] text-slate-500">Stage: {g.growthStage}</div>}
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 text-center py-6">ยังไม่มีประวัติการวัดส่วนสูง/น้ำหนักเพิ่มเติม</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SESSION LOG FORM */}
      {activeSubTab === 'session' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          <div className="xl:col-span-4 aurora-card p-6 lg:p-8 rounded-3xl space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-inner">
                <Plus className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-[#252536]">บันทึกเซสชันใหม่</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">เพิ่มประวัติการฝึกรายเซสชัน</p>
              </div>
            </div>

            <form onSubmit={handleSessionSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">ผู้รับการดูแล *</label>
                <div className="w-full text-xs font-bold p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-700">
                  {activePatient.hn} | {activePatient.firstName} {activePatient.lastName}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">โปรแกรมการฝึก/แบบฝึก *</label>
                <select
                  required
                  value={exerciseId}
                  onChange={(e) => setExerciseId(e.target.value)}
                  className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                >
                  {CLINICAL_EXERCISES.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">วันที่ฝึก *</label>
                <input
                  type="date"
                  required
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">จำนวนครั้ง (Reps) *</label>
                  <input
                    type="number" min="1" required
                    value={repsCompleted}
                    onChange={(e) => setRepsCompleted(parseInt(e.target.value) || 10)}
                    className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">คะแนนการตอบสนอง *</label>
                  <select
                    value={score}
                    onChange={(e) => setScore(parseInt(e.target.value) || 8)}
                    className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  >
                    {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((s) => (
                      <option key={s} value={s}>{s} / 10</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">หมายเหตุเพิ่มเติม</label>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="เช่น การทำท่าทางถูกต้องขึ้น..."
                  rows={2}
                  className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>ยืนยันการบันทึกเซสชัน</span>
              </button>
            </form>
          </div>

          <div className="xl:col-span-8 space-y-6">
            <div className="aurora-card p-6 rounded-3xl flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800">ประวัติเซสชันการฝึก</h3>
                <p className="text-xs text-slate-400">รายการบันทึกเซสชันทั้งหมด</p>
              </div>
            </div>

            <div className="aurora-card rounded-3xl overflow-hidden">
              {filteredSessionLogs.length === 0 ? (
                <div className="p-12">
                  <EmptyState 
                    title="ยังไม่มีบันทึกข้อมูลเซสชัน" 
                    description="เริ่มต้นบันทึกเซสชันแรกเพื่อติดตามผลการพัฒนา" 
                    actionLabel="เริ่มบันทึก" 
                    onAction={() => {
                      setActiveSubTab('session');
                    }}
                  />
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                  {filteredSessionLogs.map((log) => {
                    const pat = patients.find((p) => p.id === log.patientId);
                    const ex = CLINICAL_EXERCISES.find((e) => e.id === log.exerciseId);

                    return (
                      <div key={log.id} className="p-5 hover:bg-slate-50 transition-colors flex justify-between items-center gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-sm">
                              {pat ? `${pat.firstName} ${pat.lastName}` : 'ผู้รับการดูแล'}
                            </span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                              {log.date}
                            </span>
                          </div>
                          <div className="text-xs font-medium text-slate-600 flex items-center gap-3">
                            <span>{ex ? ex.title : 'แบบฝึกทั่วไป'}</span>
                            <span>•</span>
                            <span>{log.repsCompleted} Reps</span>
                          </div>
                          {log.notes && (
                            <p className="text-xs text-slate-500 italic">"{log.notes}"</p>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                            {log.score} / 10
                          </span>
                          <button
                            onClick={() => {
                              if (confirm('ยืนยันลบบันทึกนี้?')) onDeleteLog(log.id);
                            }}
                            className="p-2 text-slate-300 hover:text-rose-600 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: X-RAY VIEWER */}
      {activeSubTab === 'xray' && (
        <div className="aurora-card p-6 lg:p-8 rounded-3xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 text-slate-300 flex items-center justify-center shadow-inner">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-[#252536]">ภาพเอ็กซเรย์</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ฟิล์มรังสีและการวินิจฉัยโครงสร้าง</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {activePatient?.beforeAfterImages?.filter((i: any) => i.category.includes('X-ray') || i.category.includes('เอ็กซเรย์')).map((img: any) => (
               <div key={img.id} className="aspect-square bg-slate-950 rounded-2xl cursor-pointer overflow-hidden border-2 border-transparent hover:border-slate-500 relative" onClick={() => setActiveXray(img)}>
                  <img src={img.url} className="w-full h-full object-cover opacity-80" />
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                     <p className="text-white text-xs font-bold line-clamp-1">{img.title}</p>
                  </div>
               </div>
            ))}
            <div className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
               <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
               <span className="text-xs font-bold text-center px-4">อัปโหลดฟิล์มที่หน้า<br/>"Before / After"</span>
            </div>
          </div>
        </div>
      )}

      {/* X-Ray Light Viewer Modal */}
      {activeXray && activeXray.url && (
        <div className="fixed inset-0 bg-slate-950/95 z-[70] flex flex-col">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-900 text-slate-300 border-b border-slate-800 gap-4">
            <h3 className="font-bold text-sm line-clamp-1">{activeXray.title}</h3>
            <div className="flex flex-wrap items-center gap-4">
               <div className="flex items-center gap-2">
                 <Sun className="w-4 h-4 text-slate-400" />
                 <input type="range" min="50" max="200" value={xrayBrightness} onChange={e => setXrayBrightness(Number(e.target.value))} className="w-24 accent-slate-400" />
               </div>
               <div className="flex items-center gap-2">
                 <Contrast className="w-4 h-4 text-slate-400" />
                 <input type="range" min="50" max="200" value={xrayContrast} onChange={e => setXrayContrast(Number(e.target.value))} className="w-24 accent-slate-400" />
               </div>
               <button
                  onClick={() => handleDownloadXray(activeXray.url, `xray_${activeXray.title}.jpg`)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-2"
               >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ดาวน์โหลดต้นฉบับ</span>
               </button>
               <button onClick={() => { setActiveXray(null); setXrayBrightness(100); setXrayContrast(100); }} className="p-2 hover:bg-rose-500 hover:text-white rounded-lg transition-colors ml-auto sm:ml-0">
                  <X className="w-5 h-5" />
               </button>
            </div>
          </div>
          <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4">
            <img 
              src={activeXray.url} 
              className="max-w-full max-h-full object-contain select-none cursor-zoom-out" 
              style={{ filter: `brightness(${xrayBrightness}%) contrast(${xrayContrast}%)` }} 
              onClick={() => { setActiveXray(null); setXrayBrightness(100); setXrayContrast(100); }}
            />
          </div>
        </div>
      )}

      {/* Read-only Record Detail Modal */}
      <RecordDetailModal
        isOpen={modalRecord.isOpen}
        onClose={() => setModalRecord({ isOpen: false, date: '' })}
        patient={targetPatient}
        date={modalRecord.date}
        growthLog={modalRecord.growthLog}
        exerciseLog={modalRecord.exerciseLog}
        sleepLog={modalRecord.sleepLog}
      />
    </motion.div>
  );
}
