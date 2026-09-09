import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Flame, 
  CheckCircle2, 
  TrendingUp, 
  Calendar, 
  Activity, 
  Zap, 
  ChevronRight, 
  Info, 
  Award, 
  ShieldAlert, 
  Sliders, 
  FileText,
  Target,
  Ruler,
  AlertCircle,
  BookOpen,
  ClipboardList
} from 'lucide-react';
import { 
  Patient, 
  ExerciseLog, 
  GrowthAssessment, 
  DailyPhysicalActivity, 
  JumpBoneLoading, 
  StrengthTraining, 
  LandingQuality, 
  PainAndInjury,
  ExerciseMonthlyGoals,
  GrowthLog,
  SleepLog,
  Exercise
} from '../types';
import RecordDetailModal from './RecordDetailModal';
import OriginalReferenceModal from './OriginalReferenceModal';
import { useScrollLock } from '../utils';
import { VERIFIED_EXERCISES, APP_ENV } from '../data';
import { 
  calculateBMI, 
  calculateHeightVelocity, 
  calculateExerciseScore, 
  DEFAULT_EXERCISE_CONFIG, 
  ExerciseScoreConfig,
  generateWeeklyGrid 
} from '../utils/clinicalCalculations';

interface ExerciseTrackerProps {
  patients: Patient[];
  selectedPatientId?: string;
  onUpdatePatientExercise: (patientId: string, log: ExerciseLog) => void;
  onBack?: () => void;
}

const JUMP_ACTIVITIES_LIST = [
  'กระโดดเชือก (Rope Jumping)',
  'บาสเกตบอล (Basketball)',
  'ยิมนาสติก (Gymnastics)',
  'วอลเลย์บอล (Volleyball)',
  'แทรมโพลีน (Trampoline)',
  'วิ่งกระโดด / พลัยโอเมตริก (Plyometrics)'
];

const STRENGTH_EXERCISES_LIST = [
  'Bodyweight Squat',
  'Push-up (วิดพื้น)',
  'Core Plank',
  'Lunge / Step-up',
  'Calf Raise (เขย่งส้นเท้า)',
  'Glute Bridge'
];

const PAIN_LOCATIONS_LIST = [
  'เข่า (Knee)',
  'ข้อเท้า (Ankle)',
  'ส้นเท้า / เอ็นร้อยหวาย (Heel / Achilles)',
  'หลัง / เอว (Lower Back)',
  'สะโพก (Hip)',
  'หน้าแข้ง (Shin)'
];

