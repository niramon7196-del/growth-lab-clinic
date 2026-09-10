const fs = require('fs');
const file = 'src/services/googleAppsScriptService.ts';
let content = fs.readFileSync(file, 'utf-8');

content = content.replace(
  /score: payload\.exerciseScore \|\| payload\.omtScore \|\| 100,\n\s*satisfaction: 5,\n\s*payload\n\s*\}\)/g,
  `score: payload.exerciseScore || payload.omtScore || 100,
        satisfaction: 5,
        status: 'completed',
        ...payload
      })`
);

content = content.replace(
  /status: payload\.status \|\| 'completed',\n\s*itemsChecked: payload\.itemsChecked \|\| \[\],\n\s*payload\n\s*\};/g,
  `status: payload.status || 'completed',
      itemsChecked: payload.itemsChecked || [],
      ...payload
    };`
);

content = content.replace(
  /efHours: payload\.efHours \|\| 8,\n\s*rating: payload\.rating \|\| 5,\n\s*payload\n\s*\};/g,
  `efHours: payload.efHours || 8,
      rating: payload.rating || 5,
      ...payload
    };`
);

content = content.replace(
  /status: payload\.status \|\| 'completed',\n\s*timestamp: new Date\(\)\.toISOString\(\),\n\s*payload\n\s*\};/g,
  `status: payload.status || 'completed',
      timestamp: new Date().toISOString(),
      ...payload
    };`
);

content = content.replace(
  /status: summaryData\.checkInStatus,\n\s*payload: summaryData\n\s*\};/g,
  `status: summaryData.checkInStatus,
      ...summaryData
    };`
);

fs.writeFileSync(file, content);
console.log('googleAppsScriptService.ts patched');
