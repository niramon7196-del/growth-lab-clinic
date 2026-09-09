import React from 'react';
import { 
  TrendingUp, CheckCircle2, Calendar, Moon, Award, 
  Activity, ArrowUpRight, ArrowLeft, Target, BookOpen, Clock, 
  BarChart2, ShieldCheck, Sparkles, AlertCircle
} from 'lucide-react';
import { Patient, SessionLog, ExerciseLog, SleepLog } from '../types';
import { VERIFIED_EXERCISES } from '../data';

const CLINICAL_EXERCISES = VERIFIED_EXERCISES.filter(ex => ex.sourceStatus === 'VERIFIED');
import { authService } from '../services/authService';

interface HomeworkProgressProps {
  onBack?: () => void;
  patientId?: string;
  patients?: Patient[];
  logs?: SessionLog[];
}

export default function HomeworkProgress({ onBack, patientId, patients = [], logs = [] }: HomeworkProgressProps) {
  const currentUser = authService.getCurrentUser();
  const isPatientUser = currentUser?.role === 'PATIENT';
  
  // Find target patient
  const activePatient = patientId ? patients.find(p => p.id === patientId) : undefined;

  if (!activePatient) {
    return (
      <div className="space-y-6 text-left">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">📊 การบ้านและ Progress</h2>
          {onBack && (
            <button type="button"
              onClick={onBack}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-bold transition-all flex items-center gap-2 text-xs border border-slate-200 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>ย้อนกลับ</span>
            </button>
          )}
        </div>
        <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto text-purple-600 text-3xl">
            📊
          </div>
          <h2 className="text-lg font-bold text-slate-800">ยังไม่ได้เลือกสมาชิกผู้รับการดูแล</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            กรุณาเลือกสมาชิกจากหน้าหลักหรือแผงควบคุมหลัก เพื่อเข้ามาติดตามการส่งการบ้านและ Progress การรักษารายบุคคล
          </p>
        </div>
      </div>
    );
  }

  const patientLogs = logs.filter(l => l.patientId === (activePatient.id || patientId));
  
  // Real efRecordLogs (EF Wear Logs ONLY)
  const efRecordLogs = activePatient?.efRecordLogs || [];
  const hasEFData = efRecordLogs.length > 0;
  
  const totalSessions = hasEFData ? efRecordLogs.length : 0;
  const wornCount = efRecordLogs.filter(log => log.status === 'worn').length;
  const failedCount = efRecordLogs.filter(log => log.status === 'failed').length;
  
  const complianceRateDisplay = hasEFData 
    ? `${Math.round((wornCount / totalSessions) * 100)}%` 
    : 'ยังไม่มีข้อมูลการใส่เครื่องมือ EF';
    
  const totalSessionsDisplay = hasEFData 
    ? `${totalSessions} วัน` 
    : 'ยังไม่มีข้อมูลการใส่เครื่องมือ EF';

  // Helper function to format date string to Thai Buddhist format
  const formatDateString = (dateStr: string) => {
    if (!dateStr) return '';
    if (dateStr.includes('ส.ค.') || dateStr.includes('สิงหาคม') || isNaN(Date.parse(dateStr))) {
      return dateStr;
    }
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const monthsThai = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        const day = date.getDate();
        const month = monthsThai[date.getMonth()];
        const yearBE = date.getFullYear() + 543; // Buddhist Era
        return `${day} ${month} ${yearBE}`;
      }
    } catch (e) {
      // ignore and fallback
    }
    return dateStr;
  };

  // Exercise Breakdown (OMT Muscle Exercises ONLY)
  const exerciseStatsMap: Record<string, { title: string; count: number; totalReps: number; avgScore: number }> = {};
  
  patientLogs.forEach(log => {
    const exObj = CLINICAL_EXERCISES.find(e => e.id === log.exerciseId);
    const title = exObj ? exObj.title : log.exerciseId;
    if (!exerciseStatsMap[title]) {
      exerciseStatsMap[title] = { title, count: 0, totalReps: 0, avgScore: 0 };
    }
    exerciseStatsMap[title].count += 1;
    exerciseStatsMap[title].totalReps += log.repsCompleted || 0;
    exerciseStatsMap[title].avgScore += log.score || 0;
  });

  const exerciseSummaryList = Object.values(exerciseStatsMap).map(item => ({
    ...item,
    avgScore: item.count > 0 ? Number((item.avgScore / item.count).toFixed(1)) : 0
  }));

  // Sleep Summary Calculation (Filter out mock logs - only count real ones if any)
  const realSleepLogs = (activePatient?.sleepLogs || []).filter(s => !s.isMock);
  const hasRealSleep = realSleepLogs.length > 0;

  const totalSleepRecords = hasRealSleep ? realSleepLogs.length : 0;
  const avgSleepDuration = hasRealSleep 
    ? (realSleepLogs.reduce((acc, curr) => acc + (curr.duration || 0), 0) / realSleepLogs.length).toFixed(1) + ' ชม./คืน'
    : 'ยังไม่มีข้อมูล';
  
  const avgSleepQuality = hasRealSleep
    ? (realSleepLogs.reduce((acc, curr) => acc + (curr.quality || 0), 0) / realSleepLogs.length).toFixed(1) + ' / 5'
    : 'ยังไม่มีข้อมูล';

  return (
    <div className="space-y-6 text-left font-sans w-full max-w-full overflow-x-hidden box-border">
      {/* Top Header Card */}
      <div className="aurora-card rounded-3xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-purple-100 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>READ-ONLY COMPLIANCE & PROGRESS REPORT</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-[#1A1A24] flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-purple-600" />
              สรุปผลความก้าวหน้าและการปฏิบัติตามแผน (Compliance & Progress)
            </h2>
            <p className="text-slate-500 text-xs md:text-sm">
              คำนวณและแสดงผลการฝึกจัดระดับลิ้นและอุปกรณ์ขากรรไกร (EF) จากบันทึกจริงของผู้รับการดูแล: <strong className="text-purple-900">{activePatient ? `${activePatient.firstName.replace(/\s*\(DEMO\)/, '')} ${activePatient.lastName} (${activePatient.hn})` : 'ผู้รับการดูแล'}</strong>
            </p>
          </div>

          {/* Banner link to EF Recording */}
          <div className="bg-gradient-to-br from-purple-900 to-indigo-900 text-white p-4 rounded-2xl shadow-md space-y-2 md:w-80 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-purple-200">บันทึกข้อมูลการฝึก EF ใหม่?</span>
              <Sparkles className="w-4 h-4 text-purple-300" />
            </div>
            <p className="text-xs text-purple-100 leading-snug">
              การบันทึกการฝึก EF ทำได้ที่เมนู <strong className="text-white">"EF / แบบฝึก → บันทึกการทำ EF"</strong>
            </p>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-1">
            <span className="text-[11px] font-bold text-purple-700 uppercase">อัตราการปฏิบัติตามแผน (Compliance)</span>
            <div className="text-xl md:text-2xl font-black text-purple-900 leading-tight">
              {complianceRateDisplay}
            </div>
            <span className="text-[10px] text-slate-500 font-medium">คำนวณจากวันที่บันทึก "ใส่ EF แล้ว"</span>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1">
            <span className="text-[11px] font-bold text-indigo-700 uppercase">จำนวนวันใส่ EF ที่บันทึกแล้ว</span>
            <div className="text-xl md:text-2xl font-black text-indigo-900 leading-tight">
              {totalSessionsDisplay}
            </div>
            <span className="text-[10px] text-slate-500 font-medium">บันทึกผ่านเมนู บันทึกการทำ EF</span>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-1">
            <span className="text-[11px] font-bold text-blue-700 uppercase">ระยะเวลานอนเฉลี่ย (ข้อมูลจริง)</span>
            <div className="text-2xl font-black text-blue-900">{avgSleepDuration}</div>
            <span className="text-[10px] text-slate-500 font-medium">ไม่นับรวมข้อมูล Mock/Demo</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1">
            <span className="text-[11px] font-bold text-emerald-700 uppercase">คุณภาพการนอนเฉลี่ย (ข้อมูลจริง)</span>
            <div className="text-2xl font-black text-emerald-900">{avgSleepQuality}</div>
            <span className="text-[10px] text-slate-500 font-medium">สเกล 1-5 ดาว จากประวัติจริง</span>
          </div>
        </div>
      </div>

      {/* EF Exercise Summary Table & Targets */}
      <div className="aurora-card rounded-3xl p-6 md:p-8 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600 shrink-0" />
            <h3 className="text-base font-black text-[#1A1A24]">
              1. สรุปเป้าหมายและการทำแบบฝึก OMT (OMT Muscle Exercises)
            </h3>
          </div>
          <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
            คำนวณจากการทำแบบฝึกจริง
          </span>
        </div>

        {exerciseSummaryList.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-600">ยังไม่มีบันทึกการฝึกกล้ามเนื้อในระบบ</p>
            <p className="text-[11px] text-slate-400">
              เมื่อมีการทำ OMT ในเมนู "ติดตามพฤติกรรม" ระบบจะแสดงผลความก้าวหน้าและการทดสอบกล้ามเนื้อที่นี่
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <th className="p-3 rounded-l-xl">ชื่อแบบฝึก OMT</th>
                    <th className="p-3">จำนวนครั้งที่ทำสะสม</th>
                    <th className="p-3">จำนวน Reps รวม</th>
                    <th className="p-3">คะแนนประเมินเฉลี่ย</th>
                    <th className="p-3 rounded-r-xl">สถานะเป้าหมาย</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {exerciseSummaryList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-purple-50/30 transition-colors">
                      <td className="p-3 font-bold text-purple-950 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-600" />
                        <span>{item.title}</span>
                      </td>
                      <td className="p-3 font-mono font-semibold">{item.count} ครั้ง</td>
                      <td className="p-3 font-mono font-semibold">{item.totalReps} reps</td>
                      <td className="p-3">
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 font-mono">
                          {item.avgScore} / 10
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          กำลังทำต่อเนื่อง
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* History Table */}
            <div className="border-t border-slate-100 pt-5 space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-600" />
                <h4 className="text-sm font-extrabold text-slate-800">ประวัติการทำแบบฝึก OMT รายวัน (OMT Exercise History Logs)</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <th className="p-3 rounded-l-xl">วันที่ฝึก</th>
                      <th className="p-3">ชื่อแบบฝึก OMT</th>
                      <th className="p-3">จำนวน Reps</th>
                      <th className="p-3">คะแนนประเมิน</th>
                      <th className="p-3 rounded-r-xl">หมายเหตุ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {patientLogs.slice().reverse().map((log, idx) => {
                      const exObj = CLINICAL_EXERCISES.find(e => e.id === log.exerciseId);
                      const title = exObj ? exObj.title : log.exerciseId;
                      return (
                        <tr key={log.id || idx} className="hover:bg-purple-50/20 transition-colors">
                          <td className="p-3 font-semibold text-slate-900 font-mono">{formatDateString(log.date)}</td>
                          <td className="p-3 font-bold text-purple-950">{title}</td>
                          <td className="p-3 font-mono font-semibold">{log.repsCompleted} reps</td>
                          <td className="p-3">
                            <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 font-mono">
                              {log.score} / 10
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 max-w-xs truncate" title={log.notes}>
                            {log.notes || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sleep & EF Integration Summary */}
      <div className="aurora-card rounded-3xl p-6 md:p-8 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-indigo-600 shrink-0" />
            <h3 className="text-base font-black text-[#1A1A24]">
              2. สรุปบันทึกการใส่เครื่องมือ EF จากบันทึกจริง (Real-time EF Wear Summary)
            </h3>
          </div>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            Growth Lab EF Tracker Source
          </span>
        </div>

        {!hasEFData ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-600">ยังไม่มีข้อมูลการใส่เครื่องมือ EF</p>
            <p className="text-[11px] text-slate-400">
              เมื่อทำการบันทึกข้อมูลการสวมใส่อุปกรณ์ผ่านเมนู "บันทึกการทำ EF" ระบบจะประมวลผลอัตรา Compliance และแสดงสถิติที่นี่
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase">วันที่บันทึก EF ทั้งหมด</span>
              <div className="text-xl font-bold text-slate-800">
                {totalSessions} วัน
              </div>
              <p className="text-[10px] text-slate-400">จากประวัติที่บันทึกไว้ในระบบจริง</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase">จำนวนวันที่ใส่ EF สำเร็จ (✓)</span>
              <div className="text-xl font-bold text-purple-900">
                {wornCount} วัน
              </div>
              <p className="text-[10px] text-slate-400">คิดเป็น {complianceRateDisplay} ของบันทึกทั้งหมด</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase">จำนวนวันที่ใส่ไม่ได้ (✕)</span>
              <div className="text-xl font-bold text-rose-600">
                {failedCount} วัน
              </div>
              <p className="text-[10px] text-slate-400">เก็บประวัติและเหตุผลสำหรับพบทันตแพทย์</p>
            </div>
          </div>
        )}
      </div>

      {/* Detailed EF Records Table */}
      <div className="aurora-card rounded-3xl p-6 md:p-8 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-purple-600 shrink-0" />
            <h3 className="text-base font-black text-[#1A1A24]">
              3. ประวัติการบันทึกเครื่องมือ EF รายวันย้อนหลัง (EF Daily Wear Logs)
            </h3>
          </div>
        </div>

        {!hasEFData ? (
          <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-xs text-slate-500 italic">ยังไม่มีข้อมูลการใส่เครื่องมือ EF</p>
          </div>
        ) : (
          <div className="space-y-3">
            {efRecordLogs.slice().reverse().map((rec) => (
              <div key={rec.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 font-mono">
                      {formatDateString(rec.date)}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      rec.status === 'worn' 
                        ? 'bg-purple-50 text-purple-700 border-purple-100'
                        : 'bg-rose-50 text-rose-700 border-rose-100'
                    }`}>
                      {rec.status === 'worn' ? '✓ ใส่ได้' : '✕ ใส่ไม่ได้'}
                    </span>
                    {rec.durationHours !== undefined && rec.durationHours > 0 && (
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                        {rec.durationHours} ชม.
                      </span>
                    )}
                  </div>
                  {rec.notes && (
                    <p className="text-xs text-slate-600"><strong>หมายเหตุ:</strong> {rec.notes}</p>
                  )}
                  {rec.removalReason && (
                    <p className="text-xs text-rose-600 font-medium"><strong>ถอดกลางคืน/เหตุผล:</strong> {rec.removalReason}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
