import fs from 'fs';

const file = 'src/components/InteractiveWorkoutPlayer.tsx';
let content = fs.readFileSync(file, 'utf8');

const target1 = `                ) : hasNextStep ? (
                  <button
                    type="button"
                    onClick={handleSaveAndComplete}
                    className="w-full py-4 text-white font-black text-sm sm:text-base rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-600 hover:from-purple-700 hover:via-indigo-700 hover:to-teal-700"
                  >
                    <Check className="w-5 h-5 stroke-[3]" />
                    <span>[ ✓ บันทึก & ไปยังแบบฝึกหัดถัดไป ➔ ]</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSaveAndComplete}
                    className="w-full py-4 text-white font-black text-sm sm:text-base rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-purple-600 hover:from-emerald-700 hover:via-teal-700 hover:to-purple-700"
                  >
                    <Check className="w-5 h-5 stroke-[3]" />
                    <span>[ 💾 บันทึกผลด่านสุดท้าย & ส่งการบ้านวันนี้ ]</span>
                  </button>
                )}
                <p className="text-[11px] text-slate-500 font-medium text-center mt-2">
                  {hasNextStep 
                    ? \`ระบบจะ Auto-save สถานะด่านที่ \${(stepIndex || 0) + 1} และนำทางเข้าสู่ด่านที่ \${(stepIndex || 0) + 2} อัตโนมัติ\`
                    : 'เมื่อบันทึกด่านสุดท้าย ระบบจะแสดงหน้าต่างยืนยันและคำนวณ Habit & Engagement Score'}
                </p>`;

const rep1 = `                ) : hasNextStep ? (
                  <button
                    type="button"
                    onClick={handleSaveAndComplete}
                    className="w-full py-4 text-white font-black text-sm sm:text-base rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-600 hover:from-purple-700 hover:via-indigo-700 hover:to-teal-700"
                  >
                    <Check className="w-5 h-5 stroke-[3]" />
                    <span>ทำสำเร็จ (Complete) & ไปท่าถัดไป</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSaveAndComplete}
                    className="w-full py-4 text-white font-black text-sm sm:text-base rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-purple-600 hover:from-emerald-700 hover:via-teal-700 hover:to-purple-700"
                  >
                    <Check className="w-5 h-5 stroke-[3]" />
                    <span>บันทึกและส่งผล (Submit)</span>
                  </button>
                )}
                
                {onBack && (
                  <button
                    type="button"
                    onClick={onBack}
                    className="w-full py-3 mt-3 text-slate-600 font-bold text-sm bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    กลับหน้าหลัก
                  </button>
                )}

                <p className="text-[11px] text-slate-500 font-medium text-center mt-3">
                  {hasNextStep 
                    ? \`ระบบจะ Auto-save สถานะด่านที่ \${(stepIndex || 0) + 1} และนำทางเข้าสู่ด่านที่ \${(stepIndex || 0) + 2} อัตโนมัติ\`
                    : 'เมื่อบันทึกด่านสุดท้าย ระบบจะส่งคะแนนเข้า Google Sheets และแสดงหน้าต่างสรุปผล'}
                </p>`;

content = content.replace(target1, rep1);
fs.writeFileSync(file, content);
console.log('Patched InteractiveWorkoutPlayer.tsx');
