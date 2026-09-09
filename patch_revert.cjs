const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. handleGearClick
content = content.replace(
    `const handleGearClick = () => {\n    if (userRole === 'DEVELOPER') {`,
    `const handleGearClick = () => {\n    if (userRole === 'DEVELOPER' || userRole === 'ADMIN' || userRole === 'DOCTOR' || userRole === 'CLINIC_OWNER') {`
);

// 2. Guard System Management useEffect
content = content.replace(
    `  // Guard System Management and Settings Panel access to OWNER only\n  useEffect(() => {\n    const isOwner = userRole === 'DEVELOPER';`,
    `  // Guard System Management and Settings Panel access to OWNER only\n  useEffect(() => {\n    const isOwner = userRole === 'DEVELOPER' || userRole === 'CLINIC_OWNER' || userRole === 'ADMIN' || userRole === 'DOCTOR';`
);

// 3. filteredStaffMenuGroups
content = content.replace(
    `        if (group.title === 'การจัดการระบบ' && userRole !== 'DEVELOPER') return false;\n`,
    ``
);

// 4. Avatar click
content = content.replace(
    `onClick={() => isPatient ? setActiveTab('โปรไฟล์') : (userRole === 'DEVELOPER' ? setActiveTab('ตั้งค่า') : setActiveTab('Dashboard'))}`,
    `onClick={() => isPatient ? setActiveTab('โปรไฟล์') : setActiveTab('ตั้งค่า')}`
);

// 5. SettingsPanel render condition
content = content.replace(
    `          {activeTab === 'ตั้งค่า' && !isPatient && (\n            (userRole === 'DEVELOPER') ? (`,
    `          {activeTab === 'ตั้งค่า' && !isPatient && (\n            (userRole === 'DEVELOPER' || userRole === 'ADMIN' || userRole === 'CLINIC_OWNER' || userRole === 'DOCTOR') ? (`
);

// 6. System Management modal condition
content = content.replace(
    `{showSystemManager && userRole === 'DEVELOPER' && (`,
    `{showSystemManager && (userRole === 'DEVELOPER' || userRole === 'CLINIC_OWNER' || userRole === 'ADMIN' || userRole === 'DOCTOR') && (`
);

fs.writeFileSync('src/App.tsx', content);
console.log('Patched');
