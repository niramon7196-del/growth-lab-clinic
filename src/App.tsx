import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronDown, 
  ChevronRight, 
  Users, 
  UserCog,
  BookOpen, 
  Calendar, 
  Bell, 
  FileText, 
  Settings as SettingsIcon, 
  LayoutDashboard, 
  Menu, 
  X, 
  Heart,
  Home,
  UserPlus,
  ClipboardList,
  Flame,
  Footprints,
  TrendingUp,
  LogOut, Play,
  Apple,
  Target,
  Moon,
  Brain,
  Camera,
  Film,
  Video,
  QrCode,
  User,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Activity,
  Dumbbell,
  Building2,
  Clock,
  Trash2,
  RefreshCw,
  Scroll,
  Sparkles,
  Smartphone
} from 'lucide-react';

import { 
  UserRole, Patient, SessionLog, Appointment, 
  SystemNotification, ClinicSettings, StaffAccount,
  VideoItem, NutritionLog, SleepLog, ExerciseLog, GrowthLog, SleepMonthlyProfile, EFRecordLog, ClinicalSourceDocument, CheckInRecord, HomeworkAssignment
} from './types';
import { authService, getUserDisplayDetails } from './services/authService';
import { 
  getParamCaseInsensitive, 
  createAutoRegisteredPatient, 
  savePatientToLocalStorage,
  findMatchingPatient,
  getAllLocalPatients,
  decodePatientDataFromUrl,
  getPersistentPatientSession,
  clearPersistentPatientSession,
  savePersistentPatientSession
} from './utils/patientUtils';
import { 
  APP_ENV,
  DEFAULT_SETTINGS, 
  SEED_EXERCISES, 
  VERIFIED_EXERCISES,
  SEED_PATIENTS, 
  SEED_APPOINTMENTS, 
  SEED_NOTIFICATIONS, 
  generateSeedLogs,
  INITIAL_CLINICAL_SOURCE_DOCUMENTS
} from './data';
import { 
  syncPatientToGoogleSheets, 
  registerPatientToGoogleSheets,
  savePatientToGoogleSheets,
  fetchPatientByHnFromGoogleSheets,
  getWebhookUrl, 
  syncDailyCheckInToGoogleSheets, 
  syncCleanDailySummaryToGoogleSheets, 
  syncAppointmentToGoogleSheets, 
  syncDeleteAppointmentToGoogleSheets,
  syncDeletePatientToGoogleSheets, 
  fetchClinicConfigFromGoogleSheets, 
  saveClinicConfigToGoogleSheets 
} from './services/googleAppsScriptService';
import * as cloudApi from './services/cloudApi';

import Dashboard from './components/Dashboard';
import PatientsList from './components/PatientsList';
import ProgramUsersList from './components/ProgramUsersList';
import UserWorkspace from './components/UserWorkspace';
import AppointmentsList from './components/AppointmentsList';
import PDFExporter from './components/PDFExporter';
import SettingsPanel from './components/SettingsPanel';
import TreatmentRecords from './components/TreatmentRecords';
import LandingPage from './components/LandingPage';
import PatientPortalEntry from './components/PatientPortalEntry';
import ModeSelectorGateway from './components/ModeSelectorGateway';
import UserGuide from './components/UserGuide';
import QRCodeCheckIn from './components/QRCodeCheckIn';
import CheckInView from './components/CheckInView';
import AssignedExercisesView from './components/AssignedExercisesView';
import ExerciseView from './components/ExerciseView';
import CheckInAnalyticsPanel from './components/CheckInAnalyticsPanel';
import { getTodayDateString, syncPatientProgress, calculateConsistencyMetrics, formatThaiDate } from './utils/checkInCalculations';
import { playSuccessChime } from './utils/audioUtils';
import ProfileLoadingFallback from "./components/ProfileLoadingFallback";
import NotificationsPanel from './components/NotificationsPanel';
import WelcomeModal from './components/WelcomeModal';
import PatientDashboard from './components/PatientDashboard';
import KnowledgeHub from './components/KnowledgeHub';
import PatientProfile from './components/PatientProfile';
import StaffProfile from './components/StaffProfile';
import ClinicProfile from './components/ClinicProfile';
import FeedbackBanner, { FeedbackType } from './components/ui/FeedbackBanner';
import EmptyState from './components/ui/EmptyState';
import ModuleSkeleton from './components/ModuleSkeleton';
import VideoModule, { CLINICAL_VIDEOS } from './components/VideoModule';
import { MediaLibraryHub } from './components/MediaLibraryHub';
import HomeworkProgress from './components/HomeworkProgress';
import EfLogRecord from './components/EfLogRecord';
import StaffManagement, { isDeveloperStaffAccount } from './components/StaffManagement';
import AdminExecutiveSummary from './components/AdminExecutiveSummary';
import ClinicalSourceManager from './components/ClinicalSourceManager';
import PatientContextBar from './components/PatientContextBar';
import AmbientBackground from './components/AmbientBackground';
import ParticipantCheckInPortal from './components/ParticipantCheckInPortal';
import { InceptionDossierModal } from './components/InceptionDossierModal';
import { VersionNotificationToast } from './components/VersionNotificationToast';
import { initVersionChecker, CURRENT_APP_VERSION } from './services/versionService';
import { useScrollLock } from './utils';
import { Logo } from './components/Logo';
import { dataAdapter, clearAllPatientLocalStorage, cleanPhoneString } from './services/dataAdapter';
import { cascadeDeletePatientAndRevokeQR, checkQRRevokedStatus } from './services/qrRevokeService';
import { generateUniquePatientQRToken } from './utils/qrCodeGenerator';
import { isFirebaseConfigured, subscribePatientByHN } from './services/firebase';

function isExplicitPatientUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const searchParams = new URLSearchParams(window.location.search);
  const mode = searchParams.get('mode');
  const portal = searchParams.get('portal');
  const hn = searchParams.get('hn') || searchParams.get('member') || searchParams.get('qr') || searchParams.get('token') || searchParams.get('phone') || searchParams.get('tel');
  const pathname = window.location.pathname.toLowerCase();
  return Boolean(
    pathname.includes('/patient') ||
    pathname.includes('/member/') ||
    mode === 'patient' ||
    portal === 'patient' ||
    Boolean(hn)
  );
}

function getInitialPatientHn(): string | null {
  if (typeof window === 'undefined') return null;
  let hn = getParamCaseInsensitive(window.location.search, ['hn', 'phone', 'tel', 'mobile', 'token', 'member', 'qr']);
  if (!hn && window.location.hash) {
    hn = getParamCaseInsensitive(window.location.hash, ['hn', 'phone', 'tel', 'mobile', 'token', 'member', 'qr']);
  }
  if (hn && !hn.toUpperCase().includes('DEMO-')) {
    const status = checkQRRevokedStatus(hn.trim());
    if (status.isRevoked) {
      return null;
    }
    const cleanVal = hn.trim();
    sessionStorage.setItem('growthlab_active_patient_hn', cleanVal);
    sessionStorage.setItem('current_user_hn', cleanVal);
    return cleanVal;
  }

  return null;
}

