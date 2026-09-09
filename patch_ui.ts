import fs from 'fs';

const file = 'src/components/ClinicProfile.tsx';
let content = fs.readFileSync(file, 'utf8');

const backupSection = `
      {/* SECTION 3: DATA MANAGEMENT & BACKUP */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
              <HardDrive className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900">สำรองและกู้คืนข้อมูล (Data Management)</h2>
              </div>
              <p className="text-xs text-slate-500 font-medium">นำออกข้อมูลทั้งหมดเพื่อเก็บเป็นไฟล์สำรอง หรือนำเข้าเพื่อกู้คืน</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Download className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1">
                <h4 className="font-bold text-slate-900 text-sm">ดาวน์โหลดไฟล์สำรองข้อมูล</h4>
                <p className="text-slate-500 font-medium leading-relaxed">
                  ดาวน์โหลดข้อมูลทั้งหมดรวมถึง ประวัติคนไข้ การตั้งค่าคลินิก และข้อมูลการตรวจ 
                  ออกมาเป็นไฟล์ JSON เก็บไว้ในเครื่องอย่างปลอดภัย
                </p>
              </div>
            </div>
            <button
              onClick={handleExportBackup}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>สำรองข้อมูลระบบ (Export JSON Backup)</span>
            </button>
          </div>

          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                <Upload className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1">
                <h4 className="font-bold text-slate-900 text-sm">นำเข้าข้อมูลสำรอง</h4>
                <p className="text-slate-500 font-medium leading-relaxed">
                  กู้คืนข้อมูลทั้งหมดจากไฟล์ JSON ที่เคยสำรองไว้ 
                  <span className="text-rose-500 block mt-1">* การนำเข้าจะเขียนทับข้อมูลปัจจุบันทั้งหมด</span>
                </p>
              </div>
            </div>
            
            <input 
              type="file"
              accept=".json"
              ref={backupInputRef}
              onChange={handleImportBackup}
              className="hidden"
            />
            
            <button
              onClick={() => backupInputRef.current?.click()}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>นำเข้าข้อมูลสำรอง (Restore Backup)</span>
            </button>
          </div>
        </div>
      </div>
`;

content = content.replace("      {/* STICKY BOTTOM SAVE ACTION BAR */}", backupSection + "\n      {/* STICKY BOTTOM SAVE ACTION BAR */}");
fs.writeFileSync(file, content);

