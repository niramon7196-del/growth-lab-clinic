# BRAND ASSET LOCK & ARCHITECTURE SPECIFICATION

## 1. Master Full Growth Lab Logo
- **Master Asset File**: `src/assets/Growth_Lab_MASTER_transparent.png`
- **Specification**: Master Full Growth Lab Logo สำหรับแสดงผลหลักทุกหน้า
- **Single Source of Truth**: `src/components/Logo.tsx`

## 2. Strict Architectural Rules
- **No Fallbacks**: ห้ามมี `onError`, `fallbackSrc` หรือ logic สลับ asset อัตโนมัติใน `Logo.tsx`
- **No Alternate Full Logo**: ห้ามใช้ `growth_lab_logo.png`, `growth_lab_logo_1786429333950.jpg`, `test_logo.png` หรือ placeholder ใดๆ เป็น Full Logo
- **Icon vs Full Logo Distinction**: GL Sphere / `gl_icon` เป็น icon-only asset เท่านั้น ห้ามนำมาใช้แทน Full Logo
- **Unified Master Component**: ทุกหน้าและทุกโมดูลที่ต้องการแสดง Full Logo ต้องเรียกใช้ผ่าน `<Logo />` (`src/components/Logo.tsx`) เท่านั้น ห้ามสร้าง `<img>` Full Logo ซ้ำซ้อน
- **Locked Policy**: ห้ามแก้ไข architecture นี้เพื่อแก้ปัญหาเฉพาะหน้า
