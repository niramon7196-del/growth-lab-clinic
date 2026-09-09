# GROWTH LAB — CENTRAL DATA MIGRATION PLAN
**Cross-Device Architecture & Data Synchronization Blueprint**  
*Document Version:* 1.0.0  
*Mode:* Architectural Blueprint & Migration Specification (Read-Only)  
*Context:* Resolving `CROSS-DEVICE SYNC = FAIL` to establish a shared Central Data layer between Participant Mobile Devices and Staff/Clinic Computers.

---

## 1. CURRENT DATA MODEL SUMMARY
Based directly on `/src/types.ts`, `/src/data.ts`, and `/src/App.tsx`:

### 1.1 Patient (`Patient`)
- **Identifiers:** `id` (e.g. `'pat_001'`), `hn` (e.g. `'DEMO-10021'`), `qrToken` (e.g. `'tok_pat_001_demo10021'`).
- **Demographics:** `firstName`, `lastName`, `nickname`, `age`, `weight`, `height`, `startDate`, `phone`, `parentName`, `parentPhone`, `notes`, `status` (`'active' | 'completed' | 'on-hold'`).
- **Activity & Compliance:** `checkInHistory` (`CheckInRecord[]`), `lastCheckIn` (`string`), `progress` (`PatientProgress`).
- **Homework & Exercises:** `assignments` (`HomeworkAssignment[]`).
- **Clinical Records:** `sleepLogs` (`SleepLog[]`), `nutritionLogs` (`NutritionLog[]`), `efRecordLogs` (`EFRecordLog[]`), `exerciseLogs` (`ExerciseLog[]`), `eatingBehavior` (`EatingBehaviorChecklist`), `beforeAfterImages`.
- **Composite Scores:** `sleepScore`, `exerciseScore`, `orofacialScore`, `familyParticipationScore`.

### 1.2 Check-In Record (`CheckInRecord`)
- `id`: Unique record ID (e.g. `'chk_1718000000_a1b2'`).
- `patientId`: Foreign Key linking to `Patient.id`.
- `date`: Date string `YYYY-MM-DD`.
- `timestamp`: Time string in Thai format (e.g. `'08:30 น.'`).
- `source`: `'APP' | 'QR'`.
- `method`: `'participant_self_check_in' | 'staff_recorded_check_in'`.
- `actor` / `performedBy`: Name of the individual executing the check-in.
- `status`: `'COMPLETED' | 'CONFIRMED' | 'SUCCESS'`.

### 1.3 Homework Assignment (`HomeworkAssignment`)
- `id`: Assignment ID (e.g. `'asgn_pat_001_1'`).
- `patientId`: Foreign Key linking to `Patient.id`.
- `exerciseId`: Foreign Key linking to `Exercise.id` (e.g. `'EF-001'`).
- `reps`: Target repetitions count.
- `durationMinutes`: Target duration in minutes.
- `startDate` / `endDate`: Assignment period.
- `instruction`: Custom clinical instructions.
- `status`: `'pending' | 'doing' | 'completed' | 'overdue'`.
- `lastSubmittedDate`: Date of last completion `YYYY-MM-DD`.

### 1.4 Scores & History
- **Consistency Score / Percentage:** Calculated from `checkInHistory` via `src/utils/checkInCalculations.ts`.
- **Patient Status:** `ACTIVE` ($\le 30$ days), `AT RISK` ($31-60$ days), `DORMANT` ($61-90$ days), `INACTIVE` ($> 90$ days).
- **Clinical Logs:** Append-only arrays for sleep, exercise sessions, and clinical treatment notes.

---

## 2. CURRENT STORAGE: CENTRAL VS LOCAL CLASSIFICATION

The 9 `localStorage` keys currently in use are categorized based on their cross-device requirements:

| LocalStorage Key | Target Destination | Classification Justification |
| :--- | :--- | :--- |
| **`growth_lab_patients`** | **CENTRAL DATA** | **Core Patient Master Data:** Contains patient identities, active assignments, check-in history, and clinical records. Must be accessible by both Mobile and Clinic Desktop. |
| **`growth_lab_logs`** | **CENTRAL DATA** | **Clinical Session Logs:** Records of in-clinic training sessions and clinical scores entered by staff. |
| **`growth_lab_appointments`** | **CENTRAL DATA** | **Clinic Appointments:** Shared schedule between clinic and patient. |
| **`growth_lab_staff_accounts`**| **CENTRAL DATA** | **Staff Accounts & Roles:** Staff authentication credentials and permissions. |
| **`growth_lab_clinical_sources`**| **CENTRAL DATA** | **Clinical Reference Verification:** Global clinical documents and verification status. |
| **`growth_lab_settings`** | **CENTRAL DATA** | **Organization & Clinic Config:** Clinic name, doctor profile, global rep targets. |
| **`growth_lab_videos`** | **CENTRAL DATA / CONFIG**| **Video Library:** Master catalog of clinical demonstration videos. |
| **`growth_lab_auth`** | **LOCAL (DEVICE ONLY)**| **Device Session Token:** Stores the logged-in user account / role for the specific browser instance. |
| **`growth_lab_selected_patient_id`**| **LOCAL (DEVICE ONLY)**| **UI Navigation State:** Holds the currently active patient selected on a staff workstation. |

