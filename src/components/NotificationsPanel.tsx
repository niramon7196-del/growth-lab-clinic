import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  ShieldAlert, 
  Check, 
  TrendingDown, 
  Star, 
  MessageSquare, 
  Heart, 
  RefreshCw,
  FolderOpen,
  Moon,
  AlertTriangle,
  Calendar,
  ChevronRight,
  Clock
} from 'lucide-react';
import { SystemNotification, Patient, SessionLog, Appointment } from '../types';
import { usePatientContext } from '../context/PatientContext';
import EmptyState from './ui/EmptyState';
import { Logo } from './Logo';
import { getCleanPatientDisplayName, getCleanNotes } from './AppointmentsList';
import { formatThaiDate, getLocalDateParts, parseLocalDate } from '../utils/checkInCalculations';

interface NotificationsPanelProps {
  notifications: SystemNotification[];
  patients: Patient[];
  logs: SessionLog[];
  appointments?: Appointment[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onAddNotification: (notification: Omit<SystemNotification, 'id' | 'date' | 'read'>) => void;
  initialSubTab?: 'alerts' | 'compliance' | 'redflags';
  onNavigateToPatient?: (patientId: string, subTab?: string) => void;
}

export default function NotificationsPanel({
  notifications,
  patients,
  logs,
  appointments: propAppointments,
  onMarkAsRead,
  onMarkAllAsRead,
  onAddNotification,
  initialSubTab,
  onNavigateToPatient,
}: NotificationsPanelProps) {
  const context = usePatientContext();
  const allAppointments = propAppointments || context.appointments || [];
  const [activeTab, setActiveTab] = useState<'alerts' | 'compliance'>('alerts');

  React.useEffect(() => {
    if (initialSubTab === 'compliance') {
      setActiveTab('compliance');
    } else if (initialSubTab) {
      setActiveTab('alerts');
    }
  }, [initialSubTab]);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);

  // 1. Clinical Risk / Red Flag Alerts Calculation
  const calculatedRiskAlerts = useMemo(() => {
    const alerts: Array<{
      id: string;
      patientId: string;
      patient: Patient;
      type: 'sleep_redflag' | 'missing_checkin';
      severity: 'high' | 'medium';
      title: string;
      message: string;
      tags: string[];
      date: string;
      daysMissing?: number;
    }> = [];

    (patients || []).forEach(patient => {
      if (!patient || patient.status !== 'active') return;

      // Check Sleep Red Flags from sleepLogs / sleepMonthlyProfiles
      const recentSleepLogs = patient.sleepLogs || [];
      const hasSnoring = recentSleepLogs.some(s => s.snoring || (s.snoringMouthBreathingScore && s.snoringMouthBreathingScore >= 2) || s.redFlags?.snoringRegularly);
      const hasMouthBreathing = recentSleepLogs.some(s => s.mouthBreathing || s.redFlags?.mouthBreathingRegularly);
      const hasApnea = recentSleepLogs.some(s => s.redFlags?.apneaObserved || s.notes?.includes('หยุดหายใจ') || s.notes?.includes('หายใจเฮือก'));
      const hasSleepRedFlag = hasSnoring || hasMouthBreathing || hasApnea || recentSleepLogs.some(s => s.hasRedFlag);

      if (hasSleepRedFlag) {
        const symptoms: string[] = [];
        if (hasApnea) symptoms.push('สังเกตพบภาวะหยุดหายใจ/หายใจเฮือกขณะหลับ');
        if (hasSnoring) symptoms.push('มีอาการนอนกรนเป็นประจำ');
        if (hasMouthBreathing) symptoms.push('อ้าปากหายใจขณะหลับเป็นประจำ');

        alerts.push({
          id: `rf_sleep_${patient.id}`,
          patientId: patient.id,
          patient,
          type: 'sleep_redflag',
          severity: hasApnea ? 'high' : 'medium',
          title: `⚠️ พบสัญญาณเตือนระบบการนอน (Sleep Red Flag): น้อง${patient.nickname || patient.firstName}`,
          message: symptoms.length > 0 ? symptoms.join(' • ') : 'พบอาการผิดปกติด้านการหายใจและการนอนหลับ ควรส่งต่อพบแพทย์/ทันตแพทย์ผู้เชี่ยวชาญ',
          tags: ['Sleep Red Flag', 'ทางเดินหายใจ'],
          date: todayStr
        });
      }

      // Check Missing Check-in > 7 days
      // Determine latest checkin from lastCheckIn, checkInHistory, or logs
      let latestDate: Date | null = null;
      if (patient.lastCheckIn) {
        latestDate = new Date(patient.lastCheckIn);
      }
      if (patient.checkInHistory && patient.checkInHistory.length > 0) {
        patient.checkInHistory.forEach(c => {
          const d = new Date(c.date);
          if (!latestDate || d > latestDate) latestDate = d;
        });
      }
      const pLogs = logs.filter(l => l.patientId === patient.id);
      if (pLogs.length > 0) {
        pLogs.forEach(l => {
          const d = new Date(l.date);
          if (!latestDate || d > latestDate) latestDate = d;
        });
      }

      if (!latestDate && patient.startDate) {
        latestDate = new Date(patient.startDate);
      }

      if (latestDate) {
        const diffTime = Math.abs(today.getTime() - latestDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 7) {
          alerts.push({
            id: `rf_absence_${patient.id}`,
            patientId: patient.id,
            patient,
            type: 'missing_checkin',
            severity: diffDays > 14 ? 'high' : 'medium',
            title: `⏰ ขาดการเช็กอินส่งการบ้านเกิน 7 วัน: น้อง${patient.nickname || patient.firstName} (${patient.hn})`,
            message: `ไม่พบการเช็กอินหรือบันทึกกิจกรรมต่อเนื่องมาแล้ว ${diffDays} วัน (เช็กอินล่าสุด: ${latestDate.toLocaleDateString('th-TH')}) แนะนำโทรติดตามประเมินอุปสรรค`,
            tags: ['ขาดการเช็กอิน > 7 วัน', 'Compliance Risk'],
            date: todayStr,
            daysMissing: diffDays
          });
        }
      }
    });

    return alerts;
  }, [patients, logs, todayStr]);

