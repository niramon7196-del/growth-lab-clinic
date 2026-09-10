const fs = require('fs');

// Clean cloudApi.ts
let cloudApi = fs.readFileSync('src/services/cloudApi.ts', 'utf-8');
cloudApi = cloudApi.replace(
  /action,\n\s*payload,\n\s*timestamp: new Date\(\)\.toISOString\(\),\n\s*\/\/ Include top-level attributes for backwards-compatible scripts\n\s*\.\.\.payload/g,
  `action,\n    timestamp: new Date().toISOString(),\n    ...payload`
);
fs.writeFileSync('src/services/cloudApi.ts', cloudApi);
console.log('Cleaned cloudApi.ts');

// Clean googleAppsScriptService.ts
let gas = fs.readFileSync('src/services/googleAppsScriptService.ts', 'utf-8');
// Replace instances where `payload` object is passed alongside `...payload`
gas = gas.replace(/,\n\s*payload\n\s*\}\)/g, '\n      })');
gas = gas.replace(/,\n\s*payload\n\s*\};/g, '\n    };');
fs.writeFileSync('src/services/googleAppsScriptService.ts', gas);
console.log('Cleaned googleAppsScriptService.ts');
