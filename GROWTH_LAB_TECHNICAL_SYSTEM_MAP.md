# GROWTH LAB — TECHNICAL SYSTEM MAP
**Project Technical Audit & Delivery Specification**  
*Document Version:* 1.0.0  
*Execution Mode:* Read-Only Audit & Codebase Inspection  
*Inspection Target:* Growth Lab Clinical & Participant Web Application

---

## 1. PROJECT STRUCTURE

### 1.1 Framework & Core Tooling
- **Core Framework:** React 19.0.1 (SPA Architecture)
- **Language:** TypeScript 5.8.2 (Strict type checking enabled)
- **Bundler & Dev Server:** Vite 6.2.3
- **Styling:** Tailwind CSS 4.1.14 (`@tailwindcss/vite` plugin, `@import "tailwindcss"` in `src/index.css`)
- **Animation:** Motion 12.23.24 (`motion/react`)
- **Icons:** Lucide React 0.546.0
- **Charts / Visualizations:** Recharts 3.10.1
- **QR Code Generation:** QRCode 1.5.4 (`qrcode`)
- **Backend / Container Layer:** Node.js / Express 4.21.2 (for container serving / preview environment)

### 1.2 Entry Points
- **Browser Entry HTML:** `/index.html` (mounts `#root` container, loads `/src/main.tsx`)
- **React Client Entry:** `/src/main.tsx` (renders `<React.StrictMode><App /></React.StrictMode>`)
- **App Shell & Main State Router:** `/src/App.tsx` (manages auth, global state, deep-link token routing, active tab rendering, role-based access guards)

### 1.3 Directory Map
```
/
├── index.html                           # Single-page HTML entry point
├── package.json                         # Dependencies and build scripts
├── tsconfig.json                        # TypeScript configuration
├── tsconfig.app.json / tsconfig.node.json
├── vite.config.ts                       # Vite configuration with Tailwind CSS plugin
├── metadata.json                        # App metadata & capabilities
├── src/
│   ├── main.tsx                         # React root DOM renderer
│   ├── App.tsx                          # App state, role guard, tab router, modal triggers
│   ├── types.ts                         # Complete domain types, models, interfaces, enums
│   ├── data.ts                          # Seed data (patients, exercises, videos, clinical sources)
│   ├── index.css                        # Global CSS importing Tailwind CSS
│   ├── utils.ts                         # General helper utilities
│   ├── assets/
│   │   ├── growth_lab_logo.png          # Primary official logo image asset
│   │   ├── logo.ts                      # Logo asset export definitions
│   │   └── images/                      # Clinical reference image assets (e.g. exercise_movement.jpg)
│   ├── components/
│   │   ├── Logo.tsx                     # Global locked Master Logo component
│   │   ├── GLIcon.tsx / NLLogo.tsx      # Symbol and secondary logo components
│   │   ├── ParticipantCheckInPortal.tsx # Pure mobile check-in portal opened via QR deep link
│   │   ├── QRCodeCheckIn.tsx            # Staff QR generation & scanning modal
│   │   ├── Dashboard.tsx                # Clinical overview & system analytics dashboard
│   │   ├── PatientDashboard.tsx         # Participant/Caregiver portal view
│   │   ├── PatientsList.tsx             # Patient directory & registry
│   │   ├── PatientProfile.tsx           # Individual participant multi-tab profile
│   │   ├── PatientContextBar.tsx        # Active patient sticky context selector
│   │   ├── CheckInView.tsx              # Staff-side check-in management view
│   │   ├── CheckInAnalyticsPanel.tsx    # Consistency & active/dormant analytics
│   │   ├── AssignedExercisesView.tsx    # Participant's assigned homework view
│   │   ├── ExerciseTracker.tsx          # EF / OMT exercise tracker
│   │   ├── ExerciseTrainer.tsx          # Interactive exercise session timer
│   │   ├── ExerciseReference.tsx        # EF clinical reference database
│   │   ├── HomeworkAssignmentManager.tsx# Staff homework assignment modal/tool
│   │   ├── HomeworkProgress.tsx         # Weekly lesson & homework progress view
│   │   ├── SleepTracker.tsx             # 31-day sleep log tracker & analysis
│   │   ├── SleepReference.tsx           # Sleep clinical criteria reference
│   │   ├── GrowthNutritionScore.tsx     # GNS composite scoring tool
│   │   ├── NutritionTracker.tsx         # Nutrition & eating behavior logger
│   │   ├── GNSReference.tsx             # GNS clinical reference
│   │   ├── BeforeAfter.tsx              # Photo comparison & timeline module
│   │   ├── TreatmentRecords.tsx         # Clinical notes & appointment logs
│   │   ├── AppointmentsList.tsx         # Clinical appointment scheduler
│   │   ├── AdminExecutiveSummary.tsx    # Executive system summary
│   │   ├── ClinicalSourceManager.tsx    # Clinical documentation & verification manager
│   │   ├── DocumentViewer.tsx           # Clinical source viewer modal
│   │   ├── StaffManagement.tsx          # Staff account & permission manager
│   │   ├── StaffProfile.tsx             # Staff member profile view
│   │   ├── SettingsPanel.tsx            # Organization & clinic settings
│   │   ├── NotificationsPanel.tsx       # System notification center
│   │   ├── VideoModule.tsx              # Demonstration video library
│   │   ├── VideoPlayer.tsx              # Video player modal
│   │   ├── UserGuide.tsx                # Clinical user guide & manual
│   │   ├── WelcomeModal.tsx             # Onboarding modal
│   │   ├── InitialAdminSetupModal.tsx   # First-run admin initialization
│   │   ├── PDFExporter.tsx              # Printable clinical reports
│   │   ├── AmbientBackground.tsx        # Visual backdrop
│   │   └── ui/                          # Sub-components (FeedbackBanner, Modal, etc.)
│   ├── services/
│   │   ├── authService.ts               # Local authentication & role session management
│   │   └── adminAccountService.ts       # Super admin credentials & initialization
│   └── utils/
│       ├── checkInCalculations.ts       # Check-in metrics, consistency %, status computation
│       ├── clinicalCalculations.ts      # Sleep duration, scoring, adherence algorithms
│       ├── qrCodeGenerator.ts           # Token generator & deep link URL creator
│       └── systemSummaryCalculations.ts # System-wide overview & monthly stats
```

