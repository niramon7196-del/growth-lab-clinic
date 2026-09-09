import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  Sparkles, 
  CheckCircle2, 
  RefreshCw, 
  X, 
  ShieldCheck, 
  Zap,
  ArrowRight
} from 'lucide-react';
import { 
  VersionNotificationState, 
  subscribeVersionState, 
  dismissNotification, 
  applyUpdateAndReload,
  CURRENT_APP_VERSION,
  checkRemoteVersion,
  simulateLiveUpdate,
  simulateFirstLaunch,
  simulateUpdatePrompt
} from '../services/versionService';
import { playSuccessChime } from '../utils/audioUtils';

interface VersionNotificationToastProps {
  showDevControls?: boolean;
}

export const VersionNotificationToast: React.FC<VersionNotificationToastProps> = ({ 
  showDevControls = false 
}) => {
  const [notification, setNotification] = useState<VersionNotificationState | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeVersionState((state) => {
      setNotification(state);
      if (state?.type === 'live_updated' || state?.type === 'first_launch') {
        playSuccessChime();
      }
    });
    return unsubscribe;
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {notification && (
          <div className="fixed top-4 left-0 right-0 z-[99999] flex justify-center pointer-events-none px-4">
            <motion.div
              key={notification.type}
              initial={{ opacity: 0, y: -24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="pointer-events-auto max-w-lg w-full shadow-2xl rounded-2xl overflow-hidden border backdrop-blur-md"
            >
              {/* 0. Update Available State (Interactive Toast) */}
              {notification.type === 'update_available' && (
                <div className="bg-white/95 backdrop-blur-md text-slate-800 p-4 sm:p-5 border-2 border-purple-400/80 shadow-[0_12px_40px_rgba(124,58,237,0.22)] rounded-2xl">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-500/25">
                      <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                          {notification.message}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200">
                          ใหม่
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                        {notification.subMessage || 'มีการปรับปรุงประสิทธิภาพและระบบงาน แนะนำให้อัปเดตเพื่อการใช้งานที่ดีที่สุด'}
                      </p>

                      {/* Action buttons */}
                      <div className="mt-3.5 flex items-center gap-2.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => applyUpdateAndReload(notification.targetVersion || CURRENT_APP_VERSION)}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-800 hover:to-indigo-800 shadow-md shadow-purple-600/25 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>อัปเดตทันที (รีเฟรชหน้าเว็บ)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => dismissNotification()}
                          className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100/80 transition-colors cursor-pointer"
                        >
                          ไว้ภายหลัง
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => dismissNotification()}
                      className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors shrink-0 cursor-pointer"
                      title="ปิด"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* 1. Live Updating State */}
              {notification.type === 'updating' && (
                <div className="bg-gradient-to-r from-amber-500/95 via-orange-500/95 to-amber-600/95 text-white p-4 sm:p-4.5 border-amber-300/40 shadow-amber-500/20 shadow-xl">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-inner">
                      <RefreshCw className="w-5 h-5 text-white animate-spin" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base font-black tracking-tight drop-shadow-xs">
                          {notification.message}
                        </span>
                        {notification.targetVersion && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/25 text-white border border-white/30">
                            {notification.targetVersion}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-amber-50/95 font-medium mt-0.5 leading-relaxed">
                        {notification.subMessage || 'ระบบจะรีเฟรชหน้าจอให้อัตโนมัติในสักครู่...'}
                      </p>
                      
                      {/* Animated Progress bar */}
                      <div className="w-full h-1.5 bg-black/15 rounded-full mt-2.5 overflow-hidden">
                        <motion.div 
                          initial={{ width: '0%' }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 1.8, ease: 'easeInOut' }}
                          className="h-full bg-white rounded-full shadow-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Live Update Completed State */}
              {notification.type === 'live_updated' && (
                <div className="bg-gradient-to-r from-emerald-600/95 via-teal-600/95 to-emerald-700/95 text-white p-4 sm:p-4.5 border-emerald-400/40 shadow-emerald-600/25 shadow-xl">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-inner">
                      <Sparkles className="w-5 h-5 text-white animate-bounce" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm sm:text-base font-black tracking-tight drop-shadow-xs">
                          {notification.message}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/25 text-white border border-white/30 shadow-2xs">
                          {notification.currentVersion}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-50/95 font-medium mt-0.5 leading-relaxed">
                        {notification.subMessage || 'ระบบพร้อมใช้งานเต็มประสิทธิภาพ'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => dismissNotification()}
                      className="p-1.5 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition-colors shrink-0 cursor-pointer"
                      title="ปิดการแจ้งเตือน"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* 3. First Launch After Update State (Gentle Green Banner) */}
              {notification.type === 'first_launch' && (
                <div className="bg-white/95 backdrop-blur-md text-slate-800 p-4 border-2 border-emerald-500/50 shadow-emerald-500/15 shadow-xl">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs border border-emerald-200">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm sm:text-base font-black text-emerald-950 tracking-tight">
                          {notification.message}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {notification.currentVersion}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-0.5 leading-relaxed">
                        {notification.subMessage || 'แอปพลิเคชันทำงานเป็นปกติและทันสมัยที่สุด'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => dismissNotification()}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors shrink-0 cursor-pointer"
                      title="ปิดการแจ้งเตือน"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Optional Development / Admin Manual Test Controls */}
      {showDevControls && (
        <div className="fixed bottom-4 right-4 z-50 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 shadow-xl text-xs flex flex-col gap-2 max-w-xs">
          <div className="flex items-center justify-between font-bold text-slate-800">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Version Engine ({CURRENT_APP_VERSION})</span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => simulateUpdatePrompt('v1.2.0')}
              className="col-span-2 px-2 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors cursor-pointer text-center"
            >
              🔔 ทดสอบหน้าต่างแจ้งเตือนอัปเดต (v1.2.0)
            </button>
            <button
              type="button"
              onClick={() => simulateLiveUpdate('v1.2.0')}
              className="px-2 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition-colors cursor-pointer"
            >
              Test Live Update
            </button>
            <button
              type="button"
              onClick={() => simulateFirstLaunch('v1.1.0')}
              className="px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
            >
              Test 1st Launch
            </button>
          </div>
        </div>
      )}
    </>
  );
};
