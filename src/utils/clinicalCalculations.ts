import { 
  SleepDomains, 
  SleepRedFlags, 
  SleepLog,
  GrowthAssessment, 
  DailyPhysicalActivity, 
  JumpBoneLoading, 
  StrengthTraining, 
  LandingQuality, 
  PainAndInjury,
  ExerciseDailySummaryItem
} from '../types';

export function calculateSleepDurationHours(actualSleepTime: string, wakeTime: string): number {
  if (!actualSleepTime || !wakeTime) return 0;
  const [sh, sm] = actualSleepTime.split(':').map(Number);
  const [wh, wm] = wakeTime.split(':').map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(wh) || isNaN(wm)) return 0;
  
  let sleepMins = sh * 60 + sm;
  let wakeMins = wh * 60 + wm;
  
  if (wakeMins <= sleepMins) {
    wakeMins += 24 * 60;
  }
  
  const diffMins = wakeMins - sleepMins;
  return Number((diffMins / 60).toFixed(1));
}

export function calculateSleepOnsetMinutes(bedtime: string, actualSleepTime: string): number {
  if (!bedtime || !actualSleepTime) return 0;
  const [bh, bm] = bedtime.split(':').map(Number);
  const [sh, sm] = actualSleepTime.split(':').map(Number);
  if (isNaN(bh) || isNaN(bm) || isNaN(sh) || isNaN(sm)) return 0;

  let bedMins = bh * 60 + bm;
  let sleepMins = sh * 60 + sm;

  if (sleepMins < bedMins) {
    sleepMins += 24 * 60;
  }

  return Math.max(0, sleepMins - bedMins);
}

export interface MonthlySleepSummaryResult {
  totalDaysRecorded: number;
  avgDurationHours: number;
  efWornDays: number;
  efAdherencePercent: number;
  avgEfDurationHours: number;
  avgSleepScore: number;
  avgAwakenings: number;
  redFlagDaysCount: number;
  efRemovedDaysCount: number;
  removalReasonsSummary: { reason: string; count: number }[];
}

export function calculateMonthlySleepSummary(logs: SleepLog[]): MonthlySleepSummaryResult {
  if (!logs || logs.length === 0) {
    return {
      totalDaysRecorded: 0,
      avgDurationHours: 0,
      efWornDays: 0,
      efAdherencePercent: 0,
      avgEfDurationHours: 0,
      avgSleepScore: 0,
      avgAwakenings: 0,
      redFlagDaysCount: 0,
      efRemovedDaysCount: 0,
      removalReasonsSummary: []
    };
  }

  const totalDaysRecorded = logs.length;
  let totalDuration = 0;
  let efWornDays = 0;
  let totalEfDuration = 0;
  let totalSleepScore = 0;
  let totalAwakenings = 0;
  let redFlagDaysCount = 0;
  let efRemovedDaysCount = 0;
  const reasonCounts: { [reason: string]: number } = {};

  logs.forEach(log => {
    totalDuration += log.duration || 0;
    if (log.efWorn) {
      efWornDays++;
      totalEfDuration += log.efDurationHours || 0;
    }
    totalSleepScore += log.quality || 0;
    totalAwakenings += log.nighttimeAwakenings || 0;
    if (log.hasRedFlag) {
      redFlagDaysCount++;
    }
    if (log.efRemovedDuringNight) {
      efRemovedDaysCount++;
      if (log.efRemovalReason) {
        reasonCounts[log.efRemovalReason] = (reasonCounts[log.efRemovalReason] || 0) + 1;
      }
    }
  });

  const avgDurationHours = Number((totalDuration / totalDaysRecorded).toFixed(1));
  const efAdherencePercent = Number(((efWornDays / totalDaysRecorded) * 100).toFixed(1));
  const avgEfDurationHours = efWornDays > 0 ? Number((totalEfDuration / efWornDays).toFixed(1)) : 0;
  const avgSleepScore = Number((totalSleepScore / totalDaysRecorded).toFixed(1));
  const avgAwakenings = Number((totalAwakenings / totalDaysRecorded).toFixed(1));

  const removalReasonsSummary = Object.keys(reasonCounts).map(reason => ({
    reason,
    count: reasonCounts[reason]
  })).sort((a, b) => b.count - a.count);

  return {
    totalDaysRecorded,
    avgDurationHours,
    efWornDays,
    efAdherencePercent,
    avgEfDurationHours,
    avgSleepScore,
    avgAwakenings,
    redFlagDaysCount,
    efRemovedDaysCount,
    removalReasonsSummary
  };
}

