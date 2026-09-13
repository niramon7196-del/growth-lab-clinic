import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  CheckCircle2, 
  Sparkles,
  ExternalLink,
  Download,
  CalendarCheck,
  FileText,
  Info,
  CalendarClock,
  AlertTriangle,
  Send,
  Loader2,
  X,
  Phone,
  MessageSquare,
  Check,
  Trash2
} from 'lucide-react';
import { Appointment, Patient } from '../types';
import { getCleanPatientDisplayName, getCleanNotes, formatDisplayTime } from './AppointmentsList';
import { getGoogleCalendarWebUrl, downloadAppointmentIcs } from '../utils/calendarExport';
import { syncAppointmentToGoogleSheets, getWebhookUrl } from '../services/googleAppsScriptService';
import { playSuccessChime } from '../utils/audioUtils';
import { dataAdapter } from '../services/dataAdapter';
import { formatThaiDate } from '../utils/checkInCalculations';

interface InteractiveCalendarProps {
  appointments: Appointment[];
  patients: Patient[];
  onDateClick: (dateStr: string) => void;
  onEventClick?: (appointment: Appointment) => void;
  onUpdateAppointmentStatus?: (id: string, status: any, notes?: string) => void;
  onUpdateAppointment?: (appointment: Appointment) => void;
  onDeleteAppointment?: (id: string) => void;
}

