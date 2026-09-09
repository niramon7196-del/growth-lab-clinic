import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Phone, Home, Sparkles, RefreshCw, QrCode } from 'lucide-react';
import { Patient } from '../types';
import { Logo } from './Logo';

interface Props {
  isLoading: boolean;
  patients: Patient[];
  onAutoLink: (patient: Patient) => void;
  onNavigateToPhoneLogin?: () => void;
  onGoHome?: () => void;
}

export default function ProfileLoadingFallback({
  isLoading,
  patients,
  onAutoLink,
  onNavigateToPhoneLogin,
  onGoHome
}: Props) {
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [hasResolved, setHasResolved] = useState(false);

  // Guarantee safety timeout limit for cloud fetching / patient resolution (10s for mobile data)
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    try {
      if (isLoading) {
        setTimeoutReached(false);
        timer = setTimeout(() => {
          console.warn('[ProfileLoadingFallback] 10-second timeout reached. Stopping spinner.');
          setTimeoutReached(true);
        }, 10000);
      } else {
        setTimeoutReached(false);
      }
    } catch (e) {
      console.error('[ProfileLoadingFallback] Timer setup error:', e);
      setTimeoutReached(true);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading]);

  const effectiveLoading = isLoading && !timeoutReached;

  useEffect(() => {
    if (!effectiveLoading && !hasResolved) {
      try {
        if (patients && patients.length > 0) {
          onAutoLink(patients[0]);
          setHasResolved(true);
          return;
        }
        // Check local storage directly for cached patients before giving up
        const rawLocal =
          localStorage.getItem('growthlab_patients_master') ||
          localStorage.getItem('growth_lab_patients') ||
          localStorage.getItem('growthlab_patients');
        if (rawLocal) {
          const parsed = JSON.parse(rawLocal);
          if (Array.isArray(parsed) && parsed.length > 0) {
            onAutoLink(parsed[0]);
            setHasResolved(true);
            return;
          }
        }
      } catch (e) {
        console.warn('[ProfileLoadingFallback] Local storage check error:', e);
      } finally {
        setHasResolved(true);
      }
    }
  }, [effectiveLoading, patients, onAutoLink, hasResolved]);

  // Handler for "เข้าสู่ระบบด้วยเบอร์โทรศัพท์"
  const handlePhoneLoginClick = () => {
    try {
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      localStorage.removeItem('growthlab_active_patient_hn');
      localStorage.removeItem('growth_lab_active_patient_hn');
      localStorage.removeItem('growth_lab_selected_patient_id');
    } catch (e) {}

    if (onNavigateToPhoneLogin) {
      onNavigateToPhoneLogin();
    } else {
      window.location.href = window.location.pathname + '?mode=patient&tab=phone';
    }
  };

  // Handler for "กลับหน้าหลัก"
  const handleGoHomeClick = () => {
    try {
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      localStorage.removeItem('growthlab_active_patient_hn');
      localStorage.removeItem('growth_lab_active_patient_hn');
      localStorage.removeItem('growth_lab_selected_patient_id');
    } catch (e) {}

    if (onGoHome) {
      onGoHome();
    } else {
      window.location.href = window.location.pathname + '?mode=select';
    }
  };

  return (
    <AnimatePresence mode="wait">
      {effectiveLoading ? (
        <motion.div
          key="qr-loading-screen"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center"
        >
          <div className="max-w-md w-full my-auto p-8 rounded-3xl text-center space-y-6 bg-white/90 backdrop-blur-xl border border-purple-200/80 shadow-2xl shadow-purple-500/10">
            {/* Brand Logo */}
            <div className="flex justify-center items-center">
              <Logo className="w-28 sm:w-32 h-auto object-contain" />
            </div>

            {/* Glowing Spinner & Animation */}
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/30 to-pink-500/30 animate-ping opacity-75" />
              <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin shadow-md" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-600 animate-pulse" />
              </div>
            </div>

            {/* Main Loading Message */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-black text-slate-800 leading-snug">
                ⏳ กำลังค้นหาข้อมูลคนไข้และเตรียมแบบฝึกหัด...
              </h3>
              <p className="text-xs sm:text-sm text-purple-700/80 font-medium">
                กำลังเชื่อมต่อฐานข้อมูล Google Sheets และระบบ Growth Lab
              </p>
            </div>

            {/* Shimmering Progress Bar Indicator */}
            <div className="w-full bg-purple-100 rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 rounded-full animate-[pulse_1.5s_infinite] w-full" />
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="qr-not-found-screen"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center"
        >
          <div className="aurora-modal max-w-md w-full my-auto p-6 sm:p-8 rounded-3xl text-center space-y-5 bg-white border border-rose-200 shadow-xl">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                ไม่พบโปรไฟล์ที่เชื่อมโยง
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium bg-rose-50/80 p-3.5 rounded-2xl border border-rose-100/80 text-rose-900">
                ระบบได้ค้นหาในฐานข้อมูล Google Sheets ครบถ้วนแล้ว แต่ไม่พบข้อมูลผู้รับการดูแลที่ตรงกับ QR Code นี้ กรุณาติดต่อคลินิก หรือเข้าสู่ระบบด้วยเบอร์โทรศัพท์
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={handlePhoneLoginClick}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Phone className="w-4 h-4 text-purple-200" />
                <span>เข้าสู่ระบบด้วยเบอร์โทรศัพท์</span>
              </button>

              <button
                type="button"
                onClick={handleGoHomeClick}
                className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-2xl border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Home className="w-4 h-4 text-slate-500" />
                <span>กลับหน้าหลัก / สแกนใหม่</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

