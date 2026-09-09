import fs from 'fs';

const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

const newReset = `  const handleResetDatabase = () => {
    // ⚠️ DISABLED: Data preservation lock active. Never wipe patients or logs.
    console.log('[System] Reset database disabled to prevent data loss.');
    // Only reset settings if absolutely necessary, but here we do nothing to protect data.
  };`;

content = content.replace(/  const handleResetDatabase = \(\) => \{\n    setPatients\(\[\]\);\n    setLogs\(\[\]\);\n    setAppointments\(\[\]\);\n    setNotifications\(\[\]\);\n    setSettings\(DEFAULT_SETTINGS\);\n\n    saveStateToLocal\('growth_lab_patients', \[\]\);\n    saveStateToLocal\('growth_lab_logs', \[\]\);\n    saveStateToLocal\('growth_lab_appointments', \[\]\);\n    saveStateToLocal\('growth_lab_notifications', \[\]\);\n    saveStateToLocal\('growth_lab_settings', DEFAULT_SETTINGS\);\n\n    try \{\n      localStorage.removeItem\('growthlab_patients'\);\n      localStorage.removeItem\('growthlab_active_patient_hn'\);\n      localStorage.removeItem\('growth_lab_active_patient_hn'\);\n    \} catch \(e\) \{\}\n\n    handleSelectPatient\(undefined\);\n    setActiveTab\(userRole === 'PATIENT' \? 'หน้าหลัก' : 'Dashboard'\);\n  \};/m, newReset);

fs.writeFileSync(file, content);