export default function ExerciseTracker({ patients, selectedPatientId, onUpdatePatientExercise, onBack }: ExerciseTrackerProps) {
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const currentPatient = selectedPatientId ? patients.find(p => p.id === selectedPatientId) : undefined;

  // 1. Growth Parameters
  const [height, setHeight] = useState<number>(currentPatient?.height || (APP_ENV === 'DEMO' ? 140 : 0));
  const [weight, setWeight] = useState<number>(currentPatient?.weight || (APP_ENV === 'DEMO' ? 35 : 0));
  const [previousHeight, setPreviousHeight] = useState<number>(currentPatient?.height ? currentPatient.height - 2.5 : (APP_ENV === 'DEMO' ? 137.5 : 0));
  const [previousDate, setPreviousDate] = useState<string>(APP_ENV === 'DEMO' ? '2026-02-01' : '');
  const [growthStage, setGrowthStage] = useState<string>(APP_ENV === 'DEMO' ? 'Pubertal Growth Spurt' : '');
  const [skeletalMaturity, setSkeletalMaturity] = useState<string>(APP_ENV === 'DEMO' ? 'Normal' : '');

  // Sync when patient changes
  useEffect(() => {
    if (currentPatient) {
      setHeight(currentPatient.height || (APP_ENV === 'DEMO' ? 140 : 0));
      setWeight(currentPatient.weight || (APP_ENV === 'DEMO' ? 35 : 0));
      setPreviousHeight(currentPatient.height ? currentPatient.height - 2.5 : (APP_ENV === 'DEMO' ? 137.5 : 0));
    }
  }, [currentPatient?.id]);

  // Live BMI & Height Velocity
  const currentBMI = calculateBMI(weight, height);
  const velocityResult = calculateHeightVelocity(height, previousHeight, date, previousDate);

  // 2. Daily Physical Activity
  const [activeDaysPerWeek, setActiveDaysPerWeek] = useState<number>(4);
  const [activityType, setActivityType] = useState<string>('วิ่ง / เดินเร็ว / เล่นกีฬา');
  const [averageMinutesPerDay, setAverageMinutesPerDay] = useState<number>(60);

  // 3. Jump / Bone-loading
  const [jumpActivities, setJumpActivities] = useState<string[]>(['กระโดดเชือก (Rope Jumping)', 'บาสเกตบอล (Basketball)']);
  const [jumpDaysPerWeek, setJumpDaysPerWeek] = useState<number>(3);
  const [jumpContacts, setJumpContacts] = useState<number>(100);
  const [jumpDuration, setJumpDuration] = useState<number>(20);

  // 4. Strength Training
  const [strengthExercises, setStrengthExercises] = useState<string[]>(['Bodyweight Squat', 'Core Plank']);
  const [strengthDaysPerWeek, setStrengthDaysPerWeek] = useState<number>(3);
  const [strengthSets, setStrengthSets] = useState<number>(3);
  const [strengthReps, setStrengthReps] = useState<number>(12);

  // 5. Landing Quality
  const [softLanding, setSoftLanding] = useState<boolean>(true);
  const [kneeAlignment, setKneeAlignment] = useState<boolean>(true);
  const [trunkControl, setTrunkControl] = useState<boolean>(true);
  const [painFreeDuringActivity, setPainFreeDuringActivity] = useState<boolean>(true);
  const [needsImprovement, setNeedsImprovement] = useState<string>('ควรเน้นการย่อเข่าซับแรงขณะลงสู่พื้น');

  // 6. Pain & Injury
  const [painPresent, setPainPresent] = useState<boolean>(false);
  const [painLocations, setPainLocations] = useState<string[]>([]);
  const [painScore, setPainScore] = useState<number>(0);

  // 7. Configurable Scoring Engine Config State
  const [scoreConfig, setScoreConfig] = useState<ExerciseScoreConfig>(DEFAULT_EXERCISE_CONFIG);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);

  // 8. Monthly Goals
  const [goals, setGoals] = useState<ExerciseMonthlyGoals>({
    monthlyGoal: 'เพิ่มส่วนสูงกระตุ้นการเจริญเติบโตอย่างต่อเนื่อง',
    activityGoal: 'ออกกำลังกายแอโรบิกอย่างน้อย 60 นาที/วัน 5 วัน/สัปดาห์',
    jumpGoal: 'กระโดดเชือกหรือเล่นบาสเกตบอลรวม > 150 กระแทก/ครั้ง 3-4 วัน/สัปดาห์',
    strengthGoal: 'ฝึกกล้ามเนื้อแกนกลางและขาสม่ำเสมอ 3 วัน/สัปดาห์',
    sportPlayGoal: 'เล่นกีฬากับเพื่อนสัปดาห์ละ 2 ครั้ง',
    behavioralGoal: 'นอนหลับพักผ่อนตรงเวลา ยืดเหยียดกล้ามเนื้อก่อนนอน'
  });

  const [notes, setNotes] = useState('');
  const [showOriginalRef, setShowOriginalRef] = useState<boolean>(false);
  useScrollLock(showOriginalRef || showConfigModal);
  const [modalLog, setModalLog] = useState<{
    isOpen: boolean;
    date: string;
    exerciseLog?: ExerciseLog;
  }>({
    isOpen: false,
    date: ''
  });

  // Live Calculation using Configurable Engine
  const dailyActivityObj: DailyPhysicalActivity = {
    activeDaysPerWeek,
    activityType,
    averageMinutesPerDay
  };

  const jumpObj: JumpBoneLoading = {
    selectedActivities: jumpActivities,
    daysPerWeek: jumpDaysPerWeek,
    approximateJumpContacts: jumpContacts,
    durationPerSession: jumpDuration
  };

  const strengthObj: StrengthTraining = {
    daysPerWeek: strengthDaysPerWeek,
    selectedExercises: strengthExercises,
    sets: strengthSets,
    repetitionsPerSet: strengthReps
  };

  const landingObj: LandingQuality = {
    softLanding,
    kneeAlignment,
    trunkControl,
    painFreeDuringActivity,
    needsImprovement
  };

  const painObj: PainAndInjury = {
    painPresent,
    painLocations,
    painScore: painPresent ? painScore : 0
  };

  const growthObj: GrowthAssessment = {
    height,
    weight,
    bmi: currentBMI,
    age: currentPatient?.age || 10,
    sex: 'male',
    previousHeight,
    previousMeasurementDate: previousDate,
    heightVelocity: velocityResult.velocity ?? undefined,
    growthStage,
    skeletalMaturity
  };

  // Run Configurable Score Engine
  const scoreResult = calculateExerciseScore(dailyActivityObj, jumpObj, strengthObj, landingObj, painObj, scoreConfig);

  // Weekly Grid calculation
  const weeklyGrid = generateWeeklyGrid(activeDaysPerWeek, averageMinutesPerDay, jumpDaysPerWeek, strengthDaysPerWeek, painPresent);

  // Previous Exercise Log
  const pastExerciseLogs = currentPatient?.exerciseLogs || [];
  const previousLog = pastExerciseLogs.length > 0 ? pastExerciseLogs[pastExerciseLogs.length - 1] : null;

  const handleSubmit = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!currentPatient) {
      setFeedback({ text: 'กรุณาเลือกผู้รับการดูแลก่อนบันทึก', type: 'error' });
      return;
    }
    const targetPatient = currentPatient;

    const fullCalculationDetail = [
      `[1. Physical Growth & Velocity]`,
      ` - ส่วนสูง: ${height} cm, น้ำหนัก: ${weight} kg, BMI: ${currentBMI} kg/m²`,
      ` - Height Velocity: ${velocityResult.velocity !== null ? `${velocityResult.velocity} cm/ปี` : 'ไม่มีข้อมูล'} (${velocityResult.detail})`,
      ` - Growth Stage: ${growthStage}, Skeletal Maturity: ${skeletalMaturity}`,
      ``,
      `[2. Exercise Scoring Engine Result]`,
      scoreResult.detail
    ].join('\n');

    const newLog: ExerciseLog = {
      id: `exe_${Date.now()}`,
      date,
      type: activityType,
      duration: averageMinutesPerDay,
      consistency: scoreResult.score, // 1-5 score
      growth: growthObj,
      dailyActivity: dailyActivityObj,
      jumpLoading: jumpObj,
      strength: strengthObj,
      landingQuality: landingObj,
      painInjury: painObj,
      exerciseScore: scoreResult.score,
      exerciseScoreLabel: scoreResult.label,
      calculationDetail: fullCalculationDetail,
      weeklySummary: weeklyGrid,
      monthlyGoals: goals,
      notes: notes.trim() || undefined
    };

    onUpdatePatientExercise(targetPatient.id, newLog);
    setNotes('');
    setFeedback({ text: `บันทึกการประเมินการออกกำลังกายของ ${targetPatient.firstName} (${targetPatient.hn || ''}) สำเร็จ (Exercise Score: ${scoreResult.score}/5)`, type: 'success' });
    setTimeout(() => setFeedback(null), 4000);
  };

  const toggleArrayItem = (list: string[], item: string, setter: (val: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter(i => i !== item));
    } else {
      setter([...list, item]);
    }
  };

  if (!currentPatient) {
    return (
      <div className="space-y-6 text-left w-full max-w-full lg:max-w-7xl mx-auto pb-12 overflow-x-hidden box-border">
        {onBack && (
          <div className="flex items-center justify-between print:hidden">
            <button
              onClick={onBack}
              className="bg-white hover:bg-amber-50 text-amber-800 text-xs font-bold px-4 py-2.5 rounded-xl border border-amber-200 shadow-2xs flex items-center gap-2 cursor-pointer transition-all"
            >
              <span>← กลับสู่ Dashboard</span>
            </button>
          </div>
        )}
        <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-600 text-3xl">
            🔥
          </div>
          <h2 className="text-lg font-bold text-slate-800">ยังไม่ได้เลือกสมาชิกผู้รับการดูแล</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            กรุณาเลือกสมาชิกผู้รับการดูแลจากรายการแถบด้านบน เพื่อประเมินการออกกำลังกายและการเคลื่อนไหวรายบุคคล
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
      {/* Top Navigation Bar */}
      {onBack && (
        <div className="flex items-center justify-between print:hidden">
          <button
            onClick={onBack}
            className="bg-white hover:bg-amber-50 text-amber-800 text-xs font-bold px-4 py-2.5 rounded-xl border border-amber-200 shadow-2xs flex items-center gap-2 cursor-pointer transition-all"
          >
            <span>← กลับสู่ Dashboard</span>
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-rose-600 to-amber-700 text-white p-8 md:p-10 rounded-3xl shadow-lg relative overflow-hidden border border-amber-400/20">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
            <Flame className="w-4 h-4" />
            <span>Clinical Exercise & Movement Assessment Engine</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
            ระบบประเมินการออกกำลังกายและการเคลื่อนไหว
          </h1>
          <p className="text-amber-100 text-sm md:text-base font-medium opacity-95 leading-relaxed">
            ประเมินการเจริญเติบโต (Live BMI, Height Velocity), กิจกรรมประจำวัน, การลงน้ำหนักกระดูก (Jump/Impact), Strength Training, Landing Quality และอาการปวด พร้อมสรุปรายสัปดาห์และติดตามรายเดือน
          </p>


        </div>
      </div>

      {/* Top Module Header & Medical Document Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-600 text-white font-bold text-xs shadow-xs">
            <ClipboardList className="w-4 h-4" />
            <span>แบบประเมินการออกกำลังกายและการเคลื่อนไหว (Exercise Form)</span>
          </div>
        </div>

        <button
          onClick={() => setShowOriginalRef(true)}
          className="text-xs font-black text-white bg-slate-900 hover:bg-slate-800 px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0 self-start sm:self-auto border border-slate-700"
          title="เปิดดูเอกสารข้อมูลต้นฉบับทางการแพทย์"
        >
          <BookOpen className="w-4 h-4 text-amber-300" />
          <span>📄 เอกสารอ้างอิงต้นฉบับทางการแพทย์ (Clinical Source)</span>
        </button>
      </div>

      {/* Main Form & Result Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Input Form Column */}
        <div className="lg:col-span-2 space-y-6">

          {/* 1. Growth Parameters & Height Velocity */}
          <div className="aurora-card p-6 lg:p-8 rounded-3xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Ruler className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-bold text-slate-800">1. ข้อมูลการเจริญเติบโต (Growth & Height Velocity)</h2>
              </div>
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Height */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="text-xs font-bold text-slate-700">ส่วนสูงปัจจุบัน (cm)</label>
                <input 
                  type="number" step="0.1" value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-full text-base font-black p-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Weight */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="text-xs font-bold text-slate-700">น้ำหนักปัจจุบัน (kg)</label>
                <input 
                  type="number" step="0.1" value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full text-base font-black p-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Calculated BMI */}
              <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-1">
                <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">คำนวณ BMI จริง</span>
                <div className="text-2xl font-black text-amber-900">{currentBMI} <span className="text-xs font-normal text-amber-700">kg/m²</span></div>
                <p className="text-[10px] text-amber-700">คำนวณจาก น้ำหนัก / (ส่วนสูง/100)²</p>
              </div>
            </div>

            {/* Previous Height & Height Velocity */}
            <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 space-y-4">
              <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                คำนวณอัตราการเพิ่มความสูง (Height Velocity - cm/year)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">ส่วนสูงครั้งก่อนหน้า (cm)</label>
                  <input 
                    type="number" step="0.1" value={previousHeight}
                    onChange={(e) => setPreviousHeight(Number(e.target.value))}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-amber-200 bg-white outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">วันที่วัดครั้งก่อนหน้า</label>
                  <input 
                    type="date" value={previousDate}
                    onChange={(e) => setPreviousDate(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-amber-200 bg-white outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Velocity Output */}
              <div className="p-3.5 bg-white/90 rounded-xl border border-amber-200 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-amber-900">ผลการคำนวณ Height Velocity:</span>
                  <span className="text-lg font-black text-amber-700">
                    {velocityResult.velocity !== null ? `${velocityResult.velocity} cm/ปี` : 'N/A'}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-600 whitespace-pre-line">{velocityResult.detail}</div>
              </div>

              {/* Growth Stage & Skeletal Maturity */}
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
          </div>

          {/* 2. Daily Physical Activity */}
          <div className="aurora-card p-6 lg:p-8 rounded-3xl space-y-5">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-600" />
              2. กิจกรรมประจำวัน (Daily Physical Activity)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">จำนวนวันที่มีกิจกรรม (วัน/สัปดาห์)</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="range" min="0" max="7" value={activeDaysPerWeek} 
                    onChange={(e) => setActiveDaysPerWeek(Number(e.target.value))}
                    className="flex-1 accent-rose-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-sm font-black text-rose-700 w-12 text-right">{activeDaysPerWeek} วัน</span>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-700">รูปแบบกิจกรรมหลัก</label>
                <input 
                  type="text" value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  placeholder="เช่น วิ่ง, เดินเร็ว, เล่นกีฬา, ขี่จักรยาน..."
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="space-y-2 md:col-span-3">
                <label className="text-xs font-bold text-slate-700">ระยะเวลารวมเฉลี่ยต่อวัน (นาที/วัน)</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" min="10" max="180" step="5" value={averageMinutesPerDay} 
                    onChange={(e) => setAverageMinutesPerDay(Number(e.target.value))}
                    className="flex-1 accent-rose-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-sm font-black text-rose-700 w-20 text-right">{averageMinutesPerDay} นาที/วัน</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Jump / Bone-loading */}
          <div className="aurora-card p-6 lg:p-8 rounded-3xl space-y-5">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              3. กิจกรรมแรงกระแทก / กระโดด (Jump / Bone-loading Assessment)
            </h2>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700">เลือกประเภทกิจกรรมที่มีแรงกระแทกกระดูก:</label>
              <div className="flex flex-wrap gap-2">
                {JUMP_ACTIVITIES_LIST.map((act) => {
                  const isSel = jumpActivities.includes(act);
                  return (
                    <button
                      type="button"
                      key={act}
                      onClick={() => toggleArrayItem(jumpActivities, act, setJumpActivities)}
                      className={`text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer border ${
                        isSel ? 'bg-amber-500 text-white border-amber-600 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {isSel ? '✓ ' : '+ '} {act}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="text-[11px] font-bold text-slate-700">ความถี่ (วัน/สัปดาห์)</label>
                <input 
                  type="number" min="0" max="7" value={jumpDaysPerWeek}
                  onChange={(e) => setJumpDaysPerWeek(Number(e.target.value))}
                  className="w-full text-xs font-bold p-2 rounded-lg border border-slate-200 bg-white"
                />
              </div>

              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="text-[11px] font-bold text-slate-700">จำนวนการกระแทก (Contacts/ครั้ง)</label>
                <input 
                  type="number" min="0" max="500" step="10" value={jumpContacts}
                  onChange={(e) => setJumpContacts(Number(e.target.value))}
                  className="w-full text-xs font-bold p-2 rounded-lg border border-slate-200 bg-white"
                />
              </div>

              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="text-[11px] font-bold text-slate-700">ระยะเวลาต่อครั้ง (นาที/ session)</label>
                <input 
                  type="number" min="0" max="120" step="5" value={jumpDuration}
                  onChange={(e) => setJumpDuration(Number(e.target.value))}
                  className="w-full text-xs font-bold p-2 rounded-lg border border-slate-200 bg-white"
                />
              </div>
            </div>
          </div>

          {/* 4. Strength Training */}
          <div className="aurora-card p-6 lg:p-8 rounded-3xl space-y-5">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              4. การฝึกความแข็งแรง (Strength Training)
            </h2>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700">เลือกท่าฝึกความแข็งแรง:</label>
              <div className="flex flex-wrap gap-2">
                {STRENGTH_EXERCISES_LIST.map((ex) => {
                  const isSel = strengthExercises.includes(ex);
                  return (
                    <button
                      type="button"
                      key={ex}
                      onClick={() => toggleArrayItem(strengthExercises, ex, setStrengthExercises)}
                      className={`text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer border ${
                        isSel ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {isSel ? '✓ ' : '+ '} {ex}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="text-[11px] font-bold text-slate-700">ความถี่ (วัน/สัปดาห์)</label>
                <input 
                  type="number" min="0" max="7" value={strengthDaysPerWeek}
                  onChange={(e) => setStrengthDaysPerWeek(Number(e.target.value))}
                  className="w-full text-xs font-bold p-2 rounded-lg border border-slate-200 bg-white"
                />
              </div>

              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="text-[11px] font-bold text-slate-700">จำนวนเซต (Sets)</label>
                <input 
                  type="number" min="1" max="10" value={strengthSets}
                  onChange={(e) => setStrengthSets(Number(e.target.value))}
                  className="w-full text-xs font-bold p-2 rounded-lg border border-slate-200 bg-white"
                />
              </div>

              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="text-[11px] font-bold text-slate-700">จำนวนครั้ง/เซต (Reps/Set)</label>
                <input 
                  type="number" min="1" max="50" value={strengthReps}
                  onChange={(e) => setStrengthReps(Number(e.target.value))}
                  className="w-full text-xs font-bold p-2 rounded-lg border border-slate-200 bg-white"
                />
              </div>
            </div>
          </div>

          {/* 5. Landing Quality & Pain/Injury */}
          <div className="aurora-card p-6 lg:p-8 rounded-3xl space-y-6">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-emerald-600" />
              5. คุณภาพการเคลื่อนไหวและอาการปวด (Landing Quality & Pain)
            </h2>

            {/* Landing Quality Checks */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider">คุณภาพการลงสู่พื้น (Landing Mechanics)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer ${softLanding ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}>
                  <input type="checkbox" checked={softLanding} onChange={(e) => setSoftLanding(e.target.checked)} className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800">ลงน้ำหนักนุ่มนวล (Soft Landing)</span>
                </label>

                <label className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer ${kneeAlignment ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}>
                  <input type="checkbox" checked={kneeAlignment} onChange={(e) => setKneeAlignment(e.target.checked)} className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800">เข่าไม่บิดเข้าข้างใน (Knee Alignment)</span>
                </label>

                <label className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer ${trunkControl ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}>
                  <input type="checkbox" checked={trunkControl} onChange={(e) => setTrunkControl(e.target.checked)} className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800">ควบคุมลำตัวได้ดี (Trunk Control)</span>
                </label>

                <label className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer ${painFreeDuringActivity ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}>
                  <input type="checkbox" checked={painFreeDuringActivity} onChange={(e) => setPainFreeDuringActivity(e.target.checked)} className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800">ไม่มีอาการเจ็บขณะทำกิจกรรม</span>
                </label>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">ข้อควรปรับปรุงเกี่ยวกับท่าทาง:</label>
                <input 
                  type="text" value={needsImprovement}
                  onChange={(e) => setNeedsImprovement(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none"
                />
              </div>
            </div>

            {/* Pain Section */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <label className="text-xs font-black text-rose-700 uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                การประเมินอาการปวด (Pain & Injury)
              </label>

              <label className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer ${painPresent ? 'bg-rose-50 border-rose-300' : 'bg-slate-50 border-slate-200'}`}>
                <input type="checkbox" checked={painPresent} onChange={(e) => setPainPresent(e.target.checked)} className="w-4 h-4 text-rose-600" />
                <span className="text-xs font-bold text-slate-800">พบอาการปวดขณะหรือหลังการออกกำลังกาย</span>
              </label>

              {painPresent && (
                <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200 space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">ตำแหน่งที่ปวด:</label>
                    <div className="flex flex-wrap gap-2">
                      {PAIN_LOCATIONS_LIST.map((loc) => {
                        const isSel = painLocations.includes(loc);
                        return (
                          <button
                            type="button" key={loc}
                            onClick={() => toggleArrayItem(painLocations, loc, setPainLocations)}
                            className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border ${
                              isSel ? 'bg-rose-600 text-white border-rose-700' : 'bg-white text-slate-700 border-slate-200'
                            }`}
                          >
                            {isSel ? '✓ ' : '+ '} {loc}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex justify-between">
                      <span>คะแนนระดับอาการปวด (Pain Score 0-10):</span>
                      <span className="text-sm font-black text-rose-700">{painScore}/10</span>
                    </label>
                    <input 
                      type="range" min="0" max="10" value={painScore}
                      onChange={(e) => setPainScore(Number(e.target.value))}
                      className="w-full accent-rose-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 6. Configurable Scoring Engine Result Box */}
          <div className="aurora-card p-6 lg:p-8 rounded-3xl bg-gradient-to-br from-amber-50/80 via-orange-50/50 to-white border border-amber-200 space-y-4">
            <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
              <div>
                <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">ผลคำนวณจาก Scoring Engine (เกณฑ์แพทย์)</span>
                <h3 className="text-xl font-black text-slate-800">{scoreResult.label}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(!showConfigModal)}
                className="flex items-center gap-1.5 text-xs font-bold bg-white text-amber-800 border border-amber-300 px-3 py-1.5 rounded-xl hover:bg-amber-100/60 cursor-pointer shadow-2xs"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>ปรับ Config เกณฑ์แพทย์</span>
              </button>
            </div>

            {/* Config Modal / Drawer */}
            {showConfigModal && (
              <div className="p-4 bg-white rounded-2xl border border-amber-300 space-y-3 text-xs">
                <div className="font-bold text-slate-800">Configurable Engine Thresholds (กำหนดเกณฑ์เพิ่มเติม):</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">ขั้นต่ำวัน/สัปดาห์ (Score 5):</label>
                    <input 
                      type="number" min="1" max="7" value={scoreConfig.minActiveDaysForLevel5}
                      onChange={(e) => setScoreConfig({ ...scoreConfig, minActiveDaysForLevel5: Number(e.target.value) })}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">ขั้นต่ำวัน/สัปดาห์ (Score 4):</label>
                    <input 
                      type="number" min="1" max="7" value={scoreConfig.minActiveDaysForLevel4}
                      onChange={(e) => setScoreConfig({ ...scoreConfig, minActiveDaysForLevel4: Number(e.target.value) })}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 bg-white/90 rounded-2xl border border-amber-200/80 font-mono text-xs text-slate-700 leading-relaxed whitespace-pre-line">
              {scoreResult.detail}
            </div>
          </div>

          {/* 7. Goal Setting */}
          <div className="aurora-card p-6 lg:p-8 rounded-3xl space-y-4">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              7. บันทึกเป้าหมายประจำเดือน (Monthly Goals)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">เป้าหมายรวมรายเดือน (Monthly Goal):</label>
                <input 
                  type="text" value={goals.monthlyGoal}
                  onChange={(e) => setGoals({ ...goals, monthlyGoal: e.target.value })}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">เป้าหมายกิจกรรมประจำวัน (Activity Goal):</label>
                <input 
                  type="text" value={goals.activityGoal}
                  onChange={(e) => setGoals({ ...goals, activityGoal: e.target.value })}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">เป้าหมายการกระโดด/ลงน้ำหนัก (Jump Goal):</label>
                <input 
                  type="text" value={goals.jumpGoal}
                  onChange={(e) => setGoals({ ...goals, jumpGoal: e.target.value })}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">เป้าหมายความแข็งแรง (Strength Goal):</label>
                <input 
                  type="text" value={goals.strengthGoal}
                  onChange={(e) => setGoals({ ...goals, strengthGoal: e.target.value })}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Feedback & Submit Button */}
          {feedback && (
            <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{feedback.text}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>บันทึกผลการประเมินการออกกำลังกาย</span>
          </button>
        </div>

        {/* Right Info Column: Weekly Summary & Monthly Comparison */}
        <div className="space-y-6">

          {/* Weekly Summary Grid */}
          <div className="aurora-card p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              สรุปการทำกิจกรรมรายสัปดาห์ (Weekly Summary)
            </h3>

            <div className="space-y-2">
              {weeklyGrid.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs flex items-center justify-between">
                  <span className="font-bold text-slate-800 w-20">{item.dayName}</span>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end text-[10px]">
                    <span className={`px-2 py-0.5 rounded-full font-bold ${item.active60Min ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>
                      Active &ge;60m
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-bold ${item.jumpImpact ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-500'}`}>
                      Jump
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-bold ${item.strengthTraining ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-500'}`}>
                      Strength
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-bold ${item.noPain ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {item.noPain ? 'No Pain' : 'Pain'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Comparison */}
          <div className="aurora-card p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-rose-600" />
                เปรียบเทียบผลการประเมิน (ครั้งก่อน → ปัจจุบัน)
              </span>
              <span className="text-[10px] text-slate-400">เปรียบเทียบกับครั้งก่อนหน้า</span>
            </h3>

            {previousLog ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400">ประเมินครั้งก่อนหน้า ({previousLog.date})</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>ส่วนสูง: <span className="font-bold">{previousLog.growth?.height || '-'} cm</span></div>
                    <div>BMI: <span className="font-bold">{previousLog.growth?.bmi || '-'}</span></div>
                    <div>Height Vel.: <span className="font-bold text-blue-700">{previousLog.growth?.heightVelocity ? `${previousLog.growth.heightVelocity} cm/ปี` : '-'}</span></div>
                    <div>Exercise Score: <span className="font-bold text-rose-600">{previousLog.exerciseScore || previousLog.consistency}/5</span></div>
                    <div>Pain: <span className="font-bold">{previousLog.painInjury?.painPresent ? `มีอาการปวด (${previousLog.painInjury.painScore}/10)` : 'ไม่มี'}</span></div>
                  </div>
                </div>

                <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-1">
                  <div className="text-[10px] font-bold text-amber-700">การประเมินปัจจุบัน ({date})</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-amber-900">
                    <div>ส่วนสูง: <span className="font-bold">{height} cm</span></div>
                    <div>BMI: <span className="font-bold">{currentBMI}</span></div>
                    <div>Height Vel.: <span className="font-bold text-blue-700">{velocityResult.velocity !== null ? `${velocityResult.velocity} cm/ปี` : '-'}</span></div>
                    <div>Exercise Score: <span className="font-bold text-rose-700">{scoreResult.score}/5</span></div>
                    <div>Pain: <span className="font-bold">{painPresent ? `มีอาการปวด (${painScore}/10)` : 'ไม่มี'}</span></div>
                  </div>
                </div>

                {/* Delta / Comparison summary */}
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1 font-medium text-emerald-900">
                  <div className="text-[10px] font-black uppercase text-emerald-800">การเปลี่ยนแปลง (&Delta; Change):</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>ส่วนสูง: <strong>{previousLog.growth?.height ? `${height - previousLog.growth.height >= 0 ? '+' : ''}${(height - previousLog.growth.height).toFixed(1)} cm` : '-'}</strong></div>
                    <div>Exercise Score: <strong>{(scoreResult.score - (previousLog.exerciseScore || previousLog.consistency)) >= 0 ? '+' : ''}{scoreResult.score - (previousLog.exerciseScore || previousLog.consistency)}</strong></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl">
                ยังไม่มีข้อมูลประเมินครั้งก่อนหน้าสำหรับเปรียบเทียบ
              </div>
            )}
          </div>

          {/* Historical Assessment Logs ("ประวัติการติดตาม") */}
          <div className="aurora-card p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                ประวัติการติดตามการออกกำลังกาย ({pastExerciseLogs.length} รายการ)
              </span>
              <span className="text-[10px] text-slate-400">เรียงตามวันที่ล่าสุด</span>
            </h3>

            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {pastExerciseLogs.length > 0 ? (
                [...pastExerciseLogs].reverse().map((log, i) => (
                  <div 
                    key={log.id || i} 
                    onClick={() => setModalLog({ isOpen: true, date: log.date, exerciseLog: log })}
                    className="p-4 bg-slate-50 hover:bg-amber-50/50 rounded-2xl border border-slate-200/80 hover:border-amber-300 text-xs space-y-2 cursor-pointer transition-all shadow-xs group"
                  >
                    <div className="flex justify-between items-center font-bold text-slate-800 border-b border-slate-200 pb-2">
                      <span className="flex items-center gap-1.5 group-hover:text-amber-800">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        {log.date}
                      </span>
                      <span className="text-rose-600 font-black bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                        Score: {log.exerciseScore || log.consistency}/5
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-600 pt-0.5">
                      <div>ประเภท: <span className="font-bold text-slate-800">{log.type || 'กิจกรรมทั่วไป'}</span></div>
                      <div>ระยะเวลา: <span className="font-bold text-slate-800">{log.duration} นาที</span></div>
                      <div>ส่วนสูง: <span className="font-bold text-slate-800">{log.growth?.height || '-'} cm</span></div>
                      <div>Height Vel.: <span className="font-bold text-blue-700">{log.growth?.heightVelocity ? `${log.growth.heightVelocity} cm/ปี` : '-'}</span></div>
                    </div>

                    {log.painInjury?.painPresent && (
                      <div className="text-[10px] font-bold text-rose-600 bg-rose-50 p-1.5 rounded-lg">
                        มีอาการปวด: {log.painInjury.painScore}/10 ({log.painInjury.painLocations.join(', ') || 'ไม่ระบุตำแหน่ง'})
                      </div>
                    )}

                    <div className="pt-1 flex items-center justify-between text-[10px] text-amber-700 font-bold group-hover:underline">
                      <span>คลิกเพื่อดูรายละเอียด Read-only</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 text-center py-6">ยังไม่มีประวัติการประเมินการออกกำลังกาย</div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Read-only Record Detail Modal */}
      <RecordDetailModal
        isOpen={modalLog.isOpen}
        onClose={() => setModalLog({ isOpen: false, date: '' })}
        patient={currentPatient}
        date={modalLog.date}
        exerciseLog={modalLog.exerciseLog}
      />

      {/* Read-only Official Medical Reference Modal */}
      <OriginalReferenceModal
        isOpen={showOriginalRef}
        onClose={() => setShowOriginalRef(false)}
        title="แบบประเมินการออกกำลังกายและคู่มือท่าทาง (Exercise & Movement Assessment Form)"
        imageSrc="/assets/images/exercise_movement.jpg"
      />
    </motion.div>
  );
}
