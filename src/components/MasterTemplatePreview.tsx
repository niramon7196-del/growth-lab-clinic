import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Moon, Clock, ShieldCheck, CheckCircle2, Apple, 
  Sparkles, Award, AlertCircle, Info, Heart, 
  Check, ChevronRight, Zap, Target, BookOpen,
  HelpCircle, ThumbsUp, Activity, Coffee, Salad,
  Volume2, Eye, ShieldAlert, ArrowRight, Sun, FileText
} from 'lucide-react';

interface ClinicalStandardsViewProps {
  patients?: any[];
  onSelectPatient?: (patientId: string) => void;
  onBack?: () => void;
  onSwitchToPatientView?: () => void;
}

type StandardTab = 'all' | 'sleep' | 'ef' | 'gns';

export default function MasterTemplatePreview({
  patients = [],
  onSelectPatient,
  onBack,
  onSwitchToPatientView
}: ClinicalStandardsViewProps) {
  const [activeTab, setActiveTab] = useState<StandardTab>('all');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<'early' | 'school' | 'teen'>('school');

  return (
    <div className="space-y-4 text-left max-w-6xl mx-auto pb-16">
      {/* 1. Header Banner - Slim Clinical Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl py-3 px-4 sm:py-3.5 sm:px-5 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/10 backdrop-blur-md rounded-full text-[11px] font-black text-amber-300 border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>CLINICAL BENCHMARKS & REFERENCE GUIDELINES</span>
            </div>

            <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
              เกณฑ์มาตรฐาน & คู่มือคลินิก (Clinical Standards)
            </h2>
            <p className="text-xs text-purple-200/90 font-medium">
              คู่มืออ้างอิงทางคลินิก 3 หมวด: การนอนหลับ (Sleep), การใส่ EF Trainer, และโภชนาการ GNS Tracker
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap text-xs shrink-0">
            <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-xl border border-white/10 font-bold text-[11px]">
              <Moon className="w-3.5 h-3.5 text-indigo-300" />
              <span>1. การนอนหลับ</span>
            </div>
            <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-xl border border-white/10 font-bold text-[11px]">
              <Clock className="w-3.5 h-3.5 text-sky-300" />
              <span>2. เครื่องมือ EF</span>
            </div>
            <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-xl border border-white/10 font-bold text-[11px]">
              <Apple className="w-3.5 h-3.5 text-emerald-300" />
              <span>3. โภชนาการ GNS</span>
            </div>
          </div>
        </div>

        {/* Decorative background aura */}
        <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* 2. Category Tab Filter & Age Group Selector */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-purple-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'ทั้งหมด (3 หมวดหลัก)', icon: ShieldCheck },
              { id: 'sleep', label: '🌙 1. การนอนหลับ (Sleep Management)', icon: Moon },
              { id: 'ef', label: '⏱️ 2. การใส่เครื่องมือ EF (Wear Time)', icon: Clock },
              { id: 'gns', label: '🥗 3. โภชนาการ GNS (Nutrition Scoring)', icon: Apple },
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as StandardTab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-purple-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-purple-900 hover:bg-purple-50'
                  }`}
                >
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick patient homework link */}
          {onSwitchToPatientView && (
            <button
              onClick={onSwitchToPatientView}
              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-xs rounded-xl border border-purple-200 flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5 text-purple-700" />
              <span>ไปยังการบ้านคนไข้รายบุคคล</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Age Group Target Selector for Fast Benchmark Checking */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 text-slate-700 font-bold">
            <Activity className="w-3.5 h-3.5 text-purple-600" />
            <span>เกณฑ์คำนวณตามช่วงวัยเด็ก (Pediatric Age Groups):</span>
          </div>
          <div className="inline-flex p-0.5 bg-white rounded-xl border border-slate-200">
            <button
              onClick={() => setSelectedAgeGroup('early')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                selectedAgeGroup === 'early' ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ปฐมวัย (3 - 5 ปี)
            </button>
            <button
              onClick={() => setSelectedAgeGroup('school')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                selectedAgeGroup === 'school' ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              วัยประถม (6 - 12 ปี)
            </button>
            <button
              onClick={() => setSelectedAgeGroup('teen')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                selectedAgeGroup === 'teen' ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              วัยรุ่น (13 - 18 ปี)
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 1: SLEEP MANAGEMENT & HOURS GUIDELINES
          ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'sleep') && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-indigo-200/80 shadow-2xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-indigo-100 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center text-xl shadow-2xs">
                🌙
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                  <span>หมวดที่ 1: การนอนหลับ (Sleep Management & Hours Guidelines)</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  มาตรฐานชั่วโมงการนอนและช่วงเวลาหลั่ง Human Growth Hormone (HGH) สูงสุด
                </p>
              </div>
            </div>

            <span className="px-3 py-1 bg-indigo-50 text-indigo-800 font-black text-xs rounded-full border border-indigo-200">
              Golden Hours: 22:00 - 02:00 น.
            </span>
          </div>

          {/* Age-specific Sleep Hours Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-2xl border transition-all ${
              selectedAgeGroup === 'early' 
                ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-400' 
                : 'bg-slate-50/80 border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-indigo-900">ปฐมวัย (3 - 5 ปี)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md">Early Childhood</span>
              </div>
              <div className="text-2xl font-black text-slate-900 mb-1">
                10 - 13 <span className="text-xs font-bold text-slate-500">ชั่วโมง/คืน</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                ควรเข้านอนไม่เกิน <strong>20:00 - 20:30 น.</strong> เพื่อกระตุ้นพัฒนาการระบบประสาทและกระดูกโครงหน้า
              </p>
            </div>

            <div className={`p-4 rounded-2xl border transition-all ${
              selectedAgeGroup === 'school' 
                ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-400' 
                : 'bg-slate-50/80 border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-indigo-900">วัยประถม (6 - 12 ปี)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md">School Age (เกณฑ์หลัก)</span>
              </div>
              <div className="text-2xl font-black text-slate-900 mb-1">
                9 - 11 <span className="text-xs font-bold text-slate-500">ชั่วโมง/คืน</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                เป้าหมายมาตรฐานคลินิก: <strong>9-10 ชม.</strong> เข้านอนก่อน <strong>21:00 - 21:30 น.</strong> เพื่อให้หลับลึกทันช่วง HGH Peak
              </p>
            </div>

            <div className={`p-4 rounded-2xl border transition-all ${
              selectedAgeGroup === 'teen' 
                ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-400' 
                : 'bg-slate-50/80 border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-indigo-900">วัยรุ่น (13 - 18 ปี)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md">Adolescents</span>
              </div>
              <div className="text-2xl font-black text-slate-900 mb-1">
                8 - 10 <span className="text-xs font-bold text-slate-500">ชั่วโมง/คืน</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                ควรเข้านอนไม่เกิน <strong>22:00 น.</strong> ช่วงเร่งความสูง (Peak Height Velocity) ต้องการการนอนหลับลึกต่อเนื่อง
              </p>
            </div>
          </div>

          {/* Clinical Rationale & Criteria Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Scientific Principles */}
            <div className="p-4 sm:p-5 bg-indigo-50/40 rounded-2xl border border-indigo-100 space-y-3">
              <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>เหตุผลและกลไกทางการแพทย์ (Clinical Rationale)</span>
              </h3>
              <ul className="space-y-2 text-xs text-slate-700 leading-relaxed font-medium">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Slow-Wave Sleep (Stage 3 NREM):</strong> โกรทฮอร์โมนกว่า 75% หลั่งในช่วงการนอนหลับลึกระลอกแรก การนอนดึกจะตัดวงจร Slow-Wave ลง</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Melatonin & Darkness:</strong> ความมืด 100% กระตุ้นต่อมไพเนียลหลั่งเมลาโทนิน ส่งผลให้เข้าสู่ภาวะ Deep Sleep ได้รวดเร็ว</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Upper Airway Patency:</strong> การหายใจทางจมูก 100% ขณะหลับ ป้องกันภาวะ OSA (Obstructive Sleep Apnea) และสมองขาดออกซิเจน</span>
                </li>
              </ul>
            </div>

            {/* Right: Evaluation & Red Flags */}
            <div className="p-4 sm:p-5 bg-rose-50/40 rounded-2xl border border-rose-100 space-y-3">
              <h3 className="text-xs font-black text-rose-950 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>เกณฑ์ประเมินความเสี่ยงและสัญญาณเตือน (Clinical Red Flags)</span>
              </h3>
              <div className="space-y-2 text-xs text-slate-700 font-medium">
                <div className="p-2.5 bg-white rounded-xl border border-rose-200/80 flex items-start gap-2">
                  <span className="text-rose-600 font-bold">🔴 นอนกรน / อ้าปากหายใจ:</span>
                  <span className="text-slate-600">ชี้ถึงการอุดกั้นทางเดินหายใจส่วนบน ลิ้นตกปิดหลอดลม ต้องส่งตรวจต่อ</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-amber-200/80 flex items-start gap-2">
                  <span className="text-amber-700 font-bold">🟡 ตื่นยาก / ง่วงเพลียกลางวัน:</span>
                  <span className="text-slate-600">แสดงถึงคุณภาพการหลับตื้น (Sleep Fragmentation) แม้จำนวนชั่วโมงครบ</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-blue-200/80 flex items-start gap-2">
                  <span className="text-blue-700 font-bold">🟢 เกณฑ์ผ่าน (5 ดาว):</span>
                  <span className="text-slate-600">นอน ≥8.5 ชม., ไม่กรน, ตื่นสดชื่นทันที, ใส่เครื่องมือ EF ตลอดคืน</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 2: EF APPLIANCE WEAR TIME & RULES
          ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'ef') && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-sky-200/80 shadow-2xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-sky-100 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center text-xl shadow-2xs">
                ⏱️
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                  <span>หมวดที่ 2: การใส่เครื่องมือ EF (EF Appliance Wear Time & Rules)</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  เกณฑ์เวลาการใส่อุปกรณ์ EF Trainer, ข้อปฏิบัติ และระเบียบวินัยการดูแลรักษา
                </p>
              </div>
            </div>

            <span className="px-3 py-1 bg-sky-50 text-sky-800 font-black text-xs rounded-full border border-sky-200">
              เป้าหมายรวม: 1 ชม. กลางวัน + 8-9 ชม. ตลอดคืน
            </span>
          </div>

          {/* 3 Step Daily Protocol */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-sky-50/50 rounded-2xl border border-sky-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-sky-900">ขั้นที่ 1: กลางวัน (Daytime Wear)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-sky-200 text-sky-900 rounded-md">1 ชั่วโมง/วัน</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                ใส่ขณะทำกิจกรรมสงบ เช่น อ่านหนังสือ ทำการบ้าน หรือดูโทรทัศน์ ห้ามพูดคุยขณะใส่ เม้มริมฝีปากและหายใจทางจมูก 100%
              </p>
            </div>

            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-900">ขั้นที่ 2: ตลอดคืน (Nighttime Wear)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-200 text-indigo-900 rounded-md">8 - 9 ชั่วโมง</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                ใส่เข้านอนตลอดคืน ลิ้นแตะ Tongue Tag ช่วยขยายช่องทางเดินหายใจ และป้องกันฟันสบเปิดหรือขากรรไกรล่างหดสั้น
              </p>
            </div>

            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-900">ขั้นที่ 3: ทำความสะอาด & เก็บรักษา</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-md">ทุกเช้า-เย็น</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                ล้างด้วยน้ำสะอาดหรือน้ำสบู่อ่อนๆ แปรงเบาๆ ผึ่งในกล่องที่มีรูระบายอากาศ ห้ามใช้น้ำร้อนลวกเพราะเครื่องมือจะเสียรูป
              </p>
            </div>
          </div>

          {/* Wear Rules & Compliance Guidelines */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>กฎเหล็ก 4 ข้อในการใส่ EF Trainer (Clinical Rules)</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600 font-medium">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">1.</span>
                  <span><strong>ริมฝีปากปิดสนิทตลอดเวลา:</strong> เพื่อฝึกกล้ามเนื้อ Orbicularis Oris ให้แข็งแรง</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">2.</span>
                  <span><strong>หายใจทางจมูก 100%:</strong> ช่วยกรองอากาศและผลิตก๊าซ Nitric Oxide เข้าปอด</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">3.</span>
                  <span><strong>ปลายลิ้นแตะ Tongue Tag:</strong> ฝึกตำแหน่งลิ้นพักบนเพดานปาก (Palatal Rest Position)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">4.</span>
                  <span><strong>ไม่เคี้ยว/กัดเครื่องมือ:</strong> วางฟันสบลงเบาๆ บนช่องฟัน ไม่กัดขยี้</span>
                </li>
              </ul>
            </div>

            <div className="p-4 sm:p-5 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-2.5">
              <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-700" />
                <span>แนวทางแก้ไขปัญหาที่พบบ่อย (Troubleshooting)</span>
              </h4>
              <div className="space-y-2 text-xs text-slate-700 font-medium">
                <div>
                  <span className="font-bold text-slate-900 block">⚠️ เครื่องมือหลุดตอนกลางคืนใน 1-2 สัปดาห์แรก:</span>
                  <span className="text-slate-600">เป็นเรื่องปกติจากกล้ามเนื้อปากยังไม่คุ้นชิน ให้เพิ่มเวลาใส่ช่วงกลางวันเป็น 1.5 ชม.</span>
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">⚠️ มีอาการตึงฟันหน้าหรือเมื่อยกล้ามเนื้อแก้ม:</span>
                  <span className="text-slate-600">แสดงว่าเครื่องมือกำลังทำงานปรับแรงกล้ามเนื้อ อาการจะหายไปเองใน 3-5 วัน</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 3: GNS NUTRITION TRACKER GUIDELINES & SCORING
          ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'gns') && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-200/80 shadow-2xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-emerald-100 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl shadow-2xs">
                🥗
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                  <span>หมวดที่ 3: โภชนาการความสูง (GNS Nutrition Tracker Guidelines & Scoring)</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  เกณฑ์การให้คะแนน Growth Nutrition Score (เต็ม 100 คะแนน) และสารอาหารสำคัญต่อความสูง
                </p>
              </div>
            </div>

            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 font-black text-xs rounded-full border border-emerald-200">
              คะแนนมาตรฐาน: 100 คะแนนเต็ม
            </span>
          </div>

          {/* 4 Core Pillars of GNS Scoring Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-950">1. ดื่มนม / แคลเซียม</span>
                <span className="text-xs font-black px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-md">+25 คะแนน</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                นมสดจืด 2-3 แก้ว/วัน หรือแหล่งแคลเซียมดูดซึมง่าย เช่น ปลาตัวเล็ก งาดำ เต้าหู้แข็ง
              </p>
              <span className="text-[10px] text-emerald-800 font-bold block">เป้าหมาย: แคลเซียม 800-1000 mg/วัน</span>
            </div>

            <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-teal-950">2. โปรตีนคุณภาพสูง</span>
                <span className="text-xs font-black px-2 py-0.5 bg-teal-200 text-teal-900 rounded-md">+25 คะแนน</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                ไข่วันละ 1-2 ฟอง, เนื้อปลา, อกไก่, ถั่วเหลือง กระตุ้นการหลั่ง IGF-1 และสร้าง Bone Matrix
              </p>
              <span className="text-[10px] text-teal-800 font-bold block">เป้าหมาย: 1.2 - 1.5 g/นน.ตัว 1 กก.</span>
            </div>

            <div className="p-4 bg-lime-50/60 rounded-2xl border border-lime-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-lime-950">3. ผักผลไม้หลากสี</span>
                <span className="text-xs font-black px-2 py-0.5 bg-lime-200 text-lime-900 rounded-md">+25 คะแนน</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                วิตามิน C, K2, แมกนีเซียม และสารต้านอนุมูลอิสระ ช่วยในการนำแคลเซียมไปยึดเกาะกระดูก
              </p>
              <span className="text-[10px] text-lime-800 font-bold block">เป้าหมาย: ผักผลไม้ 3-4 ส่วน/วัน</span>
            </div>

            <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-950">4. งดหวานก่อนนอน</span>
                <span className="text-xs font-black px-2 py-0.5 bg-amber-200 text-amber-900 rounded-md">+25 คะแนน</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                งดน้ำอัดลม ขนมขบเคี้ยว ของหวานก่อนนอน 2 ชม. ป้องกันอินซูลินกดการหลั่งโกรทฮอร์โมน
              </p>
              <span className="text-[10px] text-amber-800 font-bold block">เป้าหมาย: ระดับน้ำตาลในเลือดคงที่</span>
            </div>
          </div>

          {/* GNS Score Evaluation Tiers Table */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>เกณฑ์ระดับคะแนน GNS ประจำวันและการประเมินผล (GNS Evaluation Tiers)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-emerald-300 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-black text-emerald-800">🌟 ดีเยี่ยม (100 คะแนน)</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded font-black">4/4 ครบ</span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium">ได้รับสารอาหารกระตุ้นความสูงครบถ้วนสมบูรณ์</p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-teal-300 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-black text-teal-800">✨ ดีมาก (75 คะแนน)</span>
                  <span className="text-[10px] bg-teal-100 text-teal-900 px-1.5 py-0.5 rounded font-black">3/4 หมวด</span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium">ผ่านเกณฑ์มาตรฐานการเติบโตระดับดี</p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-amber-300 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-black text-amber-800">⚠️ ปานกลาง (50 คะแนน)</span>
                  <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-black">2/4 หมวด</span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium">ควรเสริมโปรตีนหรือแคลเซียมเพิ่มเติม</p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-rose-300 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-black text-rose-800">🔴 ต้องปรับปรุง (&lt;50)</span>
                  <span className="text-[10px] bg-rose-100 text-rose-900 px-1.5 py-0.5 rounded font-black">&lt;2 หมวด</span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium">ขาดสารอาหารหลัก เสี่ยงต่อการเจริญเติบโตชะลอตัว</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Quick Action Footer for Clinic Team */}
      <div className="bg-white p-5 rounded-3xl border border-purple-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-0.5 text-xs">
          <span className="font-black text-slate-900 block">
            หมายเหตุการใช้งานระบบสารบบคลินิก Growth Lab:
          </span>
          <span className="text-slate-500 font-medium">
            หน้านี้คือเกณฑ์มาตรฐานกลาง (Clinical Standards) สำหรับใช้ดูอ้างอิงและประเมินคนไข้ 
            ส่วนการสั่งการบ้านรายบุคคล สามารถจัดการได้ที่เมนู "สารบบผู้รับการดูแล → แฟ้มประวัติคนไข้"
          </span>
        </div>

        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0"
          >
            กลับสู่แดชบอร์ด
          </button>
        )}
      </div>
    </div>
  );
}
