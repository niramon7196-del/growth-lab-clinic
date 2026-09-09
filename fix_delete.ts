import fs from 'fs';

const appFile = 'src/App.tsx';
let appContent = fs.readFileSync(appFile, 'utf8');

const oldDelete = `  const handleDeletePatient = (patientId: string) => {
    const targetPatient = patients.find(p => p.id === patientId || p.hn === patientId);
    const targetHn = targetPatient?.hn;
    const updated = patients.filter((p) => p.id !== patientId && (!targetHn || p.hn !== targetHn));

    // 1. Immediately update state
    setPatients(updated);

    // 2. Persist empty/updated state to localStorage immediately (No seed fallback)
    saveStateToLocal('growth_lab_patients', updated);
    localStorage.setItem('growth_lab_patients', JSON.stringify(updated));
    localStorage.setItem('growthlab_patients', JSON.stringify(updated));`;

const newDelete = `  const handleDeletePatient = (patientId: string) => {
    const targetPatient = patients.find(p => p.id === patientId || p.hn === patientId);
    const targetHn = targetPatient?.hn;
    
    // 1. Immediately update state using prev to ensure no stale closures
    setPatients(prev => {
      const updated = prev.filter((p) => p.id !== patientId && (!targetHn || p.hn !== targetHn));
      // 2. Persist empty/updated state to localStorage immediately (No seed fallback)
      saveStateToLocal('growth_lab_patients', updated);
      localStorage.setItem('growth_lab_patients', JSON.stringify(updated));
      localStorage.setItem('growthlab_patients', JSON.stringify(updated));
      return updated;
    });`;

if (appContent.includes(oldDelete)) {
    appContent = appContent.replace(oldDelete, newDelete);
    fs.writeFileSync(appFile, appContent);
}

