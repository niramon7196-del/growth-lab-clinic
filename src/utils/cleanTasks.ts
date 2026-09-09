/**
 * Utility for parsing, cleaning, and normalizing AssignedTasks & Exercise Codes
 * Guarantees that corrupted JSON strings, multi-layered stringified arrays, 
 * or bracket artifacts (e.g. ['["[]"']) are cleanly parsed and mapped
 * to the official 4 Golden Moves (4 ท่าไม้ตายหลัก).
 */

export interface ExerciseMetadata {
  id: string;
  title: string;
  category: 'breathing' | 'lips' | 'tongue' | 'swallowing' | 'cheek_jaw' | 'posture' | 'daily' | 'nutrition' | 'sleep' | 'jump' | 'movement';
  desc: string;
  reps: string;
  targetReps: number;
  durationMinutes: number;
  steps: string[];
}

export const KNOWN_EXERCISE_DEFINITIONS: Record<string, ExerciseMetadata> = {
  // Move 1: Wall Stand
  posture_wall_stand: {
    id: 'posture_wall_stand',
    title: '1. ท่ายืนปรับแนวกระดูกแนบกำแพง (Wall Stand)',
    category: 'posture',
    desc: 'แก้คอยื่น เปิดช่องทางเดินหายใจ (3 นาที)',
    reps: '3 นาที',
    targetReps: 1,
    durationMinutes: 3,
    steps: [
      'ยืนส้นเท้าชิดหรือห่างกำแพงเล็กน้อย ลำตัวและแนวกระดูกสันหลังตั้งตรง',
      'ให้แผ่นหลัง หัวไหล่ และหลังศีรษะแนบชิดติดกำแพง',
      'เก็บคางเข้าหาลำคอเล็กน้อย (Chin Tuck) เพื่อจัดแนวคอและเปิดทางเดินหายใจ',
      'ผ่อนคลายหัวไหล่ หายใจเข้า-ออกช้าๆ ลึกๆ ผ่านทางจมูก ต่อเนื่อง 3 นาที'
    ]
  },
  ex_01: {
    id: 'posture_wall_stand',
    title: '1. ท่ายืนปรับแนวกระดูกแนบกำแพง (Wall Stand)',
    category: 'posture',
    desc: 'แก้คอยื่น เปิดช่องทางเดินหายใจ (3 นาที)',
    reps: '3 นาที',
    targetReps: 1,
    durationMinutes: 3,
    steps: [
      'ยืนส้นเท้าชิดหรือห่างกำแพงเล็กน้อย ลำตัวและแนวกระดูกสันหลังตั้งตรง',
      'ให้แผ่นหลัง หัวไหล่ และหลังศีรษะแนบชิดติดกำแพง',
      'เก็บคางเข้าหาลำคอเล็กน้อย (Chin Tuck) เพื่อจัดแนวคอและเปิดทางเดินหายใจ',
      'ผ่อนคลายหัวไหล่ หายใจเข้า-ออกช้าๆ ลึกๆ ผ่านทางจมูก ต่อเนื่อง 3 นาที'
    ]
  },
  wall_stand: {
    id: 'posture_wall_stand',
    title: '1. ท่ายืนปรับแนวกระดูกแนบกำแพง (Wall Stand)',
    category: 'posture',
    desc: 'แก้คอยื่น เปิดช่องทางเดินหายใจ (3 นาที)',
    reps: '3 นาที',
    targetReps: 1,
    durationMinutes: 3,
    steps: [
      'ยืนส้นเท้าชิดหรือห่างกำแพงเล็กน้อย ลำตัวและแนวกระดูกสันหลังตั้งตรง',
      'ให้แผ่นหลัง หัวไหล่ และหลังศีรษะแนบชิดติดกำแพง',
      'เก็บคางเข้าหาลำคอเล็กน้อย (Chin Tuck) เพื่อจัดแนวคอและเปิดทางเดินหายใจ',
      'ผ่อนคลายหัวไหล่ หายใจเข้า-ออกช้าๆ ลึกๆ ผ่านทางจมูก ต่อเนื่อง 3 นาที'
    ]
  },
  posture_wall: {
    id: 'posture_wall_stand',
    title: '1. ท่ายืนปรับแนวกระดูกแนบกำแพง (Wall Stand)',
    category: 'posture',
    desc: 'แก้คอยื่น เปิดช่องทางเดินหายใจ (3 นาที)',
    reps: '3 นาที',
    targetReps: 1,
    durationMinutes: 3,
    steps: [
      'ยืนส้นเท้าชิดหรือห่างกำแพงเล็กน้อย ลำตัวและแนวกระดูกสันหลังตั้งตรง',
      'ให้แผ่นหลัง หัวไหล่ และหลังศีรษะแนบชิดติดกำแพง',
      'เก็บคางเข้าหาลำคอเล็กน้อย (Chin Tuck) เพื่อจัดแนวคอและเปิดทางเดินหายใจ',
      'ผ่อนคลายหัวไหล่ หายใจเข้า-ออกช้าๆ ลึกๆ ผ่านทางจมูก ต่อเนื่อง 3 นาที'
    ]
  },
  ef_001: {
    id: 'posture_wall_stand',
    title: '1. ท่ายืนปรับแนวกระดูกแนบกำแพง (Wall Stand)',
    category: 'posture',
    desc: 'แก้คอยื่น เปิดช่องทางเดินหายใจ (3 นาที)',
    reps: '3 นาที',
    targetReps: 1,
    durationMinutes: 3,
    steps: [
      'ยืนส้นเท้าชิดหรือห่างกำแพงเล็กน้อย ลำตัวและแนวกระดูกสันหลังตั้งตรง',
      'ให้แผ่นหลัง หัวไหล่ และหลังศีรษะแนบชิดติดกำแพง',
      'เก็บคางเข้าหาลำคอเล็กน้อย (Chin Tuck) เพื่อจัดแนวคอและเปิดทางเดินหายใจ',
      'ผ่อนคลายหัวไหล่ หายใจเข้า-ออกช้าๆ ลึกๆ ผ่านทางจมูก ต่อเนื่อง 3 นาที'
    ]
  },

  // Move 2: The Spot & Cave
  omt_tongue_spot: {
    id: 'omt_tongue_spot',
    title: '2. ท่าดูดลิ้นแตะเพดาน (The Spot & Cave)',
    category: 'tongue',
    desc: 'เสริมความแข็งแรงโคนลิ้น ป้องกันลิ้นตกอุดหลอดลมตอนนอน (20 ครั้ง)',
    reps: '20 ครั้ง',
    targetReps: 20,
    durationMinutes: 5,
    steps: [
      'หาตำแหน่งจุด Spot (บริเวณรอยย่นบนเพดานปากหลังฟันหน้าบน)',
      'วางปลายลิ้นแตะจุด Spot แนบสนิท โดยไม่ดันฟันหน้า',
      'ดูดแผ่นลิ้นและโคนลิ้นแนบติดเพดานปากให้เกิดสุญญากาศ (Cave/Suction)',
      'ค้างไว้ 3-5 วินาที แล้วผ่อน ทำซ้ำจนครบ 20 ครั้ง'
    ]
  },
  ex_02: {
    id: 'omt_tongue_spot',
    title: '2. ท่าดูดลิ้นแตะเพดาน (The Spot & Cave)',
    category: 'tongue',
    desc: 'เสริมความแข็งแรงโคนลิ้น ป้องกันลิ้นตกอุดหลอดลมตอนนอน (20 ครั้ง)',
    reps: '20 ครั้ง',
    targetReps: 20,
    durationMinutes: 5,
    steps: [
      'หาตำแหน่งจุด Spot (บริเวณรอยย่นบนเพดานปากหลังฟันหน้าบน)',
      'วางปลายลิ้นแตะจุด Spot แนบสนิท โดยไม่ดันฟันหน้า',
      'ดูดแผ่นลิ้นและโคนลิ้นแนบติดเพดานปากให้เกิดสุญญากาศ (Cave/Suction)',
      'ค้างไว้ 3-5 วินาที แล้วผ่อน ทำซ้ำจนครบ 20 ครั้ง'
    ]
  },
  tongue_spot: {
    id: 'omt_tongue_spot',
    title: '2. ท่าดูดลิ้นแตะเพดาน (The Spot & Cave)',
    category: 'tongue',
    desc: 'เสริมความแข็งแรงโคนลิ้น ป้องกันลิ้นตกอุดหลอดลมตอนนอน (20 ครั้ง)',
    reps: '20 ครั้ง',
    targetReps: 20,
    durationMinutes: 5,
    steps: [
      'หาตำแหน่งจุด Spot (บริเวณรอยย่นบนเพดานปากหลังฟันหน้าบน)',
      'วางปลายลิ้นแตะจุด Spot แนบสนิท โดยไม่ดันฟันหน้า',
      'ดูดแผ่นลิ้นและโคนลิ้นแนบติดเพดานปากให้เกิดสุญญากาศ (Cave/Suction)',
      'ค้างไว้ 3-5 วินาที แล้วผ่อน ทำซ้ำจนครบ 20 ครั้ง'
    ]
  },
  tongue_3: {
    id: 'omt_tongue_spot',
    title: '2. ท่าดูดลิ้นแตะเพดาน (The Spot & Cave)',
    category: 'tongue',
    desc: 'เสริมความแข็งแรงโคนลิ้น ป้องกันลิ้นตกอุดหลอดลมตอนนอน (20 ครั้ง)',
    reps: '20 ครั้ง',
    targetReps: 20,
    durationMinutes: 5,
    steps: [
      'หาตำแหน่งจุด Spot (บริเวณรอยย่นบนเพดานปากหลังฟันหน้าบน)',
      'วางปลายลิ้นแตะจุด Spot แนบสนิท โดยไม่ดันฟันหน้า',
      'ดูดแผ่นลิ้นและโคนลิ้นแนบติดเพดานปากให้เกิดสุญญากาศ (Cave/Suction)',
      'ค้างไว้ 3-5 วินาที แล้วผ่อน ทำซ้ำจนครบ 20 ครั้ง'
    ]
  },
  ef_003: {
    id: 'omt_tongue_spot',
    title: '2. ท่าดูดลิ้นแตะเพดาน (The Spot & Cave)',
    category: 'tongue',
    desc: 'เสริมความแข็งแรงโคนลิ้น ป้องกันลิ้นตกอุดหลอดลมตอนนอน (20 ครั้ง)',
    reps: '20 ครั้ง',
    targetReps: 20,
    durationMinutes: 5,
    steps: [
      'หาตำแหน่งจุด Spot (บริเวณรอยย่นบนเพดานปากหลังฟันหน้าบน)',
      'วางปลายลิ้นแตะจุด Spot แนบสนิท โดยไม่ดันฟันหน้า',
      'ดูดแผ่นลิ้นและโคนลิ้นแนบติดเพดานปากให้เกิดสุญญากาศ (Cave/Suction)',
      'ค้างไว้ 3-5 วินาที แล้วผ่อน ทำซ้ำจนครบ 20 ครั้ง'
    ]
  },

  // Move 3: Lip Seal Workout
  omt_lip_seal: {
    id: 'omt_lip_seal',
    title: '3. ท่าเม้มริมฝีปากแน่น (Lip Seal Workout)',
    category: 'lips',
    desc: 'ฝึกปิดปากสนิท หยุดพฤติกรรมนอนอ้าปาก (3 นาที)',
    reps: '3 นาที',
    targetReps: 1,
    durationMinutes: 3,
    steps: [
      'นั่งตัวตรง ผ่อนคลายกล้ามเนื้อใบหน้าและขากรรไกร',
      'ปิดริมฝีปากบนและล่างให้แนบสนิทโดยไม่เกร็งคาง',
      'หายใจเข้า-ออกลึกๆ ช้าๆ ผ่านทางจมูก 100%',
      'ฝึกปิดปากต่อเนื่องเป็นเวลา 3 นาที'
    ]
  },
  ex_03: {
    id: 'omt_lip_seal',
    title: '3. ท่าเม้มริมฝีปากแน่น (Lip Seal Workout)',
    category: 'lips',
    desc: 'ฝึกปิดปากสนิท หยุดพฤติกรรมนอนอ้าปาก (3 นาที)',
    reps: '3 นาที',
    targetReps: 1,
    durationMinutes: 3,
    steps: [
      'นั่งตัวตรง ผ่อนคลายกล้ามเนื้อใบหน้าและขากรรไกร',
      'ปิดริมฝีปากบนและล่างให้แนบสนิทโดยไม่เกร็งคาง',
      'หายใจเข้า-ออกลึกๆ ช้าๆ ผ่านทางจมูก 100%',
      'ฝึกปิดปากต่อเนื่องเป็นเวลา 3 นาที'
    ]
  },
  lip_seal: {
    id: 'omt_lip_seal',
    title: '3. ท่าเม้มริมฝีปากแน่น (Lip Seal Workout)',
    category: 'lips',
    desc: 'ฝึกปิดปากสนิท หยุดพฤติกรรมนอนอ้าปาก (3 นาที)',
    reps: '3 นาที',
    targetReps: 1,
    durationMinutes: 3,
    steps: [
      'นั่งตัวตรง ผ่อนคลายกล้ามเนื้อใบหน้าและขากรรไกร',
      'ปิดริมฝีปากบนและล่างให้แนบสนิทโดยไม่เกร็งคาง',
      'หายใจเข้า-ออกลึกๆ ช้าๆ ผ่านทางจมูก 100%',
      'ฝึกปิดปากต่อเนื่องเป็นเวลา 3 นาที'
    ]
  },
  lips_2: {
    id: 'omt_lip_seal',
    title: '3. ท่าเม้มริมฝีปากแน่น (Lip Seal Workout)',
    category: 'lips',
    desc: 'ฝึกปิดปากสนิท หยุดพฤติกรรมนอนอ้าปาก (3 นาที)',
    reps: '3 นาที',
    targetReps: 1,
    durationMinutes: 3,
    steps: [
      'นั่งตัวตรง ผ่อนคลายกล้ามเนื้อใบหน้าและขากรรไกร',
      'ปิดริมฝีปากบนและล่างให้แนบสนิทโดยไม่เกร็งคาง',
      'หายใจเข้า-ออกลึกๆ ช้าๆ ผ่านทางจมูก 100%',
      'ฝึกปิดปากต่อเนื่องเป็นเวลา 3 นาที'
    ]
  },
  ef_002: {
    id: 'omt_lip_seal',
    title: '3. ท่าเม้มริมฝีปากแน่น (Lip Seal Workout)',
    category: 'lips',
    desc: 'ฝึกปิดปากสนิท หยุดพฤติกรรมนอนอ้าปาก (3 นาที)',
    reps: '3 นาที',
    targetReps: 1,
    durationMinutes: 3,
    steps: [
      'นั่งตัวตรง ผ่อนคลายกล้ามเนื้อใบหน้าและขากรรไกร',
      'ปิดริมฝีปากบนและล่างให้แนบสนิทโดยไม่เกร็งคาง',
      'หายใจเข้า-ออกลึกๆ ช้าๆ ผ่านทางจมูก 100%',
      'ฝึกปิดปากต่อเนื่องเป็นเวลา 3 นาที'
    ]
  },

  // Move 4: Bone Loading Jump
  posture_bone_loading_jump: {
    id: 'posture_bone_loading_jump',
    title: '4. ท่ากระโดดเบาๆ ปลุกกระดูก (Bone Loading Jump)',
    category: 'movement',
    desc: 'กระตุ้น Growth Plate ยามเช้า (30 ครั้ง)',
    reps: '30 ครั้ง',
    targetReps: 30,
    durationMinutes: 3,
    steps: [
      'ยืนกางขาความกว้างเท่าหัวไหล่ แขนปล่อยสบายข้างลำตัว',
      'ย่อเข่าเล็กน้อย แล้วกระโดดขึ้นตรงๆ พร้อมแกว่งแขนช่วยส่งแรง',
      'ลงน้ำหนักด้วยปลายเท้าแล้วย่อเข่าซับแรงกระแทกอย่างนุ่มนวล (Soft Landing)',
      'ทำเป็นจังหวะต่อเนื่อง 30 ครั้ง เพื่อกระตุ้นแผ่นกระดูก'
    ]
  },
  ex_04: {
    id: 'posture_bone_loading_jump',
    title: '4. ท่ากระโดดเบาๆ ปลุกกระดูก (Bone Loading Jump)',
    category: 'movement',
    desc: 'กระตุ้น Growth Plate ยามเช้า (30 ครั้ง)',
    reps: '30 ครั้ง',
    targetReps: 30,
    durationMinutes: 3,
    steps: [
      'ยืนกางขาความกว้างเท่าหัวไหล่ แขนปล่อยสบายข้างลำตัว',
      'ย่อเข่าเล็กน้อย แล้วกระโดดขึ้นตรงๆ พร้อมแกว่งแขนช่วยส่งแรง',
      'ลงน้ำหนักด้วยปลายเท้าแล้วย่อเข่าซับแรงกระแทกอย่างนุ่มนวล (Soft Landing)',
      'ทำเป็นจังหวะต่อเนื่อง 30 ครั้ง เพื่อกระตุ้นแผ่นกระดูก'
    ]
  },
  bone_loading_jump: {
    id: 'posture_bone_loading_jump',
    title: '4. ท่ากระโดดเบาๆ ปลุกกระดูก (Bone Loading Jump)',
    category: 'movement',
    desc: 'กระตุ้น Growth Plate ยามเช้า (30 ครั้ง)',
    reps: '30 ครั้ง',
    targetReps: 30,
    durationMinutes: 3,
    steps: [
      'ยืนกางขาความกว้างเท่าหัวไหล่ แขนปล่อยสบายข้างลำตัว',
      'ย่อเข่าเล็กน้อย แล้วกระโดดขึ้นตรงๆ พร้อมแกว่งแขนช่วยส่งแรง',
      'ลงน้ำหนักด้วยปลายเท้าแล้วย่อเข่าซับแรงกระแทกอย่างนุ่มนวล (Soft Landing)',
      'ทำเป็นจังหวะต่อเนื่อง 30 ครั้ง เพื่อกระตุ้นแผ่นกระดูก'
    ]
  },
  jump_bone: {
    id: 'posture_bone_loading_jump',
    title: '4. ท่ากระโดดเบาๆ ปลุกกระดูก (Bone Loading Jump)',
    category: 'movement',
    desc: 'กระตุ้น Growth Plate ยามเช้า (30 ครั้ง)',
    reps: '30 ครั้ง',
    targetReps: 30,
    durationMinutes: 3,
    steps: [
      'ยืนกางขาความกว้างเท่าหัวไหล่ แขนปล่อยสบายข้างลำตัว',
      'ย่อเข่าเล็กน้อย แล้วกระโดดขึ้นตรงๆ พร้อมแกว่งแขนช่วยส่งแรง',
      'ลงน้ำหนักด้วยปลายเท้าแล้วย่อเข่าซับแรงกระแทกอย่างนุ่มนวล (Soft Landing)',
      'ทำเป็นจังหวะต่อเนื่อง 30 ครั้ง เพื่อกระตุ้นแผ่นกระดูก'
    ]
  },
  ex_1: {
    id: 'posture_bone_loading_jump',
    title: '4. ท่ากระโดดเบาๆ ปลุกกระดูก (Bone Loading Jump)',
    category: 'movement',
    desc: 'กระตุ้น Growth Plate ยามเช้า (30 ครั้ง)',
    reps: '30 ครั้ง',
    targetReps: 30,
    durationMinutes: 3,
    steps: [
      'ยืนกางขาความกว้างเท่าหัวไหล่ แขนปล่อยสบายข้างลำตัว',
      'ย่อเข่าเล็กน้อย แล้วกระโดดขึ้นตรงๆ พร้อมแกว่งแขนช่วยส่งแรง',
      'ลงน้ำหนักด้วยปลายเท้าแล้วย่อเข่าซับแรงกระแทกอย่างนุ่มนวล (Soft Landing)',
      'ทำเป็นจังหวะต่อเนื่อง 30 ครั้ง เพื่อกระตุ้นแผ่นกระดูก'
    ]
  },
  ef_009: {
    id: 'posture_bone_loading_jump',
    title: '4. ท่ากระโดดเบาๆ ปลุกกระดูก (Bone Loading Jump)',
    category: 'movement',
    desc: 'กระตุ้น Growth Plate ยามเช้า (30 ครั้ง)',
    reps: '30 ครั้ง',
    targetReps: 30,
    durationMinutes: 3,
    steps: [
      'ยืนกางขาความกว้างเท่าหัวไหล่ แขนปล่อยสบายข้างลำตัว',
      'ย่อเข่าเล็กน้อย แล้วกระโดดขึ้นตรงๆ พร้อมแกว่งแขนช่วยส่งแรง',
      'ลงน้ำหนักด้วยปลายเท้าแล้วย่อเข่าซับแรงกระแทกอย่างนุ่มนวล (Soft Landing)',
      'ทำเป็นจังหวะต่อเนื่อง 30 ครั้ง เพื่อกระตุ้นแผ่นกระดูก'
    ]
  }
};

