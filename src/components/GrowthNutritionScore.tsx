import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Apple, CheckCircle2, TrendingUp, Calendar, Award, Sparkles, 
  AlertCircle, BookOpen, ClipboardList, ChevronRight, Info, 
  ArrowLeft, Trash2, Check, ShieldCheck, Heart, Users, FileText
} from 'lucide-react';
import { Patient, NutritionLog, EatingBehaviorChecklist, SourceStatus } from '../types';
import { GNS_SOURCE_STATUS } from '../data';
import OriginalReferenceModal from './OriginalReferenceModal';

interface GrowthNutritionScoreProps {
  patients: Patient[];
  selectedPatientId?: string;
  onUpdatePatientNutrition: (patientId: string, log: NutritionLog) => void;
  isPatientView?: boolean;
  onBack?: () => void;
}

export default function GrowthNutritionScore({ 
  patients, 
  selectedPatientId, 
  onUpdatePatientNutrition, 
  isPatientView,
  onBack 
}: GrowthNutritionScoreProps) {
  // Clinical Data Gate Check
  const isVerified = GNS_SOURCE_STATUS === 'VERIFIED';
  const isSourceRequired = GNS_SOURCE_STATUS === 'SOURCE_REQUIRED';

  const [activeTab, setActiveTab] = useState<'assessment' | 'history'>('assessment');
  const [showOriginalRef, setShowOriginalRef] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Date selection
  const [logDate, setLogDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // 1. Protein (+25)
  const [hasProtein, setHasProtein] = useState<boolean>(true);
  // 2. Calcium & Vit D (+25)
  const [hasCalcium, setHasCalcium] = useState<boolean>(true);
  // 3. Veg & Fruits (+25)
  const [hasVegFruit, setHasVegFruit] = useState<boolean>(true);
  // 4. Water (+15)
  const [hasWater, setHasWater] = useState<boolean>(true);
  // 5. Chewing Balance (+10)
  const [hasChewBalance, setHasChewBalance] = useState<boolean>(true);

  const currentPatient = selectedPatientId ? patients.find(p => p.id === selectedPatientId) : undefined;
  const patientLogs = currentPatient?.nutritionLogs || [];

  // CALCULATIONS (100 คะแนนเต็ม)
  const weeklyGnsScore = useMemo(() => {
    let score = 0;
    if (hasProtein) score += 25;
    if (hasCalcium) score += 25;
    if (hasVegFruit) score += 25;
    if (hasWater) score += 15;
    if (hasChewBalance) score += 10;
    return score;
  }, [hasProtein, hasCalcium, hasVegFruit, hasWater, hasChewBalance]);

  // Standard Evaluation Tiers from Source 01
  const getGnsTier = (score: number) => {
    if (score >= 90) return { label: '🌟 Excellent Growth Nutrition (ดีเยี่ยม)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: '🌟', badge: 'ดีเยี่ยม' };
    if (score >= 80) return { label: 'Very Good (ดีมาก)', color: 'bg-teal-100 text-teal-800 border-teal-300', icon: '✨', badge: 'ดีมาก' };
    if (score >= 70) return { label: '😊 Good (ดี/ผ่านเกณฑ์)', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: '😊', badge: 'ดี' };
    if (score >= 60) return { label: '⚠️ Needs Improvement (ควรปรับปรุง)', color: 'bg-amber-100 text-amber-800 border-amber-300', icon: '⚠️', badge: 'ควรปรับปรุง' };
    return { label: '🔴 High Priority (ความสำคัญสูงสุด)', color: 'bg-rose-100 text-rose-800 border-rose-300', icon: '🔴', badge: 'วิกฤต/ปรับด่วน' };
  };

  const currentTier = getGnsTier(weeklyGnsScore);

  // 5 Pillars Composite Score Calculation (20% each)
  const compositeBreakdown = useMemo(() => {
    const nutPillar = Math.round(weeklyGnsScore * 0.20);
    const sleepQuality = currentPatient?.sleepScore ? (currentPatient.sleepScore / 5) * 100 : 80;
    const sleepPillar = Math.round(sleepQuality * 0.20);
    const exerciseQuality = currentPatient?.exerciseScore ? (currentPatient.exerciseScore / 5) * 100 : 75;
    const exercisePillar = Math.round(exerciseQuality * 0.20);
    const orofacialPillar = currentPatient?.orofacialScore ? Math.round(currentPatient.orofacialScore * 0.20) : 16;
    const familyPillar = currentPatient?.familyParticipationScore ? Math.round(currentPatient.familyParticipationScore * 0.20) : 18;

    const totalComposite = nutPillar + sleepPillar + exercisePillar + orofacialPillar + familyPillar;
    return {
      nutPillar,
      sleepPillar,
      exercisePillar,
      orofacialPillar,
      familyPillar,
      totalComposite
    };
  }, [weeklyGnsScore, currentPatient]);

  const handleSubmitScore = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!currentPatient) {
      setFeedback({ text: 'กรุณาเลือกผู้รับการดูแลก่อนบันทึกคะแนน', type: 'error' });
      return;
    }

    const newLog: NutritionLog = {
      id: `nut_${currentPatient.id}_${Date.now()}`,
      date: logDate,
      protein: hasProtein ? 25 : 0,
      calciumVitD: hasCalcium ? 25 : 0,
      vegFruit: hasVegFruit ? 25 : 0,
      waterConsistency: hasWater ? 15 : 0,
      foodQuality: hasChewBalance ? 10 : 0,
      totalScore: weeklyGnsScore
    } as any;

    onUpdatePatientNutrition(currentPatient.id, newLog);
    setFeedback({ 
      text: `บันทึกคะแนน GNS ของ ${currentPatient.firstName.replace(/\s*\(DEMO\)/, "")} (${currentPatient.hn || ''}) เรียบร้อย! คะแนนรวม: ${weeklyGnsScore}/100`, 
      type: 'success' 
    });
    setTimeout(() => {
      setFeedback(null);
      if (onBack) onBack();
    }, 1500);
  };

  if (!currentPatient) {
    return (
      <div className="space-y-6 text-left w-full max-w-full lg:max-w-7xl mx-auto pb-12 overflow-x-hidden box-border">
        {onBack && (
          <button
            onClick={onBack}
            className="bg-white hover:bg-emerald-50 text-emerald-700 text-xs font-bold px-4 py-2.5 rounded-xl border border-emerald-200 shadow-2xs flex items-center gap-2 cursor-pointer transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-600" />
            <span>← กลับสู่ Dashboard</span>
          </button>
        )}
        <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 text-3xl">
            🍎
          </div>
          <h2 className="text-lg font-bold text-slate-800">ยังไม่ได้เลือกสมาชิกผู้รับการดูแล</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            กรุณาเลือกสมาชิกผู้รับการดูแลจากรายการแถบด้านบน เพื่อเข้าสู่ประเมิน GNS
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-8 text-left w-full max-w-full lg:max-w-7xl mx-auto pb-12 overflow-x-hidden box-border"
    >
      {/* Top Navigation & Context Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button
          onClick={onBack}
          className="bg-white hover:bg-emerald-50 text-emerald-700 text-xs font-bold px-4 py-2.5 rounded-xl border border-emerald-200 shadow-2xs flex items-center gap-2 cursor-pointer transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-600" />
          <span>← กลับสู่ Dashboard</span>
        </button>
      </div>

      {/* Identity Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 text-white p-6 md:p-8 rounded-3xl shadow-lg relative overflow-hidden border border-emerald-400/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-200" />
              <span>Source 01: Growth Nutrition Score (GNS)</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white leading-tight">
              ประเมินคะแนนโภชนาการและพฤติกรรมการกินเพื่อการเจริญเติบโต
            </h1>
            <p className="text-emerald-100 text-xs md:text-sm font-medium opacity-95 leading-relaxed">
              "กินวันนี้ เพื่อการเติบโตที่ดีที่สุดในอนาคต" — บันทึกคะแนน 5 หมวดโภชนาการประจำวัน พร้อมประเมิน Eating Behavior Score (5 คะแนน) และ Weekly GNS (100 คะแนน)
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={() => setShowOriginalRef(true)}
              className="px-4 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-2xl font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer border border-emerald-100 active:scale-95"
            >
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>ดูเกณฑ์โภชนาการ GNS (100 คะแนน)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('assessment')}
          className={`px-5 py-2.5 text-xs font-bold rounded-t-2xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'assessment' 
              ? 'bg-emerald-600 text-white shadow-md' 
              : 'bg-white text-slate-600 hover:bg-emerald-50'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>แบบประเมิน GNS & พฤติกรรมประจำวัน</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-2.5 text-xs font-bold rounded-t-2xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'history' 
              ? 'bg-emerald-600 text-white shadow-md' 
              : 'bg-white text-slate-600 hover:bg-emerald-50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>ประวัติการประเมิน ({patientLogs.length} รายการ)</span>
        </button>
      </div>

      {activeTab === 'assessment' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Main Form Column (2 Cols) */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* Date Header Card */}
            <div className="aurora-card p-6 rounded-3xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">1. แบบประเมินโภชนาการประจำวัน (Daily Scoring)</h2>
                  <p className="text-xs text-slate-500 mt-1">ประเมินคะแนน 5 หมวดอาหารประจำวัน (เต็ม 15 คะแนน/วัน)</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">วันที่ประเมิน:</span>
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Simplified 5-Item GNS Checklist */}
              <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 space-y-3">
                <p className="text-[12px] font-bold text-slate-700 pb-2 border-b border-emerald-100">
                  ทำเครื่องหมายในข้อที่คุณปฏิบัติตามในวันนี้:
                </p>
                <div className="space-y-2.5">
                  {[
                    { label: 'ทานโปรตีนครบ (เนื้อสัตว์ / ไข่ / นม / ถั่ว) (+25 คะแนน)', state: hasProtein, set: setHasProtein },
                    { label: 'ได้รับแคลเซียมและวิตามิน D (นม / ปลาเล็ก / ผักใบเขียว) (+25 คะแนน)', state: hasCalcium, set: setHasCalcium },
                    { label: 'ทานผักและผลไม้หลากสี (+25 คะแนน)', state: hasVegFruit, set: setHasVegFruit },
                    { label: 'ดื่มน้ำสะอาดเพียงพอ (อย่างน้อย 6-8 แก้ว) (+15 คะแนน)', state: hasWater, set: setHasWater },
                    { label: 'เคี้ยวอาหาร 2 ข้างอย่างสมดุล ไม่เคี้ยวข้างเดียว (+10 คะแนน)', state: hasChewBalance, set: setHasChewBalance },
                  ].map((item, idx) => (
                    <label key={idx} className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${item.state ? 'bg-white border-emerald-300 text-emerald-900 shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                      <input
                        type="checkbox"
                        checked={item.state}
                        onChange={(e) => item.set(e.target.checked)}
                        className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className="text-[13px] font-bold">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Feedback & Save Button */}
            {feedback && (
              <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{feedback.text}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmitScore}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-5 h-5" />
              <span>บันทึกโภชนาการ & ไปด่านถัดไป</span>
            </button>
          </div>

          {/* Column 2: Results & Composite Score */}
          <div className="space-y-6">

            {/* Live Weekly GNS Score Card */}
            <div className="aurora-card p-6 rounded-3xl space-y-6 text-center flex flex-col items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">คะแนน GNS ประจำสัปดาห์ (Weekly GNS Score)</span>
              
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="88" cy="88" r="76" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                  <circle cx="88" cy="88" r="76" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="477" strokeDashoffset={477 - (477 * weeklyGnsScore) / 100} className="text-emerald-500 transition-all duration-1000 ease-out" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-black text-emerald-700 tracking-tighter">{weeklyGnsScore}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">/ 100 คะแนน</span>
                </div>
              </div>

              <div className="w-full space-y-2">
                <div className={`p-3 rounded-2xl text-xs font-black border shadow-xs ${currentTier.color}`}>
                  {currentTier.label}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                  คำนวณตามสูตรคลินิก Growth Lab: <br />
                  <span className="font-mono text-emerald-700 font-bold">(รวมคะแนน 7 วัน ÷ 105) × 100</span>
                </p>
              </div>
            </div>

            {/* Growth Lab Composite Score Breakdown (100 คะแนน) */}
            <div className="aurora-card p-6 rounded-3xl space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Growth Lab Composite Score</h3>
                  <p className="text-[11px] text-slate-500">คะแนนรวม 5 เสาหลักการเจริญเติบโตเต็มศักยภาพ (100%)</p>
                </div>
                <span className="text-lg font-black text-emerald-700">{compositeBreakdown.totalComposite}/100</span>
              </div>

              <div className="space-y-3">
                {[
                  { name: '1. Nutrition (GNS)', weight: '20%', score: compositeBreakdown.nutPillar, color: 'bg-emerald-500' },
                  { name: '2. Sleep Quality', weight: '20%', score: compositeBreakdown.sleepPillar, color: 'bg-indigo-500' },
                  { name: '3. Exercise Consistency', weight: '20%', score: compositeBreakdown.exercisePillar, color: 'bg-amber-500' },
                  { name: '4. Orofacial Function (EF)', weight: '20%', score: compositeBreakdown.orofacialPillar, color: 'bg-purple-500' },
                  { name: '5. Family Participation', weight: '20%', score: compositeBreakdown.familyPillar, color: 'bg-teal-500' },
                ].map((pillar, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700">{pillar.name} ({pillar.weight})</span>
                      <span className="text-slate-900">{pillar.score}/20 คะแนน</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${pillar.color}`} style={{ width: `${(pillar.score / 20) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Standard GNS Evaluation Tiers Legend */}
            <div className="aurora-card p-6 rounded-3xl space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">เกณฑ์การประเมินคะแนน GNS สัปดาห์</h4>
              <div className="space-y-2 text-xs">
                {[
                  { range: '90 - 100', title: 'Excellent Growth Nutrition', color: 'bg-emerald-100 text-emerald-800' },
                  { range: '80 - 89', title: 'Very Good', color: 'bg-teal-100 text-teal-800' },
                  { range: '70 - 79', title: 'Good', color: 'bg-blue-100 text-blue-800' },
                  { range: '60 - 69', title: 'Needs Improvement', color: 'bg-amber-100 text-amber-800' },
                  { range: '< 60', title: 'High Priority (ปรับด่วน)', color: 'bg-rose-100 text-rose-800' },
                ].map((tier, idx) => (
                  <div key={idx} className={`p-2.5 rounded-xl flex items-center justify-between border border-slate-100 font-bold ${tier.color}`}>
                    <span>{tier.range} คะแนน</span>
                    <span>{tier.title}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="aurora-card p-6 rounded-3xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">ประวัติการประเมินโภชนาการ (Nutrition History Logs)</h3>
              <p className="text-xs text-slate-500">ของ {currentPatient?.firstName?.replace(/\s*\(DEMO\)/, "")} {currentPatient?.lastName} (HN: {currentPatient?.hn})</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              รวม {patientLogs.length} รายการ
            </span>
          </div>

          {patientLogs.length === 0 ? (
            <div className="text-center py-12 space-y-3 text-slate-400">
              <Apple className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm font-bold">ยังไม่มีประวัติการประเมินโภชนาการสำหรับสมาชิกท่านนี้</p>
              <button
                onClick={() => setActiveTab('assessment')}
                className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 cursor-pointer"
              >
                + ทำแบบประเมินโภชนาการวันนี้
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                    <th className="p-3 font-bold">วันที่</th>
                    <th className="p-3 font-bold">Protein</th>
                    <th className="p-3 font-bold">Calcium</th>
                    <th className="p-3 font-bold">Veg/Fruit</th>
                    <th className="p-3 font-bold">Quality</th>
                    <th className="p-3 font-bold">Water</th>
                    <th className="p-3 font-bold">Behavior</th>
                    <th className="p-3 font-bold">Weekly GNS</th>
                    <th className="p-3 font-bold">การแปลผล</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patientLogs.map((log: any, idx: number) => {
                    const tier = getGnsTier(log.weeklyGnsScore || log.totalScore || 75);
                    return (
                      <tr key={log.id || idx} className="hover:bg-slate-50/80 transition-all">
                        <td className="p-3 font-bold text-slate-800">{log.date}</td>
                        <td className="p-3 font-medium text-slate-700">{log.protein ?? '-'} / 3</td>
                        <td className="p-3 font-medium text-slate-700">{log.calciumVitD ?? '-'} / 2</td>
                        <td className="p-3 font-medium text-slate-700">{log.vegFruit ?? '-'} / 2</td>
                        <td className="p-3 font-medium text-slate-700">{log.foodQuality ?? '-'} / 3</td>
                        <td className="p-3 font-medium text-slate-700">{log.waterConsistency ?? '-'} / 2</td>
                        <td className="p-3 font-medium text-emerald-700">{log.eatingBehaviorScore ?? '-'} / 5</td>
                        <td className="p-3 font-black text-emerald-800">{log.weeklyGnsScore || log.totalScore}/100</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${tier.color}`}>
                            {tier.badge}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Clinical Reference Document Modal */}
      <OriginalReferenceModal
        isOpen={showOriginalRef}
        onClose={() => setShowOriginalRef(false)}
        title="เกณฑ์โภชนาการ Growth Nutrition Score (100 คะแนน) และ Eating Behavior Score (5 คะแนน)"
        imageSrc="/clinical-sources/gns_reference.jpg"
      />
    </motion.div>
  );
}
