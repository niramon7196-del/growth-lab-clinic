import fs from 'fs';

const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

const target1 = `          {activeTab === 'แบบฝึกหัดที่ได้รับมอบหมาย' && (
            isPatient ? (
              assignedPatient ? (
                <AssignedExercisesView
                  patient={assignedPatient}
                  initialExerciseId={selectedExerciseIdFromNav || undefined}
                  onClearInitialExerciseId={() => setSelectedExerciseIdFromNav(null)}
                  initialStage={selectedHomeworkStage}
                  onClearInitialStage={() => setSelectedHomeworkStage('all')}
                  onBack={goBack}
                  onCompleteExercise={(assignmentId) => {
                    handleToggleAssignmentComplete(assignedPatient.id, assignmentId);
                  }}
                  onExerciseView={() => trackAppUsage(assignedPatient.id, 'exercise')}
                  onUpdatePatientNutrition={handleUpdatePatientNutrition}
                  onUpdatePatientSleep={handleUpdatePatientSleep}
                  onUpdatePatientEfLog={handleUpdatePatientEfLog}
                  settings={settings}
                />
              ) : (
                <ProfileNotLinkedError patientId={currentUser?.patientId} />
              )
            ) : (`;

const rep1 = `          {activeTab === 'แบบฝึกหัดที่ได้รับมอบหมาย' && (
            isPatient ? (
              <AssignedExercisesView
                patient={assignedPatient as any}
                initialExerciseId={selectedExerciseIdFromNav || undefined}
                onClearInitialExerciseId={() => setSelectedExerciseIdFromNav(null)}
                initialStage={selectedHomeworkStage}
                onClearInitialStage={() => setSelectedHomeworkStage('all')}
                onBack={goBack}
                onCompleteExercise={(assignmentId) => {
                  if (assignedPatient) handleToggleAssignmentComplete(assignedPatient.id, assignmentId);
                }}
                onExerciseView={() => {
                  if (assignedPatient) trackAppUsage(assignedPatient.id, 'exercise');
                }}
                onUpdatePatientNutrition={handleUpdatePatientNutrition}
                onUpdatePatientSleep={handleUpdatePatientSleep}
                onUpdatePatientEfLog={handleUpdatePatientEfLog}
                settings={settings}
              />
            ) : (`;

if (content.includes("ProfileNotLinkedError patientId={currentUser?.patientId}")) {
  content = content.replace(target1, rep1);
  fs.writeFileSync(file, content);
  console.log("Patched App.tsx for AssignedExercisesView ProfileNotLinkedError");
} else {
  console.log("Target not found in App.tsx");
}
