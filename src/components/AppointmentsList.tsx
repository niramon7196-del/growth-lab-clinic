import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Clock, Plus, Trash2, CheckCircle2, XCircle, Search, FileText, Share2, ExternalLink, Loader2, CalendarPlus, Download, AlertCircle, X, Filter } from 'lucide-react';
import { Appointment, Patient } from '../types';
import EmptyState from './ui/EmptyState';
import { useScrollLock } from '../utils';
import { Logo } from './Logo';
import { formatPatientDisplay, deduplicateAppointments } from '../utils/patientUtils';
import { downloadAppointmentIcs, getGoogleCalendarWebUrl, saveLocalCalendarRecord } from '../utils/calendarExport';
import {
  getGoogleCalendarConnectionStatus,
  syncAppointmentToGoogleCalendar,
  deleteOrCancelGoogleCalendarEvent,
  CENTRAL_CALENDAR_EMAIL
} from '../services/googleCalendar';
import InteractiveCalendar from './InteractiveCalendar';
import { playSuccessChime, playAlertTone } from '../utils/audioUtils';
import { syncAppointmentToGoogleSheets, syncDeleteAppointmentToGoogleSheets, getWebhookUrl } from '../services/googleAppsScriptService';
import { formatThaiDate, formatAppointmentTime } from '../utils/checkInCalculations';

export function getCleanPatientDisplayName(name: any): string {
  if (!name) return 'ผู้รับการดูแล';
  if (typeof name === 'object') {
    return name.nickname || name.firstName || name.name || name.patientName || `คนไข้ (${name.hn || 'HN'})`;
  }
  let clean = String(name).trim();
  if (clean.startsWith('{') || clean.startsWith('[')) {
    try {
      const parsed = JSON.parse(clean);
      if (parsed && typeof parsed === 'object') {
        return parsed.nickname || parsed.firstName || parsed.name || parsed.patientName || (parsed.hn ? `คนไข้ (${parsed.hn})` : 'ผู้รับการดูแล');
      }
    } catch {
      return 'ผู้รับการดูแล';
    }
  }
  // Remove trailing homework code, json brackets, long assigned task strings
  clean = clean.replace(/\s*[\(\[\{].*[\)\]\}]/gi, '');
  clean = clean.replace(/hn-?\d+/gi, '');
  return clean.trim() || 'ผู้รับการดูแล';
}

export function getCleanNotes(notes: any): string {
  if (!notes) return '';
  if (typeof notes === 'object') {
    return notes.text || notes.notes || notes.instruction || '';
  }
  const clean = String(notes).trim();
  if (clean.startsWith('{') || clean.startsWith('[')) {
    try {
      const parsed = JSON.parse(clean);
      if (typeof parsed === 'string') return parsed;
      if (parsed && typeof parsed === 'object') {
        return parsed.notes || parsed.text || parsed.instruction || '';
      }
    } catch {
      return clean;
    }
  }
  return clean;
}

export function formatDisplayTime(rawTime: any): string {
  return formatAppointmentTime(rawTime);
}

interface AppointmentsListProps {
  appointments: Appointment[];
  patients: Patient[];
  onAddAppointment: (appointment: Omit<Appointment, 'id' | 'patientName'>) => void;
  onUpdateAppointmentStatus: (id: string, status: any, notes?: string) => void;
  onDeleteAppointment: (id: string) => void;
  onUpdateAppointment?: (appointment: Appointment) => void;
}

