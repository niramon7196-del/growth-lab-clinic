import fs from 'fs';

const file = 'src/components/SettingsPanel.tsx';
let content = fs.readFileSync(file, 'utf8');

const funcs = `
  const backupInputRef = React.useRef<HTMLInputElement>(null);

  const handleExportBackup = () => {
    try {
      const backupData = {
        patients: JSON.parse(localStorage.getItem('growth_lab_patients') || '[]'),
        logs: JSON.parse(localStorage.getItem('growth_lab_logs') || '[]'),
        appointments: JSON.parse(localStorage.getItem('growth_lab_appointments') || '[]'),
        settings: JSON.parse(localStorage.getItem('growth_lab_settings') || '{}'),
        timestamp: new Date().toISOString(),
        version: "1.2.4"
      };

      const dataStr = JSON.stringify(backupData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = 'growth_lab_backup_' + new Date().toISOString().split('T')[0] + '.json';
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      alert('📥 ดาวน์โหลดไฟล์สำรองข้อมูลสำเร็จ');
    } catch (e) {
      console.error('Export error', e);
      alert('เกิดข้อผิดพลาดในการสำรองข้อมูล');
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('ข้อมูลปัจจุบันจะถูกเขียนทับด้วยข้อมูลจากไฟล์สำรองข้อมูล คุณต้องการดำเนินการต่อหรือไม่?')) {
      if (e.target) e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const backupData = JSON.parse(content);

        if (backupData.patients && Array.isArray(backupData.patients)) {
          localStorage.setItem('growth_lab_patients', JSON.stringify(backupData.patients));
          localStorage.setItem('growthlab_patients', JSON.stringify(backupData.patients));
        }
        if (backupData.logs && Array.isArray(backupData.logs)) {
          localStorage.setItem('growth_lab_logs', JSON.stringify(backupData.logs));
        }
        if (backupData.appointments && Array.isArray(backupData.appointments)) {
          localStorage.setItem('growth_lab_appointments', JSON.stringify(backupData.appointments));
        }
        if (backupData.settings) {
          localStorage.setItem('growth_lab_settings', JSON.stringify(backupData.settings));
          localStorage.setItem('growthlab_clinic_info', JSON.stringify(backupData.settings));
        }
        
        alert('📤 กู้คืนข้อมูลสำเร็จ! ระบบกำลังทำการรีสตาร์ท...');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
      } catch (err) {
        console.error('Import error', err);
        alert('รูปแบบไฟล์สำรองข้อมูลไม่ถูกต้อง');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };
`;

const ui = `
        {/* DATA BACKUP & RESTORE */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-slate-800 flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-indigo-600" />
                สำรองและกู้คืนข้อมูล (Data Management)
              </h3>
              <p className="text-xs text-slate-500 mt-1">นำออกข้อมูลระบบทั้งหมดเพื่อเก็บเป็นไฟล์สำรอง หรือนำเข้าเพื่อกู้คืน</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Download className="w-5 h-5 text-blue-600" />
                <h4 className="font-bold text-sm text-slate-800">ส่งออกข้อมูล (Export)</h4>
              </div>
              <p className="text-xs text-slate-500 h-8">ดาวน์โหลดรายชื่อคนไข้และประวัติทั้งหมดเป็นไฟล์ JSON</p>
              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors text-xs flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                สำรองข้อมูลระบบ (Export JSON Backup)
              </button>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Upload className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-sm text-slate-800">นำเข้าข้อมูล (Restore)</h4>
              </div>
              <p className="text-xs text-slate-500 h-8">กู้คืนระบบจากไฟล์สำรองข้อมูล (เขียนทับข้อมูลปัจจุบัน)</p>
              <input 
                type="file"
                accept=".json"
                ref={backupInputRef}
                onChange={handleImportBackup}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => backupInputRef.current?.click()}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors text-xs flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                นำเข้าข้อมูลสำรอง (Restore Backup)
              </button>
            </div>
          </div>
        </div>
`;

if (!content.includes('handleExportBackup')) {
  // Add imports Download, Upload, HardDrive to lucide-react
  content = content.replace(/import {([^}]*)} from 'lucide-react';/g, (match, p1) => {
    let newImports = p1;
    if (!newImports.includes('Download')) newImports += ', Download';
    if (!newImports.includes('Upload')) newImports += ', Upload';
    if (!newImports.includes('HardDrive')) newImports += ', HardDrive';
    return "import {" + newImports + "} from 'lucide-react';";
  });

  // Insert funcs inside the component before return
  content = content.replace('  const handleResetClick = () => {', funcs + '\n  const handleResetClick = () => {');

  // Insert UI before the SUBMIT BUTTONS section
  content = content.replace('{/* SUBMIT BUTTONS & SYSTEM MAINTENANCE */}', ui + '\n        {/* SUBMIT BUTTONS & SYSTEM MAINTENANCE */}');

  fs.writeFileSync(file, content);
}

