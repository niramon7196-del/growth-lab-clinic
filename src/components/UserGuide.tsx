import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  Search, 
  Video, 
  HelpCircle, 
  CheckCircle2, 
  User, 
  Stethoscope, 
  ChevronRight, 
  Play, 
  FileText, 
  QrCode, 
  UserPlus, 
  ClipboardList, 
  ShieldAlert, 
  Activity, 
  Moon, 
  Utensils, 
  Clock, 
  CalendarCheck,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { useScrollLock } from '../utils';

interface UserGuideProps {
  onBack?: () => void;
  isPatient?: boolean;
  userRole?: string;
  onNavigateToTab?: (tab: string, patientId?: string, subTab?: string) => void;
}

export default function UserGuide({ onBack, isPatient = false, userRole, onNavigateToTab }: UserGuideProps) {
  // If user is a patient, strictly default to 'patient' guide and lock it
  const isPatientUser = isPatient || userRole === 'PATIENT';
  const [guideType, setGuideType] = useState<'clinic' | 'patient'>('clinic');
  const activeGuide = isPatientUser ? 'patient' : guideType;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  useScrollLock(!!activeVideo);

  const clinicFaqs = [
    { 
      q: 'วิธีการลงทะเบียนผู้รับการดูแลใหม่ (Register Patient) ทำอย่างไร?', 
      a: 'ไปที่เมนู "ผู้รับการดูแล" กดปุ่ม "+ เพิ่มผู้รับการดูแล" กรอก HN, ชื่อ-นามสกุล, อายุ, ส่วนสูง และน้ำหนัก ระบบจะสร้างโปรไฟล์และออก QR Token ประจำตัวให้อัตโนมัติ' 
    },
    { 
      q: 'การพิมพ์ QR Code บัตรประจำตัวคนไข้ทำอย่างไร?', 
      a: 'ไปที่เมนู "คิวอาร์ / เช็คอิน" (QR Code) เลือกคนไข้ที่ต้องการ จากนั้นกดปุ่ม "พิมพ์บัตร QR" หรือ "ดาวน์โหลด QR" เพื่อมอบให้ผู้ปกครองนำกลับไปสแกนที่บ้าน' 
    },
    { 
      q: 'การมอบหมายการบ้านและแบบฝึกหัด (Assign Homework) ทำอย่างไร?', 
      a: 'เลือกแฟ้มผู้รับการดูแล ไปที่แท็บ "แบบฝึก / EF" หรือ "การออกกำลังกาย" กดเลือกชุดท่าบริหารที่ต้องการ (เช่น Diaphragmatic Nasal Breathing, Lip Seal, Tongue Suction) แล้วกด "บันทึกมอบหมายการบ้าน"' 
    },
    { 
      q: 'ระบบแจ้งเตือนเคสเตือนภัย (Clinical Red Flags & Risk Alerts) ดูได้จากที่ไหน?', 
      a: 'ไปที่เมนู "การแจ้งเตือน" (Communications / Alerts) ระบบจะคัดกรองอัตโนมัติ 2 กรณี: (1) มีอาการเสี่ยงด้านการนอน (กรนประจำ, หายใจเฮือก, หยุดหายใจ) (2) ขาดการเช็กอินส่งการบ้านเกิน 7 วัน พร้อมปุ่มลัด "เปิดดูเคสทันที"' 
    }
  ];

  const patientFaqs = [
    { 
      q: 'วิธีสแกน QR Code เพื่อเข้าสู่ระบบและเช็กอินประจำวัน?', 
      a: 'ใช้กล้องมือถือหรือแอปสแกน QR Code บนบัตรประจำตัวที่ได้รับจากคลินิก เพื่อเปิดหน้าแดชบอร์ดส่วนตัวของน้องได้ทันทีโดยไม่ต้องจำรหัสผ่าน' 
    },
    { 
      q: 'การบันทึกการนอนหลับและการสวมใส่เครื่องมือ EF (31 วัน) ทำอย่างไร?', 
      a: 'เข้าสู่เมนู "การนอนหลับ" เลือกวันที่ในปฏิทิน 31 วัน บันทึกเวลานอน-ตื่น ชั่วโมงการใส่เครื่องมือ EF และประเมินอาการกรน/อ้าปากหายใจ จากนั้นกดบันทึก' 
    },
    { 
      q: 'วิธีเปิดดูคลิปวิดีโอ OMT และใช้ตัวจับเวลาช่วยฝึก?', 
      a: 'ไปที่เมนู "วิดีโอสาธิต" หรือ "แบบฝึกหัด" เลือกท่าที่แพทย์มอบหมาย กดเล่นวิดีโอแนะนำพร้อมเปิดระบบจับเวลาฝึกนับรอบ (Timer/Rep Counter) ได้ทันที' 
    },
    { 
      q: 'การบันทึกคะแนนโภชนาการ GNS Daily Score ทำอย่างไร?', 
      a: 'ไปที่เมนู "โภชนาการ (GNS)" ทำการประเมิน 5 หมวดอาหารหลัก (โปรตีน, แคลเซียม/วิตามินดี, ผักผลไม้, คุณภาพอาหาร, น้ำดื่ม) ระบบจะรวมคะแนนและประเมินเกรดให้ทันที' 
    }
  ];

  const faqs = (isPatientUser || activeGuide === 'patient') ? patientFaqs : clinicFaqs;
  const filteredFaqs = faqs.filter(f => f.q.toLowerCase().includes(searchTerm.toLowerCase()) || f.a.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 text-left">
      
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-teal-800 via-indigo-900 to-purple-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
            <BookOpen className="w-4 h-4" />
            <span>Growth Lab Master Operation Guide V1.0</span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-sans">
            คู่มือการใช้งานระบบ (User Manual & Guidelines)
          </h1>
          
          <p className="text-purple-100 text-xs sm:text-sm leading-relaxed max-w-2xl font-normal">
            {isPatientUser ? "คู่มือแนะนำการใช้งาน 4 ขั้นตอนสำหรับผู้รับการดูแลและผู้ปกครอง ครอบคลุมการใส่ EF, ฝึกการหายใจ, โภชนาการ และการเช็กอิน" : "แนวทางการปฏิบัติงานมาตรฐานสำหรับคลินิกและการใช้งานสำหรับผู้รับการดูแลและผู้ปกครอง ครอบคลุม 5 เสาหลักการเจริญเติบโต (EF / OMT, การออกกำลังกาย, การนอนหลับ, โภชนาการ GNS และการติดตามผล)"}
          </p>

          {/* Guide Switcher (Only visible for Medical Staff / Admin, hidden for Patient role) */}
          {!isPatientUser ? (
            <div className="flex flex-wrap gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => { setGuideType('clinic'); setSearchTerm(''); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs transition-all shadow-xs cursor-pointer ${
                  activeGuide === 'clinic' 
                    ? 'bg-white text-teal-900 shadow-md ring-2 ring-white/50' 
                    : 'bg-white/15 text-white hover:bg-white/25'
                }`}
              >
                <Stethoscope className="w-4 h-4" />
                <span>1. คู่มือคลินิกและแพทย์ (Clinic Operations)</span>
              </button>
              
              <button
                type="button"
                onClick={() => { setGuideType('patient'); setSearchTerm(''); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs transition-all shadow-xs cursor-pointer ${
                  activeGuide === 'patient' 
                    ? 'bg-white text-purple-900 shadow-md ring-2 ring-white/50' 
                    : 'bg-white/15 text-white hover:bg-white/25'
                }`}
              >
                <User className="w-4 h-4" />
                <span>2. คู่มือผู้รับการดูแล / ครอบครัว (Patient & Home Guide)</span>
              </button>
            </div>
          ) : (
            <div className="pt-2">
              <span className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl backdrop-blur-xs">
                <User className="w-4 h-4" />
                <span>โหมดผู้รับการดูแลและผู้ปกครอง (Patient Portal Guide)</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400 ml-2 shrink-0" />
        <input 
          type="text" 
          placeholder="ค้นหาขั้นตอนการทำงาน, หัวข้อ หรือคำถามที่พบบ่อย..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent border-none outline-none text-slate-800 text-sm placeholder:text-slate-400 font-medium"
        />
        {searchTerm && (
          <button 
            type="button"
            onClick={() => setSearchTerm('')} 
            className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 font-bold cursor-pointer"
          >
            ล้าง
          </button>
        )}
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: 4-Step Actionable Flow */}
        <div className="lg:col-span-2 space-y-6">

          {/* Section 1: Standard 4-Step Operating Procedure */}
          <div className="bg-white p-6 lg:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${activeGuide === 'clinic' ? 'bg-teal-50 text-teal-700' : 'bg-purple-50 text-purple-700'}`}>
                  {activeGuide === 'clinic' ? <Stethoscope className="w-6 h-6" /> : <User className="w-6 h-6" />}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 font-sans">
                    {activeGuide === 'clinic' ? 'ขั้นตอนการปฏิบัติงานสำหรับคลินิก (Clinic 4-Step Workflow)' : 'ขั้นตอนการใช้งานสำหรับผู้รับการดูแล (Patient 4-Step Workflow)'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeGuide === 'clinic' 
                      ? 'แนวทาง 4 ขั้นตอนมาตรฐานตั้งแต่รับเคสจนถึงประเมินความเสี่ยง' 
                      : 'แนวทาง 4 ขั้นตอนฝึกทำที่บ้านร่วมกับครอบครัวอย่างสม่ำเสมอ'}
                  </p>
                </div>
              </div>

              <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${activeGuide === 'clinic' ? 'bg-teal-100 text-teal-800' : 'bg-purple-100 text-purple-800'}`}>
                {activeGuide === 'clinic' ? 'สำหรับทีมแพทย์/เจ้าหน้าที่' : 'สำหรับคนไข้/ผู้ปกครอง'}
              </span>
            </div>

            {/* Steps Container */}
            <div className="space-y-4">
              {activeGuide === 'clinic' ? (
                <>
                  {/* Clinic Step 1 */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 hover:border-teal-300 transition-all space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-teal-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                          1
                        </div>
                        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                          <UserPlus className="w-4 h-4 text-teal-600" />
                          <span>ลงทะเบียนคนไข้ใหม่ (Register Patient)</span>
                        </h3>
                      </div>
                      {onNavigateToTab && (
                        <button
                          type="button"
                          onClick={() => onNavigateToTab('ผู้รับการดูแล')}
                          className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-xl border border-teal-200 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <span>เปิดหน้าคนไข้</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pl-11">
                      เข้าเมนู <strong>"ผู้รับการดูแล"</strong> แล้วกดปุ่ม <strong>"+ เพิ่มข้อมูล"</strong> บันทึกรหัส HN, ชื่อ-นามสกุล, ชื่อเล่น, อายุ, เพศ, วันที่เริ่มโปรแกรม, ส่วนสูง และน้ำหนักเริ่มต้น เพื่อให้ระบบคำนวณ BMI และ Height Velocity Baseline
                    </p>
                  </div>

                  {/* Clinic Step 2 */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 hover:border-teal-300 transition-all space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-teal-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                          2
                        </div>
                        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                          <QrCode className="w-4 h-4 text-teal-600" />
                          <span>ออกบัตรและพิมพ์คิวอาร์โค้ด (Print / Distribute QR Card)</span>
                        </h3>
                      </div>
                      {onNavigateToTab && (
                        <button
                          type="button"
                          onClick={() => onNavigateToTab('QR')}
                          className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-xl border border-teal-200 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <span>เปิดหน้า QR Code</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pl-11">
                      ไปที่เมนู <strong>"คิวอาร์ / เช็คอิน" (QR Code)</strong> ค้นหาชื่อคนไข้ จากนั้นกดปุ่มพิมพ์บัตรประจำตัวแบบ Card หรือส่ง QR Token ทางดิจิทัล เพื่อให้ผู้ปกครองนำไปสแกนส่งการบ้านและเช็กอินจากที่บ้านได้ทันที
                    </p>
                  </div>

                  {/* Clinic Step 3 */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 hover:border-teal-300 transition-all space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-teal-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                          3
                        </div>
                        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                          <ClipboardList className="w-4 h-4 text-teal-600" />
                          <span>มอบหมายการบ้านและปรับแบบฝึก (Assign Homework & EF Protocol)</span>
                        </h3>
                      </div>
                      {onNavigateToTab && (
                        <button
                          type="button"
                          onClick={() => onNavigateToTab('EF / แบบฝึก')}
                          className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-xl border border-teal-200 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <span>เปิดแบบฝึกหัด</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pl-11">
                      เลือกท่าฝึกบริหารกล้ามเนื้อใบหน้าและทางเดินหายใจ (OMT) จากเมนู <strong>"แบบฝึก / EF"</strong> หรือ <strong>"การออกกำลังกาย"</strong> กำหนดจำนวนครั้งเป้าหมาย (เช่น หายใจทางจมูก 10 รอบ, แตะเพดานปาก 10 วินาที) และบันทึกคำแนะนำเฉพาะบุคคล
                    </p>
                  </div>

                  {/* Clinic Step 4 */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 hover:border-teal-300 transition-all space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-rose-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                          4
                        </div>
                        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-rose-600" />
                          <span>ดูรายงานและตรวจจับเคสเตือนภัย (View Reports & Red Flag Alerts)</span>
                        </h3>
                      </div>
                      {onNavigateToTab && (
                        <button
                          type="button"
                          onClick={() => onNavigateToTab('การแจ้งเตือน')}
                          className="text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl border border-rose-200 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <span>เปิดดูการแจ้งเตือน</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pl-11">
                      ติดตามผลในเมนู <strong>"การแจ้งเตือน"</strong> และ <strong>"รายงาน"</strong> ระบบจะคัดกรองอัตโนมัติทันทีเมื่อพบ: 
                      (1) เคสมีอาการเสี่ยงด้านการนอน (กรน, หายใจเฮือก, หยุดหายใจ) 
                      (2) เคสขาดการเช็กอินส่งการบ้านเกิน 7 วัน เพื่อให้แพทย์/เจ้าหน้าที่กด <strong>"เปิดดูเคสทันที"</strong> และโทรติดตามได้อย่างทันท่วงที
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* Patient Step 1 */}
                  <div className="p-5 rounded-2xl bg-purple-50/40 border border-purple-100 hover:border-purple-300 transition-all space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-purple-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                          1
                        </div>
                        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                          <QrCode className="w-4 h-4 text-purple-600" />
                          <span>สแกน QR Code เข้าใช้งาน (Scan QR & Instant Sign-in)</span>
                        </h3>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pl-11">
                      ใช้สมาร์ตโฟนหรือแท็บเล็ตสแกน QR Code บนบัตรประจำตัวที่ได้รับจากคลินิก ระบบจะนำคุณเข้าสู่หน้าแดชบอร์ดส่วนตัวของน้องได้ทันที สะดวก ปลอดภัย ไม่ต้องกรอกชื่อผู้ใช้หรือรหัสผ่าน
                    </p>
                  </div>

                  {/* Patient Step 2 */}
                  <div className="p-5 rounded-2xl bg-purple-50/40 border border-purple-100 hover:border-purple-300 transition-all space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-purple-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                          2
                        </div>
                        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                          <Moon className="w-4 h-4 text-purple-600" />
                          <span>บันทึกการนอนหลับและใส่เครื่องมือ EF ครบ 31 วัน (Sleep & EF Logging)</span>
                        </h3>
                      </div>
                      {onNavigateToTab && (
                        <button
                          type="button"
                          onClick={() => onNavigateToTab('การนอน')}
                          className="text-xs font-bold text-purple-700 hover:text-purple-900 bg-white px-3 py-1.5 rounded-xl border border-purple-200 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <span>ไปที่บันทึกการนอน</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pl-11">
                      เปิดเมนู <strong>"การนอนหลับ"</strong> ทุกเช้า เพื่อบันทึกเวลาเข้านอน-ตื่นนอน ชั่วโมงการใส่เครื่องมือ EF และประเมินอาการกรนหรืออ้าปากหายใจ ระบบจะประเมินคะแนนคุณภาพการนอนและส่งข้อมูลตรงถึงแพทย์
                    </p>
                  </div>

                  {/* Patient Step 3 */}
                  <div className="p-5 rounded-2xl bg-purple-50/40 border border-purple-100 hover:border-purple-300 transition-all space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-purple-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                          3
                        </div>
                        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                          <Video className="w-4 h-4 text-purple-600" />
                          <span>ดูคลิป OMT และเปิดตัวจับเวลาฝึก (Watch Video & Timer Practice)</span>
                        </h3>
                      </div>
                      {onNavigateToTab && (
                        <button
                          type="button"
                          onClick={() => onNavigateToTab('วิดีโอ')}
                          className="text-xs font-bold text-purple-700 hover:text-purple-900 bg-white px-3 py-1.5 rounded-xl border border-purple-200 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <span>เปิดวิดีโอสาธิต</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pl-11">
                      ไปที่เมนู <strong>"วิดีโอสาธิต"</strong> หรือ <strong>"แบบฝึกหัดที่ได้รับมอบหมาย"</strong> เปิดคลิปวิดีโอท่าฝึกที่ทันตแพทย์มอบหมาย เช่น ฝึกหายใจผ่านจมูก ฝึกยกโคนลิ้น พร้อมใช้ระบบจับเวลาช่วยฝึกในตัว
                    </p>
                  </div>

                  {/* Patient Step 4 */}
                  <div className="p-5 rounded-2xl bg-purple-50/40 border border-purple-100 hover:border-purple-300 transition-all space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-purple-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                          4
                        </div>
                        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                          <Utensils className="w-4 h-4 text-purple-600" />
                          <span>บันทึกคะแนนโภชนาการ GNS ประจำวัน (Daily GNS Scoring)</span>
                        </h3>
                      </div>
                      {onNavigateToTab && (
                        <button
                          type="button"
                          onClick={() => onNavigateToTab('GNS')}
                          className="text-xs font-bold text-purple-700 hover:text-purple-900 bg-white px-3 py-1.5 rounded-xl border border-purple-200 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <span>ไปที่โภชนาการ</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pl-11">
                      เข้าเมนู <strong>"โภชนาการ (GNS)"</strong> ตอบแบบสอบถาม 5 หมวด (โปรตีน, แคลเซียม/นม, ผักผลไม้, คุณภาพอาหาร, น้ำดื่ม) ระบบจะรวบรวมคะแนนรายสัปดาห์และคำนวณ Growth Nutrition Score ให้ทันที
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section 2: Video Tutorials */}
          <div className="bg-white p-6 lg:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Video className="w-5 h-5 text-teal-600" />
                <span>วิดีโอสาธิตการใช้งาน (Embedded Video Tutorials)</span>
              </h3>
              <span className="text-xs font-semibold text-slate-400">เล่นภายในแอป</span>
            </div>
            
            <p className="text-xs text-slate-500">
              คลิกเพื่อรับชมวิดีโอสาธิตขั้นตอนการใช้งานและการฝึกปฏิบัติจริงในระบบ Growth Lab
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {[
                { 
                  title: activeGuide === 'clinic' ? 'การลงทะเบียนคนไข้และพิมพ์ QR Code บัตรประจำตัว' : 'วิธีสแกน QR Code และเข้าสู่หน้าแดชบอร์ดส่วนตัว', 
                  duration: '3:20 นาที', 
                  id: 'vid_1',
                  tag: activeGuide === 'clinic' ? 'Step 1 & 2' : 'Step 1'
                },
                { 
                  title: activeGuide === 'clinic' ? 'การติดตามเคสเสี่ยง Red Flag และขาดการฝึกเกิน 7 วัน' : 'วิธีบันทึกการนอน 31 วันและทำคะแนน GNS Daily', 
                  duration: '4:15 นาที', 
                  id: 'vid_2',
                  tag: activeGuide === 'clinic' ? 'Step 4' : 'Step 2 & 4'
                },
              ].map((vid) => (
                <div key={vid.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800 line-clamp-1">{vid.title}</span>
                    <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-bold shrink-0">{vid.tag}</span>
                  </div>
                  
                  <div 
                    className="w-full h-36 bg-slate-900 rounded-xl relative flex items-center justify-center overflow-hidden group cursor-pointer" 
                    onClick={() => setActiveVideo(vid.title)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-tr from-teal-900/60 to-slate-900/80"></div>
                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform relative z-10">
                      <Play className="w-5 h-5 text-teal-700 ml-0.5 fill-teal-700" />
                    </div>
                    <span className="absolute bottom-2 left-3 text-[10px] text-white/80 font-medium z-10">คลิกเพื่อเล่นวิดีโอ ({vid.duration})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right 1 Col: FAQ & Support */}
        <div className="space-y-6">
          
          {/* FAQ Box */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <HelpCircle className="w-5 h-5 text-teal-600" />
              <span>คำถามที่พบบ่อย (FAQ)</span>
            </h3>

            <div className="space-y-3">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq, i) => (
                  <div key={i} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-left">
                    <h4 className="font-bold text-xs text-slate-800 leading-snug">Q: {faq.q}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">A: {faq.a}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">ไม่พบคำถามที่ตรงกับคำค้นหา</p>
              )}
            </div>
          </div>

          {/* Clinical Support Box */}
          <div className="bg-gradient-to-br from-slate-900 to-teal-950 text-white p-6 rounded-3xl space-y-3 shadow-md">
            <div className="flex items-center gap-2 text-teal-300 font-bold text-xs">
              <Activity className="w-4 h-4" />
              <span>ศูนย์สนับสนุนทางคลินิก (Clinical Support)</span>
            </div>
            <h4 className="font-bold text-sm text-white">ต้องการความช่วยเหลือหรือคำแนะนำ?</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              หากมีข้อสงสัยเกี่ยวกับเกณฑ์การประเมิน หรือพบปัญหาในการบันทึกข้อมูล สามารถติดต่อทีมดูแลของคลินิกได้ทันที
            </p>
            <div className="pt-2 space-y-2">
              <div className="bg-white/10 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-white/10 flex items-center justify-between">
                <span>สายด่วน Growth Lab:</span>
                <span className="font-mono font-bold text-teal-300">081-851-7672</span>
              </div>
              <div className="bg-white/10 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-white/10 flex items-center justify-between">
                <span>ช่องทางติดต่อคลินิก:</span>
                <span className="font-bold text-emerald-300">@growthlab</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Embedded Video Modal */}
      {activeVideo && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-slate-200 text-left">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">{activeVideo}</h3>
              <button 
                type="button"
                onClick={() => setActiveVideo(null)} 
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 bg-white/10 rounded-lg cursor-pointer"
              >
                ✕ ปิด
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="w-full h-72 bg-slate-950 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-teal-900/40"></div>
                <div className="w-16 h-16 bg-teal-600 text-white rounded-full flex items-center justify-center shadow-xl animate-pulse">
                  <Play className="w-8 h-8 fill-white ml-1" />
                </div>
                <p className="text-white text-xs mt-4 font-semibold tracking-wide">กำลังเล่นวิดีโอสาธิตภายในแอป Growth Lab V1...</p>
              </div>
              <p className="text-xs text-slate-500 text-center">
                วิดีโอนี้เล่นผ่านระบบภายในของ Growth Lab โดยไม่มีการเปลี่ยนเส้นทางหรือเปิดหน้าต่างภายนอก
              </p>
            </div>
          </motion.div>
        </div>
      )}

    </motion.div>
  );
}
