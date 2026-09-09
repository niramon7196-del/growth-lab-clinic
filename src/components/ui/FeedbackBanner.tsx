import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type FeedbackType = 'success' | 'error' | 'info' | 'warning';

interface FeedbackBannerProps {
  message: string | null;
  type: FeedbackType;
  onClose: () => void;
}

export default function FeedbackBanner({ message, type, onClose }: FeedbackBannerProps) {
  const getBannerStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'error':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'info':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'warning':
        return 'bg-amber-50 text-amber-850 border-amber-200';
      default:
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
  };

  const renderIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />;
      default:
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />;
    }
  };

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className={`fixed top-4 right-4 z-[9999] p-4 rounded-2xl shadow-xl flex items-center gap-3 border ${getBannerStyles()}`}
        >
          {renderIcon()}
          <span className="font-bold text-sm tracking-tight">{message}</span>
          <button onClick={onClose} className="ml-2 hover:opacity-70 text-lg leading-none cursor-pointer">×</button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
