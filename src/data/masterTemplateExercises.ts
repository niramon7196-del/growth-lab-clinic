import { Exercise } from '../types';

export type GrowthPillarCategory = 'omt' | 'postural' | 'breathing' | 'sleep_ef' | 'nutrition';

export interface MasterTemplateExerciseItem {
  id: string;
  code: string;
  pillar: GrowthPillarCategory;
  pillarNameTh: string;
  pillarIcon: string;
  title: string;
  titleEn: string;
  subTitle: string;
  purpose: string;
  clinicalRationale: string;
  difficultyLevel: 'ง่าย' | 'ปานกลาง' | 'ยาก';
  targetReps: string;
  targetDurationMinutes: number;
  durationText: string;
  videoUrl: string;
  imageUrl?: string;
  relatedAnatomy: string[];
  steps: string[];
  precautions?: string[];
  tips?: string[];
}

export const MASTER_PILLARS_META: Record<GrowthPillarCategory, {
  id: GrowthPillarCategory;
  nameTh: string;
  nameEn: string;
  icon: string;
  colorBg: string;
  colorBorder: string;
  colorText: string;
  badgeBg: string;
  desc: string;
}> = {
  omt: {
    id: 'omt',
    nameTh: '1. OMT (บริหารกล้ามเนื้อช่องปากและลิ้น)',
    nameEn: 'Oral Myofunctional Therapy',
    icon: '👄',
    colorBg: 'bg-rose-50/80',
    colorBorder: 'border-rose-200',
    colorText: 'text-rose-900',
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
    desc: 'ปรับตำแหน่งลิ้นพักบนเพดานปาก (Spot), ปิดริมฝีปาก และฝึกรูปแบบการกลืนเพื่อขยายเพดานปาก'
  },
  postural: {
    id: 'postural',
    nameTh: '2. Postural (ปรับสรีระ & กระตุ้นความสูง)',
    nameEn: 'Postural & Bone Loading',
    icon: '🧍',
    colorBg: 'bg-purple-50/80',
    colorBorder: 'border-purple-200',
    colorText: 'text-purple-900',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
    desc: 'จัดแนวกระดูกสันหลัง, ท่ายืนพิงผนัง, เก็บตกคาง และกระโดด Bone Loading กระตุ้น Growth Plate'
  },
  breathing: {
    id: 'breathing',
    nameTh: '3. Nasal Breathing (การหายใจทางจมูก 100%)',
    nameEn: 'Diaphragmatic Nasal Breathing',
    icon: '🫁',
    colorBg: 'bg-sky-50/80',
    colorBorder: 'border-sky-200',
    colorText: 'text-sky-900',
    badgeBg: 'bg-sky-100 text-sky-800 border-sky-200',
    desc: 'ฝึกหายใจด้วยกะบังลมผ่านจมูก ป้องกันการหายใจทางปาก (Mouth Breathing) เพิ่มออกซิเจนสมอง'
  },
  sleep_ef: {
    id: 'sleep_ef',
    nameTh: '4. Sleep & EF (สุขอนามัยการนอน & EF)',
    nameEn: 'Sleep Hygiene & Executive Function',
    icon: '🌙',
    colorBg: 'bg-indigo-50/80',
    colorBorder: 'border-indigo-200',
    colorText: 'text-indigo-900',
    badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    desc: 'การใส่อุปกรณ์ EF Trainer ประจำคืน, การนอนหลับลึกหลั่ง Growth Hormone และฝึกสติคุมพฤติกรรม'
  },
  nutrition: {
    id: 'nutrition',
    nameTh: '5. GNS Nutrition (โภชนาการสร้างการเติบโต)',
    nameEn: 'Growth Nutrition Score',
    icon: '🥗',
    colorBg: 'bg-emerald-50/80',
    colorBorder: 'border-emerald-200',
    colorText: 'text-emerald-900',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    desc: 'เกณฑ์คะแนนสารอาหาร GNS, โปรตีนคุณภาพสูง, แคลเซียม แมกนีเซียม วิตามิน D3/K2 เสริมความสูง'
  }
};

