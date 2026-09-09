perl -0777 -pi -e 's/  const handleGearClick = \(\) => \{\n    if \(userRole === '\''DEVELOPER'\''\) \{\n      setShowSystemManager\(true\);\n    \} else \{\n      setShowAdminLoginModal\(false\);\n      setShowAccessDenied\(true\);\n    \}\n  \};/  const handleGearClick = () => {\n    if (userRole === '\''DEVELOPER'\'' || userRole === '\''ADMIN'\'' || userRole === '\''DOCTOR'\'' || userRole === '\''CLINIC_OWNER'\'') {\n      setShowSystemManager(true);\n    } else {\n      setShowAdminLoginModal(false);\n      setShowAccessDenied(true);\n    }\n  };/g' src/App.tsx

perl -0777 -pi -e 's/  \/\/ Guard System Management and Settings Panel access to OWNER only\n  useEffect\(\(\) => \{\n    const isOwner = userRole === '\''DEVELOPER'\'' || userRole === '\''CLINIC_OWNER'\'';/  \/\/ Guard System Management and Settings Panel access to OWNER only\n  useEffect(() => {\n    const isOwner = userRole === '\''DEVELOPER'\'' || userRole === '\''CLINIC_OWNER'\'' || userRole === '\''ADMIN'\'' || userRole === '\''DOCTOR'\'';/g' src/App.tsx

perl -0777 -pi -e 's/ส่วนการจัดการระบบสงวนไว้สำหรับผู้พัฒนาระบบ \(SYSTEM_DEVELOPER\) เท่านั้น/ส่วนการจัดการระบบสงวนไว้สำหรับบุคลากรทางการแพทย์และผู้พัฒนาระบบเท่านั้น/g' src/App.tsx

perl -0777 -pi -e 's/\{showSystemManager && \(userRole === '\''ADMIN'\'' \|\| userRole === '\''DEVELOPER'\''\) && \(/\{showSystemManager \&\& \(userRole === '\''DEVELOPER'\'' \|\| userRole === '\''CLINIC_OWNER'\'' \|\| userRole === '\''ADMIN'\'' \|\| userRole === '\''DOCTOR'\''\) \&\& \(/g' src/App.tsx

