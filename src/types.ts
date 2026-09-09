export type UserRole = 'ADMIN' | 'DEVELOPER' | 'CLINIC_OWNER' | 'DOCTOR' | 'ASSISTANT' | 'PATIENT';

export interface UserAccount {
  id: string;
  username: string;
  role: UserRole;
  patientId?: string; // Only for PATIENT role
  hn?: string; // Optional HN for PATIENT role
  name: string;
  permissions?: { [key: string]: boolean };
}

export interface CheckInRecord {
  id: string;
  userId?: string;
  patientId?: string;
  patientName?: string;
  hn?: string;
  patientHn?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm:ss
  timestamp: string; // HH:mm:ss or ISO or HH:mm น.
  source: 'APP' | 'QR' | string;
  method?: 'participant_self_check_in' | 'staff_recorded_check_in' | string;
  actor?: string;
  performedBy?: string;
  status?: 'COMPLETED' | 'CONFIRMED' | 'SUCCESS' | 'completed' | 'pending' | string;
  action?: string;
  score?: string | number;
  details?: string;
  notes?: string;
  clinicId?: string;
}

export interface DailyUsageTracker {
  date: string; // YYYY-MM-DD
  appOpens: number;
  exerciseClicks: number;
  lastActive: string; // ISO string
}

export interface PatientProfileInfo {
  hn: string;
  name: string;
  nickname: string;
  age: number;
  phone: string;
  idCard?: string;
  avatarUrl?: string;
  growthStage?: string;
}

export interface PatientAssignments {
  assignedOMT: string[];
  assignedExercises: string[];
  assignedSleepEF: Record<string, any>;
  assignedGNS: Record<string, any>;
}

export interface SubmissionLog {
  id?: string;
  date: string;
  taskId: string;
  category: string;
  score?: number;
  status: 'completed' | 'in_progress' | 'overdue' | 'pending' | string;
  videoSubmissionUrl?: string;
  painScreen?: string | boolean;
  notes?: string;
  timestamp?: string;
}

export interface PatientAppointmentRecord {
  id?: string;
  date: string;
  time: string;
  title: string;
  dentistName?: string;
  status?: 'pending' | 'completed' | 'cancelled';
  notes?: string;
}

export interface Patient {
  id: string;
  hn: string; // Hospital Number
  qrToken?: string; // Unique QR Token bound to patient
  title?: string; // คำนำหน้า เช่น ด.ช. / ด.ญ.
  firstName: string;
  lastName: string;
  nickname: string;
  age: number;
  gender?: 'ชาย' | 'หญิง' | 'อื่นๆ' | string;
  dob?: string; // YYYY-MM-DD
  citizenId?: string; // เลขบัตรประชาชน 13 หลัก
  weight: number; // Kg
  height: number; // Cm
  startDate: string; // YYYY-MM-DD
  createdAt?: string; // e.g. "2026-09-05 19:34:00" or ISO String
  createdDate?: string; // ISO String or YYYY-MM-DD
  phone: string;
  parentName?: string;
  parentPhone?: string;
  address?: string; // Patient's address
  notes: string;
  status: 'active' | 'completed' | 'on-hold';
  photoBefore?: string; // Base64 or URL
  photoAfter?: string;  // Base64 or URL
  avatarUrl?: string;   // User profile avatar image (Base64 or URL)
  growthStage?: string;
  firstAppointmentDate?: string;
  firstAppointmentTime?: string;
  treatmentGoals?: string[]; // Treatment goals & targets
  lockedDates?: string[]; // Dates where homework is locked after final submit
  beforeAfterImages?: any[];

  // Single Source of Truth sub-objects
  profile?: PatientProfileInfo;
  assignedOMT?: string[];
  assignedExercises?: string[];
  assignedSleepEF?: Record<string, any>;
  assignedGNS?: Record<string, any>;
  submissions?: SubmissionLog[];
  appointments?: PatientAppointmentRecord[];

