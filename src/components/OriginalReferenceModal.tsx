import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCcw, 
  FileText, ShieldCheck, AlertCircle, Apple, Heart, Utensils
} from 'lucide-react';

interface OriginalReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  imageSrc: string;
}

export default function OriginalReferenceModal({ isOpen, onClose, title, imageSrc }: OriginalReferenceModalProps) {
  const [zoom, setZoom] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Reset state when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setZoom(100);
      setIsFullscreen(false);
      setImageError(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  const handleZoomIn = () => {
    setZoom(prev => {
      const nextZoom = prev + 25;
      return nextZoom <= 200 ? nextZoom : 200;
    });
  };

  const handleZoomOut = () => {
    setZoom(prev => {
      const nextZoom = prev - 25;
      return nextZoom >= 50 ? nextZoom : 50;
    });
  };

  const isGNS = title.includes('GNS') || title.includes('NUTRITION');

  const modalContent = (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-[9999] bg-slate-950/98 backdrop-blur-xl flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen ? 'p-0' : 'p-3 sm:p-6 md:p-10'
        }`}
      >
        {/* Modal Header Controls */}
        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80 text-white shrink-0 ${isFullscreen ? 'p-4 sm:p-6' : ''}`}>
          <div className="flex items-center gap-3 min-w-0">
            <motion.span 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="p-2.5 bg-purple-500/20 border border-purple-500/40 rounded-2xl shrink-0 shadow-lg shadow-purple-500/10"
            >
              <FileText className="w-6 h-6 text-purple-300" />
            </motion.span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-white truncate tracking-tight">{title}</h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-black bg-purple-600/30 text-purple-200 px-2.5 py-0.5 rounded-full border border-purple-500/40 shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  READ-ONLY DOCUMENT
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate font-medium mt-0.5">เอกสารต้นฉบับทางการแพทย์ประจำระบบ Growth Lab (Official Reference)</p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <div className="flex items-center bg-slate-900/80 backdrop-blur-sm p-1 rounded-2xl border border-slate-700/50 shadow-inner">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleZoomOut();
                }}
                disabled={zoom <= 50}
                className="p-2 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer"
                title="ย่อขนาด (Zoom Out)"
              >
                <ZoomOut className="w-4.5 h-4.5" />
              </button>
              
              <div className="text-xs font-black px-3 text-purple-300 min-w-[65px] text-center tracking-tighter tabular-nums">
                {zoom}%
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleZoomIn();
                }}
                disabled={zoom >= 200}
                className="p-2 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer"
                title="ขยายขนาด (Zoom In)"
              >
                <ZoomIn className="w-4.5 h-4.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setZoom(100)}
              className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/50 rounded-2xl text-slate-300 hover:text-white cursor-pointer transition-all hidden lg:flex items-center gap-2 text-xs font-black px-4 shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Fit Width</span>
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/50 text-purple-300 hover:text-white rounded-2xl transition-all cursor-pointer flex items-center gap-2 text-xs font-black px-4 shadow-sm"
            >
              {isFullscreen ? <Minimize2 className="w-4.5 h-4.5" /> : <Maximize2 className="w-4.5 h-4.5" />}
              <span className="hidden md:inline">{isFullscreen ? 'ย่อหน้าจอ' : 'เต็มจอ'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 sm:p-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl transition-all cursor-pointer ml-1 shadow-lg shadow-rose-600/20 active:scale-95"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Modal Main Viewport Container */}
        <div className={`flex-1 overflow-auto p-4 sm:p-8 md:p-12 mt-4 bg-slate-950 relative w-full flex justify-center items-start scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent ${isFullscreen ? 'rounded-none' : 'rounded-3xl border border-slate-800/80 shadow-2xl shadow-black/40'}`}>
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mx-auto"
            style={{ 
              width: `${zoom}%`, 
              maxWidth: zoom <= 100 ? '60rem' : 'none',
              transformOrigin: 'top center'
            }}
          >
            {(!imageError && imageSrc) ? (
              <img 
                src={imageSrc} 
                alt={title} 
                onError={() => setImageError(true)}
                className="w-full h-auto object-contain rounded-2xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] border border-slate-800/80 block mx-auto transition-transform"
                referrerPolicy="no-referrer"
              />
            ) : (
              /* High-Fidelity Clinical Source Document View */
              <div className="w-full bg-white text-slate-900 rounded-3xl shadow-2xl p-6 sm:p-12 md:p-16 border border-slate-200 space-y-10">
                <div className="border-b-4 border-indigo-600 pb-6 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-black bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-300">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      CLINICAL SOURCE • PENDING VERIFICATION
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      Ref ID: {title.includes('Exercise') || title.includes('ออกกำลังกาย') || imageSrc?.includes('exercise') ? 'EX-CS-01' : '0BF78ADE-7A00-41EF-87B7-A28CA95046FE'}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-indigo-950 tracking-tight leading-tight">
                    {title.includes('Sleep') || title.includes('การนอน') 
                      ? 'แบบบันทึกรายเดือน Growth Lab Sleep Quality Score (1-5) ระบบประเมินคุณภาพการนอนและการใส่ EF'
                      : (title.includes('Exercise') || title.includes('ออกกำลังกาย') || imageSrc?.includes('exercise'))
                      ? 'Exercise & Movement Assessment Form - แบบประเมินการออกกำลังกายเพื่อสนับสนุนการเจริญเติบโต'
                      : title || 'Growth Lab Official Clinical Reference Document'}
                  </h1>
                  <p className="text-xs sm:text-sm font-bold text-slate-500 italic">
                    เอกสารอ้างอิงทางคลินิกต้นฉบับประจำระบบ Growth Lab (Official Verbatim Reference Document)
                  </p>
                </div>

                {title.includes('Sleep') || title.includes('การนอน') ? (
                  <div className="space-y-8 text-left">
                    {/* Header Fields Section */}
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                      <h3 className="font-black text-indigo-900 text-sm border-b border-slate-200 pb-2">
                        📋 ข้อมูลในหัวแบบฟอร์มบันทึกรายเดือน (Form Header Fields)
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-700 font-medium">
                        <div><strong className="text-slate-900">ชื่อ-นามสกุล:</strong> _________</div>
                        <div><strong className="text-slate-900">ชื่อเล่น:</strong> _____</div>
                        <div><strong className="text-slate-900">เพศ:</strong> _____</div>
                        <div><strong className="text-slate-900">วัน/เดือน/ปีเกิด:</strong> _____</div>
                        <div><strong className="text-slate-900">เดือนที่บันทึก:</strong> _____</div>
                        <div><strong className="text-slate-900">ปี:</strong> _____</div>
                        <div><strong className="text-slate-900">น้ำหนัก:</strong> ___ กก.</div>
                        <div><strong className="text-slate-900">ส่วนสูง:</strong> ___ ซม.</div>
                        <div><strong className="text-slate-900">Growth Stage:</strong> _____</div>
                        <div><strong className="text-slate-900">ผู้บันทึก:</strong> _____</div>
                        <div className="col-span-2"><strong className="text-slate-900">หมายเหตุทั่วไป:</strong> _________</div>
                      </div>
                    </div>

                    {/* Daily Sheet Columns */}
                    <div className="space-y-3">
                      <h3 className="font-black text-indigo-900 text-sm border-l-4 border-indigo-600 pl-3">
                        📅 ตารางบันทึกประจำวัน (วันที่ 1 ถึง 31) — Daily Recording Table Structure
                      </h3>
                      <div className="bg-indigo-950 text-white p-4 rounded-2xl border border-indigo-900 text-xs space-y-2">
                        <p className="font-bold text-indigo-200">รายการคอลัมน์ข้อมูลประจำวัน (11 คอลัมน์มาตรฐาน):</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-indigo-100">
                          <div>1. <strong>วันที่:</strong> 1 - 31</div>
                          <div>2. <strong>เวลานอน:</strong> เข้านอน (เวลา), หลับจริง (เวลา), ตื่นนอน (เวลา)</div>
                          <div>3. <strong>ชั่วโมงนอน:</strong> (ชม.)</div>
                          <div>4. <strong>ตื่นกลางดึก:</strong> (ครั้ง)</div>
                          <div>5. <strong>กรน/อ้าปากหายใจ:</strong> 0 = ไม่เป็น, 1 = เป็นบางครั้ง, 2 = เป็นบ่อย</div>
                          <div>6. <strong>สดชื่นตอนเช้า:</strong> 😃 ดี, 😐 ปานกลาง, 🙁 ไม่สดชื่น</div>
                          <div>7. <strong>ใส่ EF:</strong> ✓ / ✗</div>
                          <div>8. <strong>EF (ชั่วโมง):</strong> ระยะเวลาที่ใส่</div>
                          <div>9. <strong>ถอดกลางดึก/เหตุผล:</strong> สาเหตุที่ถอดออก</div>
                          <div>10. <strong>คะแนนการนอน 1-5:</strong> คะแนนประเมินวันนั้น</div>
                          <div>11. <strong>หมายเหตุ:</strong> บันทึกเพิ่มเติม</div>
                        </div>
                      </div>
                    </div>

                    {/* Monthly Summary & Red Flags Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Summary Box */}
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                        <h4 className="font-black text-indigo-900 text-sm border-b pb-2">
                          🌙 สรุปประจำเดือน (Monthly Summary)
                        </h4>
                        <ul className="space-y-2 text-xs text-slate-700">
                          <li>• <strong>ชั่วโมงนอนเฉลี่ย:</strong> _____ ชม./คืน</li>
                          <li>• <strong>จำนวนวันที่ใส่ EF:</strong> _____ / 31 วัน</li>
                          <li>• <strong>เวลาใส่ EF เฉลี่ย:</strong> _____ ชม./คืน</li>
                          <li>• <strong>คะแนนการนอนเฉลี่ย:</strong> _____ / 5</li>
                          <li>• <strong>ตื่นกลางดึกเฉลี่ย:</strong> _____ ครั้ง/คืน</li>
                          <li>• <strong>ความสม่ำเสมอในการใส่ EF:</strong> ☐ &lt;50% | ☐ 50-79% | ☐ ≥80%</li>
                        </ul>
                      </div>

                      {/* Red Flags Box */}
                      <div className="bg-rose-50 p-5 rounded-2xl border border-rose-200 space-y-4">
                        <h4 className="font-black text-rose-900 text-sm border-b border-rose-200 pb-2">
                          🚩 สัญญาณที่ควรแจ้งทันตแพทย์/แพทย์ (Red Flags)
                        </h4>
                        <ul className="space-y-2 text-xs text-rose-800">
                          <li>☐ กรนดังเป็นประจำ</li>
                          <li>☐ หยุดหายใจหรือหายใจเฮือก</li>
                          <li>☐ ง่วงมากผิดปกติกลางวัน</li>
                          <li>☐ มีแผล/เจ็บปาก/ถอด EF บ่อย</li>
                          <li>☐ อื่น ๆ _________</li>
                          <li className="pt-2 border-t border-rose-200 font-bold">
                            ควรพบแพทย์/ทันตแพทย์ วันที่ ________ เหตุผล ____________
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Sleep Score Breakdown & Guidelines */}
                    <div className="bg-amber-50/80 p-5 rounded-2xl border border-amber-200 space-y-3">
                      <h4 className="font-black text-amber-950 text-sm">
                        ⭐ เกณฑ์คุณภาพการนอน 1–5 (Sleep Quality Rating Scale)
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-amber-900">
                        <div><strong className="text-emerald-700">5 = ดีมาก:</strong> นอนเพียงพอ หลับต่อเนื่อง หายใจปกติ ตื่นสดชื่น</div>
                        <div><strong className="text-emerald-600">4 = ดี:</strong> มีปัญหาเล็กน้อย แต่กลับไปหลับได้</div>
                        <div><strong className="text-amber-700">3 = ปานกลาง:</strong> เริ่มมีสิ่งรบกวน ควรปรับพฤติกรรม</div>
                        <div><strong className="text-orange-700">2 = ควรปรับปรุง:</strong> ปัญหาชัดเจน ควรประเมินซ้ำ</div>
                        <div><strong className="text-rose-700">1 = แย่:</strong> การนอนผิดปกติชัดเจน ควรประเมินเพิ่มเติม</div>
                      </div>
                      <div className="pt-2 border-t border-amber-200 text-[11px] text-amber-900 space-y-1">
                        <p><strong>คำแนะนำช่วงอายุ (ชั่วโมงนอน/วัน อ้างอิง AASM, 2016):</strong></p>
                        <p>• อายุ 6–12 ปี: 9–12 ชั่วโมง | อายุ 13–18 ปี: 8–10 ชั่วโมง</p>
                      </div>
                    </div>
                  </div>
                ) : (title.includes('Exercise') || title.includes('ออกกำลังกาย') || imageSrc?.includes('exercise')) ? (
                  /* Exercise & Movement Assessment View */
                  <div className="space-y-8 text-left">
                    <div className="bg-purple-50 p-5 rounded-2xl border border-purple-200 space-y-3">
                      <h3 className="font-black text-purple-900 text-sm border-b border-purple-200 pb-2">
                        🏃‍♂️ 1. ข้อมูลการเจริญเติบโต & Daily Physical Activity
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-purple-950 font-medium">
                        <div><strong>Growth Stage:</strong> Pre-growth / Acceleration / Peak Spurt / Deceleration</div>
                        <div><strong>Height Velocity (HV):</strong> ... cm/year (อัตราการเจริญเติบโตซ้ำ)</div>
                        <div><strong>Daily Activity Goal:</strong> หัวใจเต้นเร็ว/หายใจแรง ≥ 60 นาที/วัน</div>
                        <div><strong>ความถี่เป้าหมาย:</strong> 5–7 วัน/สัปดาห์</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-200 space-y-3">
                        <h4 className="font-black text-indigo-900 text-sm border-b border-indigo-200 pb-2">
                          🦘 2. Jump / Bone-Loading & Strength
                        </h4>
                        <ul className="space-y-2 text-xs text-indigo-950">
                          <li>• <strong>Jump Activities:</strong> กระโดดเชือก, สองขากระโดด, Side-to-side, Hop, Basketball, Volleyball</li>
                          <li>• <strong>Jump Frequency:</strong> 3–5 วัน/สัปดาห์ (~100 Jump Contacts/ครั้ง)</li>
                          <li>• <strong>Strength Training:</strong> Squat, Lunge, Step-up, Calf raise, Push-up, Hip bridge, Core</li>
                          <li>• <strong>Strength Target:</strong> ≥ 2–3 วัน/สัปดาห์ (2–3 Sets x 8–12 Reps)</li>
                        </ul>
                      </div>

                      <div className="bg-rose-50 p-5 rounded-2xl border border-rose-200 space-y-3">
                        <h4 className="font-black text-rose-900 text-sm border-b border-rose-200 pb-2">
                          🦵 3. Landing Quality & Pain Screen
                        </h4>
                        <ul className="space-y-2 text-xs text-rose-950">
                          <li>• <strong>Landing Quality:</strong> ลงพื้นนุ่ม ย่อเข่ารับแรง, Knee alignment ตรง, ลำตัวนิ่ง</li>
                          <li>• <strong>Pain Screening:</strong> ไม่มีอาการปวดเข่า (Osgood-Schlatter), ส้นเท้า (Sever's), ข้อเท้า, หลัง</li>
                          <li>• <strong>Safety Rule:</strong> หากมี Pain Score &gt; 3/10 ให้ปรับลดความเข้มข้นทันที</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 space-y-3">
                      <h4 className="font-black text-amber-950 text-sm border-b border-amber-200 pb-2">
                        ⭐ เกณฑ์ Growth Lab Exercise Score (1–5 คะแนน)
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-amber-900">
                        <div><strong>5 = ดีเยี่ยม:</strong> Active ≥5 วัน, Jump/Strength สม่ำเสมอ, Landing ดี, ไม่มีอาการปวด</div>
                        <div><strong>4 = ดีมาก:</strong> Active 3–4 วัน, ได้ตามเป้าหมายหลัก</div>
                        <div><strong>3 = ปานกลาง:</strong> Active 2–3 วัน, เริ่มดีแต่ยังขาดบางองค์ประกอบ</div>
                        <div><strong>2 = น้อย:</strong> Active 1–2 วัน, ยังไม่สม่ำเสมอ</div>
                        <div><strong>1 = น้อยมาก:</strong> &lt;1 วัน/สัปดาห์ ควรได้รับการกระตุ้นเพิ่มเติม</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* GNS View */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                    <div className="space-y-4">
                      <h3 className="text-lg font-black text-slate-800 border-l-4 border-emerald-500 pl-3">เกณฑ์การประเมินประจำวัน (Daily)</h3>
                      <div className="space-y-3">
                        {[
                          { title: '1. โปรตีนคุณภาพสูง (Protein)', desc: 'ไข่, เนื้อสัตว์, นม, เต้าหู้ - ครบ 3 มื้อ = 3 คะแนน' },
                          { title: '2. แคลเซียมและวิตามิน D', desc: 'ดื่มนมตามแผน + อาหารแคลเซียมสูง = 2 คะแนน' },
                          { title: '3. ผักและผลไม้สด', desc: 'ผัก ≥ 2 มื้อ, ผลไม้ ≥ 2 ส่วน = 2 คะแนน' },
                          { title: '4. คุณภาพอาหาร', desc: 'เริ่ม 3 คะแนน หักเมื่อทาน น้ำหวาน, ขนม, ของทอด' },
                          { title: '5. น้ำดื่มและความสม่ำเสมอ', desc: 'ดื่มน้ำพอ (1-2L) + กินตรงเวลา = 2 คะแนน' },
                        ].map((item, i) => (
                          <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <h4 className="font-bold text-emerald-800 text-xs">{item.title}</h4>
                            <p className="text-xs text-slate-600 mt-0.5">{item.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-black text-slate-800 border-l-4 border-rose-500 pl-3">Eating Behavior Score</h3>
                      <div className="p-5 bg-rose-50 rounded-2xl border border-rose-200 space-y-3 text-xs">
                        <p className="font-bold text-rose-900">พฤติกรรมที่ช่วยเพิ่มประสิทธิภาพการเจริญเติบโต (+1 ต่อข้อ):</p>
                        <ul className="space-y-2 text-rose-800">
                          <li>• เคี้ยวอาหารสองข้างสม่ำเสมอ</li>
                          <li>• เคี้ยวช้าและเคี้ยวละเอียด</li>
                          <li>• นั่งทานโดยไม่ดูหน้าจอ</li>
                          <li>• ดื่มน้ำเปล่าเป็นหลัก</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-8 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-400 font-bold">
                  <span>Growth Lab Pediatric Clinical Reference Document v1.0</span>
                  <ShieldCheck className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}


