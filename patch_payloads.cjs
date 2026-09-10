const fs = require('fs');
const file = 'src/services/cloudApi.ts';
let content = fs.readFileSync(file, 'utf-8');

// In logDaily
content = content.replace(
  /timestamp: dailyData.timestamp \|\| new Date\(\)\.toISOString\(\)/g,
  `timestamp: dailyData.timestamp || new Date().toISOString(),
    patientName: dailyData.patientName || dailyData.name || '',
    exerciseId: dailyData.exerciseId || '',
    exerciseTitle: dailyData.exerciseTitle || dailyData.actionName || '',
    durationSec: dailyData.durationSec || dailyData.durationSeconds || 0,
    reps: dailyData.reps || dailyData.completedCount || 0,
    score: dailyData.score || dailyData.progress || 0,
    satisfaction: dailyData.satisfaction || 5,
    status: dailyData.status || 'completed'`
);

// In saveExercise
content = content.replace(
  /satisfaction: exerciseData.satisfaction \?\? 5,/g,
  `satisfaction: exerciseData.satisfaction ?? 5,
    patientName: exerciseData.patientName || exerciseData.name || '',
    exerciseTitle: exerciseData.exerciseTitle || '',
    durationSec: exerciseData.durationSec || exerciseData.durationSeconds || (exerciseData.duration * 60) || 0,
    status: exerciseData.status || 'completed',`
);

// In logExerciseSession
content = content.replace(
  /durationSeconds: sessionData.durationSeconds \|\| 0,/g,
  `durationSeconds: sessionData.durationSeconds || 0,
    durationSec: sessionData.durationSec || sessionData.durationSeconds || 0,
    satisfaction: sessionData.satisfaction || 5,`
);

fs.writeFileSync(file, content);
console.log('cloudApi.ts patched');