  // Check-in tracking
  checkInHistory?: CheckInRecord[];
  lastCheckIn?: string; // YYYY-MM-DD
  usageTracker?: DailyUsageTracker[];
  // Nutrition & Composite Score data
  nutritionLogs?: NutritionLog[];
  sleepLogs?: SleepLog[];
  sleepMonthlyProfiles?: SleepMonthlyProfile[];
  efRecordLogs?: EFRecordLog[];
  exerciseLogs?: ExerciseLog[];
  growthLogs?: GrowthLog[];
  eatingBehavior?: EatingBehaviorChecklist;
  sleepScore?: number;
  exerciseScore?: number;
  orofacialScore?: number;
  familyParticipationScore?: number;
  assignments?: HomeworkAssignment[];
  assignedTasks?: string[];
  progress?: PatientProgress;
}

export interface SleepDomains {
  durationScore: number; // 0-2 (ด้านที่ 1: ระยะเวลานอน)
  continuityScore: number; // 0-2 (ด้านที่ 2: หลับต่อเนื่อง)
  breathingScore: number; // 0-2 (ด้านที่ 3: การหายใจขณะหลับ)
  onsetScore: number; // 0-2 (ด้านที่ 4: การหลับ)
  daytimeScore: number; // 0-2 (ด้านที่ 5: ตอนเช้า/กลางวัน)
}

export interface SleepRedFlags {
  snoringRegularly: boolean; // กรนเป็นประจำ
  mouthBreathingRegularly: boolean; // อ้าปากหายใจขณะหลับเป็นประจำ
  apneaObserved: boolean; // สังเกตว่าหยุดหายใจ/หายใจเฮือก
  excessiveSweating: boolean; // เหงื่อออกมากผิดปกติ
  excessiveDaytimeSleepiness: boolean; // ง่วงมากผิดปกติในตอนกลางวัน/หลับในโรงเรียน
}

export interface SleepCustomization {
  snoringTrackingEnabled?: boolean;
  mouthBreathingEnabled?: boolean;
  morningFreshnessEnabled?: boolean;
  efApplianceTrackingEnabled?: boolean;
  targetSleepHours?: number;
  targetEfHours?: number;
}

export interface SleepLog {
  id: string;
  date: string; // YYYY-MM-DD
  dayNumber?: number; // Day 1 - 31
  duration: number; // calculated sleep duration in hours
  quality: number; // 1-5 (Sleep Quality Score)
  snoring: boolean;
  mouthBreathing: boolean;
  isMock?: boolean;
  notes?: string;

  // Daily Sleep & EF Record Fields (from Growth Lab Monthly Form):
  bedtime?: string; // e.g. "21:30"
  actualSleepTime?: string; // e.g. "22:00"
  wakeTime?: string; // e.g. "06:30"
  nighttimeAwakenings?: number; // e.g. 0, 1, 2, 3+
  snoringMouthBreathingScore?: number; // 0: ปกติ, 1: มีปานกลาง/บางครั้ง, 2: รุนแรง/บ่อย
  morningCondition?: string; // "สดชื่นแจ่มใส" | "สดชื่นปานกลาง" | "ตื่นยาก/ง่วงนอน/อ่อนเพลีย"

  // EF Appliance Wear Recording:
  efWorn?: boolean; // ใส่อุปกรณ์ EF หรือไม่ (yes/no)
  efDurationHours?: number; // จำนวนชั่วโมงที่ใส่ EF (e.g. 8.0)
  efRemovedDuringNight?: boolean; // หลุด/ถอดระหว่างคืนหรือไม่ (yes/no)
  efRemovalReason?: string; // สาเหตุที่ถอด/หลุด e.g. "อ้าปาก/หลุดเอง", "เจ็บฟัน/ตึง", "รำคาญ/ถอดออก", "อึดอัด/หายใจไม่สะดวก", "อื่นๆ"

  // Detailed Clinical Sleep Calculation Fields:
  domains?: SleepDomains;
  sleepRawScore?: number; // 0-10
  redFlags?: SleepRedFlags;
  hasRedFlag?: boolean;
  redFlagGuidance?: string[];
  calculationDetail?: string;
}

