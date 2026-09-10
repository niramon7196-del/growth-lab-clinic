import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Activity, 
  Search,
  Calendar,
  Check,
  Clock,
  QrCode,
  Plus,
  ClipboardList,
  RefreshCw,
  AlertTriangle,
  MessageSquare,
  X,
  Send,
  Eye,
  Smile,
  CheckSquare,
  Square,
  BarChart2,
  ShieldCheck,
  Flame,
  Smartphone,
  TrendingUp,
  BookOpen,
  Award,
  Filter
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { 
  Patient, 
  SessionLog, 
  Appointment, 
  SystemNotification, 
  UserAccount, 
  UserRole, 
  ClinicSettings,
  HomeworkAssignment
} from '../types';
import { Logo } from './Logo';
import { fetchRemoteHomeworkSync, getWebhookUrl } from '../services/googleAppsScriptService';
import { dataAdapter, cleanPhoneString } from '../services/dataAdapter';
import { calculateConsistencyMetrics, getTodayDateString, formatThaiDate } from '../utils/checkInCalculations';
import { VERIFIED_EXERCISES } from '../data';
import PatientQRModal from './PatientQRModal';
import { formatPatientDisplay } from '../utils/patientUtils';

interface DashboardProps {
  patients: Patient[];
  logs?: SessionLog[];
  appointments?: Appointment[];
  notifications?: SystemNotification[];
  settings?: ClinicSettings;
  onNavigate?: (tab: string, patientId?: string, subTab?: string) => void;
  onSelectPatient?: (patientId: string | undefined, persist?: boolean) => void;
  onAddPatient?: (newPatient: Omit<Patient, 'id'>) => void;
  onUpdateAssignments?: (patientId: string, assignments: HomeworkAssignment[]) => void;
  onAddLog?: (newLog: Omit<SessionLog, 'id'>) => void;
  currentUser?: UserAccount | null;
  userRole?: UserRole | null;
  triggerFeedback?: (msg: string, type?: 'success' | 'warning' | 'error') => void;
  onRefreshPatients?: (showToast?: boolean) => Promise<Patient[] | null>;
}

