import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Activity, Info, ShieldAlert, Award, FileText, CheckCircle2, 
  TrendingUp, Dumbbell, Zap, Target, Flame, Heart, ChevronRight, Brain
} from 'lucide-react';
import DocumentViewer from './DocumentViewer';
import { VERIFIED_EXERCISES } from '../data';

export default function ExerciseReference() {
  const [selectedGuideCategory, setSelectedGuideCategory] = useState<'ef' | 'exercise'>('ef');

  const efExercises = VERIFIED_EXERCISES.filter(ex => ex.category === 'tongue' || ex.category === 'lips');
  const movementExercises = VERIFIED_EXERCISES.filter(ex => ex.category === 'posture' || ex.category === 'movement');

  const categories = [
    {
      id: 1,
      title: '1. Growth Stage & Skeletal Maturity',
      description: 'ระยะการเจริญเติบโตและความสมบูรณ์ของกระดูก',
      items: [
        { label: 'Growth Stage', val: 'Pre-pubertal / Pubertal Growth Spurt / Post-pubertal' },
        { label: 'Skeletal Maturity', val: 'Normal / Delayed / Advanced' }
      ],
      color: 'bg-blue-50 text-blue-900 border-blue-200'
    },
    {
      id: 2,
      title: '2. Daily Physical Activity',
      description: 'กิจกรรมทางกายประจำวันและคาร์ดิโอสร้างความแข็งแรงหัวใจ',
      items: [
        { label: 'ความถี่ประจำสัปดาห์', val: '1 – 7 วัน / สัปดาห์' },
        { label: 'ระยะเวลาเฉลี่ย', val: '30, 45, 60+ นาที / วัน' }
      ],
      color: 'bg-amber-50 text-amber-900 border-amber-200'
    },
    {
      id: 3,
      title: '3. Jump / Bone-loading Activity',
      description: 'กิจกรรมกระโดดรับแรงกระแทกกระตุ้นศูนย์การเจริญเติบโตของกระดูก (Epiphyseal Plate)',
      items: [
        { label: 'ความถี่กระโดด', val: '3 – 5 วัน / สัปดาห์' },
        { label: 'จำนวนครั้ง (Contacts)', val: '~50, 100, 150+ Jump Contacts / เซสชัน' }
      ],
      color: 'bg-emerald-50 text-emerald-900 border-emerald-200'
    },
    {
      id: 4,
      title: '4. Strength Training & Landing Quality',
      description: 'การฝึกความแข็งแรงกล้ามเนื้อและเทคนิคการลงสู่พื้นเพื่อป้องกันการบาดเจ็บ',
      items: [
        { label: 'Strength Sets & Reps', val: '2 – 3 sets x 8 – 12 repetitions' },
        { label: 'Landing Quality', val: 'Soft Landing, Knee Alignment, Trunk Control' }
      ],
      color: 'bg-purple-50 text-purple-900 border-purple-200'
    },
    {
      id: 5,
      title: '5. Pain & Injury Screen',
      description: 'การคัดกรองอาการปวดจากการออกกำลังกายเพื่อความปลอดภัยสูงทางการแพทย์',
      items: [
        { label: 'Pain Score Criteria', val: '0 – 10 Visual Analog Scale' },
        { label: 'Anatomy Screening', val: 'เข่า (Patellar/Osgood), ข้อเท้า, ส้นเท้า (Sever disease), หลัง' }
      ],
      color: 'bg-rose-50 text-rose-900 border-rose-200'
    },
    {
      id: 6,
      title: '6. Exercise Score & Goal Setting',
      description: 'การสรุปคะแนนประจำสัปดาห์และเปรียบเทียบผลการเติบโตประจำเดือน',
      items: [
        { label: 'Score Scale', val: '1 – 5 Growth Lab Exercise Score' },
        { label: 'Follow-up Period', val: 'Weekly Summary & Monthly Follow-up Goal' }
      ],
      color: 'bg-indigo-50 text-indigo-900 border-indigo-200'
    }
  ];

  const exerciseGuides = {
    jump: {
      categoryTitle: 'A. JUMP & IMPACT EXERCISES (กระโดดลงน้ำหนักสร้างมวลกระดูก)',
      exercises: [
        { name: 'Two-leg Jump (กระโดดสองขา)', desc: 'กระโดดขึ้นตรงด้วยสองขาแล้วลงพื้นพร้อมกัน นุ่มนวลโดยย่อเข่ารับแรง', target: 'กระตุ้น Bone Mineral Density สองข้าง' },
        { name: 'Forward Jump (กระโดดไปข้างหน้า)', desc: 'กระโดดพุ่งไปข้างหน้าและลงสู่พื้นด้วยความมั่นคง ลำตัวนิ่ง', target: 'สร้างแรงส่งแนวราบและความแข็งแรงข้อเท้า' },
        { name: 'Side-to-side Jump (กระโดดสลับซ้าย-ขวา)', desc: 'กระโดดข้ามเส้นขนานซ้าย-ขวาต่อเนื่องด้วยจังหวะสม่ำเสมอ', target: 'เพิ่ม Agility และการลงน้ำหนักหลายทิศทาง' },
        { name: 'Hopscotch (ตั้งไข่/ตั้งขาเดียว)', desc: 'กระโดดขาเดียวสลับสองขาตามช่องตาราง', target: 'ฝึกการทรงตัวและการรับแรงกระแทกขาเดียว' },
        { name: 'Jump Rope (กระโดดเชือก)', desc: 'กระโดดเชือกจังหวะเบาๆ ปลายเท้ารับแรงต่อเนื่อง 100-200 ครั้ง', target: 'High-frequency Bone Loading กระตุ้นความสูง' }
      ]
    },
    strength: {
      categoryTitle: 'B. STRENGTH TRAINING (ฝึกความแข็งแรงกล้ามเนื้อแกนกลางและขา)',
      exercises: [
        { name: 'Squat (สควอท)', desc: 'ย่อสะโพกลงเหมือนนั่งเก้าอี้ เข่าไม่บิดเข้าข้างใน ลำตัวตรง', target: 'กล้ามเนื้อต้นขา Quadriceps และ Glutes' },
        { name: 'Lunge (ลันจ์)', desc: 'ก้าวขาไปข้างหน้าย่อเข่า 90 องศาทั้งสองข้าง ลำตัวตั้งตรง', target: 'ความแข็งแรงขาแต่ละข้างและการทรงตัว' },
        { name: 'Step-up (ก้าวขึ้นกล่อง/ขั้นบันได)', desc: 'ก้าวเท้าขึ้นขั้นบันได ถ่ายน้ำหนักเต็มฝ่าเท้าแล้วก้าวลง', target: 'กล้ามเนื้อเหยียดสะโพกและก้น' },
        { name: 'Calf Raise (เขย่งปลายเท้า)', desc: 'ยืนตรงเขย่งปลายเท้าขึ้นสูงสุดแล้วค่อยๆ ลดส้นเท้าลง', target: 'เอ็นร้อยหวายและกล้ามเนื้อน่อง Gastrocnemius' },
        { name: 'Push-up (ดันพื้น)', desc: 'ดันพื้นเกร็งลำตัวเป็นเส้นตรง (วางเข่าได้สำหรับเด็กเริ่มต้น)', target: 'ความแข็งแรงหน้าอกและแขนท่อนบน' },
        { name: 'Hip Bridge (ยกสะโพก)', desc: 'นอนหงายชันเข่า เกร็งก้นยกสะโพกขึ้นจนลำตัวตรง', target: 'กล้ามเนื้อก้น Hamstring และหลังล่าง' }
      ]
    },
    core: {
      categoryTitle: 'C. CORE EXERCISES (ฝึกกล้ามเนื้อแกนกลางลำตัวเพื่อการจัดสรีระ)',
      exercises: [
        { name: 'Plank (แพลงก์)', desc: 'ตั้งข้อศอกเกร็งหน้าท้อง ลำตัวตรงไม่ตกหรือโด่งสะโพก 20-40 วินาที', target: 'Core Stability เกร็งหน้าท้องสม่ำเสมอ' },
        { name: 'Side Plank (แพลงก์ข้าง)', desc: 'ตะแคงตัวตั้งข้อศอก ยกสะโพกขึ้นจากพื้น ลำตัวเป็นเส้นตรง', target: 'กล้ามเนื้อหน้าท้องด้านข้าง Obliques' },
        { name: 'Bird Dog (เบิร์ดด็อก)', desc: 'ตั้งคุกเข่า เหยียดแขนขวาและขาซ้ายไปพร้อมกัน สลับข้าง', target: 'การทำงานประสานกันของแกนกลางและหลัง' },
        { name: 'Dead Bug (เดดบัก)', desc: 'นอนหงายยกแขนขา 90 องศา ค่อยๆ เหยียดแขนซ้ายและขาขวาลงใกล้พื้น', target: 'การเกร็งหน้าท้องป้องกันหลังแอ่น' },
        { name: 'Glute Bridge (เกร็งก้นยกสะโพก)', desc: 'ค้างตำแหน่งยกสะโพก 3-5 วินาที เกร็งหน้าท้องและก้น', target: 'จัดระเบียบเชิงกรานและแนว척추' },
        { name: 'Bear Crawl (คลานแบบหมี)', desc: 'ตั้งคุกเข่ายกเข่าลอยจากพื้นเล็กน้อย คลานไปข้างหน้าอย่างตั้งมั่น', target: 'Full-body coordination และแกนกลาง' }
      ]
    }
  };

  // High-fidelity Master Document Content
  const originalDocumentContent = (
    <div className="space-y-6 text-slate-800 text-xs font-sans">
      {/* Header Form */}
      <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
        <div className="space-y-1">
          <div className="text-[10px] font-black uppercase tracking-widest text-amber-700">GROWTH LAB CLINICAL PROTOCOL</div>
          <h1 className="text-xl font-black text-slate-900">GROWTH LAB EXERCISE & MOVEMENT ASSESSMENT FORM</h1>
          <p className="text-[11px] text-slate-600 font-medium">แบบประเมินและติดตามการออกกำลังกายกระตุ้นศูนย์การเจริญเติบโตทางคลินิก</p>
        </div>
        <div className="text-right border-l-2 border-slate-200 pl-4">
          <span className="inline-block bg-amber-600 text-white text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase">CLINICAL MASTER FORM</span>
          <div className="text-[10px] text-slate-500 mt-1">Ref: GL-FORM-EX-2026</div>
        </div>
      </div>

      {/* 11 Assessment Sections Summary */}
      <div className="space-y-3">
        <h3 className="font-black text-slate-900 border-b border-slate-300 pb-1 text-xs uppercase">
          โครงสร้างแบบประเมินทางการแพทย์ 11 หมวด (11 ASSESSMENT MODULES)
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px]">
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-900 block">1. Growth & Height Velocity:</span>
            <span>ประเมินส่วนสูง, น้ำหนัก, BMI และอัตราการเติบโต (Height Velocity cm/ปี)</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-900 block">2. Daily Physical Activity:</span>
            <span>บันทึกจำนวนวันทำกิจกรรม (1-7 วัน) และนาทีเฉลี่ยต่อวัน (30-60+ นาที)</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-900 block">3. Jump / Bone-loading Activity:</span>
            <span>ประเมินการกระโดดรับแรงกระแทก (~50, 100, 150+ contacts)</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-900 block">4. Strength Training:</span>
            <span>ความถี่การฝึกความแข็งแรงกล้ามเนื้อ (Sets, Reps, Days/Week)</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-900 block">5. Landing Quality Screen:</span>
            <span>ประเมิน Soft Landing, Knee Alignment, Trunk Control</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-900 block">6. Pain & Injury Screen:</span>
            <span>คัดกรองอาการปวด (Pain Score 0-10) และตำแหน่งร่างกาย</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-900 block">7. Growth Lab Exercise Score:</span>
            <span>สรุปคะแนนความสม่ำเสมอและประสิทธิภาพ 1 - 5 คะแนน</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-900 block">8. Weekly Summary & Monthly Follow-up:</span>
            <span>สรุปการปฏิบัติตัวในรอบสัปดาห์และการติดตามผลรายเดือน</span>
          </div>
        </div>
      </div>

      {/* Official Exercise Catalog Breakdown */}
      <div className="space-y-2 pt-2 border-t border-slate-200">
        <h3 className="font-black text-slate-900 text-xs uppercase">
          12. คู่มือท่าออกกำลังกายมาตรฐาน (OFFICIAL CLINICAL EXERCISE CATALOG)
        </h3>
        <table className="w-full text-left border-collapse border border-slate-300 text-[9px]">
          <thead>
            <tr className="bg-amber-100 text-amber-950 font-black border-b border-slate-300">
              <th className="p-1.5 border-r border-slate-300">หมวดหมู่</th>
              <th className="p-1.5 border-r border-slate-300">ชื่อท่าออกกำลังกาย</th>
              <th className="p-1.5">เป้าหมายทางสรีรวิทยา</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            <tr>
              <td className="p-1.5 border-r border-slate-300 font-bold bg-slate-50" rowSpan={3}>A. JUMP & IMPACT</td>
              <td className="p-1.5 border-r border-slate-300 font-bold">Two-leg / Forward / Side Jump</td>
              <td className="p-1.5">กระตุ้น Epiphyseal Plate และ Bone Mineral Density</td>
            </tr>
            <tr>
              <td className="p-1.5 border-r border-slate-300 font-bold">Hopscotch / Single-leg Hop</td>
              <td className="p-1.5">ฝึกการลงน้ำหนักขาเดียวและการทรงตัว</td>
            </tr>
            <tr>
              <td className="p-1.5 border-r border-slate-300 font-bold">Jump Rope (กระโดดเชือก)</td>
              <td className="p-1.5">High-frequency mechanical impact loading</td>
            </tr>

            <tr>
              <td className="p-1.5 border-r border-slate-300 font-bold bg-slate-50" rowSpan={3}>B. STRENGTH</td>
              <td className="p-1.5 border-r border-slate-300 font-bold">Squat / Lunge / Step-up</td>
              <td className="p-1.5">สร้างความแข็งแรงมวลกล้ามเนื้อขา Quadriceps & Glutes</td>
            </tr>
            <tr>
              <td className="p-1.5 border-r border-slate-300 font-bold">Calf Raise (เขย่งปลายเท้า)</td>
              <td className="p-1.5">กระตุ้นเอ็นร้อยหวายและส้นเท้า (Growth Impulse)</td>
            </tr>
            <tr>
              <td className="p-1.5 border-r border-slate-300 font-bold">Push-up / Hip Bridge</td>
              <td className="p-1.5">สร้างความแข็งแรงลำตัวส่วนบนและสะโพก</td>
            </tr>

            <tr>
              <td className="p-1.5 border-r border-slate-300 font-bold bg-slate-50" rowSpan={2}>C. CORE EXERCISES</td>
              <td className="p-1.5 border-r border-slate-300 font-bold">Plank / Side Plank / Bird Dog</td>
              <td className="p-1.5">เสริมสร้าง Core Stability และ Posture Alignment</td>
            </tr>
            <tr>
              <td className="p-1.5 border-r border-slate-300 font-bold">Dead Bug / Bear Crawl</td>
              <td className="p-1.5">จัดระเบียบกระดูกสันหลังและ pelvis ป้องกันหลังแอ่น</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Signature Area */}
      <div className="pt-4 border-t border-slate-200 flex justify-between items-end text-[10px] text-slate-500">
        <div>Growth Lab Physical Performance & Sports Medicine</div>
        <div className="text-right">
          <div className="font-serif italic font-bold text-slate-800">Growth Lab Clinical Exercise Specialist</div>
          <div>ทีมเวชศาสตร์การกีฬาและการเจริญเติบโต</div>
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 text-left"
    >
      {/* Top Header & Reference Badge */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white rounded-3xl border border-amber-900 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
            <Info className="w-4 h-4 text-amber-400" />
            <span>REFERENCE ONLY</span>
            <span className="text-amber-400">|</span>
            <span className="text-amber-200 normal-case font-medium">ข้อมูลอ้างอิงจากเอกสารที่ได้รับจากแพทย์</span>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-amber-400" />
            📖 เกณฑ์และแบบประเมินการออกกำลังกาย (Reference)
          </h2>
          <p className="text-xs text-amber-200/90 font-medium italic mt-1">
            "ข้อมูลอ้างอิงจากเอกสารต้นฉบับ GROWTH LAB EXERCISE & MOVEMENT ASSESSMENT FORM"
          </p>
        </div>
      </div>

      {/* Master Data Modules Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <Target className="w-5 h-5 text-amber-600 shrink-0" />
          <h3 className="text-base font-black text-slate-800">1. เกณฑ์การประเมินการออกกำลังกายทางการแพทย์ (Master Assessment Data)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat) => (
            <div key={cat.id} className={`p-5 rounded-3xl border ${cat.color} space-y-3 shadow-xs h-full flex flex-col justify-between`}>
              <div>
                <h4 className="text-sm font-black text-slate-900 border-b border-slate-200/80 pb-2">{cat.title}</h4>
                <p className="text-[11px] text-slate-600 mt-1 font-medium leading-snug">{cat.description}</p>

                <div className="mt-3 space-y-2">
                  {cat.items.map((it, idx) => (
                    <div key={idx} className="p-2.5 bg-white/90 rounded-xl border border-slate-200 text-xs">
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">{it.label}</span>
                      <strong className="text-slate-900 font-black text-xs">{it.val}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Exercise Guide Interactive Catalog */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <h3 className="text-base font-black text-slate-800">2. คู่มือท่าออกกำลังกายมาตรฐาน (Exercise Guide)</h3>
              <p className="text-xs text-slate-500">ตามหมวดหมู่ในเอกสารอ้างอิงทางการแพทย์</p>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setSelectedGuideCategory('ef')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                selectedGuideCategory === 'ef' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EF / OMT (8 รายการ)
            </button>

            <button
              onClick={() => setSelectedGuideCategory('exercise')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                selectedGuideCategory === 'exercise' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EXERCISE & MOVEMENT (16 รายการ)
            </button>
          </div>
        </div>

        {/* Selected Category Exercises */}
        <div className="space-y-3">
          <h4 className={`text-sm font-black p-3 rounded-xl border ${selectedGuideCategory === 'ef' ? 'text-purple-900 bg-purple-50 border-purple-200' : 'text-indigo-900 bg-indigo-50 border-indigo-200'}`}>
            {selectedGuideCategory === 'ef' ? 'A. EF / OMT CLINICAL MASTER LIST' : 'B. EXERCISE & MOVEMENT CLINICAL MASTER LIST'}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(selectedGuideCategory === 'ef' ? efExercises : movementExercises).map((ex) => (
              <div key={ex.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs hover:border-purple-300 transition-all">
                <div className="font-black text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{ex.title}</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-2">{ex.description}</p>
                <div className="flex gap-1.5 mt-2">
                  <div className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md text-[9px] font-bold">
                    {ex.id}
                  </div>
                  <div className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded-md text-[9px] font-bold">
                    {ex.category}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Document Viewer Section */}
      <DocumentViewer
        title="เอกสารอ้างอิงต้นฉบับการออกกำลังกาย"
        subtitle="GROWTH LAB EXERCISE & MOVEMENT ASSESSMENT FORM Master Reference Document"
        documentName="Growth Lab Exercise Assessment Form Master Sheet.pdf"
        importDate="11 สิงหาคม 2569"
        source="แพทย์ / Clinical Reference"
        documentContent={originalDocumentContent}
      />
    </motion.div>
  );
}