---

## 3. SOURCE OF TRUTH MAPPING

To maintain exact business logic without changes to data meaning:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CENTRAL SOURCE OF TRUTH                       │
├──────────────────────────────┬─────────────────────────────────────────┤
│ Domain Entity                │ Central Collection / Table Reference     │
├──────────────────────────────┼─────────────────────────────────────────┤
│ Patients & Profiles          │ `patients` (Indexed by `id` & `qrToken`)│
│ Check-In Events              │ `check_ins` (or `patient.checkInHistory`)│
│ Homework Assignments         │ `assignments` (or `patient.assignments`)│
│ Clinical Logs & Notes        │ `session_logs`, `sleep_logs`, `gns_logs`│
│ Appointments                 │ `appointments`                          │
│ Staff & Roles                │ `staff_accounts`                        │
│ Master Reference Docs        │ `clinical_sources`                      │
│ Clinic Configuration         │ `clinic_settings`                       │
└──────────────────────────────┴─────────────────────────────────────────┘
```

---

## 4. CROSS-DEVICE FLOW ARCHITECTURE

### 4.1 Participant Mobile $\rightarrow$ Central Data $\rightarrow$ Staff Clinic

```
[Participant Smartphone]
   │
   ├─ 1. Scans QR Code (URL: ?token=tok_pat_001_demo10021)
   ├─ 2. Opens ParticipantCheckInPortal (fetches patient record by token)
   ├─ 3. Taps Check-In & Selects Completed Exercises
   │
   ▼ (WRITE / SYNC)
[CENTRAL DATA REPOSITORY]
   │
   ├─ Appends CheckInRecord to Patient History
   ├─ Updates HomeworkAssignment status = 'completed'
   │
   ▼ (READ / SYNC)
[Clinic Computer (Staff / Doctor Desktop)]
   │
   ├─ Dashboard updates live (Active Count, Today Check-in Count incremented)
   ├─ Patient Profile displays new Check-in timestamp (e.g. "08:30 น. ผ่าน QR Code")
   └─ Homework & Progress tab shows completed daily assignments
```

### 4.2 Staff Clinic $\rightarrow$ Central Data $\rightarrow$ Participant Mobile

```
[Clinic Computer (Staff / Doctor Desktop)]
   │
   ├─ 1. Doctor creates new patient / updates treatment plan
   ├─ 2. Staff assigns 3 OMT exercises with custom target reps
   │
   ▼ (WRITE / SYNC)
[CENTRAL DATA REPOSITORY]
   │
   ├─ Saves new Patient / updates assignments array
   │
   ▼ (READ / SYNC)
[Participant Smartphone]
   │
   ├─ Scans QR Code next morning
   └─ ParticipantCheckInPortal instantly displays the new assigned exercises