export interface SleepCalculationResult {
  rawScore: number; // 0-10
  qualityScore: number; // 1-5
  qualityLabel: string;
  hasRedFlag: boolean;
  activeRedFlags: string[];
  warningMessage?: string;
  guidanceList: string[];
  calculationDetail: string;
}

export function calculateSleepQualityScore(
  domains: SleepDomains, 
  redFlags: SleepRedFlags,
  sourceStatus?: string
): SleepCalculationResult {
  if (sourceStatus === 'PENDING VERIFICATION') {
    return {
      rawScore: 0,
      qualityScore: 1,
      qualityLabel: 'PENDING VERIFICATION (ระงับการคำนวณจริง)',
      hasRedFlag: false,
      activeRedFlags: [],
      warningMessage: 'เอกสารอ้างอิงทางคลินิกอยู่ในสถานะ PENDING VERIFICATION - ห้ามเปิดการคำนวณคะแนนทางคลินิกจริง',
      guidanceList: ['รอการยืนยันเอกสาร Clinical Source จากผู้รับผิดชอบก่อนเปิดระบบคำนวณจริง'],
      calculationDetail: 'ระบบระงับการคำนวณคะแนนจริง เนื่องจากเอกสารอ้างอิง Clinical Source ยังอยู่ในสถานะ PENDING VERIFICATION'
    };
  }

  const d1 = Math.min(2, Math.max(0, Number(domains.durationScore) || 0));
  const d2 = Math.min(2, Math.max(0, Number(domains.continuityScore) || 0));
  const d3 = Math.min(2, Math.max(0, Number(domains.breathingScore) || 0));
  const d4 = Math.min(2, Math.max(0, Number(domains.onsetScore) || 0));
  const d5 = Math.min(2, Math.max(0, Number(domains.daytimeScore) || 0));

  const rawScore = d1 + d2 + d3 + d4 + d5; // 0 - 10

  let qualityScore = 1;
  let qualityLabel = '1 - แย่';

  if (rawScore >= 9) {
    qualityScore = 5;
    qualityLabel = '5 - ดีมาก';
  } else if (rawScore >= 7) {
    qualityScore = 4;
    qualityLabel = '4 - ดี';
  } else if (rawScore >= 5) {
    qualityScore = 3;
    qualityLabel = '3 - ปานกลาง';
  } else if (rawScore >= 3) {
    qualityScore = 2;
    qualityLabel = '2 - ควรปรับปรุง';
  } else {
    qualityScore = 1;
    qualityLabel = '1 - แย่';
  }

  const activeRedFlags: string[] = [];
  if (redFlags.snoringRegularly) activeRedFlags.push('กรนเป็นประจำ');
  if (redFlags.mouthBreathingRegularly) activeRedFlags.push('อ้าปากหายใจขณะหลับเป็นประจำ');
  if (redFlags.apneaObserved) activeRedFlags.push('สังเกตว่าหยุดหายใจ/หายใจเฮือก');
  if (redFlags.excessiveSweating) activeRedFlags.push('เหงื่อออกมากผิดปกติขณะนอน');
  if (redFlags.excessiveDaytimeSleepiness) activeRedFlags.push('ง่วงมากผิดปกติในตอนกลางวัน/หลับในโรงเรียน');

  const hasRedFlag = activeRedFlags.length > 0;

  const guidanceList = [
    'ควรส่งพบแพทย์ผู้เชี่ยวชาญด้าน หู คอ จมูก (ENT Specialist) หรือ Sleep Specialist',
    'ตรวจประเมินโครงสร้างและทางเดินหายใจส่วนบน (Airway Evaluation)',
    'ประเมินขนาดต่อมทอนซิลและอะดีนอยด์ (Tonsils & Adenoids Assessment)',
    'พิจารณาการตรวจภาวะการนอนหลับ (Sleep Test / Polysomnography) ตามความเหมาะสม'
  ];

  const calculationDetail = [
    `คะแนนดิบสะสม (Raw Score): ${rawScore}/10`,
    ` - ด้านที่ 1 ระยะเวลานอน: ${d1}/2 คะแนน`,
    ` - ด้านที่ 2 หลับต่อเนื่อง: ${d2}/2 คะแนน`,
    ` - ด้านที่ 3 การหายใจขณะหลับ: ${d3}/2 คะแนน`,
    ` - ด้านที่ 4 การหลับง่าย: ${d4}/2 คะแนน`,
    ` - ด้านที่ 5 ความสดชื่นยามเช้า/กลางวัน: ${d5}/2 คะแนน`,
    `แปลงเป็น Sleep Quality Score: ${qualityLabel} (จากเกณฑ์ 0-2=1, 3-4=2, 5-6=3, 7-8=4, 9-10=5)`,
    hasRedFlag ? `พบ Red Flag ทั้งหมด ${activeRedFlags.length} รายการ (${activeRedFlags.join(', ')})` : 'ไม่พบ Red Flag'
  ].join('\n');

  return {
    rawScore,
    qualityScore,
    qualityLabel,
    hasRedFlag,
    activeRedFlags,
    warningMessage: hasRedFlag ? 'พบ Red Flag ควรส่งประเมินเพิ่มเติม' : undefined,
    guidanceList: hasRedFlag ? guidanceList : [],
    calculationDetail
  };
}