export default function App() {
  const initialPatientHn = useMemo(() => getInitialPatientHn(), []);
  const isPatientUrl = useMemo(() => isExplicitPatientUrl(), []);
  const persistentSession = useMemo(() => {
    if (isExplicitPatientUrl() || initialPatientHn) {
      return getPersistentPatientSession();
    }
    return null;
  }, [isPatientUrl, initialPatientHn]);

  // Authentication and Portal Selection state
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    const user = authService.getCurrentUser();
    return user ? (user.role === 'ADMIN' || user.role === 'DEVELOPER' || user.role === 'CLINIC_OWNER') : false;
  });
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const user = authService.getCurrentUser();
    return user?.role || 'ADMIN';
  });
  const [viewMode, setViewMode] = useState<'admin' | 'patient'>(() => {
    const user = authService.getCurrentUser();
    return user?.role === 'PATIENT' ? 'patient' : 'admin';
  });
  const [userRole, setUserRole] = useState<UserRole | null>(() => {
    const user = authService.getCurrentUser();
    return user?.role || null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return authService.isAuthenticated();
  });
  const [appMode, setAppMode] = useState<'select' | 'clinic' | 'patient'>(() => {
    if (isExplicitPatientUrl() || getInitialPatientHn()) return 'patient';
    const user = authService.getCurrentUser();
    if (user?.role === 'PATIENT') return 'patient';
    if (user?.role) return 'clinic';
    return 'select';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);
  const [showInceptionModal, setShowInceptionModal] = useState(false);
  const [dossierMainTab, setDossierMainTab] = useState<'deed' | 'architecture'>('deed');
  const [expandedMenu, setExpandedMenu] = useState<string | null>('ผู้รับการดูแล');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [showSystemManager, setShowSystemManager] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [systemManagerTab, setSystemManagerTab] = useState<'staff' | 'permissions' | 'settings' | 'documentation'>('settings');

  const defaultStaffList: StaffAccount[] = [
    {
      id: 'stf_1',
      name: 'ทันตแพทย์หญิง นภาพร วรรณษา',
      position: 'ทันตแพทย์ผู้ให้การรักษาและเจ้าของคลินิก',
      displayName: 'หมอนภาพร',
      phone: '0812345678',
      username: 'doctor',
      email: 'doctor@efpatientcare.com',
      password: 'doc123',
      status: 'active',
      role: 'DOCTOR',
      permissions: {
        Dashboard: true,
        'ผู้เข้าโปรแกรม': true,
        'ผู้รับการดูแล': true,
        'ติดตามการรักษา': true,
        'ติดตามผล': true,
        'EF / แบบฝึก': true,
        GNS: true,
        'การนอน': true,
        'การออกกำลังกาย': true,
        'Before / After': true,
        QR: true,
        'นัดหมาย': true,
        'วิดีโอ': true,
        'รายงาน': true,
        'คู่มือ': true,
        'คู่มือการใช้งาน': true,
        'บุคลากร': true,
        'Executive Summary': true,
        'Clinical Source': true,
        'จัดการเนื้อหา': true,
        'สื่อสาร / AI': true,
        'ตั้งค่า': true,
        'ตั้งค่าองค์กร': true,
        'ข้อมูลคลินิก': true,
      }
    },
    {
      id: 'stf_dev',
      name: 'ผู้พัฒนาระบบ (System Developer)',
      position: 'System Developer & Architecture',
      displayName: 'Developer',
      phone: '0899999999',
      username: 'dev',
      email: 'niramon7196@gmail.com',
      password: 'dev',
      status: 'active',
      role: 'DEVELOPER',
      permissions: {
        Dashboard: true,
        'ผู้เข้าโปรแกรม': true,
        'ผู้รับการดูแล': true,
        'ติดตามการรักษา': true,
        'ติดตามผล': true,
        'EF / แบบฝึก': true,
        GNS: true,
        'การนอน': true,
        'การออกกำลังกาย': true,
        'Before / After': true,
        QR: true,
        'นัดหมาย': true,
        'วิดีโอ': true,
        'รายงาน': true,
        'คู่มือ': true,
        'คู่มือการใช้งาน': true,
        'บุคลากร': true,
        'Executive Summary': true,
        'Clinical Source': true,
        'จัดการเนื้อหา': true,
        'สื่อสาร / AI': true,
        'ตั้งค่า': true,
        'ตั้งค่าองค์กร': true,
        'ข้อมูลคลินิก': true,
      }
    }
  ];

  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>(() => {
    const saved = localStorage.getItem('growth_lab_staff_accounts');
    if (saved) {
      try {
        const parsed: StaffAccount[] = JSON.parse(saved);
        if (parsed.length > 0) {
          // Clean up old mock data and old references to Dr. Somchai
          const cleaned = parsed
            .filter(s => !s.name?.includes('สมศรี') && s.username !== 'assistant' && s.id !== 'stf_2')
            .map(s => {
              if (s.username === 'doctor') {
                let updated = { ...s };
                if (!updated.email) {
                  updated.email = 'doctor@efpatientcare.com';
                }
                if (s.name?.includes('สมชาย') || s.displayName?.includes('สมชาย')) {
                  updated = {
                    ...updated,
                    name: 'ทันตแพทย์หญิง นภาพร วรรณษา',
                    displayName: 'หมอนภาพร',
                    position: 'ทันตแพทย์ผู้ให้การรักษาและเจ้าของคลินิก'
                  };
                }
                return updated;
              }
              return s;
            });
          if (!cleaned.some(s => s.username === 'doctor')) {
            cleaned.unshift(defaultStaffList[0]);
          }
          if (!cleaned.some(s => s.username === 'dev' || s.email?.toLowerCase() === 'niramon7196@gmail.com')) {
            cleaned.push(defaultStaffList[1]);
          }
          return cleaned.length > 0 ? cleaned : defaultStaffList;
        }
      } catch (e) { /* ignore */ }
    }
    return defaultStaffList;
  });

  useEffect(() => {
    localStorage.setItem('growth_lab_staff_accounts', JSON.stringify(staffAccounts));
  }, [staffAccounts]);

  // Global Auto Version Checker & Notification Engine (Clinic + Patient Portal)
  useEffect(() => {
    const cleanup = initVersionChecker();
    return cleanup;
  }, []);

  const handleAddStaff = (newStaff: Omit<StaffAccount, 'id'>) => {
    const staffWithId: StaffAccount = {
      id: `stf_${Date.now()}`,
      ...newStaff
    };
    const updatedList = [...staffAccounts, staffWithId];
    setStaffAccounts(updatedList);
    saveStateToLocal('growth_lab_staff_accounts', updatedList);
    dataAdapter.saveStaffAccount(staffWithId).catch(e => console.warn('[App] Firestore staff add error:', e));
    triggerFeedback('เพิ่มบุคลากรใหม่เรียบร้อยแล้ว', 'success');
  };

  const handleUpdateStaff = (id: string, updated: Partial<StaffAccount>) => {
    const updatedList = staffAccounts.map(s => s.id === id ? { ...s, ...updated } : s);
    setStaffAccounts(updatedList);
    saveStateToLocal('growth_lab_staff_accounts', updatedList);
    const target = updatedList.find(s => s.id === id);
    if (target) {
      dataAdapter.saveStaffAccount(target).catch(e => console.warn('[App] Firestore staff update error:', e));
    }
    triggerFeedback('บันทึกการแก้ไขข้อมูลบุคลากรเรียบร้อยแล้ว', 'success');
  };

  const handleDeleteStaff = (id: string) => {
    const updatedList = staffAccounts.filter(s => s.id !== id);
    setStaffAccounts(updatedList);
    saveStateToLocal('growth_lab_staff_accounts', updatedList);
    dataAdapter.deleteStaffAccount(id).catch(e => console.warn('[App] Firestore staff delete error:', e));
    triggerFeedback('ลบบุคลากรออกจากระบบเรียบร้อยแล้ว', 'success');
  };

  const handleToggleStaffStatus = (id: string) => {
    const updatedList = staffAccounts.map(s => {
      if (s.id === id) {
        const nextStatus: 'active' | 'inactive' = s.status === 'active' ? 'inactive' : 'active';
        const updated: StaffAccount = { ...s, status: nextStatus };
        dataAdapter.saveStaffAccount(updated).catch(e => console.warn('[App] Firestore staff status update error:', e));
        return updated;
      }
      return s;
    });
    setStaffAccounts(updatedList);
    saveStateToLocal('growth_lab_staff_accounts', updatedList);
    triggerFeedback('เปลี่ยนสถานะบุคลากรสำเร็จ', 'success');
  };

  useScrollLock(isMobileMenuOpen);

  // App core states - Default to Dashboard for Admin view
  const [activeTab, setActiveTab] = useState<string>('Dashboard');
  const [activeModule, setActiveModule] = useState<string | null>(null);
  
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>(undefined);

  const handleSelectPatient = (patientId: string | undefined, persist: boolean = true) => {
    // Only update if actually different to prevent unnecessary cycles
    setSelectedPatientId(prev => {
      if (prev === patientId) return prev;
      
      if (persist) {
        if (patientId) {
          sessionStorage.setItem('growth_lab_selected_patient_id', patientId);
          localStorage.setItem('growth_lab_selected_patient_id', patientId);
        } else if (patientId === undefined || patientId === null || patientId === '') {
          sessionStorage.removeItem('growth_lab_selected_patient_id');
          localStorage.removeItem('growth_lab_selected_patient_id');
        }
      }
      return patientId;
    });
  };

  const [profileSubTab, setProfileSubTab] = useState<string>('ภาพรวม');

  // Navigation History Stack
  const [navHistory, setNavHistory] = useState<Array<{ tab: string; patientId?: string; subTab?: string }>>([]);

  const navigateTo = (tab: string, patientId?: string, subTab?: string, autoAdd?: boolean) => {
    if (activeTab !== tab || selectedPatientId !== patientId || profileSubTab !== subTab) {
      setNavHistory(prev => [...prev, { tab: activeTab, patientId: selectedPatientId, subTab: profileSubTab }]);
    }
    setActiveTab(tab);
    if (patientId !== undefined) {
      handleSelectPatient(patientId);
    }
    if (subTab !== undefined) {
      setProfileSubTab(subTab);
    }
    if (autoAdd) {
      setTimeout(() => {
        const btn = document.getElementById('btn-add-patient-modal');
        if (btn) btn.click();
      }, 100);
    }
  };

  const goBack = () => {
    if (isPatient) {
      if (!assignedPatient) {
        // If patient profile is missing or session cleared, return to QR scan / login gateway
        setSelectedPatientId(undefined);
        setActiveTab('Check-In');
        authService.logout();
        setIsAuthenticated(false);
        return;
      }
      if (navHistory.length > 0) {
        const last = navHistory[navHistory.length - 1];
        setNavHistory(stack => stack.slice(0, -1));
        const safeTab = (last.tab && allowedTabs.includes(last.tab) && last.tab !== 'Dashboard') ? last.tab : (assignedPatient ? 'หน้าหลัก' : 'Check-In');
        setActiveTab(safeTab);
        if (last.subTab) setProfileSubTab(last.subTab);
      } else {
        // Default safe landing for participant portal is the Member Dashboard ('หน้าหลัก')
        setActiveTab(assignedPatient ? 'หน้าหลัก' : 'Check-In');
      }
      return;
    }

    if (navHistory.length > 0) {
      const last = navHistory[navHistory.length - 1];
      setNavHistory(stack => stack.slice(0, -1));
      setActiveTab(last.tab || 'Dashboard');
      if (last.patientId) {
        setSelectedPatientId(last.patientId);
      } else {
        setSelectedPatientId(undefined);
      }
      if (last.subTab) setProfileSubTab(last.subTab);
    } else {
      setActiveTab('Dashboard');
      setSelectedPatientId(undefined);
    }
  };
  const [activeModules, setActiveModules] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('growth_lab_active_modules');
    return saved ? JSON.parse(saved) : { sleep: false, exercise: false };
  });

  const [videoList, setVideoList] = useState<VideoItem[]>(() => {
    const saved = localStorage.getItem('growth_lab_videos');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return CLINICAL_VIDEOS;
      }
    }
    return CLINICAL_VIDEOS;
  });

  useEffect(() => {
    localStorage.setItem('growth_lab_active_modules', JSON.stringify(activeModules));
  }, [activeModules]);

  useEffect(() => {
    localStorage.setItem('growth_lab_videos', JSON.stringify(videoList));
  }, [videoList]);

  const handleAddVideo = (video: VideoItem) => {
    setVideoList([...videoList, video]);
    triggerFeedback('เพิ่มวิดีโอสำเร็จ', 'success');
  };

  const handleEditVideo = (video: VideoItem) => {
    setVideoList(videoList.map(v => v.id === video.id ? video : v));
    triggerFeedback('แก้ไขข้อมูลวิดีโอสำเร็จ', 'success');
  };

  const handleDeleteVideo = (id: string) => {
    setVideoList(videoList.filter(v => v.id !== id));
    triggerFeedback('ลบวิดีโอเรียบร้อยแล้ว', 'success');
  };

  const [clinicalSourceDocuments, setClinicalSourceDocuments] = useState<ClinicalSourceDocument[]>(() => {
    const saved = localStorage.getItem('growth_lab_clinical_sources');
    if (saved) {
      try {
        const parsed: ClinicalSourceDocument[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map(d => d.id));
        const missing = INITIAL_CLINICAL_SOURCE_DOCUMENTS.filter(d => !existingIds.has(d.id));
        return [...parsed, ...missing];
      } catch (e) {
        return INITIAL_CLINICAL_SOURCE_DOCUMENTS;
      }
    }
    return INITIAL_CLINICAL_SOURCE_DOCUMENTS;
  });

  useEffect(() => {
    localStorage.setItem('growth_lab_clinical_sources', JSON.stringify(clinicalSourceDocuments));
  }, [clinicalSourceDocuments]);

  const handleUpdateClinicalSourceStatus = (
    sourceId: string, 
    newStatus: 'PENDING VERIFICATION' | 'VERIFIED CLINICAL SOURCE'
  ) => {
    setClinicalSourceDocuments(prev => prev.map(doc => {
      if (doc.id === sourceId) {
        const currentUser = authService.getCurrentUser();
        return {
          ...doc,
          status: newStatus,
          verifiedBy: newStatus === 'VERIFIED CLINICAL SOURCE' ? (currentUser?.name || 'บุคลากรทางการแพทย์') : undefined,
          verificationDate: newStatus === 'VERIFIED CLINICAL SOURCE' ? new Date().toLocaleDateString('th-TH') : undefined
        };
      }
      return doc;
    }));
  };

  const handleAddClinicalSource = (newDoc: ClinicalSourceDocument) => {
    setClinicalSourceDocuments(prev => [newDoc, ...prev]);
    triggerFeedback(`นำเข้าเอกสารอ้างอิง "${newDoc.title}" เรียบร้อยแล้ว`, 'success');
  };

  
  
  




  const [authenticatedPatient, setAuthenticatedPatient] = useState<Patient | null>(null);

  const [patients, setPatients] = useState<Patient[]>(() => {
    try {
      // Clear old cached keys like 'ef_patients'
      localStorage.removeItem('ef_patients');
      const localMaster = localStorage.getItem('growthlab_patients_master');
      const local1 = localStorage.getItem('growth_lab_patients');
      const local2 = localStorage.getItem('growthlab_patients');
      let rawData = localMaster || local1 || local2;
      if (rawData) {
        const parsed = JSON.parse(rawData);
        if (Array.isArray(parsed)) {
          // Strictly filter out DEMO or corrupt/empty mock placeholder entries
          const filtered = parsed.filter((p: Patient) => {
            if (!p) return false;
            if (p.hn?.includes('DEMO-') || p.id?.toLowerCase().includes('demo')) return false;
            const hnStr = (p.hn || p.id || '').toString().trim();
            const nicknameStr = (p.nickname || '').toString().trim();
            const rawName = (p.firstName || (p as any).name || '').toString();
            const nameStr = rawName.replace(/^(ด\.?ช\.?|ด\.?ญ\.?|เด็กชาย|เด็กหญิง|นาย|นางสาว|น\.?ส\.?|นาง|คุณ|น้อง)\s*/i, '').trim();
            const isInvalidHn = !hnStr || hnStr === 'HN-' || hnStr === 'HN-00000' || hnStr === '00000';
            const hasValidName = Boolean(nameStr && nameStr !== 'ไม่ระบุชื่อ' && nameStr !== 'ผู้รับการดูแล' && !nameStr.startsWith('คนไข้ ('));
            const hasValidNickname = Boolean(nicknameStr && nicknameStr !== '-' && nicknameStr !== 'ไม่ระบุ');
            
            // Accept ONLY IF HN is valid AND there is a valid real name
            return (!isInvalidHn) && hasValidName;
          });

          return filtered.map((p: Patient) => {
            const hn = (p.hn || p.id || '').toString().trim();
            const nickname = (p.nickname || '').toString().trim();
            let firstName = (p.firstName || (p as any).name || '').toString().trim();
            if (!firstName || firstName === 'ไม่ระบุชื่อ' || firstName === 'ผู้รับการดูแล') {
              if (nickname) {
                firstName = hn ? `คนไข้ (${hn})` : 'ผู้รับการดูแล';
              } else if (hn) {
                firstName = `ผู้ป่วย (${hn})`;
              } else {
                firstName = 'ผู้รับการดูแล';
              }
            }
            const phone = cleanPhoneString(p.phone || p.parentPhone);
            return {
              ...p,
              firstName,
              nickname: nickname || firstName,
              phone,
              parentPhone: phone || p.parentPhone || '',
              qrToken: p.qrToken || `tok_${p.id}_${(p.hn || 'hn').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
            };
          });
        }
      }
    } catch (e) {
      console.warn('[App] Error reading initial patients from localStorage:', e);
    }
    return [];
  });

  const [logs, setLogs] = useState<SessionLog[]>(() => {
    try {
      const local = localStorage.getItem('growth_lab_logs');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('[App] Error reading initial logs:', e);
    }
    const seed = generateSeedLogs();
    try {
      localStorage.setItem('growth_lab_logs', JSON.stringify(seed));
    } catch (e) { /* ignore */ }
    return seed;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try {
      const local = localStorage.getItem('growth_lab_appointments');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('[App] Error reading initial appointments:', e);
    }
    try {
      localStorage.setItem('growth_lab_appointments', JSON.stringify(SEED_APPOINTMENTS));
    } catch (e) { /* ignore */ }
    return SEED_APPOINTMENTS;
  });

  const [notifications, setNotifications] = useState<SystemNotification[]>(() => {
    try {
      const local = localStorage.getItem('growth_lab_notifications');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('[App] Error reading initial notifications:', e);
    }
    try {
      localStorage.setItem('growth_lab_notifications', JSON.stringify(SEED_NOTIFICATIONS));
    } catch (e) { /* ignore */ }
    return SEED_NOTIFICATIONS;
  });

  const [settings, setSettings] = useState<ClinicSettings>(() => {
    let base = { ...DEFAULT_SETTINGS };
    try {
      const clinicInfoLocal = localStorage.getItem('growthlab_clinic_info');
      if (clinicInfoLocal) {
        const parsed = JSON.parse(clinicInfoLocal);
        if (parsed && typeof parsed === 'object') base = { ...base, ...parsed };
      }
      const local = localStorage.getItem('growth_lab_settings');
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed && typeof parsed === 'object') base = { ...base, ...parsed };
      }
    } catch (e) {
      console.warn('[App] Error reading initial settings:', e);
    }

    // Ensure official clinic data is locked & clean (no old placeholders / no invalid address)
    if (!base.address || base.address.includes('สุขุมวิท') || base.address.includes('ช่องสาริกา') || !base.address.includes('ดีลัง')) {
      base.address = '366/4 ม.1 ตำบลดีลัง อำเภอพัฒนานิคม จังหวัดลพบุรี 15220';
    }
    if (!base.clinicName || base.clinicName === 'Growth Lab' || base.clinicName === 'Growth Lab Dental & Orthodontics') {
      base.clinicName = 'คลินิกทันตกรรมภาสุข (Growth Lab)';
    }
    if (!base.phone || base.phone === '099-999-9999' || base.phone === '02-123-4567') {
      base.phone = '081-8517672';
    }
    if (!base.email || base.email === 'contact@growthlabclinic.com' || base.email === 'doctor@efpatientcare.com') {
      base.email = '12pasuk.system@gmail.com';
    }
    if (!base.doctorName) {
      base.doctorName = 'ทันตแพทย์หญิง นภาพร วรรณษา';
    }
    if (!base.doctorLicenseNo) {
      base.doctorLicenseNo = 'ท.8482';
    }

    try {
      localStorage.setItem('growthlab_clinic_info', JSON.stringify(base));
      localStorage.setItem('growth_lab_settings', JSON.stringify(base));
      localStorage.setItem('clinic_profile_data', JSON.stringify(base));
    } catch (e) { /* ignore */ }
    return base;
  });
  
  const [isInitialDataLoading, setIsInitialDataLoading] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const hn = getInitialPatientHn();
      if (hn) return true;
    }
    return false;
  });

  // Global safety net: guarantee isInitialDataLoading is NEVER true for > 10 seconds on mobile
  useEffect(() => {
    if (isInitialDataLoading) {
      const timer = setTimeout(() => {
        console.warn('[App] isInitialDataLoading 10s limit reached - forcing loading state to false');
        setIsInitialDataLoading(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isInitialDataLoading]);

  const [feedback, setFeedback] = useState<{ message: string; type: FeedbackType } | null>(null);
  const [isPatientHomeworkOpen, setIsPatientHomeworkOpen] = useState<boolean>(true);
  const [selectedExerciseIdFromNav, setSelectedExerciseIdFromNav] = useState<string | null>(null);
  const [selectedHomeworkStage, setSelectedHomeworkStage] = useState<'all' | 'gns' | 'sleep' | 'exercise' | 'omt'>(() => {
    try {
      const saved = localStorage.getItem('growth_lab_active_homework_stage');
      if (saved && ['all', 'gns', 'sleep', 'exercise', 'omt'].includes(saved)) {
        return saved as any;
      }
    } catch {}
    return 'all';
  });

  // State persistence for selected homework stage
  useEffect(() => {
    if (selectedHomeworkStage) {
      try {
        localStorage.setItem('growth_lab_active_homework_stage', selectedHomeworkStage);
      } catch {}
    }
  }, [selectedHomeworkStage]);

  // State persistence for patient active tab
  useEffect(() => {
    if (userRole === 'PATIENT' && activeTab) {
      try {
        localStorage.setItem('growth_lab_patient_active_tab', activeTab);
      } catch {}
    }
  }, [userRole, activeTab]);

  const triggerFeedback = (message: string, type: FeedbackType = 'success') => {
    const formatted = type === 'success' && !message.startsWith('✓') ? `✓ ${message}` : message;
    setFeedback({ message: formatted, type });
    setTimeout(() => setFeedback(null), 2500);
  };

  // Reference to the main scrollable content container
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Smoothly reset scroll position of the right main content pane to top whenever the tab/patient/subtab changes
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab, selectedPatientId, profileSubTab, selectedHomeworkStage]);

  // Settings click handling (Locked for Developer only: email "niramon7196@gmail.com" or role "DEVELOPER")
  const handleGearClick = () => {
    const activeUser = authService.getCurrentUser();
    const activeStaff = staffAccounts.find(s => s.username === activeUser?.username);
    const isDev = Boolean(
      userRole === 'DEVELOPER' ||
      activeUser?.role === 'DEVELOPER' ||
      activeUser?.email?.toLowerCase() === 'niramon7196@gmail.com' ||
      activeStaff?.email?.toLowerCase() === 'niramon7196@gmail.com' ||
      activeUser?.username?.toLowerCase() === 'niramon7196@gmail.com' ||
      activeUser?.username?.toLowerCase().includes('niramon') ||
      (typeof window !== 'undefined' && (
        localStorage.getItem('growthlab_user_email')?.toLowerCase() === 'niramon7196@gmail.com' ||
        localStorage.getItem('growth_lab_auth')?.toLowerCase().includes('niramon7196@gmail.com')
      ))
    );

    if (isDev) {
      setShowSystemManager(true);
    }
  };

  const handleBypassAdminLogin = () => {
    authService.login('ADMIN', undefined, 'ผู้ดูแลระบบ (Admin)', undefined, 'admin');
    setIsAdmin(true);
    setCurrentRole('ADMIN');
    setUserRole('ADMIN');
    setViewMode('admin');
    setIsAuthenticated(true);
    setAppMode('clinic');
    setActiveTab('Dashboard');
    setShowAdminLoginModal(false);
    setShowSystemManager(true);
    triggerFeedback('เข้าสู่โหมดผู้ดูแลระบบและศูนย์จัดการระบบ (Admin Dashboard) เรียบร้อยแล้ว', 'success');
  };

  const handleAdminLoginSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const usr = (adminUsername || 'admin').toLowerCase().trim();
    const pwd = adminPassword.trim();
    let assignedRole: UserRole | null = null;

    // Supported usernames: 'dev', 'admin', 'owner', 'niramon', 'niramon7196@gmail.com', or empty (defaults to admin)
    // Supported passwords: 'dev123', 'admin123', 'admin', 'dev', '1234', or empty bypass
    const isValidUser = usr === 'dev' || usr === 'admin' || usr === 'owner' || usr === '' || usr === 'niramon' || usr === 'niramon7196@gmail.com';
    const isValidPassword = !pwd || pwd === 'dev123' || pwd === 'admin123' || pwd === 'admin' || pwd === 'dev' || pwd === '1234';

    if (isValidUser && isValidPassword) {
      assignedRole = (usr === 'dev' || usr === 'niramon' || usr === 'niramon7196@gmail.com') ? 'DEVELOPER' : 'ADMIN';
    }

    if (assignedRole) {
      authService.login(
        assignedRole, 
        undefined, 
        assignedRole === 'DEVELOPER' ? 'ผู้พัฒนาระบบ' : 'ผู้ดูแลระบบ (Admin)', 
        undefined, 
        usr || 'admin',
        (assignedRole === 'DEVELOPER' || usr.includes('niramon')) ? 'niramon7196@gmail.com' : undefined
      );
      setIsAdmin(true);
      setCurrentRole(assignedRole);
      setUserRole(assignedRole);
      setViewMode('admin');
      setIsAuthenticated(true);
      setAppMode('clinic');
      setActiveTab('Dashboard');
      setShowAdminLoginModal(false);
      setAdminUsername('');
      setAdminPassword('');
      setShowSystemManager(true);
      triggerFeedback(`เข้าสู่ระบบศูนย์ผู้พัฒนา (${assignedRole}) สำเร็จ`, 'success');
    } else {
      setShowAdminLoginModal(false);
      setAdminUsername('');
      setAdminPassword('');
      setShowAccessDenied(true);
      triggerFeedback('รหัสผ่านหรือชื่อผู้ใช้ไม่ถูกต้อง (คุณสามารถกดปุ่ม "ข้ามการล็อกอิน" เพื่อเข้าสู่ระบบได้ทันที)', 'error');
    }
  };

  useEffect(() => {
    // Check if URL explicitly requests patient mode (e.g. via direct patient link)
    if (isExplicitPatientUrl()) {
      const user = authService.getCurrentUser();
      if (user?.role === 'PATIENT' && user.patientId) {
        setIsAdmin(false);
        setCurrentRole('PATIENT');
        setUserRole('PATIENT');
        setViewMode('patient');
        setAppMode('patient');
        handleSelectPatient(user.patientId, false);
        return;
      }
    }

    const savedUser = authService.getCurrentUser();
    if (savedUser) {
      const isRoleAdmin = savedUser.role === 'ADMIN' || savedUser.role === 'DEVELOPER' || savedUser.role === 'CLINIC_OWNER';
      setIsAdmin(isRoleAdmin);
      setCurrentRole(savedUser.role);
      setUserRole(savedUser.role);
      setViewMode(isRoleAdmin ? 'admin' : 'patient');
      setIsAuthenticated(true);
      setAppMode(savedUser.role === 'PATIENT' ? 'patient' : 'clinic');
      if (savedUser.role === 'PATIENT') {
        setActiveTab('หน้าหลัก');
        if (savedUser.patientId) handleSelectPatient(savedUser.patientId, false);
      } else {
        setActiveTab('Dashboard');
        setSelectedPatientId(undefined);
      }
    } else {
      // Default: Portal Selection
      setIsAuthenticated(false);
      setUserRole(null);
      setIsAdmin(false);
      setAppMode('select');
    }
  }, []);

  const handleSwitchToClinicMode = () => {
    try {
      clearPersistentPatientSession();
      localStorage.removeItem('current_user_hn');
      localStorage.removeItem('growthlab_active_patient_hn');
      localStorage.removeItem('growth_lab_active_patient_hn');
      localStorage.removeItem('growth_lab_registered_patient');
      localStorage.removeItem('growth_lab_persistent_patient');
      sessionStorage.removeItem('growthlab_active_patient_hn');
      sessionStorage.removeItem('current_user_hn');
    } catch (e) {
      console.warn('[handleSwitchToClinicMode] storage clear error:', e);
    }

    authService.login('ADMIN', undefined, 'ผู้ดูแลระบบ (Admin)', undefined, 'admin');
    setIsAdmin(true);
    setCurrentRole('ADMIN');
    setUserRole('ADMIN');
    setViewMode('admin');
    setIsAuthenticated(true);
    setAppMode('clinic');
    setActiveTab('Dashboard');
    setSelectedPatientId(undefined);
    handleSelectPatient(undefined, false);
    setIsMobileMenuOpen(false);
    triggerFeedback('เข้าสู่โหมดผู้ดูแลระบบ (Admin Dashboard) เรียบร้อยแล้ว', 'success');
  };

  const handleSwitchToPatientMode = (patientId?: string) => {
    const targetPat = patientId ? patients.find(p => p.id === patientId) : (patients[0] || null);
    const patId = targetPat?.id || 'pat_demo';
    const patName = targetPat ? `${targetPat.firstName} ${targetPat.lastName}`.trim() : 'คนไข้ตัวอย่าง';
    const patHn = targetPat?.hn || 'HN-DEMO';

    authService.login('PATIENT', patId, patName, undefined, patHn);
    setIsAdmin(false);
    setCurrentRole('PATIENT');
    setUserRole('PATIENT');
    setViewMode('patient');
    setAppMode('patient');
    setIsAuthenticated(true);
    if (targetPat) {
      handleSelectPatient(targetPat.id);
    }
    setActiveTab('หน้าหลัก');
    setIsMobileMenuOpen(false);
    triggerFeedback(`สลับไปยังมุมมองคนไข้: ${patName} (${patHn}) — สามารถกดสลับกลับสู่โหมดผู้ดูแลระบบได้ตลอดเวลา`, 'info');
  };

  const handleLogout = () => {
    try {
      clearPersistentPatientSession();
      localStorage.removeItem('current_user_hn');
      localStorage.removeItem('growthlab_active_patient_hn');
      localStorage.removeItem('growth_lab_active_patient_hn');
      localStorage.removeItem('growth_lab_selected_patient_id');
      localStorage.removeItem('growth_lab_auth');
      localStorage.removeItem('growth_lab_registered_patient');
      localStorage.removeItem('growth_lab_registration_status');
      localStorage.removeItem('growth_lab_portal_mode');
      localStorage.removeItem('growth_lab_device_mode');
      sessionStorage.clear();
    } catch (e) {
      console.warn('[handleLogout] storage clear error:', e);
    }
    authService.logout();
    processedTokenRef.current = null;
    setIsAdmin(false);
    setCurrentRole('ADMIN');
    setViewMode('admin');
    setUserRole(null);
    setIsAuthenticated(false);
    setSelectedPatientId(undefined);
    handleSelectPatient(undefined, false);
    setActiveTab('Dashboard');
    setActiveModule(null);
    setNavHistory([]);
    setIsMobileMenuOpen(false);
    setShowLogoutConfirmModal(false);
    setShowAccessDenied(false);
    setShowWelcomeModal(false);
    setAppMode('select');

    if (typeof window !== 'undefined') {
      try {
        if (window.history && window.history.replaceState) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (e) {}
    }
  };

  // Validate selected patient exists in loaded patient list
  useEffect(() => {
    if (selectedPatientId && patients.length > 0 && userRole !== 'PATIENT') {
      const exists = patients.some(p => p.id === selectedPatientId);
      if (!exists) {
        handleSelectPatient(undefined);
      }
    }
  }, [patients, selectedPatientId, userRole]);

  // Guard System Management and Settings Panel access
  useEffect(() => {
    const activeUser = authService.getCurrentUser();
    const activeStaff = staffAccounts.find(s => s.username === activeUser?.username);
    const isAuthorizedStaff = isAdmin || 
      userRole === 'DEVELOPER' || 
      userRole === 'ADMIN' || 
      userRole === 'CLINIC_OWNER' || 
      userRole === 'DOCTOR' || 
      activeUser?.email?.toLowerCase() === 'niramon7196@gmail.com' ||
      activeStaff?.email?.toLowerCase() === 'niramon7196@gmail.com' ||
      activeUser?.username?.toLowerCase() === 'niramon7196@gmail.com' ||
      activeUser?.username?.toLowerCase().includes('niramon') ||
      activeUser?.role === 'ADMIN' ||
      activeUser?.role === 'DOCTOR' ||
      activeUser?.role === 'DEVELOPER' ||
      activeUser?.role === 'CLINIC_OWNER';

    const isMedicalStaff = isAuthorizedStaff || userRole === 'ASSISTANT';

    // 1. Allow System Manager modal and 'ตั้งค่า' tab for Super Admin / Doctor / Developer / niramon7196@gmail.com
    if (!isAuthorizedStaff) {
      if (showSystemManager) {
        setShowSystemManager(false);
        setShowAccessDenied(true);
      }
      if (activeTab === 'ตั้งค่า' || activeTab === 'Organization Settings') {
        setShowAccessDenied(true);
        setActiveTab('Dashboard');
      }
    }

    // 2. Restrict other medical system tabs strictly to Medical Staff
    if (!isMedicalStaff) {
      const systemTabs = ['media_library', 'คลังวิดีโอสาธิต', 'วิดีโอ', 'ระบบ / โปรไฟล์', 'บุคลากร'];
      if (systemTabs.includes(activeTab)) {
        setShowAccessDenied(true);
        setActiveTab('Dashboard');
      }
    }
  }, [userRole, activeTab, showSystemManager, isAdmin]);

  useEffect(() => {
    if (isAuthenticated && !localStorage.getItem('growth_lab_welcomed')) {
      setShowWelcomeModal(true);
    }
  }, [isAuthenticated]);

  const handleRefreshPatientsFromGoogleSheets = useCallback(async (showToast: boolean = false, isBackground: boolean = false) => {
    if (!isBackground) {
      setIsInitialDataLoading(true);
    }
    const safetyTimer = setTimeout(() => {
      setIsInitialDataLoading(false);
    }, 4500);

    try {
      // 1. Direct call to cloudApi.getPatients(), cloudApi.getDailyLogs(), and listAppointments
      const [cloudRes, cloudLogsRes, apptsRes] = await Promise.all([
        cloudApi.getPatients(),
        cloudApi.getDailyLogs(),
        dataAdapter.listAppointments().catch(() => null)
      ]);

      if (apptsRes && Array.isArray(apptsRes)) {
        setAppointments(apptsRes);
        saveStateToLocal('growth_lab_appointments', apptsRes);
      }

      if (cloudLogsRes && Array.isArray(cloudLogsRes)) {
        setLogs(cloudLogsRes);
        localStorage.setItem('growthlab_logs_cache', JSON.stringify(cloudLogsRes));
      }

      if (cloudRes.success && Array.isArray(cloudRes.patients)) {
        const freshList = cloudRes.patients;
        setPatients([...freshList]);
        const serialized = JSON.stringify(freshList);
        localStorage.setItem('growthlab_patients_master', serialized);
        localStorage.setItem('growth_lab_patients', serialized);
        localStorage.setItem('growthlab_patients', serialized);
        
        if (showToast && triggerFeedback) {
          if (freshList.length > 0) {
            triggerFeedback(`✓ ซิงค์ข้อมูลจาก Google Sheets สำเร็จ (พบ ${freshList.length} ราย)`, 'success');
          } else {
            triggerFeedback('ℹ️ ซิงค์กับ Google Sheets แล้ว (ยังไม่มีข้อมูลคนไข้ในชีต 0 ราย)', 'info');
          }
        }
        return freshList;
      }

      // 2. Fallback to dataAdapter.listMembers()
      const remoteMembersPromise = dataAdapter.listMembers();
      const timeoutPromise = new Promise<Patient[] | null>((resolve) => setTimeout(() => resolve(null), 3500));
      const remoteMembers = await Promise.race([remoteMembersPromise, timeoutPromise]);

      if (remoteMembers !== null && Array.isArray(remoteMembers)) {
        setPatients([...remoteMembers]);
        const serialized = JSON.stringify(remoteMembers);
        localStorage.setItem('growthlab_patients_master', serialized);
        localStorage.setItem('growth_lab_patients', serialized);
        localStorage.setItem('growthlab_patients', serialized);

        if (showToast && triggerFeedback) {
          if (remoteMembers.length > 0) {
            triggerFeedback(`✓ ซิงค์ข้อมูลจาก Google Sheets สำเร็จ (พบ ${remoteMembers.length} ราย)`, 'success');
          } else {
            triggerFeedback('ℹ️ ซิงค์กับ Google Sheets แล้ว (ยังไม่มีข้อมูลคนไข้ในชีต 0 ราย)', 'info');
          }
        }
        return remoteMembers;
      } else {
        const currentLocal = JSON.parse(
          localStorage.getItem('growthlab_patients_master') ||
          localStorage.getItem('growth_lab_patients') ||
          localStorage.getItem('growthlab_patients') || '[]'
        );
        if (currentLocal && Array.isArray(currentLocal)) {
          setPatients([...currentLocal]);
        }
        if (showToast && triggerFeedback) {
          triggerFeedback('⚠️ ไม่สามารถเชื่อมต่อกับ Google Sheets ได้ (กรุณาตรวจสอบอินเทอร์เน็ต)', 'warning');
        }
        return currentLocal;
      }
    } catch (err) {
      console.warn('[App] Refresh members error:', err);
      const currentLocal = JSON.parse(
        localStorage.getItem('growthlab_patients_master') ||
        localStorage.getItem('growth_lab_patients') ||
        localStorage.getItem('growthlab_patients') || '[]'
      );
      if (currentLocal && Array.isArray(currentLocal)) {
        setPatients([...currentLocal]);
      }
      if (showToast && triggerFeedback) {
        triggerFeedback('⚠️ ไม่สามารถเชื่อมต่อกับ Google Sheets ได้ (กรุณาตรวจสอบอินเทอร์เน็ต)', 'warning');
      }
      return null;
    } finally {
      clearTimeout(safetyTimer);
      setIsInitialDataLoading(false);
    }
  }, [triggerFeedback]);

  // Synchronize when custom events are triggered from cloudApi
  useEffect(() => {
    const handlePatientsSyncEvent = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setPatients([...e.detail]);
      }
    };
    const handleReturnToHome = (e: any) => {
      const target = e.detail?.targetTab || 'หน้าหลัก';
      setActiveTab(target);
    };
    window.addEventListener('growthlab_patients_updated', handlePatientsSyncEvent);
    window.addEventListener('growth_lab_return_to_home', handleReturnToHome);
    return () => {
      window.removeEventListener('growthlab_patients_updated', handlePatientsSyncEvent);
      window.removeEventListener('growth_lab_return_to_home', handleReturnToHome);
    };
  }, []);

  // Fetch latest members, appointments and logs on launch (Google Sheets / Firestore)
  useEffect(() => {
    handleRefreshPatientsFromGoogleSheets(false, false);

    // Auto-refresh (real-time sync) silently when window regains focus
    const handleFocus = () => {
      // Only do silent background fetch if already authenticated to keep it updated
      if (isAuthenticated) {
        handleRefreshPatientsFromGoogleSheets(false, true);
      }
    };
    window.addEventListener('focus', handleFocus);
    
    cloudApi.getClinicConfig(getWebhookUrl()).then(res => {
      if (res && res.success && res.data) {
        const remoteConfig = res.data;
        if (remoteConfig.admins && remoteConfig.admins.length > 0) {
          setStaffAccounts(prev => {
            const mapped = remoteConfig.admins.map(a => ({
              id: a.id || `stf_${a.username}`,
              name: a.name,
              username: a.username,
              password: a.password || '●●●●●●',
              displayName: a.displayName || a.name,
              role: a.role,
              position: a.position || 'ผู้ดูแลระบบ',
              email: a.email || '',
              phone: a.phone || '',
              status: (a.status as 'active' | 'inactive') || 'active',
              permissions: a.permissions || {
                'Dashboard': true,
                'ผู้รับการดูแล': true,
                'ติดตามผล': true,
                'EF / แบบฝึก': true,
                'ตั้งค่า': true,
                'ข้อมูลคลินิก': true,
                'บุคลากร': true
              }
            }));
            localStorage.setItem('growth_lab_staff_accounts', JSON.stringify(mapped));
            return mapped;
          });
        }
        if (remoteConfig.clinicName || remoteConfig.doctorName) {
          setSettings(prev => {
            const updated = {
              ...prev,
              clinicName: remoteConfig.clinicName || prev.clinicName,
              doctorName: remoteConfig.doctorName || prev.doctorName,
              clinicNameEn: remoteConfig.clinicNameEn || prev.clinicNameEn,
              phone: remoteConfig.phone || prev.phone,
              address: remoteConfig.address || prev.address,
              email: remoteConfig.email || prev.email,
              doctorLicenseNo: remoteConfig.doctorLicenseNo || prev.doctorLicenseNo,
              doctorSpecialty: remoteConfig.doctorSpecialty || prev.doctorSpecialty,
              doctorTitlePosition: remoteConfig.doctorTitlePosition || prev.doctorTitlePosition,
            };
            try {
              localStorage.setItem('growthlab_clinic_info', JSON.stringify(updated));
              localStorage.setItem('growth_lab_settings', JSON.stringify(updated));
              localStorage.setItem('growthlab_settings', JSON.stringify(updated));
            } catch (e) {}
            return updated;
          });
        }
      }
    }).catch(err => console.warn('[App] Clinic config fetch warning:', err));

    const handleClinicInfoUpdated = () => {
      try {
        const raw = localStorage.getItem('clinic_profile_data') || localStorage.getItem('growthlab_clinic_info') || localStorage.getItem('growth_lab_settings');
        if (raw) {
          const parsed = JSON.parse(raw);
          setSettings(parsed);
        }
      } catch (e) {}
    };

    const handleStorageChange = (e: StorageEvent) => {
      handleClinicInfoUpdated();
      if (!e.key) return;
      if (
        e.key.includes('growth_lab_patients') ||
        e.key.includes('growthlab_patients') ||
        e.key.includes('growth_lab_checkin') ||
        e.key.includes('growthlab_daily_logs')
      ) {
        try {
          const raw = localStorage.getItem('growthlab_patients_master') || localStorage.getItem('growth_lab_patients');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setPatients(parsed);
            }
          }
        } catch {}
      }
      if (e.key.includes('growth_lab_appointments') || e.key.includes('growthlab_appointments')) {
        try {
          const raw = localStorage.getItem('growth_lab_appointments');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              setAppointments(parsed);
            }
          }
        } catch {}
      }
    };

    window.addEventListener('growthlab_clinic_info_updated', handleClinicInfoUpdated);
    window.addEventListener('clinic_profile_data_updated', handleClinicInfoUpdated);
    window.addEventListener('storage', handleStorageChange);

    // Auto-poll silently every 12 seconds when authenticated
    const pollInterval = setInterval(() => {
      if (isAuthenticated) {
        handleRefreshPatientsFromGoogleSheets(false, true);
      }
    }, 12000);

    let unsubMembers: any = null;
    let unsubApps: any = null;
    let unsubLogs: any = null;
    let unsubSettings: any = null;
    let unsubStaff: any = null;

    if (isFirebaseConfigured) {
      dataAdapter.listAppointments().then(remoteApps => {
        if (remoteApps) {
          setAppointments(remoteApps);
        }
      }).catch(err => console.warn('[App] Initial Firestore appointments sync:', err));

      dataAdapter.listSessionLogs().then(remoteLogs => {
        if (remoteLogs) {
          setLogs(remoteLogs);
        }
      }).catch(err => console.warn('[App] Initial Firestore logs sync:', err));

      dataAdapter.getClinicSettings().then(remoteSettings => {
        if (remoteSettings) {
          setSettings(remoteSettings);
        }
      }).catch(err => console.warn('[App] Initial Firestore settings sync:', err));

      dataAdapter.listStaffAccounts().then(remoteStaff => {
        if (remoteStaff && remoteStaff.length > 0) {
          setStaffAccounts(remoteStaff);
        }
      }).catch(err => console.warn('[App] Initial Firestore staff sync:', err));

      unsubMembers = dataAdapter.subscribeMembers(remoteMembers => {
        if (remoteMembers) {
          setPatients(remoteMembers);
        }
      });

      unsubApps = dataAdapter.subscribeAppointments(remoteApps => {
        if (remoteApps) {
          setAppointments(remoteApps);
        }
      });

      unsubLogs = dataAdapter.subscribeSessionLogs(remoteLogs => {
        if (remoteLogs) {
          setLogs(remoteLogs);
        }
      });

      unsubSettings = dataAdapter.subscribeClinicSettings(remoteSettings => {
        if (remoteSettings) {
          setSettings(remoteSettings);
        }
      });

      unsubStaff = dataAdapter.subscribeStaffAccounts(remoteStaff => {
        if (remoteStaff && remoteStaff.length > 0) {
          setStaffAccounts(remoteStaff);
        }
      });
    }

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('growthlab_clinic_info_updated', handleClinicInfoUpdated);
      window.removeEventListener('clinic_profile_data_updated', handleClinicInfoUpdated);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollInterval);
      if (unsubMembers) unsubMembers();
      if (unsubApps) unsubApps();
      if (unsubLogs) unsubLogs();
      if (unsubSettings) unsubSettings();
      if (unsubStaff) unsubStaff();
    };
  }, []);

  // Dedicated real-time listener for active patient's document in Firestore
  useEffect(() => {
    const user = authService.getCurrentUser();
    const activeHn = user?.hn || user?.patientId || initialPatientHn;

    if (activeHn && isFirebaseConfigured) {
      const unsub = subscribePatientByHN(
        activeHn,
        (updatedData) => {
          if (updatedData) {
            setPatients(prev => {
              const idx = prev.findIndex(p => p.hn === updatedData.hn || p.id === updatedData.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = { ...next[idx], ...updatedData };
                savePatientToLocalStorage(next[idx]);
                return next;
              } else {
                savePatientToLocalStorage(updatedData);
                return [updatedData, ...prev];
              }
            });
            if (updatedData.id) {
              handleSelectPatient(updatedData.id, true);
            }
          }
        },
        (err) => console.warn('[App] Real-time patient sync error:', err)
      );
      return () => {
        if (unsub) unsub();
      };
    }
  }, [userRole, isAuthenticated, initialPatientHn]);

  const processedTokenRef = useRef<string | null>(null);
  const hasResolvedDeepLinkRef = useRef<boolean>(false);

  // Helper to safely clean URL parameters after deep link resolution
  const cleanUrlQueryParams = () => {
    if (typeof window !== 'undefined' && (window.location.search || window.location.hash)) {
      try {
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {
        console.warn('[App] Could not clean URL params:', e);
      }
    }
  };

  // วางโค้ดนี้ไว้ภายในคอมโพเนนต์หลัก (เช่น App.tsx หรือส่วนจัดการเริ่มต้น)
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const token = queryParams.get('token');
    
    if (token) {
      const matchedPatient = patients.find(
        p => p.qrToken === token || p.id === token || p.hn === token
      );
      
      if (matchedPatient) {
        // ล็อกเซสชันผู้ป่วยทันทีเพื่อป้องกันลูปการรีเฟรชหน้าจอซ้ำซ้อน
        setAuthenticatedPatient(matchedPatient);
        sessionStorage.setItem('growth_lab_active_patient_id', matchedPatient.id);
      }
    }
  }, [patients]);

  // Member Direct Access (Deep Link QR Code handling - One-Time Resolution)
  useEffect(() => {
    if (hasResolvedDeepLinkRef.current) return;
    // Helper to extract hn and token from query parameter, hash, or pathname
    const extractPatientCredentials = (): { hn: string | null; token: string | null } => {
      if (typeof window === 'undefined') return { hn: null, token: null };

      // Ensure patient auto-login only runs if URL explicitly targets patient mode
      const searchParams = new URLSearchParams(window.location.search);
      const mode = searchParams.get('mode');
      const portal = searchParams.get('portal');
      const pathname = window.location.pathname.toLowerCase();
      const isExplicitPatient = mode === 'patient' || portal === 'patient' || pathname.includes('/patient') || pathname.includes('/member/');
      if (!isExplicitPatient) {
        return { hn: null, token: null };
      }

      // 1. Check search query (case-insensitive keys: hn, token, member, qr)
      const hn = getParamCaseInsensitive(window.location.search, ['hn']);
      const token = getParamCaseInsensitive(window.location.search, ['token', 'member', 'qr']);

      if (hn) {
        return {
          hn: hn.trim(),
          token: token ? token.trim() : null
        };
      }
      
      if (token) return { hn: null, token: token.trim() };

      // 2. Check hash query: #...?hn=...&token=...
      if (window.location.hash) {
        const h_hn = getParamCaseInsensitive(window.location.hash, ['hn']);
        const h_token = getParamCaseInsensitive(window.location.hash, ['token', 'member', 'qr']);
        if (h_hn) {
           return { hn: h_hn.trim(), token: h_token ? h_token.trim() : null };
        }
        if (h_token) return { hn: null, token: h_token.trim() };
      }

      // 3. Check pathname: /member/:id
      const path = window.location.pathname;
      const memberMatch = path.match(/\/member\/([^\/]+)/);
      if (memberMatch && memberMatch[1]) {
        return { hn: null, token: decodeURIComponent(memberMatch[1].trim()) };
      }

      return { hn: null, token: null };
    };

    let { hn, token } = extractPatientCredentials();
    const isDirectUrlDeepLink = Boolean(hn || token);

    if (hn && hn.toUpperCase().includes('DEMO-')) {
      hn = null;
    }
    if (token && token.toUpperCase().includes('DEMO-')) {
      token = null;
    }

    // 2. Persistent Patient Session & Auto-Login
    if (!hn && !token) {
      if (isExplicitPatientUrl()) {
        const currentUser = authService.getCurrentUser();
        // Only auto-restore patient session if explicit patient url was requested
        if (!currentUser || currentUser.role === 'PATIENT') {
          const savedHn = localStorage.getItem('growthlab_active_patient_hn');
          if (savedHn) {
            if (!savedHn.includes('DEMO-')) {
              hn = savedHn;
            } else {
              localStorage.removeItem('growthlab_active_patient_hn');
            }
          }
        }
      }
    }

    if (!hn && !token) return;

    // 1. Save Session for subsequent visits
    if (hn) {
      localStorage.setItem('growthlab_active_patient_hn', hn);
    }

    const authKey = hn || token || '';
    if (processedTokenRef.current === authKey && userRole === 'PATIENT') {
      return;
    }

    // Get current patients either from state or local storage
    let targetPatients = patients;
    if (targetPatients.length === 0) {
      const localPatients = localStorage.getItem('growth_lab_patients') || localStorage.getItem('growthlab_patients');
      if (localPatients) {
        try {
          targetPatients = JSON.parse(localPatients);
        } catch (e) { /* ignore */ }
      }
    }

    // Flexible Match patient by HN first, then fallback to qrToken, id
    let foundPatient;
    const cleanAuthKey = authKey.replace(/^(hn-)/i, '').replace(/[\s-]/g, '').toLowerCase();
    
    foundPatient = targetPatients.find(p => {
      const pHn = p.hn ? p.hn.toLowerCase().replace(/^(hn-)/i, '').replace(/[\s-]/g, '') : '';
      const pId = p.id ? p.id.toLowerCase().replace(/[\s-]/g, '') : '';
      const pToken = p.qrToken ? p.qrToken.toLowerCase().replace(/[\s-]/g, '') : '';
      
      return (pHn && pHn === cleanAuthKey) || 
             (pId && pId === cleanAuthKey) || 
             (pToken && pToken === cleanAuthKey);
    });

    if (!foundPatient) {
      // Partial fallback
      foundPatient = targetPatients.find(p => {
        const pHn = p.hn ? p.hn.toLowerCase().replace(/^(hn-)/i, '').replace(/[\s-]/g, '') : '';
        const pPhone = p.phone ? p.phone.replace(/[^0-9]/g, '') : '';
        const pFirst = p.firstName ? p.firstName.toLowerCase().replace(/[\s-]/g, '') : '';
        return (pHn && pHn.includes(cleanAuthKey)) || 
               (pPhone && pPhone.includes(cleanAuthKey)) ||
               (pFirst && pFirst.includes(cleanAuthKey));
      });
    }

    if (foundPatient) {
      hasResolvedDeepLinkRef.current = true;
      processedTokenRef.current = authKey;
      const currentUser = authService.getCurrentUser();
      if (currentUser?.role !== 'PATIENT' || currentUser?.patientId !== foundPatient.id) {
        authService.login('PATIENT', foundPatient.id, foundPatient.firstName, undefined, foundPatient.hn);
        setTimeout(() => trackAppUsage(foundPatient.id, 'open'), 1000);
      }
      if (userRole !== 'PATIENT') setUserRole('PATIENT');
      if (!isAuthenticated) setIsAuthenticated(true);
      if (selectedPatientId !== foundPatient.id) handleSelectPatient(foundPatient.id, true);
      if (isDirectUrlDeepLink) {
        setActiveTab('แบบฝึกหัดที่ได้รับมอบหมาย');
      }
      cleanUrlQueryParams();
    } else {
      // 1. Direct query to Google Sheets API
      setIsInitialDataLoading(true);
      fetchPatientByHnFromGoogleSheets(authKey).then(livePatient => {
        if (livePatient && (livePatient.hn || livePatient.id)) {
          hasResolvedDeepLinkRef.current = true;
          processedTokenRef.current = authKey;
          setPatients(prev => {
            if (!prev.some(p => p.id === livePatient.id || p.hn === livePatient.hn)) {
              const merged = [livePatient, ...prev];
              savePatientToLocalStorage(livePatient);
              return merged;
            }
            return prev;
          });
          const currentUser = authService.getCurrentUser();
          if (currentUser?.role !== 'PATIENT' || currentUser?.patientId !== livePatient.id) {
            authService.login('PATIENT', livePatient.id, livePatient.firstName, undefined, livePatient.hn);
            setTimeout(() => trackAppUsage(livePatient.id, 'open'), 1000);
          }
          if (userRole !== 'PATIENT') setUserRole('PATIENT');
          if (!isAuthenticated) setIsAuthenticated(true);
          handleSelectPatient(livePatient.id, true);
          if (isDirectUrlDeepLink) {
            setActiveTab('แบบฝึกหัดที่ได้รับมอบหมาย');
          }
          cleanUrlQueryParams();
        } else {
          // 2. Query Firestore database via dataAdapter as fallback
          dataAdapter.getMember(authKey).then(member => {
            if (member) {
              hasResolvedDeepLinkRef.current = true;
              processedTokenRef.current = authKey;
              setPatients(prev => {
                if (!prev.some(p => p.id === member.id)) {
                  const merged = [member, ...prev];
                  savePatientToLocalStorage(member);
                  return merged;
                }
                return prev;
              });
              const currentUser = authService.getCurrentUser();
              if (currentUser?.role !== 'PATIENT' || currentUser?.patientId !== member.id) {
                authService.login('PATIENT', member.id, member.firstName, undefined, member.hn);
                setTimeout(() => trackAppUsage(member.id, 'open'), 1000);
              }
              if (userRole !== 'PATIENT') setUserRole('PATIENT');
              if (!isAuthenticated) setIsAuthenticated(true);
              handleSelectPatient(member.id, true);
              if (isDirectUrlDeepLink) {
                setActiveTab('แบบฝึกหัดที่ได้รับมอบหมาย');
              }
              cleanUrlQueryParams();
            } else {
              // 3. Check if URL contains query/payload data to create auto-registered profile
              const urlPayload = decodePatientDataFromUrl();
              if (urlPayload && (urlPayload.firstName || urlPayload.name)) {
                hasResolvedDeepLinkRef.current = true;
                const autoPat = createAutoRegisteredPatient(authKey, urlPayload);
                savePatientToLocalStorage(autoPat);
                setPatients(prev => [autoPat, ...prev]);
                authService.login('PATIENT', autoPat.id, autoPat.firstName, undefined, autoPat.hn);
                if (userRole !== 'PATIENT') setUserRole('PATIENT');
                if (!isAuthenticated) setIsAuthenticated(true);
                handleSelectPatient(autoPat.id, true);
                if (isDirectUrlDeepLink) {
                  setActiveTab('แบบฝึกหัดที่ได้รับมอบหมาย');
                }
                cleanUrlQueryParams();
              }
            }
          }).catch(err => {
            console.warn('[App] Deep link member resolution failed:', err);
          });
        }
      }).catch(err => {
        console.warn('[App] Live Google Sheets fetch failed:', err);
      }).finally(() => {
        setIsInitialDataLoading(false);
      });
    }
  }, [patients, userRole, isAuthenticated, selectedPatientId]);

  const handleUpdatePatientAssignments = (patientId: string, assignments: any[]) => {
    const assignedTaskIds = assignments.map(a => a.exerciseId || a.id);
    let updatedPatient: Patient | null = null;
    const updated = patients.map(p => {
      if (p.id === patientId || p.hn === patientId) {
        const pUpdated: Patient = { 
          ...p, 
          assignments,
          assignedTasks: assignedTaskIds,
          assignedExercises: assignedTaskIds
        };
        pUpdated.progress = syncPatientProgress(pUpdated);
        updatedPatient = pUpdated;
        return pUpdated;
      }
      return p;
    });

    setPatients(updated);
    saveStateToLocal('growth_lab_patients', updated);
    
    dataAdapter.updateMember(patientId, { 
      assignments,
      assignedTasks: assignedTaskIds,
      assignedExercises: assignedTaskIds 
    }).catch(e => console.warn('[App] Firestore/Google Sheets update assignments failed:', e));

    if (updatedPatient) {
      const webhookUrl = getWebhookUrl();
      syncPatientToGoogleSheets(webhookUrl, updatedPatient).catch(e => console.warn('[App] Google Sheets patient sync failed:', e));
    }

    triggerFeedback('มอบหมายแบบฝึกหัดและซิงค์ข้อมูลสำเร็จ', 'success');
  };

  const trackAppUsage = (patientId: string, type: 'open' | 'exercise') => {
    const todayStr = new Date().toISOString().split('T')[0];
    let updatedPatient: Patient | null = null;
    
    setPatients(prev => {
      const pIdx = prev.findIndex(p => p.id === patientId);
      if (pIdx === -1) return prev;
      
      const p = prev[pIdx];
      const usageTracker = p.usageTracker || [];
      const todayTracker = usageTracker.find(u => u.date === todayStr) || {
        date: todayStr,
        appOpens: 0,
        exerciseClicks: 0,
        lastActive: new Date().toISOString()
      };
      
      if (type === 'open') {
        todayTracker.appOpens += 1;
      } else if (type === 'exercise') {
        todayTracker.exerciseClicks += 1;
      }
      todayTracker.lastActive = new Date().toISOString();
      
      const newTracker = usageTracker.filter(u => u.date !== todayStr);
      newTracker.push(todayTracker);
      
      const newP = { ...p, usageTracker: newTracker };
      updatedPatient = newP;
      
      const newPatients = [...prev];
      newPatients[pIdx] = newP;
      
      saveStateToLocal('growth_lab_patients', newPatients);
      return newPatients;
    });

    if (updatedPatient) {
      dataAdapter.updateMember(patientId, { usageTracker: (updatedPatient as Patient).usageTracker }).catch(e => console.warn('[App] Failed to sync usage:', e));
    }
  };

  const handleCheckIn = (
    patientId: string, 
    source: 'APP' | 'QR' = 'APP', 
    performedBy?: string,
    method?: 'participant_self_check_in' | 'staff_recorded_check_in'
  ) => {
    const todayStr = getTodayDateString();
    const nowTimestamp = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
    
    const targetPat = patients.find(p => p.id === patientId || p.hn === patientId);
    const targetHn = targetPat?.hn || patientId;

    // Send POST request to Google Apps Script Webhook
    const webhookUrl = getWebhookUrl();
    const patientFullName = targetPat ? `${targetPat.firstName || ''} ${targetPat.lastName || ''}`.trim() : targetHn;

    syncDailyCheckInToGoogleSheets(webhookUrl, {
      patientId: targetHn,
      hn: targetHn,
      patientName: patientFullName,
      action: 'เช็คอินประจำวัน (Daily Check-in)',
      actionName: 'เช็คอินประจำวัน (Daily Check-in)',
      score: 'สำเร็จ',
      status: 'completed'
    }).catch(e => console.warn('[App] Daily check-in webhook sync error:', e));

    cloudApi.logDaily({
      hn: targetHn,
      name: patientFullName,
      patientName: patientFullName,
      patientId: targetPat?.id || targetHn,
      date: todayStr,
      time: nowTimestamp,
      timestamp: new Date().toISOString(),
      action: 'Daily Check-in',
      actionName: 'เช็คอินประจำวัน (Daily Check-in)',
      score: 'สำเร็จ',
      status: 'completed',
      source,
      sheetName: 'Daily_Logs'
    }).catch(e => console.warn('[App] cloudApi.logDaily error:', e));

    // Determine method and actor
    const effectiveMethod: 'participant_self_check_in' | 'staff_recorded_check_in' = method || (
      source === 'QR' 
        ? 'participant_self_check_in' 
        : (userRole === 'PATIENT' ? 'participant_self_check_in' : 'staff_recorded_check_in')
    );

    let actor = performedBy;
    if (!actor) {
      if (effectiveMethod === 'staff_recorded_check_in') {
        actor = currentUser ? currentUser.name : 'ทันตแพทย์หญิง นภาพร วรรณษา (เจ้าหน้าที่)';
      } else {
        actor = targetPat ? `${targetPat.firstName} ${targetPat.lastName} (การดูแล)` : 'การดูแล';
      }
    }

    const newRecord: CheckInRecord = {
      id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      patientId,
      date: todayStr,
      timestamp: nowTimestamp,
      source,
      method: effectiveMethod,
      actor,
      performedBy: actor,
      status: 'COMPLETED',
    };

    let syncedPatient: Patient | null = null;

    setPatients(prevPatients => {
      const updated = prevPatients.map(p => {
        if (p.id === patientId || p.hn === patientId) {
          const history = p.checkInHistory || (p as any).checkIns || [];
          const filteredHistory = history.filter((h: any) => h.date !== todayStr);
          const newHistory = [newRecord, ...filteredHistory];

          // Update daily usage tracker
          const usageList = p.usageTracker || [];
          const existingUsageIdx = usageList.findIndex(u => u.date === todayStr);
          let updatedUsageList = [...usageList];
          if (existingUsageIdx >= 0) {
            updatedUsageList[existingUsageIdx] = {
              ...updatedUsageList[existingUsageIdx],
              appOpens: (updatedUsageList[existingUsageIdx].appOpens || 0) + 1,
              exerciseClicks: (updatedUsageList[existingUsageIdx].exerciseClicks || 0) + 1,
              lastActive: new Date().toISOString()
            };
          } else {
            updatedUsageList = [{
              date: todayStr,
              appOpens: 1,
              exerciseClicks: 1,
              lastActive: new Date().toISOString()
            }, ...updatedUsageList.slice(0, 30)];
          }

          const updatedPatient: Patient = {
            ...p,
            checkInHistory: newHistory,
            usageTracker: updatedUsageList,
            lastCheckIn: todayStr,
            status: 'active',
          };
          (updatedPatient as any).checkIns = newHistory;
          // Automatic sync pending progress data into patient_progress
          updatedPatient.progress = syncPatientProgress(updatedPatient);
          syncedPatient = updatedPatient;
          
          try {
            localStorage.setItem(`growth_lab_checkin_${p.id}`, todayStr);
            localStorage.setItem(`growth_lab_last_active_${p.id}`, new Date().toISOString());
            localStorage.setItem(`growth_usage_${p.id}_${todayStr}`, JSON.stringify(updatedUsageList[0]));
          } catch (err) {
            console.warn('[App] LocalStorage write error:', err);
          }
          return updatedPatient;
        }
        return p;
      });
      saveStateToLocal('growth_lab_patients', updated);
      try {
        localStorage.setItem('growthlab_patients_master', JSON.stringify(updated));
        localStorage.setItem('growth_lab_patients', JSON.stringify(updated));
      } catch {}
      
      // Notify all components and views immediately (Real-time Follow-up & Dashboard Sync)
      window.dispatchEvent(new CustomEvent('growthlab_patients_updated', { detail: updated }));
      window.dispatchEvent(new CustomEvent('growthlab_checkin_updated', { detail: newRecord }));
      
      return updated;
    });

    dataAdapter.createCheckIn(newRecord).catch(e => console.warn('[App] Firestore check-in sync failed:', e));

    if (syncedPatient) {
      const metrics = calculateConsistencyMetrics(syncedPatient);
      syncCleanDailySummaryToGoogleSheets(getWebhookUrl(), {
        patientId: (syncedPatient as Patient).id,
        hn: (syncedPatient as Patient).hn,
        name: `${(syncedPatient as Patient).firstName} ${(syncedPatient as Patient).lastName}`,
        date: todayStr,
        checkInTime: nowTimestamp,
        checkInStatus: 'เช็กอินสำเร็จ (Active)',
        complianceScore: metrics.consistencyPercent,
        streakDays: metrics.streakDays,
        completedExercises: metrics.todayCompletedExercises,
        totalAppOpens: metrics.todayAppOpens,
        classification: metrics.classification.categoryLabelTh
      }).catch(e => console.warn('[App] Google Sheets Clean Daily Summary sync failed:', e));
    }

    playSuccessChime();
    triggerFeedback('เช็คอินและบันทึกข้อมูลลงระบบสำเร็จ', 'success');
  };

  const handleToggleAssignmentComplete = (patientId: string, assignmentId: string) => {
    let nextCompletedState = true;
    const todayStr = getTodayDateString();

    setPatients(prevPatients => {
      const updated = prevPatients.map(p => {
        if (p.id === patientId) {
          const currentAssignments = p.assignments && p.assignments.length > 0 ? p.assignments : [
            { id: `asgn_${patientId}_1`, patientId, exerciseId: 'EF-001', reps: 10, durationMinutes: 5, startDate: todayStr, instruction: 'ฝึกการหายใจผ่านจมูก 10 รอบ ก่อนนอนและหลังตื่นนอน', status: 'pending' as const },
            { id: `asgn_${patientId}_2`, patientId, exerciseId: 'EF-002', reps: 10, durationMinutes: 5, startDate: todayStr, instruction: 'ฝึกการปิดริมฝีปากให้สนิทโดยไม่เกร็งคาง', status: 'pending' as const },
            { id: `asgn_${patientId}_3`, patientId, exerciseId: 'EF-003', reps: 10, durationMinutes: 5, startDate: todayStr, instruction: 'วางปลายลิ้นที่จุด Spot แนบเพดานปาก', status: 'pending' as const },
          ];
          const exists = currentAssignments.some(a => a.id === assignmentId);
          let updatedAssignments: HomeworkAssignment[];
          if (exists) {
            updatedAssignments = currentAssignments.map(asgn => {
              if (asgn.id === assignmentId) {
                const isCompleted = asgn.status === 'completed';
                nextCompletedState = !isCompleted;
                return { 
                  ...asgn, 
                  status: (isCompleted ? 'pending' : 'completed') as 'pending' | 'completed',
                  lastSubmittedDate: isCompleted ? asgn.lastSubmittedDate : todayStr,
                  completedAt: isCompleted ? undefined : new Date().toISOString()
                };
              }
              return asgn;
            });
          } else {
            updatedAssignments = [
              ...currentAssignments,
              {
                id: assignmentId,
                patientId,
                exerciseId: assignmentId,
                reps: 10,
                durationMinutes: 5,
                startDate: todayStr,
                instruction: 'แบบฝึกหัดประจำวัน',
                status: 'completed',
                lastSubmittedDate: todayStr
              }
            ];
          }
          const updatedPatient: Patient = { ...p, assignments: updatedAssignments };
          // Automatic sync progress
          updatedPatient.progress = syncPatientProgress(updatedPatient);
          return updatedPatient;
        }
        return p;
      });
      saveStateToLocal('growth_lab_patients', updated);
      return updated;
    });

    dataAdapter.updateAssignmentCompletion(assignmentId, patientId, nextCompletedState, todayStr).catch(e => console.warn('[App] Firestore assignment sync failed:', e));
    
    if (nextCompletedState) {
      playSuccessChime();
    }
    triggerFeedback('บันทึกผลการทำแบบฝึกหัดสำเร็จ', 'success');
  };

  const saveStateToLocal = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
    if (key === 'growth_lab_patients' || key === 'growthlab_patients') {
      localStorage.setItem('growth_lab_patients', JSON.stringify(data));
      localStorage.setItem('growthlab_patients', JSON.stringify(data));
    }
  };

  // Actions
  const handleUpdatePatientNutrition = (patientId: string, log: NutritionLog) => {
    let targetPatient: Patient | null = null;
    const updated = patients.map(p => {
      if (p.id === patientId) {
        const nutritionLogs = p.nutritionLogs ? [...p.nutritionLogs, log] : [log];
        targetPatient = { ...p, nutritionLogs };
        return targetPatient;
      }
      return p;
    });
    setPatients(updated);
    saveStateToLocal('growth_lab_patients', updated);
    if (targetPatient) {
      dataAdapter.updateMember(patientId, targetPatient).catch(e => console.warn('[App] Firestore sync error:', e));
    }

    triggerFeedback('บันทึกข้อมูลโภชนาการสำเร็จ', 'success');
  };

  const handleUpdatePatientSleep = (
    patientId: string, 
    log?: SleepLog, 
    monthlyProfile?: SleepMonthlyProfile
  ) => {
    let targetPatient: Patient | null = null;
    const updated = patients.map(p => {
      if (p.id === patientId) {
        // Upsert daily log (match by date or dayNumber)
        let sleepLogs = p.sleepLogs ? [...p.sleepLogs] : [];
        let sleepScore = p.sleepScore;
        if (log) {
          const existingIdx = sleepLogs.findIndex(
            l => l.date === log.date || (log.dayNumber && l.dayNumber === log.dayNumber)
          );
          if (existingIdx >= 0) {
            sleepLogs[existingIdx] = log;
          } else {
            sleepLogs.push(log);
          }
          sleepScore = log.quality;
        }

        // Upsert monthly profile if provided
        let sleepMonthlyProfiles = p.sleepMonthlyProfiles ? [...p.sleepMonthlyProfiles] : [];
        if (monthlyProfile) {
          const mIdx = sleepMonthlyProfiles.findIndex(m => m.month === monthlyProfile.month);
          if (mIdx >= 0) {
            sleepMonthlyProfiles[mIdx] = monthlyProfile;
          } else {
            sleepMonthlyProfiles.push(monthlyProfile);
          }
        }

        targetPatient = { 
          ...p, 
          sleepLogs, 
          sleepMonthlyProfiles, 
          sleepScore 
        };
        return targetPatient;
      }
      return p;
    });
    setPatients(updated);
    saveStateToLocal('growth_lab_patients', updated);
    if (targetPatient) {
      dataAdapter.updateMember(patientId, targetPatient).catch(e => console.warn('[App] Firestore sync error:', e));
    }

    triggerFeedback('บันทึกข้อมูลการนอนสำเร็จ', 'success');
  };

  const handleUpdatePatientExercise = (patientId: string, log: ExerciseLog) => {
    let targetPatient: Patient | null = null;
    const updated = patients.map(p => {
      if (p.id === patientId) {
        const exerciseLogs = p.exerciseLogs ? [...p.exerciseLogs, log] : [log];
        const newHeight = log.growth?.height || p.height;
        const newWeight = log.growth?.weight || p.weight;
        
        let growthLogs = p.growthLogs || [];
        if (log.growth) {
          const gLog: GrowthLog = {
            id: `gro_${Date.now()}`,
            date: log.date,
            height: log.growth.height,
            weight: log.growth.weight,
            bmi: log.growth.bmi,
            previousHeight: log.growth.previousHeight,
            previousMeasurementDate: log.growth.previousMeasurementDate,
            heightVelocity: log.growth.heightVelocity,
            growthStage: log.growth.growthStage,
            skeletalMaturity: log.growth.skeletalMaturity,
            exerciseScore: log.exerciseScore,
            painStatus: log.painInjury?.painPresent ? `มีอาการปวด (${log.painInjury.painScore}/10)` : 'ไม่มี'
          };
          growthLogs = [...growthLogs, gLog];
        }

        targetPatient = { ...p, exerciseLogs, growthLogs, height: newHeight, weight: newWeight, exerciseScore: log.exerciseScore };
        return targetPatient;
      }
      return p;
    });
    setPatients(updated);
    saveStateToLocal('growth_lab_patients', updated);
    if (targetPatient) {
      dataAdapter.updateMember(patientId, targetPatient).catch(e => console.warn('[App] Firestore sync error:', e));

      const patHn = ((targetPatient as Patient).hn || (targetPatient as Patient).id || '').trim();
      const patName = ((targetPatient as any).name || `${(targetPatient as Patient).firstName || ''} ${(targetPatient as Patient).lastName || ''}`).trim();

      cloudApi.saveExercise({
        hn: patHn,
        name: patName,
        patientName: patName,
        patientId: (targetPatient as Patient).id,
        exerciseId: log.id || 'exercise_log',
        exerciseTitle: 'แบบฝึกหัดและการบริหารกล้ามเนื้อใบหน้าและช่องปาก (OMT / EF)',
        score: log.exerciseScore || 100,
        duration: 15,
        reps: 10,
        satisfaction: 5,
        date: log.date || new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        sheetName: 'Exercise_Logs'
      }).catch(e => console.warn('[App] cloudApi.saveExercise sync error:', e));
    }

    triggerFeedback('บันทึกกิจกรรมออกกำลังกายสำเร็จ', 'success');
  };

  const handleUpdatePatientGrowth = (patientId: string, log: GrowthLog) => {
    let targetPatient: Patient | null = null;
    const updated = patients.map(p => {
      if (p.id === patientId) {
        const growthLogs = p.growthLogs ? [...p.growthLogs, log] : [log];
        targetPatient = { ...p, growthLogs, height: log.height, weight: log.weight };
        return targetPatient;
      }
      return p;
    });
    setPatients(updated);
    saveStateToLocal('growth_lab_patients', updated);
    if (targetPatient) {
      dataAdapter.updateMember(patientId, targetPatient).catch(e => console.warn('[App] Firestore sync error:', e));
    }
    triggerFeedback('บันทึกข้อมูลการเจริญเติบโตสำเร็จ', 'success');
  };

  const handleUpdatePatientEfLog = (patientId: string, log: EFRecordLog) => {
    let targetPatient: Patient | null = null;
    const updated = patients.map(p => {
      if (p.id === patientId) {
        const efRecordLogs = p.efRecordLogs || [];
        const exists = efRecordLogs.some(l => l.id === log.id || l.date === log.date);
        let newLogs;
        if (exists) {
          newLogs = efRecordLogs.map(l => (l.id === log.id || l.date === log.date) ? log : l);
        } else {
          newLogs = [...efRecordLogs, log];
        }
        newLogs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        targetPatient = { ...p, efRecordLogs: newLogs };
        return targetPatient;
      }
      return p;
    });
    setPatients(updated);
    saveStateToLocal('growth_lab_patients', updated);
    if (targetPatient) {
      dataAdapter.updateMember(patientId, targetPatient).catch(e => console.warn('[App] Firestore sync error:', e));
    }

    triggerFeedback('บันทึกข้อมูลการสวมใส่ EF สำเร็จ', 'success');
  };

  const handleDeletePatientEfLog = (patientId: string, logId: string) => {
    let targetPatient: Patient | null = null;
    const updated = patients.map(p => {
      if (p.id === patientId) {
        const efRecordLogs = p.efRecordLogs || [];
        const newLogs = efRecordLogs.filter(l => l.id !== logId);
        targetPatient = { ...p, efRecordLogs: newLogs };
        return targetPatient;
      }
      return p;
    });
    setPatients(updated);
    saveStateToLocal('growth_lab_patients', updated);
    if (targetPatient) {
      dataAdapter.updateMember(patientId, targetPatient).catch(e => console.warn('[App] Firestore sync error:', e));
    }
    triggerFeedback('ลบบันทึกการสวมใส่ EF เรียบร้อยแล้ว', 'success');
  };

  const handleAddPatient = async (newPatient: Omit<Patient, 'id'>) => {
    const id = `pat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const createdDate = new Date().toISOString();
    const startDate = newPatient.startDate || createdDate.split('T')[0];
    
    let currentPatients: Patient[] = [];
    try {
      const rawMaster = localStorage.getItem('growthlab_patients_master');
      const raw1 = localStorage.getItem('growthlab_patients');
      const raw2 = localStorage.getItem('growth_lab_patients');
      let pMaster: Patient[] = [];
      let p1: Patient[] = [];
      let p2: Patient[] = [];
      if (rawMaster) { try { pMaster = JSON.parse(rawMaster); } catch {} }
      if (raw1) { try { p1 = JSON.parse(raw1); } catch {} }
      if (raw2) { try { p2 = JSON.parse(raw2); } catch {} }

      if (Array.isArray(pMaster) && pMaster.length > 0) {
        currentPatients = pMaster;
      } else if (Array.isArray(p1) && p1.length > 0) {
        currentPatients = p1;
      } else if (Array.isArray(p2) && p2.length > 0) {
        currentPatients = p2;
      } else {
        currentPatients = patients || [];
      }
    } catch (e) {
      console.warn('[App] Error reading patients for addition:', e);
      currentPatients = patients || [];
    }

    // Determine sequential HN if not provided
    let generatedHn = newPatient.hn;
    if (!generatedHn) {
      const maxHn = currentPatients.reduce((max, p) => {
        const numMatch = p.hn ? p.hn.match(/\d+/) : null;
        if (numMatch) {
          const num = parseInt(numMatch[0]);
          return num > max ? num : max;
        }
        return max;
      }, 0);
      generatedHn = `HN-${maxHn > 0 ? maxHn + 1 : 10001}`;
    }
    
    const qrToken = generateUniquePatientQRToken(id, generatedHn);
    
    const patientWithId: Patient = {
      ...newPatient,
      hn: generatedHn,
      id,
      qrToken: newPatient.qrToken || qrToken,
      assignedTasks: newPatient.assignedTasks || [],
      status: (newPatient.status || 'active') as 'active' | 'completed' | 'on-hold',
      weight: newPatient.weight !== undefined && newPatient.weight !== null ? newPatient.weight : 0,
      height: newPatient.height !== undefined && newPatient.height !== null ? newPatient.height : 0,
      checkInHistory: newPatient.checkInHistory || [],
      startDate,
      createdDate,
    };

    // Auto-Create First Appointment on Patient Registration
    const apptDate = newPatient.firstAppointmentDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const apptTime = newPatient.firstAppointmentTime || '09:00';
    const patientFullName = `${newPatient.firstName || ''} ${newPatient.lastName || ''}`.trim() || newPatient.nickname || generatedHn;

    const autoAppointment: Appointment = {
      id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      patientId: id,
      patientName: patientFullName,
      hn: generatedHn,
      date: apptDate,
      time: apptTime,
      type: 'clinical',
      notes: 'ตรวจติดตามความก้าวหน้า EF Line & OMT',
      status: 'pending'
    };

    patientWithId.appointments = [
      {
        id: autoAppointment.id,
        date: autoAppointment.date,
        time: autoAppointment.time,
        title: autoAppointment.notes || 'ตรวจติดตามความก้าวหน้า EF Line & OMT',
        notes: autoAppointment.notes,
        status: 'pending'
      }
    ];

    // Append new patient to top of array (newest first) and preserve all existing patients
    const filteredExisting = currentPatients.filter(p => p.id !== id && p.hn !== generatedHn);
    const updatedList = [patientWithId, ...filteredExisting];

    setPatients(updatedList);
    const serializedList = JSON.stringify(updatedList);
    localStorage.setItem('growthlab_patients_master', serializedList);
    localStorage.setItem('growth_lab_patients', serializedList);
    localStorage.setItem('growthlab_patients', serializedList);
    saveStateToLocal('growth_lab_patients', updatedList);
    saveStateToLocal('growthlab_patients', updatedList);

    // Persist linked user account for patient login
    try {
      const savedAccountsStr = localStorage.getItem('growth_lab_patient_accounts');
      const accounts = savedAccountsStr ? JSON.parse(savedAccountsStr) : [];
      const newAccount = {
        id: `usr_${id}`,
        patientId: id,
        username: (generatedHn || id).toLowerCase().trim(),
        name: `${newPatient.firstName} ${newPatient.lastName}`.trim(),
        role: 'PATIENT',
        createdAt: createdDate
      };
      const updatedAccounts = [...accounts.filter((a: any) => a.patientId !== id), newAccount];
      localStorage.setItem('growth_lab_patient_accounts', JSON.stringify(updatedAccounts));
    } catch (e) {
      console.error(e);
    }

    setSelectedPatientId(id);

    const updatedAppointments = [autoAppointment, ...appointments];
    setAppointments(updatedAppointments);
    saveStateToLocal('growth_lab_appointments', updatedAppointments);

    // Live Cloud Sync: Save to Google Sheets master endpoint
    try {
      await savePatientToGoogleSheets(patientWithId, getWebhookUrl());
      await dataAdapter.createMember(patientWithId);
      dataAdapter.saveAppointments(updatedAppointments, autoAppointment).catch(e => console.warn('[App] Auto appointment sync error:', e));
      syncAppointmentToGoogleSheets(getWebhookUrl(), autoAppointment).catch(e => console.warn('[App] Direct Google Sheets appointment sync error:', e));
    } catch (err) {
      console.warn('[App] Cloud sync error during registration:', err);
    }

    triggerFeedback(`เพิ่มผู้รับการดูแลและสร้างนัดหมายสำเร็จ (${formatThaiDate(apptDate)})`, 'success');
  };

  // ฟังก์ชันบันทึกและอัปเดตข้อมูลผู้ป่วยรายบุคคลพร้อมเซฟลง LocalStorage ทันทีแบบเรียลไทม์
  const handleUpdatePatientRecord = (patientId: string, updatedFields: Partial<Patient>) => {
    const updatedList = patients.map(pat => {
      if (pat.id === patientId) {
        // อัปเดตข้อมูลการรักษา โน้ต และสื่อมีเดีย โดยคงรหัสประจำตัว HN และ ID ไว้ตายตัว
        return { ...pat, ...updatedFields };
      }
      return pat;
    });
  
    setPatients(updatedList);
    try {
      localStorage.setItem('growth_lab_patients', JSON.stringify(updatedList));
    } catch (error) {
      console.error("Critical: Failed to save patient persistence data", error);
    }
  };

  const handleEditPatient = async (updatedPatient: Patient) => {
    const updated = patients.map((p) => {
      if (p.id === updatedPatient.id || (p.hn && p.hn === updatedPatient.hn)) {
        return { ...p, ...updatedPatient };
      }
      return p;
    });
    setPatients(updated);
    const serialized = JSON.stringify(updated);
    localStorage.setItem('growthlab_patients_master', serialized);
    localStorage.setItem('growth_lab_patients', serialized);
    localStorage.setItem('growthlab_patients', serialized);
    saveStateToLocal('growth_lab_patients', updated);

    try {
      await savePatientToGoogleSheets(updatedPatient, getWebhookUrl());
      await dataAdapter.updateMember(updatedPatient.id, updatedPatient);
    } catch (err) {
      console.warn('[App] Cloud sync error during edit:', err);
    }

    triggerFeedback('อัปเดตข้อมูลสำเร็จ', 'success');
  };

  const handleDeletePatient = (patientId: string) => {
    const targetPatient = patients.find(p => p.id === patientId || p.hn === patientId);
    const targetHn = targetPatient?.hn;
    const targetQrToken = targetPatient?.qrToken;
    
    // Perform full Cascade Delete & QR Revocation (LocalStorage, SessionStorage, Cache, Exercises, Revoked List)
    cascadeDeletePatientAndRevokeQR({ id: patientId, hn: targetHn, qrToken: targetQrToken });

    // 1. Immediately update state using prev to ensure no stale closures
    setPatients(prev => {
      const updated = prev.filter((p) => p.id !== patientId && (!targetHn || p.hn !== targetHn));
      const serialized = JSON.stringify(updated);
      localStorage.setItem('growthlab_patients_master', serialized);
      localStorage.setItem('growth_lab_patients', serialized);
      localStorage.setItem('growthlab_patients', serialized);
      saveStateToLocal('growth_lab_patients', updated);
      return updated;
    });

    // 3. Delete from Firestore database and adapter state (Hard Permanent Delete)
    dataAdapter.deleteMember(patientId, targetHn).catch(e => {
      console.warn('[App] Firestore deleteMember warning:', e);
    });

    // 4. Send DELETE_PATIENT directly to Google Sheets Webhook
    syncDeletePatientToGoogleSheets(getWebhookUrl(), patientId, targetHn).catch(e => {
      console.warn('[App] Direct Google Sheets DELETE_PATIENT sync warning:', e);
    });

    triggerFeedback(`ลบข้อมูลคนไข้ ${targetHn || patientId} และส่งคำสั่ง DELETE_PATIENT ไปยัง Google Sheets แล้ว`, 'success');

    // 4. Remove active session keys if the deleted patient was active
    try {
      const activeHn = localStorage.getItem('growthlab_active_patient_hn') || localStorage.getItem('growth_lab_active_patient_hn');
      if (activeHn && ((targetHn && activeHn.toLowerCase() === targetHn.toLowerCase()) || activeHn === patientId)) {
        localStorage.removeItem('growthlab_active_patient_hn');
        localStorage.removeItem('growth_lab_active_patient_hn');
      }
    } catch (e) {}

    // 5. Also remove from linked patient accounts
    try {
      const savedAccountsStr = localStorage.getItem('growth_lab_patient_accounts');
      if (savedAccountsStr) {
        const accounts = JSON.parse(savedAccountsStr);
        if (Array.isArray(accounts)) {
          const updatedAccounts = accounts.filter((a: any) => a.patientId !== patientId && (!targetHn || a.username !== targetHn.toLowerCase()));
          localStorage.setItem('growth_lab_patient_accounts', JSON.stringify(updatedAccounts));
        }
      }
    } catch (e) {
      console.error(e);
    }

    if (selectedPatientId === patientId || (targetHn && selectedPatientId === targetHn)) {
      setSelectedPatientId(undefined);
      sessionStorage.removeItem('growth_lab_selected_patient_id');
      localStorage.removeItem('growth_lab_selected_patient_id');
    }

    triggerFeedback('ลบข้อมูลผู้รับการดูแลสำเร็จ และซิงก์คำสั่งลบไปยัง Google Sheet เรียบร้อย 🗑️', 'success');
    
    // Cascade delete appointments and logs if required
    const updatedApps = appointments.filter((a) => a.patientId !== patientId);
    setAppointments(updatedApps);
    saveStateToLocal('growth_lab_appointments', updatedApps);
  };

  // Logs Actions
  const handleAddLog = (newLog: Omit<SessionLog, 'id'>) => {
    const createdLog: SessionLog = { ...newLog, id: `log_${Date.now()}` };
    const updated = [...logs, createdLog];
    setLogs(updated);
    saveStateToLocal('growth_lab_logs', updated);
    dataAdapter.saveSessionLogs(updated, createdLog).catch(e => console.warn('[App] Firestore log sync error:', e));

    triggerFeedback('บันทึกสำเร็จ', 'success');
  };

  const handleDeleteLog = (logId: string) => {
    const updated = logs.filter((l) => l.id !== logId);
    setLogs(updated);
    saveStateToLocal('growth_lab_logs', updated);
    dataAdapter.saveSessionLogs(updated).catch(e => console.warn('[App] Firestore log sync error:', e));
  };

  // Appointments Actions
  const handleAddAppointment = (newApp: Omit<Appointment, 'id' | 'patientName'>) => {
    const pat = patients.find((p) => p.id === newApp.patientId);
    const patName = pat ? `${pat.firstName} ${pat.lastName}` : 'ผู้รับการดูแลรายใหม่';
    const createdApp: Appointment = { 
      ...newApp, 
      id: `app_${Date.now()}`, 
      patientName: patName,
      patientId: newApp.patientId,
      hn: pat?.hn
    };
    const updated = [...appointments, createdApp];
    setAppointments(updated);
    saveStateToLocal('growth_lab_appointments', updated);
    dataAdapter.saveAppointments(updated, createdApp).catch(e => console.warn('[App] Appointment sync error:', e));

    // Add Patient Notification Sync
    if (newApp.patientId) {
      handleAddNotification({
        title: '🗓️ นัดหมายใหม่ / อัปเดตตารางนัด',
        message: `คุณมีนัดหมายใหม่: ${newApp.type} วันที่ ${new Date(newApp.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })} เวลา ${newApp.time} น.`,
        type: 'info',
        patientId: newApp.patientId
      });
    }

    triggerFeedback('นัดหมายสำเร็จและเชื่อมต่อ Google Sheets เรียบร้อย', 'success');
  };

  const handleUpdateAppointmentStatus = (id: string, status: string, notes?: string) => {
    let updatedApp: Appointment | undefined;
    const updated = appointments.map((a) => {
      if (a.id === id) {
        updatedApp = { 
          ...a, 
          status: status as any,
          ...(notes !== undefined ? { notes } : {})
        };
        return updatedApp;
      }
      return a;
    });
    setAppointments(updated);
    saveStateToLocal('growth_lab_appointments', updated);
    dataAdapter.saveAppointments(updated, updatedApp).catch(e => console.warn('[App] Appointment update sync error:', e));
    triggerFeedback('อัปเดตสถานะนัดหมายสำเร็จ', 'success');
  };

  const handleUpdateAppointment = (updatedAppt: Appointment) => {
    const updated = appointments.map((a) => (a.id === updatedAppt.id ? updatedAppt : a));
    setAppointments(updated);
    saveStateToLocal('growth_lab_appointments', updated);
    dataAdapter.saveAppointments(updated, updatedAppt).catch(e => console.warn('[App] Appointment update sync error:', e));
    triggerFeedback('อัปเดตข้อมูลนัดหมายสำเร็จ', 'success');
  };

  const handleDeleteAppointment = (id: string) => {
    const targetAppt = appointments.find(a => a.id === id);
    const updated = appointments.filter((a) => a.id !== id);
    setAppointments(updated);
    saveStateToLocal('growth_lab_appointments', updated);
    dataAdapter.deleteAppointment(id).catch(e => console.warn('[App] Appointment delete sync error:', e));
    syncDeleteAppointmentToGoogleSheets(getWebhookUrl(), id, targetAppt?.patientId, targetAppt?.hn, targetAppt?.date).catch(e => console.warn('[App] Google Sheets appointment delete sync error:', e));
    triggerFeedback('ลบรายการนัดหมายสำเร็จ และซิงก์คำสั่งลบไปยัง Google Sheet เรียบร้อย 🗑️', 'success');
  };

  // Notifications Actions
  const handleMarkAsRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    setNotifications(updated);
    saveStateToLocal('growth_lab_notifications', updated);
  };

  const handleMarkAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    saveStateToLocal('growth_lab_notifications', updated);
  };

  const handleAddNotification = (newNot: Omit<SystemNotification, 'id' | 'date' | 'read'>) => {
    const updated = [
      ...notifications,
      {
        ...newNot,
        id: `not_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        read: false,
      },
    ];
    setNotifications(updated);
    saveStateToLocal('growth_lab_notifications', updated);
  };

  // Settings Actions
  const handleUpdateSettings = (updatedSettings: ClinicSettings) => {
    setSettings(updatedSettings);
    saveStateToLocal('growth_lab_settings', updatedSettings);
    saveStateToLocal('growthlab_clinic_info', updatedSettings);
    dataAdapter.saveClinicSettings(updatedSettings).catch(e => console.warn('[App] Firestore settings sync error:', e));
    saveClinicConfigToGoogleSheets(getWebhookUrl(), updatedSettings).catch(e => console.warn('[App] Direct Google Sheets SAVE_CLINIC_CONFIG sync error:', e));
    triggerFeedback('✓ บันทึกข้อมูลแพทย์และคลินิกเรียบร้อยแล้ว', 'success');
  };

  const handleResetDatabase = () => {
    setPatients([]);
    setLogs([]);
    setAppointments([]);
    setNotifications([]);
    setSettings(DEFAULT_SETTINGS);

    saveStateToLocal('growth_lab_patients', []);
    saveStateToLocal('growth_lab_logs', []);
    saveStateToLocal('growth_lab_appointments', []);
    saveStateToLocal('growth_lab_notifications', []);
    saveStateToLocal('growth_lab_settings', DEFAULT_SETTINGS);

    try {
      localStorage.removeItem('growthlab_patients');
      localStorage.removeItem('growthlab_active_patient_hn');
      localStorage.removeItem('growth_lab_active_patient_hn');
    } catch (e) {}

    handleSelectPatient(undefined);
    setActiveTab(userRole === 'PATIENT' ? 'หน้าหลัก' : 'Dashboard');
    triggerFeedback('รีเซ็ตฐานข้อมูลสำเร็จ', 'success');
  };

  // Count unread alerts
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Role Access Separation: Medical Staff vs Caregiver/Patient
  const currentUser = authService.getCurrentUser();
  const currentStaffAccount = staffAccounts.find(s => s.username === currentUser?.username);
  const isPatient = viewMode === 'patient' || userRole === 'PATIENT';
  const isClinicOwnerOrFullAccess = isAdmin || userRole === 'CLINIC_OWNER' || userRole === 'DOCTOR' || userRole === 'ADMIN' || userRole === 'DEVELOPER';

  // Check if current user is Developer (email: "niramon7196@gmail.com" or Role: "DEVELOPER")
  const isDeveloper = Boolean(
    userRole === 'DEVELOPER' ||
    currentUser?.role === 'DEVELOPER' ||
    currentUser?.email?.toLowerCase() === 'niramon7196@gmail.com' ||
    currentStaffAccount?.email?.toLowerCase() === 'niramon7196@gmail.com' ||
    currentUser?.username?.toLowerCase() === 'niramon7196@gmail.com' ||
    currentUser?.username?.toLowerCase().includes('niramon') ||
    (typeof window !== 'undefined' && (
      localStorage.getItem('growthlab_user_email')?.toLowerCase() === 'niramon7196@gmail.com' ||
      localStorage.getItem('growth_lab_auth')?.toLowerCase().includes('niramon7196@gmail.com')
    ))
  );

  const staffMenuGroups = useMemo(() => [
    {
      title: "เมนูคลินิก",
      items: [
        { id: "Dashboard", label: "ภาพรวม (Dashboard)", icon: LayoutDashboard, permissionKey: "Dashboard" },
        { id: "ผู้รับการดูแล", label: "สารบบผู้รับการดูแล", icon: Users, permissionKey: "ผู้รับการดูแล" },
        { id: "ติดตามผล", label: "ติดตามผลภาพรวม", icon: ClipboardList, targetSubTab: "track_history", permissionKey: "ติดตามการรักษา" },
        { id: "EF / แบบฝึก", label: "เกณฑ์มาตรฐาน / EF (Clinical Standards)", icon: Dumbbell, permissionKey: "EF / แบบฝึก" },
        { id: "นัดหมาย", label: "นัดหมาย (Appointments)", icon: Calendar, permissionKey: "นัดหมาย" },
      ]
    },
    {
      title: "การจัดการระบบ",
      items: [
        { id: "media_library", label: "คลังวิดีโอสาธิต (Media Hub)", icon: Video, permissionKey: "วิดีโอ" },
        { id: "ระบบ / โปรไฟล์", label: "ข้อมูลคลินิก & แพทย์", icon: Building2, permissionKey: "โปรไฟล์" },
        { id: "บุคลากร", label: "จัดการบุคลากร", icon: UserCog, permissionKey: "บุคลากร" },
        { id: "Clinical Source", label: "📁 เอกสารสำคัญโครงการ", icon: ShieldCheck, permissionKey: "Clinical Source" },
      ]
    }
  ], []);

  const staffPermissions = isClinicOwnerOrFullAccess ? {
    Dashboard: true,
    'ผู้เข้าโปรแกรม': true,
    'ผู้รับการดูแล': true,
    'ติดตามผล': true,
    'ติดตามการรักษา': true,
    'EF / แบบฝึก': true,
    'แบบฝึก / EF': true,
    'แบบฝึกหัดที่ได้รับมอบหมาย': true,
    'ExerciseView': true,
    'Master Template': true,
    'QR': true,
    'Check-In': true,
    'นัดหมาย': true,
    'รายงาน': true,
    'วิดีโอ': true,
    'media_library': true,
    'คลังวิดีโอสาธิต': true,
    'การแจ้งเตือน': true,
    'ระบบ / โปรไฟล์': true,
    'โปรไฟล์': true,
    'ตั้งค่า': true,
    'บุคลากร': true,
    'Staff Management': true,
    'Clinical Source': true,
    'คู่มือ': true,
    'คู่มือการใช้งาน': true,
    'Executive Summary': true,
    'Content Management': true,
    'Communications / Alerts': true,
    'Organization Settings': true,
  } : (currentStaffAccount?.permissions || currentUser?.permissions || {
    Dashboard: true,
    'ผู้รับการดูแล': true,
    'ติดตามการรักษา': true,
    'QR': true,
    'Check-In': true,
    'นัดหมาย': true,
    'รายงาน': true,
    'วิดีโอ': true,
    'media_library': true,
    'คลังวิดีโอสาธิต': true,
    'การแจ้งเตือน': true,
    'ระบบ / โปรไฟล์': true,
    'โปรไฟล์': true,
    'ตั้งค่า': true,
    'บุคลากร': true,
    'Clinical Source': true,
    'คู่มือ': true,
    'คู่มือการใช้งาน': true,
  });

  const filteredStaffMenuGroups = useMemo(() => {
    return staffMenuGroups.map(group => {
      const filteredItems = group.items.filter(item => {
        // ห้ามให้ฝั่งคนไข้เห็นเมนูเอกสารสำคัญโครงการเด็ดขาด แม้จะหลุดเข้ามาในโหมดนี้
        if (isPatient && (item.id === 'Clinical Source' || item.id === 'Project Dossier' || item.label.includes('เอกสารสำคัญ'))) return false;
        
        if (isClinicOwnerOrFullAccess) return true;
        const key = item.permissionKey || item.id;
        if (staffPermissions && (staffPermissions as Record<string, boolean>)[key] !== undefined) {
          return (staffPermissions as Record<string, boolean>)[key];
        }
        return true;
      });
      return {
        ...group,
        items: filteredItems
      };
    }).filter(group => group.items.length > 0);
  }, [staffMenuGroups, isClinicOwnerOrFullAccess, staffPermissions, userRole, isPatient]);

  const fullStaffMenuItems = useMemo(() => {
    return staffMenuGroups.flatMap(g => g.items);
  }, [staffMenuGroups]);

  // Role 2: Participant / Caregiver Menu Items (การดูแล / ผู้ปกครอง)
  const patientMenuItems = useMemo(() => [
    { id: 'Check-In', label: 'บันทึกการเช็กอิน', icon: Clock },
    { id: 'หน้าหลัก', label: 'หน้าหลัก', icon: LayoutDashboard },
    { id: 'แบบฝึกหัดที่ได้รับมอบหมาย', label: 'การบ้านของฉัน', icon: Brain },
    { id: 'คลังความรู้', label: '📚 คลังความรู้สุขภาพ', icon: BookOpen },
    { id: 'การแจ้งเตือน', label: 'การแจ้งเตือน', icon: Bell },
    { id: 'โปรไฟล์', label: 'โปรไฟล์ของฉัน', icon: User },
  ], []);

  // Role 3: Creator / Admin Menu Items (ผู้สร้าง / Admin)
  const adminMenuItems = useMemo(() => [
    { id: 'Executive Summary', label: 'Executive Summary', icon: LayoutDashboard },
    { id: 'Clinical Source', label: '📁 เอกสารสำคัญโครงการ', icon: ShieldCheck },
    { id: 'Staff Management', label: 'Staff Management', icon: Users },
    { id: 'Content Management', label: 'Content Management', icon: Video },
    { id: 'Communications / Alerts', label: 'Communications / Alerts', icon: Bell },
    { id: 'Organization Settings', label: 'Organization Settings', icon: SettingsIcon },
  ], []);

  const allowedTabs = useMemo(() => {
    if (userRole === 'DEVELOPER' || isDeveloper) {
      return [
        'Executive Summary', 'Clinical Source', 'Staff Management', 'Content Management',
        'Communications / Alerts', 'Organization Settings',
        'บุคลากร', 'ตั้งค่า', 'คู่มือ', 'คู่มือการใช้งาน', 'วิดีโอ', 'คลังวิดีโอสาธิต', 'media_library', 'Exercise Media Hub', 'การแจ้งเตือน',
        'Dashboard', 'ผู้เข้าโปรแกรม', 'ผู้รับการดูแล', 'ติดตามผล', 'ติดตามการรักษา', 'QR', 'Check-In',
        'นัดหมาย', 'รายงาน', 'EF / แบบฝึก', 'GNS', 'การนอน', 'การออกกำลังกาย', 'Before / After',
        'ระบบ / โปรไฟล์', 'โปรไฟล์', 'แบบฝึกหัดที่ได้รับมอบหมาย', 'การบ้านและ Progress',
        'track_history', 'track_compliance', 'track_behavior', 'คลังความรู้', 'knowledge_hub', 'คลังความรู้สุขภาพ', 'เอกสารสำคัญโครงการ', 'Project Dossier'
      ];
    }
    if (userRole === 'ADMIN') {
      return [
        'Executive Summary', 'Clinical Source', 'Staff Management', 'Content Management',
        'Communications / Alerts', 'Organization Settings',
        'บุคลากร', 'ตั้งค่า', 'คู่มือ', 'คู่มือการใช้งาน', 'วิดีโอ', 'คลังวิดีโอสาธิต', 'media_library', 'Exercise Media Hub', 'การแจ้งเตือน',
        'Dashboard', 'ผู้เข้าโปรแกรม', 'ผู้รับการดูแล', 'ติดตามผล', 'ติดตามการรักษา', 'QR', 'Check-In',
        'นัดหมาย', 'รายงาน', 'EF / แบบฝึก', 'GNS', 'การนอน', 'การออกกำลังกาย', 'Before / After',
        'ระบบ / โปรไฟล์', 'โปรไฟล์', 'แบบฝึกหัดที่ได้รับมอบหมาย', 'การบ้านและ Progress',
        'track_history', 'track_compliance', 'track_behavior', 'คลังความรู้', 'knowledge_hub', 'คลังความรู้สุขภาพ', 'เอกสารสำคัญโครงการ', 'Project Dossier'
      ];
    }
    if (isPatient) {
      // Patients can only view patient-specific tabs
      return ['หน้าหลัก', 'แบบฝึกหัดที่ได้รับมอบหมาย', 'Check-In', 'คิวอาร์ / เช็คอิน', 'QR', 'วิดีโอ', 'การแจ้งเตือน', 'โปรไฟล์', 'Before / After', 'การบ้านและ Progress', 'คลังความรู้', 'knowledge_hub', 'คลังความรู้สุขภาพ'];
    }
    // Medical Staff allowed tabs (Clinic Owner / Doctor / Assistant / Staff)
    return [
      'Dashboard', 'ผู้เข้าโปรแกรม', 'ผู้รับการดูแล', 'นัดหมาย', 'การแจ้งเตือน', 'ระบบ / โปรไฟล์', 'โปรไฟล์',
      'ติดตามผล', 'ติดตามการรักษา', 'EF / แบบฝึก', 'GNS', 'การนอน', 'การออกกำลังกาย', 'Before / After', 'QR', 'Check-In',
      'แบบฝึกหัดที่ได้รับมอบหมาย', 'รายงาน', 'Clinical Source', 'เอกสารสำคัญโครงการ', 'Project Dossier', 'บุคลากร', 'Staff Management', 'คู่มือ', 'คู่มือการใช้งาน', 'วิดีโอ', 'คลังวิดีโอสาธิต', 'media_library', 'Exercise Media Hub', 'การบ้านและ Progress',
      'track_history', 'track_compliance', 'track_behavior', 'คลังความรู้', 'knowledge_hub', 'คลังความรู้สุขภาพ'
    ];
  }, [userRole, isPatient, isDeveloper]);

  const getTabDisplayTitle = (tab: string) => {
    switch (tab) {
      case 'คลังความรู้':
      case 'knowledge_hub':
      case 'คลังความรู้สุขภาพ':
        return '📚 คลังความรู้สุขภาพ & เคล็ดลับการฝึก';
      case 'ผู้รับการดูแล':
      case 'ผู้เข้าโปรแกรม':
        return selectedPatientId ? 'ข้อมูลผู้รับการดูแล' : 'ผู้รับการดูแล';
      case 'ติดตามผล':
      case 'ติดตามการรักษา':
        return 'ติดตามผล';
      case 'QR':
      case 'Check-In':
        return 'คิวอาร์ / เช็คอิน';
      case 'EF / แบบฝึก':
      case 'แบบฝึกหัดที่ได้รับมอบหมาย':
        return isPatient ? 'แบบฝึกหัดที่ได้รับมอบหมาย' : 'แบบฝึก / EF';
      case 'GNS':
        return 'โภชนาการ';
      case 'การนอน':
        return 'การนอนหลับ';
      case 'การออกกำลังกาย':
        return 'การออกกำลังกาย';
      case 'วิดีโอ':
      case 'คลังวิดีโอสาธิต':
      case 'media_library':
      case 'Exercise Media Hub':
        return 'คลังวิดีโอสาธิต (Media Library)';
      case 'Before / After':
        return 'ก่อน / หลัง';
      case 'ระบบ / โปรไฟล์':
      case 'โปรไฟล์':
        return isPatient ? 'โปรไฟล์ของฉัน' : 'ข้อมูลคลินิก';
      case 'ตั้งค่า':
      case 'Organization Settings':
        return 'ตั้งค่า';
      case 'บุคลากร':
      case 'Staff Management':
      case 'User Management':
        return 'บุคลากร';
      case 'Clinical Source':
      case 'Project Dossier':
      case 'เอกสารสำคัญโครงการ':
      case 'เอกสารสำคัญโครงสร้างระบบ':
        return '📁 เอกสารสำคัญโครงการ (Project Dossier)';
      case 'Executive Summary':
        return 'Executive Summary';
      default:
        return tab;
    }
  };

  // Authoritative selected member ID for the current session
  const effectivePatientId = isPatient ? currentUser?.patientId : selectedPatientId;

  // Active assigned patient for Caregiver / Patient role with multi-tier auto-linking
  const assignedPatient: Patient | undefined = useMemo(() => {
    if (isPatient) {
      // 1. Direct match by patientId or hn
      if (currentUser?.patientId) {
        const found = patients.find((p) => p.id === currentUser.patientId || p.hn === currentUser.patientId);
        if (found) return found;
      }

      const activeHn = currentUser?.hn || currentUser?.username || initialPatientHn || (typeof window !== 'undefined' ? (localStorage.getItem('growthlab_active_patient_hn') || localStorage.getItem('current_user_hn')) : null);
      if (activeHn) {
        const found = patients.find((p) => p.hn === activeHn || p.id === activeHn || p.qrToken === activeHn);
        if (found) return found;
      }

      // 2. Intelligent Auto-Linking by matching query
      const queryToMatch = currentUser?.patientId || currentUser?.hn || currentUser?.username || currentUser?.name || '';
      if (queryToMatch) {
        const matched = findMatchingPatient(queryToMatch, patients);
        if (matched) return matched;
      }

      // 3. Check local storage fallback patients
      const localPatients = getAllLocalPatients();
      if (localPatients.length > 0) {
        if (queryToMatch) {
          const matchedLocal = findMatchingPatient(queryToMatch, localPatients);
          if (matchedLocal) return matchedLocal;
        }
        if (currentUser?.patientId) {
          const found = localPatients.find(p => p.id === currentUser.patientId || p.hn === currentUser.patientId);
          if (found) return found;
        }
      }

      // 4. If single patient environment, safely link to that patient
      if (patients.length === 1) {
        return patients[0];
      }

      // 5. Fallback directly from persistent session to ensure instant render
      const persistent = getPersistentPatientSession();
      if (persistent && (persistent.hn || persistent.id)) {
        return {
          id: persistent.id || persistent.hn || 'patient',
          hn: persistent.hn || persistent.id || 'hn001',
          firstName: persistent.name || 'คนไข้',
          lastName: '',
          nickname: persistent.name || 'คนไข้',
          phone: persistent.phone || '',
          parentPhone: persistent.phone || '',
          age: 10,
          gender: 'other',
          weight: 30,
          height: 135,
          startDate: new Date().toISOString().split('T')[0],
          status: 'active',
          assignments: [],
          notes: ''
        } as Patient;
      }

      return undefined;
    }
    if (!selectedPatientId) return undefined;
    return patients.find((p) => p.id === selectedPatientId || p.hn === selectedPatientId);
  }, [isPatient, patients, currentUser?.patientId, currentUser?.hn, currentUser?.username, currentUser?.name, selectedPatientId, initialPatientHn, persistentSession]);

  const handleAutoLinkSuccess = (linkedPatient: Patient) => {
    const patientName = `${linkedPatient.firstName} ${linkedPatient.lastName}`.trim();
    const patientHn = linkedPatient.hn || linkedPatient.id;
    authService.login('PATIENT', linkedPatient.id, patientName, undefined, patientHn);
    setUserRole('PATIENT');
    setIsAuthenticated(true);
    handleSelectPatient(linkedPatient.id);
    setActiveTab('หน้าหลัก');
    setFeedback({
      message: `เชื่อมโยงโปรไฟล์ ${patientName} (${patientHn}) เรียบร้อยแล้ว`,
      type: 'success'
    });
  };

  // Data scoping to protect privacy
  const scopedLogs = useMemo(() => isPatient
    ? (assignedPatient ? logs.filter((l) => l.patientId === assignedPatient.id) : [])
    : logs, [isPatient, logs, assignedPatient?.id]);

  const scopedAppointments = useMemo(() => {
    if (isPatient) {
      if (!assignedPatient) return [];
      const pHn = (assignedPatient.hn || '').trim().toLowerCase();
      const pId = (assignedPatient.id || '').trim().toLowerCase();
      return appointments.filter(a => {
        const aHn = ((a as any).hn || (a as any).HN || '').trim().toLowerCase();
        const aPatId = (a.patientId || '').trim().toLowerCase();
        const matchHn = pHn && (aHn === pHn || aPatId === pHn);
        const matchId = pId && (aPatId === pId || aHn === pId);
        return matchHn || matchId;
      });
    }
    return appointments;
  }, [isPatient, appointments, assignedPatient?.id, assignedPatient?.hn]);

  const scopedPatients = useMemo(() => isPatient
    ? (assignedPatient ? [assignedPatient] : [])
    : patients, [isPatient, assignedPatient, patients]);

  // Strict Route Protection & Auto-redirection per Role
  useEffect(() => {
    if (isPatient) {
      if (!allowedTabs.includes(activeTab) || activeTab === 'Dashboard') {
        const savedTab = localStorage.getItem('growth_lab_patient_active_tab');
        if (savedTab && allowedTabs.includes(savedTab)) {
          setActiveTab(savedTab);
        } else {
          setActiveTab(assignedPatient ? 'หน้าหลัก' : 'Check-In');
        }
      }
    } else if (isAuthenticated) {
      if (!allowedTabs.includes(activeTab)) {
        setActiveTab('Dashboard');
      }
    }
  }, [userRole, isAuthenticated, activeTab, allowedTabs, isPatient, assignedPatient]);

  if (!isAuthenticated || !userRole) {
    const handleLoginSuccess = (role: UserRole, openSystemManager?: boolean) => {
      const user = authService.getCurrentUser();
      const isRoleAdmin = role === 'ADMIN' || role === 'DEVELOPER' || role === 'CLINIC_OWNER';
      setIsAdmin(isRoleAdmin);
      setCurrentRole(role);
      setUserRole(role);
      setViewMode(isRoleAdmin ? 'admin' : 'patient');
      setIsAuthenticated(true);
      if (role === 'PATIENT' && user?.patientId) {
        handleSelectPatient(user.patientId);
      } else {
        // Restore last selected member if available
        const saved = localStorage.getItem('growth_lab_selected_patient_id') || sessionStorage.getItem('growth_lab_selected_patient_id');
        if (saved && saved !== 'null' && saved !== 'undefined') {
          handleSelectPatient(saved);
        }
      }
      if (role === 'PATIENT') {
        setActiveTab('หน้าหลัก');
      } else {
        setActiveTab('Dashboard');
      }
      if (openSystemManager) {
        setShowSystemManager(true);
      }
    };

    const handleLandingLogin = (role: any, data?: any) => {
      if (role === 'clinic') {
        const staffList = staffAccounts || defaultStaffList;
        const staff = staffList.find(s => s.username === data?.username && s.password === data?.password);
        if (staff) {
          authService.login(staff.role as UserRole, staff.id, staff.name, undefined, staff.username);
          handleLoginSuccess(staff.role as UserRole);
        } else {
          authService.login('ADMIN', undefined, data?.username || 'ผู้ดูแลระบบ', undefined, data?.username || 'admin');
          handleLoginSuccess('ADMIN');
        }
      } else if (role === 'patient') {
        const targetHn = data?.hn || data?.hnOrPhone;
        if (targetHn) {
          const match = patients.find(p => p.hn === targetHn || p.phone === targetHn || p.id === targetHn);
          const patientId = match ? match.id : targetHn;
          const patientName = match ? `${match.firstName} ${match.lastName}`.trim() || match.nickname : `HN: ${targetHn}`;
          authService.login('PATIENT', undefined, patientName, patientId);
          handleSelectPatient(patientId);
          handleLoginSuccess('PATIENT');
        } else {
          authService.login('PATIENT');
          handleLoginSuccess('PATIENT');
        }
      } else {
        handleLoginSuccess(role as UserRole);
      }
    };

    if (appMode === 'patient') {
      return (
        <>
          <VersionNotificationToast />
          <PatientPortalEntry
            onLogin={(role) => handleLoginSuccess(role)}
            onSwitchMode={(mode) => {
              if (mode === 'clinic') {
                handleSwitchToClinicMode();
              } else {
                setAppMode(mode);
              }
            }}
          />
        </>
      );
    }

    return (
      <>
        <VersionNotificationToast />
        <LandingPage
          onLogin={handleLandingLogin}
          onSwitchMode={(mode) => {
            if (mode === 'CLINIC') {
              handleSwitchToClinicMode();
            } else {
              setAppMode('patient');
            }
          }}
        />
      </>
    );
  }

  // Determine whether application is running in a configured production environment
  const isProduction =
    Boolean(import.meta.env.VITE_PUBLIC_APP_URL) ||
    import.meta.env.VITE_APP_ENV === 'PRODUCTION' ||
    import.meta.env.PROD ||
    import.meta.env.MODE === 'production' ||
    APP_ENV === 'PRODUCTION';

  const showDemoBanner = APP_ENV === 'DEMO' && !isProduction;

  return (
    <div 
      style={{
        background: `
          radial-gradient(circle at 15% 15%, rgba(192, 132, 252, 0.45) 0%, transparent 45%),
          radial-gradient(circle at 85% 20%, rgba(244, 114, 182, 0.4) 0%, transparent 45%),
          radial-gradient(circle at 50% 85%, rgba(96, 165, 250, 0.45) 0%, transparent 50%),
          linear-gradient(135deg, #dfc2f7 0%, #f7cadf 45%, #c7e3fc 100%)
        `
      }}
      className="flex w-full h-screen overflow-hidden font-sans text-slate-950 select-none box-border"
    >
      <VersionNotificationToast />
      {activeTab === 'นัดหมาย' && <AmbientBackground />}
      <FeedbackBanner message={feedback?.message || null} type={feedback?.type || 'success'} onClose={() => setFeedback(null)} />
      {showDemoBanner && (
        <div className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
          <div className="bg-amber-500 text-white text-[10px] font-black tracking-widest uppercase px-4 py-1 rounded-b-xl shadow-lg border-x-2 border-b-2 border-amber-600/50">
            DEMO MODE (NOT PRODUCTION)
          </div>
        </div>
      )}
      {/* MOBILE MENU DRAWER OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* SIDEBAR NAVIGATION - FIXED WIDTH FLEX ITEM */}
      <aside 
        translate="no"
        className={`notranslate w-64 min-w-[16rem] max-w-[16rem] shrink-0 h-full flex flex-col justify-between p-4 bg-purple-50/70 backdrop-blur-xl border-r-2 border-amber-400/50 relative z-10 transition-all duration-300 print:hidden ${
        isMobileMenuOpen ? 'fixed inset-y-0 left-0 z-50 flex' : 'hidden lg:flex'
      }`}>
        <div className="flex flex-col justify-between h-full max-h-full p-4 box-border">
          {/* Top Brand Logo & Nav items */}
          <div className="flex flex-col flex-1 min-h-0">
            {/* Sidebar Brand Area (Seamless Transparent Aurora Glass — Prominent Official Logo) */}
            <div className="flex items-center justify-center w-full px-2 pt-1 pb-2 shrink-0">
              <div className="w-[165px] sm:w-[175px] lg:w-[185px] flex items-center justify-center">
                <Logo className="w-full h-auto object-contain drop-shadow-[0_3px_12px_rgba(45,21,74,0.22)]" />
              </div>
            </div>

            {/* Nav List with independent smooth scrolling */}
            <nav 
              className="flex-1 overflow-y-auto pr-1 my-2 flex flex-col gap-1 custom-scrollbar text-left notranslate" 
              style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
              translate="no"
            >
              {isPatient ? (
                <div className="flex flex-col gap-1">
                  {patientMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    const unreadAlertsCount = item.id === 'การแจ้งเตือน' ? unreadCount : 0;
                    const isHomeworkItem = item.id === 'แบบฝึกหัดที่ได้รับมอบหมาย';
                    const homeworkStages = [
                      { id: 'gns', label: '🥗 [1] โภชนาการ (GNS)', stage: 1, type: 'GNS' },
                      { id: 'sleep', label: '🌙 [2] การนอน & ใส่อุปกรณ์ EF', stage: 2, type: 'EF' },
                      { id: 'exercise', label: '🏃 [3] ออกกำลังกายเพิ่มความสูง & บุคลิกภาพ', stage: 3, type: 'EXERCISE' },
                      { id: 'omt', label: '👄 [4] แบบฝึกกล้ามเนื้อปาก OMT', stage: 4, type: 'OMT' },
                    ] as const;
                    
                    return (
                      <div key={item.id} className="mb-0.5">
                        <div className="flex items-center gap-1">
                          <button type="button"
                            onClick={() => {
                              if (item.id === 'inception_story') {
                                setShowInceptionModal(true);
                                setIsMobileMenuOpen(false);
                                return;
                              }
                              setActiveTab(item.id);
                              if (isHomeworkItem) {
                                setSelectedHomeworkStage('all');
                              }
                              if (item.id === 'ผู้รับการดูแล') setSelectedPatientId(undefined);
                              setActiveModule(null);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`w-full group relative flex items-center justify-between px-3 py-2 rounded-xl text-[13.5px] font-semibold transition-all duration-200 cursor-pointer min-h-[38px] ${
                              isActive 
                                ? 'sidebar-active-item text-white font-bold shadow-md' 
                                : 'text-slate-800 hover:text-slate-950 hover:bg-purple-600/15 border border-amber-300/40'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <Icon className={`w-4.5 h-4.5 shrink-0 transition-colors duration-200 ${isActive ? 'text-white' : 'text-purple-800 group-hover:text-purple-950'}`} />
                              <span className="truncate text-left leading-normal">
                                {isHomeworkItem ? '🧠 การบ้านของฉัน' : item.label}
                              </span>
                            </div>
                            {unreadAlertsCount > 0 && (
                              <span className={`px-2 py-0.5 text-xs font-bold rounded-full shrink-0 ${isActive ? 'bg-white text-[#7C3AED]' : 'bg-rose-500 text-white shadow-xs'}`}>
                                {unreadAlertsCount}
                              </span>
                            )}
                            {isHomeworkItem && (
                              <span className="p-0.5 rounded-lg text-purple-800 opacity-70 shrink-0 ml-1">
                                <ChevronDown className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </button>
                        </div>

                        {/* Dropdown 4-Stage List for '🧠 การบ้านของฉัน' (Always open) */}
                        {isHomeworkItem && (
                          <div className="ml-3.5 pl-2.5 border-l-2 border-amber-400/60 my-1 space-y-1">
                            {homeworkStages.map((stg) => {
                              const todayStr = new Date().toISOString().split('T')[0];
                              let isDone = false;
                              try {
                                const saved = localStorage.getItem(`growth_completed_exercises_${assignedPatient?.id}_${todayStr}`);
                                if (saved) {
                                  const parsed = JSON.parse(saved);
                                  if (stg.id === 'gns' && (parsed[`asgn_${assignedPatient?.id}_gns`] || assignedPatient?.nutritionLogs?.some(l => l.date?.startsWith(todayStr)))) isDone = true;
                                  if (stg.id === 'sleep' && (parsed[`asgn_${assignedPatient?.id}_sleep_ef`] || assignedPatient?.efRecordLogs?.some(l => l.date?.startsWith(todayStr)))) isDone = true;
                                  if (stg.id === 'exercise' && (parsed[`asgn_${assignedPatient?.id}_posture_7`] || Object.keys(parsed).some(k => k.includes('posture') || k.includes('EX_')))) isDone = true;
                                  if (stg.id === 'omt' && (parsed[`asgn_${assignedPatient?.id}_tongue_3`] || Object.keys(parsed).some(k => k.includes('tongue') || k.includes('OMT') || k.includes('lips')))) isDone = true;
                                }
                              } catch (e) { /* ignore */ }

                              const isSelected = activeTab === 'แบบฝึกหัดที่ได้รับมอบหมาย' && selectedHomeworkStage === stg.id;

                              return (
                                <button type="button"
                                  key={stg.id}
                                  onClick={() => {
                                    setActiveTab('แบบฝึกหัดที่ได้รับมอบหมาย');
                                    setSelectedHomeworkStage(stg.id as any);
                                    setSelectedExerciseIdFromNav(null);
                                    setActiveModule(null);
                                    setIsMobileMenuOpen(false);
                                  }}
                                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between gap-1.5 cursor-pointer min-h-[34px] ${
                                    isSelected
                                      ? 'bg-purple-700 text-white shadow-xs font-black border border-amber-400/70'
                                      : 'text-slate-800 hover:bg-purple-600/15 hover:text-slate-950 border border-amber-300/30'
                                  }`}
                                >
                                  <span className="truncate flex-1 leading-normal text-[11.5px]">
                                    {stg.label}
                                  </span>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-extrabold shrink-0 ${
                                    isDone 
                                      ? isSelected ? 'bg-emerald-400 text-emerald-950' : 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                      : isSelected ? 'bg-white/20 text-white' : 'bg-purple-100/90 text-purple-900 border border-purple-200'
                                  }`}>
                                    {isDone ? '✓ เสร็จ' : '⏳ วันนี้'}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {filteredStaffMenuGroups.map((group, groupIdx) => (
                    <div key={group.title} className={groupIdx > 0 ? 'pt-2 mt-1 border-t border-amber-300/40' : ''}>
                      <div className="px-2.5 pb-1 text-[10.5px] font-extrabold uppercase tracking-wider text-purple-950 flex items-center gap-1 select-none notranslate">
                        <span>[{group.title}]</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const isDangerItem = (item as any).isDanger;
                          const isActive = activeTab === item.id || 
                            (item.id === 'media_library' && (activeTab === 'media_library' || activeTab === 'คลังวิดีโอสาธิต' || activeTab === 'วิดีโอ' || activeTab === 'Exercise Media Hub')) ||
                            (item.id === 'คลังวิดีโอสาธิต' && (activeTab === 'media_library' || activeTab === 'คลังวิดีโอสาธิต' || activeTab === 'วิดีโอ' || activeTab === 'Exercise Media Hub')) ||
                            (item.id === 'ผู้รับการดูแล' && activeTab === 'ผู้เข้าโปรแกรม') || 
                            (item.id === 'ติดตามผล' && (activeTab === 'ติดตามการรักษา' || activeTab === 'การบ้านและ Progress')) ||
                            (item.id === 'QR' && activeTab === 'Check-In') ||
                            (item.id === 'EF / แบบฝึก' && activeTab === 'แบบฝึกหัดที่ได้รับมอบหมาย') ||
                            (item.id === 'ระบบ / โปรไฟล์' && (activeTab === 'โปรไฟล์' || activeTab === 'ระบบ / โปรไฟล์')) ||
                            ((item.id === 'Clinical Source' || item.id === 'Project Dossier') && (activeTab === 'Clinical Source' || activeTab === 'Project Dossier' || activeTab === 'เอกสารสำคัญโครงการ'));
                          const unreadAlertsCount = item.id === 'การแจ้งเตือน' ? unreadCount : 0;
                          
                          return (
                            <button type="button"
                              key={item.id}
                              onClick={() => {
                                setActiveTab(item.id);
                                if ((item as any).targetSubTab) setProfileSubTab((item as any).targetSubTab);
                                if (item.id === 'ผู้รับการดูแล') setSelectedPatientId(undefined);
                                setActiveModule(null);
                                setIsMobileMenuOpen(false);
                              }}
                              className={`w-full group relative flex items-center justify-between px-3 py-2 rounded-xl text-[13.5px] transition-all duration-200 cursor-pointer min-h-[38px] ${
                                isDangerItem
                                  ? 'text-rose-700 hover:text-rose-900 bg-rose-50/90 hover:bg-rose-100 border border-rose-300 font-bold my-0.5 shadow-2xs'
                                  : isActive 
                                    ? 'sidebar-active-item text-white font-bold shadow-md' 
                                    : 'text-slate-800 hover:text-slate-950 hover:bg-purple-600/15 font-semibold border border-amber-300/40'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <Icon className={`w-4.5 h-4.5 shrink-0 transition-colors duration-200 ${
                                  isDangerItem
                                    ? 'text-rose-600'
                                    : isActive 
                                      ? 'text-white' 
                                      : 'text-purple-800 group-hover:text-purple-950'
                                }`} />
                                <span className="truncate text-left leading-normal block">{item.label}</span>
                              </div>
                              {unreadAlertsCount > 0 && (
                                <span className={`px-2 py-0.5 text-xs font-bold rounded-full shrink-0 ${isActive ? 'bg-white text-[#7C3AED]' : 'bg-rose-500 text-white shadow-xs'}`}>
                                  {unreadAlertsCount}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </nav>
          </div>

          {/* Bottom Section: User Status & Logout locked at Sidebar Footer */}
          <div className="pt-3 mt-1 border-t border-amber-300/50 shrink-0 space-y-2 notranslate" translate="no">
            <div className="p-3 rounded-2xl bg-white/40 backdrop-blur-md border border-amber-400/60 shadow-2xs text-left mb-1.5">
              <span className="text-[11px] text-purple-900 font-bold block">สถานะผู้ใช้งาน:</span>
              <span className="text-slate-950 text-xs font-black font-sans mt-0.5 block truncate">
                {getUserDisplayDetails(currentUser, userRole).roleTitle}
              </span>
              <span className="text-[11px] text-slate-800 mt-0.5 block truncate font-medium">
                {settings.clinicName}
              </span>
            </div>

            {/* Quick Switch between Admin/Clinic Mode and Patient Mode */}
            {isPatient ? (
              <button
                type="button"
                onClick={handleSwitchToClinicMode}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 border border-amber-400/50 shadow-2xs transition-all cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>เข้าโหมดผู้ดูแลระบบ / คลินิก</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSwitchToPatientMode(selectedPatientId)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-purple-950 bg-purple-100/90 hover:bg-purple-200 border border-amber-400/40 shadow-2xs transition-all cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5 text-purple-800 shrink-0" />
                <span>สลับเป็นมุมมองคนไข้</span>
              </button>
            )}

            <div className="flex items-center gap-2">
              <button type="button"
                onClick={() => setShowLogoutConfirmModal(true)}
                className={`${isDeveloper ? 'flex-1' : 'w-full'} flex items-center justify-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 hover:text-rose-900 hover:bg-rose-100/70 border border-rose-300/40 transition-all cursor-pointer`}
              >
                <LogOut className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="leading-normal">ออกจากระบบ</span>
              </button>
              {isDeveloper && (
                <button type="button" onClick={handleGearClick}
                  className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-white/40 transition-colors cursor-pointer shrink-0"
                  title="การตั้งค่าระบบ (Developer & Technical Settings)"
                >
                  <SettingsIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN VIEW CONTENT CONTAINER - INDEPENDENT SCROLL */}
      <div 
        ref={mainContentRef}
        className="flex-1 min-w-0 h-full overflow-y-auto relative z-0 flex flex-col box-border custom-scrollbar"
        style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
      >
        {/* Header - Transparent & Natural Document Flow (Non-sticky) */}
        <header className="w-full flex items-center justify-between px-4 sm:px-6 md:px-8 pt-6 pb-2 print:hidden shrink-0">
          <div className="flex items-center gap-2 sm:gap-3.5 min-w-0 flex-1 mr-2">
            <button type="button" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden w-9 h-9 sm:w-10 sm:h-10 shrink-0 flex items-center justify-center rounded-xl text-slate-800 hover:text-purple-600 hover:bg-purple-100/30 transition-all cursor-pointer"
              title="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2 sm:gap-3 font-bold text-slate-950 tracking-tight min-w-0 flex-1">
              <div className="w-20 sm:w-24 shrink-0 lg:hidden flex items-center">
                <Logo className="w-full h-auto object-contain" />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 truncate leading-tight">
                {getTabDisplayTitle(activeTab)}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <button type="button" onClick={() => setActiveTab('การแจ้งเตือน')}
              className="relative p-2 text-slate-600 hover:text-purple-600 transition-colors cursor-pointer"
              title="การแจ้งเตือน"
            >
              <Bell className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {currentUser && (() => {
              const userDetails = getUserDisplayDetails(currentUser, userRole);
              const isDoctorOrOwner = userRole === 'DOCTOR' || userRole === 'CLINIC_OWNER';
              
              const displayAvatarUrl = isPatient && assignedPatient?.avatarUrl 
                ? assignedPatient.avatarUrl 
                : (settings?.doctorPhotoUrl ? settings.doctorPhotoUrl : null);
                
              const displayName = isPatient && assignedPatient 
                ? `${assignedPatient.firstName || ''} ${assignedPatient.lastName || ''}`.trim()
                : (settings?.doctorName ? settings.doctorName : (isDoctorOrOwner ? 'ทันตแพทย์หญิง นภาพร วรรณษา' : userDetails.name));

              const displayRole = isPatient 
                ? 'ผู้รับการดูแล' 
                : (isDoctorOrOwner ? 'ทันตแพทย์ผู้ให้การรักษาและเจ้าของคลินิก' : userDetails.roleTitle);
              
              return (
                <div 
                  onClick={() => isPatient ? setActiveTab('โปรไฟล์') : ((userRole === 'ADMIN' || userRole === 'DEVELOPER') ? setActiveTab('ตั้งค่า') : setActiveTab('ระบบ / โปรไฟล์'))}
                  className="flex items-center gap-3 bg-white px-3.5 sm:px-4 py-2 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-purple-300 transition-all cursor-pointer group"
                >
                  <div className="relative">
                    {displayAvatarUrl ? (
                      <img src={displayAvatarUrl} alt="profile" className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover shadow-xs group-hover:scale-105 transition-transform border border-slate-200" />
                    ) : (
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#6722f4] text-white flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                        {userDetails.avatarInitials || 'นภ'}
                      </div>
                    )}
                    {isPatient && (
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white"></span>
                      </span>
                    )}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-bold text-slate-900 leading-tight">
                        {displayName}
                      </span>
                      {isPatient && (
                        <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                          ออนไลน์
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-[#6722f4] mt-0.5">
                      {displayRole}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main 
          className="w-full flex flex-col gap-4 sm:gap-6 flex-1 relative box-border px-2 sm:px-4 md:px-6 pb-6 pt-2 text-base"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + (selectedPatientId || '') + (profileSubTab || '')}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-full max-w-full flex-1 box-border overflow-x-hidden flex flex-col gap-4 sm:gap-6"
            >
          {activeTab === 'Dashboard' && !isPatient && (
            <Dashboard 
              patients={scopedPatients}
              appointments={scopedAppointments}
              logs={scopedLogs}
              settings={settings}
              currentUser={currentUser}
              userRole={userRole}
              onNavigate={(tab, patientId, subTab) => {
                if (patientId) setSelectedPatientId(patientId);
                else if (tab === 'ผู้รับการดูแล') setSelectedPatientId(undefined);
                if (subTab) setProfileSubTab(subTab);
                setActiveTab(tab);
              }}
              onSelectPatient={(patientId, persist) => handleSelectPatient(patientId, persist)}
              onAddPatient={handleAddPatient}
              onUpdateAssignments={handleUpdatePatientAssignments}
              onAddLog={handleAddLog}
              triggerFeedback={triggerFeedback}
              onRefreshPatients={handleRefreshPatientsFromGoogleSheets}
            />
          )}

          {/* Quick Actions Bar */}
          {activeTab !== 'Dashboard' && activeTab !== 'หน้าหลัก' && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#1A1A24] bg-white/90 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
                  📌 {activeTab}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {activeTab === 'ผู้รับการดูแล' && (
                  <button type="button"
                    onClick={() => {
                      const btn = document.getElementById('btn-add-patient-modal');
                      if (btn) btn.click();
                    }}
                    className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer min-h-[44px]"
                  >
                    <span>+ เพิ่มการดูแลใหม่</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {(['ผู้เข้าโปรแกรม', 'ผู้รับการดูแล', 'patients', 'สารบบรายชื่อผู้เข้าโปรแกรม', 'สารบบผู้รับการดูแล'].includes(activeTab)) && !isPatient && (
            selectedPatientId && profileSubTab && (patients || []).some(p => p.id === selectedPatientId || p.hn === selectedPatientId) ? (
              <UserWorkspace 
                patient={(patients || []).find(p => p.id === selectedPatientId || p.hn === selectedPatientId)!}
                onBack={() => { goBack(); setSelectedPatientId(undefined); setProfileSubTab("ภาพรวม"); }}
                logs={scopedLogs || []}
                appointments={scopedAppointments || []}
                onEditPatient={handleEditPatient}
                onDeletePatient={handleDeletePatient}
                onAddLog={handleAddLog}
                onDeleteLog={handleDeleteLog}
                onCheckIn={handleCheckIn}
                onUpdatePatientNutrition={handleUpdatePatientNutrition}
                onUpdatePatientGrowth={handleUpdatePatientGrowth}
                onUpdatePatientSleep={handleUpdatePatientSleep}
                onUpdatePatientAssignments={handleUpdatePatientAssignments}
                onAddAppointment={handleAddAppointment}
                onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
                onDeleteAppointment={handleDeleteAppointment}
              />
            ) : (
              <PatientsList 
                patients={scopedPatients || []}
                onSelectPatient={(id) => {
                  if (id) setProfileSubTab(prev => prev || 'ภาพรวม');
                  handleSelectPatient(id, true);
                }}
                onEditPatient={handleEditPatient}
                onDeletePatient={handleDeletePatient}
                onAddPatient={handleAddPatient}
                logs={scopedLogs || []}
                onAddLog={handleAddLog}
                onDeleteLog={handleDeleteLog}
                onRefreshPatients={handleRefreshPatientsFromGoogleSheets}
                isLoading={isInitialDataLoading}
              />
            )
          )}

          {(activeTab === 'ติดตามผล' || activeTab === 'ติดตามการรักษา' || activeTab === 'ติดตามผลภาพรวม') && !isPatient && (
            <CheckInAnalyticsPanel 
              patients={scopedPatients}
              onSelectPatient={(id) => handleSelectPatient(id, true)}
              onNavigate={(tab, patientId, subTab) => {
                if (patientId) setSelectedPatientId(patientId);
                else if (tab === 'ผู้รับการดูแล') setSelectedPatientId(undefined);
                if (subTab) setProfileSubTab(subTab);
                setActiveTab(tab);
              }}
              onRefresh={(showToast = true) => handleRefreshPatientsFromGoogleSheets(showToast)}
              isLoading={isInitialDataLoading}
            />
          )}

          {activeTab === 'นัดหมาย' && (
            <AppointmentsList 
              appointments={scopedAppointments}
              patients={scopedPatients}
              onAddAppointment={handleAddAppointment}
              onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
              onDeleteAppointment={handleDeleteAppointment}
              onUpdateAppointment={handleUpdateAppointment}
            />
          )}

          {(activeTab === 'media_library' || activeTab === 'วิดีโอ' || activeTab === 'คลังวิดีโอสาธิต' || activeTab === 'Exercise Media Hub') && (
            <MediaLibraryHub userRole={userRole} onNavigate={setActiveTab} />
          )}

          {(activeTab === 'Clinical Source' || activeTab === 'Project Dossier' || activeTab === 'เอกสารสำคัญโครงการ' || activeTab === 'เอกสารสำคัญโครงสร้างระบบ') && !isPatient && (
            <ClinicalSourceManager 
              sources={clinicalSourceDocuments}
              onUpdateSourceStatus={handleUpdateClinicalSourceStatus}
              onAddSource={handleAddClinicalSource}
              userRole={userRole}
              initialMainTab={dossierMainTab}
              onOpenInceptionModal={() => setShowInceptionModal(true)}
            />
          )}

          {activeTab === 'รายงาน' && !isPatient && (
            <PDFExporter 
              patients={scopedPatients}
                            logs={scopedLogs}
              selectedPatientId={effectivePatientId}
            />
          )}

          {activeTab === 'บุคลากร' && !isPatient && (
            <StaffManagement
              staffAccounts={staffAccounts.filter(s => !isDeveloperStaffAccount(s))}
              onAddStaff={handleAddStaff}
              onUpdateStaff={handleUpdateStaff}
              onDeleteStaff={handleDeleteStaff}
              onToggleStatus={handleToggleStaffStatus}
              triggerFeedback={triggerFeedback}
            />
          )}

          {(activeTab === 'คลังความรู้' || activeTab === 'knowledge_hub' || activeTab === 'คลังความรู้สุขภาพ') && (
            <KnowledgeHub onNavigate={(tab) => setActiveTab(tab)} />
          )}

          {(activeTab === 'คู่มือ' || activeTab === 'คู่มือการใช้งาน') && (
            <UserGuide 
              onBack={goBack} 
              isPatient={isPatient}
              userRole={userRole}
              onNavigateToTab={(tab, patientId, subTab) => {
                setActiveTab(tab);
                if (patientId) handleSelectPatient(patientId);
                if (subTab) setProfileSubTab(subTab);
              }}
            />
          )}

          {(activeTab === 'QR' || activeTab === 'Check-In' || activeTab === 'คิวอาร์ / เช็คอิน') && (
            isPatient ? (
              assignedPatient ? (
                <ParticipantCheckInPortal
                  patient={assignedPatient}
                  onCheckIn={handleCheckIn}
                  onToggleExerciseComplete={(patientId, assignmentId) => {
                    handleToggleAssignmentComplete(patientId, assignmentId);
                  }}
                  onSaveAllAssignments={(patientId, updatedAssignments) => {
                    handleUpdatePatientAssignments(patientId, updatedAssignments);
                  }}
                  onNavigate={(tab) => setActiveTab(tab)}
                  onLogout={handleLogout}
                />
              ) : (
                <ProfileLoadingFallback isLoading={isInitialDataLoading} patients={patients} onAutoLink={handleAutoLinkSuccess} />
              )
            ) : (
              <QRCodeCheckIn
                patients={scopedPatients} 
                              settings={settings}
                onSelectPatient={handleSelectPatient}
                onNavigate={(tab, patientId, subTab) => {
                  setActiveTab(tab);
                  if (patientId) handleSelectPatient(patientId);
                  else if (tab === 'ผู้รับการดูแล') handleSelectPatient(undefined);
                  if (subTab) setProfileSubTab(subTab);
                }}
                onBack={goBack}
                onCheckIn={handleCheckIn}
              />
            )
          )}

          {(activeTab === 'แบบฝึกหัดที่ได้รับมอบหมาย' || activeTab === 'ExerciseView' || activeTab === 'ExerciseMode' || activeTab === 'EF / แบบฝึก' || activeTab === 'แบบฝึก' || activeTab === 'Master Template') && (
            isPatient ? (
              assignedPatient ? (
                <ExerciseView
                  patient={assignedPatient}
                  patients={patients}
                  isClinicMode={false}
                  initialStage={selectedHomeworkStage}
                  onBack={() => {
                    setActiveTab('หน้าหลัก');
                  }}
                  onNavigateToHome={() => {
                    setActiveTab('หน้าหลัก');
                  }}
                  onLogout={handleLogout}
                  onCompleteExercise={(assignmentId) => {
                    handleToggleAssignmentComplete(assignedPatient.id, assignmentId);
                  }}
                />
              ) : (
                <ProfileLoadingFallback isLoading={isInitialDataLoading} patients={patients} onAutoLink={handleAutoLinkSuccess} />
              )
            ) : (
              <ExerciseView
                patient={patients.find(p => p.id === effectivePatientId || p.hn === effectivePatientId) || null}
                patients={patients}
                isClinicMode={true}
                initialStage={selectedHomeworkStage}
                onBack={goBack}
                onNavigateToHome={() => {
                  setActiveTab('Dashboard');
                }}
                onSelectPatient={(id) => handleSelectPatient(id, true)}
                onLogout={handleLogout}
                onCompleteExercise={(assignmentId) => {
                  const p = patients.find(p => p.id === effectivePatientId || p.hn === effectivePatientId) || patients[0];
                  if (p) handleToggleAssignmentComplete(p.id, assignmentId);
                }}
              />
            )
          )}

          {activeTab === 'การบ้านและ Progress' && (
            isPatient ? (
              assignedPatient ? (
                <HomeworkProgress 
                  patients={[assignedPatient]}
                  logs={scopedLogs}
                  patientId={assignedPatient.id}
                  onBack={goBack} 
                />
              ) : (
                <ProfileLoadingFallback isLoading={isInitialDataLoading} patients={patients} onAutoLink={handleAutoLinkSuccess} />
              )
            ) : (
              <HomeworkProgress 
                patients={scopedPatients}
                            logs={scopedLogs}
                patientId={effectivePatientId}
                onBack={goBack} 
              />
            )
          )}

          {activeTab === 'ตั้งค่า' && !isPatient && (
            (userRole === 'DEVELOPER' || userRole === 'ADMIN' || userRole === 'DOCTOR' || userRole === 'CLINIC_OWNER' || isAdmin || (currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'DOCTOR' || currentUser.role === 'DEVELOPER' || currentUser.email === 'niramon7196@gmail.com' || currentUser.username?.toLowerCase().includes('niramon')))) ? (
              <SettingsPanel 
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onResetDatabase={handleResetDatabase}
                currentUser={currentUser}
                userRole={userRole}
                staffAccounts={staffAccounts}
                onUpdateStaff={handleUpdateStaff}
                onToggleStaffStatus={handleToggleStaffStatus}
                onAddStaff={handleAddStaff}
                onBack={() => setActiveTab('Dashboard')}
                onClose={() => setActiveTab('Dashboard')}
                isDeveloperMode={false}
              />
            ) : (
              <div className="aurora-modal p-8 rounded-3xl max-w-md w-full mx-auto text-center space-y-4 my-auto">
                <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto text-rose-500 text-3xl">
                  🔒
                </div>
                <h2 className="text-xl font-bold text-slate-900">ไม่สามารถเข้าใช้งานได้</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  ส่วนนี้สำหรับผู้ดูแลระบบที่ได้รับอนุญาตเท่านั้น
                </p>
                <button type="button"
                  onClick={() => setActiveTab('Dashboard')}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all cursor-pointer shadow-md"
                >
                  กลับไปหน้าหลัก
                </button>
              </div>
            )
          )}

          {activeTab === 'การแจ้งเตือน' && (
            <NotificationsPanel 
              notifications={isPatient ? notifications.filter(n => !n.patientId || n.patientId === assignedPatient?.id) : notifications}
              patients={scopedPatients}
                            logs={scopedLogs}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
              onAddNotification={handleAddNotification}
              onNavigateToPatient={(patientId) => {
                handleSelectPatient(patientId);
                setActiveTab('ผู้รับการดูแล');
              }}
            />
          )}

          {/* CAREGIVER / PATIENT ONLY TABS */}
          {activeTab === 'หน้าหลัก' && isPatient && (
            assignedPatient ? (
              <PatientDashboard
                patient={assignedPatient}
                logs={scopedLogs}
                appointments={scopedAppointments}
                onNavigate={(tab) => {
                  if (tab === 'แบบฝึกหัดที่ได้รับมอบหมาย_WIZARD') {
                    setSelectedHomeworkStage('wizard' as any);
                    setActiveTab('แบบฝึกหัดที่ได้รับมอบหมาย');
                  } else {
                    setActiveTab(tab);
                  }
                }}
                onUpdatePatientNutrition={handleUpdatePatientNutrition}
                onUpdatePatientGrowth={handleUpdatePatientGrowth}
                onUpdatePatientAssignments={handleUpdatePatientAssignments}
                onUpdatePatientSleep={handleUpdatePatientSleep}
                onUpdatePatientEfLog={handleUpdatePatientEfLog}
                onCheckIn={handleCheckIn}
                onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
              />
            ) : (
              <ProfileLoadingFallback isLoading={isInitialDataLoading} patients={patients} onAutoLink={handleAutoLinkSuccess} />
            )
          )}

          {(activeTab === 'ระบบ / โปรไฟล์' || activeTab === 'โปรไฟล์' || activeTab === 'ข้อมูลคลินิก') && (
            isPatient ? (
              assignedPatient ? (
                <PatientProfile
                  patient={assignedPatient}
                  settings={settings}
                  onUpdatePatient={(upd) => handleEditPatient(upd)}
                />
              ) : (
                <ProfileLoadingFallback isLoading={isInitialDataLoading} patients={patients} onAutoLink={handleAutoLinkSuccess} />
              )
            ) : (
              <ClinicProfile
                currentUser={currentUser}
                userRole={userRole}
                settings={settings}
                staffAccounts={staffAccounts}
                onUpdateSettings={handleUpdateSettings}
                onLogout={() => setShowLogoutConfirmModal(true)}
                onNavigate={setActiveTab}
              />
            )
          )}

        </motion.div>
      </AnimatePresence>

      <footer className="w-full flex flex-col items-center justify-center py-3 text-center text-[11px] text-slate-600 font-medium tracking-wide shrink-0">
        <p>Clinical Growth Intelligence Platform • Version v1.1.0</p>
        <p>Designed & Developed by <span className="font-semibold text-slate-800">Nira.L</span> | © 2026 All Rights Reserved</p>
      </footer>
    </main>
      </div>

      <InceptionDossierModal 
        isOpen={showInceptionModal} 
        onClose={() => setShowInceptionModal(false)} 
      />

      {/* WELCOME MODAL */}
      {showWelcomeModal && (
        <WelcomeModal 
          onClose={() => {
            setShowWelcomeModal(false);
            localStorage.setItem('growth_lab_welcomed', 'true');
          }}
          onNavigate={(tab) => {
            if (tab === 'แบบฝึกหัดที่ได้รับมอบหมาย_WIZARD') {
              setSelectedHomeworkStage('wizard' as any);
              setActiveTab('แบบฝึกหัดที่ได้รับมอบหมาย');
            } else {
              setActiveTab(tab);
            }
          }}
        />
      )}

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutConfirmModal && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
          style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
        >
          <div className="bg-white w-full max-w-sm mx-auto rounded-2xl p-6 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto my-auto text-center space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto text-rose-600 shadow-xs border border-rose-200">
              <LogOut className="w-7 h-7 text-rose-600" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-950">ยืนยันการออกจากระบบ</h2>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                คุณต้องการออกจากระบบหรือไม่? เซสชันการเข้าสู่ระบบจะถูกล้าง และระบบจะนำทางกลับสู่หน้าแรกทันที
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirmModal(false)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer border border-slate-300"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="py-2.5 px-4 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>ออกจากระบบ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACCESS DENIED MODAL */}
      {showAccessDenied && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
          style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
        >
          <div className="bg-white w-full max-w-md mx-auto rounded-2xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto my-auto text-center space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-rose-50/80 rounded-2xl flex items-center justify-center mx-auto text-rose-500 text-3xl border border-rose-200">
              🔒
            </div>
            <h2 className="text-xl font-bold text-slate-950">ไม่มีสิทธิ์เข้าถึงส่วนนี้</h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              ส่วนการจัดการระบบสงวนไว้สำหรับผู้พัฒนาระบบ (SYSTEM_DEVELOPER) หรือผู้ดูแลที่ได้รับอนุญาตเท่านั้น
            </p>
            <button type="button"
              onClick={() => setShowAccessDenied(false)}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all cursor-pointer shadow-md"
            >
              กลับไปหน้าหลัก
            </button>
          </div>
        </div>
      )}

      {/* ADMIN LOGIN MODAL */}
      {showAdminLoginModal && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
          style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
        >
          <div className="bg-white w-full max-w-md mx-auto rounded-2xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto my-auto text-left space-y-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-950">ศูนย์ผู้พัฒนาระบบ</h2>
                <p className="text-xs text-slate-600 mt-0.5">สำหรับผู้พัฒนาระบบ (SYSTEM_DEVELOPER) เท่านั้น</p>
              </div>
              <button type="button" onClick={() => setShowAdminLoginModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              <div className="p-3 bg-purple-50/80 border-2 border-amber-400/80 rounded-2xl text-xs space-y-1 text-slate-800 shadow-[0_0_12px_rgba(251,191,36,0.2)]">
                <p className="font-bold text-purple-950 flex items-center gap-1.5">
                  <span>🔑</span> รหัสผ่านและชื่อผู้ใช้เริ่มต้น:
                </p>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-0.5">
                  <div className="bg-white/90 p-1.5 rounded-lg border border-purple-200">
                    <span className="text-slate-600 block">Username:</span>
                    <span className="font-mono font-bold text-purple-950">admin</span> หรือ <span className="font-mono font-bold text-purple-950">dev</span>
                  </div>
                  <div className="bg-white/90 p-1.5 rounded-lg border border-purple-200">
                    <span className="text-slate-600 block">Password:</span>
                    <span className="font-mono font-bold text-purple-950">admin123</span> หรือ <span className="font-mono font-bold text-purple-950">dev123</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อผู้ใช้ (Username)</label>
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="dev หรือ admin"
                  className="w-full px-4 py-3 rounded-xl aurora-input text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">รหัสผ่าน (Password)</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="admin123 หรือ dev123"
                  className="w-full px-4 py-3 rounded-xl aurora-input text-sm"
                />
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdminLoginModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all cursor-pointer shadow-md text-xs"
                >
                  เข้าสู่ระบบ
                </button>
              </div>

              <button
                type="button"
                onClick={handleBypassAdminLogin}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>⚡ ข้ามการล็อกอินและเข้าหน้าแดชบอร์ดทันที (Bypass)</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SYSTEM MANAGEMENT CENTER MODAL (FOR DEVELOPER / TECHNICAL ADMINISTRATION) */}
      {showSystemManager && (userRole === 'DEVELOPER' || userRole === 'CLINIC_OWNER' || userRole === 'ADMIN' || userRole === 'DOCTOR') && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 overflow-y-auto" 
          style={{ overflowY: 'auto', overscrollBehaviorY: 'contain', WebkitOverflowScrolling: 'touch' }}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white w-full max-w-5xl mx-auto rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto my-auto flex flex-col animate-in fade-in zoom-in-95 duration-200 border border-slate-200" 
            style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
          >
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚙️</span>
                <div>
                  <h3 className="text-base font-bold font-sans">ผู้พัฒนาระบบ (Developer & Technical Settings)</h3>
                  <p className="text-xs text-slate-400">ศูนย์การตั้งค่าทางเทคนิค โครงสร้างข้อมูล และสถานะระบบ</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowSystemManager(false)} className="text-slate-300 hover:text-white text-sm font-semibold cursor-pointer px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-all">✕ ปิด</button>
            </div>

            <div className="flex border-b border-slate-100 bg-slate-50 px-6 shrink-0 overflow-x-auto">
              <button type="button"
                onClick={() => setSystemManagerTab('settings')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  systemManagerTab === 'settings' || systemManagerTab === 'staff' ? 'border-teal-600 text-teal-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                ตั้งค่าระบบ (System Config)
              </button>
              <button type="button"
                onClick={() => setSystemManagerTab('permissions')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  systemManagerTab === 'permissions' ? 'border-teal-600 text-teal-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                ข้อมูลทางเทคนิค & Diagnostics
              </button>
              <button type="button"
                onClick={() => setSystemManagerTab('documentation')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  systemManagerTab === 'documentation' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>เอกสารสำคัญโครงสร้างระบบ (Documentation)</span>
              </button>
            </div>

            <div 
              className="flex-1 h-full overflow-y-auto p-4 sm:p-6 bg-slate-50/50 text-left pb-32"
              style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
            >
              {(systemManagerTab === 'settings' || systemManagerTab === 'staff') && (
                <SettingsPanel 
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                  onResetDatabase={handleResetDatabase}
                  currentUser={currentUser}
                  userRole={userRole}
                  staffAccounts={staffAccounts}
                  onUpdateStaff={handleUpdateStaff}
                  onToggleStaffStatus={handleToggleStaffStatus}
                  onAddStaff={handleAddStaff}
                  onBack={() => setShowSystemManager(false)}
                  onClose={() => setShowSystemManager(false)}
                  isDeveloperMode={true}
                  onNavigateToDocs={() => setSystemManagerTab('documentation')}
                />
              )}

              {systemManagerTab === 'permissions' && (
                <div className="space-y-5 text-left">
                  {/* Quick Access to Technical Documentation */}
                  <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-white rounded-2xl p-5 border border-purple-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">เอกสารสำคัญโครงสร้างระบบ (Technical Documentation Vault)</h4>
                        <p className="text-xs text-slate-500">พิมพ์เขียวระบบ บันทึกสิทธิ์การส่งมอบ (Deed) และคู่มือส่งต่องานทางเทคนิค</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSystemManagerTab('documentation')}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto shadow-xs"
                    >
                      <span>เปิดดูเอกสาร</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      ข้อมูลเวอร์ชันและรันไทม์ (System Information)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block mb-0.5">Application Name:</span>
                        <span className="font-bold text-slate-800">Growth Lab Health Platform</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block mb-0.5">System Version:</span>
                        <span className="font-mono font-bold text-teal-700">v1.2.4 (Production Build)</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block mb-0.5">Environment:</span>
                        <span className="font-mono font-bold text-slate-800">Cloud Run / Vite React 18</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block mb-0.5">Local Storage Engine:</span>
                        <span className="font-mono font-bold text-emerald-700">Active (PERSISTED)</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                    <h4 className="font-bold text-sm text-slate-900">โครงสร้างข้อมูลและสิทธิ์การเข้าถึงระบบ (Data Structure & Role Matrix)</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                            <th className="py-2.5 px-3">Role</th>
                            <th className="py-2.5 px-3">View Scope</th>
                            <th className="py-2.5 px-3">Edit Scope</th>
                            <th className="py-2.5 px-3">Developer Settings & Docs</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          <tr>
                            <td className="py-2.5 px-3 font-bold text-slate-800">Developer / System Admin</td>
                            <td className="py-2.5 px-3 text-emerald-600 font-bold">✓ Full Access</td>
                            <td className="py-2.5 px-3 text-emerald-600 font-bold">✓ Full Access</td>
                            <td className="py-2.5 px-3 text-emerald-600 font-bold">✓ Allowed (⚙️ & Docs Vault)</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-bold text-slate-800">Doctor / Assistant (หมอ/ผู้ช่วย)</td>
                            <td className="py-2.5 px-3 text-emerald-600 font-bold">✓ Clinic Portal & บุคลากร</td>
                            <td className="py-2.5 px-3 text-teal-700 font-bold">✓ Assigned Modules</td>
                            <td className="py-2.5 px-3 text-rose-500 font-bold">✕ Hidden from Sidebar</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-bold text-slate-800">Patient / Caregiver (ผู้รับการดูแล)</td>
                            <td className="py-2.5 px-3 text-emerald-600 font-bold">✓ Own Health Data</td>
                            <td className="py-2.5 px-3 text-rose-500 font-bold">✕ Restricted</td>
                            <td className="py-2.5 px-3 text-rose-500 font-bold">✕ Denied</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {systemManagerTab === 'documentation' && (
                <div className="space-y-4 text-left">
                  <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 rounded-2xl border border-indigo-500/30 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                    <div>
                      <span className="text-amber-400 text-xs font-extrabold flex items-center gap-1.5 uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5" />
                        Developer & Technical Architecture Vault
                      </span>
                      <h3 className="text-base font-bold text-white mt-0.5">
                        เอกสารสำคัญโครงสร้างระบบและคู่มือส่งมอบงาน (Documentation & Handover)
                      </h3>
                      <p className="text-xs text-slate-300 mt-0.5">
                        สงวนสิทธิ์เฉพาะผู้พัฒนาระบบ (System Developer / niramon7196@gmail.com) หรือผ่านหน้า Developer & Technical Settings เท่านั้น
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSystemManager(false);
                        setActiveTab('Clinical Source');
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto shadow-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>เปิดเต็มหน้าจอ (Full Page)</span>
                    </button>
                  </div>
                  <div className="rounded-2xl overflow-hidden bg-slate-950 p-1 border border-slate-800 shadow-xl min-h-[500px]">
                    <ClinicalSourceManager 
                      sources={clinicalSourceDocuments}
                      onUpdateSourceStatus={handleUpdateClinicalSourceStatus}
                      onAddSource={handleAddClinicalSource}
                      userRole="developer"
                      initialMainTab={dossierMainTab}
                      onOpenInceptionModal={() => setShowInceptionModal(true)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