export default function InteractiveCalendar({ 
  appointments, 
  patients, 
  onDateClick, 
  onEventClick,
  onUpdateAppointmentStatus,
  onUpdateAppointment,
  onDeleteAppointment
}: InteractiveCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Format today's YYYY-MM-DD
  const formatYmd = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = formatYmd(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  // Clinic Approval & Management Modal State
  const [selectedApptForApproval, setSelectedApptForApproval] = useState<Appointment | null>(null);
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [newApptDate, setNewApptDate] = useState<string>('');
  const [newApptTime, setNewApptTime] = useState<string>('10:00');
  const [clinicReplyNotes, setClinicReplyNotes] = useState<string>('');
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [approvalFeedback, setApprovalFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Synchronize modal fields whenever an appointment is selected
  useEffect(() => {
    if (selectedApptForApproval) {
      setNewApptDate(selectedApptForApproval.date || todayStr);
      setNewApptTime(formatDisplayTime(selectedApptForApproval.time) || '10:00');
      setClinicReplyNotes(getCleanNotes(selectedApptForApproval.notes));
      setShowRescheduleForm(false);
      setApprovalFeedback(null);
    }
  }, [selectedApptForApproval, todayStr]);

  // Handler ก: "✅ ยืนยันนัดหมาย"
  const handleClinicConfirm = async (appt: Appointment) => {
    if (!appt || isSubmittingApproval) return;
    setIsSubmittingApproval(true);
    setApprovalFeedback(null);
    try {
      const targetStatus = 'Confirmed (คลินิกยืนยันแล้ว)';
      const updatedAppt: Appointment = {
        ...appt,
        status: targetStatus
      };

      // 1. Google Sheets sync via 9-column standard
      await syncAppointmentToGoogleSheets(getWebhookUrl(), updatedAppt);

      // 2. Call parent callbacks
      if (onUpdateAppointmentStatus) {
        onUpdateAppointmentStatus(appt.id, targetStatus, appt.notes);
      }
      if (onUpdateAppointment) {
        onUpdateAppointment(updatedAppt);
      }

      // 3. Local state / dataAdapter fallback
      dataAdapter.saveAppointments([updatedAppt], updatedAppt).catch(e => console.warn(e));

      playSuccessChime();
      setApprovalFeedback({
        message: '✓ ยืนยันนัดหมายเรียบร้อยแล้ว สถานะถูกอัปเดตเป็น "Confirmed (คลินิกยืนยันแล้ว)" ใน Google Sheets ทันที',
        type: 'success'
      });
      setSelectedApptForApproval(prev => prev && prev.id === appt.id ? { ...prev, status: targetStatus } : prev);
    } catch (err) {
      console.warn('[InteractiveCalendar] Confirm appointment error:', err);
      setApprovalFeedback({
        message: '✓ ยืนยันนัดหมายเรียบร้อยแล้ว',
        type: 'success'
      });
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  // Handler ข: "📅 เลื่อนนัด / เปลี่ยนเวลา"
  const handleClinicReschedule = async () => {
    if (!selectedApptForApproval || isSubmittingApproval) return;
    if (!newApptDate) {
      alert('กรุณาเลือกวันนัดหมายใหม่');
      return;
    }

    // Check duplicate booking: same patient on the same date and time
    const targetTime = newApptTime || '10:00';
    const isDuplicate = appointments.some(a => {
      if (a.id === selectedApptForApproval.id || a.status === 'cancelled') return false;
      const samePatient = a.patientId === selectedApptForApproval.patientId || 
        (selectedApptForApproval.hn && a.hn && a.hn.toLowerCase() === selectedApptForApproval.hn.toLowerCase());
      return samePatient && a.date === newApptDate && a.time === targetTime;
    });

    if (isDuplicate) {
      window.alert("ช่วงเวลานี้มีนัดหมายอยู่แล้ว กรุณาเลือกวันหรือเวลาอื่น");
      return;
    }

    setIsSubmittingApproval(true);
    setApprovalFeedback(null);
    try {
      const targetStatus = 'Confirmed (คลินิกยืนยันแล้ว)';
      const updatedNotes = clinicReplyNotes.trim();
      const updatedAppt: Appointment = {
        ...selectedApptForApproval,
        date: newApptDate,
        time: targetTime,
        status: targetStatus,
        notes: updatedNotes || selectedApptForApproval.notes
      };

      // 1. Google Sheets sync via 9-column standard
      await syncAppointmentToGoogleSheets(getWebhookUrl(), updatedAppt);

      // 2. Call parent callbacks
      if (onUpdateAppointmentStatus) {
        onUpdateAppointmentStatus(selectedApptForApproval.id, targetStatus, updatedNotes);
      }
      if (onUpdateAppointment) {
        onUpdateAppointment(updatedAppt);
      }

      // 3. Local persistence fallback
      dataAdapter.saveAppointments([updatedAppt], updatedAppt).catch(e => console.warn(e));

      playSuccessChime();
      setApprovalFeedback({
        message: `✓ เลื่อนวันเวลานัดใหม่เป็นวันที่ ${newApptDate} เวลา ${newApptTime} น. และบันทึกสถานะ "Confirmed (คลินิกยืนยันแล้ว)" ลง Google Sheets เรียบร้อยแล้ว`,
        type: 'success'
      });
      setSelectedApptForApproval(updatedAppt);
      setShowRescheduleForm(false);
      setSelectedDateStr(newApptDate);
    } catch (err) {
      console.warn('[InteractiveCalendar] Reschedule appointment error:', err);
      setApprovalFeedback({
        message: '✓ บันทึกการเลื่อนนัดหมายใหม่เรียบร้อยแล้ว',
        type: 'success'
      });
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  // Pending Reschedule Requests Alert List
  const pendingReschedules = useMemo(() => {
    return appointments.filter(a => 
      (a.status?.includes('Reschedule') || a.status?.includes('ขอเลื่อน') || a.status === 'reschedule_requested') &&
      a.status !== 'cancelled'
    );
  }, [appointments]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

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

  // Build calendar days for 7 columns x 5 rows = 35 cells
  const days: (Date | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }
  // Pad up to 35 cells
  while (days.length < 35) {
    days.push(null);
  }

  const isToday = (date: Date) => formatYmd(date) === todayStr;

  const getAppointmentsForDate = (date: Date | string) => {
    let targetYear: number;
    let targetMonth: number; // 1-12
    let targetDay: number; // 1-31

    if (date instanceof Date) {
      targetYear = date.getFullYear();
      targetMonth = date.getMonth() + 1;
      targetDay = date.getDate();
    } else {
      let clean = (date || '').trim();
      if (clean.includes('T')) clean = clean.split('T')[0];
      const parts = clean.split('-');
      if (parts.length === 3) {
        let pY = parseInt(parts[0], 10);
        if (pY > 2400) pY -= 543;
        targetYear = pY;
        targetMonth = parseInt(parts[1], 10);
        targetDay = parseInt(parts[2], 10);
      } else {
        const dObj = new Date(date);
        targetYear = dObj.getFullYear();
        targetMonth = dObj.getMonth() + 1;
        targetDay = dObj.getDate();
      }
    }

    return appointments
      .filter(a => {
        if (!a || !a.date) return false;
        // Keep active appointments visible on Calendar unless permanently deleted from Google Sheets
        if (a.status === 'cancelled' || a.status === 'ยกเลิก') return false;

        let clean = (a.date || '').trim();
        if (clean.includes('T')) clean = clean.split('T')[0];
        
        let aYear = 0;
        let aMonth = 0;
        let aDay = 0;

        if (clean.includes('/')) {
          const slashParts = clean.split('/');
          if (slashParts.length === 3) {
            if (slashParts[2].length === 4) {
              aDay = parseInt(slashParts[0], 10);
              aMonth = parseInt(slashParts[1], 10);
              aYear = parseInt(slashParts[2], 10);
            } else {
              aYear = parseInt(slashParts[0], 10);
              aMonth = parseInt(slashParts[1], 10);
              aDay = parseInt(slashParts[2], 10);
            }
          }
        } else {
          const parts = clean.split('-');
          if (parts.length === 3) {
            aYear = parseInt(parts[0], 10);
            aMonth = parseInt(parts[1], 10);
            aDay = parseInt(parts[2], 10);
          }
        }

        if (aYear > 2400) aYear -= 543;

        // Match the calendar cell purely by the parseInt(day) and month/year match
        return aDay === targetDay && aMonth === targetMonth && aYear === targetYear;
      })
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  };

  // Appointments for the selected day
  const selectedDayAppointments = getAppointmentsForDate(selectedDateStr);

  // Selected date object
  const getSelectedDateObj = () => {
    try {
      const clean = (selectedDateStr || '').includes('T') ? selectedDateStr.split('T')[0] : selectedDateStr;
      const parts = clean.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
    } catch {
      // fallback
    }
    return new Date();
  };
  const selectedDateObj = getSelectedDateObj();

  // Format selected date in full Thai
  const formatSelectedDateThai = (dateStr: string) => {
    return formatThaiDate(dateStr, { showWeekday: true, longMonth: true, showYear: true });
  };

  // Total appointments in current visible month
  const monthAppointmentsCount = appointments.filter(a => {
    if (!a || !a.date || a.status === 'cancelled' || a.status === 'ยกเลิก') return false;
    let clean = (a.date || '').trim();
    if (clean.includes('T')) clean = clean.split('T')[0];
    const parts = clean.split('-');
    if (parts.length >= 2) {
      let aY = parseInt(parts[0], 10);
      if (aY > 2400) aY -= 543;
      const aM = parseInt(parts[1], 10);
      return aY === year && aM === month + 1;
    }
    return false;
  }).length;

  return (
    <div className="space-y-6 text-left w-full max-w-full overflow-x-hidden box-border">
      
      {/* 1. Control & Month Navigation Bar */}
      <div className="bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-purple-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                ตารางนัดหมายผู้รับการดูแล
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-900 border border-purple-200">
                {monthAppointmentsCount} นัดหมายในเดือนนี้
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              คลิกเลือกช่องวันที่ในปฏิทินเพื่อดูคิวนัด หรือแตะปุ่ม +เพื่อนัดหมายใหม่
            </p>
          </div>
        </div>

        {/* Month controls & Add button */}
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

          <button
            type="button"
            onClick={() => onDateClick(selectedDateStr)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 shadow-sm shadow-indigo-500/25 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ นัดหมายใหม่</span>
          </button>
        </div>
      </div>

      {/* Pending Reschedule Requests Alert Banner (Clinic Warning) */}
      {pendingReschedules.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-3.5 sm:p-4 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-amber-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/25 border border-white/30">
                  แจ้งเตือนด่วน ({pendingReschedules.length} รายการ)
                </span>
                <span className="text-xs sm:text-sm font-black text-amber-50">
                  คนไข้ส่งคำขอเลื่อนนัดหมาย (รอคลินิกอนุมัติ / เปลี่ยนวันเวลา)
                </span>
              </div>
              <p className="text-[11px] text-white/95 font-medium mt-1">
                รายชื่อคนไข้: {pendingReschedules.map(a => `${getCleanPatientDisplayName(a.patientName)} (${formatThaiDate(a.date)})`).join(' • ')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const first = pendingReschedules[0];
              if (first) {
                if (first.date) setSelectedDateStr(first.date);
                setSelectedApptForApproval(first);
              }
            }}
            className="px-4 py-2 bg-white text-amber-950 hover:bg-amber-50 text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer self-end sm:self-auto shrink-0 group hover:shadow-md"
          >
            <span>จัดการและอนุมัตินัดหมาย</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>
      )}

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
          <button
            type="button"
            onClick={() => onDateClick(selectedDateStr)}
            className="absolute rounded-full cursor-pointer hover:ring-2 hover:ring-pink-400 hover:bg-white/10 transition-all flex items-center justify-center group"
            style={{
              top: '9.0%',
              left: '23.3%',
              width: '26.5%',
              height: '6.8%'
            }}
            title="คลิกเพื่อดูคิวนัดตรวจ หรือสร้างการนัดหมาย"
          >
            <span className="sr-only">ดูวันนัดตรวจ / เลื่อนนัด</span>
          </button>

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
              const rescheduleAppt = dayAppts.find(a => 
                a.status?.includes('Reschedule') || a.status?.includes('ขอเลื่อน') || a.status === 'reschedule_requested'
              );
              const hasRescheduleRequest = !!rescheduleAppt;
              
              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => {
                    setSelectedDateStr(dateStr);
                    if (rescheduleAppt) {
                      setSelectedApptForApproval(rescheduleAppt);
                    }
                  }}
                  onDoubleClick={() => onDateClick(dateStr)}
                  className={`w-full h-full text-left relative transition-all group cursor-pointer outline-none select-none rounded-xl p-1 sm:p-1.5 flex flex-col justify-between ${
                    hasRescheduleRequest
                      ? 'ring-2 sm:ring-3 ring-amber-500 bg-amber-400/25 shadow-md border border-amber-500'
                      : isSelected 
                      ? 'ring-2 sm:ring-3 ring-purple-600 ring-inset bg-purple-500/15 shadow-sm' 
                      : 'hover:bg-purple-500/10 hover:ring-1 hover:ring-purple-300/60'
                  }`}
                  title={`วันที่ ${date.getDate()} ${monthNames[month]} ${year + 543}${hasAppts ? ` (${dayAppts.length} นัดหมาย)` : ''}${hasRescheduleRequest ? ' ⚠️ มีคำขอเลื่อนนัดจากคนไข้ (คลิกเพื่อจัดการ)' : ''} - คลิกเพื่อเลือก / ดับเบิลคลิกเพื่อเพิ่มนัด`}
                >
                  {/* Top row of cell: Date number & Appointment indicator badge */}
                  <div className="flex items-center justify-between w-full">
                    {/* Date number in top-left (fitted right inside the lavender square of artwork) */}
                    <span 
                      className={`inline-flex items-center justify-center font-black font-mono transition-all rounded-md leading-none ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-xs text-[11px] sm:text-xs md:text-sm lg:text-base px-1 sm:px-1.5 py-0.5 ring-2 ring-white'
                          : hasRescheduleRequest
                          ? 'bg-amber-600 text-white text-[10px] sm:text-xs md:text-sm px-1 py-0.5 shadow-2xs font-black'
                          : isCurrentDay
                          ? 'bg-indigo-600 text-white text-[10px] sm:text-xs md:text-sm px-1 py-0.5 shadow-2xs font-black'
                          : 'text-purple-950 text-[10px] sm:text-xs md:text-sm lg:text-base font-black group-hover:text-purple-700'
                      }`}
                    >
                      {date.getDate()}
                    </span>

                    {/* Reschedule warning indicator badge or appointment count badge */}
                    {hasRescheduleRequest ? (
                      <span 
                        className="inline-flex items-center gap-0.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[8px] sm:text-[9px] font-black px-1 sm:px-1.5 py-0.5 rounded-full shadow-xs animate-bounce"
                        title="มีคำขอเลื่อนนัดจากคนไข้"
                      >
                        <span>⚠️</span>
                        <span className="hidden md:inline">ขอเลื่อน</span>
                      </span>
                    ) : hasAppts ? (
                      <span 
                        className="inline-flex items-center justify-center bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[8px] sm:text-[9px] md:text-[10px] font-black px-1 sm:px-1.5 py-0.5 rounded-full shadow-2xs animate-pulse"
                        title={`มี ${dayAppts.length} นัดหมาย`}
                      >
                        {dayAppts.length}
                      </span>
                    ) : null}
                  </div>

                  {/* Event pills inside cell (Visible on tablet & desktop) */}
                  <div className="hidden sm:flex flex-col gap-0.5 w-full mt-auto overflow-hidden">
                    {dayAppts.slice(0, 2).map((appt) => {
                      const isRescheduleRequested = appt.status?.includes('Reschedule') || appt.status?.includes('ขอเลื่อน') || appt.status === 'reschedule_requested';
                      const isConfirmed = appt.status?.includes('Confirmed') || appt.status?.includes('ยืนยัน') || appt.status === 'confirmed';
                      const isCompleted = appt.status === 'completed' || appt.status === 'เสร็จสิ้น';
                      return (
                        <div
                          key={appt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDateStr(dateStr);
                            setSelectedApptForApproval(appt);
                            if (onEventClick) onEventClick(appt);
                          }}
                          className={`text-[8px] md:text-[9px] font-bold px-1 py-0.5 rounded leading-tight truncate shadow-2xs flex items-center gap-0.5 border cursor-pointer hover:scale-105 transition-transform ${
                            isRescheduleRequested
                              ? 'bg-amber-500 text-white border-amber-600 animate-pulse font-black shadow-xs'
                              : isConfirmed
                              ? 'bg-sky-600 text-white border-sky-700'
                              : isCompleted
                              ? 'bg-emerald-500 text-white border-emerald-600'
                              : 'bg-purple-600/95 text-white border-purple-700'
                          }`}
                          title={isRescheduleRequested ? `⚠️ คนไข้แจ้งขอเลื่อนนัด (คลิกเพื่อจัดการ): ${appt.patientName}` : undefined}
                        >
                          {isRescheduleRequested && <span className="text-[8px] shrink-0">⚠️</span>}
                          {isConfirmed && <span className="text-[8px] shrink-0">✓</span>}
                          <span className="font-mono text-[7px] md:text-[8px] shrink-0 opacity-90">{formatDisplayTime(appt.time)}</span>
                          <span className="truncate">{getCleanPatientDisplayName(appt.patientName)}</span>
                        </div>
                      );
                    })}
                    {dayAppts.length > 2 && (
                      <span className="text-[7px] md:text-[8px] font-extrabold text-purple-800 bg-purple-100/90 rounded px-1 text-center truncate">
                        +{dayAppts.length - 2} เพิ่มเติม
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* OVERLAY 4: Bottom "บันทึกเพิ่มเติม" Banner Summary */}
          <div 
            onClick={() => {
              const rescheduleAppt = selectedDayAppointments.find(a => 
                a.status?.includes('Reschedule') || a.status?.includes('ขอเลื่อน') || a.status === 'reschedule_requested'
              );
              if (rescheduleAppt) {
                setSelectedApptForApproval(rescheduleAppt);
              } else if (selectedDayAppointments.length > 0) {
                setSelectedApptForApproval(selectedDayAppointments[0]);
              } else {
                onDateClick(selectedDateStr);
              }
            }}
            className="absolute flex flex-col justify-center px-3 sm:px-4 text-left overflow-hidden cursor-pointer hover:bg-purple-50/40 rounded-xl transition-colors group"
            style={{
              top: '84.5%',
              left: '10.0%',
              width: '83.0%',
              height: '14.0%'
            }}
            title="คลิกเพื่อจัดการคิวนัดหมายของวันนี้ หรืออนุมัตินัดหมาย"
          >
            <div className="flex items-center gap-1.5 leading-tight flex-wrap">
              <span className="text-[10px] sm:text-xs md:text-sm font-black text-purple-950 shrink-0">
                นัดหมายวันที่ {selectedDateObj.getDate()} {monthNames[selectedDateObj.getMonth()]} {toThaiNumeral(selectedDateObj.getFullYear() + 543)}:
              </span>
              {selectedDayAppointments.some(a => a.status?.includes('Reschedule') || a.status?.includes('ขอเลื่อน') || a.status === 'reschedule_requested') && (
                <span className="px-2 py-0.5 rounded bg-amber-500 text-white text-[10px] font-black animate-pulse flex items-center gap-1">
                  <span>⚠️</span>
                  <span>มีคำขอเลื่อนนัด (แตะเพื่อเปิดจัดการ)</span>
                </span>
              )}
              {selectedDayAppointments.length > 0 ? (
                <span className="text-[10px] sm:text-xs md:text-sm font-extrabold text-purple-800 truncate">
                  {selectedDayAppointments.map((a, idx) => (
                    <span key={a.id}>
                      {idx > 0 && ' | '}
                      เวลา {formatDisplayTime(a.time)} น. คุณ{getCleanPatientDisplayName(a.patientName)} ({a.type || 'ตรวจติดตาม'})
                    </span>
                  ))}
                </span>
              ) : (
                <span className="text-[10px] sm:text-xs md:text-sm font-semibold text-slate-600 italic group-hover:text-purple-700">
                  ไม่มีคิวนัดหมายในวันนี้ (แตะเพื่อเพิ่มนัดหมายใหม่ +)
                </span>
              )}
            </div>
            {selectedDayAppointments.length > 0 && selectedDayAppointments[0]?.notes && (
              <p className="hidden sm:block text-[9px] md:text-[11px] text-slate-600 truncate mt-0.5">
                หมายเหตุ: "{getCleanNotes(selectedDayAppointments[0].notes)}"
              </p>
            )}
          </div>

        </div>
      </div>

      {/* 3. Detailed Day Schedule Cards (Interactive Day Hub Below Calendar) */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-purple-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/10 text-purple-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  {formatSelectedDateThai(selectedDateStr)}
                </h3>
                {selectedDateStr === todayStr && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                    วันนี้
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {selectedDayAppointments.length > 0 
                  ? `พบรายการนัดหมายทั้งหมด ${selectedDayAppointments.length} รายการ` 
                  : 'ไม่มีรายการนัดหมายในวันที่เลือก'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onDateClick(selectedDateStr)}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 shadow-md shadow-indigo-500/25 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ เพิ่มนัดหมายสำหรับวันนี้</span>
          </button>
        </div>

        {/* Cards for Selected Day */}
        {selectedDayAppointments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {selectedDayAppointments.map(appt => {
              const patient = patients.find(p => p.id === appt.patientId);
              const cleanPatientName = getCleanPatientDisplayName(appt.patientName);
              const cleanNotes = getCleanNotes(appt.notes);
              const isRescheduleRequested = appt.status?.includes('Reschedule') || appt.status?.includes('ขอเลื่อน') || appt.status === 'reschedule_requested';
              const isConfirmed = appt.status?.includes('Confirmed') || appt.status?.includes('ยืนยัน') || appt.status === 'confirmed';
              const isCompleted = appt.status === 'completed' || appt.status === 'เสร็จสิ้น';

              return (
                <div 
                  key={appt.id}
                  onClick={() => onEventClick && onEventClick(appt)}
                  className={`bg-white/95 backdrop-blur-md rounded-2xl p-4 border transition-all flex flex-col justify-between gap-3 group cursor-pointer ${
                    isRescheduleRequested
                      ? 'border-amber-400 bg-amber-50/40 ring-2 ring-amber-300/60 shadow-md'
                      : isConfirmed
                      ? 'border-sky-300/80 bg-sky-50/20 shadow-xs'
                      : 'border-indigo-100/90 shadow-sm hover:shadow-md hover:border-purple-300'
                  }`}
                >
                  <div>
                    {/* Top Row: Time Badge & Status Capsule */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-900 font-mono font-bold text-xs">
                        <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>{formatDisplayTime(appt.time)} น.</span>
                      </div>
                      
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${
                        isRescheduleRequested
                          ? 'bg-amber-100 text-amber-900 border border-amber-300 ring-1 ring-amber-400'
                          : isConfirmed
                          ? 'bg-sky-100 text-sky-800 border border-sky-200'
                          : isCompleted 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                          : 'bg-purple-50 text-purple-800 border border-purple-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          isRescheduleRequested 
                            ? 'bg-amber-500 animate-ping' 
                            : isConfirmed
                            ? 'bg-sky-500'
                            : isCompleted 
                            ? 'bg-emerald-500' 
                            : 'bg-purple-500 animate-pulse'
                        }`} />
                        <span>
                          {isRescheduleRequested 
                            ? '⚠️ คนไข้แจ้งขอเลื่อนนัด (Reschedule Requested)' 
                            : isConfirmed
                            ? '✓ ยืนยันมาตามนัด (Confirmed)'
                            : isCompleted 
                            ? 'ตรวจแล้ว (Completed)' 
                            : 'รอติดตาม (Pending)'}
                        </span>
                      </span>
                    </div>

                    {/* Middle: Patient & Doctor Info */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-100 to-indigo-100 text-purple-700 flex items-center justify-center font-bold text-sm shrink-0 border border-purple-200/60 shadow-2xs">
                        {cleanPatientName.charAt(0) || 'ผ'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-black text-slate-900 text-sm group-hover:text-purple-700 transition-colors truncate">
                            {cleanPatientName}
                          </h4>
                          {patient?.hn && (
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {patient.hn}
                            </span>
                          )}
                        </div>

                        {/* Appointment Type Badge */}
                        <div className="mt-1">
                          <span className="inline-block text-[11px] font-bold text-indigo-900 bg-indigo-50/80 border border-indigo-200/70 px-2 py-0.5 rounded-md">
                            {appt.type || 'ตรวจติดตาม EF Trainer'}
                          </span>
                        </div>

                        {/* Doctor / Care Provider */}
                        <p className="text-xs text-slate-600 mt-1.5 font-medium flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span>แพทย์/ผู้ดูแล: <strong className="text-slate-800">{appt.dentistName && appt.dentistName.includes('นภาพร') ? 'ทันตแพทย์หญิง นภาพร วรรณษา' : (appt.dentistName || 'ทันตแพทย์หญิง นภาพร วรรณษา')}</strong></span>
                        </p>

                        {cleanNotes && (
                          <div className={`mt-2 p-2.5 rounded-xl border text-xs ${
                            isRescheduleRequested
                              ? 'bg-amber-100/90 border-amber-300 text-amber-950 font-semibold'
                              : 'bg-slate-50 border-slate-100 text-slate-600 italic'
                          }`}>
                            <div className="flex items-center gap-1 text-[10px] font-black uppercase text-amber-800 mb-0.5">
                              {isRescheduleRequested ? (
                                <>
                                  <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                  <span>ข้อความแจ้งขอเลื่อนนัดจากคนไข้:</span>
                                </>
                              ) : (
                                <span>หมายเหตุ:</span>
                              )}
                            </div>
                            <p className="leading-relaxed">"{cleanNotes}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Clinic Action Buttons: Confirm / Reschedule */}
                  <div className="pt-2.5 pb-1 border-t border-slate-100 flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleClinicConfirm(appt)}
                      disabled={isSubmittingApproval}
                      className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
                      title="ยืนยันนัดหมาย และบันทึกลง Google Sheets เป็นสถานะ Confirmed (คลินิกยืนยันแล้ว)"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>✅ ยืนยันนัดหมาย</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedApptForApproval(appt);
                        setShowRescheduleForm(true);
                      }}
                      className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer"
                      title="คลิกเพื่อเลือกวันเวลานัดใหม่ และแจ้งเตือนคนไข้"
                    >
                      <CalendarClock className="w-3.5 h-3.5" />
                      <span>📅 เลื่อนนัด / เปลี่ยนเวลา</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedApptForApproval(appt)}
                      className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200 transition-all cursor-pointer"
                      title="ดูรายละเอียดข้อความและประวัติ"
                    >
                      <span>รายละเอียด</span>
                    </button>
                  </div>

                  {/* Bottom Row: Quick Action Buttons & Calendar export */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ID: {appt.id.slice(-6)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {onDeleteAppointment && (
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (window.confirm("ต้องการยกเลิกนัดหมายนี้ใช่หรือไม่?")) {
                              const appointmentId = (appt as any).appointment_id || appt.id;
                              
                              try {
                                await fetch("https://script.google.com/macros/s/AKfycbyk_1CbD39HQcP8vOXofkPJsYeLOvgklYk608MuK-v4vt4NgUa_Ang73AHpubIO4Pbv/exec", {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "text/plain;charset=utf-8"
                                  },
                                  body: JSON.stringify({
                                    action: "deleteAppointment",
                                    sheetName: "Appointments",
                                    id: appointmentId
                                  })
                                });
                              } catch (err) {
                                console.warn('[InteractiveCalendar] Error sending delete appointment request:', err);
                              }

                              onDeleteAppointment(appt.id);
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                          title="ยกเลิกนัดหมายนี้"
                          aria-label="ยกเลิกนัดหมาย"
                        >
                          <Trash2 className="w-3 h-3 text-rose-600" />
                          <span>ยกเลิกนัด</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const url = getGoogleCalendarWebUrl({
                            id: appt.id,
                            patientName: cleanPatientName,
                            hn: patient?.hn,
                            date: appt.date,
                            time: appt.time,
                            type: appt.type,
                            notes: appt.notes
                          });
                          window.open(url, '_blank');
                        }}
                        className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                        title="เปิดใน Google Calendar"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          downloadAppointmentIcs({
                            id: appt.id,
                            patientName: cleanPatientName,
                            hn: patient?.hn,
                            date: appt.date,
                            time: appt.time,
                            type: appt.type,
                            notes: appt.notes
                          });
                        }}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="ดาวน์โหลดไฟล์ .ics"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-purple-50/40 rounded-2xl p-6 text-center border border-dashed border-purple-200">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-2">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-700">ไม่มีคิวนัดหมายใน {formatSelectedDateThai(selectedDateStr)}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">คุณสามารถคลิกปุ่มด้านล่างเพื่อเพิ่มการนัดหมายสำหรับวันนี้ได้ทันที</p>
            <button
              type="button"
              onClick={() => onDateClick(selectedDateStr)}
              className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>สร้างนัดหมายสำหรับวันนี้</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. CLINIC APPOINTMENT APPROVAL & MANAGEMENT MODAL */}
      {selectedApptForApproval && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => setSelectedApptForApproval(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-purple-200 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-150 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                  <CalendarClock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight">
                    จัดการและอนุมัตินัดหมาย (Clinic Approval)
                  </h3>
                  <p className="text-xs text-purple-200">
                    อัปเดตสถานะและเชื่อมต่อไปยัง Google Sheets ทันที
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedApptForApproval(null)}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              {/* Approval Feedback Banner */}
              {approvalFeedback && (
                <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-start gap-2 border ${
                  approvalFeedback.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
                    : 'bg-rose-50 text-rose-900 border-rose-300'
                }`}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p>{approvalFeedback.message}</p>
                  </div>
                </div>
              )}

              {/* Patient Profile Card */}
              {(() => {
                const modalPatient = patients.find(p => p.id === selectedApptForApproval.patientId);
                const modalPatientName = getCleanPatientDisplayName(selectedApptForApproval.patientName);
                const isReschedule = selectedApptForApproval.status?.includes('Reschedule') || 
                                     selectedApptForApproval.status?.includes('ขอเลื่อน') || 
                                     selectedApptForApproval.status === 'reschedule_requested';

                return (
                  <>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-sm">
                        {modalPatientName.charAt(0) || 'ผ'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base font-black text-slate-900">
                            {modalPatientName}
                          </h4>
                          {modalPatient?.hn && (
                            <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-purple-100 text-purple-900 border border-purple-200">
                              HN: {modalPatient.hn}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <CalendarIcon className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span>วันนัด: <strong className="text-slate-800">{formatThaiDate(selectedApptForApproval.date)}</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span>เวลา: <strong className="text-slate-800">{formatDisplayTime(selectedApptForApproval.time)} น.</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span>ประเภท: <strong className="text-slate-800">{selectedApptForApproval.type || 'ตรวจติดตาม EF Trainer'}</strong></span>
                          </div>
                          {modalPatient?.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>โทร: <strong className="text-slate-800">{modalPatient.phone}</strong></span>
                            </div>
                          )}
                        </div>

                        <div className="mt-2.5 flex items-center gap-2">
                          <span className="text-[11px] text-slate-500 font-bold">สถานะปัจจุบัน:</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            isReschedule
                              ? 'bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-400 animate-pulse'
                              : selectedApptForApproval.status?.includes('Confirmed')
                              ? 'bg-sky-100 text-sky-800 border-sky-300 font-bold'
                              : 'bg-purple-100 text-purple-900 border-purple-300'
                          }`}>
                            {selectedApptForApproval.status || 'รอยืนยัน'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Patient Request / Notes Callout */}
                    <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300">
                      <div className="flex items-center gap-2 text-xs font-black text-amber-900 mb-1.5">
                        <MessageSquare className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>ข้อความและเหตุผลที่คนไข้แจ้งมา (Notes):</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-amber-200 text-xs text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                        {getCleanNotes(selectedApptForApproval.notes) || (
                          <span className="text-slate-400 italic">ไม่ได้ระบุข้อความเพิ่มเติม</span>
                        )}
                      </div>
                    </div>

                    {/* Reschedule / New Date-Time Form (Expands on demand) */}
                    {showRescheduleForm ? (
                      <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                            <CalendarClock className="w-4 h-4 text-purple-600" />
                            <span>กำหนดวันเวลานัดหมายใหม่สำหรับคนไข้</span>
                          </h5>
                          <button
                            type="button"
                            onClick={() => setShowRescheduleForm(false)}
                            className="text-xs text-purple-700 hover:text-purple-900 font-bold"
                          >
                            ยกเลิก
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              วันนัดใหม่ (YYYY-MM-DD):
                            </label>
                            <input 
                              type="date"
                              value={newApptDate}
                              onChange={(e) => setNewApptDate(e.target.value)}
                              className="w-full px-3 py-2 text-xs rounded-xl border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              เวลานัดใหม่:
                            </label>
                            <input 
                              type="time"
                              value={newApptTime}
                              onChange={(e) => setNewApptTime(e.target.value)}
                              className="w-full px-3 py-2 text-xs rounded-xl border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            ข้อความตอบกลับหรือบันทึกของคลินิก (Notes):
                          </label>
                          <textarea
                            rows={2}
                            value={clinicReplyNotes}
                            onChange={(e) => setClinicReplyNotes(e.target.value)}
                            placeholder="ระบุข้อความ เช่น เลื่อนนัดเป็นช่วงบ่ายตามที่คนไข้ขอเรียบร้อยแล้วค่ะ..."
                            className="w-full px-3 py-2 text-xs rounded-xl border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClinicReschedule();
                          }}
                          disabled={isSubmittingApproval}
                          className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer pointer-events-auto relative z-50 disabled:opacity-50"
                        >
                          {isSubmittingApproval ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>กำลังบันทึกและส่งข้อมูลไปยัง Google Sheets...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              <span>บันทึกวันเวลานัดใหม่ & ยืนยันใน Google Sheets</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : null}

                    {/* Action Buttons for Clinic */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                      {/* Button ก: ✅ ยืนยันนัดหมาย */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClinicConfirm(selectedApptForApproval);
                        }}
                        disabled={isSubmittingApproval}
                        className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer pointer-events-auto relative z-50 disabled:opacity-50"
                      >
                        {isSubmittingApproval ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>กำลังส่งไปยัง Google Sheets...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>✅ ยืนยันนัดหมาย (Confirmed)</span>
                          </>
                        )}
                      </button>

                      {/* Button ข: 📅 เลื่อนนัด / เปลี่ยนเวลา */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowRescheduleForm(prev => !prev);
                        }}
                        disabled={isSubmittingApproval}
                        className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer pointer-events-auto relative z-50"
                      >
                        <CalendarClock className="w-4 h-4" />
                        <span>📅 เลื่อนนัด / เปลี่ยนเวลา</span>
                      </button>

                      {/* Button ค: 🗑️ ยกเลิกนัดหมาย */}
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (window.confirm("ต้องการยกเลิกและลบนัดหมายนี้ใช่หรือไม่?")) {
                            const appointmentId = (selectedApptForApproval as any).appointment_id || selectedApptForApproval.id;
                            
                            try {
                              await fetch("https://script.google.com/macros/s/AKfycbyk_1CbD39HQcP8vOXofkPJsYeLOvgklYk608MuK-v4vt4NgUa_Ang73AHpubIO4Pbv/exec", {
                                method: "POST",
                                headers: {
                                  "Content-Type": "text/plain;charset=utf-8"
                                },
                                body: JSON.stringify({
                                  action: "deleteAppointment",
                                  sheetName: "Appointments",
                                  id: appointmentId
                                })
                              });
                            } catch (err) {
                              console.warn('[InteractiveCalendar] Error sending delete appointment request:', err);
                            }

                            if (onDeleteAppointment) {
                              onDeleteAppointment(selectedApptForApproval.id);
                            }
                            setSelectedApptForApproval(null);
                          }
                        }}
                        disabled={isSubmittingApproval}
                        className="w-full sm:w-auto py-3 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer pointer-events-auto relative z-50"
                        title="ยกเลิกนัดหมาย"
                      >
                        <Trash2 className="w-4 h-4 text-rose-600" />
                        <span>ยกเลิกนัด</span>
                      </button>
                    </div>
                  </>
                );
              })()}

            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-purple-600" />
                <span>ซิงค์ตรงกับ Google Sheets ระบบ Growth Lab Real-time</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedApptForApproval(null)}
                className="px-4 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
