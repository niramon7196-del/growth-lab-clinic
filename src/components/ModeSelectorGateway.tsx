import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Building2, Smartphone, ArrowRight, ShieldCheck, QrCode, Sparkles, CheckCircle2, UserCheck, HeartHandshake } from 'lucide-react';
import { Logo } from './Logo';
import { InceptionDossierModal } from './InceptionDossierModal';

interface ModeSelectorGatewayProps {
  onSelectClinic: () => void;
  onSelectPatient: () => void;
}

export default function ModeSelectorGateway({
  onSelectClinic,
  onSelectPatient,
}: ModeSelectorGatewayProps) {
  const [showInceptionModal, setShowInceptionModal] = useState(false);
  return (
    <div className="w-full max-w-full min-h-[100dvh] bg-transparent relative flex flex-col justify-between select-none overflow-x-hidden box-border">
      {/* Luxury Ambient Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[720px] h-[720px] rounded-full bg-gradient-to-br from-purple-500/35 via-fuchsia-400/25 to-transparent blur-[90px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute -top-20 -right-32 w-[680px] h-[680px] rounded-full bg-gradient-to-bl from-pink-400/40 via-rose-300/30 to-purple-400/20 blur-[100px] animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute top-1/2 left-1/4 w-[760px] h-[760px] rounded-full bg-gradient-to-r from-violet-400/25 via-pink-300/20 to-sky-300/25 blur-[110px]" />
        <div className="absolute -bottom-48 -right-24 w-[720px] h-[720px] rounded-full bg-gradient-to-tl from-purple-500/35 via-pink-400/30 to-cyan-300/20 blur-[100px]" />
      </div>

      {/* Top Header */}
      <header className="relative z-20 w-full max-w-full lg:max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-2 flex items-center justify-between box-border">
        <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-xl border border-purple-300/70 shadow-[0_2px_12px_rgba(168,85,247,0.15)]">
          <Sparkles className="w-3.5 h-3.5 text-pink-500 shrink-0 animate-pulse" />
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-extrabold bg-gradient-to-r from-purple-700 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent tracking-wide">GROWTH LAB Portal Gateway</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 w-full max-w-full lg:max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col justify-center items-center overflow-x-hidden box-border">
        
        {/* Logo & Headline */}
        <div className="text-center space-y-4 max-w-2xl mx-auto mb-8">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center"
          >
            <div className="inline-flex items-center justify-center filter drop-shadow-[0_8px_20px_rgba(168,85,247,0.18)]">
              <Logo className="w-[clamp(260px,32vw,440px)] h-auto max-w-full object-contain" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-2"
          >
            <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-xl border-2 border-purple-300/90 shadow-xs text-xs font-black text-purple-950 tracking-widest uppercase">
              ✨ CLINICAL GROWTH INTELLIGENCE PLATFORM ✨
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#2E1A47] tracking-tight leading-tight">
              โปรดเลือกช่องทางเข้าสู่ระบบ
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-[#311B4E] font-bold leading-relaxed max-w-xl mx-auto">
              แยกโหมดการใช้งานอย่างชัดเจนระหว่างระบบบริหารจัดการคลินิก และระบบส่งการบ้านของผู้รับการดูแล
            </p>
          </motion.div>
        </div>

        {/* 2 Main Gateway Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 w-full max-w-4xl mx-auto mb-10">
          
          {/* Clinic Gateway Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-6 sm:p-8 rounded-[36px] border-2 border-purple-300/90 ring-2 ring-purple-300/30 shadow-[0_16px_40px_-8px_rgba(147,51,234,0.25)] hover:shadow-[0_24px_52px_rgba(147,51,234,0.4)] hover:border-purple-400 transition-all flex flex-col justify-between group relative overflow-hidden bg-gradient-to-br from-[#F8F5FF] via-[#F1E8FF] to-[#E8DCFF] backdrop-blur-2xl"
          >
            {/* Top Luminous Bar */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-fuchsia-600" />
            <div className="absolute top-0 right-0 w-36 h-36 bg-purple-400/25 rounded-bl-full pointer-events-none transition-all group-hover:scale-125 group-hover:bg-purple-400/35 blur-2xl" />

            <div className="space-y-5 relative z-10">
              <div className="flex items-center justify-between gap-2">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 text-white flex items-center justify-center shadow-[0_6px_20px_rgba(124,58,237,0.35)] group-hover:scale-105 transition-transform shrink-0">
                  <Building2 className="w-7 h-7" />
                </div>
                <span className="px-3.5 py-1.5 rounded-full bg-purple-200/95 text-purple-950 text-xs font-black border border-purple-300 shadow-2xs uppercase">
                  สำหรับทันตแพทย์ & เจ้าหน้าที่
                </span>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-black text-[#2E1A47] tracking-tight flex items-center gap-2">
                  <span>🖥️ ฝั่งคลินิก</span>
                  <span className="text-xs font-extrabold text-purple-950 bg-purple-200/90 px-2.5 py-0.5 rounded-lg border border-purple-300">
                    Clinic Management
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-[#311B4E] leading-relaxed font-bold">
                  เข้าสู่ระบบบริหารจัดการคลินิก แดชบอร์ดทันตแพทย์ สารบบประวัติผู้รับการดูแล ติดตามโปรแกรมฝึก EF & GNS และเครื่องมือแพทย์แบบเต็มรูปแบบ
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-purple-200/90">
                <div className="flex items-center gap-2 text-xs font-black text-[#2E1A47]">
                  <CheckCircle2 className="w-4 h-4 text-purple-700 shrink-0" />
                  <span>แดชบอร์ดประเมินพัฒนาการ 5 เสาหลัก</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-black text-[#2E1A47]">
                  <CheckCircle2 className="w-4 h-4 text-purple-700 shrink-0" />
                  <span>สารบบคนไข้และแฟ้มติดตามประวัติการฝึก</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-black text-[#2E1A47]">
                  <CheckCircle2 className="w-4 h-4 text-purple-700 shrink-0" />
                  <span>ระบบจัดการนัดหมาย บุคลากร และตั้งค่าคลินิก</span>
                </div>
              </div>
            </div>

            <div className="pt-6 relative z-10">
              <button
                type="button"
                onClick={onSelectClinic}
                className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-800 hover:via-indigo-800 hover:to-purple-900 text-white font-extrabold text-sm shadow-[0_8px_25px_rgba(124,58,237,0.35)] hover:shadow-[0_12px_32px_rgba(124,58,237,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2 group-hover:gap-3 border border-purple-300/40"
              >
                <ShieldCheck className="w-4.5 h-4.5 text-purple-200" />
                <span>เข้าสู่ระบบฝั่งคลินิก</span>
                <ArrowRight className="w-4 h-4 text-purple-200 ml-auto group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>

          {/* Patient Gateway Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="p-6 sm:p-8 rounded-[36px] border-2 border-rose-300/90 ring-2 ring-rose-300/30 shadow-[0_16px_40px_-8px_rgba(244,63,94,0.25)] hover:shadow-[0_24px_52px_rgba(244,63,94,0.4)] hover:border-rose-400 transition-all flex flex-col justify-between group relative overflow-hidden bg-gradient-to-br from-[#FFF0F4] via-[#FFE4EC] to-[#FFEDEB] backdrop-blur-2xl"
          >
            {/* Top Luminous Bar */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-500" />
            <div className="absolute top-0 right-0 w-36 h-36 bg-rose-400/25 rounded-bl-full pointer-events-none transition-all group-hover:scale-125 group-hover:bg-rose-400/35 blur-2xl" />

            <div className="space-y-5 relative z-10">
              <div className="flex items-center justify-between gap-2">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 via-pink-500 to-coral-500 text-white flex items-center justify-center shadow-[0_6px_20px_rgba(244,63,94,0.35)] group-hover:scale-105 transition-transform shrink-0">
                  <Smartphone className="w-7 h-7" />
                </div>
                <span className="px-3.5 py-1.5 rounded-full bg-rose-200/95 text-rose-950 text-xs font-black border border-rose-300 shadow-2xs uppercase">
                  สำหรับผู้รับการดูแล & ครอบครัว
                </span>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-black text-[#2E1A47] tracking-tight flex items-center gap-2">
                  <span>📱 ฝั่งผู้ใช้</span>
                  <span className="text-xs font-extrabold text-rose-950 bg-rose-200/90 px-2.5 py-0.5 rounded-lg border border-rose-300">
                    Patient Portal
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-[#311B4E] leading-relaxed font-bold">
                  เข้าสู่ระบบสแกน QR Code จากคลินิก หรือกรอกรหัส HN สำรอง เพื่อเข้าทำแบบฝึกหัดประจำวัน บันทึกการนอน และติดตามพัฒนาการ
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-rose-200/90">
                <div className="flex items-center gap-2 text-xs font-black text-[#2E1A47]">
                  <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>สแกน QR Code จากเอกสารคลินิกเข้าสู่ระบบทันที</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-black text-[#2E1A47]">
                  <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>กรอกรหัส HN หรือ เบอร์โทรศัพท์ที่ลงทะเบียนไว้</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-black text-[#2E1A47]">
                  <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>ทำแบบฝึกหัด 5 เสาหลัก และ Check-in ประจำวัน</span>
                </div>
              </div>
            </div>

            <div className="pt-6 relative z-10">
              <button
                type="button"
                onClick={onSelectPatient}
                className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 hover:from-rose-600 hover:via-pink-700 hover:to-rose-700 text-white font-extrabold text-sm shadow-[0_8px_25px_rgba(244,63,94,0.35)] hover:shadow-[0_12px_32px_rgba(244,63,94,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2 group-hover:gap-3 border border-rose-300/40"
              >
                <QrCode className="w-4.5 h-4.5 text-rose-100" />
                <span>สแกน QR / เข้าสู่ระบบฝั่งคนไข้</span>
                <ArrowRight className="w-4 h-4 text-rose-100 ml-auto group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>

        </div>

        {/* 5 Core Pillars Section */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="w-full max-w-4xl mx-auto text-center space-y-3"
        >
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider px-4 py-1.5 rounded-full bg-white/90 border-2 border-purple-300/90 shadow-xs max-w-max mx-auto text-purple-950">
            <HeartHandshake className="w-4 h-4 lg:w-5 lg:h-5 text-purple-700 shrink-0" />
            <span className="bg-gradient-to-r from-purple-950 via-indigo-900 to-purple-950 bg-clip-text text-transparent">
              ✨ 5 เสาหลักการเจริญเติบโต (5 CORE PILLARS OF GROWTH)
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2 sm:gap-3 lg:gap-4 w-full">
            {/* 1. Nutrition */}
            <div className="flex flex-col items-center justify-center text-center bg-gradient-to-br from-emerald-100 via-emerald-50 to-teal-100 hover:from-emerald-200 hover:to-teal-200 p-2.5 sm:p-4 rounded-2xl border-2 border-emerald-400/90 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group cursor-default">
              <span className="text-2xl sm:text-3xl lg:text-4xl mb-1 group-hover:scale-110 transition-transform filter drop-shadow-xs">🥗</span>
              <span className="text-[10px] sm:text-xs font-black text-emerald-950 leading-tight">Nutrition</span>
              <span className="text-[8px] sm:text-[10px] text-emerald-900 font-extrabold leading-tight mt-0.5">โภชนาการ</span>
            </div>

            {/* 2. Sleep */}
            <div className="flex flex-col items-center justify-center text-center bg-gradient-to-br from-indigo-100 via-blue-50 to-sky-100 hover:from-indigo-200 hover:to-sky-200 p-2.5 sm:p-4 rounded-2xl border-2 border-indigo-400/90 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group cursor-default">
              <span className="text-2xl sm:text-3xl lg:text-4xl mb-1 group-hover:scale-110 transition-transform filter drop-shadow-xs">😴</span>
              <span className="text-[10px] sm:text-xs font-black text-indigo-950 leading-tight">Sleep</span>
              <span className="text-[8px] sm:text-[10px] text-indigo-900 font-extrabold leading-tight mt-0.5">การนอนหลับ</span>
            </div>

            {/* 3. Exercise */}
            <div className="flex flex-col items-center justify-center text-center bg-gradient-to-br from-amber-100 via-orange-50 to-rose-100 hover:from-amber-200 hover:to-orange-200 p-2.5 sm:p-4 rounded-2xl border-2 border-orange-400/90 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group cursor-default">
              <span className="text-2xl sm:text-3xl lg:text-4xl mb-1 group-hover:scale-110 transition-transform filter drop-shadow-xs">🏃</span>
              <span className="text-[10px] sm:text-xs font-black text-amber-950 leading-tight">Exercise</span>
              <span className="text-[8px] sm:text-[10px] text-orange-950 font-extrabold leading-tight mt-0.5">การเคลื่อนไหว</span>
            </div>

            {/* 4. Orofacial / EF */}
            <div className="flex flex-col items-center justify-center text-center bg-gradient-to-br from-fuchsia-100 via-purple-50 to-pink-100 hover:from-fuchsia-200 hover:to-purple-200 p-2.5 sm:p-4 rounded-2xl border-2 border-fuchsia-400/90 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group cursor-default">
              <span className="text-2xl sm:text-3xl lg:text-4xl mb-1 group-hover:scale-110 transition-transform filter drop-shadow-xs">👄</span>
              <span className="text-[10px] sm:text-xs font-black text-fuchsia-950 leading-tight">Orofacial</span>
              <span className="text-[8px] sm:text-[10px] text-fuchsia-900 font-extrabold leading-tight mt-0.5">กล้ามเนื้อปาก</span>
            </div>

            {/* 5. Family */}
            <div className="flex flex-col items-center justify-center text-center bg-gradient-to-br from-rose-100 via-pink-50 to-purple-100 hover:from-rose-200 hover:to-purple-200 p-2.5 sm:p-4 rounded-2xl border-2 border-rose-400/90 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group cursor-default">
              <span className="text-2xl sm:text-3xl lg:text-4xl mb-1 group-hover:scale-110 transition-transform filter drop-shadow-xs">👨‍👩‍👧‍👦</span>
              <span className="text-[10px] sm:text-xs font-black text-rose-950 leading-tight">Family</span>
              <span className="text-[8px] sm:text-[10px] text-rose-900 font-extrabold leading-tight mt-0.5">ครอบครัว</span>
            </div>
          </div>
        </motion.div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-2.5 px-4 text-center text-xs text-slate-500 font-medium border-t border-purple-200/50 backdrop-blur-xs flex flex-col items-center justify-center gap-0.5">
        <p className="font-medium text-slate-600 leading-normal text-[10px] sm:text-[11px]">Clinical Growth Intelligence Platform • Version 1.0</p>
        <button 
          onClick={() => setShowInceptionModal(true)}
          className="inline-flex items-center justify-center gap-1.5 text-slate-500 pt-0.5 cursor-pointer hover:opacity-80 transition-all group"
        >
          <span className="text-[10px] sm:text-[11px] text-slate-500">Designed & Developed by</span>
          <span className="text-[10px] sm:text-[11px] font-bold tracking-wide bg-gradient-to-r from-[#4C1D95] via-[#7C3AED] via-[#C026D3] to-[#2563EB] bg-clip-text text-transparent group-hover:underline">Nira.L</span>
          <span className="text-slate-400 text-[10px] sm:text-[11px]">| © 2026 All Rights Reserved</span>
        </button>
      </footer>

      <InceptionDossierModal 
        isOpen={showInceptionModal} 
        onClose={() => setShowInceptionModal(false)} 
      />
    </div>
  );
}
