const fs = require('fs');

let cloudApi = fs.readFileSync('src/services/cloudApi.ts', 'utf-8');
cloudApi = cloudApi.replace(
  /action,\n\s*timestamp: new Date\(\)\.toISOString\(\),\n\s*\.\.\.payload/g,
  `action,\n    payload,\n    timestamp: new Date().toISOString(),\n    ...payload`
);
fs.writeFileSync('src/services/cloudApi.ts', cloudApi);
console.log('Reverted cloudApi.ts');

let gas = fs.readFileSync('src/services/googleAppsScriptService.ts', 'utf-8');
gas = gas.replace(
  /patientName: payload\.patientName \|\| payload\.name \|\| '',\n\s*exerciseTitle: payload\.exerciseTitle \|\| 'ส่งการบ้านสรุปผลประจำวัน \(SAVE_DAILY_SUMMARY\)',\n\s*\.\.\.payload\n\s*\}\)/g,
  `patientName: payload.patientName || payload.name || '',
        exerciseTitle: payload.exerciseTitle || 'ส่งการบ้านสรุปผลประจำวัน (SAVE_DAILY_SUMMARY)',
        payload,
        ...payload
      })`
);

gas = gas.replace(
  /itemsChecked: payload\.itemsChecked \|\| \[\],\n\s*\.\.\.payload\n\s*\};/g,
  `itemsChecked: payload.itemsChecked || [],
      payload,
      ...payload
    };`
);

gas = gas.replace(
  /sleepHours: payload\.sleepHours \|\| 8,\n\s*\.\.\.payload\n\s*\};/g,
  `sleepHours: payload.sleepHours || 8,
      payload,
      ...payload
    };`
);

gas = gas.replace(
  /satisfaction: payload\.satisfaction \|\| 5,\n\s*\.\.\.payload\n\s*\};/g,
  `satisfaction: payload.satisfaction || 5,
      payload,
      ...payload
    };`
);

gas = gas.replace(
  /satisfaction: summaryData\.sleepRating \|\| 5,\n\s*\.\.\.summaryData\n\s*\};/g,
  `satisfaction: summaryData.sleepRating || 5,
      payload: summaryData,
      ...summaryData
    };`
);

fs.writeFileSync('src/services/googleAppsScriptService.ts', gas);
console.log('Reverted googleAppsScriptService.ts');