export interface SleepMonthlyProfile {
  id: string; // unique ID
  month: string; // e.g. "2026-08"
  weight?: number;
  height?: number;
  growthStage?: string;
  recorder?: string;
  generalNotes?: string;
  caregiverNotes?: string;
  monthlyTrend?: 'ดีขึ้น' | 'คงที่' | 'แย่ลง';
  whatWorked?: string; // สิ่งที่ปรับปรุงแล้วได้ผล
  whatToImprove?: string; // สิ่งที่ต้องปรับปรุงต่อ
  // Specific checkboxes for Red Flags to notify dentist/physician
  alertSnoring?: boolean;
  alertApnea?: boolean;
  alertDaytimeSleepiness?: boolean;
  alertSoreMouth?: boolean;
  alertOther?: boolean;
  alertOtherText?: string;
  // Doctor referral info
  redFlagContactDate?: string;
  redFlagContactReason?: string;
}

export interface EFRecordLog {
  id: string;
  date: string; // YYYY-MM-DD
  status: 'yet' | 'worn' | 'failed'; // yet = ยังไม่ได้บันทึก, worn = ใส่ EF แล้ว, failed = ใส่ไม่ได้
  efWorn: boolean; // true = ใส่ได้, false = ใส่ไม่ได้
  durationHours?: number; // hours
  removedDuringNight?: boolean;
  removalReason?: string;
  notes?: string;
}

export interface GrowthAssessment {
  height: number; // cm
  weight: number; // kg
  bmi: number; // weight / ((height/100)^2)
  age?: number;
  sex?: 'male' | 'female' | 'ชาย' | 'หญิง';
  previousHeight?: number; // cm
  previousMeasurementDate?: string; // YYYY-MM-DD
  heightVelocity?: number; // cm/year
  growthStage?: string; // 'Pre-pubertal' | 'Pubertal Growth Spurt' | 'Post-pubertal'
  skeletalMaturity?: string; // 'Normal' | 'Early' | 'Delayed'
}

export interface GrowthLog {
  id: string;
  date: string;
  height: number;
  weight: number;
  bmi: number;
  previousHeight?: number;
  previousMeasurementDate?: string;
  heightVelocity?: number | null;
  growthStage?: string;
  skeletalMaturity?: string;
  exerciseScore?: number;
  sleepScore?: number;
  painStatus?: string;
  redFlagStatus?: string;
  notes?: string;
}

export interface DailyPhysicalActivity {
  activeDaysPerWeek: number; // 0-7
  activityType: string;
  averageMinutesPerDay: number; // minutes
}

export interface JumpBoneLoading {
  selectedActivities: string[]; // e.g. ['กระโดดเชือก', 'บาสเกตบอล', 'ยิมนาสติก']
  daysPerWeek: number; // 0-7
  approximateJumpContacts: number; // jumps/session
  durationPerSession: number; // minutes
}

export interface StrengthTraining {
  daysPerWeek: number; // 0-7
  selectedExercises: string[]; // e.g. ['Bodyweight Squat', 'Push-up', 'Core/Plank']
  sets: number;
  repetitionsPerSet: number;
}

export interface LandingQuality {
  softLanding: boolean; // ลงน้ำหนักนุ่มนวล
  kneeAlignment: boolean; // เข่าไม่บิดเข้าข้างใน
  trunkControl: boolean; // ควบคุมลำตัวได้ดี
  painFreeDuringActivity: boolean; // ไม่เจ็บขณะทำกิจกรรม
  needsImprovement?: string;
}

export interface PainAndInjury {
  painPresent: boolean;
  painLocations: string[]; // e.g. ['เข่า', 'ข้อเท้า', 'ส้นเท้า/เอ็นร้อยหวาย', 'หลัง']
  painScore: number; // 0-10
}

export interface ExerciseDailySummaryItem {
  dayName: string; // 'จันทร์', 'อังคาร', ...
  date?: string;
  active60Min: boolean;
  jumpImpact: boolean;
  strengthTraining: boolean;
  noPain: boolean;
}

