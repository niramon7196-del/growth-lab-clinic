import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QrCode, Download, RotateCcw, CheckCircle2, AlertTriangle, X, Copy } from 'lucide-react';
import { Patient } from '../types';
import { createDownloadableQRCanvas, getParticipantDeepLink, CHECKIN_BASE_URL } from '../utils/qrCodeGenerator';
import { formatPatientDisplay } from '../utils/patientUtils';
import { useScrollLock } from '../utils';

interface PatientQRModalProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
  clinicName?: string;
}

export default function PatientQRModal({ patient, isOpen, onClose, clinicName }: PatientQRModalProps) {
  const [isError, setIsError] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [retryKey, setRetryKey] = useState<number>(0);

  // Lock background screen when QR modal is open
  useScrollLock(isOpen && !!patient);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setIsError(false);
      setDownloadSuccess(false);
      setCopied(false);
    }
  }, [isOpen, patient]);

  if (!isOpen || !patient) return null;

  const info = formatPatientDisplay(patient);
  const nameVal = info.fullFormattedWithAgeGroup;
  const rawHn = (patient.hn || patient.id || '').trim();
  const displayHn = patient.hn || 'HN-NEW';

  // Construct Google Apps Script deep link URL with patient HN
  const qrTargetUrl = getParticipantDeepLink(patient);

  // Use stable QR Server API image endpoint
  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrTargetUrl)}&_r=${retryKey}`;

  const handleRetry = () => {
    setIsError(false);
    setRetryKey(prev => prev + 1);
  };

  const handleDownload = async () => {
    if (!patient) return;
    try {
      setIsDownloading(true);
      const downloadablePng = await createDownloadableQRCanvas(patient, qrImageSrc, clinicName);
      const link = document.createElement('a');
      link.download = `QR_${patient.hn || 'HN'}_${patient.nickname || patient.firstName || 'NEW'}.png`;
      link.href = downloadablePng;
      link.click();

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('[PatientQRModal] Download QR error:', err);
      // Fallback direct image download
      const link = document.createElement('a');
      link.download = `QR_${patient.hn || 'HN'}_${patient.firstName || 'NEW'}.png`;
      link.href = qrImageSrc;
      link.target = '_blank';
      link.click();
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyLink = () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(qrTargetUrl).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        }).catch(() => {
          fallbackCopyText(qrTargetUrl);
        });
      } else {
        fallbackCopyText(qrTargetUrl);
      }
    } catch (err) {
      console.error('[PatientQRModal] Copy link error:', err);
      fallbackCopyText(qrTargetUrl);
    }
  };

  const fallbackCopyText = (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Fallback copy failed:', e);
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overscroll-contain"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl border border-purple-200 shadow-2xl max-w-sm sm:max-w-md w-full flex flex-col max-h-[85vh] sm:max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ═══════════════════════════════════════════════════════════
              [ส่วนหัว (Header)] - ล็อคอยู่ด้านบนเสมอ shrink-0
          ═══════════════════════════════════════════════════════════ */}
          <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 bg-purple-50/70 shrink-0 z-10">
            <span className="text-xs sm:text-sm font-black text-purple-900 flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-purple-600 shrink-0" />
              QR CODE ประจำตัวผู้รับการดูแล
            </span>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 transition-colors cursor-pointer shrink-0 shadow-2xs"
              aria-label="ปิดหน้าต่าง"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              [ส่วนเนื้อหาตรงกลาง (Body)] - เลื่อนขึ้น-ลงอิสระ ลื่นไหล
          ═══════════════════════════════════════════════════════════ */}
          <div 
            className="flex-1 overflow-y-auto overscroll-contain p-5 text-center space-y-4 bg-white"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {/* Patient Details */}
            <div className="space-y-1.5">
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center justify-center gap-1.5 flex-wrap">
                <span>{info.displayName}</span>
                {info.formattedNickname && <span className="text-purple-600 font-bold">{info.formattedNickname}</span>}
                <span className={info.ageGroupBadge.fullBadgeClass}>{info.ageGroupTag}</span>
              </h3>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-black bg-purple-100 text-purple-900 px-3 py-1 rounded-full border border-purple-200 inline-block">
                  {displayHn.startsWith('HN-') ? displayHn : `HN-${displayHn}`}
                </span>
                <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200 inline-flex items-center gap-1">
                  อายุ {info.ageDisplayText}
                </span>
                {(patient.phone || patient.parentPhone) && (
                  <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200 inline-flex items-center gap-1">
                    📞 {patient.phone || patient.parentPhone}
                  </span>
                )}
              </div>
            </div>

            {/* QR Display Area with img tag & qrserver API */}
            <div className="p-4 bg-purple-50/40 rounded-2xl border border-purple-100 flex flex-col items-center justify-center min-h-[210px]">
              {isError ? (
                <div className="flex flex-col items-center justify-center space-y-3 py-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-amber-900 leading-relaxed max-w-[220px]">
                    ⚠️ ไม่สามารถโหลด QR ได้ในขณะนี้ กรุณากดปุ่มลองใหม่อีกครั้ง
                  </p>
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>ลองใหม่อีกครั้ง (Retry)</span>
                  </button>
                </div>
              ) : (
                <img
                  src={qrImageSrc}
                  alt={`QR Code for ${nameVal}`}
                  onError={() => setIsError(true)}
                  className="w-44 h-44 sm:w-48 sm:h-48 rounded-xl shadow-xs object-contain bg-white p-2 border border-slate-100"
                />
              )}
            </div>

            {/* Link URL Display */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-left">
              <span className="text-[10px] font-bold text-slate-500 block mb-0.5">ลิงก์ Check-in ประจำตัวคนไข้:</span>
              <div className="text-[11px] font-mono text-purple-700 break-all font-semibold select-all">
                {qrTargetUrl}
              </div>
            </div>

            {/* Action Buttons in Body */}
            <div className="space-y-2 pt-1">
              <p className="text-[11px] text-slate-500 font-medium">
                สแกนด้วยกล้องมือถือเพื่อเข้าสู่ระบบ Check-in ประจำตัวคนไข้
              </p>

              <button
                type="button"
                disabled={isDownloading || isError}
                onClick={handleDownload}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              >
                {isDownloading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>กำลังเตรียมไฟล์...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>ดาวน์โหลดไฟล์รูปภาพ QR Code (สำหรับพิมพ์)</span>
                  </>
                )}
              </button>

              <AnimatePresence>
                {downloadSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    พร้อมบันทึกรูปภาพ QR Code แล้ว
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl border border-purple-200 transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[40px] active:scale-98"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">✓ คัดลอกลิงก์ Check-in เรียบร้อยแล้ว</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>คัดลอกลิงก์ Check-in</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              [ส่วนท้าย (Footer)] - ล็อคอยู่ด้านล่างสุด shrink-0
          ═══════════════════════════════════════════════════════════ */}
          <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}