export default function AppointmentsList({
  appointments,
  patients,
  onAddAppointment,
  onUpdateAppointmentStatus,
  onDeleteAppointment,
  onUpdateAppointment,
}: AppointmentsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'upcoming' | 'past' | 'this_month' | 'custom'>('all');
  const [customDate, setCustomDate] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [apptToDelete, setApptToDelete] = useState<Appointment | null>(null);
  const [syncWithGoogleCalendar, setSyncWithGoogleCalendar] = useState(true);
  const [downloadIcsOnSave, setDownloadIcsOnSave] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Google Calendar Auto-Sync State (Webhook)
  const [calendarStatus] = useState(getGoogleCalendarConnectionStatus());
  const [syncingApptId, setSyncingApptId] = useState<string | null>(null);
  const [isBatchSyncing, setIsBatchSyncing] = useState(false);

  useScrollLock(showAddModal || !!apptToDelete);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAddModal(false);
        setApptToDelete(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Form State
  const [formPatientId, setFormPatientId] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formTime, setFormTime] = useState('10:30');
  const [formType, setFormType] = useState('ตรวจติดตาม EF Trainer');
  const [formDentistName, setFormDentistName] = useState('ทันตแพทย์หญิง นภาพร วรรณษา');
  const [formNotes, setFormNotes] = useState('');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setNotificationMsg({ text, type });
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  // Auto Sync Single Appointment to Google Calendar via Webhook
  const handleSyncSingleAppointment = async (app: Appointment) => {
    setSyncingApptId(app.id);
    try {
      const syncRes = await syncAppointmentToGoogleCalendar(app);
      
      onAddAppointment({
        patientId: app.patientId,
        date: app.date,
        time: app.time,
        type: app.type,
        notes: app.notes,
        status: app.status,
        googleCalendarEventId: syncRes.googleCalendarEventId,
        googleCalendarHtmlLink: syncRes.googleCalendarHtmlLink,
      });

      showToast(`ส่งนัดหมายของ ${app.patientName} ไปยัง Google Calendar (Webhook) เรียบร้อยแล้ว 📅`, 'success');
      if (syncRes.googleCalendarHtmlLink) {
        window.open(syncRes.googleCalendarHtmlLink, '_blank');
      }
    } catch (err: any) {
      console.error('[AppointmentsList] Single Sync error:', err);
      showToast('เกิดข้อผิดพลาดในการซิงก์นัดหมาย กรุณาลองใหม่อีกครั้ง', 'error');
    } finally {
      setSyncingApptId(null);
    }
  };

  // Batch Sync All Pending Appointments to Google Calendar
  const handleSyncAllAppointments = async () => {
    const pendingAppointments = appointments.filter(a => a.status === 'pending');
    if (pendingAppointments.length === 0) {
      showToast('ไม่มีรายการนัดหมายรอติดตามให้ซิงก์', 'success');
      return;
    }

    setIsBatchSyncing(true);
    let successCount = 0;
    let failCount = 0;

    for (const app of pendingAppointments) {
      try {
        await syncAppointmentToGoogleCalendar(app);
        successCount++;
      } catch (e) {
        console.warn(`[Batch Sync Warning] Failed to sync ${app.patientName}:`, e);
        failCount++;
      }
    }

    setIsBatchSyncing(false);
    if (failCount === 0) {
      showToast(`ส่งข้อมูลนัดหมายทั้งหมด (${successCount} รายการ) ไปยัง Google Calendar บัญชีกลางอัตโนมัติสำเร็จ! 🚀`, 'success');
    } else {
      showToast(`ซิงก์สำเร็จ ${successCount} รายการ (ไม่สำเร็จ ${failCount} รายการ)`, 'error');
    }
  };

  // Filters
  const safeAppointments = useMemo(() => {
    return deduplicateAppointments(appointments);
  }, [appointments]);

  const filteredAppointments = safeAppointments.filter((app) => {
    const matchesSearch = app.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (app.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;

    let matchesDate = true;
    if (dateFilter !== 'all') {
      const todayStr = new Date().toISOString().split('T')[0];
      const curMonthPrefix = todayStr.substring(0, 7);
      const apptDate = (app.date || '').slice(0, 10);

      if (dateFilter === 'today') {
        matchesDate = apptDate === todayStr;
      } else if (dateFilter === 'upcoming') {
        matchesDate = apptDate >= todayStr;
      } else if (dateFilter === 'past') {
        matchesDate = apptDate !== '' && apptDate < todayStr;
      } else if (dateFilter === 'this_month') {
        matchesDate = apptDate.startsWith(curMonthPrefix);
      } else if (dateFilter === 'custom' && customDate) {
        matchesDate = apptDate === customDate;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleDownloadIcs = (app: Appointment) => {
    try {
      const patient = patients.find(p => p.id === app.patientId);
      downloadAppointmentIcs({
        id: app.id,
        patientName: app.patientName,
        hn: patient?.hn,
        date: app.date,
        time: app.time,
        type: app.type,
        notes: app.notes,
      });
      showToast(`ดาวน์โหลดไฟล์ปฏิทิน .ics สำหรับ ${app.patientName} เรียบร้อยแล้ว`, 'success');
    } catch (err) {
      console.error('Download ICS error:', err);
      showToast('ไม่สามารถดาวน์โหลดไฟล์ปฏิทินได้', 'error');
    }
  };

  const handleOpenGoogleCalendar = (app: Appointment) => {
    try {
      if (app.googleCalendarHtmlLink) {
        window.open(app.googleCalendarHtmlLink, '_blank');
        showToast(`เปิดหน้าบันทึกใน Google Calendar แล้ว`, 'success');
        return;
      }

      const patient = patients.find(p => p.id === app.patientId);
      const url = getGoogleCalendarWebUrl({
        id: app.id,
        patientName: app.patientName,
        hn: patient?.hn,
        date: app.date,
        time: app.time,
        type: app.type,
        notes: app.notes,
      });
      saveLocalCalendarRecord({
        id: app.id,
        patientName: app.patientName,
        hn: patient?.hn,
        date: app.date,
        time: app.time,
        type: app.type,
        notes: app.notes,
      });
      window.open(url, '_blank');
      showToast(`เปิดหน้าเพิ่มนัดหมายลง Google Calendar แล้ว`, 'success');
    } catch (err) {
      console.error('Open Google Calendar error:', err);
      showToast('ไม่สามารถเปิด Google Calendar ได้', 'error');
    }
  };

  const submitAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPatientId) {
      alert('กรุณาเลือกผู้รับการดูแลสำหรับการนัดหมาย');
      return;
    }

    const selectedPatient = patients.find(p => p.id === formPatientId);
    const patHn = selectedPatient?.hn;

    // Check duplicate booking: same patient on the same date and time
    const isDuplicate = appointments.some(a => {
      if (a.status === 'cancelled') return false;
      const samePatient = a.patientId === formPatientId || (patHn && a.hn && a.hn.toLowerCase() === patHn.toLowerCase());
      return samePatient && a.date === formDate && a.time === formTime;
    });

    if (isDuplicate) {
      window.alert("ช่วงเวลานี้มีนัดหมายอยู่แล้ว กรุณาเลือกวันหรือเวลาอื่น");
      return;
    }

    const patName = selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : 'ผู้รับการดูแล';

    setIsSubmitting(true);

    const newApptData: Omit<Appointment, 'id' | 'patientName'> = {
      patientId: formPatientId,
      date: formDate,
      time: formTime,
      type: formType as 'clinical' | 'online' | 'consultation',
      notes: formNotes,
      status: 'pending',
    };

    const tempAppt: Appointment = {
      ...newApptData,
      id: `appt_${Date.now()}`,
      patientName: patName,
      hn: selectedPatient?.hn,
    };

    saveLocalCalendarRecord(tempAppt);

    let googleCalendarEventId: string | undefined = undefined;
    let googleCalendarHtmlLink: string | undefined = undefined;

    if (syncWithGoogleCalendar) {
      try {
        const syncRes = await syncAppointmentToGoogleCalendar(tempAppt);
        googleCalendarEventId = syncRes.googleCalendarEventId;
        googleCalendarHtmlLink = syncRes.googleCalendarHtmlLink;
        showToast(`บันทึกนัดหมายและซิงก์ข้อมูลไปยัง Google Calendar (${CENTRAL_CALENDAR_EMAIL}) สำเร็จแล้ว 📅`, 'success');
      } catch (err: any) {
        console.error('[AppointmentsList] Google Calendar Webhook Sync error:', err);
        googleCalendarHtmlLink = getGoogleCalendarWebUrl(tempAppt);
        showToast('บันทึกนัดหมายในระบบเรียบร้อย (พร้อมสร้างลิงก์ Google Calendar)', 'success');
      }
    }

    // Sync directly to Google Sheets Appointments tab
    try {
      await syncAppointmentToGoogleSheets(getWebhookUrl(), tempAppt);
    } catch (err) {
      console.warn('[AppointmentsList] Google Sheets appointment sync error:', err);
    }

    if (downloadIcsOnSave) {
      downloadAppointmentIcs(tempAppt);
    }

    onAddAppointment({
      ...newApptData,
      googleCalendarEventId,
      googleCalendarHtmlLink,
    });
    
    playSuccessChime();

    setIsSubmitting(false);
    setShowAddModal(false);

    // Reset Form
    setFormPatientId('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormTime('10:30');
    setFormType('ตรวจติดตาม EF Trainer');
    setFormDentistName('ทันตแพทย์หญิง นภาพร วรรณษา');
    setFormNotes('');
  };

  const handleStatusChange = async (app: Appointment, newStatus: 'pending' | 'completed' | 'cancelled') => {
    if (newStatus === 'cancelled' && app.googleCalendarEventId) {
      try {
        await deleteOrCancelGoogleCalendarEvent(app.googleCalendarEventId, 'cancel', app);
        showToast(`อัปเดตสถานะนัดหมายเป็นยกเลิก และซิงก์กับ Google Calendar เรียบร้อย`, 'success');
      } catch (err) {
        console.warn('[AppointmentsList] Google Calendar cancel warning:', err);
      }
    }
    onUpdateAppointmentStatus(app.id, newStatus);
    playAlertTone();
  };

  const handleDeleteConfirm = async () => {
    if (apptToDelete) {
      const deletedName = apptToDelete.patientName;
      const appointmentId = (apptToDelete as any).appointment_id || apptToDelete.id;
      
      if (apptToDelete.googleCalendarEventId) {
        try {
          await deleteOrCancelGoogleCalendarEvent(apptToDelete.googleCalendarEventId, 'delete');
        } catch (err) {
          console.warn('[AppointmentsList] Google Calendar delete warning:', err);
        }
      }

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
        console.warn('[AppointmentsList] Google Sheets appointment delete sync error:', err);
      }

      onDeleteAppointment(apptToDelete.id);
      showToast(`ลบรายการนัดหมายของ ${deletedName} สำเร็จ และซิงก์คำสั่งลบไปยัง Google Calendar เรียบร้อย 🗑️`, 'success');
      setApptToDelete(null);
    }
  };

  return (
    <div id="appointments-view" className="space-y-4 sm:space-y-6 text-left w-full max-w-full overflow-x-hidden box-border">
      
      {/* Toast Notification */}
      {notificationMsg && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 shadow-md transition-all ${
          notificationMsg.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {notificationMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notificationMsg.text}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
        </div>
      )}

      {/* Appointment Hub Header Banner (Slim Compact Banner) */}
      <div className="bg-white/80 backdrop-blur-md py-3.5 px-5 sm:px-6 rounded-2xl border border-slate-300/80 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        <div className="flex items-center gap-3.5">
          <Logo className="w-24 sm:w-28 h-auto shrink-0" />
          <div className="h-7 w-px bg-slate-200 hidden sm:block" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-slate-950 tracking-tight flex items-center gap-1.5">
                <span>คิวการนัดหมายและปฏิทินติดตามผล</span>
                <span className="text-sm">📅</span>
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                <span>Google Calendar Live Sync</span>
              </span>
            </div>
            <p className="text-slate-800 text-xs mt-0.5 font-medium">
              วางแผนและจัดการคิวการนัดหมายตรวจติดตาม EF Trainer เชื่อมต่อปฏิทินกลางอัตโนมัติ ({CENTRAL_CALENDAR_EMAIL})
            </p>
          </div>
        </div>

        {/* Action Buttons: Gradient + Glassy Border */}
        <div className="flex items-center gap-2.5 flex-wrap self-end md:self-auto">
          {/* Glassy Border Button for Google Calendar Sync */}
          <button
            type="button"
            onClick={handleSyncAllAppointments}
            disabled={isBatchSyncing}
            className="bg-white/80 backdrop-blur-md hover:bg-sky-50/90 text-sky-900 border border-sky-200/90 shadow-2xs hover:shadow-xs font-bold text-xs rounded-xl px-3.5 py-2 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="ซิงค์นัดหมายรอติดตามทั้งหมดไปยัง Google Calendar"
          >
            {isBatchSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600 shrink-0" /> : <CalendarPlus className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
            <span>ซิงค์ Google Calendar</span>
          </button>

          {/* Violet to Indigo Gradient Button for New Appointment */}
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ นัดหมายใหม่</span>
          </button>
        </div>
      </div>

      {/* Full Original Interactive Calendar Canvas */}
      <div className="w-full">
        <InteractiveCalendar
          appointments={appointments}
          patients={patients}
          onDateClick={(dateStr) => {
            setFormDate(dateStr);
            setShowAddModal(true);
          }}
          onUpdateAppointmentStatus={onUpdateAppointmentStatus}
          onUpdateAppointment={onUpdateAppointment}
          onDeleteAppointment={onDeleteAppointment}
        />
      </div>

      {/* Filter and Search controls */}
      <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-300/80 shadow-md flex flex-col gap-3 mt-6">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาตามชื่อผู้รับการดูแล หรือบันทึกนัดหมาย..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:border-brand focus:bg-white text-slate-700 outline-hidden"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Date Filter Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="text-slate-400 text-xs font-bold whitespace-nowrap">วันที่:</span>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer pr-1"
              >
                <option value="all">ทุกช่วงวันที่</option>
                <option value="today">📅 นัดหมายวันนี้</option>
                <option value="upcoming">⏳ นัดที่กำลังจะมาถึง</option>
                <option value="past">📜 นัดที่ผ่านมาแล้ว</option>
                <option value="this_month">🗓️ นัดหมายเดือนนี้</option>
                <option value="custom">⚙️ กำหนดวันที่เอง...</option>
              </select>
            </div>

            {/* Custom Date Input */}
            {dateFilter === 'custom' && (
              <div className="flex items-center gap-1 bg-white border border-purple-200 rounded-xl px-2.5 py-1 shadow-2xs">
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="text-xs font-bold text-slate-800 outline-none bg-transparent cursor-pointer"
                />
              </div>
            )}

            {/* Reset Filter Button */}
            {(searchTerm || statusFilter !== 'all' || dateFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setDateFilter('all');
                  setCustomDate('');
                }}
                className="flex items-center gap-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                title="ล้างคำค้นหาและตัวกรองทั้งหมด"
              >
                <X className="w-3.5 h-3.5" />
                <span>ล้างตัวกรอง</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Tab Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'นัดหมายทั้งหมด' },
              { id: 'pending', label: 'รอตรวจติดตาม' },
              { id: 'completed', label: 'ตรวจแล้ว (Success)' },
              { id: 'cancelled', label: 'ยกเลิกแล้ว' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-brand text-white shadow-xs'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-[11px] font-bold text-slate-500 ml-auto">
            แสดง {filteredAppointments.length} จาก {appointments.length} รายการ
          </span>
        </div>
      </div>

      {/* Appointment Grid List */}
      <div>
        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs">
            <EmptyState 
              title="ยังไม่มีข้อมูล" 
              description="เริ่มต้นโดยเพิ่มข้อมูลเพื่อเริ่มติดตาม" 
              actionLabel="+ เพิ่มข้อมูล" 
              onAction={() => setShowAddModal(true)}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAppointments.map((app) => {
            const isRescheduleRequested = app.status?.includes('Reschedule') || app.status?.includes('ขอเลื่อน') || app.status === 'reschedule_requested';
            const isConfirmed = app.status?.includes('Confirmed') || app.status?.includes('ยืนยัน') || app.status === 'confirmed';
            const isCompleted = app.status === 'completed' || app.status === 'เสร็จสิ้น';
            const isCancelled = app.status === 'cancelled' || app.status === 'ยกเลิก';

            return (
            <div 
              key={app.id}
              className={`p-5 rounded-2xl transition-all flex flex-col justify-between ${
                isRescheduleRequested
                  ? 'bg-amber-50/40 border-2 border-amber-300 ring-2 ring-amber-300/40 shadow-md'
                  : isConfirmed
                  ? 'aurora-card border-sky-300 ring-1 ring-sky-300/30'
                  : isCompleted
                  ? 'aurora-card opacity-80'
                  : isCancelled
                  ? 'bg-rose-50/20 border border-rose-100 opacity-60'
                  : 'aurora-card'
              }`}
            >
              <div>
                <div className="flex justify-between items-start gap-2">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    app.type === 'clinical' 
                      ? 'bg-indigo-50 text-indigo-700' 
                      : app.type === 'online'
                      ? 'bg-teal-50 text-teal-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {app.type === 'clinical' ? 'คลินิก On-site' : app.type === 'online' ? 'วิดีโอคอล Online' : 'ปรึกษาทั่วไป'}
                  </span>

                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                    isRescheduleRequested
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse font-black'
                      : isConfirmed
                      ? 'bg-sky-100 text-sky-800 border border-sky-200 font-bold'
                      : isCompleted
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : isCancelled
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {isRescheduleRequested ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                        <span>⚠️ คนไข้แจ้งขอเลื่อนนัด</span>
                      </>
                    ) : isConfirmed ? (
                      <>
                        <span>✓</span>
                        <span>ยืนยันมาตามนัดแล้ว</span>
                      </>
                    ) : isCompleted ? (
                      'ตรวจสำเร็จ'
                    ) : isCancelled ? (
                      'ยกเลิกแล้ว'
                    ) : (
                      'รอนัดหมาย'
                    )}
                  </span>
                </div>

                <h4 className="font-bold text-slate-800 text-base mt-3 leading-tight">
                  {getCleanPatientDisplayName(app.patientName)}
                </h4>

                {/* Time Indicators */}
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-500 font-mono mt-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-brand" />
                    <span>{formatThaiDate(app.date)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <Clock className="w-4 h-4 text-brand" />
                    <span>{app.time} น.</span>
                  </div>
                </div>

                {/* Clinician Remarks or Reschedule Reason */}
                {(() => {
                  const cleanNotes = getCleanNotes(app.notes);
                  if (!cleanNotes) return null;
                  return (
                    <div className={`mt-3 p-2.5 rounded-xl border text-xs ${
                      isRescheduleRequested
                        ? 'bg-amber-100/80 border-amber-300 text-amber-950 font-medium'
                        : 'bg-slate-50 border-slate-100 text-slate-600'
                    }`}>
                      <span className={`text-[10px] font-bold block uppercase tracking-wider mb-1 ${
                        isRescheduleRequested ? 'text-amber-900 font-black' : 'text-slate-400'
                      }`}>
                        {isRescheduleRequested ? '📌 ข้อความแจ้งขอเลื่อนนัดจากคนไข้:' : 'บันทึกตรวจติดตามผล:'}
                      </span>
                      <p className="leading-relaxed line-clamp-4">
                        {cleanNotes}
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Actions Grid */}
              <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between gap-2 flex-wrap">
                {/* Left side actions: Trash Delete button & Calendar buttons */}
                <div className="flex items-center gap-1.5">
                  {/* Delete Trash Button on Bottom Left */}
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (window.confirm("ต้องการยกเลิกนัดหมายนี้ใช่หรือไม่?")) {
                        const appointmentId = (app as any).appointment_id || app.id;
                        
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
                          console.warn('[AppointmentsList] Delete sync error:', err);
                        }

                        onDeleteAppointment(app.id);
                        if (app.googleCalendarEventId) {
                          deleteOrCancelGoogleCalendarEvent(app.googleCalendarEventId, 'delete').catch(err => console.warn(err));
                        }
                        showToast(`ยกเลิกนัดหมายของ ${getCleanPatientDisplayName(app.patientName)} เรียบร้อยแล้ว`, 'success');
                      }
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 rounded-lg transition-colors border border-rose-200 text-xs font-bold cursor-pointer shadow-2xs"
                    title="ยกเลิกนัดหมายนี้"
                    aria-label="ยกเลิกนัดหมาย"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600 pointer-events-none" />
                    <span className="pointer-events-none">ยกเลิกนัด</span>
                  </button>

                  {/* Google Calendar Live Sync & Web Open Button */}
                  <button
                    type="button"
                    onClick={() => handleSyncSingleAppointment(app)}
                    disabled={syncingApptId === app.id}
                    className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                      app.googleCalendarEventId
                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                        : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                    }`}
                    title={app.googleCalendarEventId ? 'ซิงก์เรียบร้อยแล้วบน Google Calendar (คลิกเพื่ออัปเดต)' : 'ซิงก์นัดหมายนี้ไปยัง Google Calendar'}
                  >
                    {syncingApptId === app.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 shrink-0" />
                    ) : (
                      <CalendarPlus className={`w-3.5 h-3.5 ${app.googleCalendarEventId ? 'text-emerald-600' : 'text-blue-600'}`} />
                    )}
                    <span>{syncingApptId === app.id ? 'กำลังซิงก์...' : app.googleCalendarEventId ? '🟢 Sync แล้ว' : 'Sync Calendar'}</span>
                  </button>

                  {/* ICS Download Button */}
                  <button
                    type="button"
                    onClick={() => handleDownloadIcs(app)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200 transition-all cursor-pointer"
                    title="ดาวน์โหลดไฟล์ .ics สำหรับ Apple/Outlook/โทรศัพท์มือถือ"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>โหลด .ICS</span>
                  </button>
                </div>

                {/* Right side actions: Status toggles */}
                <div className="flex items-center gap-1.5">
                  {(app.status === 'pending' || isRescheduleRequested || isConfirmed) && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(app, 'completed')}
                        className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2 py-1.5 rounded-lg hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer"
                        title="เสร็จสิ้นการนัดตรวจ"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>ตรวจเสร็จ</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(app, 'cancelled')}
                        className="flex items-center gap-1 bg-slate-100 text-slate-600 text-[11px] font-bold px-2 py-1.5 rounded-lg hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 border border-transparent transition-all cursor-pointer"
                        title="ยกเลิกการนัดตรวจ"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>ยกเลิก</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
            );
          })}
          </div>
        )}
      </div>

      {/* CONFIRM DELETE APPOINTMENT MODAL */}
      {apptToDelete && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overscroll-contain"
          onClick={(e) => { if (e.target === e.currentTarget) setApptToDelete(null); }}
        >
          <div 
            className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] my-auto animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-rose-100 bg-rose-50 text-rose-900 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-200 text-rose-700 flex items-center justify-center font-black">
                  <Trash2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black font-sans">ยืนยันการลบรายการนัดหมาย</h3>
              </div>
              <button 
                onClick={() => setApptToDelete(null)} 
                className="w-7 h-7 rounded-full bg-white hover:bg-rose-100 text-rose-700 flex items-center justify-center cursor-pointer transition-colors"
                aria-label="ปิด"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div 
              className="p-5 text-center space-y-3 overflow-y-auto overscroll-contain flex-1"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <p className="text-xs text-slate-600 leading-relaxed">
                คุณแน่ใจหรือไม่ว่าต้องการลบนัดหมายของ <strong className="text-slate-800 font-semibold">{getCleanPatientDisplayName(apptToDelete.patientName)}</strong> วันที่ {formatThaiDate(apptToDelete.date)} เวลา {apptToDelete.time} น. ออกจากระบบ?
              </p>
              <div className="p-2.5 bg-rose-50/80 border border-rose-100 rounded-xl text-[11px] text-rose-700 text-left flex items-start gap-2">
                <span className="shrink-0 font-bold">⚠️</span>
                <span>ระบบจะส่งคำสั่งลบ Event ใน Google Calendar และ Google Sheets ให้อัตโนมัติ</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setApptToDelete(null)}
                className="flex-1 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ยืนยันการลบ</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* SCHEDULE APPOINTMENT MODAL */}
      {showAddModal && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overscroll-contain overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
        >
          <div 
            className="aurora-modal rounded-3xl max-w-md w-full shadow-2xl flex flex-col max-h-[85vh] bg-white overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ═══════════════════════════════════════════════════════════
                [ส่วนหัว (Header)] - ล็อคอยู่ด้านบนเสมอ shrink-0
            ═══════════════════════════════════════════════════════════ */}
            <div className="p-4 sm:p-5 border-b border-purple-200/50 bg-gradient-to-r from-purple-700 to-indigo-700 text-white rounded-t-3xl flex justify-between items-center shrink-0 z-10">
              <div>
                <h3 className="text-sm sm:text-base font-bold font-sans">บันทึกนัดหมายใหม่ 🩺</h3>
                <p className="text-[11px] text-purple-200">สร้างตารางนัดหมายและส่ง Event ไปยัง Google Calendar ({CENTRAL_CALENDAR_EMAIL})</p>
              </div>
              <button 
                type="button"
                onClick={() => setShowAddModal(false)} 
                className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-full cursor-pointer transition-colors shrink-0" 
                title="ปิด (ESC)"
                aria-label="ปิดหน้าต่าง"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form wrapping scrollable content and sticky footer */}
            <form onSubmit={submitAddAppointment} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* ═══════════════════════════════════════════════════════════
                  [ส่วนเนื้อหาตรงกลาง (Body)] - เลื่อนขึ้น-ลงอิสระ ลื่นไหล
              ═══════════════════════════════════════════════════════════ */}
              <div 
                className="flex-1 overflow-y-auto p-5 space-y-4 overscroll-contain bg-white"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {/* Select Patient */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">เลือกผู้รับการดูแลในระบบ *</label>
                  <select
                    required
                    value={formPatientId}
                    onChange={(e) => setFormPatientId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-700 outline-hidden cursor-pointer"
                  >
                    <option value="">-- กรุณาเลือกผู้รับการดูแล --</option>
                    {patients.filter(p => p.status === 'active').map((p) => {
                      const pInfo = formatPatientDisplay(p);
                      return (
                        <option key={p.id} value={p.id}>
                          {p.hn} | {pInfo.displayName} {pInfo.formattedNickname ? `${pInfo.formattedNickname} ` : ''}{pInfo.ageGroupTag} ({pInfo.ageDisplayText})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">วันที่นัดหมาย *</label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-700 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">เวลานัดหมาย *</label>
                    <input
                      type="time"
                      required
                      value={formTime}
                      onChange={(e) => setFormTime(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-700 outline-hidden"
                    />
                  </div>
                </div>

                {/* Type - ช่องเลือกหัตถการ */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">ประเภทการนัดหมาย / หัตถการ *</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-700 outline-hidden cursor-pointer"
                  >
                    <option value="ตรวจติดตาม EF Trainer">ตรวจติดตาม EF Trainer</option>
                    <option value="ฝึก OMT">ฝึก OMT</option>
                    <option value="ตรวจประเมินรูปหน้า">ตรวจประเมินรูปหน้า</option>
                    <option value="ตรวจสดที่คลินิก (Clinical On-site)">ตรวจสดที่คลินิก (Clinical On-site)</option>
                    <option value="ปรึกษาและแนะนำผ่านออนไลน์ (Online Consultation)">ปรึกษาและแนะนำผ่านออนไลน์ (Online Consultation)</option>
                  </select>
                </div>

                {/* Dentist Name - ชื่อแพทย์ */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">ทันตแพทย์ผู้ตรวจ</label>
                  <input
                    type="text"
                    value={formDentistName}
                    onChange={(e) => setFormDentistName(e.target.value)}
                    placeholder="เช่น ทพ.สมชาย มีสุข"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-700 outline-hidden"
                  />
                </div>

                {/* Notes - บันทึกช่วยจำ */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">บันทึกช่วยจำ/เป้าหมายการตรวจติดตาม</label>
                  <textarea
                    placeholder="เช่น ตรวจสอบลักษณะลิ้นหลังฝึก 1 เดือน, ตรวจการควบคุมลมเป่ากะบังลม..."
                    rows={3}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-700 outline-hidden resize-none"
                  />
                </div>

                {/* Google Calendar Sync Option - สวิตช์ Google Calendar */}
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-left">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <CalendarPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-blue-900">Sync กับ Google Calendar</h4>
                      <p className="text-[10px] text-blue-700 font-medium">
                        {calendarStatus.isConnected 
                          ? `สร้าง/อัปเดต Event บนปฏิทินของ ${calendarStatus.email || CENTRAL_CALENDAR_EMAIL} อัตโนมัติ`
                          : 'เปิดหน้าสร้าง Event ของ Google Calendar ในแท็บใหม่'}
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncWithGoogleCalendar}
                      onChange={(e) => setSyncWithGoogleCalendar(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* ICS Export Option - ไฟล์ .ICS */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-left">
                    <div className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800">ดาวน์โหลดไฟล์ .ICS</h4>
                      <p className="text-[10px] text-slate-600 font-medium">บันทึกลงปฏิทิน Apple Calendar / Outlook / มือถือ</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={downloadIcsOnSave}
                      onChange={(e) => setDownloadIcsOnSave(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-800"></div>
                  </label>
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════════
                  [ส่วนท้าย (Footer)] - ล็อคอยู่ด้านล่างสุด shrink-0
              ═══════════════════════════════════════════════════════════ */}
              <div className="shrink-0 p-4 border-t border-slate-100 bg-white flex justify-end gap-3 z-10">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-98 rounded-xl cursor-pointer transition-all min-h-[42px]"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 active:scale-98 rounded-xl shadow-md hover:shadow-lg cursor-pointer flex items-center gap-2 disabled:opacity-50 transition-all min-h-[42px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>กำลังบันทึก...</span>
                    </>
                  ) : (
                    <>
                      <CalendarPlus className="w-4 h-4" />
                      <span>บันทึกนัดหมาย 💾</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
