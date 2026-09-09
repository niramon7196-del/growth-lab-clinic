const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');
const badStr = "  // Guard System Management and Settings Panel access to OWNER only\n  useEffect(() => {\n    const isOwner = userRole === 'DEVELOPER' || userRole === 'CLINIC_OWNER' || userRole === 'ADMIN' || userRole === 'DOCTOR';";

// Replace all occurrences of badStr with empty string
let recovered = content.split(badStr).join('');
fs.writeFileSync('src/App.tsx.recovered', recovered);
console.log('Recovered file length:', recovered.length);
