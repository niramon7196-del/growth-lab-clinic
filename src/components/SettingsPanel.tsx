import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  UserCheck, 
  RefreshCw, 
  Phone, 
  User, 
  Heart, 
  HelpCircle, 
  Check, 
  Building2, 
  Award,
  Stethoscope,
  Briefcase,
  Lock,
  Trash2,
  AlertTriangle,
  Download, 
  Upload, 
  HardDrive,
  Cloud,
  FileSpreadsheet,
  FolderSync,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  LogIn,
  LogOut,
  Sparkles,
  Bell,
  Users,
  UserPlus,
  Radio,
  Search,
  Copy,
  Save,
  Activity,
  Clock,
  CircleDot,
  CheckCircle,
  Filter,
  Send,
  ArrowLeft,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ClinicSettings, UserAccount, UserRole, StaffAccount } from '../types';
import { getUserDisplayDetails } from '../services/authService';
import { 
  CURRENT_APP_VERSION, 
  checkRemoteVersion, 
  simulateLiveUpdate, 
  simulateFirstLaunch, 
  simulateUpdatePrompt 
} from '../services/versionService';
import { 
  signInWithGoogleWorkspace, 
  logoutGoogleWorkspace, 
  getCurrentGoogleUser, 
  isGoogleWorkspaceConnected 
} from '../services/googleAuthService';
import { 
  uploadFileToGoogleDrive, 
  createGrowthLabSpreadsheet, 
  getOrCreateGrowthLabFolder 
} from '../services/googleDriveSheetsService';
import {
  getClinicConfig,
  saveClinicConfig,
  updateAdminStatus,
  ClinicAdminUser,
  ClinicConfigData,
  getApiUrl
} from '../services/cloudApi';

interface SettingsPanelProps {
  settings: ClinicSettings;
  onUpdateSettings: (settings: ClinicSettings) => void;
  onResetDatabase: () => void;
  currentUser?: UserAccount | null;
  userRole?: UserRole | null;
  staffAccounts?: StaffAccount[];
  onUpdateStaff?: (id: string, updated: Partial<StaffAccount>) => void;
  onToggleStaffStatus?: (id: string) => void;
  onAddStaff?: (staff: Omit<StaffAccount, 'id'>) => void;
  onBack?: () => void;
  onClose?: () => void;
  isDeveloperMode?: boolean;
  onNavigateToDocs?: () => void;
}