/**
 * Strips bracket artifacts, extra quotes, JSON wrappers from a single code string
 */
export function sanitizeTaskCode(raw: string): string {
  if (!raw) return '';
  let str = String(raw).trim();
  
  // Recursively unquote and unwrap JSON strings
  let safety = 0;
  while (safety < 5) {
    safety++;
    const trimmed = str.trim();
    if ((trimmed.startsWith('[') && trimmed.endsWith(']')) ||
        (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length > 1) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length > 1)) {
      try {
        const parsed = JSON.parse(trimmed);
        if (typeof parsed === 'string') {
          str = parsed;
          continue;
        } else if (Array.isArray(parsed) && parsed.length > 0) {
          str = String(parsed[0]);
          continue;
        }
      } catch {
        // Strip outer boundary quotes or brackets
        str = trimmed.replace(/^(\[|'|"|\{)+|(\]|'|"|\})+$/g, '').trim();
      }
    } else {
      break;
    }
  }

  // Final cleanup of residual brackets, quotes, backslashes
  const cleaned = str.replace(/[\[\]{}"'\\`]/g, '').trim();
  if (!cleaned || cleaned === '[]' || cleaned === 'null' || cleaned === 'undefined') {
    return '';
  }
  return cleaned;
}

/**
 * Parses any incoming AssignedTasks data (multi-level JSON string, comma-separated list,
 * arrays containing stringified arrays, objects, etc.) into a clean Array of real exercise ID strings.
 * Guarantees that ['["[]"'] or nested JSON artifacts are completely purged.
 */
export function parseAndCleanAssignedTasks(input: any): string[] {
  if (input === null || input === undefined) return [];

  let itemsToProcess: any[] = [];

  if (typeof input === 'string') {
    let current: any = input.trim();
    if (!current || current === '[]' || current === '["[]"]' || current === "['[]']") return [];

    // Iteratively parse multi-layer stringified JSON
    let safetyLoop = 0;
    while (typeof current === 'string' && safetyLoop < 6) {
      safetyLoop++;
      const trimmed = current.trim();
      if ((trimmed.startsWith('[') && trimmed.endsWith(']')) ||
          (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
          (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length > 2) ||
          (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length > 2)) {
        try {
          current = JSON.parse(trimmed);
        } catch {
          break;
        }
      } else {
        break;
      }
    }

    if (Array.isArray(current)) {
      itemsToProcess = current;
    } else if (typeof current === 'object' && current !== null) {
      itemsToProcess = [current];
    } else if (typeof current === 'string') {
      itemsToProcess = current.split(/[,;\n]+/);
    }
  } else if (Array.isArray(input)) {
    itemsToProcess = input;
  } else if (typeof input === 'object') {
    itemsToProcess = [input];
  }

  const resultCodes: string[] = [];

  const extractRecursive = (item: any) => {
    if (item === null || item === undefined) return;

    if (typeof item === 'object') {
      const codeOrId = item.exerciseId || item.id || item.code || item.title || '';
      if (codeOrId) {
        extractRecursive(codeOrId);
      }
      return;
    }

    const rawStr = String(item).trim();
    if (!rawStr) return;

    // Check if the item itself is a JSON-encoded array or object
    if ((rawStr.startsWith('[') && rawStr.endsWith(']')) || (rawStr.startsWith('{') && rawStr.endsWith('}'))) {
      try {
        const parsed = JSON.parse(rawStr);
        if (Array.isArray(parsed)) {
          parsed.forEach(extractRecursive);
          return;
        } else if (typeof parsed === 'object' && parsed !== null) {
          extractRecursive(parsed);
          return;
        }
      } catch {}
    }

    // Split on commas if multiple codes were combined
    const splits = rawStr.split(/[,;\n]+/);
    for (const piece of splits) {
      const cleaned = sanitizeTaskCode(piece);
      if (cleaned && cleaned.length > 1 && !cleaned.includes('[') && !cleaned.includes(']')) {
        resultCodes.push(cleaned);
      }
    }
  };

  itemsToProcess.forEach(extractRecursive);

  // Return deduplicated list
  return Array.from(new Set(resultCodes));
}

/**
 * Maps any exercise code or raw identifier to a clean, authoritative Thai Title and Category.
 * Under NO circumstances will raw brackets, quotes, or JSON artifacts ever be displayed.
 */
export function resolveExerciseDisplay(rawCodeOrId: string, fallbackTitle?: string): ExerciseMetadata {
  const cleanKey = sanitizeTaskCode(rawCodeOrId);
  const lowerKey = cleanKey.toLowerCase();
  const strippedKey = lowerKey.replace(/[^a-z0-9]/g, '');

  // 1. Direct dictionary match
  if (KNOWN_EXERCISE_DEFINITIONS[lowerKey]) {
    return KNOWN_EXERCISE_DEFINITIONS[lowerKey];
  }

  // 2. Key matching by stripped alphanumeric key
  for (const [defKey, defVal] of Object.entries(KNOWN_EXERCISE_DEFINITIONS)) {
    if (defKey.toLowerCase().replace(/[^a-z0-9]/g, '') === strippedKey) {
      return defVal;
    }
  }

  // 3. Fallback matching to 4 Golden Moves
  if (lowerKey.includes('wall') || lowerKey.includes('stand') || lowerKey.includes('posture') || lowerKey.includes('กำแพง') || lowerKey.includes('ยืน') || lowerKey.includes('กระดูก')) {
    return KNOWN_EXERCISE_DEFINITIONS.posture_wall_stand;
  }
  if (lowerKey.includes('tongue') || lowerKey.includes('spot') || lowerKey.includes('cave') || lowerKey.includes('ลิ้น')) {
    return KNOWN_EXERCISE_DEFINITIONS.omt_tongue_spot;
  }
  if (lowerKey.includes('lip') || lowerKey.includes('seal') || lowerKey.includes('ปาก') || lowerKey.includes('เม้ม')) {
    return KNOWN_EXERCISE_DEFINITIONS.omt_lip_seal;
  }
  if (lowerKey.includes('jump') || lowerKey.includes('bone') || lowerKey.includes('โดด') || lowerKey.includes('กระโดด')) {
    return KNOWN_EXERCISE_DEFINITIONS.posture_bone_loading_jump;
  }

  // Clean fallback title so no brackets or quotes ever leak
  let cleanFallback = sanitizeTaskCode(fallbackTitle || '');
  if (!cleanFallback || cleanFallback === '[]' || cleanFallback.includes('[')) {
    cleanFallback = cleanKey ? `แบบฝึกหัดพัฒนาการ ${cleanKey}` : 'แบบฝึกหัด 4 Golden Moves';
  }

  return {
    id: cleanKey || 'exercise_custom',
    title: cleanFallback,
    category: 'posture',
    desc: 'ฝึกปฏิบัติตามเกณฑ์ 4 ท่าไม้ตายหลักของ Growth Lab อย่างสม่ำเสมอ',
    reps: '1 รอบ',
    targetReps: 1,
    durationMinutes: 3,
    steps: ['ปฏิบัติตามขั้นตอนอย่างถูกต้อง', 'หายใจทางจมูกอย่างสม่ำเสมอ']
  };
}
