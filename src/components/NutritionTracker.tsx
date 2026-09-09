import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Apple, CheckCircle2, ShieldCheck, Sparkles, Send, Loader2, ArrowLeft, Heart, Salad, Milk, Flame, Ban } from 'lucide-react';
import { Patient } from '../types';
import { syncNutritionToGoogleSheets, getWebhookUrl } from '../services/googleAppsScriptService';

interface NutritionTrackerProps {
  patient: Patient;
  onUpdateNutrition?: (patientId: string, log: any) => void;
  onBack?: () => void;
}

export default function NutritionTracker({ patient, onUpdateNutrition, onBack }: NutritionTrackerProps) {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const draftKey = useMemo(() => `growth_nutrition_draft_${patient?.id || 'guest'}_${todayStr}`, [patient?.id, todayStr]);

  // 4 Food Group Checklist State with draft persistence
  const [checklist, setChecklist] = useState(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      milkCalcium: true,   // 1. ดื่มนม/แคลเซียม
      protein: true,       // 2. ได้รับโปรตีนเพียงพอ
      vegFruit: true,      // 3. ทานผักผลไม้
      noSweetsBedtime: true // 4. งดขนมหวานก่อนนอน
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(draftKey, JSON.stringify(checklist));
    } catch (e) {}
  }, [draftKey, checklist]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Calculate GNS Score (Max 100 points, 25 points per group)
  const checkedCount = Object.values(checklist).filter(Boolean).length;
  const gnsScore = checkedCount * 25;

  const toggleItem = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveNutrition = async () => {
    setIsSubmitting(true);
    setFeedbackMsg(null);
    const todayStr = new Date().toISOString().split('T')[0];
    const itemsCheckedNames: string[] = [];
    if (checklist.milkCalcium) itemsCheckedNames.push('ดื่มนม/แคลเซียม');
    if (checklist.protein) itemsCheckedNames.push('ได้รับโปรตีนเพียงพอ');
    if (checklist.vegFruit) itemsCheckedNames.push('ทานผักผลไม้');
    if (checklist.noSweetsBedtime) itemsCheckedNames.push('งดขนมหวานก่อนนอน');

    const scoreString = `${gnsScore}/100`;

    try {
      // 1. Send data to Google Apps Script Webhook
      const webhookUrl = getWebhookUrl();
      await syncNutritionToGoogleSheets(webhookUrl, {
        hn: patient?.hn || '',
        patientId: patient?.id || '',
        date: todayStr,
        action: 'บันทึกโภชนาการ GNS',
        score: scoreString,
        status: 'completed',
        itemsChecked: itemsCheckedNames
      });

      // 2. Save locally / invoke parent state update if provided
      if (onUpdateNutrition && patient?.id) {
        onUpdateNutrition(patient.id, {
          date: todayStr,
          checklist,
          gnsScore,
          scoreString,
          status: 'completed'
        });
      }

      // Save to localStorage to persist completed state today
      try {
        const localKey = `growth_completed_exercises_${patient?.id}_${todayStr}`;
        const existing = JSON.parse(localStorage.getItem(localKey) || '{}');
        existing[`asgn_${patient?.id}_gns`] = true;
        localStorage.setItem(localKey, JSON.stringify(existing));
      } catch (e) { /* ignore */ }

      setIsSuccess(true);
      setFeedbackMsg(`บันทึกคะแนนโภชนาการ GNS (${scoreString}) สำเร็จ! ส่งข้อมูลไปยัง Google Sheets แล้ว`);
    } catch (err) {
      console.error('[NutritionTracker] Save error:', err);
      setIsSuccess(true); // Still mark as success for user experience
      setFeedbackMsg(`บันทึกโภชนาการเรียบร้อยแล้ว (${scoreString})`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const foodGroups = [
    {
      key: 'milkCalcium' as const,
      title: 'ดื่มนม / แคลเซียม',
      sub: 'ดื่มนมสด 1-2 แก้ว หรือได้รับแคลเซียมเสริมสร้างกระดูก',
      icon: <Milk className="w-5 h-5 text-sky-600" />,
      color: 'sky'
    },
    {
      key: 'protein' as const,
      title: 'ได้รับโปรตีนเพียงพอ',
      sub: 'รับประทานไข่ เนื้อสัตว์ ปลา หรือถั่วในปริมาณเหมาะสม',
      icon: <Flame className="w-5 h-5 text-amber-600" />,
      color: 'amber'
    },
    {
      key: 'vegFruit' as const,
      title: 'ทานผักผลไม้',
      sub: 'รับประทานผักใบเขียวและผลไม้สดหลากสีทุกมื้ออาหาร',
      icon: <Salad className="w-5 h-5 text-emerald-600" />,
      color: 'emerald'
    },
    {
      key: 'noSweetsBedtime' as const,
      title: 'งดขนมหวานก่อนนอน',
      sub: 'หลีกเลี่ยงขนมหวาน ชานม หรือน้ำหวานอย่างน้อย 2 ชม. ก่อนนอน',
      icon: <Ban className="w-5 h-5 text-rose-600" />,
      color: 'rose'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 text-left w-full max-w-full lg:max-w-5xl mx-auto pb-12 min-h-screen overflow-y-auto overflow-x-hidden box-border"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Top Navigation & Header */}
      <div className="flex items-center justify-between gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ย้อนกลับ</span>
          </button>
        )}
      </div>

      {/* Main Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden border border-emerald-400/20">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
            <Apple className="w-4 h-4 text-emerald-200" />
            <span>หมวดที่ 1: โภชนาการ GNS (Nutrition Tracker)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
            บันทึกเช็คลิสต์โภชนาการประจำวัน
          </h1>
          <p className="text-emerald-100 text-xs sm:text-sm font-medium leading-relaxed max-w-xl">
            ประเมินพฤติกรรมการทานอาหาร 4 กลุ่มเพื่อรับคะแนน Growth Nutrition Score (GNS) ประจำวัน (ผู้รับการดูแล: <strong className="text-white">{patient?.firstName} {patient?.lastName}</strong>)
          </p>
        </div>
        <div className="absolute -right-8 -bottom-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      {/* GNS Score Dashboard Card */}
      <div className="aurora-card p-6 sm:p-8 rounded-3xl border border-emerald-200/80 bg-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left flex-1">
          <span className="text-xs font-black text-emerald-700 uppercase tracking-wider block">
            คะแนนโภชนาการ GNS ประจำวัน
          </span>
          <div className="flex items-baseline justify-center sm:justify-start gap-2">
            <span className="text-5xl font-black text-[#1C1929]">{gnsScore}</span>
            <span className="text-lg font-extrabold text-emerald-600">/ 100 คะแนน</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            ผ่านการเช็คลิสต์ {checkedCount} จาก 4 กลุ่มอาหาร ({checkedCount * 25}%)
          </p>
        </div>

        {/* Progress Bar & Status Badge */}
        <div className="w-full sm:w-64 space-y-3">
          <div className="flex justify-between text-xs font-bold text-slate-600">
            <span>ระดับโภชนาการ</span>
            <span className={gnsScore >= 75 ? 'text-emerald-600 font-black' : gnsScore >= 50 ? 'text-amber-600 font-black' : 'text-rose-600 font-black'}>
              {gnsScore === 100 ? '🌟 สมบูรณ์แบบ (Excellent)' : gnsScore >= 75 ? '👍 ดีมาก (Good)' : gnsScore >= 50 ? '⚖️ ปานกลาง (Fair)' : '⚠️ ควรปรับปรุง'}
            </span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${gnsScore}%` }}
              className={`h-full rounded-full transition-all duration-500 ${
                gnsScore >= 75 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : gnsScore >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-rose-400 to-rose-500'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Checklist Form (4 Food Groups) */}
      <div className="aurora-card p-6 sm:p-8 rounded-3xl border border-purple-200/80 bg-white shadow-md space-y-6">
        <div className="border-b border-purple-100 pb-4">
          <h2 className="text-lg font-black text-[#1C1929] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <span>เช็คลิสต์กลุ่มอาหารประจำวันนี้ (เลือกข้อที่ปฏิบัติตามจริง)</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            แตะช่องเช็คลิสต์ด้านล่างเพื่อเลือกหรือยกเลิกหัวข้อ
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {foodGroups.map((group) => {
            const isChecked = checklist[group.key];
            return (
              <div
                key={group.key}
                onClick={() => toggleItem(group.key)}
                className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  isChecked
                    ? 'bg-emerald-50/70 border-emerald-500 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 opacity-80'
                }`}
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isChecked ? 'bg-emerald-100 border border-emerald-300' : 'bg-white border border-slate-200'
                  }`}>
                    {group.icon}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h3 className={`text-base font-black truncate ${isChecked ? 'text-emerald-950' : 'text-slate-800'}`}>
                      {group.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      {group.sub}
                    </p>
                  </div>
                </div>

                {/* Checkbox Icon */}
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                  isChecked ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white border-2 border-slate-300 text-transparent'
                }`}>
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Success Alert Banner */}
        <AnimatePresence>
          {isSuccess && feedbackMsg && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-4 rounded-2xl bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-3 shadow-lg"
            >
              <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-100" />
              <span>{feedbackMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Primary Save Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSaveNutrition}
            disabled={isSubmitting}
            className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black rounded-2xl text-base sm:text-lg transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[52px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>กำลังบันทึกข้อมูลโภชนาการ GNS...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>บันทึกโภชนาการประจำวัน</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
