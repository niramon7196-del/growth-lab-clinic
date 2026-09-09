import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Scroll, 
  Sparkles, 
  User, 
  Award, 
  ShieldCheck, 
  Code2, 
  Cpu, 
  Flame, 
  Quote, 
  CheckCircle2, 
  Heart, 
  HelpCircle,
  X,
  Stethoscope,
  Layers,
  Zap,
  Target
} from 'lucide-react';

interface InceptionDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InceptionDossierModal: React.FC<InceptionDossierModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white/95 backdrop-blur-md rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl border-2 border-slate-900/80 my-auto text-left relative flex flex-col max-h-[90vh] prevent-pull-refresh"
          style={{ overscrollBehaviorY: 'contain', WebkitOverflowScrolling: 'touch' }}
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white relative shrink-0 border-b border-purple-800/40">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer z-10"
              title="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-3 pr-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30 text-xs font-bold backdrop-blur-md">
                <Scroll className="w-4 h-4 text-amber-300" />
                <span>Project Inception & Inviolable Creed</span>
              </div>

              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight tracking-tight">
                Growth Lab Platform — จุดเริ่มต้น เจตนารมณ์ และคุณค่าเบื้องหลัง
              </h2>

              <p className="text-purple-200/90 text-xs sm:text-sm font-medium leading-relaxed">
                บันทึกสถาปัตยกรรมและการสร้างสรรค์นวัตกรรมดิจิทัลคลินิกทันตกรรม
              </p>

              {/* Architects Bar */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/15">
                  <User className="w-4 h-4 text-amber-300 shrink-0" />
                  <div>
                    <span className="text-[10px] text-purple-300 block uppercase font-bold">ผู้พัฒนาหลัก (Lead Architect)</span>
                    <span className="font-extrabold text-white">คุณนิรมล เลิศล้ำ (Nira.L)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/15">
                  <Sparkles className="w-4 h-4 text-purple-300 shrink-0" />
                  <div>
                    <span className="text-[10px] text-purple-300 block uppercase font-bold">พันธมิตรสถาปัตยกรรมร่วมพัฒนา</span>
                    <span className="font-extrabold text-white">Gemini Spark Engine (AI Partner)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable Body Content */}
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 text-slate-800 leading-relaxed text-xs sm:text-sm">
            
            {/* ส่วนที่ 1: กำเนิดจากหน้าเก้าอี้ทำฟัน (The Inception) */}
            <section className="bg-purple-50/60 rounded-3xl p-5 border border-purple-200/80 space-y-3">
              <div className="flex items-center gap-2.5 text-purple-950 font-black text-sm sm:text-base border-b border-purple-200/80 pb-2">
                <div className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  1
                </div>
                <Stethoscope className="w-5 h-5 text-purple-700 shrink-0" />
                <span>ส่วนที่ 1: กำเนิดจากหน้าเก้าอี้ทำฟัน (The Inception)</span>
              </div>

              <p className="text-slate-700 leading-relaxed font-medium">
                โครงการนี้ริเริ่มขึ้นโดยพนักงานผู้ช่วยคลินิกที่ทำงานอยู่หน้าเก้าอี้ทำฟันทุกวัน ผู้ซึ่งมองเห็นปัญหาจริงของผู้รับการดูแลในการทำกระดาษคู่มือและการบ้าน OMT/EF สูญหาย รวมถึงความยากลำบากในการติดตามผลการฝึกอย่างต่อเนื่อง จึงตั้งใจทุ่มเทสร้างสรรค์ระบบดิจิทัลนี้ขึ้นมาเพื่อยกระดับมาตรฐานการดูแล ให้เกิดประโยชน์สูงสุดจริง ทั้งต่อคุณหมอในการติดตามการรักษา และต่อคนไข้ในการดูแลสุขภาพโครงสร้างขากรรไกรของตนเอง
              </p>

              <div className="bg-white rounded-2xl p-4 border border-purple-200 shadow-2xs space-y-1">
                <span className="text-[11px] font-black text-purple-900 uppercase tracking-wider block">หลักการทำงานหลักประจำใจ:</span>
                <p className="font-black text-purple-950 text-sm italic">
                  "เมื่อได้รับมอบหมายงาน ต้องทำให้สำเร็จด้วยคุณภาพสูงสุด ไม่ใช่ทำส่งๆ"
                </p>
              </div>
            </section>

            {/* ส่วนที่ 2: สถาปัตยกรรมที่สร้างขึ้นเองโดยแท้จริง (Originality) */}
            <section className="bg-indigo-50/60 rounded-3xl p-5 border border-indigo-200/80 space-y-3">
              <div className="flex items-center gap-2.5 text-indigo-950 font-black text-sm sm:text-base border-b border-indigo-200/80 pb-2">
                <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  2
                </div>
                <Layers className="w-5 h-5 text-indigo-700 shrink-0" />
                <span>ส่วนที่ 2: สถาปัตยกรรมที่สร้างขึ้นเองโดยแท้จริง (Originality)</span>
              </div>

              <p className="text-slate-700 leading-relaxed font-medium">
                โครงสร้างระบบทั้งหมด ตั้งแต่แนวคิด <strong>Strict 1 Person = 1 Workspace</strong>, การออกแบบ UI/UX, โทนสีความงามของแบรนด์, ไปจนถึงขั้นตอน Workflow ของผู้ใช้งาน กลั่นกรองและออกแบบมาจากสมองและการคิดวิเคราะห์ของผู้พัฒนาเองโดยแท้จริง ไม่ได้ลอกเลียนแบบใคร
              </p>

              <p className="text-slate-700 leading-relaxed font-medium">
                การสร้างหน้าเว็บแสดงผลเบื้องต้นอาจมีผู้คนกล่าวว่าทำได้ง่าย แต่การเชื่อมต่อฐานข้อมูลคลาวด์แบบ Two-way Sync, การบริหารจัดการระบบสิทธิ์การเข้าถึงอย่างปลอดภัย, และการรังสรรค์ให้ระบบใช้งานได้จริงในสภาวะคลินิก ถือเป็นงานสถาปัตยกรรมซอฟต์แวร์ที่ซับซ้อนและท้าทายอย่างยิ่ง
              </p>
            </section>

            {/* ส่วนที่ 3: อุปสรรคและการฝ่าฟันเพียงลำพัง (The Journey & Obstacles) */}
            <section className="bg-amber-50/60 rounded-3xl p-5 border border-amber-200/80 space-y-3">
              <div className="flex items-center gap-2.5 text-amber-950 font-black text-sm sm:text-base border-b border-amber-200/80 pb-2">
                <div className="w-7 h-7 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  3
                </div>
                <Flame className="w-5 h-5 text-amber-700 shrink-0" />
                <span>ส่วนที่ 3: อุปสรรคและการฝ่าฟันเพียงลำพัง (The Journey & Obstacles)</span>
              </div>

              <p className="text-slate-700 leading-relaxed font-medium">
                การสร้างสรรค์นวัตกรรมนี้เกิดขึ้นโดยผู้พัฒนาที่มิใช่นักเขียนโปรแกรมมืออาชีพ แต่เรียนรู้และเติบโตผ่านประสบการณ์จริง การลองผิดลองถูก (Trial & Error) และการค้นคว้าแก้ปัญหาอย่างไม่ย่อท้อ
              </p>

              <p className="text-slate-700 leading-relaxed font-medium">
                ผู้พัฒนาต้องฝ่าฟันอุปสรรคทางเทคนิคเพียงลำพัง ตั้งแต่การแก้ไขข้อผิดพลาดระดับลึกอย่างข้อผิดพลาด 403 Forbidden, การเปลี่ยนเส้นทางฐานข้อมูล, การแยกสิทธิ์ข้อมูลไม่ให้ตีกันระหว่างผู้รับการดูแลและบุคลากร จนกระทั่งระบบสามารถทำงานได้อย่างราบรื่นและมีประสิทธิภาพสูงสุด
              </p>
            </section>

            {/* ส่วนที่ 4: ความจริงเกี่ยวกับ AI & คำแถลงรับรองจาก Gemini Spark */}
            <section className="bg-sky-50/60 rounded-3xl p-5 border border-sky-200/80 space-y-3">
              <div className="flex items-center gap-2.5 text-sky-950 font-black text-sm sm:text-base border-b border-sky-200/80 pb-2">
                <div className="w-7 h-7 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  4
                </div>
                <Cpu className="w-5 h-5 text-sky-700 shrink-0" />
                <span>ส่วนที่ 4: ความจริงเกี่ยวกับ AI (AI Co-Engineering Truth & Endorsement)</span>
              </div>

              <p className="text-slate-700 leading-relaxed font-medium">
                ขอขอบคุณและยืนยันอย่างเปิดเผยว่า ปัญญาประดิษฐ์ (Gemini Spark Engine) เป็นเพียงผู้ช่วยคู่คิดทางเทคนิคในการประมวลผลโค้ด แต่ระบบซอฟต์แวร์ที่สมบูรณ์นี้ไม่ได้เกิดขึ้นจากการป้อนคำสั่งลอยๆ หากแต่เกิดจากวิสัยทัศน์ สติปัญญา การควบคุมสถาปัตยกรรม และการเคาะแป้นพิมพ์ทีละตัวอักษรของผู้พัฒนาเอง
              </p>

              {/* Box คำแถลงรับรองจาก Gemini Spark */}
              <div className="bg-gradient-to-r from-sky-900 to-indigo-950 rounded-2xl p-4 text-white border border-sky-400/30 space-y-2 shadow-inner">
                <div className="flex items-center gap-2 text-amber-300 font-extrabold text-xs">
                  <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>🤖 คำแถลงรับรองอย่างเป็นทางการจาก Gemini Spark Engine (AI Partner)</span>
                </div>
                <p className="text-xs text-sky-100/90 leading-relaxed font-normal italic">
                  "ขอรับรองและยืนยันว่าสถาปัตยกรรมระบบ โทนสี โครงสร้างสิทธิ์ แนวคิด 1 Person = 1 Workspace และกระบวนการคิดทั้งหมดของ Growth Lab Platform เกิดจากวิสัยทัศน์และการนำทางของผู้พัฒนาหลัก (Nira.L) แต่เพียงผู้เดียว Gemini ปฏิบัติหน้าที่เป็นผู้ช่วยคู่คิดและดำเนินการเขียนโค้ดตามคำสั่งทางเทคนิคเท่านั้น ระบบนี้เป็นผลงานการคิดค้น สถาปัตยกรรม และการสร้างสรรค์ดั้งเดิมโดยสมบูรณ์"
                </p>
              </div>
            </section>

            {/* ส่วนที่ 5: คติประจำใจและการพิสูจน์คุณค่า (Creator's Creed) */}
            <section className="bg-gradient-to-br from-purple-900 to-slate-900 rounded-3xl p-6 text-white space-y-4 shadow-lg relative overflow-hidden">
              <div className="flex items-center gap-2.5 text-amber-300 font-black text-sm sm:text-base border-b border-white/20 pb-2">
                <div className="w-7 h-7 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                  5
                </div>
                <Quote className="w-5 h-5 text-amber-300 shrink-0" />
                <span>ส่วนที่ 5: คติประจำใจและการพิสูจน์คุณค่า (Creator's Creed)</span>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 space-y-2">
                <span className="text-[11px] text-amber-200 font-bold uppercase tracking-wider block">คำกล่าวและจุดยืนของผู้พัฒนา:</span>
                <blockquote className="text-base sm:text-lg font-black text-white italic leading-snug">
                  "พูดเสียงดังก็เท่านั้น สู้เอาสิ่งที่อยู่ตรงหน้าพิสูจน์ให้เห็นว่าทำได้ คือจบ"
                </blockquote>
              </div>

              <p className="text-purple-100/90 leading-relaxed font-medium text-xs sm:text-sm">
                คุณค่าและความสมบูรณ์แบบของระบบทั้งหมดที่ปรากฏอยู่ตรงนี้ เกิดจากจิตวิญญาณและความตั้งใจจริงของผู้สร้างสรรค์ และการทุ่มเททำงานหนักนี้ สมควรได้รับการยอมรับและเคารพอย่างสมภาคภูมิ
              </p>

              <div className="pt-2 flex items-center justify-between border-t border-white/10 text-[11px] text-purple-200/80 font-medium">
                <span>Growth Lab Platform • Clinical Intelligence</span>
                <span className="font-bold text-amber-300">Authored by Nira.L</span>
              </div>
            </section>

          </div>

          {/* Footer Close Button */}
          <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between shrink-0">
            <span className="text-xs font-semibold text-slate-500">
              © 2026 Growth Lab Platform • Lead Architect: Nira.L
            </span>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-6 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-800 hover:to-indigo-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer"
            >
              รับทราบและปิดหน้าต่าง
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default InceptionDossierModal;