```

---

## 5. DATA OPERATIONS BREAKDOWN

| Data Entity | Operation Type | Operation Characteristic |
| :--- | :---: | :--- |
| **Check-In History (`checkInHistory`)** | **APPEND-ONLY** | Every check-in creates an immutable timestamped log (`chk_<timestamp>_<rand>`). Historical entries are never overwritten. |
| **Clinical Session Logs (`logs`)** | **APPEND-ONLY** | In-clinic treatment logs and exercise scores are appended per date. |
| **Patient Profile Demographics** | **UPDATE** | Name, weight, height, contact info updated in-place by staff. |
| **Homework Assignments (`assignments`)**| **UPDATE / SYNC**| Staff creates/updates targets; Participant toggles `status: 'completed'` / `lastSubmittedDate`. |
| **Patient Registration (`patients`)** | **CREATE** | Staff registers a new participant profile with unique `id` and `qrToken`. |
| **Clinic Appointments (`appointments`)** | **CREATE / UPDATE**| Staff creates and updates appointment dates/statuses. |

---

## 6. MEMBER IDENTIFIER & QR TOKEN ROLE

### 6.1 `patient.id` (Primary Identifier)
- **Role:** Immutable primary key across the entire system.
- **Format:** Unique string (e.g. `'pat_001'`, `'pat_1718000000'`).
- **Function:** Links patient profile to check-in logs, assignments, sleep logs, appointment records, and reports.

### 6.2 `patient.qrToken` (Access & Scannable Token)
- **Role:** Access token embedded in the deep-link URL.
- **Format:** `tok_<id>_<hn_alphanumeric>` (e.g. `'tok_pat_001_demo10021'`).
- **Function:** Allows participant mobile cameras to directly resolve the participant record without requiring manual username/password entry, while keeping internal database IDs decoupled.

---

## 7. CONFLICT & DUPLICATION RESOLUTION RULES

To prevent data corruption without adding unnecessary complexity:

1. **Multiple Devices Scanning the Same QR:**
   - Reading is purely idempotent: both devices query the central record for `qrToken` and render the same profile.
2. **Same-Day Multiple Check-Ins:**
   - **Rule:** A participant can only have **1 effective check-in per calendar date** (`YYYY-MM-DD`).
   - If a check-in already exists for `today`, subsequent scans acknowledge the existing check-in time and allow updating/saving exercise items without creating duplicate count increments in consistency analytics.
3. **Concurrent Staff & Participant Updates:**
   - Staff modifies profile metadata (e.g. Demographics, Prescribed Reps).
   - Participant modifies daily execution state (e.g. `isCompleted`, `lastSubmittedDate`).
   - Because check-in is **append-only** to history and assignment updates modify completion status, field-level merge prevents race condition data loss.

---

## 8. PRIVACY & ROLE ACCESS BOUNDARIES

Based on the existing role separation in `src/services/authService.ts` and `src/App.tsx`:

| Data Scope | Participant (Role 2) | Medical Staff (Role 1) | Admin / Owner (Role 3) |
| :--- | :---: | :---: | :---: |
| **Own Profile & HN** | **READ ONLY** | **READ / WRITE** | **READ / WRITE** |
| **Daily Check-In** | **CREATE (Self)** | **CREATE (Staff-recorded)** | **READ ONLY** |
| **Homework Completion** | **UPDATE (Complete)** | **READ / WRITE** | **READ ONLY** |
| **Prescribe Assignments** | **NO ACCESS** | **READ / WRITE** | **READ ONLY** |
| **Other Patients' Data** | **NO ACCESS (Strict)**| **READ / WRITE (Clinic scope)**| **READ / WRITE (Global)** |
| **Staff Accounts & Passwords**| **NO ACCESS** | **NO ACCESS** | **READ / WRITE** |
| **System Settings** | **NO ACCESS** | **NO ACCESS** | **READ / WRITE** |

---

## 9. MIGRATION & DATA INTEGRITY RISKS

1. **LocalStorage Data Migration:**
   - Any actual clinical records stored currently in a clinic browser's `localStorage` must be exportable/importable during the transition so existing trial data is not lost.
2. **Seed & Demo Data Isolation:**
   - `SEED_PATIENTS` (e.g. `DEMO-10021` น้องภูมิ, `DEMO-10022` น้องพิมพ์) in `src/data.ts` are demonstration fixtures.
   - Central database initialization must flag Demo records (`isDemo: true` or `hn: 'DEMO-*'`) so they do not pollute live clinical production analytics.

---

## 10. SMALLEST SAFE ARCHITECTURE

To achieve reliable cross-device synchronization with minimal overhead and zero unnecessary complexity:

```
[Smartphone (Participant)]        [Clinic PC (Staff)]
        │                                 │
        │ HTTP REST / Cloud SDK           │ HTTP REST / Cloud SDK
        ▼                                 ▼
┌────────────────────────────────────────────────────────┐
│                CENTRAL DATA SERVICE                    │
│                                                        │
│  Collections:                                          │
│  ├── patients (profiles, assignments, checkInHistory)  │
│  ├── logs (clinical session records)                   │
│  ├── appointments (schedule)                           │
│  ├── staff_accounts (credentials & roles)              │
│  └── settings (clinic configuration)                   │
└────────────────────────────────────────────────────────┘
```

- **Read Path:** On mount or QR scan, app queries Central Data by `token` or `id`.
- **Write Path:** Check-in, assignment completion, and patient edits commit directly to Central Data.
- **Local Fallback:** LocalStorage acts as an offline/cache fallback if network connectivity is temporarily interrupted.

---

## 11. EXECUTIVE SUMMARY & NEXT STEPS

### WHAT MUST BE CENTRALIZED
- `Patient` records (Demographics, HN, `qrToken`).
- `checkInHistory` array (Timestamped daily check-in events).
- `assignments` array (Prescribed exercises & participant completion statuses).
- `appointments`, `logs`, `staff_accounts`, and `settings`.

### WHAT CAN REMAIN LOCAL
- Active device authentication session (`growth_lab_auth`).
- Local UI state (active tab selection, sidebar collapsed state, modal visibility).
- Session active patient filter (`growth_lab_selected_patient_id`).

### WHAT MUST NOT CHANGE
- Master Growth Lab Logo (`src/components/Logo.tsx` & `/src/assets/growth_lab_logo.png`).
- Clinical formulas & scoring algorithms in `src/utils/clinicalCalculations.ts` & `src/utils/checkInCalculations.ts`.
- Deep-link URL structure (`/?token=<TOKEN>`).
- 9-step participant mobile check-in sequence.

### MIGRATION BLOCKERS
- Current runtime relies exclusively on `localStorage.setItem` / `getItem`.
- No central network data repository is connected to the client app.

### SMALLEST SAFE NEXT STEP
1. Establish a single central data client service (e.g. a unified data synchronization adapter) replacing direct `localStorage` read/write calls for `patients`, `checkInHistory`, and `assignments`.
2. Ensure the adapter reads from central data on QR scan and commits check-in/completion events directly to the shared repository.
