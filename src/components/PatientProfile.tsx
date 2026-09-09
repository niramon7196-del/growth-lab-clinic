import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  User, Phone, Stethoscope, Heart, QrCode, ShieldCheck, 
  Calendar, MapPin, Info, ChevronRight, Check, Download,
  Camera, Target, Award, Sparkles, Clock, FileText, CheckCircle2,
  Smartphone, Copy, Share2
} from 'lucide-react';
import { Patient, ClinicSettings } from '../types';
import { generateQRDataURL, getParticipantDeepLink, createDownloadableQRCanvas } from '../utils/qrCodeGenerator';
import { compressImage } from '../utils/imageCompressor';
import { formatPatientDisplay } from '../utils/patientUtils';

interface PatientProfileProps {
  patient: Patient;
  settings: ClinicSettings;
  onUpdatePatient?: (updated: Patient) => void;
}

export default function PatientProfile({ patient, settings, onUpdatePatient }: PatientProfileProps) {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [avatar, setAvatar] = useState<string>(patient.avatarUrl || '');
  const [isSavingAvatar, setIsSavingAvatar] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const patientInfo = formatPatientDisplay(patient);

  const handleCopyPersonalLink = () => {
    const deepLink = getParticipantDeepLink(patient);
    navigator.clipboard.writeText(deepLink).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }).catch(() => {
      const fallbackUrl = `${window.location.origin}/?phone=${patient.parentPhone || patient.phone || patient.hn || patient.id}`;
      navigator.clipboard.writeText(fallbackUrl).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 3000);
      });
    });
  };

  useEffect(() => {
    setAvatar(patient.avatarUrl || patient.profile?.avatarUrl || '');
  }, [patient.avatarUrl, patient.profile?.avatarUrl]);

  useEffect(() => {
    const link = getParticipantDeepLink(patient);
    generateQRDataURL(link).then(url => setQrUrl(url)).catch(() => {});
  }, [patient.id, patient.qrToken]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSavingAvatar(true);
      const base64 = await compressImage(file, 200, 200, 0.7);
      if (!base64) return;
      setAvatar(base64);

      const updated: Patient = {
        ...patient,
        avatarUrl: base64,
        ...(patient.profile ? {
          profile: {
            ...patient.profile,
            avatarUrl: base64
          }
        } : {})
      };

      try {
        localStorage.setItem(`growth_patient_avatar_${patient.id}`, base64);
        if (patient.hn) {
          localStorage.setItem(`growth_patient_avatar_${patient.hn}`, base64);
        }
        localStorage.setItem('growth_current_patient_avatar', base64);

        // Also update local patient cache array in localStorage
        const keysToUpdate = ['growth_lab_patients', 'growthlab_patients'];
        keysToUpdate.forEach(k => {
          const raw = localStorage.getItem(k);
          if (raw) {
            try {
              const list = JSON.parse(raw);
              if (Array.isArray(list)) {
                const updList = list.map((p: any) => {
                  if (p.id === patient.id || (p.hn && patient.hn && p.hn.toLowerCase() === patient.hn.toLowerCase())) {
                    return { ...p, avatarUrl: base64, profile: { ...(p.profile || {}), avatarUrl: base64 } };
                  }
                  return p;
                });
                localStorage.setItem(k, JSON.stringify(updList));
              }
            } catch (e) {}
          }
        });

        window.dispatchEvent(new CustomEvent('growth_avatar_updated', { detail: { patientId: patient.id, avatarUrl: base64 } }));
      } catch (err) {
        console.error('[PatientProfile] Error persisting avatar:', err);
      }

      if (onUpdatePatient) {
        onUpdatePatient(updated);
      }
    } catch (err) {
      console.error('[PatientProfile] Failed to compress avatar:', err);
    } finally {
      setTimeout(() => {
        setIsSavingAvatar(false);
      }, 600);
    }
  };

  // Treatment goals fallback
  const defaultGoals = [
    { title: 'ปรับการหายใจทางจมูก 100% ทั้งกลางวันและกลางคืน', status: 'in_progress', category: 'Breathing' },
    { title: 'วางตำแหน่งลิ้นแนบเพดานปากขณะพัก (Proper Tongue Posture)', status: 'in_progress', category: 'OMT' },
    { title: 'ใส่เครื่องมือ EF สม่ำเสมอทุกคืนเพื่อขยายทางเดินหายใจ', status: 'completed', category: 'EF Appliance' },
    { title: 'จัดระเบียบการกลืนแบบผู้ใหญ่ (Adult Swallowing Pattern)', status: 'in_progress', category: 'Swallowing' }
  ];

  const goals = (patient.treatmentGoals && patient.treatmentGoals.length > 0)
    ? patient.treatmentGoals.map(g => ({ title: g, status: 'in_progress', category: 'OMT Goal' }))
    : defaultGoals;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-8 text-left w-full max-w-full pb-12 overflow-x-hidden box-border"
    >
      {/* A. Identity / Header Banner with Avatar Upload */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border-2 border-amber-400/60 shadow-lg p-5 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          
          {/* Avatar Area */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-slate-100 border-2 border-slate-200 overflow-hidden shadow-sm flex items-center justify-center">
              {avatar ? (
                <img 
                  src={avatar} 
                  alt={patient.firstName} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white text-3xl font-black">
                  {patient.firstName.charAt(0)}
                </div>
              )}
            </div>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 p-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-900 shadow-lg cursor-pointer transition-all hover:scale-105"
              title="เปลี่ยนรูปโปรไฟล์"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleAvatarChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          {/* Info Details */}
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-slate-100/80 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-600 border border-slate-200">
              <User className="w-3.5 h-3.5" />
              <span>Patient Profile Portfolio</span>
              <span className={patientInfo.ageGroupBadge.badgeClass}>
                {patientInfo.ageGroupTag}
              </span>
              {isSavingAvatar && (
                <span className="text-amber-600 font-bold ml-1 animate-pulse">✓ บันทึกรูปแล้ว</span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-tight">
              แฟ้มประวัติส่วนตัว {patientInfo.displayName} {patientInfo.formattedNickname ? `${patientInfo.formattedNickname} ` : ''}
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm md:text-base font-medium leading-relaxed">
              รหัสประจำตัว HN: <span className="font-mono font-bold text-slate-900">{patient.hn}</span> | อายุ: <span className="font-bold text-slate-900">{patientInfo.ageDisplayText}</span> | ดูแลโดย: {settings.doctorName} ({settings.clinicName})
            </p>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-slate-100 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* B. Growth Overview (Quick Stats) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border-2 border-amber-400/60 shadow-lg p-5 space-y-2">
          <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">อายุปัจจุบัน ({patientInfo.ageGroupTag})</span>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-[#252536]">{patientInfo.ageDisplayText}</span>
          </div>
          <div className="w-full h-1.5 bg-purple-50 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 w-full opacity-30"></div>
          </div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border-2 border-amber-400/60 shadow-lg p-5 space-y-2">
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">น้ำหนักล่าสุด</span>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-[#252536]">{patient.weight}</span>
            <span className="text-xs font-bold text-slate-400 mb-1.5">กก.</span>
          </div>
          <div className="w-full h-1.5 bg-blue-50 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 w-full opacity-30"></div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-2xl border-2 border-amber-400/60 shadow-lg p-5 space-y-2">
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">ส่วนสูงล่าสุด</span>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-[#252536]">{patient.height}</span>
            <span className="text-xs font-bold text-slate-400 mb-1.5">ซม.</span>
          </div>
          <div className="w-full h-1.5 bg-emerald-50 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 w-full opacity-30"></div>
          </div>
        </div>
      </div>

      {/* C. Goals & Treatment Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {/* Treatment Goals Section */}
          <div className="aurora-card p-6 lg:p-8 rounded-3xl space-y-6 bg-white border border-purple-200/70 shadow-sm">
            <div className="flex items-center justify-between border-b border-purple-100 pb-4">
              <h2 className="text-lg font-black text-[#252536] flex items-center gap-2.5">
                <Target className="w-5 h-5 text-purple-600" />
                <span>เป้าหมายการรักษาและการฝึก (Treatment Goals)</span>
              </h2>
              <span className="text-xs font-bold px-3 py-1 bg-purple-50 text-purple-800 rounded-full border border-purple-200">
                {goals.length} เป้าหมาย
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {goals.map((goal, idx) => (
                <div 
                  key={idx} 
                  className="p-4 rounded-2xl bg-purple-50/40 border border-purple-100/80 space-y-2 flex flex-col justify-between"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <span className="text-xs font-bold text-slate-800 leading-snug">
                      {goal.title}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-purple-100/60 text-[10px] font-medium">
                    <span className="text-purple-600 font-bold">{goal.category}</span>
                    <span className="text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full font-bold">
                      {goal.status === 'completed' ? '✓ สำเร็จแล้ว' : 'กำลังดำเนินการ'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Biometrics & Personal Details */}
          <div className="aurora-card p-6 lg:p-8 rounded-3xl space-y-6">
            <div className="flex items-center justify-between border-b border-purple-100/40 pb-4">
              <h2 className="text-lg font-black text-[#252536] font-sans flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
                <span>ข้อมูลส่วนบุคคลและกายภาพ</span>
              </h2>
              <div className="text-right">
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-100">
                  สถานะ: ปกติ
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/50 p-4 rounded-2xl border border-purple-100/40 space-y-1 shadow-xs">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">ชื่อ - นามสกุล</span>
                <span className="text-sm font-bold text-[#252536]">{patientInfo.displayName}</span>
              </div>
              <div className="bg-white/50 p-4 rounded-2xl border border-purple-100/40 space-y-1 shadow-xs">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">รหัส HN (เลขประจำตัว)</span>
                <span className="text-sm font-bold text-[#252536] font-mono">{patient.hn}</span>
              </div>
              <div className="bg-white/50 p-4 rounded-2xl border border-purple-100/40 space-y-1 shadow-xs">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">ชื่อเล่น (Nickname)</span>
                <span className="text-sm font-bold text-purple-700">{patientInfo.formattedNickname || '-'}</span>
              </div>
              <div className="bg-white/50 p-4 rounded-2xl border border-purple-100/40 space-y-1 shadow-xs">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">วันที่เริ่มโปรแกรม</span>
                <span className="text-sm font-bold text-[#252536]">{patient.startDate || '1 มกราคม 2567'}</span>
              </div>
            </div>
          </div>

          {/* Caregiver & Contact Details */}
          <div className="aurora-card p-6 lg:p-8 rounded-3xl space-y-6">
            <div className="flex items-center justify-between border-b border-purple-100/40 pb-4">
              <h2 className="text-lg font-black text-[#252536] font-sans flex items-center gap-3">
                <Phone className="w-5 h-5 text-indigo-600" />
                <span>ข้อมูลผู้ปกครองและช่องทางติดต่อ</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block">ผู้ปกครองหลัก</span>
                    <span className="text-sm font-bold text-[#252536]">{patient.parentName || 'คุณแม่ / ผู้ปกครอง'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">เบอร์โทรศัพท์</span>
                    <span className="text-sm font-bold text-[#252536] font-mono">{patient.parentPhone || '081-234-5678'}</span>
                  </div>
                </div>
              </div>

              {patient.address && (
                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-2 sm:col-span-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block">ที่อยู่คนไข้ (Address)</span>
                        <span className="text-sm font-bold text-[#252536] whitespace-pre-wrap">{patient.address}</span>
                      </div>
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(patient.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer border border-blue-100 shadow-xs"
                    >
                      🗺️ เปิดดูบน Google Maps
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* D. Action / QR Code & Sidebar Info */}
        <div className="space-y-6">
          {/* Save to Home Screen Guide Card */}
          <div className="aurora-card p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-purple-50 via-indigo-50/60 to-amber-50/50 border border-purple-200/80 shadow-sm space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-purple-200/60 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span className="text-base">📱</span>
                <span>วิธีเพิ่มแอปลงหน้าจอมือถือ</span>
              </h3>
              <span className="text-[10px] font-extrabold bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full border border-purple-200">
                ปลอดภัย 100%
              </span>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              เพิ่มไอคอนแอปไว้เปิดใช้งานได้สะดวกทุกวันบนมือถือ โดยไม่ต้องโหลดไฟล์ติดตั้งหรือสแกนความปลอดภัย:
            </p>

            <div className="space-y-2.5">
              {/* Android Box */}
              <div className="p-3 bg-white/95 rounded-2xl border border-emerald-200/80 shadow-2xs space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900">
                  <span className="text-sm">🤖</span>
                  <span>สำหรับ Android (Chrome)</span>
                </div>
                <p className="text-[11px] text-slate-700 font-semibold pl-5">
                  แตะจุด 3 จุดมุมขวาบน <span className="px-1 py-0.5 bg-slate-100 rounded border border-slate-300 font-mono text-xs">⋮</span> ➔ เลือก <strong className="text-emerald-800">"เพิ่มลงในหน้าจอหลัก"</strong>
                </p>
              </div>

              {/* iOS Box */}
              <div className="p-3 bg-white/95 rounded-2xl border border-blue-200/80 shadow-2xs space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-black text-blue-900">
                  <span className="text-sm">🍎</span>
                  <span>สำหรับ iPhone / iPad (Safari)</span>
                </div>
                <p className="text-[11px] text-slate-700 font-semibold pl-5">
                  แตะปุ่มแชร์ด้านล่าง <Share2 className="w-3.5 h-3.5 inline text-blue-600 mx-0.5" /> ➔ เลือก <strong className="text-blue-800">"เพิ่มไปยังหน้าจอโฮม"</strong>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyPersonalLink}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-800 hover:to-indigo-800 text-white font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-purple-400/30 active:scale-[0.99] mt-2"
            >
              {copiedLink ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>✓ คัดลอกลิงก์ส่วนตัวเรียบร้อยแล้ว!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>📲 คัดลอกลิงก์ส่วนตัวของคุณแม่/คนไข้</span>
                </>
              )}
            </button>
          </div>

          {/* QR Code Card */}
          <div className="aurora-card p-6 lg:p-8 rounded-3xl bg-white border border-purple-200/70 shadow-sm space-y-6 text-center">
            <div className="w-full flex items-center justify-between border-b border-purple-100/40 pb-4">
              <h3 className="text-sm font-black text-[#252536] uppercase tracking-wider flex items-center gap-2">
                <QrCode className="w-5 h-5 text-purple-600" />
                <span>QR Code ประจำตัว</span>
              </h3>
              <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full uppercase tracking-tighter">
                ACTIVE
              </span>
            </div>

            <div className="p-4 bg-white rounded-3xl shadow-inner border border-slate-100">
              {qrUrl ? (
                <img 
                  src={qrUrl} 
                  alt={`QR Code for ${patient.firstName}`}
                  className="w-48 h-48 object-contain rounded-xl mx-auto"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-slate-400 mx-auto">
                  <QrCode className="w-12 h-12 animate-pulse text-purple-400" />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <span className="text-sm font-black text-[#252536]">{patientInfo.displayName}</span>
              {patientInfo.formattedNickname && (
                <span className="text-xs font-bold text-purple-700 block">{patientInfo.formattedNickname}</span>
              )}
              <p className="text-xs font-black text-slate-400 font-mono">HN: {patient.hn}</p>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed bg-purple-50/50 p-4 rounded-2xl border border-purple-100 font-medium italic">
              "สแกน QR Code นี้เพื่อเปิดหน้าบันทึก Check-in และรับการบ้านประจำวัน"
            </p>
            
            {qrUrl && (
              <button 
                type="button"
                onClick={async () => {
                  try {
                    const downloadablePng = await createDownloadableQRCanvas(patient, qrUrl);
                    const link = document.createElement('a');
                    link.download = `QR_${patient.hn || 'HN'}_${patient.nickname || patient.firstName}.png`;
                    link.href = downloadablePng;
                    link.click();
                  } catch (err) {
                    console.error('Download QR error:', err);
                  }
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>ดาวน์โหลด QR Code (สำหรับพิมพ์)</span>
              </button>
            )}
          </div>

          {/* Quick Info / Clinic Info */}
          <div className="bg-gradient-to-br from-purple-700 to-indigo-800 p-6 lg:p-8 rounded-3xl text-white space-y-6 shadow-xl border border-purple-500/20 relative overflow-hidden">
            <div className="relative z-10 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Stethoscope className="w-4 h-4" />
                <span>ข้อมูลคลินิกที่ดูแล</span>
              </h4>
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-purple-200 uppercase tracking-widest">ชื่อคลินิก</span>
                  <p className="text-sm font-bold">{settings.clinicName}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-purple-200 uppercase tracking-widest">แพทย์ผู้ดูแล</span>
                  <p className="text-sm font-bold">{settings.doctorName}</p>
                </div>
                <div className="space-y-1 pt-2">
                  <div className="flex items-center gap-2 text-[10px] font-black text-emerald-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                    ระบบเชื่อมต่อสมบูรณ์
                  </div>
                </div>
              </div>
            </div>
            {/* Background pattern */}
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Heart className="w-24 h-24 rotate-12" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