// Live BMI Calculation
export function calculateBMI(weightKg: number, heightCm: number): number {
  if (!weightKg || !heightCm || heightCm <= 0 || weightKg <= 0) return 0;
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Number(bmi.toFixed(1));
}

// Live Height Velocity Calculation (cm/year)
export function calculateHeightVelocity(
  currentHeightCm: number,
  previousHeightCm: number | undefined,
  currentDateStr: string,
  previousDateStr: string | undefined
): { velocity: number | null; daysBetween: number; detail: string } {
  if (!currentHeightCm || !previousHeightCm || !previousDateStr || !currentDateStr) {
    return {
      velocity: null,
      daysBetween: 0,
      detail: 'ไม่มีข้อมูลส่วนสูงครั้งก่อนหรือวันที่เพื่อคำนวณ Height Velocity'
    };
  }

  const currD = new Date(currentDateStr);
  const prevD = new Date(previousDateStr);

  if (isNaN(currD.getTime()) || isNaN(prevD.getTime()) || currD <= prevD) {
    return {
      velocity: null,
      daysBetween: 0,
      detail: 'วันที่วัดครั้งก่อนต้องเกิดขึ้นก่อนวันที่วัดปัจจุบัน'
    };
  }

  const diffMs = currD.getTime() - prevD.getTime();
  const daysBetween = Math.round(diffMs / (1000 * 60 * 60 * 24));
  
  if (daysBetween < 1) {
    return {
      velocity: null,
      daysBetween,
      detail: 'ระยะเวลาระหว่างการวัดน้อยเกินไป (< 1 วัน)'
    };
  }

  const heightDiff = currentHeightCm - previousHeightCm;
  const velocity = (heightDiff / daysBetween) * 365.25;
  const formattedVelocity = Number(velocity.toFixed(2));

  const detail = `Height Velocity = (${heightDiff.toFixed(1)} cm / ${daysBetween} วัน) × 365.25 วัน = ${formattedVelocity} cm/ปี (วัดล่าสุด: ${currentDateStr}, ก่อนหน้า: ${previousDateStr})`;

  return {
    velocity: formattedVelocity,
    daysBetween,
    detail
  };
}

// Configurable Scoring Engine Interface & Default Rules
export interface ExerciseScoreConfig {
  minActiveDaysForLevel5: number;
  minActiveDaysForLevel4: number;
  minActiveDaysForLevel3: number;
  minActiveDaysForLevel2: number;
}

export const DEFAULT_EXERCISE_CONFIG: ExerciseScoreConfig = {
  minActiveDaysForLevel5: 5,
  minActiveDaysForLevel4: 4,
  minActiveDaysForLevel3: 3,
  minActiveDaysForLevel2: 2,
};

export interface ExerciseCalculationResult {
  score: number; // 1-5
  label: string;
  levelDescription: string;
  detail: string;
}

