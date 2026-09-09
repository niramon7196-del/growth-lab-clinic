import { Exercise, AnatomyPart } from '../types';

export interface GrowthExerciseGuideItem {
  id: string;
  code: string; // A1..A5, B1..B6, C1..C6
  category: 'JUMP & IMPACT' | 'STRENGTH TRAINING' | 'CORE EXERCISES';
  categoryTh: string; // "กระโดดเพื่อกระตุ้นกระดูก" | "เสริมสร้างความแข็งแรง" | "กล้ามเนื้อแกนกลางลำตัว"
  title: string;
  titleEn: string;
  subtitle: string;
  description: string;
  targetReps: number;
  targetSets: number;
  targetDurationMinutes: number;
  targetUnit: string;
  difficultyLevel: 'ง่าย' | 'ปานกลาง' | 'ยาก';
  videoUrl: string;
  steps: string[];
  precautions?: string[];
}

export const font_bold_precautions = [
  "เด็กควรอบอุ่นร่างกาย 5-10 นาที ก่อนออกกำลังกาย และผ่อนคลาย 5 นาที หลังออกกำลังกาย",
  "หากมีอาการปวด บวม เดินกะเผลก หรือปวดเพิ่มขึ้นจากการออกกำลังกาย ควรหยุด/ปรับกิจกรรมและปรึกษาแพทย์หรือผู้เชี่ยวชาญ",
  "การออกกำลังกายเป็นส่วนหนึ่งในการสนับสนุนสุขภาพและศักยภาพการเจริญเติบโต ไม่สามารถรับประกันการเพิ่มส่วนสูงหรือความสูงสุดท้ายของผู้ใหญ่ได้"
];

export const GENERAL_EXERCISE_PRECAUTIONS = font_bold_precautions;