export default function SettingsPanel({
  settings,
  onUpdateSettings,
  onResetDatabase,
  currentUser = null,
  userRole = null,
  staffAccounts = [],
  onUpdateStaff,
  onToggleStaffStatus,
  onAddStaff,
  onBack,
  onClose,
  isDeveloperMode = false,
  onNavigateToDocs
}: SettingsPanelProps) {
  const [docName, setDocName] = useState(settings.doctorName || 'ทันตแพทย์หญิง นภาพร วรรณษา');
  const [docTitle, setDocTitle] = useState(settings.doctorTitlePosition || 'ทันตแพทย์ผู้ให้การรักษาและเจ้าของคลินิก');
  const [docLicense, setDocLicense] = useState(settings.doctorLicenseNo || 'ท.8482');
  const [docSpecialty, setDocSpecialty] = useState(settings.doctorSpecialty || 'ทันตกรรมจัดฟันและการปรับโครงสร้างใบหน้า (Myofunctional Orthodontics)');
  
  const [clinicName, setClinicName] = useState(settings.clinicName || 'คลินิกทันตกรรมภาสุข (Growth Lab)');
  const [clinicNameEn, setClinicNameEn] = useState(settings.clinicNameEn || 'Pasuk Dental Clinic (Growth Lab)');
  const [phone, setPhone] = useState(settings.phone || '081-8517672');
  const [address, setAddress] = useState(settings.address || '366/4 ม.1 ตำบลดีลัง อำเภอพัฒนานิคม จังหวัดลพบุรี 15220');
  const [email, setEmail] = useState(settings.email || '12pasuk.system@gmail.com');
  
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isCheckingVersion, setIsCheckingVersion] = useState(false);
  const [versionCheckStatus, setVersionCheckStatus] = useState<string | null>(null);

  // Google Sheets Clinic_Config & Real-time Administrator states
  const [clinicConfigData, setClinicConfigData] = useState<ClinicConfigData | null>(null);
  const [adminList, setAdminList] = useState<ClinicAdminUser[]>([]);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [isSavingToSheets, setIsSavingToSheets] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [syncFeedback, setSyncFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'ALL' | 'SUPER_ADMIN' | 'ADMIN' | 'DOCTOR' | 'STAFF'>('ALL');
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newAdminForm, setNewAdminForm] = useState({
    name: '',
    username: '',
    role: 'ADMIN',
    position: 'ผู้ดูแลระบบ',
    email: '',
    phone: ''
  });

  const userDisplay = getUserDisplayDetails(currentUser, userRole);

  /**
   * Fetch Clinic_Config & Admin accounts from Google Sheets
   */
  const fetchConfigAndAdminsFromSheets = async (showNotification = false) => {
    setIsSyncingSheets(true);
    try {
      const res = await getClinicConfig();
      if (res.success && res.data) {
        setClinicConfigData(res.data);
        if (Array.isArray(res.data.admins) && res.data.admins.length > 0) {
          setAdminList(res.data.admins);
        }
        const nowStr = new Date().toLocaleTimeString('th-TH');
        setLastSyncedAt(nowStr);

        // Sync local input fields if remote returned fresh values
        if (res.data.doctorName) setDocName(res.data.doctorName);
        if (res.data.doctorTitlePosition) setDocTitle(res.data.doctorTitlePosition);
        if (res.data.doctorLicenseNo) setDocLicense(res.data.doctorLicenseNo);
        if (res.data.doctorSpecialty) setDocSpecialty(res.data.doctorSpecialty);
        if (res.data.clinicName) setClinicName(res.data.clinicName);
        if (res.data.clinicNameEn) setClinicNameEn(res.data.clinicNameEn);
        if (res.data.phone) setPhone(res.data.phone);
        if (res.data.address) setAddress(res.data.address);
        if (res.data.email) setEmail(res.data.email);

        if (showNotification) {
          setSyncFeedback({
            message: `ซิงค์ข้อมูลผู้ดูแลระบบ (${res.data.admins.length} ท่าน) และการตั้งค่าคลินิกจาก Google Sheets (Tab: Clinic_Config) สำเร็จแล้วเมื่อ ${nowStr}`,
            type: 'success'
          });
          setTimeout(() => setSyncFeedback(null), 4000);
        }
      } else {
        if (showNotification) {
          setSyncFeedback({
            message: res.message || 'เชื่อมต่อ Google Sheets ผ่าน Webhook หรือใช้ข้อมูลแคชล่าสุด',
            type: 'info'
          });
          setTimeout(() => setSyncFeedback(null), 4000);
        }
      }
    } catch (err: any) {
      console.warn('[SettingsPanel] Sync error:', err);
      if (showNotification) {
        setSyncFeedback({
          message: 'เกิดข้อผิดพลาดในการซิงค์: ' + (err?.message || 'โปรดตรวจสอบการเชื่อมต่อ'),
          type: 'error'
        });
        setTimeout(() => setSyncFeedback(null), 4000);
      }
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Real-time synchronization lifecycle
  useEffect(() => {
    fetchConfigAndAdminsFromSheets(false);

    if (!autoSyncEnabled) return;
    const interval = setInterval(() => {
      fetchConfigAndAdminsFromSheets(false);
    }, 45000);

    const handleFocus = () => {
      fetchConfigAndAdminsFromSheets(false);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [autoSyncEnabled]);

  /**
   * Real-time toggle administrator active/inactive status
   */
  const handleToggleAdminStatus = async (admin: ClinicAdminUser) => {
    const nextStatus = admin.status === 'active' ? 'inactive' : 'active';
    const updatedAdmins = adminList.map(a => 
      (a.id === admin.id || a.username === admin.username) ? { ...a, status: nextStatus, lastActive: new Date().toISOString() } : a
    );
    setAdminList(updatedAdmins);

    if (onToggleStaffStatus && admin.id) {
      onToggleStaffStatus(admin.id);
    }

    try {
      await updateAdminStatus(admin.id || admin.username, nextStatus);
      setSyncFeedback({
        message: `อัปเดตสถานะของ "${admin.name}" เป็น ${nextStatus === 'active' ? 'พร้อมใช้งาน (Active)' : 'พักการใช้งาน (Inactive)'} ใน Google Sheets (Clinic_Config) สำเร็จ`,
        type: 'success'
      });
      setTimeout(() => setSyncFeedback(null), 3500);
    } catch (err: any) {
      console.warn('[SettingsPanel] Toggle status cloud error:', err);
    }
  };

  /**
   * Save all clinic metadata and administrators directly to Google Sheets (Tab: Clinic_Config)
   */
  const handleSaveAllToGoogleSheets = async () => {
    setIsSavingToSheets(true);
    const updatedSettings: ClinicSettings = {
      ...settings,
      doctorName: docName,
      doctorTitlePosition: docTitle,
      doctorLicenseNo: docLicense,
      doctorSpecialty: docSpecialty,
      clinicName: clinicName,
      clinicNameEn: clinicNameEn,
      phone: phone,
      address: address,
      email: email
    };

    onUpdateSettings(updatedSettings);

    try {
      const res = await saveClinicConfig({
        ...updatedSettings,
        admins: adminList,
        timestamp: new Date().toISOString()
      });

      if (res.success) {
        setSyncFeedback({
          message: '✅ บันทึกและซิงค์การตั้งค่าคลินิก + รายชื่อผู้ดูแลระบบทั้งหมดลงใน Google Sheets (Tab: Clinic_Config) เรียบร้อยแล้ว!',
          type: 'success'
        });
      } else {
        setSyncFeedback({
          message: 'บันทึกข้อมูลลงฐานข้อมูลเบื้องหลังสำเร็จ (ออฟไลน์แคชบันทึกเรียบร้อย)',
          type: 'info'
        });
      }
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch (err: any) {
      console.warn('[SettingsPanel] Save to sheets error:', err);
      setSyncFeedback({
        message: 'บันทึกข้อมูลเรียบร้อย: ' + (err?.message || ''),
        type: 'info'
      });
      setTimeout(() => setSyncFeedback(null), 4000);
    } finally {
      setIsSavingToSheets(false);
    }
  };

  /**
   * Add new administrator and push to Google Sheets Clinic_Config
   */
  const handleCreateNewAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminForm.name.trim() || !newAdminForm.username.trim()) {
      alert('กรุณาระบุชื่อ-นามสกุล และชื่อผู้ใช้ (Username)');
      return;
    }

    const cleanUsername = newAdminForm.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const newAdminObj: ClinicAdminUser = {
      id: `stf_${Date.now()}`,
      name: newAdminForm.name.trim(),
      username: cleanUsername,
      displayName: newAdminForm.name.trim(),
      role: newAdminForm.role,
      position: newAdminForm.position.trim() || 'ผู้ดูแลระบบ',
      email: newAdminForm.email.trim() || `${cleanUsername}@growthlab.clinic`,
      phone: newAdminForm.phone.trim() || phone,
      status: 'active',
      lastActive: new Date().toISOString(),
      permissions: {
        'Dashboard': true,
        'ผู้รับการดูแล': true,
        'ติดตามผล': true,
        'EF / แบบฝึก': true,
        'ตั้งค่า': true,
        'ข้อมูลคลินิก': true,
        'บุคลากร': true
      },
      source: 'Google Sheets (Clinic_Config)'
    };

    const updatedAdmins = [...adminList, newAdminObj];
    setAdminList(updatedAdmins);

    if (onAddStaff) {
      onAddStaff({
        name: newAdminObj.name,
        username: newAdminObj.username,
        password: 'password123',
        position: newAdminObj.position || 'ผู้ดูแลระบบ',
        displayName: newAdminObj.displayName,
        phone: newAdminObj.phone || '',
        email: newAdminObj.email || '',
        status: 'active',
        role: newAdminObj.role,
        permissions: newAdminObj.permissions
      });
    }

    setShowAddAdminModal(false);
    setNewAdminForm({ name: '', username: '', role: 'ADMIN', position: 'ผู้ดูแลระบบ', email: '', phone: '' });

    try {
      await saveClinicConfig({
        clinicName,
        doctorName: docName,
        admins: updatedAdmins
      });
      setSyncFeedback({
        message: `เพิ่มผู้ดูแลระบบ "${newAdminObj.name}" และซิงค์ไปยัง Google Sheets (Tab: Clinic_Config) สำเร็จแล้ว!`,
        type: 'success'
      });
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch (err) {
      console.warn('[SettingsPanel] Add admin sync error:', err);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...settings,
      doctorName: docName,
      doctorTitlePosition: docTitle,
      doctorLicenseNo: docLicense,
      doctorSpecialty: docSpecialty,
      clinicName: clinicName,
      clinicNameEn: clinicNameEn,
      phone: phone,
      address: address,
      email: email
    };
    try {
      localStorage.setItem('growthlab_clinic_info', JSON.stringify(updated));
      localStorage.setItem('growth_lab_settings', JSON.stringify(updated));
    } catch (err) {}
    onUpdateSettings(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };


  const backupInputRef = React.useRef<HTMLInputElement>(null);

  const handleExportBackup = () => {
    try {
      const backupData = {
        patients: JSON.parse(localStorage.getItem('growth_lab_patients') || '[]'),
        logs: JSON.parse(localStorage.getItem('growth_lab_logs') || '[]'),
        appointments: JSON.parse(localStorage.getItem('growth_lab_appointments') || '[]'),
        settings: JSON.parse(localStorage.getItem('growth_lab_settings') || '{}'),
        timestamp: new Date().toISOString(),
        version: "1.2.4"
      };

      const dataStr = JSON.stringify(backupData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = 'growth_lab_backup_' + new Date().toISOString().split('T')[0] + '.json';
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      alert('📥 ดาวน์โหลดไฟล์สำรองข้อมูลสำเร็จ');
    } catch (e) {
      console.error('Export error', e);
      alert('เกิดข้อผิดพลาดในการสำรองข้อมูล');
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
        
        alert('📤 กู้คืนข้อมูลสำเร็จ! ระบบกำลังทำการรีสตาร์ท...');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
      } catch (err) {
        console.error('Import error', err);
        alert('รูปแบบไฟล์สำรองข้อมูลไม่ถูกต้อง');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const handleResetClick = () => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการคืนค่าระบบกลับสู่ค่าเริ่มต้น? การกระทำนี้จะรีเซ็ตตัวแปรการตั้งค่าระบบและโครงสร้างเริ่มต้นของคลินิก')) {
      onResetDatabase();
      alert('ระบบทำการรีเซ็ตการตั้งค่าโครงสร้างสำเร็จ!');
    }
  };

  return (
    <div 
      id="settings-view" 
      className="w-full max-w-5xl mx-auto flex flex-col gap-6 text-left pb-28 flex-1 box-border"
    >
      
      {/* TOP NAVIGATION / ACTION BAR (BACK & CLOSE BUTTONS) */}
      <div className="flex items-center justify-between gap-3 bg-white/85 backdrop-blur-md p-4 rounded-2xl border-2 border-amber-400/60 shadow-2xs">
        <button
          type="button"
          onClick={() => {
            if (onBack) onBack();
            else if (onClose) onClose();
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-slate-800 hover:text-purple-950 border border-amber-400/50 font-bold text-xs sm:text-sm cursor-pointer transition-all active:scale-95 shadow-2xs"
          title="ย้อนกลับไปหน้าหลัก"
        >
          <ArrowLeft className="w-4 h-4 text-purple-700 shrink-0" />
          <span>ย้อนกลับไปหน้าหลัก (Dashboard)</span>
        </button>

        <div className="flex items-center gap-2 mr-1">
          <span className="hidden sm:inline-block text-xs font-bold text-slate-700 bg-purple-100/60 px-3 py-1.5 rounded-xl border border-amber-400/40">
            System Settings
          </span>
          <button
            type="button"
            onClick={() => {
              if (onClose) onClose();
              else if (onBack) onBack();
            }}
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer transition-all active:scale-95 shadow-2xs"
            title="ปิดหน้าต่างตั้งค่า"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SINGLE UNIFIED HEADER TITLE BANNER */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-5 rounded-2xl text-white shadow-md border-2 border-amber-400/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 shadow-2xs">
              <Settings className="w-6 h-6 text-purple-200" />
            </div>
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1 bg-purple-500/30 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-purple-300/30 text-purple-200 mb-1">
                <ShieldCheck className="w-3 h-3 text-purple-300 shrink-0" />
                <span>{isDeveloperMode ? 'Developer & Core Config' : 'Clinic Profile & Google Sheets Connection'}</span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-white leading-tight">
                {isDeveloperMode 
                  ? 'ผู้พัฒนาระบบ (Developer & Technical Settings)' 
                  : 'ตั้งค่าระบบและโปรไฟล์คลินิก (Clinic Settings)'}
              </h1>
              <p className="text-purple-200 text-xs font-medium mt-0.5 leading-relaxed">
                {isDeveloperMode
                  ? 'ศูนย์การตั้งค่าทางเทคนิค โครงสร้างข้อมูล ทดสอบระบบ และการกู้คืนฐานข้อมูล'
                  : 'จัดการข้อมูลผู้ใช้งานที่เข้าสู่ระบบ (Account) และการเชื่อมต่อ Google Sheets คลินิก เพื่อความปลอดภัยของฐานข้อมูล'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-purple-500/25 text-purple-100 border border-amber-400/50 flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>v{CURRENT_APP_VERSION} Live</span>
            </span>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 border-2 border-emerald-400 text-emerald-900 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-2xs animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>บันทึกการปรับปรุงตัวแปรรักษา ข้อมูลคลินิก และพารามิเตอร์ระบบเรียบร้อยแล้ว!</span>
        </div>
      )}

      {isDeveloperMode && onNavigateToDocs && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 p-5 rounded-2xl border border-indigo-500/40 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/60 border border-indigo-400/40 flex items-center justify-center text-white shrink-0 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 bg-indigo-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-indigo-400/30 text-indigo-200 mb-0.5">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Developer Architecture Vault</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                เอกสารสำคัญโครงสร้างระบบ (Technical Documentation & Handover)
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                พิมพ์เขียวสถาปัตยกรรมระบบ โค้ดฐานข้อมูล และคู่มือส่งมอบงาน (เข้าถึงเฉพาะ niramon7196@gmail.com หรือผ่านหน้านี้)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateToDocs}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto shadow-sm"
          >
            <span>เปิดดูเอกสารระบบ</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* SECTION A: CURRENT LOGGED-IN ACCOUNT */}
      <div className="bg-white/85 backdrop-blur-md p-5 rounded-2xl border-2 border-amber-400/60 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-purple-100 pb-3">
          <div className="flex items-start sm:items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold shrink-0">
              <UserCheck className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">A. ACCOUNT / CURRENT USER (ข้อมูลบัญชีที่กำลัง Login)</h2>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1 shrink-0">
                  <Lock className="w-3 h-3 text-purple-700" />
                  <span>Authentication Session</span>
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                ข้อมูลของผู้ใช้งานจริงที่ผ่านการลงชื่อเข้าใช้ระบบ (ไม่ใช่ข้อมูลแพทย์เจ้าของคลินิก)
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-0.5">
          <div className="p-3 bg-purple-50/80 rounded-xl border border-purple-200/90 space-y-1 min-w-0 shadow-2xs">
            <span className="text-purple-800 font-extrabold block text-[10px] uppercase tracking-wider">1. ชื่อบัญชีใช้งานจริง (NAME)</span>
            <span className="font-bold text-slate-900 text-xs sm:text-sm block break-words" title={userDisplay.name}>
              {userDisplay.name}
            </span>
          </div>

          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-300 space-y-1 min-w-0 shadow-2xs">
            <span className="text-slate-600 font-extrabold block text-[10px] uppercase tracking-wider">2. ชื่อผู้ใช้ระบบ (USERNAME)</span>
            <span className="font-bold text-purple-950 text-xs sm:text-sm block font-mono break-all" title={currentUser?.username || '-'}>
              {currentUser?.username || '-'}
            </span>
          </div>

          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-300 space-y-1 min-w-0 shadow-2xs">
            <span className="text-slate-600 font-extrabold block text-[10px] uppercase tracking-wider">3. บทบาทและสิทธิ์ (ROLE)</span>
            <span className="font-bold text-purple-800 text-xs sm:text-sm block break-words" title={userDisplay.roleTitle}>
              {userDisplay.roleTitle}
            </span>
          </div>

          <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-300 space-y-1 min-w-0 shadow-2xs">
            <span className="text-emerald-800 font-extrabold block text-[10px] uppercase tracking-wider">4. สถานะการเข้าใช้งาน (STATUS)</span>
            <span className="font-bold text-emerald-900 text-xs sm:text-sm flex items-center gap-1.5 break-words">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span>กำลังใช้งาน (Active Session)</span>
            </span>
          </div>
        </div>
      </div>

      {/* REAL-TIME FEEDBACK ALERT */}
      {syncFeedback && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-2xs animate-fade-in ${
          syncFeedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
          syncFeedback.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-900' :
          'bg-indigo-50 border-indigo-200 text-indigo-900'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {syncFeedback.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />}
            {syncFeedback.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
            {syncFeedback.type === 'info' && <Cloud className="w-4 h-4 text-indigo-600 shrink-0" />}
            <span className="truncate">{syncFeedback.message}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setSyncFeedback(null)} 
            className="text-slate-400 hover:text-slate-700 ml-3 shrink-0 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* REAL-TIME SYNCHRONIZATION HUB (GOOGLE SHEETS: CLINIC_CONFIG) */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-5 rounded-2xl text-white shadow-md space-y-4 border-2 border-amber-400/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <Radio className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Google Sheets: แท็บ Clinic_Config</span>
              </span>
              <span className="text-[10px] text-emerald-200/80 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-300 shrink-0" />
                <span>ซิงค์ล่าสุด: {lastSyncedAt ? `${lastSyncedAt} น.` : 'กำลังเชื่อมต่อข้อมูล...'}</span>
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-2">
              <span>ศูนย์เชื่อมต่อข้อมูลคลินิกและผู้ดูแลระบบแบบเรียลไทม์</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              ดึงข้อมูลผู้ดูแลระบบ สถานะการเข้าใช้งาน และพารามิเตอร์คลินิกจากชีต <strong>Clinic_Config</strong> ใน Google Sheets แบบ Real-time
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isSyncingSheets}
              onClick={() => fetchConfigAndAdminsFromSheets(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-xl text-xs font-bold transition-all border border-white/20 shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-300 ${isSyncingSheets ? 'animate-spin' : ''}`} />
              <span>{isSyncingSheets ? 'กำลังดึงข้อมูล...' : 'ซิงค์จาก Sheets'}</span>
            </button>

            <button
              type="button"
              disabled={isSavingToSheets}
              onClick={handleSaveAllToGoogleSheets}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingToSheets ? 'กำลังบันทึก...' : 'บันทึกลง Sheets'}</span>
            </button>

            <button
              type="button"
              onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-[11px] font-bold transition-all border cursor-pointer ${
                autoSyncEnabled 
                  ? 'bg-emerald-400/20 text-emerald-200 border-emerald-400/40' 
                  : 'bg-white/5 text-slate-400 border-white/10'
              }`}
            >
              <Activity className="w-3 h-3 text-emerald-400" />
              <span>Auto-Sync: {autoSyncEnabled ? 'เปิด' : 'ปิด'}</span>
            </button>
          </div>
        </div>

        {/* Integration Summary Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-white/10 text-xs">
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 min-w-0">
            <span className="text-slate-400 text-[10px] block font-bold">แหล่งข้อมูลต้นทาง</span>
            <span className="font-mono text-emerald-300 font-bold mt-0.5 block truncate" title="Google Sheets / Webhook">Google Sheets</span>
          </div>
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 min-w-0">
            <span className="text-slate-400 text-[10px] block font-bold">แท็บการตั้งค่า</span>
            <span className="font-mono text-white font-bold mt-0.5 block truncate">Clinic_Config</span>
          </div>
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 min-w-0">
            <span className="text-slate-400 text-[10px] block font-bold">ผู้ดูแลระบบ</span>
            <span className="font-mono text-amber-300 font-bold mt-0.5 block truncate">{adminList.length} บัญชี</span>
          </div>
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 min-w-0">
            <span className="text-slate-400 text-[10px] block font-bold">พร้อมใช้งาน (Active)</span>
            <span className="font-mono text-emerald-400 font-bold mt-0.5 block truncate">
              {adminList.filter(a => a.status === 'active').length} / {adminList.length} บัญชี
            </span>
          </div>
        </div>
      </div>

      {/* REAL-TIME ADMINISTRATORS DIRECTORY SECTION (TAB: CLINIC_CONFIG) */}
      <div className="bg-white/85 backdrop-blur-md p-5 rounded-2xl border-2 border-amber-400/60 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200/80 pb-3">
          <div className="flex items-start sm:items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold shrink-0">
              <Users className="w-4.5 h-4.5 text-indigo-700" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="text-sm font-bold text-slate-900">
                  รายชื่อและสถานะผู้ดูแลระบบ (Clinic Administrators & Staff)
                </h2>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 shrink-0">
                  <CircleDot className="w-2 h-2 text-emerald-600 animate-pulse" />
                  <span>Real-Time</span>
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                รายชื่อผู้ดูแลระบบ สิทธิ์ และสถานะการเข้าใช้งานจริงจาก Google Sheets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowAddAdminModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>เพิ่มผู้ดูแลระบบ</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative w-full md:w-72 lg:w-80 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={adminSearchTerm}
              onChange={(e) => setAdminSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อ, username, ตำแหน่ง, อีเมล..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-800 outline-hidden focus:border-indigo-400 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {(['ALL', 'SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'STAFF'] as const).map((roleKey) => (
              <button
                key={roleKey}
                type="button"
                onClick={() => setSelectedRoleFilter(roleKey)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                  selectedRoleFilter === roleKey
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {roleKey === 'ALL' && 'ทั้งหมด'}
                {roleKey === 'SUPER_ADMIN' && 'Super Admin'}
                {roleKey === 'ADMIN' && 'Admin'}
                {roleKey === 'DOCTOR' && 'แพทย์ / Owner'}
                {roleKey === 'STAFF' && 'เจ้าหน้าที่'}
              </button>
            ))}
          </div>
        </div>

        {/* Admin Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {adminList
            .filter(admin => {
              const matchesSearch = 
                admin.name.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
                admin.username.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
                (admin.position && admin.position.toLowerCase().includes(adminSearchTerm.toLowerCase())) ||
                (admin.email && admin.email.toLowerCase().includes(adminSearchTerm.toLowerCase()));
              if (!matchesSearch) return false;
              if (selectedRoleFilter === 'ALL') return true;
              return (admin.role || '').toUpperCase() === selectedRoleFilter;
            })
            .map((admin) => {
              const isActive = admin.status === 'active';
              const isSuper = admin.role === 'SUPER_ADMIN' || admin.role === 'CLINIC_OWNER';
              const isDoctor = admin.role === 'DOCTOR';

              return (
                <div
                  key={admin.id || admin.username}
                  className={`p-4 rounded-2xl border transition-all duration-200 space-y-3 min-w-0 ${
                    isActive 
                      ? 'bg-white border-slate-200 hover:border-indigo-300 shadow-2xs' 
                      : 'bg-slate-50/70 border-slate-200 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${
                        isSuper ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                        isDoctor ? 'bg-teal-100 text-teal-800 border border-teal-200' :
                        'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      }`}>
                        {admin.name ? admin.name.substring(0, 1) : 'U'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h4 className="font-bold text-slate-900 text-sm truncate" title={admin.name}>{admin.name}</h4>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                            isSuper ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                            isDoctor ? 'bg-teal-100 text-teal-800 border border-teal-200' :
                            'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          }`}>
                            {admin.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5 truncate">
                          <span className="font-semibold">@{admin.username}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-600 font-sans font-medium truncate" title={admin.position || 'ผู้ดูแลระบบ'}>
                            {admin.position || 'ผู้ดูแลระบบ'}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Interactive Real-Time Status Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleAdminStatus(admin)}
                      title="กดเพื่อสลับสถานะการเข้าใช้งาน"
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 shadow-2xs ${
                        isActive
                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                      <span className="whitespace-nowrap">{isActive ? 'Active (พร้อมใช้)' : 'Inactive (พัก)'}</span>
                    </button>
                  </div>

                  {/* Contact & Meta Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-mono">
                    <div className="min-w-0 truncate">
                      <span className="text-slate-400 font-sans block text-[10px]">อีเมล:</span>
                      <span className="text-slate-700 truncate block" title={admin.email || '-'}>{admin.email || '-'}</span>
                    </div>
                    <div className="min-w-0 truncate">
                      <span className="text-slate-400 font-sans block text-[10px]">เบอร์โทร:</span>
                      <span className="text-slate-700 truncate block" title={admin.phone || '-'}>{admin.phone || '-'}</span>
                    </div>
                  </div>

                  {/* Permissions & Source Badge */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span className="inline-flex items-center gap-1 text-slate-500 truncate">
                      <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="truncate">ต้นทาง: Google Sheets ({admin.source || 'Clinic_Config'})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`ชื่อ: ${admin.name}\nUsername: ${admin.username}\nบทบาท: ${admin.role}\nสถานะ: ${admin.status}`, admin.username)}
                      className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer shrink-0 ml-2"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedId === admin.username ? 'คัดลอกแล้ว!' : 'คัดลอก'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* ADD ADMINISTRATOR MODAL */}
      {showAddAdminModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
        >
          <div 
            className="bg-white w-full max-w-2xl rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto my-auto flex flex-col gap-4 text-left border border-slate-200"
            style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black text-slate-900">เพิ่มผู้ดูแลระบบ (Clinic Administrator)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAdminModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewAdmin} className="space-y-3.5 text-xs overflow-y-auto pr-1">
              <div>
                <label className="font-bold text-slate-700 block mb-1">ชื่อ-นามสกุล *</label>
                <input
                  type="text"
                  required
                  value={newAdminForm.name}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, name: e.target.value })}
                  placeholder="เช่น ทพญ. วรัญญา มงคลศิลป์"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-800 outline-hidden focus:border-indigo-400 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ชื่อผู้ใช้ (Username) *</label>
                  <input
                    type="text"
                    required
                    value={newAdminForm.username}
                    onChange={(e) => setNewAdminForm({ ...newAdminForm, username: e.target.value })}
                    placeholder="เช่น doctor2, admin_pasuk"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-800 outline-hidden focus:border-indigo-400 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">บทบาท (Role) *</label>
                  <select
                    value={newAdminForm.role}
                    onChange={(e) => setNewAdminForm({ ...newAdminForm, role: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-800 outline-hidden focus:border-indigo-400 font-bold"
                  >
                    <option value="SUPER_ADMIN">SUPER_ADMIN (ผู้บริหารสูงสุด)</option>
                    <option value="ADMIN">ADMIN (ผู้ดูแลระบบ)</option>
                    <option value="DOCTOR">DOCTOR (ทันตแพทย์)</option>
                    <option value="STAFF">STAFF (เจ้าหน้าที่คลินิก)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ตำแหน่งงาน (Position)</label>
                <input
                  type="text"
                  value={newAdminForm.position}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, position: e.target.value })}
                  placeholder="เช่น ทันตแพทย์ประจำคลินิก, ผู้จัดการระบบ IT"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-800 outline-hidden focus:border-indigo-400 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">อีเมลติดต่อ</label>
                  <input
                    type="email"
                    value={newAdminForm.email}
                    onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                    placeholder="admin@growthlab.clinic"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-800 outline-hidden focus:border-indigo-400 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={newAdminForm.phone}
                    onChange={(e) => setNewAdminForm({ ...newAdminForm, phone: e.target.value })}
                    placeholder="081-xxxxxxx"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-800 outline-hidden focus:border-indigo-400 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-900 text-[11px] leading-relaxed">
                ℹ️ ข้อมูลนี้จะถูกบันทึกลงในระบบทันที และซิงค์ขึ้นแท็บ <strong>Clinic_Config</strong> ใน Google Sheets ของคลินิกโดยอัตโนมัติ
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>บันทึกและซิงค์เข้า Google Sheets</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECTION B: GOOGLE WORKSPACE & SYSTEM INTEGRATION */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white/85 backdrop-blur-md p-5 rounded-2xl border-2 border-amber-400/60 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 min-w-0">
              <Cloud className="w-4.5 h-4.5 text-emerald-700 shrink-0" />
              <span className="truncate">B. การเชื่อมต่อ Google Workspace (Google Drive & Sheets)</span>
            </h2>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                isGoogleWorkspaceConnected() 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : 'bg-slate-100 text-slate-700 border border-slate-300'
              }`}>
                {isGoogleWorkspaceConnected() ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>เชื่อมต่อแล้ว</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>ยังไม่เชื่อมต่อ</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Google Account Action Card */}
          <div className="p-4 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 border border-emerald-200/80 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate" title={getCurrentGoogleUser()?.email || 'เชื่อมต่อบัญชี Google ของคลินิก'}>
                  {getCurrentGoogleUser() ? `บัญชี Google: ${getCurrentGoogleUser()?.email}` : 'เชื่อมต่อบัญชี Google ของคลินิก'}
                </p>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  สำรองไฟล์ประเมินผลขึ้น Google Drive และ Google Sheets อัตโนมัติแบบ Real-time
                </p>
              </div>

              {isGoogleWorkspaceConnected() ? (
                <button
                  type="button"
                  onClick={async () => {
                    await logoutGoogleWorkspace();
                    setDocName(docName); // trigger re-render
                  }}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0 w-full sm:w-auto"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>ออกจากระบบ Google</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await signInWithGoogleWorkspace();
                      setDocName(docName); // trigger re-render
                    } catch (err: any) {
                      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ Google: ' + (err.message || ''));
                    }
                  }}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0 w-full sm:w-auto"
                >
                  <LogIn className="w-3.5 h-3.5 shrink-0" />
                  <span>ลงชื่อเข้าใช้ Google Workspace</span>
                </button>
              )}
            </div>

            {/* Action buttons for Google Workspace */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-emerald-200/60">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const patients = JSON.parse(localStorage.getItem('growth_lab_patients') || '[]');
                    const logs = JSON.parse(localStorage.getItem('growth_lab_logs') || '[]');
                    const appointments = JSON.parse(localStorage.getItem('growth_lab_appointments') || '[]');
                    
                    const backupPayload = {
                      system: 'Growth Lab Dental & Orthodontics',
                      version: '1.0',
                      exportedAt: new Date().toISOString(),
                      patientsCount: patients.length,
                      logsCount: logs.length,
                      appointmentsCount: appointments.length,
                      patients,
                      logs,
                      appointments
                    };

                    const fileName = `GrowthLab_Backup_${new Date().toISOString().split('T')[0]}.json`;
                    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
                    
                    const uploaded = await uploadFileToGoogleDrive(fileName, 'application/json', blob);
                    alert(`✅ สำรองข้อมูลระบบขึ้น Google Drive ในโฟลเดอร์ Growth Lab เรียบร้อยแล้ว (ไฟล์: ${uploaded.name})`);
                  } catch (err: any) {
                    alert('เกิดข้อผิดพลาดในการสำรองขึ้น Drive: ' + (err.message || 'กรุณาลงชื่อเข้าใช้ Google'));
                  }
                }}
                className="flex items-center justify-center gap-1.5 p-2.5 bg-white hover:bg-emerald-100/50 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer min-w-0 text-center"
              >
                <FolderSync className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="truncate">สำรองขึ้น Google Drive</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  try {
                    const spreadsheet = await createGrowthLabSpreadsheet();
                    localStorage.setItem('growthlab_active_spreadsheet_id', spreadsheet.id);
                    alert(`✅ สร้างและเชื่อมโยง Google Sheets กลางสำเร็จแล้ว!\nID: ${spreadsheet.id}\nลิงก์: ${spreadsheet.spreadsheetUrl}`);
                  } catch (err: any) {
                    alert('เกิดข้อผิดพลาดในการสร้างชีต: ' + (err.message || 'กรุณาลงชื่อเข้าใช้ Google'));
                  }
                }}
                className="flex items-center justify-center gap-1.5 p-2.5 bg-white hover:bg-emerald-100/50 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer min-w-0 text-center"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="truncate">เชื่อมโยง Google Sheets กลาง</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* DATA BACKUP & RESTORE */}
        <div className="bg-white/85 backdrop-blur-md rounded-2xl p-5 border-2 border-amber-400/60 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <HardDrive className="w-4.5 h-4.5 text-indigo-600 shrink-0" />
                <span>{isDeveloperMode ? 'สำรองและกู้คืนข้อมูล (Data Management)' : 'สำรองข้อมูลระบบ (Data Backup)'}</span>
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {isDeveloperMode 
                  ? 'นำออกข้อมูลระบบทั้งหมดเพื่อเก็บเป็นไฟล์สำรอง หรือนำเข้าเพื่อกู้คืน (เขียนทับข้อมูลปัจจุบัน)' 
                  : 'นำออกข้อมูลระบบทั้งหมดเพื่อเก็บเป็นไฟล์สำรอง (JSON) เพื่อความปลอดภัยของฐานข้อมูล'}
              </p>
            </div>
          </div>
          
          <div className={`grid grid-cols-1 ${isDeveloperMode ? 'sm:grid-cols-2' : ''} gap-3`}>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-300 space-y-2 flex flex-col justify-between min-w-0">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Download className="w-4 h-4 text-blue-600 shrink-0" />
                  <h4 className="font-bold text-xs text-slate-900">ส่งออกข้อมูล (Export)</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">ดาวน์โหลดรายชื่อคนไข้และประวัติทั้งหมดเป็นไฟล์ JSON</p>
              </div>
              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full py-2.5 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer min-h-[38px]"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">สำรองข้อมูลระบบ (JSON)</span>
              </button>
            </div>
            
            {/* นำเข้าข้อมูล (Restore) - แสดงเฉพาะในหน้า Developer & Technical Settings เท่านั้น */}
            {isDeveloperMode && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-300 space-y-2 flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Upload className="w-4 h-4 text-emerald-600 shrink-0" />
                    <h4 className="font-bold text-xs text-slate-900">นำเข้าข้อมูล (Restore)</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">กู้คืนระบบจากไฟล์สำรองข้อมูล (เขียนทับข้อมูลปัจจุบัน)</p>
                </div>
                <input 
                  type="file"
                  accept=".json"
                  ref={backupInputRef}
                  onChange={handleImportBackup}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => backupInputRef.current?.click()}
                  className="w-full py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer min-h-[38px]"
                >
                  <Upload className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">นำเข้าข้อมูลสำรอง (Restore)</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* SYSTEM VERSION & AUTO-UPDATE ENGINE / TESTING SANDBOX (แสดงเฉพาะในหน้า Developer & Technical Settings เท่านั้น) */}
        {isDeveloperMode && (
          <div className="bg-white/85 backdrop-blur-md rounded-2xl p-5 border-2 border-amber-400/60 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 border-b border-slate-200/80 pb-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4.5 h-4.5 text-purple-600 shrink-0" />
                    <span>ระบบตรวจจับและอัปเดตเวอร์ชันอัตโนมัติ (Auto Version Checker)</span>
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 shrink-0">
                    {CURRENT_APP_VERSION}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  ระบบตรวจเช็กเวอร์ชันใหม่อัตโนมัติทุกครั้งที่สลับแท็บ/เปิดแอป และตรวจสอบเบื้องหลังทุก 45 วินาที
                </p>
              </div>

              <button
                type="button"
                disabled={isCheckingVersion}
                onClick={async () => {
                  setIsCheckingVersion(true);
                  setVersionCheckStatus(null);
                  try {
                    const res = await checkRemoteVersion();
                    if (res.hasUpdate) {
                      setVersionCheckStatus(`พบเวอร์ชันใหม่ (${res.remoteVersion}) กำลังเริ่มระบบอัปเดต...`);
                      setTimeout(() => {
                        simulateLiveUpdate(res.remoteVersion);
                      }, 800);
                    } else {
                      setVersionCheckStatus(`✅ แอปพลิเคชันของคุณเป็นเวอร์ชันล่าสุดแล้ว (${res.currentVersion})`);
                    }
                  } catch (e: any) {
                    setVersionCheckStatus(`ข้อผิดพลาดในการตรวจสอบ: ${e?.message || 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้'}`);
                  } finally {
                    setIsCheckingVersion(false);
                  }
                }}
                className="px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-amber-400/50 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer shrink-0 w-full sm:w-auto min-h-[38px]"
              >
                <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isCheckingVersion ? 'animate-spin text-purple-600' : ''}`} />
                <span className="whitespace-nowrap">{isCheckingVersion ? 'กำลังตรวจเช็ก...' : 'ตรวจเช็กเวอร์ชันล่าสุด'}</span>
              </button>
            </div>

            {versionCheckStatus && (
              <div className="p-3 bg-purple-50/90 rounded-xl border border-purple-300 text-xs font-bold text-purple-950 flex items-center justify-between gap-2">
                <span className="leading-relaxed">{versionCheckStatus}</span>
                <button 
                  type="button" 
                  onClick={() => setVersionCheckStatus(null)} 
                  className="text-purple-500 hover:text-purple-800 p-1 cursor-pointer shrink-0"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Test & Simulation Controls */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-300 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>เครื่องมือทดสอบการแจ้งเตือน (Testing Sandbox)</span>
                </span>
                <span className="text-xs text-slate-500 font-medium">ทดสอบระบบ Toast Notification</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => simulateUpdatePrompt('v1.2.0')}
                  className="flex items-center gap-2 p-3 bg-white hover:bg-purple-50 text-purple-950 border border-purple-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer text-left min-w-0"
                >
                  <Bell className="w-3.5 h-3.5 text-purple-600 shrink-0 animate-bounce" />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="truncate">ทดสอบ Toast แจ้งอัปเดต</span>
                    <span className="text-[10px] font-medium text-slate-500 truncate">ปุ่มรีเฟรชทันที</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => simulateLiveUpdate('v1.2.0')}
                  className="flex items-center gap-2 p-3 bg-white hover:bg-amber-50 text-amber-950 border border-amber-300 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer text-left min-w-0"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600 shrink-0 animate-spin" />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="truncate">ทดสอบ Auto-Update</span>
                    <span className="text-[10px] font-medium text-slate-500 truncate">จำลองรีเฟรชหน้าจอ</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => simulateFirstLaunch('v1.1.0')}
                  className="flex items-center gap-2 p-3 bg-white hover:bg-emerald-50 text-emerald-950 border border-emerald-300 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer text-left min-w-0"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="truncate">ทดสอบเปิดแอปใหม่</span>
                    <span className="text-[10px] font-medium text-slate-500 truncate">จำลอง 🎉 เวอร์ชันใหม่</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUBMIT BUTTONS & SYSTEM MAINTENANCE */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-white/85 backdrop-blur-md p-5 rounded-2xl border-2 border-amber-400/60 shadow-2xs">
          <div className="flex items-center w-full md:w-auto">
            {isDeveloperMode && (
              <button
                type="button"
                onClick={handleResetClick}
                className="w-full md:w-auto flex items-center justify-center gap-1.5 text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-2xs min-h-[40px]"
              >
                <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                <span>คืนค่าการตั้งค่าเริ่มต้น</span>
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
            <button
              type="button"
              disabled={isSavingToSheets}
              onClick={handleSaveAllToGoogleSheets}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-all shadow-xs cursor-pointer min-h-[40px] disabled:opacity-50 w-full sm:w-auto"
            >
              <Save className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="whitespace-nowrap">{isSavingToSheets ? 'กำลังบันทึกลง Sheets...' : 'บันทึกลง Google Sheets'}</span>
            </button>

            <button
              type="submit"
              className="flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition-all shadow-sm cursor-pointer min-h-[40px] w-full sm:w-auto"
            >
              <Save className="w-3.5 h-3.5 shrink-0" />
              <span>บันทึกการตั้งค่าทั้งหมด</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