export interface ExerciseMonthlyGoals {
  monthlyGoal?: string;
  activityGoal?: string;
  jumpGoal?: string;
  strengthGoal?: string;
  sportPlayGoal?: string;
  behavioralGoal?: string;
}

export interface ExerciseLog {
  id: string;
  date: string;
  type: string;
  duration: number; // minutes
  consistency: number; // 1-5 (Exercise Score)
  notes?: string;

  // Detailed Clinical Exercise Assessment Fields:
  growth?: GrowthAssessment;
  dailyActivity?: DailyPhysicalActivity;
  jumpLoading?: JumpBoneLoading;
  strength?: StrengthTraining;
  landingQuality?: LandingQuality;
  painInjury?: PainAndInjury;

  exerciseScore?: number; // 1-5 calculated
  exerciseScoreLabel?: string;
  calculationDetail?: string;

  weeklySummary?: ExerciseDailySummaryItem[];
  monthlyGoals?: ExerciseMonthlyGoals;
}

export interface NutritionLog {
  id: string;
  date: string;
  protein: number; // 0-5
  calciumVitD: number;
  vegFruit: number;
  foodQuality: number;
  waterConsistency: number;
  totalScore: number;
}

export interface EatingBehaviorChecklist {
  chewBothSides: boolean;
  chewSlowly: boolean;
  noMobile: boolean;
  drinkWater: boolean;
  familyMeal: boolean;
}

export type EFCategory = 
  | 'breathing' 
  | 'lips' 
  | 'tongue' 
  | 'swallowing' 
  | 'cheek_jaw' 
  | 'strength' 
  | 'posture' 
  | 'daily' 
  | 'ventilation' 
  | 'muscle'
  | 'jump'
  | 'strength'
  | 'core'
  | 'movement'
  | 'nutrition'
  | 'sleep'
  | 'appliance';

export type AnatomyPart = 'ริมฝีปาก' | 'แก้ม' | 'ขากรรไกร' | 'ลิ้น' | 'ทางเดินหายใจ' | 'โครงสร้างใบหน้า' | 'กระดูกและข้อต่อ';

export type DataEnvironment = 'DEMO' | 'PRODUCTION';

export type ClinicalSourceVerificationStatus = 'PENDING VERIFICATION' | 'VERIFIED CLINICAL SOURCE';

export interface ClinicalSourceSection {
  sectionTitle: string;
  contentLines: string[];
}

export interface ClinicalSourceDocument {
  id: string;
  code: string;
  title: string;
  category: 'GNS_COMPOSITE' | 'SLEEP_SYSTEM' | 'EXERCISE_MOVEMENT' | 'SLEEP_MONTHLY';
  version: string;
  addedDate: string;
  status: ClinicalSourceVerificationStatus;
  description: string;
  fileName: string;
  imageSrc?: string;
  sections: ClinicalSourceSection[];
  verifiedBy?: string;
  verificationDate?: string;
}

export type ClinicalSourceStatus = 'VERIFIED' | 'UNVERIFIED' | 'SOURCE_REQUIRED' | 'PENDING VERIFICATION';

export type SourceStatus = 'VERIFIED' | 'UNVERIFIED' | 'MOCK' | 'REMOVED' | 'SOURCE_REQUIRED' | 'PENDING VERIFICATION';

export interface Exercise {
  id: string;
  code?: string;
  title: string;
  subTitle?: string;
  description: string;
  purpose?: string;
  steps: string[];
  targetReps: number;
  reps?: string;
  durationMinutes?: number;
  difficultyLevel?: 'ง่าย' | 'ปานกลาง' | 'ยาก';
  videoUrl?: string;
  youtubeId?: string;
  imageUrl?: string;
  category: EFCategory;
  ventilationType?: 'A' | 'B' | 'C';
  relatedAnatomy?: AnatomyPart[];
  isActive?: boolean;
  // Source tracking
  sourceId?: string;
  sourceFile?: string;
  sourceStatus: SourceStatus;
}

