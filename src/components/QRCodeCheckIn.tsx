import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  QrCode, User, CheckCircle2, ShieldCheck, Printer, 
  Download, Share2, ArrowLeft, Plus, Search, Check, Copy, Sparkles, Smartphone, Link as LinkIcon
} from 'lucide-react';
import { Patient, ClinicSettings } from '../types';
import { generateQRDataURL, getParticipantDeepLink, createDownloadableQRCanvas, CHECKIN_BASE_URL } from '../utils/qrCodeGenerator';

interface QRCodeCheckInProps {
  patients: Patient[];
  settings?: ClinicSettings;
  onSelectPatient: (patientId: string) => void;
  onNavigate: (tab: string, patientId?: string, subTab?: string, autoAdd?: boolean) => void;
  onBack?: () => void;
  onCheckIn?: (patientId: string, source: 'QR' | 'APP') => void;
}

export default function QRCodeCheckIn({ patients, settings, onSelectPatient, onNavigate }: QRCodeCheckInProps) {
  const [selectedPatId, setSelectedPatId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFeedback, setActionFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [activeQRDataUrl, setActiveQRDataUrl] = useState<string>('');
  const [isQRGenerating, setIsQRGenerating] = useState<boolean>(false);
  const [isQRError, setIsQRError] = useState<boolean>(false);
  const [useInternalFallback, setUseInternalFallback] = useState<boolean>(false);
  const qrCardRef = useRef<HTMLDivElement>(null);

  // Selected patient object when viewing detail
  const activePatient = selectedPatId ? patients.find(p => p.id === selectedPatId) : null;

  // Generate real QR whenever activePatient changes
  const generateActiveQR = React.useCallback(async (forceFallback = false) => {
    if (!activePatient) {
      setActiveQRDataUrl('');
      setIsQRGenerating(false);
      setIsQRError(false);
      setUseInternalFallback(false);
      return;
    }

    setIsQRGenerating(true);
    setIsQRError(false);

    if (forceFallback) {
      setUseInternalFallback(true);
      setIsQRGenerating(false);
      return;
    }

    try {
      const deepLink = getParticipantDeepLink(activePatient);
      const url = await generateQRDataURL(deepLink, { width: 400, margin: 2, timeoutMs: 5000 });
      if (!url) {
        throw new Error('QR URL is empty');
      }
      setActiveQRDataUrl(url);
      setUseInternalFallback(false);
      setIsQRError(false);
    } catch (err) {
      console.warn('[QRCodeCheckIn] Failed to generate QR URL, using internal fallback:', err);
      setUseInternalFallback(true);
      setIsQRError(false);
    } finally {
      setIsQRGenerating(false);
    }
  }, [activePatient]);

  useEffect(() => {
    setUseInternalFallback(false);
    generateActiveQR(false);
  }, [generateActiveQR]);

  // Filtered patient list
  const filteredPatients = (patients || []).filter(p => {
    if (!p) return false;
    const term = (searchTerm || '').toLowerCase();
    return (p.firstName || '').toLowerCase().includes(term) ||
           (p.lastName || '').toLowerCase().includes(term) ||
           (p.nickname || '').toLowerCase().includes(term) ||
           (p.hn || '').toLowerCase().includes(term);
  });

  // Trigger Action Feedback
  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setActionFeedback({ text, type });
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // Handler: Real Download QR as PNG File
  const handleDownloadQR = async (patient: Patient) => {
    try {
      const token = patient.qrToken || patient.id;
      const deepLink = getParticipantDeepLink(patient);
      const qrDataUrl = await generateQRDataURL(deepLink, { width: 400, margin: 2 });
      
      if (!qrDataUrl) {
        showFeedback('ไม่สามารถสร้างรูปภาพ QR ได้ในขณะนี้', 'error');
        return;
      }

      const downloadablePng = await createDownloadableQRCanvas(patient, qrDataUrl, settings?.clinicName);
      const link = document.createElement('a');
      link.download = `QR_${patient.hn}_${patient.nickname || patient.firstName}.png`;
      link.href = downloadablePng;
      link.click();
      showFeedback(`✓ ดาวน์โหลดภาพ QR Code ของ ${patient.nickname || patient.firstName} เรียบร้อยแล้ว`);
    } catch (err) {
      console.error(err);
      showFeedback('เกิดข้อผิดพลาดในการดาวน์โหลดรูปภาพ', 'error');
    }
  };

  // Handler: Real Print QR Function
  const handlePrintQR = () => {
    window.print();
  };

  // Handler: Share QR / Copy Link
  const handleShareQR = (patient: Patient) => {
    const token = patient.qrToken || patient.id;
    const qrLink = getParticipantDeepLink(patient);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(qrLink).then(() => {
        showFeedback(`✓ คัดลอกลิงก์ Check-in ของ ${patient.nickname || patient.firstName} เรียบร้อยแล้ว`);
      }).catch(() => {
        showFeedback(`ลิงก์สำหรับเข้าใช้งาน: ${qrLink}`);
      });
    } else {
      showFeedback(`ลิงก์สำหรับเข้าใช้งาน: ${qrLink}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 text-left w-full max-w-full lg:max-w-7xl mx-auto pb-12 overflow-x-hidden box-border"
    >
      {/* Toast Feedback Notification */}
      {actionFeedback && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-5 right-5 z-50 px-5 py-3.5 rounded-2xl shadow-xl border backdrop-blur-md text-xs font-bold flex items-center gap-2.5 ${
            actionFeedback.type === 'error' 
              ? 'bg-rose-500 text-white border-rose-600' 
              : 'bg-emerald-600 text-white border-emerald-700'
          }`}
        >
          {actionFeedback.type === 'error' ? (
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">✕</div>
          ) : (
            <CheckCircle2 className="w-5 h-5 text-white" />
          )}
          <span>{actionFeedback.text}</span>
        </motion.div>
      )}

      {/* DETAIL / SINGLE CARD VIEW */}
      {activePatient ? (
        <div className="space-y-6">
          {/* Back & Breadcrumb Row */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSelectedPatId(null)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 text-xs font-bold transition-all shadow-2xs cursor-pointer min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              <span>กลับหน้ารายการ QR Code</span>
            </button>

            <div className="text-xs text-slate-500 font-medium">
              การดูแล: <strong className="text-slate-900">{activePatient.firstName} {activePatient.lastName}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Col: Printable QR Card Preview */}
            <div className="lg:col-span-6 flex flex-col items-center">
              <div 
                ref={qrCardRef}
                className="w-full max-w-sm bg-gradient-to-b from-white via-purple-50/30 to-indigo-50/40 p-8 rounded-3xl border-2 border-purple-200 shadow-lg flex flex-col items-center text-center space-y-6 print:m-0 print:border-none print:shadow-none print:w-full"
              >
                <div className="flex items-center gap-2 bg-purple-100 text-purple-800 px-3.5 py-1 rounded-full text-xs font-black">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>{settings?.clinicName ? settings.clinicName.toUpperCase() : 'GROWTH LAB CLINICAL QR'}</span>
                </div>

                {/* Participant Header */}
                <div className="space-y-1">
                  <h2 className="text-xl font-black text-slate-900">
                    {activePatient.firstName} {activePatient.lastName}
                  </h2>
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-purple-700">
                    <span>น้อง{activePatient.nickname || activePatient.firstName}</span>
                    <span>•</span>
                    <span className="font-mono bg-white px-2 py-0.5 rounded-md border border-purple-100">
                      HN: {activePatient.hn}
                    </span>
                  </div>
                </div>

                {/* Real Scannable QR Visual */}
                <div className="p-4 bg-white rounded-3xl border border-purple-100 shadow-md">
                  <div className="w-48 h-48 sm:w-56 sm:h-56 bg-white rounded-2xl flex flex-col items-center justify-center p-2 relative overflow-hidden group">
                    {isQRGenerating ? (
                      <div className="flex flex-col items-center justify-center text-purple-700 gap-2">
                        <div className="w-8 h-8 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                        <span className="text-xs font-bold animate-pulse">กำลังสร้าง QR...</span>
                      </div>
                    ) : isQRError ? (
                      <div className="flex flex-col items-center justify-center text-center p-2 space-y-2 text-amber-900">
                        <p className="text-[11px] font-bold leading-tight">
                          ⚠️ ไม่สามารถสร้าง QR ได้ในขณะนี้ กรุณากดปุ่มสร้างใหม่อีกครั้ง
                        </p>
                        <button
                          type="button"
                          onClick={() => generateActiveQR(true)}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                        >
                          ลองใหม่อีกครั้ง (Retry)
                        </button>
                      </div>
                    ) : useInternalFallback ? (
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(getParticipantDeepLink(activePatient) || CHECKIN_BASE_URL)}`}
                        alt={`QR Code for ${activePatient.firstName}`}
                        className="w-full h-full object-contain bg-white p-1 rounded-md"
                      />
                    ) : activeQRDataUrl ? (
                      <img 
                        src={activeQRDataUrl} 
                        alt={`QR Code for ${activePatient.firstName}`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                        <QrCode className="w-8 h-8" />
                        <span className="text-xs">ไม่มีข้อมูล QR Code</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* QR Deep Link Info */}
                <div className="space-y-1.5 w-full">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Individual Verification QR Token
                  </p>
                  <div className="bg-white px-3 py-2 rounded-xl border border-purple-100 text-xs font-mono font-bold text-slate-700 select-all flex items-center justify-between">
                    <span className="truncate">{activePatient.qrToken || `tok_${activePatient.id}_${activePatient.hn}`}</span>
                    <button
                      type="button"
                      onClick={() => handleShareQR(activePatient)}
                      className="text-purple-600 hover:text-purple-800 p-1 cursor-pointer"
                      title="คัดลอกลิงก์ Check-in"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 pt-1">
                    สแกนด้วยกล้องมือถือเพื่อเข้าสู่หน้าแบบฝึกหัดและบันทึก Check-in รายวัน
                  </p>
                </div>
              </div>
            </div>

            {/* Right Col: Quick Actions & Management */}
            <div className="lg:col-span-6 space-y-6">
              
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">การจัดการ QR Code ประจำตัว</h3>
                    <p className="text-xs text-slate-500">ดาวน์โหลดหรือพิมพ์เพื่อมอบให้การดูแลและผู้ปกครอง</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {/* Download PNG */}
                  <button
                    type="button"
                    onClick={() => handleDownloadQR(activePatient)}
                    className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold py-3 px-4 rounded-2xl border border-purple-200 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs min-h-[44px]"
                  >
                    <Download className="w-4 h-4 text-purple-600" />
                    <span>ดาวน์โหลด PNG</span>
                  </button>

                  {/* Print QR */}
                  <button
                    type="button"
                    onClick={handlePrintQR}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-3 px-4 rounded-2xl border border-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs min-h-[44px]"
                  >
                    <Printer className="w-4 h-4 text-indigo-600" />
                    <span>พิมพ์การ์ด</span>
                  </button>

                  {/* Share QR */}
                  <button
                    type="button"
                    onClick={() => handleShareQR(activePatient)}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-xs min-h-[44px]"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>แชร์ลิงก์</span>
                  </button>
                </div>
              </div>

              {/* Instructions Box */}
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-purple-600" />
                  <span>คำแนะนำการใช้งานสำหรับการดูแล</span>
                </h4>
                <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside leading-relaxed">
                  <li>ใช้กล้องโทรศัพท์มือถือ หรือแอปพลิเคชันสแกน QR Code ทั่วไป สแกนภาพ QR Code</li>
                  <li>ระบบจะเปิดหน้าระบบและเข้าสู่โปรแกรมของผู้เข้าร่วมรายนั้นโดยตรง</li>
                  <li>ผู้เข้าร่วมสามารถกด Check-in ประจำวัน และทำแบบฝึกหัดที่ได้รับมอบหมายได้ทันที</li>
                </ul>
              </div>

            </div>

          </div>
        </div>
      ) : (
        /* LIST VIEW OF PATIENTS QR CODES */
        <div className="space-y-6">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-indigo-800 via-purple-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                <QrCode className="w-4 h-4" />
                <span>Permanent QR Management System</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">ระบบจัดการ QR Code ประจำตัวการดูแล</h1>
              <p className="text-purple-100 text-xs sm:text-sm leading-relaxed max-w-xl">
                เลือกการดูแลเพื่อดู ดาวน์โหลด หรือพิมพ์การ์ด QR Code สำหรับมอบให้การดูแลและผู้ปกครองใช้งาน
              </p>
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onNavigate('ผู้เข้าโปรแกรม', undefined, undefined, true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-3 rounded-2xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span>+ เพิ่มการดูแล</span>
              </button>
            </div>
          </div>

          {/* Search Bar Row */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อ หรือ HN เพื่อจัดการ QR Code..."
              className="w-full text-xs font-medium outline-none bg-transparent text-slate-800"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-xs text-slate-400 hover:text-slate-600">
                ล้าง
              </button>
            )}
          </div>

          {/* Patient QR Directory Table/Cards */}
          {filteredPatients.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                <QrCode className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">ไม่พบรายชื่อผู้รับการดูแลในระบบ</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                คุณสามารถกดปุ่ม "+ เพิ่มการดูแล" ด้านบน เพื่อลงทะเบียนผู้รับการดูแลรายใหม่ และสร้าง QR Code ประจำตัวได้ทันที
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPatients.map((p) => (
                <div 
                  key={p.id}
                  className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-sm">
                        {p.nickname ? p.nickname[0] : p.firstName[0]}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 group-hover:text-purple-700 transition-colors">
                          {p.firstName} {p.lastName}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium">
                          น้อง{p.nickname || p.firstName} • <span className="font-mono text-purple-700 font-bold">HN: {p.hn}</span>
                        </p>
                      </div>
                    </div>
                    
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      QR พร้อมใช้
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-600">
                      <QrCode className="w-4 h-4 text-purple-600" />
                      <span className="truncate max-w-[160px]">{p.qrToken || `GL-${p.hn}`}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleShareQR(p)}
                      className="text-purple-600 hover:text-purple-800 text-[11px] font-bold cursor-pointer"
                    >
                      คัดลอก
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSelectedPatId(p.id)}
                      className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>ดูการ์ด QR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadQR(p)}
                      className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>โหลดรูป</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}
    </motion.div>
  );
}
