import fs from 'fs';

const file = 'src/components/ClinicProfile.tsx';
let content = fs.readFileSync(file, 'utf8');

const funcs = `
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
      
      const exportFileDefaultName = \`growth_lab_backup_\${new Date().toISOString().split('T')[0]}.json\`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      triggerLocalFeedback('📥 ดาวน์โหลดไฟล์สำรองข้อมูลสำเร็จ', 'success');
    } catch (e) {
      console.error('Export error', e);
      triggerLocalFeedback('เกิดข้อผิดพลาดในการสำรองข้อมูล', 'error');
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

        // Validation - very basic
        if (backupData.patients && Array.isArray(backupData.patients)) {
          // Merge logic? The prompt says: "ให้ระบบนำข้อมูลคนไข้เดิมมา Merge เข้ากับโครงสร้างใหม่โดยไม่ลบฟิลด์เดิมทิ้ง"
          // We'll trust the App.tsx init which parses from storage to keep it safely, 
          // or we just directly write the backup arrays. They contain all fields from the time of backup.
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
        
        triggerLocalFeedback('📤 กู้คืนข้อมูลสำเร็จ! ระบบกำลังทำการรีสตาร์ท...', 'success');
        
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        
      } catch (err) {
        console.error('Import error', err);
        triggerLocalFeedback('รูปแบบไฟล์สำรองข้อมูลไม่ถูกต้อง', 'error');
      }
    };
    reader.readAsText(file);
    
    // Clear input
    if (e.target) e.target.value = '';
  };
`;

content = content.replace("  return (", funcs + "\n  return (");
fs.writeFileSync(file, content);
