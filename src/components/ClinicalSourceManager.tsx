import React, { useState, useEffect } from 'react';
import { InceptionDossierModal } from './InceptionDossierModal';
import { 
  ShieldCheck, CheckCircle2, 
  Sparkles, BookOpen, Database, 
  FileText, ClipboardCheck, ArrowRight, UserCheck, Printer,
  X, Layers, ShieldAlert, Award, FileCode, Clock, Check,
  Lock, Unlock, KeyRound, Terminal, Cpu, Server, Code, HardDrive,
  ExternalLink, AlertTriangle, ChevronRight, HelpCircle
} from 'lucide-react';
import { ClinicalSourceDocument } from '../types';

interface ClinicalSourceManagerProps {
  sources?: ClinicalSourceDocument[];
  onUpdateSourceStatus?: (sourceId: string, newStatus: 'PENDING VERIFICATION' | 'VERIFIED CLINICAL SOURCE') => void;
  onAddSource?: (newDoc: ClinicalSourceDocument) => void;
  userRole?: string;
  initialMainTab?: 'deed' | 'architecture';
  onOpenInceptionModal?: () => void;
}

export default function ClinicalSourceManager({ userRole, initialMainTab = 'deed', onOpenInceptionModal }: ClinicalSourceManagerProps) {
  // Main Top-Level Tab State: 'deed' (IP & Handover Deed) vs 'architecture' (Architecture & Successor Guide)
  const [mainTab, setMainTab] = useState<'deed' | 'architecture'>(initialMainTab);

  useEffect(() => {
    if (initialMainTab) {
      setMainTab(initialMainTab);
    }
  }, [initialMainTab]);

  // Architecture Sub-Category Tab (1 to 6)
  const [archTab, setArchTab] = useState<number>(1);

  // Sign-off State (Persisted)
  const [signerName, setSignerName] = useState<string>('');
  const [signerTitle, setSignerTitle] = useState<string>('');
  const [isSigned, setIsSigned] = useState<boolean>(false);
  const [signedDate, setSignedDate] = useState<string>('2 กันยายน พ.ศ. 2569');

  // PIN Access Security Lock State
  const [isPinLockEnabled, setIsPinLockEnabled] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [storedPin, setStoredPin] = useState<string>('1234');
  const [showPinChangeModal, setShowPinChangeModal] = useState<boolean>(false);
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState<boolean>(false);
  const [showFullDocModal, setShowFullDocModal] = useState<boolean>(false);

  // Doctor/Owner status bypass check
  const isDoctorOrOwner = userRole === 'doctor' || userRole === 'owner';

  // Load persistent settings on mount
  useEffect(() => {
    try {
      // Sign-off
      const savedSign = localStorage.getItem('growthlab_clinical_source_signoff');
      if (savedSign) {
        const parsed = JSON.parse(savedSign);
        setSignerName(parsed.signerName || '');
        setSignerTitle(parsed.signerTitle || '');
        setIsSigned(!!parsed.isSigned);
        setSignedDate(parsed.signedDate || '2 กันยายน พ.ศ. 2569');
      }

      // PIN Lock Status
      const savedLock = localStorage.getItem('growthlab_dossier_pin_locked');
      const savedPin = localStorage.getItem('growthlab_dossier_pin');
      
      if (savedPin) {
        setStoredPin(savedPin);
      }
      
      const lockActive = savedLock === 'true';
      setIsPinLockEnabled(lockActive);

      // If PIN lock is not enabled or user is Doctor/Owner, auto-unlock
      if (!lockActive || isDoctorOrOwner) {
        setIsUnlocked(true);
      } else {
        setIsUnlocked(false);
      }
    } catch (e) {
      console.warn('[ProjectDossier] Error loading persistent state:', e);
    }
  }, [userRole, isDoctorOrOwner]);

  // Toggle PIN Lock Protection
  const handleTogglePinLock = () => {
    const nextState = !isPinLockEnabled;
    setIsPinLockEnabled(nextState);
    localStorage.setItem('growthlab_dossier_pin_locked', nextState ? 'true' : 'false');
    if (!nextState) {
      setIsUnlocked(true);
    } else if (!isDoctorOrOwner) {
      setIsUnlocked(false);
    }
  };

  // Submit PIN for unlock
  const handlePinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pinInput.trim() === storedPin) {
      setIsUnlocked(true);
      setPinError('');
      setPinInput('');
    } else {
      setPinError('รหัส PIN ไม่ถูกต้อง (รหัสเริ่มต้นคือ 1234)');
    }
  };

  // Change PIN
  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPinInput.length === 4 && /^\d+$/.test(newPinInput)) {
      setStoredPin(newPinInput);
      localStorage.setItem('growthlab_dossier_pin', newPinInput);
      setPinChangeSuccess(true);
      setTimeout(() => {
        setPinChangeSuccess(false);
        setShowPinChangeModal(false);
        setNewPinInput('');
      }, 1500);
    } else {
      alert('กรุณากรอกรหัส PIN เป็นตัวเลข 4 หลัก');
    }
  };

  // Handle Official Sign-off
  const handleSignOff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signerName.trim()) return;
    const dateStr = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const data = {
      signerName: signerName.trim(),
      signerTitle: signerTitle.trim() || 'ทันตแพทย์ผู้ให้การรักษา / ผู้บริหารคลินิก',
      isSigned: true,
      signedDate: dateStr
    };
    setIsSigned(true);
    setSignedDate(dateStr);
    localStorage.setItem('growthlab_clinical_source_signoff', JSON.stringify(data));
  };

  const handlePrint = () => {
    window.print();
  };

  // Categories for Architecture & Successor Guide
  const archCategories = [
    { id: 1, title: 'ที่มาโครงการจากเก้าอี้ทำฟัน', icon: Sparkles },
    { id: 2, title: 'ไทม์ไลน์การแก้ปัญหา Day 1', icon: Clock },
    { id: 3, title: 'สถาปัตยกรรม Hybrid Cloud', icon: Server },
    { id: 4, title: 'คุณค่าซอร์สโค้ดและ 5 เสาหลัก', icon: Cpu },
    { id: 5, title: 'รายการส่งมอบ 5 เสาหลัก', icon: Layers },
    { id: 6, title: 'คู่มือส่งต่องานทางเทคนิค', icon: Code }
  ];

  const handoverChecklist = [
    {
      id: 'doc-1',
      title: 'Growth Nutrition Score (GNS)',
      type: 'โภชนาการ (Nutrition Engine)',
      status: 'VERIFIED & IMPLEMENTED',
      details: 'ระบบประเมินโภชนาการ 10 ข้อ แยกหมวดกระตุ้น Growth-Promoting และ Growth-Inhibiting สรุปเกรด A/B/C'
    },
    {
      id: 'doc-2',
      title: 'Sleep Assessment & EF Log',
      type: 'การนอนหลับ & EF Trainer',
      status: 'VERIFIED & IMPLEMENTED',
      details: 'ระบบปฏิทิน 31 วัน บันทึกการสวมใส่ EF Trainer และคัดกรองพฤติกรรมการนอนหลับ'
    },
    {
      id: 'doc-3',
      title: 'Exercise & Movement Protocol',
      type: 'การออกกำลังกาย & ปรับท่าทาง',
      status: 'VERIFIED & IMPLEMENTED',
      details: 'แบบประเมินและคลังวิดีโอสาธิตท่าทาง Wall Stand, Bone Loading Jump, Core Stability'
    },
    {
      id: 'doc-4',
      title: 'Orofacial Myofunctional Therapy (OMT)',
      type: 'การฝึกกล้ามเนื้อช่องปาก',
      status: 'VERIFIED & IMPLEMENTED',
      details: 'ระบบติดตามการฝึกกล้ามเนื้อริมฝีปาก ลิ้น และการกลืนตามหลักวิทยาศาสตร์ทันตกรรม'
    },
    {
      id: 'doc-5',
      title: 'Red Flag Warning & Cascading Delete',
      type: 'ความปลอดภัย & การคัดกรอง',
      status: 'VERIFIED & IMPLEMENTED',
      details: 'การแจ้งเตือนเคสเสี่ยงหยุดหายใจขณะหลับ ขาดการฝึก 7 วัน และระบบยกเลิกสิทธิ์ QR Token ถาวร'
    }
  ];

  return (
    <div className="space-y-6 text-left max-w-5xl w-full mx-auto px-3 sm:px-6 md:px-8 pb-16 animate-in fade-in duration-300 break-words overflow-x-hidden">
      
      {/* TOP HEADER & MAIN NAVIGATION TABS */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-7 shadow-2xl text-white border border-amber-500/30 relative overflow-hidden print:hidden">
        
        {/* Background Decorative Crest Icon */}
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
          <Award className="w-56 h-56 text-amber-400" />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400/20 to-purple-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center font-black shrink-0 shadow-inner">
                <ShieldCheck className="w-7 h-7 text-amber-300" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-200 text-[10px] font-black tracking-widest border border-amber-400/30 uppercase mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Project Dossier & System Handover</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  เอกสารสำคัญโครงการ (Project Dossier & Handover)
                </h1>
                <p className="text-xs text-slate-300 font-medium">
                  Growth Lab Clinical Intelligence Platform v1.0 — เอกสารสิทธิ์สถาปัตยกรรมและข้อตกลงส่งมอบระบบ
                </p>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-amber-200 border border-amber-400/30 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <Printer className="w-4 h-4 text-amber-300" />
                <span>พิมพ์ / Save PDF</span>
              </button>

              {/* PIN Security Status Badge */}
              <button
                type="button"
                onClick={handleTogglePinLock}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                  isPinLockEnabled 
                    ? 'bg-amber-500/20 border-amber-400/40 text-amber-300 hover:bg-amber-500/30' 
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                }`}
                title="คลิกเพื่อเปิด/ปิดระบบล็อก PIN"
              >
                {isPinLockEnabled ? <Lock className="w-4 h-4 text-amber-300" /> : <Unlock className="w-4 h-4" />}
                <span className="hidden sm:inline">
                  {isPinLockEnabled ? 'PIN Lock: เปิดใช้งาน' : 'PIN Lock: ปิด'}
                </span>
              </button>
            </div>
          </div>

          {/* MAIN TWO NAVIGATION TABS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => setMainTab('deed')}
              className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 cursor-pointer ${
                mainTab === 'deed'
                  ? 'bg-gradient-to-r from-amber-500/20 via-purple-600/30 to-slate-900 border-amber-400/60 shadow-lg ring-1 ring-amber-400/30'
                  : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-400'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                mainTab === 'deed' ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}>
                <FileText className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-300/80 block">
                  หน้าที่ 1 • Tab 1
                </span>
                <span className={`font-black text-xs sm:text-sm block truncate ${mainTab === 'deed' ? 'text-white' : 'text-slate-300'}`}>
                  บันทึกข้อตกลงและสิทธิ์การส่งมอบระบบ (IP & Deed)
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMainTab('architecture')}
              className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 cursor-pointer ${
                mainTab === 'architecture'
                  ? 'bg-gradient-to-r from-purple-600/30 via-indigo-600/30 to-slate-900 border-purple-400/60 shadow-lg ring-1 ring-purple-400/30'
                  : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-400'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                mainTab === 'architecture' ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-purple-300/80 block">
                  หน้าที่ 2 • Tab 2
                </span>
                <span className={`font-black text-xs sm:text-sm block truncate ${mainTab === 'architecture' ? 'text-white' : 'text-slate-300'}`}>
                  สถาปัตยกรรมระบบและคู่มือส่งต่องาน (Architecture & Guide)
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* PIN LOCK OVERLAY SCREEN (When PIN Lock is ON and user is NOT unlocked) */}
      {isPinLockEnabled && !isUnlocked && (
        <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 rounded-3xl p-8 sm:p-12 border border-amber-500/30 text-white text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 my-4 max-w-md mx-auto">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-400/40 text-amber-300 mx-auto flex items-center justify-center shadow-lg">
            <Lock className="w-10 h-10 text-amber-400" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 text-[10px] font-black uppercase tracking-wider border border-amber-400/30">
              <KeyRound className="w-3.5 h-3.5 text-amber-300" />
              <span>Protected Executive Chamber</span>
            </div>
            <h2 className="text-xl font-black text-white">ล็อกการเข้าถึงหน้านี้ด้วย PIN</h2>
            <p className="text-xs text-slate-300 max-w-xs mx-auto">
              กรุณากรอกรหัส PIN 4 หลักเพื่อเปิดอ่านเอกสารสำคัญสิทธิ์ระบบโครงการ (รหัสเริ่มต้น: <strong className="text-amber-300">1234</strong>)
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4 max-w-xs mx-auto">
            <div className="relative">
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError('');
                }}
                placeholder="• • • •"
                className="w-full text-center tracking-[1em] text-2xl font-black py-3 bg-black/50 border border-amber-400/40 rounded-2xl text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:tracking-normal placeholder:text-slate-600"
              />
            </div>

            {pinError && (
              <p className="text-xs text-rose-400 font-bold bg-rose-950/80 p-2.5 rounded-xl border border-rose-800/50">
                {pinError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              <Unlock className="w-4 h-4 text-slate-950" />
              <span>ปลดล็อกเข้าสู่เอกสาร</span>
            </button>
          </form>

          <p className="text-[11px] text-slate-400 italic">
            * ระบบล็อก PIN ถูกเปิดใช้งานโดยแพทย์เพื่อป้องกันผู้ไม่ได้รับอนุญาตเข้ากดดู
          </p>
        </div>
      )}

      {/* CONTENT AREA (Rendered only when unlocked or PIN lock disabled) */}
      {(!isPinLockEnabled || isUnlocked) && (
        <div className="space-y-6">

          {/* ======================================================== */}
          {/* TAB 1: IP & HANDOVER DEED (ใบรับรองการส่งมอบระบบ) */}
          {/* ======================================================== */}
          {mainTab === 'deed' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* OFFICIAL HANDOVER CERTIFICATE CARD */}
              <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-10 border-2 border-amber-400/50 shadow-2xl text-white space-y-8 relative overflow-hidden print:border-slate-800 print:bg-white print:text-slate-900">
                
                {/* Background Decorative Crest / Watermark */}
                <div className="absolute -top-10 -right-10 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none print:hidden" />
                
                {/* 1. Certificate Header Badge & Seal */}
                <div className="text-center space-y-4 border-b border-amber-500/20 pb-6 relative z-10 print:border-slate-300">
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-amber-500/20 border border-amber-400/50 px-4 py-1.5 rounded-full text-xs font-black text-amber-300 uppercase tracking-widest shadow-inner print:bg-amber-100 print:text-amber-900 print:border-amber-300">
                    <Award className="w-4 h-4 text-amber-300 print:text-amber-700" />
                    <span>OFFICIAL SYSTEM HANDOVER CERTIFICATE</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-yellow-100 tracking-tight print:text-slate-900 print:bg-none">
                    ใบรับรองการส่งมอบระบบอย่างเป็นทางการ
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl mx-auto print:text-slate-600">
                    เอกสารสำคัญแสดงการส่งมอบทรัพย์สินทางปัญญา ซอร์สโค้ด และสิทธิ์การใช้งานแอปพลิเคชัน
                  </p>
                </div>

                {/* 2. Official Handover Summary Card Grid (5 Key Specs) */}
                <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-6 sm:p-8 space-y-5 relative z-10 shadow-lg print:bg-slate-50 print:border-slate-300 print:text-slate-900">
                  <div className="flex items-center gap-2.5 text-amber-300 font-black text-sm uppercase tracking-wider border-b border-white/10 pb-3 print:text-amber-800 print:border-slate-200">
                    <ShieldCheck className="w-5 h-5 text-amber-400" />
                    <h3>รายละเอียดข้อมูลการส่งมอบระบบ (System Delivery Credentials)</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 text-xs sm:text-sm">
                    
                    {/* Project Name */}
                    <div className="p-4 bg-black/40 rounded-xl border border-amber-400/20 space-y-1 md:col-span-2 print:bg-white print:border-slate-200">
                      <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider block print:text-amber-700">
                        • ชื่อโครงการ (Project Title)
                      </span>
                      <p className="text-base sm:text-lg font-black text-white print:text-slate-900">
                        Growth Lab Clinical Growth Intelligence Platform v1.0
                      </p>
                    </div>

                    {/* Creator & IP Owner */}
                    <div className="p-4 bg-black/40 rounded-xl border border-amber-400/20 space-y-1 print:bg-white print:border-slate-200">
                      <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider block print:text-amber-700">
                        • ผู้สร้างสรรค์และเจ้าของสิทธิ์ (Creator & IP Owner)
                      </span>
                      <p className="text-sm sm:text-base font-extrabold text-white print:text-slate-900">
                        คุณนิรมล เลิศล้ำ
                      </p>
                      <p className="text-xs text-slate-300 font-medium print:text-slate-600">
                        Lead System Architect & IP Owner
                      </p>
                    </div>

                    {/* AI Partner */}
                    <div className="p-4 bg-black/40 rounded-xl border border-purple-400/20 space-y-1 print:bg-white print:border-slate-200">
                      <span className="text-[11px] font-black text-purple-300 uppercase tracking-wider block print:text-purple-700">
                        • พันธมิตรสถาปัตยกรรมร่วมพัฒนา (Co-Engineering Partner)
                      </span>
                      <p className="text-sm sm:text-base font-extrabold text-white print:text-slate-900">
                        Gemini Spark Engine
                      </p>
                      <p className="text-xs text-slate-300 font-medium print:text-slate-600">
                        AI Co-Engineering Partner
                      </p>
                    </div>

                    {/* Licensee Clinic */}
                    <div className="p-4 bg-black/40 rounded-xl border border-emerald-400/20 space-y-1 print:bg-white print:border-slate-200">
                      <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider block print:text-emerald-700">
                        • ผู้รับมอบสิทธิ์การใช้งาน (Licensee)
                      </span>
                      <p className="text-sm sm:text-base font-extrabold text-white print:text-slate-900">
                        คลินิกทันตกรรมภาสุข
                      </p>
                      <p className="text-xs text-slate-300 font-medium print:text-slate-600">
                        Internal Non-Exclusive Clinic License
                      </p>
                    </div>

                    {/* Delivery Date */}
                    <div className="p-4 bg-black/40 rounded-xl border border-amber-400/20 space-y-1 print:bg-white print:border-slate-200">
                      <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider block print:text-amber-700">
                        • วันที่ส่งมอบระบบ (Handover Date)
                      </span>
                      <p className="text-sm sm:text-base font-extrabold text-white print:text-slate-900">
                        2 กันยายน พ.ศ. 2569
                      </p>
                      <p className="text-xs text-slate-300 font-medium print:text-slate-600">
                        Official Delivery Completion Date
                      </p>
                    </div>

                  </div>
                </div>

                {/* 3. Action Buttons Section (ปุ่มปฏิบัติการหลัก) */}
                <div className="flex flex-col sm:flex-row gap-4 relative z-10 print:hidden">
                  
                  {/* Primary Link Button to Official Handover Dossier */}
                  <a
                    href="https://docs.google.com/document/d/1DbUSgaU0FI3BKbi8SJnt1xrahNw3J38mydAAjzRCwYk/preview"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 p-4 rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-600 hover:to-indigo-600 text-white font-black text-xs sm:text-sm shadow-xl transition-all border border-purple-400/40 flex items-center justify-center gap-3 cursor-pointer group active:scale-95 no-underline"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <FileText className="w-5 h-5 text-amber-300" />
                    </div>
                    <div className="text-left">
                      <span className="block font-black text-amber-300 text-[10px] uppercase tracking-wider">Official Live Document</span>
                      <span className="block font-extrabold text-white sm:text-base">📄 เปิดอ่าน / ดาวน์โหลดเอกสารโครงการฉบับล่าสุด (Official Handover Dossier)</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-purple-200 ml-auto" />
                  </a>

                  {/* Print / Download PDF */}
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl transition-all border border-amber-300/60 flex items-center justify-center gap-3 cursor-pointer group active:scale-95 shrink-0"
                  >
                    <div className="w-8 h-8 rounded-xl bg-slate-950/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Printer className="w-4 h-4 text-slate-950" />
                    </div>
                    <div className="text-left">
                      <span className="block font-black text-slate-900/80 text-[10px] uppercase tracking-wider">Official Print & PDF</span>
                      <span className="block font-extrabold text-slate-950">🖨 พิมพ์ / ดาวน์โหลด PDF</span>
                    </div>
                  </button>

                </div>

                {/* 4. OFFICIAL SIGN-OFF CHAMBER (ช่องลงนามรับมอบ 2 ฝั่ง) */}
                <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-amber-500/10 border-2 border-amber-400/30 rounded-2xl p-6 sm:p-8 space-y-6 relative z-10 print:bg-white print:border-slate-300 print:text-slate-900">
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-400/20 pb-4 print:border-slate-200">
                    <div className="flex items-center gap-2 text-amber-300 font-black text-base print:text-amber-900">
                      <UserCheck className="w-6 h-6 text-amber-400 print:text-amber-700" />
                      <h3>ช่องลงนามรับมอบระบบทางการ (Official Handover Sign-Off Chamber)</h3>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                      isSigned 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 print:bg-emerald-100 print:text-emerald-800' 
                        : 'bg-amber-500/20 text-amber-200 border-amber-400/40 print:bg-amber-100 print:text-amber-800'
                    }`}>
                      {isSigned ? '✓ Officially Signed & Verified' : 'Pending Sign-Off'}
                    </span>
                  </div>

                  {/* 2-Column Side-by-Side Signature Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                    
                    {/* Side 1: Grantor / Developer (คุณนิรมล เลิศล้ำ) */}
                    <div className="bg-black/50 p-6 rounded-2xl border border-amber-400/30 space-y-4 flex flex-col justify-between print:bg-white print:border-slate-300">
                      <div className="space-y-3">
                        <span className="px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-wider inline-block print:bg-amber-100 print:text-amber-800">
                          ฝั่งผู้ส่งมอบ (Grantor & Lead Architect)
                        </span>

                        <div className="pt-2 border-b border-white/10 pb-3 print:border-slate-200">
                          <p className="text-xs text-slate-400 font-medium">ชื่อ-นามสกุล:</p>
                          <h4 className="text-lg font-black text-white print:text-slate-900">คุณนิรมล เลิศล้ำ</h4>
                          <p className="text-xs text-amber-300 font-bold print:text-amber-800">
                            Lead System Architect & Intellectual Property Owner
                          </p>
                        </div>

                        <div className="space-y-1 text-xs text-slate-300 print:text-slate-600">
                          <p>• ผู้ถือครองสิทธิ์สถาปัตยกรรมระบบและซอร์สโค้ด</p>
                          <p>• ผู้ลงนามส่งมอบสิทธิ์การใช้งานแอปพลิเคชัน</p>
                        </div>
                      </div>

                      {/* Signature Area */}
                      <div className="pt-6 border-t border-dashed border-amber-400/30 text-center space-y-2 print:border-slate-300">
                        <div className="font-serif italic text-amber-200 text-lg font-bold tracking-widest print:text-slate-800">
                          ( คุณนิรมล เลิศล้ำ )
                        </div>
                        <p className="text-[11px] text-emerald-400 font-bold flex items-center justify-center gap-1 print:text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>ลงนามส่งมอบสิทธิ์สมบูรณ์เรียบร้อยแล้ว</span>
                        </p>
                        <p className="text-[10px] text-slate-400">
                          วันที่ส่งมอบ: 2 กันยายน พ.ศ. 2569
                        </p>
                      </div>
                    </div>

                    {/* Side 2: Recipient / Licensee (ทพญ. นภาพร วรรณษา / คลินิกทันตกรรมภาสุข) */}
                    <div className="bg-black/50 p-6 rounded-2xl border border-emerald-400/30 space-y-4 flex flex-col justify-between print:bg-white print:border-slate-300">
                      <div className="space-y-3">
                        <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider inline-block print:bg-emerald-100 print:text-emerald-800">
                          ฝั่งผู้รับมอบ (Recipient & Clinic Licensee)
                        </span>

                        <div className="pt-2 border-b border-white/10 pb-3 print:border-slate-200">
                          <p className="text-xs text-slate-400 font-medium">ผู้รับมอบสิทธิ์ / หน่วยงาน:</p>
                          <h4 className="text-lg font-black text-white print:text-slate-900">
                            {signerName || 'ทพญ. นภาพร วรรณษา'}
                          </h4>
                          <p className="text-xs text-emerald-300 font-bold print:text-emerald-800">
                            {signerTitle || 'ทันตแพทย์ผู้บริหาร คลินิกทันตกรรมภาสุข'}
                          </p>
                        </div>

                        <div className="space-y-1 text-xs text-slate-300 print:text-slate-600">
                          <p>• สิทธิ์การใช้งานระบบภายในคลินิกทันตกรรมภาสุข</p>
                          <p>• ได้รับการปฐมนิเทศและคำแนะนำการดูแลระบบแล้ว</p>
                        </div>
                      </div>

                      {/* Signature / Sign-off Interaction */}
                      {isSigned ? (
                        <div className="pt-6 border-t border-dashed border-emerald-400/30 text-center space-y-2 print:border-slate-300">
                          <div className="font-serif italic text-emerald-200 text-lg font-bold tracking-widest print:text-slate-800">
                            ( {signerName} )
                          </div>
                          <p className="text-[11px] text-emerald-400 font-bold flex items-center justify-center gap-1 print:text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>ลงนามรับมอบสิทธิ์สมบูรณ์เรียบร้อยแล้ว</span>
                          </p>
                          <p className="text-[10px] text-slate-400">
                            วันที่รับมอบ: {signedDate}
                          </p>
                        </div>
                      ) : (
                        <form onSubmit={handleSignOff} className="pt-4 border-t border-dashed border-emerald-400/30 space-y-3 print:hidden">
                          <p className="text-[11px] text-amber-200 font-bold">
                            ยืนยันชื่อและตำแหน่งผู้ลงนามรับมอบ:
                          </p>
                          <input
                            type="text"
                            required
                            value={signerName}
                            onChange={(e) => setSignerName(e.target.value)}
                            placeholder="ทพญ. นภาพร วรรณษา"
                            className="w-full px-3 py-2 bg-slate-900 border border-emerald-400/40 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                          />
                          <input
                            type="text"
                            value={signerTitle}
                            onChange={(e) => setSignerTitle(e.target.value)}
                            placeholder="ทันตแพทย์ผู้บริหาร คลินิกทันตกรรมภาสุข"
                            className="w-full px-3 py-2 bg-slate-900 border border-emerald-400/40 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                          />
                          <button
                            type="submit"
                            className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                          >
                            <UserCheck className="w-4 h-4 text-slate-950" />
                            <span>ลงนามรับมอบระบบ (Sign Handover Deed)</span>
                          </button>
                        </form>
                      )}
                    </div>

                  </div>
                </div>

                {/* 5. PIN Lock Management Bar */}
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs relative z-10 print:hidden">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs">ระบบล็อกความปลอดภัยด้วยรหัส PIN (PIN Access Lock)</h4>
                      <p className="text-slate-400 text-[11px]">
                        {isPinLockEnabled 
                          ? 'เปิดการล็อก PIN (1234) เพื่อป้องกันผู้ไม่ได้รับอนุญาตเปิดดู' 
                          : 'ปิดการล็อก PIN บุคลากรที่มีสิทธิ์เข้าถึงสามารถเปิดดูเอกสารได้'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowPinChangeModal(true)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all border border-slate-700 cursor-pointer"
                    >
                      เปลี่ยน PIN
                    </button>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isPinLockEnabled} 
                        onChange={handleTogglePinLock}
                        className="sr-only peer" 
                      />
                      <div className="w-10 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: ARCHITECTURE & SUCCESSOR GUIDE (สถาปัตยกรรม & ส่งต่องาน) */}
          {/* ======================================================== */}
          {mainTab === 'architecture' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Architecture Nav Categories Bar */}
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex overflow-x-auto gap-2 scrollbar-none print:hidden">
                {archCategories.map((cat) => {
                  const IconComp = cat.icon;
                  const isCurrent = archTab === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setArchTab(cat.id)}
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                        isCurrent 
                          ? 'bg-purple-700 text-white shadow-md' 
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <IconComp className={`w-4 h-4 ${isCurrent ? 'text-amber-300' : 'text-slate-500'}`} />
                      <span>{cat.id}. {cat.title}</span>
                    </button>
                  );
                })}
              </div>

              {/* ARCHITECTURE SECTION CONTENTS */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                
                {/* 1. ORIGIN FROM DENTAL CHAIR */}
                {archTab === 1 && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div className="flex items-center gap-3 text-purple-700 font-black text-xl border-b border-purple-100 pb-3">
                      <Sparkles className="w-6 h-6 text-purple-700" />
                      <h3>หมวดที่ 1: ที่มาโครงการจากเก้าอี้ทำฟัน (Origin & Frontline Vision)</h3>
                    </div>

                    <div className="space-y-4 text-slate-700 leading-relaxed text-sm">
                      <p>
                        <strong>โครงการ Growth Lab Intelligence Platform</strong> เกิดขึ้นจากเจตนารมณ์ในการแก้ปัญหาจริงจากข้างเก้าอี้ทำฟัน (Frontline Dental Chair) โดยทันตแพทย์จัดฟันและทีมงานคลินิก ที่เผชิญกับอุปสรรคของการติดตามผลการรักษาการปรับโครงสร้างใบหน้า ระบบกล้ามเนื้อช่องปาก (Orofacial Myofunctional Therapy - OMT) การใส่อุปกรณ์ EF Trainer โภชนาการ (Growth Nutrition Score - GNS) และการออกกำลังกายกระตุ้นโกรทฮอร์โมนของเด็ก
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-2">
                          <h4 className="font-black text-purple-900 text-sm flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-purple-700" />
                            การเปลี่ยนคำแนะนำทางการแพทย์สู่ขั้นตอนปฏิบัติจริง
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            คำแนะนำทางการแพทย์มักถูกลืมเมื่อคนไข้กลับบ้าน Growth Lab จึงแปลงคำสั่งแพทย์เป็นปฏิทินบันทึก 31 วัน แบบฟอร์ม GNS 10 ข้อ และวิดีโอสาธิตท่าฝึก เพื่อให้ผู้ปกครองและเด็กทำตามได้ง่ายและต่อเนื่อง
                          </p>
                        </div>

                        <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-2">
                          <h4 className="font-black text-indigo-900 text-sm flex items-center gap-1.5">
                            <Database className="w-4 h-4 text-indigo-700" />
                            สะพานเชื่อมโยงข้อมูลบ้านและคลินิก
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            ระบบรวบรวมข้อมูลการฝึกประจำวันจากบ้าน ซิงค์ตรงสู่หน้าจอทันตแพทย์ในคลินิก ช่วยให้ทันตแพทย์เห็นพัฒนาการและแนวโน้มความร่วมมือของเด็กได้อย่างชัดเจน
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. DAY 1 TROUBLESHOOTING TIMELINE */}
                {archTab === 2 && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div className="flex items-center gap-3 text-indigo-700 font-black text-xl border-b border-indigo-100 pb-3">
                      <Clock className="w-6 h-6 text-indigo-700" />
                      <h3>หมวดที่ 2: ไทม์ไลน์การแก้ปัญหา Day 1 (Day 1 Troubleshooting Log)</h3>
                    </div>

                    <div className="space-y-4 text-slate-700 text-sm">
                      <p>
                        ย้อนรอยไทม์ไลน์พัฒนาการของระบบ Growth Lab จากจุดเริ่มต้นการแก้ปัญหาความยุ่งยากของเอกสารกระดาษ สู่อัลกอริทึมดิจิทัลสมบูรณ์แบบ:
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                          <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                            Phase 1 • Day 1
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm">แปลงเกณฑ์ GNS 10 ข้อ สู่ระบบดิจิทัล</h4>
                          <p className="text-xs text-slate-600">
                            ออกแบบสูตรคำนวณโภชนาการกระตุ้นโกรทฮอร์โมน (Growth-Promoting) และอาหารขัดขวาง (Growth-Inhibiting) สรุปผลเกรด A/B/C อัตโนมัติ
                          </p>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                          <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                            Phase 2
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm">ระบบปฏิทินสวมใส่ EF Trainer 31 วัน</h4>
                          <p className="text-xs text-slate-600">
                            พัฒนาตารางติดตามความร่วมมือการใส่อุปกรณ์ EF Trainer และประเมินพฤติกรรมการนอนหลับและการอ้าปากหายใจ
                          </p>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                          <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                            Phase 3
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm">คัดกรองเคส Red Flag & แจ้งเตือน</h4>
                          <p className="text-xs text-slate-600">
                            ตั้งกฎตรวจจับเคสเสี่ยงหยุดหายใจขณะหลับ (OSA) และระบบแจ้งเตือนเคสขาดการส่งการบ้านเกิน 7 วัน
                          </p>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                          <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                            Phase 4
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm">ระบบ Local-First & Cloud Sync</h4>
                          <p className="text-xs text-slate-600">
                            จัดเก็บข้อมูลแบบสองชั้น บันทึกลง LocalStorage ถาวร พร้อมระบบซิงค์ Google Sheets Webhook ป้องกันข้อมูลหาย 100%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. HYBRID CLOUD ARCHITECTURE */}
                {archTab === 3 && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div className="flex items-center gap-3 text-blue-700 font-black text-xl border-b border-blue-100 pb-3">
                      <Server className="w-6 h-6 text-blue-700" />
                      <h3>หมวดที่ 3: สถาปัตยกรรมระบบ Hybrid Cloud (Google Sheets + Firestore + Cloud Run)</h3>
                    </div>

                    <div className="space-y-4 text-slate-700 text-sm">
                      <p>
                        โครงสร้างสถาปัตยกรรมระบบ Growth Lab ถูกออกแบบให้ทำงานแบบ <strong>Hybrid Cloud Architecture</strong> มีความยืดหยุ่นสูง รวดเร็ว และประหยัดค่าใช้จ่าย:
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        
                        <div className="p-5 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                            <Database className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase text-blue-700 tracking-wider">Layer 1 • Google Sheets</span>
                            <h4 className="font-bold text-slate-900 text-sm">Sheets Webhook Database</h4>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            จัดเก็บข้อมูลหลัก Tab `Clinic_Config`, `Patients`, `Daily_Logs` ทำให้ทีมงานเปิดดูหรือ export รายงานจาก Google Sheets ได้สะดวกรวดเร็ว
                          </p>
                        </div>

                        <div className="p-5 bg-purple-50/70 rounded-2xl border border-purple-200 space-y-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                            <HardDrive className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase text-purple-700 tracking-wider">Layer 2 • Firestore</span>
                            <h4 className="font-bold text-slate-900 text-sm">Firebase Cloud Firestore</h4>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            รองรับการซิงค์ข้อมูล Real-time ข้ามอุปกรณ์ ระบบยืนยันตัวตนผู้ใช้งาน และสิทธิ์การเข้าถึงข้อมูลตามบทบาท (RBAC)
                          </p>
                        </div>

                        <div className="p-5 bg-indigo-50/70 rounded-2xl border border-indigo-200 space-y-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                            <Cpu className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">Layer 3 • Cloud Run</span>
                            <h4 className="font-bold text-slate-900 text-sm">Cloud Run Frontline Applet</h4>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            ประมวลผลความเร็วสูง พัฒนาด้วย React 18, Vite, TypeScript, Motion และ Tailwind CSS แสดงผลได้ลื่นไหลทุกอุปกรณ์
                          </p>
                        </div>

                      </div>
                    </div>
                  </div>
                )}

                {/* 4. CODE VALUE & 5 PILLARS ENGINE */}
                {archTab === 4 && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div className="flex items-center gap-3 text-purple-700 font-black text-xl border-b border-purple-100 pb-3">
                      <Cpu className="w-6 h-6 text-purple-700" />
                      <h3>หมวดที่ 4: คุณค่าของซอร์สโค้ดและ 5 เสาหลักการเจริญเติบโต (5 Pillars Value)</h3>
                    </div>

                    <div className="space-y-4 text-slate-700 text-sm">
                      <p>
                        อัลกอริทึมซอร์สโค้ดของ Growth Lab เป็นการผนวกหลักวิชาการทันตกรรมเข้ากับวิทยาการคอมพิวเตอร์อย่างพิถีพิถัน:
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                          <h4 className="font-black text-purple-800 text-sm">1. Full-Stack Modern Codebase</h4>
                          <p className="text-slate-600">
                            เขียนด้วย TypeScript แบบ Strict Type Safety มีไฟล์ `types.ts` ควบคุมโครงสร้างข้อมูล ป้องกันข้อผิดพลาดตั้งแต่ขั้นตอนเขียนโค้ด
                          </p>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                          <h4 className="font-black text-purple-800 text-sm">2. Local-First Data Integrity</h4>
                          <p className="text-slate-600">
                            บันทึกข้อมูลทันทีลง LocalStorage Key `clinic_profile_data` พร้อมระบบดึงข้อมูลอัตโนมัติ ไม่สูญหายแม้อยู่ในพื้นที่ไร้สัญญาณ
                          </p>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                          <h4 className="font-black text-purple-800 text-sm">3. QR Token & Security Revocation</h4>
                          <p className="text-slate-600">
                            ระบบสร้าง Token QR Code ประจำตัวคนไข้ และระบบเพิกถอนสิทธิ์ Cascade Delete ป้องกันการรั่วไหลของข้อมูลคนไข้
                          </p>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                          <h4 className="font-black text-purple-800 text-sm">4. Multi-Role Permission Model</h4>
                          <p className="text-slate-600">
                            แยกสิทธิ์การเข้าถึงระหว่าง ทันตแพทย์ (Doctor/Owner), ผู้ช่วยคลินิก (Staff/Admin) และผู้ปกครอง/เด็ก (Patient) อย่างปลอดภัย
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. DELIVERABLES ACROSS 5 PILLARS */}
                {archTab === 5 && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div className="flex items-center gap-3 text-emerald-700 font-black text-xl border-b border-emerald-100 pb-3">
                      <Layers className="w-6 h-6 text-emerald-700" />
                      <h3>หมวดที่ 5: รายการส่งมอบ 5 เสาหลัก (Deliverables Checklist)</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {handoverChecklist.map((item) => (
                          <div key={item.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 hover:border-emerald-300 transition-all">
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-md uppercase flex items-center gap-1 shrink-0">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                {item.status}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-indigo-700">{item.type}</p>
                            <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                              {item.details}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. TECHNICAL SUCCESSOR GUIDE & ONBOARDING */}
                {archTab === 6 && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="flex items-center gap-3 text-indigo-700 font-black text-xl border-b border-indigo-100 pb-3">
                      <Code className="w-6 h-6 text-indigo-700" />
                      <h3>หมวดที่ 6: คู่มือส่งต่องานทางเทคนิค (Technical Successor & Developer Guide)</h3>
                    </div>

                    <div className="space-y-6 text-slate-700 text-xs sm:text-sm">
                      <p className="text-slate-600 leading-relaxed">
                        คู่มือสรุปโครงสร้างโค้ด วิธีการตั้งค่า Webhook API และขั้นตอนการดูแลต่อเติมระบบสำหรับนักพัฒนารุ่นใหม่ที่จะเข้ามารับช่วงต่อ หลังจากทีมงานหลักทำการส่งมอบงานเรียบร้อยแล้ว:
                      </p>

                      {/* Code Directory Architecture */}
                      <div className="bg-slate-900 text-slate-200 rounded-2xl p-5 space-y-3 font-mono border border-slate-800 text-xs">
                        <div className="flex items-center gap-2 text-amber-300 font-bold border-b border-slate-800 pb-2">
                          <Terminal className="w-4 h-4 text-amber-300" />
                          <span>1. โครงสร้างไฟล์และโมดูลสำคัญ (Key Directory Breakdown)</span>
                        </div>
                        <ul className="space-y-2 text-slate-300 pl-2">
                          <li>
                            <strong className="text-amber-200">/src/components/</strong> : รวมคอมโพเนนต์หน้าจอหลัก
                            <span className="block text-[11px] text-slate-400 pl-4">
                              - ClinicProfile.tsx (บันทึกข้อมูลคลินิกและแพทย์ลง localStorage)
                            </span>
                            <span className="block text-[11px] text-slate-400 pl-4">
                              - ClinicalSourceManager.tsx (เอกสารสำคัญโครงการ & Handover Deed)
                            </span>
                            <span className="block text-[11px] text-slate-400 pl-4">
                              - StaffManagement.tsx (จัดการบัญชีบุคลากรและสิทธิ์การเข้าถึง)
                            </span>
                            <span className="block text-[11px] text-slate-400 pl-4">
                              - ExerciseTracker.tsx & GrowthTracker.tsx (หน้าจอติดตามคนไข้ 5 เสาหลัก)
                            </span>
                          </li>
                          <li>
                            <strong className="text-amber-200">/src/services/</strong> : รวมบริการเชื่อมต่อ API
                            <span className="block text-[11px] text-slate-400 pl-4">
                              - googleAppsScriptService.ts (ตัวจัดการส่งข้อมูลไปยัง Google Sheets Webhook)
                            </span>
                            <span className="block text-[11px] text-slate-400 pl-4">
                              - authService.ts (ระบบเข้าสู่ระบบและยืนยันตัวตน)
                            </span>
                            <span className="block text-[11px] text-slate-400 pl-4">
                              - cloudApi.ts (การเชื่อมต่อระบบคลาวด์สำรอง)
                            </span>
                          </li>
                          <li>
                            <strong className="text-amber-200">/src/context/PatientContext.tsx</strong> : ศูนย์กลางจัดการ State และข้อมูลคนไข้รวม
                          </li>
                          <li>
                            <strong className="text-amber-200">/src/types.ts</strong> : ชนิดข้อมูล TypeScript Types & Interfaces ทั้งหมด
                          </li>
                        </ul>
                      </div>

                      {/* Google Apps Script Webhook Integration */}
                      <div className="bg-indigo-50/70 p-5 rounded-2xl border border-indigo-200 space-y-3">
                        <h4 className="font-black text-indigo-950 text-sm flex items-center gap-2">
                          <ExternalLink className="w-4 h-4 text-indigo-700" />
                          2. การตั้งค่าและเชื่อมต่อ Google Apps Script Webhook API
                        </h4>
                        <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
                          <p>
                            ระบบส่งข้อมูลการตั้งค่าคลินิกและประวัติคนไข้ไปยัง Google Sheets ผ่าน Webhook Web App URL ที่ตั้งค่าไว้ใน <code className="bg-white px-2 py-0.5 rounded border border-indigo-200 font-mono text-indigo-900">googleAppsScriptService.ts</code>
                          </p>
                          <div className="bg-white p-3.5 rounded-xl border border-indigo-200 space-y-1 font-mono text-[11px] text-slate-800">
                            <span className="text-slate-500 font-sans block font-bold text-[10px]">ฟังก์ชันส่งข้อมูลลง Google Sheets:</span>
                            <code>saveClinicConfigToGoogleSheets(settings)</code>
                            <code>savePatientToGoogleSheets(patient)</code>
                            <code>saveDailyLogToGoogleSheets(log)</code>
                          </div>
                          <p className="text-slate-600">
                            * เมื่อสร้าง Google Apps Script ใหม่ในอนาคต ให้คัดลอก Deployment URL แบบ `Anyone` มาวางลงในช่องตั้งค่า Webhook ในหน้าระบบ หรือเปลี่ยนในไฟล์ `googleAppsScriptService.ts`
                          </p>
                        </div>
                      </div>

                      {/* New Developer Onboarding Checklist */}
                      <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200 space-y-3">
                        <h4 className="font-black text-emerald-950 text-sm flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          3. ขั้นตอนสำหรับนักพัฒนาคนใหม่เมื่อรับช่วงต่อ (Developer Onboarding Checklist)
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-1">
                            <span className="font-bold text-emerald-900 block">Step 1: Setup Environment</span>
                            <p className="text-slate-600">
                              รัน <code className="bg-slate-100 px-1 rounded font-mono">npm install</code> แล้วเปิดเซิร์ฟเวอร์ด้วย <code className="bg-slate-100 px-1 rounded font-mono">npm run dev</code> (Port 3000)
                            </p>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-1">
                            <span className="font-bold text-emerald-900 block">Step 2: Check LocalStorage Keys</span>
                            <p className="text-slate-600">
                              ตรวจสอบ Key <code className="bg-slate-100 px-1 rounded font-mono">clinic_profile_data</code> และ <code className="bg-slate-100 px-1 rounded font-mono">growthlab_clinic_info</code> ใน DevTools
                            </p>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-1">
                            <span className="font-bold text-emerald-900 block">Step 3: Verify Print Stylesheets</span>
                            <p className="text-slate-600">
                              ทดสอบปุ่มพิมพ์ PDF เพื่อให้แน่ใจว่า Class <code className="bg-slate-100 px-1 rounded font-mono">print:hidden</code> ทำงานถูกต้อง
                            </p>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-1">
                            <span className="font-bold text-emerald-900 block">Step 4: Maintain Tailwind Theme</span>
                            <p className="text-slate-600">
                              รักษาธีมสีกรมท่า-ม่วง-ทอง และอย่าดัดแปลงโลโก้หลักตามกฎ AGENTS.md
                            </p>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

              </div>

            </div>
          )}

        </div>
      )}

      {/* CHANGE PIN MODAL */}
      {showPinChangeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl border border-slate-200 text-left animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-black text-base">
                <KeyRound className="w-5 h-5 text-amber-500" />
                <h3>เปลี่ยนรหัส PIN ล็อกหน้านี้</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPinChangeModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {pinChangeSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-center font-bold text-xs space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                <p>เปลี่ยนรหัส PIN สำเร็จแล้ว!</p>
              </div>
            ) : (
              <form onSubmit={handleChangePin} className="space-y-4 text-xs">
                <p className="text-slate-600">
                  กรอกรหัส PIN ใหม่จำนวน 4 หลัก (สำหรับควบคุมการเข้าถึงหน้านี้):
                </p>
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  placeholder="กรอกตัวเลข 4 หลัก (เช่น 5678)"
                  className="w-full text-center tracking-[0.5em] text-xl font-bold py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPinChangeModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow-md"
                  >
                    บันทึก PIN ใหม่
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* FULL INCEPTION DOSSIER MODAL */}
      <InceptionDossierModal 
        isOpen={showFullDocModal} 
        onClose={() => setShowFullDocModal(false)} 
      />

    </div>
  );
}