export const MASTER_TEMPLATE_EXERCISES: MasterTemplateExerciseItem[] = [
  // ==========================================
  // PILLAR 1: OMT (Oral Myofunctional Therapy)
  // ==========================================
  {
    id: 'omt_spot_suction',
    code: 'OMT-01',
    pillar: 'omt',
    pillarNameTh: 'บริหารกล้ามเนื้อช่องปาก (OMT)',
    pillarIcon: '👄',
    title: 'การฝึกตำแหน่งลิ้นพักและแรงดูดเพดานปาก (Tongue Spot & Suction)',
    titleEn: 'Tongue Spot Placement & Palatal Suction',
    subTitle: 'ปรับตำแหน่งลิ้นพักให้อยู่บนเพดานปาก 100% ตลอดทั้งวัน',
    purpose: 'กระตุ้นแรงผลักของลิ้นช่วยขยายกระดูกขากรรไกรบนตามธรรมชาติ ป้องกันเพดานปากแคบและฟันซ้อนเก',
    clinicalRationale: 'ลิ้นคือ Retainer ธรรมชาติที่ดีที่สุด เมื่อแผ่นลิ้นแนบสนิทกับเพดานปาก จะช่วยขยาย Maxilla และเปิดทางเดินหายใจส่วนบน (Upper Airway)',
    difficultyLevel: 'ปานกลาง',
    targetReps: '10 ครั้ง (ค้าง 5-10 วินาที)',
    targetDurationMinutes: 5,
    durationText: '5 นาที / เซสชัน',
    videoUrl: 'https://www.youtube.com/embed/Pyi350fPC5c',
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1000&q=80',
    relatedAnatomy: ['ลิ้น (Tongue)', 'เพดานปาก (Hard Palate)', 'ขากรรไกรบน (Maxilla)'],
    steps: [
      'หาตำแหน่งจุด Spot (บริเวณรอยหยักเพดานปากด้านหลังฟันตัดบน ห่างจากโคนฟันประมาณ 3-5 มม.)',
      'วางปลายลิ้นแตะที่จุด Spot โดยระวังไม่ให้ปลายลิ้นดันชนฟันหน้า',
      'ออกแรงดูดแผ่นลิ้นทั้งหมดให้แนบสนิทติดกับเพดานปากจนเกิดแรงสุญญากาศ (Palatal Suction)',
      'อ้าปากกว้างเบาๆ โดยที่แผ่นลิ้นยังคงดูดติดแน่นอยู่บนเพดานปาก ค้างไว้ 5-10 วินาที',
      'ผ่อนคลายกลืนน้ำลายช้าๆ แล้วทำซ้ำจนครบ 10 รอบ'
    ],
    precautions: [
      'อย่าให้ปลายลิ้นดันชนฟันหน้าบนขณะฝึก',
      'ผ่อนคลายกล้ามเนื้อคาง ไม่เกร็งคางเป็นปุ่มลูกส้ม'
    ],
    tips: [
      'ฝึกหน้ากระจกเพื่อให้เห็นชัดว่าลิ้นดูดติดเพดานปากสม่ำเสมอ',
      'ฝึกให้เป็นนิสัยทุกครั้งที่ปากว่าง'
    ]
  },
  {
    id: 'omt_lip_seal',
    code: 'OMT-02',
    pillar: 'omt',
    pillarNameTh: 'บริหารกล้ามเนื้อช่องปาก (OMT)',
    pillarIcon: '👄',
    title: 'การฝึกปิดริมฝีปากและต้านแรงดึง (Lip Seal & Button Pull Exercise)',
    titleEn: 'Lip Seal Strengthening & Button Pull',
    subTitle: 'เพิ่มแรงกระชับของกล้ามเนื้อรอบริมฝีปาก (Orbicularis Oris)',
    purpose: 'สร้างพฤติกรรมการปิดปากสนิทขณะพัก ป้องกันการอ้าปากหายใจ และช่วยควบคุมฟันหน้าไม่ให้ยื่น',
    clinicalRationale: 'แรงกระชับของริมฝีปาก (Lip Competence) ช่วยรักษาความสมดุลของแรงภายนอกต้านกับแรงลิ้นภายใน ป้องกัน Bimaxillary Protrusion',
    difficultyLevel: 'ง่าย',
    targetReps: '10 ครั้ง (ครั้งละ 5 วินาที)',
    targetDurationMinutes: 5,
    durationText: '5 นาที / เซสชัน',
    videoUrl: 'https://www.youtube.com/embed/Pyi350fPC5c',
    imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1000&q=80',
    relatedAnatomy: ['ริมฝีปาก (Orbicularis Oris)', 'กล้ามเนื้อกระพุ้งแก้ม (Buccinator)', 'คาง (Mentalis)'],
    steps: [
      'นั่งตัวตรง ฟันกรามสบแตะกันเบาๆ เม้มริมฝีปากบนและล่างเข้าหากันสนิท',
      'ใช้นิ้วชี้ดึงมุมปากสองข้างออกเบาๆ ขณะที่ริมฝีปากพยายามเม้มต้านแรงดึงไว้',
      'เกร็งกล้ามเนื้อริมฝีปากค้างไว้ 5 วินาที โดยไม่เกร็งกล้ามเนื้อคาง',
      'คลายแรงดึง พัก 2 วินาที',
      'ทำซ้ำต่อเนื่องจนครบ 10 ครั้ง'
    ],
    precautions: ['ไม่กัดฟันแน่นเกินไป ให้ฟันสบกันเบาๆ', 'หายใจผ่านทางจมูกเท่านั้น'],
    tips: ['สามารถใช้อุปกรณ์กระดุมผูกด้ายช่วยฝึก Lip Pull ได้อย่างมีประสิทธิภาพ']
  },
  {
    id: 'omt_swallowing',
    code: 'OMT-03',
    pillar: 'omt',
    pillarNameTh: 'บริหารกล้ามเนื้อช่องปาก (OMT)',
    pillarIcon: '👄',
    title: 'การฝึกรูปแบบการกลืนที่ถูกต้อง (Correct Myofunctional Swallowing)',
    titleEn: 'Adult Myofunctional Swallowing Pattern',
    subTitle: 'ฝึกกลืนน้ำลายและอาหารโดยไม่แลบหรือดันลิ้นชนฟัน (Anti-Tongue Thrust)',
    purpose: 'แก้ไขการกลืนผิดวิธี ซึ่งเป็นสาเหตุหลักของฟันหน้าสบเปิด (Open Bite) และฟันล้มหลังจัดฟัน',
    clinicalRationale: 'มนุษย์กลืนน้ำลายวันละ 1,500-2,000 ครั้ง หากมี Tongue Thrust จะสร้างแรงดันฟันหน้าอย่างต่อเนื่อง การแก้ไขท่ากลืนจึงสำคัญต่อโครงสร้างกระดูกใบหน้าอย่างยิ่ง',
    difficultyLevel: 'ยาก',
    targetReps: '12-15 ครั้ง',
    targetDurationMinutes: 8,
    durationText: '8 นาที / เซสชัน',
    videoUrl: 'https://www.youtube.com/embed/Pyi350fPC5c',
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1000&q=80',
    relatedAnatomy: ['ลิ้น (Tongue)', 'กล้ามเนื้อคอหอย (Pharyngeal Muscles)', 'ริมฝีปาก (Lips)'],
    steps: [
      'จิบน้ำเปล่าเล็กน้อย รวบน้ำไว้ตรงกลางหลังลิ้น',
      'วางปลายลิ้นแตะจุด Spot และยกแผ่นลิ้นแนบสนิทกับเพดานปาก',
      'ยิ้มยิงฟันเล็กน้อย เปิดริมฝีปากเผยอเบาๆ เพื่อตรวจดูว่าลิ้นไม่แลบออกมาโดนฟัน',
      'กลืนน้ำลงคอโดยออกแรงดันลิ้นขึ้นเพดานปาก ลิฟต์ลูกกระเดือกยกขึ้นอย่างนุ่มนวล',
      'ริมฝีปากและแก้มต้องนิ่งสนิท ไม่เกร็งกระตุกขณะกลืน'
    ],
    precautions: ['ห้ามเม้มปากแน่นขณะกลืน', 'ตรวจดูว่าลิ้นไม่ยื่นลอดช่องฟัน'],
    tips: ['ฝึกกลืนน้ำทีละ 1 ช้อนชาหน้ากระจกจนชำนาญก่อนนำไปใช้กับอาหารจริง']
  },
  {
    id: 'omt_jaw_chew',
    code: 'OMT-04',
    pillar: 'omt',
    pillarNameTh: 'บริหารกล้ามเนื้อช่องปาก (OMT)',
    pillarIcon: '👄',
    title: 'การบริหารการเคี้ยวสองข้างและขากรรไกร (Bilateral Chewing & TMJ Stability)',
    titleEn: 'Bilateral Chewing Pattern & Masseter Muscle Tone',
    subTitle: 'ปรับสมดุลการเคี้ยวอาหารสองข้างเท่ากัน เสริมความแข็งแรงข้อต่อขากรรไกร',
    purpose: 'ป้องกันใบหน้าเบี้ยวไม่สมมาตร (Facial Asymmetry) และกระตุ้นการเติบโตของแนวกระดูกกราม',
    clinicalRationale: 'การเคี้ยวอาหารเนื้อสัมผัสกระตุ้นการสร้างความหนาแน่นกระดูกขากรรไกร (Bone Remodeling) และส่งเสริมการขยายตัวของโพรงจมูก',
    difficultyLevel: 'ปานกลาง',
    targetReps: '30 ครั้ง / ข้าง',
    targetDurationMinutes: 10,
    durationText: '10 นาที / เซสชัน',
    videoUrl: 'https://www.youtube.com/embed/Pyi350fPC5c',
    imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1000&q=80',
    relatedAnatomy: ['กล้ามเนื้อบดเคี้ยว (Masseter)', 'ข้อต่อขากรรไกร (TMJ)', 'กระดูกขากรรไกรล่าง (Mandible)'],
    steps: [
      'เลือกอาหารที่มีเนื้อสัมผัสเคี้ยวพอดี ไม่เหนียวหรือแข็งจัด',
      'เคี้ยวข้างซ้าย 15 ครั้งอย่างละเอียดและสม่ำเสมอ',
      'สลับเคี้ยวข้างขวา 15 ครั้งอย่างเท่าเทียม',
      'ฝึกอ้าปากกว้างตรงๆ ค้างไว้ 3 วินาที แล้วหุบปากช้าๆ 10 รอบ',
      'สัมผัสที่แก้มสองข้างเพื่อสังเกตการทำงานของกล้ามเนื้อ Masseter ที่เท่ากัน'
    ],
    precautions: ['หลีกเลี่ยงการเคี้ยวข้างเดียวเป็นนิสัย', 'หากมีเสียงคลิกหรือปวดข้อต่อ TMJ ให้หยุดพัก'],
    tips: ['เคี้ยวช้าๆ ละเอียดก่อนกลืน ช่วยทั้งระบบย่อยและการพัฒนาขากรรไกร']
  },

  // ==========================================
  // PILLAR 2: POSTURAL & BONE LOADING
  // ==========================================
  {
    id: 'posture_wall_stand',
    code: 'POST-01',
    pillar: 'postural',
    pillarNameTh: 'ปรับสรีระ & กระดูก (Postural)',
    pillarIcon: '🧍',
    title: 'ท่ายืนพิงผนังจัดแนวกระดูกสันหลัง (Wall Stand & Posture Alignment)',
    titleEn: 'Wall Stand Postural Alignment & Spine Extension',
    subTitle: 'จัดแนวกระดูกสันหลังให้ตรงเป็นแนวแกน ลดแรงกดทับหมอนรองกระดูก',
    purpose: 'ปรับบุคลิกภาพหลังตรง ยืดลำตัว และเปิดช่องอกเพื่อทางเดินหายใจที่โล่งและเพิ่มความสูง',
    clinicalRationale: 'แนวกระดูกสันหลังที่คดงอหรือค่อม (Kyphosis) จะกดทับหมอนรองกระดูกและทำให้เตี้ยลง 2-3 ซม. การจัดแนวตั้งตรงช่วยให้ Growth Spurt ทำงานได้เต็มศักยภาพ',
    difficultyLevel: 'ง่าย',
    targetReps: '3 นาทีต่อเนื่อง',
    targetDurationMinutes: 3,
    durationText: '3 นาที / วัน',
    videoUrl: 'https://www.youtube.com/embed/Pyi350fPC5c',
    imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1000&q=80',
    relatedAnatomy: ['แนวกระดูกสันหลัง (Spine)', 'สะบักหลัง (Scapula)', 'กล้ามเนื้อแกนกลาง (Core)'],
    steps: [
      'ยืนพิงผนังห้อง ให้ส้นเท้าอยู่ห่างจากผนังประมาณ 2-3 ซม.',
      'ให้ 5 จุดสำคัญแนบชิดติดผนัง: ส้นเท้า, น่อง, ก้น, สะบักหลังสองข้าง, และหลังศีรษะ',
      'เก็บคางเข้าหาลำคอเล็กน้อย (Chin Tuck) โดยตามองตรงไปข้างหน้า',
      'ผ่อนคลายหัวไหล่ ไม่ยกไหล่เกร็ง หายใจเข้า-ออกทางจมูกช้าๆ ลึกๆ',
      'ยืนทรงตัวค้างไว้นิ่งๆ ต่อเนื่อง 3 นาที'
    ],
    precautions: ['อย่าแอ่นหลังล่างจนช่องว่างหลังกว้างเกินฝ่ามือ', 'หายใจทางจมูกสม่ำเสมอ'],
    tips: ['ทำทุกเช้าหลังตื่นนอนและก่อนนอนเพื่อเซ็ตแกนแนวกระดูกสันหลัง']
  },
  {
    id: 'posture_chin_tuck',
    code: 'POST-02',
    pillar: 'postural',
    pillarNameTh: 'ปรับสรีระ & กระดูก (Postural)',
    pillarIcon: '🧍',
    title: 'ท่าเก็บคางเปิดทางเดินหายใจ (Chin Tuck & Cervical Decompression)',
    titleEn: 'Chin Tuck Cervical Alignment Fix',
    subTitle: 'แก้ไขภาวะศีรษะยื่นไปข้างหน้า (Forward Head Posture)',
    purpose: 'เปิดขยายทางเดินหายใจส่วนบน ป้องกันภาวะหยุดหายใจขณะหลับ และจัดแนวข้อต่อคอให้สมดุล',
    clinicalRationale: 'ศีรษะที่ยื่นไปข้างหน้าทุกๆ 1 นิ้วจะเพิ่มน้ำหนักกดทับกระดูกคอ 4.5 กก. ทำให้หลอดลมตีบแคบลง การเก็บคางจะช่วย Decompress กระดูกต้นคอ C1-C7',
    difficultyLevel: 'ง่าย',
    targetReps: '10 ครั้ง (ค้าง 5 วินาที)',
    targetDurationMinutes: 5,
    durationText: '5 นาที / เซสชัน',
    videoUrl: 'https://www.youtube.com/embed/Pyi350fPC5c',
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1000&q=80',
    relatedAnatomy: ['กระดูกต้นคอ (Cervical Spine)', 'ทางเดินหายใจ (Upper Airway)', 'กล้ามเนื้อท้ายทอย'],
    steps: [
      'นั่งหรือยืนหลังตรง ตามองตรงขนานกับพื้น',
      'วางนิ้วชี้เบาๆ ที่ปลายคาง',
      'ดึงคางถอยหลังตรงๆ เข้าหาลำคอ (เหมือนทำคางสองชั้น) โดยไม่ก้มหรือเงยหน้า',
      'รู้สึกถึงการยืดเหยียดของกล้ามเนื้อท้ายทอย ค้างไว้ 5 วินาที',
      'คลายคางออกช้าๆ กลับสู่ตำแหน่งปกติ แล้วทำซ้ำ 10 รอบ'
    ],
    precautions: ['อย่าก้มศีรษะลง ให้ดึงคางถอยหลังในแนวระนาบ', 'ไม่เกร็งไหล่'],
    tips: ['ฝึกทำขณะนั่งทำการบ้านหรือหลังใช้หน้าจอสมาร์ตโฟน']
  },
  {
    id: 'posture_bone_loading_jump',
    code: 'POST-03',
    pillar: 'postural',
    pillarNameTh: 'ปรับสรีระ & กระดูก (Postural)',
    pillarIcon: '🧍',
    title: 'ท่ากระโดด Bone Loading กระตุ้นความสูง (Epiphyseal Growth Plate Jump)',
    titleEn: 'Two-Leg Jump & Epiphyseal Plate Impact Stimulation',
    subTitle: 'กระโดดลงน้ำหนักที่นุ่มนวลเพื่อกระตุ้นแผ่นการเจริญเติบโตของกระดูก',
    purpose: 'กระตุ้น Piezoelectric Effect บนกระดูกยาว ส่งเสริมการแบ่งเซลล์ของ Epiphyseal Plate เพิ่มความสูง',
    clinicalRationale: 'แรงกระแทกเชิงกลในระดับที่เหมาะสม (Mechanical Loading) กระตุ้น Osteoblast ในการสร้างมวลกระดูกใหม่ตามแนวความยาวของกระดูกขาและแนวกระดูกสันหลัง',
    difficultyLevel: 'ปานกลาง',
    targetReps: '30 ครั้ง (3 เซ็ต เซ็ตละ 10 ครั้ง)',
    targetDurationMinutes: 7,
    durationText: '7 นาที / เซสชัน',
    videoUrl: 'https://www.youtube.com/embed/Pyi350fPC5c',
    imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1000&q=80',
    relatedAnatomy: ['แผ่นเจริญเติบโตกระดูก (Growth Plates)', 'กระดูกแข้ง (Tibia)', 'กระดูกต้นขา (Femur)'],
    steps: [
      'ยืนกางเท้าเท่าความกว้างหัวไหล่ แขนปล่อยสบายข้างลำตัว',
      'ย่อเข่าลงเล็กน้อย เหวี่ยงแขนไปข้างหลังเตรียมส่งแรง',
      'กระโดดขึ้นในแนวตั้งตรง ลำตัวเหยียดตรง แขนชูขึ้นช่วยส่งแรง',
      'ลงสู่พื้นอย่างนุ่มนวล (Soft Landing) โดยลงน้ำหนักที่ปลายเท้าก่อนแล้วงอเข่ายุบตัวซับแรง',
      'ทำต่อเนื่อง 10 ครั้ง พัก 30 วินาที แล้วทำซ้ำจนครบ 3 เซ็ต'
    ],
    precautions: [
      'ต้องงอเข่าซับแรงกระแทกเสมอ ห้ามลงพื้นด้วยเข่าตึง',
      'สวมรองเท้ากีฬาหรือกระโดดบนพื้นยางรับแรงกระแทก'
    ],
    tips: ['ทำตอนช่วงบ่ายหรือเย็นก่อนมื้ออาหารเพื่อกระตุ้น Growth Hormone']
  },
  {
    id: 'posture_spine_stretch',
    code: 'POST-04',
    pillar: 'postural',
    pillarNameTh: 'ปรับสรีระ & กระดูก (Postural)',
    pillarIcon: '🧍',
    title: 'ท่ายืดเหยียดแนวกระดูกสันหลังและเปิดอก (Spinal Stretch & Scapular Retraction)',
    titleEn: 'Spinal Decompression & Chest Opening Stretch',
    subTitle: 'ยืดเหยียดลำตัว ชูมือขึ้นสุด ดึงสะบักหลังเปิดอก',
    purpose: 'คลายแรงบีบอัดของหมอนรองกระดูกสันหลัง เพิ่มความยืดหยุ่นของข้อต่อ และขยายกรงอก',
    clinicalRationale: 'การยืดเหยียดแนวดิ่งช่วยเพิ่มระยะห่างระหว่างข้อต่อกระดูกสันหลัง (Intervertebral Disc Height) และเพิ่มความจุของปอด (Vital Capacity)',
    difficultyLevel: 'ง่าย',
    targetReps: '10 ครั้ง (ค้าง 5 วินาที)',
    targetDurationMinutes: 5,
    durationText: '5 นาที / เซสชัน',
    videoUrl: 'https://www.youtube.com/embed/Pyi350fPC5c',
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1000&q=80',
    relatedAnatomy: ['หมอนรองกระดูก (Intervertebral Discs)', 'สะบักหลัง (Scapula)', 'กล้ามเนื้อหลัง (Latissimus Dorsi)'],
    steps: [
      'ยืนตรง ประสานนิ้วมือสองข้างเข้าหากัน',
      'หายใจเข้าลึกๆ ทางจมูก พร้อมชูมือสองข้างขึ้นเหนือศีรษะ หงายฝ่ามือขึ้นฟ้า',
      'ยืดลำตัวและแนวกระดูกสันหลังขึ้นให้สุด เขย่งปลายเท้าขึ้นเล็กน้อย',
      'ยืดค้างไว้ 5 วินาที รู้สึกถึงแนวกระดูกสันหลังที่ยืดขยาย',
      'หายใจออกช้าๆ ลดแขนและส้นเท้าลง พร้อมดึงสะบักสองข้างเข้าหากันเปิดอก'
    ],
    precautions: ['ไม่กลั้นหายใจขณะยืด', 'ยืดเหยียดอย่างนุ่มนวลไม่กระชาก'],
    tips: ['เหมาะมากสำหรับการยืดคลายความเมื่อยล้าหลังการนั่งเรียนต่อเนื่อง']
  },

  // ==========================================
  // PILLAR 3: NASAL BREATHING (100% AIRWAY)
  // ==========================================
  {
    id: 'breathe_diaphragm',
    code: 'BRTH-01',
    pillar: 'breathing',
    pillarNameTh: 'การหายใจทางจมูก (Nasal Breathing)',
    pillarIcon: '🫁',
    title: 'การฝึกหายใจผ่านจมูกด้วยกะบังลม (Diaphragmatic Nasal Breathing)',
    titleEn: 'Deep Diaphragmatic Nasal Breathing & Nitric Oxide Boost',
    subTitle: 'ปรับระบบทางเดินหายใจให้ผ่านจมูก 100% หายใจลึกด้วยกล้ามเนื้อกะบังลม',
    purpose: 'กระตุ้นการผลิตก๊าซ Nitric Oxide ในโพรงไซนัส เพิ่มออกซิเจนบริสุทธิ์สู่สมอง และลดภาวะปากแห้งฟันเก',
    clinicalRationale: 'การหายใจทางจมูกจะกรอง ปรับอุณหภูมิ และเพิ่มความชื้นให้อากาศ พร้อมดึง Nitric Oxide จากโพรงจมูกเข้าสู่ปอด ช่วยขยายหลอดเลือดและส่งเสริมการเจริญเติบโตของสมอง',
    difficultyLevel: 'ง่าย',
    targetReps: '10-15 รอบหายใจลึก',
    targetDurationMinutes: 5,
    durationText: '5 นาที / เซสชัน',
    videoUrl: 'https://www.youtube.com/embed/Pyi350fPC5c',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1000&q=80',
    relatedAnatomy: ['โพรงจมูก (Nasal Cavity)', 'กะบังลม (Diaphragm)', 'ปอด (Lungs)'],
    steps: [
      'นั่งในท่าที่สบาย หลังตรง ปิดริมฝีปากให้สนิท ปลายลิ้นแตะจุด Spot บนเพดานปาก',
      'วางมือข้างหนึ่งบนหน้าอก และอีกข้างบนหน้าท้องบริเวณสะดือ',
      'สูดลมหายใจเข้าช้าๆ ลึกๆ ผ่านทางจมูก นับ 1-4 ให้หน้าท้องขยายออก (มือที่หน้าอกต้องขยับน้อยมาก)',
      'กลั้นลมหายใจเบาๆ นับ 1-2',
      'ผ่อนลมหายใจออกช้าๆ สม่ำเสมอผ่านทางจมูก นับ 1-6 ให้หน้าท้องยุบลง',
      'ปฏิบัติซ้ำอย่างมีสมาธิ 10-15 รอบ'
    ],
    precautions: ['อย่าหายใจเข้าทางปากเด็ดขาด', 'ไหล่ต้องไม่ยกขึ้นขณะสูดลมหายใจ'],
    tips: ['ฝึกตอนเช้าหลังตื่นนอนเพื่อกระตุ้นระบบประสาท Parasympathetic ให้ผ่อนคลายและมีสมาธิ']
  },
  {
    id: 'breathe_box_rhythm',
    code: 'BRTH-02',
    pillar: 'breathing',
    pillarNameTh: 'การหายใจทางจมูก (Nasal Breathing)',
    pillarIcon: '🫁',
    title: 'จังหวะหายใจ 4-4-4 Box Breathing เพิ่มสมาธิ (Rhythmic Airway Calming)',
    titleEn: '4-4-4 Box Breathing for Airway Calming & Focus',
    subTitle: 'กำหนดจังหวะหายใจเข้า-กลั้น-ออกอย่างสมดุลผ่านทางจมูก',
    purpose: 'ฝึกการควบคุมระบบประสาทอัตโนมัติ ลดความตึงเครียด และเสริมสร้างสมาธิในการเรียนรู้',
    clinicalRationale: 'จังหวะการหายใจช้าและลึกช่วยปรับสมดุลก๊าซ CO2 ในเลือด (Bohr Effect) ทำให้ออกซิเจนหลุดจากฮีโมโกลบินเข้าสู่เนื้อเยื่อสมองได้มีประสิทธิภาพสูงสุด',
    difficultyLevel: 'ปานกลาง',
    targetReps: '8-10 รอบจังหวะ',
    targetDurationMinutes: 5,
    durationText: '5 นาที / เซสชัน',
    videoUrl: 'https://www.youtube.com/embed/Pyi350fPC5c',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1000&q=80',
    relatedAnatomy: ['ระบบทางเดินหายใจ', 'ระบบประสาทพาราซิมพาเทติก', 'โพรงไซนัส'],
    steps: [
      'นั่งตัวตรง หลับตาลงเบาๆ ปิดริมฝีปากสนิท',
      'สูดลมหายใจเข้าทางจมูก นับ 1-2-3-4',
      'กลั้นลมหายใจไว้อย่างสบาย นับ 1-2-3-4',
      'ผ่อนลมหายใจออกทางจมูกช้าๆ นับ 1-2-3-4',
      'พักนิ่งก่อนเริ่มรอบใหม่ นับ 1-2-3-4',
      'ทำซ้ำ 8-10 รอบอย่างต่อเนื่อง'
    ],
    precautions: ['ไม่เกร็งหน้าอกหรือกลั้นหายใจจนอึดอัด', 'ควบคุมจังหวะให้นุ่มนวล'],
    tips: ['ช่วยให้เด็กสงบอารมณ์และมีสมาธิก่อนเริ่มทำการบ้านหรืออ่านหนังสือ']
  },

  // ==========================================
  // PILLAR 4: SLEEP & EXECUTIVE FUNCTION (EF)
  // ==========================================
  {
    id: 'sleep_ef_appliance_routine',
    code: 'SLEEP-01',
    pillar: 'sleep_ef',
    pillarNameTh: 'การนอน & EF (Sleep & EF)',
    pillarIcon: '🌙',
    title: 'การใส่อุปกรณ์ EF Trainer ตลอดการนอนหลับ (EF Appliance Sleep Routine)',
    titleEn: 'Nightly EF Myofunctional Appliance Wear Protocol',
    subTitle: 'ใส่อุปกรณ์ฝึกกล้ามเนื้อปากและขยายขากรรไกร 1 ชั่วโมงก่อนนอนและตลอดคืน',
    purpose: 'ควบคุมตำแหน่งลิ้น ปิดริมฝีปาก และฝึกการหายใจทางจมูกต่อเนื่องตลอด 8-9 ชั่วโมงของการนอนหลับ',
    clinicalRationale: 'อุปกรณ์ EF Trainer ทำหน้าที่จัดตำแหน่งขากรรไกรล่างให้มาข้างหน้า (Mandibular Repositioning) ป้องกันลิ้นตกอุดกั้นหลอดลม ช่วยให้ทางเดินหายใจเปิดกว้างตลอดการนอนหลับ',
    difficultyLevel: 'ปานกลาง',
    targetReps: 'ใส่ 1 ชม. ก่อนนอน + ตลอดคืน',
    targetDurationMinutes: 480,
    durationText: '8-9 ชั่วโมงต่อคืน',
    videoUrl: 'https://www.youtube.com/embed/Pyi350fPC5c',
    imageUrl: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=1000&q=80',
    relatedAnatomy: ['ขากรรไกรบน-ล่าง', 'ลิ้น', 'ทางเดินหายใจขณะหลับ (Pharyngeal Airway)'],
    steps: [
      'แปรงฟันและทำความสะอาดอุปกรณ์ EF Trainer ด้วยน้ำสะอาด',
      'ใส่อุปกรณ์ในปากให้ตรงตำแหน่ง ลิ้นแตะที่ลิ้นยางบนอุปกรณ์ (Tongue Tag)',
      'เม้มริมฝีปากปิดสนิท ใส่ขณะทำกิจกรรมสงบก่อนนอน 1 ชั่วโมง (เช่น อ่านนิทาน)',
      'ใส่อุปกรณ์เข้านอนตลอดคืน หายใจผ่านทางจมูกเท่านั้น',
      'ตื่นนอนเช้า ล้างอุปกรณ์ด้วยน้ำสะอาดและเก็บใส่กล่องระบายอากาศ'
    ],
    precautions: [
      'อย่าเคี้ยวหรือกัดอุปกรณ์ EF เล่น',
      'หากอุปกรณ์หลุดบ่อยในสัปดาห์แรก ถือเป็นเรื่องปกติ ให้ใส่อย่างสม่ำเสมอ'
    ],
    tips: ['หากมีอาการคัดจมูก ให้ล้างจมูกด้วยน้ำเกลือก่อนใส่อุปกรณ์']
  },
  {
    id: 'sleep_hygiene_growth_hormone',
    code: 'SLEEP-02',
    pillar: 'sleep_ef',
    pillarNameTh: 'การนอน & EF (Sleep & EF)',
    pillarIcon: '🌙',
    title: 'สุขอนามัยการนอนหลับลึกเพื่อ Growth Hormone (Sleep Hygiene & Deep Sleep)',
    titleEn: 'Sleep Hygiene Protocol for Peak Growth Hormone Secretion',
    subTitle: 'เข้านอนก่อน 21:00-21:30 น. นอนหลับลึก 8-10 ชั่วโมงในห้องมืดสนิท',
    purpose: 'กระตุ้นการหลั่งโกรทฮอร์โมน (Human Growth Hormone) สูงสุดช่วง 22:00-02:00 น. เพื่อการเจริญเติบโต',
    clinicalRationale: 'โกรทฮอร์โมนกว่า 70-80% ของวันจะหลั่งออกมาในช่วง Slow-Wave Deep Sleep (Stage 3 NREM) หากนอนดึกหรือมีภาวะนอนกรน การหลั่ง HGH จะลดลงอย่างมีนัยสำคัญ',
    difficultyLevel: 'ง่าย',
    targetReps: '8-10 ชั่วโมง / คืน',
    targetDurationMinutes: 540,
    durationText: '8-10 ชั่วโมงต่อคืน',
    videoUrl: 'https://www.youtube.com/embed/Pyi350fPC5c',
    imageUrl: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=1000&q=80',
    relatedAnatomy: ['ต่อมใต้สมอง (Pituitary Gland)', 'ระบบประสาทสมอง', 'กระดูกและกล้ามเนื้อ'],
    steps: [
      'งดหน้าจอคอมพิวเตอร์และมือถืออย่างน้อย 1 ชั่วโมงก่อนนอน (ลดแสงสีฟ้า)',
      'ปรับอุณหภูมิห้องนอนให้เย็นสบาย (24-25 องศาเซลเซียส) และปิดไฟให้มืดสนิท',
      'เข้านอนเวลาเดิมทุกวัน สม่ำเสมอแม้ในวันหยุดสุดสัปดาห์',
      'บันทึกเวลาเข้านอนและตื่นนอนในระบบ Sleep Tracker ทุกเช้า'
    ],
    precautions: ['งดอาหารมื้อหนักหรือเครื่องดื่มรสหวานก่อนนอน 2 ชั่วโมง'],
    tips: ['การอ่านหนังสือหรือฟังนิทานเสียงเบาๆ ช่วยให้คลื่นสมองเข้าสู่โหมดหลับลึกได้เร็วขึ้น']
  },

  // ==========================================
  // PILLAR 5: GNS NUTRITION & GROWTH SUPPORT
  // ==========================================
  {
    id: 'gns_protein_height_boost',
    code: 'GNS-01',
    pillar: 'nutrition',
    pillarNameTh: 'โภชนาการความสูง (GNS Nutrition)',
    pillarIcon: '🥗',
    title: 'โภชนาการโปรตีนคุณภาพสูงกระตุ้นความสูง (High-Quality Protein Goal)',
    titleEn: 'Essential Amino Acids & High-Quality Protein for Linear Growth',
    subTitle: 'รับประทานโปรตีนครบถ้วน 1.2-1.5 กรัมต่อน้ำหนักตัว 1 กก. ทุกวัน',
    purpose: 'จัดหากรดอะมิโนจำเป็น (เช่น Arginine, Lysine) เสริมสร้างคอลลาเจนและเมทริกซ์กระดูก',
    clinicalRationale: 'โปรตีนคือโครงสร้างพื้นฐานของกระดูก (Type 1 Collagen Matrix) และเป็นตัวกระตุ้นการสร้าง IGF-1 (Insulin-like Growth Factor 1) ในตับเพื่อเร่งการแบ่งเซลล์กระดูก',
    difficultyLevel: 'ง่าย',
    targetReps: '3 มื้อคุณภาพต่อวัน',
    targetDurationMinutes: 15,
    durationText: 'ทุกวัน (3 มื้ออาหาร)',
    videoUrl: 'https://www.youtube.com/embed/Pyi350fPC5c',
    imageUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1000&q=80',
    relatedAnatomy: ['มวลกระดูก (Bone Matrix)', 'กล้ามเนื้อโครงร่าง (Skeletal Muscle)', 'ตับ (IGF-1)'],
    steps: [
      'รับประทานไข่วันละ 1-2 ฟอง (แหล่งโปรตีนและโคลีนสมบูรณ์แบบ)',
      'เสริมเนื้อปลา เนื้อไก่ไม่ติดมัน นมสด หรือเต้าหู้ในทุกมื้อหลัก',
      'รับประทานอาหารเช้าที่มีโปรตีนสูงเพื่อป้องกันการสลายกล้ามเนื้อ',
      'เช็กอินคะแนนโภชนาการใน GNS Tracker ประจำวัน'
    ],
    precautions: ['หลีกเลี่ยงของทอด ขนมขบเคี้ยวโซเดียมสูง และน้ำอัดลม'],
    tips: ['ดื่มนมสดรสจืดหรือนมถั่วเหลืองเสริมแคลเซียมวันละ 2 แก้ว']
  },
  {
    id: 'gns_bone_minerals_d3k2',
    code: 'GNS-02',
    pillar: 'nutrition',
    pillarNameTh: 'โภชนาการความสูง (GNS Nutrition)',
    pillarIcon: '🥗',
    title: 'แร่ธาตุเสริมสร้างมวลกระดูก แคลเซียม แมกนีเซียม & วิตามิน D3/K2',
    titleEn: 'Bone Mineral Density Optimization (Calcium, Magnesium & D3/K2)',
    subTitle: 'เสริมสร้างความหนาแน่นกระดูกและฟันให้แข็งแรงสมบูรณ์',
    purpose: 'เพิ่มการสะสมแคลเซียมในกระดูก (Mineralization) ป้องกันกระดูกบางและเสริมโครงสร้างขากรรไกร',
    clinicalRationale: 'แคลเซียมต้องการวิตามิน D3 ในการดูดซึมจากทางเดินอาหาร และต้องการวิตามิน K2 ในการนำแคลเซียมไปจับที่กระดูกโดยไม่สะสมในหลอดเลือด',
    difficultyLevel: 'ง่าย',
    targetReps: 'รับแสงแดดอ่อน 15 นาที + อาหารเสริมกระดูก',
    targetDurationMinutes: 15,
    durationText: 'ทุกวัน',
    videoUrl: 'https://www.youtube.com/embed/Pyi350fPC5c',
    imageUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1000&q=80',
    relatedAnatomy: ['กระดูกสันหลังและขา', 'กระดูกขากรรไกร', 'ฟัน'],
    steps: [
      'สัมผัสแสงแดดยามเช้า 15 นาที เพื่อกระตุ้นการสังเคราะห์วิตามิน D ธรรมชาติ',
      'รับประทานผักใบเขียวเข้ม งาดำ ถั่วเมล็ดแห้ง และปลาตัวเล็กทอดกรอบ',
      'ดื่มน้ำสะอาดอย่างน้อยวันละ 1.5 - 2 ลิตรเพื่อระบบไหลเวียนโลหิตที่ดี',
      'งดน้ำหวานและชาเขียวรสหวานก่อนนอน'
    ],
    precautions: ['หลีกเลี่ยงการดื่มน้ำอัดลม เพราะกรดฟอสฟอริกจะดึงแคลเซียมออกจากกระดูก'],
    tips: ['ทำเป็นกิจวัตรครอบครัวเพื่อสร้างสุขนิสัยที่ดีร่วมกัน']
  }
];
