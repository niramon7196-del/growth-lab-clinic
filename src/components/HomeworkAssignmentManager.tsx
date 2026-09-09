import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardList, CheckCircle2, Clock, Info, Save, 
  Brain, Dumbbell, Activity, ShieldCheck, Moon, 
  Apple, Check, Sparkles, CheckSquare, Square, Trash2, Plus
} from 'lucide-react';
import { Patient, HomeworkAssignment, Exercise } from '../types';
import { VERIFIED_EXERCISES } from '../data';
import { getPatientAssignedExercises } from '../../exerciseHelper';

interface HomeworkAssignmentManagerProps {
  patient: Patient;
  onUpdateAssignments: (patientId: string, assignments: HomeworkAssignment[]) => void;
}

export default function HomeworkAssignmentManager({
  patient,
  onUpdateAssignments
}: HomeworkAssignmentManagerProps) {
  // Store selected exercises as a dictionary keyed by exerciseId
  const [selectedExercises, setSelectedExercises] = useState<Record<string, Partial<HomeworkAssignment>>>(() => {
    const initial: Record<string, Partial<HomeworkAssignment>> = {};
    const resolved = getPatientAssignedExercises(VERIFIED_EXERCISES, patient);
    resolved.forEach((asg: any) => {
      const exId = asg.exerciseId || asg.id;
      if (exId) {
        initial[exId] = {
          id: asg.assignmentId || asg.id || `asg_${Date.now()}_${exId}`,
          patientId: patient.id,
          exerciseId: exId,
          reps: asg.reps || asg.targetReps || 10,
          durationMinutes: asg.durationMinutes || 5,
          status: asg.status || 'pending',
          startDate: asg.startDate || new Date().toISOString().split('T')[0],
          instruction: asg.instruction || asg.description || ''
        };
      }
    });
    return initial;
  });

  const [activeCategory, setActiveCategory] = useState<'omt' | 'sleep' | 'gns' | 'exercise' | 'all'>('all');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Group exercises by category
  const omtExercises = useMemo(() => 
    VERIFIED_EXERCISES.filter(ex => ex.id.startsWith('OMT') || ex.category === 'breathing' || ex.category === 'lips' || ex.category === 'tongue' || ex.category === 'swallowing' || ex.category === 'cheek_jaw' || ex.category === 'posture' || ex.category === 'daily'),
    []
  );

  const sleepExercises = useMemo(() => 
    VERIFIED_EXERCISES.filter(ex => ex.id.startsWith('SLP') || ex.category === 'sleep' || ex.id.startsWith('EFA') || ex.category === 'appliance'),
    []
  );

  const gnsExercises = useMemo(() => 
    VERIFIED_EXERCISES.filter(ex => ex.id.startsWith('GNS') || ex.category === 'nutrition'),
    []
  );

  const movementExercises = useMemo(() => 
    VERIFIED_EXERCISES.filter(ex => 
      ex.id.startsWith('EX') || 
      ex.id.startsWith('ex_') || 
      ex.category === 'movement' || 
      ex.category === 'strength' || 
      ex.category === 'core'
    ),
    []
  );

  // Filter list by selected tab
  const displayedExercises = useMemo(() => {
    switch (activeCategory) {
      case 'omt':
        return omtExercises;
      case 'sleep':
        return sleepExercises;
      case 'gns':
        return gnsExercises;
      case 'exercise':
        return movementExercises;
      case 'all':
      default:
        return VERIFIED_EXERCISES;
    }
  }, [activeCategory, omtExercises, sleepExercises, gnsExercises, movementExercises]);

  // Toggle multi-select checkbox for an exercise
  const handleToggleExercise = (ex: Exercise) => {
    setSelectedExercises(prev => {
      const next = { ...prev };
      if (next[ex.id]) {
        delete next[ex.id];
      } else {
        const todayStr = new Date().toISOString().split('T')[0];
        next[ex.id] = {
          id: `asg_${Date.now()}_${ex.id}`,
          patientId: patient.id,
          exerciseId: ex.id,
          reps: ex.targetReps || 10,
          durationMinutes: ex.durationMinutes || 5,
          status: 'pending',
          startDate: todayStr,
          instruction: ex.description || ''
        };
      }
      return next;
    });
  };

  // Select all in current category
  const handleSelectAllCategory = () => {
    setSelectedExercises(prev => {
      const next = { ...prev };
      const todayStr = new Date().toISOString().split('T')[0];
      displayedExercises.forEach(ex => {
        if (!next[ex.id]) {
          next[ex.id] = {
            id: `asg_${Date.now()}_${ex.id}`,
            patientId: patient.id,
            exerciseId: ex.id,
            reps: ex.targetReps || 10,
            durationMinutes: ex.durationMinutes || 5,
            status: 'pending',
            startDate: todayStr,
            instruction: ex.description || ''
          };
        }
      });
      return next;
    });
  };

  // Deselect all in current category
  const handleDeselectAllCategory = () => {
    setSelectedExercises(prev => {
      const next = { ...prev };
      displayedExercises.forEach(ex => {
        delete next[ex.id];
      });
      return next;
    });
  };

  // Update parameters (Reps / Duration / Instruction) for a selected exercise
  const handleUpdateParam = (exId: string, params: Partial<HomeworkAssignment>) => {
    setSelectedExercises(prev => {
      if (!prev[exId]) return prev;
      return {
        ...prev,
        [exId]: {
          ...prev[exId],
          ...params
        }
      };
    });
  };

  // Consolidated single save button
  const handleSaveAll = () => {
    setIsSaving(true);
    setTimeout(() => {
      const assignmentsList = (Object.values(selectedExercises) as Partial<HomeworkAssignment>[]).map(item => ({
        id: item.id || `asg_${Date.now()}_${item.exerciseId}`,
        patientId: patient.id,
        exerciseId: item.exerciseId || '',
        reps: item.reps || 10,
        durationMinutes: item.durationMinutes || 5,
        status: (item.status || 'pending') as 'pending' | 'completed',
        startDate: item.startDate || new Date().toISOString().split('T')[0],
        instruction: item.instruction || '',
        participantVideoUrl: item.participantVideoUrl,
        participantVideoDate: item.participantVideoDate,
        lastSubmittedDate: item.lastSubmittedDate
      })) as HomeworkAssignment[];

      onUpdateAssignments(patient.id, assignmentsList);
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    }, 400);
  };

  const totalSelectedCount = Object.keys(selectedExercises).length;

  return (
    <div className="space-y-6 text-left w-full max-w-full overflow-x-hidden box-border">
      {/* Header Bar with Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 rounded-2xl border border-purple-200/80">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-purple-700" />
            <h3 className="text-base sm:text-lg font-black text-[#252536]">
              มอบหมายแบบฝึกหัดบริหารกล้ามเนื้อ
            </h3>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            เลือกแบบฝึกหัดที่ต้องการมอบหมายพร้อมกัน กำหนด Reps/เวลา และกดบันทึกทั้งหมดในขั้นตอนเดียว
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <span className="text-[11px] font-bold text-slate-500 block">เลือกแล้วทั้งหมด</span>
            <span className="text-sm font-black text-purple-900">{totalSelectedCount} แบบฝึกหัด</span>
          </div>

          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-md transition-all min-h-[44px] ${isSaving ? 'bg-slate-400 text-white cursor-not-allowed' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-98 text-white cursor-pointer'}`}
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกและมอบหมายแบบฝึกหัดทั้งหมด'}</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>บันทึกและมอบหมายแบบฝึกหัดให้ {patient.firstName} {patient.lastName} สำเร็จแล้ว</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-mono">บันทึกสำเร็จ</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-100 pb-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white rounded-xl border border-purple-200/80 shadow-2xs">
          {[
            { id: 'omt', label: 'OMT / การทำงานช่องปาก', count: omtExercises.length, icon: Brain },
            { id: 'sleep', label: 'การนอน / อุปกรณ์ EF', count: sleepExercises.length, icon: Moon },
            { id: 'gns', label: 'โภชนาการและการเจริญเติบโต', count: gnsExercises.length, icon: Apple },
            { id: 'exercise', label: 'Exercise & Movement', count: movementExercises.length, icon: Dumbbell },
            { id: 'all', label: 'ทั้งหมด', count: VERIFIED_EXERCISES.length, icon: Activity },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-purple-800 hover:bg-purple-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  isActive ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Batch Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSelectAllCategory}
            className="text-[11px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg border border-purple-200 transition-all cursor-pointer flex items-center gap-1"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>เลือกทั้งหมดในหมวดนี้</span>
          </button>
          <button
            type="button"
            onClick={handleDeselectAllCategory}
            className="text-[11px] font-bold text-slate-500 hover:text-rose-700 bg-slate-50 hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-all cursor-pointer flex items-center gap-1"
          >
            <Square className="w-3.5 h-3.5" />
            <span>ยกเลิกการเลือกในหมวดนี้</span>
          </button>
        </div>
      </div>

      {/* Multi-Select Exercises List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {displayedExercises.map((ex) => {
          const isSelected = !!selectedExercises[ex.id];
          const config = selectedExercises[ex.id];

          return (
            <div
              key={ex.id}
              className={`p-4 rounded-2xl border transition-all ${
                isSelected
                  ? 'bg-purple-50/70 border-purple-300 ring-1 ring-purple-400 shadow-2xs'
                  : 'bg-white border-slate-200/90 hover:border-purple-200 shadow-2xs'
              }`}
            >
              {/* Checkbox Header */}
              <div className="flex items-start gap-3">
                <label className="flex items-center cursor-pointer mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleExercise(ex)}
                    className="w-5 h-5 rounded-md text-purple-600 border-slate-300 focus:ring-purple-500 cursor-pointer"
                  />
                </label>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 
                      onClick={() => handleToggleExercise(ex)}
                      className="text-xs sm:text-sm font-bold text-slate-900 cursor-pointer hover:text-purple-700 line-clamp-1"
                    >
                      {ex.title}
                    </h4>
                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                      {ex.id}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {ex.description}
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      มาตรฐานคลินิก
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      หมวด: {ex.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assignment Parameter Inputs (Visible when selected) */}
              {isSelected && (
                <div className="mt-3.5 pt-3 border-t border-purple-200/70 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-purple-900 block mb-1">
                        จำนวนรอบ (Reps / ครั้ง)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={config?.reps || 10}
                        onChange={(e) => handleUpdateParam(ex.id, { reps: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-purple-900 block mb-1">
                        เวลาที่แนะนำ (นาที)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={config?.durationMinutes || 5}
                        onChange={(e) => handleUpdateParam(ex.id, { durationMinutes: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-purple-900 block mb-1">
                      คำแนะนำเฉพาะจากแพทย์ (Special Instructions)
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น ฝึกหน้ากระจก 2 เวลา เช้า-ก่อนนอน..."
                      value={config?.instruction || ''}
                      onChange={(e) => handleUpdateParam(ex.id, { instruction: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Save Bar */}
      <div className="p-4 bg-white rounded-2xl border border-purple-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <CheckCircle2 className="w-4 h-4 text-purple-600" />
          <span>เลือกแบบฝึกหัดมอบหมายแล้ว: <strong className="text-purple-800 font-mono">{totalSelectedCount}</strong> รายการ</span>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-md transition-all min-h-[44px] ${isSaving ? 'bg-slate-400 text-white cursor-not-allowed' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white cursor-pointer'}`}
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกและมอบหมายแบบฝึกหัดทั้งหมด'}</span>
        </button>
      </div>
    </div>
  );
}
