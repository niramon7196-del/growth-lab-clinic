# GROWTH LAB — FIREBASE / FIRESTORE CONNECTION AUDIT
**Inspection Report: Database & Authentication Architecture**  
*Document Version:* 1.0.0  
*Mode:* Read-Only Audit (No Source Modifications)  
*Target Codebase:* Growth Lab Clinical & Participant Web Application

---

## 1. EXECUTIVE AUDIT SUMMARY

จากการตรวจสอบ Source Code ทุกไฟล์ในโปรเจกต์ปัจจุบัน (Client-side, Configuration files, Dependencies, Environment variables, Services) พบว่า **ระบบปัจจุบันยังไม่มีการติดตั้ง, นำเข้า (Import) หรือเชื่อมต่อกับ Firebase SDK, Cloud Firestore หรือ Firebase Authentication แต่อย่างใด** 

ระบบยังคงทำงานอยู่ในรูปแบบ **Client-Side Local Storage Architecture** โดยจัดเก็บข้อมูลทั้งหมดลงในเบราว์เซอร์ผ่านคีย์ `localStorage` (`growth_lab_patients`, `growth_lab_auth`, `growth_lab_logs` ฯลฯ)

---

## 2. DETAILED CHECKLIST & EVIDENCE MATRIX

| ลำดับ | รายการตรวจสอบ | ผลการตรวจ | หลักฐานจาก Source Code |
| :---: | :--- | :---: | :--- |
| **1** | **Firebase SDK Imports** | **NOT FOUND** | ไม่พบการ `import { initializeApp } from 'firebase/app'` หรือ `import ... from 'firebase/firestore'` ในไฟล์ใด ๆ ภายใต้ `src/` |
| **2** | **Firebase Configuration** | **NOT FOUND** | ไม่พบออบเจกต์ `firebaseConfig` (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`) ใน Source Code |
| **3** | **Firebase Initialization** | **NOT FOUND** | ไม่พบคำสั่ง `initializeApp(...)` ในไฟล์ `main.tsx`, `App.tsx` หรือ `services/` |
| **4** | **Firestore Initialization** | **NOT FOUND** | ไม่พบคำสั่ง `getFirestore()` หรือ `initializeFirestore()` |
| **5** | **Authentication Integration** | **NOT FOUND** | ระบบล็อกอินทำงานผ่าน `src/services/authService.ts` โดยบันทึก JSON ลงใน `localStorage.setItem('growth_lab_auth', ...)` ไม่ได้ใช้ Firebase Auth |
| **6** | **Firestore Read/Write Calls** | **NOT FOUND** | ไม่พบฟังก์ชัน `getDoc()`, `getDocs()`, `setDoc()`, `addDoc()`, `updateDoc()`, `onSnapshot()` หรือ `collection()` |
| **7** | **Environment Variables** | **NOT FOUND** | ในไฟล์ `.env.example` มีเฉพาะ `GEMINI_API_KEY` และ `APP_URL` ไม่มีตัวแปร `VITE_FIREBASE_*` หรือ `FIREBASE_*` |
| **8** | **package.json Dependencies** | **NOT FOUND** | ใน `package.json` ไม่มีแพ็กเกจ `firebase`, `@firebase/*` หรือ `firebase-admin` |
| **9** | **firebase.json** | **NOT FOUND** | ไม่มีไฟล์ `firebase.json` อยู่ใน Root directory |
| **10** | **firestore.rules** | **NOT FOUND** | ไม่มีไฟล์ `firestore.rules` อยู่ใน Root directory |
| **11** | **firestore.indexes.json** | **NOT FOUND** | ไม่มีไฟล์ `firestore.indexes.json` อยู่ใน Root directory |
| **12** | **Project Configuration** | **NOT FOUND** | ไม่มีไฟล์ `firebase-applet-config.json` หรือ `firebase-blueprint.json` |

---

## 3. CURRENT ACTIVE STORAGE VS FIREBASE STATE

```
┌────────────────────────────────────────────────────────────────────────┐
│                   CURRENT IMPLEMENTATION (ACTIVE)                      │
├──────────────────────────────┬─────────────────────────────────────────┤
│ Data Layer                   │ Client-Side Browser LocalStorage        │
│ Auth Mechanism               │ Local Session (`growth_lab_auth`)       │
│ Patients & Check-In Data     │ `growth_lab_patients` (JSON String)     │
│ Clinical Logs                │ `growth_lab_logs`                       │
│ Appointments                 │ `growth_lab_appointments`               │
│ Staff Accounts               │ `growth_lab_staff_accounts`             │
│ Clinical Reference Docs      │ `growth_lab_clinical_sources`           │
├──────────────────────────────┼─────────────────────────────────────────┤
│                   FIREBASE / FIRESTORE LAYER (TARGET)                  │
├──────────────────────────────┬─────────────────────────────────────────┤
│ Firebase SDK                 │ NOT INSTALLED                           │
│ Cloud Firestore              │ NOT CONNECTED                           │
│ Firebase Auth                │ NOT CONFIGURED                          │
│ Cloud Security Rules         │ NOT FOUND                               │
└──────────────────────────────┴─────────────────────────────────────────┘
```

---

## 4. PROJECT IDENTIFIERS & COLLECTIONS AUDIT

- **Project ID ที่ Source Code ใช้อยู่:** `NOT FOUND` (ไม่มีการระบุ Project ID ของ Firebase ในโค้ด)
- **Database ID:** `NOT FOUND` (ยังไม่มีการกำหนด Database Instance ID)
- **Collections ที่มีอยู่ในโค้ด:** `NOT FOUND` (ยังไม่มีการประกาศ Firestore Collections ในโค้ด)

---

## 5. RELEVANT FILES IN CURRENT REPOSITORY

ไฟล์ที่ทำหน้าที่ควบคุม Data และ State ในปัจจุบัน:
1. `/package.json` — แสดงรายการ Dependencies ปัจจุบัน (ยังไม่มี `firebase`)
2. `/.env.example` — แสดงรายการ Environment Variables ปัจจุบัน (ยังไม่มีการตั้งค่า Firebase)
3. `/src/services/authService.ts` — ระบบควบคุม Authentication ผ่าน `localStorage`
4. `/src/App.tsx` — ตัวควบคุม Global State และ Local Storage I/O สำหรับผู้ป่วย (`patients`), เช็กอิน (`checkInHistory`), และการบ้าน (`assignments`)
5. `/src/components/ParticipantCheckInPortal.tsx` — หน้า Check-in มือถือผ่าน QR Code (ปัจจุบันบันทึกผ่าน Props เข้า Local State)
6. `/src/utils/qrCodeGenerator.ts` — ตัวสร้าง QR Deep Link (`/?token=...`)

---

## 6. REQUIREMENTS TO CONNECT CENTRAL DATABASE (LOOKTAN DATABASE)

เพื่อให้ระบบสามารถเชื่อมต่อกับฐานข้อมูลกลาง (เช่น Firestore / Looktan Database) สำหรับแก้ปัญหา Cross-Device Sync ได้อย่างสมบูรณ์ ขั้นตอนทางเทคนิคที่ต้องดำเนินการในอนาคตมีดังนี้:

1. **ติดตั้ง Firebase SDK:** ติดตั้งแพ็กเกจ `firebase` ใน `package.json`
2. **สร้าง Configuration & Service Layer:**
   - สร้างไฟล์คอนฟิก (เช่น `src/services/firebase.ts`) สำหรับกำหนด `firebaseConfig` และเรียก `getFirestore()`
   - กำหนด Environment Variables ใน `.env.example` (เช่น `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`)
3. **กำหนด Firestore Schema & Rules:**
   - สร้าง `firestore.rules` เพื่อควบคุมสิทธิ์การอ่าน/เขียน (Role-Based Access Control)
   - สร้าง Collections หลัก: `patients`, `check_ins`, `assignments`, `logs`, `staff_accounts`, `settings`
4. **เชื่อมต่อ Data Adapter ใน `App.tsx`:**
   - เปลี่ยนจากการอ่าน/เขียน `localStorage.setItem('growth_lab_patients', ...)` มาเป็นการ Subscribe แบบ Real-time (`onSnapshot`) หรือ Async Fetch/Mutate กับ Firestore
   - ให้หน้า `ParticipantCheckInPortal.tsx` ส่งคำสั่ง `addDoc` / `updateDoc` ตรงเข้า Firestore เพื่อให้คอมพิวเตอร์คลินิกมองเห็นข้อมูลทันที

---

## 7. FINAL AUDIT VERDICT

```
FIREBASE SDK:     NOT CONNECTED
FIRESTORE:        NOT CONNECTED
FIREBASE AUTH:    NOT CONNECTED
SECURITY RULES:   NOT FOUND
ENV CONFIG:       NOT FOUND
```
