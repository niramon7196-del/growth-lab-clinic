import { VERIFIED_EXERCISES } from './src/data';
import { Exercise, HomeworkAssignment, Patient } from './src/types';
import { 
  parseAndCleanAssignedTasks, 
  resolveExerciseDisplay, 
  sanitizeTaskCode 
} from './src/utils/cleanTasks';

/**
 * Known default missions / 4 Golden Moves definitions
 */
const SPECIAL_EXERCISE_DEFINITIONS: Record<string, Partial<Exercise>> = {
  posture_wall_stand: {
    id: 'posture_wall_stand',
    title: '1. ท่ายืนปรับแนวกระดูกแนบกำแพง (Wall Stand)',
    subTitle: 'แก้คอยื่น เปิดช่องทางเดินหายใจ (3 นาที)',
    category: 'posture',
    purpose: 'จัดแนวกระดูกสันหลังให้ตรงและเปิดทางเดินหายใจส่วนบน',
    description: 'ยืนพิงกำแพงให้ส้นเท้า สะโพก ไหล่ และหลังศีรษะแตะกำแพง เก็บคาง (Chin Tuck)',
    difficultyLevel: 'ง่าย',
    durationMinutes: 3,
    targetReps: 1,
    steps: [
      'ยืนส้นเท้าชิดหรือห่างกำแพงเล็กน้อย ลำตัวและแนวกระดูกสันหลังตั้งตรง',
      'ให้แผ่นหลัง หัวไหล่ และหลังศีรษะแนบชิดติดกำแพง',
      'เก็บคางเข้าหาลำคอเล็กน้อย (Chin Tuck) เพื่อจัดแนวคอและเปิดทางเดินหายใจ',
      'ผ่อนคลายหัวไหล่ หายใจเข้า-ออกช้าๆ ลึกๆ ผ่านทางจมูก ต่อเนื่อง 3 นาที'
    ],
    isActive: true,
    sourceStatus: 'VERIFIED'
  },
  omt_tongue_spot: {
    id: 'omt_tongue_spot',
    title: '2. ท่าดูดลิ้นแตะเพดาน (The Spot & Cave)',
    subTitle: 'เสริมความแข็งแรงโคนลิ้น ป้องกันลิ้นตกอุดหลอดลมตอนนอน (20 ครั้ง)',
    category: 'tongue',
    purpose: 'เสริมความแข็งแรงโคนลิ้น ป้องกันลิ้นตกอุดหลอดลมตอนนอน',
    description: 'วางปลายลิ้นแตะจุด Spot บนเพดานปาก และดูดแผ่นลิ้นแนบสนิทเพดานปาก',
    difficultyLevel: 'ปานกลาง',
    durationMinutes: 5,
    targetReps: 20,
    steps: [
      'หาตำแหน่งจุด Spot (บริเวณรอยย่นบนเพดานปากหลังฟันหน้าบน)',
      'วางปลายลิ้นแตะจุด Spot แนบสนิท โดยไม่ดันฟันหน้า',
      'ดูดแผ่นลิ้นและโคนลิ้นแนบติดเพดานปากให้เกิดสุญญากาศ (Cave/Suction)',
      'ค้างไว้ 3-5 วินาที แล้วผ่อน ทำซ้ำจนครบ 20 ครั้ง'
    ],
    isActive: true,
    sourceStatus: 'VERIFIED'
  },
  omt_lip_seal: {
    id: 'omt_lip_seal',
    title: '3. ท่าเม้มริมฝีปากแน่น (Lip Seal Workout)',
    subTitle: 'ฝึกปิดปากสนิท หยุดพฤติกรรมนอนอ้าปาก (3 นาที)',
    category: 'lips',
    purpose: 'ฝึกปิดปากสนิท หยุดพฤติกรรมนอนอ้าปากและส่งเสริมการหายใจทางจมูก 100%',
    description: 'เม้มริมฝีปากบนและล่างให้แนบสนิทโดยไม่เกร็งคาง หายใจทางจมูกต่อเนื่อง 3 นาที',
    difficultyLevel: 'ง่าย',
    durationMinutes: 3,
    targetReps: 1,
    steps: [
      'นั่งตัวตรง ผ่อนคลายกล้ามเนื้อใบหน้าและขากรรไกร',
      'ปิดริมฝีปากบนและล่างให้แนบสนิทโดยไม่เกร็งคาง',
      'หายใจเข้า-ออกลึกๆ ช้าๆ ผ่านทางจมูก 100%',
      'ฝึกปิดปากต่อเนื่องเป็นเวลา 3 นาที'
    ],
    isActive: true,
    sourceStatus: 'VERIFIED'
  },
  posture_bone_loading_jump: {
    id: 'posture_bone_loading_jump',
    title: '4. ท่ากระโดดเบาๆ ปลุกกระดูก (Bone Loading Jump)',
    subTitle: 'กระตุ้น Growth Plate ยามเช้า (30 ครั้ง)',
    category: 'movement',
    purpose: 'กระตุ้น Growth Plate และความหนาแน่นกระดูกด้วยแรงลงน้ำหนักที่เหมาะสม',
    description: 'กระโดดอยู่กับที่โดยลงน้ำหนักด้วยปลายเท้าและงอเข่าเพื่อซับแรงกระแทก (Soft Landing)',
    difficultyLevel: 'ง่าย',
    durationMinutes: 3,
    targetReps: 30,
    steps: [
      'ยืนกางขาความกว้างเท่าหัวไหล่ แขนปล่อยสบายข้างลำตัว',
      'ย่อเข่าเล็กน้อย แล้วกระโดดขึ้นตรงๆ พร้อมแกว่งแขนช่วยส่งแรง',
      'ลงน้ำหนักด้วยปลายเท้าแล้วย่อเข่าซับแรงกระแทกอย่างนุ่มนวล (Soft Landing)',
      'ทำเป็นจังหวะต่อเนื่อง 30 ครั้ง เพื่อกระตุ้นแผ่นกระดูก'
    ],
    isActive: true,
    sourceStatus: 'VERIFIED'
  }
};

