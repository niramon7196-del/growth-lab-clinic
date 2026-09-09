import React, { useState } from 'react';
import { 
  Users, 
  Film, 
  Bell, 
  Settings, 
  ShieldCheck, 
  ArrowRight,
  Server,
  BookOpen,
  FileText,
  Sparkles
} from 'lucide-react';
import { StaffAccount, SystemNotification } from '../types';
import SystemHandoverModal from './SystemHandoverModal';

interface AdminExecutiveSummaryProps {
  staffAccounts: StaffAccount[];
  notifications: SystemNotification[];
  onNavigate: (tab: string) => void;
}

export default function AdminExecutiveSummary({
  staffAccounts,
  notifications,
  onNavigate
}: AdminExecutiveSummaryProps) {
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const unreadNotifications = notifications.filter(n => !n.read);

  return (
    <div className="space-y-6 text-left w-full max-w-full overflow-x-hidden box-border animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="aurora-card p-6 md:p-8 rounded-3xl border border-purple-200/80 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/30 backdrop-blur-md rounded-full border border-purple-400/30 text-purple-200 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
              <span>ศูนย์บริหารจัดการระบบ (System Administration Portal)</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Executive Summary</h1>
            <p className="text-xs md:text-sm text-purple-200/80 leading-relaxed font-medium">
              ภาพรวมการบริหารจัดการระบบ สิทธิ์บุคลากร ทรัพยากรระบบ และระบบความปลอดภัยสำหรับผู้ดูแลระบบ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setShowHandoverModal(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-4 py-3 rounded-2xl border border-white/20 shadow-lg text-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-blue-200" />
              <span>📄 ดูบันทึกข้อตกลงและสิทธิ์ส่งมอบระบบ</span>
            </button>

            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15 text-center">
              <span className="text-[10px] uppercase tracking-wider text-purple-300 font-bold block">สถานะระบบ</span>
              <span className="text-sm font-black text-emerald-400 flex items-center gap-1.5 justify-center mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                ONLINE (100%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => onNavigate('Staff Management')}
          className="aurora-card p-5 rounded-2xl border border-purple-100 hover:border-purple-300 shadow-sm hover:shadow-md transition-all cursor-pointer group bg-white"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-purple-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
              จัดการ <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <span className="text-2xl font-black text-slate-900 block">{staffAccounts.length + 1} บัญชี</span>
          <span className="text-xs font-bold text-slate-500 mt-1 block">บุคลากรทางการแพทย์ & สิทธิ์</span>
        </div>

        <div 
          onClick={() => onNavigate('Content Management')}
          className="aurora-card p-5 rounded-2xl border border-purple-100 hover:border-purple-300 shadow-sm hover:shadow-md transition-all cursor-pointer group bg-white"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <Film className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
              จัดการ <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <span className="text-2xl font-black text-slate-900 block">สื่อ & วิดีโอระบบ</span>
          <span className="text-xs font-bold text-slate-500 mt-1 block">คลังสื่อการสอนและคู่มือระบบ</span>
        </div>

        <div 
          onClick={() => onNavigate('Clinical Source')}
          className="aurora-card p-5 rounded-2xl border border-purple-100 hover:border-purple-300 shadow-sm hover:shadow-md transition-all cursor-pointer group bg-white"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
              ดูเอกสาร <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <span className="text-2xl font-black text-slate-900 block">Clinical Source</span>
          <span className="text-xs font-bold text-slate-500 mt-1 block">คลังเอกสารอ้างอิงทางคลินิก</span>
        </div>

        <div 
          onClick={() => onNavigate('Communications / Alerts')}
          className="aurora-card p-5 rounded-2xl border border-purple-100 hover:border-purple-300 shadow-sm hover:shadow-md transition-all cursor-pointer group bg-white"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <Bell className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-amber-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
              ดูการแจ้งเตือน <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <span className="text-2xl font-black text-slate-900 block">{unreadNotifications.length} รายการ</span>
          <span className="text-xs font-bold text-slate-500 mt-1 block">ระบบแจ้งเตือนและการสื่อสาร</span>
        </div>
      </div>

      {/* Admin Modules Quick Launch */}
      <div className="aurora-card p-6 rounded-3xl border border-slate-200/80 bg-white shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-purple-600" />
          <span>เมนูบริหารจัดการระบบ (System Administration Modules)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          <div 
            onClick={() => onNavigate('Staff Management')}
            className="p-4 rounded-2xl border border-purple-100 hover:border-purple-300 hover:bg-purple-50/50 transition-all cursor-pointer space-y-2 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-sm">
                <Users className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors">Staff Management</h4>
                <p className="text-[11px] text-slate-500">บริหารบัญชีบุคลากรทางการแพทย์ และกำหนดสิทธิ์</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => onNavigate('Content Management')}
            className="p-4 rounded-2xl border border-purple-100 hover:border-purple-300 hover:bg-purple-50/50 transition-all cursor-pointer space-y-2 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm">
                <Film className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors">Content Management</h4>
                <p className="text-[11px] text-slate-500">จัดการสื่อการเรียนรู้วิดีโอและคู่มือระบบ</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => onNavigate('Clinical Source')}
            className="p-4 rounded-2xl border border-purple-100 hover:border-purple-300 hover:bg-purple-50/50 transition-all cursor-pointer space-y-2 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">
                <BookOpen className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors">Clinical Source</h4>
                <p className="text-[11px] text-slate-500">จัดการเอกสารหลักฐานและอ้างอิงทางการแพทย์</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => onNavigate('Communications / Alerts')}
            className="p-4 rounded-2xl border border-purple-100 hover:border-purple-300 hover:bg-purple-50/50 transition-all cursor-pointer space-y-2 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-sm">
                <Bell className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors">Communications / Alerts</h4>
                <p className="text-[11px] text-slate-500">จัดการประกาศ แจ้งเตือน และข่าวสารคลินิก</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => onNavigate('Organization Settings')}
            className="p-4 rounded-2xl border border-purple-100 hover:border-purple-300 hover:bg-purple-50/50 transition-all cursor-pointer space-y-2 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold shadow-sm">
                <Settings className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors">Organization Settings</h4>
                <p className="text-[11px] text-slate-500">ตั้งค่าข้อมูลองค์กร คลินิก และโครงสร้างระบบ</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Architecture & Security Overview */}
      <div className="aurora-card p-6 rounded-3xl border border-slate-200/80 bg-white shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Server className="w-5 h-5 text-indigo-600" />
          <span>ข้อมูลเทคนิคและการคุ้มครองระบบ (Technical & Security Control)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-bold block">สภาพแวดล้อมระบบ:</span>
            <span className="font-extrabold text-slate-800 text-sm block">Cloud Run Container</span>
            <span className="text-slate-500 block">Node.js / React 18 / Tailwind CSS</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-bold block">การจัดเก็บข้อมูล (Persistence):</span>
            <span className="font-extrabold text-emerald-700 text-sm block">Local Storage Sync Engine</span>
            <span className="text-slate-500 block">ข้อมูลสิทธิ์และการตั้งค่าถูกแยกตามระดับบุคลากร</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-bold block">การควบคุมสิทธิ์ (Access Control):</span>
            <span className="font-extrabold text-purple-700 text-sm block">Role Matrix Enforced</span>
            <span className="text-slate-500 block">แพทย์ / บุคลากร / ผู้ดูแลระบบ</span>
          </div>
        </div>
      </div>

      {/* System Handover Modal */}
      <SystemHandoverModal
        isOpen={showHandoverModal}
        onClose={() => setShowHandoverModal(false)}
      />
    </div>
  );
}

