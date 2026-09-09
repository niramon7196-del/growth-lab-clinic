const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(
    "const isDoctorOrOwner = userRole === 'DOCTOR' ||",
    "const isDoctorOrOwner = userRole === 'DOCTOR' || userRole === 'CLINIC_OWNER';"
);
fs.writeFileSync('src/App.tsx', content);