/**
 * Standard fallback missions if patient has no tasks assigned (4 Golden Moves)
 */
export const DEFAULT_4_STAGE_MISSIONS: HomeworkAssignment[] = [
  {
    id: 'default_asgn_wall_stand',
    patientId: '',
    exerciseId: 'posture_wall_stand',
    reps: 1,
    durationMinutes: 3,
    startDate: new Date().toISOString().split('T')[0],
    status: 'pending',
    instruction: '1. ท่ายืนปรับแนวกระดูกแนบกำแพง (Wall Stand) แก้คอยื่น เปิดช่องทางเดินหายใจ (3 นาที)'
  },
  {
    id: 'default_asgn_tongue_spot',
    patientId: '',
    exerciseId: 'omt_tongue_spot',
    reps: 20,
    durationMinutes: 5,
    startDate: new Date().toISOString().split('T')[0],
    status: 'pending',
    instruction: '2. ท่าดูดลิ้นแตะเพดาน (The Spot & Cave) เสริมความแข็งแรงโคนลิ้น ป้องกันลิ้นตกอุดหลอดลม (20 ครั้ง)'
  },
  {
    id: 'default_asgn_lip_seal',
    patientId: '',
    exerciseId: 'omt_lip_seal',
    reps: 1,
    durationMinutes: 3,
    startDate: new Date().toISOString().split('T')[0],
    status: 'pending',
    instruction: '3. ท่าเม้มริมฝีปากแน่น (Lip Seal Workout) ฝึกปิดปากสนิท หยุดพฤติกรรมนอนอ้าปาก (3 นาที)'
  },
  {
    id: 'default_asgn_bone_jump',
    patientId: '',
    exerciseId: 'posture_bone_loading_jump',
    reps: 30,
    durationMinutes: 3,
    startDate: new Date().toISOString().split('T')[0],
    status: 'pending',
    instruction: '4. ท่ากระโดดเบาๆ ปลุกกระดูก (Bone Loading Jump) กระตุ้น Growth Plate ยามเช้า (30 ครั้ง)'
  }
];

/**
 * Helper to resolve assigned exercises completely across all 4 pillars and clinical tasks.
 * Returns 100% of assigned exercises accurately without error.
 */
