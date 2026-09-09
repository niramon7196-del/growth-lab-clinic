const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. handleGearClick
content = content.replace(
    /const handleGearClick = \(\) => \{\n    if \(userRole === 'DEVELOPER' \|\| userRole === 'ADMIN' \|\| userRole === 'DOCTOR' \|\| userRole === 'CLINIC_OWNER'\) \{/g,
    `const handleGearClick = () => {\n    if (userRole === 'DEVELOPER') {`
);

// 2. Guard System Management useEffect
content = content.replace(
    /  \/\/ Guard System Management and Settings Panel access to OWNER only\n  useEffect\(\(\) => \{\n    const isOwner = userRole === 'DEVELOPER' \|\| userRole === 'CLINIC_OWNER' \|\| userRole === 'ADMIN' \|\| userRole === 'DOCTOR';/g,
    `  // Guard System Management and Settings Panel access to OWNER only\n  useEffect(() => {\n    const isOwner = userRole === 'DEVELOPER';`
);

// 3. Guard System Management useEffect redirect for specific tabs
// Let's modify the if (!isOwner) condition to catch system management tabs
const oldGuardIf = `    if (!isOwner) {\n      if (showSystemManager) {\n        setShowSystemManager(false);\n        setShowAccessDenied(true);\n      }\n      if (activeTab === 'ตั้งค่า') {\n        setShowAccessDenied(true);\n        setActiveTab('Dashboard');\n      }\n    }`;
const newGuardIf = `    if (!isOwner) {\n      if (showSystemManager) {\n        setShowSystemManager(false);\n        setShowAccessDenied(true);\n      }\n      const systemTabs = ['ตั้งค่า', 'media_library', 'คลังวิดีโอสาธิต', 'วิดีโอ', 'ระบบ / โปรไฟล์', 'บุคลากร', 'Clinical Source'];\n      if (systemTabs.includes(activeTab)) {\n        setShowAccessDenied(true);\n        setActiveTab('Dashboard');\n      }\n    }`;
content = content.replace(oldGuardIf, newGuardIf);

// 4. Access denied text
content = content.replace(
    'ส่วนการจัดการระบบสงวนไว้สำหรับบุคลากรทางการแพทย์และผู้พัฒนาระบบเท่านั้น',
    'ส่วนการจัดการระบบสงวนไว้สำหรับผู้พัฒนาระบบ (SYSTEM_DEVELOPER) เท่านั้น'
);

// 5. System Management modal condition
content = content.replace(
    "{showSystemManager && (userRole === 'DEVELOPER' || userRole === 'CLINIC_OWNER' || userRole === 'ADMIN' || userRole === 'DOCTOR') && (",
    "{showSystemManager && userRole === 'DEVELOPER' && ("
);

// 6. Settings Panel render condition
content = content.replace(
    "(userRole === 'ADMIN' || userRole === 'DEVELOPER' || userRole === 'CLINIC_OWNER' || userRole === 'DOCTOR') ? (",
    "(userRole === 'DEVELOPER') ? ("
);

// 7. staffMenuGroups filtering to hide "การจัดการระบบ"
// Replace the mapping logic
const oldStaffFilter = `  const filteredStaffMenuGroups = useMemo(() => {\n    return staffMenuGroups.map(group => {\n      const filteredItems = group.items.filter(item => {\n        if (isClinicOwnerOrFullAccess) return true;`;
const newStaffFilter = `  const filteredStaffMenuGroups = useMemo(() => {\n    return staffMenuGroups.map(group => {\n      const filteredItems = group.items.filter(item => {\n        if (group.title === 'การจัดการระบบ' && userRole !== 'DEVELOPER') return false;\n        if (isClinicOwnerOrFullAccess) return true;`;
content = content.replace(oldStaffFilter, newStaffFilter);

// 8. Fix dependency array for filteredStaffMenuGroups
const oldStaffDep = `  }, [staffMenuGroups, isClinicOwnerOrFullAccess, staffPermissions]);`;
const newStaffDep = `  }, [staffMenuGroups, isClinicOwnerOrFullAccess, staffPermissions, userRole]);`;
content = content.replace(oldStaffDep, newStaffDep);

fs.writeFileSync('src/App.tsx', content);
console.log('Patched');
