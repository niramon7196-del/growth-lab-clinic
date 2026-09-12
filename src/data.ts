import {
  Patient,
  SessionLog,
  Exercise,
  Appointment,
  SystemNotification,
  ClinicalSourceDocument
} from './types';
import { GROWTH_EXERCISES_16, mapGrowthGuideToExercise } from './data/growthExercisesData';
export const APP_ENV: string = 'development';
export const DEFAULT_SETTINGS: any = {
  doctorName: 'ทันตแพทย์หญิง นภาพร วรรณษา',
  doctorTitlePosition: 'ทันตแพทย์ผู้ให้การรักษาและเจ้าของคลินิก',
  clinicName: 'คลินิกทันตกรรมภาสุข (Growth Lab)',
  clinicNameEn: 'Pasuk Dental Clinic (Growth Lab)',
  phone: '081-8517672',
  email: '12pasuk.system@gmail.com',
  address: '366/4 ม.1 ตำบลดีลัง อำเภอพัฒนานิคม จังหวัดลพบุรี 15220',
  doctorLicenseNo: 'ท.8482',
  doctorSpecialty: 'ทันตกรรมจัดฟันและการปรับโครงสร้างใบหน้า (Myofunctional Orthodontics)',
  appsScriptWebhookUrl: 'https://script.google.com/macros/s/AKfycbyGAHfEkrgkIM5zRpK91VVfMRkWKE4m_nn66DJpavEm-ltTUoKEcaSO1_tUbSR9pqH9/exec',
  defaultBreathingReps: 10,
  defaultVentilationReps: 10,
  defaultTongueReps: 10,
  defaultMuscleReps: 10
};
export const BEFORE_AFTER_SOURCE_STATUS: string = 'UNVERIFIED';
export const GNS_SOURCE_STATUS: string = 'UNVERIFIED';
export const SLEEP_SOURCE_STATUS: string = 'UNVERIFIED';

export interface FacialAnatomyInfo {
  id: string;
  nameTh: string;
  nameEn: string;
  part: string;
  description: string;
  omtFunction: string;
  iconBg: string;
  relatedExercises: string[];
}


