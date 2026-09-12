import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Clock, Calendar, ArrowRight, Activity, Award, Sparkles, History, QrCode, Smartphone, RefreshCw } from 'lucide-react';
import { Patient, CheckInRecord } from '../types';
import { 
  getTodayDateString, 
  formatThaiDate, 
  formatThaiTimestamp, 
  hasCheckedInToday, 
  getTodayCheckInRecord, 
  calculateConsistencyMetrics,
  calculateCurrentWeek,
  getWeeklyLessons,
  syncPatientProgress
} from '../utils/checkInCalculations';
import { cloudApi } from '../services/cloudApi';

interface CheckInViewProps {
  patient: Patient;
  onCheckIn: (patientId: string, source?: 'APP' | 'QR') => void;
  onGoToExercises: () => void;
}

export default function CheckInView({ patient, onCheckIn, onGoToExercises }: CheckInViewProps) {
  const [dailyLogs, setDailyLogs] = useState<CheckInRecord[]>(() => {
    return patient.checkInHistory || [];
  });
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const fetchLiveLogs = useCallback(async (hnToFetch?: string) => {
    const targetHn = hnToFetch || patient.hn || patient.id;
    if (!targetHn) return;
    setIsLoadingLogs(true);
    try {
      const res = await cloudApi.getDailyLogs(targetHn);
      if (res.success && Array.isArray(res.logs)) {
        const merged = [...res.logs];
        (patient.checkInHistory || []).forEach(h => {
          if (!merged.some(m => m.id === h.id || (m.date === h.date && m.time === h.time))) {
            merged.push(h);
          }
        });
        merged.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.time || '').localeCompare(a.time || ''));
        setDailyLogs(merged);
        setLastSyncTime(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.warn('[CheckInView] Failed to fetch daily logs from Google Sheets:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  }, [patient.hn, patient.id, patient.checkInHistory]);

  useEffect(() => {
    if (patient.checkInHistory && patient.checkInHistory.length > 0) {
      setDailyLogs(patient.checkInHistory);
    }
  }, [patient.checkInHistory]);

  const effectivePatient = useMemo<Patient>(() => {
    return {
      ...patient,
      checkInHistory: dailyLogs
    };
  }, [patient, dailyLogs]);

  const isCheckedIn = hasCheckedInToday(effectivePatient);
  const todayRecord = getTodayCheckInRecord(effectivePatient);
  const todayStr = getTodayDateString();
  const formattedToday = formatThaiDate(todayStr);
  const metrics = calculateConsistencyMetrics(effectivePatient);

  const nowTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
  const displayTime = todayRecord?.timestamp ? formatThaiTimestamp(todayRecord.timestamp) : nowTime;
  const displaySource = todayRecord?.source === 'QR' ? 'สแกนคิวอาร์โค้ด (QR Code)' : 'แอปพลิเคชัน (App)';

  // Status badge styling
  const statusBadgeColor = {
    ACTIVE: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    'AT RISK': 'bg-amber-100 text-amber-800 border-amber-300',
    DORMANT: 'bg-orange-100 text-orange-800 border-orange-300',
    INACTIVE: 'bg-rose-100 text-rose-800 border-rose-300',
  }[metrics.status];

  const statusLabel = {
    ACTIVE: 'ACTIVE (เข้าใช้งานสม่ำเสมอ)',
    'AT RISK': 'AT RISK (เริ่มขาดช่วง)',
    DORMANT: 'DORMANT (ขาดการเช็คอินนาน)',
    INACTIVE: 'INACTIVE (ไม่มีการบันทึก)',
  }[metrics.status];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="w-full max-w-full lg:max-w-3xl mx-auto space-y-6 text-left p-2 sm:p-4 md:p-6 overflow-x-hidden box-border"
    >
      {/* Welcome & Date Header Banner */}
      <div className="aurora-card p-6 sm:p-8 rounded-3xl border border-purple-200/80 bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-purple-200 text-xs font-bold border border-white/15">
              <Calendar className="w-3.5 h-3.5 text-purple-300" />
              <span>วันนี้ {formattedToday}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              ยินดีต้อนรับ, {patient.firstName.replace(/\s*\(DEMO\)/, '')} {patient.lastName}
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/90 font-medium">
              HN: <span className="font-mono text-white font-bold">{patient.hn}</span> • โปรแกรมฝึกพัฒนาการทางคลินิก Growth Lab
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 shrink-0">
            <Activity className="w-4 h-4 text-emerald-300" />
            <div>
              <span className="text-[10px] text-purple-200 uppercase tracking-wider block font-bold">สถานะผู้ใช้</span>
              <span className="text-xs font-black text-white">{metrics.status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Check-In Action Card */}
      <div className="aurora-card p-6 sm:p-8 rounded-3xl border border-purple-200/80 bg-white shadow-lg space-y-6">
        <div className="flex items-center justify-between border-b border-purple-100 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl ${
              isCheckedIn ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' : 'bg-purple-100 text-purple-700 border border-purple-200'
            }`}>
              {isCheckedIn ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#1C1929]">
                {isCheckedIn ? 'เช็คอินวันนี้แล้ว ✓' : 'ขั้นตอนที่ 1: เช็คอินเข้าใช้งาน'}
              </h2>
              <p className="text-xs text-[#59556E] font-medium">
                {isCheckedIn ? 'คุณได้ลงบันทึกการเข้าใช้งานประจำวันเรียบร้อยแล้ว' : 'กดปุ่มเช็คอินเพื่อบันทึกความสม่ำเสมอและเข้าสู่แบบฝึกหัดที่ได้รับมอบหมาย'}
              </p>
            </div>
          </div>

          <span className={`px-3 py-1.5 rounded-full text-xs font-extrabold border shrink-0 ${
            isCheckedIn ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {isCheckedIn ? 'เช็คอินสำเร็จ' : 'ยังไม่ได้เช็คอินวันนี้'}
          </span>
        </div>

        {/* Not Checked In State */}
        {!isCheckedIn ? (
          <div className="space-y-6 py-2 text-center sm:text-left">
            <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/70 border border-purple-200/60 flex flex-col sm:flex-row items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-bold text-purple-900">
                  สวัสดีคุณ {patient.nickname || patient.firstName.replace(/\s*\(DEMO\)/, '')} วันนี้เช็คอินเพื่อเริ่มสะสมประวัติการฝึก!
                </p>
                <p className="text-xs text-purple-700/80">
                  การเช็คอินเป็นประจำช่วยให้บุคลากรทางการแพทย์ประเมินความสม่ำเสมอในการเข้าร่วมโปรแกรมได้อย่างแม่นยำ
                </p>
              </div>
            </div>

            {/* Primary Check-In Action Button */}
            <button type="button"
              onClick={() => {
                onCheckIn(patient.id, 'APP');
                // Optimistically update local view
                const newRecord: CheckInRecord = {
                  id: `chk_${Date.now()}`,
                  date: todayStr,
                  time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                  timestamp: new Date().toISOString(),
                  source: 'APP',
                  status: 'SUCCESS'
                };
                setDailyLogs(prev => [newRecord, ...prev.filter(p => p.date !== todayStr)]);
              }}
              className="w-full flex items-center justify-center gap-3 py-4 sm:py-4.5 px-8 rounded-2xl text-base sm:text-lg font-black text-white bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-700 hover:via-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-600/25 active:scale-[0.99] cursor-pointer min-h-[54px]"
            >
              <CheckCircle2 className="w-6 h-6 text-white" />
              <span>✓ เช็คอินวันนี้</span>
            </button>
          </div>
        ) : (
          /* Checked In State & Success Info */
          <div className="space-y-6 py-1">
            <div className="p-5 sm:p-6 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200/60 pb-3">
                <span className="text-sm font-black text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  สวัสดีคุณ {patient.nickname || patient.firstName.replace(/\s*\(DEMO\)/, '')} วันนี้เช็คอินสำเร็จแล้ว!
                </span>
                <span className="text-xs font-mono font-bold text-emerald-700">
                  {formattedToday} • {displayTime}
                </span>
              </div>

              <div className="p-3 bg-white/90 rounded-xl border border-emerald-200 text-xs sm:text-sm text-emerald-950 font-bold leading-relaxed">
                พร้อมเริ่มฝึกภารกิจประจำวันที่คุณหมอมอบหมายหรือยัง?
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-white/80 p-3 rounded-xl border border-emerald-200/50">
                  <span className="text-[#59556E] block font-medium">วันที่บันทึก</span>
                  <span className="font-bold text-[#1C1929] block mt-0.5">{formattedToday}</span>
                </div>
                <div className="bg-white/80 p-3 rounded-xl border border-emerald-200/50">
                  <span className="text-[#59556E] block font-medium">เวลาบันทึก</span>
                  <span className="font-bold text-[#1C1929] block mt-0.5">{displayTime}</span>
                </div>
                <div className="bg-white/80 p-3 rounded-xl border border-emerald-200/50">
                  <span className="text-[#59556E] block font-medium">ช่องทาง Check-in</span>
                  <span className="font-bold text-purple-700 block mt-0.5">{displaySource}</span>
                </div>
              </div>
            </div>

            {/* Action to proceed to assigned exercises */}
            <button type="button"
              onClick={onGoToExercises}
              className="w-full flex items-center justify-center gap-3 py-4 sm:py-4.5 px-8 rounded-2xl text-base sm:text-lg font-black text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-purple-600 hover:from-emerald-700 hover:via-teal-700 hover:to-purple-700 transition-all shadow-lg shadow-emerald-600/25 active:scale-[0.99] cursor-pointer min-h-[54px]"
            >
              <span>🚀 เริ่มทำแบบฝึกหัดด่านแรก</span>
              <ArrowRight className="w-6 h-6 text-white" />
            </button>
          </div>
        )}
      </div>

      {/* Program Consistency & Participation Stats Card */}
      <div className="aurora-card p-6 sm:p-7 rounded-3xl border border-purple-200/70 bg-white shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-purple-100 pb-3">
          <h3 className="text-sm font-extrabold text-[#1C1929] flex items-center gap-2">
            <Award className="w-4.5 h-4.5 text-purple-600" />
            <span>ความสม่ำเสมอในการเข้าร่วมโปรแกรม (Program Consistency)</span>
          </h3>
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusBadgeColor}`}>
            {statusLabel}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left pt-1">
          <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100">
            <span className="text-[11px] font-bold text-[#59556E] block">จำนวน Check-in สะสม</span>
            <span className="text-xl sm:text-2xl font-black text-purple-900 block mt-1">{metrics.totalCheckIns} ครั้ง</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100">
            <span className="text-[11px] font-bold text-[#59556E] block">จำนวนวันปฏิบัติ</span>
            <span className="text-xl sm:text-2xl font-black text-indigo-900 block mt-1">{metrics.daysCheckedIn} วัน</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
            <span className="text-[11px] font-bold text-[#59556E] block">ความสม่ำเสมอ</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-900 block mt-1">{metrics.consistencyPercent}%</span>
            <span className="text-[10px] text-emerald-700 font-medium">{metrics.consistencyText}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-[#59556E] block">Streak ต่อเนื่อง</span>
            <span className="text-xl sm:text-2xl font-black text-amber-600 block mt-1">
              🔥 {metrics.streakDays} วัน
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              {metrics.daysSinceLastCheckIn === 0 ? 'เช็คอินแล้ววันนี้' : metrics.daysSinceLastCheckIn > 0 ? `${metrics.daysSinceLastCheckIn} วันที่แล้ว` : 'เริ่มต้นใหม่'}
            </span>
          </div>
        </div>
      </div>

      {/* Weekly Lessons & Progress Sync Card */}
      {(() => {
        const currentWeek = calculateCurrentWeek(effectivePatient);
        const progress = effectivePatient.progress || syncPatientProgress(effectivePatient);
        const weeklyLessons = getWeeklyLessons(currentWeek);
        const activeLesson = weeklyLessons.find(l => l.week === currentWeek) || weeklyLessons[0];

        return (
          <div className="aurora-card p-6 sm:p-7 rounded-3xl border border-purple-200/70 bg-white shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-[#1C1929] flex items-center gap-2">
                  <Activity className="w-4.5 h-4.5 text-purple-600" />
                  <span>หลักสูตรประจำสัปดาห์ (Weekly Lessons Progress)</span>
                </h3>
                <p className="text-xs text-[#59556E] mt-0.5">
                  โปรแกรมปัจจุบัน: สัปดาห์ที่ {currentWeek} • ความคืบหน้า {progress.completionRate}%
                </p>
              </div>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold self-start sm:self-auto border border-purple-200">
                สัปดาห์ที่ {currentWeek} (Active)
              </span>
            </div>

            {activeLesson && (
              <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-900">{activeLesson.title}</span>
                  <span className="text-[10px] text-purple-600 font-bold bg-white px-2 py-0.5 rounded-full border border-purple-200">
                    เป้าหมาย {activeLesson.targetCheckIns} วัน/สัปดาห์
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{activeLesson.description}</p>
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, progress.completionRate)}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-emerald-800">{progress.completionRate}%</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {weeklyLessons.map(lesson => {
                const isCurrent = lesson.week === currentWeek;
                const isPast = lesson.week < currentWeek;
                return (
                  <div 
                    key={lesson.id} 
                    className={`p-3 rounded-xl border text-center transition-all ${
                      isCurrent 
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm' 
                        : isPast 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                          : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}
                  >
                    <span className="text-[10px] font-bold block">สัปดาห์ {lesson.week}</span>
                    <span className="text-xs font-extrabold block truncate mt-0.5">
                      {isPast ? '✓ สำเร็จ' : isCurrent ? 'กำลังฝึก' : 'รอดำเนินการ'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Real Check-in History Card */}
      <div className="aurora-card p-6 sm:p-7 rounded-3xl border border-purple-200/70 bg-white shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#1C1929] flex items-center gap-2">
                <span>ประวัติ Check-in รายคน (Daily_Logs Google Sheets)</span>
                {isLoadingLogs && <RefreshCw className="w-3.5 h-3.5 text-purple-600 animate-spin" />}
              </h3>
              <p className="text-[11px] text-[#59556E]">
                บันทึกการเช็กอินจริงจาก Google Sheets {lastSyncTime ? `• ซิงค์ล่าสุด ${lastSyncTime} น.` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchLiveLogs(patient.hn)}
              disabled={isLoadingLogs}
              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold border border-purple-200 flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
              title="ดึงข้อมูลล่าสุดจาก Google Sheets"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingLogs ? 'animate-spin' : ''}`} />
              <span>รีเฟรชข้อมูล (Sync Sheets)</span>
            </button>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
              {dailyLogs.length} รายการ
            </span>
          </div>
        </div>

        {dailyLogs.length === 0 ? (
          <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
            {isLoadingLogs ? 'กำลังโหลดประวัติการเช็กอินจาก Google Sheets...' : 'ยังไม่มีประวัติการเช็คอิน กดปุ่ม "เช็คอินวันนี้" ด้านบนเพื่อเริ่มต้น'}
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {dailyLogs.map((item, index) => (
              <div 
                key={item.id || index}
                className="p-3 bg-purple-50/40 hover:bg-purple-50/80 rounded-2xl border border-purple-100/80 flex items-center justify-between gap-3 text-xs transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    item.source === 'QR' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {item.source === 'QR' ? <QrCode className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="font-extrabold text-[#1C1929] block">
                      {formatThaiDate(item.date)}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {item.time || formatThaiTimestamp(item.timestamp)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    item.source === 'QR' 
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                      : 'bg-purple-50 text-purple-700 border-purple-200'
                  }`}>
                    {item.source === 'QR' ? 'สแกนคิวอาร์โค้ด (QR)' : 'แอปพลิเคชัน (App)'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    สำเร็จ
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
