import React from 'react';
import { User, ChevronDown } from 'lucide-react';
import { Patient } from '../types';
import { calculateConsistencyMetrics, hasCheckedInToday } from '../utils/checkInCalculations';
import { formatPatientDisplay } from '../utils/patientUtils';

interface PatientContextBarProps {
  patient?: Patient;
  patients?: Patient[];
  onSelectPatient?: (patientId: string) => void;
  className?: string;
  compact?: boolean;
  showSwitcher?: boolean;
}

export default function PatientContextBar({
  patient,
  patients = [],
  onSelectPatient,
  className = '',
  compact = false,
  showSwitcher = true,
}: PatientContextBarProps) {
  if (!patient) {
    return (
      <div className={`bg-slate-50/90 p-3 sm:p-3.5 rounded-2xl border border-slate-200/90 flex items-center justify-between gap-3 text-xs shadow-2xs ${className}`}>
        <span className="text-slate-400 font-medium italic">ยังไม่ได้ระบุผู้รับการดูแล</span>
        {patients.length > 0 && onSelectPatient && showSwitcher && (
          <select
            onChange={(e) => e.target.value && onSelectPatient(e.target.value)}
            className="text-xs font-bold text-purple-700 bg-white border border-purple-200 px-3 py-1.5 rounded-xl shadow-2xs focus:ring-2 focus:ring-purple-500 cursor-pointer"
          >
            <option value="">-- เลือกผู้รับการดูแล --</option>
            {patients.map(p => {
              const pInfo = formatPatientDisplay(p);
              return (
                <option key={p.id} value={p.id}>
                  {pInfo.displayName} {pInfo.formattedNickname ? `${pInfo.formattedNickname} ` : ''}{pInfo.ageGroupTag} ({pInfo.ageDisplayText} | HN: {p.hn || p.id})
                </option>
              );
            })}
          </select>
        )}
      </div>
    );
  }

  const info = formatPatientDisplay(patient);
  const avatarChar = info.cleanNickname ? info.cleanNickname.slice(0, 1) : (info.cleanFirstName ? info.cleanFirstName.slice(0, 1) : (info.displayName ? info.displayName.replace(/^(ด\.ญ\.|ด\.ช\.|นาย|นาง|น\.ส\.)\s*/, '').slice(0, 1) : 'P'));
  const hasHeight = Boolean(patient.height && Number(patient.height) > 0);
  const hasWeight = Boolean(patient.weight && Number(patient.weight) > 0);

  const consistency = calculateConsistencyMetrics(patient);
  const checkedToday = hasCheckedInToday(patient);
  const statusDotColor = checkedToday
    ? 'bg-emerald-500 ring-2 ring-emerald-200 animate-pulse'
    : consistency.status === 'ACTIVE'
    ? 'bg-emerald-500'
    : consistency.status === 'AT RISK'
    ? 'bg-amber-500'
    : consistency.status === 'DORMANT'
    ? 'bg-orange-500'
    : 'bg-rose-500';

  return (
    <div className={`bg-slate-50/95 backdrop-blur-xs p-3 sm:p-3.5 rounded-2xl border border-slate-200/90 flex flex-wrap items-center justify-between gap-3 shadow-2xs text-left ${className}`}>
      {/* Patient Info Group */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white font-black text-xs flex items-center justify-center shadow-2xs">
              {avatarChar}
            </div>
            <span
              className={`w-2.5 h-2.5 rounded-full absolute -top-0.5 -right-0.5 border-2 border-white ${statusDotColor}`}
              title={`สถานะ: ${consistency.status}${checkedToday ? ' (เช็กอินวันนี้แล้ว)' : ''}`}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-black text-slate-900 truncate">
                {info.displayName}
              </span>
              {info.formattedNickname && (
                <span className="text-xs text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                  {info.formattedNickname}
                </span>
              )}
              <span className={info.ageGroupBadge.badgeClass}>
                {info.ageGroupTag}
              </span>
            </div>
          </div>
        </div>

        {/* Compact Metadata Chips */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs font-bold">
          <span className="bg-purple-100/90 text-purple-800 px-2.5 py-0.5 rounded-md border border-purple-200/80">
            อายุ {info.ageDisplayText}
          </span>
          <span className="bg-slate-200/80 text-slate-700 px-2.5 py-0.5 rounded-md">
            HN: {patient.hn || '-'}
          </span>
          <span className="bg-emerald-100/90 text-emerald-800 px-2.5 py-0.5 rounded-md">
            สูง {hasHeight ? `${patient.height} ซม.` : '-'}
          </span>
          <span className="bg-blue-100/90 text-blue-800 px-2.5 py-0.5 rounded-md">
            หนัก {hasWeight ? `${patient.weight} กก.` : '-'}
          </span>
        </div>
      </div>

      {/* Switcher Dropdown */}
      {showSwitcher && patients.length > 1 && onSelectPatient && (
        <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
          <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">เปลี่ยนผู้รับการดูแล:</span>
          <select
            value={patient.id}
            onChange={(e) => onSelectPatient(e.target.value)}
            className="text-xs font-bold text-purple-700 hover:text-purple-900 bg-white hover:bg-purple-50/80 border border-purple-200 px-3 py-1.5 rounded-xl shadow-2xs focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer transition-all"
            aria-label="เปลี่ยนผู้รับการดูแล"
          >
            {patients.map(p => {
              const pInfo = formatPatientDisplay(p);
              return (
                <option key={p.id} value={p.id}>
                  {pInfo.displayName} {pInfo.formattedNickname ? `${pInfo.formattedNickname} ` : ''}{pInfo.ageGroupTag} ({pInfo.ageDisplayText} | HN: {p.hn || p.id})
                </option>
              );
            })}
          </select>
        </div>
      )}
    </div>
  );
}