export const SEED_EXERCISES: Exercise[] = [
  {
    "id": "posture_wall_stand",
    "code": "EX-01",
    "title": "1. ท่ายืนปรับแนวกระดูกแนบกำแพง (Wall Stand)",
    "subTitle": "แก้คอยื่น เปิดช่องทางเดินหายใจ (3 นาที)",
    "category": "posture",
    "purpose": "จัดแนวกระดูกสันหลังให้ตรง แก้คอยื่น (Forward Head) และเปิดทางเดินหายใจส่วนบน 100%",
    "description": "ยืนพิงผนัง ศีรษะ หลัง และส้นเท้าแนบตรง หายใจเข้า-ออกช้าๆ ลึกๆ ผ่านทางจมูก จัดแนวกระดูกสันหลังให้สง่างาม",
    "difficultyLevel": "ง่าย",
    "durationMinutes": 3,
    "targetReps": 1,
    "reps": "3 นาที",
    "steps": [
      "ยืนส้นเท้าชิดหรือห่างกำแพงเล็กน้อย ลำตัวและแนวกระดูกสันหลังตั้งตรง",
      "ให้แผ่นหลัง หัวไหล่ และหลังศีรษะแนบชิดติดกำแพง",
      "เก็บคางเข้าหาลำคอเล็กน้อย (Chin Tuck) เพื่อจัดแนวคอและเปิดทางเดินหายใจ",
      "ผ่อนคลายหัวไหล่ หายใจเข้า-ออกช้าๆ ลึกๆ ผ่านทางจมูก ต่อเนื่อง 3 นาที"
    ],
    "imageUrl": "posture",
    "relatedAnatomy": [
      "ทางเดินหายใจ",
      "โครงสร้างใบหน้า"
    ],
    "isActive": true,
    "sourceStatus": "VERIFIED"
  },
  {
    "id": "omt_tongue_spot",
    "code": "EX-02",
    "title": "2. ท่าดูดลิ้นแตะเพดาน (The Spot & Cave)",
    "subTitle": "เสริมความแข็งแรงโคนลิ้น ป้องกันลิ้นตกอุดหลอดลมตอนนอน (20 ครั้ง)",
    "category": "tongue",
    "purpose": "เสริมความแข็งแรงโคนลิ้น ป้องกันลิ้นตกอุดหลอดลมตอนนอน และขยายกระดูกเพดานปากบน",
    "description": "แตะปลายลิ้นที่เพดานปากจุด Spot และแนบโคนลิ้นดูดขึ้นติดเพดานปาก (Cave) ฝึกกล้ามเนื้อลิ้นขยายเพดานปาก",
    "difficultyLevel": "ปานกลาง",
    "durationMinutes": 5,
    "targetReps": 20,
    "reps": "20 ครั้ง",
    "steps": [
      "หาตำแหน่งจุด Spot (บริเวณรอยย่นบนเพดานปากหลังฟันหน้าบน)",
      "วางปลายลิ้นแตะจุด Spot แนบสนิท โดยไม่ดันฟันหน้า",
      "ดูดแผ่นลิ้นและโคนลิ้นแนบติดเพดานปากให้เกิดสุญญากาศ (Cave/Suction)",
      "ค้างไว้ 3-5 วินาที แล้วผ่อน ทำซ้ำจนครบ 20 ครั้ง"
    ],
    "imageUrl": "tongue",
    "relatedAnatomy": [
      "ลิ้น",
      "ขากรรไกร"
    ],
    "isActive": true,
    "sourceStatus": "VERIFIED"
  },
  {
    "id": "omt_lip_seal",
    "code": "EX-03",
    "title": "3. ท่าเม้มริมฝีปากแน่น (Lip Seal Workout)",
    "subTitle": "ฝึกปิดปากสนิท หยุดพฤติกรรมนอนอ้าปาก (3 นาที)",
    "category": "lips",
    "purpose": "ฝึกปิดริมฝีปากสนิทตลอดเวลา เพิ่มความแข็งแรงกล้ามเนื้อ Orbicularis Oris หยุดพฤติกรรมนอนอ้าปาก",
    "description": "เม้มริมฝีปากบนและล่างให้สนิทตลอดเวลา ฝึกการหายใจผ่านทางจมูก 100% เสริมกล้ามเนื้อรอบริมฝีปาก",
    "difficultyLevel": "ง่าย",
    "durationMinutes": 3,
    "targetReps": 1,
    "reps": "3 นาที",
    "steps": [
      "นั่งตัวตรง ผ่อนคลายกล้ามเนื้อใบหน้าและขากรรไกร",
      "ปิดริมฝีปากบนและล่างให้แนบสนิทโดยไม่เกร็งคาง",
      "หายใจเข้า-ออกลึกๆ ช้าๆ ผ่านทางจมูก 100%",
      "ฝึกปิดปากต่อเนื่องเป็นเวลา 3 นาที"
    ],
    "imageUrl": "muscle",
    "relatedAnatomy": [
      "ริมฝีปาก",
      "ทางเดินหายใจ"
    ],
    "isActive": true,
    "sourceStatus": "VERIFIED"
  },
  {
    "id": "posture_bone_loading_jump",
    "code": "EX-04",
    "title": "4. ท่ากระโดดเบาๆ ปลุกกระดูก (Bone Loading Jump)",
    "subTitle": "กระตุ้น Growth Plate ยามเช้า (30 ครั้ง)",
    "category": "movement",
    "purpose": "สร้างแรงกระแทกแนวดิ่งที่เหมาะสมเพื่อกระตุ้นแผ่นการเจริญเติบโต (Growth Plate) ของกระดูก",
    "description": "กระโดดแนวดิ่งเบาๆ ลงน้ำหนักที่ปลายเท้าและส้นเท้า ย่อเข่าซับแรง เพื่อกระตุ้นแผ่นการเจริญเติบโตของกระดูก (Growth Plate)",
    "difficultyLevel": "ง่าย",
    "durationMinutes": 3,
    "targetReps": 30,
    "reps": "30 ครั้ง",
    "steps": [
      "ยืนกางขาความกว้างเท่าหัวไหล่ แขนปล่อยสบายข้างลำตัว",
      "ย่อเข่าเล็กน้อย แล้วกระโดดขึ้นตรงๆ พร้อมแกว่งแขนช่วยส่งแรง",
      "ลงน้ำหนักด้วยปลายเท้าแล้วย่อเข่าซับแรงกระแทกอย่างนุ่มนวล (Soft Landing)",
      "ทำเป็นจังหวะต่อเนื่อง 30 ครั้ง เพื่อกระตุ้นแผ่นกระดูก"
    ],
    "imageUrl": "muscle",
    "relatedAnatomy": [
      "โครงสร้างใบหน้า",
      "กระดูกและข้อต่อ"
    ],
    "isActive": true,
    "sourceStatus": "VERIFIED"
  }
];

export const generate31DaySleepLogs = (patientId: string): any[] => {
  return [];
};

export const SEED_PATIENTS: Patient[] = [];

export const generateSeedLogs = (): SessionLog[] => {
  return [];
};