  // Compute compliance risk analysis (patients who trained less than 3 times in the last 7 days)
  const riskPatients = useMemo(() => {
    return (patients || []).filter(p => p && p.status === 'active').map((patient) => {
      const patientLogs = (logs || []).filter(
        (l) => l.patientId === patient.id && new Date(l.date) >= sevenDaysAgo
      );
      
      const trainedDates = new Set(patientLogs.map((l) => l.date));
      const activeDaysCount = trainedDates.size;
      
      const avgScore = patientLogs.length > 0 
        ? Math.round((patientLogs.reduce((acc, curr) => acc + curr.score, 0) / patientLogs.length) * 10) / 10
        : 0;

      return {
        patient,
        activeDaysCount,
        avgScore,
        riskLevel: activeDaysCount >= 5 ? 'low' : activeDaysCount >= 3 ? 'medium' : 'high',
      };
    });
  }, [patients, logs, sevenDaysAgo]);

  const triggerCallAlert = (pName: string, nickname: string) => {
    alert(`ระบบจำลองการติดต่อกลับไปยัง คุณ${pName} (${nickname}) สำเร็จ!\nส่ง SMS แจ้งเตือนการบริหารกล้ามเนื้อประจำวันเรียบร้อยแล้ว`);
  };

  const handleOpenPatientCase = (patientId: string, subTab: string = 'ภาพรวม') => {
    if (onNavigateToPatient) {
      onNavigateToPatient(patientId, subTab);
    } else {
      const el = document.getElementById(`patient-row-${patientId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div id="notifications-view" className="space-y-6 text-left w-full max-w-full overflow-x-hidden box-border">
      
      {/* Header Panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Logo className="w-28 sm:w-32 h-auto shrink-0" />
          <div>
            <h2 className="text-xl font-bold text-slate-800 font-sans flex items-center gap-2">
              <span>แจ้งเตือนและระบบติดตามผล</span>
              {calculatedRiskAlerts.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
                  {calculatedRiskAlerts.length} เคสเสี่ยง
                </span>
              )}
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">ศูนย์วิเคราะห์เคสเตือนภัย (Red Flags), ขาดการฝึกเกิน 7 วัน และความสม่ำเสมอ</p>
          </div>
        </div>

        <button
          onClick={onMarkAllAsRead}
          className="flex items-center gap-1.5 text-xs font-semibold text-brand bg-brand-light px-3.5 py-2 rounded-xl hover:bg-brand-light/85 transition-all cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>อ่านทั้งหมด</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 gap-1 flex-wrap">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'alerts'
              ? 'border-brand text-brand font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>กล่องข้อความและเคสเตือนภัย</span>
          {(notifications.filter(n => !n.read).length + calculatedRiskAlerts.length) > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-rose-500 text-white font-mono">
              {notifications.filter(n => !n.read).length + calculatedRiskAlerts.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('compliance')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'compliance'
              ? 'border-brand text-brand font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          <span>วิเคราะห์กลุ่มเสี่ยง (Risk Analysis)</span>
        </button>
      </div>

      {/* TAB CONTENT: ALERTS */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">

          {/* Section: Upcoming Dental Appointments */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50/50 p-5 rounded-3xl border border-purple-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-purple-900 flex items-center gap-2">
                <Calendar className="w-4.5 h-4.5 text-purple-600" />
                <span>ตารางนัดหมายพบทันตแพทย์และติดตามผล (Upcoming Dental Appointments)</span>
              </h3>
              <span className="text-xs font-bold text-purple-700 bg-purple-100/80 px-2.5 py-1 rounded-full border border-purple-200">
                นัดหมายล่าสุด
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {allAppointments.length === 0 ? (
                <div className="col-span-2 py-6 text-center text-xs font-semibold text-slate-400 bg-white/70 rounded-2xl border border-purple-100">
                  ไม่มีตารางนัดหมายที่รอดำเนินการในขณะนี้
                </div>
              ) : (
                allAppointments.slice(0, 6).map((appt) => {
                  const apptParts = getLocalDateParts(appt.date);
                  const appointmentDate = parseLocalDate(appt.date);
                  const patientObj = patients.find(p => p.id === appt.patientId);
                  const diffTime = appointmentDate.getTime() - new Date().getTime();
                  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                  return (
                    <div key={appt.id} className="p-4 rounded-2xl bg-white border border-purple-100 shadow-2xs flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 font-black text-xs flex flex-col items-center justify-center shrink-0 border border-purple-200"
                          title={`วันนัดหมาย: ${formatThaiDate(appt.date)}`}
                        >
                          <span>{apptParts.day}</span>
                          <span className="text-[9px] uppercase font-bold text-purple-500">
                            {apptParts.thaiMonthShort}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-slate-800">
                            {getCleanPatientDisplayName(patientObj?.nickname || patientObj?.firstName || appt.patientName)} {patientObj?.hn ? `(${patientObj.hn})` : ''}
                          </div>
                          <div className="text-[11px] text-purple-700 font-medium">
                            {appt.type === 'clinical' ? 'คลินิก On-site' : appt.type === 'online' ? 'วิดีโอคอล Online' : (appt.type || 'ตรวจติดตาม OMT & พัฒนาการ')}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            เวลา {appt.time || '10:30 น.'} • {getCleanNotes(appt.notes) || 'คลินิกทันตกรรม Growth Lab'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          daysLeft <= 3 
                            ? 'bg-rose-50 text-rose-700 border-rose-200' 
                            : daysLeft <= 7 
                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}>
                          {daysLeft < 0 ? 'ผ่านมาแล้ว' : daysLeft === 0 ? 'วันนี้' : `อีก ${daysLeft} วัน`}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Section: Clinical Risk & Red Flag Auto Alerts */}
          {calculatedRiskAlerts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-rose-800 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 animate-pulse" />
                  <span>เคสเตือนภัยทางคลินิกอัตโนมัติ (Clinical Risk & Red Flag Alerts)</span>
                </h3>
                <span className="text-xs text-rose-600 font-bold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                  {calculatedRiskAlerts.length} รายการที่ต้องดูแลเร่งด่วน
                </span>
              </div>

              {calculatedRiskAlerts.map((alertItem) => (
                <div
                  key={alertItem.id}
                  className="p-4.5 rounded-2xl border border-rose-200 bg-rose-50/70 hover:bg-rose-50 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left shadow-2xs"
                >
                  <div className="flex gap-3.5 items-start">
                    <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700 shrink-0 mt-0.5">
                      {alertItem.type === 'sleep_redflag' ? (
                        <Moon className="w-5 h-5" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-rose-950">
                          {alertItem.title}
                        </h4>
                        {alertItem.tags.map(t => (
                          <span key={t} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/90 text-rose-700 border border-rose-200">
                            {t}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-rose-800 leading-relaxed font-medium">
                        {alertItem.message}
                      </p>
                      <div className="text-[11px] text-rose-600 flex items-center gap-3 pt-0.5">
                        <span>HN: {alertItem.patient.hn}</span>
                        <span>•</span>
                        <span>เบอร์ติดต่อผู้ปกครอง: {alertItem.patient.parentPhone || alertItem.patient.phone || 'ไม่มี'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for Red Flag Item */}
                  <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-rose-200/60">
                    <button
                      type="button"
                      onClick={() => triggerCallAlert(alertItem.patient.firstName, alertItem.patient.nickname)}
                      className="px-3 py-2 bg-white hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-300 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      title="ส่งข้อความแจ้งเตือนหรือโทรติดตาม"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>โทรติดตาม</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenPatientCase(alertItem.patientId, alertItem.type === 'sleep_redflag' ? 'การนอน' : 'ภาพรวม')}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <FolderOpen className="w-4 h-4" />
                      <span>เปิดดูเคสทันที</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Section: Standard System Notifications */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              ประวัติข้อความแจ้งเตือนของระบบ ({notifications.length})
            </h3>

            {notifications.length === 0 && calculatedRiskAlerts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-xs">
                <EmptyState 
                  title="ยังไม่มีข้อความแจ้งเตือน" 
                  description="ระบบจะแสดงการแจ้งเตือนและการบ้านของผู้รับการดูแลเมื่อมีกิจกรรมใหม่" 
                  actionLabel="+ เพิ่มการแจ้งเตือนทดสอบ" 
                  onAction={() => {
                    onAddNotification({
                      type: 'info',
                      title: 'ยินดีต้อนรับสู่ระบบ Growth Lab',
                      message: 'เริ่มต้นเพิ่มข้อมูลผู้รับการดูแลและตารางนัดหมายเพื่อรับการแจ้งเตือน'
                    });
                  }}
                />
              </div>
            ) : (
              notifications.map((not) => {
                const targetPatient = not.patientId ? patients.find(p => p.id === not.patientId) : null;
                return (
                  <div 
                    key={not.id}
                    className={`p-4.5 rounded-2xl border transition-all flex gap-4 text-left ${
                      not.read 
                        ? 'bg-slate-50/50 border-slate-100 opacity-70' 
                        : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-xs'
                    }`}
                  >
                    {/* Warning / Success icon */}
                    <div className={`p-3 rounded-xl h-fit shrink-0 ${
                      not.type === 'warning' 
                        ? 'bg-amber-50 text-amber-600' 
                        : not.type === 'success'
                        ? 'bg-brand-light text-brand'
                        : 'bg-indigo-50 text-indigo-600'
                    }`}>
                      <ShieldAlert className="w-5 h-5" />
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className={`text-sm ${not.read ? 'font-medium text-slate-600' : 'font-bold text-slate-800'}`}>
                          {not.title}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400 font-semibold shrink-0">
                          {formatThaiDate(not.date, { showYear: false })}
                        </span>
                      </div>
                      
                      <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
                        {not.message}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        {!not.read && (
                          <button
                            type="button"
                            onClick={() => onMarkAsRead(not.id)}
                            className="text-xs text-brand hover:text-brand-dark font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>ทำเครื่องหมายว่าอ่านแล้ว</span>
                          </button>
                        )}

                        {targetPatient && (
                          <button
                            type="button"
                            onClick={() => handleOpenPatientCase(targetPatient.id)}
                            className="text-xs text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 cursor-pointer ml-auto bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                            <span>เปิดดูเคส ({targetPatient.nickname || targetPatient.firstName})</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: COMPLIANCE RISK ANALYSIS */}
      {activeTab === 'compliance' && (
        <div className="space-y-6">
          
          <div className="bg-amber-50 border border-amber-200 p-4.5 rounded-2xl flex gap-3 text-left">
            <TrendingDown className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-bold text-amber-900 text-sm">หลักการติดตามทางคลินิก (Dr. Toi Guidelines) 🩺</h4>
              <p className="text-amber-800 text-xs mt-1 leading-relaxed">
                การฝึกกล้ามเนื้อใบหน้าจะเห็นผลเป็นรูปธรรมต้องอาศัยการฝึกซ้ำต่อเนื่องอย่างน้อย 5 วันต่อสัปดาห์ หากระบบประมวลผลพบว่า ผู้รับการดูแลท่านใดฝึกต่ำกว่า 3 วันในสัปดาห์ล่าสุด จะถูกจัดกลุ่มเป็น <strong>ความเสี่ยงสูง (High Risk)</strong> ซึ่งแพทย์แนะนำให้โทรติดตามเพื่อซักถามอุปสรรคในการฝึกทันที
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-4">
            <h3 className="text-base font-bold text-slate-800 font-sans">
              ระดับความเสี่ยงของผู้รับการดูแลในระบบ (Weekly Compliance Risk)
            </h3>

            <div className="space-y-3">
              {riskPatients.map(({ patient, activeDaysCount, avgScore, riskLevel }) => (
                <div 
                  key={patient.id}
                  className="p-4 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex gap-3 items-center text-left">
                    <div className={`w-3.5 h-3.5 rounded-full ${
                      riskLevel === 'high' 
                        ? 'bg-rose-500 animate-pulse' 
                        : riskLevel === 'medium' 
                        ? 'bg-amber-400' 
                        : 'bg-brand'
                    }`} />
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        {patient.firstName} {patient.lastName} ({patient.nickname})
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400 font-semibold">{patient.hn}</span>
                    </div>
                  </div>

                  {/* Stats columns */}
                  <div className="grid grid-cols-2 sm:flex sm:items-center gap-6 text-xs text-slate-500 font-semibold">
                    <div className="text-left">
                      <span className="text-[10px] text-slate-400 block">ฝึกสัปดาห์นี้</span>
                      <span className="text-slate-800 font-mono text-sm">{activeDaysCount} / 7 วัน</span>
                    </div>

                    <div className="text-left">
                      <span className="text-[10px] text-slate-400 block">คะแนนเฉลี่ย</span>
                      <span className="text-brand font-mono text-sm flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-brand/20" />
                        {avgScore || '-'}
                      </span>
                    </div>

                    <div className="col-span-2 sm:col-span-1 text-left sm:text-right">
                      <span className="text-[10px] text-slate-400 block">ประเมินสถานะ</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                        riskLevel === 'high' 
                          ? 'bg-rose-50 text-rose-700' 
                          : riskLevel === 'medium'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-brand-light text-brand-dark'
                      }`}>
                        {riskLevel === 'high' ? 'ความเสี่ยงสูง (High Risk)' : riskLevel === 'medium' ? 'ปานกลาง' : 'ความเพียรดีเยี่ยม'}
                      </span>
                    </div>
                  </div>

                  {/* Callback & Open Case Buttons */}
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenPatientCase(patient.id)}
                      className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 transition-all cursor-pointer"
                      title="เปิดดูแฟ้มประวัติคนไข้ทันที"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>ดูแฟ้ม</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => triggerCallAlert(patient.firstName, patient.nickname)}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer ${
                        riskLevel === 'high'
                          ? 'bg-rose-600 text-white hover:bg-rose-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>โทรติดตามด่วน</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
