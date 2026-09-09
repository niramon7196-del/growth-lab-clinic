import React from 'react';
import { motion } from 'motion/react';
import { 
  Moon, Info, ShieldAlert, Clock, AlertTriangle, CheckCircle2, 
  Award, FileText, Heart, Activity, Stethoscope
} from 'lucide-react';
import DocumentViewer from './DocumentViewer';

export default function SleepReference() {
  const domains = [
    {
      id: 1,
      title: '1. ระยะเวลานอน (Duration)',
      description: 'ประเมินจำนวนชั่วโมงนอนเทียบกับช่วงอายุทางการแพทย์',
      scores: [
        { score: '2 คะแนน', detail: 'นอนได้ตามเป้าหมายของช่วงอายุอย่างสม่ำเสมอ' },
        { score: '1 คะแนน', detail: 'นอนน้อยกว่าเป้าหมายเล็กน้อย (ต่ำกว่าเป้าไม่เกิน 1-2 ชั่วโมง)' },
        { score: '0 คะแนน', detail: 'นอนน้อยกว่าเป้าหมายมาก (>2 ชั่วโมง) หรือนอนไม่แน่นอน' }
      ],
      color: 'bg-indigo-50 text-indigo-900 border-indigo-200'
    },
    {
      id: 2,
      title: '2. หลับต่อเนื่อง (Continuous Sleep)',
      description: 'ประเมินการตื่นกลางดึกและความต่อเนื่องในการนอน',
      scores: [
        { score: '2 คะแนน', detail: 'หลับยาวต่อเนื่อง ตื่นกลางดึก ≤1 ครั้งแล้วกลับมาหลับต่อได้ง่าย' },
        { score: '1 คะแนน', detail: 'ตื่นกลางดึก 2–3 ครั้งต่อคืน ใช้เวลาหลับต่อเล็กน้อย' },
        { score: '0 คะแนน', detail: 'ตื่นบ่อยครั้ง ตื่นแล้วหลับต่อยากมาก หรือร้องไห้ตื่นกลัว' }
      ],
      color: 'bg-blue-50 text-blue-900 border-blue-200'
    },
    {
      id: 3,
      title: '3. การหายใจขณะหลับ (Breathing During Sleep)',
      description: 'ประเมินทางเดินหายใจและสรีรวิทยาการหายใจยามค่ำคืน',
      scores: [
        { score: '2 คะแนน', detail: 'หายใจปกติ สม่ำเสมอ ไม่มีเสียงกรนหรืออ้าปากหายใจ' },
        { score: '1 คะแนน', detail: 'มีเสียงหายใจแรง หรือมีเสียงกรนแผ่วเบาเป็นบางครั้ง' },
        { score: '0 คะแนน', detail: 'กรนเสียงดัง อ้าปากหายใจประจำ หายใจเฮือก หรือสงสัยหยุดหายใจ' }
      ],
      color: 'bg-purple-50 text-purple-900 border-purple-200'
    },
    {
      id: 4,
      title: '4. การหลับ / Sleep Onset',
      description: 'ประเมินความง่ายในการเข้าสู่นอนและการเริ่มต้นหลับ',
      scores: [
        { score: '2 คะแนน', detail: 'เข้านอนตรงเวลา และเข้าระดับหลับได้ภายใน 20-30 นาที' },
        { score: '1 คะแนน', detail: 'ใช้เวลาเริ่มต้นหลับ 30–60 นาที' },
        { score: '0 คะแนน', detail: 'ใช้เวลาเริ่มต้นหลับ >60 นาที หรือมีพฤติกรรมงอแงต่อต้านเข้านอน' }
      ],
      color: 'bg-amber-50 text-amber-900 border-amber-200'
    },
    {
      id: 5,
      title: '5. ตอนเช้า/กลางวัน (Morning / Daytime Condition)',
      description: 'ประเมินความสดชื่นและการตื่นตัวในการทำกิจกรรมประจำวัน',
      scores: [
        { score: '2 คะแนน', detail: 'ตื่นนอนสดชื่น กระปรี้กระเปร่า ไม่ง่วงนอนในเวลากลางวัน' },
        { score: '1 คะแนน', detail: 'มีอาการง่วงเพลียเล็กน้อยในตอนเช้า แต่สามารถตื่นตัวได้' },
        { score: '0 คะแนน', detail: 'ง่วงนอนมากผิดปกติในเวลากลางวัน อารมณ์หงุดหงิดง่าย สมาธิลดลง' }
      ],
      color: 'bg-emerald-50 text-emerald-900 border-emerald-200'
    }
  ];

  const scoreConversionTable = [
    { raw: '9 – 10 คะแนน', quality: '5 คะแนน (ยอดเยี่ยม / Excellent)', bg: 'bg-emerald-100 text-emerald-900 font-bold' },
    { raw: '7 – 8 คะแนน', quality: '4 คะแนน (ดีมาก / Very Good)', bg: 'bg-blue-100 text-blue-900 font-bold' },
    { raw: '5 – 6 คะแนน', quality: '3 คะแนน (ปานกลาง / Moderate)', bg: 'bg-amber-100 text-amber-900 font-bold' },
    { raw: '3 – 4 คะแนน', quality: '2 คะแนน (ควรปรับปรุง / Needs Improvement)', bg: 'bg-orange-100 text-orange-900 font-bold' },
    { raw: '0 – 2 คะแนน', quality: '1 คะแนน (ควรปรึกษาแพทย์ / Clinical Consult Required)', bg: 'bg-rose-100 text-rose-900 font-bold' },
  ];

  const ageRecommendations = [
    { age: 'เด็กวัยก่อนเรียน (3–5 ปี)', hours: '10 – 13 ชั่วโมง / วัน' },
    { age: 'เด็กวัยเรียน (6–12 ปี)', hours: '9 – 12 ชั่วโมง / วัน' },
    { age: 'วัยรุ่น (13–18 ปี)', hours: '8 – 10 ชั่วโมง / วัน' },
  ];

  const redFlagsList = [
    'กรนเป็นประจำ (Regular snoring) ≥ 3 คืน/สัปดาห์',
    'อ้าปากหายใจขณะหลับเป็นประจำ (Habitual mouth breathing)',
    'สังเกตพบการหยุดหายใจ หายใจเฮือก หรือสะดุ้งเฮือกยามค่ำคืน (Observed apnea / gasping)',
    'เหงื่อออกมากผิดปกติขณะหลับโดยอุณหภูมิห้องปกติ (Excessive nocturnal sweating)',
    'ง่วงนอนมากผิดปกติในตอนกลางวัน หลับในชั้นเรียน หรืออารมณ์ก้าวร้าวผิดปกติ (Excessive daytime sleepiness)'
  ];

  // High-fidelity rendering of the original medical master document
  const originalDocumentContent = (
    <div className="space-y-6 text-slate-800 text-xs font-sans">
      {/* Clinic Document Header */}
      <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
        <div className="space-y-1">
          <div className="text-[10px] font-black uppercase tracking-widest text-indigo-700">GROWTH LAB CLINICAL PROTOCOL</div>
          <h1 className="text-xl font-black text-slate-900">เอกสารมาตรฐานเกณฑ์ประเมินการนอนหลับ (SLEEP ASSESSMENT PROTOCOL)</h1>
          <p className="text-[11px] text-slate-600 font-medium">ศูนย์การเจริญเติบโตและพัฒนาการเด็ก Growth Lab Clinic</p>
        </div>
        <div className="text-right border-l-2 border-slate-200 pl-4">
          <span className="inline-block bg-slate-900 text-white text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase">APPROVED MASTER</span>
          <div className="text-[10px] text-slate-500 mt-1">Ref: GL-P-SLP-2026</div>
        </div>
      </div>

      {/* Protocol Summary */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
        <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
          <Stethoscope className="w-4 h-4 text-indigo-600" />
          วัตถุประสงค์ทางการแพทย์ (Clinical Objectives):
        </div>
        <p className="text-slate-700 leading-relaxed text-[11px]">
          การนอนหลับคุณภาพสูงในช่วงเวลาที่เหมาะสมเป็นปัจจัยสำคัญต่อการหลั่ง Growth Hormone (GH Peak Release) ยามค่ำคืน แบบประเมิน Growth Lab Sleep Quality Score ออกแบบมาเพื่อวัดคุณภาพและสรีรวิทยาการนอนหลับ 5 ด้านหลัก พร้อมระบบคัดกรองความเสี่ยงทางเดินหายใจอุดกั้น (OSA Red Flags)
        </p>
      </div>

      {/* 5 Domains Table */}
      <div className="space-y-2">
        <h3 className="font-black text-slate-900 border-b border-slate-300 pb-1 text-xs uppercase">
          1. ตารางเกณฑ์การประเมิน 5 ด้าน (5 SLEEP DOMAIN SCORING CRITERIA)
        </h3>
        <table className="w-full text-left border-collapse border border-slate-300 text-[10px]">
          <thead>
            <tr className="bg-slate-100 text-slate-900 font-black border-b border-slate-300">
              <th className="p-2 border-r border-slate-300 w-1/4">ด้านที่ประเมิน (Domain)</th>
              <th className="p-2 border-r border-slate-300 w-1/4 text-emerald-800">2 คะแนน (ดีมาก)</th>
              <th className="p-2 border-r border-slate-300 w-1/4 text-amber-800">1 คะแนน (ปานกลาง)</th>
              <th className="p-2 text-rose-800">0 คะแนน (ต้องปรับปรุง)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            <tr>
              <td className="p-2 border-r border-slate-300 font-bold">1. Duration (ชั่วโมงนอน)</td>
              <td className="p-2 border-r border-slate-300">ตรงตามเป้าหมายของวัย</td>
              <td className="p-2 border-r border-slate-300">น้อยกว่าเป้า ≤2 ชม.</td>
              <td className="p-2">น้อยกว่าเป้า &gt;2 ชม.</td>
            </tr>
            <tr>
              <td className="p-2 border-r border-slate-300 font-bold">2. Continuity (ความต่อเนื่อง)</td>
              <td className="p-2 border-r border-slate-300">ตื่น ≤1 ครั้ง หลับต่อตื่นง่าย</td>
              <td className="p-2 border-r border-slate-300">ตื่น 2–3 ครั้ง/คืน</td>
              <td className="p-2">ตื่นบ่อย หลับต่อยากมาก</td>
            </tr>
            <tr>
              <td className="p-2 border-r border-slate-300 font-bold">3. Breathing (การหายใจ)</td>
              <td className="p-2 border-r border-slate-300">หายใจเงียบ สม่ำเสมอ</td>
              <td className="p-2 border-r border-slate-300">หายใจแรง/กรนบางครั้ง</td>
              <td className="p-2">กรนดัง/อ้าปากหายใจ/หยุดหายใจ</td>
            </tr>
            <tr>
              <td className="p-2 border-r border-slate-300 font-bold">4. Onset (การกล่อมหลับ)</td>
              <td className="p-2 border-r border-slate-300">หลับได้ใน 20-30 นาที</td>
              <td className="p-2 border-r border-slate-300">ใช้เวลา 30-60 นาที</td>
              <td className="p-2">ใช้เวลา &gt;60 นาที/ต่อต้าน</td>
            </tr>
            <tr>
              <td className="p-2 border-r border-slate-300 font-bold">5. Daytime (สภาวะกลางวัน)</td>
              <td className="p-2 border-r border-slate-300">สดชื่น ไม่ง่วง daytime</td>
              <td className="p-2 border-r border-slate-300">เพลียเล็กน้อยตอนเช้า</td>
              <td className="p-2">ง่วงนอนมากกลางวัน/หงุดหงิด</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Raw Score to Quality Score Conversion */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-3 border border-slate-300 rounded-xl space-y-1.5 bg-slate-50">
          <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 text-[11px]">
            2. การแปลงคะแนน (RAW TO QUALITY SCORE CONVERSION)
          </div>
          <ul className="space-y-1 text-[10px]">
            <li className="flex justify-between font-bold text-emerald-800"><span>คะแนนดิบ 9 – 10:</span><span>Score 5 (ยอดเยี่ยม)</span></li>
            <li className="flex justify-between font-bold text-blue-800"><span>คะแนนดิบ 7 – 8:</span><span>Score 4 (ดีมาก)</span></li>
            <li className="flex justify-between font-bold text-amber-800"><span>คะแนนดิบ 5 – 6:</span><span>Score 3 (ปานกลาง)</span></li>
            <li className="flex justify-between font-bold text-orange-800"><span>คะแนนดิบ 3 – 4:</span><span>Score 2 (ควรปรับปรุง)</span></li>
            <li className="flex justify-between font-bold text-rose-800"><span>คะแนนดิบ 0 – 2:</span><span>Score 1 (ควรปรึกษาแพทย์)</span></li>
          </ul>
        </div>

        <div className="p-3 border border-slate-300 rounded-xl space-y-1.5 bg-rose-50/60 border-rose-200">
          <div className="font-bold text-rose-900 border-b border-rose-200 pb-1 text-[11px] flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            3. สัญญาณเตือนทางการแพทย์ (RED FLAGS PROTOCOL)
          </div>
          <p className="text-[10px] text-rose-800 leading-snug">
            หากพบ Red Flag ข้อใดข้อหนึ่ง ถือเป็นประเด็นอิสระ แยกจากการคิดคะแนน 1-5 และควรส่งตรวจต่อทางเดินหายใจอุดกั้นขณะหลับ (Obstructive Sleep Apnea Screening) หรือพบแพทย์เฉพาะทางด้านการนอนหลับ
          </p>
        </div>
      </div>

      {/* Doctor Approval Signature Area */}
      <div className="pt-4 border-t border-slate-200 flex justify-between items-end text-[10px] text-slate-500">
        <div>Growth Lab Child Growth & Sleep Clinic</div>
        <div className="text-right">
          <div className="font-serif italic font-bold text-slate-800">Dr. Growth Lab Medical Board</div>
          <div>คณะกรรมการการแพทย์ด้านการเจริญเติบโต</div>
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
      <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl border border-indigo-900 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
            <Info className="w-4 h-4 text-indigo-400" />
            <span>REFERENCE ONLY</span>
            <span className="text-indigo-400">|</span>
            <span className="text-indigo-200 normal-case font-medium">ข้อมูลอ้างอิงจากเอกสารที่ได้รับจากแพทย์</span>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Moon className="w-6 h-6 text-indigo-400" />
            📖 เกณฑ์การประเมินการนอน (Reference)
          </h2>
          <p className="text-xs text-indigo-200/90 font-medium italic mt-1">
            "ข้อมูลอ้างอิงสำหรับใช้ประกอบการประเมินและติดตามสรีรวิทยาการนอนหลับอย่างถูกต้องตามหลักวิชาการ"
          </p>
        </div>
      </div>

      {/* 1. Growth Lab Sleep Quality Score 1-5 Summary Card */}
      <div className="p-6 bg-white rounded-3xl border border-indigo-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-indigo-100 pb-3">
          <Award className="w-5 h-5 text-indigo-600 shrink-0" />
          <h3 className="text-base font-black text-slate-800">1. การคำนวณและแปลผล Growth Lab Sleep Quality Score (1–5)</h3>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          ระบบจะประเมินคะแนนดิบ (Sleep Raw Score) รวม 5 ด้าน (คะแนนเต็ม 10) จากนั้นทำการแปลงเป็น <strong>Sleep Quality Score (1–5)</strong> เพื่อสรุปคุณภาพการนอนหลับและแนวทางติดตามผลทางการแพทย์
        </p>

        {/* Score Conversion Table */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
          {scoreConversionTable.map((item, idx) => (
            <div key={idx} className={`p-4 rounded-2xl border text-center space-y-1.5 shadow-2xs ${item.bg}`}>
              <div className="text-[10px] uppercase font-bold tracking-wider">คะแนนดิบ {item.raw}</div>
              <div className="text-sm font-black">{item.quality}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. แบบประเมิน 5 ด้าน (5 Sleep Domains) Card Grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <Moon className="w-5 h-5 text-indigo-600 shrink-0" />
          <h3 className="text-base font-black text-slate-800">2. รายละเอียดเกณฑ์การประเมินการนอน 5 ด้าน (5 Sleep Domains)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {domains.map((item) => (
            <div key={item.id} className={`p-5 rounded-3xl border ${item.color} space-y-3 shadow-xs h-full flex flex-col justify-between`}>
              <div>
                <h4 className="text-sm font-black text-slate-900 border-b border-slate-200/80 pb-2">{item.title}</h4>
                <p className="text-[11px] text-slate-600 mt-1 font-medium">{item.description}</p>

                <div className="mt-3 space-y-2">
                  {item.scores.map((sc, idx) => (
                    <div key={idx} className="p-2.5 bg-white/90 rounded-xl border border-slate-200 text-xs">
                      <span className="font-black text-indigo-950 block">{sc.score}</span>
                      <span className="text-[11px] text-slate-600 font-normal">{sc.detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Age Recommendation Card */}
          <div className="p-5 rounded-3xl border bg-slate-900 text-white space-y-3 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-black text-white">ช่วงเวลานอนที่แนะนำตามช่วงอายุ</h4>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">
                เป้าหมายชั่วโมงนอนต่อวันตามเกณฑ์สมาคมเวชศาสตร์การนอนหลับแห่งอเมริกา
              </p>

              <div className="mt-3 space-y-2">
                {ageRecommendations.map((ag, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs flex justify-between items-center">
                    <span className="font-bold text-slate-300">{ag.age}</span>
                    <strong className="text-indigo-400 font-black">{ag.hours}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Red Flags & Guidelines Card */}
      <div className="p-6 bg-rose-50/80 rounded-3xl border border-rose-200 space-y-4">
        <div className="flex items-center justify-between border-b border-rose-200 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <h3 className="text-base font-black text-rose-950">3. สัญญาณเตือนทางการแพทย์ (Red Flags) & แนวทางดำเนินการ</h3>
          </div>
          <span className="bg-rose-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">CRITICAL SCREENING</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-rose-900">
          <div className="space-y-2 bg-white p-4 rounded-2xl border border-rose-100 shadow-2xs">
            <span className="font-bold text-rose-950 block text-xs border-b border-rose-100 pb-1">
              รายการสภาวะเสี่ยง Red Flags ที่ต้องเฝ้าระวัง:
            </span>
            <ul className="space-y-1.5 text-[11px] text-slate-700">
              {redFlagsList.map((rf, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                  <span>{rf}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2 bg-white p-4 rounded-2xl border border-rose-100 shadow-2xs flex flex-col justify-between">
            <div>
              <span className="font-bold text-rose-950 block text-xs border-b border-rose-100 pb-1">
                แนวทางเมื่อตรวจพบ Red Flag (Clinical Action):
              </span>
              <p className="text-[11px] text-slate-700 leading-relaxed mt-2">
                สัญญาณ Red Flag เป็นสภาวะเสี่ยงอิสระ (Independent Risk Factors) ของโรคทางเดินหายใจอุดกั้นขณะหลับในเด็ก (Pediatric Obstructive Sleep Apnea: OSA) หากตรวจพบ <strong>เพียง 1 ข้อ</strong> ถือว่ามีความเสี่ยงทางคลินิก ควรส่งต่อตรวจวินิจฉัยละเอียดโดยแพทย์เฉพาะทางกุมารแพทย์ หรือแพทย์ทางเดินหายใจ/ENT
              </p>
            </div>

            <div className="p-2.5 bg-rose-100/70 rounded-xl text-[10px] font-bold text-rose-900 mt-3 border border-rose-200">
              * หมายเหตุ: Red Flag จะถูกบันทึกแยกจากคะแนนคุณภาพการนอน เพื่อความปลอดภัยสูงสุดของผู้รับการดูแล
            </div>
          </div>
        </div>
      </div>

      {/* 4. Original Document Viewer Section */}
      <DocumentViewer
        title="เอกสารอ้างอิงต้นฉบับการนอน"
        subtitle="ต้นฉบับเอกสารอ้างอิงเกณฑ์การประเมินการนอนหลับทางการแพทย์จากกุมารแพทย์"
        documentName="Growth Lab Sleep Assessment Protocol Master Sheet.pdf"
        importDate="11 สิงหาคม 2569"
        source="แพทย์ / Clinical Reference"
        documentContent={originalDocumentContent}
      />
    </motion.div>
  );
}