export const GROWTH_EXERCISES_16: GrowthExerciseGuideItem[] = [
  // ==================== CATEGORY A: JUMP & IMPACT ====================
  {
    id: 'ex_jump_two_leg',
    code: 'A1',
    category: 'JUMP & IMPACT',
    categoryTh: 'กระโดดเพื่อกระตุ้นกระดูก',
    title: 'Two-leg Jump (กระโดดสองขา)',
    titleEn: 'Two-leg Jump',
    subtitle: 'กระโดดขึ้น-ลงด้วยสองขา หลังตรง เข่าไม่พับเข้าด้านใน',
    description: 'กระโดดสองขาขึ้น-ลงแนวตั้งอย่างนุ่มนวล ช่วยกระตุ้นแผ่นการเจริญเติบโต (Epiphyseal Plate) บริเวณขาและแนวกระดูกสันหลัง',
    targetReps: 20,
    targetSets: 3,
    targetDurationMinutes: 5,
    targetUnit: 'ครั้ง/เซ็ต',
    difficultyLevel: 'ง่าย',
    videoUrl: 'https://www.youtube.com/embed/Pyi350fPC5c',
    steps: [
      'ยืนกางเท้าเท่าความกว้างสะโพก ทรงตัวให้สมดุล',
      'ย่อเข่าเล็กน้อย เหวี่ยงแขนสองข้างไปด้านหลังเตรียมออกแรง',
      'กระโดดขึ้นในแนวตั้งตรง หลังตรง เข่าไม่พับเข้าด้านใน',
      'ลงสู่พื้นอย่างนุ่มนวล โดยย่อเข่าเพื่อซับแรงกระแทก'
    ],
    precautions: ['ย่อเข่าซับแรงเสมอ', 'ระวังเข่าพับบิดเข้าด้านใน']
  },
  {
    id: 'ex_jump_forward',
    code: 'A2',
    category: 'JUMP & IMPACT',
    categoryTh: 'กระโดดเพื่อกระตุ้นกระดูก',
    title: 'Forward Jump (กระโดดหน้า-หลัง)',
    titleEn: 'Forward Jump',
    subtitle: 'กระโดดไปข้างหน้า และถอยหลังสลับกัน',
    description: 'กระโดดข้ามเส้นสมมติไปข้างหน้าและถอยหลัง ช่วยเพิ่มความคล่องตัว การทรงตัว และแรงอัดกระตุ้นกระดูก',
    targetReps: 15,
    targetSets: 3,
    targetDurationMinutes: 5,
    targetUnit: 'ครั้ง/เซ็ต',
    difficultyLevel: 'ปานกลาง',
    videoUrl: 'https://www.youtube.com/embed/Pyi350fPC5c',
    steps: [
      'ยืนทรงตัวตรง เท้าสองข้างชิดกันหรือกางเล็กน้อย',
      'กระโดดข้ามเส้นไปข้างหน้าด้วยสองขาพร้อมกัน',
      'กระโดดถอยหลังกลับสู่ตำแหน่งเริ่มต้น',
      'ควบคุมจังหวะให้นุ่มนวล และรักษาการทรงตัวของลำตัว'
    ],
    precautions: ['ควบคุมการลงน้ำหนักนุ่มนวล', 'รักษาลำตัวให้ตรง']
  },
  {
    id: 'ex_jump_side',
    code: 'A3',
    category: 'JUMP & IMPACT',
    categoryTh: 'กระโดดเพื่อกระตุ้นกระดูก',
    title: 'Side-to-Side Jump (กระโดดข้าง)',
    titleEn: 'Side-to-Side Jump',
    subtitle: 'กระโดดสลับไปด้านข้าง ซ้าย-ขวา',
    description: 'กระโดดออกข้างซ้ายและขวาสลับกัน เสริมสร้างความแข็งแรงข้อเท้า กล้ามเนื้อรอบข้อต่อ และมวลกระดูก',
    targetReps: 15,
    targetSets: 3,
    targetDurationMinutes: 5,
    targetUnit: 'ครั้ง/ข้าง',
    difficultyLevel: 'ปานกลาง',
    videoUrl: 'https://www.youtube.com/embed/Pyi350fPC5c',
    steps: [
      'ยืนย่อเข่าเล็กน้อย แขนสองข้างงอเตรียมทรงตัว',
      'กระโดดไปทางซ้าย นวดลงพื้นนุ่มนวล',
      'กระโดดสลับไปทางขวาด้วยจังหวะสม่ำเสมอ',
      'ทรงตัวให้นิ่งขณะลงพื้น รักษาลำตัวตรง'
    ],
    precautions: ['ประคองข้อเท้าไม่ให้พลิก', 'ย่อเข่าซับแรงทุกครั้ง']
  },
  {
    id: 'ex_jump_hopscotch',
    code: 'A4',
    category: 'JUMP & IMPACT',
    categoryTh: 'กระโดดเพื่อกระตุ้นกระดูก',
    title: 'Hopscotch (กระโดดสลับเท้า)',
    titleEn: 'Hopscotch',
    subtitle: 'กระโดดสลับเท้าไปตามช่อง',
    description: 'ฝึกการกระโดดเท้าเดียวสลับสองขาไปตามจังหวะช่อง เสริมประสาทรับรู้และการทรงตัวขณะเคลื่อนไหว',
    targetReps: 10,
    targetSets: 3,
    targetDurationMinutes: 5,
    targetUnit: 'รอบ/เซ็ต',
    difficultyLevel: 'ปานกลาง',
    videoUrl: 'https://www.youtube.com/embed/Pyi350fPC5c',
    steps: [
      'เริ่มต้นกระโดดด้วยเท้าข้างเดียวในช่องแรก',
      'กางสองขาลงพื้นในช่องถัดไปอย่างพร้อมเพรียง',
      'กระโดดสลับเท้าเดียวและสองขาไปจนจบแถว',
      'หมุนตัวกลับแล้วกระโดดสลับกลับตำแหน่งเดิม'
    ],
    precautions: ['ทรงตัวให้อยู่ในแนวตรง', 'ห้ามกระแทกส้นเท้าลงพื้นแรง']
  },
  {
    id: 'ex_jump_rope',
    code: 'A5',
    category: 'JUMP & IMPACT',
    categoryTh: 'กระโดดเพื่อกระตุ้นกระดูก',
    title: 'Jump Rope (กระโดดเชือก)',
    titleEn: 'Jump Rope',
    subtitle: 'กระโดดต่อเนื่อง จังหวะสม่ำเสมอ',
    description: 'การออกกำลังกาย Bone-loading ชั้นดี เพิ่มมวลกระดูกและความแข็งแรงของหัวใจและปอดอย่างมีประสิทธิภาพ',
    targetReps: 50,
    targetSets: 3,
    targetDurationMinutes: 10,
    targetUnit: 'ครั้ง/เซ็ต',
    difficultyLevel: 'ปานกลาง',
    videoUrl: 'https://www.youtube.com/embed/Pyi350fPC5c',
    steps: [
      'ถือด้ามเชือกด้วยข้อมือสองข้าง ลำตัวตรง',
      'แกว่งเชือกข้ามศีรษะด้วยข้อมือ ไม่ใช้ทั้งแขนแกว่ง',
      'กระโดดนุ่มนวลด้วยปลายเท้าสูงจากพื้น 1-2 นิ้ว',
      'รักษาจังหวะการกระโดดให้สม่ำเสมอต่อเนื่อง'
    ],
    precautions: ['สวมรองเท้ากีฬาที่ซับแรงกระแทก', 'กระโดดต่ำๆ ไม่เกร็งไหล่']
  },

  // ==================== CATEGORY B: STRENGTH TRAINING ====================
  {
    id: 'ex_str_squat',
    code: 'B1',
    category: 'STRENGTH TRAINING',
    categoryTh: 'เสริมสร้างความแข็งแรง',
    title: 'Squat (สควอท)',
    titleEn: 'Squat',
    subtitle: 'ยืนกางเท้า ก้นงอเหมือนนั่งเก้าอี้ หลังตรง เข่าไม่พับเข้าใน',
    description: 'เสริมสร้างกล้ามเนื้อต้นขา ก้น และข้อต่อขาทั้งหมด เพื่อฐานโครงสร้างร่างกายที่แข็งแรง',
    targetReps: 12,
    targetSets: 3,
    targetDurationMinutes: 5,
    targetUnit: 'ครั้ง/เซ็ต',
    difficultyLevel: 'ปานกลาง',
    videoUrl: 'https://www.youtube.com/embed/Pyi350fPC5c',
    steps: [
      'ยืนกางเท้าเท่าความกว้างหัวไหล่ ปลายเท้าชี้ออกเล็กน้อย',
      'ทิ้งน้ำหนักไปที่ส้นเท้า งอเข่าดันสะโพกไปข้างหลังเหมือนนั่งเก้าอี้',
      'รักษาหลังตรง หน้าอกเปิด เข่าชี้ตามทิศทางปลายเท้า (ไม่พับเข้าด้านใน)',
      'ดันตัวกลับขึ้นสู่ท่าเริ่มต้น เกร็งก้นตอนขึ้นสุด'
    ],
    precautions: ['ไม่ให้เข่าเลยปลายเท้ามากเกินไป', 'หลังต้องตรงตลอดเวลา']
  },
  {
    id: 'ex_str_lunge',
    code: 'B2',
    category: 'STRENGTH TRAINING',
    categoryTh: 'เสริมสร้างความแข็งแรง',
    title: 'Lunge (ลันจ์)',
    titleEn: 'Lunge',
    subtitle: 'ก้าวขาไปข้างหน้า งอเข่า หลังตรง ดันตัวกลับ',
    description: 'พัฒนาความสมดุลของกล้ามเนื้อขาซ้ายและขวา เพิ่มความยืดหยุ่นของข้อสะโพก',
    targetReps: 10,
    targetSets: 3,
    targetDurationMinutes: 5,
    targetUnit: 'ครั้ง/ข้าง',
    difficultyLevel: 'ปานกลาง',
    videoUrl: 'https://www.youtube.com/embed/Pyi350fPC5c',
    steps: [
      'ยืนตัวตรง ก้าวขาข้างหนึ่งไปข้างหน้ากว้างพอเหมาะ',
      'ย่อตัวลงตรงๆ จนเข่าทั้งสองข้างทำมุมประมาณ 90 องศา',
      'รักษาลำตัวตั้งตรง ไม่เอนตัวไปข้างหน้า',
      'ออกแรงดันตัวกลับขึ้นตำแหน่งเดิม แล้วสลับทำอีกข้าง'
    ],
    precautions: ['เข่าหน้าไม่เลยปลายเท้า', 'เข่าหลังไม่กระแทกพื้น']
  },
  {
    id: 'ex_str_step_up',
    code: 'B3',
    category: 'STRENGTH TRAINING',
    categoryTh: 'เสริมสร้างความแข็งแรง',
    title: 'Step-up (สเต็ปอัพ)',
    titleEn: 'Step-up',
    subtitle: 'ก้าวขึ้น-ลงกล่อง/ชั้นบันได สลับข้าง',
    description: 'สร้างแรงดันขาและข้อสะโพก เพิ่มความแข็งแรงของกล้ามเนื้อก้นและต้นขาด้านหลัง',
    targetReps: 12,
    targetSets: 3,
    targetDurationMinutes: 5,
    targetUnit: 'ครั้ง/ข้าง',
    difficultyLevel: 'ง่าย',
    videoUrl: 'https://www.youtube.com/embed/Pyi350fPC5c',
    steps: [
      'ยืนหน้ากล่องหรือม้านั่งที่มั่นคงสูงระดับเข่าหรือต่ำกว่า',
      'ก้าวเท้าข้างหนึ่งขึ้นบนกล่อง ออกแรงดันส้นเท้าเหยียดขาขึ้นยืนตรง',
      'ก้าวเท้าอีกข้างตามขึ้นมาแตะกล่องเบาๆ',
      'ค่อยๆ ก้าวลงทีละข้างอย่างควบคุม แล้วสลับขาเริ่มต้น'
    ],
    precautions: ['ใช้ม้านั่ง/กล่องที่มั่นคงไม่ลื่น', 'เหยียบเต็มเท้า']
  },
  {
    id: 'ex_str_calf_raise',
    code: 'B4',
    category: 'STRENGTH TRAINING',
    categoryTh: 'เสริมสร้างความแข็งแรง',
    title: 'Calf Raise (ยกส้นเท้า)',
    titleEn: 'Calf Raise',
    subtitle: 'ยืนเขย่งส้นเท้า ช้าๆ ควบคุมจังหวะ',
    description: 'เพิ่มความแข็งแรงของน่องและเอ็นร้อยหวาย ช่วยเพิ่มแรงสปริงตัวในการกระโดด',
    targetReps: 15,
    targetSets: 3,
    targetDurationMinutes: 5,
    targetUnit: 'ครั้ง/เซ็ต',
    difficultyLevel: 'ง่าย',
    videoUrl: 'https://www.youtube.com/embed/Pyi350fPC5c',
    steps: [
      'ยืนตรง เท้ากางเท่าระดับสะโพก สามารถเกาะผนังประคองตัวได้',
      'เขย่งส้นเท้าขึ้นสูงที่สุดเท่าที่ทำได้ ออกแรงกดปลายเท้า',
      'เกร็งค้างไว้ ณ จุดสูงสุด 1-2 วินาที',
      'ค่อยๆ ลดส้นเท้าลงสัมผัสพื้นช้าๆ อย่างควบคุม'
    ],
    precautions: ['ไม่ทิ้งตัวลงเร็วเกินไป', 'เน้นความช้าและเกร็งน่อง']
  },
  {
    id: 'ex_str_push_up',
    code: 'B5',
    category: 'STRENGTH TRAINING',
    categoryTh: 'เสริมสร้างความแข็งแรง',
    title: 'Push-up (วิดพื้น)',
    titleEn: 'Push-up',
    subtitle: 'วางมือกว้างเท่าไหล่ ลำตัวตรง ไม่แอ่นหลัง',
    description: 'เสริมสร้างกล้ามเนื้ออก ไหล่ แขน และแกนกลางลำตัวให้แข็งแรง',
    targetReps: 10,
    targetSets: 3,
    targetDurationMinutes: 5,
    targetUnit: 'ครั้ง/เซ็ต',
    difficultyLevel: 'ยาก',
    videoUrl: 'https://www.youtube.com/embed/Pyi350fPC5c',
    steps: [
      'วางมือบนพื้นกว้างกว่าไหล่เล็กน้อย นิ้วมือชี้ไปข้างหน้า',
      'เกร็งหน้าท้องและก้น ให้ลำตัวตรงเป็นเส้นเดียวตั้งแต่หัวจรดส้นเท้า',
      'ย่อข้อศอกลงจนหน้าอกเกือบแตะพื้น ศอกทำมุม 45 องศากับลำตัว',
      'ออกแรงดันตัวกลับขึ้นสู่ท่าเริ่มต้น ไม่ปล่อยให้หลังแอ่น'
    ],
    precautions: ['หากยากไปสามารถใช้วิธีวางเข่าบนพื้น (Knee Push-up)', 'ห้ามแอ่นหลัง']
  },
  {
    id: 'ex_str_hip_bridge',
    code: 'B6',
    category: 'STRENGTH TRAINING',
    categoryTh: 'เสริมสร้างความแข็งแรง',
    title: 'Hip Bridge (ฮิปบริดจ์)',
    titleEn: 'Hip Bridge',
    subtitle: 'นอนหงาย ชันเข่า ยกสะโพกขึ้น เกร็งก้น',
    description: 'ฝึกกล้ามเนื้อสะโพก ก้น และต้นขาด้านหลัง ปรับแนวเชิงกรานให้สมดุล',
    targetReps: 15,
    targetSets: 3,
    targetDurationMinutes: 5,
    targetUnit: 'ครั้ง/เซ็ต',
    difficultyLevel: 'ง่าย',
    videoUrl: 'https://www.youtube.com/embed/Pyi350fPC5c',
    steps: [
      'นอนหงาย ชันเข่าสองข้างขึ้น เท้าวางราบกับพื้นกว้างเท่าสะโพก',
      'วางแขนข้างลำตัว กดส้นเท้าลงพื้น แล้วดันสะโพกขึ้นสูง',
      'เกร็งก้นและหน้าท้องที่จุดสูงสุด ให้ลำตัวเป็นเส้นตรงจากเข่าถึงไหล่',
      'ค้างไว้ 2-3 วินาที แล้วค่อยๆ ลดสะโพกลง'
    ],
    precautions: ['ไม่แอ่นหลังล่างเกินไป', 'เน้นใช้แรงจากก้นและส้นเท้า']
  },

  // ==================== CATEGORY C: CORE EXERCISES ====================
  {
    id: 'ex_core_plank',
    code: 'C1',
    category: 'CORE EXERCISES',
    categoryTh: 'กล้ามเนื้อแกนกลางลำตัว',
    title: 'Plank (แพลงก์)',
    titleEn: 'Plank',
    subtitle: 'ค้าง 10-30 วินาที x 2-3 รอบ',
    description: 'สร้างความเกร็งตัวสมดุลของแกนกลางลำตัว (Core Stability) ช่วยพยุงแนวกระดูกสันหลังให้ยืดตรง',
    targetReps: 1,
    targetSets: 3,
    targetDurationMinutes: 3,
    targetUnit: '30 วินาที/รอบ',
    difficultyLevel: 'ปานกลาง',
    videoUrl: 'https://www.youtube.com/embed/Pyi350fPC5c',
    steps: [
      'นอนคว่ำ วางข้อศอกใต้ไหล่ แขนท่อนล่างวางขนานกันบนพื้น',
      'ยกลำตัวขึ้น ตั้งปลายเท้า เกร็งหน้าท้อง ต้นขา และก้น',
      'รักษาสายตามองลงพื้น ศีรษะ คอ หลัง และสะโพกเป็นเส้นตรง',
      'ค้างไว้ 10-30 วินาที หายใจเข้า-ออกสม่ำเสมอ'
    ],
    precautions: ['ห้ามยกสะโพกสูงหรือปล่อยหลังตก', 'ไม่กลั้นหายใจ']
  },
  {
    id: 'ex_core_side_plank',
    code: 'C2',
    category: 'CORE EXERCISES',
    categoryTh: 'กล้ามเนื้อแกนกลางลำตัว',
    title: 'Side Plank (แพลงก์ด้านข้าง)',
    titleEn: 'Side Plank',
    subtitle: 'ค้างข้างละ 10-20 วินาที x 2 รอบ',
    description: 'เสริมสร้างกล้ามเนื้อเอวและแกนกลางลำตัวด้านข้าง ช่วยป้องกันอาการกระดูกสันหลังคดหรือเอียง',
    targetReps: 1,
    targetSets: 2,
    targetDurationMinutes: 3,
    targetUnit: '20 วินาที/ข้าง',
    difficultyLevel: 'ยาก',
    videoUrl: 'https://www.youtube.com/embed/Pyi350fPC5c',
    steps: [
      'นอนตะแคงข้าง วางข้อศอกตรงใต้ไหล่ ขาสองข้างซ้อนกันตรง',
      'เกร็งเอวและหน้าท้อง ดันสะโพกขึ้นจากพื้นจนลำตัวตรง',
      'ยกแขนอีกข้างชี้ขึ้นฟ้าหรือวางแนบลำตัว',
      'ค้างไว้ 10-20 วินาที แล้วสลับทำอีกข้าง'
    ],
    precautions: ['รักษาแนวสะโพกให้ลอยตรงไม่ตก', 'ไม่เกร็งไหล่มากเกินไป']
  },
  {
    id: 'ex_core_bird_dog',
    code: 'C3',
    category: 'CORE EXERCISES',
    categoryTh: 'กล้ามเนื้อแกนกลางลำตัว',
    title: 'Bird Dog (เบิร์ดด็อก)',
    titleEn: 'Bird Dog',
    subtitle: '8-12 ครั้ง/ข้าง (ค้าง 2 วินาที)',
    description: 'ฝึกการประสานงานของแกนกลางลำตัว หลัง และก้น โดยไม่สูญเสียการทรงตัว',
    targetReps: 10,
    targetSets: 3,
    targetDurationMinutes: 5,
    targetUnit: 'ครั้ง/ข้าง',
    difficultyLevel: 'ปานกลาง',
    videoUrl: 'https://www.youtube.com/embed/Pyi350fPC5c',
    steps: [
      'ตั้งท่าคุกเข่าชันมือ (Tabletop Position) มือใต้ไหล่ เข่าใต้สะโพก',
      'เกร็งหน้าท้อง ค่อยๆ ยืดแขนซ้ายไปข้างหน้า และเหยียดขาขวาไปข้างหลังขนานพื้น',
      'ค้างไว้ 2 วินาที รักษาสะโพกและไหล่ให้อยู่ในแนวราบไม่เอียง',
      'ดึงกลับตำแหน่งเดิมอย่างช้าๆ แล้วสลับทำสลับข้าง'
    ],
    precautions: ['ไม่หมุนหรือเอียงสะโพก', 'เหยียดขนานพื้น ไม่ยกสูงเกินไป']
  },
  {
    id: 'ex_core_dead_bug',
    code: 'C4',
    category: 'CORE EXERCISES',
    categoryTh: 'กล้ามเนื้อแกนกลางลำตัว',
    title: 'Dead Bug (เดดบัก)',
    titleEn: 'Dead Bug',
    subtitle: '8-12 ครั้ง/ข้าง',
    description: 'ฝึกการควบคุมความมั่นคงของกระดูกสันหลังล่าง ขณะขยับแขนและขา',
    targetReps: 10,
    targetSets: 3,
    targetDurationMinutes: 5,
    targetUnit: 'ครั้ง/ข้าง',
    difficultyLevel: 'ปานกลาง',
    videoUrl: 'https://www.youtube.com/embed/Pyi350fPC5c',
    steps: [
      'นอนหงาย ชูสองแขนขึ้นฟ้า ชันเข่าสองข้างทำมุม 90 องศาลอยจากพื้น',
      'กดหลังล่างให้แนบชิดกับพื้นตลอดเวลา',
      'ค่อยๆ เหยียดแขนซ้ายไปหลังศีรษะ พร้อมเหยียดขาขวาไปข้างหน้าเกือบแตะพื้น',
      'ดึงกลับสู่ท่าเริ่มต้น แล้วทำสลับข้างตรงข้าม'
    ],
    precautions: ['หลังล่างต้องกดแนบติดพื้นตลอดเวลา', 'หากหลังล่างลอยให้เหยียดขาเท่าที่ทำได้']
  },
  {
    id: 'ex_core_glute_bridge',
    code: 'C5',
    category: 'CORE EXERCISES',
    categoryTh: 'กล้ามเนื้อแกนกลางลำตัว',
    title: 'Glute Bridge (กลูทบริดจ์)',
    titleEn: 'Glute Bridge',
    subtitle: '10-15 ครั้ง',
    description: 'เน้นการกระตุ้นกล้ามเนื้อก้นใหญ่ (Gluteus Maximus) และการพยุงกระดูกเชิงกราน',
    targetReps: 12,
    targetSets: 3,
    targetDurationMinutes: 5,
    targetUnit: 'ครั้ง/เซ็ต',
    difficultyLevel: 'ง่าย',
    videoUrl: 'https://www.youtube.com/embed/Pyi350fPC5c',
    steps: [
      'นอนหงาย ชันเข่าสองข้าง เท้าวางราบกว้างเท่าสะโพก',
      'กดส้นเท้าลงพื้น แล้วดันสะโพกขึ้นจนลำตัวตรง',
      'เกร็งก้นแน่นที่จุดสูงสุดค้างไว้ 1-2 วินาที',
      'ลดสะโพกลงช้าๆ โดยไม่ทิ้งตัวลงแรง'
    ],
    precautions: ['เกร็งก้นเป็นหลัก ไม่ใช้หลังล่างแอ่น']
  },
  {
    id: 'ex_core_bear_crawl',
    code: 'C6',
    category: 'CORE EXERCISES',
    categoryTh: 'กล้ามเนื้อแกนกลางลำตัว',
    title: 'Bear Crawl (แบร์ครอว์ล)',
    titleEn: 'Bear Crawl',
    subtitle: 'เคลื่อนที่ไปข้างหน้า-หลัง 20-30 วินาที x 2 รอบ',
    description: 'การคลานแบบหมีกระตุ้นการทำงานของกล้ามเนื้อทั่วร่างกาย และสร้างแกนกลางลำตัวที่แข็งแกร่ง',
    targetReps: 1,
    targetSets: 2,
    targetDurationMinutes: 5,
    targetUnit: '30 วินาที/รอบ',
    difficultyLevel: 'ยาก',
    videoUrl: 'https://www.youtube.com/embed/Pyi350fPC5c',
    steps: [
      'ตั้งท่าชันมือและเข่า จากนั้นยกลอยเข่าขึ้นจากพื้นประมาณ 1-2 นิ้ว',
      'เคลื่อนที่ไปข้างหน้าด้วยการขยับมือซ้ายพร้อมเท้าขวา และมือขวาพร้อมเท้าซ้าย',
      'รักษาหลังราบขนานกับพื้น ไม่ยกก้นโด่งหรือปล่อยสะโพกตก',
      'คลานไปข้างหน้า 10 ก้าว แล้วคลานถอยหลังกลับ'
    ],
    precautions: ['รักษาเข่าให้อยู่ใกล้พื้นเสมอ', 'เกร็งหน้าท้องไม่ก้มคอ']
  }
];

// Helper to convert GrowthExerciseGuideItem to standard Exercise type
export function mapGrowthGuideToExercise(item: GrowthExerciseGuideItem): Exercise {
  return {
    id: item.id,
    title: item.title,
    subTitle: item.subtitle,
    category: item.category === 'JUMP & IMPACT' ? 'movement' : item.category === 'STRENGTH TRAINING' ? 'strength' : 'core',
    purpose: item.description,
    description: item.subtitle,
    difficultyLevel: item.difficultyLevel,
    durationMinutes: item.targetDurationMinutes,
    targetReps: item.targetReps,
    steps: item.steps,
    videoUrl: item.videoUrl,
    imageUrl: item.category.toLowerCase().replace(/\s+/g, '_'),
    relatedAnatomy: ['ขากรรไกร', 'ทางเดินหายใจ'] as AnatomyPart[],
    isActive: true,
    sourceStatus: 'VERIFIED'
  };
}
