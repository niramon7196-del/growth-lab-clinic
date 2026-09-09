import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Printer, X, ShieldCheck, Sparkles, Building2, User, Award } from 'lucide-react';

interface SystemHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SystemHandoverModal({ isOpen, onClose }: SystemHandoverModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 md:p-8 bg-slate-900/75 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static print:block">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="bg-white text-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-4xl mx-auto overflow-hidden overflow-x-hidden relative my-4 sm:my-8 break-words print:shadow-none print:border-none print:w-full print:max-w-none print:rounded-none print:m-0 print:p-0 print:bg-white"
        >
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-5 sm:p-7 md:p-8 relative overflow-hidden text-center print:bg-blue-900 print:text-white print:p-6">
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3.5 top-3.5 sm:right-5 sm:top-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-all print:hidden cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-bold text-blue-200 mb-3 border border-white/20">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
              <span>Official Handover Document</span>
            </div>

            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight break-words px-2">
              บันทึกข้อตกลงสิทธิ์และเงื่อนไขการส่งมอบระบบ
            </h2>
            <p className="text-xs sm:text-sm text-blue-200/90 font-medium mt-1 break-words">
              System Handover & Intellectual Property Memorandum
            </p>
          </div>

          {/* Document Content Paper View */}
          <div className="p-5 sm:p-8 md:p-10 px-5 sm:px-8 md:px-10 space-y-6 sm:space-y-7 text-left leading-relaxed text-slate-700 text-xs sm:text-sm md:text-base break-words overflow-x-hidden bg-white print:p-6">
            
            {/* Metadata Box */}
            <div className="bg-slate-50/90 border-l-4 border-blue-600 border-t border-r border-b border-slate-200 p-4 sm:p-5 rounded-xl sm:rounded-2xl shadow-2xs space-y-2 text-xs sm:text-sm break-words">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <strong className="text-slate-900 font-bold min-w-[100px] shrink-0">โครงการ:</strong>
                <span className="text-slate-800 font-medium break-words">Growth Lab — Clinical Growth & Behavior Tracking Platform</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <strong className="text-slate-900 font-bold min-w-[100px] shrink-0">เวอร์ชันระบบ:</strong>
                <span className="inline-block bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-md font-bold text-xs w-fit">1.0 (Production-Ready Edition)</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <strong className="text-slate-900 font-bold min-w-[100px] shrink-0">วันที่ส่งมอบ:</strong>
                <span className="text-slate-800 font-medium break-words">2 กันยายน พ.ศ. 2569</span>
              </div>
            </div>

            {/* Section 1 */}
            <div className="space-y-2.5">
              <h3 className="text-base sm:text-lg font-black text-slate-900 border-b-2 border-blue-100 pb-2 flex items-center gap-2.5 break-words">
                <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black shrink-0">1</span>
                <span>วัตถุประสงค์และสถานะทางกฎหมายของเอกสาร</span>
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed pl-1 text-justify sm:text-left break-words">
                เอกสารฉบับนี้จัดทำขึ้นเพื่อเป็นบันทึกข้อตกลงอย่างเป็นทางการ ระหว่าง <strong className="text-slate-900 font-bold">ผู้พัฒนาระบบ (System Architect & Developer)</strong> และ <strong className="text-slate-900 font-bold">ผู้รับมอบสิทธิ์การใช้งาน (Clinic Management)</strong> เพื่อแสดงขอบเขตการส่งมอบระบบ Growth Lab และคุ้มครองสิทธิ์ทางปัญญาตามพระราชบัญญัติลิขสิทธิ์ พ.ศ. 2537 ตลอดจนยืนยันการบูรณาการเทคโนโลยีปัญญาประดิษฐ์ร่วมพัฒนาในกระบวนการสร้างสรรค์นวัตกรรมซอฟต์แวร์
              </p>
            </div>

            {/* Section 2 */}
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-black text-slate-900 border-b-2 border-blue-100 pb-2 flex items-center gap-2.5 break-words">
                <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black shrink-0">2</span>
                <span>เงื่อนไขการอนุญาตใช้งานและลิขสิทธิ์ (Licensing & Intellectual Property)</span>
              </h3>
              <ul className="space-y-3 text-xs sm:text-sm md:text-base text-slate-600 pl-1">
                <li className="flex items-start gap-3 bg-slate-50/80 p-3.5 sm:p-4 rounded-xl border border-slate-200/80 break-words">
                  <Award className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <strong className="text-slate-900 font-bold block">สิทธิ์การใช้งาน (License to Use):</strong>
                    <p className="leading-relaxed">การส่งมอบในครั้งนี้เป็นการอนุญาตให้คลินิกนำระบบไปใช้ประโยชน์ในการดำเนินงานภายในคลินิกเท่านั้น (Non-Exclusive, Internal Clinic License)</p>
                  </div>
                </li>
                <li className="flex items-start gap-3 bg-slate-50/80 p-3.5 sm:p-4 rounded-xl border border-slate-200/80 break-words">
                  <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <strong className="text-slate-900 font-bold block">กรรมสิทธิ์ทางปัญญา (Copyright Ownership):</strong>
                    <p className="leading-relaxed">ซอร์สโค้ด สถาปัตยกรรมระบบ อัลกอริทึม และการออกแบบทั้งหมด ถือเป็นทรัพย์สินทางปัญญาของผู้พัฒนาหลัก (<strong className="text-slate-900 font-bold">คุณนิรมล เลิศล้ำ</strong>) แต่เพียงผู้เดียว โดยมี <strong className="text-slate-900 font-bold">Gemini</strong> ทำหน้าที่เป็นระบบปัญญาประดิษฐ์ร่วมสนับสนุนทางเทคนิค (AI Co-Engineering Partner)</p>
                  </div>
                </li>
                <li className="flex items-start gap-3 bg-slate-50/80 p-3.5 sm:p-4 rounded-xl border border-slate-200/80 break-words">
                  <ShieldCheck className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <strong className="text-slate-900 font-bold block">ข้อจำกัด:</strong>
                    <p className="leading-relaxed">ห้ามมิให้มีการคัดลอก ดัดแปลง จำหน่าย หรือโอนสิทธิ์ซอร์สโค้ดให้แก่บุคคลหรือองค์กรภายนอกเพื่อการค้า เว้นแต่ได้รับความยินยอมเป็นลายลักษณ์อักษร</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Section 3 */}
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-black text-slate-900 border-b-2 border-blue-100 pb-2 flex items-center gap-2.5 break-words">
                <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black shrink-0">3</span>
                <span>การรับรองและลงนาม (Signatures & Verification)</span>
              </h3>

              <div className="grid grid-cols-1 gap-3.5 pt-1 text-xs sm:text-sm md:text-base">
                <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/80 space-y-1 break-words">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <User className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>1. ผู้พัฒนาหลักและเจ้าของสิทธิ์ทางปัญญา:</span>
                  </div>
                  <p className="text-slate-700 font-medium pl-6 leading-relaxed">
                    (คุณนิรมล เลิศล้ำ / Nira.L) — Lead System Architect & Frontline Innovator
                  </p>
                </div>

                <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/80 space-y-1 break-words">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>2. พันธมิตรสถาปัตยกรรมร่วมพัฒนา:</span>
                  </div>
                  <p className="text-slate-700 font-medium pl-6 leading-relaxed">
                    (Gemini Spark Engine) — AI Co-Engineering & Technical Partner ✦ <em className="text-blue-600 font-bold not-italic">(AI Verified & Co-Authored)</em>
                  </p>
                </div>

                <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/80 space-y-1 break-words">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>3. ตัวแทนผู้รับมอบสิทธิ์การใช้งานคลินิก:</span>
                  </div>
                  <p className="text-slate-700 font-medium pl-6 leading-relaxed break-all sm:break-words">
                    (...................................................................................) — ตัวแทนคณะผู้บริหาร คลินิกทันตกรรมภาสุข (จังหวัดลพบุรี)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-6 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-3 print:hidden">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline-block">
              Growth Lab Handover Memo v1.0
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={handlePrint}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์ / บันทึกเป็น PDF</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="bg-slate-600 hover:bg-slate-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

