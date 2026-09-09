import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Wind, 
  Compass, 
  TrendingUp, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  Eye, 
  Zap, 
  SlidersHorizontal,
  Maximize2
} from 'lucide-react';

interface Craniofacial3DBoyProps {
  onSelectFeature?: (feature: string) => void;
  customImageUrl?: string;
}

type StageType = 'baseline' | 'progress' | 'optimal';

export const Craniofacial3DBoy: React.FC<Craniofacial3DBoyProps> = ({ 
  onSelectFeature,
  customImageUrl 
}) => {
  const [activeTab, setActiveTab] = useState<string>('facial');
  const [currentStage, setCurrentStage] = useState<StageType>('optimal');
  const [showAnatomyOverlay, setShowAnatomyOverlay] = useState<boolean>(true);
  const [pulseCount, setPulseCount] = useState<number>(0);

  // Periodic pulse effect for synaptic firings
  useEffect(() => {
    const timer = setInterval(() => {
      setPulseCount((prev) => (prev + 1) % 100);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const featurePills = [
    {
      id: 'facial',
      category: 'FACIAL',
      title: 'FACIAL GROWTH VECTOR',
      icon: Activity,
      desc: 'วิเคราะห์ทิศทางและเวกเตอร์การเจริญเติบโตของขากรรไกรและใบหน้าส่วนหน้า',
      color: 'from-purple-600 to-indigo-600',
      activeColor: 'bg-purple-600 text-white'
    },
    {
      id: 'airway',
      category: 'AIRWAY',
      title: 'AIRWAY MONITORING',
      icon: Wind,
      desc: 'ติดตามและประเมินขนาดมิติทางเดินหายใจส่วนบน (Pharyngeal Airway Space)',
      color: 'from-blue-600 to-cyan-500',
      activeColor: 'bg-blue-600 text-white'
    },
    {
      id: 'symmetry',
      category: 'SYMMETRY',
      title: 'SYMMETRY ANALYSIS',
      icon: Compass,
      desc: 'ตรวจวัดสมดุลระนาบใบหน้า การจัดแนวกระดูกขากรรไกรบน-ล่างและความสมมาตร',
      color: 'from-fuchsia-600 to-pink-500',
      activeColor: 'bg-fuchsia-600 text-white'
    },
    {
      id: 'growth',
      category: 'GROWTH',
      title: 'GROWTH PREDICTION',
      icon: TrendingUp,
      desc: 'คาดการณ์แนวโน้มการเปลี่ยนแปลงตามช่วงวัยและการเติบโต (Peak Height Velocity)',
      color: 'from-violet-600 to-purple-700',
      activeColor: 'bg-violet-600 text-white'
    }
  ];

  const stages = [
    {
      id: 'baseline' as StageType,
      label: 'ก่อนเริ่มโปรแกรม',
      badge: 'BASELINE',
      subtitle: 'INITIAL ASSESSMENT',
      airwayScore: '62%',
      airwayStatus: 'Restricted Airway Space',
      airwayColor: '#F97316', // Orange
      glowColor: 'rgba(249, 115, 22, 0.4)',
      stripeGrad: 'from-orange-500 to-amber-500',
      strokeColor: '#FB923C',
      curveWidth: 10,
      pathD: 'M168,205 C186,245 192,285 190,360',
      desc: 'โครงสร้างใบหน้าก่อนการดูแล กล้ามเนื้อและแนวทางเดินหายใจมีความแคบ'
    },
    {
      id: 'progress' as StageType,
      label: 'ระหว่างการดูแล',
      badge: 'PROGRESS',
      subtitle: 'ACTIVE TREATMENT (3-6 MO)',
      airwayScore: '80%',
      airwayStatus: 'Expanding Airway Capacity',
      airwayColor: '#EAB308', // Amber / Gold
      glowColor: 'rgba(234, 179, 8, 0.4)',
      stripeGrad: 'from-amber-400 to-yellow-500',
      strokeColor: '#FACC15',
      curveWidth: 15,
      pathD: 'M168,205 C184,245 195,285 196,360',
      desc: 'โครงสร้างเริ่มปรับสมดุล กล้ามเนื้อทำงานดีขึ้น ขากรรไกรขยายตัวสมส่วน'
    },
    {
      id: 'optimal' as StageType,
      label: 'ผลลัพธ์ที่ดีขึ้น',
      badge: 'RESULT',
      subtitle: 'OPTIMAL OUTCOME',
      airwayScore: '98%',
      airwayStatus: 'Optimal Airway Dynamics',
      airwayColor: '#10B981', // Emerald Green
      glowColor: 'rgba(16, 185, 129, 0.45)',
      stripeGrad: 'from-emerald-400 to-teal-500',
      strokeColor: '#34D399',
      curveWidth: 20,
      pathD: 'M168,205 C180,245 198,285 202,360',
      desc: 'ผลลัพธ์หลังการดูแล โครงสร้างใบหน้าสมดุล ทางเดินหายใจเปิดกว้างเต็มที่'
    }
  ];

  const currentStageData = stages.find(s => s.id === currentStage) || stages[2];

  return (
    <div className="relative w-full max-w-full h-full flex flex-col items-center justify-center select-none py-1 overflow-x-hidden">
      
      {/* 1. Stage Switcher Tabs at the Top (Baseline | Progress | Optimal Outcome) */}
      <div className="w-full max-w-[500px] flex items-center justify-between gap-1.5 p-1 bg-white/70 backdrop-blur-xl rounded-2xl border border-purple-200/80 shadow-xs mb-2 z-30">
        {stages.map((stage) => {
          const isSelected = currentStage === stage.id;
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => setCurrentStage(stage.id)}
              className={`flex-1 py-1.5 px-2 rounded-xl text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center ${
                isSelected
                  ? 'bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white font-extrabold shadow-[0_4px_12px_rgba(124,58,237,0.28)] scale-[1.02]'
                  : 'text-slate-600 hover:text-purple-700 hover:bg-white/60 font-bold'
              }`}
            >
              <div className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  stage.id === 'baseline' ? 'bg-orange-400' : stage.id === 'progress' ? 'bg-amber-400' : 'bg-emerald-400'
                }`} />
                <span className="text-[10px] sm:text-[11px] leading-tight tracking-tight">{stage.label}</span>
              </div>
              <span className={`text-[8px] tracking-wider uppercase ${isSelected ? 'text-purple-200' : 'text-slate-400'}`}>
                {stage.badge} • {stage.airwayScore}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. Main Composition Wrapper */}
      <div className="relative w-full max-w-[540px] aspect-[1.12/1] flex items-center justify-center">
        
        {/* Luminous Ambient Background Glow */}
        <div 
          className="absolute inset-4 rounded-[36px] blur-3xl opacity-60 transition-colors duration-700 pointer-events-none -z-10"
          style={{
            background: `radial-gradient(circle at 40% 40%, #c084fc 0%, ${currentStageData.airwayColor} 50%, #818cf8 100%)`
          }}
        />

        {/* Layer 1: The 3D Anatomical Illustration Card */}
        <div className="relative w-full max-w-[320px] sm:max-w-[360px] lg:max-w-[380px] h-full flex flex-col items-center justify-center">
          
          <div className="relative w-full h-full rounded-[32px] sm:rounded-[36px] bg-gradient-to-b from-[#1C1635] via-[#16122C] to-[#0F0B21] border border-purple-400/30 shadow-[0_16px_45px_rgba(30,18,69,0.4)] overflow-hidden flex items-center justify-center">
            
            {/* Background Bioluminescent Grid & Ambient Soft Lights */}
            <div className="absolute inset-0 bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:20px_20px] opacity-15 pointer-events-none" />
            <div className="absolute top-10 left-10 w-48 h-48 rounded-full bg-cyan-500/15 blur-2xl pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-purple-600/20 blur-2xl pointer-events-none" />

            {/* If custom image URL is provided and valid, render custom image */}
            {customImageUrl ? (
              <img 
                src={customImageUrl} 
                alt="Craniofacial Structure"
                className="w-full h-full object-cover rounded-[32px]"
                referrerPolicy="no-referrer"
              />
            ) : (
              /* Ultra-High Quality Vector & CGI Medical Anatomy Graphic (Profile Facing Left matching IMG_2128.png) */
              <svg 
                className="w-full h-full drop-shadow-[0_8px_24px_rgba(56,189,248,0.25)] select-none" 
                viewBox="0 0 440 440" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Glowing Brain Bioluminescent Gradient */}
                  <radialGradient id="electricBrainGlow" cx="62%" cy="38%" r="60%">
                    <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.98" />
                    <stop offset="25%" stopColor="#38BDF8" stopOpacity="0.90" />
                    <stop offset="55%" stopColor="#6366F1" stopOpacity="0.75" />
                    <stop offset="85%" stopColor="#4F46E5" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="#312E81" stopOpacity="0.1" />
                  </radialGradient>

                  {/* Soft Realistic Child Skin / Profile Silhouette Gradient */}
                  <linearGradient id="softSkinBoy" x1="10%" y1="20%" x2="90%" y2="90%">
                    <stop offset="0%" stopColor="#FED7AA" stopOpacity="0.85" />
                    <stop offset="20%" stopColor="#FDBA74" stopOpacity="0.65" />
                    <stop offset="50%" stopColor="#C084FC" stopOpacity="0.45" />
                    <stop offset="80%" stopColor="#818CF8" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#4338CA" stopOpacity="0.15" />
                  </linearGradient>

                  {/* Hair Texture Gradient */}
                  <linearGradient id="softHair" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#7C2D12" stopOpacity="0.85" />
                    <stop offset="35%" stopColor="#9A3412" stopOpacity="0.75" />
                    <stop offset="70%" stopColor="#6B21A8" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#312E81" stopOpacity="0.2" />
                  </linearGradient>

                  {/* Translucent Craniofacial Bone Structure Gradient */}
                  <linearGradient id="boneShade" x1="20%" y1="10%" x2="80%" y2="90%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                    <stop offset="40%" stopColor="#E0E7FF" stopOpacity="0.7" />
                    <stop offset="75%" stopColor="#A5B4FC" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity="0.1" />
                  </linearGradient>

                  {/* Airway Dynamic Color Gradient */}
                  <linearGradient id="dynamicAirwayGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                    <stop offset="30%" stopColor={currentStageData.strokeColor} stopOpacity="0.95" />
                    <stop offset="80%" stopColor={currentStageData.strokeColor} stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#818CF8" stopOpacity="0.4" />
                  </linearGradient>

                  {/* High Intensity Glow Filter */}
                  <filter id="luminousGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="4" result="blur1" />
                    <feGaussianBlur stdDeviation="1.5" result="blur2" />
                    <feMerge>
                      <feMergeNode in="blur1" />
                      <feMergeNode in="blur2" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* 1. SOFT TISSUE PROFILE & CHILD FACE SILHOUETTE (Facing Left) */}
                {/* Back of Head, Neck & Shoulders */}
                <path
                  d="M165,430 C165,395 180,360 210,340 C240,320 270,335 305,370 C330,400 350,425 385,435 L165,435 Z"
                  fill="url(#softSkinBoy)"
                  opacity="0.6"
                />

                {/* Boy's Left-Facing Profile (Forehead -> Nose -> Lips -> Chin -> Mandible -> Neck) */}
                <path
                  d="M135,115 
                     C125,135 110,165 98,185 
                     C92,197 86,210 74,218 
                     C70,222 72,227 78,229 
                     C88,233 96,236 94,245 
                     C92,252 82,256 86,263 
                     C89,268 96,269 94,275 
                     C91,283 80,288 84,298 
                     C88,308 98,318 112,322 
                     C130,328 152,335 185,332 
                     C230,328 265,305 285,265 
                     C305,225 310,180 300,135 
                     C285,75 225,48 155,65 
                     C138,69 122,85 135,115 Z"
                  fill="url(#softSkinBoy)"
                  opacity="0.88"
                />

                {/* Hair Contour (Soft Child Hair Strands on Top and Back) */}
                <path
                  d="M150,60 
                     C180,45 235,50 270,72 
                     C295,90 310,120 312,150 
                     C300,135 285,120 260,110 
                     C230,98 190,95 155,110 
                     C140,116 128,128 118,142 
                     C120,120 132,80 150,60 Z"
                  fill="url(#softHair)"
                />
                <path
                  d="M118,140 C125,130 135,125 145,120 M140,90 C160,80 190,78 215,85"
                  stroke="#FDBA74"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  opacity="0.4"
                />

                {/* 2. GLOWING 3D CEREBRAL BRAIN STRUCTURE (Sulci, Gyri & Neural Synapses) */}
                {/* Main Cerebrum Luminous Glowing Mass */}
                <path
                  d="M185,120 
                     C175,90 205,68 245,72 
                     C280,75 300,95 304,130 
                     C308,160 295,190 270,205 
                     C245,220 210,215 190,195 
                     C175,180 170,150 185,120 Z"
                  fill="url(#electricBrainGlow)"
                  filter="url(#luminousGlow)"
                />

                {/* Intricate Brain Wave Gyri & Neural Synapse Strands */}
                <g stroke="#FFFFFF" strokeLinecap="round" opacity="0.9">
                  {/* Frontal Lobe */}
                  <path d="M195,115 C210,105 225,112 235,125 C242,135 258,128 270,118" strokeWidth="2.2" />
                  <path d="M188,140 C202,130 218,148 238,138 C255,128 272,148 288,138" strokeWidth="2.2" />
                  {/* Parietal & Temporal Lobes */}
                  <path d="M198,165 C212,152 228,172 248,160 C265,150 278,168 288,175" strokeWidth="2.2" />
                  <path d="M210,185 C225,192 245,185 260,180" strokeWidth="2" />
                  <path d="M220,95 C238,88 260,92 275,102" strokeWidth="1.8" strokeOpacity="0.8" />
                  <path d="M205,125 C218,118 232,122 245,112" strokeWidth="1.5" strokeOpacity="0.8" />
                </g>

                {/* Cerebellum & Brainstem Lower Glow */}
                <ellipse cx="255" cy="225" rx="28" ry="18" fill="#38BDF8" opacity="0.75" filter="url(#luminousGlow)" />
                <path d="M238,220 C248,215 262,222 272,230" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />

                {/* Synaptic Bioluminescent Firing Nodes (Glowing Particle Dots) */}
                <circle cx="215" cy="102" r="3.5" fill="#FFFFFF" className="animate-ping" style={{ animationDuration: '2.4s' }} />
                <circle cx="215" cy="102" r="2" fill="#38BDF8" />

                <circle cx="265" cy="120" r="3.5" fill="#FFFFFF" className="animate-ping" style={{ animationDuration: '3.1s' }} />
                <circle cx="265" cy="120" r="2" fill="#A855F7" />

                <circle cx="235" cy="155" r="3.5" fill="#FFFFFF" className="animate-ping" style={{ animationDuration: '2.7s' }} />
                <circle cx="235" cy="155" r="2" fill="#38BDF8" />

                <circle cx="280" cy="165" r="3" fill="#FFFFFF" className="animate-pulse" />
                <circle cx="280" cy="165" r="1.8" fill="#38BDF8" />

                <circle cx="200" cy="150" r="2.5" fill="#A5F3FC" />
                <circle cx="255" cy="190" r="2.5" fill="#A5F3FC" />

                {/* 3. TRANSLUCENT CRANIOFACIAL BONES & DENTAL OCCLUSION */}
                {/* Maxilla (Upper Jaw Bone) */}
                <path
                  d="M125,235 C145,235 165,242 178,252 C178,258 165,264 150,264 C135,264 125,252 125,235 Z"
                  fill="url(#boneShade)"
                  stroke="#818CF8"
                  strokeWidth="1.2"
                  opacity="0.85"
                />

                {/* Upper Teeth Row (Delicate White Teeth) */}
                <path
                  d="M100,256 L124,254 M102,258 L108,258 M112,257 L118,257 M120,255 L124,255"
                  stroke="#FFFFFF"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />

                {/* Mandible (Lower Jaw Bone & Ramus) */}
                <path
                  d="M105,295 C115,318 135,328 165,325 C190,320 225,300 235,255 C235,245 220,255 195,268 C165,282 135,285 105,295 Z"
                  fill="url(#boneShade)"
                  stroke="#C084FC"
                  strokeWidth="1.2"
                  opacity="0.8"
                />

                {/* Lower Teeth Row & Occlusion Plane */}
                <path
                  d="M102,268 L122,266 M104,270 L110,270 M114,269 L120,269"
                  stroke="#FFFFFF"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />

                {/* Dental Occlusal Alignment Line */}
                <line x1="90" y1="262" x2="135" y2="260" stroke="#EC4899" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.85" />

                {/* 4. DYNAMIC AIRWAY CORRIDOR (The Curved Colored Pathway matching IMG_2128.png) */}
                {/* Outer Glow Halo */}
                <path
                  d={currentStageData.pathD}
                  stroke={currentStageData.strokeColor}
                  strokeWidth={currentStageData.curveWidth + 12}
                  strokeLinecap="round"
                  strokeOpacity="0.25"
                  filter="url(#luminousGlow)"
                />
                {/* Middle Radiant Core */}
                <path
                  d={currentStageData.pathD}
                  stroke={currentStageData.strokeColor}
                  strokeWidth={currentStageData.curveWidth}
                  strokeLinecap="round"
                  strokeOpacity="0.85"
                />
                {/* Bright Center Highlight */}
                <path
                  d={currentStageData.pathD}
                  stroke="#FFFFFF"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeOpacity="0.9"
                />

                {/* 5. CERVICAL SPINE (Vertebrae C1-C7 Stack with Glowing Spinal Cord) */}
                <g opacity="0.85">
                  {/* C1 Atlas */}
                  <rect x="238" y="250" width="22" height="9" rx="3.5" fill="#E0E7FF" stroke="#818CF8" strokeWidth="1" />
                  {/* C2 Axis */}
                  <rect x="236" y="264" width="24" height="10" rx="3.5" fill="#E0E7FF" stroke="#818CF8" strokeWidth="1" />
                  {/* C3 */}
                  <rect x="234" y="279" width="25" height="10" rx="3.5" fill="#E0E7FF" stroke="#818CF8" strokeWidth="1" />
                  {/* C4 */}
                  <rect x="232" y="294" width="26" height="11" rx="3.5" fill="#E0E7FF" stroke="#818CF8" strokeWidth="1" />
                  {/* C5 */}
                  <rect x="230" y="310" width="27" height="11" rx="3.5" fill="#E0E7FF" stroke="#818CF8" strokeWidth="1" />
                  {/* C6 */}
                  <rect x="228" y="326" width="28" height="12" rx="3.5" fill="#E0E7FF" stroke="#818CF8" strokeWidth="1" />
                  {/* C7 */}
                  <rect x="226" y="343" width="29" height="13" rx="3.5" fill="#E0E7FF" stroke="#818CF8" strokeWidth="1" />

                  {/* Luminescent Spinal Nerve Canal */}
                  <line x1="248" y1="245" x2="238" y2="360" stroke="#38BDF8" strokeWidth="3" strokeOpacity="0.85" filter="url(#luminousGlow)" />
                </g>

                {/* 6. VECTOR CEPHALOMETRIC MEASUREMENT TARGET NODES */}
                {/* Nasion / Cranial Reference */}
                <circle cx="98" cy="185" r="4.5" fill="#8B5CF6" stroke="#FFFFFF" strokeWidth="1.8" />
                <line x1="98" y1="185" x2="60" y2="155" stroke="#C084FC" strokeWidth="1.2" strokeDasharray="3 2" opacity="0.8" />

                {/* Subnasale / Maxillary A-Point */}
                <circle cx="94" cy="245" r="4.5" fill="#EC4899" stroke="#FFFFFF" strokeWidth="1.8" />
                <line x1="94" y1="245" x2="55" y2="235" stroke="#F472B6" strokeWidth="1.2" strokeDasharray="3 2" opacity="0.8" />

                {/* Pogonion / Chin B-Point */}
                <circle cx="84" cy="298" r="4.5" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="1.8" />
                <line x1="84" y1="298" x2="50" y2="310" stroke="#60A5FA" strokeWidth="1.2" strokeDasharray="3 2" opacity="0.8" />

                {/* Airway Measurement Vector Line */}
                <circle cx="168" cy="205" r="3.5" fill={currentStageData.strokeColor} stroke="#FFFFFF" strokeWidth="1.5" />
                <circle cx="198" cy="360" r="3.5" fill={currentStageData.strokeColor} stroke="#FFFFFF" strokeWidth="1.5" />
              </svg>
            )}

            {/* Bottom Status Ribbon (Inside the Image Card matching IMG_2128.png) */}
            <div className="absolute bottom-2.5 inset-x-2.5 py-1.5 px-3 rounded-2xl bg-[#0F0B21]/80 backdrop-blur-xl border border-white/10 flex items-center justify-between z-20 shadow-md">
              <div className="flex items-center gap-1.5">
                <span 
                  className="w-2 h-2 rounded-full animate-pulse shadow-sm"
                  style={{ backgroundColor: currentStageData.airwayColor }}
                />
                <span className="text-[9px] sm:text-[10px] font-black text-white uppercase tracking-wider">
                  {currentStageData.subtitle}
                </span>
              </div>
              <span 
                className="text-[9px] sm:text-[10px] font-black tracking-tight"
                style={{ color: currentStageData.strokeColor }}
              >
                Airway: {currentStageData.airwayScore}
              </span>
            </div>

          </div>

        </div>

        {/* Layer 2: Right-Side Stack of 4 Glass Feature Badges */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-2 sm:gap-2.5 z-30 w-[140px] sm:w-[190px] lg:w-[215px] max-w-[45%]">
          {featurePills.map((pill) => {
            const Icon = pill.icon;
            const isSelected = activeTab === pill.id;

            return (
              <motion.button
                key={pill.id}
                type="button"
                whileHover={{ scale: 1.03, x: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setActiveTab(pill.id);
                  if (onSelectFeature) onSelectFeature(pill.id);
                }}
                className={`w-full p-2 sm:p-2.5 rounded-2xl backdrop-blur-xl border text-left transition-all duration-200 cursor-pointer flex items-center gap-2 shadow-xs group ${
                  isSelected
                    ? 'bg-white/95 border-purple-400 shadow-[0_6px_20px_rgba(147,51,234,0.22)] ring-2 ring-purple-400/30'
                    : 'bg-white/80 hover:bg-white/95 border-white/90 hover:border-purple-200'
                }`}
              >
                {/* Icon Capsule */}
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-transform group-hover:scale-105 ${
                  isSelected 
                    ? `bg-gradient-to-br ${pill.color} text-white` 
                    : 'bg-purple-100 text-purple-700'
                }`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>

                {/* Text Labels */}
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[8px] font-black tracking-widest text-purple-600 uppercase">
                    {pill.category}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-black text-[#1E1245] truncate tracking-tight">
                    {pill.title}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Layer 3: Floating Case History Glass Comparison Card (Bottom Right) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="absolute -bottom-2 sm:bottom-0 right-0 sm:right-1 p-2.5 sm:p-3 rounded-2xl bg-white/90 backdrop-blur-2xl border border-white shadow-[0_8px_24px_rgba(147,51,234,0.16)] z-30 flex flex-col gap-1.5 max-w-[195px] sm:max-w-[215px]"
        >
          {/* Card Header */}
          <div className="flex items-center justify-between">
            <span className="text-[8px] sm:text-[9px] font-black text-purple-900 tracking-wider uppercase">
              CASE HISTORY
            </span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
              <span className="w-1.5 h-1.5 rounded-full bg-purple-300" />
            </div>
          </div>

          {/* Before / After Thumbnail Comparison */}
          <div className="flex items-center justify-between gap-1 pt-0.5">
            {/* INITIAL Thumbnail */}
            <button
              type="button"
              onClick={() => setCurrentStage('baseline')}
              className={`flex flex-col items-center gap-0.5 p-1 rounded-xl transition-all cursor-pointer ${
                currentStage === 'baseline' ? 'bg-orange-50 ring-1 ring-orange-400' : 'hover:bg-slate-50'
              }`}
            >
              <div className="w-14 sm:w-16 h-11 sm:h-12 rounded-lg bg-slate-900 border border-slate-700/80 p-0.5 flex items-center justify-center overflow-hidden relative">
                <div className="w-1.5 h-7 rounded-full bg-orange-500/80 blur-2xs" />
                <span className="text-[8px] font-black text-orange-400 absolute bottom-0.5">62%</span>
              </div>
              <span className="text-[7px] font-extrabold text-slate-500 tracking-wider">
                INITIAL
              </span>
            </button>

            {/* Transition Arrow */}
            <div className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <ArrowRight className="w-2.5 h-2.5" />
            </div>

            {/* GROWTH Thumbnail */}
            <button
              type="button"
              onClick={() => setCurrentStage('optimal')}
              className={`flex flex-col items-center gap-0.5 p-1 rounded-xl transition-all cursor-pointer ${
                currentStage === 'optimal' ? 'bg-emerald-50 ring-1 ring-emerald-400' : 'hover:bg-slate-50'
              }`}
            >
              <div className="w-14 sm:w-16 h-11 sm:h-12 rounded-lg bg-gradient-to-tr from-purple-950 to-slate-900 border border-emerald-400/80 p-0.5 flex items-center justify-center overflow-hidden relative">
                <div className="w-3 h-8 rounded-full bg-emerald-400/80 blur-2xs" />
                <span className="text-[8px] font-black text-emerald-400 absolute bottom-0.5">98%</span>
              </div>
              <span className="text-[7px] font-extrabold text-purple-700 tracking-wider">
                GROWTH
              </span>
            </button>
          </div>
        </motion.div>

      </div>

      {/* Dynamic Stage Description Sub-banner */}
      <div className="mt-2 text-center max-w-[480px]">
        <p className="text-[10px] sm:text-[11px] text-[#4E4765] font-medium leading-tight">
          <span className="font-bold text-purple-900">{currentStageData.label}: </span>
          {currentStageData.desc}
        </p>
      </div>

    </div>
  );
};
