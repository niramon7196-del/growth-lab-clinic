import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Calendar, User, Ruler, Activity, Moon, AlertTriangle, 
  CheckCircle2, FileText, ChevronRight, ShieldAlert, Award, Heart
} from 'lucide-react';
import { Patient, ExerciseLog, SleepLog, GrowthLog } from '../types';

interface RecordDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: Patient;
  date: string;
  growthLog?: GrowthLog;
  exerciseLog?: ExerciseLog;
  sleepLog?: SleepLog;
}

export default function RecordDetailModal({
  isOpen,
  onClose,
  patient,
  date,
  growthLog,
  exerciseLog,
  sleepLog
}: RecordDetailModalProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
  if (!isOpen) return null;

  // Derive consolidated metrics
  const height = growthLog?.height || exerciseLog?.growth?.height || patient?.height || 0;
  const weight = growthLog?.weight || exerciseLog?.growth?.weight || patient?.weight || 0;
  const bmi = growthLog?.bmi || exerciseLog?.growth?.bmi || (height > 0 ? Number((weight / Math.pow(height / 100, 2)).toFixed(1)) : 0);
  const velocity = growthLog?.heightVelocity ?? exerciseLog?.growth?.heightVelocity;
  const growthStage = growthLog?.growthStage || exerciseLog?.growth?.growthStage || 'Pubertal Growth Spurt';
  const skeletalMaturity = growthLog?.skeletalMaturity || exerciseLog?.growth?.skeletalMaturity || 'Normal';

  // Exercise metrics
  const exerciseScore = exerciseLog?.exerciseScore || exerciseLog?.consistency || growthLog?.exerciseScore;
  const painPresent = exerciseLog?.painInjury?.painPresent;
  const painScore = exerciseLog?.painInjury?.painScore ?? 0;
  const painLocations = exerciseLog?.painInjury?.painLocations || [];

  // Sleep metrics
  const sleepQuality = sleepLog?.quality || growthLog?.sleepScore;
  const sleepRaw = sleepLog?.sleepRawScore;
  const sleepDuration = sleepLog?.duration;
  const hasRedFlag = sleepLog?.hasRedFlag || (growthLog?.redFlagStatus && growthLog.redFlagStatus !== 'ไม่พบ');
  const redFlags = sleepLog?.redFlags;

  const notes = exerciseLog?.notes || sleepLog?.notes || growthLog?.notes;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto prevent-pull-refresh" 
        style={{ overscrollBehaviorY: 'contain', WebkitOverflowScrolling: 'touch' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 text-left my-8"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white flex justify-between items-start shrink-0">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-bold">
                <Calendar className="w-3.5 h-3.5" />
                <span>วันที่ประเมิน: {date}</span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-white pt-1">
                รายละเอียดการติดตามประเมินผล (Read-Only)
              </h2>
              {patient && (
                <p className="text-xs text-blue-200/90 font-medium flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  <span>HN: <strong className="text-white">{patient.hn}</strong> | {patient.firstName} {patient.lastName} ({patient.age} ปี)</span>
                </p>
              )}
            </div>

            <button type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
            {/* 1. Physical Growth & Height Velocity */}
            <div className="p-5 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-3">
              <div className="flex items-center gap-2 border-b border-blue-200/60 pb-2">
                <Ruler className="w-4 h-4 text-blue-600 shrink-0" />
                <h3 className="text-sm font-bold text-blue-950">1. การเจริญเติบโต (Growth & Height Velocity)</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-white rounded-xl border border-blue-100">
                  <span className="text-[10px] text-slate-500 font-bold block">ส่วนสูง (Height)</span>
                  <span className="text-base font-black text-blue-900">{height ? `${height} cm` : 'N/A'}</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-blue-100">
                  <span className="text-[10px] text-slate-500 font-bold block">น้ำหนัก (Weight)</span>
                  <span className="text-base font-black text-blue-900">{weight ? `${weight} kg` : 'N/A'}</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-blue-100">
                  <span className="text-[10px] text-slate-500 font-bold block">BMI</span>
                  <span className="text-base font-black text-blue-900">{bmi ? `${bmi} kg/m²` : 'N/A'}</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-blue-100">
                  <span className="text-[10px] text-slate-500 font-bold block">Height Velocity</span>
                  <span className="text-base font-black text-emerald-700">
                    {velocity !== undefined && velocity !== null ? `${velocity} cm/ปี` : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[11px]">
                <div className="p-2.5 bg-white rounded-xl border border-blue-100">
                  <span className="text-slate-500 font-semibold">ระยะการเจริญเติบโต:</span>{' '}
                  <strong className="text-slate-900">{growthStage}</strong>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-blue-100">
                  <span className="text-slate-500 font-semibold">ความสมบูรณ์กระดูก:</span>{' '}
                  <strong className="text-slate-900">{skeletalMaturity}</strong>
                </div>
              </div>
            </div>

            {/* 2. Exercise Assessment & Score */}
            <div className="p-5 bg-amber-50/60 rounded-2xl border border-amber-100 space-y-3">
              <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-600 shrink-0" />
                  <h3 className="text-sm font-bold text-amber-950">2. การประเมินการออกกำลังกาย (Exercise Assessment)</h3>
                </div>
                {exerciseScore !== undefined && (
                  <span className="bg-amber-500 text-white font-black px-3 py-1 rounded-full text-xs shadow-xs">
                    Exercise Score: {exerciseScore} / 5
                  </span>
                )}
              </div>

              {exerciseLog ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-amber-100">
                      <span className="text-[10px] text-slate-500 font-bold block">กิจกรรมประจำวัน</span>
                      <strong className="text-slate-900">{exerciseLog.dailyActivity?.activeDaysPerWeek ?? 0} วัน/สัปดาห์</strong>
                      <p className="text-[10px] text-slate-500">เฉลี่ย {exerciseLog.dailyActivity?.averageMinutesPerDay ?? 0} นาที/วัน</p>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-amber-100">
                      <span className="text-[10px] text-slate-500 font-bold block">การกระโดด Bone Loading</span>
                      <strong className="text-slate-900">{exerciseLog.jumpLoading?.daysPerWeek ?? 0} วัน/สัปดาห์</strong>
                      <p className="text-[10px] text-slate-500">~{exerciseLog.jumpLoading?.approximateJumpContacts ?? 0} ครั้ง/เซสชัน</p>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-amber-100">
                      <span className="text-[10px] text-slate-500 font-bold block">ความแข็งแรง Strength</span>
                      <strong className="text-slate-900">{exerciseLog.strength?.daysPerWeek ?? 0} วัน/สัปดาห์</strong>
                      <p className="text-[10px] text-slate-500">{exerciseLog.strength?.sets ?? 0} sets x {exerciseLog.strength?.repetitionsPerSet ?? 0} reps</p>
                    </div>
                  </div>

                  {/* Landing Quality & Pain */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                    <div className="p-3 bg-white rounded-xl border border-amber-100 space-y-1">
                      <span className="font-bold text-amber-900 block">เทคนิคการลงสู่พื้น (Landing Quality)</span>
                      <ul className="space-y-1 text-[10px] text-slate-600">
                        <li className="flex items-center gap-1.5">
                          <CheckCircle2 className={`w-3.5 h-3.5 ${exerciseLog.landingQuality?.softLanding ? 'text-emerald-600' : 'text-slate-300'}`} />
                          <span>ลงน้ำหนักนุ่มนวล (Soft landing)</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <CheckCircle2 className={`w-3.5 h-3.5 ${exerciseLog.landingQuality?.kneeAlignment ? 'text-emerald-600' : 'text-slate-300'}`} />
                          <span>จัดระเบียบเข่าได้ดี (Knee alignment)</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <CheckCircle2 className={`w-3.5 h-3.5 ${exerciseLog.landingQuality?.trunkControl ? 'text-emerald-600' : 'text-slate-300'}`} />
                          <span>ควบคุมลำตัวได้ดี (Trunk control)</span>
                        </li>
                      </ul>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-amber-100 space-y-1">
                      <span className="font-bold text-amber-900 block">อาการปวด/บาดเจ็บ (Pain & Injury)</span>
                      {painPresent ? (
                        <div className="p-2 bg-rose-50 text-rose-800 rounded-lg space-y-0.5">
                          <div className="font-bold">ระดับความปวด: {painScore}/10</div>
                          {painLocations.length > 0 && (
                            <div className="text-[10px]">ตำแหน่ง: {painLocations.join(', ')}</div>
                          )}
                        </div>
                      ) : (
                        <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg font-bold">
                          ไม่มีอาการปวดจากการทำกิจกรรม
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-white rounded-xl border border-amber-100 text-slate-500">
                  ไม่มีบันทึกข้อมูลการออกกำลังกายเฉพาะวัน
                </div>
              )}
            </div>

            {/* 3. Sleep Assessment & Score */}
            <div className="p-5 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-3">
              <div className="flex items-center justify-between border-b border-indigo-200/60 pb-2">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-600 shrink-0" />
                  <h3 className="text-sm font-bold text-indigo-950">3. การประเมินการนอน (Sleep Assessment)</h3>
                </div>
                {sleepQuality !== undefined && (
                  <span className="bg-indigo-600 text-white font-black px-3 py-1 rounded-full text-xs shadow-xs">
                    Sleep Quality Score: {sleepQuality} / 5
                  </span>
                )}
              </div>

              {sleepLog ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-indigo-100">
                      <span className="text-[10px] text-slate-500 font-bold block">ชั่วโมงนอน</span>
                      <strong className="text-base text-indigo-950 font-black">{sleepDuration || 0} ชั่วโมง</strong>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-indigo-100">
                      <span className="text-[10px] text-slate-500 font-bold block">Sleep Raw Score</span>
                      <strong className="text-base text-indigo-950 font-black">{sleepRaw ?? (sleepQuality ? sleepQuality * 2 : 0)} / 10</strong>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-indigo-100 col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-slate-500 font-bold block">สถานะ Red Flag</span>
                      {hasRedFlag ? (
                        <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-bold">
                          <AlertTriangle className="w-3 h-3 text-rose-600" /> พบ Red Flag
                        </span>
                      ) : (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                          ไม่พบ Red Flag
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sleep Domain Scores Breakdown */}
                  {sleepLog.domains && (
                    <div className="p-3 bg-white rounded-xl border border-indigo-100 space-y-1 text-[11px]">
                      <span className="font-bold text-indigo-950 block border-b border-slate-100 pb-1">คะแนนรายด้าน 5 ด้าน (Sleep Domain Breakdown):</span>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                        <div>1. Duration: <strong>{sleepLog.domains.durationScore}/2</strong></div>
                        <div>2. Continuity: <strong>{sleepLog.domains.continuityScore}/2</strong></div>
                        <div>3. Breathing: <strong>{sleepLog.domains.breathingScore}/2</strong></div>
                        <div>4. Onset: <strong>{sleepLog.domains.onsetScore}/2</strong></div>
                        <div>5. Daytime: <strong>{sleepLog.domains.daytimeScore}/2</strong></div>
                      </div>
                    </div>
                  )}

                  {/* Red Flag Details if present */}
                  {redFlags && (redFlags.snoringRegularly || redFlags.mouthBreathingRegularly || redFlags.apneaObserved || redFlags.excessiveSweating || redFlags.excessiveDaytimeSleepiness) && (
                    <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 space-y-1">
                      <span className="font-bold flex items-center gap-1">
                        <ShieldAlert className="w-4 h-4 text-rose-600" />
                        รายการ Red Flags ที่ตรวจพบ:
                      </span>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                        {redFlags.snoringRegularly && <li>กรนเป็นประจำ</li>}
                        {redFlags.mouthBreathingRegularly && <li>อ้าปากหายใจขณะหลับเป็นประจำ</li>}
                        {redFlags.apneaObserved && <li>สังเกตพบการหยุดหายใจ / หายใจเฮือกขณะหลับ</li>}
                        {redFlags.excessiveSweating && <li>เหงื่อออกมากผิดปกติขณะหลับ</li>}
                        {redFlags.excessiveDaytimeSleepiness && <li>ง่วงนอนมากผิดปกติในตอนกลางวัน</li>}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-white rounded-xl border border-indigo-100 text-slate-500">
                  ไม่มีบันทึกข้อมูลการนอนเฉพาะวัน
                </div>
              )}
            </div>

            {/* 4. Notes */}
            {notes && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-600" />
                  หมายเหตุของผู้ดูแล / คลินิก (Note):
                </span>
                <p className="text-slate-700 italic bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
                  "{notes}"
                </p>
              </div>
            )}

            {/* 5. Calculation Details / Audit Log */}
            {(exerciseLog?.calculationDetail || sleepLog?.calculationDetail) && (
              <details className="p-4 bg-slate-900 text-slate-200 rounded-2xl text-[10px] space-y-2 cursor-pointer">
                <summary className="font-bold text-blue-400 hover:underline">
                  ดูรายละเอียดการคำนวณของอัลกอริทึม (Calculation Audit Log)
                </summary>
                <div className="pt-2 whitespace-pre-line font-mono leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300">
                  {exerciseLog?.calculationDetail}
                  {sleepLog?.calculationDetail ? `\n\n${sleepLog.calculationDetail}` : ''}
                </div>
              </details>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
            <button type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-all text-xs cursor-pointer"
            >
              ปิดหน้าต่าง (Close)
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
