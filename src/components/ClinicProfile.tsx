import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  UserCheck, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  FileText, 
  Award, 
  Sparkles, 
  Stethoscope, 
  Briefcase, 
  Star, 
  Upload, 
  Download, 
  HardDrive, 
  Trash2, 
  RefreshCw, 
  Camera,
  CheckCircle2,
  AlertCircle,
  Save,
  ExternalLink,
  ShieldCheck,
  Info
} from 'lucide-react';
import { UserAccount, UserRole, ClinicSettings, StaffAccount } from '../types';
import * as cloudApi from '../services/cloudApi';
import { saveClinicConfigToGoogleSheets, getWebhookUrl } from '../services/googleAppsScriptService';
import { Logo } from './Logo';

export interface ClinicProfileProps {
  currentUser?: UserAccount | null;
  userRole?: UserRole | null;
  settings: ClinicSettings;
  staffAccounts?: StaffAccount[];
  onUpdateSettings?: (newSettings: ClinicSettings) => void;
  onLogout?: () => void;
  onNavigate?: (tab: string) => void;
}

export default function ClinicProfile({
  currentUser: _currentUser,
  userRole: _userRole,
  settings,
  staffAccounts: _staffAccounts,
  onUpdateSettings,
  onLogout: _onLogout,
  onNavigate: _onNavigate
}: ClinicProfileProps) {
  // State for Image Deletion Confirmation Modal
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<'doctorPhoto' | 'clinicLogo' | null>(null);

  // Success / Error Feedback Banner
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const triggerLocalFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  // Hidden File Input Refs for direct image uploads
  const doctorPhotoInputRef = useRef<HTMLInputElement>(null);
  const clinicLogoInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  // Clinic Edit Form State
  const [clinicForm, setClinicForm] = useState({
    clinicName: settings.clinicName || 'คลินิกทันตกรรมภาสุข (Growth Lab)',
    clinicNameEn: settings.clinicNameEn || 'Pasuk Dental Clinic (Growth Lab)',
    address: settings.address || '366/4 ม.1 ตำบลดีลัง อำเภอพัฒนานิคม จังหวัดลพบุรี 15220',
    phone: settings.phone || '081-8517672',
    email: settings.email || '12pasuk.system@gmail.com',
    website: settings.website || '',
    additionalInfo: settings.additionalInfo || '',
    clinicLogoUrl: settings.clinicLogoUrl || ''
  });

  // Doctor Edit Form State
  const [doctorForm, setDoctorForm] = useState({
    doctorPrefix: 'ทพญ.',
    doctorFullName: 'นภาพร วรรณษา',
    doctorName: settings.doctorName || 'ทพญ. นภาพร วรรณษา',
    doctorTitlePosition: settings.doctorTitlePosition || 'ทันตแพทย์ผู้ให้การรักษาและเจ้าของคลินิก',
    doctorLicenseNo: settings.doctorLicenseNo || 'ท. 8482',
    doctorSpecialty: settings.doctorSpecialty || 'ทันตกรรมจัดฟันและการปรับโครงสร้างใบหน้า (Myofunctional Orthodontics)',
    serviceScope: settings.serviceScope || 'บริการด้านทันตกรรมและการปรับโครงสร้างใบหน้าครบวงจร',
    adminRoles: settings.adminRoles || 'CEO & ผู้บริหารคลินิก, ทันตแพทย์ผู้ให้การรักษา, ผู้กำกับทิศทางการให้บริการคลินิก',
    doctorVision: settings.doctorVision || settings.doctorBio || 'ทันตแพทย์ด้านทันตกรรมจัดฟันและการปรับโครงสร้างใบหน้า (Myofunctional Orthodontics) พร้อมดูแลบริการด้านทันตกรรมแบบครบวงจร',
    doctorBio: settings.doctorBio || settings.doctorVision || 'ทันตแพทย์ด้านทันตกรรมจัดฟันและการปรับโครงสร้างใบหน้า (Myofunctional Orthodontics) พร้อมดูแลบริการด้านทันตกรรมแบบครบวงจร',
    doctorPhotoUrl: settings.doctorPhotoUrl || ''
  });

  // Integration Form State (Default Repetitions & Google Sheets)
  const [integrationForm, setIntegrationForm] = useState({
    appsScriptWebhookUrl: settings.appsScriptWebhookUrl || '',
    defaultBreathingReps: settings.defaultBreathingReps || 10,
    defaultVentilationReps: settings.defaultVentilationReps || 10,
    defaultTongueReps: settings.defaultTongueReps || 10,
    defaultMuscleReps: settings.defaultMuscleReps || 10
  });

  // Load saved values from localStorage or props
  useEffect(() => {
    let savedSettings: ClinicSettings = settings;
    try {
      const stored = localStorage.getItem('clinic_profile_data') || 
                     localStorage.getItem('growthlab_clinic_info') || 
                     localStorage.getItem('growth_lab_settings') ||
                     localStorage.getItem('growthlab_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          savedSettings = { ...settings, ...parsed };
        }
      }
    } catch (e) {
      console.warn('[ClinicProfile] Error reading initial localStorage settings:', e);
    }

    const rawName = savedSettings.doctorName || 'ทพญ. นภาพร วรรณษา';
    const prefixes = ['ทพญ.', 'ทันตแพทย์หญิง', 'ทพ.', 'ทันตแพทย์', 'พญ.', 'แพทย์หญิง', 'นพ.', 'นายแพทย์', 'ดร.'];
    let matchedPrefix = 'ทพญ.';
    let cleanName = 'นภาพร วรรณษา';

    for (const p of prefixes) {
      if (rawName.startsWith(p)) {
        matchedPrefix = p;
        cleanName = rawName.substring(p.length).trim();
        break;
      }
    }
    if (!cleanName && rawName) cleanName = rawName;

    setDoctorForm(prev => ({
      ...prev,
      doctorPrefix: matchedPrefix,
      doctorFullName: cleanName,
      doctorName: rawName,
      doctorTitlePosition: savedSettings.doctorTitlePosition || 'ทันตแพทย์ผู้ให้การรักษาและเจ้าของคลินิก',
      doctorLicenseNo: savedSettings.doctorLicenseNo || 'ท. 8482',
      doctorSpecialty: savedSettings.doctorSpecialty || 'ทันตกรรมจัดฟันและการปรับโครงสร้างใบหน้า (Myofunctional Orthodontics)',
      serviceScope: savedSettings.serviceScope || 'บริการด้านทันตกรรมและการปรับโครงสร้างใบหน้าครบวงจร',
      adminRoles: savedSettings.adminRoles || 'CEO & ผู้บริหารคลินิก, ทันตแพทย์ผู้ให้การรักษา, ผู้กำกับทิศทางการให้บริการคลินิก',
      doctorVision: savedSettings.doctorVision || savedSettings.doctorBio || 'ทันตแพทย์ด้านทันตกรรมจัดฟันและการปรับโครงสร้างใบหน้า (Myofunctional Orthodontics) พร้อมดูแลบริการด้านทันตกรรมแบบครบวงจร',
      doctorBio: savedSettings.doctorBio || savedSettings.doctorVision || 'ทันตแพทย์ด้านทันตกรรมจัดฟันและการปรับโครงสร้างใบหน้า (Myofunctional Orthodontics) พร้อมดูแลบริการด้านทันตกรรมแบบครบวงจร',
      doctorPhotoUrl: savedSettings.doctorPhotoUrl || ''
    }));

    setClinicForm({
      clinicName: savedSettings.clinicName || 'คลินิกทันตกรรมภาสุข (Growth Lab)',
      clinicNameEn: savedSettings.clinicNameEn || 'Pasuk Dental Clinic (Growth Lab)',
      address: (savedSettings.address && savedSettings.address.includes('ดีลัง')) ? savedSettings.address : '366/4 ม.1 ตำบลดีลัง อำเภอพัฒนานิคม จังหวัดลพบุรี 15220',
      phone: (savedSettings.phone && savedSettings.phone !== '099-999-9999' && savedSettings.phone !== '02-123-4567') ? savedSettings.phone : '081-8517672',
      email: (savedSettings.email && savedSettings.email !== 'contact@growthlabclinic.com') ? savedSettings.email : '12pasuk.system@gmail.com',
      website: savedSettings.website || '',
      additionalInfo: savedSettings.additionalInfo || '',
      clinicLogoUrl: savedSettings.clinicLogoUrl || ''
    });

    setIntegrationForm({
      appsScriptWebhookUrl: savedSettings.appsScriptWebhookUrl || '',
      defaultBreathingReps: savedSettings.defaultBreathingReps || 10,
      defaultVentilationReps: savedSettings.defaultVentilationReps || 10,
      defaultTongueReps: savedSettings.defaultTongueReps || 10,
      defaultMuscleReps: savedSettings.defaultMuscleReps || 10
    });

    if (onUpdateSettings && JSON.stringify(settings) !== JSON.stringify(savedSettings)) {
      onUpdateSettings(savedSettings);
    }
  }, [settings]);

  // Image File Upload Helper
  const processImageFile = (file: File, onComplete: (dataUrl: string) => void) => {
    if (!file.type.startsWith('image/')) {
      triggerLocalFeedback('กรุณาเลือกไฟล์รูปภาพที่ถูกต้อง (PNG, JPG, WebP)', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      triggerLocalFeedback('ขนาดไฟล์รูปภาพต้องไม่เกิน 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 400;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
            onComplete(compressedDataUrl);
          } else {
            onComplete(result);
          }
        };
        img.onerror = () => {
          onComplete(result);
        };
        img.src = result;
      }
    };
    reader.onerror = () => {
      triggerLocalFeedback('เกิดข้อผิดพลาดในการอ่านไฟล์รูปภาพ', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleDoctorPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    processImageFile(file, (dataUrl) => {
      setDoctorForm(prev => ({ ...prev, doctorPhotoUrl: dataUrl }));
      triggerLocalFeedback('✓ อัปเดตรูปถ่ายแพทย์สำเร็จ');
    });
    e.target.value = '';
  };

  const handleClinicLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    processImageFile(file, (dataUrl) => {
      setClinicForm(prev => ({ ...prev, clinicLogoUrl: dataUrl }));
      triggerLocalFeedback('✓ อัปเดตโลโก้/รูปคลินิกสำเร็จ');
    });
    e.target.value = '';
  };

  const handleConfirmDeletePhoto = () => {
    if (!deleteConfirmTarget) return;

    if (deleteConfirmTarget === 'doctorPhoto') {
      setDoctorForm(prev => ({ ...prev, doctorPhotoUrl: '' }));
      triggerLocalFeedback('ลบรูปภาพแพทย์เรียบร้อยแล้ว');
    } else if (deleteConfirmTarget === 'clinicLogo') {
      setClinicForm(prev => ({ ...prev, clinicLogoUrl: '' }));
      triggerLocalFeedback('ลบรูปภาพโลโก้คลินิกเรียบร้อยแล้ว');
    }

    setDeleteConfirmTarget(null);
  };

  // Main Save Function for All Clinic & Doctor Info
  const handleSaveAllClinicInfo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const constructedDocName = doctorForm.doctorPrefix 
      ? `${doctorForm.doctorPrefix} ${doctorForm.doctorFullName.trim()}`.trim()
      : doctorForm.doctorFullName.trim();

    const finalDoctorName = constructedDocName || doctorForm.doctorName.trim() || settings.doctorName || 'ทพญ. นภาพร วรรณษา';

    const updated: ClinicSettings = {
      ...settings,
      clinicName: clinicForm.clinicName.trim() || settings.clinicName || 'คลินิกทันตกรรมภาสุข (Growth Lab)',
      clinicNameEn: clinicForm.clinicNameEn.trim() || settings.clinicNameEn || 'Pasuk Dental Clinic (Growth Lab)',
      address: clinicForm.address.trim() || settings.address || '366/4 ม.1 ตำบลดีลัง อำเภอพัฒนานิคม จังหวัดลพบุรี 15220',
      phone: clinicForm.phone.trim() || settings.phone || '081-8517672',
      email: clinicForm.email.trim() || settings.email || '12pasuk.system@gmail.com',
      website: clinicForm.website.trim() || settings.website || '',
      additionalInfo: clinicForm.additionalInfo.trim() || settings.additionalInfo || '',
      clinicLogoUrl: clinicForm.clinicLogoUrl.trim() || settings.clinicLogoUrl || '',
      doctorName: finalDoctorName,
      doctorTitlePosition: doctorForm.doctorTitlePosition.trim() || settings.doctorTitlePosition || 'ทันตแพทย์ผู้ให้การรักษาและเจ้าของคลินิก',
      doctorLicenseNo: doctorForm.doctorLicenseNo.trim() || settings.doctorLicenseNo || 'ท. 8482',
      doctorSpecialty: doctorForm.doctorSpecialty.trim() || settings.doctorSpecialty || 'ทันตกรรมจัดฟันและการปรับโครงสร้างใบหน้า (Myofunctional Orthodontics)',
      serviceScope: doctorForm.serviceScope.trim() || settings.serviceScope || 'บริการด้านทันตกรรมและการปรับโครงสร้างใบหน้าครบวงจร',
      adminRoles: doctorForm.adminRoles.trim() || settings.adminRoles || 'CEO & ผู้บริหารคลินิก, ทันตแพทย์ผู้ให้การรักษา, ผู้กำกับทิศทางการให้บริการคลินิก',
      doctorVision: doctorForm.doctorVision.trim() || settings.doctorVision || doctorForm.doctorBio.trim() || settings.doctorBio || '',
      doctorBio: doctorForm.doctorBio.trim() || doctorForm.doctorVision.trim() || settings.doctorBio || '',
      doctorPhotoUrl: doctorForm.doctorPhotoUrl.trim() || settings.doctorPhotoUrl || '',
      appsScriptWebhookUrl: integrationForm.appsScriptWebhookUrl.trim(),
      defaultBreathingReps: integrationForm.defaultBreathingReps,
      defaultVentilationReps: integrationForm.defaultVentilationReps,
      defaultTongueReps: integrationForm.defaultTongueReps,
      defaultMuscleReps: integrationForm.defaultMuscleReps
    };

    try {
      localStorage.setItem('clinic_profile_data', JSON.stringify(updated));
      localStorage.setItem('growthlab_clinic_info', JSON.stringify(updated));
      localStorage.setItem('growth_lab_settings', JSON.stringify(updated));
      localStorage.setItem('growthlab_settings', JSON.stringify(updated));
      
      window.dispatchEvent(new Event('growthlab_clinic_info_updated'));
      window.dispatchEvent(new Event('clinic_profile_data_updated'));
      
      if (onUpdateSettings) {
        onUpdateSettings(updated);
      }

      // Sync to Google Sheets & Cloud API
      cloudApi.saveClinicConfig(updated).catch(err => {
        console.warn('[ClinicProfile] cloudApi.saveClinicConfig error:', err);
      });
      saveClinicConfigToGoogleSheets(getWebhookUrl(), updated).catch(err => {
        console.warn('[ClinicProfile] saveClinicConfigToGoogleSheets error:', err);
      });
  
      triggerLocalFeedback('💾 บันทึกข้อมูลคลินิกและแพทย์เรียบร้อยแล้ว', 'success');
    } catch (err) {
      console.warn('[ClinicProfile] Error saving to localStorage:', err);
      triggerLocalFeedback('ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง', 'error');
    }
  };

  // Reset to saved configuration
  const handleResetToSaved = () => {
    let savedSettings: ClinicSettings = settings;
    try {
      const stored = localStorage.getItem('clinic_profile_data') || 
                     localStorage.getItem('growthlab_clinic_info') || 
                     localStorage.getItem('growth_lab_settings') ||
                     localStorage.getItem('growthlab_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          savedSettings = { ...settings, ...parsed };
        }
      }
    } catch (e) {
      console.warn('[ClinicProfile] Error restoring settings:', e);
    }

    setClinicForm({
      clinicName: savedSettings.clinicName || 'คลินิกทันตกรรมภาสุข (Growth Lab)',
      clinicNameEn: savedSettings.clinicNameEn || 'Pasuk Dental Clinic (Growth Lab)',
      address: (savedSettings.address && savedSettings.address.includes('ดีลัง')) ? savedSettings.address : '366/4 ม.1 ตำบลดีลัง อำเภอพัฒนานิคม จังหวัดลพบุรี 15220',
      phone: (savedSettings.phone && savedSettings.phone !== '099-999-9999' && savedSettings.phone !== '02-123-4567') ? savedSettings.phone : '081-8517672',
      email: (savedSettings.email && savedSettings.email !== 'contact@growthlabclinic.com') ? savedSettings.email : '12pasuk.system@gmail.com',
      website: savedSettings.website || '',
      additionalInfo: savedSettings.additionalInfo || '',
      clinicLogoUrl: savedSettings.clinicLogoUrl || ''
    });

    const rawName = savedSettings.doctorName || 'ทพญ. นภาพร วรรณษา';
    const prefixes = ['ทพญ.', 'ทันตแพทย์หญิง', 'ทพ.', 'ทันตแพทย์', 'พญ.', 'แพทย์หญิง', 'นพ.', 'นายแพทย์', 'ดร.'];
    let matchedPrefix = 'ทพญ.';
    let cleanName = 'นภาพร วรรณษา';

    for (const p of prefixes) {
      if (rawName.startsWith(p)) {
        matchedPrefix = p;
        cleanName = rawName.substring(p.length).trim();
        break;
      }
    }
    if (!cleanName && rawName) cleanName = rawName;

    setDoctorForm({
      doctorPrefix: matchedPrefix,
      doctorFullName: cleanName,
      doctorName: rawName,
      doctorTitlePosition: savedSettings.doctorTitlePosition || 'ทันตแพทย์ผู้ให้การรักษาและเจ้าของคลินิก',
      doctorLicenseNo: savedSettings.doctorLicenseNo || 'ท. 8482',
      doctorSpecialty: savedSettings.doctorSpecialty || 'ทันตกรรมจัดฟันและการปรับโครงสร้างใบหน้า (Myofunctional Orthodontics)',
      serviceScope: savedSettings.serviceScope || 'บริการด้านทันตกรรมและการปรับโครงสร้างใบหน้าครบวงจร',
      adminRoles: savedSettings.adminRoles || 'CEO & ผู้บริหารคลินิก, ทันตแพทย์ผู้ให้การรักษา, ผู้กำกับทิศทางการให้บริการคลินิก',
      doctorVision: savedSettings.doctorVision || savedSettings.doctorBio || 'ทันตแพทย์ด้านทันตกรรมจัดฟันและการปรับโครงสร้างใบหน้า (Myofunctional Orthodontics) พร้อมดูแลบริการด้านทันตกรรมแบบครบวงจร',
      doctorBio: savedSettings.doctorBio || savedSettings.doctorVision || 'ทันตแพทย์ด้านทันตกรรมจัดฟันและการปรับโครงสร้างใบหน้า (Myofunctional Orthodontics) พร้อมดูแลบริการด้านทันตกรรมแบบครบวงจร',
      doctorPhotoUrl: savedSettings.doctorPhotoUrl || ''
    });

    triggerLocalFeedback('🔄 คืนค่าข้อมูลเดิมเรียบร้อยแล้ว', 'success');
  };

  // Backup Export & Import Handlers
  const handleExportBackup = () => {
    try {
      const backupData = {
        patients: JSON.parse(localStorage.getItem('growth_lab_patients') || localStorage.getItem('growthlab_patients') || '[]'),
        logs: JSON.parse(localStorage.getItem('growth_lab_logs') || '[]'),
        appointments: JSON.parse(localStorage.getItem('growth_lab_appointments') || '[]'),
        settings: JSON.parse(localStorage.getItem('growth_lab_settings') || localStorage.getItem('growthlab_clinic_info') || '{}'),
        timestamp: new Date().toISOString(),
        version: "1.2.4"
      };

      const dataStr = JSON.stringify(backupData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `growth_lab_backup_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      triggerLocalFeedback('📥 ดาวน์โหลดไฟล์สำรองข้อมูลสำเร็จ', 'success');
    } catch (e) {
      console.error('Export error', e);
      triggerLocalFeedback('เกิดข้อผิดพลาดในการสำรองข้อมูล', 'error');
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('ข้อมูลปัจจุบันจะถูกเขียนทับด้วยข้อมูลจากไฟล์สำรองข้อมูล คุณต้องการดำเนินการต่อหรือไม่?')) {
      if (e.target) e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const backupData = JSON.parse(content);

        if (backupData.patients && Array.isArray(backupData.patients)) {
          localStorage.setItem('growth_lab_patients', JSON.stringify(backupData.patients));
          localStorage.setItem('growthlab_patients', JSON.stringify(backupData.patients));
        }
        if (backupData.logs && Array.isArray(backupData.logs)) {
          localStorage.setItem('growth_lab_logs', JSON.stringify(backupData.logs));
        }
        if (backupData.appointments && Array.isArray(backupData.appointments)) {
          localStorage.setItem('growth_lab_appointments', JSON.stringify(backupData.appointments));
        }
        if (backupData.settings) {
          localStorage.setItem('growth_lab_settings', JSON.stringify(backupData.settings));
          localStorage.setItem('growthlab_clinic_info', JSON.stringify(backupData.settings));
        }
        
        triggerLocalFeedback('📤 กู้คืนข้อมูลสำเร็จ! ระบบกำลังทำการรีสตาร์ท...', 'success');
        
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err) {
        console.error('Import error', err);
        triggerLocalFeedback('รูปแบบไฟล์สำรองข้อมูลไม่ถูกต้อง', 'error');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-12 text-left font-sans text-slate-800">
      {/* Hidden File Inputs */}
      <input 
        type="file" 
        ref={doctorPhotoInputRef} 
        onChange={handleDoctorPhotoUpload} 
        accept="image/*" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={clinicLogoInputRef} 
        onChange={handleClinicLogoUpload} 
        accept="image/*" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={backupInputRef} 
        onChange={handleImportBackup} 
        accept=".json" 
        className="hidden" 
      />

      {/* Floating Feedback Toast Notification */}
      <AnimatePresence>
        {feedbackMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-bold border backdrop-blur-md ${
              feedbackMessage.type === 'success' 
                ? 'bg-slate-900/95 text-white border-slate-700 shadow-emerald-500/10' 
                : 'bg-rose-900/95 text-white border-rose-700 shadow-rose-500/10'
            }`}
          >
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center p-2.5 shrink-0 shadow-2xs">
              <Logo className="w-full h-auto" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  Clinic & Doctor Profile
                </span>
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold">
                  ระบบบริหารคลินิกและข้อมูลวิชาชีพ
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                ข้อมูลสถานพยาบาล & ทันตแพทย์
              </h1>
              <p className="text-slate-500 font-medium text-xs sm:text-sm mt-1">
                จัดการข้อมูลคลินิก ข้อมูลวิชาชีพทันตแพทย์ผู้ให้การรักษา และการสำรองฐานข้อมูล
              </p>
            </div>
          </div>

          {/* In-flow Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={handleResetToSaved}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer flex items-center gap-1.5 min-h-[44px]"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
              <span>คืนค่าเดิม</span>
            </button>
            <button
              type="button"
              onClick={() => handleSaveAllClinicInfo()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 min-h-[44px]"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกข้อมูล (Save)</span>
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveAllClinicInfo} className="space-y-6">
        {/* ========================================================================= */}
        {/* ส่วนที่ 1: ข้อมูลสถานพยาบาล / คลินิก (Clinic Information) */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-2xs">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  ส่วนที่ 1: ข้อมูลสถานพยาบาล / คลินิก
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  ชื่อคลินิก ที่อยู่ เบอร์โทรศัพท์ อีเมล และโลโก้สำหรับหัวรายงาน & เอกสาร
                </p>
              </div>
            </div>
          </div>

          {/* Logo Showcase & Upload Box */}
          <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-36 h-28 rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center p-3 relative group shrink-0 shadow-2xs">
              {clinicForm.clinicLogoUrl ? (
                <img 
                  src={clinicForm.clinicLogoUrl} 
                  alt="Clinic Logo" 
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : (
                <Logo className="w-28 h-auto" />
              )}
            </div>

            <div className="flex-1 space-y-2.5 text-center sm:text-left w-full">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="text-xs font-black text-slate-800">รูปภาพโลโก้คลินิก (Clinic Logo / Banner)</span>
                <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Official Asset</span>
              </div>
              <p className="text-xs text-slate-500">
                รองรับไฟล์ PNG, JPG, WebP ขนาดแนะนำอัตราส่วน 1:1 หรือแนวนอน (ไม่เกิน 5MB)
              </p>
              <div className="flex items-center gap-2 pt-1 justify-center sm:justify-start flex-wrap">
                <button
                  type="button"
                  onClick={() => clinicLogoInputRef.current?.click()}
                  className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-all cursor-pointer flex items-center gap-1.5 min-h-[38px]"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{clinicForm.clinicLogoUrl ? 'เปลี่ยนรูปโลโก้' : 'อัปโหลดไฟล์รูปภาพ'}</span>
                </button>
                {clinicForm.clinicLogoUrl && (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmTarget('clinicLogo')}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl border border-rose-200 transition-all cursor-pointer flex items-center gap-1 min-h-[38px]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ลบรูป</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields: 2 Columns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1.1 Clinic Name (Thai) */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>ชื่อคลินิก (ภาษาไทย) *</span>
              </label>
              <input 
                type="text"
                value={clinicForm.clinicName}
                onChange={(e) => setClinicForm(prev => ({ ...prev, clinicName: e.target.value }))}
                placeholder="คลินิกทันตกรรมภาสุข (Growth Lab)"
                className="w-full font-bold text-slate-900 text-sm bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 outline-none transition-all"
                required
              />
            </div>

            {/* 1.2 Clinic Name (English) */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                <span>ชื่อคลินิก (ภาษาอังกฤษ)</span>
              </label>
              <input 
                type="text"
                value={clinicForm.clinicNameEn}
                onChange={(e) => setClinicForm(prev => ({ ...prev, clinicNameEn: e.target.value }))}
                placeholder="Pasuk Dental Clinic (Growth Lab)"
                className="w-full font-bold text-slate-900 text-sm bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 outline-none transition-all font-mono"
              />
            </div>

            {/* 1.3 Phone Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-indigo-600" />
                <span>เบอร์โทรศัพท์ติดต่อ *</span>
              </label>
              <input 
                type="text"
                value={clinicForm.phone}
                onChange={(e) => setClinicForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="081-8517672"
                className="w-full font-bold text-slate-900 text-sm bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 outline-none transition-all font-mono"
                required
              />
            </div>

            {/* 1.4 Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-600" />
                <span>อีเมลคลินิก (Email) *</span>
              </label>
              <input 
                type="email"
                value={clinicForm.email}
                onChange={(e) => setClinicForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="12pasuk.system@gmail.com"
                className="w-full font-bold text-slate-900 text-sm bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 outline-none transition-all font-mono"
                required
              />
            </div>

            {/* 1.5 Address (Full Width) */}
            <div className="md:col-span-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                  <span>ที่อยู่สถานพยาบาล / คลินิก *</span>
                </label>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinicForm.address || 'คลินิกทันตกรรมภาสุข พัฒนานิคม ลพบุรี')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>เปิดดูใน Google Maps</span>
                </a>
              </div>
              <textarea 
                rows={2}
                value={clinicForm.address}
                onChange={(e) => setClinicForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder="366/4 ม.1 ตำบลดีลัง อำเภอพัฒนานิคม จังหวัดลพบุรี 15220"
                className="w-full font-bold text-slate-900 text-sm bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl p-3 outline-none transition-all resize-none"
                required
              />
            </div>

            {/* 1.6 Website / LINE OA */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                <span>เว็บไซต์ / LINE OA / ช่องทางติดต่อออนไลน์</span>
              </label>
              <input 
                type="text"
                value={clinicForm.website}
                onChange={(e) => setClinicForm(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://facebook.com/pasukdental หรือ @growthlab"
                className="w-full font-bold text-slate-900 text-sm bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 outline-none transition-all"
              />
            </div>

            {/* 1.7 Clinic Logo Image URL (Optional Direct Link) */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-indigo-600" />
                <span>ลิงก์รูปภาพโลโก้ (Image URL / Google Drive)</span>
              </label>
              <input 
                type="text"
                value={clinicForm.clinicLogoUrl}
                onChange={(e) => setClinicForm(prev => ({ ...prev, clinicLogoUrl: e.target.value }))}
                placeholder="วางลิงก์รูปภาพ URL หรืออัปโหลดไฟล์ด้านบน"
                className="w-full font-medium text-slate-900 text-xs bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 outline-none transition-all font-mono"
              />
            </div>

            {/* 1.8 Additional Info / Welcome Note (Full Width) */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>ข้อความแนะนำคลินิก / สโลแกน / คำต้อนรับ</span>
              </label>
              <textarea 
                rows={2}
                value={clinicForm.additionalInfo}
                onChange={(e) => setClinicForm(prev => ({ ...prev, additionalInfo: e.target.value }))}
                placeholder="ศูนย์ทันตกรรมจัดฟันและการปรับโครงสร้างใบหน้าสำหรับเด็กและทุกคนในครอบครัว"
                className="w-full font-medium text-slate-900 text-sm bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl p-3 outline-none transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ส่วนที่ 2: ข้อมูลทันตแพทย์ผู้ให้การรักษา (Doctor Profile) */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shadow-2xs">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  ส่วนที่ 2: ข้อมูลทันตแพทย์ผู้ให้การรักษา
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  ชื่อ-นามสกุล เลขที่ใบอนุญาต ตำแหน่ง และสาขาความเชี่ยวชาญทางทันตกรรม
                </p>
              </div>
            </div>
          </div>

          {/* Doctor Photo Showcase & Controls */}
          <div className="bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-slate-50/80 rounded-2xl p-5 border border-indigo-100/80 flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group shrink-0">
              {doctorForm.doctorPhotoUrl ? (
                <div 
                  onClick={() => doctorPhotoInputRef.current?.click()}
                  className="relative cursor-pointer group/photo"
                >
                  <img 
                    src={doctorForm.doctorPhotoUrl} 
                    alt="Doctor" 
                    className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md transition-all group-hover/photo:brightness-90"
                  />
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                    <Camera className="w-6 h-6 mb-0.5" />
                    <span className="text-[10px] font-bold">เปลี่ยนรูป</span>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => doctorPhotoInputRef.current?.click()}
                  className="w-28 h-28 rounded-full bg-gradient-to-tr from-indigo-200 to-purple-200 border-4 border-white text-indigo-700 flex flex-col items-center justify-center shadow-md cursor-pointer hover:scale-102 transition-all group/empty"
                >
                  <UserCheck className="w-8 h-8 text-indigo-800 mb-1 group-hover/empty:hidden" />
                  <Camera className="w-8 h-8 text-indigo-800 mb-1 hidden group-hover/empty:block" />
                  <span className="text-[10px] font-bold text-indigo-900 bg-white/90 px-2 py-0.5 rounded-full shadow-2xs">
                    อัปโหลดรูป
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2 text-center sm:text-left w-full">
              <div className="space-y-0.5">
                <span className="font-black text-slate-900 text-base block">
                  {doctorForm.doctorPrefix} {doctorForm.doctorFullName || 'นภาพร วรรณษา'}
                </span>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-100/90 px-2.5 py-0.5 rounded-full border border-indigo-200 inline-block">
                  {doctorForm.doctorTitlePosition || 'ทันตแพทย์ผู้ให้การรักษาและเจ้าของคลินิก'}
                </span>
                <span className="text-[11px] font-bold text-slate-500 block font-mono">
                  เลขที่ใบอนุญาต: {doctorForm.doctorLicenseNo || 'ท. 8482'}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1 justify-center sm:justify-start flex-wrap">
                <button
                  type="button"
                  onClick={() => doctorPhotoInputRef.current?.click()}
                  className="px-3.5 py-2 bg-white hover:bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs min-h-[38px]"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{doctorForm.doctorPhotoUrl ? 'เปลี่ยนรูปถ่ายแพทย์' : 'อัปโหลดรูปถ่ายแพทย์'}</span>
                </button>
                {doctorForm.doctorPhotoUrl && (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmTarget('doctorPhoto')}
                    className="px-3 py-2 bg-white hover:bg-rose-50 text-rose-600 font-bold text-xs rounded-xl border border-rose-200 transition-all cursor-pointer flex items-center gap-1 shadow-2xs min-h-[38px]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ลบรูป</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Doctor Form Fields: 2 Columns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 2.1 Doctor Prefix & Full Name (Combined Grid) */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>คำนำหน้า & ชื่อ-นามสกุล แพทย์ *</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={doctorForm.doctorPrefix}
                  onChange={(e) => setDoctorForm(prev => ({ ...prev, doctorPrefix: e.target.value }))}
                  className="w-28 font-bold text-slate-900 text-sm bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-2.5 py-2.5 outline-none transition-all"
                >
                  <option value="ทพญ.">ทพญ.</option>
                  <option value="ทันตแพทย์หญิง">ทันตแพทย์หญิง</option>
                  <option value="ทพ.">ทพ.</option>
                  <option value="ทันตแพทย์">ทันตแพทย์</option>
                  <option value="พญ.">พญ.</option>
                  <option value="นพ.">นพ.</option>
                  <option value="ดร.">ดร.</option>
                  <option value="">(ไม่มีคำนำหน้า)</option>
                </select>
                <input 
                  type="text"
                  value={doctorForm.doctorFullName}
                  onChange={(e) => setDoctorForm(prev => ({ ...prev, doctorFullName: e.target.value }))}
                  placeholder="นภาพร วรรณษา"
                  className="flex-1 font-bold text-slate-900 text-sm bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* 2.2 License Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>เลขที่ใบอนุญาตประกอบวิชาชีพ (ว./ท.พ.) *</span>
              </label>
              <input 
                type="text"
                value={doctorForm.doctorLicenseNo}
                onChange={(e) => setDoctorForm(prev => ({ ...prev, doctorLicenseNo: e.target.value }))}
                placeholder="ท. 8482"
                className="w-full font-bold text-slate-900 text-sm bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 outline-none transition-all font-mono"
                required
              />
            </div>

            {/* 2.3 Title / Position */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-purple-600" />
                <span>ตำแหน่งงาน / สถานะการปฏิบัติงาน *</span>
              </label>
              <input 
                type="text"
                value={doctorForm.doctorTitlePosition}
                onChange={(e) => setDoctorForm(prev => ({ ...prev, doctorTitlePosition: e.target.value }))}
                placeholder="ทันตแพทย์ผู้ให้การรักษาและเจ้าของคลินิก"
                className="w-full font-bold text-slate-900 text-sm bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 outline-none transition-all"
                required
              />
            </div>

            {/* 2.4 Specialty */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-purple-600" />
                <span>สาขางานทันตกรรมและความเชี่ยวชาญ *</span>
              </label>
              <input 
                type="text"
                value={doctorForm.doctorSpecialty}
                onChange={(e) => setDoctorForm(prev => ({ ...prev, doctorSpecialty: e.target.value }))}
                placeholder="ทันตกรรมจัดฟันและการปรับโครงสร้างใบหน้า (Myofunctional Orthodontics)"
                className="w-full font-bold text-slate-900 text-sm bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 outline-none transition-all"
                required
              />
            </div>

            {/* 2.5 Service Scope */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-purple-600" />
                <span>ขอบเขตการให้บริการทางทันตกรรม</span>
              </label>
              <input 
                type="text"
                value={doctorForm.serviceScope}
                onChange={(e) => setDoctorForm(prev => ({ ...prev, serviceScope: e.target.value }))}
                placeholder="บริการด้านทันตกรรมและการปรับโครงสร้างใบหน้าครบวงจร"
                className="w-full font-medium text-slate-900 text-sm bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 outline-none transition-all"
              />
            </div>

            {/* 2.6 Admin Roles */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-purple-600" />
                <span>บทบาทการบริหารและกำกับทิศทาง</span>
              </label>
              <input 
                type="text"
                value={doctorForm.adminRoles}
                onChange={(e) => setDoctorForm(prev => ({ ...prev, adminRoles: e.target.value }))}
                placeholder="CEO & ผู้บริหารคลินิก, ทันตแพทย์ผู้ให้การรักษา, ผู้กำกับทิศทางการให้บริการคลินิก"
                className="w-full font-medium text-slate-900 text-sm bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 outline-none transition-all"
              />
            </div>

            {/* 2.7 Doctor Photo URL (Direct Link) */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-purple-600" />
                <span>ลิงก์รูปภาพถ่ายแพทย์ (Image URL / Direct Link)</span>
              </label>
              <input 
                type="text"
                value={doctorForm.doctorPhotoUrl}
                onChange={(e) => setDoctorForm(prev => ({ ...prev, doctorPhotoUrl: e.target.value }))}
                placeholder="วางลิงก์รูปภาพ URL หรือกดอัปโหลดไฟล์รูปถ่ายด้านบน"
                className="w-full font-medium text-slate-900 text-xs bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 outline-none transition-all font-mono"
              />
            </div>

            {/* 2.8 Doctor Bio / Vision (Full Width) */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-600" />
                <span>ประวัติ วิสัยทัศน์ และข้อมูลแนะนำแพทย์</span>
              </label>
              <textarea 
                rows={3}
                value={doctorForm.doctorVision}
                onChange={(e) => setDoctorForm(prev => ({ ...prev, doctorVision: e.target.value, doctorBio: e.target.value }))}
                placeholder="ทันตแพทย์ด้านทันตกรรมจัดฟันและการปรับโครงสร้างใบหน้า (Myofunctional Orthodontics) พร้อมดูแลบริการด้านทันตกรรมแบบครบวงจร"
                className="w-full font-medium text-slate-900 text-sm bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl p-3 outline-none transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ส่วนที่ 3: ตั้งค่ามาตรฐานและการเชื่อมต่อ (Settings & Integration) */}
        {/* ========================================================================= */}
        <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-slate-800 space-y-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-amber-400/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center gap-3 border-b border-slate-800/20 pb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center border border-amber-500/50 shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                ส่วนที่ 3: ตั้งค่ามาตรฐานและการเชื่อมต่อ (Settings & Integration)
              </h2>
              <p className="text-xs text-slate-700 font-bold">
                ตั้งค่าจำนวนครั้งฝึกฝนเริ่มต้น และการเชื่อมต่อฐานข้อมูล Google Sheets
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <ExternalLink className="w-4 h-4 text-amber-600" />
                <span>Google Apps Script Webhook URL (สำหรับการเชื่อมต่อ Database ภายนอก)</span>
              </label>
              <input 
                type="text"
                value={integrationForm.appsScriptWebhookUrl}
                onChange={(e) => setIntegrationForm(prev => ({ ...prev, appsScriptWebhookUrl: e.target.value }))}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full font-mono font-bold text-slate-900 text-sm bg-white focus:bg-amber-50 border-2 border-slate-400 focus:border-slate-800 rounded-xl px-4 py-3 outline-none transition-all shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-800"></span>
                <span>จำนวนรอบเริ่มต้น: การฝึกหายใจ (Breathing)</span>
              </label>
              <input 
                type="number" min="1" max="100"
                value={integrationForm.defaultBreathingReps}
                onChange={(e) => setIntegrationForm(prev => ({ ...prev, defaultBreathingReps: parseInt(e.target.value) || 10 }))}
                className="w-full font-bold text-slate-900 text-sm bg-white border-2 border-slate-300 focus:border-slate-800 rounded-xl px-4 py-2.5 outline-none transition-all shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-800"></span>
                <span>จำนวนรอบเริ่มต้น: การกลืน (Ventilation/Swallowing)</span>
              </label>
              <input 
                type="number" min="1" max="100"
                value={integrationForm.defaultVentilationReps}
                onChange={(e) => setIntegrationForm(prev => ({ ...prev, defaultVentilationReps: parseInt(e.target.value) || 10 }))}
                className="w-full font-bold text-slate-900 text-sm bg-white border-2 border-slate-300 focus:border-slate-800 rounded-xl px-4 py-2.5 outline-none transition-all shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-800"></span>
                <span>จำนวนรอบเริ่มต้น: การวางลิ้น (Tongue Posture)</span>
              </label>
              <input 
                type="number" min="1" max="100"
                value={integrationForm.defaultTongueReps}
                onChange={(e) => setIntegrationForm(prev => ({ ...prev, defaultTongueReps: parseInt(e.target.value) || 10 }))}
                className="w-full font-bold text-slate-900 text-sm bg-white border-2 border-slate-300 focus:border-slate-800 rounded-xl px-4 py-2.5 outline-none transition-all shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-800"></span>
                <span>จำนวนรอบเริ่มต้น: กล้ามเนื้อใบหน้า (Muscle Tone)</span>
              </label>
              <input 
                type="number" min="1" max="100"
                value={integrationForm.defaultMuscleReps}
                onChange={(e) => setIntegrationForm(prev => ({ ...prev, defaultMuscleReps: parseInt(e.target.value) || 10 }))}
                className="w-full font-bold text-slate-900 text-sm bg-white border-2 border-slate-300 focus:border-slate-800 rounded-xl px-4 py-2.5 outline-none transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ส่วนที่ 4: แถบบันทึกข้อมูล (Card Footer Action Bar) */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-indigo-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
                  บันทึกการปรับปรุงข้อมูลคลินิกและข้อมูลแพทย์
                </h3>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                ตรวจสอบความถูกต้องของข้อมูลคลินิกและรูปโปรไฟล์ แล้วกดบันทึกเพื่ออัปเดตลงระบบทันที
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
            <button
              type="button"
              onClick={handleResetToSaved}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs sm:text-sm rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[44px] flex-1 sm:flex-initial"
            >
              <RefreshCw className="w-4 h-4 text-slate-400" />
              <span>คืนค่าเดิม</span>
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-950/50 transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[44px] flex-1 sm:flex-initial"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกข้อมูลและซิงก์ลง Google Sheets</span>
            </button>
          </div>
        </div>
      </form>

      {/* Delete Image Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmTarget && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  ยืนยันการลบรูปภาพ
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  คุณแน่ใจหรือไม่ว่าต้องการลบรูปภาพ {deleteConfirmTarget === 'doctorPhoto' ? 'โปรไฟล์แพทย์' : 'โลโก้คลินิก'} นี้?
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmTarget(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer min-h-[40px]"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeletePhoto}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs transition-all cursor-pointer shadow-md min-h-[40px]"
                >
                  ยืนยันการลบ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
