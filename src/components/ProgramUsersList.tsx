import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Plus, 
  UserPlus, 
  Users, 
  ChevronRight, 
  ArrowUpDown, 
  Clock, 
  Calendar, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Sparkles,
  Phone,
  UserCheck,
  Building2,
  Activity
} from 'lucide-react';
import { Patient } from '../types';
import { calculateConsistencyMetrics, hasCheckedInToday } from '../utils/checkInCalculations';
import { useScrollLock } from '../utils';
import { Logo } from './Logo';

interface ProgramUsersListProps {
  patients: Patient[];
  onSelectPatient: (patientId: string) => void;
  onAddPatient: (patient: Omit<Patient, 'id'>) => void;
  onEditPatient: (patient: Patient) => void;
  onDeletePatient: (patientId: string) => void;
  onNavigate?: (tab: string) => void;
}

export default function ProgramUsersList({
  patients,
  onSelectPatient,
  onAddPatient,
  onEditPatient,
  onDeletePatient,
}: ProgramUsersListProps) {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'on-hold'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'hn' | 'lastActive' | 'age'>('lastActive');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  useScrollLock(showAddModal || showEditModal);

  const addModalScrollRef = useRef<HTMLDivElement>(null);
  const editModalScrollRef = useRef<HTMLDivElement>(null);

  // Reset scroll position to top when Add/Edit Modal opens on iPad / tablet
  useEffect(() => {
    if (showAddModal) {
      if (addModalScrollRef.current) addModalScrollRef.current.scrollTop = 0;
      const timer = setTimeout(() => {
        if (addModalScrollRef.current) addModalScrollRef.current.scrollTop = 0;
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [showAddModal]);

  useEffect(() => {
    if (showEditModal) {
      if (editModalScrollRef.current) editModalScrollRef.current.scrollTop = 0;
      const timer = setTimeout(() => {
        if (editModalScrollRef.current) editModalScrollRef.current.scrollTop = 0;
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [showEditModal]);

  // Form State
  const [patientForm, setPatientForm] = useState<{
    hn: string;
    firstName: string;
    lastName: string;
    nickname: string;
    age: number;
    gender: 'ชาย' | 'หญิง' | 'อื่นๆ';
    weight: string;
    height: string;
    startDate: string;
    phone: string;
    notes: string;
    status: 'active' | 'completed' | 'on-hold';
    doctor: string;
    program: string;
  }>({
    hn: '',
    firstName: '',
    lastName: '',
    nickname: '',
    age: 7,
    gender: 'ชาย',
    weight: '',
    height: '',
    startDate: new Date().toISOString().split('T')[0],
    phone: '',
    notes: '',
    status: 'active',
    doctor: 'ทันตแพทย์หญิง นภาพร วรรณษา',
    program: 'Growth Lab (พัฒนาการสมวัย)',
  });

  const resetForm = () => {
    setPatientForm({
      hn: `HN-${Math.floor(10000 + Math.random() * 90000)}`,
      firstName: '',
      lastName: '',
      nickname: '',
      age: 7,
      gender: 'ชาย',
      weight: '',
      height: '',
      startDate: new Date().toISOString().split('T')[0],
      phone: '',
      notes: '',
      status: 'active',
      doctor: 'ทันตแพทย์หญิง นภาพร วรรณษา',
      program: 'Growth Lab (พัฒนาการสมวัย)',
    });
  };

  const handleOpenAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEditModal = (p: Patient, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPatient(p);
    const genderMatch = p.notes?.match(/\[เพศ:\s*(.*?)\]/);
    const genderVal = (genderMatch ? genderMatch[1] : 'ชาย') as 'ชาย' | 'หญิง' | 'อื่นๆ';
    const cleanNotes = p.notes?.replace(/\[เพศ:\s*.*?\]\s*/g, '').trim() || '';

    setPatientForm({
      hn: p.hn,
      firstName: p.firstName,
      lastName: p.lastName,
      nickname: p.nickname || '',
      age: p.age,
      gender: genderVal,
      weight: p.weight !== undefined && p.weight !== null && p.weight > 0 ? String(p.weight) : '',
      height: p.height !== undefined && p.height !== null && p.height > 0 ? String(p.height) : '',
      startDate: p.startDate,
      phone: p.parentPhone || '',
      notes: cleanNotes,
      status: p.status,
      doctor: 'ทันตแพทย์หญิง นภาพร วรรณษา',
      program: 'Growth Lab (พัฒนาการสมวัย)',
    });
    setShowEditModal(true);
  };

  const submitAddPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientForm.firstName.trim() || !patientForm.hn.trim()) {
      alert('กรุณากรอกชื่อและ HN ให้ครบถ้วน');
      return;
    }

    const formattedNotes = `[เพศ: ${patientForm.gender}] ${patientForm.notes}`.trim();
    const parsedWeight = parseFloat(String(patientForm.weight).trim());
    const parsedHeight = parseFloat(String(patientForm.height).trim());

    onAddPatient({
      hn: patientForm.hn.trim(),
      firstName: patientForm.firstName.trim(),
      lastName: patientForm.lastName.trim(),
      nickname: patientForm.nickname.trim(),
      age: Number(patientForm.age) || 7,
      weight: isNaN(parsedWeight) ? 0 : parsedWeight,
      height: isNaN(parsedHeight) ? 0 : parsedHeight,
      startDate: patientForm.startDate,
      phone: patientForm.phone.trim() || '080-000-0000',
      parentPhone: patientForm.phone.trim(),
      notes: formattedNotes,
      status: patientForm.status || 'active',
      assignedTasks: [],
      checkInHistory: [],
    });

    setShowAddModal(false);
    resetForm();
  };

  const submitEditPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;

    const formattedNotes = `[เพศ: ${patientForm.gender}] ${patientForm.notes}`.trim();
    const parsedWeight = parseFloat(String(patientForm.weight).trim());
    const parsedHeight = parseFloat(String(patientForm.height).trim());

    onEditPatient({
      ...editingPatient,
      hn: patientForm.hn.trim(),
      firstName: patientForm.firstName.trim(),
      lastName: patientForm.lastName.trim(),
      nickname: patientForm.nickname.trim(),
      age: Number(patientForm.age) || 7,
      weight: isNaN(parsedWeight) ? 0 : parsedWeight,
      height: isNaN(parsedHeight) ? 0 : parsedHeight,
      startDate: patientForm.startDate,
      parentPhone: patientForm.phone.trim(),
      notes: formattedNotes,
      status: patientForm.status,
    });

    setShowEditModal(false);
    setEditingPatient(null);
  };

  // Helper to extract last active text
  const getLastActiveText = (p: Patient) => {
    if (!p.checkInHistory || p.checkInHistory.length === 0) {
      return 'ยังไม่เคยเช็คอิน';
    }
    const last = p.checkInHistory[0]; // first item is newest
    if (!last.date) return 'ยังไม่เคยเช็คอิน';

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (last.date === todayStr) {
      return `วันนี้ (${last.timestamp?.split('T')[1]?.slice(0, 5) || 'เช็คอินแล้ว'})`;
    }
    if (last.date === yesterdayStr) {
      return 'เมื่อวาน';
    }

    try {
      const d = new Date(last.date);
      return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
    } catch {
      return last.date;
    }
  };

  // Filter & Sort
  const safePatients = Array.isArray(patients) ? patients : [];

  const filteredAndSortedPatients = safePatients
    .filter((p) => {
      if (!p) return false;
      const search = (searchTerm || '').toLowerCase();
      const fn = p.firstName || (p as any).name || '';
      const ln = p.lastName || '';
      const nn = p.nickname || '';
      const hn = p.hn || '';
      const phone = p.parentPhone || p.phone || '';
      const matchSearch =
        fn.toLowerCase().includes(search) ||
        ln.toLowerCase().includes(search) ||
        nn.toLowerCase().includes(search) ||
        hn.toLowerCase().includes(search) ||
        phone.includes(search);
      const matchStatus = statusFilter === 'all' || (p.status || 'active') === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (!a && !b) return 0;
      if (!a) return 1;
      if (!b) return -1;
      let valA: any = a.firstName || (a as any).name || '';
      let valB: any = b.firstName || (b as any).name || '';

      if (sortBy === 'hn') {
        valA = a.hn || '';
        valB = b.hn || '';
      } else if (sortBy === 'age') {
        valA = a.age || 0;
        valB = b.age || 0;
      } else if (sortBy === 'lastActive') {
        const lastA = a.checkInHistory?.[0]?.timestamp || a.startDate || '';
        const lastB = b.checkInHistory?.[0]?.timestamp || b.startDate || '';
        valA = lastA;
        valB = lastB;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const activeCount = safePatients.filter((p) => (p?.status || 'active') === 'active').length;
  const completedCount = safePatients.filter((p) => p?.status === 'completed').length;
  const onHoldCount = safePatients.filter((p) => p?.status === 'on-hold').length;

  return (
    <div className="space-y-4 sm:space-y-6 text-left w-full max-w-full lg:max-w-7xl mx-auto pb-12 overflow-x-hidden box-border">
      {/* 1. TOP HEADER & METRIC SUMMARY */}
      <section className="bg-white p-6 sm:p-8 rounded-3xl border border-purple-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <Logo className="w-28 sm:w-32 h-auto" />
              <span className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-800 px-3 py-0.5 rounded-full text-xs font-black tracking-wide border border-purple-200 shrink-0">
                <Users className="w-3.5 h-3.5 text-purple-600" />
                Program Directory • การดูแล
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#252536] leading-tight">
              การดูแลทั้งหมด
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
              ตารางรายชื่อการดูแล Growth Lab ทั้งหมด • คลิกที่แถวเพื่อเปิดเข้าสู่ Workspace แฟ้มข้อมูลรายบุคคล
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleOpenAddModal}
              className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ เพิ่มการดูแลใหม่</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-50 border border-purple-100 text-purple-900 text-xs font-bold">
            <Users className="w-3.5 h-3.5 text-purple-600" />
            <span>ทั้งหมด {patients.length} รายการ</span>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-900 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>กำลังฝึก {activeCount} รายการ</span>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-900 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>สำเร็จแล้ว {completedCount} คน</span>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>พักแผน {onHoldCount} คน</span>
          </div>
        </div>
      </section>

      {/* 2. SEARCH & FILTER TOOLBAR */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-purple-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, นามสกุล, ชื่อเล่น, HN, หรือเบอร์โทรศัพท์..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-purple-500 focus:bg-white outline-none font-medium transition-all"
            />
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 overflow-x-auto">
            {[
              { id: 'all', label: 'ทั้งหมด' },
              { id: 'active', label: 'กำลังฝึก' },
              { id: 'completed', label: 'สำเร็จ' },
              { id: 'on-hold', label: 'พักแผน' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === tab.id
                    ? 'bg-white text-purple-700 shadow-2xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort Select */}
          <div className="flex items-center gap-2 shrink-0">
            <label className="text-xs font-bold text-slate-500 hidden md:inline">เรียงตาม:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl outline-none cursor-pointer focus:border-purple-500"
            >
              <option value="lastActive">เข้าใช้งานล่าสุด</option>
              <option value="name">ชื่อการดูแล</option>
              <option value="hn">รหัส HN</option>
              <option value="age">อายุ</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 cursor-pointer"
              title={sortOrder === 'asc' ? 'เรียงจากน้อยไปมาก' : 'เรียงจากมากไปน้อย'}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. SPREADSHEET-STYLE PROGRAM USERS TABLE */}
      <div className="bg-white rounded-3xl border border-purple-200/80 shadow-2xs overflow-hidden">
        {filteredAndSortedPatients.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto text-purple-600">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-800">ไม่พบรายชื่อการดูแล</h3>
            <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
              ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะ หรือกดปุ่ม "เพิ่มการดูแลใหม่" เพื่อลงทะเบียน
            </p>
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มการดูแล</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-purple-50/70 border-b border-purple-100 text-[11px] font-black uppercase tracking-wider text-purple-950">
                  <th className="py-3.5 px-4 sm:px-6">การดูแล</th>
                  <th className="py-3.5 px-3">HN</th>
                  <th className="py-3.5 px-3">อายุ / เพศ</th>
                  <th className="py-3.5 px-3">โปรแกรม</th>
                  <th className="py-3.5 px-3">ผู้รับผิดชอบ</th>
                  <th className="py-3.5 px-3">เข้าใช้งานล่าสุด</th>
                  <th className="py-3.5 px-3">สถานะ</th>
                  <th className="py-3.5 px-4 text-right">Workspace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredAndSortedPatients.map((p) => {
                  const gender = p.notes?.match(/\[เพศ:\s*(.*?)\]/)?.[1] || 'ชาย';
                  const lastActive = getLastActiveText(p);
                  const isCheckedToday = hasCheckedInToday(p);
                  const consistency = calculateConsistencyMetrics(p);
                  const statusDotColor = isCheckedToday
                    ? 'bg-emerald-500 ring-2 ring-emerald-200 animate-pulse'
                    : consistency.status === 'ACTIVE'
                    ? 'bg-emerald-500'
                    : consistency.status === 'AT RISK'
                    ? 'bg-amber-500'
                    : consistency.status === 'DORMANT'
                    ? 'bg-orange-500'
                    : 'bg-rose-500';

                  return (
                    <tr
                      key={p.id}
                      onClick={() => onSelectPatient(p.id)}
                      className="hover:bg-purple-50/50 cursor-pointer transition-colors group"
                    >
                      {/* 1. Name & Avatar */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-700 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                              {p.nickname?.slice(0, 2) || p.firstName.slice(0, 2)}
                            </div>
                            <span 
                              className={`w-2.5 h-2.5 rounded-full absolute -top-0.5 -right-0.5 border-2 border-white ${statusDotColor}`} 
                              title={`สถานะความสม่ำเสมอ: ${consistency.status}${isCheckedToday ? ' (เช็คอินวันนี้แล้ว)' : ''}`}
                            />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-purple-700 transition-colors flex items-center gap-1.5">
                              <span>{p.firstName} {p.lastName}</span>
                              {p.nickname && (
                                <span className="text-[11px] font-medium text-slate-500">
                                  ({p.nickname})
                                </span>
                              )}
                            </div>
                            {p.parentPhone && (
                              <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Phone className="w-2.5 h-2.5" />
                                <span>{p.parentPhone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. HN */}
                      <td className="py-3.5 px-3">
                        <span className="font-mono font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 text-[11px]">
                          {p.hn}
                        </span>
                      </td>

                      {/* 3. Age / Gender */}
                      <td className="py-3.5 px-3">
                        <div className="text-slate-700 font-semibold">
                          {p.age} ปี <span className="text-slate-400 font-normal">({gender})</span>
                        </div>
                      </td>

                      {/* 4. Program */}
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1 font-bold text-slate-800 text-[11px]">
                          Growth Lab
                        </span>
                      </td>

                      {/* 5. Doctor */}
                      <td className="py-3.5 px-3">
                        <div className="text-slate-600 font-medium text-[11px]">
                          ทันตแพทย์หญิง นภาพร วรรณษา
                        </div>
                      </td>

                      {/* 6. Last Active */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isCheckedToday
                                ? 'bg-emerald-500 animate-pulse'
                                : 'bg-slate-300'
                            }`}
                          />
                          <span className={`font-medium ${isCheckedToday ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                            {lastActive}
                          </span>
                        </div>
                      </td>

                      {/* 7. Status */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            p.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : p.status === 'completed'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {p.status === 'active' ? 'กำลังฝึก' : p.status === 'completed' ? 'สำเร็จ' : 'พักแผน'}
                        </span>
                      </td>

                      {/* 8. Action */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={(e) => handleOpenEditModal(p, e)}
                            className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                            title="แก้ไขข้อมูลการดูแล"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onSelectPatient(p.id)}
                            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white font-bold text-xs rounded-xl border border-purple-200 hover:border-purple-600 transition-all flex items-center gap-1 shadow-2xs group-hover:bg-purple-600 group-hover:text-white cursor-pointer"
                          >
                            <span>เปิด Workspace</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. MODAL: ADD PATIENT */}
      <AnimatePresence>
        {showAddModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto prevent-pull-refresh"
            style={{ overscrollBehaviorY: 'contain' }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl border border-purple-200 shadow-2xl max-w-lg w-full text-left max-h-[85vh] flex flex-col my-auto overflow-hidden relative z-10"
              style={{ maxHeight: '85vh' }}
            >
              {/* Sticky Top Header */}
              <div className="sticky top-0 bg-white p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between shrink-0 z-10 shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 truncate">เพิ่มการดูแลใหม่</h2>
                    <p className="text-xs text-slate-500 truncate">ลงทะเบียนเพื่อสร้าง Workspace และคิวอาร์โค้ด</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-sm cursor-pointer shrink-0"
                  aria-label="ปิดหน้าต่าง"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={submitAddPatient} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                {/* Scrollable Body with iOS touch momentum */}
                <div 
                  ref={addModalScrollRef}
                  className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50/40 prevent-pull-refresh"
                  style={{ 
                    WebkitOverflowScrolling: 'touch',
                    overscrollBehaviorY: 'contain'
                  }}
                >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">รหัส HN *</label>
                    <input
                      type="text"
                      required
                      value={patientForm.hn}
                      onChange={(e) => setPatientForm({ ...patientForm, hn: e.target.value })}
                      placeholder="เช่น HN-10001"
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-purple-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">ชื่อเล่น</label>
                    <input
                      type="text"
                      value={patientForm.nickname}
                      onChange={(e) => setPatientForm({ ...patientForm, nickname: e.target.value })}
                      placeholder="เช่น น้องมะพร้าว"
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">ชื่อจริง *</label>
                    <input
                      type="text"
                      required
                      value={patientForm.firstName}
                      onChange={(e) => setPatientForm({ ...patientForm, firstName: e.target.value })}
                      placeholder="เช่น อารยา"
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">นามสกุล</label>
                    <input
                      type="text"
                      value={patientForm.lastName}
                      onChange={(e) => setPatientForm({ ...patientForm, lastName: e.target.value })}
                      placeholder="เช่น ใจดี"
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">อายุ (ปี)</label>
                    <input
                      type="number"
                      min="1"
                      max="25"
                      value={patientForm.age}
                      onChange={(e) => setPatientForm({ ...patientForm, age: Number(e.target.value) })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">เพศ</label>
                    <select
                      value={patientForm.gender}
                      onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value as any })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium cursor-pointer"
                    >
                      <option value="ชาย">ชาย</option>
                      <option value="หญิง">หญิง</option>
                      <option value="อื่นๆ">อื่นๆ</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">สถานะ</label>
                    <select
                      value={patientForm.status}
                      onChange={(e) => setPatientForm({ ...patientForm, status: e.target.value as any })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium cursor-pointer"
                    >
                      <option value="active">กำลังฝึก</option>
                      <option value="completed">สำเร็จ</option>
                      <option value="on-hold">พักแผน</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">ส่วนสูง (ซม.)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="ตัวอย่าง 125"
                      value={patientForm.height}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setPatientForm(prev => ({ ...prev, height: val }));
                        }
                      }}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">น้ำหนัก (กก.)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="ตัวอย่าง 45.5"
                      value={patientForm.weight}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setPatientForm(prev => ({ ...prev, weight: val }));
                        }
                      }}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">เบอร์โทรศัพท์ผู้ปกครอง</label>
                  <input
                    type="tel"
                    value={patientForm.phone}
                    onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                    placeholder="เช่น 081-234-5678"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">บันทึกอาการเบื้องต้น / ข้อมูลเพิ่มเติม</label>
                  <textarea
                    rows={2}
                    value={patientForm.notes}
                    onChange={(e) => setPatientForm({ ...patientForm, notes: e.target.value })}
                    placeholder="เช่น ฝึกการกลืนและการหายใจทางจมูก"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                </div>

                {/* Sticky Bottom Footer */}
                <div className="sticky bottom-0 bg-white p-4 sm:p-5 border-t border-slate-100 flex gap-3 shrink-0 z-10 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
                  >
                    บันทึกข้อมูล
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. MODAL: EDIT PATIENT */}
      <AnimatePresence>
        {showEditModal && editingPatient && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto prevent-pull-refresh"
            style={{ overscrollBehaviorY: 'contain' }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowEditModal(false); }}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl border border-purple-200 shadow-2xl max-w-lg w-full text-left max-h-[85vh] flex flex-col my-auto overflow-hidden relative z-10"
              style={{ maxHeight: '85vh' }}
            >
              {/* Sticky Top Header */}
              <div className="sticky top-0 bg-white p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between shrink-0 z-10 shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
                    <Edit2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 truncate">แก้ไขข้อมูลการดูแล</h2>
                    <p className="text-xs text-slate-500 truncate">HN: {editingPatient.hn}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-sm cursor-pointer shrink-0"
                  aria-label="ปิดหน้าต่าง"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={submitEditPatient} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                {/* Scrollable Body with iOS touch momentum */}
                <div 
                  ref={editModalScrollRef}
                  className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50/40 prevent-pull-refresh"
                  style={{ 
                    WebkitOverflowScrolling: 'touch',
                    overscrollBehaviorY: 'contain'
                  }}
                >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">รหัส HN</label>
                    <input
                      type="text"
                      required
                      value={patientForm.hn}
                      onChange={(e) => setPatientForm({ ...patientForm, hn: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-purple-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">ชื่อเล่น</label>
                    <input
                      type="text"
                      value={patientForm.nickname}
                      onChange={(e) => setPatientForm({ ...patientForm, nickname: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">ชื่อจริง</label>
                    <input
                      type="text"
                      required
                      value={patientForm.firstName}
                      onChange={(e) => setPatientForm({ ...patientForm, firstName: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">นามสกุล</label>
                    <input
                      type="text"
                      value={patientForm.lastName}
                      onChange={(e) => setPatientForm({ ...patientForm, lastName: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">อายุ (ปี)</label>
                    <input
                      type="number"
                      min="1"
                      max="25"
                      value={patientForm.age}
                      onChange={(e) => setPatientForm({ ...patientForm, age: Number(e.target.value) })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">เพศ</label>
                    <select
                      value={patientForm.gender}
                      onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value as any })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium cursor-pointer"
                    >
                      <option value="ชาย">ชาย</option>
                      <option value="หญิง">หญิง</option>
                      <option value="อื่นๆ">อื่นๆ</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">สถานะ</label>
                    <select
                      value={patientForm.status}
                      onChange={(e) => setPatientForm({ ...patientForm, status: e.target.value as any })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium cursor-pointer"
                    >
                      <option value="active">กำลังฝึก</option>
                      <option value="completed">สำเร็จ</option>
                      <option value="on-hold">พักแผน</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">ส่วนสูง (ซม.)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="ตัวอย่าง 125"
                      value={patientForm.height}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setPatientForm(prev => ({ ...prev, height: val }));
                        }
                      }}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">น้ำหนัก (กก.)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="ตัวอย่าง 45.5"
                      value={patientForm.weight}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setPatientForm(prev => ({ ...prev, weight: val }));
                        }
                      }}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">เบอร์โทรศัพท์ผู้ปกครอง</label>
                  <input
                    type="tel"
                    value={patientForm.phone}
                    onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">บันทึกเพิ่มเติม</label>
                  <textarea
                    rows={2}
                    value={patientForm.notes}
                    onChange={(e) => setPatientForm({ ...patientForm, notes: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                </div>

                {/* Sticky Bottom Footer */}
                <div className="sticky bottom-0 bg-white p-4 sm:p-5 border-t border-slate-100 flex gap-3 shrink-0 z-10 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
                  >
                    บันทึกการแก้ไข
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
