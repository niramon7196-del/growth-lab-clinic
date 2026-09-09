import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Mail, Eye, EyeOff, AlertCircle, Sparkles, CheckCircle2, X } from 'lucide-react';
import { adminAccountService, AdminAccount } from '../services/adminAccountService';
import { authService } from '../services/authService';
import { Logo } from './Logo';

interface InitialAdminSetupModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess: (account: AdminAccount) => void;
  titleOverride?: string;
  isInitialSetup?: boolean;
}

export default function InitialAdminSetupModal({
  isOpen,
  onClose,
  onSuccess,
  titleOverride,
  isInitialSetup = true
}: InitialAdminSetupModalProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
  const [adminName, setAdminName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!adminName.trim()) {
      setError('กรุณาระบุชื่อผู้ดูแลระบบ');
      return;
    }
    if (!username.trim()) {
      setError('กรุณาระบุชื่อผู้ใช้หรืออีเมล');
      return;
    }
    if (!password) {
      setError('กรุณาระบุรหัสผ่าน');
      return;
    }
    if (password !== confirmPassword) {
      setError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }
    if (password.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await adminAccountService.createAdminAccount({
        name: adminName,
        username,
        password,
        confirmPassword
      });

      if (!res.success || !res.account) {
        setError(res.error || 'ไม่สามารถสร้างบัญชีผู้ดูแลระบบได้');
        setIsSubmitting(false);
        return;
      }

      // Auto login as newly created Admin
      authService.login('ADMIN', undefined, res.account.name, res.account.permissions, res.account.username);
      onSuccess(res.account);
    } catch (err) {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="aurora-card relative p-6 sm:p-8 rounded-[32px] shadow-2xl border border-purple-200/80 max-w-lg w-full text-left space-y-6 my-auto">
        
        {/* Close Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-purple-100/60 transition-all cursor-pointer z-10"
            title="ปิด / กลับสู่หน้าเข้าสู่ระบบ"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header Branding */}
        <div className="text-center space-y-3 pt-1">
          <div className="flex justify-center">
            <Logo className="w-48 h-auto object-contain drop-shadow-sm" />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100/80 border border-purple-200/70 text-purple-900 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span>{isInitialSetup ? 'ตั้งค่าระบบผู้ดูแลระบบ (Initial Setup)' : 'สร้างบัญชีผู้ดูแลระบบ'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#1C1929] tracking-tight">
            {titleOverride || 'สร้างบัญชีผู้ดูแลระบบหลัก (Admin Account)'}
          </h2>
          <p className="text-xs sm:text-sm text-[#59556E] leading-relaxed">
            กรอกข้อมูลเพื่อสร้างบัญชีผู้ดูแลระบบของคุณ บัญชีนี้จะมีสิทธิ์จัดการระบบและข้อมูลทั้งหมด
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="flex items-center gap-3 p-3.5 bg-rose-50 border border-rose-200/80 rounded-2xl text-rose-700 text-xs font-bold animate-in zoom-in-95 duration-150">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Setup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Admin Display Name */}
          <div>
            <label className="block text-xs font-bold text-[#1C1929] mb-1.5 ml-1">
              ชื่อผู้ดูแลระบบ (Admin Name) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-purple-500" />
              </div>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="เช่น ผู้ดูแลระบบ Nira หรือ นิรมล"
                required
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-purple-200/80 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-[#FAF8FD] text-[#1C1929] font-medium"
              />
            </div>
            <span className="text-[11px] text-[#59556E] mt-1 ml-1 block">
              ชื่อนี้จะแสดงที่มุมขวาบนของ Header เมื่อเข้าสู่ระบบ
            </span>
          </div>

          {/* Username or Email */}
          <div>
            <label className="block text-xs font-bold text-[#1C1929] mb-1.5 ml-1">
              ชื่อผู้ใช้ หรือ อีเมล (Username / Email) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-purple-500" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="เช่น admin_nira หรือ admin@growthlab.com"
                required
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-purple-200/80 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-[#FAF8FD] text-[#1C1929] font-medium"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-[#1C1929] mb-1.5 ml-1">
              รหัสผ่าน (Password) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-purple-500" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="อย่างน้อย 6 ตัวอักษร"
                required
                className="w-full pl-10 pr-11 py-3 rounded-2xl border border-purple-200/80 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-[#FAF8FD] text-[#1C1929] font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-[#1C1929] mb-1.5 ml-1">
              ยืนยันรหัสผ่าน (Confirm Password) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-purple-500" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="ระบุรหัสผ่านใหม่อีกครั้ง"
                required
                className="w-full pl-10 pr-11 py-3 rounded-2xl border border-purple-200/80 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-[#FAF8FD] text-[#1C1929] font-medium"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center gap-3">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3.5 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold rounded-2xl transition-all cursor-pointer text-xs sm:text-sm border border-purple-200/70"
              >
                ยกเลิก / กลับหน้าหลัก
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3.5 bg-gradient-to-r from-purple-600 via-violet-600 to-pink-600 hover:from-purple-700 hover:via-violet-700 hover:to-pink-700 text-white font-bold rounded-2xl transition-all cursor-pointer shadow-lg shadow-purple-500/25 text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'กำลังสร้างบัญชี...' : 'ยืนยันสร้างบัญชีผู้ดูแลระบบ'}</span>
            </button>
          </div>
        </form>

        {/* Return to Login link */}
        {onClose && (
          <div className="pt-2 text-center border-t border-purple-100/70">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold text-purple-700 hover:text-purple-900 underline cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>← กลับสู่หน้าเข้าสู่ระบบ (Back to Login)</span>
            </button>
          </div>
        )}

        {/* Security Note */}
        <div className="pt-1 text-center">
          <p className="text-[10px] text-[#59556E] font-medium opacity-80">
            🔒 รหัสผ่านถูกเข้ารหัสความปลอดภัยด้วย SHA-256 ไม่มีการบันทึก Plain Text
          </p>
        </div>

      </div>
    </div>
  );
}