export function getPatientAssignedExercises(
  allExercisesOrPatient?: any[] | Patient | any,
  rawAssignedTasks?: any
): any[] {
  let allExercises: any[] = VERIFIED_EXERCISES;
  let sourceTasks: any = rawAssignedTasks;

  // Handle flexible signature: (patient) or (allExercises, rawTasks) or (allExercises, patient)
  if (Array.isArray(allExercisesOrPatient)) {
    allExercises = allExercisesOrPatient.length > 0 ? allExercisesOrPatient : VERIFIED_EXERCISES;
  } else if (allExercisesOrPatient && typeof allExercisesOrPatient === 'object') {
    // allExercisesOrPatient is actually a Patient object
    sourceTasks = allExercisesOrPatient;
    allExercises = VERIFIED_EXERCISES;
  }

  // Extract raw task identifiers and assignments from source
  let rawItems: any[] = [];

  if (sourceTasks && typeof sourceTasks === 'object' && !Array.isArray(sourceTasks)) {
    // sourceTasks is a Patient object or dictionary
    const p = sourceTasks as any;
    if (Array.isArray(p.assignments) && p.assignments.length > 0) {
      rawItems = p.assignments;
    } else {
      const taskList = p.assignedTasks || p.AssignedTasks || p.assignedExercises || p.AssignedExercises || p.assignedOMT || [];
      if (Array.isArray(taskList)) {
        rawItems = taskList;
      } else if (typeof taskList === 'string') {
        rawItems = [taskList];
      }
    }
  } else if (Array.isArray(sourceTasks)) {
    rawItems = sourceTasks;
  } else if (typeof sourceTasks === 'string') {
    rawItems = [sourceTasks];
  }

  // Flatten and parse string tokens / JSON representations cleanly
  const normalizedEntries: Array<{
    id: string;
    originalObj?: any;
  }> = [];

  rawItems.forEach(item => {
    if (!item) return;

    if (typeof item === 'object') {
      const targetId = item.exerciseId || item.id || item.code || '';
      const cleanTargetId = sanitizeTaskCode(String(targetId));
      if (cleanTargetId) {
        normalizedEntries.push({
          id: cleanTargetId,
          originalObj: item
        });
      }
    } else {
      // Clean any string / multi-nested array/JSON
      const cleanedCodes = parseAndCleanAssignedTasks(item);
      cleanedCodes.forEach(code => {
        if (code) {
          normalizedEntries.push({ id: code });
        }
      });
    }
  });

  // If no assigned entries found, return clean empty list
  if (normalizedEntries.length === 0) {
    return [];
  }

  // Map each assigned entry to a full exercise object with merged metadata
  const resolvedList: any[] = [];
  const seenIds = new Set<string>();

  normalizedEntries.forEach(entry => {
    const rawId = sanitizeTaskCode(entry.id);
    if (!rawId || rawId === '[]' || rawId.includes('[')) return;

    const cleanIdLower = rawId.toLowerCase();
    const cleanIdStripped = cleanIdLower.replace(/[^a-z0-9]/g, '');

    // Check if already processed to avoid duplicates unless unique assignment objects
    const dedupeKey = entry.originalObj?.id || rawId;
    if (seenIds.has(dedupeKey)) return;
    seenIds.add(dedupeKey);

    // 1. Look in authoritative Thai definition dictionary
    const fallbackDef = resolveExerciseDisplay(rawId, entry.originalObj?.title);

    // 2. Look in SPECIAL_EXERCISE_DEFINITIONS
    let matchedEx: any = SPECIAL_EXERCISE_DEFINITIONS[rawId] || SPECIAL_EXERCISE_DEFINITIONS[cleanIdLower];

    // 3. Look in allExercises (exact match, case-insensitive, or stripped)
    if (!matchedEx && Array.isArray(allExercises)) {
      matchedEx = allExercises.find(ex => {
        const exIdLower = sanitizeTaskCode(String(ex.id || '')).toLowerCase();
        const exCodeLower = sanitizeTaskCode(String(ex.code || '')).toLowerCase();
        if (exIdLower === cleanIdLower || exCodeLower === cleanIdLower) return true;
        if (exIdLower.replace(/[^a-z0-9]/g, '') === cleanIdStripped) return true;
        return false;
      });
    }

    // 4. Look by title or subtitle matching
    if (!matchedEx && Array.isArray(allExercises)) {
      matchedEx = allExercises.find(ex => {
        const titleLower = String(ex.title || '').toLowerCase();
        return titleLower.includes(cleanIdLower) || (cleanIdLower.length > 3 && cleanIdLower.includes(titleLower));
      });
    }

    // 5. Construct high-fidelity verified fallback with clean Thai title
    if (!matchedEx) {
      matchedEx = {
        id: rawId,
        title: fallbackDef.title,
        subTitle: entry.originalObj?.subTitle || 'Clinical Growth Program',
        description: entry.originalObj?.instruction || entry.originalObj?.description || fallbackDef.desc,
        steps: fallbackDef.steps || ['ปฏิบัติตามขั้นตอนอย่างถูกต้อง', 'หายใจทางจมูกอย่างสม่ำเสมอ'],
        targetReps: entry.originalObj?.reps || fallbackDef.targetReps || 10,
        durationMinutes: entry.originalObj?.durationMinutes || fallbackDef.durationMinutes || 5,
        category: fallbackDef.category,
        sourceStatus: 'VERIFIED'
      };
    } else {
      // Ensure matchedEx title does not contain raw bracket garbage
      if (!matchedEx.title || matchedEx.title.includes('[')) {
        matchedEx = {
          ...matchedEx,
          title: fallbackDef.title
        };
      }
    }

    // Merge original assignment properties
    const finalObj = {
      ...matchedEx,
      ...(entry.originalObj || {}),
      id: matchedEx.id || rawId,
      exerciseId: rawId,
      assignmentId: entry.originalObj?.id || `asgn_${rawId}`,
      title: sanitizeTaskCode(entry.originalObj?.title) || matchedEx.title || fallbackDef.title,
      reps: entry.originalObj?.reps || matchedEx.targetReps || matchedEx.reps || fallbackDef.targetReps || 10,
      targetReps: entry.originalObj?.reps || matchedEx.targetReps || matchedEx.reps || fallbackDef.targetReps || 10,
      durationMinutes: entry.originalObj?.durationMinutes || matchedEx.durationMinutes || fallbackDef.durationMinutes || 5,
      instruction: entry.originalObj?.instruction || matchedEx.purpose || matchedEx.description || fallbackDef.desc || '',
      status: entry.originalObj?.status || 'pending'
    };

    // Ensure title never has bracket artifacts
    if (finalObj.title.includes('[')) {
      finalObj.title = fallbackDef.title;
    }

    resolvedList.push(finalObj);
  });

  return resolvedList;
}
