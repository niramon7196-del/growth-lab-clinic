const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
    "onClick={() => isPatient ? setActiveTab('โปรไฟล์') : setActiveTab('ตั้งค่า')}",
    "onClick={() => isPatient ? setActiveTab('โปรไฟล์') : (userRole === 'DEVELOPER' ? setActiveTab('ตั้งค่า') : setActiveTab('Dashboard'))}"
);

fs.writeFileSync('src/App.tsx', content);
console.log('Patched avatar click');
