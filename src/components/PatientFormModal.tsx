import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserPlus, 
  UserCheck, 
  Phone, 
  Calendar, 
  MapPin, 
  Save, 
  X, 
  Loader2, 
  Sparkles, 
  Scale, 
  Ruler, 
  FileText,
  Clock
} from 'lucide-react';
import { Patient } from '../types';
import { 
  calculateAgeFromDob, 
  getAgeGroupBadge, 
  getSuggestedTitlePrefix,
  generateNextHN
} from '../utils/patientUtils';
import { cloudApi } from '../services/cloudApi';
import { syncAppointmentToGoogleSheets, getWebhookUrl } from '../services/googleAppsScriptService';
import { useScrollLock } from '../utils';

export interface PatientFormModalProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  initialData?: Patient | null;
  existingPatients?: Patient[];
  onClose: () => void;
  onSave: (formData: any) => Promise<void> | void;
  isSaving?: boolean;
}

export default function PatientFormModal({
  isOpen,
  mode,
  initialData,
  existingPatients = [],
  onClose,
  onSave,
  isSaving = false,
}: PatientFormModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [localSaving, setLocalSaving] = useState(false);
  const isSubmittingRef = useRef(false);
  const lastSubmitTimestampRef = useRef(0);
  const effectiveSaving = isSaving || localSaving;

  // Form State
  const [formData, setFormData] = useState({
    title: 'ด.ช.',
    firstName: '',
    lastName: '',
    nickname: '',
    gender: 'ชาย' as 'ชาย' | 'หญิง' | 'อื่นๆ',
    dob: '2016-03-15',
    age: 8,
    citizenId: '',
    phone: '',
    parentName: '',
    parentPhone: '',
    address: '',
    hn: '',
    weight: '',
    height: '',
    startDate: new Date().toISOString().split('T')[0],
    status: 'active' as 'active' | 'completed' | 'on-hold',
    notes: '',
    // Optional first appointment
    firstAppointmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    firstAppointmentTime: '09:00',
  });

  // Function to generate next available short HN (hn001, hn002, hn003...)
  const generateHN = (patientsList: Patient[] = existingPatients): string => {
    return generateNextHN(patientsList);
  };

  // Initialize or reset form when modal opens or initialData changes
  useEffect(() => {
    if (!isOpen) {
      isSubmittingRef.current = false;
      return;
    }

    isSubmittingRef.current = false;
    lastSubmitTimestampRef.current = 0;
    setLocalSaving(false);

    if (mode === 'edit' && initialData) {
      const birthAge = initialData.dob ? calculateAgeFromDob(initialData.dob) : 0;
      const computedAge = birthAge > 0 ? birthAge : (initialData.age || 0);
      const genderMatch = initialData.notes?.match(/\[เพศ:\s*(.*?)\]/);
      const cleanGender = (initialData.gender || (genderMatch ? genderMatch[1] : 'ชาย')) as 'ชาย' | 'หญิง' | 'อื่นๆ';
      const cleanFirst = (initialData.firstName || '').replace(/^(ด\.?ช\.?|ด\.?ญ\.?|เด็กชาย|เด็กหญิง|นาย|นางสาว|น\.?ส\.?|นาง|คุณ|น้อง)\s*/i, '').trim();
      const cleanNotes = initialData.notes?.replace(/\[เพศ:\s*.*?\]\s*/g, '').trim() || '';

      setFormData({
        title: getSuggestedTitlePrefix(computedAge, cleanGender, initialData.title),
        firstName: cleanFirst,
        lastName: initialData.lastName || '',
        nickname: initialData.nickname || '',
        gender: cleanGender,
        dob: initialData.dob || '2016-03-15',
        age: computedAge,
        citizenId: initialData.citizenId || '',
        phone: initialData.phone || initialData.parentPhone || '',
        parentName: initialData.parentName || '',
        parentPhone: initialData.parentPhone || initialData.phone || '',
        address: initialData.address || '',
        hn: initialData.hn || '',
        weight: initialData.weight && initialData.weight > 0 ? String(initialData.weight) : '',
        height: initialData.height && initialData.height > 0 ? String(initialData.height) : '',
        startDate: initialData.startDate || new Date().toISOString().split('T')[0],
        status: initialData.status || 'active',
        notes: cleanNotes,
        firstAppointmentDate: initialData.firstAppointmentDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        firstAppointmentTime: initialData.firstAppointmentTime || '09:00',
      });
    } else {
      // Add Mode
      const initialDob = '2016-03-15';
      const calculatedAge = calculateAgeFromDob(initialDob);
      const initialTitle = getSuggestedTitlePrefix(calculatedAge, 'ชาย');
      const nextHn = generateHN(existingPatients);

      setFormData({
        title: initialTitle,
        firstName: '',
        lastName: '',
        nickname: '',
        gender: 'ชาย',
        dob: initialDob,
        age: calculatedAge,
        citizenId: '',
        phone: '',
        parentName: '',
        parentPhone: '',
        address: '',
        hn: nextHn,
        weight: '',
        height: '',
        startDate: new Date().toISOString().split('T')[0],
        status: 'active',
        notes: '',
        firstAppointmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        firstAppointmentTime: '09:00',
      });
    }

    // Scroll to top upon open
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
    const timer = setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen, mode, initialData]);

  // Prevent background scrolling when modal is open using unified useScrollLock
  useScrollLock(isOpen);

  // Handle DOB change with automatic age & title update
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dobValue = e.target.value;
    const computedAge = calculateAgeFromDob(dobValue);
    const effectiveAge = computedAge > 0 ? computedAge : formData.age;
    const suggestedTitle = getSuggestedTitlePrefix(effectiveAge, formData.gender, formData.title);
    setFormData(prev => ({
      ...prev,
      dob: dobValue,
      age: effectiveAge,
      title: suggestedTitle,
    }));
  };

  // Handle Gender change with automatic title update
  const handleGenderChange = (newGender: 'ชาย' | 'หญิง' | 'อื่นๆ') => {
    const suggestedTitle = getSuggestedTitlePrefix(formData.age, newGender, formData.title);
    setFormData(prev => ({
      ...prev,
      gender: newGender,
      title: suggestedTitle,
    }));
  };

  // Handle Age change with automatic title update
  const handleAgeChange = (newAge: number) => {
    const safeAge = Math.max(0, newAge || 0);
    const suggestedTitle = getSuggestedTitlePrefix(safeAge, formData.gender, formData.title);
    setFormData(prev => ({
      ...prev,
      age: safeAge,
      title: suggestedTitle,
    }));
  };

  // Handle GPS Geolocation
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('อุปกรณ์หรือเบราว์เซอร์ของคุณไม่รองรับการดึงพิกัด Geolocation');
      return;
    }
    setIsLocating(true);
    setLocationStatus('กำลังตรวจจับพิกัด GPS...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coordsStr = `พิกัด GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        setFormData(prev => ({
          ...prev,
          address: prev.address ? `${prev.address}\n${coordsStr}` : coordsStr
        }));
        setIsLocating(false);
        setLocationStatus('ปักหมุดพิกัดสำเร็จ!');
        setTimeout(() => setLocationStatus(null), 3000);
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setIsLocating(false);
        setLocationStatus('ไม่สามารถระบุพิกัดได้ (กรุณาเปิด GPS/สิทธิ์เข้าถึงตำแหน่ง)');
        setTimeout(() => setLocationStatus(null), 4000);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Immediate synchronous debounce and multi-click lock to prevent duplicate rows
    const now = Date.now();
    if (isSubmittingRef.current || effectiveSaving || (now - lastSubmitTimestampRef.current < 2500)) {
      console.warn('[PatientFormModal] Duplicate submission prevented by debounce/lock guard.');
      return;
    }

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      alert('กรุณากรอกชื่อจริงและนามสกุลของผู้รับการดูแล');
      return;
    }
    if (!formData.hn.trim()) {
      alert('กรุณากรอกรหัส HN หรือกดปุ่มสร้างรหัสอัตโนมัติ');
      return;
    }

    // 2. Lock immediately and activate saving state
    isSubmittingRef.current = true;
    lastSubmitTimestampRef.current = now;
    setLocalSaving(true);

    try {
      const birthAge = formData.dob ? calculateAgeFromDob(formData.dob) : 0;
      const effectiveAge = birthAge > 0 ? birthAge : (Number(formData.age) || 0);
      const cleanFirst = formData.firstName.replace(/^(ด\.?ช\.?|ด\.?ญ\.?|เด็กชาย|เด็กหญิง|นาย|นางสาว|น\.?ส\.?|นาง|คุณ|น้อง)\s*/i, '').trim();
      const finalTitle = getSuggestedTitlePrefix(effectiveAge, formData.gender, formData.title);
      const formattedNotes = `[เพศ: ${formData.gender}] ${formData.notes}`.trim();
      const parsedWeight = parseFloat(String(formData.weight).trim());
      const parsedHeight = parseFloat(String(formData.height).trim());

      const patientPayload = {
        id: initialData?.id,
        title: finalTitle,
        firstName: cleanFirst,
        lastName: formData.lastName.trim(),
        nickname: formData.nickname.trim(),
        gender: formData.gender,
        dob: formData.dob,
        age: effectiveAge,
        citizenId: formData.citizenId.trim() || undefined,
        phone: formData.parentPhone.trim() || formData.phone.trim(),
        parentPhone: formData.parentPhone.trim() || formData.phone.trim(),
        parentName: formData.parentName.trim() || undefined,
        address: formData.address.trim() || undefined,
        hn: formData.hn.trim(),
        weight: isNaN(parsedWeight) ? 0 : parsedWeight,
        height: isNaN(parsedHeight) ? 0 : parsedHeight,
        startDate: formData.startDate,
        status: formData.status || 'active',
        notes: formattedNotes,
        firstAppointmentDate: formData.firstAppointmentDate,
        firstAppointmentTime: formData.firstAppointmentTime,
        assignedTasks: initialData?.assignedTasks || [],
        photoBefore: initialData?.photoBefore || '',
        photoAfter: initialData?.photoAfter || '',
      };

      await onSave(patientPayload);
    } catch (err) {
      console.error('[PatientFormModal] Error saving patient:', err);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLocalSaving(false);
      // Keep debounce lock active for 1.5 seconds to prevent double clicks during close transition
      setTimeout(() => {
        isSubmittingRef.current = false;
      }, 1500);
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div 
          id="patient-form-modal-backdrop"
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !effectiveSaving) {
              onClose();
            }
          }}
        >
          <motion.div
            id="patient-form-modal-card"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-auto flex flex-col overflow-hidden border border-purple-100/80 my-auto h-[90vh] max-h-[90vh] relative z-10 box-border"
            style={{
              maxHeight: '90vh',
              height: '90vh'
            }}
          >
            {/* Header: Always Sticky at Top */}
            <div 
              id="patient-form-modal-header"
              className="bg-white px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 flex items-center justify-between shrink-0 z-20 shadow-2xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0 shadow-inner">
                  {mode === 'add' ? (
                    <UserPlus className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : (
                    <UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg md:text-xl font-black text-slate-900 truncate">
                    {mode === 'add' ? 'ลงทะเบียนผู้รับการดูแลใหม่' : 'แก้ไขข้อมูลประวัติผู้รับการดูแล'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium truncate">
                    {mode === 'add' 
                      ? 'บันทึกสารบบข้อมูลพื้นฐาน EF Line & OMT Growth Lab' 
                      : `ปรับปรุงข้อมูลประจำตัวคนไข้ • HN: ${formData.hn || '-'}`}
                  </p>
                </div>
              </div>
              <button
                id="patient-form-modal-close-btn"
                type="button"
                onClick={onClose}
                disabled={effectiveSaving}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="ปิดหน้าต่าง"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form wrapping scrollable content and sticky footer */}
            <form 
              id="patient-registration-comprehensive-form"
              onSubmit={handleSubmit}
              className="flex flex-col flex-1 min-h-0 overflow-hidden"
            >
              {/* Scrollable Form Body with touch momentum */}
              <div 
                ref={scrollRef}
                id="patient-form-modal-scrollable-body"
                className="p-4 sm:p-6 md:p-7 overflow-y-auto flex-1 bg-slate-50/60 space-y-5 box-border"
                style={{ 
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehaviorY: 'contain'
                }}
              >
                {/* ═══════════════════════════════════════════════════════════
                    [ส่วนที่ 1: ข้อมูลพื้นฐานและรหัสคนไข้] (ต้องอยู่บนสุด)
                ═══════════════════════════════════════════════════════════ */}
                <div className="bg-white p-4 sm:p-5 md:p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h4 className="text-xs sm:text-sm font-black text-purple-900 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-purple-600" />
                      ส่วนที่ 1: ข้อมูลพื้นฐานและรหัสคนไข้
                    </h4>
                    <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
                      ข้อมูลสำคัญประจำตัว
                    </span>
                  </div>

                  {/* แถวที่ 1: รหัส HN พร้อมระบบ Generate อัตโนมัติ */}
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <label className="font-bold text-slate-800 text-xs flex items-center gap-1">
                        รหัสประจำตัว HN <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const newHn = generateHN(existingPatients);
                          setFormData(prev => ({ ...prev, hn: newHn }));
                        }}
                        className="text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-lg border border-purple-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        สร้างรหัส HN อัตโนมัติ
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={formData.hn}
                        onChange={(e) => setFormData({ ...formData, hn: e.target.value })}
                        placeholder="ตัวอย่าง HN-00001"
                        className="w-full p-2.5 sm:p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs sm:text-sm font-bold text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:bg-white transition-all"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      * สามารถแก้ไขหรือพิมพ์รหัส HN เองได้ หรือกดปุ่มสร้างอัตโนมัติ
                    </p>
                  </div>

                  {/* แถวที่ 2: คำนำหน้า, ชื่อจริง, นามสกุล, ชื่อเล่น */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                    {/* คำนำหน้า */}
                    <div>
                      <label className="font-bold text-slate-800 block mb-1 text-xs">
                        คำนำหน้า <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-purple-500/20 transition-all font-medium"
                      >
                        <option value="ด.ช.">ด.ช.</option>
                        <option value="ด.ญ.">ด.ญ.</option>
                        <option value="นาย">นาย</option>
                        <option value="น.ส.">น.ส.</option>
                        <option value="นาง">นาง</option>
                        <option value="เด็กชาย">เด็กชาย</option>
                        <option value="เด็กหญิง">เด็กหญิง</option>
                        <option value="อื่นๆ">อื่นๆ</option>
                      </select>
                    </div>

                    {/* ชื่อจริง */}
                    <div>
                      <label className="font-bold text-slate-800 block mb-1 text-xs">
                        ชื่อจริง <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="ระบุชื่อจริง"
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-purple-500/20 transition-all font-medium"
                      />
                    </div>

                    {/* นามสกุล */}
                    <div>
                      <label className="font-bold text-slate-800 block mb-1 text-xs">
                        นามสกุล <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="ระบุนามสกุล"
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-purple-500/20 transition-all font-medium"
                      />
                    </div>

                    {/* ชื่อเล่น */}
                    <div>
                      <label className="font-bold text-slate-800 block mb-1 text-xs">
                        ชื่อเล่น
                      </label>
                      <input
                        type="text"
                        value={formData.nickname}
                        onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                        placeholder="เช่น น้องต้นกล้า"
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-purple-500/20 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* แถวที่ 3: เพศ, วันเดือนปีเกิด, คำนวณอายุอัตโนมัติ */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {/* เพศ */}
                    <div>
                      <label className="font-bold text-slate-800 block mb-1 text-xs">
                        เพศ <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) => handleGenderChange(e.target.value as any)}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-purple-500/20 transition-all font-medium"
                      >
                        <option value="ชาย">👦 ชาย</option>
                        <option value="หญิง">👧 หญิง</option>
                        <option value="อื่นๆ">อื่นๆ</option>
                      </select>
                    </div>

                    {/* วัน/เดือน/ปีเกิด (DOB) */}
                    <div>
                      <label className="font-bold text-slate-800 block mb-1 text-xs">
                        วัน/เดือน/ปีเกิด (พร้อมคำนวณอายุ) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.dob}
                        onChange={handleDobChange}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-purple-500/20 transition-all font-medium"
                      />
                    </div>

                    {/* คำนวณอายุอัตโนมัติ */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-800 text-xs">
                          อายุ (ปี) <span className="text-rose-500">*</span>
                        </label>
                        <span className={getAgeGroupBadge(formData.age).badgeClass}>
                          {getAgeGroupBadge(formData.age).tag}
                        </span>
                      </div>
                      <input
                        type="number"
                        required
                        min={0}
                        max={120}
                        value={formData.age}
                        onChange={(e) => handleAgeChange(Number(e.target.value))}
                        className="w-full p-2.5 bg-purple-50/50 border border-purple-200 rounded-xl text-xs sm:text-sm text-purple-900 font-bold focus:ring-2 focus:ring-purple-500/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Citizen ID (เลขบัตรประชาชน 13 หลัก) */}
                  <div>
                    <label className="font-bold text-slate-800 block mb-1 text-xs">
                      เลขประจำตัวประชาชน 13 หลัก (Citizen ID)
                    </label>
                    <input
                      type="text"
                      maxLength={17}
                      value={formData.citizenId}
                      onChange={(e) => setFormData({ ...formData, citizenId: e.target.value })}
                      placeholder="เช่น 1100200123456"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      * ปลอดภัย: ในหน้าตารางทั่วไปจะแสดงแบบเซ็นเซอร์รหัสเพื่อคุ้มครองข้อมูลส่วนบุคคล
                    </p>
                  </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════
                    [ส่วนที่ 2: ข้อมูลติดต่อและผู้ปกครอง]
                ═══════════════════════════════════════════════════════════ */}
                <div className="bg-white p-4 sm:p-5 md:p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h4 className="text-xs sm:text-sm font-black text-purple-900 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-purple-600" />
                      ส่วนที่ 2: ข้อมูลติดต่อและผู้ปกครอง
                    </h4>
                    <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                      ช่องทางติดต่อ & ที่อยู่
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* เบอร์โทรศัพท์ */}
                    <div>
                      <label className="font-bold text-slate-800 block mb-1 text-xs">
                        เบอร์โทรศัพท์คนไข้ / ผู้ปกครอง <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.parentPhone || formData.phone}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          parentPhone: e.target.value, 
                          phone: e.target.value 
                        })}
                        placeholder="เช่น 081-234-5678"
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-purple-500/20 font-medium transition-all"
                      />
                    </div>

                    {/* ชื่อผู้ปกครอง / ความสัมพันธ์ */}
                    <div>
                      <label className="font-bold text-slate-800 block mb-1 text-xs">
                        ชื่อผู้ปกครอง / ความสัมพันธ์
                      </label>
                      <input
                        type="text"
                        value={formData.parentName}
                        onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                        placeholder="เช่น คุณแม่ รุ่งนภา (มารดา)"
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-purple-500/20 font-medium transition-all"
                      />
                    </div>
                  </div>

                  {/* ที่อยู่ปัจจุบันพร้อมปุ่มปักหมุด GPS */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-slate-800 text-xs flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-purple-600" />
                        ที่อยู่ปัจจุบัน (Address)
                      </label>
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={isLocating}
                        className="text-[11px] bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold px-3 py-1 rounded-lg border border-indigo-200 transition-colors inline-flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-2xs"
                      >
                        {isLocating ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>กำลังดึงพิกัด...</span>
                          </>
                        ) : (
                          <>
                            <span>📍 ปักหมุดพิกัด GPS ปัจจุบัน</span>
                          </>
                        )}
                      </button>
                    </div>

                    {locationStatus && (
                      <p className="text-[11px] font-bold text-indigo-600 mb-1.5 bg-indigo-50/70 p-1.5 rounded-lg">
                        {locationStatus}
                      </p>
                    )}

                    <textarea
                      rows={2}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="ระบุที่อยู่ปัจจุบัน หรือที่อยู่สำหรับจัดส่งอุปกรณ์ฝึก..."
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-purple-500/20 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════
                    [ส่วนที่ 3: ข้อมูลร่างกายและการรักษา]
                ═══════════════════════════════════════════════════════════ */}
                <div className="bg-white p-4 sm:p-5 md:p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h4 className="text-xs sm:text-sm font-black text-purple-900 flex items-center gap-2">
                      <Scale className="w-4 h-4 text-purple-600" />
                      ส่วนที่ 3: ข้อมูลร่างกายและการรักษา
                    </h4>
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                      สรีระ & แผนการดูแล
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {/* น้ำหนัก (kg) */}
                    <div>
                      <label className="font-bold text-slate-800 block mb-1 text-xs flex items-center gap-1">
                        <Scale className="w-3 h-3 text-slate-400" />
                        น้ำหนัก (kg)
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="เช่น 35.5"
                        value={formData.weight}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || /^\d*\.?\d*$/.test(val)) {
                            setFormData(prev => ({ ...prev, weight: val }));
                          }
                        }}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-purple-500/20 font-medium transition-all"
                      />
                    </div>

                    {/* ส่วนสูง (cm) */}
                    <div>
                      <label className="font-bold text-slate-800 block mb-1 text-xs flex items-center gap-1">
                        <Ruler className="w-3 h-3 text-slate-400" />
                        ส่วนสูง (cm)
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="เช่น 138"
                        value={formData.height}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || /^\d*\.?\d*$/.test(val)) {
                            setFormData(prev => ({ ...prev, height: val }));
                          }
                        }}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-purple-500/20 font-medium transition-all"
                      />
                    </div>

                    {/* วันที่เริ่มโปรแกรม (ค่าเริ่มต้นคือวันปัจจุบัน) */}
                    <div>
                      <label className="font-bold text-slate-800 block mb-1 text-xs flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        วันที่เริ่มโปรแกรม
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-purple-500/20 font-medium transition-all"
                      />
                    </div>

                    {/* สถานะในโปรแกรม */}
                    <div>
                      <label className="font-bold text-slate-800 block mb-1 text-xs">
                        สถานะในโปรแกรม
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-purple-500/20 font-medium transition-all"
                      >
                        <option value="active">🟢 กำลังรับการดูแล</option>
                        <option value="on-hold">🟡 พักการรักษา</option>
                        <option value="completed">🔵 สิ้นสุดการรักษา</option>
                      </select>
                    </div>
                  </div>

                  {/* ข้อมูลเพิ่มเติม / ประวัติการแพ้ / ข้อควรระวัง */}
                  <div>
                    <label className="font-bold text-slate-800 block mb-1 text-xs flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      ข้อมูลเพิ่มเติม / ประวัติการแพ้ / ข้อควรระวัง
                    </label>
                    <textarea
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="ระบุข้อควรระวัง ประวัติสุขภาพ หรือเป้าหมายการรักษา..."
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-purple-500/20 transition-all font-medium"
                    />
                  </div>

                  {/* นัดหมายตรวจติดตามครั้งแรก (First Appointment) */}
                  <div className="p-3.5 sm:p-4 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-purple-700" />
                        กำหนดนัดหมายตรวจติดตามความก้าวหน้าครั้งแรก
                      </span>
                      <span className="text-[10px] font-bold text-purple-700 bg-white px-2 py-0.5 rounded-full border border-purple-200">
                        First Appointment
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="font-medium text-slate-700 block mb-1 text-[11px]">
                          วันนัดตรวจติดตาม
                        </label>
                        <input
                          type="date"
                          value={formData.firstAppointmentDate}
                          onChange={(e) => setFormData({ ...formData, firstAppointmentDate: e.target.value })}
                          className="w-full p-2.5 bg-white border border-purple-200 rounded-lg text-xs font-bold text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="font-medium text-slate-700 block mb-1 text-[11px]">
                          เวลานัด
                        </label>
                        <input
                          type="time"
                          value={formData.firstAppointmentTime}
                          onChange={(e) => setFormData({ ...formData, firstAppointmentTime: e.target.value })}
                          className="w-full p-2.5 bg-white border border-purple-200 rounded-lg text-xs font-bold text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════════
                  [ส่วนที่ 4: ปุ่มกดยืนยัน (Action Buttons)] (ตรึงด้านล่างเสมอ)
              ═══════════════════════════════════════════════════════════ */}
              <div 
                id="patient-form-modal-sticky-footer"
                className="bg-white px-5 py-4 sm:px-6 sm:py-5 border-t border-slate-200/90 flex items-center justify-end gap-3 shrink-0 z-20 shadow-md sticky bottom-0"
              >
                <button
                  id="patient-form-modal-cancel-btn"
                  type="button"
                  onClick={onClose}
                  disabled={effectiveSaving}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ยกเลิก / ปิด
                </button>
                <button
                  id="patient-form-modal-submit-btn"
                  type="submit"
                  disabled={effectiveSaving}
                  aria-busy={effectiveSaving}
                  className={`px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm text-white transition-all flex items-center gap-2 select-none ${
                    effectiveSaving
                      ? 'bg-purple-400 opacity-75 cursor-not-allowed pointer-events-none shadow-none ring-2 ring-purple-300/40'
                      : 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800 shadow-md shadow-purple-600/30 cursor-pointer'
                  }`}
                >
                  {effectiveSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>⏳ กำลังบันทึกข้อมูล... ห้ามกดซ้ำ</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>💾 บันทึกข้อมูลคนไข้</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}
