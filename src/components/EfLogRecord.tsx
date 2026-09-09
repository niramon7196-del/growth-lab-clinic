import React, { useState } from 'react';
import { 
  Brain, Calendar, Clock, AlertTriangle, CheckCircle, XCircle, 
  Trash2, Plus, Info, Save, ChevronRight, User, AlertCircle, BookOpen, ArrowLeft
} from 'lucide-react';
import { Patient, EFRecordLog } from '../types';
import OriginalReferenceModal from './OriginalReferenceModal';

interface EfLogRecordProps {
  patients: Patient[];
  selectedPatientId?: string;
  onUpdatePatientEfLog: (patientId: string, log: EFRecordLog) => void;
  onDeletePatientEfLog?: (patientId: string, logId: string) => void;
  onBack?: () => void;
}

export default function EfLogRecord({ 
  patients, 
  selectedPatientId, 
  onUpdatePatientEfLog, 
  onDeletePatientEfLog,
  onBack 
}: EfLogRecordProps) {
  // 1. Patient Selection directly from prop
  const activePatient = selectedPatientId ? patients.find(p => p.id === selectedPatientId) : undefined;
  const [showOriginalRef, setShowOriginalRef] = useState<boolean>(false);

  const efRecordLogs = activePatient?.efRecordLogs || [];

  // 2. Form States
  // Get today's local date as YYYY-MM-DD
  const todayStr = new Date().toLocaleDateString('sv-SE'); // sv-SE format is YYYY-MM-DD

  const [date, setDate] = useState<string>(todayStr);
  const [status, setStatus] = useState<'worn' | 'failed' | 'yet'>('worn');
  const [durationHours, setDurationHours] = useState<string>('8.0');
  const [removalReason, setRemovalReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // 3. Validation
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!activePatient) {
      setErrorMsg('กรุณาเลือกสมาชิกโปรแกรมก่อนบันทึก');
      return;
    }

    if (!date) {
      setErrorMsg('กรุณาระบุวันที่บันทึก');
      return;
    }

    // Limit dates to not be in the future
    if (new Date(date) > new Date(todayStr)) {
      setErrorMsg('ไม่สามารถบันทึกข้อมูลล่วงหน้าในอนาคตได้');
      return;
    }

    // Prepare EF log
    const efLog: EFRecordLog = {
      id: editingId || `ef_${Date.now()}`,
      date,
      status,
      efWorn: status === 'worn',
      durationHours: status === 'worn' ? parseFloat(durationHours) || 0 : undefined,
      removedDuringNight: status === 'failed' || removalReason.trim().length > 0,
      removalReason: status === 'failed' || removalReason.trim().length > 0 ? removalReason : undefined,
      notes: notes.trim() || undefined
    };

    onUpdatePatientEfLog(activePatient.id, efLog);

    // Reset Form (except Date)
    setEditingId(null);
    setRemovalReason('');
    setNotes('');
    setDurationHours('8.0');
    setStatus('worn');
  };

  const handleEdit = (log: EFRecordLog) => {
    setEditingId(log.id);
    setDate(log.date);
    setStatus(log.status);
    setDurationHours(log.durationHours?.toString() || '8.0');
    setRemovalReason(log.removalReason || '');
    setNotes(log.notes || '');
  };

  if (!activePatient) {
    return (
      <div className="space-y-6 text-left font-sans">
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-bold transition-all flex items-center gap-2 text-xs border border-slate-200 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ย้อนกลับ</span>
          </button>
        )}
        <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto text-purple-600 text-3xl">
            🧠
          </div>
          <h2 className="text-lg font-bold text-slate-800">ยังไม่ได้เลือกสมาชิกผู้รับการดูแล</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            กรุณาเลือกสมาชิกผู้รับการดูแลจากรายการแถบด้านบน เพื่อลงบันทึก EF Record
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Upper Panel: Description and Selector */}
      <div className="aurora-card rounded-3xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold uppercase tracking-wider">
              <Brain className="w-3.5 h-3.5 text-purple-600" />
              <span>EF Appliance Daily Tracking Log</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-[#1A1A24]">
              บันทึกการทำ EF ประจำวัน (Daily EF Wear Log)
            </h2>
            <p className="text-slate-500 text-xs md:text-sm">
              บันทึกการสวมใส่อุปกรณ์ช่วยควบคุมความก้าวหน้าและการปฏิบัติตามแผนการสบฟันและการนอนหลับ Growth Lab
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowOriginalRef(true)}
              className="text-xs font-black text-white bg-slate-900 hover:bg-slate-800 px-3.5 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              title="เปิดดูเอกสารข้อมูลต้นฉบับทางการแพทย์"
            >
              <BookOpen className="w-3.5 h-3.5 text-purple-300" />
              <span>📄 ข้อมูลต้นฉบับ READ-ONLY</span>
            </button>

            {onBack && (
              <button
                onClick={onBack}
                className="inline-flex items-center gap-1.5 text-xs font-black text-purple-700 bg-purple-50 hover:bg-purple-100 px-3.5 py-2 rounded-xl border border-purple-200/80 shadow-2xs transition-all cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 text-purple-600" />
                <span>← กลับหน้าศูนย์กลาง</span>
              </button>
            )}
          </div>
        </div>

        {/* Member Selector */}
        <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-purple-700 uppercase block">เลือกสมาชิกโปรแกรม</label>
              <span className="text-xs text-slate-500">กรุณาเลือกสมาชิกเพื่อกรอกข้อมูลการสวมใส่เครื่องมือ</span>
            </div>
          </div>

          <div className="bg-purple-100 text-purple-900 px-4 py-2.5 rounded-xl border border-purple-200/50 font-bold text-xs">
            {activePatient?.firstName} {activePatient?.lastName} ({activePatient?.hn})
          </div>
        </div>
      </div>

      {/* Main Form & History Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Daily Record Form */}
        <div className="lg:col-span-5 aurora-card rounded-3xl p-6 md:p-8 space-y-6 h-fit">
          <h3 className="text-base font-black text-[#1A1A24] flex items-center gap-2 border-b border-slate-100 pb-3">
            <Plus className="w-5 h-5 text-purple-600" />
            <span>{editingId ? 'แก้ไขข้อมูลการใส่ EF' : 'บันทึกข้อมูลประจำวัน'}</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Date Selection */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">วันที่ทำการบันทึก *</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={todayStr}
                  className="w-full pl-10 pr-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-400"
                />
              </div>
            </div>

            {/* Status Choice */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">การใส่เครื่องมือ EF *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setStatus('worn')}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                    status === 'worn'
                      ? 'bg-purple-100/90 border-purple-300 text-purple-900 font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle className={`w-5 h-5 ${status === 'worn' ? 'text-purple-600' : 'text-slate-400'}`} />
                  <span className="text-xs">✓ ใส่ได้</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('failed')}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                    status === 'failed'
                      ? 'bg-rose-100/90 border-rose-300 text-rose-900 font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <XCircle className={`w-5 h-5 ${status === 'failed' ? 'text-rose-600' : 'text-slate-400'}`} />
                  <span className="text-xs">✕ ใส่ไม่ได้</span>
                </button>
              </div>
            </div>

            {/* If Worn: Duration in Hours */}
            {status === 'worn' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">ระยะเวลาที่ใส่ EF (ชั่วโมง) *</label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    required
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                    placeholder="ระบุ เช่น 8.0"
                    className="w-full pl-10 pr-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              </div>
            )}

            {/* Removal Reason / If any */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                {status === 'failed' ? 'สาเหตุที่ไม่ได้ใส่เครื่องมือ *' : 'ถอดกลางคืน / เหตุผล (ถ้ามี)'}
              </label>
              <select
                value={removalReason}
                onChange={(e) => setRemovalReason(e.target.value)}
                required={status === 'failed'}
                className="w-full px-3.5 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-400"
              >
                <option value="">-- เลือกสาเหตุ --</option>
                <option value="อ้าปาก/เครื่องมือหลุดเอง">อ้าปาก / หลุดเองระหว่างนอน</option>
                <option value="เจ็บฟัน/ตึงมาก">เจ็บฟัน / มีอาการตึงมากเกินไป</option>
                <option value="รำคาญ/ถอดออกเอง">รู้สึกรำคาญ / ถอดออกเองขณะหลับ</option>
                <option value="อึดอัด/หายใจไม่สะดวก">อึดอัด / คัดจมูกหายใจลำบาก</option>
                <option value="ไม่ได้ใส่อุปกรณ์">ลืมใส่ / ไม่ได้ใส่อุปกรณ์</option>
                <option value="ป่วย/ไอ/เจ็บคอ">ป่วยไข้ / มีอาการไอ / เจ็บคอ</option>
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">หมายเหตุเพิ่มเติม</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ระบุรายละเอียดหรือข้อสังเกตเพิ่มเติม เช่น มีรอยฟันเจ็บ หรืออึดอัดเฉพาะช่วงแรก..."
                rows={3}
                className="w-full p-3.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-400"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-purple-900/10 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{editingId ? 'อัปเดตข้อมูล' : 'บันทึกข้อมูล'}</span>
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setRemovalReason('');
                    setNotes('');
                    setDurationHours('8.0');
                    setStatus('worn');
                  }}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold py-2.5 px-4 rounded-xl"
                >
                  ยกเลิก
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Side: Real-time Daily Log Records */}
        <div className="lg:col-span-7 aurora-card rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-[#1A1A24] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <span>ประวัติการบันทึกเครื่องมือ EF ของ {activePatient?.firstName || 'ผู้รับการดูแล'}</span>
            </h3>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
              {efRecordLogs.length} บันทึก
            </span>
          </div>

          {efRecordLogs.length === 0 ? (
            <div className="py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <Info className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-600">ยังไม่มีข้อมูล</p>
              <p className="text-[10px] text-slate-400">กรอกข้อมูลการใส่อุปกรณ์ EF รายวันของสมาชิกท่านนี้ได้ที่ฟอร์มด้านซ้าย</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {efRecordLogs.slice().reverse().map((log) => {
                const hasNotesOrReason = log.notes || log.removalReason;
                return (
                  <div 
                    key={log.id} 
                    className="p-4 bg-white border border-slate-100 hover:border-purple-200 rounded-2xl shadow-2xs transition-all flex justify-between items-start gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-900 font-mono">
                          {log.date}
                        </span>
                        
                        {/* Status Label mapping */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          log.status === 'worn'
                            ? 'bg-purple-50 text-purple-700 border-purple-100'
                            : 'bg-rose-50 text-rose-700 border-rose-100'
                        }`}>
                          {log.status === 'worn' ? 'ใส่ EF แล้ว' : 'ใส่ไม่ได้'}
                        </span>

                        {log.durationHours !== undefined && log.durationHours > 0 && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                            {log.durationHours} ชั่วโมง
                          </span>
                        )}

                        {hasNotesOrReason && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                            มีเหตุผล/หมายเหตุ
                          </span>
                        )}
                      </div>

                      {log.removalReason && (
                        <p className="text-xs text-rose-600 leading-normal">
                          <strong>สาเหตุถอด/ไม่ใส่:</strong> {log.removalReason}
                        </p>
                      )}

                      {log.notes && (
                        <p className="text-xs text-slate-500 italic leading-normal">
                          "{log.notes}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleEdit(log)}
                        className="text-[11px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2.5 py-1.5 rounded-lg transition-all"
                      >
                        แก้ไข
                      </button>

                      {onDeletePatientEfLog && (
                        <button
                          onClick={() => onDeletePatientEfLog(activePatient.id, log.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                          title="ลบรายการ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ORIGINAL MEDICAL REFERENCE MODAL (READ-ONLY) */}
      <OriginalReferenceModal
        isOpen={showOriginalRef}
        onClose={() => setShowOriginalRef(false)}
        title="ข้อมูลต้นฉบับ: EF APPLIANCE & OMT PRACTICE LOG"
        imageSrc="/assets/images/exercise_movement.jpg"
      />
    </div>
  );
}