export const SEED_APPOINTMENTS: Appointment[] = [
  {
    id: 'appt_seed_primary_001',
    patientId: 'PAT-001',
    patientName: 'น้องพร้อม รัตนากุล',
    hn: 'HN-001',
    date: '2026-09-18',
    time: '10:30',
    type: 'ตรวจติดตาม OMT & ประเมิน EF Trainer',
    dentistName: 'ทพญ. นภาพร วรรณษา',
    status: 'pending',
    notes: 'ตรวจเช็กความก้าวหน้ากล้ามเนื้อปากและลิ้น + รบกวนนำอุปกรณ์ EF Trainer มาด้วยค่ะ'
  },
  {
    id: 'appt_seed_secondary_002',
    patientId: 'PAT-001',
    patientName: 'น้องพร้อม รัตนากุล',
    hn: 'HN-001',
    date: '2026-09-26',
    time: '14:00',
    type: 'ประเมินการฝึกหายใจทางจมูก & ท่าทางการกลืน',
    dentistName: 'ทพญ. นภาพร วรรณษา',
    status: 'pending',
    notes: 'ตรวจเช็กการกลืนที่ถูกต้องและการวางตำแหน่งลิ้นขณะพัก (Resting Tongue Posture)'
  },
  {
    id: 'appt_seed_completed_003',
    patientId: 'PAT-001',
    patientName: 'น้องพร้อม รัตนากุล',
    hn: 'HN-001',
    date: '2026-09-04',
    time: '11:00',
    type: 'บันทึกภาพถ่าย Before/After & ตรวจสแกนช่องปาก',
    dentistName: 'ทพญ. นภาพร วรรณษา',
    status: 'completed',
    notes: 'คนไข้มาตรวจตามนัด การหายใจทางจมูกและการสบฟันดีขึ้นมาก ให้ฝึกท่าบริหาร OMT ต่อเนื่องทุกวัน'
  }
];

export const SEED_NOTIFICATIONS: SystemNotification[] = [];

