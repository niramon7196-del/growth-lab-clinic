const fs = require('fs');
let content = fs.readFileSync('src/App.tsx.recovered2', 'utf8');

content = content.replace('||    if (!isOwner) {', `

  // Guard System Management and Settings Panel access to OWNER only
  useEffect(() => {
    const isOwner = userRole === 'DEVELOPER' || userRole === 'CLINIC_OWNER' || userRole === 'ADMIN' || userRole === 'DOCTOR';
    if (!isOwner) {`);

fs.writeFileSync('src/App.tsx.recovered3', content);