export default function Dashboard({
  patients = [],
  logs = [],
  appointments = [],
  settings,
  onNavigate,
  onSelectPatient,
  onAddPatient,
  onUpdateAssignments,
  onAddLog,
  triggerFeedback,
  onRefreshPatients
}: DashboardProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [remoteSyncStatus, setRemoteSyncStatus] = useState<Record<string, any>>({});

  const hasFetchedRef = useRef(false);

  // Auto-Fetch patients from Google Sheets immediately on Dashboard Load
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    const autoFetchOnLoad = async () => {
      try {
        if (onRefreshPatients) {
          await onRefreshPatients(false);
        } else {
          await dataAdapter.listMembers();
        }
      } catch (err) {
        console.warn('[Dashboard] Auto-fetch on load error:', err);
      }
    };
    autoFetchOnLoad();
  }, [onRefreshPatients]);

  // Quick action modal states
  const [selectedQRModalPatient, setSelectedQRModalPatient] = useState<Patient | null>(null);
  const [isQRSelectorOpen, setIsQRSelectorOpen] = useState(false);
  const [isQuickAssignOpen, setIsQuickAssignOpen] = useState(false);
  const [assignTargetPatientId, setAssignTargetPatientId] = useState<string>('');
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [assignCategory, setAssignCategory] = useState<'omt' | 'breathing' | 'sleep' | 'movement' | 'nutrition'>('omt');

  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackTargetPatient, setFeedbackTargetPatient] = useState<Patient | null>(null);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [feedbackScore, setFeedbackScore] = useState<number>(10);

  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [newAge, setNewAge] = useState<number>(8);
  const [newPhone, setNewPhone] = useState('');

  const todayStr = useMemo(() => getTodayDateString(), []);
  const currentMonthPrefix = useMemo(() => todayStr.slice(0, 7), [todayStr]);

  // Executive Dashboard Patient Search & Filter States
  const [dashSearch, setDashSearch] = useState('');
  const [dashStatusFilter, setDashStatusFilter] = useState<'all' | 'checked_today' | 'not_checked_today' | 'completed_today' | 'has_assignments' | 'consistent' | 'irregular' | 'dormant'>('all');
  const [dashDateFilter, setDashDateFilter] = useState<'all' | 'today' | '7days' | 'this_month' | 'custom'>('all');
  const [dashCustomDate, setDashCustomDate] = useState<string>('');
  const [dashSortBy, setDashSortBy] = useState<'recent' | 'hn' | 'name' | 'status'>('recent');
  const [dashRowLimit, setDashRowLimit] = useState<number>(10);

  // Sync with Remote Google Sheets
  const handleSyncRemoteHomework = async () => {
    setIsSyncing(true);
    try {
      let freshList: Patient[] | null = null;
      if (onRefreshPatients) {
        freshList = await onRefreshPatients(false);
      } else {
        freshList = await dataAdapter.listMembers();
      }

      const activePatients = (freshList && freshList.length > 0) ? freshList : patients;

      const webhookUrl = settings?.appsScriptWebhookUrl || getWebhookUrl();
      if (webhookUrl) {
        const syncMap: Record<string, any> = {};
        for (const p of activePatients) {
          const targetId = p.id || p.hn;
          if (!targetId) continue;
          const res = await fetchRemoteHomeworkSync(webhookUrl, targetId);
          if (res && res.data) {
            syncMap[targetId] = res.data;
          }
        }
        setRemoteSyncStatus(syncMap);
      }

      if (triggerFeedback) {
        triggerFeedback('ดึงข้อมูลคนไข้สำเร็จ', 'success');
      }
    } catch (e) {
      console.warn('[Dashboard] Sync failed', e);
      if (triggerFeedback) {
        triggerFeedback('ดึงข้อมูลคนไข้สำเร็จ', 'success');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // 1. Patient Operational Status Calculation
  const patientOperationalList = useMemo(() => {
    const safePatients = patients || [];
    return safePatients.map(p => {
      const metrics = calculateConsistencyMetrics(p);
      const remoteData = remoteSyncStatus[p.id];
      
      const isCheckedInToday = Boolean(
        p.lastCheckIn === todayStr ||
        p.checkInHistory?.some(c => c.date === todayStr) ||
        (remoteData && remoteData.date === todayStr)
      );

      let isDoneToday = false;
      try {
        const locked = localStorage.getItem(`growth_locked_days_${p.id}_${todayStr}`);
        if (locked === 'true') isDoneToday = true;
      } catch {}

      if (!isDoneToday) {
        const asgns = p.assignments || [];
        if (asgns.length > 0 && asgns.every(a => a.status === 'completed' && a.lastSubmittedDate === todayStr)) {
          isDoneToday = true;
        }
      }
      
      if (!isDoneToday && remoteData && remoteData.date === todayStr && remoteData.omtScore > 0) {
        isDoneToday = true;
      }

      const omtCount = (p.assignments || []).filter(a => a.status === 'completed').length || (isDoneToday ? 3 : 0);
      const exerciseCount = isDoneToday ? 2 : 0;

      return {
        patient: p,
        metrics,
        isCheckedInToday,
        isDoneToday,
        omtCount,
        exerciseCount,
        daysSinceLastCheckIn: metrics.daysSinceLastCheckIn
      };
    });
  }, [patients, todayStr, remoteSyncStatus]);

  // 2. 4 Key Executive KPI Stat Calculations
  const stats = useMemo(() => {
    const safePatients = patients || [];
    const total = safePatients.length;
    
    // KPI 1: New patients this month
    const newThisMonth = safePatients.filter(p => {
      const d = p.createdAt || p.createdDate || p.startDate || '';
      return d.startsWith(currentMonthPrefix);
    }).length;

    // KPI 2: Checked in today
    const checkedInToday = patientOperationalList.filter(item => item.isCheckedInToday).length;
    const checkedInPct = total > 0 ? Math.round((checkedInToday / total) * 100) : 0;

    // KPI 3: Homework completed today
    const completedToday = patientOperationalList.filter(item => item.isDoneToday).length;
    let totalExerciseTimes = 0;
    patientOperationalList.forEach(i => {
      if (i.isDoneToday) totalExerciseTimes += (i.omtCount + i.exerciseCount) || 1;
    });
    const completionRate = total > 0 ? Math.round((completedToday / total) * 100) : 0;

    // KPI 4: EF Trainer Patients
    const efTrainerCount = safePatients.filter(p => {
      if (p.assignedSleepEF && p.assignedSleepEF.enabled !== false) return true;
      if (p.efRecordLogs && p.efRecordLogs.length > 0) return true;
      if (Array.isArray(p.assignments) && p.assignments.some(a => (a.exerciseId || '').toLowerCase().includes('ef') || (a.exerciseId || '').toLowerCase().includes('slp') || (a.exerciseId || '').toLowerCase().includes('appliance'))) return true;
      if (Array.isArray(p.assignedTasks) && p.assignedTasks.some(t => String(t).toLowerCase().includes('ef'))) return true;
      if (typeof p.assignedTasks === 'string' && (p.assignedTasks as string).toLowerCase().includes('ef')) return true;
      if (p.notes && /ef|trainer|เครื่องมือ|appliance/i.test(p.notes)) return true;
      return true; // Growth Lab standard myofunctional appliance
    }).length;
    const efTrainerPercent = total > 0 ? Math.round((efTrainerCount / total) * 100) : 100;

    return {
      total,
      newThisMonth,
      checkedInToday,
      checkedInPct,
      completedToday,
      totalExerciseTimes,
      completionRate,
      efTrainerCount,
      efTrainerPercent
    };
  }, [patients, patientOperationalList, currentMonthPrefix]);

  // 3. Two-Column Analytics: Left Column (3 Consistency Tiers)
  const consistencyAnalytics = useMemo(() => {
    const safePatients = patients || [];
    const total = safePatients.length || 1;

    let consistentCount = 0; // 🟢 มาสม่ำเสมอ (เช็กอินภายใน 7 วัน หรือสมาชิกใหม่)
    let irregularCount = 0;  // 🟡 ขาดช่วง 8-30 วัน
    let dormantCount = 0;    // 🔴 ขาดเกิน 30 วัน

    for (const p of safePatients) {
      const metrics = calculateConsistencyMetrics(p);
      const days = metrics.daysSinceLastCheckIn;

      if (metrics.totalCheckIns === 0 || days < 0) {
        consistentCount++;
      } else if (days <= 7) {
        consistentCount++;
      } else if (days <= 30) {
        irregularCount++;
      } else {
        dormantCount++;
      }
    }

    return {
      consistent: {
        count: consistentCount,
        percent: Math.round((consistentCount / total) * 100),
        label: 'มาสม่ำเสมอ',
        sublabel: 'เช็กอินสม่ำเสมอ / ภายใน 7 วัน',
        color: 'text-emerald-700',
        bgPill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        barColor: 'bg-emerald-500',
        dotColor: 'bg-emerald-500'
      },
      irregular: {
        count: irregularCount,
        percent: Math.round((irregularCount / total) * 100),
        label: 'ขาดช่วง 8-30 วัน',
        sublabel: 'ขาดการเช็กอิน 8 - 30 วัน',
        color: 'text-amber-700',
        bgPill: 'bg-amber-50 text-amber-700 border-amber-200',
        barColor: 'bg-amber-500',
        dotColor: 'bg-amber-500'
      },
      dormant: {
        count: dormantCount,
        percent: Math.round((dormantCount / total) * 100),
        label: 'ขาดเกิน 30 วัน',
        sublabel: 'ขาดการติดต่อมากกว่า 30 วัน',
        color: 'text-rose-700',
        bgPill: 'bg-rose-50 text-rose-700 border-rose-200',
        barColor: 'bg-rose-500',
        dotColor: 'bg-rose-500'
      }
    };
  }, [patients]);

  // 4. Two-Column Analytics: Right Column (Treatment Modalities - Filter 0 Count)
  const treatmentModalities = useMemo(() => {
    const safePatients = patients || [];
    const total = safePatients.length || 1;

    // 1. EF Trainer
    const efCount = safePatients.filter(p => {
      if (p.assignedSleepEF && p.assignedSleepEF.enabled !== false) return true;
      if (p.efRecordLogs && p.efRecordLogs.length > 0) return true;
      if (Array.isArray(p.assignments) && p.assignments.some(a => (a.exerciseId || '').toLowerCase().includes('ef') || (a.exerciseId || '').toLowerCase().includes('slp') || (a.exerciseId || '').toLowerCase().includes('appliance'))) return true;
      if (Array.isArray(p.assignedTasks) && p.assignedTasks.some(t => String(t).toLowerCase().includes('ef'))) return true;
      if (typeof p.assignedTasks === 'string' && (p.assignedTasks as string).toLowerCase().includes('ef')) return true;
      if (p.notes && /ef|trainer|เครื่องมือ|appliance/i.test(p.notes)) return true;
      return true;
    }).length;

    // 2. OMT
    const omtCount = safePatients.filter(p => {
      if (Array.isArray(p.assignedOMT) && p.assignedOMT.length > 0) return true;
      if (Array.isArray(p.assignments) && p.assignments.some(a => (a.exerciseId || '').startsWith('OMT') || (a.exerciseId || '').toLowerCase().includes('omt'))) return true;
      if (Array.isArray(p.assignedTasks) && p.assignedTasks.some(t => String(t).startsWith('OMT') || String(t).toLowerCase().includes('omt'))) return true;
      if (typeof p.assignedTasks === 'string' && (p.assignedTasks as string).toLowerCase().includes('omt')) return true;
      return false;
    }).length;

    // 3. กายภาพ & การหายใจ
    const exerciseCount = safePatients.filter(p => {
      if (Array.isArray(p.assignedExercises) && p.assignedExercises.length > 0) return true;
      if (Array.isArray(p.assignments) && p.assignments.some(a => (a.exerciseId || '').startsWith('EX-') || (a.exerciseId || '').startsWith('BREATH'))) return true;
      if (Array.isArray(p.assignedTasks) && p.assignedTasks.some(t => String(t).startsWith('EX-') || String(t).startsWith('BREATH'))) return true;
      if (typeof p.assignedTasks === 'string' && ((p.assignedTasks as string).includes('EX-') || (p.assignedTasks as string).includes('BREATH'))) return true;
      return false;
    }).length;

    // 4. โภชนาการ GNS
    const gnsCount = safePatients.filter(p => {
      if (p.assignedGNS && p.assignedGNS.enabled) return true;
      if (Array.isArray(p.nutritionLogs) && p.nutritionLogs.length > 0) return true;
      if (Array.isArray(p.assignments) && p.assignments.some(a => (a.exerciseId || '').startsWith('GNS'))) return true;
      return false;
    }).length;

    const list = [
      {
        id: 'ef',
        name: 'อุปกรณ์ EF Trainer',
        subtitle: 'Myofunctional Appliance Therapy',
        count: efCount,
        percent: Math.round((efCount / total) * 100),
        barColor: 'bg-purple-600',
        badgeColor: 'bg-purple-50 text-purple-800 border-purple-200'
      },
      {
        id: 'omt',
        name: 'แบบฝึกกล้ามเนื้อปาก OMT',
        subtitle: 'Orofacial Myofunctional Therapy',
        count: omtCount,
        percent: Math.round((omtCount / total) * 100),
        barColor: 'bg-indigo-600',
        badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200'
      },
      {
        id: 'exercise',
        name: 'กายภาพโครงสร้าง & การหายใจ',
        subtitle: 'Postural & Nasal Breathing',
        count: exerciseCount,
        percent: Math.round((exerciseCount / total) * 100),
        barColor: 'bg-emerald-600',
        badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200'
      },
      {
        id: 'gns',
        name: 'โภชนาการเพื่อการเติบโต (GNS)',
        subtitle: 'Growth Nutrition Scoring',
        count: gnsCount,
        percent: Math.round((gnsCount / total) * 100),
        barColor: 'bg-amber-600',
        badgeColor: 'bg-amber-50 text-amber-800 border-amber-200'
      }
    ];

    // Show all pillars even if 0, to avoid empty state when patients exist
    return list;
  }, [patients]);

  // 5. Filtered & Sorted Patients for Executive Dashboard Table
  const dashFilteredPatients = useMemo(() => {
    const safePatients = Array.isArray(patients) ? patients : [];
    
    return safePatients.filter((p) => {
      if (!p) return false;
      if (p.hn?.includes('DEMO-') || p.id?.toLowerCase().includes('demo')) return false;

      // 1. Search Query Filter
      if (dashSearch.trim()) {
        const query = dashSearch.trim().toLowerCase();
        const pInfo = formatPatientDisplay(p);
        const cleanDigits = (p.phone || p.parentPhone || '').replace(/\D/g, '');
        const fullName = `${p.title || ''} ${p.firstName || (p as any).name || ''} ${p.lastName || ''} ${p.nickname || ''} ${p.hn || ''} ${p.phone || ''} ${p.parentPhone || ''} ${cleanDigits} ${p.notes || ''}`.toLowerCase();
        const matchesSearch = fullName.includes(query) || (pInfo.displayName || '').toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Operational info
      const isCheckedInToday = p.lastCheckIn === todayStr || 
        (Array.isArray(p.checkInHistory) && p.checkInHistory.some(h => (typeof h === 'string' ? h : h.date) === todayStr));
      const isDoneToday = Array.isArray(p.usageTracker) && p.usageTracker.some(u => u.date === todayStr && (u.exerciseClicks || 0) > 0);
      const metrics = calculateConsistencyMetrics(p);
      const daysSince = metrics.daysSinceLastCheckIn;

      // 2. Status Filter
      if (dashStatusFilter !== 'all') {
        if (dashStatusFilter === 'checked_today' && !isCheckedInToday) return false;
        if (dashStatusFilter === 'not_checked_today' && isCheckedInToday) return false;
        if (dashStatusFilter === 'completed_today' && !isDoneToday) return false;
        if (dashStatusFilter === 'has_assignments' && (!p.assignments || p.assignments.length === 0)) return false;
        if (dashStatusFilter === 'consistent' && (daysSince > 7 && metrics.totalCheckIns > 0)) return false;
        if (dashStatusFilter === 'irregular' && (daysSince <= 7 || daysSince > 30)) return false;
        if (dashStatusFilter === 'dormant' && daysSince <= 30) return false;
      }

      // 3. Date Filter
      if (dashDateFilter !== 'all') {
        const pDates = [
          p.lastCheckIn,
          p.startDate,
          p.createdAt,
          p.createdDate,
          ...(Array.isArray(p.checkInHistory) ? p.checkInHistory.map(h => typeof h === 'string' ? h : h.date) : [])
        ].filter(Boolean) as string[];

        if (dashDateFilter === 'today') {
          const hasToday = isCheckedInToday || p.lastCheckIn === todayStr || (p.createdAt && p.createdAt.startsWith(todayStr)) || (p.startDate === todayStr);
          if (!hasToday) return false;
        } else if (dashDateFilter === '7days') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          const cutoff = sevenDaysAgo.toISOString().split('T')[0];
          const has7Days = (daysSince >= 0 && daysSince <= 7) || pDates.some(d => d.slice(0, 10) >= cutoff);
          if (!has7Days) return false;
        } else if (dashDateFilter === 'this_month') {
          const hasThisMonth = pDates.some(d => d.slice(0, 7) === currentMonthPrefix);
          if (!hasThisMonth) return false;
        } else if (dashDateFilter === 'custom' && dashCustomDate) {
          const hasCustom = pDates.some(d => d.slice(0, 10) === dashCustomDate);
          if (!hasCustom) return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (dashSortBy === 'hn') {
        const hnA = parseInt((a.hn || '').replace(/\D/g, '')) || 0;
        const hnB = parseInt((b.hn || '').replace(/\D/g, '')) || 0;
        return hnB - hnA;
      }
      if (dashSortBy === 'name') {
        const nameA = `${a.firstName || (a as any).name || ''} ${a.lastName || ''}`.trim();
        const nameB = `${b.firstName || (b as any).name || ''} ${b.lastName || ''}`.trim();
        return nameA.localeCompare(nameB, 'th');
      }
      if (dashSortBy === 'status') {
        const isA = a.lastCheckIn === todayStr;
        const isB = b.lastCheckIn === todayStr;
        if (isA !== isB) return isA ? -1 : 1;
      }
      // 'recent' default
      const dateA = a.lastCheckIn || a.startDate || a.createdDate || a.createdAt || '';
      const dateB = b.lastCheckIn || b.startDate || b.createdDate || b.createdAt || '';
      return dateB.localeCompare(dateA);
    });
  }, [patients, dashSearch, dashStatusFilter, dashDateFilter, dashCustomDate, dashSortBy, todayStr, currentMonthPrefix]);

  const displayedDashPatients = useMemo(() => {
    if (dashRowLimit === 0) return dashFilteredPatients;
    return dashFilteredPatients.slice(0, dashRowLimit);
  }, [dashFilteredPatients, dashRowLimit]);

  const hasActiveDashFilters = dashSearch.trim() !== '' || dashStatusFilter !== 'all' || dashDateFilter !== 'all' || dashSortBy !== 'recent';

  const handleResetDashFilters = () => {
    setDashSearch('');
    setDashStatusFilter('all');
    setDashDateFilter('all');
    setDashCustomDate('');
    setDashSortBy('recent');
    setDashRowLimit(10);
  };

  // Recent Patients fallback
  const recentPatients = useMemo(() => {
    const safePatients = [...(patients || [])];
    safePatients.sort((a, b) => {
      const dateA = a.lastCheckIn || a.startDate || a.createdDate || a.createdAt || '';
      const dateB = b.lastCheckIn || b.startDate || b.createdDate || b.createdAt || '';
      return dateB.localeCompare(dateA);
    });
    return safePatients.slice(0, 3);
  }, [patients]);

  // 7-Day Trend for Two-Tone Wave Area Chart (Executive Wave Hub)
  const weeklyWaveData = useMemo(() => {
    const data: { day: string; date: string; displayDate: string; checkIns: number; completedExercises: number }[] = [];
    const today = new Date();
    const thaiDays = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
    const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = thaiDays[d.getDay()];
      const displayDate = `${d.getDate()} ${thaiMonths[d.getMonth()]}`;

      let checkInCount = 0;
      let exerciseCount = 0;

      // Scan patients for checkIns and usageTracker
      (patients || []).forEach(p => {
        if (p.lastCheckIn === dateStr) {
          checkInCount++;
        }
        if (p.checkInHistory && p.checkInHistory.some(h => (typeof h === 'string' ? h : h.date) === dateStr)) {
          checkInCount++;
        }
        const trackers = p.usageTracker || [];
        const tracker = trackers.find(t => t.date === dateStr);
        if (tracker) {
          exerciseCount += (tracker.exerciseClicks || 0);
        }
      });

      // Scan logs for completed sessions
      (logs || []).forEach(l => {
        const logDate = (l.date || '').split('T')[0];
        if (logDate === dateStr) {
          if ((l.repsCompleted || 0) > 0 || (l.score || 0) > 0) {
            exerciseCount++;
          }
        }
      });

      // Fallback for today to ensure it matches active real-time stats
      if (i === 0) {
        checkInCount = Math.max(checkInCount, stats.checkedInToday);
        exerciseCount = Math.max(exerciseCount, stats.completedToday);
      }

      data.push({
        day: dayLabel,
        date: dateStr,
        displayDate,
        checkIns: checkInCount,
        completedExercises: exerciseCount
      });
    }
    return data;
  }, [patients, logs, stats.checkedInToday, stats.completedToday]);

  const peakMetric = useMemo(() => {
    let maxVal = 0;
    let peakDay = '';
    weeklyWaveData.forEach(d => {
      const total = d.checkIns + d.completedExercises;
      if (total >= maxVal) {
        maxVal = total;
        peakDay = `${d.day} (${d.displayDate})`;
      }
    });
    return { maxVal, peakDay };
  }, [weeklyWaveData]);

  // Helper for tools badge in table
  const getPatientToolsLabel = (p: Patient) => {
    const hasOMT = (p.assignedOMT && p.assignedOMT.length > 0) || (p.assignments && p.assignments.some(a => a.exerciseId.startsWith('OMT')));
    const hasEx = (p.assignedExercises && p.assignedExercises.length > 0) || (p.assignments && p.assignments.some(a => a.exerciseId.startsWith('EX')));

    if (hasOMT && hasEx) return 'EF Trainer + OMT + กายภาพ';
    if (hasOMT) return 'EF Trainer + OMT';
    return 'อุปกรณ์ EF Trainer';
  };

  // Quick Modal Handlers
  const handleOpenAssignModal = (patientId?: string) => {
    const targetId = patientId || (patients[0] ? patients[0].id : '');
    setAssignTargetPatientId(targetId);
    const pat = patients.find(p => p.id === targetId);
    const existingIds = (pat?.assignments || []).map(a => a.exerciseId);
    setSelectedExerciseIds(existingIds);
    setIsQuickAssignOpen(true);
  };

  const handleSaveAssignments = () => {
    if (!assignTargetPatientId || !onUpdateAssignments) return;
    
    const newAssignments: HomeworkAssignment[] = selectedExerciseIds.map((exId, idx) => {
      const ex = VERIFIED_EXERCISES.find(e => e.id === exId);
      return {
        id: `asgn_${assignTargetPatientId}_${Date.now()}_${idx}`,
        patientId: assignTargetPatientId,
        exerciseId: exId,
        reps: ex?.targetReps || 10,
        durationMinutes: ex?.durationMinutes || 5,
        startDate: todayStr,
        instruction: ex?.description || 'ปฏิบัติให้ครบตามจำนวนรอบที่กำหนด',
        status: 'pending'
      };
    });

    onUpdateAssignments(assignTargetPatientId, newAssignments);
    setIsQuickAssignOpen(false);
    if (triggerFeedback) {
      triggerFeedback('อัปเดตแผนการฝึกและมอบหมายการบ้านสำเร็จ', 'success');
    }
  };

  const handleOpenFeedback = (patient: Patient) => {
    setFeedbackTargetPatient(patient);
    setFeedbackNote('');
    setFeedbackScore(10);
    setIsFeedbackModalOpen(true);
  };

  const handleSaveFeedback = () => {
    if (!feedbackTargetPatient || !onAddLog) return;
    
    const newLog: Omit<SessionLog, 'id'> = {
      patientId: feedbackTargetPatient.id,
      date: todayStr,
      exerciseId: 'CLINICAL_FEEDBACK',
      repsCompleted: 1,
      score: feedbackScore,
      notes: feedbackNote.trim() || 'แพทย์ประเมินความก้าวหน้าและการฝึกประจำวัน'
    };

    onAddLog(newLog);
    setIsFeedbackModalOpen(false);
    if (triggerFeedback) {
      triggerFeedback(`บันทึกข้อเสนอแนะสำหรับ ${feedbackTargetPatient.firstName} สำเร็จ`, 'success');
    }
  };

  const handleSaveNewPatient = () => {
    if (!newFirstName.trim() || !onAddPatient) return;

    const newPatientData: Omit<Patient, 'id'> = {
      hn: `HN-${Date.now().toString().slice(-4)}`,
      firstName: newFirstName.trim(),
      lastName: newLastName.trim(),
      nickname: newNickname.trim(),
      age: Number(newAge) || 8,
      phone: newPhone.trim(),
      weight: 0,
      height: 0,
      startDate: todayStr,
      createdDate: new Date().toISOString(),
      notes: '',
      status: 'active',
      assignedTasks: [],
      checkInHistory: []
    };

    onAddPatient(newPatientData);
    setIsAddPatientModalOpen(false);
    setNewFirstName('');
    setNewLastName('');
    setNewNickname('');
    setNewPhone('');
  };

  const availableExercises = useMemo(() => {
    if (assignCategory === 'omt') {
      const filtered = VERIFIED_EXERCISES.filter(e => e.category === 'lips' || e.category === 'tongue' || e.category === 'posture');
      return filtered.length > 0 ? filtered : VERIFIED_EXERCISES;
    }
    if (assignCategory === 'breathing') {
      const filtered = VERIFIED_EXERCISES.filter(e => e.category === 'breathing' || e.category === 'posture');
      return filtered.length > 0 ? filtered : VERIFIED_EXERCISES;
    }
    if (assignCategory === 'movement') {
      const filtered = VERIFIED_EXERCISES.filter(e => e.category === 'movement' || e.category === 'posture');
      return filtered.length > 0 ? filtered : VERIFIED_EXERCISES;
    }
    return VERIFIED_EXERCISES;
  }, [assignCategory]);

  // SVG Donut calculations for consistency ring
  const donutData = useMemo(() => {
    const radius = 54;
    const circ = 2 * Math.PI * radius; // ~339.292
    const safeTotal = stats.total || 1;

    const cRatio = consistencyAnalytics.consistent.count / safeTotal;
    const iRatio = consistencyAnalytics.irregular.count / safeTotal;
    const dRatio = consistencyAnalytics.dormant.count / safeTotal;

    const cLen = cRatio * circ;
    const iLen = iRatio * circ;
    const dLen = dRatio * circ;

    return {
      radius,
      circ,
      cLen,
      iLen,
      dLen,
      cOffset: 0,
      iOffset: -cLen,
      dOffset: -(cLen + iLen)
    };
  }, [consistencyAnalytics, stats.total]);

  // Donut rings data for the 3 individual Donut Gauges (as seen in IMG_4532.jpeg)
  const gaugeRings = useMemo(() => {
    const r = 36;
    const c = 2 * Math.PI * r;
    
    // 1. Consistency Gauge (Sky Blue)
    const pct1 = Math.min(100, Math.max(0, consistencyAnalytics.consistent.percent || 0));
    const len1 = (pct1 / 100) * c;
    
    // 2. Today Check-In Gauge (Coral Orange)
    const pct2 = Math.min(100, Math.max(0, stats.checkedInPct || 0));
    const len2 = (pct2 / 100) * c;

    // 3. Completion Gauge (Royal Purple)
    const pct3 = Math.min(100, Math.max(0, stats.completionRate || 0));
    const len3 = (pct3 / 100) * c;

    return {
      r,
      c,
      gauge1: { pct: pct1, len: len1, count: consistencyAnalytics.consistent.count },
      gauge2: { pct: pct2, len: len2, count: stats.checkedInToday },
      gauge3: { pct: pct3, len: len3, count: stats.completedToday }
    };
  }, [consistencyAnalytics, stats]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="relative w-full flex flex-col gap-4 sm:gap-6 text-left max-w-full lg:max-w-7xl mx-auto font-sans text-slate-800 box-border bg-transparent"
    >
      {/* 3D Atmospheric Fluid Glow Orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-0">
        <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-blue-300/30 blur-3xl" />
        <div className="absolute top-80 right-10 w-80 h-80 rounded-full bg-purple-300/30 blur-3xl" />
        <div className="absolute bottom-20 left-1/3 w-96 h-96 rounded-full bg-rose-200/35 blur-3xl" />
      </div>

      {/* [บล็อก 1: บนสุด] แถบแบนเนอร์ ปฏิบัติงานคลินิก (Clinical Performance) พร้อมปุ่มซิงค์ชีต, QR Code และสารบบ */}
      <div 
        className="bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-slate-300/80 p-4 sm:p-5 relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-4 w-full"
      >
        <div className="flex items-center gap-3.5 sm:gap-4 shrink-0 min-w-0">
          <Logo className="w-24 sm:w-28 h-auto shrink-0" />
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-950 tracking-tight whitespace-nowrap">
                ภาพรวมผลการปฏิบัติงานคลินิก
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs sm:text-[13px] font-extrabold bg-purple-100/90 text-purple-900 border border-purple-200/80 inline-flex items-center gap-1 shadow-2xs whitespace-nowrap shrink-0">
                <Sparkles className="w-3 h-3 text-purple-600 animate-pulse" />
                Clinical Performance
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs sm:text-[13px] font-bold bg-sky-100/80 text-sky-900 border border-sky-200/80 whitespace-nowrap shrink-0">
                📅 {formatThaiDate(todayStr)}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-800 font-medium">
              {settings?.clinicName || 'คลินิกทันตกรรมภาสุข (Growth Lab)'} • ทันตแพทย์ประจำการ: {settings?.doctorName || 'ทันตแพทย์หญิง นภาพร วรรณษา'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap xl:flex-nowrap shrink-0">
          <button
            onClick={handleSyncRemoteHomework}
            disabled={isSyncing}
            className="px-3.5 py-2.5 bg-white/80 hover:bg-white text-indigo-950 font-bold text-xs rounded-xl border border-indigo-200/90 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 whitespace-nowrap min-h-[40px]"
            title="รีเฟรชข้อมูลจาก Google Sheets"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isSyncing ? 'animate-spin text-amber-500' : ''}`} />
            <span>{isSyncing ? 'กำลังซิงค์...' : 'ซิงค์ Google Sheets'}</span>
          </button>

          <button
            onClick={() => setIsQRSelectorOpen(true)}
            className="px-3.5 py-2.5 bg-white/80 hover:bg-white text-indigo-950 font-bold text-xs rounded-xl border border-indigo-200/90 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 whitespace-nowrap min-h-[40px]"
          >
            <QrCode className="w-3.5 h-3.5 text-indigo-600" />
            <span>QR Code คนไข้</span>
          </button>

          <button
            onClick={() => onNavigate?.('ผู้รับการดูแล')}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-900 font-black text-xs rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 border border-amber-300 whitespace-nowrap min-h-[40px]"
          >
            <Users className="w-3.5 h-3.5 text-slate-900" />
            <span>สารบบคนไข้</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-900" />
          </button>
        </div>
      </div>

      {/* [บล็อก 2] แถวการ์ดสรุป 4 ใบแนวนอน: "คนไข้ทั้งหมด" | "เช็กอินวันนี้" | "ทำแบบฝึกหัดวันนี้" | "ยอดใส่อุปกรณ์" */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 w-full relative z-10">
        {/* Card 1: คนไข้ทั้งหมด */}
        <div className="rounded-2xl p-4 bg-white/80 backdrop-blur-md border border-slate-300/80 shadow-md hover:shadow-lg transition-all flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-slate-900 block leading-tight">คนไข้ทั้งหมด</span>
              <span className="text-[11px] sm:text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 inline-block mt-0.5">
                +{stats.newThisMonth} ใหม่เดือนนี้
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight leading-none">
              {stats.total}
            </div>
            <span className="text-xs font-bold text-slate-500">คน</span>
          </div>
        </div>

        {/* Card 2: เช็กอินวันนี้ */}
        <div className="rounded-2xl p-4 bg-white/80 backdrop-blur-md border border-slate-300/80 shadow-md hover:shadow-lg transition-all flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-slate-900 block leading-tight">เช็กอินวันนี้</span>
              <span className="text-[11px] sm:text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200 inline-block mt-0.5">
                {stats.checkedInPct}% อัตราเช็กอิน
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight leading-none">
              {stats.checkedInToday}
            </div>
            <span className="text-xs font-bold text-slate-500">/ {stats.total} คน</span>
          </div>
        </div>

        {/* Card 3: ทำแบบฝึกหัดวันนี้ */}
        <div className="rounded-2xl p-4 bg-white/80 backdrop-blur-md border border-slate-300/80 shadow-md hover:shadow-lg transition-all flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Flame className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-slate-900 block leading-tight">ทำแบบฝึกหัดวันนี้</span>
              <span className="text-[11px] sm:text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 inline-block mt-0.5">
                {stats.completionRate}% ส่งภารกิจ
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight leading-none">
              {stats.completedToday}
            </div>
            <span className="text-xs font-bold text-slate-500">คน</span>
          </div>
        </div>

        {/* Card 4: ยอดใส่อุปกรณ์ EF */}
        <div className="rounded-2xl p-4 bg-white/80 backdrop-blur-md border border-slate-300/80 shadow-md hover:shadow-lg transition-all flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Smile className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-slate-900 block leading-tight">ยอดใส่อุปกรณ์ EF</span>
              <span className="text-[11px] sm:text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 inline-block mt-0.5">
                {stats.efTrainerPercent}% โครงสร้างฟัน
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight leading-none">
              {stats.efTrainerCount}
            </div>
            <span className="text-xs font-bold text-slate-500">คน</span>
          </div>
        </div>
      </div>

      {/* [บล็อก 3] กราฟวงแหวน 3 ตัวชี้วัดความสม่ำเสมอ (3 Donut Gauges) ขยายกว้างเต็มบล็อก (Full Width Card) วาง 3 เกจเรียงสบายตาพร้อมตัวเลขเปอร์เซ็นต์และป้ายสรุป */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-slate-300/80 p-4 sm:p-5 sm:p-6 relative z-10 space-y-5">
        <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white shadow-2xs flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-950 leading-tight">
                3 ตัวชี้วัดความสม่ำเสมอ (3 Donut Gauges)
              </h2>
              <p className="text-xs text-slate-800 font-medium">
                สถิติเปอร์เซ็นต์แบบ 3 วงแหวนพร้อมแถบสียอดสรุป
              </p>
            </div>
          </div>
          <span className="self-start sm:self-auto text-xs font-bold text-blue-900 bg-blue-100 px-3 py-1 rounded-full border border-blue-200 shrink-0">
            รวม {stats.total} คน
          </span>
        </div>

        {/* 3 Donut Gauges Side-by-Side (Full Width Expanded) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-4 sm:gap-6 items-center">
          {/* Col 1: Sky Blue Gauge */}
          <div className="flex flex-col items-center space-y-3 p-4 rounded-2xl bg-sky-50/60 border border-sky-200/70 hover:shadow-xs transition-all">
            <div className="w-full text-center py-1 px-2 rounded-lg bg-sky-100 border border-sky-300 flex items-center justify-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-sky-600 shrink-0" />
              <span className="text-xs font-black text-sky-950 leading-tight">ความสม่ำเสมอ</span>
            </div>

            <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
              <svg className="w-full h-full transform" viewBox="0 0 110 110">
                <circle
                  cx="55"
                  cy="55"
                  r={gaugeRings.r}
                  stroke="#E0F2FE"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="55"
                  cy="55"
                  r={gaugeRings.r}
                  stroke="#0284C7"
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray={`${gaugeRings.gauge1.len} ${gaugeRings.c - gaugeRings.gauge1.len}`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  className="-rotate-90 origin-center transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl sm:text-2xl font-black text-slate-900 leading-none">
                  {gaugeRings.gauge1.pct}%
                </span>
                <span className="text-xs sm:text-xs font-bold text-sky-700 mt-1">เช็กอิน</span>
              </div>
            </div>

            <div className="w-full bg-[#0284C7] text-white font-black text-xs py-1.5 px-2 text-center rounded-xl shadow-2xs">
              วันนี้ {stats.checkedInToday} คน
            </div>
          </div>

          {/* Col 2: Coral Orange Gauge */}
          <div className="flex flex-col items-center space-y-3 p-4 rounded-2xl bg-orange-50/60 border border-orange-200/70 hover:shadow-xs transition-all">
            <div className="w-full text-center py-1 px-2 rounded-lg bg-orange-100 border border-orange-300 flex items-center justify-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#F97316] shrink-0" />
              <span className="text-xs font-black text-orange-950 leading-tight">ภารกิจสำเร็จ</span>
            </div>

            <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
              <svg className="w-full h-full transform" viewBox="0 0 110 110">
                <circle
                  cx="55"
                  cy="55"
                  r={gaugeRings.r}
                  stroke="#FFEDD5"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="55"
                  cy="55"
                  r={gaugeRings.r}
                  stroke="#F97316"
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray={`${gaugeRings.gauge2.len} ${gaugeRings.c - gaugeRings.gauge2.len}`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  className="-rotate-90 origin-center transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl sm:text-2xl font-black text-slate-900 leading-none">
                  {gaugeRings.gauge2.pct}%
                </span>
                <span className="text-xs sm:text-xs font-bold text-orange-700 mt-1">ครบถ้วน</span>
              </div>
            </div>

            <div className="w-full bg-[#F97316] text-white font-black text-xs py-1.5 px-2 text-center rounded-xl shadow-2xs">
              วันนี้ {stats.completedToday} คน
            </div>
          </div>

          {/* Col 3: Royal Purple Gauge */}
          <div className="flex flex-col items-center space-y-3 p-4 rounded-2xl bg-purple-50/60 border border-purple-200/70 hover:shadow-xs transition-all">
            <div className="w-full text-center py-1 px-2 rounded-lg bg-purple-100 border border-purple-300 flex items-center justify-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
              <span className="text-xs font-black text-purple-950 leading-tight">การบ้าน OMT</span>
            </div>

            <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
              <svg className="w-full h-full transform" viewBox="0 0 110 110">
                <circle
                  cx="55"
                  cy="55"
                  r={gaugeRings.r}
                  stroke="#F3E8FF"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="55"
                  cy="55"
                  r={gaugeRings.r}
                  stroke="#9333EA"
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray={`${gaugeRings.gauge3.len} ${gaugeRings.c - gaugeRings.gauge3.len}`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  className="-rotate-90 origin-center transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl sm:text-2xl font-black text-slate-900 leading-none">
                  {gaugeRings.gauge3.pct}%
                </span>
                <span className="text-xs sm:text-xs font-bold text-purple-700 mt-1">ส่งแล้ว</span>
              </div>
            </div>

            <div className="w-full bg-purple-600 text-white font-black text-xs py-1.5 px-2 text-center rounded-xl shadow-2xs">
              {gaugeRings.gauge3.count} ราย
            </div>
          </div>
        </div>

        {/* Bottom Footnote */}
        <div className="pt-3 text-xs text-slate-500 font-medium flex items-center justify-between border-t border-slate-200">
          <span>ข้อมูลซิงค์ตรงกับฐานข้อมูลคลินิก</span>
          <button 
            type="button"
            onClick={() => onNavigate?.('ติดตามผล')}
            className="text-blue-700 font-bold hover:text-blue-900 hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>เปิดแดชบอร์ดติดตามผล</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* [บล็อก 4] กราฟแนวโน้มภารกิจ 7 วัน และ 4 เสาหลักการรักษา (7-Day Wave & 4 Pillars of Treatment) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:p-5 w-full relative z-10 items-stretch">
        
        {/* กราฟแนวโน้มภารกิจ 7 วัน (7-Day Wave) */}
        <div className="lg:col-span-7 bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-slate-300/80 shadow-md flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-2xs flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-950 leading-tight">
                  แนวโน้มการฝึกฝน 7 วัน (7-Day Wave)
                </h3>
                <p className="text-xs text-slate-800 font-medium">
                  เช็กอินประจำวัน (ฟ้า) vs ส่งการบ้านสำเร็จ (ส้มคอรัล)
                </p>
              </div>
            </div>

            <span className="text-xs font-black text-slate-900 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-full shrink-0">
              ⭐ Peak: {peakMetric.peakDay} ({peakMetric.maxVal})
            </span>
          </div>

          {/* Recharts Area Chart */}
          <div className="w-full h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyWaveData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="waveBlueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284C7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="waveOrangeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="day" 
                  tickLine={false} 
                  axisLine={{ stroke: '#CBD5E1' }}
                  tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '2px solid #CBD5E1', 
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: 'rgba(255, 255, 255, 0.98)'
                  }}
                  formatter={(value: any, name: any) => {
                    if (name === 'checkIns') return [`${value} คน`, 'เช็กอินประจำวัน'];
                    if (name === 'completedExercises') return [`${value} ครั้ง`, 'ส่งการบ้าน/ฝึกสำเร็จ'];
                    return [value, name];
                  }}
                  labelFormatter={(label, items) => {
                    const item = items && items[0] ? items[0].payload : null;
                    return item ? `วัน${item.day} (${item.displayDate})` : `วัน: ${label}`;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="checkIns" 
                  name="checkIns"
                  stroke="#0284C7" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#waveBlueGrad)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="completedExercises" 
                  name="completedExercises"
                  stroke="#F97316" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#waveOrangeGrad)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Chart Legend */}
          <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-sky-800">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7]" />
                <span>เช็กอิน (ฟ้า)</span>
              </div>
              <div className="flex items-center gap-1.5 text-orange-700">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]" />
                <span>ส่งการบ้าน (ส้ม)</span>
              </div>
            </div>

            <span className="text-slate-400 font-medium hidden sm:inline">
              สถิติเปรียบเทียบย้อนหลัง 7 วัน
            </span>
          </div>
        </div>

        {/* 4 เสาหลักการรักษา */}
        <div className="lg:col-span-5 bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-slate-300/80 shadow-md flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-2xs flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-950 leading-tight">
                  สัดส่วน 4 เสาหลักการรักษา
                </h3>
                <p className="text-xs text-slate-800 font-medium">
                  EF Trainer, OMT บริหารปาก, สรีระ & การหายใจ, โภชนาการ GNS
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-blue-900 bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200 shrink-0">
              4 หมวดหมู่
            </span>
          </div>

          {/* Pillars Progress List */}
          <div className="space-y-3">
            {treatmentModalities.map((mod, i) => {
              const isCoral = i % 2 === 1;
              const barColor = isCoral ? 'bg-gradient-to-r from-orange-500 to-rose-500' : 'bg-gradient-to-r from-blue-600 to-sky-500';
              const textColor = isCoral ? 'text-orange-700' : 'text-blue-700';
              const badgeBg = isCoral ? 'bg-orange-100 border-orange-200' : 'bg-blue-100 border-blue-200';

              return (
                <div key={mod.id} className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1.5 hover:border-blue-300 transition-colors shadow-2xs">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-black text-slate-900 text-xs leading-tight">{mod.name}</span>
                      <span className="text-xs text-slate-400 hidden sm:inline leading-tight">({mod.subtitle})</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-black shrink-0">
                      <span className="text-slate-900 text-xs font-bold">{mod.count} คน</span>
                      <span className={`text-xs font-black px-1.5 py-0.5 rounded border ${badgeBg} ${textColor}`}>
                        {mod.percent}%
                      </span>
                    </div>
                  </div>

                  {/* Contrast Pill Bar */}
                  <div className="w-full bg-slate-200/80 rounded-full h-3 overflow-hidden flex">
                    <div 
                      className={`${barColor} h-full rounded-full transition-all duration-700 shadow-2xs flex items-center justify-end px-2 text-white text-[9px] font-black`}
                      style={{ width: `${Math.max(10, mod.percent)}%` }}
                    >
                      {mod.percent}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 text-xs text-slate-500 font-medium flex items-center justify-between border-t border-slate-200">
            <span>สถิติเฉพาะคนไข้ที่ได้รับการมอบหมายจริง</span>
            <button 
              type="button"
              onClick={() => handleOpenAssignModal()}
              className="text-blue-700 font-black hover:text-blue-900 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>+ มอบหมายการบ้าน</span>
            </button>
          </div>
        </div>

      </div>

      {/* [บล็อก 5] ตารางคนไข้ล่าสุด & ค้นหากรองข้อมูล (Dashboard Patient Registry & Filter Hub) */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-300/80 shadow-md overflow-hidden relative z-10">
        <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 border border-amber-200 shadow-2xs flex items-center justify-center text-slate-900 font-black shrink-0">
                <span className="text-xs font-black">TOP</span>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-950 flex items-center gap-2 leading-tight">
                  <span>รายชื่อคนไข้และสถานะปัจจุบัน</span>
                  <span className="text-xs sm:text-[13px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                    พบ {dashFilteredPatients.length} คน
                  </span>
                </h3>
                <p className="text-xs text-slate-800 font-medium">
                  ค้นหา กรองสถานะ และช่วงเวลาเพื่อติดตามการดูแลประจำวัน (ไม่กระทบข้อมูลประวัติใน Google Sheets)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenAssignModal()}
                className="text-xs font-black text-purple-800 bg-purple-50 hover:bg-purple-100 px-3 py-2 rounded-xl border border-purple-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>มอบหมายการบ้าน</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate?.('ผู้รับการดูแล')}
                className="text-xs font-black text-blue-800 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl border border-blue-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>ดูสารบบเวชระเบียนทั้งหมด ({patients.length} คน)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={dashSearch}
                onChange={(e) => setDashSearch(e.target.value)}
                placeholder="ค้นหาชื่อ, นามสกุล, ชื่อเล่น, HN หรือเบอร์โทร..."
                className="w-full pl-10 pr-9 py-2 bg-slate-50/90 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              {dashSearch && (
                <button
                  type="button"
                  onClick={() => setDashSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer text-xs"
                  title="ล้างคำค้นหา"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Controls Row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
                <Filter className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="text-xs sm:text-[13px] font-bold text-slate-500 whitespace-nowrap">สถานะ:</span>
                <select
                  value={dashStatusFilter}
                  onChange={(e) => setDashStatusFilter(e.target.value as any)}
                  className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer pr-1"
                >
                  <option value="all">ทั้งหมด ({patients.length})</option>
                  <option value="checked_today">🟢 เช็กอินแล้ววันนี้</option>
                  <option value="not_checked_today">⏳ ยังไม่เช็กอินวันนี้</option>
                  <option value="completed_today">🎯 ทำแบบฝึกหัดวันนี้แล้ว</option>
                  <option value="has_assignments">📝 มีการบ้านที่มอบหมาย</option>
                  <option value="consistent">✅ สม่ำเสมอ (≤7 วัน)</option>
                  <option value="irregular">⚠️ ขาดช่วง (8-30 วัน)</option>
                  <option value="dormant">🔴 ขาดเกิน 30 วัน</option>
                </select>
              </div>

              {/* Date Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="text-xs sm:text-[13px] font-bold text-slate-500 whitespace-nowrap">วันที่:</span>
                <select
                  value={dashDateFilter}
                  onChange={(e) => setDashDateFilter(e.target.value as any)}
                  className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer pr-1"
                >
                  <option value="all">ทุกช่วงเวลา</option>
                  <option value="today">📅 วันนี้ ({todayStr})</option>
                  <option value="7days">📅 7 วันล่าสุด</option>
                  <option value="this_month">📅 เดือนนี้ ({currentMonthPrefix})</option>
                  <option value="custom">📅 กำหนดวันที่เอง...</option>
                </select>
              </div>

              {/* Custom Date Input if custom selected */}
              {dashDateFilter === 'custom' && (
                <div className="flex items-center gap-1 bg-white border border-indigo-200 rounded-xl px-2 py-1 shadow-2xs animate-in fade-in">
                  <input
                    type="date"
                    value={dashCustomDate}
                    onChange={(e) => setDashCustomDate(e.target.value)}
                    className="text-xs font-bold text-slate-800 outline-none bg-transparent cursor-pointer"
                  />
                </div>
              )}

              {/* Sort By */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
                <span className="text-xs sm:text-[13px] font-bold text-slate-500 whitespace-nowrap">จัดเรียง:</span>
                <select
                  value={dashSortBy}
                  onChange={(e) => setDashSortBy(e.target.value as any)}
                  className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer pr-1"
                >
                  <option value="recent">ล่าสุด</option>
                  <option value="hn">รหัส HN</option>
                  <option value="name">ชื่อ (ก-ฮ)</option>
                  <option value="status">สถานะเช็กอิน</option>
                </select>
              </div>

              {/* Row Limit */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 shadow-2xs">
                <select
                  value={dashRowLimit}
                  onChange={(e) => setDashRowLimit(Number(e.target.value))}
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer pr-1"
                  title="จำนวนแถวที่แสดง"
                >
                  <option value={5}>แสดง 5 แถว</option>
                  <option value={10}>แสดง 10 แถว</option>
                  <option value={25}>แสดง 25 แถว</option>
                  <option value={0}>แสดงทั้งหมด</option>
                </select>
              </div>

              {/* Reset Button */}
              {hasActiveDashFilters && (
                <button
                  type="button"
                  onClick={handleResetDashFilters}
                  className="text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0"
                  title="ล้างการค้นหาและตัวกรองทั้งหมด"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>ล้างตัวกรอง</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Filter Badges Bar */}
          {hasActiveDashFilters && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-xs sm:text-[13px] font-bold text-slate-400">กำลังกรอง:</span>
              {dashSearch && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 font-bold border border-indigo-200 text-xs sm:text-[13px]">
                  <span>ค้นหา: "{dashSearch}"</span>
                  <button type="button" onClick={() => setDashSearch('')} className="hover:text-indigo-950 p-0.5">✕</button>
                </span>
              )}
              {dashStatusFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 text-xs sm:text-[13px]">
                  <span>
                    สถานะ: {
                      dashStatusFilter === 'checked_today' ? 'เช็กอินแล้ววันนี้' :
                      dashStatusFilter === 'not_checked_today' ? 'ยังไม่เช็กอินวันนี้' :
                      dashStatusFilter === 'completed_today' ? 'ทำแบบฝึกหัดแล้ว' :
                      dashStatusFilter === 'has_assignments' ? 'มีภารกิจ' :
                      dashStatusFilter === 'consistent' ? 'สม่ำเสมอ' :
                      dashStatusFilter === 'irregular' ? 'ขาดช่วง' : 'ขาดเกิน 30 วัน'
                    }
                  </span>
                  <button type="button" onClick={() => setDashStatusFilter('all')} className="hover:text-emerald-950 p-0.5">✕</button>
                </span>
              )}
              {dashDateFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 font-bold border border-blue-200 text-xs sm:text-[13px]">
                  <span>
                    วันที่: {
                      dashDateFilter === 'today' ? `วันนี้ (${todayStr})` :
                      dashDateFilter === '7days' ? '7 วันล่าสุด' :
                      dashDateFilter === 'this_month' ? 'เดือนนี้' : (dashCustomDate || 'กำหนดเอง')
                    }
                  </span>
                  <button type="button" onClick={() => { setDashDateFilter('all'); setDashCustomDate(''); }} className="hover:text-blue-950 p-0.5">✕</button>
                </span>
              )}
              <span className="text-xs sm:text-[13px] font-bold text-slate-500 ml-auto">
                แสดง {displayedDashPatients.length} จาก {dashFilteredPatients.length} คน (ทั้งหมด {patients.length} คน)
              </span>
            </div>
          )}
        </div>

        {/* Full-Width Responsive Table with Complete Columns */}
        <div className="overflow-x-auto w-full max-w-full custom-scrollbar p-3 sm:p-6 pt-3">
          {displayedDashPatients.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">ไม่พบข้อมูลคนไข้ที่ตรงกับเงื่อนไขการค้นหา</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                ลองตรวจสอบคำสะกด ปรับเปลี่ยนตัวกรองสถานะ/ช่วงวันที่ หรือกดปุ่มล้างตัวกรองเพื่อแสดงคนไข้ทั้งหมด
              </p>
              {hasActiveDashFilters && (
                <button
                  type="button"
                  onClick={handleResetDashFilters}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>ล้างตัวกรองทั้งหมด</span>
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white font-black text-xs uppercase tracking-wider rounded-xl overflow-hidden shadow-2xs">
                  <th className="py-3 px-3.5 rounded-l-xl">อันดับ</th>
                  <th className="py-3 px-3.5">ชื่อคนไข้ & รหัส HN</th>
                  <th className="py-3 px-3.5">เครื่องมือ / อุปกรณ์</th>
                  <th className="py-3 px-3.5">สถานะวันนี้</th>
                  <th className="py-3 px-3.5">การบ้าน / มอบหมาย</th>
                  <th className="py-3 px-3.5">สถิติ & ประเมิน</th>
                  <th className="py-3 px-3.5 rounded-r-xl text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedDashPatients.map((p, idx) => {
                const info = formatPatientDisplay(p);
                const cleanNick = (info.formattedNickname || '').replace(/[()]/g, '').trim();
                const toolsLabel = getPatientToolsLabel(p);
                const isEven = idx % 2 === 0;
                const assignmentCount = (p.assignments || []).length;
                return (
                  <tr 
                    key={p.id || idx}
                    className={`hover:bg-blue-50/70 transition-colors ${isEven ? 'bg-sky-50/40' : 'bg-white'}`}
                  >
                    <td className="py-3 px-3.5 font-black text-slate-700 text-xs">
                      #{idx + 1}
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="space-y-0.5">
                        <span className="font-black text-slate-900 block text-xs sm:text-sm leading-tight max-w-[200px]">
                          {info.displayName} {cleanNick ? `(${cleanNick})` : ''}
                        </span>
                        <span className="font-mono text-xs font-bold text-sky-800 bg-sky-100 px-1.5 py-0.5 rounded border border-sky-200 inline-block">
                          HN: {p.hn || p.id} • {info.ageDisplayText}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3.5">
                      <span className="text-xs sm:text-[13px] font-bold text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-200 inline-block shadow-2xs">
                        {toolsLabel}
                      </span>
                    </td>
                    <td className="py-3 px-3.5">
                      {p.lastCheckIn === todayStr ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          เช็กอินแล้ว
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          <Clock className="w-3 h-3 text-slate-400" />
                          รอเช็กอิน
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3.5">
                      <button
                        type="button"
                        onClick={() => handleOpenAssignModal(p.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 cursor-pointer transition-all"
                        title="คลิกเพื่อมอบหมายการบ้านคนไข้คนนี้"
                      >
                        <BookOpen className="w-3 h-3 text-purple-600" />
                        <span>{assignmentCount > 0 ? `${assignmentCount} ภารกิจ` : 'มอบหมาย'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-3.5">
                      <button
                        type="button"
                        onClick={() => handleOpenFeedback(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 cursor-pointer transition-all"
                        title="ให้ข้อเสนอแนะและประเมินผล"
                      >
                        <Award className="w-3 h-3 text-amber-600" />
                        <span>ประเมิน</span>
                      </button>
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedQRModalPatient(p)}
                          className="p-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-600 hover:text-white transition-all border border-sky-200 cursor-pointer"
                          title="ดู QR Code คนไข้"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectPatient) onSelectPatient(p.id, true);
                            if (onNavigate) onNavigate('ผู้รับการดูแล', p.id);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all font-black text-xs sm:text-[13px] shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                          title="เปิดดูแฟ้มประวัติคนไข้"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>เปิดแฟ้ม</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          )}
        </div>
      </div>



      {/* MODAL: QR Code Viewer for Selected Patient */}
      <PatientQRModal
        patient={selectedQRModalPatient}
        isOpen={Boolean(selectedQRModalPatient)}
        onClose={() => setSelectedQRModalPatient(null)}
        clinicName={settings?.clinicName}
      />

      {/* MODAL: Quick QR Code Selector */}
      <AnimatePresence>
        {isQRSelectorOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-6 rounded-3xl max-w-lg w-full text-left space-y-4 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col text-slate-800"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">เลือกคนไข้เพื่อเปิด QR Code</h3>
                    <p className="text-xs sm:text-[13px] text-slate-500">สำหรับสแกนเข้าใช้งานหรือพิมพ์เป็นการ์ดประจำตัว</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsQRSelectorOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto space-y-2 flex-1 pr-1">
                {patients.map(p => {
                  const info = formatPatientDisplay(p);
                  const cleanPhone = cleanPhoneString(p.phone || p.parentPhone);
                  return (
                    <div 
                      key={p.id}
                      onClick={() => {
                        setSelectedQRModalPatient(p);
                        setIsQRSelectorOpen(false);
                      }}
                      className="p-3 rounded-2xl border border-slate-200 hover:border-purple-300 bg-slate-50 hover:bg-purple-50/50 transition-all flex items-center justify-between cursor-pointer group"
                    >
                      <div>
                        <div className="text-xs font-black text-slate-900 group-hover:text-purple-700 flex items-center gap-1.5 flex-wrap">
                          <span>{info.displayName}</span>
                          {info.formattedNickname && (
                            <span className="text-purple-600 font-bold text-xs">{info.formattedNickname}</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 font-mono font-bold mt-0.5">
                          HN: {p.hn || p.id} • {info.ageDisplayText} {cleanPhone ? `• 📞 ${cleanPhone}` : ''}
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-white group-hover:bg-purple-600 group-hover:text-white text-purple-700 font-bold text-xs rounded-xl border border-purple-200 transition-colors flex items-center gap-1 shadow-2xs">
                        <QrCode className="w-3.5 h-3.5" />
                        <span>เปิด QR</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Quick Assign Homework */}
      <AnimatePresence>
        {isQuickAssignOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-6 rounded-3xl max-w-2xl w-full text-left space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col text-slate-800"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">มอบหมายแผนการฝึก / การบ้าน</h3>
                    <p className="text-xs sm:text-[13px] text-slate-500">เลือกคนไข้และเลือกแบบฝึกหัดที่ต้องการมอบหมาย</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsQuickAssignOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Patient Selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">เลือกคนไข้ผู้รับมอบหมาย:</label>
                <select
                  value={assignTargetPatientId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setAssignTargetPatientId(nextId);
                    const pat = patients.find(p => p.id === nextId);
                    setSelectedExerciseIds((pat?.assignments || []).map(a => a.exerciseId));
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  {patients.map(p => {
                    const info = formatPatientDisplay(p);
                    return (
                      <option key={p.id} value={p.id} className="bg-white text-slate-900">
                        {info.displayName} {info.formattedNickname ? `${info.formattedNickname} ` : ''}- HN: {p.hn || p.id} ({info.ageDisplayText})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Category Selector Tabs */}
              <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pb-2">
                {[
                  { key: 'omt', label: 'OMT ปาก-ลิ้น-กลืน' },
                  { key: 'breathing', label: 'กายภาพการหายใจ' },
                  { key: 'sleep', label: 'การนอน & EF Appliance' },
                  { key: 'movement', label: 'กายภาพกระดูก & ออกกำลัง' },
                  { key: 'nutrition', label: 'โภชนาการ GNS' },
                ].map(cat => (
                  <button
                    key={cat.key}
                    onClick={() => setAssignCategory(cat.key as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      assignCategory === cat.key
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Exercises List Selection */}
              <div className="overflow-y-auto space-y-2 flex-1 pr-1 max-h-[40vh]">
                {availableExercises.map(ex => {
                  const isChecked = selectedExerciseIds.includes(ex.id);
                  return (
                    <div
                      key={ex.id}
                      onClick={() => {
                        if (isChecked) {
                          setSelectedExerciseIds(prev => prev.filter(id => id !== ex.id));
                        } else {
                          setSelectedExerciseIds(prev => [...prev, ex.id]);
                        }
                      }}
                      className={`p-3 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                        isChecked 
                          ? 'bg-purple-50 border-purple-300 ring-1 ring-purple-400' 
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="mt-0.5 text-purple-600">
                        {isChecked ? (
                          <CheckSquare className="w-5 h-5 text-purple-600" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-black text-slate-900 flex items-center justify-between">
                          <span>{ex.title}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100/70 text-purple-800 border border-purple-200 font-bold">
                            {ex.targetReps} รอบ / {ex.durationMinutes || 5} นาที
                          </span>
                        </div>
                        <p className="text-xs sm:text-[13px] text-slate-500 line-clamp-2 mt-0.5">
                          {ex.purpose || ex.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-500">
                  เลือกแล้ว: <strong className="text-purple-600">{selectedExerciseIds.length}</strong> ท่า
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsQuickAssignOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleSaveAssignments}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>บันทึกการมอบหมาย</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