export const INITIAL_CLINICAL_SOURCE_DOCUMENTS: ClinicalSourceDocument[] = [
  {
    id: 'SRC-DOC-GNS-001',
    code: 'GNS-CS-01',
    title: 'Growth Nutrition Score (GNS) & Growth Lab Composite Score',
    category: 'GNS_COMPOSITE',
    version: 'v1.0-ORIGINAL',
    addedDate: '14 สิงหาคม 2569',
    status: 'PENDING VERIFICATION',
    description: 'ระบบให้คะแนนโภชนาการเพื่อการเจริญเติบโต "กินวันนี้ เพื่อการเติบโตที่ดีที่สุดในอนาคต" คะแนนเต็ม 100 คะแนน/สัปดาห์ และ Growth Lab Composite Score (100 คะแนน)',
    fileName: 'B2BAFEBE-C00E-439D-8EE0-88ECCE4CD6B8.jpeg',
    sections: [
      {
        sectionTitle: '1. ให้คะแนนทุกวัน (Daily Scoring - เต็ม 20 คะแนน/หมวด)',
        contentLines: [
          '• โปรตีน (20 คะแนน): ครบ 3 มื้อ = 3 คะแนน, ครบ 2 มื้อ = 2 คะแนน, ครบ 1 มื้อ = 1 คะแนน, ไม่ครบ = 0 คะแนน (ตัวอย่าง 1 ส่วน: ไข่ 1 ฟอง, ปลา/ไก่ 40-50 กรัม, เต้าหู้ 80 กรัม)',
          '• แคลเซียมและวิตามินดี (20 คะแนน): ดื่มนมตามแผน = 2 คะแนน, แคลเซียมจากอาหารอย่างน้อย 1 มื้อ = 1 คะแนน (แหล่งแคลเซียมดี: นม/โยเกิร์ต, ปลาเล็กปลาน้อย, เต้าหู้แข็ง, งาดำ, ผักใบเขียว)',
          '• ผักและผลไม้ (20 คะแนน): ผัก ≥ 2 มื้อ = 2 คะแนน, ผลไม้ ≥ 2 ส่วน = 1 คะแนน (1 ส่วนผลไม้ ≈ 1 กำมือ หรือ 80-100 กรัม)',
          '• คุณภาพอาหาร (20 คะแนน): เริ่มต้น 3 คะแนน/วัน หักคะแนนเมื่อมีพฤติกรรม: น้ำอัดลม -1, ชานมหวาน -1, ขนมหวานมาก -1, อาหารทอดหลายมื้อ -1, อาหารแปรรูป -1 (คะแนนประจำวัน 0-3 คะแนน)',
          '• น้ำดื่มและความสม่ำเสมอ (20 คะแนน): ดื่มน้ำเพียงพอ = 2 คะแนน, กินอาหารตรงเวลา = 1 คะแนน (ปริมาณน้ำที่แนะนำ: 6-8 ปี: 1.0-1.2L, 9-11 ปี: 1.2-1.6L, 12-15 ปี: 1.5-2.0L)'
        ]
      },
      {
        sectionTitle: '2. การคิดคะแนนรายสัปดาห์และการแปลผลคะแนน GNS',
        contentLines: [
          '• การคิดคะแนนรายวัน: รวมคะแนนทั้ง 5 หมวด (เต็ม 15 คะแนน/วัน) ทำครบ 7 วัน = คะแนนรวมสูงสุด 105 คะแนน',
          '• การคิดคะแนนรายสัปดาห์: (คะแนนรวมที่ได้ ÷ 105) × 100 = คะแนน GNS ประจำสัปดาห์',
          '• การแปลผลคะแนนรายสัปดาห์: 90-100 = Excellent Growth Nutrition | 80-89 = Very Good | 70-79 = Good | 60-69 = Needs Improvement | <60 = High Priority'
        ]
      },
      {
        sectionTitle: '3. Eating Behavior Score (พฤติกรรมการกิน เพิ่มเติม 5 คะแนน/วัน)',
        contentLines: [
          '• เคี้ยวอาหารสองข้าง = 1 คะแนน',
          '• เคี้ยวช้าและละเอียด = 1 คะแนน',
          '• นั่งกินโดยไม่ดูหน้าจอ = 1 คะแนน',
          '• ดื่มน้ำเปล่าแทนน้ำหวาน = 1 คะแนน',
          '• กินพร้อมครอบครัวอย่างน้อย 1 มื้อ = 1 คะแนน'
        ]
      },
      {
        sectionTitle: '4. GROWTH LAB COMPOSITE SCORE (100 คะแนน) - รวม 5 เสาหลัก',
        contentLines: [
          '• 1. Nutrition = 20%',
          '• 2. Sleep = 20%',
          '• 3. Exercise = 20%',
          '• 4. Orofacial Function (EF / การเคี้ยว / การหายใจ) = 20%',
          '• 5. Family Participation = 20%',
          '• ติดตามและบันทึกทุกสัปดาห์: ส่วนสูง / น้ำหนัก / BMI, คุณภาพการนอน, พฤติกรรมการเคี้ยว / การหายใจ, การออกกำลังกาย / การได้รับแสงแดด',
          '• หมายเหตุ: คะแนนเป็นเพียงเครื่องมือประเมินพฤติกรรม ไม่ใช่การวินิจฉัยโรค หากมีภาวะเจ็บป่วยหรือข้อจำกัดด้านอาหาร ควรปรึกษาแพทย์/นักโภชนาการ'
        ]
      }
    ]
  },
  {
    id: 'SRC-DOC-SLEEP-FLOWCHART-001',
    code: 'SLEEP-CS-01',
    title: 'Growth Lab Sleep Quality Score (1–5) - ระบบประเมินคุณภาพการนอน',
    category: 'SLEEP_SYSTEM',
    version: 'v1.0-ORIGINAL',
    addedDate: '14 สิงหาคม 2569',
    status: 'PENDING VERIFICATION',
    description: 'ระบบประเมินคุณภาพการนอน 6 ขั้นตอน: เก็บข้อมูล, ประเมิน 5 ด้าน (0-2 คะแนน), ตรวจสอบ RED FLAG, คำนวณคะแนนรวม 0-10, แปลงคะแนน 1-5 และแนวทางดำเนินการ',
    fileName: '68EF66A7-9671-4F56-AFEF-7ABCC8491375.png',
    sections: [
      {
        sectionTitle: '1. ขั้นตอนการประเมิน 6 ขั้นตอน',
        contentLines: [
          '• Step 1. เก็บข้อมูล (ในช่วง 7 วันที่ผ่านมา): ผู้ปกครองสังเกต/ตอบแบบประเมิน, บันทึกเวลานอน-ตื่น, สังเกตลักษณะการนอน',
          '• Step 2. ประเมิน 5 ด้าน (ให้คะแนนแต่ละด้าน 0-2 คะแนน):',
          '   - 1. ระยะเวลานอน (ชั่วโมง/วัน): 2 คะแนน (ได้ตามช่วงเวลาที่เหมาะสมกับวัย), 1 คะแนน (ขาดเล็กน้อย <1 ชม.), 0 คะแนน (ขาดชัดเจน ≥1 ชม.)',
          '   - 2. หลับต่อเนื่อง (ตื่นกลางดึก): 2 คะแนน (แทบไม่ตื่น 0-1 ครั้ง), 1 คะแนน (ตื่นบางครั้ง 2-3 ครั้ง), 0 คะแนน (ตื่นบ่อย ≥4 ครั้ง)',
          '   - 3. การหายใจขณะหลับ (กรน/อ้าปากหายใจ): 2 คะแนน (ปิดปากหายใจ ไม่กรน), 1 คะแนน (กรนหรืออ้าปากหายใจบางครั้ง), 0 คะแนน (กรนหรืออ้าปากหายใจบ่อย หรือสงสัยหยุดหายใจ)',
          '   - 4. การหลับ (ใช้เวลาหลับ): 2 คะแนน (หลับง่าย ≤20 นาที), 1 คะแนน (ใช้เวลา 20-30 นาที), 0 คะแนน (ใช้เวลา >30 นาที เป็นประจำ)',
          '   - 5. ตอนเช้า/กลางวัน (ความสดชื่น): 2 คะแนน (ตื่นสดชื่น ไม่ง่วง ไม่งอแง), 1 คะแนน (ง่วง/เพลียบางวัน สมาธลดลงเล็กน้อย), 0 คะแนน (ง่วงมาก ปลุกยาก สมาธิ/อารมณ์/พฤติกรรมได้รับผลกระทบ)'
        ]
      },
      {
        sectionTitle: '2. ตรวจสอบ RED FLAG (ติดธงแดง)',
        contentLines: [
          '• เงื่อนไข RED FLAG (ใด ๆ ต่อไปนี้ = ติดธงแดง): กรนดังเป็นประจำ, อ้าปากหายใจขณะหลับเป็นประจำ, สังเกตว่าหยุดหายใจ/หายใจเฮือก, เหงื่อออกมากผิดปกติ, นอนกระสับกระส่ายมาก, ง่วงมากผิดปกติในตอนกลางวัน/หลับในโรงเรียน',
          '• การส่งประเมินเพิ่มเติมกรณีติดธง RED FLAG: ENT / Sleep Specialist, ตรวจทางเดินหายใจ, ประเมินต่อมทอนซิล/อะดีนอยด์, พิจารณา Sleep Test'
        ]
      },
      {
        sectionTitle: '3. คำนวณคะแนนรวมและแปลงเป็นคะแนนคุณภาพการนอน 1-5',
        contentLines: [
          '• Step 4. รวมคะแนนทั้ง 5 ด้าน (0-10 คะแนน)',
          '• Step 5. แปลงคะแนนรวมเป็นคะแนนคุณภาพการนอน 1-5:',
          '   - 9-10 คะแนน = 5 ดีมาก (หลับดีและเพียงพอ คุณภาพการนอนดีเยี่ยม)',
          '   - 7-8 คะแนน = 4 ดี (มีปัญหาเล็กน้อย โดยรวมหลับได้ดี)',
          '   - 5-6 คะแนน = 3 ปานกลาง (เริ่มมีสิ่งรบกวน ควรปรับพฤติกรรม)',
          '   - 3-4 คะแนน = 2 ควรปรับปรุง (มีปัญหาชัดเจน ควรได้รับการดูแล)',
          '   - 0-2 คะแนน = 1 แย่ (การนอนผิดปกติชัดเจน ควรประเมินเพิ่มเติม)'
        ]
      },
      {
        sectionTitle: '4. การแปลผลและการดำเนินการตามระดับคะแนน',
        contentLines: [
          '• 5 ดีมาก: รักษานิสัยการนอนที่ดี, ติดตามต่อเนื่อง, เชื่อมโยงกับการเจริญเติบโตและพัฒนาการ',
          '• 4 ดี: คงพฤติกรรมการนอนที่ดี, ปรับเล็กน้อยหากมีปัญหา, ติดตามทุกครั้ง',
          '• 3 ปานกลาง: ปรับพฤติกรรมการนอน, ตรวจสอบสภาพแวดล้อม, ติดตาม 4-6 สัปดาห์',
          '• 2 ควรปรับปรุง: ปรับพฤติกรรมอย่างจริงจัง, ประเมินปัจจัยกีดขวาง (จอ/คาเฟอีน/ความเครียด/นม/โภชนาการ/ออกกำลังกาย), ติดตาม 2-4 สัปดาห์',
          '• 1 แย่: ส่งประเมินเพิ่มเติม, ตรวจ airway / ENT, พิจารณา Sleep Test, ติดตามใกล้ชิด',
          '• ช่วงเวลานอนที่แนะนำ (ต่อ 24 ชม. อ้างอิง AASM): 6-12 ปี -> 9-12 ชั่วโมง | 13-18 ปี -> 8-10 ชั่วโมง'
        ]
      }
    ]
  },
  {
    id: 'SRC-DOC-EXERCISE-FORM-001',
    code: 'EX-CS-01',
    title: 'Exercise & Movement Assessment Form - แบบประเมินการออกกำลังกายเพื่อสนับสนุนการเจริญเติบโต',
    category: 'EXERCISE_MOVEMENT',
    version: 'v1.0-ORIGINAL',
    addedDate: '14 สิงหาคม 2569',
    status: 'PENDING VERIFICATION',
    description: 'แบบประเมินและบันทึกกิจกรรมทางกาย, Jump / Bone-Loading, Strength Training, Landing Quality, Pain & Injury Screen, Growth Lab Exercise Score',
    fileName: 'BB86D78D-F159-4296-8669-34069C112881.png',
    sections: [
      {
        sectionTitle: '1. ข้อมูลการเจริญเติบโตและ Daily Physical Activity',
        contentLines: [
          '• Growth Stage (ระยะการเจริญเติบโต): Pre-growth, Growth Acceleration, Peak Growth, Growth Deceleration, Skeletal Maturity (Hand-Wrist Stage)',
          '• Height Velocity (HV) cm/year',
          '• Daily Physical Activity (ใน 7 วันที่ผ่านมา มีกิจกรรมหัวใจเต้นเร็ว/หายใจแรง ≥60 นาที/วัน กี่วัน?): 0-1 วัน, 2 วัน, 3-4 วัน, 5-6 วัน, 7 วัน'
        ]
      },
      {
        sectionTitle: '2. Jump / Bone-Loading & Strength Training',
        contentLines: [
          '• Jump / Bone-Loading Activity (เลือกได้มากกว่า 1 ข้อ): กระโดดเชือก, สองขาประโดด (Two-leg jump), กระโดดหน้า-หลัง, กระโดดข้าง (Side-to-side), Hop/Hopscotch, วิ่ง/กระโดด, Basketball, Volleyball, อื่นๆ',
          '• Strength Training (ใน 1 สัปดาห์ ทำกิจกรรมเสริมความแข็งแรงกี่วัน?): 0 วัน, 1 วัน, 2 วัน, ≥3 วัน (Squat, Lunge, Step-up, Calf raise, Push-up, Hip bridge, Core exercise, Resistance band)'
        ]
      },
      {
        sectionTitle: '3. Landing Quality, Pain Screen & Growth Lab Exercise Score',
        contentLines: [
          '• Landing Quality (การลงพื้น): ลงพื้นนุ่ม ไม่กระแทก | เข่าไม่พับเข้าด้านใน (Knee alignment ดี) | ทรงตัวและควบคุมลำตัวได้ดี | ไม่มีอาการปวดขณะกระโดดหรือเล่น | ต้องปรับปรุง (มีข้อสังเกต)',
          '• Pain & Injury Screen (7 วันที่ผ่านมา): ไม่มีอาการปวด, ปวดเข่า, ปวดใต้เข่า (Tibial tuberosity), ปวดส้นเท้า, ปวดข้อเท้า, ปวดหลัง, ปวดกล้ามเนื้อ (Pain score .../10)',
          '• Growth Lab Exercise Score (คะแนนพฤติกรรมการออกกำลังกาย 1-5 คะแนน):',
          '   - 1 = น้อยมาก (<2 วัน/สัปดาห์)',
          '   - 2 = น้อย ยังไม่สม่ำเสมอ',
          '   - 3 = ปานกลาง เริ่มดี แต่ยังไม่ครบองค์ประกอบ',
          '   - 4 = ดีมาก ได้ตามเป้าหมาย',
          '   - 5 = ดีเยี่ยม ทำสม่ำเสมอ ท่าทาง/เทคนิคดี ไม่มีอาการปวด'
        ]
      },
      {
        sectionTitle: '4. Weekly Summary, Monthly Follow-up & Exercise Guide',
        contentLines: [
          '• Weekly Summary: บันทึกประจำวัน จันทร์ - อาทิตย์ (Active ≥60 min, Jump/Impact, Strength Training, No Pain)',
          '• Monthly Follow-up: Height, Weight, Height Velocity, Exercise Score (1-5), Jump frequency, Strength frequency, Pain score (0-10), Adherence (<50%, 50-79%, ≥80%)',
          '• Exercise Guide (ตัวอย่างท่าออกกำลังกาย): A. Jump & Impact (Two-leg jump, Forward jump, Side-to-side jump, Hopscotch, Jump rope) | B. Strength (Squat, Lunge, Step-up, Calf raise, Push-up, Hip bridge) | C. Core (Plank, Side plank, Bird dog, Dead bug, Glute bridge, Bear crawl)'
        ]
      }
    ]
  },
  {
    id: 'SRC-DOC-SLEEP-MONTHLY-001',
    code: 'SLEEP-CS-02',
    title: 'แบบบันทึกรายเดือน Growth Lab Sleep Quality Score (1-5) และการใส่ EF',
    category: 'SLEEP_MONTHLY',
    version: 'v1.0-ORIGINAL',
    addedDate: '14 สิงหาคม 2569',
    status: 'PENDING VERIFICATION',
    description: 'ตารางบันทึกประจำวัน 1-31 วัน สรุปประจำเดือน สรุปคะแนนการนอน สัญญาณที่ควรแจ้งแพทย์ หมายเหตุการกรอก และคำแนะนำช่วงอายุ',
    fileName: '0BF78ADE-7A00-41EF-87B7-A28CA95046FE.png',
    sections: [
      {
        sectionTitle: '1. ข้อมูลผู้รับการดูแลและตารางบันทึกประจำวัน (วันที่ 1 ถึง 31)',
        contentLines: [
          '• ข้อมูลหลัก: ชื่อ-นามสกุล, ชื่อเล่น, เพศ, วัน/เดือน/ปีเกิด, เดือนที่บันทึก, น้ำหนัก, ส่วนสูง, Growth Stage, ผู้บันทึก',
          '• คอลัมน์บันทึกประจำวัน (1-31 วัน): เวลานอน (เข้านอน, หลับจริง, ตื่นนอน), ชั่วโมงนอน (ชม.), ตื่นกลางดึก (ครั้ง), กรน/อ้าปากหายใจ (0=ไม่เป็น, 1=เป็นบางครั้ง, 2=เป็นบ่อย), สดชื่นตอนเช้า (😃, 😐, 🙁), ใส่ EF (✓/✗), EF (ชั่วโมง), ถอดกลางดึก/เหตุผล, คะแนนการนอน 1-5, หมายเหตุ'
        ]
      },
      {
        sectionTitle: '2. สรุปประจำเดือนและสรุปคะแนนการนอน',
        contentLines: [
          '• ตัวชี้วัดประจำเดือน: ชั่วโมงนอนเฉลี่ย (ชม./คืน), จำนวนวันที่ใส่ EF (/31 วัน), เวลาใส่ EF เฉลี่ย (ชม./คืน), คะแนนการนอนเฉลี่ย (/5), ตื่นกลางดึกเฉลี่ย (ครั้ง/คืน), ความสม่ำเสมอในการใส่ EF (<50%, 50-79%, ≥80%)',
          '• สรุปคะแนนการนอน (จำนวนวันในแต่ละระดับ): 5 ดีมาก (จำนวนวัน ...), 4 ดี (จำนวนวัน ...), 3 ปานกลาง (จำนวนวัน ...), 2 ควรปรับปรุง (จำนวนวัน ...), 1 แย่ (จำนวนวัน ...)',
          '• แนวโน้มเดือนนี้ (เทียบกับเดือนก่อน): ดีขึ้น / คงที่ / แย่ลง | สิ่งที่ปรับปรุงแล้วได้ผล | สิ่งที่ต้องปรับปรุงต่อ'
        ]
      },
      {
        sectionTitle: '3. สัญญาณเตือน RED FLAG & หมายเหตุการกรอก',
        contentLines: [
          '• สัญญาณที่ควรแจ้งทันตแพทย์/แพทย์: กรนดังเป็นประจำ, หยุดหายใจหรือหายใจเฮือก, ง่วงมากผิดปกติกลางวัน, มีแผล/เจ็บปาก/ถอด EF บ่อย, อื่น ๆ (ควรพบแพทย์/ทันตแพทย์ วันที่ ... เหตุผล ...)',
          '• เกณฑ์คุณภาพการนอน 1-5: 5=ดีมาก (นอนเพียงพอ หลับต่อเนื่อง หายใจปกติ ตื่นสดชื่น), 4=ดี (มีปัญหาเล็กน้อย แต่กลับไปหลับได้), 3=ปานกลาง (เริ่มมีสิ่งรบกวน ควรปรับพฤติกรรม), 2=ควรปรับปรุง (ปัญหาชัดเจน ควรประเมินซ้ำ), 1=แย่ (การนอนผิดปกติชัดเจน ควรประเมินเพิ่มเติม)',
          '• หมายเหตุการกรอก: ชั่วโมงนอน = ตื่นนอน - เข้านอน - เวลาตื่นกลางดึกรวมกัน (โดยประมาณ), กรน/อ้าปากหายใจ (0=ไม่เป็น 1=เป็นบางครั้ง 2=เป็นบ่อย), สดชื่นตอนเช้า (😃 ดี, 😐 ปานกลาง, 🙁 ไม่สดชื่น)',
          '• คำแนะนำช่วงอายุ (ชั่วโมงนอน/วัน อ้างอิง AASM 2016): 6-12 ปี -> 9-12 ชั่วโมง | 13-18 ปี -> 8-10 ชั่วโมง'
        ]
      }
    ]
  }
];