export type HabitItemStatus = 'completed' | 'pending' | 'no_data';

export interface EFHabitLog {
  id: string;
  patientId: string;
  date: string; // YYYY-MM-DD
  breathing: HabitItemStatus;
  lipSeal: HabitItemStatus;
  tonguePosture: HabitItemStatus;
  swallowing: HabitItemStatus;
  muscleRelaxation: HabitItemStatus;
  posture: HabitItemStatus;
  exerciseExecution: HabitItemStatus;
  notes?: string;
}

export interface SessionLog {
  id: string;
  patientId: string;
  date: string; // YYYY-MM-DD
  exerciseId: string;
  repsCompleted: number;
  score: number; // 1-10 clinical score
  notes?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  hn?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  type: 'clinical' | 'online' | 'consultation' | string;
  notes?: string;
  status: 'pending' | 'completed' | 'cancelled';
  googleCalendarEventId?: string;
  googleCalendarHtmlLink?: string;
  dentistName?: string;
}

export interface SystemNotification {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  date: string;
  patientId?: string;
  read: boolean;
}

export interface ClinicSettings {
  doctorName: string;
  clinicName: string;
  phone: string;
  defaultBreathingReps: number;
  defaultVentilationReps: number;
  defaultTongueReps: number;
  defaultMuscleReps: number;
  // Extended Clinic Information
  clinicNameEn?: string;
  address?: string;
  email?: string;
  website?: string;
  additionalInfo?: string;
  clinicLogoUrl?: string;
  appsScriptWebhookUrl?: string;
  // Extended Owner Doctor Information
  doctorPhotoUrl?: string;
  doctorTitlePosition?: string;
  doctorLicenseNo?: string;
  doctorSpecialty?: string;
  serviceScope?: string;
  adminRoles?: string;
  doctorVision?: string;
  doctorBio?: string;
}

export interface StaffAccount {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  nickname?: string;
  email?: string;
  position: 'ผู้ดูแลระบบ' | 'ทันตแพทย์' | 'ผู้ช่วย' | 'เจ้าหน้าที่' | 'บุคลากรอื่น' | string;
  displayName?: string;
  phone: string;
  username: string;
  password: string;
  status: 'active' | 'inactive';
  role?: 'ADMIN' | 'DOCTOR' | 'ASSISTANT' | 'STAFF' | string;
  permissions?: {
    [key: string]: boolean;
  };
}

export interface VideoItem {
  id: string;
  title: string;
  subTitle: string;
  category: string;
  duration: string;
  description: string;
  steps: string[];
  thumbnailBg?: string;
  videoSrc?: string;
  youtubeId?: string;
  imageUrl?: string;
  videoDownloadUrl?: string;
  imageDownloadUrl?: string;
  isActive?: boolean;
}

export interface HomeworkAssignment {
  id: string;
  patientId: string;
  exerciseId: string;
  reps: number;
  durationMinutes: number;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  instruction?: string;
  videoUrl?: string;
  participantVideoUrl?: string;
  participantVideoDate?: string;
  status: 'pending' | 'doing' | 'completed' | 'overdue';
  lastSubmittedDate?: string; // YYYY-MM-DD
}

export interface PatientProgress {
  patientId: string;
  currentWeek: number; // e.g. 1, 2, 3...
  totalCompletedLessons: number;
  totalCheckIns: number;
  lastSyncTimestamp: string;
  completionRate: number; // 0-100%
  streakDays: number;
  weeklyProgress: {
    week: number;
    completed: boolean;
    completedLessons: number;
    totalLessons: number;
    score: number;
  }[];
}

export interface WeeklyLesson {
  id: string;
  week: number;
  title: string;
  subTitle: string;
  description: string;
  category: 'breathing' | 'tongue' | 'lips' | 'swallowing' | 'posture' | 'exercise';
  exercises: Exercise[];
  targetCheckIns: number;
  status: 'locked' | 'active' | 'completed';
}

