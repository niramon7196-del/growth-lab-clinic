const fs = require('fs');
let content = fs.readFileSync('src/App.tsx.recovered2', 'utf8');

const target = "]);\n\n||\n    if (!isOwner) {";
if (content.includes(target)) {
    content = content.replace(target, `]);\n\n  // Guard System Management and Settings Panel access to OWNER only\n  useEffect(() => {\n    const isOwner = userRole === 'DEVELOPER' || userRole === 'CLINIC_OWNER' || userRole === 'ADMIN' || userRole === 'DOCTOR';\n    if (!isOwner) {`);
    fs.writeFileSync('src/App.tsx.recovered3', content);
    console.log('Fixed');
} else {
    console.log('Not found');
}