export function calculateExerciseScore(
  daily: DailyPhysicalActivity,
  jump: JumpBoneLoading,
  strength: StrengthTraining,
  landing: LandingQuality,
  pain: PainAndInjury,
  config: ExerciseScoreConfig = DEFAULT_EXERCISE_CONFIG,
  sourceStatus?: string
): ExerciseCalculationResult {
  if (sourceStatus === 'PENDING VERIFICATION') {
    return {
      score: 1,
      label: 'PENDING VERIFICATION (ระงับการคำนวณจริง)',
      levelDescription: 'ระงับการคำนวณเนื่องจากเอกสารอ้างอิงทางคลินิกยังไม่ผ่านการยืนยัน',
      detail: 'ระบบระงับการคำนวณคะแนนจริง เนื่องจากเอกสารอ้างอิง Clinical Source ยังอยู่ในสถานะ PENDING VERIFICATION'
    };
  }

  const activeDays = Number(daily.activeDaysPerWeek) || 0;
  const avgMins = Number(daily.averageMinutesPerDay) || 0;
  const isLandingQualityGood = Boolean(
    landing.softLanding && 
    landing.kneeAlignment && 
    landing.trunkControl && 
    landing.painFreeDuringActivity
  );
  const isNoPain = !pain.painPresent || pain.painScore === 0;

  let score = 1;
  let label = '1 - น้อยมาก (<2 วัน/สัปดาห์)';
  let levelDescription = 'น้อยมาก (<2 วัน/สัปดาห์)';

  // Rule Evaluation (Engine logic using physician parameters)
  if (activeDays < config.minActiveDaysForLevel2) {
    score = 1;
    label = '1 - น้อยมาก (<2 วัน/สัปดาห์)';
    levelDescription = 'น้อยมาก (<2 วัน/สัปดาห์)';
  } else if (
    activeDays >= config.minActiveDaysForLevel5 && 
    isLandingQualityGood && 
    isNoPain
  ) {
    score = 5;
    label = '5 - ดีเยี่ยม ทำสม่ำเสมอ + ท่าถูกต้อง + ไม่มีอาการปวด';
    levelDescription = 'ดีเยี่ยม ทำสม่ำเสมอ + ท่าถูกต้อง + ไม่มีอาการปวด';
  } else if (
    activeDays >= config.minActiveDaysForLevel4 && 
    (avgMins >= 60 || jump.daysPerWeek > 0 || strength.daysPerWeek > 0) &&
    pain.painScore <= 3
  ) {
    score = 4;
    label = '4 - ดีมาก ได้ตามเป้าหมาย';
    levelDescription = 'ดีมาก ได้ตามเป้าหมาย';
  } else if (activeDays >= config.minActiveDaysForLevel3) {
    score = 3;
    label = '3 - ปานกลาง เริ่มดี แต่ยังไม่ครบองค์ประกอบ';
    levelDescription = 'ปานกลาง เริ่มดี แต่ยังไม่ครบองค์ประกอบ';
  } else {
    score = 2;
    label = '2 - น้อย ยังไม่สม่ำเสมอ';
    levelDescription = 'น้อย ยังไม่สม่ำเสมอ';
  }

  const detailLines = [
    `ประเมินจาก Engine เกณฑ์ทางการแพทย์ (Configurable Engine):`,
    ` - กิจกรรมประจำวัน (Active Days): ${activeDays} วัน/สัปดาห์ (เฉลี่ย ${avgMins} นาที/วัน)`,
    ` - Jump / Bone-loading: ${jump.daysPerWeek} วัน/สัปดาห์ (${jump.selectedActivities.join(', ') || 'ไม่มี'})`,
    ` - Strength Training: ${strength.daysPerWeek} วัน/สัปดาห์ (${strength.selectedExercises.join(', ') || 'ไม่มี'})`,
    ` - Landing Quality: ${isLandingQualityGood ? 'สมบูรณ์ (ลงน้ำหนักนุ่มนวล, เข่าไม่บิด, ควบคุมลำตัวดี)' : 'ควรปรับปรุงเพิ่มเติม'}`,
    ` - อาการปวด (Pain): ${isNoPain ? 'ไม่มีอาการปวด (Pain Free)' : `มีอาการปวด คะแนน ${pain.painScore}/10 (${pain.painLocations.join(', ') || 'ไม่ระบุตำแหน่ง'})`}`,
    `ผลคำนวณสุดท้าย (Final Score): ${label}`
  ];

  return {
    score,
    label,
    levelDescription,
    detail: detailLines.join('\n')
  };
}

export function generateWeeklyGrid(
  activeDays: number,
  avgMinutes: number,
  jumpDays: number,
  strengthDays: number,
  painPresent: boolean
): ExerciseDailySummaryItem[] {
  const days = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
  
  return days.map((dayName, idx) => {
    // Distribute active days based on index
    const isActiveDay = idx < activeDays;
    const isJumpDay = idx < jumpDays;
    const isStrengthDay = idx < strengthDays;

    return {
      dayName,
      active60Min: isActiveDay && avgMinutes >= 60,
      jumpImpact: isJumpDay,
      strengthTraining: isStrengthDay,
      noPain: !painPresent
    };
  });
}
