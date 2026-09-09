import fs from 'fs';

const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `<PatientDashboard
                patient={assignedPatient}
                logs={scopedLogs}
                appointments={scopedAppointments}
                onNavigate={setActiveTab}`;

const replacement = `<PatientDashboard
                patient={assignedPatient}
                logs={scopedLogs}
                appointments={scopedAppointments}
                onNavigate={(tab) => {
                  if (tab === 'แบบฝึกหัดที่ได้รับมอบหมาย_WIZARD') {
                    setSelectedHomeworkStage('wizard');
                    setActiveTab('แบบฝึกหัดที่ได้รับมอบหมาย');
                  } else {
                    setActiveTab(tab);
                  }
                }}`;

content = content.replace(target, replacement);

fs.writeFileSync(file, content);
console.log('App patched part 2');
