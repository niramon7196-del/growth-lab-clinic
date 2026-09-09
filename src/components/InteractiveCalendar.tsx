import React, { useState } from 'react';
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
  Info
} from 'lucide-react';
import { Appointment, Patient } from '../types';
import { getCleanPatientDisplayName, getCleanNotes } from './AppointmentsList';
import { getGoogleCalendarWebUrl, downloadAppointmentIcs } from '../utils/calendarExport';

interface InteractiveCalendarProps {
  appointments: Appointment[];
  patients: Patient[];
  onDateClick: (dateStr: string) => void;
  onEventClick?: (appointment: Appointment) => void;
}

export default function InteractiveCalendar({ 
  appointments, 
  patients, 
  onDateClick, 
  onEventClick 
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
    const dateStr = typeof date === 'string' ? date : formatYmd(date);
    return appointments
      .filter(a => a.date === dateStr && a.status !== 'cancelled')
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  // Appointments for the selected day
  const selectedDayAppointments = getAppointmentsForDate(selectedDateStr);

  // Selected date object
  const getSelectedDateObj = () => {
    try {
      const parts = selectedDateStr.split('-');
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
    } catch {
      // ignore
    }
    return dateStr;
  };

  // Total appointments in current visible month
  const monthAppointmentsCount = appointments.filter(a => {
    if (!a.date || a.status === 'cancelled') return false;
    const parts = a.date.split('-');
    return parts.length >= 2 && parseInt(parts[0], 10) === year && parseInt(parts[1], 10) === month + 1;
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
              
              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => setSelectedDateStr(dateStr)}
                  onDoubleClick={() => onDateClick(dateStr)}
                  className={`w-full h-full text-left relative transition-all group cursor-pointer outline-none select-none rounded-xl p-1 sm:p-1.5 flex flex-col justify-between ${
                    isSelected 
                      ? 'ring-2 sm:ring-3 ring-purple-600 ring-inset bg-purple-500/15 shadow-sm' 
                      : 'hover:bg-purple-500/10 hover:ring-1 hover:ring-purple-300/60'
                  }`}
                  title={`วันที่ ${date.getDate()} ${monthNames[month]} ${year + 543}${hasAppts ? ` (${dayAppts.length} นัดหมาย)` : ''} - คลิกเพื่อเลือก / ดับเบิลคลิกเพื่อเพิ่มนัด`}
                >
                  {/* Top row of cell: Date number & Appointment indicator badge */}
                  <div className="flex items-center justify-between w-full">
                    {/* Date number in top-left (fitted right inside the lavender square of artwork) */}
                    <span 
                      className={`inline-flex items-center justify-center font-black font-mono transition-all rounded-md leading-none ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-xs text-[11px] sm:text-xs md:text-sm lg:text-base px-1 sm:px-1.5 py-0.5 ring-2 ring-white'
                          : isCurrentDay
                          ? 'bg-indigo-600 text-white text-[10px] sm:text-xs md:text-sm px-1 py-0.5 shadow-2xs font-black'
                          : 'text-purple-950 text-[10px] sm:text-xs md:text-sm lg:text-base font-black group-hover:text-purple-700'
                      }`}
                    >
                      {date.getDate()}
                    </span>

                    {/* Appointment count badge */}
                    {hasAppts && (
                      <span 
                        className="inline-flex items-center justify-center bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[8px] sm:text-[9px] md:text-[10px] font-black px-1 sm:px-1.5 py-0.5 rounded-full shadow-2xs animate-pulse"
                        title={`มี ${dayAppts.length} นัดหมาย`}
                      >
                        {dayAppts.length}
                      </span>
                    )}
                  </div>

                  {/* Event pills inside cell (Visible on tablet & desktop) */}
                  <div className="hidden sm:flex flex-col gap-0.5 w-full mt-auto overflow-hidden">
                    {dayAppts.slice(0, 2).map((appt) => {
                      const isCompleted = appt.status === 'completed';
                      return (
                        <div
                          key={appt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDateStr(dateStr);
                            if (onEventClick) onEventClick(appt);
                          }}
                          className={`text-[8px] md:text-[9px] font-bold px-1 py-0.5 rounded leading-tight truncate shadow-2xs flex items-center gap-0.5 border ${
                            isCompleted
                              ? 'bg-emerald-500 text-white border-emerald-600'
                              : 'bg-purple-600/95 text-white border-purple-700'
                          }`}
                        >
                          <span className="font-mono text-[7px] md:text-[8px] shrink-0 opacity-90">{appt.time}</span>
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
            onClick={() => onDateClick(selectedDateStr)}
            className="absolute flex flex-col justify-center px-3 sm:px-4 text-left overflow-hidden cursor-pointer hover:bg-purple-50/40 rounded-xl transition-colors group"
            style={{
              top: '84.5%',
              left: '10.0%',
              width: '83.0%',
              height: '14.0%'
            }}
            title="คลิกเพื่อจัดการคิวนัดหมายของวันนี้"
          >
            <div className="flex items-center gap-1.5 leading-tight flex-wrap">
              <span className="text-[10px] sm:text-xs md:text-sm font-black text-purple-950 shrink-0">
                นัดหมายวันที่ {selectedDateObj.getDate()} {monthNames[selectedDateObj.getMonth()]} {toThaiNumeral(selectedDateObj.getFullYear() + 543)}:
              </span>
              {selectedDayAppointments.length > 0 ? (
                <span className="text-[10px] sm:text-xs md:text-sm font-extrabold text-purple-800 truncate">
                  {selectedDayAppointments.map((a, idx) => (
                    <span key={a.id}>
                      {idx > 0 && ' | '}
                      เวลา {a.time} น. คุณ{getCleanPatientDisplayName(a.patientName)} ({a.type || 'ตรวจติดตาม'})
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
              const isCompleted = appt.status === 'completed';

              return (
                <div 
                  key={appt.id}
                  onClick={() => onEventClick && onEventClick(appt)}
                  className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-indigo-100/90 shadow-sm hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between gap-3 group cursor-pointer"
                >
                  <div>
                    {/* Top Row: Time Badge & Status Capsule */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-900 font-mono font-bold text-xs">
                        <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>{appt.time} น.</span>
                      </div>
                      
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${
                        isCompleted 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                          : 'bg-purple-50 text-purple-800 border border-purple-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-purple-500 animate-pulse'}`} />
                        <span>{isCompleted ? 'ตรวจแล้ว (Completed)' : 'รอติดตาม (Pending)'}</span>
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
                          <span>แพทย์/ผู้ดูแล: <strong className="text-slate-800">{appt.dentistName || 'ทพญ. นภาพร วรรณษา'}</strong></span>
                        </p>

                        {cleanNotes && (
                          <p className="text-[11px] text-slate-500 mt-1 bg-slate-50 p-1.5 rounded-lg border border-slate-100 italic">
                            "{cleanNotes}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: Quick Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ID: {appt.id.slice(-6)}
                    </span>
                    <div className="flex items-center gap-1.5">
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

    </div>
  );
}
