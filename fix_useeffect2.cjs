const fs = require('fs');
let content = fs.readFileSync('src/App.tsx.recovered2', 'utf8');

const target = "||    if (!isOwner) {";
if (content.includes(target)) {
    content = content.replace(target, `

  // Guard System Management and Settings Panel access to OWNER only
  useEffect(() => {
    const isOwner = userRole === 'DEVELOPER' || userRole === 'CLINIC_OWNER' || userRole === 'ADMIN' || userRole === 'DOCTOR';
    if (!isOwner) {`);
    fs.writeFileSync('src/App.tsx.recovered3', content);
    console.log('Fixed');
} else {
    console.log('Not found');
}