export interface FacialAnatomyInfo {
  id: string;
  nameTh: string;
  nameEn: string;
  part: string;
  description: string;
  omtFunction: string;
  iconBg: string;
  relatedExercises: string[];
}

export const FACIAL_ANATOMY_DATA: FacialAnatomyInfo[] = [
  {
    id: 'lips',
    nameTh: 'ริมฝีปาก (Lips)',
    nameEn: 'Orbicularis Oris & Lip Seal',
    part: 'ริมฝีปาก',
    description: 'กล้ามเนื้อรอบริมฝีปาก ทำหน้าที่ปิดช่องปาก ควบคุมการดูด การกลืน และการออกเสียง',
    omtFunction: 'การปิดริมฝีปากสนิทขณะพัก (Lip Seal) ช่วยป้องกันการหายใจทางปาก กระตุ้นการขยายของขากรรไกร และลดฟันยื่น',
    iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
    relatedExercises: ['EF-002', 'EF-005', 'EF-008']
  },
  {
    id: 'tongue',
    nameTh: 'ลิ้นและฐานลิ้น (Tongue)',
    nameEn: 'Genioglossus & Tongue Posture',
    part: 'ลิ้น',
    description: 'มวลกล้ามเนื้อหลักในช่องปาก กำหนดรูปร่างของเพดานปากและขากรรไกรบน',
    omtFunction: 'การวางแผ่นลิ้นแนบเพดานปาก (Spot Position) ช่วยขยายโครงสร้างขากรรไกรบนตามธรรมชาติ และเปิดทางเดินหายใจส่วนบน',
    iconBg: 'bg-sky-50 text-sky-600 border-sky-200',
    relatedExercises: ['EF-003', 'EF-004', 'EF-005', 'EF-008']
  },
  {
    id: 'jaw',
    nameTh: 'ขากรรไกรและข้อต่อ (Jaw & TMJ)',
    nameEn: 'Mandible & Temporomandibular Joint',
    part: 'ขากรรไกร',
    description: 'กระดูกขากรรไกรล่างและข้อต่อขากรรไกร ควบคุมการอ้า-หุบปาก การเคี้ยว และการสบฟัน',
    omtFunction: 'จัดตำแหน่งขากรรไกรล่างไม่ให้ถอยหลังหรือเอียงข้าง ช่วยให้การสบฟันสมดุลและลดอาการเกร็งปวดข้อต่อ TMJ',
    iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    relatedExercises: ['EF-004', 'EF-006', 'EF-007', 'EF-008']
  },
  {
    id: 'cheeks',
    nameTh: 'แก้มและกล้ามเนื้อบดเคี้ยว (Cheeks)',
    nameEn: 'Buccinator & Masseter Muscles',
    part: 'แก้ม',
    description: 'กล้ามเนื้อแก้มและกล้ามเนื้อบดเคี้ยวข้างแก้ม ควบคุมการคลุกเคล้าอาหารและการสบฟัน',
    omtFunction: 'สร้างแรงเกร็งสมดุลสองข้าง ป้องกันแก้มตอบหรือแก้มเกร็งผิดวิธีเวลากลืน และช่วยรักษารูปหน้าให้ได้สัดส่วน',
    iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
    relatedExercises: ['EF-002', 'EF-005', 'EF-006', 'EF-008']
  },
  {
    id: 'airway',
    nameTh: 'ทางเดินหายใจส่วนบน (Upper Airway)',
    nameEn: 'Nasal Cavity & Pharynx',
    part: 'ทางเดินหายใจ',
    description: 'โพรงจมูก คอหอย และระบบทางเดินหายใจส่วนบน',
    omtFunction: 'การหายใจทางจมูก (Nasal Breathing) เพิ่มก๊าซไนตริกออกไซด์ (Nitric Oxide) ดักจับฝุ่นละออง และส่งเสริมการเจริญของใบหน้าส่วนกลาง',
    iconBg: 'bg-teal-50 text-teal-600 border-teal-200',
    relatedExercises: ['EF-001', 'EF-007', 'EF-008']
  }
];

export const VERIFIED_EXERCISES = [
  ...SEED_EXERCISES
];
