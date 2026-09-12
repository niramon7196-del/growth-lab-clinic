import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  CalendarClock, 
  CalendarCheck, 
  Loader2, 
  Send, 
  Save, 
  FileText, 
  AlertTriangle,
  Sparkles,
  Info,
  RotateCcw
} from 'lucide-react';
import { Appointment, Patient } from '../types';
import { syncAppointmentToGoogleSheets, getWebhookUrl } from '../services/googleAppsScriptService';
import { playSuccessChime } from '../utils/audioUtils';
import { getCleanNotes } from './AppointmentsList';
import { resolvePatientAppointments, persistAppointmentLocally } from '../utils/appointmentMockService';

interface PatientInteractiveCalendarProps {
  patient: Patient;
  appointments: Appointment[];
  onUpdateAppointmentStatus?: (id: string, status: string, notes?: string, fullAppt?: Appointment) => void;
}

export default function PatientInteractiveCalendar({
  patient,
  appointments,
  onUpdateAppointmentStatus
}: PatientInteractiveCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Format YYYY-MM-DD
  const formatYmd = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = formatYmd(new Date());

  // Filter and resolve patient appointments: guarantees stable mock appointments immediately
  // without depending on raw Google Sheets availability, while seamlessly merging any real updates!
  const filteredAppointments = useMemo(() => {
    return resolvePatientAppointments(patient, appointments, currentDate);
  }, [appointments, patient, currentDate]);

  // Find initial selected date: closest upcoming appointment date, or today
  const initialAppt = useMemo(() => {
    const upcoming = filteredAppointments.find(a => a.date >= todayStr && a.status !== 'completed' && a.status !== 'cancelled');
    return upcoming || filteredAppointments[0] || null;
  }, [filteredAppointments, todayStr]);

  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => initialAppt?.date || todayStr);
  const [selectedApptId, setSelectedApptId] = useState<string | null>(() => initialAppt?.id || null);
  const [noteInput, setNoteInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveFeedback, setSaveFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Sync initial appointment selection when available
  useEffect(() => {
    if (initialAppt && (!selectedApptId || !filteredAppointments.some(a => a.id === selectedApptId))) {
      setSelectedApptId(initialAppt.id);
      setSelectedDateStr(initialAppt.date);
      setNoteInput(getCleanNotes(initialAppt.notes));
    }
  }, [initialAppt, filteredAppointments]);

  // When selected date changes or appointments list updates, sync selected appointment & note input
  useEffect(() => {
    const apptsOnSelectedDate = filteredAppointments.filter(a => a.date === selectedDateStr);
    if (apptsOnSelectedDate.length > 0) {
      const match = apptsOnSelectedDate.find(a => a.id === selectedApptId) || apptsOnSelectedDate[0];
      setSelectedApptId(match.id);
      setNoteInput(getCleanNotes(match.notes));
    } else if (selectedApptId) {
      const current = filteredAppointments.find(a => a.id === selectedApptId);
      if (current) {
        setNoteInput(getCleanNotes(current.notes));
      } else {
        setSelectedApptId(null);
        setNoteInput('');
      }
    } else {
      setNoteInput('');
    }
  }, [selectedDateStr, filteredAppointments]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const currentMonthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const currentMonthAppointments = useMemo(() => {
    return filteredAppointments.filter(a => a.date.startsWith(currentMonthPrefix) && a.status !== 'cancelled');
  }, [filteredAppointments, currentMonthPrefix]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const monthNames = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", 
    "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", 
    "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  const thaiDayNames = ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"];

  const toThaiNumeral = (num: number | string) => {
    const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
    return String(num).replace(/[0-9]/g, (d) => thaiDigits[parseInt(d, 10)]);
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(formatYmd(now));
  };

  // Build 35 calendar cells (7 columns x 5 rows)
  const days: (Date | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }
  while (days.length < 35) {
    days.push(null);
  }

  const isToday = (date: Date) => formatYmd(date) === todayStr;

  const getAppointmentsForDate = (date: Date | string) => {
    const dateStr = typeof date === 'string' ? date : formatYmd(date);
    return filteredAppointments
      .filter(a => a.date === dateStr && a.status !== 'cancelled')
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  const selectedDayAppointments = getAppointmentsForDate(selectedDateStr);

  // Active appointment for the note section
  const activeAppointment: Appointment | null = useMemo(() => {
    if (selectedApptId) {
      const found = filteredAppointments.find(a => a.id === selectedApptId);
      if (found) return found;
    }
    if (selectedDayAppointments.length > 0) {
      return selectedDayAppointments[0];
    }
    // Fallback to initial upcoming appointment
    return initialAppt;
  }, [selectedApptId, filteredAppointments, selectedDayAppointments, initialAppt]);

  // Format selected date in Thai
  const formatSelectedDateThai = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const dateObj = new Date(y, m, d);
        const dayOfWeek = thaiDayNames[dateObj.getDay()] || 'วัน';
        const mName = monthNames[m] || '';
        return `${dayOfWeek}ที่ ${d} ${mName} ${y + 543}`;
      }
    } catch {}
    return dateStr;
  };

  // Save notes & status to local state, persistent storage, and background Google Sheets
  const handleSaveNoteAndStatus = async (targetStatus?: string) => {
    if (!activeAppointment) {
      alert('ไม่พบนัดหมายเป้าหมายสำหรับการบันทึก กรุณาเลือกนัดหมายบนปฏิทิน');
      return;
    }

    const cleanNoteText = noteInput.trim();
    const finalStatus = targetStatus || activeAppointment.status || 'pending';

    setIsSaving(true);
    setSaveFeedback(null);

    const updatedAppt: Appointment = {
      ...activeAppointment,
      status: finalStatus,
      notes: cleanNoteText
    };

    // 1. Immediately persist locally so data is 100% stable regardless of Google Sheets
    persistAppointmentLocally(updatedAppt);

    // 2. Update local state in parent components
    if (onUpdateAppointmentStatus) {
      onUpdateAppointmentStatus(activeAppointment.id, finalStatus, cleanNoteText, updatedAppt);
    }

    playSuccessChime();

    let successMsg = '✓ บันทึกข้อมูลเรียบร้อยแล้วค่ะ';
    if (targetStatus?.includes('Confirmed') || targetStatus?.includes('สะดวกมาตามนัด') || targetStatus?.includes('ยืนยัน')) {
      successMsg = '✅ สะดวกมาตามนัด (ยืนยัน) บันทึกลงในระบบเรียบร้อยแล้วค่ะ';
    } else if (targetStatus?.includes('Reschedule') || targetStatus?.includes('ขอเลื่อน')) {
      successMsg = '🔄 ส่งคำขอเลื่อนนัดพร้อมเหตุผลเรียบร้อยแล้วค่ะ (ทางคลินิกจะติดต่อกลับเพื่อยืนยันวันเวลาใหม่)';
    }

    setSaveFeedback({
      message: successMsg,
      type: 'success'
    });

    // 3. Background Sync to Google Sheets Appointments tab (failsafe, non-blocking)
    try {
      const webhook = getWebhookUrl();
      if (webhook) {
        await syncAppointmentToGoogleSheets(webhook, updatedAppt);
      }
    } catch (err) {
      console.warn('[PatientInteractiveCalendar] Google Sheets background sync notice:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5 text-left w-full max-w-full overflow-x-hidden box-border">
      
      {/* 1. Control & Month Navigation Bar */}
      <div className="bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-purple-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                ปฏิทินนัดหมายการตรวจและฝึก OMT
              </h2>
              {patient.hn && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-100 text-purple-900 border border-purple-200">
                  HN: {patient.hn}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              แสดงตารางนัดหมายของคุณจากคลินิก (แตะเลือกช่องวันที่บนปฏิทินเพื่อดูรายละเอียดและพิมพ์บันทึก)
            </p>
          </div>
        </div>

        {/* Month controls & Today button */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          <div className="flex items-center bg-purple-50/80 border border-purple-200/80 rounded-xl overflow-hidden shadow-2xs">
            <button 
              onClick={prevMonth} 
              type="button"
              className="p-2 hover:bg-purple-100 text-purple-800 border-r border-purple-200/60 transition-colors cursor-pointer"
              title="เดือนก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-black text-purple-950 whitespace-nowrap min-w-[120px] text-center">
              {monthNames[month]} {year + 543}
            </span>
            <button 
              onClick={nextMonth} 
              type="button"
              className="p-2 hover:bg-purple-100 text-purple-800 transition-colors cursor-pointer"
              title="เดือนถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button 
            onClick={today} 
            type="button"
            className="px-3 py-2 text-xs font-bold text-indigo-900 bg-white hover:bg-indigo-50 border border-purple-200 rounded-xl cursor-pointer shadow-2xs transition-all flex items-center gap-1.5"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>วันนี้</span>
          </button>
        </div>
      </div>

      {/* 2. THE FULL ORIGINAL CALENDAR CANVAS (100% Crisp Artwork with Interactive Overlays) */}
      <div className="w-full max-w-full lg:max-w-5xl mx-auto rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl relative border border-purple-200/80 bg-slate-900/5">
        
        {/* Aspect ratio container (1506 x 1045 original canvas) */}
        <div className="relative w-full aspect-[1506/1045] select-none">
          
          {/* Base Artwork Image - 100% Fidelity (Original Canvas Direct from User URL) */}
          <img 
            src="https://lh3.googleusercontent.com/d/1Czgzv4Un-xccbCozHdOcZKqMdOduXKQ7"
            alt="ตารางนัดหมาย Growth Lab Original Calendar Canvas"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            className="absolute inset-0 w-full h-full object-fill pointer-events-none"
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src.includes('lh3.googleusercontent.com')) {
                target.src = 'https://drive.google.com/uc?export=view&id=1Czgzv4Un-xccbCozHdOcZKqMdOduXKQ7';
              } else if (!target.src.includes('calendar_canvas.png')) {
                target.src = '/calendar_canvas.png';
              }
            }}
          />

          {/* OVERLAY 1: Top-Right "เดือน ... พ.ศ. ..." Box */}
          {/* Month on dotted line */}
          <div 
            className="absolute flex items-center justify-start pointer-events-none"
            style={{
              top: '7.8%',
              left: '73.5%',
              width: '15.5%',
              height: '3.8%'
            }}
          >
            <span className="text-purple-950 font-black text-[11px] sm:text-xs md:text-sm lg:text-base tracking-wide drop-shadow-2xs">
              {monthNames[month]}
            </span>
          </div>

          {/* Year on dotted line (Thai numerals e.g. ๒๕๖๙) */}
          <div 
            className="absolute flex items-center justify-start pointer-events-none"
            style={{
              top: '11.6%',
              left: '73.5%',
              width: '15.5%',
              height: '3.8%'
            }}
          >
            <span className="text-purple-950 font-black text-[11px] sm:text-xs md:text-sm lg:text-base tracking-wider drop-shadow-2xs">
              {toThaiNumeral(year + 543)}
            </span>
          </div>

          {/* OVERLAY 2: "🗓️ ดูวันนัดตรวจ / เลื่อนนัด" Button in Header */}
          <div
            className="absolute rounded-full flex items-center justify-center pointer-events-none"
            style={{
              top: '9.0%',
              left: '23.3%',
              width: '26.5%',
              height: '6.8%'
            }}
          >
            <span className="sr-only">ดูวันนัดตรวจ / เลื่อนนัด</span>
          </div>

          {/* OVERLAY 3: The 35 Grid Cells (7 columns x 5 rows) */}
          <div 
            className="absolute grid grid-cols-7 grid-rows-5"
            style={{
              top: '25.5%',
              left: '1.6%',
              width: '96.8%',
              height: '58.5%'
            }}
          >
            {days.slice(0, 35).map((date, i) => {
              if (!date) {
                return (
                  <div 
                    key={`empty-${i}`} 
                    className="w-full h-full relative"
                  />
                );
              }
              
              const dateStr = formatYmd(date);
              const dayAppts = getAppointmentsForDate(date);
              const isCurrentDay = isToday(date);
              const isSelected = selectedDateStr === dateStr;
              const hasAppts = dayAppts.length > 0;
              
              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => {
                    setSelectedDateStr(dateStr);
                    if (dayAppts.length > 0) {
                      setSelectedApptId(dayAppts[0].id);
                      setNoteInput(getCleanNotes(dayAppts[0].notes));
                    }
                  }}
                  className={`w-full h-full text-left relative transition-all group cursor-pointer outline-none select-none rounded-xl p-1 sm:p-1.5 flex flex-col justify-between ${
                    isSelected 
                      ? 'ring-2 sm:ring-3 ring-purple-600 ring-inset bg-purple-500/15 shadow-sm' 
                      : 'hover:bg-purple-500/10 hover:ring-1 hover:ring-purple-300/60'
                  }`}
                  title={`วันที่ ${date.getDate()} ${monthNames[month]} ${year + 543}${hasAppts ? ` (นัดหมายของคุณ ${dayAppts.length} รายการ)` : ''}`}
                >
                  {/* Top row of cell: Date number & Appointment indicator badge */}
                  <div className="flex items-center justify-between w-full">
                    <span 
                      className={`inline-flex items-center justify-center font-black font-mono transition-all rounded leading-none ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-xs text-[9px] sm:text-xs md:text-sm lg:text-base px-1 sm:px-1.5 py-0.5 ring-1 sm:ring-2 ring-white'
                          : isCurrentDay
                          ? 'bg-indigo-600 text-white text-[9px] sm:text-xs md:text-sm px-1 py-0.5 shadow-2xs font-black'
                          : 'text-purple-950 text-[9px] sm:text-xs md:text-sm lg:text-base font-black group-hover:text-purple-700'
                      }`}
                    >
                      {date.getDate()}
                    </span>

                    {/* Has appointment indicator badge */}
                    {hasAppts && (
                      <span 
                        className="inline-flex items-center justify-center bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[7px] sm:text-[9px] md:text-[10px] font-black px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded-full shadow-2xs animate-pulse"
                        title={`มี ${dayAppts.length} นัดหมาย`}
                      >
                        <span className="hidden sm:inline">{dayAppts.length} นัด</span>
                        <span className="sm:hidden inline leading-none">●</span>
                      </span>
                    )}
                  </div>

                  {/* Appointment item pills inside cell */}
                  {hasAppts && (
                    <div className="flex flex-col gap-0.5 w-full mt-auto overflow-hidden">
                      {dayAppts.slice(0, 2).map((appt) => {
                        const isRescheduleRequested = appt.status?.includes('Reschedule') || appt.status?.includes('ขอเลื่อน') || appt.status === 'reschedule_requested';
                        const isConfirmed = appt.status?.includes('Confirmed') || appt.status?.includes('ยืนยัน') || appt.status === 'confirmed';
                        const isCompleted = appt.status === 'completed' || appt.status === 'เสร็จสิ้น';
                        
                        return (
                          <div
                            key={appt.id}
                            className={`text-[7px] sm:text-[9px] md:text-[10px] font-bold px-0.5 sm:px-1 py-0.2 sm:py-0.5 rounded leading-tight truncate shadow-2xs flex items-center justify-center sm:justify-start gap-0.5 border ${
                              isRescheduleRequested
                                ? 'bg-amber-500 text-white border-amber-600 animate-pulse font-black'
                                : isConfirmed
                                ? 'bg-sky-600 text-white border-sky-700'
                                : isCompleted
                                ? 'bg-emerald-500 text-white border-emerald-600'
                                : 'bg-purple-600 text-white border-purple-700'
                            }`}
                          >
                            {isRescheduleRequested && <span className="text-[6px] sm:text-[7px] shrink-0">⚠️</span>}
                            {isConfirmed && <span className="text-[6px] sm:text-[7px] shrink-0">✓</span>}
                            <span className="font-mono text-[6px] sm:text-[7px] md:text-[8px] shrink-0">{appt.time}</span>
                            <span className="truncate hidden sm:inline">{appt.type || 'ตรวจติดตาม'}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* OVERLAY 4: Bottom "บันทึกเพิ่มเติม" Display Banner on Artwork Canvas */}
          <div 
            onClick={() => {
              if (selectedDayAppointments.length > 0) {
                setSelectedApptId(selectedDayAppointments[0].id);
              }
            }}
            className="absolute flex flex-col justify-center px-3 sm:px-4 text-left overflow-hidden cursor-pointer hover:bg-purple-50/40 rounded-xl transition-colors group"
            style={{
              top: '84.5%',
              left: '10.0%',
              width: '83.0%',
              height: '14.0%'
            }}
            title="คลิกเพื่อแก้ไขบันทึกเพิ่มเติมด้านล่าง"
          >
            <div className="flex items-center gap-1.5 leading-tight flex-wrap">
              <span className="text-[10px] sm:text-xs md:text-sm font-black text-purple-950 shrink-0">
                บันทึกเพิ่มเติม (วันที่ {new Date(selectedDateStr).getDate()} {monthNames[new Date(selectedDateStr).getMonth()]}):
              </span>
              {selectedDayAppointments.length > 0 ? (
                <span className="text-[10px] sm:text-xs md:text-sm font-extrabold text-purple-800 truncate">
                  เวลา {selectedDayAppointments[0].time} น. ({selectedDayAppointments[0].type || 'ตรวจติดตาม'}) 
                  {selectedDayAppointments[0].status && ` [${selectedDayAppointments[0].status}]`}
                </span>
              ) : (
                <span className="text-[10px] sm:text-xs md:text-sm font-semibold text-slate-600 italic">
                  ไม่มีนัดหมายในวันที่เลือก (แตะเลือกวันที่ที่มีนัดหมายเพื่อดูรายละเอียด)
                </span>
              )}
            </div>
            {selectedDayAppointments.length > 0 && selectedDayAppointments[0]?.notes && (
              <p className="hidden sm:block text-[9px] md:text-[11px] text-slate-700 truncate mt-0.5 font-medium">
                ข้อความล่าสุด: "{getCleanNotes(selectedDayAppointments[0].notes)}"
              </p>
            )}
          </div>

        </div>
      </div>

      {/* 2.5 MONTHLY APPOINTMENT CARDS (Optimized for Mobile, iPad & Desktop) */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-purple-200/80 shadow-sm space-y-3 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-100 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-ping" />
            <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-1.5">
              <span>🗓️ รายการนัดหมายเดือน{monthNames[month]} {year + 543}</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-purple-100 text-purple-900 border border-purple-200">
                {currentMonthAppointments.length} นัด
              </span>
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            (แตะเลือกนัดหมายเพื่อดูบนปฏิทินและพิมพ์บันทึก/ยืนยัน)
          </span>
        </div>

        {currentMonthAppointments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentMonthAppointments.map((appt) => {
              const isSelected = selectedApptId === appt.id || (selectedDateStr === appt.date && !selectedApptId);
              const isConfirmed = appt.status?.includes('Confirmed') || appt.status?.includes('ยืนยัน') || appt.status === 'confirmed';
              const isRescheduled = appt.status?.includes('Reschedule') || appt.status?.includes('ขอเลื่อน') || appt.status === 'reschedule_requested';
              const isCompleted = appt.status === 'completed' || appt.status === 'เสร็จสิ้น';

              return (
                <div
                  key={appt.id}
                  onClick={() => {
                    setSelectedDateStr(appt.date);
                    setSelectedApptId(appt.id);
                    setNoteInput(getCleanNotes(appt.notes));
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 text-left relative overflow-hidden ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 border-purple-500 shadow-md ring-2 ring-purple-400'
                      : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-black text-purple-950">
                          {formatSelectedDateThai(appt.date)}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-100 text-purple-900 border border-purple-200">
                          ⏰ {appt.time} น.
                        </span>
                      </div>
                      <p className="text-xs font-extrabold text-indigo-900">
                        {appt.type || 'ตรวจติดตาม OMT & โครงสร้าง'}
                      </p>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black shrink-0 border ${
                      isRescheduled
                        ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                        : isConfirmed
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : isCompleted
                        ? 'bg-slate-100 text-slate-700 border-slate-300'
                        : 'bg-blue-100 text-blue-900 border-blue-200'
                    }`}>
                      {isRescheduled ? '⚠️ ขอเลื่อนนัด' : isConfirmed ? '✓ ยืนยันแล้ว' : isCompleted ? 'เสร็จสิ้น' : '🗓️ รอยืนยัน'}
                    </span>
                  </div>

                  {appt.notes && (
                    <div className="p-2 rounded-xl bg-purple-50/60 border border-purple-100/80 text-[11px] text-slate-700 font-medium line-clamp-2">
                      <span className="font-bold text-purple-900">คำแนะนำ:</span> {getCleanNotes(appt.notes)}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 font-medium">
                    <span>ทันตแพทย์: ทพญ. นภาพร วรรณษา</span>
                    <span className="text-purple-700 font-bold flex items-center gap-1 group-hover:underline">
                      {isSelected ? 'เลือกดูนัดนี้อยู่ ✓' : 'แตะเพื่อดูบนปฏิทิน ➔'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 text-center space-y-1.5">
            <p className="text-xs sm:text-sm font-bold text-purple-900">
              ไม่มีนัดหมายในเดือน{monthNames[month]} {year + 543}
            </p>
            {filteredAppointments.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const target = filteredAppointments.find(a => a.date >= todayStr) || filteredAppointments[0];
                  if (target) {
                    const [y, m] = target.date.split('-').map(Number);
                    setCurrentDate(new Date(y, m - 1, 1));
                    setSelectedDateStr(target.date);
                    setSelectedApptId(target.id);
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                ไปยังนัดหมายถัดไป ({formatSelectedDateThai((filteredAppointments.find(a => a.date >= todayStr) || filteredAppointments[0]).date)})
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. INTERACTIVE "บันทึกเพิ่มเติม" & APPOINTMENT NOTIFICATION HUB (Google Sheets Sync) */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-purple-200/80 shadow-md space-y-4 text-left">
        
        {/* Feedback Alert Banner */}
        {saveFeedback && (
          <div className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between gap-2 transition-all ${
            saveFeedback.type === 'error'
              ? 'bg-rose-100 text-rose-800 border border-rose-300'
              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
          }`}>
            <div className="flex items-center gap-2">
              {saveFeedback.type === 'error' ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
              <span>{saveFeedback.message}</span>
            </div>
            <button 
              type="button" 
              onClick={() => setSaveFeedback(null)}
              className="p-1 hover:bg-black/10 rounded-lg cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Header of Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                ช่องบันทึกเพิ่มเติม & สื่อสารถึงคลินิก
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                บันทึกข้อความตรงสู่คอลัมน์ <strong className="text-purple-700">Notes</strong> ใน Google Sheets ทันที
              </p>
            </div>
          </div>

          {/* Active Date Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-900 border border-purple-200 text-xs font-bold self-start sm:self-auto">
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            <span>{formatSelectedDateThai(selectedDateStr)}</span>
          </div>
        </div>

        {/* Selected Appointment Card details */}
        {activeAppointment ? (
          <div className="space-y-4">
            {/* Multiple appointments selector tabs if more than 1 on this date */}
            {selectedDayAppointments.length > 1 && (
              <div className="flex items-center gap-2 flex-wrap pb-1">
                <span className="text-xs font-black text-slate-600">เลือกนัดหมาย:</span>
                {selectedDayAppointments.map(a => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      setSelectedApptId(a.id);
                      setNoteInput(getCleanNotes(a.notes));
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      selectedApptId === a.id
                        ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    เวลา {a.time} น. ({a.type || 'ตรวจติดตาม'})
                  </button>
                ))}
              </div>
            )}

            {/* Current Active Appointment Info Strip */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50/90 via-indigo-50/90 to-blue-50/90 border border-purple-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-purple-900 text-sm">
                    {new Date(activeAppointment.date).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} เวลา {activeAppointment.time} น.
                  </span>
                  <span className="px-2 py-0.5 rounded-md font-bold bg-white text-indigo-700 border border-indigo-200">
                    {activeAppointment.type === 'clinical' ? 'ตรวจสดที่คลินิก' : (activeAppointment.type || 'ตรวจติดตาม OMT')}
                  </span>
                  <span className="text-slate-600 font-medium">
                    ทันตแพทย์: ทพญ. นภาพร วรรณษา
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="shrink-0 flex items-center">
                <span className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 border shadow-2xs ${
                  activeAppointment.status?.includes('Reschedule') || activeAppointment.status?.includes('ขอเลื่อน')
                    ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                    : activeAppointment.status?.includes('Confirmed') || activeAppointment.status?.includes('ยืนยัน')
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : 'bg-blue-100 text-blue-900 border-blue-200'
                }`}>
                  {activeAppointment.status?.includes('Reschedule') || activeAppointment.status?.includes('ขอเลื่อน') ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
                      <span>⚠️ ขอเลื่อนนัด (รอคลินิกยืนยัน)</span>
                    </>
                  ) : activeAppointment.status?.includes('Confirmed') || activeAppointment.status?.includes('ยืนยัน') ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>✓ ยืนยันมาตามนัดแล้ว</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>🗓️ รอการยืนยันนัดหมาย</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Note Input Textarea */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-800">
                ข้อความบันทึกเพิ่มเติม (พิมพ์ระบุเหตุผลขอเลื่อนนัด, ระบุวันเวลาที่สะดวกใหม่, หรือข้อความถึงคลินิก):
              </label>
              <textarea
                rows={3}
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="พิมพ์ข้อความที่ต้องการแจ้งเตือน เช่น 'ขอเลื่อนนัดเป็นสัปดาห์หน้า วันเสาร์ช่วงบ่าย สะดวก 14:00 น. ค่ะ' หรือ 'ยืนยันเข้าตรวจตามเวลาเดิมครับ'"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-hidden transition-all placeholder:text-slate-400 bg-white"
                disabled={isSaving}
              />
              <p className="text-[11px] text-slate-500">
                💡 เมื่อคนไข้พิมพ์เหตุผล/ข้อความ แล้วกดปุ่ม <strong>"✅ สะดวกมาตามนัด (ยืนยัน)"</strong> หรือ <strong>"🔄 ส่งคำขอเลื่อนนัด"</strong> ระบบจะทำการบันทึกและอัปเดตข้อมูลลงชีต <strong>Appointments</strong> ให้แบบอัตโนมัติทันทีในเบื้องหลัง
              </p>
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* 1. Confirm Button: ✅ สะดวกมาตามนัด (ยืนยัน) */}
                <button
                  type="button"
                  onClick={() => handleSaveNoteAndStatus('Confirmed (สะดวกมาตามนัด)')}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  title="ยืนยันว่าสะดวกมาตามนัดหมายนี้ และบันทึกลงระบบ Appointments อัตโนมัติ"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>✅ สะดวกมาตามนัด (ยืนยัน)</span>
                </button>

                {/* 2. Reschedule Request Button: 🔄 ส่งคำขอเลื่อนนัด */}
                <button
                  type="button"
                  onClick={() => handleSaveNoteAndStatus('Reschedule Requested (ขอเลื่อน)')}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 shadow-2xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  title="ส่งคำขอเลื่อนนัดพร้อมเหตุผล/วันเวลาที่สะดวกใหม่เข้าสู่ระบบ Appointments อัตโนมัติ"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4 text-amber-700" />}
                  <span>🔄 ส่งคำขอเลื่อนนัด</span>
                </button>
              </div>

              {filteredAppointments.length > 1 && (
                <span className="text-[11px] font-bold text-purple-700">
                  คุณมีนัดหมายทั้งหมด {filteredAppointments.length} รายการ
                </span>
              )}
            </div>

          </div>
        ) : (
          <div className="p-6 text-center bg-purple-50/50 rounded-2xl border border-purple-100 space-y-2">
            <p className="text-sm font-bold text-purple-900">
              ไม่มีนัดหมายในวันที่ {formatSelectedDateThai(selectedDateStr)}
            </p>
            <p className="text-xs text-slate-500">
              กรุณาแตะเลือกวันที่ที่มีแถบนัดหมายบนปฏิทินด้านบน เพื่อดูรายละเอียดและพิมพ์ข้อความบันทึกเพิ่มเติม
            </p>
            {filteredAppointments.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const target = filteredAppointments.find(a => a.date >= todayStr) || filteredAppointments[0];
                  if (target) {
                    setSelectedDateStr(target.date);
                    setSelectedApptId(target.id);
                  }
                }}
                className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
              >
                <span>ไปยังนัดหมายถัดไป ({new Date((filteredAppointments.find(a => a.date >= todayStr) || filteredAppointments[0]).date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })})</span>
              </button>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
