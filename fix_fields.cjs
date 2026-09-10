const fs = require('fs');

let gas = fs.readFileSync('src/services/googleAppsScriptService.ts', 'utf-8');

gas = gas.replace(
  /duration: 5,\n\s*reps: 10,\n\s*score: payload\.exerciseScore \|\| payload\.omtScore \|\| 100,\n\s*satisfaction: 5,\n\s*status: 'completed',/g,
  `durationSec: payload.durationSec || 300,
        reps: payload.reps || 10,
        score: payload.exerciseScore || payload.omtScore || 100,
        satisfaction: payload.satisfaction || 5,
        status: payload.status || 'completed',
        patientName: payload.patientName || payload.name || '',
        exerciseTitle: payload.exerciseTitle || 'ส่งการบ้านสรุปผลประจำวัน (SAVE_DAILY_SUMMARY)',`
);

gas = gas.replace(
  /status: payload\.status \|\| 'completed',\n\s*itemsChecked: payload\.itemsChecked \|\| \[\],/g,
  `status: payload.status || 'completed',
      patientName: payload.patientName || payload.name || '',
      exerciseId: payload.exerciseId || 'nutrition_gns',
      exerciseTitle: payload.exerciseTitle || 'บันทึกโภชนาการ GNS',
      durationSec: payload.durationSec || 60,
      reps: payload.reps || 1,
      satisfaction: payload.satisfaction || 5,
      itemsChecked: payload.itemsChecked || [],`
);

gas = gas.replace(
  /status: payload\.status \|\| 'completed',\n\s*sleepHours: payload\.sleepHours \|\| 8,/g,
  `status: payload.status || 'completed',
      patientName: payload.patientName || payload.name || '',
      exerciseId: payload.exerciseId || 'sleep_ef',
      exerciseTitle: payload.exerciseTitle || 'บันทึกข้อมูลการนอน & EF',
      durationSec: payload.durationSec || 60,
      reps: payload.reps || 1,
      satisfaction: payload.satisfaction || 5,
      sleepHours: payload.sleepHours || 8,`
);

gas = gas.replace(
  /status: payload\.status \|\| 'completed',\n\s*timestamp: new Date\(\)\.toISOString\(\),/g,
  `status: payload.status || 'completed',
      timestamp: new Date().toISOString(),
      patientName: payload.patientName || payload.name || '',
      exerciseId: payload.exerciseId || payload.action || 'daily_checkin',
      exerciseTitle: payload.exerciseTitle || payload.actionName || 'เช็คอินประจำวัน (Daily Check-in)',
      durationSec: payload.durationSec || 0,
      reps: payload.reps || 1,
      satisfaction: payload.satisfaction || 5,`
);

gas = gas.replace(
  /status: summaryData\.checkInStatus,/g,
  `status: summaryData.checkInStatus,
      patientName: summaryData.patientName || summaryData.name || '',
      exerciseId: 'daily_summary',
      exerciseTitle: 'Daily Summary Report',
      durationSec: 0,
      reps: summaryData.completedExercises || 0,
      satisfaction: summaryData.sleepRating || 5,`
);

fs.writeFileSync('src/services/googleAppsScriptService.ts', gas);
console.log('Fixed fields in googleAppsScriptService.ts');
