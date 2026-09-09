import re

with open('src/components/PatientsList.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# We want to extract just the AddPatientModal and EditPatientModal.
# But it's easier to just write a simple react component.

new_code = """import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, UserPlus, FileText, Activity, Users, Filter, Calendar, Settings, ChevronRight, QrCode, Brain, Check, Info, Phone, ActivitySquare, ArrowLeft } from 'lucide-react';
import { Patient, SessionLog, HomeworkAssignment } from '../types';
import { useScrollLock } from '../utils';

interface PatientsListProps {
  patients: Patient[];
  logs: SessionLog[];
  onAddPatient: (patient: Omit<Patient, 'id'>) => void;
  onEditPatient: (patient: Patient) => void;
  onDeletePatient: (patientId: string) => void;
  onAddLog: (log: Omit<SessionLog, 'id'>) => void;
  onDeleteLog: (logId: string) => void;
  selectedPatientId?: string;
  onSelectPatient: (patientId: string | undefined) => void;
  autoOpenAddModal?: boolean;
}

export default function PatientsList({
  patients,
  onAddPatient,
  onEditPatient,
  onDeletePatient,
  selectedPatientId,
  onSelectPatient,
  autoOpenAddModal,
}: PatientsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'on-hold'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (autoOpenAddModal) {
      setShowAddModal(true);
    }
  }, [autoOpenAddModal]);

  const [patientForm, setPatientForm] = useState({
    hn: '',
    firstName: '',
    lastName: '',
    nickname: '',
    age: 0,
    gender: 'ชาย' as 'ชาย' | 'หญิง' | 'อื่นๆ',
    weight: 0,
    height: 0,
    startDate: new Date().toISOString().split('T')[0],
    phone: '',
    notes: '',
    status: 'active' as 'active' | 'completed' | 'on-hold',
    photoBefore: '',
    photoAfter: '',
  });

  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);

  useScrollLock(showAddModal || showEditModal);

  const filteredPatients = patients.filter((p) => {
    const fullName = `${p.firstName} ${p.lastName} ${p.nickname} ${p.hn}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const submitAddPatient = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedNotes = `[เพศ: ${patientForm.gender}] ${patientForm.notes}`.trim();
    onAddPatient({
      ...patientForm,
      notes: formattedNotes
    });
    setShowAddModal(false);
    resetForm();
  };

  const submitEditPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPatientId) {
      const formattedNotes = `[เพศ: ${patientForm.gender}] ${patientForm.notes}`.trim();
      onEditPatient({
        ...patientForm,
        notes: formattedNotes,
        id: editingPatientId,
      });
      setShowEditModal(false);
      resetForm();
    }
  };

  const startEditPatient = (p: Patient) => {
    const genderMatch = p.notes?.match(/\[เพศ:\s*(.*?)\\]/);
    const genderVal = (genderMatch ? genderMatch[1] : 'ชาย') as 'ชาย' | 'หญิง' | 'อื่นๆ';
    const cleanNotes = p.notes?.replace(/\[เพศ:\s*.*?\\]\s*/g, '').trim() || '';
    setEditingPatientId(p.id);
    setPatientForm({
      hn: p.hn,
      firstName: p.firstName,
      lastName: p.lastName,
      nickname: p.nickname,
      age: p.age,
      gender: genderVal,
      weight: p.weight,
      height: p.height,
      startDate: p.startDate,
      phone: p.parentPhone || '',
      notes: cleanNotes,
      status: p.status,
      photoBefore: p.photoBefore || '',
      photoAfter: p.photoAfter || '',
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setPatientForm({
      hn: `HN-${Math.floor(10000 + Math.random() * 90000)}`,
      firstName: '',
      lastName: '',
      nickname: '',
      age: 7,
      gender: 'ชาย',
      weight: 22,
      height: 120,
      startDate: new Date().toISOString().split('T')[0],
      phone: '',
      notes: '',
      status: 'active',
      photoBefore: '',
      photoAfter: '',
    });
  };

  const getPatientGender = (notes: string) => {
    const match = notes?.match(/\[เพศ:\s*(.*?)\\]/);
    return match ? match[1] : 'ชาย';
  };

  return (
    <div id="patients-view" className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      <div className={`aurora-card rounded-2xl p-4 md:p-6 xl:col-span-12`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 text-left">
          <div>
            <h2 className="text-2xl font-black text-[#252536] font-sans">สารบบผู้รับการดูแล</h2>
            <p className="text-slate-500 text-xs mt-1 font-medium">ค้นหา แก้ไข และเปิดแฟ้มประวัติรายบุคคล</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="flex items-center gap-2 bg-purple-600 text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-purple-700 transition-all shadow-md w-full sm:w-auto justify-center cursor-pointer min-h-[44px]"
          >
            <UserPlus className="w-5 h-5" />
            <span>เพิ่มผู้รับการดูแลใหม่</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, นามสกุล, หรือ HN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="all">สถานะทั้งหมด</option>
              <option value="active">กำลังรับการดูแล</option>
              <option value="completed">จบคอร์สแล้ว</option>
              <option value="on-hold">พักการดูแล</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {filteredPatients.map((p) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`bg-white border rounded-2xl p-5 hover:shadow-lg transition-all cursor-pointer relative group ${
                  selectedPatientId === p.id
                    ? 'border-purple-400 shadow-purple-900/10 ring-2 ring-purple-500/20'
                    : 'border-slate-100 hover:border-purple-200'
                }`}
                onClick={() => onSelectPatient(p.id)}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shrink-0 transition-colors ${
                    selectedPatientId === p.id
                      ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white'
                      : 'bg-gradient-to-br from-purple-50 to-indigo-50 text-purple-700 group-hover:from-purple-100 group-hover:to-indigo-100'
                  }`}>
                    {p.nickname ? p.nickname.charAt(0) : p.firstName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.hn}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        p.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                        p.status === 'completed' ? 'bg-blue-50 text-blue-600' :
                        'bg-amber-50 text-amber-600'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-800 truncate text-base">
                      {p.firstName} {p.lastName}
                    </h3>
                    <p className="text-slate-500 text-sm truncate">
                      น้อง{p.nickname} • {p.age} ขวบ
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditPatient(p);
                  }}
                  className="absolute top-4 right-4 p-2 text-slate-300 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="แก้ไขข้อมูล"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredPatients.length === 0 && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-4">
                <Users className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">ไม่พบข้อมูล</h3>
              <p className="text-slate-500 text-sm">ลองปรับตัวกรองหรือคำค้นหาใหม่</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800">
                      {showAddModal ? 'เพิ่มผู้รับการดูแลใหม่' : 'แก้ไขข้อมูลประวัติ'}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {showAddModal ? 'บันทึกข้อมูลพื้นฐานเพื่อสร้างแฟ้มประวัติ' : 'ปรับปรุงข้อมูลผู้รับการดูแล'}
                    </p>
                  </div>
                </div>
                <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                <form id="patient-form" onSubmit={showAddModal ? submitAddPatient : submitEditPatient} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1 text-sm">HN (รหัสประจำตัว)</label>
                      <input
                        type="text"
                        required
                        value={patientForm.hn}
                        onChange={(e) => setPatientForm({...patientForm, hn: e.target.value})}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl font-mono text-sm text-slate-800 focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1 text-sm">ชื่อเล่น</label>
                      <input
                        type="text"
                        required
                        value={patientForm.nickname}
                        onChange={(e) => setPatientForm({...patientForm, nickname: e.target.value})}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1 text-sm">ชื่อจริง</label>
                      <input
                        type="text"
                        required
                        value={patientForm.firstName}
                        onChange={(e) => setPatientForm({...patientForm, firstName: e.target.value})}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1 text-sm">นามสกุล</label>
                      <input
                        type="text"
                        required
                        value={patientForm.lastName}
                        onChange={(e) => setPatientForm({...patientForm, lastName: e.target.value})}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1 text-sm">อายุ (ปี)</label>
                      <input
                        type="number"
                        required
                        value={patientForm.age}
                        onChange={(e) => setPatientForm({...patientForm, age: Number(e.target.value)})}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1 text-sm">เพศ</label>
                      <select
                        value={patientForm.gender}
                        onChange={(e) => setPatientForm({...patientForm, gender: e.target.value as any})}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-purple-500/20"
                      >
                        <option value="ชาย">ชาย</option>
                        <option value="หญิง">หญิง</option>
                        <option value="อื่นๆ">อื่นๆ</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1 text-sm">น้ำหนัก (kg)</label>
                      <input
                        type="number"
                        value={patientForm.weight}
                        onChange={(e) => setPatientForm({...patientForm, weight: Number(e.target.value)})}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1 text-sm">เบอร์โทรศัพท์ (ผู้ปกครอง)</label>
                      <input
                        type="tel"
                        value={patientForm.phone}
                        onChange={(e) => setPatientForm({...patientForm, phone: e.target.value})}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1 text-sm">สถานะ</label>
                      <select
                        value={patientForm.status}
                        onChange={(e) => setPatientForm({...patientForm, status: e.target.value as any})}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-purple-500/20"
                      >
                        <option value="active">กำลังรับการดูแล</option>
                        <option value="completed">จบคอร์สแล้ว</option>
                        <option value="on-hold">พักการดูแล</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-sm">หมายเหตุเพิ่มเติม / ข้อควรระวัง</label>
                    <textarea
                      rows={3}
                      value={patientForm.notes}
                      onChange={(e) => setPatientForm({...patientForm, notes: e.target.value})}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                  className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  form="patient-form"
                  className="px-6 py-2.5 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-900/20 transition-all"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
"""

with open('src/components/PatientsList.tsx', 'w', encoding='utf-8') as f:
    f.write(new_code)

print("Clean PatientsList.tsx generated!")
