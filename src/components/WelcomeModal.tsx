import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, BookOpen, ArrowRight, X } from 'lucide-react';

interface WelcomeModalProps {
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

export default function WelcomeModal({ onClose, onNavigate }: WelcomeModalProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
  return (
    <div 
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 prevent-pull-refresh" 
      style={{ overscrollBehaviorY: 'contain' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div 
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-white/90 backdrop-blur-md w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-900/80 text-left p-6 sm:p-8 space-y-6 relative max-h-[90vh] overflow-y-auto"
      >
        <button type="button" onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer border border-slate-300"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-14 h-14 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center shadow-xs border border-purple-200">
          <Sparkles className="w-7 h-7 text-purple-700" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider bg-purple-100 text-purple-900 px-3 py-1 rounded-full border border-purple-200">
            Clinical Standard V1.0
          </span>
          <h2 className="text-2xl font-bold text-slate-950 tracking-tight">ยินดีต้อนรับสู่ Growth Lab</h2>
          <p className="text-sm text-slate-700 leading-relaxed font-medium">
            ระบบติดตามการเจริญเติบโต การฝึกกล้ามเนื้อช่องปาก และพฤติกรรมสุขภาพสำหรับเด็กและครอบครัว
          </p>
        </div>

        <div className="p-4 bg-purple-50/80 rounded-2xl border border-purple-200/80 text-xs text-slate-700 space-y-1.5">
          <p className="font-bold text-slate-950">💡 คำแนะนำสำหรับการเริ่มต้น:</p>
          <p>• เพิ่มข้อมูลผู้รับการดูแลในเมนู "ผู้รับการดูแล" เพื่อเริ่มต้นบันทึก</p>
          <p>• ใช้ระบบประเมิน GNS ประจำวันเพื่อคำนวณคะแนนโภชนาการอัตโนมัติ</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button type="button"
            onClick={() => {
              onClose();
              onNavigate('ผู้รับการดูแล');
            }}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 px-5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
          >
            <span>เริ่มต้นใช้งานทันที</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button type="button"
            onClick={() => {
              onClose();
              onNavigate('คู่มือการใช้งาน');
            }}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
          >
            <BookOpen className="w-4 h-4 text-purple-600" />
            <span>ดูคู่มือ</span>
          </button>
        </div>

        <div className="text-center pt-1">
          <button type="button" onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-600 font-medium underline cursor-pointer"
          >
            ข้ามขั้นตอนนี้
          </button>
        </div>
      </motion.div>
    </div>
  );
}
