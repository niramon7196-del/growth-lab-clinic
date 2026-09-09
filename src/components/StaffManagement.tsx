import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  UserPlus, 
  Search, 
  Edit3, 
  Eye, 
  Power, 
  X, 
  ShieldCheck, 
  Mail, 
  Phone, 
  User, 
  CheckCircle2, 
  XCircle,
  Filter,
  Briefcase,
  CheckSquare,
  Square,
  Lock,
  Trash2,
  AlertTriangle,
  Stethoscope,
  UserCheck,
  Building2,
  KeyRound,
  Check,
  ArrowLeft
} from 'lucide-react';
import { StaffAccount } from '../types';

export const MODULE_OPTIONS = [
  { id: 'Dashboard', label: 'ภาพรวม (Dashboard)' },
  { id: 'ผู้รับการดูแล', label: 'ผู้รับการดูแล (Patients)' },
  { id: 'ติดตามผล', label: 'ติดตามผล (Care Tracking)' },
  { id: 'EF / แบบฝึก', label: 'EF / แบบฝึกกล้ามเนื้อปาก' },
  { id: 'GNS', label: 'รายการอาหาร / GNS' },
  { id: 'การนอน', label: 'การนอนหลับ (Sleep)' },
  { id: 'การออกกำลังกาย', label: 'การออกกำลังกาย' },
  { id: 'Before / After', label: 'Before / After' },
  { id: 'QR', label: 'QR Code / เช็กอิน' },
  { id: 'นัดหมาย', label: 'นัดหมาย (Appointments)' },
  { id: 'วิดีโอ', label: 'วิดีโอสาธิต (Video Hub)' },
  { id: 'รายงาน', label: 'รายงาน (Reports & PDF)' },
  { id: 'การแจ้งเตือน', label: 'การแจ้งเตือน (Notifications)' },
  { id: 'Clinical Source', label: 'เอกสารอ้างอิงทางคลินิก' },
  { id: 'ตั้งค่า', label: 'ตั้งค่าระบบ (Settings)' },
  { id: 'ข้อมูลคลินิก', label: 'ข้อมูลคลินิกและโปรไฟล์แพทย์' },
  { id: 'บุคลากร', label: 'จัดการบุคลากร (Staff)' },
  { id: 'คู่มือการใช้งาน', label: 'คู่มือการใช้งาน (User Guide)' },
];

export const DEFAULT_FULL_PERMISSIONS: Record<string, boolean> = {
  Dashboard: true,
  'ผู้รับการดูแล': true,
  'ผู้เข้าโปรแกรม': true,
  'ติดตามผล': true,
  'ติดตามการรักษา': true,
  'EF / แบบฝึก': true,
  GNS: true,
  'การนอน': true,
  'การออกกำลังกาย': true,
  'Before / After': true,
  QR: true,
  'นัดหมาย': true,
  'วิดีโอ': true,
  'รายงาน': true,
  'การแจ้งเตือน': true,
  'Clinical Source': true,
  'ตั้งค่า': true,
  'ข้อมูลคลินิก': true,
  'บุคลากร': true,
  'คู่มือ': true,
  'คู่มือการใช้งาน': true,
};

export interface StaffManagementProps {
  staffAccounts: StaffAccount[];
  onAddStaff: (staff: Omit<StaffAccount, 'id'>) => void;
  onUpdateStaff: (id: string, updated: Partial<StaffAccount>) => void;
  onDeleteStaff: (id: string) => void;
  onToggleStatus: (id: string) => void;
  triggerFeedback: (message: string, type: 'success' | 'error') => void;
}