---

## 2. ROUTING MAP

Routing in Growth Lab is state-driven inside `/src/App.tsx` governed by `activeTab`, `userRole`, `selectedPatientId`, and URL query parameters (`?token=` or `?member=`).

| Route / Active Tab | Role Access | Primary Component | Functional Description |
| :--- | :--- | :--- | :--- |
| **URL `/?token=<TOKEN>`** | Public / Participant | `ParticipantCheckInPortal` | **Participant Mobile Check-in**: Direct access via QR scan. Automatically identifies participant, bypasses staff shell, enables 1-tap check-in, exercise item selection, and save. |
| **`Dashboard`** | Staff, Doctor, Admin | `Dashboard` | Clinical overview, daily check-in stats, active/at-risk counts, patient shortcuts. |
| **`หน้าหลัก`** | Participant / Caregiver | `PatientDashboard` | Participant personal dashboard (summary, today's exercises, streak, progress). |
| **`ผู้รับการดูแล` / `ผู้เข้าโปรแกรม`** | Staff, Doctor, Admin | `PatientsList` / `PatientProfile` | Patient directory. When a patient is selected (`selectedPatientId`), renders `PatientProfile` with all clinical tabs. |
| **`Check-In` / `QR`** | Staff, Doctor, Admin | `CheckInView` | Staff check-in workstation, QR code generator modal (`QRCodeCheckIn`), manual check-in recorder, history table. |
| **`Check-In` (when `isPatient`)** | Participant | `ParticipantCheckInPortal` | Direct participant self check-in view. |
| **`แบบฝึกหัดที่ได้รับมอบหมาย`** | Participant | `AssignedExercisesView` | Personal homework exercises, instructions, completion checkboxes. |
| **`EF / แบบฝึก`** | Staff, Doctor | `ExerciseTracker` | Orofacial myofunctional therapy (OMT) / EF clinical exercise module. |
| **`GNS` / `โภชนาการ`** | Staff, Doctor | `GrowthNutritionScore` | Growth & Nutrition Score logger, eating behavior checklist. |
| **`การนอน` / `การนอนหลับ`** | Staff, Doctor | `SleepTracker` | 31-day sleep log, EF appliance wear duration, snoring/apnea red flag tracking. |
| **`การออกกำลังกาย` / `การเคลื่อนไหว`** | Staff, Doctor | `ExerciseTracker` (Physical mode) | Jump bone loading, daily physical activity, strength exercises. |
| **`Before / After` / `ก่อน / หลัง`** | Staff, Doctor, Participant | `BeforeAfter` | Photo comparison, timeline of dental arches, facial posture, X-rays. |
| **`ติดตามผล` / `ติดตามการรักษา`** | Staff, Doctor | `PatientProfile` (Sub-tab: `ติดตามการรักษา`) | Consolidated progress graphs, compliance scores, session histories. |
| **`นัดหมาย`** | Staff, Doctor | `AppointmentsList` | Clinical appointment scheduling and calendar. |
| **`วิดีโอ` / `วิดีโอสาธิต`** | All Roles | `VideoModule` | Clinical video library with embedded demonstration videos. |
| **`คู่มือ` / `คู่มือการใช้งาน`** | All Roles | `UserGuide` | System manual, clinical guidelines, protocol explanations. |
| **`การแจ้งเตือน`** | All Roles | `NotificationsPanel` | System alerts, overdue check-in reminders, follow-up flags. |
| **`โปรไฟล์` / `โปรไฟล์ของฉัน`** | Participant | `PatientProfile` (Scoped) | Personal patient demographic and treatment overview. |
| **`บุคลากร` / `Staff Management`** | Owner, Admin, Developer | `StaffManagement` | Staff directory, permissions assignment, account credentials. |
| **`Clinical Source`** | Owner, Admin, Developer | `ClinicalSourceManager` | Clinical documentation verification and medical source tracking. |
| **`Executive Summary`** | Owner, Admin, Developer | `AdminExecutiveSummary` | System-level health, monthly active metrics, data export. |
| **`ตั้งค่า` / `Organization Settings`**| Owner, Admin, Developer | `SettingsPanel` | Clinic profile, doctor credentials, clinical threshold configurations. |

---

## 3. DATA MODEL & STATE STORAGE

### 3.1 Domain Interfaces (`/src/types.ts`)

```typescript
// 1. Patient / Participant Record
export interface Patient {
  id: string;                       // Unique key (e.g. 'pat_001')
  hn: string;                       // Hospital Number (e.g. 'DEMO-10021')
  qrToken?: string;                 // Bound QR Token (e.g. 'tok_pat_001_demo10021')
  firstName: string;
  lastName: string;
  nickname: string;
  age: number;
  weight: number;
  height: number;
  startDate: string;                // YYYY-MM-DD
  phone: string;
  parentName?: string;
  parentPhone?: string;
  notes: string;
  status: 'active' | 'completed' | 'on-hold';
  
  // Check-In Data
  checkInHistory?: CheckInRecord[]; // Array of check-in records
  lastCheckIn?: string;             // YYYY-MM-DD
  
  // Exercise & Homework
  assignments?: HomeworkAssignment[];
  progress?: PatientProgress;
  
  // Clinical Logs
  sleepLogs?: SleepLog[];
  nutritionLogs?: NutritionLog[];
  efRecordLogs?: EFRecordLog[];
  exerciseLogs?: ExerciseLog[];
  eatingBehavior?: EatingBehaviorChecklist;
  beforeAfterImages?: any[];
  
  // Scores
  sleepScore?: number;
  exerciseScore?: number;
  orofacialScore?: number;
  familyParticipationScore?: number;
}

// 2. Check-In Record
export interface CheckInRecord {
  id: string;                       // 'chk_<timestamp>_<random>'
  patientId: string;                // Foreign Key -> Patient.id
  date: string;                     // YYYY-MM-DD
  timestamp: string;                // e.g. "08:30 น."
  source: 'APP' | 'QR';             // Source of check-in
  method?: 'participant_self_check_in' | 'staff_recorded_check_in' | string;
  actor?: string;                   // Person who triggered check-in
  performedBy?: string;
  status?: 'COMPLETED' | 'CONFIRMED' | 'SUCCESS';
  notes?: string;
  clinicId?: string;
}

// 3. Homework Assignment (Exercise Completion Tracking)
export interface HomeworkAssignment {
  id: string;                       // 'asgn_<patientId>_<num>'
  patientId: string;                // Foreign Key -> Patient.id
  exerciseId: string;               // Foreign Key -> Exercise.id (e.g. 'EF-001')
  reps: number;
  durationMinutes: number;
  startDate: string;                // YYYY-MM-DD
  endDate?: string;
  instruction?: string;
  status: 'pending' | 'doing' | 'completed' | 'overdue';
  lastSubmittedDate?: string;       // YYYY-MM-DD
}

// 4. Exercise Definition
export interface Exercise {
  id: string;                       // e.g. 'EF-001', 'breathing_1'
  title: string;
  subTitle?: string;
  description: string;
  steps: string[];
  targetReps: number;
  durationMinutes?: number;
  difficultyLevel?: 'ง่าย' | 'ปานกลาง' | 'ยาก';
  category: EFCategory;
  sourceId?: string;                // Foreign Key -> ClinicalSourceDocument.id
  sourceStatus: SourceStatus;       // 'VERIFIED' | 'UNVERIFIED' | etc.
}
```

### 3.2 Key Linkages & Storage Keys
- **Primary Linking Key:** `patient.id` links `Patient` ↔ `CheckInRecord` ↔ `HomeworkAssignment` ↔ `SleepLog` ↔ `SessionLog`.
- **QR Linking Key:** `patient.qrToken` (or fallback to `patient.id` / `patient.hn`) connects deep-link URL to `Patient`.
- **Exercise Linking Key:** `assignment.exerciseId` connects `HomeworkAssignment` to `Exercise`.
- **LocalStorage Keys:**
  - `growth_lab_patients` (Stores `Patient[]` with embedded `checkInHistory` and `assignments`)
  - `growth_lab_auth` (Stores current `UserAccount`)
  - `growth_lab_logs` (Stores `SessionLog[]`)
  - `growth_lab_appointments` (Stores `Appointment[]`)
  - `growth_lab_staff_accounts` (Stores `StaffAccount[]`)
  - `growth_lab_clinical_sources` (Stores `ClinicalSourceDocument[]`)
  - `growth_lab_videos` (Stores `VideoItem[]`)
  - `growth_lab_settings` (Stores `ClinicSettings`)
  - `growth_lab_selected_patient_id` (Stores active patient ID in session)

---

## 4. MEMBER DATA FLOW

```
[1. Member Creation]
   └─ File: src/components/PatientsList.tsx (handleCreatePatient)
   └─ Creates Patient object with unique ID (e.g. 'pat_1718000000') & generated qrToken ('tok_pat_...')
   └─ Persisted into localStorage ('growth_lab_patients') via App.tsx state.

[2. Profile Setup & Assignments]
   └─ File: src/components/HomeworkAssignmentManager.tsx & PatientProfile.tsx
   └─ Staff assigns OMT/EF exercises -> generates HomeworkAssignment[] attached to patient.assignments.

[3. QR Code Generation]
   └─ File: src/utils/qrCodeGenerator.ts (getParticipantDeepLink) & src/components/QRCodeCheckIn.tsx
   └─ URL generated: https://<domain>/?token=<qrToken>

[4. Participant Check-In (Mobile Scan)]
   └─ File: src/App.tsx (useEffect token extractor) -> src/components/ParticipantCheckInPortal.tsx
   └─ Token matched -> user authenticated as PATIENT role -> loads ParticipantCheckInPortal.
   └─ User taps "บันทึก Check-in" -> triggers handleCheckIn(patient.id, 'QR').

[5. Exercise Selection & Save]
   └─ File: src/components/ParticipantCheckInPortal.tsx (handleSaveProgress)
   └─ Updates assignment statuses to 'completed' with lastSubmittedDate = today.
   └─ Persisted to localStorage ('growth_lab_patients').

[6. Score & Consistency Calculation]
   └─ File: src/utils/checkInCalculations.ts (calculateConsistencyMetrics, calculateUserStatus)
   └─ Computes: totalCheckIns, consistencyPercent (0-100%), weeklyCount, status (ACTIVE / AT RISK / DORMANT / INACTIVE).

[7. Dashboard & Analytics Summary]
   └─ Files: src/components/Dashboard.tsx, CheckInAnalyticsPanel.tsx, AdminExecutiveSummary.tsx
   └─ Aggregates live numbers: active users, today's check-ins, monthly compliance rate.
```

---

## 5. CHECK-IN FLOW (DEEP-DIVE)

1. **QR Creation:**
   - Generated by `src/utils/qrCodeGenerator.ts` using `patient.qrToken` (format: `tok_<id>_<hn_alphanumeric>`).
   - Deep link URL format: `${window.location.origin}/?token=${patient.qrToken}`.
2. **Deep Link Ingestion:**
   - When opened in mobile browser, `src/App.tsx` (lines 634-699) runs a dedicated extraction effect parsing `window.location.search`, hash, and pathname.
3. **Participant Identification:**
   - Matches token against `patients.find(p => p.qrToken === token || p.id === token || p.hn === token)`.
   - Calls `authService.login('PATIENT', foundPatient.id, foundPatient.firstName)`.
   - Sets `userRole = 'PATIENT'`, `isAuthenticated = true`, `selectedPatientId = foundPatient.id`, `activeTab = 'Check-In'`.
4. **Portal Rendering:**
   - Renders `src/components/ParticipantCheckInPortal.tsx` in a clean, standalone, mobile-responsive layout (no sidebar, no doctor chrome).
5. **Check-In Recording:**
   - User taps Check-in button -> calls `handleCheckIn(patient.id, 'QR')`.
   - Appends `CheckInRecord` to `patient.checkInHistory`:
     - `id`: `chk_<timestamp>_<rand>`
     - `date`: `YYYY-MM-DD` (Thai formatted for display)
     - `timestamp`: Current Thai time (e.g. `08:30 น.`)
     - `source`: `'QR'`
     - `method`: `'participant_self_check_in'`
     - `performedBy`: Participant's full name.
     - `status`: `'COMPLETED'`
   - Updates `patient.lastCheckIn = today`.
   - Recalculates `patient.progress` via `syncPatientProgress(patient)`.
   - Commits state to `localStorage.setItem('growth_lab_patients', ...)`.
6. **Return to Profile:**
   - Data is immediately reflected in `patient.checkInHistory` across all staff views, patient dashboards, and analytics panels.

---

## 6. EXERCISE & COMPLETION FLOW

1. **Source of Exercises:**
   - Master exercise database in `src/data.ts` (`VERIFIED_EXERCISES` and `CLINICAL_EXERCISES`) covering Breathing, Lip Seal, Tongue Spot, Tongue Suction, Swallowing, Cheek/Jaw, Muscle Strength.
   - Clinical reference linked to `SRC-EX-01` (`exercise_movement.jpg`).
2. **Assignment to Participant:**
   - Staff uses `src/components/HomeworkAssignmentManager.tsx` to pick exercises, reps, duration, and instructions.
3. **Participant Access:**
   - Accessible via:
     - Tab 2 inside `ParticipantCheckInPortal.tsx` (Mobile QR portal)
     - `AssignedExercisesView.tsx` (Logged-in Patient view)
4. **Completion Recording:**
   - Participant checks off completed exercises and taps **"บันทึกผลการฝึกประจำวันนี้ (Save)"**.
   - Sets `assignment.status = 'completed'` and `assignment.lastSubmittedDate = today`.
   - State saved directly to `localStorage`.
5. **Scoring Logic:**
   - **Consistency Score / Check-In Rate:** `(totalDaysCheckedIn / programDays) * 100` (capped at 100%).
   - **Exercise Completion Rate:** `(completedAssignments / totalAssignments) * 100`.
   - **Clinical Sleep Score:** 0–5 calculated from 5 domains (Duration, Continuity, Breathing, Onset, Daytime) in `src/utils/clinicalCalculations.ts`.
6. **Score Editing Permissions:**
   - Clinical scores (GNS, Sleep, Clinical Notes) can only be edited by Staff/Doctor roles in `PatientProfile.tsx`, `GrowthNutritionScore.tsx`, and `SleepTracker.tsx`.
   - Participant can only toggle completion status of their own assigned homework.

---

## 7. TRACKING & ANALYTICS

The codebase cleanly separates **Usage Tracking** from **Clinical Scores**:

### 7.1 Usage Tracking Engine (`src/utils/checkInCalculations.ts` & `systemSummaryCalculations.ts`)
- **Status Classification Algorithm:**
  - `ACTIVE`: Last check-in $\le$ 30 days ago.
  - `AT RISK`: Last check-in 31–60 days ago.
  - `DORMANT`: Last check-in 61–90 days ago.
  - `INACTIVE`: Last check-in $>$ 90 days ago or 0 check-ins.
- **Check-In Metrics:**
  - `totalCheckIns`: Total records in `patient.checkInHistory`.
  - `weeklyCount`: Check-ins in past 7 calendar days.
  - `monthlyCount`: Check-ins in past 30 calendar days.
  - `consistencyPercent`: Percentage of program days with check-in.
- **Monthly Overview Metrics (`calculateSystemOverviewMetrics`):**
  - `totalPatients`: Total registered patients.
  - `newUsersThisMonth`: Patients with `startDate` in current `YYYY-MM`.
  - `checkInsThisMonth`: Count of all check-in records across all patients in current `YYYY-MM`.
  - `activeUsersCount` / `atRiskUsersCount` / `dormantUsersCount` / `inactiveUsersCount`.

### 7.2 Clinical / Scoring Engine (`src/utils/clinicalCalculations.ts`)
- **Sleep Quality Score (1–5):** Evaluated from 5 clinical domains + Snoring / Mouth Breathing scores.
- **EF Appliance Wear Adherence:** Days worn vs total recorded days, average nightly wear hours, removal reason distribution.
- **GNS Score:** Composite dietary, chewing balance, hydration, and meal habit scores.

---

## 8. MEMBER PROFILE CONSOLIDATION

**Component:** `/src/components/PatientProfile.tsx`  
When a patient is selected, all member data is rendered in a unified interface containing sub-tabs:

1. **ภาพรวม (Overview):** Demographics, HN, contact, status badge, quick stats, active assignments, latest check-in.
2. **การบ้าน & Check-in (Homework & Compliance):** Check-in history list, consistency meter, active assignments with completion checkboxes, Homework Assignment Modal trigger.
3. **EF / แบบฝึกหัด (EF & OMT Tracker):** Orofacial muscle exercises, rep tracking, trainer session launcher.
4. **การนอนหลับ (Sleep Profile):** 31-day sleep calendar, EF appliance wear logs, sleep domain metrics, apnea/snoring red flag alerts.
5. **โภชนาการ (GNS & Nutrition):** Eating behavior checklist (chew both sides, slow chewing, no screens), food quality scores.
6. **ก่อน / หลัง (Before & After):** Photos, Lateral Ceph X-rays, Bone age assessments, facial symmetry images.
7. **ติดตามการรักษา (Treatment & Records):** Clinical SOAP notes, appointment history, session logs.

---

## 9. CLINICAL SOURCE & VERIFICATION SYSTEM

**Component:** `/src/components/ClinicalSourceManager.tsx` & `/src/components/DocumentViewer.tsx`  
**Data Source:** `src/data.ts` (`INITIAL_CLINICAL_SOURCE_DOCUMENTS`)  
**Storage:** `localStorage.getItem('growth_lab_clinical_sources')`

### Document Structure & Statuses
- **Document Interface:** `ClinicalSourceDocument`
  - `id`: Unique source ID (e.g. `'SRC-EX-01'`, `'SRC-SL-01'`, `'SRC-GNS-01'`)
  - `code`: Reference code (e.g. `'REF-OMT-2026'`)
  - `category`: `'GNS_COMPOSITE'` | `'SLEEP_SYSTEM'` | `'EXERCISE_MOVEMENT'` | `'SLEEP_MONTHLY'`
  - `status`: `'VERIFIED CLINICAL SOURCE'` | `'PENDING VERIFICATION'`
  - `fileName`: Reference file path (e.g. `'exercise_movement.jpg'`)
  - `sections`: Array of `{ sectionTitle, contentLines }`
  - `verifiedBy`: Name of doctor who verified document.
  - `verificationDate`: Date of verification.
- **Verification Action:** Authorized medical staff can toggle document status to `'VERIFIED CLINICAL SOURCE'`.

---

## 10. MOBILE & RESPONSIVE DESIGN

- **Mobile Viewport Optimization:**
  - Uses Tailwind CSS responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`).
  - Dynamic viewport height support (`min-h-[100dvh]`, `h-[100dvh]`).
- **Touch Ergonomics:**
  - Explicit `touch-manipulation` classes on interactive buttons in `ParticipantCheckInPortal.tsx`.
  - Button touch targets conform to $\ge 44\text{px} - 54\text{px}$ minimum height.
  - Checkboxes styled with generous padding ($28\text{px} \times 28\text{px}$ hit areas).
- **Mobile Menu & Shell:**
  - `src/App.tsx` contains mobile top bar with hamburger toggle (`isMobileMenuOpen`).
  - Mobile slide-over drawer navigation with `useScrollLock` to prevent background scrolling when menu is active.

---

## 11. LOGO & BRAND ASSETS

### Global Brand Asset Rules (Protected)
- **Master Component:** `/src/components/Logo.tsx`
- **Asset Reference:** `/src/assets/logo.ts` importing `/src/assets/growth_lab_logo.png`
- **Secondary Symbol Component:** `/src/components/GLIcon.tsx`
- **Usage Across App:**
  - `Sidebar` (Desktop Staff Navigation)
  - `LandingPage` (Login Screen)
  - `ParticipantCheckInPortal` (Mobile QR Check-in Header)
  - `PatientDashboard` (Patient Home)
  - `Dashboard` & `AdminExecutiveSummary`
- **Integrity Rule:** Rendered seamlessly with transparent background; no opaque white cards; colors, aspect ratio, and artwork are strictly locked.

---

## 12. STORAGE & PERSISTENCE ARCHITECTURE

The application currently operates on **Client-Side Browser Storage (LocalStorage & SessionStorage)** with seed data hydration:

| Data Entity | LocalStorage Key | Fallback / Seed Source |
| :--- | :--- | :--- |
| **Patient Directory** | `growth_lab_patients` | `SEED_PATIENTS` in `src/data.ts` |
| **Authentication Session** | `growth_lab_auth` | None (redirects to Landing Page) |
| **Clinical Session Logs** | `growth_lab_logs` | `[]` |
| **Appointments** | `growth_lab_appointments` | `SEED_APPOINTMENTS` in `src/data.ts` |
| **Staff Accounts** | `growth_lab_staff_accounts` | `SEED_STAFF_ACCOUNTS` in `src/data.ts` |
| **Clinical Source Docs** | `growth_lab_clinical_sources` | `INITIAL_CLINICAL_SOURCE_DOCUMENTS` in `src/data.ts` |
| **Video Library** | `growth_lab_videos` | `CLINICAL_VIDEOS` in `src/data.ts` |
| **Clinic Settings** | `growth_lab_settings` | `DEFAULT_SETTINGS` in `src/data.ts` |
| **Active Patient Selection**| `growth_lab_selected_patient_id` | `sessionStorage` fallback |

*Note:* Backend server (`server.ts` / Express) serves production build assets; no external SQL or cloud database is currently connected in the client runtime.

---

## 13. KNOWN LIMITATIONS (FROM ACTUAL SOURCE CODE)

1. **Local-Only Device Persistence:**
   - Data stored in `localStorage` is tied to the individual browser/device. Check-ins performed on a patient's mobile phone persist in that mobile phone's local storage and are not automatically synchronized over the cloud to the doctor's desktop without a shared backend database.
2. **QR Deep Link Token Scope:**
   - Deep link relies on URL parameter `?token=...`. If the browser clears cache or opens in an isolated in-app webview (e.g. Line / Facebook browser without cookie persistence), the session remains active only for that in-app browser instance.
3. **No Real-Time WebSocket:**
   - Multi-device updates do not push in real-time; updates require page refresh or local state dispatch.
4. **Mock Video Embeds:**
   - Demonstration videos in `CLINICAL_VIDEOS` use YouTube embed URLs (`youtube.com/embed/...`). Offline video playback is not supported.

---

## 14. DELIVERY RISK MAP

| Level | Issue / Area | Source Code Location | Description |
| :--- | :--- | :--- | :--- |
| **P0 (Blocker)** | **Multi-device Data Sync** | `src/App.tsx` (localStorage) | Patient check-ins on mobile remain on the patient's phone; doctor desktop cannot see mobile check-ins in real-time without a centralized database API. |
| **P1 (Important)**| **In-App Browser QR Scans**| `src/App.tsx` (line 634-699) | Some Thai chat apps (e.g. Line in-app browser) isolate storage from Chrome/Safari. QR tokens must be preserved in URL on refresh. |
| **P1 (Important)**| **Patient Assignment Hydration** | `src/components/ParticipantCheckInPortal.tsx` | If a newly created patient has no assigned exercises, portal must supply fallback clinical OMT items so the user can check off exercises. |
| **P2 (Freeze)** | **Brand Asset Lock** | `src/components/Logo.tsx` | Master Growth Lab Logo and colors must remain frozen across all future refactors. |
| **P2 (Freeze)** | **Clinical Calculation Formulas** | `src/utils/clinicalCalculations.ts` | Sleep and GNS score algorithms reflect clinical protocol formulas and must not be arbitrarily modified. |

---

## 15. FINAL SYSTEM DIAGRAM

```
========================================================================================
                               PARTICIPANT WORKFLOW (MOBILE QR)
========================================================================================
[User / Participant]
        │
        ▼ (Scans QR Code via Smartphone Camera)
[URL: https://domain/?token=tok_pat_001_demo10021]
        │
        ▼
[src/App.tsx: Token Extractor Effect]
        │
        ├── Matches Patient in localStorage ('growth_lab_patients')
        ├── Authenticates as role: 'PATIENT'
        └── Routes to activeTab: 'Check-In'
        │
        ▼
[src/components/ParticipantCheckInPortal.tsx]
        │
        ├── 1. Verified Identity Header (Name, HN, Age, Today Thai Date)
        │
        ├── 2. Step 1: Check-in Action
        │      └─ User taps "✓ บันทึก Check-in ประจำวันนี้"
        │      └─ Appends CheckInRecord with timestamp to patient.checkInHistory
        │
        ├── 3. Step 2: Exercise Item Selection
        │      └─ User checks off completed daily exercises (Nasal Breathing, Lip Seal, etc.)
        │
        ├── 4. Step 3: Save Progress
        │      └─ User taps "💾 บันทึกผลการฝึกประจำวันนี้"
        │      └─ Updates patient.assignments & patient.progress
        │
        ▼
[Storage: localStorage ('growth_lab_patients')]
        │
        ▼
[Success Confirmation Modal & Consistency Statistics]
```

```
========================================================================================
                                 STAFF / DOCTOR WORKFLOW
========================================================================================
[Doctor / Staff / Admin]
        │
        ▼ (Logs in via LandingPage or Admin Credentials)
[src/App.tsx: Role-Based Tab Router]
        │
        ├──► [Dashboard.tsx]
        │      └─ System Overview (Active, At-Risk, Dormant Patients, Today's Check-ins)
        │
        ├──► [PatientsList.tsx & PatientProfile.tsx]
        │      ├─ Demographics & HN Registry
        │      ├─ Homework Assignment Manager (Assigns OMT exercises & sets target reps)
        │      ├─ Check-in History & Consistency Graph
        │      ├─ 31-Day Sleep Tracker & EF Appliance Adherence
        │      ├─ Growth Nutrition Score (GNS) Logger
        │      └─ Before/After Photo & X-Ray Timeline
        │
        ├──► [CheckInView.tsx & QRCodeCheckIn.tsx]
        │      ├─ Generates unique printable/scannable QR cards per patient
        │      └─ Manual staff-recorded check-in workstation
        │
        ├──► [ClinicalSourceManager.tsx]
        │      └─ Verifies OMT, Sleep, and GNS medical reference documents
        │
        └──► [StaffManagement.tsx & SettingsPanel.tsx]
               └─ Staff account permissions and clinic threshold settings
```

---

## 16. EXECUTIVE AUDIT SUMMARY

### WHAT EXISTS
- Complete, functional React 19 single-page application with comprehensive UI for both Clinical Staff and Participants.
- Direct Mobile QR Check-In Portal (`ParticipantCheckInPortal.tsx`) supporting deep-link token parsing, 1-tap check-in, exercise item selection, and save confirmation.
- Full clinical modules: OMT Exercise Trainer, 31-Day Sleep Logger, Growth Nutrition Score (GNS), Before/After Photo comparison, Treatment Notes, and Appointments.
- Analytics calculation engine for Active, At-Risk, Dormant, and Inactive participant categorization.
- Clinical Source Document verification system.
- Protected master Growth Lab logo implementation.

### WHAT IS LINKED
- QR deep-link token $\leftrightarrow$ Participant Identification $\leftrightarrow$ Check-In Record.
- Check-In History $\leftrightarrow$ Consistency Percentage $\leftrightarrow$ Active/At-Risk Status $\leftrightarrow$ Dashboard Analytics.
- Homework Assignments $\leftrightarrow$ Exercise Database $\leftrightarrow$ Participant Checklist $\leftrightarrow$ Patient Profile.
- LocalStorage state hydration across all components via `App.tsx` state management.

### WHAT IS NOT LINKED
- External cloud database / API sync (data resides in client `localStorage`).
- Real-time multi-device synchronization between mobile phone and clinic desktop.

### WHAT CANNOT BE CONFIRMED FROM SOURCE
- Production cloud database credentials (no Firestore/CloudSQL connection string in current client codebase).
- Hardware printer integration for QR cards (uses browser `window.print()` / PDF rendering).
