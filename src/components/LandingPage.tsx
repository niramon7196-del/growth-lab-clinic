import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Smartphone, 
  CheckCircle2, 
  ArrowRight, 
  QrCode,
  Lock,
  X,
  User,
  KeyRound
} from 'lucide-react';
import Logo from './Logo';

interface LandingPageProps {
  onLogin?: (role: 'clinic' | 'patient', data?: any) => void;
  onSwitchMode?: (mode: 'CLINIC' | 'PATIENT') => void;
}

export default function LandingPage({ onLogin, onSwitchMode }: LandingPageProps) {
  const [activeModal, setActiveModal] = useState<'none' | 'clinic' | 'patient'>('none');
  const [clinicUsername, setClinicUsername] = useState('');
  const [clinicPassword, setClinicPassword] = useState('');
  const [patientHnOrPhone, setPatientHnOrPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // ตรวจจับ QR Token หรือ HN จาก URL อัตโนมัติ
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hn = params.get('hn') || params.get('token');
    if (hn) {
      if (onLogin) onLogin('patient', { hn });
    }
  }, [onLogin]);

  const handleClinicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicUsername || !clinicPassword) {
      setErrorMsg('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }
    setErrorMsg('');
    if (onLogin) {
      onLogin('clinic', { username: clinicUsername, password: clinicPassword });
    } else if (onSwitchMode) {
      onSwitchMode('CLINIC');
    }
    setActiveModal('none');
  };

  const handlePatientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientHnOrPhone) {
      setErrorMsg('กรุณากรอกรหัส HN หรือเบอร์โทรศัพท์');
      return;
    }
    setErrorMsg('');
    if (onLogin) {
      onLogin('patient', { hnOrPhone: patientHnOrPhone });
    } else if (onSwitchMode) {
      onSwitchMode('PATIENT');
    }
    setActiveModal('none');
  };

  return (
    <div 
      className="min-h-screen min-h-[100dvh] w-full overflow-y-auto flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans antialiased text-slate-800 select-none"
      style={{
        background: `
          radial-gradient(circle at 15% 15%, rgba(192, 132, 252, 0.55) 0%, transparent 45%),
          radial-gradient(circle at 85% 20%, rgba(244, 114, 182, 0.5) 0%, transparent 45%),
          radial-gradient(circle at 50% 85%, rgba(96, 165, 250, 0.55) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.4) 0%, transparent 45%),
          linear-gradient(135deg, #dfc2f7 0%, #f7cadf 45%, #c7e3fc 100%)
        `
      }}
    >
      
      {/* Container กลาง 2 คอลัมน์ สมดุลพอดีหน้าจอสำหรับ Desktop และเรียงต่อกันลื่นไหลสำหรับ Mobile/Tablet */}
      <div className="w-full max-w-6xl flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-10 items-center mx-auto my-auto">
        
        {/* ===================== คอลัมน์ซ้าย: โลโก้ & 5 เสาหลัก ===================== */}
        <div className="lg:col-span-6 flex flex-col items-center text-center space-y-3 w-full">
          
          {/* 1. โลโก้ Growth Lab (ขนาดใหญ่เด่นชัด สีสันคมสดใส ปรับขนาดอัตโนมัติตามอุปกรณ์) */}
          <div className="flex items-center justify-center w-full">
            <Logo className="w-48 sm:w-60 lg:w-72 h-auto object-contain drop-shadow-md filter contrast-[1.08] saturate-[1.15]" />
          </div>

          {/* 2. Badge หัวข้อระบบ (White pill with gold sparkles) */}
          <div className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1 rounded-full bg-white/95 border border-amber-200/90 text-indigo-950 text-[11px] sm:text-xs font-semibold shadow-xs">
            <span className="text-amber-500 text-xs">✨</span>
            <span className="tracking-wide">CLINICAL GROWTH INTELLIGENCE PLATFORM</span>
            <span className="text-amber-500 text-xs">✨</span>
          </div>

          {/* 3. หัวข้อ & คำอธิบาย */}
          <div className="space-y-0.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2a1e5c] tracking-tight">
              โปรดเลือกช่องทางเข้าสู่ระบบ
            </h2>
            <div className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed font-normal">
              <p>แยกโหมดการใช้งานอย่างชัดเจนระหว่างระบบบริหารจัดการคลินิก</p>
              <p>และระบบส่งการบ้านของผู้รับการดูแล</p>
            </div>
          </div>

          {/* 4. แถบ 5 เสาหลัก (White rounded pill with purple heart) */}
          <div className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1 rounded-full bg-white/95 border border-purple-200/90 text-purple-950 text-[11px] sm:text-xs font-semibold shadow-xs">
            <span className="text-purple-600">💜</span>
            <span className="text-purple-500">✨</span>
            <span>5 เสาหลักการเจริญเติบโต (5 CORE PILLARS)</span>
          </div>

          {/* 5. การ์ดไอคอน 5 เสาหลัก ปรับตามสเกลหน้าจอ แสดงครบ 5 เสาหลักไม่ล้น */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5 w-full max-w-lg pt-0.5">
            
            {/* 1. Nutrition */}
            <div className="flex flex-col items-center justify-center py-2 sm:py-2.5 px-0.5 sm:px-1 rounded-2xl bg-white border-2 border-emerald-400 shadow-sm hover:shadow transition-all">
              <div className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center mb-0.5 text-xl sm:text-2xl">
                🥗
              </div>
              <span className="text-[11px] sm:text-xs font-extrabold text-slate-800 leading-tight">Nutrition</span>
              <span className="text-[9px] sm:text-[10px] font-semibold text-emerald-600 mt-0.5">โภชนาการ</span>
            </div>

            {/* 2. Sleep */}
            <div className="flex flex-col items-center justify-center py-2 sm:py-2.5 px-0.5 sm:px-1 rounded-2xl bg-white border-2 border-sky-400 shadow-sm hover:shadow transition-all">
              <div className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center mb-0.5 text-xl sm:text-2xl">
                😴
              </div>
              <span className="text-[11px] sm:text-xs font-extrabold text-slate-800 leading-tight">Sleep</span>
              <span className="text-[9px] sm:text-[10px] font-semibold text-sky-600 mt-0.5">การนอนหลับ</span>
            </div>

            {/* 3. Exercise */}
            <div className="flex flex-col items-center justify-center py-2 sm:py-2.5 px-0.5 sm:px-1 rounded-2xl bg-white border-2 border-amber-400 shadow-sm hover:shadow transition-all">
              <div className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center mb-0.5 text-xl sm:text-2xl">
                🏃
              </div>
              <span className="text-[11px] sm:text-xs font-extrabold text-slate-800 leading-tight">Exercise</span>
              <span className="text-[9px] sm:text-[10px] font-semibold text-amber-600 mt-0.5">การเคลื่อนไหว</span>
            </div>

            {/* 4. Orofacial */}
            <div className="flex flex-col items-center justify-center py-2 sm:py-2.5 px-0.5 sm:px-1 rounded-2xl bg-white border-2 border-rose-400 shadow-sm hover:shadow transition-all">
              <div className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center mb-0.5 text-xl sm:text-2xl">
                👄
              </div>
              <span className="text-[11px] sm:text-xs font-extrabold text-slate-800 leading-tight">Orofacial</span>
              <span className="text-[9px] sm:text-[10px] font-semibold text-rose-600 mt-0.5">กล้ามเนื้อปาก</span>
            </div>

            {/* 5. Family */}
            <div className="flex flex-col items-center justify-center py-2 sm:py-2.5 px-0.5 sm:px-1 rounded-2xl bg-white border-2 border-indigo-400 shadow-sm hover:shadow transition-all">
              <div className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center mb-0.5 text-xl sm:text-2xl">
                👥
              </div>
              <span className="text-[11px] sm:text-xs font-extrabold text-slate-800 leading-tight">Family</span>
              <span className="text-[9px] sm:text-[10px] font-semibold text-indigo-600 mt-0.5">ครอบครัว</span>
            </div>

          </div>

        </div>

        {/* ===================== คอลัมน์ขวา: การ์ดทางเลือก 2 ฝั่ง (ทูโทนกระชับ) ===================== */}
        <div className="lg:col-span-6 flex flex-col gap-3.5 sm:gap-4 max-w-md w-full mx-auto lg:mx-0">
          
          {/* การ์ด 1: ฝั่งคลินิก (Clinic Portal - ไล่เฉดสีม่วงทูโทนละมุนตา) */}
          <div className="relative bg-gradient-to-br from-[#fbf8fe] via-[#f7f0fd] to-[#efe2fc] rounded-3xl p-4 sm:p-5 shadow-md border border-purple-200/90 overflow-hidden transition-all hover:shadow-lg">
            {/* เส้น Gradient หัวการ์ดบน */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-400" />

            <div className="flex justify-between items-start mb-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="px-3 py-1 rounded-full bg-purple-100/95 text-purple-900 text-xs font-semibold border border-purple-200/70">
                สำหรับบุคลากรทางการแพทย์
              </span>
            </div>

            <div className="space-y-0.5 mb-2 text-left">
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-1.5">
                  <span>🏢</span>
                  <span>ฝั่งคลินิก</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-md bg-purple-200/80 text-purple-900 text-xs font-bold">
                  Clinic Portal
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                เข้าสู่ระบบบริหารจัดการคลินิก แดชบอร์ดติดตามคนไข้ และควบคุมโปรแกรมฝึกแบบเต็มรูปแบบ
              </p>
            </div>

            <div className="space-y-1 mb-3 text-left text-xs sm:text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                <span>แดชบอร์ดประเมินและติดตามพัฒนาการ <strong>5 เสาหลัก</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                <span>สารบบคนไข้และแฟ้มติดตามประวัติการฝึก</span>
              </div>
            </div>

            <button
              onClick={() => setActiveModal('clinic')}
              className="w-full py-2.5 sm:py-3 px-4 rounded-2xl bg-[#5213b3] hover:bg-[#430f94] text-white font-bold text-sm sm:text-base flex items-center justify-between shadow-md active:scale-[0.99] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>เข้าสู่ระบบฝั่งคลินิก</span>
              </div>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* การ์ด 2: ฝั่งผู้ใช้โปรแกรม (Patient Portal - ไล่เฉดสีชมพูทูโทนละมุนตา) */}
          <div className="relative bg-gradient-to-br from-[#fff7f9] via-[#fdeff3] to-[#fbdce6] rounded-3xl p-4 sm:p-5 shadow-md border border-rose-200/90 overflow-hidden transition-all hover:shadow-lg">
            {/* เส้น Gradient หัวการ์ดบน */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-400 via-pink-500 to-purple-400" />

            <div className="flex justify-between items-start mb-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-sm">
                <Smartphone className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="px-3 py-1 rounded-full bg-rose-100/95 text-rose-900 text-xs font-semibold border border-rose-200/70">
                สำหรับผู้รับการดูแล & ครอบครัว
              </span>
            </div>

            <div className="space-y-0.5 mb-2 text-left">
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-1.5">
                  <span>📱</span>
                  <span>ฝั่งผู้ใช้โปรแกรม</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-md bg-rose-200/80 text-rose-900 text-xs font-bold">
                  Patient Portal
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                สแกน QR Code จากคลินิก หรือ กรอกเบอร์โทรศัพท์/รหัส HN เพื่อส่งการบ้านและบันทึกประจำวัน
              </p>
            </div>

            <div className="space-y-1 mb-3 text-left text-xs sm:text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                <span>สแกน QR Code เพื่อเข้าสู่ระบบได้สะดวกรวดเร็ว</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                <span>ทำแบบฝึกหัด 5 เสาหลัก และ <strong>Check-in ประจำวัน</strong></span>
              </div>
            </div>

            <button
              onClick={() => setActiveModal('patient')}
              className="w-full py-2.5 sm:py-3 px-4 rounded-2xl bg-[#e6004c] hover:bg-[#cc0044] text-white font-bold text-sm sm:text-base flex items-center justify-between shadow-md active:scale-[0.99] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                <span>เข้าสู่ระบบฝั่งคนไข้</span>
              </div>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

        </div>

      </div>

      {/* แถบชื่อผู้พัฒนา (Footer) ล่างสุดของหน้าจอ */}
      <footer className="w-full text-center py-4 mt-6 text-xs text-slate-500 pointer-events-auto shrink-0">
        <p>Clinical Growth Intelligence Platform • Version v1.1.0</p>
        <p>Designed & Developed by <span className="font-semibold text-slate-700">Nira.L</span> | © 2026 All Rights Reserved</p>
      </footer>

      {/* Pop-up เข้าสู่ระบบฝั่งคลินิก */}
      {activeModal === 'clinic' && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative border border-purple-100 animate-in fade-in zoom-in-95 duration-150">
            <button onClick={() => setActiveModal('none')} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-2 shadow-md">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">เข้าสู่ระบบบุคลากร</h3>
              <p className="text-xs text-slate-500">กรุณายืนยันตัวตนสำหรับแพทย์และเจ้าหน้าที่</p>
            </div>
            {errorMsg && <p className="text-xs text-rose-500 text-center mb-3">{errorMsg}</p>}
            <form onSubmit={handleClinicSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">ชื่อผู้ใช้</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={clinicUsername}
                    onChange={(e) => setClinicUsername(e.target.value)}
                    placeholder="Username"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">รหัสผ่าน</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={clinicPassword}
                    onChange={(e) => setClinicPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 bg-white"
                  />
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow hover:bg-indigo-700 transition-all mt-2 cursor-pointer">
                ยืนยันเข้าสู่ระบบ
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Pop-up เข้าสู่ระบบฝั่งคนไข้ */}
      {activeModal === 'patient' && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative border border-rose-100 animate-in fade-in zoom-in-95 duration-150">
            <button onClick={() => setActiveModal('none')} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center mx-auto mb-2 shadow-md">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">เข้าสู่ระบบผู้รับการดูแล</h3>
              <p className="text-xs text-slate-500">กรอกหมายเลข HN หรือเบอร์โทรศัพท์ที่ลงทะเบียนไว้</p>
            </div>
            {errorMsg && <p className="text-xs text-rose-500 text-center mb-3">{errorMsg}</p>}
            <form onSubmit={handlePatientSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">รหัส HN หรือ เบอร์โทรศัพท์</label>
                <input
                  type="text"
                  value={patientHnOrPhone}
                  onChange={(e) => setPatientHnOrPhone(e.target.value)}
                  placeholder="เช่น 670001 หรือ 0812345678"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 bg-white"
                />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-rose-500 text-white text-sm font-bold shadow hover:bg-rose-600 transition-all mt-2 cursor-pointer">
                เข้าใช้งาน
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