export default function StaffManagement({
  staffAccounts,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff,
  onToggleStatus,
  triggerFeedback
}: StaffManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPositionFilter, setSelectedPositionFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffAccount | null>(null);
  const [viewingStaff, setViewingStaff] = useState<StaffAccount | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<StaffAccount | null>(null);

  // Form states
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formNickname, setFormNickname] = useState('');
  const [formPosition, setFormPosition] = useState<string>('ผู้ช่วยทันตแพทย์');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formConfirmPassword, setFormConfirmPassword] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [formPermissions, setFormPermissions] = useState<Record<string, boolean>>(DEFAULT_FULL_PERMISSIONS);

  const openAddModal = () => {
    setEditingStaff(null);
    setFormFirstName('');
    setFormLastName('');
    setFormNickname('');
    setFormPosition('ผู้ช่วยทันตแพทย์');
    setFormPhone('');
    setFormEmail('');
    setFormUsername('');
    setFormPassword('');
    setFormConfirmPassword('');
    setFormStatus('active');
    setFormPermissions({ ...DEFAULT_FULL_PERMISSIONS });
    setShowModal(true);
  };

  const openEditModal = (staff: StaffAccount) => {
    setEditingStaff(staff);
    
    let first = staff.firstName || '';
    let last = staff.lastName || '';
    if (!first && staff.name) {
      const parts = staff.name.trim().split(/\s+/);
      first = parts[0] || '';
      last = parts.slice(1).join(' ') || '';
    }

    setFormFirstName(first);
    setFormLastName(last);
    setFormNickname(staff.nickname || staff.displayName || '');
    setFormPosition(staff.position || 'ผู้ช่วยทันตแพทย์');
    setFormPhone(staff.phone || '');
    setFormEmail(staff.email || '');
    setFormUsername(staff.username || '');
    setFormPassword(staff.password || '');
    setFormConfirmPassword(staff.password || '');
    setFormStatus(staff.status || 'active');

    // Load existing permissions or merged defaults
    const loadedPerms: Record<string, boolean> = { ...DEFAULT_FULL_PERMISSIONS };
    if (staff.permissions) {
      Object.keys(staff.permissions).forEach(k => {
        loadedPerms[k] = staff.permissions![k];
      });
    }
    setFormPermissions(loadedPerms);

    setShowModal(true);
  };

  const togglePermission = (modId: string) => {
    setFormPermissions(prev => ({
      ...prev,
      [modId]: !prev[modId]
    }));
  };

  const selectAllPermissions = () => {
    const updated: Record<string, boolean> = {};
    MODULE_OPTIONS.forEach(m => { updated[m.id] = true; });
    // Also include mapped aliases
    updated['ผู้เข้าโปรแกรม'] = true;
    updated['ติดตามการรักษา'] = true;
    updated['คู่มือ'] = true;
    setFormPermissions(updated);
  };

  const deselectAllPermissions = () => {
    const updated: Record<string, boolean> = {};
    MODULE_OPTIONS.forEach(m => { updated[m.id] = false; });
    updated['ผู้เข้าโปรแกรม'] = false;
    updated['ติดตามการรักษา'] = false;
    updated['คู่มือ'] = false;
    setFormPermissions(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formFirstName.trim() || !formLastName.trim()) {
      triggerFeedback('กรุณากรอกชื่อและนามสกุลให้ครบถ้วน', 'error');
      return;
    }
    if (!formUsername.trim()) {
      triggerFeedback('กรุณากรอกชื่อผู้ใช้งาน (Username)', 'error');
      return;
    }

    // Check duplicate username if adding new or changing username
    const normalizedUsername = formUsername.trim().toLowerCase();
    const isDuplicate = staffAccounts.some(s => 
      s.id !== editingStaff?.id && s.username?.toLowerCase() === normalizedUsername
    );
    if (isDuplicate) {
      triggerFeedback('ชื่อผู้ใช้งาน (Username) นี้ถูกใช้งานแล้ว กรุณาเลือกชื่ออื่น', 'error');
      return;
    }

    if (!formPassword.trim()) {
      triggerFeedback('กรุณากรอกรหัสผ่าน', 'error');
      return;
    }
    if (formPassword !== formConfirmPassword) {
      triggerFeedback('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน', 'error');
      return;
    }

    const fullName = `${formFirstName.trim()} ${formLastName.trim()}`;
    const displayName = formNickname.trim() ? formNickname.trim() : formFirstName.trim();

    let assignedRole = 'STAFF';
    if (formPosition === 'ผู้ดูแลระบบ') assignedRole = 'ADMIN';
    else if (formPosition === 'ทันตแพทย์') assignedRole = 'DOCTOR';
    else if (formPosition === 'ผู้ช่วยทันตแพทย์' || formPosition === 'ผู้ช่วย') assignedRole = 'ASSISTANT';

    // Ensure permissions include common aliases
    const finalPermissions: Record<string, boolean> = {
      ...formPermissions,
      'ผู้เข้าโปรแกรม': !!formPermissions['ผู้รับการดูแล'],
      'ติดตามการรักษา': !!formPermissions['ติดตามผล'],
      'คู่มือ': !!formPermissions['คู่มือการใช้งาน'],
    };

    if (editingStaff) {
      onUpdateStaff(editingStaff.id, {
        name: fullName,
        firstName: formFirstName.trim(),
        lastName: formLastName.trim(),
        nickname: formNickname.trim(),
        position: formPosition,
        displayName: displayName,
        phone: formPhone.trim(),
        email: formEmail.trim(),
        username: formUsername.trim(),
        password: formPassword,
        status: formStatus,
        role: assignedRole,
        permissions: finalPermissions
      });
      triggerFeedback('แก้ไขข้อมูลบุคลากรเรียบร้อยแล้ว', 'success');
    } else {
      onAddStaff({
        name: fullName,
        firstName: formFirstName.trim(),
        lastName: formLastName.trim(),
        nickname: formNickname.trim(),
        position: formPosition,
        displayName: displayName,
        phone: formPhone.trim(),
        email: formEmail.trim(),
        username: formUsername.trim(),
        password: formPassword,
        status: formStatus,
        role: assignedRole,
        permissions: finalPermissions
      });
      triggerFeedback('เพิ่มบุคลากรใหม่เข้าสู่ระบบเรียบร้อยแล้ว', 'success');
    }

    setShowModal(false);
  };

  const handleConfirmDelete = () => {
    if (!staffToDelete) return;
    onDeleteStaff(staffToDelete.id);
    setStaffToDelete(null);
  };

  const filteredStaff = staffAccounts.filter(staff => {
    const fullName = staff.name || `${staff.firstName || ''} ${staff.lastName || ''}`;
    const matchesSearch = 
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (staff.nickname && staff.nickname.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (staff.username && staff.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (staff.phone && staff.phone.includes(searchTerm)) ||
      (staff.email && staff.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (staff.position && staff.position.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesPosition = selectedPositionFilter === 'all' || staff.position === selectedPositionFilter;
    const matchesStatus = selectedStatusFilter === 'all' || staff.status === selectedStatusFilter;

    return matchesSearch && matchesPosition && matchesStatus;
  });

  const getPositionBadge = (pos: string) => {
    switch (pos) {
      case 'ผู้ดูแลระบบ':
        return (
          <span className="px-2.5 py-1 bg-purple-100/80 text-purple-700 text-xs font-bold rounded-lg border border-purple-200 inline-flex items-center gap-1.5 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5" /> ผู้ดูแลระบบ
          </span>
        );
      case 'ทันตแพทย์':
        return (
          <span className="px-2.5 py-1 bg-teal-100/80 text-teal-800 text-xs font-bold rounded-lg border border-teal-200 inline-flex items-center gap-1.5 shadow-2xs">
            <Stethoscope className="w-3.5 h-3.5" /> ทันตแพทย์
          </span>
        );
      case 'ผู้ช่วยทันตแพทย์':
      case 'ผู้ช่วย':
        return (
          <span className="px-2.5 py-1 bg-blue-100/80 text-blue-800 text-xs font-bold rounded-lg border border-blue-200 inline-flex items-center gap-1.5 shadow-2xs">
            <Briefcase className="w-3.5 h-3.5" /> ผู้ช่วยทันตแพทย์
          </span>
        );
      case 'เจ้าหน้าที่ต้อนรับ':
        return (
          <span className="px-2.5 py-1 bg-amber-100/80 text-amber-800 text-xs font-bold rounded-lg border border-amber-200 inline-flex items-center gap-1.5 shadow-2xs">
            <UserCheck className="w-3.5 h-3.5" /> เจ้าหน้าที่ต้อนรับ
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 inline-flex items-center gap-1.5 shadow-2xs">
            <User className="w-3.5 h-3.5" /> {pos || 'เจ้าหน้าที่ทั่วไป'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 text-left w-full max-w-full overflow-x-hidden box-border">
      {/* HEADER SECTION */}
      <div className="aurora-card p-6 sm:p-7 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-100/80 border border-purple-200 flex items-center justify-center text-purple-700 shadow-xs">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#1A1A24] tracking-tight font-sans">
                จัดการบุคลากรคลินิก
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                จัดการรายชื่อแพทย์ ผู้ช่วย เจ้าหน้าที่ต้อนรับ และกำหนดสิทธิ์การเข้าถึงเมนู
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openAddModal}
          id="btn-add-staff-main"
          className="bg-purple-600 hover:bg-purple-700 active:scale-98 text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer self-start md:self-auto shrink-0 min-h-[44px]"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ เพิ่มบุคลากร</span>
        </button>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="aurora-card p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อ, ตำแหน่ง, ยูสเซอร์, เบอร์โทร..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>กรอง:</span>
          </div>
          
          <select
            value={selectedPositionFilter}
            onChange={(e) => setSelectedPositionFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          >
            <option value="all">ทุกตำแหน่ง</option>
            <option value="ทันตแพทย์">ทันตแพทย์</option>
            <option value="ผู้ช่วยทันตแพทย์">ผู้ช่วยทันตแพทย์</option>
            <option value="เจ้าหน้าที่ต้อนรับ">เจ้าหน้าที่ต้อนรับ</option>
            <option value="ผู้ดูแลระบบ">ผู้ดูแลระบบ</option>
            <option value="เจ้าหน้าที่">เจ้าหน้าที่ทั่วไป</option>
          </select>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="active">ใช้งาน (Active)</option>
            <option value="inactive">ปิดใช้งาน (Inactive)</option>
          </select>
        </div>
      </div>

      {/* STAFF LIST TABLE / CARDS */}
      {filteredStaff.length === 0 ? (
        /* EMPTY STATE */
        <div className="aurora-card rounded-3xl p-12 text-center space-y-4 my-6">
          <div className="w-16 h-16 bg-purple-100/70 text-purple-700 rounded-2xl flex items-center justify-center mx-auto text-2xl border border-purple-200/80 shadow-xs">
            <UserPlus className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-[#1A1A24]">
              {searchTerm || selectedPositionFilter !== 'all' || selectedStatusFilter !== 'all' 
                ? 'ไม่พบบุคลากรที่ตรงกับเงื่อนไขการค้นหา' 
                : 'ยังไม่มีข้อมูลบุคลากร'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              {searchTerm || selectedPositionFilter !== 'all' || selectedStatusFilter !== 'all'
                ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรองตำแหน่ง'
                : 'เริ่มต้นโดยคลิกปุ่ม "+ เพิ่มบุคลากร" เพื่อเพิ่มข้อมูลบุคลากรจริง'}
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold px-6 py-3 rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer min-h-[44px]"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ เพิ่มบุคลากร</span>
          </button>
        </div>
      ) : (
        <div className="aurora-card rounded-3xl overflow-hidden shadow-xs">
          {/* Desktop / Tablet Table view */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                  <th className="py-4 px-6">ชื่อ-นามสกุล / Display Name</th>
                  <th className="py-4 px-4">ตำแหน่งงาน</th>
                  <th className="py-4 px-4">เบอร์โทรศัพท์</th>
                  <th className="py-4 px-4">Username / อีเมล</th>
                  <th className="py-4 px-4">สิทธิ์เมนู (Modules)</th>
                  <th className="py-4 px-4 text-center">สถานะ</th>
                  <th className="py-4 px-6 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {filteredStaff.map((staff) => {
                  const displayName = staff.name || `${staff.firstName || ''} ${staff.lastName || ''}`.trim() || staff.displayName || 'บุคลากร';
                  const allowedModulesCount = staff.permissions 
                    ? Object.keys(staff.permissions).filter(k => MODULE_OPTIONS.some(m => m.id === k) && staff.permissions![k]).length 
                    : MODULE_OPTIONS.length;

                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold flex items-center justify-center shrink-0 shadow-2xs text-sm">
                            {displayName.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-snug">{displayName}</p>
                            {staff.nickname && (
                              <span className="text-xs text-purple-700 font-medium">
                                ชื่อเรียก: {staff.nickname}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Position */}
                      <td className="py-4 px-4">
                        {getPositionBadge(staff.position)}
                      </td>

                      {/* Phone */}
                      <td className="py-4 px-4 text-slate-600 font-medium">
                        {staff.phone ? (
                          <span className="flex items-center gap-1.5 text-xs text-slate-700">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {staff.phone}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal text-xs">-</span>
                        )}
                      </td>

                      {/* Username & Email */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <p className="text-slate-800 font-mono text-xs font-bold bg-slate-100 px-2 py-0.5 rounded-md inline-block">
                            {staff.username}
                          </p>
                          {staff.email && (
                            <p className="text-slate-500 flex items-center gap-1 text-[11px]">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {staff.email}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Module Permissions Count */}
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 inline-block">
                          {allowedModulesCount} / {MODULE_OPTIONS.length} เมนู
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                          staff.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {staff.status === 'active' ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>ใช้งาน</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-slate-400" />
                              <span>ปิดใช้งาน</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Info */}
                          <button
                            onClick={() => setViewingStaff(staff)}
                            className="p-2 text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-all cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                            title="ดูรายละเอียดข้อมูล"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => openEditModal(staff)}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200/80 transition-all cursor-pointer flex items-center gap-1 min-h-[36px]"
                            title="แก้ไขข้อมูลบุคลากร"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>แก้ไข</span>
                          </button>

                          {/* Toggle Active Status */}
                          <button
                            onClick={() => onToggleStatus(staff.id)}
                            className={`p-2 rounded-xl transition-all cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center border ${
                              staff.status === 'active'
                                ? 'bg-amber-50/60 text-amber-700 border-amber-200 hover:bg-amber-100'
                                : 'bg-emerald-50/60 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            }`}
                            title={staff.status === 'active' ? 'คลิกเพื่อปิดใช้งาน' : 'คลิกเพื่อเปิดใช้งาน'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => setStaffToDelete(staff)}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-all cursor-pointer flex items-center gap-1 min-h-[36px]"
                            title="ลบบุคลากรออกจากระบบ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>ลบ</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card view */}
          <div className="block md:hidden divide-y divide-slate-100">
            {filteredStaff.map((staff) => {
              const displayName = staff.name || `${staff.firstName || ''} ${staff.lastName || ''}`.trim() || staff.displayName || 'บุคลากร';
              const allowedModulesCount = staff.permissions 
                ? Object.keys(staff.permissions).filter(k => MODULE_OPTIONS.some(m => m.id === k) && staff.permissions![k]).length 
                : MODULE_OPTIONS.length;

              return (
                <div key={staff.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold flex items-center justify-center shrink-0 shadow-2xs text-sm">
                        {displayName.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{displayName}</h4>
                        {staff.nickname && (
                          <p className="text-xs text-purple-700 font-medium">ชื่อเรียก: {staff.nickname}</p>
                        )}
                      </div>
                    </div>
                    {getPositionBadge(staff.position)}
                  </div>

                  <div className="text-xs space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-slate-600">
                    <p><span className="text-slate-400">Username:</span> <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">{staff.username}</span></p>
                    {staff.phone && <p><span className="text-slate-400">เบอร์โทร:</span> <span className="font-semibold text-slate-800">{staff.phone}</span></p>}
                    {staff.email && <p><span className="text-slate-400">อีเมล:</span> <span className="text-slate-700">{staff.email}</span></p>}
                    <p><span className="text-slate-400">สิทธิ์เมนู:</span> <span className="font-bold text-purple-700">{allowedModulesCount} / {MODULE_OPTIONS.length} เมนู</span></p>
                    <p className="flex items-center gap-1.5 pt-0.5">
                      <span className="text-slate-400">สถานะ:</span>
                      <span className={`font-bold inline-flex items-center gap-1 ${staff.status === 'active' ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {staff.status === 'active' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {staff.status === 'active' ? 'ใช้งาน (Active)' : 'ปิดใช้งาน (Inactive)'}
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => setViewingStaff(staff)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 min-h-[40px]"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>ดูข้อมูล</span>
                    </button>
                    <button
                      onClick={() => openEditModal(staff)}
                      className="px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold rounded-xl border border-blue-200 transition-all cursor-pointer flex items-center gap-1 min-h-[40px]"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>แก้ไข</span>
                    </button>
                    <button
                      onClick={() => onToggleStatus(staff.id)}
                      className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1 min-h-[40px] ${
                        staff.status === 'active'
                          ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{staff.status === 'active' ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}</span>
                    </button>
                    <button
                      onClick={() => setStaffToDelete(staff)}
                      className="px-3.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold rounded-xl border border-rose-200 transition-all cursor-pointer flex items-center gap-1 min-h-[40px]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ลบ</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ADD / EDIT STAFF MODAL */}
      {/* ======================================================== */}
      {showModal && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 md:p-8"
          onClick={() => setShowModal(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl mx-auto my-auto bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-left relative animate-in fade-in zoom-in-95 duration-200 max-h-[92vh]"
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-purple-200/50 flex items-center justify-between bg-gradient-to-r from-purple-700 to-indigo-700 text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0 shadow-xs">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold font-sans tracking-tight">
                    {editingStaff ? 'แก้ไขข้อมูลบุคลากร' : 'เพิ่มบุคลากรใหม่'}
                  </h3>
                  <p className="text-xs text-purple-100">
                    {editingStaff ? 'ปรับปรุงข้อมูล บัญชีผู้ใช้งาน และสิทธิ์การเข้าถึง' : 'กรอกข้อมูลเพื่อสร้างบัญชีและกำหนดสิทธิ์เข้าใช้งาน'}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 text-white/80 hover:text-white cursor-pointer rounded-xl hover:bg-white/10 transition-all"
                title="ปิดหน้าต่าง"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 sm:p-7 md:p-8 overflow-y-auto flex-1 space-y-6 text-left bg-white pl-5 sm:pl-7 md:pl-8 pr-5 sm:pr-7 md:pr-8">
                {/* SECTION 1: Personal Info */}
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-purple-600" />
                    <h4 className="text-xs sm:text-sm font-bold text-purple-950 uppercase tracking-wider">
                      1. ข้อมูลทั่วไปและตำแหน่งงาน
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 sm:gap-y-4.5">
                    {/* ชื่อจริง (Left Column) */}
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5 text-left">
                        ชื่อจริง *
                      </label>
                      <input
                        type="text"
                        required
                        value={formFirstName}
                        onChange={(e) => setFormFirstName(e.target.value)}
                        placeholder="เช่น สุภาพร"
                        className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all shadow-2xs"
                      />
                    </div>

                    {/* นามสกุล (Right Column) */}
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5 text-left">
                        นามสกุล *
                      </label>
                      <input
                        type="text"
                        required
                        value={formLastName}
                        onChange={(e) => setFormLastName(e.target.value)}
                        placeholder="เช่น มีสุข"
                        className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all shadow-2xs"
                      />
                    </div>

                    {/* ชื่อเล่น / ชื่อเรียก (Left Column) */}
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5 text-left">
                        ชื่อเล่น / ชื่อเรียก (Display Name)
                      </label>
                      <input
                        type="text"
                        value={formNickname}
                        onChange={(e) => setFormNickname(e.target.value)}
                        placeholder="เช่น คุณนภาพร / พี่หมอ"
                        className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all shadow-2xs"
                      />
                    </div>

                    {/* ตำแหน่งงาน (Right Column) */}
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5 text-left">
                        ตำแหน่งงาน *
                      </label>
                      <select
                        value={formPosition}
                        onChange={(e) => setFormPosition(e.target.value)}
                        className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none bg-white font-medium shadow-2xs cursor-pointer"
                      >
                        <option value="ทันตแพทย์">ทันตแพทย์ (Dentist / Doctor)</option>
                        <option value="ผู้ช่วยทันตแพทย์">ผู้ช่วยทันตแพทย์ (Dental Assistant)</option>
                        <option value="เจ้าหน้าที่ต้อนรับ">เจ้าหน้าที่ต้อนรับ (Receptionist / Front Desk)</option>
                        <option value="ผู้ดูแลระบบ">ผู้ดูแลระบบ (System Admin)</option>
                        <option value="เจ้าหน้าที่">เจ้าหน้าที่ทั่วไป (Staff)</option>
                      </select>
                    </div>

                    {/* เบอร์โทรศัพท์ (Left Column) */}
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5 text-left">
                        เบอร์โทรศัพท์
                      </label>
                      <input
                        type="tel"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        placeholder="เช่น 0812345678"
                        className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all shadow-2xs"
                      />
                    </div>

                    {/* อีเมล (Right Column) */}
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5 text-left">
                        อีเมล (Email)
                      </label>
                      <input
                        type="email"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        placeholder="เช่น staff@growthlab.com"
                        className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 2: Account Security */}
                <div className="space-y-4 pt-2">
                  <div className="border-b border-slate-100 pb-2 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-purple-600" />
                    <h4 className="text-xs sm:text-sm font-bold text-purple-950 uppercase tracking-wider">
                      2. บัญชีผู้ใช้งานและความปลอดภัย
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 sm:gap-y-4.5">
                    {/* ชื่อผู้ใช้งาน (Left Column) */}
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5 text-left">
                        ชื่อผู้ใช้งาน (Username) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formUsername}
                        onChange={(e) => setFormUsername(e.target.value)}
                        placeholder="เช่น staff_nok"
                        className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none font-mono shadow-2xs"
                      />
                    </div>

                    {/* สถานะบัญชี (Right Column) */}
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5 text-left">
                        สถานะบัญชี *
                      </label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as any)}
                        className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none bg-white font-medium shadow-2xs cursor-pointer"
                      >
                        <option value="active">ใช้งาน (Active)</option>
                        <option value="inactive">ปิดใช้งาน (Inactive)</option>
                      </select>
                    </div>

                    {/* รหัสผ่าน (Left Column) */}
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5 text-left">
                        รหัสผ่าน (Password) *
                      </label>
                      <input
                        type="password"
                        required
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none shadow-2xs"
                      />
                    </div>

                    {/* ยืนยันรหัสผ่าน (Right Column) */}
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5 text-left">
                        ยืนยันรหัสผ่าน *
                      </label>
                      <input
                        type="password"
                        required
                        value={formConfirmPassword}
                        onChange={(e) => setFormConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 3: Module Permissions */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      <h4 className="text-xs sm:text-sm font-bold text-purple-950 uppercase tracking-wider">
                        3. กำหนดสิทธิ์การมองเห็นเมนู (Permissions)
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={selectAllPermissions}
                        className="text-xs font-bold text-purple-700 hover:text-purple-900 hover:underline cursor-pointer"
                      >
                        เลือกทั้งหมด
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={deselectAllPermissions}
                        className="text-xs font-bold text-slate-500 hover:text-slate-700 hover:underline cursor-pointer"
                      >
                        ยกเลิกทั้งหมด
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    {MODULE_OPTIONS.map((mod) => {
                      const isChecked = !!formPermissions[mod.id];
                      return (
                        <button
                          type="button"
                          key={mod.id}
                          onClick={() => togglePermission(mod.id)}
                          className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium transition-all text-left border cursor-pointer ${
                            isChecked 
                              ? 'bg-purple-50/95 border-purple-300 text-purple-950 font-bold shadow-2xs' 
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-purple-600 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <span className="truncate">{mod.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Form Footer Buttons - Sticky and Prominent */}
              <div className="sticky bottom-0 bg-slate-50/95 backdrop-blur-xs border-t border-slate-200 px-5 sm:px-7 md:px-8 py-4 flex items-center justify-between gap-4 z-20 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 sm:px-6 py-2.5 sm:py-3 bg-white hover:bg-slate-100 active:scale-98 text-slate-700 text-xs sm:text-sm font-bold rounded-xl border border-slate-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer min-h-[44px] flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-500" />
                  <span>ยกเลิก / ย้อนกลับ</span>
                </button>
                <button
                  type="submit"
                  className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-98 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer min-h-[44px] flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingStaff ? 'บันทึกข้อมูลบุคลากร' : 'บันทึกข้อมูลบุคลากร'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ======================================================== */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {staffToDelete && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setStaffToDelete(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl border border-rose-100 max-w-md w-full mx-auto my-auto flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left"
          >
            <div className="p-5 border-b border-rose-100 flex items-center justify-between bg-rose-50 text-rose-900">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold font-sans">ยืนยันการลบบุคลากร</h3>
              </div>
              <button 
                onClick={() => setStaffToDelete(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer rounded-lg hover:bg-rose-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                คุณแน่ใจหรือไม่ว่าต้องการลบบุคลากรต่อไปนี้ออกจากระบบ? ข้อมูลการเข้าสู่ระบบและสิทธิ์จะถูกลบออกจากฐานข้อมูลทันที
              </p>

              {/* Staff preview card */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold flex items-center justify-center shrink-0 shadow-2xs">
                  {(staffToDelete.name || staffToDelete.firstName || 'U').charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {staffToDelete.name || `${staffToDelete.firstName || ''} ${staffToDelete.lastName || ''}`}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono">
                    Username: <span className="font-bold text-slate-700">{staffToDelete.username}</span>
                  </p>
                  <div className="mt-1">{getPositionBadge(staffToDelete.position)}</div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 leading-normal flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>การกระทำนี้ไม่สามารถเรียกคืนได้ หากต้องการระงับการใช้งานชั่วคราว แนะนำให้ใช้ปุ่ม &quot;ปิดใช้งาน&quot; แทน</span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setStaffToDelete(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer min-h-[40px]"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5 min-h-[40px]"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>ยืนยันลบบุคลากร</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ======================================================== */}
      {/* VIEW STAFF DETAILS MODAL */}
      {/* ======================================================== */}
      {viewingStaff && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setViewingStaff(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full mx-auto my-auto flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left"
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold font-sans">ข้อมูลบุคลากร</h3>
              </div>
              <button 
                onClick={() => setViewingStaff(null)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer rounded-lg hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-lg flex items-center justify-center shrink-0 shadow-md">
                  {(viewingStaff.name || viewingStaff.firstName || 'U').charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">
                    {viewingStaff.name || `${viewingStaff.firstName || ''} ${viewingStaff.lastName || ''}`}
                  </h4>
                  {viewingStaff.nickname && (
                    <p className="text-xs text-slate-500 font-medium">Display Name: {viewingStaff.nickname}</p>
                  )}
                  <div className="mt-1">{getPositionBadge(viewingStaff.position)}</div>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-700 bg-white">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Username:</span>
                  <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{viewingStaff.username}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">เบอร์โทรศัพท์:</span>
                  <span className="font-semibold text-slate-800">{viewingStaff.phone || '-'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">อีเมล:</span>
                  <span className="font-semibold text-slate-800">{viewingStaff.email || '-'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">สถานะบัญชี:</span>
                  <span className={`font-bold inline-flex items-center gap-1 ${viewingStaff.status === 'active' ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {viewingStaff.status === 'active' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {viewingStaff.status === 'active' ? 'ใช้งาน (Active)' : 'ปิดใช้งาน (Inactive)'}
                  </span>
                </div>
              </div>

              {/* View Permissions list */}
              <div className="space-y-1.5">
                <h5 className="text-xs font-bold text-slate-700">สิทธิ์เข้าถึงเมนูระบบ:</h5>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  {MODULE_OPTIONS.map((m) => {
                    const hasPerm = viewingStaff.permissions ? viewingStaff.permissions[m.id] : true;
                    return (
                      <span
                        key={m.id}
                        className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
                          hasPerm 
                            ? 'bg-purple-100 text-purple-800 font-bold border border-purple-200' 
                            : 'bg-slate-200/60 text-slate-400 line-through'
                        }`}
                      >
                        {m.label}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  onClick={() => {
                    const st = viewingStaff;
                    setViewingStaff(null);
                    openEditModal(st);
                  }}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 min-h-[38px]"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>แก้ไขข้อมูล</span>
                </button>
                <button
                  onClick={() => setViewingStaff(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer min-h-[38px]"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
