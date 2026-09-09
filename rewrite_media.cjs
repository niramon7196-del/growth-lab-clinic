const fs = require('fs');

const content = `import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Video, BookOpen, CheckCircle2, ChevronRight, Activity, Smile, ShieldCheck, ListChecks, Info } from 'lucide-react';
import { UserRole } from '../types';

interface VideoContent {
  id: string;
  title: string;
  description: string;
  youtubeId: string;
  steps: string[];
}

interface VideoCategory {
  id: string;
  title: string;
  icon: any;
  videos: VideoContent[];
}

const MEDIA_CATEGORIES: VideoCategory[] = [
  {
    id: 'omt',
    title: 'หมวด OMT (บริหารกล้ามเนื้อช่องปาก)',
    icon: Smile,
    videos: [
      {
        id: 'omt_1',
        title: 'ท่าฝึกการหายใจทางจมูก (Nasal Breathing)',
        description: 'การฝึกหายใจผ่านจมูกอย่างถูกต้อง เพื่อเสริมสร้างพัฒนาการโครงหน้าและทางเดินหายใจ',
        youtubeId: 'Pyi350fPC5c',
        steps: [
          'นั่งหรือยืนในท่าที่ผ่อนคลาย ยืดหลังตรง',
          'ปิดริมฝีปากให้สนิท วางลิ้นแตะเพดานปากด้านบน',
          'สูดลมหายใจเข้าทางจมูกช้าๆ ลึกๆ ให้หน้าท้องขยาย',
          'ผ่อนลมหายใจออกทางจมูกช้าๆ ให้หน้าท้องแฟบลง',
          'ทำต่อเนื่อง 5-10 นาทีต่อวัน'
        ]
      },
      {
        id: 'omt_2',
        title: 'ท่าปิดริมฝีปากสนิท (Lip Seal)',
        description: 'ฝึกความแข็งแรงของกล้ามเนื้อรอบริมฝีปาก ให้อยู่ในตำแหน่งที่ปิดสนิทตลอดเวลา',
        youtubeId: 'Oq5E_y2T-A4', 
        steps: [
          'เม้มริมฝีปากเข้าหากันให้สนิท โดยไม่เกร็งคาง',
          'อมลมไว้ในแก้มสลับซ้าย-ขวา',
          'ใช้ไม้กดลิ้นหรือกระดุมฝึกดึงริมฝีปากเพื่อเพิ่มความแข็งแรง',
          'พยายามคงสถานะริมฝีปากปิดสนิทในชีวิตประจำวัน'
        ]
      },
      {
        id: 'omt_3',
        title: 'ท่าวางตำแหน่งลิ้นบนเพดาน (Tongue Spot)',
        description: 'ปรับตำแหน่งลิ้นที่ถูกต้องขณะพักผ่อน (Resting Posture)',
        youtubeId: 'T8XG40iO02E', 
        steps: [
          'หาตำแหน่ง "Spot" ซึ่งอยู่หลังฟันหน้าบน (บริเวณรอยหยักบนเพดานปาก)',
          'วางปลายลิ้นแตะที่ตำแหน่ง Spot',
          'ดูดลิ้นส่วนที่เหลือให้แนบสนิทไปกับเพดานปาก',
          'ค้างไว้และกลืนน้ำลายโดยไม่ให้ลิ้นขยับจากเพดาน'
        ]
      },
      {
        id: 'omt_4',
        title: 'ท่าฝึกการกลืนถูกต้อง (Proper Swallowing)',
        description: 'ปรับรูปแบบการกลืนน้ำลายและอาหารอย่างถูกวิธี',
        youtubeId: '9L1mX9F5Qcw', 
        steps: [
          'วางลิ้นในตำแหน่ง Tongue Spot',
          'ปิดริมฝีปากสนิท ฟันกรามสบกันเบาๆ',
          'กลืนน้ำลายโดยใช้กล้ามเนื้อคอ ไม่ใช้กล้ามเนื้อริมฝีปากหรือแก้ม',
          'สังเกตว่าคางไม่เกร็งและริมฝีปากไม่ขยับขณะกลืน'
        ]
      }
    ]
  },
  {
    id: 'posture',
    title: 'หมวดโครงสร้างร่างกาย (Postural & Growth)',
    icon: Activity,
    videos: [
      {
        id: 'posture_1',
        title: 'ท่ายืนพิงผนังปรับบุคลิกภาพ (Wall Stand)',
        description: 'ปรับสมดุลแนวกระดูกสันหลังและลดอาการคอยื่น (Forward Head Posture)',
        youtubeId: 'R7Ww-g9Otyo',
        steps: [
          'ยืนพิงผนัง ให้ส้นเท้า สะโพก สะบัก และหลังศีรษะสัมผัสผนัง',
          'เก็บคางลงเล็กน้อย (Chin Tuck)',
          'เกร็งหน้าท้องเล็กน้อย ไม่ให้หลังแอ่นมากเกินไป',
          'ค้างไว้ 1-2 นาที ทำซ้ำ 3-5 รอบ'
        ]
      },
      {
        id: 'posture_2',
        title: 'ท่ากระโดดกระตุ้นการสร้างกระดูก (Bone Loading Jump)',
        description: 'การกระโดดรับแรงกระแทกเพื่อกระตุ้นมวลกระดูกและการเติบโต (Growth Plate)',
        youtubeId: 'u4_Ym04w8eE', 
        steps: [
          'ยืนตัวตรง กางขาความกว้างระดับไหล่',
          'ย่อเข่าลงเล็กน้อยและกระโดดขึ้นในแนวดิ่ง',
          'ลงพื้นด้วยปลายเท้าและย่อเข่าเพื่อซับแรงกระแทก',
          'ทำเซ็ตละ 10-15 ครั้ง จำนวน 3 เซ็ต'
        ]
      },
      {
        id: 'posture_3',
        title: 'ท่าสร้างความแข็งแรงแกนกลางลำตัว',
        description: 'เพิ่มความมั่นคงของแกนกลางลำตัว (Core Plank, Bird Dog, Glute Bridge) ซึ่งเป็นฐานที่สำคัญของโครงสร้างร่างกาย',
        youtubeId: '61aG1U5OqP4', 
        steps: [
          'Plank: ตั้งศอกและปลายเท้า เกร็งลำตัวให้เป็นเส้นตรง ค้างไว้ 30 วินาที',
          'Bird Dog: คุกเข่า 4 มุม เหยียดแขนซ้ายและขาขวา ค้างไว้ 5 วินาที สลับข้าง',
          'Glute Bridge: นอนหงาย ชันเข่า ยกสะโพกขึ้นจนลำตัวตรง ค้างไว้ 5 วินาที'
        ]
      },
      {
        id: 'posture_4',
        title: 'ท่ายืดเหยียดแนวกระดูกสันหลัง (Spine Stretch)',
        description: 'ลดความตึงเครียดของกล้ามเนื้อหลังและยืดขยายช่องว่างระหว่างข้อต่อกระดูก',
        youtubeId: 'g_tea8ZNk5A', 
        steps: [
          'Child\\'s Pose: คุกเข่าและนั่งทับส้นเท้า โน้มตัวไปข้างหน้า เหยียดแขนให้สุด',
          'Cat-Cow: คุกเข่า 4 มุม โก่งหลังขึ้น (Cat) สลับกับแอ่นหลังลง (Cow)',
          'ทำท่าละ 30-45 วินาที พร้อมหายใจเข้าออกลึกๆ'
        ]
      }
    ]
  },
  {
    id: 'ef_trainer',
    title: 'หมวดอุปกรณ์ EF Trainer',
    icon: ShieldCheck,
    videos: [
      {
        id: 'ef_1',
        title: 'แนะนำขั้นตอนการใส่อุปกรณ์และวิธีดูแลรักษา',
        description: 'การใส่ EF Trainer อย่างถูกวิธี และการทำความสะอาดเพื่อยืดอายุการใช้งาน',
        youtubeId: 'zU9Q0k1gNXY',
        steps: [
          'ล้างมือให้สะอาดก่อนจับอุปกรณ์',
          'หันด้านที่มีเครื่องหมาย \\'Up\\' หรือรอยบากขึ้นด้านบน',
          'สวมอุปกรณ์เข้าในช่องปาก วางริมฝีปากปิดสนิทรอบอุปกรณ์',
          'หลังใช้งานล้างด้วยน้ำเปล่าหรือน้ำสบู่อ่อนๆ (ห้ามใช้น้ำร้อน)',
          'ผึ่งให้แห้งและเก็บในกล่องที่จัดไว้ให้'
        ]
      }
    ]
  },
  {
    id: 'gns',
    title: 'หมวดโภชนาการ GNS',
    icon: BookOpen,
    videos: [
      {
        id: 'gns_1',
        title: 'ความรู้เรื่องอาหารกระตุ้นการเจริญเติบโต',
        description: 'โภชนาการที่จำเป็นสำหรับการพัฒนาโครงสร้างร่างกายและสมอง',
        youtubeId: '3eL_g6u70aY',
        steps: [
          'เน้นโปรตีนคุณภาพสูง (ไข่ เนื้อสัตว์ ปลา นม) เพื่อสร้างกล้ามเนื้อ',
          'รับประทานแคลเซียมและวิตามินดี ให้เพียงพอต่อการสร้างกระดูก',
          'ลดอาหารหวานและน้ำตาลที่ส่งผลเสียต่อโกรทฮอร์โมน (Growth Hormone)',
          'เคี้ยวอาหารให้ละเอียดอย่างน้อย 20-30 ครั้งต่อคำ เพื่อบริหารขากรรไกร',
          'ดื่มน้ำเปล่าให้เพียงพอตลอดวัน'
        ]
      }
    ]
  }
];

interface MediaLibraryHubProps {
  userRole?: UserRole;
}

export const MediaLibraryHub: React.FC<MediaLibraryHubProps> = () => {
  const [activeCategoryId, setActiveCategoryId] = useState<string>(MEDIA_CATEGORIES[0].id);
  const [activeVideoId, setActiveVideoId] = useState<string>(MEDIA_CATEGORIES[0].videos[0].id);

  const activeCategory = MEDIA_CATEGORIES.find(c => c.id === activeCategoryId) || MEDIA_CATEGORIES[0];
  const activeVideo = activeCategory.videos.find(v => v.id === activeVideoId) || activeCategory.videos[0];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-[10px] font-black uppercase tracking-wider">
                Exercise Media Hub
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
              <Video className="w-8 h-8 text-purple-600" />
              คลังวิดีโอสาธิตการฝึก
            </h1>
            <p className="text-slate-500 font-medium mt-2 max-w-2xl text-sm leading-relaxed">
              แหล่งรวบรวมวิดีโอสาธิตท่าบริหารกล้ามเนื้อช่องปาก การปรับโครงสร้างร่างกาย อุปกรณ์ EF และโภชนาการ เพื่อใช้เป็นมาตรฐานในการดูแลคนไข้
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Top Content: Video Player and Steps */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeVideo.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Video Player */}
              <div className="bg-white p-2 rounded-3xl border border-slate-200 shadow-sm">
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 relative shadow-inner">
                  <iframe
                    src={\`https://www.youtube.com/embed/\${activeVideo.youtubeId}?rel=0\`}
                    title={activeVideo.title}
                    className="absolute inset-0 w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>

              {/* Video Details */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/60">
                <h2 className="text-2xl font-black text-slate-800 mb-3">{activeVideo.title}</h2>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <Info className="inline-block w-4 h-4 text-purple-500 mr-2 -mt-0.5" />
                  {activeVideo.description}
                </p>

                <div>
                  <h3 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-4">
                    <ListChecks className="w-5 h-5 text-purple-600" />
                    ขั้นตอนปฏิบัติกำกับ (Step-by-Step)
                  </h3>
                  <div className="space-y-3">
                    {activeVideo.steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                        <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <p className="text-slate-700 text-sm font-medium pt-0.5 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right/Bottom Content: Categories and Playlist */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden sticky top-6">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-black text-slate-800 text-sm">เลือกหมวดหมู่วิดีโอ</h3>
            </div>
            
            <div className="flex overflow-x-auto lg:flex-col border-b border-slate-100 scrollbar-hide">
              {MEDIA_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategoryId(cat.id);
                      setActiveVideoId(cat.videos[0].id);
                    }}
                    className={\`flex items-center gap-3 px-4 py-3.5 text-left transition-all shrink-0 lg:shrink whitespace-nowrap lg:whitespace-normal border-b lg:border-b-0 lg:border-l-4 last:border-b-0
                      \${isActive 
                        ? 'bg-purple-50 border-purple-600 text-purple-900' 
                        : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }
                    \`}
                  >
                    <div className={\`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 \${isActive ? 'bg-purple-200 text-purple-700' : 'bg-slate-100 text-slate-500'}\`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs sm:text-sm">{cat.title}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-4 bg-slate-50/30">
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3 px-2">
                รายการวิดีโอสาธิต
              </h4>
              <div className="space-y-2">
                {activeCategory.videos.map((vid) => {
                  const isPlaying = activeVideoId === vid.id;
                  return (
                    <button
                      key={vid.id}
                      onClick={() => setActiveVideoId(vid.id)}
                      className={\`w-full text-left p-3 rounded-2xl flex items-start gap-3 transition-all border
                        \${isPlaying
                          ? 'bg-white border-purple-300 shadow-md ring-1 ring-purple-100'
                          : 'bg-transparent border-transparent hover:bg-slate-100/80 hover:border-slate-200'
                        }
                      \`}
                    >
                      <div className="relative shrink-0 mt-0.5">
                        <div className={\`w-10 h-7 rounded-lg flex items-center justify-center \${isPlaying ? 'bg-purple-600' : 'bg-slate-300'}\`}>
                          <Play className={\`w-3.5 h-3.5 \${isPlaying ? 'text-white fill-white' : 'text-white'}\`} />
                        </div>
                        {isPlaying && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full animate-pulse" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className={\`font-bold text-xs line-clamp-2 leading-snug \${isPlaying ? 'text-purple-900' : 'text-slate-700'}\`}>
                          {vid.title}
                        </h5>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaLibraryHub;
`;
fs.writeFileSync('src/components/MediaLibraryHub.tsx', content);
